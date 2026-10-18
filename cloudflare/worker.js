// Doodle Doggo cloud save API (v2.8.1 "Cloudflare login"). Worker "pawhaven-api" + D1 "pawhaven" (cloudflare/schema.sql).
// Contract: docs/CLOUDFLARE_LOGIN.md. The game's client is game/src/22b_cloud.js; tests: game/test_worker.js.
//
//   POST /guest                      -> { token, user }            a guest: no email, no password
//   POST /register {email,password,fresh?}  -> { token, user, upgraded }  a guest's session (and no fresh) becomes the account.
//                                    One email, one account: 409 email_exists for an email already here
//   POST /forgot   {email}           -> { ok, mail }   always the same answer (no account lookup leaks); emails a 6-digit code (v2.9.2)
//   POST /reset-code {email, code, password} -> { token, user }   the code sets the new password, logs out every other device and
//                                    logs this one in. 400 wrong_code { left } / too_many_tries (5 wrong: the code is dead) / expired
//   POST /reset    {token, password} -> { token, user }   v2.8.2 emailed links (no new ones since v2.9.2; kept for links already sent)
//   POST /login    {email,password}  -> { token, user }
//   POST /migrate  -> 410 gone (v2.9.1: Supabase is switched off, nothing carries over any more)
//   POST /logout   GET /me   POST /password {password}
//   GET  /save[?meta=1] -> { save: {data,rev,changed_at,device,updated_at} | null }
//   PUT  /save {data,rev,changed_at,device} -> { rev }   409 { error:'stale', rev, changed_at } if the cloud has a newer rev
//   GET  /backups -> { backups: [{id,data,reason,created_at}] }   POST /backups {data,reason}  (the newest 5 are kept)
//   Dog Cards (v2.11, V211.md section 5.5). No free text anywhere: only integers and fixed tokens, checked by dcCardOf().
//   GET    /card                     -> { id, name, dogs, paws, at } | null      my card (at: last update, ms)
//   PUT    /card {name, dogs}        -> my card   email accounts only (403 no_account for guests), 400 bad_card, 20 an hour
//   DELETE /card                     -> { ok }    stop sharing: the card and its paws are deleted
//   GET    /cards/visit?n=2&not=ids  -> [{ id, name, dogs, paws }]   no session needed (120 an hour per IP); never the caller's own
//   POST   /paw {id}                 -> { paws, given }   one paw per card per Japan day per account (guests too), never your own, 100 an hour
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
    try { res = await route(req, env, ctx); } catch (e) { console.error('pawhaven-api error', (e && e.message) || 'unknown'); res = json({ error: 'busy' }, 503); }
    if (cors) for (const k in cors) res.headers.set(k, cors[k]);
    if (env.TIDY) await tidy(env); // tests: tidy after every request
    else if (Math.random() < 0.01 && ctx && ctx.waitUntil) ctx.waitUntil(tidy(env).catch(() => {}));
    return res;
  }
};

function corsFor(origin) {
  if (!origin || !(ORIGINS.has(origin) || LOCAL.test(origin))) return null;
  return {
    'Access-Control-Allow-Origin': origin, 'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
function json(o, status) { return new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }); }
const fail = (error, status, more) => json(Object.assign({ error }, more || {}), status);

