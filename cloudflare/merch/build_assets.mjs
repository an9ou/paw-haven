// Copies the print pages from the PawPrint build (merch/dist/print/<ART_VER>/) into this Worker's static assets (assets/merch/print/<ART_VER>/),
// keeping every folder already there: an order is redrawn by the build it was previewed on (TRANSACTIONS.md 6.6, T2.2-49).
//   NODE_PATH=$(npm root -g) node tools/merch_build.js && node cloudflare/merch/build_assets.mjs
// Prints the MERCH_ART_VERS value (the older folders still served) for wrangler. Writes nothing outside cloudflare/merch/assets/. Deploys nothing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..');
const SRC = path.join(ROOT, 'merch', 'dist', 'print'), DST = path.join(HERE, 'assets', 'merch', 'print');
if (!fs.existsSync(SRC)) { console.error('no merch/dist/print: run NODE_PATH=$(npm root -g) node tools/merch_build.js first'); process.exit(1); }
fs.mkdirSync(DST, { recursive: true });
const built = fs.readdirSync(SRC).filter((d) => /^pp1-[0-9a-f]{8}$/.test(d));
for (const d of built) {
  const to = path.join(DST, d);
  if (fs.existsSync(to)) continue; // a released folder never changes
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(path.join(SRC, d))) fs.copyFileSync(path.join(SRC, d, f), path.join(to, f));
  console.log('added', path.relative(ROOT, to));
}
const all = fs.readdirSync(DST).filter((d) => /^pp1-[0-9a-f]{8}$/.test(d)).sort();
const current = createRequire(import.meta.url)(path.join(ROOT, 'merch', 'dist', 'pawprint.js')).ART_VER; // the build the Worker loads
console.log('folders served:', all.join(', '));
console.log('MERCH_ART_VERS = "' + all.filter((d) => d !== current).join(',') + '"   (the current build adds its own ART_VER)');
