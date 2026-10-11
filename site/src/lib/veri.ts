// Veri modulu: sayfalarin veriye eristigi TEK yer.
//
// Akis: sayfa (src/pages) -> bu modul -> tablolar.
//   Bu gece tablolar mock dosyalarindan (src/mock) gelir.
//   Canlida yalnizca tablolariYukle() degisir: her tablo salt okuma yetkili bir kullaniciyla
//   PostgreSQL'den "SELECT <tablolar.ts'deki sutunlar> FROM <tablo>" ile okunur.
//
// Yayin kurallari burada durur (sayfalar kural bilmez):
//   yayin:         durum = 'yayinda' ve yayin_tarihi <= simdi
//   karar:         ayni kural + anonimlestirildi = true; yalnizca Turkce
//   kisi:          aktif = true
//   calisma alani: gorunur = true (ust alani da gorunur olmali)
//   EN sayfa:      yalnizca EN cevirisi olan (yayinda: hazir = true) kayit icin
// "simdi" test edilebilsin diye parametredir; varsayilan derleme zamani.
//
// Fonksiyonlar async: canlida veritabani okumasi asenkron olacak; sayfalar bugunden await eder.

import { mockTablolar } from '../mock';
import { basHarfler, turkceKarsilastir, yilBul } from './bicim';
import { duzMetin, htmlTemizle } from './html';
import type { Dil } from './metinler';
import type { CalismaAlani, Karar, Kisi, Tablolar, Yayin, YayinCeviri, YayinTuru } from './tablolar';
import { sayfaYolu, yollar } from './yollar';

const DERLEME_ZAMANI = new Date();

async function tablolariYukle(): Promise<Tablolar> {
  return mockTablolar;
}

export interface Secenek {
  simdi?: Date;
  // Testler kurallari ozel veriyle sinamak icin verir; site hep varsayilani kullanir.
  tablolar?: Tablolar;
}

interface Baglam {
  t: Tablolar;
  simdi: Date;
  dil: Dil;
}

async function baglamKur(dil: Dil, secenek: Secenek = {}): Promise<Baglam> {
  return { t: secenek.tablolar ?? (await tablolariYukle()), simdi: secenek.simdi ?? DERLEME_ZAMANI, dil };
}

// ---------------------------------------------------------------------------
// Disariya verilen sekiller. Sayfalar yalnizca bunlari gorur; tablo satirlarini gormez.
// ---------------------------------------------------------------------------

export interface Baglanti {
  id: number;
  ad: string;
  url: string | null;
}

export interface KisiOzet {
  id: number;
  slug: string;
  tamAd: string;
  soyad: string;
  basHarfler: string;
  unvan: string | null;
  fotoUrl: string | null;
  // Bu dilde profil sayfasi yoksa null (ornek: EN biyografisi olmayan kisi).
  url: string | null;
}

export interface EgitimSatiri {
  okul: string;
  bolum: string | null;
  derece: string | null;
  baslangicYili: number | null;
  bitisYili: number | null;
}

export interface DeneyimSatiri {
  kurum: string;
  pozisyon: string;
  aciklama: string | null;
  baslangicYili: number | null;
  bitisYili: number | null;
}

export interface Telefon {
  tur: 'dahili' | 'cep' | 'sabit';
  numara: string;
}

export interface KisiDetay extends KisiOzet {
  url: string;
  karsilik: string | null;
  aciklama: string;
  seoBaslik: string | null;
  biyografi: string;
  alanlar: Baglanti[];
  egitim: EgitimSatiri[];
  deneyim: DeneyimSatiri[];
  telefonlar: Telefon[];
  yabanciDiller: string[];
  meslegeBaslamaYili: number | null;
  baroAdi: string | null;
  avukat: boolean;
  arabulucu: boolean;
  yayinlar: YayinOzet[];
}

export interface AlanOzet {
  id: number;
  slug: string;
  ad: string;
  ozet: string | null;
  url: string;
  altAlanlar: AlanOzet[];
}

export interface AlanDetay extends AlanOzet {
  karsilik: string | null;
  aciklama: string;
  seoBaslik: string | null;
  icerik: string;
  ust: Baglanti | null;
  kisiler: KisiOzet[];
  yayinlar: YayinOzet[];
}

export interface Yazar {
  ad: string;
  unvan: string | null;
  kisiId: number | null;
  url: string | null;
}

