// ACCOUNT (v2.3): the title screen's account choice against a mocked Supabase (no network). Brief: Log in / Make an account / Play as guest.
//   node game/run_tests.js account      (PAW_SHOTS=1 or --shots writes game/shots_account/)
// The fake Supabase and the supabase-js lookalike are the same as test_cloud.js (copied: that file runs its suite when required).
const { run, URL } = require('./test_lib');
const { devices } = require('playwright');
// the two phone sizes from the brief (touch, phone UA). The Playwright iPhone 13 profile is 390x664, so add 390x844 and 360x740.
devices['Phone 390x844'] = Object.assign({}, devices['iPhone 13'], { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } });
devices['Phone 360x740'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 740 }, screen: { width: 360, height: 740 } });
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

// In-page audit of everything visible (same rules as the phone suites): tap targets >= 44, text >= 15 (13 for captions), no sideways scroll.
const AUDIT = () => {
  const out = { small: [], text: [], scroll: document.documentElement.scrollWidth - window.innerWidth };
  const SKIP = '#devPanel, #devBtn, #bar, #hud, #toasts';
  const vis = (el) => {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null;
    for (let e = el; e && e !== document.body; e = e.parentElement) { if (e.hidden) return null; const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return null; }
    if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) return null; return r;
  };
  const nm = (el) => (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' "' + (el.textContent || '').trim().slice(0, 24) + '"';
  document.querySelectorAll('button, [role=button], a[href], input:not([type=hidden]), select, .card').forEach((el) => {
    if (el.closest(SKIP)) return; const r = vis(el); if (!r) return;
    if (r.width < 43.5 || r.height < 43.5) out.small.push(nm(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const s = n.nodeValue.trim(); if (!s) continue; const el = n.parentElement; if (!el || el.closest('svg, script, style, ' + SKIP) || !vis(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize), cap = !!el.closest('.small, .sub, small, .cap, .crayon-note, .tagline');
    if (fs < (cap ? 12.95 : 14.95)) out.text.push(nm(el) + ' ' + fs + 'px');
  }
  return out;
};
// title layout: nothing on the cover overlaps (8 px slack: the cover's text is drawn a little rotated), and everything stays on the cover and on screen
const LAYOUT = () => {
  const els = []; ['.logo', '.tagline', '.tch', '.tbtns .btn', '.tacct', '.crayon-note'].forEach((s) => document.querySelectorAll('#title ' + s).forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.width) els.push([s + i, r]); }));
  const bad = [], cov = document.querySelector('#title .cover').getBoundingClientRect();
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i][1], b = els[j][1]; if (a.left < b.right - 8 && b.left < a.right - 8 && a.top < b.bottom - 8 && b.top < a.bottom - 8) bad.push(els[i][0] + ' x ' + els[j][0]); }
  els.forEach(([s, r]) => { if (r.left < cov.left - 2 || r.right > cov.right + 2 || r.top < cov.top - 2 || r.bottom > cov.bottom + 2 || r.bottom > innerHeight || r.right > innerWidth) bad.push(s + ' off the cover'); });
  return bad;
};

