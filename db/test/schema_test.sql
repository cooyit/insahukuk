-- =====================================================================
--  insa_schema_v2.sql doğrulama testleri (PostgreSQL 16)
--  psql -X -d insa_v2 -f insa_v2_tests.sql 2>&1
--  Beklenen hata = "ERROR" satırı; ertelenmiş kısıtlar hatayı COMMIT'te verir.
-- =====================================================================
\set ON_ERROR_STOP 0
\pset footer off

\echo '=== V00 Fikstürler ==='
BEGIN;
INSERT INTO unvan (kod, sira) VALUES ('kurucu-ortak', 1), ('ortak', 2), ('avukat', 3), ('stajyer-avukat', 4);
INSERT INTO unvan_ceviri (unvan_id, dil, ad)
SELECT u.id, d.dil, CASE d.dil WHEN 'tr' THEN initcap(replace(u.kod, '-', ' ')) ELSE 'EN ' || u.kod END
FROM unvan u CROSS JOIN (VALUES ('tr'), ('en')) d(dil);
INSERT INTO kisi (slug, ad, soyad, unvan_id, avukat_mi, arabulucu_mu, baro_adi, baro_sicil_no, arabulucu_sicil_no, eposta, siralama) VALUES
  ('mehmet-insa',  'Mehmet', 'İnşa',   1, true,  true,  'İstanbul Barosu', '12345', '6789', 'mehmet@insa.av.tr', 1),
  ('zeynep-cakir', 'Zeynep', 'Çakır',  3, true,  false, 'İstanbul Barosu', '23456', NULL,   'zeynep@insa.av.tr', 1),
  ('ali-ozturk',   'Ali',    'Öztürk', 3, true,  false, NULL, NULL, NULL, NULL, 2),
  ('ilker-sahin',  'İlker',  'Şahin',  3, false, true,  NULL, NULL, '1111', NULL, 0),
  ('can-yilmaz',   'Can',    'Yılmaz', 4, false, false, NULL, NULL, NULL, NULL, 0);
INSERT INTO kullanici (kisi_id, eposta, gorunen_ad, sifre_hash, rol) VALUES
  (NULL, 'kaplan@insa.av.tr',  'Kaplan',       '$argon2id$v=19$x', 'yonetici'),
  (1,    'mehmet@insa.av.tr',  'Mehmet İnşa',  '$argon2id$v=19$x', 'editor'),
  (2,    'zeynep@insa.av.tr',  'Zeynep Çakır', '$argon2id$v=19$x', 'yazar');
INSERT INTO kisi_telefon (kisi_id, tur, numara, sitede_goster) VALUES (1, 'dahili', '201', true), (1, 'cep', '+905321112233', false);
INSERT INTO egitim (kisi_id, baslangic_yili, bitis_yili, sira) VALUES (1, 1995, 1999, 1);
INSERT INTO egitim_ceviri VALUES (1, 'tr', 'İstanbul Üniversitesi', 'Hukuk Fakültesi', 'Lisans'),
                                 (1, 'en', 'Istanbul University', 'Faculty of Law', 'LL.B.');
INSERT INTO deneyim (kisi_id, firma_adi, baslangic_yili, bitis_yili) VALUES (1, 'Örnek Holding A.Ş.', 2000, 2010);
INSERT INTO deneyim_ceviri VALUES (1, 'tr', 'Hukuk Müşaviri', NULL);
-- Çalışma alanı ağacı: Kamu hukuku > Ceza, İmar · Özel hukuk > Borçlar, Gayrimenkul
INSERT INTO calisma_alani (ust_alan_id, siralama) VALUES (NULL, 1), (NULL, 2);
INSERT INTO calisma_alani (ust_alan_id, siralama) VALUES (1, 1), (1, 2), (2, 1), (2, 2);
INSERT INTO calisma_alani_ceviri (calisma_alani_id, dil, slug, ad) VALUES
  (1, 'tr', 'kamu-hukuku', 'Kamu Hukuku'), (2, 'tr', 'ozel-hukuk', 'Özel Hukuk'),
  (3, 'tr', slug_tr('Ceza Hukuku'), 'Ceza Hukuku'), (4, 'tr', slug_tr('İmar Hukuku'), 'İmar Hukuku'),
  (5, 'tr', slug_tr('Borçlar Hukuku'), 'Borçlar Hukuku'), (6, 'tr', slug_tr('Gayrimenkul Hukuku'), 'Gayrimenkul Hukuku'),
  (3, 'en', 'criminal-law', 'Criminal Law');
