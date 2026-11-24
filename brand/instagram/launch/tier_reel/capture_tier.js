// The "9, 45 or 900 coins?" Winter Market price-tier Reel (owner's go-ahead 24 Nov 2026: "Good, render it"; docs/marketing/TIER_REEL.md): the game footage.
// Three real places of the game on 24 Nov 2026 (the Winter Market is open, 23 Nov to 31 Dec), each item where it lives, from a fresh worktree of
// origin/main (game/test_merged.html: node game/build.js && node game/harness.js merged) with the test harness (game/test_lib.js), sunny, by day:
//   C1  the Winter Market place ('fmarket'), close on the Treats cart (its bowl of Frozen Yoghurt Snowballs), Noodle in front: the hook and tier 1;
//   C2  the same place, close on the Toys stall (the Snowball Ball in its basket), Noodle in front: tier 2;
//   C3  Noodle's Home Yard with the Gingerbread Kennel moved in (S.house, the game's own placement: 03_yard.js houseG), Noodle in front: tier 3, the ask.
// Nothing in main changes. Noodle is the game's own leader dog (the dachshund), driven through the game's own hooks: __paw.idle.pin (pose),
// __paw.rm.to / rm.set (place, foreground size `k`, facing), __paw.ex.show (the faces, PawArt expr). The take is captured on the frozen page clock
// (../frozen_clock.js, owner 17 Nov 2026): freezeClock, stepClock(t0 + n x 1000/30) before every screenshot, releaseClock; the game's own timers are
// stopped first, and the page is never resized during a take. Two takes: the market (frames of C1 and C2) and the yard (C3); the cut between them is
// the beat cut at tier 3.
//
// Each camera is a close view of the game's own svg.world (viewBox 0 0 1000 600) at S px a world unit; the frame is full to the bottom: below the
// drawing the scene's own floor colour goes on (the market's snow; the yard's grass with its own speckle pattern, its grass strokes and grass patches
// copied), dressed with the game's own things at a foreground size (the market: PawArt.prop Present Pile, Red Wooden Sled, Yard Snowman; the yard:
// copies of its own bushes and planter). The yard's two washi-tape corners (the sketch's tape, O.tape in world/pawart_world_a.js) are left out.
// The camera never stands still: it drifts on a small circle (3 px, one turn in 6 s), so every frame moves.
//
//   git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
//   VO_LINES=brand/instagram/launch/tier_reel/vo_tier.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/capture_tier.js <main checkout> <caps dir> <vo dir>
// Writes <caps>/seq/f00000.png ... (1080 x 1920), <caps>/facts.json (per frame: the camera, Noodle's drawn box, feet, pose, face; the props' boxes per
// camera; the game's own words and numbers) and <caps>/items/*.svg (PawArt.item). ONLY=layout: one still per camera (<caps>/layout_*.png), no take.
const path = require('path'), fs = require('fs');
const FPS = 30, W = 1080, H = 1920;
const Q = +(process.env.TR_Q || 2.4);        // Noodle: px a unit of the dog art (the idle dachshund is about 237 art units long: about 570 px)
const FEET = +(process.env.TR_FEET || 1092); // Noodle's feet line in the frame, the same in every camera (his box ends about 20 px lower)
const WALK = 300;
// the cameras: S px a world unit, the frame's left edge (world x) and the world's y 0 in the frame (OY), Noodle's feet (frame x of his middle) and facing
const CAM = {
  C1: { place: 'fmarket', S: 2.55, x0: 369.8, OY: -462, nx: 340, face: 'right' },
  C2: { place: 'fmarket', S: 2.2, x0: 606, OY: -425, nx: 541.8, face: 'left' },
  C3: { place: 'yard', S: 2.0, x0: 455, OY: -420, nx: 349, face: 'right' },
};
const SWAY = { r: 3, period: 6 };   // the camera's drift: a circle of r px, one turn in `period` s (constant speed, so every frame moves)
const ITEMS = [
  { k: 't1', n: 'Frozen Yoghurt Snowballs', kind: 'food', price: 9, tier: 1 },
  { k: 't2', n: 'Snowball Ball', kind: 'toys', price: 45, tier: 2 },
  { k: 't3', n: 'Gingerbread Kennel', kind: 'houses', price: 900, tier: 3 },
];
// the market's foreground things (PawArt.prop at the yard size HM_DECOR gives them, x PROPK), frame px of the top left corner at the camera's rest
const PROPK = Q / 0.8737;
const FG_MARKET = [
  { prop: 'wmpresents', n: 'Present Pile', size: [96, 72], at: [70, 1500] },
  { prop: 'wnsled', n: 'Red Wooden Sled', size: [130, 78], at: [392, 1520] },
  { prop: 'wmsnowman', n: 'Yard Snowman', size: [84, 108], at: [810, 1478] },
];
const DASH_MARKET = [[250, 1800], [620, 1860], [940, 1880], [80, 1890], [700, 1470], [-40, 1760]];
// the yard's own floor things, copied onto the grass in front (frame px of the middle of their foot line at the camera's rest; k: x their size in the yard)
const FG_YARD = [{ prop: 'bushL', at: [150, 1600], k: 2.0 }, { prop: 'planter', at: [520, 1640], k: 2.0 }, { prop: 'bush', at: [900, 1590], k: 2.2 }];
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

