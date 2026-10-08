// v2.6 SCENE ART test (plain node). Run: node game/test_v26_scenes_node.js (or node game/run_tests.js v26_scenes). Exits 1 on any failure.
// Covers V26.md section 4: the Halloween dressing over the yard, the Square, Market Street and every walk strip.
// 1. Halloween off (missing or false) is byte-identical to v26-base (git show) for every scene x season x time x weather and every
//    walk strip, called in the same order in two fresh contexts.
// 2. Halloween on: the yard, the Square, Market Street and the strips render cleanly (no NaN, no filter, no animation), carry
//    data-halloween, differ from off, keep every hotspot where it was, glow only at dusk and night, and are the same drawing
//    in a fresh context (seeded). Every other scene is the off drawing plus the data-halloween attribute.
// 3. The runner (mods/walkrun.js) passes the flag to the strip art only when it is on.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FILES = ['world/pawart_world_a.js', 'world/pawart_world_c.js'];
const SRC = FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'));
function baseSrc(rel) {
  for (const ref of ['v26-base', 'origin/v26-base']) {
    try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { /* try the next ref */ }
  }
  return null;
}
const BASE = FILES.map(baseSrc);

let pass = 0, fail = 0;
const fails = [];
function ok(c, msg) { if (c) { pass++; } else { fail++; if (fails.length < 40) fails.push(msg); } }
function sec(t) { console.log('-- ' + t); }
function load(srcs) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx);
  srcs.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'art' + i + '.js' }));
  return ctx.window.PawArt;
}

const SCENES = ['yard', 'market', 'shelter', 'house', 'garden', 'kitchen', 'park', 'river', 'woods', 'beach', 'square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier'];
const DRESSED = ['yard', 'market', 'square'];
const STRIPS = ['park', 'river', 'woods', 'beach', 'town', 'hilltop', 'pier'];
const TIMES = ['dawn', 'day', 'dusk', 'night'], WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'], SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const EXTRA = [['scene', 'yard', { patch: 'empty' }], ['scene', 'yard', { patch: 'ready' }], ['scene', 'house', { bed: false }]];
const norm = (s) => s.replace(/pw[ac]\d+x?\d*/g, 'ID');
const hooks = (s) => (s.match(/data-(?:shop|hot|area)="[^"]+"[^>]*>\s*<path class="pa-w[ac]-hit" d="[^"]+"/g) || []).join('|');
const opts = (time, weather, season, extra) => Object.assign(season === 'summer' ? { time, weather } : { time, weather, season }, extra || {});

sec('Halloween off is byte-identical to v26-base');
if (BASE.some((b) => !b)) { ok(false, 'v26-base not found: git fetch origin v26-base (branch) or the tag'); }
else {
  const PB = load(BASE), PN = load(SRC);
  let n = 0;
  const both = (fn, name, o, label) => {
    const b1 = PB[fn](name, o), b2 = PB[fn](name, o);
    const n1 = PN[fn](name, o), n2 = PN[fn](name, Object.assign({}, o, { halloween: false }));
    ok(b1 === n1, `${label}: no flag matches v26-base`); ok(b2 === n2, `${label}: halloween false matches v26-base`); n += 2;
  };
  SEASONS.forEach((season) => TIMES.forEach((time) => WEATHERS.forEach((weather) => {
    SCENES.forEach((name) => both('scene', name, opts(time, weather, season), `scene ${name} ${season} ${time}/${weather}`));
    STRIPS.forEach((name) => both('walkStrip', name, opts(time, weather, season), `strip ${name} ${season} ${time}/${weather}`));
  })));
  SEASONS.forEach((season) => EXTRA.forEach(([fn, name, x]) => [['day', 'sunny'], ['night', 'snow']].forEach(([time, weather]) => both(fn, name, opts(time, weather, season, x), `${fn} ${name} ${JSON.stringify(x)} ${season} ${time}/${weather}`))));
  both('scene', 'map', {}, 'map');
  ok(PN.walkStrip('park') === PB.walkStrip('park') && PN.scene('yard') === PB.scene('yard'), 'the plain default calls still match');
  console.log(`  ${n} off renders compared`);
}

