// v2.9 PACK lane phone test (iPhone 15 and Pixel 7), V29.md sections 1 and 5: the Play tray chip row, the Tricks and Wardrobe pickers and the route screen pass the phone
// minimums (44 px taps, 15 px names, nothing sideways), the Play tray leaves the dog uncovered, the runner shows the followers inside its strip, and the long press card
// works with a finger and fits the stage.
// node game/run_tests.js phone_v29_pack
require('./test_lib').run('phone_v29_pack', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p, S = () => t.S();
  const noSide = () => ev(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
  const quiet = async () => { await t.luWait(1200); await t.lu(); };
  const modalUp = () => t.until(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), null, 5000);
  const settled = () => t.until(() => { const tr = document.querySelector('#dock > .tray'); return !!tr && tr.getAnimations({ subtree: true }).every((a) => a.playState !== 'running'); }, null, 3000);
  // the chips inside `root`: heights, name sizes, heads, and that the row lies inside its container
  const chipCheck = (sel, box) => ev(([sel, box]) => {
    const row = document.querySelector(sel), cont = document.querySelector(box); if (!row || !cont) return { miss: true };
    const cr = cont.getBoundingClientRect(), rr = row.getBoundingClientRect();
    const chips = [...row.querySelectorAll('.cr-chip')].map((b) => { const r = b.getBoundingClientRect(); return { h: Math.round(r.height), f: parseFloat(getComputedStyle(b.querySelector('.cr-name')).fontSize), head: !!b.querySelector('.cr-head svg') }; });
    return { n: chips.length, chips, inside: rr.left >= cr.left - 1 && rr.right <= cr.right + 1 };
  }, [sel, box]);
  const chipsOk = (c) => !c.miss && c.n >= 2 && c.inside && c.chips.every((x) => x.h >= 44 && x.f >= 15 && x.head);
  for (const device of ['iPhone 15', 'Pixel 7']) {
    sec(device + ': the Play tray with three dogs');
    await t.newGame({ device }, { coins: 2000 });
    await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'samoyed', sex: 'female', months: 30 }, 'Clementine'); P.S.inv.toys.push('Squeaky Duck', 'Rope Tug'); P.S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.happy = 40; }); });
    await t.calm(); await t.home('yard'); await quiet();
    const [A, B, C] = (await S()).dogs.map((d) => d.id);
    await p().click('[data-act=play]'); await t.waitPop(true); await settled(); await t.SH(device.replace(' ', '') + '_play');
    let c = await chipCheck('#dock .cr-chips', '#dock > .tray');
    ok(chipsOk(c) && c.n === 3, 'Play tray chips: 3, each at least 44 px tall, names at least 15 px, a head each, inside the tray ' + JSON.stringify(c));
    ok(await noSide(), 'no sideways scroll with the Play tray open');
    const cover = await ev(() => { const h = document.getElementById('dogHit').getBoundingClientRect(), tr = document.querySelector('#dock > .tray').getBoundingClientRect(); return { dogBottom: Math.round(h.bottom), trayTop: Math.round(tr.top), covered: h.bottom > tr.top + 2 && h.top < tr.bottom }; });
    ok(!cover.covered || cover.dogBottom - cover.trayTop < 12, 'the tray leaves the dog uncovered ' + JSON.stringify(cover));
    ok(await ev(() => [...document.querySelectorAll('#dock .row .card')].every((b) => { const r = b.getBoundingClientRect(); return r.height >= 44 && r.width >= 44; })), 'the play cards keep their 44 px taps');
    await p().click(`#dock [data-crdog="${C}"]`); await t.until((x) => document.querySelector(`#dock [data-crdog="${x}"]`).getAttribute('aria-pressed') === 'false', C, 2000);
    await p().click('[data-play=duck]'); await t.until(() => !window.__paw.shop.busy, null, 8000);
    const h = (await S()).dogs.map((d) => d.stats.happy);
    ok(h[0] > 48 && h[1] > 48 && h[2] < 41, 'a tap on the chip row and the Duck: the ticked dogs gain, Clementine does not ' + JSON.stringify(h.map(Math.round)));
    await ev(() => { window.__paw.S.careOff = {}; });

    sec(device + ': the Tricks picker');
    await t.home('yard'); await quiet(); await p().click('[data-act=play]'); await t.waitPop(true); await p().click('[data-play=tricks]');
    await t.until(() => document.querySelectorAll('#dock .pk-pickb').length === 3, null, 3000); await settled(); await t.SH(device.replace(' ', '') + '_tricks');
    c = await ev(() => { const row = document.querySelector('#dock .pk-pick'), cont = document.querySelector('#dock > .tray'); const cr = cont.getBoundingClientRect(), rr = row.getBoundingClientRect(); return { inside: rr.left >= cr.left - 1 && rr.right <= cr.right + 1, chips: [...row.querySelectorAll('.pk-pickb')].map((b) => ({ h: Math.round(b.getBoundingClientRect().height), f: parseFloat(getComputedStyle(b.querySelector('.cr-name')).fontSize), head: !!b.querySelector('.cr-head svg') })) }; });
    ok(c.inside && c.chips.length === 3 && c.chips.every((x) => x.h >= 44 && x.f >= 15 && x.head), 'picker chips: 44 px, 15 px, heads, inside the tray ' + JSON.stringify(c));
    await p().click(`#dock [data-pkdog="${B}"]`);
    ok(await t.until((b) => !!window.__paw.train && window.__paw.S.activeId === b, B, 6000), 'a tap on Bun starts training for Bun');
    await t.SH(device.replace(' ', '') + '_training');
    ok(await ev(() => { const tp = document.getElementById('trainPanel').getBoundingClientRect(); return tp.width > 0 && tp.right <= window.innerWidth + 1; }), 'the training panel fits the screen');
    await p().click('#trX'); ok(await t.until((a) => !window.__paw.train && window.__paw.S.activeId === a, A, 4000), 'and the leader is back after');

    sec(device + ': Tug and Fetch: the pack piles on by the rope, the followers stay in view');
    await t.home('yard'); await quiet(); await ev(() => { const P = window.__paw; delete P.S['toyAt_Rope Tug']; P.S.dogs.forEach((d) => { d.stats.energy = 90; }); });
    await p().click('[data-act=play]'); await t.waitPop(true); await p().click('[data-play=tug]');
    await t.until(() => document.querySelectorAll('#pack .packdog.pk-tug').length === 2, null, 2000); await p().waitForTimeout(550); await t.SH(device.replace(' ', '') + '_tug');
    const ART = () => { const svg = document.querySelector('#view svg.world'), M = svg.getScreenCTM().inverse(); return (el) => { const s = el.querySelector('svg.pa-dog') || el.querySelector('svg'); let b = [1e9, 1e9, -1e9, -1e9]; [...s.children].forEach((c) => { const r = c.getBoundingClientRect(); if (!r.width && !r.height) return; const a = new DOMPoint(r.left, r.top).matrixTransform(M), z = new DOMPoint(r.right, r.bottom).matrixTransform(M); b = [Math.min(b[0], a.x), Math.min(b[1], a.y), Math.max(b[2], z.x), Math.max(b[3], z.y)]; }); return b.map(Math.round); }; };
    const tg = await ev((src) => { const box = eval(src)(), L = box(document.getElementById('dogArt')); return { L, D: [...document.querySelectorAll('#pack .packdog.pk-tug')].map(box) }; }, ART.toString());
    ok(tg.D.length === 2 && tg.D.every((d) => d[0] < tg.L[0] && d[2] >= tg.L[0] - 30 && d[3] >= tg.L[3] - 110 && d[3] <= tg.L[3] + 30 && d[0] >= 222), 'Tug: both crouch in a pile right behind the leader, off the veggie bed ' + JSON.stringify(tg));
    await t.until(() => !window.__paw.shop.busy, null, 8000); await t.toasts();
    await ev(() => window.__paw.go('fetch', 'Tennis Ball')); await t.untilMode('fetch'); await t.until(() => document.querySelectorAll('#pkFol .pk-fl').length === 2, null, 3000); await p().waitForTimeout(300);
    const fg = await ev((src) => { const box = eval(src)(), L = box(document.getElementById('dogArt')), els = [...document.querySelectorAll('#pkFol .pk-fl')], F = els.map(box), v = document.getElementById('view').getBoundingClientRect();
      const ov = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])), ar = (a) => (a[2] - a[0]) * (a[3] - a[1]);
      return { inView: els.every((e) => { const r = e.querySelector('svg.pa-dog').getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1 && r.top >= v.top - 1 && r.bottom <= v.bottom + 1; }), bed: Math.min(...F.map((f) => f[0])), lead: +Math.max(...F.map((f) => ov(f, L) / ar(f))).toFixed(2), pair: +(ov(F[0], F[1]) / Math.min(ar(F[0]), ar(F[1]))).toFixed(2) }; }, ART.toString());
    await t.SH(device.replace(' ', '') + '_fetch');
    ok(fg.inView && fg.bed >= 222 && fg.lead <= 0.25 && fg.pair <= 0.12, 'Fetch: both followers in view, off the veggie bed, apart and not hidden by the leader ' + JSON.stringify(fg));
    await p().click('#fQuit'); await t.until(() => !!document.getElementById('fOk'), null, 5000); await p().click('#fOk'); await t.untilMode('yard'); await quiet();

    sec(device + ': the route screen');
    await t.home('yard'); await quiet(); await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart'); await t.until(() => document.querySelectorAll('#pkWalkLine .pk-lh').length === 3, null, 3000);
    await t.SH(device.replace(' ', '') + '_routes');
    c = await chipCheck('#view .cr-chips', '#view .routes');
    ok(chipsOk(c) && c.n === 3, 'route chips: 44 px, 15 px, heads, inside the screen ' + JSON.stringify(c));
    ok(await ev(() => [...document.querySelectorAll('#pkWalkLine .pk-lh')].every((e) => e.getBoundingClientRect().height >= 28)), 'the three heads in the line are drawn');
    ok(await ev(() => parseFloat(getComputedStyle(document.querySelector('#pkWalkLine .pk-who')).fontSize) >= 15), 'the line of text is at least 15 px');
    ok(await noSide(), 'no sideways scroll on the route screen');
    const vis = await ev(() => { const b = document.getElementById('rtStart').getBoundingClientRect(), f = document.querySelector('.rt-foot').getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), vh: window.innerHeight, footBottom: Math.round(f.bottom) }; });
    ok(vis.bottom <= vis.vh && vis.h >= 44, 'Start walk stays on screen and tappable ' + JSON.stringify(vis));
    ok(await ev(() => { const cards = [...document.querySelectorAll('.rt-card.cur')]; const cr = cards[0] && cards[0].getBoundingClientRect(), row = document.getElementById('pkWalkRow').getBoundingClientRect(); return !cr || cr.bottom <= row.top + 2; }), 'the chip row does not cover the route card');

    sec(device + ': the runner with followers');
    await ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__t3) { const o = W.start.bind(W); W.start = (h2, op) => { window.__opts = op; return o(h2, op); }; W.__t3 = true; } window.__paw.S.walks = 1; });
    await p().click('#rtStart'); ok(await t.walkGate(true), 'the runner starts');
    ok(await ev(() => window.__opts.pack.length) === 2 && await ev(() => document.querySelectorAll('.pw-fol').length) === 2, 'two followers drawn');
    await t.SH(device.replace(' ', '') + '_runner');
    // v2.9 review: every follower fully on the strip (no slack at the left edge), none under the leader, clear of the controls; the same at 360 px wide
    const runGeo = () => ev(() => {
      const art = (el) => { let b = [1e9, 1e9, -1e9, -1e9]; [...el.querySelector('.pw-pose.on svg').children].forEach((c) => { const r = c.getBoundingClientRect(); if (!r.width && !r.height) return; b = [Math.min(b[0], r.left), Math.min(b[1], r.top), Math.max(b[2], r.right), Math.max(b[3], r.bottom)]; }); return b; };
      const st = document.querySelector('.pw-stage').getBoundingClientRect(), Lel = document.querySelector('.pw-dog:not(.pw-fol)'), L = Lel.getBoundingClientRect(), La = art(Lel);
      const f = [...document.querySelectorAll('.pw-fol')].map((e) => ({ r: e.getBoundingClientRect(), a: art(e) })), hud = [...document.querySelectorAll('.pw-hud,.pw-ctrls,.pw-legend')].map((e) => e.getBoundingClientRect());
      const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top && b.width > 0;
      return { inStage: f.every((x) => x.r.left >= st.left - 0.5 && x.r.right <= st.right && x.r.top >= st.top && x.r.bottom <= st.bottom + 2), behind: f.every((x) => x.r.left < L.left),
        cover: +Math.max(...f.map((x) => Math.max(0, Math.min(x.a[2], La[2]) - Math.max(x.a[0], La[0])) / (x.a[2] - x.a[0]))).toFixed(2), overHud: f.some((x) => hud.some((h2) => hit(x.r, h2))), n: f.length, left: f.map((x) => Math.round(x.r.left)), leader: [Math.round(La[0]), Math.round(La[2])] };
    });
    let g = await runGeo();
    ok(g.inStage && g.behind && g.cover <= 0.1 && !g.overHud, 'the followers trail the leader fully inside the strip, uncovered and clear of the controls ' + JSON.stringify(g));
    if (device === 'Pixel 7') {
      const vp = p().viewportSize(); await p().setViewportSize({ width: 360, height: 740 }); await p().waitForTimeout(400); await t.SH('360_runner');
      g = await runGeo(); ok(g.inStage && g.behind && g.cover <= 0.1 && !g.overHud, '360 px wide: the same ' + JSON.stringify(g));
      await p().setViewportSize(vp); await p().waitForTimeout(300);
    }
    await ev(() => window.__opts.onEnd({ coins: 40, happiness: 10, bond: 2, energy: 4, cleanliness: 1, early: false })); await t.until(() => !!document.getElementById('resOk'), null, 8000);
    await t.SH(device.replace(' ', '') + '_results');
    ok(await ev(() => /walked along/.test(document.querySelector('#modal').textContent)) && await noSide(), 'the results sheet names the walkers and fits');
    await p().click('#resOk'); await t.untilMode('yard'); await t.lu();

    sec(device + ': the Wardrobe picker');
    await quiet(); await ev(() => { window.__paw.S.inv.clothes.push('Party Hat'); });
    await p().click('[data-act=wardrobe]'); await modalUp(); await t.SH(device.replace(' ', '') + '_wardrobe');
    c = await ev(() => { const row = document.querySelector('#modal .pk-pick'), cont = document.querySelector('#modal .panel'); const cr = cont.getBoundingClientRect(), rr = row.getBoundingClientRect(); return { inside: rr.left >= cr.left - 1 && rr.right <= cr.right + 1, chips: [...row.querySelectorAll('.pk-pickb')].map((b) => ({ h: Math.round(b.getBoundingClientRect().height), f: parseFloat(getComputedStyle(b.querySelector('.cr-name')).fontSize), head: !!b.querySelector('.cr-head svg') })) }; });
    ok(c.inside && c.chips.length === 3 && c.chips.every((x) => x.h >= 44 && x.f >= 15 && x.head), 'wardrobe picker chips: 44 px, 15 px, heads, inside the sheet ' + JSON.stringify(c));
    await p().click(`#modal [data-pkdog="${C}"]`); await t.until((x) => document.querySelector(`#modal .pk-pickb[data-pkdog="${x}"]`).getAttribute('aria-pressed') === 'true', C, 2000);
    await p().click('#modal [data-eq="Party Hat"]'); ok(await t.until((x) => window.__paw.S.dogs.find((d) => d.id === x).outfit.head === 'Party Hat', C, 2000) && (await S()).activeId === A, 'a tap dresses Clementine, Mochi stays the leader');
    ok(await noSide(), 'no sideways scroll in the wardrobe');
    await p().click('#modal .x'); await t.modalGone();

    sec(device + ': the long press with a finger');
    await quiet(); await t.home('yard'); await quiet(); await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.happy = 40; }); }); await t.freezeMotion(true);
    const pd = await ev(() => document.querySelector('#pack .packdog').dataset.dog);
    const pt = await ev((d) => { const r = document.querySelector(`#pack [data-dog="${d}"] .pd-wander > rect`).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }, pd);
    const cdp = await t.ctx.newCDPSession(p());
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
    ok(await t.until(() => !!document.getElementById('pkCard'), null, 2500), 'holding a finger about 0.6 s opens the dog card');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await t.SH(device.replace(' ', '') + '_card');
    const cd = await ev(() => { const c2 = document.getElementById('pkCard').getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect(); return { inside: c2.left >= s.left && c2.right <= s.right && c2.top >= s.top && c2.bottom <= s.bottom, btns: [...document.querySelectorAll('#pkCard .btn')].map((b) => ({ h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width), f: parseFloat(getComputedStyle(b).fontSize) })) }; });
    ok(cd.inside && cd.btns.length === 3 && cd.btns.every((b) => b.h >= 44 && b.w >= 44 && b.f >= 15), 'the card fits the stage, three buttons at 44 px and 15 px ' + JSON.stringify(cd));
    const hp = (await S()).dogs.map((d) => d.stats.happy);
    ok(hp.every((x) => x < 41), 'the finger lifting after the hold did not pet ' + JSON.stringify(hp.map(Math.round)));
    await p().tap('#pkCard [data-pkact="lead"]');
    ok(await t.until((d) => window.__paw.S.activeId === d, pd, 4000) && !(await ev(() => document.getElementById('pkCard'))), 'a tap on Make leader switches and closes the card');
    await ev((a) => { window.__paw.switchDog(a); }, A); await t.until((a) => window.__paw.S.activeId === a, A, 3000);
    await t.freezeMotion(false);
    // a quick tap still pets
    await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.happy = 40; }); }); await t.home('yard');
    const pd2 = await ev(() => document.querySelector('#pack .packdog').dataset.dog);
    const pt2 = await ev((d) => { const r = document.querySelector(`#pack [data-dog="${d}"] .pd-wander > rect`).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }, pd2);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt2.x, y: pt2.y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p().waitForTimeout(300);
    ok((await S()).dogs.some((d) => d.stats.happy > 41) && !(await ev(() => document.getElementById('pkCard'))), 'a quick tap pets and opens no card');
    await cdp.detach();
  }
}, { device: 'iPhone 15', packCare: true });
