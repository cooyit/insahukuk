import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://www.example-hukuk.com.tr', i18n: { locales: ['tr', 'en'], defaultLocale: 'tr', routing: { prefixDefaultLocale: true } } });
