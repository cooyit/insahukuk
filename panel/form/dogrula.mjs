// Iletisim formu verisinin dogrulanmasi ve iletisim_mesaji satirina cevrilmesi.
// Kurallar db/schema.sql'deki CHECK'lerle ayni; veritabani son guvence, burada kayit denenmeden
// ve ziyaretcinin anlayacagi bir mesajla reddedilir. Uzunluklar karakter (kod noktasi) sayisiyla
// olculur: PostgreSQL'in length() fonksiyonu gibi.

export const KONU_TURLERI = ['genel', 'randevu', 'arabuluculuk', 'diger'];

// ic.eposta_gecerli
const EPOSTA = /^[^@]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const YAZDIRILABILIR_ASCII = /^[!-~]+$/;
// ic.telefon_gecerli (E.164)
const E164 = /^\+[1-9][0-9]{7,14}$/;
// Sitedeki telefon alaninin pattern'i: rakam, bosluk, +, ( ) ve -
const TELEFON_GIRDISI = /^[0-9 +()-]{7,20}$/;
// Sitenin gizli alanla gonderdigi aydinlatma metni surumu (ornek: aydinlatma-2026-10)
const SURUM = /^[a-z0-9][a-z0-9.-]{0,63}$/;
// Ad tek satir; mesajda satir sonu ve sekme serbest. NUL PostgreSQL metninde saklanamaz.
const AD_KONTROL = /[\u0000-\u001f\u007f]/;
const MESAJ_KONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

const uzunluk = (s) => [...s].length;

// Ziyaretcinin yazdigi numarayi E.164'e cevirir; cevrilemiyorsa null.
// "0212 000 00 00", "212 000 00 00" ve "0090 212..." Turkiye numarasi sayilir.
export function telefonNormallestir(girdi) {
  const t = girdi.trim();
  if (!TELEFON_GIRDISI.test(t) || t.slice(1).includes('+')) return null;
  const rakamlar = t.replace(/[^0-9]/g, '');
  let e164;
  if (t.startsWith('+')) e164 = `+${rakamlar}`;
  else if (rakamlar.startsWith('00')) e164 = `+${rakamlar.slice(2)}`;
  else if (rakamlar.startsWith('0')) e164 = `+90${rakamlar.slice(1)}`;
  else if (rakamlar.length === 10) e164 = `+90${rakamlar}`;
  else return null;
  // Turkiye numarasi ulke kodundan sonra tam 10 hane.
  if (e164.startsWith('+90') && e164.length !== 13) return null;
  return E164.test(e164) ? e164 : null;
}

// Form alanlarindan (metin degerleri) kayit satirini uretir. hatalar: gecersiz alanlarin adlari.
export function formuDogrula(f) {
  const hatalar = [];

  const ad = (f.ad ?? '').trim();
  if (!ad || uzunluk(ad) > 120 || AD_KONTROL.test(ad)) hatalar.push('ad');

  // Veritabani kucuk harf ister; adresin alan adi kismi zaten buyuk-kucuk harf ayirmaz.
  const eposta = (f.eposta ?? '').trim().toLowerCase();
  if (eposta.length > 254 || !YAZDIRILABILIR_ASCII.test(eposta) || !EPOSTA.test(eposta)) hatalar.push('eposta');

  let telefon = null;
  if ((f.telefon ?? '').trim()) {
    telefon = telefonNormallestir(f.telefon);
    if (!telefon) hatalar.push('telefon');
  }

  const konu_turu = f.konu_turu ?? '';
  if (!KONU_TURLERI.includes(konu_turu)) hatalar.push('konu_turu');

  // Tarayicilar satir sonunu CRLF gonderir; textarea'nin maxlength'i ise LF'yi tek sayar.
  const mesaj = (f.mesaj ?? '').replace(/\r\n?/g, '\n').trim();
  if (!mesaj || uzunluk(mesaj) > 5000 || MESAJ_KONTROL.test(mesaj)) hatalar.push('mesaj');

  const aydinlatma_surumu = f.aydinlatma_surumu ?? '';
  if (!SURUM.test(aydinlatma_surumu)) hatalar.push('aydinlatma_surumu');

  return { hatalar, satir: { ad, eposta, telefon, konu_turu, mesaj, aydinlatma_surumu } };
}
