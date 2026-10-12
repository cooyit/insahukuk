// Alan ayarlari: Turkce etiket, arayuz, dogrulama, gizli/salt okunur.
// Once kurallarla varsayilan uretilir (alanMeta), sonra OZEL ile alan bazinda ustune yazilir.
// Dogrulama kurallari db/schema.sql'deki CHECK'lerin panel tarafindaki kopyasi: veritabani yine son
// guvence, ama editor hatayi Turkce ve kaydetmeden once gorsun (db/VERI_MODELI.md bolum 6.2).

// --- Etiketler: alan adi -> Turkce; "tablo.alan" anahtari tablo ozelinde onceliklidir. ---
export const ETIKETLER = {
  id: 'Kimlik', slug: 'Adres (slug)', ad: 'Ad', soyad: 'Soyad', baslik: 'Başlık', ozet: 'Özet', icerik: 'İçerik',
  kod: 'Kod', sira: 'Sıra', siralama: 'Sıralama', aktif: 'Aktif', gorunur: 'Görünür', dil: 'Dil', varsayilan: 'Varsayılan',
  tur: 'Tür', durum: 'Durum', numara: 'Numara', eposta: 'E-posta', telefon: 'Telefon', faks: 'Faks',
  seo_baslik: 'SEO başlığı', seo_aciklama: 'SEO açıklaması', paylasim_gorseli: 'Paylaşım görseli (1200×630)',
  olusturma_zamani: 'Oluşturulma', guncelleme_zamani: 'Son güncelleme', olusturan: 'Oluşturan', guncelleyen: 'Güncelleyen',
  onaylayan: 'Onaylayan', onay_zamani: 'Onay zamanı', yayin_tarihi: 'Yayın tarihi', noindex: 'Arama motorlarına kapalı',
  kanonik_url: 'Kanonik adres', gorsel: 'Görsel', hazir: 'Çeviri hazır', ust_alan_id: 'Üst alan',
  unvan_id: 'Unvan', foto: 'Fotoğraf', avukat_mi: 'Avukat', arabulucu_mu: 'Arabulucu', baro_adi: 'Baro',
  baro_sicil_no: 'Baro sicil no', arabulucu_sicil_no: 'Arabulucu sicil no', meslege_baslama_yili: 'Mesleğe başlama yılı',
  linkedin_url: 'LinkedIn adresi', kullanici: 'Panel hesabı', kisa_biyografi: 'Kısa biyografi', biyografi: 'Biyografi',
  sitede_goster: 'Sitede göster', dil_kodu: 'Dil', baslangic_yili: 'Başlangıç yılı', bitis_yili: 'Bitiş yılı',
  okul_adi: 'Okul', bolum_adi: 'Bölüm', derece: 'Derece', firma_adi: 'Kurum', pozisyon: 'Görev', aciklama: 'Açıklama',
  kapak: 'Kapak görseli', yayinevi: 'Yayınevi', isbn: 'ISBN', basim_yili: 'Basım yılı', sayfa_sayisi: 'Sayfa sayısı',
  video_url: 'Video adresi', video_dosyasi: 'Video dosyası', kaynak_adi: 'Kaynak', kaynak_url: 'Kaynak adresi',
  kisi_id: 'Kişi', dis_yazar_adi: 'Dış yazar', dis_yazar_unvan: 'Dış yazarın unvanı', calisma_alani_id: 'Çalışma alanı',
  etiket_id: 'Etiket', yayin_id: 'Yayın', karar_id: 'Karar', dosya: 'Dosya', mevzuat_id: 'Mevzuat', madde: 'Madde',
  ust_mahkeme_id: 'Üst mahkeme', kisa_ad: 'Kısa ad', resmi_gazete_tarihi: 'Resmî Gazete tarihi', mevzuat_url: 'Mevzuat adresi',
  mahkeme_id: 'Mahkeme / daire', esas_no: 'Esas no', karar_no: 'Karar no', karar_tarihi: 'Karar tarihi', konu: 'Konu',
  tam_metin: 'Tam metin (anonimleştirilmiş)', tam_metin_dosyasi: 'Karar dosyası', ofis_davasi: 'Ofis davası (iç bilgi)',
  anonimlestirildi: 'Anonimleştirildi', anonimlestiren: 'Anonimleştiren', anonimlestirme_zamani: 'Anonimleştirme zamanı',
  anahtar: 'Anahtar', resmi_unvan: 'Resmî unvan', whatsapp_numarasi: 'WhatsApp numarası', instagram_url: 'Instagram adresi',
  youtube_url: 'YouTube adresi', x_url: 'X adresi', harita_url: 'Harita bağlantısı', aydinlatma_surumu: 'Aydınlatma metni sürümü',
  adres: 'Adres', alt_bilgi_notu: 'Alt bilgi notu', mesaj: 'Mesaj', konu_turu: 'Konu', cevaplayan_kisi_id: 'Cevaplayan',
  cevap_tarihi: 'Cevap tarihi', ip_hmac: 'IP (HMAC)', saklama_bitis: 'Saklama bitişi', kaynak_yol: 'Eski adres', hedef: 'Yeni adres',
  durum_kodu: 'Durum kodu', isteyen: 'İsteyen', baslama_zamani: 'Başlama', bitis_zamani: 'Bitiş', log_ozeti: 'Günlük özeti',
  'dil.ad': 'Dil adı', 'dil.kod': 'Dil kodu', 'unvan_ceviri.ad': 'Unvan adı', 'calisma_alani_ceviri.ad': 'Alan adı',
  'etiket_ceviri.ad': 'Etiket adı', 'mahkeme.ad': 'Mahkeme / daire adı', 'mevzuat.ad': 'Mevzuat adı',
  'iletisim_mesaji.ad': 'Ad soyad', 'kisi_telefon.tur': 'Tür', 'mevzuat.numara': 'Numara',
  'yonlendirme.durum_kodu': 'Durum kodu', 'derleme_isi.durum': 'Durum', 'iletisim_mesaji.durum': 'Durum',
};

