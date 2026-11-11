#!/usr/bin/env node
// Doodle Doggo balance sim (skill paw-balance): coins a day, the day each thing is affordable and the day everything is owned, for three
// player kinds, with the game's own numbers.
//
//   NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors node tools/balance_sim.js [options]
//     --add <file.json>     extra sinks / sources to test (repeatable). See .claude/skills/paw-balance/SKILL.md for the format
//     --profile <name>      light | regular | keen | all (default all)
//     --days <n>            how far to simulate (default 365)
//     --supporter           the player owns the Supporter Pack (+20% walk coins, KS_WALK_K)
//     --no-kind             leave the kind shop coin buys (looks, tools) out of the shopping list
//     --start <YYYY-MM-DD>  day 1 (default today; sets the garden season)
//     --tables <file>       use a saved table dump instead of loading the game (--save-tables <file> writes one)
//     --measure [routes]    play real walks with the autoplayer first (comma list, default park,park,park,sunflower,river,river,woods,beach;
//                           about 75 s each) and save them to tools/balance_walk.json
//     --json <file>         also write the raw results
//     --build               rebuild the game and the harness first (otherwise only when the sources are newer)
//
// Where the numbers come from: everything in TABLES is read from the running game (window.__econ, injected into a scratch copy of
// game/test_merged.html by tools/paw_sim_lib.js). Walk pay is measured (tools/balance_walk.json, made by --measure). What players DO each
// day is the PROFILES table below, and what the game does not expose as a constant is the ASSUME table (each row says where it is from).
const fs = require('fs'), path = require('path');
const L = require('./paw_sim_lib');

/* ---------------- options ---------------- */
const argv = process.argv.slice(2), opt = { add: [], profile: 'all', days: 365, supporter: false, kind: true, start: null, tables: null, saveTables: null, measure: null, json: null, build: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], nx = () => argv[++i];
  if (a === '--add') opt.add.push(nx()); else if (a === '--profile') opt.profile = nx(); else if (a === '--days') opt.days = +nx();
  else if (a === '--supporter') opt.supporter = true; else if (a === '--no-kind') opt.kind = false; else if (a === '--start') opt.start = nx();
  else if (a === '--tables') opt.tables = nx(); else if (a === '--save-tables') opt.saveTables = nx(); else if (a === '--json') opt.json = nx(); else if (a === '--build') opt.build = true;
  else if (a === '--measure') opt.measure = argv[i + 1] && !argv[i + 1].startsWith('--') ? nx() : 'park,park,park,sunflower,river,river,woods,beach';
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 20).join('\n')); process.exit(0); }
  else { console.error('unknown option ' + a); process.exit(2); }
}

/* ---------------- what the game does not expose as one constant (one table, with sources) ---------------- */
const ASSUME = {
  careBonus: 10,          // raw coins per daily care bonus (x BOOST): dailyCare(), game/src/00_core.js:1535-1537; kinds feed / pet / play (a walk) / outfit
  squareGoal: 30,         // 3 trick shows in the Town Square, once a Japan day: game/src/15_trick_training.js:126
  trickShowMax: 100,      // trick show coins a day: 10 shows x 5 (mastered) x 2 (audience): game/src/15_trick_training.js:131
  beachDig: 17,           // average beach dig (55%: 5-20 x BOOST, else 2-5 x BOOST): game/src/03_yard.js:610-611
  mailPerDay: 10,         // mailbox neighbour gift, 10-25 on about 60% of days: game/src/07b_mailbox.js (economy-review.md "How players earn")
  calendarPerDay: 8,      // calendar + daily gift coins, capped FW_CAL_COIN_CAP + FW_DG_COIN_CAP (80 + 160) a month: game/src/47_firstweek.js:199
  hungerPerMin: 6 / 2.5,  // Hunger -6 a game hour (game/src/21_time_loop.js tick) and a game hour is 2.5 real minutes (GAME_SEC)
  foodAway: 15,           // kibble to top up after a day away (about 3 x Basic Kibble)
  starAvg: 1.3,           // average Pip price multiplier for crops (STAR_MULT 1 / 1.5 / 2; most crops 1-2 stars with daily watering): guess
  pouchRamp: 120,         // walks until a route's treasures are mostly owned and finds turn into coin pouches (economy-review.md, sim.js)
  dupCoins: 40,           // a duplicate treasure sold to the squirrel: game/src/18_mod_walk_toys.js res_dup text
  findCap: 0.7,           // a person finds the walk's treasure on at most ~7 walks in 10 (the autoplayer reads the Nose-o-meter perfectly and finds it
                          // nearly every time; economy-review sim.js used 0.6). The measured rate is used when it is lower
  ffScore: 0.8,           // share of a Fun Fair round's top pay a fair player gets
  startCoins: 150,        // a new save's coins: game/src/00_core.js newSave (economy-review.md "One-offs")
  // fallback walk pay when tools/balance_walk.json is missing (economy-review.md, measured 3 Nov 2026: about 63 real coins a walk)
  walkFallback: { path: 28, junk: 3, found: 0.6, bond: 17 }
};

