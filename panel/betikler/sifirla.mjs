// Gelistirme veritabanini (DB_DATABASE) siler ve sifirdan kurar: sema + ornek veri + yapilandirma.
// Panelde yapilan elle degisiklikler ve yuklenen icerik gider; kume (panel/.veri) kalir.
// Panel (npm run panel) acikken calistirmayin: once kapatin.
import { envHazirla, envOku, psql } from './ortak.mjs';
import { kurVeYapilandir } from './kur.mjs';
import { ayaktaMi } from './sunucu.mjs';
import { baslat } from './veritabani.mjs';

envHazirla();
const env = envOku();
if (await ayaktaMi(env.PUBLIC_URL)) {
  console.error('Panel acik. Once kapatin (npm run panel calisan pencerede Ctrl+C), sonra tekrar deneyin.');
  process.exit(2);
}
baslat(env);
psql(env, { veritabani: 'postgres', argumanlar: ['-c', `DROP DATABASE IF EXISTS "${env.DB_DATABASE}" WITH (FORCE)`] });
const { rapor } = await kurVeYapilandir(env);
console.log(`Sifirlandi: ${env.DB_DATABASE}; koleksiyon ${rapor.lisans.kullanilanKoleksiyon}, alan ${rapor.alanSayisi}, iliski ${rapor.iliskiSayisi}`);
