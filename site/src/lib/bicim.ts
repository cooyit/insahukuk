// Gorunume yonelik bicimlendirme: tarih, yil, dil adi, telefon, Turkce siralama.
// Hepsi Intl ile; ek paket yok. Saat dilimi her zaman Europe/Istanbul (sunucu ve veri boyle).
import type { Dil } from './metinler';

const SAAT_DILIMI = 'Europe/Istanbul';
const YEREL: Record<Dil, string> = { tr: 'tr-TR', en: 'en-GB' };

// 'YYYY-AA-GG' (date sutunu) saatsiz gelir; Istanbul gece yarisi olarak okunur ki gun kaymasin.
function tarihOku(deger: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(deger) ? new Date(`${deger}T00:00:00+03:00`) : new Date(deger);
}

export function tarihBicimle(deger: string, dil: Dil): string {
  return new Intl.DateTimeFormat(YEREL[dil], {
    timeZone: SAAT_DILIMI, day: 'numeric', month: 'long', year: 'numeric',
  }).format(tarihOku(deger));
}

// Filtrelerde kullanilan yil; UTC'ye gore degil Istanbul'a gore (31 Aralik 23:30 UTC = 1 Ocak).
export function yilBul(deger: string): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: SAAT_DILIMI, year: 'numeric' }).format(tarihOku(deger)));
}

// <time datetime> icin makinece okunur tarih (Istanbul'a gore gun).
export function isoGun(deger: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SAAT_DILIMI }).format(tarihOku(deger));
}

// Veride yalnizca ISO 639-1 kodu var ('de'); ad dile gore uretilir ("Almanca" / "German").
export function dilAdi(kod: string, dil: Dil): string {
  return new Intl.DisplayNames([YEREL[dil]], { type: 'language' }).of(kod) ?? kod;
}

export function turkceKarsilastir(a: string, b: string): number {
  return a.localeCompare(b, 'tr');
}

// Veride E.164 ('+902120000003'); Turkiye numarasi okunur bicime cevrilir, digerleri oldugu gibi.
export function telefonBicimle(numara: string): string {
  const e = numara.match(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return e ? `+90 ${e[1]} ${e[2]} ${e[3]} ${e[4]}` : numara;
}

// Foto yerine gosterilen yer tutucu: Turkce buyuk harfle bas harfler ('ipek' -> 'İ').
export function basHarfler(ad: string, soyad: string): string {
  return `${ad.charAt(0)}${soyad.charAt(0)}`.toLocaleUpperCase('tr');
}
