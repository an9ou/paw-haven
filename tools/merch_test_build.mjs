#!/usr/bin/env node
// Merch part 9: builds the SANDBOX test Worker "doodle-doggo-merch-test" (docs/design/merch/SANDBOX.md, part B). Called by
// tools/merch_test_deploy.sh; it sends nothing anywhere and reads no secret. What it writes, all into one folder OUTSIDE the repo:
//   entry.js          the test entry: the real cloudflare/merch/worker.js (unchanged), plus every released print folder of
//                     site/merch/print/<ART_VER>/ served from Text modules (a Claude session cannot upload Workers static assets: the
//                     cloud proxy replaces their upload token, tools/cf_test.js), plus a guard: anything but MERCH_TEST = "1" answers 503
//   wrangler.toml     only what the bundle needs (name, main, the date, the Text rule)
//   out/              the bundle: `wrangler deploy --dry-run --outdir out` (local only, metrics off; no Cloudflare call)
//   parts.txt         one "file content-type" line per upload part
//   meta_new.json     the upload metadata for the FIRST deploy (with the Durable Object migration, without SELF)
//   meta.json         the upload metadata for every later deploy and the second upload (with SELF, without a migration)
//   vars.json         the plain variables, as sent (no secrets: there are none in this file)
// Every value comes from cloudflare/merch/wrangler.example.toml [env.test] (the contract), with three run values on top (printed):
//   MERCH_FROM       open for the run: MERCH_TEST_FROM (default 2026-11-25T00:00:00+09:00; "" keeps the test shop shut)
//   MERCH_COUNTRIES  the recommended launch list, catalog.js LAUNCH_COUNTRIES (MERCH_TEST_COUNTRIES to change it)
//   MERCH_ART_VERS   the older print folders (as cloudflare/merch/build_assets.mjs prints it)
// MERCH_TEST_DAY_CAP changes MERCH_DAY_CAP (default the toml's 10). Empty variables are left out, so the owner can add MERCH_OWNER_TO,
// MERCH_SELLER_NAME, MERCH_SELLER_ADDR or MERCH_GIFT_NAME as a Secret in the dashboard and a redeploy keeps it (keep_bindings secret_text).
// It refuses (exit 2) when the name is not exactly doodle-doggo-merch-test, the toml's test block changed shape, a test seam or a secret name
// would be sent as a variable, MERCH_TEST is not "1", the printer mode is not "draft", or MERCH_SITE is not the test copy.
//   node tools/merch_test_build.mjs --out <dir> [--no-bundle]     (--no-bundle: everything but the wrangler step; the tests use it)
// Needs: Node, and for the bundle wrangler 4 (WRANGLER=<its bin>, else npx --yes wrangler@4.50.0 from the npm registry).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'doodle-doggo-merch-test', DATE = '2026-03-24';
const args = process.argv.slice(2), val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const OUT = val('--out') ? path.resolve(val('--out')) : null, BUNDLE = !args.includes('--no-bundle');
const die = (m) => { console.error('merch_test_build: refused: ' + m); process.exit(2); };
if (!OUT) die('--out <dir> is needed (a folder outside the repo)');
if (path.resolve(OUT).startsWith(path.resolve(ROOT) + path.sep)) die('--out must be outside the repo (' + OUT + ')');
if ((process.env.MERCH_TEST_NAME || NAME) !== NAME) die('the target name must be exactly ' + NAME);

