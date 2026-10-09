// usage: node gen.mjs <projectDir>  -> data/articles.json, src/assets/img/*.png, src/content/md/*.md
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const dir = process.argv[2]; const require = createRequire(path.join(dir, 'package.json'));
const sharp = require('sharp');
const trW = 'hukuk dava sözleşme arabuluculuk tahkim şirket birleşme devralma rekabet kurulu karar yargıtay danıştay anayasa mahkemesi bireysel başvuru kişisel veri kvkk aydınlatma metni iş hukuku kıdem tazminatı işe iade ticari uyuşmazlık icra iflas konkordato fikri mülkiyet marka patent enerji mevzuatı yönetmelik tebliğ madde fıkra bent hüküm gerekçe temyiz istinaf bölge adliye müvekkil vekil avukat ortak danışman'.split(' ');
const enW = 'law litigation contract mediation arbitration company merger acquisition competition authority decision court of cassation council of state constitutional court individual application personal data protection notice employment severance reinstatement commercial dispute enforcement bankruptcy concordat intellectual property trademark patent energy regulation communique article paragraph provision reasoning appeal regional client counsel attorney partner'.split(' ');
let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const words = (w, n) => Array.from({ length: n }, () => w[Math.floor(rnd() * w.length)]).join(' ');
function body(w, nWords, md) {
  let out = '', left = nWords, h = 0;
  while (left > 0) {
    if (left % 5 === 0 || out === '') { h++; out += md ? `\n## ${words(w, 5)}\n\n` : `<h2 id="b${h}">${words(w, 5)}</h2>\n`; }
    const n = Math.min(left, 60 + Math.floor(rnd() * 80)); left -= n;
    const t = words(w, n);
    out += md ? `${t.charAt(0).toUpperCase() + t.slice(1)}. **${words(w,3)}** [${words(w,2)}](https://example.com/x).\n\n`
              : `<p>${t.charAt(0).toUpperCase() + t.slice(1)}. <strong>${words(w,3)}</strong> <a href="/x">${words(w,2)}</a>.</p>\n`;
    if (rnd() < 0.08) out += md ? `- ${words(w,8)}\n- ${words(w,8)}\n- ${words(w,8)}\n\n` : `<ul><li>${words(w,8)}</li><li>${words(w,8)}</li><li>${words(w,8)}</li></ul>\n`;
  }
  return out;
}
const N = 200, arts = [];
fs.mkdirSync(path.join(dir, 'src/content/md'), { recursive: true });
for (let i = 0; i < N; i++) for (const loc of ['tr', 'en']) {
  const w = loc === 'tr' ? trW : enW; const nWords = 2000 + Math.floor(rnd() * 2000);
  const a = { id: i, locale: loc, slug: `${loc === 'tr' ? 'makale' : 'article'}-${i}-${words(w, 3).replace(/[^a-z0-9ığüşöç]+/g, '-')}`,
    title: words(w, 7), excerpt: words(w, 30), date: new Date(Date.UTC(2020, 0, 1) + i * 86400000 * 6).toISOString(),
    cover: `img${String(i % 20).padStart(2, '0')}.png`, author: `Av. ${words(w, 2)}`, area: words(w, 2), html: body(w, nWords, false) };
  arts.push(a);
  const md = `---\ntitle: "${a.title}"\nlocale: ${loc}\ndate: ${a.date}\nexcerpt: "${a.excerpt}"\ncover: ../../assets/img/${a.cover}\n---\n` + body(w, nWords, true);
  fs.writeFileSync(path.join(dir, `src/content/md/${loc}-${i}.md`), md);
}
fs.writeFileSync(path.join(dir, 'data/articles.json'), JSON.stringify(arts));
const totalWords = arts.reduce((s, a) => s + a.html.split(' ').length, 0);
console.log('articles', arts.length, 'json MB', (fs.statSync(path.join(dir, 'data/articles.json')).size / 1e6).toFixed(1), 'approx words', totalWords);
fs.mkdirSync(path.join(dir, 'src/assets/img'), { recursive: true });
for (let k = 0; k < 20; k++) {
  const W = 2400, H = 1600, buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 3;
    buf[o] = (x * 255 / W + k * 13) & 255; buf[o + 1] = (y * 255 / H) & 255; buf[o + 2] = ((x ^ y) + k * 7 + (rnd() * 40 | 0)) & 255; }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 6 }).toFile(path.join(dir, `src/assets/img/img${String(k).padStart(2, '0')}.png`));
}
console.log('images done');
