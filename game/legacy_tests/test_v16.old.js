// v1.6: trick training + the bigger town (desktop 1280x720 + iPhone 13), harness.js merged. node test_v16.js
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const DIR = path.join(__dirname, 'shots_v16'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = []; const ok = (c, l) => { console.log(c ? '  ok  ' : '  FAIL', l); if (!c) fails.push(l); };

async function run(b, phone) {
  const tag = phone ? 'phone' : 'desk'; console.log(`\n# ${phone ? 'iPhone 13' : 'desktop 1280x720'}`);
  const ctx = await b.newContext(phone ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push(e.message));
  const SH = (n) => p.screenshot({ path: path.join(DIR, `${tag}_${n}.png`) });
  const S = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const ev = (f, a) => p.evaluate(f, a);
  const act = async (sel, o = {}) => { const l = p.locator(sel).first(); if (phone) await l.tap(o); else await l.click(o); await sleep(o.wait ?? 300); };
  const lu = async () => { for (let i = 0; i < 6 && await p.locator('#luOk').count(); i++) await act('#luOk'); };
  const calm = () => ev(() => window.__paw.S.dogs.forEach((d) => { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = window.__paw.S.gameMin + 9999; }));
  const rnd = (v) => ev((v) => { if (!window.__rnd0) window.__rnd0 = Math.random; Math.random = v == null ? window.__rnd0 : () => v; }, v);
  const travel = async (k) => {
    await act('[data-act=map]', { wait: 700 }); await ev((k) => window.__paw.mapTo(k), k); await sleep(120);
    await p.locator(`[data-area=${k}]`).first()[phone ? 'tap' : 'click']({ force: true }); await sleep(300);
    if (phone) await act('#mapGoBtn', { wait: 100 });
    await sleep(1800); await lu(); await calm();
  };
  const trick = (n) => ev((n) => { const t = window.__paw.S.dog.tricks[n]; return t && typeof t === 'object' ? t.p : 0; }, n);
  const line = () => p.textContent('#trLine');

  await p.goto(URL); await sleep(700);
  await act('#tNew', { wait: 400 }); await act('#aGirl'); await act('#aAdopt', { wait: 400 }); await act('#nOk', { wait: 400 });
  for (let i = 0; i < 3; i++) { if (await p.locator('#iNext').count()) await act('#iNext', { wait: 350 }); }
  await sleep(600); await calm(); await ev(() => { const S = window.__paw.S; S.bond.level = 7; S.bond.pts = 1400; S.coins = 1000; S.stats.energy = 90; S.stats.happy = 90; });
  await ev(() => window.__paw.go('yard')); await sleep(500);

  // ---- training session ----
  await act('[data-act=play]', { wait: 400 }); await act('[data-play=tricks]', { wait: 600 });
  const geo = await ev(() => { const tp = document.getElementById('trainPanel').getBoundingClientRect(), dg = document.getElementById('dogHit').getBoundingClientRect(), vw = innerWidth, vh = innerHeight; return { tp: [tp.left, tp.top, tp.width, tp.height], dg: [dg.left, dg.top, dg.right, dg.bottom], vw, vh, dim: getComputedStyle(document.getElementById('dock')).display }; });
  ok(geo.dim === 'none', 'training: no dimmed popup over the scene');
  if (phone) ok(geo.tp[3] <= geo.vh * 0.345 && geo.dg[3] <= geo.tp[1] + 2, `phone: bottom strip ${Math.round(geo.tp[3])}px <= 34%, dog above it`);
  else ok(geo.tp[2] <= 300 && geo.tp[0] >= geo.dg[2], `desktop: right panel ${Math.round(geo.tp[2])}px wide, not covering the dog`);
  await SH('01_training');
  await act('[data-tr="Sit"]');
  // correct + fast mark
  await rnd(0.01); const p0 = await trick('Sit'); await act('#trCue', { wait: 0 });
  for (let i = 0; i < 30 && !(await ev(() => !!(window.__paw.train && window.__paw.train.att))); i++) await sleep(50);
  await SH('02_attempt'); await act('#trGood', { force: true, wait: 300 }); const p1 = await trick('Sit');
  ok(p1 > p0 + (phone ? 0.11 : 0.19), `correct pose marked: progress ${Math.round(p0 * 100)}% -> ${Math.round(p1 * 100)}% (${p1 - p0 > 0.19 ? 'perfect timing' : 'a bit late'})`); await SH('03_marked');
  await sleep(1500);
  // wrong behaviour marked = confused
  await rnd(0.99); await act('#trCue', { wait: 0 }); for (let i = 0; i < 30 && !(await ev(() => !!(window.__paw.train && window.__paw.train.att))); i++) await sleep(50);
  await act('#trGood', { force: true, wait: 300 }); const p2 = await trick('Sit');
  ok(Math.abs(p2 - (p1 - 0.05)) < 0.001 && /now thinks/.test(await line()), `marking a wrong behaviour: -5% (${Math.round(p2 * 100)}%), "${(await line()).trim()}"`);
  await sleep(1500);
  // wrong behaviour ignored = no cost
  await act('#trCue', { wait: 0 }); await sleep(2900); const p3 = await trick('Sit');
  ok(p3 === p2 && /Ignoring it was right/.test(await line()), 'ignoring the wrong behaviour costs nothing');
  // lure: easier, half progress
  await act('#trLure'); ok((await p.getAttribute('#trLure', 'aria-pressed')) === 'true', 'lure on');
  await rnd(0.01); await act('#trCue', { wait: 0 }); for (let i = 0; i < 30 && !(await ev(() => !!(window.__paw.train && window.__paw.train.att))); i++) await sleep(50);
  await act('#trGood', { force: true, wait: 300 }); const p4 = await trick('Sit');
  ok(Math.abs((p4 - p3) - 0.125) < 0.02, `lured success gives half progress (+${Math.round((p4 - p3) * 100)}%; Mochi is stubborn: 25% / 2)`);
  await sleep(1500);
  // focus runs out
  await ev(() => { const d = window.__paw.S.dog; d.focus = { v: 15, at: window.__paw.S.gameMin }; });
  await act('#trCue', { wait: 0 }); await sleep(2900); await act('#trCue', { wait: 400 });
  ok(/brain is full/.test(await line()), 'focus runs out: "' + (await line()).trim() + '"'); await SH('04_focus_out');
  await rnd(null);

  // ---- show-off combo with an audience in Town Square ----
  await act('#trX'); await travel('square'); ok((await S()).place === 'square', 'travelled to Town Square');
  await ev(() => { const d = window.__paw.S.dog; ['Sit', 'Paw', 'Lie Down'].forEach((n) => { d.tricks[n] = { p: 1, shows: 0 }; }); });
  await act('[data-act=play]', { wait: 400 }); await act('[data-play=tricks]', { wait: 500 }); await act('[data-trtab=show]', { wait: 300 });
  ok(await p.locator('#audience').count() === 1, 'NPC audience appears in a public place');
  await rnd(0.01); const c0 = (await S()).coins;
  for (const n of ['Sit', 'Paw', 'Lie Down']) { await act(`[data-show="${n}"]`, { wait: 2200 }); }
  const c1 = (await S()).coins; await rnd(null);
  ok(/COMBO x3/.test(await line()) && c1 - c0 >= 18, `show-off combo x3: +${c1 - c0} coins (3 x 3 x audience 2, + the Town notice goal)`); await SH('05_combo');
  ok((await S()).daily.squareGoal === true, 'Town notice goal: 3 tricks shown in the Square');
  await act('#trX');

  // ---- map pan + zoom ----
  await act('[data-act=map]', { wait: 800 });
  const tf = () => ev(() => document.getElementById('mapInner').style.transform); const t0 = await tf();
  const pb = await p.locator('#mapPan').boundingBox();
  if (phone) { const cdp = await ctx.newCDPSession(p); const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(pb.x + 250, pb.y + 300) }); for (let i = 1; i <= 8; i++) { await sleep(25); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(pb.x + 250 - i * 20, pb.y + 300 - i * 10) }); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { await p.mouse.move(pb.x + 600, pb.y + 300); await p.mouse.down(); await p.mouse.move(pb.x + 400, pb.y + 200, { steps: 8 }); await p.mouse.up(); }
  await sleep(300); const t1 = await tf(); ok(t1 !== t0, 'map pans by drag');
  const z0 = await p.textContent('#mapZoomLbl');
  if (phone) await act('#mapZin'); else { await p.mouse.move(pb.x + 500, pb.y + 300); await p.mouse.wheel(0, -500); await sleep(300); }
  const z1 = await p.textContent('#mapZoomLbl'); ok(z1 !== z0, `map zoom ${z0} -> ${z1}`); await SH('06_map');
  await act('#mapX', { wait: 500 });
  for (const k of ['cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'square']) { await travel(k); ok((await S()).place === k, 'travelled to ' + k); await SH('07_place_' + k); }

  // ---- café, vet, salon ----
  await travel('cafe'); let s0 = await S(); await act('#placeBtns [data-pb=cafe]', { wait: 400 }); await SH('08_cafe_menu');
  await act('[data-cafe="Pupuccino"]', { wait: 1800 }); let s1 = await S();
  ok(s1.coins === s0.coins - 12 && !!s1.dog.cafeDay, 'café: Pupuccino served (-12 coins)');
  await act('#placeBtns [data-pb=cafe]', { wait: 400 }); await act('[data-cafe="Doggy Donut"]', { force: true, wait: 300 }); ok((await S()).coins === s1.coins, 'café: one treat per dog per day'); await act('.panel .x');
  await travel('vet'); s0 = await S(); await act('#placeBtns [data-pb=vet]', { wait: 400 }); await act('#vetGo', { wait: 500 });
  s1 = await S(); ok(s1.coins === s0.coins - 30 && /Health card/.test(await p.textContent('.panel h2')), 'vet: check-up, health card (-30 coins)'); await SH('09_vet_card'); await act('#vetOk');
  await travel('salon'); await ev(() => { window.__paw.S.stats.clean = 40; }); s0 = await S(); await act('#placeBtns [data-pb=groom]', { wait: 400 }); await act('#slGo', { wait: 1200 });
  s1 = await S(); ok(s1.coins === s0.coins - 40 && s1.stats.clean >= 99 && s1.dog.fluffyUntil > s1.gameMin, 'salon: full groom, Fresh & Fluffy'); await SH('10_salon');

  // ---- Town Loop walk ----
  await travel('yard'); await act('[data-act=walk]', { wait: 800 });
  for (let i = 0; i < 8; i++) { if (/Town Loop/.test(await p.textContent('.rt-card.cur'))) break; await act('#rtNext', { wait: 500 }).catch(async () => { await p.keyboard.press('ArrowRight'); await sleep(500); }); }
  ok(/Town Loop/.test(await p.textContent('.rt-card.cur')), 'walk carousel has the Town Loop'); await SH('11_routes_town');
  await act('#rtStart', { wait: 1300 });
  for (let i = 0; i < 10; i++) { const g = p.locator('button:has-text("Let\'s go")'); if (await g.count()) { await g.first()[phone ? 'tap' : 'click'](); break; } await sleep(300); }
  await sleep(2500); ok((await ev(() => window.__paw.mode)) === 'walk', 'Town Loop walk running'); await SH('12_town_walk');
  await p.keyboard.press('Escape'); await sleep(600); if (await p.locator('[data-home]').count()) await act('[data-home]');
  for (let i = 0; i < 20 && !(await p.locator('#resOk').count()); i++) await sleep(300);
  ok(await p.locator('#resOk').count() === 1, 'Town Loop results'); if (await p.locator('#resOk').count()) await act('#resOk', { wait: 900 });
  const [sw, iw] = await ev(() => [document.documentElement.scrollWidth, innerWidth]); ok(sw === iw, `no horizontal scroll (${sw} = ${iw})`);
  ok(errors.length === 0, `no console errors${errors.length ? ' -> ' + errors.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  await run(b, false); // phone paused by the client (v1.6b): run(b, true) is kept for later
  console.log(fails.length ? `\nFAILED ${fails.length}: ${fails.join(' | ')}` : '\nALL OK');
  await b.close();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
