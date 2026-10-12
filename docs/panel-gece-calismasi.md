# Yonetim paneli (Directus) gece calismasi

**Tarih:** 12 Ekim 2026 (sabah 09:00'dan itibaren; Kaplan uyurken)
**Dal:** `panel-gece` (site calismasinin dali `worktree-site-gece`'nin ucundan, `ebdb1a4`, acildi)
**Commit'ler:** her paketin aciklamasi "Commit aciklamalari" bolumunde; hash listesi is bitince ayri bir belge commit'iyle eklenir.
**Kurallar:** dun gece verilen kurallar aynen (onay yok, kararlar bu belgede; commit/push bende; `db/`, `docs/inceleme-2026-10-09.md`, `tools/` degismez; bellek klasorune yazilmaz; imza satiri yok).

---

## Sabah ozeti

### 1. Durum

| Paket | Durum |
|---|---|
| Q0 Hazirlik | bitti |
| Q1 Yerel kurulum (PostgreSQL 16 + Directus 12.5) | bitti |
| Q2 Koleksiyon ve alan yapilandirmasi | bitti |
| Q3 Roller ve yetkiler | bitti (Yazar rolu lisans bekliyor) |
| Q4 Akislar ve otomatik alanlar | bitti |
| Q5 Son gozden gecirme ve rapor | bitti |

**En onemli bulgu:** Directus 12'nin lisanssiz katmani bu proje icin kalici olarak yetmez. Yazar rolu ("yalniz kendi icerigi") kurulamiyor, telemetri kapatilamiyor, en fazla 3 panel kullanicisi var. Ucretsiz Open Innovation Grant anahtarina **buro adina basvurulmasi** siradaki en onemli is (inceleme 4.3'teki "devam/dur kapisi"). Panel o zamana kadar yonetici + 2 editorle tam calisir durumda.

### 2. Nasil calistirilir

```
cd panel
npm ci
npm run kur        # .env uretir (parolalar rastgele), PostgreSQL kumesini acar, Directus + sema + ornek veri + yapilandirma
npm run panel      # http://localhost:8055  giris: panel/.env icindeki ADMIN_EMAIL / ADMIN_PASSWORD
npm test           # ayri test veritabani ve ayri Directus ile; 40 test
```

Gereken: Node >= 22.12 ve PostgreSQL 16 programlari (sunucu `panel/.veri`'de acilir). macOS: `brew install postgresql@16`. Windows: PostgreSQL 16 kurulum paketi; `.env`'de `PG_BIN=C:\Program Files\PostgreSQL\16\bin`. Ilk giriste Directus "lisans anahtari" ve "proje sahibi" pencerelerini acar: ilki "Skip", ikincisi "Remind Later" (bkz. acik soru P6).

### 3. Kararlar

Butun kararlar asagidaki "Kararlar tablosu"nda (L1-L22; hepsi "ben karar verdim"). **Plandan sapmalar:** L3 (uyandirma 12:35), L15 (Yazar rolu bu gece uygulanmadi; lisans gerekiyor).

### 4. Acik sorular (sizin icin)

| # | Soru | Secenekler ve sonuclari | Gece uygulanan |
|---|---|---|---|
| P5 | Directus lisansi | a) Buro adina Open Innovation Grant basvurusu (yillik ciro < 5 M$, < 50 calisan) **(onerilen)**: Yazar rolu, telemetri kapatma, sinirsiz koleksiyon/kullanici. Anahtar `PUBLIC_URL`'e bagli, 5 aktivasyon, 12 saatte bir cevrimici dogrulama ; b) Lisanssiz devam: yonetici + 2 editor, avukat bazli yetki yok, telemetri acik ; c) Payload 3'e gecis (inceleme 4.4): lisans yok ama panel yeniden yazilir | b (gecici) |
| P6 | Directus "proje sahibi" e-postasi | MSCL lisans sartlarinin ve veri isleme sozlesmesinin kabulu; bir kisinin e-postasi Directus'a gider. Buro yetkilisi karar vermeli | doldurulmadi |
| P7 | Editor kac kisi? | Lisanssiz en fazla 2 editor (+1 yonetici) | test icin 1 |
| P8 | Yayin onayi: editor dogrudan yayina alabilsin mi? | a) Evet, editor yayinlar; yazar (lisansla) yalniz incelemeye gonderir **(onerilen)** ; b) Yalniz yonetici yayinlar: editorun `durum` alanini kisitlamak ozel kural ister (lisans) | a |

