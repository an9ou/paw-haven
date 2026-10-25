// v2.15 GROUND lane phone test (iPhone 15 and Pixel 7), V215.md sections 8.3, 11 and 16: a wide place (1600 units) on a phone. The crop stays at most
// 700 world units (RM_CROP) and the camera follows the pack inside the wide world; the v2.3 look-right button gives way to the look chips, which point
// at a dog out of view (44 px or more) and pan to it; a drag looks around (from 6 px; a smaller move is a tap) and the camera waits 2 s after it; a tap
// on a pack dog pets it and brings it to the front, the camera with it; the smallest dog keeps a 44 px tap rect at the back line; the camera keeps the
// focus in view for 60 simulated seconds; nothing scrolls sideways. A deep-only place (1000 wide) keeps the v2.10 phone crop.
// node game/run_tests.js phone_v215_ground
require('./test_lib').run('phone_v215_ground', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p;
  const noSide = () => ev(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
  const vb = () => ev(() => { const v = document.querySelector('#view svg.world').viewBox.baseVal; return { x: v.x, y: v.y, w: v.width, h: v.height }; });
  const tapAt = (id) => ev((id) => { const g = document.querySelector(`#pack [data-dog="${id}"]`), h = g && g.querySelector('.pd-wander > rect'); if (!h) return null; const r = h.getBoundingClientRect(); for (let fy = 0.5; fy < 0.95; fy += 0.1) for (const fx of [0.5, 0.6, 0.4, 0.7, 0.3]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y), q = e && e.closest('[data-dog]'); if (q && q.dataset.dog === id) return { x, y }; } return null; }, id);
  const errs = [];
  for (const device of ['iPhone 15', 'Pixel 7']) {
    sec(device + ': a wide place, the crop and the camera');
    await t.newGame({ device, ground: true, prefs: { rmTest: true } }, { coins: 2000, bond: { level: 8, pts: 2000 }, stats: { hunger: 90, happy: 80, energy: 90, clean: 90 } });
    t.p.on('pageerror', (e) => errs.push(e.message));
    await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.addDog({ key: 'golden', sex: 'female', months: 20 }, 'Goldie'); });
    await t.calm();
    const W = await ev(() => Object.keys(window.PawArt.FLOOR).find((k) => window.__paw.gr.wide(k) && k === 'training') || Object.keys(window.PawArt.FLOOR).find((k) => window.__paw.gr.wide(k)));
    ok(!!W, `a wide place to test: ${W}`);
    await t.home(W); await t.luWait(800); await t.lu(); await t.sleep(500);
    const ids = (await t.S()).dogs.map((d) => d.id), [A, B, C, G] = ids;
    let v = await vb();
    ok(v.w <= 701 && v.w >= 300 && v.x >= -0.5 && v.x + v.w <= 1600.5, `${W}: the phone crop is at most 700 units (${Math.round(v.w)}) inside the 1600-wide world (x ${Math.round(v.x)})`);
    ok(await ev(() => document.documentElement.classList.contains('gr-wide') && (!document.getElementById('phPeek') || getComputedStyle(document.getElementById('phPeek')).display === 'none')), 'the look-right button gives way to the look chips (html.gr-wide)');
    ok(await noSide(), 'no sideways scroll');
    // the camera keeps the focus in view while the pack roams (the phone crop is narrower: the dead zone shrinks with it)
    const s = await ev((W) => window.__paw.gr.sim(W, 60, { seed: 21 }), W);
    ok(!s.error && !s.camOut && !s.outside.length && !s.inBox.length, `${W}: 60 simulated seconds on the phone: the focus always in the crop, feet on the floor (${s.camOut || 0} out of ${s.camSteps} camera steps)`);
    // the smallest dog at the back line keeps a 44 px tap rect
    const tiny = await ev((c) => { const R = window.__paw.rm, G = window.__paw.gr, f = G.floor(); R.pause('test'); const cam = G.cam(), q = G.snap(cam.x + cam.w / 2, f.back + 12); R.set(c, { x: q[0], y: q[1] }); const r = document.querySelector(`#pack [data-dog="${c}"] .pd-wander > rect`).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), q[1]]; }, C);
    ok(tiny[0] >= 44 && tiny[1] >= 44, `the pug (small) at the back line (y ${tiny[2]}) still has a tap rect of 44 px or more (${tiny[0]} x ${tiny[1]})`);

    sec(device + ': the look chips');
    await ev((b) => { const R = window.__paw.rm, G = window.__paw.gr, f = G.floor(), cam = G.cam(); const x = cam.x + cam.w / 2 < 800 ? f.x1 - 120 : f.x0 + 120, q = G.snap(x, (f.back + f.front) / 2 + 20); R.set(b, { x: q[0], y: q[1] }); G.hold = performance.now() + 60000; }, B);
    await t.sleep(700);
    const chip = await ev(() => { for (const id of ['rmLookL', 'rmLookR']) { const b = document.getElementById(id); if (b && !b.hidden && /Bun/.test(b.getAttribute('aria-label') || '')) { const r = b.getBoundingClientRect(); return { id, w: r.width, h: r.height, label: b.getAttribute('aria-label'), on: r.left >= 0 && r.right <= window.innerWidth }; } } return null; });
    ok(!!chip && chip.w >= 44 && chip.h >= 44 && chip.on, `a look chip points at the dog out of view (Bun), 44 px or more, on screen (${chip ? chip.id + ' ' + Math.round(chip.w) + ' x ' + Math.round(chip.h) + ': ' + chip.label : 'none'})`);
    if (chip) {
      const v0 = await vb(); await p().tap('#' + chip.id); await t.sleep(900); const v1 = await vb();
      const seen = await ev((b) => { const c = window.__paw.gr.cam(), x = window.__paw.rm.pos(b).x; return x >= c.x && x <= c.x + c.w; }, B);
      ok(Math.abs(v1.x - v0.x) > 100 && seen, `the chip pans the camera to the dog (x ${Math.round(v0.x)} -> ${Math.round(v1.x)})`);
    }
    await ev(() => { window.__paw.gr.hold = 0; window.__paw.gr.home(); });
    await t.sleep(300);

    sec(device + ': drag vs tap');
    v = await vb(); const box = await p().locator('#view svg.world').boundingBox(), cx = box.x + box.width * 0.5, cy = box.y + box.height * 0.2;
    await p().mouse.move(cx, cy); await p().mouse.down(); await p().mouse.move(cx + 3, cy, { steps: 2 }); await p().mouse.up(); await t.sleep(100);
    const v1 = await vb(); ok(Math.abs(v1.x - v.x) < 0.5 && !(await ev(() => window.__paw.gr.held())), 'a 3 px move is a tap: the camera stays and does not wait');
    const dir = v.x > 400 ? 1 : -1; // drag so the view moves into the world, not against an end
    await p().mouse.move(cx, cy); await p().mouse.down(); await p().mouse.move(cx + dir * 140, cy, { steps: 8 }); const v2 = await vb(); await p().mouse.up();
    ok(Math.abs(v2.x - v.x) > 40, `a drag looks around (x ${Math.round(v.x)} -> ${Math.round(v2.x)})`);
    ok(await ev(() => window.__paw.gr.held()), 'the camera waits after a drag');
    await t.sleep(2300); ok(!(await ev(() => window.__paw.gr.held())), 'and follows again after 2 s');
    ok(await t.until(() => { const c = window.__paw.gr.cam(), f = window.__paw.gr.focusX(); return f >= c.x && f <= c.x + c.w; }, null, 3000), 'the focus comes back into the crop');

    sec(device + ': a tap pets the touched dog only, it comes to the front, the camera with it');
    await ev((g) => { const R = window.__paw.rm, G = window.__paw.gr, f = G.floor(); R.resume('test'); R.calm(g, 9000); const cam = G.cam(), q = G.snap(cam.x + cam.w * 0.5, f.back + 50); R.set(g, { x: q[0], y: q[1] }); G.hold = performance.now() + 1200; }, G);
    await t.sleep(300);
    const before = await ev(() => window.__paw.S.dogs.map((d) => [d.id, d.stats.happy]));
    const tp = await tapAt(G);
    ok(!!tp, 'the golden at the back can be tapped');
    if (tp) {
      await p().tap('#view svg.world', { position: { x: tp.x - box.x, y: tp.y - box.y } });
      const front = await t.until((g) => { const f = window.__paw.gr.floor(), q = window.__paw.rm.pos(g); return q.y >= f.front - 52 && !window.__paw.rm.moving.includes(g); }, G, 9000);
      const q = await ev((g) => ({ p: window.__paw.rm.pos(g), cam: window.__paw.gr.cam(), happy: window.__paw.S.dogs.map((d) => [d.id, d.stats.happy]) }), G);
      ok(front && q.p.x >= q.cam.x && q.p.x <= q.cam.x + q.cam.w, `the petted dog comes to the front (y ${Math.round(q.p.y)}) and stays in the crop`);
      // a shared tick (the game clock, an arrival line's +2 Happiness) can lift every dog a little: the touched dog must gain clearly the most
      const gain = q.happy.map((h, i) => [h[0], h[1] - before[i][1]]), mine = (gain.find((g) => g[0] === G) || [G, 0])[1], other = Math.max(0, ...gain.filter((g) => g[0] !== G).map((g) => g[1]));
      ok(mine > 0 && mine > other + 0.5, `only the touched dog was petted (gains ${gain.map((g) => g[0] + ' ' + g[1].toFixed(1)).join(', ')})`);
    }
    ok(await noSide(), 'no sideways scroll');

    sec(device + ': a deep-only place keeps the v2.10 crop');
    const deep = await ev(() => Object.keys(window.PawArt.FLOOR).find((k) => window.__paw.gr.on(k) && !window.__paw.gr.wide(k)));
    if (deep) {
      await t.home(deep); await t.sleep(500); v = await vb();
      ok(v.w <= 701 && v.x >= -0.5 && v.x + v.w <= 1000.5 && !(await ev(() => document.documentElement.classList.contains('gr-wide'))), `${deep}: the crop (${Math.round(v.w)}) inside the 1000-wide scene, no wide camera`);
      ok(await noSide(), 'no sideways scroll');
    }
  }
  ok(!errs.length, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
}, { timeout: 300000 });
