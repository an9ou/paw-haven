/* ======================= v2.22 "Town levels and dog habits": part A, the core (V222.md) =======================
   Two ladders: the player's town level (1-20, this file) opens places, walks, Tokyo, the garden and kitchen, Fun Fair games and the
   shop rows; Bond (per dog) keeps tricks, habits, the Bond 2 party, the Bond track gifts and dog spots.
   Behind the v2.20 switch: lvOn() = ms2On() && lvAllowed(). Off means off: every gate is today's topBond() test, and nothing writes
   S.lv except the floor sync (V222.md 5.4).
   Save field S.lv (V222.md 5.1, additive; S.v stays 1):
     xp      every XP ever earned (only grows; counts on past level 20)
     lv      the town level 1-20, shown  the last level whose card was shown (part C)
     day     the Japan date (jstISO) of today / src, today  daily XP so far (cap LV_CAP)
     src     { care, walk, ms, help, wish, ff, home, fr: events counted today, wn: the last walk number of the day that gave XP }
     seen    { placeOrRouteId: 1 } first visits counted, bl  { dogId: highest Bond level counted }
     floor   the top Bond while the switch was off (everything at or under it stays open), got  { 10: 1, 20: 1 } titles given
     mail    0 = the habits letter is owed (an old save), 1 = sent or not needed, from  'fresh' | 'old'
     once    { key: 1 } one-time milestones (badge tiers, notebook pages, help-wanted boards)
     st      { n: stickers earned past level 20, xp: XP into the next star, shown: the last star whose moment was shown }
   No coins anywhere in this file. Test hook: window.__paw.lv. */

