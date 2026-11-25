/* Doodle Doggo /merch: the fake order server for TEST MODE (MERCH_API empty). It never leaves the page: it reads the static catalog
   (/merch/catalog.json, the shape of GET /merch/catalog) and answers quote, checkout, order and cancel with the request and response shapes of
   docs/design/merch/TRANSACTIONS.md 6.3, pricing a basket the way the order server will (SHIPPING.md model C):
     unit  = product price + the size's add (US cents)      line total = unit x qty      subtotal = the sum
     shipping = 0 when the zone has free_from and subtotal >= free_from, else fee + extra x (every mug or tee past the first)
     total = subtotal + shipping
   The shop is shut (catalog.shut): a quote still answers (prices are public) and says shut: true; checkout checks everything and then answers
   503 merch_closed, so nothing is ever paid. A country not open yet (soon: true) gets 403 country_closed (TRANSACTIONS.md 6.3, note of 24 Nov). demoPay() (only
   with ?demo=1) makes a made-up order, so the thank-you and order pages can be seen; it is kept in this tab only (sessionStorage).
   The order page's buttons answer as the Worker does (part 6, docs/design/merch/PART6.md): cancel { scope: 'order' | 'late' }, wait ("Keep
   waiting": late_ok, the part 6 review batch), address (checked, then dropped: never kept), refundHeld. The cancel hour has the Worker's 120 s
   grace. A stored order's gift ('soon' | 'ready') decides whether its gift_code is answered (only when 'ready', as the Worker shows it after the
   hour); a stored gift_code with no gift field counts as 'ready'. Test hooks: put(order) stores a made-up order in any state; a stored order's own _fail field
   ({ address: 'busy' | 'address' | 'slow_down' | 'other_country' }) makes its next address call fail that way once. An order is always answered with exactly the
   fields of GET /merch/order/:id (TRANSACTIONS.md 6.3 and its notes), whatever was stored.
   Browser: <script> -> window.MerchFake(opts); Node (the tests): require('./api_fake.js') -> the same function.
   opts: { PawPrint, catalog (an object) or load() -> Promise of it, demo, now() -> ms, store (a Storage-like object for demo orders) } */
