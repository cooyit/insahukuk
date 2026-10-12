// Directus akislari (flows). Lisanssiz katman en fazla 5 AKTIF akisa izin verir; burada 3 tane var.
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

const YAYIN_ONAYI = `module.exports = async function (data) {
  const yuk = { ...data.$trigger.payload };
  if (yuk.durum === 'yayinda' && !yuk.onay_zamani) {
    yuk.onay_zamani = new Date().toISOString();
    yuk.onaylayan = data.$accountability?.user ?? null;
  }
  return yuk;
};`;

const KARAR_ONAYI = `module.exports = async function (data) {
  const yuk = { ...data.$trigger.payload };
  const kim = data.$accountability?.user ?? null;
  const simdi = new Date().toISOString();
  if (yuk.durum === 'yayinda' && !yuk.onay_zamani) {
    yuk.onay_zamani = simdi;
    yuk.onaylayan = kim;
  }
  // Semada: anonimlestirildi = (anonimlestirme_zamani IS NOT NULL). Isaret ve zaman birlikte degisir.
  if (yuk.anonimlestirildi === true && !yuk.anonimlestirme_zamani) {
    yuk.anonimlestirme_zamani = simdi;
    yuk.anonimlestiren = kim;
  }
  if (yuk.anonimlestirildi === false) {
    yuk.anonimlestirme_zamani = null;
    yuk.anonimlestiren = null;
  }
  return yuk;
};`;

export const AKISLAR = [
  {
    ad: 'Yayın onayı',
    icon: 'verified',
    aciklama: 'Yayın "Yayında" yapılınca onay zamanını ve onaylayanı doldurur.',
    trigger: 'event',
    options: { type: 'filter', scope: ['items.create', 'items.update'], collections: ['yayin'], return: '$last' },
    islem: { key: 'onay', name: 'Onay bilgisi', type: 'exec', options: { code: YAYIN_ONAYI } },
  },
  {
    ad: 'Karar onayı ve anonimleştirme',
    icon: 'verified_user',
    aciklama: 'Karar yayına alınınca onay bilgisini, "Anonimleştirildi" işaretlenince zamanı ve kişiyi doldurur.',
    trigger: 'event',
    options: { type: 'filter', scope: ['items.create', 'items.update'], collections: ['karar'], return: '$last' },
    islem: { key: 'onay', name: 'Onay ve anonimleştirme', type: 'exec', options: { code: KARAR_ONAYI } },
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
    islem: {
      key: 'kuyruk',
      name: 'Kuyruğa ekle',
      type: 'item-create',
      // Isi tetikleyen kullanicinin yetkisiyle: editorun derleme_isi olusturma yetkisi var.
      options: { collection: 'derleme_isi', permissions: '$trigger', emitEvents: true, payload: { durum: 'kuyrukta', isteyen: '{{$accountability.user}}' } },
    },
  },
];