const LV_MAX = 20, LV_CAP = 150, LV_STAR = 1000; // LV_STAR: XP per crayon star past level 20 (about a week of daily play: 150 a day + milestones)
// XP at the start of each level (index = level; 0 unused)
const LV_AT = [0, 0, 60, 140, 260, 420, 620, 860, 1140, 1460, 1820, 2270, 2770, 3320, 3920, 4570, 5270, 6020, 6820, 7670, 8570];
// the town level every row with Bond b is open by (index = Bond; 0 unused): a row this table misses never opens later than this
const LV_FLOOR = [1, 1, 8, 8, 11, 13, 15, 17, 19, 20, 20];
// walk XP by route (the first WALK_FULL walks of a Japan day)
const LV_WALK = { park: 8, town: 8, sunflower: 10, river: 10, hilltop: 11, bamboo: 11, woods: 12, pier: 12, cliffs: 13, beach: 14 };
// daily sources: XP per event and events a Japan day (V222.md 2.1)
const LV_SRC = { care: [2, 15], walk: [0, WALK_FULL], ms: [20, 1], help: [10, 2], wish: [10, 2], ff: [5, 4], home: [3, 5], fr: [5, 2] };
const LV_MILE = { visit: 15, bond: 20, board: 40, badge: 15, nb: 10 }; // milestones: outside the cap, each once
const LV_CARE = ['feed', 'pet', 'fetch', 'toy', 'bath', 'nap', 'trick', 'scoop', 'photo'];
const LV_TITLES = { 10: 'Friendly Neighbour', 20: 'Town Favourite' };
// the unlock table (V222.md 3.2). Level 1 = every Bond 1 row today, so those need no entry
const LV_UNLOCK = (() => {
  const T = {}, put = (L, kind, ids) => ids.forEach((id) => { T[kind + ':' + id] = L; });
  put(2, 'place', ['dogpark']); put(2, 'feat', ['garden']); put(2, 'ff', ['seek']);
  put(2, 'item', ['Bow Tie', 'Rain Hat', 'Bone-shaped Biscuit', 'Snuffle Mat', 'Sofa Ramp']);
  put(3, 'place', ['pool', 'fujihill']); put(3, 'ff', ['paper', 'bakery']); put(3, 'feat', ['stall']);
  put(3, 'item', ['Classic Wooden Doghouse', 'Yellow Raincoat', 'Chef Hat', 'Tutu', 'Treat Cone', 'Fluffy Donut Bed', 'Ball Pit']);
  put(4, 'place', ['training']); put(4, 'feat', ['kitchen']); put(4, 'ff', ['bubble']);
  put(4, 'item', ['Cowboy Hat', 'Pyjamas', 'Polka-dot Raincoat', 'Window Seat']);
  put(5, 'place', ['salon']); put(5, 'ff', ['wash']);
  put(5, 'item', ['Little Tea House', 'Frisbee', 'Party Hat', 'Flower Crown', 'Banana Bed', 'Dog Play Tower']);
  put(6, 'place', ['station', 'shibuya', 'yoyogi']);
  put(6, 'item', ['Bubble Machine', 'Pom-pom Beanie', 'Hammock Cot', 'Tunnel Sofa']);
  put(7, 'route', ['sunflower']); put(7, 'place', ['sunflower']); put(7, 'item', ['Frog Raincoat', 'Bumblebee Suit']);
  put(8, 'route', ['river']); put(8, 'place', ['river']); put(8, 'item', ['Happi Coat']);
  put(9, 'route', ['hilltop']); put(9, 'place', ['hilltop']); put(9, 'ff', ['show']); put(9, 'item', ['Cozy Cottage', 'Knit Winter Sweater']);
  put(10, 'route', ['bamboo']); put(10, 'place', ['bamboo', 'asakusa']); put(10, 'item', ['Puzzle Feeder', 'Wizard Hat']);
  put(11, 'place', ['ueno']); put(11, 'ff', ['kite']); put(11, 'item', ['Beach Hut', 'Paddling Pool']);
  put(12, 'route', ['woods']); put(12, 'place', ['woods']); put(12, 'item', ['Heart Sunglasses']);
  put(13, 'place', ['tokyotower']); put(13, 'item', ['Camper Van', 'Agility Tunnel', 'Bubble Raincoat']);
  put(14, 'route', ['pier']); put(14, 'place', ['pier']); put(14, 'item', ['Snow Igloo', 'Cloud Bed']);
  put(15, 'place', ['odaiba']); put(15, 'item', ['Pumpkin Cottage', 'Superhero Cape']);
  put(16, 'route', ['cliffs']); put(16, 'place', ['cliffs']);
  put(17, 'item', ['Treehouse Den']);
  put(18, 'route', ['beach']); put(18, 'place', ['beach']);
  put(19, 'item', ['Lighthouse Kennel', 'Royal Canopy Bed']);
  put(20, 'item', ['Royal Castle Kennel']);
  return T;
})();
const LV_FEAT_BOND = { garden: 2, kitchen: 3, stall: 2 }; // today's Bond for the features (gardenUnlocked, kitchenUnlocked, the ffstall mission)
let lvQueue = []; // levels reached and not yet shown (part C's card reads it)

/* ---------------- the switch ---------------- */
// under the test harness levels need prefs.lvTest (like msTest), so older suites never see them, even those that turn on ms2Test
function lvAllowed() { return !navigator.webdriver || !!prefs.lvTest; }
function lvOn() { return typeof ms2On === 'function' && ms2On() && lvAllowed(); }
const lvB = (b) => Math.max(1, Math.min(10, Math.floor(+b) || 1));
const lvTopOf = (s) => (s && Array.isArray(s.dogs) && s.dogs.length ? Math.max(1, ...s.dogs.map((d) => lvB(d && d.bond && d.bond.level))) : 1);
function lvOf(xp) { let L = 1; while (L < LV_MAX && xp >= LV_AT[L + 1]) L++; return L; }
function lvLevel() { return lvOn() && S && S.lv ? S.lv.lv || 1 : 1; }

