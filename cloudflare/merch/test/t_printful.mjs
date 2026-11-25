// Part 5: the Printful adapter (provider_printful.js) against Printful's replies recorded in test/printful/*.json (from the docs, built from the
// documented schemas, or the public catalog: each file's _source says which). A tiny replaying PROVIDER_FETCH answers each call with the next
// fixture and keeps the request, so every test checks what the adapter sends too. Nothing reaches the network.
import fs from 'node:fs';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { T, ok, eq, world, mug, PP, MIN, HOUR, DAY } from './harness.mjs';
import * as pf from '../provider_printful.js';
import { PF_VARIANT_IDS, buildCatalog, variantId, SHIP_COSTS, PRODUCTS } from '../catalog.js';
import { marginOf, priceBasket } from '../lines.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'printful');
const fx = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n + '.json'), 'utf8'));
const EXT = 'mo_TestOrder0000000000001', PID = '93000001', KEY = 'pf-key-for-tests-0001';
const SECRET = '9f1e2d3c4b5a69788796a5b4c3d2e1f00112233445566778899aabbccddeeff0'; // hex, as Printful hands it out (invented)
const signed = (raw, secret) => createHmac('sha256', Buffer.from(secret || SECRET, 'hex')).update(raw).digest('hex'); // an independent signer

// a replaying fetch: each call takes the next entry (a fixture name, or a function (request) -> fixture-like { status, body, headers })
function replay(seq) {
  const R = { calls: [], left: seq.slice() };
  R.fetch = async (url, init) => {
    const u = new URL(url), c = { method: (init && init.method) || 'GET', url: String(url), path: u.pathname + u.search, headers: (init && init.headers) || {}, body: init && init.body ? JSON.parse(init.body) : null };
    R.calls.push(c);
    const next = R.left.shift(); if (!next) throw new Error('unexpected call ' + c.method + ' ' + c.path);
    if (next === 'hang') return new Promise(() => {});
    const f = typeof next === 'string' ? fx(next) : next(c);
    return new Response(f.body == null ? null : JSON.stringify(f.body), { status: f.status, headers: Object.assign({ 'content-type': 'application/json' }, f.headers || {}) });
  };
  return R;
}
const envOf = (R, more) => Object.assign({ PROVIDER_FETCH: R.fetch, MERCH_PROVIDER_KEY: KEY, MERCH_PROVIDER_MODE: 'live', MERCH_TIMEOUT_MS: '200', MERCH_PF_POLL_MS: '0' }, more || {});
const order = { id: EXT, subtotal: 4698, ship_fee: 499, tax: 0 };
const L2 = [{ line: 1, product: 'mug', provider_variant: 'pf:mug:white', qty: 1, refunded_qty: 0, unit: 1999 }, { line: 2, product: 'tee', provider_variant: 'pf:tee:navy:M', qty: 1, refunded_qty: 0, unit: 2699 }];
const URLS = { 1: 'https://merch-api.test/merch/file/p-2026-12-01~a~1/1767225600/aa.png', 2: 'https://merch-api.test/merch/file/p-2026-12-01~b~2/1767225600/bb.png' };
const RECIP = { name: 'Test Buyer', address1: '1 Example Street', address2: '', city: 'Exampleton', state_code: 'CA', zip: '90001', country_code: 'US' };
const emptyShips = () => ({ status: 200, body: { data: [], paging: { total: 0, offset: 0, limit: 100 } } });
const withStatus = (name, st, more) => () => { const f = fx(name); f.body.data.status = st; return Object.assign(f, more || {}); };
const noKey = (x) => !JSON.stringify(x).includes(KEY);

