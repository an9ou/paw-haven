// v2.19 "Friends first": CLEAN footage for the launch Reel (owner, 2 Nov 2026: "without the game buttons, make it clean, introduce the upcoming update").
// The same v2.19 build, Worker mock and slow clock as capture_friends.js, but every game bar, button, menu, sheet, toast and speech bubble is hidden,
// so the yard fills the whole phone screen (the game lays the view out full height once the top bar and the bottom bar are gone). Only the scenes:
//   yard   Noodle drinks at home                     visit  Sunny Biscuit's yard, Waffles and Honey get petted (hearts, happy poses)
//   note   the paw-print stamp lands on their path       gift   the wrapped gift flies off from their yard
//   walk   the run with Waffles beside Mochi (the runner's own buttons, timer and hints hidden)
// The sheets for the note and the gift are used with the sheet hidden (their buttons are clicked from script).
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/capture_clean.js <game checkout> <outdir>
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'friends_clean'); fs.mkdirSync(OUT, { recursive: true });
const { run, URL } = require(path.join(DEV, 'game', 'test_lib'));
const { mockInit, slowInit } = require('./capture_friends.js');
const OUR_NAME = (process.env.OUR_NAME || '25,6').split(',').map(Number);
// the game's own interface, hidden for the clean look (the view then fills the screen; a resize lets the game lay it out again)
const CLEAN_CSS = '#hud,#bar,#dock,#toasts,#devBtn,#placeBtns,#status,#phPeek,#ddWish,#msBtn,#bubble,.hint,.coach,'
  + '.pw-hud,.pw-ctrls,.pw-tut,.pw-panel,.pw-legend,.pw-btn,.pw-card,.pw-notes,.pw-badge,.pw-nl,.pw-mini,.pw-hint{display:none!important}';
const HIDE_MODAL = '#modal{opacity:0!important}';

