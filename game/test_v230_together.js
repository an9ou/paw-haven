// v2.30 "Better together" (V230.md 8): the game half, against the real Worker (cloudflare/worker.js on a local D1, game/cloud_mock.js).
//   1. gates: before the date (no prefs.btTest) nothing shows and no new route is asked; the NEWS date is the placeholder; migration adds S.fi / S.goal
//   2. the invite: a new guest comes in with ?friend=, adds the friend: the Worker records it, a kind "waiting" card and letter, no bandana yet
//   3. the guest turns on cloud save: the bandana arrives once (card, Wardrobe, Gerald's letter); a second look adds nothing
//   4. the inviter: the bandana and a letter for the first friend, a letter only for the next; a guest inviter gets the waiting letter
//   5. the bandana on the dog (screenshot) and its item card
//   6. town goal (58b_goal.js): the Square button and sheet, pets and walks counted, the batched post, the gift once, the "so close" letter
//   7. phone 360x640: the cards and the goal sheet fit, 44 px taps, no sideways scroll (screenshots in the scratchpad / test_logs)
// node game/run_tests.js v230_together
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const fs = require('fs'); const { makeServer, mockInit } = require('./cloud_mock');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const AUTH = 'pawhaven_cf_auth', LOGS = path.join(__dirname, 'test_logs');
const SHOTS = process.env.V230_SHOTS || LOGS;

