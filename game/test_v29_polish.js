// v29_polish (V29.md section 3, POLISH lane), desktop 1280x720. Phones: test_phone_v29_polish.js.
//   1 the Play board's sniff summary names the dog;       2 the painter's chip labels have room;
//   3 the yard clipboard is not hidden by a tray (desktop: it was never hidden, and still is not);
//   5 the map controls: the desktop map is not moved by the phone settle;     6 the newborn squeaks are levelled (offline render, dB).
// Items 3 to 5 are phone fixes: here we only prove the desktop is untouched.
// node game/run_tests.js v29_polish
require('./test_lib').run('v29_polish', async (t) => {
  const { ok, sec, ev, S } = t;
  const p = () => t.p;
  await t.newGame({ sex: 'girl' }, { bond: { level: 7, pts: 1450 }, coins: 5000, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bartholomew'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pickle'); P.addDog({ key: 'beagle', sex: 'female', months: 30 }, 'Mrs Waggington'); P.S.sniffer = true; });
  await t.home('square'); await t.freezeMotion(true);

  sec('1: the Play board names the dog it sniffed');
  await ev(() => window.__paw.town.openBoard()); await p().waitForSelector('.pbcard');
  const names = await ev(() => [...document.querySelectorAll('.pbcard > b')].map((b) => b.childNodes[0].textContent.trim()));
  ok(names.length === 4 && names.every(Boolean), 'four board dogs: ' + names.join(', '));
  ok(await p().locator('[data-sniff]').count() === 4, 'every board dog has a Sniff button');
  await p().click('[data-sniff="1"]');
  ok(await t.until(() => !!document.querySelector('.pbcard[data-npc="1"] .pbsniff'), null, 3000), 'the sniff summary shows');
  const sn = await ev(() => document.querySelector('.pbcard[data-npc="1"] .pbsniff').textContent.trim());
  ok(sn.startsWith(names[1] + ' sniffed:') && sn.length > names[1].length + 10, `the summary names the dog: "${sn}"`);
  ok(await ev(() => document.querySelectorAll('.pbsniff').length) === 1 && await p().locator('[data-sniff]').count() === 3, 'only that card changed');
  await p().click('[data-sniff="3"]'); const sn3 = await ev(() => document.querySelector('.pbcard[data-npc="3"] .pbsniff').textContent.trim());
  ok(sn3.startsWith(names[3] + ' sniffed:'), `the other card names its own dog: "${sn3}"`);
  await ev(() => window.__paw.closeModal ? window.__paw.closeModal() : null); await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.town.openBoard()); await p().waitForSelector('.pbcard');
  ok(await ev(() => document.querySelector('.pbcard[data-npc="1"] .pbsniff').textContent.trim()) === sn, 'reopening the board keeps the named summary');
  await t.closeX(); await t.modalGone();

  sec('2: the painter chip labels have room');
  await ev(() => window.__paw.town.twOpenPainter()); await p().waitForSelector('.painter .tw-pick');
  const chips = await ev(() => {
    const R = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
    const panel = R(document.querySelector('#modal .panel')), note = R(document.getElementById('twPickNote'));
    return { panel, note, c: [...document.querySelectorAll('.painter .tw-pick')].map((b) => ({ n: b.textContent.trim(), b: R(b), s: R(b.querySelector('span')), h: R(b.querySelector('svg')), fs: parseFloat(getComputedStyle(b.querySelector('span')).fontSize) })) };
  });
  ok(chips.c.length === 4, 'four dog chips: ' + chips.c.map((c) => c.n).join(', '));
  ok(chips.c.every((c) => c.s[0] >= c.b[0] && c.s[2] <= c.b[2] + 0.5 && c.s[1] >= c.b[1] && c.s[3] <= c.b[3] + 0.5), 'each name sits inside its own chip');
  ok(chips.c.every((c) => c.s[0] >= c.h[2] - 1), 'the name is beside the head, not under it');
  ok(chips.c.every((c, i) => chips.c.every((d, j) => i === j || !t.hitR(c.b, d.b))), 'no two chips overlap');
  ok(chips.c.every((c) => c.b[3] <= chips.note[1] + 0.5), 'no chip reaches the "picked" note under them');
  ok(chips.c.every((c) => c.b[0] >= chips.panel[0] && c.b[2] <= chips.panel[2]), 'every chip stays inside the card');
  ok(chips.c.every((c) => c.fs >= 15 && c.b[3] - c.b[1] >= 43.5), 'labels are 15 px and chips 44 px tall');
  ok(chips.c.some((c) => /Mrs Waggington/.test(c.n)), 'the longest name is shown whole: ' + chips.c.map((c) => c.n).join(' | '));
  await p().click('.painter [data-tpick]:nth-child(1)');
  ok(await ev(() => document.querySelector('.painter [data-tpick]').getAttribute('aria-pressed')) === 'false', 'a chip still toggles on a tap');
  ok(await ev(() => document.getElementById('twPickNote').textContent) === '3 of 4 picked.', 'and the note counts: 3 of 4 picked.');
  await t.closeX(); await t.modalGone();

  sec('3: desktop yard clipboard stays visible with a tray open');
  await t.home('yard'); await t.calm();
  for (const a of ['feed', 'play', 'care']) {
    await p().click(`[data-act=${a}]`); ok(await t.waitPop(true), `${a} tray is open`);
    ok(await ev(() => { const g = document.getElementById('msCardG'); return !!g && getComputedStyle(g).visibility !== 'hidden'; }), `${a} tray: the clipboard is still there`);
    await p().click(`[data-act=${a}]`); await t.waitPop(false);
  }

  sec('5: the desktop map is not moved by the phone settle');
  await ev(() => window.__paw.go('map')); await p().waitForSelector('#mapZoom'); await t.until(() => document.querySelectorAll('#mapInner svg text').length > 5, null, 6000);
  const m0 = await ev(() => ({ tx: document.getElementById('mapInner').style.transform, top: document.getElementById('mapZoom').style.top }));
  await p().mouse.move(600, 400); await p().mouse.down(); for (let i = 1; i <= 8; i++) await p().mouse.move(600 - 40 * i, 400); await p().mouse.up();
  await t.sleep(700); // "nothing should happen": one settle longer than the phone settle delay (320 ms)
  const m1 = await ev(() => ({ tx: document.getElementById('mapInner').style.transform, top: document.getElementById('mapZoom').style.top }));
  ok(m1.tx !== m0.tx && m1.top === '', 'a drag pans the map and the zoom column keeps its own place');
  await p().click('#mapZin'); ok(await t.until(() => document.getElementById('mapZoomLbl').textContent === '120%', null, 3000), 'zoom in still works (120%)');
  await t.home('yard');

  sec('6: the newborn squeaks are levelled');
  const L = await ev(async () => {
    const PA = window.PawAudio; const r = await PA._renderBarks({ age: 'newborn', kinds: ['yip', 'woof', 'whine', 'whimper'], sampleRate: 24000 });
    return r.items.map((i) => ({ b: i.breed, k: i.kind, db: i.loud50msDb, pk: i.peak }));
  });
  const dbs = L.map((i) => i.db), lo = Math.min(...dbs), hi = Math.max(...dbs);
  ok(L.length === 14 * 4, `rendered 14 breeds x 4 kinds (${L.length})`);
  ok(lo >= -27.5, `no newborn squeak, mew or whimper is quieter than -27.5 dB (quietest ${lo} dB; it was -31)`);
  ok(hi <= -21.5, `none is louder than -21.5 dB (loudest ${hi} dB)`);
  ok(hi - lo <= 5, `the whole spread is within 5 dB (${(hi - lo).toFixed(1)} dB; it was 11)`);
  ok(Math.max(...L.map((i) => i.pk)) < 0.5, `peaks stay well under clipping (max ${Math.max(...L.map((i) => i.pk))})`);
  const quiet = ['golden', 'dachshund', 'samoyed', 'greyhound', 'husky'].map((b) => L.find((i) => i.b === b && i.k === 'woof').db);
  ok(quiet.every((d) => d >= -26), 'the breeds that used to be quiet are up: ' + quiet.join(', ') + ' dB');
  const adult = await ev(async () => { const r = await window.PawAudio._renderBarks({ breeds: ['corgi'], kinds: ['woof', 'yip'], sampleRate: 24000 }); return r.items.map((i) => i.loud50msDb); });
  ok(adult.every((d) => d > -24 && d < -19), 'adult barks are untouched (about -22 dB): ' + adult.join(', '));
});
