// Veritabani satirlarinin tipleri. Tablo ve sutun adlari db/schema.sql ile birebir aynidir;
// boylece mock'tan PostgreSQL'e geciste yalnizca verinin nereden yuklendigi degisir.
//
// Yalnizca sitenin okudugu sutunlar ve sema kurallarinin dayandigi sutunlar var
// (olusturan, guncelleme_zamani gibi panel sutunlari yok). Canlida SELECT bu listeyle yazilir.
//
// Tip esleme: integer/smallint -> number, boolean -> boolean, text -> string,
// timestamptz -> ISO metin ('2026-09-15T09:00:00+03:00'), date -> 'YYYY-AA-GG', uuid -> string.
// NULL olabilen sutunlar "?:" ile isaretli; mock'ta yazilmayan sutun NULL demektir.

export interface DilSatiri {
  kod: string;
  ad: string;
  varsayilan: boolean;
  aktif: boolean;
  siralama: number;
}

// Directus'un dosya tablosu; db/test/directus_taslak.sql'deki sutunlar.
export interface DirectusDosya {
  id: string;
  storage: string;
  filename_disk?: string | null;
  filename_download: string;
  type?: string | null;
}

export interface CalismaAlani {
  id: number;
  ust_alan_id?: number | null;
  siralama: number;
  gorunur: boolean;
}

export interface CalismaAlaniCeviri {
  id: number;
  calisma_alani_id: number;
  dil: string;
  slug: string;
  ad: string;
  ozet?: string | null;
  icerik?: string | null;
  seo_baslik?: string | null;
  seo_aciklama?: string | null;
}

export interface Unvan {
  id: number;
  kod: string;
  sira: number;
}

export interface UnvanCeviri {
  id: number;
  unvan_id: number;
  dil: string;
  ad: string;
}

export interface Kisi {
  id: number;
  slug: string;
  ad: string;
  soyad: string;
  unvan_id?: number | null;
  foto?: string | null;
  eposta?: string | null;
  avukat_mi: boolean;
  arabulucu_mu: boolean;
  baro_adi?: string | null;
  baro_sicil_no?: string | null;
  arabulucu_sicil_no?: string | null;
  meslege_baslama_yili?: number | null;
  linkedin_url?: string | null;
  aktif: boolean;
  siralama: number;
}

export interface KisiCeviri {
  id: number;
  kisi_id: number;
  dil: string;
  kisa_biyografi?: string | null;
  biyografi?: string | null;
  seo_baslik?: string | null;
  seo_aciklama?: string | null;
}

export interface KisiTelefon {
  id: number;
  kisi_id: number;
  tur: 'dahili' | 'cep' | 'sabit';
  numara: string;
  sitede_goster: boolean;
  sira: number;
}

export interface KisiYabanciDil {
  id: number;
  kisi_id: number;
  dil_kodu: string;
  sira: number;
}

export interface KisiCalismaAlani {
  id: number;
  kisi_id: number;
  calisma_alani_id: number;
}

export interface Egitim {
  id: number;
  kisi_id: number;
  baslangic_yili?: number | null;
  bitis_yili?: number | null;
  sira: number;
}

export interface EgitimCeviri {
  id: number;
  egitim_id: number;
  dil: string;
  okul_adi: string;
  bolum_adi?: string | null;
  derece?: string | null;
}

export interface Deneyim {
  id: number;
  kisi_id: number;
  firma_adi: string;
  baslangic_yili?: number | null;
  bitis_yili?: number | null;
  sira: number;
}

export interface DeneyimCeviri {
  id: number;
  deneyim_id: number;
  dil: string;
  pozisyon: string;
  aciklama?: string | null;
}

export interface Etiket {
  id: number;
}

export interface EtiketCeviri {
  id: number;
  etiket_id: number;
  dil: string;
  slug: string;
  ad: string;
}

export type YayinTuru = 'makale' | 'kitap' | 'video' | 'haber' | 'duyuru';
export type YayinDurumu = 'taslak' | 'incelemede' | 'yayinda' | 'arsiv';

export interface Yayin {
  id: number;
  tur: YayinTuru;
  durum: YayinDurumu;
  yayin_tarihi?: string | null;
  kapak?: string | null;
  yayinevi?: string | null;
  isbn?: string | null;
  basim_yili?: number | null;
  sayfa_sayisi?: number | null;
  video_url?: string | null;
  video_dosyasi?: string | null;
  kaynak_adi?: string | null;
  kaynak_url?: string | null;
  onay_zamani?: string | null;
}

export interface YayinCeviri {
  id: number;
  yayin_id: number;
  dil: string;
  hazir: boolean;
  slug: string;
  baslik: string;
  ozet?: string | null;
  icerik?: string | null;
  seo_baslik?: string | null;
  seo_aciklama?: string | null;
}

export interface YayinYazar {
  id: number;
  yayin_id: number;
  kisi_id?: number | null;
  dis_yazar_adi?: string | null;
  dis_yazar_unvan?: string | null;
  sira: number;
}

