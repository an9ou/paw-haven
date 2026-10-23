// v2.15 GROUND ART B test (plain node), V215.md sections 2, 5, 8.2, 12, 13: the deep-only places redrawn 1000 wide.
// Run: node game/test_v215_gart-b.js (or node game/run_tests.js v215_gart-b). Prints ALL OK.
// World A's "v2.15 B" block (yard, house, market = Kibble Corner) and world C's "v2.15 B" block (square, fujihill and the indoor cafe, vet,
// salon) with { v215: true } for 4 seasons x halloween / lights / newyear / jp (and a few times and weathers) draw one
// valid 1000 x 600 SVG with no NaN, undefined, filter or script, no words, unique ids and defined url(#id) refs; every floor prop is a
// <g data-fy data-prop> inside the one #floorG, in base order (GAME_PROPS: the obstacles the game draws over the scene, listed with feet boxes
// but drawn by the game); the hot spots stay in the backdrop; the Square has one data-hot="run" start arch (relabelled by the v2.14 ariaMap
// layer); each scene keeps the old hot spots and root label (Kibble Corner: its own door only, V215.md 5); the Fuji Lookout's data-spot-bench is
// the middle of its bench seat; the PawArt.FLOOR rows are closed simple polygons inside the scene, at least 1.5x the v2.10 band, with their
// props drawn, boxes on the floor and spots on the floor outside the other props' boxes; renders are deterministic and cached renders get fresh
// ids. Without v215 every scene (and a few neighbours) is byte-identical to the v215-base render, and the two blocks stay at or under 120 KB minified.
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
const MAXKB = { square: 560 }; // the Square was 452 KB with every flag on in winter before v2.15
function clean(svg, what, n) {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), what + ' returns an SVG');
  ok(!/NaN|undefined|Infinity|\[object/.test(svg), what + ' has no NaN, undefined, Infinity or [object');
  ok(!/<script/i.test(svg) && !/\son[a-z]+=/i.test(svg), what + ' has no script or event handler');
  ok(!/<filter/i.test(svg), what + ' uses no filter');
  ok(!/\s(?:r|rx|ry|width|height|stroke-width)="-/.test(svg), what + ' has no negative size (the browser rejects it)');
  ok((svg.match(/<text\b[^>]*>[^<]*<\/text>/g) || []).every((t) => />z<\/text>$/.test(t)), what + ' has no words (the signs carry pictures; only a sleeping cat\'s z)');
  ok(![...svg.matchAll(/\sd="([^"]*)"/g)].some((m) => /--|[^\deE.\s,MmLlHhVvCcSsQqTtAaZz-]/.test(m[1]) || /^\s*[^Mm\s]/.test(m[1])), what + ' has well-formed path data');
  const open = (svg.match(/<g[\s>]/g) || []).length, close = (svg.match(/<\/g>/g) || []).length;
  ok(open === close, what + ' has balanced groups (' + open + ' / ' + close + ')');
  ok(svg.length < (MAXKB[n] || 480) * 1024, what + ' is ' + Math.round(svg.length / 1024) + ' KB (< ' + (MAXKB[n] || 480) + ')');
}
function ids(svg, what) {
  const def = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]), set = new Set(def);
  ok(set.size === def.length, what + ': ids are unique');
  ok(def.every((d) => d === 'floorG' || /^pw[ac]\d/.test(d)), what + ': ids are prefixed pwa / pwc (or floorG)');
  ok([...svg.matchAll(/url\(#([^)]+)\)/g)].every((m) => set.has(m[1])), what + ': every url(#id) is defined');
}
const norm = (s) => s.replace(/\bpw[ac]\d+x?\d*/g, 'ID');
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const segX = (p1, p2, p3, p4) => { const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4); return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)); };
const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
const inBox = (b, x, y) => b && x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3];
const hooks = (s) => [...s.matchAll(/\s(data-(?:hot|shop|decor|area)="[^"]*"|data-spot[a-z-]*)=?/g)].map((m) => m[1]);
const rootLabel = (s) => ((s.match(/^<svg[^>]*?\saria-label="([^",]*)/) || [])[1] || '');
// the <g ...> element that starts at index i, through its matching </g>
function groupAt(s, i) { const re = /<g\b[^>]*?(\/?)>|<\/g>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { if (m[0] === '</g>') d--; else if (!m[1]) d++; if (d === 0) return s.slice(i, re.lastIndex); } return s.slice(i); }

