// v2.19 Friends, part 2 (V219.md sections 2, 3 and 8): friend codes, the Friends sheet, the yard snapshot, note letters.
// An in-memory cloud mock fakes the Worker routes. node game/run_tests.js v219_friends
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
      'DOG-9QRST': { fid: fid('cozyfern'), name: [2, 11], dogs: [{ b: 3, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 3 }] }
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
      if (method === 'GET' && path === '/friends/yard') {
        const who = u.searchParams.get('fid'); srv.visits.push(who);
        if (!srv.friends.some((f) => f.fid === who)) return send(404, { error: 'not_found' });
        return send(200, { yard: srv.yardOf[who] || null });
      }
      if (method === 'POST' && path === '/friends/send') {
        const f = srv.friends.find((x) => x.fid === body.fid);
        if (!f || !['pet', 'note', 'gift', 'walk'].includes(body.kind)) return send(400, { error: 'bad' });
        if (body.kind === 'note' && !(Number.isInteger(body.data && body.data.i) && body.data.i >= 0 && body.data.i < 12)) return send(400, { error: 'bad' });
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
  ok(await t.until(() => window.__frSrv.events.filter((e) => e.claimed).map((e) => e.kind).sort().join(',') === 'note,pet' && window.__paw.fr.badge() === 2, null, 4000), 'the note and the pet are claimed. gift and walk stay on the badge');
  const petMail = await ev(() => (window.__paw.S.mail || []).filter((m) => m && /^fr_pet_/.test(m.id)).map((m) => ({ id: m.id, from: m.from, title: m.title, text: m.text })));
  ok(petMail.length === 1 && petMail[0].id === 'fr_pet_2026-11-01' && petMail[0].text === 'Sunny Biscuit visited and petted ' + (await ev(() => window.__paw.S.dog.name)) + '. +1 Bond' && (await ev(() => window.__paw.S.fr.gotPets)) === 1, 'the pet became a letter: "Sunny Biscuit visited and petted <dog>. +1 Bond": ' + JSON.stringify(petMail));
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

  await t.p.click('[data-fr="gift"]');
  ok(await t.waitToast(/Coming soon/, 3000), 'Gift says Coming soon (part 4)');
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
  ok(yard && yard.v === 1 && Array.isArray(yard.name) && yard.name.length === 2 && yard.house === (await ev(() => window.__paw.fr.lists().houses.indexOf(window.__paw.S.house))) && ['spring', 'summer', 'autumn', 'winter'].includes(yard.season), 'snapshot shape, house index from FR_HOUSES: ' + JSON.stringify({ name: yard && yard.name, house: yard && yard.house, season: yard && yard.season, dogs: yard && yard.dogs && yard.dogs.length, decor: yard && yard.decor && yard.decor.length }));
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

  sec('7. off by default, and hidden on the artifact');
  await start(t, { mock: false, fr: false, query: '?friend=DOG-4K7PM' });
  ok(await t.until(() => !!(window.__paw && window.__paw.fr && window.__paw.mode === 'yard'), null, 8000), 'a normal boot reaches the yard');
  ok(await ev(() => window.__paw.fr.live() === false && window.__paw.fr.on() === false), 'off by default: FR_LIVE is false, so Friends is off without a test flag');
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
  ok(await ev(() => (document.getElementById('frNoteBtn') || {}).textContent === 'Leave a paw print' && (document.getElementById('frHomeBtn') || {}).textContent === 'Go home'), 'the buttons: "Leave a paw print" and "Go home"');
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
    await t.p.click('#bar .act[data-act="map"]');
    ok(await t.until(() => window.__paw.mode === 'yard', null, 4000), tag + ': Map goes home');
    await t.ctx.close();
  }
});

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
    if (btns.length !== 2) bad.push('buttons ' + btns.length);
    const cr = chip && chip.getBoundingClientRect();
    if (!cr || !cr.width || cr.left < -1 || cr.right > iw + 1 || cr.top < 0) bad.push('chip');
    const hits = [...document.querySelectorAll('#frDogs .frdog:not(.fr-mine) .fr-hit')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
    if (!hits.length) bad.push('no dogs');
    hits.forEach((r, i) => { const x = r.left + r.width / 2, y = r.top + r.height / 2; if (br && y > br.top) bad.push('dog under the bar ' + i); const top = document.elementFromPoint(x, y); if (!top || !top.closest('.frdog')) bad.push('dog covered ' + i); });
    return { side: sw > iw + 1, bad, bar: br ? [...bar.querySelectorAll(':scope > .act')].map((b) => b.dataset.act) : [] };
  });
}
