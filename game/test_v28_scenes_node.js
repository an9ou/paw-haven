// v2.8 SCENE ART test (plain node), V28.md sections 5 and 12.5. Run: node game/test_v28_scenes_node.js (or node game/run_tests.js v28_scenes). Exits 1 on any failure.
// 1. With lights, newyear and jp missing (or false), every world A and world C scene, walk strip and the map is byte-identical to v28-base
//    (git show), for every season x time x weather x Halloween, called in the same order in two fresh contexts.
// 2. Winter Lights / New Year on: every outdoor scene and strip renders cleanly (no NaN, no filter or animation), carries data-lights /
//    data-newyear, differs from off, keeps every hotspot where it was, glows only at dusk and night, and is the same drawing in a fresh
//    context. Kites only with New Year, only by day and never in rain. Indoor scenes are the off drawing plus the attribute.
//    World C gains its dressing in the JAPAN SCENE ART lane: its "differs when on" checks run only when its root carries the attribute
//    (detected), else they are listed as skipped. Its off renders are always checked.
// 3. The Japan call sites (env.jp): without PA.JP every render is the off drawing plus data-jp. With a stand-in PA.JP, every 12.1 A scene and
//    strip calls spot/fuji (wrapped in <g data-fuji>), dress 'far' and 'mid' in that order; woods, house and kitchen call nothing.
// 4. The map: jp draws the Fuji landmark, fujiPin the <g data-area="fujihill"> pin (locked when 'fujihill' is locked).
// 5. The walk runner passes lights / newyear / jp to the strip art only when on, and draws far-layer kites only with newyear.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const ROOT = path.join(__dirname, '..');
const FILES = ['world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js'];
const SRC = FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'));
function baseSrc(rel) {
  for (const ref of ['v28-base', 'origin/v28-base']) {
    try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }).replace(/Paw Haven/g, 'Doodle Doggo').replace(/PAW HAVEN/g, 'DOODLE DOGGO').replace("const cap=()=>k.text(AREAS[id].label,x,y+108,36,{rot:k.J(2),halo:'#FFF8EC'});", "const cap=()=>{const L=AREAS[id].label;k.text(L,x,y+108,L.length>17?Math.round(36*17/L.length):36,{rot:k.J(2),halo:'#FFF8EC'})};"); } catch (e) { /* try the next ref */ } // the game was renamed Doodle Doggo (14 Oct 2026): only the painted name differs
  }
  return null;
}
let pass = 0, fail = 0;
const fails = [];
function ok(c, msg) { if (c) { pass++; } else { fail++; if (fails.length < 40) fails.push(msg); } }
function sec(t) { console.log('-- ' + t); }
function load(srcs, jp) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx);
  srcs.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'art' + i + '.js' }));
  if (jp) ctx.window.PawArt.JP = jp;
  return ctx.window.PawArt;
}
const A_SCENES = ['yard', 'market', 'shelter', 'house', 'garden', 'kitchen', 'park', 'river', 'woods', 'beach'];
const C_SCENES = ['square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'playroom'];
const A_OUT = ['yard', 'market', 'garden', 'park', 'river', 'woods', 'beach'], A_IN = ['shelter', 'house', 'kitchen'];
const C_OUT = ['square', 'dogpark', 'hilltop', 'pier'];
const A_STRIPS = ['park', 'river', 'woods', 'beach'], C_STRIPS = ['town', 'hilltop', 'pier'];
const TIMES = ['dawn', 'day', 'dusk', 'night'], WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'], SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const EXTRA = [['scene', 'yard', { patch: 'empty' }], ['scene', 'yard', { patch: 'ready' }], ['scene', 'house', { bed: false }]];
const norm = (s) => s.replace(/pw[abc][0-9a-z]*?\d+(?:x\d+)?/g, 'ID');
const hooks = (s) => (s.match(/data-(?:shop|hot|area|toy)="[^"]+"[^>]*>\s*<path class="pa-w[ac]-hit" d="[^"]+"/g) || []).join('|');
const clean = (s) => !/NaN|undefined|Infinity/.test(s);
const safe = (s) => !/<filter|filter=|<animate|<script/i.test(s) && !/\son[a-z]+=/i.test(s);
const opts = (time, weather, season, extra) => Object.assign(season === 'summer' ? { time, weather } : { time, weather, season }, extra || {});
const unattr = (s) => s.replace(/ data-(?:lights|newyear|jp)="1"/g, '');
const FLAGS = { lights: 'data-lights', newyear: 'data-newyear' };

// section 1 runs one season per worker thread (about 6500 old renders compared on both sides); the main thread runs the rest meanwhile
function offSection(SEAS, BASE) {
  {
    let PB = load(BASE), PN = load(SRC), n = 0;// fresh pairs per season and time keep the module caches (and memory) small; both start from the same id counter
    const both = (fn, name, o, label) => {
      const b1 = PB[fn](name, o), b2 = PB[fn](name, o);
      const n1 = PN[fn](name, o), n2 = PN[fn](name, Object.assign({}, o, { lights: false, newyear: false, jp: false }));
      ok(b1 === n1, `${label}: no flags matches v28-base`); ok(b2 === n2, `${label}: flags false matches v28-base`); n += 2;
    };
    SEAS.forEach((season) => TIMES.forEach((time) => { PB = load(BASE); PN = load(SRC); WEATHERS.forEach((weather) => [false, true].forEach((hw) => {
      const o = opts(time, weather, season, hw ? { halloween: true } : null), t = `${season} ${time}/${weather}${hw ? ' halloween' : ''}`;
      A_SCENES.concat(C_SCENES).forEach((nm) => both('scene', nm, o, `scene ${nm} ${t}`));
      A_STRIPS.concat(C_STRIPS).forEach((nm) => both('walkStrip', nm, o, `strip ${nm} ${t}`));
    })); }));
    PB = load(BASE); PN = load(SRC);
    SEAS.forEach((season) => EXTRA.forEach(([fn, name, x]) => [['day', 'sunny'], ['night', 'snow']].forEach(([time, weather]) => both(fn, name, opts(time, weather, season, x), `${fn} ${name} ${JSON.stringify(x)} ${season} ${time}/${weather}`))));
    if (SEAS.includes('summer')) {
      const L = { locked: ['woods', 'beach', 'pier'], bonds: { woods: 5, beach: 8, pier: 6 } };
      both('scene', 'map', {}, 'map'); both('scene', 'map', L, 'map with locks');
      ok(PN.scene('map', Object.assign({ fujiPin: [380, 330] }, L)) === PB.scene('map', L), 'map: a fujiPin without jp draws nothing new');
      ok(PN.walkStrip('park') === PB.walkStrip('park') && PN.scene('yard') === PB.scene('yard') && PN.scene('square') === PB.scene('square'), 'the plain default calls still match');
    }
    return n;
  }
}
if (!isMainThread) {
  const n = offSection(workerData.seasons, workerData.base);
  parentPort.postMessage({ pass, fail, fails, n });
  return;
}
sec('lights, newyear and jp off: byte-identical to v28-base (in worker threads)');
const BASE0 = FILES.map(baseSrc);
const offDone = BASE0.some((b) => !b) ? (ok(false, 'v28-base not found: git fetch origin v28-base:v28-base'), Promise.resolve(0))
  : Promise.all(SEASONS.map((s) => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: { seasons: [s], base: BASE0 } }); w.on('message', res); w.on('error', rej); })))
    .then((rs) => rs.reduce((t, r) => { pass += r.pass; fail += r.fail; r.fails.forEach((f) => fails.length < 40 && fails.push(f)); return t + r.n; }, 0));

