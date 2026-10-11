// Mock veri: ekip. KISILER KURGUSALDIR (ilk uc kisi db/ornek_veri.sql'den).
// Bilerek konan durumlar: 7 (Deniz Ünal) pasif (aktif = false, burodan ayrilmis);
// EN biyografisi yalnizca 1, 4, 5'te; 4'un gizli bir alanla (10) bagi var; 1'in cep telefonu gizli.
import type {
  Deneyim, DeneyimCeviri, Egitim, EgitimCeviri, Kisi, KisiCalismaAlani, KisiCeviri, KisiTelefon, KisiYabanciDil,
} from '../lib/tablolar';

export const kisi: Kisi[] = [
  {
    id: 1, slug: 'ayse-yilmaz', ad: 'Ayşe', soyad: 'Yılmaz', unvan_id: 1, avukat_mi: true, arabulucu_mu: true,
    baro_adi: 'İstanbul Barosu', baro_sicil_no: '10001', arabulucu_sicil_no: '20001', meslege_baslama_yili: 2003,
    eposta: 'ayse.yilmaz@ornek.av.tr', aktif: true, siralama: 1,
  },
  {
    id: 2, slug: 'mehmet-kaya', ad: 'Mehmet', soyad: 'Kaya', unvan_id: 4, avukat_mi: true, arabulucu_mu: false,
    baro_adi: 'İstanbul Barosu', baro_sicil_no: '10002', meslege_baslama_yili: 2016,
    eposta: 'mehmet.kaya@ornek.av.tr', aktif: true, siralama: 1,
  },
  {
    id: 3, slug: 'elif-demir', ad: 'Elif', soyad: 'Demir', unvan_id: 5, avukat_mi: false, arabulucu_mu: false,
    aktif: true, siralama: 1,
  },
  {
    id: 4, slug: 'zeynep-celik', ad: 'Zeynep', soyad: 'Çelik', unvan_id: 2, avukat_mi: true, arabulucu_mu: false,
    baro_adi: 'İstanbul Barosu', baro_sicil_no: '10003', meslege_baslama_yili: 2008,
    eposta: 'zeynep.celik@ornek.av.tr', aktif: true, siralama: 1,
  },
  {
    id: 5, slug: 'burak-ozkan', ad: 'Burak', soyad: 'Özkan', unvan_id: 3, avukat_mi: true, arabulucu_mu: true,
    baro_adi: 'İstanbul Barosu', baro_sicil_no: '10004', arabulucu_sicil_no: '20002', meslege_baslama_yili: 2012,
    eposta: 'burak.ozkan@ornek.av.tr', aktif: true, siralama: 1,
  },
  {
    id: 6, slug: 'selin-sahin', ad: 'Selin', soyad: 'Şahin', unvan_id: 4, avukat_mi: true, arabulucu_mu: false,
    baro_adi: 'İstanbul Barosu', baro_sicil_no: '10005', meslege_baslama_yili: 2019,
    eposta: 'selin.sahin@ornek.av.tr', aktif: true, siralama: 2,
  },
  {
    id: 7, slug: 'deniz-unal', ad: 'Deniz', soyad: 'Ünal', unvan_id: 4, avukat_mi: true, arabulucu_mu: false,
    baro_adi: 'İstanbul Barosu', baro_sicil_no: '10006', meslege_baslama_yili: 2014,
    aktif: false, siralama: 3,
  },
  {
    id: 8, slug: 'kerem-isik', ad: 'Kerem', soyad: 'Işık', unvan_id: 4, avukat_mi: true, arabulucu_mu: false,
    baro_adi: 'İstanbul Barosu', baro_sicil_no: '10007', meslege_baslama_yili: 2020,
    eposta: 'kerem.isik@ornek.av.tr', aktif: true, siralama: 4,
  },
];

