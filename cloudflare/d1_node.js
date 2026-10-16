// A small D1 lookalike over node:sqlite, for the tests (game/test_worker.js, test_cloud.js, test_account.js).
// Covers what cloudflare/worker.js uses: prepare().bind().first()/all()/run() and batch() (all or nothing).
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs'), path = require('path');
function d1(file) {
  const db = new DatabaseSync(file || ':memory:');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  const stmt = (sql, args) => ({
    sql, args: args || [],
    bind(...a) { return stmt(sql, a); },
    async first(col) { const r = db.prepare(sql).get(...this.args); const o = r ? Object.assign({}, r) : null; return col && o ? o[col] : o; },
    async all() { return { results: db.prepare(sql).all(...this.args).map((r) => Object.assign({}, r)), success: true }; },
    async run() { const r = db.prepare(sql).run(...this.args); return { success: true, meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) } }; },
    exec() { return /^\s*(select|insert[\s\S]*returning|with)/i.test(sql) ? db.prepare(sql).all(...this.args) : db.prepare(sql).run(...this.args); }
  });
  return {
    raw: db,
    prepare(sql) { return stmt(sql); },
    async batch(list) {
      db.exec('begin');
      try { const out = list.map((s) => ({ results: [].concat(s.exec()), success: true })); db.exec('commit'); return out; }
      catch (e) { db.exec('rollback'); throw e; }
    },
    async exec(sql) { db.exec(sql); return { count: 1 }; }
  };
}
module.exports = { d1 };
