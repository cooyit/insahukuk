// Betiklerin ortak yardimcilari: yollar, .env okuma, komut calistirma.
// Bilerek yalnizca Node'un kendi modulleri: betikler macOS, Linux ve Windows'ta ayni calissin.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PANEL = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KOK = join(PANEL, '..');
export const VERI = join(PANEL, '.veri');
export const KUME = join(VERI, 'kume');
export const ENV_DOSYASI = join(PANEL, '.env');

// .env'i (yoksa .env.ornek'ten) uretir; __RASTGELE__ yerlerine her biri icin ayri rastgele deger.
export function envHazirla() {
  if (existsSync(ENV_DOSYASI)) return false;
  const ornek = readFileSync(join(PANEL, '.env.ornek'), 'utf8');
  writeFileSync(ENV_DOSYASI, ornek.replace(/__RASTGELE__/g, () => randomBytes(18).toString('base64url')));
  return true;
}

// Basit .env okuyucu: ANAHTAR=deger satirlari; # ile baslayan satir yorum.
export function envOku(dosya = ENV_DOSYASI) {
  const env = {};
  for (const satir of readFileSync(dosya, 'utf8').split(/\r?\n/)) {
    const e = satir.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (e) env[e[1]] = e[2];
  }
  return env;
}

// PostgreSQL araci: PG_BIN verilmisse oradan, yoksa PATH'ten.
export function pgArac(env, ad) {
  const uzanti = process.platform === 'win32' ? '.exe' : '';
  return env.PG_BIN ? join(env.PG_BIN, `${ad}${uzanti}`) : ad;
}

// Komutu calistirir; basarisizsa ciktisini gostererek durur.
export function calistir(komut, argumanlar, secenek = {}) {
  const sonuc = spawnSync(komut, argumanlar, { encoding: 'utf8', ...secenek, env: { ...process.env, ...secenek.env } });
  if (sonuc.error) throw new Error(`${komut} calistirilamadi: ${sonuc.error.message}`);
  if (sonuc.status !== 0 && !secenek.hataSerbest) {
    throw new Error(`${komut} ${argumanlar.join(' ')} -> cikis ${sonuc.status}\n${sonuc.stdout ?? ''}${sonuc.stderr ?? ''}`);
  }
  return sonuc;
}

// psql: her zaman TCP + parola (Windows'ta unix soketi yok). ON_ERROR_STOP: ilk hatada dur.
// LC_MESSAGES=C: hata metinleri makinenin diline gore degismesin (testler metne bakiyor).
export function psql(env, { veritabani, kullanici = 'postgres', sifre = env.PG_SUPER_SIFRE, argumanlar = [], hataSerbest = false }) {
  return calistir(
    pgArac(env, 'psql'),
    ['-X', '-v', 'ON_ERROR_STOP=1', '-q', '-h', env.DB_HOST, '-p', env.DB_PORT, '-U', kullanici, '-d', veritabani, ...argumanlar],
    { env: { PGPASSWORD: sifre, LC_MESSAGES: 'C', LC_ALL: 'C' }, hataSerbest },
  );
}

export function sorgu(env, veritabani, sql, kullanici, sifre) {
  return psql(env, { veritabani, kullanici, sifre, argumanlar: ['-At', '-c', sql] }).stdout.trim();
}
