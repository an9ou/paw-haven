// Doodle Doggo cloud save API (v2.8.1 "Cloudflare login"). Worker "pawhaven-api" + D1 "pawhaven" (cloudflare/schema.sql).
// Contract: docs/CLOUDFLARE_LOGIN.md. The game's client is game/src/22b_cloud.js; tests: game/test_worker.js.
//
//   POST /guest                      -> { token, user }            a guest: no email, no password
//   POST /register {email,password,fresh?}  -> { token, user, upgraded, migrated? }  a guest's session (and no fresh) becomes the account;
//                                    an old Supabase account with the same email and password moves over instead (migrated: true)
//   POST /login    {email,password}  -> { token, user, migrated? } unknown emails are tried once against Supabase (lazy move)
//   POST /migrate  {access_token,refresh_token} -> { token, user } a Supabase login from before v2.8.1 carries over
//   POST /logout   GET /me   POST /password {password}
//   GET  /save[?meta=1] -> { save: {data,rev,changed_at,device,updated_at} | null }
//   PUT  /save {data,rev,changed_at,device} -> { rev }   409 { error:'stale', rev, changed_at } if the cloud has a newer rev
//   GET  /backups -> { backups: [{id,data,reason,created_at}] }   POST /backups {data,reason}  (the newest 5 are kept)
//
// Passwords: PBKDF2-SHA256, 100k iterations, 16-byte salt. Sessions: a random 32-byte bearer token, only its SHA-256 is stored.
// Nothing here logs a password, a token or a save.

const ORIGINS = new Set([
  'https://doodledoggo.app', 'https://www.doodledoggo.app', 'https://an9ou.github.io',
  'https://html-classic.itch.zone', 'https://html.itch.zone'
]);
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const PW_MIN = 8, PW_MAX = 200, ITER = 100000, MAX_SAVE = 524288, MAX_BODY = 600000, KEEP = 5;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const enc = new TextEncoder();

export default {
  async fetch(req, env, ctx) {
    const cors = corsFor(req.headers.get('Origin'));
    if (req.method === 'OPTIONS') return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
    let res;
    try { res = await route(req, env); } catch (e) { console.error('pawhaven-api error', (e && e.message) || 'unknown'); res = json({ error: 'busy' }, 503); }
    if (cors) for (const k in cors) res.headers.set(k, cors[k]);
    if (Math.random() < 0.01 && ctx && ctx.waitUntil) ctx.waitUntil(tidy(env).catch(() => {}));
    return res;
  }
};

function corsFor(origin) {
  if (!origin || !(ORIGINS.has(origin) || LOCAL.test(origin))) return null;
  return {
    'Access-Control-Allow-Origin': origin, 'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
function json(o, status) { return new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }); }
const fail = (error, status, more) => json(Object.assign({ error }, more || {}), status);

async function route(req, env) {
  const url = new URL(req.url), p = url.pathname.replace(/\/+$/, '') || '/', m = req.method;
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  if (p === '/' && m === 'GET') return json({ ok: true, name: 'pawhaven-api' });
  const R = ROUTES[m + ' ' + p];
  if (!R) return fail('not_found', 404);
  let body = null;
  if (m === 'POST' || m === 'PUT') {
    const t = await req.text();
    if (t.length > MAX_BODY) return fail('too_big', 413);
    try { body = t ? JSON.parse(t) : {}; } catch (e) { return fail('bad_json', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('bad_json', 400);
  }
  let me = null;
  if (R.auth !== false) { me = await who(req, env); if (R.auth && !me) return fail('no_session', 401); }
  return R.fn({ req, env, url, ip, body, me });
}

/* ---------------- crypto ---------------- */
const hex = (b) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
const unhex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)));
function rnd(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
function b64url(b) { let s = ''; b.forEach((x) => { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
async function pbkdf2(pw, saltHex) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations: ITER }, k, 256));
}
function same(a, b) { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
async function newHash(pw) { const salt = hex(rnd(16)); return { salt, hash: await pbkdf2(pw, salt) }; }

/* ---------------- D1 helpers ---------------- */
const one = (env, sql, ...a) => env.DB.prepare(sql).bind(...a).first();
const all = async (env, sql, ...a) => (await env.DB.prepare(sql).bind(...a).all()).results || [];
const run = (env, sql, ...a) => env.DB.prepare(sql).bind(...a).run();
const norm = (e) => String(e || '').trim().toLowerCase();
const pub = (u) => ({ id: u.id, email: u.email || null, guest: !!u.guest });

// one counter per key and window; true when this request is over the limit
async function limited(env, key, max, sec) {
  const now = Date.now(); max *= Number(env.RATE_SCALE) || 1; // the game's test suites raise the limits (many logins in a few minutes)
  const r = await one(env, `insert into rate (k, n, reset_at) values (?1, 1, ?2)
    on conflict(k) do update set n = case when rate.reset_at <= ?3 then 1 else rate.n + 1 end,
                                 reset_at = case when rate.reset_at <= ?3 then ?2 else rate.reset_at end
    returning n`, key, now + sec * 1000, now);
  return !!r && r.n > max;
}
async function tidy(env) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('delete from rate where reset_at < ?1').bind(now),
    env.DB.prepare('delete from sessions where last_seen < ?1').bind(now - 400 * 864e5)
  ]);
}

