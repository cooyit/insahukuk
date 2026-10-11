# Site gece calismasi: Astro + mock veri

**Tarih:** 12-13 Ekim 2026 (gece)
**Dal:** `worktree-site-gece` (main'den acildi; `claude/admiring-mccarthy-c1q56f` fast-forward ile alindi)
**Commit'ler:** her paketin aciklamasi "Commit aciklamalari" bolumunde; hash listesi P9 sonunda eklenir.

---

## Sabah ozeti

> Bu bolum is bittikce guncellenir. Son hali P9'da yazilir.

### 1. Durum

| Paket | Durum |
|---|---|
| P0 Hazirlik | bitti |
| P1 Iskelet | bitti |
| P2 Veri modulu ve mock veri | bitti |
| P3 Ekip | yapilmadi (sirada) |
| P4 Calisma alanlari ve arabuluculuk | yapilmadi |
| P5 Yayinlar | yapilmadi |
| P6 Kararlar | yapilmadi |
| P7 Ana sayfa, hakkimizda, iletisim, yasal sayfalar | yapilmadi |
| P8 Kalite gecisi | yapilmadi |
| P9 Son gozden gecirme | yapilmadi |

---

## P0 Genel cerceve

### Ne anladim

1. `site/` klasorunde Astro 7.3.x ile statik, TR (kok) + EN (`/en/`) bir buro sitesi kurulacak. Veri bu gece veritabanindan degil, `db/schema.sql` tablo/sutun adlarini birebir kullanan mock dosyalarindan gelecek; sayfalar yalnizca tek bir veri modulunu (`site/src/lib/veri.ts`) cagiracak.
2. Hukuki kisitlar (ustunluk dili yok, ucuncu taraf istek yok, kararlar anonim ve yalnizca TR, "X yillik tecrube" yok, form sahte "gonderildi" demez) testlerle korunacak.
3. Is P1-P9 paketlerine bolunecek; her paket testler yesil + commit + push olmadan bitmis sayilmayacak. Bu belge hem sabah raporu hem benim hafizam.
4. Varsayim: "calisma dali" = bu oturumun acilan dali `worktree-site-gece`. `claude/admiring-mccarthy-c1q56f` ve `main`'e push edilmeyecek.

### Kapsam disi (bu gece yapilmayacak)

- Directus, PostgreSQL baglantisi, form gonderme ucu, sunucu/Caddy/systemd/deploy/CI.
- Site ici arama, bulten, kariyer, sektor, acilir duyuru.
- Gercek logo ve kurumsal tasarim.
- `db/`, `docs/inceleme-2026-10-09.md`, `tools/` altinda degisiklik.
- Bellek klasorune yazma.

### Acik sorular (gece "(onerilen)" olan uygulandi; sabah degistirilebilir)

| # | Soru | Secenekler ve sonuclari | Gece uygulanan |
|---|---|---|---|
| S1 | Iletisim formu nereye gonderilecek? | a) Sunucuda kucuk bir uc (Node) yazilir, `iletisim_mesaji` tablosuna kaydeder, saklama suresi ve HMAC'li IP semada hazir **(onerilen)** ; b) `mailto:` formu: sunucu gerekmez ama kullanicinin e-posta istemcisine bagli, mesaj kaydi ve saklama suresi yok ; c) Ucuncu taraf form servisi: yurt disi aktarim, KVKK yuku; onermiyorum | Form `method="post" action="/api/iletisim"` (uc henuz yok). Kucuk bir script gecerli gonderimi durdurup "Form henuz etkin degil, mesajiniz gonderilmedi" der. Sahte "gonderildi" yok |
| S2 | Baro ve arabulucu sicil numarasi profilde gosterilsin mi? (`VERI_MODELI.md` bolum 4) | a) Gosterme; yalnizca baro adi ve "Arabulucu" sifati **(onerilen, buro cevap verene kadar)** ; b) Goster: alan semada hazir, tek satir kod | a |
| S3 | Kararlar EN sitede nasil gorunsun? | a) EN menude ve EN sayfalarda kararlar yok **(onerilen)**: dil karisikligi yok ; b) EN menude TR kararlar sayfasina baglanti: kullanici habersiz TR'ye duser | a |
| S4 | EN ekip listesi | a) Herkes listede (ad ve unvan dil bagimsiz/cevirili), profil baglantisi yalnizca EN cevirisi olan kiside **(onerilen)** ; b) Yalnizca EN cevirisi olanlar listelenir: bazi avukatlar EN'de gorunmez | a |
| S5 | Yasal sayfalarin (KVKK vb.) EN surumu | a) Yok; EN footer TR yasal sayfalara `hreflang="tr"` ile baglanir **(onerilen)**: hukuki metin once TR yazilacak ; b) EN taslak sayfa ac: uydurma metin riski | a |
| S6 | Alan adi (canonical, sitemap) | Unvan ve `.av.tr` belli degil (inceleme bolum 7). Gecici: `https://www.example.com` (ayrilmis alan adi). Tek yer: `site/astro.config.mjs` | yer tutucu |
| S7 | Footer'daki "baro bilgisi" | `site_ayar`'da baro alani yok. a) Aktif avukatlarin `kisi.baro_adi` degerlerinden turet **(onerilen, bu gece)** ; b) `site_ayar`'a alan ekle (veri modeli onerisi) | a |

