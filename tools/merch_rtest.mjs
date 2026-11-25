#!/usr/bin/env node
// Merch part 4: the ONE throwaway cloud test of the print render (docs/design/merch/PART4.md, "The cloud test"). PREPARED ONLY: it runs for real
// only after the owner approved it, and only with BOTH switches:   DRY_RUN=0 RTEST_GO=yes-the-owner-approved node tools/merch_rtest.mjs
// By default (DRY_RUN unset or anything but 0) it builds the bundle (wrangler --dry-run, no Cloudflare call) and PRINTS every request it would send.
//
// What a real run does (Free plan, nothing kept):
//   1. lists the accounts (refuses when more than one is visible and CLOUDFLARE_ACCOUNT_ID is not set), counts the account's Workers and Durable
//      Object namespaces (to compare at the end); refuses if doodle-doggo-merch-rtest already exists
//   2. uploads ONE Worker doodle-doggo-merch-rtest: the real merch Worker (cloudflare/merch/worker.js) wrapped by a small entry that serves the
//      released print page (site/merch/print/<ART_VER>/) itself; the Browser Run binding BROWSER, the Durable Objects LEDGER, PRINTS, RENDER
//      (migration v1, SQLite), the self binding SELF -> RenderGate (a second upload: it names itself); workers.dev only, no custom domain, no
//      cron; the shop gate shut (MERCH_FROM empty, no Stripe or printer key); our browser budget capped at 60 s (MERCH_BROWSER_BUDGET_MS);
//      MERCH_RENDER_PROBE = 1 (lets the self-test ask twice 1 s apart, once). MERCH_ADMIN_KEY and MERCH_FILE_KEY are random, made in memory
//      here, sent only inside the upload (stdin) and the admin calls (an env variable of curl), never printed or written anywhere. The Worker
//      counts as made from the moment the first upload is SENT (an upload that times out may still have made it)
//   3. the admin render self-test (POST /merch/admin/render-test), 12 s apart: tee and mug for 3 sample dogs by Browser Run called from the
//      ledger object (direct); one tee and one mug through the front Worker (via worker); the same 6 by the resvg fallback; then the rate probe:
//      two browser calls 1 s apart, to record Browser Run's real 429 text once. 10 browser renders in all (at most 16; about 10 s of browser
//      time). After 2 browser failures every later browser job (and the probe) is skipped and reported, the resvg jobs still run
//   4. every file is downloaded through its signed link and checked: sha-256 as reported, exact size, its PNG colour type, tee corners clear;
//      each file is compared with this machine's Chromium drawing the same page with the same options (render.js matchPx: browser files should
//      be equal pixel for pixel, RENDER_FREE 8; resvg files within MATCH: mean per channel under 0.2 and at most 5,000 / 3,000 pixels more than
//      32 apart); then the front Worker's start-up time (from the upload answers) and its CPU (GraphQL workersInvocationsAdaptive) if readable
//   5. ALWAYS, on every way out (an error, Ctrl-C / SIGINT, SIGTERM): deletes the Worker (force: its Durable Object namespaces go with it; a 404
//      means it is gone already) and checks the Worker count and the Durable Object namespaces are as before. If the delete fails it prints ONE
//      line telling the owner to delete the Worker by hand (HAND below), still prints the counts and writes the report, and exits non-zero
// The results (status, X-Browser-Ms-Used also on errors, sizes, colour types, sha, the 429 texts, the differences, start-up and CPU) go to a JSON
// file in RTEST_OUT (default: a new temp folder), never into the repo. Not verified even by a real run: the daily 429 text (the kit never spends
// the day's 10 minutes to provoke it). Needs: Node, curl, wrangler 4 (WRANGLER=<path to its bin>, else npx --yes wrangler@4.50.0), and for
// step 4 Playwright (NODE_PATH=$(npm root -g)). In a Claude cloud session the proxy adds the Cloudflare API token; anywhere else export
// CLOUDFLARE_API_TOKEN (Workers Scripts: Edit; Account Analytics: Read for the CPU line; passed to curl through its environment, never on the
// command line). CLOUDFLARE_ACCOUNT_ID is needed when the token sees more than one account.
// RTEST_FAKE=<cases> (tests only, test/t_render.mjs F4-kit): the same run against an in-memory fake of the Cloudflare API: nothing is sent, no
// bundle, no waits. Cases (comma separated): ok, upload_timeout, delete_fails, delete_404, accounts2, browser_fails, hang.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as render from '../cloudflare/merch/render.js';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'doodle-doggo-merch-rtest', DATE = '2026-03-24', CF = 'https://api.cloudflare.com/client/v4';
const FAKE = process.env.RTEST_FAKE ? new Set(process.env.RTEST_FAKE.split(',')) : null;
const DRY = process.env.DRY_RUN !== '0' && !FAKE;
const GO = process.env.RTEST_GO === 'yes-the-owner-approved';
if (!DRY && !GO && !FAKE) { console.error('merch_rtest: a real run needs the owner’s approval: DRY_RUN=0 RTEST_GO=yes-the-owner-approved (else run it dry)'); process.exit(2); }
// the one line the owner needs when the delete did not go through (also in PART4.md's run book)
const HAND = 'CLEAN UP BY HAND: the test Worker ' + NAME + ' may still exist. In the Cloudflare dashboard open Workers & Pages, select ' + NAME + ', Settings, Delete (its Durable Objects go with it).';
const OUT = process.env.RTEST_OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'merch-rtest-'));
fs.mkdirSync(OUT, { recursive: true });
let ACC = process.env.CLOUDFLARE_ACCOUNT_ID || null;
// the account id is not a secret, but a dry run prints none
const log = (...a) => console.log(...a.map((x) => (DRY && ACC && typeof x === 'string' ? x.split(ACC).join('<account_id>') : x)));
const P = require(path.join(ROOT, 'merch', 'dist', 'pawprint.js')), SAMPLES = require(path.join(ROOT, 'merch', 'sample_dogs.js'))(P);
const AV = P.ART_VER, PRINT = path.join(ROOT, 'site', 'merch', 'print', AV);
if (!fs.existsSync(path.join(PRINT, 'index.html'))) { console.error('merch_rtest: no released print page for ' + AV + ' (site/merch/print/)'); process.exit(1); }
const DOGS = ['akita', 'dane', 'golden'];
const BROWSER_STOP = 2; // browser failures after which every later browser job is skipped (review finding 4)