sec('Winter Lights and New Year on');
{
  let PA = load(SRC), P2 = load(SRC), n = 0, big = 0, bigTag = '';
  const cSupport = { lights: /data-lights="1"/.test(PA.scene('square', { lights: true })), newyear: /data-newyear="1"/.test(PA.scene('square', { newyear: true })) };
  const skipped = [];
  const check = (fn, name, time, weather, season, flag, isC) => {
    const o = opts(time, weather, season), tag = `${fn} ${name} ${season} ${time}/${weather} ${flag}`;
    const off = PA[fn](name, o);
    let s = '';
    try { s = PA[fn](name, Object.assign({}, o, { [flag]: true })); } catch (e) { ok(false, `${tag}: throws ${e.message}`); return; }
    n++;
    ok(typeof s === 'string' && s.startsWith('<svg') && s.endsWith('</svg>'), `${tag}: an SVG`);
    ok(new RegExp(`^<svg[^>]* ${FLAGS[flag]}="1"`).test(s), `${tag}: the root carries ${FLAGS[flag]}`);
    ok(clean(s) && safe(s), `${tag}: no NaN, filter, animation or script`);
    ok(norm(s) !== norm(off), `${tag}: differs from off`);
    ok(hooks(s) === hooks(off), `${tag}: hotspots sit exactly where they were`);
    if (!isC) {
      const kites = /class="pa-ny-kites"/.test(s);
      ok(kites === (flag === 'newyear' && (time === 'day' || time === 'dawn') && weather !== 'rain' && !(fn === 'scene' && ['yard', 'market'].includes(name))), `${tag}: kites only with New Year, by day, not in rain`);
      if (flag === 'lights') ok(/class="pa-wn-glow"/.test(s) === (time === 'dusk' || time === 'night'), `${tag}: the bulbs glow only at dusk and night`);
    }
    ok(s.length < 900000, `${tag}: stays light (${s.length} chars)`);
    if (s.length > big) { big = s.length; bigTag = tag; }
    if (time === 'night' || (time === 'day' && weather === 'sunny')) ok(norm(P2[fn](name, Object.assign({}, o, { [flag]: true }))) === norm(s), `${tag}: the same drawing in a fresh context`);
  };
  ['lights', 'newyear'].forEach((flag) => SEASONS.forEach((season) => TIMES.forEach((time) => { PA = load(SRC); P2 = load(SRC); WEATHERS.forEach((weather) => {
    A_OUT.forEach((nm) => check('scene', nm, time, weather, season, flag));
    A_STRIPS.forEach((nm) => check('walkStrip', nm, time, weather, season, flag));
    if (cSupport[flag]) { C_OUT.forEach((nm) => check('scene', nm, time, weather, season, flag, true)); C_STRIPS.forEach((nm) => check('walkStrip', nm, time, weather, season, flag, true)); }
  }); })));
  ['lights', 'newyear'].forEach((flag) => { if (!cSupport[flag]) skipped.push(`world C ${flag} (scenes ${C_OUT.join(', ')}, strips ${C_STRIPS.join(', ')})`); });
  // indoor A scenes: the off drawing plus the attribute
  A_IN.forEach((name) => [['day', 'sunny', 'winter'], ['night', 'snow', 'winter'], ['dusk', 'cloudy', 'summer']].forEach(([time, weather, season]) => ['lights', 'newyear'].forEach((flag) => {
    const o = opts(time, weather, season), off = PA.scene(name, o), on = PA.scene(name, Object.assign({}, o, { [flag]: true }));
    ok(norm(unattr(on)) === norm(off) && on.includes(`${FLAGS[flag]}="1"`), `scene ${name} ${season} ${time}/${weather} ${flag}: indoors, only the attribute`);
  })));
  const y1 = PA.scene('yard', { season: 'winter', lights: true }), y2 = PA.scene('yard', { season: 'winter', lights: true });
  ok(norm(y1) === norm(y2), 'the yard is the same drawing on the second call (cached)');
  ok(norm(PA.scene('yard', { season: 'winter' })) !== norm(y1) && norm(PA.scene('yard', { season: 'winter', newyear: true })) !== norm(y1), 'the cache keeps off, lights and newyear apart');
  ok(/data-lights="1" data-newyear="1"/.test(PA.scene('market', { season: 'winter', lights: true, newyear: true })), 'both flags together render');
  ok(/data-hot="garden"/.test(PA.scene('yard', { patch: 'ready', newyear: true })), 'the yard patch variants still work with the dressing');
  const wreaths = (s) => (s.match(/stroke-dasharray="3 4"\/>/g) || []).length;
  ok(wreaths(PA.scene('market', { season: 'winter' })) - wreaths(PA.scene('market', { season: 'winter', newyear: true })) === 3, 'New Year takes the winter wreaths off the three shop doors');
  console.log(`  ${n} dressed renders checked, biggest ${Math.round(big / 1024)} KB (${bigTag})`);
  console.log(skipped.length ? `  SKIPPED (no support detected yet): ${skipped.join('; ')}` : '  world C dressing detected and checked');
}