INSERT INTO kisi_calisma_alani VALUES (1, 4), (1, 6), (2, 5);
INSERT INTO etiket DEFAULT VALUES;
INSERT INTO etiket_ceviri VALUES (1, 'tr', 'kira', 'Kira');
INSERT INTO dosya (id, tur, depolama_anahtari, orijinal_ad, mime_tur, boyut, sha256, genislik, yukseklik, yukleyen_id) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'gorsel', '2026/10/kapak.webp', 'kapak.webp', 'image/webp', 1000, sha256('k'), 1200, 630, 1);
INSERT INTO mahkeme (ust_mahkeme_id, tur, ad, kisa_ad) VALUES (NULL, 'yargitay', 'Yargıtay', 'Y.');
INSERT INTO mahkeme (ust_mahkeme_id, tur, ad, kisa_ad) VALUES (1, 'yargitay', '3. Hukuk Dairesi', 'Y. 3. HD');
INSERT INTO mevzuat (tur, numara, ad, kisa_ad) VALUES ('kanun', '6098', 'Türk Borçlar Kanunu', 'TBK');
COMMIT;
SELECT (SELECT count(*) FROM kisi) AS kisi, (SELECT count(*) FROM calisma_alani) AS alan,
       (SELECT count(*) FROM kullanici) AS kullanici, (SELECT count(*) FROM mahkeme) AS mahkeme;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V01 İki seviyeli çalışma alanı ağacı ==='
\echo '--- a) 3. seviye (Ceza[3] altına) -> reddedilmeli'
INSERT INTO calisma_alani (ust_alan_id) VALUES (3);
\echo '--- b) altı olan kök (Kamu hukuku[1]) başka köke bağlanırsa -> reddedilmeli'
UPDATE calisma_alani SET ust_alan_id = 2 WHERE id = 1;
\echo '--- c) yaprak (İmar[4]) diğer köke taşınabilir -> kabul'
BEGIN; UPDATE calisma_alani SET ust_alan_id = 2 WHERE id = 4 RETURNING id, ust_alan_id, seviye; ROLLBACK;
\echo '--- d) avukata bağlı alan silinirse -> reddedilmeli (NO ACTION; gorunur=false kullanılmalı)'
DELETE FROM calisma_alani WHERE id = 6;
\echo '--- e) ağaç sorgusu (Türkçe sıralama)'
SELECT ust.ad AS ust_alan, string_agg(alt.ad, ', ' ORDER BY ca.siralama) AS alt_alanlar
FROM calisma_alani ca
JOIN calisma_alani_ceviri alt ON alt.calisma_alani_id = ca.id AND alt.dil = 'tr'
JOIN calisma_alani_ceviri ust ON ust.calisma_alani_id = ca.ust_alan_id AND ust.dil = 'tr'
GROUP BY ust.ad ORDER BY ust.ad;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V02 Yayın: yazarlar, dış yazar, etiket, varsayılan dil çevirisi zorunluluğu ==='
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, kapak_dosya_id, olusturan_id, onaylayan_id, onay_zamani)
VALUES ('makale', 'yayinda', now(), '00000000-0000-0000-0000-0000000000a1', 3, 2, now());
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik, ozet, icerik)
VALUES (currval('yayin_id_seq'), 'tr', slug_tr('Kira Tespit Davalarında Güncel Yargıtay Kararları'),
        'Kira Tespit Davalarında Güncel Yargıtay Kararları', 'Özet', '{"type":"doc"}');
INSERT INTO yayin_yazar (yayin_id, kisi_id, sira) VALUES (currval('yayin_id_seq'), 2, 1);
INSERT INTO yayin_yazar (yayin_id, dis_yazar_adi, dis_yazar_unvan, sira)
VALUES (currval('yayin_id_seq'), 'Ayşe Demir', 'Prof. Dr., Örnek Üniversitesi', 2);
INSERT INTO yayin_etiket VALUES (currval('yayin_id_seq'), 1);
INSERT INTO yayin_calisma_alani VALUES (currval('yayin_id_seq'), 6);
COMMIT;
SELECT y.id, y.tur, y.durum, yc.slug,
       string_agg(coalesce(k.ad || ' ' || k.soyad, yy.dis_yazar_adi), ' & ' ORDER BY yy.sira) AS yazarlar
