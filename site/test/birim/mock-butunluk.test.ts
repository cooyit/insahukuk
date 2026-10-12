// Mock veri, PostgreSQL'e yuklense kabul edilecek veri olmali. Kurallar db/schema.sql'den
// kopyalandi; her blokta hangi sema kuralinin kopyasi oldugu yazili. Sema degisirse burasi da degisir.
import { describe, expect, it } from 'vitest';
import { mockTablolar as t } from '../../src/mock';
import type { Tablolar } from '../../src/lib/tablolar';

type Satir = Record<string, unknown>;
const tablo = (ad: keyof Tablolar) => t[ad] as unknown as Satir[];

// --- db/schema.sql bolum 0: dogrulama fonksiyonlarinin kopyasi -------------------------

// ic.slug_gecerli
const slugGecerli = (x: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(x) && x.length <= 120;
// ic.eposta_gecerli
const epostaGecerli = (x: string) =>
  /^[!-~]+$/.test(x) && !/[A-Z]/.test(x) && /^[^@]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(x) && x.length <= 254;
// ic.telefon_gecerli (E.164)
const telefonGecerli = (x: string) => /^\+[1-9][0-9]{7,14}$/.test(x);
// ic.https_url_gecerli
const httpsGecerli = (x: string) => /^https:\/\/[a-z0-9.-]+(:[0-9]+)?(\/\S*)?$/.test(x) && x.length <= 2000;
// ic.isbn_gecerli (ISBN-13 978/979 ya da ISBN-10)
function isbnGecerli(isbn: string): boolean {
  if (/^97[89][0-9]{10}$/.test(isbn)) {
    const toplam = [...isbn].reduce((t, r, i) => t + Number(r) * (i % 2 === 0 ? 1 : 3), 0);
    return toplam % 10 === 0;
  }
  if (/^[0-9]{9}[0-9X]$/.test(isbn)) {
    const toplam = [...isbn].reduce((t, r, i) => t + (10 - i) * (r === 'X' ? 10 : Number(r)), 0);
    return toplam % 11 === 0;
  }
  return false;
}

const bos = (x: unknown) => x === null || x === undefined;
const yilAraliginda = (x: unknown, alt: number, ust: number) => bos(x) || (Number(x) >= alt && Number(x) <= ust);

// --- Yabanci anahtarlar ---------------------------------------------------------------

// [tablo, sutun, hedef tablo, hedef sutun] ; bos (NULL) deger serbest, dolu deger hedefte olmali.
const YABANCI_ANAHTARLAR: [keyof Tablolar, string, keyof Tablolar, string][] = [
  ['calisma_alani', 'ust_alan_id', 'calisma_alani', 'id'],
  ['calisma_alani_ceviri', 'calisma_alani_id', 'calisma_alani', 'id'],
  ['calisma_alani_ceviri', 'dil', 'dil', 'kod'],
  ['unvan_ceviri', 'unvan_id', 'unvan', 'id'],
  ['unvan_ceviri', 'dil', 'dil', 'kod'],
  ['kisi', 'unvan_id', 'unvan', 'id'],
  ['kisi', 'foto', 'directus_files', 'id'],
  ['kisi_ceviri', 'kisi_id', 'kisi', 'id'],
  ['kisi_ceviri', 'dil', 'dil', 'kod'],
  ['kisi_telefon', 'kisi_id', 'kisi', 'id'],
  ['kisi_yabanci_dil', 'kisi_id', 'kisi', 'id'],
  ['kisi_calisma_alani', 'kisi_id', 'kisi', 'id'],
  ['kisi_calisma_alani', 'calisma_alani_id', 'calisma_alani', 'id'],
  ['egitim', 'kisi_id', 'kisi', 'id'],
  ['egitim_ceviri', 'egitim_id', 'egitim', 'id'],
  ['egitim_ceviri', 'dil', 'dil', 'kod'],
  ['deneyim', 'kisi_id', 'kisi', 'id'],
  ['deneyim_ceviri', 'deneyim_id', 'deneyim', 'id'],
  ['deneyim_ceviri', 'dil', 'dil', 'kod'],
  ['etiket_ceviri', 'etiket_id', 'etiket', 'id'],
  ['etiket_ceviri', 'dil', 'dil', 'kod'],
  ['yayin', 'kapak', 'directus_files', 'id'],
  ['yayin', 'video_dosyasi', 'directus_files', 'id'],
  ['yayin_ceviri', 'yayin_id', 'yayin', 'id'],
  ['yayin_ceviri', 'dil', 'dil', 'kod'],
  ['yayin_yazar', 'yayin_id', 'yayin', 'id'],
  ['yayin_yazar', 'kisi_id', 'kisi', 'id'],
  ['yayin_calisma_alani', 'yayin_id', 'yayin', 'id'],
  ['yayin_calisma_alani', 'calisma_alani_id', 'calisma_alani', 'id'],
  ['yayin_etiket', 'yayin_id', 'yayin', 'id'],
  ['yayin_etiket', 'etiket_id', 'etiket', 'id'],
  ['yayin_dosya', 'yayin_id', 'yayin', 'id'],
  ['yayin_dosya', 'dosya', 'directus_files', 'id'],
  ['mahkeme', 'ust_mahkeme_id', 'mahkeme', 'id'],
  ['karar', 'mahkeme_id', 'mahkeme', 'id'],
  ['karar', 'tam_metin_dosyasi', 'directus_files', 'id'],
  ['karar_mevzuat', 'karar_id', 'karar', 'id'],
  ['karar_mevzuat', 'mevzuat_id', 'mevzuat', 'id'],
  ['karar_etiket', 'karar_id', 'karar', 'id'],
  ['karar_etiket', 'etiket_id', 'etiket', 'id'],
  ['karar_calisma_alani', 'karar_id', 'karar', 'id'],
  ['karar_calisma_alani', 'calisma_alani_id', 'calisma_alani', 'id'],
  ['yayin_karar', 'yayin_id', 'yayin', 'id'],
  ['yayin_karar', 'karar_id', 'karar', 'id'],
  ['sayfa_ceviri', 'sayfa_id', 'sayfa', 'id'],
  ['sayfa_ceviri', 'dil', 'dil', 'kod'],
  ['site_ayar_ceviri', 'site_ayar_id', 'site_ayar', 'id'],
  ['site_ayar_ceviri', 'dil', 'dil', 'kod'],
];

// --- Tekil alanlar ----------------------------------------------------------------------

// [tablo, sutunlar, NULLS NOT DISTINCT mi]. Varsayilan (NULLS DISTINCT): icinde NULL olan satir
// tekillik disinda kalir; schema.sql'de "UNIQUE NULLS NOT DISTINCT" yazanlarda NULL da sayilir.
const TEKILLER: [keyof Tablolar, string[], boolean?][] = [
  ['dil', ['kod']],
  ['directus_files', ['id']],
  ['calisma_alani', ['id']],
  ['calisma_alani_ceviri', ['id']],
  ['calisma_alani_ceviri', ['calisma_alani_id', 'dil']],
  ['calisma_alani_ceviri', ['dil', 'slug']],
  ['unvan', ['id']],
  ['unvan', ['kod']],
  ['unvan', ['sira']],
  ['unvan_ceviri', ['id']],
  ['unvan_ceviri', ['unvan_id', 'dil']],
  ['kisi', ['id']],
  ['kisi', ['slug']],
  ['kisi', ['eposta']],
  ['kisi_ceviri', ['id']],
  ['kisi_ceviri', ['kisi_id', 'dil']],
  ['kisi_telefon', ['id']],
  ['kisi_telefon', ['kisi_id', 'tur', 'numara']],
  ['kisi_yabanci_dil', ['id']],
  ['kisi_yabanci_dil', ['kisi_id', 'dil_kodu']],
  ['kisi_calisma_alani', ['id']],
  ['kisi_calisma_alani', ['kisi_id', 'calisma_alani_id']],
  ['egitim', ['id']],
  ['egitim_ceviri', ['id']],
  ['egitim_ceviri', ['egitim_id', 'dil']],
  ['deneyim', ['id']],
  ['deneyim_ceviri', ['id']],
  ['deneyim_ceviri', ['deneyim_id', 'dil']],
  ['etiket', ['id']],
  ['etiket_ceviri', ['id']],
  ['etiket_ceviri', ['etiket_id', 'dil']],
  ['etiket_ceviri', ['dil', 'slug']],
  ['yayin', ['id']],
  ['yayin_ceviri', ['id']],
  ['yayin_ceviri', ['yayin_id', 'dil']],
  ['yayin_ceviri', ['dil', 'slug']],
  ['yayin_yazar', ['id']],
  ['yayin_yazar', ['yayin_id', 'kisi_id']],
  ['yayin_yazar', ['yayin_id', 'sira']],
  ['yayin_calisma_alani', ['id']],
  ['yayin_calisma_alani', ['yayin_id', 'calisma_alani_id']],
  ['yayin_etiket', ['id']],
  ['yayin_etiket', ['yayin_id', 'etiket_id']],
  ['yayin_dosya', ['id']],
  ['yayin_dosya', ['yayin_id', 'dosya']],
  ['mahkeme', ['id']],
  ['mahkeme', ['ust_mahkeme_id', 'ad'], true],
  ['mevzuat', ['id']],
  ['mevzuat', ['tur', 'numara']],
  ['karar', ['id']],
  ['karar', ['slug']],
  ['karar', ['mahkeme_id', 'karar_no']],
  ['karar_mevzuat', ['id']],
  ['karar_mevzuat', ['karar_id', 'mevzuat_id', 'madde'], true],
  ['karar_etiket', ['id']],
  ['karar_etiket', ['karar_id', 'etiket_id']],
  ['karar_calisma_alani', ['id']],
  ['karar_calisma_alani', ['karar_id', 'calisma_alani_id']],
  ['yayin_karar', ['id']],
  ['yayin_karar', ['yayin_id', 'karar_id']],
  ['sayfa', ['id']],
  ['sayfa', ['anahtar']],
  ['sayfa_ceviri', ['id']],
  ['sayfa_ceviri', ['sayfa_id', 'dil']],
  ['sayfa_ceviri', ['dil', 'slug'], true],
  ['site_ayar', ['id']],
  ['site_ayar_ceviri', ['id']],
  ['site_ayar_ceviri', ['site_ayar_id', 'dil']],
];

// Ayni kural hem satir bazinda hem tablo bazinda okunabilsin diye tek bicim:
// [aciklama (sema satiri), tablo, satir icin dogru olmasi gereken kosul]
type Kural = [string, keyof Tablolar, (r: any) => boolean];

const CHECK_KURALLARI: Kural[] = [
  // dil
  ["dil.kod ~ '^[a-z]{2}(-[a-z]{2})?$'", 'dil', (r) => /^[a-z]{2}(-[a-z]{2})?$/.test(r.kod)],
  ['dil: NOT varsayilan OR aktif', 'dil', (r) => !r.varsayilan || r.aktif],
  // calisma_alani
  ['calisma_alani: ust_alan_id <> id', 'calisma_alani', (r) => r.ust_alan_id !== r.id],
  ['calisma_alani_ceviri.slug: ic.slug_gecerli', 'calisma_alani_ceviri', (r) => slugGecerli(r.slug)],
  ['calisma_alani_ceviri.ad <= 120', 'calisma_alani_ceviri', (r) => r.ad.length <= 120],
  ['calisma_alani_ceviri.ozet <= 300', 'calisma_alani_ceviri', (r) => bos(r.ozet) || r.ozet.length <= 300],
  ['calisma_alani_ceviri.seo_baslik <= 70', 'calisma_alani_ceviri', (r) => bos(r.seo_baslik) || r.seo_baslik.length <= 70],
  ['calisma_alani_ceviri.seo_aciklama <= 170', 'calisma_alani_ceviri', (r) => bos(r.seo_aciklama) || r.seo_aciklama.length <= 170],
  // unvan
  ['unvan.kod: ic.slug_gecerli', 'unvan', (r) => slugGecerli(r.kod)],
  ['unvan_ceviri.ad <= 80', 'unvan_ceviri', (r) => r.ad.length <= 80],
  // kisi
  ['kisi.slug: ic.slug_gecerli', 'kisi', (r) => slugGecerli(r.slug)],
  ['kisi.eposta: ic.eposta_gecerli', 'kisi', (r) => bos(r.eposta) || epostaGecerli(r.eposta)],
  ["kisi.baro_sicil_no ~ '^[0-9]{1,8}$'", 'kisi', (r) => bos(r.baro_sicil_no) || /^[0-9]{1,8}$/.test(r.baro_sicil_no)],
  ["kisi.arabulucu_sicil_no ~ '^[0-9]{1,8}$'", 'kisi', (r) => bos(r.arabulucu_sicil_no) || /^[0-9]{1,8}$/.test(r.arabulucu_sicil_no)],
  ['kisi.meslege_baslama_yili BETWEEN 1950 AND 2100', 'kisi', (r) => yilAraliginda(r.meslege_baslama_yili, 1950, 2100)],
  ['kisi.linkedin_url: ic.https_url_gecerli', 'kisi', (r) => bos(r.linkedin_url) || httpsGecerli(r.linkedin_url)],
  ['kisi: baro_sicil_no IS NULL OR (avukat_mi AND baro_adi IS NOT NULL)', 'kisi', (r) => bos(r.baro_sicil_no) || (r.avukat_mi && !bos(r.baro_adi))],
  ['kisi: arabulucu_sicil_no IS NULL OR arabulucu_mu', 'kisi', (r) => bos(r.arabulucu_sicil_no) || r.arabulucu_mu],
  ['kisi_ceviri.kisa_biyografi <= 300', 'kisi_ceviri', (r) => bos(r.kisa_biyografi) || r.kisa_biyografi.length <= 300],
  // kisi_telefon: dahili 2-6 rakam, digerleri E.164
  ["kisi_telefon.tur IN ('dahili','cep','sabit')", 'kisi_telefon', (r) => ['dahili', 'cep', 'sabit'].includes(r.tur)],
  ['kisi_telefon.numara: dahili ise ^[0-9]{2,6}$, degilse ic.telefon_gecerli', 'kisi_telefon',
    (r) => (r.tur === 'dahili' ? /^[0-9]{2,6}$/.test(r.numara) : telefonGecerli(r.numara))],
  // kisi_yabanci_dil
  ["kisi_yabanci_dil.dil_kodu ~ '^[a-z]{2}$'", 'kisi_yabanci_dil', (r) => /^[a-z]{2}$/.test(r.dil_kodu)],
  // egitim / deneyim yillari
  ['egitim.baslangic_yili/bitis_yili BETWEEN 1900 AND 2100', 'egitim', (r) => yilAraliginda(r.baslangic_yili, 1900, 2100) && yilAraliginda(r.bitis_yili, 1900, 2100)],
  ['egitim: bitis_yili >= baslangic_yili', 'egitim', (r) => bos(r.bitis_yili) || bos(r.baslangic_yili) || r.bitis_yili >= r.baslangic_yili],
  ['deneyim.baslangic_yili/bitis_yili BETWEEN 1900 AND 2100', 'deneyim', (r) => yilAraliginda(r.baslangic_yili, 1900, 2100) && yilAraliginda(r.bitis_yili, 1900, 2100)],
  ['deneyim: bitis_yili >= baslangic_yili', 'deneyim', (r) => bos(r.bitis_yili) || bos(r.baslangic_yili) || r.bitis_yili >= r.baslangic_yili],
  // etiket
  ['etiket_ceviri.slug: ic.slug_gecerli', 'etiket_ceviri', (r) => slugGecerli(r.slug)],
  ['etiket_ceviri.ad <= 60', 'etiket_ceviri', (r) => r.ad.length <= 60],
  // yayin
  ["yayin.tur IN ('makale','kitap','video','haber','duyuru')", 'yayin', (r) => ['makale', 'kitap', 'video', 'haber', 'duyuru'].includes(r.tur)],
  ["yayin.durum IN ('taslak','incelemede','yayinda','arsiv')", 'yayin', (r) => ['taslak', 'incelemede', 'yayinda', 'arsiv'].includes(r.durum)],
  ['yayin.isbn: ic.isbn_gecerli', 'yayin', (r) => bos(r.isbn) || isbnGecerli(r.isbn)],
  ['yayin.basim_yili BETWEEN 1900 AND 2100', 'yayin', (r) => yilAraliginda(r.basim_yili, 1900, 2100)],
  ['yayin.sayfa_sayisi > 0', 'yayin', (r) => bos(r.sayfa_sayisi) || r.sayfa_sayisi > 0],
  ['yayin.video_url / kaynak_url: ic.https_url_gecerli', 'yayin', (r) => (bos(r.video_url) || httpsGecerli(r.video_url)) && (bos(r.kaynak_url) || httpsGecerli(r.kaynak_url))],
  ["yayin: durum <> 'yayinda' OR (yayin_tarihi IS NOT NULL AND onay_zamani IS NOT NULL)", 'yayin', (r) => r.durum !== 'yayinda' || (!bos(r.yayin_tarihi) && !bos(r.onay_zamani))],
  ["yayin: tur = 'kitap' OR yayinevi/isbn/basim_yili/sayfa_sayisi bos", 'yayin', (r) => r.tur === 'kitap' || [r.yayinevi, r.isbn, r.basim_yili, r.sayfa_sayisi].every(bos)],
  ["yayin: video ise video_url/video_dosyasi'ndan tam biri, degilse ikisi de bos", 'yayin',
    (r) => [r.video_url, r.video_dosyasi].filter((x) => !bos(x)).length === (r.tur === 'video' ? 1 : 0)],
  ["yayin: tur = 'haber' OR kaynak_adi/kaynak_url bos", 'yayin', (r) => r.tur === 'haber' || [r.kaynak_adi, r.kaynak_url].every(bos)],
  ['yayin_ceviri.slug: ic.slug_gecerli', 'yayin_ceviri', (r) => slugGecerli(r.slug)],
  ['yayin_ceviri.baslik <= 300, ozet <= 1000', 'yayin_ceviri', (r) => r.baslik.length <= 300 && (bos(r.ozet) || r.ozet.length <= 1000)],
  ['yayin_ceviri.seo_baslik <= 70, seo_aciklama <= 170', 'yayin_ceviri', (r) => (bos(r.seo_baslik) || r.seo_baslik.length <= 70) && (bos(r.seo_aciklama) || r.seo_aciklama.length <= 170)],
  ['yayin_yazar: kisi_id ve dis_yazar_adi\'ndan tam biri dolu', 'yayin_yazar', (r) => [r.kisi_id, r.dis_yazar_adi].filter((x) => !bos(x)).length === 1],
  ['yayin_yazar: dis_yazar_unvan IS NULL OR dis_yazar_adi IS NOT NULL', 'yayin_yazar', (r) => bos(r.dis_yazar_unvan) || !bos(r.dis_yazar_adi)],
  // mahkeme / mevzuat / karar
  ['mahkeme.tur listede', 'mahkeme', (r) => ['aym', 'yargitay', 'danistay', 'bam', 'bim', 'ilk_derece_adli', 'ilk_derece_idari', 'uyusmazlik', 'aihm', 'diger'].includes(r.tur)],
  ['mahkeme: ust_mahkeme_id <> id', 'mahkeme', (r) => r.ust_mahkeme_id !== r.id],
  ['mevzuat.tur listede', 'mevzuat', (r) => ['kanun', 'khk', 'cbk', 'tuzuk', 'yonetmelik', 'teblig', 'uluslararasi', 'diger'].includes(r.tur)],
  ['mevzuat.mevzuat_url: ic.https_url_gecerli', 'mevzuat', (r) => bos(r.mevzuat_url) || httpsGecerli(r.mevzuat_url)],
  ["karar.esas_no / karar_no ~ '^[0-9]{4}/[0-9]{1,7}$'", 'karar', (r) => [r.esas_no, r.karar_no].every((x) => bos(x) || /^[0-9]{4}\/[0-9]{1,7}$/.test(x))],
  ["karar.karar_tarihi >= DATE '1920-01-01'", 'karar', (r) => /^\d{4}-\d{2}-\d{2}$/.test(r.karar_tarihi) && r.karar_tarihi >= '1920-01-01'],
  ['karar.slug: ic.slug_gecerli', 'karar', (r) => slugGecerli(r.slug)],
  ["karar.durum IN ('taslak','incelemede','yayinda','arsiv')", 'karar', (r) => ['taslak', 'incelemede', 'yayinda', 'arsiv'].includes(r.durum)],
  ["karar: durum <> 'yayinda' OR (yayin_tarihi, anonimlestirildi, onay_zamani)", 'karar', (r) => r.durum !== 'yayinda' || (!bos(r.yayin_tarihi) && r.anonimlestirildi && !bos(r.onay_zamani))],
  ['karar: anonimlestirildi = (anonimlestirme_zamani IS NOT NULL)', 'karar', (r) => r.anonimlestirildi === !bos(r.anonimlestirme_zamani)],
  ['karar_mevzuat.madde <= 30', 'karar_mevzuat', (r) => bos(r.madde) || r.madde.length <= 30],
  // sayfa / site_ayar
  ["sayfa.anahtar ~ '^[a-z0-9_]+$'", 'sayfa', (r) => /^[a-z0-9_]+$/.test(r.anahtar)],
  ['sayfa_ceviri.slug: ic.slug_gecerli (ana sayfa icin NULL)', 'sayfa_ceviri', (r) => bos(r.slug) || slugGecerli(r.slug)],
  ['sayfa_ceviri.seo_baslik <= 70, seo_aciklama <= 170', 'sayfa_ceviri', (r) => (bos(r.seo_baslik) || r.seo_baslik.length <= 70) && (bos(r.seo_aciklama) || r.seo_aciklama.length <= 170)],
  ['site_ayar.id = 1', 'site_ayar', (r) => r.id === 1],
  ['site_ayar.telefon/faks/whatsapp: ic.telefon_gecerli', 'site_ayar', (r) => [r.telefon, r.faks, r.whatsapp_numarasi].every((x) => bos(x) || telefonGecerli(x))],
  ['site_ayar.eposta / form_bildirim_eposta: ic.eposta_gecerli', 'site_ayar', (r) => [r.eposta, r.form_bildirim_eposta].every((x) => bos(x) || epostaGecerli(x))],
  ['site_ayar.*_url: ic.https_url_gecerli', 'site_ayar', (r) => [r.linkedin_url, r.harita_url].every((x) => bos(x) || httpsGecerli(x))],
];

describe('kural: mock verinin yabanci anahtarlari var olan kayitlara isaret eder (REFERENCES)', () => {
  for (const [kaynak, sutun, hedef, hedefSutun] of YABANCI_ANAHTARLAR) {
    it(`${kaynak}.${sutun} -> ${hedef}.${hedefSutun}`, () => {
      const hedefler = new Set(tablo(hedef).map((r) => r[hedefSutun]));
      const yetim = tablo(kaynak).filter((r) => !bos(r[sutun]) && !hedefler.has(r[sutun]));
      expect(yetim).toEqual([]);
    });
  }
});

describe('kural: mock verinin tekil alanlari gercekten tekil (UNIQUE)', () => {
  for (const [ad, sutunlar, nullDahil] of TEKILLER) {
    it(`${ad} (${sutunlar.join(', ')})${nullDahil ? ' NULLS NOT DISTINCT' : ''}`, () => {
      const anahtarlar = tablo(ad)
        .filter((r) => nullDahil || sutunlar.every((s) => !bos(r[s])))
        .map((r) => JSON.stringify(sutunlar.map((s) => r[s] ?? null)));
      const tekrar = anahtarlar.filter((a, i) => anahtarlar.indexOf(a) !== i);
      expect(tekrar).toEqual([]);
    });
  }
});

describe('kural: mock veri CHECK kurallarini saglar', () => {
  for (const [aciklama, ad, kosul] of CHECK_KURALLARI) {
    it(aciklama, () => {
      const ihlal = tablo(ad).filter((r) => !kosul(r));
      expect(ihlal).toEqual([]);
    });
  }

  it('dil: tam olarak bir varsayilan dil ve o dil tr (dil_tek_varsayilan, dil_varsayilan_zorunlu)', () => {
    expect(t.dil.filter((d) => d.varsayilan).map((d) => d.kod)).toEqual(['tr']);
  });

  // ic.iki_seviye_kontrol: alt kaydin ustu yalnizca kok olabilir.
  it('calisma_alani ve mahkeme en fazla iki seviyeli', () => {
    for (const [ad, sutun] of [['calisma_alani', 'ust_alan_id'], ['mahkeme', 'ust_mahkeme_id']] as const) {
      const satirlar = tablo(ad);
      const ucuncuSeviye = satirlar.filter((r) => {
        const ust = satirlar.find((u) => u.id === r[sutun]);
        return ust !== undefined && !bos(ust[sutun]);
      });
      expect(ucuncuSeviye, ad).toEqual([]);
    }
  });

  it('kisi_telefon: cep numarasi varsayilan gizli kurali mock icin de gecerli', () => {
    expect(t.kisi_telefon.filter((x) => x.tur === 'cep' && x.sitede_goster)).toEqual([]);
  });
});

// db/schema.sql bolum 12: ic.ceviri_kurali_ekle(...) satirlari.
//   yayin (durum = 'yayinda', c.hazir) ; calisma_alani (gorunur) ; sayfa (aktif)
//   unvan, egitim, deneyim, etiket, site_ayar (her zaman)
const CEVIRI_KURALLARI: [keyof Tablolar, keyof Tablolar, string, (a: any) => boolean, (c: any) => boolean][] = [
  ['yayin', 'yayin_ceviri', 'yayin_id', (a) => a.durum === 'yayinda', (c) => c.hazir],
  ['calisma_alani', 'calisma_alani_ceviri', 'calisma_alani_id', (a) => a.gorunur, () => true],
  ['sayfa', 'sayfa_ceviri', 'sayfa_id', (a) => a.aktif, () => true],
  ['unvan', 'unvan_ceviri', 'unvan_id', () => true, () => true],
  ['egitim', 'egitim_ceviri', 'egitim_id', () => true, () => true],
  ['deneyim', 'deneyim_ceviri', 'deneyim_id', () => true, () => true],
  ['etiket', 'etiket_ceviri', 'etiket_id', () => true, () => true],
  ['site_ayar', 'site_ayar_ceviri', 'site_ayar_id', () => true, () => true],
];

describe('kural: yayindaki/gorunur kaydin Turkce cevirisi zorunlu (ic.ceviri_kurali)', () => {
  for (const [ana, ceviri, bag, anaKosul, ceviriKosul] of CEVIRI_KURALLARI) {
    it(`${ana} -> ${ceviri} (dil = 'tr')`, () => {
      const eksik = tablo(ana)
        .filter(anaKosul)
        .filter((a) => !tablo(ceviri).some((c) => c[bag] === a.id && c.dil === 'tr' && ceviriKosul(c)))
        .map((a) => a.id);
      expect(eksik).toEqual([]);
    });
  }
});

describe('kural: mock veri kurgusal', () => {
  it('karar konularinin hepsi ORNEK olarak isaretli', () => {
    expect(t.karar.filter((k) => !k.konu.includes('ÖRNEK')).map((k) => k.id)).toEqual([]);
  });

  it('dosyaya bagli her kaydin dosyasi site/public/dosyalar altinda var', async () => {
    const { existsSync } = await import('node:fs');
    const { join } = await import('node:path');
    const kok = join(import.meta.dirname, '..', '..', 'public', 'dosyalar');
    const eksik = t.directus_files.filter((d) => !d.filename_disk || !existsSync(join(kok, d.filename_disk)));
    expect(eksik).toEqual([]);
  });
});
