// Iletisim formu servisi. Sitenin formu POST /api/iletisim'e gelir (canlida ters vekil bu yolu
// buraya yonlendirir); veri dogrulanir ve Directus'a, yalnizca mesaj olusturabilen "Form servisi"
// kullanicisinin anahtariyla yazilir. Ek paket yok: node:http ve fetch.
//
// Yanit: sitenin betigi (Accept: application/json) JSON alir ve "mesaj"i gosterir; betik
// calismiyorsa form sayfa olarak gonderilir ve kucuk bir HTML sayfa doner. "Alindi" yalnizca kayit
// Directus'a yazildiktan sonra denir; basari metni sitede degil burada (sahte "gonderildi" yok).
// Kayitlara (log) kisisel veri yazilmaz; yalnizca durum kodlari.
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { envOku } from '../betikler/ortak.mjs';
import { formuDogrula } from './dogrula.mjs';

export const YOL = '/api/iletisim';
const AZAMI_GOVDE = 32 * 1024;
// Bal kupu: insanin gormedigi alan (sitede "hidden"); dolu gelirse gonderen bir bottur.
const BAL_KUPU = 'web_sitesi';

const METIN = {
  tr: {
    baslik: 'İletişim formu',
    geri: 'İletişim sayfasına dön',
    alindi: 'Mesajınız bize ulaştı. Teşekkür ederiz.',
    alanHatasi: 'Mesajınız alınamadı. Lütfen şu alanları kontrol edin:',
    reddedildi: 'Mesajınız alınamadı. Lütfen e-posta ya da telefonla ulaşın.',
    cokSik: 'Kısa sürede çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.',
    kaydedilemedi: 'Mesajınız şu anda kaydedilemedi. Lütfen daha sonra tekrar deneyin ya da e-posta veya telefonla ulaşın.',
    alanlar: { ad: 'Ad soyad', eposta: 'E-posta', telefon: 'Telefon', konu_turu: 'Konu', mesaj: 'Mesajınız' },
  },
  en: {
    baslik: 'Contact form',
    geri: 'Back to the contact page',
    alindi: 'Your message has reached us. Thank you.',
    alanHatasi: 'Your message could not be accepted. Please check these fields:',
    reddedildi: 'Your message could not be accepted. Please contact us by e-mail or phone.',
    cokSik: 'Too many attempts in a short time. Please try again later.',
    kaydedilemedi: 'Your message could not be saved right now. Please try again later or contact us by e-mail or phone.',
    alanlar: { ad: 'Full name', eposta: 'E-mail', telefon: 'Phone', konu_turu: 'Subject', mesaj: 'Your message' },
  },
};

// Kayan pencere: anahtar basina "pencere" ms icinde en fazla "adet" deneme. Bellekte tutulur;
// servis yeniden baslayinca sifirlanir (tek sunucu icin yeterli).
export function hizSiniri({ adet, pencere }, simdi = Date.now) {
  const denemeler = new Map();
  return (anahtar) => {
    const t = simdi();
    for (const [k, z] of denemeler) if (z.at(-1) <= t - pencere) denemeler.delete(k);
    const z = (denemeler.get(anahtar) ?? []).filter((x) => x > t - pencere);
    const izin = z.length < adet;
    if (izin) z.push(t);
    denemeler.set(anahtar, z);
    return izin;
  };
}

// Ziyaretcinin IP'si. Vekil arkasinda (Caddy) son X-Forwarded-For degeri vekilin gordugu adrestir;
// oncekiler istemcinin kendi yazabilecegi degerlerdir.
function istemciIp(istek, vekilArkasinda) {
  const xff = istek.headers['x-forwarded-for'];
  if (vekilArkasinda && xff) return xff.split(',').at(-1).trim();
  return istek.socket.remoteAddress ?? '';
}

function kacis(s) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function htmlSayfa(dil, mesaj) {
  const m = METIN[dil];
  const geri = dil === 'en' ? '/en/contact' : '/iletisim';
  return `<!doctype html>
<html lang="${dil}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${m.baslik}</title>
<style>body{font-family:system-ui,sans-serif;line-height:1.5;max-width:40rem;margin:2rem auto;padding:0 1rem}</style>
</head>
<body>
<main>
<h1>${m.baslik}</h1>
<p role="status">${kacis(mesaj)}</p>
<p><a href="${geri}">${m.geri}</a></p>
</main>
</body>
</html>
`;
}

function yanitla(yanit, { json, dil, durum, tamam, mesaj }) {
  const govde = json ? JSON.stringify({ tamam, mesaj }) : htmlSayfa(dil, mesaj);
  yanit.writeHead(durum, {
    'content-type': json ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    'referrer-policy': 'no-referrer',
  });
  yanit.end(govde);
}

// Govdeyi sinirla okur; sinir asilirsa null.
async function govdeOku(istek) {
  const parcalar = [];
  let boyut = 0;
  for await (const p of istek) {
    boyut += p.length;
    if (boyut > AZAMI_GOVDE) return null;
    parcalar.push(p);
  }
  return Buffer.concat(parcalar).toString('utf8');
}

