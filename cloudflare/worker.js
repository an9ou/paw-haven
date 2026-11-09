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
//   PUT  /save {data,rev,changed_at,device} -> { rev }   409 { error:'stale', rev, changed_at } if the cloud has a newer rev, or a higher rev whose changed_at is older
//   GET  /backups -> { backups: [{id,data,reason,created_at}] }   POST /backups {data,reason}  (the newest 5 are kept)
//   Dog Cards (v2.11, V211.md section 5.5). No free text anywhere: only integers and fixed tokens, checked by dcCardOf().
//   GET    /card                     -> { id, name, dogs, paws, at } | null      my card (at: last update, ms)
//   PUT    /card {name, dogs}        -> my card   email accounts only (403 no_account for guests), 400 bad_card, 20 an hour
//   DELETE /card                     -> { ok }    stop sharing: the card and its paws are deleted
//   GET    /cards/visit?n=2&not=ids  -> [{ id, name, dogs, paws }]   no session needed (120 an hour per IP); never the caller's own
//   POST   /paw {id}                 -> { paws, given }   one paw per card per Japan day per account (guests too), never your own, 100 an hour
//   Friends (v2.19, V219.md sections 1, 2 and 7). A bearer token (guest or email). No free text, and no user id, email or
//   exact time in any answer. seen is only today / week / older. Errors are { error: 'code' }.
//   GET  /friends                          -> { me, friends }     120/h   an official account (users.official, D1 only) gets its newest 50
//   POST /friends/me { name:[a,b] }        -> me                  20/h
//   POST /friends/code/new                 -> me                  5 per Japan day
//   POST /friends/add { code }             -> { ok }              10/h per user and 30/h per IP; misses count
//   POST /friends/remove { fid }           -> { ok }              30/h
//   POST /friends/block { fid }            -> { ok }              30/h
//   PUT  /friends/yard { yard }            -> { ok }              30/h
//   GET  /friends/yard?fid=                -> { yard }            120/h   friends only, otherwise not_found
//   POST /friends/send { fid, kind, data } -> { ok }              60/h    limit when today's send is used
//   GET  /friends/inbox                    -> { events }          120/h   at most 30: pets and notes first, then gifts and walks, oldest first in each
//   POST /friends/inbox/claim { ids }      -> { ok }              120/h
//   POST /friends/leave                    -> { ok }              30/h    V219.md gives leave no limit; same as remove and block
//   Kind shop (v2.24, V224.md 4; Stripe Managed Payments, Stripe is the merchant of record). Every /shop/* route answers 503
//   { error: 'shop_closed' } while STRIPE_KEY is unset (the webhook also needs STRIPE_WEBHOOK_SECRET). Prices come from SHOP_ITEMS
//   below and the SHOP_PRICES secret (JSON), never from the game. Setup: docs/design/kind-shop-stripe-setup.md.
//   GET  /shop/catalog                     -> { items: [{ id, usd, once, on }] }   no session; usd in US cents, on: a Stripe price is set
//   POST /shop/checkout { item }           -> { url }      email accounts only (403 no_account), 20/h, 409 owned (a one-time item)
//   POST /shop/webhook  (Stripe; raw body + Stripe-Signature) -> { received: true }   400 bad_signature / stale
//   GET  /shop/owned                       -> { purchases: [{ id, item, at, refunded }] }   120/h
//   A Founding Friend (a supporter purchase, not refunded) gets ff: 1 on its Dog Card and friend yard, set here from purchases.
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
  if (p === '/shop/webhook' && m === 'POST') return shopWebhook(req, env); // Stripe, server to server: the signature covers the raw body, so it is read before any JSON parsing
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
    env.DB.prepare('delete from paws where day < ?1').bind(dcDay(now - 3 * 864e5)), // Dog Cards: paws only matter for today (index paws_day)
    env.DB.prepare('delete from purchases where user_id not in (select id from users)') // v2.24: a deleted account's purchases go with it (Stripe keeps its own records)
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
const DC_LIM = { a: 40, b: 40, n: 120, breed: 40, outfit: 57 }; // v2.12: 35 breeds (80 pet names + 35 breed words), 50 outfits; v2.21: 40 breeds (+5 breed words), deployed with the v2.21 launch; v2.24: 57 outfits (+ the Golden Name Tag and the Tokyo Street six)
// v2.19 Friends. Part 2 (game/src/50_friends.js) builds FR_GIFTS in this order and must keep FR_LIM in step (its test checks lengths):
//   notes 12: the twelve FR_NOTES lines in V219.md section 4
//   gifts 47: every FOOD row in table order except Fresh Water (33) + Wild Berries and Duck's Picnic Sandwich (walk t) +
//             6 seed packets + 6 garden crops. Golden Bone stays out (rare +60 Bond; gifts give only a little Bond).
//   decor 31: HM_DECOR yard entries (missing room counts as yard). House decor and furniture are not included.
//   houses 15: every HOUSES row (v2.24: + the Golden Paw Cottage, the Supporter House)
const FR_LIM = { notes: 12, gifts: 47, decor: 31, houses: 15 };
const DC_COAT = { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['M', 'm'], Bl: ['Bl', 'bl'], A: ['at', 'a'], I: ['I', 'i'] }; // allele tokens (mods/genes.js LOCI; v2.21: A = TAN, the Aussie's copper, sent by the game only with MS2_LIVE; I = RED_I, the fox red Lab and dark golden, optional)
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
// one Dog Card dog in the Worker's own shape, or null. Friends use the same checks (a yard may hold 5, a card 4).
// v2.23: two optional keys. e = the dog's eyes (an index into the game's DC_EYES: brown, amber, blue, odd), p = its coat-pattern seed (a 32-bit
// number, the hash of the dog's local id). A dog without them (every card and yard before v2.23) is stored and served exactly as before.
const DC_DOG_KEYS = ['b', 'c', 'o', 'a', 's', 'sp', 'n'], DC_DOG_OPT = ['e', 'p'], DC_EYES_N = 4;
function dcDog(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d) || !DC_DOG_KEYS.every((k) => Object.hasOwn(d, k)) || Object.keys(d).some((k) => !DC_DOG_KEYS.includes(k) && !DC_DOG_OPT.includes(k))) return null;
  const c = dcCoat(d.c);
  if (c === undefined || !dcInt(d.b, 0, DC_LIM.breed - 1) || !dcInt(d.o, -1, DC_LIM.outfit - 1) || !dcInt(d.n, 0, DC_LIM.n - 1) || !dcInt(d.sp, 0, 1)) return null;
  if (d.a !== 'pup' && d.a !== 'adult') return null;
  if (d.s !== 'm' && d.s !== 'f') return null;
  if (Object.hasOwn(d, 'e') && !dcInt(d.e, 0, DC_EYES_N - 1)) return null;
  if (Object.hasOwn(d, 'p') && !dcInt(d.p, 0, 4294967295)) return null;
  const out = { b: d.b, c, o: d.o, a: d.a, s: d.s, sp: d.sp, n: d.n };
  if (Object.hasOwn(d, 'e')) out.e = d.e;
  if (Object.hasOwn(d, 'p')) out.p = d.p;
  return out;
}
// the body of PUT /card -> { a, b, dogs } in the Worker's own shape, or null (400 bad_card). Anything not on the lists is refused.
function dcCardOf(body) {
  if (JSON.stringify(body).length > DC_MAX || !ffOk(body)) return null;
  body = ffStrip(body); // v2.24: the game may send ff; the badge is the server's to give (from purchases)
  if (!dcKeys(body, ['name', 'dogs'])) return null;
  const nm = body.name, ds = body.dogs;
  if (!Array.isArray(nm) || nm.length !== 2 || !dcInt(nm[0], 0, DC_LIM.a - 1) || !dcInt(nm[1], 0, DC_LIM.b - 1)) return null;
  if (!Array.isArray(ds) || ds.length < 1 || ds.length > DC_DOGS) return null;
  const dogs = [];
  for (const d of ds) { const dog = dcDog(d); if (!dog) return null; dogs.push(dog); }
  return { a: nm[0], b: nm[1], dogs };
}
// a stored row -> what another player sees: the card id, the two name words, the dogs, the paws. Never a user id or an email.
function dcPub(r, mine) {
  let dogs = []; try { dogs = JSON.parse(r.dogs); } catch (e) { dogs = []; }
  const o = { id: r.id, name: [r.name_a | 0, r.name_b | 0], dogs, paws: r.paws | 0 };
  if (r.ff) o.ff = 1; // v2.24: a Founding Friend, from the purchases table (never from the client)
  if (mine) o.at = Number(r.updated_at) || 0; // a millisecond time. `| 0` keeps only 32 bits, so `at` was never a real clock and the game republished the card on every sync.
  return o;
}
// a Founding Friend: a supporter purchase that was not refunded (v2.24)
const FF_SQL = (col) => `exists (select 1 from purchases fp where fp.user_id = ${col} and fp.item = 'supporter' and fp.refunded_at is null)`;
const DC_COLS = `c.id, c.name_a, c.name_b, c.dogs, c.paws, c.updated_at, ${FF_SQL('c.user_id')} as ff`;

