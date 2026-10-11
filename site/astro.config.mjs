// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Alan adi henuz belli degil (docs/inceleme-2026-10-09.md 7. bolum). Canonical ve
  // sitemap mutlak adres istedigi icin ayrilmis bir yer tutucu kullaniliyor.
  site: 'https://www.example.com',

  // Adresler docs/inceleme 6.3'teki gibi sonda egik cizgi olmadan: /ekip/ayse-yilmaz.
  // 'file' bicimi ekip/ayse-yilmaz.html uretir; Caddy'de "try_files {path}.html" ile sunulur.
  trailingSlash: 'never',
  build: { format: 'file' },

  // Turkce kokte, Ingilizce /en/ altinda.
  i18n: {
    locales: ['tr', 'en'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: false },
  },

  integrations: [sitemap()],
});
