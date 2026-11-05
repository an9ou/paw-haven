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
/* ---------------- part B: the call sites' helpers (V222.md 3.3) ----------------
   Off, each is exactly today's topBond() test and the callers keep today's Bond text. Function declarations: the earlier files call them
   at run time only (never at load). */
function lvPlaceLocked(k) { return !!PLACES[k] && !wOpen('place', k, PLACES[k].bond); }
function lvRouteLocked(k) { return !!ROUTES[k] && !wOpen('route', k, ROUTES[k].bond); }
function lvPlaceN(k) { return wNeed('place', k, PLACES[k] ? PLACES[k].bond : 1); }
function lvRouteN(k) { return wNeed('route', k, ROUTES[k] ? ROUTES[k].bond : 1); }
function lvChip(n) { return tt('lv.chip', 'Level {n}', { n }); }
// a locked walk route on the map (today's map.locked_1..3, the same three jokes in the same order)
function lvNopeRoute(place, n) { return PICK([tt('lv.nope_route_3', 'Nope. {place} opens at town level {n}. The trees need time to warm up to you.', { place, n }), tt('lv.nope_route_1', 'Nope. {place} opens at town level {n}. There is a bouncer. He is a goose.', { place, n }), tt('lv.nope_route_2', 'Nope nope. Town level {n} for {place}. Rules are rules (we made them up).', { place, n })]); }
// a town map place's label (14_town_places.js, 42_map215.js): today's town.go_to off
function lvGoTo(k, place) {
  const locked = lvPlaceLocked(k) ? 'yes' : 'no';
  return lvOn() ? tt('lv.go_to', '{locked, select, yes {Go to {place} (locked, level {n})} other {Go to {place}}}', { locked, place, n: lvPlaceN(k) })
    : tt('town.go_to', '{locked, select, yes {Go to {place} (locked, Bond {bond})} other {Go to {place}}}', { locked, place, bond: PLACES[k].bond });
}
// the lock tags the map art draws (o.tags: id -> "Level {n}"), only with lvOn; without them the art draws today's "Bond {n}"
function lvTags(ids) { const o = {}; (ids || []).forEach((k) => { if (PLACES[k] || ROUTES[k]) o[k] = lvChip(PLACES[k] ? lvPlaceN(k) : lvRouteN(k)); }); return o; }
// the item rows a level gates (a Set of names), for one shop render. Festival, edition, reward and Tokyo rows and the Gene Sniffer are not in it
function lvItemRows() { return new Set(lvLiveRows().filter((r) => r.kind === 'item').map((r) => r.id)); }
// a shop row's lock. Off: today's (topBond() < bond). On: a level row by its town level, never while owned; any other row keeps its Bond rule
function lvShopLock(n, bond, owned, rows) {
  if (!lvOn() || !(rows || lvItemRows()).has(n)) return topBond() < bond;
  return !owned && !wOpen('item', n, bond);
}
// the lock chip of a shop row: "Level {n}" for a level row with lvOn, else today's "Bond {bond}"
function lvShopChip(n, bond, rows) { return lvOn() && (rows || lvItemRows()).has(n) ? lvChip(wNeed('item', n, bond)) : tt('shop.bond_chip', 'Bond {bond}', { bond }); }
// a Fun Fair game is open (FF_GAMES key)
function lvFfOpen(k) { const g = FF_GAMES[k]; return !!g && wOpen('ff', k, g.bond); }
// the route carousel order (46_tracks.js trSync): by the town level with lvOn (stable), by the Bond off (today's sort)
function lvRouteNeed(k) { try { return wNeed('route', k, ROUTES[k].bond); } catch (e) { return ROUTES[k].bond; } } // at load the level tables are not there yet
let lvSortedOn = null;
function lvRouteSort() { const on = lvOn(); if (on === lvSortedOn) return; lvSortedOn = on; try { trSync(); } catch (e) { /* 46_tracks.js is not loaded */ } }
// part C: the Town-level "Next" line (#lvNext) is built by lvNextSync() (below), also called from fwNextSync (47_firstweek.js)

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
  L.st.n = Math.floor(L.st.n); L.st.shown = Math.min(Math.floor(L.st.shown), L.st.n); // part G: a star card is never owed for a star that is not there
  return L;
}
// the titles of levels 10 and 20, given quietly (the level card or the letter says so): into s.titles like titleGive, without its toast
function lvTitles(s) {
  const L = s.lv;
  [20, 10].forEach((n) => { // 20 first: a player who starts at 20 shows its title, not level 10's (V222 review)
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
  const cd = typeof s.careDays === 'number' ? n(s.careDays) : dogs.length && typeof ageMonths === 'function' ? Math.min(60, Math.max(0, ageMonths(dogs[0]) - 10)) : 0; // a pre-v2.7 save: spotsInit's backfill (13_more_dogs.js), not 0
  const est = 90 * Math.min(cd, 90) + 15 * pv.length + 20 * dogs.reduce((a, d) => a + lvB(d.bond && d.bond.level) - 1, 0) + 10 * (n(m.stamps) + 7 * n(m.cards));
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
// the only writer of XP. src: a daily source (LV_SRC), a milestone (LV_MILE) or 'dev' (the dev panel: outside the cap, like a milestone).
// o.once: a key counted only once ever. Returns the XP given
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
  } else if (!LV_MILE[src] && src !== 'dev') return 0;
  const was = L.lv, stWas = L.st.n; L.xp += g;
  while (L.lv < LV_MAX && L.xp >= LV_AT[L.lv + 1]) { L.lv++; lvQueue.push(L.lv); }
  if (L.lv >= LV_MAX) { // past level 20: the XP fills a crayon star, each full star is one sticker (cosmetic, part E adds the set)
    L.st.xp += was >= LV_MAX ? g : Math.max(0, L.xp - LV_AT[LV_MAX]);
    while (L.st.xp >= LV_STAR) { L.st.xp -= LV_STAR; L.st.n++; } // part G: each full star is the next sticker (lvStkAt), its card waits for a calm screen (lvMaybeShow)
  }
  if (L.lv > was) lvTitles(S);
  markDirty();
  emit('lv:gain', { src, n: g, lv: L.lv, up: L.lv > was, star: L.st.n, stUp: L.st.n > stWas });
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
    const L = lvDay(), wn = (S.daily && S.daily.walks) || 0, counted = !!L && wn >= 1 && wn > (L.src.wn || 0);
    if (ROUTES[a.area] && (!a.early || counted)) lvVisit(a.area); // a walk that headed home at the start (no ground) gives no first-visit XP (V222 review)
    if (counted) { L.src.wn = wn; if (wn <= WALK_FULL) lvGain('walk', LV_WALK[a.area] || LV_WALK.park); } // only the full-pay walks give XP (walkCount ran just before the act)
  } else if (k === 'travel' && a.place) { if (PLACES[a.place]) lvVisit(a.place); }
  else if (k === 'wish') lvGain('wish', LV_SRC.wish[0]);
  else if (k === 'funfair') lvGain('ff', LV_SRC.ff[0]);
  else if ((k === 'garden' && a.what === 'harvest') || k === 'cook') lvGain('home', LV_SRC.home[0]);
  else if (k === 'frvisit' && typeof frOn === 'function' && frOn()) lvGain('fr', LV_SRC.fr[0]);
}
on('act', lvOnAct);

