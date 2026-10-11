-- Testler için Directus tablolarının en küçük taklidi. Gerçek kurulumda bunları
-- `npx directus bootstrap` oluşturur; bu dosya üretimde KULLANILMAZ.
CREATE TABLE directus_users (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email   text,
  status  text NOT NULL DEFAULT 'active'
);
CREATE TABLE directus_files (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage            text NOT NULL DEFAULT 'local',
  filename_disk      text,
  filename_download  text NOT NULL,
  type               text
);
