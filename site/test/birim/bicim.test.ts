import { describe, expect, it } from 'vitest';
import { basHarfler, dilAdi, isoGun, tarihBicimle, telefonBicimle, turkceKarsilastir, yilBul } from '../../src/lib/bicim';

describe('kural: Turkce siralama (localeCompare tr)', () => {
  it('Turkceye ozel harfle baslayan soyadlar alfabede dogru yerde', () => {
    const soyadlar = ['Yılmaz', 'Ünal', 'Şahin', 'Özkan', 'İnce', 'Işık', 'Ilgaz', 'Çelik', 'Demir', 'Can', 'Uçar', 'Sarı', 'Gök', 'Güneş', 'Osman'];
    expect([...soyadlar].sort(turkceKarsilastir)).toEqual([
      'Can', 'Çelik', 'Demir', 'Gök', 'Güneş', 'Ilgaz', 'Işık', 'İnce', 'Osman', 'Özkan', 'Sarı', 'Şahin', 'Uçar', 'Ünal', 'Yılmaz',
    ]);
  });

  it('duz (kod noktasi) siralama bu listede yanlis olurdu; test anlamli', () => {
    const soyadlar = ['Çelik', 'Demir', 'Şahin', 'Yılmaz'];
    expect([...soyadlar].sort()).not.toEqual([...soyadlar].sort(turkceKarsilastir));
  });
});

describe('kural: tarih bicimi Intl.DateTimeFormat, saat dilimi Europe/Istanbul', () => {
  it('TR ve EN tarih bicimi', () => {
    expect(tarihBicimle('2026-09-15T09:00:00+03:00', 'tr')).toBe('15 Eylül 2026');
    expect(tarihBicimle('2026-09-15T09:00:00+03:00', 'en')).toBe('15 September 2026');
  });

  it('UTC gece yarisina yakin an Istanbul gunune gore yazilir (gun ve yil kaymaz)', () => {
    // 31 Aralik 22:30 UTC = 1 Ocak 01:30 Istanbul
    expect(tarihBicimle('2025-12-31T22:30:00Z', 'tr')).toBe('1 Ocak 2026');
    expect(yilBul('2025-12-31T22:30:00Z')).toBe(2026);
    expect(isoGun('2025-12-31T22:30:00Z')).toBe('2026-01-01');
  });

  it('saatsiz date sutunu (karar_tarihi) bir gun geriye kaymaz', () => {
    expect(tarihBicimle('2025-02-10', 'tr')).toBe('10 Şubat 2025');
    expect(isoGun('2025-02-10')).toBe('2025-02-10');
    expect(yilBul('2025-01-01')).toBe(2025);
  });

  it('2016 oncesi kis tarihleri (Istanbul +02:00) da kaymaz', () => {
    expect(tarihBicimle('2015-01-10', 'tr')).toBe('10 Ocak 2015');
    expect(isoGun('2015-01-10')).toBe('2015-01-10');
    expect(yilBul('2014-01-01')).toBe(2014);
  });
});

describe('kural: yabanci dil adi koddan Intl.DisplayNames ile uretilir', () => {
  it('de -> Almanca / German', () => {
    expect(dilAdi('de', 'tr')).toBe('Almanca');
    expect(dilAdi('de', 'en')).toBe('German');
  });

  it('diger ornekler', () => {
    expect(dilAdi('en', 'tr')).toBe('İngilizce');
    expect(dilAdi('ar', 'tr')).toBe('Arapça');
    expect(dilAdi('fr', 'en')).toBe('French');
  });
});

describe('gorunum yardimcilari', () => {
  it('E.164 Turkiye numarasi okunur bicime cevrilir, digerleri oldugu gibi kalir', () => {
    expect(telefonBicimle('+902120000003')).toBe('+90 212 000 00 03');
    expect(telefonBicimle('+4930123456')).toBe('+4930123456');
  });

  it('bas harfler Turkce buyuk harfle (i -> İ)', () => {
    expect(basHarfler('ipek', 'ince')).toBe('İİ');
    expect(basHarfler('Ayşe', 'Yılmaz')).toBe('AY');
  });
});