async function route(req, env, ctx) {
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
  return R.fn({ req, env, ctx, url, ip, body, me });
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
    env.DB.prepare('delete from reset_codes where expires_at < ?1').bind(now),
    env.DB.prepare('delete from resets where expires_at < ?1').bind(now),
    env.DB.prepare('delete from sessions where last_seen < ?1').bind(now - 400 * 864e5),
    env.DB.prepare('delete from paws where day < ?1').bind(dcDay(now - 3 * 864e5)) // Dog Cards: paws only matter for today (index paws_day)
  ]);
}
// Dog Cards: a deleted account's card and paws (both ways). Runs only from the card routes (about 1 in 50 of their requests), not on every route.
async function dcTidy(env) {
  await env.DB.batch([
    env.DB.prepare('delete from cards where user_id not in (select id from users)'),
    env.DB.prepare('delete from paws where card_id not in (select id from cards)'),
    env.DB.prepare('delete from paws where from_id not in (select id from users)')
  ]);
}
function dcTidySoon(env, ctx) {
  if (env.TIDY) return dcTidy(env); // tests: at once
  if (Math.random() < 0.02 && ctx && ctx.waitUntil) ctx.waitUntil(dcTidy(env).catch(() => {}));
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


/* ---------------- email (v2.9.2: Forgot password sends a 6-digit code, through Resend) ---------------- */
const RESET_MS = 30 * 60 * 1000, CODE_TRIES = 5;
function mailOn(env) { return !!env.RESEND_API_KEY; }
// six digits, every value equally likely (4294000000 is a multiple of a million)
function code6() { const b = new Uint32Array(1); do crypto.getRandomValues(b); while (b[0] >= 4294000000); return String(b[0] % 1e6).padStart(6, '0'); }
function codeMail(code) {
  const text = `Your Doodle Doggo code is ${code}. It works for 30 minutes. If you didn't ask for it, ignore this email.

Type it in the game, under Log in > Forgot your password?

Doodle Doggo`;
  const html = `<div style="font-family:Georgia,serif;font-size:17px;line-height:1.5;color:#2b2622;max-width:520px">
<p>Your Doodle Doggo code is</p>
<p style="font-family:Menlo,Consolas,monospace;font-size:34px;font-weight:bold;letter-spacing:6px;margin:6px 0 14px">${code}</p>
<p>It works for 30 minutes. If you didn't ask for it, ignore this email.</p>
<p style="color:#6b6058">Type it in the game, under Log in &gt; Forgot your password?<br>Doodle Doggo</p></div>`;
  return { subject: 'Your Doodle Doggo code', text, html };
}
async function sendMail(env, to, m) {
  const f = env.MAIL_FETCH || fetch; // tests pass a fake
  const r = await f('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'Doodle Doggo <noreply@doodledoggo.app>', to: [to], subject: m.subject, text: m.text, html: m.html })
  });
  if (!r.ok) console.error('pawhaven-api mail', r.status); // the answer to the player stays the same either way
  return r.ok;
}

