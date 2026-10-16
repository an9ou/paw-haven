// v2.8 JAPAN SCENE ART test (plain node), V28.md section 12.6. Run: node game/test_v28_japan_node.js (or node game/run_tests.js v28_japan). Exits 1 on any failure.
// 1. (worker threads) With jp missing (or false), the scenes, strips and the map are byte-identical to v28-base (git show) for every season, a spread of times and
//    weathers, with and without Halloween (the full time x weather x season x Halloween sweep with every v2.8 flag off is in v28_scenes).
// 2. jp: true: every scene and strip renders cleanly (no NaN, filter, script), carries data-jp, has exactly one <g data-fuji> where 12.1 says
//    (woods, house, kitchen, vet, salon, playroom and the café have none; the café gets only its noren), keeps every hotspot where it was, and is
//    the same drawing in a fresh context.
// 3. Fuji itself: the cap and the colours differ by season and by time, red Fuji at dusk, a star at night, a cloud band when cloudy, hidden behind
//    the clouds (a faint foot only) in rain and snow, a faint reflection at the pier by day; drawn before the far hills, in its own rgb colours.
// 4. fujihill: in WORLD_C_SCENES, every time x weather x season x festival flag (jp on and off), data-spot-bench inside the phone crop, the
//    shimenawa all year, the kadomatsu pair and the paper lanterns with New Year, the torii in the same place whatever the season.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const ROOT = path.join(__dirname, '..');
const FILES = ['world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js'];
const SRC = FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'));
function baseSrc(rel) {
  for (const ref of ['v28-base', 'origin/v28-base']) {
    try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }).replace(/Paw Haven/g, 'Doodle Doggo').replace(/PAW HAVEN/g, 'DOODLE DOGGO'); } catch (e) { /* next */ }
  }
  return null;
}
let pass = 0, fail = 0;
const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; if (fails.length < 40) fails.push(msg); } }
const T0 = Date.now();
function sec(t) { console.log('-- ' + t + '  [' + Math.round((Date.now() - T0) / 1000) + 's]'); }
function load(srcs) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx);
  srcs.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'art' + i + '.js' }));
  return ctx.window.PawArt;
}
const TIMES = ['dawn', 'day', 'dusk', 'night'], WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'], SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const A_SCENES = ['yard', 'market', 'shelter', 'house', 'garden', 'kitchen', 'park', 'river', 'woods', 'beach'];
const C_SCENES = ['square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'playroom'];
const STRIPS = ['park', 'river', 'woods', 'beach', 'town', 'hilltop', 'pier'];
const FUJI_SCENES = ['yard', 'market', 'shelter', 'garden', 'park', 'river', 'beach', 'square', 'dogpark', 'hilltop', 'pier', 'fujihill'];
const NO_FUJI = ['woods', 'house', 'kitchen', 'vet', 'salon', 'playroom', 'cafe'], ATTR_ONLY = ['woods', 'house', 'kitchen', 'vet', 'salon', 'playroom'];
const norm = (s) => s.replace(/pw[abc][0-9a-z]*?\d+(?:x\d+)?/g, 'ID');
const hooks = (s) => (s.match(/data-(?:shop|hot|area|toy)="[^"]+"[^>]*>\s*<path class="pa-w[ac]-hit" d="[^"]+"/g) || []).join('|');
const clean = (s) => !/NaN|undefined|Infinity/.test(s);
const safe = (s) => !/<filter|filter=|<animate|<script/i.test(s) && !/\son[a-z]+=/i.test(s);
const opts = (time, weather, season, extra) => Object.assign(season === 'summer' ? { time, weather } : { time, weather, season }, extra || {});
// a group from its opening tag (matched by `re`) to its closing tag
function group(s, open) { const i = s.indexOf(open); if (i < 0) return ''; let d = 0; const re = /<g\b|<\/g>/g; re.lastIndex = i; let m; while ((m = re.exec(s))) { d += m[0] === '</g>' ? -1 : 1; if (!d) return s.slice(i, m.index + 4); } return s.slice(i); }
const fujiG = (s) => group(s, '<g data-fuji="1"');

// section 1 runs in two worker threads (two seasons each) while the main thread runs the rest
function offSection(SEAS, BASE) {
  let n = 0;
  SEAS.forEach((season) => {
    const PB = load(BASE), PN = load(SRC);
    [['day', 'sunny'], ['night', 'snow'], ['dusk', 'rain'], ['dawn', 'cloudy']].forEach(([time, weather]) => [false, true].forEach((hw) => {
      const o = opts(time, weather, season, hw ? { halloween: true } : null), t = `${season} ${time}/${weather}${hw ? ' halloween' : ''}`;
      // the same calls in the same order on both sides (the second one comes from the module cache), so the id counters line up
      const both = (fn, nm) => { const b1 = PB[fn](nm, o), b2 = PB[fn](nm, o), n1 = PN[fn](nm, o), n2 = PN[fn](nm, Object.assign({}, o, { jp: false })); ok(b1 === n1, `${fn} ${nm} ${t}: no jp matches v28-base`); ok(b2 === n2, `${fn} ${nm} ${t}: jp false matches v28-base`); n += 2; };
      A_SCENES.concat(C_SCENES).forEach((nm) => both('scene', nm));
      STRIPS.forEach((nm) => both('walkStrip', nm));
    }));
  });
  if (SEAS.includes('summer')) { const PB = load(BASE), PN = load(SRC); ok(PB.scene('map', {}) === PN.scene('map', {}) && PB.scene('map', { locked: ['woods'] }) === PN.scene('map', { locked: ['woods'] }), 'the map matches v28-base'); }
  return n;
}
if (!isMainThread) { const n = offSection(workerData.seasons, workerData.base); parentPort.postMessage({ pass, fail, fails, n }); return; }
sec('jp missing or false: byte-identical to v28-base (in worker threads)');
const BASE0 = FILES.map(baseSrc);
const offDone = BASE0.some((b) => !b) ? (ok(false, 'v28-base not found: git fetch origin v28-base:v28-base'), Promise.resolve(0))
  : Promise.all([['spring', 'summer'], ['autumn', 'winter']].map((ss) => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: { seasons: ss, base: BASE0 } }); w.on('message', res); w.on('error', rej); })))
    .then((rs) => rs.reduce((t, r) => { pass += r.pass; fail += r.fail; r.fails.forEach((x) => fails.length < 40 && fails.push(x)); return t + r.n; }, 0));

