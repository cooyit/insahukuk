# Unvan, logo ve iletisim formu calismasi

**Tarih:** 12 Ekim 2026
**Dal:** `unvan-form` (`panel-gece`'nin ucundan, `2be11e4`, acildi)
**Commit'ler:** her paketin aciklamasi "Commit aciklamalari" bolumunde; hash listesi is bitince ayri bir belge commit'iyle eklenir.
**Onay:** Kaplan plani onayladi ("onayliyorum go"). Cevaplanmayan acik sorularda "(onerilen)" secenek uygulandi (asagida). Git: dun geceki gibi commit/push bende (soru 5a).

---

## Ozet

| Paket | Durum |
|---|---|
| R1 Unvan, uydurma alan adi, yer tutucu logo | bitti |
| R2 Form bildirim e-postasi alani (veri modeli) | bitti |
| R3 Form servisi | bitti |
| R4 Bildirim akisi (e-posta) | bitti |
| R5 Inceleme ve rapor | bitti |

## Uygulanan kararlar (acik sorular)

| # | Soru | Uygulanan | Not |
|---|---|---|---|
| 1 | Unvan | **a)** Resmi unvan ayri; logoda "INSA" (Turkce yazimiyla). Resmi unvan bilinmedigi icin **yer tutucu: "Ince Safak Avukatlik Burosu"** (Av.K. m.44 bicimi: soyadlari + "Avukatlik Burosu"). Tek yerde: `site/src/mock/genel.ts` `site_ayar.resmi_unvan` | Baro gorusu gelince "INSA"nin logoda kullanilabilirligi netlesir |
| 2 | Alan adi | **a)** `https://www.insahukuk.test` (`.test` test icin ayrilmis, gercek siteyle cakismaz) | Tek satir: `site/astro.config.mjs` |
| 3 | Form adresi panelden nasil degisir | **a)** `site_ayar.form_bildirim_eposta` sutunu (veri modeli degisikligi; plan onayiyla) | Bos ise `site_ayar.eposta` kullanilir |
| 4a | E-posta icerigi | **i)** Yalnizca "yeni mesaj var" bildirimi; kisisel veri e-postaya girmez | KVKK |
| 4b | SMTP | Yerelde gercek e-posta yok; testlerde ve gelistirmede depodaki kucuk sahte SMTP alicisi. Canli icin oneri: Turkiye'deki saglayicinin kurumsal e-postasi | |
| 5 | Git | **a)** commit/push bende | |

---

## R1 Unvan, uydurma alan adi, yer tutucu logo

