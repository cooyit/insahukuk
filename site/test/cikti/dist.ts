// Derleme ciktisini (dist/) okuyan yardimcilar. HTML'i Astro biz urettigimiz icin
// nitelikler her zaman cift tirnakli; basit duzenli ifadeler yeterli, ayri bir HTML
// ayristirici paketi gerekmiyor.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const DIST = join(import.meta.dirname, '..', '..', 'dist');
export const SITE = 'https://www.example.com';

export interface Sayfa {
  yol: string; // '/ekip/ayse-yilmaz'
  dosya: string;
  html: string;
}

function dosyalar(klasor: string): string[] {
  return readdirSync(klasor, { withFileTypes: true }).flatMap((g) =>
    g.isDirectory() ? dosyalar(join(klasor, g.name)) : [join(klasor, g.name)],
  );
}

export function distVarMi(): boolean {
  return existsSync(join(DIST, 'index.html'));
}

// dist/ekip/ayse-yilmaz.html -> /ekip/ayse-yilmaz ; dist/index.html -> /
export function dosyadanYol(dosya: string): string {
  const goreli = relative(DIST, dosya).split(sep).join('/').replace(/\.html$/, '');
  return goreli === 'index' ? '/' : `/${goreli}`;
}

export function htmlSayfalari(): Sayfa[] {
  return dosyalar(DIST)
    .filter((d) => d.endsWith('.html'))
    .map((dosya) => ({ yol: dosyadanYol(dosya), dosya, html: readFileSync(dosya, 'utf8') }));
}

export function cssDosyalari(): { dosya: string; css: string }[] {
  return dosyalar(DIST)
    .filter((d) => d.endsWith('.css'))
    .map((dosya) => ({ dosya, css: readFileSync(dosya, 'utf8') }));
}

// Bir adres dist icinde gercek bir dosyaya karsilik geliyor mu? (Caddy'deki "try_files {path}.html" gibi)
export function yolVarMi(yol: string): boolean {
  const temiz = decodeURIComponent(yol.split('#')[0].split('?')[0]);
  if (temiz === '/') return existsSync(join(DIST, 'index.html'));
  const aday = join(DIST, temiz);
  // Klasorun var olmasi yetmez (dist/en klasoru var ama /en sayfasi en.html'dir).
  return dosyaMi(`${aday}.html`) || dosyaMi(aday);
}

function dosyaMi(yol: string): boolean {
  return existsSync(yol) && statSync(yol).isFile();
}

export function etiketler(html: string, ad: string): string[] {
  return html.match(new RegExp(`<${ad}\\b[^>]*>`, 'gi')) ?? [];
}

export function nitelik(etiket: string, ad: string): string | undefined {
  return etiket.match(new RegExp(`\\s${ad}="([^"]*)"`, 'i'))?.[1];
}

// Gorunen metin: script/style ve etiketler atilir, en sik varliklar cozulur.
export function gorunenMetin(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');
}
