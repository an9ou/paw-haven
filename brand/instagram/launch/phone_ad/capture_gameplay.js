// Records REAL gameplay clips of Doodle Doggo in the PHONE PORTRAIT layout for the phone ad (390 x 844 CSS px at DPR 3 = 1170 x 2532 frames).
//
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/phone_ad/capture_gameplay.js <outdir> [clip ...]
//
// Clips: home, shelter, wardrobe, walk, play, ball, photo (default: all). Each clip is a numbered PNG sequence at a steady 30 fps in
// <outdir>/<clip>/frames/, an H.264 mp4 (yuv420p) at <outdir>/<clip>.mp4, one still at <outdir>/stills/<clip>.png, and all stills tiled
// in <outdir>/contact_sheet.png.
//
// How the frames stay smooth: the page runs on Playwright's fake clock (Date, timers, requestAnimationFrame, performance.now) and every CSS /
// Web Animation is paused and stepped by hand, so each frame advances the game by exactly 1/30 s however long the screenshot takes.
// Math.random is seeded too, so a run with the same SEED gives the same dogs, coats and moves.
//
// Options (env): SEED (default 7), FPS (30), FRAMES=a-b (write only those frame numbers of the clips asked for, to redo part of a clip),
//   TAPS=0 (no tap rings), DATE (2026-11-04: picks the shelter's dogs of that day), SEASON (summer), WEATHER (sunny),
//   KEEP=1 (keep earlier frames of a clip instead of clearing its folder).
// Needs game/test_merged.html: build it first with `node game/build.js && node game/harness.js merged` (or `node game/run_tests.js smoke`).
// The game files are not touched; the dev button is hidden with CSS in the capture page only.
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { devices } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const { run, URL } = require(path.join(ROOT, 'game', 'test_lib'));

const OUT = path.resolve(process.argv[2] || 'gameplay_out'); fs.mkdirSync(OUT, { recursive: true });
const ALL = ['home', 'shelter', 'wardrobe', 'walk', 'play', 'ball', 'photo'];
const WANT = process.argv.slice(3).length ? process.argv.slice(3) : ALL;
const FPS = +process.env.FPS || 30, SEED = +process.env.SEED || 7, TAPS = process.env.TAPS !== '0';
const DATE = process.env.DATE || '2026-11-04';
const FR = (process.env.FRAMES || '').match(/^(\d+)-(\d+)$/); const inRange = (f) => !FR || (f >= +FR[1] && f <= +FR[2]);
devices['Ad Phone'] = Object.assign({}, devices['iPhone 15'], { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } });

// ---- in-page helpers (installed before the game boots) ----
function pageInit(cfg) {
  // seeded Math.random (mulberry32)
  let a = cfg.seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // CSS / Web Animations under manual control while a clip records
  const mine = new Set(), seen = new WeakSet();
  window.__adStep = (dt) => {
    for (const an of document.getAnimations()) {
      if (!seen.has(an)) { seen.add(an); if (an.playState === 'running' || an.pending) { an.pause(); mine.add(an); } continue; } // new this frame: held at its start
      if (!mine.has(an)) continue;
      const tm = an.effect && an.effect.getComputedTiming ? an.effect.getComputedTiming() : null, end = tm ? tm.endTime : Infinity;
      const nt = (an.currentTime || 0) + dt * (an.playbackRate || 1);
      if (isFinite(end) && nt >= end) { mine.delete(an); try { an.finish(); } catch (e) { an.currentTime = end; } } else an.currentTime = nt;
    }
    for (const an of mine) if (an.playState === 'idle') mine.delete(an);
  };
  window.__adRelease = () => { for (const an of mine) { try { an.play(); } catch (e) { /* gone */ } } mine.clear(); };
  // the finger: a soft ring where the player taps (and a dot that follows a drag)
  window.__adTap = (x, y, kind) => {
    let el = document.getElementById('adFinger'); if (!el) { el = document.createElement('div'); el.id = 'adFinger'; document.documentElement.appendChild(el); }
    const r = document.createElement('div'); r.className = 'ad-ring' + (kind === 'drag' ? ' ad-drag' : ''); r.style.left = x + 'px'; r.style.top = y + 'px'; el.appendChild(r);
    if (kind !== 'drag') r.addEventListener('animationend', () => r.remove()); return r;
  };
}
const CSS = `#devBtn,#devPanel{display:none!important}
#adFinger{position:fixed;inset:0;pointer-events:none;z-index:2147483647}
#adFinger .ad-ring{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(91,61,50,.55);box-shadow:0 2px 10px rgba(91,61,50,.25);animation:adTap .55s ease-out forwards}
#adFinger .ad-ring.ad-drag{animation:none;opacity:.9}
@keyframes adTap{0%{transform:scale(.55);opacity:.95}60%{opacity:.75}100%{transform:scale(1.35);opacity:0}}`;