**Ne:**
- Resmi unvan (tek yer, `site/src/mock/genel.ts`): **"Ince Safak Avukatlik Burosu" (yer tutucu; sitede Turkce harflerle)**. Sitede ust bolumde, footer'da, ana sayfa h1'inde ve sayfa basliklarinda kullaniliyor. Buro e-postasi `info@insahukuk.test`.
- Alan adi: `https://www.insahukuk.test` (`site/astro.config.mjs`); testler `SITE` sabitinden okuyor (`test/cikti/dist.ts`).
- Yer tutucu logo `site/public/logo.svg`: adliye cephesi isareti (alinlik, uc sutun, kaide) + "INSA" + "HUKUK" (sitede Turkce harflerle). `favicon.svg` ayni isaretin kare hali. Tek renk (#1d4a72), sistem fontu; dis font yok. Ust bolumde logo ustte, resmi unvan altinda; logonun alt metni bos (baglantinin adi zaten resmi unvan).
- Panel: adi "INSA Yonetim Paneli" (Turkce harflerle), rengi #1d4a72, logosu `site/public/favicon.svg`'den yukleniyor (tek kaynak; nihai logo gelince yalnizca o dosya degisir; ayni adla yuklenmisse tekrar yuklenmez).

**Nasil / bulunanlar:**
- Esnek sutunda SVG genislige uzayip icerigi ortaliyordu (ekran goruntusunde logo saga kaymisti): `align-items: flex-start`.
- P7'deki "logo gorseli yok" testi kurali yanlis olcuyordu: kural muvekkil/firma logosu yasagi (inceleme 6.2), buronun kendi logosu serbest. Test, `/logo.svg` disindaki "logo" gorsellerini yakalayacak sekilde daraltildi.
- Test duzeneginde gercek hata: kume kapaliyken (`npm run db:durdur`) panel testleri veritabanini baslatmadan silmeye calisiyordu; `hazirlik.mjs` artik once kumeyi baslatiyor.
- Ekip mock'u kurgusal kaldi (gercek kisi yok); resmi unvandaki soyadlar ekip listesinde yok. Gercek ekip bilgisi panelden girilecek.

**Dogrulama:** site `check` 0 hata, birim 245, cikti 69, e2e 154; panel 44 (yeni: panel adi, logosu ve logonun tekrar yuklenmemesi); hepsi yesil. Masaustu ve 375 px ekran goruntusuyle ust bolum kontrol edildi.

---

## R2 Form bildirim e-postasi alani (veri modeli degisikligi)

**Ne:** `site_ayar.form_bildirim_eposta` (metin, bos olabilir, `ic.eposta_gecerli` CHECK'i). Iletisim formuna yeni mesaj gelince bildirim bu adrese gider; bossa `site_ayar.eposta`. Panelden "Site ayarlari" formunda degistirilir. **Sitede gosterilmez.**

**Neden ayri alan:** sitede gorunen buro e-postasi ile bildirimin gittigi ic adres farkli olabilsin (soru 3a).

**Degisen dosyalar:**
| Dosya | Degisiklik |
|---|---|
| `db/schema.sql` | Sutun + CHECK |
| `db/ornek_veri.sql` | Ornek deger `bildirim@ornek.av.tr` |
| `db/test/schema_test.sql` | Yeni grup T17: gecerli adres ve bos kabul; buyuk harfli ve @'siz adres reddedilir |
| `db/test/beklenen.out` | `--guncelle` ile yeniden uretildi; fark yalnizca T17 (beklenen ret 44 -> 46) |
| `db/TABLOLAR.md` | `db/araclar/tablo_belgesi.py` ile yeniden uretildi; fark tek satir |
| `db/VERI_MODELI.md`, `db/README.md` | Diyagrama alan; test sayilari (18 grup, 46 ret) |
| `site/src/lib/tablolar.ts`, `site/src/mock/genel.ts`, `site/test/birim/mock-butunluk.test.ts` | Tip, mock degeri (`iletisim@insahukuk.test`), CHECK kopyasi |
| `site/test/cikti/sabit-sayfalar.test.ts` | Yeni test: bu adres hicbir sayfada gorunmez |
| `panel/yapilandirma/alanlar.mjs`, `panel/test/yapilandirma.test.mjs` | Turkce etiket, not, Turkce mesajli dogrulama (`*_eposta` alanlarinin hepsi), test |

**Var olan bir veritabani icin** (sema tekrar yuklenmeyecekse):
```sql
ALTER TABLE site_ayar ADD COLUMN form_bildirim_eposta text CHECK (ic.eposta_gecerli(form_bildirim_eposta));
```
Yerelde `cd panel && npm run sifirla` yeterli (bu yapildi).

**Dogrulama:** `db/test/calistir.sh` (PG16, `LC_ALL=C`) iki yerelde TAMAM (46 ret); site check 0 hata, birim 245, cikti 70; panel 45; hepsi yesil.

---

## R3 Form servisi

**Ne:** Iletisim formu artik gercekten calisiyor. Ziyaretcinin mesaji panele "Gelen mesajlar"a duser; "Mesajiniz bize ulasti" ancak kayit veritabanina yazildiktan sonra gosterilir.

**Nasil calisir (zincir):** tarayici -> `POST /api/iletisim` -> (canlida Caddy) -> form servisi `panel/form/sunucu.mjs` (127.0.0.1:8065) -> Directus REST -> PostgreSQL `iletisim_mesaji`.

| Soru | Cevap |
|---|---|
| Neden Directus'a dogrudan (herkese acik izinle) yazilmiyor? | Hiz siniri, bal kupu, IP'nin HMAC'i ve telefonun E.164'e cevrilmesi sunucu tarafinda olmali; Directus'u internete form icin acmak da gerekmez. |
| Servis Directus'a hangi yetkiyle yaziyor? | "Form servisi" rolu: yalnizca `iletisim_mesaji` olusturma. Mesaj okuyamaz, baska icerige dokunamaz, panele giremez (e-postasi ve parolasi yok; yalnizca `.env`'deki `FORM_DIRECTUS_TOKEN` anahtari). Panel erisimi olmadigi icin **lisans koltugu saymaz** (Directus kodunda dogrulandi, testli). |
| Ek paket var mi? | Yok: node:http ve fetch. |
| Spam'e karsi? | Bal kupu alani (`web_sitesi`; insan gormez, doluysa ret), IP basina 10 dakikada 5 deneme (`.env`'den degisir), baska sitenin sayfasindan gonderime ret (Origin denetimi), govde siniri 32 KB. |
| KVKK | IP saklanmaz; yalnizca anahtarli HMAC-SHA256'si (`FORM_IP_ANAHTARI`). Servisin kayitlarina (log) kisisel veri yazilmaz, yalnizca durum kodu. Mesajlarin degisiklik gecmisi zaten kapali. Veri sunucudan disari cikmaz. |
| Betik (JS) kapaliysa? | Form normal gonderilir; servis kucuk bir HTML sayfa dondurur (TR/EN, "Iletisim sayfasina don" baglantisi). |
| Hata olursa ziyaretci ne gorur? | Gercek durum: alan hatasi (hangi alan), "cok fazla deneme", "su anda kaydedilemedi" ya da sunucuya ulasilamazsa "iletilemedi". Hicbirinde "gonderildi" yok. |

