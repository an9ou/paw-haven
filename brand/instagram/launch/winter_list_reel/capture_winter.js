// The "Noodle's Winter Market shopping list" Reel (owner's go-ahead 18 Nov 2026; docs/marketing/WINTER_LIST_REEL.md): the game footage.
// One continuous take of the real Winter Market place ('fmarket' dressed for winter, main's own scene) with Noodle the dachshund as the game's own
// leader dog, from a fresh worktree of origin/main (game/test_merged.html: node game/build.js && node game/harness.js merged) with the test harness
// (game/test_lib.js), the game date pinned to 23 Nov 2026 (the Winter Market's first day), sunny, by day. Nothing in main changes.
//
// The take is captured on the frozen page clock (../frozen_clock.js, owner 17 Nov 2026): freezeClock, then stepClock(t0 + n x 1000/30) before every
// screenshot, then releaseClock. Never real-time seek + screenshot. The game's own timers are stopped first, so only the stepped clock moves the
// scene: the roam walk (rAF), the dog art's CSS animations and the faces. Noodle is driven through the game's own hooks: __paw.idle.pin (pose),
// __paw.rm.set / rm.to (facing, the walk), __paw.ex.show (the face, PawArt expr), S.dog.outfit (the Polar Bear Hood try-on).
//
// The camera is a window on the game's svg.world (viewBox 0 0 1000 600) at S = 1.9 px a world unit: 568 x 1010 units in 1080 x 1920, Noodle's feet
// (the market's front row, y 586) on the Reel's feet line y 1425. The scene's 600 units fill y 312..1452 of the frame; above it its flat sky colour
// and below it its flat snow colour go on (the market's floor is the bottom of its drawing, and the safe zone ends at y 1440), and on the toy stop
// the same two colours go on for about 70 units past the scene's right edge (the scene's own far hill is drawn that far). Hidden: the stall hint glow,
// the HUD, toasts and speech bubbles (they are HTML, under the scene here).
//
// plan(VOD) is the one timeline for this script and build_winter.js: the beats from the voice lines (each card = its line + 0.4 s, 0.15 s pauses),
// the camera's x per time and Noodle's cues. The hook beat is as long as the longer of the two hook lines ("opens tonight" / "is open"), so the
// second hook variant re-renders only the hook frames.
//
//   git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
//   VO_LINES=brand/instagram/launch/winter_list_reel/vo_winter.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/capture_winter.js <main checkout> <caps dir> <vo dir>
// Writes <caps>/seq/f00000.png ... (1080 x 1920, the scene with Noodle), <caps>/facts.json (per frame: the camera, Noodle's drawn box, feet, pose,
// face, walking; the game's own words and numbers for the facts) and <caps>/items/*.svg (the game's item drawings, PawArt.item).
const path = require('path'), fs = require('fs');
const FPS = 30, W = 1080, H = 1920, S = 1.9, FEET = 1425, FLOOR_Y = 586, OY = FEET - FLOOR_Y * S;
const NX = 501;                       // Noodle's spot: the open snow between the Homes stand and the Treats cart (the game's own leader spot is 500, 586)
const TOYX = 830;                     // his spot in front of the Toys stall, right of the Treats cart
const CAM_C = NX - 455 / S;           // the camera's left edge with Noodle on the safe zone's middle (x 455)
const CAM = { c: CAM_C, homes: CAM_C - 28, toys: 499, treats: 300, decor: 166 };
const WALK = 200;                     // world units a second (the game walks at 150 and runs at 360)
const ITEMS = [
  { k: 'k1', n: 'Gingerbread Kennel', kind: 'houses', price: 900 },
  { k: 'k2', n: 'Polar Bear Hood', kind: 'clothes', price: 80 },
  { k: 'k3', n: 'Snowball Ball', kind: 'toys', price: 45 },
  { k: 'k4', n: 'Frozen Yoghurt Snowballs', kind: 'food', price: 9 },
  { k: 'k5', n: 'Star Lantern', kind: 'decor', price: 110 },
];
const SCARF = { neck: 'Autumn Scarf' }, HOOD = { neck: 'Autumn Scarf', body: 'Polar Bear Hood' };
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

