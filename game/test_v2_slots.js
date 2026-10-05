// v2 HOME: dog spots (max 4) unlocked by Bond, care days, shelter checklist, unlock toast, old saves over cap, puppy feeding, Playdates entry.
// node game/run_tests.js game/test_v2_slots.js --jobs 1
require('./test_lib').run('v2_slots', async (t) => {
  const { ok, sec, ev, S, SH } = t;
  const slots = () => ev(() => window.__paw.spots.slots());
  const setDogs = (a) => ev((a) => { const S = window.__paw.S; a.forEach((b, i) => { const lv = b; S.dogs[i].bond = { level: lv, pts: [0, 0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200][lv] }; }); }, a);
  const add = (k, nm) => ev(([k, nm]) => window.__paw.addDog({ key: k, sex: 'female', months: 14 }, nm).id, [k, nm]);
  const house = (h) => ev((h) => { const S = window.__paw.S; if (!S.inv.houses.includes(h)) S.inv.houses.push(h); S.house = h; }, h);
  const spotToasts = async () => (await t.toasts()).filter((x) => /dog spot is open/.test(x));

  sec('new game: 1 spot, care days start at 0');
  const p = (await t.newGame({ sex: 'girl' }, { bond: { level: 2, pts: 120 }, coins: 2000 }), t.p);
  let s = await S();
  ok(s.careDays === 0 && s.spotsSeen === 1 && Array.isArray(s.litters), `new save fields: careDays ${s.careDays}, spotsSeen ${s.spotsSeen}, litters ${JSON.stringify(s.litters)}`);
  let sl = await slots();
  ok(sl.cap === 1 && sl.used === 1 && sl.free === 0 && sl.spots.length === 4 && sl.spots[0].open && !sl.spots[1].open, 'dogSlots: cap 1, used 1, free 0, 4 spots');
  ok(sl.spots[1].reqs.length === 2 && sl.spots[2].reqs.length === 3 && sl.spots[3].reqs.every((r) => 'label' in r && 'done' in r && 'have' in r && 'need' in r), 'spot reqs have {label, done, have, need}');

  sec('spot 2: Bond 3 AND a house that fits 2 (Classic Wooden Doghouse)');
  await setDogs([3]); sl = await slots(); ok(sl.cap === 1, 'Bond 3 in a Cardboard Box: still 1 spot');
  await t.toasts(); await ev(() => window.__paw.spots.check()); ok((await spotToasts()).length === 0, 'no unlock toast while locked');
  await house('Classic Wooden Doghouse'); await setDogs([2]); sl = await slots(); ok(sl.cap === 1, 'Classic house at Bond 2: still 1 spot');
  await setDogs([3]); sl = await slots(); ok(sl.cap === 2 && sl.free === 1 && (await ev(() => window.__paw.spots.free())) === 1, 'Bond 3 + Classic Wooden Doghouse: 2 spots, slotsFree() = 1');
  await ev(() => window.__paw.spots.check()); ok(await t.waitToast(/A 2nd dog spot is open!/), 'gold unlock toast for the 2nd spot');
  await t.toasts(); await ev(() => { window.__paw.spots.check(); window.__paw.spots.check(); }); await t.sleep(300);
  ok((await spotToasts()).length === 0 && (await S()).spotsSeen === 2, 'unlock toast only once (S.spotsSeen = 2)');

  sec('Playdates card in the Play tray');
  await t.home(); await p.click('[data-act=play]'); await t.waitPop(true);
  ok(await p.locator('[data-play=playdates]').count() === 1, 'Playdates card in the Play tray'); await SH('01_play_tray');
  await t.toasts(); await p.click('[data-play=playdates]');
  const hasPD = await ev(() => typeof window.openPlaydates === 'function' || !!(window.__paw && window.__paw.breed));
  ok(await t.until(() => (window.__toasts || []).some((x) => /Puppy Playdates are almost ready/.test(x)) || !!document.querySelector('#modal:not([hidden]) .panel'), null, 5000), 'Playdates: opens the playdate popup, or the "almost ready" note' + (hasPD ? ' (BREED present)' : ''));
  await t.closeX(); await t.home();

  sec('spot 3: 2 dogs at Bond 8 + 21 care days + Treehouse Den');
  const pepId = await add('beagle', 'Pepper');
  await setDogs([8, 8]); await ev(() => { window.__paw.S.careDays = 21; }); await house('Cozy Cottage');
  sl = await slots(); ok(sl.cap === 2 && sl.free === 0, 'Bond 8 x2 + 21 care days, Cozy Cottage: 2 spots');
  await house('Treehouse Den'); await ev(() => { window.__paw.S.careDays = 20; }); sl = await slots(); ok(sl.cap === 2, '20 care days: still 2');
  await ev(() => { window.__paw.S.careDays = 21; }); await setDogs([8, 7]); sl = await slots(); ok(sl.cap === 2, 'only one dog at Bond 8: still 2');
  await setDogs([8, 9]); sl = await slots(); ok(sl.cap === 3 && sl.free === 1, 'Bond 8 + Bond 9, 21 care days, Treehouse Den: 3 spots');
  await ev(() => window.__paw.spots.check()); ok(await t.waitToast(/A 3rd dog spot is open! The Treehouse Den has room for one more\./), '3rd spot toast');

  sec('spot 4: 3 dogs at Bond 10 + 45 care days + Royal Castle Kennel');
  await add('pug', 'Dumpling'); await setDogs([10, 10, 10]); await ev(() => { window.__paw.S.careDays = 45; });
  sl = await slots(); ok(sl.cap === 3 && sl.free === 0, 'Treehouse Den: 3 spots even at 3x Bond 10');
  await house('Royal Castle Kennel'); await ev(() => { window.__paw.S.careDays = 44; }); sl = await slots(); ok(sl.cap === 3, '44 care days: still 3');
  await ev(() => { window.__paw.S.careDays = 45; }); await setDogs([10, 10, 9]); sl = await slots(); ok(sl.cap === 3, 'two Bond 10 dogs: still 3');
  await setDogs([10, 10, 10]); sl = await slots(); ok(sl.cap === 4 && sl.free === 1, '3x Bond 10 + 45 care days + Castle: 4 spots');
  await add('chihuahua', 'Peanut'); sl = await slots(); ok(sl.cap === 4 && sl.used === 4 && sl.free === 0, 'hard cap: 4 dogs, no free spot');

  sec('shelter checklist UI');
  await ev((id) => { const S = window.__paw.S; S.dogs.splice(2); S.house = 'Cozy Cottage'; S.careDays = 12; S.dogs[0].bond = { level: 8, pts: 1900 }; S.dogs[1].bond = { level: 3, pts: 250 }; }, pepId);
  await t.home(); ok(await t.toShelter(), 'shelter opens');
  const cells = await ev(() => [...document.querySelectorAll('#modal .spots .spot')].map((e) => e.dataset.kind));
  ok(cells.join(',') === 'filled,filled,locked,locked', 'paw spots row: filled, filled, locked, locked (' + cells.join(',') + ')');
  const c3 = await p.textContent('#modal .spot[data-spot="3"]');
  ok(/Bond 8 dogs: 1\/2/.test(c3) && /Care days: 12\/21/.test(c3) && /Treehouse Den \(or bigger\): no/.test(c3), 'spot 3 checklist: ' + c3.replace(/\s+/g, ' '));
  ok(await p.locator('#modal .spot[data-spot="3"] li.ok').count() === 0 && /Bond 10 dogs: 0\/3/.test(await p.textContent('#modal .spot[data-spot="4"]')), 'spot 4 checklist with progress');
  ok(await p.locator('#modal .spot.locked .slock').count() === 2, 'locked spots show a padlock');
  ok(/All your dog spots are taken/.test(await p.textContent('#modal .spotsum')), 'shelter header: spots taken');
  await t.toasts(); await p.locator('[data-shadopt]').first().click({ force: true }); ok(await t.waitToast(/All your dog spots are taken\. The 3rd spot opens with/), 'adopt blocked with the next spot\'s needs');
  await SH('02_shelter_spots');
  await ev(() => { window.__paw.S.house = 'Treehouse Den'; window.__paw.S.dogs[1].bond = { level: 8, pts: 1900 }; window.__paw.S.careDays = 21; });
  await t.leaveShelter(); ok(await t.toShelter(), 'shelter opens again');
  const cells2 = await ev(() => [...document.querySelectorAll('#modal .spots .spot')].map((e) => e.dataset.kind));
  ok(cells2.join(',') === 'filled,filled,open,locked' && /room for another friend/.test(await p.textContent('#modal .spotsum')), 'free spot shown open: ' + cells2.join(','));
  await t.leaveShelter();
  await ev(() => window.__paw.spots.open()); ok(await t.waitH2(/Dog spots/), 'openSpots(): Dog spots card'); ok(await p.locator('#modal .spots .spot').count() === 4, 'card shows the 4 spots');
  await SH('03_spots_card'); await p.click('#spOk'); await t.modalGone();

  sec('care days: once per real day, from the feed path and from the daily-care flags');
  await t.home(); await ev(() => { const S = window.__paw.S; S.careDays = 5; S.careDayLast = '2000-01-01'; S.dogs.forEach((d) => { d.stats.hunger = 30; }); S.inv.food['Basic Kibble'] = 5; S.place = 'yard'; });
  ok(await t.retryUntil(() => ev(() => window.__paw.feed('Basic Kibble')), () => window.__paw.S.careDays === 6), 'first feed of the day: +1 care day');
  await t.until(() => window.__paw.S.bowl == null, null, 6000);
  await t.retryUntil(() => ev(() => window.__paw.feed('Basic Kibble')), () => window.__paw.S.inv.food['Basic Kibble'] <= 3);
  s = await S(); ok(s.careDays === 6, 'second feed the same day: still 6 (' + s.careDays + ')');
  const cw = await ev(() => { const S = window.__paw.S, sp = window.__paw.spots; S.careDayLast = '2000-01-01'; S.daily.play = false; sp.watch(); S.daily.play = true; sp.watch(); const a = S.careDays; sp.watch(); return [a, S.careDays]; });
  ok(cw[0] === 7 && cw[1] === 7, 'a play flag (walk/fetch in another lane) counts once: ' + cw);

  sec('feeding: Puppy Kibble +5 Happiness under 6 months; "Eating for N!"');
  await t.until(() => window.__paw.S.bowl == null, null, 6000);
  await ev(() => { const S = window.__paw.S, d = S.dog, n = new Date(); n.setDate(n.getDate() - 3); d.born = n.toISOString().slice(0, 10); d.stats.hunger = 20; d.stats.happy = 40; S.inv.food['Puppy Kibble'] = 3; });
  await t.toasts(); ok(await t.retryUntil(() => ev(() => window.__paw.feed('Puppy Kibble')), () => (window.__toasts || []).some((x) => /Puppy-sized bites: \+5 Happiness/.test(x))), 'puppy line on Puppy Kibble');
  s = await S(); ok(s.dog.stats.happy >= 44, 'puppy got the bonus Happiness (' + Math.round(s.dog.stats.happy) + ')');
  await t.until(() => window.__paw.S.bowl == null, null, 6000);
  await ev(() => { const S = window.__paw.S, d = S.dog, n = new Date(); n.setDate(n.getDate() - 30); d.born = n.toISOString().slice(0, 10); d.stats.hunger = 20; const due = new Date(); due.setDate(due.getDate() + 5); d.preg = { sire: 'x', sireKey: 'beagle', sireName: 'Rex', since: due.toISOString().slice(0, 10), due: due.toISOString().slice(0, 10), pups: [{}, {}, {}], scanned: false }; });
  await t.toasts(); ok(await t.retryUntil(() => ev(() => window.__paw.feed('Puppy Kibble')), () => (window.__toasts || []).some((x) => /[Ee]ating for 4!/.test(x))), 'expecting mum with 3 pups: "Eating for 4!"');
  ok(!(await t.toasts()).some((x) => /Puppy-sized/.test(x)), 'adult dog: no puppy bonus');
  const nurse = await ev(() => { const S = window.__paw.S, d = S.dog; d.preg = null; const keep = S.litters; S.litters = [{ id: 'Ltest', mum: d.id, pups: [{}, {}] }]; const n = window.__paw.spots.eatingFor(d.id); S.litters = keep; return n; });
  ok(nurse === 3, 'nursing mum (S.litters mum === id) eats for 3: ' + nurse);
  await t.until(() => window.__paw.S.bowl == null, null, 6000);

  sec('old save: 4 dogs, cap 2: everyone stays, adoption blocked, careDays backfilled, no toast');
  const old = await ev(() => {
    const S = window.__paw.S; ['pug', 'chihuahua'].forEach((k, i) => window.__paw.addDog({ key: k, sex: 'male', months: 20 }, 'Old' + i));
    const n = new Date(); n.setDate(n.getDate() - 40); S.dogs[0].born = n.toISOString().slice(0, 10);
    S.dogs.forEach((d, i) => { d.bond = { level: [5, 4, 3, 2][i], pts: [700, 450, 250, 100][i] }; d.preg = null; });
    S.house = 'Royal Castle Kennel'; if (!S.inv.houses.includes(S.house)) S.inv.houses.push(S.house);
    window.__paw.saveNow(); const j = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete j.careDays; delete j.careDayLast; delete j.spotsSeen; delete j.litters; j.lastReal = Date.now(); return JSON.stringify(j);
  });
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: old } }); await p2.goto(require('./test_lib').URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  ok(await t.untilMode('yard'), 'old save loads'); await t.lu();
  ok(await t.until(() => !!(window.__paw && window.__paw.spots)), '__paw.spots exposed after load');
  s = await S(); sl = await slots();
  ok(s.dogs.length === 4, 'all 4 dogs kept'); ok(s.careDays === 30, 'careDays backfilled once: ageMonths(dog0) - 10 = ' + s.careDays);
  ok(sl.cap === 2 && sl.used === 4 && sl.free === 0 && s.spotsSeen === 2 && Array.isArray(s.litters), `cap 2, used 4, free 0, spotsSeen ${s.spotsSeen} (silent)`);
  await ev(() => window.__paw.spots.check()); await t.sleep(300); ok((await spotToasts()).length === 0, 'no unlock toast for spots an old save already had');
  ok(await t.toShelter(), 'shelter opens');
  ok(/Everyone stays\. New friends need a free spot\./.test(await p2.textContent('#modal .spotsum')), 'shelter: "Everyone stays. New friends need a free spot."');
  const cells3 = await ev(() => [...document.querySelectorAll('#modal .spots .spot')].map((e) => e.className));
  ok(cells3.length === 4 && cells3.every((c) => /filled/.test(c)) && cells3.filter((c) => /extra/.test(c)).length === 2, 'all 4 paw spots filled, 2 over the cap marked');
  await t.toasts(); await p2.locator('[data-shadopt]').first().click({ force: true }); ok(await t.waitToast(/Four dogs is a full pack|Everyone stays/), 'adopt blocked');
  ok((await S()).dogs.length === 4, 'still 4 dogs'); await SH('04_old_save_over_cap');
  await t.leaveShelter();
});
