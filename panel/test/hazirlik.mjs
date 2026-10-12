// Vitest globalSetup: testler gelistirme veritabanina dokunmasin diye her calistirmada sifirdan
// bir test ortami kurar: ayri veritabani (insa_test), ayri port (8056), ayri Directus sureci.
// Kume (panel/.veri) gelistirmeyle ortak; yoksa acilir.
import { envHazirla, envOku, psql } from '../betikler/ortak.mjs';
import { kur } from '../betikler/kur.mjs';
import { directusBaslat } from '../betikler/sunucu.mjs';
import { yapilandir } from '../betikler/yapilandir.mjs';

let sunucu;

export async function setup({ provide }) {
  envHazirla();
  const env = {
    ...envOku(),
    DB_DATABASE: 'insa_test',
    PORT: '8056',
    PUBLIC_URL: 'http://localhost:8056',
    LOG_LEVEL: 'warn',
  };

  // Temiz baslangic: onceki test veritabani silinir.
  psql(env, { veritabani: 'postgres', argumanlar: ['-c', 'DROP DATABASE IF EXISTS insa_test WITH (FORCE)'] });
  kur(env);
  sunucu = await directusBaslat(env);
  // Iki kez: yapilandirmanin tekrar calistirilabilir oldugu (hata vermedigi, sayaci sisirmedigi)
  // testlerde ikinci raporla sinanir.
  const ilkRapor = await yapilandir(env);
  const rapor = await yapilandir(env);

  provide('panel', { url: env.PUBLIC_URL, eposta: env.ADMIN_EMAIL, sifre: env.ADMIN_PASSWORD, ilkRapor, rapor });
}

export async function teardown() {
  sunucu?.kapat();
}
