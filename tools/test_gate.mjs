// Doodle Doggo: the password gate of the test copy at https://test.doodledoggo.app (the Worker "doodle-doggo-test", owner 18 Nov 2026).
// It replaces the GitHub Pages test copy (an9ou.github.io/paw-haven), which stops once the repo is private. tools/cf_test.js copies this
// file into _cftest/gate.js next to the generated worker.js, which calls makeGate({ files, hashed, csp }). game/test_test_gate.js tests it.
//
// The rules:
// - The password is the Worker secret TEST_PASSWORD (set by the owner in the dashboard). It is never in code or in the repo. Without it the
//   Worker answers 503 to everything (fails closed).
// - POST /__gate { password, next }: compared in constant time (SHA-256 of both, then an XOR over the 32 bytes). Right: a 303 to next with an
//   HttpOnly Secure SameSite=Lax cookie dd_test = v1.<expiry>.<HMAC-SHA256>, 30 days. Wrong: 401 and the gate page again.
//   The HMAC key is the secret TEST_COOKIE_KEY, or else SHA-256("dd-test-cookie-v1:" + TEST_PASSWORD), so a new password logs everyone out.
// - Without a valid cookie every path answers the gate page (401), except /robots.txt. /__gate/out drops the cookie.
// - Everything carries X-Robots-Tag: noindex, nofollow, and nothing is cached publicly: the gate and the HTML are private, no-store; the game's
//   hashed files private, max-age a year (they are only ever served behind the cookie).
// - At most 10 wrong passwords per IP in 10 minutes per Worker isolate (a soft brake; the password itself should be long).
// - A folder path serves its index.html (/ -> /index.html, /merch/terms/ -> /merch/terms/index.html); a folder without its slash (/merch) answers
//   301 to the slash, query kept (behind the cookie like everything else).
// - zones (optional, the merch page of the sandbox run, SANDBOX.md part F G2): [{ prefix, csp, noStore }]: every answer under prefix carries
//   that CSP instead of the game's, and the paths noStore matches (e.g. /merch/test_cfg.json, /merch/*.js) are private, no-store. No zone
//   path is ever let past the password: /merch/test_cfg.json without the cookie is the gate page like any other path.
const COOKIE = 'dd_test', MAX_AGE = 30 * 86400, FAILS = 10, FAIL_WINDOW = 600000;
const enc = new TextEncoder();
const b64url = (buf) => { let s = ''; new Uint8Array(buf).forEach((x) => { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64url = (s) => { try { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); } catch (e) { return null; } };
const sha = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function samePassword(a, b) { // constant time: both sides are hashed to 32 bytes first, so the length of the guess tells nothing
  const [x, y] = await Promise.all([sha('dd-test-pw:' + a), sha('dd-test-pw:' + b)]);
  let d = 0; for (let i = 0; i < 32; i++) d |= x[i] ^ y[i];
  return d === 0;
}
async function hmacKey(env) {
  const raw = env.TEST_COOKIE_KEY ? enc.encode(String(env.TEST_COOKIE_KEY)) : await sha('dd-test-cookie-v1:' + env.TEST_PASSWORD);
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function makeToken(env, now) {
  const exp = Math.floor((now || Date.now()) / 1000) + MAX_AGE, body = 'v1.' + exp;
  return body + '.' + b64url(await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(body)));
}
export async function tokenOk(env, tok, now) {
  const m = /^v1\.(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(tok || ''); if (!m) return false;
  if (Number(m[1]) * 1000 <= (now || Date.now())) return false;
  const sig = unb64url(m[2]); if (!sig) return false;
  return crypto.subtle.verify('HMAC', await hmacKey(env), sig, enc.encode('v1.' + m[1])); // constant time
}
const cookieOf = (req) => { const m = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)').exec(req.headers.get('cookie') || ''); return m ? m[1] : ''; };
// next: a path on this host only (no //host, no scheme)
const safeNext = (n) => (typeof n === 'string' && /^\/(?![/\\])[\x21-\x7e]*$/.test(n) && n.length < 512 ? n : '/');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const BASE = { 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
const GATE_CSP = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
export function gatePage(next, msg) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Doodle Doggo · test copy</title>
<style>html,body{margin:0;height:100%;background:#FFFBF3;color:#5B3D32;font-family:Caveat,'Comic Sans MS',cursive}body{display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
form{width:min(340px,100%);padding:26px 22px;border:3px solid #5B3D32;border-radius:18px 12px 20px 10px;background:#FFF4DC;box-shadow:4px 5px 0 rgba(91,61,50,.18);text-align:center;box-sizing:border-box}
h1{margin:0 0 4px;font-size:34px;line-height:1.1}p{margin:0 0 16px;font-size:20px}
input[type=password]{box-sizing:border-box;width:100%;min-height:46px;padding:8px 12px;font:inherit;font-size:22px;color:inherit;background:#fff;border:2.5px solid #5B3D32;border-radius:10px 14px 9px 13px}
button{margin-top:12px;min-height:46px;min-width:140px;padding:6px 18px;font:inherit;font-size:24px;color:#5B3D32;background:#F7D774;border:2.5px solid #5B3D32;border-radius:13px 9px 15px 8px;cursor:pointer}
.no{min-height:24px;margin:10px 0 0;font-size:19px;color:#C0504D}</style></head>
<body><form method="post" action="/__gate" autocomplete="off"><h1>Doodle Doggo</h1><p>Test copy. Password, please!</p>
<input type="password" name="password" aria-label="Password" autofocus required><input type="hidden" name="next" value="${esc(safeNext(next))}">
<button type="submit">Let me in</button><div class="no" aria-live="polite">${msg ? esc(msg) : ''}</div></form></body></html>`;
}
const page = (status, next, msg, extra) => new Response(gatePage(next, msg), { status, headers: Object.assign({}, BASE, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store', 'content-security-policy': GATE_CSP }, extra || {}) });
const fails = new Map(); // ip -> [count, since]
function tooMany(ip, now) { const f = fails.get(ip); if (!f || now - f[1] > FAIL_WINDOW) { fails.delete(ip); return false; } return f[0] >= FAILS; }
function noteFail(ip, now) { const f = fails.get(ip); if (!f || now - f[1] > FAIL_WINDOW) fails.set(ip, [1, now]); else f[0]++; if (fails.size > 5000) fails.clear(); }

// files: { '/index.html': [body, content type], ... } (the game copy at the root); hashed: a RegExp of the paths that never change; csp: the game's CSP;
// zones: see above (left out: the game copy alone)
export function makeGate({ files, hashed, csp, zones }) {
  return {
    async fetch(req, env) {
      const url = new URL(req.url), p = url.pathname, now = Date.now();
      if (url.protocol === 'http:') return new Response(null, { status: 301, headers: Object.assign({}, BASE, { location: 'https://' + url.host + p + url.search, 'cache-control': 'private, no-store' }) });
      if (p === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: Object.assign({}, BASE, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, max-age=3600' }) });
      if (!env || !env.TEST_PASSWORD) return new Response('The test copy is not set up yet (no TEST_PASSWORD).', { status: 503, headers: Object.assign({}, BASE, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store' }) });
      if (p === '/__gate/out') return new Response(null, { status: 303, headers: Object.assign({}, BASE, { location: '/', 'cache-control': 'private, no-store', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` }) });
      if (p === '/__gate') {
        if (req.method !== 'POST') return page(200, url.searchParams.get('next') || '/');
        const ip = req.headers.get('CF-Connecting-IP') || 'local';
        let pw = '', next = '/';
        try { const t = await req.text(); if (t.length < 4096) { const f = new URLSearchParams(t); pw = f.get('password') || ''; next = f.get('next') || '/'; } } catch (e) { /* empty */ }
        if (tooMany(ip, now)) return page(429, next, 'Lots of tries! Please wait ten minutes.', { 'retry-after': '600' });
        if (!pw || !(await samePassword(pw, String(env.TEST_PASSWORD)))) { noteFail(ip, now); return page(401, next, 'Woof? That is not it. Try again.'); }
        fails.delete(ip);
        return new Response(null, { status: 303, headers: Object.assign({}, BASE, { location: safeNext(next), 'cache-control': 'private, no-store',
          'set-cookie': `${COOKIE}=${await makeToken(env, now)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax` }) });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: Object.assign({}, BASE, { allow: 'GET, HEAD' }) });
      if (!(await tokenOk(env, cookieOf(req), now))) return page(401, p + url.search);
      const key = p.endsWith('/') ? p + 'index.html' : p, hit = files[key];
      if (!hit && files[p + '/index.html']) return new Response(null, { status: 301, headers: Object.assign({}, BASE, { location: p + '/' + url.search, 'cache-control': 'private, no-store' }) });
      if (!hit) return new Response('Not found', { status: 404, headers: Object.assign({}, BASE, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store' }) });
      const html = hit[1].startsWith('text/html'), zone = (zones || []).find((z) => key.startsWith(z.prefix));
      const headers = Object.assign({}, BASE, { 'content-type': hit[1], 'cache-control': html || (zone && zone.noStore && zone.noStore.test(key)) ? 'private, no-store' : hashed && hashed.test(key) ? 'private, max-age=31536000, immutable' : 'private, max-age=3600' });
      if (zone) headers['content-security-policy'] = zone.csp;
      else if (html && csp) headers['content-security-policy'] = csp;
      return new Response(req.method === 'HEAD' ? null : hit[0], { headers });
    }
  };
}