export interface YayinCalismaAlani {
  id: number;
  yayin_id: number;
  calisma_alani_id: number;
}

export interface YayinEtiket {
  id: number;
  yayin_id: number;
  etiket_id: number;
}

export interface YayinDosya {
  id: number;
  yayin_id: number;
  dosya: string;
  sira: number;
}

export type MahkemeTuru =
  | 'aym' | 'yargitay' | 'danistay' | 'bam' | 'bim' | 'ilk_derece_adli'
  | 'ilk_derece_idari' | 'uyusmazlik' | 'aihm' | 'diger';

export interface Mahkeme {
  id: number;
  ust_mahkeme_id?: number | null;
  tur: MahkemeTuru;
  ad: string;
  kisa_ad?: string | null;
  siralama: number;
  aktif: boolean;
}

export type MevzuatTuru = 'kanun' | 'khk' | 'cbk' | 'tuzuk' | 'yonetmelik' | 'teblig' | 'uluslararasi' | 'diger';

export interface Mevzuat {
  id: number;
  tur: MevzuatTuru;
  numara?: string | null;
  ad: string;
  kisa_ad?: string | null;
  mevzuat_url?: string | null;
}

export interface Karar {
  id: number;
  mahkeme_id: number;
  esas_no?: string | null;
  karar_no?: string | null;
  karar_tarihi: string;
  slug: string;
  konu: string;
  ozet?: string | null;
  tam_metin?: string | null;
  tam_metin_dosyasi?: string | null;
  ofis_davasi: boolean;
  anonimlestirildi: boolean;
  anonimlestirme_zamani?: string | null;
  durum: YayinDurumu;
  yayin_tarihi?: string | null;
  onay_zamani?: string | null;
}

export interface KararMevzuat {
  id: number;
  karar_id: number;
  mevzuat_id: number;
  madde?: string | null;
}

export interface KararEtiket {
  id: number;
  karar_id: number;
  etiket_id: number;
}

export interface KararCalismaAlani {
  id: number;
  karar_id: number;
  calisma_alani_id: number;
}

export interface YayinKarar {
  id: number;
  yayin_id: number;
  karar_id: number;
}

export interface Sayfa {
  id: number;
  anahtar: string;
  aktif: boolean;
  siralama: number;
}

export interface SayfaCeviri {
  id: number;
  sayfa_id: number;
  dil: string;
  slug?: string | null;
  baslik: string;
  icerik?: string | null;
  seo_baslik?: string | null;
  seo_aciklama?: string | null;
}

export interface SiteAyar {
  id: 1;
  resmi_unvan: string;
  telefon?: string | null;
  faks?: string | null;
  eposta?: string | null;
  // Iletisim formu bildirimi buraya gider (bossa eposta). Site okumaz, yalnizca panel ve form akisi.
  form_bildirim_eposta?: string | null;
  whatsapp_numarasi?: string | null;
  linkedin_url?: string | null;
  harita_url?: string | null;
  aydinlatma_surumu?: string | null;
}

export interface SiteAyarCeviri {
  id: number;
  site_ayar_id: number;
  dil: string;
  adres?: string | null;
  alt_bilgi_notu?: string | null;
}

// Sitenin okudugu butun tablolar. Canlida her biri tek bir SELECT ile doldurulur.
export interface Tablolar {
  dil: DilSatiri[];
  directus_files: DirectusDosya[];
  calisma_alani: CalismaAlani[];
  calisma_alani_ceviri: CalismaAlaniCeviri[];
  unvan: Unvan[];
  unvan_ceviri: UnvanCeviri[];
  kisi: Kisi[];
  kisi_ceviri: KisiCeviri[];
  kisi_telefon: KisiTelefon[];
  kisi_yabanci_dil: KisiYabanciDil[];
  kisi_calisma_alani: KisiCalismaAlani[];
  egitim: Egitim[];
  egitim_ceviri: EgitimCeviri[];
  deneyim: Deneyim[];
  deneyim_ceviri: DeneyimCeviri[];
  etiket: Etiket[];
  etiket_ceviri: EtiketCeviri[];
  yayin: Yayin[];
  yayin_ceviri: YayinCeviri[];
  yayin_yazar: YayinYazar[];
  yayin_calisma_alani: YayinCalismaAlani[];
  yayin_etiket: YayinEtiket[];
  yayin_dosya: YayinDosya[];
  mahkeme: Mahkeme[];
  mevzuat: Mevzuat[];
  karar: Karar[];
  karar_mevzuat: KararMevzuat[];
  karar_etiket: KararEtiket[];
  karar_calisma_alani: KararCalismaAlani[];
  yayin_karar: YayinKarar[];
  sayfa: Sayfa[];
  sayfa_ceviri: SayfaCeviri[];
  site_ayar: SiteAyar[];
  site_ayar_ceviri: SiteAyarCeviri[];
}
