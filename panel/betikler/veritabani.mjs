// Projeye ozel PostgreSQL 16 kumesi: panel/.veri/kume. Sistemdeki PostgreSQL'e dokunmaz.
// Kullanim: node betikler/veritabani.mjs baslat | durdur | durum
// Yalnizca 127.0.0.1 dinler, parola (scram) ister; unix soketi kapali (Windows'la ayni davranis).
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calistir, envHazirla, envOku, KUME, pgArac, VERI } from './ortak.mjs';

function kumeAc(env) {
  mkdirSync(VERI, { recursive: true });
  const sifreDosyasi = join(VERI, 'super-sifre.tmp');
  writeFileSync(sifreDosyasi, env.PG_SUPER_SIFRE);
  try {
    // --no-locale: kume C yerelli; Turkce siralama semada sutun bazinda (COLLATE "tr-x-icu").
    calistir(pgArac(env, 'initdb'), ['-D', KUME, '-U', 'postgres', '--auth=scram-sha-256', `--pwfile=${sifreDosyasi}`, '-E', 'UTF8', '--no-locale'], {
      env: { LC_ALL: 'C' },
    });
  } finally {
    rmSync(sifreDosyasi, { force: true });
  }
}

function calisiyorMu(env) {
  return calistir(pgArac(env, 'pg_ctl'), ['-D', KUME, 'status'], { hataSerbest: true }).status === 0;
}

export function baslat(env) {
  if (!existsSync(join(KUME, 'PG_VERSION'))) kumeAc(env);
  if (calisiyorMu(env)) return;
  calistir(pgArac(env, 'pg_ctl'), [
    '-D', KUME, '-w', '-l', join(VERI, 'postgres.log'),
    // Bos deger tirnaksiz: pg_ctl -o'yu kabukla (Windows'ta cmd.exe) iletir; cmd tek tirnagi harf sayar.
    '-o', `-p ${env.DB_PORT} -c listen_addresses=127.0.0.1 -c unix_socket_directories=`,
    'start',
  ]);
}

export function durdur(env) {
  if (calisiyorMu(env)) calistir(pgArac(env, 'pg_ctl'), ['-D', KUME, '-w', '-m', 'fast', 'stop']);
}

// Dogrudan calistirildiginda (npm run db:baslat ...) komut satirindan.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  envHazirla();
  const env = envOku();
  const komut = process.argv[2];
  if (komut === 'baslat') {
    baslat(env);
    console.log(`PostgreSQL calisiyor: 127.0.0.1:${env.DB_PORT} (${KUME})`);
  } else if (komut === 'durdur') {
    durdur(env);
    console.log('PostgreSQL durdu.');
  } else if (komut === 'durum') {
    console.log(calisiyorMu(env) ? 'calisiyor' : 'durmus');
  } else {
    console.error('Kullanim: node betikler/veritabani.mjs baslat | durdur | durum');
    process.exit(2);
  }
}