(P1-P4 asagida "Q0 Genel cerceve"de; uygulandilar.)

### 5. En onemli kararlar (Kural 7 sablonu)

**Soru:** Neden 36 tablonun yalnizca 14'u panelde "yapilandirildi"?
**Cevap:** Lisanssiz Directus en fazla 25 yapilandirilmis koleksiyona izin veriyor; ceviri ve ara tablolari meta vermeden, ana kaydin formu icinden duzenlemek mumkun (denendi).
**Basit anlatim:** Bir otoparkta 25 abonelik kartiniz var. Her arabaya kart vermek yerine, yalnizca kapidan giren arabalara kart verdik; yedek lastikler (ceviriler) arabanin icinde zaten geliyor.
**Neden:** 25 asilirsa Directus kurulumu kilitler (icerik API'si kapanir, editorler giremez).
**Oneri 1 (onerilen, uygulandi):** 14 ana koleksiyon + meta'siz ceviri/ara tablolar | Yarari: 11 yer bos kalir (moduller icin) | Riski: Directus ileride meta'siz tablolari baska turlu ele alirsa yeniden bakmak gerekir.
**Oneri 2:** Lisansla hepsini yapilandirmak | Yarari: her tablo ayri menude de acilabilir | Riski: lisans sarti.

**Soru:** Yapilandirma neden elle panelden degil kodla yapiliyor?
**Cevap:** Ayni paneli her makinede (sizin bilgisayariniz, test, canli sunucu) tek komutla ve ayni bicimde kurmak icin.
**Basit anlatim:** Yemegi goz karariyla degil tarifle yapmak; tarif defterde durur, herkes ayni yemegi yapar.
**Neden:** Elle yapilan ayar belgelenmez, canliya tasinirken unutulur; kodda olan ayar test edilir.
**Oneri 1 (onerilen, uygulandi):** `panel/yapilandirma/*.mjs` + `npm run yapilandir` | Riski: panelden elle yapilan degisiklik bir sonraki `yapilandir`'da ezilir; kalici degisiklik koda yazilmali.
**Oneri 2:** Directus `schema snapshot` YAML'i | Yarari: Directus'un kendi araci | Riski: binlerce satir, yetkiler ve lisans hesabi icinde yok.

**Soru:** Onay zamani neden otomatik doluyor?
**Cevap:** Veritabani "yayinda" bir kaydin onay zamanini zorunlu tutuyor; editorun bunu elle yazmasi hem zahmetli hem yanlislik kaynagi.
**Basit anlatim:** Kapidan gecen herkesin saatini bekci deftere kendisi yaziyor; gecen kisi yazmak zorunda kalmiyor.
**Neden:** Akis olmadan editor panelden hic yayina alamazdi (alan salt okunur, veritabani zorunlu).
**Oneri 1 (onerilen, uygulandi):** Directus akisi (3 akis, sinir 5) | Riski: akis kapatilirsa yayina alma veritabani hatasi verir.
**Oneri 2:** Veritabani tetikleyicisi | Yarari: Directus'tan bagimsiz | Riski: `db/` degisikligi; ayrica onaylayan kullaniciyi veritabani bilmez.

**Soru:** Lisans yokken kilitlenmeyi nasil onluyoruz?
**Cevap:** Uygulayici once `/license`'i okur; koleksiyon ve akis kotasini hesaplayarak uygular; ozel yetki kurali iceren satiri lisans izin vermiyorsa hic gondermez, gerekirse durur.
**Basit anlatim:** Asansorde "en fazla 8 kisi" yaziyorsa, bindirmeden once sayiyoruz.
**Neden:** Kilitlenen kurulumu acmak icin yonetici `POST /license/resolve` ile fazlalari pasiflestirmek zorunda kalir.
**Oneri (uygulandi):** `sinirPlani()` ve `ozelKuralMi()`; ikisi de testli ve bozarak dogrulandi.

### 6. Bu kodu nasil okurum

1. `panel/README.md`: komutlar.
2. `panel/yapilandirma/`: panelin "ne" oldugu. Sirayla `koleksiyonlar.mjs` (menu), `alanlar.mjs` (form alanlari ve kurallar), `iliskiler.mjs` (ceviri ve listeler), `yetkiler.mjs` (roller), `akislar.mjs` (otomasyon).
3. `panel/betikler/yapilandir.mjs`: "nasil" uygulandigi. `yapilandir()` fonksiyonundan basla; adimlar sirayla: ayarlar -> koleksiyonlar -> alanlar -> iliskiler -> listeler -> yetkiler -> akislar.
4. `panel/betikler/kur.mjs`: kurulum sirasi (veritabani -> bootstrap -> sema -> gecici Directus -> yapilandirma).
5. Testler `panel/test/`: `hazirlik.mjs` test ortamini kurar; her `*.test.mjs`'nin `describe` basligi korudugu kural.

### 7. Veri modeli onerileri ve kapsam disi

Asagida ilgili bolumlerde.

### 8. Dogrulama

Asagidaki "Dogrulama" bolumu: paket paket test sayilari, bozarak dogrulananlar, "Son dogrulama" satiri.

### 9. Calistirilan git komutlari

Belgenin sonunda.

### 10. Yoneticiye ozet

Buronun icerik yonetim paneli kuruldu ve Turkce calisiyor: ekip, yayinlar, kararlar, sayfalar, site bilgileri ve gelen mesajlar tek yerden yonetiliyor; yayina alma, onay kaydi ve anonimlestirme isaretleri otomatik. Kurulum tek komutla yapiliyor ve 44 otomatik testle denetleniyor. Bagimsiz bir inceleme 10 sorun buldu, hepsi giderildi. Ucretsiz surumun sinirlari (en fazla 3 panel kullanicisi, avukat bazli yetki yok, kullanim verisinin uretici firmaya gitmesi) nedeniyle buro adina ucretsiz lisans basvurusu yapilmasi gerekiyor; panel o zamana kadar yonetici ve iki editorle calisir.

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

## Q3 Roller ve yetkiler

**Baslamadan once**
1. Kaynak: `db/VERI_MODELI.md` bolum 6.5 ("Yazar" yalnizca kendi kisi kaydini ve yayinlarini duzenler, `durum`'u `yayinda` yapamaz), bolum 4 (yayin onayi sorusu); `docs/inceleme` 4.3 (zorunlu TOTP 2FA, rol ve kayit duzeyinde yetki).
2. En basit yol: rol -> politika -> yetki satirlari, uygulayicida tek fonksiyon; politika ve rol adla bulunur, satirlar her calistirmada yeniden yazilir.
3. Yapmazsam: avukatlarin hepsi yonetici olur (kullanici ve sistem ayarlarini degistirebilir).
4. Uyum: lisanssiz katmanda yasak olan kural asla gonderilmez (kilitlenme riski); 2FA zorunlu.

**Ne:**
- `panel/yapilandirma/yetkiler.mjs`:
  - **Yonetici:** Directus'un hazir Administrator rolu (ilk kullanici).
  - **Editor** (uygulandi): 14 icerik koleksiyonu ve 22 ceviri/ara tabloda tam erisim; sabit sayfa yalniz okuma/guncelleme (anahtarlari sitenin kodu kullanir); dil yalniz okuma; iletisim mesaji okuma/guncelleme/silme (olusturamaz); yayimlama isi okuma/olusturma. Directus'un "onerilen" uygulama yetkilerinden dosyalar, klasorler, yorumlar, kullanici (kendi profili), roller ve elle tetiklenen akislar. Paylasim baglantilari ve panolar bilerek yok. Iki adimli dogrulama (TOTP) zorunlu.
  - **Yazar** (tanimli, **lisans bekliyor**, denenmedi): okuma serbest; yalniz `kisi.kullanici = kendisi` olan profili ve yazari oldugu yayinlari duzenler; yayin olustururken ve guncellerken `durum` yalniz taslak/incelemede olabilir.
- `ozelKuralMi()`: Directus'un ozel kural denetiminin kopyasi. Lisans izin vermiyorsa uygulayici ozel kurali olan politikayi atlar; atlanmasi gerekmeyen bir politikada ozel kural bulursa **hicbir sey gondermeden durur**.

**Nasil:**
- "Onerilen" satirlar elle kopyalanmiyor, Directus'un kendi paketinden (`@directus/system-data`) okunuyor: muafiyet birebir esitlikle denetlendigi icin kopya, surum farkinda paneli kilitleyebilirdi.
- **Bulunan hata (testte):** yetki satirlari `fields=id` ile okununca Directus'un ozel kural suzgeci filtreli "onerilen" satirlari gizliyordu. Uygulayici yeniden calistirmada bu 5 satiri silemiyor ve her seferinde tekrar ekliyordu (147 yerine 152 satir). Cozum: satirlar tam okunuyor; test sayiyi denetliyor.
- 2FA zorunlu olsa da API girisi OTP istemeden calisti; panel ilk giriste 2FA kurulumunu zorunlu tutar (testte API kullanildi).
- Lisanssiz katmanda en fazla 3 panel kullanicisi: yonetici + 2 editor.

**Mimarideki yeri:** `yapilandir.mjs` -> `/policies`, `/permissions`, `/roles`, `/access` -> `directus_policies`, `directus_permissions`, `directus_roles`, `directus_access`.

**Testler (Q3):**
| Test | Korudugu kural |
|---|---|
| `yetkiler.test.mjs` (12) | Ozel kural denetimi Directus ile ayni (ornekler); Editor'de ozel kural yok; Yazar ozel kural iceriyor ve lisans istiyor; lisanssiz kurulumda Editor uygulandi, Yazar bekliyor, kurulum kilitlenmedi; Editor politikasi 2FA zorunlu ve butun satirlari gecerli (gizlenen yok); gercek editor kullanicisi yayin + ceviri olusturur, kisinin telefonunu ic ice gunceller, site ayarini gunceller, mesaji okur ama olusturamaz, sabit sayfa acamaz, kullanici/rol/ayar/koleksiyon olusturamaz, dili degistiremez |

---

## Q4 Akislar ve otomatik alanlar

**Baslamadan once**
1. Kaynak: `db/VERI_MODELI.md` bolum 6.3 (`onaylayan`/`onay_zamani` yayina alma sirasinda bir akisla dolmali; `olusturan`/`guncelleyen` Directus'un ozel alanlari), "Ek tablolar" (`derleme_isi`: "Yayimla" kuyrugu); `db/schema.sql` CHECK'leri (yayinda -> onay_zamani dolu; anonimlestirildi = anonimlestirme_zamani dolu).
2. En basit yol: Directus akislari (flows), her biri tek islemli. Veritabani tetikleyicisi yazmak `db/` degisikligi olurdu (yasak).
3. Yapmazsam: **editor panelden yayina alamaz**. Onay zamani formda salt okunur (Q2), veritabani ise "yayinda" icin bu alani zorunlu tutuyor. Ayni durum karar anonimlestirmesinde de var.
4. Uyum: lisanssiz katmanda en fazla 5 aktif akis var; 3 akis kuruldu.

**Ne:** `panel/yapilandirma/akislar.mjs`
1. **Yayin onayi** (engelleyici, yayin olustur/guncelle): istemcinin gonderdigi `onay_zamani`/`onaylayan` her zaman silinir; yukte `durum = yayinda` varsa `onay_zamani = simdi`, `onaylayan = islemi yapan` yazilir (Q5 incelemesinden sonra; once "bossa doldur" idi ve sahtelenebiliyordu).
2. **Karar onayi ve anonimlestirme** (engelleyici, karar): ayni onay mantigi. "Anonimlestirildi" isaretlenince `anonimlestirme_zamani` ve `anonimlestiren` dolar; isaret kaldirilinca ikisi temizlenir. Isareti akis kendisi koymaz.
3. **Yayimla** (elle, onay sorar): `derleme_isi`'ne `durum = kuyrukta`, `isteyen = basan kullanici` satiri ekler. Kuyrugu isleyip siteyi derleyen sunucu gorevi bu calismanin kapsami disi.
- `olusturan`/`guncelleyen` ve olusturma/guncelleme zamani Q2'de ozel alan olarak tanimlandi (Directus doldurur). Karar anonimlestirme zamani artik formda salt okunur.

**Nasil:**
- **Bulunan tuzak (deneyde):** engelleyici akisin son islemi degistirilmis yuku donduruyordu ama Directus bunu kullanmiyordu. Kaynak kodda (`api/dist/flows.js`) donus degeri yalnizca akisin `options.return` ayari verilmisse kullaniliyor. `return: '$last'` eklenince calisti. Bozarak dogrulamada bu ayar kaldirilinca test kirmiziya dondu.
- Islemler Directus'un yalitilmis betik ortaminda (`exec`) calisiyor; betik yalnizca yuku ve oturum bilgisini goruyor, veritabanina erismiyor.
- Akislarin kaydi `accountability: 'activity'`: calistigi kaydedilir ama yukun kopyasi tutulmaz.
- Akislar da kotali: uygulayici `/license`'tan akis sinirini okur, ayni `sinirPlani()` ile asmadan uygular. Aktif akis `status: 'active'` gonderilmeden guncellenir (koleksiyondaki ayni sayac tuzagi).
- "Yayimla" islemi tetikleyen kullanicinin yetkisiyle calisir (`permissions: '$trigger'`); editorun `derleme_isi` olusturma yetkisi Q3'te var.

**Mimarideki yeri:** Editor formda `durum`'u degistirir -> Directus `items.update` filtre olayi -> akis (`exec`) yuku tamamlar -> veritabani CHECK'i gecer. "Yayimla" -> `POST /flows/trigger/<id>` -> `derleme_isi` satiri -> (ileride) sunucudaki derleme gorevi -> `site/` derlemesi.

**Testler (Q4):**
| Test | Korudugu kural |
|---|---|
| `akislar.test.mjs` (7) | Uc akis aktif, sayac dogru, kurulum kilitlenmedi; yeniden calistirmada akis/islem cogalmaz; yalniz durum degisince onay bilgisi dolar ve kayit kabul edilir; taslakta dolmaz; karar isaretlenince zaman/kisi dolar ve yayina alinir, kaldirilinca temizlenir; anonimlestirilmeden yayina alma reddedilir; editor "Yayimla" ile kuyruga kendi adina is ekler |

Ekran goruntusunde yayin listesinin yan panelinde "Akislar" bolumu ve "Yayimla" dugmesi goruldu.

---

## Q5 Son gozden gecirme

**Ne:** `code-review` becerisi (seviye: high) bu dalin panel farki uzerinde calistirildi: `ebdb1a4...HEAD`. 10 bulgu geldi; hepsi kodla karsilastirildi ve **hepsi gercek** cikti.

| # | Bulgu | Ne yapildi | Test |
|---|---|---|---|
| 1 | Pasif (elle ya da lisans asiminda kapatilmis) akis yeniden calistirmada "uygulandi" sayiliyor ama acilmiyordu; onay akisi kapali kalirsa editor yayina alamaz | Pasif akis sayaca eklenip `status: active` ile aciliyor | `akislar.test.mjs` "kapatilan onay akisi ... yeniden aktif" |
| 2 | "Panel acik" kontrolu sema yuklendikten sonra yapiliyordu; ikinci `npm run kur` kontrolu atliyordu | Kontrol sema yuklenmeden once; panel acik ve sema yoksa dur | (elle senaryo; betik okunarak dogrulandi) |
| 3 | **Onay ve anonimlestirme bilgisi sahtelenebiliyordu**: akis yalniz bos alani dolduruyordu, editor istedigi zamani/onaylayani gonderebiliyordu | Akis istemcinin gonderdigi degerleri siliyor ve her zaman kendisi yaziyor | `akislar.test.mjs` "sahtelenemez" (3 test) |
| 4 | Windows'ta `unix_socket_directories=''` tek tirnaklar cmd.exe'de harf sayilip PostgreSQL acilmazdi | Tirnaksiz bos deger; macOS'ta yeniden baslatilip yalniz 127.0.0.1'i dinledigi gunlukten dogrulandi | Windows'ta denenmedi |
| 5 | `.env` silinip kume kalinca yeni parolalar eski kumeyle uyusmuyordu | `envHazirla` acik bir mesajla duruyor (ya .env'i geri koy ya .veri'yi sil) | (elle senaryo) |
| 6 | Sema yuklendi ama ornek veri hata verdiyse bir daha yuklenmiyordu | Sema ve ornek veri ayri ayri denetleniyor | (elle senaryo) |
| 7 | Yetkiler once silinip sonra ekleniyordu; ekleme basarisizsa editor yetkisiz kalirdi | Once yeniler ekleniyor, sonra eskiler siliniyor | mevcut "satirlarin hepsi gecerli" testi (cogalma yok) |
| 8 | Pasif koleksiyon "yapilandirilmis" sayilip yeniden acilmiyordu, sayac yanlis raporlaniyordu | Yalniz `status = active` sayiliyor; pasif olan `status: active` ile aciliyor | `akislar.test.mjs` ayni testte `yonlendirme` |
| 9 | Lisans yuzunden atlanan akis raporlanmiyordu | `raporuYaz()` UYARI basiyor; iki komut ayni ozeti kullaniyor | - |
| 10 | `@directus/system-data` package.json'da yok; npm'in yukari tasimasina guveniyordu | Sunucunun kullandigi kopyadan (`directus -> @directus/api -> @directus/system-data`) cozuluyor | `yetkiler.test.mjs` (13 onerilen satir) |

**Bozarak dogrulama (Q5):** #3 (akisin `delete` satirlari kaldirildi -> 2 test kirmizi) ve #1 (pasif akisi acma kaldirildi -> 1 test kirmizi); geri alindi.

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
| L14 | Yonetici = Directus Administrator; Editor ve Yazar ayri roller | VERI_MODELI 6.5 ve Excel'deki roller | ben karar verdim | hayir |
| L15 | Yazar rolu lisans gelene kadar uygulanmaz | Filtre ister; lisanssiz uygulanirsa kurulum kilitlenir | ben karar verdim | **evet** (gorevin istedigi yazar kurali bu gece calismiyor) |
| L16 | Editor icin 2FA zorunlu | inceleme 4.3 | ben karar verdim | hayir |
| L17 | Paylasim baglantilari (shares) ve panolar editorde yok | Paylasim icerigi giris yapmadan disariya acar; panolar kullanilmiyor | ben karar verdim | hayir |
| L18 | Editor sabit sayfa acamaz/silemez | Anahtarlari sitenin kodu kullanir | ben karar verdim | hayir |
| L19 | Onay ve anonimlestirme zamani Directus akisiyla (veritabani tetikleyicisi degil) | `db/` degistirilemez; VERI_MODELI 6.3 akis oneriyor | ben karar verdim | hayir |
| L20 | Onay/anonimlestirme bilgisini yalniz akis yazar (istemci degeri silinir); `yayin_tarihi`ne dokunulmaz | Editor tum alanlara yazabildigi icin (lisanssiz alan kisiti yok) aksi halde sahtelenebilirdi; yuk yalnizca degisen alanlari tasidigi icin tarihi doldurmak zamanlanmis yayini bozabilirdi. Sonuc: `durum = yayinda` iceren her kayit onay zamanini yeniler | ben karar verdim | hayir |
| L21 | Akislarda `accountability: 'activity'` | Calisma izi kalir, yukun kopyasi kalmaz | ben karar verdim | hayir |
| L22 | "Yayimla" yalniz kuyruga is ekler; derleme gorevi yazilmadi | Sunucu/deploy kapsam disi | ben karar verdim | hayir |

---

## Veri modeli onerileri

- Sema degisikligi gerektiren bir bulgu yok; panel `db/schema.sql`'e dokunmadan kuruldu.
- Kucuk oneri (sema degil, akis): karar `slug`'i elle yaziliyor (not: "kunyeden uretin"). Ileride bir akis kunyeden (`mahkeme`, `esas_no`, `karar_no`) uretebilir; veritabaninda `ic.slug_tr()` zaten var. Kazanc: yazim hatasi olmaz. Bedel: 1 akis daha (lisanssiz sinir 5; su an 3).

## Kapsam disi notlari

- **Sitenin PostgreSQL'den okumasi:** `site/src/lib/veri.ts` `tablolariYukle()` hala mock'u okuyor. Siradaki is: salt okuma yetkili bir veritabani kullanicisi + tablolar.ts'deki sutunlarla SELECT. Panelde girilen icerigin sitede gorunmesi buna bagli.
- **Derleme gorevi:** "Yayimla"nin kuyruga ekledigi isi alip `site/`'i derleyen sunucu gorevi (systemd timer) yazilmadi.
- **Turkce hata mesaji eklentisi** (VERI_MODELI 6.2): Directus kendi kurallarimizin (Turkce ceviri zorunlu, iki seviye agac) mesajini editore "An unexpected error occurred." diye gosteriyor. Kucuk bir Directus eklentisi onerilir; bu gece yazilmadi.
- **E-posta (SMTP):** sifre sifirlama ve davetler icin gerekir; ayarlanmadi.
- **Canli `.env`:** `PUBLIC_URL`, guclu parolalar, `LICENSE_KEY`; dosya depolama (yuklenen gorseller `panel/uploads/`) yedege dahil edilmeli.
- **Dosya yukleme sinirlari:** gorsel boyutu/turu sinirlamasi (inceleme 3: "en uzun kenar 2000 px") ayarlanmadi.

---

## Dogrulama

| Paket | Panel testleri | Not |
|---|---|---|
| Q1 | 5/5 | `db/test/calistir.sh` (PG16, `LC_ALL=C`) iki yerelde TAMAM |
| Q2 | 21/21 | Gelistirme ornegi `npm run sifirla` ile temizlendi (sabahki deney artiklari gitti) |
| Q3 | 33/33 | |
| Q4 | 40/40 | Gelistirme ornegi sifirlandi; ekran goruntusuyle "Yayimla" dugmesi kontrol edildi |
| Q5 | 44/44 | `db/test/calistir.sh` (PG16) Q0'da gecti; inceleme duzeltmelerinden sonra gelistirme ornegi yeniden sifirlandi |

**Bozarak dogrulanan:**
| Test | Nasil bozuldu | Sonuc |
|---|---|---|
| `kurulum.test.mjs` (AI/MCP kapali) | Test ortaminda `AI_ENABLED=true` | kirmizi, geri alindi |
| `yapilandirma.test.mjs` (KVKK degisiklik kaydi) | `iletisim_mesaji` `accountability: 'all'` | kirmizi, geri alindi |
| `yapilandirma.test.mjs` (lisans plani) | Sinir karsilastirmasi bir fazla sayacak sekilde bozuldu | kirmizi, geri alindi |

| `yetkiler.test.mjs` + uygulayici korumasi | Editor'e filtreli bir `kisi.read` satiri eklendi | uygulayici hicbir sey gondermeden "lisans ozel yetki kuralina izin vermiyor: kisi.read" ile durdu (test kurulumu kirmizi), geri alindi |
| `yetkiler.test.mjs` (sabit sayfa) | Editor'e `sayfa` icin tum eylemler verildi | kirmizi, geri alindi |

| `akislar.test.mjs` (onay) | Yayin akisindan `return: '$last'` kaldirildi | kirmizi, geri alindi |

| `akislar.test.mjs` (sahte onay, Q5) | Akistaki `delete yuk.onay_zamani/onaylayan` kaldirildi | iki test kirmizi, geri alindi |
| `akislar.test.mjs` (pasif akis, Q5) | Pasif akisi `status: active` ile acma kaldirildi | kirmizi, geri alindi |

**Toplam:** 44 panel testi (kurulum 5, yapilandirma 16, yetkiler 12, akislar 11), hepsi her calistirmada sifirdan kurulan ayri bir Directus'a karsi.

- Son dogrulama: Q5 sonu, 12 Ekim 2026 09:45 (Europe/Istanbul): panel testleri 44/44 yesil.

---

## Commit aciklamalari

- **Q0 Hazirlik:** Panel calismasinin ilerleme belgesi acildi: cerceve, lisans siniri, acik sorular, plan, ortam ve uyandirma duzeltmesi.
- **Q1 Yerel kurulum:** `panel/` altinda Directus 12.5.0, projeye ozel PostgreSQL 16 kumesi ve tek komutluk kurulum betigi; AI/MCP kapali. Test ortami her calistirmada sifirdan kuruluyor. Lisans sinirlari kaynak koddan cikarilip belgeye yazildi.
- **Q2 Koleksiyon ve alan yapilandirmasi:** Panel kod olarak yapilandirildi: Turkce menu ve klasorler, 14 ana koleksiyon, 266 alanin Turkce etiketi/arayuzu/dogrulamasi, 25 ceviri ve iliski alani, varsayilan listeler. Lisans kotasi hesaplanarak uygulaniyor; ceviri ve ara tablolar kotaya girmiyor. `npm run kur` tek komutta kurup yapilandiriyor.
- **Q3 Roller ve yetkiler:** Editor rolu (icerikte tam erisim, sistemde erisim yok, 2FA zorunlu) uygulandi; Yazar rolu (yalniz kendi icerigi, yayina alamaz) tanimlandi ama lisans bekliyor. Lisanssizken paneli kilitleyecek kural gonderilmeden duruluyor. Yeniden calistirmada yetki satirlarinin cogalmasi hatasi testte bulunup duzeltildi.
- **Q4 Akislar:** Uc Directus akisi eklendi: yayina alinca onay bilgisi, karar anonimlestirilince zaman/kisi otomatik doluyor (veritabani kurallari boylece panelden saglanabiliyor); "Yayimla" dugmesi derleme kuyruguna is ekliyor.
- **Q5 Son gozden gecirme:** Bagimsiz kod incelemesinin 10 bulgusu da duzeltildi: onay bilgisinin sahtelenmesi, pasif akis/koleksiyonun yeniden acilmamasi, panel acik kontrolunun gec kalmasi, Windows'ta PostgreSQL soket ayari, .env/kume parola uyusmazligi, ornek verinin yarida kalmasi, yetkilerin atomik olmayan yenilenmesi, atlanan akisin raporlanmamasi, beyan edilmemis paket. Sabah ozeti ve yonetici ozeti yazildi.

---

## Commit listesi (hash'li)

Hash commit'ten once bilinemedigi icin bu liste is bitince ayri bir belge commit'iyle eklendi; bu listeyi ekleyen son commit ("Panel belgesine commit listesini ekle") listede yok.

| Hash | Paket | Baslik |
|---|---|---|
| `f0c9bf6` | Q0 | Panel calismasi belgesini ac |
| `57a50c7` | Q1 | Directus yerel kurulumunu ekle |
| `527ec7f` | Q2 | Panel yapilandirmasini kod olarak ekle |
| `afb10e4` | Q3 | Editor ve yazar rollerini ekle |
| `89f3a8d` | Q4 | Onay ve yayimlama akislarini ekle |
| `843b4bb` | Q5 | Inceleme bulgularini duzelt ve panel raporunu yaz |

Dalin tabani: `ebdb1a4` (site calismasi dali `worktree-site-gece`'nin ucu).

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
| 15 | `git add docs/panel-gece-calismasi.md panel/betikler panel/yapilandirma panel/test` | Q3 dosyalarini acik yollarla hazirlik alanina koydu. |
| 16 | `git diff --cached --name-status` | Hazirlik alaninda yalniz Q3 dosyalari oldugunu kontrol etti. |
| 17 | `git commit -m "Editor ve yazar rollerini ekle" -m "..."` | Q3 commit'i. |
| 18 | `git push origin panel-gece` | Q3'u uzaga gonderdi. |
| 19 | `git add docs/panel-gece-calismasi.md panel/betikler panel/yapilandirma panel/test` | Q4 dosyalarini acik yollarla hazirlik alanina koydu. |
| 20 | `git diff --cached --name-status` | Hazirlik alaninda yalniz Q4 dosyalari oldugunu kontrol etti. |
| 21 | `git commit -m "Onay ve yayimlama akislarini ekle" -m "..."` | Q4 commit'i. |
| 22 | `git push origin panel-gece` | Q4'u uzaga gonderdi. |
| 23 | (beceri) `code-review high ebdb1a4...HEAD` | Bagimsiz inceleme; uc nokta: dalin ayrildigi noktadan bu yana yalniz bu dalin degisiklikleri (yalniz okuma). |
| 24 | `git diff --no-index --stat <yedek> <dosya>` | Bozarak dogrulamada gecici degisikliklerin boyutunu gordu (depoya dokunmaz). |
| 25 | `git add docs/panel-gece-calismasi.md panel/betikler panel/yapilandirma panel/test` | Q5 dosyalarini acik yollarla hazirlik alanina koydu. |
| 26 | `git diff --cached --name-status` | Hazirlik alaninda yalniz Q5 dosyalari oldugunu kontrol etti. |
| 27 | `git commit -m "Inceleme bulgularini duzelt ve panel raporunu yaz" -m "..."` | Q5 commit'i. |
| 28 | `git push origin panel-gece` | Q5'i uzaga gonderdi. |
| 29 | `git log --oneline ebdb1a4..HEAD` | Hash listesini cikardi (yalniz okuma). |
| 30 | `git add docs/panel-gece-calismasi.md`, `git commit -m "Panel belgesine commit listesini ekle" -m "..."`, `git push origin panel-gece` | Hash listesini ayri bir belge commit'iyle ekleyip gonderdi. |