export interface EtiketOzet {
  id: number;
  ad: string;
}

export interface YayinOzet {
  id: number;
  tur: YayinTuru;
  baslik: string;
  ozet: string | null;
  url: string;
  tarih: string;
  yil: number;
  yazarlar: Yazar[];
  alanlar: Baglanti[];
  etiketler: EtiketOzet[];
}

export interface Dosya {
  ad: string;
  url: string;
  tur: string | null;
}

export interface YayinDetay extends YayinOzet {
  karsilik: string | null;
  aciklama: string;
  seoBaslik: string | null;
  icerik: string;
  kitap: { yayinevi: string | null; isbn: string | null; basimYili: number | null; sayfaSayisi: number | null } | null;
  videoUrl: string | null;
  kaynak: { ad: string | null; url: string | null } | null;
  dosyalar: Dosya[];
  kararlar: KararOzet[];
}

export interface MevzuatBagi {
  mevzuatId: number;
  ad: string;
  kisaAd: string | null;
  madde: string | null;
  // "TBK m. 344"; madde yoksa kanunun butunu: "HMK"
  etiket: string;
}

export interface KararOzet {
  id: number;
  slug: string;
  url: string;
  konu: string;
  ozet: string | null;
  mahkemeAdi: string;
  ustMahkeme: { id: number; ad: string };
  esasNo: string | null;
  kararNo: string | null;
  tarih: string;
  yil: number;
  alanlar: Baglanti[];
  mevzuat: MevzuatBagi[];
}

// Bilerek ofis_davasi yok: "hangi avukatin davasi" bilgisi sitede hicbir yere cikmamali.
export interface KararDetay extends KararOzet {
  aciklama: string;
  tamMetin: string;
  dosya: Dosya | null;
  etiketler: EtiketOzet[];
  yayinlar: YayinOzet[];
}

export interface SayfaIcerik {
  anahtar: string;
  baslik: string;
  icerik: string;
  aciklama: string;
  seoBaslik: string | null;
  url: string;
  karsilik: string | null;
}

export interface SiteAyari {
  resmiUnvan: string;
  telefon: string | null;
  eposta: string | null;
  haritaUrl: string | null;
  aydinlatmaSurumu: string | null;
  adres: string | null;
  altBilgiNotu: string | null;
  // site_ayar'da baro alani yok; aktif avukatlarin kayitli oldugu barolardan turetilir.
  barolar: string[];
}

// ---------------------------------------------------------------------------
// Kurallar
// ---------------------------------------------------------------------------

function yayindaMi(durum: string, yayinTarihi: string | null | undefined, simdi: Date): boolean {
  return durum === 'yayinda' && !!yayinTarihi && new Date(yayinTarihi).getTime() <= simdi.getTime();
}

function yayinGorunurMu(y: Yayin, simdi: Date): boolean {
  return yayindaMi(y.durum, y.yayin_tarihi, simdi);
}

function kararGorunurMu(k: Karar, simdi: Date): boolean {
  return yayindaMi(k.durum, k.yayin_tarihi, simdi) && k.anonimlestirildi;
}

function alanGorunurMu(a: CalismaAlani, t: Tablolar): boolean {
  if (!a.gorunur) return false;
  if (a.ust_alan_id == null) return true;
  return t.calisma_alani.find((u) => u.id === a.ust_alan_id)?.gorunur === true;
}

function yayinCevirisi(b: Baglam, yayinId: number, dil: Dil = b.dil): YayinCeviri | undefined {
  return b.t.yayin_ceviri.find((c) => c.yayin_id === yayinId && c.dil === dil && c.hazir);
}

// ---------------------------------------------------------------------------
// Ortak yardimcilar
// ---------------------------------------------------------------------------

function aciklamaSec(...adaylar: (string | null | undefined)[]): string {
  const metin = adaylar.map(duzMetin).find((m) => m.length > 0) ?? '';
  if (metin.length <= 160) return metin;
  return `${metin.slice(0, 157).replace(/\s+\S*$/, '')}...`;
}

function dosyaBul(t: Tablolar, id: string | null | undefined): Dosya | null {
  const d = id ? t.directus_files.find((f) => f.id === id) : undefined;
  if (!d?.filename_disk) return null;
  return { ad: d.filename_download, url: `/dosyalar/${d.filename_disk}`, tur: d.type ?? null };
}

