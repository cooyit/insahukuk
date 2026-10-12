// Testlerin Directus REST API yardimcisi. Ek paket (SDK) yok: Node'un fetch'i yeterli.
import { inject } from 'vitest';

export function panel() {
  return inject('panel');
}

export async function girisYap(eposta = panel().eposta, sifre = panel().sifre) {
  const yanit = await fetch(`${panel().url}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: eposta, password: sifre }),
  });
  const govde = await yanit.json();
  if (!yanit.ok) throw new Error(`giris basarisiz: ${JSON.stringify(govde)}`);
  return govde.data.access_token;
}

// Yanit govdesi ve durum kodu birlikte doner; testler hata kodlarini da sinar.
export async function istek(token, yontem, yol, govde) {
  const yanit = await fetch(`${panel().url}${yol}`, {
    method: yontem,
    headers: { authorization: `Bearer ${token}`, ...(govde ? { 'content-type': 'application/json' } : {}) },
    body: govde ? JSON.stringify(govde) : undefined,
  });
  const metin = await yanit.text();
  return { durum: yanit.status, govde: metin ? JSON.parse(metin) : null };
}