/* ---------------- the three player kinds (what they do in a day) ---------------- */
// walks: walks a day; care: care actions that count for XP (feed, pet, fetch, toy, bath, nap, trick, scoop, photo); careBonus: which daily
// bonuses they collect; mission: share of days the daily mission gets done; helps / wishes: a day; ff: Fun Fair rounds a day (0 = none,
// 'all' = every open game to its daily cap); toys / ball / agility: coins a day they reach (capped by the game); tricks: share of the trick
// show coins; square: the Square goal; garden: check-ins a day (harvest + replant); board: weekly board share; stall, photo: weekly;
// home: home XP events a day; bondCare: Bond from care a day (raw, before BOOST.bond)
const PROFILES = {
  light: { label: 'Light (about 15 min a day)', min: 15, walks: 2, care: 4, careBonus: ['feed', 'pet', 'play'], mission: 0.7, helps: 1, wishes: 1, ff: 0, toys: 0, ball: 0, agility: 0, tricks: 0, square: false, beach: false, garden: 1, board: 0.5, stall: false, photo: 0, home: 1, bondCare: 10 },
  regular: { label: 'Regular (about 45 min a day)', min: 45, walks: 5, care: 10, careBonus: ['feed', 'pet', 'play', 'outfit'], mission: 1, helps: 2, wishes: 2, ff: 3, toys: 15, ball: 20, agility: 0, tricks: 0.3, square: true, beach: false, garden: 2, board: 1, stall: true, photo: 20, home: 3, bondCare: 40 },
  keen: { label: 'Keen (about 2 hours a day)', min: 120, walks: 12, care: 15, careBonus: ['feed', 'pet', 'play', 'outfit'], mission: 1, helps: 2, wishes: 2, ff: 'all', toys: 30, ball: 40, agility: 40, tricks: 0.8, square: true, beach: true, garden: 4, board: 1, stall: true, photo: 30, home: 5, bondCare: 120 }
};

/* ---------------- tables ---------------- */
async function loadTables() {
  if (opt.tables) return JSON.parse(fs.readFileSync(opt.tables, 'utf8'));
  L.ensureHarness(opt.build); const file = L.scratchCopy({ econ: true }); const b = await L.launch();
  try {
    const p = await L.newPage(b); await p.goto('file://' + file);
    if (!(await L.until(p, () => typeof window.__econ === 'function', null, 60000))) throw new Error('the game did not load: ' + p.errors.slice(0, 3).join(' | '));
    return await p.evaluate(() => window.__econ());
  } finally { await b.close(); }
}
const WALK_FILE = path.join(__dirname, 'balance_walk.json');
function walkModel(T) {
  let w = null; try { w = JSON.parse(fs.readFileSync(WALK_FILE, 'utf8')); } catch (e) { /* none yet */ }
  const ok = w && Array.isArray(w.walks) ? w.walks.filter((x) => !x.failed) : [];
  if (!ok.length) return Object.assign({ src: 'fallback (economy review, no tools/balance_walk.json yet: run --measure)', n: 0 }, ASSUME.walkFallback);
  const avg = (f) => ok.reduce((s, x) => s + f(x), 0) / ok.length;
  return { src: `measured ${ok.length} real walks (${w.date}, ${[...new Set(ok.map((x) => x.area))].join(', ')})`, n: ok.length, path: avg((x) => x.coins - x.junkCoins - x.pouch), junk: avg((x) => x.junkCoins),
    found: Math.min(ASSUME.findCap, avg((x) => (x.treasure ? 1 : 0))), foundMeasured: avg((x) => (x.treasure ? 1 : 0)), bond: avg((x) => x.bond), hits: avg((x) => x.hits || 0), placed: avg((x) => x.placed || 0) };
}

