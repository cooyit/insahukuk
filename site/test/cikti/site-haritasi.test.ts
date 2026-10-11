import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { DIST, distVarMi, etiketler, htmlSayfalari, nitelik, SITE, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

function haritaAdresleri(): string[] {
  const dizin = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
  const parcalar = [...dizin.matchAll(/<loc>([^<]+)<\/loc>/g)].map((e) => new URL(e[1]).pathname.slice(1));
  return parcalar.flatMap((p) => [...readFileSync(join(DIST, p), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((e) => e[1]));
}

describe('kural: robots.txt ve site haritasi tum kanonik sayfalari gosterir', () => {
  it('robots.txt var olan site haritasini gosterir', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    const adres = robots.match(/^Sitemap: (.+)$/m)?.[1];
    expect(adres).toBe(`${SITE}/sitemap-index.xml`);
    expect(existsSync(join(DIST, 'sitemap-index.xml'))).toBe(true);
  });

  it('site haritasi = 404 disindaki butun sayfalarin canonical adresi', () => {
    const kanonikler = sayfalar
      .filter((s) => s.yol !== '/404')
      .map((s) => nitelik(etiketler(s.html, 'link').find((e) => nitelik(e, 'rel') === 'canonical')!, 'href'))
      .sort();
    expect(haritaAdresleri().sort()).toEqual(kanonikler);
  });
});

describe('kural: her icerigin tek kanonik adresi; basliklar ayirt edici', () => {
  it('canonical adresler benzersiz', () => {
    const kanonikler = sayfalar.flatMap((s) =>
      etiketler(s.html, 'link').filter((e) => nitelik(e, 'rel') === 'canonical').map((e) => nitelik(e, 'href')),
    );
    expect(new Set(kanonikler).size).toBe(kanonikler.length);
  });

  it('title degerleri benzersiz', () => {
    const basliklar = sayfalar.map((s) => s.html.match(/<title>([^<]*)<\/title>/)?.[1]);
    const tekrar = basliklar.filter((b, i) => basliklar.indexOf(b) !== i);
    expect(tekrar).toEqual([]);
  });

  it('meta description 160 karakteri gecmez', () => {
    for (const s of sayfalar) {
      const aciklama = nitelik(etiketler(s.html, 'meta').find((e) => nitelik(e, 'name') === 'description')!, 'content') ?? '';
      expect(aciklama.length, s.yol).toBeLessThanOrEqual(160);
    }
  });
});
