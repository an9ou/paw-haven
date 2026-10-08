// v2.7 HOME ART test (plain node), V27.md sections 2 and 3. Run: node game/test_v27_art_node.js (or node game/run_tests.js v27_art)
// Every new PawArt name draws a valid SVG (the listed viewBox for every option set, no "?" placeholder, no NaN or undefined, no script,
// no filter), the furniture has exactly one <g class="pa-front"> (plain shapes only: the game's front copy hides masks and clip paths),
// PawArt.FURN_SPOTS covers every spot of V27.md section 1 inside the viewBox, the Knitted Nest is a real bed with its front lip, and
// every name that existed at v27-base (= v2.6 main 3619e7e) is byte-identical to it (git show), called in the same order in two fresh contexts.
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
// the inner markup of the first <g class="cls"> (nested groups counted)
function groupOf(svg, cls) {
  const i = svg.indexOf(`<g class="${cls}">`); if (i < 0) return null;
  const re = /<g\b[^>]*>|<\/g>/g; re.lastIndex = i; let depth = 0, m;
  while ((m = re.exec(svg))) { depth += m[0] === '</g>' ? -1 : 1; if (!depth) return svg.slice(i, m.index + 4); }
  return null;
}

// V27.md section 1: the props, their viewBoxes and options
const DECOR = { birdbath: [120, 160], flowerbarrel: [140, 120], stringlights: [300, 80], bench: [200, 120], hammock: [260, 140], windchime: [80, 160], sandbox: [200, 120], steppingstones: [240, 80],
  ragrug: [240, 80], toybasket: [120, 100], cushionpile: [180, 100], fern: [120, 160], cuckooclock: [100, 160], pawpictures: [200, 100], moonlamp: [100, 140], wallquilt: [180, 140] };
const FURN = { playtower: [200, 260], tunnelsofa: [300, 160], ballpit: [240, 140], sofaramp: [260, 160], windowseat: [220, 240] };
const LIT = ['stringlights', 'moonlamp', 'windowseat'];
const SPOTS = { playtower: ['top', 'cubby'], tunnelsofa: ['tunnel', 'seat'], ballpit: ['a', 'b'], sofaramp: ['top'], windowseat: ['seat'] };
const FRONT_SPOTS = { playtower: ['cubby'], tunnelsofa: ['tunnel'], ballpit: ['a', 'b'] };
const ITEM_NAMES = ['Bird Bath', 'Flower Barrel', 'String Lights', 'Garden Bench', 'Hammock', 'Wind Chime', 'Sandbox', 'Stepping Stones',
  'Braided Rag Rug', 'Toy Basket', 'Cushion Pile', 'Boston Fern', 'Cuckoo Clock', 'Paw Print Pictures', 'Moon Lamp', 'Patchwork Quilt',
  'Dog Play Tower', 'Tunnel Sofa', 'Ball Pit', 'Sofa Ramp', 'Window Seat', 'Knitted Nest'];
const NEW_PROPS = [...Object.keys(DECOR), ...Object.keys(FURN)];
const VB = Object.assign({}, DECOR, FURN);
// every option combination each prop takes (plus no options and junk)
function optSets(n) {
  const sets = [undefined, {}, { junk: 1 }];
  if (LIT.includes(n)) sets.push({ lit: true }, { lit: false });
  if (FURN[n]) { sets.push({ use: true }, { use: false }); if (LIT.includes(n)) sets.push({ use: true, lit: true }); }
  return sets;
}