/* ---------------- the model ---------------- */
function build(T, extra) {
  const need = (kind, id, bond) => { const v = T.LV_UNLOCK[kind + ':' + id]; return typeof v === 'number' ? v : T.LV_FLOOR[Math.max(1, Math.min(10, bond || 1))]; };
  const shop = [];
  const add = (cat, n, price, bond, src) => shop.push({ cat, n, price, lv: need('item', n, bond), src });
  T.TOYS.filter((x) => !x.reward && !x.fest && x.price > 0).forEach((x) => add('toys', x.n, x.price, x.bond, '00_core.js TOYS'));
  T.CLOTHES.filter((x) => !x.reward && !x.fest && x.price > 0).forEach((x) => add('clothes', x.n, x.price, x.bond, '00_core.js CLOTHES'));
  T.HOUSES.filter((x) => !x.reward && !x.fest && x.price > 0).forEach((x) => add('houses', x.n, x.price, x.bond, '00_core.js HOUSES'));
  T.BEDS.filter((x) => !x.fm && !x.fest && !x.ks && x.price > 0).forEach((x) => add('beds', x.n, x.price, x.bond, '12_popups BEDS'));
  (T.DECOR_SHOP || []).filter((x) => x.price > 0).forEach((x) => add(x.cat, x.n, x.price, x.bond, '03_yard.js HM_DECOR'));
  (T.TOOLS || []).forEach((x) => add('tools', x.n, x.price, x.bond, '05_market_shops.js twTools'));
  const kind = [];
  if (opt.kind && T.KS_ITEMS) {
    (T.KS_TOKYO || []).concat(T.KS_COZY || []).forEach((n) => kind.push({ cat: 'kind look', n, price: T.KS_LOOK_COINS, lv: 1, check: true, src: '52_kindshop.js KS_LOOK_COINS' }));
    (T.KS_TOOLS || []).forEach((k) => kind.push({ cat: 'kind tool', n: T.KS_ITEMS[k].prop || k, price: T.KS_ITEMS[k].coins, lv: 1, check: true, src: '52_kindshop.js KS_ITEMS' }));
  }
  const sinks = [], sources = [];
  extra.forEach((e) => {
    const list = Array.isArray(e) ? e : e.sinks || []; list.forEach((s) => sinks.push({ cat: s.cat || 'new', n: s.n, price: +s.price, lv: s.level || 1, check: true, src: 'added' }));
    (e.sources || []).forEach((s) => sources.push(s));
  });
  return { shop, kind, sinks, sources, need };
}

