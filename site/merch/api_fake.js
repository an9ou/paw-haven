/* Doodle Doggo /merch: the fake order server for TEST MODE (MERCH_API empty). It never leaves the page: it reads the static catalog
   (/merch/catalog.json, the shape of GET /merch/catalog) and answers quote, checkout, order and cancel with the request and response shapes of
   docs/design/merch/TRANSACTIONS.md 6.3, pricing a basket the way the order server will (SHIPPING.md model C):
     unit  = product price + the size's add (US cents)      line total = unit x qty      subtotal = the sum
     shipping = 0 when the zone has free_from and subtotal >= free_from, else fee + extra x (every mug or tee past the first)
     total = subtotal + shipping
   The shop is shut (catalog.shut): a quote still answers (prices are public) and says shut: true; checkout checks everything and then answers
   503 merch_closed, so nothing is ever paid. A country not open yet (soon: true) gets 403 country_closed (TRANSACTIONS.md 6.3, note of 24 Nov). demoPay() (only
   with ?demo=1) makes a made-up order, marked test, so the thank-you and order pages can be seen; it is kept in this tab only.
   Browser: <script> -> window.MerchFake(opts); Node (the tests): require('./api_fake.js') -> the same function.
   opts: { PawPrint, catalog (an object) or load() -> Promise of it, demo, now() -> ms, store (a Storage-like object for demo orders) } */
(function (G) {
  'use strict';
  function MerchFake(opts) {
    opts = opts || {};
    var P = opts.PawPrint, now = opts.now || function () { return Date.now(); }, store = opts.store || null, cat = null, orders = {};
    var ORDERS_KEY = 'dd_merch_test_orders_v1';
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
          return { line: i + 1, product: l.product, colour: l.colour, size: l.size || null, pose: l.pose, name_on: l.name_on, name: r.n || '', qty: l.qty, unit: q.lines[i].unit, status: 'pending', refunded_qty: 0, parcel: null, recipe: l.recipe };
        });
        orders[id] = { id: id, test: true, status: 'paid', hold: null, paid_at: t, cancel_until: t + 60 * 60 * 1000, country: body.country, lines: lines, parcels: [],
          totals: { subtotal: q.subtotal, ship_fee: q.ship_fee, tax: 0, total: q.total, refunded: 0 }, pres: null, gift_code: null, late: false, eta: q.eta };
        saveOrders(); return { order: id, url: null, test: true };
      });
    }
    function view(o) { var v = JSON.parse(JSON.stringify(o)); v.can_cancel = v.status === 'paid' && now() <= v.cancel_until; return v; }
    function order(id) {
      readOrders();
      var o = own(orders, id); return o ? Promise.resolve(view(o)) : Promise.reject(fail(404, 'not_found'));
    }
    function cancel(id, body) {
      readOrders();
      var o = own(orders, id); if (!o) return Promise.reject(fail(404, 'not_found'));
      if (!body || body.scope !== 'order') return Promise.reject(fail(409, 'not_late'));
      if (o.status !== 'paid' || now() > o.cancel_until) return Promise.reject(fail(409, 'too_late'));
      o.status = 'cancelled'; o.totals.refunded = o.totals.total; o.lines.forEach(function (l) { l.status = 'cancelled'; l.refunded_qty = l.qty; }); saveOrders();
      return Promise.resolve({ status: 'cancelled', refund: 'done' });
    }
    return { test: true, catalog: load, quote: quote, checkout: checkout, order: order, cancel: cancel, demoPay: demoPay, _price: function (c, b) { return price(c, b); } };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = MerchFake; else G.MerchFake = MerchFake;
})(typeof self !== 'undefined' ? self : this);
