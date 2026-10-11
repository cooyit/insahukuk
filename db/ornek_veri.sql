-- =====================================================================
--  Örnek veri — veri modelini ve Directus panelini denemek için.
--  KİŞİLER KURGUSALDIR, KARAR UYDURMADIR, METİNLER YER TUTUCUDUR. Canlı sitede kullanmayın.
--  Mevzuat adları ve numaraları gerçektir.
--  Yükleme: psql -X -v ON_ERROR_STOP=1 -d insa -f db/ornek_veri.sql   (schema.sql'den sonra)
-- =====================================================================

BEGIN;

-- Site ayarları (tek satır) -------------------------------------------
INSERT INTO site_ayar (resmi_unvan, telefon, eposta, linkedin_url, aydinlatma_surumu)
VALUES ('[Soyad] Avukatlık Bürosu', '+902120000000', 'info@ornek.av.tr', 'https://www.linkedin.com/company/ornek', 'aydinlatma-2026-10');
INSERT INTO site_ayar_ceviri (site_ayar_id, dil, adres, alt_bilgi_notu) VALUES
  (1, 'tr', 'Örnek Mah. Örnek Cad. No: 1, Şişli / İstanbul',
   'Bu sitedeki bilgiler genel niteliktedir; hukuki görüş değildir ve avukat-müvekkil ilişkisi kurmaz.'),
  (1, 'en', 'Örnek Mah. Örnek Cad. No: 1, Şişli / Istanbul',
   'Information on this website is general in nature and does not constitute legal advice.');

-- Unvanlar --------------------------------------------------------------
INSERT INTO unvan (kod, sira) VALUES
  ('kurucu-ortak', 1), ('ortak', 2), ('kidemli-avukat', 3), ('avukat', 4), ('stajyer-avukat', 5);
INSERT INTO unvan_ceviri (unvan_id, dil, ad)
SELECT u.id, v.dil, v.ad
FROM unvan u JOIN (VALUES
  ('kurucu-ortak',   'tr', 'Kurucu Ortak'),   ('kurucu-ortak',   'en', 'Founding Partner'),
  ('ortak',          'tr', 'Ortak'),          ('ortak',          'en', 'Partner'),
  ('kidemli-avukat', 'tr', 'Kıdemli Avukat'), ('kidemli-avukat', 'en', 'Senior Associate'),
  ('avukat',         'tr', 'Avukat'),         ('avukat',         'en', 'Associate'),
  ('stajyer-avukat', 'tr', 'Stajyer Avukat'), ('stajyer-avukat', 'en', 'Trainee Lawyer')
) v(kod, dil, ad) ON v.kod = u.kod;

-- Çalışma alanları: Excel'deki ağaç -----------------------------------
INSERT INTO calisma_alani (id, ust_alan_id, siralama) VALUES
  (1, NULL, 1), (2, NULL, 2), (3, 1, 1), (4, 1, 2), (5, 2, 1), (6, 2, 2);
INSERT INTO calisma_alani_ceviri (calisma_alani_id, dil, slug, ad, ozet) VALUES
  (1, 'tr', 'kamu-hukuku',        'Kamu Hukuku',        NULL),
  (2, 'tr', 'ozel-hukuk',         'Özel Hukuk',         NULL),
  (3, 'tr', 'ceza-hukuku',        'Ceza Hukuku',        'Soruşturma ve kovuşturma aşamalarında hukuki destek.'),
  (4, 'tr', 'imar-hukuku',        'İmar Hukuku',        'İmar planları, yapı ruhsatı ve yıkım kararlarına ilişkin uyuşmazlıklar.'),
  (5, 'tr', 'borclar-hukuku',     'Borçlar Hukuku',     'Sözleşmeler, tazminat ve alacak uyuşmazlıkları.'),
  (6, 'tr', 'gayrimenkul-hukuku', 'Gayrimenkul Hukuku', 'Tapu, kira, kat mülkiyeti ve kentsel dönüşüm uyuşmazlıkları.'),
  (1, 'en', 'public-law',         'Public Law',         NULL),
  (2, 'en', 'private-law',        'Private Law',        NULL),
  (3, 'en', 'criminal-law',       'Criminal Law',       NULL),
  (4, 'en', 'zoning-law',         'Zoning Law',         NULL),
  (5, 'en', 'law-of-obligations', 'Law of Obligations', NULL),
  (6, 'en', 'real-estate-law',    'Real Estate Law',    NULL);

-- Ekip (kurgusal) ---------------------------------------------------------
INSERT INTO kisi (id, slug, ad, soyad, unvan_id, avukat_mi, arabulucu_mu, baro_adi, baro_sicil_no, arabulucu_sicil_no, eposta, siralama)
SELECT v.id, v.slug, v.ad, v.soyad, u.id, v.avukat, v.arabulucu, v.baro, v.sicil, v.arb_sicil, v.eposta, v.sira
FROM (VALUES
  (1, 'ayse-yilmaz', 'Ayşe',  'Yılmaz', 'kurucu-ortak',   true,  true,  'İstanbul Barosu', '10001', '20001', 'ayse.yilmaz@ornek.av.tr', 1),
  (2, 'mehmet-kaya', 'Mehmet', 'Kaya',  'avukat',         true,  false, 'İstanbul Barosu', '10002', NULL,    'mehmet.kaya@ornek.av.tr', 1),
  (3, 'elif-demir',  'Elif',  'Demir',  'stajyer-avukat', false, false, NULL,              NULL,    NULL,    NULL,                      1)
) v(id, slug, ad, soyad, unvan_kod, avukat, arabulucu, baro, sicil, arb_sicil, eposta, sira)
JOIN unvan u ON u.kod = v.unvan_kod;
INSERT INTO kisi_ceviri (kisi_id, dil, kisa_biyografi, biyografi) VALUES
  (1, 'tr', 'Gayrimenkul ve imar hukuku alanlarında çalışmaktadır; aynı zamanda arabulucudur.',
            '<p>Yer tutucu biyografi metni.</p>'),
  (1, 'en', 'Works on real estate and zoning law; also a registered mediator.', '<p>Placeholder biography.</p>'),
  (2, 'tr', 'Borçlar hukuku ve ceza hukuku alanlarında çalışmaktadır.', '<p>Yer tutucu biyografi metni.</p>');
INSERT INTO kisi_telefon (kisi_id, tur, numara, sitede_goster) VALUES
  (1, 'dahili', '101', true), (2, 'dahili', '102', true), (1, 'cep', '+905320000001', false);
INSERT INTO kisi_calisma_alani (kisi_id, calisma_alani_id) VALUES (1, 4), (1, 6), (2, 3), (2, 5);

INSERT INTO egitim (id, kisi_id, baslangic_yili, bitis_yili, sira) VALUES
  (1, 1, 1998, 2002, 1), (2, 1, 2004, 2006, 2), (3, 2, 2010, 2014, 1);
INSERT INTO egitim_ceviri (egitim_id, dil, okul_adi, bolum_adi, derece) VALUES
  (1, 'tr', 'Örnek Üniversitesi', 'Hukuk Fakültesi', 'Lisans'),
  (1, 'en', 'Örnek University',   'Faculty of Law',  'LL.B.'),
  (2, 'tr', 'Örnek Üniversitesi', 'Kamu Hukuku',     'Yüksek Lisans'),
  (2, 'en', 'Örnek University',   'Public Law',      'LL.M.'),
  (3, 'tr', 'Deneme Üniversitesi', 'Hukuk Fakültesi', 'Lisans');

INSERT INTO deneyim (id, kisi_id, firma_adi, baslangic_yili, bitis_yili, sira) VALUES
  (1, 1, 'Örnek Holding A.Ş.', 2006, 2012, 1), (2, 2, 'Deneme Avukatlık Bürosu', 2015, 2020, 1);
INSERT INTO deneyim_ceviri (deneyim_id, dil, pozisyon) VALUES
  (1, 'tr', 'Hukuk Müşaviri'), (1, 'en', 'Legal Counsel'), (2, 'tr', 'Avukat');

-- Etiketler -----------------------------------------------------------------
INSERT INTO etiket (id) VALUES (1), (2);
INSERT INTO etiket_ceviri (etiket_id, dil, slug, ad) VALUES
  (1, 'tr', 'kira', 'Kira'), (1, 'en', 'lease', 'Lease'),
  (2, 'tr', 'imar-plani', 'İmar Planı');

-- Mahkemeler (örnek seçki) ----------------------------------------------------
INSERT INTO mahkeme (id, ust_mahkeme_id, tur, ad, kisa_ad, siralama) VALUES
  (1, NULL, 'aym',       'Anayasa Mahkemesi', 'AYM', 1),
  (2, NULL, 'yargitay',  'Yargıtay',          'Y.',  2),
  (3, NULL, 'danistay',  'Danıştay',          'D.',  3),
  (4, 2,    'yargitay',  '3. Hukuk Dairesi',  'Y. 3. HD', 3),
  (5, 2,    'yargitay',  '6. Hukuk Dairesi',  'Y. 6. HD', 6),
  (6, 3,    'danistay',  '6. Daire',          'D. 6. D.', 6);

-- Mevzuat (gerçek adlar ve numaralar) -------------------------------------------
INSERT INTO mevzuat (tur, numara, ad, kisa_ad) VALUES
  ('kanun', '6098', 'Türk Borçlar Kanunu', 'TBK'),
  ('kanun', '4721', 'Türk Medeni Kanunu', 'TMK'),
  ('kanun', '6100', 'Hukuk Muhakemeleri Kanunu', 'HMK'),
  ('kanun', '2577', 'İdari Yargılama Usulü Kanunu', 'İYUK'),
  ('kanun', '3194', 'İmar Kanunu', NULL),
  ('kanun', '634',  'Kat Mülkiyeti Kanunu', 'KMK'),
  ('kanun', '6325', 'Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu', 'HUAK'),
  ('kanun', '5237', 'Türk Ceza Kanunu', 'TCK'),
  ('kanun', '6698', 'Kişisel Verilerin Korunması Kanunu', 'KVKK');

-- Yayın: yayındaki bir makale (TR + EN) ---------------------------------------
INSERT INTO yayin (id, tur, durum, yayin_tarihi, onay_zamani) VALUES
  (1, 'makale', 'yayinda', '2026-09-15 09:00+03', '2026-09-14 17:00+03'),
  (2, 'kitap',  'taslak',  NULL, NULL);
UPDATE yayin SET yayinevi = 'Örnek Yayınevi', isbn = '9780306406157', basim_yili = 2025, sayfa_sayisi = 320 WHERE id = 2;
INSERT INTO yayin_ceviri (yayin_id, dil, slug, baslik, ozet, icerik) VALUES
  (1, 'tr', 'kira-bedelinin-tespiti-davalarinda-guncel-durum', 'Kira Bedelinin Tespiti Davalarında Güncel Durum',
      'Kira tespit davalarına ilişkin genel bilgilendirme (yer tutucu).', '<h2>I. Giriş</h2><p>Yer tutucu metin.</p>'),
  (1, 'en', 'current-state-of-rent-determination-cases', 'Current State of Rent Determination Cases',
      'General information on rent determination cases (placeholder).', '<h2>I. Introduction</h2><p>Placeholder.</p>'),
  (2, 'tr', 'gayrimenkul-hukukunda-guncel-sorunlar', 'Gayrimenkul Hukukunda Güncel Sorunlar', NULL, NULL);
INSERT INTO yayin_yazar (yayin_id, kisi_id, dis_yazar_adi, dis_yazar_unvan, sira) VALUES
  (1, 2, NULL, NULL, 1),
  (1, NULL, 'Can Öztürk', 'Dr. Öğr. Üyesi, Örnek Üniversitesi', 2),
  (2, 1, NULL, NULL, 1);
INSERT INTO yayin_calisma_alani (yayin_id, calisma_alani_id) VALUES (1, 5), (1, 6), (2, 6);
INSERT INTO yayin_etiket (yayin_id, etiket_id) VALUES (1, 1);

-- Karar: UYDURMA, anonimleştirilmiş örnek ----------------------------------------
INSERT INTO karar (id, mahkeme_id, esas_no, karar_no, karar_tarihi, slug, konu, ozet, tam_metin,
                   anonimlestirildi, anonimlestirme_zamani, durum, yayin_tarihi, onay_zamani)
VALUES (1, 4, '2024/1111', '2025/2222', '2025-02-10', 'yargitay-3-hd-e-2024-1111-k-2025-2222',
        'Kira bedelinin tespiti (ÖRNEK, gerçek karar değildir)',
        'Beş yılı aşan kira ilişkilerinde kira bedelinin tespitine ilişkin örnek özet.',
        '<p>Davacı kiraya veren, davalı kiracı aleyhine ... (yer tutucu, anonimleştirilmiş)</p>',
        true, '2026-09-01 10:00+03', 'yayinda', '2026-09-02 09:00+03', '2026-09-01 18:00+03');
INSERT INTO karar_mevzuat (karar_id, mevzuat_id, madde)
SELECT 1, id, v.madde FROM mevzuat JOIN (VALUES ('TBK', '344'), ('HMK', NULL)) v(kisa_ad, madde) USING (kisa_ad);
INSERT INTO karar_etiket (karar_id, etiket_id) VALUES (1, 1);
INSERT INTO karar_calisma_alani (karar_id, calisma_alani_id) VALUES (1, 6);
INSERT INTO yayin_karar (yayin_id, karar_id) VALUES (1, 1);

-- Sabit sayfalar -----------------------------------------------------------------
INSERT INTO sayfa (id, anahtar, siralama) VALUES
  (1, 'ana_sayfa', 0), (2, 'hakkimizda', 1), (3, 'arabuluculuk', 2), (4, 'iletisim', 3),
  (5, 'kvkk_aydinlatma', 10), (6, 'cerez_politikasi', 11), (7, 'yasal_uyari', 12);
INSERT INTO sayfa_ceviri (sayfa_id, dil, slug, baslik, icerik) VALUES
  (1, 'tr', NULL,                     'Ana Sayfa',              '<p>Yer tutucu giriş metni.</p>'),
  (2, 'tr', 'hakkimizda',             'Hakkımızda',             '<p>Yer tutucu.</p>'),
  (3, 'tr', 'arabuluculuk',           'Arabuluculuk',           '<p>Arabuluculuk sürecine ilişkin genel bilgi (yer tutucu).</p>'),
  (4, 'tr', 'iletisim',               'İletişim',               NULL),
  (5, 'tr', 'kvkk-aydinlatma-metni',  'KVKK Aydınlatma Metni',  '<p>Yer tutucu; avukat tarafından hazırlanacak.</p>'),
  (6, 'tr', 'cerez-politikasi',       'Çerez Politikası',       '<p>Yer tutucu.</p>'),
  (7, 'tr', 'yasal-uyari',            'Yasal Uyarı',            '<p>Yer tutucu.</p>'),
  (1, 'en', NULL,                     'Home',                   '<p>Placeholder.</p>'),
  (2, 'en', 'about',                  'About Us',               '<p>Placeholder.</p>'),
  (3, 'en', 'mediation',              'Mediation',              '<p>Placeholder.</p>');

-- Elle verilen id'lerden sonra kimlik sayaçlarını en büyük id'ye getir (Directus'tan eklenen kayıtlar çakışmasın)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT c.table_name FROM information_schema.columns c
           WHERE c.table_schema = 'public' AND c.column_name = 'id' AND c.is_identity = 'YES'
  LOOP
    EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, ''id''), greatest((SELECT max(id) FROM public.%I), 1))', 'public.' || t, t);
  END LOOP;
END $$;

COMMIT;