function plan(VOD) {
  const KEYS = ['hook', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'ask'], PAUSE = 0.15, EXTRA = { k6: 0.6, ask: 0.6 };
  const dur = (k) => (k === 'hook' ? Math.max(VOD.hook, VOD.hook_open) : VOD[k]);
  const beats = []; let at = 0.1; const B = {};
  for (const k of KEYS) { const hold = dur(k) + 0.4 + (EXTRA[k] || 0); beats.push({ k, at, hold }); B[k] = at; at += hold + PAUSE; }
  const LOOP = at - PAUSE + 0.2, T = LOOP + 2.5, NF = Math.round(T * FPS), NCAP = Math.min(NF, Math.ceil((LOOP + 0.5) * FPS));
  const walkSecs = (TOYX - NX) / WALK;
  // the list's ticks (seconds from each beat's start) and the moments the faces land
  const TICK = { k1: 1.3, k2: 1.0, k3: 0.1 + walkSecs + 0.2, k4: 0.1 + walkSecs + 0.65, k5: 1.4, k6: 1.25 };
  // Noodle's cues: { t, pose, face, expr, outfit } sets him at once; { t, walk: x } starts a real walk (the game's rm.to), `then` is set on arrival
  const cues = [
    { t: 0, at: [NX, FLOOR_Y], pose: 'dance', face: 'right', expr: null, outfit: SCARF },
    { t: B.k1, pose: 'beg', face: 'left', expr: 'hearts' },
    { t: B.k2, pose: 'idle', face: 'right', expr: null },
    { t: B.k2 + 0.3, pose: 'happy', face: 'right', expr: null, outfit: HOOD },
    { t: B.k2 + 1.45, pose: 'bow', face: 'right', expr: 'proud' },
    { t: B.k3, pose: 'idle', face: 'right', expr: null, outfit: SCARF },
    { t: B.k3 + 0.1, walk: TOYX, then: { pose: 'bow', face: 'right', expr: 'zoomies' } },
    { t: B.k4, pose: 'idle', face: 'left', expr: null },
    { t: B.k4 + 0.1, walk: NX, then: { pose: 'idle', face: 'right', expr: null } },
    { t: B.k4 + 0.1 + walkSecs + 0.25, pose: 'idle', face: 'right', expr: 'yum' },
    { t: B.k5, pose: 'idle', face: 'left', expr: null },
    { t: B.k5 + 0.45, pose: 'idle', face: 'left', expr: 'wow' },
    { t: B.k6, pose: 'idle', face: 'right', expr: null },
    { t: B.k6 + 1.15, pose: 'down', face: 'right', expr: 'guilty' },
    { t: B.ask, pose: 'idle', face: 'right', expr: 'curious' },
  ];
  // the camera's left edge (world units): eased pans between the stops, the two walks tracked, and between them a slow creep to the right
  // (CREEP units a second, about 0.13 px a frame), so the picture is never quite still and no two frames are alike
  const CREEP = 2, K = [[0, CAM.c - 4]]; let kt = 0, kx = CAM.c - 4;
  const hold = (t1) => { kx += CREEP * (t1 - kt); kt = t1; K.push([t1, kx, 0]); }, move = (secs, x) => { kt += secs; kx = x; K.push([kt, x, 1]); };
  hold(B.k1); move(0.6, CAM.homes); hold(B.k2); move(0.5, CAM.c - 2); hold(B.k3 + 0.1); move(walkSecs, CAM.toys); hold(B.k4 + 0.1); move(walkSecs, CAM.treats);
  hold(B.k5); move(0.7, CAM.decor); hold(B.k6); move(0.6, CAM.c - 6); hold(T + 1);
  const cam = (t) => { let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++; const [t0, a] = K[i], [t1, b, eased] = K[i + 1], u = Math.max(0, Math.min(1, (t - t0) / Math.max(1e-6, t1 - t0)));
    return eased ? a + (b - a - CREEP * (t1 - t0)) * sm(u) + CREEP * (Math.min(Math.max(t, t0), t1) - t0) : a + (b - a) * u; };   // a pan starts and ends at the creep's speed
  return { FPS, W, H, S, OY, FEET, beats, B, LOOP, T, NF, NCAP, TICK, cues, cam, walkSecs, PAUSE };
}
module.exports = { plan, ITEMS, S, OY, FEET, FLOOR_Y, NX, TOYX, CAM, FPS, W, H };

