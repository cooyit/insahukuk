# Kapasite ölçüm araçları

İnceleme belgesinin §3'ündeki bellek ölçümleri bu betiklerle yapıldı. Sunucu alındıktan sonra aynı ölçümler gerçek makinede tekrarlanmalı. Ölçüm makinesi 4 vCPU / 16 GB bir KVM'di; 2 ve 1 vCPU'luk sunucu `taskset` + `cpus.cjs` ile taklit edildi.

| Dosya | Ne yapar |
|---|---|
| `measure.py` | Bir komutu çalıştırır, süreç ağacının tepe RSS/PSS değerini 100 ms aralıkla ölçer, `sonuclar/derleme.jsonl`'e ekler |
| `pgmem.py` | PostgreSQL süreçlerinin RSS ve PSS toplamı (RSS paylaşılan belleği çift sayar; PSS'e bakın) |
| `cpus.cjs` | `EMU_CPUS=N` ile Node'a N çekirdek gösterir (Astro'nun görsel kuyruğu eşzamanlılığı çekirdek sayısından alıyor) |
| `gen.mjs` | Test sitesi için 200 yazı x TR/EN (2–4 bin kelime) ve 20 adet 2400x1600 PNG üretir |
| `astro-test/` | Ölçülen Astro 5.18 sitesi (JSON + `set:html`, `astro:assets`, i18n) |
| `api/` | Ölçülen Express 5 + pg API'si ve sentetik veri (`bench.sql`) |
| `sonuclar/` | Ham sonuçlar: derleme ölçümleri ve servis bellekleri |

## Örnek

```bash
cd tools/olcum/astro-test && npm install && mkdir -p data && node ../gen.mjs "$PWD"
# 2 vCPU taklidi
EMU_CPUS=2 VIPS_CONCURRENCY=2 NODE_OPTIONS="--require $PWD/../cpus.cjs" \
  taskset -c 0,1 python3 ../measure.py astro-2cpu -- node node_modules/astro/astro.js build
# MALLOC_ARENA_MAX=2 ile (ölçümde 688 -> 584 MB)
MALLOC_ARENA_MAX=2 python3 ../measure.py astro-arena2 -- node node_modules/astro/astro.js build

# PostgreSQL gerçek bellek kullanımı
python3 tools/olcum/pgmem.py pg-bosta -v

# API
psql -d olcum -f tools/olcum/api/bench.sql
cd tools/olcum/api && npm install && PGDATABASE=olcum node server.mjs
npx autocannon -c 50 -d 10 http://127.0.0.1:3055/api/yayin/tr-yazi-1
```

Astro'yu `npx` yerine doğrudan `node node_modules/astro/astro.js` ile çalıştırın; `npx` ölçüme 60–100 MB ekliyor.
