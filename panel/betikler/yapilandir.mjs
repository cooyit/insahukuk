// Panel yapilandirmasini (yapilandirma/*.mjs) calisan Directus'a REST ile uygular.
// Tekrar calistirilabilir: var olan ayar yeniden yazilir, eksik olan olusturulur.
//
// Lisans: once /license okunur. Yapilandirilmis koleksiyon sayisi siniri asmayacak sekilde uygulanir;
// sigmayan koleksiyonlar "lisans bekliyor" diye raporlanir. Sinir asilirsa Directus kurulumu
// kilitler (icerik API'si kapanir), bu yuzden sinir burada once hesaplanir.
import { fileURLToPath } from 'node:url';
import { alanMeta, OZEL } from '../yapilandirma/alanlar.mjs';
import { BIRE_COK, CEVIRILER, COKA_COK } from '../yapilandirma/iliskiler.mjs';
import { CEVIRI_SABLONLARI, KLASORLER, KOLEKSIYONLAR, META_ALMAYANLAR } from '../yapilandirma/koleksiyonlar.mjs';
import { ozelKuralMi, POLITIKALAR, ROLLER } from '../yapilandirma/yetkiler.mjs';
import { AKISLAR } from '../yapilandirma/akislar.mjs';
import { envOku } from './ortak.mjs';

export async function baglan(url, eposta, sifre) {
  const giris = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: eposta, password: sifre }),
  });
  if (!giris.ok) throw new Error(`Directus girisi basarisiz (${giris.status})`);
  const token = (await giris.json()).data.access_token;
  return async function api(yontem, yol, govde, { hataSerbest = false } = {}) {
    const yanit = await fetch(`${url}${yol}`, {
      method: yontem,
      headers: { authorization: `Bearer ${token}`, ...(govde ? { 'content-type': 'application/json' } : {}) },
      body: govde ? JSON.stringify(govde) : undefined,
    });
    const metin = await yanit.text();
    const veri = metin ? JSON.parse(metin) : null;
    if (!yanit.ok && !hataSerbest) throw new Error(`${yontem} ${yol} -> ${yanit.status}: ${metin.slice(0, 500)}`);
    return { durum: yanit.status, veri: veri?.data, hata: veri?.errors };
  };
}

// --- koleksiyonlar ---

function koleksiyonMeta(k) {
  // liste/listeSira/ceviriSablonu bu projenin anahtarlari; Directus meta'sina gitmez.
  const { tr, collection, liste, listeSira, ceviriSablonu, ...meta } = k;
  return {
    ...meta,
    translations: [{ language: 'tr-TR', translation: tr[1], singular: tr[0], plural: tr[1] }],
  };
}

// Lisans sinirina gore hangi kayitlarin (koleksiyon, akis) uygulanacagi. Zaten sayilan olan sayaci
// artirmaz; yenisi ancak sinir asilmayacaksa eklenir. sinir -1: sinirsiz.
export function sinirPlani(adlar, yapilandirilmis, sinir, kullanilan) {
  const plan = { uygula: [], bekleyen: [], kullanilan };
  for (const ad of adlar) {
    if (!yapilandirilmis.has(ad)) {
      if (sinir !== -1 && plan.kullanilan + 1 > sinir) {
        plan.bekleyen.push(ad);
        continue;
      }
      plan.kullanilan++;
    }
    plan.uygula.push(ad);
  }
  return plan;
}

async function koleksiyonlariUygula(api, rapor) {
  const mevcut = new Map((await api('GET', '/collections')).veri.map((c) => [c.collection, c]));
  const lisans = (await api('GET', '/license')).veri;
  const sinir = lisans.entitlements.collections.limit; // -1: sinirsiz
  rapor.lisans = {
    ad: lisans.name,
    durum: lisans.status,
    koleksiyonSiniri: sinir,
    ozelYetkiKurali: !!lisans.entitlements.custom_permission_rules_enabled?.default,
    akisSiniri: lisans.entitlements.flows.limit,
  };

  // Klasorler (schema: null) lisans sayacina girmez.
  for (const k of KLASORLER) {
    const meta = { icon: k.icon, sort: k.sort, collapse: 'open', translations: [{ language: 'tr-TR', translation: k.tr }] };
    if (mevcut.has(k.collection)) await api('PATCH', `/collections/${k.collection}`, { meta });
    else await api('POST', '/collections', { collection: k.collection, schema: null, meta });
  }

  // Directus yalnizca durumu "active" olani sayar; lisans asiminda pasiflestirilmis (inactive)
  // koleksiyon sayilmaz, yeniden acilmasi gerekir.
  const aktif = new Set([...mevcut.values()].filter((c) => c.meta && c.meta.status === 'active').map((c) => c.collection));
  const plan = sinirPlani(KOLEKSIYONLAR.map((k) => k.collection), aktif, sinir, lisans.usage.collections);
  for (const k of KOLEKSIYONLAR.filter((x) => plan.uygula.includes(x.collection))) {
    // Aktif koleksiyonda "status" bilerek gonderilmez: Directus status:"active" iceren her guncellemeyi
    // sayaca +1 olarak denetliyor; sinirdayken zaten aktif olanin guncellemesi de reddedilirdi.
    // Aktif olmayan (yeni ya da pasif) icin gonderilir: plan onu zaten sayaca ekledi.
    const meta = aktif.has(k.collection) ? koleksiyonMeta(k) : { ...koleksiyonMeta(k), status: 'active' };
    await api('PATCH', `/collections/${k.collection}`, { meta });
    rapor.koleksiyonlar.push(k.collection);
  }
  rapor.lisansBekleyen.push(...plan.bekleyen);
  rapor.lisans.kullanilanKoleksiyon = plan.kullanilan;
}

