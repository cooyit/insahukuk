import { beforeAll, describe, expect, it } from 'vitest';
import { distVarMi, gorunenMetin, htmlSayfalari, yolVarMi, type Sayfa } from './dist';

let sayfalar: Sayfa[] = [];
const sayfa = (yol: string) => sayfalar.find((s) => s.yol === yol)!;

beforeAll(() => {
  if (!distVarMi()) throw new Error('dist/ yok: once "npm run build" calistirin');
  sayfalar = htmlSayfalari();
});

describe('kural: pasif kisi sitede gorunmez', () => {
  it('burodan ayrilan kisinin profil sayfasi uretilmez ve ekip listesinde yok', () => {
    expect(yolVarMi('/ekip/deniz-unal')).toBe(false);
    expect(yolVarMi('/en/team/deniz-unal')).toBe(false);
    expect(gorunenMetin(sayfa('/ekip').html)).not.toContain('Deniz Ünal');
  });
});

describe('kural: EN profil yalnizca EN cevirisi olan kisi icin', () => {
  it('EN profil sayfalari tam olarak EN biyografisi olanlar', () => {
    const en = sayfalar.filter((s) => s.yol.startsWith('/en/team/')).map((s) => s.yol).sort();
    expect(en).toEqual(['/en/team/ayse-yilmaz', '/en/team/burak-ozkan', '/en/team/zeynep-celik']);
  });
});

describe('kural: ekip listesi unvan sirasina gore; yalnizca foto, ad, unvan', () => {
  it('TR liste sirasi', () => {
    const metin = gorunenMetin(sayfa('/ekip').html);
    const sira = ['Ayşe Yılmaz', 'Zeynep Çelik', 'Burak Özkan', 'Mehmet Kaya', 'Selin Şahin', 'Kerem Işık', 'Elif Demir'].map((ad) =>
      metin.indexOf(ad),
    );
    expect(sira.every((konum) => konum >= 0)).toBe(true);
    expect([...sira].sort((a, b) => a - b)).toEqual(sira);
  });

  it('listede biyografi ya da iletisim bilgisi yok', () => {
    const main = sayfa('/ekip').html.match(/<main\b[\s\S]*?<\/main>/)![0];
    expect(gorunenMetin(main)).not.toMatch(/çalışmaktadır|Dahili|Baro/);
  });
});

describe('kural: KVKK - sitede gosterilmesi isaretlenmemis telefon cikmaz', () => {
  it('gizli cep numarasi hicbir sayfada yok', () => {
    for (const s of sayfalar) {
      expect(s.html, s.yol).not.toContain('905320000001');
    }
  });
});

describe('kural: meslege baslama yalnizca yil; "X yillik tecrube" hesaplanmaz', () => {
  it('profil sayfalarinda "N yil" / "N years" ifadesi yok', () => {
    for (const s of sayfalar.filter((x) => /^\/(en\/team|ekip)\//.test(x.yol))) {
      expect(gorunenMetin(s.html), s.yol).not.toMatch(/\d+\s*(yıl|sene|year)/iu);
    }
  });

  it('meslege baslama yili profilde yil olarak yazili', () => {
    expect(gorunenMetin(sayfa('/ekip/ayse-yilmaz').html)).toContain('Mesleğe başlama yılı 2003');
  });
});
