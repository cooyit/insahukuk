#!/usr/bin/env python3
"""PostgreSQL kümesinin gerçek bellek kullanımı: tüm süreçlerin RSS ve PSS toplamı.
RSS toplamı shared_buffers'ı her süreçte yeniden sayar; fiziksel kullanım için PSS'e bakın.
usage: pgmem.py ETIKET [-v]   (PGDATA_MARK: postmaster komut satırında aranacak veri dizini parçası)
"""
import os, sys, json
label = sys.argv[1] if len(sys.argv) > 1 else 'pg'
tot = dict(rss=0, pss=0, shared_clean=0, shared_dirty=0, private=0, n=0)
procs = []
MARK = os.environ.get('PGDATA_MARK', '/postgresql/')
pm = None
for d in os.listdir('/proc'):
    if d.isdigit():
        try:
            c = open(f'/proc/{d}/cmdline','rb').read().decode(errors='ignore')
            if c.startswith('/usr/lib/postgresql') and MARK in c: pm = d
        except Exception: pass
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