async function newSession(env, uid) {
  const tok = b64url(rnd(32)), now = Date.now();
  await run(env, 'insert into sessions (token_hash, user_id, created_at, last_seen) values (?1, ?2, ?3, ?3)', await sha256(tok), uid, now);
  return tok;
}
async function who(req, env) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer ([A-Za-z0-9_-]{20,100})$/);
  if (!m) return null;
  const th = await sha256(m[1]);
  const r = await one(env, 'select s.user_id as id, s.last_seen, u.email, u.guest from sessions s join users u on u.id = s.user_id where s.token_hash = ?1', th);
  if (!r) return null;
  if (Date.now() - r.last_seen > 36e5) await run(env, 'update sessions set last_seen = ?1 where token_hash = ?2', Date.now(), th);
  return { id: r.id, email: r.email, guest: !!r.guest, th };
}
const pwBad = (pw) => typeof pw !== 'string' || pw.length < PW_MIN || pw.length > PW_MAX;

/* ---------------- Supabase (only to move old accounts over; public publishable key) ---------------- */
function sbOn(env) { return !!(env.SUPABASE_URL && env.SUPABASE_KEY); }
async function sbCall(env, path, init) {
  const f = env.SB_FETCH || fetch; // tests pass a fake
  const o = Object.assign({}, init); o.headers = Object.assign({ apikey: env.SUPABASE_KEY }, init.headers || {});
  return f(env.SUPABASE_URL + path, o);
}
// null: Supabase says no (wrong email or password, an expired login). Throws when Supabase can't be asked right now.
async function sbAuth(env, grant, payload) {
  const r = await sbCall(env, '/auth/v1/token?grant_type=' + grant, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (r.status === 400 || r.status === 401 || r.status === 403 || r.status === 404 || r.status === 422) return null;
  if (!r.ok) throw new Error('supabase ' + r.status);
  const j = await r.json();
  return j && j.access_token && j.user && j.user.id ? { token: j.access_token, user: j.user } : null;
}
async function sbUser(env, token) {
  const r = await sbCall(env, '/auth/v1/user', { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 401 || r.status === 403 || r.status === 404) return null;
  if (!r.ok) throw new Error('supabase ' + r.status);
  const u = await r.json(); return u && u.id ? u : null;
}
async function sbRows(env, token, path) {
  const r = await sbCall(env, path, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } });
  if (!r.ok) throw new Error('supabase ' + r.status);
  const j = await r.json(); return Array.isArray(j) ? j : [];
}
const asJson = (d) => (typeof d === 'string' ? d : JSON.stringify(d));
// Makes (or completes) the Cloudflare user for a Supabase login: same user id, same email; the save and its backups come
// over once, when Cloudflare has no save for that user yet. Everything from Supabase is read before anything is written.
async function moveOver(env, sb, pw) {
  const su = sb.user, id = String(su.id), email = su.email ? norm(su.email) : null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const u = await one(env, 'select * from users where id = ?1', id);
  if (!u && email && (await one(env, 'select id from users where email = ?1', email))) return null; // the email belongs to someone else here
  const stmts = [];
  if (!(await one(env, 'select 1 as x from saves where user_id = ?1', id))) {
    const q = encodeURIComponent(id);
    const rows = await sbRows(env, sb.token, `/rest/v1/saves?select=data,rev,changed_at,device&user_id=eq.${q}`);
    const bks = await sbRows(env, sb.token, `/rest/v1/save_backups?select=data,reason,created_at&user_id=eq.${q}&order=created_at.desc&limit=${KEEP}`);
    const s = rows[0], now = new Date().toISOString();
    if (s && s.data) stmts.push(env.DB.prepare('insert into saves (user_id, data, rev, changed_at, device, updated_at) values (?1, ?2, ?3, ?4, ?5, ?6)').bind(id, asJson(s.data), s.rev | 0 || 1, String(s.changed_at || now), s.device || null, now));
    bks.slice().reverse().forEach((b) => { if (b && b.data) stmts.push(env.DB.prepare('insert into save_backups (user_id, data, reason, created_at) values (?1, ?2, ?3, ?4)').bind(id, asJson(b.data), b.reason || null, String(b.created_at || now))); });
  }
  const h = pw ? await newHash(pw) : null;
  if (!u) stmts.unshift(env.DB.prepare('insert into users (id, email, pw_hash, pw_salt, created_at, guest, migrated) values (?1, ?2, ?3, ?4, ?5, ?6, 1)').bind(id, email, h ? h.hash : null, h ? h.salt : null, Date.now(), email ? 0 : 1));
  else if (h) stmts.push(env.DB.prepare('update users set pw_hash = ?1, pw_salt = ?2 where id = ?3').bind(h.hash, h.salt, id));
  if (stmts.length) await env.DB.batch(stmts);
  return one(env, 'select * from users where id = ?1', id);
}

