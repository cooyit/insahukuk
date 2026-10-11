// Arayuz metinleri (menu, dugmeler, basliklar). Icerik metinleri burada degil, veride durur.
import type { YayinTuru } from './tablolar';

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
    konum: 'Bulunduğunuz yer',
    ekip: 'Ekip',
    ekipAciklama: 'Büromuzun avukatları ve ekibi.',
    biyografi: 'Biyografi',
    calismaAlanlari: 'Çalışma Alanları',
    egitim: 'Eğitim',
    deneyim: 'Deneyim',
    iletisim: 'İletişim',
    dahili: 'Dahili',
    yabanciDiller: 'Yabancı diller',
    meslegeBaslamaYili: 'Mesleğe başlama yılı',
    arabulucu: 'Arabulucu',
    yayinlar: 'Yayınlar',
    halen: 'halen',
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
    konum: 'Breadcrumb',
    ekip: 'Team',
    ekipAciklama: 'Lawyers and staff of our office.',
    biyografi: 'Biography',
    calismaAlanlari: 'Practice Areas',
    egitim: 'Education',
    deneyim: 'Experience',
    iletisim: 'Contact',
    dahili: 'Ext.',
    yabanciDiller: 'Languages',
    meslegeBaslamaYili: 'Year started practising',
    arabulucu: 'Mediator',
    yayinlar: 'Publications',
    halen: 'present',
  },
} satisfies Record<Dil, Record<string, string>>;

export const yayinTurAdlari: Record<Dil, Record<YayinTuru, string>> = {
  tr: { makale: 'Makale', kitap: 'Kitap', video: 'Video', haber: 'Haber', duyuru: 'Duyuru' },
  en: { makale: 'Article', kitap: 'Book', video: 'Video', haber: 'News', duyuru: 'Announcement' },
};
