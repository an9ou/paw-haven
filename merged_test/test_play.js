const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + '/home/claude/proto/merged_test/test_build.html';
const SH = (n) => path.join(__dirname, 'shots', n + '.png');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const log = (...a) => console.log('[step]', ...a);
  await page.goto(URL); await sleep(600);
  await page.screenshot({ path: SH('01_title_1280') });
  await page.click('#tNew'); await sleep(500);
  await page.click('#aNext'); await sleep(400);
  await page.screenshot({ path: SH('02_adopt_1280') });
  await page.click('#aAdopt'); await sleep(300);
  await page.fill('#nameIn', 'Sir Barksalot the Great');
  const nm = await page.inputValue('#nameIn'); log('name field', nm);
  await page.click('#nOk'); await sleep(300);
  for (let i = 0; i < 3; i++) { await page.click('#iNext'); await sleep(350); }
  await sleep(800);
  await page.screenshot({ path: SH('03_yard_1280') });
  let s = await S(); log('adopted', s.dog.key, s.dog.name, 'happy', s.stats.happy.toFixed(1));
  // pet by rubbing
  const box = await page.locator('#dogHit').boundingBox();
  for (let i = 0; i < 40; i++) { await page.mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4); await sleep(30); }
  await page.screenshot({ path: SH('04_pet_1280') });
  let s2 = await S(); log('pet happy', s.stats.happy.toFixed(1), '->', s2.stats.happy.toFixed(1), 'bond', s2.bond.pts);
  // feed
  await page.mouse.move(10, 10);
  await page.click('[data-act=feed]'); await sleep(300);
  await page.screenshot({ path: SH('05_feedtray_1280') });
  const h0 = (await S()).stats.hunger;
  await page.click('[data-food="Basic Kibble"]'); await sleep(1300);
  await page.screenshot({ path: SH('06_eating_1280') });
  await sleep(2400);
  s = await S(); log('feed hunger', h0.toFixed(1), '->', s.stats.hunger.toFixed(1), 'kibble left', s.inv.food['Basic Kibble']);
  // buy clothes
  await page.click('[data-act=shop]'); await sleep(500);
  await page.screenshot({ path: SH('07_market_1280') });
  await page.click('[data-sh=boutique]'); await sleep(400);
  await page.click('[data-buy="Red Bandana"]'); await sleep(300);
  await page.screenshot({ path: SH('08_confirm_1280') });
  await page.click('.confirm .yes'); await sleep(400);
  await page.click('.confirm .yes'); await sleep(400);
  s = await S(); log('bought', s.inv.clothes, 'outfit', JSON.stringify(s.outfit), 'coins', s.coins);
  await page.screenshot({ path: SH('09_boutique_after_1280') });
  await page.click('.panel .x'); await sleep(200);
  // wardrobe
  await page.click('[data-act=wardrobe]'); await sleep(400);
  await page.click('[data-eq="Red Bandana"]'); await sleep(200);
  s = await S(); log('unequipped neck', s.outfit.neck);
  await page.click('[data-eq="Red Bandana"]'); await sleep(300);
  s = await S(); log('equipped neck', s.outfit.neck);
  await page.screenshot({ path: SH('10_wardrobe_1280') });
  await page.click('.panel .x'); await sleep(200);
  // dev: bond + coins
  await page.click('[data-act=home]'); await sleep(400);
  await page.click('#devBtn'); await sleep(200);
  await page.click('#dvBond'); await sleep(200); await page.click('#dvCoins'); await sleep(200);
  await page.click('#dvX'); await sleep(600);
  if (await page.locator('#luOk').count()) { await page.screenshot({ path: SH('11_levelup_1280') }); await page.click('#luOk'); await sleep(300); }
  s = await S(); log('bond', s.bond.level, 'coins', s.coins);
  // buy house
  await page.click('[data-act=shop]'); await sleep(400);
  await page.click('[data-sh=builder]'); await sleep(400);
  await page.click('[data-buy="Classic Wooden Doghouse"]'); await sleep(300);
  await page.click('.confirm .yes'); await sleep(400);
  await page.screenshot({ path: SH('12_builder_1280') });
  await page.click('.confirm .no'); await sleep(300);
  await page.click('.panel .x'); await sleep(200);
  await page.click('[data-act=care]'); await sleep(300);
  await page.click('[data-care=house]'); await sleep(300);
  await page.click('[data-house="Classic Wooden Doghouse"]'); await sleep(500);
  s = await S(); log('house', s.house, 'owned', s.inv.houses);
  await page.screenshot({ path: SH('13_newhouse_1280') });
  // fetch 10s
  await page.click('[data-act=play]'); await sleep(300);
  await page.click('[data-play=fetch-ball]'); await sleep(500);
  const vb = await page.locator('#view').boundingBox();
  const t0 = Date.now(); let shot = false;
  while (Date.now() - t0 < 10000) {
    await page.mouse.click(vb.x + vb.width * 0.6, vb.y + vb.height * 0.75);
    await page.waitForFunction(() => { const f = window.__paw.F.fly; return !f || (performance.now() - f.t0) / 1000 > f.T - 0.04; });
    await page.mouse.click(vb.x + vb.width * 0.5, vb.y + vb.height * 0.5);
    if (!shot) { await sleep(150); await page.screenshot({ path: SH('14_fetch_1280') }); shot = true; }
    await sleep(800);
  }
  const fs1 = await page.evaluate(() => ({ score: window.__paw.F.score, throws: window.__paw.F.throws }));
  log('fetch', JSON.stringify(fs1));
  await page.click('#fQuit'); await sleep(400);
  await page.screenshot({ path: SH('15_fetchresults_1280') });
  await page.click('#fOk'); await sleep(500);
  // walk park
  await page.evaluate(() => { const s = window.__paw.S; s.stats.energy = 90; });
  await page.click('[data-act=map]'); await sleep(500);
  await page.screenshot({ path: SH('16_map_1280') });
  await page.click('[data-route=woods]', { force: true }); await sleep(300); // locked -> nope
  await page.click('[data-route=park]'); await sleep(800);
  await page.click('#autoWalk');
  await sleep(4000);
  await page.screenshot({ path: SH('17_walk_1280') });
  for (let i = 0; i < 70; i++) { await sleep(1000); if (await page.locator('#resOk').count()) break; }
  await page.screenshot({ path: SH('18_walkresults_1280') });
  s = await S(); log('after walk coins', s.coins, 'bond', s.bond.pts, 'collection', JSON.stringify(s.collection));
  await page.click('#resOk'); await sleep(600);
  if (await page.locator('#luOk').count()) { await page.click('#luOk'); await sleep(300); }
  // bath
  await page.evaluate(() => { window.__paw.S.stats.clean = 10; });
  await page.click('[data-act=care]'); await sleep(300);
  await page.click('[data-care=bath]'); await sleep(500);
  const vb2 = await page.locator('#view').boundingBox();
  for (let i = 0; i < 160 && (await page.evaluate(() => window.__paw.mode)) === 'bath'; i++) {
    await page.mouse.move(vb2.x + vb2.width * (0.38 + 0.12 * (i % 2)), vb2.y + vb2.height * 0.68); await sleep(20);
    if (i === 40) await page.screenshot({ path: SH('19_bath_1280') });
  }
  await sleep(1900);
  s = await S(); log('bath clean', s.stats.clean.toFixed(1), 'mode', await page.evaluate(() => window.__paw.mode));
  // sleep
  await page.evaluate(() => { window.__paw.S.stats.energy = 30; });
  await page.click('[data-act=care]'); await sleep(300);
  await page.click('[data-care=sleep]'); await sleep(3000);
  await page.screenshot({ path: SH('20_sleep_1280') });
  s = await S(); log('sleeping', s.sleeping, 'energy', s.stats.energy.toFixed(1));
  // tricks
  await page.click('#wakeBtn'); await sleep(1200);
  await page.click('[data-act=play]'); await sleep(300);
  await page.click('[data-play=tricks]'); await sleep(300);
  for (let i = 0; i < 4; i++) { await page.click('[data-trick="Sit"]'); await sleep(1800); }
  await page.click('[data-trick="Paw"]'); await sleep(600);
  await page.screenshot({ path: SH('21_tricks_1280') });
  await sleep(1500);
  s = await S(); log('tricks', JSON.stringify(s.tricks));
  // reload
  await page.evaluate(() => window.__paw.saveNow());
  const before = await S();
  await page.reload(); await sleep(800);
  const hasCont = await page.locator('#tContinue').count(); log('continue button', hasCont);
  await page.click('#tContinue'); await sleep(800);
  s = await S(); log('restored', s.dog.name, s.house, s.outfit.neck, 'coins', before.coins, '->', s.coins, 'bond', s.bond.level);
  await page.screenshot({ path: SH('22_restored_1280') });
  // settings
  await page.click('#gearBtn'); await sleep(300); await page.screenshot({ path: SH('23_settings_1280') }); await page.click('.panel .x');

  // ---------- phone ----------
  const ctx2 = await browser.newContext({ viewport: { width: 400, height: 860 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p2 = await ctx2.newPage();
  p2.on('console', (m) => { if (m.type() === 'error') errors.push('phone console: ' + m.text()); });
  p2.on('pageerror', (e) => errors.push('phone pageerror: ' + e.message));
  await p2.goto(URL); await sleep(600);
  await p2.screenshot({ path: SH('30_title_400') });
  await p2.tap('#tNew'); await sleep(500);
  await p2.screenshot({ path: SH('31_adopt_400') });
  await p2.tap('#aAdopt'); await sleep(300); await p2.tap('#nOk'); await sleep(300);
  for (let i = 0; i < 3; i++) { await p2.tap('#iNext'); await sleep(350); }
  await sleep(700);
  await p2.screenshot({ path: SH('32_yard_400') });
  await p2.tap('[data-act=feed]'); await sleep(300);
  await p2.screenshot({ path: SH('33_feed_400') });
  await p2.tap('[data-act=shop]'); await sleep(500);
  await p2.screenshot({ path: SH('34_market_400') });
  await p2.tap('[data-sh=kibble]'); await sleep(400);
  await p2.screenshot({ path: SH('35_shop_400') });
  await p2.tap('.panel .x'); await sleep(200);
  await p2.tap('[data-act=map]'); await sleep(500);
  await p2.screenshot({ path: SH('36_map_400') });
  await p2.tap('[data-route=park]'); await sleep(600);
  await p2.tap('#autoWalk'); await sleep(5000);
  await p2.screenshot({ path: SH('37_walk_400') });
  const sw = await p2.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  log('phone scroll width', JSON.stringify(sw));
  await p2.tap('#walkQuit'); await sleep(500);
  await p2.screenshot({ path: SH('38_walkres_400') });
  await p2.tap('#resOk'); await sleep(500);
  await p2.tap('[data-act=wardrobe]'); await sleep(400);
  await p2.screenshot({ path: SH('39_wardrobe_400') });
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch((e) => { console.error('TEST FAIL', e); process.exit(1); });
