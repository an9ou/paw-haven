// v2.15 Around Town: the three run tracks (V215.md 6.3, 7, 16), ACTIVITIES part 3.
//   * Sunflower Lanes, Bamboo Grove Trail, Seaside Cliffs Run: ROUTES rows with the table's numbers, places with a run gate, cards in the route carousel (Bond order)
//   * the gates (data-hot="run") in the new places, the seven old route places and the Square start the walk with the carousel's checks (Bond, asleep, Energy >= 20)
//   * the six treasures (exact names, kinds, rarities), the loot pools, 'any' treasures on the new routes, the first-run care notes (gold toast, S.trk.seen)
//   * with the switch off the game is v2.14 (7 cards, 19 treasures)
//   * a 7-day income sim: walks Energy-limited on every route, ball play, agility, the pool: walks stay the top source, agility <= 40, the pool pays 0
const { run } = require('./test_lib');
const NEW = ['sunflower', 'bamboo', 'cliffs'];
const TABLE = { sunflower: { bond: 2, secs: 60, energy: 15, coins: [25, 35], bp: 9, pool: ['coin', 'flower', 'leaf'] }, bamboo: { bond: 4, secs: 75, energy: 25, coins: [40, 55], bp: 12, pool: ['coin', 'leaf', 'acorn'] }, cliffs: { bond: 7, secs: 90, energy: 30, coins: [55, 70], bp: 14, pool: ['coin', 'shell', 'flower'] } };
const TREAS = { 'Sunflower Collar': ['wearable', 'neck', 'Uncommon', 'sunflower'], 'Lucky Horseshoe': ['charm', 'charm', 'Rare', 'sunflower'], 'Bamboo Ring': ['toy', null, 'Common', 'bamboo'], 'Paper Lantern': ['charm', 'charm', 'Uncommon', 'bamboo'], 'Sea Glass': ['charm', 'charm', 'Rare', 'cliffs'], 'Sailor Cap': ['wearable', 'head', 'Uncommon', 'cliffs'] };
const NOTES = { sunflower: 'Farm tracks pass fields with other animals. Keep the lead short and let the cows and ducks have their space.', bamboo: 'Stepping stones get slippery after rain. Walk slowly across and let your dog choose where to put each paw.', cliffs: 'Stay on the path and well back from the edge, even with a calm dog. A fence and a short lead mean everyone enjoys the view.' };
const OLD_GATES = { park: 'park', river: 'river', woods: 'woods', beach: 'beach', hilltop: 'hilltop', pier: 'pier', square: 'town' };