// ---------- the contract: wrangler.example.toml ----------
const T = fs.readFileSync(path.join(ROOT, 'cloudflare', 'merch', 'wrangler.example.toml'), 'utf8').split('\n');
const sec = (head) => { // the KEY = "value" (or KEY = value) lines of one [section] (comments cut)
  const i = T.findIndex((l) => l.trim() === head || l.trim().startsWith(head + ' ')); if (i < 0) return null;
  const o = {}; let k = 0;
  for (let j = i + 1; j < T.length && !/^\s*\[/.test(T[j]); j++) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("([^"]*)"|\[[^\]]*\]|[^#\s]+)/.exec(T[j]); if (!m) continue;
    o[m[1]] = m[3] !== undefined ? m[3] : m[2]; k++;
  }
  return k ? o : {};
};
const all = (head) => T.reduce((a, l, i) => (l.trim() === head ? a.concat([i]) : a), []).map((i) => { // every [[head]] block
  const o = {}; for (let j = i + 1; j < T.length && !/^\s*\[/.test(T[j]); j++) { const m = /^\s*([A-Za-z_]+)\s*=\s*"([^"]*)"/.exec(T[j]); if (m) o[m[1]] = m[2]; } return o; });
const envTest = sec('[env.test]'), vars0 = sec('[env.test.vars]'), browser = sec('[env.test.browser]');
const dos = all('[[env.test.durable_objects.bindings]]'), svcs = all('[[env.test.services]]'), migs = all('[[migrations]]');
if (!envTest || envTest.name !== NAME) die('[env.test] name is not ' + NAME + ' in wrangler.example.toml');
const WANT_DO = { LEDGER: 'MerchLedger', PRINTS: 'MerchPrints', RENDER: 'MerchRender' };
if (dos.length !== 3 || !dos.every((d) => WANT_DO[d.name] === d.class_name)) die('[env.test] Durable Object bindings are not LEDGER/PRINTS/RENDER');
if (!browser || browser.binding !== 'BROWSER') die('[env.test.browser] binding is not BROWSER');
if (svcs.length !== 1 || svcs[0].binding !== 'SELF' || svcs[0].service !== NAME || svcs[0].entrypoint !== 'RenderGate') die('[[env.test.services]] SELF does not name ' + NAME + ' / RenderGate');
// the migrations this script knows: v1 (MerchLedger, MerchPrints) and v2 (MerchRender), all SQLite. A new tag needs this script changed first.
const tags = migs.map((m) => m.tag);
if (tags.join(',') !== 'v1,v2') die('the toml has migrations ' + tags.join(',') + ': this script knows v1,v2 only (teach it the new tag first)');
const crons = /^crons\s*=\s*\[\s*"([^"]+)"\s*\]/m.exec(T.join('\n'));
if (!crons || crons[1] !== '*/10 * * * *') die('the toml cron is not "*/10 * * * *"');

// ---------- the variables ----------
const P = require(path.join(ROOT, 'merch', 'dist', 'pawprint.js'));
const AV = P.ART_VER, PRINT = path.join(ROOT, 'site', 'merch', 'print');
const folders = fs.existsSync(PRINT) ? fs.readdirSync(PRINT).filter((d) => /^pp1-[0-9a-f]{8}$/.test(d)).sort() : [];
if (!folders.includes(AV)) die('no released print folder for the current ART_VER ' + AV + ' in site/merch/print/ (node tools/merch_build.js first)');
const cat = await import(path.join(ROOT, 'cloudflare', 'merch', 'catalog.js'));
const env = (k, d) => (process.env[k] !== undefined ? process.env[k] : d);
const run = { MERCH_FROM: env('MERCH_TEST_FROM', '2026-11-25T00:00:00+09:00'), MERCH_COUNTRIES: env('MERCH_TEST_COUNTRIES', cat.LAUNCH_COUNTRIES),
  MERCH_ART_VERS: folders.filter((d) => d !== AV).join(','), MERCH_DAY_CAP: env('MERCH_TEST_DAY_CAP', vars0.MERCH_DAY_CAP) };
if (run.MERCH_FROM && !Number.isFinite(Date.parse(run.MERCH_FROM))) die('MERCH_TEST_FROM is not a date: ' + run.MERCH_FROM);
if (!/^\d{1,3}$/.test(String(run.MERCH_DAY_CAP))) die('MERCH_TEST_DAY_CAP must be a small number');
const vars = Object.assign({}, vars0, run);
const SEAMS = ['STRIPE_FETCH', 'PROVIDER_FETCH', 'RENDER_FETCH', 'MAIL_FETCH', 'NOW', 'PAWPRINT', 'RESVG_WASM', 'MERCH_RENDER_PROBE'];
const SECRETS = ['MERCH_STRIPE_KEY', 'MERCH_STRIPE_WEBHOOK_SECRET', 'MERCH_PROVIDER_KEY', 'MERCH_PROVIDER_WEBHOOK_SECRET', 'MERCH_FILE_KEY', 'MERCH_HASH_KEY', 'MERCH_ADMIN_KEY', 'RESEND_API_KEY'];
for (const k of Object.keys(vars)) { if (SEAMS.includes(k)) die('the test seam ' + k + ' would be sent'); if (SECRETS.includes(k)) die('the secret name ' + k + ' would be sent as a plain variable'); }
if (vars.MERCH_TEST !== '1') die('MERCH_TEST is not "1"');
if (vars.MERCH_PROVIDER_MODE !== 'draft') die('MERCH_PROVIDER_MODE is not "draft"');
if (vars.MERCH_SITE !== 'https://test.doodledoggo.app') die('MERCH_SITE is not the test copy');
if (!/^https:\/\/merch-api-test\.doodledoggo\.app$/.test(vars.MERCH_PUBLIC_URL)) die('MERCH_PUBLIC_URL is not https://merch-api-test.doodledoggo.app');
const sent = Object.fromEntries(Object.entries(vars).filter(([, v]) => v !== '' && v != null).sort(([a], [b]) => (a < b ? -1 : 1)));
const left = Object.keys(vars).filter((k) => !(k in sent)).sort();

// ---------- the entry ----------
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'print'), { recursive: true });
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', json: 'application/json' };
const imports = [], table = []; let n = 0;
for (const d of folders) {
  (function walk(dir, rel) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(dir, f.name), r = rel + f.name;
      if (f.isDirectory()) { walk(p, r + '/'); continue; }
      const ext = f.name.split('.').pop(); if (!TYPES[ext]) die('a print folder file of an unknown type: ' + d + '/' + r);
      const mod = 'print/' + d + '__' + r.replace(/\//g, '__') + '.txt';
      fs.copyFileSync(p, path.join(OUT, mod));
      imports.push(`import F${n} from './${mod}';`);
      table.push(`  ${JSON.stringify(d + '/' + r)}: [F${n}, ${JSON.stringify(TYPES[ext])}],`);
      if (r === 'index.html') table.push(`  ${JSON.stringify(d + '/')}: [F${n}, ${JSON.stringify(TYPES[ext])}],`);
      n++;
    }
  })(path.join(PRINT, d), '');
}
const W = path.join(ROOT, 'cloudflare', 'merch', 'worker.js').replace(/\\/g, '/');
fs.writeFileSync(path.join(OUT, 'entry.js'), `// Generated by tools/merch_test_build.mjs for the TEST Worker ${NAME} only (docs/design/merch/SANDBOX.md B). Do not edit.
// The real merch Worker, unchanged; the released print folders from Text modules (no assets upload from a Claude session); a guard.
import worker, { MerchLedger, MerchPrints, MerchRender, RenderGate } from '${W}';
${imports.join('\n')}
const FILES = {
${table.join('\n')}
};
const ASSETS = { fetch: async (req) => {
  const m = /^\\/merch\\/print\\/(.+)$/.exec(new URL(req.url).pathname), f = m && FILES[m[1]];
  return f ? new Response(req.method === 'HEAD' ? null : f[0], { headers: { 'content-type': f[1], 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } }) : new Response('not found', { status: 404 });
} };
// the test entry only ever runs as the test Worker: without MERCH_TEST = "1" it answers 503 and the cron does nothing
const OFF = () => new Response('This is not the merch test Worker.', { status: 503, headers: { 'cache-control': 'no-store' } });
export { MerchLedger, MerchPrints, MerchRender, RenderGate };
export default {
  fetch: (req, env, ctx) => (env && env.MERCH_TEST === '1' ? worker.fetch(req, Object.assign({}, env, { ASSETS }), ctx) : OFF()),
  scheduled: (event, env, ctx) => (env && env.MERCH_TEST === '1' ? worker.scheduled(event, env, ctx) : undefined)
};
`);
fs.writeFileSync(path.join(OUT, 'wrangler.toml'), `name = "${NAME}"\nmain = "entry.js"\ncompatibility_date = "${DATE}"\n[[rules]]\ntype = "Text"\nglobs = ["**/*.txt"]\nfallthrough = true\n`);

