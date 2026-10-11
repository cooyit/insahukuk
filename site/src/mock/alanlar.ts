// Mock veri: iki seviyeli calisma alanlari (db/ornek_veri.sql'deki agacin genisletilmisi).
// Bilerek konan durumlar: 8 (Aile Hukuku) yalnizca TR; 10 (Vergi Hukuku) gizli (gorunur = false).
import type { CalismaAlani, CalismaAlaniCeviri } from '../lib/tablolar';

export const calisma_alani: CalismaAlani[] = [
  { id: 1, ust_alan_id: null, siralama: 1, gorunur: true },
  { id: 2, ust_alan_id: null, siralama: 2, gorunur: true },
  { id: 3, ust_alan_id: 1, siralama: 1, gorunur: true },
  { id: 4, ust_alan_id: 1, siralama: 2, gorunur: true },
  { id: 7, ust_alan_id: 1, siralama: 3, gorunur: true },
  { id: 10, ust_alan_id: 1, siralama: 4, gorunur: false },
  { id: 5, ust_alan_id: 2, siralama: 1, gorunur: true },
  { id: 6, ust_alan_id: 2, siralama: 2, gorunur: true },
  { id: 8, ust_alan_id: 2, siralama: 3, gorunur: true },
  { id: 9, ust_alan_id: 2, siralama: 4, gorunur: true },
];

