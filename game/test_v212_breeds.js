// v212_breeds (GENES lane, V212.md 2, 3 and 6): the fourteen new breeds in the game.
// Covers: adopt each new breed through the carousel (35 heads), feed, pet, walk each, the starter coat and no merle;
// the care note on the adoption card (V212.md 3 BD_TIPS, a LINES table: until it lands only bdTip itself is checked);
// the coat catalogue names (PawGenes and the Journal page); a Labrador x Standard Poodle playdate makes Labradoodle pups (and the
// Miniature Poodle makes Mini Labradoodles); no merle in any new breed (random rescues, the shelter, a playdate);
// the litter rules list the new keys once; the Journal coat tab lists 35 breeds (07 coatBreeds is a LINES file: until its cap is
// lifted the tab shows the first 21 and this suite says so).
const fs = require('fs'), path = require('path');
require('./test_lib').run('v212_breeds', async (t) => {
  const { ok, sec, ev, S } = t;
  const NEW = [['dobie', 'Doberman', 'Black and rust'], ['corso', 'Cane Corso', 'Black'], ['pitbull', 'Pit Bull', 'Blue'], ['minpin', 'Miniature Pinscher', 'Red'],
    ['lab', 'Labrador Retriever', 'Yellow'], ['malamute', 'Alaskan Malamute', 'Grey and white'], ['chow', 'Chow Chow', 'Red'], ['stdpoodle', 'Standard Poodle', 'Black'],
    ['schnauzer', 'Miniature Schnauzer', 'Salt and pepper'], ['westie', 'West Highland White Terrier', 'White'], ['yorkie', 'Yorkshire Terrier', 'Blue and tan'],
    ['bichon', 'Bichon Frise', 'White'], ['maltese', 'Maltese', 'White'], ['shihtzu', 'Shih Tzu', 'Gold and white']];
  const KEYS = NEW.map((x) => x[0]);
  const TIPS = {
    dobie: 'Dobermans have short coats and feel the cold. A warm coat on chilly walks and lots of cuddles at home keep them happy.',
    corso: 'Cane Corsos are big, gentle guardians who love their family. Calm, kind training and early friends keep them relaxed.',
    pitbull: 'Pit Bulls are cuddly, people-loving goofballs with lots of energy. Play, walks and gentle training keep them wiggly and happy.',
    minpin: 'Min Pins are tiny and fast and fit through small gaps. A good fence and a snug coat in the cold keep them safe.',
    lab: 'Labs love food a little too much. Measure the meals, go easy on treats and keep them moving.',
    malamute: 'Malamutes wear a thick winter coat all year. Shade and water on warm days, and a good brush when the fluff comes out.',
    chow: 'That thick lion coat gets hot and tangly. Brush it often, and keep summer days cool with shade and water.',
    stdpoodle: 'Poodle curls keep growing and never shed. A brush and a regular trim keep them comfy, and a big poodle loves a long walk.',
    schnauzer: 'That wiry beard and those eyebrows need a trim now and then. A quick wipe after meals keeps the beard tidy.',
    westie: 'Westies can have sensitive skin. A gentle shampoo, a good brush and not too many baths keep it calm.',
    yorkie: 'Yorkie hair grows long and needs a gentle brush most days. Tiny dogs need a harness and soft hands too.',
    bichon: 'That cotton-ball coat keeps growing and tangles. A brush every few days and a trim now and then keep it fluffy.',
    maltese: 'That long silky white coat needs a daily brush. A little topknot keeps the hair out of the eyes.',
    shihtzu: 'Shih Tzus have long hair and short noses. A daily brush, a topknot for the eyes and shade on warm days help a lot.'
  };
  // the coat names V212.md 3 asks for in each catalogue
  const COATS = {
    dobie: ['Black and rust', 'Red and rust', 'Blue and rust', 'Fawn and rust'], corso: ['Black', 'Grey', 'Fawn', 'Red', 'Black brindle', 'Grey brindle'],
    pitbull: ['Blue', 'Black', 'Fawn', 'Red', 'Brindle', 'White', 'Pied', 'Blue fawn'], minpin: ['Red', 'Black and rust', 'Chocolate and rust'], lab: ['Yellow', 'Black', 'Chocolate'],
    malamute: ['Grey and white', 'Black and white', 'Red and white', 'Sable and white', 'White'], chow: ['Red', 'Black', 'Blue', 'Cinnamon', 'Cream'],
    stdpoodle: ['Black', 'White', 'Apricot', 'Chocolate', 'Cream', 'Silver', 'Red', 'Blue', 'Parti'], schnauzer: ['Salt and pepper', 'Black and silver', 'Black', 'White'],
    westie: ['White'], yorkie: ['Blue and tan', 'Black and tan', 'Parti'], bichon: ['White', 'Cream'], maltese: ['White'],
    shihtzu: ['Gold and white', 'Black and white', 'Liver and white', 'Brindle and white', 'Black', 'Silver and white']
  };
  const yard = fs.readFileSync(path.join(__dirname, 'src', '03_yard.js'), 'utf8'), journal = fs.readFileSync(path.join(__dirname, 'src', '07_treasure_journal.js'), 'utf8');
  const tipsIn = KEYS.filter((k) => yard.includes(TIPS[k])), capped = /coatBreeds = [^\n]*slice\(0, 21\)/.test(journal);
  if (tipsIn.length < KEYS.length) console.log(`   note: BD_TIPS (03_yard.js, lane LINES) has ${tipsIn.length} of the 14 care notes: the others are checked as "no tip yet"`);
  if (capped) console.log('   note: coatBreeds() (07_treasure_journal.js, lane LINES) still stops at 21 breeds: the coat tab check expects 21 until it is lifted');
  const iso = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  sec('adopt each new breed through the UI, then feed, pet and walk');
  for (const [k, br, coat] of NEW) {
    const p = await t.boot(); await p.click('#tNew'); await p.waitForSelector('.heads button');
    if (k === 'dobie') ok(await p.locator('.heads button').count() === 35 && await ev(() => window.PawGenes.BREEDS.length) === 35, '35 dogs in the adoption carousel, 35 PawGenes breeds');
    const nm = (await p.getAttribute(`.heads button[aria-label$=" the ${br}"]`, 'aria-label')).replace(` the ${br}`, ''); // the starter's name comes from PawArt.DOGS
    await p.click(`.heads button[aria-label$=" the ${br}"]`);
    ok(await t.until((br) => (document.querySelector('.adopt-card h3') || {}).textContent.includes('the ' + br), br), `${br}: the shelter card shows ${nm} the ${br}`);
    const tip = await ev(() => { const e = document.querySelector('.adopt-card .bd-tip'); return e ? e.textContent : ''; });
    if (tipsIn.includes(k)) ok(tip === TIPS[k], `${br}: the care note is on the card (${tip})`);
    else ok(/function bdTip\(key\)/.test(yard) && tip === '', `${br}: bdTip is there, no care note yet (BD_TIPS not merged), and nothing breaks`);
    await p.click(k === 'corso' || k === 'lab' ? '#aBoy' : '#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
    let s = await S();
    ok(s.dog.key === k && s.dog.name === nm && s.dog.genes && (await t.mode()) === 'yard', `${br}: adopted ${nm}, in the yard`);
    ok(s.dog.genes.M.join() === 'm,m', `${br}: no merle (${s.dog.genes.M.join('/')})`);
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
    if (k === 'lab' || k === 'shihtzu') await t.SH('01_' + k + '_yard');
    await t.ctx.close();
  }

  sec('the coat catalogue names (PawGenes) and no merle anywhere new');
  await t.boot();
  const cats = await ev((keys) => { const G = window.PawGenes, o = {}; keys.forEach((k) => { o[k] = G.coatCatalog(k).map((c) => c.coat); }); return o; }, KEYS);
  KEYS.forEach((k) => ok(COATS[k].every((n) => cats[k].includes(n)), `${k} catalogue has ${COATS[k].join(', ')} (${cats[k].join(', ')})`));
  ok(['westie', 'maltese'].every((k) => cats[k].join() === 'White') && cats.bichon.join() === 'White,Cream' && cats.lab.length === 3, 'the white terriers and the Maltese are always White, the Bichon White or Cream, the Lab three colours');
  ok(KEYS.every((k) => cats[k].every((n) => !/merle|Harlequin/i.test(n))), 'no merle coat in any new catalogue');
  const mm = await ev((keys) => { const G = window.PawGenes, r = () => Math.random(); let merle = 0; for (const k of keys) for (let i = 0; i < 400; i++) if (G.randomGenotype(k, r).M.includes('M')) merle++; return merle; }, KEYS);
  ok(mm === 0, 'random rescues of the fourteen never carry merle (5600 rolled)');
  ok(await ev((keys) => keys.every((k) => window.PawGenes.FREQ[k].M === 0 && window.PawGenes.STARTER_GENES[k].M.join() === 'm,m'), KEYS), 'FREQ M is 0 and the starters are m/m');
  const names = await ev(() => ({ poodle: window.PawGenes.BREED_NAMES.poodle, std: window.PawGenes.BREED_NAMES.stdpoodle }));
  ok(names.poodle === 'Miniature Poodle' && names.std === 'Standard Poodle', `the two poodles: ${names.poodle} and ${names.std}`);

  sec('the litter rules list the new keys once (litters like V212.md 3)');
  const rules = await ev(() => { const L = window.PawBreeding.RULES.litters, all = [].concat(L.small.breeds, L.medium.breeds, L.large.breeds, L.giant.breeds); return { L, dupes: all.length - new Set(all).size, n: all.length, giant: window.PawBreeding.RULES.giant.breeds.join() }; });
  const want = { small: ['minpin', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'], medium: ['pitbull', 'schnauzer'], large: ['dobie', 'corso', 'lab', 'malamute', 'chow', 'stdpoodle'] };
  ok(Object.keys(want).every((g) => want[g].every((k) => rules.L[g].breeds.includes(k))) && rules.dupes === 0 && rules.n === 35, 'each new key in its litter group, every breed once (' + rules.n + ')');
  ok(rules.giant === 'dane,mastiff' && rules.L.giant.breeds.join() === 'dane,mastiff', 'the giant rules stay the Great Dane and the English Mastiff only');

  sec('Journal: the coat tab lists 35 breeds, each new page its catalogue');
  await t.ctx.close(); await t.newGame({}, { coins: 1000 }); const p = t.p;
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=coats]'); await p.waitForSelector('.ctop');
  const nTabs = await p.locator('.cbreed').count();
  ok(nTabs === (capped ? 21 : 35), `${nTabs} breed tabs on the Coats page` + (capped ? ' (coatBreeds still capped at 21 by 07_treasure_journal.js)' : ''));
  ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'the coat page does not scroll sideways');
  if (!capped) {
    for (const k of KEYS) {
      await p.click(`[data-cbreed="${k}"]`); await p.waitForSelector(`.cbreed.on[data-cbreed="${k}"]`);
      const n = await ev(() => document.querySelectorAll('.cgrid .coat').length);
      ok(n >= cats[k].length, `${k}: the page lists its ${cats[k].length} coats (${n} cells)`);
    }
    await p.click('[data-cbreed="shihtzu"]'); if (process.env.PAW_SHOTS) await t.sleep(2500); await t.SH('02_journal_coats_shihtzu');
  }
  await t.closeX(); await t.modalGone();

  sec('a Labrador x Standard Poodle playdate makes Labradoodle pups');
  await t.patch({ bond: { level: 8, pts: 2500 }, house: 'Royal Castle Kennel', careDays: 60 });
  const pd = await ev((born) => {
    const P = window.__paw, S = P.S;
    const mk = (key, sex, name) => { const d = P.addDog({ key, sex, months: 24 }, name); d.born = born; d.bond = { level: 8, pts: 2500 }; d.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; d.litters = 0; d.lastLitter = null; return d; };
    const f = mk('lab', 'female', 'Butterscotch'), m = mk('stdpoodle', 'male', 'Biscotti');
    P.breed.setSeason(f.id, true); P.saveNow();
    const can = P.breed.canPair(f.id, m.id), r = P.breed.playdate(f.id, m.id, { force: true, size: 3 });
    return { f: f.id, m: m.id, can, ok: r.ok, pups: (f.preg && f.preg.pups || []).map((x) => ({ key: x.key, mix: x.mix, M: x.genes.M.join('') })) };
  }, iso(30));
  ok(pd.can.ok, 'a Labrador girl and a Standard Poodle boy can have a playdate: ' + pd.can.why);
  ok(pd.ok && pd.pups.length >= 2 && pd.pups.length <= 3 && pd.pups.every((x) => x.mix && x.mix.name === 'Labradoodle' && ['lab', 'stdpoodle'].includes(x.key) && x.mix.head !== x.key), 'the pups are Labradoodles ' + JSON.stringify(pd.pups.map((x) => x.key + '/' + (x.mix && x.mix.name))));
  ok(pd.pups.every((x) => x.M === 'mm'), 'and none carries merle');
  await ev(() => window.__paw.breed.birthNow());
  ok(await t.until(() => document.querySelectorAll('[data-pupname]').length >= 2, null, 6000), 'the Puppies! popup opens');
  await p.fill('[data-pupname]', 'Doodle'); await p.press('[data-pupname]', 'Enter'); await t.modalGone();
  const pupId = await ev(() => window.__paw.S.litters[0].pups[0].id);
  ok(await ev((id) => { const r = window.__paw.S.tree[id]; return !!r && r.mix && r.mix.name === 'Labradoodle'; }, pupId), 'S.tree keeps the Labradoodle');
  await ev((id) => window.__paw.switchDog(id), pd.f); await t.home();
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=family]'); await p.waitForSelector('.panel.journal.j-family');
  await t.until(() => !!document.querySelector('.fkids .fkid'), null, 4000);
  await p.click(`.fkids [data-fam="${pupId}"]`);
  ok(await t.until(() => /Labradoodle/.test((document.querySelector('.fam-me') || {}).textContent || ''), null, 4000), 'the pup\'s tree page says Labradoodle');
  if (process.env.PAW_SHOTS) await t.sleep(2500); await t.SH('03_family_tree_labradoodle');
  await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.breed.chooseNow()); await t.until(() => !!document.getElementById('wsOk'), null, 6000);
  await p.click('#wsOk'); await t.until(() => !!document.getElementById('wsBye2'), null, 4000); await p.click('#wsBye2'); await t.untilMode('yard'); await t.modalGone();
  const mini = await ev(() => { const G = window.PawGenes; return [G.MIXES[G.mixKey('lab', 'stdpoodle')].name, G.MIXES[G.mixKey('poodle', 'lab')].name, G.MIXES[G.mixKey('maltese', 'poodle')].name, G.MIXES[G.mixKey('yorkie', 'maltese')].name, G.MIXES[G.mixKey('pitbull', 'husky')].name]; });
  ok(mini.join() === 'Labradoodle,Mini Labradoodle,Maltipoo,Morkie,Pitsky', 'mix names: ' + mini.join(', '));

  sec('the shelter: rescues of the new breeds are welfare-safe');
  const res = await ev(() => { const P = window.__paw, out = []; for (const k of ['pitbull', 'shihtzu', 'yorkie', 'corso']) for (let i = 0; i < 6; i++) { const d = P.addDog({ key: k, sex: i % 2 ? 'male' : 'female', months: 20 }, 'R' + k + i); out.push({ k, M: d.genes.M.join(''), coat: P.coat(d).coatName }); } return out; });
  ok(res.every((r) => r.M === 'mm' && r.coat && !/merle/i.test(r.coat)), 'every added dog of the new breeds is m/m with a named coat: ' + [...new Set(res.map((r) => r.coat))].slice(0, 10).join(', '));
  ok(t.errors.length === 0, 'no console errors');
}, { timeout: 600000 });
