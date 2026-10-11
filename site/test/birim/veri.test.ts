import { describe, expect, it } from 'vitest';
import { mockTablolar } from '../../src/mock';
import type { Tablolar } from '../../src/lib/tablolar';
import {
  calismaAlanlariGetir, calismaAlaniDetaylariGetir, ekibiGetir, kararDetaylariGetir, kararlariGetir,
  kisiDetaylariGetir, sayfalariGetir, siteAyariGetir, yayinDetaylariGetir, yayinlariGetir,
} from '../../src/lib/veri';

// Testler derleme zamanina bagli olmasin: "simdi" sabit.
const SIMDI = new Date('2026-10-12T12:00:00+03:00');
const s = { simdi: SIMDI };

// Kurali ozel veriyle sinamak icin mock'un derin kopyasi (mock'un kendisi degismez).
function kopya(): Tablolar {
  return structuredClone(mockTablolar);
}

describe('kural: yayin yalnizca durum = yayinda ve yayin_tarihi <= simdi ise gorunur', () => {
  it('taslak (2), incelemede (10), arsiv (13) ve ileri tarihli (9) yayin gorunmez; digerleri yeniden eskiye', async () => {
    const idler = (await yayinlariGetir('tr', s)).map((y) => y.id);
    expect(idler).toEqual([1, 12, 3, 11, 8, 4, 5, 7, 6, 14]);
  });

  it('detay sayfalari ayni kurala uyar (taslak kitap ve ileri tarihli makale icin sayfa yok)', async () => {
    const idler = (await yayinDetaylariGetir('tr', s)).map((y) => y.id);
    expect(idler).not.toContain(2);
    expect(idler).not.toContain(9);
  });

  it('"simdi" parametredir: tarih gelince zamanlanmis yayin gorunur olur', async () => {
    const sonra = await yayinlariGetir('tr', { simdi: new Date('2027-01-15T09:00:00+03:00') });
    expect(sonra.map((y) => y.id)).toContain(9);
    const once = await yayinlariGetir('tr', { simdi: new Date('2027-01-15T08:59:59+03:00') });
    expect(once.map((y) => y.id)).not.toContain(9);
  });

  it('yayin_tarihi bos olan "yayinda" kayit gorunmez', async () => {
    const t = kopya();
    t.yayin.find((y) => y.id === 1)!.yayin_tarihi = null;
    expect((await yayinlariGetir('tr', { simdi: SIMDI, tablolar: t })).map((y) => y.id)).not.toContain(1);
  });
});

describe('kural: Ingilizce cevirisi olmayan kayit icin EN sayfa uretilmez', () => {
  it('yayin: yalnizca EN cevirisi hazir olanlar (11 hazir degil)', async () => {
    expect((await yayinDetaylariGetir('en', s)).map((y) => y.id)).toEqual([1, 8, 4, 6]);
  });

  it('kisi: yalnizca EN biyografisi olanlar', async () => {
    expect((await kisiDetaylariGetir('en', s)).map((k) => k.slug)).toEqual(['ayse-yilmaz', 'zeynep-celik', 'burak-ozkan']);
  });

  it('EN ekip listesinde herkes var, EN profili olmayanin baglantisi yok', async () => {
    const ekip = await ekibiGetir('en', s);
    expect(ekip.find((k) => k.slug === 'mehmet-kaya')?.url).toBeNull();
    expect(ekip.find((k) => k.slug === 'ayse-yilmaz')?.url).toBe('/en/team/ayse-yilmaz');
  });

  it('calisma alani: EN cevirisi olmayan Aile Hukuku (8) EN tarafta yok', async () => {
    const en = (await calismaAlaniDetaylariGetir('en', s)).map((a) => a.id);
    expect(en).not.toContain(8);
    expect((await calismaAlaniDetaylariGetir('tr', s)).map((a) => a.id)).toContain(8);
  });

  it('sabit sayfa: EN tarafta yalnizca cevirisi olanlar (yasal sayfalar yok)', async () => {
    expect((await sayfalariGetir('en', s)).map((p) => p.anahtar)).toEqual(['ana_sayfa', 'hakkimizda', 'arabuluculuk', 'iletisim']);
  });

  it('karsilik (hreflang) yalnizca diger dilde de sayfa varsa dolu', async () => {
    const tr = await yayinDetaylariGetir('tr', s);
    expect(tr.find((y) => y.id === 1)?.karsilik).toBe('/en/publications/current-state-of-rent-determination-cases');
    expect(tr.find((y) => y.id === 3)?.karsilik).toBeNull();
    expect(tr.find((y) => y.id === 11)?.karsilik).toBeNull();
  });

  it('EN yayin sayfasinda karar baglantisi yok (kararlar yalnizca TR)', async () => {
    const en = await yayinDetaylariGetir('en', s);
    expect(en.every((y) => y.kararlar.length === 0)).toBe(true);
  });
});

