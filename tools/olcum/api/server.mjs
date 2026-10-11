// Ölçüm için en küçük Express + pg API'si. Bağlantı bilgisi PG* ortam değişkenlerinden okunur
// (PGHOST, PGPORT, PGUSER, PGDATABASE); veri için önce bench.sql çalıştırılır.
import express from 'express';
import pg from 'pg';
const pool = new pg.Pool({ max: 5, idleTimeoutMillis: 30000 });
const app = express();
app.use(express.json({ limit: '100kb' }));
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/yayin', async (req, res) => {
  const { rows } = await pool.query('select id, slug, title, excerpt, published_at from bench_yayin where locale = $1 order by published_at desc, id limit 20', [req.query.locale || 'tr']);
  res.json(rows);
});
app.get('/api/yayin/:slug', async (req, res) => {
  const { rows } = await pool.query('select * from bench_yayin where slug = $1', [req.params.slug]);
  rows[0] ? res.json(rows[0]) : res.status(404).end();
});
const port = Number(process.env.PORT || 3055);
app.listen(port, '127.0.0.1', () => console.log('listening', port, process.pid));
