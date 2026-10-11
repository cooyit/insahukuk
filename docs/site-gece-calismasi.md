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
| P1 Iskelet | yapilmadi (sirada) |
| P2 Veri modulu ve mock veri | yapilmadi |
| P3 Ekip | yapilmadi |
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
| S1 | Iletisim formu nereye gonderilecek? | a) Sunucuda kucuk bir uc (Node) yazilir, `iletisim_mesaji` tablosuna kaydeder, saklama suresi ve HMAC'li IP semada hazir **(onerilen)** · b) `mailto:` formu: sunucu gerekmez ama kullanicinin e-posta istemcisine bagli, mesaj kaydi ve saklama suresi yok · c) Ucuncu taraf form servisi: yurt disi aktarim, KVKK yuku; onermiyorum | Form `method="post" action="/api/iletisim"` (uc henuz yok). Kucuk bir script gecerli gonderimi durdurup "Form henuz etkin degil, mesajiniz gonderilmedi" der. Sahte "gonderildi" yok |
| S2 | Baro ve arabulucu sicil numarasi profilde gosterilsin mi? (`VERI_MODELI.md` §4) | a) Gosterme; yalnizca baro adi ve "Arabulucu" sifati **(onerilen, buro cevap verene kadar)** · b) Goster: alan semada hazir, tek satir kod | a |
| S3 | Kararlar EN sitede nasil gorunsun? | a) EN menude ve EN sayfalarda kararlar yok **(onerilen)**: dil karisikligi yok · b) EN menude TR kararlar sayfasina baglanti: kullanici habersiz TR'ye duser | a |
| S4 | EN ekip listesi | a) Herkes listede (ad ve unvan dil bagimsiz/cevirili), profil baglantisi yalnizca EN cevirisi olan kiside **(onerilen)** · b) Yalnizca EN cevirisi olanlar listelenir: bazi avukatlar EN'de gorunmez | a |
| S5 | Yasal sayfalarin (KVKK vb.) EN surumu | a) Yok; EN footer TR yasal sayfalara `hreflang="tr"` ile baglanir **(onerilen)**: hukuki metin once TR yazilacak · b) EN taslak sayfa ac: uydurma metin riski | a |
| S6 | Alan adi (canonical, sitemap) | Unvan ve `.av.tr` belli degil (inceleme §7). Gecici: `https://www.example.com` (ayrilmis alan adi). Tek yer: `site/astro.config.mjs` | yer tutucu |
| S7 | Footer'daki "baro bilgisi" | `site_ayar`'da baro alani yok. a) Aktif avukatlarin `kisi.baro_adi` degerlerinden turet **(onerilen, bu gece)** · b) `site_ayar`'a alan ekle (veri modeli onerisi) | a |

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

## Kararlar tablosu

| # | Karar | Gerekce | Kim karar verdi | Plandan sapma mi |
|---|---|---|---|---|
| K1 | Calisma dali `worktree-site-gece` | Oturum izole bir dal acti; main ve veritabani dalina push yasak | ben karar verdim | hayir |
| K2 | 05:35 icin `send_later` yerine oturum zamanlayicisi (`43b28ee8`) | `send_later` yok; en yakin esdeger. Oturum kapanirsa calismaz | ben karar verdim | **evet** (arac farki) |
| K3 | Playwright icin sistem Chrome'u (`CHROMIUM_YOLU`) | `/opt/pw-browsers` yok ve `playwright install` yasak | ben karar verdim | **evet** (ortam farki) |
| K4 | TypeScript 6.0.3 | `@astrojs/check` TS 7'yi desteklemiyor | ben karar verdim | hayir |

---

## Veri modeli onerileri

(Semada olmayan ama sitenin isteyebilecegi alanlar; mock'a eklenmedi.)

- Henuz yok.

## Kapsam disi notlari

- Henuz yok.

---

## Dogrulama

- Son dogrulama: henuz test yok (P0).

---

## Commit aciklamalari

- **P0 Hazirlik:** Ilerleme belgesi acildi: genel cerceve, acik sorular, plan, ortam bilgisi ve 05:35 uyandirmasinin durumu.

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
