// Mock veri: mahkemeler, mevzuat ve kararlar (yalnizca Turkce).
// KARARLAR UYDURMADIR; esas/karar numaralari bilerek yapay desenlidir (1111/2222 ...).
// Mahkeme ve mevzuat adlari ile kanun numaralari gercektir (db/ornek_veri.sql gibi).
// Bilerek konan durumlar: 5 taslak ve anonimlestirilmemis, 7 ileri tarihli -> sitede gorunmez;
// 3'te ofis_davasi = true -> bu bilgi sitede hicbir yerde gosterilmez.
import type { Karar, KararCalismaAlani, KararEtiket, KararMevzuat, Mahkeme, Mevzuat } from '../lib/tablolar';

export const mahkeme: Mahkeme[] = [
  { id: 1, ust_mahkeme_id: null, tur: 'aym', ad: 'Anayasa Mahkemesi', kisa_ad: 'AYM', siralama: 1, aktif: true },
  { id: 2, ust_mahkeme_id: null, tur: 'yargitay', ad: 'Yargıtay', kisa_ad: 'Y.', siralama: 2, aktif: true },
  { id: 3, ust_mahkeme_id: null, tur: 'danistay', ad: 'Danıştay', kisa_ad: 'D.', siralama: 3, aktif: true },
  { id: 4, ust_mahkeme_id: 2, tur: 'yargitay', ad: '3. Hukuk Dairesi', kisa_ad: 'Y. 3. HD', siralama: 3, aktif: true },
  { id: 5, ust_mahkeme_id: 2, tur: 'yargitay', ad: '6. Hukuk Dairesi', kisa_ad: 'Y. 6. HD', siralama: 6, aktif: true },
  { id: 6, ust_mahkeme_id: 3, tur: 'danistay', ad: '6. Daire', kisa_ad: 'D. 6. D.', siralama: 6, aktif: true },
  { id: 7, ust_mahkeme_id: null, tur: 'bam', ad: 'İstanbul Bölge Adliye Mahkemesi', kisa_ad: 'İstanbul BAM', siralama: 4, aktif: true },
  { id: 8, ust_mahkeme_id: 7, tur: 'bam', ad: '12. Hukuk Dairesi', kisa_ad: 'İstanbul BAM 12. HD', siralama: 12, aktif: true },
];

export const mevzuat: Mevzuat[] = [
  { id: 1, tur: 'kanun', numara: '6098', ad: 'Türk Borçlar Kanunu', kisa_ad: 'TBK' },
  { id: 2, tur: 'kanun', numara: '4721', ad: 'Türk Medeni Kanunu', kisa_ad: 'TMK' },
  { id: 3, tur: 'kanun', numara: '6100', ad: 'Hukuk Muhakemeleri Kanunu', kisa_ad: 'HMK' },
  { id: 4, tur: 'kanun', numara: '2577', ad: 'İdari Yargılama Usulü Kanunu', kisa_ad: 'İYUK' },
  { id: 5, tur: 'kanun', numara: '3194', ad: 'İmar Kanunu', kisa_ad: null },
  { id: 6, tur: 'kanun', numara: '634', ad: 'Kat Mülkiyeti Kanunu', kisa_ad: 'KMK' },
  { id: 7, tur: 'kanun', numara: '6325', ad: 'Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu', kisa_ad: 'HUAK' },
  { id: 8, tur: 'kanun', numara: '5237', ad: 'Türk Ceza Kanunu', kisa_ad: 'TCK' },
  { id: 9, tur: 'kanun', numara: '6698', ad: 'Kişisel Verilerin Korunması Kanunu', kisa_ad: 'KVKK' },
  { id: 10, tur: 'kanun', numara: '2709', ad: 'Türkiye Cumhuriyeti Anayasası', kisa_ad: 'Anayasa' },
];

const ANONIM_NOT = '<p><em>Metin anonimleştirilmiştir; taraf ve kişi bilgileri çıkarılmıştır.</em></p>';

