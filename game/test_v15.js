// v1.5A multi-dog home + v1.7 pack layout (desktop 1280x720, harness.js merged). node game/test_v15.js  (or: node game/run_tests.js v15)
// Starts from one brand-new dog; Bond / coins / houses are set with prepared-state patches and the real Dev panel buttons.
require('./test_lib').run('v15', async (t) => {
  const { ok, sec, ev, S, SH } = t;
  const hunger = () => t.p.textContent('.meter[data-k="hunger"] .num');
  const hungerIs = (v, tol) => t.until(([v, tol]) => { const e = document.querySelector('.meter[data-k="hunger"] .num'); return !!e && Math.abs(+e.textContent - v) <= tol; }, [v, tol], 5000);

  sec('one dog, S.dogs model');
  const p = await t.boot(); await t.adopt({ sex: 'girl' });
  let s = await S(); ok(Array.isArray(s.dogs) && s.dogs.length === 1 && s.activeId === s.dogs[0].id && s.dog.id === s.activeId, 'S.dogs model with an active dog');
  const saved = await ev(() => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem('pawhaven_proto_v1') || '{}'); });
  ok(saved.dogs && !('stats' in saved) && !('dog' in saved), 'save stores S.dogs only (no duplicated aliases)');
  ok(await ev(() => !!window.PawGenes), 'PawGenes loaded (genes.js first in the merge)');

  sec('full capacity: Bond 5 but a Cardboard Box');
  await t.patch({ bond: { level: 5, pts: 1000 }, coins: 1500 });
  ok(await t.toShelter(), 'shelter opens');
  ok(/Your home is full\. A bigger dog house would fit another friend\./.test(await p.textContent('#modal')), 'full-capacity message in the shelter');
  await t.toasts(); await p.locator('[data-shadopt]').first().click({ force: true }); ok(await t.waitToast(/Your home is full/), 'adopt blocked when full'); await SH('01_shelter_full');
  await t.leaveShelter();

  sec('Bond 5 + cottage: rescue a dog');
  await t.dev(async () => { await p.click('#dvPack'); });
  ok(await t.toShelter(), 'shelter opens again'); ok(/room for another friend/.test(await p.textContent('#modal')), 'shelter has room with a Cozy Cottage');
  ok(await p.locator('.shcard.rescue').count() === 2, '2 rescues today'); await SH('02_shelter_rescues');
  await p.locator('[data-shadopt^="rescue"]').first().click(); await p.fill('#shName', 'Pepper'); await p.click('#shOk');
  ok(await t.until(() => window.__paw.S.dogs.length === 2 && window.__paw.mode === 'yard', null, 12000), 'second dog adopted'); await t.lu(); await t.calm();
  s = await S(); const pep = s.dogs[1];
  ok(s.dogs.length === 2 && pep.name === 'Pepper' && pep.rescue && /\d{4}-\d\d-\d\d/.test(pep.rescue.date), 'rescued Pepper: ' + JSON.stringify({ sex: pep.sex, born: pep.born, coat: pep.coat, eyes: pep.eyes }));
  const months = await ev((id) => { const d = window.__paw.S.dogs.find((x) => x.id === id); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((n - new Date(d.born + 'T00:00:00')) / 864e5); }, pep.id);
  ok(months >= 8 && months <= 36 && ['male', 'female'].includes(pep.sex), `rescue age ${months} dog months, fixed sex ${pep.sex}`);
  ok(s.place === 'yard' && (await p.locator('#pack [data-dog]').count()) === 1, 'both dogs shown in the yard (1 in the pack spot)');
  ok((await p.locator('#hudPack .dchip').count()) === 1, 'HUD chip for the other dog'); await SH('03_two_dogs_yard');

  sec('switching: click the dog, then the chip');
  const mochiId = s.dogs[0].id;
  await ev(() => { const S = window.__paw.S; S.dogs[0].stats.hunger = 20; S.dogs[1].stats.hunger = 85; });
  ok(await hungerIs(20, 2), 'Mochi meter shows ~20'); const h1 = +(await hunger());
  await p.click(`#pack [data-dog="${pep.id}"]`, { force: true }); ok(await t.until((id) => window.__paw.S.activeId === id, pep.id), 'clicking Pepper in the scene makes her/him active');
  s = await S(); ok(s.dog.name === 'Pepper', 'active dog is Pepper'); ok(await hungerIs(85, 2), 'Pepper meter shows ~85'); const h2 = +(await hunger());
  ok(Math.abs(h1 - 20) <= 2 && Math.abs(h2 - 85) <= 2, `per-dog stats in the HUD: Mochi ${h1}, Pepper ${h2}`); await SH('04_switched_by_click');
  await p.click(`#hudPack .dchip[data-dog="${mochiId}"]`); ok(await t.until((id) => window.__paw.S.activeId === id, mochiId), 'chip click switches back to Mochi');

  sec('per-dog outfit, Feed all');
  await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Party Hat'); });
  await p.click('[data-act=wardrobe]'); await p.waitForSelector('.ward'); await p.waitForSelector('[data-eq="Party Hat"]'); await p.click('[data-eq="Party Hat"]');
  await t.until(() => window.__paw.S.dogs[0].outfit.head === 'Party Hat', null, 4000); await t.closeX();
  s = await S(); ok(s.dogs[0].outfit.head === 'Party Hat' && !s.dogs[1].outfit.head, 'outfit is per dog');
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.stats.hunger = 30; d.sleeping = false; }); S.inv.food['Basic Kibble'] = 5; });
  await p.click('[data-act=feed]'); await t.waitPop(true); ok(await p.locator('#feedAll').count() === 1, 'Feed all button at home'); await SH('05_feed_all_popup');
  await t.toasts(); await p.click('#feedAll');
  ok(await t.until(() => window.__paw.S.dogs.every((d) => d.stats.hunger > 30) && window.__paw.S.inv.food['Basic Kibble'] === 3, null, 15000), 'Feed all: both dogs fed, 2 kibble used');
  console.log('   feed all toast:', (await t.toasts()).filter((x) => /Feed all/.test(x))[0]);

  sec('walk with the active dog; the other stays home and greets');
  await t.calm(); await t.until(() => window.__paw.S.bowl == null, null, 8000); const pepHungerBefore = (await S()).dogs[1].stats.hunger;
  ok(await t.startWalk(true), 'walk started'); await SH('06_walk_one_dog');
  ok((await t.mode()) === 'walk' && (await S()).place === 'yard', 'walking the active dog (the place stays home)');
  await t.quitWalk(false); await t.toasts(); await p.click('#resOk');
  ok(await t.waitToast(/(sniffs|greets|checks)[\s\S]*Pepper|Pepper[\s\S]*(sniffs|greets|checks)/, 12000), 'Pepper greets the walker on return'); await t.untilMode('yard'); await t.lu();
  ok((await S()).dogs[1].stats.hunger <= pepHungerBefore, 'the home dog kept living (stats tick at home)');

  sec('coats incl. a merle');
  const merle = await ev(() => { const G = window.PawGenes; const ph = G.phenotype({ B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] }, 'corgi', 'x1'); const sv = window.PawArt.dog('corgi', { pose: 'idle', coat: ph.coat, seed: 12345 }); return { name: ph.coatName, merle: ph.coat.merle, svg: sv.length }; });
  ok(merle.merle && /merle/i.test(merle.name) && merle.svg > 500, 'merle phenotype renders: ' + merle.name);
  await ev(() => { const S = window.__paw.S; const d = S.dogs[1]; d.key = 'corgi'; d.genes = { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] }; window.__paw.go('yard'); });
  await p.click('[data-act=journal]'); await p.waitForSelector('[data-jt=profile]'); await p.click('[data-jt=profile]'); await p.waitForSelector(`[data-pdog="${pep.id}"]`); await p.click(`[data-pdog="${pep.id}"]`);
  ok(await t.until(() => /merle/i.test(document.querySelector('.profile').textContent), null, 6000), 'Profile switches to Pepper (merle)');
  const pf = await p.textContent('.profile'); ok(/merle/i.test(pf) && /Rescued on/.test(pf), 'Profile: dog selector, merle coat name, "Rescued on"');
  await SH('07_profile_merle_rescue'); await t.closeX(); await SH('08_pack_with_merle');

  sec('highest Bond unlocks; potty for every dog');
  await p.click(`#hudPack .dchip[data-dog="${pep.id}"]`); await t.until((id) => window.__paw.S.activeId === id, pep.id);
  await t.travel('river'); ok((await S()).place === 'river', 'unlocks use the highest Bond (Bond-1 dog active, Riverside opens)');
  ok((await p.locator('#pack [data-dog]').count()) === 1, 'every dog travelled to the river');
  await ev(() => { const S = window.__paw.S; S.messes.river = []; S.dogs.forEach((d) => { d.potty.poopDue = S.gameMin - 1; }); });
  ok(await t.until(() => { const m = window.__paw.S.messes.river || []; return m.length === 2 && new Set(m.map((x) => x.dog)).size === 2; }, null, 40000), 'both dogs pooped: 2 messes (cap 2 with 2 dogs)'); await SH('09_two_messes');

  sec('v1.7: 10 breeds at the shelter, adopt the new breeds as starters');
  await t.packPin(true); // pack dogs re-pick poses every tick from here on; pinned to one pose before the layout checks
  await ev(() => { const S = window.__paw.S; ['Royal Castle Kennel'].forEach((h) => { if (!S.inv.houses.includes(h)) S.inv.houses.push(h); }); S.house = 'Royal Castle Kennel'; S.coins = 9999; });
  await t.home('yard'); ok(await t.toShelter(), 'shelter opens (10 breeds)');
  const stK = await ev(() => [...document.querySelectorAll('.shcard.starter [data-shadopt]')].map((b) => b.dataset.shadopt.split('|')[1]));
  ok(stK.length === 9 && ['chihuahua', 'pug', 'greyhound', 'beagle'].every((k) => stK.includes(k)), 'shelter: 9 starter cards left (10 breeds, Mochi home): ' + stK.join(','));
  const labs = await ev(() => [...document.querySelectorAll('.shcard.starter .shdog svg.pa-dog')].map((x) => x.getAttribute('aria-label')));
  ok(['Chihuahua', 'Pug', 'Greyhound', 'Beagle'].every((br) => labs.some((l) => l.includes(br))), 'new starter cards draw their own breed');
  await SH('11_shelter_10_breeds'); await t.leaveShelter();
  const newKeys = ['chihuahua', 'pug']; // the castle fits 4: Mochi, Pepper + 2 new breeds
  for (let i = 0; i < newKeys.length; i++) {
    const k = newKeys[i]; ok(await t.toShelter(), 'shelter opens for ' + k);
    await p.click(`[data-shsex="${k}|female"]`); await p.click(`[data-shadopt="starter|${k}"]`); await p.click('#shOk');
    ok(await t.until((n) => window.__paw.S.dogs.length === n && window.__paw.mode === 'yard', 3 + i, 12000), 'adopted ' + k); await t.lu(); await t.calm();
  }
  s = await S(); ok(s.dogs.length === 4 && newKeys.every((k) => s.dogs.some((d) => d.key === k && !d.rescue)), 'adopted a Chihuahua and a Pug as starters (4 dogs)');
  const packLabs = await ev(() => [...document.querySelectorAll('#pack svg.pa-dog')].map((x) => x.getAttribute('aria-label')).join(' | '));
  ok(/Chihuahua/.test(packLabs) && /Pug/.test(packLabs), 'both new breeds drawn in the pack: ' + packLabs); await SH('12_pack_new_breeds');
  await t.packPin(false);
  await t.packCheck('yard', 'v15 4 dogs in the yard'); await SH('13_pack4_yard');
  await t.packCheck('house', 'v15 4 dogs in the house'); await SH('14_pack4_house');
  await ev(() => { window.__paw.S.place = 'yard'; window.__paw.go('yard'); });

  sec('old-save migration (v1.3 single-dog save)');
  const old = { v: 1, dog: { key: 'corgi', name: 'Biscuit', favFood: ['Basic Kibble'], favToy: 'Tennis Ball', sex: 'male', born: '2026-09-01' }, stats: { hunger: 44, happy: 55, energy: 66, clean: 77 }, bond: { level: 3, pts: 300 }, coins: 99, inv: { food: {}, toys: ['Tennis Ball'], clothes: [], houses: ['Cardboard Box'], charms: [] }, outfit: { head: null, eyes: null, neck: null, body: null, charm: null }, house: 'Cardboard Box', tricks: {}, gameMin: 600, lastReal: t.pageNow(), waterAt: -999, pupUntil: -1, daily: { day: 0 }, sleeping: false, collection: {}, adopted: true, found: {}, mapPieces: [], walks: 3, glowUntil: -1, secretDug: false, title: '', place: 'yard' };
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: JSON.stringify(old) } }); await p2.goto(require('./test_lib').URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  await t.untilMode('yard'); s = await S(); const d0 = s.dogs && s.dogs[0];
  ok(s.dogs && s.dogs.length === 1 && d0.name === 'Biscuit' && Math.abs(d0.stats.hunger - 44) < 2 && d0.bond.level === 3 && s.stats.hunger === d0.stats.hunger && s.coins === 99 && s.activeId === d0.id, 'old save migrated into S.dogs[0]: ' + JSON.stringify(d0 && { name: d0.name, hunger: d0.stats.hunger, bond: d0.bond, coins: s.coins }));
  await SH('10_migrated');
});
