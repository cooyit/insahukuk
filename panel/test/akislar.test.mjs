import { beforeAll, describe, expect, it } from 'vitest';
import { AKISLAR } from '../yapilandirma/akislar.mjs';
import { editorGirisi, girisYap, istek, panel } from './api.mjs';

let yonetici;

beforeAll(async () => {
  yonetici = await girisYap();
});

describe('kural: akislar lisans sinirinda kurulur', () => {
  it('uc akis aktif; sayac sinirin altinda; kurulum kilitlenmedi', async () => {
    const { rapor } = panel();
    expect(rapor.akislar).toEqual(AKISLAR.map((a) => a.ad));
    expect(rapor.lisansBekleyenAkis).toEqual([]);
    const { govde } = await istek(yonetici, 'GET', '/license');
    expect(govde.data.status).toBe('active');
    expect(govde.data.usage.flows).toBe(AKISLAR.length);
  });

  it('yeniden calistirmada akis ve islem cogalmaz', async () => {
    const { govde } = await istek(yonetici, 'GET', '/flows?limit=-1&fields=name,operations.id');
    for (const a of AKISLAR) {
      const bulunan = govde.data.filter((x) => x.name === a.ad);
      expect(bulunan.length, a.ad).toBe(1);
      expect(bulunan[0].operations.length, a.ad).toBe(1);
    }
  });
});

describe('kural: "yayinda" icin onay bilgisi otomatik dolar (veritabani CHECK)', () => {
  it('yalniz durum degistirilince onay zamani ve onaylayan dolar; kayit kabul edilir', async () => {
    const { govde: olusan } = await istek(yonetici, 'POST', '/items/yayin', {
      tur: 'makale', durum: 'taslak', ceviriler: [{ dil: 'tr', slug: 'onay-testi', baslik: 'Onay Testi' }],
    });
    const id = olusan.data.id;
    const { durum } = await istek(yonetici, 'PATCH', `/items/yayin/${id}`, { durum: 'yayinda', yayin_tarihi: '2026-10-01T09:00:00+03:00' });
    expect(durum).toBe(200);
    const { govde } = await istek(yonetici, 'GET', `/items/yayin/${id}?fields=durum,onay_zamani,onaylayan`);
    expect(govde.data.durum).toBe('yayinda');
    expect(govde.data.onay_zamani).toBeTruthy();
    const { govde: ben } = await istek(yonetici, 'GET', '/users/me?fields=id');
    expect(govde.data.onaylayan).toBe(ben.data.id);
  });

  it('taslak kayitta onay bilgisi dolmaz', async () => {
    const { govde } = await istek(yonetici, 'POST', '/items/yayin?fields=onay_zamani', {
      tur: 'duyuru', durum: 'taslak', ceviriler: [{ dil: 'tr', slug: 'taslak-kalsin', baslik: 'Taslak Kalsın' }],
    });
    expect(govde.data.onay_zamani).toBeNull();
  });
});

describe('kural: karar anonimlestirme isareti ve zamani birlikte degisir (veritabani CHECK)', () => {
  it('isaretlenince zaman ve kisi dolar; yayina alinabilir; isaret kaldirilinca temizlenir', async () => {
    const { govde: olusan, durum: d0 } = await istek(yonetici, 'POST', '/items/karar', {
      mahkeme_id: 4, karar_tarihi: '2025-03-01', slug: 'akis-testi-karari', konu: 'Akış testi (ÖRNEK)', durum: 'taslak',
    });
    expect(d0).toBe(200);
    const id = olusan.data.id;

    const yayin = await istek(yonetici, 'PATCH', `/items/karar/${id}`, { anonimlestirildi: true, durum: 'yayinda', yayin_tarihi: '2026-10-01T09:00:00+03:00' });
    expect(yayin.durum).toBe(200);
    const { govde } = await istek(yonetici, 'GET', `/items/karar/${id}?fields=anonimlestirme_zamani,anonimlestiren,onay_zamani`);
    expect(govde.data.anonimlestirme_zamani).toBeTruthy();
    expect(govde.data.anonimlestiren).toBeTruthy();
    expect(govde.data.onay_zamani).toBeTruthy();

    const geri = await istek(yonetici, 'PATCH', `/items/karar/${id}`, { durum: 'taslak', anonimlestirildi: false });
    expect(geri.durum).toBe(200);
    const { govde: sonra } = await istek(yonetici, 'GET', `/items/karar/${id}?fields=anonimlestirme_zamani,anonimlestiren`);
    expect(sonra.data).toEqual({ anonimlestirme_zamani: null, anonimlestiren: null });
  });

  it('anonimlestirilmeden yayina alma yine reddedilir (akis isareti kendisi koymaz)', async () => {
    const { govde: olusan } = await istek(yonetici, 'POST', '/items/karar', {
      mahkeme_id: 4, karar_tarihi: '2025-03-02', slug: 'anonim-olmayan', konu: 'Anonim değil (ÖRNEK)', durum: 'taslak',
    });
    const { durum } = await istek(yonetici, 'PATCH', `/items/karar/${olusan.data.id}`, { durum: 'yayinda', yayin_tarihi: '2026-10-01T09:00:00+03:00' });
    expect(durum).toBeGreaterThanOrEqual(400);
  });
});

describe('kural: "Yayimla" dugmesi derleme kuyruguna is ekler', () => {
  it('editor dugmeye basinca kuyrukta, isteyeni kendisi olan bir is olusur', async () => {
    const editor = await editorGirisi();
    const { govde: akislar } = await istek(yonetici, 'GET', '/flows?filter[name][_eq]=Yayımla&fields=id');
    const { durum } = await istek(editor, 'POST', `/flows/trigger/${akislar.data[0].id}`, { collection: 'yayin', keys: [] });
    expect(durum).toBe(200);
    const { govde } = await istek(yonetici, 'GET', '/items/derleme_isi?sort=-id&limit=1&fields=durum,isteyen');
    const { govde: ben } = await istek(editor, 'GET', '/users/me?fields=id');
    expect(govde.data[0]).toEqual({ durum: 'kuyrukta', isteyen: ben.data.id });
  });
});