// ---------- 1. the bundle (wrangler --dry-run: bundles only, sends nothing; metrics off) ----------
const BUILD = fs.mkdtempSync(path.join(os.tmpdir(), 'merch-rtest-build-'));
function build() {
  if (FAKE) { log('FAKE: no bundle (nothing is sent anywhere)'); return ['entry.js', 'index_bg.wasm']; }
  fs.mkdirSync(path.join(BUILD, 'print'));
  for (const f of ['index.html', 'pawprint.js', 'print.js']) fs.copyFileSync(path.join(PRINT, f), path.join(BUILD, 'print', f + '.txt')); // Text modules
  const W = path.join(ROOT, 'cloudflare', 'merch', 'worker.js').replace(/\\/g, '/');
  fs.writeFileSync(path.join(BUILD, 'entry.js'), `// the rtest entry: the real merch Worker, plus the released print page served from text modules (no assets upload from a session)
import worker, { MerchLedger, MerchPrints, MerchRender, RenderGate } from '${W}';
import INDEX from './print/index.html.txt';
import PAW from './print/pawprint.js.txt';
import PRINT from './print/print.js.txt';
const AV = '${AV}', H = 'text/html; charset=utf-8', J = 'text/javascript; charset=utf-8';
const FILES = { '': [INDEX, H], 'index.html': [INDEX, H], 'pawprint.js': [PAW, J], 'print.js': [PRINT, J] };
const ASSETS = { fetch: async (req) => { const m = /^\\/merch\\/print\\/([A-Za-z0-9_-]+)\\/([a-z.]*)$/.exec(new URL(req.url).pathname); const f = m && m[1] === AV && FILES[m[2]];
  return f ? new Response(f[0], { headers: { 'content-type': f[1], 'cache-control': 'no-store' } }) : new Response('not found', { status: 404 }); } };
export { MerchLedger, MerchPrints, MerchRender, RenderGate };
export default { fetch: (req, env, ctx) => worker.fetch(req, Object.assign({}, env, { ASSETS }), ctx) };
`);
  fs.writeFileSync(path.join(BUILD, 'wrangler.toml'), `name = "${NAME}"\nmain = "entry.js"\ncompatibility_date = "${DATE}"\n[[rules]]\ntype = "Text"\nglobs = ["**/*.txt"]\nfallthrough = true\n`);
  const cmd = process.env.WRANGLER ? [process.env.WRANGLER, []] : ['npx', ['--yes', 'wrangler@4.50.0']];
  const r = spawnSync(cmd[0], cmd[1].concat(['deploy', '--dry-run', '--outdir', 'out']), { cwd: BUILD, encoding: 'utf8', env: Object.assign({}, process.env, { WRANGLER_SEND_METRICS: 'false' }) });
  const m = /Total Upload: ([\d.]+ KiB) \/ gzip: ([\d.]+ KiB)/.exec(r.stdout || '');
  if (r.status !== 0 || !m) { console.error('merch_rtest: the wrangler bundle failed\n' + String(r.stderr || r.stdout).slice(-1500)); return null; }
  const files = fs.readdirSync(path.join(BUILD, 'out')).filter((f) => !/\.map$|README/.test(f));
  log('bundle: ' + files.join(', ') + ' (upload ' + m[1] + ', gzip ' + m[2] + '; Free limit 3 MB gzip)');
  return files;
}