sec('jp on: every scene and strip');
{
  const PA = load(SRC), P2 = load(SRC);
  ok(Array.isArray(PA.WORLD_C_SCENES) && PA.WORLD_C_SCENES.includes('fujihill'), 'WORLD_C_SCENES lists fujihill (the place switches on in the game)');
  ok(PA.JP && typeof PA.JP.fuji === 'function' && typeof PA.JP.spot === 'function' && typeof PA.JP.dress === 'function', 'PA.JP has spot, fuji and dress');
  ok(PA.JP.spot('woods') === null && PA.JP.spot('nowhere') === null, 'spot(woods) is null');
  FUJI_SCENES.concat(['park', 'river', 'beach', 'town', 'hilltop', 'pier'].map((s) => 'strip:' + s)).forEach((nm) => { const sp = PA.JP.spot(nm), W = nm.startsWith('strip:') ? 1200 : 1000; ok(sp && [sp.cx, sp.by, sp.w].every(Number.isFinite) && sp.cx - sp.w / 2 >= 0 && sp.cx + sp.w / 2 <= W && sp.by > 60 && sp.by < 360, `spot(${nm}) is inside the scene (${JSON.stringify(sp)})`); });
  let n = 0, big = 0, bigTag = '';
  const TW = [['day', 'sunny'], ['night', 'sunny'], ['dusk', 'rain'], ['dawn', 'cloudy'], ['night', 'snow'], ['day', 'cloudy']];
  SEASONS.forEach((season) => TW.forEach(([time, weather]) => {
    const o = opts(time, weather, season), j = Object.assign({ jp: true }, o), t = `${season} ${time}/${weather}`;
    A_SCENES.concat(C_SCENES, ['fujihill']).forEach((nm) => {
      const s = PA.scene(nm, j), off = PA.scene(nm, o), tag = `scene ${nm} ${t} jp`; n++;
      ok(/^<svg[^>]* data-jp="1"/.test(s) && clean(s) && safe(s), `${tag}: data-jp on the root, no NaN, filter or script`);
      const nf = (s.match(/data-fuji="1"/g) || []).length;
      ok(nf === (NO_FUJI.includes(nm) ? 0 : 1), `${tag}: ${NO_FUJI.includes(nm) ? 'no' : 'one'} Fuji group (got ${nf})`);
      ok(hooks(s) === hooks(off), `${tag}: hotspots unchanged`);
      if (ATTR_ONLY.includes(nm) || nm === 'fujihill') ok(norm(s.replace(/ data-jp="1"/, '')) === norm(off), `${tag}: only the attribute`);
      else ok(norm(s) !== norm(off), `${tag}: differs from off`);
      if (s.length > big) { big = s.length; bigTag = tag; }
      ok(s.length < 900000, `${tag}: stays light (${s.length})`);
      if (time === 'night' || (time === 'day' && weather === 'sunny')) ok(norm(P2.scene(nm, j)) === norm(s), `${tag}: the same drawing in a fresh context`);
    });
    STRIPS.forEach((nm) => {
      const s = PA.walkStrip(nm, j), tag = `strip ${nm} ${t} jp`; n++;
      ok(/data-jp="1"/.test(s) && clean(s) && safe(s), `${tag}: data-jp, clean`);
      ok((s.match(/data-fuji="1"/g) || []).length === (nm === 'woods' ? 0 : 1), `${tag}: ${nm === 'woods' ? 'no' : 'one'} Fuji group`);
      if (time === 'night' || (time === 'day' && weather === 'sunny')) ok(norm(P2.walkStrip(nm, j)) === norm(s), `${tag}: the same drawing in a fresh context`);
    });
  }));
  ok(/class="pa-jp" pointer-events="none"/.test(PA.scene('cafe', { jp: true })), 'the café gets its noren (a pointer-events:none group)');
  ['market', 'square', 'park', 'river', 'garden'].forEach((nm) => ok(/<g class="pa-jp" pointer-events="none">/.test(PA.scene(nm, { jp: true, season: 'spring' })), `${nm}: the details sit in a pointer-events:none group`));
  ok(PA.scene('square', { jp: true }) !== PA.scene('square', {}) && /data-jp/.test(PA.scene('square', { jp: true })) && !/data-jp/.test(PA.scene('square', {})), 'the cache keeps jp apart');
  console.log(`  ${n} jp renders checked, biggest ${Math.round(big / 1024)} KB (${bigTag})`);
}

