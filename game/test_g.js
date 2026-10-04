const { chromium } = require('playwright'); const path = require('path');
const URL = 'file://' + path.join(__dirname, 'test_build.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(b, W, H, tag, full) {
  const errors = [];
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push(e.message));
  const SH = (n) => p.screenshot({ path: path.join(__dirname, 'shots_g', `${n}_${tag}.png`) });
  await p.goto(URL); await sleep(900); await SH('01_title');
  await p.click('#tNew'); await sleep(500); await SH('02_adopt');
  await p.click('#aAdopt'); await sleep(300); await SH('03_name'); await p.click('#nOk'); await sleep(300);
  for (let i = 0; i < 3; i++) { await p.click('#iNext'); await sleep(350); }
  await sleep(900);
  const box = await p.locator('#dogHit').boundingBox();
  for (let i = 0; i < 14; i++) { await p.mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4); await sleep(30); }
  await sleep(200); await SH('04_yard');
  await p.click('[data-act=shop]'); await sleep(500); await p.click('[data-sh=boutique]'); await sleep(500); await SH('05_shop');
  if (!full) { await p.close(); return errors; }
  await p.click('[data-buy="Red Bandana"]'); await sleep(300); await SH('06_confirm');
  await p.click('.confirm .yes'); await sleep(400); await p.click('.confirm .yes'); await sleep(400);
  await p.click('.panel .x'); await sleep(200);
  await p.click('[data-act=wardrobe]'); await sleep(500); await SH('07_wardrobe'); await p.click('.panel .x'); await sleep(200);
  await p.click('[data-act=feed]'); await sleep(400); await SH('08_feed'); await p.click('#trayX'); await sleep(200);
  await p.click('[data-act=play]'); await sleep(300); await p.click('[data-play=fetch-ball]'); await sleep(500);
  const vb = await p.locator('#view').boundingBox();
  for (let k = 0; k < 3; k++) {
    await p.mouse.click(vb.x + vb.width * 0.6, vb.y + vb.height * 0.7);
    await p.waitForFunction(() => { const f = window.__paw.F.fly; return !f || (performance.now() - f.t0) / 1000 > f.T - 0.04; });
    await p.mouse.click(vb.x + vb.width * 0.5, vb.y + vb.height * 0.5);
    if (k === 1) { await sleep(150); await SH('09_fetch'); }
    await sleep(900);
  }
  await p.click('#fQuit'); await sleep(500); await SH('10_fetch_results'); await p.click('#fOk'); await sleep(500);
  await p.click('[data-act=map]'); await sleep(500); await SH('11_map');
  await p.click('[data-route=park]'); await sleep(600); await p.click('#autoWalk'); await sleep(3500); await SH('12_walk');
  await p.evaluate(() => { const W = window.__paw.W; W.dist = W.len - 300; });
  for (let i = 0; i < 20 && !(await p.locator('#resOk').count()); i++) await sleep(300);
  await sleep(500); await SH('13_walk_results'); await p.click('#resOk'); await sleep(600);
  while (await p.locator('#luOk').count()) { await p.click('#luOk'); await sleep(300); }
  await p.click('#devBtn'); await sleep(200); await p.click('#dvBond'); await sleep(150); await SH('14_devpanel'); await p.click('#dvX'); await sleep(700);
  await SH('15_levelup'); if (await p.locator('#luOk').count()) await p.click('#luOk'); await sleep(300);
  await p.click('#gearBtn'); await sleep(400); await SH('16_settings'); await p.click('.panel .x'); await sleep(200);
  await p.evaluate(() => { const S = window.__paw.S; S.stats.energy = 40; });
  await p.click('[data-act=care]'); await sleep(300); await SH('17_care'); await p.click('[data-care=sleep]'); await sleep(2200); await SH('18_sleep');
  await p.close(); return errors;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const e1 = await run(b, 1280, 720, '1280', true);
  const e2 = await run(b, 1440, 900, '1440', false);
  console.log('ERRORS:', [...e1, ...e2].join('\n') || 'none');
  await b.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
