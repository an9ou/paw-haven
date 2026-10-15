// v2.8 core dates and flags (plain node), V28.md sections 1, 10 and 12.1. Run: node game/test_v28_dates_node.js (or node game/run_tests.js v28_dates).
// Takes the real declarations out of game/src/00_core.js (and the v2.8 data out of 00_core.js, 03_yard.js, 24_missions.js) and runs them in a vm
// with a fake clock, a fake navigator.webdriver (the test harness) and a fake prefs / ENV:
//  - wnAuto on the section 10 dates, wnYear / nyYear around New Year, the JST rollover (2026-11-30T15:00Z is 1 December in Japan)
//  - festNow for every Dev panel override value and in auto, nyDays / nyEve, envNow's lights / newyear / jp
//  - the harness gates: no winter flag by date without prefs.wnTest (overrides still work), jpOn() false without prefs.jpTest
//  - v28Fields defaults, additive on an old save, idempotent; the item, decoration and mission entries of section 1. Prints ALL OK.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

let fail = 0, pass = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL ' + msg); } };
const sec = (t) => console.log('-- ' + t);
const J = (x) => JSON.stringify(x);

// one top-level declaration (function NAME / const NAME), by brace and bracket matching (strings skipped)
function decl(src, name) {
  const m = new RegExp(`^(function ${name}\\b|const ${name} =)`, 'm').exec(src); if (!m) throw new Error('not found in source: ' + name);
  let i = m.index, depth = 0, q = null, seen = false; const fn = m[1].startsWith('function');
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; if (depth === 0 && !fn && seen) break; continue; }
    if ('({['.includes(c)) { depth++; seen = true; } else if (')}]'.includes(c)) { depth--; if (fn && depth === 0 && c === '}') { i++; break; } }
    else if (!fn && depth === 0 && (c === ';' || (c === '\n' && seen))) { i++; break; }
  }
  return src.slice(m.index, i);
}

const CORE = SRC('00_core.js');
const NAMES = ['HW_ED', 'HW_WIN', 'jstISO', 'hwAuto', 'wnAllowed', 'wnAuto', 'wnYear', 'nyYear', 'FEST_OVR', 'festNow', 'festOn', 'nyDays', 'nyEve', 'jpOn', 'envNow', 'v28Obj', 'v28Fields', 'FOOD', 'CLOTHES', 'WARM_WEAR'];
const code = NAMES.map((n) => decl(CORE, n)).join('\n') + '\n' + decl(SRC('03_yard.js'), 'HM_DECOR') + '\n' + decl(SRC('24_missions.js'), 'MS_POOL') + '\n' +
  'Object.assign(globalThis.__x = {}, { jstISO, wnAuto, wnYear, nyYear, festNow, festOn, nyDays, nyEve, jpOn, envNow, v28Fields, FOOD, CLOTHES, WARM_WEAR, HM_DECOR, MS_POOL });';

const RealDate = Date, clock = { t: RealDate.parse('2026-07-01T03:00:00Z') };
class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(clock.t); } static now() { return clock.t; } }
const box = { navigator: { webdriver: false }, prefs: {}, ENV: { fest: 'auto', time: 'day', weather: 'cloudy', season: 'winter' }, Date: FakeDate, Math, JSON, Object, Array, String, Number,
  timePhase: () => 'day', weatherNow: () => 'cloudy', seasonNow: () => 'winter', S: null, localISO: () => '2026-12-10', topBond: () => 1, jpHillOpen: () => false, PLACES: {}, ROUTES: {}, TRICKS: [] };
box.globalThis = box; vm.createContext(box); vm.runInContext(code, box, { filename: 'core_v28_extract.js' });
const X = box.__x;
const at = (iso) => { clock.t = RealDate.parse(iso); }; // T03:00Z = noon in Japan, the same calendar day in UTC
const game = () => { box.navigator.webdriver = false; box.prefs = {}; };
const harness = (prefs) => { box.navigator.webdriver = true; box.prefs = prefs || {}; };
const flags = (o) => ['snow', 'lights', 'newyear'].filter((k) => o[k]).join('+') || 'none';