// ---------- the fake Cloudflare API (RTEST_FAKE only: an in-memory account, every call printed as FAKE:) ----------
const fk = { workers: ['other-worker-a', 'other-worker-b'], ns: 2, made: false, uploads: 0 };
function fakeCf(method, p) {
  log('FAKE: ' + method + ' ' + p.replace(/^\/accounts\/[^/]+/, '/accounts/<acc>'));
  const yes = (result) => ({ success: true, result, http: 200 });
  if (p === '/accounts') return yes([{ id: 'acc-1' }].concat(FAKE.has('accounts2') ? [{ id: 'acc-2' }] : []));
  if (/\/workers\/scripts$/.test(p)) return yes(fk.workers.map((id) => ({ id })));
  if (/\/durable_objects\/namespaces/.test(p)) return yes(Array.from({ length: fk.ns + (fk.made ? 3 : 0) }, (_, i) => ({ id: 'ns' + i, script: i >= fk.ns ? NAME : 'other' })));
  if (/\/workers\/subdomain$/.test(p)) return yes({ subdomain: 'fake-sub' });
  if (/\/subdomain$/.test(p)) return yes({});
  if (p === '/graphql') return { data: { viewer: { accounts: [{ workersInvocationsAdaptive: [{ sum: { requests: 40, errors: 0 }, quantiles: { cpuTimeP50: 800, cpuTimeP99: 3000 }, dimensions: { status: 'success' } }] }] } }, errors: null, http: 200 };
  if (method === 'DELETE') {
    if (FAKE.has('delete_fails')) return { success: false, http: 500, errors: [{ code: 10013, message: 'fake: an internal error' }] };
    if (!fk.made || FAKE.has('delete_404')) { fk.made = false; fk.workers = fk.workers.filter((w) => w !== NAME); return { success: false, http: 404, errors: [{ code: 10007, message: 'workers.api.error.script_not_found' }] }; }
    fk.made = false; fk.workers = fk.workers.filter((w) => w !== NAME); return yes(null);
  }
  return { success: false, http: 400, errors: [{ message: 'fake: no such route ' + p }] };
}

