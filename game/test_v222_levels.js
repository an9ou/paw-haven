// v2.22 "Town levels and dog habits" (V222.md), part A: the core in game/src/51_levels.js.
//   A0 a fresh save's S.lv, the off state (exactly today: no S.lv, every gate is topBond, no XP, no letter)
//   A1 old saves (Bond 1, 3, 5, 10 + 6, two dogs with no dd.pv) start as in 5.2, S.v 1, one habits letter, the titles
//   A2 the no-relock sweep: every place, route, Tokyo place, feature, Fun Fair game and shop row open with lvOn off is open with it on
//   A3 every LV_UNLOCK row is at most LV_FLOOR[bond] over the live tables, level 1 = every Bond 1 row
//   A4 each daily source and its sub-cap, the 150 cap, the 00:00 JST reset (Date.now stub), walks 6+ give 0
//   A5 milestones count once (first visit, Bond per dog, badge tiers but not the quiet backfill, a notebook page, the board)
//   A6 XP never drops, no coins from a level-up.  A7 JSON + migrate keeps S.lv.  A8 on, off (Bond grows), on: nothing locks
//   A9 the pace table 2.3 re-run on the built numbers is within one level.  S  the stars past level 20 count, never backfilled
// Part B: B1-B4 (the call sites).  Part C: C1 off = no star, C2 the aria-label, the Next line and the sheet, C3 the Bond card first, then the level card,
//   C4 a reload keeps an unshown card, C5 Gerald's line on a fresh save's first card only
// Part D: D1 40 breeds x 10 habit lines and table 4.3, the Profile card, the Bond card box, the diary; D2 a mix's secret is seeded and stable;
//   D3 off the weights are today's, on the trait weight x1.5 (and the other "does it more" numbers); D4 the bath zoomies once per bath, never with Motion off;
//   D5 one letter for a 3-dog save
// The switch: MS2_LIVE is off until the launch, so this suite turns it on with prefs.ms2Test and the harness pref prefs.lvTest.
// node game/run_tests.js v222_levels
const { run, URL } = require('./test_lib');
const SAVE = 'pawhaven_proto_v1';
const ON = { ms2Test: true, lvTest: true, tkTest: true, jpTest: true, ffTest: true };
const OFF = Object.assign({}, ON, { lvTest: false });
const PV = ['park', 'market', 'square', 'cafe', 'vet', 'dogpark', 'pool', 'training', 'salon', 'hilltop', 'river', 'woods', 'beach', 'pier', 'town', 'shibuya', 'yoyogi', 'asakusa', 'ueno', 'fujihill'];
// the contract's own numbers (V222.md 2.2, 3.1, 2.3)
const AT_C = [0, 0, 60, 140, 260, 420, 620, 860, 1140, 1460, 1820, 2270, 2770, 3320, 3920, 4570, 5270, 6020, 6820, 7670, 8570];
const FLOOR_C = [1, 1, 8, 8, 11, 13, 15, 17, 19, 20, 20];
const PACE = { // the day each level is reached
  light: { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 7, 8: 9, 9: 12, 10: 15, 12: 24, 14: 36, 16: 50, 18: 67, 20: 85 },
  regular: { 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6, 10: 8, 12: 13, 14: 19, 16: 28, 18: 37, 20: 48 },
  keen: { 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 4, 9: 5, 10: 7, 12: 12, 14: 19, 16: 27, 18: 36, 20: 46 }
};

