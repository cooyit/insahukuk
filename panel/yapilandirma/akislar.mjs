// Directus akislari (flows). Lisanssiz katman en fazla 5 AKTIF akisa izin verir; burada 4 tane var.
// Her akisin islemleri (islemler) sirayla calisir: ilki tetiklenince calisir; "sonra" basarida,
// "aksi" basarisizlikta (ornek: kosul tutmazsa) calisacak islemin anahtaridir.
//
// Engelleyici (filter) akislar kayit veritabanina yazilmadan once yukte (payload) calisir ve son
// islemin dondurdugu degeri yeni yuk yapar. Bunun icin akisin options.return = '$last' olmasi sart
// (Directus api/dist/flows.js; olmazsa donus degeri sessizce yok sayiliyor, denendi).
//
// Neden gerekli: veritabani "yayinda" icin onay_zamani'ni ve anonimlestirilmis karar icin
// anonimlestirme_zamani'ni zorunlu tutar (db/schema.sql CHECK). Bu alanlar formda salt okunur;
// editor yalnizca durumu / isareti degistirir, zaman ve kisi burada dolar (db/VERI_MODELI.md bolum 6.3).
//
// Betikler Directus'un yalitilmis ortaminda calisir (exec islemi); yalnizca yuk ve oturum bilgisi gorur.

// Onay ve anonimlestirme bilgisi istemciden ALINMAZ: editorun yetkisi tum alanlari kapsadigi icin
// (lisanssiz katmanda alan kisitlamasi yok) gonderilen deger silinir ve yalnizca bu akis yazar.
// Boylece "kim, ne zaman onayladi" sahtelenemez (kod incelemesinde bulundu).
const YAYIN_ONAYI = `module.exports = async function (data) {
  const yuk = { ...data.$trigger.payload };
  delete yuk.onay_zamani;
  delete yuk.onaylayan;
  if (yuk.durum === 'yayinda') {
    yuk.onay_zamani = new Date().toISOString();
    yuk.onaylayan = data.$accountability?.user ?? null;
  }
  return yuk;
};`;

const KARAR_ONAYI = `module.exports = async function (data) {
  const yuk = { ...data.$trigger.payload };
  const kim = data.$accountability?.user ?? null;
  const simdi = new Date().toISOString();
  delete yuk.onay_zamani;
  delete yuk.onaylayan;
  delete yuk.anonimlestirme_zamani;
  delete yuk.anonimlestiren;
  if (yuk.durum === 'yayinda') {
    yuk.onay_zamani = simdi;
    yuk.onaylayan = kim;
  }
  // Semada: anonimlestirildi = (anonimlestirme_zamani IS NOT NULL). Isaret ve zaman birlikte degisir.
  if (yuk.anonimlestirildi === true) {
    yuk.anonimlestirme_zamani = simdi;
    yuk.anonimlestiren = kim;
  }
  if (yuk.anonimlestirildi === false) {
    yuk.anonimlestirme_zamani = null;
    yuk.anonimlestiren = null;
  }
  return yuk;
};`;

// Panel baglantisi icin PUBLIC_URL akislara FLOWS_ENV_ALLOW_LIST ile acilir (.env.ornek).
function bildirim(alici) {
  const baglanti = '{{$env.PUBLIC_URL}}/admin/content/iletisim_mesaji/{{$trigger.key}}';
  return {
    to: [alici],
    subject: 'Yeni iletişim mesajı',
    type: 'markdown',
    body: [
      'İletişim formundan yeni bir mesaj geldi.',
      `Mesajı panelde okuyun: [${baglanti}](${baglanti})`,
      'Kişisel verilerin korunması için bu e-postada mesajın içeriği ve gönderenin bilgileri yer almaz.',
    ].join('\n\n'),
  };
}

export const AKISLAR = [
  {
    ad: 'Yayın onayı',
    icon: 'verified',
    aciklama: 'Yayın "Yayında" yapılınca onay zamanını ve onaylayanı doldurur.',
    trigger: 'event',
    options: { type: 'filter', scope: ['items.create', 'items.update'], collections: ['yayin'], return: '$last' },
    islemler: [{ key: 'onay', name: 'Onay bilgisi', type: 'exec', options: { code: YAYIN_ONAYI } }],
  },
  {
    ad: 'Karar onayı ve anonimleştirme',
    icon: 'verified_user',
    aciklama: 'Karar yayına alınınca onay bilgisini, "Anonimleştirildi" işaretlenince zamanı ve kişiyi doldurur.',
    trigger: 'event',
    options: { type: 'filter', scope: ['items.create', 'items.update'], collections: ['karar'], return: '$last' },
    islemler: [{ key: 'onay', name: 'Onay ve anonimleştirme', type: 'exec', options: { code: KARAR_ONAYI } }],
  },
  {
    // Kuyruktaki isi sunucudaki derleme gorevi alip siteyi yeniden uretir (bu calismanin kapsami disi).
    ad: 'Yayımla',
    icon: 'publish',
    aciklama: 'Siteyi yeniden derlemek için yayımlama kuyruğuna iş ekler.',
    trigger: 'manual',
    options: {
      collections: ['yayin', 'karar', 'kisi', 'sayfa', 'calisma_alani', 'site_ayar', 'derleme_isi'],
      requireSelection: false,
      location: 'collection',
      requireConfirmation: true,
      confirmationDescription: 'Yapılan değişiklikler sitede görünsün diye site yeniden derlenecek. Devam edilsin mi?',
    },
    islemler: [{
      key: 'kuyruk',
      name: 'Kuyruğa ekle',
      type: 'item-create',
      // Isi tetikleyen kullanicinin yetkisiyle: editorun derleme_isi olusturma yetkisi var.
      options: { collection: 'derleme_isi', permissions: '$trigger', emitEvents: true, payload: { durum: 'kuyrukta', isteyen: '{{$accountability.user}}' } },
    }],
  },
  {
    // KVKK: e-postaya kisisel veri girmez (ad, adres, mesaj yok); yalnizca panel baglantisi. E-posta
    // ucuncu taraf sunuculardan gecebilir, mesajin kendisi panelde kalir.
    // Alici panelden degisir: Site ayarlari > "Form bildirim e-postasi"; bossa buro e-postasi.
    ad: 'Yeni mesaj bildirimi',
    icon: 'mark_email_unread',
    aciklama: 'İletişim formundan mesaj gelince site ayarlarındaki form bildirim adresine (boşsa büro e-postasına) haber verir. E-postada kişisel veri yok.',
    trigger: 'event',
    options: { type: 'action', scope: ['items.create'], collections: ['iletisim_mesaji'] },
    islemler: [
      // Ayar sistem yetkisiyle okunur: mesaji olusturan form servisinin site_ayar okuma yetkisi yok.
      { key: 'ayar', name: 'Site ayarlarını oku', type: 'item-read', options: { collection: 'site_ayar', key: [1], permissions: '$full' }, sonra: 'adres_var_mi' },
      {
        key: 'adres_var_mi',
        name: 'Form bildirim adresi dolu mu?',
        type: 'condition',
        options: { filter: { ayar: { form_bildirim_eposta: { _nnull: true } } } },
        sonra: 'bildirim_adresine',
        aksi: 'buro_adresine',
      },
      { key: 'bildirim_adresine', name: 'Form bildirim adresine yaz', type: 'mail', options: bildirim('{{ayar.form_bildirim_eposta}}') },
      { key: 'buro_adresine', name: 'Büro e-postasına yaz', type: 'mail', options: bildirim('{{ayar.eposta}}') },
    ],
  },
];
