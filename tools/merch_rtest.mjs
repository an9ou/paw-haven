#!/usr/bin/env node
// Merch part 4: the ONE throwaway cloud test of the print render (docs/design/merch/PART4.md, "The cloud test"). PREPARED ONLY: it runs for real
// only after the owner approved it, and only with BOTH switches:   DRY_RUN=0 RTEST_GO=yes-the-owner-approved node tools/merch_rtest.mjs
// By default (DRY_RUN unset or anything but 0) it builds the bundle (wrangler --dry-run, no Cloudflare call) and PRINTS every request it would send.
//
// What a real run does (Free plan, nothing kept):
//   1. counts the account's Workers and Durable Object namespaces (to compare at the end); refuses if doodle-doggo-merch-rtest already exists
//   2. uploads ONE Worker doodle-doggo-merch-rtest: the real merch Worker (cloudflare/merch/worker.js) wrapped by a small entry that serves the
//      released print page (site/merch/print/<ART_VER>/) itself; the Browser Run binding BROWSER, the Durable Objects LEDGER, PRINTS, RENDER
//      (migration v1, SQLite), the self binding SELF -> RenderGate (a second upload: it names itself); workers.dev only, no custom domain, no
//      cron; the shop gate shut (MERCH_FROM empty, no Stripe or printer key); our browser budget capped at 60 s (MERCH_BROWSER_BUDGET_MS);
//      MERCH_RENDER_PROBE = 1 (lets the self-test ask twice 1 s apart, once). MERCH_ADMIN_KEY and MERCH_FILE_KEY are random, made in memory
//      here, sent only inside the upload (stdin) and the admin calls (an env variable of curl), never printed or written anywhere
//   3. the admin render self-test (POST /merch/admin/render-test), 12 s apart: tee and mug for 3 sample dogs by Browser Run called from the
//      ledger object (direct); one tee and one mug through the front Worker (via worker); the same 6 by the resvg fallback; then the rate probe:
//      two browser calls 1 s apart, to record Browser Run's real 429 text once. 10 browser renders in all (at most 16; about 10 s of browser time)
//   4. every file is downloaded through its signed link and checked: sha-256 as reported, exact size, tee corners clear; each browser file is
//      compared with this machine's Chromium drawing the same page with the same options (pixel equality expected, RENDER_FREE 8), each resvg
//      file with Chromium too (mean difference per channel under 0.2)
//   5. ALWAYS (also after an error): deletes the Worker (force: its Durable Object namespaces go with it) and checks the Worker count and the
//      Durable Object namespaces are as before
// The results (status, X-Browser-Ms-Used, sizes, sha, the 429 texts, the differences) go to a JSON file in RTEST_OUT (default: a new temp folder),
// never into the repo. Needs: Node, curl, wrangler 4 (WRANGLER=<path to its bin>, else npx --yes wrangler@4.50.0), and for step 4 Playwright
// (NODE_PATH=$(npm root -g)). In a Claude cloud session the proxy adds the Cloudflare API token; anywhere else export CLOUDFLARE_API_TOKEN
// (Workers Scripts: Edit; it is passed to curl through its environment, never on the command line). CLOUDFLARE_ACCOUNT_ID is optional.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'doodle-doggo-merch-rtest', DATE = '2026-03-24', CF = 'https://api.cloudflare.com/client/v4';
const DRY = process.env.DRY_RUN !== '0';
const GO = process.env.RTEST_GO === 'yes-the-owner-approved';
if (!DRY && !GO) { console.error('merch_rtest: a real run needs the owner’s approval: DRY_RUN=0 RTEST_GO=yes-the-owner-approved (else run it dry)'); process.exit(2); }
const OUT = process.env.RTEST_OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'merch-rtest-'));
fs.mkdirSync(OUT, { recursive: true });
// the account id is not a secret, but a dry run prints none
const log = (...a) => console.log(...a.map((x) => (DRY && ACC && typeof x === 'string' ? x.split(ACC).join('<account_id>') : x)));
const P = require(path.join(ROOT, 'merch', 'dist', 'pawprint.js')), SAMPLES = require(path.join(ROOT, 'merch', 'sample_dogs.js'))(P);
const AV = P.ART_VER, PRINT = path.join(ROOT, 'site', 'merch', 'print', AV);
if (!fs.existsSync(path.join(PRINT, 'index.html'))) { console.error('merch_rtest: no released print page for ' + AV + ' (site/merch/print/)'); process.exit(1); }
const DOGS = ['akita', 'dane', 'golden'];