function checkNew(PA, tag) {
  const good = (svg, vb, what) => {
    ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), `${tag}: ${what} returns an SVG`);
    ok(vbOf(svg) === vb, `${tag}: ${what} viewBox is ${vb} (got ${vbOf(svg)})`);
    ok(!isPlaceholder(svg), `${tag}: ${what} is not the "?" placeholder`);
    ok(!/NaN|undefined|Infinity/.test(svg), `${tag}: ${what} has no NaN, undefined or Infinity`);
    ok(!/<script/i.test(svg) && !/\son[a-z]+=/i.test(svg), `${tag}: ${what} has no script or event handler`);
    ok(!/<filter/i.test(svg), `${tag}: ${what} uses no filter`);
    ok((svg.match(/<svg/g) || []).length === 1, `${tag}: ${what} is one svg element`);
    ok(svg.length > 600, `${tag}: ${what} has real content (${svg.length} chars)`);
  };
  NEW_PROPS.forEach((n) => optSets(n).forEach((o) => good(PA.prop(n, o), '0 0 ' + VB[n].join(' '), `prop("${n}", ${JSON.stringify(o)})`)));
  ITEM_NAMES.forEach((n) => good(PA.item(n), '0 0 64 64', `item("${n}")`));
  ['furniture', 'arrange'].forEach((n) => good(PA.icon(n), '0 0 64 64', `icon("${n}")`));
  good(PA.bed('Knitted Nest'), '0 0 260 160', 'bed("Knitted Nest")');
  // furniture: exactly one front group, plain shapes only
  Object.keys(FURN).forEach((n) => [{}, { use: true }, { lit: true }].forEach((o) => {
    const svg = PA.prop(n, o), g = groupOf(svg, 'pa-front');
    ok((svg.match(/class="pa-front"/g) || []).length === 1 && g !== null, `${tag}: prop("${n}", ${JSON.stringify(o)}) has exactly one pa-front group`);
    ok(g !== null && !/clip-path|mask=/.test(g), `${tag}: ${n} front group uses no clip path or mask (the front copy hides them)`);
    ok(/data-use="[01]"/.test(svg), `${tag}: ${n} carries data-use`);
  }));
  Object.keys(FRONT_SPOTS).forEach((n) => ok((groupOf(PA.prop(n), 'pa-front') || '').length > 2000, `${tag}: ${n} front group holds real drawing (it covers a dog)`));
  ok(Object.keys(DECOR).every((n) => !/pa-front/.test(PA.prop(n))), `${tag}: decorations have no front group`);
  const nest = PA.bed('Knitted Nest'), lip = groupOf(nest, 'pa-bed-front');
  ok(!!lip && lip.length > 1500, `${tag}: the Knitted Nest has its pa-bed-front lip`);
  ok(!!lip && !/clip-path|mask=/.test(lip), `${tag}: the Knitted Nest lip uses no clip path or mask`);
  ok(/data-bed="Knitted Nest"/.test(nest), `${tag}: the Knitted Nest carries data-bed`);
  // FURN_SPOTS: every spot of section 1, numbers inside the viewBox
  const FS = PA.FURN_SPOTS;
  ok(!!FS && typeof FS === 'object', `${tag}: PawArt.FURN_SPOTS exists`);
  Object.keys(SPOTS).forEach((n) => SPOTS[n].forEach((s) => {
    const p = FS && FS[n] && FS[n][s], [vw, vh] = FURN[n];
    ok(!!p, `${tag}: FURN_SPOTS.${n}.${s} exists`);
    if (!p) return;
    ok(['x', 'y', 'w'].every((k) => typeof p[k] === 'number' && isFinite(p[k])), `${tag}: FURN_SPOTS.${n}.${s} has numeric x, y, w`);
    ok(p.x >= 0 && p.x <= vw && p.y >= 0 && p.y <= vh && p.w > 0 && p.w <= 2 * vw, `${tag}: FURN_SPOTS.${n}.${s} is inside the ${vw}x${vh} viewBox`);
    ok(typeof p.pose === 'string' && (p.face === 'left' || p.face === 'right'), `${tag}: FURN_SPOTS.${n}.${s} has a pose and a facing`);
    ok(!!p.front === (FRONT_SPOTS[n] || []).includes(s), `${tag}: FURN_SPOTS.${n}.${s} front is ${(FRONT_SPOTS[n] || []).includes(s)}`);
  }));
  const via = FS && FS.sofaramp && FS.sofaramp.top && FS.sofaramp.top.via;
  ok(!!via && via.x >= 0 && via.x <= 260 && via.y >= 0 && via.y <= 160, `${tag}: the Sofa Ramp top spot has its via inside the viewBox`);
  const WB = PA.WORLD_B;
  ok(NEW_PROPS.every((n) => WB.props.includes(n)), `${tag}: WORLD_B.props lists the 21 new props`);
  ok(ITEM_NAMES.every((n) => WB.items.includes(n)), `${tag}: WORLD_B.items lists the 22 new cards`);
  ok(WB.beds.includes('Knitted Nest'), `${tag}: WORLD_B.beds lists the Knitted Nest`);
  ok(['furniture', 'arrange'].every((n) => WB.icons.includes(n)), `${tag}: WORLD_B.icons lists furniture and arrange`);
  ok(isPlaceholder(PA.item('No Such Thing')) && isPlaceholder(PA.icon('nosuchicon')) && isPlaceholder(PA.prop('no-such-prop', {})), `${tag}: unknown names are still the "?" placeholder`);
}

