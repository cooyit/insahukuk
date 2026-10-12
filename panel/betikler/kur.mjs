// Yerel paneli sifirdan ya da kaldigi yerden kurar (tekrar calistirilabilir):
//   1. .env yoksa uretir   2. PostgreSQL kumesini baslatir   3. rol ve veritabanini acar
//   4. directus bootstrap (Directus tablolari + ilk yonetici)   5. db/schema.sql   6. db/ornek_veri.sql
//   7. Directus'u (gerekirse gecici) acip panel yapilandirmasini uygular
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

function uygulamaSorgusu(env, sql) {
  return sorgu(env, env.DB_DATABASE, sql, env.DB_USER, env.DB_PASSWORD);
}

function dosyaYukle(env, dosya) {
  psql(env, { veritabani: env.DB_DATABASE, kullanici: env.DB_USER, sifre: env.DB_PASSWORD, argumanlar: ['-f', join(KOK, 'db', dosya)] });
}

// Sema ve ornek veri ayri ayri denetlenir: ikisi ayri islemle (BEGIN/COMMIT) yuklenir; ornek veri
// hata verirse bir sonraki calistirmada yine yuklenmeli (kod incelemesi). ornek_veri.sql tek islem
// oldugu icin ya tamami girer ya hicbiri; site_ayar'in bos olmasi "hic yuklenmedi" demektir.
function semaYukluMu(env) {
  return uygulamaSorgusu(env, "SELECT to_regclass('public.kisi') IS NOT NULL") === 't';
}

function veriYukle(env) {
  const sonuc = { sema: false, ornekVeri: false };
  if (!semaYukluMu(env)) {
    dosyaYukle(env, 'schema.sql');
    sonuc.sema = true;
  }
  if (uygulamaSorgusu(env, 'SELECT count(*) FROM site_ayar') === '0') {
    dosyaYukle(env, 'ornek_veri.sql');
    sonuc.ornekVeri = true;
  }
  return sonuc;
}

// Directus tablolari (bootstrap) dahil veritabanini hazirlar; sema icin calisan bir Directus gerekmez.
export function kur(env) {
  baslat(env);
  rolVeVeritabani(env);
  // bootstrap tekrar calistirilabilir: tablolar varsa yalnizca eksik goc (migration) uygular.
  directus(env, ['bootstrap']);
  return veriYukle(env);
}

// Yapilandirma REST ile uygulanir, yani Directus calisiyor olmali: panel zaten aciksa onu kullanir,
// degilse gecici olarak acip kapatir. Directus yeni tablolari ancak acilista gordugu icin (db/README.md)
// sema yuklenecekse panel KAPALI olmali; bu, sema yuklenmeden ONCE denetlenir (kod incelemesi: sonra
// denetlenince ikinci calistirma kontrolu atliyordu).
export async function kurVeYapilandir(env) {
  const { ayaktaMi, directusBaslat } = await import('./sunucu.mjs');
  const { yapilandir } = await import('./yapilandir.mjs');
  const acik = await ayaktaMi(env.PUBLIC_URL);
  if (acik) {
    baslat(env);
    rolVeVeritabani(env);
    if (!semaYukluMu(env)) {
      throw new Error('Panel acik ama sema henuz yuklu degil: Directus yeni tablolari gormez. Paneli kapatip "npm run kur" calistirin.');
    }
  }
  const yuklenen = kur(env);
  const sunucu = acik ? null : await directusBaslat(env);
  try {
    return { yuklenen, rapor: await yapilandir(env) };
  } finally {
    sunucu?.kapat();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const yeni = envHazirla();
  const env = envOku();
  const { yuklenen, rapor } = await kurVeYapilandir(env);
  const { raporuYaz } = await import('./yapilandir.mjs');
  console.log(yeni ? '.env uretildi (yonetici parolasi .env icinde: ADMIN_PASSWORD).' : '.env mevcut.');
  console.log(`Sema: ${yuklenen.sema ? 'yuklendi' : 'zaten yuklu'}; ornek veri: ${yuklenen.ornekVeri ? 'yuklendi' : 'zaten yuklu'}.`);
  raporuYaz(rapor);
  console.log(`Paneli baslatmak icin: npm run panel  (${env.PUBLIC_URL})`);
}