sec('Mt. Fuji: seasons, times, weather');
{
  const PA = load(SRC), F = (nm, o) => fujiG(PA.scene(nm, Object.assign({ jp: true }, o)));
  FUJI_SCENES.forEach((nm) => {
    ok(new Set(SEASONS.map((season) => norm(F(nm, { season })))).size === 4, `${nm}: the cap differs by season`);
    ok(new Set(TIMES.map((time) => (F(nm, { time }).match(/rgb\([^)]*\)/g) || []).slice(0, 2).join())).size === 4, `${nm}: the colours differ by time`);
    const rain = F(nm, { weather: 'rain' }), snow = F(nm, { weather: 'snow', season: 'winter' }), dry = F(nm, {});
    ok(/fill-opacity="0?\.55"/.test(rain) && /fill-opacity="0?\.55"/.test(snow) && !/fill-opacity="0?\.55"/.test(dry), `${nm}: hidden behind the clouds in rain and snow, a faint foot only`);
    ok(!/rgb\(247,249,252\)/.test(rain) && /rgb\(247,249,252\)/.test(dry) && !/rgb\(255,255,255\)/.test(dry), `${nm}: no snow cap shows in the rain (the day cap is off-white, never pure white)`);
    ok(/rgb\(255,240,168\)/.test(F(nm, { time: 'night' })) && !/rgb\(255,240,168\)/.test(dry), `${nm}: one star by the summit at night`);
    ok(/rgb\(236,238,241\)/.test(F(nm, { weather: 'cloudy' })) && !/rgb\(236,238,241\)/.test(dry), `${nm}: a cloud band when cloudy`);
    ok(/rgb\(232,160,138\)/.test(F(nm, { time: 'dusk' })), `${nm}: red Fuji at dusk`);
  });
  ok(!/#[0-9A-Fa-f]{6}/.test(F('yard', { time: 'night' }).replace(/url\(#[^)]+\)/g, '')), 'Fuji keeps its own light (rgb colours, out of the recolour pass)');
  ok(/<g pointer-events="none" opacity="\.3" stroke-linecap="round">/.test(PA.scene('pier', { jp: true })) && !/<g pointer-events="none" opacity="\.3" stroke-linecap="round">/.test(PA.scene('pier', { jp: true, time: 'night' })), 'the pier shows a faint reflection by day only');
  const y = PA.scene('yard', { jp: true }), i = y.indexOf('data-fuji'), hill = y.indexOf('fill="#DCEDC4"');
  ok(i > 0 && hill > i, 'yard (world A kit): Fuji is drawn before the far hills, they hide its foot');
}