if (require.main === module) {
  const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'winter_caps'), VO = path.resolve(process.argv[4] || path.join(OUT, '..', 'vo'));
  for (const d of ['seq', 'items']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const { run } = require(path.join(DEV, 'game', 'test_lib'));
  const { freezeClock, stepClock, releaseClock } = require('../frozen_clock.js');
  const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), P = plan(VOJ.dur);
  const DATE = process.env.CAP_DATE || '2026-11-23';
  // the scene on top of the page at 540 x 960 CSS px (captured at 2x), the hint glow off; the sky and snow colours go on around the drawing
  const VIEW = '#view svg.world{position:fixed!important;left:0!important;top:0!important;width:540px!important;height:960px!important;max-width:none!important;max-height:none!important;'
    + 'z-index:2147483000!important;transform:none!important;margin:0!important}[class$="-hl"],#bowlG,#messG,#zzz,#ballLayer{display:none!important}#toasts,#devBtn{display:none!important}'
    + '#view,#view *{overflow:visible!important}';
  run('winter_capture', async (t) => {
    const { ev } = t, p = () => t.p, facts = { date: DATE, S, OY, frames: [] };
    const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
    const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
    // prefs.fmTest: the festival markets under the harness (49_market.js fmOn); prefs.exTest: the faces (41_expressions.js exOn)
    await t.newGame({ map215: true, ground: true, prefs: { fmTest: true, exTest: true }, time: 'day', weather: 'sunny', head: '~Dachshund', sex: 'boy' }, { coins: 3000, dog: { name: 'Noodle' } });
    // a 1280 x 980 page at 2 device px a CSS px, set once: the scene (540 x 960 CSS px) is then shot inside the viewport at 1080 x 1920, and nothing
    // resizes the page during the take (a capture beyond the viewport does, and the game draws the scene again on a resize)
    const cdp = await t.ctx.newCDPSession(p());
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 980, deviceScaleFactor: 2, mobile: false }); await p().waitForTimeout(600);
    await t.calm(); await t.lu(); await settle();
    // ---- the facts, from the running game on that date ----
    facts.jst = await ev(() => window.__paw.rh.jst());
    facts.open = await ev(() => window.__paw.fm.open()); facts.main = await ev(() => window.__paw.fm.main());
    if (facts.jst !== DATE || facts.main !== 'winter') throw new Error('the Winter Market is not the open market on ' + DATE + ': ' + JSON.stringify([facts.jst, facts.open, facts.main]));
    facts.items = await ev((names) => { const M = window.__paw.fm.markets.find((m) => m.id === 'winter'), all = [].concat(...Object.values(M.items));
      return names.map((n) => ({ n, onSale: all.includes(n), cat: Object.keys(M.items).find((c) => M.items[c].includes(n)) })); }, ITEMS.map((i) => i.n));
    facts.winterCount = await ev(() => { const M = window.__paw.fm.markets.find((m) => m.id === 'winter'); return Object.fromEntries(Object.entries(M.items).map(([c, l]) => [c, l.length])); });
    facts.harvest = await ev(() => window.__paw.fm.markets.find((m) => m.id === 'harvest').items);
    for (const it of ITEMS) fs.writeFileSync(path.join(OUT, 'items', it.k + '.svg'), await ev((n) => window.PawArt.item(n), it.n));
    // ---- the Winter Market place ----
    await t.home('fmarket'); await p().waitForTimeout(1500); await closeAll();
    facts.place = await ev(() => ({ place: window.__paw.S.place, name: window.__paw.placeName('fmarket'), vb: document.querySelector('#view svg.world').getAttribute('viewBox'),
      sign: (document.querySelector('#view svg.world [data-fm="fmscene"]') || document.querySelector('#view svg.world')).textContent.replace(/\s+/g, ' ').trim().slice(0, 200),
      stalls: [...document.querySelectorAll('#view svg.world .hot[aria-label]')].map((e) => e.getAttribute('aria-label')), zone: window.__paw.rm.zone('fmarket') }));
    console.log('place', JSON.stringify(facts.place).slice(0, 600));
    if (facts.place.place !== 'fmarket' || facts.place.vb !== '0 0 1000 600' || !/Winter Market/.test(facts.place.name)) throw new Error('not the Winter Market place');
    const id = await ev(() => window.__paw.S.dog.id);
    await p().addStyleTag({ content: VIEW });
    // the game's own timers stop here (idle ticks, toasts, autosave): from now on only the stepped clock moves the scene
    await ev(([sky, snow, id]) => {
      const top = setTimeout(() => {}, 0); for (let i = 1; i <= top + 50; i++) { clearTimeout(i); clearInterval(i); }
      window.setTimeout = () => 0; window.setInterval = () => 0;   // and none start again during the take (a face would end on the real clock, the idle tick would redraw the scene)
      const NS = 'http://www.w3.org/2000/svg';
      // the sky and the snow go on around the drawing; put back if the game ever draws the scene again (dress() counts it, the take must stay at 1)
      const dress = () => { const s = document.querySelector('#view svg.world'); if (s.querySelector('[data-ext]')) return; window.__wlDressed = (window.__wlDressed || 0) + 1;
        s.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        const rect = (x, y, w, h, fill, first) => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('fill', fill); r.setAttribute('data-ext', '1');
          if (first) s.insertBefore(r, s.firstChild); else s.insertBefore(r, document.getElementById('pack')); };
        rect(-600, 370, 2200, 1200, snow, true); rect(-600, -800, 2200, 1172, sky, true);   // behind the drawing: the sky above, the snow below
        rect(-600, 597.4, 2200, 900, snow, false);                                             // over the drawing's bottom pen line, under Noodle
        // the drawing's right pen line under the far hill (the toy stop looks past it): covered right on top of the ground, under the drifts and props
        const sc = s.querySelector('#sceneG > svg'), ground = [...sc.children].filter((e) => { if (e.tagName !== 'path') return false; const b = e.getBBox(); return Math.abs(b.x) < 3 && Math.abs(b.y - 384) < 3 && Math.abs(b.width - 1000) < 5 && Math.abs(b.height - 216) < 5; }).pop();
        if (!ground) throw new Error('the scene\'s ground changed'); rect(998.4, 393.2, 3.4, 205, snow, false); sc.insertBefore(s.querySelector('#pack').previousSibling, ground.nextSibling);
        // the drawing's paper under its sky takes the sky's colour, so no cream hairline shows where the sky ends on a part of a pixel (the top and right edges)
        const paper = s.querySelector('#sceneG > svg > rect'); if (!paper || paper.getAttribute('fill') !== '#FFFBF3' || paper.getAttribute('height') !== '600') throw new Error('the scene\'s paper rect changed'); paper.setAttribute('fill', sky); };
      dress();
      window.__wl = { id, set(o) { const P = window.__paw, S = P.S; if (o.outfit) S.dog.outfit = Object.assign({}, o.outfit); if (o.at) P.rm.set(this.id, { x: o.at[0], y: o.at[1] });
          if (o.pose) P.idle.pin(o.pose); if (o.face) P.rm.set(this.id, { face: o.face }); if ('expr' in o) { if (o.expr) P.ex.show(this.id, o.expr, 1e8); else P.ex.clear(this.id); } },
        walk(x, y, speed) { const P = window.__paw; P.ex.clear(this.id); P.idle.pin('walk'); P.rm.to(this.id, x, y, { direct: true, speed }); },
        frame(vb) { dress(); const P = window.__paw, s = document.querySelector('#view svg.world'); s.setAttribute('viewBox', vb);
          const e = document.querySelector('#dogArt'), r = e.getBoundingClientRect(), pos = P.rm.pos(this.id), inf = P.rm.info(this.id), a = document.querySelector('#dogArt [class*="pa-pose-"]'), c = P.ex.cur(this.id);
          const flip = !!document.querySelector('#dogArt [transform*="scale(-1"]');
          return { box: [r.left * 2, r.top * 2, r.right * 2, r.bottom * 2].map((v) => Math.round(v * 10) / 10), feet: [Math.round(pos.x * 10) / 10, Math.round(pos.y * 10) / 10], face: pos.face, walk: !!inf.walk,
            pose: a ? (/pa-pose-([a-z]+)/.exec(a.getAttribute('class')) || [])[1] : '', expr: c ? c.name : '', flip, dressed: window.__wlDressed, outfit: Object.values(P.S.dog.outfit || {}).filter(Boolean).join('+') }; } };
    }, ['#E4EEF6', '#F4F7FA', id]);
    // the colours the extension continues, read off the drawing itself (the build checks them again on the frames)
    const vbOf = (x0) => `${x0.toFixed(3)} ${(-OY / S).toFixed(3)} ${(W / S).toFixed(3)} ${(H / S).toFixed(3)}`;
    // ---- the take ----
    const cues = P.cues.slice().sort((a, b) => a.t - b.t); let ci = 0, then = null;
    await ev((c) => window.__wl.set(c), cues[ci++]); await p().waitForTimeout(400);
    const t0 = await freezeClock(p());
    const from = +(process.env.FROM || 0), to = +(process.env.TO || P.NCAP - 1), t00 = Date.now();
    for (let n = 0; n <= to; n++) {
      const tt = n / FPS + 1e-4;
      while (ci < cues.length && cues[ci].t <= tt) { const c = cues[ci++]; if (c.walk != null) { then = c.then; await ev(([x, y, v]) => window.__wl.walk(x, y, v), [c.walk, FLOOR_Y, WALK]); } else await ev((c) => window.__wl.set(c), c); }
      await stepClock(p(), t0 + (n * 1000) / FPS);
      let m = await ev((vb) => window.__wl.frame(vb), vbOf(P.cam(tt)));
      if (then && !m.walk) { await ev((c) => window.__wl.set(c), then); then = null; await stepClock(p(), t0 + (n * 1000) / FPS); m = await ev((vb) => window.__wl.frame(vb), vbOf(P.cam(tt))); }
      m.x0 = P.cam(tt); facts.frames.push(m);
      if (n >= from) { const s = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 540, height: 960, scale: 1 } });
        fs.writeFileSync(path.join(OUT, 'seq', 'f' + String(n).padStart(5, '0') + '.png'), Buffer.from(s.data, 'base64')); }
      if (n % 100 === 0) console.log('frame', n, '/', to, JSON.stringify(m), ((Date.now() - t00) / 1000).toFixed(0) + ' s');
    }
    await releaseClock(p());
    facts.clock = 'frozen page clock, ' + (1000 / FPS).toFixed(4) + ' ms a frame'; facts.n = to + 1; facts.vo = VOJ.dur;
    if (!process.env.FROM) fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts));
    console.log('wrote', to + 1 - from, 'frames');
  }, { date: DATE, timeout: 3000000, season: null, weather: 'sunny' });
}