// ayar: { directusUrl, token, ipAnahtari, izinliKaynaklar: string[], vekilArkasinda, hiz: { adet, pencere } }
export function formSunucusu(ayar) {
  const izinVer = hizSiniri(ayar.hiz);

  async function isle(istek, yanit) {
    const json = (istek.headers.accept ?? '').includes('application/json');
    const cevap = (durum, dil, mesajAnahtari, ek = '') =>
      yanitla(yanit, { json, dil, durum, tamam: durum === 200, mesaj: `${METIN[dil][mesajAnahtari]}${ek}` });

    const yol = new URL(istek.url, 'http://x').pathname;
    if (yol !== YOL) return cevap(404, 'tr', 'reddedildi');
    if (istek.method !== 'POST') {
      yanit.setHeader('allow', 'POST');
      return cevap(405, 'tr', 'reddedildi');
    }
    // Baska bir sitenin sayfasindan bu forma gonderim (CSRF) reddedilir. Origin'siz istek
    // (tarayici disi istemci) hiz siniriyla sinirlanir.
    const kaynak = istek.headers.origin;
    if (kaynak && !ayar.izinliKaynaklar.includes(kaynak)) return cevap(403, 'tr', 'reddedildi');
    if (!(istek.headers['content-type'] ?? '').startsWith('application/x-www-form-urlencoded')) {
      return cevap(415, 'tr', 'reddedildi');
    }

    const ipHmac = createHmac('sha256', ayar.ipAnahtari).update(istemciIp(istek, ayar.vekilArkasinda)).digest('hex');
    if (!izinVer(ipHmac)) return cevap(429, 'tr', 'cokSik');

    const metin = await govdeOku(istek);
    if (metin === null) {
      yanit.setHeader('connection', 'close');
      return cevap(413, 'tr', 'reddedildi');
    }
    const alanlar = Object.fromEntries(new URLSearchParams(metin));
    const dil = alanlar.dil === 'en' ? 'en' : 'tr';

    if (alanlar[BAL_KUPU]) return cevap(400, dil, 'reddedildi');
    const { hatalar, satir } = formuDogrula(alanlar);
    // Aydinlatma surumunu ziyaretci duzeltemez (sitenin gizli alani); genel ret.
    if (hatalar.includes('aydinlatma_surumu')) return cevap(400, dil, 'reddedildi');
    if (hatalar.length) return cevap(400, dil, 'alanHatasi', ` ${hatalar.map((h) => METIN[dil].alanlar[h]).join(', ')}.`);

    let durum;
    try {
      const kayit = await fetch(`${ayar.directusUrl}/items/iletisim_mesaji`, {
        method: 'POST',
        headers: { authorization: `Bearer ${ayar.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ...satir, ip_hmac: ipHmac }),
        signal: AbortSignal.timeout(10_000),
      });
      await kayit.arrayBuffer();
      durum = kayit.status;
    } catch (hata) {
      durum = hata.name;
    }
    if (durum !== 200 && durum !== 204) {
      console.error(`form: Directus kaydi basarisiz (${durum})`);
      return cevap(502, dil, 'kaydedilemedi');
    }
    return cevap(200, dil, 'alindi');
  }

  return createServer((istek, yanit) => {
    isle(istek, yanit).catch((hata) => {
      console.error(`form: beklenmeyen hata (${hata.name})`);
      if (!yanit.headersSent) yanitla(yanit, { json: true, dil: 'tr', durum: 500, tamam: false, mesaj: METIN.tr.kaydedilemedi });
      else yanit.destroy();
    });
  });
}

// panel/.env'den servis ayarlari. Eksik gizli deger varsa acik bir mesajla durur.
export function ayarlar(env) {
  for (const ad of ['FORM_DIRECTUS_TOKEN', 'FORM_IP_ANAHTARI']) {
    if (!env[ad]) throw new Error(`panel/.env'de ${ad} yok; "npm run kur" eksik ayarlari ekler.`);
  }
  return {
    directusUrl: env.PUBLIC_URL,
    token: env.FORM_DIRECTUS_TOKEN,
    ipAnahtari: env.FORM_IP_ANAHTARI,
    izinliKaynaklar: (env.FORM_IZINLI_KAYNAK ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    vekilArkasinda: env.FORM_VEKIL_ARKASINDA === 'evet',
    hiz: { adet: Number(env.FORM_HIZ_ADET ?? 5), pencere: Number(env.FORM_HIZ_DAKIKA ?? 10) * 60_000 },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const env = envOku();
  const port = Number(env.FORM_PORT ?? 8065);
  const host = env.FORM_HOST ?? '127.0.0.1';
  formSunucusu(ayarlar(env)).listen(port, host, () => console.log(`Form servisi: http://${host}:${port}${YOL}`));
}
