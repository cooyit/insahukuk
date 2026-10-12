// Roller ve yetkiler (Directus 12: rol -> politika -> yetki satirlari).
//
// Lisans: lisanssiz katmanda "ozel kural" yasak. Ozel kural = filtreli, alan kisitli, dogrulamali ya da
// varsayilan degerli yetki satiri (Directus: api/dist/license/entitlements/lib/custom-permission-rules-enabled.js).
// Veritabaninda boyle bir satir olursa Directus onu erisim kontrolunde yok sayar ve kurulumu KILITLER.
// Bu yuzden:
//   - Editor: yalnizca "tam erisim" satirlari (fields ['*'], filtre yok) + Directus'un "onerilen"
//     satirlari (birebir ayni olduklari icin muaf). Lisanssiz kurulabilir.
//   - Yazar: "yalnizca kendi kaydi, yayina alamaz" filtre ister; YALNIZCA lisans ozel kurala izin
//     veriyorsa uygulanir. Bu gece lisans olmadigi icin uygulanmadi ve denenmedi.
// Yonetici: Directus'un hazir "Administrator" rolu (bootstrap'in actigi ilk kullanici).
import { appRecommendedPermissions } from '@directus/system-data';

// Directus'un "onerilen" uygulama yetkilerinden kullandiklarimiz. Kopyalanmaz, Directus'un kendi
// paketinden okunur: muafiyet birebir esitlikle denetlendigi icin kopya surum farkinda kilitlenirdi.
// Panolar (insights) ve paylasim baglantilari (shares) bilerek yok: kullanilmiyor; paylasim icerigi
// giris yapmadan disariya acar.
const ONERILENLERDEN = new Set([
  'directus_comments', 'directus_files', 'directus_folders', 'directus_users', 'directus_roles', 'directus_flows',
]);
export const ONERILEN = appRecommendedPermissions.filter((p) => ONERILENLERDEN.has(p.collection));

const HEPSI = ['create', 'read', 'update', 'delete'];

// Editorun koleksiyonlari ve eylemleri. Ceviri ve ara tablolar da burada: ana kaydin formundan
// ic ice duzenlenirken o tablolara da yazilir.
export const EDITOR_ERISIMI = {
  kisi: HEPSI, kisi_ceviri: HEPSI, kisi_telefon: HEPSI, kisi_yabanci_dil: HEPSI, kisi_calisma_alani: HEPSI,
  egitim: HEPSI, egitim_ceviri: HEPSI, deneyim: HEPSI, deneyim_ceviri: HEPSI,
  unvan: HEPSI, unvan_ceviri: HEPSI,
  calisma_alani: HEPSI, calisma_alani_ceviri: HEPSI, etiket: HEPSI, etiket_ceviri: HEPSI,
  yayin: HEPSI, yayin_ceviri: HEPSI, yayin_yazar: HEPSI, yayin_calisma_alani: HEPSI, yayin_etiket: HEPSI,
  yayin_dosya: HEPSI, yayin_karar: HEPSI,
  karar: HEPSI, karar_mevzuat: HEPSI, karar_etiket: HEPSI, karar_calisma_alani: HEPSI, mahkeme: HEPSI, mevzuat: HEPSI,
  // Sabit sayfalarin anahtarini sitenin kodu kullanir: editor yeni sayfa acmaz, silmez.
  sayfa: ['read', 'update'], sayfa_ceviri: HEPSI,
  site_ayar: ['read', 'update'], site_ayar_ceviri: HEPSI,
  dil: ['read'],
  yonlendirme: HEPSI,
  // Gelen mesaj ziyaretciden gelir: editor olusturmaz; okur, durumunu gunceller, siler.
  iletisim_mesaji: ['read', 'update', 'delete'],
  // "Yayimla" kuyruga is ekler; isin durumunu derleme gorevi gunceller.
  derleme_isi: ['read', 'create'],
};

