// Butun mock tablolari tek nesnede. Bu dosyayi yalnizca veri modulu (src/lib/veri.ts) ve
// mock butunluk testi okur; sayfalar dogrudan okumaz.
import type { Tablolar } from '../lib/tablolar';
import * as alanlar from './alanlar';
import * as ekip from './ekip';
import * as genel from './genel';
import * as kararlar from './kararlar';
import * as yayinlar from './yayinlar';

export const mockTablolar: Tablolar = {
  ...genel,
  ...alanlar,
  ...ekip,
  ...yayinlar,
  ...kararlar,
};
