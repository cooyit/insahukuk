// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Alan adi henuz alinmadi; yerel incelemeler bitince alinacak. Canonical ve sitemap mutlak
  // adres istedigi icin uydurma bir ad: ".test" uzantisi test icin ayrilmis, gercek siteyle cakismaz.
  site: 'https://www.insahukuk.test',

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
