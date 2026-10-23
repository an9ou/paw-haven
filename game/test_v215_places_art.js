// v2.15 PLACE ART test (plain node + one headless page for the strip seams), V215.md sections 2, 6, 8.2, 12.
// Run: node game/test_v215_places_art.js (or node game/run_tests.js v215_places_art). Prints ALL OK.
// world/pawart_world_g.js: the eight new scenes (training, pool, boutique, builder, sprout, sunflower, bamboo, cliffs) for 4 seasons x
// halloween / lights / newyear / jp (and a few times and weathers) draw one valid SVG of the scene's width with no NaN, undefined, filter or
// script, unique ids and defined url(#id) refs; every floor prop is a <g data-fy data-prop> inside the one #floorG, in base order; the training
// has the five agility obstacles, the storefronts their data-shop door, the trailheads a data-hot="run" gate; PawArt.FLOOR rows are closed
// simple polygons inside the scene, with their props drawn and their spots on the floor; the three walk strips are 1200 x 400 and seamless
// (the left and right edge columns match around ground y 330); renders are deterministic; every name world G does not own is byte-identical
// with and without world G; and the minified module stays at or under 250 KB (PERF.md section 5).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const BASE = ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js']
  .concat(fs.existsSync(path.join(ROOT, 'world/pawart_world_f.js')) ? ['world/pawart_world_f.js'] : []);
const G = 'world/pawart_world_g.js';

let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; } else { fail++; if (fail < 80) console.log('FAIL ' + msg); } }
function sec(t) { console.log('-- ' + t); }
function load(files) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map, RegExp, Date };
  vm.createContext(ctx);
  files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
  return ctx.window.PawArt;
}
function clean(svg, what) {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), what + ' returns an SVG');
  ok(!/NaN|undefined|Infinity|\[object/.test(svg), what + ' has no NaN, undefined, Infinity or [object');
  ok(!/<script/i.test(svg) && !/\son[a-z]+=/i.test(svg), what + ' has no script or event handler');
  ok(!/<filter/i.test(svg), what + ' uses no filter');
  ok(![...svg.matchAll(/\sd="([^"]*)"/g)].some((m) => /--|[^\deE.\s,MmLlHhVvCcSsQqTtAaZz-]/.test(m[1]) || /^\s*[^Mm\s]/.test(m[1])), what + ' has well-formed path data');
  const open = (svg.match(/<g[\s>]/g) || []).length, close = (svg.match(/<\/g>/g) || []).length;
  ok(open === close, what + ' has balanced groups (' + open + ' / ' + close + ')');
}
function ids(svg, what) {
  const def = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]), set = new Set(def);
  ok(set.size === def.length, what + ': ids are unique');
  ok(def.every((d) => d === 'floorG' || /^mg-/.test(d) || /^pw/.test(d)), what + ': ids are prefixed mg- (or floorG)');
  ok([...svg.matchAll(/url\(#([^)]+)\)/g)].every((m) => set.has(m[1])), what + ': every url(#id) is defined');
}
const norm = (s) => s.replace(/\bmg-\d+x?\d*/g, 'ID');
// geometry
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const segX = (p1, p2, p3, p4) => { const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4); return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)); };
const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
const inBox = (b, x, y) => b && x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3];

