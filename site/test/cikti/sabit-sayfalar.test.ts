import { beforeAll, describe, expect, it } from 'vitest';
import { cssDosyalari, distVarMi, etiketler, gorunenMetin, htmlSayfalari, nitelik, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];
const sayfa = (yol: string) => sayfalar.find((s) => s.yol === yol)!;
const main = (s: Sayfa) => s.html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '';
const footer = (s: Sayfa) => s.html.match(/<footer class="alt"[\s\S]*?<\/footer>/)?.[0] ?? '';

const YASAL = ['/kvkk-aydinlatma-metni', '/cerez-politikasi', '/yasal-uyari', '/kvkk-basvuru'];

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: yasal sayfalar var ve hukuki metin uydurulmadan taslak olarak isaretli', () => {
  it('dort yasal sayfa uretilmis ve her biri "Taslak – hukuki metin bekleniyor" diyor', () => {
    for (const yol of YASAL) {
      expect(gorunenMetin(main(sayfa(yol))), yol).toContain('Taslak – hukuki metin bekleniyor');
    }
  });

  it('her sayfanin footer\'i dort yasal sayfaya baglanir', () => {
    for (const s of sayfalar) {
      const hrefler = etiketler(footer(s), 'a').map((e) => nitelik(e, 'href'));
      expect(hrefler, s.yol).toEqual(expect.arrayContaining(YASAL));
    }
  });

  it('EN sayfalarda yasal baglantilar TR oldugunu belirtir (lang="tr")', () => {
    const f = footer(sayfa('/en'));
    const kvkk = etiketler(f, 'a').find((e) => nitelik(e, 'href') === '/kvkk-aydinlatma-metni')!;
    expect(nitelik(kvkk, 'lang')).toBe('tr');
  });
});

describe('kural: ana sayfa icerigi (docs/inceleme 6.3)', () => {
  it('TR: giris, alan gruplari, arabuluculuk, son yayinlar, son kararlar, ekip', () => {
    const basliklar = etiketler(main(sayfa('/')), 'h2').length;
    const metin = gorunenMetin(main(sayfa('/')));
    for (const b of ['Çalışma Alanları', 'Arabuluculuk', 'Son yayınlar', 'Son kararlar', 'Ekibimiz']) {
      expect(metin).toContain(b);
    }
    expect(basliklar).toBe(5);
  });

  it('icerikte tek "İletişim" baglantisi', () => {
    const iletisim = etiketler(main(sayfa('/')), 'a').filter((e) => nitelik(e, 'href') === '/iletisim');
    expect(iletisim.length).toBe(1);
  });

  it('EN ana sayfada karar blogu yok', () => {
    expect(gorunenMetin(main(sayfa('/en')))).not.toMatch(/decisions/i);
    expect(main(sayfa('/en'))).not.toContain('/kararlar');
  });
});

describe('kural: iletisim formu (KVKK, HTML dogrulama, sahte "gonderildi" yok)', () => {
  it('zorunlu alanlar, e-posta tipi ve uzunluk sinirlari HTML\'de', () => {
    const html = main(sayfa('/iletisim'));
    const alan = (id: string) => [...etiketler(html, 'input'), ...etiketler(html, 'textarea'), ...etiketler(html, 'select')].find((e) => nitelik(e, 'id') === id)!;
    expect(alan('f-ad')).toMatch(/\srequired[\s>]/);
    expect(nitelik(alan('f-ad'), 'maxlength')).toBe('120');
    expect(nitelik(alan('f-eposta'), 'type')).toBe('email');
    expect(alan('f-eposta')).toMatch(/\srequired[\s>]/);
    expect(alan('f-konu')).toMatch(/\srequired[\s>]/);
    expect(alan('f-mesaj')).toMatch(/\srequired[\s>]/);
    expect(nitelik(alan('f-mesaj'), 'maxlength')).toBe('5000');
    expect(alan('f-telefon')).not.toMatch(/\srequired[\s>]/);
  });

  it('ozel nitelikli veri uyarisi ve aydinlatma metni baglantisi var', () => {
    const html = main(sayfa('/iletisim'));
    expect(gorunenMetin(html)).toContain('özel nitelikli kişisel verilerinizi paylaşmayınız');
    expect(etiketler(html, 'a').some((e) => nitelik(e, 'href') === '/kvkk-aydinlatma-metni')).toBe(true);
    expect(gorunenMetin(main(sayfa('/en/contact')))).toContain('special categories of personal data');
  });

  it('hicbir sayfada "gonderildi/sent" basari mesaji yok', () => {
    for (const s of sayfalar) {
      expect(s.html, s.yol).not.toMatch(/gönderildi|başarıyla|has been sent|successfully sent/i);
    }
  });

  it('harita gomulmez, dis baglanti verilir', () => {
    const html = main(sayfa('/iletisim'));
    expect(html).not.toMatch(/<iframe/);
    expect(etiketler(html, 'a').some((e) => (nitelik(e, 'href') ?? '').startsWith('https://www.openstreetmap.org/'))).toBe(true);
  });
});

describe('kural: pop-up, sabit WhatsApp butonu, video hero, logo/odul yok (docs/inceleme 6.2)', () => {
  it('WhatsApp baglantisi, dialog, video ve logo gorseli yok', () => {
    for (const s of sayfalar) {
      expect(s.html, s.yol).not.toMatch(/wa\.me|whatsapp/i);
      expect(s.html, s.yol).not.toMatch(/<dialog\b|role="dialog"|role="alertdialog"/);
      expect(s.html, s.yol).not.toMatch(/<video\b|autoplay/);
      expect(etiketler(s.html, 'img').filter((e) => /logo/i.test(e)), s.yol).toEqual([]);
    }
  });

  it('ekranda sabit duran oge yok (position: fixed / sticky)', () => {
    const stiller = [
      ...sayfalar.map((s) => [...s.html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((e) => e[1]).join('\n')),
      ...cssDosyalari().map((c) => c.css),
    ];
    for (const css of stiller) expect(css).not.toMatch(/position\s*:\s*(fixed|sticky)/);
  });
});
