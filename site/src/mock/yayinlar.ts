// Mock veri: etiketler ve yayinlar. METINLER YER TUTUCUDUR; yazarlar kurgusal ekip uyeleri.
// Bilerek konan durumlar (veri modulunun yayin kurallarini sinamak icin):
//   2 taslak, 10 incelemede, 13 arsiv, 9 ileri tarihli (2027) -> sitede gorunmez
//   11'in EN cevirisi hazir degil (hazir = false) -> EN sayfasi uretilmez
//   14'un yazarlarindan biri burodan ayrilmis kisi (7) -> adi yazilir, profil baglantisi verilmez
//   3'un iceriginde <script>, onclick ve javascript: baglanti var -> temizleyici silmeli
//   1 yayinda olmayan bir karara (5) bagli -> bag sitede gorunmez
import type {
  Etiket, EtiketCeviri, Yayin, YayinCalismaAlani, YayinCeviri, YayinDosya, YayinEtiket, YayinKarar, YayinYazar,
} from '../lib/tablolar';

export const etiket: Etiket[] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];

export const etiket_ceviri: EtiketCeviri[] = [
  { id: 1, etiket_id: 1, dil: 'tr', slug: 'kira', ad: 'Kira' },
  { id: 2, etiket_id: 1, dil: 'en', slug: 'lease', ad: 'Lease' },
  { id: 3, etiket_id: 2, dil: 'tr', slug: 'imar-plani', ad: 'İmar Planı' },
  { id: 4, etiket_id: 3, dil: 'tr', slug: 'tahliye', ad: 'Tahliye' },
  { id: 5, etiket_id: 3, dil: 'en', slug: 'eviction', ad: 'Eviction' },
  { id: 6, etiket_id: 4, dil: 'tr', slug: 'arabuluculuk', ad: 'Arabuluculuk' },
  { id: 7, etiket_id: 4, dil: 'en', slug: 'mediation', ad: 'Mediation' },
  { id: 8, etiket_id: 5, dil: 'tr', slug: 'kentsel-donusum', ad: 'Kentsel Dönüşüm' },
  { id: 9, etiket_id: 6, dil: 'tr', slug: 'sozlesme', ad: 'Sözleşme' },
  { id: 10, etiket_id: 6, dil: 'en', slug: 'contract', ad: 'Contract' },
];

export const yayin: Yayin[] = [
  { id: 1, tur: 'makale', durum: 'yayinda', yayin_tarihi: '2026-09-15T09:00:00+03:00', onay_zamani: '2026-09-14T17:00:00+03:00' },
  {
    id: 2, tur: 'kitap', durum: 'taslak',
    yayinevi: 'Örnek Yayınevi', isbn: '9780306406157', basim_yili: 2025, sayfa_sayisi: 320,
  },
  { id: 3, tur: 'makale', durum: 'yayinda', yayin_tarihi: '2026-06-10T10:00:00+03:00', onay_zamani: '2026-06-09T16:00:00+03:00' },
  { id: 4, tur: 'makale', durum: 'yayinda', yayin_tarihi: '2025-11-20T09:30:00+03:00', onay_zamani: '2025-11-19T18:00:00+03:00' },
  {
    id: 5, tur: 'video', durum: 'yayinda', yayin_tarihi: '2025-05-08T11:00:00+03:00', onay_zamani: '2025-05-07T15:00:00+03:00',
    video_url: 'https://video.example.org/arabuluculuk-sureci',
  },
  {
    id: 6, tur: 'kitap', durum: 'yayinda', yayin_tarihi: '2024-12-01T10:00:00+03:00', onay_zamani: '2024-11-28T12:00:00+03:00',
    yayinevi: 'Örnek Yayınevi', isbn: '9780306406157', basim_yili: 2024, sayfa_sayisi: 280,
  },
  {
    id: 7, tur: 'haber', durum: 'yayinda', yayin_tarihi: '2025-03-14T08:00:00+03:00', onay_zamani: '2025-03-13T17:00:00+03:00',
    kaynak_adi: 'Örnek Gazete', kaynak_url: 'https://haber.example.net/kira-artis-orani',
  },
  { id: 8, tur: 'duyuru', durum: 'yayinda', yayin_tarihi: '2026-01-05T09:00:00+03:00', onay_zamani: '2026-01-04T10:00:00+03:00' },
  { id: 9, tur: 'makale', durum: 'yayinda', yayin_tarihi: '2027-01-15T09:00:00+03:00', onay_zamani: '2026-10-01T10:00:00+03:00' },
  { id: 10, tur: 'makale', durum: 'incelemede' },
  { id: 11, tur: 'makale', durum: 'yayinda', yayin_tarihi: '2026-03-02T09:00:00+03:00', onay_zamani: '2026-03-01T16:00:00+03:00' },
  { id: 12, tur: 'makale', durum: 'yayinda', yayin_tarihi: '2026-07-21T09:00:00+03:00', onay_zamani: '2026-07-20T14:00:00+03:00' },
  { id: 13, tur: 'makale', durum: 'arsiv', yayin_tarihi: '2024-02-01T09:00:00+03:00', onay_zamani: '2024-01-31T12:00:00+03:00' },
  { id: 14, tur: 'makale', durum: 'yayinda', yayin_tarihi: '2024-09-30T09:00:00+03:00', onay_zamani: '2024-09-29T12:00:00+03:00' },
];

