// v2.5 FESTIVAL ART test (plain node). Run: node game/test_v25_art_node.js   (exits 1 on any failure)
// Covers V25.md sections 2 and 4: every new PawArt name draws (no "?" placeholder, the stated viewBox, no <script),
// options are normalised and cached, the module still works next to world/pawart_world_a.js, and every name that existed
// at v25-base is byte-identical to it (git show), called in the same order in two fresh contexts, except the six house
// item icons, which v2.5 redraws bolder for the 40 px shop scale.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const SRC_B = fs.readFileSync(path.join(ROOT, 'world', 'pawart_world_b.js'), 'utf8');
const SRC_A = fs.readFileSync(path.join(ROOT, 'world', 'pawart_world_a.js'), 'utf8');

let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; } else { fail++; console.log('FAIL ' + msg); } }
function sec(t) { console.log('-- ' + t); }

function load(srcs) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx);
  srcs.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'art' + i + '.js' }));
  return ctx.window.PawArt;
}
const vbOf = (svg) => (svg.match(/viewBox="([^"]+)"/) || [])[1];
const isPlaceholder = (svg) => />\?<\/text>/.test(svg);
const norm = (s) => s.replace(/pwb[0-9a-z]+/g, 'ID');

// the allowed changes: the six v2.4 house item icons are redrawn (V25.md section 4, ride-along)
const HOUSE_ICONS = ['Little Tea House', 'Beach Hut', 'Camper Van', 'Pumpkin Cottage', 'Lighthouse Kennel', 'Rocket Ship'];
const FOODS = ['Baked Pumpkin Wedges', 'Sweet Potato Coins', 'Warm Bone Broth', 'Ghost Biscuits', 'Candy Corn Carrots', 'Monster Meatball'];
const CLOTHES = ['Leaf Beret', 'Autumn Scarf', 'Ghost Sheet', 'Pumpkin Suit', 'Parade Rosette'];
const ITEMS = [...FOODS, ...CLOTHES];
const ICONS = ['festival', 'parade'];
const PROPS = [
  ['leafpile', { state: 'full', seed: 0 }, '0 0 160 100'], ['leafpile', { state: 'scattered', seed: 0 }, '0 0 160 100'],
  ['leafpile', { state: 'full', seed: 5 }, '0 0 160 100'], ['leafpile', {}, '0 0 160 100'],
  ['stall', { kind: 'leaf' }, '0 0 240 220'], ['stall', { kind: 'halloween' }, '0 0 240 220'], ['stall', undefined, '0 0 240 220'],
  ['paradebanner', undefined, '0 0 400 90'],
  ['jackolantern', { lit: false }, '0 0 80 80'], ['jackolantern', { lit: true }, '0 0 80 80'],
  ['leafdrift', undefined, '0 0 120 40'],
];

function checkNew(PA, tag) {
  const good = (svg, vb, what) => {
    ok(typeof svg === 'string' && svg.startsWith('<svg'), `${tag}: ${what} returns an SVG`);
    ok(vbOf(svg) === vb, `${tag}: ${what} viewBox is ${vb} (got ${vbOf(svg)})`);
    ok(!isPlaceholder(svg), `${tag}: ${what} is not the "?" placeholder`);
    ok(!/<script/i.test(svg) && !/\son[a-z]+=/i.test(svg), `${tag}: ${what} has no script or event handler`);
    ok(!/<filter/i.test(svg), `${tag}: ${what} uses no filter`);
    ok(svg.length > 600, `${tag}: ${what} has real content (${svg.length} chars)`);
  };
  ITEMS.forEach((n) => good(PA.item(n), '0 0 64 64', `item("${n}")`));
  HOUSE_ICONS.forEach((n) => good(PA.item(n), '0 0 64 64', `item("${n}") (house card)`));
  ICONS.forEach((n) => good(PA.icon(n), '0 0 64 64', `icon("${n}")`));
  ['spring', 'summer', 'autumn', 'winter'].forEach((s) => good(PA.icon('season-' + s), '0 0 64 64', `icon("season-${s}")`));
  PROPS.forEach(([n, o, vb]) => good(PA.prop(n, o), vb, `prop("${n}", ${JSON.stringify(o)})`));
  const WB = PA.WORLD_B;
  ok(ITEMS.every((n) => WB.items.includes(n)), `${tag}: WORLD_B.items lists every new item`);
  ok(ICONS.every((n) => WB.icons.includes(n)), `${tag}: WORLD_B.icons lists the new icons`);
  ok(['leafpile', 'stall', 'paradebanner', 'jackolantern', 'leafdrift'].every((n) => WB.props.includes(n)), `${tag}: WORLD_B.props lists the new props`);
  ok(isPlaceholder(PA.item('No Such Thing')), `${tag}: an unknown item is still the "?" placeholder`);
  ok(isPlaceholder(PA.icon('nosuchicon')), `${tag}: an unknown icon is still the "?" placeholder`);
  ok(isPlaceholder(PA.prop('no-such-prop', {})), `${tag}: an unknown prop is still the "?" placeholder`);
}

