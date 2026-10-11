// Bolumlerin kok adresleri ve menu. Icerik sayfalarinin (ekip/slug vb.) adresini veri modulu
// bu koklerden uretir; boylece bir adres degisirse tek yer degisir.
import { metinler, type Dil } from './metinler';

// Kararlar yalnizca Turkce oldugu icin 'en' altinda kararlar yolu bilerek yok.
// arabuluculuk: sayfa tablosundaki slug'la ayni olmali (menu icin burada da yazili);
// farkli olursa menu kirik baglanti verir ve dist'teki baglanti testi kirmiziya doner.
export const yollar = {
  tr: {
    anaSayfa: '/',
    ekip: '/ekip',
    calismaAlanlari: '/calisma-alanlari',
    arabuluculuk: '/arabuluculuk',
    yayinlar: '/yayinlar',
    kararlar: '/kararlar',
  },
  en: {
    anaSayfa: '/en',
    ekip: '/en/team',
    calismaAlanlari: '/en/practice-areas',
    arabuluculuk: '/en/mediation',
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

// Menu sirasi docs/inceleme 6.3: Hakkimizda, Calisma Alanlari, Arabuluculuk, Ekip, Yayinlar,
// Kararlar, Iletisim. Bir oge, o sayfa gercekten uretildiginde eklenir; yoksa kirik baglanti olur.
export function menuOgeleri(dil: Dil): MenuOgesi[] {
  const m = metinler[dil];
  return [
    { ad: m.calismaAlanlari, yol: yollar[dil].calismaAlanlari },
    { ad: m.arabuluculuk, yol: yollar[dil].arabuluculuk },
    { ad: m.ekip, yol: yollar[dil].ekip },
  ];
}