/* ---------------- Dog Cards (v2.11): no free text anywhere ---------------- */
// The game keeps the lists (game/src/40_dogcards.js: DC_WORDS_A, DC_WORDS_B, DC_DOG_NAMES, DC_OUTFITS, and PawGenes BREEDS). They are
// append-only, so a card is only indices into them. When a list grows, raise its count here in the same release (test_v211_cards checks).
const DC_LIM = { a: 40, b: 40, n: 115, breed: 35, outfit: 50 }; // v2.12: 35 breeds (80 pet names + 35 breed words), 50 outfits
const DC_COAT = { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['M', 'm'], Bl: ['Bl', 'bl'] }; // allele tokens (mods/genes.js LOCI)
const DC_DOGS = 4, DC_MAX = 2048, DC_DAYS = 30, DC_ID = /^[A-Za-z0-9_-]{22}$/;
const dcInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const dcKeys = (o, keys) => !!o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).every((k) => keys.includes(k)) && keys.every((k) => k in o);
const dcDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); // the Japan day (JST), the same day the game uses (jstISO)
function dcCoat(c) {
  if (c === null) return null; // a dog with no genes: its breed's own coat
  if (typeof c === 'string') return /^#[0-9a-fA-F]{6}$/.test(c) ? c.toLowerCase() : undefined;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return undefined;
  const ks = Object.keys(c); if (!ks.length || ks.some((k) => !Object.hasOwn(DC_COAT, k))) return undefined; // own names only (never constructor, __proto__)
  const out = {};
  for (const k of Object.keys(DC_COAT)) {
    if (!Object.hasOwn(c, k)) continue; const v = c[k];
    if (!Array.isArray(v) || v.length !== 2 || !v.every((x) => DC_COAT[k].includes(x))) return undefined;
    out[k] = [v[0], v[1]];
  }
  if (out.M && out.M[0] === 'M' && out.M[1] === 'M') return undefined; // never a double merle
  return Object.keys(out).length ? out : undefined;
}
// the body of PUT /card -> { a, b, dogs } in the Worker's own shape, or null (400 bad_card). Anything not on the lists is refused.
function dcCardOf(body) {
  if (JSON.stringify(body).length > DC_MAX || !dcKeys(body, ['name', 'dogs'])) return null;
  const nm = body.name, ds = body.dogs;
  if (!Array.isArray(nm) || nm.length !== 2 || !dcInt(nm[0], 0, DC_LIM.a - 1) || !dcInt(nm[1], 0, DC_LIM.b - 1)) return null;
  if (!Array.isArray(ds) || ds.length < 1 || ds.length > DC_DOGS) return null;
  const dogs = [];
  for (const d of ds) {
    if (!dcKeys(d, ['b', 'c', 'o', 'a', 's', 'sp', 'n'])) return null;
    const c = dcCoat(d.c);
    if (c === undefined || !dcInt(d.b, 0, DC_LIM.breed - 1) || !dcInt(d.o, -1, DC_LIM.outfit - 1) || !dcInt(d.n, 0, DC_LIM.n - 1) || !dcInt(d.sp, 0, 1)) return null;
    if (d.a !== 'pup' && d.a !== 'adult') return null;
    if (d.s !== 'm' && d.s !== 'f') return null;
    dogs.push({ b: d.b, c, o: d.o, a: d.a, s: d.s, sp: d.sp, n: d.n });
  }
  return { a: nm[0], b: nm[1], dogs };
}
// a stored row -> what another player sees: the card id, the two name words, the dogs, the paws. Never a user id or an email.
function dcPub(r, mine) {
  let dogs = []; try { dogs = JSON.parse(r.dogs); } catch (e) { dogs = []; }
  const o = { id: r.id, name: [r.name_a | 0, r.name_b | 0], dogs, paws: r.paws | 0 };
  if (mine) o.at = r.updated_at | 0;
  return o;
}
const DC_COLS = 'c.id, c.name_a, c.name_b, c.dogs, c.paws, c.updated_at';

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
    return fail('invalid_credentials', 401); // an unknown email, or an old login with no password here: wrong email or password
  } },

  'POST /migrate': { auth: false, async fn() { return fail('gone', 410); } }, // v2.9.1: Supabase is gone, nothing carries over any more

  'POST /forgot': { auth: false, async fn({ env, ctx, ip, body }) {
    const email = norm(body.email);
    if (!EMAIL.test(email) || email.length > 254) return fail('invalid_email', 400);
    if (!mailOn(env)) return json({ ok: true, mail: false }); // no email service set up yet: the game says so
    if (await limited(env, 'forgot:' + ip, 10, 3600)) return fail('rate_limited', 429);
    const answer = json({ ok: true, mail: true }); // the same answer whether or not the email has an account
    const k = await sha256(email);
    if (await limited(env, 'forgot:' + k, 5, 3600)) return answer; // quietly: at most 5 codes an hour per email
    // Every email gets a code row, with or without an account, so /reset-code answers the same for both (only accounts get the mail).
    // A new code replaces the old one. Only a salted SHA-256 of the code is kept.
    const code = code6(), salt = hex(rnd(16)), now = Date.now();
    await run(env, `insert into reset_codes (k, code_hash, salt, created_at, expires_at, tries) values (?1, ?2, ?3, ?4, ?5, 0)
      on conflict(k) do update set code_hash = excluded.code_hash, salt = excluded.salt, created_at = excluded.created_at, expires_at = excluded.expires_at, tries = 0`,
      k, await sha256(salt + ':' + code), salt, now, now + RESET_MS);
    const u = await one(env, 'select id from users where email = ?1 and guest = 0', email);
    if (u) { // the mail goes out after the answer, so an email with an account isn't answered any slower (tests set MAIL_WAIT to see it at once)
      const sent = sendMail(env, email, codeMail(code)).catch((e) => { console.error('pawhaven-api mail', (e && e.message) || 'failed'); });
      if (ctx && ctx.waitUntil && !env.MAIL_WAIT) ctx.waitUntil(sent); else await sent;
    }
    return answer;
  } },

  'POST /reset-code': { auth: false, async fn({ env, ip, body }) {
    const email = norm(body.email), code = String(body.code == null ? '' : body.code).replace(/\s+/g, ''), pw = body.password;
    if (!EMAIL.test(email) || email.length > 254) return fail('invalid_email', 400);
    if (pwBad(pw)) return fail('weak_password', 400); // checked first: a short password costs no try
    if (!/^\d{6}$/.test(code)) return fail('wrong_code', 400, { left: null }); // not six digits: a typo, costs no try
    const k = await sha256(email);
    if ((await limited(env, 'code:' + ip, 30, 600)) || (await limited(env, 'code:' + k, 20, 3600))) return fail('rate_limited', 429);
    const now = Date.now();
    // every check takes a try first (atomically), so racing requests still get at most 5 between them
    const r = await one(env, 'update reset_codes set tries = tries + 1 where k = ?1 and expires_at > ?2 and tries < ?3 returning code_hash, salt, tries', k, now, CODE_TRIES);
    if (!r) {
      const d = await one(env, 'select expires_at from reset_codes where k = ?1', k);
      return fail(d && d.expires_at > now ? 'too_many_tries' : 'expired', 400);
    }
    if (!same(await sha256(r.salt + ':' + code), r.code_hash)) return fail(r.tries >= CODE_TRIES ? 'too_many_tries' : 'wrong_code', 400, { left: CODE_TRIES - r.tries });
    if (!(await one(env, 'delete from reset_codes where k = ?1 and code_hash = ?2 returning k', k, r.code_hash))) return fail('expired', 400); // single use
    const u = await one(env, 'select id from users where email = ?1 and guest = 0', email);
    if (!u) return fail('expired', 400);
    const h = await newHash(pw);
    await env.DB.batch([
      env.DB.prepare('update users set pw_hash = ?1, pw_salt = ?2 where id = ?3').bind(h.hash, h.salt, u.id),
      env.DB.prepare('delete from sessions where user_id = ?1').bind(u.id), // a new password logs every device out
      env.DB.prepare('delete from resets where user_id = ?1').bind(u.id)
    ]);
    const nu = await one(env, 'select * from users where id = ?1', u.id);
    return json({ token: await newSession(env, u.id), user: pub(nu) }); // and this device logs straight in
  } },

  'POST /reset': { auth: false, async fn({ env, ip, body }) {
    if (await limited(env, 'reset:' + ip, 20, 600)) return fail('rate_limited', 429);
    const pw = body.password;
    if (pwBad(pw)) return fail('weak_password', 400);
    let uid = null;
    if (typeof body.token === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(body.token)) {
      const th = await sha256(body.token);
      const r = await one(env, 'select user_id from resets where token_hash = ?1 and used = 0 and expires_at > ?2', th, Date.now());
      if (!r) return fail('expired', 400);
      const h = await newHash(pw);
      const done = await one(env, 'update resets set used = 1 where token_hash = ?1 and used = 0 returning user_id', th); // single use, even when two taps race
      if (!done) return fail('expired', 400);
      uid = done.user_id;
      await env.DB.batch([
        env.DB.prepare('update users set pw_hash = ?1, pw_salt = ?2, guest = 0 where id = ?3').bind(h.hash, h.salt, uid),
        env.DB.prepare('delete from resets where user_id = ?1').bind(uid)
      ]);
    } else return fail('expired', 400);
    await run(env, 'delete from sessions where user_id = ?1', uid); // a new password logs every device out
    const u = await one(env, 'select * from users where id = ?1', uid);
    return json({ token: await newSession(env, uid), user: pub(u) });
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

  /* ---------- Dog Cards (v2.11) ---------- */
  'GET /card': { auth: true, async fn({ env, me }) {
    const r = await one(env, `select ${DC_COLS} from cards c where c.user_id = ?1`, me.id);
    return json(r ? dcPub(r, true) : null);
  } },

  'PUT /card': { auth: true, async fn({ env, body, me }) {
    if (me.guest || !me.email) return fail('no_account', 403); // only email accounts share a card
    const c = dcCardOf(body);
    if (!c) return fail('bad_card', 400);
    if (await limited(env, 'card:' + me.id, 20, 3600)) return fail('rate_limited', 429);
    const r = await one(env, `insert into cards (id, user_id, name_a, name_b, dogs, paws, updated_at) values (?1, ?2, ?3, ?4, ?5, 0, ?6)
      on conflict(user_id) do update set name_a = excluded.name_a, name_b = excluded.name_b, dogs = excluded.dogs, updated_at = excluded.updated_at
      returning id, name_a, name_b, dogs, paws, updated_at`, b64url(rnd(16)), me.id, c.a, c.b, JSON.stringify(c.dogs), Date.now());
    return json(dcPub(r, true));
  } },

  'DELETE /card': { auth: true, async fn({ env, ctx, me }) {
    await dcTidySoon(env, ctx);
    const r = await one(env, 'select id from cards where user_id = ?1', me.id);
    if (r) await env.DB.batch([
      env.DB.prepare('delete from paws where card_id = ?1').bind(r.id),
      env.DB.prepare('delete from cards where id = ?1').bind(r.id)
    ]);
    return json({ ok: true });
  } },

  'GET /cards/visit': { async fn({ env, ctx, url, ip, me }) {
    if (await limited(env, 'visit:' + ip, 120, 3600)) return fail('rate_limited', 429);
    const n = Math.min(4, Math.max(1, parseInt(url.searchParams.get('n'), 10) || 2));
    const not = String(url.searchParams.get('not') || '').split(',').filter((x) => DC_ID.test(x)).slice(0, 40);
    const marks = not.map((x, i) => '?' + (i + 5)).join(', ');
    // random cards without sorting the whole table: walk the id key from a random id (ids are random too), and wrap round to the start
    const pick = (cmp, lim) => all(env, `select ${DC_COLS} from cards c join users u on u.id = c.user_id
      where c.id ${cmp} ?4 and u.guest = 0 and c.updated_at > ?1 and c.user_id != ?2 ${not.length ? `and c.id not in (${marks})` : ''} order by c.id limit ?3`,
      Date.now() - DC_DAYS * 864e5, me ? me.id : '', lim, start, ...not);
    const start = b64url(rnd(16));
    let rows = await pick('>=', n);
    if (rows.length < n) rows = rows.concat(await pick('<', n - rows.length));
    await dcTidySoon(env, ctx);
    return json(rows.map((r) => dcPub(r, false)));
  } },

  'POST /paw': { auth: true, async fn({ env, ctx, ip, body, me }) {
    const id = body.id;
    if (typeof id !== 'string' || !DC_ID.test(id) || Object.keys(body).length !== 1) return fail('bad_card', 400);
    const c = await one(env, 'select c.user_id, c.paws from cards c join users u on u.id = c.user_id where c.id = ?1 and u.guest = 0', id);
    if (!c) return fail('no_card', 404);
    if (c.user_id === me.id) return fail('own_card', 400);
    if (await limited(env, 'paw:' + me.id, 100, 3600)) return fail('rate_limited', 429);
    await dcTidySoon(env, ctx);
    const day = dcDay(Date.now());
    // at most 3 paws a day to one card from one IP (many guests on one device can't pile paws on a card): quietly, like a second paw
    if (await limited(env, 'pawip:' + ip + ':' + id + ':' + day, 3, 86400)) return json({ paws: c.paws | 0, given: false });
    // the paw and the count in one batch: the count goes up only when this account had no paw on this card today (changes() of the insert)
    const out = await env.DB.batch([
      env.DB.prepare('insert or ignore into paws (from_id, card_id, day) values (?1, ?2, ?3)').bind(me.id, id, day),
      env.DB.prepare('update cards set paws = paws + 1 where id = ?1 and changes() = 1 returning paws').bind(id)
    ]);
    const r = out[1] && out[1].results && out[1].results[0];
    if (!r) return json({ paws: c.paws | 0, given: false }); // already a paw from this account today
    return json({ paws: r.paws | 0, given: true });
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
