// node run_phone.js -> touch playthrough of all 9 toys on iPhone 13 and Pixel 7 (Chromium, CDP touch)
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const devName of ['iPhone 13', 'Pixel 7']) {
    const tag = devName.replace(/\s/g, '').toLowerCase(), DIR = path.join(__dirname, 'shots_phone', tag); fs.mkdirSync(DIR, { recursive: true });
    const dv = Object.assign({}, devices[devName]); delete dv.defaultBrowserType;
    const c = await b.newContext(dv); const p = await c.newPage(); const cdp = await c.newCDPSession(p);
    const errors = []; p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push('pageerror ' + e.message));
    await p.goto('file://' + path.join(__dirname, 'test.html')); await sleep(700);
    const SH = (n) => p.screenshot({ path: path.join(DIR, n + '.png') });
    const dbg = () => p.evaluate(() => window.__ctl && window.__ctl._dbg());
    const map = (x, y) => p.evaluate(([x, y]) => window.__ctl._map(x, y), [x, y]);
    const T = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 8, radiusY: 8, force: 1 }] });
    const wdown = async (x, y) => { const m = await map(x, y); await T('touchStart', m.x, m.y); return m; };
    const wmove = async (x, y) => { const m = await map(x, y); await T('touchMove', m.x, m.y); };
    const wup = async () => T('touchEnd');
    const tap = async (x, y) => { await wdown(x, y); await sleep(40); await wup(); };
    const flick = async (x, y, dx, dy, steps = 5, gap = 16) => { await wdown(x, y); await sleep(60); for (let i = 1; i <= steps; i++) { await wmove(x + dx * i / steps, y + dy * i / steps); await sleep(gap); } await wup(); };
    const open = async (n, o) => { await p.evaluate(([n, o]) => window.openToy(n, o), [n, o || {}]); await sleep(600); };
    const waitBrain = async (k, n = 50) => { for (let i = 0; i < n; i++) { await sleep(200); const d = await dbg(); const o = d.toy[k]; if (d.toy.brain === 'wait' && o.state === 'rest' && !o.thrown && i > 4) return d; } return dbg(); };
    const report = {};
    const finish = async (name, shot) => {
      await p.evaluate(() => window.__ctl && window.__ctl._end()); await sleep(600);
      if (shot) await SH(shot);
      const bb = await p.locator('.pt-card .pt-btn').boundingBox();
      if (bb) await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(250);
      const L = await p.evaluate(() => JSON.parse(JSON.stringify(window.__log)));
      const rs = L.rewards.filter((r) => r.toy === name), sum = {}; rs.forEach((r) => { for (const k of ['happiness', 'bond', 'coins', 'energy']) if (r[k]) sum[k] = (sum[k] || 0) + r[k]; });
      report[name] = { n: rs.length, sum: JSON.stringify(sum), closes: L.closes };
    };
    const checks = async (label) => p.evaluate((label) => {
      const bad = [...document.querySelectorAll('.pt-root button')].filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((a) => a[1] < 44 || a[2] < 44);
      return { label, sw: document.documentElement.scrollWidth, vw: innerWidth, small: bad, phone: window.__ctl && window.__ctl._map(0, 0).phone };
    }, label);
    let d;
    // Tennis
    await open('Tennis Ball', { dog: 'golden' }); console.log(devName, JSON.stringify(await checks('tennis')));
    for (let k = 0; k < 2; k++) { d = await dbg(); await flick(d.toy.ball.x, d.toy.ball.y, 300, -330); if (!k) { await sleep(300); await SH('01_tennis'); } d = await waitBrain('ball'); }
    console.log(' tennis', JSON.stringify(d.toy)); await finish('Tennis Ball', '01b_card');
    // Rope
    await open('Rope Tug', { dog: 'corgi', time: 'dusk' }); console.log(devName, JSON.stringify(await checks('rope')));
    d = await dbg(); await wdown(d.toy.hx, 480);
    for (let i = 0; i < 70; i++) { d = await dbg(); await wmove(d.toy.hx - 150, 480); await sleep(140); if (i === 10) await SH('02_rope'); if (d.toy.wins >= 1) break; }
    await wup(); console.log(' rope', JSON.stringify(d.toy)); await sleep(3500);
    const lb = await p.locator('.pt-dock .pt-btn').boundingBox(); if (lb) { await p.touchscreen.tap(lb.x + lb.width / 2, lb.y + lb.height / 2); } await sleep(2500); console.log(' rope2', JSON.stringify((await dbg()).toy)); await finish('Rope Tug');
    // Duck
    await open('Squeaky Duck', { dog: 'husky', time: 'night' });
    for (let i = 0; i < 3; i++) { await tap(400, 488); await sleep(350); }
    for (let i = 0; i < 40; i++) { d = await dbg(); if (d.toy.state === 'listen' && i > 3) { await SH('03_duck'); } if (d.toy.state === 'yours') break; await sleep(200); }
    { const pat = d.toy.pat, t0 = Date.now(); for (let j = 0; j < pat.length; j++) { const w = pat[j] * 1000 - (Date.now() - t0); if (w > 0) await sleep(w); await tap(400, 488); } }
    await sleep(600); await SH('03b_duck_result'); console.log(' duck', JSON.stringify((await dbg()).toy)); await finish('Squeaky Duck');
    // Frisbee
    await open('Frisbee', { dog: 'shiba', weather: 'rain' });
    for (let k = 0; k < 2; k++) { d = await dbg(); await flick(d.toy.disc.x, d.toy.disc.y, 320, -190, 5, 22); let shot = false; for (let i = 0; i < 50; i++) { await sleep(120); d = await dbg(); if (!k && !shot && d.dog.pose === 'jump') { await SH('04_frisbee'); shot = true; } if (d.toy.brain === 'wait' && d.toy.disc.state === 'rest' && i > 5) break; } if (!k && !shot) await SH('04_frisbee'); }
    console.log(' frisbee', JSON.stringify((await dbg()).toy)); await finish('Frisbee');
    // Plush
    await open('Plush Bone', { dog: 'dachs', time: 'night', weather: 'rain' });
    await wdown(300, 512); for (let i = 1; i <= 10; i++) { await wmove(300 + 50 * i, 512 - 4 * i); await sleep(30); } await wup(); await sleep(3600);
    await wdown(770, 490); for (let i = 0; i < 24; i++) { await wmove(i % 2 ? 770 : 860, 490); await sleep(i % 2 ? 140 : 140); for (let k = 1; k <= 5; k++) { await wmove((i % 2 ? 860 : 770) + (i % 2 ? -18 : 18) * k, 490); await sleep(25); } if (i === 8) await SH('05_plush_tuck'); d = await dbg(); if (d.toy.state === 'night') break; } await wup();
    console.log(' plush', JSON.stringify((await dbg()).toy)); await sleep(3800); await SH('05b_plush_card'); await finish('Plush Bone');
    // Puzzle
    await open('Puzzle Feeder', { dog: 'mutt', time: 'dawn' }); await sleep(2000);
    d = await dbg(); { const kib = d.toy.kib, w = d.toy.lids.find((L) => L.i !== kib), r = d.toy.lids.find((L) => L.i === kib);
      await wdown(w.x, w.y); for (let i = 1; i <= 6; i++) { await wmove(w.x, w.y + 12 * i); await sleep(25); } await wup(); await sleep(500); await SH('06_puzzle');
      await wdown(r.x, r.y); for (let i = 1; i <= 6; i++) { await wmove(r.x + 2 * i, r.y + 12 * i); await sleep(25); } await wup(); await sleep(900); await SH('06b_puzzle_found'); }
    console.log(' puzzle', JSON.stringify((await dbg()).toy.found)); await finish('Puzzle Feeder');
    // Stick
    await open('Driftwood Stick', { dog: 'golden', weather: 'snow' });
    d = await dbg(); await flick(d.toy.stick.x, d.toy.stick.y, 520, -380); let sh = 0;
    for (let i = 0; i < 90; i++) { await sleep(200); d = await dbg(); if (!sh && d.toy.wet && d.toy.brain === 'carry') { await SH('07_stick_swim'); sh = 1; } if (d.toy.brain === 'wait' && d.toy.stick.state === 'rest' && !d.toy.stick.thrown && i > 5) break; }
    console.log(' stick', JSON.stringify(d.toy)); await finish('Driftwood Stick');
    // Chicken
    await open('Rubber Chicken', { dog: 'husky', weather: 'rain', time: 'dusk' });
    for (let k = 0; k < 5; k++) { await wdown(420, 478); await sleep(400 + k * 150); await wup(); await sleep(700); if (k === 2) await SH('08_chicken'); }
    console.log(' chicken', JSON.stringify((await dbg()).toy)); await finish('Rubber Chicken');
    // Glow
    await open('Glow Ball', { dog: 'corgi', time: 'night' });
    d = await dbg(); await flick(d.toy.ball.x, d.toy.ball.y, 320, -300); await sleep(350); await SH('09_glow'); d = await waitBrain('ball');
    console.log(' glow', JSON.stringify(d.toy)); await finish('Glow Ball');
    for (const k in report) console.log(' ', k.padEnd(16), report[k].n, report[k].sum, 'closes=' + report[k].closes);
    console.log(devName, 'ERRORS', errors.length, errors.slice(0, 6).join(' | '));
    await c.close();
  }
  await b.close();
})();
