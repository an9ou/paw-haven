/* Doodle Doggo /merch: the one place the page talks to the order server (docs/design/merch/TRANSACTIONS.md 6.3).
     api.catalog()            GET  /merch/catalog
     api.quote(body)          POST /merch/quote       { country, lines[{ recipe, product, colour, size, pose, name_on, qty }] }
     api.checkout(body)       POST /merch/checkout    quote body + { expect_total, art_ver, nonce, agree: true, lang }
     api.order(id)            GET  /merch/order/:id
     api.cancel(id, body)     POST /merch/order/:id/cancel   { scope: 'order' | 'late' }
     api.wait(id)             POST /merch/order/:id/wait     {} ("Keep waiting": the buyer's yes to a late part; only while part of it is late)
     api.address(id, body)    POST /merch/order/:id/address  { name, line1, line2, city, state, postal, country } (sent on to the print partner, never kept)
     api.refundHeld(id)       POST /merch/order/:id/refund   {} (only while the order waits for an address: "refund me instead")
   Each returns a Promise of the answer's JSON, or rejects with { status, error, ... } (the server's own error body).
   MERCH_API (part 9, P1) comes from the page's own origin, exactly: on the test copy (https://test.doodledoggo.app) it is the test order
   server, https://merch-api-test.doodledoggo.app (the test Worker: Stripe sandbox keys only, nobody is charged). Everywhere else it is empty:
   TEST MODE, every call goes to the local fake (api_fake.js), nothing leaves the page and nothing can be paid. The launch adds the live
   address (https://merch-api.doodledoggo.app) for https://doodledoggo.app here, and nowhere else. */
(function (G) {
  'use strict';
  var API_FOR = { 'https://test.doodledoggo.app': 'https://merch-api-test.doodledoggo.app' };
  function apiFor(origin) { return typeof origin === 'string' && Object.prototype.hasOwnProperty.call(API_FOR, origin) ? API_FOR[origin] : ''; }
  var MERCH_API = apiFor(G.location && G.location.origin);
  function fetchJSON(method, path, body) {
    return fetch(MERCH_API + path, { method: method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'omit', cache: 'no-store' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw Object.assign({ status: r.status, error: j.error || 'busy' }, j); return j; }); },
        function () { throw { status: 0, error: 'offline' }; });
  }
  function make(o) {
    o = o || {};
    if (!MERCH_API) {
      var fake = G.MerchFake({ PawPrint: G.PawPrint, demo: !!o.demo, store: o.store || null,
        load: function () { return fetch('/merch/catalog.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw { status: r.status, error: 'busy' }; return r.json(); }); } });
      fake.mode = 'test'; return fake;
    }
    return { mode: 'live', test: false,
      catalog: function () { return fetchJSON('GET', '/merch/catalog'); },
      quote: function (b) { return fetchJSON('POST', '/merch/quote', b); },
      checkout: function (b) { return fetchJSON('POST', '/merch/checkout', b); },
      order: function (id) { return fetchJSON('GET', '/merch/order/' + encodeURIComponent(id)); },
      cancel: function (id, b) { return fetchJSON('POST', '/merch/order/' + encodeURIComponent(id) + '/cancel', b); },
      wait: function (id) { return fetchJSON('POST', '/merch/order/' + encodeURIComponent(id) + '/wait', {}); },
      address: function (id, b) { return fetchJSON('POST', '/merch/order/' + encodeURIComponent(id) + '/address', b); },
      refundHeld: function (id) { return fetchJSON('POST', '/merch/order/' + encodeURIComponent(id) + '/refund', {}); } };
  }
  G.MerchApi = { make: make, MERCH_API: MERCH_API, apiFor: apiFor };
})(typeof self !== 'undefined' ? self : this);
