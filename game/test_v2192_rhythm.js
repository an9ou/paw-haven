// Daily rhythm (docs/design/daily-rhythm.md, owner 3 Nov 2026): one mission a Japan day (00:00 JST rollover), 40 raw coins and a stamp each,
// the third stamp card pays 150 coins + a Pupcake, one free swap a day; walks 1-5 of a Japan day pay full coins, 6+ half (a treasure pouch stays whole);
// the daily bonuses reset on the Japan day, not on the game day; GAME_SEC 2.5 (a game day = 1 real hour) in tick() and applyAway(); naps x15;
// an old save holding three missions for today keeps one, additively.
// node game/run_tests.js v2192_rhythm
require('./test_lib').run('v2192_rhythm', async (t) => {
  const { ok, sec, ev, S } = t;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  await t.newGame({ sex: 'girl' }, { bond: { level: 5, pts: 900 }, coins: 1000, stats: { hunger: 80, happy: 70, energy: 90, clean: 90 } });
  await t.home('yard'); await t.freezeMotion(true);
  await t.until(() => !!(window.__paw && window.__paw.rh && window.__paw.ms), null, 6000);

  sec('1. the numbers');
  const k = await ev(() => { const P = window.__paw; return { sec: P.rh.GAME_SEC, full: P.rh.WALK_FULL, nap: P.rh.nap, pay: P.ms.pay, card: P.ms.card, cardCoins: P.ms.cardCoins, v: P.S.v }; });
  ok(k.sec === 2.5 && k.nap === 15 && k.full === 5, `GAME_SEC 2.5, BOOST.nap 15, WALK_FULL 5 (${JSON.stringify(k)})`);
  ok(k.pay === 40 && k.card === 7 && k.cardCoins === 150 && k.v === 1, 'a mission pays 40, the card has 7 stamps, the third card 150 coins; the save stays v 1');

  sec('2. one mission a Japan day: the rollover at 00:00 JST (15:00 UTC)');
  const roll = await ev(() => {
    const P = window.__paw, R = Date.now, out = {};
    try {
      Date.now = () => Date.UTC(2026, 10, 9, 14, 59, 59, 500); out.before = P.rh.jst(); P.S.missions.date = '2020-01-01'; P.ms.roll(); out.d1 = P.S.missions.date; out.n1 = P.S.missions.list.length;
      P.S.missions.list[0].p = 0; P.S.missions.list[0].done = '2026-11-09'; P.ms.roll(); out.kept = !!P.S.missions.list[0].done; // the same Japan day: the done mission stays
      Date.now = () => Date.UTC(2026, 10, 9, 15, 0, 0, 500); out.after = P.rh.jst(); P.ms.roll(); out.d2 = P.S.missions.date; out.n2 = P.S.missions.list.length; out.fresh = P.S.missions.list.every((x) => !x.done && !x.p);
      out.reset = P.ms.resetAt();
    } finally { Date.now = R; }
    P.ms.roll(); out.back = P.S.missions.date === P.rh.jst(); return out;
  });
  ok(roll.before === '2026-11-09' && roll.after === '2026-11-10', `jstISO turns at 15:00 UTC: ${roll.before} -> ${roll.after}`);
  ok(roll.d1 === '2026-11-09' && roll.n1 === 1 && roll.kept, 'before midnight in Japan: one mission for the 9th, a done one stays done');
  ok(roll.d2 === '2026-11-10' && roll.n2 === 1 && roll.fresh, 'after midnight in Japan: one fresh mission for the 10th');
  ok(roll.reset === '2026-11-10T15:00:00.000Z' && roll.back, 'the next mission comes at the next 15:00 UTC; back to today: ' + roll.reset);
  const pool = await ev(() => { const P = window.__paw; return { w: ['feed2', 'pet', 'nap', 'scoop', 'mail', 'cook', 'funfair', 'walk'].map((id) => P.ms.weight(id)), el: P.ms.eligible() }; });
  ok(pool.w.join() === '0,0,0,0,0,3,3,1', 'the everyday chores never come up (weight 0), the story missions are favoured (3): ' + pool.w.join());
  ok(!pool.el.some((id) => ['feed2', 'pet', 'nap', 'scoop', 'mail'].includes(id)) && pool.el.length >= 5, 'eligible today: ' + pool.el.join(' '));

  sec('3. a finished mission: 40 raw coins and a stamp; the third full card: 150 coins and a Pupcake');
  let s = await S(); const st0 = s.missions.stamps;
  let c0 = await ev(() => { const P = window.__paw; P.ms.force(['bath']); return P.S.coins; });
  await ev(() => window.__paw.ms.act('bath', {}));
  s = await S(); ok(s.coins - c0 === 40 && s.missions.stamps === st0 + 1 && !!s.missions.list[0].done, `+40 coins (${s.coins - c0}) and one stamp (${st0} -> ${s.missions.stamps})`);
  ok(await t.waitToast(/^Mission done: Bath time\. \+40 coins and a crayon stamp\.$/), 'toast "Mission done: Bath time. +40 coins and a crayon stamp."');
  ok(await t.until(() => { const b = document.querySelector('#msBtn'); return !!b && b.textContent.trim() === '1/1' && b.classList.contains('all'); }, null, 3000), 'the top-bar clipboard says 1/1');
  c0 = await ev(() => { const P = window.__paw, m = P.S.missions; m.rewards = ['Astronaut Helmet', 'Rocket Ship']; m.stamps = 6; P.ms.force(['nap']); return { c: P.S.coins, pc: P.S.inv.food.Pupcake || 0, cards: m.cards }; });
  await ev(() => window.__paw.ms.act('nap', {}));
  s = await S(); ok(s.coins - c0.c === 190 && (s.inv.food.Pupcake || 0) === c0.pc + 1 && s.missions.cards === c0.cards + 1 && s.missions.stamps === 0, `third card: +150 and the mission's 40 (${s.coins - c0.c}), a Pupcake, a new card`);
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-reward'), null, 6000) && await ev(() => /\+150 coins/.test(document.querySelector('#modal .ms-reward').textContent)), 'the prize popup says +150 coins');
  await t.closeX(); await t.modalGone();

  sec('4. one free swap a day');
  await ev(() => { const P = window.__paw; P.ms.force(['bath']); P.S.missions.swap = ''; });
  ok(await ev(() => window.__paw.ms.swapFree()), 'an open mission and no swap yet: the swap is free');
  await ev(() => window.__paw.ms.open());
  ok(await t.until(() => !!document.querySelector('#modal .ms-pop #msSwap'), null, 4000), 'the Missions sheet has a Swap button');
  { const b = await t.p.locator('#msSwap').boundingBox(); ok(b && b.height >= 44, 'a 44 px tap: ' + (b && Math.round(b.height))); }
  await t.p.click('#msSwap');
  ok(await t.until(() => window.__paw.S.missions.list[0].id !== 'bath' && window.__paw.S.missions.swap === window.__paw.rh.jst(), null, 3000), 'tapping it swaps today\'s mission: ' + (await S()).missions.list.map((x) => x.id).join());
  ok(await t.until(() => /Swapped today\. A new mission comes tomorrow\./.test((document.querySelector('#modal .ms-pop .ms-swapline') || {}).textContent || '') && !document.querySelector('#msSwap'), null, 3000), 'the sheet says "Swapped today" and the button is gone');
  ok(await t.waitToast(/^Today's new mission: .+\.$/), 'toast "Today\'s new mission: ..."');
  ok(await ev(() => !window.__paw.ms.swap() && !window.__paw.ms.swapFree()), 'a second swap the same day does nothing');
  await t.closeX(); await t.modalGone();
  ok(await ev(() => { const P = window.__paw; P.ms.force(['bath']); P.S.missions.list[0].done = P.rh.jst(); P.S.missions.swap = ''; return !P.ms.swapFree() && !P.ms.swap(); }), 'a done mission is never swapped');

  sec('5. walks: the first 5 of a Japan day pay full coins, then half; a pouch stays whole');
  const seq = await ev(() => { const P = window.__paw, d = P.S.daily, keep = d.walks; d.walks = 0; const r = []; for (let i = 0; i < 7; i++) r.push(P.rh.walkCount()); d.walks = keep; return r; });
  ok(seq.map((w) => w.n).join() === '1,2,3,4,5,6,7' && seq.map((w) => w.share).join() === '1,1,1,1,1,0.5,0.5', 'walk numbers and shares: ' + seq.map((w) => w.share).join(' '));
  ok(await ev(() => { const r = window.__paw.rh; return r.share(100, 0, 1) === 100 && r.share(100, 0, 0.5) === 50 && r.share(101, 0, 0.5) === 51 && r.share(100, 40, 0.5) === 70 && r.share(30, 40, 0.5) === 30; }), 'walkShare: half of the path coins (rounded up), the pouch part whole');
  ok(await ev(() => { const r = window.__paw.rh; return r.tired(4) === '' && /happily tired: that was walk 5 today/.test(r.tired(5)) && /happy and a bit sleepy\. The first 5 walks of a day pay full coins and later ones pay half\./.test(r.tired(6)); }), 'the notes: nothing for walks 1-4, a heads-up on walk 5, a kind line from walk 6');
  await ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__rhSpy) { const o = W.start.bind(W); W.start = (h, op) => { window.__opts = op; return o(h, op); }; W.__rhSpy = true; } window.__paw.ms.force(['bath']); });
  const walk = async (n, pouch) => {
    await ev((n) => { const S = window.__paw.S; S.walks = 3; S.sleeping = false; S.daily.walks = n - 1; S.daily.play = true; S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.happy = 50; }); window.__paw.go('walk', 'park'); }, n);
    const up = await t.walkGate(true); if (pouch) await ev((p) => { window.__paw.W.pouch = p; }, pouch);
    const c = await ev(() => window.__paw.S.coins);
    await ev(() => window.__opts.onEnd({ coins: 100, happiness: 10, bond: 2, energy: 5, cleanliness: 1, early: false }));
    await t.until(() => !!document.getElementById('resOk'), null, 8000);
    const r = await ev(() => ({ coins: window.__paw.S.coins, walks: window.__paw.S.daily.walks, txt: (document.querySelector('#modal .panel') || {}).textContent || '', tired: !!document.querySelector('#modal .walk-tired') }));
    await t.p.click('#resOk'); await t.untilMode('yard'); await t.lu(); await t.until(() => document.getElementById('modal').hidden, null, 3000);
    return Object.assign(r, { up, paid: r.coins - c });
  };
  let w = await walk(1); ok(w.up && w.paid === 200 && w.walks === 1 && !w.tired, `walk 1: 100 path coins x the BOOST = 200 (${w.paid}), no note`);
  w = await walk(5); ok(w.paid === 200 && w.walks === 5 && w.tired && /happily tired: that was walk 5 today\. More walks today pay half coins/.test(w.txt), `walk 5: still full (${w.paid}), with a heads-up`);
  w = await walk(6); ok(w.paid === 100 && w.walks === 6 && w.tired && /happy and a bit sleepy/.test(w.txt), `walk 6: half (${w.paid}) and the kind note`);
  ok(!/fail|sorry|penalt/i.test(w.txt), 'nothing bad: no fail words on the sheet');
  w = await walk(7, 40); ok(w.paid === 140, `walk 7 with a 40-coin pouch: the pouch whole, the path half: (40 + 30) x 2 = 140 (${w.paid})`);
  const nd = await ev(() => { const P = window.__paw, S = P.S; S.daily.day = '2000-01-01'; const r = P.rh.dailyCheck(); return { r, walks: S.daily.walks, day: S.daily.day === P.rh.jst() }; });
  ok(nd.r && nd.walks === 0 && nd.day, 'a new Japan day: the walk count starts again at 0');
  w = await walk(1); ok(w.paid === 200 && !w.tired, `and walk 1 of the new day pays full again (${w.paid})`);

  sec('6. the daily bonuses follow the Japan day, not the game day');
  await t.home('yard');
  const g0 = await ev(() => { const P = window.__paw, S = P.S; P.rh.dailyCheck(); Object.assign(S.daily, { feed: true, pet: true, play: true, beachDig: true, squareGoal: true, squareShows: 3, showCoins: 10, pupcake: true, outfit: true }); window.__toasts.splice(0); const d0 = P.rh.day(); S.gameMin = (Math.floor(S.gameMin / 1440) + 1) * 1440 + 600; return { d0, jst: S.daily.day }; });
  await t.sleep(1600);
  const g1 = await ev(() => { const P = window.__paw, d = P.S.daily; return { day: P.rh.day(), jst: d.day, keep: d.feed && d.pet && d.play && d.beachDig && d.squareGoal && d.showCoins === 10 && d.pupcake && d.outfit, toasts: window.__toasts.slice() }; });
  ok(g1.day === g0.d0 + 1 && g1.jst === g0.jst && g1.keep, `a new game day (Day ${g0.d0} -> ${g1.day}): care, beach dig, Square goal, trick coins, Pupcake and outfit bonuses stay used`);
  ok(!g1.toasts.some((x) => /new day|Daily bonuses/i.test(x)), 'and no "new day" toast');
  await ev(() => { window.__toasts.splice(0); window.__paw.S.daily.day = '2000-01-01'; });
  ok(await t.until(() => { const d = window.__paw.S.daily; return d.day === window.__paw.rh.jst() && !d.feed && !d.beachDig && !d.squareGoal && !d.showCoins && !d.pupcake && !d.walks; }, null, 4000), 'a new Japan day resets them all');
  ok(await t.waitToast(/^A new day in town! The daily bonuses and a fresh mission are ready\.$/), 'toast "A new day in town! ..."');
  if (await ev(() => !!window.__paw.ff)) ok(await ev(() => { const P = window.__paw; P.S.ff.day = '2000-01-01'; P.ff.left('catch'); return P.S.ff.day === P.rh.jst(); }), 'the Fun Fair daily caps count the Japan day');

  sec('7. the clock: a game hour is 2.5 real minutes (tick and time away)');
  await t.home('yard');
  const m0 = await ev(() => window.__paw.S.gameMin); await t.sleep(3000); const m1 = await ev(() => window.__paw.S.gameMin);
  ok(m1 - m0 > 0.8 && m1 - m0 < 1.9, `3 real seconds = about 1.2 game minutes (was 3): ${(m1 - m0).toFixed(2)}`);
  const aw = await ev(() => { const P = window.__paw, S = P.S; S.dogs.forEach((d) => { d.stats.hunger = 90; d.stats.energy = 10; }); const g = S.gameMin; S.lastReal = Date.now() - 600e3; P.rh.away(); return { dg: S.gameMin - g, hunger: S.stats.hunger, energy: S.stats.energy }; });
  ok(Math.abs(aw.dg - 240) < 2, `10 real minutes away = 4 game hours (${aw.dg.toFixed(1)} game minutes; was 10 hours)`);
  ok(Math.abs(aw.hunger - 78) < 0.6 && Math.abs(aw.energy - 90) < 0.6, `Hunger 90 -> ${aw.hunger.toFixed(1)} (3 a game hour, was 60 after 10 minutes), Energy 10 -> ${aw.energy.toFixed(1)}`);
  const nap = await ev(() => window.__paw.shop.napRate());
  ok(nap >= 300 * 0.9, `a nap: ${Math.round(nap)} Energy a game hour = ${Math.round(nap / 2.5)} a real minute (as fast as before)`);

  sec('7b. walks that covered no ground are not one of the day\'s walks (runner and classic)');
  {
    const runEnd = async (r) => {
      await ev(() => { const S = window.__paw.S; S.walks = 3; S.sleeping = false; S.daily.walks = 2; S.dogs.forEach((d) => { d.stats.energy = 90; }); window.__paw.go('walk', 'park'); });
      await t.walkGate(true); const c = await ev(() => window.__paw.S.coins);
      await ev((r) => window.__opts.onEnd(r), r);
      await t.until(() => !!document.getElementById('resOk'), null, 8000);
      const o = await ev(() => ({ walks: window.__paw.S.daily.walks, coins: window.__paw.S.coins }));
      await t.p.click('#resOk'); await t.untilMode('yard'); await t.lu(); await t.until(() => document.getElementById('modal').hidden, null, 3000);
      return Object.assign(o, { paid: o.coins - c });
    };
    let e = await runEnd({ coins: 0, happiness: 0, bond: 0, energy: 0, cleanliness: 0, early: true, distance: 0 });
    ok(e.walks === 2, `runner: "Head home early" at the start (0 distance) leaves the day's walk count at 2 (${e.walks})`);
    e = await runEnd({ coins: 30, happiness: 4, bond: 1, energy: 2, cleanliness: 0, early: true, distance: 12 });
    ok(e.walks === 3 && e.paid === 60, `runner: an early walk that went 12 m counts (walk ${e.walks}), full pay ${e.paid}`);
    // the classic walk (no PawWalk): heading home at once does not count, a walk half done does
    const keep = await ev(() => { const P = window.PawWalk; window.__rhStart = P.start; P.start = undefined; return true; });
    const classic = async (half) => {
      await ev(() => { const S = window.__paw.S; S.walks = 3; S.sleeping = false; S.daily.walks = 2; S.dogs.forEach((d) => { d.stats.energy = 90; }); window.__paw.go('walk', 'park'); });
      await t.until(() => window.__paw.mode === 'walk' && !!document.getElementById('walkQuit') && !!window.__paw.W, null, 8000);
      if (half) await ev(() => { const W = window.__paw.W; W.dist = W.len * 0.5; });
      await t.p.click('#walkQuit');
      await t.until(() => !!document.getElementById('resOk'), null, 8000);
      const n = await ev(() => window.__paw.S.daily.walks);
      await t.p.click('#resOk'); await t.untilMode('yard'); await t.lu(); await t.until(() => document.getElementById('modal').hidden, null, 3000);
      return n;
    };
    try {
      ok(keep && await classic(false) === 2, 'classic: home early at the start leaves the count at 2');
      ok(await classic(true) === 3, 'classic: a walk half done counts (walk 3)');
    } finally { await ev(() => { window.PawWalk.start = window.__rhStart; }); }
  }

  sec('7c. care days count the Japan day (as the feed / pet / play flags)');
  {
    const cd = await ev(() => {
      const P = window.__paw, S = P.S, R = Date.now, out = {};
      try {
        S.careDays = 2; S.careDayLast = '2026-11-09'; // an old save's local date
        Date.now = () => Date.UTC(2026, 10, 9, 16, 0, 0); // local (UTC) 9 Nov, Japan 10 Nov
        P.spots.markCare(); out.a = [S.careDays, S.careDayLast];
        Date.now = () => Date.UTC(2026, 10, 10, 9, 0, 0); // local 10 Nov morning, still Japan 10 Nov
        P.spots.markCare(); out.b = [S.careDays, S.careDayLast];
        Date.now = () => Date.UTC(2026, 10, 10, 15, 30, 0); // Japan 11 Nov
        P.spots.markCare(); out.c = [S.careDays, S.careDayLast];
      } finally { Date.now = R; }
      return out;
    });
    ok(cd.a.join() === '3,2026-11-10' && cd.b.join() === '3,2026-11-10' && cd.c.join() === '4,2026-11-11', 'one care day a Japan day, an old local-date key compares as a date: ' + JSON.stringify(cd));
  }

  sec('7d. an older build brings three missions back through the cloud: one stays');
  {
    const tr = await ev(() => {
      const P = window.__paw, j = P.rh.jst(), it = (id, p, done) => ({ id, n: 2, p, done });
      const one = (list) => { P.S.missions = { date: j, list, stamps: 2, cards: 0, rewards: [], stampDay: '', swap: '', rhythm: 1 }; P.ms.roll(); return P.S.missions.list.map((x) => x.id + ':' + (x.done ? 'done' : x.p)).join(); };
      const r = [one([it('walk', 1, null), it('bath', 2, j), it('cook', 0, null)]), one([it('walk', 0, null), it('cook', 1, null), it('photo', 0, null)])];
      P.ms.force(['bath', 'walk', 'cook']); P.ms.roll(); r.push(P.S.missions.list.length); P.ms.force(['bath']);
      return r;
    });
    ok(tr[0] === 'bath:done', 'a finished one stays (its coins and stamp were given): ' + tr[0]);
    ok(tr[1] === 'cook:1', 'none finished: the one with the most progress stays: ' + tr[1]);
    ok(tr[2] === 3, 'a test force keeps its three: ' + tr[2]);
  }

  sec('7e. the Saturday stall mission only when the local Saturday lasts the whole Japan day');
  {
    const sd = await ev(() => {
      const P = window.__paw, R = Date.now, out = {};
      if (!P.ff || new Date().getTimezoneOffset() !== 0) return null; // the times below are UTC = the test's local clock
      P.ff.setSat(null);
      try {
        const at = (ms) => { Date.now = () => ms; return P.ms.stallDay(); };
        const sat = (h) => Date.UTC(2026, 10, 14, h, 0, 0); // Sat 14 Nov 2026 (UTC = the test's local clock)
        out.morning = at(sat(9)); // the Japan day 14 Nov ends 15:00 UTC: inside Saturday
        out.evening = at(sat(16)); // the Japan day 15 Nov ends Sun 15:00: past Saturday
        out.friday = at(Date.UTC(2026, 10, 13, 20, 0, 0));
      } finally { Date.now = R; }
      P.ff.setSat(true); out.forced = P.ms.stallDay(); P.ff.setSat(null);
      return out;
    });
    if (!sd) console.log('   (skipped: no Fun Fair or not a UTC clock)');
    else ok(sd.morning === true && sd.evening === false && sd.friday === false && sd.forced === true, 'stall mission days: ' + JSON.stringify(sd));
  }

  sec('7f. the news order with FR_LIVE on: newest date first, a newer version first on the same date');
  {
    const nl = await ev(() => { const N = window.__paw.nw; const a = N.v219(); N.add({ id: '9.9.10' }); N.add({ id: '9.9.9' }); const b = N.list(); N.drop(); N.drop(); return { a: a.slice(0, 3).join(), b: b.slice(0, 4).join(), c: N.list().slice(0, 2).join(), latest: N.latest() }; });
    ok(nl.a === '2.19.2,2.19,2.18.4', 'with Friends live: ' + nl.a);
    ok(nl.b === '9.9.10,9.9.9,2.19.2,2.19' && nl.c === '2.19.2,2.19' && nl.latest === '2.19.2', 'same date: the newer version first; drop takes the newest: ' + JSON.stringify(nl));
  }

  sec('7g. the nap line counts a real minute; no "new day" toast on the first run after the update');
  {
    const nm = await ev(() => { const P = window.__paw; return Math.round(P.shop.napRate() / P.rh.GAME_SEC); });
    ok(nm >= 100 && nm < 400, 'a nap refills about ' + nm + ' Energy a real minute');
    await ev(() => { window.__toasts.splice(0); window.__paw.S.daily.day = 41; });
    ok(await t.until(() => typeof window.__paw.S.daily.day === 'string', null, 4000), 'the numeric game day becomes the Japan day');
    await t.sleep(400);
    ok(!(await ev(() => window.__toasts.some((x) => /new day in town/i.test(x)))), 'and no "A new day in town!" toast');
  }

  sec('8. an old save holding three missions for today keeps one, additively');
  const mg = await ev(() => {
    const P = window.__paw, j = P.rh.jst(), it = (id, n, p, done) => ({ id, n, p, done });
    const one = (list) => { P.S.missions = { date: j, list, stamps: 2, cards: 0, rewards: [], stampDay: '' }; P.ms.fields(); const m = P.S.missions; return { ids: m.list.map((x) => x.id + ':' + (x.done ? 'done' : x.p)).join(), stamps: m.stamps, rhythm: m.rhythm, swap: m.swap }; };
    return [one([it('bath', 1, 1, j), it('feed2', 2, 1, null), it('walk', 1, 0, null)]), one([it('bath', 1, 1, j), it('nap', 1, 1, j), it('scoop', 1, 1, j)]), one([it('walk', 1, 0, null), it('cook', 1, 0, null), it('photo', 1, 0, null)])];
  });
  ok(mg[0].ids === 'feed2:1' && mg[0].stamps === 2 && mg[0].rhythm === 1 && mg[0].swap === '', 'one done, one half done: keeps the half-done one to finish today (stamps unchanged): ' + mg[0].ids);
  ok(mg[1].ids === 'bath:done', 'all three done (the stamp was given): keeps a done one, today is done: ' + mg[1].ids);
  ok(mg[2].ids === 'walk:0', 'none started: keeps the first: ' + mg[2].ids);
  const old = await ev(() => {
    const S = JSON.parse(JSON.stringify(window.__paw.S)), j = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    S.missions = { date: j, list: [{ id: 'bath', n: 1, p: 1, done: j }, { id: 'feed2', n: 2, p: 1, done: null }, { id: 'walk', n: 1, p: 0, done: null }], stamps: 3, cards: 1, rewards: ['Astronaut Helmet'], stampDay: '' };
    S.daily = { day: 41, pupcake: true, feed: true, pet: false, play: true, outfit: false }; delete S.newsSeen; return JSON.stringify(S);
  });
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: old }, prefs: { msTest: true } }); await p2.goto(require('./test_lib').URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  await t.untilMode('yard'); await t.until(() => !!document.querySelector('#msBtn:not([hidden])'), null, 8000);
  const o2 = await t.ev(() => { const S = window.__paw.S, m = S.missions; return { v: S.v, ids: m.list.map((x) => x.id + ':' + (x.done ? 'done' : x.p)).join(), stamps: m.stamps, cards: m.cards, day: S.daily.day, walks: S.daily.walks, jst: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), hud: document.querySelector('#msBtn').textContent.trim() }; });
  ok(o2.v === 1 && o2.ids === 'feed2:1' && o2.stamps === 3 && o2.cards === 1 && o2.hud === '0/1', 'the old save loads: one mission left to finish, stamps and cards kept, HUD 0/1: ' + JSON.stringify(o2));
  ok(o2.day === o2.jst && o2.walks === 0, 'its game-day daily record became today\'s Japan day, walks 0');
  ok(errs().length === 0, 'no console errors ' + errs().slice(0, 3).join(' | '));
}, { prefs: { msTest: true } });
