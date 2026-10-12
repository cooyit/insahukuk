# Veritabanı

PostgreSQL 16 şeması; yönetim paneli Directus 12, ziyaretçi sitesi Astro. Eklenti gerekmez.

**Veri modelini incelemek için:** [`VERI_MODELI.md`](VERI_MODELI.md) (genel kurallar, diyagramlar, Excel'den farklar, açık sorular) ve [`TABLOLAR.md`](TABLOLAR.md) (alan alan liste).

| Yol | İçerik |
|---|---|
| `schema.sql` | Çekirdek şema (36 tablo) |
| `moduller/*.sql` | Opsiyonel modüller: `sektor`, `bulten`, `kariyer`, `acilir_duyuru`, `karar_ek` |
| `ornek_veri.sql` | Kurgusal örnek veri (canlıda kullanmayın) |
| `test/` | Testler: `schema_test.sql`, `beklenen.out`, `calistir.sh`, Directus taslağı |
| `araclar/tablo_belgesi.py` | `TABLOLAR.md`'yi veritabanından üretir |
| `referans/` | Karşılaştırma için ilk GSI şeması ve sorun testleri (bkz. `docs/inceleme-2026-10-09.md` §5.2) |

## Kurulum sırası

```bash
createdb insa
npx directus bootstrap                                      # directus_users, directus_files ... oluşur
psql -X -v ON_ERROR_STOP=1 -d insa -f db/schema.sql         # bu şema directus_users/directus_files'a bağlanır
psql -X -v ON_ERROR_STOP=1 -d insa -f db/moduller/bulten.sql  # istenen modüller
psql -X -v ON_ERROR_STOP=1 -d insa -f db/ornek_veri.sql     # isteğe bağlı
npx directus start                                          # yeni tabloları görmesi için (yeniden) başlatın
```

Şema iki PostgreSQL şeması kullanır:
- `public`: Directus'un yönettiği tablolar.
- `ic`: Directus'un görmediği yardımcılar: doğrulama fonksiyonları, çeviri kuralları, `ic.karar_ara()`, `ic.kisisel_veri_temizle()`.

## Bakım için

- **KVKK temizliği:** `SELECT * FROM ic.kisisel_veri_temizle();` günlük systemd timer ile çağrılmalı. Saklama süresi dolan iletişim mesajlarını siler.
- **Eksik çeviri kontrolü:** `SELECT * FROM ic.ceviri_eksikleri();` boş dönmeli. Varsayılan dilde çevirisi eksik yayındaki ya da görünür kayıt varsa listeler.
- **Yeni tablo eklerken:**
  - Çeviri tablosu `<tablo>_ceviri` adını ve `<tablo>_id` sütununu kullanmalı.
  - Migration'ın sonunda `ic.tetikleyicileri_bagla()` çağrılmalı.
  - Varsayılan dil zorunluluğu gerekiyorsa `ic.ceviri_kurali_ekle(...)` çağrılmalı (modüllerdeki örneklere bakın).
- **Yetki:** Uygulama kullanıcısının `ic.ceviri_kurali` tablosuna yazma yetkisi olmamalı (`REVOKE`); bu tablodaki koşullar dinamik SQL'e girer.
- **Elle verilen kimlikler:** Veri taşırken `id` elle verilirse sayaç ilerletilmeli (`ornek_veri.sql`'in sonundaki blok gibi).

## Test

```bash
db/test/calistir.sh                                   # geçici küme: C ve tr-TR (ICU) yerelinde dener
DATABASE_URL=postgres://user@host/bos_db db/test/calistir.sh   # var olan boş bir veritabanında
db/test/calistir.sh --guncelle                        # test bilerek değiştiyse beklenen çıktıyı yenile
```

Betik `test/directus_taslak.sql` ile Directus'un iki tablosunu taklit eder, ardından şemayı ve **tüm** modülleri yükleyip `schema_test.sql`'i çalıştırır. Çıktıdaki her `ERROR` satırı bilinçli bir negatif test (şu an 46 adet). Betik çıktıyı zaman damgası, uuid ve dosya yolundan arındırıp `beklenen.out` ile karşılaştırır. Geçici küme için `initdb` ve `pg_ctl` gerekir; betik root ile çalışmaz.

T14 grubu Directus uyumunu denetler: tek sütunlu birincil anahtar, enum/domain/bytea/generated sütun olmaması. Gerçek Directus 12.5 ile yapılan deneme `VERI_MODELI.md` §6'da.

## Referans şema

```bash
createdb gsi_test && psql -X -d gsi_test -f db/referans/gsi_schema.sql && psql -X -d gsi_test -f db/referans/gsi_test.sql
# Türkçe yerel testi (bulgu 3) ayrı, tr-TR ICU yerelli bir veritabanı ister
createdb -T template0 --locale-provider=icu --icu-locale=tr-TR --locale=C gsi_tr && psql -X -d gsi_tr -f db/referans/gsi_schema.sql && psql -X -d gsi_tr -f db/referans/gsi_tr_test.sql
```
