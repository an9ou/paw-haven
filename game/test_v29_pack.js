// v2.9 PACK lane test, V29.md sections 1 and 5: with two or more dogs, the Play tray, Fetch, toys, Tricks, Walks and the Wardrobe take the ticked dogs along
// (chip row, run-along and tug poses, one dog picker, pack walks with a +10% bonus), a long press on a pack dog opens Make leader / Dress / Train, and one dog (or the harness pin) is v2.8.4.
// node game/run_tests.js v29_pack
require('./test_lib').run('v29_pack', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p, S = () => t.S();
  const ids = async () => (await S()).dogs.map((d) => d.id);
  const set = (k, v) => ev(([k, v]) => { window.__paw.S.dogs.forEach((d, i) => { d.stats[k] = Array.isArray(v) ? v[i] : v; d.sleeping = false; }); window.__paw.S.sleeping = false; }, [k, v]);
  const stat = async (k) => (await S()).dogs.map((d) => d.stats[k]);
  const bond = async () => (await S()).dogs.map((d) => d.bond.pts);
  const idle = () => t.until(() => !window.__paw.shop.busy, null, 8000);
  const playTray = async () => { await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await p().click('[data-act=play]'); await t.waitPop(true); };
  const acts = () => ev(() => window.__paw.pk.acts());
  const modalUp = () => t.until(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), null, 5000);
  const quiet = async () => { await t.luWait(1300); await t.lu(); }; // Bond levels can pop a level-up sheet a moment later
  const near = (a, b, e) => Math.abs(a - b) <= (e || 0.6);
  // v2.9 review: where the drawings really are (scene units, the union of each dog's parts). Fetch: followers in the view, off the veggie bed, apart, not hidden by the leader
  const ART = () => { const svg = document.querySelector('#view svg.world'), M = svg.getScreenCTM().inverse(); return (el) => { const s = el.querySelector('svg.pa-dog') || el.querySelector('svg'); let b = [1e9, 1e9, -1e9, -1e9]; [...s.children].forEach((c) => { const r = c.getBoundingClientRect(); if (!r.width && !r.height) return; const a = new DOMPoint(r.left, r.top).matrixTransform(M), z = new DOMPoint(r.right, r.bottom).matrixTransform(M); b = [Math.min(b[0], a.x), Math.min(b[1], a.y), Math.max(b[2], z.x), Math.max(b[3], z.y)]; }); return b.map(Math.round); }; };
  const fetchGeo = () => ev((src) => {
    const box = eval(src)(), ov = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])), ar = (a) => (a[2] - a[0]) * (a[3] - a[1]);
    const els = [...document.querySelectorAll('#pkFol .pk-fl')], L = box(document.getElementById('dogArt')), F = els.map(box), v = document.getElementById('view').getBoundingClientRect();
    const inView = els.every((e) => { const r = e.querySelector('svg.pa-dog').getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1 && r.top >= v.top - 1 && r.bottom <= v.bottom + 1; });
    let pair = 0; F.forEach((a, i) => F.forEach((b, j) => { if (i < j) pair = Math.max(pair, ov(a, b) / Math.min(ar(a), ar(b))); }));
    const pk = document.getElementById('pkFol'), dp = document.getElementById('dogPos');
    return { n: F.length, inView, bed: Math.min(...F.map((f) => f[0])), lead: +Math.max(...F.map((f) => ov(f, L) / ar(f))).toFixed(2), pair: +pair.toFixed(2), front: !!(dp.compareDocumentPosition(pk) & Node.DOCUMENT_POSITION_FOLLOWING), L, F };
  }, ART.toString());
  const fetchOk = (g, mid) => g.n >= 2 && g.inView && g.front && g.bed >= 222 && g.lead <= (mid ? 0.5 : 0.25) && g.pair <= (mid ? 0.5 : 0.12);

  sec('1. three dogs: who joins in (pkDogs)');
  await t.newGame({}, { coins: 2000 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.S.inv.toys.push('Squeaky Duck', 'Rope Tug'); });
  await t.calm(); await t.home('yard');
  const [A, B, C] = await ids();
  const pk = (kind, area) => ev(([k, a]) => window.__paw.pk.dogs(k, a), [kind, area]);
  ok(JSON.stringify(await pk('play')) === JSON.stringify([A, B, C]), 'play: the leader first, then both ticked pack dogs');
  ok(JSON.stringify(await pk('walk', 'park')) === JSON.stringify([A, B, C]), 'walk: the same three on a park walk');
  await ev((c) => { window.__paw.S.careOff = { [c]: true }; }, C);
  ok(JSON.stringify(await pk('play')) === JSON.stringify([A, B]), 'an unticked dog stays out');
  await ev((a) => { window.__paw.S.careOff = { [a]: true }; }, A);
  ok(JSON.stringify(await pk('play')) === JSON.stringify([A, B, C]), 'the leader always plays, even with its chip unticked');
  await ev(() => { window.__paw.S.careOff = {}; window.__paw.S.dogs[2].sleeping = true; });
  ok(JSON.stringify(await pk('play')) === JSON.stringify([A, B]) && JSON.stringify(await ev(() => window.__paw.pk.skip())) === JSON.stringify([[C, 'asleep']]), 'a sleeping dog is left out and the reason is kept');
  await ev(() => { const d = window.__paw.S.dogs; d[2].sleeping = false; d[2].stats.energy = 7; });
  ok(JSON.stringify(await pk('walk', 'park')) === JSON.stringify([A, B]) && JSON.stringify(await ev(() => window.__paw.pk.skip())) === JSON.stringify([[C, 'tired']]), 'a walk leaves out a dog with Energy under 10 (a nap at home)');
  ok(JSON.stringify(await pk('play')) === JSON.stringify([A, B, C]), 'Energy 7 is still fine for toy play (the limit is 5)');
  await set('energy', 90);

  sec('2. the Play tray: chip row on top, Tricks opens a picker');
  await playTray();
  ok(await p().locator('#dock .cr-chips .cr-chip').count() === 3, 'three chips top the Play tray');
  ok(await ev(() => /leader always plays/.test(document.querySelector('#dock .cr-cap').textContent)), 'the caption fits play');
  await p().click(`#dock [data-crdog="${C}"]`);
  ok(await t.until((c) => { const b = document.querySelector(`#dock [data-crdog="${c}"]`); return !!b && b.getAttribute('aria-pressed') === 'false'; }, C, 2000) && JSON.stringify(await pk('play')) === JSON.stringify([A, B]), 'a chip tap unticks Pip and the tray redraws');
  await p().click(`#dock [data-crdog="${C}"]`);
  await t.until((c) => document.querySelector(`#dock [data-crdog="${c}"]`).getAttribute('aria-pressed') === 'true', C, 2000);
  await p().click('[data-play=tricks]');
  ok(await t.until(() => document.querySelectorAll('#dock .pk-pickb').length === 3, null, 2000), 'Tricks opens a dog picker with a head for every dog');
  ok(await ev(() => document.querySelector('#dock .pk-pickb[aria-pressed="true"]').dataset.pkdog) === A && await ev(() => [...document.querySelectorAll('#dock .pk-pickb')].every((b) => !!b.querySelector('svg'))), 'the leader is marked, every chip has a head');
  await p().click(`#dock [data-pkdog="${C}"]`);
  ok(await t.until((c) => !!window.__paw.train && window.__paw.train.dog === c && window.__paw.S.activeId === c, C, 5000), 'training Pip runs for Pip (she is active for the session)');
  ok((await ev(() => window.__paw.pk.swapped())) === true, 'the swap is flagged');
  await p().click('#trX');
  ok(await t.until((a) => !window.__paw.train && window.__paw.S.activeId === a, A, 4000) && !(await ev(() => window.__paw.pk.swapped())), 'closing training puts Mochi back as the leader');
  ok(await t.until((c) => document.querySelector('#hudName') && /Mochi/.test(document.querySelector('#hudName').textContent) && !!document.querySelector(`#pack [data-dog="${c}"]`), C, 3000), 'the HUD and the yard show Mochi leading and Pip with the pack');
  // a sleeping dog cannot train, and nothing switches
  await ev((c) => { window.__paw.S.dogs.find((d) => d.id === c).sleeping = true; }, C);
  await playTray(); await p().click('[data-play=tricks]'); await t.toasts(); await p().click(`#dock [data-pkdog="${C}"]`);
  ok(await t.waitToast(/Pip is asleep/) && (await S()).activeId === A && !(await ev(() => window.__paw.train)), 'a sleeping dog: a kind line and no switch');
  await ev((c) => { window.__paw.S.dogs.find((d) => d.id === c).sleeping = false; }, C);

  sec('3. Squeaky Duck: every ticked dog is delighted, the act counts once');
  await set('happy', 40); await t.toasts(); let a0 = await acts();
  await playTray(); await p().click(`#dock [data-crdog="${C}"]`);
  await t.until((c) => document.querySelector(`#dock [data-crdog="${c}"]`).getAttribute('aria-pressed') === 'false', C, 2000);
  await p().click('[data-play=duck]'); await idle();
  let h = await stat('happy');
  ok(h[0] > 48 && h[1] > 48 && near(h[2], 40), 'Mochi and Bun gain Happiness, unticked Pip does not: ' + JSON.stringify(h.map(Math.round)));
  ok(await t.waitToast(/Bun squeaks along/), 'the toast names the dog that squeaks along');
  ok((await acts()).toy - (a0.toy || 0) === 1, 'one toy act, not one per dog');
  ok((await ev(() => window.__paw.S.dogs.map((d) => d.bond.pts))).length === 3, 'bookkeeping intact');

  sec('4. Tug: the others crouch at the far end and pull; Bond for each dog');
  await ev(() => { window.__paw.S.careOff = {}; delete window.__paw.S['toyAt_Rope Tug']; }); await set('happy', 40); await set('energy', 90); await t.toasts();
  const b0 = await bond(); a0 = await acts();
  await playTray(); await p().click('[data-play=tug]');
  ok(await t.until(() => document.querySelectorAll('#pack .packdog.pk-tug').length === 2, null, 2000), 'both pack dogs pile on (class pk-tug)');
  ok(await ev(() => [...document.querySelectorAll('#pack .packdog.pk-tug svg.pa-dog')].every((s) => /pa-pose-(crouch|sit)\b/.test(s.getAttribute('class') || ''))), 'they use the existing crouch pose (sit where a breed has no crouch)');
  await p().waitForTimeout(550); // the slide into the pile takes 0.4 s
  const tg = await ev((src) => { const box = eval(src)(), L = box(document.getElementById('dogArt')); return { L, D: [...document.querySelectorAll('#pack .packdog.pk-tug')].map(box) }; }, ART.toString());
  ok(tg.D.length === 2 && tg.D.every((d) => d[0] < tg.L[0] && d[2] >= tg.L[0] - 30 && d[3] >= tg.L[3] - 110 && d[3] <= tg.L[3] + 30 && d[0] >= 222), 'they pile on right behind the leader, at its end of the rope (off the veggie bed): ' + JSON.stringify(tg));
  await idle();
  ok(await t.until(() => document.querySelectorAll('#pack .packdog.pk-tug').length === 0, null, 3000), 'the pile-on ends with the game');
  ok(await t.until(() => [...document.querySelectorAll('#pack .packdog')].every((g) => !g.style.transform), null, 2000), 'and they go back to their own spots');
  h = await stat('happy'); const en = await stat('energy'), b1 = await bond();
  ok(h.every((x) => x > 48), 'every dog gained Happiness: ' + JSON.stringify(h.map(Math.round)));
  ok(en.every((x) => x < 85), 'every dog spent Energy: ' + JSON.stringify(en.map(Math.round)));
  ok(b1.every((x, i) => x > b0[i]), 'every dog got its own Bond: ' + JSON.stringify([b0, b1]));
  ok(await t.waitToast(/Bun and Pip pile on at the far end of the rope/) , 'the toast says who piled on');
  ok((await acts()).toy - a0.toy === 1, 'one toy act');

  sec('5. a toy mini-game: the reward goes to every ticked dog');
  await ev(() => { window.__ctx = null; const T = window.PawToys, o = T.open.bind(T); if (!T.__t) { T.open = (host, name, ctx) => { window.__ctx = ctx; return o(host, name, ctx); }; T.__t = true; } });
  const toyName = await ev(() => { const S = window.__paw.S; const n = ['Rubber Chicken', 'Squeaky Duck', 'Rope Tug', 'Tennis Ball'].find((x) => S.inv.toys.includes(x) && window.PawToys.supports(x)); return n; });
  await set('happy', 40); await t.toasts(); a0 = await acts();
  await ev((n) => { delete window.__paw.S.toyDay; window.__paw.go('toy', n); }, toyName);
  ok(await t.until(() => !!window.__ctx, null, 8000), 'the toy opens (' + toyName + ')');
  await ev(() => { window.__ctx.reward({ happiness: 10, bond: 3 }); window.__ctx.reward({ happiness: 10, bond: 3 }); });
  h = await stat('happy'); ok(h.every((x) => x >= 55), 'two rewards: every dog gained Happiness: ' + JSON.stringify(h.map(Math.round)));
  ok((await acts()).toy - a0.toy === 1, 'two rewards, one toy act');
  ok(await t.waitToast(/\(each dog\)/), 'the toast says each dog');
  await ev(() => { window.__ctx.onClose(); }); await t.untilMode('yard');

  sec('6. Fetch: the leader runs, the others chase along behind');
  await set('happy', 40); await set('energy', 90); await t.toasts(); await t.home('yard'); a0 = await acts();
  const bf0 = await bond();
  await ev(() => window.__paw.go('fetch', 'Tennis Ball')); await t.untilMode('fetch');
  ok(await t.until(() => document.querySelectorAll('#pkFol .pk-fl').length === 2, null, 3000), 'two followers are drawn');
  ok(await ev(() => document.querySelectorAll('#pack .packdog').length) === 0, 'they left their spots in the pack group');
  let fg = await fetchGeo(); ok(fetchOk(fg), 'at the start every follower is in view, off the veggie bed, clear of the others and not hidden by the leader: ' + JSON.stringify(fg));
  const x0 = await ev(() => [...document.querySelectorAll('#pkFol .pk-fl')].map((g) => g.style.transform));
  await p().click('#view svg.world', { position: { x: 800, y: 500 } });
  ok(await t.until(() => document.querySelectorAll('#pkFol .pk-run').length === 2, null, 2000), 'on a throw both run (class pk-run, walk pose)');
  ok(await ev(() => [...document.querySelectorAll('#pkFol svg.pa-dog')].every((s) => /pa-pose-walk\b/.test(s.getAttribute('class') || ''))), 'in the existing walk pose');
  const x1 = await ev(() => [...document.querySelectorAll('#pkFol .pk-fl')].map((g) => g.style.transform));
  ok(x1.every((x, i) => x !== x0[i]), 'they move toward the ball');
  await p().waitForTimeout(450); fg = await fetchGeo(); ok(fetchOk(fg, true), 'mid-run they stay in view, drawn over the leader, never hidden behind it: ' + JSON.stringify(fg));
  await p().waitForTimeout(1400); fg = await fetchGeo(); ok(fetchOk(fg) && fg.F.every((f) => f[2] <= fg.L[0] - 4 || f[1] > fg.L[3] - 60), 'at rest they wait in a line behind the leader with a gap: ' + JSON.stringify(fg));
  ok(await ev(() => { const l = document.querySelector('#dogPos').style.transform; return !!l; }), 'the leader runs too');
  await ev(() => { const F = window.__paw.F; F.score = 4; F.great = 1; F.throws = 5; F.coins = 6; });
  await t.toasts(); await p().click('#fQuit'); await t.until(() => !!document.getElementById('fOk'), null, 5000);
  const bf1 = await bond(); h = await stat('happy');
  ok(bf1.every((x, i) => x > bf0[i]), 'each dog got its own Bond once: ' + JSON.stringify([bf0, bf1]));
  ok(h.every((x) => x > 45), 'each dog got Happiness: ' + JSON.stringify(h.map(Math.round)));
  ok(await ev(() => /Bun and Pip ran along/.test(document.querySelector('#modal').textContent)), 'the results name the dogs that ran along');
  ok(((await acts()).fetch || 0) - (a0.fetch || 0) <= 1, 'the fetch act is counted once at most');
  await p().click('#fOk'); await t.untilMode('yard');

  sec('7. the route screen: chip row and the dogs in a line');
  await set('energy', 90); await t.home('yard');
  await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart');
  ok(await p().locator('#view .cr-chips .cr-chip').count() === 3, 'the chip row is on the route screen');
  ok(await ev(() => /leader leads/.test(document.querySelector('#view .cr-cap').textContent)), 'with its own caption');
  ok(await p().locator('#pkWalkLine .pk-lh').count() === 3, 'the walking line shows three heads');
  ok(await ev(() => /Mochi leads\. Bun and Pip follow behind\./.test(document.querySelector('#pkWalkLine .pk-who').textContent)), 'the line says who leads and who follows');
  await p().click(`#view [data-crdog="${C}"]`);
  ok(await t.until(() => document.querySelectorAll('#pkWalkLine .pk-lh').length === 2, null, 2000), 'unticking Pip takes her out of the line');
  ok(await ev(() => /Bun follows behind/.test(document.querySelector('#pkWalkLine .pk-who').textContent)), '"Bun follows behind"');
  await p().click(`#view [data-crdog="${C}"]`); await t.until(() => document.querySelectorAll('#pkWalkLine .pk-lh').length === 3, null, 2000);
  // a young pup only does the park
  await ev(() => { const P = window.__paw; P.addDog({ key: 'beagle', sex: 'male', months: 4 }, 'Dot'); });
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart');
  ok(await p().locator('#pkWalkLine .pk-lh').count() === 4, 'the pup walks the park route: four heads');
  await p().click('#rtNext'); await p().click('#rtNext'); await p().click('#rtNext');
  ok(await t.until(() => /still a pup/.test(document.querySelector('#pkWalkLine .pk-who').textContent) && document.querySelectorAll('#pkWalkLine .pk-lh').length === 3, null, 2000), 'on a longer route Dot stays home with her kind line and the line has three heads');
  await ev((id) => { window.__paw.S.dogs.splice(window.__paw.S.dogs.findIndex((d) => d.name === 'Dot'), 1); }, null);
  await ev(() => { window.__paw.S.careOff = {}; });

  sec('8. a pack walk: Bun and Pip follow in the runner; one walk\'s pay plus 10%');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await set('energy', 90); await set('happy', 40); await set('clean', 90); await t.toasts();
  await ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__t2) { const o = W.start.bind(W); W.start = (h, op) => { window.__opts = op; return o(h, op); }; W.__t2 = true; } window.__paw.S.walks = 1; });
  await ev((c) => { window.__paw.S.dogs.find((d) => d.id === c).stats.energy = 6; }, C);
  await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart'); await t.toasts();
  ok(await p().locator('#pkWalkLine .pk-lh').count() === 2 && await ev(() => /pooped and naps this one out/.test(document.querySelector('#pkWalkLine .pk-who').textContent)), 'Pip (Energy 6) naps this one out: two heads and a kind line on the route screen');
  await p().click('#rtStart'); ok(await t.walkGate(true), 'the runner starts');
  const o1 = await ev(() => ({ n: window.__opts.pack.length, k: window.__opts.pack.map((d) => d.name), dur: window.__opts.durationSec }));
  ok(o1.n === 1 && o1.k[0] === 'Bun', 'o.pack holds Bun only: ' + JSON.stringify(o1));
  ok(await t.waitToast(/Pip is pooped and naps this one out/, 9000), 'the walk toast gives the kind line');
  ok(await ev(() => document.querySelectorAll('.pw-dog.pw-fol').length) === 1, 'one follower is drawn in the runner');
  const geo = await ev(() => { const l = document.querySelector('.pw-dog:not(.pw-fol)').getBoundingClientRect(), f = document.querySelector('.pw-fol').getBoundingClientRect(); return { fl: f.left, ll: l.left, fr: f.right, lr: l.right, ft: f.top, lt: l.top, fh: f.height, lh: l.height, idx: [...document.querySelector('.pw-stage').children].indexOf(document.querySelector('.pw-fol')) < [...document.querySelector('.pw-stage').children].indexOf(document.querySelector('.pw-dog:not(.pw-fol)')) }; });
  ok(geo.fl < geo.ll && geo.idx && geo.fh < geo.lh && geo.fh > geo.lh * 0.7 && Math.abs((geo.ft + geo.fh) - (geo.lt + geo.lh)) < 8, 'the follower trails the leader on the same ground line, a little smaller, drawn behind: ' + JSON.stringify(geo));
  const rg = await ev(() => { const art = (el) => { let b = [1e9, 1e9, -1e9, -1e9]; [...el.querySelector('.pw-pose.on svg').children].forEach((c) => { const r = c.getBoundingClientRect(); if (!r.width && !r.height) return; b = [Math.min(b[0], r.left), Math.min(b[1], r.top), Math.max(b[2], r.right), Math.max(b[3], r.bottom)]; }); return b; };
    const st = document.querySelector('.pw-stage').getBoundingClientRect(), L = art(document.querySelector('.pw-dog:not(.pw-fol)')), F = [...document.querySelectorAll('.pw-fol')].map((e) => ({ box: e.getBoundingClientRect(), a: art(e) }));
    return { inStage: F.every((f) => f.box.left >= st.left - 0.5 && f.box.right <= st.right && f.box.bottom <= st.bottom + 2), cover: Math.max(...F.map((f) => Math.max(0, Math.min(f.a[2], L[2]) - Math.max(f.a[0], L[0])) / (f.a[2] - f.a[0]))), L: L.map(Math.round), F: F.map((f) => f.a.map(Math.round)) }; });
  ok(rg.inStage && rg.cover <= 0.1, 'the follower is fully on the stage and the leader does not cover it: ' + JSON.stringify(rg));
  ok(await ev(() => document.querySelector('.pw-fol .pw-pose.on svg') !== null), 'a follower pose is showing');
  // finish the walk through the runner's own onEnd with known pay
  await set('happy', 40); await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.clean = 90; }); });
  const c0 = (await S()).coins, w0 = (await S()).walks, bw0 = await bond(), walk0 = (await acts()).walk || 0;
  await ev(() => window.__opts.onEnd({ coins: 100, happiness: 20, bond: 4, energy: 10, cleanliness: 3, treasure: { coins: 5, text: 'x' }, early: false }));
  await t.until(() => !!document.getElementById('resOk'), null, 8000);
  const c1 = (await S()).coins;
  ok(c1 - c0 === Math.round(110 * (await ev(() => 2))) || c1 - c0 === 220, 'coins: one walk (100) plus 10% = 110, times the prototype boost: +' + (c1 - c0));
  h = await stat('happy'); const bw1 = await bond(), en2 = await stat('energy');
  ok(h[0] > 55 && h[1] > 55 && near(h[2], 40), 'Mochi and Bun get the walk\'s Happiness, napping Pip does not: ' + JSON.stringify(h.map(Math.round)));
  ok(bw1[0] > bw0[0] && bw1[1] > bw0[1] && bw1[2] === bw0[2], 'Bond for each walker: ' + JSON.stringify([bw0, bw1]));
  ok(en2[0] < 85 && en2[1] < 85 && en2[2] >= 89, 'Energy for the two walkers only: ' + JSON.stringify(en2.map(Math.round)));
  ok((await S()).walks === w0 + 1 && ((await acts()).walk || 0) - walk0 === 1, 'one walk counted, one walk act');
  ok(await ev(() => /Bun walked along and got the Happiness and Bond too\. Pack bonus: \+10% coins\./.test(document.querySelector('#modal').textContent)), 'the results name the walker and the bonus');
  ok(await ev(() => document.querySelectorAll('#modal .tfind').length) === 1, 'one treasure find on the sheet');
  await p().click('#resOk'); await t.untilMode('yard'); await t.lu();
  ok(JSON.stringify(await ev(() => window.__paw.pk.walkers())) === '[]', 'the walk plan is cleared');

  sec('9. a walk with one dog ticked: o.pack is empty and the runner has no followers');
  await ev((ids) => { window.__paw.S.careOff = { [ids[0]]: true, [ids[1]]: true }; window.__paw.S.dogs.forEach((d) => { d.stats.energy = 90; }); }, [B, C]);
  await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart'); await p().click('#rtStart'); await t.walkGate(true);
  ok(await ev(() => window.__opts.pack.length) === 0 && await ev(() => document.querySelectorAll('.pw-fol').length) === 0, 'o.pack is [] and no .pw-fol');
  const cs = (await S()).coins;
  await ev(() => window.__opts.onEnd({ coins: 100, happiness: 10, bond: 2, energy: 5, cleanliness: 1, early: false })); await t.until(() => !!document.getElementById('resOk'), null, 8000);
  ok((await S()).coins - cs === 200, 'a lone walker gets exactly one walk\'s pay (100 x boost 2): +' + ((await S()).coins - cs));
  ok(await ev(() => !/walked along/.test(document.querySelector('#modal').textContent)), 'and no pack line');
  await p().click('#resOk'); await t.untilMode('yard'); await t.lu(); await ev(() => { window.__paw.S.careOff = {}; });

  sec('10. the classic walk pays the same pack bonus');
  await ev(() => { window.__PW = window.PawWalk; window.PawWalk = null; window.__paw.S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.happy = 40; }); });
  await ev(() => window.__paw.go('walk', 'park')); await t.untilMode('walk');
  ok(await ev(() => window.__paw.pk.walkers().length) === 2, 'the plan holds both ticked dogs');
  const cc0 = (await S()).coins; await ev(() => { const W = window.__paw.W; W.coins = 50; W.dist = W.len; });
  await t.until(() => !!document.getElementById('resOk'), null, 8000);
  h = await stat('happy'); ok(h.every((x) => x > 45), 'all three walkers gain Happiness in the classic walk: ' + JSON.stringify(h.map(Math.round)));
  ok(((await S()).coins - cc0) > 0 && await ev(() => /walked along/.test(document.querySelector('#modal').textContent)), 'coins paid and the pack line shown');
  await p().click('#resOk'); await t.untilMode('yard'); await t.lu(); await ev(() => { window.PawWalk = window.__PW; });

  sec('11. Wardrobe: a picker of heads, dressing a pack dog never changes the leader');
  await quiet(); await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Party Hat', 'Wizard Hat'); S.dogs.forEach((d) => { d.outfit.head = null; }); });
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await p().click('[data-act=wardrobe]'); await modalUp();
  ok(await p().locator('#modal .pk-pickb').count() === 3 && await ev((a) => document.querySelector('#modal .pk-pickb[aria-pressed="true"]').dataset.pkdog === a, A), 'the wardrobe opens with a picker of three heads, the leader picked');
  await p().click(`#modal [data-pkdog="${C}"]`);
  ok(await t.until((c) => document.querySelector(`#modal .pk-pickb[data-pkdog="${c}"]`).getAttribute('aria-pressed') === 'true', C, 2000), 'picking Pip shows her wardrobe');
  await p().click('#modal [data-eq="Party Hat"]');
  ok(await t.until((c) => window.__paw.S.dogs.find((d) => d.id === c).outfit.head === 'Party Hat', C, 2000), 'the Party Hat goes on Pip');
  let st = await S();
  ok(st.activeId === A && st.dogs[0].outfit.head === null && st.dogs[1].outfit.head === null, 'Mochi is still the leader and wears nothing, Bun too');
  ok(await ev(() => document.querySelector('#modal .pk-pickb[aria-pressed="true"]').dataset.pkdog) === C, 'the wardrobe stays on Pip after the tap');
  ok(await t.until((c) => { const g = document.querySelector(`#pack [data-dog="${c}"]`); return !!g && g.innerHTML.length > 100; }, C, 2000), 'Pip is redrawn in the yard');
  await p().click('#modal .x'); await t.modalGone();
  await p().click('[data-act=wardrobe]'); await modalUp(); await p().click('#modal [data-eq="Wizard Hat"]');
  await t.until((a) => window.__paw.S.dogs.find((d) => d.id === a).outfit.head === 'Wizard Hat', A, 2000);
  st = await S(); ok(st.dogs[0].outfit.head === 'Wizard Hat' && st.dogs[2].outfit.head === 'Party Hat', 'the leader\'s own wardrobe still works and Pip keeps her hat');
  await p().click('#modal .x'); await t.modalGone();

  sec('12. the long press on a pack dog: Make leader, Dress, Train; a tap still pets');
  await quiet(); await set('happy', 40); await t.toasts(); await t.home('yard'); await quiet();
  await t.freezeMotion(true); // the pack dogs stand still while the pointer is on them
  const pd = await ev(() => document.querySelector('#pack .packdog').dataset.dog);
  ok(/Press and hold for more/.test(await ev(() => document.querySelector('#pack .packdog').getAttribute('aria-label'))), 'the label mentions press and hold');
  await t.freezeMotion(true); // hold the pack dogs still: a long press measured mid-wander lands beside the dog
  const rect = await ev((d) => { const r = document.querySelector(`#pack [data-dog="${d}"] .pd-wander > rect`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, pd);
  await p().mouse.move(rect.x, rect.y); await p().mouse.down();
  ok(await t.until(() => !!document.getElementById('pkCard'), null, 2500), 'holding about 0.6 s opens the dog card');
  await p().mouse.up();
  ok(await ev(() => [...document.querySelectorAll('#pkCard .btn')].map((b) => b.textContent).join('|')) === 'Make leader|Dress|Train', 'the card offers Make leader, Dress and Train');
  ok(await ev(() => [...document.querySelectorAll('#pkCard .btn')].every((b) => b.getBoundingClientRect().height >= 44)), 'each button is at least 44 px tall');
  ok(await ev(() => { const c = document.getElementById('pkCard').getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect(); return c.left >= s.left && c.right <= s.right && c.top >= s.top && c.bottom <= s.bottom; }), 'the card sits inside the stage');
  st = await S(); ok(st.dogs.every((d) => d.stats.happy < 41), 'no petting came with the long press');
  await p().keyboard.press('Escape'); ok(await t.until(() => !document.getElementById('pkCard'), null, 1500), 'Escape closes the card');
  // a short tap pets and opens no card
  await p().mouse.move(rect.x, rect.y); await p().mouse.down(); await p().mouse.up(); await p().waitForTimeout(250);
  st = await S(); ok(st.dogs.some((d) => d.stats.happy > 41) && !(await ev(() => document.getElementById('pkCard'))), 'a tap pets and opens no card');
  // a move cancels the hold
  await p().mouse.move(rect.x, rect.y); await p().mouse.down(); await p().mouse.move(rect.x + 30, rect.y + 4, { steps: 3 }); await p().waitForTimeout(800); await p().mouse.up();
  ok(!(await ev(() => document.getElementById('pkCard'))), 'moving more than 10 px cancels the hold');
  // right click opens it too
  let rc = false; // an idle redraw can swap the dog's element under the click (as for the long click below), so try up to three times
  for (let i = 0; i < 3 && !rc; i++) { await p().click(`#pack [data-dog="${pd}"] .pd-wander > rect`, { button: 'right', force: true }); rc = await t.until(() => !!document.getElementById('pkCard'), null, 1500); }
  ok(rc, 'a right click opens the card too');
  await p().click('#pkCard [data-pkact="dress"]');
  const wp = await modalUp(), wsel = await ev(() => { const b = document.querySelector('#modal .pk-pickb[aria-pressed="true"]'); return b && b.dataset.pkdog; });
  ok(wp && wsel === pd, 'Dress opens the wardrobe on that dog' + (wsel === pd ? '' : ' ' + JSON.stringify([wp, wsel, pd])));
  await p().click('#modal .x'); await t.modalGone();
  await p().click(`#pack [data-dog="${pd}"] .pd-wander > rect`, { button: 'right', force: true }); await t.until(() => !!document.getElementById('pkCard'), null, 1500);
  await p().click('#pkCard [data-pkact="train"]');
  ok(await t.until((d) => !!window.__paw.train && window.__paw.train.dog === d && window.__paw.S.activeId === d, pd, 5000), 'Train opens training for that dog');
  await p().click('#trX'); ok(await t.until((a) => !window.__paw.train && window.__paw.S.activeId === a, A, 4000), 'and the leader comes back after');
  await p().click(`#pack [data-dog="${pd}"] .pd-wander > rect`, { button: 'right', force: true }); await t.until(() => !!document.getElementById('pkCard'), null, 1500);
  await p().click('#pkCard [data-pkact="lead"]');
  ok(await t.until((d) => window.__paw.S.activeId === d, pd, 4000), 'Make leader switches like a HUD chip tap');
  ok(await t.until(() => !document.getElementById('pkCard'), null, 1500), 'the card closes after a choice');
  await ev((a) => { window.__paw.switchDog(a); }, A); await t.until((a) => window.__paw.S.activeId === a, A, 3000);
  await t.freezeMotion(false);

  sec('13. a HUD chip tap during training stands: the leader is not forced back');
  await playTray(); await p().click('[data-play=tricks]'); await p().click(`#dock [data-pkdog="${B}"]`);
  await t.until((b) => !!window.__paw.train && window.__paw.S.activeId === b, B, 5000);
  await ev((c) => { window.__paw.switchDog(c); }, C);
  ok(await t.until((c) => window.__paw.S.activeId === c && !window.__paw.train, C, 4000) && !(await ev(() => window.__paw.pk.swapped())), 'switching on purpose in the middle of training keeps the new leader');
  await ev((a) => { window.__paw.switchDog(a); }, A); await t.until((a) => window.__paw.S.activeId === a, A, 3000);

  sec('14. packCare off (the harness pin): everything is v2.8.4');
  await t.ctx.close(); await t.newGame({ packCare: false }, { coins: 2000 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.S.inv.toys.push('Squeaky Duck', 'Rope Tug'); });
  await t.calm(); await t.home('yard'); await set('happy', 40);
  const lone = [(await ids())[0]];
  ok(JSON.stringify(await pk('play')) === JSON.stringify(lone) && JSON.stringify(await pk('walk', 'park')) === JSON.stringify(lone), 'pkDogs: the active dog only');
  await playTray(); ok(await p().locator('#dock .cr-chips').count() === 0, 'no chips in the Play tray');
  await p().click('[data-play=duck]'); await idle();
  h = await stat('happy'); ok(h[0] > 48 && h[1] < 40.6 && h[1] > 37 && h[2] < 40.6 && h[2] > 37, 'the Duck pleases the active dog only (the others only see the hourly decay): ' + JSON.stringify(h.map(Math.round)));
  ok(await ev(() => document.querySelectorAll('#pack .packdog.pk-tug').length) === 0, 'no pile-on');
  await playTray(); await p().click('[data-play=tricks]');
  ok(await t.until(() => !!window.__paw.train, null, 4000) && await p().locator('#dock .pk-pickb').count() === 0, 'Tricks opens training directly, no picker');
  await p().click('#trX');
  await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart');
  ok(await p().locator('#pkWalkRow').count() === 0 && await p().locator('#view .cr-chips').count() === 0, 'no chip row on the route screen');
  await ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__t2) { const o = W.start.bind(W); W.start = (h, op) => { window.__opts = op; return o(h, op); }; W.__t2 = true; } window.__paw.S.walks = 1; });
  await p().click('#rtStart'); await t.walkGate(true);
  ok(await ev(() => window.__opts.pack.length) === 0 && await ev(() => document.querySelectorAll('.pw-fol').length) === 0, 'the runner has no followers');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  const pd2 = await ev(() => document.querySelector('#pack .packdog').dataset.dog);
  // v2.10 ROAM (V210.md section 1): a tap on any dog pets that dog only, with pack care off too; the leader changes from the HUD head row
  ok(/rub or tap to pet/.test(await ev(() => document.querySelector('#pack .packdog').getAttribute('aria-label'))), 'a pack dog says rub or tap to pet');
  await t.freezeMotion(true); await set('happy', 40); const act2 = (await S()).activeId;
  for (let i = 0; i < 3; i++) { await p().click(`#pack [data-dog="${pd2}"] .pd-wander > rect`, { force: true }); await p().waitForTimeout(150); }
  st = await S(); ok(st.activeId === act2 && st.dogs.every((d) => (d.id === pd2 ? d.stats.happy > 40 : near(d.stats.happy, 40))), 'a click pets that dog only and never switches: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.happy))));
  await t.freezeMotion(false);
  await p().click('[data-act=wardrobe]'); await modalUp();
  ok(await p().locator('#modal .pk-pickb').count() === 0, 'the wardrobe has no picker');
}, { packCare: true });
