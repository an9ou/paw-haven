// v29_flows (V29.md section 3, POLISH): one combined pass with the daily missions and Gerald's walkthrough ON (prefs.msTest, prefs.gdTest)
// next to the older flows (adopt, feed, pet, play, a walk, a shop, travel), so the new systems are exercised together with the old ones.
// Under the harness missions and the walkthrough stay off unless a suite opts in, so no other suite ever runs them next to the old flows.
// node game/run_tests.js v29_flows
require('./test_lib').run('v29_flows', async (t) => {
  const { ok, sec, ev, S } = t;
  const guide = () => ev(() => window.__paw.S.guide.step);
  const atStep = (i) => t.until((i) => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden && +c.dataset.step === i && window.__gd.active(); }, i, 8000);
  const cardGone = () => t.until(() => { const c = document.querySelector('#gdLayer .gd-card'); return !c || c.hidden; }, null, 5000);
  const next = async () => { await t.p.click('#gdLayer .gd-next'); };
  const mis = () => ev(() => window.__paw.S.missions.list.map((m) => [m.id, m.p, m.n, !!m.done].join(':')).join(' '));
  const prog = (id) => ev((id) => { const m = window.__paw.S.missions.list.find((x) => x.id === id); return m ? m.p : -1; }, id);

  sec('adopt with missions and the walkthrough on');
  await t.boot({ prefs: { msTest: true, gdTest: true } }); const p = t.p;
  await t.adopt({ sex: 'girl' });
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 40, happy: 70, energy: 90, clean: 90 }, inv: { food: { 'Basic Kibble': 6 } } });
  await t.calm(); await t.freezeMotion(true);
  ok(await ev(() => !!window.__paw.ms && window.__gd.active()), 'missions and the walkthrough are both on');
  ok(await atStep(0), 'Gerald says hello (step 0)');
  let s = await S();
  ok(s.missions.list.length === 3 && s.dogs.length === 1 && s.guide.step === 0, 'three missions rolled, one dog, guide at step 0');
  ok(await ev(() => !!document.querySelector('#msCardG') && document.querySelector('#msCardG').dataset.done === '0'), 'the yard clipboard shows 0/3');
  await ev(() => window.__paw.ms.force(['feed2', 'pet', 'walk']));
  ok(await mis() === 'feed2:0:2:false pet:0:1:false walk:0:1:false', 'missions set for the pass: ' + await mis());

  sec('feed (twice): Gerald steps on, the mission counts');
  await next(); ok(await atStep(1), 'step 1 (feed)');
  const feedOnce = async () => {
    const k0 = (await S()).inv.food['Basic Kibble'];
    await t.retryUntil(async () => { if (!(await p.locator('#dock .tray [data-food]').count())) await p.click('[data-act=feed]'); await t.waitPop(true); await p.click('[data-food="Basic Kibble"]'); }, (k) => window.__paw.S.inv.food['Basic Kibble'] < k, k0);
    await t.waitPop(false); await t.until(() => !window.__paw.shop.busy, null, 8000); await t.calm();
  };
  await feedOnce();
  ok(await t.until(() => window.__paw.S.guide.step === 2, null, 6000), 'the first feed moves Gerald to step 2 (pet)');
  ok(await prog('feed2') === 1, 'feed mission 1 of 2');
  await t.until(() => !document.querySelector('#toasts .toast'), null, 8000); await t.toasts();
  await feedOnce();
  ok(await t.until(() => window.__paw.S.missions.list[0].done, null, 6000), 'the second feed finishes the mission');
  ok(await ev(() => window.__paw.ms.queue > 0 && window.__gd.active()), 'its toast waits while Gerald is on (the two systems share the screen politely)');

  sec('pet');
  await t.until(() => !document.querySelector('#toasts .toast'), null, 8000); await t.toasts(); await t.calm();
  const b0 = (await S()).bond.pts;
  ok(await t.pet(() => window.__paw.S.guide.step >= 3), 'rubbing the dog moves Gerald on to step 3');
  ok((await S()).bond.pts > b0, 'petting gave Bond');
  ok(await t.until(() => window.__paw.S.missions.list[1].done, null, 6000), 'the pet mission is done');
  ok(await atStep(3), 'step 3 (nap) is showing'); await next();

  sec('map, travel, shop (Market Street)');
  ok(await atStep(4), 'step 4 (map)');
  await p.click('[data-act=map]'); await t.untilMode('map');
  ok(await t.until(() => window.__paw.S.guide.step === 5, null, 4000), 'entering the map moves Gerald to step 5');
  await p.keyboard.press('Escape'); await t.untilMode('yard'); await t.calm();
  await ev(() => window.__paw.ms.force(['travel', 'buy', 'toy']));
  await t.until(() => window.__paw.S.missions.list.map((m) => m.id).join() === 'travel,buy,toy', null, 3000);
  await t.travel('dogpark'); ok((await S()).place === 'dogpark', 'travelled to the Dog Park');
  ok(await t.until(() => window.__paw.S.missions.list[0].done, null, 6000), 'the Dog Park visit mission is done');
  await t.travel('market'); ok((await t.mode()) === 'market', 'on Market Street');
  await p.click('#placeBtns [data-sh=kibble]'); await p.waitForSelector('[data-buy="Basic Kibble"]');
  const k0 = (await S()).inv.food['Basic Kibble'] || 0;
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await p.click('[data-qq="5"]');
  ok(await t.until(() => /Total: [\d,]+ coins/.test(document.querySelector('.bb-sum').textContent) && document.querySelector('.bb-in').value === '5'), 'the purchase window shows the x5 total');
  await p.click('.bb-yes'); await p.waitForSelector('.buyveil', { state: 'detached' });
  ok((await S()).inv.food['Basic Kibble'] === k0 + 5, 'bought 5 Basic Kibble');
  ok(await t.until(() => window.__paw.S.missions.list[1].done, null, 6000), 'the Market Street shopping mission is done');
  await t.closeX(); await t.home('yard'); await t.travel('yard'); await t.calm();

  sec('play (a toy), then the walk with Gerald at step 5');
  await ev(() => window.__paw.go('toy', 'Tennis Ball')); // v2.10: the Tennis Ball card starts ball play; the room game is reached directly
  ok(await t.untilMode('toy'), 'the toy opens'); await p.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'Esc closes the toy');
  ok(await cardGone() || await atStep(5), 'Gerald is on step 5 (walk) or tucked away');
  ok(await t.startWalk(true), 'the walk starts');
  ok(await t.until(() => window.__paw.S.guide.step === 6, null, 4000), 'starting the walk moves Gerald to step 6');
  ok(await t.quitWalk(true), 'Head home early, results closed');
  await t.calm();

  sec('the rest of the walkthrough, the missions card and the stamp');
  for (const i of [6, 7, 8]) { ok(await atStep(i), 'step ' + i); await next(); }
  ok(await atStep(9), 'step 9 (done)'); await next();
  ok(await cardGone() && !!(await S()).guide.done, 'Gerald says goodbye and the walkthrough is done');
  ok(await t.waitToast(/Mission done: Feed twice\. \+15 coins\./, 12000), 'the held mission toast shows once Gerald is gone');
  await ev(() => window.__paw.ms.force(['feed2', 'pet', 'bath'])); await ev(() => { window.__paw.ms.act('feed', {}); window.__paw.ms.act('feed', {}); window.__paw.ms.act('pet', {}); window.__paw.ms.act('bath', {}); });
  ok(await t.until(() => window.__paw.S.missions.stamps === 1, null, 4000), 'all three done: a stamp');
  s = await S();
  ok(s.missions.list.every((m) => m.done) && s.dogs.length === 1, 'every mission ticked, still one dog');
  await p.click('#msCardG > rect', { force: true });
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-pop'), null, 4000), 'the clipboard opens the Missions sheet'); await t.closeX(); ok(await t.modalGone(), 'the sheet closes');
  ok(await t.until(() => window.__paw.S.dog.bond.level >= 1 && window.__paw.S.coins > 0, null, 1000), 'the save is sound (Bond, coins)');
});
