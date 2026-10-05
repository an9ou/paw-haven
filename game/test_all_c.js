// all_c (shard 3 of 5 of the old test_all.js): walk + treasure + garden + selling at Pip. Starts from a prepared save (bond 7, 1000 coins, 2 spinach seeds).
// Coverage: walk carousel, first-walk tutorial, runner, pause -> Head home early, results, back home; dev treasure;
// garden (yard patch opens it, plant 4 plots, water, dev +1 hour growth, harvest via dev "ready"), sell window at Pip (daily cart) + coins up.
require('./test_lib').run('all_c', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('prepared save: bond 7, 1000 coins, seeds');
  await t.newGame({}, { inv: { seeds: { carrot: 3, peas: 3, spinach: 2 } } }); const p = t.p;
  await t.home('yard');

  sec('walk: carousel, tutorial, runner, results');
  ok(await t.startWalk(true), 'walk carousel -> tutorial -> countdown'); ok((await t.mode()) === 'walk', 'runner (PawWalk) running'); await t.SH('12_runner');
  ok(await t.quitWalk(true), 'walk results (pause -> Head home early)'); ok((await t.mode()) === 'yard', 'back home after the walk'); await t.calm();
  await t.dev(async () => { await p.click('#dvTreasure'); }); ok(Object.keys((await S()).found).length >= 1, 'treasure granted (dev)');

  sec('garden');
  await p.click('#sceneG [data-hot=garden]'); ok(await t.untilMode('garden'), 'yard patch opens the garden'); await p.waitForSelector('.pg-tool[data-t="seeds"]');
  const planted = (i, ms) => t.until((i) => !!window.__paw.S.garden.plots[i].crop, i, ms || 4000);
  // planting = pick the seed, (off-season veil: yes), the dog digs a hole, tap the plot again to drop the seed. We repeat the tap until the crop is in.
  const plant = async (i, crop) => {
    await p.click('.pg-tool[data-t="seeds"]'); await p.click(`.pg-pk[data-c="${crop}"]`, { timeout: 8000 });
    for (let k = 0; k < 10; k++) {
      if (await planted(i, 600)) return true;
      if (await p.locator('.pg-veil [data-y]').count()) { await p.click('.pg-veil [data-y]'); continue; }
      await p.click(`.pg-plot[data-i="${i}"]`);
    }
    return planted(i, 2000);
  };
  await plant(0, 'carrot'); await plant(1, 'carrot'); await plant(2, 'peas'); await plant(3, 'spinach');
  await p.click('.pg-tool[data-t="water"]');
  for (const i of [0, 1, 2]) { await p.click(`.pg-plot[data-i="${i}"]`); await t.until((i) => window.__paw.S.garden.plots[i].water === 3, i, 4000); }
  let s = await S(); ok(s.garden.plots.slice(0, 4).every((x) => x.crop && x.water === 3), 'planted + watered 4 plots'); await t.SH('14_garden');
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'Esc leaves the garden');
  // v1.7.1: crops grow in real hours. 2 sunny dev hours grow the watered crops (carrots: 3 h, x1.5 in the sun); "all ready" does the rest.
  const g0 = (await S()).garden;
  await t.dev(async () => { await p.selectOption('#dvGW', 'sunny'); for (let i = 0; i < 2; i++) await p.click('#dvGHour'); });
  s = await S(); ok(s.garden.v === 2 && s.garden.plots[0].g > g0.plots[0].g && s.garden.plots[0].water < 3 && s.garden.plots.slice(0, 4).every((x) => x.g > 0), `dev +1 hour x2 (sunny): the watered crops grew (carrot g ${s.garden.plots[0].g.toFixed(2)}) and drank water (${s.garden.plots[0].water}/3)`);
  await t.dev(async () => { await p.click('#dvGReady'); });
  await p.click('#sceneG [data-hot=garden]'); ok(await t.untilMode('garden'), 'garden reopens'); await p.waitForSelector('.pg-plot[data-i="0"]');
  for (const i of [0, 1, 2, 3]) {
    await p.click(`.pg-plot[data-i="${i}"]`);
    await t.until((i) => !window.__paw.S.garden.plots[i].crop, i, 6000);
  }
  const sum = (id) => (s.inv.crops[id] || [0, 0, 0]).reduce((a, c) => a + c, 0);
  await t.until(() => Object.values(window.__paw.S.inv.crops || {}).reduce((n, a) => n + a.reduce((x, y) => x + y, 0), 0) >= 7, null, 6000);
  s = await S(); ok(sum('carrot') >= 4 && sum('peas') >= 2 && sum('spinach') >= 1, `harvest: carrot ${sum('carrot')}, peas ${sum('peas')}, spinach ${sum('spinach')}`);
  await p.click('.pg-done'); ok(await t.untilMode('yard'), 'garden: Done leaves it');

  sec('sell crops at Pip');
  await t.travel('market'); await p.click('#placeBtns [data-sh=sprout]'); await p.waitForSelector('[data-ptab=sell]'); await p.click('[data-ptab=sell]');
  const c1 = (await S()).coins; await p.locator('[data-sell^="peas"]').first().click(); await p.waitForSelector('.buyveil');
  ok(/Coins after: /.test(await p.textContent('.bb-sum')), 'sell window: Coins after'); ok(/Pip's cart today: 0 \/ 60/.test(await p.textContent('.buybox')), "sell window shows Pip's daily cart (0 / 60)"); await t.SH('10a_sell_window');
  await p.click('.bb-yes'); ok(await t.until((c) => window.__paw.S.coins > c, c1), 'sold peas at Pip'); await t.closeX();
});