// ---------- curl (the token and the admin key only through curl's environment) ----------
const TOKEN = process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN !== 'proxy-injected';
function curl(args, o) {
  if (FAKE) throw new Error('fake run: no network call is ever made'); // never reached: every caller has its fake path
  o = o || {};
  const env = Object.assign({}, process.env), pre = ['-sS', '--max-time', String(o.maxTime || 120)];
  if (o.cf && TOKEN) pre.push('--variable', '%CLOUDFLARE_API_TOKEN', '--expand-header', 'Authorization: Bearer {{CLOUDFLARE_API_TOKEN}}');
  if (o.admin) { env.RTEST_ADMIN_KEY = o.admin; pre.push('--variable', '%RTEST_ADMIN_KEY', '--expand-header', 'Authorization: Bearer {{RTEST_ADMIN_KEY}}'); }
  const r = spawnSync('curl', pre.concat(args), { input: o.input, env, maxBuffer: 64 << 20, encoding: o.binary ? 'buffer' : 'utf8' });
  return r.stdout;
}
function cf(method, p, body, o) { // one JSON call -> the answer with its HTTP status (http); dry: printed, an empty success back
  o = o || {};
  if (DRY) { log('DRY_RUN: ' + method + ' ' + CF + p + (o.say ? '  ' + o.say : body ? '  ' + JSON.stringify(body).slice(0, 160) : '')); return { success: true, result: o.dry !== undefined ? o.dry : [], http: 200 }; }
  if (FAKE) return fakeCf(method, p, body);
  const args = ['-X', method, CF + p, '-w', '\n%{http_code}'];
  if (body !== undefined) args.push('-H', 'Content-Type: application/json', '--data-binary', '@-');
  const out = String(curl(args, { cf: true, input: body !== undefined ? JSON.stringify(body) : undefined }) || ''), i = out.lastIndexOf('\n');
  let j; try { j = JSON.parse(out.slice(0, i)); } catch (e) { j = { success: false, errors: [{ message: 'not JSON (' + out.slice(i + 1) + '): ' + out.slice(0, 200) }] }; }
  j.http = Number(out.slice(i + 1)) || 0;
  return j;
}
const must = (j, what) => { if (!j || !j.success) throw new Error(what + ': ' + JSON.stringify((j && j.errors) || j).slice(0, 300)); return j.result; };

// ---------- the upload (multipart; the metadata, with the two random keys, goes on stdin) -> its result (startup_time_ms) ----------
function upload(files, meta) {
  const parts = files.map((f) => ['-F', f + '=@' + path.join(BUILD, 'out', f) + ';type=' + (/\.wasm$/.test(f) ? 'application/wasm' : /\.js$/.test(f) ? 'application/javascript+module' : 'text/plain')]).flat();
  if (DRY) { log('DRY_RUN: PUT ' + CF + '/accounts/' + ACC + '/workers/scripts/' + NAME + '  multipart: metadata (bindings ' + meta.bindings.map((b) => b.name + ':' + b.type).join(', ') + '; the 2 secret values not shown) + ' + files.join(', ')); return {}; }
  let out;
  if (FAKE) { // the fake account has the Worker from the moment the upload is sent; upload_timeout: no answer comes back (as curl's own --max-time)
    log('FAKE: PUT /accounts/<acc>/workers/scripts/' + NAME + ' (upload ' + (++fk.uploads) + ')'); fk.made = true; if (!fk.workers.includes(NAME)) fk.workers.push(NAME);
    out = FAKE.has('upload_timeout') ? '' : JSON.stringify({ success: true, result: { id: NAME, startup_time_ms: 9 } });
  } else out = curl(['-X', 'PUT', CF + '/accounts/' + ACC + '/workers/scripts/' + NAME, '-F', 'metadata=<-;type=application/json'].concat(parts), { cf: true, input: JSON.stringify(meta), maxTime: 300 });
  let j; try { j = JSON.parse(out); } catch (e) { j = { success: false, errors: [{ message: 'no answer (a timeout?): ' + String(out).slice(0, 300) }] }; }
  return must(j, 'upload') || {};
}

