// Sabit sayfalarin adresleri. Icerik sayfalarinin (ekip/slug vb.) adresini veri modulu
// bu koklerden uretir; boylece bir adres degisirse tek yer degisir.
import type { Dil } from './metinler';

export const yollar = {
  tr: {
    anaSayfa: '/',
  },
  en: {
    anaSayfa: '/en',
  },
} satisfies Record<Dil, Record<string, string>>;

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
