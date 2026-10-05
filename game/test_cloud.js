// CLOUD (v2.2): real-time cloud save against a mocked Supabase (no network). PHONE.md section 3 and the CLOUD part of section 4.
//   PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/test_cloud.js     (or: node game/run_tests.js game/test_cloud.js)
// A small fake Supabase lives in this Node process and is shared by every page (each page is one "device"). Each page gets
// window.__pawCloudMock (a supabase-js lookalike: auth, from().select/insert/upsert, channel().on().subscribe()) that calls the
// fake server through an exposed binding, and the server pushes Realtime rows back into every subscribed page.
const { run, URL } = require('./test_lib');

/* ---------------- fake Supabase (Node side) ---------------- */
function makeServer() {
  const srv = { users: [], tokens: {}, saves: {}, backups: [], seq: 1, calls: [], pages: new Set(), offline: new Set(), confirmEmailChange: false };
  const uidOf = (tok) => srv.tokens[tok] || null;
  const user = (u) => ({ id: u.id, email: u.email || '', new_email: u.new_email || undefined, is_anonymous: !u.email });
  const session = (u) => { const tok = 'tok' + srv.seq++; srv.tokens[tok] = u.id; return { access_token: tok, user: user(u) }; };
  const err = (message, code) => ({ error: { message, code } });
  srv.push = (row) => { for (const p of srv.pages) if (!srv.offline.has(p)) p.evaluate((r) => window.__clDispatch && window.__clDispatch(r), row).catch(() => {}); };
  srv.handle = (page, op, a) => {
    srv.calls.push({ page, op, a: a && a.action ? a.table + '.' + a.action : '' });
    if (srv.offline.has(page)) return { netError: 'Failed to fetch' };
    const me = srv.users.find((u) => u.id === uidOf(a && a.token));
    switch (op) {
      case 'getUser': return me ? { data: { user: user(me) } } : err('no session');
      case 'anon': { const u = { id: 'u' + srv.seq++ }; srv.users.push(u); return { data: session(u) }; }
      case 'update': {
        if (!me) return err('no session');
        if (a.email) {
          if (srv.users.some((u) => u.email === a.email && u !== me)) return err('A user with this email address has already been registered', 'email_exists');
          if (srv.confirmEmailChange) { me.new_email = a.email; if (a.password) me.password = a.password; return { data: { user: user(me) } }; }
          me.email = a.email;
        }
        if (a.password) { if (a.password.length < 8) return err('Password should be at least 8 characters', 'weak_password'); me.password = a.password; }
        return { data: { user: user(me) } };
      }
      case 'signUp': {
        if (srv.users.some((u) => u.email === a.email)) return err('User already registered', 'user_already_exists');
        const u = { id: 'u' + srv.seq++, email: a.email, password: a.password }; srv.users.push(u); return { data: session(u) };
      }
      case 'login': { const u = srv.users.find((x) => x.email === a.email); if (!u || u.password !== a.password) return err('Invalid login credentials', 'invalid_credentials'); return { data: session(u) }; }
      case 'db': {
        if (!me) return err('JWT expired');
        const uid = me.id, f = a.filters || {};
        if (f.user_id && f.user_id !== uid) return { data: a.single ? null : [] }; // RLS: only your own rows
        if (a.table === 'saves') {
          if (a.action === 'select') { const r = srv.saves[uid]; return { data: r ? pick(r, a.cols) : null }; }
          if (a.action === 'upsert') { if (a.row.user_id !== uid) return err('new row violates row-level security policy'); const r = Object.assign({}, a.row, { updated_at: new Date().toISOString() }); srv.saves[uid] = r; setTimeout(() => srv.push(r), 30); return { data: null }; }
        }
        if (a.table === 'save_backups') {
          if (a.action === 'insert') { if (a.row.user_id !== uid) return err('rls'); srv.backups.push(Object.assign({ id: srv.seq++, created_at: new Date(Date.now() + srv.seq).toISOString() }, a.row)); const mine = srv.backups.filter((b) => b.user_id === uid).sort((x, y) => y.id - x.id); const keep = new Set(mine.slice(0, 5)); srv.backups = srv.backups.filter((b) => b.user_id !== uid || keep.has(b)); return { data: null }; }
          if (a.action === 'select') { let l = srv.backups.filter((b) => b.user_id === uid).sort((x, y) => y.id - x.id); if (a.limit) l = l.slice(0, a.limit); return { data: l.map((b) => pick(b, a.cols)) }; }
        }
        return err('bad query');
      }
    }
    return err('bad op ' + op);
  };
  const pick = (r, cols) => { if (!cols || cols === '*') return JSON.parse(JSON.stringify(r)); const o = {}; cols.split(',').forEach((c) => { o[c.trim()] = r[c.trim()]; }); return JSON.parse(JSON.stringify(o)); };
  srv.count = (page, what) => srv.calls.filter((c) => (!page || c.page === page) && (c.op + ':' + c.a).includes(what)).length;
  return srv;
}