/* ---------------- the gate helpers (V222.md 3.1) ---------------- */
function wNeed(kind, id, bond) {
  if (!lvOn()) return bond || 1;
  const L = LV_UNLOCK[kind + ':' + id];
  return typeof L === 'number' ? L : LV_FLOOR[lvB(bond)];
}
function wOpen(kind, id, bond) {
  // an old save before its first load with the switch on (no S.lv yet) keeps today's test, so turning on never closes anything
  if (!lvOn() || !S || !S.lv) return topBond() >= (bond || 1);
  return lvLevel() >= wNeed(kind, id, bond) || (bond || 1) <= (S.lv.floor || 0);
}
// every row a level gates today, over the live tables: { kind, id, bond: the Bond today's gate tests, own: the data row's Bond }.
// Festival, edition, Festive Market, Tokyo souvenir, reward and treasure rows keep their own rules and are not here; nor is the Gene Sniffer (Bond 6)
function lvLiveRows() {
  const R = [], add = (kind, id, bond, own) => R.push({ kind, id, bond: bond || 1, own: own || bond || 1 });
  Object.keys(PLACES).forEach((k) => { const p = PLACES[k]; if (!p.fm) add('place', k, p.bond); });
  Object.keys(ROUTES).forEach((k) => add('route', k, ROUTES[k].bond));
  if (typeof FF_GAMES === 'object') Object.keys(FF_GAMES).forEach((k) => add('ff', k, FF_GAMES[k].bond));
  Object.keys(LV_FEAT_BOND).forEach((k) => add('feat', k, LV_FEAT_BOND[k]));
  const shop = (x) => !x.reward && !x.fest && !x.ed && !x.fm && !x.tokyo && !x.treasure;
  FOOD.filter((f) => f.price > 0 && shop(f)).forEach((f) => add('item', f.n, 1, f.bond)); // Kibble Corner sells every food row at Bond 1 today
  TOYS.filter(shop).forEach((x) => add('item', x.n, x.bond));
  CLOTHES.filter(shop).forEach((x) => add('item', x.n, x.bond));
  HOUSES.filter(shop).forEach((x) => add('item', x.n, x.bond));
  if (typeof BEDS !== 'undefined') BEDS.filter(shop).forEach((x) => add('item', x.n, x.bond));
  if (typeof HM_DECOR === 'object') Object.keys(HM_DECOR).forEach((n) => { const d = HM_DECOR[n]; if (d.v27 && shop(d)) add('item', n, d.bond); });
  return R;
}
// the rows a level opens, only those that exist now (part C turns them into the card's lines)
function lvRowsAt(n) {
  const live = new Set(lvLiveRows().map((r) => r.kind + ':' + r.id));
  return Object.keys(LV_UNLOCK).filter((k) => LV_UNLOCK[k] === n && live.has(k)).map((k) => { const i = k.indexOf(':'); return { kind: k.slice(0, i), id: k.slice(i + 1) }; });
}

