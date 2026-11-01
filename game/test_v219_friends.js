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
    book: {
      'DOG-4K7PM': { fid: fid('sunnybiscuit'), name: [0, 0], dogs: [{ b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 }] },
      'DOG-9K7PM': { fid: fid('happyacorn'), name: [1, 3], dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 4 }] }
    },
    yardOf: {}, sends: [], sentKeys: {},
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
      if (method === 'GET' && path === '/friends/yard') {
        const qfid = u.searchParams.get('fid');
        if (!srv.friends.some((f) => f.fid === qfid)) return send(404, { error: 'not_found' });
        const yard = Object.prototype.hasOwnProperty.call(srv.yardOf, qfid) ? srv.yardOf[qfid] : null;
        return send(200, { yard: yard || null });
      }
      if (method === 'POST' && path === '/friends/send') {
        const kind = body.kind, qfid = body.fid;
        if (!srv.friends.some((f) => f.fid === qfid)) return send(404, { error: 'not_found' });
        if (['pet', 'note', 'gift', 'walk'].indexOf(kind) < 0) return send(400, { error: 'bad' });
        const key = qfid + ':' + kind;
        if (srv.sentKeys[key]) return send(400, { error: 'limit' });
        if (kind === 'pet' && body.data && Object.keys(body.data).length) return send(400, { error: 'bad' });
        if (kind === 'note' && !(body.data && Number.isInteger(body.data.i) && body.data.i >= 0 && body.data.i < 12)) return send(400, { error: 'bad' });
        srv.sentKeys[key] = true;
        srv.sends.push({ fid: qfid, kind, data: body.data || {} });
        const who = srv.friends.find((f) => f.fid === qfid);
        if (who) { who.sent = who.sent || {}; who.sent[kind] = true; }
        return send(200, { ok: true });
      }
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
function diffPaths(a, b, path, out) {
  path = path || '$'; out = out || [];
  if (a === b) return out;
  const ao = a && typeof a === 'object', bo = b && typeof b === 'object';
  if (!ao || !bo || Array.isArray(a) !== Array.isArray(b)) { out.push(path); return out; }
  const keys = Object.keys(a).concat(Object.keys(b));
  keys.filter((k, i) => keys.indexOf(k) === i).forEach((k) => diffPaths(a[k], b[k], path + '.' + k, out));
  return out;
}
const onlyBondFr = (p) => /\.bond(\.|$)/.test(p) || /\.fr(\.|$)/.test(p);
async function openFriends(t) {
  if (await t.ev(() => document.documentElement.dataset.layout === 'phone')) {
    await t.p.click('#bar [data-act="more"]');
    await t.until(() => !!document.querySelector('#bar [data-act="friends"]'), null, 3000);
    await t.p.click('#bar [data-act="friends"]');
  } else await t.p.click('#frBtn');
}
async function yardNotes(t) {
  return t.ev(() => {
    const iw = window.innerWidth, ih = window.innerHeight;
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const bar = document.getElementById('bar');
    const barTop = bar && !bar.hidden ? bar.getBoundingClientRect().top : ih;
    const bad = [];
    const body = document.querySelector('#modal .panel-body');
    const br = body ? body.getBoundingClientRect() : { top: 0, bottom: ih };
    const visTop = Math.max(2, br.top), visBot = Math.min(barTop - 2, br.bottom, ih - 2);
    document.querySelectorAll('#modal .fr-note').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const id = (el.textContent || '').trim().slice(0, 24);
      const mid = r.top + r.height / 2;
      if (mid < visTop || mid > visBot) return;
      if (r.width < 43.5 || r.height < 43.5) bad.push('small ' + id + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (r.left < -1 || r.right > iw + 1) bad.push('side ' + id);
      if (mid >= barTop - 1) bad.push('bar ' + id);
    });
    return { sw, iw, side: sw > iw + 1, bad };
  });
}
async function yardShotLay(t) {
  return t.ev(() => {
    const iw = window.innerWidth, ih = window.innerHeight;
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const bar = document.getElementById('bar');
    const barTop = bar && !bar.hidden ? bar.getBoundingClientRect().top : ih;
    const bad = [];
    document.querySelectorAll('#placeBtns .btn, #status').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const id = el.id || el.className;
      if (el.matches('button') && (r.width < 43.5 || r.height < 43.5)) bad.push('small ' + id + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (r.left < -1 || r.right > iw + 1) bad.push('side ' + id);
      if (r.top < -1) bad.push('top ' + id);
      if (r.bottom > barTop + 1) bad.push('bar ' + id);
    });
    return { sw, iw, side: sw > iw + 1, bad, chip: (document.querySelector('#status .pname') || {}).textContent || '' };
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
  ok(await ev(() => { const kinds = window.__frSrv.events.filter((e) => e.claimed).map((e) => e.kind).sort().join(','); return kinds === 'note,pet' && window.__paw.fr.badge() === 2; }), 'the note and the pet are claimed. gift and walk stay on the badge');
  const petLetter = await ev(() => { const S = window.__paw.S, m = (S.mail || []).find((x) => x && String(x.id).indexOf('fr_pet_') === 0); return m && { text: m.text, from: m.from, dog: S.dog.name, got: S.fr.gotPets }; });
  ok(petLetter && petLetter.from === 'Sunny Biscuit' && petLetter.got === 1 && petLetter.text === 'Sunny Biscuit visited and petted ' + petLetter.dog + '. +1 Bond', 'one pet becomes one letter: ' + (petLetter && petLetter.text));
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

  await ev(() => { document.getElementById('toasts').innerHTML = ''; window.__toasts.length = 0; });
  await t.p.click('[data-fr="visit"]');
  ok(await t.waitToast(/still being tidied/, 4000), 'no snapshot yet: the yard is still being tidied');
  ok(await ev(() => window.__paw.mode === 'yard'), 'a missing snapshot stays on the home yard');
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

  sec('9. visit, pet, note, and the save');
  await start(t);
  await openFriends(t);
  await t.until(() => !!document.getElementById('frOk'), null, 4000);
  await t.p.click('#frOk');
  await t.until(() => !!document.getElementById('frCard'), null, 8000);
  await ev(() => { '4K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.until(() => !!document.querySelector('[data-fr="visit"]'), null, 5000), 'Sunny Biscuit is on the list');
  await t.closeX(); await t.modalGone();
  await ev(() => {
    const fid = window.__frSrv.friends[0].fid, lists = window.__paw.fr.lists();
    window.__frSrv.yardOf[fid] = {
      v: 1, name: [0, 0], house: lists.houses.indexOf('Cozy Cottage'), season: 'autumn',
      dogs: [{ b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 }, { b: 1, c: null, o: 0, a: 'pup', s: 'm', sp: 0, n: 2 }],
      decor: [{ i: lists.decor.indexOf('Bird Bath'), x: 120, y: 420 }, { i: lists.decor.indexOf('Garden Bench'), x: 700, y: 500 }]
    };
  });
  await openFriends(t);
  await t.until(() => !!document.querySelector('[data-fr="visit"]'), null, 4000);
  await t.p.click('[data-fr="visit"]');
  ok(await t.until(() => window.__paw.mode === 'fryard', null, 5000), 'Visit enters fryard');
  const snap0 = await ev(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const scene = await ev(() => {
    const extra = JSON.parse((document.getElementById('sceneG') || {}).dataset.extra || '{}');
    const decor = [...document.querySelectorAll('#decorG [data-decor]')].map((el) => el.dataset.decor + '@' + el.dataset.x + ',' + el.dataset.y);
    return {
      house: (document.getElementById('houseG') || {}).dataset.house, season: extra.season, decor,
      dogs: window.__paw.fr.dogs(), chip: (document.querySelector('#status .pname') || {}).textContent,
      note: (document.getElementById('frNoteBtn') || {}).textContent, home: (document.getElementById('frHomeBtn') || {}).textContent,
      mail: !!document.getElementById('mailboxG'), garden: !!document.querySelector('[data-pb="garden"]'),
      shop: !!document.querySelector('[data-sh]'), ms: !!(document.getElementById('msBtn') && !document.getElementById('msBtn').hidden),
      cached: window.__paw.S.fr.yards[window.__frSrv.friends[0].fid]
    };
  });
  ok(scene.house === 'Cozy Cottage' && scene.season === 'autumn', 'their house and season: ' + scene.house + ' / ' + scene.season);
  ok(scene.decor.indexOf('Bird Bath@120,420') >= 0 && scene.decor.indexOf('Garden Bench@700,500') >= 0, 'decor at the saved spots: ' + scene.decor.join(' | '));
  ok(scene.dogs.filter((d) => d.mine).length === 1 && scene.dogs.filter((d) => !d.mine).length === 2 && scene.dogs.some((d) => !d.mine && d.name === 'Mochi'), 'my leader comes along, and their dogs roam like visitors: ' + JSON.stringify(scene.dogs));
  ok(scene.chip === "Sunny Biscuit's yard" && scene.note === 'Leave a paw print' && scene.home === 'Go home', 'chip and the two buttons: ' + [scene.chip, scene.note, scene.home].join(' / '));
  ok(scene.cached && scene.cached.day === snap0.fr.day && scene.cached.yard && scene.cached.yard.season === 'autumn', 'cached in S.fr.yards with the day');
  ok(!scene.mail && !scene.garden && !scene.shop && !scene.ms, 'mailbox, garden, shop doors and missions are absent');
  await ev(() => { ['#sceneG [data-hot]', '[data-decor]'].forEach((s) => { const el = document.querySelector(s); if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); });
  ok(await ev(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden), 'garden, shop and decor taps do nothing');
  const stats = await ev(() => JSON.stringify(window.__paw.S.stats));
  await t.p.click('#bar [data-act="feed"]');
  await t.p.click('#bar [data-act="walk"]');
  await t.p.click('#bar [data-act="care"]');
  ok(await ev((s) => window.__paw.mode === 'fryard' && !document.querySelector('#dock .tray') && JSON.stringify(window.__paw.S.stats) === s && document.getElementById('modal').hidden, stats), 'Feed, Walk and Care are inert');
  const bond0 = await ev(() => window.__paw.S.bond.pts);
  await t.p.locator('#frDogs .frdog[data-mine="0"]').first().click();
  ok(await t.until((b) => window.__paw.S.fr.pets === 1 && window.__paw.S.bond.pts === b + 1, bond0, 4000), 'the first pet of the day gives +1 Bond');
  ok(await t.until(() => window.__paw.fr.dogs().some((d) => !d.mine && d.pose === 'happy'), null, 2000), 'the friend dog takes a happy pose');
  ok(await ev(() => { const b = document.getElementById('bubble'); return !!(b && !b.hidden && (b.textContent || '').length > 2); }), 'the dog says a personality line');
  ok(await ev(() => window.__frSrv.sends.length === 1 && window.__frSrv.sends[0].kind === 'pet' && window.__frSrv.sends[0].data && Object.keys(window.__frSrv.sends[0].data).length === 0), 'the pet send is { kind: pet } with empty data');
  await t.p.locator('#frDogs .frdog[data-mine="0"]').first().click();
  ok(await ev((b) => window.__frSrv.sends.length === 1 && window.__paw.S.fr.pets === 1 && window.__paw.S.bond.pts === b + 1, bond0), 'a later pet the same day is just hearts');
  await t.p.click('#frNoteBtn');
  ok(await t.until(() => document.querySelectorAll('#modal .fr-note').length === 12, null, 3000), 'Leave a paw print lists the 12 notes');
  const noteLay = await yardNotes(t);
  ok(!noteLay.side && !noteLay.bad.length, 'the note list fits: ' + JSON.stringify(noteLay));
  await t.p.click('#modal .fr-note[data-fri="4"]');
  ok(await t.waitToast(/Paw print left!/, 4000), 'the toast says Paw print left!');
  ok(await ev(() => {
    const s = window.__frSrv.sends.filter((x) => x.kind === 'note')[0];
    const stamp = document.getElementById('frPawStamp');
    return !!(s && s.data && s.data.i === 4 && stamp && stamp.querySelector('svg') && document.getElementById('frNoteBtn').textContent === 'Paw print left today');
  }), 'note { i: 4 }, the paw stamp is on the path, and the button reads Paw print left today');
  const sentN = await ev(() => window.__frSrv.sends.length);
  await t.p.click('#frNoteBtn');
  ok(await ev((n) => window.__frSrv.sends.length === n && document.getElementById('modal').hidden, sentN), 'a second paw print the same day is not sent');
  const after = await ev(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const changed = diffPaths(snap0, after).filter((p) => !onlyBondFr(p));
  ok(!changed.length, 'the save differs only in Bond and S.fr: ' + (changed.join(', ') || 'nothing else'));
  await shot(t, 'fryard_1280');
  const left = await ev(() => { const a = JSON.parse(JSON.stringify(window.__paw.S)); window.__paw.fr.home(); const b = JSON.parse(JSON.stringify(window.__paw.S)); return { mode: window.__paw.mode, a, b }; });
  const leftDiff = diffPaths(left.a, left.b);
  ok(left.mode === 'yard' && !leftDiff.length, 'Go home returns to the yard and changes nothing: ' + leftDiff.join(', '));
  await openFriends(t);
  await t.until(() => !!document.querySelector('[data-fr="visit"]'), null, 4000);
  await t.p.click('[data-fr="visit"]');
  ok(await t.until(() => window.__paw.mode === 'fryard' && document.getElementById('frNoteBtn').textContent === 'Paw print left today', null, 5000), 'coming back still shows the paw print left today');
  await t.p.click('#bar [data-act="map"]');
  ok(await t.until(() => window.__paw.mode === 'yard', null, 4000), 'Map goes home');
  await openFriends(t);
  await t.until(() => !!document.querySelector('[data-fr="visit"]'), null, 4000);
  await t.p.click('[data-fr="visit"]');
  ok(await t.until(() => window.__paw.mode === 'fryard', null, 5000), 'back in the yard for the background check');
  ok(await ev(() => { try { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); } catch (e) { window.__paw.fr.background(); return window.__paw.mode === 'yard'; } document.dispatchEvent(new Event('visibilitychange')); return window.__paw.mode === 'yard'; }), 'the app going to the background returns home');

  sec('9b. pet caps, both sides, and merged letters');
  await ev(() => { window.__toasts.length = 0; });
  await openFriends(t);
  if (await t.p.locator('#frOk').count()) await t.p.click('#frOk');
  await t.until(() => !!document.getElementById('frAdd') || !!document.querySelector('[data-fr="visit"]'), null, 5000);
  await ev(() => { '9K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
  await t.p.click('#frAdd');
  ok(await t.until(() => document.querySelectorAll('.fr-row').length >= 2, null, 5000), 'Happy Acorn is a second friend');
  await ev(() => {
    const f = window.__frSrv.friends.find((x) => x.name && x.name[0] === 1);
    const lists = window.__paw.fr.lists();
    window.__frSrv.yardOf[f.fid] = { v: 1, name: [1, 3], house: 0, season: 'spring', dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 4 }], decor: [] };
    window.__paw.S.fr.pets = 5;
  });
  const capBond = await ev(() => window.__paw.S.bond.pts);
  const capSends = await ev(() => window.__frSrv.sends.length);
  await t.p.locator('.fr-row').filter({ hasText: 'Happy Acorn' }).locator('[data-fr="visit"]').click();
  ok(await t.until(() => window.__paw.mode === 'fryard', null, 5000), 'the second yard opens');
  await t.p.locator('#frDogs .frdog[data-mine="0"]').first().click();
  ok(await t.until((n) => window.__frSrv.sends.length === n + 1, capSends, 4000), 'the first pet of a sixth friend still sends');
  ok(await ev((b) => window.__paw.S.fr.pets === 5 && window.__paw.S.bond.pts === b, capBond), 'no Bond past 5 friends a day');
  await ev(() => window.__paw.fr.home());
  const many = await ev(() => {
    const dog = window.__paw.S.dog.name, pts = window.__paw.S.bond.pts;
    window.__paw.S.fr.gotPets = 0;
    window.__frSrv.events = [
      { id: 31, from: { fid: 'aaaaaaaaaaaaaaaaaaaaaa', name: [0, 0] }, kind: 'pet', data: {}, day: '2026-11-01', claimed: false },
      { id: 32, from: { fid: 'bbbbbbbbbbbbbbbbbbbbbb', name: [1, 3] }, kind: 'pet', data: {}, day: '2026-11-01', claimed: false },
      { id: 33, from: { fid: 'cccccccccccccccccccccc', name: [2, 4] }, kind: 'pet', data: {}, day: '2026-11-01', claimed: false }
    ];
    return { dog, pts };
  });
  await ev(() => window.__paw.fr.inbox());
  const merged = await ev((dog) => { const m = (window.__paw.S.mail || []).find((x) => x && x.id === 'fr_pet_2026-11-01_31'); return m && { text: m.text, got: window.__paw.S.fr.gotPets, pts: window.__paw.S.bond.pts, want: 'Sunny Biscuit and 2 friends visited and petted ' + dog + '. +3 Bond' }; }, many.dog);
  ok(merged && merged.text === merged.want && merged.got === 3 && merged.pts === many.pts + 3, 'three pets, one letter, +1 Bond each: ' + (merged && merged.text));
  const extra = await ev(() => {
    const pts = window.__paw.S.bond.pts;
    window.__paw.S.fr.gotPets = 5;
    window.__frSrv.events = [{ id: 41, from: { fid: 'dddddddddddddddddddddd', name: [3, 5] }, kind: 'pet', data: {}, day: '2026-11-01', claimed: false }];
    return pts;
  });
  await ev(() => window.__paw.fr.inbox());
  const extraLetter = await ev((pts) => { const m = (window.__paw.S.mail || []).find((x) => x && x.id === 'fr_pet_2026-11-01_41'); return { text: m && m.text, pts: window.__paw.S.bond.pts, got: window.__paw.S.fr.gotPets, same: window.__paw.S.bond.pts === pts }; }, extra);
  ok(extraLetter.same && extraLetter.got === 5 && extraLetter.text && extraLetter.text.indexOf('+') < 0 && /visited and petted/.test(extraLetter.text), 'past 5 claimed pets, the letter comes without Bond: ' + extraLetter.text);
  await t.ctx.close();

  sec('10. a friend\'s yard at 390, 360 and 1280');
  for (const [w, h, tag] of [[390, 844, '390'], [360, 740, '360'], [1280, 720, '1280']]) {
    await start(t, { vw: w, vh: h });
    await openFriends(t);
    if (await t.p.locator('#frOk').count()) await t.p.click('#frOk');
    await t.until(() => !!document.getElementById('frAdd'), null, 8000);
    await ev(() => { '4K7PM'.split('').forEach((c, i) => { document.getElementById('frCh' + i).value = c; }); });
    await t.p.click('#frAdd');
    await t.until(() => !!document.querySelector('[data-fr="visit"]') && !!(window.__paw && window.__paw.fr), null, 8000);
    await ev(() => {
      const fid = window.__frSrv.friends[0].fid, lists = window.__paw.fr.lists();
      window.__frSrv.yardOf[fid] = {
        v: 1, name: [0, 0], house: lists.houses.indexOf('Gingerbread Kennel'), season: 'winter',
        dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 7 }, { b: 7, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 16 }],
        decor: [{ i: lists.decor.indexOf('Felt Fir Tree'), x: 280, y: 340 }, { i: lists.decor.indexOf('Yard Snowman'), x: 560, y: 450 }]
      };
    });
    await t.p.click('[data-fr="visit"]');
    ok(await t.until(() => window.__paw.mode === 'fryard' && !!document.getElementById('houseG'), null, 5000), tag + ': the friend yard is up');
    const lay = await yardShotLay(t);
    ok(!lay.side && !lay.bad.length && lay.chip === "Sunny Biscuit's yard", tag + ' yard fits: ' + JSON.stringify(lay));
    await t.p.click('#frNoteBtn');
    ok(await t.until(() => document.querySelectorAll('#modal .fr-note').length === 12, null, 3000), tag + ': the note list opens');
    const notes = await yardNotes(t);
    ok(!notes.side && !notes.bad.length, tag + ' notes fit: ' + JSON.stringify(notes));
    await t.closeX(); await t.modalGone();
    await shot(t, 'fryard_' + tag);
    await t.ctx.close();
  }
});