sec('new names, module alone');
const PA1 = load([SRC_B]);
checkNew(PA1, 'alone');

sec('new names, loaded after pawart_world_a.js (build order)');
const PA2 = load([SRC_A, SRC_B]);
checkNew(PA2, 'with world_a');

sec('deterministic, cached per name and option, options normalised');
{
  const PAa = load([SRC_B]), PAb = load([SRC_B]);
  [...ITEMS, ...HOUSE_ICONS].forEach((n) => {
    const a = PAa.item(n);
    ok(norm(a) === norm(PAa.item(n)) && norm(a) === norm(PAb.item(n)), `item("${n}") is the same drawing on a second call and in a fresh context`);
  });
  ICONS.forEach((n) => ok(norm(PAa.icon(n)) === norm(PAb.icon(n)), `icon("${n}") is deterministic`));
  PROPS.forEach(([n, o]) => ok(norm(PAa.prop(n, o)) === norm(PAb.prop(n, o)) && norm(PAa.prop(n, o)) === norm(PAa.prop(n, o)), `prop("${n}", ${JSON.stringify(o)}) is deterministic`));
  ok(new Set([...ITEMS, ...HOUSE_ICONS].map((n) => norm(PAa.item(n)))).size === ITEMS.length + HOUSE_ICONS.length, 'all new item drawings differ');
  const P = (n, o) => norm(PAa.prop(n, o));
  ok(P('leafpile', { state: 'full', seed: 0 }) !== P('leafpile', { state: 'scattered', seed: 0 }), 'full and scattered leaf piles differ');
  ok(P('leafpile', { seed: 1 }) !== P('leafpile', { seed: 2 }), 'two seeds give two different piles');
  ok(P('leafpile', {}) === P('leafpile', { state: 'full', seed: 0 }) && P('leafpile', { state: 'jumped' }) === P('leafpile', { state: 'full' }), 'leafpile defaults to full, seed 0');
  ok(P('leafpile', { seed: 64 }) === P('leafpile', { seed: 0 }) && P('leafpile', { seed: -3 }) === P('leafpile', { seed: 3 }), 'leafpile seeds wrap to 0..63');
  ok(/data-state="scattered"/.test(PAa.prop('leafpile', { state: 'scattered' })), 'a scattered pile carries data-state');
  ok(P('stall', { kind: 'leaf' }) !== P('stall', { kind: 'halloween' }), 'the leaf and halloween stalls differ');
  ok(P('stall') === P('stall', { kind: 'leaf' }) && P('stall', { kind: 'xmas' }) === P('stall', { kind: 'leaf' }), 'stall defaults to leaf');
  const hw = PAa.prop('stall', { kind: 'halloween' }), lf = PAa.prop('stall', { kind: 'leaf' });
  ok(hw.includes('Dog-safe') && !lf.includes('Dog-safe'), 'only the halloween stall has the "Dog-safe treats" chalk sign');
  ok(/pa-wb-glow/.test(hw) && !/pa-wb-glow/.test(lf), 'only the halloween stall has the lit jack-o-lantern glow');
  ok(lf.includes('Harvest Stall') && hw.includes('Harvest Stall'), 'both stalls are signed Harvest Stall');
  ok(P('jackolantern', { lit: true }) !== P('jackolantern', { lit: false }) && P('jackolantern') === P('jackolantern', { lit: false }), 'jackolantern lit and unlit differ, default unlit');
  ok(/pa-wb-glow/.test(PAa.prop('jackolantern', { lit: true })) && !/pa-wb-glow/.test(PAa.prop('jackolantern')), 'only the lit jack-o-lantern glows');
  ok(PAa.prop('paradebanner').includes('Costume Parade'), 'the banner says Costume Parade');
  const ids = (s) => (s.match(/id="([^"]+)"/g) || []);
  const x1 = PAa.prop('stall', { kind: 'leaf' }), x2 = PAa.prop('stall', { kind: 'leaf' });
  ok(ids(x1).length > 0 && ids(x1).every((i) => !ids(x2).includes(i)), 'two calls get different SVG ids');
  // the props stay a sensible size for the page
  PROPS.forEach(([n, o]) => ok(PAa.prop(n, o).length < 400000, `prop("${n}", ${JSON.stringify(o)}) is under 400 KB`));
}

