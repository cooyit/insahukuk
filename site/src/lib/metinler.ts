// Arayuz metinleri (menu, dugmeler, basliklar). Icerik metinleri burada degil, veride durur.

export type Dil = 'tr' | 'en';

// Astro.currentLocale bilinmeyen bir deger donerse site varsayilan dile (TR) duser.
export function dilBelirle(locale: string | undefined): Dil {
  return locale === 'en' ? 'en' : 'tr';
}

export function digerDil(dil: Dil): Dil {
  return dil === 'tr' ? 'en' : 'tr';
}

export const metinler = {
  tr: {
    dilAdi: 'Türkçe',
    icerigeAtla: 'İçeriğe atla',
    anaMenu: 'Ana menü',
    anaSayfa: 'Ana Sayfa',
    sayfaBulunamadi: 'Sayfa bulunamadı',
    sayfaBulunamadiAciklama: 'Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.',
    anaSayfayaDon: 'Ana sayfaya dön',
    telefon: 'Telefon',
    eposta: 'E-posta',
    baro: 'Baro',
  },
  en: {
    dilAdi: 'English',
    icerigeAtla: 'Skip to content',
    anaMenu: 'Main menu',
    anaSayfa: 'Home',
    sayfaBulunamadi: 'Page not found',
    sayfaBulunamadiAciklama: 'The page you are looking for may have been moved or removed.',
    anaSayfayaDon: 'Back to home page',
    telefon: 'Phone',
    eposta: 'E-mail',
    baro: 'Bar association',
  },
} satisfies Record<Dil, Record<string, string>>;