function plan(VOD) {
  const KEYS = ['hook', 't1', 't2', 't3', 'ask'], PAUSE = 0.15, EXTRA = { ask: 0.6 };
  const beats = []; let at = 0.1; const B = {};
  for (const k of KEYS) { const hold = VOD[k] + 0.4 + (EXTRA[k] || 0); beats.push({ k, at, hold, cam: { hook: 'C1', t1: 'C1', t2: 'C2', t3: 'C3', ask: 'C3' }[k] }); B[k] = at; at += hold + PAUSE; }
  const LOOP = at - PAUSE + 0.2, T = LOOP + 2.5, NF = Math.round(T * FPS), NCAP = Math.min(NF, Math.ceil((LOOP + 0.5) * FPS));
  // the beat of a moment: the next beat takes over 0.06 s before its start (its card's first frame), the camera cuts on the same frame
  const beatAt = (t) => { let i = 0; for (let j = 0; j < beats.length; j++) if (t >= beats[j].at - 0.06) i = j; return beats[i]; };
  const camAt = (t) => { const b = beatAt(t), c = CAM[b.cam], a = 2 * Math.PI * t / SWAY.period;
    return { name: b.cam, S: c.S, x0: c.x0 + SWAY.r * Math.cos(a) / c.S, y0: -c.OY / c.S + SWAY.r * Math.sin(a) / c.S, OY: c.OY }; };
  // the hook's three tags pop with the voice: "Nine," (0), "forty-five," (0.6 s), "or nine hundred coins." (1.6 s); its question from 2.8 s
  const HOOKPOP = [0, 0.6, 1.6], HOOKQ = 2.8;
  // Noodle's cues: { t, cam, pose, face, expr } sets him at once (cam: put him at that camera's spot, at that camera's foreground size)
  const cues = [
    { t: 0, cam: 'C1', pose: 'dance', face: 'right', expr: null },
    { t: B.t1 - 0.06, pose: 'beg', face: 'right', expr: null },
    { t: B.t1 + 1.6, pose: 'beg', face: 'right', expr: 'yum' },
    { t: B.t2 - 0.06, cam: 'C2', pose: 'happy', face: 'left', expr: null },
    { t: B.t2 + 1.0, pose: 'happy', face: 'left', expr: 'zoomies' },
    { t: B.t3 - 0.06, cam: 'C3', pose: 'idle', face: 'right', expr: null },
    { t: B.t3 + 1.7, pose: 'idle', face: 'right', expr: 'hearts' },
    { t: B.ask - 0.06, pose: 'idle', face: 'right', expr: 'curious' },
  ];
  return { FPS, W, H, beats, B, LOOP, T, NF, NCAP, cues, camAt, beatAt, HOOKPOP, HOOKQ, PAUSE };
}
module.exports = { plan, CAM, ITEMS, FG_MARKET, FG_YARD, Q, FEET, PROPK, SWAY, FPS, W, H };