sec('existing names are byte-identical to v25-base (except the six house item icons)');
{
  let OLD = null;
  for (const ref of ['v25-base', 'origin/v25-base', 'f3aab27']) {
    try { OLD = execFileSync('git', ['-C', ROOT, 'show', ref + ':world/pawart_world_b.js'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); break; } catch (e) { /* try the next ref */ }
  }
  ok(!!OLD, 'git show v25-base:world/pawart_world_b.js works');
  if (OLD) {
    const P0 = load([SRC_A, OLD]), P1 = load([SRC_A, SRC_B]);
    const W = P0.WORLD_B;
    const calls = [];
    W.icons.forEach((n) => calls.push(['icon', n]));
    W.items.forEach((n) => calls.push(['item', n]));
    W.houses.forEach((n) => calls.push(['house', n]));
    W.collectibles.forEach((n) => calls.push(['collectible', n]));
    W.beds.forEach((n) => calls.push(['bed', n]));
    W.obstacles.forEach((n) => calls.push(['obstacle', n]));
    W.props.forEach((n) => calls.push(['prop', n, {}]));
    W.bowlFoods.forEach((f) => calls.push(['prop', 'bowl', { food: f }]));
    ['carrot', 'peas', 'spinach', 'blueberries', 'sweet-potato', 'pumpkin'].forEach((c) => [0, 1, 2, 3].forEach((s) => calls.push(['prop', 'crop', { crop: c, stage: s, dry: s === 1 }])));
    [0, 1, 2, 3].forEach((w) => calls.push(['prop', 'plot', { water: w }]));
    [['park'], ['park', 'river', 'woods', 'beach']].forEach((p) => calls.push(['prop', 'torn-map', { pieces: p }]));
    [0, 8, 24].forEach((f) => calls.push(['prop', 'sparklejar', { fill: f }]));
    calls.push(['prop', 'album', { found: [true, false, true] }], ['prop', 'mailbox', { flag: true, count: 3 }], ['prop', 'coatframe', { found: false }], ['prop', 'poop', { fresh: true }]);
    ['sit', 'paw', 'spin'].forEach((t) => calls.push(['prop', 'hand-signal', { trick: t }]));
    ['point', 'wave', 'sit', 'cheer'].forEach((p) => calls.push(['prop', 'gerald', { pose: p }]));
    [0, 3, 7].forEach((s) => calls.push(['prop', 'stampcard', { stamps: s }]));
    calls.push(['prop', 'missioncard', { items: [{ text: 'Feed Biscuit a snack', done: true, p: 1, n: 1 }], stamps: 2, day: 'Tuesday' }]);
    calls.push(['item', 'No Such Thing'], ['prop', 'no-such-prop', {}], ['house', 'No Such House']);
    let same = 0; const diff = [], allowed = [];
    calls.forEach(([k, n, o]) => {
      if (typeof P0[k] !== 'function') return;
      const a = P0[k](n, o), b = P1[k](n, o);
      if (a === b) same++;
      else if (k === 'item' && HOUSE_ICONS.includes(n)) allowed.push(n);
      else diff.push(k + ':' + n + (o && Object.keys(o).length ? ' ' + JSON.stringify(o) : ''));
    });
    ok(diff.length === 0, `every existing name is byte-identical (${same} of ${calls.length} same; differ: ${diff.slice(0, 8).join(', ')})`);
    ok(allowed.length === HOUSE_ICONS.length, `the six house item icons are redrawn (${allowed.join(', ')})`);
    ok(same > 300, `a broad sample was compared (${same} calls)`);
    ['icons', 'items', 'houses', 'collectibles', 'beds', 'obstacles', 'props', 'bowlFoods'].forEach((k) => {
      const o = W[k], n = P1.WORLD_B[k];
      ok(o.every((x, i) => n[i] === x), `WORLD_B.${k} keeps every old name in the old order`);
    });
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); }
console.log('ALL OK');
