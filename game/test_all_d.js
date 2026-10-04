// all_d (shard 4 of 5 of the old test_all.js): kitchen, dishes, house (bed nap, indoor accident), journal.
// Starts from a prepared save: bond 7, harvested crops (carrot/peas/spinach), pantry (oats/rice/egg/chicken), Plaid Pillow owned + equipped.
// Coverage: kitchen opens from the house, cook 2 known recipes + discover Spinach Scramble, toasts sit at the bottom on module screens,
// onion bounces out of the pot, kitchen closes; dishes greyed away from home, 2 dishes a day + buff chip + limit message;
// bed nap with the bed bonus, wake, indoor accident + scoop; journal popup + Garden / Recipes / Profile tabs.
require('./test_lib').run('all_d', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('prepared save');
  await t.newGame({}, { inv: { crops: { carrot: [3, 0, 0], peas: [2, 0, 0], spinach: [1, 0, 0] }, pantry: { oats: 3, rice: 1, egg: 1, chicken: 1 } } }); const p = t.p;
  await ev(() => { const S = window.__paw.S; S.beds = [...new Set([...(S.beds || []), 'Plaid Pillow'])]; S.bed = 'Plaid Pillow'; window.__paw.saveNow(); });
  await t.home('yard');

  sec('kitchen, dishes');
  await p.click('#placeBtns [data-pb=house]'); await t.until(() => window.__paw.S.place === 'house' && !document.querySelector('.onway'), null, 15000); await t.lu(); await t.calm();
  await p.click('#sceneG [data-hot=kitchen]'); ok(await t.untilMode('kitchen'), 'house hotspot opens the kitchen'); await p.waitForSelector('[data-ing="carrot"]');
  // The cook game runs a 700 ms + 1.6 s dial per step. We press the on-screen Tap! button as soon as a step is live (any timing is fine for these checks;
  // a DOM click does not depend on keyboard focus) until the result card shows.
  const cook = async (ids) => {
    for (const id of ids) await p.click(`[data-ing="${id}"]`);
    await t.until((n) => document.querySelectorAll('.pk-fullslot').length === n, ids.length, 6000);
    for (let attempt = 0; attempt < 4; attempt++) {
      await p.click('.pk-btn.pk-go:has-text("Cook!")');
      if (await t.until(() => !!document.querySelector('.pk-tap') || !!document.querySelector('.pk-rbtns'), null, 4000)) break;
    }
    await p.waitForFunction(() => { const b = document.querySelector('.pk-tap'); if (b && !b.disabled) b.click(); return !!document.querySelector('.pk-rbtns'); }, null, { timeout: 60000, polling: 100 });
    await p.click('.pk-rbtns .pk-btn:has-text("Cook more")'); await p.waitForSelector('[data-ing="carrot"]');
  };
  await t.toasts(); await cook(['carrot', 'oats']); await cook(['chicken', 'rice', 'carrot', 'peas']); await cook(['egg', 'spinach']);
  let s = await S(); ok(s.inv.dishes.length === 3 && s.recipes.known.includes('spinach-scramble'), 'cooked 2 recipes + discovered Spinach Scramble');
  ok(await ev(() => document.getElementById('toasts').style.bottom === '18px'), 'module screen: toasts sit at the bottom centre'); await t.SH('15_kitchen');
  await p.click('[data-pf="onion"]'); ok(await t.until(() => window.__paw.S.safetySeen.includes('onion'), null, 8000), 'onion bounces out of the pot');
  if (await p.locator('.pk-note .pk-btn').count()) await p.locator('.pk-note .pk-btn').first().click();
  await p.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'kitchen closes back to the house'); await t.calm();
  await t.travel('park'); await p.click('[data-act=feed]'); await t.waitPop(true); ok(await p.locator('[data-dish].off').count() >= 1, 'park: dishes greyed'); await p.click('#trayX'); await t.waitPop(false);
  await t.travel('yard'); await ev(() => { window.__paw.S.stats.hunger = 20; });
  for (let i = 0; i < 3; i++) {
    const before = (await S()).dishLog.count; await t.toasts();
    // a feed click is ignored while the dog is still finishing the last meal, so open the tray + tap a dish again until it counts (or the daily limit message shows)
    const done = await t.retryUntil(async () => {
      if (!(await t.popVisible())) await p.click('[data-act=feed]');
      await t.waitPop(true); await p.locator('[data-dish]').first().click();
    }, (b) => window.__paw.S.dishLog.count > b || window.__toasts.some((x) => /Treats are extras/.test(x)), before, { tries: 14, each: 1200 });
    ok(done, `dish ${i + 1}: eaten or limit message`);
    await t.until(() => window.__paw.S.bowl == null, null, 8000);
    if (await t.popVisible()) { await p.click('#trayX'); await t.waitPop(false); }
  }
  s = await S(); ok(s.dishLog.count === 2 && !!s.buff && !(await p.locator('#buffChip[hidden]').count()), 'dishes: 2 a day, buff chip'); ok(await t.waitToast(/Treats are extras/), 'dish limit message'); await t.SH('16_buff');

  sec('house: bed nap, accident');
  await p.click('#placeBtns [data-pb=house]'); await t.until(() => window.__paw.S.place === 'house' && !document.querySelector('.onway'), null, 15000); await t.lu();
  await ev(() => { window.__paw.S.stats.energy = 40; }); await t.calm();
  await p.click('[data-act=care]'); await t.waitPop(true); await p.click('[data-care=sleep]');
  ok(await t.until(() => window.__paw.S.sleeping && /Plaid Pillow: \+25% indoors, \+5% bed/.test(document.getElementById('dock').textContent), null, 8000), 'nap on the Plaid Pillow with bed bonus'); await t.SH('17_nap');
  await p.click('#wakeBtn'); ok(await t.until(() => !window.__paw.S.sleeping, null, 8000), 'woke up');
  await t.dev(async () => { await p.click('#dvAccident'); });
  ok(await t.until(() => window.__paw.S.potty.accidents === 1 && (window.__paw.S.messes.house || []).length === 1, null, 20000), 'indoor accident');
  await p.click('#messG [data-mi="0"]'); await t.until(() => (window.__paw.S.messes.house || []).length === 0, null, 5000);

  sec('journal');
  await p.click('[data-act=journal]'); ok(await p.waitForSelector('.panel.journal').then(() => true), 'Journal popup'); await t.SH('18_journal');
  await p.click('[data-jt=garden]'); ok(await t.until(() => /Open garden/.test(document.querySelector('.panel').textContent)), 'Garden tab');
  await p.click('[data-jt=recipes]'); ok(await t.until(() => /Spinach Scramble/.test(document.querySelector('.panel').textContent)), 'Recipes tab');
  await p.click('[data-jt=profile]'); await p.waitForSelector('.profile'); const pf = await p.textContent('.profile'); ok(/old/.test(pf) && /Potty stats: Scooped: \d+\. Accidents indoors: 1/.test(pf), 'Profile: age + potty stats'); await t.SH('19_profile'); await t.closeX();
});
