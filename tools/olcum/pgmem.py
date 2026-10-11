#!/usr/bin/env python3
"""PostgreSQL kümesinin gerçek bellek kullanımı: tüm süreçlerin RSS ve PSS toplamı.
RSS toplamı shared_buffers'ı her süreçte yeniden sayar; fiziksel kullanım için PSS'e bakın.
usage: [PGDATA_MARK=/veri/dizini] pgmem.py ETIKET [-v]   (birden çok küme varsa PGDATA_MARK zorunlu)
"""
import os, sys, json
label = sys.argv[1] if len(sys.argv) > 1 else 'pg'
tot = dict(rss=0, pss=0, shared_clean=0, shared_dirty=0, private=0, n=0)
procs = []
# Birden çok küme çalışıyorsa PGDATA_MARK zorunlu; tek aday bulunmazsa adayları listeleyip çıkar.
MARK = os.environ.get('PGDATA_MARK', '')
adaylar = []
for d in os.listdir('/proc'):
    if d.isdigit():
        try:
            a = open(f'/proc/{d}/cmdline','rb').read().split(b'\0')
            if os.path.basename(a[0]) == b'postgres' and b'-D' in a and b'--single' not in a \
               and MARK.encode() in b' '.join(a): adaylar.append((d, b' '.join(a).decode(errors='ignore')))
        except Exception: pass
if len(adaylar) != 1:
    print(f'{len(adaylar)} postmaster bulundu; PGDATA_MARK ile veri dizinini belirtin:', file=sys.stderr)
    [print('  ', d, c[:100], file=sys.stderr) for d, c in adaylar]
    sys.exit(2)
pm = adaylar[0][0]
def ppid(d):
    s = open(f'/proc/{d}/stat').read(); return s[s.rfind(')')+2:].split()[1]
for d in os.listdir('/proc'):
    if not d.isdigit(): continue
    try:
        if d != pm and ppid(d) != pm: continue
        with open(f'/proc/{d}/cmdline','rb') as f: cmd = f.read().replace(b'\0', b' ').decode()[:60]
        v = {}
        with open(f'/proc/{d}/smaps_rollup') as f:
            for line in f:
                p = line.split()
                if len(p) >= 2 and p[0].endswith(':') and p[1].isdigit(): v[p[0][:-1]] = int(p[1])
    except Exception: continue
    tot['n'] += 1; tot['rss'] += v.get('Rss',0); tot['pss'] += v.get('Pss',0)
    tot['shared_clean'] += v.get('Shared_Clean',0); tot['shared_dirty'] += v.get('Shared_Dirty',0)
    tot['private'] += v.get('Private_Clean',0) + v.get('Private_Dirty',0)
    procs.append((cmd.strip(), round(v.get('Rss',0)/1024,1), round(v.get('Pss',0)/1024,1)))
out = {k: (round(x/1024,1) if k!='n' else x) for k,x in tot.items()}
out['label'] = label
print(json.dumps(out)); [print('  ', p) for p in sorted(procs)] if '-v' in sys.argv else None