sec('wnAuto on the section 10 dates (the game, no harness)');
game();
for (const [d, want] of [['2026-11-30', 'none'], ['2026-12-01', 'snow+lights'], ['2026-12-25', 'snow+lights'], ['2026-12-26', 'snow+newyear'], ['2027-01-07', 'snow+newyear'],
  ['2027-01-08', 'snow'], ['2027-02-28', 'snow'], ['2027-03-01', 'none'], ['2028-02-29', 'snow'], ['2026-07-15', 'none'], ['2026-12-31', 'snow+newyear'], ['2027-01-01', 'snow+newyear']]) {
  const got = flags(X.wnAuto(d)); ok(got === want, `wnAuto('${d}') = ${want} (got ${got})`);
  ok(Object.keys(X.wnAuto(d)).sort().join() === 'lights,newyear,snow', `wnAuto('${d}') has exactly snow, lights, newyear`);
}

sec('wnYear and nyYear');
for (const [d, wy, ny] of [['2026-12-31', 2026, 2027], ['2027-01-01', 2026, 2027], ['2027-02-28', 2026, 2027], ['2027-03-01', 2027, 2027], ['2026-12-01', 2026, 2027], ['2026-11-30', 2026, 2026]]) {
  ok(X.wnYear(d) === wy, `wnYear('${d}') = ${wy} (got ${X.wnYear(d)})`);
  ok(X.nyYear(d) === ny, `nyYear('${d}') = ${ny} (got ${X.nyYear(d)})`);
}
at('2027-01-01T03:00:00Z'); ok(X.wnYear() === 2026 && X.nyYear() === 2027, 'with no argument they read the JST date (2027-01-01: winter year 2026, New Year 2027)');

sec('the JST rollover');
at('2026-11-30T14:59:00Z'); ok(X.jstISO() === '2026-11-30' && flags(X.wnAuto()) === 'none', `2026-11-30T14:59Z is still 30 November in Japan: no winter (${X.jstISO()}, ${flags(X.wnAuto())})`);
at('2026-11-30T15:00:00Z'); ok(X.jstISO() === '2026-12-01' && flags(X.wnAuto()) === 'snow+lights', `2026-11-30T15:00Z is 1 December in Japan: snow and lights (${X.jstISO()}, ${flags(X.wnAuto())})`);
ok(X.festOn('snow') && X.festOn('lights') && !X.festOn('newyear'), 'festOn follows it (snow, lights)');
at('2026-12-25T15:00:00Z'); ok(flags(X.wnAuto()) === 'snow+newyear', '2026-12-25T15:00Z is 26 December in Japan: the lights come down, the pine goes up');
at('2027-01-07T15:00:00Z'); ok(flags(X.wnAuto()) === 'snow', '2027-01-07T15:00Z is 8 January in Japan: snow only');

sec('festNow: every override value');
at('2026-07-01T03:00:00Z');
const want = { off: [0, 0, 0, 0, 0], leaf: [1, 0, 0, 0, 0], halloween: [0, 1, 0, 0, 0], both: [1, 1, 0, 0, 0], snow: [0, 0, 1, 0, 0], winter: [0, 0, 1, 1, 0], newyear: [0, 0, 1, 0, 1] };
const vec = (f) => ['leaf', 'halloween', 'snow', 'lights', 'newyear'].map((k) => (f[k] ? 1 : 0));
for (const mode of [game, harness]) {
  mode();
  for (const v of Object.keys(want)) { box.ENV.fest = v; const f = X.festNow(); ok(J(vec(f)) === J(want[v]) && Object.keys(f).length === 5, `${mode === game ? 'game' : 'harness'}: override '${v}' -> ${J(want[v])} (got ${J(vec(f))})`); }
}
box.ENV.fest = 'constructor'; ok(J(vec(X.festNow())) === J([0, 0, 0, 0, 0]), 'an unknown override value is auto (July: nothing on)');
box.ENV.fest = 'auto';

