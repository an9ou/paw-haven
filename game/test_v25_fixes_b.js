// v2.5 FIXES B (desktop 1280x720): the owner's v2.4 feedback, items 2, 4, 6 and 7 (V25.md 7b).
//  2  the bowl is hidden except while feeding, and while the dog eats it shows the food given (every food, home and away, the Café, Feed all)
//  4  napping in the house: the whole curled-up dog lies on the bed (every bed, several breeds, a puppy, a hat)
//  6  a mouse drag never taps the prop, shop or map place it started on, and the map pans
//  7  fetch on the desktop is unchanged (the full view, the panel at the top right)
require('./test_lib').run('v25_fixes_b', async (t) => {
  const { ok, sec, ev } = t;
  const FOODS = ['Fresh Water', 'Basic Kibble', 'Puppy Kibble', 'Bone-shaped Biscuit', 'Chicken & Rice Bowl', 'Salmon Pâté', 'Pupcake', 'Carrot Sticks', 'Apple Slices', 'Blueberry Bites', 'Seedless Watermelon Cubes', 'Sweet Potato Chews', 'Pumpkin Purée', 'Turkey Meatballs', 'Baked Pumpkin Wedges', 'Sweet Potato Coins', 'Warm Bone Broth', 'Ghost Biscuits', 'Candy Corn Carrots', 'Monster Meatball', 'Frozen Pupsicle', 'Wild Berries', "Duck's Picnic Sandwich", 'Golden Bone'];
  const SNACKS_AWAY = ['Carrot Sticks', 'Ghost Biscuits', 'Wild Berries', 'Fresh Water'];
  const BEDS = ['Old Blanket', 'Plaid Pillow', 'Fluffy Donut Bed', 'Banana Bed', 'Hammock Cot', 'Cloud Bed', 'Royal Canopy Bed'];
  const inv = {}; FOODS.forEach((n) => { if (n !== 'Fresh Water') inv[n] = 3; });
  await t.newGame({}, { inv: { food: inv }, coins: 1000 }); const p = t.p;
  await t.freezeMotion(true);
  const bowl = () => ev(() => { const b = document.getElementById('bowlG'); return b ? { shown: getComputedStyle(b).visibility !== 'hidden', label: b.getAttribute('aria-label'), len: b.innerHTML.length } : null; });

  sec('2. the bowl: hidden everywhere, shown from the Feed tray to the end of the meal');
  for (const pl of ['yard', 'house', 'square', 'cafe', 'market', 'park']) {
    await t.home(pl); const b = await bowl();
    ok(!!b && !b.shown, `${pl}: no bowl on show`);
  }
  await t.home('yard');
  await p.click('[data-act=feed]'); await t.waitPop(true);
  const empty = await bowl(); ok(empty.shown, 'the Feed tray shows the (empty) bowl');
  await p.keyboard.press('Escape'); await t.waitPop(false);
  ok(await t.until(() => getComputedStyle(document.getElementById('bowlG')).visibility === 'hidden', null, 3000), 'closing the tray hides it again');
  const feedOne = async (n, place) => {
    await t.home(place);
    await ev(() => { const S = window.__paw.S; S.stats.hunger = 10; S.waterAt = -99999; S.daily.pupcake = false; });
    await p.click('[data-act=feed]'); await t.waitPop(true);
    const at = await bowl(); await p.click(`[data-food="${n}"]`);
    await t.until((n) => window.__paw.S.bowl === n, n, 3000);
    await t.sleep(950); // mid-meal (the dog walks to the bowl, eats from 850 ms and is done at 2300 ms)
    const mid = await bowl();
    await t.until(() => window.__paw.S.bowl == null, null, 6000);
    const after = await bowl();
    return { at, mid, after };
  };
  const missing = [];
  for (const n of FOODS) {
    const place = SNACKS_AWAY.includes(n) ? 'square' : 'yard';
    const r = await feedOne(n, place);
    const good = r.at.shown && r.mid.shown && r.mid.label === 'Food bowl with ' + n && r.mid.len > empty.len * 1.4 && !r.after.shown;
    if (!good) missing.push(`${n} ${JSON.stringify({ at: r.at.shown, mid: r.mid.shown, label: r.mid.label, ratio: +(r.mid.len / empty.len).toFixed(2), after: r.after.shown })}`);
  }
  ok(!missing.length, `every food (${FOODS.length}, ${SNACKS_AWAY.length} of them away in the Square): the bowl shows while the tray is open, holds that food mid-meal and hides after${missing.length ? ' -> ' + missing.join(' | ') : ''}`);
  await t.SH('2_feed_mid');

  sec('2. Café treats go in the bowl too');
  await t.home('cafe'); await ev(() => { window.__paw.S.dogs[0].cafeDay = ''; });
  await p.click('#sceneG [data-hot="cafe-menu"]', { force: true }); await p.waitForSelector('[data-cafe="Pupuccino"]');
  await p.click('[data-cafe="Pupuccino"]');
  ok(await t.until(() => /Pupuccino/.test(document.getElementById('bowlG').getAttribute('aria-label') || '') && getComputedStyle(document.getElementById('bowlG')).visibility !== 'hidden', null, 3000), 'the Pupuccino is served in the bowl');
  ok(await t.waitToast(/enjoyed a Pupuccino/), 'the Café toast still comes');
  ok(await t.until(() => getComputedStyle(document.getElementById('bowlG')).visibility === 'hidden', null, 4000), 'the bowl goes away after the treat');

  sec('2. Feed all: a bowl for every fed dog');
  await ev(() => { window.__paw.addDog('corgi', 'Bun', 'male'); window.__paw.addDog('pug', 'Pip', 'female'); });
  await t.home('yard'); await t.calm();
  await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.hunger = 10; d.sleeping = false; }); window.__paw.S.inv.food['Basic Kibble'] = 9; window.__paw.go('yard'); });
  await p.click('[data-act=feed]'); await t.waitPop(true); await p.click('#feedAll');
  ok(await t.until(() => document.querySelectorAll('#fbPackBowls > svg').length === 2 && getComputedStyle(document.getElementById('bowlG')).visibility !== 'hidden', null, 3000), 'Feed all: the active dog\'s bowl and one bowl per pack dog show');
  const pb = await ev(() => [...document.querySelectorAll('#fbPackBowls > svg')].map((s) => { const r = s.getBoundingClientRect(); return [r.width, r.height]; }));
  ok(pb.every((r) => r[0] > 20 && r[1] > 20), `pack bowls are drawn (${JSON.stringify(pb)})`);
  ok(await t.until(() => !document.getElementById('fbPackBowls') && getComputedStyle(document.getElementById('bowlG')).visibility === 'hidden', null, 5000), 'Feed all: every bowl goes away after the meal');
  await ev(() => { const S = window.__paw.S; S.dogs.splice(1); S.activeId = S.dogs[0].id; window.__paw.go('yard'); });

  sec('4. napping in the house: the whole dog lies on the bed');
  const DOGS = [['shiba', 10, 'Wizard Hat'], ['greyhound', 10, null], ['golden', 3, 'Wizard Hat'], ['samoyed', 10, null], ['frenchie', 10, 'Wizard Hat'], ['corgi', 10, null]];
  const bad = []; let n = 0;
  for (const [key, ageD, hat] of DOGS) for (const bed of BEDS) {
    const r = await ev(([key, ageD, hat, bed, BEDS]) => {
      const S = window.__paw.S, d = S.dogs[0]; d.key = key; const b = new Date(); b.setDate(b.getDate() - ageD); d.born = b.toISOString().slice(0, 10);
      S.outfit.head = hat; d.outfit.head = hat; S.beds = BEDS.slice(); S.bed = bed; S.place = 'house'; S.sleeping = true; S.stats.energy = 30; window.__paw.go('yard');
      const R = (e) => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom]; };
      const front = document.querySelector('#bedFront .pa-bed-front');
      return { dog: R(document.getElementById('dogArt')), bed: R(document.getElementById('bedG')), lip: front ? R(front)[1] : null, view: R(document.querySelector('#view svg.world')), fShown: document.getElementById('bedFront') ? document.getElementById('bedFront').style.display !== 'none' : null };
    }, [key, ageD, hat, bed, BEDS]);
    const [x0, y0, x1, y1] = r.dog, h = y1 - y0, cx = (x0 + x1) / 2, lip = r.lip == null ? r.bed[3] : r.lip;
    const above = Math.max(0, Math.min(y1, lip) - y0) / h; n++;
    const inView = x0 >= r.view[0] && x1 <= r.view[2] && y0 >= r.view[1] && y1 <= r.view[3];
    const onBed = cx > r.bed[0] && cx < r.bed[2] && y1 > r.bed[1] && y1 <= r.bed[3] + 2;
    if (!(h > 20 && inView && onBed && above >= 0.8 && r.fShown !== false)) bad.push(`${key}${ageD < 6 ? ' pup' : ''}${hat ? ' hat' : ''}/${bed}: above lip ${Math.round(above * 100)}% ${JSON.stringify({ dog: r.dog.map(Math.round), bed: r.bed.map(Math.round), lip: Math.round(lip) })}`);
  }
  ok(!bad.length, `${n} naps (${DOGS.length} dogs x ${BEDS.length} beds): the sleeping dog is in view, centred over the bed, and at least 80% of it shows above the bed's front lip${bad.length ? ' -> ' + bad.slice(0, 4).join(' | ') : ''}`);
  await t.SH('4_nap');
  // the fit follows the nap spot only: awake, the dog is drawn as before (no transform on the art)
  await ev(() => { const S = window.__paw.S; S.sleeping = false; window.__paw.go('yard'); });
  ok(await ev(() => !document.getElementById('dogArt').hasAttribute('transform') && !document.getElementById('dogHit').hasAttribute('transform')), 'awake: the dog art and its tap box are drawn as before');
  // the real nap from the Care tray (dog walks to the bed, then sleeps)
  await ev(() => { const S = window.__paw.S, d = S.dogs[0]; d.key = 'shiba'; S.outfit.head = 'Wizard Hat'; S.bed = 'Old Blanket'; window.__paw.go('yard'); });
  await p.click('[data-act=care]'); await t.waitPop(true); await p.click('[data-care=sleep]');
  ok(await t.until(() => { const a = document.getElementById('dogArt'), f = document.querySelector('#bedFront .pa-bed-front'); if (!a.hasAttribute('transform') || !f) return false; const r = a.getBoundingClientRect(), l = f.getBoundingClientRect().top; return r.height > 20 && (Math.min(r.bottom, l) - r.top) / r.height >= 0.8; }, null, 5000), 'Care > Nap: the dog curls up on top of the Old Blanket with its Wizard Hat');
  await ev(() => { window.__paw.S.sleeping = false; window.__paw.S.outfit.head = null; window.__paw.go('yard'); });

  sec('6. a mouse drag never taps what it started on; a click still does');
  const drag = async (sel, dx, dy) => {
    const b = await p.locator(sel).first().boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(x + dx * i / 10, y + dy * i / 10); await t.sleep(16); } await p.mouse.up();
    await t.sleep(350);
  };
  const opened = () => ev(() => !document.getElementById('modal').hidden || !!document.querySelector('#dock > .tray:not(.dock-idle):not(.mini)'));
  for (const [pl, sel, label] of [['cafe', '#sceneG [data-hot="cafe-menu"]', 'the Café counter'], ['square', '#sceneG [data-hot="notice"]', 'the Square notice board'], ['market', '#sceneG [data-shop]', 'a Market Street shop'], ['yard', '#mailboxG', 'the mailbox'], ['yard', '#houseG', 'the dog house']]) {
    await t.home(pl); await t.sleep(300); if (!(await p.locator(sel).count())) { ok(false, `${label} is in the ${pl}`); continue; }
    await drag(sel, -140, 30);
    ok(!(await opened()) && (await t.mode()) !== 'map', `${pl}: a drag that starts on ${label} opens nothing`);
    await p.click(sel, { force: true });
    ok(await t.until(() => !document.getElementById('modal').hidden || !!document.querySelector('#dock > .tray:not(.dock-idle):not(.mini)'), null, 3000), `${pl}: a click on ${label} still opens it`);
    await t.closeX(); await p.keyboard.press('Escape'); await t.modalGone();
  }
  sec('6. the map pans with a mouse drag and the drag picks no place');
  await t.home('yard'); await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]'); await t.sleep(300);
  const tr0 = await ev(() => document.getElementById('mapInner').style.transform);
  await drag('#mapPan', -220, -90);
  const tr1 = await ev(() => document.getElementById('mapInner').style.transform);
  ok(tr1 !== tr0, `a mouse drag pans the map (${tr0} -> ${tr1})`);
  ok((await t.mode()) === 'map' && !(await ev(() => !!document.querySelector('.onway'))), 'the drag did not start a trip');
  await p.keyboard.press('Escape'); await t.untilMode('yard');

  sec('7. fetch on the desktop is unchanged');
  await ev(() => { window.__paw.S.inv.toys = window.__paw.S.inv.toys || {}; });
  await t.patch({ inv: { toys: { 'Tennis Ball': 1 } } });
  await t.home('house'); await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play="fetch:Tennis Ball"]');
  ok(await t.until(() => window.__paw.mode === 'fetch' && !!document.getElementById('fQuit'), null, 6000), 'fetch opens from the Play tray in the house');
  const L = await ev(() => { const R = (s) => { const q = document.querySelector(s).getBoundingClientRect(); return [q.left, q.top, q.width, q.height].map(Math.round); }; return { view: R('#view'), svg: R('#view svg.world'), tray: R('#dock .tray'), flex: document.getElementById('view').style.flex, trayH: document.getElementById('view').style.getPropertyValue('--trayH') }; });
  ok(L.view[2] >= 1200 && L.view[3] >= 600 && L.svg[3] === L.view[3] && !L.flex && !L.trayH, `the scene fills the view as before ${JSON.stringify(L)}`);
  ok(L.tray[0] > 800 && L.tray[1] < 120, 'the fetch panel sits at the top right as before');
  await t.SH('7_fetch_desk');
  await p.click('#fQuit'); await t.until(() => window.__paw.mode === 'yard' || !!document.getElementById('resOk') || !document.getElementById('fQuit'), null, 6000);
});