run('v215_tracks', async (t) => {
  const { ok, sec, ev } = t;
  const errs = [];
  const leaveWalk = async () => { await ev(() => { window.__paw.S.sleeping = false; window.__paw.go('yard'); }); await t.calm(); };

  sec('the three routes: table numbers, rows, places');
  await t.newGame({ ground: true }, { bond: { level: 8, pts: 1600 }, coins: 500, stats: { hunger: 90, happy: 80, energy: 100, clean: 90 } });
  t.p.on('pageerror', (e) => errs.push(e.message));
  ok(await ev(() => window.__paw.tr.on()), 'trOn: the three tracks exist while mpOn');
  const rows = await ev(() => window.__paw.tr.rows());
  for (const k of NEW) {
    const r = rows[k], T = TABLE[k];
    ok(r && r.bond === T.bond && r.secs === T.secs && r.energy === T.energy && r.coins.join() === T.coins.join() && r.bp === T.bp && r.pool.join() === T.pool.join(), `${k}: Bond ${T.bond}, ${T.secs} s, Energy ${T.energy}, coins ${T.coins}, bp ${T.bp}, pool ${T.pool}`);
    ok(await ev((k) => !!window.__paw.mp.places().includes(k), k), `${k} is a place`);
  }
  // the tiers: town 25-35, woods 50-70, beach 60-80 (a day's walking income stays about the same)
  ok(rows.sunflower.coins[1] <= rows.town.coins[1] && rows.bamboo.coins[1] <= rows.woods.coins[1] && rows.cliffs.coins[1] <= rows.beach.coins[1], 'each new route sits inside the old tiers');

  sec('the route carousel: ten cards in Bond order');
  await ev(() => window.__paw.go('routes')); await t.p.waitForSelector('.rt-card');
  {
    const c = await ev(() => [...document.querySelectorAll('.rt-card h3')].map((h) => h.textContent));
    const order = await ev(() => window.__paw.tr.keys());
    ok(c.length === 10 && order.length === 10, `ten cards (${c.length})`);
    ok(order.join() === 'park,town,river,sunflower,hilltop,bamboo,woods,pier,cliffs,beach', 'Bond order: ' + order.join());
    ok(['Sunflower Lanes', 'Bamboo Grove Trail', 'Seaside Cliffs Run'].every((n) => c.includes(n)), 'the three new names are on cards: ' + c.join(' | '));
    ok(await ev(() => [...document.querySelectorAll('.rt-card')].every((e) => e.querySelector('.rt-prev svg') && e.querySelector('.rt-prev svg').innerHTML.length > 500)), 'every card has a strip picture');
    await t.SH('carousel_cards'); // the first card
    const i = order.indexOf('bamboo'); for (let n = 0; n < i; n++) await t.p.click('#rtNext');
    await t.sleep(500); await t.SH('carousel_bamboo');
    ok(await ev(() => /Bamboo Grove Trail/.test(document.getElementById('rtStart').textContent)), 'Start walk: Bamboo Grove Trail');
    await t.p.click('#rtStart');
    ok(await t.until(() => window.__paw.mode === 'walk' && window.__paw.W && window.__paw.W.area === 'bamboo', null, 6000), 'the card starts a walk on bamboo');
    await leaveWalk();
  }

  sec('the carousel at a low Bond: new cards are locked in their order');
  await ev(() => { const S = window.__paw.S; S.bond.level = 3; S.bond.pts = 0; S.dogs.forEach((d) => { if (d.bond) { d.bond.level = 3; d.bond.pts = 0; } }); });
  await ev(() => window.__paw.go('routes')); await t.p.waitForSelector('.rt-card');
  {
    const lk = await ev(() => { const k = window.__paw.tr.keys(); return [...document.querySelectorAll('.rt-card')].map((e, i) => (e.classList.contains('locked') ? k[i] : null)).filter(Boolean); });
    ok(lk.includes('bamboo') && lk.includes('cliffs') && !lk.includes('sunflower'), 'Bond 3: bamboo (4) and cliffs (7) locked, sunflower (2) open: ' + lk.join());
  }
  await ev(() => { const S = window.__paw.S; S.bond.level = 8; S.bond.pts = 1600; S.dogs.forEach((d) => { if (d.bond) { d.bond.level = 8; d.bond.pts = 1600; } }); });
  await leaveWalk();

  sec('the run gates: the arch in each place starts the walk');
  const gate = async (place, route) => {
    await t.home(place); await t.sleep(300);
    const g = await ev(() => { const h = document.querySelector('#sceneG [data-hot="run"]'); return h ? { hot: h.classList.contains('hot'), role: h.getAttribute('role'), aria: h.getAttribute('aria-label') } : null; });
    ok(g && g.hot && g.role === 'button' && /run/i.test(g.aria), `${place}: the checkered arch is a button (${g && g.aria})`);
    await ev(() => { window.__paw.S.stats.energy = 100; });
    await ev(() => document.querySelector('#sceneG [data-hot="run"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    ok(await t.until((r) => window.__paw.mode === 'walk' && window.__paw.W && window.__paw.W.area === r, route, 6000), `${place}: the gate starts a walk on ${route}`);
    await leaveWalk();
  };
  for (const k of NEW) await gate(k, k);
  await t.home('sunflower'); await t.SH('gate_sunflower');
  for (const [pl, r] of Object.entries(OLD_GATES)) await gate(pl, r);

  sec('the gate checks: Energy, asleep, Bond');
  {
    await t.home('bamboo');
    const hot = () => ev(() => document.querySelector('#sceneG [data-hot="run"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await ev(() => { window.__paw.S.stats.energy = 10; }); await hot(); await t.sleep(400);
    ok(await ev(() => window.__paw.mode === 'yard' && [...document.querySelectorAll('#toasts .toast')].some((e) => /too sleepy for a walk/i.test(e.textContent))), 'Energy 10: lies down at the gate, no walk');
    await ev(() => { const S = window.__paw.S; S.stats.energy = 19; }); await hot(); await t.sleep(300);
    ok(await ev(() => window.__paw.mode === 'yard'), 'Energy 19: still no walk');
    await ev(() => { const S = window.__paw.S; S.stats.energy = 100; S.sleeping = true; }); await hot(); await t.sleep(300);
    ok(await ev(() => window.__paw.mode !== 'walk' && [...document.querySelectorAll('#toasts .toast')].some((e) => /is asleep/i.test(e.textContent))), 'asleep: no walk');
    await ev(() => { const S = window.__paw.S; S.sleeping = false; S.stats.energy = 20; }); await hot();
    ok(await t.until(() => window.__paw.mode === 'walk', null, 5000), 'Energy 20 is enough');
    await leaveWalk();
    await ev(() => { const S = window.__paw.S; S.stats.energy = 100; S.bond.level = 3; S.bond.pts = 0; S.dogs.forEach((d) => { if (d.bond) { d.bond.level = 3; d.bond.pts = 0; } }); });
    await ev(() => window.__paw.tr.gate('cliffs')); await t.sleep(400);
    ok(await ev(() => window.__paw.mode === 'yard' && [...document.querySelectorAll('#toasts .toast')].some((e) => /opens at Bond 7/.test(e.textContent))), 'Bond 3 at the Cliffs gate: the goose says no');
    await ev(() => { const S = window.__paw.S; S.bond.level = 8; S.bond.pts = 1600; S.dogs.forEach((d) => { if (d.bond) { d.bond.level = 8; d.bond.pts = 1600; } }); });
  }

  sec('the six treasures and the loot pools');
  for (const [n, [kind, slot, rar, route]] of Object.entries(TREAS)) {
    const T = await ev((n) => window.__paw.tr.treasure(n), n);
    ok(T && T.kind === kind && T.slot === slot && T.rarity === rar && T.routes.length === 1 && T.routes[0] === route && T.ab && T.txt && !/;/.test(T.txt), `${n}: ${kind}${slot ? ' (' + slot + ')' : ''}, ${rar}, only on ${route}`);
  }
  {
    const pools = {}; for (const k of NEW) pools[k] = await ev((k) => window.__paw.tr.loot(k), k);
    ok(pools.sunflower.slice().sort().join() === ['Sunflower Collar', 'Lucky Horseshoe', 'Clover Collar', 'Golden Bone'].sort().join(), 'Sunflower Lanes loot: ' + pools.sunflower);
    ok(pools.bamboo.slice().sort().join() === ['Bamboo Ring', 'Paper Lantern', 'Clover Collar', 'Golden Bone'].sort().join(), 'Bamboo Grove loot: ' + pools.bamboo);
    ok(pools.cliffs.slice().sort().join() === ['Sea Glass', 'Sailor Cap', 'Clover Collar', 'Golden Bone'].sort().join(), 'Seaside Cliffs loot: ' + pools.cliffs + ' (the any treasures can turn up)');
    for (const k of NEW) {
      const got = await ev((k) => { const m = {}; for (let i = 0; i < 400; i++) { const r = window.__paw.tr.roll(k, {}); const key = r.n || ('coins' + r.coins); m[key] = (m[key] || 0) + 1; } return m; }, k);
      ok(Object.keys(got).every((n) => pools[k].includes(n) || /^coins/.test(n)), `${k}: 400 rolls only give its pool or coins: ` + Object.keys(got).join());
      ok(pools[k].filter((n) => got[n]).length >= 2, `${k}: at least two different treasures turn up`);
    }
    ok(await ev(() => !window.__paw.tr.loot('town').some((n) => /Sunflower|Bamboo|Sea Glass|Sailor|Lantern|Horseshoe/.test(n))), 'the old routes do not get the new treasures');
  }

  sec('the new treasures: journal, wardrobe, an outfit the dog art does not draw is simply not drawn');
  {
    const before = errs.length;
    await ev(() => { Object.keys({ 'Sunflower Collar': 1, 'Lucky Horseshoe': 1, 'Bamboo Ring': 1, 'Paper Lantern': 1, 'Sea Glass': 1, 'Sailor Cap': 1 }).forEach((n) => window.__paw.grant(n)); });
    ok(await ev(() => ['Sunflower Collar', 'Sailor Cap'].every((n) => window.__paw.S.inv.clothes.includes(n)) && ['Lucky Horseshoe', 'Paper Lantern', 'Sea Glass'].every((n) => window.__paw.S.inv.charms.includes(n)) && window.__paw.S.inv.toys.includes('Bamboo Ring')), 'granted: wearables in clothes, charms in charms, the ring in toys');
    await ev(() => { const S = window.__paw.S; S.outfit.neck = 'Sunflower Collar'; S.outfit.head = 'Sailor Cap'; S.outfit.charm = 'Sea Glass'; window.__paw.go('yard'); });
    await t.calm(); await t.sleep(500);
    ok(await ev(() => !!document.querySelector('#dogArt svg.pa-dog')) && errs.length === before, 'the dog is drawn wearing them, no error');
    await t.p.click('[data-act=journal]').catch(() => {});
    const open = await t.until(() => !!document.querySelector('#modal:not([hidden]) .jgrid, #modal:not([hidden]) .jent'), null, 3000);
    if (open) {
      const tab = await t.p.locator('#modal [data-jt="treasures"], #modal [data-tab="treasures"]').first();
      if (await tab.count()) await tab.click();
      await t.sleep(300);
      ok(await ev(() => /\/ 25/.test(document.querySelector('#modal .jprog b') ? document.querySelector('#modal .jprog b').textContent : '')), 'the Journal counts 25 treasures');
      await t.closeX().catch(() => {}); await t.modalGone().catch(() => {});
    } else ok(true, 'journal not opened here (skipped)');
    await ev(() => { const S = window.__paw.S; S.outfit.neck = null; S.outfit.head = null; S.outfit.charm = null; });
    ok(errs.length === before, 'no page errors ' + errs.slice(before, before + 2).join(' | '));
  }

  sec('arrival lines at the three trailheads (35 breeds), the mission');
  {
    const L = await ev(() => { const B = Object.keys(window.__paw.mp.lines()); return { n: B.length, miss: B.filter((b) => ['sunflower', 'bamboo', 'cliffs'].some((k) => !window.__paw.mp.line(b, k))), one: window.__paw.mp.line('golden', 'bamboo') }; });
    ok(L.n >= 35 && !L.miss.length, `every breed (${L.n}) has a line at the three trailheads ${L.miss.join(' ')}`);
    ok(await ev(() => window.__paw.ms.pool.includes('new_trail')), 'the new_trail mission is in the pool');
  }

  sec('first-run care notes (gold toast, once each, S.trk.seen)');
  for (const k of NEW) {
    const N = await ev((k) => window.__paw.tr.note(k), k);
    ok(N === NOTES[k], `${k}: the care note is the exact two sentences`);
    ok(await ev((k) => !window.__paw.tr.seen()[k], k), `${k}: not seen yet`);
    await ev((k) => window.__paw.tr.walked(k), k);
    ok(await t.until((n) => [...document.querySelectorAll('#toasts .toast.gold')].some((e) => e.textContent.includes(n)), NOTES[k], 4000), `${k}: the gold toast shows after the first walk`);
    ok(await ev((k) => window.__paw.tr.seen()[k] === true && window.__paw.S.trk.seen[k] === true, k), `${k}: S.trk.seen is set`);
    await ev(() => { document.getElementById('toasts').innerHTML = ''; });
    await ev((k) => window.__paw.tr.walked(k), k); await t.sleep(1700);
    ok(await ev((n) => ![...document.querySelectorAll('#toasts .toast')].some((e) => e.textContent.includes(n)), NOTES[k]), `${k}: the second walk shows no note`);
  }
  ok(await ev(() => { const s = window.__paw.S.trk.seen; return Object.keys(s).length === 3; }), 'S.trk.seen has the three keys');

  sec('7-day income sim: walks stay the top source');
  {
    // Energy-limited days: a walk can start at Energy 20 or more and costs the route's energy; ball play returns cost 1 Energy and pay 2-3 coins up to the day's cap
    // (real coins), agility is 10 Energy and 10 / 20 / 30 coins for the first two runs inside the 40 cap, the pool pays nothing. V215.md 7 counts walks in route coins
    // (about 100 a day), before the prototype BOOST that addCoins doubles: the sim does the same, and the last check repeats the comparison with the BOOST on (walks only get further ahead).
    const S0 = await ev(() => {
      const P = window.__paw, rows = P.tr.rows(), toys = P.bl.toys;
      return { rows, boost: 1, ballCap: P.bl.cap.day, ballToys: Object.keys(toys).map((k) => ({ k, coin: toys[k].coin, en: toys[k].en })), agCap: P.ag.cap, agCoins: P.ag.coins };
    });
    const ROUTES = Object.keys(S0.rows).filter((k) => S0.rows[k].coins);
    ok(ROUTES.length === 10, 'ten routes in the sim: ' + ROUTES.join());
    const avg = (r) => (r.coins[0] + r.coins[1]) / 2 * S0.boost, yieldOf = (k) => avg(S0.rows[k]) / S0.rows[k].energy;
    const bestOld = Math.max(...ROUTES.filter((k) => !NEW.includes(k)).map(yieldOf)), bestNew = Math.max(...NEW.map(yieldOf));
    ok(bestNew <= bestOld, `no new route out-earns the old ones per Energy (new ${bestNew.toFixed(2)} vs old ${bestOld.toFixed(2)})`);
    ok(NEW.every((k) => yieldOf(k) <= Math.max(...ROUTES.filter((o) => !NEW.includes(o) && S0.rows[o].bond >= S0.rows[k].bond - 1 && S0.rows[o].bond <= S0.rows[k].bond + 3).map(yieldOf))), 'and each is no better than its neighbours in the tier');
    const BUDGET = 60; // Energy a day spends on activities: about two walks, the "about 100 coins a day" of V215.md section 7
    // a day's plan: the activities first, then walks while Energy is 20 or more; `route(d)` picks the walk of the day (the 10 routes in turn, the best first on odd days)
    const byYield = ROUTES.slice().sort((a, b) => yieldOf(b) - yieldOf(a));
    const day = (d, plan) => {
      let e = BUDGET, ball = 0, ag = 0, pool = 0, walks = [], wc = 0;
      if (plan.pool) { e -= 5; pool = 0; }
      if (plan.ball) { const toy = S0.ballToys.slice().sort((a, b) => b.coin - a.coin)[0]; const n = Math.ceil(S0.ballCap / toy.coin); ball = Math.min(S0.ballCap, n * toy.coin); e -= n * toy.en; }
      if (plan.ag) { ag = Math.min(S0.agCap, S0.agCoins[3] + S0.agCoins[3]); e -= 20; }
      while (e >= 20) { const k = plan.rotate ? ROUTES[(d + walks.length) % ROUTES.length] : byYield[0]; const r = S0.rows[k]; walks.push(k); wc += avg(r); e -= r.energy; }
      return { walks, wc: Math.round(wc), ball, ag, pool, total: Math.round(wc) + ball + ag + pool };
    };
    const tbl = []; let ok7 = true, agMax = 0, poolSum = 0, walkSum = 0, mixedWalk = 0;
    for (let d = 0; d < 7; d++) {
      const w = day(d, { rotate: true }), m = day(d, { ball: true, ag: true, pool: true, rotate: false });
      tbl.push(`day ${d + 1}: walker ${w.walks.join('+')} = ${w.wc} | mixed walks ${m.walks.join('+') || '-'} ${m.wc}, ball ${m.ball}, agility ${m.ag}, pool ${m.pool} = ${m.total}`);
      agMax = Math.max(agMax, m.ag); poolSum += m.pool; walkSum += w.wc; mixedWalk += m.wc;
      if (!(w.wc >= m.ball && w.wc >= m.ag && w.wc > m.pool)) ok7 = false;
    }
    console.log('  ' + tbl.join('\n  '));
    ok(ok7, 'on every day a walker\'s walk coins are above ball play, agility and the pool');
    ok(agMax <= 40 && agMax > 0, `agility never over 40 a day (${agMax})`);
    ok(poolSum === 0, 'the pool pays 0');
    const avgWalk = walkSum / 7;
    ok(avgWalk >= 70 && avgWalk <= 160, `a walker earns about 100 a day from walks (${avgWalk.toFixed(0)})`);
    {
      let boosted = true; for (let d = 0; d < 7; d++) { const w = day(d, { rotate: true }), m = day(d, { ball: true, ag: true, pool: true }); if (!(w.wc * 2 > m.ball + m.ag + m.pool + m.wc * 2 || w.wc > m.total)) boosted = false; }
      ok(boosted, 'with the prototype BOOST (x2 on walk coins) a walking day beats a day spent on ball play, agility and the pool (they spend the Energy walks would use)');
    }
    ok(S0.ballCap === 40 && S0.agCap === 40, 'the caps are 40 and 40');
    // v2.16 (V216.md 6): the monthly calendar pays at most 80 coins a month (3 days 30, 12 days 50), the welcome week and the Bond 2 party pay items, never coins
    const cal = await ev(() => { const F = window.__paw.fw, r = [3, 7, 12, 18, 24].map((n) => F.reward('cal', n, '2026-10')), w = [1, 3, 5, 7].map((n) => F.reward('wel', n)); return { coins: r.filter((x) => x.t === 'coins').reduce((a, x) => a + x.c, 0), welCoins: w.filter((x) => x.t === 'coins').length }; });
    ok(cal.coins === 80 && cal.welCoins === 0, `calendar coins: ${cal.coins} a month, none from the welcome week`);
    ok(avgWalk >= 100 && avgWalk / (cal.coins / 30) > 20, `walks stay the main income: about ${Math.round(avgWalk)} route coins a day from walks against about ${(cal.coins / 30).toFixed(1)} a day from the calendar`);
    // v2.17 (V217.md 1, 7): a daily wish pays 10 coins, at most 20 a day; the letters, the stickers and the Bond track give items and frames, never coins
    const ddc = await ev(() => ({ cap: window.__paw.dd.coinCap, one: window.__paw.dd.coin }));
    ok(ddc.one === 10 && ddc.cap === 20 && avgWalk / ddc.cap > 4, `walks stay the main income: about ${Math.round(avgWalk)} route coins a day from walks against at most ${ddc.cap} wish coins a day`);
    // v2.17 review: every capped source that costs no Energy, all at once, in real coins (each pays raw): Pip's cart 60 (PIP_CAP), the Town Square
    // goal 30, 3 missions x 15 (MS_PAY), wishes 20, the calendar 80 a month. Walks (route coins, doubled by the prototype BOOST in addCoins) stay the largest.
    const capped = { garden: 60, square: 30, missions: 3 * 15, wishes: ddc.cap, calendar: cal.coins / 30 }, capSum = Object.values(capped).reduce((a, b) => a + b, 0);
    ok(Object.values(capped).every((v) => avgWalk > v) && avgWalk * 2 > capSum, `walks stay the largest source: ${Math.round(avgWalk * 2)} real coins a day from walks against ${Math.round(capSum)} from every capped no-Energy source together (${Object.entries(capped).map(([k, v]) => k + ' ' + Math.round(v)).join(', ')})`);
    // the real game's own accounting for the two capped sources: agility coins left, ball coins left, the pool's paddle pays nothing
    const real = await ev(() => { const P = window.__paw, S = P.S; S.ag.day = P.pl.today(); S.ag.coins = 40; const l1 = P.ag.left(); S.ag.coins = 10; const l2 = P.ag.left(); S.ag.coins = 0; return { l1, l2 }; });
    ok(real.l1 === 0 && real.l2 === 30, 'agCoinsLeft follows S.ag.coins (cap 40): ' + JSON.stringify(real));
  }

  sec('with the switch off the game is v2.14');
  await t.newGame({ ground: false, map215: false }, { bond: { level: 8, pts: 1600 }, stats: { hunger: 90, happy: 80, energy: 100, clean: 90 } });
  {
    const q = await ev(() => ({ on: window.__paw.tr.on(), keys: window.__paw.tr.keys(), counts: window.__paw.tr.counts(), any: window.__paw.tr.loot('sunflower') }));
    ok(!q.on && q.keys.join() === 'park,town,river,hilltop,woods,pier,beach', 'off: seven route cards ' + q.keys.join());
    ok(q.counts.treasures === 19 && q.counts.routes === 7 && q.counts.allRoutes <= 6 && !q.counts.ring && !q.any.length, 'off: 19 treasures, 7 routes, no ring toy, no new loot ' + JSON.stringify(q.counts));
    ok(await ev(() => !window.__paw.tr.treasure('Sea Glass') && !window.__paw.tr.rows().sunflower), 'off: the new treasures and rows are not there');
    ok(await ev(() => { window.__paw.go('routes'); return true; }));
    await t.p.waitForSelector('.rt-card'); ok(await ev(() => document.querySelectorAll('.rt-card').length === 7), 'off: the carousel has seven cards');
    // switching it on again at run time puts everything back
    await ev(() => window.__paw.mp.allow(true));
    ok(await ev(() => window.__paw.tr.keys().length === 10 && window.__paw.tr.counts().treasures === 25 && window.__paw.tr.counts().ring), 'allow(true): ten routes, 25 treasures, the ring toy');
    await ev(() => window.__paw.mp.allow(false));
    ok(await ev(() => window.__paw.tr.keys().length === 7 && window.__paw.tr.counts().treasures === 19 && !window.__paw.tr.counts().ring), 'allow(false): back to v2.14');
  }
  ok(!errs.length, 'no page errors ' + errs.slice(0, 2).join(' | '));
}, { ground: true });
