import { describe, expect, it } from 'vitest';
import { degerler, secenekleriTopla } from '../../src/lib/filtre';

describe('kural: filtrede yalnizca listede kullanilan degerler secenek olur', () => {
  const kayitlar = [
    { yil: 2024, alanlar: [{ id: 6, ad: 'Gayrimenkul Hukuku' }] },
    { yil: 2026, alanlar: [{ id: 4, ad: 'İmar Hukuku' }, { id: 6, ad: 'Gayrimenkul Hukuku' }] },
    { yil: 2025, alanlar: [{ id: 5, ad: 'Borçlar Hukuku' }] },
  ];

  it('tekrar eden degerler bir kez, Turkce alfabeyle sirali', () => {
    const s = secenekleriTopla(kayitlar, (k) => k.alanlar.map((a) => ({ deger: String(a.id), ad: a.ad })));
    expect(s.map((x) => x.ad)).toEqual(['Borçlar Hukuku', 'Gayrimenkul Hukuku', 'İmar Hukuku']);
  });

  it('yillar yeniden eskiye', () => {
    const s = secenekleriTopla(kayitlar, (k) => [{ deger: String(k.yil), ad: String(k.yil) }], 'azalan');
    expect(s.map((x) => x.deger)).toEqual(['2026', '2025', '2024']);
  });

  it('data- niteligi icin bosluklu, tekrarsiz deger listesi', () => {
    expect(degerler([6, 4, 6])).toBe('6 4');
    expect(degerler([])).toBe('');
  });
});
