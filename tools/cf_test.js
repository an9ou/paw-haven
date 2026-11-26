// Turns the test build of the game into the Worker "doodle-doggo-test" for https://test.doodledoggo.app (owner, 18 Nov 2026): the password-gated
// test copy that replaces GitHub Pages once the repo is private. The gate itself is tools/test_gate.mjs (copied in as gate.js).
//   node tools/pages.js --test --out _site_test   the test build: the dev button kept, the test flags on, payments off (window.__ddNoPay), no
//                                                  in-page password screen (the Worker's gate replaces it)
//   node tools/cf_test.js [--from _site_test] [--out _cftest]   -> _cftest/worker.js + gate.js + one module per file + parts.txt (one "name type"
//                                                  line per upload part, like tools/cf_site.js)
//   bash tools/cf_test_deploy.sh [git ref]         builds both and uploads them (owner's go-ahead first)
//   --merch <dir>  (opt-in, merch sandbox run, SANDBOX.md part F G1; cf_test_deploy.sh passes MERCH_PAGE=<dir>): <dir> is a checkout of the
//                  branch merch/shop (the "My dog" page is never on main). Adds <dir>/site/merch/** at /merch/... and the site files the page
//                  loads (MERCH_SITE below) at their root paths; stops if the game build already has a different file at one of those paths.
//                  The gate then serves /merch/ with its own CSP (MERCH_CSP) and /merch/*.js, *.css and test_cfg.json as private, no-store.
//   --merch-cfg <file>  (only with --merch; MERCH_TEST_CFG=<file>, SANDBOX.md G3): the merch test Worker's token file {"token":"..."},
//                  served as it is at /merch/test_cfg.json behind the password. Checked, never printed. Without it the path is left out.
// Without --merch the output is exactly what it was before these options.
// Every file is a Text (text/plain) or Data (application/octet-stream) module, the same pattern as tools/cf_site.js, because Workers-assets
// uploads fail from a Claude session (the proxy replaces their upload token).
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : d; };
const from = arg('--from', path.join(root, '_site_test')), out = arg('--out', path.join(root, '_cftest'));
const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', ico: 'image/x-icon', woff2: 'font/woff2', webmanifest: 'application/manifest+json', txt: 'text/plain; charset=utf-8', js: 'text/javascript; charset=utf-8', json: 'application/json' };
const TEXT = new Set(['html', 'css', 'svg', 'webmanifest', 'txt', 'js', 'json']);
// the game's own CSP as on doodledoggo.app/play/ (tools/cf_site.js GAME_CSP), but nobody may frame the test copy, and only the new API address
const API = 'https://api.doodledoggo.app';
const CSP = `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; media-src 'self' data: blob:; connect-src 'self' ${API}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`;
const HASHED = /^\/(lang\/[\w-]+|photo_fonts|world_[a-z])\.[0-9a-f]{8}\.js$|^\/fonts\/i18n\//;
const LIMIT_GZ = 9e6; // the account's Worker limit is the paid 10 MB gzipped; leave room
// the merch page (opt-in): its own CSP, as SANDBOX.md G2 (no inline script, the test order server only; checkout.stripe.com is a navigation)
const MERCH_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://merch-api-test.doodledoggo.app; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const MERCH_NOSTORE = /^\/merch\/(?:test_cfg\.json$|.*\.(?:js|css)$)/; // a fixed merch.js is never stale during the run; the token file is never kept
// the site files the merch page loads, at their root paths (SANDBOX.md G1). They live in <dir>/site/, except the four brand files, which the
// live site build (tools/cf_site.js) serves at the root from <dir>/brand/: they are taken from there when <dir>/site/ has none. Plus the
// decoration site/js/site.js adds on every merch page (#petals, #deco): the falling momiji (sakura in spring) and the dogs peeking round the paper
const MERCH_PEEKS = ['dachs', 'shiba', 'corgi', 'golden', 'pug', 'samoyed', 'beagle', 'husky', 'frenchie', 'chihuahua']; // site.js PEEKS
const MERCH_SITE = ['style.css', 'js/site.js', 'img/logo.svg', 'img/art/washi.svg', 'doodle-doggo-icon.svg', 'favicon.svg', 'icon-32.png', 'icon-180.png', 'fonts/caveat.woff2', 'fonts/patrick-hand.woff2', 'fonts/dd-code.woff2',
  'img/art/momiji.svg', 'img/art/sakura.svg'].concat(MERCH_PEEKS.map((d) => `img/art/peek/${d}.svg`));
