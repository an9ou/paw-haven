// v2.10 BALL lane test, V210.md sections 2 and 5.4: free ball play where you are (replaces the timed Fetch challenge).
// Desktop 1280x720. node game/run_tests.js v210_ball
require('./test_lib').run('v210_ball', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p, S = () => t.S();
  const BLs = () => ev(() => window.__paw.bl.state), dogs = () => ev(() => window.__paw.bl.dogs);
  const acts = () => ev(() => window.__paw.pk.acts());
  const clearToasts = () => ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
  const toastN = () => ev(() => document.querySelectorAll('#toasts .toast').length);
  const rest = (ms) => t.until(() => { const s = window.__paw.bl.state; return !s || s.ph === 'rest'; }, null, ms || 15000);
  // throw and let the whole chase run (the sim steps the loop at 60 Hz without waiting)
  const play = async (vx, vy) => { await ev(([vx, vy]) => window.__paw.bl.throwV(vx, vy), [vx, vy]); await ev(() => window.__paw.bl.sim(14)); };
  const start = async (toy, place) => { // a Bond level-up sheet can pop up a moment after an earlier game ended: dismiss it and open the tray again
    for (let i = 0; i < 3; i++) { await t.home(place); await t.luWait(400); await p().click('[data-act=play]'); if (await t.waitPop(true, 2500) && await p().locator(`[data-play="ball:${toy || 'Tennis Ball'}"]`).count()) break; }
    const card = `[data-play="ball:${toy || 'Tennis Ball'}"]`;
    await p().click(card, { timeout: 4000 }).catch(async () => { await t.lu(); await p().click('[data-act=play]'); await t.waitPop(true); await p().click(card); });
    return t.until(() => window.__paw.bl && window.__paw.bl.on, null, 4000); };
  const players = ['shiba', 'corgi', 'greyhound'];
  const bonds = async () => (await S()).dogs.filter((d) => players.includes(d.key)).map((d) => d.bond.pts);

  await t.newGame({}, {});
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'greyhound', sex: 'female', months: 30 }, 'Pip'); P.S.inv.toys.push('Frisbee', 'Glow Ball', 'Driftwood Stick', 'Squeaky Duck'); P.S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.happy = 40; }); });

  sec('1. the Play tray: ball play replaces the Fetch challenge');
  await t.home(); await p().click('[data-act=play]'); await t.waitPop(true);
  const cards = await ev(() => [...document.querySelectorAll('[data-play]')].map((e) => e.dataset.play));
  ok(['Tennis Ball', 'Frisbee', 'Driftwood Stick', 'Glow Ball'].every((n) => cards.includes('ball:' + n)), 'a Play ball card for each throw toy owned: ' + cards.join(', '));
  ok(!cards.some((c) => c.startsWith('fetch:')), 'no timed Fetch card');
  ok(!cards.includes('toy:Tennis Ball') && !cards.includes('toy:Glow Ball'), 'the old room games for the Tennis Ball and the Glow Ball left the tray');
  ok(cards.includes('toy:Squeaky Duck') || cards.includes('duck'), 'the other toys stay');
  ok(!/challenge/i.test(await ev(() => document.getElementById('dock').textContent)), 'the tray no longer says "challenge"');

  sec('2. start: the scene stays, every eligible dog plays');
  await ev(() => { const P = window.__paw; P.addDog({ key: 'beagle', sex: 'male', months: 2 }, 'Tiny'); P.S.dogs[2].sleeping = true; P.S.dogs[2].stats.energy = 5; }); // Pip sleeps (energy 5: no waking at 100 mid-check), Tiny is 2 months
  ok(await start(), 'ball play starts');
  ok((await t.mode()) === 'yard' && (await ev(() => window.__paw.bl.on)), 'cur.mode stays yard, blOn() is true');
  const d0 = await dogs();
  ok(d0.length === 2 && d0.every((d) => d.key !== 'beagle' && d.key !== 'greyhound'), 'the sleeping dog and the 2-month-old puppy sit out: ' + d0.map((d) => d.key).join(','));
  ok(await ev(() => !!document.getElementById('blDone') && document.getElementById('blDone').offsetHeight >= 44), 'a Done button in the dock, 44 px high');
  ok(await ev(() => document.getElementById('bar').hidden), 'the action bar is out of the way while playing');
  ok(await ev(() => !!document.querySelector('#ballLayer #blBall')), 'the ball is in the scene (#ballLayer)');
  ok((await ev(() => window.__paw.bl.state.ph)) === 'rest', 'the ball waits at the player\'s spot');
  await ev(() => window.__paw.bl.stop()); await t.untilMode('yard');
  await ev(() => { const s = window.__paw.S; s.dogs[2].sleeping = false; }); // Pip wakes, the 2-month-old puppy stays out of every game below

  sec('3. a real drag and release throws; every dog races; a catch pays');
  await ev(() => { delete window.__paw.S['toyAt_Tennis Ball']; });
  ok(await start(), 'ball play starts again'); await clearToasts();
  await ev(() => { document.getElementById('bubble').hidden = true; });
  const ball = await ev(() => { const r = document.getElementById('blRing').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const a0 = await acts(), c0 = (await S()).coins, pl = (x) => x.dogs.filter((d) => players.includes(d.key)), e0 = pl(await S()).map((d) => d.stats.energy), h0 = pl(await S()).map((d) => d.stats.happy);
  await p().mouse.move(ball.x, ball.y); await p().mouse.down();
  for (let i = 1; i <= 8; i++) { await p().mouse.move(ball.x + i * 45, ball.y - i * 22); await t.sleep(12); }
  const held = await ev(() => window.__paw.bl.state.ball.state);
  ok(held === 'held', 'the ball follows the pointer while held (' + held + ')');
  await p().mouse.up();
  ok(await t.until(() => window.__paw.bl.state.ph !== 'rest', null, 3000), 'letting go throws it');
  ok((await dogs()).every((d) => d.role === 'chase'), 'every dog races for it: ' + (await dogs()).map((d) => d.role).join(','));
  ok(await rest(), 'the ball comes back and the dogs settle');
  const st = await BLs(), s1 = await S(), a1 = await acts();
  ok(st.n === 1 && s1.bl.n >= 1, 'one return counted');
  ok(st.coins === 2 && s1.coins === c0 + 2, 'a return pays 2 coins (real, no boost): +' + (s1.coins - c0));
  ok(a1.fetch === (a0.fetch || 0) + 1, 'trackAct(fetch) fired once for the catch');
  ok(pl(s1).every((d, i) => d.stats.energy < e0[i]), 'every dog that ran spent Energy');
  ok(pl(s1).every((d, i) => d.stats.happy > h0[i]), 'and gained Happiness');
  ok((await toastN()) === 0, 'no toast covered the play area (speech bubbles and floating text only)');
  ok(/coins: 2 of 16/.test(await ev(() => document.getElementById('blCoins').textContent)), 'the dock shows the coins');

  sec('4. the fastest usually wins (speed from ball and Energy)');
  await ev(() => window.__paw.bl.rng(() => 0.99)); // no steals, no laps
  const wins = {}; const gk = {}; (await dogs()).forEach((d) => { gk[d.id] = d.key; });
  const tire = () => ev(() => window.__paw.S.dogs.forEach((d) => { d.stats.energy = d.key === 'greyhound' ? 100 : 0; })); // the greyhound (ball 1.4) at full Energy against two tired dogs
  for (let i = 0; i < 8; i++) { await tire(); await play(i % 2 ? 700 : -700, -650); const w = (await BLs()).th.winner; wins[gk[w]] = (wins[gk[w]] || 0) + 1; }
  ok((wins.greyhound || 0) >= 6, 'the fast dog at full Energy wins most of 8 throws: ' + JSON.stringify(wins));
  const spd = await ev(() => { const B = window.__paw.bl; return B.dogs.map((d) => [d.key, Math.round(d.sp)]); });
  ok(spd.find((x) => x[0] === 'greyhound')[1] > 2 * spd.find((x) => x[0] === 'shiba')[1] * 0.9, 'speed = 520 x ball x (0.7 + 0.3 x Energy / 100): ' + JSON.stringify(spd));
  await ev(() => window.__paw.S.dogs.forEach((d) => { d.stats.energy = 100; }));

  sec('5. steals and keep-away laps');
  await ev(() => window.__paw.bl.rng(() => 0.0)); await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.energy = 100; }); });
  const n0 = (await BLs()).n; await ev(() => window.__paw.bl.force('steal')); await ev(() => window.__paw.bl.throwV(800, -600));
  await ev(() => window.__paw.bl.sim(14));
  let th = (await BLs()).th; ok(th.stolen === true && th.special, 'a steal: the ball changed mouths'); ok(!!th.thief && th.thief !== th.winner, 'another dog than the winner brought it back');
  ok((await BLs()).n === n0 + 1, 'and it still came back');
  await ev(() => window.__paw.bl.force('lap')); await ev(() => window.__paw.bl.throwV(-800, -600));
  let sawLap = false; for (let i = 0; i < 900 && !sawLap; i++) { await ev(() => window.__paw.bl.sim(1 / 60)); sawLap = (await dogs()).some((d) => d.role === 'lap'); }
  ok(sawLap, 'the winner runs a keep-away lap');
  const lapSay = await ev(() => !document.getElementById('bubble').hidden && document.getElementById('bubble').textContent);
  ok(!!lapSay, 'with a line in a speech bubble: "' + lapSay + '"');
  await ev(() => window.__paw.bl.sim(16)); ok((await BLs()).ph === 'rest' && (await BLs()).n === n0 + 2, 'the lap ends with the ball brought back');
  // at most 1 throw in 3 has a steal or lap, even when every roll is lucky
  const sp = []; for (let i = 0; i < 9; i++) { await ev(() => window.__paw.S.dogs.forEach((d) => { d.stats.energy = 100; })); await play(i % 2 ? 700 : -700, -600); const x = await BLs(); sp.push(x.th.special ? 1 : 0); }
  ok(sp.every((v, i) => !v || !sp.slice(Math.max(0, i - 2), i).some((u) => u)), 'at most 1 throw in 3 has a steal or lap: ' + sp.join(''));
  ok(sp.some((v) => v), 'with lucky rolls a special does happen: ' + sp.join(''));

  sec('6. coins: 16 a session, 40 a day, Frisbee +3');
  await ev(() => { window.__paw.bl.rng(() => 0.99); });
  const s2 = await S(); ok(s2.bl.coins === (await BLs()).coins, 'S.bl.coins follows the session so far (' + s2.bl.coins + ')');
  for (let i = 0; i < 12; i++) await play(i % 2 ? 650 : -650, -600);
  const s3 = await S(); ok((await BLs()).coins === 16, 'a session never pays more than 16 coins: ' + (await BLs()).coins);
  ok(/done for this round/.test(await ev(() => document.getElementById('blCoins').textContent)), 'the dock says so');
  await ev(() => window.__paw.bl.stop());
  await ev(() => { const s = window.__paw.S; s.bl.coins = 38; s.bl.day = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'); });
  ok(await start(), 'a new session'); await play(650, -600); await play(-650, -600); await play(650, -600);
  const s4 = await S(); ok(s4.bl.coins === 40 && (await BLs()).coins === 2, 'the day stops at 40 (' + s4.bl.coins + ') and the session got ' + (await BLs()).coins);
  ok(/done for today/.test(await ev(() => document.getElementById('blCoins').textContent)), 'Ball play coins: done for today');
  const cc = (await S()).coins; await play(650, -600); ok((await S()).coins === cc, 'no coins after that, play goes on');
  await ev(() => window.__paw.bl.stop());
  await ev(() => { window.__paw.S.bl.day = '2001-01-01'; window.__paw.S.bl.coins = 40; });
  ok(await start('Frisbee'), 'Frisbee starts'); await play(650, -600);
  ok((await BLs()).coins === 3 && (await S()).bl.coins === 3, 'a new day starts again, and a Frisbee return pays 3: ' + (await S()).bl.coins);
  await ev(() => window.__paw.bl.stop());

  sec('7. Done: Bond once a session per dog, the play care bonus, the scene is back');
  await ev(() => { const s = window.__paw.S; delete s['toyAt_Tennis Ball']; s.daily.play = false; s.gameMin += 60; });
  ok(await start(), 'a fresh session'); const b0 = await bonds(); const g0 = (await S()).coins;
  for (let i = 0; i < 5; i++) await play(i % 2 ? 650 : -650, -600);
  ok(JSON.stringify(await bonds()) === JSON.stringify(b0), 'no Bond yet while playing (it comes once, at the end)');
  await p().click('#blDone'); await t.until(() => !window.__paw.bl.on, null, 3000);
  const b1 = await bonds(); ok(b1.every((v, i) => v > b0[i]), 'every dog that ran got Bond: ' + b0 + ' -> ' + b1);
  await t.lu();
  ok(!(await ev(() => document.getElementById('bar').hidden)) && (await t.mode()) === 'yard' && !(await ev(() => window.__paw.busy)), 'the bar is back, the yard is idle');
  ok(!(await ev(() => !!document.getElementById('blDone'))), 'the ball tray is gone');
  ok((await ev(() => document.getElementById('ballLayer').children.length)) === 0, 'the ball is gone from the scene');
  ok(await t.waitToast(/Daily care bonus/, 3000) || (await S()).daily.play, 'the first play of the day counts for the daily care bonus');
  await ev(() => window.__paw.S.dogs.forEach((d) => { d.stats.energy = 90; }));
  ok(await start(), 'and again right away'); await play(650, -600); const b2 = await bonds();
  await p().click('#blDone'); await t.until(() => !window.__paw.bl.on, null, 3000); await t.lu();
  const b3 = await bonds(); ok(b3.every((v, i) => v >= b2[i]) && b3.some((v, i) => v > b2[i]), 'a second session gives Bond again (but 25 % when it comes so soon)');

  sec('8. Space is an easy throw, leaving the scene ends the game, a nursing mum and a sleeping leader do not play');
  ok(await start(), 'start'); await ev(() => document.activeElement && document.activeElement.blur()); await p().keyboard.press('Space');
  ok(await t.until(() => window.__paw.bl.state.ph !== 'rest', null, 2000), 'Space throws the ball'); await ev(() => window.__paw.bl.sim(14));
  await ev(() => window.__paw.go('map')); ok(await t.untilMode('map'), 'to the map');
  ok(!(await ev(() => window.__paw.bl.on)) && !(await ev(() => window.__paw.busy)), 'leaving the scene ends ball play and frees the dog');
  await t.home(); await ev(() => { window.__paw.S.sleeping = true; });
  ok(!(await ev(() => window.__paw.bl.start('Tennis Ball'))) && !(await ev(() => window.__paw.bl.on)), 'a sleeping leader does not play');
  await ev(() => { window.__paw.S.sleeping = false; });
  await clearToasts(); await ev(() => { const S = window.__paw.S; S.litters = [{ id: 'L1', mum: S.dog.id, sire: 'x', born: '2026-01-01', until: '2099-01-01', pups: [], named: true }]; });
  ok(!(await ev(() => window.__paw.bl.start('Tennis Ball'))) && (await t.waitToast(/nursing the pups.*No ball play for her/, 3000)), 'a nursing leader does not play, with a kind line');
  await ev(() => { const S = window.__paw.S; S.litters = [{ id: 'L1', mum: S.dogs[2].id, sire: 'x', born: '2026-01-01', until: '2099-01-01', pups: [], named: true }]; });
  ok(await start(), 'start with another dog nursing'); ok(!(await dogs()).some((d) => d.key === 'greyhound'), 'a nursing mum stays out of the game: ' + (await dogs()).map((d) => d.key).join(','));
  await ev(() => { window.__paw.bl.stop(); window.__paw.S.litters = []; });

  sec('9. other places: the same scene, the ball stays on the floor');
  for (const place of ['house', 'dogpark', 'park']) {
    await ev(() => window.__paw.S.dogs.forEach((d) => { d.sleeping = false; d.stats.energy = 90; }));
    ok(await start('Tennis Ball', place), place + ': ball play starts in the place\'s own scene');
    ok((await t.mode()) === 'yard' && (await S()).place === place, place + ': cur.mode yard, still at ' + place);
    await ev(() => window.__paw.bl.throwV(900, -700)); let out = false;
    for (let i = 0; i < 100; i++) { await ev(() => window.__paw.bl.sim(0.1)); const s = await BLs(); if (!s) break; if (s.ball.x < 0 || s.ball.x > 1000 || s.ball.gy < s.zone.y0 - 1 || s.ball.gy > s.zone.y1 + 1) out = true; if (s.ph === 'rest') break; }
    ok(!out && (await BLs()).ph === 'rest' && (await BLs()).n >= 1, place + ': the ball stayed in the place and came back');
      await ev(() => window.__paw.bl.stop());
  }
  await t.home();


  sec('11. the toys feel different: the Frisbee floats, the Stick tumbles, the Glow Ball glows at night');
  const K = await ev(() => JSON.parse(JSON.stringify(window.__paw.bl.toys)));
  ok(K.Frisbee.g < K['Tennis Ball'].g * 0.6 && K.Frisbee.bounce < 0.2, 'the Frisbee floats (low gravity ' + K.Frisbee.g + ' vs ' + K['Tennis Ball'].g + ') and lands flat');
  ok(K['Driftwood Stick'].spin > K['Tennis Ball'].spin * 3 && K['Driftwood Stick'].bounce < K['Tennis Ball'].bounce, 'the Stick tumbles (spin ' + K['Driftwood Stick'].spin + ' vs ' + K['Tennis Ball'].spin + ') and does not bounce much');
  ok(K['Tennis Ball'].coin === 2 && K.Frisbee.coin === 3 && K['Driftwood Stick'].coin === 3 && K['Glow Ball'].coin === 2, 'coins a return: ball 2, Frisbee 3, Stick 2 + 1');
  await t.home(); await p().click('#devBtn'); await p().waitForSelector('#devPanel:not([hidden])'); await p().selectOption('#dvTime', 'night'); await p().click('#dvX'); await t.lu();
  ok(await start('Glow Ball'), 'the Glow Ball starts at night'); ok(await ev(() => !!document.getElementById('blHalo')), 'it glows: a halo round the ball after dark');
  await ev(() => window.__paw.bl.stop()); await t.home(); await p().click('#devBtn'); await p().waitForSelector('#devPanel:not([hidden])'); await p().selectOption('#dvTime', 'day'); await p().click('#dvX'); await t.lu();
  ok(await start('Glow Ball'), 'the Glow Ball by day'); ok(await ev(() => !document.getElementById('blHalo')), 'no halo in daylight'); await ev(() => window.__paw.bl.stop());


  sec('10. old saves and the legacy Fetch entry');
  const sv = await S(); ok(typeof sv.bl.coins === 'number' && typeof sv.bl.n === 'number', 'S.bl is there (v210Fields)');
  await ev(() => window.__paw.go('fetch', 'Tennis Ball')); ok(await t.untilMode('fetch', 4000), 'go(fetch) still opens the retired challenge (for old suites), nothing in the UI does');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');

  sec('12. a dog in the strip right of the dog house gets out; scene taps keep the ball dock');
  await t.home(); await t.luWait(400);
  const bun = await ev(() => window.__paw.S.dogs.find((d) => d.key === 'corgi').id);
  await ev((id) => { window.__paw.rm.set(id, { x: 880, y: 516 }); window.__paw.bl.start('Tennis Ball'); }, bun);
  const bx0 = (await dogs()).find((d) => d.id === bun);
  await ev(() => window.__paw.bl.sim(3)); const bx1 = (await dogs()).find((d) => d.id === bun);
  ok(bx0 && bx0.x > 866 && bx1 && bx1.pose === 'sit' && bx1.role === 'wait', `Bun starts boxed in at x ${bx0 && Math.round(bx0.x)} and reaches the wait spot (${bx1 && Math.round(bx1.x)},${bx1 && Math.round(bx1.y)} ${bx1 && bx1.pose})`);
  await ev(() => { ['#houseG', '#bowlG'].forEach((q) => { const el = document.querySelector(q); if (el && el.onclick) el.onclick(); }); });
  ok(await ev(() => window.__paw.bl.on && !!document.getElementById('blDone')), 'tapping the dog house and the bowl keeps the ball dock and its Done button');
  await ev(() => window.__paw.bl.stop()); await t.untilMode('yard');

  sec('13. Market Street: while playing, the shops open nothing and the place buttons hide (owner, v2.13.1 and v2.13.3)');
  await ev(() => { const S = window.__paw.S; S.place = 'market'; window.__paw.go('yard'); }); await t.calm();
  await ev(() => window.__paw.bl.start('Tennis Ball'));
  const shops = await ev(() => [...document.querySelectorAll('svg.world [data-shop]')].map((g) => { const r = g.getBoundingClientRect(); return { k: g.getAttribute('data-shop'), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }).filter((s) => s.x > 0 && s.x < innerWidth && s.y > 0 && s.y < innerHeight));
  for (const s of shops) await t.p.mouse.click(s.x, s.y);
  ok(shops.length >= 3 && !(await ev(() => !!document.querySelector('#modal:not([hidden]) .panel.shop'))) && (await ev(() => window.__paw.bl.on)), `clicking the ${shops.length} shop fronts opens no shop and the game goes on`);
  ok(await ev(() => { const pb = document.getElementById('placeBtns'); return !pb || getComputedStyle(pb).display === 'none'; }), 'the place buttons hide while playing');
  await ev(() => window.__paw.bl.stop()); await t.untilMode('yard');
  ok(await ev(() => { const pb = document.getElementById('placeBtns'); return !!pb && getComputedStyle(pb).display !== 'none'; }), 'Done brings the place buttons back');
});
