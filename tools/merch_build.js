// Merch spike: builds PawPrint, one standalone script, from the game's own art (no copy of the art is kept on the branch).
//   NODE_PATH=$(npm root -g) node tools/merch_build.js        -> merch/dist/pawprint.js, pawprint.min.js and the print page merch/dist/print/v1/ (all ignored by git)
// The script pulls in only dogs/pawart_dogs.js (the dogs, their outfits and faces), mods/genes.js (genes -> coat), merch/pawprint_font.js
// (Caveat Bold outlines) and merch/names.js (the name rules), each inside a private scope: no window.PawArt / window.PawGenes is set, no style tag is added, nothing is stored.
// Browser: <script src="pawprint.js"> -> window.PawPrint. Node / a Worker bundle: require('./pawprint.js') -> the same object.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'merch', 'dist');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PARTS = ['dogs/pawart_dogs.js', 'mods/genes.js', 'merch/pawprint_font.js', 'merch/names.js', 'merch/pawprint_core.js'];
// PawPrint.ART_VER = 'pp1-' + this hash of every part: any change to the art, genes, font, name rules or layouts gives print files a new version
const BUILD = (() => { let h = 2166136261; for (const p of PARTS) { const b = fs.readFileSync(path.join(ROOT, p)); for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 16777619); } } return (h >>> 0).toString(16).padStart(8, '0'); })();
const src = `/* PawPrint (Doodle Doggo merch spike): ${PARTS.join(' + ')}, built by tools/merch_build.js. Art and font: see those files. */
(function (G) {
  'use strict';
  var shim = { Intl: G.Intl }; shim.window = shim;
  var art = function (window, document, module) {
${rd('dogs/pawart_dogs.js')}
  };
  art.call(shim, shim, undefined, undefined);
  var genes = function (window, globalThis, module) {
${rd('mods/genes.js')}
  };
  genes.call(shim, shim, shim, undefined);
  var font = (function (module) {
${rd('merch/pawprint_font.js')}
  return PAWPRINT_FONT; })(undefined);
  var names = (function (module, self) {
${rd('merch/names.js')}
  return self.PawNames; })(undefined, {});
  var make = (function (module) {
${rd('merch/pawprint_core.js')}
  return PawPrintMake; })(undefined);
  var api = make(shim.PawArt, shim.PawGenes, font, names, '${BUILD}');
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else G.PawPrint = api;
})(typeof self !== 'undefined' ? self : globalThis);
`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pawprint.js'), src);
// the print page, ready to serve: merch/print/v1/ (index.html, print.js) + pawprint.js beside them, in merch/dist/print/v1/
const PV = path.join(ROOT, 'merch', 'print', 'v1'), PD = path.join(OUT, 'print', 'v1');
fs.mkdirSync(PD, { recursive: true });
for (const f of fs.readdirSync(PV)) fs.copyFileSync(path.join(PV, f), path.join(PD, f));
fs.writeFileSync(path.join(PD, 'pawprint.js'), src);
console.log('ART_VER pp1-' + BUILD, '| print page', path.relative(ROOT, PD));
let min = null;
try {
  const esbuild = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'esbuild'));
  min = esbuild.transformSync(src, { minify: true, target: 'es2019' }).code; fs.writeFileSync(path.join(OUT, 'pawprint.min.js'), min);
} catch (e) { console.warn('no esbuild: no min file', e.message); }
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
const gz = (s) => (zlib.gzipSync(s, { level: 9 }).length / 1024).toFixed(0) + ' KB gz';
const br = (s) => (zlib.brotliCompressSync(s).length / 1024).toFixed(0) + ' KB br';
console.log('pawprint.js', kb(src), gz(src), '| min', min ? [kb(min), gz(min), br(min)].join(' ') : '-');
for (const p of PARTS) { const s = rd(p); console.log('  ', p, kb(s), gz(s)); }