describe('kural: pasif kisi (aktif = false) gorunmez', () => {
  it('ekip listesinde ve profil sayfalarinda yok', async () => {
    expect((await ekibiGetir('tr', s)).map((k) => k.slug)).not.toContain('deniz-unal');
    expect((await kisiDetaylariGetir('tr', s)).map((k) => k.slug)).not.toContain('deniz-unal');
  });

  it('yazari oldugu yayinda adi kalir ama profil baglantisi verilmez', async () => {
    const y = (await yayinlariGetir('tr', s)).find((x) => x.id === 14)!;
    expect(y.yazarlar.map((a) => [a.ad, a.url])).toEqual([
      ['Deniz Ünal', null],
      ['Mehmet Kaya', '/ekip/mehmet-kaya'],
    ]);
  });

  it('ayrilan yazar ekipten sayilmaz: kisiId bos (yazar filtresine girmez)', async () => {
    const y = (await yayinlariGetir('tr', s)).find((x) => x.id === 14)!;
    expect(y.yazarlar.map((a) => a.kisiId)).toEqual([null, 2]);
  });

  it('calisma alani sayfasinin kisi listesinde yok', async () => {
    const borclar = (await calismaAlaniDetaylariGetir('tr', s)).find((a) => a.slug === 'borclar-hukuku')!;
    expect(borclar.kisiler.map((k) => k.slug)).not.toContain('deniz-unal');
  });
});

describe('kural: gizli calisma alani (gorunur = false) gorunmez', () => {
  it('agacta, detay sayfalarinda, kisi ve yayin baglarinda yok', async () => {
    const agac = await calismaAlanlariGetir('tr', s);
    expect(agac.flatMap((a) => a.altAlanlar).map((a) => a.slug)).not.toContain('vergi-hukuku');
    expect((await calismaAlaniDetaylariGetir('tr', s)).map((a) => a.id)).not.toContain(10);
    const zeynep = (await kisiDetaylariGetir('tr', s)).find((k) => k.slug === 'zeynep-celik')!;
    expect(zeynep.alanlar.map((a) => a.id)).not.toContain(10);
    const y14 = (await yayinlariGetir('tr', s)).find((y) => y.id === 14)!;
    expect(y14.alanlar.map((a) => a.id)).not.toContain(10);
  });

  it('ust alan gizlenirse alt alanlari da gorunmez', async () => {
    const t = kopya();
    t.calisma_alani.find((a) => a.id === 1)!.gorunur = false;
    const idler = (await calismaAlaniDetaylariGetir('tr', { simdi: SIMDI, tablolar: t })).map((a) => a.id);
    expect(idler).not.toContain(1);
    expect(idler).not.toContain(3);
    expect(idler).toContain(2);
  });

  it('gizli alt alanin kisi ve yayinlari ust alanin sayfasina tasinmaz', async () => {
    // Kerem Isik ve yayin 11 yalnizca Ceza (3) ve Idare (7) alanlarina bagli; ikisi gizlenince
    // Kamu Hukuku sayfasinda gorunmemeliler. Ayse Yilmaz Imar (4) uzerinden kalmali.
    const t = kopya();
    for (const a of t.calisma_alani) if (a.id === 3 || a.id === 7) a.gorunur = false;
    const kamu = (await calismaAlaniDetaylariGetir('tr', { simdi: SIMDI, tablolar: t })).find((a) => a.id === 1)!;
    expect(kamu.kisiler.map((k) => k.slug)).not.toContain('kerem-isik');
    expect(kamu.kisiler.map((k) => k.slug)).toContain('ayse-yilmaz');
    expect(kamu.yayinlar.map((y) => y.id)).not.toContain(11);
  });

  it('iki seviyeli agac siralama alanina gore', async () => {
    const agac = await calismaAlanlariGetir('tr', s);
    expect(agac.map((a) => a.slug)).toEqual(['kamu-hukuku', 'ozel-hukuk']);
    expect(agac[0].altAlanlar.map((a) => a.slug)).toEqual(['ceza-hukuku', 'imar-hukuku', 'idare-hukuku']);
  });
});

