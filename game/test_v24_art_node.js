// v2.4 WORLD ART test (plain node). Run: node game/test_v24_art_node.js   (exits 1 on any failure)
// Covers V24.md sections 3, 7 and 9: every new PawArt name draws (no "?" placeholder, the stated viewBox, no <script),
// the module still works next to world/pawart_world_a.js, and every name that existed before v2.4 is byte-identical
// to the integration/v2.4 base (git show), called in the same order in two fresh contexts.
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
const isPlaceholder = (svg) => />\?<\/text>/.test(svg) || /aria-label="[^"]*\?/.test(svg) && />\?</.test(svg);

const HOUSES = ['Little Tea House', 'Beach Hut', 'Camper Van', 'Pumpkin Cottage', 'Lighthouse Kennel', 'Rocket Ship'];
const CLOTHES = ['Happi Coat', 'Sailor Collar', 'Chef Hat', 'Wizard Hat', 'Bumblebee Suit', 'Cozy Hoodie', 'Knit Scarf', 'Sun Hat', 'Cowboy Hat', 'Tutu', 'Astronaut Helmet', 'Pyjamas'];
const TOYS = ['Snuffle Mat', 'Treat Cone', 'Squeaky Hedgehog', 'Bubble Machine', 'Paddling Pool', 'Agility Tunnel'];
const FOODS = ['Carrot Sticks', 'Apple Slices', 'Blueberry Bites', 'Seedless Watermelon Cubes', 'Sweet Potato Chews', 'Pumpkin Purée', 'Turkey Meatballs', 'Frozen Pupsicle'];
const ITEMS = [...CLOTHES, ...TOYS, ...FOODS, ...HOUSES];
const ICONS = ['missions', 'guide', 'stamp'];
const MC = { items: [{ text: 'Feed Biscuit a snack', done: true, p: 1, n: 1 }, { text: 'Walk at Sunny Park', done: false, p: 0, n: 1 }, { text: 'Pet Biscuit 3 times', done: false, p: 1, n: 3 }], stamps: 2, day: 'Tuesday 6 October' };

function checkNew(PA, tag) {
  const good = (svg, vb, what) => {
    ok(typeof svg === 'string' && svg.startsWith('<svg'), `${tag}: ${what} returns an SVG`);
    ok(vbOf(svg) === vb, `${tag}: ${what} viewBox is ${vb} (got ${vbOf(svg)})`);
    ok(!isPlaceholder(svg), `${tag}: ${what} is not the "?" placeholder`);
    ok(!/<script/i.test(svg) && !/\son[a-z]+=/i.test(svg), `${tag}: ${what} has no script or event handler`);
    ok(svg.length > 600, `${tag}: ${what} has real content (${svg.length} chars)`);
  };
  ok(ITEMS.length === 32, `${tag}: 32 item names under test`);
  ITEMS.forEach((n) => good(PA.item(n), '0 0 64 64', `item("${n}")`));
  HOUSES.forEach((n) => good(PA.house(n), '0 0 240 200', `house("${n}")`));
  ICONS.forEach((n) => good(PA.icon(n), '0 0 64 64', `icon("${n}")`));
  good(PA.prop('missioncard', MC), '0 0 200 260', 'prop("missioncard")');
  good(PA.prop('missioncard'), '0 0 200 260', 'prop("missioncard") with no options');
  for (let s = 0; s <= 7; s++) good(PA.prop('stampcard', { stamps: s }), '0 0 240 140', `prop("stampcard", {stamps:${s}})`);
  ['point', 'wave', 'sit', 'cheer'].forEach((p) => good(PA.prop('gerald', { pose: p }), '0 0 160 160', `prop("gerald", {pose:"${p}"})`));
  ok(PA.prop('gerald', { pose: 'moonwalk' }) && /data-pose="point"/.test(PA.prop('gerald', { pose: 'moonwalk' })), `${tag}: an unknown Gerald pose falls back to point`);
  // registered in the module's lists
  const WB = PA.WORLD_B;
  ok(ITEMS.every((n) => WB.items.includes(n)), `${tag}: WORLD_B.items lists every new item`);
  ok(HOUSES.every((n) => WB.houses.includes(n)), `${tag}: WORLD_B.houses lists every new house`);
  ok(ICONS.every((n) => WB.icons.includes(n)), `${tag}: WORLD_B.icons lists the new icons`);
  ok(['missioncard', 'stampcard', 'gerald'].every((n) => WB.props.includes(n)), `${tag}: WORLD_B.props lists the new props`);
  // unknown names still give the placeholder
  ok(isPlaceholder(PA.item('No Such Thing')), `${tag}: an unknown item is still the "?" placeholder`);
  ok(isPlaceholder(PA.house('No Such House')), `${tag}: an unknown house is still the "?" placeholder`);
  ok(isPlaceholder(PA.icon('nosuchicon')), `${tag}: an unknown icon is still the "?" placeholder`);
}

