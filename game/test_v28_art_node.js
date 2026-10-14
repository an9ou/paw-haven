// v2.8 WINTER ART test (plain node), V28.md sections 3, 4 and 12.3. Run: node game/test_v28_art_node.js (or node game/run_tests.js v28_art)
// Every new PawArt name draws a valid SVG (the stated viewBox for every option set, no "?" placeholder, no NaN or undefined, no script,
// no filter): the snowdrift, the snowdog for every stage x ears x nose, the stall's winter and newyear kinds, the sweater banner, the
// fortune box for 0, 5 and 12 knots, the four decorations, the nengajo, the 13 cards, the 4 bowls and the 6 icons. Deterministic;
// night:true differs from day (washed, ink kept, lit parts in a glow group); snow is never pure white. Every name that existed at
// v28-base (= the v2.7 release) is byte-identical to it (git show), including the stall's leaf and halloween kinds, called in the same
// order in two fresh contexts.
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
const INK = '#5B3D32';

// V28.md section 3 and 12.3: the props, their viewBoxes and option sets
const VB = { snowdrift: [160, 100], snowdog: [140, 140], sweaterbanner: [400, 90], fortunebox: [160, 200], wnsnowflakes: [300, 80], wnwreath: [120, 120],
  wnsled: [200, 120], nykadomatsu: [160, 200], nengajo: [200, 140] };
const NEW_PROPS = Object.keys(VB);
const ITEM_NAMES = ['Warm Carob Cup', 'Snowflake Oat Cookies', 'Snow Day Stew', 'Pup Kinton', 'Very Ugly Sweater', 'Reindeer Antlers', 'Snowflake Snood',
  'Ugly Sweater Rosette', 'Year of the Sheep Hood', 'Paper Snowflake Garland', 'Felt Holly Wreath', 'Red Wooden Sled', 'Kadomatsu Pair'];