run('v230_together', async (t) => {
  const { ok, sec, ev } = t;
  fs.mkdirSync(LOGS, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n) => { await t.sleep(700); return t.p.screenshot({ path: path.join(SHOTS, 'v230_' + n + '.png') }); };
  const srv = makeServer(), raw = srv.env.DB.raw;
  const api = async (method, p, body, tok) => { const r = await srv.handle(null, method, p, body === undefined ? undefined : JSON.stringify(body), tok ? 'Bearer ' + tok : null); return { status: r.status, json: srv.json(r.text) }; };
  let accN = 0;
  // a player made outside this page: a guest, or an email account; age in days; with a friend name and code
  const player = async (email, age, name) => {
    const g = (await api('POST', '/guest', {})).json; let tok = g.token, id = g.user.id;
    if (email) { const r = (await api('POST', '/register', { email: 'v230-' + (++accN) + '@example.com', password: 'pupper123' }, tok)).json; tok = r.token; id = r.user.id; }
    raw.prepare('update users set created_at = ? where id = ?').run(Date.now() - (age || 0) * 864e5, id);
    const me = (await api('POST', '/friends/me', { name: name || [3, 5] }, tok)).json;
    return { tok, id, code: me.code };
  };
  const cloudPage = async (o) => {
    o = o || {}; const was = t.ctx;
    await t.mk({ device: o.device, storage: o.storage, prefs: o.prefs || {} });
    await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a));
    await t.ctx.addInitScript(mockInit, {});
    if (was) await was.close();
    await t.p.goto(URL + (o.query || '')); await t.p.waitForSelector('#tGuest, #tNew, #tContinue, [data-ac="guest"]');
  };
  const newHere = async () => {
    await t.until((k) => !localStorage.getItem(k) || !!(window.__pawCloud && window.__pawCloud.CL.started && !window.__pawCloud.CL.startP), AUTH, 8000);
    if (!(await t.p.locator('#tNew').count())) { await t.p.click('[data-ac="guest"]'); await t.p.waitForSelector('#tNew'); }
    await t.adopt({}); await t.calm(); await t.lu();
    await t.until(() => !!(window.__pawCloud.CL.uid && window.__paw && window.__paw.fi), null, 8000);
  };
  const register = async (email) => {
    const tok0 = await ev((k) => JSON.parse(localStorage.getItem(k)).token, AUTH);
    const reg = (await api('POST', '/register', { email, password: 'pupper123' }, tok0)).json;
    await ev(([k, r]) => { localStorage.setItem(k, JSON.stringify({ token: r.token })); const C = window.__pawCloud.CL; C.email = r.user.email; C.anon = false; }, [AUTH, reg]);
    return reg;
  };
  const closeAll = () => ev(() => { for (let i = 0; i < 4; i++) { const x = document.querySelector('#modal:not([hidden]) .panel .x'); if (x) x.click(); } });
  const mailIds = () => ev(() => window.__paw.S.mail.map((m) => m.id));
  const has = () => ev(() => window.__paw.S.inv.clothes.includes('Friendship Bandana'));

  sec('1. gates and migration');
  await cloudPage({});
  await newHere();
  ok(await ev(() => !window.__paw.fi.on() && window.__paw.fi.mode() === 'off' && window.__paw.fi.line() === ''), 'before the date: off, no Friends line');
  ok(await ev(() => window.__paw.nw.v230Date() === '2099-01-01' && !window.__paw.nw.list().includes('2.30') && !window.__paw.nw.due('2.30')), 'NEWS 2.30 waits for its placeholder date (2099-01-01)');
  ok(srv.count(null, '/invite/') === 0 && srv.count(null, '/town/goal') === 0, 'no new route is asked before the date');
  ok(await ev(() => { const S = window.__paw.S; return S.fi && S.fi.link === '' && S.fi.join === '' && S.fi.n === 0; }) && await ev(() => { const g = window.__paw.S.goal; return g && g.q === 0 && Array.isArray(g.got) && g.miss === ''; }), 'a new save has S.fi and S.goal');
  ok(await ev(() => { const f = window.__paw.fi.fields({ v: 1 }).fi; return f.link === '' && f.join === '' && f.mine === 0 && f.n === 0 && f.wait === 0; }), 'fiFields fills an old save');
  ok(await ev(() => { const f = window.__paw.fi.fields({ fi: { n: 99, join: 'x', mine: 'yes' } }).fi; return f.n === 10 && f.join === '' && f.mine === 1; }), 'fiFields tidies odd values');

  sec('2. a new guest comes in through an invite link');
  const A = await player(true, 30, [7, 9]);
  await cloudPage({ prefs: { btTest: true, frTest: true }, query: '?friend=' + A.code });
  await newHere();
  ok(await ev(() => window.__paw.fi.on() && window.__paw.fi.mode() === 'guest'), 'btTest on: a guest');
  // the invite opens Friends after the title: pick a name, then the code is pre-filled
  ok(await t.until(() => !!document.getElementById('frOk') || !!document.getElementById('frCh0'), null, 10000), 'the invite opens Friends');
  if (await t.p.locator('#frOk').count()) { await t.p.click('#frOk'); await t.until(() => !!document.getElementById('frCh0'), null, 8000); }
  ok(await t.until(() => !!document.getElementById('fiLine'), null, 3000) && await ev(() => /you both get a Friendship Bandana/.test(document.getElementById('fiLine').textContent)), 'the Friends sheet: "Invite a new player: you both get a Friendship Bandana."');
  await t.p.click('#frAdd');
  ok(await t.until(() => !!document.querySelector('#modal .panel.fi-got #fiCloud'), null, 8000), 'the add went through: the kind "waiting" card with Turn on cloud save');
  await shot('wait_card_desktop');
  ok(await ev(() => window.__paw.S.fi.join === 'later' && window.__paw.S.fi.wait === 1 && window.__paw.S.fi.link === ''), 'S.fi: join later, wait 1');
  ok((await mailIds()).includes('fi_wait') && !(await has()), 'Gerald\'s waiting letter, no bandana yet');
  ok(raw.prepare('select count(*) as n from invites where inviter_id = ?').get(A.id).n === 1, 'the Worker has one invite row');
  await ev(() => document.getElementById('fiLater').click());
  await ev(() => window.__paw.fr.open()); await t.until(() => !!document.getElementById('fiLine'), null, 4000);
  ok(await ev(() => /waiting/.test(document.getElementById('fiLine').textContent)), 'the Friends line says the bandana is waiting');
  await closeAll();
  const joins = srv.count(null, '/invite/join');
  await ev(() => window.__paw.fi.join('DOG-AAAAA'));
  ok(srv.count(null, '/invite/join') === joins, 'a second join is never sent (one per save)');

  sec('3. the guest turns on cloud save: the bandana arrives once');
  await register('v230-b@example.com');
  const o3 = await ev(() => window.__paw.fi.poll());
  ok(o3 && o3.mine && o3.bandana && await has(), 'the poll gives the bandana: ' + JSON.stringify(o3));
  ok(await t.until(() => !!document.querySelector('#modal .panel.fi-got #fiOk'), null, 3000), 'the Better together! card');
  await shot('got_card_desktop');
  ok((await mailIds()).includes('fi_new') && await ev(() => /Welcome to town/.test(window.__paw.S.mail.find((m) => m.id === 'fi_new').title)), 'Gerald\'s Welcome to town! letter');
  await closeAll();
  const o3b = await ev(() => window.__paw.fi.poll());
  ok(o3b && !o3b.mine && !o3b.bandana && !o3b.joined.length && await ev(() => window.__paw.S.inv.clothes.filter((n) => n === 'Friendship Bandana').length === 1), 'a second look adds nothing');

  sec('4. the inviter');
  // this page now plays as A: the bandana out of the save, S.fi reset, A's login
  await ev(([k, tok]) => { const S = window.__paw.S; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Friendship Bandana'); S.fi = { link: '', join: '', mine: 0, n: 0, wait: 0 }; localStorage.setItem(k, JSON.stringify({ token: tok })); window.__pawCloud.CL.email = 'a@example.com'; window.__pawCloud.CL.anon = false; }, [AUTH, A.tok]);
  const o4 = await ev(() => window.__paw.fi.poll());
  ok(o4 && !o4.mine && o4.joined.length === 1 && o4.bandana && await has(), 'A: the first friend brings the bandana: ' + JSON.stringify(o4));
  ok((await mailIds()).includes('fi_host_1'), 'Gerald\'s letter fi_host_1');
  await closeAll();
  const C = await player(true, 0, [11, 12]);
  await api('POST', '/friends/add', { code: A.code }, C.tok); await api('POST', '/invite/join', { code: A.code }, C.tok);
  const o4b = await ev(() => window.__paw.fi.poll());
  ok(o4b && o4b.joined.length === 1 && !o4b.bandana && (await mailIds()).includes('fi_host_2') && await ev(() => window.__paw.S.fi.n === 2), 'the next friend: a letter only');
  await closeAll();
  const o4c = await ev(() => { const S = window.__paw.S; S.fi = { link: '', join: '', mine: 0, n: 0, wait: 0 }; S.mail = S.mail.filter((m) => m.id !== 'fi_wait'); return window.__paw.fi.apply({ guest: true, mine: 0, joined: 2 }, false); });
  ok(o4c.wait === 'host' && await ev(() => /joined Doodle Doggo through your invite/.test(window.__paw.S.mail.find((m) => m.id === 'fi_wait').text)), 'a guest inviter: the waiting letter says a new player joined');

  sec('5. the bandana on the dog and its card');
  await closeAll();
  await ev(() => { const S = window.__paw.S; S.fi.n = 2; S.outfit.neck = 'Friendship Bandana'; });
  await t.p.evaluate(() => window.__paw.redraw ? window.__paw.redraw() : null);
  await t.home('yard'); await t.sleep(500);
  await shot('dog_bandana');
  ok(await ev(() => { const a = window.PawArt.item ? window.PawArt.item('Friendship Bandana') : ''; return /<svg/.test(a); }), 'the item card draws');
  // a sheet of dogs wearing it (the art review): breeds, poses, a puppy, wet; and the item card
  await ev(() => {
    const A = window.PawArt, cells = [];
    [['beagle', 'idle'], ['shiba', 'sit'], ['lab', 'happy'], ['pug', 'walk'], ['husky', 'beg'], ['poodle', 'rollover'], ['dachs', 'eat'], ['samoyed', 'howl'], ['frenchie', 'down'], ['golden', 'jump']]
      .forEach(([k, pose], i) => { try { cells.push('<div style="width:170px;height:150px;display:inline-block">' + A.dog(k, { pose, outfit: { neck: 'Friendship Bandana' }, age: i === 3 ? 'puppy' : null, wet: i === 6 }) + '</div>'); } catch (e) { cells.push('<b>' + k + ' ' + e.message + '</b>'); } });
    cells.push('<div style="width:128px;height:128px;display:inline-block;background:#fff">' + A.item('Friendship Bandana') + '</div>');
    const d = document.createElement('div'); d.id = 'v230sheet'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fffaf0;padding:8px'; d.innerHTML = cells.join('');
    d.querySelectorAll('svg').forEach((s) => { s.style.width = '100%'; s.style.height = '100%'; }); document.body.appendChild(d);
  });
  await shot('bandana_sheet');
  ok(await ev(() => !document.querySelector('#v230sheet b')), 'every dog draws with the bandana');
  await ev(() => document.getElementById('v230sheet').remove());
  ok(await ev(() => /#A98BE3/i.test(document.querySelector('svg.world, #view').innerHTML)), 'the dog wears the lavender bandana in the yard');

  sec('6. the town goal');
  await ev(() => { window.__paw.S.outfit.neck = null; });
  ok(await ev(() => window.__paw.gl.on()), 'on: btTest and cloud here');
  const q0 = await ev(() => window.__paw.S.goal.q);
  await ev(() => window.__paw.gl.act('walk', { area: 'park' }));
  ok(await ev((q) => window.__paw.S.goal.q === q + 3, q0), 'a walk adds 3 belly rubs');
  await ev(() => window.__paw.gl.act('pet', { dogs: 2, ids: ['a', 'b'] }));
  ok(await ev((q) => window.__paw.S.goal.q === q + 5, q0), 'a pet of two dogs adds 2');
  const q1 = await ev(() => window.__paw.S.goal.q);
  ok(await t.pet(() => window.__paw.S.goal.q > 0), 'a real pet counts');
  // one batched POST: at most 40, and none again within 5 minutes
  const posts0 = srv.count(null, 'POST /town/goal');
  const d6 = await ev(() => { window.__paw.S.goal.at = 0; return window.__paw.gl.post(false); });
  const month = await ev(() => window.__paw.gl.month());
  ok(d6 && d6.took > 0 && d6.month === month && srv.count(null, 'POST /town/goal') === posts0 + 1, 'one POST sends what waits: ' + JSON.stringify(d6));
  ok(await ev(() => window.__paw.S.goal.q === 0), 'nothing waits after it');
  await ev(() => window.__paw.gl.add(10)); await ev(() => window.__paw.gl.post(false));
  ok(srv.count(null, 'POST /town/goal') === posts0 + 1 && await ev(() => window.__paw.S.goal.q === 10), 'within 5 minutes: no second POST, 10 wait');
  await ev(() => window.__paw.gl.add(500));
  ok(await ev(() => window.__paw.S.goal.q === 200), 'what waits is capped at 200');
  const row = raw.prepare('select n from town_goal where month = ?').get(month);
  ok(row && row.n === d6.took, 'the Worker counted it: ' + JSON.stringify(row));
  // the Square: the Town goal button and Gerald's notice
  await t.home('square');
  ok(await t.until(() => !!document.querySelector('#placeBtns [data-gl] .gl-mini'), null, 4000), 'the Square has a Town goal button with a tiny meter');
  await ev(() => document.querySelector('#placeBtns [data-gl]').click());
  ok(await t.until(() => !!document.querySelector('#modal .panel.gl-sheet .gl-bar'), null, 5000), 'the sheet: the meter');
  ok(await ev(() => { const t = document.querySelector('.gl-sheet').textContent; return /belly rubs/.test(t) && /You added/.test(t) && /treat bag/.test(t) && !/@|#1|top 10/i.test(t); }), 'the sheet: the goal, my part, the gift; no names or ranks');
  await shot('goal_sheet_desktop');
  await closeAll();
  // the town reaches the goal: the gift once
  raw.prepare('update town_goal set n = goal - 1 where month = ?').run(month);
  const food0 = await ev(() => Object.assign({}, window.__paw.S.inv.food));
  await ev(() => { window.__paw.S.goal.at = 0; return window.__paw.gl.post(false); });
  ok(await ev((m) => window.__paw.S.goal.got.includes(m) && window.__paw.S.mail.some((x) => x.id === 'gl_' + m), month), 'the goal reached: Gerald\'s letter, the month marked');
  ok(await ev((f) => { const F = window.__paw.S.inv.food; return (F['Pupcake'] | 0) === (f['Pupcake'] | 0) + 1 && (F['Bone-shaped Biscuit'] | 0) === (f['Bone-shaped Biscuit'] | 0) + 3; }, food0), 'the treat bag: 1 Pupcake and 3 Bone-shaped Biscuits');
  const coins = await ev(() => window.__paw.S.coins);
  await ev(() => window.__paw.gl.fetch(true));
  ok(await ev((f) => (window.__paw.S.inv.food['Pupcake'] | 0) === (f['Pupcake'] | 0) + 1, food0) && await ev((c) => window.__paw.S.coins === c, coins), 'a second look gives nothing more, never coins');
  // last month was missed: the kind letter, once
  const y = +month.slice(0, 4), m = +month.slice(5, 7), prev = m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0');
  const uid = await ev(() => window.__pawCloud.CL.uid);
  raw.prepare('insert into town_goal (month, n, goal, done_at) values (?, 31000, 50000, null)').run(prev);
  raw.prepare('insert into town_goal_users (month, user_id, n) select ?, id, 12 from users').run(prev); void uid; // this page plays as A since section 4: every account took part
  await ev(() => window.__paw.gl.fetch(true));
  ok(await ev((p) => { const l = window.__paw.S.mail.find((x) => x.id === 'gl_miss_' + p); return !!l && /So close/.test(l.title) && /new goal/.test(l.text) && window.__paw.S.goal.miss === p && !window.__paw.S.goal.got.includes(p); }, prev), 'a missed month: the "So close!" letter, no gift, nothing bad');
  await ev(() => window.__paw.gl.fetch(true));
  ok(await ev((p) => window.__paw.S.mail.filter((x) => x.id === 'gl_miss_' + p).length === 1, prev), 'only once');
  ok(await ev(() => { const s = window.__paw.gl.fields({ goal: { q: -3, got: 'x', sent: [], miss: 5 } }).goal; return s.q === 0 && Array.isArray(s.got) && !Array.isArray(s.sent) && s.miss === ''; }), 'glFields tidies odd values');

  sec('7. phone 360x640');
  const save = await ev(() => JSON.stringify(window.__paw.S));
  const tok = await ev((k) => localStorage.getItem(k), AUTH);
  await cloudPage({ device: 'Phone 360x640', prefs: { btTest: true, frTest: true }, storage: { pawhaven_proto_v1: save, [AUTH]: tok } });
  if (await t.p.locator('#tContinue').count()) await t.p.click('#tContinue');
  await t.calm(); await t.lu();
  await t.until(() => !!(window.__paw && window.__paw.gl && window.__paw.fi), null, 8000);
  const audit = (sel) => ev((sel) => {
    const vw = innerWidth, vh = innerHeight, bad = [];
    const panel = document.querySelector(sel); if (!panel) return { bad: ['no panel ' + sel] };
    const pr = panel.getBoundingClientRect();
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    [...panel.querySelectorAll('.btn')].filter(vis).forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) bad.push('small ' + (b.innerText || b.id).trim().slice(0, 20) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); if (r.right > vw + 0.5 || r.left < -0.5) bad.push('off screen ' + (b.id || b.className)); });
    [...panel.querySelectorAll('p, h3, b')].filter(vis).forEach((e) => { if (e.scrollWidth > e.clientWidth + 1) bad.push('clipped ' + e.textContent.slice(0, 20)); });
    return { bad, over: document.documentElement.scrollWidth > vw + 1, pw: Math.round(pr.width), top: Math.round(pr.top), bottom: Math.round(pr.bottom), vh };
  }, sel);
  await ev(() => window.__paw.fi.card({ wait: 'new' }));
  await t.until(() => !!document.querySelector('#modal .panel.fi-got'), null, 3000); await shot('wait_card_phone');
  let a = await audit('#modal .panel.fi-got');
  ok(!a.bad.length && a.pw <= 360 && !a.over, 'the waiting card fits: ' + JSON.stringify(a));
  await closeAll();
  await ev(() => window.__paw.fi.card({ mine: true, from: [7, 9], joined: [], bandana: true }));
  await t.until(() => !!document.querySelector('#modal .panel.fi-got #fiOk'), null, 3000); await shot('got_card_phone');
  a = await audit('#modal .panel.fi-got');
  ok(!a.bad.length && a.pw <= 360 && !a.over, 'the gift card fits: ' + JSON.stringify(a));
  await closeAll();
  await ev(() => window.__paw.gl.open());
  await t.until(() => !!document.querySelector('#modal .panel.gl-sheet .gl-bar'), null, 5000); await shot('goal_sheet_phone');
  a = await audit('#modal .panel.gl-sheet');
  ok(!a.bad.length && a.pw <= 360 && !a.over, 'the town goal sheet fits: ' + JSON.stringify(a));
  await closeAll();
  await t.home('square');
  ok(await t.until(() => !!document.querySelector('#placeBtns [data-gl]'), null, 4000), 'the phone Square has the button');
  const b = await ev(() => { const r = document.querySelector('#placeBtns [data-gl]').getBoundingClientRect(); return { w: r.width, h: r.height, r: r.right, vw: innerWidth }; });
  ok(b.w >= 44 && b.h >= 44 && b.r <= b.vw + 0.5, 'its button is 44 px or more and on screen: ' + JSON.stringify(b));
  await shot('square_phone');
});

