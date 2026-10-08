// v2.7 SHELTER lane: the Shelter Playroom (V27.md section 7). Desktop 1280x720.
// A new game opens the playroom (adopt mode) and still adopts through the v2.6 carousel; from the Map the playroom shows the roster,
// petting, the belly rub, the toy toss, the Adopt me board, the list sheet, the Meet card, adopting a resident, the pack limit, the roster seed, old saves.
// node game/run_tests.js v27_shelter
const { run, URL } = require('./test_lib');

run('v27_shelter', async (t) => {
  const { ok, ev, sec, SH } = t;
  const sr = (f, a) => ev(f, a);
  const st = () => sr(() => window.__paw.sr.st());
  const dogs = () => sr(() => window.__paw.sr.dogs());
  // click a room dog through the DOM (the dogs walk, so a mouse click at a fixed point could hit a neighbour)
  const tapDog = (id) => sr((id) => { const e = document.querySelector(`[data-srdog="${id}"]`); e.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, id);
  const poseOf = (id) => sr((id) => { const d = window.__paw.sr.dogs().find((x) => x.id === id); return d ? d.pose : null; }, id);
  const hitR = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  // the room dogs' drawn boxes never overlap the tray card
  const clearOfTray = () => sr(() => { const tr = document.querySelector('#dock > .tray'); if (!tr) return 'no tray'; const r = tr.getBoundingClientRect(); const bad = [...document.querySelectorAll('#srDogs .sr-dog:not([style*="none"]) svg.pa-dog, #adoptDog svg.pa-dog')].map((s) => s.getBoundingClientRect()).filter((b) => b.width && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top); return bad.length ? bad.map((b) => Math.round(b.left) + ',' + Math.round(b.top)).join(' ') : ''; });

  sec('a new game opens the playroom (adopt mode)');
  const p = await t.boot(); await p.click('#tNew'); await p.waitForSelector('#aAdopt');
  ok(await t.mode() === 'adopt', 'mode adopt');
  ok(await t.until(() => window.__paw.sr.dogs().filter((d) => !d.meet).length === 6, null, 4000), '6 room dogs wander the playroom');
  ok(await p.locator('.heads button').count() === 14 && await p.locator('#aPrev').count() === 1 && await p.locator('#aNext').count() === 1, 'the v2.6 carousel: 14 heads and the arrows');
  const brd = await sr(() => { const b = document.querySelector('#srBoardG .sr-board'); return b ? { n: b.dataset.n, more: b.dataset.more, slots: b.querySelectorAll('[data-srslot]').length } : null; });
  ok(brd && brd.n === '8' && brd.more === '6' && brd.slots === 8, 'the Adopt me board: 8 starters pinned up, "+6" ' + JSON.stringify(brd));
  ok((await p.getAttribute('#adoptDog svg.pa-dog', 'aria-label') || '').includes('Shiba'), 'the selected dog (Mochi) is at the meet spot');
  ok(await sr(() => window.__paw.S == null && localStorage.getItem('pawhaven_proto_v1') == null), 'adopt mode reads and writes no save');
  const st0 = await sr(() => window.__paw.sr.starters());
  ok(JSON.stringify(st0) === JSON.stringify(await sr(() => window.__paw.sr.starters())) && st0.length === 6, 'the 6 room starters are seeded by the date: ' + st0.join(','));
  ok(await t.until(() => { const m = window.__paw.sr.dogs().find((d) => d.meet); return m && Math.abs(m.y - 592) < 2; }, null, 6000), 'Mochi trots to the meet spot (feet y 592)');
  ok(!(await clearOfTray()), 'no room dog under the adoption card ' + await clearOfTray());
  await SH('01_adopt_room');

  sec('tapping a room dog pets it and picks it in the carousel');
  const room = (await dogs()).filter((d) => !d.meet && d.key !== 'shiba'); const pick = room[0];
  const pets0 = (await st()).pets; await tapDog(pick.id);
  ok((await st()).pets === pets0 + 1 && await sr(() => document.querySelectorAll('#srFx .sr-heart').length > 0), `tap: ${pick.name} is petted (hearts)`);
  ok(await t.until((nm) => (document.querySelector('.heads button[aria-current=true]') || {}).getAttribute('aria-label').startsWith(nm), pick.name), `tap: the carousel picks ${pick.name}`);
  ok(await t.until((k) => { const m = window.__paw.sr.dogs().find((d) => d.meet); return m && m.key === k && Math.abs(m.y - 592) < 2; }, pick.key, 7000), `${pick.name} trots to the meet spot, the others carry on`);
  ok((await dogs()).filter((d) => !d.meet).length === 5 && (await dogs()).every((d) => d.meet || d.key !== pick.key), 'the picked dog left the room group (5 room dogs + the meet dog)');
  await p.click('.heads button[aria-label^="Mochi"]'); ok(await t.until(() => { const m = window.__paw.sr.dogs().find((d) => d.meet); return m && m.key === 'shiba'; }), 'the carousel picks Mochi again');
  ok(await t.until((k) => window.__paw.sr.dogs().some((d) => !d.meet && d.key === k), pick.key, 3000), `${pick.name} goes back to playing`);
  sec('the board in adopt mode: a portrait picks that starter');
  await sr(() => document.querySelector('[data-srslot="st_corgi"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  ok(await t.until(() => /Biscuit/.test(document.querySelector('.adopt-card h3').textContent)), 'the Corgi portrait picks Biscuit');
  await p.click('.heads button[aria-label^="Mochi"]');

  sec('adopting the first dog through the carousel (unchanged)');
  await p.click('#aAdopt'); ok(await t.waitToast(/Pick Boy or Girl/), 'Boy or Girl first');
  await p.click('#aBoy'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await SH('02_adopt_name'); await p.click('#nOk'); await t.intro(); await t.calm();
  let s = await t.S(); ok(s.dog.key === 'shiba' && s.dog.sex === 'male' && s.dogs.length === 1 && await t.mode() === 'yard', 'Mochi is home, a boy');
  ok(s.shelter && Array.isArray(s.shelter.adopted) && s.shelter.adopted.length === 0 && s.shelter.seen === null, 'S.shelter defaults ' + JSON.stringify(s.shelter));
  ok(await sr(() => !document.querySelector('#srDogs') && !document.getElementById('stage').classList.contains('srmode')), 'the playroom is gone in the yard');

  sec('from the Map with a free spot: the playroom');
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, inv: { houses: ['Cardboard Box', 'Classic Wooden Doghouse'] }, house: 'Classic Wooden Doghouse' });
  await t.home(); await t.toasts();
  await p.click('[data-act=map]'); await p.waitForSelector('[data-area=shelter]'); await sr(() => window.__paw.mapTo('shelter'));
  for (let i = 0; i < 6 && (await t.mode()) !== 'shelter'; i++) { await p.click('[data-area=shelter]', { force: true }); await t.until(() => window.__paw.mode === 'shelter', null, 2500); }
  ok(await t.mode() === 'shelter', 'the Map goes to the shelter');
  ok(await t.waitToast(/The shelter has a playroom now\. Tap a dog to say hello, or the board to see who is looking for a home\./), 'first visit: one welcome toast');
  ok((await t.S()).shelter.seen != null, 'S.shelter.seen is set');
  ok(await sr(() => document.getElementById('modal').hidden), 'the list does not open by itself');
  ok(await p.locator('#srBoard').count() === 1 && await p.locator('#srToss').count() === 1 && await p.locator('#srHome').count() === 1, 'the tray: Adopt me board, Toss a toy, Go home');
  const R = await sr(() => window.__paw.sr.roster());
  const rs = R.filter((x) => x.kind === 'rescue'), res = R.filter((x) => x.kind === 'resident');
  ok(R.length === 6 && rs.length === 2 && res.length === 4, `the roster: 2 rescues and 4 residents (${R.map((x) => x.name + ' ' + x.key + ' ' + x.months).join(', ')})`);
  ok(res.some((x) => x.months >= 3 && x.months <= 5) && res.some((x) => x.months >= 96), 'residents: a puppy of 3 to 5 months and a senior of 96 months or more');
  ok(R.every((x) => x.trait && x.genes), 'every roster dog has a trait and genes');
  ok(await t.until((ids) => { const d = window.__paw.sr.dogs(); return d.length === 6 && ids.every((id) => d.some((x) => x.id === id)); }, R.map((x) => x.id)), 'the 6 roster dogs are in the room');
  const lab = await sr((id) => document.querySelector(`[data-srdog="${id}"] svg.pa-dog`).getAttribute('aria-label'), res[0].id);
  ok(/./.test(lab || ''), 'room dogs are real crayon dogs: ' + lab);
  const sc = await sr(() => [...document.querySelectorAll('#srDogs .sr-pos')].map((e) => +(/scale\(([\d.]+)\)/.exec(e.style.transform) || [0, 0])[1]));
  ok(sc.every((v) => v >= 0.5 && v <= 0.721), 'room dogs are drawn at pack sizes (scale 0.5 to 0.72): ' + sc.join(', '));
  const board = await sr(() => { const b = document.querySelector('#srBoardG .sr-board').getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return { top: b.top - v.top, n: document.querySelector('#srBoardG .sr-board').dataset.n }; });
  ok(board.top >= -2 && board.n === '6', 'the whole board shows under the HUD (the header too), 6 posters ' + JSON.stringify(board));
  ok(!(await clearOfTray()), 'the tray covers no dog');
  await SH('03_playroom');

  sec('the dogs wander, nap and play');
  ok(await t.until(() => window.__paw.sr.dogs().some((d) => d.pose === 'walk'), null, 8000), 'a dog walks');
  const seen = new Set(); const t0 = Date.now(); while (Date.now() - t0 < 9000) { (await dogs()).forEach((d) => seen.add(d.pose)); await t.sleep(250); }
  ok(seen.size >= 4, 'many poses over 9 s: ' + [...seen].join(', '));
  const ys = await sr(() => [...document.querySelectorAll('#srDogs .sr-dog')].map((e) => window.__paw.sr.dogs().find((d) => d.id === e.dataset.srdog)).filter(Boolean).map((d) => d.y));
  ok(ys.length === 6, 'dogs drawn in the room group: ' + ys.join(','));

  sec('petting and the belly rub');
  const pd = rs[0].id; await t.toasts();
  await tapDog(pd); ok(await poseOf(pd) === 'pet' && await sr(() => document.querySelectorAll('#srFx .sr-heart').length > 0), 'one tap: pet pose and hearts');
  await tapDog(pd); await tapDog(pd);
  ok(await poseOf(pd) === 'rollover', 'the third tap within 4 s: a belly rub (rollover)');
  ok(await sr(() => [...document.querySelectorAll('#srFx text')].some((e) => e.textContent === 'Belly rub!')), '"Belly rub!" floats up');
  ok((await st()).bellies >= 1, 'belly rubs counted');
  ok(await t.until((id) => window.__paw.sr.dogs().find((d) => d.id === id).pose !== 'rollover', pd, 4000), 'the rollover ends after about 2 s');

  sec('toss a toy');
  await t.toasts(); const f0 = (await st()).fetches;
  await p.click('#srToss'); ok(await sr(() => !!document.querySelector('#srFx .sr-toy')), 'a toy flies out of the basket');
  await p.click('#srToss'); ok(await t.waitToast(/The toy is still out on the floor/), 'a second toss within 6 s: a kind wait message');
  ok(await t.until(() => window.__paw.sr.dogs().some((d) => d.held), null, 8000), 'a dog runs to it and picks it up');
  ok(await t.until((f) => window.__paw.sr.st().fetches > f, f0, 12000), 'the dog brings it to the front and drops it: ' + JSON.stringify((await st()).lastFetch));
  ok(await sr(() => !document.querySelector('.sr-toy') && !document.querySelector('.sr-held')), 'the toy is put away');
  await t.until(() => window.__paw.sr.st().ready, null, 7000);
  await sr(() => document.querySelector('[data-hot="toys"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  ok(await sr(() => !!document.querySelector('#srFx .sr-toy')), 'the toy basket in the room tosses a toy too');
  await SH('04_toss');

  sec('motion off: still frames, the game still works');
  await t.freezeMotion(true);
  await t.until((f) => window.__paw.sr.st().fetches > f, (await st()).fetches, 12000);
  const sm = await sr(() => [...document.querySelectorAll('#srDogs .sr-pos')].every((e) => getComputedStyle(e).transitionDuration === '0s'));
  ok(sm, 'motion off: no walk transitions');
  const f1 = (await st()).fetches;
  await t.until(() => window.__paw.sr.st().ready, null, 7000);
  ok(await sr(() => window.__paw.sr.toss()), 'motion off: toss');
  ok(await sr(() => !!document.querySelector('#srFx .sr-toy') || window.__paw.sr.dogs().some((d) => d.held)), 'motion off: the toy is on the floor at once');
  ok(await t.until((f) => window.__paw.sr.st().fetches > f, f1, 12000), 'motion off: a dog still fetches it');
  await t.freezeMotion(false);

  sec('the board opens the list sheet');
  await sr(() => { const b = document.querySelector('#srBoardG .sr-board > svg'); const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + 14); (e || b).dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  ok(await t.until(() => !!document.querySelector('#modal .panel .shcard')), 'board: the list opens');
  ok(/Looking for a home/.test(await p.textContent('#modal')), 'list: "Looking for a home"');
  ok(await p.locator('#modal .shcard.rescue').count() === 2 && await p.locator('#modal .shcard.resident').count() === 4 && await p.locator('#modal .shcard.starter').count() === 13, 'list: 2 rescues, 4 residents, 13 starters');
  ok(await p.locator('#modal [data-srmeet]').count() === 6 && await p.locator('#modal .shcard.resident [data-shadopt^="resident|"]').count() === 4, 'list: Meet buttons and resident adopt buttons');
  ok(await p.locator('#modal .shspots .spot').count() >= 2 && /room for another friend/.test(await p.textContent('#modal .spotsum')), 'list: the spots line and cards');
  ok(await p.locator('#modal .shcard.resident .sr-trait').count() === 4, 'list: trait lines');
  await SH('05_list');
  await t.closeX();
  await p.click('#srBoard'); ok(await t.until(() => !!document.querySelector('#modal .panel .shcard')), '#srBoard opens the list too'); await t.closeX();

  sec('the board on a laptop: a portrait opens that dog\'s Meet card');
  await sr((id) => document.querySelector(`[data-srslot="${id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), res[1].id);
  ok(await t.until((nm) => { const p = document.querySelector('#modal .panel.sr-meet'); return !!p && p.querySelector('h2').textContent.includes(nm); }, res[1].name), 'portrait: Meet card for ' + res[1].name);
  await t.closeX();

  sec('Meet, then adopt a resident');
  const pup = res.find((x) => x.months <= 5);
  await sr(() => window.__paw.sr.list()); await p.click(`[data-srmeet="${pup.id}"]`);
  ok(await t.until(() => !!document.querySelector('#modal .panel.sr-meet')), 'Meet card opens from the list');
  const mt = await p.textContent('#modal .panel.sr-meet');
  ok(mt.includes(pup.name) && mt.includes(pup.sex === 'female' ? 'Girl' : 'Boy') && mt.includes(pup.months + ' month') && mt.includes(pup.trait), 'Meet card: name, Boy or Girl, age, trait');
  ok(pup.key === 'mutt' ? !/Loves:/.test(mt) : /Loves:/.test(mt), 'Meet card: "Loves" line (not for mutts)');
  ok(await p.locator('#srMeetDog svg.pa-dog.pa-pose-sit, #srMeetDog svg.pa-dog[class*="pa-pose-sit"]').count() === 1, 'Meet card: the dog sits, large');
  await p.click('#srMeetPet');
  ok(await t.until(() => /pa-pose-pet/.test(document.querySelector('#srMeetDog svg').getAttribute('class') || ''), null, 2000), 'Pet: the pet pose');
  ok(await t.until(() => /pa-pose-rollover/.test(document.querySelector('#srMeetDog svg').getAttribute('class') || '') && /Belly rub/.test(document.querySelector('.sr-mfx').textContent), null, 3000), 'Pet: then a rollover with hearts');
  ok((await p.getAttribute('#srAdopt', 'aria-disabled')) == null && new RegExp('Adopt ' + pup.name).test(await p.textContent('#srAdopt')), 'Adopt button: "Adopt ' + pup.name + '"');
  await SH('06_meet');
  await p.click('#srBack'); ok(await t.until(() => !!document.querySelector('#modal .panel .shcard')), 'Back goes to the list');
  await p.click(`[data-srmeet="${pup.id}"]`); await p.waitForSelector('#srAdopt');
  await p.click('#srAdopt'); await p.waitForSelector('#shName'); await SH('07_meet_name');
  ok(await p.inputValue('#shName') === pup.name && /Bring home!/.test(await p.textContent('#shOk')), 'naming: the shelter name, "Bring home!"');
  await p.click('#shNo'); ok(await t.until(() => !!document.querySelector('#modal .panel.sr-meet')), 'naming Back returns to the Meet card');
  await p.click('#srAdopt'); await p.waitForSelector('#shName'); await p.fill('#shName', 'Sprout'); await p.click('#shOk');
  ok(await t.until(() => window.__paw.S.dogs.length === 2 && window.__paw.mode === 'yard', null, 10000), 'adopted: home in the yard');
  await t.lu(); await t.calm(); s = await t.S();
  const nd = s.dogs.find((d) => d.id === pup.id);
  ok(!!nd && nd.name === 'Sprout' && nd.key === pup.key && nd.sex === pup.sex && JSON.stringify(nd.genes) === JSON.stringify(pup.genes), 'the resident is home with its id, sex and genes');
  ok(s.shelter.adopted.includes(pup.id), 'S.shelter.adopted has the id');
  ok(await t.waitToast(/Sprout is home!/), 'the welcome-home toast');
  ok(!(await sr(() => window.__paw.sr.roster())).some((x) => x.id === pup.id), 'the roster drops the dog at once');
  const months = await ev((id) => { const d = window.__paw.S.dogs.find((x) => x.id === id); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((n - new Date(d.born + 'T00:00:00')) / 864e5); }, pup.id);
  ok(months === pup.months, `age kept: ${months} dog months`);

  sec('no free spot: the Adopt button explains kindly');
  await p.click('[data-act=map]'); await p.waitForSelector('[data-area=shelter]'); await sr(() => window.__paw.go('shelter')); await t.untilMode('shelter');
  ok(await t.until(() => window.__paw.sr.dogs().length === 5, null, 3000), 'the room now has 5 dogs');
  const r2 = (await sr(() => window.__paw.sr.roster())).find((x) => x.kind === 'resident');
  await sr((id) => window.__paw.sr.meet(id), r2.id); await p.waitForSelector('#srAdopt');
  ok(await p.getAttribute('#srAdopt', 'aria-disabled') === 'true', 'Adopt is aria-disabled');
  await t.toasts(); await p.click('#srAdopt', { force: true }); // aria-disabled: Playwright waits for it to be enabled unless forced
  ok(await t.waitToast(/All your dog spots are taken/), 'a tap shows the adoptBlock() text');
  ok(await sr(() => !document.querySelector('.sr-block').hidden && /stays happy here/.test(document.querySelector('.sr-block').textContent)), 'the card says it kindly, the dog stays happy');
  ok((await t.S()).dogs.length === 2 && !(await p.locator('#shName').count()), 'no naming, still 2 dogs');
  await SH('08_meet_full');
  await t.closeX();
  await p.click('#srHome'); ok(await t.untilMode('yard') && (await t.S()).place === 'yard', 'Go home');

  sec('the roster: same for the same date, new residents next week');
  const a1 = await sr(() => JSON.stringify(window.__paw.sr.roster('2026-10-07'))), a2 = await sr(() => JSON.stringify(window.__paw.sr.roster('2026-10-07')));
  const w1 = await sr(() => window.__paw.sr.roster('2026-10-07').filter((x) => x.kind === 'resident').map((x) => x.id + x.key + x.name).join()), w2 = await sr(() => window.__paw.sr.roster('2026-10-14').filter((x) => x.kind === 'resident').map((x) => x.id + x.key + x.name).join());
  const w1b = await sr(() => window.__paw.sr.roster('2026-10-11').filter((x) => x.kind === 'resident').map((x) => x.id + x.key + x.name).join());
  ok(a1 === a2 && w1 === w1b && w1 !== w2, 'same date same roster, same week same residents, next week different');

  sec('an old v2.6 save without S.shelter loads clean');
  const old = await ev(() => { window.__paw.saveNow(); const o = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete o.shelter; return JSON.stringify(o); });
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: old } }); await p2.goto(URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  ok(await t.untilMode('yard'), 'old save loads'); await t.lu();
  s = await t.S(); ok(s.shelter && Array.isArray(s.shelter.adopted) && s.shelter.adopted.length === 0 && s.shelter.seen === null && s.dogs.length === 2, 'S.shelter defaults added ' + JSON.stringify(s.shelter) + ' dogs ' + s.dogs.length);
  await t.ev(() => window.__paw.go('shelter')); ok(await t.untilMode('shelter') && await t.until(() => window.__paw.sr.dogs().length >= 5), 'the playroom opens for the old save');
  await p2.keyboard.press('Escape'); ok(await t.untilMode('yard'), 'Esc leaves the shelter');
});