sec('Halloween on: the dressed places and strips');
{
  const PA = load(SRC), P2 = load(SRC);
  let n = 0, biggest = 0, bigName = '';
  const check = (fn, name, time, weather, season) => {
    const o = opts(time, weather, season), tag = `${fn} ${name} ${season} ${time}/${weather}`;
    const off = PA[fn](name, o);
    let s = '';
    try { s = PA[fn](name, Object.assign({}, o, { halloween: true })); } catch (e) { ok(false, `${tag}: throws ${e.message}`); return; }
    n++;
    ok(typeof s === 'string' && s.startsWith('<svg') && s.endsWith('</svg>'), `${tag}: an SVG`);
    ok(/^<svg[^>]* data-halloween="1"/.test(s), `${tag}: the root carries data-halloween`);
    ok(!/NaN|undefined|Infinity/.test(s), `${tag}: no NaN or undefined in the drawing`);
    ok(!/<filter|filter=|<animate|<script/i.test(s) && !/\son[a-z]+=/i.test(s), `${tag}: no filter, animation, script or handler`);
    ok(norm(s) !== norm(off), `${tag}: differs from Halloween off`);
    ok(hooks(s) === hooks(off), `${tag}: hotspots sit exactly where they were`);
    const glow = /fill="#FFD36E" opacity="/.test(s);
    ok(glow === (time === 'dusk' || time === 'night'), `${tag}: the pumpkins glow ${time === 'dusk' || time === 'night' ? 'after dark' : 'only after dark'}`);
    ok(s.length < 900000, `${tag}: stays light (${s.length} chars)`);
    if (s.length > biggest) { biggest = s.length; bigName = tag; }
    if (time === 'night' || (time === 'day' && weather === 'sunny')) ok(norm(P2[fn](name, Object.assign({}, o, { halloween: true }))) === norm(s), `${tag}: the same drawing in a fresh context`);
  };
  SEASONS.forEach((season) => TIMES.forEach((time) => WEATHERS.forEach((weather) => {
    DRESSED.forEach((name) => check('scene', name, time, weather, season));
    STRIPS.forEach((name) => check('walkStrip', name, time, weather, season));
  })));
  const y1 = PA.scene('yard', { season: 'autumn', halloween: true }), y2 = PA.scene('yard', { season: 'autumn', halloween: true });
  ok(norm(y1) === norm(y2), 'the yard is the same drawing on the second call (cached)');
  ok(norm(PA.scene('yard', { season: 'autumn' })) !== norm(y1), 'the cache keeps on and off apart');
  ok(/data-halloween="1"/.test(PA.scene('yard', { halloween: true })), 'summer day sunny with Halloween is dressed too');
  ok(/data-hot="garden"/.test(PA.scene('yard', { patch: 'ready', halloween: true })), 'the yard patch variants still work with Halloween');
  console.log(`  ${n} Halloween renders checked, biggest ${Math.round(biggest / 1024)} KB (${bigName})`);
}

sec('Halloween on: every other scene is the off drawing plus the attribute');
{
  const PA = load(SRC);
  let n = 0;
  SCENES.filter((s) => !DRESSED.includes(s)).forEach((name) => [['day', 'sunny', 'autumn'], ['night', 'rain', 'autumn'], ['dusk', 'cloudy', 'summer'], ['day', 'snow', 'winter']].forEach(([time, weather, season]) => {
    const o = opts(time, weather, season), off = PA.scene(name, o), on = PA.scene(name, Object.assign({}, o, { halloween: true }));
    ok(norm(on).replace(' data-halloween="1"', '') === norm(off), `scene ${name} ${season} ${time}/${weather}: undressed with Halloween on`); n++;
  }));
  ok(PA.scene('map', { halloween: true }).replace(/pwa\d+x?\d*/g, '') === PA.scene('map').replace(/pwa\d+x?\d*/g, ''), 'the map stays Halloween-free');
  console.log(`  ${n} undressed scenes checked`);
}

sec('the walk runner passes the flag only when it is on');
{
  const W = fs.readFileSync(path.join(ROOT, 'mods', 'walkrun.js'), 'utf8');
  ok(/const halloween = o\.halloween === true;/.test(W), 'walkrun reads o.halloween');
  const calls = W.match(/call\('walkStrip'[^\n]*/g) || [];
  ok(calls.length === 2 && calls.every((c) => /hwO\(/.test(c)), 'both walkStrip calls go through hwO');
  ok(/const hwO = \(x\) => \(halloween \? Object\.assign\(x \|\| \{\}, \{ halloween: true \}\) : x\);/.test(W), 'hwO leaves the options untouched when Halloween is off');
}

console.log(`v26_scenes: ${pass} passed, ${fail} failed`);
fails.forEach((f) => console.log('FAIL ' + f));
if (!fail) console.log('ALL OK');
process.exit(fail ? 1 : 0);