run('v222_levels', async (t) => {
  const { ok, sec, ev } = t;
  const lvOfC = (x) => { let l = 1; while (l < 20 && x >= AT_C[l + 1]) l++; return l; };
  // load `save` in a fresh context with `prefs`, the way a player opens the game (the v215_migrate pattern)
  const load = async (save, prefs) => {
    const was = t.ctx;
    await t.mk({ storage: { [SAVE]: JSON.stringify(save) }, prefs }); if (was) await was.close();
    await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue');
    await t.until(() => ['yard', 'market'].includes(window.__paw.mode) && !!window.__paw.S && !!window.__paw.lv, null, 10000);
    await t.calm(); await t.lu();
  };
  const sweep = () => ev(() => {
    const L = window.__paw.lv, top = L.top(), rows = L.rows(), was = L.on();
    L.test(false);
    const offBad = rows.filter((r) => L.open(r.kind, r.id, r.bond) !== (top >= r.bond) || L.need(r.kind, r.id, r.bond) !== r.bond).map((r) => r.kind + ':' + r.id);
    const open = rows.filter((r) => top >= r.bond);
    L.test(true);
    const shut = open.filter((r) => !L.open(r.kind, r.id, r.bond)).map((r) => r.kind + ':' + r.id);
    L.test(was);
    const kinds = {}; rows.forEach((r) => { kinds[r.kind] = (kinds[r.kind] || 0) + 1; });
    return { n: rows.length, open: open.length, shut, offBad, kinds, top, tokyo: rows.some((r) => r.id === 'shibuya'), station: rows.some((r) => r.id === 'station') };
  });
  const lvNow = () => ev(() => { const S = window.__paw.S; return { lv: S.lv ? JSON.parse(JSON.stringify(S.lv)) : null, v: S.v, coins: S.coins, titles: Object.assign({}, S.titles || {}), title: S.title, mail: (S.mail || []).filter((m) => m.id === 'lv_habits').length }; });

  /* ---------------- A0. a fresh save, on ---------------- */
  sec('A0. a fresh save with the switch on');
  await t.newGame({ sex: 'girl', prefs: ON, map215: true }, { bond: { level: 1, pts: 0 }, coins: 1000 });
  await t.until(() => !!(window.__paw && window.__paw.lv && window.__paw.rh && window.__paw.fw), null, 8000);
  let r = await lvNow();
  const L0 = r.lv, id0 = await ev(() => window.__paw.S.dogs[0].id);
  ok(await ev(() => window.__paw.lv.on()), 'lvOn() with ms2Test and lvTest');
  ok(r.v === 1 && L0 && L0.from === 'fresh' && L0.xp === 0 && L0.lv === 1 && L0.shown === 1 && L0.floor === 0 && L0.mail === 1, 'fresh S.lv: xp 0, level 1, shown 1, floor 0, from fresh, S.v 1: ' + JSON.stringify(L0 && { xp: L0.xp, lv: L0.lv, floor: L0.floor, from: L0.from }));
  ok(L0 && L0.seen.yard === 1 && L0.seen.house === 1 && Object.keys(L0.seen).length === 2 && L0.bl[id0] === 1, 'seen = yard and house, bl = the starter at Bond 1');
  ok(L0 && L0.st && L0.st.n === 0 && L0.st.xp === 0 && L0.st.shown === 0 && r.mail === 0, 'the star counter starts at 0 and a fresh save gets no habits letter');
  const K = await ev(() => { const L = window.__paw.lv; return { AT: L.AT, CAP: L.CAP, WALK: L.WALK, FLOOR: L.FLOOR, UNLOCK: L.UNLOCK, STAR: L.STAR, SRC: L.SRC, TH: window.__paw.fw.BOND_TH }; });
  ok(JSON.stringify(K.AT) === JSON.stringify(AT_C) && K.CAP === 150, 'LV_AT and LV_CAP are the contract\'s (2.2, the hard 150 cap)');
  ok(JSON.stringify(K.FLOOR) === JSON.stringify(FLOOR_C), 'LV_FLOOR by Bond 1-10 = 1, 8, 8, 11, 13, 15, 17, 19, 20, 20');
  ok(K.WALK.park === 8 && K.WALK.town === 8 && K.WALK.sunflower === 10 && K.WALK.river === 10 && K.WALK.hilltop === 11 && K.WALK.bamboo === 11 && K.WALK.woods === 12 && K.WALK.pier === 12 && K.WALK.cliffs === 13 && K.WALK.beach === 14, 'LV_WALK per route');
  const base = await ev((k) => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem(k)); }, SAVE);
  delete base.lv; base.mail = (base.mail || []).filter((m) => m.id !== 'lv_habits');

  /* ---------------- A3. the floor proof over the live tables ---------------- */
  sec('A3. every LV_UNLOCK row is at most LV_FLOOR[bond], level 1 = every Bond 1 row');
  const a3 = await ev(() => {
    const L = window.__paw.lv, rows = L.rows(), U = L.UNLOCK, F = L.FLOOR, live = new Set(rows.map((r) => r.kind + ':' + r.id));
    const over = rows.filter((r) => U[r.kind + ':' + r.id] != null && U[r.kind + ':' + r.id] > F[r.own]).map((r) => `${r.kind}:${r.id} L${U[r.kind + ':' + r.id]} > floor ${F[r.own]} (Bond ${r.own})`);
    const late = rows.filter((r) => L.need(r.kind, r.id, r.own) > F[r.own]).map((r) => r.kind + ':' + r.id);
    const b1 = rows.filter((r) => r.own === 1 && L.need(r.kind, r.id, 1) !== 1).map((r) => r.kind + ':' + r.id);
    const missing = Object.keys(U).filter((k) => !live.has(k));
    const lvls = {}; Object.values(U).forEach((v) => { lvls[v] = 1; });
    return { n: rows.length, over, late, b1, missing, lvls: Object.keys(lvls).map(Number).sort((a, b) => a - b), gene: rows.some((r) => r.id === 'Gene Sniffer'), fest: rows.filter((r) => /Skeleton|Gingerbread|Witch-Hat|Plush Penguin/.test(r.id)).length };
  });
  ok(a3.n > 120 && !a3.over.length, `${a3.n} live rows, none above its Bond's floor` + (a3.over.length ? ': ' + a3.over.join(', ') : ''));
  ok(!a3.late.length && !a3.b1.length, 'wNeed never past the floor, and every Bond 1 row opens at level 1' + (a3.late.concat(a3.b1).length ? ': ' + a3.late.concat(a3.b1).join(', ') : ''));
  ok(!a3.missing.filter((k) => k !== 'place:fujihill').length, 'every row of the table exists in the live tables (map, Tokyo and Fun Fair on)' + (a3.missing.length ? ': missing ' + a3.missing.join(', ') : ''));
  ok(a3.lvls.join() === '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20', 'every level 2-20 opens something: ' + a3.lvls.join());
  ok(!a3.gene && !a3.fest, 'the Gene Sniffer and the festival rows are not level rows (they keep their own rules)');
  const sp = await ev(() => { const L = window.__paw.lv; return [L.need('item', 'Bone-shaped Biscuit', 1), L.need('feat', 'garden', 2), L.need('feat', 'kitchen', 3), L.need('feat', 'stall', 2), L.need('place', 'station', 3), L.need('route', 'sunflower', 2), L.need('route', 'river', 2), L.need('route', 'beach', 8), L.need('item', 'Royal Castle Kennel', 9), L.need('item', 'Sofa Ramp', 2), L.need('item', 'Cloud Bed', 6), L.need('place', 'nowhere', 4)]; });
  ok(sp.join() === '2,2,4,3,6,7,8,18,20,2,14,11', 'spot rows: Biscuit 2, garden 2, kitchen 4, stall 3, Station 6, Sunflower 7, Riverside 8, Beach 18, Castle 20, Sofa Ramp 2, Cloud Bed 14, a row the table misses = its floor: ' + sp.join());
  const lu = await ev(() => { const L = window.__paw.lv; return { 7: L.unlocks(7).map((x) => x.kind + ':' + x.id).sort(), 1: L.unlocks(1).length }; });
  ok(lu[7].join() === 'item:Bumblebee Suit,item:Frog Raincoat,place:sunflower,route:sunflower' && lu[1] === 0, 'unlocks(7) is the live rows of level 7: ' + lu[7].join());

  /* ---------------- A4. the daily sources, sub-caps, the cap, the JST day ---------------- */
  sec('A4. daily sources, sub-caps, the 150 cap, the 00:00 JST reset, walks 6+');
  const a4 = await ev(() => {
    const P = window.__paw, L = P.lv, S = P.S, out = {}, R = Date.now, t0 = R.call(Date);
    const mid = Math.ceil((t0 + 9 * 3600e3) / 864e5) * 864e5 - 9 * 3600e3; // the next 00:00 JST
    const g = (k, d) => { const b = S.lv.xp; L.act(k, d || {}); return S.lv.xp - b; }, G = (src, n, o) => L.gain(src, n, o);
    try {
      Date.now = () => mid - 120000; // 23:58 JST
      S.lv.day = ''; L.day(); out.day1 = S.lv.day;
      ['park', 'town', 'river', 'square'].forEach((k) => { S.lv.seen[k] = 1; });
      const care = ['feed', 'pet', 'fetch', 'toy', 'bath', 'nap', 'trick', 'scoop', 'photo']; out.care = []; for (let i = 0; i < 16; i++) out.care.push(g(care[i % 9], i === 1 ? { dogs: 3, ids: ['a', 'b', 'c'] } : {}));
      out.walk = []; ['river', 'park', 'town', 'park', 'park', 'park', 'park'].forEach((a) => { P.rh.walkCount(); out.walk.push(g('walk', { area: a, pack: 1 })); });
      out.walkNoCount = g('walk', { area: 'park', pack: 1 });
      out.not = ['buy', 'wear', 'decorate', 'mail', 'collect', 'house'].map((k) => g(k, { name: 'Bow Tie', place: 'x' }));
      out.ms = [G('ms', 20), G('ms', 20)]; out.help = [G('help', 10), G('help', 10), G('help', 10)];
      out.wish = [g('wish', { k: 'walk' }), g('wish', { k: 'walk' }), g('wish', { k: 'walk' })];
      out.before = S.lv.today;
      out.ff = [1, 2, 3, 4, 5].map(() => g('funfair', { game: 'catch', score: 3 }));
      out.today1 = S.lv.today; out.home1 = g('garden', { what: 'harvest', crop: 'carrot' });
      out.visitAtCap = g('travel', { place: 'cafe' }); out.todayAfterVisit = S.lv.today;
      Date.now = () => mid + 120000; // 00:02 JST, the next Japan day
      out.pet2 = g('pet'); out.day2 = S.lv.day; out.today2 = S.lv.today;
      out.home = [g('garden', { what: 'harvest', crop: 'peas' }), g('cook', { dish: 'x', stars: 1 }), g('garden', { what: 'plant', crop: 'peas' }), g('cook', { dish: 'y' }), g('garden', { what: 'harvest' }), g('cook', {}), g('cook', {})];
      out.frvisit = g('frvisit', { fid: 'x' }); out.fr = [G('fr', 5), G('fr', 5), G('fr', 5)];
      out.ff2 = [1, 2, 3, 4, 5].map(() => g('funfair', { game: 'stall', score: 1 }));
      out.walk2 = []; S.daily.walks = 0; ['park', 'park'].forEach((a) => { P.rh.walkCount(); out.walk2.push(g('walk', { area: a })); });
    } finally { Date.now = R; }
    return out;
  });
  ok(a4.care.slice(0, 15).every((x) => x === 2) && a4.care[15] === 0, 'care and play: 2 XP an act (a pack act once), 15 acts a Japan day: ' + a4.care.join(' '));
  ok(a4.walk.join() === '10,8,8,8,8,0,0' && a4.walkNoCount === 0, 'walks: route XP for the first 5 full-pay walks, walks 6+ give 0, an act without walkCount gives 0: ' + a4.walk.join(' '));
  ok(a4.not.every((x) => x === 0), 'buy, wear, decorate, mail, collect and house give no XP');
  ok(a4.ms.join() === '20,0' && a4.help.join() === '10,10,0' && a4.wish.join() === '10,10,0', 'the mission 20 (1 a day), little helps 10 (2), wishes 10 (2)');
  ok(a4.before === 132 && a4.ff.join() === '5,5,5,3,0' && a4.today1 === 150 && a4.home1 === 0, 'the hard cap: 150 a Japan day (the 4th Fun Fair round gets only what is left): ' + a4.ff.join(' ') + ', today ' + a4.today1);
  ok(a4.visitAtCap === 15 && a4.todayAfterVisit === 150, 'a milestone (first visit) still counts at the cap, outside it');
  ok(a4.day2 !== a4.day1 && a4.pet2 === 2 && a4.today2 === 2, `00:00 JST: a new day (${a4.day1} -> ${a4.day2}), today back to 0`);
  ok(a4.home.join() === '3,3,0,3,3,3,0', 'harvest and cook 3 XP (5 a day), planting gives 0: ' + a4.home.join(' '));
  ok(a4.frvisit === 0 && a4.fr.join() === '5,5,0', 'a friend visit gives 0 while Friends are off, a gift 5 (2 a day)');
  ok(a4.ff2.join() === '5,5,5,5,0' && a4.walk2.join() === '8,8', 'Fun Fair 5 (4 a day), and the walks count again on the new day');

  /* ---------------- A5. milestones count once ---------------- */
  sec('A5. milestones: first visits, Bond per dog, badges (not the quiet backfill), notebook, board');
  const a5 = await ev(() => {
    const P = window.__paw, L = P.lv, S = P.S, out = {}, g = (k, d) => { const b = S.lv.xp; L.act(k, d || {}); return S.lv.xp - b; };
    const dx = (f) => { const b = S.lv.xp; f(); return S.lv.xp - b; };
    out.v = [g('travel', { place: 'vet' }), g('travel', { place: 'vet' }), g('travel', { place: 'notaplace' })];
    S.daily.walks = 0; out.pierPlace = g('travel', { place: 'pier' }); P.rh.walkCount(); out.pierWalk = g('walk', { area: 'pier' }); // the same id: the walk gives only its walk XP
    P.rh.walkCount(); out.hillWalk = g('walk', { area: 'hilltop' }); out.hillPlace = g('travel', { place: 'hilltop' });
    out.bondDirect = [L.bond('d_other', 3), L.bond('d_other', 3), L.bond('d_other', 5), L.bond('d_other', 4)];
    return out;
  });
  ok(a5.v.join() === '15,0,0', 'a first visit gives 15 once, an unknown place nothing');
  ok(a5.pierPlace === 15 && a5.pierWalk === 12 && a5.hillWalk === 15 + 11 && a5.hillPlace === 0, 'a place and the route with the same id count once (walk XP still comes): ' + [a5.pierPlace, a5.pierWalk, a5.hillWalk, a5.hillPlace].join(' '));
  ok(a5.bondDirect.join() === '40,0,40,0', 'Bond levels: 20 each, once per dog and level: ' + a5.bondDirect.join(' '));
  const realBond = await ev((TH) => { const P = window.__paw, S = P.S, b = S.lv.xp, c = S.coins; P.lv.bondUp(TH[2] - S.bond.pts); return { d: S.lv.xp - b, lvl: S.bond.level, bl: S.lv.bl[S.dog.id], c: S.coins - c }; }, K.TH);
  await t.luWait(2500);
  ok(realBond.lvl === 3 && realBond.d === 40 && realBond.bl === 3 && realBond.c === 0, 'addBond\'s level loop: Bond 1 -> 3 gives 40, bl follows, no coins: ' + JSON.stringify(realBond));
  const a5b = await ev(() => {
    const P = window.__paw, L = P.lv, S = P.S, out = {}, dx = (f) => { const b = S.lv.xp; let r; try { r = f(); } catch (e) { out.err = String(e); } return S.lv.xp - b; };
    L.pref('msTest', true);
    const m = S.missions; m.trbf = 1; m.tr = {}; m.life.fetch = 100000;
    let got = []; out.quiet = dx(() => { got = P.msb.check(true); }); out.quietN = got.length;
    m.tr = {}; out.loud = dx(() => { got = P.msb.check(false); }); out.loudN = got.length;
    out.again = dx(() => P.msb.check(false));
    out.nb = [dx(() => P.msn.finish(1)), dx(() => P.msn.finish(1))]; out.hasNb = !!m.nb;
    P.msw.roll(); out.board = [dx(() => P.msw.fill()), dx(() => P.msw.fill())];
    m.wk.got = ''; out.boardOnce = dx(() => P.msw.fill());
    L.pref('msTest', false);
    return out;
  });
  ok(a5b.quietN > 0 && a5b.quiet === 0, `the quiet badge backfill gives no XP (${a5b.quietN} tiers given quietly)`);
  ok(a5b.loudN > 0 && a5b.loud === 15 * a5b.loudN && a5b.again === 0, `badge tiers: 15 each (${a5b.loudN} tiers = ${a5b.loud})` + (a5b.err ? ' ' + a5b.err : ''));
  ok(a5b.hasNb && a5b.nb.join() === '10,0', 'a finished notebook page: 10, once: ' + a5b.nb.join(' '));
  ok(a5b.board.join() === '40,0' && a5b.boardOnce === 0, 'the help-wanted board: 40, once a week: ' + a5b.board.join(' ') + ' ' + a5b.boardOnce);
  await t.closeX(); await t.lu();

  /* ---------------- A6 + S. XP never drops, no coins, the stars past 20 ---------------- */
  sec('A6. XP never drops, no coins from levels; S. the stars past level 20');
  const a6 = await ev(() => {
    const P = window.__paw, L = P.lv, S = P.S, out = {}, x0 = S.lv.xp, c0 = S.coins;
    out.bad = [L.gain('ms', -5), L.gain('visit', 0), L.gain('care', NaN), L.gain('bogus', 50), L.gain('visit', 'x')];
    out.same = S.lv.xp === x0;
    const before = S.lv.xp; out.big = L.gain('board', 20000); out.lv = S.lv.lv; out.coins = S.coins - c0; out.q = L.queue();
    out.over = before + 20000 - L.AT[20]; out.st = Object.assign({}, S.lv.st);
    out.titles = [!!(S.titles || {})['Friendly Neighbour'], !!(S.titles || {})['Town Favourite'], S.lv.got[10], S.lv.got[20]];
    const xs = S.lv.xp; L.sync(); out.syncKeeps = S.lv.xp === xs && S.lv.lv === 20;
    const s1 = Object.assign({}, S.lv.st); out.visit = L.gain('visit', 15); out.st2 = Object.assign({}, S.lv.st); out.s1 = s1;
    out.pastToday = S.lv.today; out.care = L.gain('care', 2); out.st3 = Object.assign({}, S.lv.st);
    return out;
  });
  ok(a6.bad.every((x) => x === 0) && a6.same, 'negative, zero, NaN and unknown gains give 0 and change nothing');
  ok(a6.big === 20000 && a6.lv === 20 && a6.coins === 0, 'a gain across many levels reaches 20 and pays no coins: coins ' + a6.coins);
  ok(a6.q.length >= 2 && a6.q[a6.q.length - 1] === 20, 'the new levels wait in lvQueue for the card: ' + a6.q.join(','));
  ok(a6.titles.every(Boolean), 'level 10 and 20 give their titles once (Friendly Neighbour, Town Favourite), kept in S.lv.got');
  ok(a6.syncKeeps, 'lvSync never lowers XP or the level');
  ok(a6.st.n === Math.floor(a6.over / K.STAR) && a6.st.xp === a6.over % K.STAR, `past 20 the XP fills stars of ${K.STAR}: ${a6.over} over = ${a6.st.n} stars + ${a6.st.xp}`);
  const sAdd = (s, n) => { const x = s.xp + n; return { n: s.n + Math.floor(x / K.STAR), xp: x % K.STAR }; };
  ok(JSON.stringify({ n: a6.st2.n, xp: a6.st2.xp }) === JSON.stringify(sAdd(a6.s1, 15)) && (a6.care === 0 || JSON.stringify({ n: a6.st3.n, xp: a6.st3.xp }) === JSON.stringify(sAdd(a6.st2, a6.care))), 'milestones and daily XP past 20 both fill the star');

  /* ---------------- A7. JSON + migrate keeps S.lv ---------------- */
  sec('A7. JSON round trip and migrate keep S.lv, a reload too');
  const a7 = await ev(() => { const P = window.__paw, c = JSON.parse(JSON.stringify(P.S)), m = P.fw.migrate(c); return { eq: JSON.stringify(m.lv) === JSON.stringify(P.S.lv), v: m.v }; });
  ok(a7.eq && a7.v === 1, 'JSON.parse(JSON.stringify(S)) + migrate: S.lv unchanged, S.v 1');
  const lvA = JSON.stringify((await lvNow()).lv), saved = await ev((k) => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem(k)); }, SAVE);
  await load(saved, ON);
  ok(JSON.stringify((await lvNow()).lv) === lvA, 'a reload keeps S.lv exactly');

  /* ---------------- A1 + A2. old saves ---------------- */
  sec('A1 + A2. old saves start as in 5.2, and nothing open today closes');
  const fix = (o) => {
    const s = JSON.parse(JSON.stringify(base)); delete s.lv;
    s.careDays = o.cd; s.dd = s.dd || {}; if (o.pv == null) delete s.dd.pv; else s.dd.pv = Object.fromEntries(PV.slice(0, o.pv).map((k) => [k, 1]));
    s.missions.stamps = o.st || 0; s.missions.cards = o.ca || 0;
    s.dogs = o.bonds.map((b, i) => { const d = JSON.parse(JSON.stringify(base.dogs[0])); if (i) { d.id = 'd_fix' + i; d.name = 'Bean' + i; } d.bond = { level: b, pts: K.TH[b - 1] }; return d; });
    s.activeId = s.dogs[0].id; s.title = ''; s.titles = {};
    return s;
  };
  const est = (o) => 90 * Math.min(o.cd, 90) + 15 * (o.pv || 0) + 20 * o.bonds.reduce((a, b) => a + b - 1, 0) + 10 * ((o.st || 0) + 7 * (o.ca || 0));
  const FIX = [
    { name: 'Bond 1, 1 care day, 2 places', bonds: [1], cd: 1, pv: 2, want: { est: 120, lv: 2, xp: 120, floor: 1 } },
    { name: 'Bond 3, 3 care days, 6 places, 2 stamps', bonds: [3], cd: 3, pv: 6, st: 2, want: { est: 420, lv: 8, xp: 1140, floor: 3 } },
    { name: 'Bond 5, 40 care days, 15 places, 30 stamps + 3 cards', bonds: [5], cd: 40, pv: 15, st: 30, ca: 3, want: { est: 4415, lv: 14, xp: 4415, floor: 5 } },
    { name: 'Bond 10 + Bond 6, 30 care days, 20 places, 30 stamps + 3 cards', bonds: [10, 6], cd: 30, pv: 20, st: 30, ca: 3, want: { est: 3790, lv: 20, xp: 8570, floor: 10 } },
    { name: 'two dogs (Bond 3 + 1), no dd.pv, no care days', bonds: [3, 1], cd: 0, pv: null, want: { est: 40, lv: 8, xp: 1140, floor: 3 } },
    { name: 'Bond 10, a long history (est past level 20)', bonds: [10], cd: 120, pv: 20, st: 3, ca: 10, want: { est: 8100 + 300 + 180 + 730, lv: 20, xp: 8570, floor: 10 } }
  ];
  let f20 = false;
  for (const f of FIX) {
    ok(est(f) === f.want.est, `${f.name}: est ${est(f)} (contract ${f.want.est})`);
    await load(fix(f), ON);
    await t.until(() => { const S = window.__paw.S; return !!(S.lv && S.lv.mail === 1); }, null, 5000);
    const g = await lvNow(), L = g.lv;
    const exp = Math.max(lvOfC(f.want.est), FLOOR_C[Math.max(...f.bonds)]);
    ok(g.v === 1 && L && L.from === 'old' && L.lv === f.want.lv && L.lv === exp && L.xp === f.want.xp && L.floor === f.want.floor && L.shown === L.lv, `  starts at level ${L && L.lv}, ${L && L.xp} XP, floor ${L && L.floor}, shown ${L && L.shown}, from ${L && L.from}`);
    ok(L && L.seen.yard && L.seen.house && Object.keys(L.seen).length === 2 + (f.pv || 0), '  seen = the dd.pv places + yard and house');
    ok(L && f.bonds.every((b, i) => L.bl[i ? 'd_fix' + i : base.dogs[0].id] === b), '  bl = each dog\'s Bond (no XP for Bond already reached)');
    ok(g.mail === 1 && L.mail === 1, '  one habits letter from Gerald, whatever the number of dogs');
    ok(L && L.st.n === 0 && L.st.xp === 0, '  the star counter starts at 0 (never backfilled)');
    ok(L.lv >= 10 ? !!g.titles['Friendly Neighbour'] && L.got[10] === 1 : !g.titles['Friendly Neighbour'], '  the level 10 title only at 10+');
    const sw = await sweep();
    ok(!sw.shut.length && sw.tokyo && sw.station && sw.kinds.place && sw.kinds.route && sw.kinds.ff && sw.kinds.feat && sw.kinds.item, `  A2: all ${sw.open} of ${sw.n} rows open at Bond ${sw.top} today stay open with levels` + (sw.shut.length ? ': CLOSED ' + sw.shut.join(', ') : ''));
    ok(!sw.offBad.length, '  with the switch off every gate is exactly today\'s topBond test' + (sw.offBad.length ? ': ' + sw.offBad.slice(0, 6).join(', ') : ''));
    if (f.want.est > 8570) f20 = true;
  }
  sec('S. an old player at level 20 starts at star 0 and then counts');
  const s20 = await ev(() => { const L = window.__paw.lv, S = window.__paw.S, a = Object.assign({}, S.lv.st); L.gain('board', 1500); return { a, b: Object.assign({}, S.lv.st), lv: S.lv.lv }; });
  ok(s20.a.n === 0 && s20.a.xp === 0 && s20.b.n === 1 && s20.b.xp === 500 && s20.lv === 20, 'no backfilled stickers at the start, then 1,500 XP = 1 star + 500: ' + JSON.stringify(s20));
  const mailOnce = await ev(() => { window.__paw.lv.mail(); return (window.__paw.S.mail || []).filter((m) => m.id === 'lv_habits').length; });
  ok(mailOnce === 1, 'the habits letter is sent once');
  ok(!!f20, 'the long-history fixture ran');

  /* ---------------- A8. on, off (Bond grows), on ---------------- */
  sec('A8. on, off (Bond grows), on: nothing locks');
  await load(fix(FIX[0]), ON);
  let L8 = (await lvNow()).lv; const lvOn1 = L8.lv;
  let s8 = await ev((k) => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem(k)); }, SAVE);
  await load(s8, OFF);
  const off1 = await ev((TH) => { const P = window.__paw, S = P.S, a = JSON.parse(JSON.stringify(S.lv)); const g = P.lv.gain('board', 500); P.lv.act('pet'); P.lv.act('travel', { place: 'dogpark' }); P.lv.bondUp(TH[4] - S.bond.pts); return { on: P.lv.on(), a, b: JSON.parse(JSON.stringify(S.lv)), g, bond: S.bond.level }; }, K.TH);
  await t.luWait(2500);
  const strip = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.floor; return JSON.stringify(c); };
  ok(!off1.on && off1.g === 0 && off1.bond === 5 && off1.b.floor === 5 && strip(off1.a) === strip(off1.b), `off: no XP, nothing written but the floor (Bond 1 -> 5 makes floor ${off1.b.floor})`);
  const sw8 = await sweep();
  ok(!sw8.offBad.length, 'off: every gate is today\'s Bond 5 test');
  s8 = await ev((k) => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem(k)); }, SAVE);
  s8.dogs[0].bond = { level: 7, pts: K.TH[6] }; // Bond grows further while the game is closed
  await load(s8, OFF);
  ok((await lvNow()).lv.floor === 7, 'off, on load: lvSync raises the floor to the top Bond (7)');
  s8 = await ev((k) => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem(k)); }, SAVE);
  await load(s8, ON);
  L8 = (await lvNow()).lv; const sw8b = await sweep();
  ok(L8.lv === Math.max(lvOn1, FLOOR_C[7]) && L8.xp >= K.AT[L8.lv] && L8.shown === L8.lv, `on again: level ${lvOn1} -> ${L8.lv} (the floor's level, quietly)`);
  ok(!sw8b.shut.length && sw8b.top === 7, `on again: all ${sw8b.open} rows open at Bond 7 stay open` + (sw8b.shut.length ? ': CLOSED ' + sw8b.shut.join(', ') : ''));
  const mid8 = await ev((TH) => { const P = window.__paw, S = P.S; P.lv.test(false); P.lv.bondUp(TH[8] - S.bond.pts); const f = S.lv.floor; P.lv.test(true); return { f, open: P.lv.open('item', 'Royal Castle Kennel', 9), bond: S.bond.level }; }, K.TH);
  await t.luWait(2500);
  ok(mid8.bond === 9 && mid8.f === 9 && mid8.open, 'the switch off during a session: Bond 9 earned then keeps the Bond 9 rows open when it comes back on');

  /* ---------------- off means off ---------------- */
  sec('O. off means off: a fresh save and an old save with lvTest unset');
  const wasO = t.ctx; await t.boot({ prefs: OFF, map215: true }); await wasO.close(); await t.adopt({ sex: 'boy' });
  const o1 = await ev(() => { const P = window.__paw, S = P.S; const a = 'lv' in S; P.lv.act('pet'); P.lv.act('walk', { area: 'park' }); const g = P.lv.gain('board', 100); return { a, b: 'lv' in S, g, on: P.lv.on(), lvl: P.lv.level(), need: P.lv.need('route', 'beach', 8) }; });
  ok(!o1.on && !o1.a && !o1.b && o1.g === 0 && o1.lvl === 1 && o1.need === 8, 'a fresh save while off: no S.lv, no XP, level 1, wNeed = the Bond');
  ok(!(await sweep()).offBad.length, 'every gate is topBond');
  await load(fix(FIX[1]), OFF);
  const o2 = await lvNow();
  ok(!o2.lv && o2.mail === 0, 'an old save loaded while off gets no S.lv and no letter');
  const prefOff = await ev(() => { const P = window.__paw; P.lv.pref('lvTest', true); const on = P.lv.on(); P.lv.pref('ms2Test', false); const on2 = P.lv.on(); P.lv.pref('ms2Test', true); P.lv.pref('lvTest', false); return [on, on2]; });
  ok(prefOff[0] === true && prefOff[1] === false, 'lvOn needs both the v2.20 switch and lvAllowed');

  /* ---------------- A9. the pace table on the built numbers ---------------- */
  sec('A9. the pace table 2.3 on the built numbers (within one level)');
  const U = K.UNLOCK, VIS = {}; for (let l = 1; l <= 20; l++) VIS[l] = 0;
  VIS[1] = 8; // level 1: the Bond 1 places a new player can visit (Sunny Park, Town Loop, Market, Square, Café, Vet, the shop fronts), as the spec
  const ids = {}; Object.keys(U).forEach((k) => { const [kind, id] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)]; if (kind !== 'place' && kind !== 'route') return; if (ids[id] == null || U[k] < ids[id]) ids[id] = U[k]; });
  Object.values(ids).forEach((l) => { VIS[l]++; });
  const walkXP = (lv) => Math.max(...Object.keys(K.WALK).filter((k) => (U['route:' + k] || 1) <= lv).map((k) => K.WALK[k]));
  const P = {
    light: { care: 6, walks: 3, ms: 0.7, helps: 1, wish: 1, ff: 0, home: 1, fr: 0, lag: 3, bond: [1, 1, 2, 3, 5, 7, 9, 12, 15], dog2: 9, badge: 0.25, board: 0.5, nb: 0.7 },
    regular: { care: 15, walks: 5, ms: 1, helps: 2, wish: 1.5, ff: 2, home: 3, fr: 1, lag: 1, bond: [1, 1, 1, 2, 3, 4, 5, 6, 7], dog2: 4, badge: 0.5, board: 1, nb: 1 },
    keen: { care: 15, walks: 5, ms: 1, helps: 2, wish: 2, ff: 4, home: 5, fr: 2, lag: 0, bond: [1, 1, 1, 1, 1, 1, 2, 2, 3], dog2: 2, badge: 0.8, board: 1, nb: 1 }
  };
  const S_ = K.SRC, lvOfK = (x) => { let l = 1; while (l < 20 && x >= K.AT[l + 1]) l++; return l; };
  for (const [name, p] of Object.entries(P)) {
    let xp = 0; const opened = {}, first = {}, past = [];
    for (let day = 1; day <= 140; day++) {
      const lv = lvOfK(xp);
      const d = Math.min(K.CAP, S_.care[0] * Math.min(S_.care[1], p.care) + p.walks * walkXP(lv) + S_.ms[0] * p.ms + S_.help[0] * Math.min(S_.help[1], p.helps) + S_.wish[0] * Math.min(S_.wish[1], p.wish) + S_.ff[0] * Math.min(S_.ff[1], p.ff) + S_.home[0] * Math.min(S_.home[1], p.home) + S_.fr[0] * Math.min(S_.fr[1], p.fr));
      let m = 0; for (let l = 1; l <= lv; l++) { if (opened[l] == null) opened[l] = day; if (opened[l] + p.lag === day) m += 15 * VIS[l]; }
      p.bond.forEach((bd) => { if (bd === day) m += 20; if (bd + p.dog2 - 1 === day) m += 20; });
      if (day <= 14) m += 10 * p.nb; m += 15 * p.badge; if (day % 7 === 0) m += 40 * p.board;
      const was = xp; xp += d + m; const L = lvOfK(xp); for (let l = 2; l <= L; l++) if (!first[l]) first[l] = day;
      if (lvOfK(was) >= 20) past.push(d + m);
    }
    const T = PACE[name], E = (day) => Math.max(1, ...Object.keys(T).filter((l) => T[l] <= day).map(Number)), R = (day) => Math.max(1, ...Object.keys(first).filter((l) => first[l] <= day).map(Number));
    const bad = [...new Set(Object.values(T))].filter((day) => Math.abs(R(day) - E(day)) > 1).map((day) => [E(day), day, R(day)]); // on each day of the table: the level the table has by then vs the built numbers
    ok(!bad.length, `${name}: the level on each table day is within one of the contract (L20 on day ${first[20]})` + (bad.length ? ': off at ' + bad.map(([l, d, x]) => `day ${d}: L${x} for L${l}`).join(' ') : ''));
    if (name === 'regular') { const wk = past.slice(0, 7).reduce((a, b) => a + b, 0); ok(wk >= K.STAR * 0.8 && wk <= K.STAR * 1.6, `regular past level 20: ${Math.round(wk)} XP a week = about one star a week (${K.STAR} a star)`); }
  }

  /* ================= part B: the call sites (V222.md 3.3, 7.1 B) ================= */
  const BON = Object.assign({}, ON, { msTest: true }), BOFF = Object.assign({}, BON, { lvTest: false });
  const fresh = async (prefs, patch) => { const was = t.ctx; await t.newGame({ sex: 'girl', prefs, map215: true }, Object.assign({ bond: { level: 1, pts: 0 }, coins: 1000 }, patch || {})); if (was) await was.close(); await t.until(() => !!(window.__paw && window.__paw.lv && window.__paw.mp && window.__paw.tr), null, 8000); };
  const TODAY = require('./test_v222_b1_today.json'), { lockTexts } = require('./test_v222_probe');
  const isTrick = (k) => /^(fw\.next|dd\.rows|route\.order)/.test(k);
  const isTool = (k) => /^shop\.kibble\.tools\./.test(k) || /party gift/.test(TODAY[k] || ''); // the Gene Sniffer and the notebook's Bond 2 party gift step keep Bond

  sec('B1. every lock text: off = today (the dev build snapshot), on = the town level');
  await fresh(BOFF);
  const off = await lockTexts(t);
  const offDiff = Object.keys(TODAY).filter((k) => off[k] !== TODAY[k]).map((k) => `${k}: "${off[k]}" (today "${TODAY[k]}")`).concat(Object.keys(off).filter((k) => !(k in TODAY)).map((k) => k + ': new'));
  ok(Object.keys(TODAY).length > 150 && !offDiff.length, `off: all ${Object.keys(TODAY).length} lock texts equal today's` + (offDiff.length ? ': ' + offDiff.slice(0, 8).join(' | ') : ''));
  ok(TODAY.garden && TODAY.kitchen && Object.keys(TODAY).some((k) => /^nb\./.test(k)) && Object.keys(TODAY).some((k) => /^tk\./.test(k)) && Object.keys(TODAY).some((k) => /^ff\.nope\./.test(k)), 'the snapshot covers the garden, the kitchen, the notebook, Tokyo and the Fun Fair');
  await fresh(BON);
  ok(await ev(() => window.__paw.lv.on() && window.__paw.lv.level() === 1 && window.__paw.lv.top() === 1), 'on: a fresh save at Town level 1, Bond 1');
  const on = await lockTexts(t);
  const UL = K.UNLOCK, N = (kind, id) => UL[kind + ':' + id];
  const BISC = 'shop.kibble.food.Bone-shaped Biscuit'; // the one row a fresh save meets later than today: Kibble Corner sells it at Bond 1, the town at level 2 (V222.md 3.2, As built A)
  const keysOff = Object.keys(off).sort().join(), keysOn = Object.keys(on).filter((k) => k !== BISC).sort().join();
  ok(!(BISC in off) && on[BISC] === 'Level 2', 'on: the Bone-shaped Biscuit comes in at level 2 for a fresh save: ' + on[BISC]);
  ok(keysOn === keysOff, 'on: level 1 locks the same rows as Bond 1 (level 1 = every Bond 1 row)' + (keysOn === keysOff ? '' : ': ' + Object.keys(on).filter((k) => !(k in off)).concat(Object.keys(off).filter((k) => !(k in on)).map((k) => '-' + k)).slice(0, 8).join(', ')));
  const bondLeft = Object.keys(on).filter((k) => !isTrick(k) && !isTool(k) && /Bond/.test(off[k]) && (/\bBond\b/.test(on[k]) || !/\blevel\b/i.test(on[k]))).map((k) => `${k}: "${on[k]}"`);
  ok(!bondLeft.length, 'on: every lock text says the town level, none says Bond' + (bondLeft.length ? ': ' + bondLeft.slice(0, 8).join(' | ') : ''));
  const same = Object.keys(on).filter((k) => k in off && !isTrick(k) && !/Bond/.test(off[k]) && on[k] !== off[k]).map((k) => `${k}: "${on[k]}" vs "${off[k]}"`);
  ok(!same.length, 'on: the texts without a lock are unchanged (e.g. "Go to My Yard")' + (same.length ? ': ' + same.slice(0, 6).join(' | ') : ''));
  const numBad = [];
  Object.keys(on).forEach((k) => {
    const m = /^(mp\.lock|nope\.place|route\.stamp|route\.btn|nope\.route|tk|ff\.btn|ff\.nope)\.(.+)$/.exec(k); let want = null;
    if (m) { const id = m[2], pre = m[1]; want = pre === 'ff.btn' || pre === 'ff.nope' ? N('ff', id) : /route/.test(pre) ? N('route', id) : N('place', id); }
    const s = /^shop\.[a-z]+\.[a-z]+\.(.+)$/.exec(k); if (s && !isTool(k)) want = N('item', s[1]);
    if (k === 'garden') want = N('feat', 'garden'); if (k === 'kitchen') want = N('feat', 'kitchen');
    if (want != null && !new RegExp('\\b(level|Level) ' + want + '\\b').test(on[k])) numBad.push(`${k}: "${on[k]}" (level ${want})`);
  });
  ok(!numBad.length, 'on: each lock names its row\'s level from LV_UNLOCK (map chips, Nopes, the carousel, shops, Fun Fair, Tokyo, garden, kitchen)' + (numBad.length ? ': ' + numBad.slice(0, 6).join(' | ') : ''));
  ok(on['mp.lock.river'] === 'Level 8' && on['route.btn.sunflower'] === 'Locked (level 7)' && on['shop.boutique.all.Bow Tie'] === 'Level 2' && /town level 6/.test(on['tk.station']) && /town level 4/.test(on.kitchen) && on['mp.label.salon'] === 'Go to Grooming Salon (locked, level 5)', 'spot texts: Riverside chip "Level 8", Sunflower Lanes "Locked (level 7)", Bow Tie "Level 2", the Station level 6, the kitchen level 4, the Salon label');
  ok(on['shop.kibble.tools.Gene Sniffer'] === off['shop.kibble.tools.Gene Sniffer'] && /Bond 6/.test(on['shop.kibble.tools.Gene Sniffer']), 'the Gene Sniffer keeps its Bond 6 lock: ' + on['shop.kibble.tools.Gene Sniffer']);
  const nbOn = Object.keys(on).filter((k) => /^nb\./.test(k) && !isTool(k)).map((k) => on[k]);
  ok(nbOn.length && nbOn.every((x) => / \| Opens at level \d+$/.test(x)) && nbOn.some((x) => /Riverside.*level 8$/.test(x)), 'the notebook\'s lock tags say "Opens at level N": ' + nbOn.join(' · '));
  const fwOn = Object.keys(on).filter((k) => /^fw\.next\./.test(k)).map((k) => on[k]);
  ok(fwOn.length === 9 && fwOn.every((x) => /^Bond \d+: (learns [A-Za-z ]+|a signature trick)( \+ a new habit)?$/.test(x)) && on['fw.next.2'] === 'Bond 3: learns Lie Down + a new habit', 'the Bond Next line lists only tricks and habits (' + on['fw.next.2'] + '); the town level\'s Next line is part C\'s');
  const ddOn = Object.keys(on).filter((k) => /^dd\.rows\./.test(k)).map((k) => on[k]).join(' / ');
  ok(!/Walk route|Places:|Tokyo:|House:|For the home|veggie patch/.test(ddOn) && /Shop: Gene Sniffer/.test(ddOn) && /Trick: Paw/.test(ddOn) && /Room for dog number 3/.test(ddOn), 'the Bond track keeps the Bond list (tricks, dog spots, gifts, the Gene Sniffer), no places, walks, houses or shop rows');
  ok(TODAY['dd.rows.2'] === off['dd.rows.2'] && /Walk route/.test(off['dd.rows.2']), 'off: the Bond track is today\'s');

  sec('B3. the carousel order');
  const want3 = TODAY['route.order'].split(',').map((k, i) => [k, i]).sort((a, b) => (N('route', a[0]) || 1) - (N('route', b[0]) || 1) || a[1] - b[1]).map((x) => x[0]).join(',');
  ok(off['route.order'] === TODAY['route.order'], 'off: today\'s order ' + off['route.order']);
  ok(on['route.order'] === want3 && /sunflower,river/.test(on['route.order']) && TODAY['route.order'].replace('river,sunflower', 'sunflower,river') === on['route.order'], 'on: by the town level, stable; only Sunflower Lanes and Riverside swap: ' + on['route.order']);
  const ord = await ev(() => { const L = window.__paw.lv, a = window.__paw.tr.keys().join(); L.test(false); const b = window.__paw.tr.keys().join(); L.test(true); return [a, b, window.__paw.tr.keys().join()]; });
  ok(ord[1] === TODAY['route.order'] && ord[2] === ord[0], 'the order follows the switch at once (off, on again)');

  sec('B2. the missions, little helps, the board, the notebook and the wish never offer a locked place or route');
  const pick = () => ev(() => {
    const P = window.__paw, w = P.lv.wish() || [], wa = (k) => ((w.find((o) => o[0] === k) || [])[1] || []);
    return { ms: P.ms.eligible(), h: P.ms2.eligible(), wk: P.msw.pool.filter((id) => P.msw.gate(id)), kinds: w.map((o) => o[0]), walk: wa('walk'), place: wa('place'), nb: nbs(), lv: P.lv.level(), top: P.lv.top() };
    function nbs() { const o = {}; if (!P.msn.nb()) return null; for (let n = 1; n <= P.msn.pages().length; n++) for (let i = 0; i < 6; i++) { let x = 0; try { x = P.msn.lock(n, i); } catch (e) { x = 0; } if (x && !(n === 2 && i === 2)) o[n + '.' + i] = x; } return o; } // 2.2: the Bond 2 party gift step (it stays on Bond, B1)
  });
  await fresh(BON, { bond: { level: 10, pts: K.TH[9] } }); // Bond 10 through the save (a level-up loop would give Bond XP): the two ladders apart
  await ev(() => window.__paw.ff.setSat(true));
  const b2lo = await pick();
  const LOCKED_MS = ['walk_river', 'travel', 'tokyo_ride', 'tokyo_stamp', 'agility', 'agility_ros', 'travel_training', 'pool_paddle', 'pool_float', 'new_trail', 'ffstall', 'ffjob', 'gaze', 'travel_fuji', 'garden_plant', 'harvest', 'garden_water', 'cook', 'cook_new'];
  ok(b2lo.lv === 1 && b2lo.top === 10, `Town level 1 with a Bond 10 dog (the two ladders apart): level ${b2lo.lv}, Bond ${b2lo.top}`);
  ok(!b2lo.ms.filter((id) => LOCKED_MS.includes(id)).length && b2lo.ms.includes('trick'), 'MS_POOL: no locked place, route, Tokyo, garden, kitchen or Fun Fair job; tricks stay on Bond' + (b2lo.ms.filter((id) => LOCKED_MS.includes(id)).length ? ': ' + b2lo.ms.filter((id) => LOCKED_MS.includes(id)).join(', ') : ''));
  ok(!b2lo.h.includes('h_paw') && !b2lo.h.includes('h_gwater'), 'MS_HELPS: no Dog Card paw shake (the Station) and no garden watering: ' + b2lo.h.join(','));
  ok(!['w_harvest', 'w_water', 'w_cook', 'w_jobs', 'w_pool', 'w_routes'].some((id) => b2lo.wk.includes(id)), 'MS_BOARD: no garden, kitchen, town jobs, pool, or three routes with two open: ' + b2lo.wk.join(','));
  ok(b2lo.walk.length && b2lo.walk.every((k) => ['park', 'town'].includes(k)) && !b2lo.kinds.includes('paddle') && !b2lo.kinds.includes('garden') && !b2lo.place.some((k) => N('place', k) > 1), 'the wish: walks only on the level 1 routes, no pool or garden, only level 1 places: ' + b2lo.walk.join(',') + ' | ' + b2lo.place.join(','));
  const nbL = Object.values(b2lo.nb || {});
  ok(nbL.length && nbL.every((x) => x >= 2) && nbL.includes(8), 'the notebook\'s locked steps name their levels (Riverside 8): ' + [...new Set(nbL)].join(','));
  const b2off = await ev(() => { const P = window.__paw; P.lv.test(false); const r = { ms: P.ms.eligible(), h: P.ms2.eligible() }; P.lv.test(true); return r; });
  ok(['walk_river', 'travel', 'agility', 'pool_paddle', 'tokyo_ride'].every((id) => b2off.ms.includes(id)) && b2off.h.includes('h_paw'), 'off (the same save): Bond 10 opens them as today');
  await ev(() => window.__paw.lv.gain('board', 8570)); await t.lu();
  const b2hi = await pick();
  ok(b2hi.lv === 20 && ['walk_river', 'travel', 'agility', 'pool_paddle', 'tokyo_ride', 'new_trail', 'ffjob'].every((id) => b2hi.ms.includes(id)) && b2hi.h.includes('h_paw'), 'at Town level 20 they are offered again: ' + ['walk_river', 'travel', 'agility', 'pool_paddle', 'tokyo_ride', 'new_trail', 'ffjob'].filter((id) => !b2hi.ms.includes(id)).join(','));
  ok(b2hi.walk.includes('beach') && b2hi.kinds.includes('paddle') && b2hi.nb && !Object.keys(b2hi.nb).length, 'level 20: the wish walks Seashell Beach, the pool is open, no notebook step is locked: ' + JSON.stringify({ walk: b2hi.walk, kinds: b2hi.kinds, nb: b2hi.nb }));
  await ev(() => window.__paw.ff.setSat(null));

  sec('B4. an owned item that is level-locked shows Owned and stays usable');
  await fresh(BON, { bond: { level: 10, pts: 9000 } });
  await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Wizard Hat'); S.inv.houses.push('Snow Igloo'); S.inv.toys.push('Puzzle Feeder'); S.beds.push('Cloud Bed'); S.decor = S.decor || {}; S.decor['Sofa Ramp'] = { got: '2026-11-01', out: false }; });
  const b4 = await ev(() => {
    const P = window.__paw, B = {}, row = (n) => [...document.querySelectorAll('#modal .sitem')].find((r) => (r.querySelector('b') || {}).textContent === n);
    const read = (shop, attr, tab, names) => { P.shop.shop(shop); if (attr) document.querySelector(`#modal [${attr}="${tab}"]`).click(); names.forEach((n) => { const r = row(n); B[n] = r ? { lockd: r.classList.contains('lockd'), act: (r.querySelector('.chip, button.btn') || {}).textContent || '' } : null; }); document.querySelector('#modal .panel .x').click(); };
    read('boutique', null, null, ['Wizard Hat', 'Royal Castle Kennel', 'Bow Tie']); read('kibble', 'data-tab', 'toys', ['Puzzle Feeder', 'Agility Tunnel']); read('kibble', 'data-tab', 'tools', ['Gene Sniffer']);
    read('builder', 'data-btab', 'houses', ['Snow Igloo', 'Royal Castle Kennel']); read('builder', 'data-btab', 'beds', ['Cloud Bed', 'Royal Canopy Bed']); read('builder', 'data-btab', 'furniture', ['Sofa Ramp', 'Ball Pit']);
    P.shop.shop('boutique'); const t0 = document.getElementById('toasts'); t0.innerHTML = ''; const lr = row('Superhero Cape'); if (lr) lr.click(); B.tap = (t0.lastElementChild || {}).textContent || ''; document.querySelector('#modal .panel .x').click();
    P.shop.equip('Wizard Hat'); B.worn = Object.values(P.S.outfit || {}).includes('Wizard Hat');
    return B;
  });
  const own = ['Wizard Hat', 'Puzzle Feeder', 'Snow Igloo', 'Cloud Bed', 'Sofa Ramp'].filter((n) => !b4[n] || b4[n].lockd || !/Owned/.test(b4[n].act));
  ok(!own.length, 'owned and above the level: Wizard Hat, Puzzle Feeder, Snow Igloo, Cloud Bed, Sofa Ramp show Owned, no lock' + (own.length ? ': ' + own.map((n) => n + ' ' + JSON.stringify(b4[n])).join(' | ') : ''));
  ok(b4['Agility Tunnel'] && b4['Agility Tunnel'].lockd && b4['Agility Tunnel'].act === 'Level 13' && b4['Ball Pit'].act === 'Level 3' && b4['Royal Canopy Bed'].act === 'Level 19', 'not owned: the lock chip says the level (Agility Tunnel 13, Ball Pit 3, Royal Canopy Bed 19), even at Bond 10');
  ok(b4['Gene Sniffer'] && !b4['Gene Sniffer'].lockd, 'the Gene Sniffer opens on Bond 6 as today (a Bond 10 dog)');
  ok(/^Nope\. Superhero Cape comes in at town level 15\./.test(b4.tap), 'a tap on a level-locked row: ' + b4.tap);
  ok(b4.worn, 'the owned Wizard Hat can still be worn');
  const b4f = await ev(() => { const P = window.__paw, L = P.lv; L.test(false); const r = [L.lock('Agility Tunnel', 5, false), L.lock('Wizard Hat', 4, true)]; L.test(true); return r; });
  ok(b4f[0] === false && b4f[1] === false, 'off: the Bond 10 dog opens every row, as today');
  await t.closeX(); await t.lu();

  /* ================= part C: the HUD star, the Next line, the sheet, the level-up card, the lesson (V222.md 1.3-1.5, 7.1 C) ================= */
  const hudNow = () => ev(() => { const b = document.getElementById('lvBtn'), n = document.getElementById('lvNext'); return { btn: !!b, lvon: document.getElementById('hud').classList.contains('lvon'), aria: b && b.getAttribute('aria-label'), title: b && b.title, n: b && b.querySelector('.lv-n').textContent, next: n && !n.hidden ? n.textContent.replace(/\s+/g, ' ').trim() : '', lesson: /data-lesson="levels"/.test(window.__paw.ms2.howto()) }; });
  sec('C1. off: no #lvBtn, no sheet, no card, no lesson');
  await fresh(BOFF);
  let c1 = await hudNow();
  ok(!c1.btn && !c1.lvon && !c1.lesson, 'lvTest off: no #lvBtn, no lvon class, no How to play lesson ' + JSON.stringify(c1));
  ok(await ev(() => { const L = window.__paw.lv; return L.sheet() === null && L.card() === null && L.lesson() === null && !document.querySelector('.lv-pop, .lv-lu'); }), 'off: lvOpen and lvMaybeShow do nothing, lvLesson is null');
  await ev(() => window.__paw.lv.test(true)); await t.until(() => !!document.getElementById('lvBtn'), null, 3000);
  c1 = await hudNow();
  ok(c1.btn && c1.lvon && c1.lesson, 'switched on: the star and the lesson come');
  await ev(() => window.__paw.lv.test(false)); await t.until(() => !document.getElementById('lvBtn'), null, 3000);
  c1 = await hudNow(); ok(!c1.btn && !c1.lvon, 'switched off again: the star goes');

  sec('C2. the aria-label, the title and the Next line');
  await fresh(BON);
  let c2 = await hudNow();
  ok(c2.btn && c2.n === '1' && c2.aria === 'Town level 1. 60 to go for level 2. Opens your town level.', 'level 1: ' + c2.aria);
  ok(c2.next === 'Next Level 2: Dog Park + the veggie patch' && c2.title === 'Level 2: Dog Park + the veggie patch', 'the Next tag and the title: ' + JSON.stringify([c2.next, c2.title]));
  const c2n = await ev(() => { const L = window.__paw.lv; return [1, 5, 6, 9, 12, 16, 19, 20].map((n) => L.next(n)); });
  ok(c2n[1] === 'Level 6: Tokyo + a new outfit' && c2n[2] === 'Level 7: Sunflower Lanes + 2 new outfits' && c2n[7] === '', 'lvNextText: ' + JSON.stringify(c2n));
  ok(c2n.slice(0, 7).every((s) => /^Level \d+: \S/.test(s) && !/[{}]|undefined/.test(s)), 'every level 2-20 has a readable next line');
  const c2u = await ev(() => { const L = window.__paw.lv; return { u2: L.unlocksText(2), u10: L.unlocksText(10), u7: L.unlocksText(7), all: Array.from({ length: 19 }, (_, i) => L.unlocksText(i + 2)) }; });
  ok(c2u.u2.includes('Place: Dog Park') && c2u.u2.includes('The veggie patch') && c2u.u2.includes('Fun Fair: Sniff & Seek') && c2u.u2.includes('Shop: Bow Tie'), 'the level 2 card list: ' + c2u.u2.join(' | '));
  ok(c2u.u7.filter((s) => /Sunflower/.test(s)).length === 1 && c2u.u10.includes('Title: Friendly Neighbour'), 'a place and its walk are one line; level 10 lists the title: ' + c2u.u7.join(' | '));
  ok(c2u.all.every((a) => a.length && a.every((s) => !/[{}]|undefined/.test(s))), 'every level 2-20 lists something, no raw ICU');
  await ev(() => window.__paw.lv.gain('board', 620 - window.__paw.lv.xp() + 10)); // level 6 and 10 XP
  await t.until(() => !!document.getElementById('lvOk'), null, 4000); await ev(() => { const b = document.getElementById('lvOk'); if (b) b.click(); });
  c2 = await hudNow();
  ok(c2.n === '6' && c2.aria === 'Town level 6. 230 to go for level 7. Opens your town level.' && c2.next === 'Next Level 7: Sunflower Lanes + 2 new outfits', 'level 6: ' + JSON.stringify([c2.aria, c2.next]));
  const c2s = await ev(() => { window.__paw.lv.sheet(); const p = document.querySelector('#modal .panel.lv-pop'); const r = p ? { h2: p.querySelector('h2').textContent, togo: (p.querySelector('.lv-togo') || {}).textContent, today: (p.querySelector('.lv-today') || {}).textContent, next: [...p.querySelectorAll('.lv-nextl li')].map((l) => l.textContent), open: p.querySelectorAll('.lv-open li').length, how: !!p.querySelector('.lv-how') } : null; document.querySelector('#modal .panel .x').click(); return r; });
  ok(c2s && c2s.h2 === 'Town level 6' && c2s.togo === '230 to go for level 7' && c2s.today === 'Today: 0 of 150' && c2s.next.length === 3 && c2s.next[0] === 'Level 7: Sunflower Lanes + 2 new outfits' && c2s.open === 6 && c2s.how, 'the sheet: ' + JSON.stringify(c2s));
  await ev(() => { const L = window.__paw.lv; for (let i = 0; i < 20; i++) L.gain('care', 2); L.gain('walk', 99); L.gain('ms', 99); }); // 150 today
  const c2f = await ev(() => { window.__paw.lv.sheet(); const p = document.querySelector('#modal .panel.lv-pop'), r = (p.querySelector('.lv-today') || {}).textContent; document.querySelector('#modal .panel .x').click(); return [r, window.__paw.lv.today()]; });
  ok(c2f[0] === 'That is all the growing for today. More tomorrow.', 'at the cap the sheet says more tomorrow: ' + JSON.stringify(c2f));
  await ev(() => window.__paw.lv.gain('board', 8570 + 2400 - window.__paw.lv.xp())); // level 20 and 2 stars + 400
  await t.until(() => !!document.getElementById('lvOk'), null, 4000); await ev(() => { const b = document.getElementById('lvOk'); if (b) b.click(); });
  c2 = await hudNow();
  ok(c2.n === '20' && c2.aria === 'Town level 20, star 2. Opens your town level.' && c2.next === '' && c2.title === 'Level 20 · star 2', 'level 20 with 2 stars: ' + JSON.stringify([c2.aria, c2.title, c2.next]));
  const c2t = await ev(() => { window.__paw.lv.sheet(); const p = document.querySelector('#modal .panel.lv-pop'), r = { top: (p.querySelector('.lv-top') || {}).textContent, star: (p.querySelector('.lv-starline') || {}).textContent, togo: (p.querySelector('.lv-stars .lv-togo') || {}).textContent, n: (p.querySelector('.lv-stcount') || {}).textContent, next: p.querySelectorAll('.lv-nextl li').length, crown: !!p.querySelector('.lv-sic svg') }; document.querySelector('#modal .panel .x').click(); return r; });
  ok(c2t.top === 'Top of the town. Every place is open.' && c2t.star === 'Level 20 · star 2' && c2t.togo === '600 to go for the next star' && /^2 star stickers so far\./.test(c2t.n) && !c2t.next, 'the sheet past 20: ' + JSON.stringify(c2t));
  ok(await ev(() => window.__paw.S.titles['Friendly Neighbour'] && window.__paw.S.titles['Town Favourite']), 'the level 10 and 20 titles are kept');

  sec('C3 + C5. a Bond card first, then the town level card, with Gerald\'s line on a fresh save\'s first card');
  await fresh(BON);
  await ev(() => window.__paw.lv.gain('board', 50));
  ok(await ev(() => window.__paw.lv.level() === 1), '50 XP: still level 1');
  await ev(() => { const P = window.__paw; P.lv.bondUp(P.fw.BOND_TH[1] - P.S.bond.pts); }); // Bond 2: +20 XP, town level 2 in the same moment
  ok(await t.until(() => !!document.getElementById('luOk'), null, 4000), 'the Bond card shows');
  const c3a = await ev(() => ({ lv: window.__paw.lv.level(), shown: window.__paw.lv.shown(), card: !!document.getElementById('lvOk'), h2: document.querySelector('#modal h2').textContent }));
  ok(c3a.lv === 2 && c3a.shown === 1 && !c3a.card && /^Bond level 2/.test(c3a.h2), 'town level 2 is reached, its card waits under the Bond card: ' + JSON.stringify(c3a));
  await t.sleep(1500);
  ok(await ev(() => !document.getElementById('lvOk') && !!document.getElementById('luOk')), 'the level card never opens over the Bond card');
  const tOk = Date.now(); await t.p.click('#luOk');
  ok(await t.until(() => !!document.getElementById('lvOk'), null, 4000), 'the town level card follows the Bond card (' + (Date.now() - tOk) + ' ms)');
  const c3 = await ev(() => { const p = document.querySelector('#modal .panel.lv-lu'); return p ? { h2: p.querySelector('h2').textContent, gerald: (p.querySelector('.lv-gerald') || {}).textContent || '', list: [...p.querySelectorAll('.unlocks li')].map((l) => l.textContent), next: (p.querySelector('.lv-lunext') || {}).textContent, art: !!p.querySelector('.lv-cardart svg'), shown: window.__paw.lv.shown() } : null; });
  ok(c3 && c3.h2 === 'Town level 2!' && c3.art && c3.list.includes('Place: Dog Park') && /^Next: Level 3: Splash Pool \+ \S/.test(c3.next), 'the card: ' + JSON.stringify(c3));
  ok(c3 && c3.gerald === 'Gerald: That star is your town level. Each level opens a bit more of town.', 'C5: the first card of a fresh save has Gerald\'s line');
  ok(c3 && c3.shown === 2, 'S.lv.shown follows the card');
  await t.p.click('#lvOk'); await t.modalGone();

  sec('C4. a reload before the card keeps it; C5 no Gerald line on later cards');
  await ev(() => { window.__paw.lv.sheet(); window.__paw.lv.gain('board', 140 - window.__paw.lv.xp()); window.__paw.saveNow(); }); // level 3 while a sheet is open: no card yet
  const c4a = await ev(() => ({ lv: window.__paw.lv.level(), shown: window.__paw.lv.shown(), card: !!document.getElementById('lvOk') }));
  ok(c4a.lv === 3 && c4a.shown === 2 && !c4a.card, 'level 3 behind an open sheet: no card yet ' + JSON.stringify(c4a));
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue');
  await t.until(() => ['yard', 'market'].includes(window.__paw.mode) && !!window.__paw.lv, null, 10000);
  ok(await t.until(() => !!document.getElementById('lvOk'), null, 6000), 'after the reload the level 3 card shows on the calm yard');
  const c4 = await ev(() => { const p = document.querySelector('#modal .panel.lv-lu'); return p ? { h2: p.querySelector('h2').textContent, gerald: !!p.querySelector('.lv-gerald'), shown: window.__paw.lv.shown() } : null; });
  ok(c4 && c4.h2 === 'Town level 3!' && !c4.gerald && c4.shown === 3, 'the level 3 card, without Gerald\'s line: ' + JSON.stringify(c4));
  await t.p.click('#lvOk'); await t.modalGone();
  await t.sleep(1500); ok(await ev(() => !document.getElementById('lvOk')), 'a card shows once');
  await ev(() => window.__paw.lv.gain('board', 620 - window.__paw.lv.xp()));
  ok(await t.until(() => !!document.getElementById('lvOk'), null, 4000), 'levels 4-6 at once: one card');
  const c4m = await ev(() => { const p = document.querySelector('#modal .panel.lv-lu'); return { h2: p.querySelector('h2').textContent, many: /3 levels at once/.test(p.textContent), gerald: !!p.querySelector('.lv-gerald') }; });
  ok(c4m.h2 === 'Town level 6!' && c4m.many && !c4m.gerald, 'one card for several levels, core.lu_many: ' + JSON.stringify(c4m));
  await t.p.click('#lvOk'); await t.modalGone();

  sec('C5. an old save: no card at the switch and no Gerald line on its first card');
  await load(base, BON);
  await t.sleep(1800);
  const c5a = await ev(() => ({ from: window.__paw.S.lv.from, lv: window.__paw.lv.level(), shown: window.__paw.lv.shown(), card: !!document.getElementById('lvOk') }));
  ok(c5a.from === 'old' && c5a.shown === c5a.lv && !c5a.card, 'the switch on an old save shows no card ' + JSON.stringify(c5a));
  await ev(() => { const L = window.__paw.lv; L.gain('board', L.AT[L.level() + 1] - L.xp()); });
  ok(await t.until(() => !!document.getElementById('lvOk'), null, 4000), 'its next level shows a card');
  ok(await ev(() => !document.querySelector('#modal .lv-gerald')), 'the old save\'s first card has no Gerald line');
  await t.p.click('#lvOk'); await t.modalGone();

  /* ================= part D: the habits (V222.md 4, 7.1 D) ================= */
  // the contract's own table 4.3 (B1, B2, B3, B5, B6, B7, B8, B9) and the categories (3.3)
  const BANDS_C = `shiba mid edge aloof some keep own pout side|corgi mid bowl beg some steady near yum curl|golden busy open ball some ball near hearts sprawl|dachs mid dig needy rare slow near hearts curl|husky busy open chatty big keep near surprised side|mutt mid front follow some steady tag hearts side|chihuahua mid gate guard some keep own surprised curl|pug calm bed lazy rare slow near sleepy belly|greyhound calm bed burst big fast near zoomies belly|beagle mid dig sniff some keep near curious side|poodle mid front polite rare steady near proud side|collie busy open herd some fast herd curious side|samoyed mid shade smile some steady tag hearts sprawl|frenchie calm bed cheeky some keep near blep curl|akita mid gate loyal rare steady near proud sprawl|spitz mid front show some steady near proud side|pom busy front spin big keep near zoomies curl|afghan mid open aloof big fast own proud sprawl|dane mid bed follow rare steady near hearts sprawl|mastiff calm bed lazy rare slow near sleepy belly|gsd busy gate herd some fast herd curious sprawl|dobie busy gate guard some fast near hearts sprawl|corso mid gate loyal rare steady near proud sprawl|pitbull busy sun needy big steady near hearts side|minpin busy front burst big keep near zoomies belly|lab busy bowl beg some fast near yum sprawl|malamute busy shade chatty some keep near surprised sprawl|chow calm shade aloof rare slow own pout side|stdpoodle mid open polite some fast near proud sprawl|schnauzer mid gate guard some steady near curious curl|westie mid dig sniff some keep near curious curl|yorkie mid front cheeky some keep near pout curl|bichon mid front spin big steady tag zoomies curl|maltese mid bed follow some slow tag dreamy curl|shihtzu calm bed lazy rare slow near sleepy belly|dalmatian busy open follow big fast tag zoomies sprawl|bernese mid shade loyal rare steady near dreamy sprawl|aussie busy open herd some fast herd curious side|cavalier mid bed needy rare steady tag hearts curl|jrt busy dig sniff big keep near zoomies curl`.split('|').map((r) => r.split(' '));
  const CATS_C = ['Energy', 'Favourite spot', 'Special habit', 'Asking for pets', 'Bath zoomies', 'Ball style', 'With other dogs', 'Best face', 'Sleeping style', 'A secret'];
  const hashIdC = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  sec('D1. all 40 breeds x 10 habit lines: English, no raw keys or ICU; the bands are table 4.3');
  await fresh(BON);
  const d1 = await ev((keys) => {
    const P = window.__paw, H = P.lv.hb, base = JSON.parse(JSON.stringify(P.S.dogs[0])), out = {};
    keys.forEach((k) => { const d = Object.assign({}, base, { id: 'hbt_' + k, key: k, name: 'Mochi', bond: { level: 10, pts: 0 }, mix: null }); out[k] = { lines: Array.from({ length: 10 }, (_, i) => H.line(d, i + 1)), bands: H.bands(d) }; });
    const u = Object.assign({}, base, { id: 'hbt_x', key: 'nosuchdog', name: 'Mochi', bond: { level: 10, pts: 0 }, mix: null });
    return { out, v221: typeof v221On === 'undefined' ? null : null, cats: Array.from({ length: 10 }, (_, i) => H.cat(i + 1)), unk: Array.from({ length: 10 }, (_, i) => H.line(u, i + 1)), secrets: H.SECRETS };
  }, BANDS_C.map((r) => r[0]));
  ok(BANDS_C.length === 40 && d1.secrets.length === 40, '40 breeds in the table, 40 Bond 10 secrets in the code');
  ok(JSON.stringify(d1.cats) === JSON.stringify(CATS_C), 'the ten categories are hb.cat.1-10: ' + d1.cats.join(', '));
  const raw = (s) => !s || /[{}]|undefined|null|NaN|\bdata\.|\bhb_|\bhb\.|breed_pers\./.test(s);
  const badL = []; BANDS_C.forEach(([k]) => d1.out[k].lines.forEach((s, i) => { if (raw(s) || ([1, 2, 3, 4, 5, 6, 7, 9, 10].includes(i + 1) && !s.includes('Mochi'))) badL.push(`${k} ${i + 1}: ${s}`); }));
  ok(!badL.length, '400 lines are readable English with the dog\'s name' + (badL.length ? ': ' + badL.slice(0, 4).join(' | ') : ''));
  const badB = []; BANDS_C.forEach((r) => { const b = d1.out[r[0]].bands, got = [b[0], b[1], b[2], b[4], b[5], b[6], b[7], b[8]]; if (got.join(' ') !== r.slice(1).join(' ')) badB.push(`${r[0]}: ${got.join(' ')} (table ${r.slice(1).join(' ')})`); });
  ok(!badB.length, 'every breed\'s bands match table 4.3' + (badB.length ? ': ' + badB.slice(0, 4).join(' | ') : ''));
  ok(/^Mochi asks for pets like this: /.test(d1.out.dachs.lines[3]) && d1.out.dachs.lines[3].endsWith('Pet me eyes, full power.') && /^Best face: /.test(d1.out.shiba.lines[7]), 'Bond 4 reuses the ask line, Bond 8 the face word: ' + JSON.stringify([d1.out.dachs.lines[3], d1.out.shiba.lines[7]]));
  ok(d1.unk.every((s) => !raw(s)) && d1.unk[2] === 'Mochi does things in a very Mochi way.' && d1.unk[9] === d1.out.mutt.lines[9], 'an unknown key reads the default personality and the mutt secret');
  // the Profile card and the Bond card box, on and off
  const pf = async () => { await ev(() => window.__paw.dd.journal('profile')); await t.until(() => !!document.querySelector('#modal .profile'), null, 4000); const r = await ev(() => { const c = document.querySelector('#modal .pf-habits'); return c ? { title: c.querySelector('b').textContent, rows: [...c.querySelectorAll('li.hb-row')].map((l) => ({ n: +l.dataset.hb, off: l.classList.contains('off'), cat: l.querySelector('.hb-tx b').textContent, line: (l.querySelector('.hb-line') || {}).textContent || '', lock: (l.querySelector('.hb-lock') || {}).textContent || '', ic: !!l.querySelector('.hb-ic svg'), btn: !!l.querySelector('button') })), after: !!c.previousElementSibling } : null; }); await t.closeX(); await t.modalGone(); return r; };
  await ev(() => { const P = window.__paw; P.S.dogs[0].bond.level = 3; P.S.dogs[0].bond.pts = P.fw.BOND_TH[2]; });
  let c = await pf(), nm = await ev(() => window.__paw.S.dogs[0].name);
  ok(c && c.title === nm + "'s habits" && c.rows.length === 10 && c.rows.every((r, i) => r.n === i + 1 && r.ic && !r.btn), 'Journal > Profile has "' + (c && c.title) + '" with 10 rows, an icon each, no buttons');
  ok(c && c.rows.slice(0, 3).every((r) => !r.off && r.line.length > 10) && c.rows.slice(3).every((r) => r.off && r.lock === 'at Bond ' + r.n && !r.line), 'Bond 3: rows 1-3 show the line, 4-10 are muted "at Bond n"');
  await ev(() => window.__paw.lv.test(false)); c = await pf(); await ev(() => window.__paw.lv.test(true));
  ok(c === null, 'off: no habits card in the Profile');
  await ev(() => { const P = window.__paw; P.lv.bondUp(P.fw.BOND_TH[3] - P.S.bond.pts); });
  ok(await t.until(() => !!document.getElementById('luOk'), null, 4000), 'Bond 4: the Bond card shows');
  let bx = await ev(() => { const p = document.querySelector('#modal .panel'), u = p.querySelector('ul.unlocks'), b = p.querySelectorAll('.hb-new'); return { list: [...u.querySelectorAll('li')].map((l) => l.textContent), box: [...b].map((e) => ({ n: e.dataset.hb, cat: e.querySelector('b').textContent, line: e.querySelector('.hb-line').textContent, ic: !!e.querySelector('svg') })), under: !!u.nextElementSibling && u.nextElementSibling.classList.contains('hb-news') }; });
  const ask4 = await ev(() => window.__paw.lv.hb.line(window.__paw.S.dogs[0], 4));
  ok(bx.list.includes('New habit: Asking for pets') && bx.box.length === 1 && bx.box[0].n === '4' && bx.box[0].cat === 'Asking for pets' && bx.box[0].line === ask4 && bx.box[0].ic && bx.under, 'the Bond card lists "New habit: Asking for pets" and its box (icon and line) sits under the list ' + JSON.stringify(bx.box));
  await t.lu(); await t.luWait(800);
  await ev(() => { const b = document.getElementById('lvOk'); if (b) b.click(); }); await t.modalGone();
  const dpg = await ev(() => { const P = window.__paw, p = P.S.dd.today; return { hb: p && p.hb, lines: p ? P.dd.lines(p) : [] }; });
  ok(dpg.hb && dpg.hb.includes(await ev(() => window.__paw.S.dogs[0].id) + ':4') && dpg.lines.includes(`Found out something new about ${nm}: Asking for pets.`), 'the diary page says "Found out something new about ' + nm + ': Asking for pets."');
  const d10 = await ev(() => { const P = window.__paw, d = P.S.dogs[0]; return { lines: P.lv.hb.diary({ hb: [d.id + ':10'], n: d.name }), sec: P.lv.hb.line(d, 10) }; });
  ok(d10.lines.length === 1 && d10.lines[0] === d10.sec, 'Bond 10 in the diary: the secret is the line itself');
  // the Bond 2 party (fwTest): the box sits under the gift; off: no box and no habit line
  await fresh(Object.assign({}, BON, { fwTest: true }));
  await ev(() => { const P = window.__paw; P.lv.bondUp(P.fw.BOND_TH[1] - P.S.bond.pts); });
  ok(await t.until(() => !!document.getElementById('luOk'), null, 4000), 'Bond 2: the party card shows');
  bx = await ev(() => { const p = document.querySelector('#modal .panel'), u = p.querySelector('ul.unlocks'), b = p.querySelector('.hb-new'); return { party: p.classList.contains('fw-party'), box: b ? b.dataset.hb : null, after: !!(b && u && (u.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)), list: [...u.querySelectorAll('li')].map((l) => l.textContent) }; });
  ok(bx.party && bx.box === '2' && bx.after && bx.list.includes('New habit: Favourite spot'), 'the Bond 2 party: "New habit: Favourite spot", the box under the gift ' + JSON.stringify(bx));
  await t.lu(); await t.luWait(800); await ev(() => { const b = document.getElementById('lvOk'); if (b) b.click(); }); await t.modalGone();
  await fresh(BOFF);
  await ev(() => { const P = window.__paw; P.lv.bondUp(P.fw.BOND_TH[1] - P.S.bond.pts); });
  ok(await t.until(() => !!document.getElementById('luOk'), null, 4000), 'off, Bond 2: the party card shows');
  bx = await ev(() => { const p = document.querySelector('#modal .panel'); return { box: !!p.querySelector('.hb-new'), hab: /New habit/.test(p.textContent), page: (window.__paw.S.dd.today || {}).hb || null }; });
  ok(!bx.box && !bx.hab && !bx.page, 'off: no habit box, no "New habit" line, nothing in the diary ' + JSON.stringify(bx));
  await t.lu();

  sec('D2. a mix\'s Bond 10 secret comes from a seeded parent and is stable across reloads');
  await fresh(BON);
  const d2a = await ev(() => {
    const P = window.__paw, H = P.lv.hb, base = JSON.parse(JSON.stringify(P.S.dogs[0])), r = [];
    for (let i = 0; i < 8; i++) { const d = Object.assign({}, base, { id: 'mx' + i, key: 'shiba', name: 'Kiki', bond: { level: 10, pts: 0 }, mix: { a: 'corgi', b: 'shiba', body: 'shiba', head: 'shiba', name: 'Corgi × Shiba mix' } }); r.push({ id: d.id, s: H.secret(d), l: H.line(d, 10), l3: H.line(d, 3) }); }
    return r;
  });
  ok(d2a.every((x) => x.s === ['corgi', 'shiba'][hashIdC(x.id) % 2]), 'the parent is [a, b][hashId(id) % 2]: ' + d2a.map((x) => x.s).join(' '));
  ok(d2a.some((x) => x.s === 'corgi') && d2a.filter((x) => x.s === 'corgi').every((x) => /^From the Corgi side: Kiki sploots/.test(x.l)) && d2a.filter((x) => x.s === 'shiba').every((x) => /^Kiki has one toy hidden/.test(x.l)), 'the other parent\'s secret starts "From the Corgi side:", its own has no prefix');
  ok(d2a.every((x) => x.l3 === 'Kiki loves you from a little distance. Sitting near you is a big hug.'), 'Bond 1-9 read the body breed (persOf): the shiba trait');
  await ev(() => { const P = window.__paw, d = P.S.dogs[0]; d.mix = { a: 'golden', b: 'poodle', body: d.key, head: d.key, name: 'Golden × Poodle mix' }; d.bond.level = 10; d.bond.pts = P.fw.BOND_TH[9]; P.saveNow(); });
  const d2b = await ev(() => { const P = window.__paw; return { id: P.S.dogs[0].id, key: P.S.dogs[0].key, s: P.lv.hb.secret(P.S.dogs[0]), l: P.lv.hb.line(P.S.dogs[0], 10) }; });
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue');
  await t.until(() => ['yard', 'market'].includes(window.__paw.mode) && !!window.__paw.lv, null, 10000); await t.calm(); await t.lu();
  const d2c = await ev(() => { const P = window.__paw; return { s: P.lv.hb.secret(P.S.dogs[0]), l: P.lv.hb.line(P.S.dogs[0], 10) }; });
  ok(d2b.s === ['golden', 'poodle'][hashIdC(d2b.id) % 2] && d2c.s === d2b.s && d2c.l === d2b.l && (d2b.s === d2b.key) !== /^From the .+ side: /.test(d2b.l), 'the same secret after a reload: ' + d2b.l);

  sec('D3. "does it more": off the weights are today\'s, with lvOn the trait weight is x1.5');
  // today's weights (37_roam.js rmPackAct, 43_ground.js grAct before v2.22), from the same personality
  const todayW = (p, out, n, place) => ({
    rm: { wander: 2, zoomies: p.zoomies * (out ? 2.2 : 0.6), follow: p.follows * 1.6, sniff: p.trait === 'sniff' ? 2.5 : out ? 0.6 : 0.2, herd: p.trait === 'herd' && n > 2 ? 2 : 0, guard: p.trait === 'guard' ? 2 : 0, beg: p.trait === 'beg' ? 1.6 : 0, dig: p.trait === 'needy' && place.grassy ? 1.2 : 0, doze: (1 - p.energy) * 1.4, front: p.trait === 'follow' || p.trait === 'polite' ? 1 : 0, loyal: p.trait === 'loyal' ? 2 : 0, show: p.trait === 'show' ? 1.8 : 0, spin: p.trait === 'spin' ? 2.2 : 0 },
    gr: { wander: 2, sniff: p.trait === 'sniff' ? 2.5 : out ? 0.6 : 0.2, dig: p.trait === 'needy' && place.grassy ? 1.2 : 0, zoomies: p.zoomies * (out ? 2.2 : 0.6), follow: n - 1 ? p.follows * 1.6 : 0, play: 0, patrol: p.trait === 'guard' ? 2 : p.trait === 'aloof' ? 1.2 : p.trait === 'loyal' ? 1 : 0, herd: p.trait === 'herd' && n - 1 >= 2 ? 2 : 0, rest: (1 - p.energy) * 1.4 + (p.trait === 'lazy' ? 1 : 0), spot: 1, front: p.trait === 'follow' || p.trait === 'polite' ? 1 : p.trait === 'show' ? 1.8 : 0.3 * p.attention, spin: p.trait === 'spin' ? 2.2 : 0, beg: p.trait === 'beg' ? 1.2 : 0 } });
  const TR = ['beagle', 'collie', 'chihuahua', 'corgi', 'dachs', 'mutt', 'poodle', 'akita', 'spitz', 'pom', 'shiba', 'pug', 'golden', 'husky'];
  const d3 = await ev((TR) => {
    const P = window.__paw, H = P.lv.hb, S = P.S, base = JSON.parse(JSON.stringify(S.dogs[0])), keep = S.dogs.slice(); delete base.mix;
    S.dogs = [S.dogs[0]].concat(TR.map((k) => Object.assign(JSON.parse(JSON.stringify(base)), { id: 'w_' + k, key: k, name: k, bond: { level: 1, pts: 0 } })));
    const grassy = typeof GRASSY !== 'undefined' ? null : null;
    const at = (on, b) => { P.lv.test(on); const r = {}; TR.forEach((k) => { const d = S.dogs.find((x) => x.id === 'w_' + k); d.bond.level = b; const w = H.weights(d); r[k] = { rm: w.rm, gr: w.gr, p: w.p, chat: H.chat(d), ball: H.ball(d) }; }); return r; };
    const off10 = at(false, 10), on1 = at(true, 1), on2 = at(true, 2), on3 = at(true, 3), on9 = at(true, 9);
    // the seeded random: a pick off and at Bond 1-2 draws exactly the same numbers; hbLike draws none off
    const R = Math.random; let calls = 0, a = 7; Math.random = () => { calls++; a = (a * 16807) % 2147483647; return a / 2147483647; };
    const dk = S.dogs.find((x) => x.id === 'w_corgi'); P.lv.test(false); dk.bond.level = 10; const likeOff = H.like(dk), cOff = calls; P.lv.test(true); dk.bond.level = 1; const like1 = H.like(dk), c1 = calls - cOff; dk.bond.level = 2; let hits = 0; for (let i = 0; i < 400; i++) if (H.like(dk)) hits++; const c2 = calls - cOff - c1;
    Math.random = R;
    const pool0 = ['idle', 'sit'], gd = S.dogs.find((x) => x.id === 'w_golden'); gd.stats.energy = 40; P.lv.test(false); gd.bond.level = 10; const pOff = H.pool(gd, pool0.slice()); P.lv.test(true); gd.bond.level = 3; const p3 = H.pool(gd, pool0.slice()); gd.bond.level = 9; const p9 = H.pool(gd, pool0.slice());
    const face = (on, b) => { P.lv.test(on); gd.bond.level = b; return H.face(gd, [['hearts', 2], ['yum', 1]]).length; };
    const fc = [face(false, 10), face(true, 7), face(true, 8)];
    P.lv.test(true); const n = S.dogs.length; S.dogs = keep;
    return { off10, on1, on2, on3, on9, out: typeof outdoorsNow === 'function' ? null : null, likeOff: likeOff === undefined, cOff, like1: like1 === undefined, c1, c2, hits, pOff, p3, p9, fc, place: P.S.place, n };
  }, TR);
  const placeInfo = await ev(() => ({ out: !!(window.__paw.S && ['yard', 'park'].includes(window.__paw.S.place)) }));
  const near = (a, b) => Object.keys(b).every((k) => Math.abs((a[k] || 0) - b[k]) < 1e-9) && Object.keys(a).length === Object.keys(b).length;
  // the today formula needs outdoors and grassy as the page sees them: read them back from a weight that only they set
  const bad3 = [];
  TR.forEach((k) => {
    const o = d1 && d3.off10[k], p = o.p, out = Math.abs(o.rm.zoomies - p.zoomies * 2.2) < 1e-9, grassy = p.trait === 'needy' ? o.rm.dig > 0 : false, T = todayW(p, out, d3.n, { grassy });
    if (!near(o.rm, T.rm) || !near(o.gr, T.gr)) bad3.push(k + ' off');
    if (!near(d3.on1[k].rm, T.rm) || !near(d3.on2[k].gr, todayW(d3.on2[k].p, out, d3.n, { grassy }).gr)) bad3.push(k + ' on, Bond 1-2');
    if (o.chat !== 0.35 || o.ball !== 0.5 || d3.on2[k].chat !== 0.35) bad3.push(k + ' chat/ball');
  });
  ok(!bad3.length, 'off (Bond 10) and on at Bond 1-2: rmPackAct and grAct weights are exactly today\'s for ' + TR.length + ' breeds' + (bad3.length ? ': ' + bad3.join(', ') : ''));
  const x15 = { beagle: [['rm', 'sniff'], ['gr', 'sniff']], collie: [['rm', 'herd'], ['gr', 'herd']], chihuahua: [['rm', 'guard'], ['gr', 'patrol']], corgi: [['rm', 'beg'], ['gr', 'beg']], poodle: [['rm', 'front'], ['gr', 'front']], akita: [['rm', 'loyal'], ['gr', 'patrol']], spitz: [['rm', 'show'], ['gr', 'front']], pom: [['rm', 'spin'], ['gr', 'spin']], shiba: [['gr', 'patrol']], mutt: [['rm', 'front'], ['gr', 'front']] };
  const bad15 = []; Object.entries(x15).forEach(([k, L]) => L.forEach(([w, f]) => { const a = d3.on2[k][w][f], b = d3.on3[k][w][f]; if (!(a > 0) || Math.abs(b - a * 1.5) > 1e-9) bad15.push(`${k} ${w}.${f} ${a} -> ${b}`); }));
  ok(!bad15.length, 'Bond 3 with lvOn: the trait weight x1.5 (sniff, herd, guard, beg, front, loyal, show, spin, patrol)' + (bad15.length ? ': ' + bad15.join(', ') : ''));
  ok(Math.abs(d3.on3.pug.gr.rest - d3.on2.pug.gr.rest - 0.5) < 1e-9 && d3.on3.husky.chat === 0.5 && d3.on9.golden.ball === 0.7 && d3.on3.golden.ball === 0.5, 'lazy rest +1 becomes +1.5, the chatty bark 0.35 becomes 0.5, the ball line 0.5 becomes 0.7 at Bond 6');
  const pK = (k, a, b, f) => Math.abs(d3[b][k].p[f] - Math.min(1, d3[a][k].p[f] * (f === 'zoomies' ? 1.2 : 1.25))) < 1e-9;
  ok(pK('dachs', 'on3', 'on9', 'attention') && pK('husky', 'on3', 'on9', 'zoomies') && pK('mutt', 'on3', 'on9', 'follows') && JSON.stringify(d3.on3.dachs.p) === JSON.stringify(d3.off10.dachs.p), 'rmPers: attention x1.25 (Bond 4), zoomies x1.2 (Bond 5), follows x1.25 (Bond 7), capped at 1; off and Bond 3 the same as today');
  ok(d3.likeOff && d3.cOff === 0 && d3.like1 && d3.c1 === 0 && d3.c2 === 400 && d3.hits > 100 && d3.hits < 180, `the favourite spot: off and Bond 1 draw no random number, Bond 2 picks it ${d3.hits} of 400 (35 %)`);
  ok(d3.pOff.length === 2 && d3.p3.join() === 'idle,sit,happy' && d3.p9.join() === 'idle,sit,happy,sleep' && d3.fc.join() === '2,2,3', 'the idle pool (+happy at Bond 3 for ball, +sleep at Bond 9 under 60 Energy) and the best face (one more entry at Bond 8); off unchanged ' + JSON.stringify([d3.p3, d3.p9, d3.fc]));

  sec('D4. the bath zoomies run once per bath, never with Motion off');
  await fresh(Object.assign({}, BON, { rmTest: true }));
  const pid = await ev(() => { const P = window.__paw; P.addDog({ key: 'husky', sex: 'male', months: 24 }, 'Zoom'); const d = P.S.dogs[1]; d.bond = { level: 5, pts: P.fw.BOND_TH[4] }; d.stats.energy = 90; P.S.place = 'yard'; P.go('yard'); return d.id; });
  await t.lu(); await t.calm();
  const bath = () => ev((id) => { const P = window.__paw; P.lv.act('bath', { dogs: 1, ids: [id] }); P.go('yard'); }, pid);
  const z0 = await ev(() => window.__paw.lv.hb.zooms());
  await bath();
  ok(await t.until((z) => window.__paw.lv.hb.zooms() === z + 1, z0, 9000), 'a bathed Bond 5 pack dog runs its zoomies back in the yard');
  const zb = await ev((id) => window.__paw.lv.hb.band(id, 5), pid);
  await ev(() => window.__paw.go('yard')); await t.sleep(2500);
  ok(await ev((z) => window.__paw.lv.hb.zooms() === z + 1 && !window.__paw.lv.hb.pending().length, z0), 'once per bath: back in the yard again, no second run (band ' + zb + ')');
  await t.freezeMotion(true);
  await bath(); await t.sleep(3000);
  ok(await ev((z) => window.__paw.lv.hb.zooms() === z + 1, z0) && await ev((id) => window.__paw.lv.hb.bath(id) === false, pid), 'Motion off: no bath zoomies (and hbBathZoom says no)');
  await t.freezeMotion(false);
  await ev(() => window.__paw.lv.test(false)); await bath(); await t.sleep(3000);
  ok(await ev((z) => window.__paw.lv.hb.zooms() === z + 1 && !window.__paw.lv.hb.pending().length, z0), 'off: no bath zoomies');
  await ev(() => window.__paw.lv.test(true));

  sec('D5. one habits letter for a 3-dog old save');
  await load(fix({ bonds: [3, 2, 1], cd: 4, pv: 3 }), ON);
  await t.until(() => { const S = window.__paw.S; return !!(S.lv && S.lv.mail === 1); }, null, 5000);
  const d5 = await ev(() => { const P = window.__paw, S = P.S, m = (S.mail || []).filter((x) => x.id === 'lv_habits'); return { n: m.length, title: m[0] && m[0].title, text: m[0] && m[0].text, names: S.dogs.map((d) => d.name), lines: S.dogs.map((d) => P.lv.hb.line(d, Math.min(9, d.bond.level))), lv: S.lv.lv }; });
  ok(d5.n === 1 && d5.title === "Your pack's habits", 'one letter, "Your pack\'s habits", for ' + d5.names.length + ' dogs');
  ok(d5.text && d5.names.every((n) => d5.text.includes(n)) && d5.lines.every((l) => d5.text.includes(l)) && d5.text.includes('Journal > Profile') && d5.text.endsWith(`PS. You have a town level now: ${d5.lv}. Everything you had open stays open.`), 'it names every dog, gives each dog\'s newest habit and the PS: ' + (d5.text || '').slice(0, 160) + '...');
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue');
  await t.until(() => ['yard', 'market'].includes(window.__paw.mode) && !!window.__paw.lv, null, 10000); await t.sleep(1500);
  ok(await ev(() => (window.__paw.S.mail || []).filter((x) => x.id === 'lv_habits').length === 1), 'a reload sends no second letter');
}, { map215: true, prefs: ON, timeout: 600000 });