// --- Secenek listeleri: db/schema.sql'deki CHECK (... IN (...)) degerleri ve Turkce adlari ---
const YAYIN_DURUMU = [['taslak', 'Taslak'], ['incelemede', 'İncelemede'], ['yayinda', 'Yayında'], ['arsiv', 'Arşiv']];
export const SECENEKLER = {
  'yayin.tur': [['makale', 'Makale'], ['kitap', 'Kitap'], ['video', 'Video'], ['haber', 'Haber'], ['duyuru', 'Duyuru']],
  'yayin.durum': YAYIN_DURUMU,
  'karar.durum': YAYIN_DURUMU,
  'kisi_telefon.tur': [['dahili', 'Dahili'], ['sabit', 'Sabit'], ['cep', 'Cep']],
  'mahkeme.tur': [
    ['aym', 'Anayasa Mahkemesi'], ['yargitay', 'Yargıtay'], ['danistay', 'Danıştay'], ['bam', 'Bölge Adliye Mahkemesi'],
    ['bim', 'Bölge İdare Mahkemesi'], ['ilk_derece_adli', 'İlk derece (adli)'], ['ilk_derece_idari', 'İlk derece (idari)'],
    ['uyusmazlik', 'Uyuşmazlık Mahkemesi'], ['aihm', 'AİHM'], ['diger', 'Diğer'],
  ],
  'mevzuat.tur': [
    ['kanun', 'Kanun'], ['khk', 'KHK'], ['cbk', 'Cumhurbaşkanlığı Kararnamesi'], ['tuzuk', 'Tüzük'], ['yonetmelik', 'Yönetmelik'],
    ['teblig', 'Tebliğ'], ['uluslararasi', 'Uluslararası'], ['diger', 'Diğer'],
  ],
  'iletisim_mesaji.konu_turu': [['genel', 'Genel bilgi'], ['randevu', 'Randevu talebi'], ['arabuluculuk', 'Arabuluculuk'], ['diger', 'Diğer']],
  'iletisim_mesaji.durum': [['yeni', 'Yeni'], ['okundu', 'Okundu'], ['cevaplandi', 'Cevaplandı'], ['spam', 'Spam']],
  'derleme_isi.durum': [['kuyrukta', 'Kuyrukta'], ['calisiyor', 'Çalışıyor'], ['basarili', 'Başarılı'], ['hatali', 'Hatalı']],
  'yonlendirme.durum_kodu': [[301, '301 (kalıcı)'], [302, '302 (geçici)'], [308, '308 (kalıcı, yöntem korunur)']],
  // Editor kod yazmasin diye ISO 639-1 kodlari Turkce adlariyla (VERI_MODELI bolum 6.3). Listede
  // olmayan dil icin kod elle yazilabilir; bicim yine denetlenir.
  'kisi_yabanci_dil.dil_kodu': [
    ['en', 'İngilizce'], ['de', 'Almanca'], ['fr', 'Fransızca'], ['es', 'İspanyolca'], ['it', 'İtalyanca'], ['ru', 'Rusça'],
    ['ar', 'Arapça'], ['fa', 'Farsça'], ['el', 'Yunanca'], ['nl', 'Felemenkçe'], ['pt', 'Portekizce'], ['zh', 'Çince'],
    ['ja', 'Japonca'], ['ko', 'Korece'], ['az', 'Azerbaycan Türkçesi'], ['ku', 'Kürtçe'], ['bg', 'Bulgarca'], ['ro', 'Romence'],
    ['sq', 'Arnavutça'], ['bs', 'Boşnakça'], ['ka', 'Gürcüce'], ['he', 'İbranice'], ['pl', 'Lehçe'], ['sv', 'İsveççe'],
  ],
};