export async function printful() {
  console.log('--- part 5: the Printful adapter against recorded replies (test/printful)');

  await T('P5-fixtures', 'every recorded reply names its source (the doc page or the public route, the date, docs / built / public) and holds no personal data', async () => {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')); ok(files.length >= 40, 'fixtures: ' + files.length);
    // the key-day kit (tools/merch_pf_check.mjs) records real replies in printful/recorded/ ('key'): the same rules hold there
    const rec = path.join(DIR, 'recorded'), all = files.map((f) => path.join(DIR, f)).concat(fs.existsSync(rec) ? fs.readdirSync(rec).filter((f) => f.endsWith('.json')).map((f) => path.join(rec, f)) : []);
    for (const file of all) {
      const f = path.basename(file), j = JSON.parse(fs.readFileSync(file, 'utf8')), s = j._source || {};
      ok(/^https:\/\/(developers|api)\.printful\.com\//.test(s.url) && /^\d{4}-\d{2}-\d{2}$/.test(s.read) && ['docs', 'built', 'public', 'key'].includes(s.recorded) && s.note, f + ': _source');
      const text = JSON.stringify(j);
      ok(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/.test(text.replace(/"\/v2\/orders\/@[^"]*"/g, '').replace(/someone@example\.test/g, '')), f + ': no email address');
      if (s.recorded !== 'key') for (const m of text.matchAll(/"name":"([^"]*)"/g)) ok(/^(Test Buyer|Mug with your dog|Tee with your dog|White Glossy Mug 11 oz|.*Bella \+ Canvas.*|Item name|)$/.test(m[1]), f + ': only invented names: ' + m[1]);
      const walk = (x) => { if (x && typeof x === 'object') { if (x.address1 !== undefined) ok(x.name === 'Test Buyer' && x.address1 === '1 Example Street', f + ': every address is the invented one'); Object.values(x).forEach(walk); } };
      walk(j);
    }
  });

  await T('P5-variants', 'the catalog variant ids are Printful\'s, from the public catalog (colour code, size, product); every colour and size we offer has one', async () => {
    const pub = new Map(fx('catalog_v1_product_19').body.result.variants.concat(fx('catalog_v1_product_71').body.result.variants).map((v) => [v.id, v]));
    const cat = buildCatalog(PP); let n = 0;
    for (const P of [cat.products.mug, cat.products.tee]) for (const c of P.colours) for (const size of P.sized ? c.sizes : [null]) {
      const v = variantId(P.id, c.id, size), id = PF_VARIANT_IDS[v], r = pub.get(id); n++;
      ok(id && r, v + ': an id in the public catalog (' + id + ')');
      ok(P.id === 'mug' ? r.product_id === 19 && r.size === '11 oz' && r.color === 'White' : r.product_id === 71 && r.size === size && String(r.color_code).toLowerCase() === c.hex.toLowerCase(), v + ': colour and size agree');
      ok(r.availability_status.some((a) => a.region === 'US') && r.availability_status.some((a) => a.region === 'UK'), v + ': made in the US and the UK');
    }
    eq(n, Object.keys(PF_VARIANT_IDS).length, 'one id per offered variant, none left over');
  });

  await T('P5-ready', 'the gate: no printer without a key or a network; Node never gets the global fetch; on Cloudflare the global fetch is used; MERCH_TEST=1 never runs live', async () => {
    const R = replay([]);
    ok(pf.providerReady(envOf(R)) && !pf.providerReady(envOf(R, { MERCH_PROVIDER_KEY: undefined })), 'a fetch and a key');
    ok(!pf.providerReady({ MERCH_PROVIDER_KEY: KEY }), 'Node, no PROVIDER_FETCH: not ready (tests never reach the network)');
    ok(!pf.providerReady(envOf(R, { MERCH_TEST: '1' })) && pf.providerReady(envOf(R, { MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft' })), 'the test Worker: never live');
    const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator'), gf = globalThis.fetch, seen = [];
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Cloudflare-Workers' }, configurable: true });
    globalThis.fetch = async (u, i) => { seen.push([String(u), i.headers.Authorization === 'Bearer ' + KEY]); return new Response(JSON.stringify(fx('order_not_found').body), { status: 404 }); };
    try {
      ok(pf.providerReady({ MERCH_PROVIDER_KEY: KEY }) && !pf.providerReady({}), 'on Cloudflare: the global fetch with a key, nothing without');
      const g = await pf.get({ MERCH_PROVIDER_KEY: KEY }, EXT); ok(!g.ok && g.kind === 'not_found' && seen.length === 1 && seen[0][0] === 'https://api.printful.com/v2/orders/@' + EXT && seen[0][1], 'it calls api.printful.com with the key');
    } finally { if (nav) Object.defineProperty(globalThis, 'navigator', nav); else delete globalThis.navigator; globalThis.fetch = gf; }
    const w = await world({ env: { PROVIDER_FETCH: undefined } }); const r = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug()], expect_total: 2498, art_ver: PP.ART_VER, nonce: 'p5-nonce-0001', agree: true });
    ok(r.status === 503 && r.json.error === 'merch_closed', 'the shut gate is unchanged: ' + r.status);
  });

  await T('P5-create', 'createDraft: POST /v2/orders with our external id, item ids <order>_<line>, catalog variant ids, the placement and technique, the signed file URL, retail prices; costs in cents', async () => {
    const R = replay(['order_create_draft']), r = await pf.createDraft(envOf(R), order, L2, RECIP, URLS);
    const c = R.calls[0], b = c.body;
    eq([c.method, c.path, c.headers.Authorization, c.headers['Content-Type'], c.headers['X-PF-Store-Id']], ['POST', '/v2/orders', 'Bearer ' + KEY, 'application/json', undefined], 'the request line and headers');
    eq([b.external_id, b.shipping, b.order_items.map((i) => i.external_id), b.order_items.map((i) => i.catalog_variant_id)], [EXT, 'STANDARD', [EXT + '_1', EXT + '_2'], [1320, 4112]], 'ids');
    eq(b.order_items.map((i) => [i.source, i.quantity, i.retail_price, i.name, i.placements[0].placement, i.placements[0].technique, i.placements[0].layers[0].type, i.placements[0].layers[0].url]),
      [['catalog', 1, '19.99', 'Mug with your dog', 'default', 'sublimation', 'file', URLS[1]], ['catalog', 1, '26.99', 'Tee with your dog', 'front_large', 'dtg', 'file', URLS[2]]], 'items');
    eq(b.retail_costs, { currency: 'USD', discount: '0.00', shipping: '4.99', tax: '0.00' }, 'retail costs (v2 RetailCosts: no subtotal)');
    eq(b.recipient, { name: 'Test Buyer', address1: '1 Example Street', city: 'Exampleton', state_code: 'CA', country_code: 'US', zip: '90001' }, 'the recipient, empty fields left out');
    ok(r.ok && r.data.id === PID && r.data.status === 'draft' && r.data.external_id === EXT, 'mapped');
    eq([r.data.costs, r.data.items.map((i) => i.external_id)], [{ items: 1799, shipping: 1164, tax: 0 }, [EXT + '_1', EXT + '_2']], 'costs and items');
    ok(noKey(r), 'the key is never in an answer');
    const S = replay([() => { const f = fx('order_create_draft'); f.body.data.external_id = EXT + '-d1'; return f; }]);
    await pf.createDraft(envOf(S, { MERCH_PROVIDER_STORE: '12345' }), order, L2.slice(0, 1), RECIP, URLS, EXT + '-d1');
    eq([S.calls[0].body.external_id, S.calls[0].body.order_items[0].external_id, S.calls[0].headers['X-PF-Store-Id']], [EXT + '-d1', EXT + '-d1_1', '12345'], 'a later draft <order>-d<n>; an account-level token names the store');
    const Q = replay(['order_create_draft']); await pf.createDraft(envOf(Q), order, [Object.assign({}, L2[1], { line: 101, qty: 2, refunded_qty: 1 })], RECIP, { 101: URLS[2] }, EXT + '-r1');
    eq([Q.calls[0].body.external_id, Q.calls[0].body.order_items[0].external_id, Q.calls[0].body.order_items[0].quantity], [EXT + '-r1', EXT + '-r1_101', 1], 'a reprint <order>-r<n>; refunded units are not sent');
  });

  await T('P5-create-guard', 'createDraft never sends a placeholder: a variant with no Printful id, or an external id over 32 characters, is refused without a call', async () => {
    const R = replay([]);
    const a = await pf.createDraft(envOf(R), order, [L2[0], Object.assign({}, L2[1], { provider_variant: 'pf:tee:navy:5XL' })], RECIP, URLS);
    eq([a.ok, a.kind, a.items], [false, 'refused', [EXT + '_2']], 'the unknown line refused');
    const b = await pf.createDraft(envOf(R), order, L2, RECIP, URLS, EXT + '-r1234567'); eq([b.ok, b.kind], [false, 'refused'], 'too long');
    eq(R.calls.length, 0, 'no call at all');
  });

  await T('P5-create-calc', 'a draft whose costs are still calculating: re-read up to MERCH_PF_POLLS times; still calculating: down with retry_ms (the next try finds it by external id); calculation failed: costs null', async () => {
    const calc = () => Object.assign(fx('order_draft_calculating'), { status: 200 });
    let R = replay([calc, calc, calc]); let r = await pf.createDraft(envOf(R), order, L2, RECIP, URLS);
    eq([r.ok, r.kind, r.why, r.retry_ms, R.calls.map((c) => c.method + ' ' + c.path)], [false, 'down', 'calculating', 60000, ['POST /v2/orders', 'GET /v2/orders/' + PID, 'GET /v2/orders/' + PID]], 'two re-reads, then down');
    R = replay([calc, 'order_create_draft']); r = await pf.createDraft(envOf(R), order, L2, RECIP, URLS); ok(r.ok && r.data.costs.items === 1799, 'done on the re-read');
    R = replay(['order_draft_calculating']); r = await pf.get(envOf(R), PID); eq([r.ok, r.kind, r.why], [false, 'down', 'calculating'], 'get: a calculating draft is not adopted yet');
    R = replay(['order_draft_costs_failed']); r = await pf.get(envOf(R), EXT); ok(r.ok && r.data.status === 'draft' && r.data.costs.items === null && r.data.costs.shipping === null, 'failed: no costs (the ledger holds it)');
    R = replay([() => { const f = fx('order_get_pending'); f.body.data.costs.currency = 'EUR'; return f; }, emptyShips]); r = await pf.get(envOf(R), EXT); ok(r.ok && r.data.costs.items === null, 'costs not in USD: not taken');
  });

  await T('P5-create-dup', 'the external id already exists (OR-13): it is ours, made by a call we never heard back from: read by external id and returned; a canceled one is not', async () => {
    let R = replay(['order_external_id_in_use', 'order_get_pending', emptyShips]); let r = await pf.createDraft(envOf(R), order, L2, RECIP, URLS);
    ok(r.ok && r.data.status === 'pending' && R.calls[1].path === '/v2/orders/@' + EXT, 'adopted by GET @external_id');
    R = replay(['order_external_id_in_use', withStatus('order_get_pending', 'canceled'), emptyShips]); r = await pf.createDraft(envOf(R), order, L2, RECIP, URLS);
    eq([r.ok, r.kind, r.why], [false, 'down', 'duplicate'], 'canceled: down (the ledger then moves to a new external id)');
  });

  await T('P5-get', 'get: by external id (@) or Printful id, with its shipments; a parcel names its items by our external id (or its order item id); only parcels that left; delivered and returned', async () => {
    const R = replay(['order_get_partial', 'order_shipments']), r = await pf.get(envOf(R), EXT);
    eq(R.calls.map((c) => c.method + ' ' + c.path), ['GET /v2/orders/@' + EXT, 'GET /v2/orders/' + PID + '/shipments?limit=100'], 'two reads');
    ok(r.ok && r.data.status === 'partial', 'status');
    eq(r.data.shipments, [
      { id: '70001', carrier: 'USPS', tracking_url: 'https://tracking.example.test/9400100000000000000001', items: [EXT + '_1'], units: [{ ext: EXT + '_1', qty: 1 }], reship: false, shipped_at: Date.parse('2026-12-03T16:35:35Z'), delivered_at: Date.parse('2026-12-06T19:15:05Z'), returned: false },
      { id: '70002', carrier: 'USPS', tracking_url: 'https://tracking.example.test/9400100000000000000002', items: [EXT + '_2'], units: [{ ext: EXT + '_2', qty: 1 }], reship: false, shipped_at: Date.parse('2026-12-04T10:00:00Z'), delivered_at: null, returned: true }], 'the shipped and the returned parcel; canceled and packaged left out');
    const D = replay(['order_create_draft']); const d = await pf.get(envOf(D), PID); ok(d.ok && D.calls.length === 1 && D.calls[0].path === '/v2/orders/' + PID, 'a draft: no shipments read, by Printful id');
    const I = replay(['order_confirm_inreview', emptyShips]); const i = await pf.get(envOf(I), PID); eq(i.data.status, 'pending', 'inreview counts as pending (confirmed, not yet made)');
    const N = replay(['order_not_found']); eq((await pf.get(envOf(N), EXT)).kind, 'not_found', '404');
    const S = replay(['order_get_partial', 'order_not_found']); eq((await pf.get(envOf(S), EXT)).kind, 'down', 'shipments unreadable: down, never "no parcels"');
  });

  await T('P5-errors', 'every documented error shape maps to our kinds: 5xx and problem details, 429 with its Retry-After, 409, 401, 404, the recipient, an item, the charge, not editable, a timeout', async () => {
    const one = async (name, fn) => { const R = replay([name]); return (fn || ((e) => pf.createDraft(e, order, L2, RECIP, URLS)))(envOf(R)); };
    eq(await one('server_error_500'), { ok: false, kind: 'down', status: 500 }, '500 (RFC 9457 body)');
    eq(await one('rate_limited_429'), { ok: false, kind: 'down', status: 429, retry_ms: 38000 }, '429: down, Retry-After 38 s');
    eq((await one('unauthorized_401')).kind, 'not_set_up', '401');
    eq(await one('order_recipient_invalid'), { ok: false, kind: 'address', status: 400 }, 'Recipient: ...');
    eq(await one('order_item_refused'), { ok: false, kind: 'refused', items: [EXT + '_2'], status: 400 }, 'Item 1: ... names the tee');
    const many = await pf.errKind({ status: 400, data: { code: 400, result: 'x', error: { reason: 'BadRequest', message: 'Item 0: out of stock; Property `/order_items/1` is invalid' } } }, ['a_1', 'a_2']);
    eq(many.items, ['a_1', 'a_2'], 'both forms, several items');
    eq((await one('order_confirm_billing', (e) => pf.confirm(e, PID))).kind, 'billing', 'a failed charge');
    eq((await one('order_delete_conflict', (e) => pf.deleteDraft(e, PID))).kind, 'down', '409: try again');
    eq((await one('order_not_editable', (e) => pf.update(e, PID, RECIP))).kind, 'cannot', 'no longer editable');
    eq((await one('shipping_rates_disabled', (e) => pf.errKind({ status: 400, data: fx('shipping_rates_disabled').body }, []))).kind, 'address', 'shipping disabled to the country (message under data)');
    const H = replay(['hang']); const t0 = Date.now(); const h = await pf.get(envOf(H, { MERCH_TIMEOUT_MS: '30' }), EXT); ok(h.kind === 'timeout' && Date.now() - t0 < 1000, 'timeout');
    const X = replay(['server_error_500']); ok(noKey(await pf.get(envOf(X), EXT)), 'no key in an error');
  });

  await T('P5-update', 'update: PATCH /v2/orders/{id} with the recipient only; a refused address is address', async () => {
    let R = replay(['order_patch_recipient']); let r = await pf.update(envOf(R), PID, Object.assign({}, RECIP, { address1: '22 Fixed Road' }));
    eq([R.calls[0].method, R.calls[0].path, Object.keys(R.calls[0].body), R.calls[0].body.recipient.address1], ['PATCH', '/v2/orders/' + PID, ['recipient'], '22 Fixed Road'], 'the request'); ok(r.ok && r.data.id === PID, 'mapped');
    R = replay(['order_recipient_invalid']); eq((await pf.update(envOf(R), PID, RECIP)).kind, 'address', 'refused');
  });

  await T('P5-confirm', 'confirm: POST /v2/orders/{id}/confirmation only in live mode and never on the test Worker; failed after confirm is not confirmed', async () => {
    let R = replay(['order_confirm_ok']); let r = await pf.confirm(envOf(R), PID);
    ok(r.ok && r.data.status === 'pending' && R.calls[0].method === 'POST' && R.calls[0].path === '/v2/orders/' + PID + '/confirmation' && !R.calls[0].body, 'confirmed');
    R = replay([]);
    eq(await pf.confirm(envOf(R, { MERCH_PROVIDER_MODE: 'draft' }), PID), { ok: false, kind: 'cannot', why: 'draft_mode' }, 'draft mode: refused by the adapter');
    eq(await pf.confirm(envOf(R, { MERCH_PROVIDER_MODE: undefined }), PID), { ok: false, kind: 'cannot', why: 'draft_mode' }, 'no mode: draft');
    eq(await pf.confirm(envOf(R, { MERCH_TEST: '1' }), PID), { ok: false, kind: 'cannot', why: 'test' }, 'MERCH_TEST=1: refused');
    eq(R.calls.length, 0, 'no confirm was sent');
    R = replay(['order_confirm_failed']); eq(await pf.confirm(envOf(R), PID), { ok: false, kind: 'refused', items: [], why: 'failed' }, 'failed: held for the owner');
    R = replay(['order_confirm_inreview']); r = await pf.confirm(envOf(R), PID); ok(r.ok && r.data.status === 'pending', 'inreview: confirmed');
  });

  await T('P5-delete', 'deleteDraft: v2 DELETE (204); already gone (404) is done; refused but canceled at Printful is done; anything else is not', async () => {
    let R = replay(['order_delete_draft']); eq([await pf.deleteDraft(envOf(R), PID), R.calls[0].method, R.calls[0].path], [{ ok: true }, 'DELETE', '/v2/orders/' + PID], '204');
    R = replay(['order_not_found']); eq(await pf.deleteDraft(envOf(R), PID), { ok: true }, '404: done');
    R = replay(['order_delete_refused', 'order_get_canceled', emptyShips]); eq(await pf.deleteDraft(envOf(R), PID), { ok: true }, 'canceled: done');
    R = replay(['order_delete_refused', 'order_get_inprocess', emptyShips]); eq((await pf.deleteDraft(envOf(R), PID)).ok, false, 'in production: not deleted');
  });

  await T('P5-cancel', 'cancel: a draft is deleted (v2); a confirmed order not yet made is cancelled through v1 DELETE /orders/{id}; in production, or v1 cancel off: cannot (the owner is emailed)', async () => {
    let R = replay(['order_create_draft', 'order_delete_draft']); let r = await pf.cancel(envOf(R), PID);
    eq([r.ok, R.calls.map((c) => c.method + ' ' + c.path)], [true, ['GET /v2/orders/' + PID, 'DELETE /v2/orders/' + PID]], 'draft');
    R = replay(['order_get_pending', emptyShips, 'order_cancel_v1_ok']); r = await pf.cancel(envOf(R), PID);
    eq([r.ok, R.calls[2].method, R.calls[2].url], [true, 'DELETE', 'https://api.printful.com/orders/' + PID], 'pending: the v1 cancel');
    R = replay(['order_get_inprocess', emptyShips]); eq([await pf.cancel(envOf(R), PID), R.calls.length], [{ ok: false, kind: 'cannot', why: 'inprocess' }, 2], 'in production: no DELETE sent');
    R = replay(['order_get_pending', emptyShips, 'order_cancel_v1_refused', 'order_get_inprocess', emptyShips]); eq(await pf.cancel(envOf(R), PID), { ok: false, kind: 'cannot', why: 'refused' }, 'v1 refused (fulfilment started)');
    R = replay(['order_get_pending', emptyShips]); eq(await pf.cancel(envOf(R, { MERCH_PF_V1_CANCEL: '0' }), PID), { ok: false, kind: 'cannot', why: 'no_v2_cancel' }, 'v1 cancel off');
    R = replay([withStatus('order_get_pending', 'canceled'), emptyShips]); ok((await pf.cancel(envOf(R), PID)).ok, 'already canceled: done');
  });

  await T('P5-hook', 'parseHook: webhook v2 signing (HMAC-SHA256 of the raw body, hex-decoded secret, x-pf-webhook-signature); the order by external id; one id per event, the same for a retry', async () => {
    const raw = (n) => JSON.stringify(fx(n).event), H = (h) => new Headers(h);
    const env = { MERCH_PROVIDER_WEBHOOK_SECRET: SECRET }, b = raw('hook_shipment_sent');
    const a = await pf.parseHook(env, b, H({ 'x-pf-webhook-signature': signed(b) }));
    eq(a, { id: 'shipment_sent:' + EXT + ':70001:2026-12-03T16:35:40Z', order: EXT, type: 'shipment_sent' }, 'signed: read');
    eq(await pf.hookSign(SECRET, b), signed(b), 'the signature is Printful\'s (an independent HMAC with the hex-decoded key)');
    ok((await pf.parseHook(env, b, H({}))).bad && (await pf.parseHook(env, b, H({ 'x-pf-webhook-signature': '0'.repeat(64) }))).bad && (await pf.parseHook(env, b + ' ', H({ 'x-pf-webhook-signature': signed(b) }))).bad, 'missing, wrong, or the body changed: bad');
    ok((await pf.parseHook(env, b, H({ 'x-pf-webhook-signature': createHmac('sha256', SECRET).update(b).digest('hex') }))).bad, 'keyed with the hex text instead of its bytes: bad');
    const r2 = raw('hook_shipment_sent_retry').replace('"retries":0', '"retries":3'); ok((await pf.parseHook(env, r2, H({ 'x-pf-webhook-signature': signed(r2) }))).id === a.id, 'a retry has the same id');
    for (const [n, type] of [['hook_shipment_delivered', 'shipment_delivered'], ['hook_shipment_returned', 'shipment_returned'], ['hook_order_failed', 'order_failed'], ['hook_order_canceled', 'order_canceled'], ['hook_order_put_hold', 'order_put_hold'], ['hook_order_remove_hold', 'order_remove_hold']]) {
      const x = await pf.parseHook({}, raw(n), H({})); ok(x.type === type && x.order === EXT && x.id && x.id.startsWith(type + ':' + EXT + ':'), n);
    }
    eq(await pf.parseHook({}, raw('hook_order_created_docs'), H({})), { id: 'order_created:11111::2023-04-04T12:36:42Z', order: '11111', type: 'order_created' }, 'the docs example: no external id, so the Printful id');
    eq(await pf.parseHook({}, raw('hook_catalog_price_changed'), H({})), { id: null, order: null, type: 'catalog_price_changed' }, 'no order: not ours');
    ok((await pf.parseHook({}, 'not json', H({}))) === null, 'not JSON');
    ok(!(await pf.parseHook({ MERCH_PROVIDER_WEBHOOK_SECRET: 'not-hex-secret' }, b, H({ 'x-pf-webhook-signature': createHmac('sha256', 'not-hex-secret').update(b).digest('hex') }))).bad, 'a secret that is not hex is its text');
    ok((await pf.parseHook(env, b, H({ 'x-pf-signature': signed(b) }))).bad, 'F5-header: the old name x-pf-signature is no longer read (review finding 1)');
  });

  await T('P5-costs', 'catalogCosts: v2 prices (USD, our variants only) and Standard rates for one and two items per region -> { variants, ship }; these feed the margin guard', async () => {
    const rateOf = (c) => { const reg = Object.keys(pf.SHIP_SAMPLES).find((k) => pf.SHIP_SAMPLES[k].country_code === c.body.recipient.country_code), it = c.body.order_items[0], g = it.catalog_variant_id === 1320 ? 'mug' : 'tee', fe = SHIP_COSTS[reg][g];
      const f = fx('shipping_rates_usd'); f.body.data[0].rate = ((fe[0] + (it.quantity - 1) * fe[1]) / 100).toFixed(2); return f; };
    const seq = ['catalog_prices_mug', 'catalog_prices_tee']; for (let i = 0; i < 32; i++) seq.push(rateOf);
    const R = replay(seq), r = await pf.catalogCosts(envOf(R));
    eq(R.calls.slice(0, 2).map((c) => c.path), ['/v2/catalog-products/19/prices?selling_region_name=worldwide&currency=USD&limit=100&offset=0', '/v2/catalog-products/71/prices?selling_region_name=worldwide&currency=USD&limit=100&offset=0'], 'the price reads');
    const rc = R.calls[2]; eq([rc.method, rc.path, rc.body.currency, rc.body.recipient.country_code, rc.body.order_items[0]], ['POST', '/v2/shipping-rates', 'USD', 'US', { source: 'catalog', catalog_variant_id: 1320, quantity: 1 }], 'a rate read');
    ok(r.ok && Object.keys(r.data.variants).length === 43 && r.data.variants['mug:white'] === 607 && r.data.variants['tee:navy:M'] === 1192 && r.data.variants['tee:white:2XL'] === 1392 && r.data.variants['tee:black:4XL'] === 1792, 'variants in cents: ' + JSON.stringify(r.data.variants).slice(0, 120));
    eq(Object.keys(r.data.ship).length, 16, 'eight regions x two groups');
    for (const k of Object.keys(r.data.ship)) { const [reg, g] = k.split(':'); eq(r.data.ship[k], SHIP_COSTS[reg][g], k + ': [first, extra]'); }
    // the guard's inputs: the nightly job stores these and marginOf reads them back (costs()); a mug to the US
    const cat = buildCatalog(PP), now = Date.parse('2026-12-02T04:30:00+09:00'), costs = { unit: (v) => r.data.variants[v], ship: (reg, g) => r.data.ship[reg + ':' + g] };
    const L = [{ qty: 1, group: 'mug', variant: 'mug:white', unit_cost: PRODUCTS.mug.cost }], pr = priceBasket('us_jp', [{ line_total: 1999, qty: 1 }]);
    const a = marginOf(cat, 'US', L, pr.subtotal, pr.ship_fee, now, costs), b = marginOf(cat, 'US', L, pr.subtotal, pr.ship_fee, now);
    ok(a.pass && Math.abs(a.margin - b.margin) < 1e-9, 'the same margin as the catalog estimate (same numbers): ' + a.margin);
    const T4 = [{ qty: 1, group: 'tee', variant: 'tee:black:4XL', unit_cost: PRODUCTS.tee.cost + PRODUCTS.tee.size_cost['4XL'] }];
    ok(Math.abs(marginOf(cat, 'US', T4, 2699 + 600, 499, now, costs).margin - marginOf(cat, 'US', T4, 2699 + 600, 499, now).margin) < 1e-6 && PRODUCTS.tee.size_cost['4XL'] === 600, 'Printful\'s 4XL cost and catalog.js now agree (Q25: TEE_SIZE_COST set to Printful\'s +$6.00, review fixes)');
  });

  await T('P5-costs-partial', 'catalogCosts: pages followed; a rate not in USD or not read is left out (the old value stays); nothing read: the error', async () => {
    const page = (offset, total) => () => { const f = fx('catalog_prices_tee'); f.body.paging = { total, offset, limit: 100 }; if (offset) f.body.data.variants = [{ id: 5310, techniques: [{ technique_key: 'dtg', price: '18.50', discounted_price: '17.92' }] }]; return f; };
    const R = replay(['catalog_prices_mug', page(0, 150), page(100, 150), 'shipping_rates_docs', 'shipping_rates_usd', 'shipping_rates_usd', 'server_error_500']);
    const r = await pf.catalogCosts(envOf(R), { regions: ['us', 'uk', 'eu'], groups: ['mug'] });
    ok(R.calls[2].path.endsWith('offset=100') && r.ok && r.data.variants['tee:black:4XL'] === 1792, 'the second page, the discounted price');
    eq(r.data.ship, { 'uk:mug': [669, 0] }, 'EUR skipped, a failed read skipped');
    const D = replay(['server_error_500', 'server_error_500', 'server_error_500', 'server_error_500']); eq(await pf.catalogCosts(envOf(D), { regions: ['us'], groups: ['mug'] }), { ok: false, kind: 'down', status: 500 }, 'nothing: down');
  });

  await T('P5-quote', 'quoteCost: an estimation task, read until completed -> cents; a failed task on the recipient is address', async () => {
    let R = replay(['estimation_task_created', 'estimation_task_completed']); let r = await pf.quoteCost(envOf(R), order, L2, RECIP);
    eq([R.calls[0].path, R.calls[0].body.order_items.map((i) => [i.catalog_variant_id, i.quantity]), R.calls[1].path], ['/v2/order-estimation-tasks', [[1320, 1], [4112, 1]], '/v2/order-estimation-tasks?id=fc959efb-b3a0-4c12-9cc6-f54d3158291d'], 'the task and its read');
    eq(r, { ok: true, data: { items: 1799, shipping: 1164, tax: 0, total: 2963 } }, 'cents');
    R = replay(['estimation_task_created', 'estimation_task_failed']); eq((await pf.quoteCost(envOf(R), order, L2, RECIP)).kind, 'address', 'Recipient: Country cannot be blank.');
  });

  await T('P5-ledger-costs', 'the ledger: a draft whose costs Printful could not work out is never confirmed blind: held review (cost_unknown), owner email; a day later refunded unless the owner confirms', async () => {
    const w = await world(); w.pf.after.create = async (o) => { w.pf.after.create = null; o.c.subtotal = null; };
    const id = await w.paidOrder([mug(0)]); await w.advance(5 * MIN);
    eq([w.order(id).status, w.order(id).hold, w.order(id).why, w.order(id).provider_cost], ['held', 'review', 'cost_unknown', null], 'held');
    ok(w.owner(/cost/).length === 1 && !w.pf.calls.some((c) => /confirm/.test(c.path)), 'owner email, no confirm');
    await w.advance(DAY + HOUR); eq(w.order(id).status, 'refunded', 'a day without the owner: refunded');
    const x = await world(); x.pf.calc = 9; const j = await x.paidOrder([mug(0)]); await x.advance(5 * MIN);
    ok(!x.order(j).provider_order && x.pf.orders.size === 1 && x.order(j).last_error === 'down', 'still calculating: not adopted, backed off');
    x.pf.calc = 0; Array.from(x.pf.orders.values())[0].calc = 0; await x.advance(20 * MIN);
    ok(x.order(j).provider_order && x.pf.orders.size === 1 && x.lines(j)[0].status === 'drafted', 'then found by external id and adopted: one draft');
  });
}