sec('festNow in auto (the game): Halloween, leaf and winter by date');
game();
for (const [iso, w] of [['2026-10-28T03:00:00Z', [1, 1, 0, 0, 0]], ['2026-11-15T03:00:00Z', [1, 0, 0, 0, 0]], ['2026-12-10T03:00:00Z', [0, 0, 1, 1, 0]], ['2026-12-28T03:00:00Z', [0, 0, 1, 0, 1]], ['2027-01-05T03:00:00Z', [0, 0, 1, 0, 1]], ['2027-02-10T03:00:00Z', [0, 0, 1, 0, 0]], ['2027-03-10T03:00:00Z', [0, 0, 0, 0, 0]]]) {
  at(iso); ok(J(vec(X.festNow())) === J(w), `${iso.slice(0, 10)}: ${J(w)} (got ${J(vec(X.festNow()))})`);
}

sec('festNow: leaf and snow never on together at the 30 Nov / 1 Dec JST boundary (a player west of Japan)');
const tz0 = process.env.TZ;
for (const tz of ['America/Los_Angeles', 'Europe/London', 'Asia/Tokyo']) {
  process.env.TZ = tz;
  for (const iso of ['2026-11-30T03:00:00Z', '2026-11-30T14:59:00Z', '2026-11-30T15:00:00Z', '2026-11-30T20:00:00Z', '2026-12-01T07:59:00Z', '2026-12-01T12:00:00Z']) {
    at(iso); const f = X.festNow(), dec = iso >= '2026-11-30T15:00:00Z';
    ok(!(f.leaf && f.snow) && f.leaf === !dec && f.snow === dec, `${tz} ${iso}: ${dec ? 'snow, no leaf' : 'leaf, no snow'} (got leaf ${f.leaf}, snow ${f.snow})`);
  }
}
if (tz0 === undefined) delete process.env.TZ; else process.env.TZ = tz0;

sec('the harness gate: no winter flag by date without prefs.wnTest');
at('2026-12-10T03:00:00Z'); harness();
ok(flags(X.wnAuto()) === 'none' && flags(X.wnAuto('2027-01-02')) === 'none', 'wnAuto is all false under the harness');
ok(!X.festOn('snow') && !X.festOn('lights') && !X.festOn('newyear'), 'festOn(snow / lights / newyear) false on 2026-12-10 in auto');
const e0 = X.envNow(); ok(e0.lights === false && e0.newyear === false && e0.jp === false, `envNow(): lights, newyear and jp false (${J(e0)})`);
harness({ wnTest: true });
ok(flags(X.wnAuto()) === 'snow+lights' && X.festOn('lights'), 'with prefs.wnTest the date counts again (snow and lights)');
const e1 = X.envNow(); ok(e1.lights === true && e1.newyear === false && e1.halloween === false && e1.jp === false, `envNow(): lights on, jp still off (${J(e1)})`);
harness({ jpTest: true }); ok(X.jpOn() === true && flags(X.wnAuto()) === 'none', 'prefs.jpTest opens jp only');
game(); ok(X.jpOn() === true && X.envNow().jp === true, 'jpOn() and envNow().jp are true in the game');
harness(); ok(X.jpOn() === false, 'jpOn() is false under the harness');