export const yayin_ceviri: YayinCeviri[] = [
  {
    id: 1, yayin_id: 1, dil: 'tr', hazir: true,
    slug: 'kira-bedelinin-tespiti-davalarinda-guncel-durum', baslik: 'Kira Bedelinin Tespiti Davalarında Güncel Durum',
    ozet: 'Kira tespit davalarına ilişkin genel bilgilendirme (yer tutucu).',
    icerik: '<h2>I. Giriş</h2><p>Kira bedelinin tespiti davaları, kira ilişkisinin taraflarınca yeni dönem kira bedelinin belirlenmesi için açılır.</p><h2>II. Değerlendirme</h2><p>Yer tutucu metin.</p>',
  },
  {
    id: 2, yayin_id: 1, dil: 'en', hazir: true,
    slug: 'current-state-of-rent-determination-cases', baslik: 'Current State of Rent Determination Cases',
    ozet: 'General information on rent determination cases (placeholder).',
    icerik: '<h2>I. Introduction</h2><p>Rent determination cases are brought to set the rent for a new lease period.</p><p>Placeholder text.</p>',
  },
  {
    id: 3, yayin_id: 2, dil: 'tr', hazir: true,
    slug: 'gayrimenkul-hukukunda-guncel-sorunlar', baslik: 'Gayrimenkul Hukukunda Güncel Sorunlar',
  },
  {
    id: 4, yayin_id: 3, dil: 'tr', hazir: true,
    slug: 'imar-plani-degisikliklerine-itiraz', baslik: 'İmar Planı Değişikliklerine İtiraz',
    ozet: 'İmar planı değişikliklerine karşı itiraz ve dava yolları hakkında genel bilgi.',
    icerik:
      '<h2>İtiraz süresi</h2><p onclick="alert(1)">Plan değişikliklerine askı süresi içinde idareye itiraz edilebilir.</p>' +
      '<script>alert("xss")</script>' +
      '<p>Ayrıntı için <a href="javascript:alert(1)">bu bağlantıya</a> değil, ilgili mevzuata bakınız.</p>' +
      '<h1>Editörün yanlışlıkla eklediği büyük başlık</h1><p>Yer tutucu metin.</p>',
  },
  {
    id: 5, yayin_id: 4, dil: 'tr', hazir: true,
    slug: 'ticari-sozlesmelerde-cezai-sart', baslik: 'Ticari Sözleşmelerde Cezai Şart',
    ozet: 'Cezai şartın niteliği ve indirilmesi hakkında genel bilgi.',
    icerik: '<p>Cezai şart, borcun hiç ya da gereği gibi ifa edilmemesi hâlinde ödenmesi kararlaştırılan bir edimdir.</p><p>Yer tutucu metin.</p>',
  },
  {
    id: 6, yayin_id: 4, dil: 'en', hazir: true,
    slug: 'penalty-clauses-in-commercial-contracts', baslik: 'Penalty Clauses in Commercial Contracts',
    ozet: 'General information on the nature and reduction of penalty clauses.',
    icerik: '<p>A penalty clause is a performance agreed to be paid if an obligation is not performed or not performed properly.</p><p>Placeholder text.</p>',
  },
  {
    id: 7, yayin_id: 5, dil: 'tr', hazir: true,
    slug: 'arabuluculuk-sureci-nasil-isler', baslik: 'Arabuluculuk Süreci Nasıl İşler?',
    ozet: 'Arabuluculuk sürecinin aşamalarını anlatan kısa bir video (yer tutucu).',
  },
  {
    id: 8, yayin_id: 6, dil: 'tr', hazir: true,
    slug: 'kira-uyusmazliklarinda-arabuluculuk', baslik: 'Kira Uyuşmazlıklarında Arabuluculuk',
    ozet: 'Kira uyuşmazlıklarında arabuluculuk sürecini ele alan kitap (yer tutucu).',
  },
  {
    id: 9, yayin_id: 6, dil: 'en', hazir: true,
    slug: 'mediation-in-lease-disputes', baslik: 'Mediation in Lease Disputes',
    ozet: 'A book on mediation in lease disputes (placeholder).',
  },
  {
    id: 10, yayin_id: 7, dil: 'tr', hazir: true,
    slug: 'kira-artis-oranina-iliskin-degerlendirme', baslik: 'Kira Artış Oranına İlişkin Değerlendirme',
    ozet: 'Kira artış oranına ilişkin bir haberde yer alan görüşümüz (yer tutucu).',
  },
  {
    id: 11, yayin_id: 8, dil: 'tr', hazir: true,
    slug: 'buromuzun-yeni-adresi', baslik: 'Büromuzun Yeni Adresi',
    ozet: 'Büromuz 5 Ocak 2026 itibarıyla yeni adresinde hizmet vermektedir.',
    icerik: '<p>Büromuz 5 Ocak 2026 itibarıyla Örnek Mah. Örnek Cad. No: 1, Şişli / İstanbul adresinde hizmet vermektedir.</p>',
  },
  {
    id: 12, yayin_id: 8, dil: 'en', hazir: true,
    slug: 'our-new-address', baslik: 'Our New Address',
    ozet: 'As of 5 January 2026 our office has moved to a new address.',
    icerik: '<p>As of 5 January 2026 our office is located at Örnek Mah. Örnek Cad. No: 1, Şişli / Istanbul.</p>',
  },
  {
    id: 13, yayin_id: 9, dil: 'tr', hazir: true,
    slug: 'nafaka-uyusmazliklarinda-yeni-donem', baslik: 'Nafaka Uyuşmazlıklarında Yeni Dönem',
    ozet: 'Zamanlanmış yayın (yer tutucu).', icerik: '<p>Yer tutucu metin.</p>',
  },
  {
    id: 14, yayin_id: 10, dil: 'tr', hazir: true,
    slug: 'idari-para-cezalarina-itiraz', baslik: 'İdari Para Cezalarına İtiraz',
    ozet: 'İncelemedeki yazı (yer tutucu).', icerik: '<p>Yer tutucu metin.</p>',
  },
  {
    id: 15, yayin_id: 11, dil: 'tr', hazir: true,
    slug: 'ceza-yargilamasinda-makul-sure', baslik: 'Ceza Yargılamasında Makul Süre',
    ozet: 'Makul sürede yargılanma hakkına ilişkin genel bilgi.',
    icerik: '<p>Makul sürede yargılanma hakkı, adil yargılanma hakkının bir unsurudur.</p><p>Yer tutucu metin.</p>',
  },
  {
    id: 16, yayin_id: 11, dil: 'en', hazir: false,
    slug: 'reasonable-time-in-criminal-proceedings', baslik: 'Reasonable Time in Criminal Proceedings',
    ozet: 'Translation in progress.', icerik: '<p>Draft translation.</p>',
  },
  {
    id: 17, yayin_id: 12, dil: 'tr', hazir: true,
    slug: 'velayet-duzenlemesinde-cocugun-yarari', baslik: 'Velayet Düzenlemesinde Çocuğun Yararı',
    ozet: 'Velayet kararlarında çocuğun üstün yararı ilkesine ilişkin genel bilgi.',
    icerik: '<p>Velayet düzenlenirken çocuğun yararı esas alınır.</p><p>Yazıya ilişkin örnek ek aşağıda PDF olarak yer almaktadır. Yer tutucu metin.</p>',
  },
  {
    id: 18, yayin_id: 13, dil: 'tr', hazir: true,
    slug: 'eski-mevzuata-gore-kira-artisi', baslik: 'Eski Mevzuata Göre Kira Artışı',
    ozet: 'Arşivlenmiş yazı (yer tutucu).', icerik: '<p>Yer tutucu metin.</p>',
  },
  {
    id: 19, yayin_id: 14, dil: 'tr', hazir: true,
    slug: 'temerrut-nedeniyle-tahliye', baslik: 'Temerrüt Nedeniyle Tahliye',
    ozet: 'Kiracının temerrüdü nedeniyle tahliye davaları hakkında genel bilgi.',
    icerik: '<p>Kiracının kira bedelini ödememesi hâlinde kiraya verenin başvurabileceği yollar.</p><p>Yer tutucu metin.</p>',
  },
];