FROM yayin y JOIN yayin_ceviri yc ON yc.yayin_id = y.id AND yc.dil = 'tr'
JOIN yayin_yazar yy ON yy.yayin_id = y.id LEFT JOIN kisi k ON k.id = yy.kisi_id
GROUP BY y.id, y.tur, y.durum, yc.slug;
\echo '--- a) TR çevirisi olmadan yayında makale -> COMMIT reddetmeli'
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, olusturan_id, onaylayan_id, onay_zamani) VALUES ('haber', 'yayinda', now(), 1, 1, now());
COMMIT;
\echo '--- b) yalnızca EN çevirili yayında makale -> COMMIT reddetmeli'
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, olusturan_id, onaylayan_id, onay_zamani) VALUES ('haber', 'yayinda', now(), 1, 1, now());
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik) VALUES (currval('yayin_id_seq'), 'en', 'only-english', 'Only English');
COMMIT;
\echo '--- c) TR çevirisi var ama hazir=false -> COMMIT reddetmeli'
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, olusturan_id, onaylayan_id, onay_zamani) VALUES ('haber', 'yayinda', now(), 1, 1, now());
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik, hazir) VALUES (currval('yayin_id_seq'), 'tr', 'yarim-haber', 'Yarım', false);
COMMIT;
\echo '--- d) EN taslak (yalnız EN) TASLAK durumda -> kabul (zorunluluk yalnızca yayındakiler için)'
BEGIN;
INSERT INTO yayin (tur, olusturan_id) VALUES ('haber', 3);
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik) VALUES (currval('yayin_id_seq'), 'en', 'draft-en', 'Draft EN');
COMMIT;
\echo '--- e) yayındaki makalenin TR çevirisini silmek -> COMMIT reddetmeli'
BEGIN;
DELETE FROM yayin_ceviri WHERE yayin_id = 1 AND dil = 'tr';
COMMIT;
\echo '--- f) aynı yayında iki yazar aynı sira -> reddedilmeli (DEFERRABLE, COMMIT anında)'
BEGIN;
INSERT INTO yayin_yazar (yayin_id, kisi_id, sira) VALUES (1, 1, 1);
COMMIT;
\echo '--- g) yazar sırası takası tek işlemde -> kabul'
BEGIN;
UPDATE yayin_yazar SET sira = 3 - sira WHERE yayin_id = 1;
COMMIT;
SELECT sira, coalesce(kisi_id::text, dis_yazar_adi) AS yazar FROM yayin_yazar WHERE yayin_id = 1 ORDER BY sira;
\echo '--- h) hem kisi_id hem dis_yazar_adi -> reddedilmeli'
INSERT INTO yayin_yazar (yayin_id, kisi_id, dis_yazar_adi, sira) VALUES (1, 3, 'X', 9);
\echo '--- i) yazarı olduğu yayın varken kisi silinirse -> reddedilmeli (kisi 3: kullanıcı hesabı yok, yalnız yazar bağı)'
BEGIN;
INSERT INTO yayin_yazar (yayin_id, kisi_id, sira) VALUES (1, 3, 3);
DELETE FROM kisi WHERE id = 3;
ROLLBACK;
\echo '--- j) yazar bağı olmayan kisi silinirse: kisi_calisma_alani, telefon, egitim CASCADE (kisi 1 kullanıcıya bağlı -> reddedilmeli)'
DELETE FROM kisi WHERE id = 1;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V03 Yayın türlerine özgü alanlar ==='
\echo '--- a) kitap + geçerli ISBN-13 (9780306406157) -> kabul'
BEGIN;
INSERT INTO yayin (tur, yayinevi, isbn, basim_yili, olusturan_id) VALUES ('kitap', 'Örnek Yayınevi', '9780306406157', 2024, 2) RETURNING id, tur, isbn;
ROLLBACK;
\echo '--- b) kitap + hatalı ISBN (9780306406158) -> reddedilmeli'
INSERT INTO yayin (tur, isbn, olusturan_id) VALUES ('kitap', '9780306406158', 2);
\echo '--- c) ISBN-10 (0306406152) -> kabul'
BEGIN; INSERT INTO yayin (tur, isbn, olusturan_id) VALUES ('kitap', '0306406152', 2) RETURNING isbn; ROLLBACK;
\echo '--- d) makaleye ISBN -> reddedilmeli'
INSERT INTO yayin (tur, isbn, olusturan_id) VALUES ('makale', '9780306406157', 2);
\echo '--- e) video ama video_url/video_dosya_id yok -> reddedilmeli'
INSERT INTO yayin (tur, olusturan_id) VALUES ('video', 2);
\echo '--- f) video + YouTube URL -> kabul'
BEGIN; INSERT INTO yayin (tur, video_url, olusturan_id) VALUES ('video', 'https://www.youtube-nocookie.com/embed/abc', 2) RETURNING id, tur; ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V04 Roller, sahiplik, onay ==='
\echo '--- a) yazar rolündeki kullanıcı (3) onaylayan olamaz -> reddedilmeli'
INSERT INTO yayin (tur, durum, yayin_tarihi, olusturan_id, onaylayan_id, onay_zamani) VALUES ('haber', 'yayinda', now(), 3, 3, now());
\echo '--- b) onaysız yayında -> reddedilmeli'
INSERT INTO yayin (tur, durum, yayin_tarihi, olusturan_id) VALUES ('haber', 'yayinda', now(), 3);
\echo '--- c) yazar rolü kisi bağı olmadan -> reddedilmeli'
INSERT INTO kullanici (eposta, gorunen_ad, sifre_hash, rol) VALUES ('x@insa.av.tr', 'X', '$argon2id$x', 'yazar');
\echo '--- d) yayin_duzenleyebilir_mi: yazar(3) kendi yazdığı yayında(1, yayında) / kendi taslağında / editor(2)'
SELECT yayin_duzenleyebilir_mi(3, 1) AS yazar_yayindaki_kendi_yazisi,
       yayin_duzenleyebilir_mi(3, (SELECT max(id) FROM yayin WHERE durum = 'taslak')) AS yazar_kendi_taslagi,
       yayin_duzenleyebilir_mi(2, 1) AS editor_herhangi;
