// Mock veri: diller, dosyalar, site ayarlari, unvanlar, sabit sayfalar.
// KISILER, BURO UNVANI VE ICERIK KURGUSALDIR (temel: db/ornek_veri.sql). Canli sitede kullanilmaz.
import type {
  DilSatiri, DirectusDosya, Sayfa, SayfaCeviri, SiteAyar, SiteAyarCeviri, Unvan, UnvanCeviri,
} from '../lib/tablolar';

export const dil: DilSatiri[] = [
  { kod: 'tr', ad: 'Türkçe', varsayilan: true, aktif: true, siralama: 1 },
  { kod: 'en', ad: 'English', varsayilan: false, aktif: true, siralama: 2 },
];

// Dosyanin kendisi site/public/dosyalar/<filename_disk> altinda durur (canlida derleme
// sirasinda Directus deposundan dist'e kopyalanir; Directus /assets adresi kullanilmaz).
export const directus_files: DirectusDosya[] = [
  {
    id: '3f6c2a1e-8b4d-4c1a-9e2f-5a7b8c9d0e11',
    storage: 'local',
    filename_disk: '3f6c2a1e-8b4d-4c1a-9e2f-5a7b8c9d0e11.pdf',
    filename_download: 'velayet-duzenlemesi-ornek-ek.pdf',
    type: 'application/pdf',
  },
];

// Buro unvani yalnizca burada tanimlidir. Kurgusal; "soyad + Avukatlik Burosu" bicimi
// docs/inceleme-2026-10-09.md 7. bolumdeki unvan kuralina uyar.
export const site_ayar: SiteAyar[] = [
  {
    id: 1,
    resmi_unvan: 'Yılmaz Avukatlık Bürosu',
    telefon: '+902120000000',
    eposta: 'info@ornek.av.tr',
    linkedin_url: 'https://www.linkedin.com/company/ornek',
    harita_url: 'https://www.openstreetmap.org/?mlat=41.0600&mlon=28.9870#map=17/41.0600/28.9870',
    aydinlatma_surumu: 'aydinlatma-2026-10',
  },
];

export const site_ayar_ceviri: SiteAyarCeviri[] = [
  {
    id: 1, site_ayar_id: 1, dil: 'tr',
    adres: 'Örnek Mah. Örnek Cad. No: 1, Şişli / İstanbul',
    alt_bilgi_notu: 'Bu site bilgilendirme amaçlıdır; içerikler hukuki görüş niteliği taşımaz ve avukat-müvekkil ilişkisi kurmaz.',
  },
  {
    id: 2, site_ayar_id: 1, dil: 'en',
    adres: 'Örnek Mah. Örnek Cad. No: 1, Şişli / Istanbul',
    alt_bilgi_notu: 'This website is for information purposes only; its content is not legal advice and does not create a lawyer-client relationship.',
  },
];

export const unvan: Unvan[] = [
  { id: 1, kod: 'kurucu-ortak', sira: 1 },
  { id: 2, kod: 'ortak', sira: 2 },
  { id: 3, kod: 'kidemli-avukat', sira: 3 },
  { id: 4, kod: 'avukat', sira: 4 },
  { id: 5, kod: 'stajyer-avukat', sira: 5 },
];

export const unvan_ceviri: UnvanCeviri[] = [
  { id: 1, unvan_id: 1, dil: 'tr', ad: 'Kurucu Ortak' },
  { id: 2, unvan_id: 1, dil: 'en', ad: 'Founding Partner' },
  { id: 3, unvan_id: 2, dil: 'tr', ad: 'Ortak' },
  { id: 4, unvan_id: 2, dil: 'en', ad: 'Partner' },
  { id: 5, unvan_id: 3, dil: 'tr', ad: 'Kıdemli Avukat' },
  { id: 6, unvan_id: 3, dil: 'en', ad: 'Senior Associate' },
  { id: 7, unvan_id: 4, dil: 'tr', ad: 'Avukat' },
  { id: 8, unvan_id: 4, dil: 'en', ad: 'Associate' },
  { id: 9, unvan_id: 5, dil: 'tr', ad: 'Stajyer Avukat' },
  { id: 10, unvan_id: 5, dil: 'en', ad: 'Trainee Lawyer' },
];

export const sayfa: Sayfa[] = [
  { id: 1, anahtar: 'ana_sayfa', aktif: true, siralama: 0 },
  { id: 2, anahtar: 'hakkimizda', aktif: true, siralama: 1 },
  { id: 3, anahtar: 'arabuluculuk', aktif: true, siralama: 2 },
  { id: 4, anahtar: 'iletisim', aktif: true, siralama: 3 },
  { id: 5, anahtar: 'kvkk_aydinlatma', aktif: true, siralama: 10 },
  { id: 6, anahtar: 'cerez_politikasi', aktif: true, siralama: 11 },
  { id: 7, anahtar: 'yasal_uyari', aktif: true, siralama: 12 },
  { id: 8, anahtar: 'kvkk_basvuru', aktif: true, siralama: 13 },
];

// Yasal sayfalarin metnini hukukcu yazacak; burada bilerek yalnizca taslak isareti var.
const TASLAK_TR =
  '<p><strong>Taslak – hukuki metin bekleniyor.</strong></p>' +
  '<p>Bu sayfanın metni büronun avukatları tarafından hazırlanacaktır. Şu anki içerik yer tutucudur ve hukuki bir metin değildir.</p>';

