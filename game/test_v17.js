// v1.7: four new breeds, ten in total (desktop 1280x720, harness.js merged). node game/test_v17.js  (or: node game/run_tests.js v17)
// Time + weather are pinned by test_lib; the snow check switches weather itself and then goes back to the pin (never to "auto").
const fs = require('fs'), path = require('path');
const ALL = [['shiba', 'Shiba Inu', 'Mochi'], ['corgi', 'Corgi', 'Biscuit'], ['golden', 'Golden Retriever', 'Sunny'], ['dachs', 'Dachshund', 'Noodle'], ['husky', 'Husky', 'Frost'], ['mutt', 'Shelter Mutt', 'Pepper'],
  ['chihuahua', 'Chihuahua', 'Peanut'], ['pug', 'Pug', 'Dumpling'], ['greyhound', 'Greyhound', 'Rocket'], ['beagle', 'Beagle', 'Bagel']];
const NEW = ['chihuahua', 'pug', 'greyhound', 'beagle'];
const SIGS = { chihuahua: 'The Tiny Tornado', pug: 'The Snort Spin', greyhound: 'The Zoomie Lap', beagle: 'The Big Bay' };
require('./test_lib').run('v17', async (t) => {
  const { ok, sec, ev, S, rnd, SH, sleep } = t;
  const tap = () => ev(() => { window.__pa = window.__pa || []; const A = window.PawAudio; if (A && A.bark && !A.bark.__wrapped) { const o = A.bark.bind(A); A.bark = (v, k, op) => { window.__pa.push({ v, k, op }); return o(v, k, op); }; A.bark.__wrapped = true; } });
  const mark = () => ev(() => window.__pa.length);
  const since = (n) => ev((n) => window.__pa.slice(n), n);
  const reset = () => ev(() => window.__paw.voice.reset());
  // wait until the bark log has been silent for `quiet` ms (barks answer each other with small delays; this waits for the chain to end instead of sleeping a guess)
  const quiet = async (q, max) => { q = q || 1500; const end = Date.now() + (max || 8000); let last = await ev(() => window.__pa.length), at = Date.now(); while (Date.now() < end) { await sleep(100); const l = await ev(() => window.__pa.length); if (l !== last) { last = l; at = Date.now(); } else if (Date.now() - at >= q) return true; } return false; };
  const yard = async () => { await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.calm(); };
  const activate = async (id) => { await ev((id) => { window.__paw.S.activeId = id; window.__paw.go('yard'); }, id); await t.until((id) => window.__paw.S.activeId === id && window.__paw.mode === 'yard' && !!document.querySelector('#dogArt svg'), id); await t.calm(); };
  const heading = () => t.p.textContent('.adopt-card h3');
  const headIs = (txt) => t.until((txt) => document.querySelector('.adopt-card h3').textContent.includes(txt), txt, 4000);

  sec('all starters in the adoption carousel (10 since v1.7, 14 since v2.5)');
  const p = await t.boot(); await tap(); await p.click('#tNew'); await p.waitForSelector('.heads button');
  const NB = await ev(() => window.PawGenes.BREEDS.length);
  ok(NB === 14 && await p.locator('.heads button').count() === NB, `${NB} heads in the adoption carousel`);
  for (const [k, br, nm] of ALL) {
    await p.click(`.heads button[aria-label="${nm} the ${br}"]`); await headIs(nm);
    const h3 = await heading(), lab = await p.getAttribute('#adoptDog svg.pa-dog', 'aria-label').catch(() => '');
    ok(h3.includes(nm) && h3.includes(br) && (lab || '').includes(br), `starter ${k}: ${nm} the ${br}, own art`);
  }
  await SH('01_adopt_greyhound_last'); await p.click('.heads button[aria-label="Rocket the Greyhound"]'); await headIs('Rocket'); await SH('01b_adopt_greyhound');
  const lastLab = await p.getAttribute('.heads button:last-child', 'aria-label'), lastNm = lastLab.split(' the ')[0];
  await p.click('.heads button:last-child'); await headIs(lastNm);
  await p.keyboard.press('ArrowRight'); ok(await headIs('Mochi'), `arrow keys wrap around all ${NB} (${lastLab} -> Shiba)`);
  await p.keyboard.press('ArrowLeft'); ok(await headIs(lastNm), `and back (Shiba -> ${lastLab})`);
  await p.click('.heads button[aria-label="Bagel the Beagle"]'); await headIs('Bagel');
  await p.click('#aBoy'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
  let s = await S(); ok(s.dog.key === 'beagle' && s.dog.name === 'Bagel' && s.dog.coat === 'Tricolour', 'adopted Bagel the Beagle (coat: ' + s.dog.coat + ')');
  ok(s.dog.favToy === 'Puzzle Feeder' && s.dog.favFood.includes('Basic Kibble'), 'beagle favourites');
  await ev(() => { const S = window.__paw.S; S.bond.level = 10; S.bond.pts = 5000; S.coins = 9000; S.inv.houses.push('Royal Castle Kennel'); S.house = 'Royal Castle Kennel'; S.stats.energy = 90; S.stats.happy = 90; S.stats.hunger = 90; S.stats.clean = 90; });

  sec('rescues drawn from every breed, with coats');
  const res = await ev(() => { const out = []; const d0 = new Date(2026, 0, 1); for (let i = 0; i < 400; i++) { const d = new Date(d0); d.setDate(d.getDate() + i); const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; window.__paw.rescuesOn(dk).forEach((r) => { const c = window.__paw.coat({ id: r.id, key: r.key, genes: r.genes }); out.push({ key: r.key, coat: c && c.coatName, merle: !!(c && c.coat && c.coat.merle) }); }); } return out; });
  const keys = new Set(res.map((r) => r.key)); ok(keys.size === NB, `rescue pool over 400 days covers all ${NB} breeds: ` + [...keys].join(','));
  for (const k of NEW) { const rs = res.filter((r) => r.key === k), coats = [...new Set(rs.map((r) => r.coat))]; ok(rs.length > 20 && rs.every((r) => r.coat) && coats.length >= 2, `${k} rescues have coats (${rs.length}): ${coats.join(', ')}`); }
  ok(!res.some((r) => ['pug', 'greyhound', 'beagle'].includes(r.key) && r.merle), 'no merle pugs, greyhounds or beagles');

  sec('a pack of all four new breeds');
  await t.packPin(true);
  const ids = await ev(() => ['chihuahua', 'pug', 'greyhound'].map((k) => window.__paw.addDog({ key: k, sex: 'female', months: 14 }, { chihuahua: 'Peanut', pug: 'Dumpling', greyhound: 'Rocket' }[k]).id));
  const beagleId = (await S()).dogs[0].id; const [chiId, pugId, greyId] = ids;
  await yard(); s = await S(); ok(s.dogs.length === 4, '4 dogs: beagle, chihuahua, pug, greyhound');
  await t.until(() => document.querySelectorAll('#pack svg.pa-dog').length === 3); await t.packPin(false);
  const packLabs = await ev(() => [...document.querySelectorAll('#pack svg.pa-dog')].map((x) => x.getAttribute('aria-label')).join(' | '));
  ok(['Chihuahua', 'Pug', 'Greyhound'].every((br) => packLabs.includes(br)), 'pack draws each new breed: ' + packLabs); await SH('02_new_pack');
  sec('pack layout: 4 dogs, never on the furniture');
  for (const pl of ['yard', 'house', 'square']) { await t.packCheck(pl, '4 dogs in the ' + pl); await SH('02b_pack4_' + pl); }
  await ev(() => { const S = window.__paw.S, g = S.dogs.find((d) => d.key === 'greyhound'); g.sleeping = true; S.place = 'yard'; window.__paw.go('yard'); });
  await t.until(() => document.querySelectorAll('#pack .packdog svg.pa-dog').length === 3); await t.freezeMotion(true); const napL = await t.settledLayout(); await t.freezeMotion(false);
  const gi = await ev(() => window.__paw.S.dogs.filter((d) => d.id !== window.__paw.S.activeId).findIndex((d) => d.key === 'greyhound'));
  ok(t.hitR(napL.pack[gi], [620, 330, 860, 530]), 'a napping secondary dog goes into the dog-house doorway (and only then)'); await SH('02c_pack_nap_doorway');
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.sleeping = false; }); S.place = 'yard'; window.__paw.idle.speed(1); }); await yard();

  const coats = await ev(() => window.__paw.S.dogs.map((d) => d.key + ':' + d.coat));
  ok(coats.join() === 'beagle:Tricolour,chihuahua:Fawn,pug:Fawn,greyhound:Blue with white markings', 'starter coats from genes: ' + coats.join(', '));

  sec('bark voices for the new breeds');
  let m = await mark(); await reset();
  for (const id of [chiId, pugId, greyId, beagleId]) await ev((id) => window.__paw.voice.bark(id, 'alert', { player: true }), id);
  let c = await since(m); const vb = (k) => c.find((x) => x.v.breed === k);
  ok(NEW.every((k) => vb(k) && vb(k).k === 'alert'), 'alert reaches PawAudio with each new breed key');
  ok(vb('chihuahua').v.size === 'small' && vb('pug').v.size === 'small' && vb('greyhound').v.size === 'large' && vb('beagle').v.size === 'medium', 'sizes: chihuahua/pug small, beagle medium, greyhound large');
  const sk = await ev((a) => a.map((id) => window.__paw.voice.speakKind(id)), [chiId, pugId, greyId, beagleId]);
  ok(sk.join() === 'alert,woof,talk,howl', 'Speak voices: chihuahua yap burst, pug woof, greyhound roo, beagle bay: ' + sk.join());
  ok(await ev(() => { try { ['Chihuahua', 'Pug', 'Greyhound', 'Beagle'].forEach((n) => window.PawAudio.bark({ breed: n, size: 'medium' }, 'woof', { volume: 0 })); return true; } catch (e) { return false; } }), 'PawAudio accepts the breed names');
  // greyhound roos along with a howl, but rarely joins a plain bark
  await quiet(); m = await mark(); await reset(); await rnd(0.5); await ev((id) => window.__paw.voice.bark(id, 'howl', { player: true }), beagleId);
  await t.until((m) => window.__pa.slice(m).some((x) => x.v.breed === 'greyhound' && x.k === 'howl'), m, 8000); await quiet();
  c = await since(m); ok(c.some((x) => x.v.breed === 'greyhound' && x.k === 'howl'), 'greyhound roos (howl) when the beagle bays');
  m = await mark(); await reset(); await ev((id) => window.__paw.voice.bark(id, 'woof', { player: true }), beagleId); await quiet(); // "nothing happens": wait for the answer window to close
  c = await since(m); ok(!c.some((x) => x.v.breed === 'greyhound'), 'greyhound stays quiet for a plain woof (rarely barks)'); await rnd(null);
  // chihuahua alerts on its own, cooldown still applies
  await quiet(); await activate(chiId); m = await mark(); await reset(); await rnd(0.01);
  for (let i = 0; i < 5; i++) await ev(() => window.__paw.voice.tick());
  c = await since(m); const chiAlerts = c.filter((x) => x.v.breed === 'chihuahua' && x.k === 'alert').length; await rnd(null);
  ok(chiAlerts === 1, `chihuahua alerts at things, but the 25 s cooldown holds (${chiAlerts} alert in 5 ticks)`);
  // pug snores more
  await quiet(); await ev((id) => { window.__paw.S.dogs.find((d) => d.id === id).sleeping = true; }, pugId); m = await mark(); await reset(); await rnd(0.3); await ev(() => window.__paw.voice.tick());
  c = await since(m); ok(c.some((x) => x.v.breed === 'pug' && x.k === 'snore'), 'pug snores (higher snore chance)'); await rnd(null);
  await ev((id) => { window.__paw.S.dogs.find((d) => d.id === id).sleeping = false; }, pugId);

  sec('greyhound: roaching nap');
  await activate(greyId); await ev(() => { window.__paw.S.stats.energy = 30; });
  await p.click('[data-act=care]'); await t.waitPop(true); await p.click('[data-care=sleep]');
  ok(await t.until(() => window.__paw.S.sleeping && /pa-pose-rollover/.test((document.querySelector('#dogArt svg.pa-dog') || { getAttribute: () => '' }).getAttribute('class') || ''), null, 10000), 'greyhound sleeps upside down (rollover pose while asleep)');
  ok(await t.waitToast(/roaching/), 'roaching toast'); await SH('03_greyhound_roaching');
  await p.click('#wakeBtn'); await t.until(() => !window.__paw.S.sleeping, null, 8000);
  const wG = await ev(() => window.__paw.idle.weights());
  ok(wG.down >= 7 && wG.zoomies >= 1.2, `greyhound idles: lies down a lot (down ${wG.down}), sudden zoomies (${wG.zoomies})`);
  const zs = await ev(() => window.__paw.idle.steps('zoomies')); ok(zs.length === 5 && zs[4].pose === 'down', 'greyhound zoomies end in a flop');
  const naps = await ev(() => window.__paw.idle.steps('nap')); ok(naps.some((x) => x.pose === 'sleep'), 'idle nap uses sleep (drawn as roaching)');

  sec('pug: sits by the bowl; beagle: constant sniffing; chihuahua: shivers indoors');
  await activate(pugId); const ps = await ev(() => window.__paw.idle.steps('sit')); ok(ps[0].move && ps[0].move[0] === -125 && ps[1].pose === 'sit', 'pug sits by the bowl');
  const wP = await ev(() => window.__paw.idle.weights()); ok(wP.sit >= 6, 'pug sits a lot (sit ' + wP.sit + ')');
  await activate(beagleId); await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await t.untilMode('yard');
  const wB = await ev(() => window.__paw.idle.weights()); ok(wB.sniff >= 3, 'beagle sniffs even indoors (sniff ' + wB.sniff + ')');
  await activate(chiId); await t.dev(async () => { await p.selectOption('#dvWeather', 'snow'); });
  await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await t.untilMode('yard');
  ok(await t.until(() => window.__paw.poseNow() === 'cold' && document.getElementById('dogFx').classList.contains('tk-shiver'), null, 8000), 'chihuahua shivers in the snow even indoors');
  await SH('04_chihuahua_shiver_indoors');
  await activate(pugId); await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await t.untilMode('yard');
  ok(await t.until(() => window.__paw.poseNow() !== 'cold', null, 4000), 'other breeds stay warm indoors');
  await t.dev(async () => { await p.selectOption('#dvWeather', 'cloudy'); }); await ev(() => { window.__paw.S.place = 'yard'; }); await yard();

  sec('signature tricks at Bond 10');
  for (const [k, id] of [['chihuahua', chiId], ['pug', pugId], ['greyhound', greyId], ['beagle', beagleId]]) {
    await activate(id); ok((await ev(() => window.__paw.sigName())) === SIGS[k], `${k}: ${SIGS[k]}`);
  }
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play=tricks]'); await p.waitForSelector('#trainPanel');
  ok(/The Big Bay/.test(await p.textContent('#trainPanel')) || (await p.locator('#trainPanel [data-tr="Signature"]').count()) === 1, 'training panel lists the signature trick'); await SH('05_training_beagle');
  await p.click('#trX'); await t.until(() => !window.__paw.train, null, 4000);

  sec('beagle: +25% Nose-o-meter range on walks');
  ok(await ev(() => window.__paw.noseMul()) === 1.25, 'beagle nose multiplier 1.25');
  await ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__t) { const o = W.start.bind(W); W.start = (h, op) => { window.__opts = op; return o(h, op); }; W.__t = true; } });
  await ev(() => window.__paw.go('walk', 'park')); await t.until(() => !!window.__opts, null, 12000);
  ok((await ev(() => window.__opts && window.__opts.abilities.noseMul)) === 1.25, 'walk gets abilities.noseMul = 1.25 for the beagle');
  ok(fs.readFileSync(path.join(__dirname, '..', 'mods', 'walkrun.js'), 'utf8').includes('ab.noseMul'), 'walkrun.js applies noseMul to the Nose-o-meter range');
  await t.walkGate(true); await SH('06_beagle_walk');
  await t.quitWalk(false);
  ok(await t.until(() => /Beagle nose/.test((document.getElementById('modal') || {}).textContent || ''), null, 8000), 'walk results: beagle line'); await SH('07_beagle_results');
  await p.click('#resOk'); await t.untilMode('yard'); await t.lu(); await t.calm();
  await activate(pugId); ok(await ev(() => window.__paw.noseMul()) === 1, 'other breeds: nose multiplier 1');

  sec('garden + kitchen perks for the new breeds');
  ok(await ev(() => { const G = window.PawGarden; return !!G && G.BUDDY.chihuahua === 'guard' && G.BUDDY.pug === 'tend' && G.BUDDY.greyhound === 'fetch' && G.BUDDY.beagle === 'inspect'; }), 'garden buddy perks for the 4 new breeds');
  ok(await ev(() => { const K = window.PawKitchen; return !!K && ['chihuahua', 'pug', 'greyhound', 'beagle'].every((k) => K.FAV[k] && K.RECIPES.some((r) => r.id === K.FAV[k])); }), 'kitchen favourites for the 4 new breeds');

  sec('an unknown breed key never breaks anything');
  const wid = await ev(() => window.__paw.addDog({ key: 'wolfhound', sex: 'male', months: 20 }, 'Mystery').id);
  await activate(wid);
  ok(await t.until(() => !!document.querySelector('#dogArt svg'), null, 5000), 'unknown breed draws (generic fallback)');
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await t.closeX(); await t.modalGone();
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play=tricks]'); await p.waitForSelector('#trainPanel'); ok(await ev(() => window.__paw.sigName()) === 'The Grand Finale', 'generic signature trick'); await p.click('#trX'); await t.until(() => !window.__paw.train, null, 4000);
  await p.click('[data-act=feed]'); await t.waitPop(true); await p.click('#trayX'); await t.waitPop(false);
  await ev(() => { window.__paw.voice.reset(); window.__paw.voice.tick(); window.__paw.idle.force('sit'); }); await t.until(() => window.__paw.idle.act === 'sit' || window.__paw.idle.act === null, null, 3000);
  ok(await t.toShelter() && await p.locator('.shcard').count() >= 2, 'shelter still opens'); await t.leaveShelter();
  await ev(() => window.__paw.saveNow());
  await p.reload(); await p.waitForSelector('#tContinue'); await p.click('#tContinue'); await t.untilMode('yard');
  ok((await t.mode()) === 'yard' && (await ev(() => window.__paw.S.dogs.length)) === 5, 'save with an unknown breed reloads');
  await SH('08_unknown_breed_reload');
});
