// The merch_worker suite (docs/design/merch/TRANSACTIONS.md, PART3.md): one test per row of 2.1 (T2.1-01..36) and 2.2 (T2.2-01..56), plus the
// route, gate, signature, privacy and rate checks, and a Miniflare (workerd) run with real SQLite Durable Objects and alarms.
//   NODE_PATH=$(npm root -g) node cloudflare/merch/test/run.mjs          (ONLY=<regex> runs a subset)
// Needs the PawPrint bundle: NODE_PATH=$(npm root -g) node tools/merch_build.js. Nothing here reaches the network.
process.removeAllListeners('warning'); // node:sqlite is "experimental" on Node 22
const t0 = Date.now();
const { stats } = await import('./harness.mjs');
const parts = [['./t_basics.mjs', 'basics'], ['./t_21.mjs', 't21'], ['./t_22.mjs', 't22'], ['./t_admin.mjs', 'admin'], ['./t_review.mjs', 'review'], ['./t_crash.mjs', 'crashes'], ['./t_part6.mjs', 'part6'], ['./t_fix6.mjs', 'fix6'], ['./t_fix9.mjs', 'fix9'], ['./t_printful.mjs', 'printful'], ['./t_f5.mjs', 'f5'], ['./t_miniflare.mjs', 'miniflare'], ['./t_render.mjs', 't_render']];
for (const [f, fn] of parts) {
  try { const m = await import(f); await m[fn](); }
  catch (e) { if (e && e.code === 'ERR_MODULE_NOT_FOUND' && String(e.message).includes(f.slice(2))) console.log('--- ' + f + ': not written yet'); else { console.log('  CRASH', f, e && e.stack); process.exitCode = 1; } }
}
const s = stats();
const want = [].concat(Array.from({ length: 36 }, (_, i) => 'T2.1-' + String(i + 1).padStart(2, '0')), Array.from({ length: 56 }, (_, i) => 'T2.2-' + String(i + 1).padStart(2, '0')));
const missing = want.filter((id) => !s.rows.has(id));
if (!process.env.ONLY && missing.length) console.log('--- rows without a test: ' + missing.join(' '));
console.log(`${s.passes} passed, ${s.fails} failed of ${s.passes + s.fails} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
if (!s.fails && !process.exitCode && (process.env.ONLY || !missing.length)) console.log('ALL OK');
process.exit(s.fails || process.exitCode || (!process.env.ONLY && missing.length) ? 1 : 0);