/* ---------------- save fields (V222.md 5) ---------------- */
const lvObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const lvNum = (o, k, d) => { if (typeof o[k] !== 'number' || !(o[k] >= 0) || !isFinite(o[k])) o[k] = d; };
function lvFix(L) {
  lvNum(L, 'xp', 0); lvNum(L, 'today', 0); lvNum(L, 'floor', 0);
  L.lv = Math.max(1, Math.min(LV_MAX, Math.floor(+L.lv) || 1));
  lvNum(L, 'shown', L.lv); if (typeof L.day !== 'string') L.day = '';
  ['src', 'seen', 'bl', 'got', 'once'].forEach((k) => { if (!lvObj(L[k])) L[k] = {}; });
  if (L.mail !== 0 && L.mail !== 1) L.mail = 1; if (L.from !== 'fresh' && L.from !== 'old') L.from = 'old';
  if (!lvObj(L.st)) L.st = {}; lvNum(L.st, 'n', 0); lvNum(L.st, 'xp', 0); lvNum(L.st, 'shown', 0);
  return L;
}
// the titles of levels 10 and 20, given quietly (the level card or the letter says so): into s.titles like titleGive, without its toast
function lvTitles(s) {
  const L = s.lv;
  [10, 20].forEach((n) => {
    if (L.lv < n || L.got[n]) return; L.got[n] = 1;
    if (!lvObj(s.titles)) s.titles = {}; const t = LV_TITLES[n];
    if (!s.titles[t]) s.titles[t] = typeof localISO === 'function' ? localISO() : '';
    if (!s.title) s.title = t;
  });
}
function lvFresh(s) {
  const dogs = Array.isArray(s.dogs) && s.dogs.length ? s.dogs : s.dog ? [s.dog] : [], bl = {};
  dogs.forEach((d) => { if (d && d.id) bl[d.id] = lvB(d.bond && d.bond.level); });
  s.lv = lvFix({ xp: 0, lv: 1, shown: 1, day: '', today: 0, src: {}, seen: { yard: 1, house: 1 }, bl, floor: 0, got: {}, mail: 1, from: 'fresh', once: {}, st: { n: 0, xp: 0, shown: 0 } });
  return s.lv;
}
// an old save, the first time it loads with the switch on (V222.md 5.2). Once: only when s.lv is missing
function lvStart(s) {
  if (!s || lvObj(s.lv)) return s && s.lv;
  const dogs = Array.isArray(s.dogs) ? s.dogs.filter(Boolean) : [], tb = lvTopOf(s);
  const pv = s.dd && lvObj(s.dd.pv) ? Object.keys(s.dd.pv) : [], m = lvObj(s.missions) ? s.missions : {};
  const n = (v) => (typeof v === 'number' && v > 0 && isFinite(v) ? v : 0);
  const est = 90 * Math.min(n(s.careDays), 90) + 15 * pv.length + 20 * dogs.reduce((a, d) => a + lvB(d.bond && d.bond.level) - 1, 0) + 10 * (n(m.stamps) + 7 * n(m.cards));
  const lv = Math.max(lvOf(est), LV_FLOOR[tb]);
  const seen = { yard: 1, house: 1 }; pv.forEach((k) => { seen[k] = 1; });
  const bl = {}; dogs.forEach((d) => { if (d.id) bl[d.id] = lvB(d.bond && d.bond.level); });
  s.lv = lvFix({ xp: Math.min(Math.max(est, LV_AT[lv]), LV_AT[LV_MAX]), lv, shown: lv, day: '', today: 0, src: {}, seen, bl, floor: tb, got: {}, mail: 0, from: 'old', once: {}, st: { n: 0, xp: 0, shown: 0 } });
  lvTitles(s); // old players at level 20 start at star 0: no stickers are backfilled
  return s.lv;
}
// every load (V222.md 5.4): off, the floor follows the top Bond (so Bond earned while off never closes when it turns back on); on, the level is at least the floor's
function lvSync(s) {
  if (!s || !lvObj(s.lv)) return s;
  const L = lvFix(s.lv);
  if (!lvOn()) { L.floor = Math.max(L.floor, lvTopOf(s)); return s; }
  const f = L.floor >= 1 ? LV_FLOOR[lvB(L.floor)] : 1, to = Math.max(L.lv, f, lvOf(L.xp));
  if (to > L.lv) { L.lv = to; L.shown = Math.max(L.shown, to); } // quiet, like lvStart: what the floor opens was open already
  L.xp = Math.max(L.xp, LV_AT[L.lv]);
  (Array.isArray(s.dogs) ? s.dogs : []).forEach((d) => { if (d && d.id) L.bl[d.id] = Math.max(L.bl[d.id] || 0, lvB(d.bond && d.bond.level)); }); // Bond reached while off gives no XP later
  lvTitles(s);
  return s;
}
// the one call from migrate() and freshState(): additive, runs lvStart once
function v222Fields(s, fresh) {
  if (!s) return s;
  if (lvObj(s.lv)) return lvSync(s);
  if (s.lv !== undefined) delete s.lv; // a broken value (never written by the game) is rebuilt like a missing one
  if (!lvOn()) return s; // off: nothing is written
  if (fresh) lvFresh(s); else lvStart(s);
  return lvSync(s);
}
// the switch turned on during a session (the dev switch, the test copy): start then, as a load would
function lvEnsure() { if (S && !lvObj(S.lv) && lvOn()) { v222Fields(S, false); markDirty(); } return !!(S && S.lv); }