const PA = load(BASE.concat(G));
const SCENES = ['training', 'pool', 'boutique', 'builder', 'sprout', 'sunflower', 'bamboo', 'cliffs'], STRIPS = ['sunflower', 'bamboo', 'cliffs'];
const WIDE = { training: 1600, pool: 1600, sunflower: 1600, bamboo: 1600, cliffs: 1600, boutique: 1000, builder: 1000, sprout: 1000 };
const SHOP = { boutique: 'boutique', builder: 'builder', sprout: 'sprout' }, TRAIL = ['sunflower', 'bamboo', 'cliffs'];
const AGILITY = ['weave', 'jump', 'tyre', 'tunnel', 'table'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const FLAGS = [{}, { halloween: true }, { lights: true }, { newyear: true }, { jp: true }, { jp: true, halloween: true, lights: true, newyear: true }];

sec('the module registers its names');
ok(SCENES.every((n) => PA.WORLD_G_SCENES.includes(n)) && PA.WORLD_G_SCENES.length === SCENES.length, 'WORLD_G_SCENES lists the eight places');
ok(STRIPS.every((n) => PA.WORLD_G_STRIPS.includes(n)) && PA.WORLD_G_STRIPS.length === 3, 'WORLD_G_STRIPS lists sunflower, bamboo, cliffs');
ok(PA.FLOOR && SCENES.every((n) => PA.FLOOR[n]), 'PawArt.FLOOR has a row for every new place');

sec('every scene x 4 seasons x festival flags renders');
let renders = 0;
SCENES.forEach((n) => {
  const W = WIDE[n], F = PA.FLOOR[n];
  SEASONS.forEach((season) => FLAGS.forEach((fl) => {
    const o = Object.assign({ season }, fl), what = n + ' ' + JSON.stringify(o), s = PA.scene(n, o); renders++;
    clean(s, what); ids(s, what);
    ok((s.match(/viewBox="([^"]+)"/) || [])[1] === '0 0 ' + W + ' 600', what + ': viewBox 0 0 ' + W + ' 600');
    ok((s.match(/id="floorG"/g) || []).length === 1, what + ': one #floorG');
    const fg = s.indexOf('id="floorG"'), groups = [...s.matchAll(/<g data-fy="([\d.]+)" data-prop="([a-z]+)">/g)];
    ok(groups.length >= F.props.length && groups.every((m) => m.index > fg), what + ': every floor prop group sits inside #floorG');
    ok(groups.every((m, i) => i === 0 || +groups[i - 1][1] <= +m[1]), what + ': floor props are in base order');
    F.props.forEach((p) => ok(groups.some((m) => m[2] === p.id && Math.abs(+m[1] - p.base) < .01), what + ': prop ' + p.id + ' drawn at data-fy ' + p.base));
    if (o.halloween) ok(/data-halloween="1"/.test(s), what + ': marks Halloween');
    if (o.jp) ok(/data-jp="1"/.test(s), what + ': marks jp');
  }));
  [['night', 'rain'], ['dusk', 'snow'], ['dawn', 'cloudy']].forEach(([time, weather]) => { const s = PA.scene(n, { time, weather, season: 'winter', jp: true }), what = n + ' ' + time + ' ' + weather; renders++; clean(s, what); ids(s, what); });
  { const s = PA.scene(n, { snow: true, season: 'winter' }); ok(/data-weather="snow"/.test(s), n + ': o.snow reads as snowy weather'); }
  ok(norm(PA.scene(n, { season: 'autumn', jp: true })) === norm(PA.scene(n, { season: 'autumn', jp: true })), n + ': deterministic');
  ok(PA.scene(n, {}) !== PA.scene(n, {}), n + ': a cached render gets fresh ids');
  ok(norm(PA.scene(n, { season: 'winter' })) !== norm(PA.scene(n, {})), n + ': winter differs from summer');
  ok(norm(PA.scene(n, { jp: true })) !== norm(PA.scene(n, {})), n + ': jp adds the Japan scenery');
});
console.log('   ' + renders + ' scene renders');

sec('the hot spots');
{ const s = PA.scene('training', {}); AGILITY.forEach((id) => ok(s.includes('data-prop="' + id + '"'), 'training has the ' + id + ' obstacle')); }
Object.keys(SHOP).forEach((n) => { const s = PA.scene(n, {}); ok((s.match(/data-shop="([a-z]+)"/g) || []).length === 1 && s.includes('data-shop="' + SHOP[n] + '"'), n + ': one data-shop="' + SHOP[n] + '" door'); ok(/data-shop="[a-z]+" role="button" tabindex="0" aria-label="[^"]+"/.test(s), n + ': the door is a focusable button with a label'); });
TRAIL.forEach((n) => { const s = PA.scene(n, {}); ok((s.match(/data-hot="run"/g) || []).length === 1, n + ': one data-hot="run" gate'); });
['training', 'pool'].forEach((n) => ok(!/data-shop|data-hot/.test(PA.scene(n, {})), n + ': no shop or run gate'));
{ const s = PA.scene('pool', { season: 'winter' }), t = PA.scene('pool', { season: 'summer' }); ok(s.length > t.length + 2000, 'pool: the Winter Dome is drawn in winter'); }
{ const s = PA.scene('boutique', { aria: 'Boutique ES', ariaMap: { 'Bow-Wow Boutique': 'Tienda' } }); ok(/^<svg[^>]*aria-label="Boutique ES"/.test(s) && s.includes('aria-label="Tienda"'), 'the v2.14 aria / ariaMap layer relabels the scene and the door'); }
{ const s = PA.scene('sunflower', { ariaMap: { 'Start the run': 'Los!' } }); ok(s.includes('aria-label="Los!"'), 'the run gate label comes from the options'); }

sec('the floors (PawArt.FLOOR)');
SCENES.forEach((n) => {
  const F = PA.FLOOR[n], W = WIDE[n], P = F.poly;
  ok(F.w === W && F.back >= 330 && F.back <= 400 && F.front >= 580 && F.front <= 600, n + ': w ' + F.w + ', back ' + F.back + ', front ' + F.front);
  ok(F.kB > 0 && F.kB < F.kF && F.kF <= 1.1, n + ': depth scale ' + F.kB + ' to ' + F.kF);
  ok(Array.isArray(P) && P.length >= 3 && P.every((p) => p.length === 2 && p.every(Number.isFinite)), n + ': poly has 3 or more points');
  ok(P.every((p) => p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= 600), n + ': poly is inside the scene');
  ok(P.every((p, i) => { const q = P[(i + 1) % P.length]; return p[0] !== q[0] || p[1] !== q[1]; }), n + ': poly is closed (the last point joins the first, no repeats)');
  let simple = true; for (let i = 0; i < P.length; i++) for (let j = i + 2; j < P.length; j++) { if (i === 0 && j === P.length - 1) continue; if (segX(P[i], P[(i + 1) % P.length], P[j], P[(j + 1) % P.length])) simple = false; }
  ok(simple, n + ': poly does not cross itself');
  ok(Math.min(...P.map((p) => p[1])) === F.back, n + ': poly starts at the back line');
  ok(area(P) >= 1.5 * 880 * 180, n + ': floor area ' + Math.round(area(P)) + ' is at least 1.5x the v2.10 band (880 x 180)');
  ok(new Set(F.props.map((p) => p.id)).size === F.props.length, n + ': prop ids are unique');
  F.props.forEach((p) => {
    ok(Number.isFinite(p.base) && p.base > F.back && p.base < 600, n + ' prop ' + p.id + ': base on the floor');
    if (p.box) ok(p.box.length === 4 && p.box[2] > 0 && p.box[3] > 0 && inPoly(P, p.box[0] + p.box[2] / 2, p.box[1] + p.box[3] / 2) && p.box[1] + p.box[3] >= p.base - 2, n + ' prop ' + p.id + ': box on the floor at its base');
  });
  ok(new Set(F.spots.map((s) => s.id)).size === F.spots.length && F.spots.length >= 3, n + ': 3 or more spots with unique ids');
  F.spots.forEach((s) => {
    ok(inPoly(P, s.x, s.y), n + ' spot ' + s.id + ': on the floor');
    ok(Array.isArray(s.tags) && s.tags.length && typeof s.act === 'string', n + ' spot ' + s.id + ': tags and act');
    const hit = F.props.filter((p) => inBox(p.box, s.x, s.y) && p.id !== s.id && !(s.tags.includes('water') && p.id === 'pool'));
    ok(!hit.length, n + ' spot ' + s.id + ': outside the other props\' boxes' + (hit.length ? ' (' + hit.map((p) => p.id) + ')' : ''));
    if (s.path) ok(s.path.every((q) => inPoly(P, q[0], q[1]) || (s.tags.includes('water'))), n + ' spot ' + s.id + ': its path stays on the floor');
  });
});
{ const T = PA.FLOOR.training; AGILITY.forEach((id) => { ok(T.props.some((p) => p.id === id && p.box), 'training floor lists the ' + id + ' prop with a box'); ok(T.spots.some((s) => s.act === id || s.id === id), 'training has a ' + id + ' spot'); }); }
{ const L = PA.FLOOR.pool; ['paddle', 'ramp', 'sprinkler', 'shade'].forEach((id) => ok(L.spots.some((s) => s.id === id), 'pool has the ' + id + ' spot')); }
['boutique', 'builder', 'sprout'].forEach((n) => ['door', 'bowl', 'bench'].forEach((id) => ok(PA.FLOOR[n].spots.some((s) => s.id === id), n + ' has the ' + id + ' spot')));
TRAIL.forEach((n) => ['arch', 'rest', 'sniff'].forEach((id) => ok(PA.FLOOR[n].spots.some((s) => s.id === id), n + ' has the ' + id + ' spot')));
{ PA.FLOOR.training.poly[0][0] = -999; const again = load(BASE.concat(G)); ok(again.FLOOR.training.poly[0][0] === 24, 'each load gets its own FLOOR rows'); }

sec('the walk strips');
STRIPS.forEach((n) => {
  SEASONS.forEach((season) => FLAGS.forEach((fl) => { const o = Object.assign({ season }, fl), what = 'strip ' + n + ' ' + JSON.stringify(o), s = PA.walkStrip(n, o); clean(s, what); ids(s, what); ok((s.match(/viewBox="([^"]+)"/) || [])[1] === '0 0 1200 400', what + ': 1200 x 400'); }));
  [['night', 'rain'], ['dusk', 'snow']].forEach(([time, weather]) => { const s = PA.walkStrip(n, { time, weather }); clean(s, 'strip ' + n + ' ' + time); ids(s, 'strip ' + n + ' ' + time); });
  ok(norm(PA.walkStrip(n, {})) === norm(PA.walkStrip(n, {})), 'strip ' + n + ': deterministic');
  const plain = PA.walkStrip(n, {}), tw = PA.walkStrip(n, { time: 'night', weather: 'rain' }); ok(norm(plain).length !== norm(tw).length, 'strip ' + n + ': draws time and weather itself (walkrun artTW)');
});

sec('old names are untouched');
{
  const calls = [['scene', 'yard', {}], ['scene', 'dogpark', { jp: true }], ['scene', 'market', { season: 'winter' }], ['scene', 'tokyotower', {}], ['scene', 'map', { jp: true }], ['walkStrip', 'park', {}], ['walkStrip', 'hilltop', { season: 'autumn', halloween: true }], ['scene', 'nope', {}]];
  const a = load(BASE), b = load(BASE.concat(G));
  calls.forEach(([f, n, o]) => ok(a[f](n, Object.assign({}, o)) === b[f](n, Object.assign({}, o)), f + "('" + n + "') is byte-identical with world G loaded"));
  ok(!!b.JP && typeof b.JP.fuji === 'function', 'PawArt.JP is still there');
}

sec('size (PERF.md section 5: a lazy chunk at or under about 250 KB minified)');
{
  let esb = null; for (const d of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map((p) => path.join(p, 'esbuild')), 'esbuild')) { try { esb = require(d); break; } catch (e) { /* next */ } }
  const src = fs.readFileSync(path.join(ROOT, G), 'utf8');
  if (esb) { const min = esb.transformSync(src, { minify: true, charset: 'utf8' }).code.length; console.log('   minified ' + Math.round(min / 1024) + ' KB'); ok(min <= 250 * 1024, 'world G minified is ' + Math.round(min / 1024) + ' KB (<= 250)'); }
  else ok(src.length <= 400 * 1024, 'world G source is ' + Math.round(src.length / 1024) + ' KB (no esbuild: the source limit)');
}

// the strip seams: draw each strip at 1200 x 400 px and compare its first and last pixel columns around the ground line
(async () => {
  sec('the strip seams (headless page)');
  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) { /* below */ }
  ok(!!chromium, 'playwright is available for the seam check (export NODE_PATH=$(npm root -g))');
  if (chromium) {
    const br = await chromium.launch({ args: ['--ignore-certificate-errors'] }), pg = await br.newPage({ viewport: { width: 1200, height: 400 } });
    for (const n of STRIPS) for (const o of [{}, { season: 'winter', time: 'night' }, { season: 'autumn', jp: true, halloween: true, lights: true }]) {
      await pg.setContent(`<!doctype html><html><body style="margin:0">${PA.walkStrip(n, o).replace('<svg ', '<svg width="1200" height="400" ')}</body></html>`);
      const r = await pg.evaluate(() => new Promise((res) => {
        const svg = document.querySelector('svg'), xml = new XMLSerializer().serializeToString(svg), img = new Image();
        img.onload = () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 400; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
          const col = (cx) => x.getImageData(cx, 250, 1, 140).data, d = (a, b) => { const A = col(a), B = col(b); let t = 0; for (let i = 0; i < A.length; i += 4) for (let j = 0; j < 3; j++) t += Math.abs(A[i + j] - B[i + j]); return t / 140; };
          res({ seam: d(1199, 0), mid: (d(1197, 1198) + d(1198, 1199) + d(0, 1) + d(1, 2)) / 4, far: d(0, 600) }); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      }));
      ok(r.seam <= Math.max(30, r.mid * 2 + 12), 'strip ' + n + ' ' + JSON.stringify(o) + ': seamless at the edges (the seam differs ' + r.seam.toFixed(1) + ', neighbouring columns ' + r.mid.toFixed(1) + ', a far column ' + r.far.toFixed(1) + ')');if (process.env.SEAM_LOG) console.log('   ' + n + ' ' + JSON.stringify(o) + ' seam ' + r.seam.toFixed(1) + ' near ' + r.mid.toFixed(1) + ' far ' + r.far.toFixed(1));
    }
    await br.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILED'); process.exit(1); } else console.log('ALL OK');
})();