// ---------- 1. the bundle (wrangler --dry-run: bundles only, sends nothing; metrics off) ----------
const BUILD = fs.mkdtempSync(path.join(os.tmpdir(), 'merch-rtest-build-'));
function build() {
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

// ---------- curl (the token and the admin key only through curl's environment) ----------
const TOKEN = process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN !== 'proxy-injected';
function curl(args, o) {
  o = o || {};
  const env = Object.assign({}, process.env), pre = ['-sS', '--max-time', String(o.maxTime || 120)];
  if (o.cf && TOKEN) pre.push('--variable', '%CLOUDFLARE_API_TOKEN', '--expand-header', 'Authorization: Bearer {{CLOUDFLARE_API_TOKEN}}');
  if (o.admin) { env.RTEST_ADMIN_KEY = o.admin; pre.push('--variable', '%RTEST_ADMIN_KEY', '--expand-header', 'Authorization: Bearer {{RTEST_ADMIN_KEY}}'); }
  const r = spawnSync('curl', pre.concat(args), { input: o.input, env, maxBuffer: 64 << 20, encoding: o.binary ? 'buffer' : 'utf8' });
  return r.stdout;
}
let ACC = process.env.CLOUDFLARE_ACCOUNT_ID || null;
function cf(method, p, body, o) { // one JSON call; dry: printed, an empty success back
  o = o || {};
  if (DRY) { log('DRY_RUN: ' + method + ' ' + CF + p + (o.say ? '  ' + o.say : body ? '  ' + JSON.stringify(body).slice(0, 160) : '')); return { success: true, result: o.dry !== undefined ? o.dry : [] }; }
  const args = ['-X', method, CF + p, '-w', '\n%{http_code}'];
  if (body !== undefined) args.push('-H', 'Content-Type: application/json', '--data-binary', '@-');
  const out = curl(args, { cf: true, input: body !== undefined ? JSON.stringify(body) : undefined }), i = out.lastIndexOf('\n');
  let j; try { j = JSON.parse(out.slice(0, i)); } catch (e) { j = { success: false, errors: [{ message: 'not JSON (' + out.slice(i + 1) + '): ' + out.slice(0, 200) }] }; }
  return j;
}
const must = (j, what) => { if (!j || !j.success) throw new Error(what + ': ' + JSON.stringify((j && j.errors) || j).slice(0, 300)); return j.result; };

// ---------- the upload (multipart; the metadata, with the two random keys, goes on stdin) ----------
function upload(files, meta) {
  const parts = files.map((f) => ['-F', f + '=@' + path.join(BUILD, 'out', f) + ';type=' + (/\.wasm$/.test(f) ? 'application/wasm' : /\.js$/.test(f) ? 'application/javascript+module' : 'text/plain')]).flat();
  if (DRY) { log('DRY_RUN: PUT ' + CF + '/accounts/' + ACC + '/workers/scripts/' + NAME + '  multipart: metadata (bindings ' + meta.bindings.map((b) => b.name + ':' + b.type).join(', ') + '; the 2 secret values not shown) + ' + files.join(', ')); return; }
  const out = curl(['-X', 'PUT', CF + '/accounts/' + ACC + '/workers/scripts/' + NAME, '-F', 'metadata=<-;type=application/json'].concat(parts), { cf: true, input: JSON.stringify(meta), maxTime: 300 });
  let j; try { j = JSON.parse(out); } catch (e) { j = { success: false, errors: [{ message: String(out).slice(0, 300) }] }; }
  must(j, 'upload');
}

// ---------- local Chromium: the same page, the same options (the truth the cloud files are compared with) ----------
async function localChromium(jobs) {
  const reqG = (m) => { for (const r of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
  let chromium; try { ({ chromium } = reqG('playwright')); } catch (e) { log('  (no Playwright: the comparison with local Chromium is skipped; NODE_PATH=$(npm root -g))'); return null; }
  const srv = http.createServer((q, s) => { const m = /^\/merch\/print\/[A-Za-z0-9_-]+\/([a-z.]*)$/.exec(new URL(q.url, 'http://x').pathname); const f = m && path.join(PRINT, m[1] || 'index.html'); if (!f || !fs.existsSync(f)) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(fs.readFileSync(f)); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const br = await chromium.launch(), out = {};
  const VP = { tee: { width: 2250, height: 2700, deviceScaleFactor: 2 }, mug: { width: 2700, height: 1050, deviceScaleFactor: 1 } };
  try {
    for (const j of jobs) {
      const k = j.dog + '/' + j.product; if (out[k]) continue;
      const ctx = await br.newContext({ viewport: { width: VP[j.product].width, height: VP[j.product].height }, deviceScaleFactor: VP[j.product].deviceScaleFactor });
      const pg = await ctx.newPage(); await pg.goto('http://127.0.0.1:' + srv.address().port + '/merch/print/' + AV + '/' + j.link); await pg.waitForSelector('#o svg');
      out[k] = await pg.screenshot({ type: 'png', omitBackground: true }); await ctx.close();
    }
  } finally { await br.close(); srv.close(); }
  return out;
}
const readPNG = require(path.join(ROOT, 'merch', 'png_lite.js'));
function compare(a, b) { // -> { equal_px, mean_white, mean_black }
  const A = readPNG(a), B = readPNG(b); if (A.w !== B.w || A.h !== B.h) return { size: A.w + 'x' + A.h + ' vs ' + B.w + 'x' + B.h };
  let same = 0, sw = 0, sk = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    if (A.data[i] === B.data[i] && A.data[i + 1] === B.data[i + 1] && A.data[i + 2] === B.data[i + 2] && A.data[i + 3] === B.data[i + 3]) same++;
    const aa = A.data[i + 3] / 255, ba = B.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) { const x = A.data[i + c], y = B.data[i + c]; sw += Math.abs(x * aa + 255 * (1 - aa) - (y * ba + 255 * (1 - ba))); sk += Math.abs(x * aa - y * ba); }
  }
  const n = A.data.length / 4;
  return { equal_px: same / n, mean_white: sw / (3 * n), mean_black: sk / (3 * n), corners: [0, A.w - 1, (A.h - 1) * A.w, A.h * A.w - 1].map((p) => A.data[p * 4 + 3]) };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- the run ----------
async function main() {
  log((DRY ? 'DRY RUN (nothing is sent to Cloudflare; DRY_RUN=0 RTEST_GO=yes-the-owner-approved for the real one, after the owner approved it)' : 'REAL RUN (approved)') + ': ' + NAME + ', ART_VER ' + AV);
  const files = build(); if (!files) process.exit(1);
  if (!ACC) ACC = DRY ? '<account_id>' : ((must(cf('GET', '/accounts'), 'accounts')[0] || {}).id);
  if (!ACC) throw new Error('no Cloudflare account visible');
  const scripts0 = must(cf('GET', '/accounts/' + ACC + '/workers/scripts', undefined, { say: '(count the Workers)' }), 'list Workers');
  const ns0 = must(cf('GET', '/accounts/' + ACC + '/workers/durable_objects/namespaces?per_page=1000', undefined, { say: '(count the Durable Object namespaces)' }), 'list DO namespaces');
  if (scripts0.some((s) => s.id === NAME)) throw new Error(NAME + ' already exists: delete it first (nothing was changed)');
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
  const report = { at: new Date().toISOString(), art_ver: AV, worker: NAME, dry: DRY, before: { workers: scripts0.length, do_namespaces: ns0.length }, renders: [], probe: [], after: null };
  let made = false;
  try {
    upload(files, meta); made = !DRY;
    upload(files, Object.assign({}, meta, { migrations: undefined, bindings: bindings.concat([{ type: 'service', name: 'SELF', service: NAME, entrypoint: 'RenderGate' }]) })); // the self binding names the Worker itself
    must(cf('POST', '/accounts/' + ACC + '/workers/scripts/' + NAME + '/subdomain', { enabled: true, previews_enabled: false }), 'workers.dev');
    if (!DRY) { // the print page must answer before Browser Run is asked to open it
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
      const out = curl(['-X', 'POST', HOST + '/merch/admin/render-test', '-H', 'content-type: application/json', '--data-binary', '@-', '-w', '\n%{http_code}'], { admin: ADMIN, input: JSON.stringify(body), maxTime: 120 });
      const i = out.lastIndexOf('\n'); let j; try { j = JSON.parse(out.slice(0, i)); } catch (e) { j = { ok: false, raw: out.slice(0, 300) }; } j.http = Number(out.slice(i + 1)); return j;
    };
    for (const j of jobs) {
      const t0 = Date.now(), r = admin({ product: j.product, renderer: j.renderer, via: j.via, dog: j.dog }), row = Object.assign({ dog: j.dog, product: j.product, renderer: j.renderer, via: j.via || null, client_ms: Date.now() - t0 }, r);
      if (!DRY && r.ok && r.file_url) { const png = curl([r.file_url], { binary: true }); fs.writeFileSync(path.join(OUT, [j.dog, j.product, j.renderer, j.via || ''].join('-') + '.png'), png); row.download_sha_ok = crypto.createHash('sha256').update(png).digest('hex') === r.sha256; row.download_bytes = png.length; }
      delete row.file_url; delete row.key; report.renders.push(row);
      log((DRY ? '  plan ' : r.ok ? '  ok   ' : '  FAIL ') + [j.dog, j.product, j.renderer, j.via || ''].join(' ') + (DRY ? '' : ': ' + (r.ok ? r.width + 'x' + r.height + ' ' + r.bytes + ' B, X-Browser-Ms-Used ' + r.ms_used + ', wall ' + r.wall_ms + ' ms' : JSON.stringify(r.error || r).slice(0, 200))));
      if (!DRY) await sleep(12e3);
    }
    // the rate probe: two browser calls 1 s apart (the second should meet Quick Actions' 1 request per 10 s): the real 429 text, once
    for (let k = 0; k < 2; k++) { const r = admin({ product: 'mug', renderer: 'browser', via: 'direct', dog: 'akita', probe: true }); report.probe.push({ http: r.http, ok: r.ok, ms_used: r.ms_used, error: r.error || null }); log('  probe ' + (k + 1) + ': ' + (DRY ? '(dry)' : JSON.stringify(r.error || { ok: r.ok, ms_used: r.ms_used }))); if (!DRY && !k) await sleep(1000); }
    if (!DRY) { // 4. against this machine's Chromium
      const local = await localChromium(jobs);
      if (local) for (const row of report.renders.filter((x) => x.ok)) {
        const f = path.join(OUT, [row.dog, row.product, row.renderer, row.via || ''].join('-') + '.png'), c = compare(fs.readFileSync(f), local[row.dog + '/' + row.product]);
        row.vs_local_chromium = c; log('  ' + [row.dog, row.product, row.renderer, row.via || ''].join(' ') + ' vs local Chromium: ' + JSON.stringify(c));
      }
    }
  } finally {
    // 5. always: the Worker goes, with its Durable Object namespaces; the account as before
    if (made || DRY) must(cf('DELETE', '/accounts/' + ACC + '/workers/scripts/' + NAME + '?force=true', undefined, { say: '(force: its Durable Object namespaces go with it)' }), 'delete');
    const s1 = must(cf('GET', '/accounts/' + ACC + '/workers/scripts', undefined, { say: '(count again)' }), 'list Workers'), n1 = must(cf('GET', '/accounts/' + ACC + '/workers/durable_objects/namespaces?per_page=1000', undefined, { say: '(count again)' }), 'list DO namespaces');
    report.after = { workers: s1.length, do_namespaces: n1.length, left: n1.filter((n) => String(n.script || n.name || '').includes(NAME)).map((n) => n.id) };
    const same = report.after.workers === report.before.workers && report.after.do_namespaces === report.before.do_namespaces;
    log((same ? 'account as before: ' : 'CHECK THE ACCOUNT: ') + JSON.stringify({ before: report.before, after: report.after }));
    fs.writeFileSync(path.join(OUT, 'rtest-report.json'), JSON.stringify(report, null, 1));
    log('report: ' + path.join(OUT, 'rtest-report.json') + (DRY ? ' (dry: no results)' : ''));
    fs.rmSync(BUILD, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error('merch_rtest: ' + String((e && e.message) || e).slice(0, 400)); process.exit(1); });