/* ---------------- Friends (v2.19) ---------------- */
// Codes skip 0, O, 1, I and L, so a crayon card is readable. 31 letters, about 28.6 million codes.
const FR_ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const FR_CODE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;
const FR_KINDS = ['pet', 'note', 'gift', 'walk'];
const FR_SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const FR_MAX_FRIENDS = 50, FR_OFFICIAL_LIST = 50, FR_YARD_MAX = 16384, FR_DOGS = 5, FR_DECOR_N = 40, FR_KEEP = 30 * 864e5, FR_INBOX = 30;
// Rate-limit keys. test_worker.js looks these up to check each limit.
const frKey = {
  list: (id) => 'fr:list:' + id, me: (id) => 'fr:me:' + id, code: (id, day) => 'fr:code:' + id + ':' + day,
  add: (id) => 'fr:add:' + id, addip: (ip) => 'fr:addip:' + ip, rm: (id) => 'fr:rm:' + id, block: (id) => 'fr:block:' + id,
  yard: (id) => 'fr:yard:' + id, yardGet: (id) => 'fr:yardget:' + id, send: (id) => 'fr:send:' + id,
  inbox: (id) => 'fr:in:' + id, claim: (id) => 'fr:claim:' + id, leave: (id) => 'fr:leave:' + id
};
// DOG- plus 5 characters, from crypto.getRandomValues. 248 is 8*31, so the leftover byte values are thrown away
// and every character is equally likely (the same idea as the 6-digit password code).
function frCode() {
  const b = new Uint8Array(1);
  let s = 'DOG-';
  for (let i = 0; i < 5; i++) {
    let x;
    do { crypto.getRandomValues(b); x = b[0]; } while (x >= 248);
    s += FR_ALPH[x % 31];
  }
  return s;
}
// Case does not matter. Spaces and the DOG- prefix are optional, and so is the hyphen in that prefix.
function frNormCode(s) {
  if (typeof s !== 'string' || s.length > 40) return null;
  let t = s.replace(/\s+/g, '').toUpperCase();
  if (t.startsWith('DOG-')) t = t.slice(4);
  else if (t.startsWith('DOG')) t = t.slice(3);
  return FR_CODE.test(t) ? 'DOG-' + t : null;
}
const frFidOk = (s) => typeof s === 'string' && DC_ID.test(s);
function frOnly(o, required, optional) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  const ks = Object.keys(o), allow = required.concat(optional || []);
  return ks.every((k) => allow.includes(k)) && required.every((k) => ks.includes(k));
}
function frName(v) {
  if (!Array.isArray(v) || v.length !== 2 || !dcInt(v[0], 0, DC_LIM.a - 1) || !dcInt(v[1], 0, DC_LIM.b - 1)) return null;
  return [v[0], v[1]];
}
// What another player is allowed to see. Never the user id, the email, or a clock time.
function frPub(r) { return { fid: r.fid, code: r.code, name: [r.name_a | 0, r.name_b | 0] }; }
// today: that Japan day. week: the six Japan days before it. older: anything else, including never.
function frSeen(ms, now) {
  ms = Number(ms) || 0;
  if (ms <= 0) return 'older';
  const today = dcDay(now), day = dcDay(ms);
  if (day >= today) return 'today';
  const diff = Math.round((Date.parse(today + 'T00:00:00Z') - Date.parse(day + 'T00:00:00Z')) / 864e5);
  return diff < 7 ? 'week' : 'older';
}
function frDogsOf(text) {
  if (!text) return [];
  let y; try { y = JSON.parse(text); } catch (e) { return []; }
  if (!y || !Array.isArray(y.dogs)) return [];
  const out = [];
  for (const d of y.dogs) { const dog = dcDog(d); if (!dog) continue; out.push(dog); if (out.length === FR_DOGS) break; }
  return out;
}
// The snapshot from section 2, in the Worker's own shape, or null (400 bad). Anything else is refused.
function frYard(yard) {
  let raw; try { raw = JSON.stringify(yard); } catch (e) { return null; }
  if (!raw || raw.length > FR_YARD_MAX) return null;
  if (!ffOk(yard)) return null;
  yard = ffStrip(yard); // v2.24: the game may send ff; GET /friends/yard sets it from purchases
  if (!dcKeys(yard, ['v', 'name', 'house', 'season', 'dogs', 'decor'])) return null;
  if (yard.v !== 1) return null;
  const name = frName(yard.name);
  if (!name || !dcInt(yard.house, 0, FR_LIM.houses - 1) || typeof yard.season !== 'string' || !FR_SEASONS.includes(yard.season)) return null;
  if (!Array.isArray(yard.dogs) || yard.dogs.length > FR_DOGS || !Array.isArray(yard.decor) || yard.decor.length > FR_DECOR_N) return null;
  const dogs = [];
  for (const d of yard.dogs) { const dog = dcDog(d); if (!dog) return null; dogs.push(dog); }
  const decor = [];
  for (const p of yard.decor) {
    if (!dcKeys(p, ['i', 'x', 'y']) || !dcInt(p.i, 0, FR_LIM.decor - 1) || !dcInt(p.x, 0, 1200) || !dcInt(p.y, 0, 800)) return null;
    decor.push({ i: p.i, x: p.x, y: p.y });
  }
  const out = { v: 1, name, house: yard.house, season: yard.season, dogs, decor };
  if (JSON.stringify(out).length > FR_YARD_MAX) return null;
  return out;
}
function frPet(data) { if (data == null) return {}; return dcKeys(data, []) ? {} : null; }
function frNote(data) {
  if (!dcKeys(data, ['i']) || !dcInt(data.i, 0, FR_LIM.notes - 1)) return null;
  return { i: data.i };
}
function frGift(data) {
  if (!dcKeys(data, ['i', 'n']) || !dcInt(data.i, 0, FR_LIM.gifts - 1) || data.n !== 1) return null;
  return { i: data.i, n: 1 };
}
// dog is an index into that friend's snapshot. mine is the sender's leader, checked like a Dog Card dog.
// t, when present, is a gift-list index (the walk's treasure). No snapshot, or an index past its dogs: null.
function frWalk(data, dogs) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const ks = Object.keys(data);
  if (!ks.includes('dog') || !ks.includes('mine') || ks.some((k) => k !== 'dog' && k !== 'mine' && k !== 't')) return null;
  if (!dcInt(data.dog, 0, 4) || !Array.isArray(dogs) || data.dog >= dogs.length) return null;
  const mine = dcDog(data.mine);
  if (!mine) return null;
  const out = { dog: data.dog, mine };
  if (ks.includes('t')) { if (!dcInt(data.t, 0, FR_LIM.gifts - 1)) return null; out.t = data.t; }
  return out;
}
const frMine = (env, uid) => one(env, 'select fid, code, name_a, name_b, seen_at from friend_ids where user_id = ?1', uid);
const frByFid = (env, fid) => one(env, 'select user_id, fid, code, name_a, name_b from friend_ids where fid = ?1', fid);
const frByCode = (env, code) => one(env, 'select user_id, fid, name_a, name_b, seen_at from friend_ids where code = ?1', code);
// v2.22.3 official accounts (V219.md "Official accounts"): users.official = 1, set by hand in D1 only (no route writes it).
// An official account has no friend cap, a friendship with one does not count toward the other player's 50, and its own
// GET /friends lists only its newest FR_OFFICIAL_LIST friends.
const frIsOfficial = async (env, uid) => { const r = await one(env, 'select official from users where id = ?1', uid); return !!(r && r.official); };
// My friends that count toward the 50: official accounts left out.
const FR_COUNT_SQL = (p) => `(select count(*) from friends cf left join users cu on cu.id = cf.friend_id where cf.user_id = ${p} and coalesce(cu.official, 0) = 0)`;
const frCount = async (env, uid) => { const r = await one(env, `select ${FR_COUNT_SQL('?1')} as n`, uid); return r ? r.n | 0 : 0; };
const frFriends = async (env, a, b) => !!(await one(env, 'select 1 as x from friends where user_id = ?1 and friend_id = ?2', a, b));
const frBlocked = async (env, a, b) => !!(await one(env, 'select 1 as x from friend_blocks where (user_id = ?1 and blocked_id = ?2) or (user_id = ?2 and blocked_id = ?1)', a, b));
async function frSnapDogs(env, uid) {
  const y = await one(env, 'select data from yards where user_id = ?1', uid);
  if (!y) return null;
  try { const o = JSON.parse(y.data); return Array.isArray(o.dogs) ? o.dogs : []; } catch (e) { return []; }
}
// A new fid and code. A clash (two players rolling the same one) tries again. seen_at stays 0 until a yard save or an inbox read.
async function frCreate(env, uid, a, b) {
  for (let i = 0; i < 8; i++) {
    const fid = b64url(rnd(16)), code = frCode(), now = Date.now();
    const row = await one(env, `insert into friend_ids (user_id, fid, code, name_a, name_b, created_at, code_at, seen_at)
      select ?1, ?2, ?3, ?4, ?5, ?6, ?6, 0
      where not exists (select 1 from friend_ids where user_id = ?1 or fid = ?2 or code = ?3)
      returning fid, code, name_a, name_b`, uid, fid, code, a, b, now);
    if (row) return row;
    const cur = await one(env, 'select fid, code, name_a, name_b from friend_ids where user_id = ?1', uid);
    if (cur) return cur;
  }
  return null;
}
async function frRotate(env, uid) {
  for (let i = 0; i < 8; i++) {
    const code = frCode();
    const row = await one(env, `update friend_ids set code = ?1, code_at = ?2
      where user_id = ?3 and not exists (select 1 from friend_ids where code = ?1)
      returning fid, code, name_a, name_b`, code, Date.now(), uid);
    if (row) return row;
  }
  return null;
}
async function frList(env, uid) {
  const mine = await frMine(env, uid), day = dcDay(Date.now()), now = Date.now();
  // An official account can have thousands: it gets its newest FR_OFFICIAL_LIST only (then oldest first, like everyone else's).
  const cap = (await frIsOfficial(env, uid)) ? ` limit ${FR_OFFICIAL_LIST}` : '';
  const rows = await all(env, `select * from (select f.friend_id as uid, fi.fid as fid, fi.name_a as name_a, fi.name_b as name_b, fi.seen_at as seen_at, y.data as yard,
      coalesce(u.official, 0) as official, f.created_at as at
    from friends f join friend_ids fi on fi.user_id = f.friend_id left join yards y on y.user_id = f.friend_id left join users u on u.id = f.friend_id
    where f.user_id = ?1 order by f.created_at desc, fi.fid desc${cap}) order by at asc, fid asc`, uid);
  const ev = await all(env, 'select to_id, kind from friend_events where from_id = ?1 and day = ?2', uid, day);
  const sent = new Map();
  for (const e of ev) { if (!sent.has(e.to_id)) sent.set(e.to_id, new Set()); sent.get(e.to_id).add(e.kind); }
  const friends = rows.map((r) => {
    const kinds = sent.get(r.uid) || new Set();
    const f = {
      fid: r.fid, name: [r.name_a | 0, r.name_b | 0], dogs: frDogsOf(r.yard), seen: frSeen(r.seen_at, now),
      sent: { pet: kinds.has('pet'), note: kinds.has('note'), gift: kinds.has('gift'), walk: kinds.has('walk') }
    };
    if (r.official) f.official = true; // only on an official account's row: everyone else's answer is as before
    return f;
  });
  return { me: mine ? frPub(mine) : null, friends };
}
// Both rows, or neither. The WHERE is the race backstop for the 50 cap, a block and a double add.
// The cap is off when either side is official (the official side has none, and it does not count for the other side);
// otherwise each side's non-official friends must be under 50.
async function frLink(env, a, b) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(`insert into friends (user_id, friend_id, created_at)
      select ?1, ?2, ?3
      where (coalesce((select official from users where id = ?1), 0) = 1 or coalesce((select official from users where id = ?2), 0) = 1
          or (${FR_COUNT_SQL('?1')} < ${FR_MAX_FRIENDS} and ${FR_COUNT_SQL('?2')} < ${FR_MAX_FRIENDS}))
        and not exists (select 1 from friends where user_id = ?1 and friend_id = ?2)
        and not exists (select 1 from friends where user_id = ?2 and friend_id = ?1)
        and not exists (select 1 from friend_blocks where (user_id = ?1 and blocked_id = ?2) or (user_id = ?2 and blocked_id = ?1))`).bind(a, b, now),
    env.DB.prepare(`insert into friends (user_id, friend_id, created_at)
      select ?2, ?1, ?3
      where exists (select 1 from friends where user_id = ?1 and friend_id = ?2)
        and not exists (select 1 from friends where user_id = ?2 and friend_id = ?1)`).bind(a, b, now)
  ]);
  return frFriends(env, a, b);
}
async function frUnlink(env, a, b) {
  await env.DB.batch([
    env.DB.prepare('delete from friends where (user_id = ?1 and friend_id = ?2) or (user_id = ?2 and friend_id = ?1)').bind(a, b),
    env.DB.prepare('delete from friend_events where claimed_at is null and ((from_id = ?1 and to_id = ?2) or (from_id = ?2 and to_id = ?1))').bind(a, b)
  ]);
}
// Like dcTidy: drop friend rows whose user id is gone. About 1 in 50 friend requests; every time under env.TIDY (tests).
async function frTidy(env) {
  await env.DB.batch([
    env.DB.prepare('delete from friend_ids where user_id not in (select id from users)'),
    env.DB.prepare('delete from friends where user_id not in (select id from users) or friend_id not in (select id from users)'),
    env.DB.prepare('delete from friend_blocks where user_id not in (select id from users) or blocked_id not in (select id from users)'),
    env.DB.prepare('delete from yards where user_id not in (select id from users)'),
    env.DB.prepare('delete from friend_events where from_id not in (select id from users) or to_id not in (select id from users)')
  ]);
}
function frTidySoon(env, ctx) {
  if (env.TIDY) return frTidy(env);
  if (Math.random() < 0.02 && ctx && ctx.waitUntil) ctx.waitUntil(frTidy(env).catch(() => {}));
}

