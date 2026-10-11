import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, etiketler, htmlSayfalari, nitelik, type Sayfa } from './dist';

// Zengin metin derlemede temizlenir (docs/inceleme 4.3). Mock'taki yayin 3 bilerek <script>,
// onclick ve javascript: iceriyor; bu test temizligin sayfaya kadar ulastigini dogrular.
let sayfalar: Sayfa[] = [];

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: derlenmis sayfalarda XSS kalintisi yok', () => {
  it('hicbir etikette on* olay niteligi yok', () => {
    const bulunan = sayfalar.flatMap((s) => (s.html.match(/<[a-z][^>]*\son[a-z]+=/gi) ?? []).map((e) => `${s.yol}: ${e}`));
    expect(bulunan).toEqual([]);
  });

  it('hicbir baglanti javascript: ya da data: adresine gitmiyor', () => {
    const bulunan = sayfalar.flatMap((s) =>
      etiketler(s.html, 'a')
        .filter((e) => /^\s*(javascript|data):/i.test(nitelik(e, 'href') ?? ''))
        .map((e) => `${s.yol}: ${e}`),
    );
    expect(bulunan).toEqual([]);
  });

  it('icerikten gelen alert(...) script olarak kalmamis', () => {
    for (const s of sayfalar) {
      const scriptler = [...s.html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((e) => e[1]);
      expect(scriptler.filter((k) => k.includes('alert(')), s.yol).toEqual([]);
    }
  });
});