const FOODS = ITEM_NAMES.slice(0, 4);
const ICON_NAMES = ['snowdrift', 'snowdog', 'sweater', 'fortune', 'wstall', 'fuji'];
function optSets(n) {
  const sets = [undefined, {}, { junk: 1 }, { night: true }, { night: false }];
  if (n === 'snowdrift') ['full', 'scattered'].forEach((s) => [0, 7, 63].forEach((seed) => sets.push({ state: s, seed }, { state: s, seed, night: true })));
  if (n === 'snowdog') [0, 1, 2, 3].forEach((stage) => ['prick', 'flop'].forEach((ears) => [true, false].forEach((nose) => {
    sets.push({ stage, ears, nose }, { stage, ears, nose, scarf: '#C99A72' }, { stage, ears, nose, scarf: '#FFF8EE', night: true });
  })));
  if (n === 'fortunebox') [0, 5, 12].forEach((knots) => sets.push({ knots }, { knots, night: true }));
  if (n === 'nengajo') sets.push({ animal: 'sheep' }, { animal: 'pine' }, { animal: 'monkey' });
  return sets;
}
const STALL_SETS = [{ kind: 'winter' }, { kind: 'newyear' }, { kind: 'winter', night: true }, { kind: 'newyear', night: true }];

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
  STALL_SETS.forEach((o) => good(PA.prop('stall', o), '0 0 240 220', `prop("stall", ${JSON.stringify(o)})`));
  ITEM_NAMES.forEach((n) => good(PA.item(n), '0 0 64 64', `item("${n}")`));
  ICON_NAMES.forEach((n) => good(PA.icon(n), '0 0 64 64', `icon("${n}")`));
  FOODS.forEach((f) => good(PA.prop('bowl', { food: f }), '0 0 120 120', `bowl("${f}")`));
  // data hooks the game reads
  ok(/data-kind="winter"/.test(PA.prop('stall', { kind: 'winter' })) && /data-kind="newyear"/.test(PA.prop('stall', { kind: 'newyear' })), `${tag}: the stall carries data-kind`);
  ok(/data-state="scattered"/.test(PA.prop('snowdrift', { state: 'scattered' })) && /data-state="full"/.test(PA.prop('snowdrift')), `${tag}: the snowdrift carries data-state`);
  ok([0, 1, 2, 3].every((s) => new RegExp(`data-stage="${s}"`).test(PA.prop('snowdog', { stage: s }))), `${tag}: the snowdog carries data-stage`);
  ok(/data-knots="12"/.test(PA.prop('fortunebox', { knots: 12 })), `${tag}: the fortune box carries data-knots`);
  ok(/Winter Stall/.test(PA.prop('stall', { kind: 'winter' })) && /Ugly Sweater Contest/.test(PA.prop('sweaterbanner')) && /Happy New Year/.test(PA.prop('nengajo')), `${tag}: the signs say what V28 says`);
  ok(/Fortunes/.test(PA.prop('fortunebox')), `${tag}: the fortune box has its plank`);
  const all = [...NEW_PROPS.map((n) => PA.prop(n)), ...STALL_SETS.map((o) => PA.prop('stall', o)), ...ITEM_NAMES.map((n) => PA.item(n)), ...ICON_NAMES.map((n) => PA.icon(n))].join('');
  ok(!/Paw Haven/i.test(all), `${tag}: no art says Paw Haven`);
  const WB = PA.WORLD_B;
  ok(NEW_PROPS.every((n) => WB.props.includes(n)), `${tag}: WORLD_B.props lists the 9 new props`);
  ok(ITEM_NAMES.every((n) => WB.items.includes(n)), `${tag}: WORLD_B.items lists the 13 new cards`);
  ok(ICON_NAMES.every((n) => WB.icons.includes(n)), `${tag}: WORLD_B.icons lists the 6 new icons`);
  ok(FOODS.every((n) => WB.bowlFoods.includes(n)), `${tag}: WORLD_B.bowlFoods lists the 4 winter foods`);
  ok(!!WB.winter && WB.winter.items.length === 13 && WB.winter.icons.length === 6 && WB.winter.props.length === 9, `${tag}: WORLD_B.winter lists the v2.8 names`);
  ok(isPlaceholder(PA.item('No Such Thing')) && isPlaceholder(PA.icon('nosuchicon')) && isPlaceholder(PA.prop('no-such-prop', {})), `${tag}: unknown names are still the "?" placeholder`);
}

sec('new names, module alone');
checkNew(load([SRC_B]), 'alone');

sec('new names, loaded after pawart_world_a.js (build order)');
checkNew(load([SRC_A, SRC_B]), 'with world_a');

