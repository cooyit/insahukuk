import { beforeAll, describe, expect, it } from 'vitest';
import { girisYap, istek, panel } from './api.mjs';

let token;

beforeAll(async () => {
  token = await girisYap();
});

describe('kural: panel tek komutla kurulur ve semayi tanir', () => {
  it('Directus ayakta ve yonetici girisi calisiyor', async () => {
    expect((await fetch(`${panel().url}/server/ping`)).ok).toBe(true);
    expect(token).toBeTruthy();
  });

  it('db/schema.sql cekirdek semasinin 36 tablosu koleksiyon olarak goruluyor', async () => {
    const { govde } = await istek(token, 'GET', '/collections');
    // schema null: klasor (tablosu yok); onlar sayilmaz.
    const bizim = govde.data.filter((c) => c.schema).map((c) => c.collection).filter((ad) => !ad.startsWith('directus_'));
    expect(bizim.length).toBe(36);
    expect(bizim).toEqual(expect.arrayContaining(['kisi', 'yayin', 'yayin_ceviri', 'karar', 'site_ayar', 'iletisim_mesaji']));
  });

  it('ornek veri yuklu (db/ornek_veri.sql)', async () => {
    const { govde } = await istek(token, 'GET', '/items/kisi?fields=slug&sort=id');
    expect(govde.data.map((k) => k.slug)).toEqual(['ayse-yilmaz', 'mehmet-kaya', 'elif-demir']);
  });

  it('veritabani kurallari Directus uzerinden de gecerli: Turkce cevirisiz yayin reddedilir', async () => {
    const { durum } = await istek(token, 'POST', '/items/yayin', {
      tur: 'makale', durum: 'yayinda', yayin_tarihi: '2026-10-01T09:00:00+03:00', onay_zamani: '2026-10-01T08:00:00+03:00',
    });
    expect(durum).toBeGreaterThanOrEqual(400);
  });
});

describe('kural: KVKK - icerik ucuncu taraf yapay zekaya gitmez', () => {
  it('AI asistani ve MCP sunucusu kapali', async () => {
    const { govde } = await istek(token, 'GET', '/server/info');
    expect(govde.data.ai_enabled).toBe(false);
    expect(govde.data.mcp_enabled).toBe(false);
  });
});