export const karar: Karar[] = [
  {
    id: 1, mahkeme_id: 4, esas_no: '2024/1111', karar_no: '2025/2222', karar_tarihi: '2025-02-10',
    slug: 'yargitay-3-hd-e-2024-1111-k-2025-2222',
    konu: 'Kira bedelinin tespiti (ÖRNEK, gerçek karar değildir)',
    ozet: 'Beş yılı aşan kira ilişkilerinde kira bedelinin tespitine ilişkin örnek özet.',
    tam_metin: '<p>Davacı kiraya veren, davalı kiracı aleyhine kira bedelinin tespiti istemiyle dava açmıştır. (Yer tutucu.)</p>' + ANONIM_NOT,
    ofis_davasi: false, anonimlestirildi: true, anonimlestirme_zamani: '2026-09-01T10:00:00+03:00',
    durum: 'yayinda', yayin_tarihi: '2026-09-02T09:00:00+03:00', onay_zamani: '2026-09-01T18:00:00+03:00',
  },
  {
    id: 2, mahkeme_id: 6, esas_no: '2023/3333', karar_no: '2024/4444', karar_tarihi: '2024-05-20',
    slug: 'danistay-6-d-e-2023-3333-k-2024-4444',
    konu: 'İmar planı değişikliğinin iptali (ÖRNEK, gerçek karar değildir)',
    ozet: 'Plan değişikliğinin kamu yararına uygunluğunun denetimine ilişkin örnek özet.',
    tam_metin: '<p>Davacı, taşınmazını etkileyen plan değişikliğinin iptalini istemiştir. (Yer tutucu.)</p>' + ANONIM_NOT,
    ofis_davasi: false, anonimlestirildi: true, anonimlestirme_zamani: '2026-08-10T10:00:00+03:00',
    durum: 'yayinda', yayin_tarihi: '2026-08-12T09:00:00+03:00', onay_zamani: '2026-08-11T15:00:00+03:00',
  },
  {
    id: 3, mahkeme_id: 5, esas_no: '2022/5555', karar_no: '2023/6666', karar_tarihi: '2023-03-15',
    slug: 'yargitay-6-hd-e-2022-5555-k-2023-6666',
    konu: 'Kiracının temerrüdü nedeniyle tahliye (ÖRNEK, gerçek karar değildir)',
    ozet: 'Kira bedelinin ödenmemesi nedeniyle tahliye istemine ilişkin örnek özet.',
    tam_metin: '<p>Kiraya veren, kira bedellerinin ödenmemesi nedeniyle tahliye istemiştir. (Yer tutucu.)</p>' + ANONIM_NOT,
    ofis_davasi: true, anonimlestirildi: true, anonimlestirme_zamani: '2026-07-01T10:00:00+03:00',
    durum: 'yayinda', yayin_tarihi: '2026-07-02T09:00:00+03:00', onay_zamani: '2026-07-01T17:00:00+03:00',
  },
  {
    id: 4, mahkeme_id: 1, esas_no: '2021/7777', karar_tarihi: '2022-11-08',
    slug: 'aym-b-2021-7777',
    konu: 'Bireysel başvuru: makul sürede yargılanma hakkı (ÖRNEK, gerçek karar değildir)',
    ozet: 'Uzun süren bir ceza yargılamasında makul süre şikâyetine ilişkin örnek özet.',
    tam_metin: '<p>Başvurucu, hakkındaki ceza yargılamasının makul sürede tamamlanmadığını ileri sürmüştür. (Yer tutucu.)</p>' + ANONIM_NOT,
    ofis_davasi: false, anonimlestirildi: true, anonimlestirme_zamani: '2026-05-01T10:00:00+03:00',
    durum: 'yayinda', yayin_tarihi: '2026-05-04T09:00:00+03:00', onay_zamani: '2026-05-02T12:00:00+03:00',
  },
  {
    id: 5, mahkeme_id: 4, esas_no: '2025/8888', karar_no: '2026/9999', karar_tarihi: '2026-04-01',
    slug: 'yargitay-3-hd-e-2025-8888-k-2026-9999',
    konu: 'Anonimleştirilmemiş taslak karar (ÖRNEK)',
    tam_metin: '<p>Bu metin henüz anonimleştirilmemiştir. (Yer tutucu.)</p>',
    ofis_davasi: false, anonimlestirildi: false,
    durum: 'taslak',
  },
  {
    id: 6, mahkeme_id: 8, esas_no: '2024/1212', karar_no: '2025/1313', karar_tarihi: '2025-06-12',
    slug: 'istanbul-bam-12-hd-e-2024-1212-k-2025-1313',
    konu: 'Arabuluculuk anlaşma belgesinin icra edilebilirliği (ÖRNEK, gerçek karar değildir)',
    ozet: 'İcra edilebilirlik şerhi verilen anlaşma belgesine ilişkin örnek özet.',
    tam_metin: '<p>Taraflar arabuluculuk sonunda anlaşma belgesi düzenlemiştir. (Yer tutucu.)</p>' + ANONIM_NOT,
    ofis_davasi: false, anonimlestirildi: true, anonimlestirme_zamani: '2026-06-01T10:00:00+03:00',
    durum: 'yayinda', yayin_tarihi: '2026-06-03T09:00:00+03:00', onay_zamani: '2026-06-02T11:00:00+03:00',
  },
  {
    id: 7, mahkeme_id: 4, esas_no: '2025/1414', karar_no: '2026/1515', karar_tarihi: '2026-05-05',
    slug: 'yargitay-3-hd-e-2025-1414-k-2026-1515',
    konu: 'Zamanlanmış karar (ÖRNEK, gerçek karar değildir)',
    tam_metin: '<p>Yer tutucu.</p>' + ANONIM_NOT,
    ofis_davasi: false, anonimlestirildi: true, anonimlestirme_zamani: '2026-10-01T10:00:00+03:00',
    durum: 'yayinda', yayin_tarihi: '2027-02-01T09:00:00+03:00', onay_zamani: '2026-10-02T10:00:00+03:00',
  },
  {
    id: 8, mahkeme_id: 4, esas_no: '2025/1616', karar_no: '2026/1717', karar_tarihi: '2026-01-20',
    slug: 'yargitay-3-hd-e-2025-1616-k-2026-1717',
    konu: 'Ayıplı mal nedeniyle bedel indirimi (ÖRNEK, gerçek karar değildir)',
    ozet: 'Satılanın ayıplı çıkması hâlinde alıcının seçimlik haklarına ilişkin örnek özet.',
    tam_metin: '<p>Alıcı, satın aldığı malın ayıplı olduğunu ileri sürerek bedel indirimi istemiştir. (Yer tutucu.)</p>' + ANONIM_NOT,
    ofis_davasi: false, anonimlestirildi: true, anonimlestirme_zamani: '2026-02-01T10:00:00+03:00',
    durum: 'yayinda', yayin_tarihi: '2026-02-03T09:00:00+03:00', onay_zamani: '2026-02-02T16:00:00+03:00',
  },
];

