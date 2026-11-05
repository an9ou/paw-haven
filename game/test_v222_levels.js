// v2.22 "Town levels and dog habits" (V222.md), part A: the core in game/src/51_levels.js.
//   A0 a fresh save's S.lv, the off state (exactly today: no S.lv, every gate is topBond, no XP, no letter)
//   A1 old saves (Bond 1, 3, 5, 10 + 6, two dogs with no dd.pv) start as in 5.2, S.v 1, one habits letter, the titles
//   A2 the no-relock sweep: every place, route, Tokyo place, feature, Fun Fair game and shop row open with lvOn off is open with it on
//   A3 every LV_UNLOCK row is at most LV_FLOOR[bond] over the live tables, level 1 = every Bond 1 row
//   A4 each daily source and its sub-cap, the 150 cap, the 00:00 JST reset (Date.now stub), walks 6+ give 0
//   A5 milestones count once (first visit, Bond per dog, badge tiers but not the quiet backfill, a notebook page, the board)
//   A6 XP never drops, no coins from a level-up.  A7 JSON + migrate keeps S.lv.  A8 on, off (Bond grows), on: nothing locks
//   A9 the pace table 2.3 re-run on the built numbers is within one level.  S  the stars past level 20 count, never backfilled
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
}, { map215: true, prefs: ON, timeout: 420000 });
