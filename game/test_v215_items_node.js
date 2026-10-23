// v2.15 ITEM ART test (plain node). Run: node game/test_v215_items_node.js (or node game/run_tests.js v215_items)
// The seven v2.15 items (V215.md 6.2, 6.3): the Doggy Life Vest and the six run-track treasures. Each one is a real PawArt.item icon
// (0 0 64 64, not the "?" placeholder the game's artReal() rejects), drawn by world E (it loads with the game; world G is a lazy chunk),
// still there with worlds F and G loaded on top; the three wearables are in the dog art's outfit lists for their game slots and draw on
// the crude dogs (breeds, ages, poses, both facings, with sparkle and older outfits) with no NaN and unique ids; the old dog renders and
// the old item icons stay byte-identical to v215-base (a spot check: node dogs/check_identical.js v215-base is the full proof).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const WORLDS = ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js'];
const LAZY = ['world/pawart_world_f.js', 'world/pawart_world_g.js'].filter((f) => fs.existsSync(path.join(ROOT, f)));
const ITEMS = ['Doggy Life Vest', 'Sunflower Collar', 'Sailor Cap', 'Lucky Horseshoe', 'Bamboo Ring', 'Paper Lantern', 'Sea Glass'];
const WEAR = { 'Doggy Life Vest': 'body', 'Sunflower Collar': 'neck', 'Sailor Cap': 'head' };
const PLACEHOLDER_RE = /<text[^>]*>\s*\?\s*<\/text>/; // the same test as artReal() in game/src/00_core.js

