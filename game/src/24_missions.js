/* ======================= v2.4: 24_missions.js (SHOP & MISSIONS lane, tag ms) =======================
   Daily missions: one a Japan day (Daily rhythm, owner 3 Nov 2026; it was 3 a local day at 15 coins) on a crayon checklist card, 40 coins and a
   crayon stamp each, a reward at 7 stamps, one free swap a day. The pool favours missions that make a small story (w: 3); the ones that happen
   anyway (feeding, petting, naps, scooping, letters: w: 0) are never picked, they stay for old saves and tests.
   Spec: V24.md section 4, docs/design/daily-rhythm.md. Data: S.missions. API: msOpen(), msToday(), msTabHTML(), msSwap(). Listens to on('act', ...).
   v2.20 Missions v2 (V220.md): the little helps, the treat pouch, the tabs and the new save fields are in 24b_missions2.js; this file keeps the story
   mission, the clipboard, the stamp card and the sheet (msOpen(tab) now opens it on a tab, Today by default). */
const MS_PAY = 40, MS_CARD = 7, MS_CARD_COINS = 150; // raw coins (no BOOST), as before: 40 a mission, 150 and a Pupcake from the third full card on
// v2.19.3 Puppy start: a route mission only when some dog can walk that route today (a puppy under 6 months does the Sunny Park only, walkBlock in 16b)
const msCanWalk = (k) => !!(S && ROUTES[k] && S.dogs.some((d) => !walkBlock(d, k)));
const MS_V24FOOD = () => FOOD.filter((f) => f.v24).map((f) => f.n);
const MS_V24TOYS = () => TOYS.filter((x) => x.v24).map((x) => x.n).concat('Squeaky Hedgehog');
/* the pool. t: the card line, s: the short toast name, g: the gate (eligible today), m: does an act count. shop: the "shop" group (one a day at most) */
const MS_POOL = [
  { id: 'feed2', n: 2, w: 0, t: 'Feed {dog} twice', s: 'Feed twice', m: (a) => a.kind === 'feed' },
  { id: 'pet', n: 1, w: 0, t: 'Pet {dog} until the tail goes', s: 'Petting', m: (a) => a.kind === 'pet' },
  { id: 'toy', n: 1, t: 'Play with a toy', s: 'Play with a toy', m: (a) => a.kind === 'toy' || a.kind === 'fetch' },
  { id: 'walk', n: 1, t: 'Go for a walk', s: 'Go for a walk', m: (a) => a.kind === 'walk' },
  { id: 'walk_river', n: 1, w: 3, t: 'Walk the Riverside Trail', s: 'Riverside walk', g: () => wOpen('route', 'river', ROUTES.river.bond) && msCanWalk('river'), m: (a) => a.kind === 'walk' && a.area === 'river' },
  { id: 'bath', n: 1, t: 'Give {dog} a bath', s: 'Bath time', m: (a) => a.kind === 'bath' },
  { id: 'nap', n: 1, w: 0, t: 'Tuck {dog} in for a nap', s: 'Nap time', m: (a) => a.kind === 'nap' },
  { id: 'wear', n: 1, t: 'Put on an outfit', s: 'Put on an outfit', g: () => S.inv.clothes.length > 0, m: (a) => a.kind === 'wear' },
  { id: 'trick', n: 1, t: 'Practise a trick', s: 'Practise a trick', g: () => TRICKS.some((x) => x.bond <= topBond()), m: (a) => a.kind === 'trick' },
  { id: 'garden_plant', n: 1, w: 3, t: 'Plant a seed', s: 'Plant a seed', g: () => gkOn() && gardenUnlocked() && Object.values(S.inv.seeds || {}).some((v) => v > 0), m: (a) => a.kind === 'garden' && a.what === 'plant' },
  { id: 'harvest', n: 1, w: 3, t: 'Harvest a crop', s: 'Harvest a crop', g: () => gkOn() && gardenUnlocked() && !!(S.garden && Array.isArray(S.garden.plots) && S.garden.plots.some((p) => p && p.crop)), m: (a) => a.kind === 'garden' && a.what === 'harvest' },
  { id: 'cook', n: 1, w: 3, t: 'Cook a dish', s: 'Cook a dish', g: () => kOn() && kitchenUnlocked(), m: (a) => a.kind === 'cook' },
  { id: 'buy', n: 1, t: 'Buy something on Market Street', s: 'Market Street shopping', shop: true, m: (a) => a.kind === 'buy' && !['stall', 'popup', 'station', 'tokyo', 'market'].includes(a.shop) }, // v2.5/v2.6: the stall and the pop-up are in the Square, not on Market Street
  { id: 'buy_food_new', n: 1, t: 'Try a new snack from Kibble Corner', s: 'New snack', shop: true, m: (a) => a.kind === 'buy' && a.cat === 'food' && MS_V24FOOD().includes(a.name) },
  { id: 'feed_new', n: 1, t: 'Feed {dog} the {arg}', s: 'Feed the {arg}', arg: () => MS_V24FOOD().filter((n) => (S.inv.food[n] || 0) > 0), m: (a, it) => a.kind === 'feed' && a.name === it.arg },
  { id: 'toy_new', n: 1, t: 'Play with the {arg}', s: 'Play with the {arg}', arg: () => MS_V24TOYS().filter((n) => owns('toys', n)), m: (a, it) => (a.kind === 'toy' || a.kind === 'fetch') && a.name === it.arg },
  { id: 'mail', n: 1, w: 0, t: 'Read a letter', s: 'Read a letter', g: () => typeof mailUnread === 'function' && mailUnread() > 0, m: (a) => a.kind === 'mail' },
  { id: 'scoop', n: 1, w: 0, t: 'Clean up after {dog}', s: 'Clean up', m: (a) => a.kind === 'scoop' },
  { id: 'treasure', n: 1, t: 'Dig up a treasure', s: 'Dig up a treasure', m: (a) => a.kind === 'treasure' },
  // v2.5: watering (the garden onWater callback) and the festival missions. The FESTIVAL lane fires leafpile / parade / buy shop:'stall'
  { id: 'garden_water', n: 1, t: 'Water the garden', s: 'Water the garden', g: () => gkOn() && gardenUnlocked() && !!(S.garden && Array.isArray(S.garden.plots) && S.garden.plots.some((p) => p && p.crop)), m: (a) => a.kind === 'garden' && a.what === 'water' },
  { id: 'stall', n: 1, w: 3, t: 'Buy a treat at the Harvest Stall', s: 'Harvest Stall', shop: true, g: () => festOn('leaf'), m: (a) => a.kind === 'buy' && (a.shop === 'stall' || a.shop === 'market') && a.cat === 'food' }, // v2.17.1: the Festive Market's treats count too
  { id: 'leafpile', n: 1, w: 3, t: 'Jump in a leaf pile', s: 'Leaf pile', g: () => (typeof fsCanJump === 'function' ? fsCanJump() : festOn('leaf')), m: (a) => a.kind === 'leafpile' },
  { id: 'parade', n: 1, w: 3, t: 'Join the costume parade', s: 'Costume parade', g: () => festOn('halloween'), m: (a) => a.kind === 'parade' },
  { id: 'photo', n: 1, w: 3, t: 'Take a photo of your pack', s: 'Take a photo', m: (a) => a.kind === 'photo' }, // v2.9 PHOTO lane: fired once per saved photo (35_photo.js)
  { id: 'travel', n: 1, w: 3, t: 'Visit the Dog Park', s: 'Dog Park visit', g: () => wOpen('place', 'dogpark', (PLACES.dogpark && PLACES.dogpark.bond) || 2), m: (a) => a.kind === 'travel' && a.place === 'dogpark' },
  // v2.8 Winter & New Year (V28.md section 1): WINTER fires snowdrift / snowdog / sweater and buy shop:'stall', NEW YEAR fires fortune. Lane gates are guarded
  { id: 'snowdrift', n: 1, w: 3, t: 'Dive into a snowdrift', s: 'Snowdrift', g: () => typeof wnCanJump === 'function' && !!wnCanJump(), m: (a) => a.kind === 'snowdrift' },
  { id: 'snowdog', n: 1, w: 3, t: 'Build a snowdog', s: 'Snowdog', g: () => typeof wnSnowdogFree === 'function' && !!wnSnowdogFree(), m: (a) => a.kind === 'snowdog' && !!a.done },
  { id: 'wstall', n: 1, w: 3, t: 'Buy a warm treat from Baker Bea', s: 'Winter Stall', shop: true, g: () => festOn('snow'), m: (a) => a.kind === 'buy' && (a.shop === 'stall' || a.shop === 'market') && a.cat === 'food' && ((f) => ['snow', 'newyear', 'winter'].includes(f.fest) && !f.cold)(FOOD.find((f) => f.n === a.name) || {}) }, // warm treats only: FOOD rows with cold: true (Reindeer Crunch, Frozen Yoghurt Snowballs) do not count
  { id: 'sweater', n: 1, w: 3, t: 'Enter the Ugly Sweater Contest', s: 'Sweater Contest', g: () => festOn('lights'), m: (a) => a.kind === 'sweater' },
  { id: 'yearclean', n: 1, w: 3, t: 'Year-end clean: give {dog} a bath', s: 'Year-end clean', g: () => nyEve(), m: (a) => a.kind === 'bath' },
  { id: 'fortune', n: 1, w: 3, t: 'Draw a New Year fortune', s: 'New Year fortune', g: () => nyDays() && !(S.ny && S.ny.fortune && S.ny.fortune.date === localISO()), m: (a) => a.kind === 'fortune' },
  // v2.8 Mt. Fuji Lookout (V28.md section 12.4): FUJI HILL fires gaze { first }; travel is the core act. jpHillOpen(): jpOn(), the scene exists, Bond 2
  { id: 'gaze', n: 1, w: 3, t: 'Look at Mt. Fuji from the Mt. Fuji Lookout', s: 'Look at Mt. Fuji', g: () => jpHillOpen() && !(S.jp && S.jp.gazed === localISO()), m: (a) => a.kind === 'gaze' },
  { id: 'hatsufuji', n: 1, w: 3, t: 'See the first Fuji of the year', s: 'First Fuji', g: () => nyDays() && jpHillOpen() && !(S.jp && S.jp.first === nyYear()), m: (a) => a.kind === 'gaze' && !!a.first },
  { id: 'travel_fuji', n: 1, w: 3, t: 'Visit the Mt. Fuji Lookout', s: 'Mt. Fuji Lookout visit', g: () => jpHillOpen(), m: (a) => a.kind === 'travel' && a.place === 'fujihill' },
  // v2.11 Tokyo Trip (V211.md section 5.3, 39_tokyo.js): the ride out and a new station stamp, from the Station's Bond on
  { id: 'tokyo_ride', n: 1, w: 3, t: 'Ride the Shinkansen to Tokyo', s: 'Shinkansen ride', g: () => tkOn() && wOpen('place', 'station', TK_STATION_BOND), m: (a) => a.kind === 'ride' && a.dir === 'out' },
  { id: 'tokyo_stamp', n: 1, w: 3, t: 'Collect a station stamp', s: 'Station stamp', g: () => tkOn() && wOpen('place', 'station', TK_STATION_BOND) && tkStampFree(), m: (a) => a.kind === 'stamp' },
  // v2.15 Training Ground (V215.md 6.1, 44_agility.js): agility fires act 'agility' { rosettes, low }
  { id: 'agility', n: 1, w: 3, t: 'Run the agility course at the Training Ground', s: 'Agility course', g: () => typeof mpOn === 'function' && mpOn() && wOpen('place', 'training', (PLACES.training && PLACES.training.bond) || 3), m: (a) => a.kind === 'agility' },
  { id: 'agility_ros', n: 1, w: 3, t: 'Earn two or more rosettes on the agility course', s: 'Two rosettes', g: () => typeof mpOn === 'function' && mpOn() && wOpen('place', 'training', (PLACES.training && PLACES.training.bond) || 3), m: (a) => a.kind === 'agility' && a.rosettes >= 2 },
  { id: 'travel_training', n: 1, w: 3, t: 'Visit the Training Ground', s: 'Training Ground visit', g: () => typeof mpOn === 'function' && mpOn() && wOpen('place', 'training', (PLACES.training && PLACES.training.bond) || 3), m: (a) => a.kind === 'travel' && a.place === 'training' },
  // v2.15 Splash Pool (V215.md 6.2, 45_pool.js): the paddle fires act 'paddle' { name, step }, float fetch fires 'floatfetch' { name }
  { id: 'pool_paddle', n: 1, w: 3, t: 'Take {dog} for a paddle at the Splash Pool', s: 'Pool paddle', g: () => typeof mpOn === 'function' && mpOn() && wOpen('place', 'pool', (PLACES.pool && PLACES.pool.bond) || 2), m: (a) => a.kind === 'paddle' },
  { id: 'pool_float', n: 1, w: 3, t: 'Play float fetch at the Splash Pool', s: 'Float fetch', g: () => typeof mpOn === 'function' && mpOn() && wOpen('place', 'pool', (PLACES.pool && PLACES.pool.bond) || 2), m: (a) => a.kind === 'floatfetch' },
  // v2.15 run tracks (V215.md 6.3, 46_tracks.js): a walk on one of the three new routes
  { id: 'new_trail', n: 1, w: 3, t: 'Walk a new trail: Sunflower Lanes, Bamboo Grove or the Seaside Cliffs', s: 'New trail', g: () => typeof trOn === 'function' && trOn() && ['sunflower', 'bamboo', 'cliffs'].some((k) => ROUTES[k] && wOpen('route', k, ROUTES[k].bond || 2) && msCanWalk(k)), m: (a) => a.kind === 'walk' && ['sunflower', 'bamboo', 'cliffs'].includes(a.area) },
  // Daily rhythm: small stories round town. The Fun Fair (49_funfair.js) fires act 'funfair' { game } for its games, jobs, the stall and the photo contest
  { id: 'funfair', n: 1, w: 3, t: 'Play a game at the Fun Fair', s: 'Fun Fair game', g: () => msFf(false), m: (a) => a.kind === 'funfair' && !!FF_GAMES[a.game] && !FF_GAMES[a.game].job },
  { id: 'ffjob', n: 1, w: 3, t: 'Help a neighbour with a town job', s: 'Town job', g: () => msFf(true), m: (a) => a.kind === 'funfair' && !!FF_GAMES[a.game] && !!FF_GAMES[a.game].job },
  { id: 'ffstall', n: 1, w: 3, t: 'Set out your Saturday market stall', s: 'Saturday stall', g: () => typeof ffOn === 'function' && ffOn() && msStallDay() && wOpen('feat', 'stall', 2) && ffLeft('stall') > 0 && ffStallGoods().length > 0, m: (a) => a.kind === 'funfair' && a.game === 'stall' },
  { id: 'ffphoto', n: 1, w: 3, t: 'Enter a photo in the weekly photo contest', s: 'Photo contest', g: () => typeof ffOn === 'function' && ffOn() && !!S.ff && !((P) => P && P.wk === ffWeekOf(localISO()) && (P.judged || (P.e || []).length >= 3))(S.ff.pc), m: (a) => a.kind === 'funfair' && a.game === 'photo' },
  // v2.20 Missions v2 (V220.md section 2, design 3.1): nine more small stories (v2: only while ms2On(), so with MS2_LIVE off the draw is v2.19.2's). New act data: walk pack, trick place, cook discovered, the acts wish and frvisit
  { id: 'walk_fresh', n: 1, w: 3, v2: 1, t: 'Walk a route you have not walked this week', s: 'A fresh route', g: () => ms2FreshRoutes().length > 0, m: (a) => a.kind === 'walk' && !!a.area && !ms2Walked7(a.area) }, // wkAreas is written after this check (24b listens later)
  { id: 'walk_dressed', n: 1, w: 3, v2: 1, t: 'Go for a walk in an outfit', s: 'A dressed-up walk', g: () => S.inv.clothes.length > 0, m: (a) => a.kind === 'walk' && ms2Dressed() },
  { id: 'pack_walk', n: 1, w: 3, v2: 1, t: 'Walk with two or more dogs', s: 'Pack walk', g: () => typeof crPack === 'function' && !!crPack(), m: (a) => a.kind === 'walk' && (+a.pack || 1) >= 2 },
  { id: 'cook_new', n: 1, w: 3, v2: 1, t: 'Cook a dish you have never cooked', s: 'A new dish', g: () => kOn() && kitchenUnlocked(), m: (a) => a.kind === 'cook' && !!a.discovered },
  { id: 'decorate', n: 1, w: 3, v2: 1, t: 'Move a decoration at home', s: 'Redecorate', g: () => !!S.decor && Object.keys(S.decor).length > 0, m: (a) => a.kind === 'decorate' },
  { id: 'cafe', n: 1, w: 3, v2: 1, t: 'Take {dog} to the café', s: 'Café visit', g: () => !!PLACES.cafe && wOpen('place', 'cafe', PLACES.cafe.bond || 1), m: (a) => a.kind === 'travel' && a.place === 'cafe' },
  { id: 'trick_show', n: 1, w: 3, v2: 1, t: 'Show a trick in the Town Square', s: 'Square show', g: () => !!PLACES.square && wOpen('place', 'square', PLACES.square.bond || 1) && TRICKS.some((x) => x.bond <= topBond()), m: (a) => a.kind === 'trick' && a.place === 'square' },
  { id: 'wish', n: 1, w: 3, v2: 1, t: "Make {dog}'s wish come true", s: 'A wish come true', g: () => typeof ddReady === 'function' && ddReady() && !(ddWish(D()) || {}).done, m: (a) => a.kind === 'wish' },
  { id: 'friend_yard', n: 1, w: 3, v2: 1, t: "Visit a friend's yard", s: 'A friendly visit', g: () => FR_LIVE && frOn() && ms2FriendsN() > 0, m: (a) => a.kind === 'frvisit' } // only once Friends are live
];
// Daily rhythm: the stall mission lasts a Japan day, the stall opens on the local Saturday: only when this local Saturday lasts until the Japan day ends
// (Japan, the Americas, a European Saturday morning), so the stall never closes under an open mission. A Dev / test override (prefs.ffSat) just opens it
function msStallDay() { if (prefs.ffSat !== undefined && prefs.ffSat !== null) return !!prefs.ffSat; const n = new Date(Date.now()); return n.getDay() === 6 && msResetAt() <= new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1); } // as ffSaturday, on the same clock as jstISO
// a Fun Fair game (job: a town job) the player can play now: the switch, the Bond, a place that exists
function msFf(job) { return typeof ffOn === 'function' && ffOn() && !!S.ff && FF_KEYS.some((k) => !!FF_GAMES[k].job === job && lvFfOpen(k) && ffPlaceOk(k)); }
const msW = (d) => (d.w == null ? 1 : d.w);
const msDef = (id) => MS_POOL.find((x) => x.id === id);
function msFields() {
  if (!S) return; let m = S.missions;
  if (!m || typeof m !== 'object') m = S.missions = {};
  if (typeof m.date !== 'string') m.date = '';
  if (!Array.isArray(m.list)) m.list = [];
  if (typeof m.stamps !== 'number') m.stamps = 0;
  if (typeof m.cards !== 'number') m.cards = 0;
  if (!Array.isArray(m.rewards)) m.rewards = [];
  if (typeof m.stampDay !== 'string') m.stampDay = '';
  if (typeof m.swap !== 'string') m.swap = ''; // Daily rhythm: the Japan date of today's free swap ('' = not used)
  // Daily rhythm: an old save may hold today's three missions. It keeps one: the first unfinished one (the most progress first), so today's
  // mission can still be done for 40 coins and a stamp; if all three were done (the stamp was given), the first of them. Once (m.rhythm)
  if (m.rhythm !== 1) {
    m.rhythm = 1;
    if (m.list.length > 1) { const open = m.list.filter((x) => x && !x.done).sort((a, b) => (b.p || 0) - (a.p || 0)); m.list = [open[0] || m.list.find((x) => x && x.done) || m.list[0]]; }
  }
  v220Fields(S, false); // v2.20 Missions v2 (24b_missions2.js): helps, pouch, counters, week, badges, notebook, growing up
}
function msItem(def, rnd) {
  const it = { id: def.id, n: def.n, p: 0, done: null };
  if (def.arg) { const a = def.arg(); if (!a.length) return null; it.arg = a[Math.floor(rnd() * a.length)]; }
  return it;
}
/* the missions that can be picked today (gate and arg ok, weight above 0), without the ids in excl */
function msEligible(excl) {
  const v2 = ms2On(); // v2.20: the nine new story missions only while Missions v2 is on (MS2_LIVE, 24b_missions2.js)
  return MS_POOL.filter((d) => { if (msW(d) <= 0 || (excl && excl.includes(d.id)) || (d.v2 && !v2)) return false; try { return (!d.g || d.g()) && (!d.arg || d.arg().length > 0); } catch (e) { return false; } });
}
function msPickFrom(pool, rnd) { let x = rnd() * pool.reduce((a, d) => a + msW(d), 0); for (const d of pool) { x -= msW(d); if (x < 0) return d; } return pool[pool.length - 1]; }
const msSeed = (date, extra) => seeded(hashId(date + '|' + ((S.dogs && S.dogs[0] && S.dogs[0].id) || 'dog') + (extra || '')));
/* pick the day's mission (Daily rhythm: one, weighted to the story missions), seeded by the date and the first dog: the same day and dog give the same one */
function msPick(date) {
  const rnd = msSeed(date), pool = msEligible(); if (!pool.length) return [];
  const it = msItem(msPickFrom(pool, rnd), rnd); return it ? [it] : [];
}
let msForced = null; // the list a test hook (ms.force) set: it may hold several missions
/* a new Japan day: a fresh mission. An unfinished one is simply replaced, nothing is said about it */
function msRoll(force) {
  if (!S) return null; msFields(); const t = jstISO(); // Daily rhythm: 00:00 JST (was the local date)
  if (S.missions.date !== t || force) { S.missions.date = t; S.missions.list = msPick(t); markDirty(); msRefresh(); }
  else if (S.missions.list.length > 1 && S.missions.list !== msForced) { // Daily rhythm: an older build (a cached page, a second device) may bring today's three back through the cloud save: keep one, a finished one if any was finished (its coins and stamp were given), else the one with the most progress
    const L = S.missions.list; S.missions.list = [L.find((x) => x && x.done) || L.filter((x) => x).sort((a, b) => (b.p || 0) - (a.p || 0))[0] || L[0]]; markDirty(); msRefresh();
  }
  return S.missions;
}
function msToday() { const m = msRoll(); return m ? m.list : []; }
/* the free swap: once a Japan day, today's unfinished mission becomes another one (seeded, so a reload cannot reroll it) */
// v2.20: the swap never draws a mission one of today's little helps stands for (24b_missions2.js ms2HelpX), so one act never ticks two rows
const msSwapExcl = (m) => m.list.map((x) => x.id).concat(typeof ms2HelpX === 'function' ? ms2HelpX() : []);
function msSwapFree() { const m = S && S.missions; return !!m && m.swap !== jstISO() && m.list.some((x) => !x.done) && msEligible(msSwapExcl(m)).length > 0; }
function msSwap() {
  if (!S) return false; msRoll(); const m = S.missions, t = jstISO(), i = m.list.findIndex((x) => !x.done);
  if (m.swap === t || i < 0) return false;
  const pool = msEligible(msSwapExcl(m)); if (!pool.length) return false;
  const rnd = msSeed(t, '|swap'), it = msItem(msPickFrom(pool, rnd), rnd); if (!it) return false;
  m.list[i] = it; m.swap = t; markDirty(); SFX.boop(760);
  msSay(tt('missions.swapped', "Today's new mission: {mission}.", { mission: msText(it, true) }), 'good'); msRefresh(); return true;
}
document.addEventListener('click', (e) => { const b = e.target && e.target.closest && e.target.closest('.ms-swap'); if (!b || !S) return; e.stopPropagation(); msSwap(); });
// when the next mission comes, in the player's own clock (00:00 JST)
function msResetAt() { const j = jstISO(); return new Date(Date.UTC(+j.slice(0, 4), +j.slice(5, 7) - 1, +j.slice(8, 10)) + 15 * 3600e3); }
function msText(it, short) {
  const d = msDef(it.id); if (!d) return it.id;
  if (d.id === 'buy' && typeof mpOn === 'function' && mpOn()) return short ? tt('map215.ms_buy_s', 'Shopping in town') : tt('map215.ms_buy_t', 'Buy something at a shop in town'); // v2.15: the shops have their own places, so no Market Street wording
  return tdata('ms_pool.' + d.id + (short ? '.s' : '.t'), short ? d.s : d.t, { dog: NAME(), arg: it.arg ? shNameAny(it.arg) : '' }); // v2.14 i18n: the pool text is a message with {dog} and {arg}
}
const msDoneN = () => (S && S.missions ? S.missions.list.filter((x) => x.done).length : 0);
const msTotal = () => (S && S.missions && S.missions.list.length) || 1; // 1 a day (a forced test list may hold more)

