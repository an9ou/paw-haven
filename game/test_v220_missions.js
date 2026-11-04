// v2.20 "Missions v2" (V220.md, docs/design/missions-v2.md): part A (save fields, the backfill of old saves, the counters, the new act data)
// and part B (Today: one story mission and two little helps a Japan day, no coins for helps, Gerald's treat pouch once a Japan day, the free
// swap on any one row, the tab strip), part C (Badges: 17 tracks, tiers from the counters, cosmetics only, the Badges sticker pages, the Crayon
// Medal, an old save's quiet backfill and its one letter). Later parts (D Week, E Notebook, F Growing up) add their sections below.
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

  sec('B6. the tab strip: Today, Week, Badges (Notebook later), crayon pills of 44 px');
  await ev(() => window.__paw.ms.open());
  await t.until(() => !!document.querySelector('#modal .ms-pop .ms-tabs'), null, 4000);
  const tb = await ev(() => ({ tabs: [...document.querySelectorAll('#modal .ms-tab')].map((b) => b.dataset.mstab + ':' + b.getAttribute('aria-selected')), hs: [...document.querySelectorAll('#modal .ms-tab')].map((b) => b.getBoundingClientRect().height), body: !!document.querySelector('#modal .ms-tabbody .ms-body'), title: (document.querySelector('#modal .panel h2') || {}).textContent || '', helps: document.querySelectorAll('#modal .ms2-helps li').length, pouch: !!document.querySelector('#modal .ms2-pouch'), li: document.querySelectorAll('#modal .ms-pop .ms-list li').length }));
  ok(tb.tabs.join() === 'today:true,week:false,badges:false' && tb.hs.every((h) => h >= 44), 'three tabs, Today open, each 44 px or more: ' + tb.tabs.join() + ' ' + tb.hs.map(Math.round).join());
  ok(tb.body && tb.helps === 2 && tb.pouch && tb.li === 1, 'Today: the clipboard (one story row), two help rows, the pouch line');
  await t.p.click('.ms-tab[data-mstab="week"]');
  ok(await t.until(() => /help-wanted board/.test((document.querySelector('#modal .ms-tabbody') || {}).textContent || '') && document.querySelector('.ms-tab[data-mstab="week"]').getAttribute('aria-selected') === 'true', null, 3000), 'Week: a placeholder until part D');
  await t.p.click('.ms-tab[data-mstab="badges"]');
  ok(await t.until(() => document.querySelectorAll('#modal .ms-tabbody .msb .msb-row').length === 17, null, 3000), 'Badges: the 17 badge rows (part C)');
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
  const c3 = await ev(() => {
    const P = window.__paw, B = P.msb, S = P.S, L = S.missions.life, c = S.coins;
    S.walks = 600; L.harvest = 500; L.cook = 250; L.bath = 250; L.trick = 600; L.fetch = 1200; L.ms = 300; S.dd.wn = 250; S.ph = Object.assign(S.ph || {}, { n: 200 }); L.boards = 16;
    const got = B.check(false), cups = B.cups();
    return { n: got.length, dc: S.coins - c, golds: B.golds(), cups: cups.join(''), titles: ['Trail Pro', 'Green Paws', 'Kennel Chef', 'Bubble Boss', 'Trick Star', 'Fetch Legend', 'Mission Pup', 'Wish Maker', 'Snap Happy', 'Good Neighbour'].filter((x) => !S.titles[x]),
      medal: S.inv.charms.includes(B.medal), pend: B.medalPending, nb: B.tier('neighbour'), count: B.count(), coins: S.coins };
  });
  ok(c3.n >= 30 && c3.dc === 0, c3.n + ' tiers at once, coins unchanged (' + c3.dc + ')');
  ok(c3.golds === 10 && c3.cups === 'cccccccccg', 'ten gold tracks, ten cups on the shelf (nine crayon, Good neighbour gold): ' + c3.cups);
  ok(!c3.titles.length, 'each gold gives its title (titleGive): missing ' + c3.titles.join());
  ok(c3.nb === 'g', 'Good neighbour 16 of 15 boards: gold (life.boards, part D counts it)');
  ok(c3.medal && c3.pend, 'eight golds: the Crayon Medal charm, its popup waits for a quiet yard');
  ok(await t.waitToast(/^New title: Trail Pro/), 'titles keep titleGive\'s toast');
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
    const L = S.missions.life, bo = L.boards; delete S.dd.st.msb_card; L.boards = 2; P.dd.stickers(); const before = !!S.dd.st.msb_card; B.card(); L.boards = bo;
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

  sec('A4. an old v2.19.2 save loads and backfills, additively (no notebook)');
  const old = await ev(() => {
    const S = JSON.parse(JSON.stringify(window.__paw.S)), m = S.missions;
    ['help', 'pouch', 'life', 'tr', 'trbf', 'wk', 'wkAreas', 'nb', 'grow'].forEach((k) => delete m[k]);
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
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: old }, prefs: { msTest: true, ddTest: true } }); await p2.goto(require('./test_lib').URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
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

  sec('B7. phones: 390 and 360 wide, no text under 13 px, 44 px taps, no sideways scroll');
  await t.ctx.close();
  for (const [w, h] of [[390, 844], [360, 740]]) {
    await t.mk({ device: 'iPhone 15', prefs: { msTest: true } }); await t.p.setViewportSize({ width: w, height: h });
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
    if (w !== 360) await t.ctx.close();
  }
  ok(errs().length === 0, 'no console errors ' + errs().slice(0, 3).join(' | '));
}, { prefs: { msTest: true, ddTest: true } });