### Plan

| Paket | Dosyalar | Ne |
|---|---|---|
| P1 | `site/package.json`, `astro.config.mjs`, `tsconfig.json`, `src/layouts/Temel.astro`, `src/styles/global.css`, `src/pages/{index,404,robots.txt}`, `vitest`/`playwright` ayarlari, duman testleri | Iskelet, TR/EN, menu, footer, sitemap |
| P2 | `src/lib/tablolar.ts` (satir tipleri), `src/mock/*.ts`, `src/lib/veri.ts`, `src/lib/html.ts`, `src/lib/bicim.ts`, testler | Mock veri + kurallar + temizleyici |
| P3 | `src/pages/ekip/*`, `src/pages/en/team/*`, bilesenler | Ekip liste/detay |
| P4 | `src/pages/calisma-alanlari/*`, `en/practice-areas/*`, arabuluculuk | Alanlar + arabuluculuk |
| P5 | `src/pages/yayinlar/*`, `en/publications/*`, filtre scripti | Yayinlar |
| P6 | `src/pages/kararlar/*` | Kararlar (yalnizca TR) |
| P7 | ana sayfa, `[sayfa].astro`, iletisim, yasal sayfalar | Sabit sayfalar + form |
| P8 | `test/cikti/*`, `test/e2e/*` | Kapsam dogrulama |
| P9 | bu belge | Inceleme + rapor |

### Ortam

| Ne | Deger |
|---|---|
| `node -v` | v22.12.0 |
| `npm -v` | 10.9.0 |
| Isletim sistemi | macOS (Darwin 27), konteyner degil |
| Chromium | `/opt/pw-browsers` **yok** (talimattaki konteyner varsayimi bu makinede gecerli degil). Sistemde Google Chrome var. `playwright install` calistirilmadi; Playwright `CHROMIUM_YOLU` ortam degiskeni verilirse o tarayiciyi kullanir, verilmezse Playwright'in kendi Chromium'unu arar |
| Astro | npm'de 7.3.x serisinin son yamasi: 7.3.8 |
| TypeScript | 6.0.3 (7.x cikmis ama `@astrojs/check` 0.9.10 yalnizca `^5 || ^6` kabul ediyor) |

### 05:35 uyandirmasi

