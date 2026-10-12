// Yerel paneli sifirdan ya da kaldigi yerden kurar (tekrar calistirilabilir):
//   1. .env yoksa uretir   2. PostgreSQL kumesini baslatir   3. rol ve veritabanini acar
//   4. directus bootstrap (Directus tablolari + ilk yonetici)   5. db/schema.sql + db/ornek_veri.sql
// Sira db/README.md "Kurulum sirasi" ile ayni: sema directus_users/directus_files'a baglandigi icin
// once Directus tablolari olusmali.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calistir, envHazirla, envOku, KOK, PANEL, psql, sorgu, VERI } from './ortak.mjs';
import { baslat } from './veritabani.mjs';

const DIRECTUS_CLI = join(PANEL, 'node_modules', 'directus', 'cli.js');

// Directus ayar dosyasini (CONFIG_PATH) verilen env'den uretir. Directus panel/.env'i surec ortam
// degiskenlerinin onune koydugu icin test ortami (insa_test) ayri bir dosyayla calismali.
export function directusAyarDosyasi(env) {
  mkdirSync(VERI, { recursive: true });
  const dosya = join(VERI, `directus-${env.DB_DATABASE}.env`);
  writeFileSync(dosya, Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'));
  return dosya;
}

// Directus CLI'yi verilen env ile calistirir; Windows'ta .cmd sorunu olmasin diye node ile
// dogrudan cli.js cagrilir.
export function directus(env, argumanlar, secenek = {}) {
  return calistir(process.execPath, [DIRECTUS_CLI, ...argumanlar], {
    cwd: PANEL,
    env: { ...env, CONFIG_PATH: directusAyarDosyasi(env) },
    ...secenek,
  });
}

function rolVeVeritabani(env) {
  const rolVar = sorgu(env, 'postgres', `SELECT 1 FROM pg_roles WHERE rolname = '${env.DB_USER}'`);
  if (!rolVar) {
    psql(env, { veritabani: 'postgres', argumanlar: ['-c', `CREATE ROLE "${env.DB_USER}" LOGIN PASSWORD '${env.DB_PASSWORD}'`] });
  }
  const dbVar = sorgu(env, 'postgres', `SELECT 1 FROM pg_database WHERE datname = '${env.DB_DATABASE}'`);
  if (!dbVar) {
    psql(env, {
      veritabani: 'postgres',
      argumanlar: ['-c', `CREATE DATABASE "${env.DB_DATABASE}" OWNER "${env.DB_USER}" TEMPLATE template0 ENCODING 'UTF8'`],
    });
  }
}

function semaYukle(env) {
  const kullanici = { kullanici: env.DB_USER, sifre: env.DB_PASSWORD };
  if (sorgu(env, env.DB_DATABASE, "SELECT to_regclass('public.kisi') IS NOT NULL", kullanici.kullanici, kullanici.sifre) === 't') return false;
  psql(env, {
    veritabani: env.DB_DATABASE,
    ...kullanici,
    argumanlar: ['-f', join(KOK, 'db', 'schema.sql'), '-f', join(KOK, 'db', 'ornek_veri.sql')],
  });
  return true;
}

export function kur(env) {
  baslat(env);
  rolVeVeritabani(env);
  // bootstrap tekrar calistirilabilir: tablolar varsa yalnizca eksik goc (migration) uygular.
  directus(env, ['bootstrap']);
  return semaYukle(env);
}

// Yapilandirma REST ile uygulanir, yani Directus calisiyor olmali: panel zaten aciksa onu kullanir,
// degilse gecici olarak acip kapatir. Directus yeni tablolari ancak acilista gordugu icin (db/README.md)
// sema yuklendikten sonra acilmasi da gerekir.
export async function kurVeYapilandir(env) {
  const semaYuklendi = kur(env);
  const { ayaktaMi, directusBaslat } = await import('./sunucu.mjs');
  const { yapilandir } = await import('./yapilandir.mjs');
  const acik = await ayaktaMi(env.PUBLIC_URL);
  if (acik && semaYuklendi) {
    throw new Error('Sema yeni yuklendi ama panel zaten acik: Directus yeni tablolari gormez. Paneli kapatip tekrar "npm run kur" calistirin.');
  }
  const sunucu = acik ? null : await directusBaslat(env);
  try {
    return { semaYuklendi, rapor: await yapilandir(env) };
  } finally {
    sunucu?.kapat();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const yeni = envHazirla();
  const env = envOku();
  const { semaYuklendi, rapor } = await kurVeYapilandir(env);
  console.log(yeni ? '.env uretildi (yonetici parolasi .env icinde: ADMIN_PASSWORD).' : '.env mevcut.');
  console.log(semaYuklendi ? 'Sema ve ornek veri yuklendi.' : 'Sema zaten yuklu; dokunulmadi.');
  const sinir = rapor.lisans.koleksiyonSiniri === -1 ? 'sinirsiz' : rapor.lisans.koleksiyonSiniri;
  console.log(`Yapilandirma: lisans ${rapor.lisans.ad}, koleksiyon ${rapor.lisans.kullanilanKoleksiyon}/${sinir}, alan ${rapor.alanSayisi}, iliski ${rapor.iliskiSayisi}`);
  if (rapor.lisansBekleyen.length) console.log(`Lisans bekleyen koleksiyonlar: ${rapor.lisansBekleyen.join(', ')}`);
  console.log(`Roller: ${rapor.roller.join(', ') || '-'}${rapor.lisansBekleyenYetki.length ? `; lisans bekleyen: ${rapor.lisansBekleyenYetki.join(', ')}` : ''}`);
  console.log(`Paneli baslatmak icin: npm run panel  (${env.PUBLIC_URL})`);
}
