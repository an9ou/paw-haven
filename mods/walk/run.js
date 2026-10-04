// node run.js <suite>   suites: bot | routes | shots | idle
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const suite = process.argv[2] || 'bot';
const DIR = path.join(__dirname, 'shots'); fs.mkdirSync(DIR, { recursive: true });
const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'bot_touch.js'), 'utf8');
const { devices } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = (q) => 'file://' + path.join(__dirname, 'test.html') + '?' + q;
let browser; const errors = [];
async function page(q, dev) {
  const p = dev ? await (await browser.newContext({ ...devices[dev], defaultBrowserType: undefined })).newPage() : await browser.newPage({ viewport: { width: 1280, height: 760 } });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(q + ' :: ' + m.text()); });
  p.on('pageerror', (e) => errors.push(q + ' :: PAGEERROR ' + e.message));
  await p.goto(URL(q)); await p.addScriptTag({ content: BOT });
  if (!/tut=1/.test(q)) { await sleep(150); if (await p.locator('[data-go]').count()) await p.click('[data-go]'); }
  return p;
}
async function botRun(q, lead = 0.3, maxS = 120, jit = 0) {
  const p = await page(q);
  await p.evaluate(([l, j]) => window.__runBot(l, true, j), [lead, jit]);
  const t0 = Date.now();
  while (Date.now() - t0 < maxS * 1000) { await sleep(1000); if (await p.evaluate(() => window.__ends.length)) break; }
  const res = await p.evaluate(() => { const P = window.__ctl._peek(); const f = window.__botStats.frames.slice(30); f.sort((a, b) => a - b);
    return { hitLog: P.hitLog, r: window.__ends[0] || null, ends: window.__ends.length, hazards: P.hazards, touched: P.touched, hits: P.hits, splashes: P.splashes, coinsSpawned: P.coinsSpawned, coinTarget: P.coinTarget,
      fps: f.length ? Math.round(1000 / (f.reduce((a, b) => a + b, 0) / f.length)) : 0, p95: f.length ? Math.round(f[Math.floor(f.length * 0.95)]) : 0, sfx: window.__sfx }; });
  res.q = q; res.rate = res.hazards ? +(1 - res.touched / res.hazards).toFixed(3) : null;
  await p.close(); return res;
}
(async () => {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const out = [];
  if (suite === 'bot') {
    const qs = process.argv[3] ? process.argv[3].split(',') : ['area=park&dur=75', 'area=beach&dur=75&time=night&weather=rain'];
    (await Promise.all(qs.map((q) => botRun(q, 0.3)))).forEach((r) => out.push(r));
  }
  if (suite === 'jitter') {
    const qs = ['area=park&dur=75&j', 'area=river&dur=75&weather=rain&j', 'area=woods&dur=75&j', 'area=beach&dur=75&j'];
    for (let i = 0; i < qs.length; i += 2) (await Promise.all(qs.slice(i, i + 2).map((q) => botRun(q, 0.3, 110, 0.12)))).forEach((r) => out.push(r));
  }
  if (suite === 'lead') {
    const jobs = [];
    for (const l of [0.15, 0.22, 0.45]) for (const a of ['park', 'beach']) jobs.push([`area=${a}&dur=45&lead=${l}`, l]);
    for (let i = 0; i < jobs.length; i += 3) (await Promise.all(jobs.slice(i, i + 3).map(([q, l]) => botRun(q, l, 80)))).forEach((r) => out.push(r));
  }
  if (suite === 'routes') {
    const qs = [];
    for (const a of ['park', 'river', 'woods', 'beach']) { qs.push(`area=${a}&dur=60`); qs.push(`area=${a}&dur=60&time=night&weather=rain`); }
    for (let i = 0; i < qs.length; i += 4) (await Promise.all(qs.slice(i, i + 4).map((q) => botRun(q, 0.3, 100)))).forEach((r) => out.push(r));
  }
  if (suite === 'idle') {
    (await Promise.all(['area=park&dur=25', 'area=woods&dur=25&weather=snow'].map(async (q) => { const p = await page(q); await sleep(30000);
      const r = await p.evaluate(() => ({ ends: window.__ends, P: window.__ctl._peek() })); await p.close(); return { q, ends: r.ends.length, r: r.ends[0], hazards: r.P.hazards, touched: r.P.touched, mode: r.P.mode }; }))).forEach((r) => out.push(r));
  }
  if (suite === 'v16') {
    const qs = ['area=town&dur=60', 'area=hilltop&dur=75', 'area=pier&dur=75', 'area=town&dur=60&time=night&weather=rain', 'area=hilltop&dur=75&weather=snow', 'area=pier&dur=75&time=dusk&weather=rain'];
    for (let i = 0; i < qs.length; i += 3) (await Promise.all(qs.slice(i, i + 3).map((q) => botRun(q, 0.3, 110)))).forEach((r) => out.push(r));
  }
  if (suite === 'v16r') { // v16 routes: bot rates (300 ms) on every new route + regression
    const qs = ['area=town&dur=60', 'area=town&dur=60&time=night&weather=rain', 'area=hilltop&dur=75', 'area=hilltop&dur=75&time=night&weather=rain', 'area=hilltop&dur=75&weather=snow',
      'area=pier&dur=75', 'area=pier&dur=75&time=night&weather=rain', 'area=park&dur=75', 'area=beach&dur=75&time=night&weather=rain'];
    for (let i = 0; i < qs.length; i += 3) (await Promise.all(qs.slice(i, i + 3).map((q) => botRun(q, 0.3, 110)))).forEach((r) => out.push(r));
  }
  if (suite === 'v16rshots') { // 1280x720: tutorial card 2 + mid-run, per new route
    const jobs = [['area=town&tut=1', 'town_day'], ['area=town&tut=1&time=night&weather=rain', 'town_night_rain'], ['area=hilltop&tut=1', 'hilltop_day'], ['area=hilltop&tut=1&weather=snow', 'hilltop_snow'],
      ['area=hilltop&tut=1&time=night&weather=rain', 'hilltop_night_rain'], ['area=pier&tut=1', 'pier_day'], ['area=pier&tut=1&time=night&weather=rain', 'pier_night_rain']];
    const one = async ([q, n]) => {
      const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(q + ' :: ' + m.text()); });
      p.on('pageerror', (e) => errors.push(q + ' :: PAGEERROR ' + e.message));
      await p.goto(URL(q)); await p.addScriptTag({ content: BOT }); await sleep(700);
      await p.click('[data-next]'); await sleep(350); await p.screenshot({ path: path.join(DIR, `80_${n}_tut2.png`) });
      const cells = await p.evaluate(() => [...document.querySelectorAll('.pw-obsc span')].map((s) => s.textContent));
      await p.click('[data-go]'); await p.evaluate(() => window.__runBot(0.3, true));
      const t0 = Date.now(); let shot = false;
      while (Date.now() - t0 < 30000) { await sleep(120); const P = await p.evaluate(() => window.__ctl._peek()); if (P.mode === 'run' && P.t > 8 && P.obs.some((o) => o.ex0 - P.dogX > 120 && o.ex0 - P.dogX < 520)) { await p.screenshot({ path: path.join(DIR, `81_${n}_run.png`) }); shot = true; break; } }
      await p.close(); return { n, cells, shot };
    };
    for (let i = 0; i < jobs.length; i += 4) (await Promise.all(jobs.slice(i, i + 4).map(one))).forEach((r) => out.push(r));
  }
  if (suite === 'bike') { // find a real bicycle on the town route (it must stand out from the parked strip bikes)
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', (e) => errors.push('bike :: ' + e.message));
    await p.goto(URL('area=town&dur=60')); await p.addScriptTag({ content: BOT }); await sleep(150); if (await p.locator('[data-go]').count()) await p.click('[data-go]');
    await p.evaluate(() => window.__runBot(0.3, true)); const t0 = Date.now(); let got = false;
    while (Date.now() - t0 < 60000) { await sleep(80); const P = await p.evaluate(() => window.__ctl._peek()); if (P.obs.some((o) => o.name === 'bicycle' && o.ex0 - P.dogX > 150 && o.ex0 - P.dogX < 450)) { await p.screenshot({ path: path.join(DIR, '82_town_bicycle.png') }); got = true; break; } }
    out.push({ bikeShot: got }); await p.close();
  }
  if (suite === 'v16touch') {
    const run = async (dev, q, tag) => {
      const p = await page(q + '&phone=1', dev); await sleep(400);
      await p.evaluate(() => window.__runTouchBot(0.3)); let shot = false; const t0 = Date.now();
      while (Date.now() - t0 < 110000) { await sleep(500); const P = await p.evaluate(() => window.__ctl._peek()); if (!shot && P.t > 14) { shot = true; await p.screenshot({ path: path.join(DIR, `70_${tag}.png`) }); } if (P.mode === 'end') break; }
      const P = await p.evaluate(() => window.__ctl._peek()); const r = { dev, q, hazards: P.hazards, touched: P.touched, hitLog: P.hitLog, rate: P.hazards ? +(1 - P.touched / P.hazards).toFixed(3) : null, ended: P.mode === 'end', timeLost: P.timeLost };
      await p.close(); return r;
    };
    (await Promise.all([run('Pixel 7', 'area=town&dur=60', 'pixel_town'), run('iPhone 13', 'area=pier&dur=75&weather=rain', 'iphone_pier'), run('Pixel 7', 'area=hilltop&dur=75&weather=rain', 'pixel_hilltop')])).forEach((r) => out.push(r));
  }
  if (suite === 'v16shots') {
    for (const [q, n] of [['area=town&tut=1', 'town'], ['area=hilltop&tut=1&weather=snow', 'hilltop'], ['area=pier&tut=1&time=night&weather=rain', 'pier']]) {
      const p = await page(q); await sleep(700); await p.click('[data-next]'); await sleep(300); await p.screenshot({ path: path.join(DIR, `71_${n}_tut2.png`) });
      await p.click('[data-go]'); await p.evaluate(() => window.__runBot(0.3, true)); await sleep(12000); await p.screenshot({ path: path.join(DIR, `72_${n}_play.png`) }); await p.close();
    }
    const p = await page('area=town&dur=60', 'iPad Pro 11'); await sleep(4500);
    out.push({ ipad: await p.evaluate(() => { const l = document.querySelector('.pw-legend'); return { cls: document.querySelector('.pw-root').className, legendVisible: !!(l && l.offsetParent), jumpLabel: document.querySelector('.pw-jump .pw-k').textContent }; }) });
    await p.screenshot({ path: path.join(DIR, '73_ipad_desk_touch.png') }); await p.close();
  }
  if (suite === 'phone') {
    const until = async (p, fn, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const P = await p.evaluate(() => window.__ctl._peek()); if (await p.evaluate(fn, P)) return P; await sleep(40); } return null; };
    const one = async (dev, tag, q) => {
      const p = await page(q + '&tut=1&phone=1', dev); const res = { dev, q };
      const cdp = await p.context().newCDPSession(p);
      const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
      await sleep(900);
      for (let i = 0; i < 4; i++) { await p.screenshot({ path: path.join(DIR, `60_${tag}_tut${i + 1}.png`) }); if (i < 3) { await p.tap('[data-next]'); await sleep(300); } }
      await p.tap('[data-go]'); await sleep(1200); await p.screenshot({ path: path.join(DIR, `61_${tag}_countdown.png`) });
      res.metrics = await p.evaluate(() => ({ vw: innerWidth, sw: document.documentElement.scrollWidth, stage: (() => { const r = document.querySelector('.pw-stage').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; })(),
        btns: [...document.querySelectorAll('.pw-root button')].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }) }));
      await until(p, (P) => P.mode === 'run');
      const vp = p.viewportSize(); const st = await p.evaluate(() => { const r = document.querySelector('.pw-stage').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      // REAL touch: hold right half = long jump
      await touch('touchStart', st.x + st.w * 0.8, st.y + st.h * 0.5); let maxH = 0; for (let i = 0; i < 18; i++) { await sleep(50); maxH = Math.max(maxH, (await p.evaluate(() => window.__ctl._peek().h))); } await touch('touchEnd');
      res.realLongJumpApex = Math.round(maxH); await sleep(1200);
      // REAL touch: swipe down on the left half = duck
      await touch('touchStart', st.x + st.w * 0.25, st.y + st.h * 0.4); await touch('touchMove', st.x + st.w * 0.25, st.y + st.h * 0.4 + 30); await touch('touchMove', st.x + st.w * 0.25, st.y + st.h * 0.4 + 60); await sleep(150);
      res.realSwipeDuck = await p.evaluate(() => window.__ctl._peek().crouch); await p.screenshot({ path: path.join(DIR, `62_${tag}_swipe_duck.png`) }); await touch('touchEnd'); await sleep(100);
      res.duckReleased = !(await p.evaluate(() => window.__ctl._peek().crouch));
      // REAL tap on the Duck button
      const db = await p.evaluate(() => { const r = document.querySelector('.pw-duck').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      await touch('touchStart', db[0], db[1]); await sleep(120); res.realDuckBtn = await p.evaluate(() => window.__ctl._peek().crouch); await touch('touchEnd');
      await sleep(400);
      // then the synthetic-touch bot plays the rest of the walk
      await p.evaluate(() => window.__runTouchBot(0.3));
      await until(p, (P) => P.obs.some((o) => o.cat !== 'wide' && o.ex0 - P.dogX < 260), 30000); await sleep(300); await p.screenshot({ path: path.join(DIR, `63_${tag}_play.png`) });
      await until(p, (P) => P.prompt, 60000); await sleep(200); await p.screenshot({ path: path.join(DIR, `64_${tag}_dig.png`) });
      const fin = await until(p, (P) => P.mode === 'end', 100000);
      await sleep(300); await p.screenshot({ path: path.join(DIR, `65_${tag}_end.png`) });
      const P = await p.evaluate(() => window.__ctl._peek()); const bs = await p.evaluate(() => { const s = window.__botStats; return { swipes: s.swipes, buttons: s.buttons, digs: s.digs }; });
      res.hazards = P.hazards; res.touched = P.touched; res.hitLog = P.hitLog; res.rate = P.hazards ? +(1 - P.touched / P.hazards).toFixed(3) : null; res.bot = bs; res.r = await p.evaluate(() => window.__ends[0]);
      res.ended = !!fin; await p.close(); return res;
    };
    (await Promise.all([one('iPhone 13', 'iphone', 'area=park&dur=60&dog=corgi'), one('Pixel 7', 'pixel', 'area=beach&dur=60&time=night&weather=rain')])).forEach((r) => out.push(r));
    const p = await page('area=river&tut=1&phone=1', 'iPhone 13 landscape'); await sleep(900); await p.screenshot({ path: path.join(DIR, '66_iphone_land_tut.png') }); await p.tap('[data-go]'); await sleep(5200); await p.screenshot({ path: path.join(DIR, '67_iphone_land_play.png') });
    out.push({ land: await p.evaluate(() => ({ vw: innerWidth, sw: document.documentElement.scrollWidth, cls: document.querySelector('.pw-root').className })) }); await p.close();
  }
  if (suite === 'tut') {
    const p = await page('area=beach&tut=1&time=night&weather=rain&dog=corgi&ab=goggles,necklace');
    await sleep(900);
    for (let i = 0; i < 4; i++) { await p.screenshot({ path: path.join(DIR, `50_tut_card${i + 1}.png`) }); if (i < 3) { await p.click('[data-next]'); await sleep(350); } }
    await p.click('[data-skip]'); await sleep(100);
    const skip = await p.evaluate(() => window.__skip);
    await p.click('[data-go]'); await sleep(1300); await p.screenshot({ path: path.join(DIR, '51_after_go.png') });
    const mode = await p.evaluate(() => window.__ctl._peek().mode);
    await p.evaluate(() => window.__runBot(0.3, true)); await sleep(9000); await p.screenshot({ path: path.join(DIR, '52_obstacles_pop.png') });
    out.push({ skipCallback: skip, modeAfterGo: mode });
    await p.close();
    const p2 = await page('area=woods&weather=snow'); await sleep(900); await p2.screenshot({ path: path.join(DIR, '53_skipped_reminder.png') });
    await p2.evaluate(() => window.__runBot(0.3, true)); await sleep(9000); await p2.screenshot({ path: path.join(DIR, '54_woods_pop.png') }); await p2.close();
    const p3 = await page('area=park&tut=1&first=1'); await sleep(600); await p3.keyboard.press('ArrowRight'); await sleep(200); await p3.keyboard.press('Space'); await sleep(200);
    out.push({ keysPage: await p3.evaluate(() => [...document.querySelectorAll('.pw-dots i')].findIndex((x) => x.classList.contains('on'))) });
    await p3.keyboard.press('Escape'); await sleep(300); out.push({ escMode: await p3.evaluate(() => window.__ctl._peek().mode) }); await p3.close();
  }
  if (suite === 'hit') {
    const p = await page('area=park&dur=75');
    for (let i = 0; i < 300; i++) { await sleep(40); if ((await p.evaluate(() => window.__ctl._peek().ts)) < 0.7) break; }
    await p.screenshot({ path: path.join(DIR, '40_hint_slowmo.png') });
    out.push({ ts: await p.evaluate(() => window.__ctl._peek().ts) });
    for (let i = 0; i < 300; i++) { await sleep(40); if ((await p.evaluate(() => window.__ctl._peek().hits)) > 0) break; }
    await sleep(250); await p.screenshot({ path: path.join(DIR, '41_hit_minus3.png') });
    out.push(await p.evaluate(() => { const P = window.__ctl._peek(); return { hits: P.hits, timeLost: P.timeLost, t: P.t }; }));
    await p.close();
  }
  if (suite === 'duck') {
    const until = async (p, fn, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const P = await p.evaluate(() => window.__ctl._peek()); if (await p.evaluate(fn, P)) return P; await sleep(40); } return null; };
    const one = async (q, n) => { const p = await page(q); await p.evaluate(() => window.__runBot(0.3, true));
      await until(p, (P) => P.crouch && P.obs.some((o) => o.cat === 'high' && o.ex0 < P.dogX + 20 && o.ex1 > P.dogX)); await p.screenshot({ path: path.join(DIR, n + '_duck.png') });
      await until(p, (P) => !P.grounded && P.h > 40 && P.obs.some((o) => o.cat === 'low' && o.ex0 < P.dogX + 40 && o.ex1 > P.dogX - 40)); await p.screenshot({ path: path.join(DIR, n + '_hop.png') }); await p.close(); };
    await Promise.all([one('area=woods&dog=golden&weather=snow', '30_woods_golden'), one('area=beach&dog=dachs', '31_beach_dachs')]);
  }
  if (suite === 'shots2') {
    const until = async (p, fn, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const P = await p.evaluate(() => window.__ctl._peek()); if (await p.evaluate(fn, P)) return P; await sleep(60); } return null; };
    let p = await page('area=park&dur=75&ab=goggles');
    await p.evaluate(() => window.__runBot(0.3, false));
    await until(p, (P) => P.obs.some((o) => o.cat === 'wide' && o.ex0 - P.dogX < 620));
    await p.screenshot({ path: path.join(DIR, '20_arc_guide.png') });
    await until(p, (P) => P.obs.some((o) => o.cat === 'wide' && o.ex0 - P.dogX < 80) && !P.grounded);
    await sleep(200); await p.screenshot({ path: path.join(DIR, '21_long_jump_air.png') });
    await until(p, (P) => P.prompt, 60000); await sleep(250);
    await p.screenshot({ path: path.join(DIR, '22_dig_prompt.png') });
    const heat = await p.evaluate(() => window.__ctl._peek().heat);
    await p.keyboard.press('d'); await sleep(1500); await p.screenshot({ path: path.join(DIR, '23_dig_result.png') });
    out.push({ firstPromptHeat: heat, digs: await p.evaluate(() => window.__ctl._peek().digsUsed) });
    await p.close();
    p = await page('area=beach&dur=75&bonus=1&dog=dachs');
    await p.evaluate(() => window.__runBot(0.3, true));
    const P2 = await until(p, (P) => P.mode === 'reveal' && !P.found, 75000);
    await sleep(200); await p.screenshot({ path: path.join(DIR, '24_bonus.png') });
    out.push({ bonusSeen: !!P2 });
    await until(p, (P) => P.mode === 'end', 90000); await sleep(400);
    out.push({ beachEnd: await p.evaluate(() => window.__ends) });
    await p.close();
  }
  if (suite === 'shots') {
    // 1: countdown + first hazards with hints, park day, first walk
    let p = await page('area=park&dur=75&first=1');
    await sleep(1200); await p.screenshot({ path: path.join(DIR, '01_countdown.png') });
    await p.evaluate(() => window.__runBot(0.3, true));
    await sleep(4300); await p.screenshot({ path: path.join(DIR, '02_park_hint.png') });
    for (let i = 0; i < 40; i++) { await sleep(250); const P = await p.evaluate(() => window.__ctl._peek()); if (P.obs.some((o) => o.cat === 'high' && o.ex0 - P.dogX < 60 && o.ex1 > P.dogX)) break; }
    await p.screenshot({ path: path.join(DIR, '03_park_duck.png') });
    for (let i = 0; i < 60; i++) { await sleep(150); const P = await p.evaluate(() => window.__ctl._peek()); if (!P.grounded && P.h > 90) break; }
    await p.screenshot({ path: path.join(DIR, '04_park_longjump.png') });
    for (let i = 0; i < 200; i++) { await sleep(150); const P = await p.evaluate(() => window.__ctl._peek()); if (P.prompt) break; }
    await p.screenshot({ path: path.join(DIR, '05_dig_prompt.png') });
    for (let i = 0; i < 40; i++) { await sleep(150); const P = await p.evaluate(() => window.__ctl._peek()); if (P.mode === 'reveal') break; }
    await sleep(300); await p.screenshot({ path: path.join(DIR, '06_reveal.png') });
    await sleep(3500);
    await p.keyboard.press('b'); await sleep(300); await p.screenshot({ path: path.join(DIR, '07_bag.png') });
    await p.click('[data-use]'); await sleep(400);
    await p.keyboard.press('Escape'); await sleep(300); await p.screenshot({ path: path.join(DIR, '08_pause.png') });
    await p.click('[data-home]'); await sleep(500); await p.screenshot({ path: path.join(DIR, '09_end_early.png') });
    out.push({ shots: 'park', ends: await p.evaluate(() => window.__ends) });
    await p.evaluate(() => window.__ctl.stop()); out.push({ afterStop: await p.evaluate(() => document.getElementById('host').innerHTML.length) });
    await p.close();
    const scene = async (q, n, wait) => { const p2 = await page(q); await p2.evaluate(() => window.__runBot(0.3, true)); await sleep(wait); await p2.screenshot({ path: path.join(DIR, n + '.png') }); await p2.close(); };
    await Promise.all([
      scene('area=river&time=night&weather=rain&dog=corgi', '10_river_night_rain', 9000),
      scene('area=woods&weather=snow&dog=dachs', '11_woods_snow', 9500),
      scene('area=beach&time=dusk&dog=husky&ab=goggles&bonus=1', '12_beach_dusk', 11000),
      scene('area=park&time=night&weather=sunny&dog=golden', '13_park_night', 7000)
    ]);
  }
  for (const r of out) { if (r.dev) { const c = { ...r }; delete c.r; console.log(JSON.stringify(c)); continue; } if (r.hazards != null) { console.log(`${r.q} | rate ${r.rate} hazards ${r.hazards} touched ${r.touched} hits ${r.hits} splash ${r.splashes} coinsSpawned ${r.coinsSpawned}/${r.coinTarget} fps ${r.fps} p95 ${r.p95} ends ${r.ends} hitLog ${JSON.stringify(r.hitLog)}\n   r=${JSON.stringify(r.r)}`); } else console.log(JSON.stringify(r)); }
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})();
