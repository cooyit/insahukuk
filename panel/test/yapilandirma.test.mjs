import { beforeAll, describe, expect, it } from 'vitest';
import { sinirPlani } from '../betikler/yapilandir.mjs';
import { KOLEKSIYONLAR } from '../yapilandirma/koleksiyonlar.mjs';
import { girisYap, istek, panel } from './api.mjs';

let token;

beforeAll(async () => {
  token = await girisYap();
});

describe('kural: lisans siniri asilmaz (asilirsa Directus kurulumu kilitler)', () => {
  it('plan: sinirdayken yeni koleksiyon eklenmez, var olanlar guncellenir', () => {
    const plan = sinirPlani(['a', 'b', 'c', 'd'], new Set(['b']), 3, 2);
    expect(plan.uygula).toEqual(['a', 'b']);
    expect(plan.bekleyen).toEqual(['c', 'd']);
    expect(plan.kullanilan).toBe(3);
  });

  it('plan: sinirsiz lisansta (-1) hepsi uygulanir', () => {
    expect(sinirPlani(['a', 'b'], new Set(), -1, 40).bekleyen).toEqual([]);
  });

  it('test kurulumunda butun ana koleksiyonlar sigdi ve kurulum kilitlenmedi', async () => {
    const { rapor } = panel();
    expect(rapor.lisansBekleyen).toEqual([]);
    expect(rapor.koleksiyonlar.length).toBe(KOLEKSIYONLAR.length);
    const { govde } = await istek(token, 'GET', '/license');
    expect(govde.data.status).toBe('active');
    expect(govde.data.usage.collections).toBe(KOLEKSIYONLAR.length);
    if (govde.data.entitlements.collections.limit !== -1) {
      expect(govde.data.usage.collections).toBeLessThanOrEqual(govde.data.entitlements.collections.limit);
    }
  });

  it('yapilandirma tekrar calistirilabilir: ikinci calistirma ayni sonucu verir, sayaci artirmaz', () => {
    const { ilkRapor, rapor } = panel();
    expect(rapor.koleksiyonlar).toEqual(ilkRapor.koleksiyonlar);
    expect(rapor.lisans.kullanilanKoleksiyon).toBe(ilkRapor.lisans.kullanilanKoleksiyon);
    expect(rapor.alanSayisi).toBe(ilkRapor.alanSayisi);
  });
});

describe('kural: panel Turkce ve menude yalnizca ana koleksiyonlar', () => {
  it('panelin varsayilan dili tr-TR; adi ve (yer tutucu) logosu buronun', async () => {
    const { govde } = await istek(token, 'GET', '/settings');
    expect(govde.data.default_language).toBe('tr-TR');
    expect(govde.data.project_name).toBe('İNŞA Yönetim Paneli');
    expect(govde.data.project_logo).toBeTruthy();
    // Yapilandirma iki kez calisti (hazirlik.mjs); logo bir kez yuklenmis olmali.
    const { govde: dosyalar } = await istek(token, 'GET', '/files?filter[filename_download][_eq]=insa-panel-logosu.svg&fields=id');
    expect(dosyalar.data.length).toBe(1);
  });

  it('ana koleksiyonlarin Turkce adi ve klasoru var; ceviri tablolari menude yok (meta almaz)', async () => {
    const { govde } = await istek(token, 'GET', '/collections');
    const yayin = govde.data.find((c) => c.collection === 'yayin');
    expect(yayin.meta.translations[0]).toMatchObject({ language: 'tr-TR', plural: 'Yayınlar' });
    expect(yayin.meta.group).toBe('klasor_icerik');
    expect(govde.data.find((c) => c.collection === 'yayin_ceviri').meta).toBeNull();
  });

  it('site ayarlari tek kayit (singleton)', async () => {
    const { govde } = await istek(token, 'GET', '/collections/site_ayar');
    expect(govde.data.meta.singleton).toBe(true);
  });
});

describe('kural: KVKK - iletisim mesajlarinin degisiklik kaydi tutulmaz', () => {
  it('iletisim_mesaji accountability kapali (directus_revisions\'a kopya dusmez)', async () => {
    const { govde } = await istek(token, 'GET', '/collections/iletisim_mesaji');
    expect(govde.data.meta.accountability).toBeNull();
  });

  it('IP (HMAC) alani formda gizli', async () => {
    const { govde } = await istek(token, 'GET', '/fields/iletisim_mesaji/ip_hmac');
    expect(govde.data.meta.hidden).toBe(true);
  });
});

