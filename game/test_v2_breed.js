// V2 BREED: canPair reasons, playdate -> pregnancy, birth popup + naming, nursery, Who stays (slotsFree), rehoming,
// Sparkle pity at 24, mix naming, NPC male playdate, NPC female letter + pick of the litter.  node game/run_tests.js game/test_v2_breed.js --jobs 1
require('./test_lib').run('v2_breed', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('crafted save: an adult girl + an adult boy, Bond 8, in season');
  await t.newGame({ sex: 'girl' }, { bond: { level: 8, pts: 2500 }, coins: 1000, house: 'Treehouse Den', careDays: 21, stats: { hunger: 90, happy: 90, energy: 90, clean: 90 } });
  const p = t.p;
  const ids = await ev(() => {
    const P = window.__paw, S = P.S, f = S.dog; const d = new Date(); d.setDate(d.getDate() - 20);
    const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    f.born = iso(d); f.litters = 0; f.lastLitter = null;
    const mk = f.key === 'corgi' ? 'husky' : 'corgi';
    const m = P.addDog({ key: mk, sex: 'male', months: 22 }, 'Duke'); m.bond = { level: 8, pts: 2500 }; m.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 };
    P.breed.setSeason(f.id, true); P.saveNow(); return { f: f.id, m: m.id, fk: f.key, mk };
  });
  ok(await t.until(() => !!(window.__paw.breed && window.__paw.breed.canPair)), '__paw.breed is exposed');
  ok(await ev(() => window.PawBreeding.RULES.enabled === true && window.PawBreeding.RULES.welfare.minBond === 6), 'BREEDING.RULES enabled with minBond 6');
  ok(await ev((i) => window.__paw.S.tree && !!window.__paw.S.tree[i.f] && !!window.__paw.S.tree[i.m] && window.__paw.S.tree[i.m].status === 'home', ids), 'S.tree backfilled for home dogs (dog:added)');

  sec('canPair reasons');
  const cp = (fn) => ev((a) => { const P = window.__paw, S = P.S, f = S.dogs.find((d) => d.id === a.i.f), m = S.dogs.find((d) => d.id === a.i.m); const undo = new Function('f', 'm', 'S', 'P', a.fn)(f, m, S, P); const r = P.breed.canPair(f.id, m.id); if (undo) undo(); return r; }, { i: ids, fn });
  let r = await cp('return null;'); ok(r.ok === true, 'a healthy, in-season pair can have a playdate: ' + r.why);
  r = await ev((i) => { const P = window.__paw; const g = P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Rosie'); const x = P.breed.canPair(i.f, g.id); P.S.dogs.splice(P.S.dogs.indexOf(g), 1); delete P.S.tree[g.id]; return x; }, ids);
  ok(r.code === 'sex' && /Best friends! Puppies need a boy and a girl/.test(r.why), 'same sex: ' + r.why);
  r = await cp('const b = m.born; const d = new Date(); d.setDate(d.getDate() - 7); m.born = d.toISOString().slice(0, 10); return () => { m.born = b; };'); ok(r.code === 'young' && /12 months/.test(r.why), 'too young: ' + r.why);
  r = await cp('const s = f.seasonSeed; P.breed.setSeason(f.id, false); return () => { f.seasonSeed = s; };'); ok(r.code === 'season' && /in season/i.test(r.why), 'out of season: ' + r.why);
  r = await cp('m.bond.level = 5; return () => { m.bond.level = 8; };'); ok(r.code === 'bond' && /Bond 6/.test(r.why), 'Bond < 6: ' + r.why);
  r = await cp('f.parents = { dam: "x_mum", sire: "x_dad1" }; m.parents = { dam: "x_mum", sire: "x_dad2" }; return () => { f.parents = null; m.parents = null; };'); ok(r.code === 'related' && /family/.test(r.why), 'half siblings are related: ' + r.why);
  r = await cp('const a = f.genes.M, b = m.genes.M; f.genes.M = ["M","m"]; m.genes.M = ["M","m"]; return () => { f.genes.M = a; m.genes.M = b; };'); ok(r.code === 'merle' && /merle/.test(r.why), 'merle x merle: ' + r.why);
  r = await cp('m.fixed = true; return () => { m.fixed = false; };'); ok(r.code === 'fixed' && /neutered/.test(r.why), 'fixed: ' + r.why);
  r = await cp('const d = new Date(); d.setDate(d.getDate() + 1); m.restUntil = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return () => { m.restUntil = null; };'); ok(r.code === 'rest' && /resting/.test(r.why), 'resting male: ' + r.why);
  r = await cp('f.stats.hunger = 30; return () => { f.stats.hunger = 90; };'); ok(r.code === 'meters', 'care meters < 50: ' + r.why);

  sec('playdate popup (UI) -> pregnancy');
  await ev(() => window.__paw.breed.openPlaydates());
  ok(await t.until(() => document.querySelectorAll('.pd-dog').length >= 2 && !!document.querySelector('.pd-verdict.ok') && !!document.getElementById('pdGo')), 'Playdates popup: both dogs with readiness and a Playdate! button');
  ok(await ev(() => [...document.querySelectorAll('.pd-st')].every((e) => /✓/.test(e.textContent))), 'both dogs show ✓ ready');
  await p.click('#pdGo');
  ok(await t.until(() => !!document.querySelector('.pd-scene.ph-bow, .pd-scene.ph-chase, .pd-scene.ph-rest'), null, 3000), 'the play-bow / chase scene plays');
  ok(await t.until(() => !!document.getElementById('pdResult'), null, 8000), 'the playdate result shows');
  const uiPups = await ev(() => +document.getElementById('pdResult').dataset.pups);
  await p.click('#pdOk'); await t.modalGone();
  let s = await S(); let fd = s.dogs.find((d) => d.id === ids.f);
  ok(uiPups > 0 ? !!fd.preg : !fd.preg, `UI playdate outcome is stored (${uiPups ? 'puppies on the way' : 'no puppies this time'})`);
  // the deterministic test path: a fresh 3-pup litter (force skips the season/today checks and guarantees puppies)
  r = await ev((i) => { const S = window.__paw.S, f = S.dogs.find((d) => d.id === i.f); f.preg = null; f.lastPlaydate = null; S.dogs.find((d) => d.id === i.m).restUntil = null; return window.__paw.breed.playdate(i.f, i.m, { force: true, size: 3 }); }, ids);
  s = await S(); fd = s.dogs.find((d) => d.id === ids.f); const md = s.dogs.find((d) => d.id === ids.m);
  ok(r.ok && fd.preg && fd.preg.pups.length === 3 && fd.preg.sire === ids.m, 'playdate -> dam.preg with 3 rolled pups');
  ok(md.restUntil && md.restUntil > fd.preg.since && fd.preg.due > fd.preg.since, 'the sire rests 2 days; due date set');
  ok((await ev((i) => window.__paw.breed.canPair(i.f, i.m), ids)).code === 'preg', 'no playdates while expecting');
  const pup0 = fd.preg.pups[0];
  ok(pup0.mix && pup0.mix.a === ids.fk && pup0.mix.b === ids.mk && [ids.fk, ids.mk].includes(pup0.key) && pup0.mix.head !== pup0.key && !!pup0.mix.name, `mix naming: ${pup0.mix && pup0.mix.name} (body ${pup0.key}, head ${pup0.mix && pup0.mix.head})`);
  ok(fd.preg.pups.every((x) => ['male', 'female'].includes(x.sex) && x.genes && x.genes.B.length === 2 && x.coat && x.parents.dam === ids.f), 'each pup has sex, genes, coat and parents');
  const again = await ev((i) => JSON.stringify(window.__paw.S.dogs.find((d) => d.id === i.f).preg.pups.map((x) => x.genes)), ids);
  ok(again === JSON.stringify(fd.preg.pups.map((x) => x.genes)), 'litter roll is deterministic (stored at the playdate)');

  sec('tickDays(2) -> Puppies! popup + naming');
  await t.freezeMotion(true); // lighter on a shared CPU (and stable screenshots)
  await ev(() => { window.__paw.breed.tickDays(2); window.__paw.breed.tick(); });
  ok(await t.until(() => !!document.querySelector('.lt-birth') && document.querySelectorAll('[data-pupname]').length === 3, null, 6000), 'the Puppies! popup opens in the yard with 3 name boxes');
  ok(await ev(() => document.querySelectorAll('.lt-card .lt-sx').length === 3 && /eyes/.test(document.querySelector('.lt-card').textContent)), 'each pup card shows sex, coat and eyes');
  await t.SH('birth');
  await p.fill('[data-pupname]', 'Pip-Squeak'); await p.press('[data-pupname]', 'Enter'); await t.modalGone();
  s = await S(); fd = s.dogs.find((d) => d.id === ids.f);
  const L = s.litters[0];
  ok(L && L.pups.length === 3 && L.named && L.pups[0].name === 'Pip-Squeak' && L.mum === ids.f, 'Enter confirms: litter in S.litters, first pup named Pip-Squeak');
  ok(!fd.preg && fd.litters === 1 && fd.lastLitter === L.born && s.pupsBorn === 3, 'dam.litters++, lastLitter, preg cleared, pupsBorn 3');
  ok(L.pups.every((x) => s.tree[x.id] && s.tree[x.id].status === 'litter') && L.pups.every((x) => !!s.coatBook[x.key + '|' + x.coat]), 'S.tree has the pups (litter) and the coat book grew');
  ok((await ev((i) => window.__paw.breed.canPair(i.f, i.m), ids)).code === 'nursing', 'a nursing mum has no playdates');

  sec('nursery basket + popup');
  ok(await t.until(() => !!document.querySelector('#nurseryG')), 'the nursery basket is in the yard');
  const lay = await ev(() => { const a = document.querySelector('#nurseryG rect').getBoundingClientRect(), b = document.getElementById('dogHit').getBoundingClientRect(); const hit = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); const pk = document.getElementById('pack'); return { hit, behind: !!(document.getElementById('nurseryG').compareDocumentPosition(pk) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
  ok(!lay.hit && lay.behind, 'the basket does not cover the dog and sits behind the pack');
  await t.SH('nursery_yard');
  await p.click('#nurseryG rect', { force: true });
  ok(await t.until(() => !!document.querySelector('.ns-wrap')), 'clicking the basket opens the Nursery popup');
  ok(/Ready for new homes in 2 days/.test(await p.textContent('#nsCount')), 'countdown: Ready for new homes in 2 days');
  const h0 = (await S()).dogs.find((d) => d.id === ids.f).stats.happy;
  await ev((i) => { window.__paw.S.dogs.find((d) => d.id === i.f).stats.happy = 50; }, ids);
  await p.click('#nsPet'); ok(await t.until((i) => window.__paw.S.dogs.find((d) => d.id === i.f).stats.happy > 50, ids), 'Pet softly gives mum Happiness');
  await p.click('#nsPet'); await p.click('#nsPet');
  ok(await p.getAttribute('#nsPet', 'aria-disabled') === 'true', 'after 3 pets the button is disabled');
  await p.click('#nsPet', { force: true });
  ok(await ev(() => window.__paw.S.litters[0].pets.n === 3), 'Pet softly is capped at 3 a day');
  await t.SH('nursery');
  await ev((v) => { window.__paw.S.dog.stats.happy = v; }, h0);
  await t.closeX(); await t.modalGone();

  sec('tickDays(2) -> Who stays? (slotsFree respected) + rehoming');
  const free = await ev(() => window.__paw.breed.free());
  ok(free === 1, 'free spots: 1 (Treehouse Den, 2 dogs at home)');
  await ev(() => { window.__paw.breed.tickDays(2); window.__paw.breed.tick(); });
  ok(await t.until(() => document.querySelectorAll('.lt-card.ws').length === 3, null, 6000), 'the Who stays? popup opens with 3 pup cards');
  ok(/Free spots: 1/.test(await p.textContent('#wsFree')), 'it shows Free spots: 1');
  await p.click('[data-ws$="|stay"]');
  ok(await t.until(() => /Free spots: 0/.test(document.getElementById('wsFree').textContent)), 'Stay on one pup -> Free spots: 0');
  await t.toasts(); await p.locator('.lt-card.ws.home [data-ws$="|stay"]').first().click();
  ok(await t.waitToast(/free dog spot/), 'a second Stay is refused kindly (no free spot)');
  ok(await ev(() => document.querySelectorAll('.lt-card.ws.stay').length === 1), 'still only 1 pup marked Stay');
  await t.SH('whostays');
  await p.click('#wsOk');
  ok(await t.until(() => !!document.getElementById('wsBye')), 'goodbye card shows');
  ok(/trots off with/.test(await p.textContent('#wsBye')), 'goodbye line: "... trots off with <family>"');
  await p.click('#wsBye2'); await t.untilMode('yard');
  s = await S();
  const kept = s.dogs.find((d) => d.id === L.pups[0].id);
  ok(s.dogs.length === 3 && kept && kept.name === 'Pip-Squeak', 'Pip-Squeak stays (3 dogs now)');
  ok(kept && kept.parents && kept.parents.dam === ids.f && kept.parents.sire === ids.m && kept.gen === 1 && kept.bond.level === 1 && kept.mix && kept.sparkle === false, 'kept pup: parents, gen 1, Bond 1, mix, sparkle');
  ok(s.rehomed.length === 2 && s.rehomed.every((x) => x.family && x.family.name && x.since && x.genes) && s.rehomed.every((x) => s.tree[x.id].status === 'rehomed'), 'two pups rehomed: S.rehomed + S.tree status rehomed, with families');
  ok(s.litters.length === 0 && !(await p.locator('#nurseryG').count()), 'the nursery is empty and the basket is gone');
  ok((await ev((k) => window.__paw.breed.issues(k), kept.id)).includes('young'), 'the kept pup is too young to pair');
  ok((await ev((a) => window.__paw.breed.canPair(a.k, a.f), { k: kept.id, f: ids.f })).code !== 'ok' && await ev((a) => window.__paw.breed.related(a.k, a.f), { k: kept.id, f: ids.f }), 'mum and her pup are related');

  sec('NPC male playdate + Sparkle pity at the 24th puppy');
  await ev(() => { window.__paw.breed.tickDays(6); });
  r = await ev((i) => { const S = window.__paw.S; S.pupsSinceSparkle = 23; window.__paw.breed.setSeason(i.f, true); return window.__paw.breed.npcPlaydate(i.f, { id: 'npc_rex', name: 'Rex', key: i.fk, sex: 'male', born: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(), genes: JSON.parse(JSON.stringify(S.dogs.find((d) => d.id === i.f).genes)), owner: 'the Tanakas' }, { force: true, size: 2 }); }, ids);
  s = await S(); fd = s.dogs.find((d) => d.id === ids.f);
  ok(r.ok && fd.preg && fd.preg.sire === 'npc_rex' && s.tree.npc_rex && s.tree.npc_rex.status === 'npc', 'your girl x an NPC boy: the litter is yours, the NPC is in S.tree');
  ok(fd.preg.pups[0].sparkle === true, 'pity: with 23 pups since the last Sparkle, the 24th is Sparkle');
  ok(fd.preg.pups.every((x) => !x.mix && x.key === ids.fk), 'same breed -> purebred pups (no mix)');
  await ev(() => window.__paw.breed.birthNow());
  ok(await t.until(() => !!document.querySelector('.lt-birth .lt-spark') && !!document.querySelector('.lt-sparkline')), 'the birth popup reveals the Sparkle pup');
  await t.SH('birth_sparkle');
  await p.click('#ltOk'); await t.modalGone();
  s = await S();
  ok(s.sparkleBook[ids.fk] && s.pupsSinceSparkle <= 1 && s.pupsBorn === 5, 'sparkleBook updated, pity counter reset');
  await ev(() => window.__paw.breed.chooseNow());
  ok(await t.until(() => document.querySelectorAll('.lt-card.ws').length === 2, null, 6000), 'Who stays? again');
  ok(/Free spots: 0/.test(await p.textContent('#wsFree')), 'Free spots: 0 with a full house');
  await p.click('#wsOk'); await t.until(() => !!document.getElementById('wsBye2')); await p.click('#wsBye2'); await t.untilMode('yard');
  s = await S(); ok(s.dogs.length === 3 && s.rehomed.length === 4, 'with no free spot every pup gets a loving home');

  sec('NPC female playdate -> litter letter -> pick of the litter');
  await t.patch({ house: 'Royal Castle Kennel', careDays: 60 });
  await ev(() => window.__paw.S.dogs.forEach((d) => { d.bond = { level: 10, pts: 3300 }; }));
  ok(await ev(() => window.__paw.breed.free()) === 1, 'free spots: 1 (Castle, 3 dogs)');
  r = await ev((i) => { const S = window.__paw.S; S.dogs.find((d) => d.id === i.m).restUntil = null; return window.__paw.breed.npcPlaydate(i.m, { id: 'npc_daisy', name: 'Daisy', key: 'beagle', sex: 'female', born: (() => { const d = new Date(); d.setDate(d.getDate() - 26); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(), genes: { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, owner: 'the Morenos' }, { force: true, size: 3 }); }, ids);
  s = await S();
  ok(r.ok && s.npcLitters.length === 1 && s.npcLitters[0].pups.length === 3 && !s.npcLitters[0].offered, 'your boy x an NPC girl: S.npcLitters holds her litter');
  ok(s.dogs.find((d) => d.id === ids.m).restUntil, 'your boy rests');
  await t.toasts();
  await ev(() => { window.__paw.breed.tickDays(4); window.__paw.breed.tick(); });
  s = await S();
  ok(s.npcLitters[0].offered && s.npcLitters[0].pups.every((x) => s.tree[x.id] && s.tree[x.id].status === 'npc'), 'after 4 days the letter is sent and the pups are in S.tree');
  if (Array.isArray(s.mail) && s.mail.some((m) => m.kind === 'litter')) {
    const mid = s.mail.find((m) => m.kind === 'litter').id; ok(true, 'litter letter is in the mailbox');
    await ev((id) => window.__paw.breed.adoptPick(id), mid);
  } else {
    ok(await t.until(() => !!document.getElementById('ltPick'), null, 6000), 'no mailbox lane: the letter shows as a popup with "Adopt a pup"');
    await p.click('#ltPick');
  }
  ok(await t.until(() => document.querySelectorAll('[data-pick]').length === 3), 'pick of the litter: 3 pups to choose from');
  await p.click('[data-pick]');
  await t.untilMode('yard'); await t.modalGone();
  s = await S();
  const picked = s.dogs.find((d) => d.parents && d.parents.dam === 'npc_daisy');
  ok(s.dogs.length === 4 && picked && picked.parents.sire === ids.m && picked.mix && s.npcLitters[0].picked === picked.id, `picked ${picked && picked.name} (${picked && picked.mix && picked.mix.name}) comes home`);
  ok((await ev(() => window.__paw.breed.adoptPick(window.__paw.S.npcLitters[0].id))) === false, 'only one pick per litter');
});