sec('deterministic, cached per option, options normalised, night, snow colours');
{
  const PAa = load([SRC_B]), PAb = load([SRC_B]);
  const P = (n, o) => norm(PAa.prop(n, o));
  NEW_PROPS.forEach((n) => optSets(n).forEach((o) => ok(P(n, o) === P(n, o) && P(n, o) === norm(PAb.prop(n, o)), `prop("${n}", ${JSON.stringify(o)}) is deterministic`)));
  STALL_SETS.forEach((o) => ok(P('stall', o) === norm(PAb.prop('stall', o)), `stall ${JSON.stringify(o)} is deterministic`));
  ITEM_NAMES.forEach((n) => ok(norm(PAa.item(n)) === norm(PAb.item(n)), `item("${n}") is the same drawing in a fresh context`));
  ICON_NAMES.forEach((n) => ok(norm(PAa.icon(n)) === norm(PAb.icon(n)), `icon("${n}") is the same drawing in a fresh context`));
  ok(new Set(NEW_PROPS.map((n) => P(n))).size === NEW_PROPS.length, 'the 9 prop drawings all differ');
  ok(new Set(ITEM_NAMES.map((n) => norm(PAa.item(n)))).size === ITEM_NAMES.length, 'the 13 cards all differ');
  ok(new Set(ICON_NAMES.map((n) => norm(PAa.icon(n)))).size === ICON_NAMES.length, 'the 6 icons all differ');
  ok(new Set(FOODS.map((f) => norm(PAa.prop('bowl', { food: f })))).size === 4, 'the 4 bowls all differ');
  // night: differs from day, carries data-night, keeps the ink outlines, a night:false is the day drawing
  [...NEW_PROPS.map((n) => [n, {}]), ['stall', { kind: 'winter' }], ['stall', { kind: 'newyear' }], ['snowdog', { stage: 3 }], ['snowdrift', { state: 'scattered' }], ['fortunebox', { knots: 12 }]].forEach(([n, o]) => {
    const d = P(n, o), nt = P(n, Object.assign({ night: true }, o));
    ok(d !== nt, `${n} ${JSON.stringify(o)}: night differs from day`);
    ok(P(n, Object.assign({ night: false }, o)) === d && P(n, Object.assign({ night: 0 }, o)) === d, `${n} ${JSON.stringify(o)}: night defaults to day`);
    ok(/data-night="1"/.test(nt) && !/data-night/.test(d), `${n} ${JSON.stringify(o)}: only the night drawing carries data-night`);
    ok((nt.match(/#5B3D32/g) || []).length > 0 && (nt.match(/#5B3D32/g) || []).length >= (d.match(/#5B3D32/g) || []).length, `${n} ${JSON.stringify(o)}: the night wash keeps every ink outline`);
    ok(vbOf(nt) === vbOf(d), `${n} ${JSON.stringify(o)}: night keeps the viewBox`);
  });
  ok(/pa-wb-glow/.test(PAa.prop('stall', { kind: 'winter', night: true })) && !/pa-wb-glow/.test(PAa.prop('stall', { kind: 'winter' })), 'winter stall: the bulbs glow only at night');
  ok(/#FFE07A/i.test((PAa.prop('stall', { kind: 'winter', night: true }).match(/<g class="pa-wb-glow">[\s\S]*<\/g>/) || [''])[0]), 'winter stall: the lit bulbs keep their warm colour');
  // options normalised
  ok(P('snowdrift', { seed: 64 }) === P('snowdrift', { seed: 0 }) && P('snowdrift', { state: 'junk' }) === P('snowdrift'), 'snowdrift: seed wraps at 64, state defaults to full');
  ok(P('snowdrift', { state: 'scattered' }) !== P('snowdrift') && P('snowdrift', { seed: 1 }) !== P('snowdrift'), 'snowdrift: scattered and other seeds differ');
  ok(new Set([0, 1, 2, 3].map((s) => P('snowdog', { stage: s }))).size === 4, 'snowdog: the four stages differ');
  ok(P('snowdog', { stage: 9 }) === P('snowdog', { stage: 3 }) && P('snowdog', { stage: -2 }) === P('snowdog', { stage: 0 }), 'snowdog: stage is clamped to 0..3');
  ok(P('snowdog', { stage: 1, ears: 'flop', nose: false, scarf: '#123456' }) === P('snowdog', { stage: 1 }), 'snowdog: ears, scarf and nose only change stage 3');
  ok(P('snowdog', { stage: 3, ears: 'flop' }) !== P('snowdog', { stage: 3 }) && P('snowdog', { stage: 3, ears: 'junk' }) === P('snowdog', { stage: 3, ears: 'prick' }), 'snowdog: flop ears differ, ears default to prick');
  ok(P('snowdog', { stage: 3, nose: false }) !== P('snowdog', { stage: 3 }) && P('snowdog', { stage: 3, nose: 'yes' }) === P('snowdog', { stage: 3 }), 'snowdog: the eaten nose differs, the nose defaults to on');
  ok(P('snowdog', { stage: 3, scarf: '#5B3D32' }) !== P('snowdog', { stage: 3 }) && P('snowdog', { stage: 3, scarf: 'red' }) === P('snowdog', { stage: 3 }) && P('snowdog', { stage: 3, scarf: '#c99a72' }) === P('snowdog', { stage: 3, scarf: '#C99A72' }), 'snowdog: the scarf takes a #rrggbb colour');
  ok(/data-stage="3"/.test(PAa.prop('snowdog', { stage: 3 })) && /Snowdog/.test(PAa.prop('snowdog', { stage: 3 })), 'snowdog: labelled');
  ok(new Set([0, 5, 12].map((k) => P('fortunebox', { knots: k }))).size === 3 && P('fortunebox', { knots: 40 }) === P('fortunebox', { knots: 12 }) && P('fortunebox', { knots: -3 }) === P('fortunebox'), 'fortune box: knots differ and are clamped to 0..12');
  ok(P('nengajo', { animal: 'sheep' }) !== P('nengajo') && P('nengajo', { animal: 'monkey' }) === P('nengajo', { animal: 'pine' }), 'nengajo: the sheep stamp for sheep, a pine stamp otherwise');
  ['sweaterbanner', 'wnsnowflakes', 'wnwreath', 'wnsled', 'nykadomatsu'].forEach((n) => ok(P(n) === P(n, { lit: true, use: true, junk: 1, knots: 3, stage: 2 }), `${n} ignores other options`));
  ok(P('stall', { kind: 'winter' }) !== P('stall', { kind: 'newyear' }), 'stall: winter and newyear differ');
  // the fortune box is not a shrine
  ok(!/torii|shrine|bell/i.test(PAa.prop('fortunebox', { knots: 12 })), 'fortune box: no torii, shrine or bell');
  // snow is never pure white: the snow props use no #fff / #ffffff fill outside the hatch masks
  const noWhite = (svg) => !/fill="#(fff|ffffff)"/i.test(svg.replace(/<mask[\s\S]*?<\/mask>/g, ''));
  ['snowdrift', 'snowdog'].forEach((n) => optSets(n).forEach((o) => ok(noWhite(PAa.prop(n, o)), `${n} ${JSON.stringify(o)}: no pure white snow`)));
  // the carob cup is a mug with a C, not a bar
  ok(/>C<\/text>/.test(PAa.item('Warm Carob Cup')), 'Warm Carob Cup: the mug has its C');
  const ids = (s) => (s.match(/id="([^"]+)"/g) || []);
  const x1 = PAa.prop('snowdrift'), x2 = PAa.prop('snowdrift');
  ok(ids(x1).length > 0 && ids(x1).every((i) => !ids(x2).includes(i)), 'two calls get different SVG ids');
  [...NEW_PROPS.map((n) => [n, {}]), ['stall', { kind: 'winter', night: true }], ['stall', { kind: 'newyear' }], ['fortunebox', { knots: 12, night: true }]].forEach(([n, o]) => ok(PAa.prop(n, o).length < 420000, `prop("${n}", ${JSON.stringify(o)}) is under 420 KB`));
  ITEM_NAMES.forEach((n) => ok(PAa.item(n).length < 160000, `item("${n}") is under 160 KB`));
}

sec('existing names are byte-identical to v28-base');
{
  let OLD = null;
  for (const ref of ['v28-base', 'origin/v28-base', '985bf9b']) {
    try { OLD = execFileSync('git', ['-C', ROOT, 'show', ref + ':world/pawart_world_b.js'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); break; } catch (e) { /* try the next ref */ }
  }
  ok(!!OLD, 'git show v28-base:world/pawart_world_b.js works');
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
    W.props.forEach((n) => calls.push(['prop', n, { night: true }]));
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
    [[{ state: 'full', seed: 0 }], [{ state: 'scattered', seed: 7 }], [{ seed: 40 }], [{ seed: 3, night: true }]].forEach(([o]) => calls.push(['prop', 'leafpile', o]));
    // the stall's old kinds, with and without the new options, and anything that is not a v2.8 kind
    [{ kind: 'leaf' }, { kind: 'halloween' }, { kind: 'leaf', night: true }, { kind: 'halloween', night: true }, {}, { kind: 'junk' }, { kind: 'Winter' }].forEach((o) => calls.push(['prop', 'stall', o]));
    calls.push(['prop', 'jackolantern', { lit: true }], ['prop', 'paradebanner', {}], ['prop', 'leafdrift', {}]);
    ['popup', 'hwlanterns'].forEach((n) => calls.push(['prop', n, { lit: true }], ['prop', n, { lit: false }]));
    // v2.7 props with their options
    ['stringlights', 'moonlamp', 'windowseat'].forEach((n) => calls.push(['prop', n, { lit: true }]));
    ['playtower', 'tunnelsofa', 'ballpit', 'sofaramp', 'windowseat'].forEach((n) => calls.push(['prop', n, { use: true }]));
    ['spring', 'summer', 'autumn', 'winter'].forEach((s) => calls.push(['icon', 'season-' + s]));
    // the v2.8 names were unknown at v28-base: the old module draws them as placeholders, the new one must not touch any other name
    calls.push(['item', 'No Such Thing'], ['prop', 'no-such-prop', {}], ['house', 'No Such House'], ['icon', 'nosuchicon'], ['bed', 'No Such Bed']);
    let same = 0; const diff = [];
    calls.forEach(([k, n, o]) => {
      if (typeof P0[k] !== 'function') return;
      const a = P0[k](n, o), b = P1[k](n, o);
      if (a === b) same++; else diff.push(k + ':' + n + (o && Object.keys(o).length ? ' ' + JSON.stringify(o) : ''));
    });
    ok(diff.length === 0, `every existing name is byte-identical (${same} of ${calls.length} same; differ: ${diff.slice(0, 8).join(', ')})`);
    ok(same > 500, `a broad sample was compared (${same} calls)`);
    // the shared tint and the furniture spots are unchanged
    ['dawn', 'dusk', 'night'].forEach((t) => {
      const a = P0.prop('stall', { kind: 'halloween' }), b = P1.prop('stall', { kind: 'halloween' });
      ok(P0.tint(a, { time: t }) === P1.tint(b, { time: t }) && P0.tint(a, { time: t, lit: true, indoor: true }) === P1.tint(b, { time: t, lit: true, indoor: true }), `PA.tint(${t}) is unchanged`);
    });
    ok(JSON.stringify(P0.FURN_SPOTS) === JSON.stringify(P1.FURN_SPOTS), 'FURN_SPOTS is unchanged');
    ['icons', 'items', 'houses', 'collectibles', 'beds', 'obstacles', 'props', 'bowlFoods', 'furniture'].forEach((k) => {
      const o = W[k], n = P1.WORLD_B[k];
      ok(o.every((x, i) => n[i] === x), `WORLD_B.${k} keeps every old name in the old order`);
    });
    ok(!W.items.some((n) => ITEM_NAMES.includes(n)), 'none of the new card names existed at v28-base');
    ok(!W.props.some((n) => NEW_PROPS.includes(n)) && !ICON_NAMES.some((n) => W.icons.includes(n)) && !FOODS.some((f) => W.bowlFoods.includes(f)), 'none of the new prop, icon or bowl names existed at v28-base');
    // the new names drawn first in a context, the old ones after: still identical
    const P2 = load([SRC_A, SRC_B]), P3 = load([SRC_A, OLD]);
    NEW_PROPS.forEach((n) => P2.prop(n, { night: true })); STALL_SETS.forEach((o) => P2.prop('stall', o)); ITEM_NAMES.forEach((n) => P2.item(n)); ICON_NAMES.forEach((n) => P2.icon(n)); FOODS.forEach((f) => P2.prop('bowl', { food: f }));
    const again = ['Old Blanket', 'Cloud Bed', 'Knitted Nest'].every((n) => norm(P2.item(n)) === norm(P3.item(n)) && norm(P2.bed(n)) === norm(P3.bed(n)))
      && ['leaf', 'halloween'].every((k) => norm(P2.prop('stall', { kind: k })) === norm(P3.prop('stall', { kind: k })))
      && norm(P2.prop('leafpile', { seed: 5 })) === norm(P3.prop('leafpile', { seed: 5 })) && norm(P2.prop('stringlights', { lit: true })) === norm(P3.prop('stringlights', { lit: true }));
    ok(again, 'old renders are unchanged after the new names are drawn first');
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); }
console.log('ALL OK');
