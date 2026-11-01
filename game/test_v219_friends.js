// v2.19 Friends, part 2 (V219.md sections 2, 3 and 8): friend codes, the Friends sheet, the yard snapshot, note letters.
// An in-memory cloud mock fakes the Worker routes. node game/run_tests.js v219_friends
const { run, URL } = require('./test_lib');
const fs = require('fs'), path = require('path');
const SHOTS = '/opt/cursor/artifacts/screenshots';
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
    me: null, friends: [], yards: [], forceFull: false, offline: false, unknown: [],
    book: { 'DOG-4K7PM': { fid: fid('sunnybiscuit'), name: [0, 0], dogs: [{ b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 }] } },
    events: [
      { id: 1, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'note', data: { i: 0 }, day: '2026-11-01', claimed: false },
      { id: 2, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'pet', data: {}, day: '2026-11-01', claimed: false },
      { id: 3, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'gift', data: { i: 0, n: 1 }, day: '2026-11-01', claimed: false },
      { id: 4, from: { fid: fid('sunnybiscuit'), name: [0, 0] }, kind: 'walk', data: { dog: 0 }, day: '2026-11-01', claimed: false }
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
      if (method === 'POST' && path === '/guest') return send(200, { token: 'tok-test', user });
      if (method === 'GET' && path === '/me') return send(200, { user });
      if (method === 'GET' && path === '/save') return send(200, { save: null });
      if (method === 'PUT' && path === '/save') return send(200, { ok: true });
      if (method === 'GET' && path === '/friends') return send(200, { me: srv.me, friends: srv.friends });
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
        if (srv.forceFull || srv.friends.length >= 50) return send(400, { error: 'full' });
        const who = srv.book[code];
        if (!who) return send(404, { error: 'not_found' });
        if (srv.friends.some((f) => f.fid === who.fid)) return send(409, { error: 'already' });
        srv.friends.push({ fid: who.fid, name: who.name.slice(), dogs: who.dogs, seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } });
        return send(200, { ok: true });
      }
      if (method === 'POST' && path === '/friends/remove') { srv.friends = srv.friends.filter((f) => f.fid !== body.fid); return send(200, { ok: true }); }
      if (method === 'POST' && path === '/friends/block') { srv.friends = srv.friends.filter((f) => f.fid !== body.fid); return send(200, { ok: true }); }
      if (method === 'PUT' && path === '/friends/yard') { srv.yards.push(body.yard); return send(200, { ok: true }); }
      if (method === 'GET' && path === '/friends/inbox') return send(200, { events: srv.events.filter((e) => !e.claimed).map((e) => ({ id: e.id, from: e.from, kind: e.kind, data: e.data, day: e.day })) });
      if (method === 'POST' && path === '/friends/inbox/claim') { (body.ids || []).forEach((id) => { const e = srv.events.find((x) => x.id === id); if (e) e.claimed = true; }); return send(200, { ok: true }); }
      if (method === 'POST' && path === '/friends/leave') { srv.me = null; srv.friends = []; srv.yards = []; return send(200, { ok: true }); }
      srv.unknown.push(method + ' ' + path);
      return send(200, { ok: true });
    }
  };
}

async function start(t, o) {
  o = o || {};
  await t.mk({ prefs: Object.assign({}, o.prefs || {}, o.fr === false ? {} : { frTest: true }), storage: o.storage || null });
  if (o.vw) await t.p.setViewportSize({ width: o.vw, height: o.vh });
  if (o.host) await t.ctx.addInitScript((h) => { window.__pawCloudHost = h; }, o.host);
  if (o.mock !== false) await t.ctx.addInitScript(mockInit);
  await t.p.goto(URL + (o.query || ''));
  await t.p.waitForSelector('#tNew, #tContinue, #tGuest'); // cloud on: Play as guest comes first
  if (o.fresh === false) return;
  if (await t.p.locator('#tGuest').count()) { await t.p.click('#tGuest'); await t.p.waitForSelector('#tNew'); }
  await t.adopt(o);
  await t.patch(Object.assign({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } }, o.patch || {}));
  await t.calm();
}
async function shot(t, name) {
  try { fs.mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); } catch (e) { /* a missing folder should not fail the suite */ }
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
      const top = document.elementFromPoint(x, yOn);
      if (top && top.closest && top.closest('#bar')) bad.push('bar ' + id);
    });
    return { sw, iw, side: sw > iw + 1 || !!(body && body.scrollWidth > body.clientWidth + 1), bad };
  });
}

