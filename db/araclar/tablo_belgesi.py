#!/usr/bin/env python3
"""db/TABLOLAR.md'yi üretir: tablo açıklamaları, alanlar, tipler, ilişkiler ve kurallar.

Kaynaklar: şemanın yüklü olduğu veritabanı (COMMENT ON TABLE, sütunlar, kısıtlar) ve
SQL dosyalarındaki satır içi açıklamalar (sütun satırının sonundaki -- ...).

Kullanım (şema + tüm modüller yüklü bir veritabanına PG* ortam değişkenleriyle bağlanır):
  python3 db/araclar/tablo_belgesi.py > db/TABLOLAR.md
"""
import glob
import os
import re
import subprocess
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSYALAR = [os.path.join(KOK, 'schema.sql')] + sorted(glob.glob(os.path.join(KOK, 'moduller', '*.sql')))


def sorgu(sql):
    cikti = subprocess.run(['psql', '-X', '-At', '-F', '\x1f', '-R', '\x1e', '-c', sql],
                           check=True, capture_output=True, text=True).stdout
    # çok satırlı kısıt tanımları (CASE ...) tek satıra indirilir
    return [[re.sub(r'\s+', ' ', alan) for alan in kayit.split('\x1f')]
            for kayit in cikti.rstrip('\n').split('\x1e') if kayit]


def sql_dosyalarini_oku():
    """Tablo sırası, tablonun hangi dosyada olduğu ve sütun satırlarındaki açıklamalar."""
    sira, dosyasi, aciklama = [], {}, {}
    for yol in DOSYALAR:
        tablo = None
        for satir in open(yol, encoding='utf-8'):
            m = re.match(r'^CREATE TABLE (?:public\.)?([a-z_]+) \(', satir)
            if m:
                tablo = m.group(1)
                sira.append(tablo)
                dosyasi[tablo] = os.path.relpath(yol, os.path.dirname(KOK))
                continue
            if tablo and satir.startswith(');'):
                tablo = None
                continue
            m = re.match(r'^\s+([a-z_]+)\s+\S.*?--\s*(.+?)\s*$', satir)
            if tablo and m and not satir.lstrip().startswith(('CHECK', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'EXCLUDE', '--')):
                aciklama[(tablo, m.group(1))] = m.group(2)
            m = re.match(r'^ALTER TABLE ([a-z_]+)', satir)
            if m:
                tablo = m.group(1)
                continue
            m = re.match(r'^\s+ADD COLUMN ([a-z_]+)', satir)
            if tablo and m:
                aciklama.setdefault((tablo, m.group(1)), 'ekleyen modül: `%s`' % os.path.relpath(yol, os.path.dirname(KOK)))
    return sira, dosyasi, aciklama


TIPLER = {'integer': 'sayı', 'smallint': 'küçük sayı', 'text': 'metin', 'boolean': 'evet/hayır',
          'timestamp with time zone': 'tarih-saat', 'date': 'tarih', 'uuid': 'uuid'}


def kural_ozeti(tanim, sutun):
    t = tanim[len('CHECK '):] if tanim.startswith('CHECK ') else tanim
    ozel = {'ic.slug_gecerli': 'slug biçimi (a-z, 0-9, -)', 'ic.eposta_gecerli': 'küçük harfli ASCII e-posta',
            'ic.telefon_gecerli': '+90… biçimi', 'ic.https_url_gecerli': 'https:// bağlantı',
            'ic.baglanti_gecerli': '/yol ya da https://', 'ic.isbn_gecerli': 'geçerli ISBN-10/13'}
    for f, metin in ozel.items():
        if t == '(%s(%s))' % (f, sutun):
            return metin
    m = re.fullmatch(r"\(\(%s = ANY \(ARRAY\[(.*)\]\)\)\)" % sutun, t)
    if m:
        return 'değerler: ' + ', '.join(re.findall(r"'([^']*)'::text", m.group(1)))
    m = re.fullmatch(r"\(\(\(%s >= (\d+)\) AND \(%s <= (\d+)\)\)\)" % (sutun, sutun), t)
    if m:
        return '%s–%s' % m.groups()
    m = re.fullmatch(r"\(\(%s >= '([0-9-]+)'::date\)\)" % sutun, t)
    if m:
        return 'en erken %s' % m.group(1)
    m = re.fullmatch(r"\(\(\(length\(%s\) >= (\d+)\) AND \(length\(%s\) <= (\d+)\)\)\)" % (sutun, sutun), t)
    if m:
        return '%s–%s karakter' % m.groups()
    m = re.fullmatch(r"\(\(%s > (\d+)\)\)" % sutun, t)
    if m:
        return '> %s' % m.group(1)
    m = re.fullmatch(r"\(\(length\(%s\) <= (\d+)\)\)" % sutun, t)
    if m:
        return 'en çok %s karakter' % m.group(1)
    m = re.fullmatch(r"\(\(%s ~ '(.*)'::text\)\)" % sutun, t)
    if m:
        return 'biçim `%s`' % m.group(1)
    return '`%s`' % t


