// v2.19 "Friends first": records the REAL Friends screens for the launch Reel and the "add a friend in 3 steps" carousel.
// Runs the v2.19 build from a checkout of the dev branch (or main once v2.19 is merged), with Friends turned on and the Worker mocked the way
// game/test_v219_friends.js does (prefs.frTest + window.__pawCloudMock). iPhone 15 profile (393 x 852, DPR 3): stills as PNG, clips as screencast JPEGs + timestamps.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/capture_friends.js <game checkout> <outdir>
//   (the checkout needs game/test_merged.html: node game/build.js && node game/harness.js merged)
//   OUR_CODE=DOG-XXXXX OUR_NAME=a,b (Dog Card word indices): the Doodle Doggo account's real friend code and name, from the live game on 7 Nov 2026.
//   Without OUR_CODE the card shows the placeholder DOG-XXXXX, and the Reel and carousel builds cover it with a "placeholder" tag: never post that.
//
// The friend in the footage, "Cozy Maple" (FRIEND_NAME, Dog Card word indices, default 2,14), is a made-up player. Their code is never shown on screen.
// (Until 7 Nov 2026 it was "Sunny Biscuit"; that turned out to be our own account's real friend name, so the made-up friend was renamed.)
// Owner's rule (6 Nov 2026): dogs that share a shot never overlap or touch. The greeting pair stands PAIR_GAP world units apart (the game's 4 is
// nose to nose), and every still and clip frame saves each dog's drawn box (boxes.json) for the builds' apartCheck().
// Their dogs: Waffles the Corgi and Honey the Golden puppy. Ours: Mochi the Shiba. No black or white dog is the subject (owner, 1 Nov 2026).
const path = require('path'), fs = require('fs');
const MAIN = require.main === module; // capture_clean.js borrows the mock and the slow clock from this file
const DEV = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'friends_footage'); if (MAIN) fs.mkdirSync(OUT, { recursive: true });
const { run, URL } = MAIN ? require(path.join(DEV, 'game', 'test_lib')) : {};
const OUR_CODE = process.env.OUR_CODE || 'DOG-XXXXX';
const OUR_NAME = (process.env.OUR_NAME || '25,6').split(',').map(Number); // placeholder: Waggy Clover
const FRIEND = (process.env.FRIEND_NAME || '2,14').split(',').map(Number); // the made-up friend: Cozy Maple
const PAIR_GAP = +(process.env.PAIR_GAP || 16);

