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
| Q1 Yerel kurulum (PostgreSQL 16 + Directus 12.5) | yapilmadi (sirada) |
| Q2 Koleksiyon ve alan yapilandirmasi | yapilmadi |
| Q3 Roller ve yetkiler | yapilmadi |
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

## Kararlar tablosu

| # | Karar | Gerekce | Kim karar verdi | Plandan sapma mi |
|---|---|---|---|---|
| L1 | Ayri dal `panel-gece` (site dalinin ucundan) | Panel ayri konu; site isiyle karismasin | ben karar verdim | hayir |
| L2 | PostgreSQL 16 Homebrew ile | Sema 15+ ister (`NULLS NOT DISTINCT`); 14 yetmez | ben karar verdim | hayir |
| L3 | Uyandirma 12:35 (05:35 degil) | Is sabah basladi; 05:35 gecti | ben karar verdim | **evet** (saat) |

---

## Veri modeli onerileri

- Henuz yok.

## Kapsam disi notlari

- Henuz yok.

---

## Dogrulama

- Son dogrulama: Q0, 12 Ekim 2026 09:05: `db/test/calistir.sh` (PG16, `LC_ALL=C`) iki yerelde TAMAM.

---

## Commit aciklamalari

- **Q0 Hazirlik:** Panel calismasinin ilerleme belgesi acildi: cerceve, lisans siniri, acik sorular, plan, ortam ve uyandirma duzeltmesi.

---

## Calistirilan git komutlari

| # | Komut | Aciklama |
|---|---|---|
| 1 | `git switch -c panel-gece` | Bulunulan commit'ten (`ebdb1a4`) yeni dal acti ve ona gecti. |
| 2 | `git add docs/panel-gece-calismasi.md` | Q0 belgesini hazirlik alanina koydu. |
| 3 | `git diff --cached --name-status` | Hazirlik alaninda yalniz bu dosya oldugunu kontrol etti. |
| 4 | `git commit -m "Panel calismasi belgesini ac" -m "..."` | Q0 commit'i. |
| 5 | `git push -u origin panel-gece` | Yeni dali uzaga ilk kez gonderdi ve izleme baglantisini kurdu. |