/* ---- progress ---- */
let msQueue = [];
const msGuideBusy = () => (typeof gdActive === 'function' && !!gdActive()) || (typeof fsActive === 'function' && !!fsActive()); // v2.5: mission toasts also wait for the costume parade walk
function msSay(text, kind) { if (msGuideBusy()) msQueue.push([text, kind]); else toast(text, kind); }
function msFlush() { if (!msQueue.length || msGuideBusy()) return; const q = msQueue; msQueue = []; q.forEach(([t, k], i) => setTimeout(() => toast(t, k), i * 700)); }
// under the test harness missions only progress when a suite asks for it (prefs.msTest): a mission payout would otherwise change coin totals in older suites
function msAllowed() { return !navigator.webdriver || !!prefs.msTest; }
function msOnAct(a) {
  if (!S || !a || !a.kind || cur.mode === 'title' || !msAllowed()) return; msRoll();
  const m = S.missions; let changed = false, stamp = false;
  m.list.forEach((it) => {
    const d = msDef(it.id); if (!d || it.done) return;
    let hit = false; try { hit = d.m(a, it); } catch (e) { hit = false; }
    if (!hit) return;
    it.p = Math.min(it.n, (it.p || 0) + 1); changed = true;
    if (it.p >= it.n) { // Daily rhythm: every finished mission pays 40 raw coins and stamps the card
      it.done = jstISO(); const c = addCoins(MS_PAY, { raw: true }); stamp = true; m.stamps++; m.stampDay = m.date; ms2Life('ms'); if (typeof lvGain === 'function') lvGain('ms', 20); // v2.20: the lifetime count (Mission pup badge). v2.22: town XP
      msSay(tt('missions.done_stamp', 'Mission done: {mission}. +{n} coins and a crayon stamp.', { mission: msText(it, true), n: c }) + ksSettleNote(), 'gold'); setTimeout(() => msHudSync(true), 0); // v2.16.1: the top-bar clipboard hops
    }
  });
  if (!changed) return;
  markDirty();
  if (stamp && m.stamps >= MS_CARD) { m.stamps = 0; m.cards++; msReward(); }
  else msRefresh(stamp);
}
on('act', msOnAct);