if (require.main === module) {
  const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'tier_caps'), VO = path.resolve(process.argv[4] || path.join(OUT, '..', 'vo'));
  for (const d of ['seq', 'items']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const { run } = require(path.join(DEV, 'game', 'test_lib'));
  const { freezeClock, stepClock, releaseClock } = require('../frozen_clock.js');
  const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), P = plan(VOJ.dur);
  const DATE = process.env.CAP_DATE || '2026-11-24', LAYOUT = process.env.ONLY === 'layout';
  const VIEW = '#view svg.world{position:fixed!important;left:0!important;top:0!important;width:540px!important;height:960px!important;max-width:none!important;max-height:none!important;'
    + 'z-index:2147483000!important;transform:none!important;margin:0!important}[class$="-hl"],#bowlG,#messG,#zzz,#ballLayer{display:none!important}#toasts,#devBtn{display:none!important}'
    + '#view,#view *{overflow:visible!important}';
  run('tier_capture', async (t) => {
    const { ev } = t, p = () => t.p, facts = { date: DATE, Q, FEET, CAM, frames: [], props: {} };
    const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
    const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
    // prefs.fmTest: the festival markets under the harness (49_market.js fmOn); prefs.exTest: the faces (41_expressions.js exOn)
    await t.newGame({ map215: true, ground: true, prefs: { fmTest: true, exTest: true }, time: 'day', weather: 'sunny', head: '~Dachshund', sex: 'boy' }, { coins: 3000, dog: { name: 'Noodle' } });
    const cdp = await t.ctx.newCDPSession(p());
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 980, deviceScaleFactor: 2, mobile: false }); await p().waitForTimeout(600);
    await t.calm(); await t.lu(); await settle();
    // ---- the facts, from the running game on that date ----
    facts.jst = await ev(() => window.__paw.rh.jst());
    facts.open = await ev(() => window.__paw.fm.open()); facts.main = await ev(() => window.__paw.fm.main());
    if (facts.jst !== DATE || facts.main !== 'winter') throw new Error('the Winter Market is not the open market on ' + DATE + ': ' + JSON.stringify([facts.jst, facts.open, facts.main]));
    facts.items = await ev((names) => { const M = window.__paw.fm.markets.find((m) => m.id === 'winter'), all = [].concat(...Object.values(M.items));
      return names.map((n) => ({ n, onSale: all.includes(n), cat: Object.keys(M.items).find((c) => M.items[c].includes(n)) })); }, ITEMS.map((i) => i.n));
    for (const it of ITEMS) fs.writeFileSync(path.join(OUT, 'items', it.k + '.svg'), await ev((n) => window.PawArt.item(n), it.n));
    // the Gingerbread Kennel bought and moved in (what the shop's "Move in" sets: S.house), so the yard draws it in its own place
    await ev(() => { const S = window.__paw.S; S.inv.houses = S.inv.houses || []; if (!S.inv.houses.includes('Gingerbread Kennel')) S.inv.houses.push('Gingerbread Kennel'); S.house = 'Gingerbread Kennel'; window.__paw.saveNow(); });
    const id = await ev(() => window.__paw.S.dog.id);
    await p().addStyleTag({ content: VIEW });

    // ---- one place: go there, dress it, stop the game's timers, set up Noodle ----
    const enter = async (place) => {
      await ev(() => { if (window.__trST) { window.setTimeout = window.__trST; window.setInterval = window.__trSI; } });
      await t.home(place); await p().waitForTimeout(1500); await closeAll();
      const info = await ev(() => ({ place: window.__paw.S.place, name: window.__paw.placeName(window.__paw.S.place), vb: document.querySelector('#view svg.world').getAttribute('viewBox'),
        scene: (document.querySelector('#sceneG > svg') || {}).getAttribute ? document.querySelector('#sceneG > svg').getAttribute('aria-label') : '',
        house: (document.querySelector('#houseG') || { getAttribute: () => '' }).getAttribute('aria-label'),
        stalls: [...document.querySelectorAll('#view svg.world .hot[aria-label]')].map((e) => e.getAttribute('aria-label')) }));
      console.log('place', JSON.stringify(info).slice(0, 500));
      if (info.place !== place || info.vb !== '0 0 1000 600') throw new Error('not at ' + place + ': ' + JSON.stringify(info));
      facts.place = facts.place || {}; facts.place[place] = info;
      const cams = Object.entries(CAM).filter(([, c]) => c.place === place).map(([k, c]) => Object.assign({ k }, c));
      await ev(([place, id, cams, FG_MARKET, FG_YARD, DASH_MARKET, PROPK, Q, FEET]) => {
        window.__trST = window.__trST || window.setTimeout; window.__trSI = window.__trSI || window.setInterval;
        const top = window.__trST(() => {}, 0); for (let i = 1; i <= top + 50; i++) { clearTimeout(i); clearInterval(i); }
        window.setTimeout = () => 0; window.setInterval = () => 0;   // none start again during the take (a face would end on the real clock, the idle tick would redraw the scene)
        const NS = 'http://www.w3.org/2000/svg', PA = window.PawArt, s = document.querySelector('#view svg.world');
        s.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        const sc0 = s.querySelector('#sceneG > svg');
        // the sketch's washi-tape corners (O.tape: a <g transform="translate(..) rotate(..)"> of 22 units' height) are the page's, not the place's
        window.__trTapes = [...sc0.children].filter((e) => e.tagName === 'g' && /^translate\([-\d. ]+\) rotate\(-?[\d.]+\)$/.test(e.getAttribute('transform') || '') && Math.abs(e.getBBox().height - 22) < 1.5);
        window.__trTapes.forEach((e) => e.remove());
        const sc = sc0, kids = [...sc.children], pack = () => document.getElementById('pack');
        const bb = (e) => { try { return e.getBBox(); } catch (x) { return { x: 0, y: 0, width: 0, height: 0 }; } };
        const rect = (x, y, w, h, fill, before) => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('fill', fill); r.setAttribute('data-ext', '1'); before.parentNode.insertBefore(r, before); return r; };
        const g = (html, tag, cam, before) => { const e = document.createElementNS(NS, 'g'); e.setAttribute('data-ext', tag); if (cam) e.setAttribute('data-cam', cam); e.innerHTML = html; (before || pack()).parentNode.insertBefore(e, before || pack()); return e; };
        // world point of a frame px at a camera's rest
        const wpt = (c, px, py) => [c.x0 + px / c.S, (py - c.OY) / c.S];
        if (place === 'fmarket') {
          // the sky above and the snow below the drawing, and the snow in front over the drawing's bottom pen line (as winter_list_reel)
          const sky = '#E4EEF6', snow = '#F4F7FA';
          rect(-3000, 370, 7000, 4000, snow, s.firstChild); rect(-3000, -2000, 7000, 2372, sky, s.firstChild);
          rect(-3000, 597.4, 7000, 4000, snow, pack());
          const ground = kids.filter((e) => { if (e.tagName !== 'path') return false; const b = bb(e); return Math.abs(b.x) < 3 && Math.abs(b.y - 384) < 3 && Math.abs(b.width - 1000) < 5 && Math.abs(b.height - 216) < 5; }).pop();
          if (!ground) throw new Error('the market\'s ground changed');
          for (const x of [998.4, -1.8]) rect(x, 393.2, 3.4, 205, snow, ground.nextSibling);
          const paper = s.querySelector('#sceneG > svg > rect'); if (!paper || paper.getAttribute('fill') !== '#FFFBF3' || paper.getAttribute('height') !== '600') throw new Error('the market\'s paper rect changed'); paper.setAttribute('fill', sky);
          const dashes = kids.filter((e) => { const b = bb(e); return e.tagName === 'path' && b.y > 440 && b.width > 20 && b.width < 32 && b.height < 6; });
          if (dashes.length < 5) throw new Error('the market\'s dashes changed: ' + dashes.length);
          for (const c of cams) {
            for (const f of FG_MARKET) { const svg = PA.prop(f.prop, {}); if (!svg || />\?<\/text>/.test(svg)) throw new Error('no prop ' + f.prop);
              const [x, y] = wpt(c, f.at[0], f.at[1]), w = f.size[0] * PROPK / c.S, h = f.size[1] * PROPK / c.S;
              g(svg.replace(/^<svg/, '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet"'), 'fg', c.k).setAttribute('data-fg', c.k + ':' + f.prop); }
            DASH_MARKET.forEach(([px, py], i) => { const src = dashes[i % dashes.length], b = bb(src), e = g('', 'dash', c.k), [x, y] = wpt(c, px, py), k = PROPK / c.S * 0.9;
              e.appendChild(src.cloneNode(true)); e.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + k + ') translate(' + (-b.x - b.width / 2) + ' ' + (-b.y - b.height / 2) + ')'); });
          }
        } else {
          // the yard: its grass goes on below the drawing (its own colour, its own speckle pattern, its grass strokes and grass patches copied), and
          // its sky, hills and fence a little past the sides (the camera stays inside x 0..1000)
          const grass = kids.find((e) => e.tagName === 'path' && e.getAttribute('fill') === '#D9DA9A' && bb(e).width > 990 && bb(e).height > 250);
          const strokes = kids.find((e) => e.tagName === 'path' && e.getAttribute('stroke') === '#BCC881' && bb(e).width > 990);
          const speck = kids.filter((e) => e.tagName === 'rect' && /^url\(#pwa\d+x\d+\)$/.test(e.getAttribute('fill') || '') && e.getAttribute('height') === '600' && kids.indexOf(e) > kids.indexOf(grass)).pop();
          const patches = kids.filter((e) => e.tagName === 'path' && e.getAttribute('fill') === '#CDD48D');
          if (!grass || !strokes || !speck || patches.length < 5) throw new Error('the yard\'s ground changed: ' + [!!grass, !!strokes, !!speck, patches.length]);
          const after = (e) => e.nextSibling;
          rect(-3000, 596, 7000, 4000, '#D9DA9A', after(strokes));
          const st = strokes.cloneNode(true); st.setAttribute('transform', 'translate(0 254)'); st.setAttribute('data-ext', 'strokes'); after(strokes).parentNode.insertBefore(st, speck);
          const st2 = strokes.cloneNode(true); st2.setAttribute('transform', 'translate(-500 508)'); st2.setAttribute('data-ext', 'strokes'); speck.parentNode.insertBefore(st2, speck);
          const st3 = strokes.cloneNode(true); st3.setAttribute('transform', 'translate(500 508)'); st3.setAttribute('data-ext', 'strokes'); speck.parentNode.insertBefore(st3, speck);
          patches.forEach((pa, i) => { const c2 = pa.cloneNode(true); c2.setAttribute('transform', 'translate(' + (i % 2 ? -60 : 40) + ' ' + (300 + (i % 3) * 30) + ')'); c2.setAttribute('data-ext', 'patch'); speck.parentNode.insertBefore(c2, speck); });
          const sp = speck.cloneNode(true); sp.setAttribute('y', '596'); sp.setAttribute('height', '4000'); sp.setAttribute('x', '-3000'); sp.setAttribute('width', '7000'); sp.setAttribute('data-ext', 'speck'); speck.parentNode.insertBefore(sp, speck.nextSibling);
          // the yard's own floor things (#pack .gr-prop), copied onto the grass in front at a foreground size
          for (const c of cams) for (const f of FG_YARD) { const src = document.querySelector('#pack .gr-prop[data-prop="' + f.prop + '"]'); if (!src) throw new Error('no yard prop ' + f.prop);
            const b = bb(src), e = g('', 'fg', c.k), [x, y] = wpt(c, f.at[0], f.at[1]);
            e.appendChild(src.cloneNode(true)); e.setAttribute('data-fg', c.k + ':' + f.prop);
            e.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + f.k + ') translate(' + (-b.x - b.width / 2) + ' ' + (-b.y - b.height) + ')'); }
        }
        // the props' drawn boxes (world units) for the checks: the floor props (#pack .gr-prop, their visible shapes), the places' tap targets, and ours
        const inv = s.getScreenCTM().inverse(), toW = (r) => { const a = new DOMPoint(r.left, r.top).matrixTransform(inv), z = new DOMPoint(r.right, r.bottom).matrixTransform(inv); return [a.x, a.y, z.x, z.y]; };
        window.__trInk = (root) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          for (const e of root.querySelectorAll('path,ellipse,circle,rect,polygon,polyline,line,text,image')) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const fill = e.getAttribute('fill') || cs.fill, stroke = e.getAttribute('stroke') || cs.stroke; if ((/^(none|transparent)$/.test(fill) || /rgba\(0, 0, 0, 0\)/.test(fill)) && (!stroke || /^none$/.test(stroke))) continue;
            let o = 1; for (let q = e; q && q !== s; q = q.parentNode) { if (q.getAttribute && q.getAttribute('opacity') != null) o *= +q.getAttribute('opacity'); if (q.style && q.style.visibility === 'hidden') o = 0; } if (o < 0.05) continue;
            const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue; const w = toW(r), sw = (parseFloat(e.getAttribute('stroke-width')) || 0) / 2;
            x0 = Math.min(x0, w[0] - sw); y0 = Math.min(y0, w[1] - sw); x1 = Math.max(x1, w[2] + sw); y1 = Math.max(y1, w[3] + sw); }
          return x0 < 1e8 ? [x0, y0, x1, y1].map((v) => Math.round(v * 10) / 10) : null; };
        window.__trProps = () => { const o = {};
          document.querySelectorAll('#pack > .gr-prop').forEach((e, i) => { const k = e.getAttribute('data-prop') || ('prop' + i); const b = window.__trInk(e); if (b) o[k] = b; });
          document.querySelectorAll('[data-fg]').forEach((e) => { const b = window.__trInk(e); if (b) o['fg:' + e.getAttribute('data-fg')] = b; });
          return o; };
        const sz = window.__paw.rm.size(id).k;
        window.__tr = { id, sz, cams: Object.fromEntries(cams.map((c) => [c.k, c])), cam: null,
          show(cam) { document.querySelectorAll('[data-cam]').forEach((e) => { e.style.display = e.getAttribute('data-cam') === cam ? '' : 'none'; }); },
          set(o) { const P = window.__paw; if (o.cam) { const c = this.cams[o.cam]; this.cam = o.cam; this.show(o.cam); P.rm.to(this.id, c.x0 + c.nx / c.S, (FEET - c.OY) / c.S, { direct: true, secs: 0, k: Q / (c.S * this.sz) }); }
            if (o.pose) P.idle.pin(o.pose); if (o.face) P.rm.set(this.id, { face: o.face }); if ('expr' in o) { if (o.expr) P.ex.show(this.id, o.expr, 1e8); else P.ex.clear(this.id); } },
          frame(vb) { const P = window.__paw, s = document.querySelector('#view svg.world'); s.setAttribute('viewBox', vb);
            const e = document.querySelector('#dogArt'), r = e.getBoundingClientRect(), pos = P.rm.pos(this.id), inf = P.rm.info(this.id), a = document.querySelector('#dogArt [class*="pa-pose-"]'), c = P.ex.cur(this.id);
            return { box: [r.left * 2, r.top * 2, r.right * 2, r.bottom * 2].map((v) => Math.round(v * 10) / 10), feet: [Math.round(pos.x * 10) / 10, Math.round(pos.y * 10) / 10], face: pos.face, walk: !!inf.walk,
              pose: a ? (/pa-pose-([a-z]+)/.exec(a.getAttribute('class')) || [])[1] : '', expr: c ? c.name : '', cam: this.cam, draws: document.querySelectorAll('#sceneG > svg').length + ':' + (s.querySelectorAll('[data-ext]').length), tapes: window.__trTapes.length }; } };
      }, [place, id, cams, FG_MARKET, FG_YARD, DASH_MARKET, PROPK, Q, FEET]);
      // the props of each camera of this place, with its own foreground things showing
      for (const c of cams) { await ev((k) => window.__tr.show(k), c.k); facts.props[c.k] = await ev(() => window.__trProps()); }
      console.log('props', JSON.stringify(facts.props).slice(0, 900));
    };
    const vbOf = (c) => `${c.x0.toFixed(4)} ${c.y0.toFixed(4)} ${(W / c.S).toFixed(4)} ${(H / c.S).toFixed(4)}`;
    const shot = async (file) => { const s = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 540, height: 960, scale: 1 } }); fs.writeFileSync(file, Buffer.from(s.data, 'base64')); };

    if (LAYOUT) {   // one still per camera and pose, to place things
      for (const place of ['fmarket', 'yard']) { await enter(place);
        for (const [k, c] of Object.entries(CAM).filter(([, c]) => c.place === place)) {
          for (const [pose, expr] of [['idle', null], ['beg', 'hearts'], ['happy', 'zoomies'], ['dance', null], ['idle', 'curious'], ['beg', 'yum']]) {
            await ev((o) => window.__tr.set(o), { cam: k, pose, face: c.face, expr }); await p().waitForTimeout(250);
            const m = await ev((vb) => window.__tr.frame(vb), vbOf({ x0: c.x0, y0: -c.OY / c.S, S: c.S }));
            console.log('layout', k, pose, expr, JSON.stringify(m.box), 'w', Math.round(m.box[2] - m.box[0]), 'h', Math.round(m.box[3] - m.box[1]), 'feet', m.feet);
            if (pose === 'idle') await shot(path.join(OUT, 'layout_' + k + '.png')); } } }
      fs.writeFileSync(path.join(OUT, 'layout_props.json'), JSON.stringify(facts.props)); return; }

    // ---- the takes: the market (C1, C2), then the yard (C3) ----
    const cues = P.cues.slice().sort((a, b) => a.t - b.t);
    const from = +(process.env.FROM || 0), to = +(process.env.TO || P.NCAP - 1), t00 = Date.now();
    let n = 0, ci = 0;
    for (const place of ['fmarket', 'yard']) {
      await enter(place);
      const camsHere = Object.keys(CAM).filter((k) => CAM[k].place === place);
      // the first cue of this take sets Noodle at its camera
      while (ci < cues.length && cues[ci].t <= n / FPS + 1e-4) ci++;
      const last = [...cues.slice(0, ci)].reverse(), st = {}; for (const c of last) for (const k of ['pose', 'face', 'expr', 'cam']) if (!(k in st) && k in c) st[k] = c[k];
      if (!camsHere.includes(st.cam)) st.cam = camsHere[0];
      await ev((c) => window.__tr.set(c), st); await p().waitForTimeout(400);
      const tf = await freezeClock(p()), n0 = n;
      for (; n <= to; n++) {
        const tt = n / FPS + 1e-4, cam = P.camAt(tt);
        if (!camsHere.includes(cam.name)) break;
        while (ci < cues.length && cues[ci].t <= tt) { await ev((c) => window.__tr.set(c), cues[ci]); ci++; }
        await stepClock(p(), tf + ((n - n0) * 1000) / FPS);
        const m = await ev((vb) => window.__tr.frame(vb), vbOf(cam));
        m.x0 = cam.x0; m.y0 = cam.y0; m.S = cam.S; m.n = n; facts.frames.push(m);
        if (m.cam !== cam.name) throw new Error('Noodle is set for ' + m.cam + ' on a frame of ' + cam.name + ' (frame ' + n + ')');
        if (n >= from) await shot(path.join(OUT, 'seq', 'f' + String(n).padStart(5, '0') + '.png'));
        if (n % 100 === 0) console.log('frame', n, '/', to, JSON.stringify(m), ((Date.now() - t00) / 1000).toFixed(0) + ' s');
      }
      await releaseClock(p());
      facts.draws = (facts.draws || []).concat([[place, n0, n - 1, new Set(facts.frames.slice(n0).map((f) => f.draws)).size]]);
    }
    facts.clock = 'frozen page clock, ' + (1000 / FPS).toFixed(4) + ' ms a frame'; facts.n = to + 1; facts.vo = VOJ.dur;
    if (!process.env.FROM) fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts));
    console.log('wrote', to + 1 - from, 'frames', JSON.stringify(facts.draws));
  }, { date: DATE, timeout: 3000000, season: null, weather: 'sunny' });
}