/* ---------------- Kind shop (v2.24, V224.md 4): Stripe Checkout with Managed Payments, through fetch (no SDK) ---------------- */
// The catalogue. usd: US cents (Stripe shows the local currency at checkout). once: one per account (a full refund frees it again).
// The Stripe price ids come from the SHOP_PRICES secret (JSON): { "supporter": "price_...", ... } or { "supporter": { "price": "price_...", "usd": 499 } }.
// The game never sends a price: checkout looks the item up here.
const SHOP_ITEMS = {
  supporter: { usd: 499, once: true }, tokyo: { usd: 299, once: true }, cozy: { usd: 299, once: true },
  robo: { usd: 199, once: true }, sprinkler: { usd: 99, once: true }, bowl: { usd: 99, once: true }, comfort: { usd: 299, once: true },
  coins_1k: { usd: 99, once: false }, coins_3k: { usd: 199, once: false }, coins_8k: { usd: 499, once: false }
};
const SHOP_TOOLS = ['robo', 'sprinkler', 'bowl'];
const SHOP_TOL = 300; // seconds: a webhook signed more than 5 minutes ago (or ahead) is refused
const SHOP_OK_URL = 'https://doodledoggo.app/thanks?ok=1', SHOP_NO_URL = 'https://doodledoggo.app/thanks?ok=0';
const SHOP_SID = /^cs_[A-Za-z0-9_]{6,250}$/, SHOP_PI = /^pi_[A-Za-z0-9_]{6,250}$/, SHOP_PRICE = /^price_[A-Za-z0-9_]{4,250}$/;
const shopOpen = (env) => !!env.STRIPE_KEY;
function shopPrices(env) {
  let o = {}; try { o = env.SHOP_PRICES ? JSON.parse(env.SHOP_PRICES) : {}; } catch (e) { o = {}; }
  return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
}
// one catalogue row { id, usd, once, price } (price: the Stripe price id, or null while it is not set up), or null for an unknown id
function shopItem(env, id) {
  if (typeof id !== 'string' || !Object.hasOwn(SHOP_ITEMS, id)) return null;
  const P = shopPrices(env), base = SHOP_ITEMS[id], c = Object.hasOwn(P, id) ? P[id] : null;
  const price = typeof c === 'string' ? c : c && typeof c.price === 'string' ? c.price : null;
  const usd = c && typeof c === 'object' && Number.isInteger(c.usd) && c.usd > 0 ? c.usd : base.usd;
  return { id, usd, once: base.once, price: price && SHOP_PRICE.test(price) ? price : null };
}
const shopFF = async (env, uid) => { const r = await one(env, `select ${FF_SQL('?1')} as ff`, uid); return !!(r && r.ff); };
// ff on a card or a yard from the game: a boolean (or 0 / 1) when present, then dropped (shopFF decides)
const ffOk = (o) => !o || typeof o !== 'object' || Array.isArray(o) || !Object.hasOwn(o, 'ff') || [true, false, 0, 1].includes(o.ff);
function ffStrip(o) { if (!o || typeof o !== 'object' || Array.isArray(o) || !Object.hasOwn(o, 'ff')) return o; const c = Object.assign({}, o); delete c.ff; return c; }
// a one-time item this account owns already (not refunded); the Comfort Kit covers its three tools, and all three tools cover the Kit
async function shopOwnsOnce(env, uid, id) {
  const have = new Set((await all(env, 'select distinct item from purchases where user_id = ?1 and refunded_at is null', uid)).map((r) => r.item));
  if (have.has(id)) return true;
  if (SHOP_TOOLS.includes(id) && have.has('comfort')) return true;
  return id === 'comfort' && SHOP_TOOLS.every((t) => have.has(t));
}
// form encoding for the Stripe API (nested keys written out, e.g. line_items[0][price]); undefined values are left out
const shopForm = (o) => Object.keys(o).filter((k) => o[k] !== undefined && o[k] !== null).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(String(o[k]))).join('&');
async function shopStripe(env, path, form) {
  const f = env.STRIPE_FETCH || fetch; // tests pass a fake: they never reach the real Stripe
  const h = { Authorization: 'Bearer ' + env.STRIPE_KEY, 'Content-Type': 'application/x-www-form-urlencoded' };
  if (env.STRIPE_VERSION) h['Stripe-Version'] = env.STRIPE_VERSION; // else the account's default API version (Managed Payments: 2025-03-31.basil or later)
  const r = await f('https://api.stripe.com/v1' + path, { method: 'POST', headers: h, body: shopForm(form) });
  let data = null; try { data = await r.json(); } catch (e) { data = null; }
  return { ok: r.ok, status: r.status, data };
}
// Stripe-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of `${t}.${raw}` with the endpoint's signing secret>[,v1=...]. -> true, 'stale' or false
async function shopSigOk(env, raw, header) {
  if (typeof header !== 'string' || header.length > 2000) return false;
  let t = null; const v1 = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('='); if (i < 0) continue;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k === 't' && /^\d{1,12}$/.test(v)) t = v; else if (k === 'v1' && /^[0-9a-f]{64}$/.test(v)) v1.push(v);
  }
  if (!t || !v1.length) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const want = hex(await crypto.subtle.sign('HMAC', key, enc.encode(t + '.' + raw)));
  let good = false; for (const s of v1) if (same(s, want)) good = true; // constant time, and every candidate is checked
  if (!good) return false;
  return Math.abs(Date.now() / 1000 - Number(t)) <= SHOP_TOL ? true : 'stale';
}
// POST /shop/webhook: no session, no CORS (Stripe calls it server to server). Always 200 for an event it does not need.
async function shopWebhook(req, env) {
  if (!shopOpen(env) || !env.STRIPE_WEBHOOK_SECRET) return fail('shop_closed', 503);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return fail('too_big', 413);
  const sig = await shopSigOk(env, raw, req.headers.get('Stripe-Signature'));
  if (sig === 'stale') return fail('stale', 400);
  if (sig !== true) return fail('bad_signature', 400);
  let ev; try { ev = JSON.parse(raw); } catch (e) { return fail('bad_json', 400); }
  const o = ev && ev.data && ev.data.object, type = String((ev && ev.type) || '');
  if (!o || typeof o !== 'object') return json({ received: true });
  if ((type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') && o.payment_status === 'paid') {
    const md = o.metadata && typeof o.metadata === 'object' ? o.metadata : {}, uid = o.client_reference_id;
    if (typeof o.id !== 'string' || !SHOP_SID.test(o.id) || !shopItem(env, md.item) || typeof uid !== 'string' || !uid || uid.length > 64 || (md.user && md.user !== uid)) {
      console.error('pawhaven-api shop: a paid session the Worker cannot place', typeof o.id === 'string' ? o.id.slice(0, 40) : '?');
      return json({ received: true });
    }
    const pi = typeof o.payment_intent === 'string' && SHOP_PI.test(o.payment_intent) ? o.payment_intent : null;
    // idempotent on the session id: Stripe retries, and completed and async_payment_succeeded can both arrive for one session
    await run(env, `insert into purchases (id, user_id, item, amount, currency, payment_intent, created_at, refunded_at) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, null)
      on conflict(id) do update set payment_intent = coalesce(purchases.payment_intent, excluded.payment_intent)`,
      o.id, uid, md.item, Number.isInteger(o.amount_total) ? o.amount_total : null, typeof o.currency === 'string' ? o.currency.slice(0, 8) : null, pi, Date.now());
    return json({ received: true });
  }
  if (type === 'charge.refunded') { // a full refund only (charge.refunded true): a partial refund keeps the item
    const pi = typeof o.payment_intent === 'string' && SHOP_PI.test(o.payment_intent) ? o.payment_intent : null;
    if (pi && o.refunded === true) await run(env, 'update purchases set refunded_at = ?1 where payment_intent = ?2 and refunded_at is null', Date.now(), pi);
  }
  return json({ received: true });
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
    await env.DB.batch([
      env.DB.prepare('update users set pw_hash = ?1, pw_salt = ?2 where id = ?3').bind(h.hash, h.salt, me.id),
      env.DB.prepare('delete from sessions where user_id = ?1 and token_hash != ?2').bind(me.id, me.th) // same as a reset: other devices lose the old password's sessions. This device keeps its token.
    ]);
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
      where saves.rev < excluded.rev and saves.changed_at <= excluded.changed_at returning rev`, me.id, data, rev, new Date(at).toISOString(), dev, now);
    if (!r) { // a newer rev already stored, or this rev is higher but its changed_at is older: the game looks again and decides
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
    if (await shopFF(env, me.id)) r.ff = 1;
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

  /* ---------- Friends (v2.19) ---------- */
  'GET /friends': { auth: true, async fn({ env, ctx, me }) {
    await frTidySoon(env, ctx);
    if (await limited(env, frKey.list(me.id), 120, 3600)) return fail('rate_limited', 429);
    return json(await frList(env, me.id));
  } },

  'POST /friends/me': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, ['name'])) return fail('bad', 400);
    const name = frName(body.name);
    if (!name) return fail('bad', 400);
    if (await limited(env, frKey.me(me.id), 20, 3600)) return fail('rate_limited', 429);
    const cur = await frMine(env, me.id);
    if (cur) {
      const row = await one(env, 'update friend_ids set name_a = ?1, name_b = ?2 where user_id = ?3 returning fid, code, name_a, name_b', name[0], name[1], me.id);
      return json(frPub(row));
    }
    const row = await frCreate(env, me.id, name[0], name[1]);
    if (!row) return fail('busy', 503);
    return json(frPub(row));
  } },

  'POST /friends/code/new': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, [])) return fail('bad', 400);
    if (!(await frMine(env, me.id))) return fail('bad', 400);
    const day = dcDay(Date.now());
    if (await limited(env, frKey.code(me.id, day), 5, 86400)) return fail('rate_limited', 429);
    const row = await frRotate(env, me.id);
    if (!row) return fail('busy', 503);
    return json(frPub(row));
  } },

  'POST /friends/add': { auth: true, async fn({ env, ctx, ip, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, ['code'])) return fail('bad', 400);
    if (!(await frMine(env, me.id))) return fail('bad', 400); // no friend id of my own: a row the other side could never see or remove
    // Every attempt counts, including a miss, so guessing codes costs the same as a hit.
    const overUser = await limited(env, frKey.add(me.id), 10, 3600);
    const overIp = await limited(env, frKey.addip(ip), 30, 3600);
    if (overUser || overIp) return fail('rate_limited', 429);
    const code = frNormCode(body.code);
    if (!code) return fail('not_found', 404);
    const them = await frByCode(env, code);
    if (!them) return fail('not_found', 404);
    if (them.user_id === me.id) return fail('self', 400);
    if (await frBlocked(env, me.id, them.user_id)) return fail('not_found', 404); // either direction, and never the word blocked
    if (await frFriends(env, me.id, them.user_id)) return fail('already', 409);
    // The 50 cap counts non-official friends only, and is off when either side is an official account.
    const capped = !(await frIsOfficial(env, me.id)) && !(await frIsOfficial(env, them.user_id));
    if (capped && ((await frCount(env, me.id)) >= FR_MAX_FRIENDS || (await frCount(env, them.user_id)) >= FR_MAX_FRIENDS)) return fail('full', 400);
    let linked = false;
    try { linked = await frLink(env, me.id, them.user_id); } catch (e) {
      if (/unique/i.test(String(e && e.message))) return fail('already', 409);
      throw e;
    }
    if (!linked) {
      if (await frBlocked(env, me.id, them.user_id)) return fail('not_found', 404);
      if (await frFriends(env, me.id, them.user_id)) return fail('already', 409);
      return fail('full', 400);
    }
    return json({ ok: true });
  } },

  'POST /friends/remove': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, ['fid']) || !frFidOk(body.fid)) return fail('bad', 400);
    if (await limited(env, frKey.rm(me.id), 30, 3600)) return fail('rate_limited', 429);
    const them = await frByFid(env, body.fid);
    if (!them) return json({ ok: true }); // quiet: an unknown fid looks the same as a removed friend
    if (them.user_id === me.id) return fail('bad', 400);
    await frUnlink(env, me.id, them.user_id);
    return json({ ok: true });
  } },

  'POST /friends/block': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, ['fid']) || !frFidOk(body.fid)) return fail('bad', 400);
    if (await limited(env, frKey.block(me.id), 30, 3600)) return fail('rate_limited', 429);
    const them = await frByFid(env, body.fid);
    if (!them) return json({ ok: true });
    if (them.user_id === me.id) return fail('bad', 400);
    await frUnlink(env, me.id, them.user_id);
    await run(env, 'insert or ignore into friend_blocks (user_id, blocked_id) values (?1, ?2)', me.id, them.user_id);
    return json({ ok: true });
  } },

  'PUT /friends/yard': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, ['yard'])) return fail('bad', 400);
    const yard = frYard(body.yard);
    if (!yard) return fail('bad', 400);
    if (!(await frMine(env, me.id))) return fail('bad', 400);
    if (await limited(env, frKey.yard(me.id), 30, 3600)) return fail('rate_limited', 429);
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare(`insert into yards (user_id, data, updated_at) values (?1, ?2, ?3)
        on conflict(user_id) do update set data = excluded.data, updated_at = excluded.updated_at`).bind(me.id, JSON.stringify(yard), now),
      env.DB.prepare('update friend_ids set seen_at = ?1 where user_id = ?2').bind(now, me.id)
    ]);
    return json({ ok: true });
  } },

  'GET /friends/yard': { auth: true, async fn({ env, ctx, url, me }) {
    await frTidySoon(env, ctx);
    if (await limited(env, frKey.yardGet(me.id), 120, 3600)) return fail('rate_limited', 429);
    const fid = url.searchParams.get('fid');
    if (!frFidOk(fid)) return fail('not_found', 404);
    const them = await frByFid(env, fid);
    if (!them || them.user_id === me.id || !(await frFriends(env, me.id, them.user_id)) || (await frBlocked(env, me.id, them.user_id))) return fail('not_found', 404);
    const row = await one(env, 'select data from yards where user_id = ?1', them.user_id);
    if (!row) return json({ yard: null });
    let yard = null; try { yard = frYard(JSON.parse(row.data)); } catch (e) { yard = null; }
    if (yard && (await shopFF(env, them.user_id))) yard.ff = 1; // v2.24: the Founding Friend badge, from purchases
    return json({ yard });
  } },

  'POST /friends/send': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, ['fid', 'kind'], ['data']) || !frFidOk(body.fid) || typeof body.kind !== 'string' || !FR_KINDS.includes(body.kind)) return fail('bad', 400);
    if (await limited(env, frKey.send(me.id), 60, 3600)) return fail('rate_limited', 429); // before any DB work
    if (!(await frMine(env, me.id))) return fail('bad', 400);
    const them = await frByFid(env, body.fid);
    if (!them || them.user_id === me.id || !(await frFriends(env, me.id, them.user_id)) || (await frBlocked(env, me.id, them.user_id))) return fail('not_found', 404);
    const dogs = body.kind === 'walk' ? await frSnapDogs(env, them.user_id) : null;
    const data = body.kind === 'pet' ? frPet(body.data) : body.kind === 'note' ? frNote(body.data) : body.kind === 'gift' ? frGift(body.data) : frWalk(body.data, dogs);
    if (!data) return fail('bad', 400);
    const day = dcDay(Date.now());
    const dup = body.kind === 'gift'
      ? await one(env, 'select id from friend_events where from_id = ?1 and kind = ?2 and day = ?3', me.id, 'gift', day)
      : await one(env, 'select id from friend_events where from_id = ?1 and to_id = ?2 and kind = ?3 and day = ?4', me.id, them.user_id, body.kind, day);
    if (dup) return fail('limit', 400);
    try {
      const row = await one(env, `insert into friend_events (to_id, from_id, kind, data, day, created_at) values (?1, ?2, ?3, ?4, ?5, ?6) returning id`,
        them.user_id, me.id, body.kind, JSON.stringify(data), day, Date.now());
      if (!row) return fail('limit', 400);
    } catch (e) {
      if (/unique/i.test(String(e && e.message))) return fail('limit', 400);
      throw e;
    }
    return json({ ok: true });
  } },

  'GET /friends/inbox': { auth: true, async fn({ env, ctx, me }) {
    await frTidySoon(env, ctx);
    if (await limited(env, frKey.inbox(me.id), 120, 3600)) return fail('rate_limited', 429);
    const now = Date.now();
    // Any inbox read drops events older than 30 days, for every player. The read itself counts as being seen today.
    // Pets and notes come first: gifts and walks over the daily letter caps stay unclaimed on purpose and must not crowd them out of the 30.
    await run(env, 'delete from friend_events where created_at < ?1', now - FR_KEEP);
    await run(env, 'update friend_ids set seen_at = ?1 where user_id = ?2', now, me.id);
    const rows = await all(env, `select e.id as id, e.kind as kind, e.data as data, e.day as day, f.fid as fid, f.name_a as name_a, f.name_b as name_b
      from friend_events e join friend_ids f on f.user_id = e.from_id
      where e.to_id = ?1 and e.claimed_at is null order by (e.kind in ('gift', 'walk')) asc, e.id asc limit ${FR_INBOX}`, me.id);
    const events = [];
    for (const r of rows) {
      let data = null; try { data = JSON.parse(r.data); } catch (e) { data = null; }
      events.push({ id: r.id | 0, from: { fid: r.fid, name: [r.name_a | 0, r.name_b | 0] }, kind: r.kind, data, day: r.day });
    }
    return json({ events });
  } },

  'POST /friends/inbox/claim': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, ['ids']) || !Array.isArray(body.ids) || body.ids.length > FR_INBOX) return fail('bad', 400);
    if (body.ids.some((id) => !dcInt(id, 1, 1e15))) return fail('bad', 400);
    if (await limited(env, frKey.claim(me.id), 120, 3600)) return fail('rate_limited', 429);
    const now = Date.now();
    if (body.ids.length) await env.DB.batch(body.ids.map((id) =>
      env.DB.prepare('update friend_events set claimed_at = ?1 where id = ?2 and to_id = ?3 and claimed_at is null').bind(now, id, me.id)));
    return json({ ok: true });
  } },

  'POST /friends/leave': { auth: true, async fn({ env, ctx, body, me }) {
    await frTidySoon(env, ctx);
    if (!frOnly(body, [])) return fail('bad', 400);
    if (await limited(env, frKey.leave(me.id), 30, 3600)) return fail('rate_limited', 429);
    // Blocks other players made stay, so a new code still cannot get past them. Claimed and unclaimed events both go.
    await env.DB.batch([
      env.DB.prepare('delete from friends where user_id = ?1 or friend_id = ?1').bind(me.id),
      env.DB.prepare('delete from friend_blocks where user_id = ?1').bind(me.id),
      env.DB.prepare('delete from yards where user_id = ?1').bind(me.id),
      env.DB.prepare('delete from friend_events where from_id = ?1 or to_id = ?1').bind(me.id),
      env.DB.prepare('delete from friend_ids where user_id = ?1').bind(me.id)
    ]);
    return json({ ok: true });
  } },

  /* ---------- Kind shop (v2.24) ---------- */
  'GET /shop/catalog': { auth: false, async fn({ env, ip }) {
    if (!shopOpen(env)) return fail('shop_closed', 503);
    if (await limited(env, 'shop:cat:' + ip, 300, 3600)) return fail('rate_limited', 429);
    return json({ items: Object.keys(SHOP_ITEMS).map((id) => { const it = shopItem(env, id); return { id, usd: it.usd, once: it.once, on: !!it.price }; }) });
  } },

  'POST /shop/checkout': { auth: true, async fn({ env, body, me }) {
    if (!shopOpen(env)) return fail('shop_closed', 503);
    if (me.guest || !me.email) return fail('no_account', 403); // purchases live on an email account, so they come back on a new device
    if (!frOnly(body, ['item'])) return fail('bad_item', 400);
    const it = shopItem(env, body.item);
    if (!it) return fail('bad_item', 400);
    if (!it.price) return fail('shop_closed', 503); // no Stripe price set up for this item yet
    if (await limited(env, 'shop:co:' + me.id, 20, 3600)) return fail('rate_limited', 429);
    if (it.once && (await shopOwnsOnce(env, me.id, it.id))) return fail('owned', 409);
    const r = await shopStripe(env, '/checkout/sessions', {
      mode: 'payment', 'line_items[0][price]': it.price, 'line_items[0][quantity]': 1,
      'managed_payments[enabled]': env.SHOP_MANAGED === '0' ? undefined : 'true', // Stripe as merchant of record (docs.stripe.com/payments/managed-payments/set-up)
      client_reference_id: me.id, 'metadata[item]': it.id, 'metadata[user]': me.id, customer_email: me.email,
      success_url: env.SHOP_SUCCESS_URL || SHOP_OK_URL, cancel_url: env.SHOP_CANCEL_URL || SHOP_NO_URL
    });
    const url = r.data && r.data.url;
    if (!r.ok || typeof url !== 'string' || !/^https:\/\//.test(url)) {
      console.error('pawhaven-api shop: checkout', r.status, (r.data && r.data.error && r.data.error.code) || '');
      return fail('busy', 503);
    }
    return json({ url });
  } },

  'GET /shop/owned': { auth: true, async fn({ env, me }) {
    if (!shopOpen(env)) return fail('shop_closed', 503);
    if (await limited(env, 'shop:own:' + me.id, 120, 3600)) return fail('rate_limited', 429);
    const rows = await all(env, 'select id, item, created_at, refunded_at from purchases where user_id = ?1 order by created_at asc, id asc limit 500', me.id);
    return json({ purchases: rows.map((r) => ({ id: r.id, item: r.item, at: Number(r.created_at) || 0, refunded: r.refunded_at != null })) });
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
