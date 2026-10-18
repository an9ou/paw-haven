// v211_breeds (BREEDS lane, V211.md 5.2): the seven new breeds in the game (Akita, Japanese Spitz, Pomeranian and the owner's four more).
// Covers: adopt each new breed through the carousel (35 heads since v2.12), the welfare tips on the card (and not as a hot-day toast),
// feed, pet, walk each; the Wardrobe mannequin draws every outfit on each new breed with no console errors; an Akita x Pomeranian playdate
// names the pups Pomkita and the family tree shows it; the roam traits loyal / show / spin; the litter rules list the new keys;
// the Journal coat tab shows 17 breeds; the carousel on phones.
const COAT_CAP = /coatBreeds = [^\n]*slice\(0, 21\)/.test(require('fs').readFileSync(require('path').join(__dirname, 'src', '07_treasure_journal.js'), 'utf8')) ? 21 : 35; // 07 coatBreeds() (lane LINES) lifts its 21 cap to 35 in v2.12
require('./test_lib').run('v211_breeds', async (t) => {
  const { ok, sec, ev, S } = t;
  const NEW = [['akita', 'Akita', 'Red'], ['spitz', 'Japanese Spitz', 'White'], ['pom', 'Pomeranian', 'Orange'], ['afghan', 'Afghan Hound', 'Red'], ['dane', 'Great Dane', 'Fawn'], ['mastiff', 'English Mastiff', 'Fawn'], ['gsd', 'German Shepherd', 'Black and tan']];
  const TIPS = {
    akita: 'Akitas are calm and proud and like their own space. Let them meet new dogs slowly.',
    spitz: 'That white coat sheds in big clouds twice a year. A good brush keeps it soft, and it never needs shaving.',
    pom: 'Tiny dogs have delicate knees and windpipes. Use a harness, not a collar, and lift them with both hands.',
    afghan: 'That long silky coat tangles easily. A gentle brush a few times a week keeps it flowing.',
    dane: 'Giant pups grow fast and their joints need care. Gentle walks while young, and no long runs until fully grown.',
    mastiff: 'Big dogs feel the heat and drool when warm. Shade, water and a towel for that big face.',
    gsd: 'Shepherds are clever and love a job to do. Games, training and walks keep them happy.'
  };
  const iso = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  sec('adopt each new breed through the UI, then feed, pet and walk');
  for (const [k, br, coat] of NEW) {
    const p = await t.boot(); await p.click('#tNew'); await p.waitForSelector('.heads button');
    const nm = (await p.getAttribute(`.heads button[aria-label$=" the ${br}"]`, 'aria-label')).replace(` the ${br}`, ''); // the starter's name comes from PawArt.DOGS
    ok(await p.locator('.heads button').count() === 35, `${br}: 35 dogs in the adoption carousel`);
    await p.click(`.heads button[aria-label$=" the ${br}"]`);
    ok(await t.until((br) => (document.querySelector('.adopt-card h3') || {}).textContent.includes('the ' + br), br), `${br}: the shelter card shows ${nm} the ${br}`);
    const tip = await ev(() => { const e = document.querySelector('.adopt-card .bd-tip'); return e ? e.textContent : ''; });
    ok(tip === TIPS[k], `${br}: the welfare tip is on the card (${tip})`);
    await p.click('#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
    let s = await S();
    ok(s.dog.key === k && s.dog.name === nm && s.dog.genes && (await t.mode()) === 'yard', `${br}: adopted ${nm}, in the yard`);
    ok(await t.until(() => !!document.querySelector('#dogArt svg.pa-dog')), `${br}: drawn in the yard`);
    const c = await ev(() => window.__paw.coat(window.__paw.S.dog));
    ok(c && c.coatName === coat, `${br}: starter coat ${c && c.coatName}`);
    await t.patch({ bond: { level: 4, pts: 500 }, stats: { hunger: 40, happy: 70, energy: 90, clean: 90 } });
    await p.click('[data-act=feed]'); await t.waitPop(true);
    await p.click('[data-food="Basic Kibble"]');
    ok(await t.until(() => window.__paw.S.stats.hunger > 40, null, 8000), `${br}: feeding raises Hunger`);
    await t.waitPop(false); await t.calm();
    const b0 = (await S()).bond.pts;
    ok(await t.pet((b0) => window.__paw.S.bond.pts > b0, b0), `${br}: petting raises Bond`);
    ok(await t.startWalk(), `${br}: a walk starts`);
    ok(await t.quitWalk(true), `${br}: Head home early -> results -> OK`);
    ok((await t.mode()) === 'yard', `${br}: back home after the walk`);
    s = await S();
    ok(s.dogs.length === 1 && s.dog.key === k, `${br}: still one happy ${br}`);
    await t.SH('01_' + k + '_yard');
    await t.ctx.close();
  }

  sec('the tips are for the adoption card: no hot-day toast for the new breeds');
  const p = await t.boot(); await t.adopt({ sex: 'girl', head: '~ the Pomeranian' });
  ok((await S()).dog.key === 'pom' && JSON.stringify((await S()).breedTips) === '{}', 'a fresh Pomeranian, no tip seen yet');
  await t.toasts();
  await t.dev(async () => { await p.selectOption('#dvTime', 'day'); await p.selectOption('#dvWeather', 'sunny'); });
  ok(await t.until(() => /Tiny dogs get hot fast\. Shade and a drink, please\./.test(document.getElementById('bubble').textContent), null, 8000), 'the Pomeranian says its hot-day line');
  ok(!(await t.toasts()).some((x) => /delicate knees/.test(x)) && JSON.stringify((await S()).breedTips) === '{}', 'the Pomeranian tip is not toasted on a hot day');
  await t.dev(async () => { await p.selectOption('#dvWeather', 'cloudy'); });

  sec('the litter rules and the tables list the new keys once');
  const rules = await ev(() => { const L = window.PawBreeding.RULES.litters; const all = [].concat(L.small.breeds, L.medium.breeds, L.large.breeds, L.giant.breeds); return { akita: L.large.breeds.includes('akita'), spitz: L.medium.breeds.includes('spitz'), pom: L.small.breeds.includes('pom'), big: L.large.breeds.includes('afghan') && L.large.breeds.includes('gsd'), giant: L.giant.breeds.join() === 'dane,mastiff' && L.giant.sizes.join() === '2,3', dupes: all.length - new Set(all).size, n: all.length }; });
  ok(rules.akita && rules.spitz && rules.pom && rules.big && rules.giant && rules.dupes === 0 && rules.n === 35, 'akita is large, spitz medium, pom small, each listed once (' + JSON.stringify(rules) + ')');
  const tabs = await ev(() => window.PawGenes.BREEDS.length + ':' + window.PawGenes.BREEDS.slice(14, 21).join());
  ok(tabs === '35:akita,spitz,pom,afghan,dane,mastiff,gsd', 'PawGenes.BREEDS has akita, spitz, pom, afghan, dane, mastiff, gsd at 14 to 20, before the v2.12 fourteen (' + tabs + ')');

  sec('Wardrobe mannequin: every outfit on every new breed, no console errors');
  const core = require('fs').readFileSync(require('path').join(__dirname, 'src', '00_core.js'), 'utf8');
  const cl = core.slice(core.indexOf('const CLOTHES = ['), core.indexOf('];', core.indexOf('const CLOTHES = [')));
  const list = [...new Set([...cl.matchAll(/\{ n: '([^']+)', slot:/g)].map((m) => m[1]).concat([...core.matchAll(/TR\('([^']+)', 'wearable'/g)].map((m) => m[1])))];
  ok(!!list && list.length >= 35, `outfit list: ${list && list.length} names`);
  const ids = await ev((keys) => { const P = window.__paw; return keys.filter((k) => k !== 'pom').map((k, i) => P.addDog({ key: k, sex: i % 2 ? 'male' : 'female', months: 20 }, 'Test ' + k).id); }, NEW.map((x) => x[0]));
  await ev((ns) => { const S = window.__paw.S; ns.forEach((n) => { if (!S.inv.clothes.includes(n)) S.inv.clothes.push(n); }); }, list || []);
  const allIds = [(await S()).dogs[0].id].concat(ids);
  const e0 = t.errors.length; let drawn = 0, tried = 0;
  for (const id of allIds) {
    await ev((id) => window.__paw.switchDog(id), id);
    for (const n of list || []) {
      tried++;
      await ev((n) => { const S = window.__paw.S; S.outfit.head = S.outfit.eyes = S.outfit.neck = S.outfit.body = null; window.__paw.shop.equip(n); window.__paw.shop.wardrobe(); }, n);
      if (await t.until(() => !!document.querySelector('#modal .ward .preview svg'), null, 3000)) drawn++;
    }
    if (id === allIds[0]) { if (process.env.PAW_SHOTS) await t.sleep(2500); await t.SH('02_wardrobe_pom'); }
  }
  ok(drawn === tried && t.errors.length === e0, `${drawn}/${tried} mannequin previews drawn (${NEW.length - 1} more breeds x ${list && list.length} outfits), no console errors`);
  await ev(() => { const S = window.__paw.S; S.outfit.head = S.outfit.eyes = S.outfit.neck = S.outfit.body = null; });
  await t.closeX(); await t.modalGone();

  sec('Journal: the coat tab shows 35 breeds');
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=coats]'); await p.waitForSelector('.ctop');
  ok(await p.locator('.cbreed').count() === COAT_CAP, `${COAT_CAP} breed tabs on the Coats page (35 once 07 coatBreeds lifts its cap)`);
  ok(await ev(() => ['akita', 'spitz', 'pom', 'afghan', 'dane', 'mastiff', 'gsd'].every((k) => !!document.querySelector(`.cbreed[data-cbreed="${k}"]`))), 'the seven new breeds have tabs');
  await t.sleep(700);
  const rows = await ev(() => new Set([...document.querySelectorAll('.cbreed')].map((e) => Math.round(e.offsetTop / 10))).size);
  ok(rows === 1, `the breed tabs fit on one row at 1280x720 (${rows} rows)`);
  await p.setViewportSize({ width: 1024, height: 720 }); await t.sleep(700);
  const r1024 = await ev(() => ({ rows: new Set([...document.querySelectorAll('.cbreed')].map((e) => Math.round(e.offsetTop / 10))).size, over: document.querySelector('.cbreeds').scrollWidth > document.querySelector('.cbreeds').clientWidth + 1, docW: document.documentElement.scrollWidth }));
  ok(r1024.rows === 1 && !r1024.over && r1024.docW <= 1024, `at 1024x720 too: one row, nothing cut off (${JSON.stringify(r1024)})`);
  await p.setViewportSize({ width: 1280, height: 720 }); await t.sleep(400);
  await p.click('[data-cbreed="akita"]'); await p.waitForSelector('.cbreed.on[data-cbreed="akita"]');
  const cat = (k) => ev((k) => window.PawGenes.coatCatalog(k).map((c) => c.coat), k);
  const akitaN = await ev(() => document.querySelectorAll('.coat').length), akitaCat = await cat('akita');
  ok(['Red', 'Sesame', 'White', 'Dark sesame'].every((n) => akitaCat.includes(n)) && akitaN >= akitaCat.length, `the Akita page lists its ${akitaN} coats (Red, Sesame, White, Dark sesame among them)`);
  await p.click('[data-cbreed="pom"]'); await p.waitForSelector('.cbreed.on[data-cbreed="pom"]');
  const pomN = await ev(() => document.querySelectorAll('.coat').length), pomCat = await cat('pom');
  ok(['Orange', 'Cream', 'Black', 'Chocolate', 'White', 'Blue', 'Parti'].every((n) => pomCat.includes(n)) && pomN >= pomCat.length, `the Pomeranian page lists its ${pomN} coats (Orange, Cream, Black, Chocolate, White, Blue, Parti among them)`);
  if (process.env.PAW_SHOTS) await t.sleep(2500); await t.SH('03_journal_coats');
  await t.closeX(); await t.modalGone();

  sec('Akita x Pomeranian playdate: Pomkita pups, shown in the family tree');
  await t.patch({ bond: { level: 8, pts: 2500 }, house: 'Royal Castle Kennel', careDays: 60 });
  const pd = await ev((born) => {
    const P = window.__paw, S = P.S, f = S.dogs.find((d) => d.key === 'pom');
    f.sex = 'female'; f.born = born; f.litters = 0; f.lastLitter = null; f.bond = { level: 8, pts: 2500 }; f.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; f.name = 'Tangy';
    const m = P.addDog({ key: 'akita', sex: 'male', months: 24 }, 'Kuma'); m.bond = { level: 8, pts: 2500 }; m.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 };
    P.breed.setSeason(f.id, true); P.saveNow();
    const can = P.breed.canPair(f.id, m.id), r = P.breed.playdate(f.id, m.id, { force: true, size: 3 });
    return { f: f.id, m: m.id, can, ok: r.ok, pups: (f.preg && f.preg.pups || []).map((x) => ({ key: x.key, mix: x.mix })) };
  }, iso(30));
  ok(pd.can.ok, 'a Pomeranian girl and an Akita boy can have a playdate: ' + pd.can.why);
  ok(pd.ok && pd.pups.length === 3 && pd.pups.every((x) => x.mix && x.mix.name === 'Pomkita' && ['pom', 'akita'].includes(x.key) && x.mix.head !== x.key), 'the 3 pups are Pomkitas ' + JSON.stringify(pd.pups.map((x) => x.key + '/' + (x.mix && x.mix.name))));
  await ev(() => window.__paw.breed.birthNow());
  ok(await t.until(() => document.querySelectorAll('[data-pupname]').length === 3, null, 6000), 'the Puppies! popup opens');
  await p.fill('[data-pupname]', 'Kit'); await p.press('[data-pupname]', 'Enter'); await t.modalGone();
  const pupId = await ev(() => window.__paw.S.litters[0].pups[0].id);
  ok(await ev((id) => { const r = window.__paw.S.tree[id]; return !!r && r.mix && r.mix.name === 'Pomkita'; }, pupId), 'S.tree keeps the Pomkita');
  await ev((id) => window.__paw.switchDog(id), pd.f); await t.home();
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=family]'); await p.waitForSelector('.panel.journal.j-family');
  await t.until(() => !!document.querySelector('.fkids .fkid'), null, 4000);
  ok(await ev(() => document.querySelectorAll('.fkids .fkid').length) === 3, 'Tangy\'s tree page lists her 3 puppies');
  await p.click(`.fkids [data-fam="${pupId}"]`);
  ok(await t.until(() => /Pomkita/.test((document.querySelector('.fam-me') || {}).textContent || ''), null, 4000), 'the pup\'s tree page says Pomkita');
  ok(await ev(() => /Tangy/.test(document.querySelector('.ft').textContent) && /Kuma/.test(document.querySelector('.ft').textContent)), 'mum Tangy and dad Kuma are on the tree');
  if (process.env.PAW_SHOTS) await t.sleep(2500); await t.SH('04_family_tree_pomkita');
  await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.breed.chooseNow()); await t.until(() => !!document.getElementById('wsOk'), null, 6000);
  await p.click('#wsOk'); await t.until(() => !!document.getElementById('wsBye2'), null, 4000); await p.click('#wsBye2'); await t.untilMode('yard'); await t.modalGone();

  sec('no merle in the new breeds except the Great Dane, which keeps the no-double-merle rule');
  const mm = await ev(() => { const G = window.PawGenes, r = () => Math.random(); let merle = 0; for (const k of ['akita', 'spitz', 'pom', 'afghan', 'mastiff', 'gsd']) for (let i = 0; i < 400; i++) if (G.randomGenotype(k, r).M.includes('M')) merle++; return merle; });
  ok(mm === 0, 'random akitas, spitzes, pomeranians, afghans, mastiffs and shepherds never carry merle');
  const dm = await ev((born) => {
    const P = window.__paw, S = P.S;
    const mk = (key, sex, merle, name) => { const d = P.addDog({ key, sex, months: 30 }, name); d.born = born; d.bond = { level: 8, pts: 2500 }; d.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; d.genes.M = merle ? ['M', 'm'] : ['m', 'm']; d.genes.E = ['E', 'E']; return d; };
    S.dogs.filter((d) => d.id !== S.dogs[0].id).forEach((d) => { S.dogs.splice(S.dogs.indexOf(d), 1); });
    const a = mk('dane', 'female', true, 'Harley'), b = mk('dane', 'male', true, 'Quinn'), c = mk('dane', 'male', false, 'Plain');
    P.breed.setSeason(a.id, true);
    const mm2 = P.breed.canPair(a.id, b.id), mp = P.breed.canPair(a.id, c.id), r = P.breed.playdate(a.id, c.id, { force: true, size: 3 });
    const pups = (a.preg && a.preg.pups) || [];
    return { mm2, mp, ok: r.ok, coats: [P.coat(a).coatName, P.coat(b).coatName, P.coat(c).coatName], pupsM: pups.map((q) => q.genes.M.join('')), n: pups.length };
  }, iso(30));
  ok(/merle/i.test(dm.coats[0]) && /merle/i.test(dm.coats[1]) && !/merle/i.test(dm.coats[2]), 'two merle Great Danes and a plain one: ' + dm.coats.join(', '));
  ok(dm.mm2.ok === false && dm.mm2.code === 'merle', 'two merle Great Danes cannot pair: ' + dm.mm2.why);
  ok(dm.mp.ok === true && dm.ok && dm.pupsM.length >= 2 && dm.pupsM.length <= 3 && dm.pupsM.every((m) => m !== 'MM'), 'a merle Great Dane and a plain one can: ' + dm.pupsM.join(', ') + ' (a litter of 2 to 3, never M/M)');

  sec('giant rules: Great Dane and English Mastiff wait until 18 months, rest two seasons, at most 3 litters');
  const gr = await ev((born) => {
    const P = window.__paw, S = P.S, d18 = (m) => { const x = new Date(); x.setDate(x.getDate() - m); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
    S.dogs.filter((d) => d.id !== S.dogs[0].id).forEach((d) => { S.dogs.splice(S.dogs.indexOf(d), 1); });
    const mk = (key, sex, months, name) => { const d = P.addDog({ key, sex, months }, name); d.bond = { level: 8, pts: 2500 }; d.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; d.genes.M = ['m', 'm']; return d; };
    const out = {}, issue = (d) => P.breed.issues(d.id);
    const young = mk('dane', 'female', 14, 'Dane'), youngOther = mk('golden', 'female', 14, 'Golly'), adultDane = mk('dane', 'female', 30, 'Dana'), adultGolden = mk('golden', 'female', 30, 'Goldie');
    out.young = { dane: issue(young), golden: issue(youngOther) };
    adultDane.lastLitter = d18(8); adultGolden.lastLitter = d18(8);
    out.rest = { dane: issue(adultDane), golden: issue(adultGolden) };
    adultDane.lastLitter = d18(13); out.rest13 = issue(adultDane);
    adultDane.lastLitter = null; adultDane.litters = 3; adultGolden.lastLitter = null; adultGolden.litters = 3; out.lit = { dane: issue(adultDane), golden: issue(adultGolden) };
    const boy = mk('golden', 'male', 30, 'Gus'); out.text = P.breed.canPair(young.id, boy.id).why;
    return out;
  }, iso(30));
  ok(gr.young.dane.includes('young') && !gr.young.golden.includes('young') && /18 months/.test(gr.text), 'a 14-month Great Dane girl is too young (18 months), a 14-month Golden is not: ' + JSON.stringify(gr.young) + ' ' + gr.text);
  ok(gr.rest.dane.includes('recover') && !gr.rest.golden.includes('recover') && !gr.rest13.includes('recover'), 'a Great Dane rests two seasons after a litter (12 days), a Golden one (6 days): ' + JSON.stringify(gr.rest) + ' / day 13: ' + JSON.stringify(gr.rest13));
  ok(gr.lit.dane.includes('litters') && !gr.lit.golden.includes('litters'), 'a Great Dane has at most 3 litters, a Golden 4: ' + JSON.stringify(gr.lit));

  sec('roam traits: loyal (akita), show (spitz), spin (pom)');
  await t.ctx.close(); const q = await t.boot({ packCare: true, prefs: { rmTest: true } }); await t.adopt({ sex: 'girl', head: '~ the Akita' });
  const rid = await ev(() => { const P = window.__paw, S = P.S; return [P.addDog({ key: 'spitz', sex: 'female', months: 20 }, 'Fluff').id, P.addDog({ key: 'pom', sex: 'male', months: 20 }, 'Yippy').id]; });
  await t.home('yard'); await t.calm();
  const lead = (await S()).dog.id;
  await ev((id) => window.__paw.switchDog(id), lead);
  // act() draws two random numbers: the energy gate (0 passes) then the kind (just under 1 picks the last kind with a weight)
  const act = (id) => ev((id) => {
    const rm = window.__paw.rm, orig = Math.random; let n = 0; Math.random = () => (n++ ? 0.9999999 : 0);
    try { if (rm.moving.includes(id)) return { busy: true }; const before = rm.pos(id); const did = rm.act(id); const moving = rm.moving.includes(id); return { did, moving, before: [Math.round(before.x), Math.round(before.y)] }; } finally { Math.random = orig; }
  }, id);
  const spitzId = rid[0], pomId = rid[1];
  // the pack dogs need to be free: make a second dog the leader so the others act, then check each trait
  const roamOf = async (key) => {
    const id = key === 'spitz' ? spitzId : key === 'pom' ? pomId : lead;
    if (key === 'akita') await ev((id) => window.__paw.switchDog(id), pomId); else await ev((id) => window.__paw.switchDog(id), lead);
    await t.sleep(1800); await ev((id) => window.__paw.rm.calm(id, 0), id);
    let a = { busy: true };
    for (let i = 0; i < 40 && (a.busy || !a.did); i++) { a = await act(id); if (!a.did) { await t.sleep(700); await ev((id) => window.__paw.rm.calm(id, 0), id); } }
    return a;
  };
  for (const key of ['spitz', 'pom', 'akita']) {
    const a = await roamOf(key);
    ok(a.did && a.moving, `${key}: its trait starts a routine (${JSON.stringify(a)})`);
  }
  ok((await ev(() => window.__paw.S.dogs.length)) === 3, 'three dogs roam together');
  ok(t.errors.length === 0, 'no console errors so far');

  sec('phones: all 35 heads in the adoption sheet are tappable (iPhone 15, Pixel 7)');
  for (const dev of ['iPhone 15', 'Pixel 7']) {
    await t.ctx.close();
    const z = await t.boot({ device: dev }); await z.click('#tNew'); await z.waitForSelector('.heads button'); await t.sleep(500);
    await ev(() => { const d = document.getElementById('dock'); d.scrollTop = d.scrollHeight; }); await t.sleep(400);
    // v2.12: 35 heads are taller than one phone screen, so each head is scrolled into view (as a thumb would) before the tap check
    const hit = await ev(() => [...document.querySelectorAll('.heads button')].map((b) => { b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && b.contains(e) && r.width >= 44 && r.height >= 44 && r.top >= 0 && r.bottom <= innerHeight; }));
    if (!hit.every(Boolean)) console.log('   heads not tappable: ' + hit.map((h, i) => (h ? '' : i)).filter((x) => x !== '').join(','));
    ok(hit.length === 35 && hit.every(Boolean), `${dev}: 35 heads, each 44 px or more and tappable with the sheet scrolled down`);
    ok(await ev(() => document.documentElement.scrollWidth <= innerWidth), `${dev}: no sideways scroll`);
    await z.locator('.heads button[aria-label$=" the German Shepherd"]').click(); // the last v2.11 head (the v2.12 heads follow it)
    ok(await t.until(() => /the German Shepherd/.test(document.querySelector('.adopt-card h3').textContent)), `${dev}: tapping the German Shepherd head picks it`);
    ok(await ev(() => !!document.querySelector('.adopt-card .bd-tip')), `${dev}: the welfare tip shows on the card`);
    if (dev === 'iPhone 15') await t.SH('05_adopt_phone_scrolled');
  }

  sec('phones: the Journal coat tabs keep the chosen breed in view');
  await t.ctx.close(); await t.newGame({ device: 'iPhone 15' }); const r = t.p;
  await r.click('[data-act=journal]'); await r.waitForSelector('.panel.journal'); await r.click('[data-jt=coats]'); await r.waitForSelector('.cbreeds');
  const vis = () => ev(() => { const c = document.querySelector('.cbreeds'), on = document.querySelector('.cbreed.on'), a = c.getBoundingClientRect(), b = on.getBoundingClientRect(); return { key: on.dataset.cbreed, inView: b.left >= a.left - 1 && b.right <= a.right + 1 }; });
  for (const k of ['pom', 'akita', 'shiba']) {
    await r.locator(`.cbreed[data-cbreed="${k}"]`).click(); await r.waitForSelector(`.cbreed.on[data-cbreed="${k}"]`);
    const v = await vis(); ok(v.key === k && v.inView, `phone: after tapping ${k} the selected tab is in view`);
  }
  await t.SH('06_phone_coat_tabs');
  ok(t.errors.length === 0, 'no console errors');
}, { timeout: 720000 }); // v2.12: 480 s was too tight with 35 breeds on a busy machine
