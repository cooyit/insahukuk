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

describe('kural: onay ve anonimlestirme bilgisi sahtelenemez (yalniz akis yazar)', () => {
  it('editorun gonderdigi onay zamani ve onaylayan yok sayilir; gercek onaylayan yazilir', async () => {
    const editor = await editorGirisi();
    const { govde: yon } = await istek(yonetici, 'GET', '/users/me?fields=id');
    const { govde: ben } = await istek(editor, 'GET', '/users/me?fields=id');
    const { durum, govde } = await istek(editor, 'POST', '/items/yayin?fields=onay_zamani,onaylayan', {
      tur: 'duyuru', durum: 'yayinda', yayin_tarihi: '2026-10-01T09:00:00+03:00',
      onay_zamani: '2020-01-01T00:00:00Z', onaylayan: yon.data.id,
      ceviriler: [{ dil: 'tr', slug: 'sahte-onay', baslik: 'Sahte Onay' }],
    });
    expect(durum).toBe(200);
    expect(govde.data.onaylayan).toBe(ben.data.id);
    expect(govde.data.onay_zamani.startsWith('2020')).toBe(false);
  });

  it('taslakta gonderilen onay zamani silinir', async () => {
    const { govde } = await istek(yonetici, 'POST', '/items/yayin?fields=onay_zamani,onaylayan', {
      tur: 'duyuru', durum: 'taslak', onay_zamani: '2020-01-01T00:00:00Z',
      ceviriler: [{ dil: 'tr', slug: 'taslak-sahte-onay', baslik: 'Taslak Sahte Onay' }],
    });
    expect(govde.data).toEqual({ onay_zamani: null, onaylayan: null });
  });

  it('isaret olmadan gonderilen anonimlestirme zamani silinir (karar anonim sayilmaz)', async () => {
    const { durum, govde } = await istek(yonetici, 'POST', '/items/karar?fields=anonimlestirildi,anonimlestirme_zamani', {
      mahkeme_id: 4, karar_tarihi: '2025-03-03', slug: 'sahte-anonim', konu: 'Sahte anonim (ÖRNEK)', durum: 'taslak',
      anonimlestirme_zamani: '2020-01-01T00:00:00Z',
    });
    expect(durum).toBe(200);
    expect(govde.data).toEqual({ anonimlestirildi: false, anonimlestirme_zamani: null });
  });
});

describe('kural: yeniden calistirma pasiflesmis akis ve koleksiyonu tekrar acar', () => {
  it('kapatilan onay akisi ve pasif koleksiyon yapilandirmayla yeniden aktif olur', async () => {
    const { url, eposta, sifre } = panel();
    const { govde: akis } = await istek(yonetici, 'GET', '/flows?filter[name][_eq]=Yayın onayı&fields=id');
    await istek(yonetici, 'PATCH', `/flows/${akis.data[0].id}`, { status: 'inactive' });
    await istek(yonetici, 'PATCH', '/collections/yonlendirme', { meta: { status: 'inactive' } });

    const { yapilandir } = await import('../betikler/yapilandir.mjs');
    const rapor = await yapilandir({ PUBLIC_URL: url, ADMIN_EMAIL: eposta, ADMIN_PASSWORD: sifre });
    expect(rapor.akislar).toContain('Yayın onayı');

    const { govde: a } = await istek(yonetici, 'GET', `/flows/${akis.data[0].id}?fields=status`);
    expect(a.data.status).toBe('active');
    const { govde: k } = await istek(yonetici, 'GET', '/collections/yonlendirme');
    expect(k.data.meta.status).toBe('active');
    const { govde: l } = await istek(yonetici, 'GET', '/license');
    expect(l.data.status).toBe('active');
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
