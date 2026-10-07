// v2.5 SEASON ART test (plain node). Run: node game/test_v25_seasons_node.js   (exits 1 on any failure)
// Covers V25.md section 3: every scene and walk strip of world A and C draws in spring, summer, autumn and winter,
// for every time and weather. Summer (and no season at all) is byte-identical to the v25-base art (git show),
// called in the same order in two fresh contexts. The other three seasons render cleanly, carry data-season,
// differ from summer, and keep every hotspot (data-shop / data-hot) exactly where it was.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const SRC_A = fs.readFileSync(path.join(ROOT, 'world', 'pawart_world_a.js'), 'utf8');
const SRC_C = fs.readFileSync(path.join(ROOT, 'world', 'pawart_world_c.js'), 'utf8');
function baseSrc(rel) {
  for (const ref of ['v25-base', 'origin/v25-base']) {
    try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { /* try the next ref */ }
  }
  return null;
}
const BASE_A = baseSrc('world/pawart_world_a.js'), BASE_C = baseSrc('world/pawart_world_c.js');

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
const STRIPS = ['park', 'river', 'woods', 'beach', 'town', 'hilltop', 'pier'];
const TIMES = ['dawn', 'day', 'dusk', 'night'], WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'], NEW = ['spring', 'autumn', 'winter'];
const EXTRA = [['scene', 'yard', { patch: 'empty' }], ['scene', 'yard', { patch: 'ready' }], ['scene', 'house', { bed: false }]];

sec('exports');
{
  const PA = load([SRC_A, SRC_C]);
  ok(Array.isArray(PA.WORLD_SEASONS) && PA.WORLD_SEASONS.join() === SEASONS.join(), 'PawArt.WORLD_SEASONS is spring, summer, autumn, winter');
  const T = PA.SEASON_TINT || {};
  ok(SEASONS.every((s) => T[s] && /^#[0-9A-F]{6}$/i.test(T[s].grass) && /^#[0-9A-F]{6}$/i.test(T[s].cloud)), 'PawArt.SEASON_TINT has hex grass and cloud colours for every season');
  ok(T.summer && T.summer.grass === '#6E9E62' && T.summer.cloud === '#FFFBF3', 'SEASON_TINT.summer keeps the classic walk colours');
}

sec('summer and no season are byte-identical to v25-base');
if (!BASE_A || !BASE_C) { ok(false, 'v25-base not found: git fetch origin v25-base (branch) or the tag'); }
else {
  const PB = load([BASE_A, BASE_C]), PN = load([SRC_A, SRC_C]);
  let n = 0;
  const both = (fn, o, label) => {
    const b1 = PB[fn](o.name, o.b), b2 = PB[fn](o.name, o.b);
    const n1 = PN[fn](o.name, o.n1), n2 = PN[fn](o.name, o.n2);
    ok(b1 === n1, `${label}: no season matches v25-base`); ok(b2 === n2, `${label}: summer matches v25-base`); n += 2;
  };
  SCENES.forEach((name) => TIMES.forEach((time) => WEATHERS.forEach((weather) => both('scene', { name, b: { time, weather }, n1: { time, weather }, n2: { time, weather, season: 'summer' } }, `scene ${name} ${time}/${weather}`))));
  STRIPS.forEach((name) => TIMES.forEach((time) => WEATHERS.forEach((weather) => both('walkStrip', { name, b: { time, weather }, n1: { time, weather }, n2: { time, weather, season: 'summer' } }, `strip ${name} ${time}/${weather}`))));
  EXTRA.forEach(([fn, name, o]) => [['day', 'sunny'], ['night', 'snow']].forEach(([time, weather]) => both(fn, { name, b: Object.assign({ time, weather }, o), n1: Object.assign({ time, weather }, o), n2: Object.assign({ time, weather, season: 'summer' }, o) }, `${fn} ${name} ${JSON.stringify(o)} ${time}/${weather}`)));
  both('scene', { name: 'map', b: {}, n1: {}, n2: { season: 'summer' } }, 'map');
  ok(PN.scene('map', { season: 'winter' }).replace(/pwa\d+x?\d*/g, '') === PB.scene('map').replace(/pwa\d+x?\d*/g, ''), 'the map stays season-free');
  console.log(`  ${n} summer renders compared`);
}

sec('every season renders cleanly, carries data-season and differs from summer');
{
  const PA = load([SRC_A, SRC_C]);
  const norm = (s) => s.replace(/pw[ac]\d+x?\d*/g, 'ID');
  const hooks = (s) => (s.match(/data-(?:shop|hot|area)="[^"]+"[^>]*>\s*<path class="pa-w[ac]-hit" d="[^"]+"/g) || []).join('|');
  let n = 0, biggest = 0, bigName = '';
  const check = (fn, name) => TIMES.forEach((time) => WEATHERS.forEach((weather) => {
    const sum = PA[fn](name, { time, weather, season: 'summer' }), tag = `${fn} ${name} ${time}/${weather}`;
    NEW.forEach((season) => {
      let s = '';
      try { s = PA[fn](name, { time, weather, season }); } catch (e) { ok(false, `${tag} ${season} throws: ${e.message}`); return; }
      n++;
      ok(typeof s === 'string' && s.startsWith('<svg') && s.endsWith('</svg>'), `${tag} ${season}: an SVG`);
      ok(new RegExp(`^<svg[^>]* data-season="${season}"`).test(s), `${tag} ${season}: the root carries data-season`);
      ok(!/>\?<\/text>/.test(s), `${tag} ${season}: no "?" placeholder`);
      ok(!/<script/i.test(s) && !/\son[a-z]+=/i.test(s), `${tag} ${season}: no script or event handler`);
      ok(!/NaN|undefined|Infinity/.test(s), `${tag} ${season}: no NaN or undefined in the drawing`);
      ok(norm(s) !== norm(sum), `${tag} ${season}: differs from summer`);
      ok(hooks(s) === hooks(sum), `${tag} ${season}: hotspots sit exactly where they were`);
      ok(s.length < 900000, `${tag} ${season}: stays light (${s.length} chars)`);
      if (s.length > biggest) { biggest = s.length; bigName = `${tag} ${season}`; }
    });
  }));
  SCENES.forEach((name) => check('scene', name));
  STRIPS.forEach((name) => check('walkStrip', name));
  ['spring', 'autumn', 'winter'].forEach((season) => { const a = PA.scene('yard', { season }), b = PA.scene('yard', { season }); ok(norm(a) === norm(b), `yard ${season} is the same drawing on the second call`); });
  {
    const P2 = load([SRC_A, SRC_C]);
    ok(norm(P2.scene('square', { season: 'winter', time: 'night' })) === norm(PA.scene('square', { season: 'winter', time: 'night' })), 'a season render is the same drawing in a fresh context');
  }
  console.log(`  ${n} season renders checked, biggest ${Math.round(biggest / 1024)} KB (${bigName})`);
}

console.log(`v25_seasons: ${pass} passed, ${fail} failed`);
fails.forEach((f) => console.log('FAIL ' + f));
if (!fail) console.log('ALL OK');
process.exit(fail ? 1 : 0);
