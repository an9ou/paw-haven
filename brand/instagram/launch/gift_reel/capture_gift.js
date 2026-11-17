// The 18 Nov 2026 gift-code launch Reel (docs/marketing/GIFT_REEL.md): clean captures of the game's own screens and scenes from the v2.26-v2.29
// release build (game/test_merged.html of origin/claude/release-26-29: node game/build.js && node game/harness.js merged), with the test harness
// (game/test_lib.js). The four features are switched on only in this page through the harness's test prefs (yvTest, prTest, stTest, smTest) and a
// page date after the launch (20 Nov 2026); nothing in the branch changes. Noodle the dachshund is adopted, the What's new sheet is marked seen.
//   scenes (svg.world as drawn by the game, our own dog, a visitor and the effects left out, for build_gift.js to draw at 3.2x):
//     yard.svg   the Home Yard by day (autumn), nothing put out
//     visitor.svg the visiting dog as the game draws it in the yard (the four new toys out, a visit after 8 hours away, Biscuit with the Tug Post)
//     pier.svg   the Lighthouse Pier at night, all four town projects built: the new lighthouse lit, its beam out
//     square.svg the Town Square by day with the fountain, the bandstand and Sakura Avenue built
//     house.svg  the Cozy House living room
//   sheets (3x PNG, transparent round corners; the close cross and the dev button hidden):
//     yv_card    the visitor's card ("{name} is visiting!": its crayon drawing, the line "came by and tried the ...!")
//     st_letter  Mrs Plum's first story letter in the mailbox ("A woolly idea")
//     sm_page    Gerald's storybook page (Story: 8 chapters, 2 done)
//     seq_<id>/   a run of frames (30 a second) of one of the game's own crayon scenes (the Story mode scene engine, #scLayer)
//     pm_sheet   the "Have a code?" sheet, the field EMPTY with a neutral placeholder (YOURCODE; nothing in Chinese), never a real code
//     pm_card    the game's gift card for the code's gift (the Follower Star Bandana, the Paw-Print Pennant, 100 coins); its "Code ...:" line hidden
//   NODE_PATH=$(npm root -g) [PAW_LANG=zh-Hans] node brand/instagram/launch/gift_reel/capture_gift.js <release checkout> <outdir>
// facts.json lists the game lines the captures carry (the build checks them).
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'gift_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const LANG = process.env.PAW_LANG || '';
const CLEAN = '#devBtn,#toasts,.sheet-grab,#modal .xbtn,#modal .x,.ks-got-hi,.mb-get,.mb-got{display:none!important}'
  + 'body *:not(#modal):not(#modal *){visibility:hidden!important}#modal,#modal *{visibility:visible}'
  + '#modal,#stage,html,body{background:transparent!important;backdrop-filter:none!important;box-shadow:none}';
