// Directus sunucusunu (directus start) bir alt surec olarak acar ve hazir olunca doner.
// Kurulum betigi yapilandirmayi uygulamak icin, testler de ayri test ornegi icin kullanir.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { directusAyarDosyasi } from './kur.mjs';
import { PANEL } from './ortak.mjs';

export async function ayaktaMi(url) {
  try {
    return (await fetch(`${url}/server/ping`)).ok;
  } catch {
    return false;
  }
}

export async function directusBaslat(env, { sure = 60_000 } = {}) {
  const surec = spawn(process.execPath, [join(PANEL, 'node_modules', 'directus', 'cli.js'), 'start'], {
    cwd: PANEL,
    env: { ...process.env, ...env, CONFIG_PATH: directusAyarDosyasi(env) },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const son = Date.now() + sure;
  while (Date.now() < son) {
    if (await ayaktaMi(env.PUBLIC_URL)) return { kapat: () => surec.kill() };
    if (surec.exitCode !== null) throw new Error(`Directus acilamadi (cikis ${surec.exitCode})`);
    await new Promise((r) => setTimeout(r, 500));
  }
  surec.kill();
  throw new Error(`Directus ${env.PUBLIC_URL} adresinde ${sure / 1000} sn icinde acilmadi`);
}