export const kisi_ceviri: KisiCeviri[] = [
  {
    id: 1, kisi_id: 1, dil: 'tr',
    kisa_biyografi: 'Gayrimenkul ve imar hukuku alanlarında çalışmaktadır; aynı zamanda arabulucudur.',
    biyografi:
      '<p>Gayrimenkul ve imar hukuku alanlarında çalışmaktadır. Hukuk uyuşmazlıklarında arabulucu olarak görev almaktadır.</p>' +
      '<p>Bu biyografi yer tutucudur.</p>',
  },
  {
    id: 2, kisi_id: 1, dil: 'en',
    kisa_biyografi: 'Works on real estate and zoning law; also a registered mediator.',
    biyografi: '<p>Works on real estate and zoning law and acts as a mediator in civil disputes.</p><p>Placeholder biography.</p>',
  },
  {
    id: 3, kisi_id: 2, dil: 'tr',
    kisa_biyografi: 'Borçlar hukuku ve ceza hukuku alanlarında çalışmaktadır.',
    biyografi: '<p>Borçlar hukuku ve ceza hukuku alanlarında çalışmaktadır.</p><p>Bu biyografi yer tutucudur.</p>',
  },
  {
    id: 4, kisi_id: 4, dil: 'tr',
    kisa_biyografi: 'Ticaret hukuku ve borçlar hukuku alanlarında çalışmaktadır.',
    biyografi: '<p>Ticaret hukuku ve borçlar hukuku alanlarında, özellikle şirketler ve ticari sözleşmeler konusunda çalışmaktadır.</p><p>Bu biyografi yer tutucudur.</p>',
  },
  {
    id: 5, kisi_id: 4, dil: 'en',
    kisa_biyografi: 'Works on commercial law and the law of obligations.',
    biyografi: '<p>Works on commercial law and the law of obligations, in particular companies and commercial contracts.</p><p>Placeholder biography.</p>',
  },
  {
    id: 6, kisi_id: 5, dil: 'tr',
    kisa_biyografi: 'Gayrimenkul ve aile hukuku alanlarında çalışmaktadır; aynı zamanda arabulucudur.',
    biyografi: '<p>Gayrimenkul hukuku ve aile hukuku alanlarında çalışmakta, arabulucu olarak görev almaktadır.</p><p>Bu biyografi yer tutucudur.</p>',
  },
  {
    id: 7, kisi_id: 5, dil: 'en',
    kisa_biyografi: 'Works on real estate and family law; also a registered mediator.',
    biyografi: '<p>Works on real estate and family law and acts as a mediator.</p><p>Placeholder biography.</p>',
  },
  {
    id: 8, kisi_id: 6, dil: 'tr',
    kisa_biyografi: 'Aile hukuku ve idare hukuku alanlarında çalışmaktadır.',
    biyografi: '<p>Aile hukuku ve idare hukuku alanlarında çalışmaktadır.</p><p>Bu biyografi yer tutucudur.</p>',
  },
  {
    id: 9, kisi_id: 7, dil: 'tr',
    biyografi: '<p>Borçlar hukuku alanında çalışmıştır.</p>',
  },
  {
    id: 10, kisi_id: 8, dil: 'tr',
    kisa_biyografi: 'Ceza hukuku ve idare hukuku alanlarında çalışmaktadır.',
    biyografi: '<p>Ceza hukuku ve idare hukuku alanlarında çalışmaktadır.</p><p>Bu biyografi yer tutucudur.</p>',
  },
];

