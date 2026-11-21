// "Peak momiji week" loop Reel (owner approved 21 Nov 2026; docs/marketing/MOMIJI_REEL.md): clean captures from a fresh worktree of origin/main
// (game/test_merged.html: node game/build.js && node game/harness.js merged), with the test harness (game/test_lib.js). Nothing in main changes.
// The page date is 21 Nov 2026 (autumn), golden hour (time 'dusk'), sunny, the Japan scenery on (prefs.jpTest: in the game envNow().jp is on),
// the Tokyo trip on (prefs.tkTest), and the festivals left to the date (no override).
//   ueno.svg      svg.world as the game draws Ueno Park (our own dog, the roaming dogs, the effects layer and the visitor left out): the two big
//                 momiji trees of the Shinobazu pond, red in autumn
//   props.json    the drawn box (scene units) of every top-level piece of the scene and of its tap spots (the stamp stall, the hanami deck)
//   leaf.json     the game's own falling momiji: Ueno's "Momiji walk" (39_tokyo.js tkHanami -> tkPetals('momiji')) is run in the game, and the leaves it
//                 drops into #fx are read off the page (their drawing, the CSS animation's name, duration, easing and keyframes, each leaf's --dx)
//   draw.json     Noodle (PawArt.dog('dachs'), lying down, facing right) with the faces the Reel uses ('dreamy', 'curious'), with the state of the art's
//                 frame animation at every frame of one loop, read off the page on the FROZEN CLOCK (../frozen_clock.js: freezeClock, stepClock at
//                 exactly 1000/30 ms, releaseClock). The frame animation loops every second (pa-d-f0..f2), so 30 frames are the whole loop.
//   facts.json    the date, the env the game reads, the place name, the music context the game sends at Ueno (audioPlace), the main commit
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/momiji_reel/capture_momiji.js <main checkout> <outdir>
const path = require('path'), fs = require('fs'), cp = require('child_process');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'momiji_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const { freezeClock, stepClock, releaseClock } = require('../frozen_clock.js');
const FACES = ['dreamy', 'curious'];
run('momiji_capture', async (t) => {
  const { ev } = t, p = () => t.p, facts = {};
  const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
  const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
  await t.newGame({ map215: true, ground: true, head: '~Dachshund', sex: 'boy', prefs: { tkTest: true, jpTest: true } }, { coins: 3000, dog: { name: 'Noodle' } });
  await t.calm(); await t.lu(); await settle();
  facts.main = cp.execFileSync('git', ['-C', DEV, 'rev-parse', '--short', 'HEAD']).toString().trim();
  facts.date = await ev(() => new Date().toISOString().slice(0, 10));
  facts.dogKey = await ev(() => window.__paw.S.dog.key);
  if (facts.dogKey !== 'dachs') throw new Error('the adopted dog is not the dachshund: ' + facts.dogKey);

  // Ueno Park, as the Tokyo test reaches it (S.place = 'ueno', the yard mode); every music context the game sends on the way is kept
  await ev(() => { const a = window.PawAudio; window.__mjCtx = []; if (a && a.setContext) { const o = a.setContext.bind(a); a.setContext = (c) => { window.__mjCtx.push(JSON.parse(JSON.stringify(c))); return o(c); }; } });
  await ev(() => { const s = window.__paw.S; s.sleeping = false; s.place = 'ueno'; window.__paw.go('yard'); });
  await t.until(() => window.__paw.S.place === 'ueno' && window.__paw.mode === 'yard' && !!document.querySelector('#view svg.world [data-hot="hanami"]'), null, 8000);
  await t.lu(); await p().waitForTimeout(1200); await closeAll();
  const r = await ev(() => { const s = document.querySelector('#view svg.world'), inv = s.getScreenCTM().inverse();
    const bb = (e) => { const r0 = e.getBoundingClientRect(); if (!r0.width && !r0.height) return null; const a = new DOMPoint(r0.left, r0.top).matrixTransform(inv), z = new DOMPoint(r0.right, r0.bottom).matrixTransform(inv); return [a.x, a.y, z.x, z.y].map((v) => Math.round(v * 10) / 10); };
    const sc = s.querySelector('svg.pa-we-ueno'); if (!sc) return { err: 'no Ueno scene art in the world' };
    const parts = [];
    [...sc.children].forEach((e, i) => { const b = bb(e); if (b) parts.push({ i, tag: e.tagName, cls: e.getAttribute('class') || '', hot: e.getAttribute('data-hot') || '', fill: e.getAttribute('fill') || '', box: b }); });
    const hots = {}; sc.querySelectorAll('[data-hot]').forEach((e) => { const h = e.querySelector('.pa-wc-hit'); hots[e.getAttribute('data-hot')] = { hit: bb(h || e), drawn: bb(e) }; });
    const c = sc.cloneNode(true);
    const words = [...c.querySelectorAll('text')].map((e) => e.textContent);
    return { svg: c.outerHTML, words, vb: s.getAttribute('viewBox'), place: window.__paw.S.place, name: window.__paw.placeName ? window.__paw.placeName('ueno') : '', parts, hots,
      data: { time: sc.getAttribute('data-time'), weather: sc.getAttribute('data-weather'), season: sc.getAttribute('data-season'), jp: sc.getAttribute('data-jp'), floor: sc.getAttribute('data-floor') } }; });
  if (r.err) throw new Error(r.err);
  if (r.data.season !== 'autumn' || r.data.time !== 'dusk' || r.data.weather !== 'sunny' || r.data.jp !== '1') throw new Error('not autumn golden hour with the Japan scenery: ' + JSON.stringify(r.data));
  if (r.words.length) throw new Error('words in the scene art: ' + r.words.join(' | '));
  fs.writeFileSync(path.join(OUT, 'ueno.svg'), r.svg);
  facts.scene = { vb: r.vb, name: r.name, data: r.data, hots: r.hots };
  console.log('scene ueno', r.vb, r.name, JSON.stringify(r.data), JSON.stringify(r.hots));

  // the game's falling momiji: the Ueno "Momiji walk" (once a day), with motion on
  await ev(() => { document.documentElement.dataset.motion = 'on'; window.__toasts && window.__toasts.splice(0); });
  facts.uenoKind = await ev(() => { const g = document.querySelector('#sceneG [data-hot="hanami"]') || document.querySelector('#view svg.world [data-hot="hanami"]'); if (!g) return null; g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; });
  const got = await t.until(() => document.querySelectorAll('#fx .tk-petal').length >= 10, null, 9000);
  if (!got) throw new Error('the Momiji walk dropped no leaves');
  const leaf = await ev(() => { const L = [...document.querySelectorAll('#fx .tk-petal')];
    const cs = getComputedStyle(L[0]);
    let kf = ''; for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } for (const ru of rs) { if (ru.type === CSSRule.KEYFRAMES_RULE && ru.name === cs.animationName) kf = ru.cssText; } }
    return { n: L.length, html: L.map((e) => e.innerHTML), dx: L.map((e) => e.style.getPropertyValue('--dx')), delay: L.map((e) => e.style.animationDelay),
      anim: { name: cs.animationName, duration: cs.animationDuration, timing: cs.animationTimingFunction, fill: cs.animationFillMode }, keyframes: kf,
      fxParent: document.getElementById('fx').closest('svg') ? document.getElementById('fx').closest('svg').getAttribute('class') : '' }; });
  if (!/momiji|M0 -10 L3 -3/.test(leaf.html.join('')) || !/E4553F/i.test(leaf.html.join(''))) throw new Error('these are not the momiji leaves: ' + leaf.html[0]);
  fs.writeFileSync(path.join(OUT, 'leaf.json'), JSON.stringify(leaf, null, 1));
  console.log('leaves', leaf.n, JSON.stringify(leaf.anim), leaf.keyframes);
  facts.toasts = await ev(() => (window.__toasts || []).slice());

  // the music the game asks for at Ueno (00_core.js audioPlace -> PawAudio.setContext): the last context it sent
  facts.music = await ev(() => (window.__mjCtx || []).slice(-1)[0] || null);
  if (!facts.music || facts.music.place !== 'ueno' || facts.music.time !== 'dusk') throw new Error('the game sent no Ueno dusk music context: ' + JSON.stringify(facts.music));

  // Noodle, animated on the frozen clock: one loop (30 frames) of each face, read off the page
  await p().waitForTimeout(4000);
  await ev(() => { const h = document.createElement('div'); h.id = 'mjHost'; h.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:400px;z-index:99999;background:#fff'; document.body.appendChild(h); });
  const t0 = await freezeClock(p());
  const out = {}; let base = Math.ceil(t0) + 1000;
  for (const expr of FACES) {
    const o = { pose: 'down', facing: 'right', expr };
    const svg = await ev((o) => { const s = window.PawArt.dog('dachs', o); document.getElementById('mjHost').innerHTML = s; return s; }, o);
    if (!svg.includes('pa-pose-down') || !svg.includes('pa-ex-' + expr) || !/Noodle/.test(svg)) throw new Error('no ' + expr + ' drawing of Noodle lying down');
    const vis = [];
    for (let n = 0; n < 31; n++) {
      await stepClock(p(), base + n * 1000 / 30);
      vis.push(await ev(() => { const h = document.getElementById('mjHost'), fr = [...h.querySelectorAll('[class*="pa-d-f"]')].filter((e) => /\bpa-d-f\d\b/.test(e.getAttribute('class')));
        const other = document.getAnimations().filter((a) => a.effect && a.effect.target && h.contains(a.effect.target) && !/\bpa-d-f\d\b/.test(a.effect.target.getAttribute('class') || ''));
        if (other.length) return { err: 'other animations: ' + other.map((a) => a.animationName || a.id).join(',') };
        return fr.map((e) => +getComputedStyle(e).opacity); }));
    }
    if (vis.some((v) => v.err)) throw new Error(expr + ': ' + vis.find((v) => v.err).err);
    if (JSON.stringify(vis[30]) !== JSON.stringify(vis[0])) throw new Error(expr + ' does not loop in 1 s: ' + JSON.stringify(vis));
    base += 2000;
    out[expr] = { key: 'dachs', o, svg, vis: vis.slice(0, 30), step: '1000/30 ms, frozen clock' };
  }
  await releaseClock(p());
  console.log('drawings', Object.keys(out).join(', '), '; frames shown', out.dreamy.vis.map((v) => v.indexOf(1)).join(''));
  // the dog art's own CSS (the 3-drawing wobble), as the game injects it
  facts.dogCss = await ev(() => { const e = document.getElementById('pawart-dogs-css'); return e ? e.textContent : null; });
  if (!facts.dogCss || !/pa-d-b0/.test(facts.dogCss)) throw new Error('no dog art CSS');
  fs.writeFileSync(path.join(OUT, 'draw.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(OUT, 'props.json'), JSON.stringify({ parts: r.parts, hots: r.hots }, null, 1));
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 1));
}, { date: process.env.CAP_DATE || '2026-11-21', timeout: 300000, season: 'autumn', time: 'dusk', weather: 'sunny', fest: null });
