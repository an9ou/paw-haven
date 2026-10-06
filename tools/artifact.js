// Paw Haven: build the claude.ai multi-file artifact (v2.4).
//   node tools/artifact.js [--src <repo root>] [--out <dir>]
// Writes <out>/index.html (the shell with the CSS inline and <script src> tags) plus the game, art and module scripts as
// separate files, from the same sources as `node game/build.js publish`. The Artifact tool then publishes index.html with
// the other files as supporting files, so no single file is anywhere near the 16 MB limit and the page itself stays small.
// Default <out> is <src>/_artifact (not tracked). The single-file publish build (paw_haven_prototype.html) is unchanged.
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
  'mods.js': ['mods/genes.js', 'mods/pawaudio.js', 'mods/walkrun.js', 'mods/toys.js', 'mods/garden.js', 'mods/kitchen.js']
};
fs.mkdirSync(OUT, { recursive: true });
const shell = fs.readFileSync(path.join(G, 'shell.html'), 'utf8'), css = cat('css'), js = cat('src');
let total = 0;
const write = (name, text) => { if (banned.test(text)) throw new Error('banned word in ' + name); fs.writeFileSync(path.join(OUT, name), text); total += text.length; console.log(' ', name.padEnd(12), (text.length / 1e3).toFixed(0).padStart(5), 'KB'); };
for (const [name, srcs] of Object.entries(FILES)) write(name, srcs.map(rd).join('\n'));
write('game.js', js);
// the shell keeps its three script slots; here each slot becomes src tags (same order as the single-file build: art, mods, game)
const tags = (names) => names.map((n) => `<script src="${n}"></script>`).join('\n');
const index = shell
  .replace('/*@@CSS@@*/', () => css)
  .replace('<script id="pawart">/*@@PAWART@@*/</script>', () => tags(['dogs.js', 'world_a.js', 'world_b.js', 'world_c.js']))
  .replace('<script id="pawmods">/*@@PAWMODS@@*/</script>', () => tags(['mods.js']))
  .replace(/<script>\s*\/\*@@GAME@@\*\/\s*<\/script>/, () => tags(['game.js']));
if (/@@(CSS|PAWART|PAWMODS|GAME)@@/.test(index)) throw new Error('a shell slot was not filled');
write('index.html', index);
console.log('artifact build ok', (total / 1e6).toFixed(2) + ' MB in', Object.keys(FILES).length + 2, 'files ->', OUT);
