# Yonetim paneli (Directus) gece calismasi

**Tarih:** 12 Ekim 2026 (sabah 09:00'dan itibaren; Kaplan uyurken)
**Dal:** `panel-gece` (site calismasinin dali `worktree-site-gece`'nin ucundan, `ebdb1a4`, acildi)
**Commit'ler:** her paketin aciklamasi "Commit aciklamalari" bolumunde; hash listesi is bitince ayri bir belge commit'iyle eklenir.
**Kurallar:** dun gece verilen kurallar aynen (onay yok, kararlar bu belgede; commit/push bende; `db/`, `docs/inceleme-2026-10-09.md`, `tools/` degismez; bellek klasorune yazilmaz; imza satiri yok).

---

## Sabah ozeti

> Is bittikce guncellenir; son hali son pakette yazilir.

| Paket | Durum |
|---|---|
| Q0 Hazirlik | bitti |
| Q1 Yerel kurulum (PostgreSQL 16 + Directus 12.5) | bitti |
| Q2 Koleksiyon ve alan yapilandirmasi | bitti |
| Q3 Roller ve yetkiler | yapilmadi (sirada) |
| Q4 Akislar ve otomatik alanlar | yapilmadi |
| Q5 Son gozden gecirme ve rapor | yapilmadi |

---

## Q0 Genel cerceve

### Ne anladim

1. Yonetim panelini (Directus 12) kurmam isteniyor; dun geceki kurallarla, onay beklemeden.
2. Panel `db/schema.sql`'deki tablolari kullanir; `db/VERI_MODELI.md` bolum 6'daki "Directus kurulumunda yapilacaklar" listesi isin ana kaynagi.
3. Panel yapilandirmasi tekrarlanabilir olmali: elle tiklanan ayar degil, depoda duran kod/JSON ve tek komut.
4. Varsayim: "yonetim paneli" = Directus kurulumu ve yapilandirmasi. Sitenin PostgreSQL'den okumasi (site `tablolariYukle()`) ayri bir is; bu gece kapsam disi, belgeye oneri olarak yazilir.

### Onemli sinir: lisans

`docs/inceleme-2026-10-09.md` bolum 4.3: Directus 12 lisanssiz "Core" katmani en fazla 25 koleksiyon ve 3 kullaniciya izin veriyor, kayit duzeyinde yetki kurali yok. Bizim model 36 tablo. Ucretsiz Open Innovation Grant anahtarina **buro adina** basvurulmali; bu gece yapilamaz. Bu yuzden:
- Panel yapilandirmasi **eksiksiz kod olarak** yazilir.
- Lisanssiz katmanin izin verdigi kadari gercekten uygulanir ve test edilir.
- Lisans gerektiren kisimlar bu belgede ayrica isaretlenir; anahtar `.env`'e girildiginde ayni komut gerisini uygular.
(Sinirlarin tam ayrintisi Q1'de paketin kaynak kodundan okunup buraya yazilacak.)

### Kapsam disi

- Lisans anahtari basvurusu (buro yapacak).
- Sunucu, Caddy, systemd, deploy, yedek, SMTP/e-posta bildirimi.
- Sitenin PostgreSQL'den okumasi, iletisim formu ucu (oneri olarak yazilir).
- `db/` altinda degisiklik; opsiyonel moduller (`db/moduller/`) yuklenmez (VERI_MODELI bolum 4: "kararlar sorulari cevaplaninca", "istenirse").
- Ozel Directus eklentisi (Turkce hata mesajlari icin; VERI_MODELI bolum 6.2) - oneri olarak yazilir.

### Acik sorular (gece "(onerilen)" uygulanir)

| # | Soru | Secenekler ve sonuclari | Gece uygulanan |
|---|---|---|---|
| P1 | PostgreSQL 16 nereden? | a) Homebrew `postgresql@16` **(onerilen)**: mevcut PostgreSQL 14'e dokunmaz, `brew uninstall postgresql@16` ile kalkar; Windows'ta resmi kurulum paketi ; b) Docker: kurulu ama kapali, sunucuda da Docker kullanilmayacak ; c) npm ile gomulu PostgreSQL: ek paket | a (kuruldu, 16.15) |
| P2 | Yerel veritabani nerede? | a) `panel/.veri/` altinda projeye ozel kume, ayri port **(onerilen)**: sistemdeki PostgreSQL'e dokunmaz, silmek klasoru silmek ; b) Homebrew'in varsayilan kumesi | a |
| P3 | Hangi moduller yuklenir? | a) Yalnizca cekirdek sema + ornek veri **(onerilen)**: modullerin hepsi buronun cevabini bekliyor ; b) Hepsi | a |
| P4 | Lisans sinirina takilinca ne olur? | a) Uygulama betigi sinira kadar uygular, kalani "lisans bekliyor" diye raporlar ve hata kodu vermez **(onerilen)** ; b) Hata verip durur | a |

