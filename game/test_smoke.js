// SMOKE (<= 90 s): the quick "is anything broken" loop. node game/run_tests.js smoke
// Covers: load -> adopt; open + close every action-bar popup (Feed, Play, Care, Wardrobe, Journal; Walk and Map screens);
//         feed -> pet; travel to 2 places via the map; open a shop + the purchase window; start a walk -> "Head home early";
//         open one toy -> close it; no console errors.
require('./test_lib').run('smoke', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('load, adopt');
  const p = await t.boot();
  ok(await p.locator('#tNew').count() === 1, 'title screen loads');
  await t.adopt({ sex: 'girl' });
  let s = await S();
  ok(s.dogs.length === 1 && s.dog.sex === 'female' && (await t.mode()) === 'yard', 'adopted a girl, in the yard');
  ok((await p.$$eval('#bar .act', (els) => els.length)) === 7, '7 action buttons');
  await t.patch({ bond: { level: 4, pts: 500 }, coins: 500, stats: { hunger: 40, happy: 70, energy: 90, clean: 90 } });

  sec('every popup opens and closes');
  for (const [a, sel] of [['feed', '[data-food]'], ['play', '[data-play]'], ['care', '[data-care=bed]']]) {
    await p.click(`[data-act=${a}]`); ok(await t.waitPop(true) && await p.locator(sel).count() >= 1, `${a}: popup opens`);
    await p.click(`[data-act=${a}]`); ok(await t.waitPop(false), `${a}: second tap closes it`);
  }
  await p.click('[data-act=feed]'); await t.waitPop(true); await p.keyboard.press('Escape'); ok(await t.waitPop(false), 'Esc closes a popup');
  await p.click('[data-act=care]'); await t.waitPop(true); await p.mouse.click(60, 150); ok(await t.waitPop(false), 'backdrop click closes a popup');
  await p.click('[data-act=wardrobe]'); ok(await p.waitForSelector('.ward').then(() => true), 'wardrobe opens'); await t.closeX(); ok(await t.modalGone(), 'wardrobe closes');
  await p.click('[data-act=journal]'); ok(await p.waitForSelector('.panel.journal').then(() => true), 'journal opens'); await t.closeX(); ok(await t.modalGone(), 'journal closes');
  await p.click('[data-act=walk]'); await p.waitForSelector('#rtStart'); ok(await t.until(() => document.querySelectorAll('.rt-card').length >= 1), 'walk: route carousel opens');
  await p.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'walk: Esc leaves the carousel');
  await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]'); ok((await t.mode()) === 'map', 'map opens');
  await p.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'map: Esc closes it');

  sec('feed, then pet');
  await p.click('[data-act=feed]'); await t.waitPop(true); const h0 = (await S()).stats.hunger;
  await p.click('[data-food="Basic Kibble"]');
  ok(await t.until((h0) => window.__paw.S.stats.hunger > h0, h0, 8000), 'feeding raises Hunger'); ok(await t.waitPop(false), 'tapping food closes the popup');
  await t.calm();
  const b0 = (await S()).bond.pts; ok(await t.pet((b0) => window.__paw.S.bond.pts > b0, b0), 'rubbing pets the dog (+Bond)');

  sec('travel to two places via the map');
  for (const k of ['park', 'river']) { await t.travel(k); ok((await S()).place === k, 'travelled to ' + k); }
  await t.travel('market'); ok((await S()).place === 'market' && (await t.mode()) === 'market', 'travelled to the market');

  sec('shop + purchase window');
  await p.click('#placeBtns [data-sh=kibble]'); await p.waitForSelector('[data-buy="Basic Kibble"]');
  const k0 = (await S()).inv.food['Basic Kibble'] || 0;
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await p.click('[data-qq="5"]');
  ok(await t.until(() => /Total: [\d,]+ coins/.test(document.querySelector('.bb-sum').textContent) && document.querySelector('.bb-in').value === '5'), 'purchase window shows the x5 total');
  await p.click('.bb-yes'); await p.waitForSelector('.buyveil', { state: 'detached' });
  ok((await S()).inv.food['Basic Kibble'] === k0 + 5, 'bought 5 Basic Kibble');
  await t.closeX(); await t.home('yard'); await t.travel('yard');

  sec('walk: start, Head home early');
  ok(await t.startWalk(), 'walk starts');
  ok(await t.quitWalk(true), 'Head home early -> results -> OK'); ok((await t.mode()) === 'yard', 'back home after the walk');

  sec('toy');
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play="toy:Tennis Ball"]');
  ok(await t.untilMode('toy'), 'PawToys opens'); await p.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'Esc closes the toy');
});
