// v2.33 "Helping paws" (V233.md 1, 2 and 13): the Worker's friend_acts against a local D1 (cloudflare/d1_node.js).
//   node game/test_v233_worker.js      (or: node game/run_tests.js v233_worker)
// The gate shut = the v2.32 answers (no hp, the new kinds, note 12 and a snapshot's hp are bad, ?hp=1 gives no acts, acts in a claim is bad);
// open: each help once per friend per Japan day, one sleepover a day in all, the data shapes, friends only and block = not_found, the official
// account's rows born claimed, the sent flags, the snapshot's hp (checks and round trip), the inbox's acts (helps before sleeps, 30, no user ids),
// notes from 12 on hidden from a game without ?hp=1, the claim with and without acts (idempotent, only my own), remove/block/leave, the 30-day
// delete, frTidy, the shared send bucket, and the Worker's HP_FROM = the game's; a repeat or a race through the Worker is 400 limit, never a 500
// (11); every friend_acts / friend_events query the friends routes run plans as an index SEARCH, never a SCAN (12). Prints ALL OK when every check passes.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const sec = (s) => console.log('--- ' + s);
const jst = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);

(async () => {
  const t0 = Date.now();
  try {
    const { d1 } = require(path.join(ROOT, 'cloudflare', 'd1_node.js'));
    const worker = (await import(path.join(ROOT, 'cloudflare', 'worker.js'))).default;
    const DB = d1();
    const env = { DB, TIDY: '1', RATE_SCALE: '1', HP_FROM: '0' }; // HP_FROM '0': the Helping paws gate open (section 0 runs it shut)
    let ipN = 0;
    const freshIp = () => '10.33.' + ((++ipN >> 8) & 255) + '.' + (ipN & 255);
    const call = async (method, p, body, token, gate) => {
      const h = { 'CF-Connecting-IP': freshIp() }; if (token) h.Authorization = 'Bearer ' + token;
      let b; if (body !== null && body !== undefined) { b = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
      const e2 = Object.assign({}, env); if (gate === undefined) { /* open */ } else if (gate === null) delete e2.HP_FROM; else e2.HP_FROM = gate;
      const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' ? undefined : b }), e2, { waitUntil() {} });
      const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
      return { status: res.status, text, json };
    };
    const shut = (method, p, body, token) => call(method, p, body, token, 'off');
    const n = (sql, ...a) => DB.raw.prepare(sql).get(...a).n;
    const is = (r, status, err) => r.status === status && r.json && r.json.error === err;
    const good = (r) => r.status === 200 && r.json && r.json.ok === true;
    let nameN = 0;
    const player = async () => {
      const g = (await call('POST', '/guest', {})).json;
      const me = (await call('POST', '/friends/me', { name: [++nameN % 40, (nameN * 7) % 40] }, g.token)).json;
      return { tok: g.token, id: g.user.id, fid: me.fid, code: me.code, name: me.name };
    };
    const befriend = async (a, b) => (await call('POST', '/friends/add', { code: b.code }, a.tok)).status === 200;
    const send = (a, b, kind, data, gate) => call('POST', '/friends/send', data === undefined ? { fid: b.fid, kind } : { fid: b.fid, kind, data }, a.tok, gate);
    const dog = { b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 };
    const yard = (more) => Object.assign({ v: 1, name: [0, 0], house: 2, season: 'winter', dogs: [dog], decor: [] }, more || {});
    const today = jst(Date.now());
    const acts = (uid) => DB.raw.prepare('select * from friend_acts where to_id = ? order by id').all(uid);

    sec('0. the gate: the same date as the game, shut = the v2.32 Worker');
    {
      const src = fs.readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8'), game = fs.readFileSync(path.join(ROOT, 'game', 'src', '60_helps.js'), 'utf8');
      const w = (src.match(/^const HP_FROM = '([^']*)';/m) || [])[1], g = (game.match(/^const HP_FROM = '([^']*)';/m) || [])[1];
      ok(w !== undefined && g !== undefined && w === g, 'the Worker\'s HP_FROM is the game\'s HP_FROM (' + JSON.stringify(w) + ' / ' + JSON.stringify(g) + ')');
      ok(w === '' || /^\d{4}-\d{2}-\d{2}$/.test(w), 'HP_FROM is \'\' (no launch date) or a YYYY-MM-DD');
      const wl = (src.match(/const HP_LIM = \{ wish: (\d+) \}/) || [])[1], wg = (game.match(/^const HP_WISH = \[([^\]]*)\]/m) || [])[1];
      ok(!!wl && !!wg && +wl === wg.split(',').length, 'HP_LIM.wish is the length of the game\'s HP_WISH (' + wl + ')');
      ok(/const HP_WISH_DO = \[0, 1, 2\]/.test(src) && /const HP_WISH_DO = \[0, 1, 2\]/.test(game), 'HP_WISH_DO is [0, 1, 2] on both sides');
      ok(/const HP_KINDS = \['bowl', 'water', 'wish', 'sleep'\]/.test(src) && /const HP_KINDS = \['bowl', 'water', 'wish', 'sleep'\]/.test(game), 'HP_KINDS match');
      ok(/const FR_LIM = \{ notes: 13,/.test(src) && /const FR_NOTES_OLD = 12;/.test(src), 'FR_LIM.notes 13, FR_NOTES_OLD 12');
      ok(/v2\.33 "Helping paws"[\s\S]*GET  \/friends\/inbox\?hp=1/.test(src.slice(0, 12000)), 'the header comment block lists the new shapes');
    }
    const A = await player(), B = await player(), C = await player();
    ok(await befriend(A, B) && await befriend(A, C), 'A is friends with B and C');
    {
      for (const gate of ['off', null, String(Date.now() + 3600e3), new Date(Date.now() + 3600e3).toISOString()]) {
        const r = await call('GET', '/friends', undefined, A.tok, gate);
        const row = r.json && r.json.friends && r.json.friends[0];
        ok(r.status === 200 && !('hp' in r.json) && row && Object.keys(row.sent).sort().join() === 'gift,note,pet,walk', 'shut (' + gate + '): GET /friends has no hp and the four v2.32 sent flags');
      }
      for (const [kind, data] of [['bowl', {}], ['water', undefined], ['wish', { w: 0 }], ['sleep', { dog }]]) ok(is(await shut('POST', '/friends/send', data === undefined ? { fid: B.fid, kind } : { fid: B.fid, kind, data }, A.tok), 400, 'bad'), 'shut: kind ' + kind + ' is 400 bad');
      ok(is(await shut('POST', '/friends/send', { fid: B.fid, kind: 'note', data: { i: 12 } }, A.tok), 400, 'bad'), 'shut: note 12 is 400 bad');
      ok(is(await shut('PUT', '/friends/yard', { yard: yard({ hp: { d: today, g: 1 } }) }, B.tok), 400, 'bad'), 'shut: a snapshot with hp is 400 bad');
      ok(good(await shut('PUT', '/friends/yard', { yard: yard() }, B.tok)), 'shut: the same snapshot without hp is ok');
      DB.raw.prepare('insert into friend_acts (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)').run(A.id, B.id, 'bowl', '{}', today, Date.now());
      const r = await shut('GET', '/friends/inbox?hp=1', undefined, A.tok);
      ok(r.status === 200 && Array.isArray(r.json.events) && Object.keys(r.json).join() === 'events', 'shut: ?hp=1 is ignored: { events } only, no acts, no hp');
      const aid = acts(A.id)[0].id;
      ok(is(await shut('POST', '/friends/inbox/claim', { ids: [], acts: [aid] }, A.tok), 400, 'bad'), 'shut: acts in a claim is 400 bad');
      ok(acts(A.id)[0].claimed_at === null, '... and nothing is claimed');
      ok(good(await shut('POST', '/friends/inbox/claim', { ids: [] }, A.tok)), 'shut: a v2.32 claim is ok');
      DB.raw.prepare('delete from friend_acts').run();
      ok(n('select count(*) as n from friend_acts') === 0, 'shut: no friend_acts rows were written');
      const p = await call('GET', '/friends', undefined, A.tok, '0');
      ok(p.json.hp === 1, 'env.HP_FROM \'0\' opens it');
      ok((await call('GET', '/friends', undefined, A.tok, String(Date.now() - 1000))).json.hp === 1, 'a past env.HP_FROM (ms) opens it');
      const brk = (await call('GET', '/friends', undefined, A.tok, 'not a date')).json.hp === 1, dflt = (await call('GET', '/friends', undefined, A.tok, null)).json.hp === 1;
      ok(brk === dflt, 'a broken env.HP_FROM falls back to the built-in date (open: ' + dflt + ')');
    }

    sec('1. GET /friends: hp and the sent flags');
    let r = await call('GET', '/friends', undefined, A.tok);
    ok(r.json.hp === 1 && r.json.friends.every((f) => Object.keys(f.sent).sort().join() === 'bowl,gift,note,pet,sleep,walk,water,wish' && Object.values(f.sent).every((v) => v === false)), 'open: hp: 1 and each row\'s sent has bowl, water, wish, sleep (all false)');

    sec('2. POST /friends/send: helps once per friend per day');
    ok(good(await send(A, B, 'bowl', {})), 'bowl with {} is ok');
    ok(is(await send(A, B, 'bowl', {}), 400, 'limit'), 'a second bowl to the same friend today: 400 limit');
    ok(good(await send(A, C, 'bowl')), 'bowl with no data is ok (a different friend)');
    ok(good(await send(A, B, 'water')), 'water is ok');
    ok(is(await send(A, B, 'water'), 400, 'limit'), 'a second water: limit');
    ok(good(await send(A, B, 'wish', { w: 0 })), 'wish { w: 0 } is ok');
    ok(is(await send(A, B, 'wish', { w: 1 }), 400, 'limit'), 'a second wish to the same friend (any w): limit');
    ok(good(await send(A, C, 'wish', { w: 2, a: 5 })), 'wish { w: 2, a: 5 } (a snack naming a food) is ok');
    r = await call('GET', '/friends', undefined, A.tok);
    const rowB = r.json.friends.find((f) => f.fid === B.fid), rowC = r.json.friends.find((f) => f.fid === C.fid);
    ok(rowB.sent.bowl && rowB.sent.water && rowB.sent.wish && !rowB.sent.sleep && !rowB.sent.pet, 'B\'s row: bowl, water, wish sent today: ' + JSON.stringify(rowB.sent));
    ok(rowC.sent.bowl && !rowC.sent.water && rowC.sent.wish, 'C\'s row: bowl and wish: ' + JSON.stringify(rowC.sent));
    ok(!(await call('GET', '/friends', undefined, B.tok)).json.friends[0].sent.bowl, 'B\'s own list shows nothing sent by B');

    sec('3. data shapes');
    const D = await player(); ok(await befriend(D, A), 'D is a friend of A');
    const bad = async (kind, data, m) => ok(is(await send(D, A, kind, data), 400, 'bad'), m);
    await bad('bowl', { x: 1 }, 'bowl with a key: bad');
    await bad('bowl', [], 'bowl with an array: bad');
    await bad('water', 'x', 'water with a string: bad');
    await bad('wish', undefined, 'wish with no data: bad');
    await bad('wish', {}, 'wish {}: bad');
    await bad('wish', { w: 3 }, 'wish w 3 (a walk: not doable by a visitor): bad');
    await bad('wish', { w: 12 }, 'wish w 12: bad');
    await bad('wish', { w: 13 }, 'wish w 13 (past HP_WISH): bad');
    await bad('wish', { w: -1 }, 'wish w -1: bad');
    await bad('wish', { w: 1.5 }, 'wish w 1.5: bad');
    await bad('wish', { w: '0' }, 'wish w "0": bad');
    await bad('wish', { w: 1, a: 5 }, 'a only with w 2: bad');
    await bad('wish', { w: 2 }, 'a snack wish names its treat: { w: 2 } without a is bad');
    await bad('wish', { w: 2, a: 47 }, 'a past FR_GIFTS: bad');
    await bad('wish', { w: 2, a: -1 }, 'a -1: bad');
    await bad('wish', { w: 0, z: 1 }, 'an extra key: bad');
    await bad('sleep', undefined, 'sleep with no data: bad');
    await bad('sleep', {}, 'sleep {}: bad');
    await bad('sleep', { dog: Object.assign({}, dog, { b: 99 }) }, 'sleep with a breed past the list: bad');
    await bad('sleep', { dog: Object.assign({}, dog, { name: 'Rex' }) }, 'sleep with a typed name: bad');
    await bad('sleep', { dog: Object.assign({}, dog, { c: { M: ['M', 'M'] } }) }, 'sleep with a double merle: bad');
    await bad('sleep', { dog, x: 1 }, 'sleep with an extra key: bad');
    await bad('hug', {}, 'an unknown kind: bad');
    await bad('note', { i: 13 }, 'note 13: bad');
    ok(n('select count(*) as n from friend_acts where from_id = ?', D.id) === 0, 'no row from a bad send');
    ok(good(await send(D, A, 'note', { i: 12 })), 'open: note 12 ("Thank you for helping!") is ok');
    ok(good(await send(D, A, 'wish', { w: 1 })), 'wish w 1 (ball) is ok');

    sec('4. sleepovers: one a day in all');
    ok(good(await send(A, B, 'sleep', { dog: Object.assign({}, dog, { e: 1, p: 12345 }) })), 'a sleepover with a card dog (eyes and pattern) is ok');
    ok(is(await send(A, C, 'sleep', { dog }), 400, 'limit'), 'a second sleepover today, to another friend: limit');
    ok(is(await send(A, B, 'sleep', { dog }), 400, 'limit'), 'and to the same friend: limit');
    const sl = DB.raw.prepare("select data from friend_acts where from_id = ? and kind = 'sleep'").get(A.id);
    ok(sl && JSON.parse(sl.data).dog.e === 1 && JSON.parse(sl.data).dog.p === 12345 && !('name' in JSON.parse(sl.data).dog), 'the stored dog is the Worker\'s own card shape');
    r = await call('GET', '/friends', undefined, A.tok);
    ok(r.json.friends.find((f) => f.fid === B.fid).sent.sleep && !r.json.friends.find((f) => f.fid === C.fid).sent.sleep, 'sent.sleep on B\'s row only');
    let threw = false; try { DB.raw.prepare('insert into friend_acts (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)').run(C.id, A.id, 'sleep', '{}', today, Date.now()); } catch (e) { threw = /unique/i.test(e.message); }
    ok(threw, 'the unique index friend_acts_sleep is the race backstop (from, day)');
    threw = false; try { DB.raw.prepare('insert into friend_acts (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)').run(B.id, A.id, 'bowl', '{}', today, Date.now()); } catch (e) { threw = /unique/i.test(e.message); }
    ok(threw, 'the unique index friend_acts_pair is the race backstop (from, to, kind, day)');

    sec('5. friends only, block, the official account');
    const E = await player();
    ok(is(await send(E, A, 'bowl', {}), 404, 'not_found'), 'not a friend: 404 not_found');
    ok(is(await send(A, A, 'bowl', {}), 404, 'not_found'), 'myself: 404 not_found');
    ok(await befriend(E, A), 'E adds A');
    ok(good(await call('POST', '/friends/block', { fid: E.fid }, A.tok)), 'A blocks E');
    ok(is(await send(E, A, 'water'), 404, 'not_found'), 'blocked: 404 not_found');
    const O = await player(); DB.raw.prepare('update users set official = 1 where id = ?').run(O.id);
    const F = await player(); ok(await befriend(F, O), 'F adds the official account');
    ok(good(await send(F, O, 'bowl', {})) && good(await send(F, O, 'sleep', { dog })), 'a help and a sleepover to the official account: ok');
    ok(acts(O.id).length === 2 && acts(O.id).every((x) => x.claimed_at > 0), 'its rows are born claimed');
    ok(is(await send(F, O, 'bowl', {}), 400, 'limit') && is(await send(F, O, 'sleep', { dog }), 400, 'limit'), 'the limits hold (a second bowl; a second sleepover)');
    r = await call('GET', '/friends/inbox?hp=1', undefined, O.tok);
    ok(r.json.hp === 1 && r.json.acts.length === 0, 'nothing is delivered to the official account');

    sec('6. the snapshot\'s hp');
    const putY = (who, more) => call('PUT', '/friends/yard', { yard: yard(more) }, who.tok);
    ok(good(await putY(B, { hp: { d: today, g: 2 } })), 'hp { d, g } is ok');
    ok(good(await putY(C, { hp: { d: today, g: 0, w: 2, a: 7 } })), 'hp { d, g, w: 2, a } is ok');
    ok(good(await putY(D, { hp: { d: today, g: 6, w: 12 } })), 'hp w 12 (a wish for home) is ok');
    for (const [h, m] of [[{ d: today, g: 7 }, 'g 7'], [{ d: today, g: -1 }, 'g -1'], [{ d: 'today', g: 1 }, 'd not a date'], [{ g: 1 }, 'no d'], [{ d: today }, 'no g'],
      [{ d: today, g: 1, w: 13 }, 'w 13'], [{ d: today, g: 1, a: 3 }, 'a without w'], [{ d: today, g: 1, w: 1, a: 3 }, 'a with w 1'], [{ d: today, g: 1, w: 2, a: 47 }, 'a 47'],
      [{ d: today, g: 1, x: 1 }, 'an extra key'], [null, 'null'], [[], 'an array'], ['x', 'a string']]) ok(is(await putY(E, { hp: h }), 400, 'bad'), 'hp ' + m + ': 400 bad');
    r = await call('GET', '/friends/yard?fid=' + C.fid, undefined, A.tok);
    ok(r.json.yard && JSON.stringify(r.json.yard.hp) === JSON.stringify({ d: today, g: 0, w: 2, a: 7 }), 'GET /friends/yard returns it: ' + JSON.stringify(r.json.yard && r.json.yard.hp));
    r = await call('GET', '/friends/yard?fid=' + C.fid, undefined, A.tok, 'off');
    ok(r.json.yard && !('hp' in r.json.yard) && r.json.yard.dogs.length === 1, 'shut again (a rollback): the stored yard comes back without hp');
    ok(good(await putY(C)), 'a snapshot without hp is still ok');
    r = await call('GET', '/friends/yard?fid=' + C.fid, undefined, A.tok);
    ok(r.json.yard && !('hp' in r.json.yard), '... and replaces the one with hp');
    ok((await call('GET', '/friends', undefined, A.tok)).json.friends.find((f) => f.fid === B.fid).dogs.length === 1, 'GET /friends still reads the dogs of a snapshot with hp');
    // the rollback (V233.md 2a): env HP_FROM=off with yards that carry hp. Each is still visited and listed, as the v2.32 answer
    r = await call('GET', '/friends/yard?fid=' + B.fid, undefined, A.tok, 'off');
    ok(r.status === 200 && r.json.yard && !('hp' in r.json.yard) && r.json.yard.dogs.length === 1 && r.json.yard.v === 1, 'shut: B\'s stored yard with hp { d, g } is served without hp');
    r = await call('GET', '/friends', undefined, A.tok, 'off');
    ok(r.status === 200 && !('hp' in r.json) && r.json.friends.find((f) => f.fid === B.fid).dogs.length === 1, 'shut: GET /friends still lists the dogs of a yard with hp');
    ok(JSON.parse(DB.raw.prepare('select data from yards where user_id = ?').get(B.id).data).hp.g === 2, '... and the stored hp is kept for when the gate opens again');

    sec('7. the inbox: acts, their order, old copies');
    r = await call('GET', '/friends/inbox?hp=1', undefined, B.tok);
    ok(r.status === 200 && r.json.hp === 1 && Array.isArray(r.json.acts) && Array.isArray(r.json.events), 'with ?hp=1: { events, acts, hp: 1 }');
    const kindsB = r.json.acts.map((a) => a.kind);
    ok(kindsB.join() === 'bowl,water,wish,sleep', 'helps first, then the sleepover: ' + kindsB.join());
    const a0 = r.json.acts[0];
    ok(Object.keys(a0).sort().join() === 'data,day,from,id,kind' && a0.from.fid === A.fid && JSON.stringify(a0.from.name) === JSON.stringify(A.name) && a0.day === today && Number.isInteger(a0.id), 'each act: { id, from: { fid, name }, kind, data, day }');
    ok(JSON.stringify(r.json.acts[2].data) === '{"w":0}' && r.json.acts[3].data.dog.b === 0, 'data as sent (wish { w }, sleep { dog })');
    ok(![A.id, B.id, C.id].some((id) => r.text.includes(id)), 'no user id in the answer');
    r = await call('GET', '/friends/inbox', undefined, B.tok);
    ok(Object.keys(r.json).join() === 'events', 'without ?hp=1: { events } only');
    r = await call('GET', '/friends/inbox?hp=0', undefined, B.tok);
    ok(Object.keys(r.json).join() === 'events', '?hp=0: { events } only');
    // notes from 12 on: hidden from an older game
    let ev = (await call('GET', '/friends/inbox', undefined, A.tok)).json.events;
    ok(!ev.some((e) => e.kind === 'note' && e.data.i >= 12), 'without ?hp=1 note 12 is left out (an older game knows 12 notes): ' + JSON.stringify(ev.map((e) => e.kind + (e.data && e.data.i !== undefined ? e.data.i : ''))));
    ev = (await call('GET', '/friends/inbox?hp=1', undefined, A.tok)).json.events;
    ok(ev.some((e) => e.kind === 'note' && e.data.i === 12), 'with ?hp=1 it is there');
    // the limit of 30, helps before sleeps even when the sleeps are older
    const G = await player(), mk = DB.raw.prepare('insert into friend_acts (to_id, from_id, kind, data, day, created_at) values (?, ?, ?, ?, ?, ?)');
    for (let i = 0; i < 5; i++) mk.run(G.id, A.id, 'sleep', JSON.stringify({ dog }), '2026-01-0' + (i + 1), Date.now() - 1000);
    for (let i = 0; i < 40; i++) mk.run(G.id, A.id, 'bowl', '{}', '2025-' + String(1 + (i % 12)).padStart(2, '0') + '-' + String(1 + Math.floor(i / 12)).padStart(2, '0'), Date.now() - 500);
    r = await call('GET', '/friends/inbox?hp=1', undefined, G.tok);
    ok(r.json.acts.length === 30 && r.json.acts.every((a) => a.kind === 'bowl'), 'at most 30, and the helps come before the (older) sleepovers');
    const ids30 = r.json.acts.map((a) => a.id);
    ok(ids30.every((x, i) => !i || x > ids30[i - 1]), 'oldest first within the helps');

    sec('8. the claim');
    r = await call('GET', '/friends/inbox?hp=1', undefined, B.tok);
    const bIds = r.json.acts.map((a) => a.id), bEv = r.json.events.map((e) => e.id);
    ok(good(await call('POST', '/friends/inbox/claim', { ids: bEv }, B.tok)) && acts(B.id).every((x) => x.claimed_at === null), 'a claim without acts leaves the acts alone');
    ok(good(await call('POST', '/friends/inbox/claim', { ids: [], acts: bIds.slice(0, 2) }, B.tok)), 'a claim with acts is ok');
    ok(acts(B.id).filter((x) => x.claimed_at).map((x) => x.id).join() === bIds.slice(0, 2).join(), 'just those two are claimed');
    const at1 = acts(B.id)[0].claimed_at;
    ok(good(await call('POST', '/friends/inbox/claim', { ids: [], acts: bIds.slice(0, 2) }, B.tok)) && acts(B.id)[0].claimed_at === at1, 'claiming again is ok and changes nothing (idempotent)');
    ok((await call('GET', '/friends/inbox?hp=1', undefined, B.tok)).json.acts.map((a) => a.id).join() === bIds.slice(2).join(), 'claimed acts leave the inbox');
    const gId = acts(G.id)[0].id;
    ok(good(await call('POST', '/friends/inbox/claim', { ids: [], acts: [gId] }, B.tok)) && acts(G.id)[0].claimed_at === null, 'another player\'s act id: ignored (only my own are claimed)');
    for (const [body, m] of [[{ ids: [], acts: 'x' }, 'acts not an array'], [{ ids: [], acts: [0] }, 'act id 0'], [{ ids: [], acts: [1.5] }, 'act id 1.5'], [{ ids: [], acts: Array.from({ length: 31 }, (_, i) => i + 1) }, '31 acts'], [{ acts: [1] }, 'no ids'], [{ ids: [], acts: [], x: 1 }, 'an extra key']])
      ok(is(await call('POST', '/friends/inbox/claim', body, B.tok), 400, 'bad'), 'claim with ' + m + ': 400 bad');
    ok(good(await call('POST', '/friends/inbox/claim', { ids: [], acts: [] }, B.tok)), 'empty acts: ok');

    sec('9. remove, block, leave');
    const H = await player(), I = await player();
    ok(await befriend(H, I), 'H and I are friends');
    ok(good(await send(H, I, 'bowl')) && good(await send(H, I, 'water')) && good(await send(I, H, 'bowl')) && good(await send(I, H, 'sleep', { dog })), 'helps both ways and a sleepover');
    const hiBowl = acts(I.id).find((x) => x.kind === 'bowl').id;
    ok(good(await call('POST', '/friends/inbox/claim', { ids: [], acts: [hiBowl] }, I.tok)), 'I claims H\'s bowl');
    ok(good(await call('POST', '/friends/remove', { fid: H.fid }, I.tok)), 'I removes H');
    ok(acts(I.id).map((x) => x.kind).join() === 'bowl' && acts(H.id).length === 0, 'the unclaimed acts between the two are gone both ways; the claimed bowl stays (it holds the day\'s limit)');
    ok(await befriend(H, I), 'friends again');
    ok(is(await send(H, I, 'bowl'), 400, 'limit'), 'the claimed bowl still holds today\'s limit');
    ok(good(await send(H, I, 'water')), 'the removed water can be sent again');
    ok(good(await call('POST', '/friends/block', { fid: I.fid }, H.tok)), 'H blocks I');
    ok(acts(I.id).filter((x) => x.claimed_at === null).length === 0, 'block deletes the unclaimed acts too');
    const J = await player(), K = await player();
    ok(await befriend(J, K) && good(await send(J, K, 'bowl')) && good(await send(K, J, 'water')), 'J and K help each other');
    const kBowl = acts(K.id)[0].id; await call('POST', '/friends/inbox/claim', { ids: [], acts: [kBowl] }, K.tok);
    ok(good(await call('POST', '/friends/leave', {}, J.tok)), 'J leaves Friends');
    ok(n('select count(*) as n from friend_acts where from_id = ? or to_id = ?', J.id, J.id) === 0, 'leave deletes my acts, sent and received (claimed too)');

    sec('10. the 30-day delete, frTidy, the send bucket');
    const old = Date.now() - 31 * 864e5;
    mk.run(B.id, C.id, 'water', '{}', '2000-01-01', old);
    mk.run(B.id, C.id, 'bowl', '{}', '2000-01-02', Date.now() - 29 * 864e5);
    await call('GET', '/friends/inbox', undefined, D.tok); // any inbox read, by anyone, with or without ?hp=1
    ok(n("select count(*) as n from friend_acts where day = '2000-01-01'") === 0 && n("select count(*) as n from friend_acts where day = '2000-01-02'") === 1, 'an inbox read deletes acts older than 30 days (every player\'s), and keeps a 29-day one');
    DB.raw.prepare('delete from users where id = ?').run(G.id);
    await call('GET', '/friends', undefined, A.tok); // frTidy runs on every friends request under TIDY
    ok(n('select count(*) as n from friend_acts where to_id = ?', G.id) === 0, 'frTidy: the acts of a deleted account go');
    const src = fs.readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8');
    ok(!/fr:hp|hp:send|frKey\.hp/.test(src), 'no new rate-limit bucket');
    const L = await player(), M = await player(); ok(await befriend(L, M), 'L and M are friends');
    await send(L, M, 'pet'); await send(L, M, 'bowl'); await send(L, M, 'water'); await send(L, M, 'wish', { w: 9 }); // the bad wish counts too: the bucket is checked before the data
    ok(n('select n from rate where k = ?', 'fr:send:' + L.id) === 4, 'pets and helps share the fr:send bucket (4 sends: ' + n('select n from rate where k = ?', 'fr:send:' + L.id) + ')');
    const sendLim = (src.match(/limited\(env, frKey\.send\(me\.id\), (\d+), 3600\)/) || [])[1];
    ok(sendLim === '60', 'the bucket is still 60 an hour');

    sec('11. a repeat and a race through the Worker: one ok, the rest 400 limit, never a 500');
    {
      const P = await player(), Q = await player(), R = await player(); ok(await befriend(P, Q) && await befriend(P, R), 'P is friends with Q and R');
      const tally = (rs) => ({ ok: rs.filter(good).length, limit: rs.filter((x) => is(x, 400, 'limit')).length, other: rs.filter((x) => !good(x) && !is(x, 400, 'limit')).map((x) => x.status + ' ' + x.text) });
      let t = tally([await send(P, Q, 'bowl'), await send(P, Q, 'bowl')]);
      ok(t.ok === 1 && t.limit === 1 && !t.other.length, 'the same help twice in a row: one ok, one limit ' + JSON.stringify(t));
      t = tally(await Promise.all([1, 2, 3].map(() => send(P, Q, 'water'))));
      ok(t.ok === 1 && t.limit === 2 && !t.other.length, 'the same help three times at once: one ok, two limit ' + JSON.stringify(t));
      t = tally(await Promise.all([Q, R, Q].map((to) => send(P, to, 'sleep', { dog }))));
      ok(t.ok === 1 && t.limit === 2 && !t.other.length, 'three sleepovers at once (two friends): one ok, two limit ' + JSON.stringify(t));
      ok(n("select count(*) as n from friend_acts where from_id = ? and kind in ('water', 'sleep')", P.id) === 2, 'one water row and one sleep row');
      // the race itself: the pre-check sees nothing (as when two sends pass it together), so the unique index answers
      const real = env.DB;
      env.DB = Object.assign({}, real, { prepare(sql) { return /^select id from (friend_acts|friend_events) where from_id/.test(sql) ? { bind() { return { async first() { return null; } }; } } : real.prepare(sql); } });
      try {
        for (const [to, kind, data] of [[Q, 'bowl'], [Q, 'water'], [R, 'sleep', { dog }], [Q, 'pet']]) {
          if (kind === 'pet') ok(good(await send(P, Q, 'pet')), 'a first pet (the v2.32 path) is ok');
          const x = await send(P, to, kind, data);
          ok(is(x, 400, 'limit'), 'past the pre-check, a repeat ' + kind + ' hits the unique index: 400 limit (' + x.status + ' ' + x.text + ')');
        }
      } finally { env.DB = real; }
    }

    sec('12. query plans: every friend_acts / friend_events query on the friends routes is an index SEARCH');
    {
      const seen = new Set(), real = env.DB;
      env.DB = Object.assign({}, real, { prepare(sql) { seen.add(sql); return real.prepare(sql); } });
      try {
        const S1 = await player(), S2 = await player(), S3 = await player(); await befriend(S1, S2); await befriend(S1, S3);
        await call('GET', '/friends', undefined, S1.tok);
        await send(S1, S2, 'bowl'); await send(S1, S2, 'wish', { w: 2, a: 3 }); await send(S1, S2, 'sleep', { dog }); await send(S1, S2, 'pet'); await send(S1, S2, 'gift', { i: 0 });
        await call('GET', '/friends/inbox?hp=1', undefined, S2.tok); await call('GET', '/friends/inbox', undefined, S2.tok);
        await call('POST', '/friends/inbox/claim', { ids: [1], acts: [1] }, S2.tok);
        await call('POST', '/friends/remove', { fid: S2.fid }, S1.tok); await call('POST', '/friends/block', { fid: S3.fid }, S1.tok);
        await call('POST', '/friends/leave', {}, S1.tok);
      } finally { env.DB = real; }
      // frTidy's 'not in (select id from users)' sweep reads every row on purpose (about 1 in 50 friends requests, every one under TIDY): left out
      const qs = [...seen].filter((q) => /\bfriend_(acts|events)\b/.test(q) && !/not in \(select id from users\)/.test(q));
      const need = ['select to_id, kind from friend_acts where from_id', 'select to_id, kind from friend_events where from_id', "from friend_acts where from_id = ?1 and kind = 'sleep'",
        "from friend_acts where from_id = ?1 and to_id = ?2", 'from friend_acts a join', 'update friend_acts set claimed_at', 'delete from friend_acts where claimed_at is null', 'delete from friend_acts where from_id = ?1 or to_id = ?1'];
      for (const k of need) ok(qs.some((q) => q.includes(k)), 'the run reached the query "' + k + '"');
      for (const q of qs) {
        const plan = DB.raw.prepare('explain query plan ' + q.replace(/\s+/g, ' ')).all().map((x) => x.detail);
        ok((plan.length || /^insert /.test(q.trim())) && !plan.some((d) => /^SCAN /.test(d)), 'no SCAN: ' + q.replace(/\s+/g, ' ').slice(0, 90) + ' -> ' + plan.join(' | '));
      }
    }
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  console.log(`${passes} passed, ${fails} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