sec('new names, module alone');
const PA1 = load([SRC_B]);
checkNew(PA1, 'alone');

sec('new names, loaded after pawart_world_a.js (build order)');
const PA2 = load([SRC_A, SRC_B]);
checkNew(PA2, 'with world_a');
ok(typeof PA2.scene === 'function' && typeof PA2.item === 'function', 'with world_a: both modules share window.PawArt');

sec('deterministic and cached per name');
{
  const norm = (s) => s.replace(/pwb[0-9a-z]+/g, 'ID');
  const PAa = load([SRC_B]), PAb = load([SRC_B]);
  [...ITEMS.map((n) => ['item', n]), ...HOUSES.map((n) => ['house', n]), ...ICONS.map((n) => ['icon', n])].forEach(([k, n]) => {
    const a = PAa[k](n), a2 = PAa[k](n), b = PAb[k](n);
    ok(norm(a) === norm(a2), `${k}("${n}") is the same drawing on the second call`);
    ok(norm(a) === norm(b), `${k}("${n}") is the same drawing in a fresh context`);
  });
  ok(norm(PAa.prop('missioncard', MC)) === norm(PAb.prop('missioncard', MC)), 'missioncard is deterministic');
  ok(norm(PAa.prop('gerald', { pose: 'wave' })) === norm(PAb.prop('gerald', { pose: 'wave' })), 'gerald is deterministic');
  // every call gets fresh ids (so two copies on one page never clash)
  const ids = (s) => (s.match(/id="([^"]+)"/g) || []);
  const x1 = PAa.item('Happi Coat'), x2 = PAa.item('Happi Coat');
  ok(ids(x1).length > 0 && ids(x1).every((i) => !ids(x2).includes(i)), 'two calls get different SVG ids');
  // distinct poses and stamp counts really differ
  const poses = ['point', 'wave', 'sit', 'cheer'].map((p) => norm(PAa.prop('gerald', { pose: p })));
  ok(new Set(poses).size === 4, 'the four Gerald poses are four different drawings');
  const cards = [0, 1, 2, 3, 4, 5, 6, 7].map((s) => norm(PAa.prop('stampcard', { stamps: s })));
  ok(new Set(cards).size === 8, 'stampcard 0..7 are eight different drawings');
  ok(norm(PAa.prop('stampcard', { stamps: 99 })) === cards[7] && norm(PAa.prop('stampcard', { stamps: -3 })) === cards[0], 'stampcard clamps to 0..7');
  ok(new Set(ITEMS.map((n) => norm(PAa.item(n)))).size === ITEMS.length, 'all 32 items are different drawings');
}

