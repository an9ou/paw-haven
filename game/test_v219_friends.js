// v2.19 Friends, parts 2 to 5 (V219.md sections 2 to 6 and 8): friend codes, the Friends sheet, the yard snapshot, visits, pets, notes, gifts and the walk together.
// An in-memory cloud mock fakes the Worker routes. node game/run_tests.js v219_friends (FR_ONLY=walk: part 5 alone; FR_SHOTS: the screenshot folder)
const { run, URL } = require('./test_lib');
const fs = require('fs'), path = require('path');
const SHOTS = process.env.FR_SHOTS || '/opt/cursor/artifacts/screenshots'; // FR_SHOTS: another folder for the screenshots
const workerSrc = fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'worker.js'), 'utf8');
const limM = workerSrc.match(/const FR_LIM = \{([^}]+)\}/);

function mockInit() {
  const fid = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22);
  const alph = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function norm(s) {
    if (typeof s !== 'string') return null;
    let t = s.replace(/\s+/g, '').toUpperCase();
    if (t.startsWith('DOG-')) t = t.slice(4); else if (t.startsWith('DOG')) t = t.slice(3);
    if (t.length !== 5 || t.split('').some((c) => alph.indexOf(c) < 0)) return null;
    return 'DOG-' + t;
  }
  const srv = {
    me: null, friends: [], yards: [], forceFull: false, offline: false, unknown: [], sent: [], visits: [],
    book: {
      'DOG-4K7PM': { fid: fid('sunnybiscuit'), name: [0, 0], dogs: [{ b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 }] },
      'DOG-7HJKN': { fid: fid('happyclover'), name: [1, 6], dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 2 }] },
      'DOG-9QRST': { fid: fid('cozyfern'), name: [2, 11], dogs: [{ b: 3, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 3 }] },
      // v2.22.3: the game's official yard (users.official in D1): no cap on its side, and it does not count toward my 50
      'DOG-K3APZ': { fid: fid('officialyard'), name: [0, 0], dogs: [{ b: 1, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 1 }], official: true }
    },
    // part 3: the friends' yard snapshots (V219.md 2). Happy Clover has none yet
    yardOf: {
      [fid('sunnybiscuit')]: { v: 1, name: [0, 0], house: 2, season: 'winter', dogs: [{ b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 }, { b: 1, c: null, o: 1, a: 'pup', s: 'm', sp: 0, n: 1 }], decor: [{ i: 19, x: 24, y: 300 }, { i: 20, x: 96, y: 318 }, { i: 15, x: 330, y: 470 }] },
      [fid('cozyfern')]: { v: 1, name: [2, 11], house: 4, season: 'spring', dogs: [{ b: 3, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 3 }], decor: [] }
    },
    events: [
      { id: 1, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'note', data: { i: 0 }, day: '2026-11-01', claimed: false },
      { id: 2, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'pet', data: {}, day: '2026-11-01', claimed: false },
      { id: 3, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'gift', data: { i: 0, n: 1 }, day: '2026-11-01', claimed: false },
      { id: 4, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'walk', data: { dog: 0, mine: { b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 } }, day: '2026-11-01', claimed: false }
    ]
  };
  window.__frSrv = srv;
  const user = { id: 'user000000000000000001', guest: true, email: null };
  window.__pawCloudMock = {
    async fetch(url, o) {
      o = o || {};
      if (srv.offline) throw new TypeError('Failed to fetch');
      const u = new URL(url, 'https://api.test'), method = o.method || 'GET', path = u.pathname;
      let body = null; try { body = o.body ? JSON.parse(o.body) : {}; } catch (e) { body = {}; }
      const send = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
      if (method === 'POST' && path === '/guest') { srv.guests = (srv.guests || 0) + 1; return send(200, { token: 'tok-test', user }); }
      if (srv.force401 && path.indexOf('/friends') === 0) { srv.force401 = false; return send(401, { error: 'auth' }); } // fix batch: the login is gone (a reset on another device)
      if (method === 'GET' && path === '/me') return send(200, { user });
      if (method === 'GET' && path === '/save') return send(200, { save: null });
      if (method === 'PUT' && path === '/save') return send(200, { ok: true });
      if (method === 'GET' && path === '/friends') { srv.lists = (srv.lists || 0) + 1; return send(200, { me: srv.me, friends: srv.friends }); }
      if (method === 'POST' && path === '/friends/me') {
        if (!srv.me) srv.me = { fid: fid('owner'), code: 'DOG-23456', name: body.name };
        else srv.me.name = body.name;
        return send(200, { fid: srv.me.fid, code: srv.me.code, name: srv.me.name });
      }
      if (method === 'POST' && path === '/friends/code/new') {
        if (!srv.me) return send(400, { error: 'bad' });
        srv.me.code = srv.me.code === 'DOG-23456' ? 'DOG-98765' : 'DOG-23456';
        return send(200, { fid: srv.me.fid, code: srv.me.code, name: srv.me.name });
      }
      if (method === 'POST' && path === '/friends/add') {
        const code = norm(body.code);
        if (!code) return send(404, { error: 'not_found' });
        if (srv.me && code === srv.me.code) return send(400, { error: 'self' });
        const who = srv.book[code];
        if (srv.forceFull || (!(who && who.official) && srv.friends.filter((f) => !f.official).length >= 50)) return send(400, { error: 'full' }); // as the Worker: official friends don't count
        if (!who) return send(404, { error: 'not_found' });
        if (srv.friends.some((f) => f.fid === who.fid)) return send(409, { error: 'already' });
        srv.friends.push(Object.assign({ fid: who.fid, name: who.name.slice(), dogs: srv.yardOf[who.fid] ? srv.yardOf[who.fid].dogs : [], seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } }, who.official ? { official: true } : {})); // as the Worker: the snapshot's dogs, [] with none
        return send(200, { ok: true });
      }
      if (method === 'POST' && path === '/friends/remove') { srv.friends = srv.friends.filter((f) => f.fid !== body.fid); return send(200, { ok: true }); }
      if (method === 'POST' && path === '/friends/block') { srv.friends = srv.friends.filter((f) => f.fid !== body.fid); return send(200, { ok: true }); }
      if (method === 'PUT' && path === '/friends/yard') { if ((srv.decorLim && body.yard.decor.some((d) => d.i >= srv.decorLim)) || (srv.houseLim && body.yard.house >= srv.houseLim)) { srv.badYards = (srv.badYards || 0) + 1; return send(400, { error: 'bad' }); } srv.yards.push(body.yard); return send(200, { ok: true }); } // decorLim: an older Worker's FR_LIM.decor
      if (method === 'GET' && path === '/friends/inbox') return send(200, { events: srv.events.filter((e) => !e.claimed).map((e) => ({ id: e.id, from: e.from, kind: e.kind, data: e.data, day: e.day })) });
      if (method === 'POST' && path === '/friends/inbox/claim') { srv.claims = (srv.claims || 0) + 1; if (srv.failClaim) throw new TypeError('Failed to fetch'); (body.ids || []).forEach((id) => { const e = srv.events.find((x) => x.id === id); if (e) e.claimed = true; }); return send(200, { ok: true }); }
      if (method === 'GET' && path === '/friends/yard') {
        const who = u.searchParams.get('fid'); srv.visits.push(who);
        if (!srv.friends.some((f) => f.fid === who)) return send(404, { error: 'not_found' });
        return send(200, { yard: srv.yardOf[who] || null });
      }
      if (method === 'POST' && path === '/friends/send') {
        srv.sends = (srv.sends || 0) + 1;
        if (srv.failSend) throw new TypeError('Failed to fetch'); // part 4: a network error on the send only
        const f = srv.friends.find((x) => x.fid === body.fid);
        if (!f || !['pet', 'note', 'gift', 'walk'].includes(body.kind)) return send(400, { error: 'bad' });
        if (body.kind === 'note' && !(Number.isInteger(body.data && body.data.i) && body.data.i >= 0 && body.data.i < 12)) return send(400, { error: 'bad' });
        if (body.kind === 'gift' && !(body.data && Number.isInteger(body.data.i) && body.data.i >= 0 && body.data.i < 49 && body.data.n === 1)) return send(400, { error: 'bad' });
        if (body.kind === 'gift' && srv.sent.some((s) => s.kind === 'gift')) return send(400, { error: 'limit' }); // one gift a day in all (from_id, kind, day)
        if (body.kind === 'walk') { // part 5, as the Worker's frWalk: { dog, mine, t? }, dog inside their snapshot, mine a card dog, t a gift index
          const d = body.data || {}, ks = Object.keys(d), snap = srv.yardOf[body.fid];
          if (!snap || !ks.includes('dog') || !ks.includes('mine') || ks.some((k) => !['dog', 'mine', 't'].includes(k)) || !Number.isInteger(d.dog) || d.dog < 0 || d.dog >= snap.dogs.length) return send(400, { error: 'bad' });
          if (!d.mine || typeof d.mine !== 'object' || !Number.isInteger(d.mine.b) || d.mine.b < 0 || !Number.isInteger(d.mine.n) || 'name' in d.mine) return send(400, { error: 'bad' });
          if ('t' in d && !(Number.isInteger(d.t) && d.t >= 0 && d.t < 49)) return send(400, { error: 'bad' });
        }
        if (srv.sent.some((s) => s.fid === body.fid && s.kind === body.kind)) return send(400, { error: 'limit' });
        srv.sent.push({ fid: body.fid, kind: body.kind, data: body.data }); f.sent[body.kind] = true;
        return send(200, { ok: true });
      }
      if (method === 'POST' && path === '/friends/leave') { srv.me = null; srv.friends = []; srv.yards = []; return send(200, { ok: true }); }
      srv.unknown.push(method + ' ' + path);
      return send(200, { ok: true });
    }
  };
}

async function start(t, o) {
  o = o || {};
  await t.mk(Object.assign({ prefs: Object.assign({}, o.prefs || {}, o.fr === false ? {} : { frTest: true }), storage: o.storage || null }, o.mk || {}));
  if (o.vw) await t.p.setViewportSize({ width: o.vw, height: o.vh });
  if (o.host) await t.ctx.addInitScript((h) => { window.__pawCloudHost = h; }, o.host);
  if (o.mock !== false) await t.ctx.addInitScript(mockInit);
  await t.p.goto((o.url || URL) + (o.query || ''));
  await t.p.waitForSelector('#tNew, #tContinue, #tGuest'); // cloud on: Play as guest comes first
  if (o.fresh === false) return;
  if (await t.p.locator('#tGuest').count()) { await t.p.click('#tGuest'); await t.p.waitForSelector('#tNew'); }
  await t.adopt(o);
  await t.patch(Object.assign({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } }, o.patch || {}));
  await t.calm();
}
async function shot(t, name) {
  try { fs.mkdirSync(SHOTS, { recursive: true }); await t.p.waitForTimeout(500); /* a sheet's pop-in has settled */ await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); } catch (e) { /* a missing folder should not fail the suite */ }
}
async function layout(t) {
  return t.ev(() => {
    const iw = window.innerWidth, ih = window.innerHeight;
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const body = document.querySelector('#modal .panel-body');
    const els = [...document.querySelectorAll('#modal button, #modal input, #modal .fr-ch')];
    const bad = [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const id = el.id || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 24);
      if (r.width < 43.5 || r.height < 43.5) bad.push('small ' + id + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (r.left < -1 || r.right > iw + 1) bad.push('side ' + id);
      const x = Math.min(iw - 2, Math.max(2, r.left + r.width / 2));
      const yOn = Math.min(r.bottom - 2, Math.max(r.top + 2, r.top + r.height / 2));
      if (yOn < 2 || yOn > ih - 2) return;
      const br = body && body.contains(el) ? body.getBoundingClientRect() : null;
      if (br && (yOn > br.bottom || yOn < br.top)) return; // scrolled out of the sheet's own scroll area (clipped there, not drawn over the bar)
      const top = document.elementFromPoint(x, yOn);
      if (top && top.closest && top.closest('#bar')) bad.push('bar ' + id);
    });
    return { sw, iw, side: sw > iw + 1 || !!(body && body.scrollWidth > body.clientWidth + 1), bad };
  });
}

// FR_ONLY=poster: the poster PNGs (en, ja, th) and the sheet at 360 and 393 px into FR_SHOTS, with a code full of look-alikes (S 5 Z 2 B, and 8 B 5 S Z
// typed in the boxes). FR_URL: an http:// copy of game/test_merged.html, so the ja and th faces load (file:// pages cannot fetch fonts)
async function posterPart(t) {
  const { ok, ev } = t;
  const url = process.env.FR_URL || URL;
  const pick = async () => {
    await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
    await ev(() => window.__paw.fr.open());
    await t.until(() => !!document.getElementById('frOk') || !!document.getElementById('frPoster'), null, 6000);
    if (await t.p.locator('#frOk').count()) await t.p.click('#frOk');
    await t.until(() => !!document.getElementById('frPoster'), null, 6000);
    await ev(() => { window.__paw.S.fr.code = 'DOG-S5Z2B'; window.__frSrv.me.code = 'DOG-S5Z2B'; window.__paw.S.fr.name = [4, 9]; });
    await t.closeX(); await t.modalGone(); await ev(() => window.__paw.fr.open()); await t.until(() => !!document.getElementById('frPoster'), null, 6000);
    await ev(() => { '8B5SZ'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  };
  for (const lang of (process.env.FR_POSTER_LANGS || 'en,ja,th').split(',')) { // FR_POSTER_LANGS: the poster languages (default en, ja, th)
    await start(t, { url, mk: { lang }, prefs: { i18nFonts: true } });
    await pick();
    await t.p.waitForTimeout(1500); // the language face arrives
    fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, 'poster_' + lang + '.svg'), await ev(() => window.__paw.fr.posterSVG()));
    const b64 = await ev(async () => { const b = await window.__paw.fr.poster(); if (!b) return ''; const r = new FileReader(); return new Promise((res) => { r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(b); }); });
    fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, 'poster_' + lang + '.png'), Buffer.from(b64, 'base64'));
    ok(b64 && b64.length > 60000, 'poster ' + lang + ' saved ' + (await ev(() => window.__paw.fr.posterErr())));
    if (lang === 'en') await shot(t, 'sheet_1280');
    await t.ctx.close();
  }
  // FR_FIT_LANGS (default en): the sheet's button row in those languages at 360 and 393 px: text inside its box, no two buttons overlapping
  for (const lang of (process.env.FR_FIT_LANGS || 'en').split(',')) for (const [w, h, dev] of [[360, 740, null], [393, 852, 'iPhone 15']]) {
    await start(t, dev ? { url, mk: { device: dev, lang }, prefs: { i18nFonts: true } } : { url, vw: w, vh: h, mk: { lang }, prefs: { i18nFonts: true } });
    await pick(); await t.p.waitForTimeout(1200);
    const lay = await layout(t);
    ok(!lay.side && !lay.bad.length, lang + ' ' + w + ' px: no sideways scroll, every tap 44 px and clear of the bar: ' + JSON.stringify(lay.bad));
    const row = await ev(() => { const bs = [...document.querySelectorAll('.fr-acts .btn')], r = bs.map((b) => b.getBoundingClientRect()), bad = [];
      bs.forEach((b, i) => { if (b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1) bad.push('spill ' + b.id); r.forEach((q, j) => { if (j > i && Math.min(r[i].right, q.right) - Math.max(r[i].left, q.left) > 1 && Math.min(r[i].bottom, q.bottom) - Math.max(r[i].top, q.top) > 1) bad.push('overlap ' + b.id + '/' + bs[j].id); }); });
      return { bad, txt: bs.map((b) => b.textContent) }; });
    ok(!row.bad.length, lang + ' ' + w + ' px: Share invite, Share poster, Copy code fit: ' + JSON.stringify(row));
    if (lang !== 'en' && !process.env.FR_FIT_SHOTS) { await t.ctx.close(); continue; } // FR_FIT_SHOTS=1: the sheet screenshots in every FR_FIT_LANGS language too
    await shot(t, 'sheet_' + w + (lang === 'en' ? '' : '_' + lang));
    await ev(() => { const c = document.getElementById('frCard'); if (c) c.scrollIntoView({ block: 'start' }); });
    await t.p.screenshot({ path: path.join(SHOTS, 'sheet_' + w + (lang === 'en' ? '' : '_' + lang) + '_card.png'), clip: await ev(() => { const r = document.querySelector('.fr-sheet').getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top), width: window.innerWidth, height: Math.min(window.innerHeight - Math.max(0, r.top), 560) }; }) });
    await t.ctx.close();
  }
}

