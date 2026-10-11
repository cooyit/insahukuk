\set ON_ERROR_STOP 0
\echo '=== T13 tr-TR (ICU) varsayılan collation ile çalışan veritabanında e-posta tekilliği ve lower() ==='
SELECT datname, datlocprovider, daticulocale FROM pg_database WHERE datname = current_database();
SELECT lower('INFO@INSA.AV.TR') AS lower_tr, lower('INFO@INSA.AV.TR' COLLATE "C") AS lower_c, lower('İSTANBUL') AS lower_istanbul;
INSERT INTO admin_users (email, full_name, password_hash) VALUES ('info@insa.av.tr', 'A', 'h');
\echo '--- Aynı adres büyük harfle: tekil indeks yakalamalı'
INSERT INTO admin_users (email, full_name, password_hash) VALUES ('INFO@INSA.AV.TR', 'B', 'h');
SELECT email, lower(email) AS indeks_anahtari FROM admin_users ORDER BY id;
\echo '--- Girişte tipik sorgu: WHERE lower(email) = lower($1) ($1 = Info@insa.av.tr)'
SELECT count(*) AS eslesen FROM admin_users WHERE lower(email) = lower('Info@insa.av.tr');
\echo '--- slug regex tr-TR collation altında: [a-z] aralığı ı/ş içeriyor mu?'
SELECT 'ışık' ~ '^[a-z]+$' AS isik_kabul, 'isik' ~ '^[a-z]+$' AS isik_ascii_kabul;
\echo '--- Sıralama: varsayılan collation artık Türkçe'
SELECT string_agg(ad, ' < ' ORDER BY ad) FROM (VALUES ('Zeynep'), ('Çağla'), ('İlker'), ('Ilgaz'), ('Ömer')) v(ad);
