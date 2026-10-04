// Paw Haven: the whole game in its current UI (v1.0 -> v1.5A), harness.js merged, 1280x720. node test_all.js
// Replaces test_play, test_v12, test_v121, test_v13 and test_v131. Multi-dog specifics live in test_v15.js.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const DIR = path.join(__dirname, 'shots_all'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = []; const ok = (c, l) => { console.log(c ? '  ok  ' : '  FAIL', l); if (!c) fails.push(l); };
const sec = (t) => console.log('\n# ' + t);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const mk = async () => { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push(e.message)); return p; };
  let p = await mk();
  const arm = () => p.evaluate(() => { window.__toasts = []; new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent); }))).observe(document.getElementById('toasts'), { childList: true }); });
  const toasts = () => p.evaluate(() => window.__toasts.splice(0));
  const SH = (n) => p.screenshot({ path: path.join(DIR, n + '.png') });
  const S = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const ev = (f, a) => p.evaluate(f, a);
  const mode = () => ev(() => window.__paw.mode);
  const lu = async () => { for (let i = 0; i < 6 && await p.locator('#luOk').count(); i++) { await p.click('#luOk'); await sleep(300); } };
  const dev = async (fn) => { await p.click('#devBtn'); await sleep(150); await fn(); if (await p.locator('#devPanel:not([hidden])').count()) await p.click('#dvX'); await sleep(300); await lu(); };
  const travel = async (k) => { await p.click('[data-act=map]'); await sleep(500); await p.evaluate((k) => window.__paw.mapTo(k), k); await sleep(100); await p.click(`[data-area=${k}]`); await sleep(1700); await lu(); };
  const calm = () => ev(() => window.__paw.S.dogs.forEach((d) => { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = window.__paw.S.gameMin + 9999; }));
  const popVisible = () => ev(() => { const d = document.getElementById('dock'); return !!d.querySelector('.tray:not(.dock-idle):not(.mini)') && getComputedStyle(d).display !== 'none'; });
  const closeX = async () => { if (await p.locator('.panel .x').count()) await p.click('.panel .x'); await sleep(200); };
  const win = async (q) => { await p.waitForSelector('.buyveil .bb-yes'); if (q && q !== 1) { await p.fill('.bb-in', String(q)); await sleep(100); } await p.click('.bb-yes'); await sleep(300); };
  const buy = async (name, q) => { await p.click(`[data-buy="${name}"]`); await win(q); };

  sec('title, adoption, intro');
  await p.goto(URL); await arm(); await sleep(700); await SH('01_title');
  await p.click('#tNew'); await sleep(400);
  await p.click('#aAdopt'); await sleep(300); ok((await toasts()).some((t) => /Pick Boy or Girl/.test(t)), 'adoption needs a sex');
  await p.click('#aGirl'); await sleep(150); await p.click('#aAdopt'); await sleep(300);
  ok(/Name your girl/.test(await p.textContent('.panel h2')), 'name modal: ' + await p.textContent('.panel h2'));
  await p.click('#nOk'); await sleep(300); for (let i = 0; i < 3; i++) { await p.click('#iNext'); await sleep(300); }
  await sleep(600); await calm();
  let s = await S(); ok(s.dogs.length === 1 && s.dog.sex === 'female' && s.dog.genes && s.inv.seeds.carrot === 3, 'new save: one girl, genes, seed packets');
  ok((await ev(() => getComputedStyle(document.getElementById('dock')).display)) === 'none', 'no popup: the scene is fully visible');
  ok((await p.$$eval('#bar .act', (els) => els.length)) === 7, '7 action buttons'); await SH('02_yard');

  sec('popups, feeding, petting');
  await ev(() => { window.__paw.S.stats.hunger = 30; });
  await p.click('[data-act=feed]'); await sleep(300); ok(await popVisible(), 'Feed popup'); await SH('03_feed_popup');
  await p.click('[data-food="Basic Kibble"]'); await sleep(250); ok(!(await popVisible()), 'tapping food closes the popup'); await sleep(2800);
  ok((await toasts()).some((t) => /\b(She|Her|her)\b/.test(t) || /^Gone\./.test(t)), 'feed toast (pronoun lines use she/her)');
  await p.click('[data-act=play]'); await sleep(300); ok(await popVisible(), 'Play popup'); await p.keyboard.press('Escape'); await sleep(200);
  await p.click('[data-act=care]'); await sleep(300); ok(await popVisible() && await p.locator('[data-care=bed]').count() === 1, 'Care popup with Bed'); await p.mouse.click(60, 150); await sleep(200);
  ok(!(await popVisible()), 'backdrop closes the popup');
  const box = await p.locator('#dogHit').boundingBox(); const b0 = (await S()).bond.pts;
  for (let i = 0; i < 40; i++) { await p.mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4); await sleep(25); }
  await sleep(300); ok((await S()).bond.pts > b0, 'rubbing pets the dog (+Bond)');

  sec('bath, toy, settings');
  await ev(() => { window.__paw.S.stats.clean = 30; });
  await p.click('[data-act=care]'); await sleep(250); await p.click('[data-care=bath]'); await sleep(500); ok((await mode()) === 'bath', 'bath mode');
  for (let i = 0; i < 25; i++) { await p.keyboard.press(' '); await sleep(40); } await sleep(2200);
  ok((await S()).stats.clean >= 99 && (await mode()) === 'yard', 'bath done: clean 100'); await calm();
  await p.click('[data-act=play]'); await sleep(300);
  if (await p.locator('[data-play="toy:Tennis Ball"]').count()) { await p.click('[data-play="toy:Tennis Ball"]'); await sleep(1500); ok((await mode()) === 'toy', 'PawToys opens'); await SH('04_toy'); await ev(() => window.__paw.go('yard')); await sleep(600); }
  else ok(false, 'Tennis Ball toy available');
  await p.click('#gearBtn'); await sleep(300); ok(await p.locator('#vol-music').count() === 1 && await p.locator('#setMute').count() === 1, 'settings: volume sliders + mute'); await closeX();

  sec('map, places, beach dig');
  await dev(async () => { for (let i = 0; i < 7; i++) await p.click('#dvBond'); await p.click('#dvCoins'); await p.click('#dvFill'); });
  await calm();
  await p.click('[data-act=map]'); await sleep(600);
  ok((await ev(() => document.getElementById('bar').hidden)) && !(await ev(() => document.getElementById('mapPin').hidden)), 'map: no tray/bar, you-are-here pin');
  await p.evaluate(() => window.__paw.mapTo('park')); await sleep(100); await p.hover('[data-area=park]'); await sleep(250); ok(/Sunny Park: go hang out/.test(await p.textContent('#mapTip')), 'map tooltip'); await SH('05_map');
  await p.keyboard.press('Escape'); await sleep(400); ok((await mode()) === 'yard', 'Esc leaves the map');
  for (const k of ['park', 'river', 'woods', 'beach']) { await travel(k); await calm(); ok((await S()).place === k, 'travelled to ' + k); }
  await SH('06_beach'); await p.click('#placeBtns [data-pb=dig]'); await sleep(1700); ok((await S()).daily.beachDig, 'beach dig');

  sec('away from home: snacks only, potty');
  await travel('park'); await calm();
  await ev(() => { const S = window.__paw.S; S.stats.hunger = 30; S.inv.food['Basic Kibble'] = 3; S.inv.food['Bone-shaped Biscuit'] = 3; });
  await p.click('[data-act=feed]'); await sleep(300); ok(await p.locator('[data-food="Basic Kibble"].off').count() === 1 && await p.locator('#feedHome').count() === 1, 'park: meals greyed + Go home');
  await toasts(); await p.click('[data-food="Basic Kibble"]', { force: true }); await sleep(300); ok((await toasts()).some((t) => /Meals are served at home/.test(t)), 'park: meal blocked');
  const h0 = (await S()).stats.hunger; await p.click('[data-food="Bone-shaped Biscuit"]'); await sleep(2900); ok((await S()).stats.hunger > h0, 'park: snack from the hand');
  await dev(async () => { await p.click('#dvPoop'); }); await sleep(3700);
  ok(((await S()).messes.park || []).length === 1, 'forced poop'); await SH('07_poop');
  const c0 = (await S()).coins; await p.click('#messG [data-mi="0"]'); await sleep(400); ok(((await S()).messes.park || []).length === 0 && (await S()).coins > c0, 'scooped: Good citizen');
  await dev(async () => { await p.click('#dvPee'); }); await sleep(3700); ok(((await S()).messes.park || []).length === 1, 'forced pee');
  await p.click('#messG [data-mi="0"]'); await sleep(400); ok(((await S()).messes.park || []).length === 0, 'pee flushed');

  sec('market: shops, Pip, wardrobe');
  await travel('market'); await calm();
  await p.click('#placeBtns [data-sh=kibble]'); await sleep(300);
  // purchase window: buy 5 kibble with the x5 quick pick
  s = await S(); const k0 = s.inv.food['Basic Kibble'] || 0, coins0 = s.coins;
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await p.click('[data-qq="5"]'); await sleep(150);
  const sumTxt = (await p.textContent('.bb-sum')).replace(/\s+/g, ' ');
  ok(/You have [\d,]+ coins/.test(sumTxt) && /Total: [\d,]+ coins/.test(sumTxt) && /Coins left after: [\d,]+/.test(sumTxt) && /In bag: \d+/.test(sumTxt), 'purchase window summary: ' + sumTxt.trim());
  await SH('08a_buy_window'); await p.click('.bb-yes'); await sleep(400);
  s = await S(); const unit = coins0 - s.coins;
  ok((s.inv.food['Basic Kibble'] || 0) === k0 + 5 && unit > 0 && unit % 5 === 0, `bought 5 x Basic Kibble: bag ${k0} -> ${s.inv.food['Basic Kibble']}, coins ${coins0} -> ${s.coins}`);
  ok((await toasts()).some((t) => /Bought 5 × Basic Kibble/.test(t)), 'toast "Bought 5 × Basic Kibble"');
  // can't afford: Buy disabled, summary red; Esc cancels only the window
  await ev(() => { window.__paw.S.coins = 3; });
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await p.click('[data-qq="10"]'); await sleep(150);
  ok(await p.locator('.bb-yes[disabled]').count() === 1 && await p.locator('.bb-sum.bad').count() === 1, "can't afford: red summary, Buy disabled"); await SH('08b_cant_afford');
  await p.keyboard.press('Escape'); await sleep(250); ok(await p.locator('.buyveil').count() === 0 && await p.locator('#modal .panel').count() === 1, 'Esc cancels the window, the shop stays open');
  await ev((c) => { window.__paw.S.coins = c; }, s.coins);
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await sleep(100);
  ok((await p.inputValue('.bb-in')) === '3', 'arrow keys change the quantity'); const vb = await p.locator('.buyveil').boundingBox(); await p.mouse.click(vb.x + 12, vb.y + vb.height / 2); await sleep(250); ok(await p.locator('.buyveil').count() === 0 && await p.locator('#modal .panel').count() === 1, 'window backdrop click cancels');
  await p.click('[data-tab=pantry]'); await sleep(300);
  await buy('Oats', 5); await buy('Rice', 1); await buy('Egg', 1); await buy('Chicken', 1);
  s = await S(); ok(s.inv.pantry.oats >= 5 && s.inv.pantry.chicken >= 1, 'Kibble Corner pantry'); await SH('08_kibble'); await closeX();
  await p.click('#placeBtns [data-sh=boutique]'); await sleep(300);
  const cl = await p.locator('[data-buy]').first().getAttribute('data-buy'); await buy(cl, 1);
  if (await p.locator('.confirm .yes').count()) { await p.click('.confirm .yes'); await sleep(300); }
  ok((await S()).inv.clothes.includes(cl), 'Boutique: bought ' + cl); await closeX();
  await p.click('[data-act=wardrobe]'); await sleep(300); ok(await p.locator('.ward').count() === 1, 'Wardrobe popup'); await SH('09_wardrobe'); await closeX();
  await p.click('#placeBtns [data-sh=builder]'); await sleep(300); await p.click('[data-btab=beds]'); await sleep(300);
  await buy('Plaid Pillow', 1); await p.click('.confirm .yes'); await sleep(400);
  ok((await S()).bed === 'Plaid Pillow', 'Barkitecture Beds: bought + equipped'); await closeX();
  await p.click('#placeBtns [data-sh=sprout]'); await sleep(300); ok(await p.locator('#modal .panel').count() === 1, "Pip's Sprout Cart popup");
  await p.click('[data-seed="spinach"]'); await win(1);
  ok(((await S()).inv.seeds.spinach || 0) >= 1, 'Pip: bought spinach seeds'); await SH('10_pip'); await closeX();

  sec('walk: carousel, tutorial, runner, results');
  await travel('yard'); await calm();
  await p.click('[data-act=walk]'); await sleep(700); await SH('11_routes');
  await p.click('#rtStart'); await sleep(1200);
  for (let i = 0; i < 10; i++) { const g = p.locator('button:has-text("Let\'s go")'); if (await g.count()) { await g.first().click(); break; } await sleep(300); }
  await sleep(3000); ok((await mode()) === 'walk', 'runner (PawWalk) running'); await SH('12_runner');
  await p.keyboard.press('Escape'); await sleep(600); if (await p.locator('[data-home]').count()) await p.click('[data-home]');
  for (let i = 0; i < 20 && !(await p.locator('#resOk').count()); i++) await sleep(300);
  ok(await p.locator('#resOk').count() === 1, 'walk results'); await SH('13_results');
  if (await p.locator('#resOk').count()) await p.click('#resOk'); await sleep(900); await lu(); ok((await mode()) === 'yard', 'back home after the walk');
  await dev(async () => { await p.click('#dvTreasure'); }); ok(Object.keys((await S()).found).length >= 1, 'treasure granted (dev)');

  sec('garden');
  await calm(); await p.click('#sceneG [data-hot=garden]'); await sleep(1200); ok((await mode()) === 'garden', 'yard patch opens the garden');
  const plant = async (i, crop) => { await p.keyboard.press(String(i + 1)); await sleep(150); await p.click('.pg-tool[data-t="seeds"]'); await sleep(250); await p.click(`.pg-pk[data-c="${crop}"]`, { timeout: 5000 }); await sleep(300); if (await p.locator('.pg-veil [data-y]').count()) { await p.click('.pg-veil [data-y]'); await sleep(300); } if (!(await ev((i) => !!window.__paw.S.garden.plots[i].crop, i))) { await p.click(`.pg-plot[data-i="${i}"]`); await sleep(400); } };
  await plant(0, 'carrot'); await plant(1, 'carrot'); await plant(2, 'peas'); await plant(3, 'spinach');
  await p.click('.pg-tool[data-t="water"]'); await sleep(300); for (const i of [0, 1, 2]) { await p.click(`.pg-plot[data-i="${i}"]`); await sleep(500); }
  s = await S(); ok(s.garden.plots.slice(0, 4).every((x) => x.crop && x.water === 3), 'planted + watered 4 plots'); await SH('14_garden');
  await p.keyboard.press('Escape'); await sleep(200); await p.keyboard.press('Escape'); await sleep(900);
  await dev(async () => { await p.selectOption('#dvGW', 'sunny'); for (let i = 0; i < 3; i++) { await p.click('#dvGStep'); await sleep(80); } await p.click('#dvGReady'); });
  await p.click('#sceneG [data-hot=garden]'); await sleep(1300); for (const i of [0, 1, 2, 3]) { await p.click(`.pg-plot[data-i="${i}"]`); await sleep(700); }
  await sleep(600); s = await S(); const sum = (id) => (s.inv.crops[id] || [0, 0, 0]).reduce((a, c) => a + c, 0);
  ok(sum('carrot') >= 4 && sum('peas') >= 2 && sum('spinach') >= 1, `harvest: carrot ${sum('carrot')}, peas ${sum('peas')}, spinach ${sum('spinach')}`);
  await p.click('.pg-done'); await sleep(900);
  await travel('market'); await calm(); await p.click('#placeBtns [data-sh=sprout]'); await sleep(300); await p.click('[data-ptab=sell]'); await sleep(300);
  const c1 = (await S()).coins; await p.locator('[data-sell^="peas"]').first().click(); await p.waitForSelector('.buyveil'); ok(/Coins after: /.test(await p.textContent('.bb-sum')), 'sell window: Coins after'); await SH('10a_sell_window'); await p.click('.bb-yes'); await sleep(300); ok((await S()).coins > c1, 'sold peas at Pip'); await closeX();

  sec('kitchen, dishes');
  await travel('yard'); await p.click('#placeBtns [data-pb=house]'); await sleep(1700); await lu(); await calm();
  await p.click('#sceneG [data-hot=kitchen]'); await sleep(1300); ok((await mode()) === 'kitchen', 'house hotspot opens the kitchen');
  const cook = async (ids) => { for (const id of ids) { await p.click(`[data-ing="${id}"]`); await sleep(300); } await p.click('.pk-btn.pk-go:has-text("Cook!")'); for (let i = 0; i < 60 && !(await p.locator('.pk-rbtns').count()); i++) { if (i === 8) await p.keyboard.press(' '); await sleep(200); } await sleep(400); if (await p.locator('.pk-rbtns .pk-btn:has-text("Cook more")').count()) await p.click('.pk-rbtns .pk-btn:has-text("Cook more")'); await sleep(400); };
  await toasts(); await cook(['carrot', 'oats']); await cook(['chicken', 'rice', 'carrot', 'peas']); await cook(['egg', 'spinach']);
  s = await S(); ok(s.inv.dishes.length === 3 && s.recipes.known.includes('spinach-scramble'), 'cooked 2 recipes + discovered Spinach Scramble');
  ok(await ev(() => document.getElementById('toasts').style.bottom === '18px'), 'module screen: toasts sit at the bottom centre'); await SH('15_kitchen');
  await p.click('[data-pf="onion"]'); await sleep(1200); ok((await S()).safetySeen.includes('onion'), 'onion bounces out of the pot');
  if (await p.locator('.pk-note .pk-btn').count()) await p.locator('.pk-note .pk-btn').first().click(); await sleep(200);
  await p.keyboard.press('Escape'); await sleep(900); ok((await mode()) === 'yard', 'kitchen closes back to the house');
  await travel('park'); await calm(); await p.click('[data-act=feed]'); await sleep(300); ok(await p.locator('[data-dish].off').count() >= 1, 'park: dishes greyed'); await p.click('#trayX'); await sleep(200);
  await travel('yard'); await calm(); await ev(() => { window.__paw.S.stats.hunger = 20; });
  for (let i = 0; i < 3; i++) { await p.click('[data-act=feed]'); await sleep(300); await p.locator('[data-dish]').first().click(); await sleep(3300); if (await p.locator('#dock .tray:not(.dock-idle)').count()) { await p.click('#trayX'); await sleep(200); } }
  s = await S(); ok(s.dishLog.count === 2 && !!s.buff && !(await p.locator('#buffChip[hidden]').count()), 'dishes: 2 a day, buff chip'); ok((await toasts()).some((t) => /Treats are extras/.test(t)), 'dish limit message'); await SH('16_buff');

  sec('house: bed nap, accident');
  await p.click('#placeBtns [data-pb=house]'); await sleep(1700); await lu();
  await ev(() => { window.__paw.S.stats.energy = 40; }); await calm();
  await p.click('[data-act=care]'); await sleep(300); await p.click('[data-care=sleep]'); await sleep(1400);
  ok((await S()).sleeping && /Plaid Pillow: \+25% indoors, \+5% bed/.test(await p.textContent('#dock')), 'nap on the Plaid Pillow with bed bonus'); await SH('17_nap');
  await p.click('#wakeBtn'); await sleep(1600);
  await dev(async () => { await p.click('#dvAccident'); }); await sleep(5500);
  s = await S(); ok(s.potty.accidents === 1 && (s.messes.house || []).length === 1, 'indoor accident'); await p.click('#messG [data-mi="0"]'); await sleep(400);

  sec('journal');
  await p.click('[data-act=journal]'); await sleep(300); ok(await p.locator('.panel.journal').count() === 1, 'Journal popup'); await SH('18_journal');
  await p.click('[data-jt=garden]'); await sleep(250); ok(/Open garden/.test(await p.textContent('.panel')), 'Garden tab');
  await p.click('[data-jt=recipes]'); await sleep(250); ok(/Spinach Scramble/.test(await p.textContent('.panel')), 'Recipes tab');
  await p.click('[data-jt=profile]'); await sleep(250); const pf = await p.textContent('.profile'); ok(/old/.test(pf) && /Potty stats: Scooped: \d+\. Accidents indoors: 1/.test(pf), 'Profile: age + potty stats'); await SH('19_profile'); await closeX();

  sec('old save: sex prompt + seed gift');
  const old = await ev(() => { const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); const d = s.dogs[0]; delete d.sex; s.seedGiftPending = true; s.inv.seeds = {}; delete s.gkEarly; return JSON.stringify(s); });
  p = await mk(); await p.addInitScript((v) => { try { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('pawhaven_proto_v1', v); } } catch (e) { /* none */ } }, old);
  await p.goto(URL); await arm(); await sleep(600); await p.click('#tContinue'); await sleep(1400);
  ok(/paperwork/i.test(await p.textContent('.panel h2').catch(() => '')), 'old save: sex prompt'); if (await p.locator('#sxM').count()) await p.click('#sxM'); await sleep(2400);
  s = await S(); ok(s.dog.sex === 'male' && s.inv.seeds.carrot === 3 && (await toasts()).filter((t) => /Pip left a packet/.test(t)).length === 1, 'sex set, seed gift once');

  sec('v1.7: adopt each new breed and check it renders');
  for (const [k, br, nm] of [['chihuahua', 'Chihuahua', 'Peanut'], ['pug', 'Pug', 'Dumpling'], ['greyhound', 'Greyhound', 'Rocket'], ['beagle', 'Beagle', 'Bagel']]) {
    p = await mk(); await p.goto(URL); await arm(); await sleep(600); await p.click('#tNew'); await sleep(400);
    ok(await p.locator('.heads button').count() === 10, `${br}: 10 dogs in the adoption carousel`);
    await p.click(`.heads button[aria-label$="the ${br}"]`); await sleep(300);
    ok(/the Chihuahua|the Pug|the Greyhound|the Beagle/.test(await p.textContent('.adopt-card h3')) && (await p.getAttribute('#adoptDog svg.pa-dog', 'aria-label') || '').includes(br), `${br}: shelter card + art`);
    await p.click('#aBoy'); await sleep(150); await p.click('#aAdopt'); await sleep(300); await p.click('#nOk'); await sleep(300);
    for (let i = 0; i < 3; i++) { await p.click('#iNext'); await sleep(300); } await sleep(500); await calm();
    s = await S(); const lab = await p.getAttribute('#dogArt svg.pa-dog', 'aria-label').catch(() => '');
    ok(s.dog.key === k && s.dog.name === nm && (await mode()) === 'yard' && (lab || '').includes(br), `${br}: adopted ${nm}, drawn in the yard (${lab})`);
    if (k === 'beagle') await SH('20_new_breed_' + k);
  }

  console.log('\nERRORS:', errors.length ? errors.join('\n') : 'none');
  console.log(fails.length ? `FAILED ${fails.length}: ${fails.join(' | ')}` : 'ALL OK');
  await b.close();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
