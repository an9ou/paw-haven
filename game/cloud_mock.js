// A local Worker for the cloud suites (test_cloud.js, test_account.js), v2.8.1. No network.
// The node side runs the REAL cloudflare/worker.js against a D1 lookalike over node:sqlite (cloudflare/d1_node.js).
// Each page (one "device") gets window.__pawCloudMock = { fetch }, which reaches that Worker through an exposed binding.
//   const { makeServer, mockInit } = require('./cloud_mock');
//   await ctx.exposeBinding('__clSrv', (src, ...a) => srv.handle(src.page, ...a)); await ctx.addInitScript(mockInit, cfg);
// srv.users / srv.saves / srv.backups read D1 in the shapes the suites used with the old fake Supabase.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), crypto = require('crypto');
const { d1 } = require(path.join(__dirname, '..', 'cloudflare', 'd1_node.js'));
const WORKER = path.join(__dirname, '..', 'cloudflare', 'worker.js');

/* ---------------- a fake Supabase (only the calls the Worker makes to move old accounts over) ---------------- */
function fakeSupabase() {
  const sb = { calls: 0, users: [], saves: {}, backups: [], tokens: {}, refresh: {}, recovers: [] };
  const mkUser = (o) => { const u = Object.assign({ id: crypto.randomUUID() }, o); sb.users.push(u); return u; };
  sb.mkUser = mkUser;
  sb.login = (u) => { const at = 'sbat_' + crypto.randomBytes(8).toString('hex'), rt = 'sbrt_' + crypto.randomBytes(6).toString('hex'); sb.tokens[at] = u.id; sb.refresh[rt] = u.id; return { at, rt }; };
  const uj = (u) => ({ id: u.id, email: u.email || '', is_anonymous: !u.email });
  const res = (status, o) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
  sb.fetch = async (input, init) => {
    const req = typeof input === 'string' || input instanceof URL ? new Request(input, init) : input; // Miniflare hands over its own Request class
    sb.calls++;
    const u = new URL(req.url);
    if (req.headers.get('apikey') !== 'sb_publishable_test') return res(401, { message: 'no apikey' });
    const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
    const me = sb.users.find((x) => x.id === sb.tokens[bearer]);
    if (u.pathname === '/auth/v1/token') {
      const b = await req.json(), g = u.searchParams.get('grant_type');
      if (g === 'password') { const x = sb.users.find((y) => y.email === b.email && y.password === b.password); if (!x) return res(400, { error: 'invalid_grant' }); const t = sb.login(x); return res(200, { access_token: t.at, refresh_token: t.rt, user: uj(x) }); }
      if (g === 'refresh_token') { const x = sb.users.find((y) => y.id === sb.refresh[b.refresh_token]); if (!x) return res(400, { error: 'invalid_grant' }); delete sb.refresh[b.refresh_token]; const t = sb.login(x); return res(200, { access_token: t.at, refresh_token: t.rt, user: uj(x) }); }
    }
    if (u.pathname === '/auth/v1/user') return me ? res(200, uj(me)) : res(401, { message: 'invalid JWT' });
    if (u.pathname === '/auth/v1/recover') { // Supabase emails its own reset link; here the link's login token is kept for the test to "tap"
      const b = await req.json(), x = sb.users.find((y) => y.email === b.email);
      sb.recovers.push({ email: b.email, redirect_to: u.searchParams.get('redirect_to'), token: x ? sb.login(x).at : null });
      return res(200, {});
    }
    if (u.pathname === '/rest/v1/saves' || u.pathname === '/rest/v1/save_backups') {
      if (!me) return res(401, { message: 'JWT expired' });
      const want = (u.searchParams.get('user_id') || '').replace('eq.', '');
      if (want !== me.id) return res(200, []); // RLS
      if (u.pathname === '/rest/v1/saves') return res(200, sb.saves[me.id] ? [sb.saves[me.id]] : []);
      return res(200, sb.backups.filter((b) => b.user_id === me.id).sort((a, c) => (a.created_at < c.created_at ? 1 : -1)).slice(0, 5));
    }
    return res(404, { message: 'not here' });
  };
  return sb;
}

/* ---------------- a fake Resend: every email lands in mails[] ---------------- */
function fakeMail() {
  const mails = [];
  const fetchFn = async (input, o) => {
    const req = typeof input === 'string' || input instanceof URL ? new Request(input, o) : input; // Miniflare hands over a Request
    if (req.url !== 'https://api.resend.com/emails' || req.headers.get('Authorization') !== 'Bearer re_test') return new Response('{"message":"bad"}', { status: 401 });
    const m = await req.json(); m.link = (m.text.match(/https?:\/\/\S+\?reset=[A-Za-z0-9_-]+/) || [''])[0]; m.token = m.link.split('?reset=')[1] || '';
    mails.push(m); return new Response('{"id":"mail_' + mails.length + '"}', { status: 200 });
  };
  return { mails, fetch: fetchFn };
}

