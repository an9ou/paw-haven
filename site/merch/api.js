/* Doodle Doggo /merch: the one place the page talks to the order server (docs/design/merch/TRANSACTIONS.md 6.3).
     api.catalog()            GET  /merch/catalog
     api.quote(body)          POST /merch/quote       { country, lines[{ recipe, product, colour, size, pose, name_on, qty }] }
     api.checkout(body)       POST /merch/checkout    quote body + { expect_total, art_ver, nonce, agree: true, lang }
     api.order(id)            GET  /merch/order/:id
     api.cancel(id, body)     POST /merch/order/:id/cancel   { scope: 'order' }
   Each returns a Promise of the answer's JSON, or rejects with { status, error, ... } (the server's own error body).
   MERCH_API is empty: TEST MODE. Every call goes to the local fake (api_fake.js), nothing leaves the page and nothing can be paid.
   Part 3 sets MERCH_API (https://merch-api.doodledoggo.app) when the merch Worker exists; the page never opens a payment page in this build. */
(function (G) {
  'use strict';
  var MERCH_API = '';
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
      cancel: function (id, b) { return fetchJSON('POST', '/merch/order/' + encodeURIComponent(id) + '/cancel', b); } };
  }
  G.MerchApi = { make: make, MERCH_API: MERCH_API };
})(typeof self !== 'undefined' ? self : this);