/* ---------------- supabase-js lookalike (page side, installed before the game runs) ---------------- */
function mockInit(cfg) {
  if (cfg.host) window.__pawCloudHost = cfg.host;
  const call = (op, a) => window.__clSrv(op, a).then((r) => { if (r && r.netError) throw new TypeError(r.netError); return r; });
  const chans = []; window.__clDispatch = (row) => chans.forEach((c) => { if (c.uid === row.user_id) c.cb({ eventType: 'UPDATE', new: row }); });
  window.__pawCloudMock = {
    createClient(url, key, opts) {
      if (cfg.broken) throw new Error('blocked');
      const SK = opts.auth.storageKey; const tok = () => { try { return (JSON.parse(localStorage.getItem(SK) || 'null') || {}).access_token; } catch (e) { return null; } };
      const keep = (r) => { if (r.data && r.data.access_token) localStorage.setItem(SK, JSON.stringify(r.data)); return r.data && r.data.access_token ? { data: { user: r.data.user, session: r.data }, error: null } : { data: r.data || {}, error: r.error || null }; };
      const auth = {
        async getSession() { const t = tok(); if (!t) return { data: { session: null } }; const r = await call('getUser', { token: t }); return { data: { session: r.data ? { access_token: t, user: r.data.user } : null } }; },
        async signInAnonymously() { return keep(await call('anon', {})); },
        async signUp(a) { return keep(await call('signUp', a)); },
        async signInWithPassword(a) { return keep(await call('login', a)); },
        async updateUser(a) { const r = await call('update', Object.assign({ token: tok() }, a)); return r.error ? { data: {}, error: r.error } : { data: r.data, error: null }; },
        async signOut() { localStorage.removeItem(SK); return { error: null }; }
      };
      const from = (table) => {
        const q = { table, filters: {} };
        const b = {
          select(cols) { if (!q.action) q.action = 'select'; q.cols = cols; return b; },
          eq(c, v) { q.filters[c] = v; return b; },
          order(c, o) { q.order = [c, o]; return b; },
          limit(n) { q.limit = n; return b; },
          maybeSingle() { q.single = true; return b; },
          insert(row) { q.action = 'insert'; q.row = row; return b; },
          upsert(row) { q.action = 'upsert'; q.row = row; return b; },
          then(res, rej) { return call('db', Object.assign({ token: tok() }, q)).then((r) => ({ data: r.data === undefined ? null : r.data, error: r.error || null })).then(res, rej); }
        };
        return b;
      };
      return {
        auth, from,
        channel(name) { const c = { name, uid: null, cb: null, on(type, f, cb) { c.uid = (f.filter || '').replace('user_id=eq.', ''); c.cb = cb; return c; }, subscribe() { chans.push(c); return c; } }; return c; },
        removeChannel(c) { const i = chans.indexOf(c); if (i >= 0) chans.splice(i, 1); }
      };
    }
  };
}

