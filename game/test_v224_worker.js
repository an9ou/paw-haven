// v2.24 "Kind shop" part 3 (V224.md 4 and 8.7): the Worker's /shop/* routes against a local D1 (cloudflare/d1_node.js over node:sqlite).
//   node game/test_v224_worker.js      (or: node game/run_tests.js v224_worker)
// Stripe is never called: env.STRIPE_FETCH is a fake that records each request and answers like the Checkout Sessions API.
// The keys here are made-up test strings, not Stripe keys. Prints ALL OK when every check passes.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), crypto = require('crypto'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const sec = (s) => console.log('--- ' + s);

const WHSEC = 'whsec_test_only_not_a_real_secret';
const sign = (raw, t, secret) => `t=${t},v1=${crypto.createHmac('sha256', secret || WHSEC).update(`${t}.${raw}`).digest('hex')}`;
const now = () => Math.floor(Date.now() / 1000);

(async () => {
  const t0 = Date.now();
  try {
    const { d1 } = require(path.join(ROOT, 'cloudflare', 'd1_node.js'));
    const worker = (await import(path.join(ROOT, 'cloudflare', 'worker.js'))).default;
    const DB = d1();
    DB.raw.exec(fs.readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8')); // safe to re-run
    // throws: a network error (fetch rejects); delay: ms before answering (concurrent taps); status: session id -> open | complete | expired;
    // keys: Idempotency-Key -> session id (Stripe answers the same session for the same key)
    const stripe = { calls: [], n: 0, fail: false, throws: false, delay: 0, sessions: {}, status: {}, keys: {} };
    const sres = (o, st) => new Response(JSON.stringify(o), { status: st || 200 });
    const STRIPE_FETCH = async (url, o) => {
      stripe.calls.push({ url, o, form: new URLSearchParams(o.body) });
      if (stripe.delay) await new Promise((r) => setTimeout(r, stripe.delay));
      if (stripe.throws) throw new Error('network down');
      if (stripe.fail) return sres({ error: { code: 'resource_missing' } }, 400);
      const u = new URL(url);
      let m = u.pathname.match(/\/checkout\/sessions\/(cs_[A-Za-z0-9_]+)\/expire$/);
      if (m && o.method === 'POST') { // only an open session can be expired
        const st = stripe.status[m[1]] || 'open'; if (st !== 'open') return sres({ error: { code: 'checkout_session_not_expirable' } }, 400);
        stripe.status[m[1]] = 'expired'; return sres({ id: m[1], object: 'checkout.session', status: 'expired' });
      }
      m = u.pathname.match(/\/checkout\/sessions\/(cs_[A-Za-z0-9_]+)$/);
      if (m && o.method === 'GET') return sres({ id: m[1], object: 'checkout.session', status: stripe.status[m[1]] || 'open' });
      if (o.method === 'GET') { // GET /checkout/sessions?payment_intent=...: the list API, from stripe.sessions
        const pi = u.searchParams.get('payment_intent'), cs = stripe.sessions[pi];
        return sres({ object: 'list', data: cs ? [cs] : [], has_more: false });
      }
      const key = o.headers && o.headers['Idempotency-Key'];
      const id = key && stripe.keys[key] ? stripe.keys[key] : 'cs_test_' + (++stripe.n).toString().padStart(8, '0');
      if (key) stripe.keys[key] = id;
      return sres({ id, object: 'checkout.session', url: 'https://checkout.stripe.com/c/pay/' + id });
    };
    const PRICES = JSON.stringify({ supporter: 'price_sup123', tokyo: 'price_tok123', cozy: 'price_coz123', robo: 'price_rob123', sprinkler: 'price_spr123', bowl: 'price_bow123', comfort: { price: 'price_com123', usd: 299 }, coins_1k: 'price_c1k123', coins_3k: 'price_c3k123' }); // coins_8k left out on purpose
    const env = { DB, TIDY: '1', RATE_SCALE: '1', STRIPE_FETCH };
    const open = () => Object.assign(env, { STRIPE_KEY: 'sk_test_fake_for_tests', STRIPE_WEBHOOK_SECRET: WHSEC, SHOP_PRICES: PRICES });
    const close = () => { delete env.STRIPE_KEY; delete env.STRIPE_WEBHOOK_SECRET; delete env.SHOP_PRICES; };
    let ipN = 0;
    const call = async (method, p, body, token, headers) => {
      const h = Object.assign({ 'CF-Connecting-IP': '10.24.0.' + (++ipN % 250) }, headers || {}); if (token) h.Authorization = 'Bearer ' + token;
      let b; if (body !== null && body !== undefined) { b = typeof body === 'string' ? body : JSON.stringify(body); if (!h['Content-Type']) h['Content-Type'] = 'application/json'; }
      const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' ? undefined : b }), env, { waitUntil() {} });
      const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
      return { status: res.status, headers: res.headers, text, json };
    };
    const q = (sql, ...a) => DB.raw.prepare(sql).get(...a);
    const n = (sql, ...a) => DB.raw.prepare(sql).get(...a).n;
    const hook = (ev, sig) => { const raw = typeof ev === 'string' ? ev : JSON.stringify(ev); return call('POST', '/shop/webhook', raw, null, { 'Stripe-Signature': sig === undefined ? sign(raw, now()) : sig, 'Content-Type': 'application/json; charset=utf-8' }); };
    const paid = (sid, uid, item, pi, type) => ({ id: 'evt_' + sid, type: type || 'checkout.session.completed', data: { object: { id: sid, object: 'checkout.session', payment_status: 'paid', client_reference_id: uid, metadata: { item, user: uid }, amount_total: 499, currency: 'hkd', payment_intent: pi } } });
    const account = async (email) => { const g = (await call('POST', '/guest', {})).json; const r = (await call('POST', '/register', { email, password: 'pupper123' }, g.token)).json; return { token: r.token, id: r.user.id }; };

    sec('1. closed without keys');
    close();
    const A = await account('buyer@example.com'), B = await account('friend@example.com');
    const G = (await call('POST', '/guest', {})).json;
    for (const [m, p, tok] of [['GET', '/shop/catalog'], ['POST', '/shop/checkout', A.token], ['GET', '/shop/owned', A.token]]) {
      const r = await call(m, p, m === 'POST' ? { item: 'supporter' } : null, tok);
      ok(r.status === 503 && r.json && r.json.error === 'shop_closed', `${m} ${p} without STRIPE_KEY: 503 shop_closed (${r.status} ${r.text})`);
    }
    let r = await hook(paid('cs_test_closed01', A.id, 'supporter', 'pi_test_closed01'));
    ok(r.status === 503 && r.json.error === 'shop_closed', 'the webhook without keys: 503 shop_closed');
    ok(stripe.calls.length === 0 && n('select count(*) as n from purchases') === 0, 'nothing reached Stripe or D1');
    env.STRIPE_KEY = 'sk_test_fake_for_tests';
    r = await hook(paid('cs_test_closed01', A.id, 'supporter', 'pi_test_closed01'));
    ok(r.status === 503 && r.json.error === 'shop_closed', 'the webhook without STRIPE_WEBHOOK_SECRET: still closed');
    open();

    sec('2. catalog');
    r = await call('GET', '/shop/catalog');
    const items = (r.json && r.json.items) || [];
    ok(r.status === 200 && items.length === 10, 'GET /shop/catalog needs no session and lists 10 items: ' + r.status);
    const by = Object.fromEntries(items.map((x) => [x.id, x]));
    ok(by.supporter.usd === 499 && by.supporter.once && by.coins_1k.usd === 99 && !by.coins_1k.once && by.tokyo.usd === 299 && by.robo.usd === 199 && by.bowl.usd === 99 && by.comfort.usd === 299, 'USD cents and once flags as in V224.md 1');
    ok(by.supporter.on && by.comfort.on && by.coins_8k.on === false, 'on: a Stripe price is set (coins_8k has none here)');
    ok(!r.text.includes('price_'), 'the catalog never shows the Stripe price ids');

    sec('3. checkout');
    r = await call('POST', '/shop/checkout', { item: 'supporter' });
    ok(r.status === 401, 'checkout needs a session: ' + r.status);
    r = await call('POST', '/shop/checkout', { item: 'supporter' }, G.token);
    ok(r.status === 403 && r.json.error === 'no_account', 'a guest without an email: 403 no_account');
    for (const bad of [{ item: 'puppy' }, { item: 'supporter', price: 1 }, { item: 'constructor' }, { item: '__proto__' }, {}]) {
      r = await call('POST', '/shop/checkout', bad, A.token);
      ok(r.status === 400 && r.json.error === 'bad_item', 'bad item refused: ' + JSON.stringify(bad));
    }
    r = await call('POST', '/shop/checkout', { item: 'coins_8k' }, A.token);
    ok(r.status === 503 && r.json.error === 'shop_closed', 'an item with no Stripe price: shop_closed');
    ok(stripe.calls.length === 0, 'refusals never reach Stripe');
    r = await call('POST', '/shop/checkout', { item: 'supporter' }, A.token, { Origin: 'https://html-classic.itch.zone' });
    ok(r.status === 200 && /^https:\/\/checkout\.stripe\.com\//.test(r.json.url), 'checkout returns the Stripe Checkout URL: ' + r.text);
    ok(r.headers.get('access-control-allow-origin') === 'https://html-classic.itch.zone', 'checkout answers the itch.io frame (CORS)');
    const c1 = stripe.calls[0], f1 = c1.form;
    ok(c1.url === 'https://api.stripe.com/v1/checkout/sessions' && c1.o.method === 'POST' && c1.o.headers.Authorization === 'Bearer sk_test_fake_for_tests' && c1.o.headers['Content-Type'] === 'application/x-www-form-urlencoded', 'POST api.stripe.com/v1/checkout/sessions, bearer key, form encoded');
    ok(f1.get('mode') === 'payment' && f1.get('line_items[0][price]') === 'price_sup123' && f1.get('line_items[0][quantity]') === '1', 'mode payment, the price from the Worker config, quantity 1');
    ok(f1.get('managed_payments[enabled]') === 'true', 'Managed Payments on: managed_payments[enabled]=true');
    ok(f1.get('client_reference_id') === A.id && f1.get('metadata[item]') === 'supporter' && f1.get('metadata[user]') === A.id && f1.get('customer_email') === 'buyer@example.com', 'client_reference_id and metadata item / user');
    ok(f1.get('success_url') === 'https://doodledoggo.app/thanks?ok=1' && f1.get('cancel_url') === 'https://doodledoggo.app/thanks?ok=0', 'success and cancel URLs on doodledoggo.app/thanks');
    ok(!('Stripe-Version' in c1.o.headers), 'no Stripe-Version header unless STRIPE_VERSION is set');
    Object.assign(env, { SHOP_SUCCESS_URL: 'https://example.test/ok', SHOP_CANCEL_URL: 'https://example.test/no', STRIPE_VERSION: '2026-04-22.dahlia', SHOP_MANAGED: '0' });
    r = await call('POST', '/shop/checkout', { item: 'coins_1k' }, A.token);
    const f2 = stripe.calls[1].form;
    ok(r.status === 200 && f2.get('success_url') === 'https://example.test/ok' && f2.get('cancel_url') === 'https://example.test/no' && stripe.calls[1].o.headers['Stripe-Version'] === '2026-04-22.dahlia' && !f2.has('managed_payments[enabled]'), 'SHOP_SUCCESS_URL, SHOP_CANCEL_URL, STRIPE_VERSION and SHOP_MANAGED=0 are config');
    ['SHOP_SUCCESS_URL', 'SHOP_CANCEL_URL', 'STRIPE_VERSION', 'SHOP_MANAGED'].forEach((k) => delete env[k]);
    stripe.fail = true;
    r = await call('POST', '/shop/checkout', { item: 'tokyo' }, A.token);
    ok(r.status === 503 && r.json.error === 'busy' && !r.text.includes('resource_missing'), 'a Stripe error: 503 busy, no Stripe detail passed on');
    stripe.fail = false;

    sec('4. webhook signature');
    const ev1 = paid('cs_test_sup0001', A.id, 'supporter', 'pi_test_sup0001'), raw1 = JSON.stringify(ev1);
    r = await hook(raw1, sign(raw1, now(), 'whsec_wrong'));
    ok(r.status === 400 && r.json.error === 'bad_signature', 'a wrong secret: 400 bad_signature');
    r = await hook(raw1, sign(raw1 + ' ', now()));
    ok(r.status === 400 && r.json.error === 'bad_signature', 'a changed body: 400');
    r = await hook(raw1, ''); ok(r.status === 400, 'no Stripe-Signature: 400');
    r = await hook(raw1, 't=' + now() + ',v1=zz'); ok(r.status === 400, 'a malformed v1: 400');
    r = await hook(raw1, sign(raw1, now() - 600));
    ok(r.status === 400 && r.json.error === 'stale', 'signed 10 minutes ago: 400 stale');
    r = await hook(raw1, sign(raw1, now() + 600)); ok(r.status === 400 && r.json.error === 'stale', 'signed 10 minutes ahead: 400 stale');
    ok(n('select count(*) as n from purchases') === 0, 'no refused webhook wrote anything');
    r = await hook(raw1, sign(raw1, now() - 200) + ',v1=' + '0'.repeat(64));
    ok(r.status === 200 && r.json.received === true, 'a good signature (4 minutes old, with a second v1 for a rolled secret) is taken');
    ok(!r.headers.get('access-control-allow-origin'), 'the webhook has no CORS headers (server to server)');

    sec('5. purchases: idempotent, async, refunds, unknown events');
    let row = q('select * from purchases where id = ?', 'cs_test_sup0001');
    ok(row && row.user_id === A.id && row.item === 'supporter' && row.amount === 499 && row.currency === 'hkd' && row.payment_intent === 'pi_test_sup0001' && row.refunded_at === null && row.created_at > 0, 'checkout.session.completed (paid) inserts the purchase: ' + JSON.stringify(row));
    r = await hook(raw1); ok(r.status === 200 && n('select count(*) as n from purchases') === 1, 'the same event again (a Stripe retry): still one row');
    r = await hook(paid('cs_test_sup0001', A.id, 'supporter', 'pi_test_sup0001', 'checkout.session.async_payment_succeeded'));
    ok(r.status === 200 && n('select count(*) as n from purchases') === 1, 'async_payment_succeeded for the same session: still one row');
    const unpaid = paid('cs_test_wait0001', A.id, 'tokyo', 'pi_test_wait0001'); unpaid.data.object.payment_status = 'unpaid';
    r = await hook(unpaid); ok(r.status === 200 && !q('select * from purchases where id = ?', 'cs_test_wait0001'), 'completed but unpaid (a delayed method): no purchase yet');
    r = await hook(paid('cs_test_wait0001', A.id, 'tokyo', 'pi_test_wait0001', 'checkout.session.async_payment_succeeded'));
    ok(r.status === 200 && q('select item from purchases where id = ?', 'cs_test_wait0001').item === 'tokyo', 'then async_payment_succeeded inserts it');
    r = await hook(paid('cs_test_bad00001', A.id, 'puppy', 'pi_test_bad00001')); ok(r.status === 200 && !q('select * from purchases where id = ?', 'cs_test_bad00001'), 'an unknown item: 200, nothing stored');
    const mis = paid('cs_test_bad00002', A.id, 'robo', 'pi_test_bad00002'); mis.data.object.metadata.user = B.id;
    r = await hook(mis); ok(r.status === 200 && !q('select * from purchases where id = ?', 'cs_test_bad00002'), 'metadata.user differs from client_reference_id: nothing stored');
    for (const type of ['payment_intent.created', 'customer.created', 'invoice.paid', 'charge.succeeded']) {
      r = await hook({ id: 'evt_x', type, data: { object: { id: 'x' } } }); ok(r.status === 200 && r.json.received === true, 'unknown event ' + type + ': 200');
    }
    r = await hook({ id: 'evt_y', type: 'ping' }); ok(r.status === 200, 'an event without an object: 200');
    r = await hook('not json'); ok(r.status === 400 && r.json.error === 'bad_json', 'a signed body that is not JSON: 400');
    await hook(paid('cs_test_coin0001', A.id, 'coins_1k', 'pi_test_coin0001'));
    await hook(paid('cs_test_coin0002', A.id, 'coins_1k', 'pi_test_coin0002'));
    ok(n('select count(*) as n from purchases where user_id = ? and item = ?', A.id, 'coins_1k') === 2, 'two coin packs: two rows');
    r = await hook({ id: 'evt_r0', type: 'charge.refunded', data: { object: { id: 'ch_1', object: 'charge', payment_intent: 'pi_test_wait0001', refunded: false, amount: 299, amount_refunded: 100 } } });
    ok(r.status === 200 && q('select refunded_at from purchases where id = ?', 'cs_test_wait0001').refunded_at === null, 'a partial refund keeps the item');
    r = await hook({ id: 'evt_r1', type: 'charge.refunded', data: { object: { id: 'ch_1', object: 'charge', payment_intent: 'pi_test_wait0001', refunded: true, amount: 299, amount_refunded: 299 } } });
    const ra = q('select refunded_at from purchases where id = ?', 'cs_test_wait0001').refunded_at;
    ok(r.status === 200 && ra > 0, 'charge.refunded (full) marks refunded_at by payment_intent');
    await hook({ id: 'evt_r1', type: 'charge.refunded', data: { object: { id: 'ch_1', payment_intent: 'pi_test_wait0001', refunded: true } } });
    ok(q('select refunded_at from purchases where id = ?', 'cs_test_wait0001').refunded_at === ra, 'the refund again changes nothing');

    sec('6. owned');
    r = await call('GET', '/shop/owned'); ok(r.status === 401, 'GET /shop/owned needs a session');
    r = await call('GET', '/shop/owned', null, A.token);
    const P = (r.json && r.json.purchases) || [];
    ok(r.status === 200 && P.length === 4, 'four purchases for A: ' + r.text);
    ok(P.every((p) => Object.keys(p).join() === 'id,item,at,refunded,coins' && typeof p.at === 'number' && typeof p.coins === 'number'), 'each is { id, item, at, refunded, coins } only (no amount, user or payment intent)');
    ok(P.find((p) => p.id === 'cs_test_sup0001').coins === 2000 && P.find((p) => p.id === 'cs_test_wait0001').coins === 0 && P.filter((p) => p.item === 'coins_1k').every((p) => p.coins === 2000), 'coins: 2,000 on the Supporter Pack and on each coin pack; a look is 0');
    ok(P.find((p) => p.id === 'cs_test_wait0001').refunded === true && P.find((p) => p.id === 'cs_test_sup0001').refunded === false, 'the refunded flag');
    r = await call('GET', '/shop/owned', null, B.token); ok(r.status === 200 && r.json.purchases.length === 0, 'another account sees none of them');
    r = await call('GET', '/shop/owned', null, G.token); ok(r.status === 200 && r.json.purchases.length === 0, 'a guest: an empty list');

    sec('6b. a refund that comes before its purchase (v2.24.1)');
    const early = paid('cs_test_early001', B.id, 'cozy', 'pi_test_early001').data.object;
    stripe.sessions.pi_test_early001 = early;
    const gets = () => stripe.calls.filter((c) => c.o.method === 'GET').length, g0 = gets();
    r = await hook({ id: 'evt_e1', type: 'charge.refunded', data: { object: { id: 'ch_e', payment_intent: 'pi_test_early001', refunded: true } } });
    row = q('select * from purchases where id = ?', 'cs_test_early001');
    ok(r.status === 200 && gets() === g0 + 1 && /\/checkout\/sessions\?limit=1&payment_intent=pi_test_early001$/.test(stripe.calls[stripe.calls.length - 1].url), 'it looks the session up by payment_intent');
    ok(row && row.user_id === B.id && row.item === 'cozy' && row.payment_intent === 'pi_test_early001' && row.refunded_at > 0, 'the purchase is written already refunded: ' + JSON.stringify(row));
    const era = row.refunded_at;
    r = await hook(paid('cs_test_early001', B.id, 'cozy', 'pi_test_early001'));
    ok(r.status === 200 && q('select refunded_at from purchases where id = ?', 'cs_test_early001').refunded_at === era && n('select count(*) as n from purchases where id = ?', 'cs_test_early001') === 1, 'then checkout.session.completed: one row, still refunded');
    r = await call('GET', '/shop/owned', null, B.token); ok(r.status === 200 && r.json.purchases.length === 1 && r.json.purchases[0].refunded === true, 'B owns nothing: the one purchase shows refunded');
    r = await call('POST', '/shop/checkout', { item: 'cozy' }, B.token); ok(r.status === 409 && r.json.error === 'refunded', 'a refunded one-time item cannot be bought again: 409 refunded (not owned)');
    const g1 = gets();
    r = await hook({ id: 'evt_e2', type: 'charge.refunded', data: { object: { id: 'ch_e', payment_intent: 'pi_test_early001', refunded: true } } });
    ok(r.status === 200 && gets() === g1, 'the refund again: no lookup (the row is there)');
    r = await hook({ id: 'evt_e3', type: 'charge.refunded', data: { object: { id: 'ch_o', payment_intent: 'pi_test_other001', refunded: true } } });
    ok(r.status === 200 && !q('select * from purchases where payment_intent = ?', 'pi_test_other001'), 'a refund for a payment that is not a shop session: 200, nothing stored');
    r = await hook({ id: 'evt_e4', type: 'charge.refunded', data: { object: { id: 'ch_p', payment_intent: 'pi_test_early002', refunded: false } } });
    ok(r.status === 200 && gets() === g1 + 1, 'a partial refund with no purchase: no lookup');
    const bad = paid('cs_test_early002', B.id, 'puppy', 'pi_test_early002').data.object; stripe.sessions.pi_test_early002 = bad;
    r = await hook({ id: 'evt_e5', type: 'charge.refunded', data: { object: { id: 'ch_q', payment_intent: 'pi_test_early002', refunded: true } } });
    ok(r.status === 200 && !q('select * from purchases where id = ?', 'cs_test_early002'), 'a looked-up session with an unknown item: nothing stored');
    stripe.fail = true;
    r = await hook({ id: 'evt_e6', type: 'charge.refunded', data: { object: { id: 'ch_r', payment_intent: 'pi_test_early003', refunded: true } } });
    stripe.fail = false;
    ok(r.status === 502 && r.json.error === 'stripe_error', 'the lookup fails: 502, so Stripe sends the refund again');
    DB.raw.prepare('delete from purchases where user_id = ?').run(B.id); stripe.sessions = {};

    sec('7. one-time items owned are refused');
    const before = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'supporter' }, A.token); ok(r.status === 409 && r.json.error === 'owned', 'the Supporter Pack, owned: 409 owned');
    r = await call('POST', '/shop/checkout', { item: 'tokyo' }, A.token); ok(r.status === 409 && r.json.error === 'refunded', 'Tokyo Street, refunded: 409 refunded');
    r = await call('POST', '/shop/checkout', { item: 'coins_1k' }, A.token); ok(r.status === 200, 'coin packs are repeatable (an open Checkout is reused)');
    await hook(paid('cs_test_kit00001', B.id, 'comfort', 'pi_test_kit00001'));
    r = await call('POST', '/shop/checkout', { item: 'robo' }, B.token); ok(r.status === 409, 'the Comfort Kit covers the Robo Scoop');
    r = await call('POST', '/shop/checkout', { item: 'comfort' }, B.token); ok(r.status === 409, 'and the Kit itself');
    for (const t of ['robo', 'sprinkler', 'bowl']) await hook(paid('cs_test_tool_' + t, A.id, t, 'pi_test_tool_' + t));
    r = await call('POST', '/shop/checkout', { item: 'comfort' }, A.token); ok(r.status === 409, 'all three tools owned: the Comfort Kit is refused');
    ok(stripe.calls.length === before, 'a refunded one-time item does not reach Stripe, and the open coin-pack Checkout is not opened twice');

    sec('8. Founding Friend (ff) from purchases, never from the client');
    const card = (extra) => Object.assign({ name: [1, 2], dogs: [{ b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 3 }] }, extra || {});
    r = await call('PUT', '/card', card({ ff: true }), B.token);
    ok(r.status === 200 && !('ff' in r.json), 'B (no supporter) sends ff: true: taken, but no badge: ' + r.text);
    r = await call('PUT', '/card', card({ ff: 'yes' }), B.token); ok(r.status === 400, 'ff that is not a boolean: 400 bad_card');
    r = await call('PUT', '/card', card({ ff: false }), A.token); ok(r.status === 200 && r.json.ff === 1, 'A (a supporter) sends ff: false: the badge all the same');
    r = await call('PUT', '/card', card(), A.token); ok(r.status === 200 && r.json.ff === 1, 'and with no ff at all');
    ok(!/ff/.test(q('select dogs from cards where user_id = ?', B.id).dogs), 'ff is never stored');
    const C = await account('visitor@example.com');
    r = await call('GET', '/cards/visit?n=4', null, C.token);
    const ca = r.json.find((x) => x.dogs && x.id === q('select id from cards where user_id = ?', A.id).id), cb = r.json.find((x) => x.id === q('select id from cards where user_id = ?', B.id).id);
    ok(ca && ca.ff === 1 && cb && !('ff' in cb), 'visits: ff 1 on the supporter\'s card only');
    r = await call('GET', '/card', null, A.token); ok(r.json.ff === 1, 'GET /card: my own badge');
    // friend yards
    const prof = async (U, nm) => (await call('POST', '/friends/me', { name: nm }, U.token)).json;
    const pa = await prof(A, [1, 1]), pb = await prof(B, [2, 2]);
    r = await call('POST', '/friends/add', { code: pa.code }, B.token); ok(r.status === 200, 'B adds A as a friend');
    const yard = (extra) => ({ yard: Object.assign({ v: 1, name: [1, 1], house: 14, season: 'winter', dogs: [{ b: 0, c: null, o: 56, a: 'pup', s: 'm', sp: 0, n: 4 }], decor: [] }, extra || {}) });
    r = await call('PUT', '/friends/yard', yard({ ff: 1 }), A.token); ok(r.status === 200, 'A\'s yard with house 14 (Golden Paw Cottage), outfit 56 (the last v2.24 wearable) and ff 1 is taken');
    r = await call('PUT', '/friends/yard', yard({ house: 15 }), A.token); ok(r.status === 400, 'house 15 is past FR_LIM.houses');
    r = await call('PUT', '/friends/yard', yard({ dogs: [{ b: 0, c: null, o: 57, a: 'pup', s: 'm', sp: 0, n: 4 }] }), A.token); ok(r.status === 400, 'outfit 57 is past DC_LIM.outfit');
    r = await call('PUT', '/friends/yard', yard({ ff: 'x' }), A.token); ok(r.status === 400, 'a yard ff that is not a boolean: 400');
    r = await call('PUT', '/friends/yard', yard({ ff: true, name: [2, 2] }), B.token); ok(r.status === 200, 'B\'s yard with ff true is taken');
    ok(!/ff/.test(q('select data from yards where user_id = ?', A.id).data), 'the stored yard has no ff');
    r = await call('GET', '/friends/yard?fid=' + pa.fid, null, B.token); ok(r.status === 200 && r.json.yard.ff === 1 && r.json.yard.house === 14, 'B visits A: ff 1 (from purchases)');
    r = await call('GET', '/friends/yard?fid=' + pb.fid, null, A.token); ok(r.status === 200 && r.json.yard && !('ff' in r.json.yard), 'A visits B: no ff, whatever B sent');
    await hook({ id: 'evt_r2', type: 'charge.refunded', data: { object: { id: 'ch_2', payment_intent: 'pi_test_sup0001', refunded: true } } });
    r = await call('GET', '/friends/yard?fid=' + pa.fid, null, B.token); ok(r.status === 200 && !('ff' in r.json.yard), 'the Supporter Pack refunded: the badge goes');
    r = await call('GET', '/card', null, A.token); ok(!('ff' in r.json), 'and from the Dog Card');
    r = await call('POST', '/shop/checkout', { item: 'supporter' }, A.token); ok(r.status === 409 && r.json.error === 'refunded', 'a refunded Supporter Pack cannot be bought again (409 refunded)');

    sec('9. limits and account deletion');
    const codes = []; for (let i = 0; i < 21; i++) codes.push((await call('POST', '/shop/checkout', { item: 'coins_3k' }, C.token)).status);
    ok(codes[19] === 200 && codes[20] === 429, 'checkout is rate-limited (20 an hour per account): ' + codes.slice(18).join());
    await hook(paid('cs_test_gone0001', C.id, 'coins_3k', 'pi_test_gone0001'));
    DB.raw.prepare('delete from users where id = ?').run(C.id);
    await call('GET', '/');
    ok(n('select count(*) as n from purchases where user_id = ?', C.id) === 0, 'a deleted account\'s purchases are tidied away with it');
    ok(n('select count(*) as n from purchases where user_id = ?', A.id) > 0, 'other accounts keep theirs');

    sec('11. a refund revokes the grant, and a second Pay cannot grant it twice');
    const D = await account('twice@example.com');
    const n0 = stripe.calls.length;
    const pay1 = await call('POST', '/shop/checkout', { item: 'supporter' }, D.token);
    const pay2 = await call('POST', '/shop/checkout', { item: 'supporter' }, D.token);
    ok(pay1.status === 200 && pay2.status === 200 && pay1.json.url === pay2.json.url, 'two Pay taps: one Checkout URL');
    const made = stripe.calls.slice(n0).filter((c) => c.o.method === 'POST' && /\/checkout\/sessions$/.test(c.url));
    ok(made.length === 1 && typeof made[0].o.headers['Idempotency-Key'] === 'string' && made[0].o.headers['Idempotency-Key'].indexOf(D.id) > 0, 'the second tap does not create a Stripe session; the first one sends an Idempotency-Key');
    const sid = pay1.json.url.split('/').pop();
    await hook(paid(sid, D.id, 'supporter', 'pi_twice_sup1'));
    await hook(paid('cs_test_twicedup1', D.id, 'supporter', 'pi_twice_dup1')); // a second paid session that raced in before the hold existed
    r = await call('GET', '/shop/owned', null, D.token);
    const supRows = (r.json.purchases || []).filter((p) => p.item === 'supporter');
    ok(supRows.length === 2 && supRows.reduce((s, p) => s + p.coins, 0) === 2000 && supRows.filter((p) => p.coins > 0).length === 1, 'two paid Supporter sessions still expose 2,000 coins once: ' + JSON.stringify(supRows));
    DB.raw.prepare('insert into shop_holds (user_id, item, session_id, url, created_at) values (?, ?, null, null, ?)').run(D.id, 'cozy', Date.now());
    const nBusy = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'cozy' }, D.token);
    ok(r.status === 503 && r.json.error === 'busy' && stripe.calls.length === nBusy, 'a Checkout still being created answers busy and does not call Stripe');
    DB.raw.prepare('delete from shop_holds where user_id = ? and item = ?').run(D.id, 'cozy');
    DB.raw.prepare('insert into shop_holds (user_id, item, session_id, url, created_at) values (?, ?, ?, ?, ?)').run(D.id, 'bowl', 'cs_test_oldbowl1', 'https://checkout.stripe.com/c/pay/cs_test_oldbowl1', Date.now() - 25 * 3600 * 1000);
    const nStale = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'bowl' }, D.token);
    ok(r.status === 200 && stripe.calls.length === nStale + 1 && r.json.url !== 'https://checkout.stripe.com/c/pay/cs_test_oldbowl1', 'a hold older than 24 hours is replaced with a new Checkout');
    await hook({ id: 'evt_twice_r1', type: 'charge.refunded', data: { object: { id: 'ch_twice', payment_intent: 'pi_twice_sup1', refunded: true } } });
    await hook({ id: 'evt_twice_r2', type: 'charge.refunded', data: { object: { id: 'ch_twice2', payment_intent: 'pi_twice_dup1', refunded: true } } });
    r = await call('GET', '/shop/owned', null, D.token);
    const back = (r.json.purchases || []).filter((p) => p.item === 'supporter');
    ok(back.length === 2 && back.every((p) => p.refunded) && back.reduce((s, p) => s + p.coins, 0) === 2000, 'both Supporter rows are refunded and the one coin grant is the amount to take back');
    const nNo = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'supporter' }, D.token);
    ok(r.status === 409 && r.json.error === 'refunded' && stripe.calls.length === nNo, 'after the refund the Supporter Pack cannot be bought again (409 refunded)');
    r = await call('PUT', '/card', card({ ff: true }), D.token);
    ok(r.status === 200 && !('ff' in r.json), 'the refund also drops the Founding Friend badge: ' + r.text);
    await hook(paid('cs_test_twicecoin', D.id, 'coins_1k', 'pi_twice_coin'));
    await hook({ id: 'evt_twice_rc', type: 'charge.refunded', data: { object: { id: 'ch_coin', payment_intent: 'pi_twice_coin', refunded: true } } });
    r = await call('GET', '/shop/owned', null, D.token);
    const pack = (r.json.purchases || []).find((p) => p.id === 'cs_test_twicecoin');
    ok(pack && pack.refunded && pack.coins === 2000, 'a refunded coin pack still says 2,000 coins, so the save can take them back');
    r = await call('POST', '/shop/checkout', { item: 'coins_1k' }, D.token);
    const again = await call('POST', '/shop/checkout', { item: 'coins_1k' }, D.token);
    ok(r.status === 200 && again.status === 200 && again.json.url === r.json.url, 'a refunded coin pack can be bought again, and a second tap reuses that Checkout');
    const c3 = await call('POST', '/shop/checkout', { item: 'coins_3k' }, D.token);
    const sid3 = c3.json.url.split('/').pop();
    await hook(paid(sid3, D.id, 'coins_3k', 'pi_twice_c3k1'));
    const c3b = await call('POST', '/shop/checkout', { item: 'coins_3k' }, D.token);
    ok(c3.status === 200 && c3b.status === 200 && c3b.json.url !== c3.json.url, 'once that coin pack is paid, the next Pay starts a new Checkout');

    sec('12. Stripe throws while a hold exists, then recovers (review 13 Nov, 1)');
    const E = await account('flaky@example.com');
    const creates = (from) => stripe.calls.slice(from).filter((c) => c.o.method === 'POST' && /\/checkout\/sessions$/.test(new URL(c.url).pathname));
    stripe.throws = true;
    r = await call('POST', '/shop/checkout', { item: 'tokyo' }, E.token);
    ok(r.status === 503 && r.json.error === 'busy', 'a network error from Stripe: 503 busy');
    ok(n('select count(*) as n from shop_holds where user_id = ? and item = ?', E.id, 'tokyo') === 0, 'and the hold is gone (not stuck for 24 hours)');
    stripe.throws = false;
    r = await call('POST', '/shop/checkout', { item: 'tokyo' }, E.token);
    ok(r.status === 200 && /^https:\/\//.test(r.json.url), 'the next tap, Stripe back: a Checkout url');
    const stuckAt = Date.now() - 120 * 1000; // a Worker that died mid-request: a null-url hold, two minutes old
    DB.raw.prepare('insert into shop_holds (user_id, item, session_id, url, created_at, tried_at) values (?, ?, null, null, ?, ?)').run(E.id, 'cozy', stuckAt, stuckAt);
    stripe.keys['ks_' + E.id + '_cozy_' + stuckAt] = 'cs_test_samekey001'; // Stripe had made that session before the Worker died
    let c0 = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'cozy' }, E.token);
    const re = creates(c0);
    ok(r.status === 200 && /cs_test_samekey001$/.test(r.json.url) && re.length === 1 && re[0].o.headers['Idempotency-Key'] === 'ks_' + E.id + '_cozy_' + stuckAt, 'a null-url hold over a minute old is retried with its own Idempotency-Key: the same session comes back');
    ok(q('select session_id from shop_holds where user_id = ? and item = ?', E.id, 'cozy').session_id === 'cs_test_samekey001', 'and the hold now has that session');
    DB.raw.prepare('insert into shop_holds (user_id, item, session_id, url, created_at, tried_at) values (?, ?, null, null, ?, ?)').run(E.id, 'robo', Date.now() - 5000, Date.now() - 5000);
    c0 = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'robo' }, E.token);
    ok(r.status === 503 && r.json.error === 'busy' && stripe.calls.length === c0, 'a null-url hold under a minute old: busy, Stripe is not asked twice');
    DB.raw.prepare('delete from shop_holds where user_id = ? and item = ?').run(E.id, 'robo');

    sec('13. an abandoned Comfort Kit Checkout, then a tool (review 13 Nov, 2)');
    const K = await account('kit@example.com');
    const kit = await call('POST', '/shop/checkout', { item: 'comfort' }, K.token);
    const kitSid = kit.json.url.split('/').pop();
    c0 = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'robo' }, K.token);
    const exp = stripe.calls.slice(c0).find((c) => c.o.method === 'POST' && new URL(c.url).pathname === '/v1/checkout/sessions/' + kitSid + '/expire');
    ok(r.status === 200 && r.json.url !== kit.json.url && !!exp, 'the Robo Scoop after an abandoned Kit Checkout: 200, the Kit session is expired at Stripe first: ' + r.status + ' ' + r.text);
    ok(stripe.status[kitSid] === 'expired' && n('select count(*) as n from shop_holds where user_id = ? and item = ?', K.id, 'comfort') === 0, 'and its hold is gone');
    const kit2 = await call('POST', '/shop/checkout', { item: 'comfort' }, K.token);
    ok(kit2.status === 200 && kit2.json.url !== kit.json.url, 'the Kit again (one tool Checkout open does not cover it): a new Checkout');
    const kit2Sid = kit2.json.url.split('/').pop();
    stripe.status[kit2Sid] = 'complete'; // paid on Stripe, its webhook not here yet
    c0 = stripe.calls.length;
    r = await call('POST', '/shop/checkout', { item: 'sprinkler' }, K.token);
    ok(r.status === 409 && r.json.error === 'pending' && creates(c0).length === 0, 'a tool while the paid Kit webhook is on its way: 409 pending, honest, no new Checkout: ' + r.text);
    ok(n('select count(*) as n from shop_holds where user_id = ? and item = ?', K.id, 'comfort') === 1, 'the paid Kit hold stays');
    await hook(paid(kit2Sid, K.id, 'comfort', 'pi_test_kit2paid'));
    r = await call('POST', '/shop/checkout', { item: 'sprinkler' }, K.token);
    ok(r.status === 409 && r.json.error === 'owned', 'once the Kit webhook lands: 409 owned');
    const X = await account('expire@example.com');
    const ex1 = await call('POST', '/shop/checkout', { item: 'coins_1k' }, X.token), ex1Sid = ex1.json.url.split('/').pop();
    const exEv = (type, sid, item) => ({ id: 'evt_' + type + sid, type, data: { object: { id: sid, object: 'checkout.session', status: 'expired', payment_status: 'unpaid', client_reference_id: X.id, metadata: { item, user: X.id } } } });
    r = await hook(exEv('checkout.session.expired', ex1Sid, 'coins_1k'));
    ok(r.status === 200 && n('select count(*) as n from shop_holds where user_id = ? and item = ?', X.id, 'coins_1k') === 0, 'checkout.session.expired drops that hold');
    const ex2 = await call('POST', '/shop/checkout', { item: 'coins_1k' }, X.token), ex2Sid = ex2.json.url.split('/').pop();
    ok(ex2.status === 200 && ex2Sid !== ex1Sid, 'and the next tap opens a new Checkout');
    await hook(exEv('checkout.session.async_payment_failed', ex2Sid, 'coins_1k'));
    ok(n('select count(*) as n from shop_holds where user_id = ? and item = ?', X.id, 'coins_1k') === 0, 'checkout.session.async_payment_failed drops it too');
    const exT = await call('POST', '/shop/checkout', { item: 'tokyo' }, X.token), exTSid = exT.json.url.split('/').pop();
    await hook(exEv('checkout.session.expired', exTSid, 'tokyo'));
    r = await call('POST', '/shop/checkout', { item: 'tokyo' }, X.token);
    ok(r.status === 200 && r.json.url !== exT.json.url, 'an expired one-time Checkout is not a purchase: Tokyo Street can be bought');
    DB.raw.prepare('insert into shop_holds (user_id, item, session_id, url, created_at, tried_at) values (?, ?, null, null, ?, ?)').run(X.id, 'coins_3k', Date.now(), Date.now());
    await hook(paid('cs_test_oldsess3k', X.id, 'coins_3k', 'pi_test_oldsess3k'));
    await hook(exEv('checkout.session.expired', 'cs_test_oldsess3kb', 'coins_3k'));
    ok(n('select count(*) as n from shop_holds where user_id = ? and item = ?', X.id, 'coins_3k') === 1, "an older session's webhooks do not delete a newer hold that is still being made");

    sec('14. a refund before checkout.session.completed, with a hold open');
    const Rf = await account('early2@example.com');
    const rf = await call('POST', '/shop/checkout', { item: 'coins_1k' }, Rf.token), rfSid = rf.json.url.split('/').pop();
    stripe.sessions.pi_test_rfhold01 = { id: rfSid, object: 'checkout.session', client_reference_id: Rf.id, metadata: { item: 'coins_1k', user: Rf.id }, amount_total: 99, currency: 'usd', payment_intent: 'pi_test_rfhold01' };
    r = await hook({ id: 'evt_rfhold', type: 'charge.refunded', data: { object: { id: 'ch_rfhold', payment_intent: 'pi_test_rfhold01', refunded: true } } });
    ok(r.status === 200 && q('select refunded_at from purchases where id = ?', rfSid).refunded_at > 0, 'the refund writes the purchase already refunded');
    ok(n('select count(*) as n from shop_holds where user_id = ?', Rf.id) === 0, 'and drops that Checkout hold');
    await hook(paid(rfSid, Rf.id, 'coins_1k', 'pi_test_rfhold01'));
    r = await call('GET', '/shop/owned', null, Rf.token);
    ok(r.json.purchases.length === 1 && r.json.purchases[0].refunded && r.json.purchases[0].coins === 2000, 'the late completed event keeps it refunded (coins 2,000 to take back if it was ever granted)');
    r = await call('POST', '/shop/checkout', { item: 'coins_1k' }, Rf.token);
    ok(r.status === 200 && r.json.url !== rf.json.url, 'a coin pack can be bought again: a new Checkout');

    sec('15. a coin pack bought before v2.24.2 says its old size (review 13 Nov, 5)');
    const L = await account('legacy@example.com');
    const legB = Date.UTC(2026, 10, 10, 9, 0, 0), after = Date.UTC(2026, 10, 12, 9, 0, 0), edge = Date.UTC(2026, 10, 11, 15, 50, 0);
    const ins = DB.raw.prepare('insert into purchases (id, user_id, item, amount, currency, payment_intent, created_at, refunded_at) values (?, ?, ?, 99, ?, ?, ?, ?)');
    ins.run('cs_test_leg1k0001', L.id, 'coins_1k', 'usd', 'pi_test_leg1k0001', legB, legB + 1000);
    ins.run('cs_test_leg3k0001', L.id, 'coins_3k', 'usd', 'pi_test_leg3k0001', legB + 1, null);
    ins.run('cs_test_leg8k0001', L.id, 'coins_8k', 'usd', 'pi_test_leg8k0001', edge, null);
    ins.run('cs_test_new1k0001', L.id, 'coins_1k', 'usd', 'pi_test_new1k0001', after, null);
    r = await call('GET', '/shop/owned', null, L.token);
    const lc = Object.fromEntries((r.json.purchases || []).map((p) => [p.id, p.coins]));
    ok(lc.cs_test_leg1k0001 === 1000 && lc.cs_test_leg3k0001 === 3000 && lc.cs_test_leg8k0001 === 8000, 'packs from before 16:00 UTC 11 Nov: 1,000 / 3,000 / 8,000 (refunded or not): ' + JSON.stringify(lc));
    ok(lc.cs_test_new1k0001 === 2000, 'a pack from after: 2,000');

    sec('16. a fresh device: two Supporter rows, the older one refunded (review 13 Nov, 6)');
    const Sd = await account('dupsup@example.com');
    ins.run('cs_test_dupsup001', Sd.id, 'supporter', 'usd', 'pi_test_dupsup001', after, after + 5000);
    ins.run('cs_test_dupsup002', Sd.id, 'supporter', 'usd', 'pi_test_dupsup002', after + 1, null);
    r = await call('GET', '/shop/owned', null, Sd.token);
    let sc = Object.fromEntries((r.json.purchases || []).map((p) => [p.id, p.coins]));
    ok(sc.cs_test_dupsup001 === 0 && sc.cs_test_dupsup002 === 2000, 'the 2,000 sit on the live row, so a restore gets them: ' + JSON.stringify(sc));
    DB.raw.prepare('update purchases set refunded_at = ? where id = ?').run(after + 9000, 'cs_test_dupsup002');
    r = await call('GET', '/shop/owned', null, Sd.token);
    sc = Object.fromEntries((r.json.purchases || []).map((p) => [p.id, p.coins]));
    ok(sc.cs_test_dupsup001 === 2000 && sc.cs_test_dupsup002 === 0, 'both refunded: the oldest carries the one grant again');
    r = await call('POST', '/shop/checkout', { item: 'supporter' }, Sd.token);
    ok(r.status === 409 && r.json.error === 'refunded', 'and it is not for sale again: 409 refunded');

    sec('17. three taps at the same moment');
    const T3 = await account('triple@example.com');
    stripe.delay = 30; c0 = stripe.calls.length;
    const taps = await Promise.all([1, 2, 3].map(() => call('POST', '/shop/checkout', { item: 'supporter' }, T3.token)));
    stripe.delay = 0;
    const urls = new Set(taps.filter((t) => t.status === 200).map((t) => t.json.url));
    ok(creates(c0).length === 1 && urls.size === 1 && taps.every((t) => t.status === 200 || (t.status === 503 && t.json.error === 'busy')), 'one Stripe session, one url, the other taps busy or the same url: ' + taps.map((t) => t.status).join(','));
    r = await call('POST', '/shop/checkout', { item: 'supporter' }, T3.token);
    ok(r.status === 200 && urls.has(r.json.url) && creates(c0).length === 1, 'a later tap gets that same Checkout');

    sec('10. the source');
    const src = fs.readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8');
    ok(!/sk_(live|test)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}|rk_live_/.test(src) && !/sk_(live|test)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}/.test(fs.readFileSync(path.join(ROOT, 'cloudflare', 'wrangler.toml'), 'utf8')), 'no Stripe key or webhook secret in the Worker or wrangler.toml');
    ok(/if \(p === '\/shop\/webhook' && m === 'POST'\) return shopWebhook/.test(src) && src.indexOf("p === '/shop/webhook'") < src.indexOf('JSON.parse(t)'), 'the webhook reads the raw body before route() parses JSON');
    ok(/same\(s, want\)/.test(src), 'the signature compare is constant time (same())');
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  console.log(`${passes} passed, ${fails} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
