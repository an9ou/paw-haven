// node run_v17.js -> new breeds (and an unknown key) in Tennis, Frisbee, Rope, Puzzle at 1280x720
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const DIR = path.join(__dirname, 'shots_v17'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push('pageerror ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'test.html')); await sleep(700);
  const R = await p.evaluate(() => { const r = document.querySelector('#host').getBoundingClientRect(); return { x: r.left + 2, y: r.top + 2 }; });
  const mv = (x, y, steps) => p.mouse.move(R.x + x, R.y + y, { steps: steps || 1 });
  const SH = (n) => p.screenshot({ path: path.join(DIR, n + '.png') });
  const dbg = () => p.evaluate(() => window.__ctl && window.__ctl._dbg());
  const open = async (n, k) => { await p.evaluate(([n, k]) => window.openToy(n, { dog: k, outfit: {} }), [n, k]); await sleep(500); };
  const bubbles = new Set(); const grabBubble = async () => { const t = await p.evaluate(() => { const e = document.querySelector('.pt-bubble.pt-show'); return e ? e.textContent : ''; }); if (t) bubbles.add(t); };
  const throwFrom = async (x, y, dx, dy, gap = 16) => { await mv(x, y); await p.mouse.down(); await mv(x - 30, y - 10, 3); await sleep(40); for (let i = 1; i <= 4; i++) { await mv(x - 30 + dx * i / 4, y - 10 + dy * i / 4); await sleep(gap); } await p.mouse.up(); };
  const summary = [];
  const finish = async (k, name) => {
    await p.evaluate(() => window.__ctl && window.__ctl._end()); await sleep(400);
    const btn = p.locator('.pt-card .pt-btn'); if (await btn.count()) await btn.click(); await sleep(150);
    const L = await p.evaluate(() => JSON.parse(JSON.stringify(window.__log)));
    const rs = L.rewards.filter((r) => r.toy === name); L.rewards.length = 0;
    await p.evaluate(() => { window.__log.rewards.length = 0; });
    summary.push(`${k.padEnd(10)} ${name.padEnd(14)} rewards=${rs.length} happy=${rs.reduce((a, r) => a + (r.happiness || 0), 0)} closes=${L.closes}`);
  };
  for (const k of ['chihuahua', 'pug', 'greyhound', 'beagle', 'wolfdog']) {
    // Tennis: shot while carrying
    await open('Tennis Ball', k); await grabBubble();
    let d = await dbg(), shot = false;
    for (let t = 0; t < 2; t++) {
      d = await dbg(); await throwFrom(d.toy.ball.x, d.toy.ball.y, 330, -300);
      for (let i = 0; i < 50; i++) { await sleep(200); d = await dbg(); await grabBubble(); if (!shot && d.toy.brain === 'carry') { await SH(`${k}_1_tennis_carry`); shot = true; } if (d.toy.brain === 'wait' && d.toy.ball.state === 'rest' && !d.toy.ball.thrown && i > 4) break; }
    }
    if (!shot) await SH(`${k}_1_tennis_carry`);
    const tf = d.toy.fetches; await finish(k, 'Tennis Ball'); summary[summary.length - 1] += ` fetches=${tf}`;
    // Frisbee: shot at jump or carry
    await open('Frisbee', k); shot = false; let catches = 0;
    for (let t = 0; t < 2; t++) {
      d = await dbg(); await throwFrom(d.toy.disc.x, d.toy.disc.y, 300, -200, 25);
      for (let i = 0; i < 60; i++) { await sleep(120); d = await dbg(); await grabBubble(); if (!shot && (d.dog.pose === 'jump' || d.toy.brain === 'carry')) { await SH(`${k}_2_frisbee`); shot = true; } if (d.toy.brain === 'wait' && d.toy.disc.state === 'rest' && i > 6) break; }
      catches = d.toy.catches;
    }
    if (!shot) await SH(`${k}_2_frisbee`);
    await finish(k, 'Frisbee'); summary[summary.length - 1] += ` catches=${catches}`;
    // Rope: tug for a few seconds
    await open('Rope Tug', k); d = await dbg(); await mv(d.toy.hx, 480); await p.mouse.down();
    for (let i = 0; i < 40; i++) { d = await dbg(); await mv(d.toy.hx - 150, 480, 2); await sleep(150); await grabBubble(); if (i === 8) await SH(`${k}_3_rope`); if (d.toy.wins >= 1) break; }
    await p.mouse.up(); const rw = d.toy.wins; await finish(k, 'Rope Tug'); summary[summary.length - 1] += ` wins=${rw}`;
    // Puzzle: shot while sniffing, then find kibble
    await open('Puzzle Feeder', k); let t0 = Date.now(), sniffAt = -1;
    for (let i = 0; i < 30; i++) { await sleep(150); await grabBubble(); const dd = await dbg(); if (sniffAt < 0 && dd.dog.pose === 'eat') { sniffAt = Date.now() - t0; await SH(`${k}_4_puzzle_sniff`); break; } }
    if (sniffAt < 0) await SH(`${k}_4_puzzle_sniff`);
    d = await dbg(); { const r = d.toy.lids.find((L) => L.i === d.toy.kib); await mv(r.x, r.y); await p.mouse.down(); await mv(r.x + 10, r.y + 75, 8); await p.mouse.up(); await sleep(900); await grabBubble(); }
    const pf = (await dbg()).toy.found; await finish(k, 'Puzzle Feeder'); summary[summary.length - 1] += ` found=${pf} firstSniffMs=${sniffAt}`;
  }
  console.log(summary.join('\n'));
  console.log('BUBBLES', [...bubbles].join(' | '));
  console.log('ERRORS', errors.length, errors.slice(0, 8).join(' | '));
  await b.close();
})();