/* ---------------- the habits letter for an old save (V222.md 5.2 step 7; part D adds each dog's newest habit) ---------------- */
function lvMailSend() {
  if (!S || !lvOn() || !lvObj(S.lv) || S.lv.mail !== 0 || typeof mailPush !== 'function' || !Array.isArray(S.dogs) || !S.dogs.length) return false;
  const names = typeof tlist === 'function' ? tlist(S.dogs.map((d) => d.name)) : S.dogs.map((d) => d.name).join(', ');
  const title = S.dogs.length === 1 ? tt('hb.mail_one', "{name}'s habits", { name: S.dogs[0].name }) : tt('hb.mail_many', "Your pack's habits");
  const hbs = typeof hbMailLines === 'function' ? hbMailLines(S.dogs) : []; // part D: each dog's newest habit so far (51b_habits.js)
  const text = tt('hb.mail_text', 'Gerald has been watching {names} closely, in a friendly way. Every habit so far is written down in Journal > Profile.', { names })
    + (hbs.length ? ' ' + hbs.join(' ') : '') + ' ' + tt('lv.mail_ps', 'PS. You have a town level now: {n}. Everything you had open stays open.', { n: S.lv.lv });
  mailPush({ id: 'lv_habits', kind: 'news', from: tt('dd.news_from', 'Gerald'), title, text });
  S.lv.mail = 1; markDirty();
  return true;
}
function lvTick() { if (!S || cur.mode === 'title' || !lvOn()) return; lvEnsure(); lvMailSend(); }
on('yard:enter', () => { lvRouteSort(); lvTick(); if (window.__paw && !window.__paw.lv) lvExpose(); });
on('game:ready', () => setTimeout(() => { lvRouteSort(); lvExpose(); lvTick(); }, 0));

/* ---------------- part C: the HUD star, the Next line, the Level sheet, the level-up card, the lesson (V222.md 1.3-1.5) ----------------
   Off (lvOn false) there is no #lvBtn, no sheet, no card and no lesson. The art comes through lvArt (PawArt.LEVELS, part E); until it is
   merged a plain crayon placeholder is drawn here (lvStarSVG, lvStripSVG), so the art drops in without a code change. */
