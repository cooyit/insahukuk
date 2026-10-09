#!/usr/bin/env bash
# db/schema.sql'i boş bir veritabanına kurar, schema_test.sql'i çalıştırır ve
# normalleştirilmiş çıktıyı beklenen.out ile karşılaştırır.
#
# Kullanım:
#   db/test/calistir.sh              Geçici bir PostgreSQL kümesi açar; şemayı hem C hem tr-TR (ICU)
#                                    yerelli veritabanında dener. initdb/pg_ctl gerekir, root ile çalışmaz.
#   DATABASE_URL=postgres://... db/test/calistir.sh
#                                    Var olan BOŞ bir veritabanını kullanır (yalnızca o veritabanı).
#   db/test/calistir.sh --guncelle   beklenen.out'u yeniden üretir (test bilerek değiştirildiğinde).
#
# Çıkış kodu 0: şema yüklendi ve çıktı beklenenle aynı.
set -euo pipefail

dizin=$(cd "$(dirname "$0")" && pwd)
sema="$dizin/../schema.sql"
testler="$dizin/schema_test.sql"
beklenen="$dizin/beklenen.out"
guncelle=false
[[ "${1:-}" == "--guncelle" ]] && guncelle=true

# Çalıştırmadan çalıştırmaya değişen kısımlar: dosya yolu, zaman damgası, uuid
normallestir() {
  sed -E \
    -e 's#^psql:[^:]*:([0-9]+):#psql:\1:#' \
    -e 's/[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?([+-][0-9]{2}(:[0-9]{2})?)?/<zaman>/g' \
    -e 's/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/<uuid>/g'
}

# $1: psql bağlantı argümanları, $2: etiket
calistir() {
  local baglanti=$1 etiket=$2 cikti
  psql -X $baglanti -v ON_ERROR_STOP=1 -q -f "$sema" >/dev/null
  cikti=$(psql -X $baglanti -f "$testler" 2>&1 | normallestir)
  if $guncelle; then
    printf '%s\n' "$cikti" > "$beklenen"
    echo "[$etiket] beklenen.out güncellendi"
    guncelle=false   # ikinci veritabanı güncellenmiş dosyayla karşılaştırılsın
  elif diff -u "$beklenen" <(printf '%s\n' "$cikti"); then
    echo "[$etiket] TAMAM: çıktı beklenenle aynı ($(grep -c 'ERROR:' "$beklenen") beklenen ret)"
  else
    echo "[$etiket] FARK VAR (yukarıdaki diff)" >&2
    return 1
  fi
}

if [[ -n "${DATABASE_URL:-}" ]]; then
  calistir "-d $DATABASE_URL" "DATABASE_URL"
  exit 0
fi

if [[ $(id -u) -eq 0 ]]; then
  echo "initdb root ile çalışmaz; normal kullanıcıyla çalıştırın ya da DATABASE_URL verin." >&2
  exit 2
fi

bin=$(pg_config --bindir 2>/dev/null || ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
export PATH="$bin:$PATH"
gecici=$(mktemp -d /tmp/insa-db-test.XXXXXX)
port=$(( 20000 + RANDOM % 20000 ))
temizle() { pg_ctl -D "$gecici/veri" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$gecici"; }
trap temizle EXIT

initdb -D "$gecici/veri" -U postgres --auth=trust -E UTF8 --no-locale >/dev/null
pg_ctl -D "$gecici/veri" -w -l "$gecici/log" \
  -o "-p $port -c listen_addresses='' -c unix_socket_directories='$gecici'" start >/dev/null

baglanti="-h $gecici -p $port -U postgres"
psql -X $baglanti -d postgres -q \
  -c "CREATE DATABASE test_c TEMPLATE template0" \
  -c "CREATE DATABASE test_tr TEMPLATE template0 LOCALE_PROVIDER icu ICU_LOCALE 'tr-TR' LOCALE 'C'"

calistir "$baglanti -d test_c" "C yereli"
calistir "$baglanti -d test_tr" "tr-TR ICU yereli"