run('cloud', async (t) => {
  const { ok, sec } = t; const srv = makeServer();
  const pages = {};
  // one "device": its own browser context (own localStorage), with the mock installed
  async function device(name, devName, cfg) {
    const p = await t.mk({ device: devName });
    if (cfg !== false) {
      await t.ctx.exposeBinding('__clSrv', (src, op, a) => srv.handle(src.page, op, a));
      await t.ctx.addInitScript(mockInit, cfg || {});
      srv.pages.add(p);
    }
    await p.goto(URL); await p.waitForSelector('#tNew, #tContinue');
    pages[name] = p; return p;
  }
  const use = (p) => { t.p = p; return p; };
  const ev = (p, f, a) => p.evaluate(f, a);
  const st = (p) => ev(p, () => window.__pawCloud.status());
  const until = (p, f, a, ms) => { use(p); return t.until(f, a, ms); };
  const waitSynced = (p, ms) => until(p, () => window.__pawCloud.status().state === 'synced', null, ms || 8000);
  // a real player change: input first (so it counts as a change), then the game's own save
  const change = (p, patch) => ev(p, (o) => { window.dispatchEvent(new PointerEvent('pointerdown')); Object.assign(window.__paw.S, o); window.__paw.saveNow(); }, patch);
  const uidOf = (p) => ev(p, () => window.__pawCloud.CL.uid);
  const openCloud = async (p) => { await ev(p, () => window.__pawCloud.open()); await p.waitForSelector('#clBox'); };
  const tap = async (p, sel) => { await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.locator(sel).first().tap(); };
  // phone minimums for the Cloud save section: tap targets, text size, no sideways scroll
  async function phoneCheck(p, label) {
    const r = await ev(p, () => {
      const box = document.getElementById('clBox'); const small = []; const tiny = [];
      box.querySelectorAll('button, input, textarea').forEach((e) => { const b = e.getBoundingClientRect(); if (b.width && (b.height < 44 || b.width < 44)) small.push(`${e.dataset.cl || e.id || e.textContent.trim()} ${Math.round(b.width)}x${Math.round(b.height)}`); });
      const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); let n;
      while ((n = walk.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el.getClientRects().length) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 15) tiny.push(`${n.textContent.trim().slice(0, 24)} ${fs}px`); }
      return { phone: document.documentElement.dataset.layout, small, tiny, sw: document.documentElement.scrollWidth, iw: innerWidth };
    });
    use(p); await t.SH(label.replace(/\W+/g, '_'));
    ok(r.phone === 'phone', `${label}: phone layout is on`);
    ok(!r.small.length, `${label}: every Cloud save tap target is 44 px or more ${r.small.join(', ')}`);
    ok(!r.tiny.length, `${label}: Cloud save text is 15 px or more ${r.tiny.slice(0, 4).join(', ')}`);
    ok(r.sw === r.iw, `${label}: no horizontal scroll (${r.sw} vs ${r.iw})`);
  }

  sec('device 1 (iPhone 13): a guest starts automatically and the save reaches the cloud');
  const d1 = await device('d1', 'iPhone 13'); use(d1); await t.adopt({ sex: 'girl' });
  ok(await until(d1, () => !!window.__pawCloud.CL.uid, null, 8000), 'a guest user is made once there is a save');
  const g1 = await uidOf(d1);
  ok(await until(d1, (u) => window.__pawCloud.meta().rev >= 1 && window.__pawCloud.meta().uid === u, g1, 8000) && !!srv.saves[g1], 'the first save is pushed to the cloud');
  ok(await waitSynced(d1), 'status: synced');
  const name1 = (await ev(d1, () => window.__paw.S.dog.name));
  ok(srv.saves[g1] && srv.saves[g1].data.dogs[0].name === name1 && srv.saves[g1].data.v === 1, 'the cloud stores exactly the local save (S.v 1)');
  ok(JSON.stringify(srv.saves[g1].data) === await ev(d1, () => localStorage.getItem('pawhaven_proto_v1')), 'cloud data is byte-for-byte what localStorage holds');

  sec('push debounce (about 2 s) and idle saves');
  const up0 = srv.count(d1, 'saves.upsert');
  for (let i = 0; i < 3; i++) { await change(d1, { coins: 300 + i }); await t.sleep(250); }
  await t.sleep(700);
  ok(srv.count(d1, 'saves.upsert') === up0, 'no push in the first ~1.4 s after a burst of changes');
  ok((await st(d1)).state === 'syncing', 'status: syncing while a push waits');
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 5000), 'the push lands');
  ok(srv.count(d1, 'saves.upsert') === up0 + 1, `three quick changes make one push (${srv.count(d1, 'saves.upsert') - up0})`);
  ok(srv.saves[g1].data.coins === 302, 'the pushed save has the newest change');
  const rev1 = srv.saves[g1].rev; ok(rev1 === (await ev(d1, () => window.__pawCloud.meta().rev)), 'rev goes up by one per push and is remembered');
  await ev(d1, () => window.__paw.saveNow()); await t.sleep(2600);
  ok(srv.count(d1, 'saves.upsert') === up0 + 1, 'a save with no player input (the clock ticking) is not pushed');
  ok(/^Synced \d+ s ago$/.test((await st(d1)).text), 'status text reads "Synced N s ago": ' + (await st(d1)).text);

  sec('Settings -> Cloud save on the phone, register guest to account (updateUser path)');
  await openCloud(d1);
  ok(/Guest/.test(await d1.textContent('#clStat')), 'status line says Guest');
  await phoneCheck(d1, 'iPhone 13 Cloud save');
  await tap(d1, '[data-cl=reg]'); await d1.waitForSelector('#clPw2');
  await phoneCheck(d1, 'iPhone 13 make an account form');
  await d1.fill('#clEmail', 'mochi@example.com'); await d1.fill('#clPw', 'short'); await d1.fill('#clPw2', 'short'); await tap(d1, '[data-cl=doReg]');
  ok(/at least 8/.test(await d1.textContent('.clmsg')), 'a password under 8 characters is refused');
  await d1.fill('#clEmail', 'mochi@example.com'); await d1.fill('#clPw', 'pupper123'); await d1.fill('#clPw2', 'pupper124'); await tap(d1, '[data-cl=doReg]');
  ok(/don't match/.test(await d1.textContent('.clmsg')), 'two different passwords are refused');
  await d1.fill('#clEmail', 'mochi@example.com'); await d1.fill('#clPw', 'pupper123'); await d1.fill('#clPw2', 'pupper123'); await tap(d1, '[data-cl=doReg]');
  ok(await until(d1, () => window.__pawCloud.CL.regPath === 'updateUser', null, 6000), 'register uses updateUser on the guest');
  ok((await uidOf(d1)) === g1 && srv.users.find((u) => u.id === g1).email === 'mochi@example.com', 'same user id, now with the email');
  ok(srv.saves[g1].data.dogs[0].name === name1 && (await ev(d1, () => window.__paw.S.dog.name)) === name1, 'register keeps the save');
  ok(await until(d1, () => /Logged in as m…@example\.com/.test(document.getElementById('clStat').textContent), null, 3000), 'status line: Logged in as m…@example.com');
  ok(await d1.locator('[data-cl=logout]').count() === 1 && await d1.locator('[data-cl=pw]').count() === 1, 'logged-in view has Change password and Log out');
  await tap(d1, '[data-cl=pw]'); await d1.fill('#clPw', 'pupper456'); await d1.fill('#clPw2', 'pupper456'); await tap(d1, '[data-cl=doPw]');
  ok(await until(d1, () => /Password changed/.test((document.querySelector('.clmsg') || {}).textContent || ''), null, 4000) && srv.users.find((u) => u.id === g1).password === 'pupper456', 'change password works');
  await t.SH('d1_settings');
  await t.closeX();

  sec('device 2 (Pixel 7): log in on a second device');
  const d2 = await device('d2', 'Pixel 7'); use(d2);
  await t.sleep(400);
  ok(!(await uidOf(d2)) && srv.users.length === 1, 'a fresh device with no save makes no guest user');
  await openCloud(d2); await phoneCheck(d2, 'Pixel 7 Cloud save');
  await tap(d2, '[data-cl=login]'); await d2.waitForSelector('#clPw');
  await phoneCheck(d2, 'Pixel 7 log in form');
  await tap(d2, '[data-cl=forgot]');
  ok(/can't be reset by email/.test(await d2.textContent('#clBody')), 'forgotten password: the no-email text shows');
  await tap(d2, '[data-cl=login]'); await d2.waitForSelector('#clPw');
  await d2.fill('#clEmail', 'mochi@example.com'); await d2.fill('#clPw', 'wrongpass1'); await tap(d2, '[data-cl=doLogin]');
  ok(await until(d2, () => /don't match/.test((document.querySelector('.clmsg') || {}).textContent || ''), null, 4000), 'wrong password: a kind message');
  ok(!(await ev(d2, () => window.__paw.S)), 'wrong password changes nothing');
  await d2.fill('#clEmail', 'mochi@example.com'); await d2.fill('#clPw', 'pupper456'); await tap(d2, '[data-cl=doLogin]');
  ok(await until(d2, (n) => !!window.__paw.S && window.__paw.S.dog.name === n, name1, 6000), 'right password: the account save loads on device 2');
  ok(await until(d2, () => !!document.querySelector('#tContinue'), null, 4000), 'the title screen now offers Continue');
  ok((await uidOf(d2)) === g1, 'device 2 is the same account');
  // the title screen may still be redrawing after the account save loaded: tap again until the game leaves it
  let cont = false; for (let k = 0; k < 4 && !cont; k++) { await tap(d2, '#tContinue').catch(() => {}); cont = await until(d2, () => window.__paw.mode === 'yard', null, 3000); }
  ok(cont, 'Continue goes to the yard');
  use(d2); await t.calm(); await t.lu();

  sec('Realtime: a save on one device shows up on the other when idle');
  await ev(d1, () => window.__paw.go('yard')); use(d1); await t.calm();
  await change(d2, { coins: 777 });
  ok(await until(d1, () => window.__paw.S.coins === 777, null, 8000), 'device 1 picks up device 2\'s save on its own');
  use(d1); ok(await t.waitToast(/Synced from your other device/), 'soft toast: Synced from your other device.');
  // not mid-popup: device 1 opens Settings, device 2 saves, nothing changes until the popup closes
  await openCloud(d1); await change(d2, { coins: 778 });
  await t.sleep(3500);
  ok((await ev(d1, () => window.__paw.S.coins)) === 777, 'a remote save waits while a popup is open');
  use(d1); await t.closeX();
  ok(await until(d1, () => window.__paw.S.coins === 778, null, 5000), 'it applies once the game is idle');

  sec('newer wins on pull, and the loser is backed up');
  srv.offline.add(d1);
  await change(d1, { coins: 111 }); await t.sleep(2600); // device 1 changes while offline: its push fails
  ok((await st(d1)).state === 'offline', 'device 1 status: Offline');
  await change(d2, { coins: 222 }); ok(await until(d2, () => window.__pawCloud.status().state === 'synced', null, 6000), 'device 2 saves a newer change');
  srv.offline.delete(d1); const b0 = srv.backups.length;
  await ev(d1, () => window.__pawCloud.pull());
  ok(await until(d1, () => window.__paw.S.coins === 222, null, 6000), 'device 1 pulls: the newer cloud save wins');
  ok(srv.backups.length === b0 + 1 && srv.backups[srv.backups.length - 1].data.coins === 111 && srv.backups[srv.backups.length - 1].reason === 'older than your other device', 'device 1\'s older change went to backups with a reason');
  // the other way round: the local change is newer than the cloud
  srv.offline.add(d1);
  await change(d2, { coins: 333 }); ok(await until(d2, () => window.__pawCloud.status().state === 'synced', null, 6000), 'device 2 saves first');
  await t.sleep(50); await change(d1, { coins: 444 }); await t.sleep(2400);
  srv.offline.delete(d1); await ev(d1, () => { window.__pawCloud.CL.err = ''; return window.__pawCloud.push(); });
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.saves[g1].data.coins === 444, 'device 1\'s newer change wins on push');
  ok(srv.backups.some((b) => b.data.coins === 333 && b.reason === 'older than your other device'), 'device 2\'s older save went to backups');
  ok(await until(d2, () => window.__paw.S.coins === 444, null, 8000), 'device 2 follows the winner');
  ok(srv.backups.filter((b) => b.user_id === g1).length <= 5, 'at most 5 backups per player');

  sec('Backups list and Restore');
  await openCloud(d1); await tap(d1, '[data-cl=backups]');
  ok(await until(d1, () => document.querySelectorAll('[data-clrestore]').length >= 2, null, 5000), 'Backups lists the saved versions');
  ok(/coins/.test(await d1.textContent('.clbk')) && /older than your other device/.test(await d1.textContent('.clbk')), 'each backup shows date, dogs, coins and why');
  await phoneCheck(d1, 'iPhone 13 backups list');
  const idx = await ev(d1, () => window.__pawCloud.CL.bk.findIndex((b) => b.data.coins === 111));
  await tap(d1, `[data-clrestore="${idx}"]`); await d1.waitForSelector('.confirm .yes'); await tap(d1, '.confirm .yes');
  ok(await until(d1, () => window.__paw.S.coins === 111, null, 6000), 'Restore loads the backup');
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.saves[g1].data.coins === 111, 'the restored backup becomes the newest cloud save');
  ok(srv.backups.some((b) => b.reason === 'before a restore' && b.data.coins === 444), 'the game before the restore is kept as a backup');
  ok(await until(d2, () => window.__paw.S.coins === 111, null, 8000), 'the other device follows the restore');

  sec('Export / Import save code (round trip)');
  await openCloud(d1); await tap(d1, '[data-cl=export]'); await d1.waitForSelector('#clCodeOut');
  const code = await d1.inputValue('#clCodeOut');
  ok(/^PAWZ?1\.[A-Za-z0-9+/=]+\.[0-9a-f]{8}$/.test(code), `export makes a save code with a checksum (${code.length} chars)`);
  await phoneCheck(d1, 'iPhone 13 export');
  await tap(d1, '[data-cl=copy]'); ok(await until(d1, () => /Copied|copy it by hand/.test((document.querySelector('#clCode .clmsg') || {}).textContent || ''), null, 3000), 'Copy button answers');
  const before = await ev(d1, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')));
  use(d1); await t.closeX(); await change(d1, { coins: 5 }); await t.sleep(200);
  await openCloud(d1); await tap(d1, '[data-cl=import]'); await d1.waitForSelector('#clCodeIn');
  await d1.fill('#clCodeIn', code.slice(0, -3) + 'zzz'); await tap(d1, '[data-cl=doImport]');
  ok(await until(d1, () => /broken|isn't/.test((document.querySelector('#clCode .clmsg') || {}).textContent || ''), null, 3000), 'a damaged code is refused (checksum)');
  ok((await ev(d1, () => window.__paw.S.coins)) === 5, 'a refused code changes nothing');
  await d1.fill('#clCodeIn', code); await tap(d1, '[data-cl=doImport]');
  ok(await until(d1, () => window.__paw.S.coins === 111 && document.getElementById('modal').hidden, null, 6000), 'import loads the save and closes Settings');
  const after = await ev(d1, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')));
  ok(after.dogs[0].id === before.dogs[0].id && after.dogs[0].name === before.dogs[0].name && after.coins === before.coins, 'round trip: the same dog and coins');
  ok((await ev(d1, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1_backup') || '{}').coins)) === 5, 'import backed the old game up locally');
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.backups.some((b) => b.reason === 'before an import' && b.data.coins === 5), 'import backed the old game up in the cloud and pushed the new one');
  use(d1); ok(await t.waitToast(/Save code loaded/), 'import toast');

  sec('device 3: register falls back to signUp when the project wants email confirmation');
  srv.confirmEmailChange = true;
  const d3 = await device('d3', 'iPhone 13'); use(d3); await t.adopt({ sex: 'boy' });
  ok(await until(d3, () => window.__pawCloud.status().state === 'synced', null, 8000), 'device 3 guest save is in the cloud');
  const g3 = await uidOf(d3), name3 = await ev(d3, () => window.__paw.S.dog.name);
  await openCloud(d3); await tap(d3, '[data-cl=reg]'); await d3.waitForSelector('#clPw2');
  await d3.fill('#clEmail', 'pawhaven-test-cloud-1@example.com'); await d3.fill('#clPw', 'biscuits9'); await d3.fill('#clPw2', 'biscuits9'); await tap(d3, '[data-cl=doReg]');
  ok(await until(d3, () => window.__pawCloud.CL.regPath === 'signUp', null, 6000), 'the signUp fallback runs');
  const a3 = await uidOf(d3);
  ok(a3 && a3 !== g3 && srv.users.find((u) => u.id === a3).email === 'pawhaven-test-cloud-1@example.com', 'a new account user was made');
  ok(await until(d3, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.saves[a3] && srv.saves[a3].data.dogs[0].name === name3, 'the guest\'s save became the account\'s save');
  ok(!!srv.saves[g3], 'the guest row is left behind, untouched');
  ok((await ev(d3, () => window.__paw.S.dog.name)) === name3, 'the game on device 3 is unchanged');
  srv.confirmEmailChange = false; use(d3); await t.closeX();

  sec('device 4: log in on a device that has a guest save, plus the nudge');
  const d4 = await device('d4', 'Pixel 7'); use(d4); await t.adopt({ sex: 'girl' });
  ok(await until(d4, () => window.__pawCloud.status().state === 'synced', null, 8000), 'device 4 guest save is in the cloud');
  await change(d4, { careDays: 3 }); use(d4);
  ok(await t.waitToast(/Make an account to keep .+ safe on every device/), 'after 3 care days: the one-time nudge');
  await change(d4, { careDays: 4 }); await t.sleep(900);
  ok((await ev(d4, () => window.__toasts.filter((x) => /Make an account/.test(x)).length)) === 1, 'the nudge shows only once');
  const guest4 = await ev(d4, () => window.__paw.S.dog.name);
  await openCloud(d4); await tap(d4, '[data-cl=login]'); await d4.waitForSelector('#clPw');
  await d4.fill('#clEmail', 'mochi@example.com'); await d4.fill('#clPw', 'pupper456'); await tap(d4, '[data-cl=doLogin]');
  ok(await until(d4, (n) => window.__paw.S.dog.name === n && document.getElementById('modal').hidden, name1, 6000), 'the account\'s save loads, no question asked');
  ok(srv.backups.some((b) => b.user_id === g1 && b.reason === 'guest save before sign-in' && b.data.dogs[0].name === guest4), 'the guest save went to the account\'s backups');
  use(d4); ok(await t.waitToast(/Logged in/), 'login toast');
  await openCloud(d4); await tap(d4, '[data-cl=logout]'); await d4.waitForSelector('.confirm .yes'); await tap(d4, '.confirm .yes');
  ok(await until(d4, () => !window.__pawCloud.CL.uid && /Logged out/.test(document.getElementById('clBody').textContent), null, 4000), 'log out works');
  ok((await ev(d4, () => window.__paw.S.dog.name)) === name1 && !!(await ev(d4, () => localStorage.getItem('pawhaven_proto_v1'))), 'the local save stays after log out');
  use(d4); await t.closeX();

  sec('the artifact copy: cloud off, local save kept');
  const d5 = await device('d5', 'iPhone 13', { host: 'abc.claudeusercontent.com' }); use(d5); await t.adopt({ sex: 'boy' });
  const name5 = await ev(d5, () => window.__paw.S.dog.name);
  ok((await st(d5)).state === 'off' && (await ev(d5, () => window.__pawCloud.CL.why)) === 'artifact', 'cloud is off on the claude.ai copy');
  ok(srv.calls.filter((c) => c.page === d5).length === 0, 'the artifact copy never calls the cloud');
  await openCloud(d5);
  ok(/Cloud save works on the web version\./.test(await d5.textContent('#clStat')), 'Settings says: Cloud save works on the web version.');
  await phoneCheck(d5, 'artifact copy Settings');
  await tap(d5, '[data-cl=export]'); await d5.waitForSelector('#clCodeOut');
  ok(/^PAWZ?1\./.test(await d5.inputValue('#clCodeOut')), 'Export works on the artifact copy too');
  use(d5); await t.closeX(); await change(d5, { coins: 4321 });
  await d5.reload(); await d5.waitForSelector('#tContinue');
  ok((await ev(d5, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')).coins)) === 4321 && (await ev(d5, () => window.__paw.S && window.__paw.S.dog.name)) === name5, 'the local save is kept across a reload');
  ok(srv.calls.filter((c) => c.page === d5).length === 0, 'still no cloud calls after the reload');

  sec('the test harness (no mock): cloud off, no network');
  const d6 = await device('d6', 'Pixel 7', false);
  ok((await ev(d6, () => window.__pawCloud.status().state)) === 'off' && (await ev(d6, () => window.__pawCloud.CL.why)) === 'harness', 'under the test harness the cloud is off');
  ok(!(await ev(d6, () => !!document.querySelector('script[src*="supabase"]'))), 'supabase-js is not loaded');

  sec('offline: the library fails to load');
  const d7 = await device('d7', 'iPhone 13', { broken: true }); use(d7); await t.adopt({ sex: 'girl' });
  ok(await until(d7, () => window.__pawCloud.status().state === 'offline', null, 6000), 'status: Offline');
  use(d7); ok(await t.waitToast(/Cloud save is offline\. Your game is saved on this device\./), 'the offline message shows');
  await change(d7, { coins: 999 }); await t.sleep(300);
  ok((await ev(d7, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')).coins)) === 999 && (await ev(d7, () => window.__paw.mode)) === 'yard', 'the game keeps playing and saving locally');

}, { timeout: 300000 });