run('v219_friends', async (t) => {
  const { ok, sec, ev } = t;
  if (process.env.FR_ONLY === 'poster') { await posterPart(t); return; }
  if (process.env.FR_ONLY === 'walk') { await walkPart(t); return; } // FR_ONLY=walk: part 5 alone (a quicker loop while working on it)
  if (process.env.FR_ONLY === 'greet') { await greetPart(t); return; } // FR_ONLY=greet: part 3b alone
  if (process.env.FR_ONLY === 'official') { await officialPart(t); return; } // FR_ONLY=official: the official account alone (v2.22.3)
  const workerLim = limM ? limM[1].replace(/\s/g, '') : '';

  sec('1. lists match the Worker, and the gift order is the contract');
  await start(t);
  await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
  const order = await ev(() => window.__paw.fr.orderOk());
  const lim = await ev(() => window.__paw.fr.lim());
  ok(order.gifts && order.decor && order.houses && order.notes, 'FR_GIFTS, FR_DECOR, FR_HOUSES and FR_NOTES match the game tables: ' + JSON.stringify(order.n));
  ok(lim.notes === 12 && lim.gifts === 49 && lim.decor === 40 && lim.houses === 16, 'lengths are notes 12, gifts 49, decor 40, houses 16 (v2.24: + the Golden Paw Cottage; v2.26: + the four yard toys; Sakura Market: + 5 decor, 1 house, 2 treats)');
  ok(workerLim === 'notes:12,gifts:49,decor:40,houses:16' && lim.notes === 12 && lim.gifts === 49 && lim.decor === 40 && lim.houses === 16, 'client lengths match FR_LIM in cloudflare/worker.js (' + workerLim + ')');
  ok(await ev(() => !window.__paw.fr.lists().gifts.includes('Golden Bone') && !window.__paw.fr.lists().gifts.includes('Fresh Water') && window.__paw.fr.lists().gifts[33] === 'Wild Berries' && window.__paw.fr.lists().gifts[34] === "Duck's Picnic Sandwich"), 'Wild Berries and the sandwich follow the foods. No Golden Bone, no Fresh Water');

  // owner, 2 Nov 2026: Friends on by default on the GitHub Pages test copy only (tools/pages.js), never itch.io or /play/ (tools/itch.js passes --itch)
  {
    const cp = require('child_process'), os = require('os'), root = path.join(__dirname, '..');
    const outA = fs.mkdtempSync(path.join(os.tmpdir(), 'ddpages-')), outB = fs.mkdtempSync(path.join(os.tmpdir(), 'dditch-'));
    let a = '', b = '';
    try {
      cp.execFileSync('node', [path.join(root, 'tools', 'pages.js'), '--single', '--no-minify', '--out', outA], { stdio: 'ignore' }); a = fs.readFileSync(path.join(outA, 'index.html'), 'utf8');
      cp.execFileSync('node', [path.join(root, 'tools', 'pages.js'), '--single', '--no-minify', '--itch', '--out', outB], { stdio: 'ignore' }); b = fs.readFileSync(path.join(outB, 'index.html'), 'utf8');
    } catch (e) { /* the asserts say it */ }
    const flag = '<script>window.__ddFrTest=1</script>', at = a.indexOf(flag), game = a.indexOf('<script', at + flag.length);
    ok(at > 0 && game > at && a.indexOf('<body>') < at, 'the Pages copy sets window.__ddFrTest before the game scripts');
    ok(b.length > 100000 && !b.includes('<script>window.__ddFrTest=1') && !b.includes('dd_gate_v1'), 'the itch.io / play copy (pages.js --itch) has neither the Friends flag nor the password screen');
    { const yf = '<script>window.__ddYueTest=1</script>', ya = a.indexOf(yf); // v2.20 (owner, 3 Nov 2026): Cantonese shown on the Pages test copy only (YUE_LIVE, game/i18n/msg.js)
      ok(ya > 0 && a.indexOf('<script', ya + yf.length) > ya && a.indexOf('<body>') < ya, 'v2.20: the Pages copy sets window.__ddYueTest before the game scripts');
      ok(b.length > 100000 && !b.includes(yf), 'v2.20: the itch.io / play copy has no Cantonese test flag'); }
    ok(/'pages\.js'\), '--itch'\]/.test(fs.readFileSync(path.join(root, 'tools', 'itch.js'), 'utf8')), 'tools/itch.js builds with --itch');
    fs.rmSync(outA, { recursive: true, force: true }); fs.rmSync(outB, { recursive: true, force: true });
  }
  { const f = await ev(() => window.__paw.fr.pagesFlag()); ok(f && f.off === false && f.on === true, 'window.__ddFrTest alone turns Friends on (FR_LIVE stays false): ' + JSON.stringify(f)); }

  sec('2. name pick, Dog Card default, Random, then my card');
  ok(await t.until(() => { const b = document.getElementById('frBtn'); return !!b && !b.hidden && b.getBoundingClientRect().width >= 44; }, null, 5000), 'desktop: Friends sits in the top bar, 44 px');
  await t.p.click('#frBtn');
  ok(await t.until(() => /Sunny Biscuit/.test((document.getElementById('frPrev') || {}).textContent || ''), null, 4000), 'no Dog Card yet: the wheels open on Sunny Biscuit');
  await shot(t, 'name_pick_1280');
  await t.closeX(); await t.modalGone();
  await ev(() => { window.__paw.S.dc.name = [1, 3]; }); // Happy + Acorn
  await t.p.click('#frBtn');
  ok(await t.until(() => /Happy Acorn/.test((document.getElementById('frPrev') || {}).textContent || ''), null, 4000), 'a Dog Card name is the default (Happy Acorn)');
  const before = await ev(() => document.getElementById('frPrev').textContent);
  await t.p.click('#frRand');
  let spun = await t.until((b) => (document.getElementById('frPrev') || {}).textContent !== b, before, 1500);
  if (!spun) { await t.p.click('#frRand'); spun = await t.until((b) => (document.getElementById('frPrev') || {}).textContent !== b, before, 1500); }
  ok(spun, 'Random picks another pair');
  const fit = await ev(() => {
    const els = [...document.querySelectorAll('.fr-wheels text')], lens = els.map((el) => ({ w: el.textContent, len: el.getComputedTextLength(), tl: el.getAttribute('textLength'), font: el.getAttribute('font-family'), css: getComputedStyle(el).fontFamily }));
    const big = els[1]; big.textContent = 'Supercalifragilisticexpialidocious'; window.__paw.fr.fit(document.querySelector('.fr-wheels'));
    return { lens, long: big.getComputedTextLength(), longTl: big.getAttribute('textLength') };
  });
  ok(fit.lens.length === 6 && fit.lens.every((x) => /DD Local Title/.test(x.font) && /Caveat/.test(x.font) && /DD Local Title/.test(x.css) && /Caveat/.test(x.css)), 'the wheel words use the hand face, then the local faces, in the computed style too (art review 1, fit audit 1): ' + JSON.stringify(fit.lens.map((x) => x.css)));
  ok(fit.lens.every((x) => x.len <= 106.5 && (x.len < 105 ? !x.tl : true)), 'no word is stretched to 106 wide; each fits its room (phone review 2): ' + JSON.stringify(fit.lens));
  ok(fit.long <= 106.5 && fit.long > 60, 'a word wider than the wheel steps down and squeezes to 106 (fit audit: the 112-unit text area less 3 a side): ' + JSON.stringify({ long: fit.long, tl: fit.longTl }));
  await t.p.click('#frRand');
  await t.p.click('#frOk');
  ok(await t.until(() => !!document.getElementById('frCard') && /DOG-23456/.test(document.getElementById('frCard').textContent || ''), null, 8000), 'the card shows the code DOG-23456');
  ok(await ev(() => document.querySelectorAll('#frCard rect').length > 20), 'the QR is drawn as squares');
  ok(await t.waitToast(/Make an account to keep/, 4000), 'a guest sees the make-an-account nudge once');
  ok(await t.until(() => (window.__paw.S.mail || []).some((m) => m && m.id === 'fr_note_1'), null, 6000), 'the note letter arrived');
  const mail = await ev(() => (window.__paw.S.mail || []).filter((m) => m && m.id === 'fr_note_1').map((m) => ({ from: m.from, text: m.text, paw: !!m.frPaw })));
  ok(mail.length === 1 && mail[0].from === 'Sunny Biscuit' && /fluffy/.test(mail[0].text) && mail[0].paw, 'the note became a postcard from Sunny Biscuit, with the paw: ' + JSON.stringify(mail));
  ok(await t.until(() => window.__frSrv.events.filter((e) => e.claimed).map((e) => e.kind).sort().join(',') === 'gift,note,pet,walk' && window.__paw.fr.badge() === 0, null, 4000), 'the note, the pet, the gift and the walk (part 5) are claimed. Nothing waits on the badge');
  const giftMail = await ev(() => (window.__paw.S.mail || []).filter((m) => m && m.id === 'fr_gift_3').map((m) => ({ kind: m.kind, from: m.from, title: m.title, gift: m.gift, wrap: m.frWrap })));
  ok(giftMail.length === 1 && giftMail[0].kind === 'gift' && giftMail[0].title === 'A gift from Sunny Biscuit!' && JSON.stringify(giftMail[0].gift) === JSON.stringify({ item: 'Basic Kibble', cat: 'food', id: 'Basic Kibble', n: 1 }) && (await ev(() => window.__paw.S.fr.gotGifts)) === 1, 'the gift became a mailbox gift letter "A gift from Sunny Biscuit!" with { cat, id, n: 1 }: ' + JSON.stringify(giftMail));
  const petMail = await ev(() => (window.__paw.S.mail || []).filter((m) => m && /^fr_pet_/.test(m.id)).map((m) => ({ id: m.id, from: m.from, title: m.title, text: m.text })));
  ok(petMail.length === 1 && petMail[0].id === 'fr_pet_2026-11-01' && petMail[0].text === 'Sunny Biscuit visited and petted ' + (await ev(() => window.__paw.S.dog.name)) + '. +1 Bond' && (await ev(() => window.__paw.S.fr.gotPets)) === 1, 'the pet became a letter: "Sunny Biscuit visited and petted <dog>. +1 Bond": ' + JSON.stringify(petMail));
  ok(await ev(() => { const el = document.querySelector('#frCard text.fr-fit'); return !!el && /DD Local/.test(el.getAttribute('font-family')) && /DD Local Title/.test(getComputedStyle(el).fontFamily) && el.getComputedTextLength() <= 108.5 && +el.getAttribute('y') === 104; }), 'the card name: local faces, fits 108, sits clear of the code (art review 1, 2)');
  await shot(t, 'my_card_1280');
  ok(await ev(() => { // fit audit 7: a name too long for one line at 18 goes on two lines, one word each, inside the name room and clear of the code
    const el = document.querySelector('#frCard text.fr-fit'), keep = el.cloneNode(true);
    el.dataset.l1 = 'Wohlfühl-'; el.dataset.l2 = 'Papageitaucher'; delete el.dataset.nm; el.textContent = 'Wohlfühl-Papageitaucher'; window.__paw.fr.fit(el.parentNode);
    const ts = [...el.querySelectorAll('tspan')], r = ts.length === 2 && ts.every((x) => x.getComputedTextLength() <= 108.5 && +x.getAttribute('y') <= 104) && +el.getAttribute('font-size') >= 11.2;
    el.replaceWith(keep); return r;
  }), 'a long card name: two lines of one word, each fits 108 (fit audit 7)');
  // phone review 5: note, pet and walk letters show a picture in the postcard, never an empty frame
  for (const id of ['fr_note_1', 'fr_pet_2026-11-01', 'fr_walk_4']) {
    await ev((id) => window.__paw.openMailbox(id), id);
    ok(await t.until(() => { const ph = document.querySelector('.panel.mailbox .letter .pc-photo'); return !!ph && !!ph.querySelector('svg') && ph.getBoundingClientRect().height > 20; }, null, 4000), id + ': the postcard photo has a picture');
  }
  ok(await ev(() => document.querySelectorAll('.panel.mailbox .letter .fr-letterpaw').length === 0), 'the walk letter\'s dog is the photo, not a second head under it');
  await t.closeX(); await t.modalGone();
  await t.p.click('#frBtn');
  await t.until(() => !!document.getElementById('frCh0'), null, 5000);

  sec('3. add, the four toasts, remove, block, no new code, the poster, share');
  await ev(() => { document.getElementById('frCh0').value = '0'; document.getElementById('frCh0').dispatchEvent(new Event('input', { bubbles: true })); });
  ok(await ev(() => document.getElementById('frCh0').value === ''), '0 is refused');
  for (const ch of ['O', '1', 'I', 'L']) {
    await ev((ch) => { const el = document.getElementById('frCh0'); el.value = ch; el.dispatchEvent(new Event('input', { bubbles: true })); }, ch);
    ok(await ev(() => document.getElementById('frCh0').value === ''), ch + ' is refused');
  }
  await ev(() => { '4K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.waitToast(/Sunny Biscuit is your friend now/, 5000), 'add: Sunny Biscuit is your friend now');
  ok(await t.until(() => !!document.querySelector('.fr-row'), null, 4000), 'the friend row is on the list');
  await shot(t, 'friends_1280');
  await ev(() => { document.getElementById('toasts').innerHTML = ''; window.__toasts.length = 0; });
  await ev(() => { '23457'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.waitToast(/couldn't find that code/, 4000), 'add: code not found');
  await ev(() => { window.__toasts.length = 0; const code = window.__paw.S.fr.code.slice(4); code.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.waitToast(/That's you/, 4000), 'add: that code is you');
  await ev(() => { window.__toasts.length = 0; window.__frSrv.forceFull = true; '4K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.waitToast(/50 friends/, 4000), 'add: 50 friends is the most');
  await ev(() => { window.__frSrv.forceFull = false; });

  await t.p.click('[data-fr="gift"]');
  ok(await t.until(() => !!document.querySelector('#modal .fr-giftsheet') && document.querySelectorAll('#modal [data-frgift]').length >= 1, null, 3000), 'Gift on a friend row opens the gift sheet');
  await t.closeX(); await t.modalGone();
  await t.p.click('#frBtn');
  await t.until(() => !!document.querySelector('[data-fr="more"]'), null, 5000);
  await ev(() => { window.__frPanel = document.querySelector('#modal .panel'); const b = window.__frPanel.querySelector('.panel-body'); b.scrollTop = 40; window.__frTop = b.scrollTop; });
  await t.p.click('[data-fr="more"]');
  ok(await t.until(() => !!document.querySelector('[data-fr="remove"]'), null, 3000), 'the ... menu has Remove and Block');
  ok(await ev(() => document.querySelector('#modal .panel') === window.__frPanel && document.querySelector('#modal .panel-body').scrollTop >= window.__frTop), 'the ... menu opens in place: the same sheet, no pop-in, the scroll kept (phone review 1)');
  await t.p.click('[data-fr="remove"]');
  ok(await t.until(() => !document.querySelector('.fr-row'), null, 4000), 'Remove takes the friend off the list');
  ok(await t.waitToast(/Sunny Biscuit is off your list\./, 3000), 'Remove: the toast names the friend');
  await t.p.click('#toasts .fr-undo .btn');
  ok(await t.until(() => !!document.querySelector('.fr-row'), null, 3000), 'Undo puts the row back (phone review 9)');
  await t.p.waitForTimeout(3600);
  ok(await ev(() => window.__frSrv.friends.some((f) => f.fid === 'sunnybiscuitxxxxxxxxxx') && document.querySelector('#modal .panel') === window.__frPanel), 'after Undo the Worker never hears the remove; the sheet was patched in place');
  await t.p.click('[data-fr="more"]');
  await t.p.click('[data-fr="remove"]');
  ok(await t.until(() => !window.__frSrv.friends.length, null, 6000), 'without Undo the remove reaches the Worker once its toast is gone');
  await ev(() => { window.__toasts.length = 0; '4K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  await t.until(() => !!document.querySelector('[data-fr="more"]'), null, 4000);
  await t.p.click('[data-fr="more"]');
  await t.p.click('[data-fr="block"]');
  ok(await t.until(() => /^Block Sunny Biscuit\? They won't be able to add you again\.$/.test(((document.querySelector('.confirm p') || {}).textContent || '')), null, 3000), 'Block\'s confirm names the friend');
  await t.p.click('.confirm .yes');
  ok(await t.until(() => !document.querySelector('.fr-row'), null, 4000), 'Block, after its confirm, takes the friend off the list');

  // owner, 2 Nov 2026: no New code (the code stays the same forever); Share poster makes a 1080x1920 story PNG
  ok(await ev(() => !document.getElementById('frNew') && !/New code/.test(document.querySelector('.fr-sheet').textContent)), 'no New code button on the sheet');
  ok(await ev(() => { const b = [...document.querySelectorAll('.fr-acts .btn')].map((x) => x.id); return b.join(',') === 'frShare,frPoster,frCopy'; }), 'the button row: Share invite, Share poster, Copy code');
  const pst = await ev(async () => {
    const F = window.__paw.fr, svg = F.posterSVG(), code = window.__paw.S.fr.code, blob = await F.poster();
    if (!blob) return { err: 'no blob: ' + F.posterErr() };
    const url = URL.createObjectURL(blob), im = new Image(); await new Promise((r) => { im.onload = r; im.onerror = r; im.src = url; });
    return { type: blob.type, w: im.naturalWidth, h: im.naturalHeight, size: blob.size, code: svg.includes('>' + code + '<'), scan: svg.includes('Scan or add '), link: svg.includes('doodledoggo.app/f/'), head: svg.includes('Be my dog&#39;s friend') || svg.includes("Be my dog's friend"), dog: /class="pa-dog/.test(svg), qr: (svg.match(/<rect /g) || []).length > 200, font: svg.includes("font-family:'DD Code'") };
  });
  ok(pst && pst.type === 'image/png' && pst.w === 1080 && pst.h === 1920 && pst.size > 50000, 'Share poster makes a 1080x1920 PNG: ' + JSON.stringify(pst));
  ok(pst && pst.code && pst.scan && pst.link && pst.head && pst.dog && pst.qr && pst.font, 'the poster has the code (in DD Code), Scan or add, the link, the headline, the leader dog and the QR');
  await ev(() => { window.__toasts.length = 0; window.__dl = ''; window.__paw.fr.posterForce('none'); const ac = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__dl = this.download; return; } return ac.call(this); }; });
  await t.p.click('#frPoster');
  ok(await t.waitToast(/Poster saved\. Look in your downloads\./, 6000) && await ev(() => /^doodle-doggo-friend-DOG-[A-Z2-9]{5}\.png$/.test(window.__dl) && window.__paw.fr.posterHow() === 'download'), 'no share sheet: the poster downloads, with a toast');
  await ev(() => { window.__paw.fr.posterForce(''); window.__shared = null; navigator.canShare = (d) => !!(d && d.files && d.files.length); navigator.share = async (d) => { window.__shared = { files: d.files.map((f) => f.name + ':' + f.type), text: d.text, url: d.url }; }; });
  await t.p.click('#frPoster');
  ok(await t.until(() => !!window.__shared, null, 6000) && await ev(() => window.__shared.files.length === 1 && /image\/png$/.test(window.__shared.files[0]) && window.__shared.url === 'https://doodledoggo.app/f/' + window.__paw.S.fr.code && window.__paw.fr.posterHow() === 'share'), 'Web Share gets the PNG file, the text and the invite link');
  await ev(() => { window.__paw.fr.posterForce(''); delete navigator.canShare; });

  await ev(() => {
    window.__copied = '';
    navigator.share = () => Promise.reject(Object.assign(new Error('no share'), { name: 'NoShare' }));
    if (!navigator.clipboard) navigator.clipboard = {};
    navigator.clipboard.writeText = async (text) => { window.__copied = text; };
  });
  await t.p.click('#frShare');
  ok(await t.waitToast(/Invite link copied/, 4000), 'Share falls back to the clipboard');
  ok(await ev(() => window.__copied === 'https://doodledoggo.app/f/' + window.__paw.S.fr.code), 'the copied link is the invite');

  sec('4. the yard snapshot, then offline, then Leave Friends');
  await ev(() => { const S = window.__paw.S; S.dog.name = 'Zztypedname'; S.decor = S.decor || {}; S.decor['Bird Bath'] = { out: true, at: [100.4, 200.6] }; S.decor['Braided Rag Rug'] = { out: true, at: [10, 10] }; });
  ok(await ev(() => window.__paw.fr.pushYard(true)), 'the yard PUT goes out');
  const yard = await ev(() => { const ys = window.__frSrv.yards; return ys[ys.length - 1]; });
  ok(yard && yard.v === 1 && Array.isArray(yard.name) && yard.name.length === 2 && yard.house === (await ev(() => window.__paw.fr.lists().houses.indexOf(window.__paw.S.house))) && ['spring', 'summer', 'autumn', 'winter'].includes(yard.season), 'snapshot shape, house index from FR_HOUSES: ' + JSON.stringify({ name: yard && yard.name, house: yard && yard.house, season: yard && yard.season, dogs: yard && yard.dogs && yard.dogs.length, decor: yard && yard.decor && yard.decor.length }));
  ok(yard && !JSON.stringify(yard).includes('Zztypedname') && yard.dogs.length >= 1 && !('name' in yard.dogs[0]) && yard.dogs[0].b >= 0 && yard.dogs[0].n >= 0, 'no typed dog name. the leader is a card dog');
  const decor = await ev(() => { const ys = window.__frSrv.yards, y = ys[ys.length - 1], list = window.__paw.fr.lists().decor, bath = y.decor.find((d) => d.i === list.indexOf('Bird Bath')); return { n: y.decor.length, puts: ys.length, bath, rug: y.decor.some((d) => d.i === list.indexOf('Braided Rag Rug')) }; });
  ok(decor.n === 1 && decor.bath && decor.bath.x === 100 && decor.bath.y === 201 && !decor.rug, 'yard decor is rounded and indexed. a house item stays out: ' + JSON.stringify(decor));
  const puts = decor.puts;
  ok(await ev((n) => window.__paw.fr.pushYard(false).then((x) => x === false && window.__frSrv.yards.length === n), puts), 'a second snapshot inside 10 minutes does not PUT');

  // v2.26 Yard visitors: the four yard toys are FR_DECOR 31-34. They go to friends (and show in their yards) only once Yard visitors is live, and an
  // older Worker (FR_LIM.decor 31) that refuses the snapshot gets it once more without them, so the rest of the yard still shows
  const toys = await ev(async () => {
    const P = window.__paw, fr = P.fr, S = P.S, srv = window.__frSrv, list = fr.lists().decor, last = () => srv.yards[srv.yards.length - 1];
    const idx = ['Tug Post', 'Puddle Pool', 'Play Tunnel', 'Bubble Fountain'].map((n) => list.indexOf(n));
    S.decor['Tug Post'] = { out: true, at: [180, 410] };
    const r = { idx, old: fr.decorOldN };
    fr.yvTest(false); await fr.pushYard(true); r.off = last().decor.map((d) => list[d.i]);
    const snap = { v: 1, name: [0, 0], house: 0, season: 'spring', dogs: [], decor: [{ i: idx[0], x: 180, y: 410 }, { i: 19, x: 24, y: 300 }] };
    r.offSeen = fr.clean(snap).decor.map((d) => d.n);
    fr.yvTest(true); await fr.pushYard(true); r.on = last().decor.map((d) => list[d.i]); r.onSeen = fr.clean(snap).decor.map((d) => d.n);
    srv.decorLim = 31; const n0 = srv.yards.length; r.okOld = await fr.pushYard(true); r.oldPut = srv.yards.length - n0; r.bad = srv.badYards; r.old1 = last().decor.map((d) => list[d.i]); r.flag = fr.decorOld();
    const b0 = srv.badYards; await fr.pushYard(true); r.bad2 = srv.badYards - b0; r.old2 = last().decor.map((d) => list[d.i]);
    delete srv.decorLim; fr.decorOld(false); fr.yvTest(false); delete S.decor['Tug Post']; await fr.pushYard(true);
    return r;
  });
  ok(JSON.stringify(toys.idx) === '[31,32,33,34]' && toys.old === 31, 'v2.26: the four yard toys are appended to FR_DECOR (31-34); an older Worker took 31: ' + JSON.stringify(toys.idx));
  ok(!toys.off.includes('Tug Post') && toys.off.includes('Bird Bath') && JSON.stringify(toys.offSeen) === '["Bird Bath"]', 'before Yard visitors is live a toy is neither sent nor drawn in a friend\'s yard: ' + JSON.stringify({ off: toys.off, seen: toys.offSeen }));
  ok(toys.on.includes('Tug Post') && toys.on.includes('Bird Bath') && JSON.stringify(toys.onSeen) === '["Tug Post","Bird Bath"]', 'once live, the toy is sent and a friend\'s toy is drawn: ' + JSON.stringify({ on: toys.on, seen: toys.onSeen }));
  ok(toys.okOld === true && toys.bad === 1 && toys.oldPut === 1 && !toys.old1.includes('Tug Post') && toys.old1.includes('Bird Bath') && toys.flag === true && toys.bad2 === 0 && !toys.old2.includes('Tug Post'), 'an older Worker refuses the toy: the yard goes again without it, once, and later pushes skip it: ' + JSON.stringify(toys));

  // Sakura Market: the five Sakura decorations (FR_DECOR 35-39) and the Blossom Kennel (FR_HOUSES 15) are appended; a Worker from before them (decor 35, houses 15) refuses
  // the snapshot, so the yard goes again without them (FR.sakOld), once, and later pushes stay without
  const sak = await ev(async () => {
    const P = window.__paw, fr = P.fr, S = P.S, srv = window.__frSrv, L = fr.lists(), last = () => srv.yards[srv.yards.length - 1];
    const idx = ['Hanami Picnic Blanket', 'Sakura Paper Lanterns', 'Paper Sakura Tree', 'Bento Picnic Table', 'Blossom Swing'].map((n) => L.decor.indexOf(n));
    const r = { idx, house: L.houses.indexOf('Blossom Kennel'), gifts: [L.gifts.indexOf('Sakura Pup Mochi'), L.gifts.indexOf('Hanami Rice Ball')] };
    S.decor['Bird Bath'] = S.decor['Bird Bath'] || { out: true, at: [24, 300] }; S.decor['Bird Bath'].out = true;
    S.decor['Blossom Swing'] = { out: true, at: [770, 250] };
    const prevHouse = S.house; S.house = 'Blossom Kennel';
    fr.sakOld(false); fr.decorOld(false);
    await fr.pushYard(true); r.new1 = last().decor.map((d) => L.decor[d.i]); r.newHouse = last().house;
    srv.decorLim = 35; srv.houseLim = 15; const n0 = srv.yards.length; const b0 = srv.badYards || 0;
    r.ok = await fr.pushYard(true); r.puts = srv.yards.length - n0; r.bad = (srv.badYards || 0) - b0; r.old1 = last().decor.map((d) => L.decor[d.i]); r.oldHouse = last().house; r.flag = fr.sakOld(); r.decorFlag = fr.decorOld();
    delete srv.decorLim; delete srv.houseLim; fr.sakOld(false); S.house = prevHouse; delete S.decor['Blossom Swing']; await fr.pushYard(true);
    return r;
  });
  ok(JSON.stringify(sak.idx) === '[35,36,37,38,39]' && sak.house === 15 && JSON.stringify(sak.gifts) === '[47,48]', 'Sakura Market: 5 decorations at 35-39, the Blossom Kennel at 15, the 2 treats at 47-48: ' + JSON.stringify(sak));
  ok(sak.new1.includes('Blossom Swing') && sak.newHouse === 15, 'a Sakura decoration and the Blossom Kennel are sent to a current Worker: ' + JSON.stringify({ d: sak.new1, h: sak.newHouse }));
  ok(sak.ok === true && sak.puts === 1 && sak.bad === 1 && !sak.old1.includes('Blossom Swing') && sak.old1.includes('Bird Bath') && sak.oldHouse === 0 && sak.flag === true && sak.decorFlag === false, 'a Worker from before Sakura refuses: the yard goes again once without them: ' + JSON.stringify(sak));

  await ev(() => { window.__frSrv.offline = true; window.__toasts.length = 0; });
  await t.closeX(); await t.modalGone();
  await t.p.click('#frBtn');
  ok(await t.until(() => !!document.getElementById('frOff'), null, 5000), 'offline: the offline line');
  ok(/internet connection/.test(await ev(() => document.getElementById('frOff').textContent)), 'offline line is the contract sentence');
  await ev(() => { window.__frSrv.offline = false; });

  await ev(() => { window.__frSrv.meWas = window.__frSrv.me; window.__frSrv.me = null; }); // another login, with no friend id
  await t.closeX(); await t.modalGone();
  await t.p.click('#frBtn');
  ok(await t.until(() => !!document.getElementById('frPrev') && window.__paw.S.fr.fid === null && window.__paw.S.fr.code === null, null, 5000), 'a login with no friend id: the old fid and code are forgotten, and the name pick opens (code review 1)');
  await ev(() => { window.__frSrv.me = window.__frSrv.meWas; });
  await t.p.click('#frOk');
  ok(await t.until(() => !!document.getElementById('frCard') && !!window.__paw.S.fr.fid, null, 6000), 'a name for this login brings the card back');
  await t.closeX(); await t.modalGone();
  await t.p.click('#gearBtn');
  await t.p.waitForSelector('#frLeave');
  await t.p.click('#frLeave');
  await t.p.click('.confirm .yes');
  ok(await t.until(() => !window.__paw.S.fr.fid && window.__paw.S.fr.on === false, null, 5000), 'Leave Friends clears the code, the list and the id');
  ok(await ev(() => window.__paw.S.fr.pets === 0 || typeof window.__paw.S.fr.pets === 'number'), 'Leave keeps the daily counters as numbers');

  sec('4b. a logged-out account\'s save never makes a stray guest for Friends (code review 1)');
  await t.closeX(); await t.modalGone();
  await ev(() => { const m = JSON.parse(localStorage.getItem('pawhaven_cloud_v1') || '{}'), s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); m.owner = 'user000000000000000001'; m.ownerDog = s.dogs[0].id; localStorage.setItem('pawhaven_cloud_v1', JSON.stringify(m)); window.__frSrv.force401 = true; window.__frSrv.guestsWas = window.__frSrv.guests || 0; window.__toasts.length = 0; });
  await t.p.click('#frBtn');
  await t.until(() => !!document.getElementById('frOk'), null, 4000);
  await t.p.click('#frOk'); // the 401: this device is logged out
  ok(await t.waitToast(/internet connection/, 4000), 'the 401 reads as offline');
  await ev(() => { window.__toasts.length = 0; });
  await t.p.click('#frOk');
  ok(await t.waitToast(/internet connection/, 4000) && (await ev(() => (window.__frSrv.guests || 0) === window.__frSrv.guestsWas && !window.__paw.S.fr.fid)), 'logged out with the account\'s save: no new guest is made, Friends waits offline');

  sec('5. an old save loads with S.fr defaults, and a new day resets the counters');
  const planted = await ev(() => {
    const raw = JSON.parse(localStorage.getItem('pawhaven_proto_v1'));
    delete raw.fr;
    const bare = JSON.parse(JSON.stringify(raw));
    window.__paw.fr.migrate(bare);
    raw.fr = { on: true, fid: 'keep000000000000000001', code: 'DOG-23456', name: [0, 0], day: '1999-01-01', walkDay: '1999-01-01', pets: 4, gotPets: 2, notes: 3, gift: true, gotGifts: 1, walks: 2, gotWalks: 1, cache: { at: 1, friends: [] }, yards: {}, guest: null };
    return { fresh: bare.fr, json: JSON.stringify(raw) };
  });
  ok(planted.fresh && planted.fresh.on === false && planted.fresh.fid === null && planted.fresh.code === null && planted.fresh.pets === 0 && planted.fresh.gift === false && Array.isArray(planted.fresh.cache.friends), 'a save with no S.fr gets the defaults');
  await t.ctx.close();
  await start(t, { fresh: false, storage: { pawhaven_proto_v1: planted.json } });
  ok(await t.until(() => !!(window.__paw && window.__paw.S && window.__paw.S.fr && window.__paw.S.fr.fid === 'keep000000000000000001'), null, 8000), 'an old save loads, and the friend id stays');
  const fr = await ev(() => window.__paw.S.fr);
  ok(fr && fr.pets === 0 && fr.notes === 0 && fr.gift === false && fr.walks === 0 && fr.gotWalks === 0 && fr.day === fr.walkDay && /^\d{4}-\d{2}-\d{2}$/.test(fr.day), 'a new localISO day resets the daily counters: ' + JSON.stringify(fr && { day: fr.day, pets: fr.pets, gift: fr.gift, walks: fr.walks }));
  await t.ctx.close();

  sec('6. an invite link pre-fills Add a friend, after the title');
  await start(t, { query: '?friend=DOG-4K7PM' });
  ok(await t.until(() => !!document.getElementById('frPrev') || !!document.getElementById('frCh0'), null, 8000), 'the invite opens Friends after the title');
  if (await t.p.locator('#frOk').count()) await t.p.click('#frOk');
  ok(await t.until(() => (document.getElementById('frCh0') || {}).value === '4' && (document.getElementById('frCh4') || {}).value === 'M', null, 8000), '?friend= pre-fills DOG-4K7PM');
  ok(await ev(() => !/friend=/.test(location.search + location.hash)), 'the friend= is taken out of the address once read, so a reload does not ask again (code review 8)');
  await t.ctx.close();
  await start(t, { query: '#friend=DOG-4K7PM' });
  ok(await t.until(() => !!document.getElementById('frOk') || !!document.getElementById('frCh0'), null, 8000), 'a hash invite opens Friends too');
  if (await t.p.locator('#frOk').count()) await t.p.click('#frOk');
  ok(await t.until(() => (document.getElementById('frCh0') || {}).value === '4', null, 8000), '#friend= pre-fills the code');
  await t.ctx.close();

  sec('7. off by default, and hidden on the artifact');
  await start(t, { mock: false, fr: false, query: '?friend=DOG-4K7PM' });
  ok(await t.until(() => !!(window.__paw && window.__paw.fr && window.__paw.mode === 'yard'), null, 8000), 'a normal boot reaches the yard');
  ok(await ev(() => window.__paw.fr.on() === false), 'off under the test harness without a test flag (FR_LIVE ' + (await ev(() => window.__paw.fr.live())) + '; live players get Friends since v2.19)');
  ok(await ev(() => { const b = document.getElementById('frBtn'); return (!b || b.hidden || getComputedStyle(b).display === 'none') && !document.getElementById('mmFr') && !document.getElementById('frLeave') && !document.getElementById('frPrev') && !document.getElementById('frCh0'); }), 'off by default: no Friends button, no Leave Friends row, and the invite card stays hidden');
  await t.ctx.close();
  await start(t, { mock: false, fr: false, host: 'claude.ai' });
  ok(await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000) && !(await ev(() => window.__paw.fr.on())), 'claude.ai: frOn is false');
  ok(await ev(() => { const b = document.getElementById('frBtn'); return !b || b.hidden || getComputedStyle(b).display === 'none'; }), 'claude.ai: no Friends button');
  await t.ctx.close();

  sec('8. phone 390x844 and 360x740');
  for (const [w, h, tag] of [[390, 844, '390'], [360, 740, '360']]) {
    await start(t, { vw: w, vh: h });
    await t.until(() => document.documentElement.dataset.layout === 'phone', null, 4000);
    await t.p.click('#moreBtn');
    ok(await t.until(() => !!document.getElementById('mmFr') && !!document.getElementById('mmMs'), null, 4000), tag + ': the ... menu has Friends next to Daily missions');
    const menu = await layout(t);
    ok(!menu.side && !menu.bad.length, tag + ' menu fits: ' + JSON.stringify(menu));
    await t.closeX(); await t.modalGone();
    await t.p.click('#bar [data-act="more"]');
    ok(await t.until(() => !!document.querySelector('#bar [data-act="friends"]'), null, 3000), tag + ': the More tray has Friends');
    ok(await ev(() => [...document.querySelectorAll('#bar .barpop[data-pop="more"] .act')].every((b) => { const r = b.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && r.left >= -1 && r.right <= window.innerWidth + 1; })), tag + ': More tray taps are 44 px and on screen');
    await t.p.click('#bar [data-act="friends"]');
    ok(await t.until(() => !!document.getElementById('frPrev'), null, 4000), tag + ': name pick opens');
    const nameLay = await layout(t);
    ok(!nameLay.side && !nameLay.bad.length, tag + ' name pick fits: ' + JSON.stringify(nameLay));
    if (tag === '390') await shot(t, 'name_pick_390');
    await t.p.click('#frOk');
    ok(await t.until(() => !!document.getElementById('frCard'), null, 8000), tag + ': the card opens');
    const cardLay = await layout(t);
    ok(!cardLay.side && !cardLay.bad.length, tag + ' card fits: ' + JSON.stringify(cardLay));
    if (tag === '390') await shot(t, 'my_card_390');
    await ev(() => { '4K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
    await t.p.click('#frAdd');
    ok(await t.until(() => !!document.querySelector('.fr-row'), null, 5000), tag + ': the friend list');
    const listLay = await layout(t);
    ok(!listLay.side && !listLay.bad.length, tag + ' list fits: ' + JSON.stringify(listLay));
    if (tag === '390') await shot(t, 'friends_390');
    await t.ctx.close();
  }

  /* ---------------- part 3: yard visits, pets and paw-print notes (V219.md section 4) ---------------- */
  const SUNNY = 'sunnybiscuitxxxxxxxxxx', CLOVER = 'happycloverxxxxxxxxxxx', FERN = 'cozyfernxxxxxxxxxxxxxx';
  sec('9. Visit: the friend\'s house, decor, season and dogs from the snapshot');
  await start(t);
  await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
  await befriend(t, ['DOG-4K7PM', 'DOG-7HJKN', 'DOG-9QRST']);
  ok(await ev(() => document.querySelectorAll('.fr-row').length === 3), 'three friends on the list');
  const myHouse = await ev(() => window.__paw.S.house);
  await t.p.click(`.fr-row[data-fid="${CLOVER}"] [data-fr="visit"]`);
  ok(await t.waitToast(/Happy Clover's yard is still being tidied\. Try again later\./, 4000), 'no snapshot yet: "Happy Clover\'s yard is still being tidied. Try again later."');
  ok(await ev(() => window.__paw.mode === 'yard' && !!document.querySelector('#modal .fr-sheet')), 'no snapshot: the player stays home, the sheet stays open');
  await t.p.click(`.fr-row[data-fid="${SUNNY}"] [data-fr="visit"]`);
  ok(await t.until(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden, null, 5000), 'Visit enters cur.mode fryard and closes the sheet');
  const cache = await ev((fid) => { const y = window.__paw.S.fr.yards[fid]; return { y, n: Object.keys(window.__paw.S.fr.yards).length, today: window.__paw.S.fr.day, asked: window.__frSrv.visits.slice() }; }, SUNNY);
  ok(cache.y && cache.y.day === cache.today && cache.y.yard && cache.y.yard.house === 2 && cache.asked.includes(SUNNY), 'GET /friends/yard?fid=, cached in S.fr.yards[fid] with the day: ' + JSON.stringify({ day: cache.y && cache.y.day, asked: cache.asked }));
  const sc = await ev(() => window.__paw.fr.scene());
  ok(sc.house === 'Cozy Cottage' && myHouse !== 'Cozy Cottage', 'their house (FR_HOUSES[2] Cozy Cottage), not mine (' + myHouse + ')');
  ok(sc.season === 'winter' && (await ev(() => JSON.parse(document.querySelector('#sceneG').dataset.extra || '{}').season === 'winter' && document.querySelector('#sceneG').dataset.scene === 'yard')), 'their season: the yard scene is drawn in winter (the harness pins summer)');
  const dec = await ev(() => ['Bird Bath', 'Flower Barrel', 'Yard Snowman'].map((n) => { const s = document.querySelector(`#frDecorG [data-frdecor="${n}"] > svg`); return s ? [n, +s.getAttribute('x'), +s.getAttribute('y')] : [n, null]; }));
  ok(JSON.stringify(dec) === JSON.stringify([['Bird Bath', 24, 300], ['Flower Barrel', 96, 318], ['Yard Snowman', 330, 470]]), 'their decor (FR_DECOR) at the saved spots: ' + JSON.stringify(dec));
  const dogs = sc.dogs;
  ok(dogs.length === 3 && dogs.filter((d) => d.mine).length === 1 && dogs.filter((d) => !d.mine).map((d) => d.name).sort().join(',') === 'Mochi,Noodle', 'their two dogs (Dog Card visitors) and my leader: ' + JSON.stringify(dogs));
  ok(await ev(() => document.querySelectorAll('#frDogs .frdog').length === 3 && document.querySelectorAll('#frDogs .frdog:not(.fr-mine)[role="button"]').length === 2), 'all three are drawn. their dogs are tappable, my leader is not');
  ok(await ev(() => /^Sunny Biscuit's yard$/.test((document.querySelector('#status .pname') || {}).textContent || '')), 'the chip says "Sunny Biscuit\'s yard"');
  ok(await ev(() => [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.id + ':' + b.textContent).join('|') === 'frNoteBtn:Leave a paw print|frGiftBtn:Send a gift|frHomeBtn:Go home'), 'the buttons: "Leave a paw print", "Send a gift" and "Go home": ' + JSON.stringify(await ev(() => [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.textContent))));
  await shot(t, 'visit_1280');

  sec('10. read-only: nothing in the friend\'s yard changes my save');
  const ro = await ev(() => {
    const vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
    const hots = [...document.querySelectorAll('#view svg.world #sceneG [data-hot], #view svg.world #sceneG [data-shop]')].filter((e) => getComputedStyle(e).pointerEvents !== 'none').map((e) => e.getAttribute('data-hot') || e.getAttribute('data-shop'));
    return { gone: ['#bowlG', '#mailboxG', '#decorG', '#secretX', '#pack', '#dogHit', '[data-pb="garden"]', '[data-pb="house"]', '[data-sh]', '#ddWish'].filter((s) => document.querySelector('#view ' + s) && vis('#view ' + s)), ms: vis('#msBtn'), chips: vis('#hudPack .dchip'), hots };
  });
  ok(!ro.gone.length && !ro.ms && !ro.chips && !ro.hots.length, 'no garden, mailbox, missions, bowl, decorating, shop doors or dog switcher: ' + JSON.stringify(ro));
  await ev(() => { window.__toasts.length = 0; });
  await t.p.click('#bar .act[data-act="feed"]');
  ok(await t.waitToast(/You are visiting\. Go home first\./, 3000) && (await ev(() => window.__paw.mode === 'fryard' && !document.querySelector('#dock [data-food]'))), 'Feed is inert in the friend\'s yard: no tray, still visiting');
  for (const a of ['play', 'care', 'walk', 'wardrobe']) {
    await t.p.click(`#bar .act[data-act="${a}"]`);
    ok(await ev(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden && !document.querySelector('#dock .tray')), a + ' is inert too');
  }

  sec('11. pet: hearts, a happy pose and a line. The first pet a day sends pet and gives +1 Bond');
  const b0 = await ev(() => window.__paw.S.bond.pts);
  const pet1 = await ev(() => { const el = document.querySelector('#frDogs .frdog:not(.fr-mine)'); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return +el.dataset.frd; });
  ok(await t.until(() => document.querySelectorAll('#fx .heartfx').length > 0, null, 2000), 'hearts over the petted dog');
  ok(await ev((i) => window.__paw.fr.scene().dogs[i].pose === 'happy', pet1), 'the dog does its happy pose');
  ok(await ev(() => !document.getElementById('bubble').hidden && document.getElementById('bubble').textContent.length > 5), 'it says a line from its personality: ' + JSON.stringify(await ev(() => document.getElementById('bubble').textContent)));
  ok(await t.until((fid) => window.__frSrv.sent.filter((s) => s.kind === 'pet' && s.fid === fid).length === 1, SUNNY, 4000), 'POST /friends/send { kind: pet } went out');
  ok(await t.until((b) => window.__paw.S.bond.pts === b + 1 && window.__paw.S.fr.pets === 1, b0, 3000), 'on ok my leader gets +1 Bond, S.fr.pets 1');
  await t.p.waitForTimeout(400);
  await ev(() => { document.querySelector('#frDogs .frdog:not(.fr-mine)').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await t.p.waitForTimeout(600);
  ok(await ev((b) => window.__frSrv.sent.filter((s) => s.kind === 'pet').length === 1 && window.__paw.S.bond.pts === b + 1, b0), 'a second pet that day is just hearts: nothing sent, no Bond');

  sec('12. the paw-print note: one of the 12 lines, the stamp on the path, once a day');
  ok(await ev(() => !document.querySelector('#frStampG .fr-stamp')), 'no stamp before the note');
  await t.p.click('#frNoteBtn');
  ok(await t.until(() => document.querySelectorAll('#modal [data-frnote]').length === 12, null, 3000), 'the sheet lists the 12 FR_NOTES lines');
  ok(await ev(() => document.querySelector('#modal [data-frnote="3"]').textContent === 'Your yard looks lovely!'), 'line 4 is "Your yard looks lovely!"');
  await t.p.click('#modal [data-frnote="3"]');
  ok(await t.until((fid) => window.__frSrv.sent.some((s) => s.kind === 'note' && s.fid === fid && s.data && s.data.i === 3 && Object.keys(s.data).join() === 'i'), SUNNY, 4000), 'sent as { kind: note, data: { i: 3 } }');
  ok(await t.waitToast(/Paw print left!/, 3000), 'the toast "Paw print left!"');
  ok(await t.until(() => !!document.querySelector('#frStampG .fr-stamp') && document.getElementById('modal').hidden, null, 3000), 'the paw stamp is on the path');
  ok(await ev(() => document.getElementById('frNoteBtn').textContent === 'Paw print left today' && document.getElementById('frNoteBtn').getAttribute('aria-disabled') === 'true' && window.__paw.S.fr.notes === 1), 'the button reads "Paw print left today"');
  await t.p.click('#frNoteBtn', { force: true }); // aria-disabled: Playwright would wait for it to be enabled
  await t.p.waitForTimeout(300);
  ok(await ev(() => document.getElementById('modal').hidden && window.__frSrv.sent.filter((s) => s.kind === 'note').length === 1), 'a second note that day: no sheet, nothing sent');
  await shot(t, 'visit_note_1280');

  sec('13. going home: the button, Map, Escape and the app going to the background');
  await t.p.click('#frHomeBtn');
  ok(await t.until(() => window.__paw.mode === 'yard' && !!document.querySelector('#view #bowlG') && !document.getElementById('stage').classList.contains('frvisit'), null, 4000), 'Go home: the normal yard is back');
  ok(await ev(() => { const n = document.querySelector('#status .pname'); return !!n && n.textContent.length > 0 && !/Sunny Biscuit/.test(n.textContent); }), 'the chip is the home chip again: ' + JSON.stringify(await ev(() => (document.querySelector('#status .pname') || {}).textContent)));
  ok(await ev((fid) => window.__paw.fr.visit(fid).then(() => window.__paw.mode === 'fryard'), SUNNY), 'visit again the same day');
  ok(await ev(() => !!document.querySelector('#frStampG .fr-stamp') && document.getElementById('frNoteBtn').textContent === 'Paw print left today'), 'the stamp is still there, and the button still reads "Paw print left today"');
  await t.p.click('#bar .act[data-act="map"]');
  ok(await t.until(() => window.__paw.mode === 'yard' && !!document.querySelector('#view #bowlG'), null, 4000), 'Map goes home (not the town map)');
  await ev((fid) => window.__paw.fr.visit(fid), SUNNY);
  await t.until(() => window.__paw.mode === 'fryard', null, 4000);
  await t.p.keyboard.press('Escape');
  ok(await t.until(() => window.__paw.mode === 'yard', null, 4000), 'Escape goes home');
  await ev((fid) => window.__paw.fr.visit(fid), SUNNY);
  await t.until(() => window.__paw.mode === 'fryard', null, 4000);
  await ev(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); delete document.visibilityState; });
  ok(await t.until(() => window.__paw.mode === 'yard' && !!document.querySelector('#view #bowlG'), null, 4000), 'the app going to the background goes home');

  sec('14. my side: Bond for at most 5 friends a day');
  await ev(() => { window.__paw.S.fr.pets = 5; });
  const b1 = await ev(() => window.__paw.S.bond.pts);
  await ev((fid) => window.__paw.fr.visit(fid), FERN);
  ok(await t.until(() => window.__paw.mode === 'fryard' && window.__paw.fr.scene().house === 'Treehouse Den' && window.__paw.fr.scene().season === 'spring', null, 4000), 'Cozy Fern\'s yard: the Treehouse Den in spring');
  await ev(() => { document.querySelector('#frDogs .frdog:not(.fr-mine)').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  ok(await t.until((fid) => window.__frSrv.sent.some((s) => s.kind === 'pet' && s.fid === fid), FERN, 4000), 'a sixth friend\'s pet is still sent');
  await t.p.waitForTimeout(500);
  ok(await ev((b) => window.__paw.S.bond.pts === b && window.__paw.S.fr.pets === 5, b1), 'but gives no Bond: 5 friends a day is the most');
  await t.p.click('#frHomeBtn');
  await t.until(() => window.__paw.mode === 'yard', null, 4000);

  sec('15. receiving: a day of pets is one letter, +1 Bond each, at most 5 a day');
  const r0 = await ev(() => ({ b: window.__paw.S.bond.pts, got: window.__paw.S.fr.gotPets }));
  await ev(() => { const srv = window.__frSrv, F = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22); [[3, 4], [5, 6], [7, 8], [9, 10], [11, 12], [13, 14]].forEach(([a, b], k) => srv.events.push({ id: 20 + k, from: { fid: F('petter' + k), name: [a, b] }, kind: 'pet', data: {}, day: '2026-11-02', claimed: false })); });
  await ev(() => window.__paw.fr.inbox());
  const L1 = await ev(() => { const m = window.__paw.S.mail.filter((x) => x && x.id === 'fr_pet_2026-11-02'); return { n: m.length, text: m[0] && m[0].text, read: m[0] && m[0].read, b: window.__paw.S.bond.pts, got: window.__paw.S.fr.gotPets, claimed: window.__frSrv.events.filter((e) => e.id >= 20).every((e) => e.claimed) }; });
  ok(r0.got === 1 && L1.n === 1 && L1.claimed && /^Fluffy Button and 5 friends visited and petted .+\. \+4 Bond$/.test(L1.text || ''), 'six pets on one day: one letter "Fluffy Button and 5 friends visited and petted <dog>. +4 Bond": ' + JSON.stringify(L1.text));
  ok(L1.got === 5 && L1.b === r0.b + 4, 'each claimed pet +1 Bond up to 5 a day (S.fr.gotPets 1 -> 5, Bond +4)');
  await ev(() => { const srv = window.__frSrv; srv.events.push({ id: 40, from: { fid: 'latepetterxxxxxxxxxxxx', name: [15, 16] }, kind: 'pet', data: {}, day: '2026-11-02', claimed: false }); srv.events.find((e) => e.id === 20).claimed = false; window.__paw.S.mail.find((x) => x.id === 'fr_pet_2026-11-02').read = true; });
  await ev(() => window.__paw.fr.inbox());
  const L2 = await ev(() => { const m = window.__paw.S.mail.filter((x) => x && x.id === 'fr_pet_2026-11-02'); return { n: m.length, text: m[0] && m[0].text, read: m[0] && m[0].read, b: window.__paw.S.bond.pts, got: window.__paw.S.fr.gotPets }; });
  ok(L2.n === 1 && /^Fluffy Button and 6 friends visited and petted .+\. \+4 Bond$/.test(L2.text || '') && L2.read === false, 'a later pet that day joins the same letter, which opens again: ' + JSON.stringify(L2.text));
  ok(L2.b === L1.b && L2.got === 5, 'past 5 a day the pet gives the letter only, and an event claimed twice gives no second Bond');
  ok(await ev(() => window.__paw.S.mail.filter((m) => m && m.frPaw).length >= 1 && window.__paw.S.mail.filter((m) => m && /^fr_note_/.test(m.id)).every((m) => m.frPaw)), 'note letters keep the paw doodle');
  await t.ctx.close();

  sec('16. a deep compare: a visit changes only Bond and S.fr');
  await start(t);
  await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
  await befriend(t, ['DOG-4K7PM', 'DOG-9QRST', 'DOG-7HJKN']);
  await ev((fid) => { window.__frSrv.yardOf[fid] = { v: 1, name: [1, 6], house: 5, season: 'autumn', dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 2 }], decor: [] }; }, CLOVER);
  await t.closeX(); await t.modalGone();
  await t.p.waitForTimeout(500);
  const deep = await ev(async (fids) => {
    const P = window.__paw, srv = window.__frSrv, ALIAS = ['dog', 'stats', 'bond', 'outfit', 'potty', 'sleeping', 'dishLog', 'buff', 'glowUntil', 'pupUntil', 'tricks'];
    const snap = () => { const root = P.S; return JSON.parse(JSON.stringify(root, function (k, v) { return this === root && ALIAS.includes(k) ? undefined : v; })); };
    const diff = (a, b, at, out) => {
      if (JSON.stringify(a) === JSON.stringify(b)) return out;
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object') { out.push(at); return out; }
      new Set(Object.keys(a).concat(Object.keys(b))).forEach((k) => diff(a[k], b[k], at ? at + '.' + k : k, out)); return out;
    };
    const wait = async (f) => { for (let i = 0; i < 80 && !f(); i++) await new Promise((r) => setTimeout(r, 50)); return f(); };
    for (const fid of fids) {
      const before = snap(), b0 = P.S.bond.pts;
      await P.fr.visit(fid);
      if (P.mode !== 'fryard') return { err: 'no visit ' + fid };
      document.querySelector('#frDogs .frdog:not(.fr-mine)').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(() => P.S.bond.pts === b0 + 1);
      document.getElementById('frNoteBtn').click();
      await wait(() => !!document.querySelector('#modal [data-frnote="0"]'));
      document.querySelector('#modal [data-frnote="0"]').click();
      await wait(() => !!document.querySelector('#frStampG .fr-stamp'));
      P.fr.home();
      const after = snap();
      if (after.gameMin !== before.gameMin) continue; // a clock tick slipped in while the yard was fetched (before the visit began): try the next friend
      const d = diff(before, after, '', []);
      return { fid, d, bad: d.filter((p) => !/^fr(\.|$)/.test(p) && !/^dogs\.\d+\.bond\.(pts|level)$/.test(p)), bond: P.S.bond.pts - b0, sent: srv.sent.filter((s) => s.fid === fid).map((s) => s.kind).join(',') };
    }
    return { err: 'the clock ticked in every try' };
  }, [SUNNY, FERN, CLOVER]);
  ok(deep && !deep.err && deep.sent === 'pet,note' && deep.bond === 1, 'a full visit (pet, note, home): ' + JSON.stringify(deep && { fid: deep.fid, sent: deep.sent, bond: deep.bond, err: deep.err }));
  ok(deep && !deep.err && !deep.bad.length && deep.d.some((p) => /^dogs\.\d+\.bond\.pts$/.test(p)) && deep.d.some((p) => /^fr\./.test(p)), 'the save before and after differs only in Bond and S.fr: ' + JSON.stringify(deep && deep.d));
  await t.ctx.close();

  sec('17. phones 390x844 and 360x740: the friend\'s yard fits, the bar stays, Map goes home');
  for (const [w, h, tag] of [[390, 844, '390'], [360, 740, '360']]) {
    await start(t, { vw: w, vh: h });
    await t.until(() => document.documentElement.dataset.layout === 'phone', null, 4000);
    await befriend(t, ['DOG-4K7PM']);
    await t.p.click(`.fr-row[data-fid="${SUNNY}"] [data-fr="visit"]`);
    ok(await t.until(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden, null, 5000), tag + ': Visit opens the friend\'s yard');
    await t.p.waitForTimeout(400);
    const L = await sceneLayout(t);
    ok(!L.side && !L.bad.length, tag + ' the chip, the buttons and the dogs fit, nothing under the bar: ' + JSON.stringify(L));
    ok(L.bar.join(',') === 'caremenu,walk,map,more', tag + ': the phone bar stays (Care / Walk / Map / More): ' + L.bar.join(','));
    await shot(t, 'visit_' + tag);
    const tapAt = await ev(() => { const el = [...document.querySelectorAll('#frDogs .frdog:not(.fr-mine) .fr-hit')].map((e) => e.getBoundingClientRect()).find((r) => r.width > 0); return el ? { x: el.left + el.width / 2, y: el.top + el.height / 2 } : null; });
    if (tapAt) await t.p.mouse.click(tapAt.x, tapAt.y);
    ok(!!tapAt && (await t.until((fid) => window.__frSrv.sent.some((s) => s.kind === 'pet' && s.fid === fid), SUNNY, 4000)), tag + ': a tap on their dog pets it');
    ok(await ev(() => { const el = document.activeElement, d = el && el.closest && el.closest('.frdog'); return !d || getComputedStyle(d).outlineStyle === 'none'; }), tag + ': no focus rectangle round the dog after a tap (phone review 4)');
    const cam0 = await ev(() => window.__paw.fr.cam());
    ok(cam0.w < 1000 && Math.abs(cam0.x - cam0.home) < 1 && (await t.p.locator('#phPeek').count()) === 1, tag + ': the camera rests on the house, with a look-around button: ' + JSON.stringify(cam0));
    await t.p.click('#phPeek');
    ok(await t.until(() => { const g = document.querySelector('#frDecorG [data-frdecor="Bird Bath"]'); if (!g || window.__paw.fr.cam().x > 1) return false; const r = g.getBoundingClientRect(); return r.right > 4 && r.left < window.innerWidth; }, null, 3000), tag + ': the button shows the rest of their yard: the Bird Bath at x 24 is on screen (phone review 3)');
    await t.p.click('#phPeek');
    ok(await t.until((h) => Math.abs(window.__paw.fr.cam().x - h) < 1, cam0.home, 3000), tag + ': and back to the house');
    // part 4 on the phone: "Send a gift" in the yard opens the sheet, which fits; the send brings back the yard with "Sent today"
    await ev(() => { const inv = window.__paw.S.inv; inv.food = { 'Basic Kibble': 3, 'Bone-shaped Biscuit': 2, Pupcake: 1, 'Carrot Sticks': 4, 'Wild Berries': 1, "Duck's Picnic Sandwich": 1 }; inv.seeds = { carrot: 2, peas: 1 }; inv.crops = { pumpkin: [1, 0, 0], carrot: [0, 2, 0] }; });
    await t.p.click('#frGiftBtn');
    ok(await t.until(() => document.querySelectorAll('#modal [data-frgift]').length === 10, null, 3000), tag + ': "Send a gift" in the yard opens the sheet (10 items in the bag)');
    const gLay = await layout(t);
    ok(!gLay.side && !gLay.bad.length, tag + ' the gift sheet fits, 44 px taps, nothing under the bar: ' + JSON.stringify(gLay));
    await shot(t, 'gift_sheet_' + tag);
    await t.p.click('#modal [data-frgift="0"]');
    await t.p.waitForSelector('#modal .confirm .yes');
    const cLay = await layout(t);
    ok(!cLay.side && !cLay.bad.length, tag + ' the confirm fits: ' + JSON.stringify(cLay));
    await t.p.click('#modal .confirm .yes');
    ok(await t.waitToast(/Your gift is on its way!/, 4000) && (await t.until(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden && (document.getElementById('frGiftBtn') || {}).textContent === 'Sent today', null, 3000)), tag + ': sent from the yard; the yard\'s button reads "Sent today"');
    await t.p.waitForTimeout(1800); // the wrap has floated off
    const L2 = await sceneLayout(t);
    ok(!L2.side && !L2.bad.length, tag + ' the three buttons still fit after the send: ' + JSON.stringify(L2));
    await shot(t, 'visit_sent_' + tag);
    await t.p.click('#bar .act[data-act="map"]');
    ok(await t.until(() => window.__paw.mode === 'yard', null, 4000), tag + ': Map goes home');
    // the gift letter (fr_gift_3, from the start) in the mailbox
    await t.until(() => (window.__paw.S.mail || []).some((m) => m && m.id === 'fr_gift_3'), null, 4000);
    await ev(() => window.__paw.openMailbox('fr_gift_3'));
    await t.p.waitForSelector('.panel.mailbox .letter [data-mbget]');
    const lt = await ev(() => ({ title: (document.querySelector('.letter header b') || {}).textContent, wrap: !!document.querySelector('.letter .fr-letterwrap svg'), gift: (document.querySelector('.letter .mb-gift') || {}).textContent }));
    ok(lt.title === 'A gift from Sunny Biscuit!' && lt.wrap && lt.gift === '1 × Basic Kibble',tag + ': the gift letter: title, the wrap doodle and the item with Collect: ' + JSON.stringify(lt));
    await ev(() => document.querySelector('.letter [data-mbget]').scrollIntoView({ block: 'nearest', behavior: 'instant' })); await t.p.waitForTimeout(600); // the sheet scrolls smoothly
    const col = await ev(() => { const el = document.querySelector('.letter [data-mbget]'); const b = el.getBoundingClientRect(), top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { w: Math.round(b.width), h: Math.round(b.height), l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), iw: window.innerWidth, ih: window.innerHeight, top: top ? (top.id || top.className || top.tagName) + '' : null, on: !!top && el.contains(top) }; });
    ok(col.w >= 43.5 && col.h >= 43.5 && col.l >= -1 && col.r <= col.iw + 1 && col.b <= col.ih && col.on, tag + ': Collect is 44 px, on screen and on top: ' + JSON.stringify(col));
    await shot(t, 'gift_letter_' + tag);
    await t.ctx.close();
  }

  await greetPart(t); // part 3b: the greeting on a visit (owner, 2 Nov 2026)

  /* ---------------- part 4: gifts (V219.md section 5) ---------------- */
  sec('18. FR_GIFTS is dog-safe by the game\'s own tables; the sheet lists only what is in the bag');
  await start(t);
  await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
  const refs = await ev(() => window.__paw.fr.giftRefs()), people = await ev(() => window.__paw.fr.people());
  const BAD = /chocolate|cocoa|grape|raisin|onion|garlic|leek|chive|xylitol|gum|macadamia|avocado|coffee|caffeine|alcohol|wine|beer|nutmeg|cherry|mushroom|rhubarb|tomato leaf|yew|holly|mistletoe|bone$/i;
  ok(refs.length === 49 && refs.every((g) => ['food', 'seeds', 'crops'].includes(g.cat)), 'every FR_GIFTS entry is a FOOD row, a walk treasure food, a seed packet or a crop: ' + JSON.stringify(refs.filter((g) => !g.cat)));
  ok(refs.every((g) => !people.includes(g.n) && !BAD.test(g.n)), 'none is a people food the kitchen bounces (' + people.join(', ') + ') or anything toxic to dogs: ' + JSON.stringify(refs.filter((g) => people.includes(g.n) || BAD.test(g.n)).map((g) => g.n)));
  await befriend(t, ['DOG-4K7PM', 'DOG-9QRST']);
  await t.until(() => (window.__paw.S.mail || []).some((m) => m && m.id === 'fr_gift_3'), null, 5000);
  const kib = await ev(() => { const S = window.__paw.S; S.inv.food = { 'Basic Kibble': 2, 'Golden Bone': 1, 'Fresh Water': 3, 'Pumpkin Purée': 0 }; S.inv.seeds = { carrot: 1, peas: 0 }; S.inv.crops = { pumpkin: [0, 2, 0], peas: [0, 0, 0] }; S.inv.pantry = { oats: 4 }; return window.__paw.fr.lists().gifts; });
  await ev(() => { window.__paw.fr.open(); });
  await t.until(() => !!document.querySelector(`.fr-row[data-fid="${'sunnybiscuitxxxxxxxxxx'}"] [data-fr="gift"]`), null, 5000);
  ok(await ev(() => [...document.querySelectorAll('[data-fr="gift"]')].every((b) => b.textContent === 'Gift' && !b.hasAttribute('aria-disabled'))), 'before a send, each row\'s button reads "Gift"');
  await t.p.click(`.fr-row[data-fid="${SUNNY}"] [data-fr="gift"]`);
  await t.until(() => !!document.querySelector('#modal .fr-giftsheet'), null, 3000);
  const cells = await ev(() => [...document.querySelectorAll('#modal [data-frgift]')].map((b) => ({ i: +b.dataset.frgift, name: b.querySelector('.fr-gnm').textContent, n: b.querySelector('.fr-gn').textContent, icon: !!b.querySelector('.fr-gic svg') })));
  const want = [[kib.indexOf('Basic Kibble'), 'Basic Kibble', '×2'], [kib.indexOf('Carrot Seeds'), 'Carrot Seeds', '×1'], [kib.indexOf('Pumpkin'), 'Pumpkin', '×2']];
  ok(JSON.stringify(cells.map((c) => [c.i, c.name, c.n])) === JSON.stringify(want) && cells.every((c) => c.icon), 'only the FR_GIFTS items I own, with icons and counts (no Golden Bone, Fresh Water, empty rows or pantry): ' + JSON.stringify(cells));
  const sheetLay = await layout(t);
  ok(!sheetLay.side && !sheetLay.bad.filter((b) => !/^small /.test(b)).length, 'the gift sheet fits at 1280 (the desktop stage is scaled, so only the edges count): ' + JSON.stringify(sheetLay));
  await shot(t, 'gift_sheet_1280');
  await t.closeX(); await t.modalGone();
  await ev(() => { const S = window.__paw.S; S.inv.food = { 'Golden Bone': 1 }; S.inv.seeds = {}; S.inv.crops = {}; });
  await ev((fid) => window.__paw.fr.giftSheet(fid), SUNNY);
  ok(await t.until(() => (document.querySelector('#modal .fr-gempty') || {}).textContent === 'Your bag has nothing to give yet. Treats, seeds and flowers can be gifts.' && !document.querySelector('#modal [data-frgift]'), null, 3000), 'an empty bag: "Your bag has nothing to give yet. Treats, seeds and flowers can be gifts."');
  await t.closeX(); await t.modalGone();
  await ev(() => { const S = window.__paw.S; S.inv.food = { 'Basic Kibble': 2, 'Carrot Sticks': 1 }; S.inv.seeds = { carrot: 1 }; S.inv.crops = { pumpkin: [0, 2, 0] }; });

  sec('19. a failed send (network error, then limit) leaves the bag and the save as they were');
  const snapFn = () => { const P = window.__paw, root = P.S, ALIAS = ['dog', 'stats', 'bond', 'outfit', 'potty', 'sleeping', 'dishLog', 'buff', 'glowUntil', 'pupUntil', 'tricks']; return JSON.parse(JSON.stringify(root, function (k, v) { return this === root && ALIAS.includes(k) ? undefined : v; })); };
  const diffFn = function diffFn(a, b, at, out) { if (JSON.stringify(a) === JSON.stringify(b)) return out; if (!a || !b || typeof a !== 'object' || typeof b !== 'object') { out.push(at); return out; } new Set(Object.keys(a).concat(Object.keys(b))).forEach((k) => diffFn(a[k], b[k], at ? at + '.' + k : k, out)); return out; };
  await ev((s) => { window.__frSnap = new Function('return (' + s + ')')(); }, snapFn.toString());
  await ev((s) => { window.__frDiff = new Function('return (' + s + ')')(); }, diffFn.toString());
  // through the sheet: the confirm, then a network error
  await ev(() => { window.__frSrv.failSend = true; window.__toasts.length = 0; });
  await ev((fid) => window.__paw.fr.giftSheet(fid), SUNNY);
  await t.until(() => !!document.querySelector('#modal [data-frgift="0"]'), null, 3000);
  const s0 = await ev(() => window.__frSrv.sends || 0);
  await t.p.click('#modal [data-frgift="0"]');
  ok(await t.until(() => (document.querySelector('#modal .confirm p') || {}).textContent === 'Send 1 Basic Kibble to Sunny Biscuit?', null, 3000), 'the confirm: "Send 1 Basic Kibble to Sunny Biscuit?"');
  await t.p.click('#modal .confirm .yes');
  ok(await t.waitToast(/internet connection/, 4000), 'a network error: the offline line');
  const net = await ev((n) => ({ sends: (window.__frSrv.sends || 0) - n, kib: window.__paw.S.inv.food['Basic Kibble'], gift: window.__paw.S.fr.gift, sheet: !!document.querySelector('#modal .fr-giftsheet') }), s0);
  ok(net.sends === 1 && net.kib === 2 && net.gift === false && net.sheet, 'the send went out once; the bag keeps 2 Basic Kibble, today\'s gift is not used, the sheet stays: ' + JSON.stringify(net));
  await t.closeX(); await t.modalGone();
  // the deep compare, in one page call (a game minute is one real second): retried when the clock ticks between the two snapshots
  const netD = await ev(async (fid) => {
    for (let k = 0; k < 8; k++) {
      const before = window.__frSnap(), r = await window.__paw.fr.sendGift(fid, 0), after = window.__frSnap();
      if (before.gameMin !== after.gameMin) continue;
      return { r, d: window.__frDiff(before, after, '', []) };
    }
    return { err: 'the clock ticked in every try' };
  }, SUNNY);
  ok(!netD.err && netD.r === false && netD.d.length === 0, 'deep compare: a send that fails on the network changes nothing in the save: ' + JSON.stringify(netD));
  await ev(() => { window.__frSrv.failSend = false; });

  sec('20. the send: only on ok does 1 leave the bag; the wrap, the toast, then "Sent today" everywhere (one gift a day in all)');
  await ev(() => { window.__paw.fr.open(); window.__toasts.length = 0; });
  await t.until((fid) => !!document.querySelector(`.fr-row[data-fid="${fid}"] [data-fr="gift"]`), SUNNY, 5000);
  await t.p.click(`.fr-row[data-fid="${SUNNY}"] [data-fr="gift"]`);
  await t.until(() => !!document.querySelector('#modal [data-frgift]'), null, 3000);
  const pumpkinI = kib.indexOf('Pumpkin');
  await t.p.click(`#modal [data-frgift="${pumpkinI}"]`);
  await t.p.click('#modal .confirm .yes');
  ok(await t.until(() => !!document.querySelector('#stage .fr-wrapfx svg'), null, 3000), 'the crayon wrap pops up (PawArt.FRIENDS.wrap)');
  ok(await t.waitToast(/Your gift is on its way!/, 4000), 'the toast "Your gift is on its way!"');
  const sentG = await ev(() => window.__frSrv.sent.filter((s) => s.kind === 'gift'));
  ok(sentG.length === 1 && sentG[0].fid === SUNNY && JSON.stringify(sentG[0].data) === JSON.stringify({ i: pumpkinI, n: 1 }), 'POST /friends/send { kind: gift, data: { i, n: 1 } }: ' + JSON.stringify(sentG));
  const after = await ev(() => ({ crop: window.__paw.S.inv.crops.pumpkin, kib: window.__paw.S.inv.food['Basic Kibble'], gift: window.__paw.S.fr.gift }));
  ok(JSON.stringify(after.crop) === '[0,1,0]' && after.kib === 2 && after.gift === true, 'on ok one Pumpkin left the bag (2 -> 1), nothing else, and S.fr.gift is true: ' + JSON.stringify(after));
  ok(await t.until(() => !!document.querySelector('#modal .fr-sheet') && [...document.querySelectorAll('[data-fr="gift"]')].length === 2 && [...document.querySelectorAll('[data-fr="gift"]')].every((b) => b.textContent === 'Sent today' && b.getAttribute('aria-disabled') === 'true'), null, 3000), 'back on the list: every friend\'s Gift button reads "Sent today"');
  ok(await ev((fid) => !!document.querySelector(`.fr-row[data-fid="${fid}"] .fr-doo.on svg`) && window.__paw.fr.sent(fid, 'gift'), SUNNY), 'Sunny Biscuit\'s gift doodle fills in');
  await shot(t, 'gift_sent_list_1280');
  await ev(() => { window.__toasts.length = 0; });
  await t.p.click(`.fr-row[data-fid="${FERN}"] [data-fr="gift"]`, { force: true });
  ok(await t.waitToast(/You've sent today's gift\. You can send another tomorrow\./, 3000) && (await ev(() => !document.querySelector('#modal .fr-giftsheet'))), 'a second friend: no sheet, "You\'ve sent today\'s gift. You can send another tomorrow."');
  const n0 = await ev(() => window.__frSrv.sends);
  ok(await ev((fid) => window.__paw.fr.sendGift(fid, 0).then((r) => r === false && window.__paw.S.inv.food['Basic Kibble'] === 2), FERN) && (await ev((n) => window.__frSrv.sends === n, n0)), 'one gift a day in all: a second send asks nothing and keeps the bag');
  await t.closeX(); await t.modalGone();
  await ev((fid) => window.__paw.fr.visit(fid), FERN);
  ok(await t.until(() => window.__paw.mode === 'fryard' && (document.getElementById('frGiftBtn') || {}).textContent === 'Sent today', null, 4000), 'in a friend\'s yard the button reads "Sent today" too');
  await t.p.click('#frHomeBtn');
  await t.until(() => window.__paw.mode === 'yard', null, 4000);

  sec('21. limit (today\'s gift went out from another device): the bag stays, the buttons read "Sent today"');
  await ev(() => { window.__toasts.length = 0; });
  const limR = await ev(async (fid) => {
    const S = window.__paw.S;
    for (let k = 0; k < 8; k++) {
      S.fr.gift = false; S.fr.cache.friends.forEach((f) => { f.sent.gift = false; }); // as if today's gift went out from another device
      const n = window.__frSrv.sends, before = window.__frSnap(), r = await window.__paw.fr.sendGift(fid, 0), after = window.__frSnap();
      if (before.gameMin !== after.gameMin) continue;
      return { r, d: window.__frDiff(before, after, '', []), kib: S.inv.food['Basic Kibble'], gift: S.fr.gift, sends: window.__frSrv.sends - n, sent: window.__frSrv.sent.filter((s) => s.kind === 'gift').length };
    }
    return { err: 'the clock ticked in every try' };
  }, FERN);
  ok(!limR.err && limR.r === false && limR.sends === 1 && limR.sent === 1, 'the Worker answers limit: ' + JSON.stringify(limR));
  ok(await t.waitToast(/You've sent today's gift\. You can send another tomorrow\./, 3000), 'the limit line');
  ok(limR.kib === 2 && limR.gift === true, 'on limit the bag keeps its 2 Basic Kibble, and today\'s gift counts as used');
  ok(!limR.err && limR.d.length === 1 && limR.d[0] === 'fr.gift', 'deep compare: limit changes only S.fr.gift, nothing in the bag: ' + JSON.stringify(limR.d));

  sec('22. receiving: at most 5 gift letters a day, the rest wait; a claim that fails never gives twice; Collect adds the item');
  const g0 = await ev(() => window.__paw.S.fr.gotGifts);
  await ev(() => { const srv = window.__frSrv, F = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22), L = window.__paw.fr.lists().gifts; [['Carrot Sticks', 3, 4], ['Pea Seeds', 5, 6], ['Pumpkin', 7, 8], ['Frozen Pupsicle', 9, 10], ['Pup Kinton', 11, 12], ['Blueberries', 13, 14], ['Snow Day Stew', 15, 16]].forEach(([n, a, b], k) => srv.events.push({ id: 60 + k, from: { fid: F('gifter' + k), name: [a, b] }, kind: 'gift', data: { i: L.indexOf(n), n: 1 }, day: '2026-11-02', claimed: false })); srv.events.push({ id: 70, from: { fid: F('newer'), name: [1, 1] }, kind: 'gift', data: { i: 999, n: 1 }, day: '2026-11-02', claimed: false }); });
  await ev(() => window.__paw.fr.inbox());
  const R1 = await ev(() => ({ letters: window.__paw.S.mail.filter((m) => m && /^fr_gift_(6\d|70)$/.test(m.id)).map((m) => m.id).sort(), claimed: window.__frSrv.events.filter((e) => e.id >= 60).filter((e) => e.claimed).map((e) => e.id), got: window.__paw.S.fr.gotGifts, badge: window.__paw.fr.badge() }));
  const room = 5 - g0, wantIds = [60, 61, 62, 63, 64, 65, 66].slice(0, room);
  ok(JSON.stringify(R1.letters) === JSON.stringify(wantIds.map((i) => 'fr_gift_' + i).sort()) && JSON.stringify(R1.claimed) === JSON.stringify(wantIds) && R1.got === 5, 'only ' + room + ' more letters today (5 in all), only those are claimed: ' + JSON.stringify(R1));
  ok(R1.badge === (7 - room) + 1, 'the rest stay unclaimed (and the newer item; part 5 claims the walk), on the badge: ' + R1.badge);
  // tomorrow: the waiting gifts become letters
  await ev(() => { window.__paw.S.fr.day = '1999-01-01'; });
  await ev(() => window.__paw.fr.inbox());
  const R2 = await ev(() => ({ letters: window.__paw.S.mail.filter((m) => m && /^fr_gift_(6\d|70)$/.test(m.id)).map((m) => m.id).sort(), got: window.__paw.S.fr.gotGifts, claimed: window.__frSrv.events.filter((e) => e.id >= 60 && e.claimed).map((e) => e.id), newer: window.__frSrv.events.find((e) => e.id === 70).claimed }));
  ok(R2.got === 7 - room && R2.letters.length === 7 && R2.claimed.length === 7 && !R2.newer, 'the next day the waiting gifts become letters; an item this copy does not know yet stays unclaimed: ' + JSON.stringify(R2));
  // a claim that did not reach the Worker: the event comes back. Even with its letter gone (an old read letter can be tidied away), it gives nothing twice
  const twice0 = await ev(() => { const srv = window.__frSrv, S = window.__paw.S; srv.events.find((e) => e.id === 60).claimed = false; S.mail = S.mail.filter((m) => m.id !== 'fr_gift_60'); srv.failClaim = true; return { food: JSON.stringify(S.inv.food), got: S.fr.gotGifts, n: S.mail.filter((m) => /^fr_gift_/.test(m.id)).length }; });
  await ev(() => window.__paw.fr.inbox());
  const twice = await ev(() => { const S = window.__paw.S; return { food: JSON.stringify(S.inv.food), got: S.fr.gotGifts, n: S.mail.filter((m) => /^fr_gift_/.test(m.id)).length, again: S.mail.some((m) => m.id === 'fr_gift_60') }; });
  ok(!twice.again && twice.n === twice0.n && twice.got === twice0.got && twice.food === twice0.food, 'a gift event that comes back after a failed claim makes no second letter (S.fr.gotIds): ' + JSON.stringify({ twice0, twice }));
  await ev(() => { window.__frSrv.failClaim = false; });
  await ev(() => window.__paw.fr.inbox());
  ok(await ev(() => window.__frSrv.events.find((e) => e.id === 60).claimed && !window.__paw.S.mail.some((m) => m.id === 'fr_gift_60')), 'the next look claims it again, still without a letter');
  // Collect, unchanged: a seed packet (by the button), a crop and a food
  const c0 = await ev(() => { const S = window.__paw.S; return { pup: S.inv.food['Frozen Pupsicle'] || 0, peas: S.inv.seeds.peas || 0, pumpkin: (S.inv.crops.pumpkin || [0, 0, 0]).slice() }; });
  await ev(() => window.__paw.openMailbox('fr_gift_61'));
  await t.p.waitForSelector('.panel.mailbox .letter [data-mbget]');
  const lt1 = await ev(() => ({ title: document.querySelector('.letter header b').textContent, gift: document.querySelector('.letter .mb-gift').textContent, wrap: !!document.querySelector('.letter .fr-letterwrap svg') }));
  ok(/^A gift from .+!$/.test(lt1.title) && lt1.gift === '1 × Pea Seeds' && lt1.wrap,'the seed letter: the friend name, the wrap doodle and "1 × Pea Seeds": ' + JSON.stringify(lt1));
  await shot(t, 'gift_letter_1280');
  await t.p.click('.letter [data-mbget]');
  await t.p.waitForSelector('.letter .mb-got');
  await t.closeX(); await t.modalGone();
  await ev(() => { window.__paw.mbCollect(['fr_gift_62', 'fr_gift_63']); });
  const c1 = await ev(() => { const S = window.__paw.S; return { pup: S.inv.food['Frozen Pupsicle'] || 0, peas: S.inv.seeds.peas || 0, pumpkin: (S.inv.crops.pumpkin || [0, 0, 0]).slice() }; });
  ok(c1.peas === c0.peas + 1 && c1.pumpkin[0] === c0.pumpkin[0] + 1 && c1.pumpkin[1] === c0.pumpkin[1] && c1.pup === c0.pup + 1, 'Collect adds the item: a seed packet (+1), a crop (+1 Pumpkin at 1 star), a food (+1 Frozen Pupsicle): ' + JSON.stringify({ c0, c1 }));
  ok(await ev(() => window.__paw.mbCollect(['fr_gift_61', 'fr_gift_62', 'fr_gift_63']) === '' && window.__paw.S.mail.filter((m) => /^fr_gift_6[123]$/.test(m.id)).every((m) => m.gift.claimed)), 'collecting again gives nothing');
  await t.ctx.close();

  await officialPart(t);
  await walkPart(t);
}, { timeout: 420000 }); // fix batch: ~250 s now (Remove's undo window, the visit pan); the runner allows 600

/* ---------------- v2.22.3: the official Friends account (V219.md "Official accounts") ---------------- */
async function officialPart(t) {
  const { ok, sec, ev } = t;
  sec('22b. the official account: added past 50 normal friends, a crayon star and "Official" on its row only, the cap unchanged, remove works');
  await start(t);
  await befriend(t, ['DOG-4K7PM']);
  // 49 more normal friends: 50 in all
  await ev(() => { const S = window.__frSrv; for (let i = 0; i < 49; i++) S.friends.push({ fid: ('filler' + i + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22), name: [i % 10, (i * 3) % 10], dogs: [], seen: 'older', sent: { pet: false, note: false, gift: false, walk: false } }); });
  await ev(() => window.__paw.fr.open());
  await t.until(() => document.querySelectorAll('.fr-row').length === 50, null, 8000);
  await ev(() => { window.__toasts.length = 0; '9QRST'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.waitToast(/50 friends/, 4000), 'official: a 51st normal friend is still full');
  await ev(() => { window.__toasts.length = 0; 'K3APZ'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.waitToast(/is your friend now/, 5000), 'official: with 50 friends, the official account can still be added');
  ok(await t.until(() => document.querySelectorAll('.fr-row').length === 51, null, 6000), 'official: 51 rows on the list');
  const mark = await ev(() => {
    const rows = [...document.querySelectorAll('.fr-row')], off = rows.filter((r) => r.querySelector('.fr-ofc'));
    const r = off[0], m = r && r.querySelector('.fr-ofc'), b = m && m.getBoundingClientRect(), nb = r && r.querySelector('.fr-nm').getBoundingClientRect();
    return { n: off.length, fid: r && r.dataset.fid, txt: m && m.textContent, star: !!(m && m.querySelector('svg path[fill]')), inName: !!(b && nb && b.left >= nb.left - 1 && b.right <= nb.right + 1), cls: !!(r && r.classList.contains('fr-isofc')) };
  });
  ok(mark.n === 1 && mark.fid === 'officialyardxxxxxxxxxx' && mark.txt === 'Official' && mark.star && mark.inName && mark.cls, 'official: only the official row has the crayon star and "Official", inside the name: ' + JSON.stringify(mark));
  await ev(() => { document.getElementById('toasts').innerHTML = ''; document.querySelector('.fr-isofc').scrollIntoView({ block: 'center' }); });
  await shot(t, 'official_row_1280');
  ok(await ev(() => (window.__paw.S.fr.cache.friends.find((f) => f.fid === 'officialyardxxxxxxxxxx') || {}).official === true), 'official: the cached list keeps official: true');
  await ev(() => { window.__toasts.length = 0; '9QRST'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.waitToast(/50 friends/, 4000), 'official: the official friend does not free a normal slot either (still 50 normal: full)');
  // remove the official friend like any other
  await t.p.click('.fr-isofc [data-fr="more"]');
  await t.p.click('[data-fr="remove"]');
  ok(await t.until(() => !document.querySelector('.fr-ofc'), null, 4000), 'official: Remove takes the official row off the list');
  ok(await t.until(() => !window.__frSrv.friends.some((f) => f.official), null, 7000), 'official: and the remove reaches the Worker');
  // a phone: the row with the mark fits
  await t.ctx.close();
  for (const [w, h, tag] of [[360, 740, '360']]) {
    await start(t, { vw: w, vh: h });
    await t.until(() => document.documentElement.dataset.layout === 'phone', null, 4000);
    await befriend(t, ['DOG-K3APZ', 'DOG-4K7PM']);
    ok(await t.until(() => !!document.querySelector('.fr-ofc'), null, 4000), tag + ': the official mark shows on a phone');
    const lay = await layout(t);
    ok(!lay.side && !lay.bad.length, tag + ' official row fits: ' + JSON.stringify(lay));
    await ev(() => { document.getElementById('toasts').innerHTML = ''; document.querySelector('.fr-isofc').scrollIntoView({ block: 'center' }); });
    await shot(t, 'official_row_' + tag);
    await t.ctx.close();
  }
}

/* ---------------- part 5: walk together (V219.md section 6) ---------------- */
async function walkPart(t) {
  const { ok, sec, ev } = t;
  const SUNNY = 'sunnybiscuitxxxxxxxxxx', CLOVER = 'happycloverxxxxxxxxxxx', FERN = 'cozyfernxxxxxxxxxxxxxx';
  const spy = () => ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__frSpy) { const o = W.start.bind(W); W.start = (h, op) => { window.__opts = op; return o(h, op); }; W.__frSpy = true; } window.__paw.S.walks = 3; });
  const routes = async (k) => { await ev((k) => window.__paw.go('routes', k || undefined), k || null); await t.p.waitForSelector('#rtStart'); await t.sleep(250); };
  const rowInfo = () => ev(() => { const r = document.getElementById('frWalkRow'); if (!r) return null; return { cap: r.querySelector('.fr-walkcap').textContent, full: (r.querySelector('.fr-walkfull') || {}).textContent || '', chips: [...r.querySelectorAll('[data-frg]')].map((b) => ({ v: b.dataset.frg, on: b.getAttribute('aria-pressed') === 'true', dis: b.disabled, txt: b.textContent })) }; });
  const pick = async (v) => { await t.p.click(`#frWalkRow [data-frg="${v}"]`); await t.until((v) => { const b = document.querySelector(`#frWalkRow [data-frg="${v}"]`); return !!b && b.getAttribute('aria-pressed') === 'true'; }, v, 3000); };
  const go = async () => { await t.p.click('#rtStart'); return t.walkGate(true); };
  const fresh = () => ev(() => { const S = window.__paw.S; S.sleeping = false; if (S.daily) S.daily.play = true; /* the day's first play pays its own daily care bonus */ S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.happy = 40; d.stats.clean = 90; d.stats.hunger = 80; }); });
  const R = (o) => Object.assign({ coins: 100, happiness: 10, bond: 2, energy: 5, cleanliness: 1, early: false }, o || {});
  const snap = () => ev(() => { const S = window.__paw.S; return { coins: S.coins, bond: S.dogs.map((d) => d.bond.pts), happy: S.dogs.map((d) => Math.round(d.stats.happy)), food: JSON.stringify(S.inv.food), dogs: S.dogs.length, walks: S.fr.walks, walked: S.fr.walked.slice(), sends: window.__frSrv.sent.filter((s) => s.kind === 'walk').length }; });
  const end = async (r) => { await ev((r) => window.__opts.onEnd(r), r); return t.until(() => !!document.getElementById('resOk'), null, 8000); };
  const home = async () => { await t.p.click('#resOk'); await t.untilMode('yard'); await t.lu(); await t.until(() => document.getElementById('modal').hidden, null, 3000); };
  const modalText = () => ev(() => (document.querySelector('#modal .panel') || {}).textContent || '');
  const routeLayout = () => ev(() => {
      const iw = innerWidth, ih = innerHeight, bad = [], sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const row = document.getElementById('frWalkRow'), rr = row.getBoundingClientRect(), sc = row.querySelector('.fr-wchips');
      [...row.querySelectorAll('[data-frg]')].forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) bad.push('small ' + b.dataset.frg); });
      if (rr.left < -1 || rr.right > iw + 1) bad.push('row off the side');
      const st = document.getElementById('rtStart'); st.scrollIntoView({ block: 'nearest' }); const sr = st.getBoundingClientRect();
      if (sr.top < 0 || sr.bottom > ih || sr.height < 44) bad.push('start ' + JSON.stringify([sr.top, sr.bottom]));
      const top = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2); if (!top || !st.contains(top)) bad.push('start covered');
      const card = document.querySelector('.rt-card.cur'), cr = card.getBoundingClientRect(); if (cr.height < 120) bad.push('card squeezed ' + Math.round(cr.height)); const vp = document.getElementById('rtView').getBoundingClientRect(); if (cr.bottom > vp.bottom + 1 || cr.top < vp.top - 1) bad.push('card cut ' + JSON.stringify([cr.bottom, vp.bottom]));
      const ov = [...document.querySelectorAll('.routes > *')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0); for (let i = 1; i < ov.length; i++) if (ov[i].top < ov[i - 1].bottom - 1) bad.push('overlap ' + i);
      return { side: sw > iw + 1, scroll: sc.scrollWidth > sc.clientWidth, bad };
  });
  const walkSends = () => ev(() => window.__frSrv.sent.filter((s) => s.kind === 'walk'));

  sec('23. the walk row: hidden when Friends is off, and with no friends');
  await start(t, { mock: false, fr: false });
  await routes(); ok(await ev(() => !document.getElementById('frWalkRow')), 'Friends off: no "Walk with a friend\'s dog" row');
  await t.ctx.close();
  await start(t);
  await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
  await befriend(t, []); await t.closeX(); await t.modalGone();
  const n0 = await ev(() => ({ lists: window.__frSrv.lists || 0, day: window.__paw.S.fr.cache.day }));
  await routes(); ok(await ev(() => !document.getElementById('frWalkRow')), 'a friend id but no friends: no row');
  ok(n0.day === '' && await t.until((n) => (window.__frSrv.lists || 0) === n + 1, n0.lists, 4000) && await ev(() => /^\d{4}-\d\d-\d\d$/.test(window.__paw.S.fr.cache.day)), 'the list was never fetched today: the route screen fetches it once (S.fr.cache.day): ' + JSON.stringify(n0));
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');

  sec('24. the row lists the friends\' snapshot dogs (the cached list, fetched at most once a day); "Just us" is the default');
  await befriend(t, ['DOG-4K7PM', 'DOG-9QRST', 'DOG-7HJKN']); await t.closeX(); await t.modalGone();
  await spy();
  const l0 = await ev(() => window.__frSrv.lists || 0);
  await routes();
  const row = await rowInfo(), dogs = await ev(() => window.__paw.fr.walkDogs());
  ok(!!row && row.cap === "Walk with a friend's dog" && row.chips.length === 4 && row.chips[0].v === '' && row.chips[0].on && /Just us/.test(row.chips[0].txt), 'the row: "Just us" (picked) and three dogs: ' + JSON.stringify(row));
  ok(dogs.length === 3 && dogs.filter((d) => d.fid === SUNNY).map((d) => d.dog).join() === '0,1' && dogs.filter((d) => d.fid === FERN).length === 1 && !dogs.some((d) => d.fid === CLOVER), 'Sunny Biscuit\'s two dogs and Cozy Fern\'s one; Happy Clover has no snapshot yet: ' + JSON.stringify(dogs));
  ok(row.chips.slice(1).every((c) => /Sunny Biscuit|Cozy Fern/.test(c.txt)) && await ev(() => document.querySelectorAll('#frWalkRow [data-frg]:not([data-frg=""]) .cr-head svg').length === 3), 'each dog: a crayon head and its friend\'s name');
  ok(await ev(() => window.__paw.S.fr.guest === null), 'S.fr.guest is null ("Just us")');
  ok((await ev(() => window.__frSrv.lists || 0)) === l0, 'the list was fetched today already (the Friends sheet): no new fetch');
  await ev(() => { window.__paw.S.fr.cache.day = '1999-01-01'; window.__paw.go('yard'); }); await routes();
  await ev(() => window.__paw.go('yard')); await routes(); await t.sleep(300);
  ok((await ev(() => window.__frSrv.lists || 0)) === l0, 'the route screen asked once today already: no second fetch that day, even with an old list');

  sec('25. leaving the walk (abandoned) forgets the pick, pays nothing, sends nothing');
  await pick(SUNNY + ':0');
  ok(JSON.stringify(await ev(() => window.__paw.S.fr.guest)) === JSON.stringify({ fid: SUNNY, dog: 0 }), 'the pick is stored as S.fr.guest { fid, dog }');
  await pick('');
  ok(await ev(() => window.__paw.S.fr.guest === null), '"Just us" clears it');
  await pick(SUNNY + ':0');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  ok(await ev(() => window.__paw.S.fr.guest === null), 'back home from the route screen: the pick is gone (a run gate walk never takes an old pick)');
  await fresh(); await routes(); await pick(SUNNY + ':0');
  const a0 = await snap();
  ok(await go(), 'the runner starts with the guest');
  ok(await ev(() => !!window.__paw.fr.walkGuest()), 'the walk holds the guest');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  const a1 = await snap();
  ok(a1.coins === a0.coins && a1.sends === a0.sends && a1.walks === 0 && !a1.walked.length && await ev(() => window.__paw.S.fr.guest === null && !window.__paw.fr.walkGuest()), 'a walk left without its end: no coins, no event, S.fr.guest cleared: ' + JSON.stringify({ a0, a1 }));

  sec('26. the guest walks along: one o.pack follower with friend: true, drawn with the ribbon; the mods rule holds');
  await fresh(); await routes(); await pick(SUNNY + ':1');
  await ev(() => { document.getElementById('toasts').innerHTML = ''; }); await shot(t, 'walk_row_1280');
  ok(await go(), 'the runner starts');
  const o1 = await ev(() => ({ n: window.__opts.pack.length, last: Object.assign({}, window.__opts.pack[window.__opts.pack.length - 1], { ribbon: !!window.__opts.pack[window.__opts.pack.length - 1].ribbon }), friends: window.__opts.pack.filter((l) => l.friend).length, keys: Object.keys(window.__opts) }));
  const want1 = await ev(() => window.__paw.fr.walkDogs().find((d) => d.dog === 1).key);
  ok(o1.n === 1 && o1.friends === 1 && o1.last.friend === true && o1.last.key === want1 && o1.last.ribbon && o1.last.size > 0 && o1.last.outfit && typeof o1.last.name === 'string', 'o.pack holds the guest: friend: true, its card look (key, outfit, coat, size) and the ribbon: ' + JSON.stringify(o1.last).slice(0, 300));
  const rib = await ev(() => { const f = document.querySelector('.pw-fol.pw-friend'); if (!f) return null; const on = f.querySelector('.pw-pose.on'), r = on && on.querySelector('.pw-rib svg'), fb = f.getBoundingClientRect(), rb = r && r.getBoundingClientRect(), st = document.querySelector('.pw-stage').getBoundingClientRect();
    return { fol: document.querySelectorAll('.pw-fol').length, ribs: f.querySelectorAll('.pw-rib svg').length, rib: !!r && rb.width > 8, inside: !!rb && rb.left >= fb.left && rb.right <= fb.right && rb.top >= fb.top - 4 && rb.bottom <= fb.bottom, onStage: fb.left >= st.left - 1 && fb.right <= st.right + 1, leader: !document.querySelector('.pw-dog:not(.pw-fol) .pw-rib') }; });
  ok(rib && rib.fol === 1 && rib.ribs === 5 && rib.rib && rib.inside && rib.onStage && rib.leader, 'the runner draws one follower, the friend, with the ribbon in each of its 5 poses (v2.19.1: crouch too), on the dog, on the stage; the leader wears none: ' + JSON.stringify(rib));
  await shot(t, 'walk_guest_1280');
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'mods', 'walkrun.js'), 'utf8');
  ok(!/localStorage|sessionStorage|__paw|pawhaven_/.test(src), 'mods/walkrun.js reads no storage and no game state (everything comes through o)');

  sec('27. the end: +10 coins (before BOOST), the summary line, one walk event { dog, mine, t }; the guest earns nothing as one of mine');
  const b0 = await snap();
  ok(await end(R({ treasure: { name: 'Wild Berries', label: 'Wild Berries', kind: 'food', dup: false } })), 'the results sheet');
  const b1 = await snap(), txt1 = await modalText(), name1 = await ev(() => window.__paw.fr.walkDogs().find((d) => d.fid === 'sunnybiscuitxxxxxxxxxx' && d.dog === 1).name);
  ok(b1.coins - b0.coins === 200 + 20, 'coins: the walk\'s 100 and the friend walk\'s 10, both doubled by the prototype BOOST, no pack bonus for the guest: +' + (b1.coins - b0.coins));
  ok(txt1.includes(`Walked with Sunny Biscuit's ${name1}: +20`) && !/walked along/.test(txt1), 'the summary line "Walked with Sunny Biscuit\'s ' + name1 + ': +20", and no pack line');
  await t.until(() => window.__frSrv.sent.some((s) => s.kind === 'walk'), null, 4000);
  const s1 = await walkSends(), gifts = await ev(() => window.__paw.fr.lists().gifts);
  ok(s1.length === 1 && s1[0].fid === SUNNY && s1[0].data.dog === 1 && s1[0].data.t === gifts.indexOf('Wild Berries') && s1[0].data.mine && s1[0].data.mine.b >= 0 && !('name' in s1[0].data.mine) && Object.keys(s1[0].data).sort().join() === 'dog,mine,t', 'one walk event: { dog: 1, mine: my leader as a card dog, t: Wild Berries in FR_GIFTS }: ' + JSON.stringify(s1));
  ok(b1.walks === 1 && JSON.stringify(b1.walked) === JSON.stringify([SUNNY]) && await ev(() => window.__paw.S.fr.guest === null && !window.__paw.fr.walkGuest()) && b1.dogs === b0.dogs && b1.food === b0.food, 'S.fr.walks 1, Sunny walked today, S.fr.guest cleared, no new dog, no food: ' + JSON.stringify(b1));
  const guestGain = { bond: b1.bond[0] - b0.bond[0], happy: b1.happy[0] - b0.happy[0] };
  await home();

  sec('28. a repeat walk with the same friend pays and sends nothing; a second friend pays; a lone walk gives the same Bond and stats');
  await fresh(); await routes(); await pick(SUNNY + ':0'); await go();
  const c0 = await snap(); await end(R()); const c1 = await snap(), txt2 = await modalText();
  ok(c1.coins - c0.coins === 200 && /Walked with Sunny Biscuit's Mochi\./.test(txt2) && !/Walked with Sunny Biscuit's Mochi:/.test(txt2), 'same friend again: the walk\'s pay only, the line without coins: ' + (c1.coins - c0.coins));
  await t.sleep(400);
  ok((await walkSends()).length === 1 && c1.walks === 1, 'no second walk event, S.fr.walks still 1');
  await home();
  await fresh(); await routes(); await pick(FERN + ':0'); await go();
  const d0 = await snap(); await end(R()); const d1 = await snap();
  ok(d1.coins - d0.coins === 220 && d1.walks === 2 && /Walked with Cozy Fern's [^:]+: \+20/.test(await modalText()), 'a second friend: +20 (10 before BOOST), S.fr.walks 2');
  await t.until(() => window.__frSrv.sent.filter((s) => s.kind === 'walk').length === 2, null, 4000);
  ok(JSON.stringify((await walkSends())[1].data && Object.keys((await walkSends())[1].data).sort()) === JSON.stringify(['dog', 'mine']), 'no treasure: the event is { dog, mine }');
  await home();
  await fresh(); await routes();
  const e0 = await snap(); await go(); await end(R()); const e1 = await snap();
  ok(e1.coins - e0.coins === 200 && !/Walked with/.test(await modalText()), '"Just us": the walk\'s pay, no friend line');
  ok(e1.bond[0] - e0.bond[0] === guestGain.bond && e1.happy[0] - e0.happy[0] === guestGain.happy, 'the leader gets the same Bond and Happiness with or without the guest (the guest is no walker of mine): ' + JSON.stringify({ guest: guestGain, lone: { bond: e1.bond[0] - e0.bond[0], happy: e1.happy[0] - e0.happy[0] } }));
  await home();

  sec('29. the coins cap: a third friend walk that day pays nothing (2 a day, 20 coins before BOOST), but still sends its one event');
  await ev((c) => { const srv = window.__frSrv; srv.yardOf[c] = { v: 1, name: [1, 6], house: 1, season: 'autumn', dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 2 }], decor: [] }; srv.friends.find((f) => f.fid === c).dogs = srv.yardOf[c].dogs; }, CLOVER);
  await ev(() => window.__paw.fr.open()); await t.until(() => !!document.getElementById('frCard'), null, 6000); await t.closeX(); await t.modalGone();
  await fresh(); await routes(); await pick(CLOVER + ':0'); await go();
  const f0 = await snap(); await end(R()); const f1 = await snap();
  ok(f1.coins - f0.coins === 200 && f1.walks === 2 && /Walked with Happy Clover's [^:]+\./.test(await modalText()), 'the third friend: no coins (cap 2), the line without coins');
  await t.until(() => window.__frSrv.sent.filter((s) => s.kind === 'walk').length === 3, null, 4000);
  ok((await walkSends()).length === 3, 'its walk event is still sent (once per friend per day)');
  await home();

  sec('30. receiving: walk letters, a treasure as a gift to Collect, at most 3 a day; a failed claim never gives twice');
  const g0 = await ev(() => window.__paw.S.fr.gotWalks);
  ok(g0 === 1 && await ev(() => window.__paw.S.mail.some((m) => m.id === 'fr_walk_4' && m.kind === 'postcard')), 'the walk event from the first look is a letter (no treasure: just the letter)');
  const lt4 = await ev(() => { const m = window.__paw.S.mail.find((x) => x.id === 'fr_walk_4'); return { text: m.text, title: m.title, from: m.from }; });
  const lead = await ev(() => window.__paw.S.dog.name);
  ok(new RegExp('^' + lead + " went for a walk with Sunny Biscuit's .+!$").test(lt4.text) && lt4.from === 'Sunny Biscuit', 'the letter: "' + lt4.text + '"');
  await ev((g) => { const srv = window.__frSrv, F = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22), mine = { b: 4, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 5 };
    srv.events.push({ id: 80, from: { fid: F('cozyfern'), name: [2, 11] }, kind: 'walk', data: { dog: 0, mine, t: g.indexOf('Wild Berries') }, day: '2026-11-02', claimed: false });
    srv.events.push({ id: 81, from: { fid: F('happyclover'), name: [1, 6] }, kind: 'walk', data: { dog: 0, mine }, day: '2026-11-02', claimed: false });
    srv.events.push({ id: 82, from: { fid: F('walker2'), name: [3, 3] }, kind: 'walk', data: { dog: 0, mine }, day: '2026-11-02', claimed: false });
    srv.events.push({ id: 83, from: { fid: F('newer'), name: [1, 1] }, kind: 'walk', data: { dog: 0, mine, t: 999 }, day: '2026-11-02', claimed: false }); }, gifts);
  await ev(() => window.__paw.fr.inbox());
  const W1 = await ev(() => ({ letters: window.__paw.S.mail.filter((m) => /^fr_walk_8\d$/.test(m.id)).map((m) => m.id).sort(), claimed: window.__frSrv.events.filter((e) => e.id >= 80 && e.claimed).map((e) => e.id), got: window.__paw.S.fr.gotWalks, badge: window.__paw.fr.badge() }));
  ok(JSON.stringify(W1.letters) === '["fr_walk_80","fr_walk_81"]' && JSON.stringify(W1.claimed) === '[80,81]' && W1.got === 3 && W1.badge === 2, 'two more letters make 3 today; the 4th waits, and so does a treasure this copy does not know: ' + JSON.stringify(W1));
  const lt80 = await ev(() => { const m = window.__paw.S.mail.find((x) => x.id === 'fr_walk_80'); return { kind: m.kind, text: m.text, gift: m.gift, dog: !!m.frDog }; });
  ok(lt80.kind === 'gift' && new RegExp('^' + lead + " went for a walk with Cozy Fern's .+ and found Wild Berries for you!$").test(lt80.text) && lt80.gift.item === 'Wild Berries' && lt80.gift.cat === 'food' && lt80.dog, 'the treasure letter: "' + lt80.text + '", a gift to Collect');
  await ev(() => window.__paw.openMailbox('fr_walk_80'));
  await t.p.waitForSelector('.panel.mailbox .letter [data-mbget]');
  ok(await ev(() => !!document.querySelector('.letter .fr-letterdog svg')), 'the letter shows the friend\'s dog (mine, as a card dog)');
  await shot(t, 'walk_letter_1280');
  const wb0 = await ev(() => window.__paw.S.inv.food['Wild Berries'] || 0);
  await t.p.click('.letter [data-mbget]'); await t.p.waitForSelector('.letter .mb-got');
  ok((await ev(() => window.__paw.S.inv.food['Wild Berries'] || 0)) === wb0 + 1, 'Collect adds the Wild Berries');
  await t.closeX(); await t.modalGone();
  // a claim that did not reach the Worker: the event comes back, with its letter gone. It gives nothing twice
  const tw0 = await ev(() => { const srv = window.__frSrv, S = window.__paw.S; srv.events.find((e) => e.id === 81).claimed = false; S.mail = S.mail.filter((m) => m.id !== 'fr_walk_81'); srv.failClaim = true; return { got: S.fr.gotWalks, n: S.mail.filter((m) => /^fr_walk_/.test(m.id)).length }; });
  await ev(() => window.__paw.fr.inbox());
  const tw1 = await ev(() => { const S = window.__paw.S; return { got: S.fr.gotWalks, n: S.mail.filter((m) => /^fr_walk_/.test(m.id)).length, again: S.mail.some((m) => m.id === 'fr_walk_81') }; });
  ok(!tw1.again && tw1.n === tw0.n && tw1.got === tw0.got, 'a walk event back after a failed claim makes no second letter (S.fr.gotIds): ' + JSON.stringify({ tw0, tw1 }));
  await ev(() => { window.__frSrv.failClaim = false; window.__paw.S.fr.day = '1999-01-01'; });
  await ev(() => window.__paw.fr.inbox());
  const W2 = await ev(() => ({ letters: window.__paw.S.mail.filter((m) => /^fr_walk_8\d$/.test(m.id)).map((m) => m.id).sort(), got: window.__paw.S.fr.gotWalks, c83: window.__frSrv.events.find((e) => e.id === 83).claimed }));
  ok(W2.letters.includes('fr_walk_82') && W2.got === 1 && !W2.c83, 'tomorrow the waiting walk becomes a letter; the unknown treasure still waits: ' + JSON.stringify(W2));

  sec('31. a reload in the middle of a walk forgets the pick');
  await fresh(); await routes(); await pick(FERN + ':0'); await go();
  ok(await ev(() => { window.__paw.saveNow(); const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); return !!(s.fr && s.fr.guest && s.fr.guest.fid); }), 'the save holds the pick mid-walk');
  await t.reloadKeepingSave();
  await t.p.waitForSelector('#tContinue', { timeout: 15000 }); await t.p.click('#tContinue');
  await t.until(() => window.__paw && window.__paw.S && window.__paw.mode !== 'title', null, 10000);
  ok(await t.until(() => window.__paw.S.fr.guest === null, null, 4000), 'after the reload S.fr.guest is null');
  await t.ctx.close();

  sec('32. the pack maximum: a full pack disables the row ("Your pack is full today"); the guest takes one slot');
  await start(t, { mk: { packCare: true } });
  await befriend(t, ['DOG-4K7PM']); await t.closeX(); await t.modalGone();
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.addDog({ key: 'beagle', sex: 'male', months: 20 }, 'Dot'); P.S.careOff = {}; });
  await t.calm(); await fresh(); await spy();
  await routes();
  const full = await rowInfo(), packLay = await routeLayout();
  ok(!packLay.side && !packLay.bad.length, 'desktop with the pack row and the friend row: the card, the rows and Start fit, nothing overlaps: ' + JSON.stringify(packLay));
  await ev(() => { document.getElementById('toasts').innerHTML = ''; }); await shot(t, 'walk_row_full_1280');
  ok(full && full.cap === 'Your pack is full today' && full.chips.every((c) => c.dis) && full.chips[0].on && await ev(() => window.__paw.fr.walkFull()), 'four dogs walk (the most): the row says "Your pack is full today", every chip disabled: ' + JSON.stringify(full));
  await ev((f) => { window.__paw.S.fr.guest = { fid: f, dog: 0 }; }, SUNNY);
  await go();
  const o2 = await ev(() => ({ n: window.__opts.pack.length, fr: window.__opts.pack.filter((l) => l.friend).length }));
  ok(o2.n === 3 && o2.fr === 0 && await ev(() => window.__paw.S.fr.guest === null), 'a pick that does not fit is dropped: o.pack holds the 3 walkers only: ' + JSON.stringify(o2));
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  await ev(() => { const S = window.__paw.S, bun = S.dogs.find((d) => d.name === 'Bun'); S.careOff = { [bun.id]: true }; });
  await fresh(); await routes();
  const room = await rowInfo();
  ok(room && !room.full && room.chips.every((c) => !c.dis), 'one dog stays home: the row is open again');
  await pick(SUNNY + ':0'); await go();
  const o3 = await ev(() => ({ n: window.__opts.pack.length, fr: window.__opts.pack.map((l) => !!l.friend), drawn: document.querySelectorAll('.pw-fol').length, friend: document.querySelectorAll('.pw-fol.pw-friend').length }));
  ok(o3.n === 3 && JSON.stringify(o3.fr) === '[false,false,true]' && o3.drawn === 3 && o3.friend === 1, 'two walkers and the guest last: 4 dogs on the walk, never more: ' + JSON.stringify(o3));
  const h0 = await snap(); await end(R()); const h1 = await snap(), txt3 = await modalText();
  ok(h1.coins - h0.coins === 220 + 20, 'coins: the walk with the pack bonus (110 x 2) and the friend walk (10 x 2): +' + (h1.coins - h0.coins));
  ok(/Pip and Dot walked along|Dot and Pip walked along/.test(txt3) && !/Sunny|Biscuit/.test((txt3.match(/[^.]*walked along[^.]*\./) || [''])[0]) && h1.bond.filter((b, i) => b > h0.bond[i]).length === 3, 'the pack line names my two walkers only; Bond for my three walkers, never the guest: ' + JSON.stringify({ b0: h0.bond, b1: h1.bond }));
  await home();
  await t.ctx.close();

  sec('33. every walk mode the route picker starts: a run track, and the classic walk');
  await start(t, { mk: { map215: true } });
  await befriend(t, ['DOG-4K7PM', 'DOG-9QRST']); await t.closeX(); await t.modalGone();
  await spy(); await fresh();
  ok(await ev(() => window.__paw.tr.on() && window.__paw.tr.keys().includes('sunflower')), 'the run tracks are in the route picker');
  await routes('sunflower');
  ok(await ev(() => /Sunflower/.test(document.querySelector('.rt-card.cur h3').textContent)), 'the Sunflower Lanes card');
  await pick(SUNNY + ':0'); await go();
  ok(await ev(() => window.__opts.area === 'sunflower' && window.__opts.pack.length === 1 && window.__opts.pack[0].friend === true && document.querySelectorAll('.pw-fol.pw-friend .pw-rib').length === 5), 'a run track: the guest follows with its ribbon');
  const i0 = await snap(); await end(R()); const i1 = await snap();
  ok(i1.coins - i0.coins === 220 && /Walked with Sunny Biscuit's [^:]+: \+20/.test(await modalText()) && await ev(() => window.__paw.S.fr.guest === null), 'the run track pays the friend walk and clears the pick');
  await home();
  await ev(() => { window.__PW = window.PawWalk; window.PawWalk = null; }); await fresh();
  await routes(); await pick(FERN + ':0'); await t.p.click('#rtStart'); await t.untilMode('walk');
  ok(await ev(() => !!window.__paw.W && !window.__paw.W.mod && !!window.__paw.fr.walkGuest()), 'the classic walk (no runner) holds the guest');
  const j0 = await snap(); await ev(() => { const W = window.__paw.W; W.coins = 0; W.dist = W.len; });
  await t.until(() => !!document.getElementById('resOk'), null, 8000);
  const j1 = await snap();
  ok(/Walked with Cozy Fern's [^:]+: \+20/.test(await modalText()) && j1.walks === j0.walks + 1 && await ev(() => window.__paw.S.fr.guest === null), 'the classic walk pays the friend walk too, and clears the pick');
  await home(); await ev(() => { window.PawWalk = window.__PW; });
  await t.ctx.close();

  sec('34. phones 390x844 and 360x740: the row fits, the guest walks with its ribbon');
  for (const [w, h, tag] of [[390, 844, '390'], [360, 740, '360']]) {
    await start(t, { vw: w, vh: h });
    await t.until(() => document.documentElement.dataset.layout === 'phone', null, 4000);
    await befriend(t, ['DOG-4K7PM', 'DOG-9QRST']); await t.closeX(); await t.modalGone();
    await spy(); await fresh();
    await t.p.click('#bar [data-act="walk"]'); await t.p.waitForSelector('#rtStart'); await t.sleep(400);
    await pick(SUNNY + ':1');
    const L = await routeLayout();
    ok(!L.side && !L.bad.length, tag + ': the row fits (44 px chips, on screen), the card and Start are clear, nothing overlaps: ' + JSON.stringify(L));
    await ev(() => { document.querySelector('.routes').scrollTop = 0; });
    if (tag === '390') { await ev(() => { document.getElementById('toasts').innerHTML = ''; }); await shot(t, 'walk_row_390'); }
    await go();
    const P = await ev(() => { const f = document.querySelector('.pw-fol.pw-friend'), st = document.querySelector('.pw-stage').getBoundingClientRect(); if (!f) return null; const fb = f.getBoundingClientRect(), r = f.querySelector('.pw-pose.on .pw-rib svg').getBoundingClientRect(); return { onStage: fb.left >= st.left - 1 && fb.right <= st.right + 1 && fb.bottom <= st.bottom + 2, rib: r.width >= 10 && r.left >= fb.left && r.right <= fb.right, sw: document.documentElement.scrollWidth <= innerWidth }; });
    ok(P && P.onStage && P.rib && P.sw, tag + ': the guest is on the strip with its ribbon (10 px or more): ' + JSON.stringify(P));
    if (tag === '390') await shot(t, 'walk_guest_390');
    await t.ctx.close();
  }
}

// Friends: the name pick (if needed) and the codes, through the sheet
async function befriend(t, codes) {
  await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
  await t.ev(() => window.__paw.fr.open());
  await t.until(() => !!document.getElementById('frOk') || !!document.getElementById('frCard'), null, 6000);
  if (await t.p.locator('#frOk').count()) await t.p.click('#frOk');
  await t.until(() => !!document.getElementById('frCard'), null, 8000);
  for (let k = 0; k < codes.length; k++) {
    await t.ev((c) => { c.split('').forEach((ch, i) => { document.getElementById('frCh' + i).value = ch; }); }, codes[k].slice(4));
    await t.p.click('#frAdd');
    await t.until((n) => document.querySelectorAll('.fr-row').length >= n, k + 1, 6000);
  }
}
// the friend's yard on a phone: the chip and the buttons on screen, 44 px, never under the bar; their dogs' tap rects not under the bar; no sideways scroll
async function sceneLayout(t) {
  return t.ev(() => {
    const iw = window.innerWidth, ih = window.innerHeight, bad = [];
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const bar = document.getElementById('bar'), br = bar && !bar.hidden ? bar.getBoundingClientRect() : null;
    const over = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const btns = [...document.querySelectorAll('#placeBtns .btn')], chip = document.querySelector('#status');
    btns.forEach((el) => {
      const r = el.getBoundingClientRect(), id = el.id;
      if (r.width < 43.5 || r.height < 43.5) bad.push('small ' + id);
      if (r.left < -1 || r.right > iw + 1 || r.top < 0 || r.bottom > ih) bad.push('off ' + id);
      if (br && over(r, br)) bad.push('bar ' + id);
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!top || !el.contains(top)) bad.push('covered ' + id);
      if (chip && over(r, chip.getBoundingClientRect())) bad.push('chip ' + id);
    });
    if (btns.length !== 3) bad.push('buttons ' + btns.length);
    const cr = chip && chip.getBoundingClientRect();
    if (!cr || !cr.width || cr.left < -1 || cr.right > iw + 1 || cr.top < 0) bad.push('chip');
    const hits = [...document.querySelectorAll('#frDogs .frdog:not(.fr-mine) .fr-hit')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
    if (!hits.length) bad.push('no dogs');
    hits.forEach((r, i) => { const x = r.left + r.width / 2, y = r.top + r.height / 2; if (br && y > br.top) bad.push('dog under the bar ' + i); const top = document.elementFromPoint(x, y); if (!top || !top.closest('.frdog')) bad.push('dog covered ' + i); });
    return { side: sw > iw + 1, bad, bar: br ? [...bar.querySelectorAll(':scope > .act')].map((b) => b.dataset.act) : [] };
  });
}

/* ---------------- part 3b: the greeting on a visit (owner, 2 Nov 2026, as in the launch Reel) ----------------
   My leader walks in to their leader, the two sniff nose to nose with hearts, then play bow and jump back and forth, then the visit goes on. No dog is
   drawn over another at any moment: two drawn boxes (.fr-art) may meet only when one dog stands at least 40 behind and the one in front covers no more
   than the bottom 30% of it (its legs). window.__paw.fr.greet() starts it again (Marketing films it) */
async function greetPart(t) {
  const { ok, sec, ev } = t, SUNNY = 'sunnybiscuitxxxxxxxxxx';
  // a visit to Sunny Biscuit with these dogs (breed keys, '.pup' for a puppy) and my leader drawn as `mine`
  const visit = async (o) => {
    await start(t, { vw: o.w, vh: o.h, prefs: o.prefs, patch: o.mine ? { dog: { key: o.mine } } : null });
    if (o.w < 600) await t.until(() => document.documentElement.dataset.layout === 'phone', null, 4000);
    await befriend(t, ['DOG-4K7PM']);
    await ev(([fid, list]) => { const B = window.PawGenes.BREEDS; window.__frSrv.yardOf[fid].dogs = list.map((s, i) => { const [k, a] = s.split('.'); return { b: B.indexOf(k), c: null, o: -1, a: a === 'pup' ? 'pup' : 'adult', s: i % 2 ? 'm' : 'f', sp: 0, n: i }; }); }, [SUNNY, o.theirs]);
    await ev(() => { window.__toasts.length = 0; });
    await watch(t); // armed before the visit: the walk in starts 0.6 s after the yard is drawn
    await ev((fid) => window.__paw.fr.visit(fid), SUNNY);
    return t.until(() => window.__paw.mode === 'fryard' && !!window.__paw.fr.greeting(), null, 6000);
  };
  const all = async (tag, o, shots) => {
    ok(await visit(o), tag + ': the visit opens and the greeting starts');
    if (shots) {
      if (await t.until(() => { const g = window.__paw.fr.greeting(); return !!g && g.step === 0; }, null, 8000)) await shot(t, 'greet_sniff_' + shots);
      if (await t.until(() => { const g = window.__paw.fr.greeting(); return !!g && g.step >= 2; }, null, 8000)) await shot(t, 'greet_play_' + shots);
    }
    const R = await watched(t);
    const L = greetLook(R, o.theirs.length + 1);
    ok(L.drawn, tag + ': all ' + (o.theirs.length + 1) + ' dogs drawn: ' + L.n);
    ok(L.sniff, tag + ': my leader and theirs sniff nose to nose, facing each other (mine on the left facing right, theirs facing left): ' + JSON.stringify(L.sniffAt));
    ok(L.hearts, tag + ': hearts between them while they sniff');
    if (o.calm) ok(!L.walked && !L.jumped && L.bows, tag + ': no walk in and no jumps; they sniff, then play bow: ' + JSON.stringify(L.steps));
    else ok(L.walked && L.play && L.after, tag + ': my leader walks in first, then play bow and jump back and forth after the sniff: ' + JSON.stringify(L.steps));
    ok(L.settled, tag + ': then the visit goes on: both rest (idle, sit or happy), the greeting is over: ' + JSON.stringify(L.last));
    ok(!R.bad.length, tag + ': no dog drawn over another in ' + R.n + ' samples (' + R.legs + ' with only legs behind a dog in front): ' + JSON.stringify(R.bad.slice(0, 3)));
    if (shots) await shot(t, 'greet_settled_' + shots);
    return R;
  };

  sec('17b. the greeting: walk in, sniff nose to nose with hearts, play bow and jump, then the visit; no dog over another');
  const R1 = await all('393 Sunny (a shiba and a corgi puppy)', { w: 393, h: 852, theirs: ['shiba', 'corgi.pup'] }, '393');
  const third = R1.final.find((d) => !d.mine && !d.lead), pair = R1.final.filter((d) => d.mine || d.lead);
  ok(third && third.on && pair.every((d) => d.on && d.y - third.y >= 40), '393: my leader and theirs in front, the third dog behind them, all three on screen: ' + JSON.stringify(R1.final));
  // greet(): again, on this visit; a pet in the middle of it still works and the greeting still finishes
  ok(await ev(() => window.__paw.fr.greet() === true), 'window.__paw.fr.greet() starts it again');
  await watch(t);
  ok(await t.until(() => { const g = window.__paw.fr.greeting(); return !!g && g.step === 0; }, null, 8000), 'greet(): they sniff again');
  await t.until(() => !!window.__grOut && window.__grOut.s.some((x) => x.g && x.g.step === 0 && x.d.filter((d) => d.pose === 'sniff').length >= 2), null, 2000); // the sampler has seen the sniff before the pet turns their leader happy (was a race: the tap came ~15 ms into the sniff)
  const b0 = await ev(() => window.__paw.S.bond.pts);
  const hit = await ev(() => { const d = window.__paw.fr.scene().dogs, i = d.findIndex((x) => !x.mine), r = document.querySelector(`#frDogs [data-frd="${i}"] .fr-hit`).getBoundingClientRect(); return { i, x: r.left + r.width / 2, y: r.top + r.height * 0.6 }; });
  await t.p.mouse.click(hit.x, hit.y);
  ok(await t.until((i) => window.__paw.fr.scene().dogs[i].pose === 'happy' && document.querySelectorAll('#fx .heartfx').length > 0, hit.i, 2000), 'a tap on their leader during the greeting: hearts and its happy pose');
  ok(await t.until((fid) => window.__frSrv.sent.some((s) => s.kind === 'pet' && s.fid === fid), SUNNY, 4000) && (await t.until((b) => window.__paw.S.bond.pts === b + 1, b0, 3000)), 'the pet goes out and gives +1 Bond, as any pet');
  const R2 = await watched(t), L2 = greetLook(R2, 3);
  ok(L2.play && L2.settled && !R2.bad.length, 'greet(): the greeting goes on after the pet (play bow and jump), then the visit; no dog over another: ' + JSON.stringify({ steps: L2.steps, bad: R2.bad.slice(0, 2) }));
  ok(await ev(() => { window.__paw.fr.home(); return window.__paw.fr.greet() === false; }), 'greet() outside a visit: false, nothing happens');
  await t.ctx.close();

  await all('360x640 big breeds (a Great Dane meets a Great Dane and a dachshund)', { w: 360, h: 640, mine: 'dane', theirs: ['dane', 'dachs'] }, '360');
  await t.ctx.close();
  await all('393 one friend dog (a Pomeranian meets a dachshund)', { w: 393, h: 852, mine: 'pom', theirs: ['dachs'] });
  await t.ctx.close();
  await all('360x640 three friend dogs', { w: 360, h: 640, theirs: ['shiba', 'corgi.pup', 'pom'] });
  await t.ctx.close();
  const R5 = await all('1280x800 three friend dogs, big and small (a dachshund meets a Great Dane, a Pomeranian and a corgi)', { w: 1280, h: 800, mine: 'dachs', theirs: ['dane', 'pom', 'corgi'] }, '1280');
  ok(R5.final.every((d) => d.on), '1280: every dog on screen: ' + JSON.stringify(R5.final));
  await t.ctx.close();
  await all('1280x800 one friend dog (a Chihuahua meets a Great Dane)', { w: 1280, h: 800, mine: 'chihuahua', theirs: ['dane'] });
  await t.ctx.close();
  await all('393 reduced motion', { w: 393, h: 852, prefs: { motion: 'off' }, theirs: ['shiba', 'corgi.pup'], calm: true });
  await t.ctx.close();
}
// in the page: every 50 ms, the greeting's step, each dog's pose, face, feet and drawn box, and any two drawn boxes that meet, until 0.8 s after it ends
function watch(t) {
  return t.ev(() => {
    const P = window.__paw.fr, out = { s: [], bad: [], legs: 0, n: 0, done: false }, t0 = performance.now(); let was = false, end = 0;
    window.__grOut = out; clearInterval(window.__grId);
    const tick = () => {
      if (window.__paw.mode !== 'fryard') return;
      const g = P.greeting(), sc = P.scene(), vw = innerWidth, vh = innerHeight;
      const els = [...document.querySelectorAll('#frDogs .frdog')].filter((e) => e.style.display !== 'none');
      const B = els.map((e) => { const r = e.querySelector('.fr-art').getBoundingClientRect(), d = sc.dogs[+e.dataset.frd]; return { i: +e.dataset.frd, r: [r.left, r.top, r.right, r.bottom], d }; });
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
        const a = B[i], b = B[j], ix = Math.min(a.r[2], b.r[2]) - Math.max(a.r[0], b.r[0]), iy0 = Math.max(a.r[1], b.r[1]), iy1 = Math.min(a.r[3], b.r[3]);
        if (ix <= 2 || iy1 - iy0 <= 2) continue;
        const back = a.d.y < b.d.y ? a : b, legs = Math.abs(a.d.y - b.d.y) >= 40 && iy0 >= back.r[1] + 0.7 * (back.r[3] - back.r[1]) - 3;
        if (legs) out.legs++; else out.bad.push({ g: g && g.step, a: [a.d.key, a.d.pose, a.d.x, a.d.y], b: [b.d.key, b.d.pose, b.d.x, b.d.y], ix: Math.round(ix), iy: Math.round(iy1 - iy0) });
      }
      out.n++;
      out.s.push({ g: g ? { step: g.step, pose: g.pose.slice() } : null, h: document.querySelectorAll('#fx .heartfx').length, d: sc.dogs.map((d) => ({ mine: d.mine, pose: d.pose, face: d.face, x: d.x, y: d.y, w: d.walking })) });
      const lead = sc.dogs.findIndex((d) => !d.mine);
      out.final = B.map((b) => ({ key: b.d.key, mine: b.d.mine, lead: b.i === lead, pose: b.d.pose, y: b.d.y, on: b.r[0] >= -1 && b.r[2] <= vw + 1 && b.r[1] >= 0 && b.r[3] <= vh }));
      if (g) { was = true; end = 0; } else if (was && !end) end = performance.now();
      if ((end && performance.now() - end > 800) || performance.now() - t0 > 20000) { clearInterval(window.__grId); out.done = true; }
    };
    window.__grId = setInterval(tick, 50);
  });
}
async function watched(t) { await t.until(() => !!window.__grOut && window.__grOut.done, null, 22000); return t.ev(() => window.__grOut); }
// what the samples show: the sniff (facing each other, mine on the left), hearts, the walk in, the play after the sniff, the rest at the end
function greetLook(R, want) {
  const S = R.s.filter((x) => x.d.length), first = (f) => S.findIndex(f);
  const mi = S.length ? S[0].d.findIndex((d) => d.mine) : -1, li = S.length ? S[0].d.findIndex((d) => !d.mine) : -1;
  const sniffAt = first((x) => x.g && x.d[mi].pose === 'sniff' && x.d[li].pose === 'sniff' && x.d[mi].face === 'right' && x.d[li].face === 'left' && x.d[mi].x < x.d[li].x);
  const playAt = first((x) => x.g && x.g.step >= 2 && ((x.d[mi].pose === 'bow' && x.d[li].pose === 'jump') || (x.d[mi].pose === 'jump' && x.d[li].pose === 'bow')));
  const swapAt = playAt < 0 ? -1 : S.findIndex((x, i) => i > playAt && x.g && x.d[mi].pose !== S[playAt].d[mi].pose && ['bow', 'jump'].includes(x.d[mi].pose) && ['bow', 'jump'].includes(x.d[li].pose));
  const walkAt = first((x) => x.d[mi].w), last = S[S.length - 1];
  const rest = (p) => ['idle', 'sit', 'happy'].includes(p);
  return {
    n: last ? last.d.length : 0, drawn: !!last && last.d.length === want, sniff: sniffAt >= 0, sniffAt: sniffAt >= 0 ? S[sniffAt].d.filter((d, i) => i === mi || i === li) : null,
    hearts: S.some((x, i) => i >= sniffAt && sniffAt >= 0 && x.g && x.g.step === 0 && x.h > 0),
    walked: walkAt >= 0 && walkAt < sniffAt, play: playAt > sniffAt && sniffAt >= 0 && swapAt > playAt, after: playAt > sniffAt,
    jumped: S.some((x) => x.d[mi].pose === 'jump' || x.d[li].pose === 'jump'), bows: S.some((x, i) => i > sniffAt && x.d[mi].pose === 'bow' && x.d[li].pose === 'bow'),
    settled: !!last && !last.g && rest(last.d[mi].pose) && rest(last.d[li].pose),
    steps: [...new Set(S.filter((x) => x.g).map((x) => x.g.step + ':' + x.g.pose.join('/')))], last: last && { g: last.g, mine: last.d[mi], lead: last.d[li] }
  };
}
