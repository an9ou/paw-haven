// The "Noodle's Winter Market shopping list" Reel (owner's go-ahead 18 Nov 2026; docs/marketing/WINTER_LIST_REEL.md): the game footage.
// One continuous take of the real Winter Market place ('fmarket' dressed for winter, main's own scene) with Noodle the dachshund as the game's own
// leader dog, from a fresh worktree of origin/main (game/test_merged.html: node game/build.js && node game/harness.js merged) with the test harness
// (game/test_lib.js), the game date pinned to 23 Nov 2026 (the Winter Market's first day), sunny, by day. Nothing in main changes.
//
// The take is captured on the frozen page clock (../frozen_clock.js, owner 17 Nov 2026): freezeClock, then stepClock(t0 + n x 1000/30) before every
// screenshot, then releaseClock. Never real-time seek + screenshot. The game's own timers are stopped first, so only the stepped clock moves the
// scene: the roam walk (rAF), the dog art's CSS animations and the faces. Noodle is driven through the game's own hooks: __paw.idle.pin (pose),
// __paw.rm.to / rm.set (the walks, his size, facing), __paw.ex.show (the face, PawArt expr), S.dog.outfit (the Polar Bear Hood try-on).
//
// The shot (coordinator, 19 Nov 2026: Noodle big, on open snow in front of the market, the frame full to the bottom, nothing crossed):
//   - the whole market (the game's svg.world, viewBox 0 0 1000 600) at S px a world unit, as the backdrop: its bunting 28 px under the cards;
//   - Noodle on the open snow in FRONT of the market, near the camera: the game's own dog at a foreground size (rm.to's `k`, the size the game uses
//     to fit a dog to a prop), Q px for each unit of the dog art, about 600 to 650 px long. His whole drawn box stays 28 px below the stands, carts,
//     stalls and props of the market. He walks only on that open snow (rm.to), so no walk crosses anything;
//   - the snow in front goes on to the bottom of the frame, dressed with the game's own winter things at the same foreground size (PawArt.prop:
//     the Present Pile, the Red Wooden Sled, the Yard Snowman), the scene's own ground dashes, and the scene's own snowflake
//     doodles in the sky. Everything is drawn by the game page; nothing is redrawn or composited.
// Above the drawing its flat sky colour goes on, below and beside it its flat snow colour (the far hill is the scene's own, drawn 99 units past
// both edges). Hidden: the stall hint glow, the HUD, toasts and speech bubbles (they are HTML, under the scene here).
//
// plan(VOD) is the one timeline for this script and build_winter.js: the beats from the voice lines (each card = its line + 0.4 s, 0.15 s pauses),
// the camera's x per time and Noodle's cues. The hook beat is as long as the longer of the two hook lines ("opens tonight" / "open now"), so the
// second hook variant re-renders only the hook frames.
//
//   git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
//   VO_LINES=brand/instagram/launch/winter_list_reel/vo_winter.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/capture_winter.js <main checkout> <caps dir> <vo dir>
// Writes <caps>/seq/f00000.png ... (1080 x 1920, the scene with Noodle), <caps>/facts.json (per frame: the camera, Noodle's drawn box, feet, pose,
// face, walking; the foreground things' boxes; the game's own words and numbers for the facts) and <caps>/items/*.svg (PawArt.item).
const path = require('path'), fs = require('fs');
const FPS = 30, W = 1080, H = 1920;
const S = +(process.env.WL_S || 0.94);       // the market: px a world unit (1000 units = 940 px: the whole market in the frame)
const Q = +(process.env.WL_Q || 2.55);       // Noodle: px a unit of the dog art (the idle dachshund is 237 art units long: about 605 px)
const OY = +(process.env.WL_OY || 432);      // the market's top edge in the frame (its bunting top, world y 128, is then 28 px under the cards)
const FEET = +(process.env.WL_FEET || 1419); // Noodle's feet line in the frame (his shadow ends about 20 px lower, above y 1440)
const FLOOR_Y = (FEET - OY) / S;             // ... in world units: the open snow in front of the market (the drawing ends at y 600)
const PROPK = Q / 0.8737;                    // px a yard unit for the foreground things: the size they have beside a dachshund in the yard (HM_DECOR)
const WALK = 300;                            // world units a second on the foreground snow
// Noodle's stops (world x) and the camera's left edge there (world x): he stands under the stall the list line is about
const camFor = (n, sx) => n - sx / S;
const STOP = { mid: { n: 500, cam: camFor(500, 463) }, homes: { n: 354, cam: -45 }, toys: { n: 622, cam: 78 }, treats: { n: 550, cam: 40 }, decor: { n: 382, cam: -45 } };
const ITEMS = [
  { k: 'k1', n: 'Gingerbread Kennel', kind: 'houses', price: 900 },
  { k: 'k2', n: 'Polar Bear Hood', kind: 'clothes', price: 80 },
  { k: 'k3', n: 'Snowball Ball', kind: 'toys', price: 45 },
  { k: 'k4', n: 'Frozen Yoghurt Snowballs', kind: 'food', price: 9 },
  { k: 'k5', n: 'Star Lantern', kind: 'decor', price: 110 },
];
// the foreground things (PawArt.prop, HM_DECOR's yard size [w, h] x PROPK), by their frame box at camera 0: [x, y] of the top left corner
const FG = [
  { prop: 'wmpresents', n: 'Present Pile', size: [96, 72], at: [22, 1474] },
  { prop: 'wnsled', n: 'Red Wooden Sled', size: [130, 78], at: [328, 1446] },
  { prop: 'wmsnowman', n: 'Yard Snowman', size: [84, 108], at: [730, 1482] },
];
const DASH = [[250, 1790], [620, 1850], [930, 1880], [60, 1880], [1150, 1740], [-60, 1760]];           // the scene's ground dashes, again on the snow in front (frame px at camera 0)
const FLAKE = [[130, 130], [385, 64], [650, 176], [905, 92], [1010, 236], [985, 392], [1150, 150], [-30, 300]]; // its snowflake doodles, again in the sky
const SCARF = { neck: 'Autumn Scarf' }, HOOD = { neck: 'Autumn Scarf', body: 'Polar Bear Hood' };
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

