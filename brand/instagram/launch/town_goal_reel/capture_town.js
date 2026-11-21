// The 21 Nov 2026 "Help the town" Reel (v2.30 "Better together": the shared town goal, November 2026 = 2,000 belly rubs; docs/marketing/TOWN_GOAL_REEL.md):
// clean captures from a fresh worktree of origin/main (game/test_merged.html: node game/build.js && node game/harness.js merged), with the test harness
// (game/test_lib.js). Nothing in main changes. The page date is 21 Nov 2026 (autumn, sunny, day). The town goal is switched on with the game's own test
// hook (window.__paw.gl.test(true): prefs.btTest) and its board state is PATCHED (window.__paw.gl.set): the Reel shows how the meter works, never a
// live count (we do not know the real one).
//   <place>.svg   svg.world as the game draws each place (our own dog, the roaming dogs, the effects and the visitor left out): hilltop, woods, river,
//                 pier, square (the floor props kept: they sort with the dogs in #pack). The square is grabbed with Gerald's paper pinned on the notice board (#glG, glBoardDraw) at an empty meter (n 0 of 2,000);
//                 build_town.js fills the meter's rect exactly as the game's glMiniDraw does (width = data-w x the fill).
//   props.json    for each place, the drawn box (scene units) of every top-level piece of its scene, to pick the props the dogs keep clear of
//   art.json      the game's own art: Gerald the duck (PawArt.prop('gerald', { pose })), the treat bag's items (PawArt.item: Pupcake, Bone-shaped Biscuit)
//   draw.json     Noodle (PawArt.dog('dachs') in the Autumn Scarf) in each pose and facing, with the state of its frame animation at every frame of one
//                 loop, read off the page on the FROZEN CLOCK (../frozen_clock.js: freezeClock, stepClock at exactly 1000/30 ms, releaseClock).
//                 The art's frame animation loops every second (pa-d-f0..f2), so 30 frames are the whole loop; the build checks the loop is exact.
//   facts.json    the date, the goal state the game read back, the board's boxes, the place names, the game's words on the note (aria-label)
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/town_goal_reel/capture_town.js <main checkout> <outdir>
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'town_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const { freezeClock, stepClock, releaseClock } = require('../frozen_clock.js');
const PLACES = (process.env.PLACES || 'hilltop,woods,river,square,pier').split(',');
const POSES = ['idle', 'sit', 'pet', 'happy', 'walk', 'bow'];
const OUTFIT = { neck: 'Autumn Scarf' };
run('town_capture', async (t) => {
  const { ev } = t, p = () => t.p, facts = { scenes: {} }, props = {};
  const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
  const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
  await t.newGame({ map215: true, ground: true, time: 'day', season: 'autumn', weather: 'sunny', head: '~Dachshund', sex: 'boy' }, { coins: 3000, dog: { name: 'Noodle' } });
  await t.calm(); await t.lu(); await settle();
  await ev((o) => { window.__paw.S.dog.outfit = Object.assign({}, window.__paw.S.dog.outfit || {}, o); window.__paw.saveNow(); }, OUTFIT);
  facts.date = await ev(() => new Date().toISOString().slice(0, 10));
  // the town goal on (the game's own test switch), the board's state patched: an empty meter for November (the build fills it)
  await ev(() => { window.__paw.gl.test(true); window.__paw.gl.set({ month: '2026-11', goal: 2000, n: 0, done: false, mine: 0, part: false }); });
  facts.glOn = await ev(() => window.__paw.gl.on()); facts.glMonth = await ev(() => window.__paw.gl.month()); facts.treats = await ev(() => window.__paw.gl.treats);
  if (!facts.glOn || facts.glMonth !== '2026-11') throw new Error('the town goal is off or not November: ' + JSON.stringify([facts.glOn, facts.glMonth]));

  for (const pl of PLACES) {
    await t.home(pl); await p().waitForTimeout(1200); await closeAll();
    if (pl === 'square') { await ev(() => window.__paw.gl.board()); await t.until(() => !!document.querySelector('#view svg.world #glG .gl-note-fill'), null, 5000); }
    const r = await ev(() => { const s = document.querySelector('#view svg.world'), inv = s.getScreenCTM().inverse();
      const bb = (e) => { const r0 = e.getBoundingClientRect(); if (!r0.width && !r0.height) return null; const a = new DOMPoint(r0.left, r0.top).matrixTransform(inv), z = new DOMPoint(r0.right, r0.bottom).matrixTransform(inv); return [a.x, a.y, z.x, z.y].map((v) => Math.round(v)); };
      // the scene's pieces: the children of #sceneG (or of the world itself), each with its box
      // the floor props (v2.15 ground: they sort with the dogs in #pack) and the scene's tap boxes, each with its box
      const parts = [];
      [...s.querySelectorAll('#pack > *:not(.rmdog), #sceneG [data-hot], #sceneG [id$="G"]')].forEach((e, i) => { if (e.closest('.rmdog') || e.id === 'pack') return; const b = bb(e); if (b) parts.push({ i, tag: e.tagName, id: e.id || '', cls: (e.getAttribute('class') || '').slice(0, 40), hot: e.getAttribute('data-hot') || '', aria: (e.getAttribute('aria-label') || (e.querySelector('[aria-label]') || { getAttribute: () => '' }).getAttribute('aria-label') || '').slice(0, 40), b }); });
      const g = s.querySelector('#glG'), fill = g && g.querySelector('.gl-note-fill'), hot = s.querySelector('[data-hot="notice"]');
      const c = s.cloneNode(true);
      ['#pack .rmdog', '#pkFol', '#fbPackBowls', '#zzz', '#fx', '#ballLayer', '#messG', '#visitorG', '#yvHost', '#dogG', '#dogPos', '#dogHit', '.gr-game'].forEach((q) => c.querySelectorAll(q).forEach((e) => e.remove()));
      return { svg: c.outerHTML, vb: s.getAttribute('viewBox'), place: window.__paw.S.place, name: window.__paw.placeName(window.__paw.S.place), parts,
        gl: g ? { box: bb(g), fill: bb(fill), dataW: fill.getAttribute('data-w'), w: fill.getAttribute('width'), aria: g.querySelector('[data-gl-hot]').getAttribute('aria-label'), tf: g.getAttribute('transform') } : null, notice: hot ? bb(hot) : null }; });
    if (r.place !== pl) throw new Error('not at ' + pl + ': ' + r.place);
    fs.writeFileSync(path.join(OUT, pl + '.svg'), r.svg); props[pl] = r.parts;
    facts.scenes[pl] = { vb: r.vb, name: r.name, gl: r.gl, notice: r.notice };
    console.log('scene', pl, r.vb, r.name, r.gl ? JSON.stringify(r.gl) : '', r.notice ? 'notice ' + r.notice : '');
  }
  if (!facts.scenes.square.gl || +facts.scenes.square.gl.w !== 0) throw new Error('Gerald\'s paper is not on the board, or its meter is not empty');

  // the game's own art: Gerald and the treat bag's items
  const art = await ev(() => { const P = window.PawArt; return { gerald_cheer: P.prop('gerald', { pose: 'cheer' }), gerald_wave: P.prop('gerald', { pose: 'wave' }), pupcake: P.item('Pupcake'), biscuit: P.item('Bone-shaped Biscuit') }; });
  for (const [k, v] of Object.entries(art)) if (typeof v !== 'string' || !v.includes('<svg')) throw new Error('no art for ' + k);
  fs.writeFileSync(path.join(OUT, 'art.json'), JSON.stringify(art));

  // Noodle, animated on the frozen clock: one loop (30 frames) of each pose, read off the page
  await t.home('yard'); await p().waitForTimeout(500);
  const draws = []; for (const pose of POSES) for (const facing of ['left', 'right']) draws.push({ who: 'noodle', key: 'dachs', pose, facing, o: { pose, facing, outfit: OUTFIT } });
  await ev(() => { const h = document.createElement('div'); h.id = 'vrHost'; h.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:400px;z-index:99999;background:#fff'; document.body.appendChild(h); });
  const t0 = await freezeClock(p());
  const out = {}; let base = Math.ceil(t0) + 1000;
  for (const D of draws) {
    const svg = await ev(([key, o]) => { const s = window.PawArt.dog(key, o); document.getElementById('vrHost').innerHTML = s; return s; }, [D.key, D.o]);
    if (!svg.includes('pa-pose-' + D.pose)) throw new Error(D.who + ' has no ' + D.pose + ' drawing');
    const vis = [];
    for (let n = 0; n < 31; n++) {
      await stepClock(p(), base + n * 1000 / 30);
      vis.push(await ev(() => { const h = document.getElementById('vrHost'), fr = [...h.querySelectorAll('[class*="pa-d-f"]')].filter((e) => /\bpa-d-f\d\b/.test(e.getAttribute('class')));
        const other = document.getAnimations().filter((a) => a.effect && a.effect.target && h.contains(a.effect.target) && !/\bpa-d-f\d\b/.test(a.effect.target.getAttribute('class') || ''));
        if (other.length) return { err: 'other animations: ' + other.map((a) => a.animationName || a.id).join(',') };
        return fr.map((e) => +getComputedStyle(e).opacity); }));
    }
    if (vis.some((v) => v.err)) throw new Error(D.pose + ': ' + vis.find((v) => v.err).err);
    if (JSON.stringify(vis[30]) !== JSON.stringify(vis[0])) throw new Error(D.pose + ' does not loop in 1 s: ' + JSON.stringify(vis));
    base += 2000;
    out[D.who + '_' + D.pose + '_' + D.facing] = { who: D.who, key: D.key, pose: D.pose, facing: D.facing, svg, vis: vis.slice(0, 30), step: '1000/30 ms, frozen clock' };
  }
  await releaseClock(p());
  console.log('drawings', Object.keys(out).length, 'loops of 30 frames; pet frames', JSON.stringify(out.noodle_pet_right.vis.map((v) => v.indexOf(1)).join('')));
  fs.writeFileSync(path.join(OUT, 'draw.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(OUT, 'props.json'), JSON.stringify(props, null, 1));
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 1));
}, { date: process.env.CAP_DATE || '2026-11-21', timeout: 400000, season: 'autumn', weather: 'sunny' });