export const calisma_alani_ceviri: CalismaAlaniCeviri[] = [
  {
    id: 1, calisma_alani_id: 1, dil: 'tr', slug: 'kamu-hukuku', ad: 'Kamu Hukuku',
    ozet: 'Devlet ve idare ile kişiler arasındaki ilişkilerden doğan uyuşmazlıklar.',
    icerik: '<p>Kamu hukuku başlığı altında ceza, imar ve idare hukuku alanlarında çalışmaktayız. Alt alanlara aşağıdan ulaşabilirsiniz.</p>',
  },
  {
    id: 2, calisma_alani_id: 2, dil: 'tr', slug: 'ozel-hukuk', ad: 'Özel Hukuk',
    ozet: 'Kişiler ve şirketler arasındaki sözleşme, mülkiyet ve aile ilişkileri.',
    icerik: '<p>Özel hukuk başlığı altında borçlar, gayrimenkul, aile ve ticaret hukuku alanlarında çalışmaktayız.</p>',
  },
  {
    id: 3, calisma_alani_id: 3, dil: 'tr', slug: 'ceza-hukuku', ad: 'Ceza Hukuku',
    ozet: 'Soruşturma ve kovuşturma aşamalarında hukuki destek.',
    icerik: '<p>Soruşturma ve kovuşturma aşamalarında şüpheli, sanık, mağdur ve katılan vekilliği yapılmaktadır.</p><p>Bu metin yer tutucudur.</p>',
  },
  {
    id: 4, calisma_alani_id: 4, dil: 'tr', slug: 'imar-hukuku', ad: 'İmar Hukuku',
    ozet: 'İmar planları, yapı ruhsatı ve yıkım kararlarına ilişkin uyuşmazlıklar.',
    icerik: '<p>İmar planlarına itiraz, yapı ruhsatı ve yapı kullanma izni süreçleri ile yıkım ve para cezası kararlarına karşı idari yargı yolları.</p><p>Bu metin yer tutucudur.</p>',
  },
  {
    id: 5, calisma_alani_id: 5, dil: 'tr', slug: 'borclar-hukuku', ad: 'Borçlar Hukuku',
    ozet: 'Sözleşmeler, tazminat ve alacak uyuşmazlıkları.',
    icerik: '<p>Sözleşmelerin hazırlanması ve incelenmesi, sözleşmeden doğan alacak ve tazminat davaları.</p><p>Bu metin yer tutucudur.</p>',
  },
  {
    id: 6, calisma_alani_id: 6, dil: 'tr', slug: 'gayrimenkul-hukuku', ad: 'Gayrimenkul Hukuku',
    ozet: 'Tapu, kira, kat mülkiyeti ve kentsel dönüşüm uyuşmazlıkları.',
    icerik: '<p>Tapu iptal ve tescil, kira tespit ve tahliye, kat mülkiyeti ve kentsel dönüşüm süreçleri.</p><p>Bu metin yer tutucudur.</p>',
  },
  {
    id: 7, calisma_alani_id: 7, dil: 'tr', slug: 'idare-hukuku', ad: 'İdare Hukuku',
    ozet: 'İdari işlemlere karşı iptal ve tam yargı davaları.',
    icerik: '<p>İdari işlemlere karşı iptal davaları ve idarenin eylemlerinden doğan tam yargı davaları.</p><p>Bu metin yer tutucudur.</p>',
  },
  {
    id: 8, calisma_alani_id: 8, dil: 'tr', slug: 'aile-hukuku', ad: 'Aile Hukuku',
    ozet: 'Boşanma, velayet, nafaka ve mal rejimi uyuşmazlıkları.',
    icerik: '<p>Boşanma, velayet, nafaka ve mal rejiminin tasfiyesine ilişkin davalar.</p><p>Bu metin yer tutucudur.</p>',
  },
  {
    id: 9, calisma_alani_id: 9, dil: 'tr', slug: 'ticaret-hukuku', ad: 'Ticaret Hukuku',
    ozet: 'Şirketler, ticari sözleşmeler ve ticari alacaklar.',
    icerik: '<p>Şirket kuruluşu ve genel kurul süreçleri, ticari sözleşmeler ve ticari alacakların takibi.</p><p>Bu metin yer tutucudur.</p>',
  },
  {
    id: 10, calisma_alani_id: 10, dil: 'tr', slug: 'vergi-hukuku', ad: 'Vergi Hukuku',
    ozet: 'Vergi tarhiyatı ve cezalarına karşı uyuşmazlıklar.',
  },
  {
    id: 11, calisma_alani_id: 1, dil: 'en', slug: 'public-law', ad: 'Public Law',
    ozet: 'Disputes arising from relations between individuals and the state.',
    icerik: '<p>Under public law we work on criminal, zoning and administrative law.</p>',
  },
  {
    id: 12, calisma_alani_id: 2, dil: 'en', slug: 'private-law', ad: 'Private Law',
    ozet: 'Contract, property and family relations between individuals and companies.',
    icerik: '<p>Under private law we work on the law of obligations, real estate and commercial law.</p>',
  },
  {
    id: 13, calisma_alani_id: 3, dil: 'en', slug: 'criminal-law', ad: 'Criminal Law',
    ozet: 'Legal assistance during investigation and prosecution.',
    icerik: '<p>Representation of suspects, defendants and victims during investigation and trial. Placeholder text.</p>',
  },
  {
    id: 14, calisma_alani_id: 4, dil: 'en', slug: 'zoning-law', ad: 'Zoning Law',
    ozet: 'Disputes on zoning plans, building permits and demolition orders.',
    icerik: '<p>Objections to zoning plans, building permit procedures and administrative remedies against demolition orders. Placeholder text.</p>',
  },
  {
    id: 15, calisma_alani_id: 5, dil: 'en', slug: 'law-of-obligations', ad: 'Law of Obligations',
    ozet: 'Contracts, damages and receivables.',
    icerik: '<p>Drafting and review of contracts; claims for receivables and damages. Placeholder text.</p>',
  },
  {
    id: 16, calisma_alani_id: 6, dil: 'en', slug: 'real-estate-law', ad: 'Real Estate Law',
    ozet: 'Title deeds, leases, condominium and urban renewal disputes.',
    icerik: '<p>Title deed cancellation and registration, rent determination and eviction, condominium and urban renewal. Placeholder text.</p>',
  },
  {
    id: 17, calisma_alani_id: 7, dil: 'en', slug: 'administrative-law', ad: 'Administrative Law',
    ozet: 'Annulment and full remedy actions against administrative acts.',
    icerik: '<p>Annulment actions against administrative acts and full remedy actions. Placeholder text.</p>',
  },
  {
    id: 18, calisma_alani_id: 9, dil: 'en', slug: 'commercial-law', ad: 'Commercial Law',
    ozet: 'Companies, commercial contracts and commercial receivables.',
    icerik: '<p>Company formation and general assemblies, commercial contracts and collection of commercial receivables. Placeholder text.</p>',
  },
];
