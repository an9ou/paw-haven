// v2 PLAY: puppies at play (life-stage rules for walks / training / fetch, puppy idle behaviours, puppy voice age, __paw test helpers). Desktop 1280x720, harness.js merged.
// node game/run_tests.js game/test_v2_play.js --jobs 1
// Puppies come from breeding (another lane); here they are made by patching `born` to a date N days ago (1 real day = 1 dog month).
const { trace, settle, ready } = require('./tricks_drive');
require('./test_lib').run('v2_play', async (t) => {
  const { ok, sec, ev } = t; const p = await t.boot(); await t.adopt({ sex: 'girl' }); // Mochi, a shiba girl (stubborn: x1.25 trick progress)
  await t.patch({ bond: { level: 10, pts: 5000 }, coins: 1000, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } }); await t.home();
  const ago = (n) => ev((n) => { const d = new Date(); d.setDate(d.getDate() - n); const z = (v) => String(v).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }, n);
  const setAge = async (n) => { await t.patch({ dog: { born: await ago(n) } }); };
  const block = (area) => ev((a) => window.__paw.play.walkBlock(window.__paw.S.dog, a), area);
  const clearToasts = () => t.toasts();
  const prog = (n) => ev((n) => { const x = window.__paw.S.dog.tricks[n]; return x && typeof x === 'object' ? x.p : 0; }, n);
  const focus = () => ev(() => Math.round(window.__paw.S.dog.focus ? window.__paw.S.dog.focus.v : 100));
  const refill = () => ev(() => { window.__paw.S.dog.focus = { v: 100, at: window.__paw.S.gameMin }; });
  const act = (a) => p.click(`[data-act=${a}]`);
  const toTricks = async () => { await act('play'); await t.waitPop(true); await p.click('[data-play=tricks]'); };
  // log every PawAudio.bark call and every PawWalk.start option set
  await ev(() => {
    window.__pa = []; const A = window.PawAudio; if (A && A.bark && !A.bark.__wrapped) { const o = A.bark.bind(A); A.bark = (v, k, op) => { window.__pa.push({ v, k }); return o(v, k, op); }; A.bark.__wrapped = true; }
    window.__walkOpts = []; const W = window.PawWalk; if (W && W.start && !W.start.__wrapped) { const o = W.start.bind(W); W.start = (el, op) => { window.__walkOpts.push({ area: op.area, durationSec: op.durationSec }); return o(el, op); }; W.start.__wrapped = true; }
  });

  sec('a normal 10-month dog behaves exactly as before');
  ok((await ev(() => window.__paw.play.dogMonths(window.__paw.S.dog))) === 10 && (await ev(() => window.__paw.play.isPup(window.__paw.S.dog))) === false, 'the starter is 10 months old: young, not a pup');
  ok((await block('beach')) === null && (await block('park')) === null && (await ev(() => window.__paw.play.walkScale(window.__paw.S.dog))) === 1, 'walks anywhere, full length');
  ok((await ev(() => window.__paw.play.trainBlock(window.__paw.S.dog))) === null && (await ev(() => window.__paw.play.trainCost(window.__paw.S.dog))) === 15, 'training is open and costs 15 Focus a try');
  ok(!(await ev(() => window.__paw.idle.weights().follow)) && !(await ev(() => window.__paw.idle.weights().pounce)), 'no puppy idles in the weights');
  ok(await ev(() => window.__paw.idle.names.includes('pounce') && ['tumble', 'chewtoy', 'follow', 'pupzoomies', 'tailbark'].every((n) => window.__paw.idle.names.includes(n))), 'puppy idle names are in IDLE_NAMES');

  sec('under 3 months: no walks, no training under 2 months, fetch is fine');
  await setAge(1); await clearToasts();
  ok((await block('park')) === 'Mochi is too little for walks. Yard play only.', 'walkBlock line: ' + (await block('park')));
  await act('walk'); ok(await t.waitToast(/too little for walks\. Yard play only/, 4000), 'Walk button: "Too little for walks. Yard play only."');
  ok((await t.mode()) === 'yard', 'and the dog stays in the yard (no route carousel)');
  await clearToasts(); await ev(() => window.__paw.go('walk', 'park'));
  ok(await t.waitToast(/too little for walks/, 4000) && (await t.until(() => window.__paw.mode === 'yard', null, 3000)), 'a direct walk start (map) is blocked too and lands in the yard');
  await clearToasts(); await t.home(); await toTricks();
  ok(await t.waitToast(/too little to train\. Wait until she is 2 months old/, 4000) && (await ev(() => !window.__paw.train)), 'training at 1 month: blocked, with the dog\'s own pronoun ("she")');
  await t.home(); await ev(() => window.__paw.go('fetch', 'Tennis Ball'));
  ok(await t.untilMode('fetch', 4000), 'fetch is OK for a puppy'); await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  // voice age
  await ev(() => { window.__pa.length = 0; window.__paw.voice.reset(); window.__paw.voice.bark(window.__paw.S.dog.id, 'woof', { player: true }); });
  ok(await t.until(() => window.__pa.some((c) => c.k === 'woof' && c.v.age === 'puppy'), null, 3000), 'a puppy bark passes the voice age: puppy');
  await setAge(300); await ev(() => { window.__pa.length = 0; window.__paw.voice.bark(window.__paw.S.dog.id, 'woof', { player: true }); });
  ok(await t.until(() => window.__pa.some((c) => c.k === 'woof'), null, 3000) && !(await ev(() => window.__pa.find((c) => c.k === 'woof').v.age)), 'an adult bark has no age');
  await setAge(300); ok((await ev(() => window.__paw.play.dogMonths(window.__paw.S.dog))) === 300, 'sanity: age patch works');

  sec('3 to 6 months: Sunny Park only, and shorter');
  await setAge(4); await t.home();
  ok((await block('park')) === null && /still a pup\. She only does Sunny Park for now/.test(await block('river')), 'walkBlock: Park yes, River no: ' + (await block('river')));
  ok(Math.abs((await ev(() => window.__paw.play.walkScale(window.__paw.S.dog))) - 0.7) < 1e-9, 'walk length x0.7');
  await clearToasts(); await act('walk'); await p.waitForSelector('#rtStart');
  ok((await t.mode()) === 'routes', 'the route carousel opens');
  ok((await ev(() => document.querySelector('.rt-card .rt-meta span').textContent)) === '42s walk', 'the Park card shows the shorter walk: ' + (await ev(() => document.querySelector('.rt-card .rt-meta span').textContent)));
  await ev(() => document.querySelector('.rt-card[data-i="2"]').click()); await t.until(() => document.querySelector('.rt-card.cur') && document.querySelector('.rt-card.cur').dataset.i === '2', null, 3000);
  ok(/Not for Mochi yet/.test(await p.textContent('#rtStart')), 'River: the Start button says "Not for Mochi yet"');
  await p.click('#rtStart', { force: true }); ok(await t.waitToast(/Sunny Park for now/, 4000) && (await t.mode()) === 'routes', 'River is refused with a friendly line and the player stays on the carousel');
  // pack walk: a 1-month pup at home stays behind
  await ev(() => window.__paw.addDog({ key: 'corgi', sex: 'male', born: (() => { const d = new Date(); d.setDate(d.getDate() - 1); const z = (v) => String(v).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; })() }, 'Pip-Squeak'));
  await t.calm(); await clearToasts();
  await ev(() => document.querySelector('.rt-card[data-i="0"]').click()); await t.until(() => document.querySelector('.rt-card.cur').dataset.i === '0', null, 3000);
  await p.click('#rtStart'); ok(await t.walkGate(true), 'Sunny Park walk starts for the 4-month pup');
  ok((await ev(() => window.__walkOpts[window.__walkOpts.length - 1])).durationSec === 42, 'the walk runner gets durationSec 42 (60 x 0.7): ' + JSON.stringify(await ev(() => window.__walkOpts[window.__walkOpts.length - 1])));
  ok(await t.waitToast(/Pip-Squeak stays home with a chew toy/, 6000), 'pack walk: "Pip-Squeak stays home with a chew toy."');
  await t.quitWalk(true);

  sec('v2.0.1 travel: under 3 months and nursing mums stay home; 3 to 6 months travel freely');
  const pipId = await ev(() => window.__paw.S.dogs.find((d) => d.name === 'Pip-Squeak').id);
  const mapClick = async (k) => { await p.click('[data-act=map]'); await p.waitForSelector(`[data-area=${k}]`); await ev((k) => window.__paw.mapTo(k), k); await p.click(`[data-area=${k}]`, { force: true }); };
  const packHere = () => ev(() => document.querySelectorAll('#pack .packdog').length);
  await t.home(); await t.calm(); await clearToasts();
  ok((await packHere()) === 1, 'at home the 1-month pup is with the pack');
  await t.travel('park');
  ok((await ev(() => window.__paw.S.place)) === 'park', 'a 4-month active pup may travel to Sunny Park');
  ok(await t.waitToast(/Pip-Squeak stays home with a chew toy/, 4000), 'toast: "Pip-Squeak stays home with a chew toy"');
  ok((await packHere()) === 0, 'the 1-month pack pup is not drawn at the park');
  await clearToasts(); await ev((id) => window.__paw.switchDog(id), pipId);
  ok(await t.waitToast(/Pip-Squeak is at home/, 4000) && (await ev((id) => window.__paw.S.activeId !== id, pipId)), 'cannot switch to the pup who stayed home');
  await t.home('yard'); ok(await t.until(() => document.querySelectorAll('#pack .packdog').length === 1, null, 4000), 'back home: the pup is in the yard again');
  await setAge(1); await t.home(); await clearToasts(); await mapClick('river');
  ok(await t.waitToast(/Mochi hasn't had all puppy shots yet\. Home, yard and the vet only until 3 months\./, 4000), 'active 1-month pup: "hasn\'t had all puppy shots yet. Home and yard only until 3 months."');
  ok((await ev(() => window.__paw.S.place)) === 'yard' && !(await ev(() => !!document.querySelector('.onway'))), 'and the trip does not start');
  await t.home(); await setAge(24); await ev(() => { const S = window.__paw.S; S.litters = [{ id: 'Ltr', mum: S.dog.id, sire: 'x', born: '2026-01-01', until: '2099-01-01', pups: [], named: true }]; });
  await clearToasts(); await mapClick('park');
  ok(await t.waitToast(/Mochi is nursing the pups and stays home for now/, 4000) && (await ev(() => window.__paw.S.place)) === 'yard', 'an active nursing mum stays home too');
  await ev((id) => { const S = window.__paw.S, z = (v) => String(v).padStart(2, '0'), d = new Date(); d.setDate(d.getDate() - 24); S.dogs.find((x) => x.id === id).born = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; S.litters = [{ id: 'Ltr', mum: id, sire: 'x', born: '2026-01-01', until: '2099-01-01', pups: [], named: true }]; }, pipId);
  await t.home(); await clearToasts(); await t.travel('park');
  ok(await t.waitToast(/Pip-Squeak stays home with the pups/, 4000) && (await packHere()) === 0, 'a nursing pack mum stays home with the pups, the pack travels');
  await ev((id) => { const S = window.__paw.S, z = (v) => String(v).padStart(2, '0'), d = new Date(); d.setDate(d.getDate() - 1); S.dogs.find((x) => x.id === id).born = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; S.litters = []; }, pipId);
  await t.home('yard');

  sec('training: 2 to 6 months = 4 attempts a session, progress x1.2');
  await setAge(3); await t.home(); await refill(); await toTricks(); await settle(t); await ready(t);
  ok(/Each try costs 25 Focus/.test(await p.textContent('.trbody')), 'the panel says each try costs 25 Focus (puppy attention span)');
  // Focus refills with game time (about 1 per second): freeze that regen so the counts do not depend on how slow the machine is
  await ev(() => { window.__fz = setInterval(() => { const f = window.__paw.S.dog.focus; if (f) f.at = window.__paw.S.gameMin; }, 15); });
  await p.click('[data-tr="Sit"]'); await ready(t); await refill();
  await p.click('#trStart'); await t.until(() => !!window.__pawTG.game, null, 3000); const f1 = await focus(); // Focus refills about 1 per second of play time: read it right after Start
  ok(f1 >= 74 && f1 <= 76, `one try costs 25 Focus (100 -> ${f1})`);
  await trace(t, 'great'); const pA = await prog('Sit');
  ok(Math.abs(pA - 0.35 * 1.25 * 1.2) < 0.002, `a Great try: +35% x1.25 (stubborn) x1.2 (puppy) = ${Math.round(pA * 1000) / 10}%`);
  await ready(t); await refill();
  for (let i = 0; i < 4; i++) { await p.click('#trStart'); await t.until(() => !!window.__pawTG.game, null, 3000); await p.click('#trStop'); await ready(t); }
  const f4 = await focus();
  ok(f4 === 0, `four tries used the session up (Focus ${f4})`);
  await p.click('#trStart');
  ok(/brain is full/.test(await p.textContent('#trLine')) && !(await ev(() => !!window.__pawTG.game)), 'the 5th try: "brain is full. Session over."');
  await p.click('#trX'); await t.until(() => !window.__paw.train, null, 4000); await ev(() => clearInterval(window.__fz));
  await setAge(300); await t.home(); await refill(); await toTricks(); await settle(t); await ready(t);
  ok(/Each try costs 15 Focus/.test(await p.textContent('.trbody')), 'a grown dog still pays 15 Focus a try');
  await p.click('#trX'); await t.until(() => !window.__paw.train, null, 4000);

  sec('expecting mums walk the Park only');
  await t.patch({ dog: { born: await ago(24), preg: { sire: 'x', sireKey: 'corgi', sireName: 'Pip', since: await ago(1), due: await ago(-5), pups: [], scanned: false } } }); await t.home();
  ok((await block('park')) === null && /expecting, so she only strolls in Sunny Park/.test(await block('beach')), 'Park yes, Beach no: ' + (await block('beach')));
  ok((await ev(() => window.__paw.play.walkScale(window.__paw.S.dog))) === 1, 'the Park walk is full length for an adult mum');
  await clearToasts(); await ev(() => window.__paw.go('walk', 'beach')); ok(await t.waitToast(/expecting/, 4000) && (await t.until(() => window.__paw.mode === 'yard', null, 3000)), 'a Beach start is refused');
  await ev(() => { window.__paw.S.dog.preg = null; });

  sec('nursing mums: no walks, no fetch, mostly lying down');
  await t.patch({ dog: { born: await ago(24) } });
  await ev(() => { const S = window.__paw.S; S.litters = [{ id: 'L1', mum: S.dog.id, sire: 'x', born: '2026-01-01', until: '2099-01-01', pups: [], named: true }]; window.__paw.saveNow(); });
  await t.home(); await clearToasts();
  ok(/nursing the pups and stays by the nursery\. No walks for her right now/.test(await block('park')), 'walkBlock: ' + (await block('park')));
  await act('walk'); ok(await t.waitToast(/nursing the pups/, 4000) && (await t.mode()) === 'yard', 'Walk button: refused, stays home');
  await clearToasts(); await ev(() => window.__paw.go('fetch', 'Tennis Ball'));
  ok(await t.waitToast(/No fetch for her right now/, 4000) && (await t.until(() => window.__paw.mode === 'yard', null, 3000)), 'fetch: refused');
  await ev(() => window.__paw.go('toy', 'Tennis Ball')); ok(await t.untilMode('toy', 4000), 'toys are still fine'); await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  const wn = await ev(() => window.__paw.idle.weights()); const tot = Object.values(wn).reduce((a, b) => a + b, 0);
  ok((wn.down + wn.nap) / tot > 0.6 && wn.zoomies === 0 && wn.tailchase === 0 && wn.pupzoomies === 0, `idle weights: lying down ${Math.round((wn.down + wn.nap) / tot * 100)}% (down+nap), no zoomies`);
  await ev(() => { window.__paw.S.litters = []; });
  await t.patch({ dog: { born: await ago(10) } });

  sec('puppy idle behaviours');
  await setAge(2); await ev(() => { window.__paw.S.litters = []; window.__paw.S.dog.stats.energy = 90; window.__paw.S.dog.stats.happy = 90; window.__paw.S.dog.stats.hunger = 80; }); await t.home();
  const wp = await ev(() => window.__paw.idle.weights()); await setAge(10); const wy = await ev(() => window.__paw.idle.weights()); await setAge(2);
  ok(wp.nap >= wy.nap * 2 - 1e-9, `naps x2 (${wp.nap} vs ${wy.nap} as a young dog)`);
  ok(wp.tailchase > wy.tailchase && wp.pounce > 0 && wp.tumble > 0 && wp.chewtoy > 0 && wp.tailbark > 0 && wp.pupzoomies > 0 && wp.follow > 0, `tail chase more often (${wp.tailchase} vs ${wy.tailchase}); pounce/tumble/chew/zoomies/tail-bark/follow all have weight: ${JSON.stringify(wp)}`);
  await t.calm();
  await ev(() => window.__paw.idle.speed(0.08));
  for (const nm of ['pounce', 'tumble', 'chewtoy', 'follow', 'pupzoomies', 'tailbark']) {
    await ev(() => window.__paw.S.dogs.forEach((d) => { d.stats.energy = 80; d.stats.happy = 80; d.stats.hunger = 80; d.sleeping = false; }));
    const l0 = await ev(() => window.__idleLog.length); await ev((nm) => window.__paw.idle.force(nm), nm);
    ok(await t.until(([l0, nm]) => window.__idleLog.slice(l0).some((x) => x.name === nm), [l0, nm], 8000), 'puppy idle runs: ' + nm);
    ok(await t.until(() => !window.__paw.idle.act, null, 10000), '  ... and finishes: ' + nm);
  }
  await ev(() => window.__paw.idle.speed(1));
  await ev(() => window.__paw.idle.force('pounce'));
  ok(await t.until(() => !!document.querySelector('#fx .pup-prop'), null, 4000), 'pounce: a leaf drifts by'); ok(await t.until(() => !document.querySelector('#fx .pup-prop'), null, 6000), '  ... and is pounced on');
  await t.until(() => !window.__paw.idle.act, null, 10000);
  await ev(() => window.__paw.idle.force('chewtoy'));
  ok(await t.until(() => !!document.querySelector('#fx .pup-prop') && /pa-pose-(eat|sit)/.test(document.querySelector('#dogArt svg').getAttribute('class') || ''), null, 6000), 'chew toy: a ball and a chewing pose');
  await t.until(() => !window.__paw.idle.act, null, 12000);
  ok(await ev(() => !document.querySelector('#fx .pup-prop') && !document.querySelector('#dogFx').getAttribute('class')), 'props and wobble classes are cleaned up after an idle');
  await ev(() => window.__paw.idle.force('tailbark'));
  ok(await t.until(() => window.__pa.some((c) => c.k === 'yip' && c.v.age === 'puppy'), null, 5000), 'tail bark: a puppy yip');
  await t.until(() => !window.__paw.idle.act, null, 10000);
  // natural picking picks puppy things
  await ev(() => window.__paw.idle.speed(0.08)); const l1 = await ev(() => window.__idleLog.length);
  await t.until((l1) => window.__idleLog.length - l1 >= 8, l1, 40000);
  const picked = await ev((l1) => window.__idleLog.slice(l1).map((x) => x.name), l1);
  ok(picked.length >= 8 && picked.some((n) => ['pounce', 'tumble', 'chewtoy', 'follow', 'pupzoomies', 'tailbark', 'tailchase', 'nap'].includes(n)), 'the scheduler picks puppy behaviours by itself: ' + picked.join(', '));
  await ev(() => window.__paw.idle.speed(1));

  sec('test helpers: __paw.busy and __paw.idle.pin');
  await t.home();
  ok((await ev(() => window.__paw.busy)) === false, '__paw.busy is false when idle');
  await ev(() => window.__paw.go('fetch', 'Tennis Ball')); await t.untilMode('fetch', 4000);
  ok((await ev(() => window.__paw.busy)) === true, '__paw.busy is true in fetch (the game busy flag)');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.until(() => window.__paw.busy === false, null, 3000);
  await ev(() => window.__paw.idle.speed(0.001));
  await ev(() => window.__paw.idle.pin('down'));
  ok(await t.until(() => { const l = [...document.querySelectorAll('#pack svg.pa-dog')]; return l.length > 0 && l.every((s) => /pa-pose-down\b|pa-pose-sit\b/.test(s.getAttribute('class') || '')); }, null, 5000), 'pin("down"): the pack dog is held in a lying pose');
  await ev(() => window.__paw.idle.speed(0.01)); await t.sleep(600);
  ok((await ev(() => window.__paw.idle.pinned)) === 'down' && (await ev(() => !window.__paw.idle.act)), 'while pinned the pose stays and no new idle starts');
  await ev(() => window.__paw.idle.pin(null));
  ok((await ev(() => window.__paw.idle.pinned)) === null, 'pin(null) releases it');
  await ev(() => window.__paw.idle.speed(1));

}, { timeout: 420000 });
