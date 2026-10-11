// Sabit sayfalarin adresleri. Icerik sayfalarinin (ekip/slug vb.) adresini veri modulu
// bu koklerden uretir; boylece bir adres degisirse tek yer degisir.
import type { Dil } from './metinler';

// Kararlar yalnizca Turkce oldugu icin 'en' altinda kararlar yolu bilerek yok.
export const yollar = {
  tr: {
    anaSayfa: '/',
    ekip: '/ekip',
    calismaAlanlari: '/calisma-alanlari',
    yayinlar: '/yayinlar',
    kararlar: '/kararlar',
  },
  en: {
    anaSayfa: '/en',
    ekip: '/en/team',
    calismaAlanlari: '/en/practice-areas',
    yayinlar: '/en/publications',
  },
} satisfies Record<Dil, Record<string, string>>;

// Sabit sayfanin (sayfa tablosu) adresi slug'dan gelir; slug'i bos olan ana sayfadir.
export function sayfaYolu(slug: string | null | undefined, dil: Dil): string {
  if (!slug) return yollar[dil].anaSayfa;
  return dil === 'tr' ? `/${slug}` : `/en/${slug}`;
}

// build.format 'file' iken derlemede Astro.url.pathname '/en.html', '/index.html' doner;
// gelistirme sunucusunda ise '/en'. Kanonik adres ve menu karsilastirmasi ikisinde de ayni olsun.
export function temizYol(pathname: string): string {
  const yol = pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, '');
  return yol === '' ? '/' : yol;
}

export interface MenuOgesi {
  ad: string;
  yol: string;
}

// Menuye bir oge, o sayfa gercekten uretildiginde eklenir; yoksa kirik baglanti olur.
export function menuOgeleri(_dil: Dil): MenuOgesi[] {
  return [];
}
