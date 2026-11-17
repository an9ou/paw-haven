// v2.30 "Better together" (V230.md 2, 3 and 6): the Worker's /invite/* and /town/goal routes against a local D1 (cloudflare/d1_node.js).
//   node game/test_v230_worker.js      (or: node game/run_tests.js v230_worker)
// Invite join (guest -> later, email -> now, used, not_new, not friends, self, the per-IP day cap), the gifts list (mine, joined only email
// accounts, the cap of 10, the guest shape, no ids), DC_LIM.outfit 59; the town goal (bad n, the 2-minute gap, the per-account and per-IP
// daily caps, took, month totals, done at the goal, last month, GET without a token), tidy(). Prints ALL OK when every check passes.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const sec = (s) => console.log('--- ' + s);

(async () => {
  const t0 = Date.now();
  try {
    const { d1 } = require(path.join(ROOT, 'cloudflare', 'd1_node.js'));
    const worker = (await import(path.join(ROOT, 'cloudflare', 'worker.js'))).default;
    const DB = d1();
    DB.raw.exec(fs.readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8'));
    const env = { DB, TIDY: '1', RATE_SCALE: '1' };
    let ipN = 0;
    const freshIp = () => '10.30.' + ((++ipN >> 8) & 255) + '.' + (ipN & 255);
    const call = async (method, p, body, token, ip) => {
      const h = { 'CF-Connecting-IP': ip || freshIp() }; if (token) h.Authorization = 'Bearer ' + token;
      let b; if (body !== null && body !== undefined) { b = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
      const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' ? undefined : b }), env, { waitUntil() {} });
      const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
      return { status: res.status, text, json };
    };
    const n = (sql, ...a) => DB.raw.prepare(sql).get(...a).n;
    const is = (r, status, err) => r.status === status && r.json && r.json.error === err;
    let accN = 0, nameN = 0;
    // a player with a friend id: a guest, or (email) a guest upgraded to an email account. age: days since the account was made
    const player = async (email, age) => {
      const g = (await call('POST', '/guest', {})).json; let tok = g.token, id = g.user.id;
      if (email) { const r = (await call('POST', '/register', { email: 'bt' + (++accN) + '@example.com', password: 'pupper123' }, tok)).json; tok = r.token; id = r.user.id; }
      DB.raw.prepare('update users set created_at = ? where id = ?').run(Date.now() - (age || 0) * 864e5, id);
      const me = (await call('POST', '/friends/me', { name: [++nameN % 40, (nameN * 7) % 40] }, tok)).json;
      return { tok, id, code: me.code, name: me.name };
    };
    const befriend = async (a, b) => (await call('POST', '/friends/add', { code: b.code }, a.tok)).status === 200;
    const join = (a, code, ip) => call('POST', '/invite/join', { code }, a.tok, ip);

    sec('1. invite join');
    const A = await player(true, 30); // the inviter: an email account, a month old
    const B = await player(false, 0); // a new guest
    let r = await call('POST', '/invite/join', { code: A.code });
    ok(is(r, 401, 'no_session'), 'no token: 401');
    r = await join(B, A.code);
    ok(is(r, 404, 'not_found'), 'not friends yet: 404 not_found (' + r.text + ')');
    ok(await befriend(B, A), 'B adds A');
    ok(is(await call('POST', '/invite/join', { code: A.code, x: 1 }, B.tok), 400, 'bad'), 'extra keys: 400 bad');
    ok(is(await join(B, 'DOG-ZZZZZ'), 404, 'not_found'), 'an unknown code: 404');
    ok(is(await join(B, B.code), 400, 'self'), 'my own code: 400 self');
    r = await join(B, A.code);
    ok(r.status === 200 && r.json.ok && r.json.gift === 'later', 'a new guest: 200 gift later (' + r.text + ')');
    ok(is(await join(B, A.code), 409, 'used'), 'twice: 409 used');
    ok(n('select count(*) as n from invites where new_id = ? and inviter_id = ?', B.id, A.id) === 1, 'one row');
    const C = await player(true, 1); ok(await befriend(C, A), 'C adds A');
    r = await join(C, A.code);
    ok(r.status === 200 && r.json.gift === 'now', 'a new email account: gift now');
    const Old = await player(true, 8); ok(await befriend(Old, A), 'Old adds A');
    ok(is(await join(Old, A.code), 409, 'not_new'), 'an account older than 7 days: 409 not_new');
    const N1 = await player(true, 2), N2 = await player(true, 1); ok(await befriend(N1, N2), 'two new players');
    ok(is(await join(N1, N2.code), 409, 'not_new'), 'the inviter newer than me: 409 not_new');
    ok(n('select count(*) as n from invites where new_id in (?, ?)', Old.id, N1.id) === 0, 'no rows for refused joins');
    // the per-IP day cap: 5 new rows a Japan day from one IP
    const ip = '10.99.0.1'; const inv = await player(true, 40); let got = 0, cap = null;
    for (let i = 0; i < 6; i++) { const p = await player(false, 0); await befriend(p, inv); const x = await join(p, inv.code, ip); if (x.status === 200) got++; else cap = x; }
    ok(got === 5 && cap && is(cap, 429, 'rate_limited'), 'the 6th new player from one IP in a day: 429 (' + got + ')');

    sec('2. gifts');
    r = await call('GET', '/invite/gifts', null, A.tok);
    ok(r.status === 200 && r.json.mine === null && Array.isArray(r.json.joined) && r.json.joined.length === 1, 'A: joined lists only the new email account (C), not the guest B: ' + r.text);
    ok(r.json.joined[0] && Array.isArray(r.json.joined[0].name) && r.json.joined[0].name[0] === C.name[0], 'joined carries the friend name');
    ok(!/"id"|user_id|email|@/.test(r.text), 'no ids or emails in the answer');
    r = await call('GET', '/invite/gifts', null, C.tok);
    ok(r.status === 200 && r.json.mine && r.json.mine.name[0] === A.name[0] && r.json.mine.name[1] === A.name[1], 'C: mine is A');
    r = await call('GET', '/invite/gifts', null, B.tok);
    ok(r.status === 200 && r.json.guest === true && r.json.mine === 1 && r.json.joined === 0 && !r.json.name, 'B (guest): { guest, mine: 1, joined: 0 } ' + r.text);
    // B turns on cloud save: now A sees B too, and B's gift is mine
    const up = (await call('POST', '/register', { email: 'bt-b@example.com', password: 'pupper123' }, B.tok)).json; B.tok = up.token;
    r = await call('GET', '/invite/gifts', null, A.tok);
    ok(r.json.joined.length === 2, 'B upgraded: A has 2 joined');
    r = await call('GET', '/invite/gifts', null, B.tok);
    ok(r.json.mine && !r.json.guest, 'B upgraded: mine is an object now');
    // the inviter's cap: 10 credits
    const Z = await player(true, 60);
    for (let i = 0; i < 12; i++) { const p = await player(true, 0); await befriend(p, Z); const x = await join(p, Z.code); ok(x.status === 200 && x.json.gift === 'now', 'new player ' + (i + 1) + ' still gets theirs'); }
    r = await call('GET', '/invite/gifts', null, Z.tok);
    ok(r.json.joined.length === 10, 'the inviter counts at most 10: ' + r.json.joined.length);

    sec('3. Dog Cards: outfit 58 (the Friendship Bandana) is allowed, 59 not');
    const src = fs.readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8');
    ok(/outfit: 59 \}/.test(src), 'DC_LIM.outfit 59');
    const gsrc = fs.readFileSync(path.join(ROOT, 'game', 'src', '40_dogcards.js'), 'utf8');
    const list = gsrc.match(/const DC_OUTFITS = \[([\s\S]*?)\];/)[1].replace(/\/\/[^\n]*/g, '').match(/'[^']*'/g);
    ok(list.length === 59 && list[58] === "'Friendship Bandana'", 'the game list is 59 long and ends with the Friendship Bandana: ' + list.length);

    sec('4. town goal: posts');
    const G = await player(false, 0), H = await player(true, 3);
    ok(is(await call('POST', '/town/goal', { n: 5 }), 401, 'no_session'), 'POST needs a token');
    for (const b of [{ n: 0 }, { n: 41 }, { n: 2.5 }, { n: '3' }, { n: 3, x: 1 }, {}]) ok(is(await call('POST', '/town/goal', b, G.tok), 400, 'bad'), 'bad n: ' + JSON.stringify(b));
    r = await call('POST', '/town/goal', { n: 12 }, G.tok);
    const month = r.json && r.json.month;
    ok(r.status === 200 && r.json.took === 12 && r.json.n === 12 && r.json.mine === 12 && r.json.goal === 10000 && !r.json.done && /^\d{4}-\d{2}$/.test(month), 'a guest posts 12: ' + r.text);
    ok(is(await call('POST', '/town/goal', { n: 3 }, G.tok), 429, 'rate_limited'), 'a second post within 2 minutes: 429');
    const gap = () => DB.raw.prepare("delete from rate where k like 'gl:post:%'").run(); // the 2-minute gap passes
    gap(); r = await call('POST', '/town/goal', { n: 30 }, H.tok);
    ok(r.json.took === 30 && r.json.n === 42 && r.json.mine === 30, 'H adds 30: the town has 42');
    // per-account day cap 150
    let took = 0; for (let i = 0; i < 6; i++) { gap(); const x = await call('POST', '/town/goal', { n: 40 }, H.tok); took += x.json.took; }
    ok(took === 120 && n('select n from town_goal_users where user_id = ?', H.id) === 150, 'one account takes at most 150 a day: ' + took);
    gap(); r = await call('POST', '/town/goal', { n: 10 }, H.tok);
    ok(r.status === 200 && r.json.took === 0, 'over the cap: 200 took 0');
    // per-IP day cap 600 (many guests on one IP)
    const ip2 = '10.98.0.2'; let ipTook = 0;
    for (let i = 0; i < 6; i++) { const p = await player(false, 0); for (let k = 0; k < 4; k++) { gap(); const x = await call('POST', '/town/goal', { n: 40 }, p.tok, ip2); ipTook += x.json.took; } }
    ok(ipTook === 600, 'one IP takes at most 600 a day: ' + ipTook);

    sec('5. town goal: done, last month, GET');
    DB.raw.prepare('update town_goal set n = 9990 where month = ?').run(month);
    gap(); r = await call('POST', '/town/goal', { n: 20 }, G.tok);
    ok(r.json.done === true && r.json.n === 10010, 'reaching the goal: done ' + r.text);
    ok(n('select count(*) as n from town_goal where month = ? and done_at is not null', month) === 1, 'done_at set');
    r = await call('GET', '/town/goal');
    ok(r.status === 200 && r.json.month === month && r.json.done && r.json.mine === 0 && r.json.last && r.json.last.n === 0 && !r.json.last.done, 'GET without a token: mine 0, last month empty ' + r.text);
    r = await call('GET', '/town/goal', null, G.tok);
    ok(r.json.mine === 32, 'GET with a token: mine 32');
    const y = +month.slice(0, 4), m = +month.slice(5, 7), prev = m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0');
    DB.raw.prepare('insert into town_goal (month, n, goal, done_at) values (?, 51000, 50000, 1)').run(prev);
    DB.raw.prepare('insert into town_goal_users (month, user_id, n) values (?, ?, 7)').run(prev, G.id);
    r = await call('GET', '/town/goal', null, G.tok);
    ok(r.json.last.month === prev && r.json.last.done && r.json.last.mine === 7, 'last month: done and mine 7');
    ok(!/user_id|email|"id"/.test(r.text), 'no ids in the answer');
    const env2 = Object.assign({}, env, { TOWN_GOAL: '1234' });
    DB.raw.prepare("delete from town_goal where month = '2000-01'").run();
    const res = await worker.fetch(new Request('https://api.test/town/goal', { method: 'GET', headers: { 'CF-Connecting-IP': freshIp() } }), env2, { waitUntil() {} });
    ok((await res.json()).goal === 10000, 'a month that has started keeps its goal; TOWN_GOAL only sets new months');

    sec('6. tidy');
    DB.raw.prepare('delete from users where id = ?').run(C.id);
    DB.raw.prepare('delete from users where id = ?').run(G.id);
    await call('GET', '/town/goal'); // btTidy runs from the v2.30 routes (every time under TIDY)
    ok(n('select count(*) as n from invites where new_id = ?', C.id) === 0, 'a deleted account: its invite row goes');
    ok(n('select count(*) as n from town_goal_users where user_id = ?', G.id) === 0, 'and its town goal rows');
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  console.log(`${passes} passed, ${fails} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