describe('kural: anonimlestirilmemis karar gorunmez; kararlar yalnizca Turkce', () => {
  it('taslak (5) ve ileri tarihli (7) karar yok; karar tarihine gore yeniden eskiye', async () => {
    expect((await kararlariGetir(s)).map((k) => k.id)).toEqual([8, 6, 1, 2, 3, 4]);
  });

  it('"yayinda" olsa bile anonimlestirildi = false ise gorunmez', async () => {
    // Sema bu durumu CHECK ile zaten reddeder; veri modulu yine de kendi kuralini uygular.
    const t = kopya();
    t.karar.find((k) => k.id === 1)!.anonimlestirildi = false;
    expect((await kararlariGetir({ simdi: SIMDI, tablolar: t })).map((k) => k.id)).not.toContain(1);
  });

  it('gorunmeyen karara bagli yayinda o karar listelenmez', async () => {
    const y1 = (await yayinDetaylariGetir('tr', s)).find((y) => y.id === 1)!;
    expect(y1.kararlar.map((k) => k.id)).toEqual([1]);
  });

  it('karar verisinde ofis_davasi bilgisi hic yok', async () => {
    const detaylar = await kararDetaylariGetir(s);
    expect(JSON.stringify(detaylar)).not.toMatch(/ofis/i);
  });

  it('kunye ve mevzuat etiketleri', async () => {
    const k1 = (await kararDetaylariGetir(s)).find((k) => k.id === 1)!;
    expect(k1.mahkemeAdi).toBe('Yargıtay 3. Hukuk Dairesi');
    expect(k1.ustMahkeme.ad).toBe('Yargıtay');
    expect(k1.mevzuat.map((m) => m.etiket)).toEqual(['TBK m. 344', 'HMK']);
    expect(k1.yayinlar.map((y) => y.id)).toEqual([1]);
  });
});

describe('kural: ekip unvan sirasina gore listelenir', () => {
  it('unvan sirasi, sonra unvan icindeki siralama', async () => {
    expect((await ekibiGetir('tr', s)).map((k) => k.soyad)).toEqual(['Yılmaz', 'Çelik', 'Özkan', 'Kaya', 'Şahin', 'Işık', 'Demir']);
  });

  it('ayni unvan ve siralamada soyad Turkce alfabeyle', async () => {
    const t = kopya();
    for (const k of t.kisi) k.siralama = 0;
    const avukatlar = (await ekibiGetir('tr', { simdi: SIMDI, tablolar: t })).filter((k) => k.unvan === 'Avukat');
    expect(avukatlar.map((k) => k.soyad)).toEqual(['Işık', 'Kaya', 'Şahin']);
  });
});

describe('kural: KVKK - yalnizca sitede gosterilmesi isaretli telefonlar', () => {
  it('gizli cep numarasi profile girmez', async () => {
    const ayse = (await kisiDetaylariGetir('tr', s)).find((k) => k.slug === 'ayse-yilmaz')!;
    expect(ayse.telefonlar).toEqual([{ tur: 'dahili', numara: '101' }]);
  });
});

describe('kural: zengin metin veri modulunden temizlenmis cikar', () => {
  it('yayin 3: script, onclick ve javascript: yok; h1 h2 olmus', async () => {
    const y3 = (await yayinDetaylariGetir('tr', s)).find((y) => y.id === 3)!;
    expect(y3.icerik).not.toMatch(/<script|onclick|javascript:|<h1/i);
    expect(y3.icerik).toContain('<h2>Editörün yanlışlıkla eklediği büyük başlık</h2>');
  });
});

describe('kural: CMS\'den gelen dis baglanti yalnizca gecerli https adresiyse kullanilir (XSS)', () => {
  it('javascript: ve semasiz adres baglantiya donusmez; derleme de dusmez', async () => {
    // Sema bu degerleri CHECK ile reddeder; veri modulu yine de ikinci kat olarak suzer.
    const t = kopya();
    t.yayin.find((y) => y.id === 5)!.video_url = 'javascript:alert(1)';
    t.yayin.find((y) => y.id === 7)!.kaynak_url = 'haber.example.net/semasiz';
    t.site_ayar[0].harita_url = 'javascript:alert(1)';
    const detay = await yayinDetaylariGetir('tr', { simdi: SIMDI, tablolar: t });
    expect(detay.find((y) => y.id === 5)!.videoUrl).toBeNull();
    expect(detay.find((y) => y.id === 7)!.kaynak?.url).toBeNull();
    expect((await siteAyariGetir('tr', { simdi: SIMDI, tablolar: t })).haritaUrl).toBeNull();
  });

  it('gecerli https adresleri oldugu gibi kalir', async () => {
    const detay = await yayinDetaylariGetir('tr', s);
    expect(detay.find((y) => y.id === 5)!.videoUrl).toBe('https://video.example.org/arabuluculuk-sureci');
  });
});

describe('site ayarlari', () => {
  it('buro unvani tek yerden (site_ayar) gelir; baro bilgisi aktif avukatlardan turetilir', async () => {
    const ayar = await siteAyariGetir('tr', s);
    expect(ayar.resmiUnvan).toBe('Yılmaz Avukatlık Bürosu');
    expect(ayar.barolar).toEqual(['İstanbul Barosu']);
    expect(ayar.altBilgiNotu).toMatch(/^Bu site bilgilendirme amaçlıdır/);
  });
});
