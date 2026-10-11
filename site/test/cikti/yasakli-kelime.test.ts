import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, etiketler, gorunenMetin, htmlSayfalari, nitelik, type Sayfa } from './dist';

// Reklam yasagi: ustunluk dili, sonuc vaadi, ucretsiz hizmet, referans/yorum.
// TR listesi docs/inceleme-2026-10-09.md 7. bolum "Denetim" maddesinden; ek TR ifadeler ve
// EN karsiliklar bu calismada eklendi. Kelime basi eslesir: "uzman" -> "uzmanlık" da yakalanir.
const YASAKLI_TR = [
  'uzman', 'en iyi', 'lider', 'öncü', 'önde gelen', 'başarılı', 'garanti', 'ücretsiz', 'kazandık',
  'kazanılan dava', 'yıllık tecrübe', 'yıllık deneyim', 'referanslar', 'müvekkil yorum', 'ofis davası',
  'başarı oranı', 'kesin sonuç',
];
const YASAKLI_EN = [
  'expert', 'best', 'leading', 'leader', 'pioneer', 'top-tier', 'top tier', 'award', 'guarantee',
  'successful', 'free consultation', 'free of charge', 'we won', 'number one', 'years of experience',
  'testimonial', 'client review', 'success rate',
];

function bul(metin: string, liste: string[], yerel: string): string[] {
  const kucuk = metin.toLocaleLowerCase(yerel);
  return liste.filter((k) => new RegExp(`(?<!\\p{L})${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(kucuk));
}

// Sayfanin metni + baslik + meta description + gorsel alt metinleri.
function taranacakMetin(s: Sayfa): string {
  const meta = etiketler(s.html, 'meta').map((e) => nitelik(e, 'content') ?? '').join(' ');
  const alt = etiketler(s.html, 'img').map((e) => nitelik(e, 'alt') ?? '').join(' ');
  return `${gorunenMetin(s.html)} ${meta} ${alt}`;
}

let sayfalar: Sayfa[] = [];

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: ustunluk dili ve yasakli ifadeler yok (reklam yasagi)', () => {
  it('hicbir sayfada TR yasakli kelime yok', () => {
    const bulunan = sayfalar.flatMap((s) => bul(taranacakMetin(s), YASAKLI_TR, 'tr').map((k) => `${s.yol}: ${k}`));
    expect(bulunan).toEqual([]);
  });

  it('hicbir sayfada EN yasakli kelime yok', () => {
    const bulunan = sayfalar.flatMap((s) => bul(taranacakMetin(s), YASAKLI_EN, 'en').map((k) => `${s.yol}: ${k}`));
    expect(bulunan).toEqual([]);
  });

  it('eslestirici gercekten yakaliyor (kendi kendini sinama)', () => {
    expect(bul('Alanında UZMANLIK sahibi', YASAKLI_TR, 'tr')).toEqual(['uzman']);
    expect(bul('Ücretsiz ön görüşme', YASAKLI_TR, 'tr')).toEqual(['ücretsiz']);
    expect(bul('Our award-winning team', YASAKLI_EN, 'en')).toEqual(['award']);
    expect(bul('Kullanıcı', YASAKLI_TR, 'tr')).toEqual([]);
  });
});
