// MerchPrints: one SQLite Durable Object per JST day ('p-YYYY-MM-DD', then '-b', '-c' when one passes 900 MB), the PNGs only (TRANSACTIONS.md 6.1, 6.6).
// A row is at most 2 MB on Cloudflare (measured: Miniflare refuses a 7 MB blob, SQLITE_TOOBIG), so a PNG is kept in 1 MB parts (PART3.md, contract question 1).
// Internal routes, called only by the ledger and the Worker's file route:
//   PUT  /put?key=&keep=   body: the PNG  -> { bytes, files, shard_bytes } | 507 { error: 'full' }
//   GET  /get?key=          -> the PNG | 404
//   POST /del?key=          -> { files } (an empty shard deletes itself: deleteAll)
//   GET  /stat              -> { files, bytes }
const PART = 1 << 20;
export const SHARD_MAX = 900 * (1 << 20);

export class MerchPrints {
  constructor(state, env) {
    this.state = state; this.env = env; this.sql = state.storage.sql;
  }
  // tables made on each call (cheap): a shard that emptied itself with deleteAll() can take files again
  ensure() {
    this.sql.exec(`create table if not exists prints (key text primary key, sha text, bytes integer, parts integer, created_at integer, keep_until integer);
      create table if not exists print_parts (key text, n integer, data blob, primary key (key, n));`);
  }
  stat() { const r = this.sql.exec('select count(*) as files, coalesce(sum(bytes), 0) as bytes from prints').toArray()[0]; return { files: Number(r.files), bytes: Number(r.bytes) }; }
  async fetch(req) {
    this.ensure();
    const u = new URL(req.url), key = u.searchParams.get('key') || '';
    if (u.pathname === '/stat') return Response.json(this.stat());
    if (!/^[A-Za-z0-9_.~-]{1,120}$/.test(key)) return new Response('bad key', { status: 400 });
    if (u.pathname === '/put' && req.method === 'PUT') {
      const buf = new Uint8Array(await req.arrayBuffer()); const s = this.stat();
      if (s.bytes + buf.length > Number(this.env.MERCH_SHARD_MAX || SHARD_MAX)) return Response.json({ error: 'full' }, { status: 507 });
      const parts = Math.max(1, Math.ceil(buf.length / PART));
      try {
        this.state.storage.transactionSync(() => {
          this.sql.exec('delete from print_parts where key = ?', key);
          for (let i = 0; i < parts; i++) this.sql.exec('insert into print_parts (key, n, data) values (?, ?, ?)', key, i, buf.subarray(i * PART, (i + 1) * PART));
          this.sql.exec('insert or replace into prints (key, sha, bytes, parts, created_at, keep_until) values (?, ?, ?, ?, ?, ?)', key, u.searchParams.get('sha') || null, buf.length, parts, Date.now(), Number(u.searchParams.get('keep')) || null);
        });
      } catch (e) { return Response.json({ error: 'full', why: String((e && e.message) || e).slice(0, 80) }, { status: 507 }); }
      const t = this.stat(); return Response.json({ bytes: buf.length, files: t.files, shard_bytes: t.bytes });
    }
    if (u.pathname === '/get') {
      const row = this.sql.exec('select bytes, parts from prints where key = ?', key).toArray()[0];
      if (!row) return new Response('not found', { status: 404 });
      const parts = this.sql.exec('select data from print_parts where key = ? order by n', key).toArray().map((r) => new Uint8Array(r.data));
      return new Response(new Blob(parts), { headers: { 'content-type': 'image/png', 'content-length': String(row.bytes), 'cache-control': 'private, max-age=3600' } });
    }
    if (u.pathname === '/del' && req.method === 'POST') {
      this.state.storage.transactionSync(() => { this.sql.exec('delete from print_parts where key = ?', key); this.sql.exec('delete from prints where key = ?', key); });
      const t = this.stat(); if (!t.files) await this.state.storage.deleteAll();
      return Response.json({ files: t.files });
    }
    return new Response('not found', { status: 404 });
  }
}