const ON = { prTest: true, yvTest: true, stTest: true, smTest: true };
const TOYS = ['Tug Post', 'Puddle Pool', 'Play Tunnel', 'Bubble Fountain'];
run('gift_capture', async (t) => {
  const { ev } = t, p = () => t.p, facts = {};
  const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
  const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
  await t.newGame({ map215: true, ground: true, prefs: ON, time: 'day', season: 'autumn', weather: 'sunny', head: '~Dachshund', sex: 'boy' }, { coins: 3000, dog: { name: 'Noodle' } });
  await t.calm(); await t.lu(); await settle();
  // the language (the RedNote cut): switched in the game and reloaded with the save, as back_reel/capture_back.js
  const setLang = async (l) => {
    await ev((l) => { window.__paw.S.lang = l; window.__paw.saveNow(); const K = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { pr = {}; } pr.lang = l; localStorage.setItem(K, JSON.stringify(pr)); }, l);
    await t.reloadKeepingSave(); await p().waitForSelector('#tContinue'); await p().click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); await settle();
  };
  if (LANG) { await setLang(LANG); console.log('language', await ev(() => document.documentElement.lang)); }
  const prefsTime = async (tm) => { // the Dev panel's time pin (prefs.ovrTime), then a reload with the save
    await ev((tm) => { const K = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { pr = {}; } pr.ovrTime = tm; localStorage.setItem(K, JSON.stringify(pr)); window.__paw.saveNow(); }, tm);
    await t.reloadKeepingSave(); await p().waitForSelector('#tContinue'); await p().click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); await settle();
  };
  // the scene as the game draws it: svg.world with our own dog (#pack), the zzz, the effects and the ball left out; the boxes of named things
  const grab = async (name, sels) => {
    await p().waitForTimeout(900);
    const r = await ev((sels) => { const s = document.querySelector('#view svg.world'); const c = s.cloneNode(true); ['#pack .rmdog', '#zzz', '#fx', '#ballLayer', '#messG', '#visitorG'].forEach((q) => c.querySelectorAll(q).forEach((e) => e.remove()));
      const box = {}; for (const [k, q] of Object.entries(sels || {})) { const e = s.querySelector(q); if (e) { const b = e.getBBox(), m = e.getCTM(), sm = s.getScreenCTM(); const r0 = e.getBoundingClientRect(), inv = sm.inverse(); const a = new DOMPoint(r0.left, r0.top).matrixTransform(inv), z = new DOMPoint(r0.right, r0.bottom).matrixTransform(inv); box[k] = [a.x, a.y, z.x, z.y].map((v) => Math.round(v)); } }
      return { svg: c.outerHTML, vb: s.getAttribute('viewBox'), box }; }, sels);
    fs.writeFileSync(path.join(OUT, name + '.svg'), r.svg); facts['scene_' + name] = { vb: r.vb, box: r.box }; console.log('scene', name, r.vb, JSON.stringify(r.box));
  };
  const cdp = await t.ctx.newCDPSession(p());
  const shoot = async (sel, name, scale) => {
    await p().waitForTimeout(700);
    const r = await ev((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.left, y: q.top, width: q.width, height: q.height }; }, sel);
    if (!r) throw new Error('no ' + sel);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const s = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: Object.assign({}, r, { scale: scale || 3 }) });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(s.data, 'base64')); console.log('wrote', name, Math.round(r.width), 'x', Math.round(r.height));
    const txt = await ev((s) => document.querySelector(s).innerText, sel); fs.writeFileSync(path.join(OUT, name + '.txt'), txt); facts[name] = txt;
  };
  let style = null; const clean = async (on) => { if (on && !style) style = await p().addStyleTag({ content: CLEAN }); if (!on && style) { await style.evaluate((e) => e.remove()); style = null; } };

  await ev(() => { window.__ddPromoMode = 'ok'; });
  // ---- 0. the gift card (first, so the card lists every item as new): what the code gives (the grant runs in this page only, with a made-up key; no code is shown) ----
  await ev(() => { const o = window.__paw.pm.grant({ key: 'REELSAMPLE', code: 'REELSAMPLE', reward: { items: ['Follower Star Bandana', 'Paw-Print Pennant'], coins: 100 }, at: Date.now() }); window.__pmo = o; });
  await ev(() => window.__paw.pm.card(window.__pmo)); await t.until(() => !!document.querySelector('#modal .pm-got'), null, 5000); await p().waitForTimeout(1800);
  await clean(true); await shoot('#modal .panel', 'pm_card'); await clean(false); await closeAll();
  // ---- 1. the yard: first as it is (the Reel's background, nothing put out), then the four new toys out and a visitor after 8 hours away ----
  await t.home(); await p().waitForTimeout(600);
  await grab('yard', {});
  await ev((ns) => { const P = window.__paw, S = P.S; ns.forEach((n) => { S.decor[n] = { got: '2026-11-18', out: true }; S.decor[n].at = P.ho.freeSpot(n); }); P.saveNow(); }, TOYS);
  await t.home(); await p().waitForTimeout(600);
  // who comes is seeded by S.visitors.seed (fixed at a save's first load): try seeds until the visitor shown is Biscuit the beagle with the Tug Post
  // (VISITOR=<id>:<toy> picks another), so every run and both languages show the same visit
  const want = (process.env.VISITOR || 'biscuit:Tug Post').split(':');
  const vis = await ev((w) => { const P = window.__paw, V = P.S.visitors, keep = JSON.parse(JSON.stringify(V));
    for (let i = 1; i < 400; i++) { Object.assign(V, JSON.parse(JSON.stringify(keep)), { seed: 'reel' + i, met: {}, q: [], log: [], gday: '', cday: 0, flowers: 0 }); P.yv.away(8 * 3600e3); P.yv.catchUp(Date.now());
      const q = P.yv.state().q, l = q[q.length - 1]; if (l && l.id === w[0] && l.toy === w[1]) return { seed: V.seed, q: q.map((x) => x.id + ':' + x.toy) }; }
    return null; }, want);
  if (!vis) throw new Error('no seed brings ' + want.join(' with the '));
  console.log('visitors', JSON.stringify(vis)); facts.visitors = vis;
  await ev(() => window.__paw.yv.draw()); await t.home(); await t.until(() => !!document.querySelector('#visitorG.yv'), null, 8000);
  // the visitor's own drawing in the yard (dogSVG of its breed and starter coat, pose happy), for build_gift.js to stand on the grass
  fs.writeFileSync(path.join(OUT, 'visitor.svg'), await ev(() => { const g = document.querySelector('#visitorG svg'); return g ? g.outerHTML : ''; }));
  facts.visitorTag = await ev(() => (document.querySelector('#visitorG') || {}).textContent || '');
  // the visitor's card
  await ev(() => window.__paw.yv.card()); await t.until(() => !!document.querySelector('#modal .yv-card'), null, 5000);
  await clean(true); await shoot('#modal .panel', 'yv_card'); await clean(false); await closeAll();
  // the toys go in again, so no later scene shows them
  await ev((ns) => { const S = window.__paw.S; ns.forEach((n) => { if (S.decor[n]) S.decor[n].out = false; }); window.__paw.yv.away(0); window.__paw.saveNow(); }, TOYS);
  // ---- 2. a neighbour's story: Mrs Plum's first letter, in the mailbox ----
  const sl = await ev(() => window.__paw.st.letters(true)); console.log('story letter', sl); facts.storyLetter = sl;
  await ev(() => window.__paw.openMailbox('st_plum_0')); await t.until(() => !!document.querySelector('#modal article.letter'), null, 5000);
  await clean(true); await shoot('#modal .mb-read article.letter', 'st_letter'); await clean(false); await closeAll();
  // ---- 3. Gerald's storybook: the Story page (chapters 1 and 2 done) ----
  await ev(() => { window.__paw.sm.start(); window.__paw.sm.goto(3); });
  await ev(() => window.__paw.sm.open('story')); await t.until(() => !!document.querySelector('#modal .sm-sheet'), null, 5000);
  await clean(true); await shoot('#modal .panel', 'sm_page'); await clean(false); await closeAll();
  // ---- 4. the crayon scenes (Story mode): a run of frames of a scene (SEQ=<id>:<from ms>-<to ms>, 30 a second, the Skip button hidden).
  // Owner, 17 Nov 2026: the first run stuttered. It was taken with sc.seek(ms) and a screenshot while the page clock kept running, so each
  // frame landed 15-200 ms late by a different amount (frame-to-frame motion went 14..950). Now the page's clock is stepped: performance.now()
  // and requestAnimationFrame run on a virtual clock that only moves when we say (every queued frame callback is called with the new time),
  // and every CSS animation is paused and set to its age on that clock, so frame n is exactly from + n x 33.33 ms of the scene.
  await ev(() => {
    const P = performance, real = P.now.bind(P), raf = window.requestAnimationFrame.bind(window); let v = real(), q = [];
    const born = new WeakMap();
    window.__vclock = { now: () => v, step: (to) => { v = to; const cbs = q; q = []; for (const cb of cbs) { try { cb(v); } catch (e) { /* a game callback */ } }
      for (const a of document.getAnimations()) { if (!born.has(a)) born.set(a, v); a.pause(); a.currentTime = Math.max(0, v - born.get(a)); } } };
    window.__vclock.release = () => { P.now = real; window.requestAnimationFrame = raf; const cbs = q; q = []; cbs.forEach((cb) => raf(cb)); document.getAnimations().forEach((a) => a.play()); };
    P.now = () => v; window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  });
  for (const [id, rg] of (process.env.SEQ || 'prologue:4100-7900').split(';').map((x) => x.split(':'))) {
    const [a, z] = rg.split('-').map(Number), dir = path.join(OUT, 'seq_' + id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const t0 = await ev((id) => { const v = window.__vclock.now(); window.__paw.sc.play(id); window.__vclock.step(v); return v; }, id);
    await t.until(() => !!document.querySelector('#scLayer') && !document.querySelector('#scLayer').hidden, null, 5000);
    const cl = await p().addStyleTag({ content: '.sc-skip,#devBtn,#toasts{display:none!important}' });
    let n = 0; for (let m = a; m <= z + 0.01; m = a + (n * 1000) / 30) {
      await ev((tt) => { window.__vclock.step(tt); }, t0 + m);
      await p().locator('#scLayer').screenshot({ path: path.join(dir, 'f' + String(n++).padStart(3, '0') + '.jpg'), type: 'jpeg', quality: 92, scale: 'css', animations: 'allow' }); }
    facts['seq_' + id] = { from: a, to: z, n, step: 'virtual clock, 33.33 ms a frame', cap: await ev(() => (document.querySelector('#scLayer .sc-cap') || {}).innerText || '') };
    console.log('scene', id, n, 'frames', JSON.stringify(facts['seq_' + id].cap));
    await cl.evaluate((e) => e.remove());
    await ev((tt) => { window.__paw.sc.skip(); window.__vclock.step(tt); }, t0 + z + 100);
  }
  // the real clock again for the rest
  await ev(() => window.__vclock.release());
  await p().waitForTimeout(600);
  // ---- 5. the code sheet: "Have a code?", the field empty with a neutral placeholder ----
  await ev(() => { window.__ddPromoMode = 'ok'; });
  await ev(() => window.__paw.pm.open()); await t.until(() => !!document.querySelector('#modal #pmCode'), null, 5000);
  await ev((l) => { const i = document.getElementById('pmCode'); i.value = ''; i.setAttribute('placeholder', l ? '' : 'YOURCODE'); i.blur(); }, LANG);
  await clean(true); await shoot('#modal .panel', 'pm_sheet'); await clean(false); await closeAll();
  // the Settings box (where it sits): the same field under "Have a code?"
  await ev(() => window.__paw.pm.settings()); await t.until(() => !!document.querySelector('#modal #pmBox'), null, 5000);
  await ev((l) => { const i = document.getElementById('pmCode'); i.value = ''; i.setAttribute('placeholder', l ? '' : 'YOURCODE'); i.blur(); document.getElementById('pmBox').scrollIntoView(); }, LANG);
  facts.settingsTitle = await ev(() => document.querySelector('#modal .panel h2, #modal .panel .ttl, #modal .panel header') ? document.querySelector('#modal .panel h2, #modal .panel .ttl, #modal .panel header').innerText : '');
  await clean(true); await shoot('#modal #pmBox', 'pm_box'); await clean(false); await closeAll();
  // ---- 7. the scenes for the backgrounds: the Town Square by day with three builds, the house, then the pier at night with all four ----
  await ev(() => { const pr = window.__paw.S.projects; pr.built = ['fountain', 'bandstand', 'sakura', 'lighthouse']; pr.i = 4; pr.paid = 0; pr.building = []; window.__paw.saveNow(); });
  await t.home('square'); await t.until(() => !!document.querySelector('#prG'), null, 8000);
  await grab('square', { fountain: '[data-pr-hot="fountain"]', bandstand: '[data-pr-hot="bandstand"]', board: '[data-pr-hot="board"]' });
  await t.home('house');
  await grab('house', {});
  await prefsTime('night');
  await t.home('pier'); await t.until(() => !!document.querySelector('.pr-glow .pr-beam'), null, 8000);
  await grab('pier', { lighthouse: '[data-pr-hot="lighthouse"]' });
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 1));
}, { date: process.env.CAP_DATE || '2026-11-20', timeout: 300000, season: 'autumn', weather: 'sunny' });
