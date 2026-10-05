// v1.7.1 PLAY: trick training mini-games (Treat Lure tracks, lure fading, Speak rhythm, Show off traces). Desktop 1280x720, harness.js merged.
// node game/run_tests.js game/test_v171_tricks.js
// The game exposes window.__pawTG (track points in screen coordinates, beat times); game/tricks_drive.js moves the real mouse along them.
const { trace, speak, settle, ready } = require('./tricks_drive');
require('./test_lib').run('v171_tricks', async (t) => {
  const { ok, sec, ev, SH } = t; const p = await t.boot(); await t.adopt({ sex: 'girl' }); // Mochi: stubborn (x0.9 tolerance, x1.25 progress)
  await t.patch({ bond: { level: 10, pts: 5000 }, coins: 1000, stats: { hunger: 70, happy: 90, energy: 90 } }); await t.home();
  const prog = (n) => ev((n) => { const x = window.__paw.S.dog.tricks[n]; return x && typeof x === 'object' ? x.p : 0; }, n);
  const focus = () => ev(() => Math.round(window.__paw.S.dog.focus ? window.__paw.S.dog.focus.v : 100));
  const refill = () => ev(() => { window.__paw.S.dog.focus = { v: 100, at: window.__paw.S.gameMin }; });
  const last = () => ev(() => window.__pawTG.last);
  const line = () => p.textContent('#trLine');
  const start = async (n) => { await ready(t); if (n) { await p.click(`[data-tr="${n}"]`); await t.until((n) => window.__paw.train.trick === n, n, 3000); } await p.click('#trStart'); };

  sec('the panel and the track');
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play=tricks]'); await settle(t);
  ok(await p.locator('#trGood').count() === 0 && await p.locator('#trLure').count() === 0, 'the old Good! click marker and lure toggle are gone');
  ok(await p.locator('#trStart').count() === 1, 'Start button');
  await p.click('[data-tr="Sit"]'); await refill(); const f0 = await focus(); await start(); const f1 = await focus();
  ok(await t.until(() => !!document.querySelector('#trTrack .tg-dots') && !!document.querySelector('#trTrack .tg-start') && !!document.querySelector('#trTrack .tg-star') && !!document.querySelector('#trTrack .tg-treat'), null, 4000), 'a dotted track with a start dot, an end star and the treat cursor');
  const tr0 = await ev(() => window.__pawTG.track()); const box = await p.locator('#dogHit').boundingBox();
  const st0 = tr0.segs[0].pts[0], en0 = tr0.segs[0].pts[tr0.segs[0].pts.length - 1];
  ok(st0[0] > box.x && st0[0] < box.x + box.width + 30 && st0[1] > box.y - 40 && st0[1] < box.y + box.height, `Sit track starts at the nose (${st0.map(Math.round)}) and arcs back over the head (end ${en0.map(Math.round)})`);
  ok(en0[0] < st0[0] && en0[1] < st0[1], 'Sit: up and back');
  ok(Math.abs(tr0.tol - 28 * 0.9) < 0.6, `tolerance ${tr0.tol.toFixed(1)} px each side (28 px x 0.9 stubborn)`);
  await SH('01_sit_track');

  sec('Great, Good, Missed');
  await trace(t, 'great'); let L = await last(); const pA = await prog('Sit');
  ok(L.grade === 'Great' && Math.abs(pA - 0.4375) < 0.001, `Great (${L.acc}% on the track): +35% x1.25 stubborn = ${Math.round(pA * 100)}%`);
  ok(f0 - f1 >= 14 && f0 - f1 <= 15, `one attempt costs 15 Focus (${f0} -> ${f1}, it refills over time)`);
  ok(/Great!/.test(await line()), 'big feedback line: ' + (await line()).trim());
  await start(); await trace(t, 'miss'); L = await last(); const pB = await prog('Sit');
  ok(L.grade === 'Missed' && pB === pA, `Missed (${L.acc}%): no progress, no penalty`); ok(/Oops!/.test(await line()), 'funny miss line: ' + (await line()).trim());
  await start(); await trace(t, 'good'); L = await last(); const pC = await prog('Sit');
  ok(L.grade === 'Good' && Math.abs(pC - pA - 0.25) < 0.001, `Good (${L.acc}%): +20% x1.25 = ${Math.round(pC * 100)}%`);

  sec('lure fading at 60%');
  ok(pC >= 0.6, `progress ${Math.round(pC * 100)}% is past the fade line`);
  await start(); ok(await t.until(() => !!document.querySelector('#trTrack.hand .tg-hand') && !document.querySelector('#trTrack .tg-treat'), null, 4000), 'the treat is gone: a hand signal and a fainter track'); await SH('02_hand_signal');
  ok((await ev(() => window.__pawTG.game.mode)) === 'hand', 'hand-signal mode');
  await trace(t, 'great'); L = await last(); const pD = await prog('Sit');
  ok(L.grade === 'Great' && pD === 1, `hand signal Great: +35% x1.3 x1.25 -> Learned (${Math.round(pD * 100)}%)`);
  ok(await t.waitToast(/learned Sit/), 'Learned toast after 4 attempts (3 scored)');

  sec('too fast, dropping the treat, keyboard');
  await refill(); await start('Lie Down'); await trace(t, 'fast'); L = await last();
  ok(L.grade === 'Missed' && L.why === 'fast' && /lost the scent/.test(await line()), 'too fast: "' + (await line()).trim() + '"');
  await start(); await t.until(() => !!window.__pawTG.track(), null, 4000); let tr = await ev(() => window.__pawTG.track()); let pts = tr.segs[0].pts;
  await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); const half = Math.floor(pts.length / 2);
  for (let i = 1; i <= half; i++) { await p.mouse.move(pts[i][0], pts[i][1]); await t.sleep(14); } await p.mouse.up();
  ok(await t.until(() => window.__pawTG.game && window.__pawTG.game.retry, null, 2000) && /dropped/.test(await line()), 'let go early: one retry from the last point');
  await p.mouse.move(pts[half][0], pts[half][1]); await p.mouse.down();
  for (let i = half; i < pts.length; i++) { await p.mouse.move(pts[i][0], pts[i][1]); await t.sleep(14); } await p.mouse.up();
  await t.until(() => !window.__pawTG.game, null, 6000); L = await last(); ok(L.grade === 'Great', 'carried on after the retry: ' + L.grade);
  await start(); await t.until(() => !!window.__pawTG.track(), null, 4000);
  for (let i = 0; i < 40 && await ev(() => !!window.__pawTG.game); i++) { await p.keyboard.press('ArrowRight'); await t.sleep(30); }
  await t.until(() => !window.__pawTG.game, null, 6000); L = await last(); ok(L.grade === 'Great', 'keyboard fallback: arrow keys move the treat along the track (' + L.grade + ')');

  sec('a track for every trick');
  const shapes = {};
  for (const n of ['Paw', 'Roll Over', 'Spin', 'Play Dead', 'Bow', 'Dance']) {
    await refill(); await start(n); await t.until(() => !!window.__pawTG.track(), null, 4000); tr = await ev(() => window.__pawTG.track());
    shapes[n] = tr.segs.map((s) => s.type).join('+');
    if (n === 'Spin' || n === 'Paw') await SH('03_track_' + n.replace(' ', ''));
    await trace(t, 'great'); L = await last(); ok(L.grade === 'Great', `${n}: ${shapes[n]} traced, ${L.grade} (${L.acc}%)`);
  }
  ok(shapes.Paw === 'tap+hold' && shapes['Play Dead'] === 'path+hold' && shapes.Bow === 'path+hold', 'Paw = 2 taps + hold, Play Dead = zigzag + hold, Bow = down + hold');

  sec('Speak rhythm');
  await refill(); await start('Speak'); ok(await t.until(() => !!document.getElementById('trSpeak'), null, 3000), 'Speak! button for the rhythm game');
  await t.ev(() => { window.__pa = []; const A = window.PawAudio; if (A && A.bark && !A.bark.__t) { const o = A.bark.bind(A); A.bark = (v, k, op) => { window.__pa.push(k); return o(v, k, op); }; A.bark.__t = true; } });
  await speak(t, [0, 40, -60]); L = await last(); ok(L.grade === 'Great' && L.acc === 100, `3 beats within 120 ms: Great (${L.acc}%)`);
  ok(await ev(() => window.__pa.filter((k) => k === 'woof').length >= 3), 'the dog barks back on each beat');
  await start(); await speak(t, [170, -190, 160]); L = await last(); ok(L.grade === 'Good', `beats 160-190 ms off: Good (${L.acc}%)`);
  await start(); await speak(t, [null, 330, null]); L = await last(); ok(L.grade === 'Missed', `missed beats: Missed (${L.acc}%)`);

  sec('signature combo (Bond 10)');
  await refill(); await start('Signature'); await t.until(() => !!window.__pawTG.track(), null, 4000);
  const parts = await ev(() => window.__pawTG.game.parts); ok(parts.length === 3, 'signature = 3 tracks: ' + parts.join(', '));
  await trace(t, 'great'); L = await last(); ok(L.grade === 'Great' && (await prog('Signature')) > 0.4, 'signature combo traced: ' + L.grade);

  sec('learning takes a reasonable number of attempts');
  await ev(() => { window.__paw.S.dog.tricks.Dance = { p: 0, shows: 0 }; });
  let tries = 0; while ((await prog('Dance')) < 1 && tries < 8) { tries++; await refill(); await start('Dance'); await trace(t, tries % 2 ? 'great' : 'good'); }
  ok((await prog('Dance')) === 1 && tries >= 3 && tries <= 5, `Dance learned in ${tries} attempts (Great/Good mix)`);

  sec('Focus runs out');
  await ready(t); await ev(() => { window.__paw.S.dog.focus = { v: 10, at: window.__paw.S.gameMin }; }); await p.click('#trStart');
  ok(await t.until(() => /brain is full/.test(document.getElementById('trLine').textContent), null, 3000) && !(await ev(() => !!window.__pawTG.game)), 'Focus below 15: "brain is full", no attempt');

  sec('Show off by quick signal traces');
  await ev(() => { const d = window.__paw.S.dog; ['Sit', 'Paw', 'Lie Down'].forEach((n) => { d.tricks[n] = { p: 1, shows: 0 }; }); }); await ready(t);
  await p.click('[data-trtab=show]'); await p.waitForSelector('[data-show]'); const c0 = (await t.S()).coins;
  let k = 0; for (const n of ['Sit', 'Paw', 'Lie Down']) {
    k++; await p.click(`[data-show="${n}"]`); await t.until(() => !!window.__pawTG.track(), null, 4000);
    if (k === 1) { const tr2 = await ev(() => window.__pawTG.track()); ok(tr2.mode === 'show' && !!(await p.locator('#trTrack.show .tg-hand').count()), 'show trace: hand signal, no treat'); await SH('04_show_trace'); }
    await trace(t, 'great'); await t.until((k) => window.__paw.train && window.__paw.train.chain === k, k, 8000);
  }
  await t.until(() => /COMBO x3/.test(document.getElementById('trLine').textContent), null, 6000);
  ok(/COMBO x3/.test(await line()) && (await t.S()).coins - c0 >= 9, `combo x3 by traces: +${(await t.S()).coins - c0} coins`);
  await t.until(() => !window.__paw.train.held, null, 6000);
  await p.click('[data-show="Sit"]'); await trace(t, 'miss'); await t.until(() => window.__paw.train && window.__paw.train.chain === 0, null, 6000);
  ok(/lost the signal/.test(await line()), 'a sloppy trace breaks the chain');
  await ev(() => { window.__paw.S.dog.tricks.Paw.shows = 5; }); await t.until(() => !window.__paw.train.held, null, 6000);
  await p.click('[data-show="Paw"]'); await t.until(() => !!window.__pawTG.track(), null, 4000); const tw = (await ev(() => window.__pawTG.track())).tol;
  ok(Math.abs(tw - 28 * 0.9 * 1.3) < 0.6, `Mastered tricks get a wider tolerance (${tw.toFixed(1)} px)`); await trace(t, 'great');

  sec('old saves keep their progress');
  await t.until(() => !window.__paw.train.held, null, 6000); await p.click('#trX');
  await ev(() => { const d = window.__paw.S.dog; d.tricks.Bow = 2; d.tricks['Roll Over'] = { p: 0.5, shows: 1 }; });
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play=tricks]'); await settle(t);
  ok(Math.abs((await prog('Bow')) - 2 / 3) < 0.001 && (await prog('Roll Over')) === 0.5, 'old numeric progress (2 of 3) converts to 67%, stage data kept');
  await p.click('#trX'); ok(await t.until(() => !window.__paw.train && !document.getElementById('trTrack'), null, 3000), 'closing the panel removes everything');
});
