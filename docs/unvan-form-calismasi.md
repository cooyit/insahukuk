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
| R3 Form servisi | yapilmadi (sirada) |
| R4 Bildirim akisi (e-posta) | yapilmadi |
| R5 Inceleme ve rapor | yapilmadi |

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

## Commit aciklamalari

- **R1 Unvan, alan adi, logo:** Resmi unvan (yer tutucu) ve uydurma alan adi `insahukuk.test` tek yerlerinde degisti; sitede ve panelde yer tutucu INSA logosu. Muvekkil/firma logosu testi buronun kendi logosunu dislayacak sekilde duzeltildi; panel testlerinin kapali kumede calismama hatasi giderildi.
- **R2 Form bildirim e-postasi:** `site_ayar.form_bildirim_eposta` sutunu (CHECK'li, bos olabilir) eklendi; sema testi T17, beklenen cikti, TABLOLAR.md, veri modeli belgesi, site mock'u ve panel alani buna gore guncellendi. Adresin sitede gorunmedigi testli.

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