function digerDilinde(dil: Dil): Dil {
  return dil === 'tr' ? 'en' : 'tr';
}

// --- kisi ---

function kisiProfilVarMi(b: Baglam, k: Kisi, dil: Dil): boolean {
  if (!k.aktif) return false;
  // Kisi adi dil bagimsiz; EN profil ancak EN biyografi satiri varsa uretilir.
  return dil === 'tr' || b.t.kisi_ceviri.some((c) => c.kisi_id === k.id && c.dil === dil);
}

function kisiUrl(b: Baglam, k: Kisi, dil: Dil = b.dil): string | null {
  return kisiProfilVarMi(b, k, dil) ? `${yollar[dil].ekip}/${k.slug}` : null;
}

function unvanSirasi(b: Baglam, k: Kisi): number {
  return b.t.unvan.find((u) => u.id === k.unvan_id)?.sira ?? Number.MAX_SAFE_INTEGER;
}

// Ekip sirasi: unvan sirasi, sonra unvan icindeki siralama, sonra Turkce alfabeyle soyad ve ad.
function ekipSirasi(b: Baglam): (x: Kisi, y: Kisi) => number {
  return (x, y) =>
    unvanSirasi(b, x) - unvanSirasi(b, y) ||
    x.siralama - y.siralama ||
    turkceKarsilastir(x.soyad, y.soyad) ||
    turkceKarsilastir(x.ad, y.ad);
}

function kisiOzeti(b: Baglam, k: Kisi): KisiOzet {
  const unvan = b.t.unvan_ceviri.find((u) => u.unvan_id === k.unvan_id && u.dil === b.dil);
  return {
    id: k.id,
    slug: k.slug,
    tamAd: `${k.ad} ${k.soyad}`,
    soyad: k.soyad,
    basHarfler: basHarfler(k.ad, k.soyad),
    unvan: unvan?.ad ?? null,
    fotoUrl: dosyaBul(b.t, k.foto)?.url ?? null,
    url: kisiUrl(b, k),
  };
}

// --- calisma alani ---

function alanCevirisi(b: Baglam, alanId: number, dil: Dil = b.dil) {
  return b.t.calisma_alani_ceviri.find((c) => c.calisma_alani_id === alanId && c.dil === dil);
}

function alanUrl(b: Baglam, alanId: number, dil: Dil = b.dil): string | null {
  const a = b.t.calisma_alani.find((x) => x.id === alanId);
  const c = alanCevirisi(b, alanId, dil);
  return a && c && alanGorunurMu(a, b.t) ? `${yollar[dil].calismaAlanlari}/${c.slug}` : null;
}

// Bir kaydin bagli oldugu alanlar: yalnizca gorunur ve bu dilde cevirisi olanlar, ada gore.
function alanBaglantilari(b: Baglam, alanIdleri: number[]): Baglanti[] {
  return alanIdleri
    .map((id) => ({ id, url: alanUrl(b, id), ad: alanCevirisi(b, id)?.ad ?? '' }))
    .filter((x) => x.url !== null)
    .sort((x, y) => turkceKarsilastir(x.ad, y.ad));
}

// Ust alan icin kendisi + alt alanlari; alt alan icin yalnizca kendisi.
function alanVeAltlari(b: Baglam, alanId: number): number[] {
  return [alanId, ...b.t.calisma_alani.filter((a) => a.ust_alan_id === alanId).map((a) => a.id)];
}

function alanOzeti(b: Baglam, a: CalismaAlani): AlanOzet | null {
  const c = alanCevirisi(b, a.id);
  const url = alanUrl(b, a.id);
  if (!c || !url) return null;
  const altAlanlar = b.t.calisma_alani
    .filter((x) => x.ust_alan_id === a.id)
    .sort((x, y) => x.siralama - y.siralama)
    .map((x) => alanOzeti(b, x))
    .filter((x): x is AlanOzet => x !== null);
  return { id: a.id, slug: c.slug, ad: c.ad, ozet: c.ozet ?? null, url, altAlanlar };
}

// --- etiket ---

function etiketOzetleri(b: Baglam, etiketIdleri: number[]): EtiketOzet[] {
  return etiketIdleri
    .map((id) => ({ id, ad: b.t.etiket_ceviri.find((c) => c.etiket_id === id && c.dil === b.dil)?.ad }))
    .filter((e): e is EtiketOzet => !!e.ad)
    .sort((x, y) => turkceKarsilastir(x.ad, y.ad));
}