/* ---------------- routes ---------------- */
const ROUTES = {
  'POST /guest': { auth: false, async fn({ env, ip }) {
    if (await limited(env, 'guest:' + ip, 60, 3600)) return fail('rate_limited', 429);
    const u = { id: crypto.randomUUID(), email: null, guest: 1 };
    await run(env, 'insert into users (id, email, created_at, guest) values (?1, null, ?2, 1)', u.id, Date.now());
    return json({ token: await newSession(env, u.id), user: pub(u) });
  } },

  'POST /register': { async fn({ env, ip, body, me }) {
    const email = norm(body.email), pw = body.password;
    if (!EMAIL.test(email) || email.length > 254) return fail('invalid_email', 400);
    if (pwBad(pw)) return fail('weak_password', 400);
    if (await limited(env, 'reg:' + ip, 10, 3600)) return fail('rate_limited', 429);
    if (await one(env, 'select id from users where email = ?1', email)) return fail('email_exists', 409);
    // an old Supabase account with this email and this password: it moves over now, exactly as /login does (no user data is copied
    // before Supabase says yes). An old account with another password can't be told apart from no account (Supabase answers the same).
    if (sbOn(env)) {
      const sb = await sbAuth(env, 'password', { email, password: pw });
      if (sb) { const nu = await moveOver(env, sb, pw); if (!nu) return fail('email_exists', 409); return json({ token: await newSession(env, nu.id), user: pub(nu), upgraded: false, migrated: true }); }
    }
    const h = await newHash(pw);
    try {
      if (me && me.guest && !body.fresh) { // the guest becomes the account: same user id, same save
        await env.DB.batch([
          env.DB.prepare('update users set email = ?1, pw_hash = ?2, pw_salt = ?3, guest = 0 where id = ?4 and guest = 1').bind(email, h.hash, h.salt, me.id),
          env.DB.prepare('delete from sessions where token_hash = ?1').bind(me.th)
        ]);
        return json({ token: await newSession(env, me.id), user: { id: me.id, email, guest: false }, upgraded: true });
      }
      const id = crypto.randomUUID();
      await run(env, 'insert into users (id, email, pw_hash, pw_salt, created_at, guest) values (?1, ?2, ?3, ?4, ?5, 0)', id, email, h.hash, h.salt, Date.now());
      return json({ token: await newSession(env, id), user: { id, email, guest: false }, upgraded: false });
    } catch (e) {
      if (/unique/i.test(String(e && e.message))) return fail('email_exists', 409);
      throw e;
    }
  } },

  'POST /login': { auth: false, async fn({ env, ip, body }) {
    const email = norm(body.email), pw = body.password;
    if (!EMAIL.test(email) || typeof pw !== 'string' || !pw || pw.length > PW_MAX) return fail('invalid_credentials', 401);
    if ((await limited(env, 'login:' + ip, 30, 600)) || (await limited(env, 'login:' + (await sha256(email)), 10, 600))) return fail('rate_limited', 429);
    const u = await one(env, 'select * from users where email = ?1', email);
    if (u && u.pw_hash) {
      if (!same(await pbkdf2(pw, u.pw_salt), u.pw_hash)) return fail('invalid_credentials', 401);
      return json({ token: await newSession(env, u.id), user: pub(u) });
    }
    // an email Cloudflare doesn't know yet (or a carried-over login with no password here yet): ask Supabase once
    if (!sbOn(env)) return fail('invalid_credentials', 401);
    const sb = await sbAuth(env, 'password', { email, password: pw });
    if (!sb || (u && u.id !== String(sb.user.id))) return fail('invalid_credentials', 401);
    const nu = await moveOver(env, sb, pw);
    if (!nu) return fail('invalid_credentials', 401);
    return json({ token: await newSession(env, nu.id), user: pub(nu), migrated: true });
  } },

  'POST /migrate': { auth: false, async fn({ env, ip, body }) {
    if (!sbOn(env)) return fail('gone', 401);
    if (await limited(env, 'migrate:' + ip, 30, 3600)) return fail('rate_limited', 429);
    const at = typeof body.access_token === 'string' ? body.access_token : '', rt = typeof body.refresh_token === 'string' ? body.refresh_token : '';
    let sb = null;
    if (at && at.length < 4000) { const su = await sbUser(env, at); if (su) sb = { token: at, user: su }; }
    if (!sb && rt && rt.length < 400) sb = await sbAuth(env, 'refresh_token', { refresh_token: rt });
    if (!sb) return fail('gone', 401);
    const nu = await moveOver(env, sb, null);
    if (!nu) return fail('gone', 401);
    return json({ token: await newSession(env, nu.id), user: pub(nu) });
  } },

  'POST /logout': { async fn({ env, me }) {
    if (me) await run(env, 'delete from sessions where token_hash = ?1', me.th);
    return json({ ok: true });
  } },

  'GET /me': { auth: true, async fn({ me }) { return json({ user: pub(me) }); } },

  'POST /password': { auth: true, async fn({ env, body, me }) {
    if (me.guest) return fail('no_account', 403);
    if (pwBad(body.password)) return fail('weak_password', 400);
    if (await limited(env, 'pw:' + me.id, 10, 3600)) return fail('rate_limited', 429);
    const h = await newHash(body.password);
    await run(env, 'update users set pw_hash = ?1, pw_salt = ?2 where id = ?3', h.hash, h.salt, me.id);
    return json({ ok: true });
  } },

  'GET /save': { auth: true, async fn({ env, url, me }) {
    if (url.searchParams.get('meta')) {
      const r = await one(env, 'select rev, changed_at from saves where user_id = ?1', me.id);
      return json({ save: r ? { rev: r.rev, changed_at: r.changed_at } : null });
    }
    const r = await one(env, 'select data, rev, changed_at, device, updated_at from saves where user_id = ?1', me.id);
    if (!r) return json({ save: null });
    // the stored JSON goes out as it is, so the game gets back exactly the text it saved
    return new Response(`{"save":{"data":${r.data},"rev":${r.rev | 0},"changed_at":${JSON.stringify(r.changed_at)},"device":${JSON.stringify(r.device || null)},"updated_at":${JSON.stringify(r.updated_at)}}}`,
      { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  } },

  'PUT /save': { auth: true, async fn({ env, body, me }) {
    const d = body.data, rev = body.rev, at = Date.parse(body.changed_at);
    if (!d || typeof d !== 'object' || d.v !== 1) return fail('bad_save', 400);
    if (!Number.isInteger(rev) || rev < 1 || !at) return fail('bad_save', 400);
    const data = JSON.stringify(d);
    if (data.length >= MAX_SAVE) return fail('too_big', 413);
    if (await limited(env, 'put:' + me.id, 60, 60)) return fail('rate_limited', 429);
    const dev = typeof body.device === 'string' ? body.device.slice(0, 60) : null, now = new Date().toISOString();
    const r = await one(env, `insert into saves (user_id, data, rev, changed_at, device, updated_at) values (?1, ?2, ?3, ?4, ?5, ?6)
      on conflict(user_id) do update set data = excluded.data, rev = excluded.rev, changed_at = excluded.changed_at, device = excluded.device, updated_at = excluded.updated_at
      where saves.rev < excluded.rev returning rev`, me.id, data, rev, new Date(at).toISOString(), dev, now);
    if (!r) { // another device saved a newer rev first: the game looks again and decides
      const c = await one(env, 'select rev, changed_at from saves where user_id = ?1', me.id);
      return fail('stale', 409, c ? { rev: c.rev, changed_at: c.changed_at } : {});
    }
    return json({ rev: r.rev });
  } },

  'GET /backups': { auth: true, async fn({ env, me }) {
    const rows = await all(env, `select id, data, reason, created_at from save_backups where user_id = ?1 order by created_at desc, id desc limit ${KEEP}`, me.id);
    return new Response(`{"backups":[${rows.map((b) => `{"id":${b.id | 0},"data":${b.data},"reason":${JSON.stringify(b.reason || '')},"created_at":${JSON.stringify(b.created_at)}}`).join(',')}]}`,
      { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  } },

  'POST /backups': { auth: true, async fn({ env, body, me }) {
    const d = body.data;
    if (!d || typeof d !== 'object' || d.v !== 1) return fail('bad_save', 400);
    const data = JSON.stringify(d);
    if (data.length >= MAX_SAVE) return fail('too_big', 413);
    if (await limited(env, 'bk:' + me.id, 30, 600)) return fail('rate_limited', 429);
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 80) : null;
    await env.DB.batch([
      env.DB.prepare('insert into save_backups (user_id, data, reason, created_at) values (?1, ?2, ?3, ?4)').bind(me.id, data, reason, new Date().toISOString()),
      env.DB.prepare(`delete from save_backups where user_id = ?1 and id not in (select id from save_backups where user_id = ?1 order by created_at desc, id desc limit ${KEEP})`).bind(me.id)
    ]);
    return json({ ok: true });
  } }
};
