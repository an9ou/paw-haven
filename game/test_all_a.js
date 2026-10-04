// all_a (shard 1 of 5 of the old test_all.js): the first-hour loop, from a brand new game.
// COVERAGE CHECKLIST for the whole old test_all.js (every item lives in exactly one shard):
//   all_a: title screen; adoption needs a sex; name modal; intro; new save (1 girl, genes, seed packets); no popup over the scene; 7 action buttons;
//          Feed / Play / Care popups; tapping food closes the popup; feed toast; Esc + backdrop close; rubbing pets (+Bond);
//          bath (mode, clean 100); toy (PawToys opens); settings (volume sliders + mute); map (no bar, you-are-here pin, tooltip, Esc);
//          travel park/river/woods/beach; beach dig; away from home (meals greyed + Go home, snack from the hand, forced poop + scoop, forced pee).
//   all_b: market: kibble shop, purchase window (summary, x5, can't afford, Esc, arrow keys, backdrop), pantry, boutique, wardrobe popup,
//          Barkitecture beds, Pip's Sprout Cart (buy seeds).
//   all_c: walk (carousel, tutorial, runner, results, back home); dev treasure; garden (open, plant, water, harvest); sell crops at Pip (sell window).
//   all_d: kitchen (cook 3 recipes, new recipe, onion safety, toasts at the bottom); dishes (greyed away from home, 2 a day, buff chip, limit message);
//          house: bed nap with bonus; indoor accident; journal (popup, Garden, Recipes, Profile tabs).
//   all_e: old save: sex prompt + seed gift once; v1.7: adopt each of the 4 new breeds (carousel has 10, art, adopted + drawn).
require('./test_lib').run('all_a', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('title, adoption, intro');
  const p = await t.boot();
  await t.SH('01_title');
  await p.click('#tNew'); await p.waitForSelector('#aAdopt');
  await p.click('#aAdopt'); ok(await t.waitToast(/Pick Boy or Girl/), 'adoption needs a sex');
  await p.click('#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk');
  ok(/Name your girl/.test(await p.textContent('.panel h2')), 'name modal: ' + await p.textContent('.panel h2'));
  await p.click('#nOk'); await t.intro(); await t.calm();
  let s = await S(); ok(s.dogs.length === 1 && s.dog.sex === 'female' && s.dog.genes && s.inv.seeds.carrot === 3, 'new save: one girl, genes, seed packets');
  ok((await ev(() => getComputedStyle(document.getElementById('dock')).display)) === 'none', 'no popup: the scene is fully visible');
  ok((await p.$$eval('#bar .act', (els) => els.length)) === 7, '7 action buttons'); await t.SH('02_yard');

  sec('popups, feeding, petting');
  await ev(() => { window.__paw.S.stats.hunger = 30; });
  await p.click('[data-act=feed]'); ok(await t.waitPop(true), 'Feed popup'); await t.SH('03_feed_popup');
  await p.click('[data-food="Basic Kibble"]'); ok(await t.waitPop(false), 'tapping food closes the popup');
  ok(await t.waitToast(/\b(She|Her|her)\b|^Gone\./, 10000), 'feed toast (pronoun lines use she/her)');
  await p.click('[data-act=play]'); ok(await t.waitPop(true), 'Play popup'); await p.keyboard.press('Escape'); await t.waitPop(false);
  await p.click('[data-act=care]'); ok(await t.waitPop(true) && await p.locator('[data-care=bed]').count() === 1, 'Care popup with Bed'); await p.mouse.click(60, 150);
  ok(await t.waitPop(false), 'backdrop closes the popup');
  const b0 = (await S()).bond.pts;
  ok(await t.pet((b0) => window.__paw.S.bond.pts > b0, b0), 'rubbing pets the dog (+Bond)');

  sec('bath, toy, settings');
  await ev(() => { window.__paw.S.stats.clean = 30; });
  await p.click('[data-act=care]'); await t.waitPop(true); await p.click('[data-care=bath]'); ok(await t.untilMode('bath'), 'bath mode');
  for (let i = 0; i < 25; i++) await p.keyboard.press(' ');
  ok(await t.until(() => window.__paw.S.stats.clean >= 99 && window.__paw.mode === 'yard', null, 12000), 'bath done: clean 100'); await t.calm();
  await p.click('[data-act=play]'); await t.waitPop(true);
  if (await p.locator('[data-play="toy:Tennis Ball"]').count()) { await p.click('[data-play="toy:Tennis Ball"]'); ok(await t.untilMode('toy'), 'PawToys opens'); await t.SH('04_toy'); await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); }
  else ok(false, 'Tennis Ball toy available');
  await p.click('#gearBtn'); await p.waitForSelector('#vol-music'); ok(await p.locator('#vol-music').count() === 1 && await p.locator('#setMute').count() === 1, 'settings: volume sliders + mute'); await t.closeX();

  sec('map, places, beach dig');
  await t.dev(async () => { for (let i = 0; i < 7; i++) await p.click('#dvBond'); await p.click('#dvCoins'); await p.click('#dvFill'); }); await t.luWait(); await t.calm();
  await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]');
  ok((await ev(() => document.getElementById('bar').hidden)) && !(await ev(() => document.getElementById('mapPin').hidden)), 'map: no tray/bar, you-are-here pin');
  await ev(() => window.__paw.mapTo('park')); await p.hover('[data-area=park]');
  ok(await t.until(() => /Sunny Park: go hang out/.test(document.getElementById('mapTip').textContent)), 'map tooltip'); await t.SH('05_map');
  await p.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'Esc leaves the map');
  for (const k of ['park', 'river', 'woods', 'beach']) { await t.travel(k); ok((await S()).place === k, 'travelled to ' + k); }
  await t.SH('06_beach'); await p.click('#placeBtns [data-pb=dig]'); ok(await t.until(() => window.__paw.S.daily.beachDig, null, 8000), 'beach dig');
  ok(await t.waitToast(/Dug up|\+\d+ coins/, 8000), 'beach dig result toast'); // busy flag clears right after this toast

  sec('away from home: snacks only, potty');
  await t.travel('park');
  await ev(() => { const S = window.__paw.S; S.stats.hunger = 30; S.inv.food['Basic Kibble'] = 3; S.inv.food['Bone-shaped Biscuit'] = 3; });
  await p.click('[data-act=feed]'); await t.waitPop(true);
  ok(await p.locator('[data-food="Basic Kibble"].off').count() === 1 && await p.locator('#feedHome').count() === 1, 'park: meals greyed + Go home');
  await t.toasts(); await p.click('[data-food="Basic Kibble"]', { force: true }); ok(await t.waitToast(/Meals are served at home/), 'park: meal blocked');
  const h0 = (await S()).stats.hunger; await p.click('[data-food="Bone-shaped Biscuit"]'); ok(await t.until((h0) => window.__paw.S.stats.hunger > h0, h0, 8000), 'park: snack from the hand');
  ok(await t.retryUntil(() => t.dev(async () => { await p.click('#dvPoop'); }), () => (window.__paw.S.messes.park || []).length === 1), 'forced poop'); await t.SH('07_poop');
  const c0 = (await S()).coins; await p.click('#messG [data-mi="0"]'); ok(await t.until((c0) => (window.__paw.S.messes.park || []).length === 0 && window.__paw.S.coins > c0, c0, 5000), 'scooped: Good citizen');
  ok(await t.retryUntil(() => t.dev(async () => { await p.click('#dvPee'); }), () => (window.__paw.S.messes.park || []).length === 1), 'forced pee');
  await p.click('#messG [data-mi="0"]'); ok(await t.until(() => (window.__paw.S.messes.park || []).length === 0, null, 5000), 'pee flushed');
});
