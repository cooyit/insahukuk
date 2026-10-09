# insahukuk

Hukuk ve arabuluculuk bürosu web sitesi projesi (çalışma adı; büro unvanı ve alan adı için bkz. inceleme belgesi §7).

## İçerik

| Yol | Açıklama |
|---|---|
| [`docs/inceleme-2026-10-09.md`](docs/inceleme-2026-10-09.md) | Ön inceleme: VPS mi hosting mi, mimari ve yönetim paneli, kapasite ölçümleri, veri modeli, referans siteler, mevzuat ve KVKK, büroya sorulacaklar |
| [`db/schema.sql`](db/schema.sql) | Revize PostgreSQL 16 şeması (56 tablo) — [`db/README.md`](db/README.md) |
| [`db/test/`](db/test/) | Şema testleri ve çalıştırıcı (`db/test/calistir.sh`) |
| [`db/referans/`](db/referans/) | Karşılaştırma için ilk GSI şeması ve sorunlarını gösteren testler |
| [`tools/olcum/`](tools/olcum/) | Bellek/CPU ölçüm betikleri ve ham sonuçlar |

## Kısaca karar

- Türkiye'de, kendi çekirdeği olan bir VDS (OpenVZ değil); 2 GB RAM ile başlanır.
- Halka açık site Astro ile statik üretilir; yönetim paneli hazır CMS (Directus 12, yedek seçenek Payload 3); veritabanı PostgreSQL 16; Caddy + systemd, Docker yok.
- Unvan ve `.av.tr` alan adı, logo ve tasarımdan önce baroya sorulmalı.
