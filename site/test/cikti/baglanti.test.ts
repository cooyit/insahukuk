import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, etiketler, htmlSayfalari, nitelik, SITE, yolVarMi, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

// Site ici adres: '/...' ya da kendi alan adimiz. Dis baglantilar (https://baska.site) burada denetlenmez.
function iceYol(href: string): string | null {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (href.startsWith(SITE)) return new URL(href).pathname;
  return null;
}

describe('kural: ic baglantilar var olan sayfalara gidiyor', () => {
  it('her <a href>, canonical ve hreflang hedefi dist icinde var', () => {
    const kiriklar: string[] = [];
    for (const s of sayfalar) {
      const hrefler = [...etiketler(s.html, 'a'), ...etiketler(s.html, 'link')].map((e) => nitelik(e, 'href') ?? '');
      for (const href of hrefler) {
        const yol = iceYol(href);
        if (yol !== null && !yolVarMi(yol)) kiriklar.push(`${s.yol} -> ${href}`);
      }
    }
    expect(kiriklar).toEqual([]);
  });

  it('sayfa ici #baglantilarin hedef kimligi ayni sayfada var', () => {
    const kiriklar: string[] = [];
    for (const s of sayfalar) {
      for (const e of etiketler(s.html, 'a')) {
        const href = nitelik(e, 'href') ?? '';
        if (!href.startsWith('#') || href === '#') continue;
        if (!s.html.includes(`id="${href.slice(1)}"`)) kiriklar.push(`${s.yol} -> ${href}`);
      }
    }
    expect(kiriklar).toEqual([]);
  });
});