function mockInit(cfg) {
  const fid = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22);
  const SUNNY = fid('sunnybiscuit');
  const FN = cfg.friend || [2, 14];
  const sunnyDogs = [{ b: 1, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 47 }, { b: 2, c: null, o: 1, a: 'pup', s: 'm', sp: 0, n: 45 }]; // Waffles the Corgi, Honey the Golden pup (party hat)
  const srv = {
    me: null, friends: [], sent: [],
    book: { 'DOG-4K7PM': { fid: SUNNY, name: FN } },
    yardOf: { [SUNNY]: { v: 1, name: FN, house: 2, season: 'autumn', dogs: sunnyDogs, decor: [{ i: 19, x: 40, y: 300 }, { i: 20, x: 110, y: 318 }] } },
    events: [
      { id: 3, from: { fid: SUNNY, name: FN }, kind: 'gift', data: { i: 0, n: 1 }, day: cfg.day, claimed: false },
      { id: 1, from: { fid: SUNNY, name: FN }, kind: 'note', data: { i: 0 }, day: cfg.day, claimed: false }
    ]
  };
  window.__frSrv = srv; window.__frHoldInbox = true;
  const user = { id: 'user000000000000000001', guest: false, email: 'x@example.com' };
  window.__pawCloudMock = {
    async fetch(url, o) {
      o = o || {};
      const u = new URL(url, 'https://api.test'), method = o.method || 'GET', p = u.pathname;
      let body = {}; try { body = o.body ? JSON.parse(o.body) : {}; } catch (e) { body = {}; }
      const send = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
      if (method === 'POST' && p === '/guest') return send(200, { token: 'tok-test', user });
      if (method === 'GET' && p === '/me') return send(200, { user });
      if (method === 'GET' && p === '/save') return send(200, { save: null });
      if (method === 'PUT' && p === '/save') return send(200, { ok: true });
      if (method === 'GET' && p === '/friends') return send(200, { me: srv.me, friends: srv.friends });
      if (method === 'POST' && p === '/friends/me') { srv.me = { fid: fid('owner'), code: cfg.code, name: body.name }; return send(200, srv.me); }
      if (method === 'POST' && p === '/friends/add') {
        const who = srv.book[body.code && body.code.toUpperCase().replace(/^DOG-?/, 'DOG-')]; if (!who) return send(404, { error: 'not_found' });
        if (!srv.friends.some((f) => f.fid === who.fid)) srv.friends.push({ fid: who.fid, name: who.name.slice(), dogs: srv.yardOf[who.fid].dogs, seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } });
        return send(200, { ok: true });
      }
      if (method === 'PUT' && p === '/friends/yard') return send(200, { ok: true });
      if (method === 'GET' && p === '/friends/inbox') return send(200, { events: window.__frHoldInbox ? [] : srv.events.filter((e) => !e.claimed).map((e) => ({ id: e.id, from: e.from, kind: e.kind, data: e.data, day: e.day })) });
      if (method === 'POST' && p === '/friends/inbox/claim') { (body.ids || []).forEach((id) => { const e = srv.events.find((x) => x.id === id); if (e) e.claimed = true; }); return send(200, { ok: true }); }
      if (method === 'GET' && p === '/friends/yard') return send(200, { yard: srv.yardOf[u.searchParams.get('fid')] || null });
      if (method === 'POST' && p === '/friends/send') { const f = srv.friends.find((x) => x.fid === body.fid); if (f) f.sent[body.kind] = true; srv.sent.push(body); return send(200, { ok: true }); }
      return send(200, { ok: true });
    }
  };
}