def varsayilan_ozeti(d):
    if not d:
        return ''
    if d.startswith('nextval(') or d == 'otomatik':
        return 'otomatik'
    if d == 'now()':
        return 'şimdi'
    m = re.fullmatch(r"'(.*)'::text", d)
    if m:
        return m.group(1)
    return d.replace("'1 year'::interval", "1 yıl")


def main():
    sira, dosyasi, aciklama = sql_dosyalarini_oku()
    tablolar = dict(sorgu("""
      SELECT c.relname, coalesce(obj_description(c.oid, 'pg_class'), '')
      FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
        AND c.relname NOT LIKE 'directus\\_%'"""))
    sutunlar = sorgu("""
      SELECT c.relname, a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull,
             CASE WHEN a.attidentity <> '' THEN 'otomatik' ELSE coalesce(pg_get_expr(d.adbin, d.adrelid), '') END,
             coalesce(a.attcollation::regcollation::text, '')
      FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum""")
    kisitlar = sorgu("""
      SELECT c.conrelid::regclass::text, c.contype,
             (SELECT string_agg(a.attname, ',' ORDER BY k.n) FROM unnest(c.conkey) WITH ORDINALITY k(attnum, n)
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum),
             coalesce(c.confrelid::regclass::text, ''), c.confdeltype, pg_get_constraintdef(c.oid), c.condeferrable
      FROM pg_constraint c WHERE c.connamespace = 'public'::regnamespace
      ORDER BY 1, 2, 3""")

    fk, tek_kural, tekil, tablo_kurallari = {}, {}, set(), {}
    silme = {'c': 'o kayıt silinirse bu da silinir', 'n': 'o kayıt silinirse boş kalır', 'a': 'bağlıyken o kayıt silinemez'}
    for tablo, tur, cols, hedef, del_tip, tanim, ertelenmis in kisitlar:
        tek = ',' not in cols
        if tur == 'f' and tek:
            fk[(tablo, cols)] = (hedef, silme.get(del_tip, ''))
        elif tur == 'c' and tek:
            tek_kural.setdefault((tablo, cols), []).append(kural_ozeti(tanim, cols))
        elif tur == 'u' and tek:
            tekil.add((tablo, cols))
        elif tur in ('u', 'c', 'x'):
            ad = {'u': 'tekil', 'c': 'kural', 'x': 'çakışma yasağı'}[tur]
            ek = ' (COMMIT anında)' if ertelenmis == 't' else ''
            tablo_kurallari.setdefault(tablo, []).append('%s%s: `%s`' % (ad, ek, tanim))

    alanlar = {}
    for tablo, ad, tip, notnull, varsayilan, collation in sutunlar:
        alanlar.setdefault(tablo, []).append((ad, tip, notnull == 't', varsayilan, collation))

    yaz = sys.stdout.write
    yaz('# Tablolar\n\n')
    yaz('> Bu dosya `db/araclar/tablo_belgesi.py` ile veritabanından üretildi; elle düzenlemeyin.\n')
    yaz('> Genel kurallar, diyagramlar ve açık sorular için: [VERI_MODELI.md](VERI_MODELI.md).\n\n')
    yaz('**Zorunlu** sütunu: ✓ = boş bırakılamaz · *otomatik* / *şimdi* / değer = boş bırakılırsa veritabanı doldurur.\n\n')

    gruplar = {}
    for t in sira:
        gruplar.setdefault(dosyasi[t], []).append(t)
    for dosya, liste in gruplar.items():
        baslik = 'Çekirdek şema (`db/schema.sql`)' if dosya.endswith('schema.sql') else 'Modül: `%s`' % dosya
        yaz('## %s\n\n' % baslik)
        yaz(' · '.join('[`%s`](#%s)' % (t, t) for t in liste) + '\n\n')
        for t in liste:
            yaz('### `%s`\n\n' % t)
            if tablolar.get(t):
                yaz('%s.\n\n' % tablolar[t].rstrip('.'))
            yaz('| Alan | Tip | Zorunlu | Açıklama |\n|---|---|---|---|\n')
            for ad, tip, notnull, varsayilan, collation in alanlar.get(t, []):
                tip_tr = TIPLER.get(tip, tip)
                if collation == '"tr-x-icu"':
                    tip_tr += ' (Türkçe sıralı)'
                v = varsayilan_ozeti(varsayilan)
                zorunlu = ('*%s*' % v) if v else ('✓' if notnull else '')
                parcalar = []
                if (t, ad) in aciklama:
                    parcalar.append(aciklama[(t, ad)])
                if (t, ad) in fk:
                    hedef, davranis = fk[(t, ad)]
                    parcalar.append('→ `%s` (%s)' % (hedef, davranis) if davranis else '→ `%s`' % hedef)
                if (t, ad) in tekil:
                    parcalar.append('tekil')
                parcalar += tek_kural.get((t, ad), [])
                if ad == 'id':
                    parcalar.insert(0, 'birincil anahtar')
                metin = ' · '.join(parcalar).replace('|', '\\|')
                yaz('| `%s` | %s | %s | %s |\n' % (ad, tip_tr, zorunlu, metin))
            if t in tablo_kurallari:
                yaz('\n**Tablo kuralları**\n\n')
                for k in tablo_kurallari[t]:
                    yaz('- %s\n' % k.replace('|', '\\|'))
            yaz('\n')


if __name__ == '__main__':
    main()