const MERCH_BRAND = new Set(['doodle-doggo-icon.svg', 'favicon.svg', 'icon-32.png', 'icon-180.png']);
const die = (m) => { console.error('cf_test: ' + m); process.exit(1); };
const opt = (k) => { const i = process.argv.indexOf(k); if (i < 0) return null; const v = process.argv[i + 1]; if (!v || v.startsWith('--')) die(`${k} needs a path`); return path.resolve(v); };
const merchDir = opt('--merch'), merchCfg = opt('--merch-cfg');
if (merchCfg && !merchDir) die('--merch-cfg is only valid together with --merch <dir>');

if (!fs.existsSync(path.join(from, 'index.html'))) { console.error(`cf_test: no test build in ${from}: run node tools/pages.js --test --out ${path.relative(root, from) || '.'} first`); process.exit(1); }
const html = fs.readFileSync(path.join(from, 'index.html'), 'utf8');
// the test copy must be the test build: payments off, no GitHub Pages password screen (it would ask twice), and the dev button there
if (!/window\.__ddNoPay=1/.test(html)) { console.error('cf_test: index.html is not the test build (no window.__ddNoPay): build it with node tools/pages.js --test'); process.exit(1); }
if (/id="ddGate"|dd_gate_v1/.test(html)) { console.error('cf_test: index.html has the GitHub Pages password screen: build it with --test'); process.exit(1); }

const files = []; // [url, source path] (or [url, Buffer] for the checked --merch-cfg token file)
const bytes = (src) => (Buffer.isBuffer(src) ? src : fs.readFileSync(src));
(function walk(dir, base) {
  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) return walk(p, base + f + '/');
    if (TYPES[f.split('.').pop()]) files.push(['/' + base + f, p]);
  });
})(from, '');

let merchN = 0;
if (merchDir) {
  // a checkout of merch/shop: <dir>/site/merch/index.html must be there (not <dir>/site/merch itself, not a main checkout)
  if (!fs.existsSync(merchDir) || !fs.statSync(merchDir).isDirectory()) die(`--merch ${merchDir}: no such folder (give a checkout of the branch merch/shop)`);
  const mroot = path.join(merchDir, 'site', 'merch');
  if (!fs.existsSync(path.join(mroot, 'index.html'))) die(`--merch ${merchDir}: no site/merch/index.html there (give the root of a checkout of the branch merch/shop)`);
  if (fs.existsSync(path.join(mroot, 'test_cfg.json'))) die(`--merch: ${mroot}/test_cfg.json is in the checkout; the token file is only ever given with --merch-cfg <file>`);
  const add = [];
  (function walk(dir, base) {
    fs.readdirSync(dir).sort().forEach((f) => {
      if (f.startsWith('.')) return; // .DS_Store and the like
      const p = path.join(dir, f), st = fs.lstatSync(p);
      if (st.isSymbolicLink()) die(`--merch: ${p} is a symbolic link; the merch page is only taken from plain files in the checkout`);
      if (st.isDirectory()) return walk(p, base + f + '/');
      if (!TYPES[f.split('.').pop()]) die(`--merch: ${p} has a file type the test copy does not serve`);
      add.push(['/merch/' + base + f, p]);
    });
  })(mroot, '');
  MERCH_SITE.forEach((f) => {
    let p = path.join(merchDir, 'site', f);
    if (!fs.existsSync(p) && MERCH_BRAND.has(f)) p = path.join(merchDir, 'brand', f);
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) die(`--merch: the page needs /${f}, but ${merchDir} has neither site/${f}${MERCH_BRAND.has(f) ? ` nor brand/${f}` : ''}`);
    if (fs.lstatSync(p).isSymbolicLink()) die(`--merch: ${p} is a symbolic link; the merch page is only taken from plain files in the checkout`);
    add.push(['/' + f, p]);
  });
  if (merchCfg) {
    // the token file (SANDBOX.md G3): JSON with exactly one key "token", 32-128 of A-Z a-z 0-9 - _. The messages never show its content nor its
    // path (a token given in place of the file's path would be printed); the bytes checked here are the bytes served (no second read)
    let cfg = null, b = null;
    try { b = fs.readFileSync(merchCfg); if (b.length <= 1024) cfg = JSON.parse(b.toString('utf8')); } catch (e) { cfg = null; }
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg) || Object.keys(cfg).length !== 1 || typeof cfg.token !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(cfg.token))
      die('--merch-cfg: the file given is missing or not a test token file (want JSON {"token":"<32-128 letters, digits, - or _>"} and nothing else); refused, nothing written');
    add.push(['/merch/test_cfg.json', b]);
  }
  const have = new Map(files);
  add.forEach(([u, p]) => {
    if (have.has(u)) { // identical bytes: keep the game's copy; different: stop, never overwrite
      if (Buffer.compare(bytes(have.get(u)), bytes(p)) !== 0) die(`--merch: the game build already has a different ${u} (${have.get(u)} vs ${Buffer.isBuffer(p) ? 'the --merch-cfg file' : p}); refused, nothing written`);
      return;
    }
    have.set(u, p); files.push([u, p]); merchN++;
  });
}

fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const parts = [], imports = [], table = []; let gz = 0;
files.sort((a, b) => (a[0] < b[0] ? -1 : 1)).forEach(([u, src], i) => {
  const ext = u.split('.').pop(), mod = 'f__' + u.slice(1).replace(/\//g, '__'); // flat module names, never "worker.js" or "gate.js"
  if (Buffer.isBuffer(src)) fs.writeFileSync(path.join(out, mod), src); else fs.copyFileSync(src, path.join(out, mod));
  parts.push(`${mod} ${TEXT.has(ext) ? 'text/plain' : 'application/octet-stream'}`);
  imports.push(`import f${i} from './${mod}';`);
  table.push(`  ${JSON.stringify(u)}: [f${i}, ${JSON.stringify(TYPES[ext])}],`);
  gz += zlib.gzipSync(bytes(src)).length;
});
fs.copyFileSync(path.join(__dirname, 'test_gate.mjs'), path.join(out, 'gate.js'));
parts.push('gate.js application/javascript+module');
const worker = `// Generated by tools/cf_test.js from the test build (node tools/pages.js --test). Do not edit. The Worker "doodle-doggo-test" on test.doodledoggo.app.
import { makeGate } from './gate.js';
${imports.join('\n')}
const FILES = {
${table.join('\n')}
};
export default makeGate({ files: FILES, hashed: ${HASHED}, csp: ${JSON.stringify(CSP)}${merchDir ? `, zones: [{ prefix: '/merch/', csp: ${JSON.stringify(MERCH_CSP)}, noStore: ${MERCH_NOSTORE} }]` : ''} });
`;
fs.writeFileSync(path.join(out, 'worker.js'), worker);
fs.writeFileSync(path.join(out, 'parts.txt'), parts.join('\n') + '\n');
gz += zlib.gzipSync(worker).length + zlib.gzipSync(fs.readFileSync(path.join(out, 'gate.js'))).length;
fs.writeFileSync(path.join(out, 'sizes.json'), JSON.stringify({ files: files.length, gzip: gz }, null, 2) + '\n');
console.log(`wrote ${path.relative(root, out) || out}/worker.js: ${files.length} files, ${(gz / 1e6).toFixed(2)} MB gzipped (limit ${(LIMIT_GZ / 1e6).toFixed(0)} MB)`);
if (merchDir) console.log(`  with the merch page from ${merchDir}: ${merchN} files added at /merch/ and the root${merchCfg ? ', /merch/test_cfg.json included' : ', no test_cfg.json (the test Worker will refuse checkouts: 403 test_only)'}`);
if (gz > LIMIT_GZ) { console.error('cf_test: too big for one Worker'); process.exit(1); }