let pass = 0, fail = 0;
function ok(c, msg) { if (c) pass++; else { fail++; if (fail < 60) console.log('FAIL ' + msg); } }
function sec(t) { console.log('-- ' + t); }
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
function load(srcs) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx); srcs.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'art' + i + '.js' }));
  return ctx.window.PawArt;
}
const vbOf = (svg) => (svg.match(/viewBox="([^"]+)"/) || [])[1];
const norm = (s) => s.replace(/pw[a-z]+\d*[0-9a-z]*x?\d*/g, 'ID');
function clean(svg, what) {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), what + ': an SVG');
  ok(!/NaN|undefined|Infinity/.test(svg), what + ': no NaN, undefined or Infinity');
  ok(!/<script|\son[a-z]+=|<filter/i.test(svg), what + ': no script, handler or filter');
}
function ids(svg, what) {
  const def = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]), set = new Set(def);
  ok(set.size === def.length, what + ': ids are unique');
  ok([...svg.matchAll(/url\(#([^)]+)\)/g)].every((m) => set.has(m[1])), what + ': every url(#id) is defined');
  return def;
}

const PA = load(WORLDS.map(read));

sec('the game rows name these seven items');
{
  const core = read('game/src/00_core.js');
  ok(/\{ n: 'Doggy Life Vest', slot: 'body'/.test(core), 'CLOTHES has the Doggy Life Vest in the body slot');
  [['Sunflower Collar', 'wearable', "'neck'"], ['Lucky Horseshoe', 'charm', "'charm'"], ['Bamboo Ring', 'toy', 'null'], ['Paper Lantern', 'charm', "'charm'"], ['Sea Glass', 'charm', "'charm'"], ['Sailor Cap', 'wearable', "'head'"]]
    .forEach(([n, kind, slot]) => ok(core.includes(`TR('${n}', '${kind}', ${slot},`), `TREASURES has ${n} (${kind})`));
  ok(/TR_RING_TOY = \{ prop: \['item', TR_RING\]/.test(read('game/src/46_tracks.js')), 'ball play draws the Bamboo Ring with PawArt.item (46_tracks.js TR_RING_TOY)');
}

sec('PawArt.item: seven real icons');
ok(Array.isArray(PA.V215_ITEMS) && PA.V215_ITEMS.length === 7 && ITEMS.every((n) => PA.V215_ITEMS.includes(n)), 'PawArt.V215_ITEMS lists the seven');
ok(Array.isArray(PA.WORLD_E_ITEMS) && PA.WORLD_E_ITEMS.length === 10 && !ITEMS.some((n) => PA.WORLD_E_ITEMS.includes(n)), 'WORLD_E_ITEMS is still the 10 Tokyo items');
const icons = {};
ITEMS.forEach((n) => {
  const s = PA.item(n); icons[n] = s; clean(s, n); ids(s, n);
  ok(s.includes('<svg') && !PLACEHOLDER_RE.test(s), n + ': real art, not the "?" placeholder');
  ok(vbOf(s) === '0 0 64 64', n + ': viewBox 0 0 64 64');
  ok(s.length > 1500, n + ': has real content (' + s.length + ' chars)');
  ok(new RegExp('aria-label="' + n + '"').test(s), n + ': aria-label is the name');
  ok(norm(PA.item(n)) === norm(s), n + ': the same call draws the same icon');
  const t = PA.item(n, { aria: 'X ' + n }); ok(/^<svg[^>]*aria-label="X /.test(t), n + ': takes the v2.14 { aria } label');
});
ok(new Set(ITEMS.map((n) => norm(icons[n]))).size === 7, 'the seven icons are all different');
{ const a = PA.item('Sea Glass'), b = PA.item('Sea Glass'), ia = ids(a, 'Sea Glass #1'), ib = ids(b, 'Sea Glass #2'); ok(!ia.some((x) => ib.includes(x)), 'two copies of one icon on a page never share an id'); }
{ const page = ITEMS.map((n) => PA.item(n)).join(''); ids(page, 'all seven on one page'); }
{
  const P2 = load(WORLDS.concat(LAZY).map(read));
  ok(LAZY.length === 2, 'worlds F and G are in the tree');
  ITEMS.forEach((n) => { const s = P2.item(n); ok(!PLACEHOLDER_RE.test(s) && norm(s) === norm(icons[n]), n + ': the same art with worlds F and G loaded'); });
}

sec('the three wearables on the dogs');
const HOOK = 'PA.dog=dog;', DSRC = read('dogs/pawart_dogs.js');
ok(DSRC.split(HOOK).length === 2, 'the hook point PA.dog=dog; is there once');
const IP = load([DSRC.replace(HOOK, HOOK + 'PA._t={OUT};')]), OUT = IP._t.OUT;
Object.keys(WEAR).forEach((n) => ok(OUT[WEAR[n]].includes(n) && Object.keys(OUT).filter((sl) => OUT[sl].includes(n)).length === 1, `${n} is a ${WEAR[n]} outfit (and only that)`));
const COL = { 'Doggy Life Vest': '#FF8A24', 'Sunflower Collar': '#FFD23A', 'Sailor Cap': '#25397A' };
const BREEDS = PA.DOGS.map((d) => d.key), POSES = ['idle', 'walk', 'sit', 'sleep', 'jump', 'happy', 'down', 'rollover', 'howl', 'beg', 'dance', 'shake'];
const AGES = [null, 'puppy', 'newborn'];
let n = 0;
BREEDS.forEach((k, bi) => POSES.forEach((p, pi) => AGES.forEach((age, ai) => {
  const f = (bi + pi + ai) % 2 ? 'left' : 'right';
  Object.keys(WEAR).forEach((nm) => {
    const o = { pose: p, facing: f, outfit: { [WEAR[nm]]: nm } }; if (age) o.age = age; if ((bi + pi) % 3 === 0) o.sparkle = true;
    const lab = `${k} ${p} ${age || 'adult'} ${f} ${nm}`; n++;
    let s = ''; try { s = PA.dog(k, o); } catch (e) { ok(false, lab + ': threw ' + e.message); return; }
    ok(s.startsWith('<svg') && vbOf(s) === '0 0 240 200' && !/NaN|undefined|Infinity/.test(s), lab + ': a clean 240 x 200 SVG');
    ok(s.includes(COL[nm]), lab + ': the outfit is drawn');
    const d = [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]); ok(new Set(d).size === d.length, lab + ': ids are unique');
  });
})));
console.log('   ' + n + ' renders');
{
  const ALL = { head: 'Sailor Cap', neck: 'Sunflower Collar', body: 'Doggy Life Vest' };
  [{ ...ALL }, { ...ALL, eyes: 'Heart Sunglasses' }, { head: 'Sailor Cap', body: 'Ghost Sheet' }, { neck: 'Sunflower Collar', body: 'Little Bat Costume' }, { head: 'Astronaut Helmet', body: 'Doggy Life Vest' }, { body: 'Doggy Life Vest', sleepwear: true }]
    .forEach((of, i) => ['shiba', 'pug', 'golden', 'dachs', 'dane', 'mutt'].forEach((k, j) => {
      const o = { pose: POSES[(i + j) % POSES.length], outfit: of, age: j % 3 === 1 ? 'puppy' : undefined, mix: j === 5 ? { head: 'corgi' } : undefined, expecting: j === 2, coat: j === 3 ? { base: '#2B2430', light: '#FFE7B3', dark: '#1D1A22', white: 0.6, merle: true, eyes: 'odd' } : undefined };
      let s = ''; try { s = PA.dog(k, o); } catch (e) { ok(false, `combo#${i} ${k}: threw ${e.message}`); return; }
      ok(s.startsWith('<svg') && !/NaN|undefined|Infinity/.test(s), `combo#${i} ${k}: a clean SVG`);
    }));
  const one = PA.dog('shiba', { pose: 'idle', outfit: ALL }); ok(one === PA.dog('shiba', { pose: 'idle', outfit: ALL }), 'the same call draws the same dog');
  ok(PA.dog('corgi', { pose: 'walk', outfit: { body: 'Doggy Life Vest' } }) !== PA.dog('corgi', { pose: 'walk' }), 'the vest changes the dog');
  ok(PA.dog('corgi', { pose: 'walk', outfit: { head: 'Sailor Cap' } }) !== PA.dog('corgi', { pose: 'walk', outfit: { neck: 'Sailor Collar' } }), 'the Sailor Cap is not the Sailor Collar');
}

sec('old renders are byte-identical to v215-base (spot check)');
{
  let OLD = null;
  for (const ref of ['v215-base', 'origin/v215-base']) {
    try { OLD = WORLDS.map((f) => execFileSync('git', ['-C', ROOT, 'show', ref + ':' + f], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString()); break; } catch (e) { OLD = null; }
  }
  ok(!!OLD, 'git show v215-base works (git fetch origin v215-base:v215-base)');
  if (OLD) {
    const A = load(OLD), B = load(WORLDS.map(read));
    let c = 0;
    ['shiba', 'corgi', 'golden', 'pug', 'dachs', 'akita', 'lab', 'westie'].forEach((k, i) => ['idle', 'walk', 'sit', 'sleep'].forEach((p, j) =>
      [null, { neck: 'Clover Collar' }, { head: 'Chef Hat' }, { body: 'Yellow Raincoat' }, { head: 'Party Hat', neck: 'Asakusa Bandana', body: 'Little Bat Costume' }].forEach((of) => {
        const o = { pose: p }; if (of) o.outfit = of; if ((i + j) % 3 === 1) o.age = 'puppy'; c++;
        ok(A.dog(k, o) === B.dog(k, o), `${k} ${p} ${JSON.stringify(of)}: the same as v215-base`);
      })));
    ['Yellow Raincoat', 'Clover Collar', 'Sailor Collar', 'Sun Hat', 'Glow Ball', 'Sparkle Stone', 'Lucky Penny', 'Shibuya Bandana', 'Lucky Cat', 'Paw', 'Tennis Ball'].forEach((it) => { c++; ok(norm(A.item(it)) === norm(B.item(it)), it + ': the old icon is the same as v215-base'); });
    console.log('   ' + c + ' compared');
  }
}

console.log(`\nv215_items: ${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); }
console.log('ALL OK');
