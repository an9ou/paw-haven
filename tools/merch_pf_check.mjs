#!/usr/bin/env node
// The key-day kit for the merch printer (docs/design/merch/PART5.md, "The key-day kit"). PREPARED ONLY: run it the day the owner's Printful key
// exists. By default it is a DRY RUN: it prints every call it would make and changes nothing. With --run it makes the read-mostly checks below
// and records each real reply as a fixture (buyer-like data replaced by invented values, secrets removed), so the merch suite can then run
// against truly recorded replies.
//
// The key: this script never reads, asks for or prints a key. With --run it goes either
//   - through the session's credential proxy (the default base https://api.printful.com): it sends a placeholder Authorization header that the
//     proxy replaces with the stored key (Node's fetch uses the proxy with NODE_USE_ENV_PROXY=1), or
//   - through a relay that adds the key itself (--base <https URL>, e.g. a test Worker route): no Authorization header is sent.
//
// It NEVER confirms an order (there is no confirmation call in this file; the self-check below refuses to start if one appears). The one draft
// it makes (only with --file-url) is deleted again at once; drafts are not charged ("Orders with the draft status won't be charged").
//
//   node tools/merch_pf_check.mjs                          dry run: the plan
//   node tools/merch_pf_check.mjs --run [--store <id>] [--file-url <https URL of a print PNG>] [--reuse-check] [--base <URL>] [--out <dir>]
//
// Writes (with --run): cloudflare/merch/test/printful/recorded/<step>.json (or --out), and prints a short summary of what each check found.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PF_PRODUCTS, PF_VARIANT_IDS, PRODUCTS, SHIP_COSTS } from '../cloudflare/merch/catalog.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), has = (f) => args.includes(f), val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
if (has('--help') || has('-h')) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n')); process.exit(0); }
const RUN = has('--run'), BASE = (val('--base') || 'https://api.printful.com').replace(/\/+$/, ''), STORE = val('--store'), FILE_URL = val('--file-url'), REUSE = has('--reuse-check');
const OUT = val('--out') || path.join(ROOT, 'cloudflare', 'merch', 'test', 'printful', 'recorded');
const TODAY = new Date().toISOString().slice(0, 10), STAMP = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
if (!/^https:\/\//.test(BASE)) { console.error('merch_pf_check: --base must be an https URL'); process.exit(2); }
if (FILE_URL && !/^https:\/\//.test(FILE_URL)) { console.error('merch_pf_check: --file-url must be an https URL'); process.exit(2); }

// invented people and places only (never a buyer): one sample address per zone
const BUYER = { name: 'Test Buyer', address1: '1 Example Street', city: 'Exampleton' };
const SAMPLES = { US: { country_code: 'US', state_code: 'NY', city: 'New York', zip: '10001' }, JP: { country_code: 'JP', city: 'Tokyo', zip: '100-0001' },
  GB: { country_code: 'GB', city: 'London', zip: 'EC1A 1BB' }, DE: { country_code: 'DE', city: 'Berlin', zip: '10115' }, CA: { country_code: 'CA', state_code: 'ON', city: 'Toronto', zip: 'M5V 2T6' },
  AU: { country_code: 'AU', state_code: 'NSW', city: 'Sydney', zip: '2000' }, HK: { country_code: 'HK', city: 'Hong Kong' } };
const ZONE_OF = { US: 'us_jp', JP: 'us_jp', GB: 'uk_eu', DE: 'uk_eu', CA: 'ca_au_nz', AU: 'ca_au_nz', HK: 'world' };
const addr = (c) => Object.assign({}, BUYER, SAMPLES[c]);
const item = (vid, qty, url) => Object.assign({ source: 'catalog', catalog_variant_id: vid, quantity: qty }, url ? { placements: [{ placement: vid === PF_VARIANT_IDS['mug:white'] ? 'default' : 'front_large', technique: vid === PF_VARIANT_IDS['mug:white'] ? 'sublimation' : 'dtg', layers: [{ type: 'file', url }] }] } : {});
const MUG = PF_VARIANT_IDS['mug:white'], TEE = PF_VARIANT_IDS['tee:white:M'];
const EXT = 'pfcheck-' + STAMP; // 20 characters, within Printful's 32

// ---------- the plan: [name, method, path, body, why]; later steps can use earlier answers (ctx)
const plan = [];
const add = (name, method, p, body, why, opt) => plan.push(Object.assign({ name, method, path: p, body, why }, opt || {}));
add('stores', 'GET', '/v2/stores', null, 'the store: its id (for --store with an account-level token) and its currency (costs must be USD)');
for (const [prod, pid] of Object.entries(PF_PRODUCTS)) {
  add('product_' + pid, 'GET', '/v2/catalog-products/' + pid, null, prod + ': placements and techniques (mug: default / sublimation; tee: front_large / dtg)');
  add('variants_' + pid, 'GET', '/v2/catalog-products/' + pid + '/catalog-variants', null, prod + ': the catalog variant ids against catalog.js PF_VARIANT_IDS (v2 ids = v1 ids?)', { pages: true });
  for (const reg of ['north_america', 'uk', 'europe', 'japan', 'australia']) add('availability_' + pid + '_' + reg, 'GET', '/v2/catalog-products/' + pid + '/availability?selling_region_name=' + reg, null, prod + ': in stock in ' + reg + ' (US and UK must have every size we offer)', { pages: true });
  for (const reg of ['worldwide', 'north_america', 'uk', 'europe']) add('prices_' + pid + '_' + reg, 'GET', '/v2/catalog-products/' + pid + '/prices?selling_region_name=' + reg + '&currency=USD', null, prod + ': prices in ' + reg + ' against catalog.js costs (and whether front_large adds a fee as the only placement)', { pages: true });
}
for (const c of Object.keys(SAMPLES)) for (const [g, vid] of [['mug', MUG], ['tee', TEE]]) for (const q of [1, 2]) {
  add('rates_' + c + '_' + g + '_' + q, 'POST', '/v2/shipping-rates', { recipient: addr(c), order_items: [item(vid, q)], currency: 'USD' }, g + ' x' + q + ' to ' + c + ' (zone ' + ZONE_OF[c] + '): Standard rate and days against catalog.js SHIP_COSTS and ZONES eta');
}
add('order_missing', 'GET', '/v2/orders/@pfcheck-does-not-exist', null, 'the real 404 body of a GET by external id');
add('rates_bad_country', 'POST', '/v2/shipping-rates', { recipient: Object.assign(addr('US'), { country_code: 'ZZ' }), order_items: [item(MUG, 1)], currency: 'USD' }, 'the real error body of a refused address (problem details or the old shape?)');
if (FILE_URL || !RUN) {
  const u = FILE_URL || '<--file-url>';
  add('file_add', 'POST', '/v2/files', { url: u, visible: false }, 'add one print file by URL: does Printful fetch it now?');
  add('file_get', 'GET', '/v2/files/{file_id}', null, 'its status (waiting / ok / failed), width, height, dpi', { needs: 'file_id' });
  add('draft_create', 'POST', '/v2/orders', { external_id: EXT, shipping: 'STANDARD', recipient: Object.assign(addr('US'), { state_code: 'NY' }), order_items: [Object.assign(item(MUG, 1, u), { external_id: EXT + '_1', retail_price: '19.99', name: 'Mug with your dog' })], retail_costs: { currency: 'USD', discount: '0.00', shipping: '4.99', tax: '0.00' } },
    'ONE draft (never confirmed): its costs (subtotal, shipping, tax), calculation_status, the item ids');
  add('draft_get', 'GET', '/v2/orders/{order_id}', null, 'the draft again: costs done? (re-read up to 5 times, 2 s apart)', { needs: 'order_id', untilDone: true });
  add('draft_get_ext', 'GET', '/v2/orders/@' + EXT, null, 'GET by external id', { needs: 'order_id' });
  add('draft_patch', 'PATCH', '/v2/orders/{order_id}', { recipient: { address2: 'Unit 2' } }, 'PATCH the recipient (an address fix): the answer, and whether costs recalculate', { needs: 'order_id' });
  add('draft_delete', 'DELETE', '/v2/orders/{order_id}', null, 'delete the draft (204?)', { needs: 'order_id', cleanup: true });
  add('draft_after_delete', 'GET', '/v2/orders/@' + EXT, null, 'a deleted draft by external id: 404, or canceled? (question 21)', { needs: 'order_id' });
  add('draft_delete_again', 'DELETE', '/v2/orders/{order_id}', null, 'a second DELETE: what it answers (deleteDraft treats 404 and canceled as done)', { needs: 'order_id' });
  if (REUSE || !RUN) {
    add('reuse_create', 'POST', '/v2/orders', { external_id: EXT, shipping: 'STANDARD', recipient: Object.assign(addr('US'), { state_code: 'NY' }), order_items: [Object.assign(item(MUG, 1, u), { external_id: EXT + '_1' })] }, '(--reuse-check) the same external id after the delete: refused (OR-13) or a new draft? (question 21)', { needs: 'order_id', reuse: true });
    add('reuse_delete', 'DELETE', '/v2/orders/{reuse_id}', null, '(--reuse-check) delete that second draft if it was made', { needs: 'reuse_id', cleanup: true });
  }
  add('address_probe', 'POST', '/v2/orders', { external_id: EXT + '-a', recipient: Object.assign(addr('US'), { state_code: 'ZZ' }), order_items: [Object.assign(item(MUG, 1, u), { external_id: EXT + '-a_1' })] }, 'the real refusal of a bad address on create (deleted at once if Printful made it anyway)', { probe: true });
  add('address_probe_delete', 'DELETE', '/v2/orders/{probe_id}', null, 'delete the probe draft, only if it was made', { needs: 'probe_id', cleanup: true });
}
add('webhooks', 'GET', '/v2/webhooks', null, 'the webhook configuration: URL, events, expiry (secret and public key removed from the record)');
add('order_v1_missing', 'GET', '/orders/@pfcheck-does-not-exist', null, 'v1 (the late cancel uses v1 DELETE /orders/{id}): the same token works on v1');

// self-check: never a confirmation, never a v1 DELETE of anything (the late cancel is not tried with a real order)
for (const s of plan) if (/confirm/i.test(s.path) || (s.method === 'DELETE' && !s.path.startsWith('/v2/orders/{'))) { console.error('merch_pf_check: refusing to start: a step would confirm or cancel: ' + s.path); process.exit(3); }

// ---------- scrubbing: what is recorded never holds a person or a secret
const PERSON = { name: 'Test Buyer', company: '', address1: '1 Example Street', address2: '', city: 'Exampleton', zip: '00000', phone: '', email: '', tax_number: '' };
// an object with address1 is an address (a recipient, a store's return address): its person fields become the invented ones; emails anywhere
function scrub(x) {
  if (Array.isArray(x)) return x.map(scrub);
  if (x && typeof x === 'object') {
    const o = {}, isAddr = Object.prototype.hasOwnProperty.call(x, 'address1');
    for (const [k, v] of Object.entries(x)) o[k] = /secret|public_key|token|authorization/i.test(k) ? '<removed>' : isAddr && Object.prototype.hasOwnProperty.call(PERSON, k) && v != null ? PERSON[k] : scrub(v);
    return o;
  }
  if (typeof x === 'string') return x.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+/g, 'someone@example.test');
  return x;
}

function show(s) {
  console.log('- ' + s.name + ': ' + s.method + ' ' + BASE + s.path + (s.needs ? '   (uses ' + s.needs + ' from an earlier step)' : ''));
  console.log('    ' + s.why);
  if (s.body) console.log('    body: ' + JSON.stringify(s.body).slice(0, 300));
}

if (!RUN) {
  console.log('merch_pf_check: DRY RUN, nothing is sent (add --run on the key day). ' + plan.length + ' steps:');
  for (const s of plan) show(s);
  console.log('\nWith --run: replies are recorded in ' + path.relative(ROOT, OUT) + '/<step>.json; without --file-url the file and draft steps are left out.');
  console.log('Never confirms an order; the drafts it makes are deleted at once. The key is never read by this script.');
  process.exit(0);
}

// ---------- the run (key day only)
fs.mkdirSync(OUT, { recursive: true });
const ctx = {}, found = [];
const headersFor = (body) => Object.assign({ Accept: 'application/json' }, body ? { 'Content-Type': 'application/json' } : {}, BASE === 'https://api.printful.com' ? { Authorization: 'Bearer proxy-injects-the-key' } : {}, STORE ? { 'X-PF-Store-Id': STORE } : {});
async function send(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: headersFor(body), body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch (e) { json = { _text: text.slice(0, 500) }; }
  const h = {}; for (const k of ['retry-after', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'x-ratelimit-policy', 'content-type']) if (r.headers.get(k)) h[k] = r.headers.get(k);
  return { status: r.status, headers: h, body: json };
}
const fill = (p) => p.replace(/\{(\w+)\}/g, (m, k) => (ctx[k] != null ? encodeURIComponent(ctx[k]) : m));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const s of plan) {
  if (s.needs && ctx[s.needs] == null) { console.log('- ' + s.name + ': skipped (no ' + s.needs + ')'); continue; }
  const p = fill(s.path); let r = await send(s.method, p, s.body);
  if (s.pages && r.status === 200 && r.body && r.body.paging) { // follow pages (records them together)
    const all = [].concat(r.body.data || []); let off = Number(r.body.paging.offset || 0) + Number(r.body.paging.limit || 20);
    for (let i = 0; i < 30 && Number(r.body.paging.total) > off; i++) { const n = await send('GET', p + (p.includes('?') ? '&' : '?') + 'offset=' + off); if (n.status !== 200) break; [].push.apply(all, n.body.data || []); off += Number(n.body.paging.limit || 20); }
    if (Array.isArray(r.body.data)) r.body.data = all;
  }
  for (let i = 0; s.untilDone && i < 5 && r.body && r.body.data && r.body.data.costs && r.body.data.costs.calculation_status === 'calculating'; i++) { await sleep(2000); r = await send(s.method, p, s.body); }
  const d = r.body && r.body.data;
  if (s.name === 'file_add' && d && d.id) ctx.file_id = d.id;
  if (s.name === 'draft_create' && d && d.id) ctx.order_id = d.id;
  if (s.reuse && d && d.id) ctx.reuse_id = d.id;
  if (s.probe && d && d.id) ctx.probe_id = d.id;
  if (s.cleanup && (r.status === 204 || r.status === 200)) { if (s.needs === 'reuse_id') delete ctx.reuse_id; if (s.needs === 'probe_id') delete ctx.probe_id; if (s.name === 'draft_delete') ctx.order_deleted = true; }
  fs.writeFileSync(path.join(OUT, s.name + '.json'), JSON.stringify({ _source: { url: 'https://api.printful.com' + s.path, read: TODAY, recorded: 'key', note: s.why }, request: { method: s.method, path: s.path }, status: r.status, headers: r.headers, body: scrub(r.body) }, null, 1) + '\n');
  console.log('- ' + s.name + ': ' + r.status);
  if (s.name.startsWith('variants_') && Array.isArray(d)) {
    const ids = new Set(d.map((v) => v.id)), want = Object.entries(PF_VARIANT_IDS).filter(([k]) => PF_PRODUCTS[k.split(':')[0]] === Number(s.path.split('/')[3]));
    const miss = want.filter(([, id]) => !ids.has(id)).map(([k]) => k); found.push(s.name + ': ' + (miss.length ? 'NOT in v2: ' + miss.join(', ') : 'every id of catalog.js is a v2 catalog variant'));
  }
  if (s.name.startsWith('rates_') && s.name !== 'rates_bad_country' && Array.isArray(d)) {
    const [, c, g, q] = s.name.split('_'), st = d.find((x) => x.shipping === 'STANDARD') || d[0]; found.push(s.name + ': ' + (st ? st.rate + ' ' + st.currency + ' (' + (st.min_delivery_days || '?') + '-' + (st.max_delivery_days || '?') + ' days)' : 'no rate') + '; catalog.js ' + JSON.stringify((SHIP_COSTS[{ US: 'us', JP: 'jp', GB: 'uk', DE: 'eu', CA: 'ca', AU: 'au', HK: 'row' }[c]] || {})[g]) + ' for x' + q);
  }
  if (s.name.startsWith('prices_') && d && d.variants) found.push(s.name + ': ' + d.variants.slice(0, 2).map((v) => v.id + ' ' + JSON.stringify((v.techniques || []).map((t) => t.technique_key + ' ' + t.price))).join('; ') + ' (catalog.js mug ' + PRODUCTS.mug.cost + ', tee ' + PRODUCTS.tee.cost + ' cents)');
}
if ((ctx.order_id && !ctx.order_deleted) || ctx.reuse_id || ctx.probe_id) console.log('\nWARNING: a draft may be left at Printful (' + [ctx.order_deleted ? null : ctx.order_id, ctx.reuse_id, ctx.probe_id].filter(Boolean).join(', ') + '): delete it in the dashboard (drafts are never charged).');
console.log('\nFound:'); for (const f of found) console.log('  ' + f);
console.log('\nRecorded in ' + path.relative(ROOT, OUT) + '. Next: compare them with test/printful/*.json (PART5.md, "The key-day kit"), then re-run the suite.');
