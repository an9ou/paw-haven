// A local Worker for the cloud suites (test_cloud.js, test_account.js), v2.8.1. No network.
// The node side runs the REAL cloudflare/worker.js against a D1 lookalike over node:sqlite (cloudflare/d1_node.js).
// Each page (one "device") gets window.__pawCloudMock = { fetch }, which reaches that Worker through an exposed binding.
//   const { makeServer, mockInit } = require('./cloud_mock');
//   await ctx.exposeBinding('__clSrv', (src, ...a) => srv.handle(src.page, ...a)); await ctx.addInitScript(mockInit, cfg);
// srv.users / srv.saves / srv.backups read D1 in the shapes the suites use.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), crypto = require('crypto');
const { d1 } = require(path.join(__dirname, '..', 'cloudflare', 'd1_node.js'));
const WORKER = path.join(__dirname, '..', 'cloudflare', 'worker.js');

/* ---------------- a fake Resend: every email lands in mails[] (m.code: the reset code it carries) ---------------- */
function fakeMail() {
  const mails = [];
  const fetchFn = async (input, o) => {
    const req = typeof input === 'string' || input instanceof URL ? new Request(input, o) : input; // Miniflare hands over a Request
    if (req.url !== 'https://api.resend.com/emails' || req.headers.get('Authorization') !== 'Bearer re_test') return new Response('{"message":"bad"}', { status: 401 });
    const m = await req.json(); m.code = (m.text.match(/code is (\d{6})\b/) || [])[1] || ''; // v2.9.2: the 6-digit reset code
    mails.push(m); return new Response('{"id":"mail_' + mails.length + '"}', { status: 200 });
  };
  return { mails, fetch: fetchFn };
}

/* ---------------- the local Worker ---------------- */
function makeServer() {
  const DB = d1(), raw = DB.raw;
  const mail = fakeMail();
  const env = { DB, RATE_SCALE: 100, RESEND_API_KEY: 're_test', MAIL_FETCH: mail.fetch, MAIL_WAIT: '1' }; // MAIL_WAIT: the code mail is in mails[] when /forgot answers
  let worker = null;
  const ips = new Map();
  const srv = { env, mails: mail.mails, calls: [], pages: new Set(), offline: new Set() };
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

module.exports = { makeServer, mockInit, fakeMail };