export const yayin_yazar: YayinYazar[] = [
  { id: 1, yayin_id: 1, kisi_id: 2, sira: 1 },
  { id: 2, yayin_id: 1, dis_yazar_adi: 'Can Öztürk', dis_yazar_unvan: 'Dr. Öğr. Üyesi, Örnek Üniversitesi', sira: 2 },
  { id: 3, yayin_id: 2, kisi_id: 1, sira: 1 },
  { id: 4, yayin_id: 3, kisi_id: 1, sira: 1 },
  { id: 5, yayin_id: 4, kisi_id: 4, sira: 1 },
  { id: 6, yayin_id: 5, kisi_id: 5, sira: 1 },
  { id: 7, yayin_id: 6, kisi_id: 5, sira: 1 },
  { id: 8, yayin_id: 6, kisi_id: 1, sira: 2 },
  { id: 9, yayin_id: 7, kisi_id: 4, sira: 1 },
  { id: 10, yayin_id: 9, kisi_id: 6, sira: 1 },
  { id: 11, yayin_id: 10, kisi_id: 8, sira: 1 },
  { id: 12, yayin_id: 11, kisi_id: 8, sira: 1 },
  { id: 13, yayin_id: 12, kisi_id: 6, sira: 1 },
  { id: 14, yayin_id: 13, kisi_id: 2, sira: 1 },
  { id: 15, yayin_id: 14, kisi_id: 7, sira: 1 },
  { id: 16, yayin_id: 14, kisi_id: 2, sira: 2 },
];

