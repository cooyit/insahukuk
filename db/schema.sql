-- =====================================================================
--  İNŞA Hukuk ve Arabuluculuk — Revize veri modeli v2 (PostgreSQL 16+)
--
--  Kaynaklar ve öncelik sırası
--   1. Kaplan'ın veri modeli tablosu (9 Ekim 2026)  -> gereksinimlerin sahibi
--   2. gsi_schema.sql                               -> yapı kalıpları (çeviri tablosu, slug domain, tetikleyici)
--   3. rapor.md §9                                  -> panel, oturum, derleme kuyruğu, SEO alanları
--
--  Temel kararlar
--   * Adlandırma: Türkçe, YALNIZCA ASCII, snake_case, tekil tablo adı (kisi, yayin, karar).
--     Ekip tablosundaki adlar korunur; sistem sütunları da Türkçe (olusturma_zamani ...).
--   * Çok dillilik: dile bağlı metin <tablo>_ceviri tablosunda, PK (<tablo>_id, dil).
--     Dil bağımsız alanlar (tarih, durum, dosya, ilişkiler) ana tabloda tek kez durur.
--     Yayında/görünür her kaydın varsayılan dilde (tr) çevirisi olmak zorunda:
--     ertelenmiş (DEFERRABLE) kısıt tetikleyicisi, COMMIT anında kontrol eder.
--     Karar modülü (karar, mahkeme, mevzuat) yalnızca Türkçe; çeviri tablosu yok.
--     Site tek dilli açılsa bile yapı aynı kalır (yalnızca 'tr' satırı olur).
--   * Kimlik: bigint IDENTITY; dosya kimliği uuid (URL'de tahmin edilemesin).
--   * Metin: kişi adı / başlık gibi sıralanan sütunlar tr_metin domain'i (COLLATE "tr-x-icu").
--     Veritabanının varsayılan collation'ına güvenilmez; e-posta küçük harf ASCII
--     olarak saklanır (lower() Türkçe yerelde I -> ı yapar, testte gösterildi).
--   * Silme politikası:
--       - Ara tablolar sahibinden CASCADE (kisi, yayin, karar silinince bağlar gider),
--         sözlük/dosya tarafından NO ACTION (çalışma alanı, etiket, dosya kullanımdaysa silinemez).
--       - kisi ve kullanici silinmez: kisi.aktif=false, kullanici.aktif=false / anonimleştirme.
--   * PG16: UNIQUE NULLS NOT DISTINCT; üretilmiş sütun + bileşik FK ile 2 seviyeli ağaç;
--     EXCLUDE ile çakışmayan pop-up; generated tsvector ile Türkçe tam metin arama.
--   * Eklenti gerekmez (gen_random_uuid yerleşik; ICU collation PGDG/Ubuntu paketlerinde var).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Tipler, domain'ler, yardımcı fonksiyonlar
-- ---------------------------------------------------------------------

-- 'incelemede': yazar rolündeki avukat içeriği onaya gönderir (Açık Sorular: "yayın için onay").
CREATE TYPE icerik_durumu  AS ENUM ('taslak', 'incelemede', 'yayinda', 'arsiv');
CREATE TYPE dosya_turu     AS ENUM ('gorsel', 'video', 'pdf', 'ses', 'belge');
-- yonetici: her şey + kullanıcılar/ayarlar · editor: tüm içerik + onay/yayın · yazar: yalnızca kendi içeriği
-- Yeni rol gerekirse: ALTER TYPE kullanici_rolu ADD VALUE '...'; (rol_yetki tablosuna şimdilik gerek yok)
CREATE TYPE kullanici_rolu AS ENUM ('yonetici', 'editor', 'yazar');

-- URL parçası: küçük harf ASCII, rakam, tek tire. Türkçe karakter dönüşümü: slug_tr().
CREATE DOMAIN slug AS text
  CHECK (VALUE ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(VALUE) <= 120);

-- Türkçe sıralanan metin (Ç, Ğ, İ, Ö, Ş, Ü doğru yerde). Veritabanı C/en_US ile kurulsa da doğru sıralar.
CREATE DOMAIN tr_metin AS text COLLATE "tr-x-icu";

-- E-posta: uygulama trim + toLowerCase() (yerel bağımsız) uygular; DB büyük harfi reddeder.
CREATE DOMAIN eposta AS text
  CHECK (VALUE !~ '[A-Z\s]' AND VALUE ~ '^[^@]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$' AND length(VALUE) <= 254);

-- E.164 telefon (+905321234567). Görüntü biçimlendirmesi ön yüzde yapılır.
CREATE DOMAIN telefon AS text CHECK (VALUE ~ '^\+[1-9][0-9]{7,14}$');

CREATE DOMAIN https_url AS text CHECK (VALUE ~ '^https://[a-z0-9.-]+(:[0-9]+)?(/[^\s]*)?$' AND length(VALUE) <= 2000);

CREATE DOMAIN yil AS smallint CHECK (VALUE BETWEEN 1900 AND 2100);

-- Türkçe başlıktan slug üretir: 'Şirketler & İmar Hukuku' -> 'sirketler-imar-hukuku'
CREATE FUNCTION slug_tr(girdi text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT NULLIF(trim(BOTH '-' FROM left(
           regexp_replace(
             lower(translate(girdi, 'ÇĞİIÖŞÜÂÎÛçğıöşüâîû', 'cgiiosuaiucgiosuaiu') COLLATE "C"),
             '[^a-z0-9]+', '-', 'g'),
           120)), '')
$$;

-- ISBN-10 / ISBN-13 sağlama toplamı (tire ve boşluk temizlenmiş değer beklenir)
-- STRICT: NULL girdi NULL döner, böylece kitap olmayan satırlarda CHECK geçer
CREATE FUNCTION isbn_gecerli(isbn text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  toplam int := 0;
BEGIN
  IF isbn ~ '^[0-9]{13}$' THEN
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

CREATE FUNCTION guncelleme_zamani_ata() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.guncelleme_zamani := now();
  RETURN NEW;
END $$;

-- Çeviri değişince ana kaydın guncelleme_zamani'ni ilerletir (sitemap lastmod, derleme önbelleği).
-- Sözleşme: <ana>_ceviri tablosundaki FK sütunu <ana>_id adını taşır.
CREATE FUNCTION ceviri_ust_guncelle() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ana  text := left(TG_TABLE_NAME, -length('_ceviri'));
  kid  bigint := COALESCE(to_jsonb(NEW), to_jsonb(OLD)) ->> (ana || '_id');
BEGIN
  EXECUTE format('UPDATE %I SET guncelleme_zamani = now() WHERE id = $1', ana) USING kid;
  RETURN NULL;
END $$;


-- ---------------------------------------------------------------------
-- 1. Diller
-- ---------------------------------------------------------------------

CREATE TABLE dil (
  kod         text PRIMARY KEY CHECK (kod ~ '^[a-z]{2}(-[a-z]{2})?$'),
  ad          text NOT NULL,
  varsayilan  boolean NOT NULL DEFAULT false,
  aktif       boolean NOT NULL DEFAULT true,
  siralama    smallint NOT NULL DEFAULT 0,
  CHECK (NOT varsayilan OR aktif)
);
CREATE UNIQUE INDEX dil_tek_varsayilan_idx ON dil (varsayilan) WHERE varsayilan;   -- en fazla bir

CREATE FUNCTION varsayilan_dil() RETURNS text
LANGUAGE sql STABLE PARALLEL SAFE AS $$ SELECT kod FROM dil WHERE varsayilan $$;

-- "En az bir" kısmı: COMMIT anında tam olarak bir varsayılan dil olmalı.
-- Varsayılan dil değişirse yayındaki içeriğin yeni dilde çevirisi olmalı (ceviri_eksikleri() bölüm 13'te).
CREATE FUNCTION dil_varsayilan_kontrol() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  e record;
BEGIN
  IF (SELECT count(*) FROM dil WHERE varsayilan) <> 1 THEN
    RAISE EXCEPTION 'tam olarak bir varsayılan dil olmalı' USING ERRCODE = 'check_violation';
  END IF;
  SELECT * INTO e FROM ceviri_eksikleri() LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'varsayılan dil (%) değişikliği reddedildi: % #% bu dilde çevirisiz',
      varsayilan_dil(), e.ana, e.ana_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER dil_varsayilan_zorunlu
  AFTER INSERT OR UPDATE OR DELETE ON dil
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION dil_varsayilan_kontrol();

INSERT INTO dil (kod, ad, varsayilan, siralama) VALUES ('tr', 'Türkçe', true, 1), ('en', 'English', false, 2);


-- ---------------------------------------------------------------------
-- 2. Panel kullanıcıları ve oturumlar (kisi FK'si kisi tablosundan sonra eklenir)
-- ---------------------------------------------------------------------

CREATE TABLE kullanici (
  id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kisi_id                 bigint UNIQUE,              -- 1-1; NULL = teknik hesap (geliştirici)
  eposta                  eposta NOT NULL UNIQUE,     -- küçük harf saklandığı için düz UNIQUE yeter
  gorunen_ad              tr_metin NOT NULL,
  sifre_hash              text CHECK (sifre_hash ~ '^\$argon2id\$'),  -- NULL = giriş kapalı / anonimleştirildi
  rol                     kullanici_rolu NOT NULL DEFAULT 'yazar',
  totp_gizli              bytea,                      -- uygulama tarafında şifreli
  aktif                   boolean NOT NULL DEFAULT true,
  basarisiz_giris_sayisi  smallint NOT NULL DEFAULT 0 CHECK (basarisiz_giris_sayisi >= 0),
  kilit_bitis             timestamptz,                -- kademeli bekleme (rapor §9.1)
  son_giris_zamani        timestamptz,
  olusturma_zamani        timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani       timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT aktif OR sifre_hash IS NOT NULL),
  CHECK (rol <> 'yazar' OR kisi_id IS NOT NULL)       -- yazar = ekipteki bir avukat/arabulucu
);

CREATE TABLE oturum (
  token_hash          bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32),  -- sha256(çerez); çerez saklanmaz
  kullanici_id        bigint NOT NULL REFERENCES kullanici(id) ON DELETE CASCADE,
  olusturma_zamani    timestamptz NOT NULL DEFAULT now(),
  son_kullanma        timestamptz NOT NULL,
  kullanici_araci     text CHECK (length(kullanici_araci) <= 400),
  -- KVKK: HMAC-SHA256(ip, sunucu_gizli_anahtari) — uygulamada hesaplanır, anahtar dönemsel değişir.
  -- Düz sha256(ip) KULLANMAYIN: IPv4 uzayı küçük, testte /16 blok 0,1 sn'de geri çevrildi.
  ip_hmac             bytea CHECK (octet_length(ip_hmac) = 32),
  CHECK (son_kullanma > olusturma_zamani AND son_kullanma <= olusturma_zamani + interval '24 hours')
);
CREATE INDEX oturum_kullanici_idx     ON oturum (kullanici_id);
CREATE INDEX oturum_son_kullanma_idx  ON oturum (son_kullanma);


-- ---------------------------------------------------------------------
-- 3. Dosyalar (ekip tablosundaki "dosya")
-- ---------------------------------------------------------------------

CREATE TABLE dosya (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tur                dosya_turu NOT NULL,
  -- genel: statik siteye kopyalanır · ozel: yalnızca oturumlu API'den (CV, anonimleştirilmemiş karar)
  erisim             text NOT NULL DEFAULT 'genel' CHECK (erisim IN ('genel', 'ozel')),
  depolama_anahtari  text NOT NULL UNIQUE,            -- 2026/10/<uuid>.webp
  orijinal_ad        text NOT NULL,
  mime_tur           text NOT NULL CHECK (mime_tur ~ '^[a-z]+/[a-z0-9.+-]+$' AND mime_tur <> 'image/svg+xml'),
  boyut              bigint NOT NULL CHECK (boyut > 0),
  sha256             bytea NOT NULL CHECK (octet_length(sha256) = 32),
  genislik           integer CHECK (genislik > 0),
  yukseklik          integer CHECK (yukseklik > 0),
  sure_saniye        integer CHECK (sure_saniye >= 0),
  yukleyen_id        bigint REFERENCES kullanici(id),
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, erisim),                                -- basvuru.cv için bileşik FK hedefi
  CHECK (CASE tur
           WHEN 'gorsel' THEN mime_tur LIKE 'image/%'
           WHEN 'video'  THEN mime_tur LIKE 'video/%'
           WHEN 'ses'    THEN mime_tur LIKE 'audio/%'
           WHEN 'pdf'    THEN mime_tur = 'application/pdf'
           ELSE true END),
  CHECK (tur NOT IN ('gorsel', 'video') OR (genislik IS NOT NULL AND yukseklik IS NOT NULL))
);
CREATE INDEX dosya_sha256_idx ON dosya (sha256);

CREATE TABLE dosya_ceviri (
  dosya_id   uuid NOT NULL REFERENCES dosya(id) ON DELETE CASCADE,
  dil        text NOT NULL REFERENCES dil(kod),
  alt_metin  text CHECK (length(alt_metin) <= 250),
  aciklama   text,
  PRIMARY KEY (dosya_id, dil)
);


-- ---------------------------------------------------------------------
-- 4. Çalışma alanları — iki seviyeli ağaç (Kamu hukuku > Ceza, İmar)
--    Seviye kuralı tetikleyicisiz: üretilmiş sütun + bileşik öz-FK.
--    Alt alanın üstü yalnızca seviye 1 olabilir; altı olan kök alt alana dönüştürülemez.
-- ---------------------------------------------------------------------

CREATE TABLE calisma_alani (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ust_alan_id        bigint,
  seviye             smallint GENERATED ALWAYS AS (CASE WHEN ust_alan_id IS NULL THEN 1 ELSE 2 END) STORED,
  ust_seviye         smallint GENERATED ALWAYS AS (CASE WHEN ust_alan_id IS NOT NULL THEN 1 END) STORED,
  siralama           smallint NOT NULL DEFAULT 0,
  gorsel_dosya_id    uuid REFERENCES dosya(id),
  gorunur            boolean NOT NULL DEFAULT true,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, seviye),
  FOREIGN KEY (ust_alan_id, ust_seviye) REFERENCES calisma_alani (id, seviye),
  CHECK (ust_alan_id <> id)
);
CREATE INDEX calisma_alani_ust_idx ON calisma_alani (ust_alan_id, siralama);

CREATE TABLE calisma_alani_ceviri (
  calisma_alani_id  bigint NOT NULL REFERENCES calisma_alani(id) ON DELETE CASCADE,
  dil               text NOT NULL REFERENCES dil(kod),
  slug              slug NOT NULL,
  ad                tr_metin NOT NULL CHECK (length(ad) <= 120),
  ozet              text CHECK (length(ozet) <= 300),
  icerik            jsonb CHECK (jsonb_typeof(icerik) = 'object'),   -- alanın kendi sayfası (Soru 18)
  seo_baslik        text CHECK (length(seo_baslik) <= 70),
  seo_aciklama      text CHECK (length(seo_aciklama) <= 170),
  PRIMARY KEY (calisma_alani_id, dil),
  UNIQUE (dil, slug)
);

-- Opsiyonel (Lexist): sektör listesi
CREATE TABLE sektor (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  siralama           smallint NOT NULL DEFAULT 0,
  gorunur            boolean NOT NULL DEFAULT true,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sektor_ceviri (
  sektor_id  bigint NOT NULL REFERENCES sektor(id) ON DELETE CASCADE,
  dil        text NOT NULL REFERENCES dil(kod),
  slug       slug NOT NULL,
  ad         tr_metin NOT NULL,
  aciklama   text,
  PRIMARY KEY (sektor_id, dil),
  UNIQUE (dil, slug)
);


-- ---------------------------------------------------------------------
-- 5. Ekip: unvan, kisi, telefon, eğitim, deneyim, firma
-- ---------------------------------------------------------------------

CREATE TABLE unvan (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kod                slug NOT NULL UNIQUE,                    -- 'kurucu-ortak', 'ortak', 'avukat', 'stajyer-avukat'
  sira               smallint NOT NULL,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unvan_sira_tekil UNIQUE (sira) DEFERRABLE INITIALLY DEFERRED  -- sıra takası tek işlemde yapılabilsin
);
CREATE TABLE unvan_ceviri (
  unvan_id  bigint NOT NULL REFERENCES unvan(id) ON DELETE CASCADE,
  dil       text NOT NULL REFERENCES dil(kod),
  ad        tr_metin NOT NULL CHECK (length(ad) <= 80),        -- "Kurucu Ortak" / "Founding Partner"
  PRIMARY KEY (unvan_id, dil)
);

CREATE TABLE kisi (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug                slug NOT NULL UNIQUE,                    -- ad dile göre değişmez
  ad                  tr_metin NOT NULL,
  soyad               tr_metin NOT NULL,
  unvan_id            bigint REFERENCES unvan(id),
  foto_dosya_id       uuid REFERENCES dosya(id),
  eposta              eposta UNIQUE,                           -- tek e-posta (ekip notu)
  avukat_mi           boolean NOT NULL DEFAULT false,          -- aynı kişi hem avukat hem arabulucu olabilir
  arabulucu_mu        boolean NOT NULL DEFAULT false,
  baro_adi            tr_metin,                                -- Soru: sicil gösterilecek mi? (Beklemede)
  baro_sicil_no       text CHECK (baro_sicil_no ~ '^[0-9]{1,8}$'),
  arabulucu_sicil_no  text CHECK (arabulucu_sicil_no ~ '^[0-9]{1,8}$'),
  linkedin_url        https_url,
  aktif               boolean NOT NULL DEFAULT true,           -- ayrılanlar silinmez
  siralama            smallint NOT NULL DEFAULT 0,             -- aynı unvan içinde sıra
  olusturma_zamani    timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani   timestamptz NOT NULL DEFAULT now(),
  CHECK (baro_sicil_no IS NULL OR (avukat_mi AND baro_adi IS NOT NULL)),
  CHECK (arabulucu_sicil_no IS NULL OR arabulucu_mu)
);
CREATE INDEX kisi_unvan_idx ON kisi (unvan_id);
CREATE INDEX kisi_ekip_sirasi_idx ON kisi (siralama, soyad, ad) WHERE aktif;

ALTER TABLE kullanici ADD FOREIGN KEY (kisi_id) REFERENCES kisi(id);

CREATE TABLE kisi_ceviri (
  kisi_id          bigint NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  dil              text NOT NULL REFERENCES dil(kod),
  kisa_biyografi   text CHECK (length(kisa_biyografi) <= 300),
  biyografi        jsonb CHECK (jsonb_typeof(biyografi) = 'object'),
  seo_baslik       text CHECK (length(seo_baslik) <= 70),
  seo_aciklama     text CHECK (length(seo_aciklama) <= 170),
  PRIMARY KEY (kisi_id, dil)
);

CREATE TABLE kisi_telefon (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kisi_id         bigint NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  tur             text NOT NULL CHECK (tur IN ('dahili', 'cep', 'sabit')),
  numara          text NOT NULL,
  sitede_goster   boolean NOT NULL DEFAULT false,              -- KVKK: kişisel cep varsayılan gizli
  sira            smallint NOT NULL DEFAULT 0,
  UNIQUE (kisi_id, tur, numara),
  CHECK (CASE WHEN tur = 'dahili' THEN numara ~ '^[0-9]{2,6}$'
              ELSE numara ~ '^\+[1-9][0-9]{7,14}$' END)
);

CREATE TABLE kisi_calisma_alani (
  kisi_id           bigint NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  calisma_alani_id  bigint NOT NULL REFERENCES calisma_alani(id),
  PRIMARY KEY (kisi_id, calisma_alani_id)
);
CREATE INDEX kisi_calisma_alani_alan_idx ON kisi_calisma_alani (calisma_alani_id);

CREATE TABLE kisi_sektor (
  kisi_id    bigint NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  sektor_id  bigint NOT NULL REFERENCES sektor(id),
  PRIMARY KEY (kisi_id, sektor_id)
);
CREATE INDEX kisi_sektor_sektor_idx ON kisi_sektor (sektor_id);

CREATE TABLE egitim (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kisi_id            bigint NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  baslangic_yili     yil,
  bitis_yili         yil,
  sira               smallint NOT NULL DEFAULT 0,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (bitis_yili IS NULL OR baslangic_yili IS NULL OR bitis_yili >= baslangic_yili)
);
CREATE INDEX egitim_kisi_idx ON egitim (kisi_id, sira);
CREATE TABLE egitim_ceviri (
  egitim_id  bigint NOT NULL REFERENCES egitim(id) ON DELETE CASCADE,
  dil        text NOT NULL REFERENCES dil(kod),
  okul_adi   tr_metin NOT NULL,                                -- serbest metin (okul listesi istenmedi)
  bolum_adi  tr_metin,
  derece     text,                                             -- "Lisans", "LL.M."
  PRIMARY KEY (egitim_id, dil)
);

-- Beklemede: deneyimdeki firmaların logosu gösterilecekse kullanılır
CREATE TABLE firma (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad                 tr_metin NOT NULL UNIQUE,
  logo_dosya_id      uuid REFERENCES dosya(id),
  web_sitesi         https_url,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deneyim (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kisi_id            bigint NOT NULL REFERENCES kisi(id) ON DELETE CASCADE,
  firma_id           bigint REFERENCES firma(id),
  firma_adi          tr_metin,                                 -- logo gerekmiyorsa serbest metin
  baslangic_yili     yil,
  bitis_yili         yil,                                      -- NULL = halen
  sira               smallint NOT NULL DEFAULT 0,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(firma_id, firma_adi) = 1),
  CHECK (bitis_yili IS NULL OR baslangic_yili IS NULL OR bitis_yili >= baslangic_yili)
);
CREATE INDEX deneyim_kisi_idx  ON deneyim (kisi_id, sira);
CREATE INDEX deneyim_firma_idx ON deneyim (firma_id);
CREATE TABLE deneyim_ceviri (
  deneyim_id  bigint NOT NULL REFERENCES deneyim(id) ON DELETE CASCADE,
  dil         text NOT NULL REFERENCES dil(kod),
  pozisyon    tr_metin NOT NULL,
  aciklama    text,
  PRIMARY KEY (deneyim_id, dil)
);


-- ---------------------------------------------------------------------
-- 6. Etiket ve bülten sayısı
-- ---------------------------------------------------------------------

CREATE TABLE etiket (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE etiket_ceviri (
  etiket_id  bigint NOT NULL REFERENCES etiket(id) ON DELETE CASCADE,
  dil        text NOT NULL REFERENCES dil(kod),
  slug       slug NOT NULL,
  ad         tr_metin NOT NULL CHECK (length(ad) <= 60),
  PRIMARY KEY (etiket_id, dil),
  UNIQUE (dil, slug)
);

-- Opsiyonel (GSI Articletter benzeri). Mevsimsiz (yıllık) sayıda donem NULL;
-- NULLS NOT DISTINCT olmadan aynı yıl için iki "yıllık" sayı girilebiliyordu (GSI testi T01).
CREATE TABLE bulten_sayisi (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  yil                yil NOT NULL,
  donem              text CHECK (donem IN ('kis', 'ilkbahar', 'yaz', 'sonbahar')),
  kapak_dosya_id     uuid REFERENCES dosya(id),
  pdf_dosya_id       uuid REFERENCES dosya(id),
  durum              icerik_durumu NOT NULL DEFAULT 'taslak',
  yayin_tarihi       timestamptz,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (yil, donem),
  CHECK (durum <> 'yayinda' OR yayin_tarihi IS NOT NULL)
);
CREATE TABLE bulten_sayisi_ceviri (
  bulten_sayisi_id  bigint NOT NULL REFERENCES bulten_sayisi(id) ON DELETE CASCADE,
  dil               text NOT NULL REFERENCES dil(kod),
  slug              slug NOT NULL,
  baslik            tr_metin NOT NULL,                         -- "2026 Kış Sayısı"
  PRIMARY KEY (bulten_sayisi_id, dil),
  UNIQUE (dil, slug)
);


-- ---------------------------------------------------------------------
-- 7. Yayınlar: makale, kitap, video, haber, duyuru — tek tablo + tur
-- ---------------------------------------------------------------------

CREATE TABLE yayin (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tur                text NOT NULL CHECK (tur IN ('makale', 'kitap', 'video', 'haber', 'duyuru')),
  durum              icerik_durumu NOT NULL DEFAULT 'taslak',
  yayin_tarihi       timestamptz,                              -- ileri tarih = zamanlanmış yayın
  kapak_dosya_id     uuid REFERENCES dosya(id),
  bulten_sayisi_id   bigint REFERENCES bulten_sayisi(id),
  -- kitap
  yayinevi           tr_metin,
  isbn               text CHECK (isbn_gecerli(isbn)),          -- tiresiz saklanır: 9786051234567
  basim_yili         yil,
  sayfa_sayisi       smallint CHECK (sayfa_sayisi > 0),
  -- video (YouTube vb. dış bağlantı ya da kendi dosyası; YouTube = yurt dışı aktarım + çerez, tıkla-yükle önerilir)
  video_url          https_url,
  video_dosya_id     uuid REFERENCES dosya(id),
  -- haber: başka mecrada çıkan haber/röportaj
  kaynak_adi         tr_metin,
  kaynak_url         https_url,
  -- SEO (rapor §9.1)
  noindex            boolean NOT NULL DEFAULT false,
  kanonik_url        https_url,
  -- sahiplik ve onay (Açık Sorular: Kullanıcı)
  olusturan_id       bigint NOT NULL REFERENCES kullanici(id),
  guncelleyen_id     bigint REFERENCES kullanici(id),
  onaylayan_id       bigint REFERENCES kullanici(id),          -- yayına alan/onaylayan (editor/yonetici)
  onay_zamani        timestamptz,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (durum <> 'yayinda' OR (yayin_tarihi IS NOT NULL AND onaylayan_id IS NOT NULL)),
  CHECK ((onaylayan_id IS NULL) = (onay_zamani IS NULL)),
  CHECK (tur = 'kitap' OR num_nonnulls(yayinevi, isbn, basim_yili, sayfa_sayisi) = 0),
  CHECK (CASE WHEN tur = 'video' THEN num_nonnulls(video_url, video_dosya_id) = 1
              ELSE num_nonnulls(video_url, video_dosya_id) = 0 END),
  CHECK (tur = 'haber' OR num_nonnulls(kaynak_adi, kaynak_url) = 0),
  CHECK (bulten_sayisi_id IS NULL OR tur = 'makale')
);
CREATE INDEX yayin_yayinda_idx  ON yayin (tur, yayin_tarihi DESC) WHERE durum = 'yayinda';
CREATE INDEX yayin_olusturan_idx ON yayin (olusturan_id);
CREATE INDEX yayin_bulten_idx    ON yayin (bulten_sayisi_id);

-- Görüntülenme ayrı tabloda: her sayaç artışı yayin.guncelleme_zamani'ni (sitemap lastmod) bozmasın.
-- Statik sitede sayım için ayrı bir API ucu gerekir; çerezsiz, IP saklamadan.
CREATE TABLE yayin_sayac (
  yayin_id      bigint PRIMARY KEY REFERENCES yayin(id) ON DELETE CASCADE,
  goruntulenme  bigint NOT NULL DEFAULT 0 CHECK (goruntulenme >= 0)
);

CREATE TABLE yayin_ceviri (
  yayin_id      bigint NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  dil           text NOT NULL REFERENCES dil(kod),
  hazir         boolean NOT NULL DEFAULT true,               -- false: çeviri sürüyor, sitede gösterme
  slug          slug NOT NULL,
  baslik        tr_metin NOT NULL CHECK (length(baslik) <= 300),
  ozet          text CHECK (length(ozet) <= 1000),
  icerik        jsonb CHECK (jsonb_typeof(icerik) = 'object'),  -- TipTap belgesi; kitap/video için boş olabilir
  seo_baslik    text CHECK (length(seo_baslik) <= 70),
  seo_aciklama  text CHECK (length(seo_aciklama) <= 170),
  og_dosya_id   uuid REFERENCES dosya(id),
  PRIMARY KEY (yayin_id, dil),
  UNIQUE (dil, slug)
);

-- Çok yazarlı yayın; dış yazar kisi tablosuna girmez (ekip sayfasında görünmesin)
CREATE TABLE yayin_yazar (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  yayin_id         bigint NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  kisi_id          bigint REFERENCES kisi(id),
  dis_yazar_adi    tr_metin,
  dis_yazar_unvan  text,                                       -- "Prof. Dr., X Üniversitesi"
  sira             smallint NOT NULL,
  CHECK (num_nonnulls(kisi_id, dis_yazar_adi) = 1),
  CHECK (dis_yazar_unvan IS NULL OR dis_yazar_adi IS NOT NULL),
  UNIQUE (yayin_id, kisi_id),
  CONSTRAINT yayin_yazar_sira_tekil UNIQUE (yayin_id, sira) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX yayin_yazar_kisi_idx ON yayin_yazar (kisi_id);

CREATE TABLE yayin_calisma_alani (
  yayin_id          bigint NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  calisma_alani_id  bigint NOT NULL REFERENCES calisma_alani(id),
  PRIMARY KEY (yayin_id, calisma_alani_id)
);
CREATE INDEX yayin_calisma_alani_alan_idx ON yayin_calisma_alani (calisma_alani_id);

CREATE TABLE yayin_etiket (
  yayin_id   bigint NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  etiket_id  bigint NOT NULL REFERENCES etiket(id),
  PRIMARY KEY (yayin_id, etiket_id)
);
CREATE INDEX yayin_etiket_etiket_idx ON yayin_etiket (etiket_id);

CREATE TABLE yayin_sektor (
  yayin_id   bigint NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  sektor_id  bigint NOT NULL REFERENCES sektor(id),
  PRIMARY KEY (yayin_id, sektor_id)
);
CREATE INDEX yayin_sektor_sektor_idx ON yayin_sektor (sektor_id);

CREATE TABLE yayin_dosya (
  yayin_id  bigint NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  dosya_id  uuid NOT NULL REFERENCES dosya(id),
  sira      smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (yayin_id, dosya_id)
);
CREATE INDEX yayin_dosya_dosya_idx ON yayin_dosya (dosya_id);


-- ---------------------------------------------------------------------
-- 8. Kararlar (Beklemede — iskelet). Yalnızca Türkçe.
--    Açık: alan listesi, filtreler, tam metin mi dosya mı, yorum, anonimleştirme süreci.
-- ---------------------------------------------------------------------

-- Mahkeme > daire (iki seviye; çalışma alanı ile aynı teknik)
CREATE TABLE mahkeme (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ust_mahkeme_id     bigint,
  seviye             smallint GENERATED ALWAYS AS (CASE WHEN ust_mahkeme_id IS NULL THEN 1 ELSE 2 END) STORED,
  ust_seviye         smallint GENERATED ALWAYS AS (CASE WHEN ust_mahkeme_id IS NOT NULL THEN 1 END) STORED,
  tur                text NOT NULL CHECK (tur IN ('aym', 'yargitay', 'danistay', 'bam', 'bim',
                                                  'ilk_derece_adli', 'ilk_derece_idari', 'uyusmazlik', 'aihm', 'diger')),
  ad                 tr_metin NOT NULL,                        -- "Yargıtay" / "3. Hukuk Dairesi" / "İstanbul BAM"
  kisa_ad            text,                                     -- "Y. 3. HD"
  siralama           smallint NOT NULL DEFAULT 0,
  aktif              boolean NOT NULL DEFAULT true,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, seviye),
  FOREIGN KEY (ust_mahkeme_id, ust_seviye) REFERENCES mahkeme (id, seviye),
  -- PG16: kökte (üst NULL) aynı adla ikinci "Yargıtay" girilemez
  UNIQUE NULLS NOT DISTINCT (ust_mahkeme_id, ad)
);

CREATE TABLE mevzuat (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tur                   text NOT NULL CHECK (tur IN ('kanun', 'khk', 'cbk', 'tuzuk', 'yonetmelik',
                                                     'teblig', 'uluslararasi', 'diger')),
  numara                text,                                  -- '6098'; yönetmeliklerde çoğu zaman yok
  ad                    tr_metin NOT NULL,                     -- 'Türk Borçlar Kanunu'
  kisa_ad               text,                                  -- 'TBK'
  resmi_gazete_tarihi   date,
  mevzuat_url           https_url,
  olusturma_zamani      timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tur, numara)          -- bilerek NULLS DISTINCT: numarasız birden çok yönetmelik olabilir
);

CREATE TABLE karar (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mahkeme_id             bigint NOT NULL REFERENCES mahkeme(id),   -- daire düğümü de olabilir
  esas_no                text CHECK (esas_no  ~ '^[0-9]{4}/[0-9]{1,7}$'),
  karar_no               text CHECK (karar_no ~ '^[0-9]{4}/[0-9]{1,7}$'),
  karar_tarihi           date NOT NULL CHECK (karar_tarihi >= DATE '1920-01-01'),
  slug                   slug NOT NULL UNIQUE,                 -- 'yargitay-3-hd-2024-1234'
  konu                   tr_metin NOT NULL,
  ozet                   text,
  tam_metin              text,                                 -- anonimleştirilmiş metin
  tam_metin_dosya_id     uuid REFERENCES dosya(id),            -- PDF/UDF (Soru: metin mi dosya mı?)
  ofis_davasi            boolean NOT NULL DEFAULT false,
  anonimlestirildi       boolean NOT NULL DEFAULT false,
  anonimlestiren_id      bigint REFERENCES kullanici(id),
  anonimlestirme_zamani  timestamptz,
  durum                  icerik_durumu NOT NULL DEFAULT 'taslak',
  yayin_tarihi           timestamptz,
  olusturan_id           bigint NOT NULL REFERENCES kullanici(id),
  guncelleyen_id         bigint REFERENCES kullanici(id),
  onaylayan_id           bigint REFERENCES kullanici(id),
  onay_zamani            timestamptz,
  olusturma_zamani       timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani      timestamptz NOT NULL DEFAULT now(),
  arama                  tsvector GENERATED ALWAYS AS (
                           setweight(to_tsvector('turkish', coalesce(konu, '')), 'A') ||
                           setweight(to_tsvector('turkish', coalesce(ozet, '')), 'B') ||
                           setweight(to_tsvector('turkish', coalesce(tam_metin, '')), 'C')) STORED,
  UNIQUE (mahkeme_id, karar_no),
  -- KVKK kapısı: anonimleştirildiği işaretlenmeden ve onaysız karar yayına alınamaz
  CHECK (durum <> 'yayinda' OR (yayin_tarihi IS NOT NULL AND anonimlestirildi AND onaylayan_id IS NOT NULL)),
  CHECK (anonimlestirildi = (anonimlestiren_id IS NOT NULL)),
  CHECK ((anonimlestiren_id IS NULL) = (anonimlestirme_zamani IS NULL)),
  CHECK ((onaylayan_id IS NULL) = (onay_zamani IS NULL))
);
CREATE INDEX karar_mahkeme_idx  ON karar (mahkeme_id, karar_tarihi DESC);
CREATE INDEX karar_tarih_idx    ON karar (karar_tarihi DESC) WHERE durum = 'yayinda';
CREATE INDEX karar_arama_idx    ON karar USING gin (arama);

CREATE TABLE karar_mevzuat (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  karar_id    bigint NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  mevzuat_id  bigint NOT NULL REFERENCES mevzuat(id),
  madde       text CHECK (length(madde) <= 30),                -- '49', '49/2', 'geçici 1'; NULL = kanunun bütünü
  UNIQUE NULLS NOT DISTINCT (karar_id, mevzuat_id, madde)      -- "kanunun bütünü" bağı da bir kez
);
CREATE INDEX karar_mevzuat_mevzuat_idx ON karar_mevzuat (mevzuat_id);

CREATE TABLE karar_etiket (
  karar_id   bigint NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  etiket_id  bigint NOT NULL REFERENCES etiket(id),
  PRIMARY KEY (karar_id, etiket_id)
);
CREATE INDEX karar_etiket_etiket_idx ON karar_etiket (etiket_id);

CREATE TABLE karar_calisma_alani (
  karar_id          bigint NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  calisma_alani_id  bigint NOT NULL REFERENCES calisma_alani(id),
  PRIMARY KEY (karar_id, calisma_alani_id)
);
CREATE INDEX karar_calisma_alani_alan_idx ON karar_calisma_alani (calisma_alani_id);

-- Opsiyonel (Soru: hangi avukatın davası gösterilecek mi?)
CREATE TABLE karar_kisi (
  karar_id  bigint NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  kisi_id   bigint NOT NULL REFERENCES kisi(id),
  PRIMARY KEY (karar_id, kisi_id)
);
CREATE INDEX karar_kisi_kisi_idx ON karar_kisi (kisi_id);

-- Opsiyonel (Soru: birden fazla avukat yorumu?)
CREATE TABLE karar_yorum (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  karar_id           bigint NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  kisi_id            bigint NOT NULL REFERENCES kisi(id),
  icerik             jsonb NOT NULL CHECK (jsonb_typeof(icerik) = 'object'),
  sira               smallint NOT NULL DEFAULT 0,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX karar_yorum_karar_idx ON karar_yorum (karar_id, sira);

-- Makale <-> karar karşılıklı bağlantı
CREATE TABLE yayin_karar (
  yayin_id  bigint NOT NULL REFERENCES yayin(id) ON DELETE CASCADE,
  karar_id  bigint NOT NULL REFERENCES karar(id) ON DELETE CASCADE,
  PRIMARY KEY (yayin_id, karar_id)
);
CREATE INDEX yayin_karar_karar_idx ON yayin_karar (karar_id);


-- ---------------------------------------------------------------------
-- 9. Sabit sayfalar (Hakkımızda, KVKK, çerez, yasal uyarı, Değerlerimiz ...)
-- ---------------------------------------------------------------------

CREATE TABLE sayfa (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anahtar            text NOT NULL UNIQUE CHECK (anahtar ~ '^[a-z0-9_]+$'),   -- 'ana_sayfa', 'hakkimizda', 'kvkk'
  aktif              boolean NOT NULL DEFAULT true,
  noindex            boolean NOT NULL DEFAULT false,
  siralama           smallint NOT NULL DEFAULT 0,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sayfa_ceviri (
  sayfa_id      bigint NOT NULL REFERENCES sayfa(id) ON DELETE CASCADE,
  dil           text NOT NULL REFERENCES dil(kod),
  slug          slug,                                          -- ana sayfa için NULL (/tr)
  baslik        tr_metin NOT NULL,
  bloklar       jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(bloklar) = 'array'),
  seo_baslik    text CHECK (length(seo_baslik) <= 70),
  seo_aciklama  text CHECK (length(seo_aciklama) <= 170),
  og_dosya_id   uuid REFERENCES dosya(id),
  PRIMARY KEY (sayfa_id, dil),
  UNIQUE NULLS NOT DISTINCT (dil, slug)                        -- her dilde tek bir kök (NULL slug) sayfa
);


-- ---------------------------------------------------------------------
-- 10. İletişim mesajları (saklama süreli) ve kariyer (opsiyonel)
-- ---------------------------------------------------------------------

CREATE TABLE iletisim_mesaji (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad                   tr_metin NOT NULL CHECK (length(ad) <= 120),
  eposta               eposta NOT NULL,
  telefon              telefon,
  konu_turu            text NOT NULL CHECK (konu_turu IN ('genel', 'randevu', 'arabuluculuk', 'diger')),
  mesaj                text NOT NULL CHECK (length(mesaj) BETWEEN 1 AND 5000),
  durum                text NOT NULL DEFAULT 'yeni' CHECK (durum IN ('yeni', 'okundu', 'cevaplandi', 'spam')),
  cevaplayan_kisi_id   bigint REFERENCES kisi(id),
  cevap_tarihi         timestamptz,
  -- "kvkk_onay" yerine: gösterilen aydınlatma metninin sürümü (aydınlatma rıza değildir; avukat görüşü alınmalı)
  aydinlatma_surumu    text NOT NULL,
  ip_hmac              bytea CHECK (octet_length(ip_hmac) = 32),   -- yalnızca spam sınırlaması için
  olusturma_zamani     timestamptz NOT NULL DEFAULT now(),
  saklama_bitis        timestamptz NOT NULL DEFAULT now() + interval '1 year',  -- süre abinlerce belirlenecek
  CHECK (saklama_bitis > olusturma_zamani),
  CHECK (durum <> 'cevaplandi' OR (cevaplayan_kisi_id IS NOT NULL AND cevap_tarihi IS NOT NULL))
);
CREATE INDEX iletisim_mesaji_durum_idx   ON iletisim_mesaji (durum, olusturma_zamani DESC);
CREATE INDEX iletisim_mesaji_saklama_idx ON iletisim_mesaji (saklama_bitis);

CREATE TABLE ilan (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  calisma_tipi       text CHECK (calisma_tipi IN ('tam_zamanli', 'yari_zamanli', 'staj')),
  lokasyon           tr_metin,
  durum              icerik_durumu NOT NULL DEFAULT 'taslak',
  yayin_tarihi       timestamptz,
  kapanis_tarihi     timestamptz,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (durum <> 'yayinda' OR yayin_tarihi IS NOT NULL),
  CHECK (kapanis_tarihi IS NULL OR yayin_tarihi IS NULL OR kapanis_tarihi > yayin_tarihi)
);
CREATE TABLE ilan_ceviri (
  ilan_id   bigint NOT NULL REFERENCES ilan(id) ON DELETE CASCADE,
  dil       text NOT NULL REFERENCES dil(kod),
  baslik    tr_metin NOT NULL,
  aciklama  jsonb NOT NULL CHECK (jsonb_typeof(aciklama) = 'object'),
  PRIMARY KEY (ilan_id, dil)
);

-- CV kişisel veri: dosya yalnızca 'ozel' erişimli olabilir (bileşik FK + sabit üretilmiş sütun)
CREATE TABLE basvuru (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ilan_id            bigint REFERENCES ilan(id),               -- NULL = genel başvuru
  ad                 tr_metin NOT NULL,
  eposta             eposta NOT NULL,
  telefon            telefon,
  cv_dosya_id        uuid,
  cv_erisim          text GENERATED ALWAYS AS ('ozel') STORED,
  aydinlatma_surumu  text NOT NULL,
  olusturma_zamani   timestamptz NOT NULL DEFAULT now(),
  saklama_bitis      timestamptz NOT NULL DEFAULT now() + interval '6 months',
  FOREIGN KEY (cv_dosya_id, cv_erisim) REFERENCES dosya (id, erisim),
  CHECK (saklama_bitis > olusturma_zamani)
);
CREATE INDEX basvuru_ilan_idx    ON basvuru (ilan_id);
CREATE INDEX basvuru_saklama_idx ON basvuru (saklama_bitis);
CREATE INDEX basvuru_cv_idx      ON basvuru (cv_dosya_id);


-- ---------------------------------------------------------------------
-- 11. Açılır duyuru (R&S pop-up). Ad "duyuru" değil: yayin.tur = 'duyuru' ile karışmasın.
--     Statik sitede tarih kontrolü istemci tarafında yapılır (derleme anı ≠ gösterim anı).
-- ---------------------------------------------------------------------

CREATE TABLE acilir_duyuru (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gorsel_dosya_id     uuid REFERENCES dosya(id),
  baglanti            text CHECK (baglanti ~ '^(/($|[^/])|https://)'),
  baslangic           timestamptz NOT NULL,
  bitis               timestamptz NOT NULL,
  otomatik_kapanma_sn smallint CHECK (otomatik_kapanma_sn BETWEEN 3 AND 60),
  aktif               boolean NOT NULL DEFAULT true,
  olusturma_zamani    timestamptz NOT NULL DEFAULT now(),
  guncelleme_zamani   timestamptz NOT NULL DEFAULT now(),
  CHECK (bitis > baslangic),
  -- Aynı anda en fazla bir aktif pop-up (eklenti gerekmez: yalnızca aralık operatörü)
  EXCLUDE USING gist (tstzrange(baslangic, bitis) WITH &&) WHERE (aktif)
);
CREATE TABLE acilir_duyuru_ceviri (
  acilir_duyuru_id  bigint NOT NULL REFERENCES acilir_duyuru(id) ON DELETE CASCADE,
  dil               text NOT NULL REFERENCES dil(kod),
  baslik            tr_metin NOT NULL,
  metin             text,
  buton_etiketi     text,
  PRIMARY KEY (acilir_duyuru_id, dil)
);


-- ---------------------------------------------------------------------
-- 12. Site ayarları, yönlendirme, derleme kuyruğu, değişiklik kaydı, dosya silme kuyruğu
-- ---------------------------------------------------------------------

-- Adres, telefon, WhatsApp, sosyal medya. Dile bağlı değer: {"tr": "...", "en": "..."}
CREATE TABLE site_ayar (
  anahtar            text PRIMARY KEY CHECK (anahtar ~ '^[a-z0-9_.]+$'),
  deger              jsonb NOT NULL,
  guncelleyen_id     bigint REFERENCES kullanici(id),
  guncelleme_zamani  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE yonlendirme (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kaynak_yol        text NOT NULL UNIQUE CHECK (kaynak_yol ~ '^/($|[^/])'),
  hedef             text NOT NULL CHECK (hedef ~ '^(/($|[^/])|https://)'),  -- '//evil' reddedilir
  durum_kodu        smallint NOT NULL DEFAULT 301 CHECK (durum_kodu IN (301, 302, 308)),
  olusturma_zamani  timestamptz NOT NULL DEFAULT now(),
  CHECK (kaynak_yol <> hedef)
);
-- Zincir ve döngü engeli: hedef başka bir yönlendirmenin kaynağı olamaz (ve tersi)
CREATE FUNCTION yonlendirme_zincir_kontrol() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM yonlendirme WHERE kaynak_yol = NEW.hedef AND id <> NEW.id)
     OR EXISTS (SELECT 1 FROM yonlendirme WHERE hedef = NEW.kaynak_yol AND id <> NEW.id) THEN
    RAISE EXCEPTION 'yönlendirme zinciri/döngüsü: % -> %', NEW.kaynak_yol, NEW.hedef
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER yonlendirme_zincir BEFORE INSERT OR UPDATE ON yonlendirme
  FOR EACH ROW EXECUTE FUNCTION yonlendirme_zincir_kontrol();

-- rapor §9.2 build_jobs: "Yayımla" statik derlemeyi kuyruğa ekler
CREATE TABLE derleme_isi (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  durum             text NOT NULL DEFAULT 'kuyrukta' CHECK (durum IN ('kuyrukta', 'calisiyor', 'basarili', 'hatali')),
  isteyen_id        bigint REFERENCES kullanici(id),
  olusturma_zamani  timestamptz NOT NULL DEFAULT now(),
  baslama_zamani    timestamptz,
  bitis_zamani      timestamptz,
  log_ozeti         text,
  CHECK (durum = 'kuyrukta' OR baslama_zamani IS NOT NULL),
  CHECK (durum NOT IN ('basarili', 'hatali') OR bitis_zamani IS NOT NULL)
);
CREATE UNIQUE INDEX derleme_isi_tek_calisan ON derleme_isi ((true)) WHERE durum = 'calisiyor';
CREATE INDEX derleme_isi_kuyruk_idx ON derleme_isi (olusturma_zamani) WHERE durum = 'kuyrukta';

-- Kim neyi ne zaman değiştirdi (Açık Sorular: Kullanıcı / Düşük). Kullanıcı silinmediği için FK NO ACTION.
CREATE TABLE degisiklik_log (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kullanici_id      bigint REFERENCES kullanici(id),
  eylem             text NOT NULL CHECK (eylem IN ('olustur', 'guncelle', 'sil', 'yayinla', 'yayindan_kaldir',
                                                   'onayla', 'onaya_gonder', 'giris', 'giris_basarisiz', 'cikis',
                                                   'rol_degistir', 'sifre_degistir', 'kisisel_veri_sil')),
  varlik_turu       text,
  varlik_id         text,
  degisiklikler     jsonb,
  olusturma_zamani  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX degisiklik_log_varlik_idx ON degisiklik_log (varlik_turu, varlik_id);
CREATE INDEX degisiklik_log_zaman_idx  ON degisiklik_log (olusturma_zamani);

-- Diskteki dosyayı uygulama siler; DB yalnızca kuyruğa yazar
CREATE TABLE dosya_silme_kuyrugu (
  depolama_anahtari  text PRIMARY KEY,
  eklenme_zamani     timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------
-- 13. İş kuralı fonksiyonları
-- ---------------------------------------------------------------------

-- Çeviri zorunluluğu kuralları: hangi ana tabloda hangi satırlar varsayılan dil çevirisi ister.
-- kisi bilerek yok: adı dil bağımsız, kisi_ceviri yalnızca isteğe bağlı biyografi taşır.
CREATE TABLE ceviri_kurali (
  ana           text PRIMARY KEY,
  kosul         text NOT NULL,      -- ana satırda (a.)
  ceviri_kosul  text NOT NULL       -- çeviri satırında (c.)
);
INSERT INTO ceviri_kurali VALUES
  ('yayin',          'a.durum = ''yayinda''', 'c.hazir'),
  ('bulten_sayisi',  'a.durum = ''yayinda''', 'true'),
  ('ilan',           'a.durum = ''yayinda''', 'true'),
  ('calisma_alani',  'a.gorunur',             'true'),
  ('sektor',         'a.gorunur',             'true'),
  ('sayfa',          'a.aktif',               'true'),
  ('acilir_duyuru',  'a.aktif',               'true'),
  ('unvan',          'true',                  'true'),
  ('egitim',         'true',                  'true'),
  ('deneyim',        'true',                  'true'),
  ('etiket',         'true',                  'true');

-- Tüm kurallara göre varsayılan dilde eksik çevirisi olan kayıtlar (CI / dil değişimi kontrolü)
CREATE FUNCTION ceviri_eksikleri() RETURNS TABLE (ana text, ana_id bigint)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  r ceviri_kurali;
BEGIN
  FOR r IN SELECT * FROM ceviri_kurali LOOP
    RETURN QUERY EXECUTE format(
      'SELECT %1$L::text, a.id FROM %1$I a WHERE (%2$s)
         AND NOT EXISTS (SELECT 1 FROM %3$I c WHERE c.%4$I = a.id AND c.dil = varsayilan_dil() AND (%5$s))',
      r.ana, r.kosul, r.ana || '_ceviri', r.ana || '_id', r.ceviri_kosul);
  END LOOP;
END $$;

-- Varsayılan dil çevirisi zorunluluğu (ertelenmiş kısıt tetikleyicisi)
--   TG_ARGV[0] ana tablo · [1] ana satırda koşul (a.) · [2] çeviri satırında koşul (c.)
CREATE FUNCTION ceviri_zorunlu_kontrol() RETURNS trigger
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
    'SELECT EXISTS (SELECT 1 FROM %1$I a WHERE a.id = $1 AND (%2$s)
       AND NOT EXISTS (SELECT 1 FROM %3$I c WHERE c.%4$I = a.id AND c.dil = varsayilan_dil() AND (%5$s)))',
    ana, TG_ARGV[1], ana || '_ceviri', ana || '_id', TG_ARGV[2])
  INTO eksik USING ana_id;
  IF eksik THEN
    RAISE EXCEPTION '% #% varsayılan dilde (%) hazır çeviri olmadan yayında/görünür olamaz',
      ana, ana_id, varsayilan_dil() USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;

-- Onaylayan yalnızca aktif editor/yonetici olabilir (yazar kendi içeriğini yayına alamaz)
CREATE FUNCTION onaylayan_yetki_kontrol() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.onaylayan_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.onaylayan_id IS DISTINCT FROM OLD.onaylayan_id)
     AND NOT EXISTS (SELECT 1 FROM kullanici k
                     WHERE k.id = NEW.onaylayan_id AND k.aktif AND k.rol IN ('yonetici', 'editor')) THEN
    RAISE EXCEPTION 'kullanıcı #% onay/yayın yetkisine sahip değil', NEW.onaylayan_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER yayin_onaylayan_yetki BEFORE INSERT OR UPDATE ON yayin
  FOR EACH ROW EXECUTE FUNCTION onaylayan_yetki_kontrol();
CREATE TRIGGER karar_onaylayan_yetki BEFORE INSERT OR UPDATE ON karar
  FOR EACH ROW EXECUTE FUNCTION onaylayan_yetki_kontrol();

-- API'nin "bu kullanıcı bu yayını düzenleyebilir mi?" sorusu (Soru: avukat yalnızca kendi içeriği)
CREATE FUNCTION yayin_duzenleyebilir_mi(p_kullanici bigint, p_yayin bigint) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM kullanici k
    WHERE k.id = p_kullanici AND k.aktif
      AND (k.rol IN ('yonetici', 'editor')
           OR EXISTS (SELECT 1 FROM yayin y
                      WHERE y.id = p_yayin AND y.durum IN ('taslak', 'incelemede')
                        AND (y.olusturan_id = k.id
                             OR EXISTS (SELECT 1 FROM yayin_yazar yy
                                        WHERE yy.yayin_id = y.id AND yy.kisi_id = k.kisi_id)))))
$$;

-- KVKK saklama süresi: günlük systemd timer / cron ile çağrılır: SELECT * FROM kisisel_veri_temizle();
CREATE FUNCTION kisisel_veri_temizle(log_saklama interval DEFAULT interval '2 years')
RETURNS TABLE (tablo text, silinen bigint)
LANGUAGE plpgsql AS $$
DECLARE
  n bigint;
BEGIN
  DELETE FROM oturum WHERE son_kullanma < now();
  GET DIAGNOSTICS n = ROW_COUNT; tablo := 'oturum'; silinen := n; RETURN NEXT;

  DELETE FROM iletisim_mesaji WHERE saklama_bitis < now();
  GET DIAGNOSTICS n = ROW_COUNT; tablo := 'iletisim_mesaji'; silinen := n; RETURN NEXT;

  WITH b AS (DELETE FROM basvuru WHERE saklama_bitis < now() RETURNING cv_dosya_id),
       d AS (DELETE FROM dosya f USING b
             WHERE f.id = b.cv_dosya_id
               AND NOT EXISTS (SELECT 1 FROM basvuru x WHERE x.cv_dosya_id = f.id AND x.saklama_bitis >= now())
             RETURNING f.depolama_anahtari)
  INSERT INTO dosya_silme_kuyrugu (depolama_anahtari) SELECT depolama_anahtari FROM d
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT; tablo := 'basvuru_cv_dosyasi'; silinen := n; RETURN NEXT;

  DELETE FROM degisiklik_log WHERE olusturma_zamani < now() - log_saklama;
  GET DIAGNOSTICS n = ROW_COUNT; tablo := 'degisiklik_log'; silinen := n; RETURN NEXT;
END $$;


-- ---------------------------------------------------------------------
-- 14. Tetikleyicilerin bağlanması
-- ---------------------------------------------------------------------

-- Sonradan eklenen tablolar için migration'da çağrılır (GSI'deki DO bloğu yalnızca kurulum anını kapsıyordu)
CREATE FUNCTION guncelleme_tetikleyicisi_ekle(tablo regclass) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION guncelleme_zamani_ata()',
                 tablo::text || '_guncelleme', tablo);