/* ---- the 7-stamp rewards: Astronaut Helmet, then the Rocket Ship, then 150 coins (Daily rhythm; it was 120) and a Pupcake ---- */
function msReward() {
  const m = S.missions; let kind;
  if (!m.rewards.includes('Astronaut Helmet')) { kind = 'helmet'; m.rewards.push('Astronaut Helmet'); if (!owns('clothes', 'Astronaut Helmet')) S.inv.clothes.push('Astronaut Helmet'); }
  else if (!m.rewards.includes('Rocket Ship')) { kind = 'rocket'; m.rewards.push('Rocket Ship'); if (!owns('houses', 'Rocket Ship')) S.inv.houses.push('Rocket Ship'); }
  else { kind = 'coins'; addCoins(MS_CARD_COINS, { raw: true }); S.inv.food.Pupcake = (S.inv.food.Pupcake || 0) + 1; }
  markDirty(); saveNow(); msRefresh(true);
  msWhenFree(() => msRewardPop(kind));
}
function msRewardPop(kind) {
  SFX.fanfare();
  const art1 = kind === 'helmet' ? itemArt('Astronaut Helmet') : kind === 'rocket' ? (artReal('house', 'Rocket Ship') || itemArt('Rocket Ship')) : itemArt('Pupcake');
  const txt = kind === 'helmet' ? tt('missions.prize_helmet_html', '<p>Seven stamps! The card is full.</p><p>A prize for <b>{name}</b>: the <b>{item}</b>. No soggy shake after rain, no shivering in the snow. It is in the Wardrobe.</p>', { name: NAME(), item: shNameAny('Astronaut Helmet') })
    : kind === 'rocket' ? tt('missions.prize_rocket_html', '<p>Another full card! The prize is a whole <b>{item}</b>.</p><p>Launch is cancelled, forever, for naps. Move in now?</p>', { item: shNameAny('Rocket Ship') })
    : tt('missions.prize_coins2_html', '<p>Another full card! <b>+{n} coins</b> and one <b>{item}</b>.</p><p>A new card starts tomorrow.</p>', { n: tnum(MS_CARD_COINS), item: shNameAny('Pupcake') });
  const later = esc(tt('missions.later', 'Later'));
  const foot = kind === 'rocket' ? `<button class="btn no" id="msLater">${later}</button><button class="btn yes big" id="msMove">${esc(tt('missions.move_in', 'Move in'))}</button>`
    : kind === 'helmet' ? `<button class="btn no" id="msLater">${later}</button><button class="btn yes big" id="msWear">${esc(tt('missions.wear_it', 'Wear it'))}</button>` : `<button class="btn yes big" id="msLater">${esc(tt('missions.yay', 'Yay!'))}</button>`;
  const p = openModal(`<span class="hl">${esc(tt('missions.full_card', 'A full stamp card!'))}</span>`, `<div class="ms-prize"><span class="ms-prize-art${kind === 'rocket' ? ' house' : ''}">${art1}</span><div>${txt}</div></div>`, { cls: 'celebrate ms-reward', foot });
  const l = $('#msLater', p); if (l) l.onclick = () => { SFX.click(); closeModal(); };
  const w = $('#msWear', p); if (w) w.onclick = () => { closeModal(); equip('Astronaut Helmet', true); toast(tt('missions.ready_space', '{name} is ready for space. Or the garden.', { name: NAME() }), 'good'); };
  const mv = $('#msMove', p); if (mv) mv.onclick = () => { closeModal(); switchHouse('Rocket Ship'); };
}
/* run a popup when nothing else is in the way (a modal, a tray, a walk, Gerald) */
function msWhenFree(fn, tries = 0) {
  const free = cur.mode === 'yard' && modal.hidden && !busy && !msGuideBusy() && !(typeof popOpen === 'function' && popOpen());
  if (free) { fn(); return; }
  if (tries < 3600) setTimeout(() => msWhenFree(fn, tries + 1), 1000); // after an hour of play the popup is dropped quietly: the item is already given
}