const PA = load(cur(NEW_FILES));
const SCENES = ['yard', 'house', 'market', 'square', 'fujihill', 'cafe', 'vet', 'salon'];
const INDOOR = ['house', 'cafe', 'vet', 'salon']; // kB 0.7
const RUN = ['square']; // the places whose start arch is data-hot="run" (the Town Loop)
const GAME_PROPS = { yard: ['house', 'mailbox', 'bowl'] }; // drawn by the game over the scene (#houseG, #mailboxG, #bowlG): FLOOR lists their feet boxes
const V210 = { yard: [404, 590], house: [414, 590], square: [414, 590], cafe: [414, 590], vet: [414, 590], salon: [410, 590], market: [452, 585], fujihill: [424, 588] }; // test_v215_ground.js
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const FLAGS = [{}, { halloween: true }, { lights: true }, { newyear: true }, { jp: true }, { jp: true, halloween: true, lights: true, newyear: true }];

sec('the blocks register their names');
ok(Array.isArray(PA.WORLD_C_V215B) && ['square', 'fujihill', 'cafe', 'vet', 'salon'].every((n) => PA.WORLD_C_V215B.includes(n)), 'WORLD_C_V215B lists the Square, the Fuji Lookout, the Café, the Vet and the Salon');
ok(PA.FLOOR && SCENES.every((n) => PA.FLOOR[n]), 'PawArt.FLOOR has a row for each place');
ok(Array.isArray(PA.WORLD_C_V215) && PA.WORLD_C_V215.length === 7 && !PA.WORLD_C_V215.includes('square'), 'the v2.15 A list is unchanged');

