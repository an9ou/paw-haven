// Merch: writes site/merch/catalog.json, the page's stand-in catalog in TEST MODE, from the Worker's own price list (cloudflare/merch/catalog.js,
// the single source: prices, zones, delivery times, countries). It is exactly what GET /merch/catalog answers (lines.js catalogOut) with:
//   MERCH_COUNTRIES = catalog.js LAUNCH_COUNTRIES (the recommended launch value: the UK, the EU, Brazil and Korea "coming soon"),
//   MERCH_PRODUCTS = mug,tee, the shop shut, nothing sold out, every variant on, art_vers [] (the page's fake adds its own print build).
// Zone notes: the Worker's zoneNotes(), so "vat_included" is in the uk_eu zone only while a UK or EU registration is live (catalog.js
// REGISTERED, empty at launch): the stand-in never says "Prices include VAT." when the Worker would not.
//   NODE_PATH=$(npm root -g) node tools/merch_catalog_json.js           write it
//   NODE_PATH=$(npm root -g) node tools/merch_catalog_json.js --check   exit 1 if the committed file differs (the merch_worker suite checks it too)
// Needs the PawPrint bundle (merch/dist/pawprint.js: node tools/merch_build.js): the tee colours and sizes are PawPrint's.
'use strict';
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'site', 'merch', 'catalog.json');

// one key a line at the top, one object a line inside arrays of objects (readable diffs; the same layout the hand-made file had)
function layout(o) {
  const v = (x) => JSON.stringify(x);
  return '{\n' + Object.keys(o).filter((k) => o[k] !== undefined).map((k) => {
    const x = o[k];
    if (Array.isArray(x) && x.length && x.every((y) => y && typeof y === 'object')) return ' ' + v(k) + ': [\n' + x.map((y) => '  ' + v(y)).join(',\n') + '\n ]';
    return ' ' + v(k) + ': ' + v(x);
  }).join(',\n') + '\n}\n';
}
async function make() {
  const C = await import(pathToFileURL(path.join(ROOT, 'cloudflare', 'merch', 'catalog.js')).href);
  const Lmod = await import(pathToFileURL(path.join(ROOT, 'cloudflare', 'merch', 'lines.js')).href);
  const PP = require(path.join(ROOT, 'merch', 'dist', 'pawprint.js'));
  const cat = C.buildCatalog(PP);
  const out = Lmod.catalogOut(PP, cat, { MERCH_COUNTRIES: C.LAUNCH_COUNTRIES, MERCH_PRODUCTS: 'mug,tee' }, { shut: true, sold_out_today: false, art_vers: [] });
  return layout(out);
}
module.exports = { make, OUT };

if (require.main === module) {
  make().then((txt) => {
    if (process.argv.includes('--check')) {
      const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
      if (now !== txt) { console.error('site/merch/catalog.json differs from cloudflare/merch/catalog.js: run node tools/merch_catalog_json.js'); process.exit(1); }
      console.log('site/merch/catalog.json matches cloudflare/merch/catalog.js');
    } else { fs.writeFileSync(OUT, txt); console.log('wrote ' + path.relative(ROOT, OUT)); }
  }, (e) => { console.error(e && e.stack || e); process.exit(1); });
}
