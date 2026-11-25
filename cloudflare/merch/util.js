// Small shared helpers for the merch Worker (docs/design/merch/TRANSACTIONS.md). No outside calls here (netOf only hands a network to
// stripe.js, mail.js and provider_printful.js).
export const enc = new TextEncoder();
export const MIN = 60e3, HOUR = 36e5, DAY = 864e5;
export const GRACE = 120e3; // the 2 minutes after the cooling hour that keep a tap at minute 59 safe (fixed in code, TRANSACTIONS 2 step 9)

// the clock: env.NOW (tests: a function or a number of ms) or the real time
export const nowOf = (env) => (env && env.NOW != null ? (typeof env.NOW === 'function' ? Number(env.NOW()) : Number(env.NOW)) : Date.now());
// the JST date of a time, 'YYYY-MM-DD' (the day cap, the print shards, the nightly run)
export const jstDay = (t) => new Date(t + 9 * HOUR).toISOString().slice(0, 10);
export const jstHour = (t) => new Date(t + 9 * HOUR).getUTCHours();
// the next 00:00 UTC (09:00 JST): when Browser Run's daily allowance comes back
export const nextUtcMidnight = (t) => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); };
// paid date + n business days (Mon-Fri, UTC)
export function addBusinessDays(t, n) { let d = t; while (n > 0) { d += DAY; const w = new Date(d).getUTCDay(); if (w !== 0 && w !== 6) n--; } return d; }

export function json(o, status, headers) {
  return new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, headers || {}) });
}
export const fail = (error, status, more) => json(Object.assign({ error }, more || {}), status);

export const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
export async function sha256hex(data) { return hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data)); }
export async function hmacHex(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(String(key)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
// constant time for equal lengths; different lengths are simply unequal
export function same(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; }

// 'mo_' + 22 base64url characters (128 random bits)
export function orderId() {
  const u = crypto.getRandomValues(new Uint8Array(16)); let s = '';
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let bits = 0, buf = 0; for (const b of u) { buf = (buf << 8) | b; bits += 8; while (bits >= 6) { bits -= 6; s += A[(buf >> bits) & 63]; } }
  if (bits) s += A[(buf << (6 - bits)) & 63];
  return 'mo_' + s;
}
export const ORDER_ID = /^mo_[A-Za-z0-9_-]{22}$/;

// the site the buyer reads (MERCH_SITE; the test Worker points at the test copy) and the order page on it: ONE form everywhere (emails, Stripe's
// success_url): <site>/merch/#/order/<id> (the static site serves /merch/ only; the order is a route of that page). isNew: just back from paying.
// Review finding 12: only a plain https origin is taken (a javascript: or http: value, a path, a port or anything else falls back to the default),
// because it becomes every link in the emails
export const SITE_DEFAULT = 'https://doodledoggo.app';
export const siteOf = (env) => { const s = String((env && env.MERCH_SITE) || '').trim().replace(/\/+$/, ''); return /^https:\/\/[a-z0-9.-]+$/.test(s) ? s : SITE_DEFAULT; };
export const orderLink = (site, id, isNew) => String(site).replace(/\/+$/, '') + '/merch/' + (isNew ? '?new=1' : '') + '#/order/' + id;

// FNV-1a 32 bit, hex (cat_ver)
export function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }

// form encoding for Stripe (nested keys already written out); undefined / null left out
export const form = (o) => Object.keys(o).filter((k) => o[k] !== undefined && o[k] !== null).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(String(o[k]))).join('&');

// an injectable fetch: a function (node tests) or a Fetcher binding (Miniflare service binding); null = not set up
export function fetcher(f) {
  if (!f) return null;
  if (typeof f === 'function') return f;
  if (typeof f.fetch === 'function') return (u, i) => f.fetch(u, i);
  return null;
}
// The network of an outside service (Stripe, Resend, Printful): its injected seam when set (tests: a function or a Miniflare service binding),
// else the global fetch, but ONLY on Cloudflare's runtime and ONLY with the service's key. Node never gets the global fetch (onWorkers() is
// false there), so a test without the seam has no service at all and nothing reaches the network. null = not set up.
export const onWorkers = () => typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
// fourth review (R4-m2): a key as set in the dashboard, trimmed (a pasted key with a space or a tab around it): every check and every header
// uses this, so padding never changes which mode we think we are in
export const keyOf = (v) => (v == null ? '' : String(v).trim());
export function netOf(seam, key) {
  const f = fetcher(seam); if (f) return f;
  return key && onWorkers() && typeof fetch === 'function' ? (u, i) => fetch(u, i) : null;
}
// a fetch with a time limit: 'timeout' is its own answer (result unknown), never a throw. A thrown fetch (a network error) is an answer with
// status 0, which every caller treats like a 5xx (not ok: tried again; never "refused for good"). On a timeout the request is also aborted, so a
// hung subrequest is not left open (the result stays unknown either way: the retry carries the same idempotency key).
export async function call(f, url, init, ms) {
  let timer; const ac = typeof AbortController === 'function' && !(init && init.signal) ? new AbortController() : null;
  const t = new Promise((r) => { timer = setTimeout(() => { r('timeout'); if (ac) try { ac.abort(); } catch (e) { /* fine */ } }, ms || 20000); });
  try {
    const r = await Promise.race([Promise.resolve().then(() => f(url, ac ? Object.assign({}, init, { signal: ac.signal }) : init)), t]);
    if (r === 'timeout') return { ok: false, status: 0, timeout: true, data: null };
    // fourth review (R4-m1): the limit covers the body too: headers that came, then a body that never ends, is a timeout (and aborted)
    const b = await Promise.race([Promise.resolve().then(() => r.text()).then((x) => ({ x }), () => ({ x: '' })), t]);
    if (b === 'timeout') return { ok: false, status: 0, timeout: true, data: null };
    const text = b.x || '';
    let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
    return { ok: r.ok, status: r.status, data, text, headers: r.headers };
  } catch (e) { return { ok: false, status: 0, data: null, error: String((e && e.message) || e).slice(0, 120) }; }
  finally { clearTimeout(timer); }
}

// PNG header: width and height from the IHDR chunk (the file is never decoded)
export function pngSize(u8) {
  if (!u8 || u8.length < 24) return null;
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]; for (let i = 0; i < 8; i++) if (u8[i] !== sig[i]) return null;
  if (String.fromCharCode(u8[12], u8[13], u8[14], u8[15]) !== 'IHDR') return null;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}
