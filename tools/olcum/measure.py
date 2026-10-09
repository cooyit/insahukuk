#!/usr/bin/env python3
"""Run a command, poll its whole process tree every 100 ms and report
peak tree RSS / PSS, ru_maxrss of children (like /usr/bin/time -v) and CPU time.
usage: measure.py ETIKET -- komut argumanlar...  (sonuç: sonuclar/derleme.jsonl)
"""
import os, sys, time, subprocess, resource, json

def children_map():
    m = {}
    for d in os.listdir('/proc'):
        if not d.isdigit():
            continue
        try:
            with open(f'/proc/{d}/stat') as f:
                s = f.read()
            ppid = int(s[s.rfind(')') + 2:].split()[1])
            m.setdefault(ppid, []).append(int(d))
        except Exception:
            pass
    return m

def tree(pid):
    m = children_map(); out = [pid]; i = 0
    while i < len(out):
        out.extend(m.get(out[i], [])); i += 1
    return out

def mem(pid):
    rss = pss = 0
    try:
        with open(f'/proc/{pid}/smaps_rollup') as f:
            for line in f:
                if line.startswith('Rss:'): rss = int(line.split()[1])
                elif line.startswith('Pss:'): pss = int(line.split()[1])
    except Exception:
        pass
    return rss, pss

label = sys.argv[1]
cmd = sys.argv[sys.argv.index('--') + 1:]
t0 = time.time()
p = subprocess.Popen(cmd)
peak_rss = peak_pss = 0; peak_n = 0; samples = 0
while p.poll() is None:
    pids = tree(p.pid)
    r = s = 0
    for pid in pids:
        a, b = mem(pid); r += a; s += b
    if r > peak_rss: peak_rss = r; peak_n = len(pids)
    peak_pss = max(peak_pss, s); samples += 1
    time.sleep(0.1)
wall = time.time() - t0
ru = resource.getrusage(resource.RUSAGE_CHILDREN)
res = dict(label=label, exit=p.returncode, wall_s=round(wall, 1),
           peak_tree_rss_mb=round(peak_rss / 1024, 1), peak_tree_pss_mb=round(peak_pss / 1024, 1),
           procs_at_peak=peak_n, max_single_proc_rss_mb_ru_maxrss=round(ru.ru_maxrss / 1024, 1),
           user_cpu_s=round(ru.ru_utime, 1), sys_cpu_s=round(ru.ru_stime, 1),
           avg_cpu_cores=round((ru.ru_utime + ru.ru_stime) / wall, 2), samples=samples)
print('MEASURE ' + json.dumps(res), file=sys.stderr)
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sonuclar')
os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, 'derleme.jsonl'), 'a') as f:
    f.write(json.dumps(res) + '\n')
sys.exit(p.returncode)
