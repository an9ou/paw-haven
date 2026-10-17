// v2.11 TOKYO ART E test (plain node), V211.md section 5.4 (module E rows). Run: node game/test_v211_art_e_node.js (or node game/run_tests.js v211_art_e)
// world/pawart_world_e.js: the scenes tokyotower, ueno and odaiba for every time x weather x season (and the halloween / lights / newyear / jp / snow
// options) draw one valid 1000 x 600 SVG with no NaN, undefined, filter or script, their data-hot spots (stamp in all three, souvenir, hanami, sunset)
// and no place name in the art; the props ekistamp (7 keys, got or not), luckycat and the tokyo postcard frame and the 10 item icons render;
// everything is deterministic; and every name module E does not own (world B's postcard for every other frame, PawArt.postcard, the old scenes,
// items and props) is byte-identical to v211-base, called in the same order in two fresh contexts.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FILES = ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js'];

let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; } else { fail++; console.log('FAIL ' + msg); } }
function sec(t) { console.log('-- ' + t); }
function load(srcs) {
  const ctx = { window: {}, console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx);
  srcs.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'art' + i + '.js' }));
  return ctx.window.PawArt;
}
const cur = () => load(FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')));
const vbOf = (svg) => (svg.match(/viewBox="([^"]+)"/) || [])[1];
const norm = (s) => s.replace(/pw[a-z]+\d*[0-9a-z]*x?\d*/g, 'ID');
function clean(svg, what) {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), what + ' returns an SVG');
  ok(!/NaN|undefined|Infinity/.test(svg), what + ' has no NaN, undefined or Infinity');
  ok(!/<script/i.test(svg) && !/\son[a-z]+=/i.test(svg), what + ' has no script or event handler');
  ok(!/<filter/i.test(svg), what + ' uses no filter');
  ok(!/>\?<\/text>/.test(svg), what + ' is not the "?" placeholder');
  ok(![...svg.matchAll(/\sd="([^"]*)"/g)].some((m) => /--|[^\deE.\s,MmLlHhVvCcSsQqTtAaZz-]/.test(m[1]) || /^\s*[^Mm\s]/.test(m[1])), what + ' has well-formed path data');
}
// ids must be defined once and every url(#id) must point at one of them
function ids(svg, what) {
  const def = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]), set = new Set(def);
  ok(set.size === def.length, what + ': ids are unique');
  ok([...svg.matchAll(/url\(#([^)]+)\)/g)].every((m) => set.has(m[1])), what + ': every url(#id) is defined');
}

const PA = cur();
const SCENES = ['tokyotower', 'ueno', 'odaiba'], HOTS = { tokyotower: ['stamp', 'souvenir'], ueno: ['stamp', 'hanami'], odaiba: ['stamp', 'sunset'] };
const KEYS = ['shibuya', 'hachiko', 'yoyogi', 'asakusa', 'tokyotower', 'ueno', 'odaiba'];
const ITEMS = ['Shibuya Bandana', 'Asakusa Bandana', 'Tokyo Tower Bandana', 'Shinkansen Plush', 'Lucky Cat', 'Sweet Potato Chew', 'Dog Senbei', 'Stamp Book', 'Train Ticket', 'Paw'];
const PLACE_WORDS = /tokyo|ueno|odaiba|shiba|zojo|zōjō|rainbow|shinobazu|asakusa|shibuya|yoyogi|hachi/i;

sec('the module registers its names');
ok(SCENES.every((n) => PA.WORLD_E_SCENES.includes(n)) && PA.WORLD_E_SCENES.length === 3, 'WORLD_E_SCENES lists tokyotower, ueno, odaiba');
ok(['ekistamp', 'luckycat', 'postcard'].every((n) => PA.WORLD_E_PROPS.includes(n)), 'WORLD_E_PROPS lists ekistamp, luckycat, postcard');
ok(ITEMS.every((n) => PA.WORLD_E_ITEMS.includes(n)) && PA.WORLD_E_ITEMS.length === ITEMS.length, 'WORLD_E_ITEMS lists the 10 items');
ok(JSON.stringify(PA.STAMP_KEYS) === JSON.stringify(KEYS), 'PawArt.STAMP_KEYS are the seven stamp keys in order');
ok(PA.TOKYO_E && SCENES.every((n) => PA.TOKYO_E.floor[n] && HOTS[n].every((h) => PA.TOKYO_E.hot[n][h])), 'PawArt.TOKYO_E has the floor band and every hot-spot box');

sec('scenes: every time x weather x season, and the festival options');
const TIMES = ['dawn', 'day', 'dusk', 'night'], WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'], SEASONS = ['spring', 'summer', 'autumn', 'winter'];
let n = 0, maxLen = 0;
for (const sc of SCENES) {
  const seen = new Set();
  const opts = [undefined, {}, { junk: 1, time: 'noon' }];
  TIMES.forEach((time) => WEATHERS.forEach((weather) => SEASONS.forEach((season) => opts.push({ time, weather, season }))));
  [['dusk', 'winter'], ['night', 'winter'], ['day', 'autumn'], ['night', 'spring']].forEach(([time, season]) => {
    opts.push({ time, season, halloween: true }, { time, season, lights: true }, { time, season, newyear: true }, { time, season, jp: true }, { time, season, snow: true },
      { time, season, weather: 'rain', halloween: true, lights: true, newyear: true, jp: true });
  });
  for (const o of opts) {
    const s = PA.scene(sc, o), what = `${sc} ${JSON.stringify(o || null)}`; n++; maxLen = Math.max(maxLen, s.length);
    clean(s, what);
    ok(vbOf(s) === '0 0 1000 600', what + ' viewBox is 0 0 1000 600');
    ok((s.match(/<svg/g) || []).length === 1, what + ' is one svg element');
    ok(HOTS[sc].every((h) => (s.match(new RegExp(`data-hot="${h}"`, 'g')) || []).length === 1), what + ' has its data-hot spots once each');
    ok(/class="pa-wc-hit"/.test(s) && /class="pa-wc-hl"/.test(s), what + ' hot spots use the world C hit and hover shapes');
    ok(!/<text/.test(s), what + ' writes no text (no place name in the art)');
    ok(/data-floor="60,42\d,940,590"/.test(s), what + ' carries data-floor');
    if (o && o.time === 'night' && !o.weather) ok(/data-time="night"/.test(s), what + ' is marked night');
    seen.add(s.replace(/pwe\d+x\d+/g, 'ID').replace(/pwe\d+/g, 'ID').length);
    if (o === undefined || (o && o.time === 'day' && o.weather === 'sunny' && o.season === 'summer')) ids(s, what);
  }
  ok(seen.size > 40, `${sc}: the variants differ (${seen.size} distinct)`);
}
ok(maxLen < 520000, `the biggest scene stays under 520 KB (${Math.round(maxLen / 1024)} KB)`);
console.log(`   ${n} scene renders`);

sec('scenes: details by option');
{
  const sp = PA.scene('ueno', { season: 'spring' }), au = PA.scene('ueno', { season: 'autumn' }), wi = PA.scene('ueno', { season: 'winter' }), su = PA.scene('ueno', { season: 'summer' });
  const bloom = (x) => [...x.matchAll(/data-bloom="(\w+)"/g)].map((m) => m[1]).join(',');
  ok(bloom(sp) === 'spring,spring' && /#F9D3DE/.test(sp) && !/#F9D3DE/.test(su), 'ueno: both cherry trees in pink blossom in spring');
  ok(bloom(au) === 'autumn,autumn' && (au.match(/stroke-width=".6" stroke-linejoin="round"/g) || []).length > 30 + (su.match(/stroke-width=".6" stroke-linejoin="round"/g) || []).length, 'ueno: momiji red in autumn');
  ok(bloom(wi) === 'winter,winter' && wi.length < su.length && !/#F9D3DE/.test(wi), 'ueno: bare trees in winter');
  ok(bloom(su) === 'summer,summer', 'ueno: green in summer');
  const day = PA.scene('tokyotower', { time: 'day' }), night = PA.scene('tokyotower', { time: 'night' }), lt = PA.scene('tokyotower', { time: 'night', lights: true });
  ok(!/#FFB45A/.test(day) && /#FFB45A/.test(night), 'tokyotower: the tower glows at night, not by day');
  ok(lt.length > night.length && /data-lights="1"/.test(lt), 'tokyotower: more lights with o.lights');
  ok(/pa-tk-tower/.test(day), 'tokyotower: the tower is in its own group');
  const dusk = PA.scene('odaiba', { time: 'dusk' }), od = PA.scene('odaiba', {});
  ok(/#F7E4B5/.test(od), 'odaiba: the sand floor');
  ok(dusk.length > od.length && /data-time="dusk"/.test(dusk), 'odaiba: the dusk adds its warm sky');
  ok(/data-weather="snow"/.test(PA.scene('odaiba', { snow: true })) && norm(PA.scene('odaiba', { snow: true })) === norm(PA.scene('odaiba', { weather: 'snow' })), 'o.snow reads as snowy weather');
  SCENES.forEach((sc) => ok(/data-halloween="1"/.test(PA.scene(sc, { halloween: true })) && /data-newyear="1"/.test(PA.scene(sc, { newyear: true })), sc + ': halloween and newyear are marked'));
  SCENES.forEach((sc) => { const a = PA.scene(sc, { time: 'dusk', season: 'autumn' }), b = PA.scene(sc, { time: 'dusk', season: 'autumn' }); ok(norm(a) === norm(b), sc + ': deterministic (same option set, same drawing)'); });
}

sec('hot spots: inside the phone crop, at the back corners, out of the floor band middle');
for (const sc of SCENES) {
  const fb = PA.TOKYO_E.floor[sc]; ok(fb[0] === 60 && fb[2] === 940 && fb[1] >= 420 && fb[1] <= 430 && fb[3] === 590, sc + ': floor band x 60-940, y 42x-590');
  for (const h of HOTS[sc]) {
    const [x, y, w, hh] = PA.TOKYO_E.hot[sc][h];
    ok(x >= 150 && x + w <= 850, `${sc} ${h}: inside the phone crop x 150-850 (${x}..${x + w})`);
    ok(x + w <= 380 || x >= 620, `${sc} ${h}: clear of the band middle x 380-620`);
    ok(w >= 44 && hh >= 44, `${sc} ${h}: at least 44 units each way`);
    ok(y + hh <= 520, `${sc} ${h}: at the back of the band`);
  }
}

sec('props: ekistamp, luckycat, the tokyo postcard frame');
for (const key of KEYS) for (const got of [true, false]) {
  const s = PA.prop('ekistamp', { key, got }), what = `ekistamp ${key} ${got}`; clean(s, what); ids(s, what);
  ok(vbOf(s) === '0 0 120 120', what + ' viewBox is 0 0 120 120');
  ok(new RegExp(`data-key="${key}"`).test(s) && new RegExp(`data-got="${got ? 1 : 0}"`).test(s), what + ' carries data-key and data-got');
  if (!got) ok(/stroke-dasharray/.test(s) && s.length < 4000, what + ' is the faint dashed circle');
  else ok(s.length > 4000, what + ' is the full stamp');
}
{
  const got = KEYS.map((k) => norm(PA.prop('ekistamp', { key: k, got: true })));
  ok(new Set(got).size === 7, 'the seven stamps are seven different designs');
  ok(PA.prop('ekistamp', { key: 'nope', got: true }) && /data-key="shibuya"/.test(PA.prop('ekistamp', { key: 'nope' })), 'an unknown key falls back to shibuya');
  const lc = PA.prop('luckycat'), li = PA.prop('luckycat', { indoor: true }), ln = PA.prop('luckycat', { indoor: true, time: 'night' });
  [lc, li, ln].forEach((s, i) => { clean(s, 'luckycat ' + i); ok(vbOf(s) === '0 0 80 100', 'luckycat ' + i + ' viewBox is 0 0 80 100'); });
  ok(lc !== li && /data-indoor="1"/.test(li), 'luckycat takes o.indoor');
  ok(ln !== li, 'luckycat with o.time takes the indoor tint');
  const pc = PA.prop('postcard', { frame: 'tokyo' }), pc2 = PA.prop('postcard', { frame: 'tokyo', w: 900, h: 640, caption: 'Day out', place: 'Somewhere', date: '2026-10-17', dogs: 'Mochi', scene: '<rect x="20" y="20" width="10" height="10" fill="#abc"/>' });
  clean(pc, 'tokyo postcard'); clean(pc2, 'tokyo postcard sized'); ids(pc2, 'tokyo postcard sized');
  ok(vbOf(pc) === '0 0 300 200' && /data-frame="tokyo"/.test(pc), 'tokyo postcard defaults to 300 x 200');
  ok(vbOf(pc2) === '0 0 900 640' && /fill="#abc"/.test(pc2) && />Day out</.test(pc2), 'tokyo postcard takes w, h, the scene and the caption');
  ok(['#3F8F6A', '#8A5A9E', '#C2922A', '#D2463A', '#E0713A', '#D45A8A', '#3F78B8'].every((c) => pc.includes(c)), 'the seven stamp inks are round the frame');
  if (PA.postcard) { const a = PA.postcard(1080, 760, { frame: 'tokyo', caption: 'Hi' }); clean(a, 'PawArt.postcard tokyo'); ok(/data-frame="tokyo"/.test(a) && vbOf(a) === '0 0 1080 760', 'PawArt.postcard(w, h, { frame: "tokyo" }) draws the Tokyo frame'); }
}

sec('items: the 10 icons');
for (const it of ITEMS) { const s = PA.item(it); clean(s, it); ids(s, it); ok(vbOf(s) === '0 0 64 64', it + ' viewBox is 0 0 64 64'); ok(s.length > 1500, it + ' has real content'); }
ok(new Set(ITEMS.map((i) => norm(PA.item(i)))).size === ITEMS.length, 'the 10 icons are all different');

sec('names module E does not own are byte-identical to v211-base');
{
  let OLD = null;
  for (const ref of ['v211-base', 'origin/v211-base', '97a2fc0']) {
    try { OLD = FILES.slice(0, 4).map((f) => execFileSync('git', ['-C', ROOT, 'show', ref + ':' + f], { stdio: ['ignore', 'pipe', 'ignore'] }).toString()); break; } catch (e) { OLD = null; }
  }
  ok(!!OLD, 'git show v211-base works');
  if (OLD) {
    const A = load(OLD), B = cur();
    const calls = [];
    // world B's postcard prop and PawArt.postcard for every other frame (no frame, other frame names, every colour)
    [undefined, {}, { frame: 'rose' }, { frame: 'TOKYO' }, { frame: 'kyoto' }, { color: 'mint' }].forEach((o) => calls.push(['prop', 'postcard', o]));
    ['rose', 'sun', 'mint', 'sky', 'lilac', undefined].forEach((color) => calls.push(['postcard', 1080, 760, { color, caption: 'A day out', place: 'Pier', date: '17 Oct', dogs: 'Mochi', stamp: 'Bond 7' }]));
    calls.push(['postcard', 640, 900, { frame: 'none', color: 'sky' }]);
    // a sample of old scenes, props, items and icons
    ['square', 'pier', 'hilltop', 'fujihill', 'park', 'yard'].forEach((sc) => [{}, { time: 'night', season: 'autumn' }, { time: 'dusk', weather: 'snow', lights: true }].forEach((o) => calls.push(['scene', sc, o])));
    ['mailbox', 'stampcard', 'photoframe', 'moonlamp', 'adoptboard', 'nykadomatsu'].forEach((p) => calls.push(['prop', p, { stamps: 3, n: 2 }]));
    ['Red Bandana', 'Tennis Ball', 'Plush Bone', 'Kadomatsu Pair', 'Squeaky Duck'].forEach((i) => calls.push(['item', i]));
    ['camera', 'fuji', 'stamp'].forEach((i) => calls.push(['icon', i]));
    let same = 0;
    for (const c of calls) {
      const f = (P) => (c[0] === 'postcard' ? P.postcard(c[1], c[2], c[3]) : P[c[0]](c[1], c[2]));
      const a = f(A), b = f(B), lbl = c.slice(0, 2).join(' ') + ' ' + JSON.stringify(c[c.length - 1] || null);
      ok(a === b, lbl + ' is byte-identical to v211-base'); if (a === b) same++;
    }
    console.log(`   ${same} of ${calls.length} old calls byte-identical`);
    ok(A.WORLD_B && JSON.stringify(A.WORLD_B.items) === JSON.stringify(B.WORLD_B.items), 'world B lists the same items');
  }
}

console.log(`\nv211_art_e: ${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED'); process.exit(1); }
console.log('ALL OK');
