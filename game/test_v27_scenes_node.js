// v2.7 SHELTER ART test (plain node), V27.md section 4. Run: node game/test_v27_scenes_node.js (or node game/run_tests.js v27_scenes). Exits 1 on any failure.
// 1. PawArt.scene('playroom') renders for every time x weather x season, with and without Halloween: an SVG, no NaN or undefined, no filter
//    or animation, deterministic (twice in one context and once in a fresh one give the same drawing apart from fresh ids), the toy basket
//    hotspot, listed in WORLD_C_SCENES. Halloween adds to the drawing and only then.
// 2. PawArt.prop('adoptboard', { n, more }) for n 0..8 and more 0, 3, 12; PawArt.prop('tosstoy', { kind }) for ball, bone, ring.
//    Every other prop name still goes to world B unchanged.
// 3. Byte-identity with v27-base: every world_c scene and walk strip (every time x weather x season, Halloween off and on), and world_a's
//    shelter and house scenes, called in the same order in two fresh contexts.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FILES = ['world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js'];
const SRC = FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'));
function baseSrc(rel) {
  for (const ref of ['v27-base', 'origin/v27-base']) {
    try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { /* try the next ref */ }
  }
  return null;
}
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
const TIMES = ['dawn', 'day', 'dusk', 'night'], WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'], SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const norm = (s) => s.replace(/pw[abc][0-9a-z]+(?:x\d+)?/g, 'ID');
const clean = (s) => !/NaN|undefined|Infinity/.test(s);
const safe = (s) => !/<filter|filter=|<animate|<script/i.test(s) && !/\son[a-z]+=/i.test(s);
const opts = (time, weather, season, extra) => Object.assign(season === 'summer' ? { time, weather } : { time, weather, season }, extra || {});

sec('the playroom scene');
{
  const PA = load(SRC), P2 = load(SRC);
  ok(Array.isArray(PA.WORLD_C_SCENES) && PA.WORLD_C_SCENES.includes('playroom'), 'playroom is listed in WORLD_C_SCENES');
  ok(PA.WORLD_C_SCENES.slice(0, 7).join() === 'square,cafe,dogpark,vet,salon,hilltop,pier', 'the old scenes keep their order in WORLD_C_SCENES');
  let n = 0, big = 0, bigTag = '';
  SEASONS.forEach((season) => TIMES.forEach((time) => WEATHERS.forEach((weather) => [false, true].forEach((hw) => {
    const o = opts(time, weather, season, hw ? { halloween: true } : null), tag = `playroom ${season} ${time}/${weather}${hw ? ' halloween' : ''}`;
    let s = '';
    try { s = PA.scene('playroom', o); } catch (e) { ok(false, `${tag}: throws ${e.message}`); return; }
    n++;
    ok(typeof s === 'string' && /^<svg[^>]*class="pa-wc-scene pa-wc-playroom"[^>]*viewBox="0 0 1000 600"/.test(s) && s.endsWith('</svg>'), `${tag}: a 1000 x 600 scene SVG`);
    ok(clean(s), `${tag}: no NaN or undefined`);
    ok(safe(s), `${tag}: no filter, animation, script or handler`);
    ok(/<g data-hot="toys" role="button" tabindex="0" aria-label="[^"]+"><path class="pa-wc-hit"/.test(s), `${tag}: the toy basket is a data-hot="toys" group with a hit shape`);
    ok(/^<svg[^>]* data-halloween="1"/.test(s) === hw, `${tag}: data-halloween only with Halloween`);
    ok(norm(PA.scene('playroom', o)) === norm(s), `${tag}: the same drawing on the second call`);
    if (time === 'night' || time === 'day') ok(norm(P2.scene('playroom', o)) === norm(s), `${tag}: the same drawing in a fresh context`);
    if (hw) ok(norm(s).length > norm(PA.scene('playroom', opts(time, weather, season))).length, `${tag}: Halloween adds the pumpkin and the bats`);
    ok(s.length < 600000, `${tag}: stays light (${s.length} chars)`);
    if (s.length > big) { big = s.length; bigTag = tag; }
  }))));
  const day = PA.scene('playroom'), night = PA.scene('playroom', { time: 'night' });
  ok(/fill="#FFF2B0"/.test(night) && !/fill="#FFF2B0"/.test(day), 'the lamps glow at night only');
  ok(norm(PA.scene('playroom', { season: 'winter' })) !== norm(day), 'the season shows (window and vase)');
  ok(norm(PA.scene('playroom', { time: 'bogus' })) === norm(day), 'an unknown time is the day scene');
  console.log(`  ${n} playroom renders checked, biggest ${Math.round(big / 1024)} KB (${bigTag})`);
}

