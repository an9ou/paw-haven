// v2.6 HW ART test (plain node), V26.md sections 2 and 3. Run: node game/test_v26_art_node.js (or node game/run_tests.js v26_art)
// Every new PawArt name draws a valid SVG (the stated viewBox, no "?" placeholder, no NaN or undefined, no script, no filter),
// options are normalised and cached, the module still works next to world/pawart_world_a.js, and every name that existed at
// v26-base (= v2.5 e622d9a) is byte-identical to it (git show), called in the same order in two fresh contexts.
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

// the 16 pop-up items (V26.md section 1). The treat V26.md calls "Pumpkin Pupcake" is drawn as 'Pumpkin Patch Pupcake':
// 'Pumpkin Pupcake' is the v1.3 kitchen dish and stays byte-identical.
const FOODS = ['Pumpkin Patch Pupcake', 'Apple Monster Biscuits', 'Sweet Potato Bones', 'Frozen Yoghurt Ghosts'];
const TOYS = ['Squeaky Pumpkin', 'Plush Ghost', 'Bat-Wing Flyer', 'Trick-or-Treat Bucket'];
const CLOTHES = ['Witch Hat', 'Vampire Cape', 'Candy Corn Bandana', 'Bat Wings'];
const DECOR = ['Jack-o-Lantern Trio', 'Paper Bat Bunting', 'Friendly Scarecrow', 'Ghost Garland'];
const ITEMS = [...FOODS, ...TOYS, ...CLOTHES, ...DECOR];
const PROPS = [
  ['popup', { lit: false }, '0 0 240 220'], ['popup', { lit: true }, '0 0 240 220'], ['popup', undefined, '0 0 240 220'],
  ['hwlanterns', { lit: false }, '0 0 200 120'], ['hwlanterns', { lit: true }, '0 0 200 120'], ['hwlanterns', undefined, '0 0 200 120'],
  ['hwbunting', undefined, '0 0 300 80'], ['hwscarecrow', undefined, '0 0 140 200'], ['hwgarland', undefined, '0 0 300 90'],
];
const NEW_PROPS = ['popup', 'hwlanterns', 'hwbunting', 'hwscarecrow', 'hwgarland'];

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
  ITEMS.forEach((n) => good(PA.item(n), '0 0 64 64', `item("${n}")`));
  good(PA.icon('popup'), '0 0 64 64', 'icon("popup")');
  PROPS.forEach(([n, o, vb]) => good(PA.prop(n, o), vb, `prop("${n}", ${JSON.stringify(o)})`));
  FOODS.forEach((f) => good(PA.prop('bowl', { food: f }), '0 0 120 120', `prop("bowl", {food:"${f}"})`));
  const WB = PA.WORLD_B;
  ok(FOODS.every((f) => WB.bowlFoods.includes(f)), `${tag}: WORLD_B.bowlFoods lists the 4 new bowl foods`);
  const empty = norm(PA.prop('bowl', {}));
  ok(FOODS.every((f) => norm(PA.prop('bowl', { food: f })) !== empty && PA.prop('bowl', { food: f }).length > PA.prop('bowl', {}).length * 1.3), `${tag}: every new bowl food draws food in the bowl`);
  ok(ITEMS.every((n) => WB.items.includes(n)), `${tag}: WORLD_B.items lists every new item`);
  ok(WB.icons.includes('popup'), `${tag}: WORLD_B.icons lists popup`);
  ok(NEW_PROPS.every((n) => WB.props.includes(n)), `${tag}: WORLD_B.props lists the new props`);
  ok(isPlaceholder(PA.item('No Such Thing')) && isPlaceholder(PA.icon('nosuchicon')) && isPlaceholder(PA.prop('no-such-prop', {})), `${tag}: unknown names are still the "?" placeholder`);
}

sec('new names, module alone');
checkNew(load([SRC_B]), 'alone');

sec('new names, loaded after pawart_world_a.js (build order)');
checkNew(load([SRC_A, SRC_B]), 'with world_a');

