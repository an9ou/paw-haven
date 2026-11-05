// v2.20 "Missions v2" (V220.md, docs/design/missions-v2.md): part A (save fields, the backfill of old saves, the counters, the new act data)
// and part B (Today: one story mission and two little helps a Japan day, no coins for helps, Gerald's treat pouch once a Japan day, the free
// swap on any one row, the tab strip), part C (Badges: 17 tracks, tiers from the counters, cosmetics only, the Badges sticker pages, the Crayon
// Medal, an old save's quiet backfill and its one letter). Part D (Week: the help-wanted board, Monday 00:00 JST, any 3 of 5,
// one letter with 50 coins, the neighbour card). Later parts (E Notebook, F Growing up) add their sections below.
// The launch switch (owner, 4 Nov 2026; the v2.19 Friends pattern): MS2_LIVE is off until the owner's launch date, so this suite turns Missions v2 on
// with prefs.ms2Test (the dev panel's switch), as v219_friends does with prefs.frTest. Section L checks the off state (exactly v2.19.2) and a quiet turn-on.
// node game/run_tests.js v220_missions
require('./test_lib').run('v220_missions', async (t) => {
  const { ok, sec, ev, S } = t;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  await t.newGame({ sex: 'girl' }, { bond: { level: 5, pts: 900 }, coins: 1000, stats: { hunger: 80, happy: 70, energy: 90, clean: 90 } });
  await t.home('yard'); await t.freezeMotion(true);
  await t.until(() => !!(window.__paw && window.__paw.ms && window.__paw.ms2 && window.__paw.rh), null, 6000);
  // today's wishes are used up (coins at the day's cap), so a wish never adds coins to the checks below
  const calmWishes = () => ev(() => { const S = window.__paw.S, d = new Date(); if (!S.dd) return; const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; S.dd.wish = { day: iso, w: {}, coins: 20 }; S.dogs.forEach((x) => { S.dd.wish.w[x.id] = { k: 'walk', a: null, done: 1 }; }); });
  await calmWishes();
  // a forced mission with the stamp card emptied first, so no 7-stamp prize popup comes up in the middle of the checks
  await ev(() => { window.__msf = (ids) => { const P = window.__paw; P.S.missions.stamps = 0; return P.ms.force(ids); }; });

  sec('A1. a new save: the v2.20 fields, the notebook, S.v 1');
  let s = await S();
  const m0 = s.missions;
  ok(s.v === 1 && m0.help && Array.isArray(m0.help.list) && m0.pouch && typeof m0.pouch.c === 'number' && m0.life && m0.life.bf === 1 && m0.tr && m0.wk && Array.isArray(m0.wk.list) && m0.wkAreas && m0.grow, 'help, pouch, life, tr, wk, wkAreas, grow are there: ' + Object.keys(m0).join(' '));
  ok(['ms', 'help', 'harvest', 'cook', 'bath', 'trick', 'fetch', 'boards'].every((k) => typeof m0.life[k] === 'number'), 'life has the eight counters');
  ok(m0.nb && typeof m0.nb.pages === 'number' && Array.isArray(m0.nb.got), 'a new save gets the notebook (nb): ' + JSON.stringify(m0.nb));

  sec('A2. the counters and the new act data');
  const cnt = await ev(() => {
    const P = window.__paw, L = P.S.missions.life, b = Object.assign({}, L); window.__msf(['gaze']);
    P.ms.act('garden', { what: 'harvest', crop: 'carrot' }); P.ms.act('cook', { dish: 'x', stars: 1, discovered: true }); P.ms.act('bath', { dogs: 2, ids: ['a', 'b'] });
    P.ms.act('trick', { name: 'Sit', grade: 'Good', place: 'yard', mode: 'lure' }); P.ms.act('fetch', { name: 'Tennis Ball' }); P.ms.act('toy', { name: 'Rope' });
    return { h: L.harvest - b.harvest, c: L.cook - b.cook, b: L.bath - b.bath, t: L.trick - b.trick, f: L.fetch - b.fetch };
  });
  ok(cnt.h === 1 && cnt.c === 1 && cnt.b === 2 && cnt.t === 1 && cnt.f === 2, 'harvest, cook, bath (each dog), trick, fetch and toy count: ' + JSON.stringify(cnt));
  const wk = await ev(() => { const P = window.__paw, j = P.rh.jst(); P.S.missions.wkAreas = { woods: '2020-01-01' }; const a = P.ms2.walked7('park'); P.ms.act('walk', { area: 'park', pack: 1 }); return { a, b: P.ms2.walked7('park'), old: 'woods' in P.S.missions.wkAreas, d: P.S.missions.wkAreas.park === j, wk: P.ms2.weekKey('2026-11-11'), wk2: P.ms2.weekKey('2026-11-16'), wk3: P.ms2.weekKey('2026-11-15') }; });
  ok(!wk.a && wk.b && wk.d && !wk.old, 'wkAreas: a walk writes today\'s Japan date and drops days older than 7: ' + JSON.stringify(wk));
  ok(wk.wk === '2026-11-09' && wk.wk2 === '2026-11-16' && wk.wk3 === '2026-11-09', 'ms2WeekKey: the Monday of the Japan week');
  // the act data in the game code itself (V220.md section 2)
  const src = await ev(() => [typeof window.__paw.ms2.fresh === 'function']);
  ok(src[0], 'the test hook is complete');

  sec('A3. the nine new story missions');
  const pool = await ev(() => { const P = window.__paw; return { ids: P.ms.pool, w: ['walk_fresh', 'walk_dressed', 'pack_walk', 'cook_new', 'decorate', 'cafe', 'trick_show', 'wish', 'friend_yard'].map((id) => P.ms.weight(id)), el: P.ms.eligible() }; });
  ok(pool.w.every((x) => x === 3), 'all nine are story missions (weight 3): ' + pool.w.join());
  ok(!pool.el.includes('friend_yard'), 'Visit a friend\'s yard stays out while Friends are not live');
  const hits = await ev(() => {
    const P = window.__paw, out = {}, run = (id, kind, data, pre) => { window.__msf([id]); if (pre) pre(); P.ms.act(kind, data); out[id] = !!P.S.missions.list[0].done; };
    run('walk_fresh', 'walk', { area: 'river', pack: 1 }, () => { P.S.missions.wkAreas = {}; });
    window.__msf(['walk_fresh']); P.ms.act('walk', { area: 'river', pack: 1 }); out.fresh2 = !P.S.missions.list[0].done; // walked this week already
    run('pack_walk', 'walk', { area: 'park', pack: 2 });
    window.__msf(['pack_walk']); P.ms.act('walk', { area: 'park', pack: 1 }); out.alone = !P.S.missions.list[0].done;
    run('cook_new', 'cook', { dish: 'a', stars: 1, discovered: true });
    window.__msf(['cook_new']); P.ms.act('cook', { dish: 'a', stars: 1, discovered: false }); out.known = !P.S.missions.list[0].done;
    run('trick_show', 'trick', { name: 'Sit', grade: 'Good', place: 'square', mode: 'show' });
    window.__msf(['trick_show']); P.ms.act('trick', { name: 'Sit', grade: 'Good', place: 'yard', mode: 'show' }); out.yard = !P.S.missions.list[0].done;
    run('wish', 'wish', { k: 'walk', a: null, id: P.S.dogs[0].id });
    run('cafe', 'travel', { place: 'cafe' }); run('decorate', 'decorate', { room: 'house', moved: 1 }); run('friend_yard', 'frvisit', { fid: 'x' });
    const ow = P.S.outfit.head; P.S.outfit.head = 'Bow Tie'; run('walk_dressed', 'walk', { area: 'park', pack: 1 }); P.S.outfit.head = ow;
    return out;
  });
  ok(Object.values(hits).every(Boolean), 'each new mission counts its act (and not the near misses): ' + JSON.stringify(hits));
  await t.waitToast(/^Mission done/); await ev(() => { window.__toasts.splice(0); });

  sec('B1. Today: one story mission and two little helps, seeded by the Japan date and the first dog');
  const d1 = await ev(() => {
    const P = window.__paw, a = P.ms2.pick('2026-03-14').map((x) => x.id).join(), b = P.ms2.pick('2026-03-14').map((x) => x.id).join();
    P.S.missions.help.date = ''; const h1 = P.ms2.helps().map((x) => x.id).join(); const h2 = P.ms2.helps().map((x) => x.id).join();
    const days = []; for (let i = 0; i < 40; i++) { const L = P.ms2.pick('2026-02-' + String(1 + (i % 28)).padStart(2, '0') + (i >= 28 ? 'x' : '')); days.push(L.map((x) => x.id)); }
    return { a, b, h1, h2, n: P.ms2.helps().length, pool: P.ms2.pool.length, two: days.every((L) => L.length === 2 && L[0] !== L[1]), list: P.ms.today().length };
  });
  ok(d1.pool === 16 && d1.n === 2 && d1.list === 1, `16 little helps in the pool, 2 today, 1 story mission (${d1.pool}, ${d1.n}, ${d1.list})`);
  ok(d1.a === d1.b && d1.h1 === d1.h2, 'the same day and dog draw the same two helps, a second roll keeps them: ' + d1.h1);
  ok(d1.two, 'every day draws two different helps');
  const ov = await ev(() => { const P = window.__paw; let bad = 0; for (let i = 1; i <= 28; i++) { const d = '2026-04-' + String(i).padStart(2, '0'), ms = P.ms.pick(d).map((x) => x.id); P.S.missions.date = d; P.S.missions.list = P.ms.pick(d); const h = P.ms2.pick(d); if (ms.includes('photo') && h.some((x) => x.id === 'h_photo')) bad++; } P.S.missions.date = ''; P.ms.roll(); return bad; });
  ok(ov === 0, 'a help never repeats the story mission (Take a photo / Snap one photo)');

  sec('B2. JST midnight (15:00 UTC) with a clock stub: new helps, nothing carried over');
  const jm = await ev(() => {
    const P = window.__paw, R = Date.now, out = {};
    try {
      Date.now = () => Date.UTC(2026, 10, 9, 14, 59, 59, 500); P.ms2.helps(); P.S.missions.help.list[0].done = '2026-11-09'; P.S.missions.help.list[0].p = 1;
      out.d1 = P.S.missions.help.date; out.kept = !!P.ms2.helps()[0].done;
      Date.now = () => Date.UTC(2026, 10, 9, 15, 0, 0, 500); const L = P.ms2.helps(); out.d2 = P.S.missions.help.date; out.fresh = L.length === 2 && L.every((x) => !x.done && !x.p); out.mdate = P.S.missions.date;
    } finally { Date.now = R; }
    P.ms2.helps(); out.back = P.S.missions.help.date === P.rh.jst(); return out;
  });
  ok(jm.d1 === '2026-11-09' && jm.kept, 'before midnight in Japan: the 9th, a done help stays done');
  ok(jm.d2 === '2026-11-10' && jm.fresh && jm.mdate === '2026-11-10', 'after midnight in Japan: two fresh helps and a fresh mission for the 10th');
  ok(jm.back, 'back to today');

  sec('B3. little helps pay no coins (their act gives its own Bond, nothing more)');
  await calmWishes();
  const hc = await ev(() => { const P = window.__paw; P.S.missions.pouch.day = ''; window.__msf(['cook']); P.ms2.force(['h_pet', 'h_water']); window.__toasts.splice(0); const c = P.S.coins, life = P.S.missions.life.help; P.ms.act('pet', {}); P.ms.act('water', { name: 'Fresh Water' }); return { dc: P.S.coins - c, done: P.S.missions.help.list.map((x) => !!x.done), life: P.S.missions.life.help - life, pouch: P.S.missions.pouch.day }; });
  ok(hc.dc === 0 && hc.done.every(Boolean) && hc.life === 2, `two helps done, +0 coins (${hc.dc}), life.help +2`);
  ok(await t.waitToast(/^Little help done: (A good rub|Fresh water)\.$|little helps done/), 'toast "Little help done: ..."');
  ok(hc.pouch !== (await ev(() => window.__paw.rh.jst())), 'no pouch while the story mission is still open');
  ok(await t.until(() => document.querySelector('#msBtn').classList.contains('dot'), null, 3000), 'a soft dot on the top-bar clipboard (no number change)');
  ok(await ev(() => document.querySelector('#msBtn .ms-n').textContent.trim() === '0/1'), 'the clipboard count is still the story mission: 0/1');

  sec('B4. all three done: Gerald\'s treat pouch, one dog-safe treat, the diary paw, once a Japan day');
  const pc = await ev(() => {
    const P = window.__paw, S = P.S, j = P.rh.jst(), tr = P.ms2.treat(j), f0 = S.inv.food[tr] || 0, c = S.coins;
    S.missions.pouch.day = ''; window.__msf(['bath']); P.ms2.force(['h_pet', 'h_water']); P.ms.act('pet', {}); P.ms.act('water', { name: 'Fresh Water' });
    const before = S.missions.pouch.day; P.ms.act('bath', {});
    const page = S.dd && S.dd.today;
    return { tr, food: (S.inv.food[tr] || 0) - f0, dc: S.coins - c, day: S.missions.pouch.day, j, before, n: S.missions.pouch.n, cnt: S.missions.pouch.c, q: !!(page && page.x.includes('q')) };
  });
  ok(['Carrot Sticks', 'Apple Slices', 'Blueberry Bites', 'Bone-shaped Biscuit', 'Sweet Potato Chews'].includes(pc.tr) && pc.n === pc.tr, 'today\'s treat is one of the five dog-safe treats: ' + pc.tr);
  ok(pc.before !== pc.j && pc.day === pc.j && pc.food === 1 && pc.cnt >= 1, 'the pouch comes when the last row is done: +1 ' + pc.tr);
  ok(pc.dc === 40, 'coins: only the story mission\'s 40 (' + pc.dc + ')');
  ok(pc.q, 'a paw doodle (q) on today\'s diary page');
  ok(await t.waitToast(/^All three done! Gerald opens his treat pouch: one .+ for .+\. It is in the Feed tray\.$/), 'toast "All three done! Gerald opens his treat pouch ..."');
  const again = await ev(() => { const P = window.__paw, S = P.S, tr = S.missions.pouch.n, f0 = S.inv.food[tr]; window.__msf(['bath']); P.ms2.force(['h_pet', 'h_water']); ['pet', 'water', 'bath'].forEach((k) => P.ms.act(k, {})); return { food: S.inv.food[tr] - f0, got: P.ms2.pouch() }; });
  ok(again.food === 0 && !again.got, 'a second "all done" the same Japan day: no second pouch');
  const next = await ev(() => {
    const P = window.__paw, S = P.S, R = Date.now, out = {}, t0 = Date.now(), j0 = P.rh.jst();
    try {
      Date.now = () => t0 + 864e5; out.j = P.rh.jst(); out.tr = P.ms2.treat(out.j); out.tr0 = P.ms2.treat(j0); const f0 = S.inv.food[out.tr] || 0;
      window.__msf(['bath']); P.ms2.force(['h_pet', 'h_water']); ['pet', 'water', 'bath'].forEach((k) => P.ms.act(k, {}));
      out.food = (S.inv.food[out.tr] || 0) - f0; out.day = S.missions.pouch.day;
    } finally { Date.now = R; }
    S.missions.date = ''; S.missions.help.date = ''; P.ms.roll(); P.ms2.helps(); return out;
  });
  ok(next.day === next.j && next.food === 1 && next.tr !== next.tr0, `the next Japan day: a pouch again, with the next treat (${next.tr0} -> ${next.tr})`);
  await calmWishes();

  sec('B5. the free swap works on any one row, once a day for all three');
  await ev(() => { const P = window.__paw; P.S.missions.swap = ''; P.S.missions.help.sw = ''; window.__msf(['bath']); P.ms2.force(['h_pet', 'h_water']); window.__toasts.splice(0); });
  ok(await ev(() => window.__paw.ms2.swapFree(0) && window.__paw.ms2.swapFree(1) && window.__paw.ms2.swapFree('m')), 'each open row can be swapped');
  await ev(() => window.__paw.ms.open());
  ok(await t.until(() => document.querySelectorAll('#modal .ms-pop .ms2-swap[data-row]').length === 2 && !!document.querySelector('#modal .ms-pop #msSwap'), null, 4000), 'the sheet: a Swap pill on each help row and the mission\'s Swap button');
  { const b = await t.p.locator('.ms2-swap[data-row="0"]').boundingBox(); ok(b && b.height >= 44 && b.width >= 44, 'a 44 px tap: ' + (b && Math.round(b.height))); }
  await t.p.click('.ms2-swap[data-row="0"]');
  ok(await t.until(() => { const m = window.__paw.S.missions; return m.help.list[0].id !== 'h_pet' && m.swap === window.__paw.rh.jst() && m.help.sw === 'h'; }, null, 3000), 'tapping it swaps that help: ' + (await S()).missions.help.list.map((x) => x.id).join());
  const sw = await ev(() => { const m = window.__paw.S.missions; return { ids: m.help.list.map((x) => x.id), mis: m.list[0].id, line: (document.querySelector('#modal .ms-pop .ms-swapline') || {}).textContent || '', pills: document.querySelectorAll('#modal .ms2-swap').length, btn: !!document.querySelector('#msSwap') }; });
  ok(sw.ids[1] === 'h_water' && sw.ids[0] !== 'h_water' && sw.mis === 'bath', 'only that row changed, no repeat of the other help: ' + sw.ids.join());
  ok(/^Swapped today\. New little helps come tomorrow\.$/.test(sw.line.trim()) && !sw.pills && !sw.btn, 'the sheet says "Swapped today. New little helps come tomorrow." and every Swap is gone');
  ok(await t.waitToast(/^A new little help for today: .+\.$/), 'toast "A new little help for today: ..."');
  ok(await ev(() => !window.__paw.ms.swap() && !window.__paw.ms2.swap(1) && !window.__paw.ms.swapFree()), 'the mission and the other help cannot be swapped any more today');
  await t.closeX(); await t.modalGone();

  sec('B6. the tab strip: Today, Week, Badges, and Notebook for a new player (part E), crayon pills of 44 px');
  await ev(() => window.__paw.ms.open());
  await t.until(() => !!document.querySelector('#modal .ms-pop .ms-tabs'), null, 4000);
  const tb = await ev(() => ({ tabs: [...document.querySelectorAll('#modal .ms-tab')].map((b) => b.dataset.mstab + ':' + b.getAttribute('aria-selected')), hs: [...document.querySelectorAll('#modal .ms-tab')].map((b) => b.getBoundingClientRect().height), body: !!document.querySelector('#modal .ms-tabbody .ms-body'), title: (document.querySelector('#modal .panel h2') || {}).textContent || '', helps: document.querySelectorAll('#modal .ms2-helps li').length, pouch: !!document.querySelector('#modal .ms2-pouch'), li: document.querySelectorAll('#modal .ms-pop .ms-list li').length }));
  ok(tb.tabs.join() === 'today:true,week:false,badges:false,notebook:false' && tb.hs.every((h) => h >= 44), 'four tabs for a new save (the notebook), Today open, each 44 px or more: ' + tb.tabs.join() + ' ' + tb.hs.map(Math.round).join());
  ok(tb.body && tb.helps === 2 && tb.pouch && tb.li === 1, 'Today: the clipboard (one story row), two help rows, the pouch line');
  await t.p.click('.ms-tab[data-mstab="week"]');
  ok(await t.until(() => document.querySelectorAll('#modal .ms-tabbody .msw .msw-note').length === 5 && document.querySelector('.ms-tab[data-mstab="week"]').getAttribute('aria-selected') === 'true', null, 3000), 'Week: Gerald\'s help-wanted board, five notes (part D)');
  await t.p.click('.ms-tab[data-mstab="badges"]');
  ok(await t.until(() => document.querySelectorAll('#modal .ms-tabbody .msb .msb-row').length === 17, null, 3000), 'Badges: the 17 badge rows (part C)');
  await t.p.click('.ms-tab[data-mstab="notebook"]'); await t.until(() => !!document.querySelector('#modal .ms-tabbody .nb'), null, 3000); // a clock stub above (B2) may have opened page 2: its dot clears here
  await t.p.click('.ms-tab[data-mstab="today"]');
  ok(await t.until(() => !!document.querySelector('#modal .ms-tabbody .ms-body'), null, 3000), 'back to Today');
  ok(await ev(() => !document.querySelector('#msBtn').classList.contains('dot')), 'opening the sheet clears the soft dot');
  ok(await ev(() => ![...document.querySelectorAll('#modal .ms-pop *')].some((e) => e.children.length === 0 && e.textContent.trim() && /;/.test(e.textContent))), 'no semicolons in the sheet');
  await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.go('yard'));

  sec('C1. badges: 17 tracks, tiers from the counters, no coins, no puppy track');
  const c1 = await ev(() => {
    const P = window.__paw, B = P.msb, S = P.S;
    return { ids: B.tracks, n: B.tracks.length, tiers: B.tracks.map((id) => B.tiers(id).length === 4 && B.tiers(id).every((x, i, a) => i === 0 || x > a[i - 1])), coats: B.tiers('coats').join(), tr: JSON.stringify(S.missions.tr), trbf: S.missions.trbf };
  });
  ok(c1.n === 17 && c1.tiers.every(Boolean), '17 tracks, four rising tiers each: ' + c1.ids.join(' '));
  ok(!c1.ids.some((id) => /pup|litter|breed|playdate/i.test(id)) && !c1.ids.includes('puppies'), 'no puppy or litter track');
  ok(c1.coats === '5,15,30,50', 'Coats: the Coat Collection milestones 5 / 15 / 30 / 50');
  ok(c1.trbf === 1, 'a new save never gets the backfill letter (trbf 1): ' + c1.tr);
  await ev(() => { window.__toasts.splice(0); });
  const c2 = await ev(() => {
    const P = window.__paw, B = P.msb, S = P.S, c = S.coins, b = S.bond.pts; S.walks = 12; P.ms.act('pet', {});
    const r1 = B.reached('walker'), got = B.check(false).map((x) => x.id + ':' + x.t).join();
    const one = { got, r1, tier: B.tier('walker'), dc: S.coins - c, db: S.bond.pts - b, st: !!(S.dd.st && S.dd.st.msb_walker) };
    S.walks = 60; const b2 = S.bond.pts; one.got2 = B.check(false).map((x) => x.id + ':' + x.t).join(); one.db2 = S.bond.pts - b2; one.dc2 = S.coins - c; one.dot = B.dot();
    return one;
  });
  ok(c2.r1 === 'b' && c2.got === 'walker:b' && c2.tier === 'b', 'Walker 12 of 10: bronze (' + c2.got + ')');
  ok(c2.st, 'bronze: the Walker sticker on the Badges page');
  ok(c2.got2 === 'walker:s' && c2.db2 > 0 && c2.db === 0, 'Walker 60 of 50: silver gives Bond for the active dog (+' + c2.db2 + '), bronze none');
  ok(c2.dc === 0 && c2.dc2 === 0, 'no coins from the tiers (' + c2.dc + ', ' + c2.dc2 + ')');
  ok(c2.dot && (await t.until(() => document.querySelector('#msBtn').classList.contains('dot'), null, 3000)), 'a new tier lights the soft dot');
  ok(await t.waitToast(/^New badge: Walker, (bronze|silver)\.$|new badges/), 'toast "New badge: Walker, ..."');
  await ev(() => { window.__toasts.splice(0); });
  const c3 = await ev(() => {
    const P = window.__paw, B = P.msb, S = P.S, L = S.missions.life, c = S.coins; const shelf0 = B.shelf();
    S.walks = 600; L.harvest = 500; L.cook = 250; L.bath = 250; L.trick = 600; L.fetch = 1200; L.ms = 300; S.dd.wn = 250; S.ph = Object.assign(S.ph || {}, { n: 200 }); L.boards = 16;
    const got = B.check(false), cups = B.cups();
    return { n: got.length, dc: S.coins - c, golds: B.golds(), cups: cups.join(''), titles: ['Trail Pro', 'Green Paws', 'Kennel Chef', 'Bubble Boss', 'Trick Star', 'Fetch Legend', 'Mission Pup', 'Wish Maker', 'Snap Happy', 'Good Neighbour'].filter((x) => !S.titles[x]),
      medal: S.inv.charms.includes(B.medal), pend: B.medalPending, nb: B.tier('neighbour'), count: B.count(), coins: S.coins, shelf0, shelf: B.shelf(), out: !!(S.decor && S.decor['Trophy Shelf'] && S.decor['Trophy Shelf'].out), mpop: S.missions.mpop };
  });
  ok(c3.n >= 30 && c3.dc === 0, c3.n + ' tiers at once, coins unchanged (' + c3.dc + ')');
  ok(c3.golds === 10 && c3.cups === 'cccccccccg', 'ten gold tracks, ten cups on the shelf (nine crayon, Good neighbour gold): ' + c3.cups);
  ok(!c3.titles.length, 'each gold gives its title (titleGive): missing ' + c3.titles.join());
  ok(c3.nb === 'g', 'Good neighbour 16 of 15 boards: gold (life.boards, part D counts it)');
  ok(c3.medal && c3.pend && c3.mpop === 1, 'eight golds: the Crayon Medal charm, its popup waits for a quiet yard (saved: missions.mpop 1)');
  ok(!c3.shelf0 && c3.shelf && c3.out, 'the first gold cup brings the Trophy Shelf, put out in the house');
  ok(await t.waitToast(/new badges\. See them in Missions, under Badges\. New titles: .*Trail Pro/), 'the burst names its titles in its one toast');
  await t.p.waitForTimeout(1300);
  const burst = await ev(() => window.__toasts.filter((x) => /new badges|^New badge|^New title|^A full sticker page|^New sticker/.test(x)));
  ok(burst.length === 1 && /Trophy Shelf/.test(burst[0]), 'a badge burst is one toast (no title, sticker or page toasts of its own), with the shelf: ' + burst.join(' | ').slice(0, 400));
  const calmModals = async () => { await t.p.waitForTimeout(900); for (let i = 0; i < 8 && !(await ev(() => document.getElementById('modal').hidden)); i++) { await t.closeX(); await t.p.waitForTimeout(500); } }; // the silver Bond may bring level-up cards
  await calmModals();
  // the popup waits for a quiet yard: any level-up card (the silver Bond) is closed first, then the yard tick shows it
  ok(await t.until(() => { const m = document.getElementById('modal'); if (document.querySelector('#modal .msb-medalpop #msbWear')) return true; if (!m.hidden) { const x = m.querySelector('.panel .x'); if (x) x.click(); } else window.__paw.msb.medalTick(); return false; }, null, 10000), 'the Crayon Medal popup, with "Wear it"');
  await t.p.click('#msbWear'); await t.modalGone();
  ok(await ev(() => window.__paw.S.outfit.charm === 'Crayon Medal' && !window.__paw.msb.medalPending), 'Wear it: the medal in the charm slot');
  const c4 = await ev(() => { const P = window.__paw, B = P.msb, S = P.S, c = S.coins; S.walks = 5000; const g = B.check(false); return { g: g.length, dc: S.coins - c, medals: S.inv.charms.filter((x) => x === B.medal).length }; });
  ok(c4.g === 0 && c4.dc === 0 && c4.medals === 1, 'nothing new past crayon, one medal only');
  sec('C2. the Badges sticker pages, the neighbour card sticker, the Badges tab');
  const c5 = await ev(() => {
    const P = window.__paw, B = P.msb, S = P.S; B.sync(); const pages = B.ddPages(), defs = P.dd.defs().filter((d) => /^msb_/.test(d.id)), i0 = pages.indexOf('msb1');
    const L = S.missions.life, bo = L.boards; delete S.dd.st.msb_card; L.boards = 2; P.dd.stickers(); const before = !!S.dd.st.msb_card; const wc = S.missions.wk.cards; S.missions.wk.cards = 1; B.card(); S.missions.wk.cards = wc; L.boards = bo;
    return { tail: pages.slice(-3).join(), defs: defs.length, per: [0, 1, 2].map((k) => defs.filter((d) => d.pg === i0 + k).length).join(), before, card: !!S.dd.st.msb_card, walker: !!S.dd.st.msb_walker, coats: !!S.dd.st.msb_coats };
  });
  ok(c5.tail === 'msb1,msb2,msb3' && c5.defs === 18 && c5.per === '6,6,6', 'three Badges pages at the end of the book, 18 stickers, 6 a page: ' + c5.per);
  ok(c5.walker && !c5.coats, 'a bronze tier puts its sticker in, an unearned one does not');
  ok(!c5.before && c5.card, 'Part D: msCardSticker() gives the first neighbour card sticker');
  await calmModals(); await ev(() => window.__paw.ms2.open('badges'));
  ok(await t.until(() => document.querySelectorAll('#modal .ms-pop .msb-row').length === 17, null, 4000), 'the sheet opens on the Badges tab: 17 rows');
  const c6 = await ev(() => { const pan = document.querySelector('#modal .ms-pop'); const fold = pan.querySelector('.msb-fold'); const row = pan.querySelector('.msb-row[data-track="treasure"]');
    return { fold: fold ? fold.querySelectorAll('.msb-row').length : 0, open: pan.querySelectorAll('.msb > .msb-list > .msb-row').length, num: row ? row.querySelector('.msb-num').textContent : '', next: row ? row.querySelector('.msb-next').textContent : '',
      cols: getComputedStyle(pan.querySelector('.msb-list')).gridTemplateColumns.split(' ').length, dot: document.querySelector('#msBtn').classList.contains('dot'), semi: [...pan.querySelectorAll('.msb *')].some((e) => e.children.length === 0 && /;/.test(e.textContent)) }; });
  ok(c6.fold === 10 && c6.open === 7, 'gold and crayon tracks folded at the bottom (' + c6.fold + ' folded, ' + c6.open + ' open)');
  ok(/^0 \/ 5$/.test(c6.num.trim()) && /^Next at 5: a sticker$/.test(c6.next.trim()), 'a row: the bar "0 / 5" and the next reward: ' + c6.num + ' | ' + c6.next);
  ok(c6.cols === 2, 'desktop: two columns');
  ok(!c6.dot && !c6.semi, 'seeing the Badges tab clears the dot, no semicolons');
  await t.SH('badges_desktop');
  await t.closeX(); await t.modalGone();

  sec('D1. the help-wanted board: five notes a Japan week from named neighbours, gated, seeded');
  await calmModals(); await ev(() => { window.__toasts.splice(0); });
  const w1 = await ev(() => {
    const P = window.__paw, W = P.msw, wk = P.S.missions.wk; wk.w = ''; wk.list = []; wk.got = ''; wk.lt = null; wk.seen = '';
    const L = W.list(), ids = L.map((x) => x.id);
    return { pool: W.pool.length, ids, whos: ids.map((id) => W.who(id)), w: wk.w, key: P.ms2.weekKey(), gates: ids.every((id) => W.gate(id)), again: W.list().map((x) => x.id).join(), pick: W.pick(wk.w).join(), fields: ['lt', 'cards', 'cg', 'seen'].every((k) => k in wk) };
  });
  ok(w1.pool >= 13 && w1.ids.length === 5 && new Set(w1.ids).size === 5, `${w1.pool} requests in the pool, five different notes: ` + w1.ids.join());
  ok(w1.whos.every((k) => ['bea', 'pip', 'gerald', 'fair', 'cafe'].includes(k)) && new Set(w1.whos).size >= 4, 'from the named neighbours, one each where they can ask: ' + w1.whos.join());
  ok(w1.w === w1.key && w1.again === w1.ids.join() && w1.pick === w1.ids.join(), 'the board of this Japan week (' + w1.w + '), the same five on a second look and from the seed');
  ok(w1.gates, 'every note can be done now (its gate holds)');
  ok(w1.fields, 'S.missions.wk has the part D fields (lt, cards, cg, seen)');

  sec('D2. Monday 00:00 JST (Sunday 15:00 UTC) with a clock stub');
  const w2 = await ev(() => {
    const P = window.__paw, W = P.msw, wk = P.S.missions.wk, R = Date.now, out = {};
    try {
      Date.now = () => Date.UTC(2026, 10, 15, 14, 59, 0); wk.w = ''; wk.got = ''; out.w1 = (W.list(), wk.w); out.ids1 = wk.list.map((x) => x.id).join(); out.p1 = W.pick('2026-11-09').join();
      Date.now = () => Date.UTC(2026, 10, 15, 14, 59, 59); W.list(); out.still = wk.w;
      Date.now = () => Date.UTC(2026, 10, 15, 15, 0, 0); W.list(); out.w2 = wk.w; out.ids2 = wk.list.map((x) => x.id).join(); out.p2 = W.pick('2026-11-16').join(); out.fresh = wk.list.every((x) => !x.done && !x.p);
    } finally { Date.now = R; }
    wk.w = ''; W.list(); return out;
  });
  ok(w2.w1 === '2026-11-09' && w2.still === '2026-11-09' && w2.ids1 === w2.p1, 'Sunday 23:59 JST: still the board of Monday 9 November');
  ok(w2.w2 === '2026-11-16' && w2.ids2 === w2.p2 && w2.fresh, 'Monday 00:00 JST: the board of the 16th, drawn by its seed (' + w2.ids2 + ')');

  sec('D3. any 3 of 5 fill the board: a stamp, one letter with 50 coins the next morning, life.boards');
  await calmWishes();
  const w3 = await ev(() => {
    const P = window.__paw, W = P.msw, S = P.S, wk = S.missions.wk; window.__msf(['gaze']); P.ms2.force(['h_pet', 'h_water']);
    wk.got = ''; wk.card = 0; wk.lt = null; S.mail = S.mail.filter((x) => !/^msw_/.test(x.id));
    W.force(['w_bath', 'w_walk', 'w_photo', 'w_treasure', 'w_trick']); window.__toasts.splice(0);
    const c = S.coins, b = S.missions.life.boards, out = {};
    P.ms.act('bath', {}); P.ms.act('bath', {}); P.ms.act('treasure', { name: 'x' }); P.ms.act('treasure', { name: 'y' }); P.ms.act('photo', {}); P.ms.act('photo', {});
    out.two = W.done(); out.got0 = wk.got; out.bar = wk.list.find((x) => x.id === 'w_photo').p;
    P.ms.act('photo', {}); out.three = W.done(); out.got = wk.got === wk.w; out.card = wk.card; out.boards = S.missions.life.boards - b; out.dc = S.coins - c;
    out.lt = wk.lt && wk.lt.w === wk.w && wk.lt.ids.length === 3; out.mail = S.mail.filter((x) => /^msw_/.test(x.id)).length;
    P.ms.act('walk', { area: 'park', pack: 1 }); for (let i = 0; i < 8; i++) P.ms.act('trick', { name: 'Sit', place: 'yard', mode: 'lure' });
    out.four = W.done(); out.boards2 = S.missions.life.boards - b; out.card2 = wk.card; out.letterNow = W.letter(false);
    return out;
  });
  ok(w3.two === 2 && !w3.got0 && w3.bar === 2, 'two notes done and a third on its way (2 of 3 photos): not filled yet');
  ok(w3.three === 3 && w3.got && w3.card === 1 && w3.boards === 1, 'the third note fills the board: a stamp on the card (1), life.boards +1');
  ok(w3.dc === 0 && w3.lt && w3.mail === 0, 'no coins at once, the letter waits for the next morning (' + w3.dc + ')');
  ok(w3.four === 4 && w3.boards2 === 1 && w3.card2 === 1 && w3.letterNow === null, 'a fourth note: no second board, no second stamp, no letter the same day');
  ok(await t.waitToast(/^Gerald's board is filled! A stamp on your neighbour card, and a thank-you letter with 50 coins comes tomorrow morning\.$/), 'toast "Gerald\'s board is filled! ..."');
  ok(await t.waitToast(/^A note done for .+: .+\.$|board notes done/), 'note toasts, batched');
  ok(await t.until(() => document.querySelector('#msBtn').classList.contains('dot'), null, 3000), 'the filled board lights the soft dot');
  await ev(() => { window.__paw.S.missions.wk.lt.d = '2020-01-01'; });
  ok(await t.until(() => window.__paw.S.mail.filter((x) => /^msw_/.test(x.id)).length === 1, null, 6000), 'a later morning: the letter arrives in a quiet yard');
  const w4 = await ev(() => { const P = window.__paw, S = P.S, L = S.mail.filter((x) => /^msw_/.test(x.id)), m = L[0]; return { n: L.length, id: m.id, w: S.missions.wk.w, coins: m.gift && m.gift.coins, claimed: !!(m.gift && m.gift.claimed), from: m.from, text: m.text, lt: S.missions.wk.lt, again: P.msw.letter(true) }; });
  ok(w4.n === 1 && w4.id === 'msw_' + w4.w && w4.coins === 50 && !w4.claimed && w4.lt === null && w4.again === null, 'exactly one letter for the board (msw_' + w4.w + '), 50 coins waiting for Collect');
  ok(w4.from === 'Gerald' && /^Thank you for helping out: .+\. .+ 50 coins .+ Your neighbour card has 1 of 4 stamps now\.$/.test(w4.text) && !/;/.test(w4.text), 'the letter: ' + w4.text);
  { const c0 = (await S()).coins; await ev(() => window.__paw.dd.mail()); await t.p.waitForSelector('.panel.mailbox .mb-item[data-mail^="msw_"]'); await t.p.click('.panel.mailbox .mb-item[data-mail^="msw_"]'); await t.p.waitForSelector('.panel.mailbox .mb-item.on[data-mail^="msw_"]'); await t.p.waitForSelector('.panel.mailbox .letter [data-mbget]');
    await t.p.click('.letter [data-mbget]'); await t.p.waitForSelector('.letter .mb-got');
    ok((await S()).coins === c0 + 50, 'Collect: +50 coins, raw (no BOOST), like the daily mission (' + ((await S()).coins - c0) + ')'); await t.closeX(); await t.modalGone(); }

  sec('D4. the neighbour card: four boards give a Boutique outfit not owned, then a Pupcake');
  const w5 = await ev(() => {
    const P = window.__paw, W = P.msw, S = P.S, wk = S.missions.wk, wear = P.dd.wear, out = {};
    S.inv.clothes = S.inv.clothes.filter((n) => n !== wear[0] && n !== wear[1]); wk.cards = 0; wk.card = 3; wk.got = ''; wk.lt = null;
    out.next = W.next(); W.fill(); out.gift = S.inv.clothes.includes(out.next); out.card = wk.card; out.cards = wk.cards; out.cg = wk.cg.n; out.lg = wk.lt && wk.lt.g; out.st = !!S.dd.st.msb_card;
    wear.forEach((n) => { if (!S.inv.clothes.includes(n)) S.inv.clothes.push(n); }); const nc = S.inv.clothes.length, pc = S.inv.food.Pupcake || 0;
    wk.card = 3; wk.got = ''; wk.lt = null; out.next2 = W.next(); W.fill(); out.pup = (S.inv.food.Pupcake || 0) - pc; out.nc = S.inv.clothes.length - nc; out.cards2 = wk.cards; out.cg2 = wk.cg.n; wk.lt = null;
    return out;
  });
  ok(w5.next === (await ev(() => window.__paw.dd.wear[0])) && w5.gift && w5.cg === w5.next && w5.lg === w5.next, 'the 4th stamp: the first Bond 1-2 Boutique outfit not owned (' + w5.next + '), in the Wardrobe');
  ok(w5.card === 0 && w5.cards === 1 && w5.st, 'the card starts again (0 stamps, 1 full card), the first-card sticker is there');
  ok(w5.next2 === '' && w5.pup === 1 && w5.nc === 0 && w5.cards2 === 2 && w5.cg2 === 'Pupcake', 'every outfit owned: a Pupcake instead');
  ok(await t.waitToast(/^A full neighbour card! A gift for .+: the .+\. It is in the Wardrobe\.$/), 'toast "A full neighbour card! ..."');

  sec('D5. a half-done board turns into next week\'s board, nothing lost, no sad words');
  const w6 = await ev(() => {
    const P = window.__paw, W = P.msw, wk = P.S.missions.wk, R = Date.now, out = {};
    try {
      Date.now = () => Date.UTC(2026, 10, 15, 14, 0, 0); wk.w = ''; wk.got = ''; W.list(); W.force(['w_walk', 'w_bath', 'w_photo', 'w_treasure', 'w_trick']);
      wk.list[0].p = 4; wk.list[1].p = 2; wk.list[1].done = '2026-11-15'; out.before = JSON.stringify(wk.list);
      Date.now = () => Date.UTC(2026, 10, 15, 15, 0, 0); W.list(); out.w = wk.w; out.after = JSON.stringify(wk.list); out.html = W.html();
      wk.got = wk.w; Date.now = () => Date.UTC(2026, 10, 22, 15, 0, 0); W.list(); out.w3 = wk.w; out.ids3 = wk.list.map((x) => x.id).join(); out.p3 = W.pick('2026-11-23').join(); out.fresh3 = wk.list.every((x) => !x.done && !x.p);
    } finally { Date.now = R; }
    wk.w = ''; wk.got = ''; W.list(); out.toasts = window.__toasts.join(' | '); return out;
  });
  ok(w6.w === '2026-11-16' && w6.after === w6.before, 'Monday: the same five notes, their progress kept (4 of 6 walks, two baths done)');
  ok(!/\b(lost|expired?|expires|missed|too late|ends|gone|sorry|sad)\b/i.test(w6.html.replace(/<[^>]+>/g, ' ') + ' ' + w6.toasts), 'no loss or expiry words on the board or in the toasts');
  ok(w6.w3 === '2026-11-23' && w6.ids3 === w6.p3 && w6.fresh3, 'after a filled board, the next Monday brings a fresh board');

  sec('D6. the Week tab and the desktop summary');
  await ev(() => { const P = window.__paw, wk = P.S.missions.wk; wk.seen = ''; P.msw.force(['w_bath', 'w_walk', 'w_photo', 'w_treasure', 'w_trick']); wk.list[0].done = P.rh.jst(); wk.list[0].p = 2; wk.list[1].p = 3; P.ms.open(); });
  ok(await t.until(() => !!document.querySelector('#modal .ms-pop .ms-left .msw-sum .msw-go'), null, 4000), 'Today: the board summary under the card (desktop)');
  ok(await ev(() => /^Help-wanted board 1 of 3$/.test(document.querySelector('.msw-sum .msw-sumtxt p').textContent.trim())), 'the summary: "Help-wanted board 1 of 3"');
  await t.p.click('.msw-go');
  ok(await t.until(() => document.querySelectorAll('#modal .ms-tabbody .msw .msw-note').length === 5 && document.querySelector('.ms-tab[data-mstab="week"]').getAttribute('aria-selected') === 'true', null, 3000), '"See the board" opens the Week tab: five pinned notes');
  const w7 = await ev(() => { const pan = document.querySelector('#modal .ms-pop'), n = [...pan.querySelectorAll('.msw-note')];
    return { count: pan.querySelector('.msw-count').textContent.trim(), head: pan.querySelector('.msw-head h3').textContent.trim(), art: !!pan.querySelector('.msw-art svg'), who: n[0].querySelector('.msw-who').textContent.trim(), what: n[1].querySelector('.msw-what').textContent.trim(), num: n[1].querySelector('.msw-num').textContent.trim(), done: n[0].classList.contains('done'),
      bars: n.every((x) => !!x.querySelector('.msw-bar[role="progressbar"]')), card: !!pan.querySelector('.msw-card .msw-spots'), cols: getComputedStyle(pan.querySelector('.msw-notes')).gridTemplateColumns.split(' ').length, semi: [...pan.querySelectorAll('.msw *')].some((e) => e.children.length === 0 && /;/.test(e.textContent)), red: [...pan.querySelectorAll('.msw *')].some((e) => /rgb\(2[0-9]{2}, [0-4]?[0-9], [0-4]?[0-9]\)/.test(getComputedStyle(e).color)) }; });
  ok(w7.count === '1 of 3' && /help-wanted board/.test(w7.head) && w7.art, 'the cork board header and "1 of 3" at the top: ' + w7.head);
  ok(w7.who === 'Baker Bea' && /^Take .+ on 6 walks$/.test(w7.what) && w7.num === '3 / 6' && w7.done && w7.bars, 'a note: who asks, what, a small bar ("3 / 6"), a done note ticked');
  ok(w7.card && w7.cols === 2 && !w7.semi && !w7.red, 'the neighbour card, two columns on desktop, no semicolons, no red numbers');
  await t.SH('week_desktop');
  ok(await ev(() => !window.__paw.msw.dot()), 'seeing the board clears its dot');
  await t.closeX(); await t.modalGone();

  sec('E1. the notebook: one page per day played (clock stub), a skipped day opens only one new page, never more than 14');
  await calmWishes();
  const nbReset = () => ev(() => { const S = window.__paw.S; S.missions.nb = { pages: 0, done: {}, got: [], day: '', p: {}, seen: 0, pop: [], dec: '' }; S.mail = S.mail.filter((x) => x.id !== 'nb_week'); });
  await nbReset();
  const e1 = await ev(() => {
    const P = window.__paw, N = P.msn, nb = () => P.S.missions.nb, R = Date.now, at = (d) => { Date.now = () => Date.UTC(2027, 0, d, 12, 0, 0); N.tick(); return nb().pages; }, out = {};
    try {
      out.fresh = !!P.S.fw.fresh; out.shown0 = N.shown();
      out.d1 = at(10); out.d1b = at(10); out.d2 = at(11); out.d5 = at(14); out.back = at(12);
      for (let d = 15; d < 40; d++) at(d); out.max = nb().pages;
    } finally { Date.now = R; }
    out.tabs = P.ms2.tabs(); out.html = N.html().replace(/<[^>]+>/g, ' ');
    return out;
  });
  ok(e1.fresh && e1.shown0, 'a save that started with Puppy\'s first day (S.fw.fresh) has the notebook');
  ok(e1.d1 === 1 && e1.d1b === 1 && e1.d2 === 2, 'day 1 opens page 1, a second look the same day opens nothing, the next day page 2 (' + [e1.d1, e1.d1b, e1.d2].join() + ')');
  ok(e1.d5 === 3 && e1.back === 3, 'two days skipped: only one new page (3), a clock turned back opens nothing');
  ok(e1.max === 14 && e1.tabs.includes('notebook'), 'never more than 14 pages; the Notebook tab is there: ' + e1.tabs.join());
  ok(!/\b(lost|expired?|expires|missed|too late|streak|gone|sorry|sad)\b/i.test(e1.html), 'no loss, streak or expiry words on the page');

  sec('E2. steps in any order, counted only on open pages; the day 3 gift; Sit three times');
  await nbReset();
  const e2 = await ev(() => {
    const P = window.__paw, N = P.msn, S = P.S, nb = S.missions.nb, out = {}, c0 = S.coins, seeds = (S.inv.seeds && S.inv.seeds.carrot) || 0;
    window.__msf(['gaze']); P.ms2.force(['h_pet', 'h_water']); window.__toasts.splice(0);
    nb.pages = 2; nb.day = '2099-01-01';
    P.ms.act('walk', { area: 'river', pack: 1 }); out.early = (nb.done[3] || []).length; // page 3 is not open yet
    nb.pages = 3;
    P.ms.act('walk', { area: 'river', pack: 1 }); P.ms.act('garden', { what: 'water', plot: 0 }); out.two = (nb.done[3] || []).slice(); out.got2 = nb.got.includes(3);
    P.ms.act('garden', { what: 'plant', crop: 'carrot' }); out.got3 = nb.got.includes(3); out.seeds = ((S.inv.seeds && S.inv.seeds.carrot) || 0) - seeds;
    nb.pages = 5; P.ms.act('trick', { name: 'Sit', place: 'yard', mode: 'lure' }); P.ms.act('trick', { name: 'Sit', place: 'yard', mode: 'lure' }); out.sit2 = (nb.done[5] || []).includes(0); out.p = nb.p['5.0'];
    out.cnt = /2 \/ 3/.test(N.page(5) && N.html().replace(/<[^>]+>/g, ' ')); P.ms.act('trick', { name: 'Paw', place: 'yard', mode: 'lure' }); P.ms.act('trick', { name: 'Sit', place: 'yard', mode: 'lure' }); out.sit3 = (nb.done[5] || []).includes(0);
    out.dc = S.coins - c0; return out;
  });
  ok(e2.early === 0, 'a step on a page that is not open yet does not count');
  ok(e2.two.length === 2 && !e2.got2 && e2.got3, 'the Riverside walk and the watering first, the planting last: page 3 done');
  ok(e2.seeds === 3, 'day 3: 3 Carrot Seeds (' + e2.seeds + ')');
  ok(!e2.sit2 && e2.p === 2 && e2.cnt && e2.sit3, 'Practise Sit three times: 2 / 3 on the page, done on the third Sit (another trick does not count)');
  ok(e2.dc === 0, 'the notebook pays no coins (' + e2.dc + ')');
  ok(await t.waitToast(/^Notebook page done: The veggie patch\. Gerald gives you 3 Carrot Seeds for the veggie patch\.$/), 'toast "Notebook page done: The veggie patch. ..."');

  sec('E3. a locked step reads "Opens at Bond N"; page 1 comes from the first-day guide');
  const e3 = await ev(() => {
    const P = window.__paw, N = P.msn, S = P.S, keep = S.dogs.map((d) => d.bond.level), out = {}, nb = S.missions.nb, kept = JSON.stringify([nb.done, nb.got]);
    S.dogs.forEach((d) => { d.bond.level = 1; }); const g = S.gkEarly; S.gkEarly = false; nb.done[3] = []; nb.got = nb.got.filter((n) => n !== 3);
    try { out.river = N.lock(3, 2); out.cook = N.lock(6, 1); out.tokyo = N.lock(11, 0); out.pool = N.lock(8, 0); N.page(3); out.html = N.html().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); }
    finally { S.dogs.forEach((d, i) => { d.bond.level = keep[i]; }); S.gkEarly = g; const k = JSON.parse(kept); nb.done = k[0]; nb.got = k[1]; }
    out.open = N.lock(3, 2);
    const gd = S.guide; S.guide = { step: 5, fw: 1, done: '2026-11-01' }; N.tick(); out.p1 = S.missions.nb.got.includes(1); S.guide = gd;
    return out;
  });
  ok(e3.river === 2 && e3.cook === 3 && e3.tokyo === 3 && e3.pool === 2 && e3.open === 0, 'locks from the Bond gates: Riverside Trail 2, the kitchen 3, Tokyo 3, the Splash Pool 2; open at Bond 5: ' + JSON.stringify([e3.river, e3.cook, e3.tokyo, e3.pool, e3.open]));
  ok(/Walk the Riverside Trail Opens at Bond 2/.test(e3.html), 'the locked step reads "Opens at Bond 2": ' + e3.html.slice(0, 160));
  ok(e3.p1, 'page 1: the five first-day steps walked with Gerald are done');

  sec('E4. the day 7 and day 14 gifts, once each, with their popups');
  await ev(() => { const P = window.__paw; P.msw.force(['w_bath', 'w_walk', 'w_photo', 'w_treasure', 'w_trick']); P.S.missions.wk.got = ''; P.S.missions.wk.lt = null; P.S.missions.nb.pages = 14; P.go('yard'); });
  await t.calm();
  const e4 = await ev(() => {
    const P = window.__paw, N = P.msn, S = P.S, nb = S.missions.nb, out = {}, c0 = S.coins;
    S.titles = S.titles || {}; delete S.titles[N.title]; S.dd.fr = S.dd.fr.filter((f) => f !== N.frame);
    out.f7 = N.finish(7); out.frame = S.dd.fr.filter((f) => f === N.frame).length; out.letter = S.mail.filter((x) => x.id === 'nb_week').length; out.pop = nb.pop.slice();
    N.finish(7); out.frame2 = S.dd.fr.filter((f) => f === N.frame).length; out.letter2 = S.mail.filter((x) => x.id === 'nb_week').length; out.pop2 = nb.pop.length;
    out.l = (S.mail.find((x) => x.id === 'nb_week') || {}).text; out.dc = S.coins - c0;
    return out;
  });
  ok(e4.f7 && e4.frame === 1 && e4.letter === 1 && e4.pop.join() === '7', 'day 7: the First Week frame (photo mode) and Gerald\'s letter');
  ok(e4.frame2 === 1 && e4.letter2 === 1 && e4.pop2 === 1, 'a second time gives nothing more');
  ok(/^Dear friend, .+\.$/.test(e4.l || '') && !/;/.test(e4.l), 'the letter: ' + e4.l);
  ok(e4.dc === 0, 'no coins with the day 7 gift');
  ok(await t.until(() => !!document.querySelector('#modal .nb-giftpop'), null, 5000), 'the day 7 popup comes up in the quiet yard');
  ok(await ev(() => /^One week together!/.test(document.querySelector('#modal .panel h2').textContent.trim()) && !!document.querySelector('.nb-giftpop .nb-popic svg')), 'the popup: "One week together!" with the frame');
  await t.p.click('#nbPopOk'); await t.modalGone();
  const e5 = await ev(() => {
    const P = window.__paw, N = P.msn, S = P.S, nb = S.missions.nb, wk = S.missions.wk, out = {};
    P.msw.force(['w_bath', 'w_walk', 'w_photo', 'w_treasure', 'w_trick']); wk.got = ''; wk.lt = null;
    P.ms.act('bath', {}); N.tick(); out.one = nb.got.includes(14);
    P.ms.act('bath', {}); P.ms.act('treasure', { name: 'x' }); P.ms.act('treasure', { name: 'y' }); out.rows = P.msw.done();
    out.got = nb.got.includes(14); out.title = !!S.titles[N.title]; out.dec = nb.dec; out.owned = !!(S.decor && S.decor[nb.dec]); out.pop = nb.pop.slice();
    N.finish(14); out.pop2 = nb.pop.length; return out;
  });
  ok(!e5.one && e5.rows === 2 && e5.got, 'day 14: one board row is not enough, two rows of the help-wanted board finish the page');
  ok(e5.title && e5.dec && e5.owned && e5.pop.join() === '14' && e5.pop2 === 1, 'day 14: the title Town Regular and a Bond 1-2 decoration not owned (' + e5.dec + '), once');
  ok(await t.until(() => !!document.querySelector('#modal .nb-giftpop'), null, 5000) && await ev(() => /^Town Regular!/.test(document.querySelector('#modal .panel h2').textContent.trim())), 'the day 14 popup: "Town Regular!"');
  await t.p.click('#nbPopOk'); await t.modalGone();
  ok(await ev(() => window.__paw.S.missions.nb.pop.length === 0 && (window.__paw.msn.popTick(), !document.querySelector('#modal .nb-giftpop'))), 'no popup a second time');

  sec('E5. the 12 Notebook stickers, then the finished notebook moves under Badges');
  const e6 = await ev(() => {
    const P = window.__paw, N = P.msn, S = P.S, out = {};
    N.sync(); P.msb.sync(); const pages = P.msb.ddPages(); out.order = pages.slice(-5).join();
    out.tabsBefore = P.ms2.tabs().includes('notebook');
    for (let n = 1; n <= 14; n++) N.finish(n);
    P.dd.stickers(); const defs = P.dd.defs().filter((d) => /^nb_/.test(d.id)); out.defs = defs.length; out.got = defs.filter((d) => S.dd.st[d.id]).length;
    out.pg = [...new Set(defs.map((d) => d.pg))].map((pg) => pages[pg]).join(); out.labels = defs.map((d) => d.label).slice(0, 2).join(' | ');
    out.shown = N.shown(); out.tabs = P.ms2.tabs(); out.fold = /nb-fold/.test(P.msb.html()); out.doneHtml = /all 14 pages done/.test(N.doneHtml());
    return out;
  });
  ok(e6.order === 'nb1,nb2,msb1,msb2,msb3', 'the two Notebook pages sit just before the Badges pages: ' + e6.order);
  ok(e6.defs === 12 && e6.got === 12 && e6.pg === 'nb1,nb2', '12 Notebook stickers on two pages, all given: ' + e6.labels);
  ok(e6.tabsBefore && !e6.shown && !e6.tabs.includes('notebook'), 'the Notebook tab goes once every page is done: ' + e6.tabs.join());
  ok(e6.fold && e6.doneHtml, 'the finished notebook is folded under Badges');
  await ev(() => { const P = window.__paw; P.ms2.open('badges'); });
  ok(await t.until(() => !!document.querySelector('#modal .ms-pop .nb-fold > summary'), null, 4000), 'Badges shows the notebook fold: ' + await ev(() => [document.getElementById('modal').hidden, (document.querySelector('#modal .panel') || {}).className, window.__paw.ms2.tab(), !!document.querySelector('#modal .msb')].join()));
  await t.p.click('#modal .nb-fold > summary');
  ok(await t.until(() => document.querySelector('#modal .nb-fold').open && !!document.querySelector('#modal .nb-fold .nb-page'), null, 3000), 'opening the fold shows a notebook page');
  await t.closeX(); await t.modalGone();

  sec('E6. the Notebook tab: a page, its lesson and the How to play link');
  await nbReset();
  await ev(() => { const P = window.__paw, nb = P.S.missions.nb; nb.pages = 2; nb.day = '2099-01-01'; nb.seen = 0; P.msn.page(2); P.ms2.open('notebook'); });
  ok(await t.until(() => !!document.querySelector('#modal .ms-pop .nb .nb-page[data-page="2"]'), null, 4000), 'the Notebook tab opens on page 2');
  const e7 = await ev(() => { const pan = document.querySelector('#modal .ms-pop'); return { on: pan.querySelector('.ms-tab[data-mstab="notebook"]').getAttribute('aria-selected'), title: pan.querySelector('.nb-phead h4').textContent.trim(), steps: pan.querySelectorAll('.nb-step').length, lesson: pan.querySelector('.nb-lesson').textContent.trim(), how: pan.querySelector('.nb-how').textContent.trim(), pgn: pan.querySelector('.nb-pgn').textContent.trim(), next: (pan.querySelector('.nb-next') || {}).textContent, semi: [...pan.querySelectorAll('.nb *')].some((e) => e.children.length === 0 && /;/.test(e.textContent)) }; });
  ok(e7.on === 'true' && e7.title === 'Settling in' && e7.steps === 3 && e7.pgn === 'Page 2 of 2', 'page 2 "Settling in": three steps, "Page 2 of 2"');
  ok(/^Gerald says Puppies sleep up to 18 hours a day\. A tired dog is a happy dog\.$/.test(e7.lesson) && !e7.semi, 'Gerald\'s two-sentence lesson: ' + e7.lesson);
  ok(/^How to play: .+/.test(e7.how) && /Page 3 opens on the next day you play\./.test(e7.next || ''), 'the How to play link and the next page line: ' + e7.how);
  ok(await ev(() => !window.__paw.msn.dot()), 'seeing the notebook clears its dot');
  await t.p.click('#modal [data-nbpg="1"]');
  ok(await t.until(() => !!document.querySelector('#modal .nb-page[data-page="1"]'), null, 3000), 'Back flips to page 1');
  await t.p.click('#modal .nb-how');
  ok(await t.until(() => !!document.querySelector('#modal .panel.journal .gd-lesson.nb-hl'), null, 4000), 'the link opens How to play at its lesson');
  await t.closeX(); await t.modalGone();
  await nbReset();

  sec('F1. growing up: the moments of the current stage, a puppy switches at 6 months, an adult skips puppy and young');
  const iso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const f1 = await ev((b) => {
    const P = window.__paw, G = P.msg, S = P.S, d = S.dog, out = {}, born = d.born, c0 = S.coins;
    window.__msf(['gaze']); P.ms2.force(['h_pet', 'h_water']); S.missions.grow = {}; if (S.dd.today) S.dd.today.gu = [];
    const ids = () => [...new DOMParser().parseFromString(G.html(d.id), 'text/html').querySelectorAll('.msg-m')].map((e) => e.dataset.moment).join();
    d.born = b[0]; out.s5 = G.stage(d.id); out.m5 = ids();
    P.ms.act('bath', { ids: [d.id] }); P.ms.act('walk', { area: 'woods', pack: 1, walkers: [d.id] }); P.ms.act('paddle', { name: d.name });
    out.done5 = Object.keys(G.done(d.id)).join(); out.date = G.done(d.id).p_bath === P.rh.jst();
    P.ms.act('walk', { area: 'park', pack: 1, walkers: [d.id] }); out.walk = !!G.done(d.id).p_walk;
    const pg = P.S.dd.today; out.gu = !!(pg && (pg.gu || []).some((x) => x.i === d.id && x.m === 'p_bath')); out.lines = G.lines(Object.assign({}, pg, { id: d.id })).join(' | '); out.diary = P.dd.lines(pg).join(' | ');
    d.born = b[1]; out.s6 = G.stage(d.id); out.m6 = ids();
    P.ms.act('paddle', { name: d.name }); P.ms.act('bath', { ids: [d.id] }); out.y = !!G.done(d.id).y_paddle;
    d.born = b[2]; out.sa = G.stage(d.id); out.ma = ids(); S.missions.grow[d.id] = {};
    P.ms.act('bath', { ids: [d.id] }); P.ms.act('photo', { dogs: 1, how: 'save', names: [d.name] }); P.ms.act('travel', { place: 'cafe' }); G.tick(); out.adult = Object.keys(G.done(d.id)).sort().join();
    out.html = G.html(d.id).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    out.dc = S.coins - c0; d.born = born; return out;
  }, [iso(5), iso(6), iso(30)]);
  ok(f1.s5 === 'puppy' && f1.m5 === 'p_bath,p_ball,p_walk,p_tag', '5 months: the four puppy moments: ' + f1.m5);
  ok(f1.done5 === 'p_bath' && f1.date, 'a bath marks "First bath" with the Japan date; a long walk and a paddle do not count for a puppy');
  ok(f1.walk, 'a short walk (the Sunny Park) is the puppy\'s first walk');
  ok(f1.gu && /^I had my very first bath today\./.test(f1.lines) && /I had my very first bath today\./.test(f1.diary), 'a line on today\'s diary page in the dog\'s voice: ' + f1.lines.split(' | ')[0]);
  ok(f1.s6 === 'young' && f1.m6 === 'y_trick,y_trail,y_paddle,y_photo' && f1.y, '6 months: the young moments, and now a paddle counts: ' + f1.m6);
  ok(f1.sa === 'adult' && f1.ma === 'a_agility,a_bond5,a_pack,a_cafe' && f1.adult === 'a_bond5,a_cafe', 'an adult (adopted grown up) shows only the adult moments, a bath counts nothing (puppy and young skipped): ' + f1.adult);
  ok(/Grown dogs need a walk and play every day\. A busy dog is a calm dog\./.test(f1.html) && /2 of 4 moments/.test(f1.html) && /Marked on /.test(f1.html), 'the stage lesson, "2 of 4 moments", dated marks');
  ok(f1.dc === 0, 'growing up pays no coins (' + f1.dc + ')');

  sec('F2. a moment as the daily wish: now and then, never a done one');
  const f2 = await ev((b) => {
    const P = window.__paw, G = P.msg, S = P.S, d = S.dog, born = d.born, out = { n: 0, bad: 0, ks: {} };
    d.born = b; S.missions.grow[d.id] = { p_bath: '2026-11-01' };
    for (let i = 1; i <= 60; i++) { const day = '2027-02-' + String(1 + (i % 28)).padStart(2, '0') + (i > 28 ? 'b' + i : ''), w = G.wish(d.id, day); if (!w) continue; out.n++; out.ks[w.m] = 1; if (w.m === 'p_bath' || w.m === 'p_tag' || !/^p_/.test(w.m)) out.bad++; }
    let day = ''; for (let i = 1; i < 200 && !day; i++) { const k = '2027-03-x' + i; if (G.wish(d.id, k)) day = k; }
    const mk = P.dd.make(day), gw = G.wish(d.id, day); out.make = mk.gm === gw.m && mk.k === gw.k;
    d.born = born; S.missions.grow[d.id] = {}; return out;
  }, iso(3)); // v2.19.3: a 3-month puppy (under 3 months it can't walk yet, so its wish never asks for the first walk)
  ok(f2.n >= 8 && f2.n <= 35, 'a growing up moment is the wish on some days, not all (' + f2.n + ' of 60)');
  ok(f2.bad === 0 && Object.keys(f2.ks).length >= 2, 'only moments not done yet, that a wish can make come true: ' + Object.keys(f2.ks).join());
  ok(f2.make, 'the daily wish picker takes it (gm on the wish)');
  ok(await ev(() => { const G = window.__paw.msg, d = window.__paw.S.dog, b = d.born, txt = []; [3, 8, 40, 100].forEach((n) => { const x = new Date(); x.setDate(x.getDate() - n); d.born = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; txt.push(G.html(d.id)); }); d.born = b; return txt.every((h) => /msg-m/.test(h)) && !/litter|have puppies|playdate/i.test(txt.join(' ').replace(/<[^>]+>/g, ' ')); }), 'no puppy or litter goal in any stage');

  sec('F3. the strip in Journal > Profile');
  await ev(() => { const P = window.__paw; P.dd.journal('profile'); });
  ok(await t.until(() => !!document.querySelector('#modal .panel.journal .msg .msg-chart svg') && document.querySelectorAll('#modal .panel.journal .msg-m').length === 4, null, 4000), 'the Growing up strip: the height chart and four moments');
  const f3 = await ev(() => { const s = document.querySelector('#modal .msg'), small = []; s.querySelectorAll('*').forEach((e) => { if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || e.closest('svg')) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.className + ':' + fs); }); return { small, h: s.querySelector('h4').textContent.trim(), cols: getComputedStyle(s.querySelector('.msg-list')).gridTemplateColumns.split(' ').length }; });
  ok(f3.h === 'Growing up' && !f3.small.length && f3.cols === 2, 'desktop: "Growing up", two columns, no text under 13 px ' + f3.small.join(' '));
  await t.SH('grow_desktop');
  await t.closeX(); await t.modalGone();

  sec('G1. fix batch: the medal on the dog, the swap and the helps, the pop-up market, the open fold');
  const g1 = await ev(() => {
    const P = window.__paw, S = P.S, keep = S.outfit.charm, norm = (s) => String(s).replace(/(id="|#|href="#)[\w:-]+/g, '$1');
    const art = (c) => { S.outfit.charm = c; const o = P.ms2.outfit(), w = P.ms2.dogOutfit(); return { o, w, svg: norm(window.PawArt.dog(S.dog.key, { pose: 'sit', outfit: o, facing: 'right' })) }; };
    const none = art(null), medal = art('Crayon Medal'), shoe = art('Lucky Horseshoe'); S.outfit.charm = keep;
    return { pass: medal.o.charm === 'Crayon Medal' && medal.w.charm === 'Crayon Medal', medal: !!none.svg && medal.svg !== none.svg, shoe: shoe.svg === none.svg };
  });
  ok(g1.pass && g1.medal && g1.shoe, 'outfitOf hands the charm to the dog art: the Crayon Medal shows on the yard dog, another charm draws nothing (' + JSON.stringify(g1) + ')');
  const g2 = await ev(() => {
    const P = window.__paw, S = P.S; S.missions.swap = ''; window.__msf(['bath']); P.ms2.force(['h_photo', 'h_trick']);
    const a = P.ms2.swapPool(), x = P.ms2.helpX(); P.ms2.force(['h_pet', 'h_water']); const b = P.ms2.swapPool();
    return { x, bad: a.filter((id) => ['photo', 'trick', 'trick_show'].includes(id)), photo: b.includes('photo') };
  });
  ok(!g2.bad.length && g2.photo && g2.x.includes('photo'), 'the mission swap never draws a mission a help stands for (Snap one photo, Practise a trick): ' + JSON.stringify(g2));
  const g3 = await ev(() => { const P = window.__paw, S = P.S, v0 = P.msb.val('places'), pl = P.msb.places(); S.dd.pv.fmarket = 1; const v1 = P.msb.val('places'); delete S.dd.pv.fmarket; return { fm: pl.includes('fmarket'), same: v0 === v1, n: pl.length }; });
  ok(!g3.fm && g3.same && g3.n >= 8, 'Out and about leaves out the festival pop-up market (' + g3.n + ' places)');
  const g4 = await ev(() => { const P = window.__paw, m = P.S.missions, keep = Object.assign({}, m.tr), h0 = P.msb.html(); P.msb.tracks.forEach((id) => { if (!['g', 'c'].includes(m.tr[id])) m.tr[id] = 'g'; }); const h = P.msb.html(); m.tr = keep; return { open: /<details class="msb-fold" open>/.test(h), closed: /<details class="msb-fold">/.test(h0) }; });
  ok(g4.open && g4.closed, 'every track gold or crayon: the fold opens, so the tab is never empty');

  sec('G2. fix batch: the Crayon Medal notice survives a reload; a Monday board lights the dot');
  await ev(() => { const S = window.__paw.S; S.missions.mpop = 1; window.__paw.saveNow(); });
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue', { timeout: 20000 }); await t.ev(() => document.getElementById('tContinue').click()); await t.untilMode('yard');
  await t.until(() => !!(window.__paw && window.__paw.msb && window.__paw.msw), null, 8000);
  ok(await ev(() => window.__paw.msb.medalPending), 'after a reload the Crayon Medal popup is still to come');
  ok(await t.until(() => { const m = document.getElementById('modal'); if (document.querySelector('#modal .msb-medalpop')) return true; if (!m.hidden) { const x = m.querySelector('.panel .x'); if (x) x.click(); } else window.__paw.msb.medalTick(); return false; }, null, 10000), 'it shows in a quiet yard');
  await t.closeX(); await t.modalGone();
  ok(await ev(() => !window.__paw.msb.medalPending && window.__paw.S.missions.mpop === 0), 'shown once: mpop back to 0');
  const g5 = await ev(async () => {
    const P = window.__paw, S = P.S, wk = S.missions.wk, R = Date.now, wait = (ms) => new Promise((r) => setTimeout(r, ms)); P.msw.roll(); wk.seen = wk.w + (wk.got === wk.w ? '+' : '');
    const b = document.getElementById('msBtn'), d0 = P.msw.dot(), w0 = wk.w; // the week's own dot (other news may light the button too)
    try { const t0 = R(); Date.now = () => t0 + 7 * 864e5; let on = false; for (let i = 0; i < 30 && !on; i++) { await wait(100); on = wk.w !== w0 && P.msw.dot() && b.classList.contains('dot'); } return { d0, on, w: wk.w !== w0 }; } finally { Date.now = R; }
  });
  ok(!g5.d0 && g5.w && g5.on, 'a new Monday board lights the soft dot right away (' + JSON.stringify(g5) + ')');
  await ev(() => { const P = window.__paw; P.ms.roll(true); P.ms2.roll(true); P.msw.roll(true); });

  sec('G3. fix batch: a swapped S (an import, a restore, a cloud pull) resets the caches');
  const g6 = await ev(async () => {
    const P = window.__paw, B = P.msb, wait = (ms) => new Promise((r) => setTimeout(r, ms)); B.sync(); P.msn.page(3);
    const pages = B.ddPages(), i0 = pages.indexOf('msb1'), withNb = pages.includes('nb1'), K = pages.indexOf('nb1');
    P.ms2.say('a queued line'); const q0 = P.ms2.queue >= 0;
    const data = JSON.parse(JSON.stringify(P.S)); data.missions.nb = null; data.dd.pg = {}; data.dd.pg[K] = 'Bow Tie';
    const ok = window.__pawCloud.apply(data, null, ''); await wait(400); B.sync();
    return { ok, withNb, K, i0, pg: Object.assign({}, P.S.dd.pg), after: B.ddPages().includes('nb1'), queue: P.ms2.queue, npg: P.msn.pg, q0 };
  });
  ok(g6.ok && g6.withNb && !g6.after, 'the swapped-in save has no notebook: its sticker pages leave the book (' + JSON.stringify(g6) + ')');
  ok(g6.pg[g6.K] === 'Bow Tie' && Object.keys(g6.pg).length === 1, 'its page gifts stay where it saved them (no remap from the old save\'s order)');
  ok(g6.queue === 0 && g6.npg === 0, 'the toast queue and the notebook page start again');

  sec('A4. an old v2.19.2 save loads and backfills, additively (no notebook)');
  const old = await ev(() => {
    const S = JSON.parse(JSON.stringify(window.__paw.S)), m = S.missions;
    ['help', 'pouch', 'life', 'tr', 'trbf', 'mpop', 'wk', 'wkAreas', 'nb', 'grow'].forEach((k) => delete m[k]); if (S.decor) delete S.decor['Trophy Shelf'];
    // part C: the badges' own rewards are taken back out, so the backfill gives them again (the counters stay: walks 5000, photos 200, wishes 250)
    S.inv.charms = S.inv.charms.filter((x) => x !== 'Crayon Medal'); if (S.outfit.charm === 'Crayon Medal') S.outfit.charm = null;
    ['Trail Pro', 'Snap Happy', 'Wish Maker', 'Map Maker'].forEach((x) => { delete S.titles[x]; }); if (S.title && !S.titles[S.title]) S.title = '';
    Object.keys(S.dd.st || {}).forEach((k) => { if (/^msb_/.test(k)) delete S.dd.st[k]; }); S.mail = (S.mail || []).filter((x) => x.id !== 'msb_backfill');
    window.__oldCoins = S.coins; window.__oldBond = S.bond.pts;
    // counters the save already knows, enough for eight golds: walks, photos, wishes (above), and routes, places, treasures, agility, the Fun Fair
    window.__paw.msb.places().concat(['park', 'river', 'woods', 'beach', 'sunflower', 'bamboo', 'cliffs']).forEach((k) => { S.dd.pv[k] = 1; });
    for (let i = 0; i < 25; i++) S.found['T' + i] = 1; S.dd.cnt.ag = 300; S.ff = S.ff || {}; S.ff.n = Object.assign(S.ff.n || {}, { catch: 500 });
    m.stamps = 3; m.cards = 2; S.recipes = Object.assign(S.recipes || {}, { best: { a: 1, b: 2, c: 1, d: 3 } }); S.garden.harvests = { carrot: 5, peas: 2 };
    S.dd.wk = { bath: 2, trick: 3, ball: 4 }; S.bl = Object.assign(S.bl || {}, { n: 6 }); S.dog.tricks = { Sit: { p: 1, shows: 5 }, Paw: { p: 0.5, shows: 1 } };
    (S.dogs || []).forEach((d, i) => { if (i === 0) d.tricks = S.dog.tricks; });
    return JSON.stringify(S);
  });
  const oldMeta = await ev(() => ({ coins: window.__oldCoins, bond: window.__oldBond }));
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: old }, prefs: { msTest: true, ddTest: true, ms2Test: true } }); await p2.goto(require('./test_lib').URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  await t.untilMode('yard'); await t.until(() => !!document.querySelector('#msBtn:not([hidden])') && !!(window.__paw && window.__paw.ms2), null, 8000);
  const o2 = await t.ev(() => { const S = window.__paw.S, m = S.missions; window.__paw.ms2.helps(); return { v: S.v, life: m.life, nb: m.nb, help: m.help.list.length, keys: Object.keys(m).join(' '), stamps: m.stamps, cards: m.cards }; });
  ok(o2.v === 1 && o2.stamps === 3 && o2.cards === 2, 'the old save loads, S.v 1, stamps and cards kept');
  ok(o2.life.ms === 17 && o2.life.cook === 4 && o2.life.harvest === 7 && o2.life.bath === 2 && o2.life.trick === 9 && o2.life.fetch === 10 && o2.life.help === 0 && o2.life.boards === 0 && o2.life.bf === 1, 'life backfilled: missions 3 + 7 x 2, 4 dishes, 7 harvests, 2 baths, 6 shows + 3 trick wishes, 6 balls + 4 ball wishes: ' + JSON.stringify(o2.life));
  ok(o2.nb === null && o2.help === 2, 'no notebook for an old save (nb null), two helps today: ' + o2.keys);
  const bf2 = await t.ev(() => { const P = window.__paw, L = P.S.missions.life; L.cook = 50; P.ms2.fields(); P.ms2.backfill(); return L.cook; });
  ok(bf2 === 50, 'the backfill never lowers a counter');
  sec('C3. the old save gets its earned badges quietly, and one letter');
  ok(await t.until(() => window.__paw.S.missions.trbf === 1, null, 9000), 'the first look gives the earned badges (trbf 1)');
  await t.p.waitForTimeout(1200);
  const c7 = await t.ev(() => { const P = window.__paw, B = P.msb, S = P.S; return { walker: B.tier('walker'), photo: B.tier('photo'), wish: B.tier('wish'), titles: ['Trail Pro', 'Snap Happy', 'Wish Maker'].filter((x) => S.titles[x]).length, toasts: window.__toasts.filter((x) => /New badge|new badges|New title/.test(x)), letters: S.mail.filter((x) => x.id === 'msb_backfill'), coins: S.coins, bond: S.bond.pts, count: B.count(), medal: S.inv.charms.includes(B.medal), pend: B.medalPending, st: !!S.dd.st.msb_walker, golds: B.golds(), pop: !!document.querySelector('.msb-medalpop') }; });
  ok(c7.walker === 'c' && c7.photo === 'c' && c7.wish === 'c' && c7.titles === 3 && c7.st, 'walks, photos and wishes: crayon at once, with their titles and stickers');
  ok(!c7.toasts.length, 'no badge or title toasts for the backfill: ' + c7.toasts.join(' | '));
  ok(c7.letters.length === 1 && new RegExp('^You already earned ' + c7.count + ' badges').test(c7.letters[0].text), 'one letter: ' + (c7.letters[0] || {}).text);
  ok(c7.coins === oldMeta.coins && c7.bond === oldMeta.bond, 'no coins and no Bond from the backfill (' + (c7.coins - oldMeta.coins) + ', ' + (c7.bond - oldMeta.bond) + ')');
  ok(c7.golds >= 8 && c7.medal && !c7.pend && !c7.pop, 'eight golds or more (' + c7.golds + '): the Crayon Medal comes quietly, no popup');
  const c8 = await t.ev(() => { const P = window.__paw; P.msb.check(false); return P.S.mail.filter((x) => x.id === 'msb_backfill').length; });
  ok(c8 === 1, 'a second look sends no second letter');
  const c9 = await t.ev(() => { const S = window.__paw.S, L = S.mail.find((x) => x.id === 'msb_backfill'); return { shelf: !!(S.decor && S.decor['Trophy Shelf'] && S.decor['Trophy Shelf'].out), text: L ? L.text : '', toasts: window.__toasts.filter((x) => /Trophy Shelf|New for the house/.test(x)) }; });
  ok(c9.shelf && /Trophy Shelf is already in the house/.test(c9.text) && !c9.toasts.length, 'an old save with golds gets the Trophy Shelf silently, the letter names it');
  const e9 = await t.ev(() => { const P = window.__paw; P.msb.sync(); return { nb: P.S.missions.nb, shown: P.msn.shown(), tabs: P.ms2.tabs(), pages: P.msb.ddPages().filter((k) => /^nb/.test(k)).length, html: P.msn.doneHtml() }; });
  ok(e9.nb === null && !e9.shown && !e9.tabs.includes('notebook') && e9.pages === 0 && e9.html === '', 'an old save: no notebook, no Notebook tab, no Notebook sticker pages, nothing under Badges: ' + e9.tabs.join());

  sec('B7. phones: 390 and 360 wide, no text under 13 px, 44 px taps, no sideways scroll');
  await t.ctx.close();
  for (const [w, h] of [[390, 844], [360, 740]]) {
    await t.mk({ device: 'iPhone 15', prefs: { msTest: true, ms2Test: true } }); await t.p.setViewportSize({ width: w, height: h });
    await t.p.goto(require('./test_lib').URL); await t.p.waitForSelector('#tNew, #tContinue'); await t.adopt({}); await t.calm();
    await t.until(() => !!(window.__paw && window.__paw.ms2), null, 6000);
    await t.ev(() => { const P = window.__paw; P.S.missions.swap = ''; P.S.missions.stamps = 0; P.ms.force(['bath']); P.ms2.force(['h_pet', 'h_water']); P.ms.open(); });
    await t.until(() => !!document.querySelector('#modal:not([hidden]) .ms-pop .ms-tabs'), null, 4000);
    const ph = await t.ev(() => {
      const pan = document.querySelector('#modal .panel.ms-pop'), body = pan.querySelector('.panel-body') || pan, small = [];
      pan.querySelectorAll('*').forEach((e) => { if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return; const r = e.getBoundingClientRect(); if (!r.width || e.closest('.ms-list, svg')) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.className + ':' + fs); });
      const taps = [...pan.querySelectorAll('.ms-tab, .ms2-swap, #msSwap')].map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); });
      return { phone: document.documentElement.dataset.layout, small, taps, over: body.scrollWidth - body.clientWidth, wide: document.documentElement.scrollWidth - innerWidth, tabs: [...pan.querySelectorAll('.ms-tab')].map((b) => Math.round(b.getBoundingClientRect().height)) };
    });
    ok(ph.phone === 'phone', `${w}: the phone layout`);
    ok(!ph.small.length, `${w}: no text under 13 px ` + ph.small.slice(0, 4).join(' '));
    ok(ph.taps.length >= 6 && ph.taps.every((x) => x >= 43.5), `${w}: tabs and Swap pills are 44 px or more: ` + ph.taps.map(Math.round).join());
    ok(ph.over <= 1 && ph.wide <= 1, `${w}: no sideways scroll (${ph.over}, ${ph.wide})`);
    await t.SH('phone_' + w);
    // part C: the Badges tab at this width (some tracks gold, so the fold shows too)
    await t.ev(() => { const P = window.__paw, S = P.S; S.walks = 250; if (S.dd) S.dd.wn = 80; S.missions.life.ms = 40; P.msb.check(true); P.ms2.tab('badges'); });
    await t.until(() => document.querySelectorAll('#modal .ms-pop .msb-row').length === 17, null, 4000);
    await t.ev(() => { const d = document.querySelector('#modal .ms-pop .msb-fold'); if (d) d.open = true; });
    const pb = await t.ev(() => {
      const pan = document.querySelector('#modal .panel.ms-pop'), body = pan.querySelector('.panel-body') || pan, small = [];
      pan.querySelectorAll('.msb *').forEach((e) => { if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return; const r = e.getBoundingClientRect(); if (!r.width || e.closest('svg')) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.className + ':' + fs); });
      const sum = pan.querySelector('.msb-fold > summary'), sr = sum ? sum.getBoundingClientRect() : { height: 0 };
      return { small, sum: sr.height, over: body.scrollWidth - body.clientWidth, wide: document.documentElement.scrollWidth - innerWidth, cols: getComputedStyle(pan.querySelector('.msb-list')).gridTemplateColumns.split(' ').length };
    });
    ok(!pb.small.length && pb.cols === 1, `${w}: Badges in one column, no text under 13 px ` + pb.small.slice(0, 4).join(' '));
    ok(pb.sum >= 44 && pb.over <= 1 && pb.wide <= 1, `${w}: the fold is a 44 px tap, no sideways scroll (${Math.round(pb.sum)}, ${pb.over}, ${pb.wide})`);
    await t.SH('phone_badges_' + w);
    // part D: a brand-new save (Bond 1) only gets notes it can do, then the Week tab at this width
    const pw = await t.ev(() => { const P = window.__paw, ids = P.msw.list().map((x) => x.id); return { ids, gates: ids.every((id) => P.msw.gate(id)), bond: P.S.bond.level }; });
    ok(pw.ids.length === 5 && pw.gates && !pw.ids.some((id) => ['w_routes', 'w_pool', 'w_cook', 'w_harvest', 'w_water', 'w_jobs'].includes(id)), `${w}: a new save (Bond ${pw.bond}) gets five notes it can do, none for a locked place: ` + pw.ids.join());
    await t.ev(() => { const P = window.__paw; P.msw.force(['w_walk', 'w_bath', 'w_photo', 'w_treasure', 'w_trick']); P.S.missions.wk.list[0].p = 2; P.S.missions.wk.list[1].p = 2; P.S.missions.wk.list[1].done = P.rh.jst(); P.ms2.tab('week'); });
    await t.until(() => document.querySelectorAll('#modal .ms-pop .msw-note').length === 5, null, 4000);
    const pwk = await t.ev(() => {
      const pan = document.querySelector('#modal .panel.ms-pop'), body = pan.querySelector('.panel-body') || pan, small = [], br = body.getBoundingClientRect();
      pan.querySelectorAll('.msw *').forEach((e) => { if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return; const r = e.getBoundingClientRect(); if (!r.width || e.closest('svg')) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.className + ':' + fs); });
      const notes = [...pan.querySelectorAll('.msw-note')].map((e) => e.getBoundingClientRect()), taps = [...pan.querySelectorAll('.ms-tab')].map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); });
      return { small, taps, over: body.scrollWidth - body.clientWidth, wide: document.documentElement.scrollWidth - innerWidth, cols: getComputedStyle(pan.querySelector('.msw-notes')).gridTemplateColumns.split(' ').length, inside: notes.every((r) => r.left >= br.left - 1 && r.right <= br.right + 1), stacked: notes.every((r, i) => !i || r.top >= notes[i - 1].bottom - 1), count: pan.querySelector('.msw-count').textContent.trim(), sum: !!pan.querySelector('.msw-sum') };
    });
    ok(pwk.cols === 1 && pwk.stacked && pwk.inside, `${w}: the board is five pinned notes in one column, inside the sheet`);
    ok(!pwk.small.length && pwk.taps.every((x) => x >= 43.5), `${w}: Week: no text under 13 px, tabs 44 px ` + pwk.small.slice(0, 4).join(' '));
    ok(pwk.over <= 1 && pwk.wide <= 1 && pwk.count === '1 of 3', `${w}: Week: no sideways scroll (${pwk.over}, ${pwk.wide}), "1 of 3" at the top`);
    await t.SH('phone_week_' + w);
    // part E: the Notebook tab at this width (a new save: page 3 open, a locked step)
    await t.ev(() => { const P = window.__paw, nb = P.S.missions.nb; nb.pages = 3; nb.day = '2099-01-01'; P.msn.page(3); P.ms2.tab('notebook'); });
    await t.until(() => !!document.querySelector('#modal .ms-pop .nb .nb-page[data-page="3"]'), null, 4000);
    const pnb = await t.ev(() => {
      const pan = document.querySelector('#modal .panel.ms-pop'), body = pan.querySelector('.panel-body') || pan, small = [];
      pan.querySelectorAll('.nb *').forEach((e) => { if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return; const r = e.getBoundingClientRect(); if (!r.width || e.closest('svg')) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.className + ':' + fs); });
      const taps = [...pan.querySelectorAll('.nb-flip .btn, .nb-how, .ms-tab')].map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); });
      return { small, taps, over: body.scrollWidth - body.clientWidth, wide: document.documentElement.scrollWidth - innerWidth, lock: [...pan.querySelectorAll('.nb-lock')].map((e) => e.textContent.trim()).join(), tabs: pan.querySelectorAll('.ms-tab').length };
    });
    ok(pnb.tabs === 4 && !pnb.small.length && pnb.taps.every((x) => x >= 43.5), `${w}: Notebook: four tabs, no text under 13 px, 44 px taps ` + pnb.small.slice(0, 4).join(' ') + ' ' + pnb.taps.map(Math.round).join());
    ok(pnb.over <= 1 && pnb.wide <= 1 && /Opens at Bond 2/.test(pnb.lock), `${w}: Notebook: no sideways scroll (${pnb.over}, ${pnb.wide}), a locked step at Bond 1: ` + pnb.lock);
    await t.SH('phone_notebook_' + w);
    // part F: the Growing up strip in Journal > Profile at this width
    await t.closeX(); await t.modalGone(); await t.ev(() => window.__paw.dd.journal('profile'));
    await t.until(() => document.querySelectorAll('#modal .panel.journal .msg-m').length === 4, null, 4000);
    const pgr = await t.ev(() => {
      const pan = document.querySelector('#modal .panel.journal'), body = pan.querySelector('.panel-body') || pan, s = pan.querySelector('.msg'), small = [], br = body.getBoundingClientRect(), sr = s.getBoundingClientRect();
      s.querySelectorAll('*').forEach((e) => { if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || e.closest('svg')) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13) small.push(e.className + ':' + fs); });
      return { small, cols: getComputedStyle(s.querySelector('.msg-list')).gridTemplateColumns.split(' ').length, inside: sr.left >= br.left - 1 && sr.right <= br.right + 1, over: body.scrollWidth - body.clientWidth, wide: document.documentElement.scrollWidth - innerWidth };
    });
    ok(pgr.cols === 1 && pgr.inside && !pgr.small.length, `${w}: Growing up: one column inside the Journal, no text under 13 px ` + pgr.small.slice(0, 4).join(' '));
    ok(pgr.over <= 1 && pgr.wide <= 1, `${w}: Growing up: no sideways scroll (${pgr.over}, ${pgr.wide})`);
    await t.SH('phone_grow_' + w);
    await t.closeX(); await t.modalGone();
    if (w === 390) { // the same five after a reload, with their progress
      const before = await t.ev(() => { window.__paw.saveNow(); return JSON.stringify(window.__paw.S.missions.wk.list); });
      await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue', { timeout: 20000 }); await t.ev(() => document.getElementById('tContinue').click()); await t.untilMode('yard');
      await t.until(() => !!(window.__paw && window.__paw.msw), null, 8000);
      const after = await t.ev(() => JSON.stringify(window.__paw.msw.list()));
      ok(after === before, '390: the same five notes after a reload, progress kept');
    }
    await t.ctx.close();
  }

  sec('L1. the launch switch: MS2_LIVE off, no test flag: exactly the v2.19.2 missions');
  await t.newGame({ sex: 'girl', prefs: { msTest: true, ddTest: true } }, { bond: { level: 5, pts: 900 }, coins: 1000, stats: { hunger: 80, happy: 70, energy: 90, clean: 90 } });
  await t.home('yard'); await t.freezeMotion(true);
  await t.until(() => !!(window.__paw && window.__paw.ms && window.__paw.ms2 && window.__paw.msb && window.__paw.msn && window.__paw.msg && window.__paw.nw), null, 8000);
  await calmWishes(); await ev(() => { window.__msf = (ids) => { const P = window.__paw; P.S.missions.stamps = 0; return P.ms.force(ids); }; });
  const NINE = ['walk_fresh', 'walk_dressed', 'pack_walk', 'cook_new', 'decorate', 'cafe', 'trick_show', 'wish', 'friend_yard'];
  const L0 = await ev(() => { const P = window.__paw, m = P.S.missions; return { live: P.ms2.live(), on: P.ms2.on(), flag: P.ms2.pagesFlag(), trbf: m.trbf, on2: m.on2, life: !!(m.life && m.life.bf === 1), nb: !!m.nb }; });
  ok(L0.live === false && L0.on === false, 'off by default: MS2_LIVE false, no flag, no prefs.ms2Test');
  ok(L0.flag && L0.flag.off === false && L0.flag.on === true, 'window.__ddMs2Test alone turns it on (the Pages test copy): ' + JSON.stringify(L0.flag));
  ok(L0.life && L0.nb && L0.trbf === 0 && L0.on2 === 0, 'the save fields are still made (life, nb), quietly: trbf 0 and on2 0 until it turns on');
  await ev(() => { window.__toasts.splice(0); window.__paw.ms.open(); });
  await t.until(() => !!document.querySelector('#modal .panel.ms-pop .ms-list'), null, 4000);
  const L1 = await ev(() => { const M = document.querySelector('#modal .panel.ms-pop'), h = M.querySelector('h2, h3'); return { tabs: M.querySelectorAll('.ms-tab, .ms-tabs, .ms-sheet').length, rows: M.querySelectorAll('.ms-list li').length, helps: M.querySelectorAll('.ms2-helps, .ms2-h, .ms2-pouch, .ms2-swap, .msw-sum, .ms-left').length, title: h ? h.textContent.trim() : '', swap: (M.querySelector('#msSwap') || {}).textContent || '', note: (M.querySelector('.ms-swapline .small') || {}).textContent || '' }; });
  ok(L1.tabs === 0 && L1.rows === 1 && L1.helps === 0, `the sheet: no tabs, one mission, no little helps, pouch or board (${L1.tabs}, ${L1.rows}, ${L1.helps})`);
  ok(/Daily missions/.test(L1.title) && (L1.swap === '' || (L1.swap === 'Swap it' && L1.note === 'One free swap a day.')), `the v2.19.2 title and swap line: "${L1.title}", "${L1.swap}", "${L1.note}"`);
  await t.closeX();
  const L2 = await ev(() => {
    const P = window.__paw, S = P.S, m = S.missions, c = S.coins, h0 = m.life.harvest, hp0 = m.life.help;
    window.__msf(['gaze']); ['pet', 'water', 'nap', 'scoop', 'photo'].forEach((k) => P.ms.act(k, { name: 'Fresh Water' })); P.ms.act('garden', { what: 'harvest', crop: 'carrot' });
    return { dc: S.coins - c, help: m.help.list.length, hp: m.life.help - hp0, harvest: m.life.harvest - h0, pouch: m.pouch.day, dot: document.querySelector('#msBtn').classList.contains('dot'), tabs: P.ms2.tabs().length };
  });
  ok(L2.help === 0 && L2.hp === 0 && L2.pouch === '' && L2.dc === 0, 'no little helps and no pouch: the help list stays empty, life.help 0, +0 coins: ' + JSON.stringify(L2));
  ok(L2.harvest === 1, 'the lifetime counters still count, silently (a harvest: +1)');
  await t.p.waitForTimeout(900);
  ok(!L2.dot && !(await ev(() => document.querySelector('#msBtn').classList.contains('dot'))) && !(await ev(() => window.__toasts.some((x) => /little help|treat pouch|badge/i.test(x)))), 'no soft dot, no help, pouch or badge toasts');
  const L3 = await ev((nine) => {
    const P = window.__paw, off = P.ms.eligible(), soff = P.ms2.swapPool(), days = [];
    for (let i = 1; i <= 60; i++) days.push(P.ms.pick('2026-0' + (1 + (i % 9)) + '-' + String(1 + (i % 28)).padStart(2, '0')).map((x) => x.id).join());
    P.ms2.test(true); const on = P.ms.eligible(); P.ms2.test(false);
    return { off, on, soff, days, bad: off.concat(soff).filter((x) => nine.includes(x)), drawn: days.filter((d) => nine.includes(d)) };
  }, NINE);
  ok(L3.bad.length === 0 && L3.drawn.length === 0, 'none of the nine new story missions in the draw or the swap (60 days): ' + L3.bad.concat(L3.drawn).join());
  ok(L3.off.join() === L3.on.filter((x) => !NINE.includes(x)).join() && L3.on.length > L3.off.length, `the draw is v2.19.2's: the eligible list off is the list on without the nine (${L3.off.length} of ${L3.on.length})`);
  const L4 = await ev(() => {
    const P = window.__paw, S = P.S, R = Date.now, out = {};
    try { Date.now = () => Date.UTC(2026, 11, 20, 3); out.due = P.nw.v220Due(); out.list = P.nw.list(); } finally { Date.now = R; }
    S.walks = 60; S.ph = Object.assign(S.ph || {}, { n: 20 }); out.bond = S.bond.pts; out.coins = S.coins;
    out.got = P.msb.check(false).length; out.tr = Object.keys(S.missions.tr).length; out.letter = (S.mail || []).filter((x) => x.id === 'msb_backfill').length;
    out.pages = P.msb.ddPages().filter((k) => /^(msb|nb)\d/.test(k)).length; out.shelf = P.msb.shelf(); out.medal = S.inv.charms.includes(P.msb.medal);
    out.nb = P.msn.shown(); out.nbTick = P.msn.tick(); out.grow = P.msg.html(); out.week = S.missions.wk.w;
    const d = document.createElement('div'); d.innerHTML = P.ms2.howto(); const l = d.querySelector('.gd-lesson[data-lesson="missions"]'); out.lesson = l ? l.textContent : '';
    return out;
  });
  ok(L4.due === false && !L4.list.includes('2.20'), 'no What\'s new entry for v2.20, even after its date: ' + L4.list.join());
  ok(L4.got === 0 && L4.tr === 0 && L4.letter === 0 && !L4.shelf && !L4.medal, 'no badge checks: no tiers, no letter, no Trophy Shelf, no Crayon Medal (walks 60, photos 20)');
  ok(L4.pages === 0, 'no Badges or Notebook sticker pages in the book');
  ok(!L4.nb && !L4.nbTick && L4.grow === '' && L4.week === '', 'no notebook, no Growing up strip, no help-wanted board');
  ok(/^Daily missions/.test(L4.lesson) && /One little mission a day: 40 coins/.test(L4.lesson) && !/little helps/.test(L4.lesson), 'How to play keeps the v2.19.2 missions lesson: ' + L4.lesson.slice(0, 60));
  await t.p.waitForTimeout(3300); // the badge (3 s) and week (2 s) ticks run while off
  ok(await ev(() => Object.keys(window.__paw.S.missions.tr).length === 0 && window.__paw.S.missions.wk.w === ''), 'the ticks stay quiet while off');

  sec('L2. turning it on later: the badges earned meanwhile come quietly, with one letter');
  await ev(() => { window.__toasts.splice(0); window.__paw.ms2.test(true); window.__paw.ms.fields(); });
  ok(await t.until(() => window.__paw.S.missions.trbf === 1, null, 9000), 'the first look while on gives the earned badges (trbf 1)');
  await t.p.waitForTimeout(1200);
  const L5 = await ev((b) => { const P = window.__paw, S = P.S; return { on2: S.missions.on2, walker: P.msb.tier('walker'), photo: P.msb.tier('photo'), n: P.msb.count(), bond: S.bond.pts - b.bond, coins: S.coins - b.coins, letters: S.mail.filter((x) => x.id === 'msb_backfill').map((x) => x.text), toasts: window.__toasts.filter((x) => /New badge|new badges|New title/.test(x)) }; }, { bond: L4.bond, coins: L4.coins });
  ok(L5.on2 === 1 && L5.walker === 's' && L5.photo === 's' && L5.n >= 4, 'walker and photographer silver (' + L5.n + ' badges in all): ' + JSON.stringify(L5));
  ok(!L5.toasts.length && L5.bond === 0 && L5.coins === 0, 'no burst: no badge toasts, no silver Bond, no coins (' + L5.toasts.join(' | ') + ')');
  ok(L5.letters.length === 1 && new RegExp('^You already earned ' + L5.n + ' badges').test(L5.letters[0]), 'one letter: ' + (L5.letters[0] || ''));
  ok(await ev(() => { const P = window.__paw; P.msb.check(false); return P.S.mail.filter((x) => x.id === 'msb_backfill').length; }) === 1, 'a second look sends no second letter');
  await ev(() => window.__paw.ms.open()); await t.until(() => !!document.querySelector('#modal .panel.ms-pop .ms-tab'), null, 4000);
  ok(await ev(() => document.querySelectorAll('#modal .panel.ms-pop .ms-tab').length >= 3 && document.querySelectorAll('#modal .ms2-h').length === 2), 'on: the sheet has its tabs and two little helps');
  await t.closeX();

  sec('L3. the GitHub Pages test copy has window.__ddMs2Test, the itch.io / play copy never');
  {
    const path = require('path'), fs = require('fs'), cp = require('child_process'), os = require('os'), root = path.join(__dirname, '..');
    const outA = fs.mkdtempSync(path.join(os.tmpdir(), 'ddpages-')), outB = fs.mkdtempSync(path.join(os.tmpdir(), 'dditch-'));
    let a = '', b = '';
    try {
      cp.execFileSync('node', [path.join(root, 'tools', 'pages.js'), '--single', '--no-minify', '--out', outA], { stdio: 'ignore' }); a = fs.readFileSync(path.join(outA, 'index.html'), 'utf8');
      cp.execFileSync('node', [path.join(root, 'tools', 'pages.js'), '--single', '--no-minify', '--itch', '--out', outB], { stdio: 'ignore' }); b = fs.readFileSync(path.join(outB, 'index.html'), 'utf8');
    } catch (e) { /* the asserts say it */ }
    const flag = '<script>window.__ddMs2Test=1</script>', at = a.indexOf(flag);
    ok(at > 0 && a.indexOf('<script', at + flag.length) > at && a.indexOf('<body>') < at, 'the Pages copy sets window.__ddMs2Test before the game scripts');
    ok(b.length > 100000 && !b.includes(flag), 'the itch.io / play copy (pages.js --itch) has no Missions v2 test flag');
    ok(/__ddMs2Test=1/.test(fs.readFileSync(path.join(root, 'tools', 'itch.js'), 'utf8')), 'tools/itch.js refuses a copy with the flag');
    fs.rmSync(outA, { recursive: true, force: true }); fs.rmSync(outB, { recursive: true, force: true });
  }
  ok(errs().length === 0, 'no console errors ' + errs().slice(0, 3).join(' | '));
}, { prefs: { msTest: true, ddTest: true, ms2Test: true } });
