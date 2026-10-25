// v2.15 GROUND ART A test (plain node), V215.md sections 2, 8.2, 12, 13: the seven big outdoor places redrawn 1600 wide and deep.
// Run: node game/test_v215_gart-a.js (or node game/run_tests.js v215_gart-a). Prints ALL OK.
// The "v2.15 A" block at the end of world/pawart_world_c.js: park, dogpark, beach, hilltop, woods, river, pier with { v215: true } for 4 seasons x
// halloween / lights / newyear / jp (and a few times and weathers) draw one valid 1600 x 600 SVG with no NaN, undefined, filter or script, unique
// ids and defined url(#id) refs; every floor prop is a <g data-fy data-prop> inside the one #floorG, in base order; each place has one
// data-hot="run" start arch (its label relabelled by the v2.14 ariaMap layer) and keeps the old scene's hot spots and root label; the
// PawArt.FLOOR rows are closed simple polygons inside the scene with their props drawn, boxes on the floor and spots on the floor outside the
// other props' boxes; renders are deterministic and cached renders get fresh ids. Without v215 every one of the seven scenes (and a few
// neighbours) is byte-identical to the v215-base render (git show v215-base:...), and the block stays at or under 120 KB minified.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const OLD_FILES = ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js'];
const NEW_FILES = OLD_FILES.concat(['world/pawart_world_f.js', 'world/pawart_world_g.js'].filter((f) => fs.existsSync(path.join(ROOT, f))));
const REF = process.env.GART_REF || 'v215-base';

let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; } else { fail++; if (fail < 80) console.log('FAIL ' + msg); } }
function sec(t) { console.log('-- ' + t); }
function load(srcs) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map, RegExp, Date };
  vm.createContext(ctx);
  srcs.forEach(([f, src]) => vm.runInContext(src, ctx, { filename: f }));
  return ctx.window.PawArt;
}
const cur = (files) => files.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]);
function clean(svg, what) {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), what + ' returns an SVG');
  ok(!/NaN|undefined|Infinity|\[object/.test(svg), what + ' has no NaN, undefined, Infinity or [object');
  ok(!/<script/i.test(svg) && !/\son[a-z]+=/i.test(svg), what + ' has no script or event handler');
  ok(!/<filter/i.test(svg), what + ' uses no filter');
  ok((svg.match(/<text\b[^>]*>[^<]*<\/text>/g) || []).every((t) => />z<\/text>$/.test(t)), what + ' has no words (the signs carry pictures; only a sleeping cat\'s z)');
  ok(![...svg.matchAll(/\sd="([^"]*)"/g)].some((m) => /--|[^\deE.\s,MmLlHhVvCcSsQqTtAaZz-]/.test(m[1]) || /^\s*[^Mm\s]/.test(m[1])), what + ' has well-formed path data');
  const open = (svg.match(/<g[\s>]/g) || []).length, close = (svg.match(/<\/g>/g) || []).length;
  ok(open === close, what + ' has balanced groups (' + open + ' / ' + close + ')');
  ok(svg.length < 480 * 1024, what + ' is ' + Math.round(svg.length / 1024) + ' KB (< 480)');
}
function ids(svg, what) {
  const def = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]), set = new Set(def);
  ok(set.size === def.length, what + ': ids are unique');
  ok(def.every((d) => d === 'floorG' || /^pwc\d/.test(d)), what + ': ids are prefixed pwc (or floorG)');
  ok([...svg.matchAll(/url\(#([^)]+)\)/g)].every((m) => set.has(m[1])), what + ': every url(#id) is defined');
}
const norm = (s) => s.replace(/\bpwc\d+x?\d*/g, 'ID');
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const segX = (p1, p2, p3, p4) => { const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4); return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)); };
const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
const inBox = (b, x, y) => b && x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3];
const hooks = (s) => [...s.matchAll(/\s(data-(?:hot|shop|decor|area|spot[a-z-]*)="[^"]*")/g)].map((m) => m[1]);
const rootLabel = (s) => ((s.match(/^<svg[^>]*?\saria-label="([^",]*)/) || [])[1] || '');