export const sayfa_ceviri: SayfaCeviri[] = [
  {
    id: 1, sayfa_id: 1, dil: 'tr', slug: null, baslik: 'Ana Sayfa',
    icerik: '<p>Büromuz özel hukuk ve kamu hukuku alanlarında avukatlık hizmeti vermekte, hukuk uyuşmazlıklarında arabuluculuk sürecine ilişkin bilgi sunmaktadır. Bu sayfadaki metin yer tutucudur.</p>',
    seo_aciklama: 'Avukatlık bürosunun çalışma alanları, ekibi, yayınları, kararları ve iletişim bilgileri.',
  },
  {
    id: 2, sayfa_id: 2, dil: 'tr', slug: 'hakkimizda', baslik: 'Hakkımızda',
    icerik:
      '<p>Büromuz İstanbul’da kurulmuş bir avukatlık bürosudur. Özel hukuk ve kamu hukuku alanlarında danışmanlık ve dava takibi yapmaktadır.</p>' +
      '<h2>Çalışma biçimimiz</h2><p>Her dosya, ilgili çalışma alanında görev yapan avukatlarımız tarafından yürütülür. Müvekkillerimizi süreç hakkında düzenli olarak bilgilendiririz.</p>' +
      '<p>Bu metin yer tutucudur; büro tarafından yazılacaktır.</p>',
    seo_aciklama: 'Büronun kuruluşu, çalışma alanları ve çalışma biçimi hakkında genel bilgi.',
  },
  {
    id: 3, sayfa_id: 3, dil: 'tr', slug: 'arabuluculuk', baslik: 'Arabuluculuk',
    icerik:
      '<p>Arabuluculuk, tarafların bağımsız ve tarafsız bir arabulucunun yardımıyla uyuşmazlıklarına kendi çözümlerini aradıkları bir yöntemdir. Hukuk uyuşmazlıklarında arabuluculuk 6325 sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu ile düzenlenmiştir.</p>' +
      '<h2>Süreç nasıl işler?</h2><ul><li>Taraflardan biri ya da birlikte taraflar arabulucuya başvurur.</li><li>Arabulucu tarafları toplantıya davet eder; görüşmeler gizlidir.</li><li>Taraflar anlaşırsa anlaşma belgesi düzenlenir; anlaşamazlarsa son tutanak düzenlenir.</li></ul>' +
      '<h2>Zorunlu arabuluculuk</h2><p>Kanunda sayılan bazı uyuşmazlıklarda dava açmadan önce arabulucuya başvurmak dava şartıdır. Uyuşmazlığınızın bu kapsamda olup olmadığını öğrenmek için bizimle iletişime geçebilirsiniz.</p>' +
      '<p>Arabuluculuk sürecinin sonucu tarafların iradesine bağlıdır; bu sayfa bir sonuç vaadi içermez. Metin yer tutucudur ve büro tarafından gözden geçirilecektir.</p>',
    seo_aciklama: 'Hukuk uyuşmazlıklarında arabuluculuk sürecine ilişkin genel bilgi.',
  },
  {
    id: 4, sayfa_id: 4, dil: 'tr', slug: 'iletisim', baslik: 'İletişim',
    icerik: '<p>Bize telefon, e-posta ya da aşağıdaki form aracılığıyla ulaşabilirsiniz.</p>',
    seo_aciklama: 'Büronun adresi, telefonu, e-posta adresi ve iletişim formu.',
  },
  {
    id: 5, sayfa_id: 5, dil: 'tr', slug: 'kvkk-aydinlatma-metni', baslik: 'KVKK Aydınlatma Metni',
    icerik: TASLAK_TR, seo_aciklama: 'Kişisel verilerin işlenmesine ilişkin aydınlatma metni (taslak).',
  },
  {
    id: 6, sayfa_id: 6, dil: 'tr', slug: 'cerez-politikasi', baslik: 'Çerez Politikası',
    icerik: TASLAK_TR, seo_aciklama: 'Sitede kullanılan çerezlere ilişkin politika (taslak).',
  },
  {
    id: 7, sayfa_id: 7, dil: 'tr', slug: 'yasal-uyari', baslik: 'Yasal Uyarı',
    icerik: TASLAK_TR, seo_aciklama: 'Sitenin kullanımına ilişkin yasal uyarı (taslak).',
  },
  {
    id: 8, sayfa_id: 8, dil: 'tr', slug: 'kvkk-basvuru', baslik: 'KVKK Başvuru',
    icerik: TASLAK_TR, seo_aciklama: 'İlgili kişi başvurularının nasıl yapılacağına ilişkin bilgi (taslak).',
  },
  {
    id: 9, sayfa_id: 1, dil: 'en', slug: null, baslik: 'Home',
    icerik: '<p>Our firm provides legal services in private and public law and offers information on mediation in civil disputes. This text is a placeholder.</p>',
    seo_aciklama: 'Practice areas, team, publications and contact details of the law office.',
  },
  {
    id: 10, sayfa_id: 2, dil: 'en', slug: 'about', baslik: 'About Us',
    icerik:
      '<p>Our firm is a law office based in Istanbul, providing advice and litigation services in private and public law.</p>' +
      '<p>This text is a placeholder and will be written by the firm.</p>',
    seo_aciklama: 'General information about the law office and how it works.',
  },
  {
    id: 11, sayfa_id: 3, dil: 'en', slug: 'mediation', baslik: 'Mediation',
    icerik:
      '<p>Mediation is a method in which the parties seek their own solution to a dispute with the help of an independent and impartial mediator. In Turkey, mediation in civil disputes is governed by Law No. 6325.</p>' +
      '<p>The outcome of mediation depends on the will of the parties; this page makes no promise of any outcome. This text is a placeholder.</p>',
    seo_aciklama: 'General information on mediation in civil disputes.',
  },
  {
    id: 12, sayfa_id: 4, dil: 'en', slug: 'contact', baslik: 'Contact',
    icerik: '<p>You can reach us by phone, e-mail or the form below.</p>',
    seo_aciklama: 'Address, phone, e-mail and contact form of the law office.',
  },
];