export const kisi_telefon: KisiTelefon[] = [
  { id: 1, kisi_id: 1, tur: 'dahili', numara: '101', sitede_goster: true, sira: 1 },
  { id: 2, kisi_id: 1, tur: 'cep', numara: '+905320000001', sitede_goster: false, sira: 2 },
  { id: 3, kisi_id: 2, tur: 'dahili', numara: '102', sitede_goster: true, sira: 1 },
  { id: 4, kisi_id: 4, tur: 'dahili', numara: '103', sitede_goster: true, sira: 1 },
  { id: 5, kisi_id: 4, tur: 'sabit', numara: '+902120000003', sitede_goster: true, sira: 2 },
  { id: 6, kisi_id: 5, tur: 'dahili', numara: '104', sitede_goster: true, sira: 1 },
  { id: 7, kisi_id: 6, tur: 'dahili', numara: '105', sitede_goster: true, sira: 1 },
  { id: 8, kisi_id: 7, tur: 'dahili', numara: '106', sitede_goster: true, sira: 1 },
  { id: 9, kisi_id: 8, tur: 'dahili', numara: '107', sitede_goster: true, sira: 1 },
];

export const kisi_yabanci_dil: KisiYabanciDil[] = [
  { id: 1, kisi_id: 1, dil_kodu: 'en', sira: 1 },
  { id: 2, kisi_id: 1, dil_kodu: 'de', sira: 2 },
  { id: 3, kisi_id: 2, dil_kodu: 'en', sira: 1 },
  { id: 4, kisi_id: 3, dil_kodu: 'fr', sira: 1 },
  { id: 5, kisi_id: 4, dil_kodu: 'en', sira: 1 },
  { id: 6, kisi_id: 4, dil_kodu: 'fr', sira: 2 },
  { id: 7, kisi_id: 5, dil_kodu: 'en', sira: 1 },
  { id: 8, kisi_id: 5, dil_kodu: 'ar', sira: 2 },
  { id: 9, kisi_id: 6, dil_kodu: 'en', sira: 1 },
  { id: 10, kisi_id: 8, dil_kodu: 'en', sira: 1 },
  { id: 11, kisi_id: 8, dil_kodu: 'es', sira: 2 },
];

export const kisi_calisma_alani: KisiCalismaAlani[] = [
  { id: 1, kisi_id: 1, calisma_alani_id: 4 },
  { id: 2, kisi_id: 1, calisma_alani_id: 6 },
  { id: 3, kisi_id: 2, calisma_alani_id: 3 },
  { id: 4, kisi_id: 2, calisma_alani_id: 5 },
  { id: 5, kisi_id: 4, calisma_alani_id: 9 },
  { id: 6, kisi_id: 4, calisma_alani_id: 5 },
  { id: 7, kisi_id: 4, calisma_alani_id: 10 },
  { id: 8, kisi_id: 5, calisma_alani_id: 6 },
  { id: 9, kisi_id: 5, calisma_alani_id: 8 },
  { id: 10, kisi_id: 6, calisma_alani_id: 8 },
  { id: 11, kisi_id: 6, calisma_alani_id: 7 },
  { id: 12, kisi_id: 7, calisma_alani_id: 5 },
  { id: 13, kisi_id: 8, calisma_alani_id: 3 },
  { id: 14, kisi_id: 8, calisma_alani_id: 7 },
];

export const egitim: Egitim[] = [
  { id: 1, kisi_id: 1, baslangic_yili: 1998, bitis_yili: 2002, sira: 1 },
  { id: 2, kisi_id: 1, baslangic_yili: 2004, bitis_yili: 2006, sira: 2 },
  { id: 3, kisi_id: 2, baslangic_yili: 2010, bitis_yili: 2014, sira: 1 },
  { id: 4, kisi_id: 3, baslangic_yili: 2020, bitis_yili: 2024, sira: 1 },
  { id: 5, kisi_id: 4, baslangic_yili: 2002, bitis_yili: 2006, sira: 1 },
  { id: 6, kisi_id: 4, baslangic_yili: 2007, bitis_yili: 2008, sira: 2 },
  { id: 7, kisi_id: 5, baslangic_yili: 2006, bitis_yili: 2010, sira: 1 },
  { id: 8, kisi_id: 6, baslangic_yili: 2013, bitis_yili: 2017, sira: 1 },
  { id: 9, kisi_id: 7, baslangic_yili: 2008, bitis_yili: 2012, sira: 1 },
  { id: 10, kisi_id: 8, baslangic_yili: 2014, bitis_yili: 2018, sira: 1 },
];

