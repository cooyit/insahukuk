// Formlarda gorunen iliski alanlari (veritabaninda sutunu olmayan "alias" alanlar) ve iliski
// ayarlari. Yabanci anahtarlar veritabaninda zaten var (db/schema.sql); Directus onlari okur,
// burada yalnizca panelde nasil gorunecekleri ve kaldirma davranislari tanimlanir.
//
// one_deselect_action:
//   'delete'  : formdan kaldirilan satir silinir. Ceviri ve "sahibine ait" satirlarda zorunlu:
//               baglanti kolonu NOT NULL oldugu icin Directus bagi koparmaya calisirsa hata verir
//               (db/VERI_MODELI.md bolum 6.1, denendi).
//   'nullify' : bag kopar, kayit kalir (alt alan ust alani kaybedince kok olur).

// Ceviri sekmeleri: X -> X_ceviri (X_id, dil). Dil listesi `dil` tablosundan.
export const CEVIRILER = [
  'calisma_alani', 'unvan', 'kisi', 'egitim', 'deneyim', 'etiket', 'yayin', 'sayfa', 'site_ayar',
];

// Bire-cok: ana kayitta liste. sira: elle siralama alani (surukle-birak).
export const BIRE_COK = [
  { ana: 'kisi', alan: 'telefonlar', tablo: 'kisi_telefon', fk: 'kisi_id', sira: 'sira', silme: 'delete', sablon: '{{tur}}: {{numara}}', tr: 'Telefonlar' },
  { ana: 'kisi', alan: 'yabanci_diller', tablo: 'kisi_yabanci_dil', fk: 'kisi_id', sira: 'sira', silme: 'delete', sablon: '{{dil_kodu}}', tr: 'Yabancı diller' },
  { ana: 'kisi', alan: 'egitimler', tablo: 'egitim', fk: 'kisi_id', sira: 'sira', silme: 'delete', sablon: '{{ceviriler.okul_adi}} ({{baslangic_yili}}–{{bitis_yili}})', tr: 'Eğitim' },
  { ana: 'kisi', alan: 'deneyimler', tablo: 'deneyim', fk: 'kisi_id', sira: 'sira', silme: 'delete', sablon: '{{firma_adi}} ({{baslangic_yili}}–{{bitis_yili}})', tr: 'Deneyim' },
  { ana: 'calisma_alani', alan: 'alt_alanlar', tablo: 'calisma_alani', fk: 'ust_alan_id', sira: 'siralama', silme: 'nullify', sablon: '{{ceviriler.ad}}', tr: 'Alt alanlar' },
  { ana: 'mahkeme', alan: 'daireler', tablo: 'mahkeme', fk: 'ust_mahkeme_id', sira: 'siralama', silme: 'nullify', sablon: '{{ad}}', tr: 'Daireler' },
  { ana: 'yayin', alan: 'yazarlar', tablo: 'yayin_yazar', fk: 'yayin_id', sira: 'sira', silme: 'delete', sablon: '{{kisi_id.ad}} {{kisi_id.soyad}}{{dis_yazar_adi}}', tr: 'Yazarlar' },
  { ana: 'karar', alan: 'mevzuat_baglari', tablo: 'karar_mevzuat', fk: 'karar_id', silme: 'delete', sablon: '{{mevzuat_id.kisa_ad}} m. {{madde}}', tr: 'İlgili mevzuat' },
];

// Coka-cok: ara tablo uzerinden. hedefSablon: secilen kaydin listede nasil gorunecegi.
export const COKA_COK = [
  { ana: 'kisi', alan: 'calisma_alanlari', ara: 'kisi_calisma_alani', anaFk: 'kisi_id', hedefFk: 'calisma_alani_id', hedefSablon: '{{calisma_alani_id.ceviriler.ad}}', tr: 'Çalışma alanları' },
  { ana: 'yayin', alan: 'calisma_alanlari', ara: 'yayin_calisma_alani', anaFk: 'yayin_id', hedefFk: 'calisma_alani_id', hedefSablon: '{{calisma_alani_id.ceviriler.ad}}', tr: 'Çalışma alanları' },
  { ana: 'yayin', alan: 'etiketler', ara: 'yayin_etiket', anaFk: 'yayin_id', hedefFk: 'etiket_id', hedefSablon: '{{etiket_id.ceviriler.ad}}', tr: 'Etiketler' },
  { ana: 'yayin', alan: 'dosyalar', ara: 'yayin_dosya', anaFk: 'yayin_id', hedefFk: 'dosya', sira: 'sira', dosya: true, tr: 'Ekler (PDF vb.)' },
  { ana: 'yayin', alan: 'kararlar', ara: 'yayin_karar', anaFk: 'yayin_id', hedefFk: 'karar_id', hedefSablon: '{{karar_id.konu}}', tr: 'İlgili kararlar' },
  { ana: 'karar', alan: 'yayinlar', ara: 'yayin_karar', anaFk: 'karar_id', hedefFk: 'yayin_id', hedefSablon: '{{yayin_id.ceviriler.baslik}}', tr: 'İlgili yayınlar' },
  { ana: 'karar', alan: 'etiketler', ara: 'karar_etiket', anaFk: 'karar_id', hedefFk: 'etiket_id', hedefSablon: '{{etiket_id.ceviriler.ad}}', tr: 'Etiketler' },
  { ana: 'karar', alan: 'calisma_alanlari', ara: 'karar_calisma_alani', anaFk: 'karar_id', hedefFk: 'calisma_alani_id', hedefSablon: '{{calisma_alani_id.ceviriler.ad}}', tr: 'Çalışma alanları' },
];