function lvArt(k, ...a) { try { const A = window.PawArt && window.PawArt.LEVELS; return A && typeof A[k] === 'function' ? A[k](...a) || '' : ''; } catch (e) { return ''; } }
const LVU = { wasHidden: false, wig: 0, hudKey: '', nxKey: '', nxAt: 0, nx: '' };
const lvTokyoId = (k) => k === 'station' || (typeof TK_PLACES === 'object' && !!TK_PLACES && !!TK_PLACES[k]);
const lvPlaceName = (k) => (typeof placeName === 'function' ? placeName(k) : tPlace(k));
const lvTitleName = (t) => (typeof jrTitleName === 'function' ? jrTitleName(t) : t);
// the XP of the level in progress: { lv, at, next, togo, frac }; past 20 the star in progress (frac of LV_STAR)
function lvProg() {
  const L = S && S.lv; if (!L) return { lv: 1, togo: LV_AT[2], frac: 0, top: false, star: 0, stogo: LV_STAR };
  if (L.lv >= LV_MAX) return { lv: LV_MAX, togo: 0, frac: Math.max(0, Math.min(1, (L.st.xp || 0) / LV_STAR)), top: true, star: L.st.n || 0, stogo: Math.max(0, LV_STAR - (L.st.xp || 0)) };
  const a = LV_AT[L.lv], b = LV_AT[L.lv + 1];
  return { lv: L.lv, next: L.lv + 1, togo: Math.max(0, b - L.xp), frac: Math.max(0, Math.min(1, (L.xp - a) / (b - a))), top: false, star: 0, stogo: LV_STAR };
}
// the rows level n opens, sorted for reading: a place or route, Tokyo, a feature, a Fun Fair game, a house, then the shop rows
function lvRowsSorted(n) {
  const rank = (r) => (r.kind === 'route' || (r.kind === 'place' && !lvTokyoId(r.id)) ? 0 : r.kind === 'place' ? 1 : r.kind === 'feat' ? 2 : r.kind === 'ff' ? 3 : HOUSES.some((h) => h.n === r.id) ? 4 : 5);
  // feat:stall gates only the Saturday stall's mission (ffstall, mswEvent); the stall and the photo contest are open from level 1, so no card or Next line names them (V222 review)
  const rows = lvRowsAt(n).filter((r) => !(r.kind === 'feat' && r.id === 'stall')), routes = new Set(rows.filter((r) => r.kind === 'route').map((r) => r.id));
  return rows.filter((r) => !(r.kind === 'place' && routes.has(r.id))).map((r, i) => ({ r, k: rank(r), i })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.r); // a place and its walk with the same id are one line
}
const lvFeatName = (k, cap) => (k === 'garden' ? (cap ? tt('lv.u_garden', 'The veggie patch') : tt('fw.next_garden', 'the veggie patch')) : cap ? tt('lv.u_kitchen', 'The kitchen') : tt('lv.next_kitchen', 'the kitchen'));
// the level card list for level n (V222.md 3.1 lvUnlocksFor): only rows that exist now, plus the title at 10 and 20
function lvUnlocksFor(n) {
  const out = [];
  lvRowsSorted(n).forEach((r) => {
    if (r.kind === 'route') out.push(tt('core.unlock_route', '{dig, select, yes {Walk route: {route} (with digging)} other {Walk route: {route}}}', { dig: ROUTES[r.id].dig ? 'yes' : 'no', route: (typeof townRouteName === 'function' ? townRouteName(r.id) : tRoute(r.id)) }));
    else if (r.kind === 'place') out.push(lvTokyoId(r.id) ? tt('lv.u_tokyo', 'Tokyo: {place}', { place: lvPlaceName(r.id) }) : tt('lv.u_place', 'Place: {place}', { place: lvPlaceName(r.id) }));
    else if (r.kind === 'feat') out.push(lvFeatName(r.id, true));
    else if (r.kind === 'ff') out.push(tt('ff.unlock', 'Fun Fair: {game}', { game: typeof ffName === 'function' ? ffName(r.id) : r.id }));
    else if (HOUSES.some((h) => h.n === r.id)) out.push(tt('core.unlock_house', 'House: {house}', { house: tItem(r.id) }));
    else out.push(tt('core.unlock_shop', 'Shop: {item}', { item: tItem(r.id) }));
  });
  if (LV_TITLES[n]) out.push(tt('lv.u_title', 'Title: {title}', { title: lvTitleName(LV_TITLES[n]) }));
  return out;
}
// "Level {n}: {what}" for level L + 1: up to 2 parts (1 when short). '' at the top
function lvNextText(L, short) {
  L = Math.floor(+L) || 1; if (L >= LV_MAX) return '';
  const n = L + 1, rows = lvRowsSorted(n), parts = [], add = (s) => { if (s && !parts.includes(s)) parts.push(s); };
  const isHouse = (r) => r.kind === 'item' && HOUSES.some((h) => h.n === r.id);
  let tk = false;
  rows.forEach((r) => {
    if (r.kind === 'route') add((typeof townRouteName === 'function' ? townRouteName(r.id) : tRoute(r.id)));
    else if (r.kind === 'place' && !lvTokyoId(r.id)) add(lvPlaceName(r.id));
    else if (r.kind === 'place') { if (!tk) { tk = true; add(rows.some((x) => x.id === 'station') ? tt('lv.next_tokyo', 'Tokyo') : lvPlaceName(r.id)); } }
    else if (r.kind === 'feat') add(lvFeatName(r.id, false));
    else if (r.kind === 'ff') add(typeof ffName === 'function' ? ffName(r.id) : r.id);
  });
  if (rows.some(isHouse)) add(tt('fw.next_house', 'a new house'));
  const items = rows.filter((r) => r.kind === 'item' && !isHouse(r)).map((r) => r.id);
  const cl = items.filter((x) => CLOTHES.some((c) => c.n === x)).length, toy = items.some((x) => TOYS.some((c) => c.n === x));
  const home = items.filter((x) => (typeof BEDS !== 'undefined' && BEDS.some((c) => c.n === x)) || (typeof HM_DECOR === 'object' && !!HM_DECOR[x])).length;
  if (cl) add(tt('fw.next_outfits', '{n, plural, one {a new outfit} other {# new outfits}}', { n: cl }));
  if (toy) add(tt('fw.next_toy', 'a new toy'));
  if (home) add(tt('lv.next_home', '{n, plural, one {a new thing for the home} other {# new things for the home}}', { n: home }));
  if (LV_TITLES[n]) add(tt('lv.next_title', 'a new title'));
  const what = parts.slice(0, short ? 1 : 2).join(' + ') || tt('lv.next_more', 'a bit more of town');
  return tt('lv.next_line', 'Level {n}: {what}', { n, what });
}
// "Level 20 · star {n}" past the top (n = full stars so far); plain "Level 20" before the first
const lvStarText = (n) => (n > 0 ? tt('lv.star_line', 'Level 20 · star {n}', { n }) : tt('lv.chip', 'Level {n}', { n: LV_MAX }));
function lvAria() {
  const p = lvProg();
  if (p.top) return p.star > 0 ? tt('lv.aria_star', 'Town level 20, star {n}. Opens your town level.', { n: p.star }) : tt('lv.aria_top', 'Town level 20, the top of the town. Opens your town level.');
  return tt('lv.aria', 'Town level {n}. {togo} to go for level {next}. Opens your town level.', { n: p.lv, togo: p.togo, next: p.next });
}
/* the placeholder art (crude crayon, every fill inside its own line: the fill and the line are the same path) */
const LV_STAR_D = 'M24 5.5 L29.2 17.6 L42.4 18.6 L32.5 27.3 L35.6 40.6 L24 33.6 L12.6 40.9 L15.4 27.6 L5.4 18.8 L18.7 17.4 Z';
function lvStarSVG(n, frac, o) {
  const A = lvArt('star', n, frac, o || {}); if (A) return A;
  const f = Math.max(0, Math.min(1, +frac || 0)), C = 2 * Math.PI * 21.5, top = o && o.top;
  return `<svg class="lv-starsvg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21.5" fill="none" stroke="#EADFCF" stroke-width="3.2"/>`
    + `<circle cx="24" cy="24" r="21.5" fill="none" stroke="#F4A262" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 24 24)"/>`
    + `<path d="${LV_STAR_D}" fill="#F9D56E" stroke="${INKG}" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 20 L22 19.6" stroke="#FFF4C9" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
    + (top ? `<path d="M17 6.5 L18.5 1.5 L21.5 4.5 L24 0.8 L26.5 4.5 L29.5 1.5 L31 6.5 Z" fill="#F28FA5" stroke="${INKG}" stroke-width="1.5" stroke-linejoin="round"/>` : '') + '</svg>';
}
function lvStripSVG(k) {
  const A = lvArt(k); if (A) return A;
  const h = k === 'sheet' ? 80 : 60, y = h - 14, roof = (x, w, c) => `<path d="M${x} ${y} L${x} ${y - 18} L${x + w / 2} ${y - 32} L${x + w} ${y - 18} L${x + w} ${y} Z" fill="${c}" stroke="${INKG}" stroke-width="2" stroke-linejoin="round"/>`;
  return `<svg class="lv-strip" viewBox="0 0 600 ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${roof(60, 44, '#F9D0D9')}${roof(116, 36, '#CBE0F4')}${roof(430, 40, '#BFE3C8')}${roof(484, 50, '#FFE3A1')}`
    + `<path d="M20 ${y} Q300 ${y + 6} 580 ${y}" stroke="${INKG}" stroke-width="2" fill="none" stroke-linecap="round"/>${doodle('spark', 220, h / 2, 0.7)}${doodle('spark', 380, h / 2 - 6, 0.6)}`
    + `<g transform="translate(276 ${h / 2 - 26}) scale(1.0)"><path d="${LV_STAR_D}" fill="#F9D56E" stroke="${INKG}" stroke-width="2.2" stroke-linejoin="round"/></g></svg>`;
}
/* the HUD star (#lvBtn) between the Bond meter and the coins, and the Next tag (#lvNext) under it on wide screens */
function lvHudSync() {
  const hudEl = $('#hud'), coins = $('#coins'); let b = $('#lvBtn');
  const on = !!(S && lvOn() && S.lv && hudEl && coins);
  if (hudEl) hudEl.classList.toggle('lvon', on);
  if (!on) { if (b) b.remove(); LVU.hudKey = ''; return null; }
  if (!b) {
    coins.insertAdjacentHTML('beforebegin', `<button id="lvBtn" class="lv" type="button"><span class="lv-star"><span class="lv-art"></span><b class="lv-n"></b></span><span class="track lv-track" aria-hidden="true"><span class="fill"></span></span><span id="lvNext" class="lv-next" hidden></span></button>`);
    b = $('#lvBtn'); b.onclick = (e) => { e.stopPropagation(); SFX.click(); lvOpen(); };
  }
  const p = lvProg(), nk = p.lv + '|' + (I18N && I18N.lang); // the Next line is cached by level and language (refreshed every 10 s): this runs about twice a second (V222 review)
  if (nk !== LVU.nxKey || Date.now() - LVU.nxAt > 10000) { LVU.nxKey = nk; LVU.nxAt = Date.now(); LVU.nx = p.top ? '' : lvNextText(p.lv); }
  const next = LVU.nx, key = [p.lv, Math.round(p.frac * 40), p.star, next, I18N && I18N.lang].join('|');
  if (key === LVU.hudKey) return b; LVU.hudKey = key;
  $('.lv-art', b).innerHTML = lvStarSVG(p.lv, p.frac, { top: p.top });
  $('.lv-n', b).textContent = tnum(p.lv);
  $('.lv-track .fill', b).style.width = `calc(${(p.frac * 100).toFixed(1)}% - ${(p.frac * 7).toFixed(1)}px)`;
  const nx = $('#lvNext', b);
  if (next) { nx.innerHTML = `<span class="fw-nl">${esc(tt('fw.next', 'Next'))}</span> ${esc(next)}`; nx.hidden = false; } else { nx.innerHTML = ''; nx.hidden = true; }
  b.setAttribute('aria-label', lvAria());
  b.title = next || (p.top ? lvStarText(p.star) : '');
  return b;
}
// called by fwNextSync (47_firstweek.js) and by this file's tick: the star and its Next line
function lvNextSync() { try { lvHudSync(); } catch (e) { console.warn('lv hud', e); } }
on('lv:gain', (g) => {
  lvNextSync();
  if (g && g.up && S && (S.place === 'yard' || S.place === 'house') && cur.mode === 'yard' && typeof placeButtons === 'function') placeButtons(); // the Garden / Kitchen button opens with the level (V222 review)
  const b = $('#lvBtn'); if (!b || document.documentElement.dataset.motion === 'off') return;
  const up = !!(g && (g.up || g.stUp)), c = up ? 'lv-pop' : 'lv-wig'; b.classList.remove('lv-pop', 'lv-wig'); void b.offsetWidth; b.classList.add(c);
  clearTimeout(LVU.wig); LVU.wig = setTimeout(() => b.classList.remove('lv-pop', 'lv-wig'), up ? 700 : 450);
});
/* part G: the star stickers past level 20 (V222.md Decided 4). The nth full star (S.lv.st.n) gives sticker (n - 1) % 8 of the art's 8
   (PawArt.LEVELS.sticker); after the eighth they come round again and the page counts the copies ("x2"). Cosmetic only: no coins, no items.
   The page is a section of the Level sheet (not the Dog Days book: its pages are six-cell grids that give an outfit or a frame when full). */