// Slow motion for the clips: Chrome's screencast only gives 393 px frames, and a full DPR-3 screenshot takes ~110 ms. So while a clip records,
// the page's clock runs at RATE (performance.now, Date, requestAnimationFrame, timers here; CSS animations through CDP Animation.setPlaybackRate),
// and each frame is stamped with its game time. 9 shots a second at a quarter speed = 36 frames per game second, full resolution.
// each dog's drawn box on screen (CSS px), shadows left out (the dogs' kit draws them at opacity .1 / .4): the friend yard's dogs by name ('me' for ours),
// the run's leader and follower; for the builds' apartCheck() (owner, 6 Nov 2026: dogs never overlap or touch)
function boxesInit() {
  const box = (root) => { let l = 1e9, r = -1e9, t = 1e9, b = -1e9;
    root.querySelectorAll('path,ellipse,circle,polygon,polyline,line,rect').forEach((e) => {
      if (e.classList.contains('fr-hit')) return; const op = e.getAttribute('opacity'); if (op != null && +op <= 0.4) return;
      const q = e.getBoundingClientRect(); if (!q.width && !q.height) return; l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top); b = Math.max(b, q.bottom); });
    return l < r ? [+l.toFixed(1), +t.toFixed(1), +r.toFixed(1), +b.toFixed(1)] : null; };
  window.__dogBoxes = () => {
    const out = [], X = window.__frx;
    document.querySelectorAll('#frDogs .frdog').forEach((g) => { const a = g.querySelector('.fr-art'); if (!a || getComputedStyle(g).display === 'none') return; const bx = box(a); if (!bx) return;
      const v = X && X.FRV.dogs[+g.dataset.frd]; out.push({ n: g.classList.contains('fr-mine') ? 'me' : (v ? v.dog.name : 'dog' + g.dataset.frd), b: bx }); });
    document.querySelectorAll('.pw-dog').forEach((d, i) => { if (getComputedStyle(d).display === 'none') return; const bx = box(d); if (bx) out.push({ n: d.classList.contains('pw-fol') ? 'follower' + i : 'leader', b: bx }); });
    return out;
  };
}
// a copy of the merged test page for one capture (each its own file: two captures at once must never share one): the friend yard's state for the
// staging helpers, and the greeting pair PAIR_GAP world units apart instead of nose to nose
function reelPage(dev, tag, gap) {
  const SRC = path.join(dev, 'game', 'test_merged.html'), OUTP = path.join(dev, 'game', `test_merged_reel_${tag}.html`);
  let html = fs.readFileSync(SRC, 'utf8');
  const A = '\nfrReadInvite();\n', G = 'kb * fb[0] + 4; // the feet apart';
  if (html.split(A).length !== 2) throw new Error('art changed: the frReadInvite() anchor in 50_friends.js');
  if (html.split(G).length !== 2) throw new Error('art changed: the greeting pair anchor (frPairAt) in 50_friends.js');
  html = html.replace(A, '\nfrReadInvite(); window.__frx = { FRV, FRC, frPaint, frK, frOrder, frPetDog, fxText, frScan, frSpotOk };\n').replace(G, `kb * fb[0] + ${gap}; // the feet apart (Marketing: ${gap}, dogs never touch)`);
  fs.writeFileSync(OUTP, html); return OUTP;
}
function slowInit() {
  const P = performance, pnow = P.now.bind(P), D = window.Date, R = Object.getPrototypeOf(D) && Object.getPrototypeOf(D).now ? Object.getPrototypeOf(D) : D, rnow = R.now.bind(R);
  const off = rnow() - pnow(); let r0 = pnow(), v0 = r0, rate = 1;
  const vt = () => v0 + (pnow() - r0) * rate;
  window.__setRate = (x) => { v0 = vt(); r0 = pnow(); rate = x; };
  window.__vt = vt;
  P.now = vt; R.now = () => vt() + off;
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => raf(() => cb(vt()));
  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
  window.setTimeout = (fn, d, ...a) => st(fn, (d || 0) / rate, ...a); window.setInterval = (fn, d, ...a) => si(fn, (d || 0) / rate, ...a);
}
const GAP = +(process.env.GAP || 18); // the visit: the smallest gap between two dogs' drawn boxes, in CSS px (the carousel's smallest window shows the
// phone at 1.6x or more, so 18 px keeps apartCheck's 28 px; on a phone there is no room for more with three dogs on screen)
const RATE = 0.2; // a clip over a sheet (backdrop blur) shoots slower, so it passes its own lower rate

