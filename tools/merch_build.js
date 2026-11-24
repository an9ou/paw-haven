// Merch: builds PawPrint, one standalone script, from the game's own art (no copy of the art is kept on the branch).
//   NODE_PATH=$(npm root -g) node tools/merch_build.js        -> merch/dist/pawprint.js, pawprint.min.js and the print page, twice:
//      merch/dist/print/v1/ (the current page) and merch/dist/print/<ART_VER>/ (this build kept by its version, so an order can be redrawn later
//      by the build it was previewed on, once the site keeps the old folders). All in merch/dist/, ignored by git.
// The script pulls in only dogs/pawart_dogs.js (the dogs, their outfits and faces), mods/genes.js (genes -> coat), merch/pawprint_font.js
// (Caveat Bold outlines) and merch/names.js (the name rules), each inside a private scope: no window.PawArt / window.PawGenes is set, no style tag is added, nothing is stored.
// Browser: <script src="pawprint.js"> -> window.PawPrint. Node / a Worker bundle: require('./pawprint.js') -> the same object.
// require('tools/merch_build.js') builds nothing: it gives { build, HASHED } for the tests (ART_VER per hashed file).
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'merch', 'dist');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PARTS = ['dogs/pawart_dogs.js', 'mods/genes.js', 'merch/pawprint_font.js', 'merch/names.js', 'merch/pawprint_core.js'];
const PAGE = fs.readdirSync(path.join(ROOT, 'merch', 'print', 'v1')).sort().map((f) => 'merch/print/v1/' + f);
// PawPrint.ART_VER = 'pp1-' + a hash of everything that decides a print file: the five parts, the print page (its size and dpr logic) and this
// file (the wrapper below). Any change to one of them gives print files a new version
const HASHED = PARTS.concat(PAGE, ['tools/merch_build.js']);
function wrap(read, BUILD) {
  return `/* PawPrint (Doodle Doggo merch): ${PARTS.join(' + ')}, built by tools/merch_build.js. Art and font: see those files. */
(function (G) {
  'use strict';
  var shim = { Intl: G.Intl }; shim.window = shim;
  var art = function (window, document, module) {
${read('dogs/pawart_dogs.js')}
  };
  art.call(shim, shim, undefined, undefined);
  var genes = function (window, globalThis, module) {
${read('mods/genes.js')}
  };
  genes.call(shim, shim, shim, undefined);
  var font = (function (module) {
${read('merch/pawprint_font.js')}
  return PAWPRINT_FONT; })(undefined);
  var names = (function (module, self) {
${read('merch/names.js')}
  return self.PawNames; })(undefined, {});
  var make = (function (module) {
${read('merch/pawprint_core.js')}
  return PawPrintMake; })(undefined);
  var api = make(shim.PawArt, shim.PawGenes, font, names, '${BUILD}');
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else G.PawPrint = api;
})(typeof self !== 'undefined' ? self : globalThis);
`;
}
// read(file) -> its text (the tests pass one that changes a file); -> { BUILD, ART_VER, src }
function build(read) {
  read = read || rd; let h = 2166136261;
  for (const p of HASHED) { const b = Buffer.from(p + '\n' + read(p), 'utf8'); for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 16777619); } }
  const BUILD = (h >>> 0).toString(16).padStart(8, '0');
  return { BUILD, ART_VER: 'pp1-' + BUILD, src: wrap(read, BUILD) };
}
if (require.main !== module) { module.exports = { build, HASHED, PARTS, PAGE }; return; }

const { BUILD, ART_VER, src } = build();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pawprint.js'), src);
// the print page, ready to serve: merch/print/v1/ (index.html, print.js) + pawprint.js beside them, in merch/dist/print/v1/ and print/<ART_VER>/
for (const dir of ['v1', ART_VER]) {
  const PD = path.join(OUT, 'print', dir); fs.mkdirSync(PD, { recursive: true });
  for (const f of PAGE) fs.copyFileSync(path.join(ROOT, f), path.join(PD, path.basename(f)));
  fs.writeFileSync(path.join(PD, 'pawprint.js'), src);
}
console.log('ART_VER ' + ART_VER, '| print page merch/dist/print/v1 and merch/dist/print/' + ART_VER);
let min = null;
try {
  const esbuild = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'esbuild'));
  min = esbuild.transformSync(src, { minify: true, target: 'es2019' }).code; fs.writeFileSync(path.join(OUT, 'pawprint.min.js'), min);
} catch (e) { console.warn('no esbuild: no min file'); }
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
const gz = (s) => (zlib.gzipSync(s, { level: 9 }).length / 1024).toFixed(0) + ' KB gz';
const br = (s) => (zlib.brotliCompressSync(s).length / 1024).toFixed(0) + ' KB br';
console.log('pawprint.js', kb(src), gz(src), '| min', min ? [kb(min), gz(min), br(min)].join(' ') : '-');
for (const p of PARTS) { const s = rd(p); console.log('  ', p, kb(s), gz(s)); }