**Site tarafi:** form artik `hidden` degil; "henuz devrede degil" notu kalkti; gizli `dil` ve bal kupu alanlari eklendi; `src/scripts/iletisim.ts` sunucunun yanitini gosterir, basarida formu temizler, gonderirken dugmeyi kilitler. Basari metni sitenin derlenmis HTML'inde yok, servisten gelir (cikti testi bunu her sayfada denetliyor). `astro.config.mjs`: yalnizca `astro dev`'de `/api` istegi yerel servise gider (derlenen siteye girmez).

**Yeni ayarlar (`panel/.env.ornek`):** `FORM_DIRECTUS_TOKEN`, `FORM_IP_ANAHTARI` (rastgele uretilir), `FORM_HOST`, `FORM_PORT`, `FORM_IZINLI_KAYNAK`, `FORM_VEKIL_ARKASINDA`, `FORM_HIZ_ADET`, `FORM_HIZ_DAKIKA`. Var olan `.env`'e eksik anahtarlar kurulumda otomatik eklenir (var olan degerlere dokunulmaz).

**Canli icin (sunucu kurulurken):**
```
# Caddyfile (site blogunun icine)
handle /api/iletisim {
	reverse_proxy 127.0.0.1:8065
}
```
`.env`'de `FORM_VEKIL_ARKASINDA=evet` ve `FORM_IZINLI_KAYNAK=https://<alan adi>`; servis `npm run form` ile (systemd vb. altinda) calisir. Caddy disaridan gelen X-Forwarded-For'u yok sayip kendisi yazdigi icin servis IP'yi son degerden okur.

**Yolda bulunan, onceden var olan iki hata (duzeltildi):**
1. **`npm run kur` komut satirindan hic bitmiyordu** (cikis 13, "unsettled top-level await"): `sunucu.mjs` ile `kur.mjs` birbirini ice aktariyordu. Testler ve `npm run sifirla` fonksiyonlari dogrudan cagirdigi icin yakalanmamisti (panel-gece'deki `527ec7f`'ten beri). Ortak fonksiyon `ortak.mjs`'e tasindi; `npm run kur` yeniden calisiyor.
2. **Panelde istege bagli bicimli alanlar bosaltilamiyordu:** Directus'un regex dogrulamasi bos degeri "zorunlu" sayiyordu. Editor ornegin "Form bildirim e-postasi"ni silip buro e-postasina donemiyor, faksi silemiyordu; form servisi de telefonsuz mesaji kaydedemiyordu (tarayiciyla canli denemede yakalandi). Bos birakilabilen alanlarda dogrulama artik "bos ya da kurala uygun"; zorunlu alanlarda degismedi.