module.exports = { mockInit, slowInit, boxesInit, reelPage };
if (MAIN) run('friends_footage', async (t) => {
  const { ev } = t, p = () => t.p;
  const day = new Date(t.pageNow()).toISOString().slice(0, 10);
  await t.mk({ device: 'iPhone 15', prefs: { frTest: true } });
  await t.ctx.addInitScript(mockInit, { code: OUR_CODE, day, friend: FRIEND });
  await t.ctx.addInitScript(slowInit);
  await t.ctx.addInitScript(boxesInit);
  await p().goto('file://' + reelPage(DEV, 'carousel', PAIR_GAP));
  await p().waitForSelector('#tNew, #tContinue, #tGuest');
  if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
  await t.adopt({});
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 } });
  await ev(() => { window.__paw.S.coolUntil = 1e12; }); // a sunny midday: not "too hot" (as after a splash), so the lines stay happy
  await t.calm();
  // the footage is about Friends: no toasts, no tutorial hints, no dev button
  await p().addStyleTag({ content: '#toasts,#devBtn,.hint,.coach{opacity:0!important;pointer-events:none}' });
  const SUNNY = 'sunnybiscuitxxxxxxxxxx';
  async function still(name) { await p().waitForTimeout(700); fs.writeFileSync(path.join(OUT, name + '.boxes.json'), JSON.stringify(await ev(() => window.__dogBoxes()))); await p().screenshot({ path: path.join(OUT, name + '.png') }); console.log('still', name); }
  let cdp = null, rate = 1;
  const wait = (ms) => p().waitForTimeout(ms / rate); // game milliseconds
  async function setRate(x) { if (!cdp) { cdp = await t.ctx.newCDPSession(p()); await cdp.send('Animation.enable'); } await ev((x) => window.__setRate(x), x); await cdp.send('Animation.setPlaybackRate', { playbackRate: x }); rate = x; }
  async function clip(name, secs, act, r) {
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await setRate(r || RATE); const ts = [], bxs = []; let n = 0, done = false;
    const v0 = await ev(() => window.__vt());
    const shoot = (async () => { const vp = p().viewportSize();
      while (!done) { const [v, bx] = await ev(() => [window.__vt(), window.__dogBoxes()]); if (v - v0 > secs * 1000) break;
        const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 3 } });
        fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(r.data, 'base64')); ts.push((v - v0) / 1000); bxs.push(bx); } })();
    if (act) await act();
    await shoot; done = true; await setRate(1);
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); fs.writeFileSync(path.join(dir, 'boxes.json'), JSON.stringify(bxs)); console.log('clip', name, n, 'frames', ts[n - 1].toFixed(2) + 's');
  }
  const tapAt = async (sel) => { const b = await p().locator(sel).first().boundingBox(); await p().mouse.click(b.x + b.width / 2, b.y + b.height / 2); };

  // 0. home: Mochi in the yard
  await still('yard');
  await clip('yard', 3, null, 0.17);

  // 1. pick your friend name: the wheels turn, then "This is my name"
  await ev((nm) => { window.__paw.S.dc.name = nm; }, [OUR_NAME[0], (OUR_NAME[1] + 2) % 40]);
  // on a phone, Friends sits in the More tray of the bottom bar
  await p().click('#bar .act[data-act="more"]');
  await t.until(() => { const b = document.querySelector('.barpop[data-pop="more"] [data-act="friends"]'); return !!b && b.getBoundingClientRect().width > 0; }, null, 4000);
  await still('more_tray');
  const trayRect = await ev(() => { const r = document.querySelector('.barpop[data-pop="more"] [data-act="friends"]').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p().click('.barpop[data-pop="more"] [data-act="friends"]');
  await t.until(() => !!document.getElementById('frOk'), null, 6000);
  await still('name_pick_start');
  await clip('name', 3.2, async () => { await wait(500); for (let i = 0; i < 2; i++) { await p().click('[data-frspin="b:-1"]'); await wait(700); } }, 0.07);
  await still('name_pick');
  await p().click('#frOk');
  await t.until(() => !!document.getElementById('frCard'), null, 8000);
  await wait(800);
  // 2. my card: the code and the QR, with Share invite / Copy code
  await still('card');
  // where the card sits on screen (CSS px), for the placeholder patch and the zoom; the code line and QR are in the card's own 300 x 200 units
  const cardRect = await ev(() => { const e = document.querySelector('#frCard svg') || document.getElementById('frCard'); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }; });
  fs.writeFileSync(path.join(OUT, 'layout.json'), JSON.stringify({ card: cardRect, tray: trayRect, code: OUR_CODE, name: OUR_NAME, placeholder: !process.env.OUR_CODE }));
  await clip('card', 2.2, null, 0.1);

  // 3. a friend added by their code (typed off camera; their code is never shown): the list with Visit, Gift and the dog's head
  await ev((c) => { c.split('').forEach((ch, i) => { const e = document.getElementById('frCh' + i); e.value = ch; e.dispatchEvent(new Event('input', { bubbles: true })); }); }, '4K7PM');
  await p().click('#frAdd');
  await t.until(() => document.querySelectorAll('.fr-row').length === 1, null, 6000);
  await ev(() => { ['frCh0', 'frCh1', 'frCh2', 'frCh3', 'frCh4'].forEach((id) => { const e = document.getElementById(id); if (e) e.value = ''; }); const r = document.querySelector('.fr-row'); if (r) r.scrollIntoView({ block: 'center' }); });
  await still('friends_list');

  // 4. the visit: Sunny Biscuit's yard, pet Waffles and Honey
  await p().click(`.fr-row[data-fid="${SUNNY}"] [data-fr="visit"]`);
  await t.until(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden, null, 6000);
  // the game's greeting plays first (Mochi walks in to Waffles, they sniff and play): the stills and the clip come after it. Then the dogs hold still
  // where they are, except that a dog too close to another (on a phone the game puts the third dog in a back row, its box over the front dogs' heads)
  // is moved to the nearest free spot of the yard (the game's frSpotOk) inside the carousel's windows (CSS px x 24..354, y 290..560)
  //, the greeting pair a step forward first if it must, every two boxes GAP px apart
  // (owner, 6 Nov 2026: dogs never overlap or touch)
  await wait(1200); await t.until(() => !window.__paw.fr.greeting(), null, 20000); await wait(600);
  const staged = await ev(([GAP]) => {
    const X = window.__frx, F = X.FRV, hold = (v) => { v.tw = null; v.wait = 1e15; v.home = [v.x, v.y]; };
    F.dogs.forEach((v) => { hold(v); v.pose = v.pose === 'walk' ? 'idle' : v.pose; X.frPaint(v); });
    const gapOf = () => { const d = window.__dogBoxes(); let m = 1e9; for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) { const a = d[i].b, b = d[j].b; m = Math.min(m, Math.max(b[0] - a[2], a[0] - b[2], b[1] - a[3], a[1] - b[3])); } return m; };
    const before = gapOf(); if (before >= GAP) return { before, moved: null };
    // the third dog to a free spot; if there is none, the greeting pair a step forward first (on a phone the kennel and the edges leave little room)
    const v = F.dogs.find((d) => !d.mine && !d.play) || F.dogs.find((d) => !d.mine && d.dog.name !== 'Waffles'), x0 = v.x, y0 = v.y;
    v.pose = 'sit'; X.frPaint(v); // a sitting puppy is shorter: more room above the pair
    const pair = F.dogs.filter((d) => d !== v), py = pair.map((d) => d.y);
    const put = (d, x, y) => { d.x = x; d.y = y; d.k = X.frK(d, y); hold(d); X.frPaint(d); X.frOrder(); };
    const inWin = () => window.__dogBoxes().every((q) => q.b[0] >= 24 && q.b[2] <= 354 && q.b[1] >= 290 && q.b[3] <= 560);
    const why = { start: window.__dogBoxes(), xy: F.dogs.map((d) => [d.dog.name, Math.round(d.x), Math.round(d.y)]) };
    for (const dy of [0, 10, 20, 30, 40, 50, 60]) {
      // (the pair is not re-tested with frSpotOk: it rejects the greeting's own spots, which frPairAt chose with its own reservations; a step forward
      // on the open lawn in front of them, at most 60 units, stays on the lawn)
      pair.forEach((d, i) => put(d, d.x, py[i] + dy)); let best = null; const n = why['dy' + dy] = [0, 0, 0];
      for (let y = 380; y <= 620; y += 4) for (let x = 40; x <= 960; x += 8) {
        const dd = Math.hypot(x - x0, (y - y0) * 2); if (best && dd >= best.d) continue;
        if (!X.frSpotOk(v, x, y, { face: v.face, any: true })) continue; // the game's own test (on the lawn, clear of the house, the decorations and the buttons; the other dogs: our gap test)
        n[0]++; put(v, x, y); if (!inWin()) continue; n[1]++; const g = gapOf(); if (!why.top || g > why.top[0]) why.top = [Math.round(g), x, y, dy]; if (g >= GAP) { n[2]++; best = { x, y, d: dd }; }
      }
      if (best) { put(v, best.x, best.y); return { before, moved: [v.dog.name, Math.round(x0), Math.round(y0), best.x, best.y], pairForward: dy, after: gapOf() }; }
    }
    pair.forEach((d, i) => put(d, d.x, py[i])); put(v, x0, y0); return { before, moved: false, why };
  }, [GAP]);
  console.log('visit staging', JSON.stringify(staged)); if (staged.moved === false) throw new Error('no free spot for the third dog: dogs would touch');
  // the visit's buttons (Leave a paw print, Send a gift, Go home) hidden for the visit shots: the pair stepped forward, their feet would be under them
  const noBtns = await p().addStyleTag({ content: '#placeBtns{visibility:hidden!important}' });
  await still('visit');
  const petDog = (i) => ev((i) => { const el = document.querySelectorAll('#frDogs .frdog:not(.fr-mine)')[i]; if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, i);
  await clip('visit', 4.2, async () => { await wait(600); await petDog(0); await wait(1500); await petDog(1); }, 0.14);
  await ev((el) => el.remove(), noBtns);

  // 5. the paw-print note: the 12 preset lines, then the stamp on their path
  await p().click('#frNoteBtn');
  await t.until(() => document.querySelectorAll('#modal [data-frnote]').length === 12, null, 4000);
  await still('notes');
  await clip('note', 2.6, async () => { await wait(500); await p().click('#modal [data-frnote="0"]'); }, 0.12);
  await still('note_left');

  // 6. one gift a day: the bag, pick the Bone-shaped Biscuit, "Send", then "Sent today"
  await p().click('#frGiftBtn');
  await t.until(() => document.querySelectorAll('#modal [data-frgift]').length > 3, null, 4000);
  await still('gift_sheet');
  const bone = await ev(() => { const b = [...document.querySelectorAll('#modal [data-frgift]')].find((e) => /Bone-shaped/.test(e.textContent)); return b ? b.getAttribute('data-frgift') : '0'; });
  await clip('gift', 3.4, async () => { await wait(500); await p().click(`#modal [data-frgift="${bone}"]`); await wait(1300); await p().click('#modal .confirm .yes'); }, 0.1);
  await t.until(() => document.getElementById('modal').hidden, null, 4000);
  await still('gift_sent');

  // 7. a gift from them arrives in the mailbox
  await p().click('#frHomeBtn');
  await t.untilMode('yard'); await t.calm();
  await ev(() => { window.__frHoldInbox = false; window.__paw.fr.inbox(); });
  await t.until(() => (window.__paw.S.mail || []).some((m) => m && m.id === 'fr_gift_3'), null, 8000);
  await ev(() => window.__paw.openMailbox('fr_gift_3'));
  await t.until(() => !!document.querySelector('.letter'), null, 4000);
  await still('gift_letter');
  await t.closeX(); await t.modalGone();

  // 8. the walk with their dog: pick Waffles on the route screen, then the run with Waffles alongside (her ribbon)
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.walks = 3; (S.dogs || []).forEach((d) => { d.stats.energy = 95; }); window.__paw.go('routes'); });
  await p().waitForSelector('#rtStart'); await wait(400);
  await p().click(`#frWalkRow [data-frg="${SUNNY}:0"]`);
  await ev(() => { const r = document.getElementById('frWalkRow'); if (r) r.scrollIntoView({ block: 'center' }); });
  await still('walk_pick');
  await p().click('#rtStart');
  await t.walkGate(true);
  // owner, 2 and 6 Nov 2026 ("the dogs were overlapping"; dogs never touch): the friend's dog follows a little further back, as in capture_clean.js
  await p().addStyleTag({ content: '.pw-fol.pw-friend{translate:-14px 0}' });
  await wait(800);
  await clip('walk', 5.5, null, 0.17);
  await still('walk');
  console.log('done', OUT);
}, { time: 'day', weather: 'sunny', season: 'autumn', timeout: 900000 });