run('phone_ad_capture', async (t) => {
  const p = () => t.p, ev = (f, a) => t.ev(f, a);
  // boot with Playwright's clock installed before the game loads (the harness's own clock is off)
  t.boot = async (o) => { await t.mk(o); await t.ctx.addInitScript(pageInit, { seed: SEED }); await t.ctx.clock.install({ time: new Date(DATE + 'T10:00:00') }); await p().goto(URL); await p().waitForSelector('#tNew, #tContinue'); return p(); };
  await t.newGame({ sex: 'girl', device: 'Ad Phone', head: '~Chihuahua' }, { bond: { level: 10, pts: 3300 }, coins: 2480, house: 'Royal Castle Kennel', dog: { name: 'Pip' } });
  await p().addStyleTag({ content: CSS });

  // the pack: a Chihuahua leader, a Corgi, a Husky and a Golden (4 is the game's cap), some in outfits; a wardrobe full of clothes; treats
  await ev(() => {
    const P = window.__paw, S = P.S;
    P.addDog({ key: 'corgi', sex: 'male', months: 20 }, 'Biscuit'); P.addDog({ key: 'husky', sex: 'female', months: 24 }, 'Luna'); P.addDog({ key: 'golden', sex: 'male', months: 30 }, 'Sunny');
    ['Party Hat', 'Flower Crown', 'Red Bandana', 'Bow Tie', 'Heart Sunglasses', 'Frog Raincoat', 'Yellow Raincoat', 'Pom-pom Beanie', 'Knit Winter Sweater'].forEach((n) => { if (!S.inv.clothes.includes(n)) S.inv.clothes.push(n); });
    S.dogs[1].outfit.neck = 'Red Bandana'; S.dogs[2].outfit.head = 'Flower Crown'; S.dogs[3].outfit.neck = 'Bow Tie';
    S.careDays = 60; S.spotsSeen = 4; S.careGifts = Object.assign(S.careGifts || {}, { hoodie: '2026-10-01' }); if (!S.inv.clothes.includes('Cozy Hoodie')) S.inv.clothes.push('Cozy Hoodie'); S.dogs.forEach((d) => { d.bond = { level: 10, pts: 3300 }; d.stats = { hunger: 70, happy: 85, energy: 95, clean: 95 }; });
    Object.assign(S.inv.food, { 'Bone-shaped Biscuit': 9, Pupcake: 3 }); if (!S.inv.toys.includes('Tennis Ball')) S.inv.toys.push('Tennis Ball');
    P.saveNow();
  });
  await t.calm(); await t.home('house'); await t.home('yard'); await t.lu();

  // ---- helpers ----
  const clearToasts = () => ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()));
  const center = (sel) => ev((s) => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, sel);
  const ring = (x, y) => (TAPS ? ev(([x, y]) => window.__adTap(x, y), [x, y]) : null);
  // a finger tap at a point (touch events, the way a phone sends them) with a ring
  const tapXY = async (x, y) => { await ring(x, y); await p().touchscreen.tap(x, y); };
  const tap = async (sel) => { const c = await center(sel); if (!c) { console.log('  (no ' + sel + ')'); return false; } await tapXY(c.x, c.y); return true; };
  const quiet = async () => { await t.lu(); await t.calm(); await clearToasts(); };
  const atYard = async (place) => { await t.home(place || 'yard'); await t.sleep(1200); await quiet(); };
  const stills = {};
  // a finger swipe that scrolls a list: swipe(sel, { by }) scrolls the first scroller in/around sel by `by` px, swipe(sel, { show: true }) scrolls
  // sel's own scroller until sel sits in the middle; axis 'y' (default) or 'x'; dur seconds; the finger dot rides along. Runs frame by frame in clip().
  let GL = [], curT = 0;
  const swipe = async (sel, o) => {
    o = Object.assign({ axis: 'y', dur: 0.6 }, o || {});
    const g = await ev(([sel, o]) => {
      const e = document.querySelector(sel); if (!e) return null; const Y = o.axis === 'y';
      const can = (n) => n && n.nodeType === 1 && (Y ? n.scrollHeight > n.clientHeight + 8 && /auto|scroll/.test(getComputedStyle(n).overflowY) : n.scrollWidth > n.clientWidth + 8 && /auto|scroll/.test(getComputedStyle(n).overflowX));
      let sc = null; if (o.show) { for (let n = e.parentElement; n && !sc; n = n.parentElement) if (can(n)) sc = n; } else sc = [e, ...e.querySelectorAll('*')].find(can) || null;
      if (!sc) return null; const id = 'g' + Math.random().toString(36).slice(2, 8); sc.dataset.adScroll = id;
      const R = sc.getBoundingClientRect(), max = Y ? sc.scrollHeight - sc.clientHeight : sc.scrollWidth - sc.clientWidth, from = Y ? sc.scrollTop : sc.scrollLeft;
      let to = from + (o.by || 0); if (o.show) { const r = e.getBoundingClientRect(); to = Y ? from + (r.top + r.height / 2) - (R.top + R.height * 0.5) : from + (r.left + r.width / 2) - (R.left + R.width * 0.5); }
      to = Math.max(0, Math.min(max, to));
      return { id, Y, from, to, fx: Y ? R.left + R.width * 0.68 : R.left + R.width * 0.78, fy: Y ? R.top + R.height * 0.72 : R.top + R.height * 0.5 };
    }, [sel, o]);
    if (g) GL.push(Object.assign(g, { t0: curT, dur: o.dur })); else console.log('  (nothing to swipe at ' + sel + ')');
  };
  const glide = () => {
    if (!GL.length) return null;
    const st = GL.map((g) => { const k = Math.max(0, Math.min(1, (curT - g.t0) / g.dur)), e = 0.5 - 0.5 * Math.cos(Math.PI * k), v = g.from + (g.to - g.from) * e, d = (g.to - g.from) * e; return { id: g.id, Y: g.Y, v, on: TAPS && k < 1, x: g.Y ? g.fx : g.fx - d, y: g.Y ? g.fy - d : g.fy, done: k >= 1 }; });
    GL = GL.filter((g, i) => !st[i].done);
    return ev((st) => { for (const s of st) { const el = document.querySelector(`[data-ad-scroll="${s.id}"]`); if (el) { if (s.Y) el.scrollTop = s.v; else el.scrollLeft = s.v; } let d = document.getElementById('adDrag' + s.id); if (s.on && !d) { d = window.__adTap(s.x, s.y, 'drag'); d.id = 'adDrag' + s.id; } if (d) { if (!s.on) d.remove(); else { d.style.left = s.x + 'px'; d.style.top = s.y + 'px'; } } } }, st);
  };

  // record one clip: secs long, ev = [[time s, async fn]], each(f, tSec) runs every frame, still = time of the still (s)
  async function clip(name, secs, o) {
    o = o || {}; const dir = path.join(OUT, name, 'frames');
    if (!process.env.KEEP && !FR) fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    GL = []; const evs = (o.ev || []).slice().sort((a, b) => a[0] - b[0]); const N = Math.round(secs * FPS);
    await clearToasts();
    const now = await ev(() => Date.now()); await p().clock.pauseAt(now + 150);
    await ev(() => window.__adStep(0)); let prev = 0; const t0 = Date.now();
    for (let f = 0; f < N; f++) {
      const ts = f / FPS;
      while (evs.length && evs[0][0] <= ts + 1e-6) { const [, fn] = evs.shift(); try { await fn(); } catch (e) { console.log('  event failed:', e.message.split('\n')[0]); } }
      curT = ts; if (o.each) await o.each(f, ts);
      await glide();
      await ev(() => window.__adStep(0)); // hold animations created by this frame's input at their start
      if (inRange(f)) await p().screenshot({ path: path.join(dir, String(f).padStart(5, '0') + '.png'), scale: 'device', caret: 'initial', timeout: 60000 }); // 1170 x 2532
      const next = Math.round(((f + 1) * 1000) / FPS), dt = next - prev; prev = next;
      await p().clock.runFor(dt); await ev((d) => window.__adStep(d), dt);
    }
    await ev(() => window.__adRelease()); await p().clock.resume();
    console.log(`${name}: ${N} frames (${secs}s at ${FPS} fps) in ${Math.round((Date.now() - t0) / 1000)}s`);
    stills[name] = Math.min(N - 1, Math.round((o.still != null ? o.still : secs * 0.6) * FPS));
  }
  const ids = async () => (await t.S()).dogs.map((d) => d.id);
  const packTapPt = (id) => ev((id) => { const g = document.querySelector(`#pack [data-dog="${id}"] .pd-wander > rect`); if (!g) return null; const r = g.getBoundingClientRect(); for (const fy of [0.55, 0.45, 0.65]) for (const fx of [0.5, 0.4, 0.6]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y), h = e && e.closest('[data-dog]'); if (h && h.dataset.dog === id) return { x, y }; } return null; }, id);
  const hearts = (on) => ev((on) => window.__paw.ex && window.__paw.ex.rnd(on ? 0 : null), on); // rnd 0 = the first face of the event's list (pet: hearts, treat: yum)

  // ---- 1. home: the pack roams the yard, the player pets Pip and then Luna ----
  if (WANT.includes('home')) {
    await atYard('yard'); await ev(() => { const x = window.__paw.ex; if (x) { x.cool(); x.roam(true); } }); await t.sleep(2500); await quiet();
    const [A, B, L, G] = await ids();
    // a dog strolls to a spot in view (the game's own roam move: it walks there and picks its own pose)
    const stroll = (id, fx, fy) => ev(([id, fx, fy]) => { const R = window.__paw.rm, z = R.zone('yard'), v = document.querySelector('#view svg.world').viewBox.baseVal; const x = v.x + v.width * fx, y = z.y0 + (z.y1 - z.y0) * fy; if (R.ok(id, x, y)) R.to(id, x, y); }, [id, fx, fy]);
    await clip('home', 5, { still: 2.3, ev: [
      [0.1, () => stroll(B, 0.38, 0.75)], [0.5, () => stroll(G, 0.62, 0.35)], [3.9, () => stroll(A, 0.45, 0.6)],
      [1.3, async () => { await hearts(true); await tap('#dogHit'); }],
      [2.0, async () => { await hearts(false); }],
      [3.0, async () => { const q = await packTapPt(L); if (q) { await hearts(true); await tapXY(q.x, q.y); } }],
      [3.6, async () => { await hearts(false); }],
    ] });
    void A;
  }

  // ---- 2. shelter: the Shelter Playroom, pet a room dog, open the Adopt-me board and browse the dogs looking for a home ----
  if (WANT.includes('shelter')) {
    await atYard('yard');
    await p().click('[data-act=map]'); await p().waitForSelector('[data-area=shelter]'); await ev(() => window.__paw.mapTo('shelter')); await t.sleep(500);
    await p().click('[data-area=shelter]', { force: true }); await t.sleep(400); if (await p().locator('#mapGoBtn').count()) await p().click('#mapGoBtn');
    await t.untilMode('shelter', 10000); await t.sleep(3000); await clearToasts();
    await clip('shelter', 6.5, { still: 4.1, ev: [
      [0.8, async () => { const q = await ev(() => { const l = [...document.querySelectorAll('#srDogs [data-srdog] .sr-hit')].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.top > 120 && r.bottom < innerHeight - 160); if (!l.length) return null; const r = l[0]; return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 }; }); if (q) await tapXY(q.x, q.y); }],
      [2.2, async () => { await tap('#srBoard'); }],
      [3.2, () => swipe('#modal .panel', { by: 820, dur: 1.1 })],
      [4.9, () => swipe('#modal .panel', { by: 930, dur: 1.2 })],
    ] });
    await t.closeX(); await p().keyboard.press('Escape'); await t.sleep(400); await p().keyboard.press('Escape'); await t.sleep(400);
  }

  // ---- 3. wardrobe: dress Pip, three picks in a row, then back to the yard in the new look ----
  if (WANT.includes('wardrobe')) {
    await atYard('yard');
    await ev(() => { const o = window.__paw.S.outfit; o.head = null; o.eyes = null; o.body = null; o.neck = null; window.__paw.saveNow(); });
    // the phone Wardrobe sheet is drawn again after every pick (it pops in again, back at the top), so the picks stay in the top rows and are spaced out
    await clip('wardrobe', 6, { still: 4.4, ev: [
      [0.6, () => tap('[data-act=wardrobe]')],
      [1.5, () => tap('#modal [data-eq="Party Hat"]')],
      [2.6, () => tap('#modal [data-eq="Heart Sunglasses"]')],
      [3.7, () => tap('#modal [data-eq="Flower Crown"]')],
      [4.9, () => tap('#modal .panel .x')],
    ] });
    await t.lu();
  }

  // ---- 4. walk: the walk runner with the pack following, hops over the path ----
  if (WANT.includes('walk')) {
    await atYard('yard'); await ev(() => { window.__paw.S.daily.play = true; });
    await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart'); await t.sleep(400); await p().click('#rtStart');
    await t.walkGate(false); await clearToasts();
    // the clip starts on the "Ready" count, then the run with a few taps to jump
    await t.until(() => !!document.querySelector('.pw-cd'), null, 8000);
    const jump = async () => { const v = await ev(() => { const s = document.querySelector('.pw-stage, .pw-scene, .pw-world') || document.getElementById('view'); const r = s.getBoundingClientRect(); return { x: r.left + r.width * 0.55, y: r.top + r.height * 0.45 }; }); await tapXY(v.x, v.y); };
    await clip('walk', 6, { still: 3.7, ev: [[2.4, jump], [3.4, jump], [4.3, jump], [5.2, jump]] });
    await t.quitWalk(true); await t.lu();
  }

  // ---- 5. play: open Feed, give Pip a Bone-shaped Biscuit, the yum face ----
  if (WANT.includes('play')) {
    await atYard('yard'); await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.hunger = 55; }); window.__paw.saveNow(); });
    await clip('play', 5, { still: 3.2, ev: [
      [0.6, () => tap('[data-act=feed]')],
      [1.5, async () => { await hearts(true); await tap('[data-food="Bone-shaped Biscuit"]'); }],
      [2.6, async () => { await hearts(false); }],
    ] });
    await p().keyboard.press('Escape'); await t.sleep(300); await t.lu();
  }

  // ---- 6. ball: ball play in the yard, two throws, the pack races for it ----
  if (WANT.includes('ball')) {
    await atYard('yard');
    await p().click('[data-act=play]'); await p().waitForSelector('[data-play="ball:Tennis Ball"]'); await p().click('[data-play="ball:Tennis Ball"]');
    await t.until(() => window.__paw.bl && window.__paw.bl.on && window.__paw.bl.state.ph === 'rest', null, 8000); await t.sleep(600); await clearToasts();
    // a throw: the finger grabs the ball and flicks it over 4 frames, then lets go (the game's own drag handler on the scene)
    let fl = null;
    const grab = async (dx, dy) => {
      const b = await ev(() => { const e = document.querySelector('#blBall'); const r = e ? e.getBoundingClientRect() : null; return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
      if (!b) { await ev(() => window.__paw.bl.easy()); return; }
      await p().mouse.move(b.x, b.y); await p().mouse.down(); fl = { b, dx, dy, i: 0 };
      if (TAPS) await ev(([x, y]) => { const r = window.__adTap(x, y, 'drag'); r.id = 'adDrag'; }, [b.x, b.y]);
    };
    await clip('ball', 6, { still: 1.6, ev: [[0.5, () => grab(90, -170)], [3.6, () => grab(-80, -160)]], each: async () => {
      if (!fl) return; fl.i++;
      const k = Math.min(1, fl.i / 4), x = fl.b.x + fl.dx * k, y = fl.b.y + fl.dy * k;
      await p().mouse.move(x, y); await ev(([x, y]) => { const r = document.getElementById('adDrag'); if (r) { r.style.left = x + 'px'; r.style.top = y + 'px'; } }, [x, y]);
      if (k >= 1) { await p().mouse.up(); await ev(() => { const r = document.getElementById('adDrag'); if (r) r.remove(); }); fl = null; if (await ev(() => window.__paw.bl.state.thrown === 0)) console.log('  (the flick did not throw)'); }
    } });
    await ev(() => window.__paw.bl.stop()); await t.sleep(600); await t.lu();
  }

  // ---- 7. photo: photo mode from the "..." sheet, faces for the whole pack ----
  if (WANT.includes('photo')) {
    await atYard('yard'); await t.sleep(800); await quiet();
    await clip('photo', 5.5, { still: 4.6, ev: [
      [0.5, () => tap('#moreBtn')],
      [1.2, () => tap('#mmPhoto')],
      [2.6, () => swipe('[data-exface="hearts"]', { axis: 'x', show: true, dur: 0.6 })],
      [3.4, () => tap('[data-exface="hearts"]')],
      [4.5, () => tap('[data-exface="proud"]')],
    ] });
    await ev(() => window.__paw.ph && window.__paw.ph.close()); await t.lu();
  }

  // ---- encode, stills, contact sheet ----
  const ff = (args) => cp.execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  const done = [];
  for (const name of ALL) {
    const dir = path.join(OUT, name, 'frames'); if (!WANT.includes(name) || !fs.existsSync(dir) || !fs.readdirSync(dir).length) continue;
    ff(['-framerate', String(FPS), '-start_number', '0', '-i', path.join(dir, '%05d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', path.join(OUT, name + '.mp4')]);
    const sf = path.join(dir, String(stills[name] || 0).padStart(5, '0') + '.png'); if (fs.existsSync(sf)) fs.copyFileSync(sf, path.join(OUT, 'stills', name + '.png'));
    done.push(name);
  }
  const st = ALL.map((n) => path.join(OUT, 'stills', n + '.png')).filter((f) => fs.existsSync(f));
  if (st.length === 1) fs.copyFileSync(st[0], path.join(OUT, 'contact_sheet.png'));
  else if (st.length > 1) { // up to 4 per row, 390 x 844 each with a white margin
    const cols = Math.min(4, st.length), inp = st.flatMap((f) => ['-i', f]), sc = st.map((_, i) => `[${i}]scale=390:844,pad=402:856:6:6:color=white[s${i}]`).join(';');
    const lay = st.map((_, i) => `${(i % cols) * 402}_${Math.floor(i / cols) * 856}`).join('|');
    ff([...inp, '-filter_complex', `${sc};${st.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${st.length}:layout=${lay}:fill=white`, path.join(OUT, 'contact_sheet.png')]);
  }
  console.log('clips:', done.map((n) => path.join(OUT, n + '.mp4')).join(' '));
}, { device: 'Ad Phone', date: DATE, clock: false, time: 'auto', weather: process.env.WEATHER || 'sunny', season: process.env.SEASON || 'summer', fest: 'off', packCare: true, prefs: { rmTest: true, exTest: true, jpTest: true }, timeout: 1800000 });