sec('Fuji View Hill');
{
  const PA = load(SRC), P2 = load(SRC);
  let n = 0;
  const FL = [{}, { halloween: true }, { lights: true }, { newyear: true }, { lights: true, newyear: true }];
  SEASONS.forEach((season) => TIMES.forEach((time) => WEATHERS.forEach((weather) => [false, true].forEach((jp) => FL.forEach((fl) => {
    const o = Object.assign(opts(time, weather, season, fl), jp ? { jp: true } : {}), s = PA.scene('fujihill', o), tag = `fujihill ${season} ${time}/${weather} ${JSON.stringify(fl)}${jp ? ' jp' : ''}`; n++;
    ok(typeof s === 'string' && s.startsWith('<svg') && s.endsWith('</svg>') && clean(s) && safe(s), `${tag}: a clean SVG`);
    const m = /^<svg[^>]* data-spot-bench="([\d.]+),([\d.]+)"/.exec(s);
    ok(m && +m[1] > 200 && +m[1] < 580 && +m[2] > 380 && +m[2] < 500, `${tag}: data-spot-bench inside the phone crop`);
    ok((s.match(/data-fuji="1"/g) || []).length === 1, `${tag}: Fuji`);
    ok(/data-jp="1"/.test(s) === jp && /data-newyear="1"/.test(s) === !!fl.newyear && /data-lights="1"/.test(s) === !!fl.lights && /data-halloween="1"/.test(s) === !!fl.halloween, `${tag}: the root carries its flags`);
    ok(s.length < 600000, `${tag}: stays light (${s.length})`);
    if (time === 'night' && weather === 'sunny') ok(norm(P2.scene('fujihill', o)) === norm(s), `${tag}: the same drawing in a fresh context`);
  })))));
  const d = PA.scene('fujihill', {}), ny = PA.scene('fujihill', { newyear: true });
  ok(norm(ny) !== norm(d) && (ny.match(/#F1EAC2/g) || []).length === 6, 'New Year: a kadomatsu pair at the torii (six bamboo cut faces)');
  ok((ny.match(/#FFF4E6/g) || []).length >= 6, 'New Year: a row of paper lanterns');
  ok(/#E3C989/.test(d) && /#E3C989/.test(PA.scene('fujihill', { season: 'spring' })) && !/#F1EAC2/.test(d), 'the shrine wears its shimenawa all year (no kadomatsu without New Year)');
  const torii = (s) => norm(group(s, '<g class="pa-jp-torii"')).replace(/#[0-9A-Fa-f]{6}|rgb\([^)]*\)/g, 'C');
  ok(torii(d).length > 100 && SEASONS.every((season) => torii(PA.scene('fujihill', { season, jp: true })) === torii(d)), 'the torii stays in the same place in every season and with jp');
  console.log(`  ${n} Fuji View Hill renders checked`);
}

offDone.then((n) => {
  console.log(`  ${n} renders compared with v28-base (jp off)`);
  console.log(`v28_japan: ${pass} passed, ${fail} failed`);
  fails.forEach((f) => console.log('FAIL ' + f));
  if (!fail) console.log('ALL OK');
  process.exit(fail ? 1 : 0);
}, (e) => { console.log('CRASH ' + (e && e.stack || e)); process.exit(1); });
