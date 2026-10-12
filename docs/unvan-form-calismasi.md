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
| R2 Form bildirim e-postasi alani (veri modeli) | yapilmadi (sirada) |
| R3 Form servisi | yapilmadi |
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

## Commit aciklamalari

- **R1 Unvan, alan adi, logo:** Resmi unvan (yer tutucu) ve uydurma alan adi `insahukuk.test` tek yerlerinde degisti; sitede ve panelde yer tutucu INSA logosu. Muvekkil/firma logosu testi buronun kendi logosunu dislayacak sekilde duzeltildi; panel testlerinin kapali kumede calismama hatasi giderildi.

---

## Calistirilan git komutlari

| # | Komut | Aciklama |
|---|---|---|
| 1 | `git switch -c unvan-form` | `panel-gece` ucundan yeni dal acti ve ona gecti. |
| 2 | `git add docs/unvan-form-calismasi.md site/... panel/...` (acik yollar) | R1 dosyalarini hazirlik alanina koydu. |
| 3 | `git diff --cached --name-status` | Yalniz R1 dosyalari oldugunu kontrol etti. |
| 4 | `git commit -m "Unvan, uydurma alan adi ve yer tutucu logoyu ekle" -m "..."` | R1 commit'i. |
| 5 | `git push -u origin unvan-form` | Yeni dali uzaga gonderdi ve izleme baglantisini kurdu. |