sec('new names, module alone');
checkNew(load([SRC_B]), 'alone');

sec('new names, loaded after pawart_world_a.js (build order)');
checkNew(load([SRC_A, SRC_B]), 'with world_a');

sec('deterministic, cached per option, options normalised, distinct');
{
  const PAa = load([SRC_B]), PAb = load([SRC_B]);
  const P = (n, o) => norm(PAa.prop(n, o));
  NEW_PROPS.forEach((n) => optSets(n).forEach((o) => ok(P(n, o) === P(n, o) && P(n, o) === norm(PAb.prop(n, o)), `prop("${n}", ${JSON.stringify(o)}) is deterministic`)));
  ITEM_NAMES.forEach((n) => ok(norm(PAa.item(n)) === norm(PAb.item(n)), `item("${n}") is the same drawing in a fresh context`));
  ok(norm(PAa.bed('Knitted Nest')) === norm(PAb.bed('Knitted Nest')), 'the Knitted Nest is deterministic');
  ok(new Set(NEW_PROPS.map((n) => P(n))).size === NEW_PROPS.length, 'the 21 prop drawings all differ');
  ok(new Set(ITEM_NAMES.map((n) => norm(PAa.item(n)))).size === ITEM_NAMES.length, 'the 22 cards all differ');
  NEW_PROPS.filter((n) => !LIT.includes(n) && !FURN[n]).forEach((n) => ok(P(n) === P(n, { lit: true, use: true, junk: 1 }), `${n} ignores options`));
  LIT.forEach((n) => {
    ok(P(n, { lit: true }) !== P(n) && P(n) === P(n, { lit: false }) && P(n, { lit: 'yes' }) === P(n, { lit: true }), `${n}: lit and unlit differ, default unlit, lit is a boolean`);
    ok(/data-lit="1"/.test(PAa.prop(n, { lit: true })) && /data-lit="0"/.test(PAa.prop(n)), `${n} carries data-lit`);
  });
  ['stringlights', 'moonlamp'].forEach((n) => ok(/pa-wb-glow/.test(PAa.prop(n, { lit: true })) && !/pa-wb-glow/.test(PAa.prop(n)), `${n}: only the lit one glows`));
  Object.keys(FURN).forEach((n) => {
    ok(P(n, { use: true }) !== P(n) && P(n) === P(n, { use: false }) && P(n, { use: 1 }) === P(n, { use: true }), `${n}: in use differs, default not in use, use is a boolean`);
    ok(!LIT.includes(n) ? P(n) === P(n, { lit: true }) : true, `${n}: lit is ignored where it is not listed`);
    ok(/data-use="1"/.test(PAa.prop(n, { use: true })) && /data-use="0"/.test(PAa.prop(n)), `${n} carries data-use`);
  });
  const ids = (s) => (s.match(/id="([^"]+)"/g) || []);
  const x1 = PAa.prop('playtower'), x2 = PAa.prop('playtower');
  ok(ids(x1).length > 0 && ids(x1).every((i) => !ids(x2).includes(i)), 'two calls get different SVG ids');
  NEW_PROPS.forEach((n) => ok(PAa.prop(n).length < 400000, `prop("${n}") is under 400 KB`));
  ITEM_NAMES.forEach((n) => ok(PAa.item(n).length < 160000, `item("${n}") is under 160 KB`));
  ok(PAa.FURN_SPOTS === PAb.FURN_SPOTS ? true : JSON.stringify(PAa.FURN_SPOTS) === JSON.stringify(PAb.FURN_SPOTS), 'FURN_SPOTS is the same in every context');
}

