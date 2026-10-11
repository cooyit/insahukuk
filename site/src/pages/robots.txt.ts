import type { APIRoute } from 'astro';

// Site adresi tek yerde (astro.config.mjs) durur; robots.txt onu buradan alir.
export const GET: APIRoute = ({ site }) => {
  const haritaAdresi = new URL('sitemap-index.xml', site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${haritaAdresi}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