sec('the Japan call sites');
{
  const JP_A = ['yard', 'market', 'shelter', 'garden', 'park', 'river', 'beach'], JP_STRIPS = ['park', 'river', 'beach'];
  // without PA.JP (before JAPAN SCENE ART merges): the off drawing plus data-jp
  const P0 = load(SRC);
  if (!P0.JP) {
    A_SCENES.forEach((name) => [['day', 'sunny', 'summer'], ['night', 'rain', 'winter']].forEach(([time, weather, season]) => {
      const o = opts(time, weather, season), on = P0.scene(name, Object.assign({}, o, { jp: true }));
      ok(norm(unattr(on)) === norm(P0.scene(name, o)) && /^<svg[^>]* data-jp="1"/.test(on), `scene ${name} ${season} ${time}/${weather} jp without PA.JP: only data-jp`);
    }));
    A_STRIPS.forEach((name) => { const on = P0.walkStrip(name, { jp: true, time: 'dusk' }); ok(norm(unattr(on)) === norm(P0.walkStrip(name, { time: 'dusk' })) && /data-jp="1"/.test(on), `strip ${name} jp without PA.JP: only data-jp`); });
  } else console.log('  PA.JP exists (world C): the no-PA.JP case is skipped');
  // a stand-in PA.JP that records its calls and draws a marker from the kit's own stream
  const mkJP = (log) => ({
    spot: (name) => { log.push('spot:' + name); return name === 'woods' ? null : { cx: 300, by: 300, w: 200 }; },
    fuji: (k, sp) => { log.push('fuji'); k.add(`<path d="M${sp.cx - sp.w / 2} ${sp.by}L${sp.cx} ${(sp.by - sp.w / 3.2 - k.r() * 4).toFixed(1)}L${sp.cx + sp.w / 2} ${sp.by}Z" fill="#AFC3D6"/>`); },
    dress: (k, name, layer) => { log.push('dress:' + name + ':' + layer); k.add(`<circle cx="${(100 + k.r() * 800).toFixed(1)}" cy="300" r="9" fill="#E8664F" data-jptest="${layer}"/>`); }
  });
  const log = [], PJ = load(SRC, mkJP(log)), log2 = [], PJ2 = load(SRC, mkJP(log2));
  const callsFor = (fn, name, o) => { log.length = 0; const s = PJ[fn](name, Object.assign({ jp: true }, o)); return { s, calls: log.slice() }; };
  SEASONS.forEach((season) => [['day', 'sunny'], ['night', 'snow'], ['dusk', 'rain']].forEach(([time, weather]) => {
    const o = opts(time, weather, season);
    JP_A.forEach((name) => {
      const { s, calls } = callsFor('scene', name, o), tag = `scene ${name} ${season} ${time}/${weather} jp`;
      const want = name === 'shelter' ? ['spot:shelter', 'fuji', 'dress:shelter:far'] : [`spot:${name}`, 'fuji', `dress:${name}:far`, `dress:${name}:mid`];
      ok(calls.join() === want.join(), `${tag}: calls ${want.join(' ')} (got ${calls.join(' ')})`);
      ok(/<g data-fuji="1"><path d="[^"]+" fill="#[0-9A-F]{6}"\/><\/g>/.test(s) && /^<svg[^>]* data-jp="1"/.test(s) && clean(s), `${tag}: Fuji in a data-fuji group, data-jp on the root`);
      ok(hooks(s) === hooks(PJ.scene(name, o)), `${tag}: hotspots unchanged`);
      if (time === 'night') ok(norm(PJ2.scene(name, Object.assign({ jp: true }, o))) === norm(s), `${tag}: the same drawing in a fresh context`);
      if (name !== 'shelter') { const i = s.indexOf('data-fuji'), f = s.indexOf('data-jptest="far"'), m = s.indexOf('data-jptest="mid"'); ok(i > 0 && f > i && m > f, `${tag}: drawn in the order fuji, far, mid`); }
    });
    JP_STRIPS.forEach((name) => {
      const { s, calls } = callsFor('walkStrip', name, o), tag = `strip ${name} ${season} ${time}/${weather} jp`, sn = 'strip:' + name;
      ok(calls.join() === [`spot:${sn}`, 'fuji', `dress:${sn}:far`, `dress:${sn}:mid`].join(), `${tag}: calls spot/fuji/far/mid with '${sn}' (got ${calls.join(' ')})`);
      ok(/<g data-fuji="1">/.test(s) && /data-jp="1"/.test(s) && clean(s), `${tag}: Fuji in a data-fuji group`);
    });
    ['woods', 'house', 'kitchen'].forEach((name) => { const { calls } = callsFor('scene', name, o); ok(!calls.length, `scene ${name} ${season} ${time}/${weather} jp: no Japan calls`); });
    { const { calls } = callsFor('walkStrip', 'woods', o); ok(!calls.length, `strip woods ${season} ${time}/${weather} jp: no Japan calls`); }
  }));
  // a PA.JP that wraps Fuji itself is not wrapped twice
  const PW = load(SRC, { spot: () => ({ cx: 300, by: 300, w: 200 }), fuji: (k) => k.add('<g data-fuji="1"><circle r="3"/></g>'), dress: () => {} });
  ok((PW.scene('yard', { jp: true }).match(/data-fuji/g) || []).length === 1, 'a Fuji group made by PA.JP is used as it is');
  ok(PJ.scene('yard', { jp: true, time: 'night' }) !== PJ.scene('yard', { time: 'night' }), 'the cache keeps jp apart');
}