const LV_STK_N = 8;
const lvStkAt = (k) => (((Math.floor(k) - 1) % LV_STK_N) + LV_STK_N) % LV_STK_N; // star k (1-based) -> sticker index 0-7
const lvStkCopies = (n, i) => (n > i ? Math.floor((n - 1 - i) / LV_STK_N) + 1 : 0); // how many of sticker i the first n stars gave
function lvStkName(i) {
  return [tt('lv.stk.0', 'Gold star'), tt('lv.stk.1', 'Bone'), tt('lv.stk.2', 'Tennis ball'), tt('lv.stk.3', 'Paw heart'),
    tt('lv.stk.4', 'Kennel'), tt('lv.stk.5', 'Town house'), tt('lv.stk.6', 'Fire hydrant'), tt('lv.stk.7', 'Doggy face')][lvStkAt(i + 1)];
}
function lvStkArt(i) { return lvArt('sticker', i) || `<svg viewBox="-16 -16 32 32" aria-hidden="true">${doodle('spark', 0, 0, 1.1)}</svg>`; }
// the 8 cells: { i, name, n: copies so far }
function lvStkList() { const n = (S && S.lv && S.lv.st && S.lv.st.n) || 0; return Array.from({ length: LV_STK_N }, (_, i) => ({ i, name: lvStkName(i), n: lvStkCopies(n, i) })); }
function lvStkPageHTML() {
  const cells = lvStkList().map((c) => `<li class="lv-sti${c.n ? ' on' : ''}" data-stk="${c.i}"${c.n > 1 ? ` aria-label="${esc(c.name)} ×${tnum(c.n)}"` : ''}><span class="lv-sa" aria-hidden="true">${c.n ? lvStkArt(c.i) : '<b>?</b>'}</span><span class="lv-sl">${esc(c.name)}</span>${c.n > 1 ? `<b class="lv-sx" aria-hidden="true">×${tnum(c.n)}</b>` : ''}</li>`).join('');
  return `<section class="lv-stk" aria-label="${esc(tt('lv.stk_h3', 'Star stickers'))}"><h3 class="lv-h3">${esc(tt('lv.stk_h3', 'Star stickers'))}</h3><ul class="lv-sgrid">${cells}</ul></section>`;
}
/* the Level sheet (V222.md 1.4) */
function lvSheetHTML() {
  const L = S.lv, p = lvProg(), bar = (f) => `<span class="lv-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(f * 100)}"><span class="fill" style="width:calc(${(f * 100).toFixed(1)}% - ${(f * 7).toFixed(1)}px)"></span></span>`;
  let h = `<div class="lv-head">${lvStripSVG('sheet')}</div>`;
  if (!p.top) h += `<div class="lv-prog">${bar(p.frac)}<p class="lv-togo">${esc(tt('lv.to_go', '{n} to go for level {next}', { n: tnum(p.togo), next: p.next }))}</p></div>`;
  else {
    h += `<p class="lv-top">${esc(tt('lv.top', 'Top of the town. Every place is open.'))}</p>`;
    h += `<div class="lv-stars"><p class="lv-starline"><span class="lv-sic">${lvStarSVG(LV_MAX, p.frac, { top: true })}</span><b>${esc(lvStarText(p.star))}</b></p>${bar(p.frac)}<p class="lv-togo">${esc(tt('lv.star_to_go', '{n} to go for the next star', { n: tnum(p.stogo) }))}</p>`
      + `<p class="lv-stcount">${esc(tt('lv.stars', '{n, plural, =0 {No star stickers yet. Every full star gives one.} one {# star sticker so far.} other {# star stickers so far.}}', { n: p.star }))}${p.star >= LV_STK_N ? ' ' + esc(tt('lv.stars_all', 'All eight found. Every new star adds one more.')) : ''}</p></div>`;
  }
  const full = L.today >= LV_CAP;
  h += `<p class="lv-today${full ? ' full' : ''}">${esc(full ? tt('lv.today_full', 'That is all the growing for today. More tomorrow.') : tt('lv.today', 'Today: {n} of {cap}', { n: tnum(L.today), cap: tnum(LV_CAP) }))}</p>`;
  if (p.top) h += lvStkPageHTML(); // part G: the sticker page, under today's line
  if (!p.top) {
    const nx = []; for (let n = p.lv; n < Math.min(LV_MAX, p.lv + 3); n++) nx.push(`<li>${esc(lvNextText(n))}</li>`);
    h += `<h3 class="lv-h3">${esc(tt('fw.next', 'Next'))}</h3><ul class="lv-nextl">${nx.join('')}</ul>`;
  }
  const opened = [`<li><b>${esc(lvChip(1))}</b> ${esc(tt('lv.open_1', 'Your yard, Sunny Park, the Town Loop, Market Street with its shops, the café, the vet and the Shelter'))}</li>`];
  for (let n = 2; n <= L.lv; n++) { const u = lvUnlocksFor(n); if (u.length) opened.push(`<li><b>${esc(lvChip(n))}</b> ${esc(u.join(', '))}</li>`); }
  h += `<details class="lv-open"><summary>${esc(tt('lv.opened', 'Opened so far'))}</summary><ul>${opened.join('')}</ul></details>`;
  h += `<p class="lv-how">${esc(tt('lv.how', 'Care, walks, missions, little helps, wishes, the Fun Fair and new places all help you grow.'))}</p>`;
  return h;
}
function lvOpen() {
  if (!S || !lvOn() || !lvEnsure()) return null; lvDay();
  return openModal(esc(tt('lv.title', 'Town level {n}', { n: S.lv.lv })), lvSheetHTML(), { cls: 'lv-pop' });
}
/* the level-up card (V222.md 1.5): after any Bond card (levelQueue empty), on a calm screen; S.lv.shown keeps it over a reload */
function lvCalm() {
  if (!S || !lvOn() || !S.lv || !modal.hidden || levelQueue.length || !titleEl.hidden || !['yard', 'market', 'map', 'shelter'].includes(cur.mode)) return false;
  if (typeof popOpen === 'function' && popOpen()) return false;
  if (typeof gdLive === 'function' && gdLive() && typeof gdAllowed === 'function' && gdAllowed()) return false; // Puppy's first day comes first
  if (typeof phActive === 'function' && phActive()) return false; if (typeof blOn === 'function' && blOn()) return false;
  if (busy || (typeof HO === 'object' && HO && HO.pl) || (typeof FW === 'object' && FW && Date.now() < (FW.enterAt || 0))) return false; // a yard act, decor placement, the Bond 2 party's Paw (V222 review)
  return true;
}
function lvMaybeShow() {
  if (!lvCalm()) return null; const L = S.lv; if (!(L.lv > L.shown)) return lvStarCard(); // part G: a star card waits behind any level card
  const levels = []; for (let n = L.shown + 1; n <= L.lv; n++) levels.push(n);
  const top = L.lv, first = L.from === 'fresh' && L.shown <= 1; // the Gerald line: a fresh save's first level card only
  lvQueue = [];
  audioCue('levelup'); try { SFX.fanfare(); } catch (e) { /* audio off */ }
  const all = []; // several levels at once: one line a level ("Level 4: a, b, c"), as the sheet does, so the Next line stays in view (phone review 5)
  if (levels.length > 1) levels.forEach((n) => { const u = lvUnlocksFor(n); if (u.length) all.push(tt('lv.lu_group', '{level}: {what}', { level: lvChip(n), what: u.join(', ') })); });
  else levels.forEach((n) => all.push(...lvUnlocksFor(n)));
  const lines = [tt('lv.lu_1', 'The pigeons nod at you now. That is a big deal for pigeons.'), tt('lv.lu_2', 'Gerald tipped his hat at you. He means it.'), tt('lv.lu_3', 'Someone in town said your name right. Almost.')];
  const nx = top < LV_MAX ? lvNextText(top) : '';
  const body = `<div class="lv-cardart">${lvStripSVG('card')}</div><p>${esc(PICK(lines))}</p>`
    + (levels.length > 1 ? `<p>${esc(tt('core.lu_many', "{n, plural, one {(That's # level at once. Show-off.)} other {(That's # levels at once. Show-off.)}}", { n: levels.length }))}</p>` : '')
    + (first ? `<p class="lv-gerald">${esc(tt('lv.lu_gerald', 'Gerald: That star is your town level. Each level opens a bit more of town.'))}</p>` : '')
    + `<p>${esc(tt('core.lu_unlocked', 'Unlocked:'))}</p><ul class="unlocks">${all.map((u) => `<li>${esc(u)}</li>`).join('') || `<li>${esc(tt('lv.next_more', 'a bit more of town'))}</li>`}</ul>`
    + `<p class="lv-lunext">${esc(nx ? tt('lv.lu_next', 'Next: {line}', { line: nx }) : tt('lv.top', 'Top of the town. Every place is open.'))}</p>`;
  // S.lv.shown moves only once the card has really been seen (its close, by OK, x, a swipe or a scene change): a reload or another sheet
  // that replaces it while it is open brings it back later (V222 review)
  openModal(`<span class="hl">${esc(tt('lv.lu_title', 'Town level {n}!', { n: top }))}</span>`, body, { cls: 'celebrate lv-lu', foot: `<button class="btn yes big" id="lvOk">${esc(tt('lv.ok', 'OK'))}</button>`, onClose: () => { if (S && S.lv) { S.lv.shown = Math.max(S.lv.shown, top); markDirty(); } } });
  $('#lvOk').onclick = () => { SFX.boop(700); closeModal(); if (S.lv.st.n > S.lv.st.shown) setTimeout(lvMaybeShow, 400); }; // part G: then a star card, as a level card follows a Bond card
  if (LV_TITLES[top] || levels.some((n) => LV_TITLES[n])) { hudDogKey = ''; setHudDog(); } // the level 10 / 20 title shows under the name
  lvNextSync();
  return levels;
}
/* part G: the star card (a star past level 20 filled): the level card's look, queued the same way (lvMaybeShow, after any Bond or level card);
   S.lv.st.shown keeps it over a reload. Several stars at once give one card with each new sticker (the last 8 at most) */