/* ---------------- XP (V222.md 2) ---------------- */
function lvDay() {
  if (!lvEnsure()) return null;
  const L = S.lv, j = jstISO();
  if (L.day !== j) { L.day = j; L.today = 0; L.src = {}; markDirty(); }
  return L;
}
// the only writer of XP. src: a daily source (LV_SRC) or a milestone (LV_MILE). o.once: a key counted only once ever. Returns the XP given
function lvGain(src, n, o) {
  o = o || {};
  if (!S || !lvOn() || (typeof cur === 'object' && cur && cur.mode === 'title')) return 0;
  const L = lvDay(); if (!L) return 0;
  n = Math.floor(+n); if (!(n > 0)) return 0;
  if (o.once) { if (L.once[o.once]) return 0; L.once[o.once] = 1; }
  let g = n;
  if (LV_SRC[src]) {
    const c = L.src[src] || 0; if (c >= LV_SRC[src][1]) return 0;
    g = Math.min(n, Math.max(0, LV_CAP - L.today)); if (g <= 0) return 0; // the cap: a quiet "more tomorrow"
    L.src[src] = c + 1; L.today += g;
  } else if (!LV_MILE[src]) return 0;
  const was = L.lv; L.xp += g;
  while (L.lv < LV_MAX && L.xp >= LV_AT[L.lv + 1]) { L.lv++; lvQueue.push(L.lv); }
  if (L.lv >= LV_MAX) { // past level 20: the XP fills a crayon star, each full star is one sticker (cosmetic, part E adds the set)
    L.st.xp += was >= LV_MAX ? g : Math.max(0, L.xp - LV_AT[LV_MAX]);
    while (L.st.xp >= LV_STAR) { L.st.xp -= LV_STAR; L.st.n++; }
  }
  if (L.lv > was) lvTitles(S);
  markDirty();
  emit('lv:gain', { src, n: g, lv: L.lv, up: L.lv > was, star: L.st.n });
  return g;
}
// a dog reached a new Bond level (addBond's level loop): 20 XP a level, once per dog and level. Off: only the floor follows
function lvBond(id, level) {
  if (!S || !id) return 0;
  if (!lvOn()) { if (lvObj(S.lv)) S.lv.floor = Math.max(S.lv.floor || 0, lvB(level)); return 0; }
  if (!lvEnsure()) return 0;
  const L = S.lv, from = L.bl[id] || 1, to = lvB(level); if (to <= from) return 0;
  L.bl[id] = to; markDirty();
  return lvGain('bond', LV_MILE.bond * (to - from));
}
// a first visit to a place or a walk route (a place and the route with the same id count once)
function lvVisit(id) {
  if (!id || !S || !S.lv || S.lv.seen[id]) return 0;
  S.lv.seen[id] = 1; markDirty();
  return lvGain('visit', LV_MILE.visit);
}
function lvOnAct(a) {
  if (!a || !a.kind || !S || !lvOn() || !lvEnsure()) return;
  const k = a.kind;
  if (LV_CARE.includes(k)) lvGain('care', LV_SRC.care[0]); // one per act: a pack act counts once
  else if (k === 'walk' && a.area) {
    if (ROUTES[a.area]) lvVisit(a.area);
    const L = lvDay(), wn = (S.daily && S.daily.walks) || 0;
    if (L && wn >= 1 && wn <= WALK_FULL && wn > (L.src.wn || 0)) { L.src.wn = wn; lvGain('walk', LV_WALK[a.area] || LV_WALK.park); } // only the full-pay walks (walkCount ran just before the act)
  } else if (k === 'travel' && a.place) { if (PLACES[a.place]) lvVisit(a.place); }
  else if (k === 'wish') lvGain('wish', LV_SRC.wish[0]);
  else if (k === 'funfair') lvGain('ff', LV_SRC.ff[0]);
  else if ((k === 'garden' && a.what === 'harvest') || k === 'cook') lvGain('home', LV_SRC.home[0]);
  else if (k === 'frvisit' && typeof frOn === 'function' && frOn()) lvGain('fr', LV_SRC.fr[0]);
}
on('act', lvOnAct);

