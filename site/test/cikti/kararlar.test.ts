import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, etiketler, gorunenMetin, htmlSayfalari, nitelik, yolVarMi, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];
const kararSayfalari = () => sayfalar.filter((s) => s.yol.startsWith('/kararlar/'));
const main = (s: Sayfa) => s.html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '';

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: yalnizca yayindaki ve anonimlestirilmis kararlar sitede', () => {
  it('tam 6 karar sayfasi; taslak/anonimlestirilmemis (5) ve ileri tarihli (7) yok', () => {
    expect(kararSayfalari().length).toBe(6);
    expect(yolVarMi('/kararlar/yargitay-3-hd-e-2025-8888-k-2026-9999')).toBe(false);
    expect(yolVarMi('/kararlar/yargitay-3-hd-e-2025-1414-k-2026-1515')).toBe(false);
    for (const s of sayfalar) {
      expect(gorunenMetin(s.html), s.yol).not.toContain('Anonimleştirilmemiş taslak karar');
      expect(gorunenMetin(s.html), s.yol).not.toContain('Zamanlanmış karar');
    }
  });

  it('her kararin konusu ORNEK olarak isaretli (kurgusal veri)', () => {
    for (const s of kararSayfalari()) {
      expect(gorunenMetin(etiketler(s.html, 'h1')[0] ? s.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1] : ''), s.yol).toContain('ÖRNEK');
    }
  });
});

describe('kural: kararlar yalnizca Turkce', () => {
  it('EN altinda karar sayfasi yok', () => {
    expect(sayfalar.some((s) => s.yol.startsWith('/en/kararlar') || s.yol.startsWith('/en/decisions'))).toBe(false);
  });

  it('hicbir EN sayfa karar sayfalarina baglanmiyor; karar sayfalarinda hreflang yok', () => {
    for (const s of sayfalar.filter((x) => x.yol === '/en' || x.yol.startsWith('/en/'))) {
      expect(s.html, s.yol).not.toContain('href="/kararlar');
    }
    for (const s of [...kararSayfalari(), sayfalar.find((x) => x.yol === '/kararlar')!]) {
      const alternatifler = etiketler(s.html, 'link').filter((e) => nitelik(e, 'rel') === 'alternate');
      expect(alternatifler, s.yol).toEqual([]);
    }
  });
});

describe('kural: kararda sonuc anlatimi, muvekkil ve ofis davasi bilgisi yok', () => {
  it('karar sayfalarinda bu ifadeler gecmez', () => {
    for (const s of [...kararSayfalari(), sayfalar.find((x) => x.yol === '/kararlar')!]) {
      const metin = gorunenMetin(main(s)).toLocaleLowerCase('tr');
      for (const yasak of ['kazandık', 'kazandı', 'lehimize', 'müvekkil', 'ofis davası', 'davamız', 'avukatımız']) {
        expect(metin, `${s.yol}: ${yasak}`).not.toContain(yasak);
      }
    }
  });

  it('ofis_davasi = true olan karar (3) icin sayfada hicbir isaret yok (metin, sinif, nitelik)', () => {
    for (const s of [...kararSayfalari(), sayfalar.find((x) => x.yol === '/kararlar')!]) {
      expect(s.html, s.yol).not.toMatch(/ofis/i);
    }
  });
});

describe('kural: karar detayi kunye ve mevzuat maddelerini gosterir', () => {
  it('kunye: mahkeme, esas/karar no, tarih; mevzuat: TBK m. 344 ve HMK', () => {
    const metin = gorunenMetin(main(sayfalar.find((s) => s.yol === '/kararlar/yargitay-3-hd-e-2024-1111-k-2025-2222')!));
    expect(metin).toContain('Mahkeme Yargıtay 3. Hukuk Dairesi');
    expect(metin).toContain('Esas No 2024/1111');
    expect(metin).toContain('Karar No 2025/2222');
    expect(metin).toContain('Karar tarihi 10 Şubat 2025');
    expect(metin).toContain('TBK m. 344');
    expect(metin).toMatch(/HMK — Hukuk Muhakemeleri Kanunu/);
  });

  it('ilgili yayin baglantili; yayindan karara da baglanti var (karsilikli)', () => {
    const k1 = main(sayfalar.find((s) => s.yol === '/kararlar/yargitay-3-hd-e-2024-1111-k-2025-2222')!);
    expect(k1).toContain('href="/yayinlar/kira-bedelinin-tespiti-davalarinda-guncel-durum"');
    const y1 = main(sayfalar.find((s) => s.yol === '/yayinlar/kira-bedelinin-tespiti-davalarinda-guncel-durum')!);
    expect(y1).toContain('href="/kararlar/yargitay-3-hd-e-2024-1111-k-2025-2222"');
  });
});