// ---------- local Chromium: the same page, the same options (the truth the cloud files are compared with) ----------
async function localChromium(jobs) {
  const reqG = (m) => { for (const r of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
  let chromium; try { ({ chromium } = reqG('playwright')); } catch (e) { log('  (no Playwright: the comparison with local Chromium is skipped; NODE_PATH=$(npm root -g))'); return null; }
  const srv = http.createServer((q, s) => { const m = /^\/merch\/print\/[A-Za-z0-9_-]+\/([a-z.]*)$/.exec(new URL(q.url, 'http://x').pathname); const f = m && path.join(PRINT, m[1] || 'index.html'); if (!f || !fs.existsSync(f)) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(fs.readFileSync(f)); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const br = await chromium.launch(), out = {};
  try {
    for (const j of jobs) {
      const k = j.dog + '/' + j.product; if (out[k]) continue;
      const o = render.shotOptions(j.product, 'http://127.0.0.1:' + srv.address().port + '/merch/print/' + AV + '/' + j.link);
      const ctx = await br.newContext({ viewport: { width: o.viewport.width, height: o.viewport.height }, deviceScaleFactor: o.viewport.deviceScaleFactor });
      const pg = await ctx.newPage(); await pg.goto(o.url); await pg.waitForSelector(o.waitForSelector.selector, { timeout: o.waitForSelector.timeout });
      out[k] = await pg.screenshot({ type: 'png', omitBackground: true }); await ctx.close();
    }
  } finally { await br.close(); srv.close(); }
  return out;
}
const readPNG = require(path.join(ROOT, 'merch', 'png_lite.js'));
function compare(a, b, product) { // -> render.matchPx + corners + pass (within MATCH: mean and pixels more than 32 apart)
  const A = readPNG(a), B = readPNG(b); if (A.w !== B.w || A.h !== B.h) return { size: A.w + 'x' + A.h + ' vs ' + B.w + 'x' + B.h, pass: false };
  const m = render.matchPx(A, B);
  return Object.assign(m, { pass: render.matchOk(m, product), corners: [0, A.w - 1, (A.h - 1) * A.w, A.h * A.w - 1].map((p) => A.data[p * 4 + 3]) });
}
const sleep = (ms) => (FAKE ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));

// ---------- the clean-up: every way out comes here, once ----------
const ST = { made: false, cleaned: false, hand: false, report: null };
function cleanUp(why) {
  if (ST.cleaned) return; ST.cleaned = true;
  const report = ST.report || { at: new Date().toISOString(), worker: NAME, dry: DRY };
  if (why) { report.stopped = why; log('stopping (' + why + '): cleaning up first'); }
  // 5. the Worker goes, with its Durable Object namespaces. A 404 means it is not there (done); anything else that is not a success: by hand
  if (ST.made || DRY) {
    try {
      const j = cf('DELETE', '/accounts/' + ACC + '/workers/scripts/' + NAME + '?force=true', undefined, { say: '(force: its Durable Object namespaces go with it)' });
      if (j.success) report.deleted = true;
      else if (j.http === 404) { report.deleted = 'not there (404): done'; log('delete: ' + NAME + ' is not there (404): nothing left to delete'); }
      else throw new Error('HTTP ' + j.http + ' ' + JSON.stringify(j.errors || j).slice(0, 200));
    } catch (e) { ST.hand = true; report.deleted = false; report.delete_error = String(e.message || e).slice(0, 300); console.log(HAND); console.log('  (the delete answered: ' + report.delete_error + ')'); }
  } else report.deleted = 'nothing was made';
  if (ACC && report.before) try {
    const s1 = must(cf('GET', '/accounts/' + ACC + '/workers/scripts', undefined, { say: '(count again)' }), 'list Workers'), n1 = must(cf('GET', '/accounts/' + ACC + '/workers/durable_objects/namespaces?per_page=1000', undefined, { say: '(count again)' }), 'list DO namespaces');
    report.after = { workers: s1.length, do_namespaces: n1.length, left: n1.filter((n) => String(n.script || n.name || '').includes(NAME)).map((n) => n.id) };
    const before = report.before || {}, same = report.after.workers === before.workers && report.after.do_namespaces === before.do_namespaces;
    log((same ? 'account as before: ' : 'CHECK THE ACCOUNT: ') + JSON.stringify({ before: report.before || null, after: report.after }));
  } catch (e) { report.after = { error: String(e.message || e).slice(0, 300) }; log('CHECK THE ACCOUNT: it could not be counted again (' + report.after.error + ')'); }
  try { fs.writeFileSync(path.join(OUT, 'rtest-report.json'), JSON.stringify(report, null, 1)); log('report: ' + path.join(OUT, 'rtest-report.json') + (DRY ? ' (dry: no results)' : '')); } catch (e) { log('the report could not be written: ' + e.message); }
  try { fs.rmSync(BUILD, { recursive: true, force: true }); } catch (e) { /* a temp folder */ }
}
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) process.on(sig, () => { cleanUp(sig); process.exit(code); });

// ---------- the run ----------
async function main() {
  log((DRY ? 'DRY RUN (nothing is sent to Cloudflare; DRY_RUN=0 RTEST_GO=yes-the-owner-approved for the real one, after the owner approved it)' : FAKE ? 'FAKE RUN (an in-memory Cloudflare API: ' + Array.from(FAKE).join(',') + ')' : 'REAL RUN (approved)') + ': ' + NAME + ', ART_VER ' + AV);
  const files = build(); if (!files) { ST.cleaned = true; return 1; }
  if (!ACC) {
    if (DRY) { cf('GET', '/accounts', undefined, { say: '(refused when more than one is visible: then set CLOUDFLARE_ACCOUNT_ID)' }); ACC = '<account_id>'; }
    else { // review finding 9: never guess between accounts
      const accs = must(cf('GET', '/accounts'), 'accounts');
      if (accs.length !== 1) throw new Error(accs.length + ' Cloudflare accounts are visible: set CLOUDFLARE_ACCOUNT_ID to the one to use (nothing was changed)');
      ACC = accs[0].id;
    }
  }
  const scripts0 = must(cf('GET', '/accounts/' + ACC + '/workers/scripts', undefined, { say: '(count the Workers)' }), 'list Workers');
  const ns0 = must(cf('GET', '/accounts/' + ACC + '/workers/durable_objects/namespaces?per_page=1000', undefined, { say: '(count the Durable Object namespaces)' }), 'list DO namespaces');
  if (scripts0.some((s) => s.id === NAME)) throw new Error(NAME + ' already exists: delete it first (nothing was changed)');
  const report = ST.report = { at: new Date().toISOString(), art_ver: AV, worker: NAME, dry: DRY, fake: FAKE ? Array.from(FAKE) : undefined, before: { workers: scripts0.length, do_namespaces: ns0.length }, renders: [], probe: [], after: null,
    startup_ms: [], cpu: null, browser_stopped: null, notes: ['the daily 429 text ("Browser time limit exceeded for today") stays unverified: the kit never spends the day to provoke it'] };
  const sub = DRY ? '<subdomain>' : must(cf('GET', '/accounts/' + ACC + '/workers/subdomain'), 'subdomain').subdomain;
  const HOST = 'https://' + NAME + '.' + sub + '.workers.dev';
  const ADMIN = crypto.randomBytes(32).toString('base64url'), FILEK = crypto.randomBytes(32).toString('base64url'); // in memory only
  const vars = { MERCH_PUBLIC_URL: HOST, MERCH_FROM: '', MERCH_PROVIDER_MODE: 'draft', MERCH_RENDER_VIA: 'direct', MERCH_BROWSER_BUDGET_MS: '60000', MERCH_RENDER_PROBE: '1', MERCH_PRODUCTS: 'mug,tee' };
  const bindings = [{ type: 'durable_object_namespace', name: 'LEDGER', class_name: 'MerchLedger' }, { type: 'durable_object_namespace', name: 'PRINTS', class_name: 'MerchPrints' },
    { type: 'durable_object_namespace', name: 'RENDER', class_name: 'MerchRender' }, { type: 'browser', name: 'BROWSER' }]
    .concat(Object.entries(vars).map(([name, text]) => ({ type: 'plain_text', name, text })))
    .concat([{ type: 'secret_text', name: 'MERCH_ADMIN_KEY', text: ADMIN }, { type: 'secret_text', name: 'MERCH_FILE_KEY', text: FILEK }]);
  const meta = { main_module: 'entry.js', compatibility_date: DATE, bindings, migrations: { new_tag: 'v1', new_sqlite_classes: ['MerchLedger', 'MerchPrints', 'MerchRender'] }, observability: { enabled: true } };
  if (files.includes('worker.js') && !files.includes('entry.js')) meta.main_module = 'worker.js'; // wrangler names the bundle after the entry's output
  ST.made = !DRY; // review finding 3: from here on the Worker may exist (an upload that times out may still have made it)
  const t0 = new Date().toISOString();
  let u = upload(files, meta); report.startup_ms.push(u.startup_time_ms == null ? null : u.startup_time_ms);
  u = upload(files, Object.assign({}, meta, { migrations: undefined, bindings: bindings.concat([{ type: 'service', name: 'SELF', service: NAME, entrypoint: 'RenderGate' }]) })); // the self binding names the Worker itself
  report.startup_ms.push(u.startup_time_ms == null ? null : u.startup_time_ms);
  if (!DRY) log('  front Worker start-up time (upload answers): ' + report.startup_ms.join(' ms, ') + ' ms');
  must(cf('POST', '/accounts/' + ACC + '/workers/scripts/' + NAME + '/subdomain', { enabled: true, previews_enabled: false }), 'workers.dev');
  if (!DRY && !FAKE) { // the print page must answer before Browser Run is asked to open it
    let up = false; for (let i = 0; i < 30 && !up; i++) { up = /READY|<div id="o">/.test(curl([HOST + '/merch/print/' + AV + '/index.html']) || ''); if (!up) await sleep(2000); }
    if (!up) throw new Error('the print page did not come up on ' + HOST);
  }
  const jobs = [];
  for (const dog of DOGS) for (const product of ['tee', 'mug']) jobs.push({ dog, product, renderer: 'browser', via: 'direct' });
  jobs.push({ dog: 'golden', product: 'tee', renderer: 'browser', via: 'worker' }, { dog: 'golden', product: 'mug', renderer: 'browser', via: 'worker' });
  for (const dog of DOGS) for (const product of ['tee', 'mug']) jobs.push({ dog, product, renderer: 'resvg' });
  for (const j of jobs) { const d = SAMPLES.find((x) => x.id === j.dog); j.link = P.printHash(d.r, { product: j.product, colour: j.product === 'tee' ? 'navy' : 'white', pose: d.pose }); }
  const admin = (body) => {
    if (DRY) { log('DRY_RUN: POST ' + HOST + '/merch/admin/render-test  ' + JSON.stringify(body) + '  (Authorization: the random admin key)'); return { ok: true, dry: true }; }
    if (FAKE) { // the self-test's answer shape (ledger.js renderTest); browser_fails: the browser path errors, without X-Browser-Ms-Used
      log('FAKE: POST ' + HOST + '/merch/admin/render-test ' + JSON.stringify(body));
      if (FAKE.has('browser_fails') && body.renderer === 'browser') return { ok: false, http: 200, renderer: 'browser', via: body.via, ms_used: null, ms_booked: 75000, wall_ms: 75000, error: { kind: 'error', why: 'timeout', skipped: false } };
      return { ok: true, http: 200, renderer: body.renderer, via: body.via || null, width: body.product === 'tee' ? 4500 : 2700, height: body.product === 'tee' ? 5400 : 1050, bytes: 300000, colour_type: 6, ms_used: body.renderer === 'browser' ? 1300 : null, wall_ms: 1500 };
    }
    const out = curl(['-X', 'POST', HOST + '/merch/admin/render-test', '-H', 'content-type: application/json', '--data-binary', '@-', '-w', '\n%{http_code}'], { admin: ADMIN, input: JSON.stringify(body), maxTime: 120 });
    const i = out.lastIndexOf('\n'); let j; try { j = JSON.parse(out.slice(0, i)); } catch (e) { j = { ok: false, raw: out.slice(0, 300) }; } j.http = Number(out.slice(i + 1)); return j;
  };
  let browserFails = 0;
  for (const j of jobs) {
    const tag = [j.dog, j.product, j.renderer, j.via || ''].join(' ');
    if (j.renderer === 'browser' && browserFails >= BROWSER_STOP) { report.renders.push({ dog: j.dog, product: j.product, renderer: j.renderer, via: j.via, skipped: 'browser stopped after ' + BROWSER_STOP + ' failures' }); log('  skip ' + tag + ': the browser jobs stopped after ' + BROWSER_STOP + ' failures'); continue; }
    const t0j = Date.now(), r = admin({ product: j.product, renderer: j.renderer, via: j.via, dog: j.dog }), row = Object.assign({ dog: j.dog, product: j.product, renderer: j.renderer, via: j.via || null, client_ms: Date.now() - t0j }, r);
    if (!DRY && !FAKE && r.ok && r.file_url) { const png = curl([r.file_url], { binary: true }); fs.writeFileSync(path.join(OUT, [j.dog, j.product, j.renderer, j.via || ''].join('-') + '.png'), png); row.download_sha_ok = crypto.createHash('sha256').update(png).digest('hex') === r.sha256; row.download_bytes = png.length; row.download_colour_type = png.length > 25 ? png[25] : null; }
    delete row.file_url; delete row.key; report.renders.push(row);
    log((DRY ? '  plan ' : r.ok ? '  ok   ' : '  FAIL ') + tag + (DRY ? '' : ': ' + (r.ok ? r.width + 'x' + r.height + ' ' + r.bytes + ' B, colour type ' + r.colour_type + ', X-Browser-Ms-Used ' + r.ms_used + ', wall ' + r.wall_ms + ' ms' : JSON.stringify(r.error || r).slice(0, 200) + ', X-Browser-Ms-Used ' + r.ms_used)));
    if (!DRY && j.renderer === 'browser' && !r.ok) { browserFails++; if (browserFails === BROWSER_STOP) { report.browser_stopped = 'after ' + BROWSER_STOP + ' failures: ' + JSON.stringify(r.error || r).slice(0, 200); log('  the browser failed ' + BROWSER_STOP + ' times: every later browser job is skipped (the resvg jobs still run)'); } }
    if (FAKE && FAKE.has('hang')) await new Promise((res) => setTimeout(res, 60e3)); // F4-kit: a signal arrives while the kit waits
    if (!DRY) await sleep(12e3);
  }
  // the rate probe: two browser calls 1 s apart (the second should meet Quick Actions' 1 request per 10 s): the real 429 text, once
  if (browserFails >= BROWSER_STOP) { report.probe.push({ skipped: 'browser stopped' }); log('  probe skipped: the browser jobs stopped'); }
  else for (let k = 0; k < 2; k++) { const r = admin({ product: 'mug', renderer: 'browser', via: 'direct', dog: 'akita', probe: true }); report.probe.push({ http: r.http, ok: r.ok, ms_used: r.ms_used, error: r.error || null }); log('  probe ' + (k + 1) + ': ' + (DRY ? '(dry)' : JSON.stringify(r.error || { ok: r.ok, ms_used: r.ms_used }))); if (!DRY && !k) await sleep(1000); }
  // what the review asked to record: X-Browser-Ms-Used on error answers, and the PNG colour type Browser Run returns
  report.ms_used_on_errors = report.renders.concat(report.probe).filter((x) => x.ok === false && (x.renderer === 'browser' || x.http)).map((x) => x.ms_used == null ? null : x.ms_used);
  report.browser_colour_types = Array.from(new Set(report.renders.filter((x) => x.ok && x.renderer === 'browser').map((x) => x.download_colour_type != null ? x.download_colour_type : x.colour_type)));
  if (!DRY && !FAKE) { // 4. against this machine's Chromium
    const local = await localChromium(jobs);
    if (local) for (const row of report.renders.filter((x) => x.ok)) {
      const f = path.join(OUT, [row.dog, row.product, row.renderer, row.via || ''].join('-') + '.png'), c = compare(fs.readFileSync(f), local[row.dog + '/' + row.product], row.product);
      row.vs_local_chromium = c; log('  ' + [row.dog, row.product, row.renderer, row.via || ''].join(' ') + ' vs local Chromium: ' + JSON.stringify(c));
    }
  }
  { // the front Worker's CPU, if this token may read analytics (RENDER_FREE 8 could; Workers Logs could not). Read only; a failure is recorded
    if (!DRY) await sleep(30e3); // analytics come in with a short delay
    const q = 'query($acc: string!, $name: string!, $t0: Time!) { viewer { accounts(filter: { accountTag: $acc }) { workersInvocationsAdaptive(limit: 20, filter: { scriptName: $name, datetime_geq: $t0 }) { sum { requests errors } quantiles { cpuTimeP50 cpuTimeP99 } dimensions { status } } } } }';
    try { const g = cf('POST', '/graphql', { query: q, variables: { acc: ACC, name: NAME, t0 } }, { say: '(read only: the test Worker\'s CPU per request)' }); report.cpu = DRY ? null : g.data ? g.data.viewer.accounts[0].workersInvocationsAdaptive : { unreadable: JSON.stringify(g.errors || g).slice(0, 300) }; }
    catch (e) { report.cpu = { unreadable: String(e.message || e).slice(0, 300) }; }
    if (!DRY) log('  front Worker CPU (microseconds): ' + JSON.stringify(report.cpu).slice(0, 300));
  }
  const failed = report.renders.filter((x) => x.ok === false || x.skipped || (x.vs_local_chromium && !x.vs_local_chromium.pass)).length; // the probe's 429 is meant
  if (failed) log(failed + ' of ' + report.renders.length + ' renders failed, were skipped or did not match: see the report');
  return failed ? 1 : 0;
}
let code = 1;
try { code = await main(); }
catch (e) { console.error('merch_rtest: ' + String((e && e.message) || e).slice(0, 400)); if (ST.report) ST.report.error = String((e && e.message) || e).slice(0, 400); code = 1; }
finally { cleanUp(); }
process.exit(ST.hand ? 3 : code);
