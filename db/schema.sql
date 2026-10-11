-- =====================================================================
--  İnşa Hukuk ve Arabuluculuk — veri modeli (PostgreSQL 16+, Directus 12)
--
--  Kurulum sırası
--   1. Boş veritabanı:     createdb insa
--   2. Directus tabloları: npx directus bootstrap   (directus_users, directus_files ... oluşur)
--   3. Bu dosya:           psql -X -v ON_ERROR_STOP=1 -d insa -f db/schema.sql
--   4. İstenen modüller:   psql ... -f db/moduller/<modul>.sql
--   5. Directus'u yeniden başlatın (yeni tabloları görsün).
--  Testler Directus olmadan çalışır: db/test/directus_taslak.sql yalnızca iki tabloyu taklit eder.
--
--  Temel kararlar
--   * Adlandırma: Türkçe, yalnızca ASCII, snake_case, tekil tablo adı (kisi, yayin, karar).
--   * Directus uyumu: her tabloda tek sütunlu birincil anahtar (id); enum ve domain yok
--     (Directus bunları "unknown" gösteriyor), bunların yerine text + CHECK.
--     Kullanıcı, oturum, dosya ve değişiklik kaydı Directus'un kendi tablolarında:
--     directus_users, directus_sessions, directus_files, directus_activity/directus_revisions.
--   * Çok dillilik: dile bağlı metin <tablo>_ceviri tablosunda, UNIQUE (<tablo>_id, dil).
--     Yayında/görünür her kaydın varsayılan dilde (tr) çevirisi olmak zorunda; COMMIT anında
--     ertelenmiş kısıt tetikleyicisi denetler (Directus iç içe kaydı tek işlemde yazar).
--     Karar modülü yalnızca Türkçe.
--   * Zengin metin: HTML (text). Directus'un zengin metin editörü yazar; Astro derlerken temizler.
--   * Türkçe sıralama: ad/başlık sütunları COLLATE "tr-x-icu"; veritabanı hangi yerelle kurulursa
--     kurulsun Ç, Ğ, İ, Ö, Ş, Ü doğru yerde sıralanır.
--   * Silme: ara tablolar sahibinden CASCADE; sözlük tarafı (çalışma alanı, etiket, mevzuat)
--     NO ACTION: kullanımdaki kayıt silinemez, gizlenir. Dosya silinirse bağlantı NULL olur.
--   * Şemalar: public = Directus'un yönettiği tablolar · ic = Directus'un görmediği yardımcılar.
-- =====================================================================

BEGIN;

CREATE SCHEMA ic;
COMMENT ON SCHEMA ic IS 'Directus''un görmediği yardımcı tablo ve fonksiyonlar';


-- ---------------------------------------------------------------------
-- 0. Doğrulama fonksiyonları (CHECK kısıtlarında kullanılır)
-- ---------------------------------------------------------------------

