import { describe, expect, it } from 'vitest';
import { dilBelirle } from '../../src/lib/metinler';
import { temizYol } from '../../src/lib/yollar';

describe('kural: her icerigin tek kanonik adresi var', () => {
  it('derleme (.html) ve gelistirme adresleri ayni yola indirgenir', () => {
    expect(temizYol('/index.html')).toBe('/');
    expect(temizYol('/')).toBe('/');
    expect(temizYol('/en.html')).toBe('/en');
    expect(temizYol('/en')).toBe('/en');
    expect(temizYol('/en/')).toBe('/en');
    expect(temizYol('/ekip/ayse-yilmaz.html')).toBe('/ekip/ayse-yilmaz');
  });
});

describe('kural: Turkce kokte, Ingilizce /en altinda', () => {
  it('bilinmeyen ya da bos dil varsayilan dile (tr) duser', () => {
    expect(dilBelirle('en')).toBe('en');
    expect(dilBelirle('tr')).toBe('tr');
    expect(dilBelirle(undefined)).toBe('tr');
    expect(dilBelirle('de')).toBe('tr');
  });
});
