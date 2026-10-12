import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, gorunenMetin, htmlSayfalari, type Sayfa } from './dist';

// docs/inceleme-2026-10-09.md 6.3: footer'da resmi unvan, adres, telefon, kurumsal e-posta,
// baro bilgisi ve "Bu site bilgilendirme amaclidir" notu. Yasal sayfa baglantilari P7'de eklenir.
let sayfalar: Sayfa[] = [];

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

function footer(s: Sayfa): string {
  return s.html.match(/<footer class="alt"[\s\S]*?<\/footer>/)?.[0] ?? '';
}

describe('kural: her sayfanin footer bilgileri tam', () => {
  it('unvan, adres, telefon, e-posta, baro ve bilgilendirme notu', () => {
    for (const s of sayfalar) {
      const f = footer(s);
      const metin = gorunenMetin(f);
      const en = s.yol === '/en' || s.yol.startsWith('/en/');
      expect(metin, s.yol).toContain('İnce Şafak Avukatlık Bürosu');
      expect(metin, s.yol).toContain('Şişli');
      expect(f, s.yol).toMatch(/href="tel:\+90/);
      expect(f, s.yol).toMatch(/href="mailto:[^"]+@/);
      expect(metin, s.yol).toContain('İstanbul Barosu');
      expect(metin, s.yol).toContain(en ? 'This website is for information purposes only' : 'Bu site bilgilendirme amaçlıdır');
    }
  });
});