sec('the map: the Fuji landmark and the Fuji View Hill pin');
{
  const PA = load(SRC);
  const L = { locked: ['woods'], bonds: { woods: 5, fujihill: 2 } };
  const off = PA.scene('map', L), jp = PA.scene('map', Object.assign({ jp: true }, L)), pin = PA.scene('map', Object.assign({ jp: true, fujiPin: [380, 330] }, L));
  const lockd = PA.scene('map', { jp: true, fujiPin: [380, 330], locked: ['fujihill'], bonds: { fujihill: 2 } });
  ok(/^<svg[^>]* data-jp="1"/.test(jp) && clean(jp) && safe(jp) && norm(jp) !== norm(off), 'jp: the landmark is drawn, data-jp on the root');
  ok(!/data-area="fujihill"/.test(jp), 'jp alone: no pin');
  ok(/<g data-area="fujihill" role="button" tabindex="0" aria-label="Fuji View Hill"><path class="pa-wa-hit"/.test(pin) && />Fuji View Hill</.test(pin) && clean(pin) && safe(pin), 'fujiPin: a data-area="fujihill" group with its hit shape and the caption');
  ok(/data-area="fujihill" data-locked="1"/.test(lockd) && />Bond 2</.test(lockd), 'a locked Fuji View Hill shows the padlock and its Bond');
  const hit = /data-area="fujihill"[^>]*><path class="pa-wa-hit" d="M([\d.]+) ([\d.]+)/.exec(pin);
  ok(hit && Math.abs(+hit[1] - 380) < 130 && Math.abs(+hit[2] - 342) < 100, 'the pin is centred on fujiPin');
  ok(hooks(pin).split('|').filter((h) => !/fujihill/.test(h)).join('|') === hooks(off), 'every other place keeps its hotspot');
  ok(norm(PA.scene('map', Object.assign({ jp: true, fujiPin: [380, 330] }, L))) === norm(pin) && norm(load(SRC).scene('map', Object.assign({ jp: true, fujiPin: [380, 330] }, L))) === norm(pin), 'deterministic (cached and fresh context)');
  ok(norm(PA.scene('map', Object.assign({ jp: true, fujiPin: [600, 360] }, L))) !== norm(pin), 'the cache keeps the pin spot apart');
}

