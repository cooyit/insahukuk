// Filtre seceneklerini listedeki kayitlardan toplar: yalnizca gercekten kullanilan degerler
// gorunur, boylece "secince bos liste" veren secenek olmaz.
import { turkceKarsilastir } from './bicim';

export interface Secenek {
  deger: string;
  ad: string;
}

export function secenekleriTopla<T>(kayitlar: T[], cikar: (kayit: T) => Secenek[], sira: 'ad' | 'azalan' = 'ad'): Secenek[] {
  const harita = new Map<string, Secenek>();
  for (const kayit of kayitlar) {
    for (const s of cikar(kayit)) harita.set(s.deger, s);
  }
  const liste = [...harita.values()];
  // 'azalan': yillar gibi sayisal degerler yeniden eskiye.
  return sira === 'azalan'
    ? liste.sort((a, b) => Number(b.deger) - Number(a.deger))
    : liste.sort((a, b) => turkceKarsilastir(a.ad, b.ad));
}

// data-x niteligi icin bosluklu deger listesi.
export function degerler(liste: (string | number)[]): string {
  return [...new Set(liste.map(String))].join(' ');
}
