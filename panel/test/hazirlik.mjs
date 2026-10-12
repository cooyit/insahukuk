// Vitest globalSetup: testler gelistirme veritabanina dokunmasin diye her calistirmada sifirdan
// bir test ortami kurar: ayri veritabani (insa_test), ayri port (8056), ayri Directus sureci.
// Kume (panel/.veri) gelistirmeyle ortak; yoksa acilir. E-postalar ayri bir sahte SMTP alicisina
// (2526) gider ve .veri/posta-test/ altina yazilir; .env'de gercek SMTP olsa bile testten e-posta cikmaz.
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { envHazirla, envOku, psql, VERI } from '../betikler/ortak.mjs';
import { kur } from '../betikler/kur.mjs';
import { directusBaslat } from '../betikler/sunucu.mjs';
import { sahteSmtp } from '../betikler/sahte-smtp.mjs';
import { baslat } from '../betikler/veritabani.mjs';
import { yapilandir } from '../betikler/yapilandir.mjs';

let sunucu;
let smtp;
const POSTA_TEST = join(VERI, 'posta-test');

export async function setup({ provide }) {
  envHazirla();
  const env = {
    ...envOku(),
    DB_DATABASE: 'insa_test',
    PORT: '8056',
    PUBLIC_URL: 'http://localhost:8056',
    LOG_LEVEL: 'warn',
    EMAIL_TRANSPORT: 'smtp',
    EMAIL_SMTP_HOST: '127.0.0.1',
    EMAIL_SMTP_PORT: '2526',
    EMAIL_SMTP_SECURE: 'false',
    EMAIL_SMTP_IGNORE_TLS: 'true',
    EMAIL_SMTP_USER: '',
    EMAIL_SMTP_PASSWORD: '',
    FLOWS_ENV_ALLOW_LIST: 'PUBLIC_URL',
  };
  rmSync(POSTA_TEST, { recursive: true, force: true });
  smtp = sahteSmtp(POSTA_TEST);
  await new Promise((r) => smtp.listen(Number(env.EMAIL_SMTP_PORT), '127.0.0.1', r));

  // Temiz baslangic: onceki test veritabani silinir. Kume kapaliysa (npm run db:durdur) once acilir.
  baslat(env);
  psql(env, { veritabani: 'postgres', argumanlar: ['-c', 'DROP DATABASE IF EXISTS insa_test WITH (FORCE)'] });
  kur(env);
  sunucu = await directusBaslat(env);
  // Iki kez: yapilandirmanin tekrar calistirilabilir oldugu (hata vermedigi, sayaci sisirmedigi)
  // testlerde ikinci raporla sinanir.
  const ilkRapor = await yapilandir(env);
  const rapor = await yapilandir(env);

  provide('panel', { url: env.PUBLIC_URL, eposta: env.ADMIN_EMAIL, sifre: env.ADMIN_PASSWORD, formToken: env.FORM_DIRECTUS_TOKEN, posta: POSTA_TEST, ilkRapor, rapor });
}

export async function teardown() {
  sunucu?.kapat();
  smtp?.close();
}