export const egitim_ceviri: EgitimCeviri[] = [
  { id: 1, egitim_id: 1, dil: 'tr', okul_adi: 'Örnek Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
  { id: 2, egitim_id: 1, dil: 'en', okul_adi: 'Örnek University', bolum_adi: 'Faculty of Law', derece: 'LL.B.' },
  { id: 3, egitim_id: 2, dil: 'tr', okul_adi: 'Örnek Üniversitesi', bolum_adi: 'Kamu Hukuku', derece: 'Yüksek Lisans' },
  { id: 4, egitim_id: 2, dil: 'en', okul_adi: 'Örnek University', bolum_adi: 'Public Law', derece: 'LL.M.' },
  { id: 5, egitim_id: 3, dil: 'tr', okul_adi: 'Deneme Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
  { id: 6, egitim_id: 4, dil: 'tr', okul_adi: 'Deneme Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
  { id: 7, egitim_id: 5, dil: 'tr', okul_adi: 'Örnek Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
  { id: 8, egitim_id: 5, dil: 'en', okul_adi: 'Örnek University', bolum_adi: 'Faculty of Law', derece: 'LL.B.' },
  { id: 9, egitim_id: 6, dil: 'tr', okul_adi: 'Deneme Üniversitesi', bolum_adi: 'Ticaret Hukuku', derece: 'LL.M.' },
  { id: 10, egitim_id: 6, dil: 'en', okul_adi: 'Deneme University', bolum_adi: 'Commercial Law', derece: 'LL.M.' },
  { id: 11, egitim_id: 7, dil: 'tr', okul_adi: 'Deneme Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
  { id: 12, egitim_id: 7, dil: 'en', okul_adi: 'Deneme University', bolum_adi: 'Faculty of Law', derece: 'LL.B.' },
  { id: 13, egitim_id: 8, dil: 'tr', okul_adi: 'Örnek Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
  { id: 14, egitim_id: 9, dil: 'tr', okul_adi: 'Örnek Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
  { id: 15, egitim_id: 10, dil: 'tr', okul_adi: 'Deneme Üniversitesi', bolum_adi: 'Hukuk Fakültesi', derece: 'Lisans' },
];

export const deneyim: Deneyim[] = [
  { id: 1, kisi_id: 1, firma_adi: 'Örnek Holding A.Ş.', baslangic_yili: 2006, bitis_yili: 2012, sira: 1 },
  { id: 2, kisi_id: 2, firma_adi: 'Deneme Avukatlık Bürosu', baslangic_yili: 2015, bitis_yili: 2020, sira: 1 },
  { id: 3, kisi_id: 4, firma_adi: 'Deneme Avukatlık Bürosu', baslangic_yili: 2008, bitis_yili: 2014, sira: 1 },
  { id: 4, kisi_id: 5, firma_adi: 'Örnek Yatırım A.Ş.', baslangic_yili: 2012, bitis_yili: 2016, sira: 1 },
];

export const deneyim_ceviri: DeneyimCeviri[] = [
  { id: 1, deneyim_id: 1, dil: 'tr', pozisyon: 'Hukuk Müşaviri' },
  { id: 2, deneyim_id: 1, dil: 'en', pozisyon: 'Legal Counsel' },
  { id: 3, deneyim_id: 2, dil: 'tr', pozisyon: 'Avukat' },
  { id: 4, deneyim_id: 3, dil: 'tr', pozisyon: 'Avukat' },
  { id: 5, deneyim_id: 3, dil: 'en', pozisyon: 'Associate' },
  { id: 6, deneyim_id: 4, dil: 'tr', pozisyon: 'Şirket Avukatı' },
  { id: 7, deneyim_id: 4, dil: 'en', pozisyon: 'In-house Lawyer' },
];
