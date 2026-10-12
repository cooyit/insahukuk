import { beforeAll, describe, expect, it } from 'vitest';
import { ONERILEN, ozelKuralMi, POLITIKALAR } from '../yapilandirma/yetkiler.mjs';
import { editorGirisi, girisYap, istek, panel } from './api.mjs';

const editorPolitikasi = POLITIKALAR.find((p) => p.ad === 'Editör');
const yazarPolitikasi = POLITIKALAR.find((p) => p.ad === 'Yazar');

describe('kural: lisanssiz katmanda ozel yetki kurali yok (olursa kurulum kilitlenir)', () => {
  it('ozel kural denetimi Directus ile ayni sonucu verir (ornekler)', () => {
    expect(ozelKuralMi({ collection: 'yayin', action: 'read', fields: ['*'] })).toBe(false);
    expect(ozelKuralMi({ collection: 'yayin', action: 'read', fields: ['id', 'durum'] })).toBe(true);
    expect(ozelKuralMi({ collection: 'yayin', action: 'update', fields: ['*'], permissions: { durum: { _eq: 'taslak' } } })).toBe(true);
    expect(ozelKuralMi({ collection: 'yayin', action: 'create', fields: ['*'], presets: { durum: 'taslak' } })).toBe(true);
    // Directus'un "onerilen" satiri filtreli olsa da muaf.
    const kendiProfili = ONERILEN.find((p) => p.collection === 'directus_users' && p.action === 'update');
    expect(ozelKuralMi(kendiProfili)).toBe(false);
  });

  it('Editor politikasinin hicbir satiri ozel kural degil', () => {
    expect(editorPolitikasi.yetkiler.filter(ozelKuralMi)).toEqual([]);
  });

  it('Yazar politikasi ozel kural iceriyor; bu yuzden lisans gerekir', () => {
    expect(yazarPolitikasi.lisansGerekir).toBe(true);
    expect(yazarPolitikasi.yetkiler.some(ozelKuralMi)).toBe(true);
  });

  it('lisanssiz test kurulumunda Editor uygulandi, Yazar lisans bekliyor, kurulum kilitlenmedi', async () => {
    const { rapor } = panel();
    expect(rapor.roller).toEqual(['Editör']);
    expect(rapor.lisansBekleyenYetki).toEqual(['Yazar']);
    const token = await girisYap();
    const { govde } = await istek(token, 'GET', '/license');
    expect(govde.data.status).toBe('active');
  });

  it('Editor yetki satirlarinin hepsi gecerli sayiliyor (Directus ozel kurali sessizce gizlerdi)', async () => {
    const token = await girisYap();
    const { govde: p } = await istek(token, 'GET', '/policies?filter[name][_eq]=Editör&fields=id,enforce_tfa,app_access,admin_access');
    expect(p.data[0]).toMatchObject({ enforce_tfa: true, app_access: true, admin_access: false });
    // Tam satir okunur: Directus'un ozel kural suzgeci satirin fields/permissions degerine bakiyor;
    // "fields=id" ile sorulunca filtreli onerilen satirlari da ozel sanip gizliyor (denendi).
    const { govde } = await istek(token, 'GET', `/permissions?filter[policy][_eq]=${p.data[0].id}&limit=-1`);
    expect(govde.data.length).toBe(editorPolitikasi.yetkiler.length);
  });
});

describe('kural: editor icerigi yonetir, sistemi yonetemez', () => {
  let editor;

  beforeAll(async () => {
    editor = await editorGirisi();
  });

  it('yayin + Turkce ceviri olusturur', async () => {
    const { durum } = await istek(editor, 'POST', '/items/yayin', {
      tur: 'makale', durum: 'taslak',
      ceviriler: [{ dil: 'tr', slug: 'editor-taslagi', baslik: 'Editör Taslağı' }],
    });
    expect(durum).toBe(200);
  });

  it('kisinin telefonunu ve calisma alanini ic ice gunceller', async () => {
    const { durum } = await istek(editor, 'PATCH', '/items/kisi/2', {
      telefonlar: { create: [{ tur: 'dahili', numara: '199', sitede_goster: true, sira: 9 }] },
    });
    expect(durum).toBe(200);
  });

  it('site ayarlarini (buro bilgileri) gunceller', async () => {
    const { durum } = await istek(editor, 'PATCH', '/items/site_ayar', { telefon: '+902120000001' });
    expect(durum).toBe(200);
  });

  it('gelen mesaji okur ama mesaj olusturamaz', async () => {
    expect((await istek(editor, 'GET', '/items/iletisim_mesaji')).durum).toBe(200);
    const { durum } = await istek(editor, 'POST', '/items/iletisim_mesaji', {
      ad: 'X', eposta: 'x@example.com', konu_turu: 'genel', mesaj: 'deneme', aydinlatma_surumu: 'a',
    });
    expect(durum).toBe(403);
  });

  it('yeni sabit sayfa acamaz (anahtarlari sitenin kodu kullanir)', async () => {
    expect((await istek(editor, 'POST', '/items/sayfa', { anahtar: 'yeni_sayfa' })).durum).toBe(403);
  });

  it('kullanici olusturamaz, rol ve politika degistiremez, sistem ayarina giremez', async () => {
    expect((await istek(editor, 'POST', '/users', { email: 'baska@ornek.av.tr', password: 'x' })).durum).toBe(403);
    expect((await istek(editor, 'POST', '/roles', { name: 'Kotu' })).durum).toBe(403);
    expect((await istek(editor, 'PATCH', '/settings', { project_name: 'X' })).durum).toBe(403);
    expect((await istek(editor, 'POST', '/collections', { collection: 'yeni_tablo', schema: {}, meta: {} })).durum).toBe(403);
  });

  it('dil tablosunu degistiremez (varsayilan dil Turkce kalir)', async () => {
    expect((await istek(editor, 'PATCH', '/items/dil/tr', { ad: 'X' })).durum).toBe(403);
  });
});