(function (G) {
  'use strict';
  function MerchFake(opts) {
    opts = opts || {};
    var P = opts.PawPrint, now = opts.now || function () { return Date.now(); }, store = opts.store || null, cat = null, orders = {};
    var ORDERS_KEY = 'dd_merch_test_orders_v1', GRACE = 120000, DAY = 86400000, SHIP_BY_DAYS = 7;
    // paid + n working days (Mon-Fri, UTC), as the Worker's util.js addBusinessDays
    function addBusinessDays(t, n) { var d = t; while (n > 0) { d += DAY; var w = new Date(d).getUTCDay(); if (w !== 0 && w !== 6) n--; } return d; }
    function fail(status, error, extra) { var e = { status: status, error: error }; if (extra) for (var k in extra) e[k] = extra[k]; return e; }
    function own(o, k) { return o && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined; }
    function load() {
      if (cat) return Promise.resolve(cat);
      var p = opts.catalog ? Promise.resolve(opts.catalog) : opts.load ? opts.load() : Promise.reject(fail(503, 'busy'));
      return p.then(function (c) {
        c = JSON.parse(JSON.stringify(c));
        c.art_vers = [P.ART_VER]; // the print page build this copy serves (the Worker lists its own print folders)
        // a product is offered only when the catalog has it on AND PawPrint has it on sale (no stickers at launch)
        c.products = c.products.filter(function (x) { return x.on && P.PRODUCTS[x.id] && P.PRODUCTS[x.id].launch === true; });
        cat = c; return c;
      });
    }
    function readOrders() { if (!store) return; try { var t = store.getItem(ORDERS_KEY); if (t) orders = JSON.parse(t) || {}; } catch (e) { /* this tab only */ } }
    function saveOrders() { if (!store) return; try { store.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch (e) { /* fine */ } }
    readOrders();

    // -> { ok: true, q } or { ok: false, e }: the quote, checked line by line as the server checks it
    function price(c, body) {
      if (!body || typeof body !== 'object') return { ok: false, e: fail(400, 'bad_line', { line: 0 }) };
      var C = null; c.countries.forEach(function (x) { if (x.code === body.country) C = x; });
      if (!C) return { ok: false, e: fail(400, 'bad_country') };
      if (C.soon) return { ok: false, e: fail(403, 'country_closed', { country: C.code }) };
      var Z = null; c.zones.forEach(function (z) { if (z.id === C.zone) Z = z; });
      if (!Z) return { ok: false, e: fail(400, 'bad_country') };
      var L = body.lines;
      if (!Array.isArray(L) || !L.length) return { ok: false, e: fail(400, 'bad_line', { line: 0 }) };
      if (L.length > c.max_lines) return { ok: false, e: fail(400, 'too_many', { max: c.max_lines }) };
      var out = [], sub = 0, items = 0, kinds = {};
      for (var i = 0; i < L.length; i++) {
        var l = L[i], n = i + 1, bad = function (why) { return { ok: false, e: fail(400, 'bad_line', { line: n, why: why }) }; };
        if (!l || typeof l !== 'object') return bad('line');
        var pr = null; c.products.forEach(function (x) { if (x.id === l.product) pr = x; });
        if (!pr) return own(P.PRODUCTS, l.product) ? { ok: false, e: fail(409, 'variant_off', { line: n }) } : bad('product');
        var d = typeof l.recipe === 'string' ? P.merchDecode(l.recipe) : { ok: false };
        if (!d.ok || d.dogs.length !== 1) return bad('recipe');
        var col = null; pr.colours.forEach(function (x) { if (x.id === l.colour) col = x; });
        if (!col) return bad('colour');
        var add = 0;
        if (pr.sizes.length) {
          if (col.sizes.indexOf(l.size) < 0) return bad('size');
          pr.sizes.forEach(function (s) { if (s.id === l.size) add = s.add; });
        } else if (l.size != null && l.size !== '') return bad('size');
        if (pr.poses.indexOf(l.pose) < 0) return bad('pose');
        if (typeof l.name_on !== 'boolean') return bad('name_on');
        if (l.name_on) {
          var dn = d.dogs[0].n; if (!dn) return { ok: false, e: fail(400, 'bad_name', { line: n, why: 'empty' }) };
          var nk = P.nameOk(dn, { product: pr.id }); if (!nk.ok) return { ok: false, e: fail(400, 'bad_name', { line: n, why: nk.why }) };
        }
        if (!(typeof l.qty === 'number' && l.qty % 1 === 0 && l.qty >= 1 && l.qty <= c.max_qty)) return { ok: false, e: fail(400, 'bad_qty', { line: n, max: c.max_qty }) };
        var unit = pr.price + add;
        out.push({ line: n, unit: unit, qty: l.qty, total: unit * l.qty }); sub += unit * l.qty; items += l.qty; kinds[pr.id] = 1;
      }
      var free = Z.free_from != null && sub >= Z.free_from, fee = free ? 0 : Z.fee + (Z.extra || 0) * (items - 1);
      var notes = (Z.notes || []).slice(); if (Object.keys(kinds).length > 1) notes.push('separate_parcels');
      return { ok: true, q: { cat_ver: c.cat_ver, zone: Z.id, lines: out, subtotal: sub, ship_fee: fee, free_from: Z.free_from, total: sub + fee, eta: Z.eta.slice(), notes: notes, shut: !!c.shut } };
    }

    function quote(body) { return load().then(function (c) { var r = price(c, body); if (!r.ok) throw r.e; return r.q; }); }
    // everything the server checks before it would make a Stripe session; the shop is shut, so the answer is 503 merch_closed
    function precheck(c, body) {
      var r = price(c, body); if (!r.ok) throw r.e;
      if (body.agree !== true) throw fail(400, 'no_agree');
      if (c.art_vers.indexOf(body.art_ver) < 0) throw fail(409, 'art_changed');
      if (body.expect_total !== r.q.total) throw fail(409, 'price_changed', { quote: r.q });
      if (typeof body.nonce !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(body.nonce)) throw fail(400, 'bad_line', { line: 0, why: 'nonce' });
      return r.q;
    }
    function checkout(body) {
      return load().then(function (c) {
        precheck(c, body);
        if (c.shut) throw fail(503, 'merch_closed');
        throw fail(503, 'busy'); // a fake never makes a payment session, even if the catalog said open
      });
    }
    // ?demo=1 only: "pretend it was paid" -> { order } (made up, marked test; kept in this tab)
    function demoPay(body) {
      if (!opts.demo) return Promise.reject(fail(403, 'not_available'));
      return load().then(function (c) {
        var q = precheck(c, body), t = now(), id = 'mo_TEST' + Math.random().toString(36).slice(2, 10).toUpperCase();
        var lines = body.lines.map(function (l, i) {
          var r = P.merchDecode(l.recipe).dogs[0];
          return { line: i + 1, product: l.product, colour: l.colour, size: l.size || null, pose: l.pose, name_on: l.name_on, name: l.name_on ? r.n || null : null, qty: l.qty, unit: q.lines[i].unit, status: 'pending', refunded_qty: 0, parcel: null, recipe: l.recipe }; // name: only when printed (as the Worker)
        });
        orders[id] = { id: id, status: 'paid', hold: null, pay_pending: false, paid_at: t, cancel_until: t + 60 * 60 * 1000, ship_by: addBusinessDays(t, SHIP_BY_DAYS), country: body.country, lines: lines, parcels: [],
          totals: { subtotal: q.subtotal, ship_fee: q.ship_fee, tax: 0, total: q.total, refunded: 0 }, pres: null, gift: null, gift_code: null, gift_name: null, late: false, late_eta: null, late_ok: false, dispute: null };
        saveOrders(); return { order: id, url: null, test: true };
      });
    }
    // the answer of GET /merch/order/:id: exactly its fields, from whatever was stored (a test may store a partial order)
    var LINE_F = ['line', 'product', 'colour', 'size', 'pose', 'name_on', 'name', 'qty', 'unit', 'status', 'refunded_qty', 'parcel', 'recipe', 'reprint_of'];
    var PARCEL_F = ['id', 'product', 'carrier', 'tracking_url', 'shipped_at', 'delivered_at'];
    function pick(o, F, d) { var r = {}; F.forEach(function (k) { var v = own(o, k); r[k] = v === undefined ? (d && k in d ? d[k] : null) : v; }); return r; }
    function canCancel(o) { return (o.status === 'paid' || o.status === 'held') && o.hold !== 'dispute' && o.dispute !== 'open' && typeof o.cancel_until === 'number' && now() < o.cancel_until + GRACE; }
    function view(o) {
      var v = JSON.parse(JSON.stringify(o)), t = v.totals || {}, gift = v.gift === 'soon' || v.gift === 'ready' ? v.gift : v.gift_code ? 'ready' : null;
      if (gift === 'ready' && !v.gift_code) gift = null;
      var out = { id: v.id, status: v.status, hold: v.hold || null, pay_pending: !!v.pay_pending, paid_at: v.paid_at == null ? null : v.paid_at, cancel_until: v.cancel_until == null ? null : v.cancel_until,
        can_cancel: canCancel(v), country: v.country || null,
        lines: (Array.isArray(v.lines) ? v.lines : []).map(function (l) { return pick(l, LINE_F, { refunded_qty: 0, name_on: false }); }),
        parcels: (Array.isArray(v.parcels) ? v.parcels : []).map(function (p) { return pick(p, PARCEL_F); }),
        totals: { subtotal: t.subtotal || 0, ship_fee: t.ship_fee || 0, tax: t.tax || 0, total: t.total || 0, refunded: t.refunded || 0 },
        pres: v.pres && v.pres.currency ? { currency: v.pres.currency, amount: v.pres.amount } : null,
        gift: gift, gift_code: gift === 'ready' ? v.gift_code : null, gift_name: gift === 'ready' ? v.gift_name || null : null,
        ship_by: typeof v.ship_by === 'number' ? v.ship_by : null, late: !!v.late, late_eta: typeof v.late_eta === 'number' ? v.late_eta : null, late_ok: !!v.late_ok, dispute: v.dispute || null };
      if (v.resting) out.resting = true;
      return out;
    }
    function order(id) {
      readOrders();
      var o = own(orders, id); return o ? Promise.resolve(view(o)) : Promise.reject(fail(404, 'not_found'));
    }
    var DEAD = ['void', 'replaced', 'cancelled', 'rejected'], SHIPPED = ['shipped', 'delivered'];
    function live(l) { return DEAD.indexOf(l.status) < 0 && (l.refunded_qty || 0) < l.qty; }
    function refundAll(o, to) { o.status = to; o.hold = null; o.totals.refunded = o.totals.total; o.late = false; o.lines.forEach(function (l) { if (SHIPPED.indexOf(l.status) < 0 && DEAD.indexOf(l.status) < 0) l.status = 'cancelled'; l.refunded_qty = l.qty; }); }
    function cancel(id, body) {
      readOrders();
      var o = own(orders, id); if (!o) return Promise.reject(fail(404, 'not_found'));
      if (body && body.scope === 'late') { // the delay cancel: every live line not yet sent is refunded in full
        if (o.late && o.status === 'confirming') return Promise.reject(fail(409, 'busy', { say: 'We\u2019re sending your order to print right this minute. Please try again in a minute or two.' }));
        if (!o.late || o.dispute === 'open' || o.hold === 'dispute') return Promise.reject(fail(409, 'not_late'));
        var late = o.lines.filter(function (l) { return live(l) && SHIPPED.indexOf(l.status) < 0; }); if (!late.length) return Promise.reject(fail(409, 'not_late'));
        late.forEach(function (l) { var q = l.qty - (l.refunded_qty || 0); l.refunded_qty = l.qty; l.status = 'cancelled'; o.totals.refunded = (o.totals.refunded || 0) + l.unit * q; });
        o.late = false;
        if (!o.lines.some(live)) { o.status = 'refunded'; o.totals.refunded = o.totals.total; } else if (o.lines.filter(live).every(function (l) { return SHIPPED.indexOf(l.status) >= 0; })) o.status = 'shipped';
        saveOrders(); return Promise.resolve({ status: o.status, refund: 'done' });
      }
      if (!body || body.scope !== 'order') return Promise.reject(fail(409, 'not_late'));
      if (o.hold === 'dispute' || o.dispute === 'open') return Promise.reject(fail(409, 'not_allowed', { say: 'Your bank is looking at this payment, so we\u2019ve paused it.' }));
      if (!canCancel(o)) return Promise.reject(fail(409, 'too_late'));
      refundAll(o, 'cancelled'); saveOrders();
      return Promise.resolve({ status: 'cancelled', refund: 'done' });
    }
    // "Keep waiting": recorded once, only while part of the order is late (as the Worker)
    function wait(id) {
      readOrders();
      var o = own(orders, id); if (!o) return Promise.reject(fail(404, 'not_found'));
      if (!o.late || ['cancelled', 'refunded', 'expired'].indexOf(o.status) >= 0) return Promise.reject(fail(409, 'not_late'));
      o.late_ok = true; saveOrders(); return Promise.resolve({ ok: true, late_ok: true, late_eta: typeof o.late_eta === 'number' ? o.late_eta : null });
    }
    // the address form: checked as the Worker checks it, then dropped (the fake keeps nothing of it: no store, no variable)
    function address(id, body) {
      readOrders();
      var o = own(orders, id); if (!o) return Promise.reject(fail(404, 'not_found'));
      var reship = o.hold === 'reship' && ['part_shipped', 'shipped', 'confirmed'].indexOf(o.status) >= 0;
      if (!((o.status === 'held' && o.hold === 'address') || reship)) return Promise.reject(fail(409, 'not_needed'));
      body = body && typeof body === 'object' ? body : {};
      var f = function (k, max, need) { var v = body[k]; if (v == null || v === '') return need ? false : ''; return typeof v === 'string' && v.trim().length <= max && !/[\u0000-\u001f]/.test(v) && (!need || v.trim()) ? v.trim() : false; };
      var A = [['name', 80, true], ['line1', 120, true], ['line2', 120, false], ['city', 80, true], ['state', 60, false], ['postal', 20, true]];
      for (var i = 0; i < A.length; i++) if (f(A[i][0], A[i][1], A[i][2]) === false) return Promise.reject(fail(400, 'bad_address', { field: A[i][0] }));
      if (typeof body.country !== 'string' || !/^[A-Z]{2}$/.test(body.country)) return Promise.reject(fail(400, 'bad_address', { field: 'country' }));
      if (body.country !== o.country) return Promise.reject(fail(400, 'other_country', { country: o.country }));
      var hook = o._fail && o._fail.address; if (hook) { delete o._fail.address; saveOrders(); }
      if (hook === 'busy') return Promise.reject(fail(503, 'busy', { say: 'One moment, please try again.' }));
      if (hook === 'slow_down') return Promise.reject(fail(429, 'slow_down'));
      if (hook === 'address') return Promise.reject(fail(400, 'bad_address', { field: 'address' }));
      if (hook === 'other_country') return Promise.reject(fail(400, 'other_country', { country: o.country })); // the page always sends the order's own country
      if (reship) o.hold = null; else { o.status = 'paid'; o.hold = null; }
      saveOrders(); return Promise.resolve({ ok: true, say: 'Thanks! We\u2019ll send it there.' });
    }
    function refundHeld(id) {
      readOrders();
      var o = own(orders, id); if (!o) return Promise.reject(fail(404, 'not_found'));
      if (!(o.status === 'held' && o.hold === 'address')) return Promise.reject(fail(409, 'not_allowed'));
      refundAll(o, 'refunded'); saveOrders(); return Promise.resolve({ status: 'refunded' });
    }
    // test hook: a made-up order in any state, kept in this tab like a demo order
    function put(o) { if (!o || typeof o.id !== 'string') return false; readOrders(); orders[o.id] = JSON.parse(JSON.stringify(o)); saveOrders(); return true; }
    return { test: true, catalog: load, quote: quote, checkout: checkout, order: order, cancel: cancel, wait: wait, address: address, refundHeld: refundHeld, demoPay: demoPay, put: put, _price: function (c, b) { return price(c, b); } };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = MerchFake; else G.MerchFake = MerchFake;
})(typeof self !== 'undefined' ? self : this);