function lvStarCard() {
  const L = S.lv, st = L.st; if (!(st.n > st.shown)) return null;
  const from = st.shown + 1, to = st.n, ks = []; for (let k = Math.max(from, to - LV_STK_N + 1); k <= to; k++) ks.push(k);
  audioCue('levelup'); try { SFX.fanfare(); } catch (e) { /* audio off */ }
  const names = [...new Set(ks.map((k) => lvStkName(lvStkAt(k))))], nm = typeof tlist === 'function' ? tlist(names) : names.join(', ');
  const body = `<div class="lv-stkcard${ks.length === 1 ? ' one' : ''}" aria-hidden="true">${ks.map((k) => `<span class="lv-sa">${lvStkArt(lvStkAt(k))}</span>`).join('')}</div>`
    + `<p class="lv-stgot">${esc(tt('lv.st_got', '{n, plural, one {A new sticker: {name}.} other {New stickers: {name}.}}', { n: names.length, name: nm }))}</p>`
    + (to - from > 0 ? `<p>${esc(tt('lv.st_many', '{n, plural, one {(That is # star at once.)} other {(That is # stars at once. Busy paws.)}}', { n: to - from + 1 }))}</p>` : '')
    + `<p class="lv-stwhere">${esc(tt('lv.st_where', 'Every full star past level 20 gives one. Tap your star to see them all.'))}</p>`;
  openModal(`<span class="hl">${esc(tt('lv.st_title', 'Star {n}!', { n: tnum(to) }))}</span>`, body, { cls: 'celebrate lv-stc', foot: `<button class="btn yes big" id="lvStOk">${esc(tt('lv.ok', 'OK'))}</button>`, onClose: () => { if (S && S.lv) { S.lv.st.shown = Math.max(S.lv.st.shown, to); markDirty(); } } }); // shown on close, as the level card
  $('#lvStOk').onclick = () => { SFX.boop(700); closeModal(); };
  lvNextSync();
  return ks;
}
/* the dev panel (V222.md 6; English only, like the rest of the panel; itch.io strips the panel): shown while ms2On(), they act while lvOn() */
function lvDevHTML() {
  if (typeof ms2On !== 'function' || !ms2On()) return '';
  return '<button class="btn" id="dvLvXp">Levels: +100 XP</button><button class="btn" id="dvLvNext">Next level</button><button class="btn" id="dvLvStar">Fill a star</button><button class="btn" id="dvLvToday">Reset today\'s XP</button><button class="btn" id="dvLvMail">Show habits letter</button>';
}
function lvDev(what) {
  if (!S || !lvOn() || !lvEnsure()) return 'Town levels are off (Missions v2 test, and not under the test harness).';
  const L = S.lv;
  if (what === 'xp') { lvGain('dev', 100); return `+100 XP: level ${L.lv}, ${L.xp} XP.`; }
  if (what === 'next') { if (L.lv >= LV_MAX) return lvDev('star'); lvGain('dev', LV_AT[L.lv + 1] - L.xp); return `Town level ${L.lv}.`; }
  if (what === 'star') { lvGain('dev', Math.max(0, LV_AT[LV_MAX] - L.xp) + LV_STAR - (L.lv >= LV_MAX ? L.st.xp : 0)); return `Level 20, star ${L.st.n}.`; }
  if (what === 'today') { lvDay(); L.today = 0; L.src = {}; markDirty(); return 'Today\'s XP is back to 0.'; }
  if (what === 'mail') {
    if (Array.isArray(S.mail)) S.mail = S.mail.filter((m) => m.id !== 'lv_habits');
    L.mail = 0; return lvMailSend() ? 'The habits letter is in the mailbox.' : 'No letter (no dog yet?).';
  }
  return '';
}
function lvDevBind() {
  [['dvLvXp', 'xp'], ['dvLvNext', 'next'], ['dvLvStar', 'star'], ['dvLvToday', 'today'], ['dvLvMail', 'mail']].forEach(([id, w]) => { const b = document.getElementById(id); if (b) b.onclick = () => { const m = lvDev(w); if (m) toast(m); lvNextSync(); }; });
}
// How to play: one lesson while lvOn (25_guide.js lists it)
function lvLesson() { return lvOn() ? ['levels', 'star', tt('lv.lesson_title', 'Town level'), tt('lv.lesson_text', 'Care, walks and missions grow your town level. Each level opens new places, walks and shop things, and nothing ever locks again.')] : null; }
function lvUiTick() {
  if (!S || !cur.mode || cur.mode === 'title' || cur.mode === 'adopt') { LVU.wasHidden = false; return; }
  if (lvOn()) lvEnsure(); // the switch turned on mid-session: start now, so the star shows (as the next yard would)
  lvNextSync();
  const calm = modal.hidden; if (calm && LVU.wasHidden) lvMaybeShow(); LVU.wasHidden = calm; // a modal must have been closed for a whole tick (the Bond card's own 400 ms call comes first)
}
setInterval(() => { try { lvUiTick(); } catch (e) { console.warn('lv tick', e); } }, 1000);
on('yard:enter', () => lvNextSync());

