// The Friends cloud mock (page side), shared by the friends suites (test_v219_friends.js, test_v233_helps.js). Moved here from
// test_v219_friends.js in v2.33 so later suites reuse it. It fakes the Worker's /friends/* routes in memory (no Worker, no network), installed
// before the game runs:   const { mockInit } = require('./fr_mock');   await t.ctx.addInitScript(mockInit, { hp: true });
// The state is window.__frSrv (me, friends, book of codes, yardOf snapshots, events, sent, yards ...).
// v2.33 Helping paws (V233.md 2): cfg.hp (or window.__frSrv.hp, live) makes it a Worker with the Helping paws gate open: GET /friends adds hp: 1
// and the bowl/water/wish/sleep sent flags, POST /friends/send takes the help kinds and note 12, PUT /friends/yard takes a snapshot's hp,
// GET /friends/inbox?hp=1 answers { events, acts, hp: 1 } (acts from window.__frSrv.acts), the claim takes acts. Without it (the default) it is
// the v2.32 Worker: those are 400 bad or ignored, and notes from 12 on are left out of the inbox.
function mockInit(cfg) {
  cfg = cfg || {};
  const fid = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxx').slice(0, 22);
  const HP_KINDS = ['bowl', 'water', 'wish', 'sleep'];
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
    // v2.33 Helping paws (V233.md 2): hp true = a Worker with the gate open (hp: 1, the help kinds and note 12, a snapshot's hp, ?hp=1 + acts,
    // acts in a claim); false = the v2.32 Worker (all of those 400 bad or ignored). A test may flip it live (a Worker rolled back).
    // acts: [{ id, from: { fid, name }, kind, data, day, claimed }]; inboxQ: each inbox read's query; claimBodies: each claim's body; badHp: snapshots refused for hp
    hp: !!cfg.hp, acts: [], inboxQ: [], claimBodies: [], badHp: 0,
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
      if (method === 'GET' && path === '/friends') {
        srv.lists = (srv.lists || 0) + 1;
        if (!srv.hp) return send(200, { me: srv.me, friends: srv.friends.map((f) => Object.assign({}, f, { sent: { pet: !!f.sent.pet, note: !!f.sent.note, gift: !!f.sent.gift, walk: !!f.sent.walk } })) });
        return send(200, { me: srv.me, friends: srv.friends.map((f) => Object.assign({}, f, { sent: Object.assign({ bowl: false, water: false, wish: false, sleep: false }, f.sent) })), hp: 1 });
      }
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
      if (method === 'PUT' && path === '/friends/yard' && body.yard && typeof body.yard === 'object' && 'hp' in body.yard) { // v2.33: as the Worker's hpSnap
        const h = body.yard.hp, ks = h && typeof h === 'object' && !Array.isArray(h) ? Object.keys(h) : null;
        const okH = srv.hp && ks && ks.includes('d') && ks.includes('g') && ks.every((k) => ['d', 'g', 'w', 'a'].includes(k)) && /^\d{4}-\d{2}-\d{2}$/.test(h.d) && Number.isInteger(h.g) && h.g >= 0 && h.g <= 6
          && (!('w' in h) || (Number.isInteger(h.w) && h.w >= 0 && h.w < 13)) && (!('a' in h) || (h.w === 2 && Number.isInteger(h.a) && h.a >= 0 && h.a < 47));
        if (!okH) { srv.badHp++; return send(400, { error: 'bad' }); }
      }
      if (method === 'PUT' && path === '/friends/yard') { if (srv.decorLim && body.yard.decor.some((d) => d.i >= srv.decorLim)) { srv.badYards = (srv.badYards || 0) + 1; return send(400, { error: 'bad' }); } srv.yards.push(body.yard); return send(200, { ok: true }); } // decorLim: an older Worker's FR_LIM.decor
      if (method === 'GET' && path === '/friends/inbox') {
        srv.inboxQ.push(u.search);
        const hpQ = srv.hp && u.searchParams.get('hp') === '1'; // v2.33: notes from 12 on only to ?hp=1, and the acts
        const events = srv.events.filter((e) => !e.claimed && (hpQ || !(e.kind === 'note' && e.data && e.data.i >= 12))).map((e) => ({ id: e.id, from: e.from, kind: e.kind, data: e.data, day: e.day }));
        if (!hpQ) return send(200, { events });
        const acts = srv.acts.filter((a) => !a.claimed).sort((a, b) => (a.kind === 'sleep') - (b.kind === 'sleep') || a.id - b.id).slice(0, 30).map((a) => ({ id: a.id, from: a.from, kind: a.kind, data: a.data, day: a.day }));
        return send(200, { events, acts, hp: 1 });
      }
      if (method === 'POST' && path === '/friends/inbox/claim') {
        srv.claims = (srv.claims || 0) + 1; srv.claimBodies.push(body); if (srv.failClaim) throw new TypeError('Failed to fetch');
        if ('acts' in body && (!srv.hp || !Array.isArray(body.acts) || body.acts.length > 30)) return send(400, { error: 'bad' }); // the v2.32 Worker takes ids only
        (body.ids || []).forEach((id) => { const e = srv.events.find((x) => x.id === id); if (e) e.claimed = true; });
        (body.acts || []).forEach((id) => { const a = srv.acts.find((x) => x.id === id); if (a) a.claimed = true; });
        return send(200, { ok: true });
      }
      if (method === 'GET' && path === '/friends/yard') {
        const who = u.searchParams.get('fid'); srv.visits.push(who);
        if (!srv.friends.some((f) => f.fid === who)) return send(404, { error: 'not_found' });
        return send(200, { yard: srv.yardOf[who] || null });
      }
      if (method === 'POST' && path === '/friends/send') {
        srv.sends = (srv.sends || 0) + 1;
        if (srv.failSend) throw new TypeError('Failed to fetch'); // part 4: a network error on the send only
        const f = srv.friends.find((x) => x.fid === body.fid);
        const hpK = srv.hp && HP_KINDS.includes(body.kind);
        if (!f || !(['pet', 'note', 'gift', 'walk'].includes(body.kind) || hpK)) return send(400, { error: 'bad' });
        if (body.kind === 'note' && !(Number.isInteger(body.data && body.data.i) && body.data.i >= 0 && body.data.i < (srv.hp ? 13 : 12))) return send(400, { error: 'bad' });
        if (hpK) { // v2.33, as the Worker's hpData: bowl/water nothing, wish { w } or { w: 2, a }, sleep { dog }; a help once per friend a day, a sleepover once a day in all
          const d = body.data, ks = d && typeof d === 'object' && !Array.isArray(d) ? Object.keys(d) : null;
          const okD = body.kind === 'bowl' || body.kind === 'water' ? d === undefined || d === null || (ks && !ks.length)
            : body.kind === 'wish' ? !!ks && ks.includes('w') && ks.every((k) => k === 'w' || k === 'a') && [0, 1, 2].includes(d.w) && (d.w !== 2 || 'a' in d) && (!('a' in d) || (d.w === 2 && Number.isInteger(d.a) && d.a >= 0 && d.a < 47)) // a snack wish always carries its treat
              : !!ks && ks.length === 1 && ks[0] === 'dog' && !!d.dog && Number.isInteger(d.dog.b) && Number.isInteger(d.dog.n) && !('name' in d.dog);
          if (!okD) return send(400, { error: 'bad' });
          if (body.kind === 'sleep' ? srv.sent.some((s) => s.kind === 'sleep') : srv.sent.some((s) => s.fid === body.fid && s.kind === body.kind)) return send(400, { error: 'limit' });
          srv.sent.push({ fid: body.fid, kind: body.kind, data: body.data }); f.sent[body.kind] = true;
          return send(200, { ok: true });
        }
        if (body.kind === 'gift' && !(body.data && Number.isInteger(body.data.i) && body.data.i >= 0 && body.data.i < 47 && body.data.n === 1)) return send(400, { error: 'bad' });
        if (body.kind === 'gift' && srv.sent.some((s) => s.kind === 'gift')) return send(400, { error: 'limit' }); // one gift a day in all (from_id, kind, day)
        if (body.kind === 'walk') { // part 5, as the Worker's frWalk: { dog, mine, t? }, dog inside their snapshot, mine a card dog, t a gift index
          const d = body.data || {}, ks = Object.keys(d), snap = srv.yardOf[body.fid];
          if (!snap || !ks.includes('dog') || !ks.includes('mine') || ks.some((k) => !['dog', 'mine', 't'].includes(k)) || !Number.isInteger(d.dog) || d.dog < 0 || d.dog >= snap.dogs.length) return send(400, { error: 'bad' });
          if (!d.mine || typeof d.mine !== 'object' || !Number.isInteger(d.mine.b) || d.mine.b < 0 || !Number.isInteger(d.mine.n) || 'name' in d.mine) return send(400, { error: 'bad' });
          if ('t' in d && !(Number.isInteger(d.t) && d.t >= 0 && d.t < 47)) return send(400, { error: 'bad' });
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

module.exports = { mockInit };