export const karar_mevzuat: KararMevzuat[] = [
  { id: 1, karar_id: 1, mevzuat_id: 1, madde: '344' },
  { id: 2, karar_id: 1, mevzuat_id: 3, madde: null },
  { id: 3, karar_id: 2, mevzuat_id: 5, madde: '8' },
  { id: 4, karar_id: 2, mevzuat_id: 4, madde: '7' },
  { id: 5, karar_id: 3, mevzuat_id: 1, madde: '315' },
  { id: 6, karar_id: 4, mevzuat_id: 10, madde: '36' },
  { id: 7, karar_id: 5, mevzuat_id: 1, madde: '344' },
  { id: 8, karar_id: 6, mevzuat_id: 7, madde: '18' },
  { id: 9, karar_id: 7, mevzuat_id: 1, madde: '299' },
  { id: 10, karar_id: 8, mevzuat_id: 1, madde: '227' },
];

export const karar_etiket: KararEtiket[] = [
  { id: 1, karar_id: 1, etiket_id: 1 },
  { id: 2, karar_id: 2, etiket_id: 2 },
  { id: 3, karar_id: 3, etiket_id: 3 },
  { id: 4, karar_id: 6, etiket_id: 4 },
  { id: 5, karar_id: 8, etiket_id: 6 },
];

export const karar_calisma_alani: KararCalismaAlani[] = [
  { id: 1, karar_id: 1, calisma_alani_id: 6 },
  { id: 2, karar_id: 2, calisma_alani_id: 4 },
  { id: 3, karar_id: 3, calisma_alani_id: 6 },
  { id: 4, karar_id: 4, calisma_alani_id: 3 },
  { id: 5, karar_id: 5, calisma_alani_id: 6 },
  { id: 6, karar_id: 6, calisma_alani_id: 5 },
  { id: 7, karar_id: 7, calisma_alani_id: 6 },
  { id: 8, karar_id: 8, calisma_alani_id: 5 },
];