END $$;

DO $$
DECLARE
  t text;
  r record;
BEGIN
  -- a) guncelleme_zamani sütunu olan her tablo
  FOR t IN
    SELECT c.relname FROM pg_class c
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'guncelleme_zamani' AND NOT a.attisdropped
    WHERE c.relnamespace = current_schema()::regnamespace AND c.relkind = 'r'
  LOOP
    PERFORM guncelleme_tetikleyicisi_ekle(t::regclass);
  END LOOP;

  -- b) her *_ceviri tablosu değişince ana kaydın guncelleme_zamani'ni ilerlet
  FOR t IN
    SELECT c.relname FROM pg_class c
    WHERE c.relnamespace = current_schema()::regnamespace AND c.relkind = 'r' AND c.relname LIKE '%\_ceviri'
      AND EXISTS (SELECT 1 FROM pg_attribute a
                  WHERE a.attrelid = (left(c.relname, -7))::regclass AND a.attname = 'guncelleme_zamani')
  LOOP
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I
                    FOR EACH ROW EXECUTE FUNCTION ceviri_ust_guncelle()', t || '_ust_guncelle', t);
  END LOOP;

  -- c) varsayılan dil çevirisi zorunluluğu: kurallar ceviri_kurali tablosunda
  --    (yeni kural: tabloya satır ekle + aynı iki CREATE CONSTRAINT TRIGGER'ı migration'da çalıştır)
  FOR r IN SELECT ana, kosul, ceviri_kosul AS ckosul FROM ceviri_kurali
  LOOP
    EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER INSERT OR UPDATE ON %I
                    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
                    EXECUTE FUNCTION ceviri_zorunlu_kontrol(%L, %L, %L)',
                   r.ana || '_ceviri_zorunlu', r.ana, r.ana, r.kosul, r.ckosul);
    EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER UPDATE OR DELETE ON %I
                    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
                    EXECUTE FUNCTION ceviri_zorunlu_kontrol(%L, %L, %L)',
                   r.ana || '_ceviri_silinemez', r.ana || '_ceviri', r.ana, r.kosul, r.ckosul);
  END LOOP;
END $$;

COMMIT;