describe('kural: editor bicim hatasini kaydetmeden once Turkce gorur (alan dogrulamasi)', () => {
  // Directus alan dogrulamasini API'de "FAILED_VALIDATION" ile uygular (kayit veritabanina gitmez);
  // Turkce mesaji (validation_message) formda, alan meta'sindan gosterir.
  async function reddedilir(yol, govde, alan, mesaj) {
    const { durum, govde: yanit } = await istek(token, 'PATCH', yol, govde);
    expect(durum).toBe(400);
    expect(yanit.errors[0].extensions).toMatchObject({ code: 'FAILED_VALIDATION', field: alan });
    const tablo = yol.split('/')[2];
    const { govde: f } = await istek(token, 'GET', `/fields/${tablo}/${alan}`);
    expect(f.data.meta.validation_message).toContain(mesaj);
  }

  it('gecersiz slug reddedilir; Turkce mesaj tanimli', async () => {
    await reddedilir('/items/kisi/3', { slug: 'Elif Demir' }, 'slug', 'Yalnızca küçük harf');
  });

  it('buyuk harfli e-posta reddedilir; Turkce mesaj tanimli', async () => {
    await reddedilir('/items/kisi/2', { eposta: 'Mehmet.Kaya@ornek.av.tr' }, 'eposta', 'Küçük harfli geçerli bir e-posta');
  });

  it('gecersiz form bildirim e-postasi reddedilir; Turkce mesaj tanimli', async () => {
    await reddedilir('/items/site_ayar', { form_bildirim_eposta: 'Bildirim@ornek.av.tr' }, 'form_bildirim_eposta', 'Küçük harfli geçerli bir e-posta');
  });

  it('bosluklu telefon reddedilir; Turkce mesaj tanimli', async () => {
    await reddedilir('/items/site_ayar', { telefon: '+90 212 000 00 00' }, 'telefon', 'Uluslararası biçimde');
  });

  it('gecerli deger kabul edilir', async () => {
    const { durum } = await istek(token, 'PATCH', '/items/kisi/3', { slug: 'elif-demir' });
    expect(durum).toBe(200);
  });

  it('istege bagli alan bosaltilabilir (form bildirim adresi silinince buro e-postasi kullanilir)', async () => {
    const { govde: once } = await istek(token, 'GET', '/items/site_ayar?fields=form_bildirim_eposta,faks');
    const bosalt = await istek(token, 'PATCH', '/items/site_ayar', { form_bildirim_eposta: null, faks: null });
    expect(bosalt.durum).toBe(200);
    expect((await istek(token, 'PATCH', '/items/site_ayar', once.data)).durum).toBe(200);
  });

  it('zorunlu alanda kural degismedi: bos e-posta reddedilir', async () => {
    const { govde: f } = await istek(token, 'GET', '/fields/iletisim_mesaji/eposta');
    expect(f.data.meta.validation).toEqual({ _and: [{ eposta: { _regex: expect.any(String) } }] });
  });
});

describe('kural: ceviriler ana kayitla birlikte duzenlenir; Turkce ceviri zorunlu', () => {
  it('yayin + TR/EN ceviri tek istekte olusturulur ve okunur', async () => {
    const { durum, govde } = await istek(token, 'POST', '/items/yayin?fields=id,ceviriler.dil,ceviriler.baslik', {
      tur: 'duyuru',
      durum: 'yayinda',
      yayin_tarihi: '2026-10-01T09:00:00+03:00',
      onay_zamani: '2026-10-01T08:00:00+03:00',
      ceviriler: [
        { dil: 'tr', slug: 'test-duyurusu', baslik: 'Test Duyurusu' },
        { dil: 'en', slug: 'test-announcement', baslik: 'Test Announcement' },
      ],
    });
    expect(durum).toBe(200);
    expect(govde.data.ceviriler.map((c) => c.dil).sort()).toEqual(['en', 'tr']);
  });

  it('formdan kaldirilan EN ceviri silinir (one_deselect_action: delete); TR kaldirilamaz', async () => {
    const { govde: liste } = await istek(token, 'GET', '/items/yayin?filter[ceviriler][slug][_eq]=test-duyurusu&fields=id,ceviriler.id,ceviriler.dil');
    const yayin = liste.data[0];
    const en = yayin.ceviriler.find((c) => c.dil === 'en');
    const trc = yayin.ceviriler.find((c) => c.dil === 'tr');

    const enSil = await istek(token, 'PATCH', `/items/yayin/${yayin.id}`, { ceviriler: { delete: [en.id] } });
    expect(enSil.durum).toBe(200);
    const trSil = await istek(token, 'PATCH', `/items/yayin/${yayin.id}`, { ceviriler: { delete: [trc.id] } });
    expect(trSil.durum).toBeGreaterThanOrEqual(400);
  });

  it('coka-cok ve bire-cok iliskiler okunur (kisi -> alanlar, telefonlar)', async () => {
    const { govde } = await istek(token, 'GET', '/items/kisi/1?fields=telefonlar.numara,calisma_alanlari.calisma_alani_id.ceviriler.ad');
    expect(govde.data.telefonlar.map((t) => t.numara)).toContain('101');
    const adlar = govde.data.calisma_alanlari.flatMap((x) => x.calisma_alani_id.ceviriler.map((c) => c.ad));
    expect(adlar).toContain('İmar Hukuku');
  });
});