### Plan

| Paket | Ne |
|---|---|
| Q1 | `panel/`: `.env.ornek`, veritabani baslat/durdur/kur betikleri (Node, isletim sisteminden bagimsiz), `directus bootstrap`, `db/schema.sql` + `db/ornek_veri.sql` yukleme, duman testi |
| Q2 | Koleksiyon/alan meta verisi kod olarak: Turkce adlar, gruplar, arayuzler, ceviri alanlari (`one_deselect_action: delete`), dogrulamalar Turkce mesajla, dil listesi; uygulama betigi; testler |
| Q3 | Roller/politikalar: yonetici, editor, yazar; iletisim mesajinda degisiklik kaydi kapali; testler |
| Q4 | `olusturan`/`guncelleyen` ozel alanlari, onay akisi (`onaylayan`/`onay_zamani`), "Yayimla" -> `derleme_isi`; testler |
| Q5 | Bagimsiz inceleme, duzeltmeler, sabah raporu |

### Ortam

| Ne | Deger |
|---|---|
| Node / npm | v22.12.0 / 10.9.0 |
| PostgreSQL | 14.17 kurulu (dokunulmadi); **16.15 Homebrew ile kuruldu** (`/opt/homebrew/opt/postgresql@16/bin`, PATH'e eklenmedi) |
| Directus | 12.5.0 (npm'deki son 12.x), Node >= 22 istiyor |
| Docker | kurulu, kapali; kullanilmadi |
| Sema testleri | `db/test/calistir.sh` PG16 ile: C ve tr-TR ICU yerelinde "TAMAM (44 beklenen ret)". Not: bu makinenin Turkce yereli psql mesajlarini Turkcelestirdigi icin (`CONTEXT` -> `BAGLAM`) `LC_ALL=C` ile calistirilmali; aksi halde yalnizca dil farki goruluyor |

### Uyandirma

Dun gece kurdugum 05:35 uyandirmasi **yanlis gune kurulmustu** (`35 5 13 10 *` = 13 Ekim; dogrusu 12 Ekim'di). Gece is bittigi icin zarar olmadi; bu sabah silindi (`43b28ee8`). Bu calisma icin yeni tek seferlik oturum zamanlayicisi: **id `20618a38`, 12 Ekim 12:35** (Europe/Istanbul). `send_later` hala yok; zamanlayici yalnizca oturum aciksa calisir.

---

## Q1 Yerel kurulum

**Baslamadan once**
1. Kaynak: `db/README.md` "Kurulum sirasi" (createdb -> `directus bootstrap` -> schema.sql -> ornek veri -> Directus'u yeniden baslat), `db/VERI_MODELI.md` bolum 6-7, `docs/inceleme` 4.3 (Directus 12, PostgreSQL 16), 7 (KVKK).
2. En basit yol: Node betikleri + projeye ozel PostgreSQL kumesi. Docker yok (sunucuda da yok). Directus SDK yok; testler Node'un `fetch`'iyle REST cagirir.
3. Yapmazsam: paneli kimse tekrarlanabilir bicimde kuramaz; sonraki paketler test edilemez.
4. Uyum: kume yalnizca 127.0.0.1'i dinler ve parola ister; Directus'ta AI ve MCP kapali.

**Ne:**
- `panel/package.json`: `directus` 12.5.0 (tam surum), `vitest` 5.0.3. Betikler: `kur`, `panel`, `db:baslat`, `db:durdur`, `db:durum`, `test`.
- `panel/.env.ornek`: tum ayarlar; `npm run kur` bundan `.env` uretir ve parolalari/SECRET'i rastgele doldurur. `.env` ve `.veri/` depoya girmez.
- `panel/betikler/ortak.mjs` (yollar, .env, psql), `veritabani.mjs` (kume ac/baslat/durdur), `kur.mjs` (rol + veritabani, `directus bootstrap`, sema + ornek veri; tekrar calistirilabilir).
- `panel/test/hazirlik.mjs`: her test calistirmasinda `insa_test` veritabanini sifirdan kurar ve 8056'da ayri bir Directus acar; gelistirme verisine dokunmaz.
- `panel/test/kurulum.test.mjs` (5 test).

**Nasil:**
- Kume: `initdb --auth=scram-sha-256 --no-locale`, port 54316, `listen_addresses=127.0.0.1`, unix soketi kapali. Ayni davranis macOS, Linux ve Windows'ta; psql her zaman TCP + `PGPASSWORD` ile.
- Directus CLI `node node_modules/directus/cli.js` ile cagriliyor (Windows'ta `.cmd` sorunu olmasin).
- **Bulunan sorun:** Directus `panel/.env` dosyasini surec ortam degiskenlerinin onune koyuyor; test kurulumu once yanlis veritabanina (`insa`) gitti ve `directus_files` bulunamadi. Cozum: her calistirmada `.veri/directus-<veritabani>.env` uretilip `CONFIG_PATH` ile veriliyor.
- `AI_ENABLED=false`, `MCP_ENABLED=false`: Directus 12'de AI asistani ve MCP sunucusu varsayilan olarak acik; icerik ucuncu taraf modele gitmesin.

**Lisans bulgulari (Directus 12.5 kaynak kodundan; `node_modules/@directus/license`, `@directus/api/dist/license`):**

| Sinir (lisanssiz "Core") | Deger | Asilinca |
|---|---|---|
| Yapilandirilmis koleksiyon | 25 | Yenisi `LIMIT_EXCEEDED`. **Sayilan:** `directus_collections` satiri olan, durumu `active` olan, tablosu olan kullanici koleksiyonlari. **Sayilmayan:** meta satiri olmayan ("yalniz veritabani") tablolar; bunlar yine erisilebilir |
| Panel kullanicisi (koltuk) | 3 | Uygulama/yonetici erisimi olan aktif kullanicilar sayilir; yalniz API kullanicisi sayilmaz |
| Aktif akis (flow) | 5 | `LIMIT_EXCEEDED` |
| Ozel yetki kurali | **yok** | Filtreli (`$CURRENT_USER`), alan kisitli, dogrulamali ya da varsayilan degerli her yetki satiri reddedilir; veritabaninda boyle satir varsa **erisim kontrolu onu yok sayar** ve kurulum kilitlenir |
| Telemetri | **zorunlu** | `TELEMETRY=false` yok sayilir; kullanim olcumleri Directus'a gider |
| Gecmis (revizyon/etkinlik) | son 30 gun okunur | Eski satirlar silinmez, gizlenir |
| SSO | yok | |

**Kilit durumu:** Sinir asilmis ya da yasak ozellik veritabaninda varsa kurulum "locked" olur. `/items`, `/files` ve `/assets` kapanir, yonetici disinda kimse giremez. Yalnizca v12'ye **yukseltilen** eski kurulumlara 30 gun mutlet var; yeni kurulumda yok. Gelistirme/deneme modu sinirlari kaldirmiyor.

**Sonuclari:**
- "Avukat yalniz kendi profilini/yazisini duzenler" ve "yazar `durum`'u `yayinda` yapamaz" (VERI_MODELI bolum 6.5) **lisans olmadan kurulamaz**; denemek paneli kilitler. Q3 bu yuzden lisans durumunu okuyup ona gore davranacak.
- 36 tablonun hepsine meta (Turkce ad, arayuz) verilemez; Q2'de hangi tablolarin yapilandirilacagi secilecek, kalanlar "yalniz veritabani" olarak calismaya devam eder.
- Telemetrinin zorunlu olmasi KVKK acisindan lisans icin ayrica bir gerekce.

**Mimarideki yeri:** `panel/betikler/kur.mjs` -> `veritabani.mjs` (PostgreSQL kumesi) -> `directus bootstrap` (Directus tablolari) -> `psql -f db/schema.sql -f db/ornek_veri.sql` (bizim tablolar). Panel: tarayici -> Directus (8055) -> PostgreSQL (54316).

**Testler (Q1):**
| Test | Korudugu kural |
|---|---|
| `kurulum.test.mjs` (5) | Kurulum tek komutla calisir; 36 cekirdek tablo koleksiyon olarak gorunur; ornek veri yuklu; Turkce cevirisiz yayin Directus uzerinden de reddedilir (sema kurali); AI ve MCP kapali |

---

## Q2 Koleksiyon ve alan yapilandirmasi

**Baslamadan once**
1. Kaynak: `db/VERI_MODELI.md` bolum 6 (ceviri alanlari ve `one_deselect_action: delete`; bicim kurallari Turkce mesajla alan dogrulamasina; `olusturan`/`guncelleyen` ozel alanlari; `kisi_yabanci_dil.dil_kodu` acilir liste; iletisim mesajinda degisiklik kaydi kapali), `db/schema.sql` (CHECK'ler, secenek listeleri).
2. En basit yol: yapilandirma duz JS veri dosyalari + REST ile uygulayan tek betik. Directus `schema snapshot/apply` YAML'i yerine: snapshot elle okunmayacak kadar uzun, yetkileri ve lisans siniri hesabini icermiyor.
3. Yapmazsam: panel Ingilizce, alanlar "Ust Alan Id" gibi, ceviriler ayri tablolarda, editor gecersiz slug'i ancak veritabani hatasiyla gorur.
4. Uyum: lisans siniri hesaplanarak uygulanir (asilirsa kurulum kilitlenir); zengin metin arac cubugunda gorsel yok (site `/assets` kullanmayacak).

**Ne:**
- `panel/yapilandirma/koleksiyonlar.mjs`: 5 klasor (Ekip, Icerik, Kararlar, Gelen kutusu, Site) ve 14 ana koleksiyon (Turkce ad, ikon, not, gosterim sablonu, varsayilan liste sutunlari, arsiv alani, `site_ayar` tek kayit, `iletisim_mesaji` degisiklik kaydi kapali).
- `panel/yapilandirma/alanlar.mjs`: ~150 alan icin Turkce etiket; kurallardan varsayilan (gizli kimlik, salt okunur zaman damgalari, `olusturan`/`guncelleyen` otomatik, tek satir/cok satir, evet/hayir, yil sinirlari, dosya ve iliski secicileri); CHECK listelerinden Turkce acilir listeler; slug, e-posta, telefon, https, esas/karar no, ISBN icin Turkce mesajli dogrulama; turune gore gizlenen alanlar (kitap/video/haber); ~50 alan notu (reklam yasagi, KVKK uyarilari dahil).
- `panel/yapilandirma/iliskiler.mjs`: 9 ceviri sekmesi, 8 bire-cok liste (telefonlar, diller, egitim, deneyim, alt alanlar, daireler, yazarlar, mevzuat), 8 coka-cok baglanti (alanlar, etiketler, PDF ekleri, yayin <-> karar).
- `panel/betikler/yapilandir.mjs` (uygulayici), `sunucu.mjs` (Directus'u gecici acar), `sifirla.mjs`; `npm run kur` artik yapilandirmayi da uyguluyor; `npm run yapilandir`, `npm run sifirla` eklendi.

**Nasil (en onemli bulgu ve karar):**
- **Deney (gelistirme orneginde):** ana koleksiyon (kisi) meta aldi, ceviri tablosu (kisi_ceviri) almadi. Ceviri sekmesi API'de ve uygulamada calisti; ic ice kayit yazildi; meta'siz tablonun alanlarina da Turkce ayar verilebildi (alan servisinde lisans denetimi yok). Lisans sayaci yalniz 2 gosterdi.
- **Karar:** 22 ceviri/ara tablo meta almiyor (sayilmiyor) ama alanlari yapilandiriliyor. Boylece 25'lik kotanin 14'u kullaniliyor; 11 yer opsiyonel moduller icin bos.
- Uygulayici once `/license`'i okur; `koleksiyonPlani()` siniri asacak koleksiyonu "lisans bekliyor" diye ayirir. Koleksiyon guncellemesinde `status` bilerek gonderilmiyor: Directus `status: "active"` iceren her guncellemeyi sayaca +1 diye denetliyor.
- Dogrulama: Directus alan dogrulamasini API'de uygular (`FAILED_VALIDATION`, kayit veritabanina gitmez); Turkce mesaji ise yalnizca formda gosterir. Veritabani CHECK'leri yine son guvence.
- Adi ceviri tablosunda olan kayitlarda (alan, etiket, yayin) sablon `{{ceviriler.ad}}` ile ceviriden okuyor; Directus dilleri yan yana yaziyor ("Imar Hukuku, Zoning Law").
- Formda sira: tablo sutunlari, sonra iliski alanlari, en sonda kim/ne zaman alanlari.

**Ekran goruntuleriyle kontrol edildi** (Playwright + sistem Chrome, yerel; goruntuler depoya konmadi): menu Turkce ve klasorlu; kisi formunda ceviri sekmesi, telefonlar ("Dahili: 101"), yabanci diller ("Ingilizce", "Almanca"), egitim, deneyim, calisma alanlari; yayin formunda Turkce tur/durum listeleri, notlar, ceviri sekmesi, yazarlar; listelerde Turkce adlar.

**Bilinen sinirlar (duzeltilmedi, not edildi):**
- Bire-cok sablonunda bos alan "--" yaziyor (yazar listesi: "Mehmet Kaya--", "-- --Can Ozturk"): Directus sablon davranisi.
- Iliski secicilerinde ad tum dillerde yan yana gorunuyor.
- Uygulama ilk giriste "lisans anahtariniz var mi?" ve "proje sahibi belirlenmedi" pencereleri aciyor. Proje sahibi e-postasi MSCL lisans sartlarinin kabulu demek; **buro karar vermeli**, bu gece doldurulmadi.

**Mimarideki yeri:** `npm run kur` -> `kur.mjs` (veritabani + bootstrap + sema) -> `sunucu.mjs` (gecici Directus) -> `yapilandir.mjs` -> Directus REST (`/collections`, `/fields`, `/relations`, `/presets`, `/settings`) -> `directus_*` sistem tablolari. Bizim tablolara (`db/schema.sql`) dokunulmaz.

**Testler (Q2):**
| Test | Korudugu kural |
|---|---|
| `yapilandirma.test.mjs` (16) | Lisans plani (sinirda yeni koleksiyon eklenmez; sinirsizda hepsi); test kurulumu kilitlenmedi ve sayac <= sinir; ikinci calistirma ayni sonucu verir; panel dili tr-TR; Turkce ad + klasor; ceviri tablosu meta'siz; site ayari tek kayit; iletisim mesajinda degisiklik kaydi kapali ve IP gizli; slug/e-posta/telefon bicim hatasi panelde yakalanir ve Turkce mesaji tanimli; yayin + TR/EN ceviri tek istekte; EN ceviri formdan kaldirilinca silinir, TR kaldirilamaz; bire-cok ve coka-cok okunur |

---

## Kararlar tablosu

| # | Karar | Gerekce | Kim karar verdi | Plandan sapma mi |
|---|---|---|---|---|
| L1 | Ayri dal `panel-gece` (site dalinin ucundan) | Panel ayri konu; site isiyle karismasin | ben karar verdim | hayir |
| L2 | PostgreSQL 16 Homebrew ile | Sema 15+ ister (`NULLS NOT DISTINCT`); 14 yetmez | ben karar verdim | hayir |
| L3 | Uyandirma 12:35 (05:35 degil) | Is sabah basladi; 05:35 gecti | ben karar verdim | **evet** (saat) |
| L4 | Kume `panel/.veri/kume`, port 54316, scram parola, yalniz 127.0.0.1 | Sistemdeki PostgreSQL'e dokunmaz; Windows'la ayni davranis | ben karar verdim | hayir |
| L5 | Directus SDK yerine `fetch` | Ek paket gerekmez; testler REST'i dogrudan gorur | ben karar verdim | hayir |
| L6 | Testler her seferinde `insa_test`'i sifirdan kurar | Gelistirme verisi bozulmasin; testler birbirinden bagimsiz | ben karar verdim | hayir |
| L7 | `AI_ENABLED=false`, `MCP_ENABLED=false` | Directus 12'de varsayilan acik; KVKK | ben karar verdim | hayir |
| L8 | Opsiyonel moduller yuklenmedi | Buronun cevabini bekliyor (VERI_MODELI bolum 4) | ben karar verdim | hayir |
| L9 | Yalniz 14 ana koleksiyon meta alir; 22 ceviri/ara tablo meta'siz ama alanlari yapilandirili | Lisans kotasi (25); denendi, calisiyor | ben karar verdim | hayir |
| L10 | Yapilandirma JS veri dosyasi + REST uygulayici (schema snapshot YAML degil) | Okunur, yorumlanabilir; lisans hesabi ve yetkiler snapshot'ta yok | ben karar verdim | hayir |
| L11 | Proje sahibi (MSCL) penceresi doldurulmadi | Lisans sartlarini kabul buronun karari | ben karar verdim | hayir |
| L12 | Panel adi "Buro Yonetim Paneli" (unvan degil) | Unvan henuz belli degil (inceleme bolum 7) | ben karar verdim | hayir |
| L13 | `npm run kur` yapilandirmayi da uygular; Directus'u gecici acar | Tek komut; Directus yeni tablolari ancak acilista gorur | ben karar verdim | hayir |

---

## Veri modeli onerileri

- Henuz yok.

## Kapsam disi notlari

- Henuz yok.

---

## Dogrulama

| Paket | Panel testleri | Not |
|---|---|---|
| Q1 | 5/5 | `db/test/calistir.sh` (PG16, `LC_ALL=C`) iki yerelde TAMAM |
| Q2 | 21/21 | Gelistirme ornegi `npm run sifirla` ile temizlendi (sabahki deney artiklari gitti) |

**Bozarak dogrulanan:**
| Test | Nasil bozuldu | Sonuc |
|---|---|---|
| `kurulum.test.mjs` (AI/MCP kapali) | Test ortaminda `AI_ENABLED=true` | kirmizi, geri alindi |
| `yapilandirma.test.mjs` (KVKK degisiklik kaydi) | `iletisim_mesaji` `accountability: 'all'` | kirmizi, geri alindi |
| `yapilandirma.test.mjs` (lisans plani) | Sinir karsilastirmasi bir fazla sayacak sekilde bozuldu | kirmizi, geri alindi |

- Son dogrulama: Q2 sonu, 12 Ekim 2026 (Europe/Istanbul): panel testleri 21/21 yesil.

---

## Commit aciklamalari

- **Q0 Hazirlik:** Panel calismasinin ilerleme belgesi acildi: cerceve, lisans siniri, acik sorular, plan, ortam ve uyandirma duzeltmesi.
- **Q1 Yerel kurulum:** `panel/` altinda Directus 12.5.0, projeye ozel PostgreSQL 16 kumesi ve tek komutluk kurulum betigi; AI/MCP kapali. Test ortami her calistirmada sifirdan kuruluyor. Lisans sinirlari kaynak koddan cikarilip belgeye yazildi.
- **Q2 Koleksiyon ve alan yapilandirmasi:** Panel kod olarak yapilandirildi: Turkce menu ve klasorler, 14 ana koleksiyon, 266 alanin Turkce etiketi/arayuzu/dogrulamasi, 25 ceviri ve iliski alani, varsayilan listeler. Lisans kotasi hesaplanarak uygulaniyor; ceviri ve ara tablolar kotaya girmiyor. `npm run kur` tek komutta kurup yapilandiriyor.

---

## Calistirilan git komutlari

| # | Komut | Aciklama |
|---|---|---|
| 1 | `git switch -c panel-gece` | Bulunulan commit'ten (`ebdb1a4`) yeni dal acti ve ona gecti. |
| 2 | `git add docs/panel-gece-calismasi.md` | Q0 belgesini hazirlik alanina koydu. |
| 3 | `git diff --cached --name-status` | Hazirlik alaninda yalniz bu dosya oldugunu kontrol etti. |
| 4 | `git commit -m "Panel calismasi belgesini ac" -m "..."` | Q0 commit'i. |
| 5 | `git push -u origin panel-gece` | Yeni dali uzaga ilk kez gonderdi ve izleme baglantisini kurdu. |
| 6 | `git add README.md docs/panel-gece-calismasi.md panel/.gitignore panel/.env.ornek panel/package.json panel/package-lock.json panel/README.md panel/vitest.config.mjs panel/betikler panel/test` | Q1 dosyalarini acik yollarla hazirlik alanina koydu (`.env` ve `.veri/` .gitignore'da). |
| 7 | `git diff --cached --name-status` | Hazirlik alaninda yalniz Q1 dosyalari, `.env` olmadigini kontrol etti. |
| 8 | `git commit -m "Directus yerel kurulumunu ekle" -m "..."` | Q1 commit'i. |
| 9 | `git push origin panel-gece` | Q1'i uzaga gonderdi. |
| 10 | `git diff --no-index --stat <yedek> betikler/yapilandir.mjs` | Bozarak dogrulamada gecici degisikligin tek satir oldugunu gordu (depoya dokunmaz). |
| 11 | `git add docs/panel-gece-calismasi.md panel/package.json panel/README.md panel/betikler panel/yapilandirma panel/test` | Q2 dosyalarini acik yollarla hazirlik alanina koydu. |
| 12 | `git diff --cached --name-status` | Hazirlik alaninda yalniz Q2 dosyalari oldugunu kontrol etti. |
| 13 | `git commit -m "Panel yapilandirmasini kod olarak ekle" -m "..."` | Q2 commit'i. |
| 14 | `git push origin panel-gece` | Q2'yi uzaga gonderdi. |
