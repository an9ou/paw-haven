// v2.15 GROUND lane test, V215.md sections 8, 14 (risks 3-5) and 16: the deep, wide ground and the movement model (43_ground.js, tag gr).
// For every grOn place (every PawArt.FLOOR row, plus the test floors below for the old places whose v2.15 art has not landed yet): the scene at its own
// width, the floor props sorted with the dogs, 4 dogs x 120 simulated seconds (__paw.gr.sim: a fixed step, a seeded random): feet always inside the
// polygon and outside the hard boxes (an act's own obstacle excepted), the depth scale monotonic in y, the z-order sorted, the camera keeps the focus
// in view; rmPause holds every dog; the floor area at least 1.5x the v2.10 band. Then: petting brings the touched dog to the front (and the camera to
// it), drag to look and the 2 s pause, the look chips on desktop, ball play (the feet on the polygon, the camera follows the ball), photo mode (the
// camera freezes, the picture is the window round it), the bath, the yard nap door, the Dog Card visitors and the Halloween pop-up on a deep floor.
// node game/run_tests.js v215_ground
// Test floors until GROUND ART A / B publish their PawArt.FLOOR rows (taken from the preview's polygons, docs/design/v215/preview/index.html): only
// used for a place that has no row of its own, so the suite picks up every real row automatically. The game itself reads only PawArt.FLOOR.
const FALLBACK = {
  dogpark: { w: 1600, back: 335, front: 592, poly: [[30, 335], [1570, 335], [1592, 592], [8, 592]], props: [{ id: 'aframe', base: 470, box: [700, 452, 192, 24] }, { id: 'tree', base: 488, box: [1484, 470, 30, 18] }], spots: [{ id: 'shade', x: 1530, y: 506, tags: ['shade', 'rest'], act: 'rest' }, { id: 'bowl', x: 1430, y: 548, tags: ['bowl'], act: 'drink' }] },
  yard: { w: 1000, back: 332, front: 592, poly: [[30, 332], [970, 332], [994, 592], [6, 592]], props: [], spots: [] },
  square: { w: 1000, back: 348, front: 592, poly: [[24, 348], [976, 348], [994, 592], [6, 592]], props: [], spots: [{ id: 'bench', x: 760, y: 470, tags: ['bench', 'rest'], act: 'sit' }] },
};
// the v2.10 feet bands (37_roam.js RM_ZONES, x 60 to 940): the floor area to beat
const V210 = { yard: [404, 590], house: [414, 590], square: [414, 590], cafe: [414, 590], vet: [414, 590], salon: [410, 590], hilltop: [410, 590], park: [410, 590], woods: [410, 590], market: [452, 585], dogpark: [410, 590], pier: [410, 588], river: [452, 588], beach: [452, 588], fujihill: [424, 588], default: [424, 588] };
const SHOTS = process.env.GR_SHOTS || '';
require('./test_lib').run('v215_ground', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p;
  const shot = async (n) => { if (SHOTS) await t.p.screenshot({ path: require('path').join(SHOTS, n + '.png') }); };
  const errs = []; const watch = () => { t.p.on('pageerror', (e) => errs.push(e.message)); t.p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); };
  const fallback = () => ev((FB) => { const F = window.PawArt.FLOOR; window.__grFb = []; for (const k in FB) if (!F[k]) { F[k] = FB[k]; window.__grFb.push(k); } return window.__grFb; }, FALLBACK);
  const pack = () => ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'husky', sex: 'female', months: 30 }, 'Sky'); P.addDog({ key: 'golden', sex: 'female', months: 20 }, 'Goldie'); });
  const ids = async () => (await t.S()).dogs.map((d) => d.id);
  const vb = () => ev(() => { const v = document.querySelector('#view svg.world').viewBox.baseVal; return { x: v.x, y: v.y, w: v.width, h: v.height }; });
  const tapAt = (id) => ev((id) => { const g = document.querySelector(`#pack [data-dog="${id}"]`), h = g && (g.querySelector('.pd-wander > rect') || document.getElementById('dogHit')); if (!h) return null; const r = h.getBoundingClientRect(); for (let fy = 0.5; fy < 0.95; fy += 0.1) for (const fx of [0.5, 0.6, 0.4, 0.7, 0.3]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y), q = e && e.closest('[data-dog]'); if (q && q.dataset.dog === id) return { x, y }; } return null; }, id);

  sec('0. a pack of four, the switches');
  await t.newGame({ ground: true, prefs: { rmTest: true } }, { coins: 2000, bond: { level: 8, pts: 2000 }, stats: { hunger: 90, happy: 80, energy: 90, clean: 90 } });
  watch(); await pack(); await t.calm();
  const fb = await fallback();
  const places = await ev(() => Object.keys(window.PawArt.FLOOR).filter((k) => window.__paw.gr.on(k)));
  ok(places.length >= 8, `grOn places: ${places.join(', ')} (test floors for ${fb.join(', ') || 'none'})`);
  ok(await ev(() => !window.__paw.gr.on('shibuya') && !window.__paw.gr.on('station') && !window.__paw.gr.on('shelter')), 'never Tokyo, the Station or the Shelter (GR_NO)');
  const all = await ids();

  for (const pl of places) {
    sec(`1. ${pl}: the scene, the floor, 4 dogs x 120 s`);
    await t.home(pl); await t.sleep(250);
    const info = await ev((pl) => {
      const G = window.__paw.gr, f = G.floor(pl), sc = document.querySelector('#sceneG > svg'), svg = document.querySelector('#view svg.world'), fg = document.querySelector('#sceneG #floorG');
      return { here: window.__paw.S.place, f: { w: f.w, back: f.back, front: f.front, kB: f.kB, kF: f.kF, area: f.area, props: f.props.map((p) => String(p.id)) }, scW: sc && +sc.getAttribute('width'), vbW: svg.viewBox.baseVal.width, left: fg ? fg.children.length : -1, props: G.props(), wide: G.wide(pl) };
    }, pl);
    ok(info.here === pl && info.scW === info.f.w, `${pl}: the scene is drawn at its own width (${info.scW} for a floor ${info.f.w} wide)`);
    const band = V210[pl] || V210.default, a0 = 880 * (band[1] - band[0]);
    ok(info.f.area >= 1.5 * a0, `${pl}: the floor area is at least 1.5x the v2.10 band (${Math.round(info.f.area / 1000)}k vs ${Math.round(a0 / 1000)}k, ${(info.f.area / a0).toFixed(2)}x)`);
    ok(info.wide ? info.vbW === 1000 || info.vbW < 1000 : true, `${pl}: ${info.wide ? 'wide: the desktop camera window is 1000 units' : 'deep only (1000 wide)'}`);
    const drawn = info.props.map((q) => q.id);
    ok(info.left <= 0 && info.props.every((q) => q.inPack) && (fb.includes(pl) || drawn.length > 0), `${pl}: the floor props moved into #pack to sort with the dogs (${drawn.join(', ') || 'none drawn'})`);
    // the depth scale: linear kB at the back line to kF at the front, monotonic, and rmScale = 0.88 x it
    const ds = await ev((pl) => { const G = window.__paw.gr, R = window.__paw.rm, f = G.floor(pl), out = []; for (let y = f.back; y <= f.front; y += 8) out.push([y, G.scale(pl, y), R.scale(y)]); return { out, b: G.scale(pl, f.back), fr: G.scale(pl, f.front) }; }, pl);
    ok(ds.out.every((r, i) => !i || r[1] >= ds.out[i - 1][1] - 1e-9) && Math.abs(ds.b - info.f.kB) < 1e-9 && Math.abs(ds.fr - info.f.kF) < 1e-9, `${pl}: the depth scale is monotonic in y, ${info.f.kB} at the back line to ${info.f.kF} at the front`);
    ok(ds.out.every((r) => Math.abs(r[2] - 0.88 * r[1]) < 1e-9), `${pl}: rmScale(y) = RM_BASE (0.88) x grScale(y)`);
    await t.sleep(150);
    const s = await ev((pl) => window.__paw.gr.sim(pl, 120, { seed: 11 }), pl);
    if (s.error) { ok(false, `${pl}: sim: ${s.error}`); continue; }
    ok(!s.outside.length, `${pl}: every dog's feet stay inside the floor polygon for 120 s ${s.outside.length ? JSON.stringify(s.outside.slice(0, 4)) : ''}`);
    ok(!s.inBox.length, `${pl}: and outside every hard box (an act's own obstacle excepted) ${s.inBox.length ? JSON.stringify(s.inBox.slice(0, 4)) : ''}`);
    ok(!s.scaleBad.length, `${pl}: every dog is drawn at rmScale(its feet y) x its size class ${s.scaleBad.length ? JSON.stringify(s.scaleBad.slice(0, 2)) : ''}`);
    ok(!s.depthBad && s.depthOk, `${pl}: dogs and floor props drawn back to front by feet y the whole time (${s.depthBad} unsorted checks)`);
    if (info.wide) ok(!s.camOut && s.camSteps > 100, `${pl}: the camera keeps the focus in view (${s.camOut} of ${s.camSteps} steps out; at the end x ${Math.round(s.cam.x)}, focus ${Math.round(s.focus)})`);
    const mv = Object.values(s.moved).filter((m) => m > 60).length;
    ok(mv >= 3, `${pl}: the dogs roam the floor (moved ${JSON.stringify(s.moved)}; did ${JSON.stringify(s.by)} lead ${JSON.stringify(s.lead)})`);
    if (pl === 'training' || pl === places[0]) await shot('sim_' + pl);
    // rmPause holds every dog: no new acts; a walk under way ends, then nobody moves
    const held = await ev((pl) => { const G = window.__paw.gr, R = window.__paw.rm; R.pause('test'); G.sim(pl, 14, { seed: 3 }); const a = R.dogs().map((id) => R.pos(id)); G.sim(pl, 20, { seed: 4 }); const b = R.dogs().map((id) => R.pos(id)); R.resume('test'); return a.every((q, i) => Math.abs(q.x - b[i].x) < 0.01 && Math.abs(q.y - b[i].y) < 0.01); }, pl);
    ok(held, `${pl}: rmPause holds every dog (nobody moves for 20 simulated seconds)`);
  }

  sec('2. a wide place: the camera, drag to look, the look chips, petting to the front');
  const W = places.find((k) => k === 'training') || places.find((k) => FALLBACK[k] && FALLBACK[k].w > 1000) || places[0];
  await t.home(W); await t.sleep(400);
  const fw = await ev((pl) => window.__paw.gr.floor(pl).w, W);
  let v = await vb();
  ok(v.w === 1000 && v.x >= 0 && v.x <= fw - 1000, `${W}: the desktop camera is a 1000-unit window inside the ${fw}-wide world (x ${Math.round(v.x)})`);
  ok(await ev(() => document.documentElement.classList.contains('gr-wide')), 'html.gr-wide is on in a wide place');
  // drag to look: 6 px is a drag, the camera waits 2 s after it, then follows again
  await ev(() => { window.__paw.rm.pause('test'); window.__paw.gr.home(); });
  v = await vb(); const box = await p().locator('#view svg.world').boundingBox(), cx = box.x + box.width * 0.5, cy = box.y + box.height * 0.18;
  await p().mouse.move(cx, cy); await p().mouse.down(); await p().mouse.move(cx + 3, cy, { steps: 2 }); await t.sleep(80);
  const v1 = await vb(); ok(Math.abs(v1.x - v.x) < 0.5, 'a 3 px move is not a drag (the camera stays)');
  await p().mouse.move(cx + 260, cy, { steps: 8 }); const v2 = await vb(); await p().mouse.up();
  ok(v2.x < v.x - 50 || v.x < 1, `dragging right looks left (x ${Math.round(v.x)} -> ${Math.round(v2.x)})`);
  ok(await ev(() => window.__paw.gr.held()), 'after the drag the camera waits (2 s)');
  await t.sleep(2400); ok(!(await ev(() => window.__paw.gr.held())), '... then it follows again');
  ok(await t.until(() => { const c = window.__paw.gr.cam(), f = window.__paw.gr.focusX(); return f >= c.x && f <= c.x + c.w; }, null, 3000), 'and brings the focus back into view');
  // a dog far off to one side: the look chip on desktop points at it and pans there
  const [, B, C, G] = all;
  await ev(([b, w]) => { const R = window.__paw.rm, f = window.__paw.gr.floor(); const s = window.__paw.gr.snap(f.x1 - 90, (f.back + f.front) / 2 + 30); R.set(b, { x: s[0], y: s[1] }); window.__paw.gr.look(0); window.__paw.gr.hold = performance.now() + 60000; }, [B, fw]);
  await t.sleep(900);
  const chip = await ev(() => { const b = document.getElementById('rmLookR'); if (!b || b.hidden) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, label: b.getAttribute('aria-label') }; });
  ok(!!chip && chip.w >= 44 && chip.h >= 44, `the look-right chip shows the dog out of view, 44 px or more (${chip ? Math.round(chip.w) + ' x ' + Math.round(chip.h) + ', ' + chip.label : 'none'})`);
  await shot('look_chip_' + W);
  if (chip) { const v3 = await vb(); await p().click('#rmLookR'); await t.sleep(900); const v4 = await vb(); ok(v4.x > v3.x + 100, `the chip pans there (x ${Math.round(v3.x)} -> ${Math.round(v4.x)})`); }
  await ev(() => { window.__paw.gr.hold = 0; window.__paw.rm.resume('test'); });
  // petting brings the touched dog to the front, and the camera keeps it in view
  await ev(([c]) => { const R = window.__paw.rm, G = window.__paw.gr, f = G.floor(); R.calm(c, 9000); const c0 = G.cam(); const s = G.snap(c0.x + c0.w * 0.45, f.back + 40); R.set(c, { x: s[0], y: s[1] }); G.hold = performance.now() + 1500; }, [C]);
  await t.sleep(250);
  const tp = await tapAt(C);
  ok(!!tp, 'the dog at the back can be tapped');
  if (tp) {
    await p().mouse.click(tp.x, tp.y);
    const front = await t.until((c) => { const f = window.__paw.gr.floor(), q = window.__paw.rm.pos(c); return q.y >= f.front - 52 && !window.__paw.rm.moving.includes(c); }, C, 9000);
    const q = await ev((c) => ({ p: window.__paw.rm.pos(c), f: window.__paw.gr.floor(), cam: window.__paw.gr.cam(), fx: window.__paw.gr.focusX() }), C);
    ok(front, `petting brings the touched dog to the front (feet y ${Math.round(q.p.y)}, front ${q.f.front})`);
    ok(Math.abs(q.fx - q.p.x) < 1 && q.p.x >= q.cam.x && q.p.x <= q.cam.x + q.cam.w, 'the camera follows the petted dog');
  }
  await shot('wide_four_depths_' + W);

  sec('3. ball play and photo mode in a wide and a deep place');
  for (const pl of [W, places.find((k) => !FALLBACK[k] && k !== W && !['pool'].includes(k) && true) || places[1]]) {
    await t.home(pl); await t.sleep(300);
    const st = await ev(() => window.__paw.bl.start('Tennis Ball'));
    ok(st && (await ev(() => window.__paw.bl.on)), `${pl}: ball play starts`);
    const r = await ev((pl) => {
      const B = window.__paw.bl, G = window.__paw.gr, f = G.floor(pl); B.seed(5); const out = { bad: [], x0: G.cam().x, thrown: 0, maxX: 0 };
      out.ph0 = B.state.ph; out.hx = B.state.hx; out.trail = []; B.launch(G.cam().x + G.cam().w / 2 > G.floor(pl).w / 2 ? -1600 : 1600, 700, 0); for (let i = 0; i < 40; i++) { B.sim(0.25); if (i < 10) out.trail.push([Math.round(B.state.ball.x), Math.round(G.cam().x)]); B.dogs.forEach((o) => { if (!G.inside(o.x, o.y) && !G.inside(o.x + 1, o.y) && !G.inside(o.x - 1, o.y) && out.bad.length < 5) out.bad.push([o.id, Math.round(o.x), Math.round(o.y)]); }); out.maxX = Math.max(out.maxX, Math.abs(G.cam().x - out.x0)); }
      out.n = B.state && B.state.n; out.ph = B.state && B.state.ph; return out;
    }, pl);
    ok(!r.bad.length, `${pl}: the playing dogs' feet stay on the floor polygon ${JSON.stringify(r.bad)}`);
    ok(r.n >= 1, `${pl}: a throw is fetched and returned (returns ${r.n}, phase ${r.ph})`);
    if (await ev((pl) => window.__paw.gr.wide(pl), pl)) ok(r.maxX > 60, `${pl}: the camera follows the ball (x ${Math.round(r.x0)}, moved up to ${Math.round(r.maxX)}; ${r.ph0} hx ${Math.round(r.hx)} ${JSON.stringify(r.trail)})`);
    await ev(() => window.__paw.bl.stop()); ok(!(await ev(() => window.__paw.bl.on)), `${pl}: ball play stops`);
    // photo mode: the camera freezes where it is, the picture is the 1000-wide window round it
    const can = await ev(() => window.__paw.ph.can());
    if (can) {
      await ev(() => window.__paw.ph.open()); await t.until(() => window.__paw.ph.active(), null, 4000);
      const ph = await ev(() => { const c0 = window.__paw.gr.cam(); return { held: window.__paw.gr.held(), c0, svg: String(window.__paw.ph.svg() || '') }; });
      await t.sleep(600); const c1 = await ev(() => window.__paw.gr.cam());
      ok(ph.held && Math.abs(c1.x - ph.c0.x) < 0.5, `${pl}: photo mode freezes the camera (x ${Math.round(ph.c0.x)})`);
      const m = /viewBox="(-?[\d.]+) (-?[\d.]+) 1000 /.exec(ph.svg), px = await ev(() => { const w = window.__paw.gr.floor().w, c = window.__paw.gr.cam(); return Math.max(0, Math.min(w - 1000, c.x + c.w / 2 - 500)); });
      ok(!!m && Math.abs(+m[1] - px) < 2, `${pl}: the photo shows the 1000 units round the camera (viewBox x ${m ? m[1] : '?'}, want ${Math.round(px)})`);
      await ev(() => window.__paw.ph.close()); await t.until(() => !window.__paw.ph.active(), null, 4000);
    } else ok(true, `${pl}: photo mode is not open here (phCan false)`);
  }

  sec('4. the systems on a deep floor: the bath, the yard nap door, the Dog Card visitors');
  if (await ev(() => window.__paw.gr.on('yard'))) {
    await t.home('yard'); await t.sleep(200);
    await ev(() => window.__paw.go('bath')); await t.untilMode('bath');
    ok(await ev(() => !!document.getElementById('tubG') && !!document.getElementById('dogHit') && document.querySelector('#view svg.world').viewBox.baseVal.width <= 1000), 'yard (deep floor): the bath opens (the tub and the dog, the 1000-wide stage)');
    await t.home('yard'); ok((await t.mode()) === 'yard' && await ev(() => window.__paw.gr.on('yard') && !!window.__paw.rm.zone('yard').poly), 'yard: back from the bath the deep floor is up again');
    await ev(() => { window.__paw.S.sleeping = true; window.__paw.go('yard'); }); await t.sleep(500);
    const nap = await ev(() => { const R = window.__paw.rm, q = R.pos(window.__paw.S.activeId); return { q, on: window.__paw.gr.on('yard') }; });
    ok(nap.on && nap.q.pose === 'sleep', `yard (deep floor): the leader naps (pose ${nap.q.pose} at ${Math.round(nap.q.x)}, ${Math.round(nap.q.y)})`);
    await ev(() => { window.__paw.S.sleeping = false; }); await t.home('yard');
    const hz = await ev(() => { window.__paw.rm.scan(); const z = window.__paw.rm.zone('yard'); return { y0: z.y0, poly: !!z.poly, house: (z.no || []).some((b) => b[0] === 620 && b[1] === 330) || !!document.getElementById('houseG') }; });
    ok(hz.poly && hz.y0 < 404 && hz.house, `yard: the deep floor (back line ${hz.y0}, was 404) keeps the dog house a no-go box`);
  }
  if (await ev(() => window.__paw.gr.on('dogpark'))) {
    await t.home('dogpark'); await t.until(() => window.__paw.dc.visitors().length > 0, null, 5000);
    const vis = await ev(() => window.__paw.dc.visitors().map((v) => [Math.round(v.x), Math.round(v.y), window.__paw.gr.inside(v.x, v.y)]));
    ok(vis.length > 0 && vis.every((v) => v[2]), `dogpark: the Dog Card visitors stand on the floor polygon ${JSON.stringify(vis)}`);
    const c = await ev(() => window.__paw.gr.cam()); ok(vis.every((v) => v[0] >= c.x - 40 && v[0] <= c.x + c.w + 40), `dogpark: and inside the camera's window (x ${Math.round(c.x)} to ${Math.round(c.x + c.w)})`);
  }
  ok(!errs.length, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));

  sec('5. the Halloween pop-up in the Square on a deep floor');
  await t.newGame({ ground: true, fest: 'auto', season: 'autumn', date: '2026-10-20', prefs: { rmTest: true, hwTest: true } }, { coins: 2000, bond: { level: 8, pts: 2000 } });
  watch(); await pack(); await t.calm(); await fallback();
  if (await ev(() => window.__paw.gr.on('square'))) {
    await t.home('square'); await t.sleep(500);
    const hw = await ev(() => { const g = document.getElementById('hwPopG'); window.__paw.rm.scan(); const no = window.__paw.rm.zone('square').no; return { pop: !!g, inNo: no.some((b) => b[4] === 'prop' || b[4] === 'hot' || b[4] === 'hwPopG'), s: window.__paw.gr.sim('square', 40, { seed: 9 }) }; });
    ok(hw.pop, 'square: the Pumpkin Patch Pop-up is up on the deep floor');
    ok(!hw.s.outside.length && !hw.s.inBox.length, `square: 40 s of roaming keep off the pop-up and the fountain ${JSON.stringify(hw.s.inBox.slice(0, 3))}`);
  }
  ok(!errs.length, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
}, { timeout: 420000 });
