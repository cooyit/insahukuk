import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, etiketler, htmlSayfalari, nitelik, SITE, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];

beforeAll(() => {
  // Bilerek "skip" yok: dist yoksa test kirmizi olsun ki ciktisiz gecis olmasin.
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: her sayfada temel SEO ve erisilebilirlik etiketleri var', () => {
  it('en az ana sayfa, EN ana sayfa ve 404 uretilmis', () => {
    const yollar = sayfalar.map((s) => s.yol);
    expect(yollar).toEqual(expect.arrayContaining(['/', '/en', '/404']));
  });

  it('her sayfada lang="tr" ya da lang="en"', () => {
    for (const s of sayfalar) {
      const lang = nitelik(etiketler(s.html, 'html')[0] ?? '', 'lang');
      expect(lang, s.yol).toBe(s.yol === '/en' || s.yol.startsWith('/en/') ? 'en' : 'tr');
    }
  });

  it('her sayfada tam olarak bir h1', () => {
    for (const s of sayfalar) {
      expect(etiketler(s.html, 'h1').length, s.yol).toBe(1);
    }
  });

  it('her sayfada bos olmayan title ve meta description', () => {
    for (const s of sayfalar) {
      const baslik = s.html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
      expect(baslik, s.yol).toBeTruthy();
      const aciklama = etiketler(s.html, 'meta').find((e) => nitelik(e, 'name') === 'description');
      expect(nitelik(aciklama ?? '', 'content')?.trim(), s.yol).toBeTruthy();
    }
  });

  it('404 disindaki her sayfada kendi adresini gosteren tek canonical', () => {
    for (const s of sayfalar.filter((s) => s.yol !== '/404')) {
      const kanonikler = etiketler(s.html, 'link').filter((e) => nitelik(e, 'rel') === 'canonical');
      expect(kanonikler.length, s.yol).toBe(1);
      expect(nitelik(kanonikler[0], 'href'), s.yol).toBe(new URL(s.yol, SITE).href);
    }
  });

  it('hreflang varsa karsiligi da geri baglanir (iki yonlu)', () => {
    const yolaGore = new Map(sayfalar.map((s) => [s.yol, s]));
    for (const s of sayfalar) {
      const alternatifler = etiketler(s.html, 'link').filter((e) => nitelik(e, 'rel') === 'alternate');
      for (const a of alternatifler) {
        const hedefYol = new URL(nitelik(a, 'href') ?? '', SITE).pathname;
        if (hedefYol === s.yol) continue;
        const hedef = yolaGore.get(hedefYol);
        expect(hedef, `${s.yol} -> ${hedefYol}`).toBeDefined();
        const geri = etiketler(hedef!.html, 'link')
          .filter((e) => nitelik(e, 'rel') === 'alternate')
          .map((e) => new URL(nitelik(e, 'href') ?? '', SITE).pathname);
        expect(geri, `${hedefYol} -> ${s.yol}`).toContain(s.yol);
      }
    }
  });
});