// --- yayin ---

function yayinUrl(b: Baglam, yayinId: number, dil: Dil = b.dil): string | null {
  const y = b.t.yayin.find((x) => x.id === yayinId);
  const c = yayinCevirisi(b, yayinId, dil);
  return y && c && yayinGorunurMu(y, b.simdi) ? `${yollar[dil].yayinlar}/${c.slug}` : null;
}

function yazarlar(b: Baglam, yayinId: number): Yazar[] {
  return b.t.yayin_yazar
    .filter((yy) => yy.yayin_id === yayinId)
    .sort((x, y) => x.sira - y.sira)
    .map((yy) => {
      const k = yy.kisi_id != null ? b.t.kisi.find((x) => x.id === yy.kisi_id) : undefined;
      if (k) return { ad: `${k.ad} ${k.soyad}`, unvan: null, kisiId: k.id, url: kisiUrl(b, k) };
      return { ad: yy.dis_yazar_adi ?? '', unvan: yy.dis_yazar_unvan ?? null, kisiId: null, url: null };
    });
}

function yayinOzeti(b: Baglam, y: Yayin, c: YayinCeviri): YayinOzet {
  const tarih = y.yayin_tarihi!;
  return {
    id: y.id,
    tur: y.tur,
    baslik: c.baslik,
    ozet: c.ozet ?? null,
    url: `${yollar[b.dil].yayinlar}/${c.slug}`,
    tarih,
    yil: yilBul(tarih),
    yazarlar: yazarlar(b, y.id),
    alanlar: alanBaglantilari(b, b.t.yayin_calisma_alani.filter((x) => x.yayin_id === y.id).map((x) => x.calisma_alani_id)),
    etiketler: etiketOzetleri(b, b.t.yayin_etiket.filter((x) => x.yayin_id === y.id).map((x) => x.etiket_id)),
  };
}

// Bu dilde gorunen butun yayinlar, yeniden eskiye.
function gorunenYayinlar(b: Baglam): { y: Yayin; c: YayinCeviri }[] {
  return b.t.yayin
    .filter((y) => yayinGorunurMu(y, b.simdi))
    .map((y) => ({ y, c: yayinCevirisi(b, y.id) }))
    .filter((x): x is { y: Yayin; c: YayinCeviri } => x.c !== undefined)
    .sort((p, q) => new Date(q.y.yayin_tarihi!).getTime() - new Date(p.y.yayin_tarihi!).getTime());
}

function yayinOzetleri(b: Baglam, suzgec: (y: Yayin) => boolean = () => true): YayinOzet[] {
  return gorunenYayinlar(b)
    .filter((x) => suzgec(x.y))
    .map((x) => yayinOzeti(b, x.y, x.c));
}

// --- karar ---

function mahkemeBilgisi(b: Baglam, mahkemeId: number): { ad: string; ust: { id: number; ad: string } } {
  const m = b.t.mahkeme.find((x) => x.id === mahkemeId)!;
  const ust = m.ust_mahkeme_id != null ? b.t.mahkeme.find((x) => x.id === m.ust_mahkeme_id) : undefined;
  return ust
    ? { ad: `${ust.ad} ${m.ad}`, ust: { id: ust.id, ad: ust.ad } }
    : { ad: m.ad, ust: { id: m.id, ad: m.ad } };
}

function mevzuatBaglari(b: Baglam, kararId: number): MevzuatBagi[] {
  return b.t.karar_mevzuat
    .filter((km) => km.karar_id === kararId)
    .map((km) => {
      const m = b.t.mevzuat.find((x) => x.id === km.mevzuat_id)!;
      const kisa = m.kisa_ad ?? m.ad;
      return {
        mevzuatId: m.id,
        ad: m.ad,
        kisaAd: m.kisa_ad ?? null,
        madde: km.madde ?? null,
        etiket: km.madde ? `${kisa} m. ${km.madde}` : kisa,
      };
    });
}

