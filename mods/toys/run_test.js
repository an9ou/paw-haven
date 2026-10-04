// node run_test.js  -> screenshots in shots/, prints rewards/closes/errors per toy
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const DIR = path.join(__dirname, 'shots'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'test.html')); await sleep(800);
  const SH = (n) => p.screenshot({ path: path.join(DIR, n + '.png') });
  const dbg = () => p.evaluate(() => window.__ctl && window.__ctl._dbg());
  let R = await p.evaluate(() => { const r = document.querySelector('#host').getBoundingClientRect(); return { x: r.left + 2, y: r.top + 2 }; });
  const P = (x, y) => [R.x + x, R.y + y];
  const mv = async (x, y, steps) => { const [a, c] = P(x, y); await p.mouse.move(a, c, { steps: steps || 1 }); };
  const open = async (name, o) => { await p.evaluate(([n, o]) => window.openToy(n, o), [name, o || {}]); await sleep(500); };
  const throwFrom = async (x, y, dx, dy) => { await mv(x, y); await p.mouse.down(); await mv(x - 30, y - 10, 3); await sleep(40); for (let i = 1; i <= 4; i++) { await mv(x - 30 + dx * i / 4, y - 10 + dy * i / 4); await sleep(16); } await p.mouse.up(); };
  const report = {};
  const finish = async (name, shot) => {
    await p.evaluate(() => window.__ctl && window.__ctl._end()); await sleep(600);
    if (shot) await SH(shot);
    const btn = p.locator('.pt-card .pt-btn'); if (await btn.count()) await btn.click(); await sleep(200);
    const L = await p.evaluate(() => JSON.parse(JSON.stringify(window.__log)));
    const rs = L.rewards.filter((r) => r.toy === name), sum = rs.reduce((a, r) => { for (const k of ['happiness', 'bond', 'coins', 'energy']) a[k] = (a[k] || 0) + (r[k] || 0); return a; }, {});
    report[name] = { rewards: rs.length, sum, closes: L.closes };
  };

  let d;
  // 1 Tennis Ball (day sunny)
  await open('Tennis Ball', { time: 'day', weather: 'sunny', dog: 'golden' });
  for (let k = 0; k < 3; k++) {
    d = await dbg(); const bl = d.toy.ball;
    await throwFrom(bl.x, bl.y, 380, -420);
    if (k === 0) { await sleep(280); await SH('01_tennis_flight'); }
    for (let i = 0; i < 40; i++) { await sleep(250); d = await dbg(); if (d.toy.brain === 'wait' && d.toy.ball.state === 'rest' && !d.toy.ball.thrown) break; if (i === 10 && k === 1) await SH('01b_tennis_carry'); }
  }
  { // bonk: drop the ball onto the dog's head
    for (let i = 0; i < 30; i++) { d = await dbg(); if (d.toy.brain === 'wait' && d.toy.ball.state === 'rest') break; await sleep(200); }
    d = await dbg(); await mv(d.toy.ball.x, d.toy.ball.y); await p.mouse.down(); const hx = d.dog.x + (d.dog.facing === 'left' ? -55 : 55); await mv(hx, 150, 10); await sleep(250); await p.mouse.up(); await sleep(450); await SH('01d_tennis_bonk'); await sleep(3000);
  }
  console.log('tennis', JSON.stringify((await dbg()).toy));
  await finish('Tennis Ball', '01c_tennis_card');

  // 2 Rope Tug (dusk cloudy)
  await open('Rope Tug', { time: 'dusk', weather: 'cloudy', dog: 'corgi' });
  d = await dbg(); await mv(d.toy.hx, 480); await p.mouse.down();
  for (let i = 0; i < 60; i++) { d = await dbg(); await mv(d.toy.hx - 150, 480, 2); await sleep(150); if (i === 12) await SH('02_rope_tug'); if (d.toy.wins >= 1) break; }
  await p.mouse.up(); console.log('rope', JSON.stringify(d.toy));
  await sleep(3500); await p.click('text=/^Let .* win$/'); await sleep(2500); await SH('02b_rope_letwin');
  await sleep(2000); console.log('rope2', JSON.stringify((await dbg()).toy));
  await finish('Rope Tug');

  // 3 Squeaky Duck (night sunny)
  await open('Squeaky Duck', { time: 'night', weather: 'sunny', dog: 'husky' });
  for (let i = 0; i < 3; i++) { await mv(400, 488); await p.mouse.down(); await p.mouse.up(); await sleep(350); }
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 40; i++) { d = await dbg(); if (d.toy.state === 'listen' && round === 0 && i > 2) await SH('03_duck_listen'); if (d.toy.state === 'yours') break; await sleep(200); }
    const pat = d.toy.pat; const t0 = Date.now();
    for (let j = 0; j < pat.length; j++) { const wait = pat[j] * 1000 - (Date.now() - t0); if (wait > 0) await sleep(wait); await p.mouse.down(); await p.mouse.up(); }
    await sleep(500); if (round === 0) await SH('03b_duck_result');
    await sleep(1500);
  }
  console.log('duck', JSON.stringify((await dbg()).toy));
  await finish('Squeaky Duck');

  // 4 Frisbee (day rain)
  await open('Frisbee', { time: 'day', weather: 'rain', dog: 'shiba' });
  for (let k = 0; k < 3; k++) {
    d = await dbg(); const ds = d.toy.disc;
    await throwFrom(ds.x, ds.y, 520, -260);
    let shot = false;
    for (let i = 0; i < 50; i++) { await sleep(120); d = await dbg(); if (!shot && k === 0 && d.dog.pose === 'jump') { await SH('04_frisbee_leap'); shot = true; } if (d.toy.brain === 'wait' && d.toy.disc.state === 'rest' && i > 5) break; }
    if (!shot && k === 0) await SH('04_frisbee_leap');
  }
  console.log('frisbee', JSON.stringify((await dbg()).toy));
  await finish('Frisbee');

  // 5 Plush Bone (night rain)
  await open('Plush Bone', { time: 'night', weather: 'rain', dog: 'dachs' });
  await mv(300, 512); await p.mouse.down(); await mv(600, 470, 10); await mv(800, 470, 10); await p.mouse.up();
  await sleep(600); await SH('05_plush_hug'); await sleep(3000);
  await mv(760, 480); await p.mouse.down();
  for (let i = 0; i < 14; i++) { await mv(860, 480, 8); await sleep(120); await mv(760, 480, 8); await sleep(120); if (i === 5) await SH('05b_plush_tuck'); }
  // one fast rub
  await mv(700, 480); await mv(900, 480); await mv(700, 480); await mv(900, 480);
  await p.mouse.up(); d = await dbg(); console.log('plush after fast', JSON.stringify(d.toy));
  await sleep(2000); await mv(760, 480); await p.mouse.down();
  for (let i = 0; i < 20; i++) { await mv(860, 480, 8); await sleep(120); await mv(760, 480, 8); await sleep(120); d = await dbg(); if (d.toy.state === 'night') break; }
  await p.mouse.up(); await sleep(500); await SH('05c_plush_night');
  await sleep(3500); d = await dbg(); console.log('plush', JSON.stringify(d.toy), d.finished);
  await SH('05d_plush_card');
  await finish('Plush Bone');

  // 6 Puzzle Feeder (dawn sunny)
  await open('Puzzle Feeder', { time: 'dawn', weather: 'sunny', dog: 'mutt' });
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < 40; i++) { d = await dbg(); if (d.toy.state === 'play') break; await sleep(200); }
    await sleep(1800);
    d = await dbg(); const kib = d.toy.kib, lids = d.toy.lids;
    const wrongL = lids.find((L) => L.i !== kib), right = lids.find((L) => L.i === kib);
    await mv(wrongL.x, wrongL.y); await p.mouse.down(); await mv(wrongL.x, wrongL.y + 70, 8); await p.mouse.up(); await sleep(500);
    if (round === 0) await SH('06_puzzle_sniff');
    await mv(right.x, right.y); await p.mouse.down(); await mv(right.x + 10, right.y + 75, 8); await p.mouse.up(); await sleep(900);
    if (round === 0) await SH('06b_puzzle_found');
    await sleep(2600);
    if (round === 0) { await sleep(400); await SH('06c_puzzle_shuffle'); }
  }
  console.log('puzzle', JSON.stringify((await dbg()).toy.found), JSON.stringify((await dbg()).toy.wrong));
  await finish('Puzzle Feeder');

  // 7 Driftwood Stick (day snow)
  await open('Driftwood Stick', { time: 'day', weather: 'snow', dog: 'golden' });
  for (let k = 0; k < 2; k++) {
    d = await dbg(); const s = d.toy.stick;
    await throwFrom(s.x, s.y, 560, -380);
    let shot = 0;
    for (let i = 0; i < 90; i++) { await sleep(200); d = await dbg(); if (k === 0 && shot === 0 && d.toy.wet && d.toy.brain === 'carry') { await SH('07_stick_swim'); shot = 1; } if (k === 0 && shot === 1 && d.dog.pose === 'shake') { await SH('07b_stick_shake'); shot = 2; } if (d.toy.brain === 'wait' && d.toy.stick.state === 'rest' && !d.toy.stick.thrown && i > 5) break; }
  }
  console.log('stick', JSON.stringify((await dbg()).toy));
  await finish('Driftwood Stick');

  // 8 Rubber Chicken (dusk rain)
  await open('Rubber Chicken', { time: 'dusk', weather: 'rain', dog: 'husky' });
  for (let k = 0; k < 7; k++) { await mv(420, 478); await p.mouse.down(); await sleep(300 + k * 150); if (k === 3) await SH('08_chicken_squeeze'); await p.mouse.up(); await sleep(700); if (k === 2) await SH('08b_chicken_howl'); }
  await sleep(500); await SH('08c_chicken_meter');
  console.log('chicken', JSON.stringify((await dbg()).toy));
  await finish('Rubber Chicken');

  // 9 Glow Ball (night cloudy) + close via Esc
  await open('Glow Ball', { time: 'night', weather: 'cloudy', dog: 'corgi' });
  for (let k = 0; k < 2; k++) {
    d = await dbg(); const bl = d.toy.ball;
    await throwFrom(bl.x, bl.y, 420, -380);
    if (k === 0) { await sleep(350); await SH('09_glow_trail'); }
    for (let i = 0; i < 40; i++) { await sleep(250); d = await dbg(); if (d.toy.brain === 'wait' && d.toy.ball.state === 'rest' && !d.toy.ball.thrown) break; }
  }
  console.log('glow', JSON.stringify((await dbg()).toy));
  const before = await p.evaluate(() => window.__log.closes);
  await p.keyboard.press('Escape'); await sleep(200);
  const after = await p.evaluate(() => window.__log.closes);
  const leftovers = await p.evaluate(() => document.querySelectorAll('.pt-root').length);
  console.log('esc close', before, '->', after, 'leftover roots', leftovers);
  const L = await p.evaluate(() => JSON.parse(JSON.stringify(window.__log)));
  const rs = L.rewards.filter((r) => r.toy === 'Glow Ball'); report['Glow Ball'] = { rewards: rs.length, sum: rs.reduce((a, r) => { for (const k of ['happiness', 'coins', 'energy']) a[k] = (a[k] || 0) + (r[k] || 0); return a; }, {}) };
  console.log(JSON.stringify(report, null, 1));
  const sfx = {}; L.sfx.forEach((n) => sfx[n] = (sfx[n] || 0) + 1); console.log('sfx', JSON.stringify(sfx));
  console.log('ERRORS', errors.length, errors.slice(0, 10).join('\n'));
  await b.close();
})();