**Dogrulama:**
- Panel testleri 64 (yeni 19: alan kurallari, servis uctan uca test Directus'una karsi, servis anahtarinin yetkileri, koltuk sayaci, alan bosaltma).
- Site: check 0 hata; birim 245, cikti 71, e2e 158 (form testleri yeniden yazildi; servis `page.route` ile taklit, JS'siz gonderim dahil).
- Elle: gelistirme paneli + servis + `astro dev` ile tarayicidan gercek gonderim; kayit veritabaninda dogru (telefon E.164, IP yalnizca HMAC). Deneme kayitlari silindi; sunucular ve kume kapatildi.

---

## R4 Bildirim akisi (e-posta)

**Ne:** Formdan mesaj gelince buroya "yeni mesaj var" e-postasi gider. Adres panelden degisir: **Site ayarlari > Form bildirim e-postasi**. Bos birakilirsa buro e-postasina (Site ayarlari > E-posta) gider.

**Nasil:** Directus'ta dorduncu akis "Yeni mesaj bildirimi" (mesaj olusturulunca, kaydi bekletmeden calisir):
site ayarlarini oku -> "Form bildirim e-postasi dolu mu?" -> evet: o adrese / hayir: buro e-postasina yaz.
Ayar sistem yetkisiyle okunur (mesaji olusturan form servisi site ayarini okuyamaz; bilerek).

| Soru | Cevap |
|---|---|
| E-postada ne var? | Konu "Yeni iletisim mesaji"; govdede yalnizca mesajin panel baglantisi ve "bu e-postada mesajin icerigi ve gonderenin bilgileri yer almaz" notu. Ad, e-posta, telefon, mesaj **yok** (soru 4a-i; testli). |
| Gonderen kim gorunur? | "INSA Yonetim Paneli" (Turkce harflerle; panelin adi), adres `EMAIL_FROM`. |
| Yerelde e-posta nereye gider? | Hicbir yere: `npm run posta` sahte SMTP alicisini acar (`panel/betikler/sahte-smtp.mjs`, ek paket yok, yalnizca 127.0.0.1); e-postalar `panel/.veri/posta/*.eml` olarak yazilir, Mail uygulamasiyla acilir. Testler ayri bir alici (2526) kullanir ve `.env`'deki SMTP ne olursa olsun disari e-posta cikarmaz. |
| Canlida ne gerekir? | `.env`'de `EMAIL_SMTP_HOST/PORT/USER/PASSWORD/SECURE` buronun e-posta saglayicisinin bilgileriyle; `EMAIL_FROM` o hesabin adresi. Oneri (soru 4b): Turkiye'deki saglayicinin kurumsal e-postasi; saglayici SPF/DKIM kaydini da verir (alan adi alininca DNS'e yazilir). |
| Iki adres de bossa? | E-posta gidemez; Directus kaydina hata duser, mesaj yine panelde durur (kaybolmaz). |

**Lisans:** lisanssiz katmanda en fazla 5 aktif akis var; artik 4'u kullaniliyor (panelde "1 Flow Left"). Bir akis daha eklenirse sinir dolar.

**Yeni ayarlar (`panel/.env.ornek`):** `EMAIL_TRANSPORT=smtp`, `EMAIL_FROM`, `EMAIL_SMTP_*` (yerelde sahte aliciyi gosterir), `FLOWS_ENV_ALLOW_LIST=PUBLIC_URL` (e-postadaki panel baglantisi icin; akislar baska ortam degiskeni goremez). Var olan `.env`'e kurulumda otomatik eklenir.

**Uygulayici:** akislar artik birden cok islem tasiyabiliyor (`islemler`, "sonra"/"aksi" baglantilari); onceki uc akis tek islemli liste oldu, davranislari degismedi.

**Dogrulama:**
- Panel testleri 68 (yeni 4: bildirim ayarli adrese gider ve kisisel veri icermez; editor adresi degistirince yeni adrese gider; bos birakilinca buro e-postasina gider; form servisinin anahtariyla gelen mesaj da bildirilir). Akis testleri dort akis ve cok islemli yapiya gore guncellendi.
- Elle: gelistirmede `npm run posta` + `npm run panel` + `npm run form`; formdan gonderilen mesajin bildirimi `bildirim@ornek.av.tr`'ye dustu; panelde akis ve alan ekran goruntusuyle kontrol edildi. Deneme kaydi ve e-postasi silindi; sunucular kapatildi.

---

## R5 Bagimsiz inceleme ve duzeltmeler

Bu calismanin baglamini bilmeyen ayri bir inceleyici `2be11e4..HEAD`'i (R1-R4) yalnizca okuyarak inceledi. Yuksek onemde bulgu yok. Her bulgu kodla karsilastirildi.

| # | Bulgu | Onem | Ne yapildi |
|---|---|---|---|
| 1 | IPv6'da adres basina hiz siniri, adres degistirerek asilabilir; her istekte butun tablo geziliyordu | Orta | **Duzeltildi:** IPv6 /64 onekiyle gruplanir (IPv4 aynen); temizlik pencere basina bir kez. `ip_hmac` de bu gruptan uretilir (IPv6'da daha az bilgi saklanir). Testli. |
| 2 | Panelde aydinlatma surumu bozuk ya da bos yazilirsa form herkese kapanir ve kimse fark etmez | Orta | **Duzeltildi:** panelde ayni bicim kurali (Turkce mesajli); alan notuna "bos birakilirsa form mesaj kabul etmez"; servis bu durumda kisisel veri icermeyen bir log yazar. Testli. |
| 3 | `.env`'e eksik anahtar eklenirken yerel varsayilanlar (localhost, sahte SMTP) canli sunucuya da yazilabilir | Orta | **Duzeltildi:** eklenen anahtarlar adlariyla "canli sunucudaysaniz kontrol edin" uyarisiyla yazdirilir. |
| 4 | Servisin kabul ettigi bazi e-posta karakterleri (`"`, `(`, `,`) panelin alan kuralinda reddediliyor -> ziyaretciye "kaydedilemedi" | Dusuk | **Duzeltildi:** servis panelin kuraliyla ayni karakterleri kabul eder. Testli. (Tarayicinin e-posta alani bunlari zaten engelliyordu.) |
| 6 | "90 532 123 45 67" sitede kabul, serviste ret | Dusuk | **Duzeltildi:** 90 ile baslayan 12 hane Turkiye numarasi sayilir. Testli. |
| 5 | Hiz siniri / kaynak reddi mesajlari Ingilizce formda da Turkce | Dusuk | Kaldi: nadir durum; mesaj yine durustur. |
| 7 | Directus 10 sn'den gec yazarsa ziyaretci "kaydedilemedi" gorur, tekrar gonderirse mesaj iki kez kaydolur | Dusuk | Kaldi: kabul edilebilir (mesaj kaybolmaz, en kotu ihtimalle cift). |
| 8 | Site ileride `Referrer-Policy: no-referrer` gonderirse tarayicilar `Origin: null` yollar ve form 403 verir | Dusuk | Kaldi: bugun boyle bir baslik yok. **Canli sunucu kurulurken** bu baslik siteye konmamali (ya da servis `null`'a izin vermeli). |
| 9 | Form servisinin anahtari mesaj olustururken her sutunu yazabilir (ornek: saklama suresi) | Dusuk | Kaldi: alan kisitlamasi lisanssiz katmanda kurulumu kilitler; servis yalnizca form alanlarini gonderir, anahtar yalnizca sunucudaki `.env`'de. |
| 10 | Form bildirim adresi ve buro e-postasi ikisi de bossa bildirim gitmez | Dusuk | Kaldi: mesaj panelde durur; R4 tablosunda yaziyor. |

Ayrica (inceleyicinin sorunsuz buldugu alanlar): DB kurallariyla esitlik, 413 yolu, X-Forwarded-For, Origin, HTML yanit sayfasi, KVKK (log, e-posta, degisiklik kaydi), akisin iki dali ve yeniden uygulanmasi, koltuk, sahte SMTP protokolu, site betigi, testlerin gercekten davranisi sinamasi.

**Yolda kendi hatam (duzeltildi, commit'e girmedi):** `alanlar.mjs`'e ekleme yaparken metin degistirmede `$'` dizisi ozel anlam tasidigi icin dosyanin bir bolumu kopyalandi; fark (diff) kontrolunde goruldu, dosya son commit'teki haline dondurulup ekleme elle yeniden yapildi.

**Dogrulama:** panel testleri 70 (yeni 2: IPv6 gruplama, paneldeki surum kurali; ayrica e-posta karakterleri, "90..." telefonu ve surum logu mevcut testlere eklendi). Site dosyalari R5'te degismedi (son calistirma: check 0 hata, birim 245, cikti 71, e2e 158). Gelistirme paneline yapilandirma uygulandi.

---

## Commit aciklamalari

- **R1 Unvan, alan adi, logo:** Resmi unvan (yer tutucu) ve uydurma alan adi `insahukuk.test` tek yerlerinde degisti; sitede ve panelde yer tutucu INSA logosu. Muvekkil/firma logosu testi buronun kendi logosunu dislayacak sekilde duzeltildi; panel testlerinin kapali kumede calismama hatasi giderildi.
- **R2 Form bildirim e-postasi:** `site_ayar.form_bildirim_eposta` sutunu (CHECK'li, bos olabilir) eklendi; sema testi T17, beklenen cikti, TABLOLAR.md, veri modeli belgesi, site mock'u ve panel alani buna gore guncellendi. Adresin sitede gorunmedigi testli.
- **R3 Form servisi:** `panel/form/` altinda ek paketsiz servis (dogrulama, telefon E.164, bal kupu, IP basina hiz siniri, Origin denetimi, IP'nin HMAC'i); Directus'a yalnizca mesaj olusturabilen, panele giremeyen ve koltuk saymayan "Form servisi" kullanicisiyla yazar. Sitenin formu artik etkin ve sunucunun gercek yanitini gosterir. Iki eski hata duzeltildi: `npm run kur`'un dongusel ice aktarmada takilmasi ve istege bagli bicimli alanlarin panelde bosaltilamamasi.
- **R4 Bildirim akisi:** Dorduncu akis yeni mesajda Site ayarlarindaki form bildirim adresine (bossa buro e-postasina) yalnizca panel baglantisi iceren bir e-posta yollar; e-postada kisisel veri yok. Yerel gelistirme ve testler icin ek paketsiz sahte SMTP alicisi; akis uygulayicisi cok islemli akislari destekliyor.
- **R5 Inceleme duzeltmeleri:** Bagimsiz incelemenin bes bulgusu duzeltildi: IPv6 hiz siniri /64 onekiyle, sinir tablosu pencere basina bir kez temizlenir; panelde aydinlatma surumu bicim kurali ve servis logu; `.env`'e eklenen anahtarlar icin uyari; e-posta karakterleri panelle ayni; "90..." telefonu. Kalan bulgular belgede.

---

## Calistirilan git komutlari

| # | Komut | Aciklama |
|---|---|---|
| 1 | `git switch -c unvan-form` | `panel-gece` ucundan yeni dal acti ve ona gecti. |
| 2 | `git add docs/unvan-form-calismasi.md site/... panel/...` (acik yollar) | R1 dosyalarini hazirlik alanina koydu. |
| 3 | `git diff --cached --name-status` | Yalniz R1 dosyalari oldugunu kontrol etti. |
| 4 | `git commit -m "Unvan, uydurma alan adi ve yer tutucu logoyu ekle" -m "..."` | R1 commit'i. |
| 5 | `git push -u origin unvan-form` | Yeni dali uzaga gonderdi ve izleme baglantisini kurdu. |
| 6 | `git add db/... site/... panel/... docs/unvan-form-calismasi.md` (acik yollar) | R2 dosyalarini hazirlik alanina koydu. |
| 7 | `git diff --cached --name-status` | Yalniz R2 dosyalari oldugunu kontrol etti. |
| 8 | `git commit -m "Form bildirim e-postasi alanini ekle" -m "..."` | R2 commit'i. |
| 9 | `git push origin unvan-form` | R2'yi uzaga gonderdi. |
| 10 | `git add panel/... site/... docs/unvan-form-calismasi.md` (acik yollar) | R3 dosyalarini hazirlik alanina koydu. |
| 11 | `git diff --cached --name-status` | Yalniz R3 dosyalari oldugunu kontrol etti. |
| 12 | `git commit -m "Iletisim formu servisini ekle" -m "..."` | R3 commit'i. |
| 13 | `git push origin unvan-form` | R3'u uzaga gonderdi. |
| 14 | `git add panel/... docs/unvan-form-calismasi.md` (acik yollar) | R4 dosyalarini hazirlik alanina koydu. |
| 15 | `git diff --cached --name-status` | Yalniz R4 dosyalari oldugunu kontrol etti. |
| 16 | `git commit -m "Yeni mesaj bildirim akisini ekle" -m "..."` | R4 commit'i. |
| 17 | `git push origin unvan-form` | R4'u uzaga gonderdi. |
| 18 | `git add panel/... docs/unvan-form-calismasi.md` (acik yollar) | R5 dosyalarini hazirlik alanina koydu. |
| 19 | `git diff --cached --name-status` | Yalniz R5 dosyalari oldugunu kontrol etti. |
| 20 | `git commit -m "Inceleme bulgularini duzelt" -m "..."` | R5 commit'i. |
| 21 | `git push origin unvan-form` | R5'i uzaga gonderdi. |
| 22 | `git add docs/unvan-form-calismasi.md`, `git diff --cached --name-status`, `git commit -m "Calisma belgesine commit listesini ekle"`, `git push origin unvan-form` | Hash listesi icin ayri belge commit'i. |