// --- alanlar ---

// Formdaki sira: tablo sutunlari veritabanindaki sirayla (1..), iliski alanlari onlardan sonra
// (500+), kim/ne zaman alanlari en sonda (900+). Editor once icerigi gorsun.
const DENETIM_ALANLARI = ['onaylayan', 'onay_zamani', 'olusturan', 'guncelleyen', 'olusturma_zamani', 'guncelleme_zamani'];
const ILISKI_SIRA_BASI = 500;

async function alanlariUygula(api, rapor) {
  const tablolar = new Set([...KOLEKSIYONLAR.map((k) => k.collection), ...META_ALMAYANLAR]);
  const alanlar = (await api('GET', '/fields')).veri.filter((f) => tablolar.has(f.collection) && f.schema);
  const sutunSirasi = new Map();
  for (const alan of alanlar) {
    const sira = (sutunSirasi.get(alan.collection) ?? 0) + 1;
    sutunSirasi.set(alan.collection, sira);
    const denetim = DENETIM_ALANLARI.indexOf(alan.field);
    const meta = {
      ...alanMeta(alan.collection, alan),
      sort: denetim >= 0 ? 900 + denetim : sira,
      ...OZEL[`${alan.collection}.${alan.field}`],
    };
    await api('PATCH', `/fields/${alan.collection}/${alan.field}`, { meta });
    rapor.alanSayisi++;
  }
}

// --- iliskiler ---

// Iliski alanlarinin formdaki sirasi: her tabloda cagrilma sirasiyla (ceviriler, bire-cok, coka-cok).
const iliskiSirasi = new Map();

async function aliasAlani(api, tablo, alan, ayar) {
  const sira = (iliskiSirasi.get(tablo) ?? ILISKI_SIRA_BASI) + 1;
  iliskiSirasi.set(tablo, sira);
  const meta = { ...ayar, sort: sira };
  const var_ = await api('GET', `/fields/${tablo}/${alan}`, undefined, { hataSerbest: true });
  if (var_.durum === 200) await api('PATCH', `/fields/${tablo}/${alan}`, { meta });
  else await api('POST', `/fields/${tablo}`, { field: alan, type: 'alias', schema: null, meta });
}

function tr(etiket) {
  return [{ language: 'tr-TR', translation: etiket }];
}

async function iliskileriUygula(api, rapor) {
  iliskiSirasi.clear();
  for (const ana of CEVIRILER) {
    const tablo = `${ana}_ceviri`;
    await aliasAlani(api, ana, 'ceviriler', {
      special: ['translations'],
      interface: 'translations',
      options: { languageField: 'ad', defaultLanguage: 'tr', userLanguage: false, defaultOpenSplitView: false },
      display: 'translations',
      display_options: { template: CEVIRI_SABLONLARI[ana] ?? null, languageField: 'ad', defaultLanguage: 'tr', userLanguage: false },
      translations: tr('Çeviriler (Türkçe zorunlu)'),
      note: 'Türkçe çeviri zorunlu; İngilizce isteğe bağlı.',
    });
    await api('PATCH', `/relations/${tablo}/${ana}_id`, { meta: { one_field: 'ceviriler', junction_field: 'dil', one_deselect_action: 'delete' } });
    await api('PATCH', `/relations/${tablo}/dil`, { meta: { junction_field: `${ana}_id` } });
    rapor.iliskiSayisi++;
  }

  for (const b of BIRE_COK) {
    await aliasAlani(api, b.ana, b.alan, {
      special: ['o2m'],
      interface: 'list-o2m',
      options: { template: b.sablon, enableSelect: false },
      translations: tr(b.tr),
    });
    await api('PATCH', `/relations/${b.tablo}/${b.fk}`, { meta: { one_field: b.alan, one_deselect_action: b.silme, sort_field: b.sira ?? null } });
    rapor.iliskiSayisi++;
  }

  for (const m of COKA_COK) {
    await aliasAlani(api, m.ana, m.alan, {
      special: [m.dosya ? 'files' : 'm2m'],
      interface: m.dosya ? 'files' : 'list-m2m',
      options: m.dosya ? null : { template: m.hedefSablon, enableCreate: false },
      translations: tr(m.tr),
    });
    // Ara tablodaki satir kaldirilinca silinir (bag satiri tek basina anlamsiz).
    await api('PATCH', `/relations/${m.ara}/${m.anaFk}`, { meta: { one_field: m.alan, junction_field: m.hedefFk, one_deselect_action: 'delete', sort_field: m.sira ?? null } });
    await api('PATCH', `/relations/${m.ara}/${m.hedefFk}`, { meta: { junction_field: m.anaFk } });
    rapor.iliskiSayisi++;
  }
}

