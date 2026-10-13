// v2.4 SHOP: the new items in their shops (reward items never), buying, the food safety tip once, the feeding / petting / nap / fashion perks,
// the Pyjamas at nap time and the Wardrobe toggle, Sun Hat and Squeaky Hedgehog from rollTreasure, the Cozy Hoodie at 14 care days, the Knit Scarf letter, the purchase window arrow keys.
// node game/run_tests.js v24_shop
require('./test_lib').run('v24_shop', async (t) => {
  const { ok, sec, ev, S, SH } = t;
  const p = () => t.p;
  await t.newGame({ sex: 'girl' }, { bond: { level: 10, pts: 9000 }, coins: 20000, stats: { hunger: 30, happy: 60, energy: 50, clean: 90 } });
  // the item tables, read from the shop popups themselves
  const cards = () => ev(() => [...document.querySelectorAll('#modal .shopgrid .sitem > b')].map((b) => b.textContent));

  await t.home(); await ev(() => window.__paw.ms.force(['bath', 'nap', 'treasure'])); // missions that nothing here completes (a mission pays coins)

  sec('Kibble Corner: the 8 new foods with their safety tip line, the 5 new shop toys');
  await t.home('market'); await t.freezeMotion(true);
  await ev(() => window.__paw.shop.shop('kibble')); await p().waitForSelector('[data-tab=food]'); await p().click('[data-tab=food]');
  const FOODS = ['Carrot Sticks', 'Apple Slices', 'Blueberry Bites', 'Seedless Watermelon Cubes', 'Sweet Potato Chews', 'Pumpkin Purée', 'Turkey Meatballs', 'Frozen Pupsicle'];
  await t.until(() => !!document.querySelector('[data-buy="Frozen Pupsicle"]'));
  let c = await cards(); ok(FOODS.every((n) => c.includes(n)), 'all 8 new foods in the Food tab');
  const tips = await ev(() => [...document.querySelectorAll('#modal .sitem')].filter((s) => s.querySelector('.sh-tip')).map((s) => [s.querySelector('b').textContent, s.querySelector('.sh-tip').textContent]));
  ok(tips.length === 8 && tips.every(([n, tp]) => FOODS.includes(n) && (tp.match(/[.!?]/g) || []).length === 2 && !tp.includes(';')), 'each new food shows its two-sentence safety tip as a small line: ' + tips.length);
  await SH('01_kibble_food');
  await p().click('[data-tab=toys]'); await t.until(() => !!document.querySelector('[data-buy="Agility Tunnel"]'));
  c = await cards(); ok(['Snuffle Mat', 'Treat Cone', 'Bubble Machine', 'Paddling Pool', 'Agility Tunnel'].every((n) => c.includes(n)) && !c.includes('Squeaky Hedgehog'), 'the 5 new shop toys, no Squeaky Hedgehog (treasure)');
  await SH('02_kibble_toys');

  sec('buy a food, a toy');
  await p().click('[data-tab=food]'); await p().waitForSelector('[data-buy="Carrot Sticks"]');
  let s0 = await S(); await t.buy('Carrot Sticks', 3); let s1 = await S();
  ok(s1.inv.food['Carrot Sticks'] === 3 && s0.coins - s1.coins === 12, 'bought 3 Carrot Sticks for 12 coins');
  for (const n of ['Frozen Pupsicle', 'Turkey Meatballs', 'Apple Slices']) { await p().waitForSelector(`[data-buy="${n}"]`); await t.buy(n, 2); }
  await p().click('[data-tab=toys]'); await p().waitForSelector('[data-buy="Snuffle Mat"]');
  await t.buy('Snuffle Mat'); ok((await S()).inv.toys.includes('Snuffle Mat'), 'bought the Snuffle Mat');
  await t.closeX();

  sec('Bow-Wow Boutique: the 8 new shop outfits, never the reward ones; buy one');
  await ev(() => window.__paw.shop.shop('boutique')); await t.until(() => !!document.querySelector('#modal .shopgrid'));
  c = await cards();
  ok(['Sailor Collar', 'Chef Hat', 'Tutu', 'Cowboy Hat', 'Pyjamas', 'Bumblebee Suit', 'Wizard Hat', 'Happi Coat'].every((n) => c.includes(n)), 'all 8 new shop outfits');
  ok(!['Cozy Hoodie', 'Knit Scarf', 'Astronaut Helmet', 'Sun Hat'].some((n) => c.includes(n)), 'no Cozy Hoodie, Knit Scarf, Astronaut Helmet or Sun Hat');
  await SH('03_boutique');
  await t.buy('Pyjamas'); await p().waitForSelector('.confirm .no'); await p().click('.confirm .no');
  ok((await S()).inv.clothes.includes('Pyjamas') && (await S()).outfit.body !== 'Pyjamas', 'bought the Pyjamas (Later: not worn)');
  for (const n of ['Wizard Hat', 'Chef Hat', 'Bumblebee Suit', 'Happi Coat', 'Sailor Collar', 'Cowboy Hat', 'Tutu']) { await p().waitForSelector(`[data-buy="${n}"]`); await t.buy(n); await p().waitForSelector('.confirm .no'); await p().click('.confirm .no'); }
  ok((await ev(() => ['Wizard Hat', 'Chef Hat', 'Bumblebee Suit', 'Happi Coat', 'Sailor Collar', 'Cowboy Hat', 'Tutu'].every((n) => window.__paw.S.inv.clothes.includes(n)))), 'bought the other seven outfits');
  await t.closeX();

  sec('Barkitecture: the 5 new houses, never the Rocket Ship; buy one');
  await ev(() => window.__paw.shop.shop('builder')); await t.until(() => !!document.querySelector('#modal .shopgrid'));
  c = await cards();
  ok(['Little Tea House', 'Beach Hut', 'Camper Van', 'Pumpkin Cottage', 'Lighthouse Kennel'].every((n) => c.includes(n)) && !c.includes('Rocket Ship'), 'the 5 new houses, no Rocket Ship');
  await SH('04_barkitecture');
  await t.buy('Beach Hut'); await p().waitForSelector('.confirm .yes'); await p().click('.confirm .yes');
  s1 = await S(); ok(s1.inv.houses.includes('Beach Hut') && s1.house === 'Beach Hut', 'bought the Beach Hut and moved in');

  sec('purchase window arrow keys');
  await ev(() => window.__paw.shop.shop('kibble')); await p().waitForSelector('[data-tab=food]'); await p().click('[data-tab=food]'); await p().waitForSelector('[data-buy="Blueberry Bites"]');
  await p().mouse.move(5, 300); await p().click('[data-buy="Blueberry Bites"]'); await p().waitForSelector('.buyveil'); await t.until(() => document.activeElement === document.querySelector('.bb-in'));
  const unit = await ev(() => +document.querySelector('.bb-unit').textContent.replace(/[^\d]/g, ''));
  await p().keyboard.press('ArrowRight'); await p().keyboard.press('ArrowUp');
  ok(unit === 8 && await t.until(([n, u]) => { const m = /Total: ([\d,]+) coins/.exec(document.querySelector('.bb-sum').textContent); return document.querySelector('.bb-in').value === String(n) && !!m && +m[1].replace(/,/g, '') === n * u; }, [3, unit]), 'arrow keys: 3 x 8 coins');
  await p().keyboard.press('ArrowLeft');
  ok(await t.until((u) => { const m = /Total: ([\d,]+) coins/.exec(document.querySelector('.bb-sum').textContent); return !!m && +m[1].replace(/,/g, '') === 2 * u; }, unit), 'ArrowLeft: 2');
  await p().keyboard.press('Escape'); await t.until(() => !document.querySelector('.buyveil')); await t.closeX();

  sec('Feed tray: the new foods; the safety tip shows once per food');
  await t.home('yard'); await t.freezeMotion(true);
  await p().click('[data-act=feed]'); await t.waitPop(true);
  const tray = await ev(() => [...document.querySelectorAll('#dock [data-food]')].map((b) => b.dataset.food));
  ok(['Carrot Sticks', 'Frozen Pupsicle', 'Turkey Meatballs', 'Apple Slices'].every((n) => tray.includes(n)), 'the new foods are in the Feed tray');
  await SH('05_feed_tray');
  await t.toasts();
  await p().click('[data-food="Carrot Sticks"]');
  ok(await t.waitToast(/^Carrot Sticks: Crunchy and safe raw or cooked\. Cut them small for little dogs\.$/), 'first Carrot Sticks: the tip toast');
  ok(!!(await S()).foodTips['Carrot Sticks'], 'S.foodTips records it');
  await t.until(() => !window.__paw.shop.busy && !document.querySelector('#toasts .toast'), null, 8000); await t.toasts();
  await t.until(() => !document.querySelector('#dock .tray:not(.dock-idle)') || true);
  await t.retryUntil(async () => { await ev(() => { window.__paw.S.stats.hunger = 30; window.__paw.feed('Carrot Sticks'); }); }, () => window.__paw.S.inv.food['Carrot Sticks'] === 1, null, { tries: 4, each: 4000 });
  await t.until(() => !window.__paw.shop.busy && !document.querySelector('#toasts .toast'), null, 8000); // the tip would have shown 0.9 s after the eat toast, before the toasts clear
  ok(!(await t.toasts()).some((x) => /^Carrot Sticks: Crunchy/.test(x)), 'second Carrot Sticks: no tip toast');
  ok(await ev(() => window.__paw.shop.tip('Apple Slices', true)) === 'Core and seeds out, every time. Apple seeds hold a little cyanide.' && !(await S()).foodTips['Apple Slices'], 'shFoodTip(name, true) returns the text without recording it');

  sec('perks: Chef Hat on meals, Bumblebee Suit on snacks, Happi Coat Pupcake, Sailor Collar water, Frozen Pupsicle cools');
  const EATEN = /\+\d+ Bond\./; // every meal or snack toast ends with the Bond it gave
  const feedWait = async (n) => { await t.until(() => !window.__paw.shop.busy, null, 8000); await t.toasts(); await t.retryUntil(async () => { await ev((n) => { window.__paw.S.stats.hunger = 20; window.__paw.feed(n); }, n); }, (re) => window.__toasts.some((x) => new RegExp(re).test(x)), EATEN.source, { tries: 4, each: 4500 }); await t.until(() => !window.__paw.shop.busy, null, 8000); };
  await ev(() => window.__paw.shop.equip('Chef Hat')); await t.toasts();
  await feedWait('Turkey Meatballs'); const tt = await t.toasts(); ok(tt.some((x) => /Chef's kiss: \+5 Happiness\./.test(x)), "Chef Hat: a meal says Chef's kiss +5 " + JSON.stringify(tt));
  await ev(() => window.__paw.shop.equip('Bumblebee Suit')); await t.toasts();
  await feedWait('Apple Slices'); ok((await t.toasts()).some((x) => /Bzzz: \+5 Happiness\./.test(x)), 'Bumblebee Suit: a snack says Bzzz +5');
  await ev(() => window.__paw.shop.equip('Happi Coat')); await t.patch({ inv: { food: { Pupcake: 1 } }, daily: { pupcake: false } });
  await feedWait('Pupcake'); s1 = await S(); ok(s1.pupUntil - s1.gameMin > 100, 'Happi Coat: Pupcake power for 2 game hours (' + (s1.pupUntil - s1.gameMin) + ' min left)');
  await t.dev(async () => { await p().selectOption('#dvWeather', 'sunny'); });
  ok(await ev(() => window.__paw.shop.hot()) === true, 'sunny day: the dog is hot');
  await feedWait('Frozen Pupsicle'); s1 = await S(); ok(s1.coolUntil - s1.gameMin > 50, 'Frozen Pupsicle: S.coolUntil = gameMin + 60');
  ok(await ev(() => window.__paw.shop.hot()) === false, 'cooled: isHot() is false');
  await t.dev(async () => { await p().selectOption('#dvWeather', 'cloudy'); });
  ok(await ev(() => window.__paw.shop.waterWait()) === 120, 'water refills in 120 game minutes');
  await ev(() => window.__paw.shop.equip('Sailor Collar')); ok(await ev(() => window.__paw.shop.waterWait()) === 60, 'Sailor Collar: 60');

  sec('Wizard Hat: +1 Bond at the petting threshold');
  await ev(() => window.__paw.shop.equip('Wizard Hat')); await t.home(); await t.freezeMotion(true); await t.toasts();
  s0 = await S();
  await t.pet(() => window.__toasts.some((x) => /Bond\..*pretends/.test(x)));
  const pt = (await t.toasts()).find((x) => /Bond\..*pretends/.test(x)) || '';
  s1 = await S(); const m = /^\+(\d+) Bond\./.exec(pt);
  ok(/Magic hands: \+1 Bond\./.test(pt) && m && s1.bond.pts - s0.bond.pts === +m[1], 'petting toast says Magic hands +1 Bond, and the total matches the points: ' + pt);

  sec('Tutu: the fashion bonus gives +10');
  await t.patch({ daily: { outfit: false } }); await t.toasts();
  await ev(() => window.__paw.shop.equip('Tutu'));
  ok((await t.toasts()).some((x) => /^Fashion bonus! \+10 Happiness\. Twirl!/.test(x)), 'Fashion bonus! +10 with the Tutu');

  sec('naps: Cowboy Hat outdoors x1.1, Pyjamas x1.15');
  await ev(() => { const S = window.__paw.S; S.outfit.head = null; S.outfit.body = null; S.pjAuto = false; });
  const r0 = await ev(() => window.__paw.shop.napRate());
  await ev(() => { window.__paw.S.outfit.head = 'Cowboy Hat'; }); const r1 = await ev(() => window.__paw.shop.napRate());
  await ev(() => { window.__paw.S.outfit.head = null; window.__paw.S.pjAuto = true; }); const r2 = await ev(() => window.__paw.shop.napRate());
  ok(Math.abs(r1 / r0 - 1.1) < 0.001 && Math.abs(r2 / r0 - 1.15) < 0.001, `napRate x1.1 (${(r1 / r0).toFixed(3)}) and x1.15 (${(r2 / r0).toFixed(3)})`);

  sec('Pyjamas at nap time, and the Wardrobe toggle turns them off');
  // record what the art module is asked to draw
  await ev(() => { const A = window.PawArt; if (!A.__wrapped) { const f = A.dog; A.dog = function (k, o) { window.__lastDogOutfit = o && o.outfit; return f.apply(this, arguments); }; A.__wrapped = true; } });
  await ev(() => { const S = window.__paw.S; S.stats.energy = 40; S.outfit.body = 'Tutu'; S.pjAuto = true; });
  await t.home(); await t.freezeMotion(true); await ev(() => window.__paw.shop.sleep());
  ok(await t.until(() => window.__paw.S.sleeping && window.__paw.poseNow() === 'sleep' && window.__lastDogOutfit && window.__lastDogOutfit.body === 'Pyjamas', null, 5000), 'the sleeping dog is drawn in Pyjamas');
  const o1 = await ev(() => window.__paw.shop.outfit('sleep')); ok(o1.body === 'Pyjamas' && o1.sleepwear === true && (await S()).outfit.body === 'Tutu', 'dogOutfit while sleeping: body Pyjamas, sleepwear true (the worn Tutu is kept)');
  await SH('06_napping_pyjamas');
  await ev(() => window.__paw.shop.wardrobe()); await p().waitForSelector('#shPj');
  ok(/Pyjamas at nap time: on/.test(await p().textContent('#shPj')), 'Wardrobe: "Pyjamas at nap time: on" under the Body row');
  ok(await ev(() => { const b = document.querySelector('#shPj'); return !!b && b.closest('.slot') && /Body/.test(b.closest('.slot').querySelector('h4').textContent); }), 'the toggle sits in the Body row');
  await SH('07_wardrobe_pyjamas');
  await p().click('#shPj'); await t.until(() => /off/.test((document.querySelector('#shPj') || {}).textContent || ''));
  ok((await S()).pjAuto === false, 'toggle off: S.pjAuto false');
  ok(await t.until(() => window.__lastDogOutfit && window.__lastDogOutfit.body === 'Tutu' && !window.__lastDogOutfit.sleepwear, null, 3000), 'the sleeping dog is redrawn in its own outfit');
  await p().click('#shPj'); await t.until(() => /: on/.test((document.querySelector('#shPj') || {}).textContent || '')); await t.closeX();
  await ev(() => window.__paw.shop.wake()); await t.until(() => !window.__paw.S.sleeping, null, 3000);
  const o2 = await ev(() => window.__paw.shop.outfit('idle')); ok(o2.body === 'Tutu' && !o2.sleepwear, 'awake: the Tutu again');

  sec('Wardrobe mannequin: every new outfit draws in the preview without errors');
  const NEW_WEAR = ['Happi Coat', 'Sailor Collar', 'Chef Hat', 'Wizard Hat', 'Bumblebee Suit', 'Cozy Hoodie', 'Knit Scarf', 'Sun Hat', 'Cowboy Hat', 'Tutu', 'Astronaut Helmet', 'Pyjamas'];
  await ev((ns) => { const S = window.__paw.S; ns.forEach((n) => { if (!S.inv.clothes.includes(n)) S.inv.clothes.push(n); }); }, NEW_WEAR);
  const e0 = t.errors.length; let drawn = 0;
  for (const n of NEW_WEAR) { await ev((n) => { window.__paw.shop.equip(n); window.__paw.shop.wardrobe(); }, n); if (await t.until(() => !!document.querySelector('#modal .ward .preview svg'), null, 3000)) drawn++; }
  ok(drawn === 12 && t.errors.length === e0, `12 outfits drawn in the preview, no console errors (${drawn})`);
  ok(await ev(() => document.querySelectorAll('#modal [data-eq]').length) >= 12, 'every new outfit is listed in the Wardrobe');
  await t.closeX();

  sec('Sun Hat and Squeaky Hedgehog come from rollTreasure on their routes');
  const rolls = await ev(() => { const out = {}; const S = window.__paw.S; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Sun Hat'); for (const a of ['beach', 'park', 'woods', 'river']) { out[a] = {}; for (let i = 0; i < 1500; i++) { const n = window.__paw.shop.roll(a); if (n === 'Sun Hat' || n === 'Squeaky Hedgehog') out[a][n] = (out[a][n] || 0) + 1; } } return out; });
  ok(rolls.beach['Sun Hat'] > 0 && rolls.park['Sun Hat'] > 0 && !rolls.woods['Sun Hat'] && !rolls.river['Sun Hat'], 'Sun Hat: beach and park only ' + JSON.stringify(rolls));
  ok(rolls.woods['Squeaky Hedgehog'] > 0 && rolls.park['Squeaky Hedgehog'] > 0 && !rolls.beach['Squeaky Hedgehog'] && !rolls.river['Squeaky Hedgehog'], 'Squeaky Hedgehog: woods and park only');

  sec('Cozy Hoodie at 14 care days, once');
  await t.home(); await ev(() => { const S = window.__paw.S; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Cozy Hoodie'); S.careGifts = {}; S.careDays = 13; S.careDayLast = ''; S.outfit.body = null; });
  await ev(() => window.__paw.shop.careDay());
  ok(await t.until(() => !!document.querySelector('#modal .panel.sh-gift'), null, 6000), 'the gift popup opens');
  const gtxt = await ev(() => document.querySelector('#modal .panel.sh-gift p').textContent);
  ok(gtxt === '14 days of good care. Mrs. Plum saw it all from her window and made this. Hood up, ears out.', 'the popup text');
  ok(await p().textContent('#shWear') === 'Wear it' && await p().textContent('#shLater') === 'Later', 'Wear it / Later');
  await SH('08_hoodie_gift');
  await p().click('#shWear'); await t.modalGone();
  s1 = await S(); ok(s1.inv.clothes.includes('Cozy Hoodie') && s1.outfit.body === 'Cozy Hoodie' && !!s1.careGifts.hoodie && s1.careDays === 14, 'Wear it: owned, worn, S.careGifts.hoodie set');
  await ev(() => { window.__paw.S.careDays = 20; }); ok(await ev(() => window.__paw.shop.careGift()) === false, 'a second check gives nothing');
  await t.sleep(300); ok(await ev(() => !document.querySelector('#modal .panel.sh-gift')), 'no second popup');

  sec('Knit Scarf letter from Mrs. Plum, once, from Bond 3');
  await ev(() => { const S = window.__paw.S; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Knit Scarf'); S.careGifts.scarf = undefined; delete S.careGifts.scarf; });
  await ev(() => window.__paw.shop.dailyGift());
  const letter = await ev(() => window.__paw.S.mail[0]);
  const dn = (await S()).dog.name;
  ok(letter.from === 'Mrs. Plum next door' && letter.text === `I knitted too much again. A scarf for ${dn}. It is very long. Like my winters.` && letter.gift.item === 'Knit Scarf', 'the letter: ' + letter.text);
  ok(!(await S()).inv.clothes.includes('Knit Scarf'), 'not owned before the letter is opened');
  await ev(() => window.__paw.shop.mail()); await p().waitForSelector('.letter [data-mbget]'); // v2.7: the gift waits for Collect
  ok(!(await S()).inv.clothes.includes('Knit Scarf'), 'opening the letter shows a Collect button');
  await p().click('.letter [data-mbget]'); await t.until(() => window.__paw.S.inv.clothes.includes('Knit Scarf'), null, 4000);
  ok((await S()).inv.clothes.includes('Knit Scarf'), 'Collect adds the Knit Scarf to the Wardrobe');
  await t.closeX();
  const again = await ev(() => { const out = []; for (let i = 0; i < 40; i++) out.push(window.__paw.shop.giftRoll()); return out.filter((g) => g.gift && g.gift.item === 'Knit Scarf').length; });
  ok(again === 0, 'the scarf letter never comes again');
  const bea = await ev(() => { const r0 = Math.random; let got = null; for (const v of [0.6, 0.7, 0.81, 0.85, 0.9]) { Math.random = () => v; const g = window.__paw.shop.giftRoll(); if (g.gift && g.gift.item === 'Pumpkin Purée') got = g; } Math.random = r0; return got; });
  ok(bea && bea.from === 'Baker Bea' && bea.gift.n === 2 && bea.gift.cat === 'food', "Baker Bea's Pumpkin Purée parcel (2) is an item gift");

  sec('no console errors');
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
}, { prefs: { msTest: true } });