const PA = load(cur(NEW_FILES));
const SCENES = ['park', 'dogpark', 'beach', 'hilltop', 'woods', 'river', 'pier'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const FLAGS = [{}, { halloween: true }, { lights: true }, { newyear: true }, { jp: true }, { jp: true, halloween: true, lights: true, newyear: true }];

sec('the block registers its names');
ok(Array.isArray(PA.WORLD_C_V215) && SCENES.every((n) => PA.WORLD_C_V215.includes(n)) && PA.WORLD_C_V215.length === SCENES.length, 'WORLD_C_V215 lists the seven places');
ok(PA.FLOOR && SCENES.every((n) => PA.FLOOR[n]), 'PawArt.FLOOR has a row for each of the seven places');
ok(['training', 'pool', 'sunflower'].every((n) => !fs.existsSync(path.join(ROOT, 'world/pawart_world_g.js')) || PA.FLOOR[n]), 'world G keeps its own FLOOR rows next to these');

sec('every scene x 4 seasons x festival flags renders (v215)');
let renders = 0;
SCENES.forEach((n) => {
  const F = PA.FLOOR[n];
  SEASONS.forEach((season) => FLAGS.forEach((fl) => {
    const o = Object.assign({ v215: true, season }, fl), what = n + ' ' + JSON.stringify(o), s = PA.scene(n, o); renders++;
    clean(s, what); ids(s, what);
    ok((s.match(/viewBox="([^"]+)"/) || [])[1] === '0 0 1600 600', what + ': viewBox 0 0 1600 600');
    ok(s.includes(' data-w="1600"') && s.includes(' data-back="' + F.back + '"'), what + ': data-w and data-back on the root');
    ok((s.match(/id="floorG"/g) || []).length === 1, what + ': one #floorG');
    const fg = s.indexOf('id="floorG"'), groups = [...s.matchAll(/<g data-fy="([\d.]+)" data-prop="([a-z0-9]+)">/g)];
    ok(groups.length === F.props.length && groups.every((m) => m.index > fg), what + ': every floor prop group sits inside #floorG');
    ok(groups.every((m, i) => i === 0 || +groups[i - 1][1] <= +m[1]), what + ': floor props are in base order');
    F.props.forEach((p) => ok(groups.some((m) => m[2] === p.id && Math.abs(+m[1] - p.base) < .01), what + ': prop ' + p.id + ' drawn at data-fy ' + p.base));
    ok((s.match(/data-hot="run"/g) || []).length === 1, what + ': one data-hot="run" start arch');
    if (o.halloween) ok(/data-halloween="1"/.test(s), what + ': marks Halloween');
    if (o.jp) ok(/data-jp="1"/.test(s), what + ': marks jp');
    if (o.lights) ok(/data-lights="1"/.test(s), what + ': marks the Winter Lights');
    if (o.newyear) ok(/data-newyear="1"/.test(s), what + ': marks New Year');
  }));
  [['night', 'rain'], ['dusk', 'snow'], ['dawn', 'cloudy'], ['night', 'sunny']].forEach(([time, weather]) => { const s = PA.scene(n, { v215: true, time, weather, season: 'winter', jp: true, lights: true }), what = n + ' ' + time + ' ' + weather; renders++; clean(s, what); ids(s, what); });
  { const s = PA.scene(n, { v215: true, snow: true, season: 'winter' }); ok(/data-weather="snow"/.test(s), n + ': o.snow reads as snowy weather'); }
  ok(norm(PA.scene(n, { v215: true, season: 'autumn', jp: true })) === norm(PA.scene(n, { v215: true, season: 'autumn', jp: true })), n + ': deterministic');
  ok(PA.scene(n, { v215: true }) !== PA.scene(n, { v215: true }), n + ': a cached render gets fresh ids');
  const sum = norm(PA.scene(n, { v215: true }));
  ok(norm(PA.scene(n, { v215: true, season: 'winter' })) !== sum, n + ': winter differs from summer');
  ok(norm(PA.scene(n, { v215: true, season: 'winter' })).length > norm(PA.scene(n, { v215: true, season: 'summer', weather: 'cloudy' })).length - 40000, n + ': winter keeps the scene (snow on the floor)');
  ok(norm(PA.scene(n, { v215: true, jp: true })) !== sum, n + ': jp adds the Japan scenery');
  ['halloween', 'lights', 'newyear'].forEach((f) => ok(norm(PA.scene(n, { v215: true, season: 'winter', time: 'day', [f]: true })) !== norm(PA.scene(n, { v215: true, season: 'winter', time: 'day' })), n + ': ' + f + ' dresses the place'));
});
console.log('   ' + renders + ' scene renders');

sec('the old hot spots, labels and the run gate');
{
  const OLDPA = load(cur(OLD_FILES));
  SCENES.forEach((n) => {
    const o = { jp: true, newyear: true, halloween: true, lights: true, season: 'winter' }, a = OLDPA.scene(n, Object.assign({}, o)), b = PA.scene(n, Object.assign({ v215: true }, o));
    const ha = hooks(a), hb = hooks(b);
    ok(ha.every((h) => hb.includes(h)), n + ': keeps the old hot spots ' + JSON.stringify(ha));
    ok(rootLabel(a) && rootLabel(a) === rootLabel(b), n + ': keeps the root label "' + rootLabel(a) + '"');
    ok(/data-hot="run" role="button" tabindex="0" aria-label="Start the run"/.test(b), n + ': the run gate is a focusable button with a label');
    const r = PA.scene(n, { v215: true, aria: 'Ort', ariaMap: { 'Start the run': 'Los!' } });
    ok(/^<svg[^>]*aria-label="Ort"/.test(r) && r.includes('aria-label="Los!"'), n + ': the v2.14 aria / ariaMap layer relabels the scene and the gate');
    ok(PA.scene(n, { v215: true, newyear: true, season: 'winter' }).includes('pa-ny-kites') === OLDPA.scene(n, { newyear: true, season: 'winter' }).includes('pa-ny-kites'), n + ': New Year kites as before');
  });
}

sec('the floors (PawArt.FLOOR)');
SCENES.forEach((n) => {
  const F = PA.FLOOR[n], W = 1600, P = F.poly;
  ok(F.w === W && F.back >= 330 && F.back <= 372 && F.front >= 580 && F.front <= 600, n + ': w ' + F.w + ', back ' + F.back + ', front ' + F.front);
  ok(F.kB === 0.5 && F.kF === 1.05, n + ': depth scale ' + F.kB + ' to ' + F.kF + ' (outdoors)');
  ok(Array.isArray(P) && P.length >= 3 && P.every((p) => p.length === 2 && p.every(Number.isFinite)), n + ': poly has 3 or more points');
  ok(P.every((p) => p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= 600), n + ': poly is inside the scene');
  ok(P.every((p, i) => { const q = P[(i + 1) % P.length]; return p[0] !== q[0] || p[1] !== q[1]; }), n + ': poly is closed implicitly (no repeated points)');
  let simple = true; for (let i = 0; i < P.length; i++) for (let j = i + 2; j < P.length; j++) { if (i === 0 && j === P.length - 1) continue; if (segX(P[i], P[(i + 1) % P.length], P[j], P[(j + 1) % P.length])) simple = false; }
  ok(simple, n + ': poly does not cross itself');
  ok(Math.min(...P.map((p) => p[1])) === F.back, n + ': poly starts at the back line');
  ok(area(P) >= 2 * 880 * 180, n + ': floor area ' + Math.round(area(P)) + ' is at least 2x the v2.10 band (880 x 180)');
  ok(new Set(F.props.map((p) => p.id)).size === F.props.length, n + ': prop ids are unique');
  F.props.forEach((p) => {
    ok(Number.isFinite(p.base) && p.base > F.back && p.base < 600, n + ' prop ' + p.id + ': base on the floor');
    if (p.box) ok(p.box.length === 4 && p.box[2] > 0 && p.box[3] > 0 && inPoly(P, p.box[0] + p.box[2] / 2, p.box[1] + p.box[3] / 2) && p.box[1] + p.box[3] >= p.base - 2 && p.box[1] <= p.base, n + ' prop ' + p.id + ': box on the floor at its base');
  });
  ok(new Set(F.spots.map((s) => s.id)).size === F.spots.length && F.spots.length >= 5, n + ': 5 or more spots with unique ids');
  ok(F.spots.some((s) => s.id === 'arch' && s.tags.includes('run')), n + ': an arch spot (the run gate, patrol)');
  ok(F.spots.some((s) => s.tags.includes('rest')) && F.spots.some((s) => s.tags.includes('open')), n + ': a rest spot and an open spot');
  F.spots.forEach((s) => {
    ok(inPoly(P, s.x, s.y), n + ' spot ' + s.id + ': on the floor');
    ok(Array.isArray(s.tags) && s.tags.length && typeof s.act === 'string', n + ' spot ' + s.id + ': tags and act');
    const hit = F.props.filter((p) => inBox(p.box, s.x, s.y));
    ok(!hit.length, n + ' spot ' + s.id + ': outside the props\' boxes' + (hit.length ? ' (' + hit.map((p) => p.id) + ')' : ''));
    if (s.path) ok(s.path.every((q) => inPoly(P, q[0], q[1])), n + ' spot ' + s.id + ': its path stays on the floor');
  });
});
ok(PA.FLOOR.dogpark.spots.filter((s) => s.tags.includes('visitor')).length >= 2, 'dogpark: two Dog Card visitor spots');
ok(PA.FLOOR.beach.spots.some((s) => s.act === 'dig') && PA.FLOOR.woods.spots.some((s) => s.act === 'dig'), 'beach and woods: a dig spot');
{ PA.FLOOR.park.poly[0][0] = -999; const again = load(cur(NEW_FILES)); ok(again.FLOOR.park.poly[0][0] === 22, 'each load gets its own FLOOR rows'); }

sec('without v215: byte-identical to ' + REF);
{
  let refOk = true, OLDREF = null;
  try { OLDREF = load(OLD_FILES.map((f) => [f, cp.execSync(`git show ${REF}:${f}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 })])); } catch (e) { refOk = false; }
  ok(refOk, 'the ref ' + REF + ' is there (git fetch origin v215-base:v215-base)');
  if (refOk) {
    const NOW = load(cur(NEW_FILES)), calls = [];
    SCENES.concat(['yard', 'square', 'fujihill', 'map']).forEach((n) => { [{}, { jp: true }, { season: 'winter', snow: true }, { season: 'autumn', halloween: true }, { season: 'winter', lights: true, newyear: true, jp: true, time: 'dusk' }, { time: 'night', weather: 'rain' }, { v215: false, jp: true }].forEach((o) => calls.push(['scene', n, o])); });
    ['park', 'river', 'woods', 'beach', 'hilltop', 'pier'].forEach((n) => calls.push(['walkStrip', n, { jp: true }]));
    let same = 0; calls.forEach(([f, n, o]) => { const a = OLDREF[f](n, Object.assign({}, o)), b = NOW[f](n, Object.assign({}, o)); if (a === b) same++; else ok(false, f + "('" + n + "', " + JSON.stringify(o) + ') differs from ' + REF); });
    ok(same === calls.length, same + ' / ' + calls.length + ' old renders byte-identical');
  }
}

sec('size (the worlds load before the title: the block at or under 120 KB minified)');
{
  const src = fs.readFileSync(path.join(ROOT, 'world/pawart_world_c.js'), 'utf8'), a = src.indexOf('/* ======================= v2.15 A'), z = src.indexOf('/* ======================= end of v2.15 A');
  ok(a > 0 && z > a, 'the v2.15 A block is marked in world C');
  const blk = src.slice(a, z);
  let esb = null; for (const d of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map((p) => path.join(p, 'esbuild')), 'esbuild')) { try { esb = require(d); break; } catch (e) { /* next */ } }
  if (esb) { const min = esb.transformSync('window.__gartA = function () {' + blk + '};', { minify: true, charset: 'utf8' }).code.length; console.log('   block minified ' + Math.round(min / 1024) + ' KB'); ok(min <= 120 * 1024, 'the v2.15 A block minified is ' + Math.round(min / 1024) + ' KB (<= 120)'); }
  else ok(blk.length <= 160 * 1024, 'the v2.15 A block source is ' + Math.round(blk.length / 1024) + ' KB (no esbuild: the source limit)');
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); } else console.log('ALL OK');
