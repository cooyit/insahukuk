# Kapasite ölçüm araçları

İnceleme belgesinin §3'ündeki Astro 5/7 (422 sayfa), Express, PostgreSQL ve Directus ölçümleri bu betiklerle yapıldı; ham sonuçlar `sonuclar/` altında. 717 sayfalık Astro 7 ve Payload derleme ölçümleri ayrı bir cgroup düzeneğiyle yapıldı; onların ham çıktıları burada yok. Depoda yalnızca Astro 5.18 (JSON) test projesi var; Astro 7, Markdown koleksiyonu, Directus ve Payload proje dosyaları yok.

Ölçüm makinesi 4 vCPU / 16 GB bir KVM'di; 2 ve 1 vCPU'luk sunucu `taskset` + `cpus.cjs` ile taklit edildi. Sunucu alındıktan sonra aynı ölçümler gerçek makinede tekrarlanmalı.

| Dosya | Ne yapar |
|---|---|
| `measure.py` | Bir komutu çalıştırır, süreç ağacının tepe RSS/PSS değerini 100 ms aralıkla ölçer ve en büyük tek sürecin `ru_maxrss` değerini de kaydeder. Sonucu `sonuclar/derleme.jsonl`'e ekler; `OLCUM_CIKTI=/tmp/x.jsonl` ile başka dosyaya yazar |
| `pgmem.py` | PostgreSQL süreçlerinin RSS ve PSS toplamı (RSS paylaşılan belleği çift sayar; PSS'e bakın). Birden çok küme varsa `PGDATA_MARK` zorunlu |
| `cpus.cjs` | `EMU_CPUS=N` ile Node'a N çekirdek gösterir (Astro'nun görsel kuyruğu eşzamanlılığı çekirdek sayısından alıyor) |
| `gen.mjs` | Test sitesi için 200 yazı x TR/EN (2–4 bin kelime) ve 20 adet 2400x1600 PNG üretir; `--md` ile Markdown koleksiyonu senaryosunun dosyalarını da yazar |
| `astro-test/` | Ölçülen Astro 5.18 sitesi (JSON + `set:html`, `astro:assets`, i18n); `package-lock.json` ölçülen sürümleri sabitler |
| `api/` | Ölçülen Express 5 + pg API'si ve sentetik veri (`bench.sql`) |
| `sonuclar/` | Ham sonuçlar: `derleme.jsonl` (derlemeler), `servisler.jsonl` (Express, PostgreSQL, Directus belleği) |

§3'teki Astro 5 satırları en büyük tek sürecin değeridir (`ru_maxrss`); süreç ağacının toplamı ~30 MB daha fazladır (ör. 688 → 718 MB).

## Örnek

Depo kökünden çalıştırın. Ölçümlerin depodaki ham sonuçlara eklenmemesi için `OLCUM_CIKTI` verin.

```bash
export OLCUM_CIKTI=/tmp/olcum.jsonl

# Astro derlemesi (her ölçümden önce önbelleği silin: soğuk derleme)
(
  cd tools/olcum/astro-test && npm ci && node ../gen.mjs "$PWD"
  rm -rf dist .astro node_modules/.astro
  # 2 vCPU taklidi (ölçümde 688 MB, 15 sn)
  EMU_CPUS=2 VIPS_CONCURRENCY=2 NODE_OPTIONS="--require $PWD/../cpus.cjs" \
    taskset -c 0,1 python3 ../measure.py astro-2cpu -- node node_modules/astro/astro.js build
  rm -rf dist .astro node_modules/.astro
  # Aynı taklit + MALLOC_ARENA_MAX=2 (ölçümde 584 MB)
  MALLOC_ARENA_MAX=2 EMU_CPUS=2 VIPS_CONCURRENCY=2 NODE_OPTIONS="--require $PWD/../cpus.cjs" \
    taskset -c 0,1 python3 ../measure.py astro-arena2 -- node node_modules/astro/astro.js build
)

# PostgreSQL gerçek bellek kullanımı (veri dizinini kendi kümenize göre yazın)
PGDATA_MARK=/var/lib/postgresql/16/main python3 tools/olcum/pgmem.py pg-bosta -v

# API (bağlantı PG* ortam değişkenlerinden)
createdb olcum && psql -X -d olcum -f tools/olcum/api/bench.sql
(cd tools/olcum/api && npm ci && PGDATABASE=olcum node server.mjs)   # ön planda çalışır
# ikinci terminalde:
npx autocannon -c 50 -d 10 http://127.0.0.1:3055/api/yayin/tr-yazi-1
```

Astro'yu `npx` yerine doğrudan `node node_modules/astro/astro.js` ile çalıştırın; `npx` ölçüme 60–100 MB ekliyor.
