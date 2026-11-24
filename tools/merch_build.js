// Merch spike: builds PawPrint, one standalone script, from the game's own art (no copy of the art is kept on the branch).
//   NODE_PATH=$(npm root -g) node tools/merch_build.js        -> merch/dist/pawprint.js and merch/dist/pawprint.min.js (both ignored by git)
// The script pulls in only dogs/pawart_dogs.js (the dogs, their outfits and faces), mods/genes.js (genes -> coat) and merch/pawprint_font.js
// (Caveat Bold outlines), each inside a private scope: no window.PawArt / window.PawGenes is set, no style tag is added, nothing is stored.
// Browser: <script src="pawprint.js"> -> window.PawPrint. Node / a Worker bundle: require('./pawprint.js') -> the same object.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'merch', 'dist');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PARTS = ['dogs/pawart_dogs.js', 'mods/genes.js', 'merch/pawprint_font.js', 'merch/pawprint_core.js'];
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
  var make = (function (module) {
${rd('merch/pawprint_core.js')}
  return PawPrintMake; })(undefined);
  var api = make(shim.PawArt, shim.PawGenes, font);
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else G.PawPrint = api;
})(typeof self !== 'undefined' ? self : globalThis);
`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pawprint.js'), src);
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
