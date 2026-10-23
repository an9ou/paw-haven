// v2.15 ART ENV test (plain node), V215.md sections 2, 3, 4, 11, 12 and 16 (v215_env). Run: node game/test_v215_env.js (or node game/run_tests.js v215_env).
// Prints ALL OK, exits 1 on any failure.
// 1. Without o.v215 nothing changed: every old map call (and a sample of every world's scenes) renders byte for byte as v215-base
//    (worlds A to E from git show v215-base), called in the same order in two fresh contexts.
// 2. Every v2.15 scene in V215_SCENES renders for 4 seasons x halloween / lights / newyear / jp on and off: no NaN, no filter, animation or
//    script, unique ids, every url(#id) defined, the season attributes on the root, the same drawing in a fresh context, and the base layout
//    (every hotspot) the same in every variant.
// 3. The map: 25 <g class="mb"> buildings with the four layers (.mb-shadow, .mb-glow, .mb-lift with the .mb-cap caption, .mb-hit last),
//    role=button, tabindex, aria-label; no two alike; a checkered flag on every run place; phone sizes (hit ellipse >= 112 px wide and
//    captions >= 17 px at the phone's default zoom, 844 / 1500); the options names, labels, lock, stickers, hide.
// 4. PawArt.MAP_ROADS: every edge has samples from its node to its node, every MAP215_AREAS place is a node and reachable from the yard;
//    PawArt.mapBuilding for every place and season.
// 5. World F stays a small lazy chunk: <= 150 KB minified (esbuild, when installed).
// PLACE ART and GROUND ART: add your v2.15 scenes to V215_SCENES (name, the options that turn the v2.15 drawing on, a check), and the old
// calls that must stay byte-identical to OLD_CALLS. The env matrix and the id checks run for every entry.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const NEW_FILES = ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => `world/pawart_world_${x}.js`);
const OLD_FILES = ['a', 'b', 'c', 'd', 'e'].map((x) => `world/pawart_world_${x}.js`);
let pass = 0, fail = 0;
const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; if (fails.length < 60) fails.push(msg); } }
function sec(t) { console.log('-- ' + t); }
function baseSrc(rel) {
  for (const ref of ['v215-base', 'origin/v215-base']) {
    try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { /* next */ }
  }
  return null;
}
function load(srcs) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx);
  srcs.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'art' + i + '.js' }));
  return ctx.window.PawArt;
}
const NEW = NEW_FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'));
const clean = (s) => typeof s === 'string' && s.length > 100 && !/NaN|undefined|Infinity/.test(s);
const safe = (s) => !/<filter|filter=|<animate|<script/i.test(s) && !/\son[a-z]+=/i.test(s);
const ids = (s) => [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupIds = (s) => { const seen = new Set(), d = []; ids(s).forEach((i) => { if (seen.has(i)) d.push(i); seen.add(i); }); return d; };
const badRefs = (s) => { const have = new Set(ids(s)); return [...s.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]).filter((i) => !have.has(i)); };
const norm = (s) => s.replace(/(?:mf-|mg-|pwc|pwa)\d+(?:x\d+)?/g, 'ID'); // world F, G, C (GROUND ART A and B) and A (GROUND ART B) ids
// the <g ...> element that starts at index i, through its matching </g>
function groupAt(s, i) { const re = /<g\b[^>]*?(\/?)>|<\/g>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { if (m[0] === '</g>') d--; else if (!m[1]) d++; if (d === 0) return s.slice(i, re.lastIndex); } return s.slice(i); }
const buildings = (s) => { const out = {}; let i = -1; while ((i = s.indexOf('<g class="mb" ', i + 1)) >= 0) { const g = groupAt(s, i), id = /data-area="([^"]+)"/.exec(g)[1]; out[id] = g; } return out; };
const hits = (s) => [...s.matchAll(/<g class="mb" data-area="([^"]+)"[^>]*transform="([^"]+)"|<ellipse class="mb-hit"[^>]*\/>/g)].map((m) => m[0].replace(/ aria-label="[^"]*"/, '')).join('|');

/* ---------- 1. the old renders, byte for byte ---------- */
// OLD_CALLS: [fn, name, options]; the map variants the game uses today, plus a sample of every world's scenes
const OLD_CALLS = [
  ['scene', 'map', {}], ['scene', 'map', { jp: true }], ['scene', 'map', { v215: false, jp: true }],
  ['scene', 'map', { jp: true, fujiPin: [380, 330], station: true, locked: ['beach', 'pier', 'fujihill', 'station'], bonds: { beach: 8, pier: 6, fujihill: 2, station: 3 } }],
  ['scene', 'map', { locked: ['woods', 'hilltop'], bonds: { woods: 5, hilltop: 4 } }],
  ['scene', 'yard', {}], ['scene', 'yard', { season: 'winter', halloween: true, lights: true, newyear: true, jp: true }], ['scene', 'shelter', { time: 'night' }],
  ['scene', 'park', { season: 'autumn' }], ['walkStrip', 'park', {}], ['walkStrip', 'river', { season: 'spring', jp: true }],
];
sec('1. without v215 every old render matches v215-base');
{
  const BASE = OLD_FILES.map(baseSrc);
  if (BASE.some((s) => s == null)) { ok(false, 'git show v215-base failed (run: git fetch origin v215-base:v215-base)'); }
  else {
    const PB = load(BASE), PN = load(NEW);
    const calls = OLD_CALLS.slice();
    ['WORLD_C_SCENES', 'WORLD_D_SCENES', 'WORLD_E_SCENES'].forEach((k) => (PB[k] || []).forEach((n) => calls.push(['scene', n, {}], ['scene', n, { season: 'winter', jp: true }])));
    let n = 0;
    calls.forEach(([fn, name, o]) => { const b = PB[fn](name, Object.assign({}, o)), s = PN[fn](name, Object.assign({}, o)); ok(b === s, `${fn}(${name}, ${JSON.stringify(o)}) differs from v215-base`); n++; });
    ok(JSON.stringify(PB.MAP_AREAS) === JSON.stringify(PN.MAP_AREAS), 'PawArt.MAP_AREAS (the old map) unchanged');
    console.log(`   ${n} old calls compared`);
  }
}

/* ---------- 2. the env matrix for every v2.15 scene ---------- */
const PA = load(NEW), PA2 = load(NEW);
const AREAS = PA.MAP215_AREAS || [];
const KEYS = AREAS.map((a) => a.id);
// V215_SCENES: [name, options that draw the v2.15 version, check(svg, label) or null]. PLACE ART / GROUND ART: add your scenes here.
const V215_SCENES = [
  ['map', { v215: true }, (s, L) => { const B = buildings(s); ok(Object.keys(B).length === 25, `${L}: 25 buildings (got ${Object.keys(B).length})`); ok(/^<svg[^>]*data-v215="1"/.test(s), `${L}: data-v215 on the root`); }],
  // GROUND ART A (world C, the v2.15 A block): the seven big outdoor places, 1600 wide, one run gate each
  ...['park', 'dogpark', 'beach', 'hilltop', 'woods', 'river', 'pier'].map((n) => [n, { v215: true }, (s, L) => { ok(/^<svg[^>]*viewBox="0 0 1600 600"[^>]*data-w="1600"/.test(s), `${L}: 1600 wide`); ok((s.match(/data-hot="run"/g) || []).length === 1 && s.includes('id="floorG"'), `${L}: one run gate and the #floorG layer`); }]),
  // GROUND ART B (world A and world C, the v2.15 B blocks): the deep-only places, 1000 wide; the Square has the Town Loop's run gate
  ...['yard', 'house', 'market', 'square', 'fujihill'].map((n) => [n, { v215: true }, (s, L) => { ok(/^<svg[^>]*viewBox="0 0 1000 600"[^>]*data-w="1000"/.test(s), `${L}: 1000 wide`); ok((s.match(/data-hot="run"/g) || []).length === (n === 'square' ? 1 : 0) && s.includes('id="floorG"'), `${L}: the #floorG layer${n === 'square' ? ' and one run gate' : ''}`); }]),
];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const FLAGS = [['halloween', 'data-halloween'], ['lights', 'data-lights'], ['newyear', 'data-newyear'], ['jp', 'data-jp']];
sec('2. v2.15 scenes x 4 seasons x halloween / lights / newyear / jp');
V215_SCENES.forEach(([name, base, check]) => {
  let n = 0, layout = null;
  const offs = {};
  SEASONS.forEach((season) => {
    for (let m = 0; m < 16; m++) {
      const o = Object.assign({}, base, { season }); FLAGS.forEach(([f], i) => { if (m & (1 << i)) o[f] = true; });
      const L = `${name} ${season}${FLAGS.filter((f, i) => m & (1 << i)).map((f) => ' ' + f[0]).join('')}`;
      let s = '';
      try { s = PA.scene(name, o); } catch (e) { ok(false, `${L}: threw ${e.message}`); continue; }
      ok(clean(s), `${L}: renders cleanly`); ok(safe(s), `${L}: no filter, animation or script`);
      const d = dupIds(s); ok(!d.length, `${L}: unique ids (${d.slice(0, 3).join(', ')})`); const br = badRefs(s); ok(!br.length, `${L}: every url(#id) defined (${br.slice(0, 3).join(', ')})`);
      ok(season === 'summer' ? !/^<svg[^>]*data-season=/.test(s) : new RegExp(`^<svg[^>]*data-season="${season}"`).test(s), `${L}: data-season`);
      FLAGS.forEach(([f, a], i) => ok(new RegExp(`^<svg[^>]*${a}="1"`).test(s) === !!(m & (1 << i)), `${L}: ${a} only when ${f}`));
      if (check) check(s, L);
      const lay = hits(s); if (layout === null) layout = lay; ok(lay === layout, `${L}: the hotspots stay where they are`);
      if (m === 0) offs[season] = s; else ok(norm(s) !== norm(offs[season]), `${L}: the flags change the drawing`);
      if (m === 0 || m === 15) ok(norm(PA2.scene(name, Object.assign({}, o))) === norm(s), `${L}: the same drawing in a fresh context`);
      n++;
    }
  });
  SEASONS.slice(1).forEach((se) => ok(norm(offs[se]) !== norm(offs.spring), `${name}: ${se} differs from spring`));
  console.log(`   ${name}: ${n} renders`);
});

/* ---------- 3. the map buildings ---------- */
sec('3. the map: buildings as buttons');
{
  const s = PA.scene('map', { v215: true, jp: true }), B = buildings(s);
  ok(KEYS.length === 25 && new Set(KEYS).size === 25, 'MAP215_AREAS has 25 places');
  const RUNS = PA.MAP215_RUNS || [];
  ok(RUNS.length === 10 && ['park', 'river', 'woods', 'beach', 'hilltop', 'pier', 'square', 'sunflower', 'bamboo', 'cliffs'].every((k) => RUNS.includes(k)), 'MAP215_RUNS: the ten run places');
  const PHONE = 844 / 1500, arts = new Set();
  KEYS.forEach((id) => {
    const g = B[id], a = AREAS.find((q) => q.id === id); if (!g) { ok(false, `building ${id} drawn`); return; }
    const head = /^<g [^>]*>/.exec(g)[0];
    ok(/role="button"/.test(head) && /tabindex="0"/.test(head) && /aria-label="[^"]+"/.test(head), `${id}: role=button, tabindex, aria-label`);
    ok(head.includes(`transform="translate(${a.x} ${a.y})"`), `${id}: drawn at its MAP215_AREAS spot`);
    const iS = g.indexOf('<ellipse class="mb-shadow"'), iG = g.indexOf('<g class="mb-glow"'), iL = g.indexOf('<g class="mb-lift"'), iH = g.indexOf('<ellipse class="mb-hit"');
    ok(iS > 0 && iG > iS && iL > iG && iH > iL, `${id}: the four layers in order (shadow, glow, lift, hit)`);
    ok(/<ellipse class="mb-hit"[^>]*\/><\/g>$/.test(g), `${id}: .mb-hit is the last layer`);
    const lift = groupAt(g, iL);
    const fo = /style="transform-box:fill-box;transform-origin:50% ([\d.]+)%"><rect class="mb-box" x="(-[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="none"\/>/.exec(lift.slice(0, 300));
    const base = fo && +fo[3] + +fo[5] * fo[1] / 100, sh = +(/<ellipse class="mb-shadow" cx="0" cy="([\d.]+)"/.exec(g) || [])[1];
    ok(fo && Math.abs(-2 * fo[2] - fo[4]) < 0.2 && Math.abs(base - (sh + 2)) < 0.6, `${id}: .mb-lift turns round its base (fill-box pinned by .mb-box, origin ${fo && R(base)} vs ${sh + 2})`);
    ok(/<text class="mb-cap"/.test(lift), `${id}: the caption inside the lift`);
    ok(/<g class="mb-glow" opacity="0"/.test(g) && /class="mb-ring"/.test(groupAt(g, iG)), `${id}: the glow (hidden until the CSS shows it) with the dashed ring`);
    const hit = /<ellipse class="mb-hit"[^>]*rx="([\d.]+)"[^>]*fill="transparent"/.exec(g);
    ok(hit && 2 * hit[1] * PHONE >= 112, `${id}: hit ellipse >= 112 px wide on a phone (${hit && R(2 * hit[1] * PHONE)})`);
    const fs1 = +(/<text class="mb-cap"[^>]*font-size="([\d.]+)"/.exec(g) || [])[1];
    ok(fs1 * PHONE >= 17, `${id}: caption >= 17 px on a phone (${R(fs1 * PHONE)})`);
    ok(RUNS.includes(id) === /class="mb-flag"/.test(g), `${id}: checkered flag only where a run starts`);
    ok(RUNS.includes(id) === /data-run="1"/.test(head), `${id}: data-run`);
    const art = norm(lift.replace(/<text class="mb-cap"[\s\S]*?<\/text>/, '')); ok(!arts.has(art), `${id}: its own art`); arts.add(art);
  });
  ok(arts.size === 25, 'no two buildings alike');
  // options
  const names = {}; KEYS.forEach((k) => { names[k] = 'X ' + k; });
  const s2 = PA.scene('map', { v215: true, names, labels: { cafe: 'Go to the Cafe (test)' }, lock: { cliffs: 'Bond 7', beach: 8 }, stickers: { training: { kind: 'new', text: 'neu' }, market: { kind: 'moved' } } });
  const B2 = buildings(s2);
  ok(KEYS.every((k) => k === 'cafe' ? /aria-label="Go to the Cafe \(test\)"/.test(B2[k]) : B2[k].includes(`aria-label="X ${k}"`)), 'names and labels set the aria-labels');
  ok(KEYS.every((k) => new RegExp(`<text class="mb-cap"[^>]*>X ${k}<`).test(B2[k])), 'names set the captions');
  ok(/data-locked="1"/.test(B2.cliffs) && /class="mb-lock"/.test(B2.cliffs) && />Bond 7</.test(B2.cliffs) && />Bond 8</.test(B2.beach), 'lock: the veil, the padlock and the chip');
  ok(KEYS.filter((k) => /data-locked/.test(B2[k])).length === 2, 'lock: only the locked places');
  ok(/class="mb-sticker" data-kind="new"[\s\S]*>neu</.test(B2.training) && /class="mb-sticker" data-kind="moved"[\s\S]*>moved</.test(B2.market) && !/mb-sticker/.test(B2.cafe), 'stickers: new and moved');
  const s3 = PA.scene('map', { v215: true, jp: true, hide: ['station', 'fujihill'] }), B3 = buildings(s3);
  ok(Object.keys(B3).length === 23 && !B3.station && !B3.fujihill && clean(s3) && !dupIds(s3).length, 'hide: the Station and the Fuji Lookout left out');
  const long = PA.scene('map', { v215: true, names: { shelter: 'Tierheim Doodle Doggo Kuschelhaus am Fluss', salon: 'ドゥードル・ドギー・トリミングサロン' } }), BL = buildings(long);
  ok(/<tspan/.test(BL.shelter) && /<tspan/.test(BL.salon) && clean(long), 'long names go on two lines');
  ok(/<text class="mb-cap"[^>]*font-family="'Caveat',cursive"/.test(s), 'Caveat captions');
  const t = PA.scene('map', { v215: true, title: 'Ville de Doodle Doggo' }); ok(/>Ville de Doodle Doggo</.test(t), 'title option');
}
function R(n) { return Math.round(n * 10) / 10; }

/* ---------- 4. roads and thumbnails ---------- */
sec('4. MAP_ROADS and mapBuilding');
{
  const MR = PA.MAP_ROADS || { nodes: {}, edges: [] }, N = MR.nodes, E = MR.edges;
  ok(E.length >= 31, `MAP_ROADS has the 31 edges (got ${E.length})`);
  const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  E.forEach((e, i) => {
    ok(N[e.a] && N[e.b], `edge ${i} ${e.a}-${e.b}: both ends are nodes`);
    ok(['road', 'lane', 'trail'].includes(e.t), `edge ${i}: type road, lane or trail`);
    ok(Array.isArray(e.pts) && e.pts.length >= 8 && e.pts.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])), `edge ${i} ${e.a}-${e.b}: has samples`);
    if (N[e.a] && N[e.b] && e.pts.length) ok(d(e.pts[0], N[e.a]) < 1 && d(e.pts[e.pts.length - 1], N[e.b]) < 1, `edge ${i} ${e.a}-${e.b}: runs node to node`);
    ok(e.pts.every((p, j) => !j || d(p, e.pts[j - 1]) < 80), `edge ${i} ${e.a}-${e.b}: samples close together (the dog follows the road)`);
    ok(e.pts.every((p) => p[0] >= 0 && p[0] <= 2400 && p[1] >= 0 && p[1] <= 1500), `edge ${i}: on the map`);
    ok(Number.isFinite(e.len) && e.len > 0, `edge ${i}: len`);
    // never straight: the samples leave the chord
    const a = e.pts[0], b = e.pts[e.pts.length - 1], L = d(a, b) || 1, off = Math.max(...e.pts.map((p) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L));
    ok(off >= Math.min(12, L * 0.06), `edge ${i} ${e.a}-${e.b}: winds (not a straight line: ${Math.round(off)})`);
  });
  KEYS.forEach((k) => ok(N[k], `${k}: its door is a node`));
  const adj = {}; E.forEach((e) => { (adj[e.a] = adj[e.a] || []).push(e.b); (adj[e.b] = adj[e.b] || []).push(e.a); });
  const seen = new Set(['yard']), q = ['yard']; while (q.length) { const u = q.shift(); (adj[u] || []).forEach((v) => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); }
  KEYS.forEach((k) => ok(seen.has(k), `${k}: reachable from the yard`));
  ok(E.length > Object.keys(N).length - 1, 'the roads loop (not a tree)');
  const svg = PA.scene('map', { v215: true });
  ok((svg.match(/class="mf-roads"/g) || []).length === 1, 'the roads layer is drawn');
  let all = '';
  KEYS.forEach((k) => SEASONS.forEach((season) => {
    const b = PA.mapBuilding(k, { season, halloween: season === 'autumn', lights: season === 'winter', newyear: season === 'winter', jp: true });
    ok(clean(b) && safe(b) && /^<svg[^>]*viewBox="-130 -130 260 230"/.test(b), `mapBuilding(${k}, ${season}) renders`); all += b;
  }));
  ok(!dupIds(all).length, 'mapBuilding: ids unique across every thumbnail');
  ok(PA.mapBuilding('nope') === '', 'mapBuilding: unknown key gives an empty string');
}

/* ---------- 5. size ---------- */
sec('5. world F size');
{
  let es = null; try { es = require('esbuild'); } catch (e) { try { es = require(path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'esbuild')); } catch (e2) { es = null; } }
  const src = NEW[5];
  if (es) { const min = es.transformSync(src, { minify: true }).code.length; ok(min <= 150 * 1024, `world F minified ${min} bytes <= 150 KB`); console.log(`   world F: ${src.length} bytes, ${min} minified`); }
  else { ok(src.length <= 220 * 1024, 'world F source <= 220 KB'); console.log('   esbuild not found: source size only'); }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) { fails.forEach((f) => console.log('FAIL ' + f)); process.exit(1); }
console.log('ALL OK');
