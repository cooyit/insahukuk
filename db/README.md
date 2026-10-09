# Veritabanı şeması

`schema.sql`, ekibin veri modeli tablosunu (`insa-hukuk-veri-modeli.xlsx`) esas alan revize PostgreSQL şemasıdır (PostgreSQL 16+, eklenti gerekmez). Neden bu biçimde olduğu: [`docs/inceleme-2026-10-09.md`](../docs/inceleme-2026-10-09.md) §5.

## Temel kararlar

- **Adlandırma:** Türkçe, yalnızca ASCII, snake_case, tekil tablo adı (`kisi`, `yayin`, `karar`). Tanımlayıcılarda Türkçe karakter yok.
- **Çok dillilik:** dile bağlı metin `<tablo>_ceviri` tablosunda, PK `(<tablo>_id, dil)`. Dil bağımsız alanlar ana tabloda.
  Yayında/görünür her kaydın varsayılan dilde (`tr`) çevirisi olması COMMIT anında zorunlu (`ceviri_kurali` tablosu + ertelenmiş kısıt tetikleyicileri). Karar modülü yalnızca Türkçe.
- **Metin:** ad/başlık sütunları `tr_metin` domain'i (`COLLATE "tr-x-icu"`); veritabanı hangi yerelle kurulursa kurulsun Türkçe sıralar. `eposta` domain'i yalnızca küçük harfli, boşluksuz ASCII kabul eder (`ınfo@`, `İnfo@`, `INFO@` reddedilir), çünkü `tr_TR` yerelinde `lower('I')` = `ı` olur; uygulama e-postayı yerelden bağımsız `toLowerCase()` ile normalleştirmeli. `slug_tr()` Unicode ayrıştırması (NFD) kullanır; JS'in `'İ'.toLowerCase()` çıktısı da `i` olur.
- **Silme:** ara tablolar sahibinden CASCADE; sözlük ve dosya tarafı NO ACTION (kullanımdaki çalışma alanı, etiket, dosya silinemez). `kisi` ve `kullanici` silinmez, `aktif = false` yapılır.
- **KVKK:** IP yalnızca HMAC olarak (`ip_hmac`); `iletisim_mesaji` ve `basvuru` için `saklama_bitis` + `kisisel_veri_temizle()` (günlük systemd timer ile çağrılmalı). CV dosyası ve anonimleştirilmemiş kararın dosyası yalnızca `ozel` erişimli olabilir (statik siteye kopyalanmaz). Başvuru silinince ya da CV değişince eski CV, başka başvuruda kullanılmıyorsa `basvuru_cv_birak` tetikleyicisiyle silinip `dosya_silme_kuyrugu`'na yazılır.

## Bölümler

| Bölüm | Tablolar |
|---|---|
| Dil, kullanıcı | `dil`, `kullanici`, `oturum` |
| Dosya | `dosya`, `dosya_ceviri`, `dosya_silme_kuyrugu` |
| Çalışma alanı (2 seviye) | `calisma_alani`, `sektor` (+ çeviri) |
| Ekip | `unvan`, `kisi`, `kisi_telefon`, `kisi_calisma_alani`, `kisi_sektor`, `egitim`, `firma`, `deneyim` (+ çeviri) |
| Yayın | `yayin` (makale/kitap/video/haber/duyuru), `yayin_ceviri`, `yayin_yazar`, `yayin_*` bağları, `yayin_sayac`, `etiket`, `bulten_sayisi` |
| Karar (iskelet) | `mahkeme` (mahkeme > daire), `mevzuat`, `karar`, `karar_*` bağları, `yayin_karar` |
| Sayfa | `sayfa`, `sayfa_ceviri` |
| Form, kariyer | `iletisim_mesaji`, `ilan`, `basvuru` |
| Diğer | `acilir_duyuru`, `site_ayar`, `yonlendirme`, `derleme_isi`, `degisiklik_log`, `ceviri_kurali` |

## Açık kalanlar

- **"Beklemede" alanlar iskelet:** karar alanları ve filtreleri, `firma`, `sektor`, `ilan`/`basvuru`, `karar_yorum`, `karar_kisi`. Büronun cevaplarından sonra ALTER/DROP ile netleştirilmeli.
- **Saklama süreleri yer tutucu** (iletişim mesajı 1 yıl, başvuru 6 ay, değişiklik kaydı 2 yıl); büro ve KVKK danışmanı belirlemeli.
- **Sahiplik kontrolü API'de** yapılır (`yayin_duzenleyebilir_mi()`); satır düzeyinde güvenlik (RLS) kullanılmıyor.
- **`ceviri_kurali.kosul` güvenilen SQL metni:** uygulama kullanıcısının bu tabloya yazma yetkisi olmamalı (`REVOKE`).
- **Directus ile birlikte test edilmedi.** Directus seçilirse: her çeviri/ara tabloya tekil `id` + `UNIQUE(ana_id, dil)` eklenmeli, enum ve domain'ler `text + CHECK`'e çevrilmeli; `kullanici` ve `oturum` yerine Directus'un kendi kullanıcıları kullanılır.
- Veri taşırken `GENERATED ALWAYS AS IDENTITY` sütunları için `OVERRIDING SYSTEM VALUE` gerekir.

## Test

```bash
db/test/calistir.sh                                   # geçici küme: C ve tr-TR (ICU) yerelinde dener
DATABASE_URL=postgres://user@host/bos_db db/test/calistir.sh   # var olan boş bir veritabanında
db/test/calistir.sh --guncelle                        # test bilerek değiştiyse beklenen çıktıyı yenile
```

`schema_test.sql` çıktısındaki (`beklenen.out`) her `ERROR` satırı bilinçli bir negatif testtir (şu an 41 adet); betik çıktıyı zaman damgası, uuid ve dosya yolundan arındırıp `beklenen.out` ile karşılaştırır. Geçici küme için `initdb` ve `pg_ctl` gerekir ve betik root ile çalışmaz.

Migration'larda yeni bir tablo eklenirse `SELECT guncelleme_tetikleyicisi_ekle('tablo_adi');` çağrılmalı. CI'da şu iki sorgu boş dönmeli: `guncelleme_zamani` sütunu olup tetikleyicisi olmayan tablolar (bkz. testte V10) ve `SELECT * FROM ceviri_eksikleri();`.

## `referans/`

Karşılaştırma için: GSI sitesinden çıkarılmış ilk şema (`gsi_schema.sql`) ve onun sorunlarını gösteren sonda testleri (`gsi_test.sql`, Türkçe yerel testi `gsi_tr_test.sql`). Bulgular inceleme belgesinin §5.2'sinde.

```bash
createdb gsi_test && psql -X -d gsi_test -f db/referans/gsi_schema.sql && psql -X -d gsi_test -f db/referans/gsi_test.sql
# Türkçe yerel testi (bulgu 3) ayrı, tr-TR ICU yerelli bir veritabanı ister
createdb -T template0 --locale-provider=icu --icu-locale=tr-TR --locale=C gsi_tr && psql -X -d gsi_tr -f db/referans/gsi_schema.sql && psql -X -d gsi_tr -f db/referans/gsi_tr_test.sql
```