sec('existing names are byte-identical to v27-base');
{
  let OLD = null;
  for (const ref of ['v27-base', 'origin/v27-base', '3619e7e']) {
    try { OLD = execFileSync('git', ['-C', ROOT, 'show', ref + ':world/pawart_world_b.js'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); break; } catch (e) { /* try the next ref */ }
  }
  ok(!!OLD, 'git show v27-base:world/pawart_world_b.js works');
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
    calls.push(['prop', 'bowl', {}], ['prop', 'bowl', { food: 'No Such Food' }]);
    ['carrot', 'peas', 'spinach', 'blueberries', 'sweet-potato', 'pumpkin'].forEach((c) => [0, 1, 2, 3].forEach((s) => calls.push(['prop', 'crop', { crop: c, stage: s, dry: s === 1 }])));
    [0, 1, 2, 3].forEach((w) => calls.push(['prop', 'plot', { water: w }]));
    [['park'], ['park', 'river', 'woods', 'beach']].forEach((p) => calls.push(['prop', 'torn-map', { pieces: p }]));
    [0, 8, 24].forEach((f) => calls.push(['prop', 'sparklejar', { fill: f }]));
    calls.push(['prop', 'album', { found: [true, false, true] }], ['prop', 'mailbox', { flag: true, count: 3 }], ['prop', 'coatframe', { found: false }], ['prop', 'poop', { fresh: true }]);
    ['sit', 'paw', 'spin'].forEach((t) => calls.push(['prop', 'hand-signal', { trick: t }]));
    ['point', 'wave', 'sit', 'cheer'].forEach((p) => calls.push(['prop', 'gerald', { pose: p }]));
    [0, 3, 7].forEach((s) => calls.push(['prop', 'stampcard', { stamps: s }]));
    calls.push(['prop', 'missioncard', { items: [{ text: 'Feed Biscuit a snack', done: true, p: 1, n: 1 }], stamps: 2, day: 'Tuesday' }]);
    [[{ state: 'full', seed: 0 }], [{ state: 'scattered', seed: 7 }], [{ seed: 40 }]].forEach(([o]) => calls.push(['prop', 'leafpile', o]));
    ['leaf', 'halloween'].forEach((k) => calls.push(['prop', 'stall', { kind: k }]));
    calls.push(['prop', 'jackolantern', { lit: true }], ['prop', 'paradebanner', {}], ['prop', 'leafdrift', {}]);
    // v2.6 props with their options
    ['popup', 'hwlanterns'].forEach((n) => calls.push(['prop', n, { lit: true }], ['prop', n, { lit: false }]));
    ['spring', 'summer', 'autumn', 'winter'].forEach((s) => calls.push(['icon', 'season-' + s]));
    // the v2.7 prop names were unknown at v27-base: the old module draws them as placeholders, the new one must not touch any other name
    calls.push(['item', 'No Such Thing'], ['prop', 'no-such-prop', {}], ['house', 'No Such House'], ['icon', 'nosuchicon'], ['bed', 'No Such Bed']);
    let same = 0; const diff = [];
    calls.forEach(([k, n, o]) => {
      if (typeof P0[k] !== 'function') return;
      const a = P0[k](n, o), b = P1[k](n, o);
      if (a === b) same++; else diff.push(k + ':' + n + (o && Object.keys(o).length ? ' ' + JSON.stringify(o) : ''));
    });
    ok(diff.length === 0, `every existing name is byte-identical (${same} of ${calls.length} same; differ: ${diff.slice(0, 8).join(', ')})`);
    ok(same > 500, `a broad sample was compared (${same} calls)`);
    ['icons', 'items', 'houses', 'collectibles', 'beds', 'obstacles', 'props', 'bowlFoods'].forEach((k) => {
      const o = W[k], n = P1.WORLD_B[k];
      ok(o.every((x, i) => n[i] === x), `WORLD_B.${k} keeps every old name in the old order`);
    });
    ok(!W.items.some((n) => ITEM_NAMES.includes(n)), 'none of the new card names existed at v27-base');
    ok(!W.props.some((n) => NEW_PROPS.includes(n)) && !W.icons.includes('furniture') && !W.icons.includes('arrange') && !W.beds.includes('Knitted Nest'), 'none of the new prop, icon or bed names existed at v27-base');
    // the new names are called after all the old ones in a context, and the old ones again after: still identical
    const P2 = load([SRC_A, SRC_B]), P3 = load([SRC_A, OLD]);
    NEW_PROPS.forEach((n) => P2.prop(n, {})); ITEM_NAMES.forEach((n) => P2.item(n)); P2.bed('Knitted Nest');
    NEW_PROPS.forEach((n) => P3.prop(n, {})); ITEM_NAMES.forEach((n) => P3.item(n)); P3.bed('Knitted Nest');
    const again = ['Old Blanket', 'Cloud Bed', 'Royal Canopy Bed'].every((n) => norm(P2.item(n)) === norm(P3.item(n)) && norm(P2.bed(n)) === norm(P3.bed(n)));
    ok(again, 'old bed renders and bed cards are unchanged after the new names are drawn first');
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); }
console.log('ALL OK');