/* ---------------- tests: window.__paw.lv (V222.md 7.1) ---------------- */
function lvExpose() {
  if (!window.__paw) return;
  window.__paw.lv = {
    on: () => lvOn(), level: () => lvLevel(), xp: () => (S && S.lv ? S.lv.xp : 0), today: () => (S && S.lv ? S.lv.today : 0), floor: () => (S && S.lv ? S.lv.floor : 0),
    stars: () => (S && S.lv ? Object.assign({}, S.lv.st) : null), gain: (src, n, o) => lvGain(src, n, o), need: (kind, id, bond) => wNeed(kind, id, bond), open: (kind, id, bond) => wOpen(kind, id, bond),
    start: (save) => { const c = JSON.parse(JSON.stringify(save)); delete c.lv; lvStart(c); return c.lv; }, sync: () => { lvSync(S); return S && S.lv; }, ensure: () => lvEnsure(), day: () => lvDay(),
    unlocks: (n) => lvRowsAt(n), rows: () => lvLiveRows(), of: (x) => lvOf(x), bond: (id, l) => lvBond(id, l), mail: () => lvMailSend(), act: (k, d) => trackAct(k, d), queue: () => lvQueue.slice(),
    test: (v) => { prefs.lvTest = !!v; lvRouteSort(); return lvOn(); }, pref: (k, v) => { prefs[k] = v; lvRouteSort(); return lvOn(); }, top: () => topBond(), bondUp: (n) => addBond(n, { raw: true }),
    next: (L) => (typeof lvNextText === 'function' ? lvNextText(L) : null), sheet: () => (typeof lvOpen === 'function' ? lvOpen() : null), card: () => (typeof lvMaybeShow === 'function' ? lvMaybeShow() : null),
    AT: LV_AT.slice(), CAP: LV_CAP, STAR: LV_STAR, WALK: Object.assign({}, LV_WALK), FLOOR: LV_FLOOR.slice(), UNLOCK: Object.assign({}, LV_UNLOCK), SRC: JSON.parse(JSON.stringify(LV_SRC)), MILE: Object.assign({}, LV_MILE), TITLES: Object.assign({}, LV_TITLES),
    wish: () => (typeof ddWishOpts === 'function' && S && S.dogs && S.dogs.length ? ddWishOpts(D()) : null), lock: (n, bond, owned) => lvShopLock(n, bond, !!owned), tags: (ids) => lvTags(ids),
    hud: () => { const b = lvHudSync(); return b ? { aria: b.getAttribute('aria-label'), title: b.title, n: b.querySelector('.lv-n').textContent, next: (b.querySelector('#lvNext') || {}).textContent || '' } : null; },
    unlocksText: (n) => lvUnlocksFor(n), lesson: () => lvLesson(), shown: () => (S && S.lv ? S.lv.shown : 0), calm: () => lvCalm(),
    stickers: () => lvStkList(), stk: (k) => lvStkAt(k), dev: (w) => lvDev(w), devHTML: () => lvDevHTML(),
    nope: (s) => nope(s), startSave: (save) => { const c = JSON.parse(JSON.stringify(save)); delete c.lv; lvStart(c); return c; }, // the review fixes' tests: a "Nope" toast, an old save's start with its title
    hb: typeof hbHook === 'function' ? hbHook() : {}
  };
}
