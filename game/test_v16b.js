// v1.6b: dog voices + idle behaviour scheduler (desktop 1280x720, harness.js merged). node game/test_v16b.js  (or: node game/run_tests.js v16b)
// Time + weather are pinned by test_lib (ovrTime day / ovrWeather cloudy). The night-howl check switches to night itself and then back to the pin.
// Sound checks wait for the bark to be logged (PawAudio.bark is wrapped) instead of sleeping; "nothing happened" checks use one short settle.
require('./test_lib').run('v16b', async (t) => {
  const { ok, sec, ev, S, rnd, SH, sleep } = t;
  // log every PawAudio.bark call
  const tap = () => ev(() => { window.__pa = window.__pa || []; const A = window.PawAudio; if (A && A.bark && !A.bark.__wrapped) { const o = A.bark.bind(A); A.bark = (v, k, op) => { window.__pa.push({ v, k, op, t: Math.round(performance.now()) }); return o(v, k, op); }; A.bark.__wrapped = true; } });
  const calls = () => ev(() => window.__pa.slice());
  const mark = () => ev(() => window.__pa.length);
  const since = async (n) => (await calls()).slice(n);
  const has = async (n, kind) => (await since(n)).some((c) => c.k === kind);
  const hasWait = (n, kind, ms) => t.until(([n, kind]) => window.__pa.slice(n).some((c) => c.k === kind), [n, kind], ms || 6000);
  const reset = () => ev(() => window.__paw.voice.reset());
  const settle = (ms) => sleep(ms || 300); // only for "nothing should happen" checks
  const dayPin = () => t.dev(async () => { await t.p.selectOption('#dvTime', 'day'); await t.p.selectOption('#dvWeather', 'cloudy'); });

  const p = await t.boot(); await t.adopt({ sex: 'girl' }); await tap();
  await t.patch({ bond: { level: 7, pts: 1600 }, coins: 2000 }); await t.calm();
  ok(await ev(() => typeof window.PawAudio.bark === 'function'), 'PawAudio.bark is available (no fallback needed)');
  ok((await ev(() => JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}').ovrTime)) === 'day', 'time is pinned to day by the test harness');

  sec('greeting when the game opens');
  await ev(() => window.__paw.saveNow()); await p.reload(); await p.waitForSelector('#tContinue'); await tap(); let n = await mark();
  await p.click('#tContinue'); await hasWait(n, 'play', 10000); await hasWait(n, 'whine', 10000); await t.calm();
  ok(await has(n, 'play') && await has(n, 'whine'), 'greeting on open: play bark + whine');
  const c0 = (await calls()).find((c) => c.k === 'play');
  ok(c0 && c0.v.breed === 'shiba' && c0.v.pitch >= 0.85 && c0.v.pitch <= 1.15 && c0.v.size === 'small', 'voice = breed + seeded pitch + size: ' + JSON.stringify(c0 && c0.v));

  sec('food: yip when the Feed popup opens');
  n = await mark(); await reset(); await rnd(0.1); await p.click('[data-act=feed]'); await t.waitPop(true); ok(await hasWait(n, 'yip'), 'Feed popup opened: excited yip'); await rnd(null);
  await p.click('#trayX'); await t.waitPop(false);

  sec('demand + cooldown');
  n = await mark(); await reset(); await ev(() => { window.__paw.S.stats.hunger = 10; });
  await ev(() => window.__paw.voice.tick()); await hasWait(n, 'demand'); await hasWait(n, 'whine'); await ev(() => window.__paw.voice.tick()); await settle(300);
  const dem = (await since(n)).filter((c) => c.k === 'demand').length;
  ok(dem === 1 && await has(n, 'whine'), `hungry: one demand bark + whine, cooldown holds (${dem} demand)`);
  await ev(() => { window.__paw.S.stats.hunger = 80; });

  sec('grumpy at the bath');
  n = await mark(); await reset(); await p.click('[data-act=care]'); await t.waitPop(true); await p.click('[data-care=bath]');
  ok(await hasWait(n, 'huff'), 'bath: grumpy huff (Mochi always)'); await p.click('#bathQuit'); await t.untilMode('yard');

  sec('play: toy start, rope tug');
  n = await mark(); await reset(); await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play="toy:Tennis Ball"]');
  ok(await hasWait(n, 'play'), 'toy start: play bark'); await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  await ev(() => window.__paw.S.inv.toys.push('Rope Tug')); n = await mark(); await reset();
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play="tug"]');
  ok(await hasWait(n, 'growl-play', 8000), 'rope tug: growl-play');

  sec('speak (show-off)');
  await ev(() => { const d = window.__paw.S.dog; d.tricks.Speak = { p: 1, shows: 0 }; window.__paw.go('yard'); }); await t.untilMode('yard'); n = await mark(); await reset();
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play=tricks]'); await p.waitForSelector('[data-trtab=show]'); await p.click('[data-trtab=show]');
  await p.click('[data-show="Speak"]'); await require('./tricks_drive').speak(t, [0]); ok(await hasWait(n, 'woof', 8000), 'Speak trick (rhythm tap on the beat): woof');
  await t.until(() => window.__paw.train && !window.__paw.train.game && !window.__paw.train.held, null, 5000); await p.click('#trX'); await t.until(() => !window.__paw.train, null, 4000);

  sec('clicked while asleep / sleeping');
  await ev(() => { window.__paw.S.sleeping = true; window.__paw.go('yard'); }); await t.untilMode('yard'); await t.until(() => !!document.getElementById('dogHit')); n = await mark();
  await p.click('#dogHit', { force: true }); ok(await hasWait(n, 'huff'), 'clicked while asleep: sleepy huff');
  n = await mark(); await reset(); await rnd(0.1); await ev(() => window.__paw.voice.tick()); await rnd(null); ok(await has(n, 'snore'), 'sleeping: snore');
  await ev(() => { window.__paw.S.sleeping = false; window.__paw.S.stats.energy = 90; window.__paw.go('yard'); }); await t.untilMode('yard');

  sec('alert at an NPC dog in the park, cooldown on repeats');
  await t.travel('park'); n = await mark(); await reset(); await rnd(0.1);
  await ev(() => window.__paw.voice.ambient()); await t.until((n) => window.__pa.slice(n).some((c) => c.k === 'alert'), n, 6000); await ev(() => window.__paw.voice.ambient()); await settle(300); await rnd(null);
  const al = (await since(n)).filter((c) => c.k === 'alert' && !(c.op && c.op.distance)).length;
  ok(al === 1, `NPC passes: alert bark, second one blocked by the 25 s cooldown (${al})`); await SH('01_alert_park');

  sec('Captain Fluff: shiba scream 1 in 3');
  n = await mark(); await reset(); await rnd(0.1); await ev(() => window.__paw.voice.fluff()); await rnd(null);
  ok(await hasWait(n, 'scream'), 'Captain Fluff: Mochi screams (1 in 3)');

  sec('second dog: contagious barking, night howl');
  await t.travel('yard'); await t.dev(async () => { await p.click('#dvPack'); });
  ok(await t.toShelter(), 'shelter opens'); await p.locator('[data-shadopt^="rescue"]').first().click(); await p.fill('#shName', 'Frost'); await p.click('#shOk');
  ok(await t.until(() => window.__paw.S.dogs.length === 2 && window.__paw.mode === 'yard', null, 12000), 'second dog adopted'); await t.lu(); await t.calm();
  await ev(() => { window.__paw.S.dogs[1].key = 'husky'; window.__paw.go('yard'); }); await t.untilMode('yard');
  n = await mark(); await reset(); await rnd(0.1); await p.click('[data-act=feed]'); await t.waitPop(true);
  await t.until(([n]) => window.__pa.slice(n).some((c) => c.v.breed === 'husky'), [n], 8000); await rnd(null);
  const cont = (await since(n)).filter((c) => c.v.breed === 'husky');
  ok(cont.length >= 1 && ['talk', 'woof', 'alert'].includes(cont[0].k), 'contagious: the other dog answers (' + (cont[0] && cont[0].k) + ')'); await p.click('#trayX'); await t.waitPop(false);
  n = await mark(); await reset();
  await t.dev(async () => { await p.selectOption('#dvTime', 'night'); await p.selectOption('#dvWeather', 'sunny'); });
  await ev(() => window.__paw.voice.tick());
  ok(await hasWait(n, 'howl'), 'clear night at home: husky howls at the moon');
  n = await mark(); await rnd(0.01); await ev(() => window.__paw.voice.tick()); await t.until((n) => window.__pa.slice(n).some((c) => c.op && c.op.distance === 0.8), n, 6000); await rnd(null);
  ok((await since(n)).some((c) => c.op && c.op.distance === 0.8), 'night: a distant neighbourhood bark (distance 0.8)');
  await dayPin(); // back to the day/cloudy pin (NOT "auto": that would put the real clock back in charge)

  sec('idle behaviour scheduler: every behaviour, fast-forwarded');
  await ev(() => window.__paw.idle.speed(0.08)); await t.calm();
  const names = await ev(() => window.__paw.idle.names);
  for (const nm of names) {
    await ev(() => window.__paw.S.dogs.forEach((d) => { d.stats.energy = 80; d.stats.happy = 80; d.stats.hunger = 80; d.sleeping = false; }));
    if (nm === 'sniff') await rnd(0.1);
    const l0 = await ev(() => window.__idleLog.length); await ev((nm) => window.__paw.idle.force(nm), nm);
    const seen = await t.until(([l0, nm]) => window.__idleLog.slice(l0).some((x) => x.name === nm), [l0, nm], 8000);
    ok(seen, 'idle behaviour: ' + nm);
    if (['down', 'nap', 'zoomies', 'social', 'roll', 'sniff'].includes(nm)) await SH('idle_' + nm);
    if (nm === 'yawn') { await t.until(() => window.__pa.some((c) => c.k === 'yawn'), null, 4000); ok((await calls()).some((c) => c.k === 'yawn'), 'yawn sound with the yawn'); }
    if (nm === 'sniff') { await t.until(() => window.__pa.some((c) => c.k === 'sneeze'), null, 4000); await rnd(null); ok((await calls()).some((c) => c.k === 'sneeze'), 'sniffing: sneeze'); }
    await t.until(() => !window.__paw.idle.act, null, 10000);
  }
  // natural picking
  const l1 = await ev(() => window.__idleLog.length); const got = await t.until((l1) => window.__idleLog.length - l1 >= 2, l1, 20000); const l2 = await ev(() => window.__idleLog.length);
  ok(got && l2 - l1 >= 2, `the scheduler picks behaviours on its own (${l2 - l1} so far at 12x speed): ` + (await ev((l1) => window.__idleLog.slice(l1).map((x) => x.name).join(', '), l1)));
  // any player action interrupts instantly and never blocks clicks
  await ev(() => window.__paw.idle.speed(1)); await ev(() => window.__paw.idle.force('zoomies'));
  ok(await t.until(() => !!window.__paw.idle.act, null, 8000), 'zoomies running');
  await p.click('[data-act=feed]'); ok(await t.until(() => !window.__paw.idle.act, null, 3000) && await t.waitPop(true), 'a click interrupts the idle behaviour instantly and still opens Feed');
  await p.click('#trayX'); await t.waitPop(false);
  await ev(() => window.__paw.idle.force('nap')); ok(await t.until(() => !!window.__paw.idle.act, null, 8000), 'nap running'); const hb = await p.locator('#dogHit').boundingBox();
  await p.mouse.click(hb.x + hb.width / 2, hb.y + hb.height / 2);
  ok(await t.until(() => !window.__paw.idle.act, null, 3000), 'clicking the dog stops its idle nap');

  sec('settings: Fewer stops ambient barks, Off silences everything');
  await ev(() => window.__paw.idle.speed(1));
  await p.click('#gearBtn'); await p.waitForSelector('[data-barkm="fewer"]'); await p.click('[data-barkm="fewer"]'); await t.closeX();
  await t.travel('park'); n = await mark(); await reset(); await rnd(0.1); await ev(() => window.__paw.voice.ambient()); await settle(300); await rnd(null);
  ok(!(await has(n, 'alert')), 'Fewer: ambient alert barks are off');
  await p.click('#gearBtn'); await p.waitForSelector('[data-barkm="off"]'); await p.click('[data-barkm="off"]');
  ok(await t.until(() => JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}').bark === 'off'), 'Barking: Off saved in prefs'); await SH('02_settings_off'); await t.closeX();
  n = await mark(); await reset(); await rnd(0.1);
  await p.click('[data-act=feed]'); await t.waitPop(true); await settle(800); await p.click('#trayX'); await t.waitPop(false); await ev(() => window.__paw.voice.ambient()); await ev(() => window.__paw.voice.tick()); await settle(300); await rnd(null);
  ok((await since(n)).length === 0, 'Off: no barks at all');
  await p.click('#gearBtn'); await p.waitForSelector('[data-barkm="normal"]'); await p.click('[data-barkm="normal"]'); await t.closeX();
});