function kararOzeti(b: Baglam, k: Karar): KararOzet {
  const mahkeme = mahkemeBilgisi(b, k.mahkeme_id);
  return {
    id: k.id,
    slug: k.slug,
    url: `${yollar.tr.kararlar}/${k.slug}`,
    konu: k.konu,
    ozet: k.ozet ?? null,
    mahkemeAdi: mahkeme.ad,
    ustMahkeme: mahkeme.ust,
    esasNo: k.esas_no ?? null,
    kararNo: k.karar_no ?? null,
    tarih: k.karar_tarihi,
    yil: yilBul(k.karar_tarihi),
    alanlar: alanBaglantilari(b, b.t.karar_calisma_alani.filter((x) => x.karar_id === k.id).map((x) => x.calisma_alani_id)),
    mevzuat: mevzuatBaglari(b, k.id),
  };
}

// Karar tarihine gore yeniden eskiye.
function gorunenKararlar(b: Baglam): Karar[] {
  return b.t.karar
    .filter((k) => kararGorunurMu(k, b.simdi))
    .sort((x, y) => y.karar_tarihi.localeCompare(x.karar_tarihi));
}

// ---------------------------------------------------------------------------
// Disariya acik fonksiyonlar (sayfalar bunlari cagirir)
// ---------------------------------------------------------------------------

export async function siteAyariGetir(dil: Dil, secenek?: Secenek): Promise<SiteAyari> {
  const b = await baglamKur(dil, secenek);
  const ayar = b.t.site_ayar[0];
  const c = b.t.site_ayar_ceviri.find((x) => x.dil === dil);
  const barolar = [...new Set(b.t.kisi.filter((k) => k.aktif && k.avukat_mi && k.baro_adi).map((k) => k.baro_adi!))];
  return {
    resmiUnvan: ayar.resmi_unvan,
    telefon: ayar.telefon ?? null,
    eposta: ayar.eposta ?? null,
    haritaUrl: ayar.harita_url ?? null,
    aydinlatmaSurumu: ayar.aydinlatma_surumu ?? null,
    adres: c?.adres ?? null,
    altBilgiNotu: c?.alt_bilgi_notu ?? null,
    barolar: barolar.sort(turkceKarsilastir),
  };
}

// Ekip listesi: aktif kisiler, ekip sirasiyla. Profil baglantisi bu dilde profil varsa doludur.
export async function ekibiGetir(dil: Dil, secenek?: Secenek): Promise<KisiOzet[]> {
  const b = await baglamKur(dil, secenek);
  return b.t.kisi
    .filter((k) => k.aktif)
    .sort(ekipSirasi(b))
    .map((k) => kisiOzeti(b, k));
}

// Bu dilde profil sayfasi uretilecek kisiler (getStaticPaths icin).
export async function kisiDetaylariGetir(dil: Dil, secenek?: Secenek): Promise<KisiDetay[]> {
  const b = await baglamKur(dil, secenek);
  return b.t.kisi
    .filter((k) => kisiProfilVarMi(b, k, dil))
    .sort(ekipSirasi(b))
    .map((k): KisiDetay => {
      const c = b.t.kisi_ceviri.find((x) => x.kisi_id === k.id && x.dil === dil);
      const egitim = b.t.egitim
        .filter((e) => e.kisi_id === k.id)
        .sort((x, y) => x.sira - y.sira)
        .flatMap((e) => {
          const ec = b.t.egitim_ceviri.find((x) => x.egitim_id === e.id && x.dil === dil);
          return ec
            ? [{ okul: ec.okul_adi, bolum: ec.bolum_adi ?? null, derece: ec.derece ?? null, baslangicYili: e.baslangic_yili ?? null, bitisYili: e.bitis_yili ?? null }]
            : [];
        });
      const deneyim = b.t.deneyim
        .filter((d) => d.kisi_id === k.id)
        .sort((x, y) => x.sira - y.sira)
        .flatMap((d) => {
          const dc = b.t.deneyim_ceviri.find((x) => x.deneyim_id === d.id && x.dil === dil);
          return dc
            ? [{ kurum: d.firma_adi, pozisyon: dc.pozisyon, aciklama: dc.aciklama ?? null, baslangicYili: d.baslangic_yili ?? null, bitisYili: d.bitis_yili ?? null }]
            : [];
        });
      const ozet = kisiOzeti(b, k);
      return {
        ...ozet,
        url: ozet.url!,
        karsilik: kisiUrl(b, k, digerDilinde(dil)),
        aciklama: aciklamaSec(c?.seo_aciklama, c?.kisa_biyografi, `${ozet.tamAd}${ozet.unvan ? `, ${ozet.unvan}` : ''}`),
        seoBaslik: c?.seo_baslik ?? null,
        biyografi: htmlTemizle(c?.biyografi),
        alanlar: alanBaglantilari(b, b.t.kisi_calisma_alani.filter((x) => x.kisi_id === k.id).map((x) => x.calisma_alani_id)),
        egitim,
        deneyim,
        // KVKK: yalnizca sitede gosterilmesi isaretli numaralar (kisisel cep varsayilan gizli).
        telefonlar: b.t.kisi_telefon
          .filter((x) => x.kisi_id === k.id && x.sitede_goster)
          .sort((x, y) => x.sira - y.sira)
          .map((x) => ({ tur: x.tur, numara: x.numara })),
        yabanciDiller: b.t.kisi_yabanci_dil
          .filter((x) => x.kisi_id === k.id)
          .sort((x, y) => x.sira - y.sira)
          .map((x) => x.dil_kodu),
        meslegeBaslamaYili: k.meslege_baslama_yili ?? null,
        baroAdi: k.avukat_mi ? (k.baro_adi ?? null) : null,
        avukat: k.avukat_mi,
        arabulucu: k.arabulucu_mu,
        yayinlar: yayinOzetleri(b, (y) => b.t.yayin_yazar.some((yy) => yy.yayin_id === y.id && yy.kisi_id === k.id)),
      };
    });
}