sec('nyDays and nyEve');
game();
for (const [iso, d, e] of [['2026-12-24T03:00:00Z', 0, 0], ['2026-12-26T03:00:00Z', 0, 1], ['2026-12-31T03:00:00Z', 0, 1], ['2027-01-01T03:00:00Z', 1, 0], ['2027-01-07T03:00:00Z', 1, 0], ['2027-01-08T03:00:00Z', 0, 0], ['2026-12-31T15:00:00Z', 1, 0]]) {
  at(iso); ok(!!X.nyDays() === !!d && !!X.nyEve() === !!e, `${iso}: nyDays ${!!d}, nyEve ${!!e} (got ${X.nyDays()}, ${X.nyEve()})`);
}
at('2026-07-01T03:00:00Z'); box.ENV.fest = 'newyear'; ok(X.nyDays() === true && X.nyEve() === false, 'the newyear override: nyDays any day, nyEve only on 26-31 December');
box.ENV.fest = 'winter'; ok(X.nyDays() === false, 'the winter override: no New Year days');
box.ENV.fest = 'auto'; at('2027-01-02T03:00:00Z'); harness(); ok(X.nyDays() === false, 'under the harness without wnTest: no New Year days on 2 January');

sec('v28Fields: defaults, additive, idempotent');
const fresh = X.v28Fields({});
ok(J(fresh.wn) === J({ letters: {}, drifts: {}, contest: {}, tips: {}, snowdog: { date: null, stage: 0, by: null, nose: true } }), `S.wn defaults (${J(fresh.wn)})`);
ok(J(fresh.ny) === J({ cards: null, fortune: { date: null, year: null, knots: 0 } }), `S.ny defaults (${J(fresh.ny)})`);
ok(J(fresh.jp) === J({ letter: null, gazed: null, first: null, mochi: null }), `S.jp defaults (${J(fresh.jp)})`);
const old = { v: 1, coins: 7, wn: { letters: { snow: 2026 }, snowdog: { stage: 3, by: 'd1', nose: false, date: '2026-12-10' } }, ny: { cards: 2027 }, jp: { gazed: '2026-12-01' } };
const mig = X.v28Fields(JSON.parse(J(old)));
ok(mig.v === 1 && mig.coins === 7 && mig.wn.letters.snow === 2026 && mig.wn.snowdog.stage === 3 && mig.wn.snowdog.nose === false && mig.ny.cards === 2027 && mig.ny.fortune.knots === 0 && mig.jp.gazed === '2026-12-01' && mig.jp.letter === null, 'an older v2.8 save keeps its values, the missing ones get defaults, v stays 1');
ok(J(X.v28Fields(JSON.parse(J(mig)))) === J(mig), 'running it twice changes nothing');
const bad = X.v28Fields({ wn: [], ny: 'x', jp: 5 }); ok(Array.isArray(bad.wn) === false && typeof bad.ny === 'object' && bad.jp.mochi === null, 'broken fields are replaced with the defaults');