// --- Dogrulamalar: db/schema.sql ic.* fonksiyonlarinin kopyasi ---
const SLUG = { kural: '^[a-z0-9]+(-[a-z0-9]+)*$', mesaj: 'Yalnızca küçük harf (a-z), rakam ve tire; boşluk ve Türkçe karakter olmaz. Örnek: imar-hukuku' };
// Yerel kisim semadakinden biraz dar (yalniz yaygin isaretler); buyuk harf ve Turkce harf reddedilir.
const EPOSTA = { kural: "^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\\.[a-z0-9-]+)*\\.[a-z]{2,}$", mesaj: 'Küçük harfli geçerli bir e-posta adresi yazın. Örnek: ad.soyad@buro.av.tr' };
const TELEFON = { kural: '^\\+[1-9][0-9]{7,14}$', mesaj: 'Uluslararası biçimde, boşluksuz yazın. Örnek: +902120000000' };
const HTTPS = { kural: '^https://[a-z0-9.-]+(:[0-9]+)?(/\\S*)?$', mesaj: 'https:// ile başlayan geçerli bir adres yazın.' };

// Alan adina gore hangi dogrulama: [kosul, kural]
const DOGRULAMA_KURALLARI = [
  [(t, a) => a === 'slug' || (t === 'unvan' && a === 'kod'), SLUG],
  [(t, a) => a === 'eposta', EPOSTA],
  [(t, a) => ['telefon', 'faks', 'whatsapp_numarasi'].includes(a), TELEFON],
  [(t, a) => a.endsWith('_url'), HTTPS],
];

const YIL_ALANLARI = {
  meslege_baslama_yili: [1950, 2100], baslangic_yili: [1900, 2100], bitis_yili: [1900, 2100], basim_yili: [1900, 2100],
};

// Zengin metin: sitedeki temizleyicinin (site/src/lib/html.ts) izin verdigi etiketlerle sinirli
// arac cubugu; gorsel yok (site Directus /assets adresini kullanmayacak).
const ZENGIN_METIN = ['icerik', 'biyografi', 'tam_metin'];
const ARAC_CUBUGU = ['bold', 'italic', 'underline', 'h2', 'h3', 'numlist', 'bullist', 'blockquote', 'link', 'table', 'removeformat', 'undo', 'redo'];

const UZUN_METIN = ['ozet', 'kisa_biyografi', 'aciklama', 'alt_bilgi_notu', 'adres', 'mesaj', 'log_ozeti', 'seo_aciklama', 'dis_yazar_unvan'];

const DOSYA_ALANLARI = { foto: 'file-image', kapak: 'file-image', gorsel: 'file-image', paylasim_gorseli: 'file-image', video_dosyasi: 'file', tam_metin_dosyasi: 'file' };
const KULLANICI_ALANLARI = ['olusturan', 'guncelleyen', 'onaylayan', 'anonimlestiren', 'isteyen', 'kullanici'];