-- URL parçası: küçük harf ASCII, rakam, tek tire
CREATE FUNCTION ic.slug_gecerli(x text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT x ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(x) <= 120
$$;

-- Yalnızca küçük harfli, boşluksuz ASCII. lower() Türkçe yerelde I -> ı yaptığı için uygulama
-- e-postayı yerelden bağımsız toLowerCase() ile normalleştirir; veritabanı başka biçimi reddeder.
CREATE FUNCTION ic.eposta_gecerli(x text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT x ~ '^[!-~]+$' AND x !~ '[A-Z]'
     AND x ~ '^[^@]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$' AND length(x) <= 254
$$;

-- E.164 telefon: +905321234567 (görüntü biçimi ön yüzde)
CREATE FUNCTION ic.telefon_gecerli(x text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT x ~ '^\+[1-9][0-9]{7,14}$'
$$;

CREATE FUNCTION ic.https_url_gecerli(x text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT x ~ '^https://[a-z0-9.-]+(:[0-9]+)?(/[^\s]*)?$' AND length(x) <= 2000
$$;

-- Site içi yol (/...) ya da https bağlantısı. '//evil', '/\evil', sekme/boşluk reddedilir:
-- tarayıcı bunları başka bir alan adına giden bağlantı sayar.
CREATE FUNCTION ic.baglanti_gecerli(x text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT x ~ '^(/($|[^/])|https://)' AND x !~ '[\s\\]' AND length(x) <= 2000
$$;

-- ISBN-10 / ISBN-13 (yalnızca 978/979 önekli) sağlama toplamı; tire ve boşluk temizlenmiş değer
CREATE FUNCTION ic.isbn_gecerli(isbn text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  toplam int := 0;
BEGIN
  IF isbn ~ '^97[89][0-9]{10}$' THEN
    FOR i IN 1..13 LOOP
      toplam := toplam + substr(isbn, i, 1)::int * CASE WHEN i % 2 = 1 THEN 1 ELSE 3 END;
    END LOOP;
    RETURN toplam % 10 = 0;
  ELSIF isbn ~ '^[0-9]{9}[0-9X]$' THEN
    FOR i IN 1..10 LOOP
      toplam := toplam + (11 - i) * CASE WHEN substr(isbn, i, 1) = 'X' THEN 10 ELSE substr(isbn, i, 1)::int END;
    END LOOP;
    RETURN toplam % 11 = 0;
  END IF;
  RETURN false;
END $$;

-- Türkçe başlıktan slug: 'Şirketler & İmar Hukuku' -> 'sirketler-imar-hukuku'.
-- NFD + birleşik işaretleri atma: ş, é, ñ ve JS'in 'İ'.toLowerCase() çıktısı (i + U+0307) da çözülür.
CREATE FUNCTION ic.slug_tr(girdi text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT NULLIF(trim(BOTH '-' FROM left(
           regexp_replace(
             lower(regexp_replace(normalize(translate(girdi, 'ı', 'i'), NFD), '[̀-ͯ]', '', 'g') COLLATE "C"),
             '[^a-z0-9]+', '-', 'g'),
           120)), '')
$$;


-- ---------------------------------------------------------------------
-- 1. Diller
-- ---------------------------------------------------------------------

CREATE TABLE dil (
  kod         text PRIMARY KEY CHECK (kod ~ '^[a-z]{2}(-[a-z]{2})?$'),
  ad          text NOT NULL,
  varsayilan  boolean NOT NULL DEFAULT false,
  aktif       boolean NOT NULL DEFAULT true,
  siralama    smallint NOT NULL DEFAULT 0,
  CHECK (NOT varsayilan OR aktif),
  -- en fazla bir varsayılan dil; ertelenmiş: varsayılanı tek ifadede değiştirmek satır sırasından bağımsız
  CONSTRAINT dil_tek_varsayilan EXCLUDE USING btree (varsayilan WITH =) WHERE (varsayilan)
    DEFERRABLE INITIALLY DEFERRED
);
COMMENT ON TABLE dil IS 'Sitenin dilleri; Directus çeviri arayüzü bu tabloyu dil listesi olarak kullanır';

CREATE FUNCTION ic.varsayilan_dil() RETURNS text
LANGUAGE sql STABLE PARALLEL SAFE AS $$ SELECT kod FROM public.dil WHERE varsayilan $$;

INSERT INTO dil (kod, ad, varsayilan, siralama) VALUES ('tr', 'Türkçe', true, 1), ('en', 'English', false, 2);


-- ---------------------------------------------------------------------
-- 2. Çalışma alanları — iki seviyeli ağaç (Kamu hukuku > Ceza, İmar)
-- ---------------------------------------------------------------------

CREATE TABLE calisma_alani (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ust_alan_id        integer REFERENCES calisma_alani(id),        -- NULL = üst alan
  siralama           smallint NOT NULL DEFAULT 0,
  gorsel             uuid REFERENCES directus_files(id) ON DELETE SET NULL,
  gorunur            boolean NOT NULL DEFAULT true,               -- silmek yerine gizlenir
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (ust_alan_id <> id)
);
CREATE INDEX calisma_alani_ust_idx ON calisma_alani (ust_alan_id, siralama);

CREATE TABLE calisma_alani_ceviri (
  id                integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  calisma_alani_id  integer NOT NULL REFERENCES calisma_alani(id) ON DELETE CASCADE,
  dil               text NOT NULL REFERENCES dil(kod),
  slug              text NOT NULL CHECK (ic.slug_gecerli(slug)),
  ad                text COLLATE "tr-x-icu" NOT NULL CHECK (length(ad) <= 120),
  ozet              text CHECK (length(ozet) <= 300),             -- kartta görünen tek cümle
  icerik            text,                                         -- alanın kendi sayfası (HTML)
  seo_baslik        text CHECK (length(seo_baslik) <= 70),
  seo_aciklama      text CHECK (length(seo_aciklama) <= 170),
  UNIQUE (calisma_alani_id, dil),
  UNIQUE (dil, slug)
);


-- ---------------------------------------------------------------------
-- 3. Ekip: unvan, kişi, telefon, eğitim, deneyim
-- ---------------------------------------------------------------------

CREATE TABLE unvan (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kod                text NOT NULL UNIQUE CHECK (ic.slug_gecerli(kod)),   -- 'kurucu-ortak', 'avukat'
  sira               smallint NOT NULL,                                    -- ekip sayfasındaki sıra
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unvan_sira_tekil UNIQUE (sira) DEFERRABLE INITIALLY DEFERRED     -- sıra takası tek işlemde
);
CREATE TABLE unvan_ceviri (
  id        integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  unvan_id  integer NOT NULL REFERENCES unvan(id) ON DELETE CASCADE,
  dil       text NOT NULL REFERENCES dil(kod),
  ad        text COLLATE "tr-x-icu" NOT NULL CHECK (length(ad) <= 80),     -- "Kurucu Ortak" / "Founding Partner"
  UNIQUE (unvan_id, dil)
);

CREATE TABLE kisi (
  id                  integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  slug                text NOT NULL UNIQUE CHECK (ic.slug_gecerli(slug)),  -- /ekip/{slug}; ad dile göre değişmez
  ad                  text COLLATE "tr-x-icu" NOT NULL,
  soyad               text COLLATE "tr-x-icu" NOT NULL,
  unvan_id            integer REFERENCES unvan(id),
  foto                uuid REFERENCES directus_files(id) ON DELETE SET NULL,
  eposta              text UNIQUE CHECK (ic.eposta_gecerli(eposta)),
  avukat_mi           boolean NOT NULL DEFAULT false,      -- aynı kişi hem avukat hem arabulucu olabilir
  arabulucu_mu        boolean NOT NULL DEFAULT false,
  baro_adi            text COLLATE "tr-x-icu",
  baro_sicil_no       text CHECK (baro_sicil_no ~ '^[0-9]{1,8}$'),
  arabulucu_sicil_no  text CHECK (arabulucu_sicil_no ~ '^[0-9]{1,8}$'),
  linkedin_url        text CHECK (ic.https_url_gecerli(linkedin_url)),
  -- Panel hesabı: "avukat yalnızca kendi profilini/içeriğini düzenler" yetkisi bu bağla kurulur
  kullanici           uuid UNIQUE REFERENCES directus_users(id) ON DELETE SET NULL,
  aktif               boolean NOT NULL DEFAULT true,       -- ayrılanlar silinmez, aktif=false
  siralama            smallint NOT NULL DEFAULT 0,         -- aynı unvan içinde sıra
  olusturma_zamani    timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani   timestamptz NOT NULL DEFAULT now(),
  CHECK (baro_sicil_no IS NULL OR (avukat_mi AND baro_adi IS NOT NULL)),
  CHECK (arabulucu_sicil_no IS NULL OR arabulucu_mu)
);
CREATE INDEX kisi_unvan_idx ON kisi (unvan_id);
CREATE INDEX kisi_ekip_sirasi_idx ON kisi (siralama, soyad, ad) WHERE aktif;

CREATE TABLE kisi_ceviri (
  id               integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kisi_id          integer NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  dil              text NOT NULL REFERENCES dil(kod),
  kisa_biyografi   text CHECK (length(kisa_biyografi) <= 300),
  biyografi        text,                                     -- HTML
  seo_baslik       text CHECK (length(seo_baslik) <= 70),
  seo_aciklama     text CHECK (length(seo_aciklama) <= 170),
  UNIQUE (kisi_id, dil)
);

CREATE TABLE kisi_telefon (
  id             integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kisi_id        integer NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  tur            text NOT NULL CHECK (tur IN ('dahili', 'cep', 'sabit')),
  numara         text NOT NULL,
  sitede_goster  boolean NOT NULL DEFAULT false,              -- KVKK: kişisel cep varsayılan gizli
  sira           smallint NOT NULL DEFAULT 0,
  UNIQUE (kisi_id, tur, numara),
  CHECK (CASE WHEN tur = 'dahili' THEN numara ~ '^[0-9]{2,6}$' ELSE ic.telefon_gecerli(numara) END)
);
CREATE INDEX kisi_telefon_kisi_idx ON kisi_telefon (kisi_id);

CREATE TABLE kisi_calisma_alani (
  id                integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kisi_id           integer NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  calisma_alani_id  integer NOT NULL REFERENCES calisma_alani(id),
  UNIQUE (kisi_id, calisma_alani_id)
);
CREATE INDEX kisi_calisma_alani_alan_idx ON kisi_calisma_alani (calisma_alani_id);

CREATE TABLE egitim (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kisi_id            integer NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  baslangic_yili     smallint CHECK (baslangic_yili BETWEEN 1900 AND 2100),
  bitis_yili         smallint CHECK (bitis_yili BETWEEN 1900 AND 2100),
  sira               smallint NOT NULL DEFAULT 0,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (bitis_yili IS NULL OR baslangic_yili IS NULL OR bitis_yili >= baslangic_yili)
);
CREATE INDEX egitim_kisi_idx ON egitim (kisi_id, sira);
CREATE TABLE egitim_ceviri (
  id         integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  egitim_id  integer NOT NULL REFERENCES egitim(id) ON DELETE CASCADE,
  dil        text NOT NULL REFERENCES dil(kod),
  okul_adi   text COLLATE "tr-x-icu" NOT NULL,               -- serbest metin (okul listesi istenmedi)
  bolum_adi  text COLLATE "tr-x-icu",
  derece     text,                                           -- "Lisans", "Yüksek Lisans", "LL.M."
  UNIQUE (egitim_id, dil)
);

CREATE TABLE deneyim (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kisi_id            integer NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  firma_adi          text COLLATE "tr-x-icu" NOT NULL,        -- düz metin; logo yok (reklam yasağı, bkz. VERI_MODELI.md)
  baslangic_yili     smallint CHECK (baslangic_yili BETWEEN 1900 AND 2100),
  bitis_yili         smallint CHECK (bitis_yili BETWEEN 1900 AND 2100),   -- NULL = halen
  sira               smallint NOT NULL DEFAULT 0,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (bitis_yili IS NULL OR baslangic_yili IS NULL OR bitis_yili >= baslangic_yili)
);
CREATE INDEX deneyim_kisi_idx ON deneyim (kisi_id, sira);
CREATE TABLE deneyim_ceviri (
  id          integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  deneyim_id  integer NOT NULL REFERENCES deneyim(id) ON DELETE CASCADE,
  dil         text NOT NULL REFERENCES dil(kod),
  pozisyon    text COLLATE "tr-x-icu" NOT NULL,
  aciklama    text,
  UNIQUE (deneyim_id, dil)
);


-- ---------------------------------------------------------------------
-- 4. Etiketler
-- ---------------------------------------------------------------------

CREATE TABLE etiket (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE etiket_ceviri (
  id         integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  etiket_id  integer NOT NULL REFERENCES etiket(id) ON DELETE CASCADE,
  dil        text NOT NULL REFERENCES dil(kod),
  slug       text NOT NULL CHECK (ic.slug_gecerli(slug)),
  ad         text COLLATE "tr-x-icu" NOT NULL CHECK (length(ad) <= 60),
  UNIQUE (etiket_id, dil),
  UNIQUE (dil, slug)
);


-- ---------------------------------------------------------------------
-- 5. Yayınlar: makale, kitap, video, haber, duyuru — tek tablo + tur
-- ---------------------------------------------------------------------

CREATE TABLE yayin (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tur                text NOT NULL CHECK (tur IN ('makale', 'kitap', 'video', 'haber', 'duyuru')),
  -- incelemede: yazar onaya gönderdi · yayinda: sitede · arsiv: siteden kaldırıldı
  durum              text NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'incelemede', 'yayinda', 'arsiv')),
  yayin_tarihi       timestamptz,                         -- ileri tarih = zamanlanmış yayın
  kapak              uuid REFERENCES directus_files(id) ON DELETE SET NULL,
  -- kitap
  yayinevi           text COLLATE "tr-x-icu",
  isbn               text CHECK (ic.isbn_gecerli(isbn)),  -- tiresiz: 9786051234567
  basim_yili         smallint CHECK (basim_yili BETWEEN 1900 AND 2100),
  sayfa_sayisi       smallint CHECK (sayfa_sayisi > 0),
  -- video: dış bağlantı (YouTube = yurt dışı aktarım + çerez; tıkla-yükle) ya da kendi dosyası
  video_url          text CHECK (ic.https_url_gecerli(video_url)),
  video_dosyasi      uuid REFERENCES directus_files(id) ON DELETE SET NULL,
  -- haber: başka mecrada çıkan haber/röportaj
  kaynak_adi         text COLLATE "tr-x-icu",
  kaynak_url         text CHECK (ic.https_url_gecerli(kaynak_url)),
  -- SEO
  noindex            boolean NOT NULL DEFAULT false,
  kanonik_url        text CHECK (ic.https_url_gecerli(kanonik_url)),
  -- sahiplik ve onay: olusturan Directus'ta "user_created"; onaylayan yayına alan kullanıcı
  -- (Directus akışı doldurur; kimin onaylayabileceği Directus yetkileriyle belirlenir)
  olusturan          uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  guncelleyen        uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  onaylayan          uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  onay_zamani        timestamptz,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (durum <> 'yayinda' OR (yayin_tarihi IS NOT NULL AND onay_zamani IS NOT NULL)),
  CHECK (onaylayan IS NULL OR onay_zamani IS NOT NULL),
  CHECK (tur = 'kitap' OR num_nonnulls(yayinevi, isbn, basim_yili, sayfa_sayisi) = 0),
  CHECK (CASE WHEN tur = 'video' THEN num_nonnulls(video_url, video_dosyasi) = 1
              ELSE num_nonnulls(video_url, video_dosyasi) = 0 END),
  CHECK (tur = 'haber' OR num_nonnulls(kaynak_adi, kaynak_url) = 0)
);
CREATE INDEX yayin_yayinda_idx  ON yayin (tur, yayin_tarihi DESC) WHERE durum = 'yayinda';
CREATE INDEX yayin_olusturan_idx ON yayin (olusturan);

CREATE TABLE yayin_ceviri (
  id            integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  yayin_id      integer NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  dil           text NOT NULL REFERENCES dil(kod),
  hazir         boolean NOT NULL DEFAULT true,            -- false: çeviri sürüyor, sitede gösterme
  slug          text NOT NULL CHECK (ic.slug_gecerli(slug)),
  baslik        text COLLATE "tr-x-icu" NOT NULL CHECK (length(baslik) <= 300),
  ozet          text CHECK (length(ozet) <= 1000),
  icerik        text,                                     -- HTML; kitap/video için boş olabilir
  seo_baslik    text CHECK (length(seo_baslik) <= 70),
  seo_aciklama  text CHECK (length(seo_aciklama) <= 170),
  paylasim_gorseli uuid REFERENCES directus_files(id) ON DELETE SET NULL,  -- 1200x630 (og:image)
  UNIQUE (yayin_id, dil),
  UNIQUE (dil, slug)
);

-- Çok yazarlı yayın; dış yazar kisi tablosuna girmez (ekip sayfasında görünmesin)
CREATE TABLE yayin_yazar (
  id               integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  yayin_id         integer NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  kisi_id          integer REFERENCES kisi(id),
  dis_yazar_adi    text COLLATE "tr-x-icu",
  dis_yazar_unvan  text,                                  -- "Prof. Dr., X Üniversitesi"
  sira             smallint NOT NULL DEFAULT 0,
  CHECK (num_nonnulls(kisi_id, dis_yazar_adi) = 1),
  CHECK (dis_yazar_unvan IS NULL OR dis_yazar_adi IS NOT NULL),
  UNIQUE (yayin_id, kisi_id),
  CONSTRAINT yayin_yazar_sira_tekil UNIQUE (yayin_id, sira) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX yayin_yazar_kisi_idx ON yayin_yazar (kisi_id);

CREATE TABLE yayin_calisma_alani (
  id                integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  yayin_id          integer NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  calisma_alani_id  integer NOT NULL REFERENCES calisma_alani(id),
  UNIQUE (yayin_id, calisma_alani_id)
);
CREATE INDEX yayin_calisma_alani_alan_idx ON yayin_calisma_alani (calisma_alani_id);

CREATE TABLE yayin_etiket (
  id         integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  yayin_id   integer NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  etiket_id  integer NOT NULL REFERENCES etiket(id),
  UNIQUE (yayin_id, etiket_id)
);
CREATE INDEX yayin_etiket_etiket_idx ON yayin_etiket (etiket_id);

-- Yayına eklenen dosyalar (PDF vb.); dosya silinirse ek bağlantısı da gider
CREATE TABLE yayin_dosya (
  id        integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  yayin_id  integer NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  dosya     uuid NOT NULL REFERENCES directus_files(id) ON DELETE CASCADE,
  sira      smallint NOT NULL DEFAULT 0,
  UNIQUE (yayin_id, dosya)
);
CREATE INDEX yayin_dosya_dosya_idx ON yayin_dosya (dosya);


-- ---------------------------------------------------------------------
-- 6. Kararlar — yalnızca Türkçe. Alanlar büroyla netleşecek (Açık Sorular 29-36).
-- ---------------------------------------------------------------------

-- Mahkeme > daire (iki seviye): "Yargıtay" > "3. Hukuk Dairesi"
CREATE TABLE mahkeme (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ust_mahkeme_id     integer REFERENCES mahkeme(id),
  tur                text NOT NULL CHECK (tur IN ('aym', 'yargitay', 'danistay', 'bam', 'bim', 'ilk_derece_adli',
                                                   'ilk_derece_idari', 'uyusmazlik', 'aihm', 'diger')),
  ad                 text COLLATE "tr-x-icu" NOT NULL,      -- "Yargıtay" / "3. Hukuk Dairesi"
  kisa_ad            text,                                  -- "Y. 3. HD"
  siralama           smallint NOT NULL DEFAULT 0,
  aktif              boolean NOT NULL DEFAULT true,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (ust_mahkeme_id, ad),           -- kökte ikinci "Yargıtay" olamaz
  CHECK (ust_mahkeme_id <> id)
);
CREATE INDEX mahkeme_ust_idx ON mahkeme (ust_mahkeme_id);

CREATE TABLE mevzuat (
  id                    integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tur                   text NOT NULL CHECK (tur IN ('kanun', 'khk', 'cbk', 'tuzuk', 'yonetmelik',
                                                    'teblig', 'uluslararasi', 'diger')),
  numara                text,                                -- '6098'; yönetmeliklerde çoğu zaman yok
  ad                    text COLLATE "tr-x-icu" NOT NULL,    -- 'Türk Borçlar Kanunu'
  kisa_ad               text,                                -- 'TBK'
  resmi_gazete_tarihi   date,
  mevzuat_url           text CHECK (ic.https_url_gecerli(mevzuat_url)),
  olusturma_zamani      timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tur, numara)          -- bilerek NULLS DISTINCT: numarasız birden çok yönetmelik olabilir
);

CREATE TABLE karar (
  id                     integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  mahkeme_id             integer NOT NULL REFERENCES mahkeme(id),   -- daire de seçilebilir
  esas_no                text CHECK (esas_no  ~ '^[0-9]{4}/[0-9]{1,7}$'),
  karar_no               text CHECK (karar_no ~ '^[0-9]{4}/[0-9]{1,7}$'),
  karar_tarihi           date NOT NULL CHECK (karar_tarihi >= DATE '1920-01-01'),
  slug                   text NOT NULL UNIQUE CHECK (ic.slug_gecerli(slug)),   -- 'yargitay-3-hd-e-2024-1234-k-2025-567'
  konu                   text COLLATE "tr-x-icu" NOT NULL,
  ozet                   text,
  tam_metin              text,                              -- anonimleştirilmiş metin (HTML)
  tam_metin_dosyasi      uuid REFERENCES directus_files(id) ON DELETE SET NULL,  -- PDF/UDF (metin mi dosya mı?)
  ofis_davasi            boolean NOT NULL DEFAULT false,    -- yalnızca iç bilgi; sitede gösterilmez
  -- KVKK kapısı: anonimleştirildiği işaretlenmeden ve onaysız karar yayına alınamaz
  anonimlestirildi       boolean NOT NULL DEFAULT false,
  anonimlestiren         uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  anonimlestirme_zamani  timestamptz,
  durum                  text NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'incelemede', 'yayinda', 'arsiv')),
  yayin_tarihi           timestamptz,
  olusturan              uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  guncelleyen            uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  onaylayan              uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  onay_zamani            timestamptz,
  olusturma_zamani       timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mahkeme_id, karar_no),
  CHECK (durum <> 'yayinda' OR (yayin_tarihi IS NOT NULL AND anonimlestirildi AND onay_zamani IS NOT NULL)),
  CHECK (anonimlestirildi = (anonimlestirme_zamani IS NOT NULL)),
  CHECK (onaylayan IS NULL OR onay_zamani IS NOT NULL)
);
CREATE INDEX karar_mahkeme_idx ON karar (mahkeme_id, karar_tarihi DESC);
CREATE INDEX karar_tarih_idx   ON karar (karar_tarihi DESC) WHERE durum = 'yayinda';

-- Türkçe tam metin arama: sütun yerine ifade indeksi (Directus tsvector sütununu tanımıyor)
CREATE FUNCTION ic.karar_vektoru(konu text, ozet text, tam_metin text) RETURNS tsvector
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT setweight(to_tsvector('turkish'::regconfig, coalesce(konu, '')), 'A') ||
         setweight(to_tsvector('turkish'::regconfig, coalesce(ozet, '')), 'B') ||
         setweight(to_tsvector('turkish'::regconfig, coalesce(tam_metin, '')), 'C')
$$;
CREATE INDEX karar_arama_idx ON karar USING gin (ic.karar_vektoru(konu, ozet, tam_metin));

-- Yayındaki kararlarda arama: SELECT * FROM ic.karar_ara('kiracı tespit');
CREATE FUNCTION ic.karar_ara(sorgu text) RETURNS TABLE (karar_id integer, skor real)
LANGUAGE sql STABLE AS $$
  SELECT k.id, ts_rank(ic.karar_vektoru(k.konu, k.ozet, k.tam_metin), q)
  FROM public.karar k, websearch_to_tsquery('turkish'::regconfig, sorgu) q
  WHERE k.durum = 'yayinda' AND ic.karar_vektoru(k.konu, k.ozet, k.tam_metin) @@ q
  ORDER BY 2 DESC, k.karar_tarihi DESC
$$;

CREATE TABLE karar_mevzuat (
  id          integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  karar_id    integer NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  mevzuat_id  integer NOT NULL REFERENCES mevzuat(id),
  madde       text CHECK (length(madde) <= 30),             -- '49', '49/2', 'geçici 1'; NULL = kanunun bütünü
  UNIQUE NULLS NOT DISTINCT (karar_id, mevzuat_id, madde)
);
CREATE INDEX karar_mevzuat_mevzuat_idx ON karar_mevzuat (mevzuat_id);

CREATE TABLE karar_etiket (
  id         integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  karar_id   integer NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  etiket_id  integer NOT NULL REFERENCES etiket(id),
  UNIQUE (karar_id, etiket_id)
);
CREATE INDEX karar_etiket_etiket_idx ON karar_etiket (etiket_id);

CREATE TABLE karar_calisma_alani (
  id                integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  karar_id          integer NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  calisma_alani_id  integer NOT NULL REFERENCES calisma_alani(id),
  UNIQUE (karar_id, calisma_alani_id)
);
CREATE INDEX karar_calisma_alani_alan_idx ON karar_calisma_alani (calisma_alani_id);

-- Makale <-> karar karşılıklı bağlantı
CREATE TABLE yayin_karar (
  id        integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  yayin_id  integer NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  karar_id  integer NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  UNIQUE (yayin_id, karar_id)
);
CREATE INDEX yayin_karar_karar_idx ON yayin_karar (karar_id);


-- ---------------------------------------------------------------------
-- 7. Sabit sayfalar (Hakkımızda, Arabuluculuk, KVKK, çerez, yasal uyarı ...)
-- ---------------------------------------------------------------------

CREATE TABLE sayfa (
  id                 integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  anahtar            text NOT NULL UNIQUE CHECK (anahtar ~ '^[a-z0-9_]+$'),   -- 'ana_sayfa', 'hakkimizda', 'kvkk'
  aktif              boolean NOT NULL DEFAULT true,
  noindex            boolean NOT NULL DEFAULT false,
  siralama           smallint NOT NULL DEFAULT 0,
  olusturan          uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  guncelleyen        uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sayfa_ceviri (
  id            integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  sayfa_id      integer NOT NULL REFERENCES sayfa(id) ON DELETE CASCADE,
  dil           text NOT NULL REFERENCES dil(kod),
  slug          text CHECK (ic.slug_gecerli(slug)),          -- ana sayfa için NULL
  baslik        text COLLATE "tr-x-icu" NOT NULL,
  icerik        text,                                        -- HTML
  seo_baslik    text CHECK (length(seo_baslik) <= 70),
  seo_aciklama  text CHECK (length(seo_aciklama) <= 170),
  paylasim_gorseli uuid REFERENCES directus_files(id) ON DELETE SET NULL,
  UNIQUE (sayfa_id, dil),
  UNIQUE NULLS NOT DISTINCT (dil, slug)                      -- her dilde tek bir kök (slug NULL) sayfa
);


-- ---------------------------------------------------------------------
-- 8. Site ayarları — tek satırlık tablo (Directus'ta "singleton")
-- ---------------------------------------------------------------------

CREATE TABLE site_ayar (
  id                 smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  resmi_unvan        text COLLATE "tr-x-icu" NOT NULL,       -- baroya kayıtlı unvan; başlık ve künyede aynen
  telefon            text CHECK (ic.telefon_gecerli(telefon)),
  faks               text CHECK (ic.telefon_gecerli(faks)),
  eposta             text CHECK (ic.eposta_gecerli(eposta)),
  whatsapp_numarasi  text CHECK (ic.telefon_gecerli(whatsapp_numarasi)),   -- düz wa.me bağlantısı; widget yok
  linkedin_url       text CHECK (ic.https_url_gecerli(linkedin_url)),
  instagram_url      text CHECK (ic.https_url_gecerli(instagram_url)),
  youtube_url        text CHECK (ic.https_url_gecerli(youtube_url)),
  x_url              text CHECK (ic.https_url_gecerli(x_url)),
  harita_url         text CHECK (ic.https_url_gecerli(harita_url)),       -- "Haritada aç" bağlantısı (iframe yok)
  aydinlatma_surumu  text,                                    -- iletişim formunda gösterilen metnin sürümü
  guncelleyen        uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE site_ayar_ceviri (
  id               integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  site_ayar_id     smallint NOT NULL REFERENCES site_ayar(id) ON DELETE CASCADE,
  dil              text NOT NULL REFERENCES dil(kod),
  adres            text,
  alt_bilgi_notu   text,                                     -- "Bu site bilgilendirme amaçlıdır ..."
  UNIQUE (site_ayar_id, dil)
);


-- ---------------------------------------------------------------------
-- 9. İletişim mesajları (saklama süreli). Directus'ta bu koleksiyonun değişiklik kaydı
--    (accountability) kapatılmalı; aksi halde mesajın kopyası directus_revisions'da kalır.
-- ---------------------------------------------------------------------

CREATE TABLE iletisim_mesaji (
  id                   integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ad                   text COLLATE "tr-x-icu" NOT NULL CHECK (length(ad) <= 120),
  eposta               text NOT NULL CHECK (ic.eposta_gecerli(eposta)),
  telefon              text CHECK (ic.telefon_gecerli(telefon)),
  konu_turu            text NOT NULL CHECK (konu_turu IN ('genel', 'randevu', 'arabuluculuk', 'diger')),
  mesaj                text NOT NULL CHECK (length(mesaj) BETWEEN 1 AND 5000),
  durum                text NOT NULL DEFAULT 'yeni' CHECK (durum IN ('yeni', 'okundu', 'cevaplandi', 'spam')),
  cevaplayan_kisi_id   integer REFERENCES kisi(id),
  cevap_tarihi         timestamptz,
  -- "kvkk_onay" yerine gösterilen aydınlatma metninin sürümü: aydınlatma rıza değildir (2026/347)
  aydinlatma_surumu    text NOT NULL,
  ip_hmac              text CHECK (ip_hmac ~ '^[0-9a-f]{64}$'),   -- HMAC-SHA256(ip), onaltılık; yalnızca spam sınırı. Düz sha256(ip) DEĞİL
  olusturma_zamani     timestamptz NOT NULL DEFAULT now(),
  saklama_bitis        timestamptz NOT NULL DEFAULT now() + interval '1 year',   -- süre büroyla belirlenecek
  CHECK (saklama_bitis > olusturma_zamani),
  CHECK (durum <> 'cevaplandi' OR (cevaplayan_kisi_id IS NOT NULL AND cevap_tarihi IS NOT NULL))
);
CREATE INDEX iletisim_mesaji_durum_idx   ON iletisim_mesaji (durum, olusturma_zamani DESC);
CREATE INDEX iletisim_mesaji_saklama_idx ON iletisim_mesaji (saklama_bitis);


-- ---------------------------------------------------------------------
-- 10. Yönlendirmeler ve derleme kuyruğu
-- ---------------------------------------------------------------------

CREATE TABLE yonlendirme (
  id                integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kaynak_yol        text NOT NULL UNIQUE CHECK (kaynak_yol ~ '^/($|[^/])' AND kaynak_yol !~ '[\s\\]'),
  hedef             text NOT NULL CHECK (ic.baglanti_gecerli(hedef)),
  durum_kodu        smallint NOT NULL DEFAULT 301 CHECK (durum_kodu IN (301, 302, 308)),
  olusturma_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (kaynak_yol <> hedef)
);
-- Zincir ve döngü engeli: hedef başka bir yönlendirmenin kaynağı olamaz (ve tersi).
-- Kilit: eşzamanlı iki işlem birbirinin kaydını göremezdi (/a->/b ve /b->/a ikisi de geçerdi).
CREATE FUNCTION ic.yonlendirme_zincir_kontrol() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(TG_RELID::bigint);
  IF EXISTS (SELECT 1 FROM public.yonlendirme WHERE kaynak_yol = NEW.hedef AND id <> NEW.id)
     OR EXISTS (SELECT 1 FROM public.yonlendirme WHERE hedef = NEW.kaynak_yol AND id <> NEW.id) THEN
    RAISE EXCEPTION 'yönlendirme zinciri/döngüsü: % -> %', NEW.kaynak_yol, NEW.hedef
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER yonlendirme_zincir BEFORE INSERT OR UPDATE ON yonlendirme
  FOR EACH ROW EXECUTE FUNCTION ic.yonlendirme_zincir_kontrol();

-- "Yayımla": Directus akışı kuyruğa iş ekler, sunucudaki derleme görevi sırayla çalıştırır
CREATE TABLE derleme_isi (
  id                integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  durum             text NOT NULL DEFAULT 'kuyrukta' CHECK (durum IN ('kuyrukta', 'calisiyor', 'basarili', 'hatali')),
  isteyen           uuid REFERENCES directus_users(id) ON DELETE SET NULL,
  olusturma_zamani  timestamptz NOT NULL DEFAULT now(),
  baslama_zamani    timestamptz,
  bitis_zamani      timestamptz,
  log_ozeti         text,
  CHECK (durum = 'kuyrukta' OR baslama_zamani IS NOT NULL),
  CHECK (durum NOT IN ('basarili', 'hatali') OR bitis_zamani IS NOT NULL)
);
CREATE UNIQUE INDEX derleme_isi_tek_calisan ON derleme_isi ((true)) WHERE durum = 'calisiyor';
CREATE INDEX derleme_isi_kuyruk_idx ON derleme_isi (olusturma_zamani) WHERE durum = 'kuyrukta';


-- ---------------------------------------------------------------------
-- Tablo açıklamaları (psql: \dt+; db/araclar/tablo_belgesi.py belgeyi bunlardan üretir)
-- ---------------------------------------------------------------------

COMMENT ON TABLE calisma_alani IS 'Çalışma alanları; iki seviyeli ağaç (Kamu Hukuku > İmar Hukuku). Silinmez, gizlenir';
COMMENT ON TABLE calisma_alani_ceviri IS 'Çalışma alanının dile bağlı metinleri: ad, slug, kart özeti, sayfa içeriği';
COMMENT ON TABLE unvan IS 'Unvanlar ve ekip sayfasındaki sırası (Kurucu Ortak, Ortak, Avukat ...)';
COMMENT ON TABLE unvan_ceviri IS 'Unvan adının dillere göre karşılığı';
COMMENT ON TABLE kisi IS 'Ekip üyesi: avukat, arabulucu ya da stajyer. Ayrılanlar silinmez, aktif=false olur';
COMMENT ON TABLE kisi_ceviri IS 'Kişinin dile bağlı metinleri: biyografi ve SEO alanları (isteğe bağlı)';
COMMENT ON TABLE kisi_telefon IS 'Kişinin dahili, sabit ve cep numaraları; cep varsayılan olarak sitede gizli';
COMMENT ON TABLE kisi_calisma_alani IS 'Kişi ile çalışma alanı arasındaki bağ (çoka çok)';
COMMENT ON TABLE egitim IS 'Özgeçmişteki eğitim kaydı; yıllar dil bağımsız';
COMMENT ON TABLE egitim_ceviri IS 'Eğitimin okul, bölüm ve derece metinleri';
COMMENT ON TABLE deneyim IS 'Önceki iş deneyimi: kurum adı ve yıllar';
COMMENT ON TABLE deneyim_ceviri IS 'Deneyimin pozisyon ve açıklama metinleri';
COMMENT ON TABLE etiket IS 'Yayın ve kararlarda kullanılan serbest etiketler';
COMMENT ON TABLE etiket_ceviri IS 'Etiketin dillere göre adı ve slug''ı';
COMMENT ON TABLE yayin IS 'Makale, kitap, video, haber ve duyuru için tek tablo; türe özgü alanlar yalnızca o türde dolu olabilir';
COMMENT ON TABLE yayin_ceviri IS 'Yayının dile bağlı metinleri: başlık, slug, özet, içerik, SEO';
COMMENT ON TABLE yayin_yazar IS 'Yayının yazarları ve sırası: ekipten bir kişi ya da dış yazar';
COMMENT ON TABLE yayin_calisma_alani IS 'Yayın ile çalışma alanı bağı (çoka çok)';
COMMENT ON TABLE yayin_etiket IS 'Yayın ile etiket bağı (çoka çok)';
COMMENT ON TABLE yayin_dosya IS 'Yayına eklenen dosyalar (PDF vb.) ve sırası';
COMMENT ON TABLE mahkeme IS 'Mahkemeler ve daireleri; iki seviyeli ağaç (Yargıtay > 3. Hukuk Dairesi)';
COMMENT ON TABLE mevzuat IS 'Kanun, yönetmelik vb.; kararlarda madde bağlantısı için';
COMMENT ON TABLE karar IS 'Yargı kararları (yalnızca Türkçe). Anonimleştirme işaretlenmeden ve onaysız yayına alınamaz';
COMMENT ON TABLE karar_mevzuat IS 'Kararın ilgili olduğu mevzuat ve madde (madde boşsa kanunun bütünü)';
COMMENT ON TABLE karar_etiket IS 'Karar ile etiket bağı (çoka çok)';
COMMENT ON TABLE karar_calisma_alani IS 'Karar ile çalışma alanı bağı (çoka çok)';
COMMENT ON TABLE yayin_karar IS 'Makale ile karar arasındaki karşılıklı bağlantı';
COMMENT ON TABLE sayfa IS 'Sabit sayfalar: ana sayfa, hakkımızda, arabuluculuk, KVKK, çerez, yasal uyarı';
COMMENT ON TABLE sayfa_ceviri IS 'Sayfanın dile bağlı başlık, slug ve içeriği';
COMMENT ON TABLE site_ayar IS 'Site geneli ayarlar; tek satır (Directus singleton): resmi unvan, iletişim, sosyal bağlantılar';
COMMENT ON TABLE site_ayar_ceviri IS 'Adres ve alt bilgi notunun dillere göre metni';
COMMENT ON TABLE iletisim_mesaji IS 'İletişim formundan gelen mesajlar; saklama süresi dolunca silinir';
COMMENT ON TABLE yonlendirme IS 'Eski adreslerden yenilerine yönlendirmeler (301/302/308)';
COMMENT ON TABLE derleme_isi IS '"Yayımla" ile kuyruğa eklenen site derlemeleri; aynı anda tek derleme çalışır';

-- ---------------------------------------------------------------------
-- 11. İki seviyeli ağaç kuralı (çalışma alanı, mahkeme)
--     Alt kaydın üstü yalnızca kök olabilir; altı olan kök başka bir kaydın altına taşınamaz.
-- ---------------------------------------------------------------------

CREATE FUNCTION ic.iki_seviye_kontrol() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ust_sutun  text := TG_ARGV[0];
  ust        bigint := (to_jsonb(NEW) ->> ust_sutun)::bigint;
  ust_kok    boolean;
  alti_var   boolean;
BEGIN
  IF ust IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(TG_RELID::bigint);   -- eşzamanlı iki taşıma 3. seviye oluşturamasın
  EXECUTE format('SELECT %I IS NULL FROM %I.%I WHERE id = $1', ust_sutun, TG_TABLE_SCHEMA, TG_TABLE_NAME)
    INTO ust_kok USING ust;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I = $1)', TG_TABLE_SCHEMA, TG_TABLE_NAME, ust_sutun)
    INTO alti_var USING NEW.id;
  IF NOT coalesce(ust_kok, true) OR alti_var THEN
    RAISE EXCEPTION '% en fazla iki seviyeli olabilir (#% -> üst #%)', TG_TABLE_NAME, NEW.id, ust
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER calisma_alani_iki_seviye BEFORE INSERT OR UPDATE OF ust_alan_id ON calisma_alani
  FOR EACH ROW EXECUTE FUNCTION ic.iki_seviye_kontrol('ust_alan_id');
CREATE TRIGGER mahkeme_iki_seviye BEFORE INSERT OR UPDATE OF ust_mahkeme_id ON mahkeme
  FOR EACH ROW EXECUTE FUNCTION ic.iki_seviye_kontrol('ust_mahkeme_id');


-- ---------------------------------------------------------------------
-- 12. Çeviri kuralları ve guncelleme_zamani
-- ---------------------------------------------------------------------

-- Hangi tabloda hangi kayıtlar varsayılan dil çevirisi ister. kisi bilerek yok:
-- adı dil bağımsız, kisi_ceviri yalnızca isteğe bağlı biyografi taşır.
CREATE TABLE ic.ceviri_kurali (
  ana           text PRIMARY KEY,
  kosul         text NOT NULL,      -- ana satırda (a.)
  ceviri_kosul  text NOT NULL       -- çeviri satırında (c.)
);

-- Varsayılan dilde eksik çevirisi olan kayıtlar (CI ve dil değişimi kontrolü). Beklenen: boş.
CREATE FUNCTION ic.ceviri_eksikleri() RETURNS TABLE (ana text, ana_id bigint)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  r ic.ceviri_kurali;
BEGIN
  FOR r IN SELECT * FROM ic.ceviri_kurali LOOP
    RETURN QUERY EXECUTE format(
      'SELECT %1$L::text, a.id::bigint FROM public.%1$I a WHERE (%2$s)
         AND NOT EXISTS (SELECT 1 FROM public.%3$I c WHERE c.%4$I = a.id AND c.dil = ic.varsayilan_dil() AND (%5$s))',
      r.ana, r.kosul, r.ana || '_ceviri', r.ana || '_id', r.ceviri_kosul);
  END LOOP;
END $$;

-- Ertelenmiş kısıt tetikleyicisi: TG_ARGV[0] ana tablo · [1] ana satırda koşul · [2] çeviri satırında koşul
CREATE FUNCTION ic.ceviri_zorunlu_kontrol() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ana     text := TG_ARGV[0];
  ana_id  bigint;
  eksik   boolean;
BEGIN
  IF TG_TABLE_NAME = ana THEN
    ana_id := NEW.id;
  ELSE
    ana_id := (to_jsonb(OLD) ->> (ana || '_id'))::bigint;
  END IF;
  EXECUTE format(
    'SELECT EXISTS (SELECT 1 FROM public.%1$I a WHERE a.id = $1 AND (%2$s)
       AND NOT EXISTS (SELECT 1 FROM public.%3$I c WHERE c.%4$I = a.id AND c.dil = ic.varsayilan_dil() AND (%5$s)))',
    ana, TG_ARGV[1], ana || '_ceviri', ana || '_id', TG_ARGV[2])
  INTO eksik USING ana_id;
  IF eksik THEN
    RAISE EXCEPTION '% #% varsayılan dilde (%) hazır çeviri olmadan yayında/görünür olamaz',
      ana, ana_id, ic.varsayilan_dil() USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;

-- Kural ekler ve iki kısıt tetikleyicisini bağlar (modüller de bunu çağırır)
CREATE FUNCTION ic.ceviri_kurali_ekle(p_ana text, p_kosul text, p_ceviri_kosul text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO ic.ceviri_kurali VALUES (p_ana, p_kosul, p_ceviri_kosul);
  EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER INSERT OR UPDATE ON public.%I
                  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
                  EXECUTE FUNCTION ic.ceviri_zorunlu_kontrol(%L, %L, %L)',
                 p_ana || '_ceviri_zorunlu', p_ana, p_ana, p_kosul, p_ceviri_kosul);
  EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER UPDATE OR DELETE ON public.%I
                  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
                  EXECUTE FUNCTION ic.ceviri_zorunlu_kontrol(%L, %L, %L)',
                 p_ana || '_ceviri_silinemez', p_ana || '_ceviri', p_ana, p_kosul, p_ceviri_kosul);
END $$;

-- Varsayılan dil kuralı: COMMIT anında tam olarak bir varsayılan dil ve yayındaki her şeyin o dilde çevirisi
CREATE FUNCTION ic.dil_varsayilan_kontrol() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  e record;
BEGIN
  IF (SELECT count(*) FROM public.dil WHERE varsayilan) <> 1 THEN
    RAISE EXCEPTION 'tam olarak bir varsayılan dil olmalı' USING ERRCODE = 'check_violation';
  END IF;
  SELECT * INTO e FROM ic.ceviri_eksikleri() LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'varsayılan dil (%) değişikliği reddedildi: % #% bu dilde çevirisiz',
      ic.varsayilan_dil(), e.ana, e.ana_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER dil_varsayilan_zorunlu AFTER INSERT OR UPDATE OR DELETE ON dil
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ic.dil_varsayilan_kontrol();

CREATE FUNCTION ic.guncelleme_zamani_ata() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.guncelleme_zamani := now();
  RETURN NEW;
END $$;

-- Çeviri değişince ana kaydın guncelleme_zamani'ni ilerletir (sitemap lastmod, derleme önbelleği).
-- Çeviri başka kayda taşınırsa eski ve yeni ana kaydın ikisi de ilerler.
CREATE FUNCTION ic.ceviri_ust_guncelle() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ana   text := left(TG_TABLE_NAME, -length('_ceviri'));
  yeni  text := to_jsonb(NEW) ->> (ana || '_id');
  eski  text := to_jsonb(OLD) ->> (ana || '_id');
BEGIN
  EXECUTE format('UPDATE public.%I SET guncelleme_zamani = now() WHERE id::text IN ($1, $2)', ana)
    USING yeni, eski;
  RETURN NULL;
END $$;

-- guncelleme_zamani sütunu olan ve henüz tetikleyicisi olmayan her tabloya, ve ana tablosunda
-- guncelleme_zamani olan her *_ceviri tablosuna tetikleyici bağlar. Tekrar çağrılabilir (modüller çağırır).
CREATE FUNCTION ic.tetikleyicileri_bagla() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'guncelleme_zamani' AND NOT a.attisdropped
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
      AND NOT EXISTS (SELECT 1 FROM pg_trigger g WHERE g.tgrelid = c.oid AND g.tgname = c.relname || '_guncelleme')
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION ic.guncelleme_zamani_ata()',
                   t || '_guncelleme', t);
  END LOOP;

  FOR t IN
    SELECT c.relname FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND c.relname LIKE '%\_ceviri'
      AND EXISTS (SELECT 1 FROM pg_attribute a
                  WHERE a.attrelid = to_regclass('public.' || left(c.relname, -7)) AND a.attname = 'guncelleme_zamani')
      AND NOT EXISTS (SELECT 1 FROM pg_trigger g WHERE g.tgrelid = c.oid AND g.tgname = c.relname || '_ust_guncelle')
  LOOP
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION ic.ceviri_ust_guncelle()', t || '_ust_guncelle', t);
  END LOOP;
END $$;

DO $$ BEGIN
  PERFORM ic.ceviri_kurali_ekle('yayin',         'a.durum = ''yayinda''', 'c.hazir');
  PERFORM ic.ceviri_kurali_ekle('calisma_alani', 'a.gorunur',             'true');
  PERFORM ic.ceviri_kurali_ekle('sayfa',         'a.aktif',               'true');
  PERFORM ic.ceviri_kurali_ekle('unvan',         'true',                  'true');
  PERFORM ic.ceviri_kurali_ekle('egitim',        'true',                  'true');
  PERFORM ic.ceviri_kurali_ekle('deneyim',       'true',                  'true');
  PERFORM ic.ceviri_kurali_ekle('etiket',        'true',                  'true');
  PERFORM ic.ceviri_kurali_ekle('site_ayar',     'true',                  'true');
  PERFORM ic.tetikleyicileri_bagla();
END $$;


-- ---------------------------------------------------------------------
-- 13. KVKK saklama süresi: günlük systemd timer ile çağrılır: SELECT * FROM ic.kisisel_veri_temizle();
-- ---------------------------------------------------------------------

CREATE FUNCTION ic.kisisel_veri_temizle() RETURNS TABLE (tablo text, silinen bigint)
LANGUAGE plpgsql AS $$
DECLARE
  n bigint;
BEGIN
  DELETE FROM public.iletisim_mesaji WHERE saklama_bitis < now();
  GET DIAGNOSTICS n = ROW_COUNT; tablo := 'iletisim_mesaji'; silinen := n; RETURN NEXT;
END $$;

COMMIT;