sec('deterministic, cached per option, options normalised, distinct');
{
  const PAa = load([SRC_B]), PAb = load([SRC_B]);
  ITEMS.forEach((n) => ok(norm(PAa.item(n)) === norm(PAa.item(n)) && norm(PAa.item(n)) === norm(PAb.item(n)), `item("${n}") is the same drawing on a second call and in a fresh context`));
  ok(norm(PAa.icon('popup')) === norm(PAb.icon('popup')), 'icon("popup") is deterministic');
  PROPS.forEach(([n, o]) => ok(norm(PAa.prop(n, o)) === norm(PAb.prop(n, o)) && norm(PAa.prop(n, o)) === norm(PAa.prop(n, o)), `prop("${n}", ${JSON.stringify(o)}) is deterministic`));
  FOODS.forEach((f) => ok(norm(PAa.prop('bowl', { food: f })) === norm(PAb.prop('bowl', { food: f })), `bowl "${f}" is deterministic`));
  ok(new Set(ITEMS.map((n) => norm(PAa.item(n)))).size === ITEMS.length, 'the 16 item drawings all differ');
  ok(new Set(FOODS.map((f) => norm(PAa.prop('bowl', { food: f })))).size === FOODS.length, 'the 4 new bowls all differ');
  ok(norm(PAa.item('Pumpkin Patch Pupcake')) !== norm(PAa.item('Pumpkin Pupcake')), 'the 2026 pupcake is not the kitchen Pumpkin Pupcake');
  const P = (n, o) => norm(PAa.prop(n, o));
  ['popup', 'hwlanterns'].forEach((n) => {
    ok(P(n, { lit: true }) !== P(n, { lit: false }) && P(n) === P(n, { lit: false }) && P(n, { lit: 'yes' }) === P(n, { lit: true }), `${n}: lit and unlit differ, default unlit, lit is a boolean`);
    ok(/pa-wb-glow/.test(PAa.prop(n, { lit: true })) && !/pa-wb-glow/.test(PAa.prop(n)), `${n}: only the lit one glows`);
    ok(/data-lit="1"/.test(PAa.prop(n, { lit: true })) && /data-lit="0"/.test(PAa.prop(n)), `${n}: carries data-lit`);
  });
  ['hwbunting', 'hwscarecrow', 'hwgarland'].forEach((n) => ok(P(n) === P(n, { anything: 1 }), `${n} ignores options`));
  const pop = PAa.prop('popup');
  ok(pop.includes('Pumpkin Patch') && pop.includes('Pop-up') && pop.includes('2026'), 'the pop-up has its chalk sign and the 2026 pennant');
  ok(!pop.includes('Harvest Stall') && !pop.includes('Baker Bea'), 'the pop-up is not signed as the Harvest Stall');
  ok(P('popup') !== P('stall', { kind: 'halloween' }), 'the pop-up is a different drawing from the Halloween stall');
  ok(/aria-label="Pumpkin Patch Pop-up"/.test(pop), 'the pop-up has its aria label');
  const ids = (s) => (s.match(/id="([^"]+)"/g) || []);
  const x1 = PAa.prop('popup'), x2 = PAa.prop('popup');
  ok(ids(x1).length > 0 && ids(x1).every((i) => !ids(x2).includes(i)), 'two calls get different SVG ids');
  PROPS.forEach(([n, o]) => ok(PAa.prop(n, o).length < 400000, `prop("${n}", ${JSON.stringify(o)}) is under 400 KB`));
  ITEMS.forEach((n) => ok(PAa.item(n).length < 120000, `item("${n}") is under 120 KB`));
}

sec('existing names are byte-identical to v26-base');
{
  let OLD = null;
  for (const ref of ['v26-base', 'origin/v26-base', 'e622d9a']) {
    try { OLD = execFileSync('git', ['-C', ROOT, 'show', ref + ':world/pawart_world_b.js'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); break; } catch (e) { /* try the next ref */ }
  }
  ok(!!OLD, 'git show v26-base:world/pawart_world_b.js works');
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
    // v2.5 props with their options
    [[{ state: 'full', seed: 0 }], [{ state: 'scattered', seed: 7 }], [{ seed: 40 }]].forEach(([o]) => calls.push(['prop', 'leafpile', o]));
    ['leaf', 'halloween'].forEach((k) => calls.push(['prop', 'stall', { kind: k }]));
    calls.push(['prop', 'jackolantern', { lit: true }], ['prop', 'paradebanner', {}], ['prop', 'leafdrift', {}]);
    ['spring', 'summer', 'autumn', 'winter'].forEach((s) => calls.push(['icon', 'season-' + s]));
    calls.push(['item', 'No Such Thing'], ['prop', 'no-such-prop', {}], ['house', 'No Such House'], ['icon', 'nosuchicon']);
    let same = 0; const diff = [];
    calls.forEach(([k, n, o]) => {
      if (typeof P0[k] !== 'function') return;
      const a = P0[k](n, o), b = P1[k](n, o);
      if (a === b) same++; else diff.push(k + ':' + n + (o && Object.keys(o).length ? ' ' + JSON.stringify(o) : ''));
    });
    ok(diff.length === 0, `every existing name is byte-identical (${same} of ${calls.length} same; differ: ${diff.slice(0, 8).join(', ')})`);
    ok(same > 400, `a broad sample was compared (${same} calls)`);
    ['icons', 'items', 'houses', 'collectibles', 'beds', 'obstacles', 'props', 'bowlFoods'].forEach((k) => {
      const o = W[k], n = P1.WORLD_B[k];
      ok(o.every((x, i) => n[i] === x), `WORLD_B.${k} keeps every old name in the old order`);
    });
    ok(!W.items.some((n) => ITEMS.includes(n)), 'none of the new item names existed at v26-base');
    ok(!W.props.some((n) => NEW_PROPS.includes(n)) && !W.icons.includes('popup'), 'none of the new prop or icon names existed at v26-base');
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); }
console.log('ALL OK');