// m2o alanlarinda secilen kaydin gorunumu (iliskili tablonun alanlariyla).
const M2O_SABLONU = {
  unvan: '{{kod}}', kisi: '{{ad}} {{soyad}}', calisma_alani: '{{ceviriler.ad}}', mahkeme: '{{ad}}', mevzuat: '{{kisa_ad}} {{ad}}',
  directus_users: '{{first_name}} {{last_name}} ({{email}})', etiket: '{{ceviriler.ad}}', yayin: '{{ceviriler.baslik}}', karar: '{{konu}}',
};

function ceviriTablosuMu(t) {
  return t.endsWith('_ceviri');
}

// Bir alanin kurallarla uretilen varsayilan meta'si. alan: Directus /fields yanitindaki kayit.
export function alanMeta(tablo, alan) {
  const a = alan.field;
  const s = alan.schema ?? {};
  const meta = { interface: null, options: null, special: null, readonly: false, hidden: false, width: 'full', note: null, required: false };
  const etiket = ETIKETLER[`${tablo}.${a}`] ?? ETIKETLER[a];
  if (etiket) meta.translations = [{ language: 'tr-TR', translation: etiket }];

  // Veritabaninda bos birakilamayan ve varsayilani olmayan alan formda zorunlu gorunsun.
  if (s.is_nullable === false && s.default_value == null && !s.has_auto_increment && s.is_primary_key !== true) meta.required = true;

  // Directus metin sutununu varsayilan olarak cok satirli kutuda acar; cogu alan tek satirlik.
  if (alan.type === 'text' || alan.type === 'string') meta.interface = UZUN_METIN.includes(a) ? 'input-multiline' : 'input';
  if (a === 'id') Object.assign(meta, { hidden: true, readonly: true });
  // Ceviri satirinin sahibi ve dili ceviri sekmesinden gelir; formda gosterilmez.
  if (ceviriTablosuMu(tablo) && (a === 'dil' || a === `${tablo.replace(/_ceviri$/, '')}_id`)) Object.assign(meta, { hidden: true, required: false });
  if (a === 'olusturma_zamani' || a === 'guncelleme_zamani') {
    Object.assign(meta, { interface: 'datetime', readonly: true, width: 'half', special: a === 'olusturma_zamani' ? ['date-created'] : ['date-updated'] });
  }
  if (a === 'olusturan') meta.special = ['user-created'];
  if (a === 'guncelleyen') meta.special = ['user-updated'];
  if (KULLANICI_ALANLARI.includes(a)) {
    Object.assign(meta, { interface: 'select-dropdown-m2o', options: { template: M2O_SABLONU.directus_users }, display: 'user', width: 'half' });
    if (a !== 'kullanici') meta.readonly = true;
  }
  if (alan.type === 'boolean') Object.assign(meta, { interface: 'boolean', width: 'half', special: ['cast-boolean'] });
  if (YIL_ALANLARI[a]) {
    const [min, max] = YIL_ALANLARI[a];
    Object.assign(meta, { interface: 'input', options: { min, max }, width: 'half' });
  }
  if (ZENGIN_METIN.includes(a)) {
    Object.assign(meta, { interface: 'input-rich-text-html', options: { toolbar: ARAC_CUBUGU, imageToken: null } });
  }
  if (DOSYA_ALANLARI[a]) Object.assign(meta, { interface: DOSYA_ALANLARI[a], special: ['file'], width: 'half' });
  if (s.foreign_key_table && !DOSYA_ALANLARI[a] && !KULLANICI_ALANLARI.includes(a) && !meta.hidden) {
    const template = M2O_SABLONU[s.foreign_key_table] ?? '#{{id}}';
    Object.assign(meta, {
      interface: 'select-dropdown-m2o', options: { template }, display: 'related-values', display_options: { template }, width: 'half',
    });
  }
  const secenekler = SECENEKLER[`${tablo}.${a}`];
  if (secenekler) {
    Object.assign(meta, {
      interface: 'select-dropdown',
      options: { choices: secenekler.map(([value, text]) => ({ value, text })), allowOther: tablo === 'kisi_yabanci_dil' },
      display: 'labels',
      display_options: { choices: secenekler.map(([value, text]) => ({ value, text })) },
      width: 'half',
    });
  }
  for (const [kosul, { kural, mesaj }] of DOGRULAMA_KURALLARI) {
    if (kosul(tablo, a)) {
      meta.validation = { _and: [{ [a]: { _regex: kural } }] };
      meta.validation_message = mesaj;
    }
  }
  if (a === 'slug') meta.options = { slug: true, font: 'monospace' };
  if (['seo_baslik'].includes(a)) Object.assign(meta, { options: { softLength: 70 }, note: 'Boş bırakılırsa başlık kullanılır. En çok 70 karakter.' });
  if (['seo_aciklama'].includes(a)) Object.assign(meta, { interface: 'input-multiline', options: { softLength: 160 }, note: 'Arama sonucunda görünen açıklama. En çok 170 karakter.' });
  return meta;
}

