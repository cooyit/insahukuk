import { beforeAll, describe, expect, it } from 'vitest';
import { cssDosyalari, distVarMi, etiketler, htmlSayfalari, nitelik, type Sayfa } from './dist';

// KVKK: ziyaretcinin tarayicisi baska bir alan adina istek atmamali (font, CDN, analytics,
// harita, video gomme). docs/inceleme-2026-10-09.md 7. bolum "KVKK - sunucu yeri".
// Yalnizca tarayicinin kendiliginden indirdigi kaynaklara bakilir; <a href> dis baglanti serbesttir.

const DIS_ADRES = /^(https?:)?\/\//i;
// Tarayicinin kendiliginden yukledigi <link> turleri (canonical/alternate istek yapmaz).
const YUKLENEN_LINK = new Set(['stylesheet', 'preload', 'modulepreload', 'prefetch', 'preconnect', 'dns-prefetch', 'icon', 'manifest', 'apple-touch-icon']);
const KAYNAK_ETIKETLERI = ['script', 'img', 'iframe', 'source', 'video', 'audio', 'embed', 'object', 'track', 'input'];

let sayfalar: Sayfa[] = [];

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

function cssDisAdresleri(css: string): string[] {
  const adresler = [...css.matchAll(/url\(\s*['"]?([^'")\s]+)/gi), ...css.matchAll(/@import\s+['"]([^'"]+)/gi)];
  return adresler.map((e) => e[1]).filter((a) => DIS_ADRES.test(a));
}

describe('kural: ucuncu taraf istek yok (KVKK)', () => {
  it('script, gorsel, iframe, medya kaynaklari dis alan adina gitmiyor', () => {
    for (const s of sayfalar) {
      for (const ad of KAYNAK_ETIKETLERI) {
        for (const e of etiketler(s.html, ad)) {
          for (const n of ['src', 'srcset', 'data', 'poster']) {
            const deger = nitelik(e, n);
            expect(deger && DIS_ADRES.test(deger) ? `${s.yol}: ${e}` : null).toBeNull();
          }
        }
      }
    }
  });

  it('iframe hic yok (harita ve video yalnizca dis baglanti)', () => {
    for (const s of sayfalar) {
      expect(etiketler(s.html, 'iframe'), s.yol).toEqual([]);
    }
  });

  it('stil, font, ikon gibi <link> kaynaklari dis alan adina gitmiyor', () => {
    for (const s of sayfalar) {
      for (const e of etiketler(s.html, 'link')) {
        const rel = (nitelik(e, 'rel') ?? '').toLowerCase().split(/\s+/);
        if (!rel.some((r) => YUKLENEN_LINK.has(r))) continue;
        const href = nitelik(e, 'href') ?? '';
        expect(DIS_ADRES.test(href) ? `${s.yol}: ${e}` : null).toBeNull();
      }
    }
  });

  it('satir ici ve ayri CSS dosyalarinda dis url()/@import yok', () => {
    for (const s of sayfalar) {
      const satirIci = [...s.html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((e) => e[1]).join('\n');
      const stilNitelikleri = [...s.html.matchAll(/\sstyle="([^"]*)"/gi)].map((e) => e[1]).join('\n');
      expect(cssDisAdresleri(satirIci + stilNitelikleri), s.yol).toEqual([]);
    }
    for (const c of cssDosyalari()) {
      expect(cssDisAdresleri(c.css), c.dosya).toEqual([]);
    }
  });
});
