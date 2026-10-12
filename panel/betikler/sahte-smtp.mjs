// Yerel gelistirme ve testler icin sahte SMTP alicisi: hicbir e-postayi disari gondermez; Directus'un
// gonderdigi her e-postayi bir klasore .eml dosyasi olarak yazar (Mail uygulamasiyla acilabilir).
// Yalnizca 127.0.0.1'i dinler; kimlik dogrulama ve TLS yok. Ek paket yok (node:net).
// Canlida kullanilmaz: orada .env'deki EMAIL_SMTP_* buronun e-posta saglayicisini gosterir.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { envOku, VERI } from './ortak.mjs';

export const POSTA = join(VERI, 'posta');

export function sahteSmtp(dizin) {
  mkdirSync(dizin, { recursive: true });
  let sayac = 0;
  return createServer((soket) => {
    soket.setEncoding('utf8');
    let tampon = '';
    let veri = null; // DATA icindeyken gelen satirlar
    let alicilar = [];
    const yaz = (s) => soket.write(`${s}\r\n`);
    soket.on('error', () => {});
    yaz('220 sahte-smtp hazir');
    soket.on('data', (parca) => {
      tampon += parca;
      let son;
      while ((son = tampon.indexOf('\r\n')) >= 0) {
        const satir = tampon.slice(0, son);
        tampon = tampon.slice(son + 2);
        if (veri !== null) {
          if (satir !== '.') {
            veri.push(satir.startsWith('.') ? satir.slice(1) : satir); // nokta doldurma (RFC 5321 4.5.2)
            continue;
          }
          const ad = `${Date.now()}-${String(++sayac).padStart(4, '0')}.eml`;
          writeFileSync(join(dizin, ad), `X-Sahte-Alicilar: ${alicilar.join(', ')}\r\n${veri.join('\r\n')}\r\n`);
          veri = null;
          alicilar = [];
          yaz('250 kaydedildi');
          continue;
        }
        const komut = satir.slice(0, 4).toUpperCase();
        if (komut === 'EHLO') {
          yaz('250-sahte-smtp');
          yaz('250 8BITMIME');
        } else if (komut === 'HELO' || komut === 'NOOP') yaz('250 tamam');
        else if (komut === 'MAIL' || komut === 'RSET') {
          alicilar = [];
          yaz('250 tamam');
        } else if (komut === 'RCPT') {
          alicilar.push(satir.replace(/^RCPT TO:\s*<?([^>\s]*)>?.*$/i, '$1'));
          yaz('250 tamam');
        } else if (komut === 'DATA') {
          veri = [];
          yaz('354 bitirmek icin <CRLF>.<CRLF>');
        } else if (komut === 'QUIT') {
          yaz('221 hosca kal');
          soket.end();
        } else yaz('502 desteklenmiyor');
      }
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(envOku().EMAIL_SMTP_PORT ?? 2525);
  sahteSmtp(POSTA).listen(port, '127.0.0.1', () => console.log(`Sahte SMTP: 127.0.0.1:${port}; e-postalar: ${POSTA}`));
}