sec('missions card content');
{
  const PA = load([SRC_B]);
  const svg = PA.prop('missioncard', MC);
  ok(svg.includes('Feed Biscuit a') && svg.includes('Walk at Sunny') && svg.includes('Pet Biscuit 3'), 'the three mission lines are on the card');
  ok(svg.includes('Tuesday 6 October'), 'the day is on the card');
  ok(svg.includes('>1/3<'), 'the badge says 1/3 with one mission done');
  ok(svg.includes('>1/3</text>') && /stroke="#7FB86A" stroke-width="4.4"/.test(svg), 'a done mission gets a crayon tick');
  const all = PA.prop('missioncard', { items: MC.items.map((i) => Object.assign({}, i, { done: true })), stamps: 3, day: 'x' });
  ok(all.includes('>3/3<') && (all.match(/stroke="#7FB86A" stroke-width="4.4"/g) || []).length === 3, 'all three done: three ticks and 3/3');
  const esc = PA.prop('missioncard', { items: [{ text: 'Tom &amp; Jerry', done: false, p: 0, n: 1 }], day: '<b>' });
  ok(esc.includes('Tom &amp; Jerry') && !esc.includes('<b>'), 'item text is used as given (escaped by the caller), the day is escaped');
  // long texts wrap inside the paper: every row line starts at x 60 and stays left of the p/n column (about 5.7 units a character at 16 px)
  const longs = PA.prop('missioncard', { items: [{ text: 'Try a new snack from Kibble Corner', done: true, p: 1, n: 2 }, { text: 'Clean up after Mochi', p: 1, n: 2 }, { text: 'Visit the Seashell Beach and find a treasure there', p: 0, n: 3 }] });
  const rows = [...longs.matchAll(/<text x="60" y="[^"]+" text-anchor="start"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)];
  ok(rows.length >= 6 && rows.every((m) => 60 + m[2].length * 5.7 * (+m[1]) / 16 <= 148), 'long mission texts wrap inside the paper (' + rows.map((m) => m[2]).join(' | ') + ')');
  ok(/<text x="172"[^>]*text-anchor="end"[^>]*>1\/2</.test(longs), 'the p/n progress sits right-aligned at the end of its row');
  // the clipboard itself is the same drawing whatever the text
  const head = (s) => s.replace(/pwb[0-9a-z]+/g, 'ID').split('stroke="#BFE6FA"')[0];
  ok(head(PA.prop('missioncard', MC)) === head(PA.prop('missioncard', { items: [{ text: 'Something else', done: true, p: 2, n: 2 }], stamps: 6, day: 'Fri' })), 'the clipboard drawing does not change with the text');
}

sec('existing names are byte-identical to integration/v2.4');
{
  let OLD = null;
  for (const ref of ['integration/v2.4', 'origin/integration/v2.4']) {
    try { OLD = execFileSync('git', ['-C', ROOT, 'show', ref + ':world/pawart_world_b.js'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); break; } catch (e) { /* try the next ref */ }
  }
  ok(!!OLD, 'git show integration/v2.4:world/pawart_world_b.js works');
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
    calls.push(['item', 'No Such Thing'], ['prop', 'no-such-prop', {}], ['house', 'No Such House']);
    let same = 0; const diff = [];
    calls.forEach(([k, n, o]) => {
      if (typeof P0[k] !== 'function') return;
      const a = P0[k](n, o), b = P1[k](n, o);
      if (a === b) same++; else diff.push(k + ':' + n + (o && Object.keys(o).length ? ' ' + JSON.stringify(o) : ''));
    });
    ok(diff.length === 0, `every existing name is byte-identical (${same} of ${calls.length} same; differ: ${diff.slice(0, 8).join(', ')})`);
    ok(same > 300, `a broad sample was compared (${same} calls)`);
    // the lists only grew
    ['icons', 'items', 'houses', 'collectibles', 'beds', 'obstacles', 'props', 'bowlFoods'].forEach((k) => {
      const o = W[k], n = P1.WORLD_B[k];
      ok(o.every((x, i) => n[i] === x), `WORLD_B.${k} keeps every old name in the old order`);
    });
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); }
console.log('ALL OK');