// Iki seviyeli agac: ust alanlar ve altlari, siralama alanina gore.
export async function calismaAlanlariGetir(dil: Dil, secenek?: Secenek): Promise<AlanOzet[]> {
  const b = await baglamKur(dil, secenek);
  return b.t.calisma_alani
    .filter((a) => a.ust_alan_id == null)
    .sort((x, y) => x.siralama - y.siralama)
    .map((a) => alanOzeti(b, a))
    .filter((a): a is AlanOzet => a !== null);
}

// Bu dilde sayfasi uretilecek butun alanlar (ust ve alt).
export async function calismaAlaniDetaylariGetir(dil: Dil, secenek?: Secenek): Promise<AlanDetay[]> {
  const b = await baglamKur(dil, secenek);
  const sirali = [...b.t.calisma_alani].sort((x, y) => x.siralama - y.siralama);
  return sirali.flatMap((a): AlanDetay[] => {
    const ozet = alanOzeti(b, a);
    if (!ozet) return [];
    const c = alanCevirisi(b, a.id)!;
    const ust = a.ust_alan_id != null ? alanBaglantilari(b, [a.ust_alan_id])[0] ?? null : null;
    const kapsam = alanVeAltlari(b, a.id);
    const kisiIdleri = new Set(b.t.kisi_calisma_alani.filter((x) => kapsam.includes(x.calisma_alani_id)).map((x) => x.kisi_id));
    const yayinIdleri = new Set(b.t.yayin_calisma_alani.filter((x) => kapsam.includes(x.calisma_alani_id)).map((x) => x.yayin_id));
    return [{
      ...ozet,
      karsilik: alanUrl(b, a.id, digerDilinde(dil)),
      aciklama: aciklamaSec(c.seo_aciklama, c.ozet, c.icerik, c.ad),
      seoBaslik: c.seo_baslik ?? null,
      icerik: htmlTemizle(c.icerik),
      ust,
      kisiler: b.t.kisi.filter((k) => k.aktif && kisiIdleri.has(k.id)).sort(ekipSirasi(b)).map((k) => kisiOzeti(b, k)),
      yayinlar: yayinOzetleri(b, (y) => yayinIdleri.has(y.id)),
    }];
  });
}

// Bu dilde gorunen yayinlar, yeniden eskiye (liste ve filtreler icin).
export async function yayinlariGetir(dil: Dil, secenek?: Secenek): Promise<YayinOzet[]> {
  const b = await baglamKur(dil, secenek);
  return yayinOzetleri(b);
}