`send_later` araci (claude-code-remote MCP) bu oturumda **yok**; ToolSearch ile bulunamadi. Yerine oturumun kendi tek seferlik zamanlayicisi kuruldu: **id `43b28ee8`**, `35 5 13 10 *` (13 Ekim 05:35, yerel saat Europe/Istanbul). Fark: bu zamanlayici yalnizca bu oturum aciksa calisir; oturum kapanirsa kaybolur. Mesaj metni talimattaki ile ayni, dal adi `worktree-site-gece`.

---

## P1 Iskelet

**Baslamadan once (Bolum 7 sorulari)**
1. Kaynak: gorev Bolum 3 (Astro 7.3.x tam surum, TR kok + `/en/`, sade CSS, JS en az), Bolum 5 P1; `docs/inceleme` 4.5 (surumler), 6.3 (site haritasi), 7 (KVKK: ucuncu taraf istek yok), 9 (WCAG 2.2 AA).
2. En basit yol: Astro'nun hazir i18n yonlendirmesi + tek yerlesim dosyasi + tek CSS dosyasi. Hamburger menu yerine dar ekranda alt satira kayan menu (JS gerektirmez).
3. Yapmazsam: sonraki paketlerin oturacagi ortak iskelet ve test duzenegi olmaz.
4. Uyum: dis font/CDN yok, sistem font yigini; menu JS'siz calisir.

**Ne:** `site/` altinda Astro 7.3.8 projesi (TypeScript strict), ortak yerlesim (`src/layouts/Temel.astro`), global CSS, TR/EN ana sayfa yer tutuculari, iki dilli 404, `robots.txt`, site haritasi, Vitest + Playwright kurulumu ve ilk testler.

**Neden:** Sonraki her sayfa ayni `<head>` (title, description, canonical, hreflang), ayni "icerige atla", menu, dil secici ve footer'i kullansin; kurallar tek yerde dursun.