run('v219_friends', async (t) => {
  const { ok, sec, ev } = t;
  const workerLim = limM ? limM[1].replace(/\s/g, '') : '';

  sec('1. lists match the Worker, and the gift order is the contract');
  await start(t);
  await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000);
  const order = await ev(() => window.__paw.fr.orderOk());
  const lim = await ev(() => window.__paw.fr.lim());
  ok(order.gifts && order.decor && order.houses && order.notes, 'FR_GIFTS, FR_DECOR, FR_HOUSES and FR_NOTES match the game tables: ' + JSON.stringify(order.n));
  ok(lim.notes === 12 && lim.gifts === 47 && lim.decor === 31 && lim.houses === 14, 'lengths are notes 12, gifts 47, decor 31, houses 14');
  ok(workerLim === 'notes:12,gifts:47,decor:31,houses:14' && lim.notes === 12 && lim.gifts === 47 && lim.decor === 31 && lim.houses === 14, 'client lengths match FR_LIM in cloudflare/worker.js (' + workerLim + ')');
  ok(await ev(() => !window.__paw.fr.lists().gifts.includes('Golden Bone') && !window.__paw.fr.lists().gifts.includes('Fresh Water') && window.__paw.fr.lists().gifts[33] === 'Wild Berries' && window.__paw.fr.lists().gifts[34] === "Duck's Picnic Sandwich"), 'Wild Berries and the sandwich follow the foods. No Golden Bone, no Fresh Water');

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
  await t.p.click('#frOk');
  ok(await t.until(() => !!document.getElementById('frCard') && /DOG-23456/.test(document.getElementById('frCard').textContent || ''), null, 8000), 'the card shows the code DOG-23456');
  ok(await ev(() => document.querySelectorAll('#frCard rect').length > 20), 'the QR is drawn as squares');
  ok(await t.waitToast(/Make an account to keep/, 4000), 'a guest sees the make-an-account nudge once');
  ok(await t.until(() => (window.__paw.S.mail || []).some((m) => m && m.id === 'fr_note_1'), null, 6000), 'the note letter arrived');
  const mail = await ev(() => (window.__paw.S.mail || []).filter((m) => m && m.id === 'fr_note_1').map((m) => ({ from: m.from, text: m.text, paw: !!m.frPaw })));
  ok(mail.length === 1 && mail[0].from === 'Sunny Biscuit' && /fluffy/.test(mail[0].text) && mail[0].paw, 'the note became a postcard from Sunny Biscuit, with the paw: ' + JSON.stringify(mail));
  ok(await ev(() => window.__frSrv.events.filter((e) => e.claimed).map((e) => e.kind).join(',') === 'note' && window.__paw.fr.badge() === 3), 'only the note is claimed. pet, gift and walk stay on the badge');
  await shot(t, 'my_card_1280');

  sec('3. add, the four toasts, remove, block, new code, share');
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

  await t.p.click('[data-fr="visit"]');
  ok(await t.waitToast(/Coming soon/, 3000), 'Visit says Coming soon');
  await t.p.click('[data-fr="more"]');
  ok(await t.until(() => !!document.querySelector('[data-fr="remove"]'), null, 3000), 'the ... menu has Remove and Block');
  await t.p.click('[data-fr="remove"]');
  ok(await t.until(() => !document.querySelector('.fr-row'), null, 4000), 'Remove takes the friend off the list');
  await ev(() => { window.__toasts.length = 0; '4K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  await t.until(() => !!document.querySelector('[data-fr="more"]'), null, 4000);
  await t.p.click('[data-fr="more"]');
  await t.p.click('[data-fr="block"]');
  await t.p.click('.confirm .yes');
  ok(await t.until(() => !document.querySelector('.fr-row'), null, 4000), 'Block, after its confirm, takes the friend off the list');

  const oldCode = await ev(() => window.__paw.S.fr.code);
  await t.p.click('#frNew');
  await t.p.click('.confirm .yes');
  ok(await t.until((old) => window.__paw.S.fr.code && window.__paw.S.fr.code !== old, oldCode, 4000), 'New code replaces the old one (' + oldCode + ')');

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
  ok(yard && yard.v === 1 && Array.isArray(yard.name) && yard.name.length === 2 && typeof yard.house === 'number' && ['spring', 'summer', 'autumn', 'winter'].includes(yard.season), 'snapshot shape: ' + JSON.stringify({ name: yard && yard.name, house: yard && yard.house, season: yard && yard.season, dogs: yard && yard.dogs && yard.dogs.length, decor: yard && yard.decor && yard.decor.length }));
  ok(yard && !JSON.stringify(yard).includes('Zztypedname') && yard.dogs.length >= 1 && !('name' in yard.dogs[0]) && yard.dogs[0].b >= 0 && yard.dogs[0].n >= 0, 'no typed dog name. the leader is a card dog');
  const decor = await ev(() => { const ys = window.__frSrv.yards, y = ys[ys.length - 1], list = window.__paw.fr.lists().decor, bath = y.decor.find((d) => d.i === list.indexOf('Bird Bath')); return { n: y.decor.length, puts: ys.length, bath, rug: y.decor.some((d) => d.i === list.indexOf('Braided Rag Rug')) }; });
  ok(decor.n === 1 && decor.bath && decor.bath.x === 100 && decor.bath.y === 201 && !decor.rug, 'yard decor is rounded and indexed. a house item stays out: ' + JSON.stringify(decor));
  const puts = decor.puts;
  ok(await ev((n) => window.__paw.fr.pushYard(false).then((x) => x === false && window.__frSrv.yards.length === n), puts), 'a second snapshot inside 10 minutes does not PUT');

  await ev(() => { window.__frSrv.offline = true; window.__toasts.length = 0; });
  await t.closeX(); await t.modalGone();
  await t.p.click('#frBtn');
  ok(await t.until(() => !!document.getElementById('frOff'), null, 5000), 'offline: the offline line');
  ok(/internet connection/.test(await ev(() => document.getElementById('frOff').textContent)), 'offline line is the contract sentence');
  await ev(() => { window.__frSrv.offline = false; });

  await t.closeX(); await t.modalGone();
  await t.p.click('#gearBtn');
  await t.p.waitForSelector('#frLeave');
  await t.p.click('#frLeave');
  await t.p.click('.confirm .yes');
  ok(await t.until(() => !window.__paw.S.fr.fid && window.__paw.S.fr.on === false, null, 5000), 'Leave Friends clears the code, the list and the id');

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
  await t.ctx.close();
  await start(t, { query: '#friend=DOG-4K7PM' });
  ok(await t.until(() => !!document.getElementById('frOk') || !!document.getElementById('frCh0'), null, 8000), 'a hash invite opens Friends too');
  if (await t.p.locator('#frOk').count()) await t.p.click('#frOk');
  ok(await t.until(() => (document.getElementById('frCh0') || {}).value === '4', null, 8000), '#friend= pre-fills the code');
  await t.ctx.close();

  sec('7. hidden on the artifact and under the harness');
  await start(t, { mock: false, fr: false, host: 'claude.ai' });
  ok(await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000) && !(await ev(() => window.__paw.fr.on())), 'claude.ai: frOn is false');
  ok(await ev(() => { const b = document.getElementById('frBtn'); return !b || b.hidden || getComputedStyle(b).display === 'none'; }), 'claude.ai: no Friends button');
  await t.ctx.close();
  await start(t, { mock: false, fr: false });
  ok(await t.until(() => !!(window.__paw && window.__paw.fr), null, 8000) && !(await ev(() => window.__paw.fr.on())), 'the test harness keeps Friends off unless a test asks');
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
});