/* ---------------- the habits letter for an old save (V222.md 5.2 step 7; part D may dress it) ---------------- */
function lvMailSend() {
  if (!S || !lvOn() || !lvObj(S.lv) || S.lv.mail !== 0 || typeof mailPush !== 'function' || !Array.isArray(S.dogs) || !S.dogs.length) return false;
  const names = typeof tlist === 'function' ? tlist(S.dogs.map((d) => d.name)) : S.dogs.map((d) => d.name).join(', ');
  const title = S.dogs.length === 1 ? tt('hb.mail_one', "{name}'s habits", { name: S.dogs[0].name }) : tt('hb.mail_many', "Your pack's habits");
  const text = tt('hb.mail_text', 'Gerald has been watching {names} closely, in a friendly way. Every habit so far is written down in Journal > Profile.', { names })
    + ' ' + tt('lv.mail_ps', 'PS. You have a town level now: {n}. Everything you had open stays open.', { n: S.lv.lv });
  mailPush({ id: 'lv_habits', kind: 'news', from: tt('dd.news_from', 'Gerald'), title, text });
  S.lv.mail = 1; markDirty();
  return true;
}
function lvTick() { if (!S || cur.mode === 'title' || !lvOn()) return; lvEnsure(); lvMailSend(); }
on('yard:enter', () => { lvTick(); if (window.__paw && !window.__paw.lv) lvExpose(); });
on('game:ready', () => setTimeout(() => { lvExpose(); lvTick(); }, 0));

/* ---------------- tests: window.__paw.lv (V222.md 7.1) ---------------- */
function lvExpose() {
  if (!window.__paw) return;
  window.__paw.lv = {
    on: () => lvOn(), level: () => lvLevel(), xp: () => (S && S.lv ? S.lv.xp : 0), today: () => (S && S.lv ? S.lv.today : 0), floor: () => (S && S.lv ? S.lv.floor : 0),
    stars: () => (S && S.lv ? Object.assign({}, S.lv.st) : null), gain: (src, n, o) => lvGain(src, n, o), need: (kind, id, bond) => wNeed(kind, id, bond), open: (kind, id, bond) => wOpen(kind, id, bond),
    start: (save) => { const c = JSON.parse(JSON.stringify(save)); delete c.lv; lvStart(c); return c.lv; }, sync: () => { lvSync(S); return S && S.lv; }, ensure: () => lvEnsure(), day: () => lvDay(),
    unlocks: (n) => lvRowsAt(n), rows: () => lvLiveRows(), of: (x) => lvOf(x), bond: (id, l) => lvBond(id, l), mail: () => lvMailSend(), act: (k, d) => trackAct(k, d), queue: () => lvQueue.slice(),
    test: (v) => { prefs.lvTest = !!v; return lvOn(); }, pref: (k, v) => { prefs[k] = v; return lvOn(); }, top: () => topBond(), bondUp: (n) => addBond(n, { raw: true }),
    next: (L) => (typeof lvNextText === 'function' ? lvNextText(L) : null), sheet: () => (typeof lvOpen === 'function' ? lvOpen() : null), card: () => (typeof lvMaybeShow === 'function' ? lvMaybeShow() : null),
    AT: LV_AT.slice(), CAP: LV_CAP, STAR: LV_STAR, WALK: Object.assign({}, LV_WALK), FLOOR: LV_FLOOR.slice(), UNLOCK: Object.assign({}, LV_UNLOCK), SRC: JSON.parse(JSON.stringify(LV_SRC)), MILE: Object.assign({}, LV_MILE), TITLES: Object.assign({}, LV_TITLES),
    hb: {}
  };
}