export const yayin_calisma_alani: YayinCalismaAlani[] = [
  { id: 1, yayin_id: 1, calisma_alani_id: 5 },
  { id: 2, yayin_id: 1, calisma_alani_id: 6 },
  { id: 3, yayin_id: 2, calisma_alani_id: 6 },
  { id: 4, yayin_id: 3, calisma_alani_id: 4 },
  { id: 5, yayin_id: 4, calisma_alani_id: 9 },
  { id: 6, yayin_id: 4, calisma_alani_id: 5 },
  { id: 7, yayin_id: 5, calisma_alani_id: 5 },
  { id: 8, yayin_id: 6, calisma_alani_id: 6 },
  { id: 9, yayin_id: 7, calisma_alani_id: 6 },
  { id: 10, yayin_id: 9, calisma_alani_id: 8 },
  { id: 11, yayin_id: 11, calisma_alani_id: 3 },
  { id: 12, yayin_id: 11, calisma_alani_id: 7 },
  { id: 13, yayin_id: 12, calisma_alani_id: 8 },
  { id: 14, yayin_id: 14, calisma_alani_id: 6 },
  { id: 15, yayin_id: 14, calisma_alani_id: 10 },
];

export const yayin_etiket: YayinEtiket[] = [
  { id: 1, yayin_id: 1, etiket_id: 1 },
  { id: 2, yayin_id: 3, etiket_id: 2 },
  { id: 3, yayin_id: 3, etiket_id: 5 },
  { id: 4, yayin_id: 4, etiket_id: 6 },
  { id: 5, yayin_id: 5, etiket_id: 4 },
  { id: 6, yayin_id: 6, etiket_id: 4 },
  { id: 7, yayin_id: 6, etiket_id: 1 },
  { id: 8, yayin_id: 7, etiket_id: 1 },
  { id: 9, yayin_id: 14, etiket_id: 3 },
  { id: 10, yayin_id: 14, etiket_id: 1 },
];

export const yayin_dosya: YayinDosya[] = [
  { id: 1, yayin_id: 12, dosya: '3f6c2a1e-8b4d-4c1a-9e2f-5a7b8c9d0e11', sira: 1 },
];

export const yayin_karar: YayinKarar[] = [
  { id: 1, yayin_id: 1, karar_id: 1 },
  { id: 2, yayin_id: 1, karar_id: 5 },
  { id: 3, yayin_id: 3, karar_id: 2 },
  { id: 4, yayin_id: 4, karar_id: 8 },
  { id: 5, yayin_id: 6, karar_id: 6 },
  { id: 6, yayin_id: 11, karar_id: 4 },
  { id: 7, yayin_id: 14, karar_id: 3 },
];