function seasonOf(date) { const m = date.getUTCMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'; }
function gardenDay(T, checkins, season, sprinkler) {
  // the best crop this season for a player who comes back `checkins` times a day: 6 plots, harvest and replant each visit, sold to Pip (PIP_CAP raw a day)
  const crops = (T.CROPS || T.CROPS_FB).filter((c) => c.seasons.includes(season) || c.hardy); let best = 0;
  crops.forEach((c) => {
    const hrs = c.hours / (sprinkler ? T.KS_GROW_MUL : 1), cycles = Math.min(checkins, Math.floor(16 / hrs) || 1); // 16 waking hours
    const per = c.yield * Math.round(c.sell * ASSUME.starAvg) - c.seed; best = Math.max(best, cycles * 6 * per);
  });
  return Math.max(0, Math.min(best, T.PIP_CAP));
}

function simulate(T, W, M, key) {
  const P = PROFILES[key], B = T.BOOST, start = opt.start ? new Date(opt.start + 'T00:00:00Z') : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const want = M.shop.concat(M.kind, M.sinks).map((x, i) => Object.assign({ i }, x)).sort((a, b) => a.price - b.price || a.i - b.i);
  const avgPouch = T.RAR_P.reduce((s, p, i) => s + p * T.RAR_COINS[i], 0) / 100;
  let coins = ASSUME.startCoins, xp = 0, lv = 1, bondPts = 0, bond = 1, walks = 0, stamps = 0, cards = 0, cum = 0, wall = 0, maxWall = 0, everything = null;
  const owned = new Set(), bought = {}, days = [], lvDay = {}, bondDay = {}, firstOpen = {};
  const routes = Object.keys(T.ROUTES);
  for (let d = 1; d <= opt.days; d++) {
    const date = new Date(start.getTime() + (d - 1) * 864e5), dow = date.getUTCDay(), season = seasonOf(date);
    const open = (kind, id, bond) => lv >= M.need(kind, id, bond);
    const inc = { walks: 0, care: 0, mission: 0, card: 0, helps: 0, wishes: 0, ff: 0, toys: 0, ball: 0, agility: 0, tricks: 0, garden: 0, board: 0, stall: 0, photo: 0, mail: 0, calendar: 0, beach: 0, supporter: 0, extra: 0 };
    // walks: the best open route; first WALK_FULL a Japan day full, then half (path + junk; the pouch stays whole), all x BOOST.coins
    const route = routes.filter((r) => open('route', r, T.ROUTES[r].bond) && T.LV_WALK[r]).sort((a, b) => T.LV_WALK[b] - T.LV_WALK[a])[0] || 'park';
    for (let i = 1; i <= P.walks; i++) {
      const share = i > T.WALK_FULL ? 0.5 : 1, ramp = Math.min(1, walks / ASSUME.pouchRamp);
      const base = Math.ceil((W.path + W.junk) * share), pouch = W.found * ramp * avgPouch, dup = W.found * (1 - ramp) * 0.3 * ASSUME.dupCoins / B.coins;
      const pay = Math.round((base + pouch + dup) * B.coins); inc.walks += pay; walks++;
      if (opt.supporter) inc.supporter += Math.floor(pay * T.KS_WALK_K);
    }
    inc.care = P.careBonus.filter((k) => k !== 'outfit' || [...owned].some((n) => M.shop.find((s) => s.n === n && s.cat === 'clothes'))).length * ASSUME.careBonus * B.coins;
    const msDone = P.mission >= 1 || (d * P.mission) % 1 < P.mission; // spread the share over the days
    if (msDone) { inc.mission = T.MS_PAY; stamps++; if (stamps % T.MS_CARD === 0) { cards++; if (cards >= 3) inc.card = T.MS_CARD_COINS; } }
    inc.wishes = Math.min(P.wishes * T.DD_COIN, T.DD_COIN_DAY);
    // Fun Fair: the open games, the richest first
    const ffOpen = Object.keys(T.FF_GAMES).filter((k) => open('ff', k, T.FF_GAMES[k].bond)).sort((a, b) => T.FF_CAPS[b].day - T.FF_CAPS[a].day);
    const ffList = P.ff === 'all' ? ffOpen : ffOpen.slice(0, P.ff || 0);
    inc.ff = ffList.reduce((s, k) => s + Math.min(T.FF_CAPS[k].day, P.ff === 'all' ? T.FF_CAPS[k].day * ASSUME.ffScore : T.FF_CAPS[k].round * ASSUME.ffScore), 0);
    inc.toys = Math.min(P.toys, T.FF_CAPS.toys.day); inc.ball = Math.min(P.ball, T.BL_COIN_DAY);
    inc.agility = open('place', 'training', 1) ? Math.min(P.agility, T.AG_COIN_DAY) : 0;
    inc.tricks = (P.square ? ASSUME.squareGoal : 0) + Math.round(P.tricks * ASSUME.trickShowMax);
    inc.beach = P.beach && open('place', 'beach', 8) ? ASSUME.beachDig : 0;
    inc.garden = open('feat', 'garden', 2) ? gardenDay(T, P.garden, season, owned.has('Garden Sprinkler')) : 0;
    if (dow === 0 && P.board) inc.board = Math.round(T.MSW_COINS * P.board);
    if (dow === 6 && P.stall && open('feat', 'stall', 2)) inc.stall = T.FF_CAPS.stall.week;
    if (dow === 0 && P.photo) inc.photo = Math.min(P.photo, T.FF_CAPS.photo.week);
    inc.mail = ASSUME.mailPerDay; inc.calendar = ASSUME.calendarPerDay;
    M.sources.forEach((s) => { if (d >= (s.fromDay || 1)) inc.extra += typeof s.perDay === 'object' ? +(s.perDay[key] || 0) : +s.perDay || 0; });
    const earned = Object.values(inc).reduce((s, v) => s + v, 0);
    const food = Math.round(P.min * ASSUME.hungerPerMin / 30 * 5 + ASSUME.foodAway); // Basic Kibble: 30 Hunger for 5 coins
    coins += earned - food; cum += earned - food;
    // town level XP (LV_SRC, capped LV_CAP a day) and milestones (Bond levels, the weekly board)
    const S = T.LV_SRC; let g = Math.min(P.care, S.care[1]) * S.care[0] + Math.min(P.walks, T.WALK_FULL) * (T.LV_WALK[route] || 8) + (msDone ? S.ms[0] : 0)
      + Math.min(P.helps, S.help[1]) * S.help[0] + Math.min(P.wishes, S.wish[1]) * S.wish[0] + Math.min(ffList.length, S.ff[1]) * S.ff[0] + Math.min(P.home, S.home[1]) * S.home[0];
    g = Math.min(g, T.LV_CAP); if (dow === 0 && P.board >= 1) g += T.LV_MILE.board;
    bondPts += Math.round((P.walks * W.bond + P.bondCare) * T.BOOST.bond);
    while (bond < 10 && bondPts >= T.BOND_TH[bond]) { bond++; g += T.LV_MILE.bond; if (!bondDay[bond]) bondDay[bond] = d; }
    xp += g; while (lv < T.LV_MAX && xp >= T.LV_AT[lv + 1]) { lv++; lvDay[lv] = d; }
    // shopping: cheapest open thing not owned, as long as coins last
    let nb = 0;
    for (const it of want) { if (owned.has(it.n)) continue; if (lv < it.lv) continue; if (!firstOpen[it.n]) firstOpen[it.n] = d; if (coins < it.price) continue; coins -= it.price; owned.add(it.n); bought[it.n] = d; nb++; }
    const left = want.filter((it) => !owned.has(it.n)), leftOpen = left.filter((it) => lv >= it.lv);
    if (leftOpen.length && !nb) { wall++; maxWall = Math.max(maxWall, wall); } else wall = 0;
    if (!left.length && !everything) everything = d;
    days.push({ d, earned: Math.round(earned), food, net: Math.round(earned - food), bank: Math.round(coins), cum: Math.round(cum), lv, bond, owned: owned.size, inc: Object.fromEntries(Object.entries(inc).map(([k, v]) => [k, Math.round(v)])) });
  }
  // the day each checked thing could be bought if it were the only goal (net coins since day 1, from the day its level opens)
  const saveDay = (it) => { const o = firstOpen[it.n] || null; for (const x of days) if (x.cum >= it.price && x.lv >= it.lv) return x.d; return null; };
  const checks = M.kind.concat(M.sinks).map((it) => ({ n: it.n, cat: it.cat, price: it.price, lv: it.lv, save: saveDay(it), bought: bought[it.n] || null }));
  const big = M.shop.filter((x) => x.price >= 1200).map((it) => ({ n: it.n, cat: it.cat, price: it.price, lv: it.lv, open: lvDay[it.lv] || (it.lv <= 1 ? 1 : null), bought: bought[it.n] || null }));
  const baseOwned = (() => { const need = M.shop.map((x) => x.n); for (const x of days) { if (need.every((n) => bought[n] && bought[n] <= x.d)) return x.d; } return null; })();
  return { key, label: P.label, route: null, days, lvDay, bondDay, everything, baseOwned, maxWall, checks, big, total: want.reduce((s, x) => s + x.price, 0), n: want.length, shopTotal: M.shop.reduce((s, x) => s + x.price, 0) };
}

/* ---------------- the report ---------------- */
const fmt = (n) => (n == null ? 'never' : Math.round(n).toLocaleString('en-US'));
const dd = (n) => (n == null ? `> ${opt.days}` : 'day ' + n);
function avgOf(r, a, b, f) { const xs = r.days.filter((x) => x.d >= a && x.d <= b); return xs.length ? xs.reduce((s, x) => s + f(x), 0) / xs.length : 0; }
function report(T, W, M, R) {
  const out = [], warn = [];
  out.push(`# Balance sim (${new Date().toISOString().slice(0, 10)})`, '');
  out.push(`Game: BOOST coins x${T.BOOST.coins}, Bond x${T.BOOST.bond}; ${T.WALK_FULL} full-pay walks a Japan day, then half; daily mission ${T.MS_PAY}; weekly board ${T.MSW_COINS}; Pip cap ${T.PIP_CAP}; town level cap ${T.LV_CAP} XP a day (level ${T.LV_MAX} at ${fmt(T.LV_AT[T.LV_MAX])} XP).`);
  out.push(`Walk pay: ${W.src}: ${W.path.toFixed(1)} path coins + ${W.junk.toFixed(1)} junk raw, treasure found on ${Math.round(W.found * 100)}% of walks${W.foundMeasured != null && W.foundMeasured > W.found ? ` (autoplayer ${Math.round(W.foundMeasured * 100)}%, capped by ASSUME.findCap)` : ''}${W.placed ? `, ${Math.round(100 * W.path / W.placed)}% of the coins placed collected` : ''}. One full walk pays about **${Math.round((W.path + W.junk) * T.BOOST.coins)}** coins (more once finds turn into pouches).`);
  out.push(`Shop (always on sale): ${M.shop.length} items, ${fmt(M.shop.reduce((s, x) => s + x.price, 0))} coins. Kind shop coin buys: ${M.kind.length} (${fmt(M.kind.reduce((s, x) => s + x.price, 0))}). Added: ${M.sinks.length} (${fmt(M.sinks.reduce((s, x) => s + x.price, 0))}).${opt.supporter ? ' Supporter Pack on.' : ''} Markets, festivals and Tokyo souvenirs are not in the list.`, '');
  out.push('| Player | Coins a day d1 / d7 / d30 / d90 | Net a day (days 1-30) | Walks share | Garden a day | Level 10 / 20 | Bond 10 | Shop owned | Everything owned | Longest wall |', '|---|---|---|---|---|---|---|---|---|---|');
  R.forEach((r) => {
    const at = (d) => (r.days[d - 1] ? fmt(r.days[d - 1].earned) : '-');
    const ws = avgOf(r, 1, 30, (x) => x.inc.walks + x.inc.supporter) / Math.max(1, avgOf(r, 1, 30, (x) => x.earned)), gd = avgOf(r, 1, 30, (x) => x.inc.garden);
    out.push(`| ${r.label} | ${[1, 7, 30, 90].map(at).join(' / ')} | ${fmt(avgOf(r, 1, 30, (x) => x.net))} | ${Math.round(ws * 100)}% | ${fmt(gd)} | ${dd(r.lvDay[10])} / ${dd(r.lvDay[20])} | ${dd(r.bondDay[10])} | ${dd(r.baseOwned)} | ${dd(r.everything)} | ${r.maxWall} days |`);
    const walksA = avgOf(r, 1, 30, (x) => x.inc.walks), gardenA = avgOf(r, 1, 30, (x) => x.inc.garden);
    if (gardenA > walksA) warn.push(`${r.key}: the garden (${fmt(gardenA)} a day) pays more than walks (${fmt(walksA)}). Rule: walks stay the main income.`);
  });
  const reg = R.find((r) => r.key === 'regular');
  const regNet = reg ? avgOf(reg, 1, 30, (x) => x.net) : null;
  out.push('', `Design target: walks about 100 a day nominal. Real walk income a day (days 1-30): ${R.map((r) => `${r.key} ${fmt(avgOf(r, 1, 30, (x) => x.inc.walks))}`).join(', ')}.`);
  const checks = R[0].checks;
  if (checks.length) {
    out.push('', '## New prices and kind shop coin prices', '', `"Days" = price / the regular player's net coins a day (days 1-30, ${fmt(regNet)}). "Saved by" = the first day the price is covered by everything earned since day 1, if it were the only goal. "Bought" = the day it is bought when the player buys everything cheapest first.`, '');
    out.push('| Item | Price | Level | Days (regular) | Saved by: light / regular / keen | Bought: light / regular / keen | Verdict |', '|---|---|---|---|---|---|---|');
    checks.forEach((c, i) => {
      const days = regNet ? c.price / regNet : null, by = (k) => { const r = R.find((x) => x.key === k); return r ? dd(r.checks[i].save) : '-'; }, bo = (k) => { const r = R.find((x) => x.key === k); return r ? dd(r.checks[i].bought) : '-'; };
      const v = days == null ? '' : days < 1 ? 'TOO CHEAP (< 1 day)' : days > 120 ? 'TOO DEAR (> 120 days)' : 'ok';
      if (/TOO/.test(v)) warn.push(`${c.n} (${fmt(c.price)}): ${v} for a regular player (${days.toFixed(1)} days).`);
      out.push(`| ${c.n} | ${fmt(c.price)} | ${c.lv} | ${days == null ? '-' : days.toFixed(1)} | ${['light', 'regular', 'keen'].map(by).join(' / ')} | ${['light', 'regular', 'keen'].map(bo).join(' / ')} | ${v} |`);
    });
  }
  out.push('', '## Big shop items (1,200 and up): the day each player buys them', '', '| Item | Price | Level | ' + R.map((r) => r.key).join(' | ') + ' |', '|---|---|---|' + R.map(() => '---|').join(''));
  R[0].big.forEach((b, i) => out.push(`| ${b.n} | ${fmt(b.price)} | ${b.lv} | ${R.map((r) => dd(r.big[i].bought)).join(' | ')} |`));
  out.push('', '## Income mix, days 1-30 (coins a day)', '', '| Source | ' + R.map((r) => r.key).join(' | ') + ' |', '|---|' + R.map(() => '---|').join(''));
  Object.keys(R[0].days[0].inc).forEach((k) => { const v = R.map((r) => avgOf(r, 1, 30, (x) => x.inc[k])); if (v.some((x) => x >= 0.5)) out.push(`| ${k} | ${v.map(fmt).join(' | ')} |`); });
  out.push(`| food (spent) | ${R.map((r) => fmt(avgOf(r, 1, 30, (x) => x.food))).join(' | ')} |`);
  out.push('', '## Warnings', '', warn.length ? warn.map((w) => '- ' + w).join('\n') : '- none');
  return out.join('\n');
}

(async () => {
  if (opt.measure) {
    const { measureWalks } = require('./balance_walk');
    const walks = await measureWalks({ routes: opt.measure.split(','), build: opt.build });
    fs.writeFileSync(WALK_FILE, JSON.stringify({ date: new Date().toISOString().slice(0, 10), note: 'raw runner results before BOOST and walk share (tools/balance_walk.js autoplayer, skill 0.9)', walks }, null, 1) + '\n');
    console.error('saved ' + WALK_FILE);
  }
  const T = await loadTables();
  if (opt.saveTables) fs.writeFileSync(opt.saveTables, JSON.stringify(T));
  const missing = L.ECON_NAMES.filter((n) => T[n] == null); if (missing.length) console.error('WARNING: not found in the game (renamed?): ' + missing.join(', '));
  const extra = opt.add.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
  const W = walkModel(T), M = build(T, extra);
  const keys = opt.profile === 'all' ? Object.keys(PROFILES) : opt.profile.split(',');
  const R = keys.map((k) => { if (!PROFILES[k]) throw new Error('no profile ' + k); return simulate(T, W, M, k); });
  console.log(report(T, W, M, R));
  if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ walk: W, results: R }, null, 1));
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
