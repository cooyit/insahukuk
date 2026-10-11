-- =====================================================================
--  GSI (goksusafiisik.av.tr) için çıkarılmış veri modeli — PostgreSQL 16+
--
--  GSI'nin gerçek veritabanı dışarıdan görülemiyor. Bu şema sitede
--  gözlenen içerikten çıkarıldı: yayın serileri (Articletter, Brief) ve
--  sayıları, makaleler (PDF, sesli okuma, kategori, yazar, dipnot),
--  24 çalışma alanı, ekip, kariyer ilanları, videolu ana sayfa
--  bölümleri, TR/EN dil desteği.
--
--  Temel kararlar
--  * İçerik kimlikleri bigint IDENTITY (GSI URL'leri sayısal: ?id=540, /careers/37)
--  * Medya ve oturum kimlikleri uuid / hash (URL'de tahmin edilemez olmalı)
--  * Dile bağlı alanlar ayrı *_translations tablolarında; PK (kayıt_id, locale)
--  * Metin alanları text + CHECK (varchar(n) yerine)
--  * Zengin metin jsonb (editör belgesi); HTML yayın/derleme sırasında üretilir
--  * Tarihli içerik (makale, sayı, ilan): status + published_at
--    Yapısal içerik (çalışma alanı, ekip, bölüm): is_visible
--  * Tüm zamanlar timestamptz
--  * Eklenti gerekmez (gen_random_uuid() PG13'ten beri yerleşik)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Ortak tipler, alanlar ve yardımcılar
-- ---------------------------------------------------------------------

-- Enum yalnızca birden fazla tabloda kullanılan sistem durumları için.
-- Tek tabloya özgü etiketler (mevsim, istihdam türü) text + CHECK.
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE media_kind     AS ENUM ('image', 'video', 'pdf', 'audio');
CREATE TYPE admin_role     AS ENUM ('admin', 'editor');

-- URL parçası: küçük harf ASCII, rakam ve tire. Türkçe karakterler
-- uygulama tarafında dönüştürülür (ş→s, ı→i, ğ→g ...).
CREATE DOMAIN slug_text AS text
  CHECK (VALUE ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(VALUE) <= 120);

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Diller enum yerine tabloda: yeni dil eklemek tek INSERT.
CREATE TABLE locales (
  code        text PRIMARY KEY CHECK (code ~ '^[a-z]{2}$'),
  name        text NOT NULL,
  is_default  boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX locales_one_default ON locales (is_default) WHERE is_default;

INSERT INTO locales (code, name, is_default) VALUES
  ('tr', 'Türkçe',  true),
  ('en', 'English', false);


-- ---------------------------------------------------------------------
-- 1. Yönetim paneli kullanıcıları
-- ---------------------------------------------------------------------

CREATE TABLE admin_users (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email          text NOT NULL CHECK (email ~ '^[^@\s]+@[^@\s]+$'),
  full_name      text NOT NULL,
  password_hash  text NOT NULL,            -- argon2id çıktısı ($argon2id$...)
  role           admin_role NOT NULL DEFAULT 'editor',
  totp_secret    bytea,                    -- 2FA; uygulama tarafında şifrelenmiş
  is_active      boolean NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
-- Büyük/küçük harf duyarsız tekil e-posta (citext eklentisi gerekmeden)
CREATE UNIQUE INDEX admin_users_email_uq ON admin_users (lower(email));

CREATE TABLE admin_sessions (
  token_hash  bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32), -- sha256(çerez değeri); çerezin kendisi saklanmaz
  user_id     bigint NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  user_agent  text,
  ip_hash     bytea,                       -- KVKK: ham IP yerine hash
  CHECK (expires_at > created_at)
);
CREATE INDEX admin_sessions_user_idx    ON admin_sessions (user_id);
CREATE INDEX admin_sessions_expires_idx ON admin_sessions (expires_at);


-- ---------------------------------------------------------------------
-- 2. Medya (görsel, video, PDF, ses)
--    GSI: /api/articletter/image/..., /_next/static/videos/..., /pdf/Articletter/...
-- ---------------------------------------------------------------------

CREATE TABLE media (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind               media_kind NOT NULL,
  storage_key        text NOT NULL UNIQUE,   -- disk/R2 yolu, ör. 2026/10/<uuid>.webp
  original_filename  text NOT NULL,
  mime_type          text NOT NULL CHECK (mime_type ~ '^[a-z]+/[a-z0-9.+-]+$'),
  byte_size          bigint NOT NULL CHECK (byte_size > 0),
  sha256             bytea NOT NULL CHECK (octet_length(sha256) = 32),
  width              integer CHECK (width > 0),
  height             integer CHECK (height > 0),
  duration_seconds   integer CHECK (duration_seconds >= 0),  -- video/ses
  uploaded_by        bigint REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (kind NOT IN ('image', 'video') OR (width IS NOT NULL AND height IS NOT NULL))
);
CREATE INDEX media_sha256_idx ON media (sha256);  -- aynı dosyanın tekrar yüklenmesini yakalar

CREATE TABLE media_translations (
  media_id  uuid NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  locale    text NOT NULL REFERENCES locales(code),
  alt_text  text CHECK (length(alt_text) <= 250),
  caption   text,
  PRIMARY KEY (media_id, locale)
);


-- ---------------------------------------------------------------------
-- 3. Çalışma alanları (GSI "Capabilities": 24 alan, kartta kısa video +
--    başlık + tek cümle). Makale kategorisi olarak da kullanılır.
-- ---------------------------------------------------------------------

CREATE TABLE practice_areas (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sort_order       smallint NOT NULL DEFAULT 0,
  video_media_id   uuid REFERENCES media(id),   -- karttaki döngü video
  poster_media_id  uuid REFERENCES media(id),   -- video yüklenene kadar görünen kare
  is_visible       boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE practice_area_translations (
  practice_area_id  bigint NOT NULL REFERENCES practice_areas(id) ON DELETE CASCADE,
  locale            text NOT NULL REFERENCES locales(code),
  slug              slug_text NOT NULL,
  name              text NOT NULL CHECK (length(name) <= 120),
  summary           text NOT NULL CHECK (length(summary) <= 300),  -- kart altındaki tek cümle
  body              jsonb,                    -- detay sayfası içeriği (GSI'de detay sayfası yok)
  seo_title         text CHECK (length(seo_title) <= 70),
  seo_description   text CHECK (length(seo_description) <= 170),
  PRIMARY KEY (practice_area_id, locale),
  UNIQUE (locale, slug)
);


-- ---------------------------------------------------------------------
-- 4. Ekip (GSI "Key Members": fotoğraf, ad, unvan, uzun biyografi)
-- ---------------------------------------------------------------------

CREATE TABLE members (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug            slug_text NOT NULL UNIQUE,   -- ad dile göre değişmediği için tek slug
  full_name       text NOT NULL,
  email           text CHECK (email ~ '^[^@\s]+@[^@\s]+$'),
  linkedin_url    text CHECK (linkedin_url ~ '^https://'),
  photo_media_id  uuid REFERENCES media(id),
  bar_name        text,                        -- ör. İstanbul Barosu
  bar_reg_no      text,                        -- sicil no; başında sıfır olabileceği için metin
  is_key_member   boolean NOT NULL DEFAULT false,  -- ana sayfadaki "Key Members" listesinde mi
  sort_order      smallint NOT NULL DEFAULT 0,
  is_visible      boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE member_translations (
  member_id        bigint NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  locale           text NOT NULL REFERENCES locales(code),
  title            text NOT NULL CHECK (length(title) <= 120),  -- unvan: "Kurucu Ortak" / "Managing Partner"
  bio              jsonb,
  seo_title        text CHECK (length(seo_title) <= 70),
  seo_description  text CHECK (length(seo_description) <= 170),
  PRIMARY KEY (member_id, locale)
);

CREATE TABLE member_practice_areas (
  member_id         bigint NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  practice_area_id  bigint NOT NULL REFERENCES practice_areas(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, practice_area_id)
);
CREATE INDEX member_practice_areas_pa_idx ON member_practice_areas (practice_area_id);


-- ---------------------------------------------------------------------
-- 5. Yayınlar (GSI "Insights")
--    Seri  → GSI Articletter, GSI Brief
--    Sayı  → "2026 - Winter Issue" (sayının tamamı PDF olarak da var)
--    Makale→ /tr/publications/{sayı-slug}/{makale-slug}?id=540
-- ---------------------------------------------------------------------

CREATE TABLE publication_series (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9-]+$'),  -- 'articletter', 'brief'
  sort_order  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE publication_series_translations (
  series_id    bigint NOT NULL REFERENCES publication_series(id) ON DELETE CASCADE,
  locale       text NOT NULL REFERENCES locales(code),
  slug         slug_text NOT NULL,
  name         text NOT NULL,              -- "GSI Articletter"
  description  text,
  PRIMARY KEY (series_id, locale),
  UNIQUE (locale, slug)
);

CREATE TABLE publication_issues (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  series_id       bigint NOT NULL REFERENCES publication_series(id),
  year            smallint NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  season          text CHECK (season IN ('winter', 'spring', 'summer', 'autumn')),  -- mevsimsiz seri için NULL
  cover_media_id  uuid REFERENCES media(id),
  pdf_media_id    uuid REFERENCES media(id),   -- sayının tamamı (ör. Articletter__2022_Winter_articletter.pdf)
  status          content_status NOT NULL DEFAULT 'draft',
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, series_id),                      -- articles'taki bileşik FK için
  UNIQUE (series_id, year, season),
  CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE TABLE publication_issue_translations (
  issue_id  bigint NOT NULL REFERENCES publication_issues(id) ON DELETE CASCADE,
  locale    text NOT NULL REFERENCES locales(code),
  slug      slug_text NOT NULL,                -- "2026-winter-issue"
  title     text NOT NULL,                     -- "2026 - Winter Issue"
  PRIMARY KEY (issue_id, locale),
  UNIQUE (locale, slug)
);

CREATE TABLE articles (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- URL'deki ?id=540
  series_id       bigint NOT NULL REFERENCES publication_series(id),
  issue_id        bigint,                      -- Brief gibi sayısız yayınlarda NULL
  cover_media_id  uuid REFERENCES media(id),
  pdf_media_id    uuid REFERENCES media(id),   -- "Download As PDF"
  audio_media_id  uuid REFERENCES media(id),   -- sesli okuma oynatıcısı
  status          content_status NOT NULL DEFAULT 'draft',
  published_at    timestamptz,
  created_by      bigint REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- Makale bir sayıya bağlıysa, sayı aynı seriye ait olmak zorunda
  FOREIGN KEY (issue_id, series_id) REFERENCES publication_issues (id, series_id),
  CHECK (status <> 'published' OR published_at IS NOT NULL)
);
CREATE INDEX articles_published_idx ON articles (published_at DESC) WHERE status = 'published';
CREATE INDEX articles_issue_idx     ON articles (issue_id);
CREATE INDEX articles_series_idx    ON articles (series_id);

CREATE TABLE article_translations (
  article_id       bigint NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  locale           text NOT NULL REFERENCES locales(code),
  slug             slug_text NOT NULL,
  title            text NOT NULL CHECK (length(title) <= 300),
  summary          text,                       -- "ÖZET" bölümü
  body             jsonb NOT NULL,             -- I., II. başlıklar ve dipnotlar dahil editör belgesi
  byline           text,                       -- "GSI Team" gibi toplu imza; NULL ise article_authors
  seo_title        text CHECK (length(seo_title) <= 70),
  seo_description  text CHECK (length(seo_description) <= 170),
  og_media_id      uuid REFERENCES media(id),  -- 1200x630 paylaşım görseli
  PRIMARY KEY (article_id, locale),
  UNIQUE (locale, slug)
);

CREATE TABLE article_authors (
  article_id  bigint NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  member_id   bigint NOT NULL REFERENCES members(id),
  position    smallint NOT NULL DEFAULT 0,     -- yazar sırası
  PRIMARY KEY (article_id, member_id)
);
CREATE INDEX article_authors_member_idx ON article_authors (member_id);  -- profilde "yazıları"

-- Makale kategorisi ("Capital Markets") = çalışma alanı; ayrı kategori tablosu yok
CREATE TABLE article_practice_areas (
  article_id        bigint NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  practice_area_id  bigint NOT NULL REFERENCES practice_areas(id),
  PRIMARY KEY (article_id, practice_area_id)
);
CREATE INDEX article_practice_areas_pa_idx ON article_practice_areas (practice_area_id);


-- ---------------------------------------------------------------------
-- 6. Kariyer ilanları (GSI: /en/careers/37 — sayısal kimlik, slug yok)
--    Başvurular e-postayla alınır; CV saklamamak için başvuru tablosu yok.
-- ---------------------------------------------------------------------

CREATE TABLE job_postings (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  practice_area_id  bigint REFERENCES practice_areas(id),  -- ilgili ekip (opsiyonel)
  location          text,
  employment_type   text CHECK (employment_type IN ('full_time', 'part_time', 'internship')),
  status            content_status NOT NULL DEFAULT 'draft',
  published_at      timestamptz,
  closes_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'published' OR published_at IS NOT NULL),
  CHECK (closes_at IS NULL OR published_at IS NULL OR closes_at > published_at)
);

CREATE TABLE job_posting_translations (
  job_posting_id  bigint NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  locale          text NOT NULL REFERENCES locales(code),
  title           text NOT NULL,
  body            jsonb NOT NULL,
  PRIMARY KEY (job_posting_id, locale)
);


-- ---------------------------------------------------------------------
-- 7. Sabit sayfalar ve bölümleri
--    Ana sayfa: 5 videolu hero bölümü, "Welcome to GSI", Philosophy
--    sekmeleri (Overview/Vision/Mission/Values), ...
--    Listeleme bölümleri (çalışma alanı kartları, ekip) veriyi kendi
--    tablolarından çeker; burada yalnızca başlık/metin ve sırası durur.
-- ---------------------------------------------------------------------

CREATE TABLE pages (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key         text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9_]+$'),  -- 'home', 'philosophy', 'kvkk' ...
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE page_translations (
  page_id          bigint NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  locale           text NOT NULL REFERENCES locales(code),
  slug             slug_text,                  -- ana sayfa için NULL (/tr)
  title            text NOT NULL,
  seo_title        text CHECK (length(seo_title) <= 70),
  seo_description  text CHECK (length(seo_description) <= 170),
  og_media_id      uuid REFERENCES media(id),
  PRIMARY KEY (page_id, locale),
  UNIQUE (locale, slug)
);

CREATE TABLE page_sections (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_id          bigint NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_key      text NOT NULL CHECK (section_key ~ '^[a-z0-9_]+$'),  -- 'hero_1', 'welcome', 'vision'
  layout           text NOT NULL CHECK (layout IN
                     ('video_hero', 'text', 'tabs', 'practice_area_cards', 'team_list', 'stat')),
  sort_order       smallint NOT NULL DEFAULT 0,
  video_media_id   uuid REFERENCES media(id),
  poster_media_id  uuid REFERENCES media(id),
  is_visible       boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, section_key)
);

CREATE TABLE page_section_translations (
  section_id  bigint NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES locales(code),
  heading     text,
  subheading  text,
  body        jsonb,                           -- paragraflar
  cta_label   text,                            -- "Explore Philosophy"
  cta_url     text,
  extra       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- bölüme özgü alanlar (ör. sayaç değeri ve etiketi)
  PRIMARY KEY (section_id, locale),
  CHECK ((cta_label IS NULL) = (cta_url IS NULL))
);


-- ---------------------------------------------------------------------
-- 8. Site ayarları, yönlendirmeler, işlem kaydı
-- ---------------------------------------------------------------------

-- Footer bilgileri: adres, telefon, faks, e-posta, LinkedIn ...
-- Dile bağlı değerler: {"tr": "...", "en": "..."}
CREATE TABLE site_settings (
  key         text PRIMARY KEY CHECK (key ~ '^[a-z0-9_.]+$'),  -- 'contact.phone', 'contact.address'
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  bigint REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Eski/kırık adresler için (GSI'deki /undefined/philosophy gibi)
CREATE TABLE redirects (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_path    text NOT NULL UNIQUE CHECK (from_path ~ '^/'),
  to_path      text NOT NULL CHECK (to_path ~ '^(/|https://)'),
  status_code  smallint NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 308)),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (from_path <> to_path)
);

CREATE TABLE audit_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      bigint REFERENCES admin_users(id) ON DELETE SET NULL,
  action       text NOT NULL CHECK (action IN
                 ('create', 'update', 'delete', 'publish', 'unpublish', 'login', 'login_failed')),
  entity_type  text,                           -- 'article', 'media' ...
  entity_id    text,                           -- bigint ve uuid kimlikleri birlikte tutabilmek için
  changes      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx  ON audit_log (entity_type, entity_id);
CREATE INDEX audit_log_created_idx ON audit_log (created_at);


-- ---------------------------------------------------------------------
-- 9. updated_at sütunu olan tüm tablolara tetikleyici bağla
-- ---------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = current_schema()
      AND c.column_name = 'updated_at'
      AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t || '_set_updated_at', t);
  END LOOP;
END $$;

COMMIT;
