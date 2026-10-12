// Panelde menude gorunen koleksiyonlar ve klasorler.
//
// Lisans: Directus 12 lisanssiz katmani en fazla 25 YAPILANDIRILMIS koleksiyona izin verir
// (directus_collections satiri olan). Bu yuzden yalnizca editorun dogrudan actigi ana tablolar
// burada; ceviri (*_ceviri) ve ara tablolar (kisi_calisma_alani ...) meta almaz, sayilmaz ve
// ana kaydin formundaki ceviri / iliski alanlarinin icinden duzenlenir (denendi: calisiyor).
// Klasorler (schema: null) sayilmaz.
//
// Sira = uygulama sirasi: lisans siniri dolarsa listenin sonundakiler "lisans bekliyor" kalir.
//
// Alanlar (Directus collection meta disinda, bu dosyaya ozel):
//   tr: [tekil, cogul]          liste: liste gorunumunun varsayilan sutunlari
//   listeSira: varsayilan sira  ceviriSablonu: ceviri alaninin listede gosterdigi metin
// Ad ceviri tablosunda olan kayitlarda (alan, etiket, yayin) sablon "{{ceviriler.ad}}" gibi ceviriden
// okur; Directus tum dilleri yan yana yazar (ornek: "Imar Hukuku, Zoning Law").

export const KLASORLER = [
  { collection: 'klasor_ekip', icon: 'groups', sort: 1, tr: 'Ekip' },
  { collection: 'klasor_icerik', icon: 'article', sort: 2, tr: 'İçerik' },
  { collection: 'klasor_kararlar', icon: 'gavel', sort: 3, tr: 'Kararlar' },
  { collection: 'klasor_gelen', icon: 'inbox', sort: 4, tr: 'Gelen kutusu' },
  { collection: 'klasor_site', icon: 'settings_applications', sort: 5, tr: 'Site' },
];

