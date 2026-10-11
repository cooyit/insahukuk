-- =====================================================================
--  gsi_schema.sql için sonda testleri (PostgreSQL 16)
--  Çalıştırma: psql -X -d gsi_test -f db/referans/gsi_test.sql 2>&1
--  ON_ERROR_STOP kapalı: hata beklenen testlerde hata mesajı çıktıda görünür.
--  Her test ROLLBACK ile biter; yalnızca F0 fikstürleri kalıcıdır.
-- =====================================================================
\set ON_ERROR_STOP 0
\pset footer off

\echo '=== F0 Fikstürler (kalıcı) ==='
INSERT INTO admin_users (email, full_name, password_hash, role)
VALUES ('kaplan@example.com', 'Kaplan', '$argon2id$v=19$m=65536,t=3,p=4$x$y', 'admin');
INSERT INTO media (id, kind, storage_key, original_filename, mime_type, byte_size, sha256, width, height, uploaded_by)
VALUES ('00000000-0000-0000-0000-000000000001', 'image', '2026/10/a.webp', 'a.webp', 'image/webp', 1000, sha256('a'), 800, 600, 1),
       ('00000000-0000-0000-0000-000000000002', 'pdf',   '2026/10/b.pdf',  'b.pdf',  'application/pdf', 2000, sha256('b'), NULL, NULL, 1);
INSERT INTO practice_areas (sort_order, poster_media_id) VALUES (1, '00000000-0000-0000-0000-000000000001'), (2, NULL);
INSERT INTO practice_area_translations (practice_area_id, locale, slug, name, summary)
VALUES (1, 'tr', 'ceza-hukuku', 'Ceza Hukuku', 'Özet'), (2, 'tr', 'imar-hukuku', 'İmar Hukuku', 'Özet');
INSERT INTO members (slug, full_name, photo_media_id) VALUES ('ahmet-yilmaz', 'Ahmet Yılmaz', '00000000-0000-0000-0000-000000000001');
INSERT INTO member_practice_areas VALUES (1, 2);
INSERT INTO publication_series (code) VALUES ('articletter'), ('brief');
INSERT INTO publication_issues (series_id, year, season) VALUES (1, 2026, 'winter');
SELECT 'fixtures ok' AS f0;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T01 NULL tekilliği: UNIQUE(series_id, year, season) season NULL iken ==='
BEGIN;
INSERT INTO publication_issues (series_id, year, season) VALUES (2, 2026, NULL);
INSERT INTO publication_issues (series_id, year, season) VALUES (2, 2026, NULL);
SELECT series_id, year, season, count(*) AS adet
FROM publication_issues WHERE series_id = 2 GROUP BY 1,2,3;
\echo '--- PG16 düzeltmesi: UNIQUE NULLS NOT DISTINCT (tabloda zaten mükerrer var -> önce temiz tabloda deneyelim)'
ROLLBACK;
BEGIN;
ALTER TABLE publication_issues DROP CONSTRAINT publication_issues_series_id_year_season_key;
ALTER TABLE publication_issues ADD CONSTRAINT publication_issues_sys_nnd UNIQUE NULLS NOT DISTINCT (series_id, year, season);
INSERT INTO publication_issues (series_id, year, season) VALUES (2, 2026, NULL);
INSERT INTO publication_issues (series_id, year, season) VALUES (2, 2026, NULL);
ROLLBACK;

\echo ''
\echo '=== T02 page_translations UNIQUE(locale, slug): ana sayfa slug NULL -> aynı dilde iki "ana sayfa" ==='
BEGIN;
INSERT INTO pages (key) VALUES ('home'), ('home2');
INSERT INTO page_translations (page_id, locale, slug, title)
SELECT id, 'tr', NULL, 'Ana sayfa ' || key FROM pages WHERE key IN ('home','home2');
SELECT p.key, t.locale, t.slug IS NULL AS slug_null FROM page_translations t JOIN pages p ON p.id = t.page_id;
ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T03 Bileşik FK (issue_id, series_id) ==='
BEGIN;
\echo '--- a) issue_id NULL, series_id=brief(2): MATCH SIMPLE -> FK kontrol edilmez (beklenen)'
INSERT INTO articles (series_id, issue_id) VALUES (2, NULL) RETURNING id, series_id, issue_id;
\echo '--- b) issue_id NULL ama seri articletter (sayılı seri): engelleyen kural var mı?'
INSERT INTO articles (series_id, issue_id) VALUES (1, NULL) RETURNING id, series_id, issue_id;
\echo '--- c) issue 1 (articletter) + series brief(2): reddedilmeli'
INSERT INTO articles (series_id, issue_id) VALUES (2, 1);
ROLLBACK;
BEGIN;
\echo '--- d) issue 1 + series 1 doğru eşleşme'
INSERT INTO articles (series_id, issue_id) VALUES (1, 1) RETURNING id;
\echo '--- e) Makalesi olan sayının serisini değiştirmek (ON UPDATE NO ACTION)'
UPDATE publication_issues SET series_id = 2 WHERE id = 1;
ROLLBACK;
BEGIN;
INSERT INTO articles (series_id, issue_id) VALUES (1, 1);
\echo '--- f) Makalesi olan sayıyı silmek'
DELETE FROM publication_issues WHERE id = 1;
ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T04 slug_text domain ve Türkçe karakterler ==='
SELECT s AS girdi,
       (s ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(s) <= 120) AS domain_kabul