// --- liste gorunumleri ---

// Herkes icin varsayilan liste sutunlari: kullanici ve rolu bos, yer imi olmayan preset.
// (Bu, yetki kurallarindaki "presets"ten farkli; lisans sinirina girmez.)
async function listeleriUygula(api, rapor) {
  const mevcut = (await api('GET', '/presets?filter[user][_null]=true&filter[role][_null]=true&filter[bookmark][_null]=true&limit=-1')).veri;
  for (const k of KOLEKSIYONLAR.filter((x) => x.liste && rapor.koleksiyonlar.includes(x.collection))) {
    const govde = {
      collection: k.collection,
      layout: 'tabular',
      layout_query: { tabular: { fields: k.liste, sort: k.listeSira ?? null, page: 1 } },
      user: null,
      role: null,
      bookmark: null,
    };
    const var_ = mevcut.find((p) => p.collection === k.collection);
    if (var_) await api('PATCH', `/presets/${var_.id}`, govde);
    else await api('POST', '/presets', govde);
  }
}

// --- roller ve yetkiler ---

async function adlaBul(api, yol, ad) {
  return (await api('GET', `${yol}?filter[name][_eq]=${encodeURIComponent(ad)}&limit=1`)).veri[0] ?? null;
}

async function politikaUygula(api, p) {
  const govde = { name: p.ad, description: p.aciklama, icon: p.icon, admin_access: false, app_access: true, enforce_tfa: p.enforce_tfa };
  const var_ = await adlaBul(api, '/policies', p.ad);
  const politika = var_ ? (await api('PATCH', `/policies/${var_.id}`, govde)).veri : (await api('POST', '/policies', govde)).veri;
  // Tekrar calistirilabilirlik: politikanin yetkileri tanimdaki haliyle yeniden yazilir. Once yeniler
  // eklenir, sonra eskiler silinir: ekleme basarisiz olursa editor yetkisiz kalmaz (kod incelemesi).
  // Tam satir okunmali: "fields=id" ile Directus'un ozel kural suzgeci filtreli onerilen satirlari
  // da gizliyor; onlar silinmeyip her calistirmada bir kez daha ekleniyordu (testte yakalandi).
  const eski = (await api('GET', `/permissions?filter[policy][_eq]=${politika.id}&limit=-1`)).veri.map((x) => x.id);
  await api('POST', '/permissions', p.yetkiler.map((y) => ({
    policy: politika.id,
    collection: y.collection,
    action: y.action,
    fields: y.fields ?? null,
    permissions: y.permissions ?? null,
    validation: y.validation ?? null,
    presets: y.presets ?? null,
  })));
  if (eski.length) await api('DELETE', '/permissions', eski);
  return politika.id;
}

async function rolUygula(api, r, politikaId) {
  const var_ = await adlaBul(api, '/roles', r.ad);
  const rol = var_ ? (await api('PATCH', `/roles/${var_.id}`, { name: r.ad, icon: r.icon })).veri : (await api('POST', '/roles', { name: r.ad, icon: r.icon })).veri;
  const bag = (await api('GET', `/access?filter[role][_eq]=${rol.id}&filter[policy][_eq]=${politikaId}&limit=1`)).veri;
  if (!bag.length) await api('POST', '/access', { role: rol.id, policy: politikaId });
}

async function yetkileriUygula(api, rapor) {
  const ozelKuralSerbest = rapor.lisans.ozelYetkiKurali;
  const politikaIdleri = new Map();
  for (const p of POLITIKALAR) {
    if (p.lisansGerekir && !ozelKuralSerbest) {
      rapor.lisansBekleyenYetki.push(p.ad);
      continue;
    }
    // Son guvence: lisanssizken ozel kural iceren tek satir bile kurulumu kilitler; gonderilmeden dur.
    const ozel = p.yetkiler.filter(ozelKuralMi);
    if (ozel.length && !ozelKuralSerbest) {
      throw new Error(`${p.ad}: lisans ozel yetki kuralina izin vermiyor: ${ozel.map((y) => `${y.collection}.${y.action}`).join(', ')}`);
    }
    politikaIdleri.set(p.ad, await politikaUygula(api, p));
    rapor.politikalar.push(p.ad);
  }
  for (const r of ROLLER) {
    const politikaId = politikaIdleri.get(r.politika);
    if (!politikaId) continue;
    await rolUygula(api, r, politikaId);
    rapor.roller.push(r.ad);
  }
}

