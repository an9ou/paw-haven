// v2.19 "Friends first": records the REAL Friends screens for the launch Reel and the "add a friend in 3 steps" carousel.
// Runs the v2.19 build from a checkout of the dev branch (or main once v2.19 is merged), with Friends turned on and the Worker mocked the way
// game/test_v219_friends.js does (prefs.frTest + window.__pawCloudMock). iPhone 15 profile (393 x 852, DPR 3): stills as PNG, clips as screencast JPEGs + timestamps.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/capture_friends.js <game checkout> <outdir>
//   (the checkout needs game/test_merged.html: node game/build.js && node game/harness.js merged)
//   OUR_CODE=DOG-XXXXX OUR_NAME=a,b (Dog Card word indices): the Doodle Doggo account's real friend code and name, from the live game on 7 Nov 2026.
//   Without OUR_CODE the card shows the placeholder DOG-XXXXX, and the Reel and carousel builds cover it with a "placeholder" tag: never post that.
//
// The friend in the footage, "Sunny Biscuit", is a made-up player (two Dog Card words). Their code is never shown on screen.
// Their dogs: Waffles the Corgi and Honey the Golden puppy. Ours: Mochi the Shiba. No black or white dog is the subject (owner, 1 Nov 2026).
const path = require('path'), fs = require('fs');
const MAIN = require.main === module; // capture_clean.js borrows the mock and the slow clock from this file
const DEV = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'friends_footage'); if (MAIN) fs.mkdirSync(OUT, { recursive: true });
const { run, URL } = MAIN ? require(path.join(DEV, 'game', 'test_lib')) : {};
const OUR_CODE = process.env.OUR_CODE || 'DOG-XXXXX';
const OUR_NAME = (process.env.OUR_NAME || '25,6').split(',').map(Number); // placeholder: Waggy Clover

function mockInit(cfg) {
  const fid = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22);
  const SUNNY = fid('sunnybiscuit');
  const sunnyDogs = [{ b: 1, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 47 }, { b: 2, c: null, o: 1, a: 'pup', s: 'm', sp: 0, n: 45 }]; // Waffles the Corgi, Honey the Golden pup (party hat)
  const srv = {
    me: null, friends: [], sent: [],
    book: { 'DOG-4K7PM': { fid: SUNNY, name: [0, 0] } },
    yardOf: { [SUNNY]: { v: 1, name: [0, 0], house: 2, season: 'autumn', dogs: sunnyDogs, decor: [{ i: 19, x: 40, y: 300 }, { i: 20, x: 110, y: 318 }] } },
    events: [
      { id: 3, from: { fid: SUNNY, name: [0, 0] }, kind: 'gift', data: { i: 0, n: 1 }, day: cfg.day, claimed: false },
      { id: 1, from: { fid: SUNNY, name: [0, 0] }, kind: 'note', data: { i: 0 }, day: cfg.day, claimed: false }
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
const GAP = +(process.env.GAP || 110); // the visit: the smallest gap between two dogs, in yard units (the phone shows about 400 of the 1000)
const RATE = 0.2; // a clip over a sheet (backdrop blur) shoots slower, so it passes its own lower rate

module.exports = { mockInit, slowInit };
if (MAIN) run('friends_footage', async (t) => {
  const { ev } = t, p = () => t.p;
  const day = new Date(t.pageNow()).toISOString().slice(0, 10);
  await t.mk({ device: 'iPhone 15', prefs: { frTest: true } });
  await t.ctx.addInitScript(mockInit, { code: OUR_CODE, day });
  await t.ctx.addInitScript(slowInit);
  await p().goto(URL);
  await p().waitForSelector('#tNew, #tContinue, #tGuest');
  if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
  await t.adopt({});
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 } });
  await ev(() => { window.__paw.S.coolUntil = 1e12; }); // a sunny midday: not "too hot" (as after a splash), so the lines stay happy
  await t.calm();
  // the footage is about Friends: no toasts, no tutorial hints, no dev button
  await p().addStyleTag({ content: '#toasts,#devBtn,.hint,.coach{opacity:0!important;pointer-events:none}' });
  const SUNNY = 'sunnybiscuitxxxxxxxxxx';
  async function still(name) { await p().waitForTimeout(700); await p().screenshot({ path: path.join(OUT, name + '.png') }); console.log('still', name); }
  let cdp = null, rate = 1;
  const wait = (ms) => p().waitForTimeout(ms / rate); // game milliseconds
  async function setRate(x) { if (!cdp) { cdp = await t.ctx.newCDPSession(p()); await cdp.send('Animation.enable'); } await ev((x) => window.__setRate(x), x); await cdp.send('Animation.setPlaybackRate', { playbackRate: x }); rate = x; }
  async function clip(name, secs, act, r) {
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await setRate(r || RATE); const ts = []; let n = 0, done = false;
    const v0 = await ev(() => window.__vt());
    const shoot = (async () => { const vp = p().viewportSize();
      while (!done) { const v = await ev(() => window.__vt()); if (v - v0 > secs * 1000) break;
        const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 3 } });
        fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(r.data, 'base64')); ts.push((v - v0) / 1000); } })();
    if (act) await act();
    await shoot; done = true; await setRate(1);
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); console.log('clip', name, n, 'frames', ts[n - 1].toFixed(2) + 's');
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
  await wait(1200);
  // the dogs take random spots: visit again (up to 12 times) until all three stand apart, so no friend's dog hides behind Mochi
  for (let k = 0; k < 12; k++) {
    const gap = await ev(() => { const d = window.__paw.fr.scene().dogs; let m = 1e9; for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) m = Math.min(m, Math.hypot(d[i].x - d[j].x, (d[i].y - d[j].y) * 1.5)); return m; });
    console.log('visit spots, smallest gap', Math.round(gap)); if (gap >= GAP) break;
    await p().click('#frHomeBtn'); await t.untilMode('yard'); await ev((fid) => window.__paw.fr.visit(fid), SUNNY);
    await t.until(() => window.__paw.mode === 'fryard', null, 6000); await wait(1200);
  }
  await still('visit');
  const petDog = (i) => ev((i) => { const el = document.querySelectorAll('#frDogs .frdog:not(.fr-mine)')[i]; if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, i);
  await clip('visit', 4.2, async () => { await wait(600); await petDog(0); await wait(1500); await petDog(1); }, 0.14);

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
  await wait(800);
  await clip('walk', 5.5, null, 0.17);
  await still('walk');
  console.log('done', OUT);
}, { time: 'day', weather: 'sunny', season: 'autumn', timeout: 900000 });
