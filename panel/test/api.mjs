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

// Test editoru: yoksa Editor rolunde olusturulur, sonra giris yapilir. Lisanssiz katmanda en fazla
// 3 panel kullanicisi var (yonetici + 2); testler bu tek editoru paylasir.
export const TEST_EDITOR = { eposta: 'editor.test@ornek.av.tr', sifre: 'Test-Editor-Sifresi-123' };

export async function editorGirisi() {
  const yonetici = await girisYap();
  const { govde: var_ } = await istek(yonetici, 'GET', `/users?filter[email][_eq]=${TEST_EDITOR.eposta}&fields=id`);
  if (!var_.data.length) {
    const { govde: rol } = await istek(yonetici, 'GET', '/roles?filter[name][_eq]=Editör&fields=id');
    const { durum, govde } = await istek(yonetici, 'POST', '/users', {
      email: TEST_EDITOR.eposta, password: TEST_EDITOR.sifre, role: rol.data[0].id, first_name: 'Test', last_name: 'Editör',
    });
    if (durum !== 200) throw new Error(`test editoru olusturulamadi: ${JSON.stringify(govde)}`);
  }
  return girisYap(TEST_EDITOR.eposta, TEST_EDITOR.sifre);
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