\echo '--- e) e-posta büyük harfle -> reddedilmeli (uygulama küçük harfe çevirir)'
INSERT INTO kullanici (eposta, gorunen_ad, sifre_hash, rol) VALUES ('INFO@insa.av.tr', 'Info', '$argon2id$x', 'editor');

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V05 PG16 UNIQUE NULLS NOT DISTINCT ==='
\echo '--- a) bulten_sayisi: aynı yıl iki "yıllık" (donem NULL) sayı -> ikincisi reddedilmeli'
BEGIN;
INSERT INTO bulten_sayisi (yil, donem) VALUES (2026, NULL);
INSERT INTO bulten_sayisi (yil, donem) VALUES (2026, NULL);
ROLLBACK;
\echo '--- b) sayfa_ceviri: aynı dilde iki kök (slug NULL) sayfa -> ikincisi reddedilmeli'
BEGIN;
INSERT INTO sayfa (anahtar) VALUES ('ana_sayfa'), ('ana_sayfa_2');
INSERT INTO sayfa_ceviri (sayfa_id, dil, slug, baslik) SELECT id, 'tr', NULL, anahtar FROM sayfa WHERE anahtar = 'ana_sayfa';
INSERT INTO sayfa_ceviri (sayfa_id, dil, slug, baslik) SELECT id, 'tr', NULL, anahtar FROM sayfa WHERE anahtar = 'ana_sayfa_2';
ROLLBACK;
\echo '--- c) mahkeme: kökte ikinci "Yargıtay" -> reddedilmeli'
INSERT INTO mahkeme (ust_mahkeme_id, tur, ad) VALUES (NULL, 'yargitay', 'Yargıtay');
\echo '--- d) mahkeme: daire altına daire (3. seviye) -> reddedilmeli'
INSERT INTO mahkeme (ust_mahkeme_id, tur, ad) VALUES (2, 'yargitay', 'Alt daire');

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V06 Karar modülü ==='
BEGIN;
INSERT INTO karar (mahkeme_id, esas_no, karar_no, karar_tarihi, slug, konu, ozet, tam_metin, olusturan_id)
VALUES (2, '2023/4567', '2024/1234', '2024-03-12', 'yargitay-3-hd-2024-1234',
        'Kira bedelinin tespiti', 'Kiracının tahliyesi ve kira bedelinin tespitine ilişkin karar.',
        'Davacı kiraya veren, davalı kiracı aleyhine ...', 3);
