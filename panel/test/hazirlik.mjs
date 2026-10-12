// Vitest globalSetup: testler gelistirme veritabanina dokunmasin diye her calistirmada sifirdan
// bir test ortami kurar: ayri veritabani (insa_test), ayri port (8056), ayri Directus sureci.
// Kume (panel/.veri) gelistirmeyle ortak; yoksa acilir.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { envHazirla, envOku, PANEL, psql } from '../betikler/ortak.mjs';
import { directusAyarDosyasi, kur } from '../betikler/kur.mjs';

let surec;

async function bekle(url, sure = 60_000) {
  const son = Date.now() + sure;
  while (Date.now() < son) {
    try {
      if ((await fetch(`${url}/server/ping`)).ok) return;
    } catch {
      // sunucu henuz acilmadi
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Directus ${url} adresinde ${sure / 1000} sn icinde acilmadi`);
}

export async function setup({ provide }) {
  envHazirla();
  const gelistirme = envOku();
  const env = {
    ...gelistirme,
    DB_DATABASE: 'insa_test',
    PORT: '8056',
    PUBLIC_URL: 'http://localhost:8056',
    LOG_LEVEL: 'warn',
  };

  // Temiz baslangic: onceki test veritabani silinir.
  psql(env, { veritabani: 'postgres', argumanlar: ['-c', 'DROP DATABASE IF EXISTS insa_test WITH (FORCE)'] });
  kur(env);

  surec = spawn(process.execPath, [join(PANEL, 'node_modules', 'directus', 'cli.js'), 'start'], {
    cwd: PANEL,
    env: { ...process.env, ...env, CONFIG_PATH: directusAyarDosyasi(env) },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  await bekle(env.PUBLIC_URL);

  provide('panel', { url: env.PUBLIC_URL, eposta: env.ADMIN_EMAIL, sifre: env.ADMIN_PASSWORD });
}

export async function teardown() {
  surec?.kill();
}
