// v1.5A multi-dog home (harness.js merged). node test_v15.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const DIR = path.join(__dirname, 'shots_v15'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = []; const ok = (c, l) => { console.log(c ? '  ok  ' : '  FAIL', l); if (!c) fails.push(l); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const mk = async () => { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push(e.message)); return p; };
  let p = await mk();
  const arm = () => p.evaluate(() => { window.__toasts = []; new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent); }))).observe(document.getElementById('toasts'), { childList: true }); });
  const toasts = () => p.evaluate(() => window.__toasts.splice(0));
  const SH = (n) => p.screenshot({ path: path.join(DIR, n + '.png') });
  const S = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const ev = (f, a) => p.evaluate(f, a);
  const lu = async () => { for (let i = 0; i < 6 && await p.locator('#luOk').count(); i++) { await p.click('#luOk'); await sleep(300); } };
  const dev = async (fn) => { await p.click('#devBtn'); await sleep(150); await fn(); if (await p.locator('#devPanel:not([hidden])').count()) await p.click('#dvX'); await sleep(300); await lu(); };
  const calm = () => ev(() => window.__paw.S.dogs.forEach((d) => { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = window.__paw.S.gameMin + 9999; }));
  const hunger = () => p.textContent('.meter[data-k="hunger"] .num');

  // v1.7 fix: measure where the dogs are drawn, in scene coordinates
  const layout = () => ev(() => {
    const svg = document.querySelector('#view svg.world'); const M = svg.getScreenCTM().inverse();
    const sc = (els) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; els.forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width) return; const a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M); x0 = Math.min(x0, a.x); y0 = Math.min(y0, a.y); x1 = Math.max(x1, b.x); y1 = Math.max(y1, b.y); }); return [x0, y0, x1, y1].map(Math.round); };
    const kids = (s) => (s ? [...s.children] : []);
    const pack = [...document.querySelectorAll('#pack .packdog svg.pa-dog')].map((s) => sc(kids(s)));
    const bed = document.querySelector('#bedG svg'), bowl = document.querySelector('#bowlG svg'), house = document.querySelector('#houseG svg');
    return { pack, bed: bed ? sc(kids(bed)) : null, bowl: bowl ? sc(kids(bowl)) : null, house: house ? sc(kids(house)) : null };
  });
  const hitR = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const packCheck = async (place, label) => {
    await ev((pl) => { const S = window.__paw.S; S.dogs.forEach((d) => { d.sleeping = false; }); S.place = pl; window.__paw.go('yard'); }, place); await sleep(900);
    const L = await layout(), zone = place === 'yard' ? [620, 330, 860, 530] : place === 'house' ? (L.bed || [625, 450, 860, 540]) : null, ACT = [315, 300, 548, 508];
    const pairs = []; L.pack.forEach((a, i) => L.pack.forEach((b, j) => { if (i < j && hitR(a, b)) pairs.push(i + '/' + j); }));
    ok(L.pack.length === 3, `${label}: 3 secondary dogs drawn`);
    if (zone) ok(L.pack.every((r) => !hitR(r, zone)), `${label}: no secondary dog touches the ${place === 'yard' ? 'dog-house' : 'bed'} zone ${JSON.stringify(zone)}: ${JSON.stringify(L.pack)}`);
    ok(!pairs.length && L.pack.every((r) => !hitR(r, ACT) && !hitR(r, L.bowl)), `${label}: dogs do not overlap each other, the active dog or the bowl ${pairs.join(',')}`);
    ok(L.pack.every((r) => r[3] <= 604 && r[3] >= 395), `${label}: every dog's feet are on the ground band (y ${L.pack.map((r) => r[3]).join(', ')})`);
    return L;
  };

  await p.goto(URL); await arm(); await sleep(700);
  await p.click('#tNew'); await sleep(400); await p.click('#aGirl'); await sleep(150); await p.click('#aAdopt'); await sleep(300); await p.click('#nOk'); await sleep(300);
  for (let i = 0; i < 3; i++) { await p.click('#iNext'); await sleep(300); }
  await sleep(500); await calm();
  let s = await S(); ok(Array.isArray(s.dogs) && s.dogs.length === 1 && s.activeId === s.dogs[0].id && s.dog.id === s.activeId, 'S.dogs model with an active dog');
  const saved = await ev(() => JSON.parse(localStorage.getItem('pawhaven_proto_v1') || '{}'));
  ok(saved.dogs && !('stats' in saved) && !('dog' in saved), 'save stores S.dogs only (no duplicated aliases)');
  ok(await ev(() => !!window.PawGenes), 'PawGenes loaded (genes.js first in the merge)');

  // ---- full capacity: Bond 5 but a Cardboard Box ----
  await dev(async () => { for (let i = 0; i < 4; i++) await p.click('#dvBond'); await p.click('#dvCoins'); });
  await p.click('[data-act=map]'); await sleep(500); await p.evaluate(() => window.__paw.mapTo('shelter')); await sleep(100); await p.click('[data-area=shelter]'); await sleep(900);
  ok(/Your home is full\. A bigger dog house would fit another friend\./.test(await p.textContent('#modal')), 'full-capacity message in the shelter');
  await toasts(); await p.locator('[data-shadopt]').first().click({ force: true }); await sleep(300);
  ok((await toasts()).some((t) => /Your home is full/.test(t)), 'adopt blocked when full'); await SH('01_shelter_full');
  await p.click('.panel .x'); await sleep(200); await p.keyboard.press('Escape'); await sleep(600);

  // ---- Bond 5 + cottage: rescue a dog ----
  await dev(async () => { await p.click('#dvPack'); });
  await p.click('[data-act=map]'); await sleep(500); await p.evaluate(() => window.__paw.mapTo('shelter')); await sleep(100); await p.click('[data-area=shelter]'); await sleep(900);
  ok(/room for another friend/.test(await p.textContent('#modal')), 'shelter has room with a Cozy Cottage');
  const cards = await p.locator('.shcard.rescue').count(); ok(cards === 2, '2 rescues today');
  const rtext = await p.textContent('.shcard.rescue'); console.log('   rescue card:', rtext.replace(/\s+/g, ' ').trim().slice(0, 140));
  await SH('02_shelter_rescues');
  await p.locator('[data-shadopt^="rescue"]').first().click(); await sleep(300);
  await p.fill('#shName', 'Pepper'); await p.click('#shOk'); await sleep(1200); await lu(); await calm();
  s = await S(); const pep = s.dogs[1];
  ok(s.dogs.length === 2 && pep.name === 'Pepper' && pep.rescue && /\d{4}-\d\d-\d\d/.test(pep.rescue.date), 'rescued Pepper: ' + JSON.stringify({ sex: pep.sex, born: pep.born, coat: pep.coat, eyes: pep.eyes }));
  const months = await ev((id) => { const d = window.__paw.S.dogs.find((x) => x.id === id); const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((t - new Date(d.born + 'T00:00:00')) / 864e5); }, pep.id);
  ok(months >= 8 && months <= 36 && ['male', 'female'].includes(pep.sex), `rescue age ${months} dog months, fixed sex ${pep.sex}`);
  ok(s.place === 'yard' && (await p.locator('#pack [data-dog]').count()) === 1, 'both dogs shown in the yard (1 in the pack spot)');
  ok((await p.locator('#hudPack .dchip').count()) === 1, 'HUD chip for the other dog'); await SH('03_two_dogs_yard');

  // ---- switching: click the dog, then the chip ----
  const mochiId = s.dogs[0].id;
  await ev(() => { const S = window.__paw.S; S.dogs[0].stats.hunger = 20; S.dogs[1].stats.hunger = 85; }); await sleep(400);
  const h1 = await hunger();
  await p.click(`#pack [data-dog="${pep.id}"]`, { force: true }); await sleep(700);
  s = await S(); ok(s.activeId === pep.id && s.dog.name === 'Pepper', 'clicking Pepper in the scene makes her/him active');
  const h2 = await hunger(); ok(h1 === '20' && h2 === '85', `per-dog stats in the HUD: Mochi ${h1}, Pepper ${h2}`);
  await SH('04_switched_by_click');
  await p.click(`#hudPack .dchip[data-dog="${mochiId}"]`); await sleep(700);
  ok((await S()).activeId === mochiId, 'chip click switches back to Mochi');

  // ---- per-dog outfit ----
  await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Party Hat'); });
  await p.click('[data-act=wardrobe]'); await sleep(300); if (await p.locator('[data-eq="Party Hat"]').count()) await p.click('[data-eq="Party Hat"]'); await sleep(200); await p.click('.panel .x'); await sleep(200);
  s = await S(); ok(s.dogs[0].outfit.head === 'Party Hat' && !s.dogs[1].outfit.head, 'outfit is per dog');

  // ---- Feed all ----
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.stats.hunger = 30; d.sleeping = false; }); S.inv.food['Basic Kibble'] = 5; });
  await p.click('[data-act=feed]'); await sleep(300); ok(await p.locator('#feedAll').count() === 1, 'Feed all button at home'); await SH('05_feed_all_popup');
  await p.click('#feedAll'); await sleep(1600);
  s = await S(); ok(s.dogs.every((d) => d.stats.hunger > 30) && s.inv.food['Basic Kibble'] === 3, 'Feed all: both dogs fed, 2 kibble used');
  console.log('   feed all toast:', (await toasts()).filter((t) => /Feed all/.test(t))[0]);

  // ---- walk with the active dog; the other stays home and greets ----
  await calm(); const pepHungerBefore = (await S()).dogs[1].stats.hunger;
  await p.click('[data-act=walk]'); await sleep(700); await p.click('#rtStart'); await sleep(1200);
  for (let i = 0; i < 10; i++) { const go = p.locator('button:has-text("Let\'s go")'); if (await go.count()) { await go.first().click(); break; } await sleep(300); }
  await sleep(2500); await SH('06_walk_one_dog');
  ok((await ev(() => window.__paw.mode)) === 'walk' && (await S()).place === 'yard', 'walking the active dog (the place stays home)');
  await p.keyboard.press('Escape'); await sleep(600); if (await p.locator('[data-home]').count()) await p.click('[data-home]');
  for (let i = 0; i < 20 && !(await p.locator('#resOk').count()); i++) await sleep(300);
  await toasts(); if (await p.locator('#resOk').count()) await p.click('#resOk'); await sleep(1800); await lu();
  ok((await toasts()).some((t) => /sniffs|greets|checks/.test(t) && /Pepper/.test(t)), 'Pepper greets the walker on return');
  ok((await S()).dogs[1].stats.hunger <= pepHungerBefore, 'the home dog kept living (stats tick at home)');

  // ---- coats incl. a merle ----
  const merle = await ev(() => { const G = window.PawGenes; const ph = G.phenotype({ B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] }, 'corgi', 'x1'); const sv = window.PawArt.dog('corgi', { pose: 'idle', coat: ph.coat, seed: 12345 }); return { name: ph.coatName, merle: ph.coat.merle, svg: sv.length }; });
  ok(merle.merle && /merle/i.test(merle.name) && merle.svg > 500, 'merle phenotype renders: ' + merle.name);
  await ev(() => { const S = window.__paw.S; const d = S.dogs[1]; d.key = 'corgi'; d.genes = { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] }; window.__paw.go('yard'); }); await sleep(700);
  await p.click('[data-act=journal]'); await sleep(300); await p.click('[data-jt=profile]'); await sleep(300);
  await p.click(`[data-pdog="${pep.id}"]`); await sleep(300);
  const pf = await p.textContent('.profile'); ok(/merle/i.test(pf) && /Rescued on/.test(pf), 'Profile: dog selector, merle coat name, "Rescued on"');
  await SH('07_profile_merle_rescue'); await p.click('.panel .x'); await sleep(200);
  await SH('08_pack_with_merle');

  // ---- highest Bond unlocks: Pepper (Bond 1) active can still go to Riverside (Bond 2) ----
  await p.click(`#hudPack .dchip[data-dog="${pep.id}"]`); await sleep(600);
  await p.click('[data-act=map]'); await sleep(500); await p.evaluate(() => window.__paw.mapTo('river')); await sleep(100); await p.click('[data-area=river]'); await sleep(1800); await lu();
  ok((await S()).place === 'river', 'unlocks use the highest Bond (Bond-1 dog active, Riverside opens)');
  ok((await p.locator('#pack [data-dog]').count()) === 1, 'every dog travelled to the river');

  // ---- potty for every dog, up to 2 messes ----
  await ev(() => { const S = window.__paw.S; S.messes.river = []; S.dogs.forEach((d) => { d.potty.poopDue = S.gameMin - 1; }); });
  await sleep(9000);
  s = await S(); ok((s.messes.river || []).length === 2 && new Set(s.messes.river.map((m) => m.dog)).size === 2, 'both dogs pooped: 2 messes (cap 2 with 2 dogs)');
  await SH('09_two_messes');

  // ---- v1.7: 10 breeds at the shelter, adopt the 4 new breeds as starters ----
  await ev(() => { const S = window.__paw.S; ['Royal Castle Kennel'].forEach((h) => { if (!S.inv.houses.includes(h)) S.inv.houses.push(h); }); S.house = 'Royal Castle Kennel'; S.coins = 9999; });
  const toShelter = async () => { await p.click('[data-act=map]'); await sleep(500); await p.evaluate(() => window.__paw.mapTo('shelter')); await sleep(100); await p.click('[data-area=shelter]'); await sleep(900); };
  await toShelter();
  const stK = await ev(() => [...document.querySelectorAll('.shcard.starter [data-shadopt]')].map((b) => b.dataset.shadopt.split('|')[1]));
  ok(stK.length === 9 && ['chihuahua', 'pug', 'greyhound', 'beagle'].every((k) => stK.includes(k)), 'shelter: 9 starter cards left (10 breeds, Mochi home): ' + stK.join(','));
  const labs = await ev(() => [...document.querySelectorAll('.shcard.starter .shdog svg.pa-dog')].map((x) => x.getAttribute('aria-label')));
  ok(['Chihuahua', 'Pug', 'Greyhound', 'Beagle'].every((br) => labs.some((l) => l.includes(br))), 'new starter cards draw their own breed');
  await SH('11_shelter_10_breeds'); await p.click('.panel .x'); await sleep(200); await p.keyboard.press('Escape'); await sleep(600);
  const newKeys = ['chihuahua', 'pug']; // the castle fits 4: Mochi, Pepper + 2 new breeds
  for (const k of newKeys) {
    await toShelter();
    await p.click(`[data-shsex="${k}|female"]`); await sleep(300); await p.click(`[data-shadopt="starter|${k}"]`); await sleep(300); await p.click('#shOk'); await sleep(1200); await lu(); await calm();
  }
  s = await S(); ok(s.dogs.length === 4 && newKeys.every((k) => s.dogs.some((d) => d.key === k && !d.rescue)), 'adopted a Chihuahua and a Pug as starters (4 dogs)');
  const packLabs = await ev(() => [...document.querySelectorAll('#pack svg.pa-dog')].map((x) => x.getAttribute('aria-label')).join(' | '));
  ok(/Chihuahua/.test(packLabs) && /Pug/.test(packLabs), 'both new breeds drawn in the pack: ' + packLabs); await SH('12_pack_new_breeds');
  await packCheck('yard', 'v15 4 dogs in the yard'); await SH('13_pack4_yard');
  await packCheck('house', 'v15 4 dogs in the house'); await SH('14_pack4_house');
  await ev(() => { window.__paw.S.place = 'yard'; window.__paw.go('yard'); }); await sleep(500);


  // ---- old-save migration (v1.3 single-dog save) ----
  const old = { v: 1, dog: { key: 'corgi', name: 'Biscuit', favFood: ['Basic Kibble'], favToy: 'Tennis Ball', sex: 'male', born: '2026-09-01' }, stats: { hunger: 44, happy: 55, energy: 66, clean: 77 }, bond: { level: 3, pts: 300 }, coins: 99, inv: { food: {}, toys: ['Tennis Ball'], clothes: [], houses: ['Cardboard Box'], charms: [] }, outfit: { head: null, eyes: null, neck: null, body: null, charm: null }, house: 'Cardboard Box', tricks: {}, gameMin: 600, lastReal: Date.now(), waterAt: -999, pupUntil: -1, daily: { day: 0 }, sleeping: false, collection: {}, adopted: true, found: {}, mapPieces: [], walks: 3, glowUntil: -1, secretDug: false, title: '', place: 'yard' };
  p = await mk();
  await p.addInitScript((v) => { try { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('pawhaven_proto_v1', v); } } catch (e) { /* none */ } }, JSON.stringify(old));
  await p.goto(URL); await sleep(600); await p.click('#tContinue'); await sleep(1500);
  s = await S(); const d0 = s.dogs && s.dogs[0];
  ok(s.dogs && s.dogs.length === 1 && d0.name === 'Biscuit' && Math.abs(d0.stats.hunger - 44) < 2 && d0.bond.level === 3 && s.stats.hunger === d0.stats.hunger && s.coins === 99 && s.activeId === d0.id, 'old save migrated into S.dogs[0]: ' + JSON.stringify(d0 && { name: d0.name, hunger: d0.stats.hunger, bond: d0.bond, coins: s.coins }));
  await SH('10_migrated');

  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  console.log(fails.length ? `FAILED ${fails.length}: ${fails.join(' | ')}` : 'ALL OK');
  await b.close();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
