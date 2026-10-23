// Doodle Doggo: build the claude.ai multi-file artifact (v2.4).
//   node tools/artifact.js [--src <repo root>] [--out <dir>]
// Writes <out>/index.html (the shell with the CSS inline and <script src> tags) plus the game, art and module scripts as
// separate files, from the same sources as `node game/build.js publish`. The Artifact tool then publishes index.html with
// the other files as supporting files, so no single file is anywhere near the 16 MB limit and the page itself stays small.
// Default <out> is <src>/_artifact (not tracked). The single-file publish build (paw_haven_prototype.html) is unchanged.
// v2.14: a ninth file i18n.js (game/i18n/msg.js + game/i18n/packed.js, the same text the single-file builds put into the pawi18n slot)
// and the font subsets fonts/i18n/<lang>.woff2 (from game/fonts/i18n/, loaded only for the current language): publish them as files too.
// v2.14 PERF (PERF.md): i18n.js holds only msg.js, a small PAW_I18N and the loader (tools/split.js); each other language is lang/<code>.<hash>.js and
// the photo fonts photo_fonts.<hash>.js, loaded when needed. Publish them as files too. Every script file and index.html are minified with esbuild
// (tools/minify.js; --no-minify keeps them readable). The file list to pass to the Artifact tool is printed at the end and written to <out>/files.json.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const SRC = path.resolve(opt('--src', path.join(__dirname, '..'))), OUT = path.resolve(opt('--out', path.join(SRC, '_artifact')));
const G = path.join(SRC, 'game');
const cat = (dir) => fs.readFileSync(path.join(G, dir, 'ORDER.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean).map((f) => fs.readFileSync(path.join(G, dir, f), 'utf8')).join('');
const rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const banned = /nintendo|pok[eé]mon|animal crossing/i;
const FILES = {
  'dogs.js': ['dogs/pawart_dogs.js'],
  'world_a.js': ['world/pawart_world_a.js'],
  'world_b.js': ['world/pawart_world_b.js'],
  'world_c.js': ['world/pawart_world_c.js'],
  'world_d.js': ['world/pawart_world_d.js'],
  'world_e.js': ['world/pawart_world_e.js'],
  'mods.js': ['mods/genes.js', 'mods/pawaudio.js', 'mods/walkrun.js', 'mods/toys.js', 'mods/garden.js', 'mods/kitchen.js'],
};
const SPLIT = require(path.join(SRC, 'tools', 'split.js')).make(SRC);
const MIN = !args.includes('--no-minify'), minify = require(path.join(SRC, 'tools', 'minify.js'));
const es = MIN && minify.available();
if (MIN && !es) console.warn('artifact: esbuild not found (npm i -g esbuild@0.24.0); the files stay unminified');
// the generated data files (lang/, photo_fonts) are already compact: only the code is minified
const minJs = (name, text) => (es && /\.js$/.test(name) && !/^(lang\/|photo_fonts\.)/.test(name) ? minify.minifyJs(text) : text);
fs.rmSync(path.join(OUT, 'lang'), { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'lang'), { recursive: true });
fs.readdirSync(OUT).filter((f) => /^photo_fonts\.\w+\.js$/.test(f)).forEach((f) => fs.rmSync(path.join(OUT, f)));
const shell = fs.readFileSync(path.join(G, 'shell.html'), 'utf8'), css = cat('css'), js = cat('src');
let total = 0;
const published = [];
const write = (name, text) => { if (banned.test(text)) throw new Error('banned word in ' + name); text = minJs(name, text); fs.writeFileSync(path.join(OUT, name), text); total += Buffer.byteLength(text); if (name !== 'index.html') published.push(name); console.log(' ', name.padEnd(12), (Buffer.byteLength(text) / 1e3).toFixed(0).padStart(5), 'KB'); };
for (const [name, srcs] of Object.entries(FILES)) write(name, srcs.filter((f) => fs.existsSync(path.join(SRC, f))).map(rd).join('\n'));
write('i18n.js', SPLIT.core); // v2.14 PERF: msg.js + the small PAW_I18N + loader.js
for (const [name, text] of Object.entries(SPLIT.files)) write(name, text); // lang/<code>.<hash>.js, photo_fonts.<hash>.js
// v2.14: the per-language font subsets, next to index.html as fonts/i18n/<file> (binary, copied as they are)
const FD = path.join(G, 'fonts', 'i18n'), fontFiles = fs.existsSync(FD) ? fs.readdirSync(FD).filter((f) => /\.woff2$/.test(f)).sort() : [];
if (fontFiles.length) { fs.mkdirSync(path.join(OUT, 'fonts', 'i18n'), { recursive: true }); for (const f of fontFiles) { fs.copyFileSync(path.join(FD, f), path.join(OUT, 'fonts', 'i18n', f)); total += fs.statSync(path.join(FD, f)).size; published.push('fonts/i18n/' + f); } console.log('  fonts/i18n/  ', fontFiles.length, 'files:', fontFiles.join(' ')); }
write('game.js', SPLIT.game(js)); // waits for its language (PAW_I18N.run), photo fonts on first use
// the shell keeps its three script slots; here each slot becomes src tags (same order as the single-file build: art, mods, game)
const tags = (names) => names.map((n) => `<script src="${n}"></script>`).join('\n');
let index = shell
  .replace('<script id="pawi18n">/*@@I18N@@*/</script>', () => tags(['i18n.js'])) // v2.14: msg.js + packed.js, before the art and the modules
  .replace('/*@@CSS@@*/', () => css)
  .replace('<script id="pawart">/*@@PAWART@@*/</script>', () => tags(['dogs.js', 'world_a.js', 'world_b.js', 'world_c.js', 'world_d.js', 'world_e.js']))
  .replace('<script id="pawmods">/*@@PAWMODS@@*/</script>', () => tags(['mods.js']))
  .replace(/<script>\s*\/\*@@GAME@@\*\/\s*<\/script>/, () => tags(['game.js']));
if (/@@(I18N|CSS|PAWART|PAWMODS|GAME)@@/.test(index)) throw new Error('a shell slot was not filled');
index = SPLIT.fontsLink(index); // the Google Fonts stylesheet does not block the first paint
if (banned.test(index)) throw new Error('banned word in index.html');
const indexOut = es ? minify.minifyHtml(index).html : index; // the inline CSS and the loading paw
fs.writeFileSync(path.join(OUT, 'index.html'), indexOut); total += Buffer.byteLength(indexOut); console.log('  index.html  ', (Buffer.byteLength(indexOut) / 1e3).toFixed(0).padStart(5), 'KB');
fs.writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(published, null, 1) + '\n');
console.log('artifact build ok', (total / 1e6).toFixed(2) + ' MB in', published.length + 1, 'files ->', OUT, MIN ? (es ? '(minified)' : '(esbuild missing: not minified)') : '(not minified)');
console.log('publish index.html with these files (published path = path under ' + path.relative(process.cwd(), OUT) + '/): ' + published.join(' '));
