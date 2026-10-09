import fs from 'node:fs';
import path from 'node:path';
let cache: any[] | null = null;
export function articles(locale: string) {
  if (!cache) cache = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/articles.json'), 'utf8'));
  return cache!.filter((a) => a.locale === locale).sort((a, b) => b.date.localeCompare(a.date));
}
const imgs = import.meta.glob<{ default: ImageMetadata }>('../assets/img/*.png', { eager: true });
export const cover = (name: string) => imgs[`../assets/img/${name}`].default;
export const areas = Array.from({ length: 24 }, (_, i) => `Çalışma Alanı ${i + 1}`);
