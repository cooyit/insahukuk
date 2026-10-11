-- =====================================================================
--  db/schema.sql + db/moduller/*.sql doğrulama testleri (PostgreSQL 16)
--  Çalıştırma: db/test/calistir.sh
--  Beklenen hata = "ERROR" satırı; ertelenmiş kısıtlar hatayı COMMIT'te verir.
--  Directus tabloları yerine db/test/directus_taslak.sql yüklenir.
-- =====================================================================
\set ON_ERROR_STOP 0
\pset footer off

\echo '=== T00 Fikstürler ==='
BEGIN;
INSERT INTO directus_users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'kaplan@insa.av.tr'),
  ('00000000-0000-0000-0000-000000000002', 'mehmet@insa.av.tr'),
  ('00000000-0000-0000-0000-000000000003', 'zeynep@insa.av.tr');
INSERT INTO directus_files (id, filename_download, type) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'kapak.webp', 'image/webp'),
  ('00000000-0000-0000-0000-0000000000a2', 'karar.pdf',  'application/pdf');
INSERT INTO unvan (kod, sira) VALUES ('kurucu-ortak', 1), ('ortak', 2), ('avukat', 3), ('stajyer-avukat', 4);
INSERT INTO unvan_ceviri (unvan_id, dil, ad)
SELECT u.id, d.dil, CASE d.dil WHEN 'tr' THEN initcap(replace(u.kod, '-', ' ')) ELSE 'EN ' || u.kod END
FROM unvan u CROSS JOIN (VALUES ('tr'), ('en')) d(dil);
INSERT INTO kisi (slug, ad, soyad, unvan_id, avukat_mi, arabulucu_mu, baro_adi, baro_sicil_no, arabulucu_sicil_no, eposta, kullanici, siralama) VALUES
  ('mehmet-insa',  'Mehmet', 'İnşa',   1, true,  true,  'İstanbul Barosu', '12345', '6789', 'mehmet@insa.av.tr', '00000000-0000-0000-0000-000000000002', 1),
  ('zeynep-cakir', 'Zeynep', 'Çakır',  3, true,  false, 'İstanbul Barosu', '23456', NULL,   'zeynep@insa.av.tr', '00000000-0000-0000-0000-000000000003', 1),
  ('ali-ozturk',   'Ali',    'Öztürk', 3, true,  false, NULL, NULL, NULL, NULL, NULL, 2),
  ('ilker-sahin',  'İlker',  'Şahin',  3, false, true,  NULL, NULL, '1111', NULL, NULL, 0),
  ('can-yilmaz',   'Can',    'Yılmaz', 4, false, false, NULL, NULL, NULL, NULL, NULL, 0);
INSERT INTO kisi_telefon (kisi_id, tur, numara, sitede_goster) VALUES (1, 'dahili', '201', true), (1, 'cep', '+905321112233', false);
INSERT INTO egitim (kisi_id, baslangic_yili, bitis_yili, sira) VALUES (1, 1995, 1999, 1);
INSERT INTO egitim_ceviri (egitim_id, dil, okul_adi, bolum_adi, derece) VALUES
  (1, 'tr', 'İstanbul Üniversitesi', 'Hukuk Fakültesi', 'Lisans'),
  (1, 'en', 'Istanbul University', 'Faculty of Law', 'LL.B.');
INSERT INTO deneyim (kisi_id, firma_adi, baslangic_yili, bitis_yili) VALUES (1, 'Örnek Holding A.Ş.', 2000, 2010);
INSERT INTO deneyim_ceviri (deneyim_id, dil, pozisyon) VALUES (1, 'tr', 'Hukuk Müşaviri');
-- Çalışma alanı ağacı: Kamu hukuku > Ceza, İmar · Özel hukuk > Borçlar, Gayrimenkul
INSERT INTO calisma_alani (ust_alan_id, siralama) VALUES (NULL, 1), (NULL, 2);
INSERT INTO calisma_alani (ust_alan_id, siralama) VALUES (1, 1), (1, 2), (2, 1), (2, 2);
INSERT INTO calisma_alani_ceviri (calisma_alani_id, dil, slug, ad) VALUES
  (1, 'tr', 'kamu-hukuku', 'Kamu Hukuku'), (2, 'tr', 'ozel-hukuk', 'Özel Hukuk'),
  (3, 'tr', ic.slug_tr('Ceza Hukuku'), 'Ceza Hukuku'), (4, 'tr', ic.slug_tr('İmar Hukuku'), 'İmar Hukuku'),
  (5, 'tr', ic.slug_tr('Borçlar Hukuku'), 'Borçlar Hukuku'), (6, 'tr', ic.slug_tr('Gayrimenkul Hukuku'), 'Gayrimenkul Hukuku'),
  (3, 'en', 'criminal-law', 'Criminal Law');
INSERT INTO kisi_calisma_alani (kisi_id, calisma_alani_id) VALUES (1, 4), (1, 6), (2, 5);
INSERT INTO etiket DEFAULT VALUES;
INSERT INTO etiket_ceviri (etiket_id, dil, slug, ad) VALUES (1, 'tr', 'kira', 'Kira');
INSERT INTO mahkeme (ust_mahkeme_id, tur, ad, kisa_ad) VALUES (NULL, 'yargitay', 'Yargıtay', 'Y.');
INSERT INTO mahkeme (ust_mahkeme_id, tur, ad, kisa_ad) VALUES (1, 'yargitay', '3. Hukuk Dairesi', 'Y. 3. HD');
INSERT INTO mevzuat (tur, numara, ad, kisa_ad) VALUES ('kanun', '6098', 'Türk Borçlar Kanunu', 'TBK');
INSERT INTO site_ayar (resmi_unvan, telefon, eposta) VALUES ('Örnek Avukatlık Bürosu', '+902120000000', 'info@ornek.av.tr');
INSERT INTO site_ayar_ceviri (site_ayar_id, dil, adres) VALUES (1, 'tr', 'Örnek Mah. Örnek Cad. No: 1, İstanbul');
COMMIT;
SELECT (SELECT count(*) FROM kisi) AS kisi, (SELECT count(*) FROM calisma_alani) AS alan,
       (SELECT count(*) FROM mahkeme) AS mahkeme, (SELECT count(*) FROM site_ayar) AS site_ayar;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T01 İki seviyeli çalışma alanı ağacı ==='
\echo '--- a) 3. seviye (Ceza[3] altına) -> reddedilmeli'
INSERT INTO calisma_alani (ust_alan_id) VALUES (3);
\echo '--- b) altı olan kök (Kamu hukuku[1]) başka köke bağlanırsa -> reddedilmeli'
UPDATE calisma_alani SET ust_alan_id = 2 WHERE id = 1;
\echo '--- c) yaprak (İmar[4]) diğer köke taşınabilir -> kabul'
BEGIN; UPDATE calisma_alani SET ust_alan_id = 2 WHERE id = 4 RETURNING id, ust_alan_id; ROLLBACK;
\echo '--- d) kendi kendisinin üstü olamaz -> reddedilmeli'
UPDATE calisma_alani SET ust_alan_id = 2 WHERE id = 2;
\echo '--- e) avukata bağlı alan silinirse -> reddedilmeli (NO ACTION; gorunur=false kullanılmalı)'
DELETE FROM calisma_alani WHERE id = 6;
\echo '--- f) ağaç sorgusu (Türkçe sıralama)'
SELECT ust.ad AS ust_alan, string_agg(alt.ad, ', ' ORDER BY ca.siralama) AS alt_alanlar
FROM calisma_alani ca
JOIN calisma_alani_ceviri alt ON alt.calisma_alani_id = ca.id AND alt.dil = 'tr'
JOIN calisma_alani_ceviri ust ON ust.calisma_alani_id = ca.ust_alan_id AND ust.dil = 'tr'
GROUP BY ust.ad ORDER BY ust.ad;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T02 Yayın: yazarlar, dış yazar, etiket, varsayılan dil çevirisi zorunluluğu ==='
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, kapak, olusturan, onaylayan, onay_zamani)
VALUES ('makale', 'yayinda', now(), '00000000-0000-0000-0000-0000000000a1',
        '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', now());
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik, ozet, icerik)
VALUES (currval('yayin_id_seq'), 'tr', ic.slug_tr('Kira Tespit Davalarında Güncel Yargıtay Kararları'),
        'Kira Tespit Davalarında Güncel Yargıtay Kararları', 'Özet', '<p>Metin</p>');
INSERT INTO yayin_yazar (yayin_id, kisi_id, sira) VALUES (currval('yayin_id_seq'), 2, 1);
INSERT INTO yayin_yazar (yayin_id, dis_yazar_adi, dis_yazar_unvan, sira)
VALUES (currval('yayin_id_seq'), 'Ayşe Demir', 'Prof. Dr., Örnek Üniversitesi', 2);
INSERT INTO yayin_etiket (yayin_id, etiket_id) VALUES (currval('yayin_id_seq'), 1);
INSERT INTO yayin_calisma_alani (yayin_id, calisma_alani_id) VALUES (currval('yayin_id_seq'), 6);
INSERT INTO yayin_dosya (yayin_id, dosya) VALUES (currval('yayin_id_seq'), '00000000-0000-0000-0000-0000000000a2');
COMMIT;
SELECT y.id, y.tur, y.durum, yc.slug,
       string_agg(coalesce(k.ad || ' ' || k.soyad, yy.dis_yazar_adi), ' & ' ORDER BY yy.sira) AS yazarlar
FROM yayin y JOIN yayin_ceviri yc ON yc.yayin_id = y.id AND yc.dil = 'tr'
JOIN yayin_yazar yy ON yy.yayin_id = y.id LEFT JOIN kisi k ON k.id = yy.kisi_id
GROUP BY y.id, y.tur, y.durum, yc.slug;
\echo '--- a) TR çevirisi olmadan yayında haber -> COMMIT reddetmeli'
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, onay_zamani) VALUES ('haber', 'yayinda', now(), now());
COMMIT;
\echo '--- b) yalnızca EN çevirili yayında haber -> COMMIT reddetmeli'
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, onay_zamani) VALUES ('haber', 'yayinda', now(), now());
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik) VALUES (currval('yayin_id_seq'), 'en', 'only-english', 'Only English');
COMMIT;
\echo '--- c) TR çevirisi var ama hazir=false -> COMMIT reddetmeli'
BEGIN;
INSERT INTO yayin (tur, durum, yayin_tarihi, onay_zamani) VALUES ('haber', 'yayinda', now(), now());
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik, hazir) VALUES (currval('yayin_id_seq'), 'tr', 'yarim-haber', 'Yarım', false);
COMMIT;
\echo '--- d) yalnız EN çevirili TASLAK -> kabul (zorunluluk yalnızca yayındakiler için)'
BEGIN;
INSERT INTO yayin (tur, olusturan) VALUES ('haber', '00000000-0000-0000-0000-000000000003');
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
\echo '--- i) yazarı olduğu yayın varken kişi silinirse -> reddedilmeli'
DELETE FROM kisi WHERE id = 2;
\echo '--- j) yazar bağı olmayan kişi silinirse telefon, eğitim, deneyim, alan bağları CASCADE ile gider'
BEGIN;
DELETE FROM kisi WHERE id = 1;
SELECT (SELECT count(*) FROM kisi_telefon WHERE kisi_id = 1) AS telefon, (SELECT count(*) FROM egitim WHERE kisi_id = 1) AS egitim,
       (SELECT count(*) FROM deneyim WHERE kisi_id = 1) AS deneyim, (SELECT count(*) FROM kisi_calisma_alani WHERE kisi_id = 1) AS alan;
ROLLBACK;
\echo '--- k) eki olan dosya silinirse yayin_dosya bağı da gider; kapak dosyası silinirse kapak NULL olur'
BEGIN;
DELETE FROM directus_files WHERE id IN ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2');
SELECT (SELECT count(*) FROM yayin_dosya WHERE yayin_id = 1) AS ek, (SELECT kapak FROM yayin WHERE id = 1) AS kapak;
ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T03 Yayın türlerine özgü alanlar ==='
\echo '--- a) kitap + geçerli ISBN-13 (9780306406157) -> kabul'
BEGIN;
INSERT INTO yayin (tur, yayinevi, isbn, basim_yili) VALUES ('kitap', 'Örnek Yayınevi', '9780306406157', 2024) RETURNING tur, isbn;
ROLLBACK;
\echo '--- b) kitap + hatalı ISBN (9780306406158) -> reddedilmeli'
INSERT INTO yayin (tur, isbn) VALUES ('kitap', '9780306406158');
\echo '--- c) ISBN-10 (0306406152) -> kabul'
BEGIN; INSERT INTO yayin (tur, isbn) VALUES ('kitap', '0306406152') RETURNING isbn; ROLLBACK;
\echo '--- d) makaleye ISBN -> reddedilmeli'
INSERT INTO yayin (tur, isbn) VALUES ('makale', '9780306406157');
\echo '--- e) video ama video_url/video_dosyasi yok -> reddedilmeli'
INSERT INTO yayin (tur) VALUES ('video');
\echo '--- f) video + YouTube URL -> kabul'
BEGIN; INSERT INTO yayin (tur, video_url) VALUES ('video', 'https://www.youtube-nocookie.com/embed/abc') RETURNING tur; ROLLBACK;
\echo '--- g) ISBN-13 yalnızca 978/979 önekli: 0000000000000 -> f, 9780306406157 -> t'
SELECT ic.isbn_gecerli('0000000000000') AS sifirlar, ic.isbn_gecerli('9780306406157') AS gecerli;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T04 Onay ve kişi alanları ==='
\echo '--- a) onay zamanı olmadan yayında -> reddedilmeli'
INSERT INTO yayin (tur, durum, yayin_tarihi) VALUES ('haber', 'yayinda', now());
\echo '--- b) onaylayan var, onay zamanı yok -> reddedilmeli'
INSERT INTO yayin (tur, onaylayan) VALUES ('haber', '00000000-0000-0000-0000-000000000002');
\echo '--- c) baro sicil no var ama baro adı yok -> reddedilmeli'
INSERT INTO kisi (slug, ad, soyad, avukat_mi, baro_sicil_no) VALUES ('x-y', 'X', 'Y', true, '999');
\echo '--- d) aynı Directus kullanıcısı iki kişiye bağlanamaz -> reddedilmeli'
UPDATE kisi SET kullanici = '00000000-0000-0000-0000-000000000002' WHERE id = 3;
\echo '--- e) kişi e-postası büyük harf ya da ASCII dışı (INFO@, ınfo@, İnfo@) -> üçü de reddedilmeli'
UPDATE kisi SET eposta = 'INFO@insa.av.tr' WHERE id = 3;
UPDATE kisi SET eposta = 'ınfo@insa.av.tr' WHERE id = 3;
UPDATE kisi SET eposta = 'İnfo@insa.av.tr' WHERE id = 3;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T05 PG16 UNIQUE NULLS NOT DISTINCT ve mahkeme ağacı ==='
\echo '--- a) bulten_sayisi (modül): aynı yıl iki "yıllık" (donem NULL) sayı -> ikincisi reddedilmeli'
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
\echo '=== T06 Karar modülü ==='
BEGIN;
INSERT INTO karar (mahkeme_id, esas_no, karar_no, karar_tarihi, slug, konu, ozet, tam_metin, tam_metin_dosyasi, olusturan)
VALUES (2, '2023/4567', '2024/1234', '2024-03-12', 'yargitay-3-hd-e-2023-4567-k-2024-1234',
        'Kira bedelinin tespiti', 'Kiracının tahliyesi ve kira bedelinin tespitine ilişkin karar.',
        'Davacı kiraya veren, davalı kiracı aleyhine ...', '00000000-0000-0000-0000-0000000000a2',
        '00000000-0000-0000-0000-000000000003');
INSERT INTO karar_mevzuat (karar_id, mevzuat_id, madde) VALUES (currval('karar_id_seq'), 1, '344'), (currval('karar_id_seq'), 1, NULL);
INSERT INTO karar_etiket (karar_id, etiket_id) VALUES (currval('karar_id_seq'), 1);
INSERT INTO karar_calisma_alani (karar_id, calisma_alani_id) VALUES (currval('karar_id_seq'), 6);
INSERT INTO yayin_karar (yayin_id, karar_id) VALUES (1, currval('karar_id_seq'));
COMMIT;
\echo '--- a) aynı karar-kanun "bütünü" (madde NULL) ikinci kez -> reddedilmeli'
INSERT INTO karar_mevzuat (karar_id, mevzuat_id, madde) VALUES (1, 1, NULL);
\echo '--- b) anonimleştirilmeden yayına alma -> reddedilmeli'
UPDATE karar SET durum = 'yayinda', yayin_tarihi = now(), onaylayan = '00000000-0000-0000-0000-000000000002', onay_zamani = now() WHERE id = 1;
\echo '--- c) anonimleştirildi + onay -> kabul'
UPDATE karar SET anonimlestirildi = true, anonimlestiren = '00000000-0000-0000-0000-000000000002', anonimlestirme_zamani = now(),
                 durum = 'yayinda', yayin_tarihi = now(), onaylayan = '00000000-0000-0000-0000-000000000002', onay_zamani = now()
WHERE id = 1 RETURNING id, durum, anonimlestirildi;
\echo '--- d) esas no biçimi hatalı (2023-4567) -> reddedilmeli'
INSERT INTO karar (mahkeme_id, esas_no, karar_tarihi, slug, konu) VALUES (2, '2023-4567', '2024-01-01', 'x', 'x');
\echo '--- e) Türkçe tam metin arama: "kiracı tespit" -> kira kökü eşleşir; mahkeme/mevzuat ile listeleme'
SELECT k.id, ust.ad || ' ' || m.ad AS mahkeme, k.esas_no, k.karar_no, k.karar_tarihi, round(a.skor::numeric, 3) AS skor,
       (SELECT string_agg(mv.kisa_ad || coalesce(' m.' || km.madde, ''), ', ' ORDER BY km.madde NULLS FIRST)
          FROM karar_mevzuat km JOIN mevzuat mv ON mv.id = km.mevzuat_id WHERE km.karar_id = k.id) AS mevzuat
FROM ic.karar_ara('kiracı tespit') a JOIN karar k ON k.id = a.karar_id
JOIN mahkeme m ON m.id = k.mahkeme_id LEFT JOIN mahkeme ust ON ust.id = m.ust_mahkeme_id;
SET enable_seqscan = off;
EXPLAIN (COSTS OFF) SELECT id FROM karar WHERE ic.karar_vektoru(konu, ozet, tam_metin) @@ websearch_to_tsquery('turkish', 'kira');
RESET enable_seqscan;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T07 İletişim mesajı ve KVKK saklama ==='
INSERT INTO iletisim_mesaji (ad, eposta, telefon, konu_turu, mesaj, aydinlatma_surumu)
VALUES ('Ziyaretçi', 'ziyaretci@example.com', '+905551112233', 'randevu', 'Randevu talebi', 'aydinlatma-2026-10');
INSERT INTO iletisim_mesaji (ad, eposta, konu_turu, mesaj, aydinlatma_surumu, olusturma_zamani, saklama_bitis)
VALUES ('Eski', 'eski@example.com', 'genel', 'Eski mesaj', 'aydinlatma-2025-01', now() - interval '2 years', now() - interval '1 year');
\echo '--- a) cevaplandi ama cevaplayan yok -> reddedilmeli'
UPDATE iletisim_mesaji SET durum = 'cevaplandi' WHERE id = 1;
\echo '--- b) telefon E.164 değil -> reddedilmeli'
INSERT INTO iletisim_mesaji (ad, eposta, telefon, konu_turu, mesaj, aydinlatma_surumu) VALUES ('X', 'x@example.com', '0532 111 22 33', 'genel', 'm', 'v1');
\echo '--- c) cevaplandi + cevaplayan avukat -> kabul'
UPDATE iletisim_mesaji SET durum = 'cevaplandi', cevaplayan_kisi_id = 2, cevap_tarihi = now() WHERE id = 1 RETURNING id, durum;
\echo '--- d) ic.kisisel_veri_temizle(): süresi geçen mesaj silinir'
SELECT * FROM ic.kisisel_veri_temizle();
SELECT count(*) AS kalan_mesaj FROM iletisim_mesaji;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T08 Yönlendirme, derleme kuyruğu, açılır duyuru (modül) ==='
\echo '--- a) //evil açık yönlendirme -> reddedilmeli'
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/eski', '//evil.example/phish');
\echo '--- b) hedef "/" + ters bölü + "evil" ya da "/" + sekme + "/evil" -> ikisi de reddedilmeli (tarayıcı ikisini de //evil sayar)'
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/eski-a', '/\evil.example');
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/eski-b', E'/\t/evil.example');
\echo '--- c) zincir /a -> /b, sonra /b -> /c -> ikincisi reddedilmeli'
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/a', '/b');
INSERT INTO yonlendirme (kaynak_yol, hedef) VALUES ('/b', '/c');
\echo '--- d) iki derleme aynı anda calisiyor -> ikincisi reddedilmeli'
INSERT INTO derleme_isi (durum, baslama_zamani) VALUES ('calisiyor', now());
INSERT INTO derleme_isi (durum, baslama_zamani) VALUES ('calisiyor', now());
\echo '--- e) açılır duyuru: çakışan ikinci aktif duyuru -> reddedilmeli (EXCLUDE); pasif olan -> kabul'
BEGIN;
INSERT INTO acilir_duyuru (baslangic, bitis) VALUES ('2026-10-10', '2026-10-20');
INSERT INTO acilir_duyuru_ceviri (acilir_duyuru_id, dil, baslik) VALUES (currval('acilir_duyuru_id_seq'), 'tr', 'Bayram tatili');
COMMIT;
INSERT INTO acilir_duyuru (baslangic, bitis) VALUES ('2026-10-15', '2026-10-25');
BEGIN;
INSERT INTO acilir_duyuru (baslangic, bitis, aktif) VALUES ('2026-10-15', '2026-10-25', false) RETURNING aktif;
COMMIT;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T09 Dil tablosu ==='
\echo '--- a) varsayılan dili kaldırmak -> COMMIT reddetmeli'
BEGIN; UPDATE dil SET varsayilan = false WHERE kod = 'tr'; COMMIT;
\echo '--- b) varsayılanı tr -> en taşımak (en çevirisi olmayan yayındaki makale yüzünden) -> reddedilmeli'
BEGIN; UPDATE dil SET varsayilan = false WHERE kod = 'tr'; UPDATE dil SET varsayilan = true WHERE kod = 'en';
UPDATE yayin SET guncelleme_zamani = guncelleme_zamani WHERE id = 1; COMMIT;
\echo '--- c) varsayılanı tr -> en taşımak, içerik satırına DOKUNMADAN -> yine reddedilmeli (ceviri_eksikleri)'
BEGIN; UPDATE dil SET varsayilan = false WHERE kod = 'tr'; UPDATE dil SET varsayilan = true WHERE kod = 'en'; COMMIT;
\echo '--- d) varsayılanı tek ifadeyle değiştirip geri almak (tek-varsayılan kısıtı ertelenmiş) -> kabul'
BEGIN;
UPDATE dil SET varsayilan = (kod = 'en');
UPDATE dil SET varsayilan = (kod = 'tr');
COMMIT;
SELECT kod AS varsayilan_dil FROM dil WHERE varsayilan;
\echo '--- e) ic.ceviri_eksikleri(): mevcut veride eksik (beklenen: boş)'
SELECT * FROM ic.ceviri_eksikleri();

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T10 guncelleme_zamani: çeviri değişince ana kayıt ilerliyor mu? ==='
CREATE TEMP TABLE t10 AS SELECT id, guncelleme_zamani FROM yayin WHERE id = 1;
SELECT pg_sleep(0.05);
UPDATE yayin_ceviri SET ozet = 'Yeni özet' WHERE yayin_id = 1 AND dil = 'tr';
SELECT y.guncelleme_zamani > t10.guncelleme_zamani AS ana_kayit_ilerledi FROM yayin y JOIN t10 USING (id);
\echo '--- kapsama: guncelleme_zamani olup tetikleyicisi olmayan tablo var mı? (beklenen: boş)'
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
\echo '=== T11 Ekip sayfası sorgusu: unvan sırası + Türkçe ad sıralaması + EN için TR yedekli unvan ==='
SELECT k.ad || ' ' || k.soyad AS ad_soyad,
       coalesce(ue.ad, ut.ad) AS unvan_en_yedekli, u.sira AS unvan_sira, k.siralama,
       concat_ws(' / ', CASE WHEN k.avukat_mi THEN 'Avukat' END, CASE WHEN k.arabulucu_mu THEN 'Arabulucu' END) AS roller,
       (SELECT string_agg(numara, ', ') FROM kisi_telefon kt WHERE kt.kisi_id = k.id AND kt.sitede_goster) AS sitede_telefon
FROM kisi k
JOIN unvan u ON u.id = k.unvan_id
JOIN unvan_ceviri ut ON ut.unvan_id = u.id AND ut.dil = ic.varsayilan_dil()
LEFT JOIN unvan_ceviri ue ON ue.unvan_id = u.id AND ue.dil = 'en'
WHERE k.aktif
ORDER BY u.sira, k.siralama, k.soyad, k.ad;
\echo '--- soyad sıralaması: COLLATE "tr-x-icu" ve C karşılaştırması'
SELECT string_agg(soyad, ', ' ORDER BY soyad) AS tr_sirasi,
       string_agg(soyad, ', ' ORDER BY soyad COLLATE "C") AS c_sirasi FROM kisi;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T12 İndekssiz FK sütunları (bilinçli bırakılanlar: dosya ve kullanıcı FKleri, dil) ==='
SELECT c.conrelid::regclass AS tablo, string_agg(a.attname, ',' ORDER BY k.ord) AS fk_sutun, c.confrelid::regclass AS hedef
FROM pg_constraint c
CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND (i.indkey::int2[])[0] = c.conkey[1])
GROUP BY c.oid, c.conrelid, c.confrelid
ORDER BY c.confrelid::regclass::text, c.conrelid::regclass::text, fk_sutun;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T13 ic.slug_tr() ==='
SELECT g AS girdi, ic.slug_tr(g) AS slug, ic.slug_gecerli(ic.slug_tr(g)) AS gecerli
FROM (VALUES ('Şirketler & Gayrimenkul Hukuku — İmar/Çevre'), ('IĞDIR ÜNİVERSİTESİ'), ('  --Kâr Payı--  '), ('Ağır Ceza'),
             (U&'i\0307dare hukuku'), (normalize('Şirket İmar', NFD))) v(g);

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T14 Directus uyumu (beklenen: üç sorgu da boş) ==='
\echo '--- a) tek sütunlu birincil anahtarı olmayan tablo'
SELECT c.relname AS pk_sorunu, (SELECT array_length(conkey, 1) FROM pg_constraint WHERE conrelid = c.oid AND contype = 'p') AS pk_sutun_sayisi
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND c.relname NOT LIKE 'directus\_%'
  AND coalesce((SELECT array_length(conkey, 1) FROM pg_constraint WHERE conrelid = c.oid AND contype = 'p'), 0) <> 1
ORDER BY 1;
\echo '--- b) enum, domain ya da Directus''un tanımadığı tipte sütun'
SELECT c.table_name, c.column_name, c.data_type, c.domain_name
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.table_name NOT LIKE 'directus\_%'
  AND (c.domain_name IS NOT NULL OR c.data_type IN ('USER-DEFINED', 'tsvector', 'ARRAY', 'bytea'))
ORDER BY 1, 2;
\echo '--- c) üretilmiş (generated) sütun'
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name NOT LIKE 'directus\_%' AND is_generated = 'ALWAYS'
ORDER BY 1, 2;
\echo '--- d) Directus''un göreceği tablo sayısı (public, directus_* hariç) ve iç tablolar'
SELECT (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'directus\_%') AS public_tablo,
       (SELECT string_agg(tablename, ', ') FROM pg_tables WHERE schemaname = 'ic') AS ic_tablolar;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T15 Modüller ==='
\echo '--- a) görünür sektör TR çevirisi olmadan -> COMMIT reddetmeli'
BEGIN; INSERT INTO sektor DEFAULT VALUES; COMMIT;
\echo '--- b) bülten sayısına makale dışı yayın bağlanamaz -> reddedilmeli'
BEGIN;
INSERT INTO bulten_sayisi (yil, donem) VALUES (2026, 'kis');
INSERT INTO yayin (tur, video_url, bulten_sayisi_id) VALUES ('video', 'https://www.youtube-nocookie.com/embed/x', currval('bulten_sayisi_id_seq'));
ROLLBACK;
\echo '--- c) yayındaki ilan TR çevirisiyle -> kabul'
BEGIN;
INSERT INTO ilan (calisma_tipi, basvuru_epostasi, durum, yayin_tarihi) VALUES ('staj', 'kariyer@ornek.av.tr', 'yayinda', now());
INSERT INTO ilan_ceviri (ilan_id, dil, baslik, aciklama) VALUES (currval('ilan_id_seq'), 'tr', 'Stajyer Avukat', '<p>...</p>');
COMMIT;
SELECT i.durum, ic.baslik FROM ilan i JOIN ilan_ceviri ic ON ic.ilan_id = i.id;
\echo '--- d) karar yorumu imzalı (kişiye bağlı) -> kabul'
INSERT INTO karar_yorum (karar_id, kisi_id, icerik) VALUES (1, 2, '<p>Değerlendirme</p>') RETURNING karar_id, kisi_id;