// Alan bazinda ozel ayarlar: varsayilanin ustune yazilir.
const KITAP_DEGIL = [{ name: 'Yalnızca kitap', rule: { tur: { _neq: 'kitap' } }, hidden: true }];
const VIDEO_DEGIL = [{ name: 'Yalnızca video', rule: { tur: { _neq: 'video' } }, hidden: true }];
const HABER_DEGIL = [{ name: 'Yalnızca haber', rule: { tur: { _neq: 'haber' } }, hidden: true }];

export const OZEL = {
  'kisi.meslege_baslama_yili': { note: 'Yalnızca yıl yazılır. Sitede "X yıllık tecrübe" diye hesaplanmaz (reklam yasağı).' },
  'kisi.baro_sicil_no': { note: 'Sitede gösterilip gösterilmeyeceği büroyla netleşecek; şu an gösterilmiyor.' },
  'kisi.arabulucu_sicil_no': { note: 'Sitede gösterilip gösterilmeyeceği büroyla netleşecek; şu an gösterilmiyor.' },
  'kisi.kullanici': { note: 'Bu kişinin panel hesabı. "Yalnızca kendi profilini düzenler" yetkisi bu bağla kurulur (lisans gerekir).' },
  'kisi.aktif': { note: 'Bürodan ayrılan kişi silinmez; bu kapatılır ve sitede görünmez.' },
  'kisi_telefon.sitede_goster': { note: 'Kişisel cep numarası varsayılan olarak gizli (KVKK).' },
  'kisi_telefon.numara': {
    validation: { _and: [{ numara: { _regex: '^(\\+[1-9][0-9]{7,14}|[0-9]{2,6})$' } }] },
    validation_message: 'Dahili için 2-6 rakam (örnek: 101); diğerleri uluslararası biçimde (örnek: +902120000000).',
  },
  'yayin.durum': { note: '"Yayında" için yayın tarihi ve onay zamanı dolu olmalı. İleri bir tarih zamanlanmış yayındır.' },
  'yayin.yayin_tarihi': { interface: 'datetime', width: 'half' },
  'yayin.onay_zamani': { interface: 'datetime', width: 'half', readonly: true, note: 'Yayına alınırken otomatik dolar.' },
  'yayin.yayinevi': { conditions: KITAP_DEGIL, width: 'half' },
  'yayin.isbn': {
    conditions: KITAP_DEGIL, width: 'half', note: 'Tiresiz ISBN-10 ya da ISBN-13 (örnek: 9786051234567).',
    validation: { _and: [{ isbn: { _regex: '^(97[89][0-9]{10}|[0-9]{9}[0-9X])$' } }] },
    validation_message: 'Tiresiz 10 ya da 13 haneli ISBN yazın (sağlama hanesini veritabanı denetler).',
  },
  'yayin.basim_yili': { conditions: KITAP_DEGIL },
  'yayin.sayfa_sayisi': { conditions: KITAP_DEGIL, width: 'half', options: { min: 1 } },
  'yayin.video_url': { conditions: VIDEO_DEGIL, note: 'Sitede gömülmez, yalnızca bağlantı verilir (KVKK).' },
  'yayin.video_dosyasi': { conditions: VIDEO_DEGIL },
  'yayin.kaynak_adi': { conditions: HABER_DEGIL, width: 'half' },
  'yayin.kaynak_url': { conditions: HABER_DEGIL, width: 'half' },
  'yayin.kanonik_url': { note: 'Yalnızca yazı başka bir sitede ilk kez yayımlandıysa doldurun.' },
  'yayin_ceviri.hazir': { note: 'Kapalıysa bu dildeki çeviri sitede gösterilmez.' },
  'yayin_yazar.kisi_id': { note: 'Ekipten bir yazar seçin ya da aşağıya dış yazarın adını yazın (ikisinden biri).' },
  'karar.ofis_davasi': { note: 'Yalnızca iç bilgi; sitede hiçbir yerde gösterilmez.' },
  'karar.anonimlestirildi': { note: 'İşaretlenmeden karar yayına alınamaz (veritabanı kuralı).' },
  'karar.anonimlestirme_zamani': { interface: 'datetime', width: 'half', note: '"Anonimleştirildi" ile birlikte doldurulmalı.' },
  'karar.esas_no': {
    width: 'half',
    validation: { _and: [{ esas_no: { _regex: '^[0-9]{4}/[0-9]{1,7}$' } }] }, validation_message: 'Yıl/sıra biçiminde yazın. Örnek: 2024/1234',
  },
  'karar.karar_no': {
    width: 'half',
    validation: { _and: [{ karar_no: { _regex: '^[0-9]{4}/[0-9]{1,7}$' } }] }, validation_message: 'Yıl/sıra biçiminde yazın. Örnek: 2025/567',
  },
  'karar.karar_tarihi': { interface: 'datetime', width: 'half' },
  'karar.yayin_tarihi': { interface: 'datetime', width: 'half' },
  'karar.onay_zamani': { interface: 'datetime', width: 'half', readonly: true, note: 'Yayına alınırken otomatik dolar.' },
  'karar.slug': { note: 'Künyeden üretin: mahkeme-daire-e-yil-sira-k-yil-sira. Örnek: yargitay-3-hd-e-2024-1234-k-2025-567' },
  'karar_mevzuat.madde': { note: 'Örnek: 344, 49/2, geçici 1. Boşsa kanunun bütünü.' },
  'sayfa.anahtar': { readonly: true, note: 'Sitenin kodu bu anahtarı kullanır; değiştirilmez.' },
  'site_ayar.resmi_unvan': { note: 'Baroya kayıtlı unvan; sitede başlıkta ve alt bilgide aynen kullanılır.' },
  'site_ayar.whatsapp_numarasi': { note: 'Sitede sabit WhatsApp butonu yok; doldurulursa yalnızca iletişim sayfasında bağlantı olabilir.' },
  'site_ayar.harita_url': { note: 'Harita gömülmez; yalnızca "Haritada aç" bağlantısı verilir (KVKK).' },
  'site_ayar.aydinlatma_surumu': { note: 'Aydınlatma metni değişince sürümü de değiştirin (örnek: aydinlatma-2026-10).' },
  'site_ayar_ceviri.alt_bilgi_notu': { interface: 'input-multiline', note: '"Bu site bilgilendirme amaçlıdır" notu.' },
  'site_ayar_ceviri.adres': { interface: 'input-multiline' },
  'dil.varsayilan': { readonly: true, note: 'Varsayılan dil Türkçe; değiştirilmez.' },
  // Gelen mesajlar ziyaretciden gelir: icerik degistirilemez, yalnizca durum ve cevap bilgisi.
  'iletisim_mesaji.ad': { readonly: true },
  'iletisim_mesaji.eposta': { readonly: true },
  'iletisim_mesaji.telefon': { readonly: true },
  'iletisim_mesaji.konu_turu': { readonly: true },
  'iletisim_mesaji.mesaj': { readonly: true, interface: 'input-multiline' },
  'iletisim_mesaji.aydinlatma_surumu': { readonly: true },
  'iletisim_mesaji.ip_hmac': { hidden: true },
  'iletisim_mesaji.saklama_bitis': { readonly: true, interface: 'datetime', width: 'half', note: 'Bu tarihten sonra mesaj otomatik silinir (KVKK).' },
  'iletisim_mesaji.cevap_tarihi': { interface: 'datetime', width: 'half' },
  'derleme_isi.durum': { readonly: true },
  'derleme_isi.baslama_zamani': { readonly: true, interface: 'datetime' },
  'derleme_isi.bitis_zamani': { readonly: true, interface: 'datetime' },
  'derleme_isi.log_ozeti': { readonly: true, interface: 'input-multiline' },
  'yonlendirme.kaynak_yol': { note: 'Site içi eski adres, / ile başlar. Örnek: /eski-yazi' },
  'yonlendirme.hedef': { note: 'Site içi yeni adres (/...) ya da https:// bağlantısı.' },
};
