// Copies the released print pages into this Worker's static assets (assets/merch/print/<ART_VER>/), so an order is redrawn by the build it was
// previewed on (TRANSACTIONS.md 6.6, T2.2-49).
// The released folders live in git under site/merch/print/<ART_VER>/ (the page build puts each new one there and it is committed: S14, contract
// question 17). This script copies EVERY folder found there and never deletes anything: a folder is never removed once an order was taken with it,
// and a deploy from a clean checkout still serves every old one.
//   node cloudflare/merch/build_assets.mjs          (MERCH_PRINT_SRC / MERCH_ASSETS_DIR override the two folders; the tests use them)
// Prints the MERCH_ART_VERS value (the older folders still served) for wrangler. Writes nothing outside the assets folder. Deploys nothing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const SRC = process.env.MERCH_PRINT_SRC || path.join(ROOT, 'site', 'merch', 'print');
const DST = process.env.MERCH_ASSETS_DIR || path.join(HERE, 'assets', 'merch', 'print');
const VER = /^pp1-[0-9a-f]{8}$/;
if (!fs.existsSync(SRC)) { console.error('no ' + path.relative(ROOT, SRC) + ': the released print folders are missing (they are committed with the page)'); process.exit(1); }
fs.mkdirSync(DST, { recursive: true });
const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, f.name), b = path.join(to, f.name);
    if (f.isDirectory()) copyDir(a, b); else if (!fs.existsSync(b)) fs.copyFileSync(a, b); // a released file never changes
  }
};
for (const d of fs.readdirSync(SRC).filter((x) => VER.test(x)).sort()) {
  const to = path.join(DST, d), had = fs.existsSync(to);
  copyDir(path.join(SRC, d), to);
  if (!had) console.log('added', d);
}
const all = fs.readdirSync(DST).filter((d) => VER.test(d)).sort();
let current = process.env.MERCH_ART_VER || null; // the build the Worker loads
if (!current) { try { current = createRequire(import.meta.url)(path.join(ROOT, 'merch', 'dist', 'pawprint.js')).ART_VER; } catch (e) { current = null; } }
if (current && !all.includes(current)) console.error('WARNING: the current ART_VER ' + current + ' has no folder in ' + path.relative(ROOT, SRC) + ': build and commit the page first');
console.log('folders served:', all.join(', '));
console.log('MERCH_ART_VERS = "' + all.filter((d) => d !== current).join(',') + '"   (the current build adds its own ART_VER)');
