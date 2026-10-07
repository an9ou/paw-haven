// v25_breeds (BREEDS lane, V25.md 6b): the four new breeds in the game.
// Covers: adopt Poodle, Border Collie, Samoyed and French Bulldog through the carousel (14 heads), feed, pet, walk each;
// the Wardrobe mannequin draws every outfit (v2.4 and the 5 new ones) on each new breed with no console errors;
// a Poodle x Golden playdate names the pups Goldendoodle and the family tree shows it; two merle collies cannot pair
// (the same kind message as any merle pair), a merle x plain collie can and no pup is M/M; Horgi x Horgi = Horgi;
// the flat-face tip shows once on the first hot day; the Journal coat tab shows 14 breeds.
require('./test_lib').run('v25_breeds', async (t) => {
  const { ok, sec, ev, S } = t;
  const NEW = [['poodle', 'Poodle'], ['collie', 'Border Collie'], ['samoyed', 'Samoyed'], ['frenchie', 'French Bulldog']];
  const iso = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  sec('adopt each new breed through the UI, then feed, pet and walk');
  for (const [k, br] of NEW) {
    const p = await t.boot(); await p.click('#tNew'); await p.waitForSelector('.heads button');
    const nm = (await p.getAttribute(`.heads button[aria-label$=" the ${br}"]`, 'aria-label')).replace(` the ${br}`, ''); // the starter's name comes from PawArt.DOGS
    ok(await p.locator('.heads button').count() === 14, `${br}: 14 dogs in the adoption carousel`);
    await p.click(`.heads button[aria-label$=" the ${br}"]`);
    ok(await t.until((br) => (document.querySelector('.adopt-card h3') || {}).textContent.includes('the ' + br), br), `${br}: the shelter card shows ${nm} the ${br}`);
    const tip = await ev(() => { const e = document.querySelector('.adopt-card .bd-tip'); return e ? e.textContent : ''; });
    if (k === 'frenchie') ok(/Flat faces breathe hard in heat\. Short walks, shade and water on warm days\./.test(tip), `${br}: the welfare tip is on the card (${tip})`);
    else ok(!tip, `${br}: no welfare tip on the card`);
    await p.click('#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
    let s = await S();
    ok(s.dog.key === k && s.dog.name === nm && s.dog.genes && (await t.mode()) === 'yard', `${br}: adopted ${nm}, in the yard`);
    ok(await t.until(() => !!document.querySelector('#dogArt svg.pa-dog')), `${br}: drawn in the yard`);
    const c = await ev(() => window.__paw.coat(window.__paw.S.dog));
    ok(c && c.coatName === { poodle: 'Apricot', collie: 'Black and white', samoyed: 'White', frenchie: 'Fawn' }[k], `${br}: starter coat ${c && c.coatName}`);
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
    if (k === 'poodle') await t.SH('01_poodle_yard');
    await t.ctx.close();
  }

  sec('the welfare tip shows once, the first hot day');
  const p = await t.boot(); await t.adopt({ sex: 'girl', head: '~ the French Bulldog' });
  ok((await S()).dog.key === 'frenchie' && JSON.stringify((await S()).breedTips) === '{}', 'a fresh French Bulldog, no tip seen yet');
  await t.toasts();
  await t.dev(async () => { await p.selectOption('#dvTime', 'day'); await p.selectOption('#dvWeather', 'sunny'); });
  ok(await t.waitToast(/Flat faces breathe hard in heat\. Short walks, shade and water on warm days\./, 8000), 'the tip toast shows on the first hot day');
  ok(!!(await S()).breedTips.frenchie, 'S.breedTips.frenchie is stamped');
  ok(await t.until(() => /\*snort\* Flat faces and sun do not mix\. Shade, please\./.test(document.getElementById('bubble').textContent), null, 4000), 'the dog says its hot-day line');
  await t.toasts();
  await t.dev(async () => { await p.selectOption('#dvWeather', 'cloudy'); });
  await t.dev(async () => { await p.selectOption('#dvWeather', 'sunny'); });
  await t.sleep(600);
  ok(!(await t.toasts()).some((x) => /Flat faces breathe hard/.test(x)), 'the second hot day: no tip again');
  await t.dev(async () => { await p.selectOption('#dvWeather', 'cloudy'); });

  sec('Wardrobe mannequin: every outfit on every new breed, no console errors');
  // every wearable name in the game data: CLOTHES entries plus the wearable treasures (read from the source, the page keeps them in its closure)
  const core = require('fs').readFileSync(require('path').join(__dirname, 'src', '00_core.js'), 'utf8');
  const cl = core.slice(core.indexOf('const CLOTHES = ['), core.indexOf('];', core.indexOf('const CLOTHES = [')));
  const NEW_WEAR = ['Leaf Beret', 'Autumn Scarf', 'Parade Rosette', 'Ghost Sheet', 'Pumpkin Suit'];
  const list = [...new Set([...cl.matchAll(/\{ n: '([^']+)', slot:/g)].map((m) => m[1]).concat([...core.matchAll(/TR\('([^']+)', 'wearable'/g)].map((m) => m[1]), NEW_WEAR))];
  ok(!!list && list.length >= 35 && NEW_WEAR.every((n) => list.includes(n)), `outfit list: ${list && list.length} names incl. the 5 new ones`);
  const ids = await ev((keys) => { const P = window.__paw; return keys.filter((k) => k !== 'frenchie').map((k, i) => P.addDog({ key: k, sex: i % 2 ? 'male' : 'female', months: 20 }, 'Test ' + k).id); }, NEW.map((x) => x[0]));
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
    if (id === allIds[0]) await t.sleep(2500); await t.SH('02_wardrobe_frenchie');
  }
  ok(drawn === tried && t.errors.length === e0, `${drawn}/${tried} mannequin previews drawn (4 breeds x ${list && list.length} outfits), no console errors`);
  await ev(() => { const S = window.__paw.S; S.outfit.head = S.outfit.eyes = S.outfit.neck = S.outfit.body = null; });
  await t.closeX(); await t.modalGone();

  sec('Journal: the coat tab shows 14 breeds');
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=coats]'); await p.waitForSelector('.ctop');
  ok(await p.locator('.cbreed').count() === 14, '14 breed tabs on the Coats page');
  ok(await ev(() => ['poodle', 'collie', 'samoyed', 'frenchie'].every((k) => !!document.querySelector(`.cbreed[data-cbreed="${k}"]`))), 'the four new breeds have tabs');
  await t.sleep(700); // let the popup's open animation finish before measuring
  const rows = await ev(() => new Set([...document.querySelectorAll('.cbreed')].map((e) => Math.round(e.offsetTop / 10))).size);
  ok(rows === 1, `the breed tabs fit on one row at 1280x720 (${rows} rows)`);
  await p.setViewportSize({ width: 1024, height: 720 }); await t.sleep(700);
  const rows1024 = await ev(() => ({ rows: new Set([...document.querySelectorAll('.cbreed')].map((e) => Math.round(e.offsetTop / 10))).size, over: document.querySelector('.cbreeds').scrollWidth > document.querySelector('.cbreeds').clientWidth + 1, docW: document.documentElement.scrollWidth }));
  ok(rows1024.rows === 1 && !rows1024.over && rows1024.docW <= 1024, `at 1024x720 too: one row, nothing cut off (${JSON.stringify(rows1024)})`);
  await t.SH('03b_journal_coats_1024');
  await p.setViewportSize({ width: 1280, height: 720 }); await t.sleep(400);
  await p.click('[data-cbreed="collie"]'); await p.waitForSelector('.cbreed.on[data-cbreed="collie"]');
  ok(await ev(() => document.querySelectorAll('.coat').length) >= 20, 'the Border Collie page lists its coats');
  await t.sleep(2500); await t.SH('03_journal_coats');
  await t.closeX(); await t.modalGone();

  sec('Poodle x Golden playdate: Goldendoodle pups, shown in the family tree');
  await t.patch({ bond: { level: 8, pts: 2500 }, house: 'Royal Castle Kennel', careDays: 60 });
  const pd = await ev((born) => {
    const P = window.__paw, S = P.S, f = S.dogs.find((d) => d.key === 'poodle');
    f.sex = 'female'; f.born = born; f.litters = 0; f.lastLitter = null; f.bond = { level: 8, pts: 2500 }; f.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; f.name = 'Pretzel';
    const m = P.addDog({ key: 'golden', sex: 'male', months: 24 }, 'Sunny'); m.bond = { level: 8, pts: 2500 }; m.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 };
    P.breed.setSeason(f.id, true); P.saveNow();
    const can = P.breed.canPair(f.id, m.id), r = P.breed.playdate(f.id, m.id, { force: true, size: 3 });
    return { f: f.id, m: m.id, can, ok: r.ok, pups: (f.preg && f.preg.pups || []).map((x) => ({ key: x.key, mix: x.mix })) };
  }, iso(30));
  ok(pd.can.ok, 'a Poodle girl and a Golden boy can have a playdate: ' + pd.can.why);
  ok(pd.ok && pd.pups.length === 3 && pd.pups.every((x) => x.mix && x.mix.name === 'Goldendoodle' && ['poodle', 'golden'].includes(x.key) && x.mix.head !== x.key), 'the 3 pups are Goldendoodles ' + JSON.stringify(pd.pups.map((x) => x.key + '/' + (x.mix && x.mix.head) + ' ' + (x.mix && x.mix.name))));
  await ev(() => window.__paw.breed.birthNow());
  ok(await t.until(() => document.querySelectorAll('[data-pupname]').length === 3, null, 6000), 'the Puppies! popup opens');
  await p.fill('[data-pupname]', 'Doodle'); await p.press('[data-pupname]', 'Enter'); await t.modalGone();
  const pupId = await ev(() => window.__paw.S.litters[0].pups[0].id);
  ok(await ev((id) => { const r = window.__paw.S.tree[id]; return !!r && r.mix && r.mix.name === 'Goldendoodle'; }, pupId), 'S.tree keeps the Goldendoodle');
  await ev((id) => window.__paw.switchDog(id), pd.f); await t.home();
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=family]'); await p.waitForSelector('.panel.journal.j-family');
  await t.until(() => !!document.querySelector('.fkids .fkid'), null, 4000);
  ok(await ev(() => document.querySelectorAll('.fkids .fkid').length) === 3, 'Pretzel\'s tree page lists her 3 puppies');
  await p.click(`.fkids [data-fam="${pupId}"]`);
  ok(await t.until(() => /Goldendoodle/.test((document.querySelector('.fam-me') || {}).textContent || ''), null, 4000), 'the pup\'s tree page says Goldendoodle');
  ok(await ev(() => /Pretzel/.test(document.querySelector('.ft').textContent) && /Sunny/.test(document.querySelector('.ft').textContent)), 'mum Pretzel and dad Sunny are on the tree');
  await t.sleep(2500); await t.SH('04_family_tree_goldendoodle');
  await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.breed.chooseNow()); await t.until(() => !!document.getElementById('wsOk'), null, 6000);
  await p.click('#wsOk'); await t.until(() => !!document.getElementById('wsBye2'), null, 4000); await p.click('#wsBye2'); await t.untilMode('yard'); await t.modalGone();

  sec('no double merle on collies');
  const mr = await ev((born) => {
    const P = window.__paw, S = P.S;
    const mk = (key, sex, merle, name) => { const d = P.addDog({ key, sex, months: 24 }, name); d.born = born; d.bond = { level: 8, pts: 2500 }; d.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; d.genes.M = merle ? ['M', 'm'] : ['m', 'm']; d.genes.E = ['E', 'E']; return d; };
    S.dogs.filter((d) => d.key !== 'collie' && d.id !== S.dogs[0].id).forEach((d) => { S.dogs.splice(S.dogs.indexOf(d), 1); });
    const a = mk('collie', 'female', true, 'Blue'), b = mk('collie', 'male', true, 'Merlin'), c = mk('collie', 'male', false, 'Plain');
    const x = mk('corgi', 'female', true, 'Cora'), y = mk('corgi', 'male', true, 'Cody');
    P.breed.setSeason(a.id, true); P.breed.setSeason(x.id, true);
    const coat = (d) => P.coat(d).coatName;
    const mm = P.breed.canPair(a.id, b.id), ref = P.breed.canPair(x.id, y.id), mp = P.breed.canPair(a.id, c.id);
    const r = P.breed.playdate(a.id, c.id, { force: true, size: 3 });
    const pups = (a.preg && a.preg.pups) || [];
    return { mm, ref, mp, ok: r.ok, coats: [coat(a), coat(b), coat(c)], pupsM: pups.map((q) => q.genes.M.join('')), anyMerle: pups.some((q) => q.genes.M.includes('M')), aId: a.id };
  }, iso(30));
  ok(/merle/i.test(mr.coats[0]) && /merle/i.test(mr.coats[1]) && !/merle/i.test(mr.coats[2]), 'two merle collies and a plain one: ' + mr.coats.join(', '));
  ok(mr.mm.ok === false && mr.mm.code === 'merle', 'two merle collies cannot pair: ' + mr.mm.why);
  ok(mr.mm.why === mr.ref.why && mr.ref.code === 'merle', 'the message is the same kind one as for any merle pair');
  ok(mr.mp.ok === true, 'a merle collie and a plain collie can pair: ' + mr.mp.why);
  ok(mr.ok && mr.pupsM.length === 3 && mr.pupsM.every((m) => m !== 'MM'), 'their pups never carry M/M: ' + mr.pupsM.join(', '));
  const pred = await ev(() => { const G = window.PawGenes, g = { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'sp'], M: ['M', 'm'], Bl: ['bl', 'bl'] }; return { mm: G.predict(g, g, 'collie', 'collie').length, mp: G.predict(g, Object.assign({}, g, { M: ['m', 'm'] }), 'collie', 'collie').map((r) => r.coat) }; });
  ok(pred.mp.includes('Blue merle') && pred.mp.includes('Black and white'), 'the playdate odds for merle x plain: ' + pred.mp.join(', '));

  sec('Gene Sniffer card for a merle collie');
  await ev((id) => { const S = window.__paw.S; S.sniffer = true; const d = S.dogs.find((x) => x.id === id); d.geneTested = false; window.__paw.switchDog(id); }, mr.aId);
  await t.home('vet'); await p.click('#placeBtns [data-pb=vet]'); await p.waitForSelector('#vetSniff');
  await p.click('#vetSniff'); await p.waitForSelector('.sniffcard');
  ok(await t.until(() => !!document.querySelector('.dnacard.done') || !!document.querySelector('.dnacard'), null, 6000), 'the Gene Sniffer opens the gene card');
  await t.until(() => !!document.querySelector('.dnacard.done'), null, 5000); await t.sleep(400);
  const dna = await ev(() => ({ h: document.querySelector('#modal .panel h2').textContent, lines: [...document.querySelectorAll('.dna-lines li')].map((e) => e.textContent) }));
  ok(/Blue/.test(dna.h) && dna.lines.some((l) => /^M\/m: merle marbling \(never pair with another merle\)$/.test(l)), 'the card reads M/m: merle marbling, never pair with another merle: ' + dna.lines.join(' | '));
  await t.sleep(2500); await t.SH('05_gene_sniffer_merle_collie');
  await t.closeX(); await t.modalGone(); await t.home('yard');

  sec('Horgi x Horgi = Horgi');
  const hh = await ev((born) => {
    const P = window.__paw, S = P.S;
    const mk = (key, sex, mix, name) => { const d = P.addDog({ key, sex, months: 24 }, name); d.born = born; d.bond = { level: 8, pts: 2500 }; d.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; d.genes.M = ['m', 'm']; d.mix = mix; delete d.anc; return d; };
    S.dogs.filter((d) => d.id !== S.dogs[0].id).forEach((d) => { S.dogs.splice(S.dogs.indexOf(d), 1); });
    const f = mk('corgi', 'female', { a: 'corgi', b: 'husky', body: 'corgi', head: 'husky', name: 'Horgi' }, 'Hazel');
    const m = mk('husky', 'male', { a: 'husky', b: 'corgi', body: 'husky', head: 'corgi', name: 'Horgi' }, 'Hank');
    const c = mk('corgi', 'male', null, 'Corky');
    P.breed.backfill(); P.breed.setSeason(f.id, true);
    const r = P.breed.playdate(f.id, m.id, { force: true, size: 3 });
    const pups = (f.preg && f.preg.pups) || [];
    f.preg = null; f.lastPlaydate = null; P.breed.setSeason(f.id, true);
    const r2 = P.breed.playdate(f.id, c.id, { force: true, size: 2 });
    const pups2 = (f.preg && f.preg.pups) || [];
    return { ok: r.ok, pups: pups.map((q) => ({ key: q.key, mix: q.mix })), ok2: r2.ok, pups2: pups2.map((q) => ({ key: q.key, mix: q.mix })) };
  }, iso(30));
  ok(hh.ok && hh.pups.length === 3 && hh.pups.every((q) => q.mix && q.mix.name === 'Horgi' && ['corgi', 'husky'].includes(q.key)), 'Horgi x Horgi: every pup is a Horgi ' + JSON.stringify(hh.pups.map((q) => q.key + ' ' + (q.mix && q.mix.name))));
  ok(hh.pups.every((q) => q.mix.head !== q.key && ['corgi', 'husky'].includes(q.mix.head)), 'the pups show a corgi and a husky half');
  ok(hh.ok2 && hh.pups2.length === 2 && hh.pups2.every((q) => q.key === 'corgi' && q.mix && q.mix.name === 'Corgi'), 'Horgi x Corgi (3/4 Corgi): the pups are Corgis, not "Mutt mix" ' + JSON.stringify(hh.pups2.map((q) => q.key + ' ' + (q.mix && q.mix.name))));

  sec('phones: all 14 heads in the adoption sheet are tappable (iPhone 13, Pixel 7)');
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    await t.ctx.close();
    const q = await t.boot({ device: dev }); await q.click('#tNew'); await q.waitForSelector('.heads button'); await t.sleep(500);
    await ev(() => { const d = document.getElementById('dock'); d.scrollTop = d.scrollHeight; }); await t.sleep(400);
    const hit = await ev(() => [...document.querySelectorAll('.heads button')].map((b) => { const r = b.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && b.contains(e) && r.width >= 44 && r.height >= 44; }));
    ok(hit.length === 14 && hit.every(Boolean), `${dev}: 14 heads, each 44 px or more and tappable with the sheet scrolled down`);
    ok(await ev(() => document.documentElement.scrollWidth <= innerWidth), `${dev}: no sideways scroll`);
    await q.locator('.heads button').last().click();
    ok(await t.until(() => /the French Bulldog/.test(document.querySelector('.adopt-card h3').textContent)), `${dev}: tapping the last head picks the French Bulldog`);
    if (dev === 'iPhone 13') await t.SH('06_adopt_phone_scrolled');
  }
  ok(t.errors.length === 0, 'no console errors');
});