// ---------- the metadata (no secret in it: secrets are set by the owner in the dashboard and kept by keep_bindings) ----------
const bindings = Object.entries(WANT_DO).map(([name, class_name]) => ({ type: 'durable_object_namespace', name, class_name }))
  .concat([{ type: 'browser', name: 'BROWSER' }]).concat(Object.entries(sent).map(([name, text]) => ({ type: 'plain_text', name, text })));
const base = { main_module: 'entry.js', compatibility_date: DATE, keep_bindings: ['secret_text'], observability: { enabled: true } };
// first deploy: one migration step to the toml's last tag, all three SQLite classes (the form the 25 Nov cloud test sent and Cloudflare took)
const metaNew = Object.assign({}, base, { bindings, migrations: { new_tag: 'v2', new_sqlite_classes: ['MerchLedger', 'MerchPrints', 'MerchRender'] } });
const meta = Object.assign({}, base, { bindings: bindings.concat([{ type: 'service', name: 'SELF', service: NAME, entrypoint: 'RenderGate' }]) });
fs.writeFileSync(path.join(OUT, 'vars.json'), JSON.stringify(sent, null, 1) + '\n');

let files = ['entry.js'], total = '-';
if (BUNDLE) {
  const cmd = process.env.WRANGLER ? [process.env.WRANGLER, []] : ['npx', ['--yes', 'wrangler@4.50.0']];
  const r = spawnSync(cmd[0], cmd[1].concat(['deploy', '--dry-run', '--outdir', 'out']), { cwd: OUT, encoding: 'utf8', env: Object.assign({}, process.env, { WRANGLER_SEND_METRICS: 'false', CI: '1' }) });
  const m = /Total Upload: ([\d.]+ KiB) \/ gzip: ([\d.]+ KiB)/.exec(r.stdout || '');
  if (r.status !== 0 || !m) { console.error('merch_test_build: the wrangler bundle failed\n' + String(r.stderr || r.stdout || r.error || '').slice(-1500)); process.exit(1); }
  files = fs.readdirSync(path.join(OUT, 'out')).filter((f) => !/\.map$|README/.test(f)).sort();
  total = m[1] + ', gzip ' + m[2];
  if (parseFloat(m[2]) > 3 * 1024) die('the bundle is over the Free plan limit of 3 MB gzip (' + m[2] + ')');
  if (files.includes('worker.js') && !files.includes('entry.js')) { metaNew.main_module = meta.main_module = 'worker.js'; }
}
const typeOf = (f) => (/\.wasm$/.test(f) ? 'application/wasm' : /\.m?js$/.test(f) ? 'application/javascript+module' : 'text/plain');
fs.writeFileSync(path.join(OUT, 'parts.txt'), files.map((f) => f + ' ' + typeOf(f)).join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'meta_new.json'), JSON.stringify(metaNew));
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));

console.log('merch test Worker build: ' + NAME + ', ART_VER ' + AV + ', print folders ' + folders.join(', ') + ' (' + n + ' files as Text modules)');
console.log('  bundle: ' + (BUNDLE ? files.join(', ') + ' (upload ' + total + '; Free limit 3 MB gzip)' : 'skipped (--no-bundle)'));
console.log('  bindings: LEDGER/PRINTS/RENDER (SQLite Durable Objects), BROWSER (Browser Run), SELF -> ' + NAME + ' RenderGate (second upload), ASSETS stood in by the entry');
console.log('  first deploy migration: new_tag v2, new_sqlite_classes MerchLedger, MerchPrints, MerchRender; later deploys send none');
console.log('  variables sent (' + Object.keys(sent).length + '): ' + Object.entries(sent).map(([k, v]) => k + '=' + (v.length > 40 ? v.slice(0, 37) + '...' : v)).join(' '));
console.log('  left out (empty; the owner may add them as Secrets): ' + left.join(', '));
console.log('  files: ' + OUT);