FROM (VALUES ('ceza-hukuku'), ('imar-hukuku'), ('İmar-hukuku'), ('ceza-hukuku-ı'), ('şirketler'),
             ('gayrimenkul-hukuku'), ('Ceza-Hukuku'), ('a--b'), ('-a'), ('a-'), (''), ('2026-kis-sayisi'),
             (repeat('a', 121))) v(s);
\echo '--- Domain cast denemesi (hata beklenir)'
SELECT 'şirketler-hukuku'::slug_text;
\echo '--- Uygulamaya bırakılan dönüşümün SQL karşılığı (öneri: slug_tr fonksiyonu)'
SELECT regexp_replace(regexp_replace(lower(translate('Şirketler & Gayrimenkul Hukuku — İmar/Çevre', 'ÇĞİIÖŞÜçğıöşü', 'cgiiosucgiosu')),
                      '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g') AS ornek_slug;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T05 Yayımlanmış makale TR (varsayılan dil) çevirisi olmadan var olabilir mi? ==='
BEGIN;
INSERT INTO articles (series_id, status, published_at) VALUES (2, 'published', now()) RETURNING id AS cevirisiz_yayinda_makale;
INSERT INTO articles (series_id, status, published_at) VALUES (2, 'published', now()) RETURNING id AS yalniz_en_makale;
INSERT INTO article_translations (article_id, locale, slug, title, body)
SELECT max(id), 'en', 'only-english', 'Only English', '{}'::jsonb FROM articles;
SELECT a.id, a.status, count(t.*) AS ceviri_sayisi, string_agg(t.locale, ',') AS diller
FROM articles a LEFT JOIN article_translations t ON t.article_id = a.id GROUP BY a.id, a.status ORDER BY a.id;
\echo '--- Ayrıca body jsonb tipi serbest: dizi/skaler kabul ediliyor mu?'
INSERT INTO article_translations (article_id, locale, slug, title, body)
SELECT min(id), 'tr', 'skaler-govde', 'Skaler', '"sadece metin"'::jsonb FROM articles RETURNING jsonb_typeof(body);
ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T06 ON DELETE davranışları ==='
BEGIN;
\echo '--- a) practice_areas.poster_media_id ile referanslı medya silinirse'
DELETE FROM media WHERE id = '00000000-0000-0000-0000-000000000001';
ROLLBACK;
BEGIN;
UPDATE practice_areas SET poster_media_id = NULL;
\echo '--- b) yalnızca members.photo_media_id referansı kaldığında medya silinirse'
DELETE FROM media WHERE id = '00000000-0000-0000-0000-000000000001';
ROLLBACK;
BEGIN;
INSERT INTO articles (series_id) VALUES (2);
INSERT INTO article_authors (article_id, member_id) SELECT max(id), 1 FROM articles;
\echo '--- c) Yazarı olduğu makale varken üye silinirse'
DELETE FROM members WHERE id = 1;
ROLLBACK;
BEGIN;
\echo '--- d) Makalesi olmayan üye silinirse: member_practice_areas sessizce CASCADE'
SELECT count(*) AS mpa_once FROM member_practice_areas;
DELETE FROM members WHERE id = 1;
SELECT count(*) AS mpa_sonra FROM member_practice_areas;
ROLLBACK;
BEGIN;
\echo '--- e) Üyeye bağlı çalışma alanı silinirse (member_practice_areas CASCADE) -> sessizce siliniyor'
DELETE FROM practice_areas WHERE id = 2 RETURNING id;
ROLLBACK;
BEGIN;
INSERT INTO articles (series_id) VALUES (2);
INSERT INTO article_practice_areas SELECT max(id), 2 FROM articles;
\echo '--- f) Makaleye bağlı çalışma alanı silinirse (article_practice_areas NO ACTION)'
DELETE FROM practice_areas WHERE id = 2;
ROLLBACK;
BEGIN;
INSERT INTO audit_log (user_id, action, entity_type, entity_id) VALUES (1, 'publish', 'article', '1');
\echo '--- g) admin kullanıcısı silinirse audit_log.user_id ne olur?'
DELETE FROM admin_users WHERE id = 1;
SELECT id, user_id, action FROM audit_log;
SELECT id, uploaded_by FROM media ORDER BY id;
ROLLBACK;
\echo '--- h) Tüm FK eylemleri (confdeltype: a=NO ACTION r=RESTRICT c=CASCADE n=SET NULL)'
SELECT conrelid::regclass AS tablo, confrelid::regclass AS hedef, confdeltype AS on_delete,
       pg_get_constraintdef(oid) AS tanim
FROM pg_constraint WHERE contype = 'f' AND confrelid::regclass::text IN ('media','members','practice_areas','admin_users')
ORDER BY hedef, tablo;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T07 updated_at tetikleyici kapsamı ==='
SELECT c.relname AS tablo,
       EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'updated_at' AND NOT a.attisdropped) AS updated_at_var,
       EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgrelid = c.oid AND t.tgname LIKE '%set_updated_at') AS tetikleyici_var
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY updated_at_var DESC, tablo;
\echo '--- Çeviri güncellenince üst kaydın updated_at değeri değişiyor mu? (sitemap lastmod / derleme önbelleği)'
INSERT INTO articles (series_id) VALUES (2);
INSERT INTO article_translations (article_id, locale, slug, title, body) SELECT max(id), 'tr', 'test-makale', 'Test', '{}' FROM articles;
SELECT pg_sleep(0.05);
CREATE TEMP TABLE t07 AS SELECT id, updated_at FROM articles WHERE id = (SELECT max(id) FROM articles);
UPDATE article_translations SET title = 'Test (düzeltildi)' WHERE slug = 'test-makale';
SELECT a.id, a.updated_at = t07.updated_at AS articles_updated_at_degismedi FROM articles a JOIN t07 USING (id);
SELECT pg_sleep(0.05);
UPDATE articles SET cover_media_id = NULL WHERE id = (SELECT id FROM t07);
SELECT a.id, a.updated_at > t07.updated_at AS ana_tablo_guncellemesi_tetikliyor FROM articles a JOIN t07 USING (id);
DELETE FROM articles WHERE id = (SELECT id FROM t07);
DROP TABLE t07;
\echo '--- DO bloğu yalnızca kurulum anındaki tabloları kapsar: sonradan eklenen tabloya tetikleyici gelmez'
BEGIN;
CREATE TABLE later_table (id int PRIMARY KEY, updated_at timestamptz NOT NULL DEFAULT now());
SELECT count(*) AS later_table_tetikleyici_sayisi FROM pg_trigger WHERE tgrelid = 'later_table'::regclass AND NOT tgisinternal;
ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T08 locales tek-varsayılan indeksi ==='
BEGIN;
\echo '--- a) ikinci varsayılan dil'
UPDATE locales SET is_default = true WHERE code = 'en';
ROLLBACK;
BEGIN;
\echo '--- b) hiç varsayılan dil kalmaması'
UPDATE locales SET is_default = false WHERE code = 'tr';
SELECT count(*) FILTER (WHERE is_default) AS varsayilan_dil_sayisi FROM locales;
ROLLBACK;
BEGIN;
\echo '--- c) bölge kodlu dil (BCP47 en-GB / pt-BR)'
INSERT INTO locales (code, name) VALUES ('en-gb', 'English (UK)');
ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T09 Diğer CHECK / tip sondaları ==='
BEGIN;
\echo '--- a) kind=image ama mime application/pdf (tutarlılık yok)'
INSERT INTO media (kind, storage_key, original_filename, mime_type, byte_size, sha256, width, height)
VALUES ('image', 'x/1.pdf', '1.pdf', 'application/pdf', 1, sha256('z'), 1, 1) RETURNING kind, mime_type;
\echo '--- b) aynı sha256 ikinci kez (indeks tekil değil)'
INSERT INTO media (kind, storage_key, original_filename, mime_type, byte_size, sha256, width, height)
VALUES ('image', 'x/dup.webp', 'dup.webp', 'image/webp', 1000, sha256('a'), 800, 600) RETURNING storage_key;
\echo '--- c) og_media_id bir PDF olabiliyor mu? / poster bir PDF olabiliyor mu?'
INSERT INTO practice_areas (poster_media_id, video_media_id)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001') RETURNING id, poster_media_id, video_media_id;
\echo '--- d) aynı makalede iki yazar aynı position'
INSERT INTO articles (series_id) VALUES (2);
INSERT INTO members (slug, full_name) VALUES ('ayse-kaya', 'Ayşe Kaya');
INSERT INTO article_authors (article_id, member_id, position)
SELECT (SELECT max(id) FROM articles), id, 0 FROM members RETURNING article_id, member_id, position;
\echo '--- e) dış (ekip dışı) yazar: article_authors yalnızca member_id kabul ediyor'
INSERT INTO article_authors (article_id, member_id) SELECT max(id), NULL FROM articles;
ROLLBACK;
BEGIN;
\echo '--- f) cta_url javascript: (XSS riski)'
INSERT INTO pages (key) VALUES ('t09');
INSERT INTO page_sections (page_id, section_key, layout) SELECT id, 'hero_1', 'text' FROM pages WHERE key = 't09';
INSERT INTO page_section_translations (section_id, locale, cta_label, cta_url)
SELECT max(id), 'tr', 'Tıkla', 'javascript:alert(1)' FROM page_sections RETURNING cta_url;
\echo '--- g) redirects.to_path protokol-göreli açık yönlendirme //evil.example'
INSERT INTO redirects (from_path, to_path) VALUES ('/eski', '//evil.example/phish') RETURNING from_path, to_path;
\echo '--- h) redirect döngüsü /a -> /b, /b -> /a'
INSERT INTO redirects (from_path, to_path) VALUES ('/a', '/b'), ('/b', '/a');
SELECT count(*) AS dongu_satir FROM redirects r1 JOIN redirects r2 ON r1.to_path = r2.from_path AND r2.to_path = r1.from_path;
\echo '--- i) e-posta CHECK gevşek: TLD yok'
INSERT INTO members (slug, full_name, email) VALUES ('tld-yok', 'X', 'a@b') RETURNING email;
\echo '--- j) IDENTITY ALWAYS: veri taşıma sırasında id ile insert'
INSERT INTO articles (id, series_id) VALUES (540, 2);
ROLLBACK;
\echo '--- k) Büyük/küçük harf duyarsız e-posta tekilliği (C.UTF-8 veritabanında)'
BEGIN;
INSERT INTO admin_users (email, full_name, password_hash) VALUES ('KAPLAN@example.com', 'K2', 'h');
ROLLBACK;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T10 KVKK: admin_sessions.ip_hash (düz sha256 ise geri çevrilebilir mi?) ==='
\timing on
WITH hedef AS (SELECT sha256(convert_to('10.20.173.54', 'UTF8')) AS h)
SELECT ip AS bulunan_ip
FROM hedef, LATERAL (
  SELECT '10.20.' || a || '.' || b AS ip FROM generate_series(0,255) a, generate_series(0,255) b
) g
WHERE sha256(convert_to(g.ip, 'UTF8')) = hedef.h;
\timing off
\echo '--- Saklama/silme: süresi geçmiş oturumları silen bir mekanizma şemada var mı?'
SELECT count(*) AS cron_veya_temizlik_fonksiyonu FROM pg_proc WHERE proname ~ '(purge|cleanup|retention|temizle)';

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T11 İndekssiz FK sütunları (ilk sütunu FK ile başlayan indeks yok) ==='
SELECT c.conrelid::regclass AS tablo,
       string_agg(a.attname, ',' ORDER BY k.ord) AS fk_sutun,
       c.confrelid::regclass AS hedef
FROM pg_constraint c
CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND (i.indkey::int2[])[0:array_length(c.conkey,1)-1] @> c.conkey
      AND (i.indkey::int2[])[0] = c.conkey[1])
GROUP BY c.oid, c.conrelid, c.confrelid
ORDER BY 1, 2;

-- ---------------------------------------------------------------------
\echo ''
\echo '=== T12 Türkçe sıralama ve arama (veritabanı varsayılan collation: C.UTF-8) ==='
SELECT datcollate, datlocprovider FROM pg_database WHERE datname = current_database();
SELECT string_agg(ad, ' < ' ORDER BY ad) AS varsayilan_siralama,
       string_agg(ad, ' < ' ORDER BY ad COLLATE "tr-x-icu") AS tr_icu_siralama
FROM (VALUES ('Zeynep'), ('Çağla'), ('Şule'), ('Ömer'), ('İlker'), ('Ilgaz'), ('Can'), ('Ozan'), ('Sinan'), ('Ümit'), ('Ufuk')) v(ad);
SELECT to_tsvector('turkish', 'Kiracının tahliyesi ve kira bedelinin tespiti') @@ to_tsquery('turkish', 'kira') AS turkish_fts_kira_eslesir;