**Nasil:**
- `astro.config.mjs`: `i18n` (tr varsayilan, onek yok; en `/en`), `trailingSlash: 'never'` + `build.format: 'file'` (adresler inceleme 6.3'teki gibi `/ekip/ayse-yilmaz`), `@astrojs/sitemap`.
- `Temel.astro`: sayfa yalnizca `baslik`, `aciklama` ve varsa `karsilik` (diger dildeki adres) verir. Canonical'i yerlesim kendisi uretir. `hreflang` yalnizca `karsilik` verilince yazilir. Dil secici karsilik yoksa diger dilin ana sayfasina gider.
- `src/lib/yollar.ts` `temizYol()`: derlemede `Astro.url.pathname` `/en.html` donuyor (format 'file' yuzunden); canonical'in `/en` olmasi icin normallestirilir. Bu bir test ile korunuyor.
- Menu ogeleri `menuOgeleri()`'nde; bir oge ancak sayfasi uretildigi pakette eklenir, boylece hicbir commit'te kirik menu baglantisi olmaz (kirik baglanti testi P1'den beri calisiyor).
- Site adi P1'de gecici olarak yerlesimde yazili; P2'de `site_ayar` mock'una tasinir.
- npm betikleri yalnizca `&&` kullanir (Windows cmd'de de calisir).

**Mimarideki yeri:** Sayfa (`src/pages/*.astro`) -> yerlesim (`Temel.astro`) -> yardimcilar (`metinler.ts`, `yollar.ts`). Veri modulu P2'de gelecek: sayfa -> `veri.ts` -> mock; canlida `veri.ts` -> PostgreSQL.

**Testler (P1):**
| Dosya | Korudugu kural |
|---|---|
| `test/birim/yollar.test.ts` | Tek kanonik adres (`temizYol`), bilinmeyen dil TR'ye duser |
| `test/cikti/seo.test.ts` | Her sayfada `lang`, tek `h1`, `title`, `meta description`, canonical; hreflang iki yonlu |
| `test/cikti/dis-istek.test.ts` | Ucuncu taraf istek yok: script/img/iframe/medya/link/CSS `url()` |
| `test/cikti/baglanti.test.ts` | Ic baglantilar ve `#` hedefleri var |
| `test/e2e/dil.e2e.ts` | Dil secici TR <-> EN; icerige atla ilk Tab'da |
| `test/e2e/erisilebilirlik.e2e.ts` | axe: ciddi/kritik ihlal 0 |

**Karsilasilan sorunlar:**
- `astro preview` Playwright altinda "exited early" verdi. Sebep (Astro kaynak kodu `dist/cli/preview/index.js`): Astro 7 bir kodlama ajani algilarsa preview'i kendiliginden arka plana atiyor. `--ignore-lock` bunu kapatiyor; Playwright komutuna eklendi. Normal terminalde etkisi yok.
- `npm install` uyarisi: `undici@8.11.2` (Astro'nun font ozelligi `unifont` uzerinden) Node >= 22.19 istiyor; bu makinede 22.12. Font ozelligini kullanmadigimiz icin derleme etkilenmedi. Canlida Node 24 olacagi icin sorun degil; yerelde Node 22.19+ onerilir.
- Astro derlemede anonim telemetri gonderiyor (gelistirici makinesinden astro.build'e; site ziyaretcisini etkilemez). Kapatmak icin her makinede bir kez `npx astro telemetry disable`. Kapsam disi notlarina yazildi.

---

## P2 Veri modulu ve mock veri

**Baslamadan once**
1. Kaynak: gorev Bolum 3 "Mock veri" ve "Mimari" maddeleri, Bolum 6 (birim + mock butunluk testleri); `db/schema.sql` (tablo/sutun adlari, CHECK, UNIQUE, REFERENCES, `ic.ceviri_kurali`); `db/ornek_veri.sql` (temel kurgusal veri); `docs/inceleme` 4.3 (zengin metin derlemede temizlenir).
2. En basit yol: tek veri modulu (`veri.ts`) ve duz fonksiyonlar. Arayuz/adaptor/repository yok. Mock tablolari duz TypeScript dizileri; tipleri `tablolar.ts`'de.
3. Yapmazsam: sayfalar kurallari kendileri uygular, kural dagilir; PostgreSQL'e geciste her sayfa degisir.
4. Uyum: kisiler, kararlar, unvan kurgusal; karar konulari "ORNEK" isaretli; numaralar yapay desenli (1111/2222).

**Ne:**
- `src/lib/tablolar.ts`: sema tablolarinin satir tipleri (sutun adlari birebir; yalnizca sitenin okudugu ve kurallarin dayandigi sutunlar).
- `src/mock/*.ts`: 8 kisi (1 pasif), 10 calisma alani (1 gizli, 1 yalnizca TR), 14 yayin (taslak, incelemede, arsiv, ileri tarihli ve EN cevirisi hazir olmayan ornekler dahil), 8 karar (1 anonimlestirilmemis taslak, 1 ileri tarihli), 8 sabit sayfa, site ayari. Buro unvani tek yerde: `site_ayar` -> "Yilmaz Avukatlik Burosu" (kurgusal; sitede Turkce harflerle).
- `src/lib/veri.ts`: sayfalarin cagiracagi fonksiyonlar (`siteAyariGetir`, `ekibiGetir`, `kisiDetaylariGetir`, `calismaAlanlariGetir`, `calismaAlaniDetaylariGetir`, `yayinlariGetir`, `yayinDetaylariGetir`, `kararlariGetir`, `kararDetaylariGetir`, `sayfaGetir`, `sayfalariGetir`) ve yayin kurallari.
- `src/lib/html.ts`: `sanitize-html` ile izin listeli temizleyici; `src/lib/bicim.ts`: tarih, yil, dil adi, telefon, Turkce siralama.
- `public/dosyalar/<uuid>.pdf`: yer tutucu PDF eki (Directus dosyasinin dist'e kopyalanmis hali yerine).
- Footer artik `site_ayar`'dan: unvan, adres, telefon, e-posta, baro, bilgilendirme notu (`src/components/AltBilgi.astro`).

**Neden:** Kurallar tek yerde ve testli olsun; sayfalar yalnizca hazir, temizlenmis, dile gore suzulmus nesneler alsin. Mock'un sema kurallarina uymasi, canliya geciste "mock'ta calisiyordu, veritabani reddetti" durumunu onler.

**Nasil:**
- Fonksiyonlar `async`: canlida veritabani okumasi asenkron olacak; sayfalar bugunden `await` eder, gecis gunu sayfa kodu degismez.
- Her fonksiyonun son parametresi `{ simdi?, tablolar? }`. `simdi` varsayilan olarak derleme zamani; testler sabit tarih verir. `tablolar` yalnizca testlerin kurali ozel veriyle sinamasi icin (ornek: "yayinda ama anonimlestirilmemis karar" semada zaten reddedilir; veri modulu yine de kendi kuralini uygular ve bu ancak ozel veriyle sinanir).
- Disariya tablo satiri degil, sekillendirilmis nesne verilir (`KisiOzet`, `YayinDetay`, ...). `KararDetay`'da bilerek `ofis_davasi` yok; bir test JSON ciktisinda "ofis" gecmedigini dogrular.
- Zengin metin veri modulunde temizlenir; sayfalar `set:html` ile yalnizca temizlenmis metni basar. Icerikteki `h1` `h2`'ye iner (tek h1 kurali). Gorsel etiketi bilerek izinli degil (canlida Directus `/assets` adresi kullanilmayacak).
- EN profil kurali: kisi adi dil bagimsiz oldugu icin semada kisi icin ceviri zorunlulugu yok. "EN cevirisi olan kayit" = `kisi_ceviri`'de `dil = 'en'` satiri olan kisi.
- Ust alani gizli olan alt alan da gizli sayilir.
- Footer'daki baro bilgisi: aktif avukatlarin `kisi.baro_adi` degerlerinden turetilir (S7).
- Tarihler mock'ta ISO metin. Canlida `pg` surucusu `timestamptz`/`date`'i `Date` nesnesine cevirir; ayni sekli korumak icin `pg.types.setTypeParser` ile metin olarak alinmali (tek satir; `tablolariYukle()` icinde).

**Mimarideki yeri:**
```
sayfa (.astro)  ->  src/lib/veri.ts  ->  tablolariYukle()  ->  src/mock/*.ts          (bu gece)
                                                          ->  PostgreSQL, salt okuma   (canli)
                     |-> html.ts (temizleme), bicim.ts (yil), yollar.ts (adresler)
```

**Testler (P2):**
| Dosya | Korudugu kural |
|---|---|
| `test/birim/veri.test.ts` (27) | taslak/incelemede/arsiv/ileri tarihli yayin gorunmez; `simdi` parametresi; EN sayfa yalnizca EN cevirisi varsa; pasif kisi, gizli alan (ve gizli ustun altlari), anonimlestirilmemis karar gorunmez; karar verisinde ofis bilgisi yok; ekip sirasi; gizli telefon; temizlenmis zengin metin |
| `test/birim/bicim.test.ts` (9) | Turkce siralama (Turkceye ozel harflerle baslayan soyadlar), tarih bicimi ve Istanbul saat dilimi (gun/yil kaymasi), `de` -> Almanca/German |
| `test/birim/html.test.ts` (8) | `<script>`, `on*`, `javascript:`/`data:`/`//` silinir; izinli etiketler kalir; h1 -> h2 |
| `test/birim/mock-butunluk.test.ts` (190) | 48 yabanci anahtar, 68 tekil kural, 61 CHECK kurali, iki seviyeli agac, 8 ceviri kurali, kararlar ORNEK isaretli, dosyalar mevcut |
| `test/cikti/yasakli-kelime.test.ts` | TR + EN yasakli kelime yok (metin, title, meta, alt) |
| `test/cikti/alt-bilgi.test.ts` | Her sayfanin footer'inda unvan, adres, telefon, e-posta, baro, bilgilendirme notu |
| `test/cikti/xss.test.ts` | Ciktida `on*` nitelik, `javascript:` baglanti, icerikten gelen script yok (yayin sayfalari P5'te gelince asil anlamini kazanir) |

---

## Kararlar tablosu

| # | Karar | Gerekce | Kim karar verdi | Plandan sapma mi |
|---|---|---|---|---|
| K1 | Calisma dali `worktree-site-gece` | Oturum izole bir dal acti; main ve veritabani dalina push yasak | ben karar verdim | hayir |
| K2 | 05:35 icin `send_later` yerine oturum zamanlayicisi (`43b28ee8`) | `send_later` yok; en yakin esdeger. Oturum kapanirsa calismaz | ben karar verdim | **evet** (arac farki) |
| K3 | Playwright icin sistem Chrome'u (`CHROMIUM_YOLU`) | `/opt/pw-browsers` yok ve `playwright install` yasak | ben karar verdim | **evet** (ortam farki) |
| K4 | TypeScript 6.0.3 | `@astrojs/check` TS 7'yi desteklemiyor | ben karar verdim | hayir |
| K5 | Butun bagimliliklar tam surumle (^ yok), yalniz Astro degil | Sabah ve canlida ayni kurulum; `package-lock.json` da commit'te | ben karar verdim | hayir |
| K6 | Adres bicimi sonda `/` olmadan, `build.format: 'file'` | inceleme 6.3'teki adreslerle birebir; Caddy'de `try_files {path}.html` gerekir | ben karar verdim | hayir |
| K7 | Site haritasi icin `@astrojs/sitemap` (endpoint degil) | Tek satir ayar; uretilen sayfalardan kendisi turetir, elle liste tutulmaz. Bedeli: dosya adi `sitemap.xml` degil `sitemap-index.xml` (+ `sitemap-0.xml`); `robots.txt` buna isaret eder | ben karar verdim | **evet** (dosya adi) |
| K8 | Hamburger menu yok; menu dar ekranda alt satira kayar | JS gerektirmez, klavyeyle dogal calisir; 7 kisa oge icin yeterli | ben karar verdim | hayir |
| K9 | 404 sayfasinda canonical yok, `noindex` var | 404'un kanonik adresi olmaz; testte bu tek istisna | ben karar verdim | hayir |
| K10 | Playwright `--ignore-lock` ile preview | Astro 7'nin ajan algilayinca arka plana gecmesini kapatir | ben karar verdim | hayir |
| K11 | Menu ogesi, sayfasi uretildigi pakette eklenir | Ara commit'lerde kirik baglanti olmasin; kirik baglanti testi P1'den beri acik | ben karar verdim | hayir |
| K12 | Mock TypeScript dizileri (JSON degil), tipleri `tablolar.ts`'de | Sutun adi yazim hatasi derlemede yakalanir | ben karar verdim | hayir |
| K13 | Mock'ta yalnizca sitenin okudugu + kurallarin dayandigi sutunlar | Panel sutunlari (olusturan, guncelleme_zamani ...) sitede kullanilmiyor; canlida SELECT bu listeyle yazilir | ben karar verdim | hayir |
| K14 | Veri fonksiyonlari `async` | Canlida PostgreSQL okumasi asenkron; gecis tek dosyada kalsin | ben karar verdim | hayir |
| K15 | `{ simdi, tablolar }` secenek parametresi | `simdi` gorevde istendi; `tablolar` semanin zaten reddettigi durumlari (anonim olmayan yayindaki karar) sinamak icin | ben karar verdim | hayir |
| K16 | EN profil = `kisi_ceviri`'de EN satiri olan aktif kisi | Kisi icin semada ceviri kurali yok; "EN cevirisi olan kayit" tanimina en yakin | ben karar verdim | hayir |
| K17 | EN tarih bicimi `en-GB` (TR `tr-TR`), ikisi de Europe/Istanbul | EN sayfada Turkce ay adi olmasin; gorev tr-TR'yi TR icin sart koyuyor | ben karar verdim | hayir (yorum) |
| K18 | Temizleyicide `img` yok, `h1` -> `h2` | Directus `/assets` canlida kullanilmayacak; sayfada tek h1 | ben karar verdim | hayir |
| K19 | Yasal sayfalar icin mock'a `kvkk_basvuru` sayfa satiri eklendi | Sema degisikligi degil, veri; `/kvkk-basvuru` sayfasi sayfa tablosundan uretilsin | ben karar verdim | hayir |
| K20 | Yayindaki kitap icin ISBN `9780306406157` (bilinen ornek numara) | Uydurma bir 978-605 numarasi gercek bir kitapla cakisabilir | ben karar verdim | hayir |

---

## Veri modeli onerileri

(Semada olmayan ama sitenin isteyebilecegi alanlar; mock'a eklenmedi. Karar sizde.)

| # | Oneri | Ne kazandirir | Neye mal olur | Yapmazsak |
|---|---|---|---|---|
| V1 | `site_ayar.baro_bilgisi` (ya da `site_ayar_ceviri.baro_bilgisi`) | Footer'daki baro bilgisi buronun istedigi metinle yazilir ("Istanbul Barosu'na kayitlidir" gibi) | Bir sutun + Directus formunda bir alan | Bilgi aktif avukatlarin `kisi.baro_adi`'ndan turetilir (bu gece boyle); avukat yoksa footer'da baro satiri cikmaz |
| V2 | `kisi.eposta_sitede_goster` | Kisi e-postasinin profilde gosterilip gosterilmeyecegi panelden secilir | Bir sutun | Bu gece kisi e-postasi profilde gosterilmiyor (yalnizca buro e-postasi footer'da) |

## Kapsam disi notlari

- Astro telemetrisi: gelistirici makinelerinde ve derleme sunucusunda `npx astro telemetry disable` (ya da `ASTRO_TELEMETRY_DISABLED=1`) onerilir.
- Yerel Node surumu: 22.19+ onerilir (bkz. P1 sorunlar).

---

## Dogrulama

| Paket | `npm run check` | Birim | Cikti (dist) | E2E |
|---|---|---|---|---|
| P1 | 0 hata | 2/2 | 12/12 | 5/5 |
| P2 | 0 hata | 236/236 | 19/19 | 5/5 |

**Bozarak dogrulanan testler:**
| Test | Nasil bozuldu | Sonuc |
|---|---|---|
| `dis-istek.test.ts` (link kaynaklari) | Yerlesime Google Fonts `<link rel="stylesheet">` eklendi | kirmizi, geri alindi |
| `seo.test.ts` (tek h1) | Ana sayfaya ikinci `<h1>` eklendi | kirmizi, geri alindi |
| `baglanti.test.ts` (ic baglanti) | Ana sayfaya `/olmayan-sayfa` baglantisi eklendi | kirmizi, geri alindi |
| `mock-butunluk.test.ts` (FK, CHECK, ceviri kurali) | Mock'ta `yayin_yazar.kisi_id = 99`, etiket slug'i `Kira`, yayin 4'un TR cevirisi `hazir: false` | uc test kirmizi, geri alindi |
| `veri.test.ts` (yayin ve karar kurali) | Ayni bozuk mock + `kararGorunurMu`'dan `anonimlestirildi` sarti silindi | iki test kirmizi, geri alindi |
| `veri.test.ts` (EN sayfa kurali) | `kisiProfilVarMi` her dilde true dondu, `yayinCevirisi`'nden `hazir` sarti silindi | dort test kirmizi, geri alindi |
| `yasakli-kelime.test.ts` | Footer notuna TR "Uzman", EN "award-winning" eklendi | iki test kirmizi, geri alindi |

- Son dogrulama: P2 sonu, 12 Ekim 2026 01:58 (Europe/Istanbul): check 0 hata, birim 236, cikti 19, e2e 5; hepsi yesil.

---

## Commit aciklamalari

- **P0 Hazirlik:** Ilerleme belgesi acildi: genel cerceve, acik sorular, plan, ortam bilgisi ve 05:35 uyandirmasinin durumu.
- **P1 Iskelet:** `site/` altinda Astro 7.3.8 projesi, ortak yerlesim, global CSS, TR/EN yonlendirme, 404, robots ve site haritasi. Vitest (birim + dist) ve Playwright (dil, icerige atla, axe) testleri kuruldu.
- **P2 Veri modulu ve mock veri:** Sema adlariyla birebir mock tablolar, yayin kurallarini tasiyan tek veri modulu, HTML temizleyici ve bicim yardimcilari eklendi; footer site ayarina baglandi. Kurallar birim, mock butunluk ve dist testleriyle korunuyor.

---

## Calistirilan git komutlari

| # | Komut | Aciklama |
|---|---|---|
| 1 | `git status`, `git log --oneline -5`, `git branch -a`, `git remote -v` | Baslangic durumuna bakildi (yalniz okuma). |
| 2 | (arac) `git worktree add ... -b worktree-site-gece` | Oturum araci main'den izole bir calisma kopyasi ve dal acti. |
| 3 | `git fetch origin claude/admiring-mccarthy-c1q56f` | Veritabani dalinin son halini uzaktan indirdi (yerel dallara dokunmaz). |
| 4 | `git merge --ff-only origin/claude/admiring-mccarthy-c1q56f` | Kendi dalimi o dalin ucuna ileri sardi; birlestirme commit'i olusmadi. |
| 5 | `git add docs/site-gece-calismasi.md` | P0 belgesini hazirlik alanina koydu (acik yol; `-A` yok). |
| 6 | `git diff --cached --name-status` | Hazirlik alaninda yalniz bu paketin dosyasi oldugunu kontrol etti. |
| 7 | `git commit -m "Gece calismasi belgesini ac" -m "..."` | P0 commit'i. |
| 8 | `git push -u origin worktree-site-gece` | Dali uzaga ilk kez gonderdi ve izleme baglantisini kurdu. |
| 9 | `git status --short` ve `git status --short --ignored` | P1 dosyalarini ve `.gitignore`'un dist/node_modules'u disladigini kontrol etti. |
| 10 | `git add README.md docs/site-gece-calismasi.md site/.gitignore site/package.json site/package-lock.json site/astro.config.mjs site/tsconfig.json site/playwright.config.ts site/public site/src site/test` | P1 dosyalarini acik yollarla hazirlik alanina koydu. |
| 11 | `git diff --cached --name-status` | Hazirlik alaninda yalniz P1 dosyalari oldugunu kontrol etti. |
| 12 | `git commit -m "Astro iskeletini kur" -m "..."` | P1 commit'i. |
| 13 | `git push origin worktree-site-gece` | P1'i uzaga gonderdi. |
| 14 | `git diff --no-index --stat <yedek> src/lib/veri.ts` | Bozarak dogrulama sirasinda gecici degisikligin yalniz hedef satirlarda oldugunu gordu (depoya dokunmaz). |
| 15 | `git status --short` | P2'de eklenen/degisen dosyalari listeledi. |
| 16 | `git add docs/site-gece-calismasi.md site/src site/public/dosyalar site/test` | P2 dosyalarini acik yollarla hazirlik alanina koydu. |
| 17 | `git diff --cached --name-status` | Hazirlik alaninda yalniz P2 dosyalari oldugunu kontrol etti. |
| 18 | `git commit -m "Veri modulu ve mock veriyi ekle" -m "..."` | P2 commit'i. |
| 19 | `git push origin worktree-site-gece` | P2'yi uzaga gonderdi. |