// the staging helpers, in the page (game milliseconds: the page's timers run on the slowed clock). Dogs by name, 'me' for ours
function stageInit() {
  const X = () => window.__frx, W = window.__stg = {};
  W.dog = (n) => X().FRV.dogs.find((v) => (n === 'me' ? v.mine : !v.mine && v.dog.name === n));
  W.hold = (v) => { v.wait = 1e15; v.home = [v.x, v.y]; };
  W.put = (n, x, y, face, pose) => { const v = W.dog(n); v.tw = null; v.x = x; v.y = y; v.k = X().frK(v, y); v.face = face; v.pose = pose || 'idle'; v.happy = 0; v.hidden = false; W.hold(v); X().frPaint(v); X().frOrder(); };
  W.pose = (n, pose, face) => { const v = W.dog(n); if (face) v.face = face; v.pose = pose; v.happy = 0; W.hold(v); X().frPaint(v); };
  W.walk = (n, x, y, ms, pose, face) => { const v = W.dog(n); v.happy = 0; v.tw = { x0: v.x, y0: v.y, x1: x, y1: y, k0: v.k, t0: performance.now(), dur: ms }; v.face = x < v.x ? 'left' : 'right'; W.hold(v); X().frPaint(v);
    setTimeout(() => W.pose(n, pose || 'idle', face), ms + 40); };
  W.pet = (n) => X().frPetDog(W.dog(n));
  W.heart = (x, y, c) => X().fxText('♥', x, y, c);
  // the drawn box of a dog in world units, relative to its feet (the union of its painted shapes)
  W.box = (n) => { const v = W.dog(n), F = X().FRV, svg = document.querySelector('#view > svg.world'), el = document.querySelector(`#frDogs [data-frd="${F.dogs.indexOf(v)}"] .fr-art`);
    const M = svg.getScreenCTM().inverse(), pt = (x, y) => { const q = svg.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(M); };
    let l = 1e9, r = -1e9, t = 1e9, b = -1e9; el.querySelectorAll('path,ellipse,circle,polygon,polyline,line').forEach((e) => { const q = e.getBoundingClientRect(); if (!q.width && !q.height) return; l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top); b = Math.max(b, q.bottom); });
    const a = pt(l, t), c = pt(r, b); return { l: Math.round(a.x - v.x), r: Math.round(c.x - v.x), t: Math.round(a.y - v.y), b: Math.round(c.y - v.y), k: +v.k.toFixed(3) }; };
  W.play = (steps) => steps.forEach(([ms, fn, ...a]) => setTimeout(() => W[fn](...a), ms));
  // the walk: an autopilot, so Noodle hops the low things and ducks the high ones instead of bonking (the game's own keys); __bonks counts the misses.
  // A tap jump (walkrun.js PH: V0 450, GRAV 950) is ~0.95 s in the air, highest at ~0.47 s: the hop starts when the obstacle's middle is ~0.47 s from the dog's middle
  W.autoRun = () => {
    const done = new WeakSet(), last = new WeakMap(), key = (type, k) => window.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
    window.__bonks = 0; window.__apLog = []; let blink = false; const L = (...a) => window.__apLog.push([Math.round(performance.now() % 1e6), ...a]);
    const tick = () => {
      const dog = document.querySelector('.pw-dog:not(.pw-fol)'); if (!dog) return requestAnimationFrame(tick);
      const b = dog.classList.contains('pw-blink'); if (b && !blink) { window.__bonks++; const dd = dog.getBoundingClientRect(); L('bonk', Math.round(dd.left), Math.round(dd.right), [...document.querySelectorAll('.pw-obj')].map((o) => { const q = o.getBoundingClientRect(); return q.right > dd.left - 60 && q.left < dd.right + 60 ? [o.className, o.parentNode.className, Math.round(q.left), Math.round(q.width), o.querySelector('.pw-shadow') ? o.querySelector('.pw-shadow').className : '-', done.has(o)] : null; }).filter(Boolean)); } blink = b;
      const d = dog.getBoundingClientRect(), dc = (d.left + d.right) / 2, now = performance.now();
      document.querySelectorAll('.pw-objs > .pw-obj').forEach((o) => {
        if (done.has(o)) return; const low = o.querySelector(':scope > .pw-shadow:not(.light)'), high = o.querySelector(':scope > .pw-shadow.light');
        if (!low && !high) return; const r = o.getBoundingClientRect(), oc = (r.left + r.right) / 2; if (!last.has(o)) last.set(o, [oc, now]); const prev = last.get(o);
        if (now - prev[1] < 150) return; /* the speed over at least 150 game ms (frame to frame is too noisy) */ const v = (prev[0] - oc) / (now - prev[1]); if (v <= 0.01) return; // px per game ms
        const eta = (oc - dc) / v;
        if (low && eta < +(window.__hopAt || 470)) { done.add(o); L('hop', Math.round(eta), Math.round(r.width), Math.round(v * 1000)); key('keydown', ' '); setTimeout(() => key('keyup', ' '), 50); }
        if (high && (r.left - d.right) / v < 160) { done.add(o); L('duck', Math.round(r.width)); key('keydown', 'ArrowDown'); const up = () => { const q = o.getBoundingClientRect(); if (q.right < d.left - 4 || !o.isConnected) key('keyup', 'ArrowDown'); else setTimeout(up, 60); }; setTimeout(up, 60); }
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
}

run('friends_clean', async (t) => {
  const { ev } = t, p = () => t.p;
  const day = new Date(t.pageNow()).toISOString().slice(0, 10);
  await t.mk({ device: 'iPhone 15', prefs: { frTest: true } });
  await t.ctx.addInitScript(mockInit, { code: 'DOG-XXXXX', day });
  await t.ctx.addInitScript(slowInit);
  // the visit is staged (owner, 2 Nov 2026: "more interaction", "the dogs were overlapping"): the build's own friend-yard state is reached through one
  // line added to a copy of the test page, so the dogs can be placed apart and act out a greeting with the game's own poses (sniff, play bow, jump)
  const SRC = path.join(DEV, 'game', 'test_merged.html'), REEL = path.join(DEV, 'game', 'test_merged_reel.html'), A = '\nfrReadInvite();\n';
  const html = fs.readFileSync(SRC, 'utf8'); if (html.split(A).length !== 2) throw new Error('art changed: the frReadInvite() anchor in 50_friends.js');
  fs.writeFileSync(REEL, html.replace(A, '\nfrReadInvite(); window.__frx = { FRV, FRC, frPaint, frK, frOrder, frPetDog, fxText, frScan };\n'));
  await t.ctx.addInitScript(stageInit);
  await p().goto('file://' + REEL);
  await p().waitForSelector('#tNew, #tContinue, #tGuest');
  if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
  await t.adopt({ head: '~Dachshund', sex: 'boy' }); // Noodle, our narrator (as in the 45 s promo and the profile picture)
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await ev(() => { window.__paw.S.coolUntil = 1e12; }); // not "too hot" on a sunny midday
  await t.calm();
  const SUNNY = 'sunnybiscuitxxxxxxxxxx';
  const clean = await p().addStyleTag({ content: CLEAN_CSS });
  const relayout = async () => { await ev(() => window.dispatchEvent(new Event('resize'))); await p().waitForTimeout(900); };
  await relayout();
  let cdp = null, rate = 1, modalHid = null;
  const wait = (ms) => p().waitForTimeout(ms / rate);
  async function setRate(x) { if (!cdp) { cdp = await t.ctx.newCDPSession(p()); await cdp.send('Animation.enable'); } await ev((x) => window.__setRate(x), x); await cdp.send('Animation.setPlaybackRate', { playbackRate: x }); rate = x; }
  async function still(name) { await p().waitForTimeout(600); await p().screenshot({ path: path.join(OUT, name + '.png') }); console.log('still', name); }
  async function clip(name, secs, act, r) {
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await setRate(r || 0.2); const ts = []; let n = 0, done = false;
    const v0 = await ev(() => window.__vt());
    const shoot = (async () => { const vp = p().viewportSize();
      while (!done) { const v = await ev(() => window.__vt()); if (v - v0 > secs * 1000) break;
        const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 3 } });
        fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(s.data, 'base64')); ts.push((v - v0) / 1000); } })();
    if (act) await act();
    await shoot; done = true; await setRate(1);
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); console.log('clip', name, n, 'frames', ts[n - 1].toFixed(2) + 's');
  }
  const press = (sel) => ev((s) => { const e = document.querySelector(s); if (!e) throw new Error('no ' + s); e.click(); }, sel);

  // 0. home
  await still('yard');
  // owner, 2 Nov 2026: Noodle drinks from the water bowl in the opening shot (eat pose fixed in d488723: head straight down to the bowl, in profile)
  await ev(() => { window.__paw.S.waterAt = -1e9; });
  await clip('yard', 3.4, () => ev(() => window.__paw.feed('Fresh Water')), 0.17);

  // set up Friends off camera: the name, then Sunny Biscuit by code (the sheet itself is never filmed)
  await ev((nm) => { window.__paw.S.dc.name = nm; }, OUR_NAME);
  await ev(() => window.__paw.fr.open());
  await t.until(() => !!document.getElementById('frOk'), null, 6000); await press('#frOk');
  await t.until(() => !!document.getElementById('frCard'), null, 8000);
  await ev((c) => { c.split('').forEach((ch, i) => { const e = document.getElementById('frCh' + i); e.value = ch; e.dispatchEvent(new Event('input', { bubbles: true })); }); }, '4K7PM');
  await press('#frAdd');
  await t.until(() => document.querySelectorAll('.fr-row').length === 1, null, 6000);

  // 1. the visit, the dogs standing apart
  await press(`.fr-row[data-fid="${SUNNY}"] [data-fr="visit"]`);
  await t.until(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden, null, 6000);
  await relayout();
  // owner, 2 Nov 2026: "more interaction", "the dogs were overlapping". A phone shows ~358 of the yard's 1000 units and the three dogs are ~390 wide,
  // so they stand in two rows: Noodle and Waffles nose to nose in front, Honey the puppy behind them, every drawn dog clear of the others.
  // Then a greeting with the game's own poses: Noodle trots in, they sniff noses, pets and hearts, play bows and bouncing (the "safe" shot is from 3.8 s)
  const FRONT = 568, BACK = 450;
  await ev(([F, B]) => { const W = window.__stg; W.put('Honey', 495, B, 'right', 'sit'); W.put('Waffles', 692, F, 'left', 'idle'); W.put('me', 330, F, 'right', 'idle'); }, [FRONT, BACK]);
  await p().waitForTimeout(400);
  await still('visit');
  await clip('visit', 7.6, () => ev(([F]) => window.__stg.play([
    [0, 'walk', 'me', 520, F, 900, 'sniff', 'right'],
    [950, 'pose', 'Waffles', 'sniff', 'left'], [1150, 'heart', 610, F - 70], [1350, 'heart', 624, F - 100],
    [1800, 'pet', 'Waffles'], [2100, 'pose', 'me', 'happy', 'right'], [2300, 'pose', 'Honey', 'happy', 'right'],
    [2800, 'pet', 'Honey'], [3300, 'pose', 'Waffles', 'jump', 'left'], [3350, 'heart', 610, F - 90],
    [3900, 'pose', 'me', 'bow', 'right'], [4100, 'pose', 'Waffles', 'bow', 'left'], [4300, 'pose', 'Honey', 'jump', 'right'],
    [4800, 'pose', 'me', 'jump', 'right'], [5150, 'pose', 'Waffles', 'jump', 'left'], [5300, 'pose', 'Honey', 'happy', 'right'],
    [5500, 'pose', 'me', 'bow', 'right'], [5850, 'pose', 'Waffles', 'bow', 'left'], [6200, 'pose', 'me', 'happy', 'right'], [6300, 'pose', 'Waffles', 'happy', 'left'],
    [6250, 'heart', 606, F - 80], [6450, 'heart', 626, F - 110], [6650, 'pose', 'Honey', 'jump', 'right'],
  ]), [FRONT]), 0.17);
  // the note and the gift: the same two rows; Noodle sits these out (his body covers the paw stamp's spot on the path, x 452..512)
  await ev(([F, B]) => { const W = window.__stg; W.put('Honey', 495, B, 'right', 'sit'); W.put('Waffles', 660, F, 'left', 'sit'); }, [FRONT, BACK]);

  // 2. the paw print: the note picked with the sheet hidden; the stamp lands on their path
  // the stamp sits at the left edge of the phone's view of their yard, where our own dog's tail covers it: our dog sits this one shot out
  modalHid = await p().addStyleTag({ content: HIDE_MODAL + '#frDogs .fr-mine{display:none!important}' });
  await press('#frNoteBtn');
  await t.until(() => document.querySelectorAll('#modal [data-frnote]').length === 12, null, 4000);
  await clip('note', 4.2, async () => { await wait(400); await press('#modal [data-frnote="0"]'); }, 0.15);
  await still('note_left');

  // 3. the gift: the Bone-shaped Biscuit sent with the sheet hidden; the wrapped gift flies off
  await press('#frGiftBtn');
  await t.until(() => document.querySelectorAll('#modal [data-frgift]').length > 3, null, 4000);
  const bone = await ev(() => { const b = [...document.querySelectorAll('#modal [data-frgift]')].find((e) => /Bone-shaped/.test(e.textContent)); return b ? b.getAttribute('data-frgift') : '0'; });
  await press(`#modal [data-frgift="${bone}"]`);
  await t.until(() => !!document.querySelector('#modal .confirm .yes'), null, 4000);
  await clip('gift', 4.4, async () => { await wait(300); await press('#modal .confirm .yes'); }, 0.15);
  await ev((el) => el.remove(), modalHid);

  // 4. the walk with Waffles: picked on the route screen (not filmed), then the run, clean
  await press('#frHomeBtn'); await t.untilMode('yard'); await t.calm();
  await ev((el) => el.remove(), clean); // the route screen and the run's start as the game shows them (not filmed)
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.walks = 3; (S.dogs || []).forEach((d) => { d.stats.energy = 95; }); window.__paw.go('routes'); });
  await p().waitForSelector('#rtStart', { state: 'attached' }); await p().waitForTimeout(400);
  await press(`#frWalkRow [data-frg="${SUNNY}:0"]`);
  await p().click('#rtStart'); await t.walkGate(true); await ev(() => window.__stg.autoRun());
  await t.until(() => !!document.querySelector('.pw-fol.pw-friend'), null, 10000);
  // owner, 2 Nov 2026 ("the dogs were overlapping"): Waffles follows a little further back, nose clear of Noodle's tail
  await p().addStyleTag({ content: CLEAN_CSS + '.pw-fol.pw-friend{translate:-14px 0}' }); await relayout(); await p().waitForTimeout(600);
  await still('walk');
  await clip('walk', 6.2, null, 0.17);
  console.log('walk bonks', await ev(() => window.__bonks), JSON.stringify(await ev(() => window.__apLog)));
  console.log('done', OUT);
}, { time: 'day', weather: 'sunny', season: 'autumn', timeout: 900000 });