INSERT INTO karar_mevzuat (karar_id, mevzuat_id, madde) VALUES (currval('karar_id_seq'), 1, '344'), (currval('karar_id_seq'), 1, NULL);
INSERT INTO karar_etiket VALUES (currval('karar_id_seq'), 1);
INSERT INTO yayin_karar VALUES (1, currval('karar_id_seq'));
COMMIT;
\echo '--- a) aynı karar-kanun "bütünü" (madde NULL) ikinci kez -> reddedilmeli'
INSERT INTO karar_mevzuat (karar_id, mevzuat_id, madde) VALUES (1, 1, NULL);
\echo '--- b) anonimleştirilmeden yayına alma -> reddedilmeli'
UPDATE karar SET durum = 'yayinda', yayin_tarihi = now(), onaylayan_id = 2, onay_zamani = now() WHERE id = 1;
\echo '--- c) anonimleştirildi + onay -> kabul'
UPDATE karar SET anonimlestirildi = true, anonimlestiren_id = 2, anonimlestirme_zamani = now(),
                 durum = 'yayinda', yayin_tarihi = now(), onaylayan_id = 2, onay_zamani = now()
WHERE id = 1 RETURNING id, durum, anonimlestirildi;
\echo '--- d) esas no biçimi hatalı (2023-4567) -> reddedilmeli'
INSERT INTO karar (mahkeme_id, esas_no, karar_tarihi, slug, konu, olusturan_id) VALUES (2, '2023-4567', '2024-01-01', 'x', 'x', 1);
\echo '--- e) Türkçe tam metin arama: "kiracı" -> kira kökü eşleşir; mahkeme/mevzuat ile listeleme'
SELECT k.id, ust.ad || ' ' || m.ad AS mahkeme, k.esas_no, k.karar_no, k.karar_tarihi,
       ts_rank(k.arama, q) AS skor,
       (SELECT string_agg(mv.kisa_ad || coalesce(' m.' || km.madde, ''), ', ' ORDER BY km.madde NULLS FIRST)
          FROM karar_mevzuat km JOIN mevzuat mv ON mv.id = km.mevzuat_id WHERE km.karar_id = k.id) AS mevzuat
FROM karar k JOIN mahkeme m ON m.id = k.mahkeme_id LEFT JOIN mahkeme ust ON ust.id = m.ust_mahkeme_id,
     websearch_to_tsquery('turkish', 'kiracı tespit') q
WHERE k.arama @@ q AND k.durum = 'yayinda';
SET enable_seqscan = off;
EXPLAIN (COSTS OFF) SELECT id FROM karar WHERE arama @@ websearch_to_tsquery('turkish', 'kira');
RESET enable_seqscan;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V07 İletişim mesajı, başvuru, KVKK saklama ==='
INSERT INTO iletisim_mesaji (ad, eposta, telefon, konu_turu, mesaj, aydinlatma_surumu)
VALUES ('Ziyaretçi', 'ziyaretci@example.com', '+905551112233', 'randevu', 'Randevu talebi', 'aydinlatma-2026-10');
INSERT INTO iletisim_mesaji (ad, eposta, konu_turu, mesaj, aydinlatma_surumu, olusturma_zamani, saklama_bitis)
VALUES ('Eski', 'eski@example.com', 'genel', 'Eski mesaj', 'aydinlatma-2025-01', now() - interval '2 years', now() - interval '1 year');
\echo '--- a) cevaplandi ama cevaplayan yok -> reddedilmeli'
UPDATE iletisim_mesaji SET durum = 'cevaplandi' WHERE id = 1;
\echo '--- b) telefon E.164 değil -> reddedilmeli'
INSERT INTO iletisim_mesaji (ad, eposta, telefon, konu_turu, mesaj, aydinlatma_surumu) VALUES ('X', 'x@example.com', '0532 111 22 33', 'genel', 'm', 'v1');
\echo '--- c) CV olarak genel (statik siteye kopyalanan) dosya -> reddedilmeli'
INSERT INTO dosya (id, tur, erisim, depolama_anahtari, orijinal_ad, mime_tur, boyut, sha256) VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'pdf', 'genel', 'genel/cv.pdf', 'cv.pdf', 'application/pdf', 10, sha256('cv1')),
  ('00000000-0000-0000-0000-0000000000c2', 'pdf', 'ozel',  'ozel/cv.pdf',  'cv.pdf', 'application/pdf', 10, sha256('cv2'));