// --- akislar ---

async function akislariUygula(api, rapor) {
  const lisans = (await api('GET', '/license')).veri;
  const mevcut = (await api('GET', '/flows?limit=-1&fields=id,name,status,operations.id')).veri;
  const aktif = new Set(mevcut.filter((a) => a.status === 'active').map((a) => a.name));
  const plan = sinirPlani(AKISLAR.map((a) => a.ad), aktif, lisans.entitlements.flows.limit, lisans.usage.flows);
  for (const a of AKISLAR.filter((x) => plan.uygula.includes(x.ad))) {
    const govde = { name: a.ad, icon: a.icon, description: a.aciklama, trigger: a.trigger, options: a.options, accountability: 'activity' };
    const var_ = mevcut.find((x) => x.name === a.ad);
    let akis;
    if (var_) {
      // Aktif akista "status" bilerek gonderilmez (sayac +1 denetimi). Pasif akis (elle kapatilmis ya da
      // lisans asiminda pasiflestirilmis) yeniden acilir; plan onu zaten sayaca ekledi. Kapali kalan
      // onay akisi editorun yayina almasini engellerdi (kod incelemesi).
      const durum = aktif.has(a.ad) ? {} : { status: 'active' };
      akis = (await api('PATCH', `/flows/${var_.id}`, { ...govde, ...durum, operation: null })).veri;
      const eski = var_.operations.map((o) => o.id);
      if (eski.length) await api('DELETE', '/operations', eski);
    } else {
      akis = (await api('POST', '/flows', { ...govde, status: 'active' })).veri;
    }
    const islem = (await api('POST', '/operations', { ...a.islem, flow: akis.id, position_x: 19, position_y: 1 })).veri;
    await api('PATCH', `/flows/${akis.id}`, { operation: islem.id });
    rapor.akislar.push(a.ad);
  }
  rapor.lisansBekleyenAkis.push(...plan.bekleyen);
}

// --- genel ayarlar ---

async function ayarlariUygula(api) {
  await api('PATCH', '/settings', {
    project_name: 'Büro Yönetim Paneli',
    project_descriptor: 'İçerik yönetimi',
    default_language: 'tr-TR',
  });
}

export async function yapilandir(env) {
  const api = await baglan(env.PUBLIC_URL, env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
  const rapor = {
    koleksiyonlar: [], lisansBekleyen: [], alanSayisi: 0, iliskiSayisi: 0, lisans: null,
    politikalar: [], roller: [], lisansBekleyenYetki: [], akislar: [], lisansBekleyenAkis: [],
  };
  await ayarlariUygula(api);
  await koleksiyonlariUygula(api, rapor);
  await alanlariUygula(api, rapor);
  await iliskileriUygula(api, rapor);
  await listeleriUygula(api, rapor);
  await yetkileriUygula(api, rapor);
  await akislariUygula(api, rapor);
  return rapor;
}

// Kurulum ve yapilandirma komutlarinin ortak ozeti. Lisans yuzunden atlanan akis bir UYARI'dir:
// onay akisi olmadan editor yayina alamaz.
export function raporuYaz(rapor) {
  const sinir = rapor.lisans.koleksiyonSiniri === -1 ? 'sinirsiz' : rapor.lisans.koleksiyonSiniri;
  console.log(`Lisans: ${rapor.lisans.ad}; koleksiyon ${rapor.lisans.kullanilanKoleksiyon}/${sinir}, alan ${rapor.alanSayisi}, iliski ${rapor.iliskiSayisi}`);
  if (rapor.lisansBekleyen.length) console.log(`Lisans bekleyen koleksiyonlar: ${rapor.lisansBekleyen.join(', ')}`);
  console.log(`Roller: ${rapor.roller.join(', ') || '-'}${rapor.lisansBekleyenYetki.length ? `; lisans bekleyen: ${rapor.lisansBekleyenYetki.join(', ')}` : ''}`);
  console.log(`Akislar: ${rapor.akislar.join(', ') || '-'}`);
  if (rapor.lisansBekleyenAkis.length) {
    console.warn(`UYARI: lisans siniri yuzunden kurulmayan akislar: ${rapor.lisansBekleyenAkis.join(', ')}. Bunlar olmadan yayina alma veritabani hatasi verir.`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  raporuYaz(await yapilandir(envOku()));
}
