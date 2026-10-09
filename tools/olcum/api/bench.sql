-- Ölçümde kullanılan sentetik tablo: 200 yazı x 2 dil, gövde ortalama ~20 KB
DROP TABLE IF EXISTS bench_yayin;
CREATE TABLE bench_yayin (
  id            serial PRIMARY KEY,
  locale        text,
  slug          text UNIQUE,
  title         text,
  excerpt       text,
  body          text,
  published_at  timestamptz DEFAULT now()
);
INSERT INTO bench_yayin (locale, slug, title, excerpt, body, published_at)
SELECT l, l || '-yazi-' || i, 'Başlık ' || i, repeat('özet ', 30),
       repeat('<p>hukuk dava sözleşme arabuluculuk tahkim karar yargıtay danıştay</p>', 280),
       timestamptz '2020-01-01' + i * interval '6 days'
FROM generate_series(1, 200) i CROSS JOIN (VALUES ('tr'), ('en')) v(l);
ANALYZE bench_yayin;
