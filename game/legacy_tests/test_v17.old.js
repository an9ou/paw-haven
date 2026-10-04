// v1.7: four new breeds, ten in total (desktop 1280x720, harness.js merged). node test_v17.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const DIR = path.join(__dirname, 'shots_v17'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = []; const ok = (c, l) => { console.log(c ? '  ok  ' : '  FAIL', l); if (!c) fails.push(l); };
const sec = (t) => console.log('\n# ' + t);
const ALL = [['shiba', 'Shiba Inu', 'Mochi'], ['corgi', 'Corgi', 'Biscuit'], ['golden', 'Golden Retriever', 'Sunny'], ['dachs', 'Dachshund', 'Noodle'], ['husky', 'Husky', 'Frost'], ['mutt', 'Shelter Mutt', 'Pepper'],
  ['chihuahua', 'Chihuahua', 'Peanut'], ['pug', 'Pug', 'Dumpling'], ['greyhound', 'Greyhound', 'Rocket'], ['beagle', 'Beagle', 'Bagel']];
const NEW = ['chihuahua', 'pug', 'greyhound', 'beagle'];
const SIGS = { chihuahua: 'The Tiny Tornado', pug: 'The Snort Spin', greyhound: 'The Zoomie Lap', beagle: 'The Big Bay' };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); let p = await ctx.newPage(); const errors = [];
  const watch = (pg) => { pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); pg.on('pageerror', (e) => errors.push(e.message)); }; watch(p);
  const SH = (n) => p.screenshot({ path: path.join(DIR, n + '.png') });
  const ev = (f, a) => p.evaluate(f, a);
  const S = () => ev(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const lu = async () => { for (let i = 0; i < 6 && await p.locator('#luOk').count(); i++) { await p.click('#luOk'); await sleep(300); } };
  const calm = () => ev(() => window.__paw.S.dogs.forEach((d) => { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = window.__paw.S.gameMin + 9999; }));
  const tap = () => ev(() => { window.__pa = window.__pa || []; const A = window.PawAudio; if (A && A.bark && !A.bark.__wrapped) { const o = A.bark.bind(A); A.bark = (v, k, op) => { window.__pa.push({ v, k, op }); return o(v, k, op); }; A.bark.__wrapped = true; } });
  const mark = () => ev(() => window.__pa.length);
  const since = (n) => ev((n) => window.__pa.slice(n), n);
  const reset = () => ev(() => window.__paw.voice.reset());
  const rnd = (v) => ev((v) => { if (!window.__rnd0) window.__rnd0 = Math.random; Math.random = v == null ? window.__rnd0 : () => v; }, v);
  const dev = async (fn) => { await p.click('#devBtn'); await sleep(150); await fn(); if (await p.locator('#devPanel:not([hidden])').count()) await p.click('#dvX'); await sleep(300); await lu(); };
  const yard = async () => { await ev(() => window.__paw.go('yard')); await sleep(500); await calm(); };

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
  const activate = async (id) => { await ev((id) => { window.__paw.S.activeId = id; window.__paw.go('yard'); }, id); await sleep(600); await calm(); };

  sec('all 10 starters in the adoption carousel');
  await p.goto(URL); await sleep(700); await tap(); await p.click('#tNew'); await sleep(400);
  ok(await p.locator('.heads button').count() === 10, '10 heads in the adoption carousel');
  for (const [k, br, nm] of ALL) {
    await p.click(`.heads button[aria-label="${nm} the ${br}"]`); await sleep(220);
    const h3 = await p.textContent('.adopt-card h3'), lab = await p.getAttribute('#adoptDog svg.pa-dog', 'aria-label').catch(() => '');
    ok(h3.includes(nm) && h3.includes(br) && (lab || '').includes(br), `starter ${k}: ${nm} the ${br}, own art`);
  }
  await SH('01_adopt_greyhound_last'); await p.click('.heads button[aria-label="Rocket the Greyhound"]'); await sleep(250); await SH('01b_adopt_greyhound');
  await p.click('.heads button[aria-label="Bagel the Beagle"]'); await sleep(250);
  await p.keyboard.press('ArrowRight'); await sleep(250); ok((await p.textContent('.adopt-card h3')).includes('Mochi'), 'arrow keys wrap around all 10 (Beagle -> Shiba)');
  await p.keyboard.press('ArrowLeft'); await sleep(250); ok((await p.textContent('.adopt-card h3')).includes('Bagel'), 'and back (Shiba -> Beagle)');
  await p.click('#aBoy'); await sleep(120); await p.click('#aAdopt'); await sleep(300); await p.click('#nOk'); await sleep(300);
  for (let i = 0; i < 3; i++) { await p.click('#iNext'); await sleep(300); } await sleep(500); await calm();
  let s = await S(); ok(s.dog.key === 'beagle' && s.dog.name === 'Bagel' && s.dog.coat === 'Tricolour', 'adopted Bagel the Beagle (coat: ' + s.dog.coat + ')');
  ok(s.dog.favToy === 'Puzzle Feeder' && s.dog.favFood.includes('Basic Kibble'), 'beagle favourites');
  await ev(() => { const S = window.__paw.S; S.bond.level = 10; S.bond.pts = 5000; S.coins = 9000; S.inv.houses.push('Royal Castle Kennel'); S.house = 'Royal Castle Kennel'; S.stats.energy = 90; S.stats.happy = 90; S.stats.hunger = 90; S.stats.clean = 90; });

  sec('rescues drawn from all 10 breeds, with coats');
  const res = await ev(() => { const out = []; const d0 = new Date(2026, 0, 1); for (let i = 0; i < 400; i++) { const d = new Date(d0); d.setDate(d.getDate() + i); const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; window.__paw.rescuesOn(dk).forEach((r) => { const c = window.__paw.coat({ id: r.id, key: r.key, genes: r.genes }); out.push({ key: r.key, coat: c && c.coatName, merle: !!(c && c.coat && c.coat.merle) }); }); } return out; });
  const keys = new Set(res.map((r) => r.key)); ok(keys.size === 10, 'rescue pool over 400 days covers all 10 breeds: ' + [...keys].join(','));
  for (const k of NEW) { const rs = res.filter((r) => r.key === k), coats = [...new Set(rs.map((r) => r.coat))]; ok(rs.length > 20 && rs.every((r) => r.coat) && coats.length >= 2, `${k} rescues have coats (${rs.length}): ${coats.join(', ')}`); }
  ok(!res.some((r) => ['pug', 'greyhound', 'beagle'].includes(r.key) && r.merle), 'no merle pugs, greyhounds or beagles');

  sec('a pack of all four new breeds');
  const ids = await ev(() => ['chihuahua', 'pug', 'greyhound'].map((k) => window.__paw.addDog({ key: k, sex: 'female', months: 14 }, { chihuahua: 'Peanut', pug: 'Dumpling', greyhound: 'Rocket' }[k]).id));
  const beagleId = (await S()).dogs[0].id; const [chiId, pugId, greyId] = ids;
  await yard(); s = await S(); ok(s.dogs.length === 4, '4 dogs: beagle, chihuahua, pug, greyhound');
  const packLabs = await ev(() => [...document.querySelectorAll('#pack svg.pa-dog')].map((x) => x.getAttribute('aria-label')).join(' | '));
  ok(['Chihuahua', 'Pug', 'Greyhound'].every((br) => packLabs.includes(br)), 'pack draws each new breed: ' + packLabs); await SH('02_new_pack');
  sec('pack layout: 4 dogs, never on the furniture');
  await ev(() => window.__paw.idle.speed(200));
  for (const pl of ['yard', 'house', 'square']) { await packCheck(pl, '4 dogs in the ' + pl); await SH('02b_pack4_' + pl); }
  await ev(() => { const S = window.__paw.S, g = S.dogs.find((d) => d.key === 'greyhound'); g.sleeping = true; S.place = 'yard'; window.__paw.go('yard'); }); await sleep(800);
  const napL = await layout(); const gi = await ev(() => window.__paw.S.dogs.filter((d) => d.id !== window.__paw.S.activeId).findIndex((d) => d.key === 'greyhound'));
  ok(hitR(napL.pack[gi], [620, 330, 860, 530]), 'a napping secondary dog goes into the dog-house doorway (and only then)'); await SH('02c_pack_nap_doorway');
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.sleeping = false; }); S.place = 'yard'; window.__paw.idle.speed(1); }); await yard();

  const coats = await ev(() => window.__paw.S.dogs.map((d) => d.key + ':' + d.coat));
  ok(coats.join() === 'beagle:Tricolour,chihuahua:Fawn,pug:Fawn,greyhound:Blue with white markings', 'starter coats from genes: ' + coats.join(', '));

  sec('bark voices for the new breeds');
  await reset(); let m = await mark();
  for (const id of [chiId, pugId, greyId, beagleId]) await ev((id) => window.__paw.voice.bark(id, 'alert', { player: true }), id);
  let c = await since(m); const vb = (k) => c.find((x) => x.v.breed === k);
  ok(NEW.every((k) => vb(k) && vb(k).k === 'alert'), 'alert reaches PawAudio with each new breed key');
  ok(vb('chihuahua').v.size === 'small' && vb('pug').v.size === 'small' && vb('greyhound').v.size === 'large' && vb('beagle').v.size === 'medium', 'sizes: chihuahua/pug small, beagle medium, greyhound large');
  const sk = await ev((a) => a.map((id) => window.__paw.voice.speakKind(id)), [chiId, pugId, greyId, beagleId]);
  ok(sk.join() === 'alert,woof,talk,howl', 'Speak voices: chihuahua yap burst, pug woof, greyhound roo, beagle bay: ' + sk.join());
  ok(await ev(() => { try { ['Chihuahua', 'Pug', 'Greyhound', 'Beagle'].forEach((n) => window.PawAudio.bark({ breed: n, size: 'medium' }, 'woof', { volume: 0 })); return true; } catch (e) { return false; } }), 'PawAudio accepts the breed names');
  // greyhound roos along with a howl, but rarely joins a plain bark
  await reset(); await rnd(0.5); m = await mark(); await ev((id) => window.__paw.voice.bark(id, 'howl', { player: true }), beagleId); await sleep(1500);
  c = await since(m); ok(c.some((x) => x.v.breed === 'greyhound' && x.k === 'howl'), 'greyhound roos (howl) when the beagle bays');
  await reset(); m = await mark(); await ev((id) => window.__paw.voice.bark(id, 'woof', { player: true }), beagleId); await sleep(1500);
  c = await since(m); ok(!c.some((x) => x.v.breed === 'greyhound'), 'greyhound stays quiet for a plain woof (rarely barks)'); await rnd(null);
  // chihuahua alerts on its own, cooldown still applies
  await activate(chiId); await reset(); await rnd(0.01); m = await mark();
  for (let i = 0; i < 5; i++) await ev(() => window.__paw.voice.tick());
  c = await since(m); const chiAlerts = c.filter((x) => x.v.breed === 'chihuahua' && x.k === 'alert').length; await rnd(null);
  ok(chiAlerts === 1, `chihuahua alerts at things, but the 25 s cooldown holds (${chiAlerts} alert in 5 ticks)`);
  // pug snores more
  await ev((id) => { window.__paw.S.dogs.find((d) => d.id === id).sleeping = true; }, pugId); await reset(); await rnd(0.3); m = await mark(); await ev(() => window.__paw.voice.tick());
  c = await since(m); ok(c.some((x) => x.v.breed === 'pug' && x.k === 'snore'), 'pug snores (higher snore chance)'); await rnd(null);
  await ev((id) => { window.__paw.S.dogs.find((d) => d.id === id).sleeping = false; }, pugId);

  sec('greyhound: roaching nap');
  await activate(greyId); await ev(() => { window.__paw.S.dog.stats = window.__paw.S.dog.stats; window.__paw.S.stats.energy = 30; });
  await p.click('[data-act=care]'); await sleep(300); await p.click('[data-care=sleep]'); await sleep(1500);
  s = await S(); const roach = await ev(() => { const g = document.querySelector('#dogArt svg.pa-dog'); return g ? g.getAttribute('class') : ''; });
  ok(s.sleeping && /pa-pose-rollover/.test(roach), 'greyhound sleeps upside down (rollover pose while asleep): ' + roach);
  ok(/roaching/.test(await p.textContent('#toasts')), 'roaching toast'); await SH('03_greyhound_roaching');
  await p.click('#wakeBtn'); await sleep(1500);
  const wG = await ev(() => window.__paw.idle.weights());
  ok(wG.down >= 7 && wG.zoomies >= 1.2, `greyhound idles: lies down a lot (down ${wG.down}), sudden zoomies (${wG.zoomies})`);
  const zs = await ev(() => window.__paw.idle.steps('zoomies')); ok(zs.length === 5 && zs[4].pose === 'down', 'greyhound zoomies end in a flop');
  const naps = await ev(() => window.__paw.idle.steps('nap')); ok(naps.some((x) => x.pose === 'sleep'), 'idle nap uses sleep (drawn as roaching)');

  sec('pug: sits by the bowl; beagle: constant sniffing; chihuahua: shivers indoors');
  await activate(pugId); const ps = await ev(() => window.__paw.idle.steps('sit')); ok(ps[0].move && ps[0].move[0] === -125 && ps[1].pose === 'sit', 'pug sits by the bowl');
  const wP = await ev(() => window.__paw.idle.weights()); ok(wP.sit >= 6, 'pug sits a lot (sit ' + wP.sit + ')');
  await activate(beagleId); await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await sleep(500);
  const wB = await ev(() => window.__paw.idle.weights()); ok(wB.sniff >= 3, 'beagle sniffs even indoors (sniff ' + wB.sniff + ')');
  await activate(chiId); await dev(async () => { await p.selectOption('#dvWeather', 'snow'); });
  await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await sleep(700);
  ok((await ev(() => window.__paw.poseNow())) === 'cold' && await ev(() => document.getElementById('dogFx').classList.contains('tk-shiver')), 'chihuahua shivers in the snow even indoors');
  await SH('04_chihuahua_shiver_indoors');
  await activate(pugId); await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await sleep(500);
  ok((await ev(() => window.__paw.poseNow())) !== 'cold', 'other breeds stay warm indoors');
  await dev(async () => { await p.selectOption('#dvWeather', 'auto'); }); await ev(() => { window.__paw.S.place = 'yard'; }); await yard();

  sec('signature tricks at Bond 10');
  for (const [k, id] of [['chihuahua', chiId], ['pug', pugId], ['greyhound', greyId], ['beagle', beagleId]]) {
    await activate(id); ok((await ev(() => window.__paw.sigName())) === SIGS[k], `${k}: ${SIGS[k]}`);
  }
  await p.click('[data-act=play]'); await sleep(300); await p.click('[data-play=tricks]'); await sleep(500);
  ok(/The Big Bay/.test(await p.textContent('#trainPanel')) || (await p.locator('#trainPanel [data-tr="Signature"]').count()) === 1, 'training panel lists the signature trick'); await SH('05_training_beagle');
  await p.click('#trX'); await sleep(300);

  sec('beagle: +25% Nose-o-meter range on walks');
  ok(await ev(() => window.__paw.noseMul()) === 1.25, 'beagle nose multiplier 1.25');
  await ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__t) { const o = W.start.bind(W); W.start = (h, op) => { window.__opts = op; return o(h, op); }; W.__t = true; } });
  await ev(() => window.__paw.go('walk', 'park')); await sleep(1200);
  ok((await ev(() => window.__opts && window.__opts.abilities.noseMul)) === 1.25, 'walk gets abilities.noseMul = 1.25 for the beagle');
  ok(fs.readFileSync(path.join(__dirname, '..', 'mods', 'walkrun.js'), 'utf8').includes('ab.noseMul'), 'walkrun.js applies noseMul to the Nose-o-meter range');
  for (let i = 0; i < 10; i++) { const g = p.locator('button:has-text("Let\'s go")'); if (await g.count()) { await g.first().click(); break; } await sleep(300); } await sleep(2600);
  await SH('06_beagle_walk'); await p.keyboard.press('Escape'); await sleep(600); if (await p.locator('[data-home]').count()) await p.click('[data-home]');
  for (let i = 0; i < 20 && !(await p.locator('#resOk').count()); i++) await sleep(300);
  ok(/Beagle nose/.test(await p.textContent('#modal').catch(() => '')), 'walk results: beagle line'); await SH('07_beagle_results');
  if (await p.locator('#resOk').count()) await p.click('#resOk'); await sleep(800); await lu(); await calm();
  await activate(pugId); ok(await ev(() => window.__paw.noseMul()) === 1, 'other breeds: nose multiplier 1');

  sec('garden + kitchen perks for the new breeds');
  ok(await ev(() => { const G = window.PawGarden; return !!G && G.BUDDY.chihuahua === 'guard' && G.BUDDY.pug === 'tend' && G.BUDDY.greyhound === 'fetch' && G.BUDDY.beagle === 'inspect'; }), 'garden buddy perks for the 4 new breeds');
  ok(await ev(() => { const K = window.PawKitchen; return !!K && ['chihuahua', 'pug', 'greyhound', 'beagle'].every((k) => K.FAV[k] && K.RECIPES.some((r) => r.id === K.FAV[k])); }), 'kitchen favourites for the 4 new breeds');

  sec('an unknown breed key never breaks anything');
  const wid = await ev(() => window.__paw.addDog({ key: 'wolfhound', sex: 'male', months: 20 }, 'Mystery').id);
  await activate(wid); await sleep(400);
  ok(await ev(() => !!document.querySelector('#dogArt svg')), 'unknown breed draws (generic fallback)');
  await p.click('[data-act=journal]'); await sleep(400); await p.click('.panel .x'); await sleep(300);
  await p.click('[data-act=play]'); await sleep(300); await p.click('[data-play=tricks]'); await sleep(500); ok(await ev(() => window.__paw.sigName()) === 'The Grand Finale', 'generic signature trick'); await p.click('#trX'); await sleep(300);
  await p.click('[data-act=feed]'); await sleep(300); await p.click('#trayX'); await sleep(200);
  await ev(() => { window.__paw.voice.reset(); window.__paw.voice.tick(); window.__paw.idle.force('sit'); }); await sleep(800);
  await p.click('[data-act=map]'); await sleep(500); await ev(() => window.__paw.mapTo('shelter')); await sleep(100); await p.click('[data-area=shelter]'); await sleep(900);
  ok(await p.locator('.shcard').count() >= 2, 'shelter still opens'); await p.click('.panel .x'); await sleep(200); await p.keyboard.press('Escape'); await sleep(600);
  await ev(() => window.__paw.saveNow());
  const saved = await ev(() => localStorage.getItem('pawhaven_proto_v1'));
  p = await ctx.newPage(); watch(p); await p.goto(URL); await sleep(600); await p.click('#tContinue'); await sleep(1500);
  ok((await ev(() => window.__paw.mode)) === 'yard' && (await ev(() => window.__paw.S.dogs.length)) === 5, 'save with an unknown breed reloads');
  await SH('08_unknown_breed_reload'); void saved;

  console.log('\nERRORS:', errors.length ? errors.join('\n') : 'none');
  console.log(fails.length ? `FAILED ${fails.length}: ${fails.join(' | ')}` : 'ALL OK');
  await b.close();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
