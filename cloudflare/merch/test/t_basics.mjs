// Stage 1: catalog, quote, the line checks, the switches, routes' input checks, quote totals and margins to the cent (SHIPPING.md).
import { T, ok, eq, world, mug, tee, R, DOG, PP, MIN, HOUR, DAY } from './harness.mjs';
import { marginOf, priceBasket, openCountries } from '../lines.js';
import { buildCatalog, NEVER } from '../catalog.js';

export async function basics() {
  console.log('--- stage 1: catalog, quote, line checks, switches');
  await T('X-catalog', 'GET /merch/catalog: products, zones, countries, art_vers; no stickers; edge cache 60 s', async () => {
    const w = await world(); const r = await w.call('GET', '/merch/catalog');
    ok(r.status === 200, 'status ' + r.status); const c = r.json;
    eq(c.products.map((p) => p.id), ['mug', 'tee'], 'products'); ok(!c.shut, 'open'); eq([c.max_lines, c.max_qty], [6, 3], 'limits');
    ok(c.products[0].price === 1999 && c.products[1].price === 2699, 'prices');
    eq(c.products[1].colours.map((x) => x.id), PP.TEE_COLOURS.map((x) => x.id), 'tee colours = PawPrint.TEE_COLOURS');
    ok(c.products[1].sizes.find((s) => s.id === '2XL').price === 2899, '2XL price');
    eq(c.zones.map((z) => [z.id, z.fee, z.free_from]), [['us_jp', 499, 3500], ['uk_eu', 599, 7000], ['ca_au_nz', 799, 7000], ['world', 1199, null]], 'zones');
    ok(c.countries.some((x) => x.code === 'US' && x.zone === 'us_jp' && x.soon === false) && c.countries.some((x) => x.code === 'GB' && x.soon === true) && !c.countries.some((x) => x.code === 'RU'), 'countries {code, zone, soon}: open and not yet; never-countries left out');
    ok(c.countries.every((x) => Object.keys(x).sort().join() === 'code,soon,zone'), 'no names in the country list');
    eq(c.zones.map((z) => z.notes), [[], [], [], ['import_tax']], 'zone notes are codes'); ok(!c.products[1].colours.some((x) => 'name' in x), 'no free text (colour names) in the catalog');
    ok(c.products[1].sizes.find((s) => s.id === '2XL').add === 200, 'a size carries its extra (add)');
    eq(c.art_vers, [PP.ART_VER], 'art_vers'); ok(r.headers.get('cache-control') === 'public, max-age=60', 'cached 60 s');
  });
  await T('X-shut-catalog', 'catalog says shut when MERCH_FROM is empty or in the future, or nothing is set up', async () => {
    for (const env of [{ MERCH_FROM: '' }, { MERCH_FROM: '2027-05-01T00:00:00+09:00' }, { STRIPE_FETCH: undefined }, { MERCH_STRIPE_KEY: undefined }, { MERCH_HASH_KEY: undefined }, { PROVIDER_FETCH: undefined }, { RENDER_FETCH: undefined }]) {
      const w = await world({ env }); const c = (await w.call('GET', '/merch/catalog')).json; ok(c.shut === true && c.countries.length > 0 && c.sold_out_today === false, 'shut for ' + JSON.stringify(env));
    }
  });
  await T('X-countries', 'MERCH_COUNTRIES: empty, all, a list, minus codes and zones; the never list always wins', async () => {
    ok(openCountries({ MERCH_COUNTRIES: '' }).size === 0, 'empty = none');
    const all = openCountries({ MERCH_COUNTRIES: 'all' }); ok(all.has('US') && all.has('GB') && all.has('HK') && NEVER.every((c) => !all.has(c)), 'all minus never');
    eq(Array.from(openCountries({ MERCH_COUNTRIES: 'US,CA,RU' })).sort(), ['CA', 'US'], 'a list (RU never)');
    const m = openCountries({ MERCH_COUNTRIES: 'all,-uk_eu,-BR' }); ok(!m.has('GB') && !m.has('FR') && !m.has('BR') && m.has('JP'), 'minus a zone and a code');
  });
  await T('X-quote-cents', 'quote totals to the cent for the SHIPPING.md baskets (model C)', async () => {
    const w = await world({ env: { MERCH_COUNTRIES: 'all' } });
    const cases = [['US', [mug(0)], 2498, 499], ['US', [tee(0)], 3198, 499], ['US', [mug(0), tee(1)], 4698, 0], ['US', [tee(0, { qty: 2 })], 5398, 0], ['US', [mug(0), mug(1)], 3998, 0],
      ['JP', [tee(0)], 3198, 499], ['CA', [tee(0)], 3498, 799], ['AU', [tee(0)], 3498, 799], ['NZ', [mug(0), tee(1)], 5497, 799], ['GB', [tee(0)], 3298, 599], ['DE', [mug(0), tee(1, { qty: 2 })], 7397, 0],
      ['HK', [mug(0)], 3198, 1199], ['HK', [mug(0), tee(1)], 4698 + 1199 + 599, 1798], ['NO', [tee(0, { qty: 3 })], 8097 + 1199 + 2 * 599, 2397],
      ['US', [tee(0, { size: '2XL' })], 2899 + 499, 499]];
    for (const [c, lines, total, fee] of cases) { const r = await w.quote(lines, c); ok(r.status === 200, c + ' ' + r.text); ok(r.json.total === total && r.json.ship_fee === fee, c + ' ' + lines.length + ' lines: ' + r.json.total + '/' + r.json.ship_fee + ' want ' + total + '/' + fee); }
    const r = await w.quote([mug(0)], 'HK'); eq(r.json.notes, ['import_tax'], 'world note (a code)'); ok(r.json.free_from === null, 'never free in world');
    const m = await w.quote([mug(0), tee(1)], 'US'); eq(m.json.notes, ['separate_parcels'], 'mugs and tees in their own parcels (a code)'); eq(m.json.eta, [5, 9], 'eta [min, max] business days');
    ok(w.q('select count(*) as n from merch_orders')[0].n === 0, 'a quote writes nothing');
  });
  await T('X-margin', 'the margin guard matches SHIPPING.md model C to the cent (US, no holiday): mug 9.41, tee 11.54, mug+tee 11.66, 2 tees 16.87, 2 mugs 13.11', async () => {
    const cat = buildCatalog(PP), after = Date.parse('2027-02-01T00:00:00Z');
    const L = (k, q) => ({ qty: q || 1, group: k, unit_cost: k === 'mug' ? 607 : 1192, line_total: (k === 'mug' ? 1999 : 2699) * (q || 1) });
    for (const [lines, want] of [[[L('mug')], 941], [[L('tee')], 1154], [[L('mug'), L('tee')], 1166], [[L('tee', 2)], 1687], [[L('mug', 2)], 1311]]) {
      const pr = priceBasket('us_jp', lines), m = marginOf(cat, 'US', lines, pr.subtotal, pr.ship_fee, after);
      ok(Math.round(m.margin) === want && m.pass, JSON.stringify(lines.map((l) => l.group)) + ' margin ' + m.margin.toFixed(2) + ' want ' + want);
    }
    const pr = priceBasket('us_jp', [L('mug')]), withHol = marginOf(cat, 'US', [L('mug')], pr.subtotal, pr.ship_fee, Date.parse('2026-12-01T00:00:00Z'));
    ok(Math.abs((941.46 - withHol.margin) - 42.8) < 0.01, 'the holiday surcharge costs $0.43 a US order: ' + (941.46 - withHol.margin));
    // every 1-4 item basket passes in every zone (SHIPPING 2)
    for (const c of ['US', 'JP', 'CA', 'AU', 'GB', 'DE', 'NO', 'HK']) for (const ks of [['mug'], ['tee'], ['mug', 'tee'], ['tee', 'tee'], ['mug', 'mug'], ['mug', 'tee', 'tee'], ['tee', 'tee', 'tee', 'tee'], ['mug', 'mug', 'mug', 'tee']]) {
      const ls = ks.map((k) => L(k)), z = { US: 'us_jp', JP: 'us_jp', CA: 'ca_au_nz', AU: 'ca_au_nz', GB: 'uk_eu', DE: 'uk_eu', NO: 'world', HK: 'world' }[c], p2 = priceBasket(z, ls);
      ok(marginOf(cat, c, ls, p2.subtotal, p2.ship_fee, Date.parse('2026-12-01T00:00:00Z')).pass, c + ' ' + ks.join('+') + ' fails the floor');
    }
  });
  await T('X-lines', 'line checks: merge identical lines, the recipe, colour, size and pose tables, the name per product', async () => {
    const w = await world();
    let r = await w.quote([mug(0), mug(0)]); ok(r.status === 200 && r.json.lines.length === 1 && r.json.lines[0].qty === 2, 'identical lines merge: ' + r.text);
    r = await w.quote([tee(0, { colour: 'white', size: '4XL' })]); ok(r.status === 200, 'white 4XL is made in both');
    r = await w.quote([tee(0, { colour: 'pink', size: '4XL' })]); eq([r.status, r.json.error, r.json.why], [400, 'bad_line', 'size'], 'pink 4XL is not made in the UK: refused');
    r = await w.quote([mug(0, { size: 'M' })]); eq([r.status, r.json.why], [400, 'size'], 'a mug has no size');
    const noName = Object.assign({}, DOG[3]); delete noName.n;
    r = await w.quote([mug(0, { recipe: PP.merchEncode(noName), name_on: true })]); ok(r.status === 400 && r.json.error === 'bad_name' && r.json.say, 'a dog with no name: name_on refused: ' + r.text);
    const longName = Object.assign({}, DOG[0], { n: 'WWWWWWWWWWWWWWWWWWWW' });
    r = await w.quote([mug(0, { recipe: PP.merchEncode(longName), name_on: true })]); ok(r.status === 400 && r.json.error === 'bad_name' && r.json.why === 'long' && r.json.max > 0, 'twenty Ws do not fit the mug: ' + r.text);
    r = await w.quote([tee(0, { recipe: PP.merchEncode(longName), name_on: true })]); ok(r.status === 200, 'but they fit the tee: ' + r.text);
    r = await w.quote([mug(0, { recipe: PP.merchEncode(longName), name_on: false })]); ok(r.status === 200, 'or print without the name');
  });
  await T('X-inputs', 'input checks on every route (bad JSON, bad country, bad nonce, no agree, unknown routes, wrong methods)', async () => {
    const w = await world();
    for (const [m, p, b, st, err] of [['POST', '/merch/quote', '{not json', 400, 'bad_json'], ['POST', '/merch/quote', { country: 'us', lines: [mug()] }, 400, 'bad_country'], ['POST', '/merch/quote', { country: 'QQ', lines: [mug()] }, 400, 'bad_country'],
      ['POST', '/merch/quote', { country: 'US', lines: [] }, 400, 'bad_line'], ['POST', '/merch/quote', { country: 'US', lines: 'x' }, 400, 'bad_line'], ['POST', '/merch/quote', { country: 'US', lines: [null] }, 400, 'bad_line'],
      ['POST', '/merch/checkout', { country: 'US', lines: [mug()], agree: false, nonce: 'abcdefgh1', art_ver: PP.ART_VER, expect_total: 2498 }, 400, 'no_agree'],
      ['POST', '/merch/checkout', { country: 'US', lines: [mug()], agree: true, nonce: 'x', art_ver: PP.ART_VER, expect_total: 2498 }, 400, 'bad_nonce'],
      ['GET', '/merch/quote', null, 404, 'not_found'], ['GET', '/merch/nothing', null, 404, 'not_found'], ['GET', '/other', null, 404, 'not_found'], ['GET', '/merch/order/x/cancel', null, 404, 'not_found'],
      ['POST', '/merch/order/mo_AAAAAAAAAAAAAAAAAAAAAA/cancel', {}, 404, 'not_found'], ['POST', '/merch/order/mo_AAAAAAAAAAAAAAAAAAAAAA/address', {}, 404, 'not_found'],
      ['POST', '/merch/webhook/stripe', '{}', 400, 'bad_signature'], ['GET', '/merch/file/x/1/2.png', null, 403, 'forbidden']]) {
      const r = await w.call(m, p, b); ok(r.status === st && r.json && r.json.error === err, m + ' ' + p + ': ' + r.status + ' ' + r.text);
    }
    const big = await w.call('POST', '/merch/quote', JSON.stringify({ country: 'US', lines: [mug()], pad: 'x'.repeat(70000) })); ok(big.status === 400, 'a body over 64 KB: 400');
    const many = await w.quote(Array.from({ length: 31 }, () => mug())); ok(many.status === 400 && many.json.error === 'too_many', 'over 30 input lines: too_many');
  });
  await T('X-cors', 'CORS: the site and localhost only; webhooks and files send no CORS headers; the test Worker only test.doodledoggo.app', async () => {
    const w = await world();
    let r = await w.raw('OPTIONS', '/merch/quote', null, { Origin: 'https://doodledoggo.app' }); ok(r.status === 204 && r.headers.get('access-control-allow-origin') === 'https://doodledoggo.app', 'site preflight');
    r = await w.raw('OPTIONS', '/merch/quote', null, { Origin: 'https://evil.example' }); ok(r.status === 403, 'other origin refused');
    r = await w.raw('GET', '/merch/catalog', null, { Origin: 'http://localhost:8765' }); ok(r.headers.get('access-control-allow-origin') === 'http://localhost:8765', 'localhost');
    r = await w.raw('POST', '/merch/webhook/stripe', '{}', { Origin: 'https://doodledoggo.app' }); ok(!r.headers.get('access-control-allow-origin'), 'no CORS on the webhook');
    r = await w.raw('GET', '/merch/catalog', null, { Origin: 'https://test.doodledoggo.app' }); ok(!r.headers.get('access-control-allow-origin'), 'the live Worker does not answer the test origin');
    const t = await world({ env: { MERCH_TEST: '1' } });
    r = await t.raw('GET', '/merch/catalog', null, { Origin: 'https://test.doodledoggo.app' }); ok(r.headers.get('access-control-allow-origin') === 'https://test.doodledoggo.app', 'test Worker: test origin');
    r = await t.raw('GET', '/merch/catalog', null, { Origin: 'https://doodledoggo.app' }); ok(!r.headers.get('access-control-allow-origin'), 'test Worker: not the live site');
    const c = await w.checkout([mug()], 'US', {}); ok(c.status === 200, 'no Origin header (server tools): fine');
    const q = await w.quote([mug()]); const live = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug()], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'test-origin-1', agree: true }, { Origin: 'https://test.doodledoggo.app' });
    ok(live.status === 403 && live.json.error === 'not_available', 'the live Worker refuses a checkout from the test copy');
  });
  await T('X-not-set-up', 'no fetch seams or no keys: the Worker refuses to take an order (it can never charge anyone by accident)', async () => {
    for (const env of [{ STRIPE_FETCH: undefined }, { MERCH_STRIPE_KEY: undefined }, { MERCH_STRIPE_WEBHOOK_SECRET: undefined }, { MERCH_FILE_KEY: undefined }, { MERCH_TEST: '1', MERCH_STRIPE_KEY: 'sk_live_xx' }, { MERCH_TEST: '1', MERCH_STRIPE_KEY: 'rk_live_xx' },
      { PROVIDER_FETCH: undefined }, { MERCH_PROVIDER_KEY: undefined }, { RENDER_FETCH: undefined }, { MERCH_PROVIDER_WEBHOOK_SECRET: undefined }]) { // M5, S8: the printer, the renderer and (live) signed hints too
      const w = await world({ env }); const r = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug()], expect_total: 2498, art_ver: PP.ART_VER, nonce: 'nonce-unset-1', agree: true });
      ok(r.status === 503 && r.json.error === 'merch_closed', JSON.stringify(Object.keys(env)) + ': ' + r.status + ' ' + r.text);
      ok(w.stripe.calls.length === 0 && w.q('select count(*) as n from merch_orders')[0].n === 0, 'no Stripe call, nothing written');
    }
  });
  await T('X-shut-gate', 'the shut gate: checkout refuses when MERCH_FROM is empty; a quote answers with shut: true (prices are public); a soon country still 403', async () => {
    const w = await world({ env: { MERCH_FROM: '' } });
    const c = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug()], expect_total: 2498, art_ver: PP.ART_VER, nonce: 'nonce-shut-1', agree: true }); ok(c.status === 503 && c.json.error === 'merch_closed', 'checkout ' + c.status);
    const q = await w.quote([mug()]); ok(q.status === 200 && q.json.shut === true && q.json.total === 2498, 'quote while shut: ' + q.text);
    const s = await w.quote([mug()], 'GB'); ok(s.status === 403 && s.json.error === 'country_closed', 'a soon country: 403');
    const off = await world({ env: { MERCH_OFF: '1' } }); ok((await off.quote([mug()])).status === 503, 'MERCH_OFF (resting): the quote is refused too');
    ok(w.stripe.calls.length === 0 && w.q('select count(*) as n from merch_orders')[0].n === 0, 'no Stripe call, nothing written');
  });
  await T('X-stickers', 'stickers are refused everywhere: quote, checkout, catalog, even with MERCH_PRODUCTS listing them; printHash refuses them too', async () => {
    const w = await world({ env: { MERCH_PRODUCTS: 'mug,tee,stickers' } });
    const st = { recipe: R[0], product: 'stickers', colour: 'white', pose: 'stand', qty: 1 };
    let r = await w.quote([st]); eq([r.status, r.json.error, r.json.why], [400, 'bad_line', 'product'], 'quote');
    r = await w.call('POST', '/merch/checkout', { country: 'US', lines: [st], expect_total: 1399 + 499, art_ver: PP.ART_VER, nonce: 'nonce-stk-1', agree: true }); eq([r.status, r.json.why], [400, 'product'], 'checkout');
    r = await w.call('GET', '/merch/catalog'); ok(!r.json.products.some((p) => p.id === 'stickers'), 'catalog');
    let threw = false; try { PP.printHash(DOG[0], { product: 'stickers' }); } catch (e) { threw = true; } ok(threw, 'PawPrint.printHash refuses stickers');
    const w2 = await world({ env: { MERCH_PRODUCTS: 'mug' } }); r = await w2.quote([tee(0)]); eq([r.status, r.json.why], [400, 'product'], 'a product not in MERCH_PRODUCTS');
  });
}
