import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { editorGirisi, girisYap, istek, panel } from './api.mjs';

// Sahte SMTP (hazirlik.mjs) her e-postayi panel().posta klasorune .eml olarak yazar.
// Govde ve konu basligi nodemailer'in kodlamasindan (quoted-printable / base64) cozulur.
function qp(s) {
  return Buffer.from(s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8');
}

function baslikCoz(s) {
  return s.replace(/=\?utf-8\?([QB])\?([^?]*)\?=/gi, (_, tur, v) =>
    tur.toUpperCase() === 'B' ? Buffer.from(v, 'base64').toString('utf8') : qp(v.replace(/_/g, ' ')));
}

function eposta(dosya) {
  const ham = readFileSync(join(panel().posta, dosya), 'utf8');
  const ayrim = ham.indexOf('\r\n\r\n');
  const basliklar = ham.slice(0, ayrim).replace(/\r\n[ \t]+/g, ' ');
  const govde = ham.slice(ayrim + 4);
  const baslik = (ad) => basliklar.match(new RegExp(`^${ad}: (.*)$`, 'mi'))?.[1] ?? '';
  const kodlama = baslik('Content-Transfer-Encoding').toLowerCase();
  return {
    ham,
    alicilar: baslik('X-Sahte-Alicilar').split(', '),
    konu: baslikCoz(baslik('Subject')),
    govde: kodlama === 'base64' ? Buffer.from(govde, 'base64').toString('utf8') : kodlama === 'quoted-printable' ? qp(govde) : govde,
  };
}

// Mesajin kimligini iceren bildirimi bekler (diger testlerin e-postalariyla karismaz).
async function bildirimBekle(id, sure = 15_000) {
  const son = Date.now() + sure;
  while (Date.now() < son) {
    for (const dosya of readdirSync(panel().posta)) {
      const e = eposta(dosya);
      if (e.govde.includes(`/admin/content/iletisim_mesaji/${id}`)) return e;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`mesaj ${id} icin bildirim gelmedi`);
}

const MESAJ = {
  ad: 'Gizlikalmali Kişi', eposta: 'gizli.gonderen@example.com', telefon: '+905551112233', konu_turu: 'randevu',
  mesaj: 'GIZLI-ICERIK-123', aydinlatma_surumu: 'aydinlatma-2026-10',
};

let yonetici;
let editor;
let ilkAyar;

async function mesajOlustur(token = yonetici) {
  const { durum, govde } = await istek(token, 'POST', '/items/iletisim_mesaji', MESAJ);
  expect(durum).toBe(200);
  return govde.data.id;
}

beforeAll(async () => {
  yonetici = await girisYap();
  editor = await editorGirisi();
  ilkAyar = (await istek(yonetici, 'GET', '/items/site_ayar?fields=eposta,form_bildirim_eposta')).govde.data;
});

afterAll(async () => {
  await istek(yonetici, 'PATCH', '/items/site_ayar', { form_bildirim_eposta: ilkAyar.form_bildirim_eposta });
});

describe('kural: yeni iletisim mesaji panelden secilen adrese bildirilir; e-postada kisisel veri yok', () => {
  it('bildirim "Form bildirim e-postasi"na gider; panel baglantisi var, mesaj ve gonderen bilgisi yok', async () => {
    const id = await mesajOlustur();
    const e = await bildirimBekle(id);
    expect(e.alicilar).toEqual([ilkAyar.form_bildirim_eposta]);
    expect(e.konu).toBe('Yeni iletişim mesajı');
    expect(e.govde).toContain(`${panel().url}/admin/content/iletisim_mesaji/${id}`);
    expect(e.govde).toContain('bu e-postada mesajın içeriği ve gönderenin bilgileri yer almaz');
    for (const kisisel of ['Gizlikalmali', 'gizli.gonderen', 'GIZLI-ICERIK', '5551112233']) {
      expect(e.ham, kisisel).not.toContain(kisisel);
      expect(e.govde, kisisel).not.toContain(kisisel);
    }
  });

  it('editor adresi panelden degistirince bildirim yeni adrese gider', async () => {
    expect((await istek(editor, 'PATCH', '/items/site_ayar', { form_bildirim_eposta: 'yeni.adres@example.com' })).durum).toBe(200);
    const e = await bildirimBekle(await mesajOlustur());
    expect(e.alicilar).toEqual(['yeni.adres@example.com']);
  });

  it('adres bos birakilinca buro e-postasina gider', async () => {
    expect((await istek(editor, 'PATCH', '/items/site_ayar', { form_bildirim_eposta: null })).durum).toBe(200);
    const e = await bildirimBekle(await mesajOlustur());
    expect(e.alicilar).toEqual([ilkAyar.eposta]);
  });

  it('form servisinin anahtariyla gelen mesaj da bildirilir (ayar sistem yetkisiyle okunur)', async () => {
    await istek(yonetici, 'PATCH', '/items/site_ayar', { form_bildirim_eposta: ilkAyar.form_bildirim_eposta });
    // Servis mesaji okuyamadigi icin yanit govdesiz (204); kimlik yoneticiyle bulunur.
    const { durum } = await istek(panel().formToken, 'POST', '/items/iletisim_mesaji', { ...MESAJ, eposta: 'servis.bildirim@example.com' });
    expect(durum).toBe(204);
    const { govde } = await istek(yonetici, 'GET', '/items/iletisim_mesaji?filter[eposta][_eq]=servis.bildirim@example.com&fields=id');
    const e = await bildirimBekle(govde.data[0].id);
    expect(e.alicilar).toEqual([ilkAyar.form_bildirim_eposta]);
  });
});