const BENIM_KISI = { kullanici: { _eq: '$CURRENT_USER' } };
const BENIM_YAYIN = { yazarlar: { kisi_id: { kullanici: { _eq: '$CURRENT_USER' } } } };
const TASLAK_YA_DA_INCELEME = { durum: { _in: ['taslak', 'incelemede'] } };

// Yazar (lisans gerekir; denenmedi). Okuma serbest, yazma yalnizca kendi kaydina; yayina alamaz.
export const YAZAR_YETKILERI = [
  ...['kisi', 'unvan', 'calisma_alani', 'etiket', 'karar', 'mahkeme', 'mevzuat', 'dil', 'yayin'].map((c) => ({ collection: c, action: 'read', fields: ['*'] })),
  { collection: 'kisi', action: 'update', fields: ['ceviriler', 'telefonlar', 'yabanci_diller', 'egitimler', 'deneyimler', 'calisma_alanlari', 'foto', 'linkedin_url'], permissions: BENIM_KISI },
  ...['kisi_ceviri', 'kisi_telefon', 'kisi_yabanci_dil', 'kisi_calisma_alani', 'egitim', 'deneyim'].flatMap((c) =>
    HEPSI.map((action) => ({ collection: c, action, fields: ['*'], permissions: action === 'create' ? null : { kisi_id: BENIM_KISI } })),
  ),
  { collection: 'yayin', action: 'create', fields: ['*'], validation: TASLAK_YA_DA_INCELEME, presets: { durum: 'taslak' } },
  { collection: 'yayin', action: 'update', fields: ['*'], permissions: BENIM_YAYIN, validation: TASLAK_YA_DA_INCELEME },
  ...['yayin_ceviri', 'yayin_yazar', 'yayin_calisma_alani', 'yayin_etiket', 'yayin_dosya', 'yayin_karar'].flatMap((c) =>
    HEPSI.map((action) => ({ collection: c, action, fields: ['*'], permissions: action === 'create' ? null : { yayin_id: BENIM_YAYIN } })),
  ),
];

export const POLITIKALAR = [
  {
    ad: 'Editör',
    aciklama: 'İçeriği yönetir: ekip, yayınlar, kararlar, sayfalar, site ayarları, gelen mesajlar. Kullanıcı ve sistem ayarlarına erişemez.',
    icon: 'edit_note',
    // Inceleme 4.3: zorunlu kilinabilen TOTP 2FA. Ilk giriste panel kurulumu ister.
    enforce_tfa: true,
    yetkiler: [
      ...ONERILEN,
      ...Object.entries(EDITOR_ERISIMI).flatMap(([collection, eylemler]) => eylemler.map((action) => ({ collection, action, fields: ['*'] }))),
    ],
  },
  {
    ad: 'Yazar',
    aciklama: 'Yalnızca kendi profilini ve yazılarını düzenler; yazıyı yayına alamaz (incelemeye gönderir). Lisans gerekir.',
    icon: 'history_edu',
    enforce_tfa: true,
    lisansGerekir: true,
    yetkiler: [...ONERILEN, ...YAZAR_YETKILERI],
  },
];

export const ROLLER = [
  { ad: 'Editör', politika: 'Editör', icon: 'edit_note' },
  { ad: 'Yazar', politika: 'Yazar', icon: 'history_edu', lisansGerekir: true },
];

// Directus'un ozel kural denetiminin kopyasi (ayni dosya, yukarida). Onerilen satirlar muaf.
export function ozelKuralMi(y) {
  const ozel = y.fields?.includes('*') !== true
    || Object.keys(y.permissions ?? {}).length > 0
    || Object.keys(y.validation ?? {}).length > 0
    || Object.keys(y.presets ?? {}).length > 0;
  return ozel && !onerilenMi(y);
}

function esit(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function onerilenMi(y) {
  if (y.validation || y.presets) return false;
  const o = appRecommendedPermissions.find((p) => p.action === y.action && p.collection === y.collection);
  return !!o && esit(o.fields, y.fields) && esit(o.permissions, y.permissions);
}