run('account', async (t) => {
  const { ok, sec } = t; const srv = makeServer(); const dialogs = []; let touch = false;
  async function device(devName, cfg) {
    const p = await t.mk(devName ? { device: devName } : {}); touch = !!devName;
    p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
    if (process.env.ACC_TRACE) p.on('pageerror', (e) => console.log('PAGEERROR', e.stack));
    if (cfg !== false) { await t.ctx.exposeBinding('__clSrv', (src, op, a) => srv.handle(src.page, op, a)); await t.ctx.addInitScript(mockInit, cfg || {}); srv.pages.add(p); }
    await p.goto(URL); await p.waitForSelector('#tNew, #tContinue, #tGuest');
    return p;
  }
  const ev = (f, a) => t.p.evaluate(f, a);
  const uid = () => ev(() => window.__pawCloud.CL.uid);
  const tap = async (sel) => { const l = t.p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); if (touch) await l.tap(); else await l.click(); };
  const line = () => ev(() => { const e = document.querySelector('#title .tacct'); return e ? [...e.children].map((c) => c.textContent.trim()).join(' ') : ''; });
  const diag = () => ev(() => { const m = document.getElementById('acMsg'), C = window.__pawCloud.CL; const v = (i) => { const e = document.getElementById(i); return e ? JSON.stringify(e.value) : 'none'; }; return `[pw ${v('acPw')} pw2 ${v('acPw2')} em ${v('acEmail')} | msg: ${m && !m.hidden ? m.textContent : '-'} | modal ${document.getElementById('modal').hidden ? 'closed' : 'open'} | uid ${C.uid} anon ${C.anon} reg ${C.regPath}]`; });
  const choices = () => ev(() => [...document.querySelectorAll('#title .tch b')].map((b) => b.textContent));
  const sheetOpen = () => t.until(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel.acct'), null, 4000);
  const closed = () => t.until(() => document.getElementById('modal').hidden, null, 6000);
  const msg = async () => (await t.until(() => { const m = document.getElementById('acMsg'); return !!m && !m.hidden && !!m.textContent; }, null, 6000)) ? ev(() => document.getElementById('acMsg').textContent) : '';
  async function form(kind, em, pw, pw2) { await t.p.waitForSelector('#modal .panel.acct[data-ready] #acEmail'); await t.p.fill('#acEmail', em); await t.p.fill('#acPw', pw); if (kind === 'reg') await t.p.fill('#acPw2', pw2 == null ? pw : pw2); await tap('#acGo'); }
  const change = (patch) => ev((o) => { window.dispatchEvent(new PointerEvent('pointerdown')); Object.assign(window.__paw.S, o); window.__paw.saveNow(); }, patch);
  const synced = () => t.until(() => window.__pawCloud.status().state === 'synced', null, 8000);
  const layout = async (label) => { const bad = await ev(LAYOUT); ok(!bad.length, `${label}: nothing on the cover overlaps or runs off it ${bad.slice(0, 4).join(', ')}`); };
  const audit = async (label) => {
    const a = await ev(AUDIT);
    ok(a.scroll <= 0, `${label}: no sideways scroll (${a.scroll})`);
    ok(!a.small.length, `${label}: tap targets >= 44 px ${a.small.slice(0, 5).join(' | ')}`);
    ok(!a.text.length, `${label}: text >= 15 px (captions 13) ${[...new Set(a.text)].slice(0, 5).join(' | ')}`);
    await t.SH(label.replace(/\W+/g, '_'));
  };
  // the sheet's message and buttons are on screen and not covered by anything
  const reachable = (sels) => ev((ss) => ss.filter((s) => { const e = document.querySelector(s); if (!e) return true; const r = e.getBoundingClientRect(); if (r.bottom > innerHeight + 1 || r.top < 0) return true; const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(hit && (hit === e || e.contains(hit))); }), sels);
  const panelBox = () => ev(() => { const r = document.querySelector('#modal .panel').getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, cx: r.left + r.width / 2, W: innerWidth, H: innerHeight }; });

  /* ------------------------------------------------ desktop 1280x720 ------------------------------------------------ */
  sec('desktop: cloud on, no session: three choices on the title');
  const d1 = await device(null); t.p = d1;
  ok(JSON.stringify(await choices()) === JSON.stringify(['Log in', 'Make an account', 'Play as guest']), 'Log in, Make an account, Play as guest: ' + (await choices()).join(', '));
  ok(!(await d1.locator('#tNew, #tContinue').count()), 'no Continue / New game until a choice is made');
  ok(srv.users.length === 0, 'no guest user is made before the player picks');
  ok((await ev(() => [...document.querySelectorAll('#title .tch .tch-dog svg')].length)) === 3, 'each choice has a crayon dog');
  await layout('desktop choices'); await t.SH('desk_01_choices');

  sec('desktop: the log in popup, kind errors');
  await tap('#tLogin'); ok(await sheetOpen(), 'Log in opens a popup');
  let pb = await panelBox(); ok(Math.abs(pb.cx - pb.W / 2) < 40 && pb.b < pb.H - 20 && pb.w <= 560, `desktop: a centred popup, not a bottom sheet (${Math.round(pb.w)} px wide)`);
  await form('login', 'not-an-email', 'whatever1'); ok(/email looks wrong/.test(await msg()), 'a wrong-looking email: kind message');
  await form('login', 'nobody@example.com', 'wrongpass1'); ok(/don't match/.test(await msg()), 'wrong password: "That email and password don\'t match."');
  srv.offline.add(d1); await form('login', 'nobody@example.com', 'wrongpass1'); ok(/offline/.test(await msg()), 'offline: "Cloud save is offline..."'); srv.offline.delete(d1);
  ok(await ev(() => !document.getElementById('acGo').disabled), 'the Log in button works again after an error');
  await tap('#acForgot'); ok(/can't be reset by email/.test(await ev(() => document.getElementById('acForgotTxt').textContent)) && await ev(() => !document.getElementById('acForgotTxt').hidden), 'forgot password: the no-email text');
  await t.SH('desk_02_login_error');
  await tap('#acBack'); ok(await closed(), 'Back closes the popup'); ok((await choices()).length === 3, 'the three choices are still there');

  sec('desktop: make an account, kind errors');
  srv.users.push({ id: 'uTaken', email: 'taken@example.com', password: 'taken1234' });
  await tap('#tReg'); ok(await sheetOpen(), 'Make an account opens a popup');
  ok(/pick your first crayon dog/.test(await ev(() => document.querySelector('.aclead').textContent)), 'with no game yet: "Make one, then pick your first crayon dog."');
  await form('reg', 'pip@example.com', 'short'); ok(/at least 8/.test(await msg()), 'a password under 8: "Pick a password with at least 8 characters."');
  await form('reg', 'pip@example.com', 'pupper123', 'pupper124'); ok(/don't match/.test(await msg()), 'two different passwords are refused');
  await form('reg', 'taken@example.com', 'pupper123'); ok(/already has an account/.test(await msg()), 'email taken: "That email already has an account. Log in instead."');
  await t.SH('desk_03_register_error');
  await tap('#acBack'); await closed();
  ok((await choices()).length === 3, 'a failed sign-up leaves the three choices (the guest made on the way is not a pick)');

  sec('desktop: play as guest (today\'s flow)');
  await tap('#tGuest');
  ok(await t.until(() => !!window.__pawCloud.CL.uid && window.__pawCloud.CL.anon && !!document.getElementById('tNew'), null, 6000), 'Play as guest: anonymous sign-in, then New game');
  ok(/^Playing as guest Log in$/.test(await line()), 'small line: "Playing as guest" + Log in: ' + await line());
  await layout('desktop guest'); await t.SH('desk_04_guest');
  const g1 = await uid(); await t.adopt({ sex: 'girl' });
  ok(await synced() && !!srv.saves[g1], 'the guest game reaches the cloud');
  const name1 = await ev(() => window.__paw.S.dog.name);
  await ev(() => window.__paw.go('title')); await d1.waitForSelector('#tContinue');
  ok(/^Playing as guest Log in$/.test(await line()), 'back on the title: Continue, New game, "Playing as guest"');

  sec('desktop: Log in link opens the same three choices; register upgrades the guest save');
  await tap('#tSwitch'); ok(await sheetOpen(), 'the link opens the choices');
  ok(await ev(() => ['acLogin', 'acReg', 'acGuest'].every((i) => !!document.getElementById(i))) && /Stay a guest/.test(await ev(() => document.getElementById('acGuest').textContent)), 'Log in, New account, Stay a guest');
  await t.SH('desk_05_switch_guest');
  await tap('#acGuest'); ok(await closed() && (await uid()) === g1, 'Stay a guest changes nothing');
  await tap('#tSwitch'); await sheetOpen(); await tap('#acReg'); await d1.waitForSelector('#acPw2');
  ok(new RegExp(name1 + ' comes along').test(await ev(() => document.querySelector('.aclead').textContent)), `the form says ${name1} comes along`);
  await tap('#acBack'); ok(await t.until(() => !!document.getElementById('acLogin'), null, 3000), 'Back from the form returns to the choices');
  await tap('#acReg'); await d1.waitForSelector('#acPw2'); await form('reg', 'mochi@example.com', 'pupper123');
  ok(await closed() && await t.until(() => window.__pawCloud.CL.regPath === 'updateUser' && !window.__pawCloud.CL.anon, null, 6000), 'register: updateUser on the guest ' + await diag());
  ok((await uid()) === g1 && srv.users.find((u) => u.id === g1).email === 'mochi@example.com' && srv.saves[g1].data.dogs[0].name === name1, 'same user id, same save, now with an email');
  ok(await t.until(() => /^Signed in as m…@example\.com/.test(document.querySelector('#title .tacct').textContent) && !!document.getElementById('tSwitch'), null, 3000), 'title: "Signed in as m…@example.com" + Switch: ' + await line());
  ok(!!(await d1.locator('#tContinue').count()), 'Continue is offered'); ok(await t.waitToast(/Account made\. .+ is safe on every device now\./), 'toast: Account made.');
  await layout('desktop signed in'); await t.SH('desk_06_signed_in');
  ok(/Logged in as m…@example\.com/.test(await ev(async () => { window.__pawCloud.open(); await new Promise((r) => setTimeout(r, 100)); return document.getElementById('clStat').textContent; })), 'Settings -> Cloud save agrees: Logged in as m…@example.com');
  await t.closeX();

  sec('desktop: log in on a second device pulls the save, then Continue');
  const d2 = await device(null); t.p = d2;
  await tap('#tLogin'); await sheetOpen(); await form('login', 'mochi@example.com', 'pupper123');
  ok(await t.until((n) => !!document.getElementById('tContinue') && document.getElementById('modal').hidden && window.__paw.S && window.__paw.S.dog.name === n, name1, 8000), 'the account save loads and the title offers Continue');
  ok((await uid()) === g1 && /^Signed in as m…@example\.com Switch$/.test(await line()), 'signed in to the same account: ' + await line());
  ok(await t.waitToast(/Logged in\./), 'toast: Logged in.');
  await t.SH('desk_07_login_continue');
  let cont = false; for (let k = 0; k < 4 && !cont; k++) { await tap('#tContinue').catch(() => {}); cont = await t.untilMode('yard', 3000); }
  ok(cont, 'Continue goes to the yard'); await t.calm(); await t.lu();
  await t.until(() => (window.__barkLog || []).some((b) => b.kind === 'whine'), null, 4000); // the greeting (a bark, then a whine 0.7 s later) is over

  sec('desktop: Switch while signed in: a second account starts fresh, and A\'s last change reaches A first');
  const settled = () => t.until(() => !window.__pawCloud.CL.timer && !window.__pawCloud.CL.busy, null, 8000);
  await ev(() => window.__paw.go('title')); await d2.waitForSelector('#tSwitch');
  await tap('#tSwitch'); await sheetOpen();
  ok(/signed in as m…@example\.com/.test(await ev(() => document.querySelector('.acwho').textContent)) && /A second account/.test(await ev(() => document.getElementById('acReg').textContent)) && /Log out/.test(await ev(() => document.getElementById('acGuest').textContent)), 'the choices say who is signed in and what each one does');
  await t.SH('desk_08_switch_account');
  await tap('#acReg'); await d2.waitForSelector('#acPw2');
  ok(/fresh start/.test(await ev(() => document.querySelector('.aclead').textContent)), 'the form says the new account starts fresh');
  await change({ coins: 6060 }); // A's last change, its push still waiting
  await form('reg', 'second@example.com', 'second123');
  ok(await t.until((g) => window.__pawCloud.CL.regPath === 'signUp' && window.__pawCloud.CL.uid !== g && !window.__pawCloud.CL.anon && window.__paw.mode === 'adopt', g1, 6000), 'a new account is made with signUp, straight to adoption ' + await diag());
  const a2 = await uid();
  ok(srv.saves[g1].data.coins === 6060, 'A\'s last change reached A before the switch');
  ok(!srv.saves[a2] && !srv.backups.some((b) => b.user_id === a2), 'nothing of A\'s game went into the new account');
  ok(srv.users.find((u) => u.id === g1).email === 'mochi@example.com', 'the first account keeps its email');
  await ev(() => window.__paw.go('title')); await d2.waitForSelector('#tNew'); await t.adopt({ sex: 'boy' });
  ok(await synced() && !!srv.saves[a2], 'the new dog is saved to the new account');
  const dogA2 = srv.saves[a2].data.dogs[0].id, ofA2 = (b) => b.data && b.data.dogs && b.data.dogs[0].id === dogA2;
  await ev(() => window.__paw.go('title')); await d2.waitForSelector('#tSwitch');
  ok(/^Signed in as s…@example\.com Switch$/.test(await line()), 'title: Signed in as s…@example.com');

  sec('desktop: Play as guest from an account: the last change reaches the account, the game never reaches the guest');
  await change({ coins: 7070 }); const lp0 = await ev(() => window.__pawCloud.CL.lastPull);
  await tap('#tSwitch'); await sheetOpen(); await tap('#acGuest'); await d2.waitForSelector('.confirm .yes');
  await tap('.confirm .no'); ok((await uid()) === a2, 'Stay keeps the account');
  await tap('#acGuest'); await d2.waitForSelector('.confirm .yes'); await tap('.confirm .yes');
  ok(await t.until((a) => !!window.__pawCloud.CL.uid && window.__pawCloud.CL.anon && window.__pawCloud.CL.uid !== a && document.getElementById('modal').hidden, a2, 6000), 'Play as guest logs out and starts a guest');
  const gst = await uid();
  ok(srv.saves[a2].data.coins === 7070, 'log out sends the account\'s last change to the account first');
  ok(await t.until((l) => window.__pawCloud.CL.lastPull > l, lp0, 6000) && await settled(), 'the guest\'s first pull ran');
  ok(!srv.saves[gst] && !srv.backups.some((b) => b.user_id === gst), 'the account\'s game is not copied into the guest\'s cloud');
  ok(!!(await d2.locator('#tContinue').count()) && /^Playing as guest Log in$/.test(await line()), 'the game stays on this device: Continue + "Playing as guest"');
  await change({ coins: 7171 }); await t.sleep(300); ok(await settled() && !srv.saves[gst], 'playing on as a guest never pushes it either');
  ok((await ev(() => window.__pawCloud.status().text)) === 'Saved on this device', 'status: Saved on this device (not stuck on Syncing)');

  sec('desktop: after a log out, log in as B: the old account\'s game never lands in B');
  const bkB = srv.backups.length;
  await tap('#tSwitch'); await sheetOpen(); await tap('#acLogin'); await form('login', 'mochi@example.com', 'pupper123');
  ok(await t.until((n) => document.getElementById('modal').hidden && !!document.getElementById('tContinue') && window.__paw.S && window.__paw.S.dog.name === n, name1, 8000), 'B\'s save is what\'s played');
  ok(!srv.backups.slice(bkB).some(ofA2) && srv.saves[g1].data.dogs[0].id !== dogA2, 'no backup and no save of the old account\'s game in B');
  await ev(() => window.__pawCloud.open()); await d2.waitForSelector('[data-cl=logout]'); await tap('[data-cl=logout]'); await d2.waitForSelector('.confirm .yes'); await tap('.confirm .yes');
  ok(await t.until(() => !window.__pawCloud.CL.uid, null, 6000), 'Settings: Log out'); await t.closeX();
  ok((await choices()).length === 3, 'after a log out the title offers the three choices');
  srv.users.push({ id: 'uD', email: 'dot@example.com', password: 'dot123456' });
  await tap('#tLogin'); await sheetOpen(); await form('login', 'dot@example.com', 'dot123456');
  ok(await t.untilMode('adopt', 6000) && (await uid()) === 'uD', 'an account with no save: adoption, not B\'s dogs');
  ok(!srv.saves.uD && !srv.backups.some((b) => b.user_id === 'uD') && !(await ev(() => localStorage.getItem('pawhaven_proto_v1'))), 'B\'s game left this device and never reached D');

  sec('desktop: after a log out, Settings -> Make an account does not take the old account\'s game');
  const d2b = await device(null); t.p = d2b;
  await tap('#tLogin'); await sheetOpen(); await form('login', 'second@example.com', 'second123');
  ok(await t.until(() => !!document.getElementById('tContinue') && document.getElementById('modal').hidden, null, 8000), 'signed in to the second account, its game loaded');
  await ev(() => window.__pawCloud.open()); await d2b.waitForSelector('[data-cl=logout]'); await tap('[data-cl=logout]'); await d2b.waitForSelector('.confirm .yes'); await tap('.confirm .yes');
  await t.until(() => !window.__pawCloud.CL.uid, null, 6000);
  await tap('[data-cl=reg]'); await d2b.waitForSelector('#clPw2');
  await d2b.fill('#clEmail', 'eve@example.com'); await d2b.fill('#clPw', 'eve123456'); await d2b.fill('#clPw2', 'eve123456'); await tap('[data-cl=doReg]');
  ok(await t.until(() => !!window.__pawCloud.CL.uid && !window.__pawCloud.CL.anon && window.__paw.mode === 'title' && document.getElementById('modal').hidden, null, 6000), 'the account is made and the title opens');
  const aE = await uid(); await settled();
  ok(!srv.saves[aE] && !srv.backups.some((b) => b.user_id === aE) && !(await ev(() => localStorage.getItem('pawhaven_proto_v1'))), 'the old account\'s game stayed with it: not in the new account, not on this device');
  ok(!!(await d2b.locator('#tNew').count()) && !(await d2b.locator('#tContinue').count()), 'the title offers New game');

  sec('desktop: log in to an account with no save goes to adoption');
  srv.users.push({ id: 'uEmpty', email: 'empty@example.com', password: 'biscuit12' });
  const d3 = await device(null); t.p = d3;
  await tap('#tLogin'); await sheetOpen(); await form('login', 'empty@example.com', 'biscuit12');
  ok(await t.untilMode('adopt', 6000) && (await uid()) === 'uEmpty', 'no save on the account: straight to adoption');
  await t.SH('desk_09_login_no_save');

  sec('desktop: make an account with no game goes to adoption');
  const d4 = await device(null); t.p = d4;
  await tap('#tReg'); await sheetOpen(); await form('reg', 'newbie@example.com', 'newbie123');
  ok(await t.untilMode('adopt', 6000), 'a brand new account: straight to adoption ' + await diag());
  const a4 = await uid(); ok(srv.users.find((u) => u.id === a4).email === 'newbie@example.com', 'the account has the email (no email sent)');

  sec('desktop: register fallback (signUp) has a push guard like log in');
  srv.confirmEmailChange = true;
  const d5 = await device(null); t.p = d5; await tap('#tGuest'); await d5.waitForSelector('#tNew'); await t.adopt({ sex: 'boy' });
  ok(await synced(), 'device 5 guest save is in the cloud'); const g5 = await uid(), coins5 = srv.saves[g5].data.coins;
  await ev(() => window.__paw.go('title')); await d5.waitForSelector('#tSwitch');
  await tap('#tSwitch'); await sheetOpen(); await tap('#acReg'); await d5.waitForSelector('#acPw2');
  await t.p.waitForSelector('#modal .panel.acct[data-ready] #acEmail'); await t.p.fill('#acEmail', 'fallback@example.com'); await t.p.fill('#acPw', 'fallback1'); await t.p.fill('#acPw2', 'fallback1');
  await change({ coins: 4242 }); const up5 = srv.count(d5, 'saves.upsert'); await tap('#acGo'); // a guest push is waiting (2 s) when the switch starts
  ok(await t.until((g) => window.__pawCloud.CL.regPath === 'signUp' && window.__pawCloud.CL.uid !== g, g5, 6000), 'the signUp fallback runs');
  const a5 = await uid(); ok(await t.until(() => !window.__pawCloud.CL.timer && !window.__pawCloud.CL.busy, null, 6000), 'the waiting guest push was cancelled, nothing in flight');
  ok(srv.saves[a5] && srv.saves[a5].data.coins === 4242, 'the newest game lands on the new account');
  ok(srv.saves[g5].data.coins === coins5 && srv.count(d5, 'saves.upsert') === up5 + 1, `the waiting guest push never runs (guest row kept, ${srv.count(d5, 'saves.upsert') - up5} push)`);
  srv.confirmEmailChange = false;

  sec('desktop: signed in to account A, log in as B: A\'s game never goes into B, backups included');
  const d8 = await device(null); t.p = d8;
  await tap('#tLogin'); await sheetOpen(); await form('login', 'mochi@example.com', 'pupper123');
  ok(await t.until(() => !!document.getElementById('tContinue') && document.getElementById('modal').hidden, null, 8000), 'signed in to A (mochi) with its save');
  const nameB = srv.saves[a5].data.dogs[0].name, bk0 = srv.backups.length;
  await change({ coins: 5150 }); // A's last change, not pushed yet
  await tap('#tSwitch'); await sheetOpen(); await tap('#acLogin'); await form('login', 'fallback@example.com', 'fallback1');
  ok(await t.until((n) => document.getElementById('modal').hidden && !!document.getElementById('tContinue') && window.__paw.S && window.__paw.S.dog.name === n, nameB, 8000), `B's save is what's played (${nameB})`);
  ok(srv.saves[g1].data.coins === 5150, 'A\'s last change reached A\'s own cloud before the switch');
  ok(!srv.backups.slice(bk0).some((b) => b.user_id === a5) && srv.saves[a5].data.coins === 4242, 'nothing of A lands in B: no backup, save untouched');
  ok(/^Signed in as f…@example\.com Switch$/.test(await line()), 'Signed in as f…@example.com');
  srv.users.push({ id: 'uC', email: 'cleo@example.com', password: 'cleo12345' });
  await tap('#tSwitch'); await sheetOpen(); await tap('#acLogin'); await form('login', 'cleo@example.com', 'cleo12345');
  ok(await t.untilMode('adopt', 6000) && (await uid()) === 'uC', 'C has no save: straight to adoption, not B\'s dogs');
  ok(!(await ev(() => localStorage.getItem('pawhaven_proto_v1'))) && !srv.saves.uC && !srv.backups.some((b) => b.user_id === 'uC'), 'B\'s game left this device and never reached C');
  ok(srv.saves[a5].data.dogs[0].name === nameB, 'B\'s game is still safe in B\'s cloud');

  sec('desktop: typing straight into a just-opened form loses nothing');
  await ev(() => window.__paw.go('title')); await d8.waitForSelector('#tSwitch');
  await tap('#tSwitch'); await sheetOpen(); await tap('#acReg');
  await d8.keyboard.type('quick@example.com'); await d8.keyboard.press('Tab'); await d8.keyboard.type('quick1234'); await d8.keyboard.press('Tab'); await d8.keyboard.type('quick1234');
  await t.sleep(150);
  ok(JSON.stringify(await ev(() => ['acEmail', 'acPw', 'acPw2'].map((i) => document.getElementById(i).value))) === JSON.stringify(['quick@example.com', 'quick1234', 'quick1234']), 'every keystroke lands in its field (no focus jump after opening)');
  await tap('#modal .x'); await closed();


  const d6 = await device(null, false); t.p = d6;
  ok(!!(await d6.locator('#tNew').count()) && !(await d6.locator('#tGuest, #tSwitch').count()), 'harness: New game, no account choices');
  ok((await line()) === 'Cloud save works on the web version.', 'note: "Cloud save works on the web version."');
  await layout('desktop cloud off'); await t.SH('desk_10_cloud_off');
  const d7 = await device(null, { host: 'abc.claudeusercontent.com' }); t.p = d7;
  ok((await line()) === 'Cloud save works on the web version.' && !(await d7.locator('#tGuest').count()), 'claude.ai copy: same note, no choices');
  ok(srv.calls.filter((c) => c.page === d7).length === 0, 'the claude.ai copy never calls the cloud');

  /* ------------------------------------------------ phones ------------------------------------------------ */
  for (const dev of ['Phone 390x844', 'Phone 360x740']) {
    const tag = dev.replace(/\D+/g, '_').replace(/^_|_$/g, '');
    sec(`${dev} (touch): the three choices`);
    const p = await device(dev); t.p = p;
    ok((await ev(() => document.documentElement.dataset.layout)) === 'phone', 'phone layout is on');
    ok((await choices()).length === 3, 'three choices');
    ok(await ev(() => { const r = [...document.querySelectorAll('#title .tch')].map((e) => e.getBoundingClientRect()); return r[1].top >= r[0].bottom - 1 && r[2].top >= r[1].bottom - 1; }), 'stacked, one under the other');
    await layout(`${dev} choices`); await audit(`${tag}_01_choices`);

    sec(`${dev}: log in sheet`);
    await tap('#tLogin'); ok(await sheetOpen(), 'Log in opens a sheet');
    pb = await panelBox(); ok(pb.b >= pb.H - 2 && pb.w >= pb.W - 2, 'a bottom sheet, full width');
    await form('login', 'mochi@example.com', 'nope12345'); ok(/don't match/.test(await msg()), 'wrong password: kind message');
    await tap('#acForgot');
    ok(!(await reachable(['#acMsg', '#acGo', '#acBack', '#acPw'])).length, 'message, fields and buttons are on screen and not covered ' + (await reachable(['#acMsg', '#acGo', '#acBack', '#acPw'])).join(','));
    await audit(`${tag}_02_login_error`);
    await tap('#acBack'); await closed();
    await tap('#tLogin'); await sheetOpen(); await tap('#acEmail'); await p.keyboard.type('fast@example.com'); await t.sleep(150);
    ok((await ev(() => document.getElementById('acEmail').value)) === 'fast@example.com' && (await ev(() => document.activeElement.id)) === 'acEmail', 'tap a field and type at once: nothing lost, focus stays');
    await tap('#acBack'); await closed();

    sec(`${dev}: make an account sheet`);
    await tap('#tReg'); await sheetOpen(); await form('reg', 'x@example.com', 'short'); ok(/at least 8/.test(await msg()), 'weak password: kind message');
    ok(!(await reachable(['#acMsg', '#acGo', '#acBack', '#acPw2'])).length, 'message, fields and buttons are on screen and not covered ' + (await reachable(['#acMsg', '#acGo', '#acBack', '#acPw2'])).join(','));
    await audit(`${tag}_03_register_error`);
    await tap('#acBack'); await closed();

    if (dev === 'Phone 390x844') {
      sec(`${dev}: guest, then make an account from the Log in link`);
      await tap('#tGuest'); await p.waitForSelector('#tNew');
      ok(/^Playing as guest Log in$/.test(await line()), '"Playing as guest" + Log in'); await layout(`${dev} guest`); await audit(`${tag}_04_guest`);
      await t.adopt({ sex: 'girl' }); await synced(); const gp = await uid();
      await ev(() => window.__paw.go('title')); await p.waitForSelector('#tSwitch');
      await tap('#tSwitch'); await sheetOpen(); await audit(`${tag}_05_switch_sheet`);
      await tap('#acReg'); await p.waitForSelector('#acPw2'); await form('reg', 'phone390@example.com', 'phone3900');
      ok(await closed() && await t.until((g) => window.__pawCloud.CL.uid === g && !window.__pawCloud.CL.anon, gp, 6000), 'the guest save is upgraded onto the new account');
      ok(/^Signed in as p…@example\.com Switch$/.test(await line()), 'Signed in as p…@example.com + Switch');
      await layout(`${dev} signed in`); await audit(`${tag}_06_signed_in`);
    } else {
      sec(`${dev}: log in, then Continue`);
      await tap('#tLogin'); await sheetOpen(); await form('login', 'mochi@example.com', 'pupper123');
      ok(await t.until(() => !!document.getElementById('tContinue') && document.getElementById('modal').hidden, null, 8000), 'the account save loads: Continue');
      ok(/^Signed in as m…@example\.com Switch$/.test(await line()), 'Signed in as m…@example.com + Switch');
      ok(await ev(() => { const [a, b] = [...document.querySelectorAll('#title .tbtns .btn')].map((e) => e.getBoundingClientRect()); return b.top >= a.bottom - 1 && Math.abs(a.width - b.width) < 2 && Math.abs(a.left - b.left) < 2; }), 'Continue and New game stack tidily, same width');
      await layout(`${dev} signed in`); await audit(`${tag}_04_signed_in`);
      await tap('#tSwitch'); await sheetOpen(); await audit(`${tag}_05_switch_sheet`); await tap('#modal .x'); await closed();
      let c2 = false; for (let k = 0; k < 4 && !c2; k++) { await tap('#tContinue').catch(() => {}); c2 = await t.untilMode('yard', 3000); }
      ok(c2, 'Continue goes to the yard');
    }
  }
  sec('phone: cloud off note');
  const p8 = await device('Phone 360x740', false); t.p = p8;
  ok((await line()) === 'Cloud save works on the web version.', 'the note shows on phones too'); await layout('phone cloud off'); await audit('360_740_07_cloud_off');

  // ---- kitchen (v2.3 occlusion) ----
  // the food-safety lesson, the header hint, the dog's bubble and the kitchen taps on the two phone sizes
  for (const dev of ['Phone 390x844', 'Phone 360x740']) {
    const tag = 'kitchen_' + dev.replace(/\D+/g, '_').replace(/^_|_$/g, '');
    sec(`${dev}: kitchen lesson, header, bubble and taps`);
    await t.newGame({ device: dev }, { inv: { crops: { carrot: [3, 1, 0] }, pantry: { oats: 3, rice: 3, egg: 2, chicken: 2 } } }); touch = true;
    await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('kitchen'); });
    ok(await t.untilMode('kitchen'), 'the kitchen opens'); await t.p.waitForSelector('.pk-portrait [data-ing="carrot"]'); await t.sleep(300);
    const kmsg = () => ev(() => { const m = document.querySelector('.pk-msg'), r = m.getBoundingClientRect(), s = document.querySelector('.pk-slots').getBoundingClientRect(); return { fits: m.scrollHeight <= m.clientHeight + 1, below: s.top >= r.bottom - 1, txt: m.textContent }; });
    let km = await kmsg();
    ok(km.fits && km.below, `the lesson is fully visible and the slots sit under it ("${km.txt}")`);
    const hd = await ev(() => { const e = document.querySelector('.pk-sub'); return { w: e.scrollWidth <= e.clientWidth, h: e.scrollHeight <= e.clientHeight + 2, txt: e.textContent }; });
    ok(hd.w && hd.h, 'the header hint is not truncated');
    ok(/^Tap or drag ingredients into the pot\./.test(hd.txt), 'the header uses touch wording: ' + hd.txt);
    const big = await ev(() => [...document.querySelectorAll('.pk-top .pk-gold, .pk-top .pk-x, .pk-slots .pk-btn')].map((b) => { const r = b.getBoundingClientRect(); return [b.textContent.trim() || 'close', Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]; }));
    ok(big.length === 4 && big.every((b) => b[1] >= 44 && b[2] >= 44), 'Recipe book, close, Empty and Cook! are >= 44 px ' + JSON.stringify(big));
    await audit(`${tag}_01`);
    // fill the pot past 4: the longer kind message and the dog's bubble
    for (const id of ['oats', 'rice', 'egg', 'chicken', 'carrot']) await tap(`[data-ing="${id}"]`);
    ok(await t.until(() => /4 things at most/.test(document.querySelector('.pk-msg').textContent), null, 3000), 'a fifth thing: the pot-is-full message');
    km = await kmsg(); ok(km.fits && km.below, 'the longer message is fully visible and the slots sit under it');
    ok(await t.until(() => document.querySelector('.pk-bub').classList.contains('pk-show'), null, 3000), 'the dog says something');
    const bb = await ev(() => { const b = document.querySelector('.pk-bub'), r = b.getBoundingClientRect(), tr = document.querySelector('.pk-tray').getBoundingClientRect(); return { on: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, clear: r.top >= tr.bottom - 1, txt: b.textContent }; });
    ok(bb.on && bb.clear, `the bubble is fully on screen, under the tray ("${bb.txt}")`);
    await audit(`${tag}_02`);
    await ev(() => window.__paw.go('yard'));
  }
  // ---- end kitchen ----
  // ---- bath/settings/playdate (v2.3 occlusion) ----
  // phones: no keyboard words (Settings keys hint, bath "Mouse ... Space"), the bath scene fills the screen above its tray, playdate pals' heads stay apart.
  // desktop 1280x720: the keys hint and the bath wording are unchanged. PAW_SHOTS=1 writes game/shots_account/small_*.jpg.
  const jpg = async (n) => { if (process.env.PAW_SHOTS) require('fs').mkdirSync(require('path').join(__dirname, 'shots_account'), { recursive: true }); if (process.env.PAW_SHOTS) await t.p.screenshot({ path: require('path').join(__dirname, 'shots_account', 'small_' + n + '.jpg'), type: 'jpeg', quality: 80 }); };
  const occlGame = async (dev) => {
    const p = await device(dev, false); t.p = p; await t.adopt({ sex: 'girl' });
    await t.patch({ bond: { level: 10, pts: 3300 }, coins: 1000, house: 'Royal Castle Kennel', careDays: 60, stats: { hunger: 90, happy: 90, energy: 90, clean: 20 } }); await t.calm(); await t.lu();
    return p;
  };
  const openSet = async (dev) => { if (dev) { await tap('#moreBtn'); await t.p.waitForSelector('#mmSet'); await tap('#mmSet'); } else await tap('#gearBtn'); await t.p.waitForSelector('#setReset'); };
  const setText = () => ev(() => document.querySelector('#modal .panel').textContent);
  const bathText = () => ev(() => document.getElementById('dock').textContent);
  for (const dev of [null, 'Phone 390x844', 'Phone 360x740']) {
    const tag = dev ? dev.replace(/\D+/g, '_').replace(/^_|_$/g, '') : 'desktop';
    sec(`${dev || 'desktop 1280x720'}: Settings keys hint, bath wording and layout, playdate spacing`);
    await occlGame(dev);
    await openSet(dev);
    if (dev) { ok(!/Keys:/.test(await setText()), `${dev}: Settings has no "Keys:" hint (no keyboard on a phone)`);
      // the two checkboxes are tapped through their whole label row, so the row is the target that has to be >= 44 px
      const a = await ev(AUDIT), rows = await ev(() => [...document.querySelectorAll('#modal label.tog')].map((l) => Math.round(l.getBoundingClientRect().height)));
      ok(a.scroll <= 0 && !a.text.length, `${dev} Settings: no sideways scroll, text >= 15 px ${a.text.slice(0, 4).join(' | ')}`);
      ok(!a.small.filter((s) => !/^#set(Mute|Motion) /.test(s)).length && rows.every((h) => h >= 43.5), `${dev} Settings: tap targets >= 44 px (checkbox rows ${rows.join(', ')}) ${a.small.join(' | ')}`); }
    else ok(/Keys: 1-9 bottom buttons, Space pets \/ throws \/ walks, Esc closes things\./.test(await setText()), 'desktop: Settings keeps the keys hint');
    await jpg(tag + '_settings'); await t.closeX(); await t.calm();
    await ev(() => window.__paw.go('bath')); ok(await t.untilMode('bath'), `${tag}: the bath opens`); await t.sleep(300);
    const bt = await bathText();
    if (dev) {
      ok(!/Mouse|Space/.test(bt) && /Scrub with a finger\./.test(bt), `${dev}: bath wording is for fingers, no "Mouse" or "Space": ${bt}`);
      const m = await ev(() => { const s = document.querySelector('#view > svg.world').getBoundingClientRect(), tr = document.querySelector('#dock .tray').getBoundingClientRect(), q = document.getElementById('bathQuit').getBoundingClientRect(); const hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { sb: s.bottom, sh: s.height, tt: tr.top, tb: tr.bottom, H: innerHeight, quit: !!hit && (hit.id === 'bathQuit' || !!hit.closest('#bathQuit')) && q.bottom <= innerHeight }; });
      ok(m.tt - m.sb < 0.05 * m.H && m.H - m.tb < 0.05 * m.H && m.tt - m.sb + m.H - m.tb < 0.15 * m.H, `${dev}: the bath scene reaches the tray and nothing blank is left under it (gap ${Math.round(m.tt - m.sb)} + ${Math.round(m.H - m.tb)} of ${m.H})`);
      ok(m.sh > 0.5 * m.H, `${dev}: the bath scene uses over half the screen (${Math.round(m.sh)} of ${m.H})`);
      ok(m.quit, `${dev}: "Done for now" is on screen and not covered`);
      await audit(`${tag}_09_bath`);
    } else {
      ok(/Mouse, finger, or mash Space\. .+ is legally obliged to look betrayed\./.test(bt), 'desktop: bath wording unchanged: ' + bt);
      ok(await ev(() => !document.getElementById('view').style.flex && !document.getElementById('dock').style.flex), 'desktop: the bath layout is untouched');
    }
    await jpg(tag + '_bath');
    await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.calm();
    ok(await ev(() => !document.getElementById('view').style.flex && !document.getElementById('dock').style.flex), `${tag}: leaving the bath restores the yard layout`);
    const ids = await ev(() => {
      const P = window.__paw, S = P.S, f = S.dog; const d = new Date(); d.setDate(d.getDate() - 30);
      const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      S.stats = Object.assign(S.stats, { hunger: 90, happy: 90, energy: 90, clean: 90 });
      f.born = iso(d); f.litters = 0; f.lastLitter = null; f.key = 'corgi'; f.genes.M = ['m', 'm']; f.geneTested = true;
      const m = P.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'); m.bond = { level: 10, pts: 3300 }; m.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; m.genes.M = ['m', 'm']; m.geneTested = true;
      P.breed.setSeason(f.id, true); P.saveNow(); return { f: f.id, m: m.id };
    });
    await ev(() => window.__paw.breed.openPlaydates()); await t.p.waitForSelector('#pdGo');
    await tap(`.pd-dog[data-pd="a|${ids.f}"]`); await t.until(() => !!document.querySelector('.pd-verdict.ok'), null, 3000);
    await tap('#pdGo'); ok(await t.until(() => { const s = document.getElementById('pdScene'); return !!s && !s.hidden; }), `${tag}: the playdate scene shows`);
    // head box: the facing 45% of each pal's drawn dog (a faces right, b faces left), top 70%. Sampled through bow, chase and rest.
    const heads = () => ev(() => {
      const box = (e, right) => { const s = e.querySelector('svg'), b = s.getBBox(), m = s.getScreenCTM(); const x0 = m.a * b.x + m.e, x1 = m.a * (b.x + b.width) + m.e, y0 = m.d * b.y + m.f, y1 = m.d * (b.y + b.height) + m.f; const w = (x1 - x0) * 0.45; return right ? { l: x1 - w, r: x1, t: y0, b: y0 + (y1 - y0) * 0.7 } : { l: x0, r: x0 + w, t: y0, b: y0 + (y1 - y0) * 0.7 }; };
      const a = document.querySelector('#pdScene .pd-pal.a'), b = document.querySelector('#pdScene .pd-pal.b'); if (!a || !b) return null;
      const A = box(a, true), B = box(b, false); return { ph: document.getElementById('pdScene').className, over: Math.round(Math.min(A.r, B.r) - Math.max(A.l, B.l)), hit: A.l < B.r && B.l < A.r && A.t < B.b && B.t < A.b };
    });
    const seen = new Set(), bad = []; let n = 0;
    while (n++ < 80 && !(await ev(() => !!document.getElementById('pdResult')))) { const h = await heads(); if (h) { seen.add(h.ph.replace('pd-scene ', '')); if (dev && h.hit) bad.push(h.ph + ' ' + h.over + 'px'); } if (n === 3) await jpg(tag + '_playdate'); await t.sleep(60); }
    ok(seen.size >= 2, `${tag}: sampled the playdate phases (${[...seen].join(', ')})`);
    if (dev) ok(!bad.length, `${dev}: the pals' heads never overlap ${bad.slice(0, 4).join(' | ')}`);
    ok(await t.until(() => !!document.getElementById('pdResult'), null, 12000), `${tag}: the playdate result shows`);
  }
  // ---- end bath/settings/playdate ----

  ok(!dialogs.length, 'no browser dialogs ' + dialogs.join(' | '));
}, { timeout: 300000 });