sec('section 1 data: foods, clothes, warm wear, decorations, missions');
const F = (n) => X.FOOD.find((f) => f.n === n), C = (n) => X.CLOTHES.find((c) => c.n === n);
for (const [n, fe, pr] of [['Warm Carob Cup', 'snow', 8], ['Snowflake Oat Cookies', 'snow', 9], ['Snow Day Stew', 'snow', 14], ['Pup Kinton', 'newyear', 10]]) {
  const f = F(n); ok(f && f.fest === fe && f.price === pr && f.v28 === true && /\. .+\.$/.test(f.tip) && !!f.note, `food ${n}: fest ${fe}, ${pr} coins, v28, a two-sentence tip`);
}
ok(F('Warm Carob Cup').warm === 60 && F('Snow Day Stew').snack !== true && F('Snowflake Oat Cookies').bond === 1, 'the cup warms for an hour (the Warm Bone Broth rule), the stew is a meal, the cookies give Bond');
for (const [n, sl, fe, pr] of [['Very Ugly Sweater', 'body', 'snow', 65], ['Reindeer Antlers', 'head', 'snow', 55], ['Snowflake Snood', 'neck', 'snow', 50], ['Ugly Sweater Rosette', 'neck', 'lights', 0], ['Year of the Sheep Hood', 'head', 'newyear', 0]]) {
  const c = C(n); ok(c && c.slot === sl && c.fest === fe && c.price === pr && c.bond === 1 && c.v28 === true, `clothes ${n}: ${sl}, fest ${fe}, ${pr} coins`);
}
ok(C('Ugly Sweater Rosette').reward && C('Year of the Sheep Hood').reward && C('Year of the Sheep Hood').ed === 2027 && !C('Very Ugly Sweater').ed, 'the rosette and the hood are rewards, only the hood is ed 2027');
ok(['Very Ugly Sweater', 'Snowflake Snood', 'Year of the Sheep Hood'].every((n) => X.WARM_WEAR.includes(n)) && !X.WARM_WEAR.includes('Reindeer Antlers'), 'WARM_WEAR gains the sweater, the snood and the hood (not the antlers)');
for (const [n, prop, z, fe, pr, w, h] of [['Paper Snowflake Garland', 'wnsnowflakes', 'wall', 'snow', 90, 210, 56], ['Felt Holly Wreath', 'wnwreath', 'wall', 'snow', 80, 72, 72], ['Red Wooden Sled', 'wnsled', 'floor', 'snow', 110, 130, 78], ['Kadomatsu Pair', 'nykadomatsu', 'floor', 'newyear', 120, 80, 100]]) {
  const d = X.HM_DECOR[n]; ok(d && d.prop === prop && d.zone === z && d.fest === fe && d.price === pr && d.room === 'yard' && d.kind === 'decor' && d.v28 && !d.v27 && d.at[2] === w && d.at[3] === h, `decoration ${n}: ${prop}, ${z}, fest ${fe}, ${pr} coins, ${w}x${h}`);
}
const names = [...X.FOOD.map((f) => f.n), ...X.CLOTHES.map((c) => c.n), ...Object.keys(X.HM_DECOR)];
ok(new Set(names).size === names.length, 'no item name is used twice');
const ids = X.MS_POOL.map((m) => m.id);
ok(['snowdrift', 'snowdog', 'wstall', 'sweater', 'yearclean', 'fortune', 'gaze', 'hatsufuji', 'travel_fuji'].every((i) => ids.includes(i)) && new Set(ids).size === ids.length, 'the nine v2.8 missions are in the pool, ids unique');
const M = (i) => X.MS_POOL.find((m) => m.id === i);
ok(M('wstall').m({ kind: 'buy', shop: 'stall', cat: 'food', name: 'Pup Kinton' }) && !M('wstall').m({ kind: 'buy', shop: 'stall', cat: 'food', name: 'Baked Pumpkin Wedges' }) && !M('wstall').m({ kind: 'buy', shop: 'stall', cat: 'decor', name: 'Red Wooden Sled' }), 'wstall: a winter or New Year food from the stall, not a leaf food or a decoration');
ok(M('snowdog').m({ kind: 'snowdog', stage: 3, done: true }) && !M('snowdog').m({ kind: 'snowdog', stage: 2 }), 'snowdog counts the finished one only');
ok(M('hatsufuji').m({ kind: 'gaze', first: true }) && !M('hatsufuji').m({ kind: 'gaze' }) && M('travel_fuji').m({ kind: 'travel', place: 'fujihill' }) && !M('travel_fuji').m({ kind: 'travel', place: 'dogpark' }), 'hatsufuji needs first, travel_fuji the hill');
// the gates with the lane functions missing (the stub commit has them; this extract does not) and the hill closed: all false, nothing throws
box.ENV.fest = 'off'; harness();
let threw = ''; const open = ['snowdrift', 'snowdog', 'wstall', 'sweater', 'yearclean', 'fortune', 'travel_fuji'].filter((i) => { try { return M(i).g(); } catch (e) { threw += i + ' '; return false; } });
ok(!threw && !open.length, `with the festivals off and no lane code the winter and Fuji gates are all closed (open: ${open.join() || 'none'}${threw ? ', threw: ' + threw : ''})`);

console.log(`${pass} checks passed, ${fail} failed`);
if (!fail) console.log('ALL OK'); else process.exit(1);