sec('every scene x 4 seasons x festival flags renders (v215)');
let renders = 0;
SCENES.forEach((n) => {
  const F = PA.FLOOR[n], game = GAME_PROPS[n] || [];
  SEASONS.forEach((season) => FLAGS.forEach((fl) => {
    const o = Object.assign({ v215: true, season }, fl), what = n + ' ' + JSON.stringify(o), s = PA.scene(n, o); renders++;
    clean(s, what, n); ids(s, what);
    ok((s.match(/viewBox="([^"]+)"/) || [])[1] === '0 0 1000 600', what + ': viewBox 0 0 1000 600');
    ok(s.includes(' data-w="1000"') && s.includes(' data-back="' + F.back + '"'), what + ': data-w and data-back on the root');
    ok((s.match(/id="floorG"/g) || []).length === 1, what + ': one #floorG');
    const fg = s.indexOf('<g id="floorG">'), fgE = fg + groupAt(s, fg).length, groups = [...s.matchAll(/<g data-fy="([\d.]+)" data-prop="([a-zA-Z0-9]+)">/g)];
    ok(groups.length === F.props.length - game.length && groups.every((m) => m.index > fg && m.index < fgE), what + ': every floor prop group sits inside #floorG');
    ok(groups.every((m, i) => i === 0 || +groups[i - 1][1] <= +m[1]), what + ': floor props are in base order');
    F.props.filter((p) => !game.includes(p.id)).forEach((p) => ok(groups.some((m) => m[2] === p.id && Math.abs(+m[1] - p.base) < .01), what + ': prop ' + p.id + ' drawn at data-fy ' + p.base));
    ok(![...s.matchAll(/\sdata-(?:hot|shop)="/g)].some((m) => m.index > fg && m.index < fgE), what + ': the hot spots stay in the backdrop (not in #floorG)');
    ok((s.match(/data-hot="run"/g) || []).length === (RUN.includes(n) ? 1 : 0), what + ': ' + (RUN.includes(n) ? 'one data-hot="run" start arch' : 'no run gate'));
    if (o.halloween) ok(/data-halloween="1"/.test(s), what + ': marks Halloween');
    if (o.jp) ok(/data-jp="1"/.test(s), what + ': marks jp');
    if (o.lights) ok(/data-lights="1"/.test(s), what + ': marks the Winter Lights');
    if (o.newyear) ok(/data-newyear="1"/.test(s), what + ': marks New Year');
  }));
  [['night', 'rain'], ['dusk', 'snow'], ['dawn', 'cloudy'], ['night', 'sunny']].forEach(([time, weather]) => { const s = PA.scene(n, { v215: true, time, weather, season: 'winter', jp: true, lights: true }), what = n + ' ' + time + ' ' + weather; renders++; clean(s, what, n); ids(s, what); });
  { const s = PA.scene(n, { v215: true, snow: true, season: 'winter' }); ok(/data-weather="snow"/.test(s), n + ': o.snow reads as snowy weather'); }
  ok(norm(PA.scene(n, { v215: true, season: 'autumn', jp: true })) === norm(PA.scene(n, { v215: true, season: 'autumn', jp: true })), n + ': deterministic');
  ok(PA.scene(n, { v215: true }) !== PA.scene(n, { v215: true }), n + ': a cached render gets fresh ids');
  if (!F.kB || F.kB === 0.5) {
    const sum = norm(PA.scene(n, { v215: true }));
    ok(norm(PA.scene(n, { v215: true, season: 'winter' })) !== sum, n + ': winter differs from summer');
  }
  ['halloween', 'lights', 'newyear', 'jp'].forEach((f) => ok(norm(PA.scene(n, { v215: true, season: 'winter', time: 'day', [f]: true })) !== norm(PA.scene(n, { v215: true, season: 'winter', time: 'day' })), n + ': ' + f + ' dresses the place'));
});
console.log('   ' + renders + ' scene renders');

sec('the old hot spots, labels, the run gate and the bench seat');
{
  const OLDPA = load(cur(OLD_FILES));
  SCENES.forEach((n) => {
    const o = { jp: true, newyear: true, halloween: true, lights: true, season: 'winter' }, a = OLDPA.scene(n, Object.assign({}, o)), b = PA.scene(n, Object.assign({ v215: true }, o));
    const ha = hooks(a), hb = hooks(b);
    if (n === 'market') ok(hb.length === 1 && hb[0] === 'data-shop="kibble"' && rootLabel(b) === 'Kibble Corner', 'market: Kibble Corner, its door data-shop="kibble" only (V215.md 5)');
    else {
      ok(ha.every((h) => hb.includes(h)), n + ': keeps the old hot spots ' + JSON.stringify(ha));
      ok(rootLabel(a) && rootLabel(a) === rootLabel(b), n + ': keeps the root label "' + rootLabel(a) + '"');
    }
    const r = PA.scene(n, { v215: true, aria: 'Ort', ariaMap: { 'Start the run': 'Los!' } });
    ok(/^<svg[^>]*aria-label="Ort"/.test(r), n + ': the v2.14 aria layer relabels the scene');
    if (RUN.includes(n)) {
      ok(/data-hot="run" role="button" tabindex="0" aria-label="Start the run"/.test(b), n + ': the run gate is a focusable button with a label');
      ok(r.includes('aria-label="Los!"'), n + ': the ariaMap layer relabels the gate');
      ok(PA.FLOOR[n].spots.some((s) => s.id === 'arch' && s.tags.includes('run')), n + ': an arch spot (the run gate)');
    }
  });
  const fh = PA.scene('fujihill', { v215: true, jp: true }), m = /^<svg[^>]*\sdata-spot-bench="([\d.]+),([\d.]+)"/.exec(fh), F = PA.FLOOR.fujihill, bp = F.props.find((p) => p.id === 'bench'), bs = F.spots.find((s) => s.id === 'bench');
  ok(!!m, 'fujihill: data-spot-bench on the root (33_japan.js jpBenchSpot)');
  if (m) ok(bp && inBox([bp.box[0], bp.box[1] - 60, bp.box[2], 70], +m[1], +m[2]) && Math.abs(bs.x - +m[1]) < 1, 'fujihill: the seat (' + m[1] + ', ' + m[2] + ') is over the bench prop, the bench spot in front of it');
  ok(/class="pa-jp-torii"/.test(fh), 'fujihill: the torii keeps its pa-jp-torii class');
}

sec('the floors (PawArt.FLOOR)');
SCENES.forEach((n) => {
  const F = PA.FLOOR[n], W = 1000, P = F.poly, game = GAME_PROPS[n] || [];
  ok(F.w === W && F.back >= 330 && F.back <= 372 && F.front >= 580 && F.front <= 600, n + ': w ' + F.w + ', back ' + F.back + ', front ' + F.front);
  ok((INDOOR.includes(n) ? F.kB === 0.7 : F.kB === 0.5) && F.kF === 1.05, n + ': depth scale ' + F.kB + ' to ' + F.kF);
  ok(Array.isArray(P) && P.length >= 3 && P.every((p) => p.length === 2 && p.every(Number.isFinite)), n + ': poly has 3 or more points');
  ok(P.every((p) => p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= 600), n + ': poly is inside the scene');
  ok(P.every((p, i) => { const q = P[(i + 1) % P.length]; return p[0] !== q[0] || p[1] !== q[1]; }), n + ': poly is closed implicitly (no repeated points)');
  let simple = true; for (let i = 0; i < P.length; i++) for (let j = i + 2; j < P.length; j++) { if (i === 0 && j === P.length - 1) continue; if (segX(P[i], P[(i + 1) % P.length], P[j], P[(j + 1) % P.length])) simple = false; }
  ok(simple, n + ': poly does not cross itself');
  ok(Math.min(...P.map((p) => p[1])) === F.back, n + ': poly starts at the back line');
  const band = V210[n], a0 = 880 * (band[1] - band[0]);
  ok(area(P) >= 1.5 * a0, n + ': floor area ' + Math.round(area(P)) + ' is at least 1.5x the v2.10 band (' + a0 + ')');
  ok(new Set(F.props.map((p) => p.id)).size === F.props.length, n + ': prop ids are unique');
  F.props.forEach((p) => {
    ok(Number.isFinite(p.base) && p.base > F.back && p.base < 600, n + ' prop ' + p.id + ': base on the floor');
    if (p.box) ok(p.box.length === 4 && p.box[2] > 0 && p.box[3] > 0 && inPoly(P, p.box[0] + p.box[2] / 2, p.box[1] + p.box[3] / 2) && p.box[1] + p.box[3] >= p.base - 2 && p.box[1] <= p.base, n + ' prop ' + p.id + ': box on the floor at its base');
  });
  game.forEach((id) => ok(F.props.some((p) => p.id === id && p.box), n + ': the game-drawn ' + id + ' is listed with a feet box'));
  ok(new Set(F.spots.map((s) => s.id)).size === F.spots.length && F.spots.length >= 5, n + ': 5 or more spots with unique ids');
  ok(F.spots.some((s) => s.tags.includes('rest')), n + ': a rest spot');
  F.spots.forEach((s) => {
    ok(inPoly(P, s.x, s.y), n + ' spot ' + s.id + ': on the floor');
    ok(Array.isArray(s.tags) && s.tags.length && typeof s.act === 'string', n + ' spot ' + s.id + ': tags and act');
    const hit = F.props.filter((p) => inBox(p.box, s.x, s.y));
    ok(!hit.length, n + ' spot ' + s.id + ': outside the props\' boxes' + (hit.length ? ' (' + hit.map((p) => p.id) + ')' : ''));
    if (s.path) ok(s.path.every((q) => inPoly(P, q[0], q[1])), n + ' spot ' + s.id + ': its path stays on the floor');
  });
});
{
  const S = PA.FLOOR.square, fz = [20, 400, 222, 92]; // RM_SCENERY.square: the fountain basin
  ok(S.props.some((p) => p.id === 'fountain' && p.box[0] >= fz[0] - 4 && p.box[0] + p.box[2] <= fz[0] + fz[2] + 4), 'square: the fountain stands where RM_SCENERY keeps the dogs off it');
  ok(S.spots.some((s) => s.tags.includes('visitor')), 'square: a Dog Card visitor spot');
  // the game draws over the Square in 1000-wide units: no floor prop in front of the stalls, the pop-up and the fortune box (they would cover them)
  const keep = [[858, 384, 136, 126, 'FS_STALL desk'], [196, 380, 110, 109, 'FS_STALL phone'], [548, 400, 86, 80, 'FS_STALL phone 2'], [212, 344, 114, 105, 'pop-up desk'], [212, 496, 100, 92, 'pop-up phone']];
  keep.forEach((k) => ok(!S.props.some((p) => p.box && p.base > k[1] && p.base < k[1] + k[3] + 40 && p.box[0] < k[0] + k[2] && p.box[0] + p.box[2] > k[0]), 'square: no floor prop stands in front of the ' + k[4]));
}
{
  const C = PA.FLOOR.cafe; // VISIT_EXTRA.cafe (14b_vet_playboard.js): where a Dog Card visitor stands in the café
  ok(C.spots.some((s) => s.tags.includes('visitor') && Math.abs(s.x - 568) < 20 && Math.abs(s.y - 426) < 20), 'cafe: a Dog Card visitor spot at VISIT_EXTRA.cafe (568, 426)');
  ['house', 'cafe', 'vet', 'salon'].forEach((n) => ok(!PA.FLOOR[n].props.some((p) => p.box && p.box[0] < 295 && p.box[0] + p.box[2] > 205 && p.box[1] < 552 && p.box[1] + p.box[3] > 462), n + ': no floor prop on the game bowl (#bowlG, 205, 462, 90 x 90)'));
}
{ PA.FLOOR.square.poly[0][0] = -999; const again = load(cur(NEW_FILES)); ok(again.FLOOR.square.poly[0][0] === 24, 'each load gets its own FLOOR rows'); }

sec('without v215: byte-identical to ' + REF);
{
  let refOk = true, OLDREF = null;
  try { OLDREF = load(OLD_FILES.map((f) => [f, cp.execSync(`git show ${REF}:${f}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 })])); } catch (e) { refOk = false; }
  ok(refOk, 'the ref ' + REF + ' is there (git fetch origin v215-base:v215-base)');
  if (refOk) {
    const NOW = load(cur(NEW_FILES)), calls = [];
    SCENES.concat(['hilltop', 'park', 'dogpark']).forEach((n) => { [{}, { jp: true }, { season: 'winter', snow: true }, { season: 'autumn', halloween: true }, { season: 'winter', lights: true, newyear: true, jp: true, time: 'dusk' }, { time: 'night', weather: 'rain' }, { v215: false, jp: true }].forEach((o) => calls.push(['scene', n, o])); });
    calls.push(['scene', 'yard', { patch: 'empty' }], ['scene', 'house', { bed: false }], ['walkStrip', 'park', { jp: true }]);
    let same = 0; calls.forEach(([f, n, o]) => { const a = OLDREF[f](n, Object.assign({}, o)), b = NOW[f](n, Object.assign({}, o)); if (a === b) same++; else ok(false, f + "('" + n + "', " + JSON.stringify(o) + ') differs from ' + REF); });
    ok(same === calls.length, same + ' / ' + calls.length + ' old renders byte-identical');
  }
}

sec('size (the worlds load before the title: the two v2.15 B blocks together at or under 120 KB minified)');
{
  const blk = [['world/pawart_world_a.js', '/* ======================= v2.15 B', '/* ======================= end of v2.15 B'], ['world/pawart_world_c.js', '/* ======================= v2.15 B', '/* ======================= end of v2.15 B']].map(([f, a, z]) => {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8'), i = src.indexOf(a), j = src.indexOf(z); ok(i > 0 && j > i, 'the v2.15 B block is marked in ' + f); return src.slice(i, j);
  });
  let esb = null; for (const d of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map((p) => path.join(p, 'esbuild')), 'esbuild')) { try { esb = require(d); break; } catch (e) { /* next */ } }
  const tot = blk.reduce((t, b) => t + (esb ? esb.transformSync('window.__gartB = function () {' + b + '};', { minify: true, charset: 'utf8' }).code.length : b.length), 0);
  console.log('   blocks ' + (esb ? 'minified ' : 'source ') + Math.round(tot / 1024) + ' KB');
  ok(tot <= (esb ? 120 : 170) * 1024, 'the v2.15 B blocks are ' + Math.round(tot / 1024) + ' KB ' + (esb ? 'minified (<= 120)' : 'source (no esbuild: <= 170)'));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); } else console.log('ALL OK');
