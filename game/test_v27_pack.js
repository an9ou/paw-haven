// v2.7 PACK CARE lane test, V27.md section 6: with two or more dogs, Feed (meals, snacks, water), Pet, Bath and Nap act on every ticked dog present.
// The chip row, a bowl each showing the food, the bath queue, everyone tucked in on their own beds, Wake up wakes all, and the old single-dog path with packCare off.
// node game/run_tests.js v27_pack
require('./test_lib').run('v27_pack', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p, S = () => t.S();
  const ids = async () => (await S()).dogs.map((d) => d.id);
  const stat = async (k) => (await S()).dogs.map((d) => d.stats[k]);
  const idle = () => t.until(() => !window.__paw.shop.busy, null, 8000);
  const feedTray = async () => { await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await p().click('[data-act=feed]'); await t.waitPop(true); };
  const set = (k, v) => ev(([k, v]) => { window.__paw.S.dogs.forEach((d, i) => { d.stats[k] = Array.isArray(v) ? v[i] : v; d.sleeping = false; }); window.__paw.S.sleeping = false; }, [k, v]);

  sec('1. three dogs: the chip row in the Feed tray');
  await t.newGame({}, { coins: 2000 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); });
  await t.calm(); await t.home('yard');
  const [A, B, C] = await ids();
  ok(await ev(() => window.__paw.cr.on()) === true, 'pack care is on with three dogs (packCare: true)');
  ok(JSON.stringify(await ev(() => window.__paw.cr.present())) === JSON.stringify([A, B, C]), 'present: the active dog first, then the pack');
  await ev(() => { window.__paw.S.inv.food['Basic Kibble'] = 9; window.__paw.S.inv.food['Bone-shaped Biscuit'] = 5; });
  await set('hunger', 30); await feedTray();
  const chips = await ev(() => [...document.querySelectorAll('#dock .cr-chips .cr-chip')].map((b) => [b.dataset.crdog, b.getAttribute('aria-pressed'), !!b.querySelector('svg')]));
  ok(chips.length === 3 && chips.every((c) => c[1] === 'true' && c[2]) && chips[0][0] === A, 'three chips, each with a head and ticked: ' + JSON.stringify(chips));
  ok(await ev(() => document.querySelector('#dock .cr-chips').getAttribute('role') === 'group' && /Ticked dogs get fed/.test(document.querySelector('#dock .cr-cap').textContent)), 'the row is a labelled group with its caption');
  ok(await p().locator('#feedAll').count() === 1, 'the Feed all button stays in the tray');

  sec('2. a food tap feeds all three, one bowl each showing the food');
  const h0 = await stat('hunger');
  await p().click('[data-food="Basic Kibble"]');
  ok(await t.until(() => document.querySelectorAll('#fbPackBowls > svg').length === 2 && /Basic Kibble/.test(document.getElementById('bowlG').getAttribute('aria-label') || '') && getComputedStyle(document.getElementById('bowlG')).visibility !== 'hidden', null, 3000), 'the active dog\'s bowl and a bowl at each pack dog\'s paws');
  ok(await ev(() => { const e = window.PawArt.prop('bowl', {}).length; return [...document.querySelectorAll('#fbPackBowls > svg')].every((s) => s.outerHTML.length > e * 1.2); }), 'the pack bowls show the food (not empty bowls)');
  ok(await t.until(() => document.querySelectorAll('#pack .packdog svg.pa-pose-eat').length === 2, null, 3000), 'both pack dogs eat');
  ok(await t.waitToast(/crunch|side by side/), 'one toast for the pack');
  await idle();
  ok(await t.until(() => !document.getElementById('fbPackBowls'), null, 3000) && await ev(() => getComputedStyle(document.getElementById('bowlG')).visibility === 'hidden'), 'every bowl goes away after the meal');
  let st = await S(), h1 = st.dogs.map((d) => d.stats.hunger);
  ok(st.inv.food['Basic Kibble'] === 6, 'three portions used (9 -> ' + st.inv.food['Basic Kibble'] + ')');
  ok(h1.every((h, i) => h - h0[i] >= 20), 'each dog\'s Hunger rises: ' + JSON.stringify([h0, h1]));
  ok(st.dogs.every((d) => d.potty.poopDue != null), 'each dog digests its own meal (potty due)');

  sec('3. untick one and only two eat; the last ticked dog stays ticked');
  await feedTray();
  await p().click(`[data-crdog="${C}"]`);
  ok(await t.until((c) => document.querySelector(`[data-crdog="${c}"]`).getAttribute('aria-pressed') === 'false', C, 2000), 'a tap unticks Pip (the tray redraws)');
  st = await S(); ok(st.careOff[C] === true && JSON.stringify(await ev(() => window.__paw.cr.dogs())) === JSON.stringify([A, B]), 'S.careOff holds Pip, cr.dogs() is the other two');
  await set('hunger', 30); await feedTray();
  await p().click('[data-food="Basic Kibble"]'); await t.until(() => window.__paw.shop.busy, null, 2000); await idle();
  st = await S(); ok(st.inv.food['Basic Kibble'] === 4 && st.dogs[2].stats.hunger < 31 && st.dogs[0].stats.hunger > 45 && st.dogs[1].stats.hunger > 45, 'two portions used, Pip did not eat: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.hunger))));
  await feedTray(); await p().click(`[data-crdog="${B}"]`); await t.until((b) => document.querySelector(`[data-crdog="${b}"]`).getAttribute('aria-pressed') === 'false', B, 2000);
  await t.toasts(); await p().click(`[data-crdog="${A}"]`);
  ok(await t.waitToast(/Someone has to get the treat/), 'the last ticked dog cannot be unticked: "Someone has to get the treat."');
  ok(!(await S()).careOff[A] && await ev((a) => document.querySelector(`[data-crdog="${a}"]`).getAttribute('aria-pressed') === 'true', A), 'Mochi stays ticked');
  await p().click(`[data-crdog="${B}"]`); await p().click(`[data-crdog="${C}"]`);
  ok(await t.until(() => Object.keys(window.__paw.S.careOff).length === 0 && [...document.querySelectorAll('.cr-chip')].every((b) => b.getAttribute('aria-pressed') === 'true'), null, 2000), 'ticked again: everyone gets the care');

  sec('4. a full dog is skipped, a sleeping one too');
  await set('hunger', [30, 95, 30]); await feedTray();
  await t.toasts(); await p().click('[data-food="Basic Kibble"]'); await idle();
  st = await S(); ok(st.inv.food['Basic Kibble'] === 2, 'two portions for the two hungry dogs (4 -> ' + st.inv.food['Basic Kibble'] + ')');
  ok(await t.waitToast(/Bun is full/), 'the toast names the full dog');
  await set('hunger', 30); await ev((c) => { window.__paw.S.dogs.find((d) => d.id === c).sleeping = true; }, C); await feedTray();
  await t.toasts(); await p().click('[data-food="Bone-shaped Biscuit"]'); await idle();
  st = await S(); ok(st.inv.food['Bone-shaped Biscuit'] === 3, 'a snack for the two awake dogs (5 -> ' + st.inv.food['Bone-shaped Biscuit'] + ')');
  ok(await t.waitToast(/Pip is asleep/), 'the toast names the sleeping dog');

  sec('5. Fresh Water waters everyone, one refill');
  await set('hunger', 60); await t.calm(); await ev(() => { window.__paw.S.waterAt = -9999; }); await feedTray();
  await p().click('[data-food="Fresh Water"]');
  ok(await t.until(() => document.querySelectorAll('#fbPackBowls > svg').length === 2, null, 3000), 'a water bowl for each pack dog');
  ok(await t.waitToast(/lap it up/), 'one water toast for the pack');
  await idle(); st = await S();
  ok(st.waterAt === st.gameMin || Math.abs(st.waterAt - st.gameMin) < 5, 'S.waterAt set once');
  ok(st.dogs.every((d) => d.potty.peeDue != null), 'every dog drank (pee due for each)');
  await feedTray(); ok(await ev(() => document.querySelector('[data-food="Fresh Water"]').getAttribute('aria-disabled') === 'true'), 'the water bowl is refilling for the whole pack');

  sec('6. the Pupcake goes to the active dog only');
  await set('hunger', 40); await ev(() => { window.__paw.S.inv.food.Pupcake = 1; }); await feedTray(); await t.toasts();
  await p().click('[data-food="Pupcake"]'); await idle();
  ok(await t.waitToast(/one dog at a time/), 'a line says the Pupcake is for one dog');
  ok(await t.until(() => !document.getElementById('fbPackBowls'), null, 2000) && (await S()).inv.food.Pupcake === undefined, 'one Pupcake used, no pack bowls');

  sec('7. petting (v2.10 ROAM): a rub on the active dog pets that dog only, its Bond once a session');
  await t.home('yard'); await set('happy', 40);
  const b0 = (await S()).dogs.map((d) => d.bond.pts); await t.toasts();
  ok(await t.pet(() => window.__paw.S.dogs[0].bond.pts > 0 && window.__toasts.some((x) => /Bond\./.test(x))), 'rubbing the active dog');
  st = await S(); const b1 = st.dogs.map((d) => d.bond.pts);
  ok(st.dogs[0].stats.happy > 48 && st.dogs.slice(1).every((d) => Math.round(d.stats.happy) === 40), 'only the active dog\'s Happiness rose: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.happy))));
  ok(b1[0] > b0[0] && b1.slice(1).every((b, i) => b === b0[i + 1]), 'only the active dog got its Bond: ' + JSON.stringify([b0, b1]));
  ok(await t.waitToast(/pretends .* did not enjoy that/), 'one Bond toast for the dog');
  await ev(() => window.__paw.cr.petAll(12)); st = await S();
  ok(st.dogs.every((d, i) => d.bond.pts === b1[i]), 'the Bond comes once a session per dog');

  sec('7b. v2.10 ROAM: a tap or rub on a pack dog pets that dog only, where it stands, no switching');
  await t.home('yard'); await set('happy', 40); await t.toasts();
  const act0 = (await S()).activeId, pd = await ev(() => document.querySelector('#pack .packdog').dataset.dog);
  ok(/rub or tap to pet/.test(await ev(() => document.querySelector('#pack .packdog').getAttribute('aria-label'))), 'the pack dog\'s label says rub or tap to pet');
  for (let i = 0; i < 3; i++) { await p().click(`#pack [data-dog="${pd}"] .pd-wander > rect`, { force: true }); await p().waitForTimeout(150); }
  st = await S();
  ok(st.activeId === act0, 'the active dog stays the same');
  ok(st.dogs.every((d) => (d.id === pd ? d.stats.happy > 40 : Math.round(d.stats.happy) === 40)), 'only the dog touched was petted: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.happy))));
  ok(await t.until((id) => !!document.querySelector(`#pack [data-dog="${id}"] svg.pa-pose-pet, #pack [data-dog="${id}"] svg.pa-pose-happy`), pd, 2500), 'the pack dog shows the pet pose');
  await ev((id) => { window.__paw.S.careOff = { [id]: true }; }, pd); await set('happy', 40);
  await p().click(`#pack [data-dog="${pd}"] .pd-wander > rect`, { force: true });
  st = await S(); ok(!(st.careOff || {})[pd] && st.dogs.find((d) => d.id === pd).stats.happy > 40, 'an unticked dog touched is ticked back in and petted');

  sec('8. the bath queue: one dog at a time, the active dog restored');
  await t.home('yard'); await set('clean', [40, 96, 40]);
  await p().click('[data-act=care]'); await t.waitPop(true);
  ok(await p().locator('#dock .cr-chips .cr-chip').count() === 3, 'the chip row tops the Care tray');
  await t.toasts(); await p().click('[data-care="bath"]'); await t.untilMode('bath');
  ok(await t.waitToast(/Bun is already sparkling/), 'a dog at 95 Clean or more is skipped kindly');
  let q = await ev(() => window.__paw.cr.bathQueue);
  ok(q && JSON.stringify(q.q) === JSON.stringify([A, C]) && q.orig === A, 'the queue: Mochi, then Pip: ' + JSON.stringify(q));
  ok(/\(1 of 2\)/.test(await p().locator('#dock .tray-h h3').textContent()) && await p().locator('#crBathNext').count() === 1 && await p().locator('#bathQuit').count() === 1, 'title "(1 of 2)", Next dog and Done for now');
  const scrub = async () => { for (let i = 0; i < 24 && (await t.mode()) === 'bath' && !(await ev(() => window.__paw.S.stats.clean >= 100)); i++) await p().keyboard.press('Space'); };
  await scrub();
  ok(await t.until((c) => window.__paw.S.activeId === c && /\(2 of 2\)/.test(document.querySelector('#dock .tray-h h3').textContent), C, 6000), 'after the first bath: Pip in the tub, "(2 of 2)"');
  ok(await p().locator('#crBathNext').count() === 0, 'no Next dog on the last dog');
  await scrub(); await t.untilMode('yard', 6000);
  st = await S(); q = await ev(() => window.__paw.cr.bathQueue);
  ok(st.activeId === A && !q, 'the queue ends in the yard with Mochi active again');
  ok(st.dogs[0].stats.clean >= 99 && st.dogs[2].stats.clean >= 99, 'both dogs in the queue are sparkling');
  // leaving early keeps what was done
  await set('clean', 40); await p().click('[data-act=care]'); await t.waitPop(true); await p().click('[data-care="bath"]'); await t.untilMode('bath');
  await scrub(); await t.until((b) => window.__paw.S.activeId === b, B, 6000);
  await p().click('#crBathNext'); await t.until((c) => window.__paw.S.activeId === c, C, 4000);
  await p().click('#bathQuit'); await t.untilMode('yard');
  st = await S(); ok(st.activeId === A && st.dogs[0].stats.clean >= 99 && st.dogs[1].stats.clean < 60 && st.dogs[2].stats.clean < 60, 'Next dog skips, Done for now ends the queue and keeps Mochi\'s bath: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.clean))));

  sec('9. Nap in the house: everyone tucked in on their own beds, Wake up wakes all');
  await ev(() => { const S = window.__paw.S; S.beds.push('Knitted Nest', 'Plaid Pillow'); S.bedAt['Knitted Nest'] = [0, 436]; S.bedAt['Plaid Pillow'] = [60, 264]; });
  await t.home('house'); await set('energy', 50); await t.toasts();
  await p().click('[data-act=care]'); await t.waitPop(true); await p().click('[data-care="sleep"]');
  ok(await t.until(() => window.__paw.S.dogs.every((d) => d.sleeping), null, 3000), 'all three dogs nap');
  ok(await t.waitToast(/Mochi, Bun and Pip curl up on their beds/), 'the toast names the beds');
  const beds = await ev(() => window.__paw.S.dogs.map((d) => window.__paw.ho.bedFor(d.id)));
  ok(beds.every(Boolean) && new Set(beds).size === 3, 'each dog has its own bed: ' + JSON.stringify(beds));
  await t.freezeMotion(true);
  ok(await t.until(() => document.querySelectorAll('#pack .packdog svg.pa-pose-sleep, #pack .packdog svg.pa-pose-rollover').length === 2, null, 3000), 'the pack dogs are drawn asleep');
  const onBed = await ev(() => { const S = window.__paw.S; return S.dogs.filter((d) => d.id !== S.activeId).map((d) => { const b = window.__paw.ho.bedFor(d.id), g = document.querySelector(`#pack [data-dog="${d.id}"] svg`), bed = document.querySelector(`#hoRoomG [data-bed="${b}"]`); if (!g || !bed) return false; const r = g.getBoundingClientRect(), q = bed.getBoundingClientRect(), cx = (r.left + r.right) / 2; return cx > q.left && cx < q.right; }); });
  ok(onBed.every(Boolean), 'each pack dog lies on its own bed: ' + JSON.stringify(onBed));
  await t.freezeMotion(false);
  ok(/Bun and Pip nap too/.test(await p().locator('#dock .tray').textContent()), 'the nap tray says who else naps');
  await p().click('#wakeBtn');
  ok(await t.until(() => window.__paw.S.dogs.every((d) => !d.sleeping), null, 3000), 'Wake up wakes every napping dog');
  ok(await t.waitToast(/Mochi, Bun and Pip wake up/), 'one wake-up toast for the pack');

  sec('10. Nap with only pack dogs ticked; the dogs at the yard');
  await t.home('yard'); await set('energy', 50); await ev((a) => { window.__paw.S.careOff = { [a]: true }; }, A);
  await p().click('[data-act=care]'); await t.waitPop(true); await t.toasts(); await p().click('[data-care="sleep"]');
  ok(await t.until(() => { const S = window.__paw.S; return !S.sleeping && S.dogs.filter((d) => d.id !== S.activeId).every((d) => d.sleeping); }, null, 3000), 'Bun and Pip nap, Mochi (unticked) stays up');
  ok(await t.waitToast(/Bun and Pip pile into the/), 'the toast names them');
  await ev(() => { window.__paw.S.careOff = {}; window.__paw.S.dogs.forEach((d) => { d.sleeping = false; }); });

  sec('11. packCare off (the harness pin): the v2.6 single-dog care');
  await t.ctx.close(); await t.newGame({ packCare: false }, { coins: 2000 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.S.inv.food['Basic Kibble'] = 9; });
  await t.calm(); await t.home('yard'); await set('hunger', 30);
  ok(await ev(() => window.__paw.cr.on()) === false, 'cr.on() is false under the pin');
  await feedTray(); ok(await p().locator('.cr-chips').count() === 0, 'no chip row');
  ok(/Feed all \(3 dogs\)/.test(await p().locator('#feedAll').textContent()), 'Feed all (3 dogs) as in v2.6');
  await p().click('[data-food="Basic Kibble"]'); await idle();
  st = await S(); ok(st.inv.food['Basic Kibble'] === 8 && st.dogs[1].stats.hunger < 31 && st.dogs[2].stats.hunger < 31, 'a food tap feeds the active dog only');
  await feedTray(); await p().click('#feedAll');
  ok(await t.waitToast(/Feed all: 3 bowls/), 'Feed all feeds every dog ("Feed all:" toast)');
  await idle(); st = await S(); ok(st.inv.food['Basic Kibble'] === 5, 'three portions for Feed all');
  await p().click('[data-act=care]'); await t.waitPop(true); ok(await p().locator('.cr-chips').count() === 0, 'no chips in the Care tray');
  await p().click('[data-care="bath"]'); await t.untilMode('bath');
  ok(await ev(() => window.__paw.cr.bathQueue) === null && !/of \d/.test(await p().locator('#dock .tray-h h3').textContent()) && await p().locator('#crBathNext').count() === 0, 'the v2.6 bath: no queue');
}, { packCare: true });
