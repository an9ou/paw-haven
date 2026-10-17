// v2.11 TOKYO ART D test (plain node), V211.md section 5.4. Run: node game/test_v211_art_d_node.js (or node game/run_tests.js v211_art_d). Exits 1 on any failure.
// 1. The town map without o.station is byte-identical to v211-base (git show) for the plain map, locked places with bonds, and the v2.8 Fuji pin;
//    the other world A scenes are untouched too. PawArt.MAP_AREAS is the old list until a map is drawn with o.station.
// 2. The Station pin: <g data-area="station"> with o.station (locked with its Bond tag when asked), in PawArt.MAP_AREAS only while it is drawn.
// 3. shibuya, yoyogi, asakusa and shinkansen: every time x weather x season, and the festival flags, render a clean SVG (no NaN or undefined,
//    no filter or script, balanced groups), with the spec's data-hot ids, the hit shapes in the same place in every variant, the floor band.
// 4. The tappable boxes sit at the back of the floor band (out of its middle) and inside the phone crop (x 150 to 850).
// 5. shinkansen: PA.SHINKANSEN_WINDOWS (6), o.heads nested in the windows, o.still, o.dir. japanmap: the seven data-area pins, PA.JAPAN_AREAS,
//    o.locked with o.bonds, o.stamps (an object or an array) as stamp ticks.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FILES = ['world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js'];
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
function baseSrc(rel) {
  for (const ref of ['v211-base', 'origin/v211-base']) {
    try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { /* next */ }
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
const HOT_IDS = { shibuya: ['hachiko', 'crossing', 'stamp', 'souvenir'], yoyogi: ['stamp'], asakusa: ['lantern', 'nakamise', 'omikuji', 'stamp', 'souvenir'] };
const AREAS = ['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba', 'station'];
const clean = (s) => !/NaN|undefined|Infinity/.test(s);
const safe = (s) => !/<filter|filter=|<animate|<script/i.test(s) && !/\son[a-z]+=/i.test(s);
const balanced = (s) => (s.match(/<g\b/g) || []).length === (s.match(/<\/g>/g) || []).length && (s.match(/<svg\b/g) || []).length === (s.match(/<\/svg>/g) || []).length;
const hooks = (s) => (s.match(/data-(?:hot|area)="[^"]+"[^>]*>\s*<path class="pa-w[ad]-hit" d="[^"]+"/g) || []).join('|');
const norm = (s) => s.replace(/pw[a-e][0-9a-z]*?\d+(?:x\d+)?/g, 'ID');
const opts = (time, weather, season, extra) => Object.assign(season === 'summer' ? { time, weather } : { time, weather, season }, extra || {});

// ---------- 1. the town map without the Station is byte-identical to v211-base ----------
sec('1. town map byte-identical without o.station');
{
  const BA = baseSrc('world/pawart_world_a.js'), BB = baseSrc('world/pawart_world_b.js'), BC = baseSrc('world/pawart_world_c.js');
  if (!BA || !BB || !BC) { ok(false, 'v211-base not found: git fetch origin v211-base'); }
  else {
    const PB = load([BA, BB, BC]), PN = load(FILES.map(src));
    const areas0 = JSON.stringify(PB.MAP_AREAS);
    ok(JSON.stringify(PN.MAP_AREAS) === areas0, 'MAP_AREAS unchanged at load');
    const calls = [['map', {}], ['map', { locked: ['beach', 'pier', 'woods'], bonds: { beach: 8, pier: 6 } }], ['map', { jp: true }], ['map', { jp: true, fujiPin: [380, 330] }],
      ['map', { jp: true, fujiPin: [380, 330], locked: ['fujihill', 'hilltop'], bonds: { fujihill: 2 } }], ['map', { station: false }], ['map', { station: 'yes' }],
      ['yard', {}], ['market', { time: 'night', weather: 'rain' }], ['park', { season: 'autumn', jp: true }], ['beach', { time: 'dusk', season: 'winter', halloween: true }]];
    calls.forEach(([nm, o]) => { const b = PB.scene(nm, o), n = PN.scene(nm, o); ok(b === n, `${nm} ${JSON.stringify(o)}: byte-identical to v211-base`); });
    ok(JSON.stringify(PN.MAP_AREAS) === areas0, 'MAP_AREAS unchanged after maps without the Station');
    // a Station render in between leaves the next plain map the same drawing (only the fresh id suffixes move on)
    const s = PN.scene('map', { station: true });
    ok(/data-area="station"/.test(s), 'station: drawn with o.station');
    ok(JSON.stringify(PN.MAP_AREAS) !== areas0 && PN.MAP_AREAS.some((a) => a.id === 'station' && Number.isFinite(a.x) && Number.isFinite(a.y)), 'station: in MAP_AREAS while drawn');
    ok(norm(PB.scene('map', { locked: ['pier'] })) === norm(PN.scene('map', { locked: ['pier'] })), 'map after a Station render: the same drawing');
    ok(JSON.stringify(PN.MAP_AREAS) === areas0, 'station: out of MAP_AREAS again after a map without it');
  }
}

// ---------- 2. the Station pin ----------
sec('2. the Station pin');
{
  const PN = load(FILES.map(src));
  [{ station: true }, { station: true, jp: true, fujiPin: [380, 330] }, { station: true, locked: ['station', 'beach'], bonds: { station: 3 } }].forEach((o) => {
    const s = PN.scene('map', o), t = JSON.stringify(o);
    ok(clean(s) && safe(s) && balanced(s), `map ${t}: clean`);
    ok((s.match(/data-area="station"/g) || []).length === 1, `map ${t}: one station pin`);
    ok(/aria-label="Station/.test(s), `map ${t}: labelled`);
    const lockedSt = (o.locked || []).includes('station');
    ok(/data-area="station" data-locked="1"/.test(s) === lockedSt, `map ${t}: locked flag`);
    if (lockedSt) ok(/>Bond 3</.test(s), `map ${t}: Bond tag`);
    ['yard', 'house', 'market', 'shelter', 'square', 'park', 'river', 'woods', 'beach', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier'].forEach((id) => ok(s.includes(`data-area="${id}"`), `map ${t}: ${id} still there`));
  });
  const st = PN.MAP_AREAS.find((a) => a.id === 'station');
  ok(st && PN.MAP_AREAS.filter((a) => a.id !== 'station').every((a) => Math.hypot(a.x - st.x, a.y - st.y) > 220), 'station: clear of every other place');
}

// ---------- 3. the scenes in every variant ----------
sec('3. scenes x time x weather x season, festival flags');
const P = load(FILES.map(src));
ok(Array.isArray(P.WORLD_D_SCENES) && ['japanmap', 'shinkansen', 'shibuya', 'yoyogi', 'asakusa'].every((n) => P.WORLD_D_SCENES.includes(n)), 'WORLD_D_SCENES lists the five');
const base = {};
['shibuya', 'yoyogi', 'asakusa', 'shinkansen'].forEach((nm) => {
  base[nm] = P.scene(nm, nm === 'shinkansen' ? { still: true } : {});
  let n = 0, big = 0;
  const check = (o, t) => {
    const s = P.scene(nm, Object.assign(nm === 'shinkansen' ? { still: true } : {}, o)); n++; big = Math.max(big, s.length);
    ok(s.startsWith('<svg') && s.endsWith('</svg>') && /viewBox="0 0 1000 600"/.test(s), `${nm} ${t}: an SVG 1000 x 600`);
    ok(clean(s), `${nm} ${t}: no NaN or undefined`);
    ok(safe(s), `${nm} ${t}: no filter or script`);
    ok(balanced(s), `${nm} ${t}: balanced groups`);
    if (HOT_IDS[nm]) {
      HOT_IDS[nm].forEach((id) => ok((s.match(new RegExp(`data-hot="${id}"`, 'g')) || []).length === 1, `${nm} ${t}: one data-hot="${id}"`));
      ok(norm(hooks(s)) === norm(hooks(base[nm])), `${nm} ${t}: hit shapes where they are by day`);
      ok(/data-floor="420,590,60,940"/.test(s), `${nm} ${t}: data-floor`);
      ok(!/Shibuya|Yoyogi|Asakusa|Sens/.test(s.replace(/aria-label="[^"]*"/g, '')), `${nm} ${t}: the place name nowhere in the art`);
    }
  };
  TIMES.forEach((time) => WEATHERS.forEach((weather) => SEASONS.forEach((season) => check(opts(time, weather, season), `${time}/${weather}/${season}`))));
  [{ halloween: true }, { lights: true }, { newyear: true }, { jp: true }, { halloween: true, lights: true, newyear: true, jp: true }].forEach((f) =>
    [['day', 'sunny', 'summer'], ['night', 'snow', 'winter'], ['dusk', 'rain', 'autumn']].forEach(([a, b, c]) => check(opts(a, b, c, f), `${a}/${b}/${c} ${Object.keys(f).join('+')}`)));
  ok(big < 520000, `${nm}: largest variant ${big} bytes (under 520 KB)`);
  console.log(`   ${nm}: ${n} variants, largest ${Math.round(big / 1024)} KB`);
  const a = P.scene(nm, { time: 'dusk', season: 'spring' }), b = P.scene(nm, { time: 'dusk', season: 'spring' });
  ok(a !== b && norm(a) === norm(b), `${nm}: the same drawing on every call, with fresh ids`);
});

// ---------- 4. the tappable boxes ----------
sec('4. hot boxes: back of the floor band, inside the phone crop');
{
  const H = P.WORLD_D_HOTS, F = P.WORLD_D_FLOOR;
  ok(Array.isArray(F) && F.join(',') === '420,590,60,940', 'WORLD_D_FLOOR is the default band');
  Object.keys(HOT_IDS).forEach((nm) => HOT_IDS[nm].forEach((id) => {
    const b = H && H[nm] && H[nm][id];
    ok(Array.isArray(b) && b.length === 4 && b.every(Number.isFinite), `${nm}.${id}: a box`);
    if (!b) return;
    ok(b[1] + b[3] <= 462, `${nm}.${id}: ends at the back of the floor band (bottom ${b[1] + b[3]})`);
    ok(b[0] >= 150 && b[0] + b[2] <= 852, `${nm}.${id}: inside the phone crop (x ${b[0]} to ${b[0] + b[2]})`);
  }));
  Object.keys(HOT_IDS).forEach((nm) => { const L = HOT_IDS[nm].map((id) => H[nm][id]); L.forEach((a, i) => L.forEach((b, j) => { if (j <= i) return; const ov = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]); ok(ov <= 8, `${nm}: ${HOT_IDS[nm][i]} and ${HOT_IDS[nm][j]} do not overlap (${ov})`); })); });
}

// ---------- 5. the ride and the Japan map ----------
sec('5. shinkansen and japanmap');
{
  const W = P.SHINKANSEN_WINDOWS;
  ok(Array.isArray(W) && W.length === 6, 'SHINKANSEN_WINDOWS: six');
  (W || []).forEach((w, i) => { ok(w.head && w.head.w === 90 && w.head.h === 90 && w.head.x >= w.x && w.head.x + 90 <= w.x + w.w && w.head.y >= w.y && w.head.y < w.y + w.h, `window ${i}: the head box sits in the window`); ok(w.x >= 140 && w.x + w.w <= 860, `window ${i}: inside the phone crop`); });
  const heads = ['<circle cx="45" cy="45" r="40" fill="#f00"/>', '<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>', '', null, 'x', '<g/>'];
  const s = P.scene('shinkansen', { heads });
  ok((s.match(/class="pa-wd-head"/g) || []).length === 4, 'heads: one nested box per head given');
  ok(!/pwd-head-/.test(s), 'heads: no placeholders left');
  ok(/class="pa-wd-run pa-wd-near"/.test(s) && /class="pa-wd-run pa-wd-far"/.test(s) && !/pa-wd-back/.test(s), 'out: the scenery runs');
  ok(/pa-wd-back/.test(P.scene('shinkansen', { dir: 'home' })), 'home: the scenery runs the other way');
  const st = P.scene('shinkansen', { still: true });
  ok(!/pa-wd-run/.test(st) && /transform="translate\(-1500 0\)"/.test(st) && /data-still="1"/.test(st), 'still: no animation, the middle of the run (Mt. Fuji)');
  ok(/data-fuji="1"/.test(st), 'Mt. Fuji is in the ride');
  ok(!/pa-wd-head/.test(P.scene('shinkansen', {})), 'no heads: empty windows');

  ok(Array.isArray(P.JAPAN_AREAS) && P.JAPAN_AREAS.length === 7 && AREAS.every((id) => P.JAPAN_AREAS.some((a) => a.id === id && Number.isFinite(a.x) && Number.isFinite(a.y) && a.x > 0 && a.x < 1600 && a.y > 0 && a.y < 1000)), 'JAPAN_AREAS: the seven pins');
  [{}, { locked: ['odaiba', 'tokyotower'], bonds: { odaiba: 6, tokyotower: 5 } }, { stamps: { shibuya: '2026-10-17', hachiko: '2026-10-17', ueno: '2026-10-18' } }, { stamps: ['yoyogi', 'odaiba'] }, { locked: 'bad', bonds: null, stamps: 7 }, { time: 'night', weather: 'rain', season: 'winter' }].forEach((o) => {
    const m = P.scene('japanmap', o), t = JSON.stringify(o);
    ok(m.startsWith('<svg') && /viewBox="0 0 1600 1000"/.test(m) && clean(m) && safe(m) && balanced(m), `japanmap ${t}: clean`);
    AREAS.forEach((id) => ok((m.match(new RegExp(`data-area="${id}"`, 'g')) || []).length === 1, `japanmap ${t}: ${id}`));
    const lk = Array.isArray(o.locked) ? o.locked : [];
    AREAS.forEach((id) => ok(m.includes(`data-area="${id}" data-locked="1"`) === lk.includes(id), `japanmap ${t}: ${id} locked flag`));
    lk.forEach((id) => ok(m.includes(`>Bond ${o.bonds[id]}<`), `japanmap ${t}: Bond ${o.bonds[id]} tag`));
    const sk = Array.isArray(o.stamps) ? o.stamps : o.stamps && typeof o.stamps === 'object' ? Object.keys(o.stamps) : [];
    ok((m.match(/data-stamp="/g) || []).length === sk.length && sk.every((k) => m.includes(`data-stamp="${k}"`)), `japanmap ${t}: a tick per stamp`);
  });
  ok(norm(P.scene('japanmap', {})) === norm(P.scene('japanmap', { time: 'night' })), 'japanmap: no time or weather');
}

console.log(`\nv211 art D: ${pass} passed, ${fail} failed  [${Math.round((Date.now() - T0) / 1000)}s]`);
if (fail) { console.log(fails.map((f) => '  FAIL ' + f).join('\n')); process.exit(1); }
console.log('ALL OK');