/* ---------------- the local Worker ---------------- */
function makeServer() {
  const DB = d1(), raw = DB.raw, sb = fakeSupabase();
  const mail = fakeMail();
  const env = { DB, RATE_SCALE: 100, SUPABASE_URL: 'https://sb.test', SUPABASE_KEY: 'sb_publishable_test', SB_FETCH: (u, o) => sb.fetch(u, o), RESEND_API_KEY: 're_test', MAIL_FETCH: mail.fetch };
  let worker = null;
  const ips = new Map();
  const srv = { env, sb, mails: mail.mails, calls: [], pages: new Set(), offline: new Set() };
  const parse = (t) => { try { return JSON.parse(t); } catch (e) { return t; } };
  // a player made outside the game (an account another device made): { id, email, password }
  const addUser = (u) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = u.password ? crypto.pbkdf2Sync(u.password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex') : null;
    raw.prepare('insert into users (id, email, pw_hash, pw_salt, created_at, guest) values (?, ?, ?, ?, ?, ?)').run(String(u.id), u.email ? u.email.toLowerCase() : null, hash, hash ? salt : null, Date.now(), u.email ? 0 : 1);
  };
  Object.defineProperty(srv, 'users', { get() {
    const l = raw.prepare('select id, email, guest from users order by created_at, rowid').all().map((r) => ({ id: r.id, email: r.email || '', guest: !!r.guest }));
    l.push = (...us) => { us.forEach(addUser); return l.length + us.length; };
    return l;
  } });
  srv.saves = new Proxy({}, { get(o, uid) {
    if (typeof uid !== 'string') return undefined;
    const r = raw.prepare('select data, rev, changed_at, device, updated_at from saves where user_id = ?').get(uid);
    return r ? { data: JSON.parse(r.data), rev: r.rev, changed_at: r.changed_at, device: r.device, updated_at: r.updated_at } : undefined;
  } });
  Object.defineProperty(srv, 'backups', { get() { return raw.prepare('select id, user_id, data, reason, created_at from save_backups order by id').all().map((b) => Object.assign({}, b, { data: JSON.parse(b.data) })); } });
  srv.pwIs = (id, pw) => { const u = raw.prepare('select pw_hash, pw_salt from users where id = ?').get(id); return !!u && !!u.pw_hash && crypto.pbkdf2Sync(pw, Buffer.from(u.pw_salt, 'hex'), 100000, 32, 'sha256').toString('hex') === u.pw_hash; };
  srv.legacy = (email) => raw.prepare('insert or ignore into legacy (email_hash) values (?)').run(crypto.createHash('sha256').update(email.toLowerCase()).digest('hex')); // an old Supabase email
  srv.endSessions = (id) => raw.prepare('delete from sessions where user_id = ?').run(id); // the Worker forgets that player's logins
  srv.count = (page, what) => srv.calls.filter((c) => (!page || c.page === page) && c.op.includes(what)).length;
  srv.handle = async (page, method, p, body, auth) => {
    srv.calls.push({ page, op: method + ' ' + p.replace(/\?.*$/, '') });
    if (srv.offline.has(page)) return { netError: 'Failed to fetch' };
    if (!worker) worker = (await import(WORKER)).default;
    if (!ips.has(page)) ips.set(page, '10.0.' + (ips.size >> 8) + '.' + (ips.size & 255));
    const h = { 'CF-Connecting-IP': ips.get(page) };
    if (auth) h.Authorization = auth;
    if (body) h['Content-Type'] = 'application/json';
    const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' ? undefined : body || undefined }), env, { waitUntil() {} });
    return { status: res.status, text: await res.text() };
  };
  srv.json = parse;
  return srv;
}

/* ---------------- page side: a fetch that reaches the local Worker (installed before the game runs) ---------------- */
function mockInit(cfg) {
  if (cfg.host) window.__pawCloudHost = cfg.host;
  window.__pawCloudMock = {
    async fetch(url, o) {
      o = o || {};
      if (cfg.broken) throw new TypeError('Failed to fetch'); // the Worker can't be reached at all
      const u = new URL(url), h = o.headers || {};
      const r = await window.__clSrv(o.method || 'GET', u.pathname + u.search, typeof o.body === 'string' ? o.body : null, h.Authorization || null);
      if (r && r.netError) throw new TypeError(r.netError);
      return new Response(r.text, { status: r.status, headers: { 'content-type': 'application/json' } });
    }
  };
}

module.exports = { makeServer, mockInit, fakeSupabase, fakeMail };