export const KOLEKSIYONLAR = [
  {
    collection: 'kisi', group: 'klasor_ekip', icon: 'person', sort: 1, tr: ['Kişi', 'Kişiler'],
    display_template: '{{ad}} {{soyad}}', sort_field: 'siralama',
    liste: ['ad', 'soyad', 'unvan_id', 'aktif', 'siralama'], listeSira: ['siralama'], ceviriSablonu: '{{kisa_biyografi}}',
    note: 'Ekip üyeleri. Ayrılan kişi silinmez; "Aktif" kapatılır.',
  },
  {
    collection: 'unvan', group: 'klasor_ekip', icon: 'badge', sort: 2, tr: ['Unvan', 'Unvanlar'],
    display_template: '{{ceviriler.ad}}', liste: ['kod', 'ceviriler', 'sira'], listeSira: ['sira'], ceviriSablonu: '{{ad}}',
    note: 'Ekip sayfasındaki sıra "Sıra" alanıyla belirlenir.',
  },
  {
    collection: 'yayin', group: 'klasor_icerik', icon: 'menu_book', sort: 1, tr: ['Yayın', 'Yayınlar'],
    display_template: '{{ceviriler.baslik}}', liste: ['ceviriler', 'tur', 'durum', 'yayin_tarihi'], listeSira: ['-yayin_tarihi'],
    ceviriSablonu: '{{baslik}}', archive_field: 'durum', archive_value: 'arsiv', unarchive_value: 'taslak',
    note: 'Makale, kitap, video, haber, duyuru. Türkçe çeviri olmadan yayına alınamaz.',
  },
  {
    collection: 'calisma_alani', group: 'klasor_icerik', icon: 'account_tree', sort: 2, tr: ['Çalışma alanı', 'Çalışma alanları'],
    display_template: '{{ceviriler.ad}}', sort_field: 'siralama', liste: ['ceviriler', 'ust_alan_id', 'gorunur'], ceviriSablonu: '{{ad}}',
    note: 'İki seviyeli ağaç. Kullanımdaki alan silinmez; "Görünür" kapatılır.',
  },
  {
    collection: 'etiket', group: 'klasor_icerik', icon: 'sell', sort: 3, tr: ['Etiket', 'Etiketler'],
    display_template: '{{ceviriler.ad}}', liste: ['ceviriler'], ceviriSablonu: '{{ad}}',
  },
  {
    collection: 'sayfa', group: 'klasor_icerik', icon: 'description', sort: 4, tr: ['Sabit sayfa', 'Sabit sayfalar'],
    display_template: '{{ceviriler.baslik}}', sort_field: 'siralama', liste: ['ceviriler', 'anahtar', 'aktif'], ceviriSablonu: '{{baslik}}',
    note: 'Ana sayfa, hakkımızda, arabuluculuk, iletişim ve yasal sayfalar.',
  },
  {
    collection: 'karar', group: 'klasor_kararlar', icon: 'gavel', sort: 1, tr: ['Karar', 'Kararlar'],
    display_template: '{{konu}}', liste: ['konu', 'mahkeme_id', 'karar_tarihi', 'durum', 'anonimlestirildi'], listeSira: ['-karar_tarihi'],
    archive_field: 'durum', archive_value: 'arsiv', unarchive_value: 'taslak',
    note: 'Yalnızca Türkçe. Anonimleştirildi işaretlenmeden yayına alınamaz.',
  },
  {
    collection: 'mahkeme', group: 'klasor_kararlar', icon: 'account_balance', sort: 2, tr: ['Mahkeme', 'Mahkemeler'],
    display_template: '{{ad}}', sort_field: 'siralama', liste: ['ad', 'kisa_ad', 'ust_mahkeme_id', 'tur', 'aktif'],
    note: 'Mahkeme > daire, iki seviye.',
  },
  {
    collection: 'mevzuat', group: 'klasor_kararlar', icon: 'balance', sort: 3, tr: ['Mevzuat', 'Mevzuat'],
    display_template: '{{kisa_ad}} {{ad}}', liste: ['kisa_ad', 'ad', 'tur', 'numara'],
  },
  {
    // KVKK: degisiklik kaydi kapali; acik kalirsa mesajin kopyasi directus_revisions'da kalir ve
    // saklama suresi dolunca silinmez (db/VERI_MODELI.md bolum 6.4).
    collection: 'iletisim_mesaji', group: 'klasor_gelen', icon: 'mail', sort: 1, tr: ['İletişim mesajı', 'İletişim mesajları'],
    display_template: '{{ad}} · {{konu_turu}}', accountability: null,
    liste: ['olusturma_zamani', 'ad', 'konu_turu', 'durum', 'saklama_bitis'], listeSira: ['-olusturma_zamani'],
    note: 'Saklama süresi dolan mesajlar otomatik silinir.',
  },
  {
    collection: 'site_ayar', group: 'klasor_site', icon: 'tune', sort: 1, tr: ['Site ayarları', 'Site ayarları'],
    singleton: true, ceviriSablonu: '{{adres}}', note: 'Büro unvanı, iletişim bilgileri, adres ve alt bilgi notu.',
  },
  {
    collection: 'dil', group: 'klasor_site', icon: 'translate', sort: 2, tr: ['Dil', 'Diller'],
    display_template: '{{ad}}', liste: ['kod', 'ad', 'varsayilan', 'aktif'], note: 'Sitenin dilleri. Varsayılan dil (Türkçe) değiştirilmemeli.',
  },
  {
    collection: 'yonlendirme', group: 'klasor_site', icon: 'alt_route', sort: 3, tr: ['Yönlendirme', 'Yönlendirmeler'],
    display_template: '{{kaynak_yol}} → {{hedef}}', liste: ['kaynak_yol', 'hedef', 'durum_kodu'],
    note: 'Adres değişince eski bağlantılar kırılmasın diye.',
  },
  {
    collection: 'derleme_isi', group: 'klasor_site', icon: 'publish', sort: 4, tr: ['Yayımlama işi', 'Yayımlama işleri'],
    display_template: '{{durum}} · {{olusturma_zamani}}', liste: ['olusturma_zamani', 'durum', 'isteyen', 'bitis_zamani'],
    listeSira: ['-olusturma_zamani'], note: '"Yayımla" ile kuyruğa eklenen site derlemeleri.',
  },
];

// Meta almayan (sayilmayan) tablolar: alanlari yine yapilandirilir.
export const META_ALMAYANLAR = [
  'calisma_alani_ceviri', 'unvan_ceviri', 'kisi_ceviri', 'kisi_telefon', 'kisi_yabanci_dil', 'kisi_calisma_alani',
  'egitim', 'egitim_ceviri', 'deneyim', 'deneyim_ceviri', 'etiket_ceviri', 'yayin_ceviri', 'yayin_yazar',
  'yayin_calisma_alani', 'yayin_etiket', 'yayin_dosya', 'karar_mevzuat', 'karar_etiket', 'karar_calisma_alani',
  'yayin_karar', 'sayfa_ceviri', 'site_ayar_ceviri',
];

// Ceviri alani ana tablosu yapilandirilmamis olanlar (egitim, deneyim) icin listede gosterilecek metin.
export const CEVIRI_SABLONLARI = {
  egitim: '{{okul_adi}}',
  deneyim: '{{pozisyon}}',
  ...Object.fromEntries(KOLEKSIYONLAR.filter((k) => k.ceviriSablonu).map((k) => [k.collection, k.ceviriSablonu])),
};
