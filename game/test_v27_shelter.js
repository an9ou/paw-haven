// v2.7 SHELTER lane test, V27.md section 7: the Shelter Playroom in adopt mode (a new game) and shelter mode (from the Map),
// room dogs, petting and the belly rub, a toy toss fetched by a dog, the Adopt-me board, the list sheet, the Meet card, adopting a resident,
// no free spot, the roster by date, an old v2.6 save without S.shelter.
// node game/run_tests.js v27_shelter
require('./test_lib').run('v27_shelter', async (t) => {
  const { ok, sec, ev } = t;
  const dogs = () => ev(() => window.__paw.sr.dogs());
  const clickDog = async (id) => { const b = await t.p.locator(`[data-srdog="${id}"] .sr-hit`).boundingBox(); await t.p.mouse.click(b.x + b.width / 2, b.y + b.height * 0.6); };
  // a resting room dog whose tap rect is not covered (by another dog or the tray)
  const freeDog = async (skip) => { await t.until(() => window.__paw.sr.dogs().filter((d) => !d.walking && !d.busy).length >= 2, null, 8000);
    return ev((skip) => (window.__paw.sr.dogs().filter((d) => d.key !== skip && !d.walking && !d.busy).find((d) => { const g = document.querySelector(`[data-srdog="${d.id}"] .sr-hit`), r = g.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.6); return e && e.closest('[data-srdog]') === g.parentNode; }) || null), skip || ''); };

  sec('a new game opens the playroom (adopt mode)');
  let p = await t.boot();
  await p.click('#tNew'); await p.waitForSelector('#aAdopt');
  ok(await ev(() => window.__paw.mode === 'adopt' && window.__paw.sr.mode === 'adopt'), 'adopt mode is the playroom');
  ok(await ev(() => !!document.querySelector('#view svg.world #sceneG[data-scene="playroom"]')), 'the playroom scene is drawn');
  let D = await dogs(); const N = () => ev(() => window.__paw.sr.count());
  ok(await ev(() => window.__paw.sr.total()) === 6 && await N() >= 5 && new Set(D.map((d) => d.key)).size === D.length && D.length >= 3, `6 starter dogs in the room (one may be at the meet spot), the ones that don't fit in the back room (${D.map((d) => d.key)})`);
  ok(await ev(() => { const L = window.__paw.sr.dogs(), sc = (y) => 0.5 + (y - 450) / 146 * 0.22; return L.every((a, i) => L.every((b, j) => j <= i || Math.abs(a.x - b.x) > 70 * (sc(a.y) + sc(b.y)) || Math.abs(a.y - b.y) > 46 || a.walking || b.walking)); }), 'no two room dogs stand on top of each other');
  ok(D.every((d) => d.x >= 40 && d.x <= 960 && d.y >= 450 && d.y <= 596), 'every room dog stands on the floor band');
  ok(await p.locator('.heads button').count() === 35, 'the 35-head carousel is there');
  ok(await p.locator('#srBoardG [data-srslot]').count() === 8, 'the board shows 8 starters');
  ok(await ev(() => /pa-wc|viewBox="0 0 300 220"/.test(document.getElementById('srBoardG').innerHTML)), 'the board is the adoptboard prop');
  ok(await ev(() => (document.querySelector('#adoptDog svg.pa-dog').getAttribute('aria-label') || '').includes('Shiba')), 'the selected dog stands at the meet spot');
  await t.SH('01_adopt');
  // tapping a room dog pets it and selects it
  const pick = await freeDog('shiba'); ok(!!pick, 'a room dog is free to tap');
  const p0 = await ev(() => window.__paw.sr.pets);
  await clickDog(pick.id);
  ok(await t.until((p0) => window.__paw.sr.pets > p0, p0), 'tapping a room dog pets it');
  ok(await t.until((k) => window.__paw.sr.meetKey === k, pick.key, 4000), `and selects it: ${pick.key} comes to the meet spot`);
  ok(await t.until((k) => { const h = document.querySelector('.heads button[aria-current="true"]'), lab = document.querySelector('#adoptDog svg.pa-dog'); return !!h && !!lab && h.getAttribute('aria-label').split(' the ')[1] === lab.getAttribute('aria-label').split(' the ')[1].split(',')[0] && !window.__paw.sr.dogs().some((d) => d.key === k); }, pick.key), 'the carousel follows and the dog leaves the room for the meet spot');
  await t.SH('02_adopt_tap');
  // the board: a portrait picks that starter (desktop)
  const slotKey = await ev(() => document.querySelectorAll('#srBoardG [data-srslot]')[2].dataset.srslot);
  await p.locator('#srBoardG [data-srslot]').nth(2).click({ force: true });
  ok(await t.until((k) => window.__paw.sr.meetKey === k && document.querySelector('.heads button[aria-current="true"]').getAttribute('aria-label').length > 0, slotKey), 'a board portrait picks that starter');
  // the old adoption still makes the first dog
  await p.click('#aBoy'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
  ok(await t.untilMode('yard') && (await t.S()).dogs.length === 1, 'adopting through #aBoy, #aAdopt and #nOk makes the first dog');
  ok(await ev(() => !!window.__paw.S.shelter && Array.isArray(window.__paw.S.shelter.adopted) && window.__paw.S.shelter.seen === null), 'a new save has S.shelter { adopted: [], seen: null }');

  sec('the playroom from the Map (shelter mode)');
  await t.patch({ coins: 2000, bond: { level: 7, pts: 1600 }, house: 'Classic Wooden Doghouse', inv: { houses: ['Cardboard Box', 'Classic Wooden Doghouse'] } });
  await t.toasts();
  await p.click('[data-act=map]'); await p.waitForSelector('[data-area=shelter]'); await ev(() => window.__paw.mapTo('shelter'));
  for (let i = 0; i < 6; i++) { await p.click('[data-area=shelter]', { force: true }); if (await t.until(() => window.__paw.mode === 'shelter', null, 2500)) break; }
  ok(await t.untilMode('shelter'), 'the shelter opens');
  ok(await t.until(() => !!document.querySelector('#dock .sr-tray #srBoard') && !!document.getElementById('srToss') && !!document.getElementById('srHome')), 'the dock tray: Adopt me board, Toss a toy, Go home');
  await t.sleep(500); ok(!(await ev(() => !!document.querySelector('#modal .panel .shcard'))), 'the list no longer opens by itself');
  ok(await t.waitToast(/The shelter has a playroom now/), 'first visit: the welcome toast');
  ok(await ev(() => !!window.__paw.S.shelter.seen), 'S.shelter.seen is set');
  const R = await ev(() => window.__paw.sr.roster());
  D = await dogs();
  ok(await N() === R.length && R.length === 6 && D.length >= 3, `the room shows the roster (${await N()} dogs, ${D.length} in view, roster ${R.length})`);
  ok(R.filter((x) => x.kind === 'rescue').length === 2 && R.filter((x) => x.kind === 'resident').length === 4, '2 rescues and 4 residents');
  ok(R.some((x) => x.kind === 'resident' && x.months >= 3 && x.months <= 5), 'a puppy of 3 to 5 months');
  ok(R.some((x) => x.kind === 'resident' && x.months >= 96), 'a senior of 96 months or more');
  ok(R.every((x) => typeof x.trait === 'string' && x.trait.length > 5), 'every dog has a trait line');
  ok(await p.locator('#srBoardG [data-srslot]').count() === 6, 'the board lists the 6 dogs');
  ok(await ev(() => { const b = document.getElementById('srBoardG').getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return b.top >= v.top - 1 && b.bottom <= v.bottom + 1 && b.left >= v.left && b.right <= v.right; }), 'the whole board is in view on desktop');
  await t.SH('03_shelter');
  // life: dogs move and change poses by themselves
  const pos0 = JSON.stringify((await dogs()).map((d) => [d.x, d.y, d.pose]));
  ok(await t.until((s) => JSON.stringify(window.__paw.sr.dogs().map((d) => [d.x, d.y, d.pose])) !== s, pos0, 8000), 'room dogs walk and rest by themselves');

  sec('petting and the belly rub');
  const fd = await freeDog(); ok(!!fd, 'a room dog is free to tap'); const rd = fd.id; const b0 = await ev(() => window.__paw.sr.bellies);
  await clickDog(rd);
  ok(await t.until((id) => (window.__paw.sr.dogs().find((d) => d.id === id) || {}).pose === 'pet', rd, 2000), 'a tap: the dog shows pet');
  ok(await t.until(() => document.querySelectorAll('#srFx .sr-heart').length > 0, null, 2000), 'hearts float up');
  await clickDog(rd); await clickDog(rd);
  ok(await t.until((b0) => window.__paw.sr.bellies === b0 + 1, b0, 2000), 'the third tap within 4 s is a belly rub');
  ok(await t.until((id) => (window.__paw.sr.dogs().find((d) => d.id === id) || {}).pose === 'rollover', rd, 2000), 'the belly rub: rollover');
  await t.SH('04_belly');

  sec('toss a toy');
  await t.toasts();
  await p.click('#srToss');
  ok(await t.until(() => !!document.querySelector('#srFx .sr-toy'), null, 2000), 'the toy flies out of the basket');
  ok(await t.until(() => !!window.__paw.sr.lastFetch, null, 9000), 'a dog fetches it');
  ok(await t.until(() => !document.querySelector('#srFx .sr-toy'), null, 3000), 'the toy was picked up');
  await p.click('#srToss'); ok(await t.waitToast(/One toy at a time/), 'a second toss inside 6 s: a kind line');
  await t.SH('05_fetch');
  ok(await p.locator('#sceneG [data-hot="toys"]').count() === 1, 'the toy basket in the scene is there to tap');

  sec('the board, the list sheet, the Meet card');
  // an empty corner of the board opens the list (6 dogs: slots 7 and 8 are empty)
  const box = await p.locator('#srBoardG > rect').first().boundingBox();
  await p.mouse.click(box.x + box.width * 0.85, box.y + box.height * 0.82);
  ok(await t.waitH2(/Doodle Doggo Shelter/), 'the board opens the list sheet');
  ok(/Looking for a home/.test(await p.textContent('#modal .panel')), 'it starts with "Looking for a home"');
  ok(await p.locator('.shcard.rescue').count() === 2 && await p.locator('.shcard.resident').count() === 4, '2 rescue cards and 4 resident cards');
  ok(await p.locator('.shcard.starter').count() > 0 && await p.locator('[data-shsex]').count() > 0, 'the starter dogs are still there');
  ok(await p.locator('.shcard.resident [data-srmeet]').count() === 4 && await p.locator('.shcard.rescue [data-srmeet]').count() === 2, 'rescues and residents have a Meet button');
  await t.SH('06_list');
  await t.closeX();
  // a portrait opens that dog's Meet card (desktop)
  const sid = await ev(() => document.querySelector('#srBoardG [data-srslot]').dataset.srslot);
  await p.locator('#srBoardG [data-srslot]').first().click({ force: true });
  ok(await t.until(() => !!document.querySelector('#modal .panel.sr-meet'), null, 3000), 'a board portrait opens the Meet card');
  ok(await ev((id) => document.querySelector('#modal h2').textContent.includes(window.__paw.sr.roster().find((x) => x.id === id).name), sid), 'the Meet card is that dog');
  await t.closeX();
  // Meet a resident from the list, pet it, adopt it
  await ev(() => window.__paw.sr.list());
  const res = R.find((x) => x.kind === 'resident' && x.key !== 'mutt');
  await p.click(`[data-srmeet="${res.id}"]`);
  ok(await t.until(() => !!document.querySelector('#modal .panel.sr-meet #srAdopt'), null, 3000), 'Meet opens the Meet card');
  const txt = await p.textContent('#modal .panel');
  ok(txt.includes(res.trait) && /Loves:/.test(txt) && txt.includes(res.months >= 12 ? 'year' : 'month'), 'the Meet card: trait, Loves and age');
  await p.click('#srMeetPet');
  ok(await t.until(() => /pa-pose-rollover/.test(document.getElementById('srMeetArt').innerHTML), null, 3000), 'Pet in the Meet card: a rollover with hearts');
  await t.SH('07_meet');
  ok(/Adopt /.test(await p.textContent('#srAdopt')), 'the Adopt button names the dog');
  await p.click('#srAdopt'); await p.waitForSelector('#shName');
  await p.fill('#shName', 'Dottie'); await p.click('#shOk');
  ok(await t.untilMode('yard'), 'adopting goes home');
  const S1 = await t.S(), nd = S1.dogs.find((d) => d.id === res.id);
  ok(!!nd && nd.name === 'Dottie' && nd.key === res.key && !!nd.genes, 'the resident is home with its genes');
  ok(S1.shelter.adopted.includes(res.id), 'S.shelter.adopted has the id');
  ok(!(await ev(() => window.__paw.sr.roster())).some((x) => x.id === res.id), 'the roster drops the dog');

  sec('no free spot: the Adopt button explains kindly');
  await t.toasts();
  ok(await ev(() => { window.__paw.go('shelter'); return true; }) && await t.untilMode('shelter'), 'back at the shelter');
  ok(await N() === 5, 'the room has 5 dogs now');
  const other = (await ev(() => window.__paw.sr.roster())).find((x) => x.kind === 'resident');
  await ev((id) => window.__paw.sr.meet(id), other.id);
  ok(await t.until(() => document.getElementById('srAdopt') && document.getElementById('srAdopt').getAttribute('aria-disabled') === 'true', null, 3000), 'with no free spot the Adopt button is aria-disabled');
  await p.click('#srAdopt', { force: true }); ok(await t.waitToast(/All your dog spots are taken/), 'and a tap shows the adoptBlock text');
  await t.closeX();
  await p.click('#srHome'); ok(await t.untilMode('yard'), 'Go home');

  sec('the roster by date');
  const same = await ev(() => JSON.stringify(window.__paw.sr.roster('2026-10-14')) === JSON.stringify(window.__paw.sr.roster('2026-10-14')));
  ok(same, 'srRoster is the same for the same date');
  const wk = await ev(() => { const a = window.__paw.sr.roster('2026-10-14').filter((x) => x.kind === 'resident'), b = window.__paw.sr.roster('2026-10-21').filter((x) => x.kind === 'resident'); return [a.map((x) => x.key + x.name).join(), b.map((x) => x.key + x.name).join(), window.__paw.sr.roster('2026-10-15').filter((x) => x.kind === 'resident').map((x) => x.id).join() === a.map((x) => x.id).join()]; });
  ok(wk[0] !== wk[1], 'the residents differ next week');
  ok(wk[2], 'the residents stay all week');

  sec('an old v2.6 save without S.shelter');
  const old = await ev(() => { const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.shelter; delete s.bedAt; delete s.bedOf; delete s.careOff; s.dogs = s.dogs.slice(0, 1); s.activeId = s.dogs[0].id; return JSON.stringify(s); });
  await t.ctx.close();
  p = await t.boot({ storage: { pawhaven_proto_v1: old } });
  await p.click('#tContinue'); ok(await t.untilMode('yard'), 'the old save loads');
  ok(await ev(() => { const s = window.__paw.S.shelter; return !!s && Array.isArray(s.adopted) && s.adopted.length === 0 && s.seen === null; }), 'S.shelter gets its defaults');
  await ev(() => window.__paw.go('shelter'));
  ok(await t.untilMode('shelter') && await ev(() => window.__paw.sr.count()) >= 5, 'the playroom opens for the old save');
  ok(await t.waitToast(/The shelter has a playroom now/), 'with the welcome toast once');
});