/* ---- art: the checklist card and the stamp card (WORLD ART props), with a pencil doodle fallback ---- */
function msDayLabel() { return tdate(new Date(), { weekday: 'long', day: 'numeric', month: 'short' }); }
// v2.14 fit: the card art wraps a row at its spaces and counts Latin letters, so Japanese, Chinese, Korean and Thai rows ran off the paper.
// For those scripts the row is measured here and handed over as whole lines: inner spaces become no-break spaces and each line is padded
// with zero-width spaces (nothing shows) so the art's own wrap keeps one line per row; the art still picks 16 px (2 lines) or 13 px (3 lines).
const MS_WIDE = /[฀-๿ᄀ-ᇿ぀-ヿ㐀-鿿가-힯豈-﫿＀-￯]/;
const MS_ROW_W = 86; // the art keeps a row's text between x 60 and 146
let msCtx = null;
// the card art draws these rows with Caveat, then the language's 'DD Local' faces (world B FONT_L), so they are measured with the same stack
const msFont = (fs) => `700 ${fs}px 'Caveat', 'DD Local Title', 'DD Local', cursive`;
// v2.14 fix: line breaks inside a word. The word segmenter splits words it does not know into single characters (お|み|くじ, 水|や|り,
// 狗狗|們), so a one-character segment never stands alone: one that may not start a line (particles, small kana, 們 / 的, closing
// punctuation, ๆ: kinsoku) and a lone hiragana (okurigana) stick to the segment before; any other one but a no-start one (a prefix like
// お / ご, an opening bracket, a lone hanzi, a lone hiragana) sticks to the segment after; the last segment of a row sticks to the one before.
// Spaces always allow a break. A glued word wider than the row breaks between its segments first, then between characters.
// No Intl.Segmenter: the old per-character wrap.
const MS_NO_START = /^[、。，．・：；？！ー）」』】〕〉》〜…‥々ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶをにはがでとのもへ們们的了着著得地嗎吗呢吧啊麼么,.!?:;)\]ๆฯ]$/;
function msJoin(segs) {
  const one = (s) => [...s].length === 1 && /\S/.test(s), out = [];
  segs.forEach((s, i) => {
    const a = i ? segs[i - 1] : '', back = one(s) && (MS_NO_START.test(s) || /^[ぁ-ゖ]$/.test(s) && !/^[おご]$/.test(s) || i === segs.length - 1);
    if (out.length && /\S$/.test(a) && /^\S/.test(s) && (one(a) && !MS_NO_START.test(a) || back)) out[out.length - 1].push(s); else out.push([s]);
  });
  return out;
}
function msLines(t, fs, w, whole) { // whole: null when a word would have to be cut (the balanced 3-line try below)
  if (msCtx === null) { try { msCtx = document.createElement('canvas').getContext('2d') || false; } catch (e) { msCtx = false; } }
  if (!msCtx) return null;
  msCtx.font = msFont(fs); const W = (s) => msCtx.measureText(s).width;
  let units; try { units = msJoin([...new Intl.Segmenter(document.documentElement.lang || undefined, { granularity: 'word' }).segment(t)].map((s) => s.segment)); } catch (e) { units = [...t].map((c) => [c]); }
  if (whole && units.some((u) => W(u.join('').trim()) > w)) return null;
  const out = [''];
  for (const u of units) for (const s of (W(u.join('')) > w ? u.flatMap((s0) => (W(s0) > w ? [...s0] : [s0])) : [u.join('')])) { const l = out[out.length - 1]; if (l.trim() && W((l + s).trimEnd()) > w) out.push(s.trimStart()); else out[out.length - 1] = l + s; }
  return out.map((l) => l.trim()).filter(Boolean);
}
// returns { text } or, when the row was measured at 13 px, { text, fs: 13 }: the art then draws it at 13 px even as 2 lines (v2.14 fix: rows
// measured at 13 px but drawn at 16 px ran into the "1/3" counter)
function msRowText(t, max = 3, w = 0) { // max: the lines a row may take (Daily rhythm: 6 on the one-mission card, which has the room of three rows)
  // w (layout audit, 5 Nov 2026): a Latin row on the one-mission card with no counter is measured to this width too; the art's own 14-letter wrap
  // left it in a narrow column (4 lines in German) with the right half of the row empty
  if (!MS_WIDE.test(t) && !w) return { text: esc(t) };
  const W = MS_WIDE.test(t) ? w || MS_ROW_W : w; // QA 6 Nov 2026: a CJK row on the one-mission card gets the same wider row as a Latin one (it wrapped in a 50 px column)
  let L = msLines(t, 16, W), fs = 16;
  if (!L) return { text: esc(t) };
  const r = (text) => (fs === 13 ? { text, fs } : { text });
  if (L.length > 2 || !msLines(t, 16, W, true)) { // 3+ lines at 16 px, or a word that only fits at 13 px
    fs = 13; L = msLines(t, 13, W);
    if (L.length < 3 && W === MS_ROW_W) { // the balanced 3-line try: CJK rows only (a Latin row keeps 2 lines when they fit)
      msCtx.font = msFont(13); const L3 = msLines(t, 13, Math.ceil(msCtx.measureText(t).width / 3) + 13, true); if (L3 && L3.length === 3) L = L3; }
    if (L.length > max) { L = L.slice(0, max); msCtx.font = msFont(13); let l = L[max - 1]; while (l.length > 1 && msCtx.measureText(l + '…').width > W) l = l.slice(0, -1); L[max - 1] = l + '…'; }
  }
  if (L.length < 2) return r(esc(L[0] || t).replace(/ /g, ' '));
  return r(L.map((l) => esc(l).replace(/ /g, ' ') + '​'.repeat(Math.max(0, 10 - l.length))).join(' '));
}
function msCardArt() {
  const list = msToday(), items = list.map((it) => Object.assign(msRowText(msText(it), list.length === 1 ? 6 : 3, list.length === 1 && !(it.n > 1) ? 96 : 0), { done: !!it.done, p: it.p || 0, n: it.n })), o = Object.assign({ items, stamps: S.missions.stamps, day: esc(msDayLabel()), title: tt('journal.tab_missions', 'Missions') }, items.length === 1 ? { one: true } : {}); // Daily rhythm: one mission, one row (o.one) and a 0/1 badge
  return artReal('prop', 'missioncard', o) || msCardFB(o);
}
function msWrap(t, max) { const w = String(t).split(' '), out = ['']; w.forEach((x) => { const l = out[out.length - 1]; if (l && (l + ' ' + x).length > max && out.length < 2) out.push(x); else out[out.length - 1] = l ? l + ' ' + x : x; }); return out; }
function msCardFB(o) {
  const lines = o.items.map((it, i) => { const y = (o.one ? 146 : 92) + i * 54, tl = msWrap(it.text, 19); return `<rect x="22" y="${y - 16}" width="20" height="20" rx="3" fill="#FFFBF3" stroke="${INKG}" stroke-width="2.2" transform="rotate(${[-3, 2, -1][i % 3]} 32 ${y - 6})"/>${it.done ? `<path d="M25 ${y - 6} l6 7 l12 -16" fill="none" stroke="#3E9A6A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}${tl.map((l, k) => `<text x="50" y="${y + k * 18}" font-family="Caveat,cursive" font-weight="700" font-size="17" fill="${INKG}">${l}</text>`).join('')}${it.n > 1 ? `<text x="178" y="${y}" text-anchor="end" font-family="Caveat,cursive" font-size="15" fill="${INKG}">${Math.min(it.p, it.n)}/${it.n}</text>` : ''}<path d="M48 ${y + 26} q60 3 128 -1" fill="none" stroke="#C9B8A6" stroke-width="1.2"/>`; }).join('');
  const nd = o.items.filter((x) => x.done).length;
  return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" class="ms-fb"><rect x="8" y="16" width="184" height="236" rx="12" fill="#D9A877" stroke="${INKG}" stroke-width="3"/><path d="M14 30 q2 100 0 210" stroke="#B9875A" stroke-width="2" fill="none" opacity=".6"/><rect x="18" y="32" width="164" height="210" rx="4" fill="#FFFBF3" stroke="${INKG}" stroke-width="2" transform="rotate(-1 100 137)"/><rect x="70" y="6" width="60" height="30" rx="7" fill="#C9CED6" stroke="${INKG}" stroke-width="2.6"/><circle cx="100" cy="16" r="5" fill="#FFFBF3" stroke="${INKG}" stroke-width="2"/><text x="28" y="58" font-family="Caveat,cursive" font-weight="700" font-size="20" fill="${INKG}">${esc(tt('missions.today', 'Today'))}</text><text x="176" y="58" text-anchor="end" font-family="Caveat,cursive" font-size="14" fill="${INKG}">${o.day || ''}</text>${lines}<g transform="translate(160 232) rotate(-8)"><circle r="16" fill="#F9D56E" stroke="${INKG}" stroke-width="2.2"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="17" fill="${INKG}">${nd}/${o.items.length || 1}</text></g></svg>`;
}
function msStampArt() { const s = S.missions.stamps; return artReal('prop', 'stampcard', { stamps: s, title: tt('missions.stamp_card', 'Stamp card') }) || msStampFB(s); }
function msStampFB(s) {
  const spots = Array.from({ length: MS_CARD }, (_, i) => { const x = 34 + i * 29, y = 80 + (i % 2 ? 8 : -6); return `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#C9B8A6" stroke-width="1.6" stroke-dasharray="3 3"/>${i < s ? doodle('paw', x, y + 1, 0.95, [-12, 8, -4, 14, -8, 5, -14][i]).replace(/#E0D5F0/g, '#F28FA5') : ''}`; }).join('');
  return `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" class="ms-fb"><rect x="6" y="10" width="228" height="122" rx="12" fill="#FFF3D6" stroke="${INKG}" stroke-width="3" transform="rotate(-1 120 71)"/><rect x="88" y="2" width="64" height="16" fill="rgba(242,143,165,.55)" transform="rotate(4 120 10)"/><text x="120" y="44" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="22" fill="${INKG}">${esc(tt('missions.stamp_card', 'Stamp card'))}</text>${spots}<text x="120" y="122" text-anchor="middle" font-family="Caveat,cursive" font-size="15" fill="${INKG}">${esc(tt('missions.seven_surprise', '7 stamps is a surprise'))}</text></svg>`;
}
const MS_TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.2"/><path class="ms-tk" d="M6 12 l4 5 l9 -11" fill="none" stroke="#3E9A6A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* the popup / tab body: the clipboard with today's lines, the coin line, the stamp card */
function msBodyHTML(stampNew) {
  const list = msToday(), m = S.missions, nd = list.filter((x) => x.done).length, total = list.length || 1;
  const lines = list.map((it) => `<li class="${it.done ? 'done' : ''}" data-ms="${esc(it.id)}">${MS_TICK}<span class="ms-t">${esc(msText(it))}</span><span class="ms-p">${it.done ? `+${MS_PAY}` : `${Math.min(it.p || 0, it.n)}/${it.n}`}</span></li>`).join('');
  if (!ms2On()) { // v2.20 off (MS2_LIVE, 24b_missions2.js): exactly the v2.19.2 sheet, the mission's own swap and no helps
    const swap1 = msSwapFree() ? `<p class="ms-swapline"><button class="btn ms-swap" type="button" id="msSwap">${esc(tt('missions.swap', 'Swap it'))}</button> <span class="small">${esc(tt('missions.swap_note', 'One free swap a day.'))}</span></p>`
      : m.swap === jstISO() ? `<p class="small ms-swapline">${esc(tt('missions.swap_used', 'Swapped today. A new mission comes tomorrow.'))}</p>` : '';
    return `<div class="ms-body"><div class="ms-cardwrap"><span class="ms-card" aria-hidden="true">${msCardArt()}</span><ul class="ms-list" aria-label="${esc(tt('missions.list_aria', "Today's missions"))}">${lines}</ul></div>
    <div class="ms-side"><p class="ms-coins">${tt('missions.coins1_html', "Today's mission pays <b>{pay} coins</b> and a crayon stamp. Done today: <b>{nd} of {total}</b>.", { pay: MS_PAY, nd, total })}</p>${swap1}
    <div class="ms-stampwrap${stampNew ? ' new' : ''}" data-stamps="${m.stamps}"><span class="ms-stampcard" aria-hidden="true">${msStampArt()}</span></div><p class="ms-sline">${tt('missions.stamps1_html', '<b>{n} of {total}</b> stamps. Every finished mission earns a stamp. Seven stamps is a surprise.{cards, select, yes { Full cards so far: {c}.} other {}}', { n: m.stamps, total: MS_CARD, cards: m.cards ? 'yes' : 'no', c: m.cards })}</p></div></div>`;
  }
  // the free swap (Daily rhythm; v2.20: on any one row, 24b_missions2.js): the mission's button right under the card, the help rows carry their own
  const swap = ms2SwapLineHTML();
  // v2.20 fix batch: phones keep the little helps under the card; desktop puts them at the top of the right column (they fit there, Swap on one line)
  // and the help-wanted summary under the card, so all of Today sits near the top
  const ph = isPhone(), helps = ms2HelpsHTML(), sum = typeof msWeekSummaryHTML === 'function' ? msWeekSummaryHTML() : '';
  return `<div class="ms-body"><div class="ms-left"><div class="ms-cardwrap"><span class="ms-card" aria-hidden="true">${msCardArt()}</span><ul class="ms-list" aria-label="${esc(tt('missions.list_aria', "Today's missions"))}">${lines}</ul></div>${swap}${ph ? helps : sum}</div>
    <div class="ms-side"><p class="ms-coins">${tt('missions.coins1_html', "Today's mission pays <b>{pay} coins</b> and a crayon stamp. Done today: <b>{nd} of {total}</b>.", { pay: MS_PAY, nd, total })}</p>${ph ? '' : helps}${ms2PouchHTML()}
    <div class="ms-stampwrap${stampNew ? ' new' : ''}" data-stamps="${m.stamps}"><span class="ms-stampcard" aria-hidden="true">${msStampArt()}</span></div><p class="ms-sline">${tt('missions.stamps1_html', '<b>{n} of {total}</b> stamps. Every finished mission earns a stamp. Seven stamps is a surprise.{cards, select, yes { Full cards so far: {c}.} other {}}', { n: m.stamps, total: MS_CARD, cards: m.cards ? 'yes' : 'no', c: m.cards })}</p>${ph ? sum : ''}</div></div>`;
}
// v2.20: one sheet with tabs (Today, Week, Badges, Notebook: 24b_missions2.js), opened on a tab (Today by default)
function msOpen(tab) {
  if (!S) return null; msRoll(); SFX.boop(700);
  if (!ms2On()) return openModal(tt('missions.title', 'Daily missions'), msBodyHTML(false), { cls: 'ms-pop' }); // v2.20 off: the v2.19.2 sheet
  MS2.tab = typeof tab === 'string' && tab ? tab : 'today'; MS2.dot = false;
  const p = openModal(tt('journal.tab_missions', 'Missions'), ms2SheetHTML(false), { cls: 'ms-pop' });
  msHudSync(); return p;
}
function msTabHTML() { if (!S) return ''; msRoll(); return `${ms2On() ? ms2SheetHTML(false) : msBodyHTML(false)}<p class="small ms-reset">${esc(tt('missions.reset1', 'One mission a day. The next one comes at {time} your time (midnight in Japan). Finished or not, tomorrow brings a fresh one.', { time: tdate(msResetAt(), { hour: 'numeric', minute: '2-digit' }) }))}</p>`; }
/* redraw whatever shows the missions: the popup, the Journal tab, the yard clipboard */
function msRefresh(stampNew) {
  if (!S || !S.missions) return;
  const v2 = ms2On(), body = () => (v2 ? ms2SheetHTML(!!stampNew) : msBodyHTML(!!stampNew)); // v2.20 off (MS2_LIVE): the v2.19.2 sheet
  const pop = $('#modal .panel.ms-pop .panel-body'); if (pop) pop.innerHTML = body();
  const jt = $(v2 ? '#modal .panel.journal .ms-sheet' : '#modal .panel.journal .ms-body'); if (jt) jt.outerHTML = body();
  msYardRedraw();
}

/* ---- the yard clipboard on the left fence (world box, 1000x600 scene) ---- */
const MS_YARD = [208, 318, 50, 64]; // on the house wall between the front door and the mailbox, under the window; clear of #dogHit, the mailbox, the photo frame, the crayon box and the dog house
const MS_YARD_MAXX = 260; // the mailbox tap box starts at x=261
// the tap rect: on phones at least 48 screen px each way (like hmDecorHit), kept left of the mailbox.
// v2.9: while a Feed, Play or Care tray is open the scene shrinks into the strip above it, so the rect grows in world units (44 px, the least a tap needs) instead of the clipboard hiding; msYardFit re-reads the scale whenever the scene resizes.
function msTrayOpen() { return !!document.querySelector('#dock > .tray:not(.dock-idle):not(.mini)'); }
function msYardRect() {
  let [x, y, w, h] = MS_YARD;
  if (isPhone()) {
    const s = phHitScale(), m = (msTrayOpen() ? 44 : 48) / s; if (w < m) { x -= (m - w) / 2; w = m; } if (h < m) { y -= (m - h) / 2; h = m; } if (x + w > MS_YARD_MAXX) x = MS_YARD_MAXX - w;
    // v2.9: the camera can slide the clipboard to the edge (a tray open while the leader is by the dog house). The tap box stays fully on screen; when that would
    // take it off the clipboard (or onto the mailbox) it is switched off until the camera comes back
    const vis = msYardVis(); if (vis) {
      if (x < vis[0]) x = vis[0]; if (x + w > vis[1]) x = vis[1] - w;
      const [ax, , aw] = MS_YARD; if (x < vis[0] - 0.5 || x + w > vis[1] + 0.5 || x + w > MS_YARD_MAXX + 0.5 || x > ax + aw - 12 || x + w < ax + 12) return [MS_YARD[0], MS_YARD[1], 0, 0];
    }
  }
  return [x, y, w, h];
}
// the scene x range on screen (the view's box, inside the window), in scene units
function msYardVis() {
  const svg = $('#view > svg.world'), m = svg && svg.isConnected && svg.getScreenCTM(); if (!m || !(m.a > 0.05)) return null;
  const vr = view.getBoundingClientRect(), l = Math.max(vr.left, 0), r = Math.min(vr.right, innerWidth); if (r - l < 10) return null;
  return [(l - m.e) / m.a, (r - m.e) / m.a];
}
function msYardHit() { const [x, y, w, h] = msYardRect(); return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="transparent" pointer-events="all"/>`; }
// re-read the scale and resize the tap rect in place (no redraw, so a tap in progress is not lost)
function msYardFit() {
  const r = $('#msCardG > rect'); if (!r) return;
  const [x, y, w, h] = msYardRect(); r.setAttribute('x', f1(x)); r.setAttribute('y', f1(y)); r.setAttribute('width', f1(w)); r.setAttribute('height', f1(h));
}
{ let raf = 0; const fit = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; msYardFit(); }); };
  const dk = $('#dock'), vw = $('#view');
  if (dk && typeof MutationObserver === 'function') new MutationObserver(fit).observe(dk, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  if (vw && typeof MutationObserver === 'function') { new MutationObserver(fit).observe(vw, { attributes: true, attributeFilter: ['style'] }); new MutationObserver(fit).observe(vw, { attributes: true, attributeFilter: ['viewBox'], subtree: true }); } // v2.9: the camera moves (viewBox) too
  if (vw) vw.addEventListener('transitionend', fit, true);
  window.addEventListener('resize', fit); }
// While a tray is open the dock is a full-screen backdrop (a tap on it closes the tray), so the clipboard cannot take the tap itself: a tap that lands inside its
// tap rect closes the tray and opens the Missions sheet instead of only closing the tray.
document.addEventListener('click', (e) => {
  const dk = $('#dock'); if (!dk || e.target !== dk || !isPhone() || !msTrayOpen()) return;
  const r = $('#msCardG > rect'); if (!r) return; const b = r.getBoundingClientRect();
  if (!b.width || e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) return;
  e.stopImmediatePropagation(); e.preventDefault(); popDown(); msOpen();
}, true);
function msYardSVG() {
  if (!S || S.place !== 'yard') return '';
  msFields(); if (S.missions.date !== jstISO()) msRoll();
  const [x, y, w, h] = MS_YARD, nd = msDoneN(), tot = msTotal();
  return `<g id="msCardG" class="hot" tabindex="0" role="button" aria-label="${esc(msHudLabel(nd))}" data-done="${nd}">${place(msCardArt(), x, y, w, h)}<g class="ms-badge" pointer-events="none" transform="translate(${x + w - 8} ${y + 8}) rotate(-8)"><circle r="13" fill="${nd >= tot ? '#BFE3C8' : '#F9D56E'}" stroke="${INKG}" stroke-width="2.4"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="16" fill="${INKG}">${nd}/${tot}</text></g>${msYardHit()}</g>`;
}
function msYardBind() {
  const g = $('#msCardG'); if (!g) return;
  const go = (e) => { if (e) e.stopPropagation(); SFX.click(); msOpen(); };
  g.onclick = go; g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
}
// v2.16.1 (owner: the yard was cluttered): the clipboard left the yard. The missions live in a small crayon clipboard with the done count (1/3) in the top bar
// next to the coins on desktop (#msBtn), and in the "..." menu on phones (msMenuBtn, 22c_phone_shell.js). Both open the same Missions sheet (msOpen).
// msYardSVG and the tap-rect helpers above stay for the old tests' sake only; nothing draws them now.
function msYardRedraw() { const old = $('#msCardG'); if (old) old.remove(); msHudSync(); }
function msHudIcon() { return iconOr('missions', '<path d="M-9 -12h18v24h-18z" fill="#FFF4DF" stroke="#5B3D32" stroke-width="2"/><path d="M-5 0l4 4l7 -9" fill="none" stroke="#5B3D32" stroke-width="2.4" stroke-linecap="round"/>'); }
const msHudLabel = (nd) => tt('missions.hud_aria', 'Daily mission: {nd} of {total} done', { nd, total: msTotal() });
function msHudSync(ping) {
  const coins = $('#coins'); if (!coins) return; let b = $('#msBtn');
  if (!b) {
    coins.insertAdjacentHTML('afterend', `<button id="msBtn" class="ms-btn" type="button" hidden><span class="ms-ic" aria-hidden="true">${msHudIcon()}</span><b class="ms-n"></b><i class="ms-dot" aria-hidden="true"></i></button>`);
    b = $('#msBtn'); b.onclick = (e) => { e.stopPropagation(); SFX.click(); msOpen(); };
  }
  const on = !!S && !!S.missions && cur.mode !== 'title';
  if (on) { msFields(); if (S.missions.date !== jstISO()) msRoll(); }
  const nd = on ? msDoneN() : 0, tot = on ? msTotal() : 1, txt = nd + '/' + tot;
  if (b.hidden === on) b.hidden = !on; if (!on) return;
  const n = b.querySelector('.ms-n'); if (n.textContent !== txt) n.textContent = txt;
  const lbl = msHudLabel(nd); if (b.getAttribute('aria-label') !== lbl) { b.setAttribute('aria-label', lbl); b.title = lbl; }
  b.dataset.done = String(nd); b.classList.toggle('all', nd >= tot); b.classList.toggle('dot', ms2DotOn()); // v2.20: a soft dot, never a number
  if (ping && !motionOff()) { b.classList.remove('ms-ping'); void b.offsetWidth; b.classList.add('ms-ping'); }
}
// the "..." menu on phones: the missions with their count
function msMenuBtn() { if (!S || !S.missions) return ''; const nd = msDoneN(); return `<button class="btn big" id="mmMs" aria-label="${esc(msHudLabel(nd))}"><span class="ic">${msHudIcon()}</span>${esc(tt('missions.title', 'Daily missions'))} <b class="ms-cnt">${nd}/${msTotal()}</b>${ms2DotOn() ? '<i class="ms-dot on" aria-hidden="true"></i>' : ''}</button>`; }
on('yard:enter', () => { if (window.__paw && !window.__paw.ms) msExpose(); if (S && S.place === 'yard') msYardRedraw(); });
on('scene:redraw', () => { if (S && S.place === 'yard') msYardRedraw(); });
on('game:ready', () => setTimeout(msHudSync, 0));

/* ---- tests ---- */
function msExpose() {
  if (!window.__paw) return;
  window.__paw.ms = {
    roll: (f) => msRoll(f), today: () => msToday(), open: () => msOpen(), hud: () => msHudSync(), pool: MS_POOL.map((d) => d.id), pick: (date) => msPick(date), yard: MS_YARD,
    pay: MS_PAY, card: MS_CARD, cardCoins: MS_CARD_COINS, swap: () => msSwap(), swapFree: () => msSwapFree(), eligible: () => msEligible().map((d) => d.id), weight: (id) => { const d = msDef(id); return d ? msW(d) : null; }, fields: () => msFields(), stallDay: () => msStallDay(), resetAt: () => msResetAt().toISOString(),
    force: (ids) => { msRoll(); S.missions.list = msForced = ids.map((id) => { const d = msDef(id); return d ? (msItem(d, Math.random) || { id, n: d.n, p: 0, done: null }) : null; }).filter(Boolean); S.missions.stampDay = ''; markDirty(); msRefresh(); return S.missions.list; },
    text: (it, s) => msText(it, s), act: (kind, data) => trackAct(kind, data), flush: () => msFlush(), get queue() { return msQueue.length; }
  };
}
on('game:ready', () => { msFields(); setTimeout(msExpose, 0); });
setInterval(() => { if (S && cur.mode !== 'title') { msFlush(); if (S.missions && S.missions.date && S.missions.date !== jstISO()) msRoll(); } msHudSync(); }, 1000);