sec('the walk runner');
{
  const W = fs.readFileSync(path.join(ROOT, 'mods', 'walkrun.js'), 'utf8');
  ok(/const lights = o\.lights === true, newyear = o\.newyear === true, jp = o\.jp === true;/.test(W), 'walkrun reads o.lights, o.newyear and o.jp');
  const calls = W.match(/call\('walkStrip'[^\n]*/g) || [];
  ok(calls.length === 2 && calls.every((c) => /wnO\(hwO\(/.test(c)), 'both walkStrip calls go through wnO(hwO(...))');
  ok(/const wnO = \(x\) => \(lights \|\| newyear \|\| jp \? Object\.assign\(x \|\| \{\}, lights \? \{ lights: true \} : \{\}, newyear \? \{ newyear: true \} : \{\}, jp \? \{ jp: true \} : \{\}\) : x\);/.test(W), 'wnO leaves the options untouched when every flag is off');
  ok(/if \(newyear && !night && time !== 'dusk' && !rain\)/.test(W), 'far-layer kites only with New Year, by day, not in rain');
}

offDone.then((n) => {
  console.log(`  ${n} old renders compared with v28-base (flags off)`);
  console.log(`v28_scenes: ${pass} passed, ${fail} failed`);
  fails.forEach((f) => console.log('FAIL ' + f));
  if (!fail) console.log('ALL OK');
  process.exit(fail ? 1 : 0);
}, (e) => { console.log('CRASH ' + (e && e.stack || e)); process.exit(1); });