sec('the adoptboard and tosstoy props');
{
  const PA = load(SRC), P2 = load(SRC);
  for (let n = 0; n <= 8; n++) [0, 3, 12].forEach((more) => {
    const tag = `adoptboard n ${n} more ${more}`, s = PA.prop('adoptboard', { n, more });
    ok(/^<svg[^>]*class="pa-wc-prop pa-wc-adoptboard"[^>]*viewBox="0 0 300 220"/.test(s) && s.endsWith('</svg>'), `${tag}: a 300 x 220 SVG`);
    ok(clean(s) && safe(s), `${tag}: clean`);
    ok(/>Adopt me!</.test(s), `${tag}: the hand-lettered header`);
    ok(new RegExp(`>\\+${more}<`).test(s) === more > 0, `${tag}: the +N tag only with more`);
    ok(/>everyone is home!</.test(s) === (n === 0), `${tag}: the empty-board note only with no posters`);
    ok((s.match(/<rect x="\d+" y="\d+" width="54" height="50" fill="#FFFDF8"\/>/g) || []).length === n, `${tag}: ${n} empty portrait boxes`);
    ok(norm(P2.prop('adoptboard', { n, more })) === norm(s), `${tag}: the same drawing in a fresh context`);
    ok(norm(PA.prop('adoptboard', { n, more })) === norm(s), `${tag}: the same drawing on the second call`);
  });
  const slots = PA.ADOPT_SLOTS || [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [20 + (i % 4) * 70, 58 + Math.floor(i / 4) * 80, 54, 50]);
  const b8 = PA.prop('adoptboard', { n: 8 });
  slots.forEach(([x, y, w, h], i) => ok(b8.includes(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFDF8"/>`), `adoptboard: portrait box ${i} sits at the slot [${x}, ${y}, ${w}, ${h}]`));
  ok(PA.prop('adoptboard', { n: 20, more: -2 }) .includes('>Adopt me!<') && norm(PA.prop('adoptboard', { n: 20, more: -2 })) === norm(PA.prop('adoptboard', { n: 8, more: 0 })), 'adoptboard clamps n to 8 and more to 0');
  ok(norm(PA.prop('adoptboard')) === norm(PA.prop('adoptboard', { n: 0, more: 0 })), 'adoptboard with no options is the empty board');
  const kinds = ['ball', 'bone', 'ring'], toys = kinds.map((kind) => PA.prop('tosstoy', { kind }));
  toys.forEach((s, i) => {
    const tag = `tosstoy ${kinds[i]}`;
    ok(/^<svg[^>]*viewBox="0 0 60 60"/.test(s) && s.endsWith('</svg>'), `${tag}: a 60 x 60 SVG`);
    ok(clean(s) && safe(s), `${tag}: clean`);
    ok(norm(P2.prop('tosstoy', { kind: kinds[i] })) === norm(s), `${tag}: the same drawing in a fresh context`);
  });
  ok(new Set(toys.map(norm)).size === 3, 'tosstoy: three different toys');
  ok(norm(PA.prop('tosstoy', { kind: 'kite' })) === norm(toys[0]) && norm(PA.prop('tosstoy')) === norm(toys[0]), 'tosstoy: an unknown kind is the ball');
  ok(Array.isArray(PA.WORLD_C_PROPS) && PA.WORLD_C_PROPS.join() === 'adoptboard,tosstoy', 'WORLD_C_PROPS lists the two props');
  // every other prop name goes to world B untouched (same calls in the same order: world A + B alone vs A + B + C)
  const PB = load(SRC.slice(0, 2)), PC = load(SRC);
  const names = ['bench', 'toybasket', 'bowl', 'stringlights', 'crayonbox', 'nosuchprop'];
  names.forEach((nm) => ok(PC.prop(nm) === PB.prop(nm), `prop ${nm} passes through to world B`));
  ok(PC.prop('stringlights', { lit: true }) === PB.prop('stringlights', { lit: true }) && PC.prop('bowl', { food: 'kibble' }) === PB.prop('bowl', { food: 'kibble' }), 'prop options pass through to world B');
}

sec('byte-identity with v27-base');
{
  const BASE = FILES.map(baseSrc);
  if (BASE.some((b) => !b)) ok(false, 'v27-base not found: git fetch origin v27-base:v27-base');
  else {
    const PB = load(BASE), PN = load(SRC);
    const OLD = ['square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier'], STRIPS = ['town', 'hilltop', 'pier'], A = ['shelter', 'house'];
    ok(PB.WORLD_C_SCENES.join() === OLD.join() && PB.WORLD_C_STRIPS.join() === STRIPS.join(), 'v27-base lists the expected world_c scenes and strips');
    let n = 0;
    const both = (fn, name, o, label) => { const b = PB[fn](name, o), c = PN[fn](name, o); ok(b === c, `${label}: byte-identical to v27-base`); n++; };
    SEASONS.forEach((season) => TIMES.forEach((time) => WEATHERS.forEach((weather) => [false, true].forEach((hw) => {
      const o = opts(time, weather, season, hw ? { halloween: true } : null), t = `${season} ${time}/${weather}${hw ? ' halloween' : ''}`;
      OLD.forEach((nm) => both('scene', nm, o, `scene ${nm} ${t}`));
      STRIPS.forEach((nm) => both('walkStrip', nm, o, `strip ${nm} ${t}`));
      A.forEach((nm) => both('scene', nm, o, `scene ${nm} ${t}`));
    }))));
    SEASONS.forEach((season) => [['day', 'sunny'], ['night', 'snow']].forEach(([time, weather]) => both('scene', 'house', opts(time, weather, season, { bed: false }), `scene house {bed:false} ${season} ${time}/${weather}`)));
    both('scene', 'square', {}, 'scene square, no options');both('walkStrip', 'town', {}, 'strip town, no options');
    console.log(`  ${n} old renders compared`);
  }
}

console.log(`v27_scenes: ${pass} passed, ${fail} failed`);
fails.forEach((f) => console.log('FAIL ' + f));
if (!fail) console.log('ALL OK');
else process.exitCode = 1;