INSERT INTO basvuru (ad, eposta, cv_dosya_id, aydinlatma_surumu) VALUES ('Aday', 'aday@example.com', '00000000-0000-0000-0000-0000000000c1', 'v1');
\echo '--- d) CV ozel dosya, süresi geçmiş başvuru -> kabul'
INSERT INTO basvuru (ad, eposta, cv_dosya_id, aydinlatma_surumu, olusturma_zamani, saklama_bitis)
VALUES ('Aday', 'aday@example.com', '00000000-0000-0000-0000-0000000000c2', 'v1', now() - interval '1 year', now() - interval '1 day')
RETURNING id, cv_erisim;
INSERT INTO oturum (token_hash, kullanici_id, olusturma_zamani, son_kullanma)
VALUES (sha256('t1'), 1, now() - interval '2 days', now() - interval '2 days' + interval '8 hours');
\echo '--- e) oturum süresi 24 saatten uzun -> reddedilmeli'
INSERT INTO oturum (token_hash, kullanici_id, son_kullanma) VALUES (sha256('t2'), 1, now() + interval '30 days');
\echo '--- f) kisisel_veri_temizle()'
SELECT * FROM kisisel_veri_temizle();
SELECT * FROM dosya_silme_kuyrugu;
SELECT count(*) AS kalan_mesaj FROM iletisim_mesaji;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V08 Açılır duyuru, yönlendirme, derleme kuyruğu ==='
BEGIN;
INSERT INTO acilir_duyuru (baslangic, bitis) VALUES ('2026-10-10', '2026-10-20');
INSERT INTO acilir_duyuru_ceviri VALUES (currval('acilir_duyuru_id_seq'), 'tr', 'Bayram tatili', NULL, NULL);
COMMIT;
\echo '--- a) çakışan ikinci aktif pop-up -> reddedilmeli (EXCLUDE)'
INSERT INTO acilir_duyuru (baslangic, bitis) VALUES ('2026-10-15', '2026-10-25');
\echo '--- b) çakışan ama pasif -> kabul'
BEGIN;
INSERT INTO acilir_duyuru (baslangic, bitis, aktif) VALUES ('2026-10-15', '2026-10-25', false) RETURNING id, aktif;
COMMIT;
\echo '--- c) //evil açık yönlendirme -> reddedilmeli'
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/eski', '//evil.example/phish');
\echo '--- d) zincir /a -> /b, sonra /b -> /c -> ikincisi reddedilmeli'
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/a', '/b');
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/b', '/c');
\echo '--- e) iki derleme aynı anda calisiyor -> ikincisi reddedilmeli'
INSERT INTO derleme_isi (durum, baslama_zamani) VALUES ('calisiyor', now());
INSERT INTO derleme_isi (durum, baslama_zamani) VALUES ('calisiyor', now());

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V09 Dil tablosu ==='
\echo '--- a) varsayılan dili kaldırmak -> COMMIT reddetmeli'
BEGIN; UPDATE dil SET varsayilan = false WHERE kod = 'tr'; COMMIT;
\echo '--- b) varsayılanı tr -> en taşımak tek işlemde -> (en çevirisi olmayan yayındaki makale yüzünden) reddedilmeli'
BEGIN; UPDATE dil SET varsayilan = false WHERE kod = 'tr'; UPDATE dil SET varsayilan = true WHERE kod = 'en';
UPDATE yayin SET guncelleme_zamani = guncelleme_zamani WHERE id = 1; COMMIT;
\echo '--- c) varsayılanı tr -> en taşımak, içerik satırına DOKUNMADAN -> yine reddedilmeli (ceviri_eksikleri)'
BEGIN; UPDATE dil SET varsayilan = false WHERE kod = 'tr'; UPDATE dil SET varsayilan = true WHERE kod = 'en'; COMMIT;
\echo '--- d) ceviri_eksikleri(): mevcut veride eksik (beklenen: boş)'
SELECT * FROM ceviri_eksikleri();

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V10 guncelleme_zamani: çeviri değişince ana kayıt ilerliyor mu? ==='
CREATE TEMP TABLE v10 AS SELECT id, guncelleme_zamani FROM yayin WHERE id = 1;
SELECT pg_sleep(0.05);
UPDATE yayin_ceviri SET ozet = 'Yeni özet' WHERE yayin_id = 1 AND dil = 'tr';
SELECT y.guncelleme_zamani > v10.guncelleme_zamani AS ana_kayit_ilerledi FROM yayin y JOIN v10 USING (id);
\echo '--- kapsama: guncelleme_zamani olup tetikleyicisi olmayan tablo var mı?'
SELECT c.relname AS eksik_tetikleyici
FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'guncelleme_zamani'
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
  AND NOT EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgrelid = c.oid AND t.tgname LIKE '%\_guncelleme');
