import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, etiketler, gorunenMetin, htmlSayfalari, nitelik, SITE, yolVarMi, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];
const sayfa = (yol: string) => sayfalar.find((s) => s.yol === yol)!;
const kirinti = (s: Sayfa) => s.html.match(/<nav class="kirinti"[\s\S]*?<\/nav>/)?.[0] ?? '';

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: gizli calisma alani sitede gorunmez', () => {
  it('gizli alanin sayfasi yok ve hicbir sayfa ona baglanmiyor', () => {
    expect(yolVarMi('/calisma-alanlari/vergi-hukuku')).toBe(false);
    for (const s of sayfalar) {
      expect(s.html, s.yol).not.toContain('/calisma-alanlari/vergi-hukuku');
      expect(gorunenMetin(s.html), s.yol).not.toContain('Vergi Hukuku');
    }
  });
});

describe('kural: EN sayfa yalnizca EN cevirisi olan alan icin', () => {
  it('EN cevirisi olmayan Aile Hukuku yalnizca TR', () => {
    expect(yolVarMi('/calisma-alanlari/aile-hukuku')).toBe(true);
    // Dil secici <a> etiketinde de hreflang var; burada yalnizca <link rel="alternate"> sayilir.
    const alternatifler = etiketler(sayfa('/calisma-alanlari/aile-hukuku').html, 'link').filter((e) => nitelik(e, 'rel') === 'alternate');
    expect(alternatifler).toEqual([]);
    expect(gorunenMetin(sayfa('/en/practice-areas').html)).not.toMatch(/Family/);
  });
});

describe('kural: iki seviyeli agac; duz slug, agac breadcrumb\'da', () => {
  it('alt alanin breadcrumb\'i ust alana baglanir', () => {
    const k = kirinti(sayfa('/calisma-alanlari/imar-hukuku'));
    const hrefler = etiketler(k, 'a').map((e) => nitelik(e, 'href'));
    expect(hrefler).toEqual(['/', '/calisma-alanlari', '/calisma-alanlari/kamu-hukuku']);
    expect(gorunenMetin(k)).toContain('İmar Hukuku');
  });

  it('ust alanin sayfasi alt alanlarini listeler', () => {
    const html = sayfa('/calisma-alanlari/kamu-hukuku').html;
    for (const alt of ['ceza-hukuku', 'imar-hukuku', 'idare-hukuku']) {
      expect(html).toContain(`href="/calisma-alanlari/${alt}"`);
    }
  });

  it('liste sayfasinda iki ust grup ve altlari var', () => {
    const metin = gorunenMetin(sayfa('/calisma-alanlari').html);
    expect(metin).toMatch(/Kamu Hukuku[\s\S]*Ceza Hukuku[\s\S]*Özel Hukuk[\s\S]*Borçlar Hukuku/);
  });
});

describe('kural: arabuluculuk sayfasi bilgilendirici', () => {
  it('TR ve EN sayfa var, birbirine hreflang ile bagli', () => {
    expect(sayfa('/arabuluculuk').html).toContain(`hreflang="en" href="${SITE}/en/mediation"`);
    expect(sayfa('/en/mediation').html).toContain(`hreflang="tr" href="${SITE}/arabuluculuk"`);
  });
});