export async function yayinDetaylariGetir(dil: Dil, secenek?: Secenek): Promise<YayinDetay[]> {
  const b = await baglamKur(dil, secenek);
  return gorunenYayinlar(b).map(({ y, c }): YayinDetay => {
    const kararIdleri = new Set(b.t.yayin_karar.filter((x) => x.yayin_id === y.id).map((x) => x.karar_id));
    return {
      ...yayinOzeti(b, y, c),
      karsilik: yayinUrl(b, y.id, digerDilinde(dil)),
      aciklama: aciklamaSec(c.seo_aciklama, c.ozet, c.icerik, c.baslik),
      seoBaslik: c.seo_baslik ?? null,
      icerik: htmlTemizle(c.icerik),
      kitap: y.tur === 'kitap'
        ? { yayinevi: y.yayinevi ?? null, isbn: y.isbn ?? null, basimYili: y.basim_yili ?? null, sayfaSayisi: y.sayfa_sayisi ?? null }
        : null,
      videoUrl: y.tur === 'video' ? (y.video_url ?? null) : null,
      kaynak: y.tur === 'haber' ? { ad: y.kaynak_adi ?? null, url: y.kaynak_url ?? null } : null,
      dosyalar: b.t.yayin_dosya
        .filter((x) => x.yayin_id === y.id)
        .sort((p, q) => p.sira - q.sira)
        .map((x) => dosyaBul(b.t, x.dosya))
        .filter((d): d is Dosya => d !== null),
      // Kararlar yalnizca Turkce; EN yayin sayfasinda karar baglantisi verilmez.
      kararlar: dil === 'tr' ? gorunenKararlar(b).filter((k) => kararIdleri.has(k.id)).map((k) => kararOzeti(b, k)) : [],
    };
  });
}

// Kararlar yalnizca Turkce oldugu icin dil parametresi yok.
export async function kararlariGetir(secenek?: Secenek): Promise<KararOzet[]> {
  const b = await baglamKur('tr', secenek);
  return gorunenKararlar(b).map((k) => kararOzeti(b, k));
}

export async function kararDetaylariGetir(secenek?: Secenek): Promise<KararDetay[]> {
  const b = await baglamKur('tr', secenek);
  return gorunenKararlar(b).map((k): KararDetay => {
    const yayinIdleri = new Set(b.t.yayin_karar.filter((x) => x.karar_id === k.id).map((x) => x.yayin_id));
    return {
      ...kararOzeti(b, k),
      aciklama: aciklamaSec(k.ozet, k.konu),
      tamMetin: htmlTemizle(k.tam_metin),
      dosya: dosyaBul(b.t, k.tam_metin_dosyasi),
      etiketler: etiketOzetleri(b, b.t.karar_etiket.filter((x) => x.karar_id === k.id).map((x) => x.etiket_id)),
      yayinlar: yayinOzetleri(b, (y) => yayinIdleri.has(y.id)),
    };
  });
}

function sayfaIcerigi(b: Baglam, sayfaId: number, dil: Dil): SayfaIcerik | undefined {
  const s = b.t.sayfa.find((x) => x.id === sayfaId);
  const c = b.t.sayfa_ceviri.find((x) => x.sayfa_id === sayfaId && x.dil === dil);
  if (!s?.aktif || !c) return undefined;
  const karsi = b.t.sayfa_ceviri.find((x) => x.sayfa_id === sayfaId && x.dil === digerDilinde(dil));
  return {
    anahtar: s.anahtar,
    baslik: c.baslik,
    icerik: htmlTemizle(c.icerik),
    aciklama: aciklamaSec(c.seo_aciklama, c.icerik, c.baslik),
    seoBaslik: c.seo_baslik ?? null,
    url: sayfaYolu(c.slug, dil),
    karsilik: karsi ? sayfaYolu(karsi.slug, digerDilinde(dil)) : null,
  };
}

// Sabit sayfa (sayfa tablosu) anahtariyla: 'hakkimizda', 'iletisim' ...
export async function sayfaGetir(anahtar: string, dil: Dil, secenek?: Secenek): Promise<SayfaIcerik | undefined> {
  const b = await baglamKur(dil, secenek);
  const s = b.t.sayfa.find((x) => x.anahtar === anahtar);
  return s ? sayfaIcerigi(b, s.id, dil) : undefined;
}

// Bu dilde aktif ve cevirisi olan butun sabit sayfalar, siralama alanina gore.
export async function sayfalariGetir(dil: Dil, secenek?: Secenek): Promise<SayfaIcerik[]> {
  const b = await baglamKur(dil, secenek);
  return [...b.t.sayfa]
    .sort((x, y) => x.siralama - y.siralama)
    .map((s) => sayfaIcerigi(b, s.id, dil))
    .filter((s): s is SayfaIcerik => s !== undefined);
}