SELECT count(*) FILTER (WHERE tgname LIKE '%\_guncelleme') AS guncelleme_tetikleyici,
       count(*) FILTER (WHERE tgname LIKE '%\_ust\_guncelle') AS ceviri_ust_tetikleyici,
       count(*) FILTER (WHERE tgname LIKE '%\_ceviri\_zorunlu' OR tgname LIKE '%\_ceviri\_silinemez') AS ceviri_zorunlu_tetikleyici
FROM pg_trigger WHERE NOT tgisinternal;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V11 Ekip sayfası sorgusu: unvan sırası + Türkçe ad sıralaması + EN için TR yedekli unvan ==='
SELECT k.ad || ' ' || k.soyad AS ad_soyad,
       coalesce(ue.ad, ut.ad) AS unvan_en_yedekli, u.sira AS unvan_sira, k.siralama,
       concat_ws(' / ', CASE WHEN k.avukat_mi THEN 'Avukat' END, CASE WHEN k.arabulucu_mu THEN 'Arabulucu' END) AS roller,
       (SELECT string_agg(numara, ', ') FROM kisi_telefon kt WHERE kt.kisi_id = k.id AND kt.sitede_goster) AS sitede_telefon
FROM kisi k
JOIN unvan u ON u.id = k.unvan_id
JOIN unvan_ceviri ut ON ut.unvan_id = u.id AND ut.dil = varsayilan_dil()
LEFT JOIN unvan_ceviri ue ON ue.unvan_id = u.id AND ue.dil = 'en'
WHERE k.aktif
ORDER BY u.sira, k.siralama, k.soyad, k.ad;
\echo '--- soyad sıralaması: tr_metin (tr-x-icu) ve C karşılaştırması'
SELECT string_agg(soyad, ', ' ORDER BY soyad) AS tr_metin_sirasi,
       string_agg(soyad, ', ' ORDER BY soyad COLLATE "C") AS c_sirasi FROM kisi;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V12 İndekssiz FK sütunları (bilinçli bırakılanlar: dosya ve kullanıcı denetim FKleri) ==='
SELECT c.conrelid::regclass AS tablo, string_agg(a.attname, ',' ORDER BY k.ord) AS fk_sutun, c.confrelid::regclass AS hedef
FROM pg_constraint c
CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND (i.indkey::int2[])[0] = c.conkey[1])
GROUP BY c.oid, c.conrelid, c.confrelid
ORDER BY c.confrelid::regclass::text, c.conrelid::regclass::text;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== V13 slug_tr() ==='
SELECT g AS girdi, slug_tr(g) AS slug, slug_tr(g)::slug IS NOT NULL AS domain_gecerli
FROM (VALUES ('Şirketler & Gayrimenkul Hukuku — İmar/Çevre'), ('IĞDIR ÜNİVERSİTESİ'), ('  --Kâr Payı--  '), ('Ağır Ceza')) v(g);