function plan(VOD) {
  const KEYS = ['hook', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'ask'], PAUSE = 0.15, EXTRA = { k6: 0.6, ask: 0.6 };
  const dur = (k) => (k === 'hook' ? Math.max(VOD.hook, VOD.hook_open) : VOD[k]);
  const beats = []; let at = 0.1; const B = {};
  for (const k of KEYS) { const hold = dur(k) + 0.4 + (EXTRA[k] || 0); beats.push({ k, at, hold }); B[k] = at; at += hold + PAUSE; }
  const LOOP = at - PAUSE + 0.2, T = LOOP + 2.5, NF = Math.round(T * FPS), NCAP = Math.min(NF, Math.ceil((LOOP + 0.5) * FPS));
  // the walks: one at the start of each beat, on the open snow in front, with the camera going along
  const ROUTE = [['k1', 'homes'], ['k2', 'mid'], ['k3', 'toys'], ['k4', 'treats'], ['k5', 'decor'], ['k6', 'mid']], walks = []; let from = 'mid';
  for (const [k, to] of ROUTE) { walks.push({ k, from, to, t: B[k], secs: Math.abs(STOP[to].n - STOP[from].n) / WALK }); from = to; }
  const wk = Object.fromEntries(walks.map((w) => [w.k, w.secs]));
  // the list's ticks (seconds from each beat's start)
  const TICK = { k1: 1.3, k2: 1.15, k3: 1.0, k4: 1.6, k5: 1.4, k6: 1.25 };
  // Noodle's cues: { t, pose, face, expr, outfit } sets him at once; { t, walk: x } starts a real walk (the game's rm.to), `then` is set on arrival
  const W_ = (k) => STOP[walks.find((w) => w.k === k).to].n;
  const cues = [
    { t: 0, at: [STOP.mid.n, FLOOR_Y], pose: 'dance', face: 'right', expr: null, outfit: SCARF },
    { t: B.k1, walk: W_('k1'), then: { pose: 'beg', face: 'left', expr: 'hearts' } },
    { t: B.k2, walk: W_('k2'), then: { pose: 'idle', face: 'right', expr: null } },
    { t: B.k2 + 0.75, pose: 'happy', face: 'right', expr: null, outfit: HOOD },
    { t: B.k2 + 1.45, pose: 'bow', face: 'right', expr: 'proud' },
    { t: B.k3 - 0.001, pose: 'idle', face: 'right', expr: null, outfit: SCARF },
    { t: B.k3, walk: W_('k3'), then: { pose: 'bow', face: 'right', expr: 'zoomies' } },
    { t: B.k4, walk: W_('k4'), then: { pose: 'idle', face: 'right', expr: null } },
    { t: B.k4 + 0.9, pose: 'idle', face: 'right', expr: 'yum' },
    { t: B.k5, walk: W_('k5'), then: { pose: 'idle', face: 'left', expr: 'wow' } },
    { t: B.k6, walk: W_('k6'), then: { pose: 'idle', face: 'right', expr: null } },
    { t: B.k6 + 1.15, pose: 'down', face: 'right', expr: 'guilty' },
    { t: B.ask, pose: 'idle', face: 'right', expr: 'curious' },
  ];
  // the camera's left edge (world units): it goes along with each walk (eased), and between the walks it creeps to the right (CREEP units a second,
  // about 0.12 px a frame), so the picture is never quite still and no two frames are alike
  const CREEP = 4, K = [[0, STOP.mid.cam]]; let kt = 0, kx = STOP.mid.cam;
  const hold = (t1) => { kx += CREEP * (t1 - kt); kt = t1; K.push([t1, kx, 0]); }, move = (secs, x) => { kt += secs; kx = x; K.push([kt, x, 1]); };
  for (const w of walks) { hold(w.t); move(w.secs, STOP[w.to].cam); } hold(T + 1);
  const cam = (t) => { let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++; const [t0, a] = K[i], [t1, b, eased] = K[i + 1], u = Math.max(0, Math.min(1, (t - t0) / Math.max(1e-6, t1 - t0)));
    return eased ? a + (b - a - CREEP * (t1 - t0)) * sm(u) + CREEP * (Math.min(Math.max(t, t0), t1) - t0) : a + (b - a) * u; };   // a pan starts and ends at the creep's speed
  return { FPS, W, H, S, OY, FEET, beats, B, LOOP, T, NF, NCAP, TICK, cues, cam, walks, wk, PAUSE };
}
module.exports = { plan, ITEMS, FG, FLAKE, S, Q, OY, FEET, FLOOR_Y, PROPK, STOP, FPS, W, H };

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
    const { ev } = t, p = () => t.p, facts = { date: DATE, S, OY, Q, FEET, frames: [] };
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
    await ev(([sky, snow, id, FG, DASH, FLAKE, S, OY, Q, PROPK]) => {
      const top = setTimeout(() => {}, 0); for (let i = 1; i <= top + 50; i++) { clearTimeout(i); clearInterval(i); }
      window.setTimeout = () => 0; window.setInterval = () => 0;   // and none start again during the take (a face would end on the real clock, the idle tick would redraw the scene)
      const NS = 'http://www.w3.org/2000/svg', PA = window.PawArt;
      // the sky and the snow go on around the drawing, and the snow in front is dressed; put back if the game ever draws the scene again (dress()
      // counts it, the take must stay at 1)
      const dress = () => { const s = document.querySelector('#view svg.world'); if (s.querySelector('[data-ext]')) return; window.__wlDressed = (window.__wlDressed || 0) + 1;
        s.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        const pack = () => document.getElementById('pack');
        const rect = (x, y, w, h, fill, first) => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('fill', fill); r.setAttribute('data-ext', '1');
          if (first) s.insertBefore(r, s.firstChild); else s.insertBefore(r, pack()); return r; };
        rect(-3000, 370, 7000, 4000, snow, true); rect(-3000, -2000, 7000, 2372, sky, true);   // behind the drawing: the sky above, the snow below
        rect(-3000, 597.4, 7000, 4000, snow, false);                                            // over the drawing's bottom pen line: the snow in front
        // the drawing's left and right pen lines under the far hill: covered right on top of the ground, under the drifts and props
        const sc = s.querySelector('#sceneG > svg'), kids = [...sc.children], bb = (e) => { try { return e.getBBox(); } catch (x) { return { x: 0, y: 0, width: 0, height: 0 }; } };
        const ground = kids.filter((e) => { if (e.tagName !== 'path') return false; const b = bb(e); return Math.abs(b.x) < 3 && Math.abs(b.y - 384) < 3 && Math.abs(b.width - 1000) < 5 && Math.abs(b.height - 216) < 5; }).pop();
        if (!ground) throw new Error('the scene\'s ground changed');
        for (const x of [998.4, -1.8]) sc.insertBefore(rect(x, 393.2, 3.4, 205, snow, false), ground.nextSibling);
        // the drawing's paper under its sky takes the sky's colour, so no cream hairline shows where the sky ends on a part of a pixel
        const paper = s.querySelector('#sceneG > svg > rect'); if (!paper || paper.getAttribute('fill') !== '#FFFBF3' || paper.getAttribute('height') !== '600') throw new Error('the scene\'s paper rect changed'); paper.setAttribute('fill', sky);
        // frame px at camera 0 -> world units
        const wx = (px) => px / S, wy = (py) => (py - OY) / S, g = (html, tag) => { const e = document.createElementNS(NS, 'g'); e.setAttribute('data-ext', tag); e.innerHTML = html; s.insertBefore(e, pack()); return e; };
        // the game's own winter things on the snow in front (PawArt.prop), at the size they have beside a dachshund in the yard
        for (const f of FG) { const svg = PA.prop(f.prop, {}); if (!svg || />\?<\/text>/.test(svg)) throw new Error('no prop ' + f.prop);
          const w = f.size[0] * PROPK / S, h = f.size[1] * PROPK / S; g(svg.replace(/^<svg/, '<svg x="' + wx(f.at[0]) + '" y="' + wy(f.at[1]) + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet"'), 'fg').setAttribute('data-fg', f.prop); }
        // the scene's own ground dashes and snowflake doodles, copied (cloneNode) onto the snow in front and into the sky above
        const dashes = kids.filter((e) => { const b = bb(e); return e.tagName === 'path' && b.y > 440 && b.width > 20 && b.width < 32 && b.height < 6; });
        const flakes = kids.filter((e) => { const b = bb(e); return e.tagName === 'path' && (e.getAttribute('stroke') || '').toUpperCase() === '#9FB3CC' && b.y < 360 && b.width < 16 && b.height < 16; });
        if (dashes.length < 5 || flakes.length < 6) throw new Error('the scene\'s dashes or snowflakes changed: ' + dashes.length + ', ' + flakes.length);
        const copy = (list, pts, k, tag) => pts.forEach(([px, py], i) => { const src = list[i % list.length], b = bb(src), e = g('', tag); e.appendChild(src.cloneNode(true));
          e.setAttribute('transform', 'translate(' + wx(px) + ' ' + wy(py) + ') scale(' + k + ') translate(' + (-b.x - b.width / 2) + ' ' + (-b.y - b.height / 2) + ')'); });
        copy(dashes, DASH, PROPK / S * 0.9, 'dash'); copy(flakes, FLAKE, 2.4 / S, 'flake'); };
      dress();
      const sz = window.__paw.rm.size(id).k, NK = Q / (S * sz);   // the game's size for Noodle here: Q px a unit of his art (rm.to's k x his size class)
      window.__wl = { id, NK, set(o) { const P = window.__paw, S_ = P.S; if (o.outfit) S_.dog.outfit = Object.assign({}, o.outfit); if (o.at) P.rm.to(this.id, o.at[0], o.at[1], { direct: true, secs: 0, k: NK });
          if (o.pose) P.idle.pin(o.pose); if (o.face) P.rm.set(this.id, { face: o.face }); if ('expr' in o) { if (o.expr) P.ex.show(this.id, o.expr, 1e8); else P.ex.clear(this.id); } },
        walk(x, y, speed) { const P = window.__paw; P.ex.clear(this.id); P.idle.pin('walk'); P.rm.to(this.id, x, y, { direct: true, speed, k: NK }); },
        fg() { const s = document.querySelector('#view svg.world'), inv = s.getScreenCTM().inverse(), o = {}; for (const e of s.querySelectorAll('[data-fg]')) { const r = e.getBoundingClientRect(), a = new DOMPoint(r.left, r.top).matrixTransform(inv), z = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
            o[e.getAttribute('data-fg')] = [a.x, a.y, z.x, z.y].map((v) => Math.round(v * 10) / 10); } return o; },
        frame(vb) { dress(); const P = window.__paw, s = document.querySelector('#view svg.world'); s.setAttribute('viewBox', vb);
          const e = document.querySelector('#dogArt'), r = e.getBoundingClientRect(), pos = P.rm.pos(this.id), inf = P.rm.info(this.id), a = document.querySelector('#dogArt [class*="pa-pose-"]'), c = P.ex.cur(this.id);
          const flip = !!document.querySelector('#dogArt [transform*="scale(-1"]');
          return { box: [r.left * 2, r.top * 2, r.right * 2, r.bottom * 2].map((v) => Math.round(v * 10) / 10), feet: [Math.round(pos.x * 10) / 10, Math.round(pos.y * 10) / 10], face: pos.face, walk: !!inf.walk, sc: Math.round(pos.sc * 1000) / 1000,
            pose: a ? (/pa-pose-([a-z]+)/.exec(a.getAttribute('class')) || [])[1] : '', expr: c ? c.name : '', flip, dressed: window.__wlDressed, outfit: Object.values(P.S.dog.outfit || {}).filter(Boolean).join('+') }; } };
    }, ['#E4EEF6', '#F4F7FA', id, FG, DASH, FLAKE, S, OY, Q, PROPK]);
    // the colours the extension continues, read off the drawing itself (the build checks them again on the frames)
    const vbOf = (x0) => `${x0.toFixed(3)} ${(-OY / S).toFixed(3)} ${(W / S).toFixed(3)} ${(H / S).toFixed(3)}`;
    // ---- the take ----
    const cues = P.cues.slice().sort((a, b) => a.t - b.t); let ci = 0, then = null;
    await ev((c) => window.__wl.set(c), cues[ci++]); await p().waitForTimeout(400);
    await ev((vb) => window.__wl.frame(vb), vbOf(0)); facts.fg = await ev(() => window.__wl.fg()); console.log('foreground', JSON.stringify(facts.fg));
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
