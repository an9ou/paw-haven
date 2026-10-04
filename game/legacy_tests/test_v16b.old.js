// v1.6b: dog voices + idle behaviour scheduler (desktop 1280x720, harness.js merged). node test_v16b.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const DIR = path.join(__dirname, 'shots_v16b'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = []; const ok = (c, l) => { console.log(c ? '  ok  ' : '  FAIL', l); if (!c) fails.push(l); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push(e.message));
  const SH = (n) => p.screenshot({ path: path.join(DIR, n + '.png') });
  const ev = (f, a) => p.evaluate(f, a);
  const S = () => ev(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const lu = async () => { for (let i = 0; i < 6 && await p.locator('#luOk').count(); i++) { await p.click('#luOk'); await sleep(300); } };
  const calm = () => ev(() => window.__paw.S.dogs.forEach((d) => { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = window.__paw.S.gameMin + 9999; }));
  const rnd = (v) => ev((v) => { if (!window.__rnd0) window.__rnd0 = Math.random; Math.random = v == null ? window.__rnd0 : () => v; }, v);
  // log every PawAudio.bark call
  const tap = () => ev(() => { window.__pa = window.__pa || []; const A = window.PawAudio; if (A && A.bark && !A.bark.__wrapped) { const o = A.bark.bind(A); A.bark = (v, k, op) => { window.__pa.push({ v, k, op, t: Math.round(performance.now()) }); return o(v, k, op); }; A.bark.__wrapped = true; } });
  const calls = () => ev(() => window.__pa.slice());
  const mark = () => ev(() => window.__pa.length);
  const since = async (n) => (await calls()).slice(n);
  const has = async (n, kind) => (await since(n)).some((c) => c.k === kind);
  const reset = () => ev(() => window.__paw.voice.reset());
  const travel = async (k) => { await p.click('[data-act=map]'); await sleep(600); await ev((k) => window.__paw.mapTo(k), k); await sleep(120); await p.click(`[data-area=${k}]`); await sleep(1800); await lu(); await calm(); };

  await p.goto(URL); await sleep(700); await tap();
  await p.click('#tNew'); await sleep(300); await p.click('#aGirl'); await p.click('#aAdopt'); await sleep(300); await p.click('#nOk'); await sleep(300);
  for (let i = 0; i < 3; i++) { await p.click('#iNext'); await sleep(300); }
  await sleep(500); await calm(); await ev(() => { const S = window.__paw.S; S.bond.level = 7; S.bond.pts = 1400; S.coins = 2000; });
  ok(await ev(() => typeof window.PawAudio.bark === 'function'), 'PawAudio.bark is available (no fallback needed)');
  // v1.7: pin daytime so a real-clock night does not fire the moon howl early (the night checks set night themselves)
  await p.click('#devBtn'); await sleep(150); await p.selectOption('#dvTime', 'day'); await p.click('#dvX'); await sleep(300);

  // ---- greeting when the game opens ----
  await ev(() => window.__paw.saveNow()); await p.reload(); await sleep(700); await tap(); let n = await mark();
  await p.click('#tContinue'); await sleep(2200); await calm();
  ok(await has(n, 'play') && await has(n, 'whine'), 'greeting on open: play bark + whine');
  const c0 = (await calls()).find((c) => c.k === 'play');
  ok(c0 && c0.v.breed === 'shiba' && c0.v.pitch >= 0.85 && c0.v.pitch <= 1.15 && c0.v.size === 'small', 'voice = breed + seeded pitch + size: ' + JSON.stringify(c0 && c0.v));

  // ---- food: yip when the Feed popup opens ----
  await reset(); await rnd(0.1); n = await mark(); await p.click('[data-act=feed]'); await sleep(300); await rnd(null);
  ok(await has(n, 'yip'), 'Feed popup opened: excited yip'); await p.click('#trayX'); await sleep(200);

  // ---- demand + cooldown ----
  await reset(); await ev(() => { window.__paw.S.stats.hunger = 10; }); n = await mark();
  await ev(() => window.__paw.voice.tick()); await sleep(1100); await ev(() => window.__paw.voice.tick()); await sleep(200);
  const dem = (await since(n)).filter((c) => c.k === 'demand').length;
  ok(dem === 1 && await has(n, 'whine'), `hungry: one demand bark + whine, cooldown holds (${dem} demand)`);
  await ev(() => { window.__paw.S.stats.hunger = 80; });

  // ---- grumpy at the bath ----
  await reset(); n = await mark(); await p.click('[data-act=care]'); await sleep(250); await p.click('[data-care=bath]'); await sleep(400);
  ok(await has(n, 'huff'), 'bath: grumpy huff (Mochi always)'); await p.click('#bathQuit'); await sleep(600);

  // ---- play: toy start, rope tug ----
  await reset(); n = await mark(); await p.click('[data-act=play]'); await sleep(300); await p.click('[data-play="toy:Tennis Ball"]'); await sleep(1200);
  ok(await has(n, 'play'), 'toy start: play bark'); await ev(() => window.__paw.go('yard')); await sleep(600);
  await ev(() => window.__paw.S.inv.toys.push('Rope Tug')); await reset(); n = await mark();
  await p.click('[data-act=play]'); await sleep(300); await p.click('[data-play="tug"]'); await sleep(1600);
  ok(await has(n, 'growl-play'), 'rope tug: growl-play');

  // ---- speak (show-off) ----
  await ev(() => { const d = window.__paw.S.dog; d.tricks.Speak = { p: 1, shows: 0 }; }); await reset(); n = await mark();
  await p.click('[data-act=play]'); await sleep(300); await p.click('[data-play=tricks]'); await sleep(400); await p.click('[data-trtab=show]'); await sleep(300);
  await rnd(0.01); await p.click('[data-show="Speak"]'); await sleep(2200); await rnd(null);
  ok(await has(n, 'woof'), 'Speak trick: woof'); await p.click('#trX'); await sleep(300);

  // ---- clicked while asleep ----
  await ev(() => { window.__paw.S.sleeping = true; window.__paw.go('yard'); }); await sleep(600); n = await mark();
  await p.click('#dogHit', { force: true }); await sleep(300);
  ok(await has(n, 'huff'), 'clicked while asleep: sleepy huff');
  await reset(); await rnd(0.1); n = await mark(); await ev(() => window.__paw.voice.tick()); await rnd(null); ok(await has(n, 'snore'), 'sleeping: snore');
  await ev(() => { window.__paw.S.sleeping = false; window.__paw.S.stats.energy = 90; window.__paw.go('yard'); }); await sleep(500);

  // ---- alert at an NPC dog in the park, cooldown on repeats ----
  await travel('park'); await reset(); await rnd(0.1); n = await mark();
  await ev(() => window.__paw.voice.ambient()); await sleep(200); await ev(() => window.__paw.voice.ambient()); await sleep(200); await rnd(null);
  const al = (await since(n)).filter((c) => c.k === 'alert' && !(c.op && c.op.distance)).length;
  ok(al === 1, `NPC passes: alert bark, second one blocked by the 25 s cooldown (${al})`);
  await SH('01_alert_park');

  // ---- Captain Fluff: shiba scream 1 in 3 ----
  await reset(); await rnd(0.1); n = await mark(); await ev(() => window.__paw.voice.fluff()); await rnd(null);
  ok(await has(n, 'scream'), 'Captain Fluff: Mochi screams (1 in 3)');

  // ---- second dog: contagious barking, night howl ----
  await travel('yard'); await p.click('#devBtn'); await sleep(150); await p.click('#dvPack'); await sleep(200); if (await p.locator('#devPanel:not([hidden])').count()) await p.click('#dvX'); await sleep(300); await lu();
  await p.click('[data-act=map]'); await sleep(600); await ev(() => window.__paw.mapTo('shelter')); await sleep(120); await p.click('[data-area=shelter]'); await sleep(900);
  await p.locator('[data-shadopt^="rescue"]').first().click(); await sleep(300); await p.fill('#shName', 'Frost'); await p.click('#shOk'); await sleep(1500); await lu(); await calm();
  ok((await S()).dogs.length === 2, 'second dog adopted');
  await ev(() => { window.__paw.S.dogs[1].key = 'husky'; window.__paw.go('yard'); }); await sleep(500);
  await reset(); await rnd(0.1); n = await mark(); await p.click('[data-act=feed]'); await sleep(1600); await rnd(null);
  const cont = (await since(n)).filter((c) => c.v.breed === 'husky');
  ok(cont.length >= 1 && ['talk', 'woof', 'alert'].includes(cont[0].k), 'contagious: the other dog answers (' + (cont[0] && cont[0].k) + ')'); await p.click('#trayX'); await sleep(200);
  await reset(); n = await mark();
  await p.click('#devBtn'); await sleep(150); await p.selectOption('#dvTime', 'night'); await p.selectOption('#dvWeather', 'sunny'); await p.click('#dvX'); await sleep(400);
  await ev(() => window.__paw.voice.tick());
  ok(await has(n, 'howl'), 'clear night at home: husky howls at the moon');
  await rnd(0.01); n = await mark(); await ev(() => window.__paw.voice.tick()); await rnd(null);
  ok((await since(n)).some((c) => c.op && c.op.distance === 0.8), 'night: a distant neighbourhood bark (distance 0.8)');
  await p.click('#devBtn'); await sleep(150); await p.selectOption('#dvTime', 'auto'); await p.selectOption('#dvWeather', 'auto'); await p.click('#dvX'); await sleep(300);

  // ---- idle behaviour scheduler: every behaviour, fast-forwarded ----
  await ev(() => window.__paw.idle.speed(0.08)); await calm();
  const names = await ev(() => window.__paw.idle.names);
  for (const nm of names) {
    await ev(() => window.__paw.S.dogs.forEach((d) => { d.stats.energy = 80; d.stats.happy = 80; d.stats.hunger = 80; d.sleeping = false; }));
    if (nm === 'sniff') await rnd(0.1);
    const l0 = await ev(() => window.__idleLog.length); await ev((nm) => window.__paw.idle.force(nm), nm);
    let seen = false; for (let i = 0; i < 20 && !seen; i++) { await sleep(100); seen = await ev(([l0, nm]) => window.__idleLog.slice(l0).some((x) => x.name === nm), [l0, nm]); }
    ok(seen, 'idle behaviour: ' + nm);
    if (['down', 'nap', 'zoomies', 'social', 'roll', 'sniff'].includes(nm)) { await sleep(250); await SH('idle_' + nm); }
    if (nm === 'yawn') { await sleep(200); ok((await calls()).some((c) => c.k === 'yawn'), 'yawn sound with the yawn'); }
    if (nm === 'sniff') { await sleep(500); await rnd(null); ok((await calls()).some((c) => c.k === 'sneeze'), 'sniffing: sneeze'); }
    for (let i = 0; i < 60 && await ev(() => window.__paw.idle.act); i++) await sleep(100);
  }
  // natural picking
  const l1 = await ev(() => window.__idleLog.length); await sleep(7000); const l2 = await ev(() => window.__idleLog.length);
  ok(l2 - l1 >= 2, `the scheduler picks behaviours on its own (${l2 - l1} in 7 s at 12x speed): ` + (await ev((l1) => window.__idleLog.slice(l1).map((x) => x.name).join(', '), l1)));
  // any player action interrupts instantly and never blocks clicks
  await ev(() => window.__paw.idle.speed(1)); await ev(() => window.__paw.idle.force('zoomies')); await sleep(300); ok(!!(await ev(() => window.__paw.idle.act)), 'zoomies running');
  await p.click('[data-act=feed]'); await sleep(150);
  ok(!(await ev(() => window.__paw.idle.act)) && await p.locator('#dock .tray:not(.dock-idle)').count() === 1, 'a click interrupts the idle behaviour instantly and still opens Feed');
  await p.click('#trayX'); await sleep(200);
  await ev(() => window.__paw.idle.force('nap')); await sleep(300); const hb = await p.locator('#dogHit').boundingBox(); const b0 = (await S()).dogs[0].stats.happy;
  await p.mouse.click(hb.x + hb.width / 2, hb.y + hb.height / 2); await sleep(200);
  ok(!(await ev(() => window.__paw.idle.act)), 'clicking the dog stops its idle nap');

  // ---- settings: Fewer stops ambient barks, Off silences everything ----
  await ev(() => window.__paw.idle.speed(1));
  await p.click('#gearBtn'); await sleep(300); await p.click('[data-barkm="fewer"]'); await sleep(150); await p.click('.panel .x'); await sleep(200);
  await travel('park'); await reset(); await rnd(0.1); n = await mark(); await ev(() => window.__paw.voice.ambient()); await sleep(200); await rnd(null);
  ok(!(await has(n, 'alert')), 'Fewer: ambient alert barks are off');
  await p.click('#gearBtn'); await sleep(300); await p.click('[data-barkm="off"]'); await sleep(150);
  ok((await ev(() => JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}').bark)) === 'off', 'Barking: Off saved in prefs'); await SH('02_settings_off'); await p.click('.panel .x'); await sleep(200);
  await reset(); await rnd(0.1); n = await mark();
  await p.click('[data-act=feed]'); await sleep(1500); await p.click('#trayX'); await sleep(200); await ev(() => window.__paw.voice.ambient()); await ev(() => window.__paw.voice.tick()); await rnd(null);
  ok((await since(n)).length === 0, 'Off: no barks at all');
  await p.click('#gearBtn'); await sleep(300); await p.click('[data-barkm="normal"]'); await sleep(150); await p.click('.panel .x');

  ok(errors.length === 0, `no console errors${errors.length ? ' -> ' + errors.slice(0, 3).join(' | ') : ''}`);
  console.log(fails.length ? `\nFAILED ${fails.length}: ${fails.join(' | ')}` : '\nALL OK');
  await b.close();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
