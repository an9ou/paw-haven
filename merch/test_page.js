// Suite merch_page: the /merch page of doodledoggo.app in TEST MODE (site/merch/, docs/design/merch/PART2.md).
//   NODE_PATH=$(npm root -g) node merch/test_page.js            all checks (Playwright's Chromium; this file serves site/ itself)
//   SHOTS=1 NODE_PATH=$(npm root -g) node merch/test_page.js    also writes the owner's screenshots to docs/design/merch/part2_shots/ (dpr 2)
//   SHOTS6=1 NODE_PATH=$(npm root -g) node merch/test_page.js   only writes the part 6 pictures: order states and every email (part6_shots/)
//   P9=1 NODE_PATH=$(npm root -g) node merch/test_page.js       only the part 9 review checks and the order states
//   LOOK=<dir> ...                                            also writes the review pictures (a dropped line, a name that can't print, an
//                                                               error, the order page after the hour, the "Ship to" list) at 360, 390 and 1280
// Covers: the fake on its own, with answers of exactly the TRANSACTIONS.md 6.3 fields; 32 baskets in every zone priced by hand from SHIPPING.md
// (the page and the fake against the hand table: $34.99 pays shipping, $35.00 ships free, the extra-item fee, bigger tee sizes, 6 lines of 3);
// dogs from a save, a link, none, and a game name the print can't draw; every step; add, change (the preview after Change), remove; the 6-line
// and 3-each limits; a stale and a hostile stored basket; every error code's words; one nonce per basket; the order page without recipes and
// after the hour; two tabs; Back/Forward and deep links; the footer "Questions" link; "Ship to" named by the browser and sorted; the page
// against a live-style api that answers exactly the 6.3 fields; contrast (4.5:1, ink for money and legal lines); no stickers; Pay never
// navigates; the game save and pawhaven_cloud_v1 never written; no console errors, no dialogs; no request leaves the origin; the fit at
// 360x640, 390x844 and 1280x720.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = path.join(ROOT, 'site'), BRAND = path.join(ROOT, 'brand');
const HTML = fs.readFileSync(path.join(SITE, 'merch', 'index.html'), 'utf8');
const PP_SRC = (/src="\/merch\/(print\/pp1-[0-9a-z]+\/pawprint\.js)"/.exec(HTML) || [])[1];
if (!PP_SRC || !fs.existsSync(path.join(SITE, 'merch', PP_SRC))) { console.error('site/merch has no PawPrint build: run NODE_PATH=$(npm root -g) node tools/merch_build.js'); process.exit(1); }
const P = require(path.join(SITE, 'merch', PP_SRC)), MerchFake = require(path.join(SITE, 'merch', 'api_fake.js'));
const CAT = JSON.parse(fs.readFileSync(path.join(SITE, 'merch', 'catalog.json'), 'utf8'));
const API_JS = fs.readFileSync(path.join(SITE, 'merch', 'api.js'), 'utf8'), MERCH_JS = fs.readFileSync(path.join(SITE, 'merch', 'merch.js'), 'utf8');
// the line of api.js that picks the order server (part 9, P1); the live-style checks point it at this file's own /live server
const LIVE_LINE = 'var MERCH_API = apiFor(G.location && G.location.origin);';
if (!API_JS.includes(LIVE_LINE)) { console.error('site/merch/api.js no longer has the line: ' + LIVE_LINE); process.exit(1); }
let CATJS = null; // cloudflare/merch/catalog.js (an ES module), loaded in main
// a fixed clock for the order page (the cancel time, "same day", the posting date): local noon, far from midnight (review row T)
const FIX = new Date(2026, 11, 1, 12, 0).getTime();
const SHOTS6 = process.env.SHOTS6 === '1'; // only the part 6 pictures (docs/design/merch/part6_shots/), no checks
const P9 = process.env.P9 === '1'; // only the part 9 review checks and the order states (a quick run, or to see them fail on an older page)
const SHOTS = process.env.SHOTS === '1', SHOT_DIR = path.join(ROOT, 'docs', 'design', 'merch', 'part2_shots'), LOOK = process.env.LOOK || '';
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright is needed (NODE_PATH=$(npm root -g))'); process.exit(1); }

let pass = 0, fail = 0; const fails = [];
function ok(name, cond, detail) { if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ': ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); console.log('FAIL ' + name, detail !== undefined ? detail : ''); } }
const money = (c) => '$' + (c / 100).toFixed(2);
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---- the catalog variants: the real one, one with prices on the free-shipping edges, one with the UK and two EU countries open
const CAT_EDGE = clone(CAT); CAT_EDGE.products[0].price = 3499; CAT_EDGE.products[1].price = 3500;
const CAT_UKEU = clone(CAT); CAT_UKEU.countries.forEach((c) => { if (['GB', 'DE', 'FR'].includes(c.code)) c.soon = false; });
const CATS = { real: CAT, edge: CAT_EDGE, ukeu: CAT_UKEU };

// ---- the site, served as the web root (the brand icons at the root, as tools/cf_site.js serves them); /live/merch/* is a live-style order
//      server for one test (the fake behind real HTTP, answering exactly the 6.3 fields)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const LIVE = MerchFake({ PawPrint: P, catalog: CAT }); const liveLog = [];
function live(q, s, p) {
  let body = ''; q.on('data', (c) => { body += c; }); q.on('end', () => {
    const send = (st, j) => { s.writeHead(st, { 'content-type': 'application/json' }); s.end(JSON.stringify(j)); };
    const fail2 = (e) => send(e.status || 503, Object.assign({}, e, { status: undefined }));
    let b = null; try { b = body ? JSON.parse(body) : null; } catch (e) { return send(400, { error: 'bad_line' }); }
    liveLog.push(q.method + ' ' + p);
    let m;
    if (q.method === 'GET' && p === '/live/merch/catalog') return LIVE.catalog().then((c) => send(200, c), fail2);
    if (q.method === 'POST' && p === '/live/merch/quote') return LIVE.quote(b).then((x) => send(200, x), fail2);
    if (q.method === 'POST' && p === '/live/merch/checkout') return LIVE.checkout(b).then((x) => send(200, x), fail2);
    if (q.method === 'GET' && (m = /^\/live\/merch\/order\/([A-Za-z0-9_-]+)$/.exec(p))) return LIVE.order(m[1]).then((x) => send(200, x), fail2);
    send(404, { error: 'not_found' });
  });
}
const server = http.createServer((q, s) => {
  const p = decodeURIComponent(q.url.split(/[?#]/)[0]);
  if (p.startsWith('/live/merch/')) return live(q, s, p);
  let f = /^\/(favicon\.svg|icon-\d+\.png|doodle-doggo-(icon|logo)\.svg|site\.webmanifest)$/.test(p) ? path.join(BRAND, p) : path.join(SITE, p);
  if (!f.startsWith(SITE) && !f.startsWith(BRAND)) { s.writeHead(403); return s.end(); }
  try { if (fs.statSync(f).isDirectory()) { if (!p.endsWith('/')) { s.writeHead(301, { location: p + '/' }); return s.end(); } f = path.join(f, 'index.html'); } } catch (e) { if (fs.existsSync(f + '.html')) f += '.html'; }
  fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(b); });
});

// ---- test dogs: a save with five dogs (an adult in two pieces, an active 3-month puppy, a sparkly 20-letter name, a newborn, a black Lab)
const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const G = (c) => P.genesFrom(c);
const SAVE = JSON.stringify({ v: 1, activeId: 'd2', coins: 120, dogs: [
  { id: 'd1', key: 'corgi', genes: G('221100a2'), artSeed: 12345, born: day(40), sex: 'male', name: 'Biscuit', outfit: { head: 'Party Hat', neck: 'Red Bandana' } },
  { id: 'd2', key: 'shiba', genes: G('220200'), artSeed: 999, born: day(3), sex: 'female', name: 'Mochi', outfit: {} },
  { id: 'd3', key: 'golden', genes: G('220200'), artSeed: 77, born: day(60), sex: 'female', name: 'Sir Wigglesworth III', sparkle: true, outfit: { head: 'Flower Crown', body: 'Superhero Cape' } },
  { id: 'd4', key: 'beagle', artSeed: 5, born: day(0), sex: 'female', name: 'Bo' },
  { id: 'd5', key: 'lab', genes: G('222200'), artSeed: 3, born: day(90), sex: 'male', name: 'Pepper' }] });
// game names the print font can't draw: an emoji, kana, and a word it won't print (kept out of this file as plain text)
const ROT = (s) => s.replace(/[a-z]/g, (ch) => String.fromCharCode((ch.charCodeAt(0) - 84) % 26 + 97));
const SAVE_NONAME = JSON.stringify({ v: 1, activeId: 'n1', dogs: [
  { id: 'n1', key: 'shiba', genes: G('220200'), artSeed: 41, born: day(80), sex: 'female', name: 'ポチ', outfit: {} },
  { id: 'n2', key: 'pug', artSeed: 42, born: day(80), sex: 'male', name: 'Pochi 🐶' },
  { id: 'n3', key: 'corgi', artSeed: 43, born: day(80), sex: 'male', name: ROT('shpx') },
  { id: 'n4', key: 'beagle', artSeed: 44, born: day(80), sex: 'female', name: 'Daisy' }] });
const NOSAY = "We can't draw these letters yet. Print without the name, or type one we can draw.";
const FROM_SAVE = P.merchFromSave(SAVE, { today: new Date() }).dogs; // Biscuit, Mochi, Sir Wigglesworth III, Bo, Pepper (page order: Mochi first, the active one)
const R = (name) => FROM_SAVE.find((d) => d.name === name).recipe;
const enc = (r) => P.merchEncode([r]);
const line = (r, product, o) => Object.assign({ id: 'x' + Math.random().toString(36).slice(2, 8), recipe: enc(r), product, colour: 'white', size: product === 'tee' ? 'M' : null, pose: 'stand', name_on: !!r.n, qty: 1 }, o || {});
const apiL = (l) => ({ recipe: l.recipe, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on, qty: l.qty });
const D = ['Biscuit', 'Mochi', 'Sir Wigglesworth III', 'Bo', 'Pepper'].map(R);
const NORMAL3 = [line(R('Mochi'), 'tee', { colour: 'navy' }), line(R('Biscuit'), 'mug', { pose: 'sit' }), line(R('Sir Wigglesworth III'), 'tee', { size: 'L', pose: 'happy' })]; // $73.97, ships free in the US

// ---- the hand table: every total worked out by hand from SHIPPING.md model C (mug $19.99, tee $26.99, 2XL +$2, 3XL +$4, 4XL +$6;
//      USA/Japan $4.99, free from $35; UK/EU $5.99, free from $70; Canada/Australia/NZ $7.99, free from $70; everywhere else $11.99
//      + $5.99 per extra mug or tee, never free). "edge" prices the mug at $34.99 and the tee at $35.00. [country, catalog, lines, sub, ship, total]
const T = (d, p, o) => line(D[d], p, o);
const SIX3 = () => [T(0, 'mug', { qty: 3 }), T(1, 'mug', { qty: 3 }), T(3, 'tee', { qty: 3 }), T(4, 'tee', { size: '2XL', qty: 3 }), T(0, 'tee', { colour: 'black', size: '3XL', qty: 3 }), T(1, 'tee', { size: '4XL', qty: 3 })];
const HAND = [
  ['US', 'real', [T(0, 'mug')], 1999, 499, 2498],
  ['US', 'real', [T(1, 'tee')], 2699, 499, 3198],
  ['US', 'real', [T(2, 'tee', { size: '4XL' })], 3299, 499, 3798],
  ['US', 'real', [T(0, 'mug', { qty: 2 })], 3998, 0, 3998],
  ['US', 'real', [T(0, 'mug'), T(1, 'tee')], 4698, 0, 4698],
  ['JP', 'real', [T(3, 'mug')], 1999, 499, 2498],
  ['JP', 'real', [T(1, 'tee', { colour: 'navy', size: '2XL' })], 2899, 499, 3398],
  ['JP', 'real', [T(4, 'tee', { colour: 'black', size: '3XL' })], 3099, 499, 3598],
  ['CA', 'real', [T(0, 'mug')], 1999, 799, 2798],
  ['CA', 'real', [T(0, 'mug', { qty: 3 })], 5997, 799, 6796],
  ['CA', 'real', [T(1, 'tee', { qty: 2 }), T(2, 'mug')], 7397, 0, 7397],
  ['AU', 'real', [T(2, 'tee', { size: '3XL', qty: 2 })], 6198, 799, 6997],
  ['AU', 'real', [T(1, 'tee', { size: 'L' }), T(4, 'tee', { colour: 'black', size: '4XL' })], 5998, 799, 6797],
  ['NZ', 'real', [T(1, 'tee'), T(0, 'mug', { qty: 2 })], 6697, 799, 7496],
  ['NZ', 'real', [T(0, 'mug', { qty: 2 }), T(3, 'tee', { size: '2XL' })], 6897, 799, 7696],
  ['NZ', 'real', [T(2, 'tee', { size: '3XL' }), T(4, 'mug', { qty: 2 })], 7097, 0, 7097],
  ['HK', 'real', [T(0, 'mug')], 1999, 1199, 3198],
  ['HK', 'real', [T(0, 'mug', { qty: 2 })], 3998, 1798, 5796],
  ['MX', 'real', [T(3, 'tee', { colour: 'ice-blue', size: 'XS' })], 2699, 1199, 3898],
  ['NO', 'real', [T(0, 'mug', { qty: 3 }), T(1, 'tee', { size: '4XL', qty: 3 })], 15894, 4194, 20088],
  ['VC', 'real', SIX3(), 47982, 11382, 59364],
  ['US', 'real', SIX3(), 47982, 0, 47982],
  ['CA', 'real', SIX3(), 47982, 0, 47982],
  ['US', 'edge', [T(0, 'mug')], 3499, 499, 3998],
  ['US', 'edge', [T(1, 'tee')], 3500, 0, 3500],
  ['JP', 'edge', [T(1, 'tee', { size: '2XL' })], 3700, 0, 3700],
  ['CA', 'edge', [T(0, 'mug', { qty: 2 })], 6998, 799, 7797],
  ['CA', 'edge', [T(1, 'tee', { qty: 2 })], 7000, 0, 7000],
  ['HK', 'edge', [T(1, 'tee', { qty: 2 })], 7000, 1798, 8798],
  ['GB', 'ukeu', [T(0, 'mug')], 1999, 599, 2598],
  ['DE', 'ukeu', [T(1, 'tee', { qty: 2 }), T(0, 'mug')], 7397, 0, 7397],
  ['FR', 'ukeu', [T(0, 'mug', { qty: 3 })], 5997, 599, 6596]];

// ---- the exact field lists of TRANSACTIONS.md 6.3 (with the note of 24 Nov 2026)
const F_CAT = ['art_vers', 'cat_ver', 'countries', 'max_lines', 'max_qty', 'products', 'shut', 'sold_out_today', 'zones'];
const F_PROD = ['colours', 'id', 'on', 'poses', 'price', 'sizes'], F_ZONE = ['eta', 'extra', 'fee', 'free_from', 'id', 'notes'], F_CTRY = ['code', 'soon', 'zone'];
// GET /merch/order/:id (6.3 with the part 6 note of 25 Nov 2026: pay_pending, gift_name, dispute; lines carry reprint_of; resting only when set)
// (and the part 6 review note of 25 Nov 2026: ship_by, late_eta, late_ok, gift)
const F_ORDER = ['can_cancel', 'cancel_until', 'country', 'dispute', 'gift', 'gift_code', 'gift_name', 'hold', 'id', 'late', 'late_eta', 'late_ok', 'lines', 'paid_at', 'parcels', 'pay_pending', 'pres', 'ship_by', 'status', 'totals'];
const F_OLINE = ['colour', 'line', 'name', 'name_on', 'parcel', 'pose', 'product', 'qty', 'recipe', 'refunded_qty', 'reprint_of', 'size', 'status', 'unit'], F_OPARCEL = ['carrier', 'delivered_at', 'id', 'product', 'shipped_at', 'tracking_url'];
const F_QUOTE = ['cat_ver', 'eta', 'free_from', 'lines', 'notes', 'ship_fee', 'shut', 'subtotal', 'total', 'zone'], F_QLINE = ['line', 'qty', 'total', 'unit'];
const keys = (o) => Object.keys(o).sort().join();
const NOTE_CODES = ['import_tax', 'vat_included', 'separate_parcels'];

let BASE, browser;
// one page in a fresh context: { save, basket (array or a raw string), ship, path, vp, dpr, lang, catalog, live, link }
async function open(o) {
  o = o || {};
  const vp = o.vp || [390, 844];
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: o.dpr || 1, locale: o.lang || 'en-US' });
  if (P9) ctx.setDefaultTimeout(5000);
  if (o.clock) await ctx.clock.setFixedTime(o.clock);
  if (o.catalog) await ctx.route('**/merch/catalog.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o.catalog) }));
  if (o.live) await ctx.route('**/merch/api.js', (r) => r.fulfill({ contentType: 'text/javascript', body: API_JS.replace(LIVE_LINE, "var MERCH_API = '" + BASE + "/live';") }));
  await ctx.addInitScript((seed) => {
    if (!localStorage.getItem('__seeded')) { // once per context: a second tab or a reload never seeds again
      localStorage.setItem('__seeded', '1');
      if (seed.save) localStorage.setItem('pawhaven_proto_v1', seed.save);
      if (seed.basket) localStorage.setItem('dd_merch_basket_v1', seed.basket);
      if (seed.ship) localStorage.setItem('dd_merch_ship_v1', seed.ship);
    }
    // from here on, every storage write the page makes is recorded
    const W = window.__writes = [], S = Storage.prototype, set = S.setItem, rem = S.removeItem, clr = S.clear;
    S.setItem = function (k, v) { W.push(['set', k]); return set.call(this, k, v); };
    S.removeItem = function (k) { W.push(['remove', k]); return rem.call(this, k); };
    S.clear = function () { W.push(['clear', '*']); return clr.call(this); };
  }, { save: o.save || '', basket: o.basket ? (typeof o.basket === 'string' ? o.basket : JSON.stringify(o.basket)) : '', ship: o.ship || '' });
  const t = await tab(ctx, o.path || '/merch/', o);
  t.ctx = ctx; return t;
}
async function tab(ctx, p, o) {
  const page = await ctx.newPage();
  const errors = [], outside = [], navs = [], dialogs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !(o && o.live && /status of (503|403|409|400)/.test(m.text()))) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
  page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) outside.push(r.url()); });
  page.on('response', (r) => { if (r.status() >= 400 && !(o && o.live && r.url().includes('/live/merch/'))) errors.push(r.status() + ' ' + r.url()); });
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs.push(f.url()); });
  await page.goto(BASE + p);
  await page.waitForSelector('html.merch-ready', { timeout: 20000 });
  return { page, errors, outside, navs, dialogs, ctx };
}
const tap = async (page, sel) => { await page.click(sel); await page.waitForTimeout(60); };
const toHash = async (page, h) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(80); };
const setShip = async (page, code) => { await page.selectOption('#shipSel', code); await page.waitForTimeout(80); };
const view = (page) => page.evaluate(() => (document.querySelector('.mview.on') || {}).dataset.view);
const hash = (page) => page.evaluate(() => location.hash);
const text = (page, sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
const itext = (page, sel) => page.$eval(sel, (e) => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => ''); // as read: blocks apart
const settle = (page) => page.waitForTimeout(120);
// the page's preview against PawPrint.print() from Node, both parsed by the same browser (so only the drawing can differ)
async function previewIs(page, sel, recipe, o) {
  const want = P.print(recipe, o);
  return page.evaluate(([sel, want]) => {
    const t = document.createElement('template'); t.innerHTML = want; const w = t.content.firstElementChild.outerHTML;
    const g = document.querySelector(sel); return !!g && g.outerHTML === w;
  }, [sel, want]);
}
async function finish(name, t, o) {
  ok(name + ': no console errors', t.errors.length === 0, t.errors.slice(0, 3));
  ok(name + ': no request left the origin', t.outside.length === 0, t.outside.slice(0, 3));
  ok(name + ': no dialog opened', t.dialogs.length === 0, t.dialogs);
  const w = await t.page.evaluate(() => window.__writes).catch(() => []);
  ok(name + ': the game save and the cloud bookkeeping were never written', !w.some((x) => x[1] === 'pawhaven_proto_v1' || x[1] === 'pawhaven_cloud_v1' || x[0] === 'clear'), w);
  if (!(o && o.keep)) await t.ctx.close();
}

// ================= the fake api on its own (Node) =================
async function fakeChecks() {
  const F = MerchFake({ PawPrint: P, catalog: CAT }), FD = MerchFake({ PawPrint: P, catalog: CAT, demo: true });
  const c = await F.catalog();
  ok('fake: catalog has the mug and the tee only (no stickers)', c.products.map((p) => p.id).join() === 'mug,tee');
  ok('fake: catalog has exactly the 6.3 fields', keys(c) === F_CAT.join() && c.products.every((p) => keys(p) === F_PROD.join()) && c.zones.every((z) => keys(z) === F_ZONE.join()) && c.countries.every((x) => keys(x) === F_CTRY.join()),
    { cat: keys(c), country: keys(c.countries[0]) });
  ok('catalog.json has exactly the 6.3 fields', keys(CAT) === F_CAT.join() && CAT.countries.every((x) => keys(x) === F_CTRY.join() && typeof x.soon === 'boolean'));
  ok('catalog: no names, no sentences (codes only)', !CAT.countries.some((x) => 'name' in x) && CAT.zones.every((z) => z.notes.every((n) => NOTE_CODES.includes(n))) && !/[a-z] [a-z]+ [a-z]/i.test(JSON.stringify(CAT)));
  // catalog.json is written from cloudflare/merch/catalog.js (tools/merch_catalog_json.js; the merch_worker suite checks they are equal): the
  // Worker's zoneNotes(), so no vat_included while no UK or EU registration is live (catalog.js REGISTERED is empty at launch)
  ok('catalog: no vat_included while not registered, everywhere else import_tax', CAT.zones.find((z) => z.id === 'uk_eu').notes.join() === (Object.keys(CATJS.REGISTERED).length ? 'vat_included' : '') && CAT.zones.find((z) => z.id === 'world').notes.join() === 'import_tax');
  ok('catalog: delivery times are catalog.js ZONES eta', CAT.zones.every((z) => JSON.stringify(z.eta) === JSON.stringify(CATJS.ZONES[z.id].eta)), CAT.zones.map((z) => z.eta));
  ok('the page\'s posting promise is catalog.js SHIP_BY_DAYS (' + CATJS.SHIP_BY_DAYS + ')', new RegExp("var SHIP_BY_DAYS = " + CATJS.SHIP_BY_DAYS + ",").test(MERCH_JS) && HTML.includes('we post every order within ' + CATJS.SHIP_BY_DAYS + ' working days of payment'));
  ok('fake: catalog shape', c.max_lines === 6 && c.max_qty === 3 && c.shut === true && c.art_vers[0] === P.ART_VER);
  ok('fake: prices from SHIPPING.md model C', c.products[0].price === 1999 && c.products[1].price === 2699 && c.zones.find((z) => z.id === 'us_jp').fee === 499 && c.zones.find((z) => z.id === 'us_jp').free_from === 3500 && c.zones.find((z) => z.id === 'world').free_from === null);
  ok('fake: tee colours and sizes are PawPrint\'s', c.products[1].colours.every((x) => { const T2 = P.TEE_COLOURS.find((y) => y.id === x.id); return T2 && x.sizes.join() === T2.sizes.both.join(); }) && c.products[1].colours.length === P.TEE_COLOURS.length);
  ok('fake: never-countries are not listed', !['RU', 'BY', 'IR', 'KP', 'CU', 'SY', 'UA', 'VE', 'EC', 'PS'].some((k) => c.countries.some((x) => x.code === k)));
  ok('fake: the UK and the EU are coming soon', ['GB', 'DE', 'FR', 'BR', 'KR'].every((k) => c.countries.find((x) => x.code === k).soon === true) && c.countries.find((x) => x.code === 'US').soon === false);
  const L1 = line(R('Mochi'), 'mug'), L2 = line(R('Biscuit'), 'tee', { colour: 'navy', size: '2XL', qty: 2 });
  const q = await F.quote({ country: 'US', lines: [apiL(L1), apiL(L2)] });
  ok('fake: a quote has exactly the 6.3 fields, shut: true while shut', keys(q) === F_QUOTE.join() && q.lines.every((l) => keys(l) === F_QLINE.join()) && q.shut === true, keys(q));
  ok('fake: quote numbers', q.subtotal === 1999 + 2 * 2899 && q.ship_fee === 0 && q.total === q.subtotal && q.lines[1].unit === 2899 && q.notes.includes('separate_parcels'), q);
  const q2 = await F.quote({ country: 'HK', lines: [apiL(L1), apiL(L2)] });
  ok('fake: everywhere else pays $11.99 + $5.99 each extra', q2.ship_fee === 1199 + 2 * 599 && q2.free_from === null && q2.notes.includes('import_tax'), q2);
  const err = async (p) => p.then(() => null, (e) => e);
  ok('fake: bad country', (await err(F.quote({ country: 'ZZ', lines: [apiL(L1)] }))).error === 'bad_country');
  ok('fake: a country coming soon is 403 country_closed', (await err(F.quote({ country: 'GB', lines: [apiL(L1)] }))).status === 403);
  ok('fake: 7 lines is too many', (await err(F.quote({ country: 'US', lines: Array(7).fill(apiL(L1)) }))).error === 'too_many');
  ok('fake: qty 4 refused', (await err(F.quote({ country: 'US', lines: [Object.assign(apiL(L1), { qty: 4 })] }))).error === 'bad_qty');
  ok('fake: stickers are not on sale', (await err(F.quote({ country: 'US', lines: [Object.assign(apiL(L1), { product: 'stickers' })] }))).error === 'variant_off');
  ok('fake: a size the colour lacks', (await err(F.quote({ country: 'US', lines: [Object.assign(apiL(L2), { colour: 'pink', size: '4XL' })] }))).error === 'bad_line');
  const longMug = enc(Object.assign({}, R('Mochi'), { n: 'WWWWWWWWWWWWWWWWWWWW' }));
  ok('fake: a name too long for the mug', (await err(F.quote({ country: 'US', lines: [Object.assign(apiL(L1), { recipe: longMug })] }))).error === 'bad_name');
  const body = { country: 'US', lines: [apiL(L1)], expect_total: 2498, art_ver: P.ART_VER, nonce: 'abcdefgh12', agree: true, lang: 'en' };
  ok('fake: checkout while shut is 503 merch_closed', (await err(F.checkout(body))).error === 'merch_closed');
  ok('fake: checkout needs agree', (await err(F.checkout(Object.assign({}, body, { agree: false })))).error === 'no_agree');
  ok('fake: checkout checks the total', (await err(F.checkout(Object.assign({}, body, { expect_total: 2000 })))).error === 'price_changed');
  ok('fake: checkout checks the art version', (await err(F.checkout(Object.assign({}, body, { art_ver: 'pp1-00000000' })))).error === 'art_changed');
  ok('fake: no test orders without demo', (await err(F.demoPay(body))).status === 403);
  const d = await FD.demoPay(body), o = await FD.order(d.order);
  ok('fake: a demo order reads back', o.totals.total === 2498 && o.can_cancel === true && o.lines[0].name === 'Mochi' && o.gift_code === null);
  ok('fake: an order has exactly the 6.3 fields (with the part 6 note)', keys(o) === F_ORDER.join() && o.lines.every((l) => keys(l) === F_OLINE.join()) && keys(o.totals) === 'refunded,ship_fee,subtotal,tax,total', keys(o));
  FD.put({ id: 'mo_P6fake', status: 'held', hold: 'address', country: 'US', cancel_until: 0, lines: [{ line: 1, product: 'mug', qty: 1, unit: 1999, status: 'drafted' }], parcels: [{ id: 'p', product: 'mug', carrier: 'X', tracking_url: 'https://t.example/', shipped_at: 1, delivered_at: null, extra: 1 }], totals: { total: 2498 }, junk: 1, _fail: { address: 'busy' } });
  const pf = await FD.order('mo_P6fake'); ok('fake: whatever was stored, the same field set', keys(pf) === F_ORDER.join() && keys(pf.lines[0]) === F_OLINE.join() && keys(pf.parcels[0]) === F_OPARCEL.join() && pf.can_cancel === false, keys(pf));
  const AD = { name: 'Pat', line1: '1 Lane', city: 'Town', postal: '123', country: 'US' };
  ok('fake: address errors as the Worker', (await err(FD.address('mo_P6fake', Object.assign({}, AD, { city: '' })))).field === 'city' && (await err(FD.address('mo_P6fake', Object.assign({}, AD, { country: 'CA' })))).error === 'other_country' && (await err(FD.address('mo_P6fake', AD))).error === 'busy');
  ok('fake: address accepted, then not needed', (await FD.address('mo_P6fake', AD)).ok === true && (await FD.order('mo_P6fake')).status === 'paid' && (await err(FD.address('mo_P6fake', AD))).error === 'not_needed' && !JSON.stringify(await FD.order('mo_P6fake')).includes('1 Lane'));
  ok('fake: refund instead only while held for an address', (await err(FD.refundHeld('mo_P6fake'))).error === 'not_allowed');
  FD.put({ id: 'mo_P6late', status: 'part_shipped', late: true, country: 'US', lines: [{ line: 1, product: 'mug', qty: 1, unit: 1999, status: 'shipped' }, { line: 2, product: 'tee', qty: 1, unit: 2699, status: 'in_production' }], totals: { total: 4698 } });
  ok('fake: the late cancel refunds what was not sent', (await FD.cancel('mo_P6late', { scope: 'late' })).status === 'shipped' && (await FD.order('mo_P6late')).totals.refunded === 2699 && (await FD.order('mo_P6late')).late === false && (await err(FD.cancel('mo_P6late', { scope: 'late' }))).error === 'not_late');
  ok('fake: cancel in the hour', (await FD.cancel(d.order, { scope: 'order' })).status === 'cancelled' && (await FD.order(d.order)).status === 'cancelled');
  ok('fake: unknown order 404', (await err(FD.order('mo_nope'))).status === 404);
  // the hand table against the fake
  for (const [i, [cc, cv, lines, sub, ship, total]] of HAND.entries()) {
    const Fx = MerchFake({ PawPrint: P, catalog: CATS[cv] }), x = await Fx.quote({ country: cc, lines: lines.map(apiL) }).catch((e) => e);
    ok('hand ' + (i + 1) + ' (' + cc + ', ' + cv + '): the fake = the hand table', x.subtotal === sub && x.ship_fee === ship && x.total === total && x.lines.reduce((n, l) => n + l.total, 0) === sub, { got: [x.subtotal, x.ship_fee, x.total], want: [sub, ship, total] });
  }
  ok('hand table: at least 24 baskets, every zone', HAND.length >= 24 && ['us_jp', 'uk_eu', 'ca_au_nz', 'world'].every((z) => HAND.some((h) => CATS[h[1]].countries.find((c) => c.code === h[0]).zone === z)));
  ok('hand table: $34.99 pays shipping, $35.00 ships free', HAND.some((h) => h[3] === 3499 && h[4] === 499) && HAND.some((h) => h[3] === 3500 && h[4] === 0));
}

// ================= the page =================
async function pageChecks() {
  // ---- dogs from the save, and every step
  let t = await open({ save: SAVE });
  let pg = t.page;
  ok('home: the landing shows', (await view(pg)) === 'home' && /Put your dog on a mug/.test(await text(pg, '#h-home')));
  ok('home: two products, no stickers', (await pg.$$eval('#trio li', (l) => l.length)) === 2 && !/sticker/i.test(await pg.evaluate(() => document.body.innerText)));
  ok('home: the shipping line for the guessed country', /United States: \$4\.99\. Free shipping when your things come to \$35 or more \(before shipping\)\./.test(await text(pg, '#homeShip')), await text(pg, '#homeShip'));
  ok('home: ship to has the US first guess', (await pg.$eval('#shipSel', (s) => s.value)) === 'US');
  ok('home: test mode is said', /Test mode/.test(await text(pg, '#testbar')));
  ok('home: noindex', /noindex/.test(await pg.$eval('meta[name=robots]', (m) => m.content)));
  ok('home: the bag says its count to a screen reader', (await pg.$eval('#bagBtn', (a) => a.getAttribute('aria-label'))) === 'Basket, empty');
  // "Ship to": named by the browser in the page's language, sorted by the shown name, the code as nothing else
  const opts = await pg.$$eval('#shipSel option', (o) => o.map((x) => [x.value, x.textContent]));
  const shown = opts.map((x) => x[1].replace(/^Soon: /, ''));
  ok('ship to: every country named, none "undefined"', opts.length === CAT.countries.length && !opts.some((x) => /undefined|null/.test(x[1]) || x[1] === x[0]), opts.filter((x) => x[1] === x[0]).slice(0, 5));
  ok('ship to: sorted by the shown name', shown.every((s, i) => i === 0 || new Intl.Collator('en').compare(shown[i - 1], s) <= 0));
  ok('ship to: names from Intl.DisplayNames', opts.find((x) => x[0] === 'US')[1] === 'United States' && opts.find((x) => x[0] === 'GB')[1] === 'Soon: United Kingdom' && opts.find((x) => x[0] === 'AX')[1] === 'Åland Islands');
  ok('copy: no promise of a game button', !/will get a button/i.test(HTML) && !/will get a button/i.test(await pg.evaluate(() => document.body.innerText)));
  ok('legal links: the footer has Terms of sale, Shipping and returns, Seller details, the Japan notice and Privacy, with their pages', (await pg.$$eval('.mfoot a', (s) => s.map((x) => x.textContent.trim() + '=' + x.getAttribute('href')).slice(0, 5).join())) === 'Terms of sale=/merch/terms/,Shipping and returns=/merch/shipping/,Seller details=/merch/seller/,特定商取引法に基づく表記=/merch/tokushoho/,Privacy=/privacy' && !(await pg.$('.todo')));
  ok('legal links: the pay card links the Terms of sale, Shipping and returns, Seller details and the Japan notice', /By paying you agree to the <a class="lnk" href="\/merch\/terms\/">Terms of sale<\/a>\.<\/p>\s*<nav class="paylinks" aria-label="Shop rules"><a class="lnk" href="\/merch\/shipping\/">Shipping and returns<\/a><a class="lnk" href="\/merch\/seller\/">Seller details<\/a><a class="lnk" href="\/merch\/tokushoho\/" lang="ja">特定商取引法に基づく表記<\/a><\/nav>/.test(HTML));
  ok('copy: no "print file" jargon', !/print file/i.test(await pg.evaluate(() => document.body.innerText)));
  ok('copy: one age message', /You need to be 18 or over to order\. Younger\? Ask a grown-up to order for you\./.test(HTML) && !/A grown-up pays/.test(HTML));
  await tap(pg, '#useDog');
  ok('pick: five dogs from the save', (await pg.$$eval('[data-pick]', (b) => b.length)) === 5);
  const names = await pg.$$eval('[data-pick] .n', (b) => b.map((x) => x.textContent));
  ok('pick: the dog being played comes first', names[0] === 'Mochi' && (await text(pg, '[data-pick] .fav')).includes('playing now'), names);
  ok('pick: puppy, newborn and outfit tags', (await pg.$$eval('.dogb .w', (w) => w.map((x) => x.textContent).join('|'))).match(/Puppy.*wearing Party Hat, Red Bandana|wearing Party Hat, Red Bandana.*Puppy/) !== null && /Newborn/.test(await text(pg, '#pickBody')));
  ok('pick: from the save, said so', /from the game in this browser/.test(await text(pg, '.from')));
  ok('pick: four ready-made dogs too', (await pg.$$eval('#readyPick [data-dog]', (b) => b.length)) === 4);
  ok('pick: step 1 of 4', /step 1 of 4/.test(await text(pg, '#crumbs')));
  await tap(pg, '[data-pick]:nth-of-type(1)'); // Mochi (already chosen): a tap on a dog goes on to the thing (part 9 M7)
  ok('thing: mug and tee', (await view(pg)) === 'thing' && (await pg.$$eval('.prodb', (b) => b.map((x) => x.dataset.p).join())) === 'mug,tee');
  ok('thing: prices from the catalog', /\$19\.99/.test(await text(pg, '[data-p=mug]')) && /from \$26\.99/.test(await text(pg, '[data-p=tee]')));
  ok('thing: product tiles are PawPrint prints', await previewIs(pg, '[data-p=tee] svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'white', pose: 'stand', name: true }));
  await tap(pg, '.prodb[data-p=tee]');
  ok('make: shows', (await view(pg)) === 'make' && /step 3 of 4/.test(await text(pg, '#crumbs')));
  ok('make: preview = PawPrint.print (tee, white, stand, name)', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'white', pose: 'stand', name: true }));
  await tap(pg, '[data-col=navy]'); await tap(pg, '[data-pose=happy]');
  ok('make: preview = PawPrint.print (tee, navy, happy, name)', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'navy', pose: 'happy', name: true }));
  ok('make: the picture we print = PawPrint.print', await previewIs(pg, '#pvFlat svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'navy', pose: 'happy', name: true }) && /The picture we print/.test(await text(pg, '[data-pv=flat]')));
  ok('make: the dark colour says why the patch', !(await pg.$eval('#darkNote', (e) => e.hidden)) && /Navy/.test(await text(pg, '#colName')));
  ok('make: navy sizes are PawPrint\'s', (await pg.$$eval('[data-size]', (b) => b.map((x) => x.dataset.size).join())) === P.TEE_COLOURS.find((c) => c.id === 'navy').sizes.both.join());
  await tap(pg, '#sgBtn'); ok('make: the size guide opens', await pg.$eval('#sizeg', (d) => d.open)); await tap(pg, '#sgClose');
  // names: PawPrint's own rule and kind words
  await tap(pg, '#nameTog');
  ok('name off: preview without a name', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'navy', pose: 'happy', name: false }) && /without a name/.test(await text(pg, '#nameMsg')));
  await tap(pg, '#nameTog');
  await pg.fill('#nameIn', 'Bob金'); await pg.waitForTimeout(60);
  ok('name: letters we cannot draw yet', /letters we can't draw yet/.test(await text(pg, '#nameMsg')) && await pg.$eval('#addBtn', (b) => b.disabled));
  await pg.fill('#nameIn', ''); await pg.waitForTimeout(60);
  ok('name: empty asks kindly', /Type a name, or turn the name off/.test(await text(pg, '#nameMsg')) && await pg.$eval('#addBtn', (b) => b.disabled));
  await pg.fill('#nameIn', ROT('shpx')); await pg.waitForTimeout(60);
  ok('name: a word we won\'t print gets "Let\'s try another name"', /Let's try another name/.test(await text(pg, '#nameMsg')) && await pg.$eval('#addBtn', (b) => b.disabled));
  await pg.fill('#nameIn', 'WWWWWWWWWWWWWWWWWWWW'); await pg.waitForTimeout(60);
  ok('name: 20 W fit the tee', !(await pg.$eval('#addBtn', (b) => b.disabled)) && /20 \/ 20/.test(await text(pg, '#nameMsg')));
  await pg.fill('#nameIn', 'Mochi the Brave'); await pg.waitForTimeout(60);
  ok('make: a typed name is printed', await previewIs(pg, '#pvOn svg[data-pawprint]', Object.assign({}, R('Mochi'), { n: 'Mochi the Brave' }), { product: 'tee', colour: 'navy', pose: 'happy', name: true }));
  await tap(pg, '#qp'); await tap(pg, '#qp');
  ok('make: up to 3 of each', (await text(pg, '#qv')) === '3' && await pg.$eval('#qp', (b) => b.disabled) && /\$80\.97/.test(await text(pg, '#amt')));
  await tap(pg, '#qm'); await tap(pg, '#qm');
  await tap(pg, '#addBtn');
  ok('basket: the line is in', (await view(pg)) === 'basket' && (await pg.$$eval('.bl', (l) => l.length)) === 1 && /Mochi the Brave/.test(await text(pg, '.bl')));
  ok('basket: the bag says "Basket, 1 thing"', (await pg.$eval('#bagBtn', (a) => a.getAttribute('aria-label'))) === 'Basket, 1 thing');
  ok('basket: its picture is the print', await previewIs(pg, '.bl svg[data-pawprint]', Object.assign({}, R('Mochi'), { n: 'Mochi the Brave' }), { product: 'tee', colour: 'navy', pose: 'happy', name: true }));
  ok('basket: kept under its own key, with no ids', ((b) => b.length === 1 && !('id' in b[0]))(JSON.parse(await pg.evaluate(() => localStorage.getItem('dd_merch_basket_v1')))));
  ok('basket: one tee to the US: $4.99 shipping', (await text(pg, '[data-q=ship]')) === '$4.99' && (await text(pg, '[data-q=total]')) === '$31.98');
  ok('basket: the free-shipping rule once (before shipping), and how much more ships it free', /Free shipping when your things come to \$35 or more \(before shipping\)\./.test(await text(pg, '#shipBox')) && (await text(pg, '#freeMore')) === 'Add ' + money(3500 - 2699) + ' more for free shipping.' && !/ship free|Free shipping when/.test(await text(pg, '#totals')), [await text(pg, '#shipBox'), await text(pg, '#totals')]);
  ok('basket: the currency line, as decided', /Prices are in US dollars\. On the payment page you may be offered your own currency\./.test(await text(pg, '#totals')) && !/£|€|GBP|Stripe's rate/.test(await text(pg, '#totals')));
  ok('basket: the policy lines', /can't be returned if you change your mind/.test(await text(pg, '#promise')) && /damaged, misprinted or lost/.test(await text(pg, '#promise')) && /cancel within 1 hour/.test(await text(pg, '#promise')));
  ok('basket: an adult orders', /18 or over/.test(await text(pg, '.grown')));
  // a second line: the mug with the 20-letter name
  await tap(pg, '#another');
  await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-pick]')].find((x) => /Wigglesworth/.test(x.textContent)); b.click(); }); await settle(pg);
  await tap(pg, '.prodb[data-p=mug]');
  ok('make: the mug preview = PawPrint.print', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Sir Wigglesworth III'), { product: 'mug', colour: 'white', pose: 'stand', name: true }));
  await pg.fill('#nameIn', 'WWWWWWWWWWWWWWWWWWWW'); await pg.waitForTimeout(60);
  ok('name: too long for the mug says "A little shorter, please" and how many fit', /A little shorter, please: up to 16/.test(await text(pg, '#nameMsg')));
  await pg.fill('#nameIn', 'Sir Wigglesworth III'); await pg.waitForTimeout(60);
  await tap(pg, '#addBtn');
  ok('basket: mug + tee ship free in the US', (await text(pg, '[data-q=ship]')) === 'Free' && (await text(pg, '[data-q=total]')) === '$46.98');
  ok('basket: separate parcels said', /own parcels/.test(await text(pg, '#totals')));
  // Ship to: Canada, Hong Kong, the longest name, the UK (coming soon), back to the US
  await setShip(pg, 'CA');
  ok('ship to Canada: $7.99, free from $70, and how much more', (await text(pg, '[data-q=ship]')) === '$7.99' && /Free shipping when your things come to \$70 or more \(before shipping\)/.test(await text(pg, '#shipBox')) && /Canada: \$7\.99/.test(await text(pg, '#shipBox')) && (await text(pg, '#freeMore')) === 'Add ' + money(7000 - 4698) + ' more for free shipping.');
  await setShip(pg, 'HK');
  ok('ship to Hong Kong: $11.99 + $5.99, never free (no free-shipping line at all), the tax line', (await text(pg, '[data-q=ship]')) === '$17.98' && !/free shipping|ship free/i.test(await text(pg, '#totals') + await text(pg, '#shipBox')) && !(await pg.$('#freeMore')) && /import tax/.test(await text(pg, '#totals')) && /\$5\.99/.test(await text(pg, '#shipBox')));
  await setShip(pg, 'FK');
  ok('ship to the longest name', /the Falkland Islands \(Islas Malvinas\)/.test(await text(pg, '#shipBox')));
  await setShip(pg, 'GB');
  ok('ship to the UK: coming soon, no total, no pay', /Coming soon to the United Kingdom/.test(await text(pg, '#shipBox')) && !(await pg.$('#qtable')) && await pg.$eval('#payBtn', (b) => b.disabled));
  ok('ship to the UK: said once, in the Shipping box (part 9 m3: no repeat under it); the lines keep their catalog prices', !/can't send orders|Coming soon/.test(await text(pg, '#totals')) && (await pg.$$eval('.bl .lp', (x) => x.map((y) => y.textContent).join())) === [money(2699), money(1999)].join(), await pg.$$eval('.bl .lp', (x) => x.map((y) => y.textContent)));
  await setShip(pg, 'US');
  ok('ship to is kept', (await pg.evaluate(() => localStorage.getItem('dd_merch_ship_v1'))) === 'US');
  // change a line, qty, remove
  await pg.click('.bl:nth-child(1) [data-chg]'); await pg.waitForTimeout(80);
  ok('change: back on make, with Save changes', (await view(pg)) === 'make' && (await text(pg, '#addBtn')) === 'Save changes');
  ok('change: the preview is that line\'s print', await previewIs(pg, '#pvOn svg[data-pawprint]', Object.assign({}, R('Mochi'), { n: 'Mochi the Brave' }), { product: 'tee', colour: 'navy', pose: 'happy', name: true }) &&
    (await pg.$eval('[data-col=navy]', (b) => b.getAttribute('aria-pressed'))) === 'true' && (await pg.$eval('[data-size=M]', (b) => b.getAttribute('aria-pressed'))) === 'true' && (await pg.$eval('#nameIn', (i) => i.value)) === 'Mochi the Brave');
  await tap(pg, '[data-col=black]'); await tap(pg, '[data-size=L]');
  ok('change: the preview follows the change', await previewIs(pg, '#pvOn svg[data-pawprint]', Object.assign({}, R('Mochi'), { n: 'Mochi the Brave' }), { product: 'tee', colour: 'black', pose: 'happy', name: true }));
  await tap(pg, '#addBtn');
  ok('change: the line changed in place', /Black · L/.test(await text(pg, '.bl:nth-child(1)')) && (await pg.$$eval('.bl', (l) => l.length)) === 2);
  await pg.click('.bl:nth-child(2) [data-qp]'); await pg.waitForTimeout(80); await pg.click('.bl:nth-child(2) [data-qp]'); await pg.waitForTimeout(80);
  ok('qty: 3 of the mug, then no more', (await text(pg, '.bl:nth-child(2) output')) === '3' && await pg.$eval('.bl:nth-child(2) [data-qp]', (b) => b.disabled));
  ok('qty: the total follows', (await text(pg, '[data-q=total]')) === money(2699 + 3 * 1999));
  ok('qty: the bag says "Basket, 4 things"', (await pg.$eval('#bagBtn', (a) => a.getAttribute('aria-label'))) === 'Basket, 4 things');
  await pg.click('.bl:nth-child(1) [data-rm]'); await pg.waitForTimeout(80);
  ok('remove: one line left', (await pg.$$eval('.bl', (l) => l.length)) === 1 && (await text(pg, '[data-q=total]')) === money(3 * 1999));
  // pay never leaves the page
  const navs0 = t.navs.length, url0 = pg.url();
  await tap(pg, '#payBtn'); await pg.waitForTimeout(150);
  ok('pay: "The shop is not open yet"', !(await pg.$eval('#closed', (e) => e.hidden)) && /The shop is not open yet/.test(await text(pg, '#closed')));
  ok('pay: never navigates', t.navs.length === navs0 && pg.url() === url0, t.navs);
  ok('pay: no test-order button without ?demo=1', await pg.$eval('#demoRow', (e) => e.hidden));
  ok('pay: the basket stays', (await pg.$$eval('.bl', (l) => l.length)) === 1);
  // back through the stepper
  await pg.click('#steps li[data-s=pick] button'); await pg.waitForTimeout(80);
  ok('stepper: a done step goes back', (await view(pg)) === 'pick' && (await hash(pg)) === '#/pick');
  const saveAfter = await pg.evaluate(() => localStorage.getItem('pawhaven_proto_v1'));
  ok('the game save is unchanged', saveAfter === SAVE);
  await finish('save flow', t);

  // ---- the 6-line and 3-each limits
  const six = ['Biscuit', 'Mochi', 'Sir Wigglesworth III', 'Bo', 'Pepper'].map((n) => line(R(n), 'mug')).concat([line(R('Pepper'), 'tee', { colour: 'black', size: 'XL' })]);
  t = await open({ save: SAVE, basket: six, path: '/merch/#/basket' }); pg = t.page;
  ok('six lines: shown', (await pg.$$eval('.bl', (l) => l.length)) === 6 && (await pg.$eval('#bdrop', (e) => e.hidden)));
  ok('six lines: "Put another dog" is off, and says why', (await pg.$eval('#another', (a) => a.getAttribute('aria-disabled'))) === 'true' && /holds up to 6 different designs, up to 3 of each/.test(await text(pg, '#bfull')));
  await toHash(pg, '#/pick'); await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-pick]')].find((x) => /Biscuit/.test(x.textContent)); b.click(); }); await settle(pg);
  await tap(pg, '.prodb[data-p=tee]');
  ok('six lines: a seventh can\'t be added', await pg.$eval('#addBtn', (b) => b.disabled) && /basket is full/.test(await text(pg, '#addMsg')));
  await toHash(pg, '#/thing'); await tap(pg, '.prodb[data-p=mug]');
  ok('six lines: the same thing again may still add up', !(await pg.$eval('#addBtn', (b) => b.disabled)));
  await tap(pg, '#qp'); await tap(pg, '#qp'); await tap(pg, '#addBtn');
  ok('3 each: adding the same mug again stops at 3', (await pg.$$eval('.bl', (l) => l.length)) === 6 && (await text(pg, '.bl:nth-child(1) output')) === '3');
  await finish('limits', t);

  await handChecks();
  await staleChecks();
  await nonameChecks();
  await errorChecks();
  await orderChecks();
  await tabChecks();
  await routeChecks();
  await liveChecks();
  await wiringChecks();
  await part9Checks();

  // ---- dogs from a link (no save): this tab only, the hash turns into the route
  const link = '#p=' + P.merchEncode([R('Biscuit'), R('Bo')]);
  t = await open({ path: '/merch/' + link }); pg = t.page;
  ok('link: two dogs', (await view(pg)) === 'pick' && (await pg.$$eval('[data-pick]', (b) => b.length)) === 2 && /2 dogs came with your link/.test(await text(pg, '.from')));
  ok('link: the hash became the route', (await hash(pg)) === '#/pick');
  ok('link: kept for this tab only', (await pg.evaluate(() => !!sessionStorage.getItem('dd_merch_link_v1') && !localStorage.getItem('dd_merch_link_v1'))));
  await pg.reload(); await pg.waitForSelector('html.merch-ready');
  ok('link: still there after a reload', (await pg.$$eval('[data-pick]', (b) => b.length)) === 2);
  await tap(pg, '#pickNext'); await tap(pg, '.prodb[data-p=mug]');
  ok('link: preview = PawPrint.print', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Biscuit'), { product: 'mug', colour: 'white', pose: 'stand', name: true }));
  await finish('link', t);
  t = await open({ path: '/merch/#p=AQEAJSCQqVT8sQIBAAVNb2NoaRjX' }); pg = t.page;
  ok('bad link: said kindly, no dogs', /didn't come through whole/.test(await text(pg, '#pickBody')) && (await pg.$$eval('[data-pick]', (b) => b.length)) === 0);
  await finish('bad link', t);
  await shareChecks();

  // ---- no dogs: the ready-made ones, Next stays off
  t = await open({}); pg = t.page;
  await tap(pg, '#useDog');
  ok('none: says how to bring a dog', /can't see any of your dogs/.test(await text(pg, '#pickBody')) && (await pg.$eval('#pickNext', (a) => a.getAttribute('aria-disabled'))) === 'true');
  await tap(pg, '#pickNext');
  ok('none: Next does nothing', (await view(pg)) === 'pick');
  await tap(pg, '#readyPick [data-dog]');
  ok('none: a ready-made dog goes to the thing', (await view(pg)) === 'thing');
  await tap(pg, '.prodb[data-p=tee]');
  ok('none: a ready-made dog has its name off', (await pg.$eval('#nameTog', (b) => b.getAttribute('aria-checked'))) === 'false' && /prints without a name/.test(await text(pg, '#nameMsg')));
  const ready = await pg.evaluate(() => window.__merch.READY[0].recipe);
  ok('none: preview = PawPrint.print (ready-made Lab)', await previewIs(pg, '#pvOn svg[data-pawprint]', ready, { product: 'tee', colour: 'white', pose: 'stand', name: false }));
  await tap(pg, '#addBtn');
  ok('none: the basket says "A ready-made"', /A ready-made Labrador Retriever/.test(await text(pg, '.bl')));
  await finish('no dogs', t);

  // ---- ?demo=1: the rest of the flow, marked test
  t = await open({ save: SAVE, path: '/merch/?demo=1' }); pg = t.page;
  await tap(pg, '#useDog'); await tap(pg, '#pickNext'); await tap(pg, '.prodb[data-p=mug]'); await tap(pg, '#addBtn');
  const navsD = t.navs.length;
  await tap(pg, '#payBtn'); await pg.waitForTimeout(100);
  ok('demo: closed card with a test-only button', !(await pg.$eval('#demoRow', (e) => e.hidden)));
  ok('demo: pay still did not navigate', t.navs.length === navsD);
  await tap(pg, '#demoBtn'); await pg.waitForSelector('.testtag');
  ok('demo: the thank-you page, marked test', (await view(pg)) === 'order' && /Test order/.test(await text(pg, '.testtag')) && /Thank you! Your order is in/.test(await text(pg, '#orderBody')));
  ok('demo: the cancel line is a plain time', /We'll start printing at \d\d:\d\d\. If you change your mind/.test(await text(pg, '.cancelbox')) && !(await text(pg, '.cancelbox')).match(/\d+:\d\d:\d\d/));
  ok('demo: the order shows its total', /\$24\.98/.test(await text(pg, '#orderBody')));
  ok('demo: no "Ship to" picker on the order page', !(await pg.isVisible('#shipSel')));
  ok('demo: the basket is empty after it', (await pg.evaluate(() => localStorage.getItem('dd_merch_basket_v1'))) === null);
  await tap(pg, '#cancelBtn'); await tap(pg, '#cancelYes'); await pg.waitForTimeout(150);
  ok('demo: cancel in the hour', /Your order is cancelled/.test(await text(pg, '#orderBody')) && !(await pg.$('.cancelbox')));
  await finish('demo', t);
}

// ---- the hand table on the page: what it shows = the hand table, for every basket
async function handChecks() {
  for (const cv of Object.keys(CATS)) {
    const t = await open({ save: SAVE, catalog: cv === 'real' ? null : CATS[cv] }), pg = t.page;
    for (const [i, [cc, c2, lines, sub, ship, total]] of HAND.entries()) {
      if (c2 !== cv) continue;
      await pg.evaluate(([b, cc]) => { localStorage.setItem('dd_merch_basket_v1', JSON.stringify(b)); localStorage.setItem('dd_merch_ship_v1', cc); location.hash = '#/basket'; }, [lines, cc]);
      await pg.reload(); await pg.waitForSelector('html.merch-ready'); await pg.waitForSelector('#qtable');
      const s = await pg.evaluate(() => ({ sub: document.querySelector('[data-q=subtotal]').textContent, ship: document.querySelector('[data-q=ship]').textContent, total: document.querySelector('[data-q=total]').textContent, n: document.querySelectorAll('.bl').length, notes: document.querySelector('#totals').textContent }));
      const want = { sub: money(sub), ship: ship ? money(ship) : 'Free', total: money(total), n: lines.length };
      ok('hand ' + (i + 1) + ' (' + cc + ', ' + cv + ', ' + lines.length + ' lines): the page = the hand table', s.sub === want.sub && s.ship === want.ship && s.total === want.total && s.n === want.n, { s, want });
      if (cc === 'GB') ok('hand ' + (i + 1) + ': "Prices include VAT." only while a registration is live (catalog.js REGISTERED; the Worker\'s zoneNotes)', /Prices include VAT\./.test(s.notes) === !!Object.keys(CATJS.REGISTERED).length, s.notes);
      if (cc === 'VC') ok('hand ' + (i + 1) + ': everywhere else, the import tax line', /import tax/.test(s.notes) && !/ship free/.test(s.notes));
    }
    await finish('hand table ' + cv, t);
  }
}

// ---- a stale stored basket (an old catalog, an old build) and a hostile one (the storage is shared with /play/)
async function staleChecks() {
  const good = line(R('Biscuit'), 'mug'), raw = (r, product, o) => Object.assign(line(r, product), o);
  const stale = [good, raw(R('Mochi'), 'tee', { pose: 'walk' }), raw(R('Mochi'), 'tee', { colour: 'mustard' }), raw(R('Mochi'), 'stickers', { size: null }), raw(R('Mochi'), 'tee', { size: '5XL' }),
    raw(R('Pepper'), 'tee', { qty: 7 }), raw(R('Mochi'), 'mug', { qty: 0 }), raw(R('Bo'), 'mug', { recipe: 'AAAAAAAA' }),
    raw(Object.assign({}, R('Pepper'), { n: 'WWWWWWWWWWWWWWWWWWWW' }), 'mug', { name_on: true }), raw(R('Bo'), 'tee', { qty: 2.6 }), raw(R('Bo'), 'mug', { size: 'M' }), null, 'a line', 42];
  let t = await open({ save: SAVE, basket: stale, path: '/merch/#/basket' }), pg = t.page;
  ok('stale: the good lines stay, the rest go', (await pg.$$eval('.bl', (l) => l.length)) === 4, await pg.$$eval('.bl', (l) => l.map((x) => x.textContent.slice(0, 40))));
  ok('stale: said kindly, with the count', /^10 designs in your basket can't be made any more, so we took them out\.$/.test(await text(pg, '#bdrop')), await text(pg, '#bdrop'));
  ok('stale: qty 7 became 3, 0 became 1, 2.6 became 3', (await pg.$$eval('.bl output', (o) => o.map((x) => x.textContent).join())) === '1,3,1,3');
  ok('stale: the totals show', /\$/.test(await text(pg, '[data-q=total]')) && !(await pg.$eval('#payBtn', (b) => b.disabled)));
  ok('stale: the bag says 8', (await text(pg, '#bagN')) === '8');
  const kept = JSON.parse(await pg.evaluate(() => localStorage.getItem('dd_merch_basket_v1')));
  ok('stale: the stored basket is written back clean', kept.length === 4 && kept.every((l) => !('id' in l) && l.qty >= 1 && l.qty <= 3) && !JSON.stringify(kept).includes('walk'));
  await pg.click('.bl:nth-child(1) [data-rm]'); await settle(pg);
  ok('stale: Remove works, and the note goes', (await pg.$$eval('.bl', (l) => l.length)) === 3 && (await pg.$eval('#bdrop', (e) => e.hidden)));
  await finish('stale basket', t);
  t = await open({ save: SAVE, basket: [good, raw(R('Mochi'), 'tee', { colour: 'mustard' })], path: '/merch/#/basket' }); pg = t.page;
  ok('stale: one line dropped says "One design"', (await text(pg, '#bdrop')) === "One design in your basket can't be made any more, so we took it out.");
  await finish('stale basket (one)', t);
  const eight = ['Biscuit', 'Mochi', 'Sir Wigglesworth III', 'Bo', 'Pepper'].map((n) => line(R(n), 'mug')).concat(['Biscuit', 'Mochi', 'Bo'].map((n) => line(R(n), 'tee')));
  t = await open({ save: SAVE, basket: eight, path: '/merch/#/basket' }); pg = t.page;
  ok('stale: 8 lines become 6, 2 dropped', (await pg.$$eval('.bl', (l) => l.length)) === 6 && /^2 designs/.test(await text(pg, '#bdrop')));
  await finish('stale basket (8 lines)', t);
  t = await open({ save: SAVE, basket: '{not json', path: '/merch/#/basket' }); pg = t.page;
  ok('stale: an unreadable basket starts empty, said kindly', /Your basket is empty/.test(await text(pg, '#blines')) && /can't be made any more/.test(await text(pg, '#bdrop')));
  await finish('stale basket (unreadable)', t);

  // hostile: script in id, qty, name, colour, product; the "Ship to" key too
  const X = (n) => '"><img src=/x' + n + ' onerror="window.__pwned=' + n + '"><script>window.__pwned=' + n + '</script>';
  const hostile = [Object.assign(line(R('Mochi'), 'mug', { qty: 2, name_on: false }), { id: X(1), who: X(2), name: X(3) }), Object.assign(line(R('Biscuit'), 'tee'), { colour: X(4) }), Object.assign(line(R('Bo'), 'mug'), { qty: X(5) }),
    Object.assign(line(R('Bo'), 'tee'), { size: X(6) }), Object.assign(line(R('Bo'), 'mug'), { pose: X(7) }), Object.assign(line(R('Bo'), 'mug'), { product: '__proto__' }), Object.assign(line(R('Bo'), 'mug'), { name_on: X(8) }),
    Object.assign(line(R('Bo'), 'mug'), { recipe: X(9) }), { __proto__: { recipe: 1 } }];
  t = await open({ save: SAVE, basket: hostile, ship: X(10), path: '/merch/#/basket' }); pg = t.page;
  await settle(pg);
  ok('hostile: nothing ran', (await pg.evaluate(() => window.__pwned)) === undefined && t.dialogs.length === 0);
  ok('hostile: no element was injected', (await pg.$$eval('.msheet img, .msheet script, .msheet iframe', (x) => x.filter((e) => !e.closest('.sitetop,.sitehead')).length)) === 0);
  ok('hostile: one good line kept, its id our own', (await pg.$$eval('.bl', (l) => l.map((x) => x.dataset.line))).every((id) => /^l[0-9a-z]+$/.test(id)) && (await pg.$$eval('.bl', (l) => l.length)) === 1);
  ok('hostile: the stored game name shows as text', (await text(pg, '.bl .facts li')).includes('"><img src=/x2'));
  ok('hostile: "Ship to" fell back to a real country', (await pg.$eval('#shipSel', (s) => s.value)) === 'US');
  ok('hostile: the rest dropped, said', /^8 designs/.test(await text(pg, '#bdrop')), await text(pg, '#bdrop'));
  await finish('hostile basket', t);
}

// ---- S1: a game name the print can't draw keeps its own name on the card and in the basket; the name print is off, with one kind line
async function nonameChecks() {
  const t = await open({ save: SAVE_NONAME, path: '/merch/#/pick' }), pg = t.page;
  const names = await pg.$$eval('[data-pick] .n', (b) => b.map((x) => x.textContent));
  ok('no-print name: the cards keep the game names', names.join('|') === ['ポチ', 'Pochi 🐶', ROT('shpx'), 'Daisy'].join('|'), names);
  ok('no-print name: the heading says the name', (await pg.click('#pickNext').then(() => settle(pg)).then(() => text(pg, '#h-thing'))).includes('ポチ'));
  await tap(pg, '.prodb[data-p=mug]');
  ok('no-print name: the name print is off, with one kind line', (await pg.$eval('#nameTog', (b) => b.getAttribute('aria-checked'))) === 'false' && (await text(pg, '#nameMsg')) === NOSAY && !(await pg.$eval('#addBtn', (b) => b.disabled)));
  ok('no-print name: the preview has no name', await previewIs(pg, '#pvOn svg[data-pawprint]', P.merchFromSave(SAVE_NONAME, { today: new Date() }).dogs[0].recipe, { product: 'mug', colour: 'white', pose: 'stand', name: false }));
  await tap(pg, '#nameTog');
  ok('no-print name: turned on, it asks for one we can draw', /Type a name, or turn the name off/.test(await text(pg, '#nameMsg')) && (await pg.$eval('#nameIn', (i) => i.value)) === '');
  await tap(pg, '#nameTog'); await tap(pg, '#addBtn');
  ok('no-print name: the basket label keeps the game name', (await text(pg, '.bl .facts li')) === 'ポチ, Shiba Inu' && /no name/.test(await text(pg, '.bl')));
  await toHash(pg, '#/pick'); await pg.evaluate(() => { [...document.querySelectorAll('[data-pick]')].find((x) => /Daisy/.test(x.textContent)).click(); }); await settle(pg);
  await tap(pg, '.prodb[data-p=tee]');
  ok('no-print name: a name it can draw is still on', (await pg.$eval('#nameTog', (b) => b.getAttribute('aria-checked'))) === 'true');
  await tap(pg, '#nameTog');
  ok('no-print name: a drawable name turned off says the plain line', /The tee prints without a name/.test(await text(pg, '#nameMsg')));
  await tap(pg, '#addBtn');
  ok('no-print name: Daisy, name off, still says Daisy', (await text(pg, '.bl:nth-child(2) .facts li')) === 'Daisy, Beagle');
  await pg.click('.bl:nth-child(1) [data-chg]'); await settle(pg);
  ok('no-print name: Change keeps the kind line', (await text(pg, '#nameMsg')) === NOSAY);
  await finish('no-print name', t);
}

// ---- S2, S3: every error code in plain words; a new price is asked about again; one nonce per basket and country
const QUOTE_ERR = [['bad_line', /One design in your basket \(marked below\) needs a look: tap Change on it/, 2], ['bad_name', /One name in your basket \(marked below\) can't print as it is/, 1], ['too_many', /holds up to 6 different designs/],
  ['bad_qty', /One design in your basket \(marked below\) has more than we can make: up to 3 of each/, 1], ['bad_country', /don't know that place/], ['country_closed', /can't send orders to the United States yet/], ['variant_off', /can't be made just now/, 2],
  ['sold_out_today', /until tomorrow/], ['merch_closed', /not open yet/], ['slow_down', /Wait a minute, then try again/], ['busy', /a little busy just now/], ['offline', /couldn't reach the shop/]];
const PAY_ERR = [['art_changed', /We've improved the drawing since you opened this page\. Reload to see your dog as it will print\./], ['sold_out_today', /until tomorrow/], ['variant_off', /can't be made just now/, 1],
  ['slow_down', /Wait a minute/], ['busy', /a little busy/], ['cant_make', /can't make this order just now, and nothing was paid/], ['bad_qty', /up to 3 of each/, 2], ['too_many', /holds up to 6 different designs/],
  ['country_closed', /can't send orders to the United States yet/], ['bad_line', /needs a look/, 2], ['bad_name', /can't print as it is/, 1], ['not_available', /can't take this order here/], ['no_agree', /Reload the page/]];
async function errorChecks() {
  const t = await open({ save: SAVE, basket: NORMAL3.slice(0, 2), ship: 'US', path: '/merch/#/basket' }), pg = t.page;
  await pg.waitForSelector('#qtable');
  await pg.evaluate(() => { window.__q = window.__merch.api.quote; window.__c = window.__merch.api.checkout; });
  for (const [code, re, ln] of QUOTE_ERR) {
    await pg.evaluate(([code, ln]) => { window.__merch.api.quote = () => Promise.reject({ status: 400, error: code, line: ln }); return window.__merch.requote(); }, [code, ln || 0]); await settle(pg);
    const s = await text(pg, '#totals .qerr'), marked = await pg.$$eval('.bl', (l) => l.map((x) => x.classList.contains('needs')));
    ok('quote error ' + code + ': its own words', re.test(s) && !/couldn't work out the total/.test(s), s);
    ok('quote error ' + code + ': ' + (ln ? 'line ' + ln + ' marked' : 'no line marked'), marked.every((m, i) => m === (i + 1 === ln)) && (ln ? /This one needs a look/.test(await text(pg, '.bl:nth-child(' + ln + ')')) : true), marked);
    ok('quote error ' + code + ': no total, no pay', !(await pg.$('#qtable')) && await pg.$eval('#payBtn', (b) => b.disabled));
  }
  await pg.evaluate(() => { window.__merch.api.quote = window.__q; return window.__merch.requote(); }); await pg.waitForSelector('#qtable');
  for (const [code, re, ln] of PAY_ERR) {
    await pg.evaluate(([code, ln]) => { window.__merch.api.checkout = () => Promise.reject({ status: 409, error: code, line: ln }); }, [code, ln || 0]);
    await tap(pg, '#payBtn'); await settle(pg);
    const s = await text(pg, '#payErr');
    ok('pay error ' + code + ': its own words', re.test(s) && !(await pg.$eval('#payErr', (e) => e.hidden)) && (await pg.$eval('#closed', (e) => e.hidden)), s);
    if (ln) ok('pay error ' + code + ': line ' + ln + ' marked', (await pg.$$eval('.bl', (l) => l.map((x) => x.classList.contains('needs')))).every((m, i) => m === (i + 1 === ln)));
    if (code === 'art_changed') ok('pay error art_changed: a Reload button', !!(await pg.$('#payErr [data-reload]')) && (await text(pg, '#payErr [data-reload]')) === 'Reload');
  }
  // price_changed: the new quote is shown and asked about again; checkout is not called again by itself
  const q0 = await pg.evaluate(() => window.__merch.st.quote);
  await pg.evaluate((q0) => { const q = JSON.parse(JSON.stringify(q0)); q.lines[0].unit += 100; q.lines[0].total += 100; q.subtotal += 100; q.total += 100; window.__calls = 0;
    window.__merch.api.checkout = () => { window.__calls++; return Promise.reject({ status: 409, error: 'price_changed', quote: q }); }; }, q0);
  await tap(pg, '#payBtn'); await settle(pg);
  ok('price_changed: the new total shows, and it asks again', (await text(pg, '[data-q=total]')) === money(q0.total + 100) && new RegExp('it\'s now \\' + money(q0.total + 100) + '\\. Check it above, then tap Pay again').test(await text(pg, '#payErr')), await text(pg, '#payErr'));
  await pg.waitForTimeout(300);
  ok('price_changed: never paid by itself (one checkout call)', (await pg.evaluate(() => window.__calls)) === 1 && (await pg.$eval('#closed', (e) => e.hidden)));
  // merch_closed is the "not open yet" card
  await pg.evaluate(() => { window.__merch.api.checkout = window.__c; return window.__merch.requote(); }); await pg.waitForSelector('#qtable');
  await tap(pg, '#payBtn'); await settle(pg);
  ok('pay merch_closed: the "not open yet" card, no error box', !(await pg.$eval('#closed', (e) => e.hidden)) && (await pg.$eval('#payErr', (e) => e.hidden)));
  // S3: one nonce for one basket to one country, kept on a retry
  await pg.evaluate(() => { window.__n = []; window.__merch.api.checkout = (b) => { window.__n.push(b.nonce); return Promise.reject({ status: 503, error: 'busy' }); }; });
  await tap(pg, '#payBtn'); await settle(pg); await tap(pg, '#payBtn'); await settle(pg);
  await pg.click('.bl:nth-child(1) [data-qp]'); await pg.waitForSelector('#qtable'); await settle(pg);
  await tap(pg, '#payBtn'); await settle(pg);
  await setShip(pg, 'CA'); await pg.waitForSelector('#qtable'); await settle(pg); await tap(pg, '#payBtn'); await settle(pg);
  await setShip(pg, 'US'); await pg.waitForSelector('#qtable'); await settle(pg);
  await pg.click('.bl:nth-child(1) [data-qm]'); await pg.waitForSelector('#qtable'); await settle(pg); await tap(pg, '#payBtn'); await settle(pg);
  const n = await pg.evaluate(() => window.__n);
  ok('nonce: the same on a retry', n.length === 5 && n[0] === n[1] && /^[0-9a-f]{24}$/.test(n[0]), n);
  ok('nonce: new when the basket or the country changes', n[2] !== n[1] && n[3] !== n[2] && n[4] !== n[3], n);
  // sold out for today in the catalog: said, and no pay
  await finish('errors', t);
  const t2 = await open({ save: SAVE, basket: NORMAL3, ship: 'US', path: '/merch/#/basket', catalog: Object.assign(clone(CAT), { sold_out_today: true }) });
  await t2.page.waitForSelector('#qtable');
  ok('sold out today (catalog): said, Pay off', /until tomorrow/.test(await text(t2.page, '#totals')) && await t2.page.$eval('#payBtn', (b) => b.disabled));
  await finish('sold out today', t2);
}

// ---- S4, S5: the order page needs no recipe, follows can_cancel and cancel_until, and shows the order's own dates
async function orderChecks() {
  const t = await open({ save: SAVE, basket: NORMAL3.slice(0, 2), ship: 'US', path: '/merch/?demo=1#/basket', clock: FIX }), pg = t.page;
  await pg.waitForSelector('#qtable'); await tap(pg, '#payBtn'); await tap(pg, '#demoBtn'); await pg.waitForSelector('.testtag');
  const POST = 'We\'ll post it by ' + postDay(addBD(FIX, CATJS.SHIP_BY_DAYS)) + '.';
  ok('order: the demo order says when it will be posted (payment + ' + CATJS.SHIP_BY_DAYS + ' working days, the UTC date)', (await itext(pg, '.cancelbox')).includes(POST) && /^Thursday 10 December$/.test(postDay(addBD(FIX, 7))), await text(pg, '.cancelbox'));
  const id = (await hash(pg)).replace('#/order/', '');
  const edit = async (f) => { await pg.evaluate(([id, f]) => { const k = 'dd_merch_test_orders_v1', all = JSON.parse(sessionStorage.getItem(k)); new Function('o', f)(all[id]); sessionStorage.setItem(k, JSON.stringify(all)); }, [id, f]); await pg.reload(); await pg.waitForSelector('.testtag'); await settle(pg); };
  const paid = new Date(2026, 10, 20, 10, 5).getTime();
  // after the hour: no cancel line, "Printing has started."
  await edit('o.paid_at = ' + paid + '; o.cancel_until = ' + (paid + 3600000) + '; o.ship_by = ' + addBD(paid, 7) + ';');
  ok('order after the hour: "Printing has started.", the posting date, no cancel', (await itext(pg, '.cancelbox')) === 'Printing has started. We\'ll post it by Tuesday 1 December.' && !(await pg.$('#cancelBtn')) && !/cancel here/.test(await text(pg, '#orderBody')), await text(pg, '.cancelbox'));
  ok('order: the date it was received (no receipt line after the first hour: part 9 M6)', /Order received\s*20 Nov 2026\.$/.test(await text(pg, '.track li:nth-child(1)')) && !/Today|receipt/.test(await text(pg, '#orderBody')), await text(pg, '.track li:nth-child(1)'));
  ok('order after the hour: being printed is now', (await pg.$eval('.track li:nth-child(2)', (l) => l.className)) === 'now' && (await pg.$eval('.track li:nth-child(1)', (l) => l.className)) === 'done');
  // the server cleared the recipes (after 24 months): the page uses the names, draws no dog, and does not break
  await edit('o.lines.forEach(function (l) { delete l.recipe; }); o.lines[1].name = "<img src=/xo onerror=window.__pwned=1>";');
  ok('order without recipes: the lines and names still show', (await pg.$$eval('#orderBody .bl', (l) => l.length)) === 2 && /Mochi/.test(await text(pg, '#orderBody .bl:nth-child(1)')) && (await text(pg, '#orderBody .bl:nth-child(2) .facts li')).startsWith('<img'));
  ok('order without recipes: no dog drawn, nothing ran', !(await pg.$('#orderBody .thanks svg')) && (await pg.evaluate(() => window.__pwned)) === undefined && !(await pg.$('#orderBody img')));
  // shipped and arrived: the parcel's dates and its tracking link
  await edit('o.status = "shipped"; o.lines.forEach(function (l) { l.status = "shipped"; l.parcel = "p1"; }); o.parcels = [{ id: "p1", product: "mug", carrier: "USPS", tracking_url: "https://tracking.example/1", shipped_at: ' + new Date(2026, 10, 22).getTime() + ', delivered_at: null }];');
  ok('order shipped: "Sent 22 Nov 2026", a tracking link, no cancel box', /On its way\s*Sent 22 Nov 2026\. Track it/.test(await text(pg, '.track li:nth-child(3)')) && (await pg.$eval('.track li:nth-child(3)', (l) => l.className)) === 'now' && !(await pg.$('.cancelbox')));
  await edit('o.parcels[0].delivered_at = ' + new Date(2026, 10, 25).getTime() + ';');
  ok('order delivered: its date', /Delivered 25 Nov 2026/.test(await text(pg, '.track li:nth-child(4)')) && (await pg.$eval('.track li:nth-child(4)', (l) => l.className)) === 'now');
  // inside the hour, from the server: a time and the button
  await edit('o.status = "paid"; o.parcels = []; o.cancel_until = ' + (FIX + 600000) + ';');
  ok('order in the hour: the time and the button', /We'll start printing at \d\d:\d\d\. If you change your mind before then, you can cancel here\./.test(await text(pg, '.cancelbox')) && !!(await pg.$('#cancelBtn')));
  await edit('o.can_cancel_override = 1; o.cancel_until = ' + (FIX - 121000) + ';');
  ok('order: the button follows can_cancel from the server (the 120 s grace over)', !(await pg.$('#cancelBtn')) && /^Printing has started\./.test(await text(pg, '.cancelbox')));
  await edit('o.cancel_until = ' + (FIX - 60000) + ';');
  ok('order: the fake keeps the Worker\'s 120 s grace (review finding 15)', !!(await pg.$('#cancelBtn')));
  await finish('order page', t);
}

// ---- S6: two tabs of the same browser
async function tabChecks() {
  const A = await open({ save: SAVE, basket: NORMAL3.slice(0, 2), ship: 'US', path: '/merch/#/basket' });
  const B = await tab(A.ctx, '/merch/#/basket');
  await A.page.waitForSelector('#qtable'); await B.page.waitForSelector('#qtable');
  // B changes line 1 while A removes it: B's change comes back as a new line, nothing is lost
  await B.page.click('.bl:nth-child(1) [data-chg]'); await settle(B.page);
  await A.page.click('.bl:nth-child(1) [data-rm]'); await settle(A.page); await settle(B.page);
  ok('two tabs: B sees the line gone (Add, not Save)', (await text(B.page, '#addBtn')) === 'Add to basket' && (await text(B.page, '#bagN')) === '1');
  await tap(B.page, '[data-col=black]'); await tap(B.page, '#addBtn'); await settle(B.page);
  ok('two tabs: B\'s change is added as a new line', (await B.page.$$eval('.bl', (l) => l.length)) === 2 && /Black · M/.test(await text(B.page, '#blines')));
  await settle(A.page);
  ok('two tabs: A shows B\'s basket', (await A.page.$$eval('.bl', (l) => l.length)) === 2 && /Black · M/.test(await text(A.page, '#blines')));
  // B changes a line while A only bumps its qty: still the same line, "Save changes" changes it in place
  await B.page.click('.bl:nth-child(1) [data-chg]'); await settle(B.page);
  await A.page.click('.bl:nth-child(1) [data-qp]'); await settle(A.page); await settle(B.page);
  ok('two tabs: a qty change elsewhere keeps the line ("Save changes")', (await text(B.page, '#addBtn')) === 'Save changes');
  await tap(B.page, '[data-pose=sit]'); await tap(B.page, '#addBtn'); await settle(B.page);
  ok('two tabs: changed in place', (await B.page.$$eval('.bl', (l) => l.length)) === 2);
  await finish('two tabs B', B, { keep: true });
  await finish('two tabs A', A);
}

// ---- S7: the address always says the step on show
// ---- part 8b: the game's share sheet link, #p=<one dog>&prod=mug&pose=happy&from=share (docs/design/merch/PART8.md): "make it" opens with that
//      dog, product and pose; anything else falls back to the dog list (or the bad-link words); nothing of the link leaves the page
const SHARE = (r, tail) => '/merch/#p=' + (Array.isArray(r) ? P.merchEncode(r) : enc(r)) + (tail === undefined ? '&prod=mug&pose=happy&from=share' : tail);
const QUIET1 = 'This is your dog from the game, just as it looks today.', QUIETN = 'These are your dogs from the game, just as they look today.';
async function noLeak(pg, bits) { // no request the page made (scripts, the catalog, anything) carries the link's recipe or its other parameters
  return pg.evaluate((bits) => performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation')).every((e) => bits.every((b) => !e.name.split('#')[0].includes(b))), bits);
}
async function shareChecks() {
  const mochi = R('Mochi'), M1 = SHARE(mochi);
  let t = await open({ path: M1 }), pg = t.page;
  ok('share link: opens "make it"', (await view(pg)) === 'make' && (await hash(pg)) === '#/make' && /step 3 of 4/.test(await text(pg, '#crumbs')));
  ok('share link: the mug and the happy pose chosen', (await pg.evaluate(() => { const d = window.__merch.st.draft; return d && d.product + '/' + d.pose + '/' + d.colour; })) === 'mug/happy/white' &&
    (await pg.$eval('[data-pose=happy]', (b) => b.getAttribute('aria-pressed'))) === 'true' && (await pg.$$eval('[data-pose][aria-pressed=true]', (b) => b.length)) === 1);
  ok('share link: the preview is that dog on the mug, happy, with its name', await previewIs(pg, '#pvOn svg[data-pawprint]', mochi, { product: 'mug', colour: 'white', pose: 'happy', name: true }));
  ok('share link: the dog from the link, its name on', (await pg.evaluate(() => window.__merch.st.dog.src + '/' + window.__merch.st.draft.name_on)) === 'link/true' && (await text(pg, '.dn')) === 'Mochi');
  ok('share link: "Ship to" is in the shop bar as on every step, and the price says shipping comes in the basket', !(await pg.$eval('#shipTo', (e) => e.classList.contains('off'))) && (await pg.$eval('#shipSel', (s) => s.value)) === 'US' &&
    /^\$19\.99\s*shipping in the basket$/.test(await text(pg, '#amt')));
  ok('share link: the link is kept for this tab like any link, without its product or pose', await pg.evaluate(() => { const s = sessionStorage.getItem('dd_merch_link_v1'); return !!s && JSON.parse(s).length === 1 && !/prod|pose|share/.test(s); }));
  ok('share link: nothing of the link went out in any request', await noLeak(pg, [enc(mochi), 'prod=', 'pose=', 'from=share']));
  await pg.goBack(); await settle(pg);
  ok('share link: Back goes to the thing, and the address says so', (await view(pg)) === 'thing' && (await hash(pg)) === '#/thing');
  await pg.goBack(); await settle(pg);
  ok('share link: Back again goes to the dog list, with the quiet line', (await view(pg)) === 'pick' && (await hash(pg)) === '#/pick' && (await text(pg, '.fromq')) === QUIET1 && (await pg.$$eval('[data-pick]', (b) => b.length)) === 1);
  await pg.goForward(); await settle(pg); await pg.goForward(); await settle(pg);
  ok('share link: Forward twice is "make it" again, as it was', (await view(pg)) === 'make' && (await hash(pg)) === '#/make' && (await pg.evaluate(() => window.__merch.st.draft.pose)) === 'happy');
  await tap(pg, '#makeBack');
  ok('share link: the page\'s own Back is the thing', (await view(pg)) === 'thing' && (await hash(pg)) === '#/thing');
  await finish('share link', t);
  t = await open({ path: M1 }); pg = t.page;
  await tap(pg, '#addBtn');
  ok('share link: Add puts the happy mug in the basket', (await view(pg)) === 'basket' && JSON.stringify((await pg.evaluate(() => window.__merch.basket())).map((l) => [l.product, l.pose, l.colour, l.name_on, l.recipe])) === JSON.stringify([['mug', 'happy', 'white', true, enc(mochi)]]));
  await pg.reload(); await pg.waitForSelector('html.merch-ready'); await toHash(pg, '#/make');
  ok('share link: after a reload, #/make with nothing being made is the first step that can show', (await view(pg)) === 'pick' && (await hash(pg)) === '#/pick');
  await finish('share add', t);
  t = await open({ path: SHARE(R('Biscuit'), '&from=share&pose=sit&prod=tee') }); pg = t.page;
  ok('share link: the tee and the sit pose, the parameters in any order', (await view(pg)) === 'make' && (await pg.evaluate(() => { const d = window.__merch.st.draft; return d.product + '/' + d.pose + '/' + d.size; })) === 'tee/sit/M');
  await finish('share tee', t);
  // every other case: today's behaviour (the dog list, or the bad-link words), never a crash
  const CAT_MUGOFF = clone(CAT); CAT_MUGOFF.products.find((p) => p.id === 'mug').on = false;
  const CAT_NOHAPPY = clone(CAT); CAT_NOHAPPY.products.find((p) => p.id === 'mug').poses = ['stand', 'sit'];
  const BAD = [['an unknown product', SHARE(mochi, '&prod=hat&pose=happy&from=share')], ['stickers (not on sale)', SHARE(mochi, '&prod=stickers&pose=happy&from=share')],
    ['the mug switched off in the catalog', SHARE(mochi), CAT_MUGOFF], ['a pose the mug does not offer here', SHARE(mochi), CAT_NOHAPPY], ['a pose nobody offers', SHARE(mochi, '&prod=mug&pose=jump&from=share')],
    ['markup in the parameters', SHARE(mochi, '&prod=mug<img src=x onerror=alert(1)>&pose="><b>x</b>&from=share')], ['a product of the object prototype', SHARE(mochi, '&prod=constructor&pose=toString&from=share')],
    ['no from=share', SHARE(mochi, '&prod=mug&pose=happy')], ['from=share and nothing else', SHARE(mochi, '&from=share')], ['from=other', SHARE(mochi, '&prod=mug&pose=happy&from=game')],
    ['two dogs', SHARE([mochi, R('Bo')]), null, 2]];
  for (const [what, p, catalog, n] of BAD) {
    t = await open({ path: p, catalog: catalog || undefined }); pg = t.page;
    const nd = n || 1;
    ok('share link, ' + what + ': the dog list', (await view(pg)) === 'pick' && (await hash(pg)) === '#/pick' && (await pg.$$eval('[data-pick]', (b) => b.length)) === nd && (await text(pg, '.fromq')) === (nd === 1 ? QUIET1 : QUIETN) &&
      !(await pg.evaluate(() => window.__merch.st.draft)) && !(await pg.$('#pickBody img, #pickBody b b')));
    await finish('share ' + what, t);
  }
  for (const [what, p] of [['a broken recipe', '/merch/#p=AQEAJSCQqVT8sQIBAAVNb2NoaRjX&prod=mug&pose=happy&from=share'], ['no recipe', '/merch/#p=&prod=mug&pose=happy&from=share'], ['an empty hash', '/merch/#&prod=mug&from=share']]) {
    t = await open({ path: p }); pg = t.page;
    const v = await view(pg), body = await text(pg, '#pickBody');
    ok('share link, ' + what + ': as any bad link today, never a crash', what === 'an empty hash' ? v === 'home' : v === 'pick' && (/didn't come through whole/.test(body) || what === 'no recipe') && (await pg.$$eval('[data-pick]', (b) => b.length)) === 0, { v, body: body.slice(0, 80) });
    await finish('share ' + what, t);
  }
  // the changed screens fit: "make it" from the share link, and the dog list with the quiet line
  for (const vp of [[360, 640], [390, 844], [1280, 720]]) {
    for (const [name, p] of [['share-make', M1], ['share-pick', SHARE([mochi, R('Sir Wigglesworth III'), R('Bo')], '&prod=mug&pose=happy&from=share')]]) {
      t = await open({ path: p, vp }); pg = t.page; await pg.evaluate(() => window.scrollTo(0, 0));
      const r = await pg.evaluate(measure), tag = name + ' ' + vp.join('x');
      const q = name === 'share-pick' ? await pg.$eval('.fromq', (e) => { const b = e.getBoundingClientRect(), m = e.closest('#pickBody').getBoundingClientRect(); return b.left >= m.left - 1 && b.right <= m.right + 1 && e.scrollWidth <= e.clientWidth + 1; }) : true;
      ok('fit ' + tag + ': no sideways scroll, taps at least 44 px, text inside its card, the quiet line inside the step', r.wide <= 0 && !r.small.length && !r.spill.length && q, r);
      ok('contrast ' + tag + ': every text at least 4.5:1', r.low.length === 0, r.low);
      await finish('fit ' + tag, t);
    }
  }
}

async function routeChecks() {
  let t = await open({ save: SAVE, path: '/merch/#/make' }), pg = t.page;
  ok('deep link #/make with nothing chosen: the first step that can show, and the address says so', (await view(pg)) === 'pick' && (await hash(pg)) === '#/pick');
  await finish('deep make', t);
  t = await open({ save: SAVE, path: '/merch/#/thing' }); pg = t.page;
  ok('deep link #/thing with no dog: pick, #/pick', (await view(pg)) === 'pick' && (await hash(pg)) === '#/pick');
  await toHash(pg, '#/nowhere');
  ok('an unknown step: home, #/', (await view(pg)) === 'home' && (await hash(pg)) === '#/');
  await toHash(pg, '#/basket/zzz');
  ok('a step with junk after it: the step, its own address', (await view(pg)) === 'basket' && (await hash(pg)) === '#/basket');
  await finish('deep links', t);
  t = await open({ save: SAVE, path: '/merch/' }); pg = t.page;
  await tap(pg, '#useDog'); await tap(pg, '#pickNext'); await tap(pg, '.prodb[data-p=mug]'); await tap(pg, '#addBtn');
  ok('flow: on the basket', (await view(pg)) === 'basket' && (await hash(pg)) === '#/basket');
  await pg.goBack(); await settle(pg);
  ok('Back after Add: the step shown is in the address', (await view(pg)) === 'thing' && (await hash(pg)) === '#/thing');
  await pg.goBack(); await settle(pg);
  ok('Back again: thing', (await view(pg)) === 'thing' && (await hash(pg)) === '#/thing');
  await pg.goBack(); await settle(pg);
  ok('Back again: pick', (await view(pg)) === 'pick' && (await hash(pg)) === '#/pick');
  await pg.goForward(); await settle(pg); await pg.goForward(); await settle(pg);
  ok('Forward: thing', (await view(pg)) === 'thing' && (await hash(pg)) === '#/thing');
  await pg.goForward(); await settle(pg);
  ok('Forward: the basket', (await view(pg)) === 'basket' && (await hash(pg)) === '#/basket');
  // the footer "Questions" from any step lands on the questions
  for (const h of ['#/basket', '#/pick', '#/']) {
    await toHash(pg, h); await pg.evaluate(() => window.scrollTo(0, 0));
    await pg.click('#faqlink'); await settle(pg);
    const r = await pg.evaluate(() => { const b = document.querySelector('#faq').getBoundingClientRect(); return { top: b.top, h: innerHeight }; });
    ok('footer Questions from ' + h + ': the questions in view, #/faq', (await view(pg)) === 'home' && (await hash(pg)) === '#/faq' && r.top >= 0 && r.top < r.h * 0.5, r);
  }
  await pg.evaluate(() => window.scrollTo(0, 0)); await pg.click('#faqlink'); await settle(pg);
  ok('footer Questions again on #/faq: still lands there', (await pg.evaluate(() => document.querySelector('#faq').getBoundingClientRect().top)) < 300);
  await finish('routes', t);
  // a small phone: "Make it yours" opens with its preview in view
  for (const vp of [[360, 640], [390, 844]]) {
    t = await open({ save: SAVE, path: '/merch/#/pick', vp }); pg = t.page;
    await tap(pg, '#pickNext'); await tap(pg, '.prodb[data-p=tee]'); await settle(pg);
    const r = await pg.evaluate(() => { const b = document.querySelector('#preview').getBoundingClientRect(), h = document.querySelector('#sitehead').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, head: h.bottom, vh: innerHeight }; });
    ok('make at ' + vp.join('x') + ': the preview in view', r.top >= r.head - 2 && Math.min(r.bottom, r.vh) - r.top >= Math.min(250, r.bottom - r.top), r);
    await finish('make view ' + vp.join('x'), t);
  }
}

// ---- M2: the page against a live-style order server that answers exactly the 6.3 fields (MERCH_API set; ?demo=1 is then ignored)
async function liveChecks() {
  const t = await open({ save: SAVE, basket: NORMAL3, ship: 'CA', path: '/merch/?demo=1#/basket', live: true }), pg = t.page;
  await pg.waitForSelector('#qtable');
  ok('live api: the catalog and the quote came over HTTP', liveLog.includes('GET /live/merch/catalog') && liveLog.includes('POST /live/merch/quote'));
  ok('live api: names, totals and words from codes', (await pg.$eval('#shipSel', (s) => s.selectedOptions[0].textContent)) === 'Canada' && (await text(pg, '[data-q=total]')) === money(7397) && (await text(pg, '[data-q=ship]')) === 'Free' && /own parcels/.test(await text(pg, '#totals')));
  await tap(pg, '#payBtn'); await settle(pg);
  ok('live api: checkout 503 merch_closed is the "not open yet" card', liveLog.includes('POST /live/merch/checkout') && !(await pg.$eval('#closed', (e) => e.hidden)));
  ok('live api: no test-order button, even with ?demo=1', await pg.$eval('#demoRow', (e) => e.hidden));
  await setShip(pg, 'GB'); await settle(pg);
  ok('live api: a soon country is said kindly, once', /Coming soon to the United Kingdom/.test(await text(pg, '#shipBox')) && !/can't send orders/.test(await text(pg, '#totals')) && await pg.$eval('#payBtn', (b) => b.disabled));
  await finish('live api', t);
}

// ================= part 9 wiring (SANDBOX.md part C, P1 and P2): the order server by the page's own origin; Pay goes to Stripe only =================
// The test copy's origin is served by Playwright routes from site/ (as the test copy serves it), the test order server's routes
// (TRANSACTIONS 6.3) by the fake behind them, and Stripe's page by a stand-in: every other request is blocked, so nothing leaves the machine.
const TEST_ORIGIN = 'https://test.doodledoggo.app', TEST_API = 'https://merch-api-test.doodledoggo.app', STRIPE_PAGE = 'https://checkout.stripe.com';
const MO = (s) => 'mo_' + (s + 'A'.repeat(22)).slice(0, 22);
function siteFile(p) {
  let f = /^\/(favicon\.svg|icon-\d+\.png|doodle-doggo-(icon|logo)\.svg|site\.webmanifest)$/.test(p) ? path.join(BRAND, p) : path.join(SITE, p);
  if (!f.startsWith(SITE) && !f.startsWith(BRAND)) return null;
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { if (fs.existsSync(f + '.html')) f += '.html'; }
  try { return { body: fs.readFileSync(f), contentType: TYPES[path.extname(f)] || 'application/octet-stream' }; } catch (e) { return null; }
}
// the test Worker as the page meets it: its routes, its CORS for the test copy only, the fake's answers. W.pay: what checkout answers instead
// ({ status, body }, a function of the body, or 'abort': the network fails)
const W = { log: [], pay: null, tok: [] };
async function workerRoute(route) {
  const q = route.request(), p = new URL(q.url()).pathname, m = q.method(), origin = q.headers().origin || '';
  const cors = origin === TEST_ORIGIN ? { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'Content-Type, X-Merch-Test-Token' } : {}; // worker.js on MERCH_TEST=1
  if (m === 'OPTIONS') return route.fulfill({ status: cors['access-control-allow-origin'] ? 204 : 403, headers: cors, body: '' });
  W.log.push(m + ' ' + p + (origin === TEST_ORIGIN ? '' : ' (origin ' + origin + ')')); W.tok.push(m + ' ' + p + ' ' + (q.headers()['x-merch-test-token'] || '-'));
  const send = (st, j) => route.fulfill({ status: st, headers: Object.assign({ 'content-type': 'application/json' }, cors), body: JSON.stringify(j) });
  const bad = (e) => send(e.status || 503, Object.assign({}, e, { status: undefined }));
  let b = null; try { b = q.postData() ? JSON.parse(q.postData()) : null; } catch (e) { return send(400, { error: 'bad_json' }); }
  const go = (pr) => pr.then((x) => send(200, x), bad);
  let mm;
  if (m === 'GET' && p === '/merch/catalog') return go(LIVE.catalog());
  if (m === 'POST' && p === '/merch/quote') return go(LIVE.quote(b));
  if (m === 'POST' && p === '/merch/checkout') {
    if (!W.pay) return go(LIVE.checkout(b));
    const a = typeof W.pay === 'function' ? W.pay(b) : W.pay; if (a === 'abort') return route.abort('internetdisconnected');
    return send(a.status, a.body);
  }
  if ((mm = /^\/merch\/order\/([^/]+)(?:\/(cancel|address|refund|wait))?$/.exec(p))) { // ledger.js: the order and its four buttons
    const id = decodeURIComponent(mm[1]), act = mm[2];
    if (!act && m === 'GET') return go(LIVE.order(id));
    if (act && m === 'POST') return go(act === 'cancel' ? LIVE.cancel(id, b || {}) : act === 'wait' ? LIVE.wait(id) : act === 'address' ? LIVE.address(id, b || {}) : LIVE.refundHeld(id));
  }
  send(404, { error: 'not_found' });
}
// a fresh context whose pages open at `origin` (seeded like open()); t.stripe: the Stripe pages asked for; t.blocked: anything else
async function openAt(origin, o) {
  o = o || {};
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' }), stripe = [], blocked = [];
  if (o.clock) await ctx.clock.setFixedTime(o.clock);
  await ctx.route('**/*', (r) => { blocked.push(r.request().url()); return r.abort('blockedbyclient'); });
  await ctx.route(origin + '/**', (r) => { const f = siteFile(decodeURIComponent(new URL(r.request().url()).pathname)); return f ? r.fulfill({ status: 200, contentType: f.contentType, body: f.body }) : r.fulfill({ status: 404, body: '' }); });
  await ctx.route(TEST_API + '/**', workerRoute);
  await ctx.route(STRIPE_PAGE + '/**', (r) => { stripe.push(r.request().method() + ' ' + r.request().url()); return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Stripe stand-in</title><p>stand-in</p>' }); });
  await ctx.addInitScript((seed) => {
    if (!localStorage.getItem('__seeded')) { localStorage.setItem('__seeded', '1'); if (seed.save) localStorage.setItem('pawhaven_proto_v1', seed.save); if (seed.basket) localStorage.setItem('dd_merch_basket_v1', seed.basket); if (seed.ship) localStorage.setItem('dd_merch_ship_v1', seed.ship); }
  }, { save: o.save || '', basket: o.basket ? JSON.stringify(o.basket) : '', ship: o.ship || '' });
  const t = { ctx, stripe, blocked, errors: [], dialogs: [] };
  t.tab = async (p) => {
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error' && !/status of (4\d\d|5\d\d)|ERR_INTERNET_DISCONNECTED/.test(m.text())) t.errors.push(m.text()); });
    page.on('pageerror', (e) => t.errors.push(String(e)));
    page.on('dialog', (d) => { t.dialogs.push(d.message()); d.dismiss().catch(() => {}); });
    await page.goto(origin + (p || '/merch/')); await page.waitForSelector('html.merch-ready', { timeout: 20000 }); t.page = page; return page;
  };
  return t;
}
async function finishAt(name, t) {
  ok(name + ': no console errors', t.errors.length === 0, t.errors.slice(0, 3));
  ok(name + ': nothing else was asked for (no request left the machine)', t.blocked.length === 0, t.blocked.slice(0, 3));
  ok(name + ': no dialog opened', t.dialogs.length === 0, t.dialogs);
  await t.ctx.close();
}
async function wiringChecks() {
  // ---- P1: the address of the order server, from the page's origin exactly (api.js run on its own, as the browser runs it)
  const vm = require('vm');
  const apiAt = (origin) => { const G = { location: origin === undefined ? undefined : { origin }, MerchFake: () => ({ test: true }), PawPrint: {} }; vm.runInNewContext(API_JS, { self: G }); return G.MerchApi; };
  const a = apiAt(TEST_ORIGIN);
  ok('P1: the test copy talks to the test order server', a.MERCH_API === TEST_API && a.make().mode === 'live', a.MERCH_API);
  for (const o of ['https://doodledoggo.app', 'https://www.doodledoggo.app', 'http://test.doodledoggo.app', 'https://test.doodledoggo.app:8443', 'https://test.doodledoggo.app.example', 'https://xtest.doodledoggo.app',
    'https://merch-api-test.doodledoggo.app', 'http://127.0.0.1:8765', 'http://localhost:8765', 'https://an9ou.itch.io', 'null', '', undefined, '__proto__', 'constructor', 'hasOwnProperty']) {
    const x = apiAt(o); ok('P1: ' + JSON.stringify(o) + ' uses the page\'s own fake', x.MERCH_API === '' && x.make().mode === 'test', x.MERCH_API);
  }
  // ---- the test copy in a browser: the live client, every call to the test order server, never the stand-in catalog
  let t = await openAt(TEST_ORIGIN, { save: SAVE, basket: NORMAL3, ship: 'US' }); let pg = await t.tab('/merch/#/basket'); const asked = [];
  pg.on('request', (r) => asked.push(r.url()));
  await pg.waitForSelector('#qtable');
  ok('P1 test copy: the live client', (await pg.evaluate(() => [window.MerchApi.MERCH_API, window.__merch.api.mode].join())) === TEST_API + ',live');
  ok('P1 test copy: the catalog and the quote came from the test order server', W.log.includes('GET /merch/catalog') && W.log.includes('POST /merch/quote') && !W.log.some((x) => /origin/.test(x)), W.log);
  await pg.reload(); await pg.waitForSelector('#qtable');
  ok('P1 test copy: never the stand-in catalog.json', !asked.some((u) => /catalog\.json/.test(u)), asked.filter((u) => /catalog/.test(u)));
  await finishAt('P1 test copy', t);
  for (const origin of ['https://doodledoggo.app', BASE]) {
    const n0 = W.log.length; t = await openAt(origin, { save: SAVE, basket: NORMAL3, ship: 'US' }); pg = await t.tab('/merch/#/basket'); await pg.waitForSelector('#qtable');
    ok('P1 ' + origin + ': the page\'s own fake, no order server', (await pg.evaluate(() => [window.MerchApi.MERCH_API, window.__merch.api.mode].join())) === ',test' && W.log.length === n0, W.log.slice(n0));
    await finishAt('P1 ' + origin, t);
  }
  // ---- P2: Pay goes to Stripe's page with a good answer, only there; the navigation is caught by a stand-in (Stripe is never loaded)
  t = await openAt(TEST_ORIGIN, { save: SAVE, basket: NORMAL3, ship: 'US' });
  const PAYURL = STRIPE_PAGE + '/c/pay/cs_test_a1B2c3D4e5#fidkdWxOYHwnPyd1blpxYHZxWjA0', nonces = [];
  W.pay = (b) => { nonces.push(b.nonce); return { status: 200, body: { order: MO('PAYGOOD'), url: PAYURL } }; };
  pg = await t.tab('/merch/#/basket'); await pg.waitForSelector('#qtable');
  await Promise.all([pg.waitForURL(/^https:\/\/checkout\.stripe\.com\//, { timeout: 10000 }).catch(() => null), pg.click('#payBtn')]);
  ok('P2 good url: the page went to Stripe\'s payment page', pg.url() === PAYURL && t.stripe.length === 1 && t.stripe[0] === 'GET ' + PAYURL.split('#')[0], [pg.url(), t.stripe]);
  ok('P2 good url: one checkout, with a nonce', nonces.length === 1 && /^[0-9a-f]{24}$/.test(nonces[0]), nonces);
  // a bad url: the kind error, no navigation, nothing asked of any other host
  const BAD = ['http://checkout.stripe.com/c/pay/cs_test_x', 'https://checkout.stripe.com.evil.example/c/pay/x', 'https://evil.example/?u=https://checkout.stripe.com/', 'https://pay.stripe.com/c/pay/x',
    'https://checkout.stripe.test/c/pay/cs_test_x', 'javascript:alert(1)', '//checkout.stripe.com/c/pay/x', ' https://checkout.stripe.com/c/pay/x', 'https://checkout.stripe.com', 'HTTPS://CHECKOUT.STRIPE.COM/c/pay/x',
    'https://checkout.stripe.com/c/pay/x"><img src=x onerror=alert(1)>', 'https://checkout.stripe.com/c/pay/x\\@evil.example', 'https://checkout.stripe.com/' + 'x'.repeat(2100), '', null, 42, ['https://checkout.stripe.com/x'], undefined];
  pg = await t.tab('/merch/#/basket'); await pg.waitForSelector('#qtable'); const url0 = pg.url();
  for (const u of BAD) {
    W.pay = { status: 200, body: u === undefined ? { order: MO('NOURL') } : { order: MO('BADURL'), url: u } };
    await tap(pg, '#payBtn'); await settle(pg);
    const s = await text(pg, '#payErr'), tag = 'P2 bad url ' + JSON.stringify(u === undefined ? '(none)' : u).slice(0, 60);
    ok(tag + ': "We couldn\'t reach the payment page", the page stays', /We couldn't reach the payment page\. Nothing was paid\. Try again in a moment\./.test(s) && pg.url() === url0 && (await pg.$eval('#closed', (e) => e.hidden)) && !(await pg.$('#payErr img')), [s, pg.url()]);
  }
  ok('P2 bad urls: Stripe was asked once only (the good url)', t.stripe.length === 1, t.stripe);
  W.pay = { status: 200, body: null }; await tap(pg, '#payBtn'); await settle(pg);
  ok('P2 an answer that is not an object: the same error', /couldn't reach the payment page/.test(await text(pg, '#payErr')) && pg.url() === url0);
  // each checkout error, over HTTP from the test order server, in its own words; none navigates
  const LIVE_ERR = PAY_ERR.map(([c, re, ln]) => [c, 409, re, ln]).concat([['bad_nonce', 400, /Something went wrong on our side\. Reload the page/], ['busy', 503, /a little busy just now/, 0, { say: "We couldn't reach the payment page. Nothing was paid." }],
    ['nonce_used', 409, /This basket was already sent to the payment page once\. See that order, or tap Pay again to start a new payment\./, 0, { order: MO('USEDBEFORE') }], ['bad_json', 400, /couldn't work out the total just now/]]);
  for (const [code, st, re, ln, more] of LIVE_ERR) {
    W.pay = { status: st, body: Object.assign({ error: code }, ln ? { line: ln } : {}, more || {}) };
    await tap(pg, '#payBtn'); await settle(pg);
    const s = await text(pg, '#payErr');
    ok('P2 live error ' + code + ': its own words, no payment page', re.test(s) && !(await pg.$eval('#payErr', (e) => e.hidden)) && (await pg.$eval('#closed', (e) => e.hidden)) && pg.url() === url0, s);
    await pg.evaluate(() => window.__merch.requote()); await pg.waitForSelector('#qtable');
  }
  // nonce_used: a link to that order (a checked id only), and the next tap starts a new payment (a new nonce)
  const seen = []; W.pay = (b) => { seen.push(b.nonce); return { status: 409, body: { error: 'nonce_used', order: MO('USEDBEFORE') } }; };
  await tap(pg, '#payBtn'); await settle(pg);
  ok('P2 nonce_used: a link to that order', (await pg.$eval('#payErr a', (x) => x.getAttribute('href')).catch(() => '')) === '#/order/' + MO('USEDBEFORE'));
  await tap(pg, '#payBtn'); await settle(pg);
  ok('P2 nonce_used: the next tap is a new payment (a new nonce)', seen.length === 2 && seen[0] !== seen[1], seen);
  W.pay = { status: 409, body: { error: 'nonce_used', order: 'mo_"><b>x</b>' } }; await tap(pg, '#payBtn'); await settle(pg);
  ok('P2 nonce_used with an odd order id: no link, nothing of it on the page', !(await pg.$('#payErr a')) && !(await pg.$('#payErr b')) && /Tap Pay again/.test(await text(pg, '#payErr')));
  W.pay = { status: 503, body: { error: 'merch_closed' } }; await tap(pg, '#payBtn'); await settle(pg);
  ok('P2 live merch_closed: the "not open yet" card, no error box', !(await pg.$eval('#closed', (e) => e.hidden)) && (await pg.$eval('#payErr', (e) => e.hidden)) && pg.url() === url0);
  ok('P2 live: no test-order button', await pg.$eval('#demoRow', (e) => e.hidden));
  W.pay = 'abort'; await tap(pg, '#payBtn'); await settle(pg);
  ok('P2 live network error: "couldn\'t reach the shop"', /couldn't reach the shop/.test(await text(pg, '#payErr')) && pg.url() === url0, await text(pg, '#payErr'));
  W.pay = null;
  ok('P2: Stripe was asked for once in all (the good url)', t.stripe.length === 1, t.stripe);
  await finishAt('P2 live', t);
  // the page's own fake never pays, even if a checkout answered with a Stripe url
  t = await open({ save: SAVE, basket: NORMAL3, ship: 'US', path: '/merch/#/basket' }); pg = t.page; await pg.waitForSelector('#qtable');
  await pg.evaluate((u) => { window.__merch.api.checkout = () => Promise.resolve({ order: 'mo_x', url: u }); }, PAYURL);
  const navs0 = t.navs.length; await tap(pg, '#payBtn'); await pg.waitForTimeout(200);
  ok('P2 test mode: a Stripe url from the fake is never followed (the "not open yet" card)', t.navs.length === navs0 && !(await pg.$eval('#closed', (e) => e.hidden)) && t.outside.length === 0, t.navs);
  await finish('P2 test mode', t);

  // ---- the late cancel that waits for the printer (refund: 'pending', R3-m3): the fake answers it as the Worker does
  const F = MerchFake({ PawPrint: P, catalog: CAT }), lo = mkOrder('latepend', (o) => { late(o); o._fail = { late: 'pending' }; }); F.put(lo);
  const r1 = await F.cancel(lo.id, { scope: 'late' }), v1 = await F.order(lo.id), r2 = await F.cancel(lo.id, { scope: 'late' }).then(() => null, (e) => e);
  ok('fake: late cancel while the printer can\'t be read: refund pending, the Worker\'s fields', keys(r1) === 'asked,refund,say,status' && r1.refund === 'pending' && r1.status === 'confirmed' && r1.asked === true, r1);
  ok('fake: after it, nothing refunded yet and no delay choice; a second tap is not_late', v1.late === false && v1.totals.refunded === 0 && v1.lines.every((l) => l.refunded_qty === 0 && l.status === 'confirmed') && r2 && r2.error === 'not_late', [v1.late, v1.totals, r2]);
  ok('fake: the hook is not in the order\'s answer', keys(v1) === F_ORDER.join(), keys(v1));
  t = await open({ save: SAVE, path: '/merch/#/', clock: FIX }); pg = t.page;
  await showOrder(pg, mkOrder('latepend', (o) => { late(o); o._fail = { late: 'pending' }; }));
  await tap(pg, '#lateCancel'); await tap(pg, '#askYes'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('late pending: "your cancel is in, the refund follows", the choice gone, nothing refunded yet', /^Your cancel is in\. We're checking with our print partner, and your refund follows: we'll email you\.$/.test(await text(pg, '.oknote')) && !(await pg.$('#lateBox')) && (await text(pg, '#h-order-t')) !== 'Your order is refunded' && !(await pg.$('[data-q=refunded]')), [await text(pg, '.oknote'), await text(pg, '#h-order-t')]);
  await finish('late pending', t);

  // ---- the live client's whole path on the test copy: the order and its four buttons reach the test order server's routes
  t = await openAt(TEST_ORIGIN, { save: SAVE, clock: FIX }); pg = await t.tab('/merch/#/');
  const go = async (o) => { LIVE.put(o); await toHash(pg, '#/order/' + o.id); await pg.waitForSelector('#h-order-t'); await settle(pg); };
  const n1 = W.log.length, lp = mkOrder('livelate', (o) => { late(o); o._fail = { late: 'pending' }; });
  await go(lp); await tap(pg, '#lateWait'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('live client: Keep waiting', /Thank you for waiting/.test(await text(pg, '.oknote')) && W.log.includes('POST /merch/order/' + lp.id + '/wait'));
  await tap(pg, '#lateCancel'); await tap(pg, '#askYes'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('live client: the late cancel answered refund: pending (the Worker\'s answer) is said as it is', /^Your cancel is in\. We're checking with our print partner/.test(await text(pg, '.oknote')) && !(await pg.$('#lateBox')) && W.log.includes('POST /merch/order/' + lp.id + '/cancel'), await text(pg, '.oknote'));
  const ad = mkOrder('liveaddr', STATES.find((x) => x[0] === 'address')[1]); await go(ad);
  for (const [k, v] of Object.entries({ name: 'Pat Tester', line1: '9 New Lane', city: 'Testville', state: 'NY', postal: 'QZ-9Q9' })) await pg.$eval('#af-' + k, (e, x) => { e.value = x; }, v);
  await tap(pg, '#addrSend'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('live client: the address', /Thanks! We.ll send it there\./.test(await text(pg, '.oknote')) && W.log.includes('POST /merch/order/' + ad.id + '/address'));
  const rf = mkOrder('liverefund', STATES.find((x) => x[0] === 'address')[1]); await go(rf);
  await tap(pg, '#addrRefund'); await tap(pg, '#askYes'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('live client: refund me instead', (await text(pg, '#h-order-t')) === 'Your order is refunded' && W.log.includes('POST /merch/order/' + rf.id + '/refund'));
  const cn = mkOrder('livecancel'); await go(cn); await tap(pg, '#cancelBtn'); await tap(pg, '#cancelYes'); await settle(pg); await settle(pg);
  ok('live client: cancel in the hour', (await text(pg, '#h-order-t')) === 'Your order is cancelled' && W.log.includes('POST /merch/order/' + cn.id + '/cancel'), await text(pg, '#h-order-t'));
  await toHash(pg, '#/order/' + MO('NOSUCH')); await pg.waitForSelector('#h-order-t'); await settle(pg);
  ok('live client: an order the server does not know', /We couldn't find this order/.test(await text(pg, '#h-order-t')));
  const calls = W.log.slice(n1);
  ok('live client: every call was a route of the order server', calls.length > 0 && calls.every((c) => /^(GET \/merch\/order\/[^/]+|POST \/merch\/order\/[^/]+\/(cancel|wait|address|refund)|GET \/merch\/catalog|POST \/merch\/quote)$/.test(c)), calls);
  await finishAt('live client', t);
  // ---- fourth review (R4-m4): the shared test token, from the test copy's /merch/test_cfg.json (served behind the test password, G3), on every POST
  const TOK = 'tok_page_check_0123456789abcdefghijklmnop';
  for (const [cfg, want] of [[{ token: TOK }, TOK], [null, '-'], [{ token: 'short' }, '-']]) {
    t = await openAt(TEST_ORIGIN, { save: SAVE, basket: NORMAL3, ship: 'US' }); const cfgAsked = [];
    await t.ctx.route(TEST_ORIGIN + '/merch/test_cfg.json', (r) => { cfgAsked.push(r.request().url()); return cfg ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cfg) }) : r.fulfill({ status: 404, body: '' }); });
    W.pay = { status: 403, body: { error: 'test_only' } }; const n2 = W.tok.length;
    pg = await t.tab('/merch/#/basket'); await pg.waitForSelector('#qtable'); await tap(pg, '#payBtn'); await settle(pg);
    const sent = W.tok.slice(n2), tag = 'R4-m4 page, config ' + JSON.stringify(cfg);
    ok(tag + ': the checkout ' + (want === '-' ? 'without' : 'with') + ' the token', sent.some((x) => x === 'POST /merch/checkout ' + want) && sent.filter((x) => /^POST /.test(x)).every((x) => x.endsWith(' ' + want)), sent);
    ok(tag + ': GETs never carry it; the config read once', sent.filter((x) => /^GET /.test(x)).every((x) => x.endsWith(' -')) && cfgAsked.length === 1, [sent, cfgAsked]);
    ok(tag + ': no payment page', t.stripe.length === 0 && /\/merch\//.test(pg.url()), pg.url());
    await finishAt(tag, t);
  }
  W.pay = null;
  const n3 = W.tok.length; t = await openAt(BASE, { save: SAVE, basket: NORMAL3, ship: 'US' }); const asked2 = [];
  pg = await t.tab('/merch/#/basket'); pg.on('request', (r) => asked2.push(r.url())); await pg.waitForSelector('#qtable'); await pg.reload(); await pg.waitForSelector('#qtable');
  ok('R4-m4 page: away from the test copy the config is never asked for', !asked2.some((u) => /test_cfg/.test(u)) && W.tok.length === n3, asked2.filter((u) => /test_cfg/.test(u)));
  await finishAt('R4-m4 page elsewhere', t);
}

// ================= part 9: the phone review (M1-M8, m1-m10) and the art review (M1, m1, m2, m4) fixes on the shop page =================
// the drawn mug's face: which x of the 2700 px wrap shows at the face's left and right edge (mock.js mug(): the face window is x 30 to 100)
const mugFaces = (pg, sel) => pg.$$eval(sel, (l) => l.map((g) => { const m = /translate\(([-\d.]+) [-\d.]+\) scale\(([\d.]+)\)/.exec(g.getAttribute('transform')); return m ? [Math.round((30 - +m[1]) / +m[2]), Math.round((100 - +m[1]) / +m[2])] : null; }));
// past "Which dog?" after a tap on a dog (the page does it by itself since part 9 M7, checked on its own; this only lets these checks reach
// their own steps on an older page too, to see them fail there)
const onward = async (pg) => { if ((await view(pg)) === 'pick') await tap(pg, '#pickNext'); };
// each part of these checks runs on its own: one that throws (a page that never got there) is one failed check, and the rest still run
async function blk(name, fn) { try { await fn(); } catch (e) { ok('part 9 ' + name + ': ran to the end', false, String(e && e.message || e).split('\n')[0]); } }
async function part9Checks() {
  let t, pg;
  // M1: the keyboard up (a short screen) while typing the name: the bar is not over the field or its message; the reason Add is off sits in the bar
  await blk('M1 m5 m6', async () => {
    for (const vp of [[360, 640], [390, 844]]) {
      let t = await open({ save: SAVE, path: '/merch/#/pick', vp }), pg = t.page;
      await tap(pg, '[data-pick]'); await onward(pg); await tap(pg, '.prodb[data-p=tee]'); await settle(pg);
      await pg.focus('#nameIn'); await pg.fill('#nameIn', 'Mochi金'); await settle(pg);
      await pg.setViewportSize({ width: vp[0], height: 330 }); await pg.waitForTimeout(300);
      const k = await pg.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), i = r('#nameIn'), m = r('#nameMsg'), b = r('.paybar'), h = r('#sitehead');
        const hit = (a) => !(a.bottom <= b.top || a.top >= b.bottom); return { inView: i.top >= h.bottom - 1 && Math.max(i.bottom, m.bottom) <= innerHeight + 1, covered: hit(i) || hit(m), focus: document.activeElement.id, i: [i.top, i.bottom], m: [m.top, m.bottom], bar: [b.top, b.bottom], vh: innerHeight }; });
      ok('part 9 M1 ' + vp[0] + ': keyboard up, the name field and its message in view and not under the price bar', k.inView && !k.covered && k.focus === 'nameIn', k);
      await pg.evaluate(() => document.activeElement.blur()); await pg.setViewportSize({ width: vp[0], height: vp[1] }); await settle(pg);
      await pg.evaluate(() => { const o = document.querySelector('#o-col').getBoundingClientRect(); window.scrollBy(0, o.top - 120); }); await settle(pg); // mid-way down the choices: the bar is stuck to the bottom
      const a = await pg.evaluate(() => { const m = document.querySelector('#addMsg'), b = document.querySelector('.paybar').getBoundingClientRect(), r = m.getBoundingClientRect(); return { inBar: !!m.closest('.paybar'), shown: r.height > 0 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && r.bottom <= innerHeight + 1, sticky: getComputedStyle(document.querySelector('.paybar')).position, text: m.textContent }; });
      ok('part 9 M1 ' + vp[0] + ': why Add is off is said inside the (sticky) bar, in view', a.inBar && a.shown && a.sticky === 'sticky' && /Fix the name first/.test(a.text), a);
      ok('part 9 m5: the sticky bar keeps clear of an iPhone\'s home bar', await pg.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.selectorText === '.paybar' && /env\(safe-area-inset-bottom\)/.test(r.cssText)); } catch (e) { return false; } })));
      // m6: the size guide never touches the size chips
      const g = await pg.evaluate(() => { const s = document.querySelector('#sgBtn').getBoundingClientRect(); return s.top - Math.max(...[...document.querySelectorAll('[data-size]')].map((b) => b.getBoundingClientRect().bottom)); });
      ok('part 9 m6 ' + vp[0] + ': "Size guide" sits at least 6 px below the size chips', g >= 6, g);
      await finish('part 9 make ' + vp[0], t);
    }
  });
  await blk('M2 M4 M8 m7', async () => {
    // M2, M4: one tee to the US (under $35), a mug just under the edge, Hong Kong (never free)
    t = await open({ save: SAVE, basket: [line(R('Mochi'), 'tee', { size: '4XL' })], ship: 'US', path: '/merch/#/basket', vp: [360, 640] }); pg = t.page;
    await pg.waitForSelector('#qtable');
    const zus = CAT.zones.find((z) => z.id === 'us_jp'), tee4 = CAT.products.find((p) => p.id === 'tee').price + CAT.products.find((p) => p.id === 'tee').sizes.find((s) => s.id === '4XL').add;
    ok('part 9 M2: the rule counts the things before shipping, and says how much more ships it free (from the catalog)', (await text(pg, '#shipBox .shipline')) === 'Shipping to the United States: ' + money(zus.fee) + '. Free shipping when your things come to $' + zus.free_from / 100 + ' or more (before shipping).' &&
      (await text(pg, '#freeMore')) === 'Add ' + money(zus.free_from - tee4) + ' more for free shipping.' && (await text(pg, '[data-q=subtotal]')) === money(tee4), [await text(pg, '#shipBox .shipline'), await text(pg, '#freeMore')]);
    ok('part 9 M4: the delivery time is from payment to the door, printing included, then the one posting promise', (await text(pg, '#shipBox .eta span:last-child')) === 'About ' + zus.eta[0] + ' to ' + zus.eta[1] + ' working days from payment to your door, printing included. Printing usually takes 2 to 5 working days, and we post every order within ' + CATJS.SHIP_BY_DAYS + ' working days of payment.', await text(pg, '#shipBox .eta'));
    ok('part 9 M4: the questions say it the same way (no "then the post")', /Your basket shows how long it usually takes from payment to your door, printing included\./.test(HTML) && !/Then the post/.test(HTML));
    // M8, m7: the Japan notice and "Seller details" by the pay card and in the footer; links never touching, no dots left dangling
    for (const [w, h] of [[360, 640], [390, 844]]) {
      await pg.setViewportSize({ width: w, height: h }); await settle(pg);
      const f = await pg.evaluate(() => { const rows = (sel) => { const r = [...document.querySelectorAll(sel)].map((a) => a.getBoundingClientRect()); let touch = 0; r.forEach((a, i) => r.forEach((b, j) => { if (i < j && a.left < b.right && b.left < a.right && Math.abs(a.top - b.top) > 2 && !(a.bottom + 4 <= b.top || b.bottom + 4 <= a.top)) touch++; })); return touch; };
        return { foot: rows('.mfoot a'), pay: rows('.paylinks a, #basketPayText a'), dots: /·/.test(document.querySelector('.mfoot').textContent), paren: /\(\s*$|^\s*\)/m.test(document.querySelector('.paylinks').previousElementSibling.textContent) || /\(/.test(document.querySelector('.paylinks').previousElementSibling.textContent),
          ja: [...document.querySelectorAll('.mfoot a[href="/merch/tokushoho/"], .paylinks a[href="/merch/tokushoho/"]')].length, seller: [...document.querySelectorAll('.mfoot a, .paylinks a')].filter((a) => a.getAttribute('href') === '/merch/seller/').every((a) => a.textContent === 'Seller details') }; });
      ok('part 9 M8/m7 ' + w + ': the Japan notice in the footer and by the pay card, "Seller details", rows of links never touching, no dangling dots or brackets', f.ja === 2 && f.seller && !f.foot && !f.pay && !f.dots && !f.paren, f);
    }
    await finish('part 9 basket', t);
  });
  for (const p of ['tokushoho', 'seller']) ok('part 9 M8: /merch/' + p + '/ exists', fs.existsSync(path.join(SITE, 'merch', p, 'index.html')));
  const CAT_E = clone(CAT_EDGE);
  await blk('M2 amounts', async () => {
    t = await open({ save: SAVE, basket: [line(R('Mochi'), 'mug')], ship: 'US', path: '/merch/#/basket', catalog: CAT_E }); pg = t.page; await pg.waitForSelector('#qtable');
    ok('part 9 M2: the amount to add comes from the catalog ($34.99 mug: add $0.01)', (await text(pg, '#freeMore')) === 'Add $0.01 more for free shipping.', await text(pg, '#freeMore'));
    await setShip(pg, 'HK'); await pg.waitForSelector('#qtable');
    ok('part 9 M2: where shipping is never free, no free-shipping line', !(await pg.$('#freeMore')) && !/free shipping/i.test(await text(pg, '#shipBox') + await text(pg, '#totals')));
    await setShip(pg, 'US'); await pg.click('.bl [data-qp]'); await pg.waitForSelector('#qtable'); await settle(pg);
    ok('part 9 M2: at the threshold or over, no "add more" line (the Shipping row says Free)', !(await pg.$('#freeMore')) && (await text(pg, '[data-q=ship]')) === 'Free');
    ok('second review R2-m3: at the threshold or over, the Shipping box says the shipping is free too (never the fee)', (await text(pg, '#shipBox .shipline')) === 'Your shipping to the United States is free: your things come to $' + CAT_E.zones.find((z) => z.id === 'us_jp').free_from / 100 + ' or more.' && !/\$\d/.test((await text(pg, '#shipBox .shipline')).replace(/\$\d+ or more/, '')), await text(pg, '#shipBox .shipline'));
    await finish('part 9 free shipping', t);
  });
  await blk('M3', async () => {
    // M3: a basket line is a "design", everywhere on the page; "things" are what gets made (the bag, the Things row)
    t = await open({ save: SAVE, basket: ['Biscuit', 'Mochi', 'Sir Wigglesworth III', 'Bo', 'Pepper'].map((n) => line(R(n), 'mug', { qty: 2 })).concat([line(R('Pepper'), 'tee')]), ship: 'US', path: '/merch/#/basket', vp: [360, 640] }); pg = t.page;
    await pg.waitForSelector('#qtable');
    const body = await pg.evaluate(() => document.querySelector('.msheet').innerText);
    ok('part 9 M3: six lines: "6 different designs, up to 3 of each", and the count of things is 11', /Your basket holds up to 6 different designs, up to 3 of each\./.test(body) && /Things \(11\)/.test(body) && (await text(pg, '#bagN')) === '11' && !/\b6 things\b|things in one order|holds up to \d+ things/.test(body), body.slice(0, 300));
    ok('part 9 M3: the page\'s own words call a line a design (no "One thing in your basket" anywhere)', !/One thing in your basket|things in your basket|up to ' \+ maxLines\(\) \+ ' things/.test(MERCH_JS) && /different designs/.test(MERCH_JS));
    await finish('part 9 designs', t);
  });
  await blk('m3', async () => {
    // m3: a country coming soon: the line prices from the catalog, said once, "Soon:" first in the picker
    t = await open({ save: SAVE, basket: [line(R('Mochi'), 'tee', { size: '2XL' }), line(R('Bo'), 'mug', { qty: 2 })], ship: 'GB', path: '/merch/#/basket', vp: [360, 640] }); pg = t.page; await settle(pg); await settle(pg);
    ok('part 9 m3: coming soon: each line still shows its price (the catalog\'s)', (await pg.$$eval('.bl .lp', (x) => x.map((y) => y.textContent).join())) === [money(2899), money(2 * 1999)].join() && !(await pg.$('#totals .qerr')) && /Coming soon to the United Kingdom/.test(await text(pg, '#shipBox')));
    ok('part 9 m3: the picker says "Soon:" before the name, so a narrow picker never hides it', (await pg.$eval('#shipSel', (s) => s.selectedOptions[0].textContent)) === 'Soon: United Kingdom');
    await finish('part 9 soon', t);
  });
  await blk('M7 m1', async () => {
    // M7: a tap on one of your own dogs goes on to "the thing"; Back changes the dog
    t = await open({ save: SAVE, path: '/merch/#/pick', vp: [360, 640] }); pg = t.page;
    await pg.evaluate(() => { [...document.querySelectorAll('[data-pick]')].find((x) => x.querySelector('.n').textContent === 'Biscuit').click(); }); await settle(pg);
    ok('part 9 M7: a tap on a dog goes straight on to the thing, with that dog', (await view(pg)) === 'thing' && (await hash(pg)) === '#/thing' && /Biscuit/.test(await text(pg, '#h-thing')));
    await pg.goBack(); await settle(pg);
    ok('part 9 M7: Back is the dog list again, that dog marked, to change it', (await view(pg)) === 'pick' && (await pg.$eval('[data-pick][aria-pressed=true] .n', (e) => e.textContent)) === 'Biscuit');
    await pg.evaluate(() => { [...document.querySelectorAll('[data-pick]')].find((x) => x.querySelector('.n').textContent === 'Pepper').click(); }); await settle(pg);
    ok('part 9 M7: another dog, another thing', (await view(pg)) === 'thing' && /Pepper/.test(await text(pg, '#h-thing')));
    await finish('part 9 pick', t);
  });
  await blk('m1', async () => {
    // m1: a reload on "make it" keeps every choice; Back is still the thing
    t = await open({ save: SAVE, path: '/merch/#/pick', vp: [360, 640] }); pg = t.page;
    await pg.evaluate(() => { [...document.querySelectorAll('[data-pick]')].find((x) => x.querySelector('.n').textContent === 'Pepper').click(); }); await settle(pg); await onward(pg);
    await tap(pg, '.prodb[data-p=tee]'); await tap(pg, '[data-col=navy]'); await tap(pg, '[data-size=L]'); await tap(pg, '[data-pose=sit]'); await pg.fill('#nameIn', 'Pep'); await tap(pg, '#qp');
    await pg.reload(); await pg.waitForSelector('html.merch-ready'); await settle(pg);
    const dr = await pg.evaluate(() => { const d = window.__merch.st.draft; return d && [d.product, d.colour, d.size, d.pose, d.name, d.qty].join(); });
    ok('part 9 m1: a reload keeps the dog, colour, size, pose, name and how many', (await view(pg)) === 'make' && dr === 'tee,navy,L,sit,Pep,2' && (await pg.$eval('#nameIn', (i) => i.value)) === 'Pep' && /Pepper/.test(await text(pg, '.dn')), dr);
    await tap(pg, '#makeBack');
    ok('part 9 m1: then Back is the thing, with that dog', (await view(pg)) === 'thing' && /Pepper/.test(await text(pg, '#h-thing')));
    await tap(pg, '.prodb[data-p=mug]'); await tap(pg, '#addBtn'); await pg.waitForSelector('#qtable');
    await pg.click('.bl [data-chg]'); await settle(pg); await tap(pg, '[data-pose=happy]');
    await pg.reload(); await pg.waitForSelector('html.merch-ready'); await settle(pg);
    ok('part 9 m1: a reload while changing a line still changes that line ("Save changes")', (await view(pg)) === 'make' && (await text(pg, '#addBtn')) === 'Save changes' && (await pg.evaluate(() => window.__merch.st.draft.pose)) === 'happy');
    await tap(pg, '#addBtn'); await pg.waitForSelector('#qtable');
    ok('part 9 m1: saved in place (one line, happy)', (await pg.evaluate(() => window.__merch.basket().map((l) => l.pose).join())) === 'happy');
    await finish('part 9 reload', t);
  });
  await blk('m2 m10', async () => {
    // m2: an empty basket from the bag ticks nothing; its button asks for a first dog
    t = await open({ save: SAVE, path: '/merch/', vp: [360, 640] }); pg = t.page;
    await tap(pg, '#bagBtn');
    ok('part 9 m2: an empty basket ticks no step it hasn\'t seen', (await view(pg)) === 'basket' && (await pg.$$eval('#steps li.done', (l) => l.length)) === 0 && (await pg.$$eval('#steps li button:not(:disabled)', (l) => l.length)) === 0);
    ok('part 9 m2: and its button says "Put your dog on something"', (await text(pg, '#another')) === 'Put your dog on something');
    // m10: "No dog yet?" only without dogs
    await toHash(pg, '#/');
    ok('part 9 m10: with dogs from the game, no "No dog yet?"', await pg.$eval('#nodog', (e) => e.hidden && e.getBoundingClientRect().height === 0));
    await finish('part 9 empty', t);
  });
  await blk('m10 no dogs', async () => {
    t = await open({ path: '/merch/', vp: [360, 640] }); pg = t.page;
    ok('part 9 m10: with no dogs, "No dog yet?" and the ready-made dogs', !(await pg.$eval('#nodog', (e) => e.hidden)) && (await pg.$$eval('#readyHome [data-dog]', (b) => b.length)) === 4);
    await finish('part 9 no dogs home', t);
  });
  await blk('m4 and art M1', async () => {
    // m4 (phone): the mug's counter counts against the mug's own limit
    t = await open({ save: SAVE, path: '/merch/#/pick', vp: [390, 844] }); pg = t.page;
    await pg.evaluate(() => { [...document.querySelectorAll('[data-pick]')].find((x) => /Wigglesworth/.test(x.textContent)).click(); }); await settle(pg); await onward(pg); await tap(pg, '.prodb[data-p=mug]');
    ok('part 9 m4: a 20-letter name that fits the mug says it fits, never "/ 20"', (await text(pg, '#nameMsg')) === '20 letters: that\'s as long as it fits on the mug.' && !(await pg.$eval('#addBtn', (b) => b.disabled)), await text(pg, '#nameMsg'));
    await pg.fill('#nameIn', 'W'.repeat(16)); await settle(pg);
    ok('part 9 m4: 16 wide letters: little room left', (await text(pg, '#nameMsg')) === '16 letters: it fits on the mug, with little room left.', await text(pg, '#nameMsg'));
    await pg.fill('#nameIn', 'W'.repeat(17)); await settle(pg);
    ok('part 9 m4: 17 wide letters: too long, and how many fit', /A little shorter, please: up to 16 of these letters fit on the mug\./.test(await text(pg, '#nameMsg')) && await pg.$eval('#addBtn', (b) => b.disabled), await text(pg, '#nameMsg'));
    await pg.fill('#nameIn', 'Bo'); await settle(pg);
    ok('part 9 m4: a short name: it fits', (await text(pg, '#nameMsg')) === '2 letters: it fits on the mug.');
    // art M1: every drawn mug shows the half a buyer sees with the handle on the right: x 1350 to 2700 of the wrap
    const mf = await mugFaces(pg, '#pvOn .mock-mug .pp-print');
    ok('part 9 art M1: the make-it mug shows the print\'s x 1350 to 2700', mf.length === 1 && mf[0][0] === 1350 && mf[0][1] === 2700, mf);
    await finish('part 9 mug name', t);
  });
  await blk('art M1 faces', async () => {
    t = await open({ save: SAVE, basket: [line(R('Mochi'), 'mug', { pose: 'happy' })], path: '/merch/', vp: [390, 844] }); pg = t.page;
    const home = await mugFaces(pg, '#trio .mock-mug .pp-print'); await tap(pg, '#useDog'); await tap(pg, '[data-pick]'); await onward(pg); const thing = await mugFaces(pg, '#prods .mock-mug .pp-print');
    await toHash(pg, '#/basket'); await pg.waitForSelector('#qtable'); const bk = await mugFaces(pg, '.bl .mock-mug .pp-print');
    ok('part 9 art M1: the home card, the thing and the basket picture agree (x 1350 to 2700)', [home, thing, bk].every((a) => a.length === 1 && a[0][0] === 1350 && a[0][1] === 2700), { home, thing, bk });
    ok('part 9 art M1: the right half\'s dog faces away from the handle (it faces left: PawPrint mugBody draws the right side\'s dog facing left)', /the right side's faces left/.test(fs.readFileSync(path.join(ROOT, 'merch', 'pawprint_core.js'), 'utf8')) && P.PRODUCTS.mug.sides[1] === 2025 && P.PRODUCTS.mug.w === 2700);
    await finish('part 9 mug face', t);
  });
  await blk('art m1', async () => {
    // art m1: the tee mock's hems (and everything drawn on the tee) inside the tee's outline, on every colour
    t = await open({ save: SAVE, path: '/merch/#/pick', vp: [1280, 720] }); pg = t.page; await tap(pg, '[data-pick]'); await onward(pg); await tap(pg, '.prodb[data-p=tee]');
    for (const c of CAT.products.find((p) => p.id === 'tee').colours.map((x) => x.id)) {
      await tap(pg, '[data-col=' + c + ']');
      const out = await pg.evaluate(() => {
        const svg = document.querySelector('#pvOn svg.mock-tee'), body = svg.querySelector('path'), bad = [], hems = [...svg.querySelectorAll('path.hem')];
        hems.forEach((h) => { const L = h.getTotalLength(), w = +h.getAttribute('stroke-width') / 2 + 0.3;
          for (let i = 0; i <= 40; i++) { const p = h.getPointAtLength(L * i / 40), q = h.getPointAtLength(Math.min(L, L * i / 40 + 0.5)), r = h.getPointAtLength(Math.max(0, L * i / 40 - 0.5)), dx = q.x - r.x, dy = q.y - r.y, n = Math.hypot(dx, dy) || 1;
            for (const [ox, oy] of [[0, 0], [-dy / n * w, dx / n * w], [dy / n * w, -dx / n * w], [dx / n * w * (i === 40 ? 1 : 0), dy / n * w * (i === 40 ? 1 : 0)], [-dx / n * w * (i === 0 ? 1 : 0), -dy / n * w * (i === 0 ? 1 : 0)]]) {
              const pt = new DOMPoint(p.x + ox, p.y + oy); if (!body.isPointInFill(pt)) bad.push([Math.round(pt.x), Math.round(pt.y)]); } } });
        return { n: hems.length, bad: bad.slice(0, 4) };
      });
      ok('part 9 art m1: ' + c + ' tee: the sleeve and body hems (lines and caps) lie inside the tee', out.n === 3 && out.bad.length === 0, out);
    }
    await finish('part 9 tee hems', t);
  });
  await blk('art m4', async () => {
    // art m4: the dog cards, the ready-made cards and the pose buttons are drawn without the ground shadow, as the print is
    t = await open({ save: SAVE, path: '/merch/#/pick', vp: [390, 844] }); pg = t.page;
    const shade = () => pg.evaluate(() => ({ pics: document.querySelectorAll('.mview.on svg.dogpic').length, shadows: [...document.querySelectorAll('.mview.on svg.dogpic ellipse')].filter((e) => e.getAttribute('cy') === '187.5' && /5B3D32/i.test(e.getAttribute('fill') || '') && +e.getAttribute('opacity') < 1).length }));
    let s9 = await shade(); ok('part 9 art m4: "Which dog?" cards without the ground shadow', s9.pics >= 9 && s9.shadows === 0, s9);
    await tap(pg, '[data-pick]'); await onward(pg); await tap(pg, '.prodb[data-p=mug]'); s9 = await shade(); ok('part 9 art m4: the pose buttons too', s9.pics === 3 && s9.shadows === 0, s9);
    await finish('part 9 shadows', t);
  });
  // art m2: a newborn has one pose, "Sleeping": on "make it", in the basket and on the order page; a link asking another pose still works
  const bo = R('Bo');
  await blk('art m2', async () => {
    t = await open({ save: SAVE, path: '/merch/#/pick', vp: [360, 640] }); pg = t.page;
    await pg.evaluate(() => { [...document.querySelectorAll('[data-pick]')].find((x) => x.querySelector('.n').textContent === 'Bo').click(); }); await settle(pg); await onward(pg); await tap(pg, '.prodb[data-p=tee]');
    ok('part 9 art m2: a newborn: one pose, "Sleeping", and a word why', (await pg.$$eval('[data-pose]', (b) => b.map((x) => x.textContent.trim() + '=' + x.getAttribute('aria-pressed')).join())) === 'Sleeping=true' && !(await pg.$eval('#poseNote', (e) => e.hidden)) && bo.a === 2);
    ok('part 9 art m2: its preview is the one print', await previewIs(pg, '#pvOn svg[data-pawprint]', bo, { product: 'tee', colour: 'white', pose: 'stand', name: true }));
    await tap(pg, '#addBtn'); await pg.waitForSelector('#qtable');
    ok('part 9 art m2: the basket says "Sleeping"', /^Bo, Beagle\s*Sleeping · name on/.test(await text(pg, '.bl .facts')), await text(pg, '.bl .facts'));
    await finish('part 9 newborn', t);
  });
  await blk('art m2 link', async () => {
    t = await open({ path: SHARE(bo, '&prod=mug&pose=happy&from=share'), vp: [360, 640] }); pg = t.page;
    ok('part 9 art m2: a share link asking "happy" for a newborn opens "make it" with "Sleeping"', (await view(pg)) === 'make' && (await pg.evaluate(() => window.__merch.st.draft.pose)) === 'stand' && (await text(pg, '#poses')) === 'Sleeping' && await previewIs(pg, '#pvOn svg[data-pawprint]', bo, { product: 'mug', colour: 'white', pose: 'happy', name: true }));
    await tap(pg, '#addBtn'); await pg.waitForSelector('#qtable');
    ok('part 9 art m2: and it adds as the one sleeping pose', (await pg.evaluate(() => window.__merch.basket().map((l) => l.pose).join())) === 'stand' && /Sleeping/.test(await text(pg, '.bl .facts')));
    await finish('part 9 newborn link', t);
  });
  await blk('art m2 order and m9', async () => {
    t = await open({ save: SAVE, basket: [line(bo, 'mug', { pose: 'happy' }), line(bo, 'mug', { pose: 'sit' })], ship: 'US', path: '/merch/#/basket', vp: [360, 640], clock: FIX }); pg = t.page; await pg.waitForSelector('#qtable');
    ok('part 9 art m2: stored newborn lines in other poses are one line, "Sleeping"', (await pg.$$eval('.bl', (l) => l.length)) === 1 && (await text(pg, '.bl output')) === '2' && /Sleeping/.test(await text(pg, '.bl .facts')));
    const on = mkOrder('nb', (o) => { o.lines = [Object.assign({}, o.lines[1], { recipe: enc(bo), name: 'Bo', pose: 'happy' }), o.lines[0]]; }); await showOrder(pg, on);
    ok('part 9 art m2: the order page names each pose, a newborn\'s "Sleeping"', (await pg.$$eval('#orderBody .bl .opose', (l) => l.map((x) => x.textContent).join())) === 'Sleeping,Stand', await pg.$$eval('#orderBody .bl .opose', (l) => l.map((x) => x.textContent)));
    // m9: the safe answer is the big button
    await showOrder(pg, mkOrder('m9'));
    ok('part 9 m9: "Keep my order" is the primary button, "Yes, cancel it" the quiet one', await pg.$eval('#cancelNo', (b) => b.classList.contains('go')) && await pg.$eval('#cancelYes', (b) => b.classList.contains('quiet') && !b.classList.contains('go')) &&
      await pg.$eval('#askNo', (b) => b.classList.contains('go')) && await pg.$eval('#askYes', (b) => b.classList.contains('quiet')));
    await finish('part 9 order', t);
  });
}

// ================= fit: every step at three sizes, and contrast =================
const STEPS = [
  ['home', '/merch/', []],
  ['pick', '/merch/#/pick', []],
  ['thing', '/merch/#/pick', ['#pickNext']],
  ['make-tee', '/merch/#/pick', ['#pickNext', '.prodb[data-p=tee]', '[data-col=navy]']],
  ['make-mug', '/merch/#/pick', ['#pickNext', '.prodb[data-p=mug]']],
  ['basket', '/merch/#/basket', []],
  ['closed', '/merch/#/basket', ['#payBtn']],
  ['order', '/merch/?demo=1#/basket', ['#payBtn', '#demoBtn']]];
const INK = 'rgb(91, 61, 50)';
// the contrast of every piece of text against what is behind it (WCAG 2), and the colour of the money and legal lines
function measure() {
  const out = { wide: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: [], spill: [], low: [], notInk: [] };
  const vis = (e) => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && !e.closest('[hidden],dialog:not([open])'); };
  document.querySelectorAll('main button, main a, main select, main input, main summary').forEach((e) => {
    if (!vis(e)) return; const b = e.getBoundingClientRect();
    if (b.height < 43.5 || b.width < 43.5) out.small.push((e.id || e.className || e.tagName) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' "' + e.textContent.trim().slice(0, 20) + '"');
  });
  document.querySelectorAll('.card, .dogb, .prodb, .bl, .promise, .grown, .paybar, .from, .how3 li, .shopbar, .testbar, .eta, .ready button, .dropnote, .qerr').forEach((c) => {
    if (!vis(c)) return; const cb = c.getBoundingClientRect();
    c.querySelectorAll('*').forEach((k) => { if (!vis(k) || k.closest('svg')) return; const b = k.getBoundingClientRect(); if (b.right > cb.right + 1.5 || b.left < cb.left - 1.5) out.spill.push((c.className || c.tagName) + ' > ' + (k.className || k.tagName) + ' ' + Math.round(b.left) + '-' + Math.round(b.right) + ' in ' + Math.round(cb.left) + '-' + Math.round(cb.right)); });
  });
  const rgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const over = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3])).concat([1]);
  const bgOf = (e) => { const layers = []; for (let x = e; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let b = [255, 251, 243, 1]; for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b); return b; };
  document.querySelectorAll('main *, footer *').forEach((e) => {
    if (!vis(e) || e.closest('svg') || e.closest('button:disabled,[aria-disabled="true"],option,select,.testtag,.testbar')) return;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    const s = getComputedStyle(e), fg = rgb(s.color); let op = 1; for (let x = e; x; x = x.parentElement) op *= +getComputedStyle(x).opacity;
    const bg = bgOf(e), f2 = over([fg[0], fg[1], fg[2], fg[3] * op], bg), a = L(f2), b = L(bg), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (r < 4.5) out.low.push((e.id || e.className || e.tagName) + ' ' + r.toFixed(2) + ' "' + e.textContent.trim().slice(0, 24) + '"');
  });
  document.querySelectorAll('#totals td, #totals .small2, .lp, #amt, #amt small, .trio small, .prodb .p, .small2, .mfoot .todo, .mfoot .small, #orderBody .lines td').forEach((e) => {
    if (vis(e) && getComputedStyle(e).color !== 'rgb(91, 61, 50)') out.notInk.push((e.id || e.className || e.tagName) + ' ' + getComputedStyle(e).color);
  });
  for (const k of ['small', 'spill', 'low', 'notInk']) out[k] = out[k].slice(0, 6);
  return out;
}
async function fitChecks() {
  const six = [line(R('Sir Wigglesworth III'), 'tee', { colour: 'navy', size: '2XL', pose: 'happy', qty: 3 }), line(R('Mochi'), 'mug', { pose: 'sit' }), line(R('Bo'), 'tee', { colour: 'black', size: 'XS', pose: 'sit' }),
    line(R('Biscuit'), 'mug', { qty: 2 }), line(R('Pepper'), 'tee', { colour: 'ice-blue', size: 'L' }), line(R('Sir Wigglesworth III'), 'mug', { pose: 'happy' })];
  for (const vp of [[360, 640], [390, 844], [1280, 720]]) {
    for (const [name, p, clicks] of STEPS) {
      const t = await open({ save: SAVE, basket: six, ship: 'FK', path: p, vp });
      const pg = t.page;
      for (const c of clicks) { await pg.click(c); await pg.waitForTimeout(80); }
      if (name === 'order') await pg.waitForSelector('.testtag');
      await pg.evaluate(() => window.scrollTo(0, 0));
      const r = await pg.evaluate(measure);
      const tag = name + ' ' + vp.join('x');
      ok('fit ' + tag + ': no sideways scroll', r.wide <= 0, r.wide);
      ok('fit ' + tag + ': taps at least 44 px', r.small.length === 0, r.small);
      ok('fit ' + tag + ': text stays inside its card', r.spill.length === 0, r.spill);
      ok('contrast ' + tag + ': every text at least 4.5:1', r.low.length === 0, r.low);
      ok('contrast ' + tag + ': money and legal lines in ink', r.notInk.length === 0, r.notInk);
      if (SHOTS && vp[0] !== 360) {
        const normal = name === 'basket' || name === 'closed' || name === 'order'; // the usual case: 3 lines to the United States, over $35, free shipping
        const t2 = await open({ save: SAVE, basket: normal ? NORMAL3.slice(0, name === 'order' ? 2 : 3) : six, ship: normal ? 'US' : 'FK', path: p, vp, dpr: 2 });
        for (const c of clicks) { await t2.page.click(c); await t2.page.waitForTimeout(80); }
        if (name === 'order') await t2.page.waitForSelector('.testtag');
        await t2.page.addStyleTag({ content: '.paybar{position:static!important} .sheet>.sitehead.stuck{position:relative!important}' }); // full-page pictures: the sticky bars in their place
        if (name !== 'closed') await t2.page.evaluate(() => window.scrollTo(0, 0));
        fs.mkdirSync(SHOT_DIR, { recursive: true });
        await t2.page.screenshot({ path: path.join(SHOT_DIR, name + '_' + vp[0] + '.png'), fullPage: name !== 'closed' });
        await t2.ctx.close();
      }
      await finish('fit ' + tag, t);
    }
  }
}

// ================= part 6: the order page in every state the Worker answers (docs/design/merch/PART6.md) =================
const HR = 3600000, MINUTE = 60000, num0 = (x) => (typeof x === 'number' ? x : 0);
// the Worker's own rules for the posting date: paid + n working days (Mon-Fri, UTC), said as its UTC date
function addBD(t, n) { let d = t; while (n > 0) { d += 864e5; const w = new Date(d).getUTCDay(); if (w !== 0 && w !== 6) n--; } return d; }
const postDay = (t) => { const d = new Date(t); return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()]; };
const ORDER_LINES = () => NORMAL3.map((l, i) => { const r = P.merchDecode(l.recipe).dogs[0]; return { line: i + 1, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on, name: l.name_on ? r.n : null, qty: l.qty, unit: l.product === 'tee' ? 2699 : 1999, status: 'queued', refunded_qty: 0, parcel: null, recipe: l.recipe, reprint_of: null }; });
const D22 = new Date(2026, 10, 22, 9).getTime(), D24 = new Date(2026, 10, 24, 15).getTime();
const SHIPBY = addBD(FIX, 7), PB = "We'll post it by Thursday 10 December\\.";
function mkOrder(key, f) {
  const now = FIX, o = { id: 'mo_P6' + key, status: 'paid', hold: null, pay_pending: false, paid_at: now - 10 * MINUTE, cancel_until: now + 50 * MINUTE, ship_by: SHIPBY, country: 'US', lines: ORDER_LINES(), parcels: [],
    totals: { subtotal: 7397, ship_fee: 0, tax: 0, total: 7397, refunded: 0 }, pres: null, gift: null, gift_code: null, gift_name: null, late: false, late_eta: null, late_ok: false, dispute: null };
  if (f) f(o); return o;
}
const past = (o) => { o.paid_at = FIX - 3 * HR; o.cancel_until = FIX - 2 * HR; };
const allShip = (o, delivered) => { past(o); o.status = 'shipped'; o.lines.forEach((l) => { l.status = delivered ? 'delivered' : 'shipped'; l.parcel = l.product === 'tee' ? 'pt' : 'pm'; });
  o.parcels = [{ id: 'pt', product: 'tee', carrier: 'USPS', tracking_url: 'https://tracking.example/t', shipped_at: D22, delivered_at: delivered ? D24 : null }, { id: 'pm', product: 'mug', carrier: 'USPS', tracking_url: 'https://tracking.example/m', shipped_at: D22, delivered_at: delivered ? D24 : null }]; };
const late = (o) => { past(o); o.status = 'confirmed'; o.lines.forEach((l) => { l.status = 'confirmed'; }); o.late = true; o.late_eta = addBD(SHIPBY, 7); };
const partShip = (o) => { past(o); o.status = 'part_shipped'; o.lines.forEach((l) => { l.status = l.product === 'tee' ? 'shipped' : 'in_production'; l.parcel = l.product === 'tee' ? 'pt' : null; }); o.parcels = [{ id: 'pt', product: 'tee', carrier: 'USPS', tracking_url: 'https://tracking.example/t', shipped_at: D22, delivered_at: null }]; };
// six lines with long names (review row T: the order states were drawn with three lines only)
const SIX_LINES = () => ORDER_LINES().concat([line(R('Bo'), 'tee', { colour: 'black', size: 'XS', pose: 'sit' }), line(R('Pepper'), 'mug', { pose: 'happy' }), line(R('Sir Wigglesworth III'), 'tee', { colour: 'ice-blue', size: '2XL', qty: 3 })].map((l, i) => {
  const r = P.merchDecode(l.recipe).dogs[0]; return { line: 4 + i, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on, name: l.name_on ? r.n : null, qty: l.qty, unit: l.product === 'tee' ? (l.size === '2XL' ? 2899 : 2699) : 1999, status: 'queued', refunded_qty: 0, parcel: null, recipe: l.recipe, reprint_of: null }; }));
const STATES = [
  ['open', (o) => { o.status = 'open'; o.paid_at = null; o.cancel_until = null; o.ship_by = null; }, { title: /^Waiting for payment$/, step1: /Now: Waiting for payment\s*We start once it's paid\.$/, box: /^Waiting for payment\.$/ }],
  ['bank', (o) => { o.status = 'open'; o.paid_at = null; o.cancel_until = null; o.ship_by = null; o.pay_pending = true; }, { title: /^Waiting for your bank$/, step1: /Now: Waiting for your bank\s*This page shows it as soon as it arrives\.$/, box: /^Waiting for your bank\.$/ }],
  ['paid', null, { title: /^Thank you! Your order is in\.$/, step1: /Order received\s*\d+ \w+ 2026\. Your receipt is in your email\.$/, box: new RegExp("^We'll start printing at \\d\\d:\\d\\d\\. If you change your mind before then, you can cancel here\\.\\s*" + PB + '\\s*Cancel my order$'), cancel: true }],
  ['after', past, { title: /^Your order is being printed$/, stage: 2, box: new RegExp('^Printing has started\\.\\s*' + PB + '$') }],
  ['review', (o) => { o.status = 'held'; o.hold = 'review'; }, { box: /^Getting ready to print\. It's taking a little longer than usual\.\s*We'll start printing at \d\d:\d\d/, cancel: true }],
  ['render', (o) => { past(o); o.status = 'held'; o.hold = 'render'; }, { title: /^Getting your order ready$/, step1: /Order received\s*\d+ \w+ 2026\. Getting ready to print\.$/, box: new RegExp("^Getting ready to print\\. It's taking a little longer than usual\\.\\s*" + PB + '$') }],
  ['provider', (o) => { past(o); o.status = 'held'; o.hold = 'provider'; }, { box: new RegExp("^Getting ready to print\\. It's taking a little longer than usual\\.\\s*" + PB + '$') }],
  ['wallet', (o) => { past(o); o.status = 'held'; o.hold = 'wallet'; }, { box: new RegExp("^Getting ready to print\\. It's taking a little longer than usual\\.\\s*" + PB + '$') }],
  ['draft', (o) => { past(o); o.status = 'held'; o.hold = 'draft_mode'; }, { box: new RegExp('^Getting ready to print\\.\\s*' + PB + '$') }],
  ['address', (o) => { past(o); o.status = 'held'; o.hold = 'address'; }, { title: /^We need your address$/, step1: /Order received\s*\d+ \w+ 2026\. Waiting for your address\.$/, form: true, refund: true, box: null }],
  ['dispute', (o) => { o.status = 'held'; o.hold = 'dispute'; o.dispute = 'open'; }, { title: /^Your order is paused$/, step1: /Order received\s*\d+ \w+ 2026\. Paused while your bank looks at the payment\.$/, box: /^Your bank is looking at this payment, so we've paused it\./ }],
  ['disputesent', (o) => { allShip(o); o.dispute = 'open'; }, { title: /^Your order is on its way$/, box: /^Your bank is looking at this payment\. What we posted is yours either way, and the bank decides about the money\./, stage: 3 }],
  ['reship', (o) => { allShip(o); o.hold = 'reship'; }, { title: /^A parcel came back to us$/, track: /A parcel came back to us: tell us where to send it again\./, form: true, refund: false, box: null }],
  ['confirming', (o) => { past(o); o.status = 'confirming'; o.lines.forEach((l) => { l.status = 'drafted'; }); }, { title: /^Your order is being printed$/, box: new RegExp('^Printing has started\\.\\s*' + PB + '$'), stage: 2 }],
  ['confirmed', (o) => { past(o); o.status = 'confirmed'; o.lines.forEach((l) => { l.status = 'confirmed'; }); }, { title: /^Your order is being printed$/, box: new RegExp('^Printing has started\\.\\s*' + PB + '$'), stage: 2 }],
  ['part', partShip, { title: /^Part of your order is on its way$/, track: /On its way\s*Sent 22 Nov 2026 \(1 of 2 parcels\)\. Track it$/, box: null, stage: 3 }],
  ['shipped', (o) => allShip(o), { title: /^Your order is on its way$/, track: /Sent 22 Nov 2026 \(2 parcels\)\. Track it \(tee\)\s*Track it \(mug\)/, box: null, stage: 3 }],
  ['arrived', (o) => allShip(o, true), { title: /^Your order has been delivered$/, arrived: /Delivered 24 Nov 2026/, box: null, stage: 4 }],
  ['refundedafter', (o) => { allShip(o, true); o.status = 'refunded'; o.totals.refunded = 7397; o.lines.forEach((l) => { l.refunded_qty = l.qty; }); }, { title: /^Your order is refunded$/, arrived: /Delivered 24 Nov 2026/, stage: 4, box: null, refunded: '$73.97' }],
  ['cancelled', (o) => { o.status = 'cancelled'; o.totals.refunded = 7397; o.lines.forEach((l) => { l.status = 'cancelled'; l.refunded_qty = l.qty; }); }, { title: /^Your order is cancelled$/, box: null, putBack: true, refunded: '$73.97' }],
  ['refunded', (o) => { past(o); o.status = 'refunded'; o.totals.refunded = 7397; o.lines.forEach((l) => { l.status = 'cancelled'; l.refunded_qty = l.qty; }); }, { title: /^Your order is refunded$/, box: null, refunded: '$73.97' }],
  ['partly', (o) => { past(o); o.status = 'confirmed'; o.lines[1].qty = 2; o.lines[1].refunded_qty = 1; o.totals.subtotal += 1999; o.totals.total += 1999; o.totals.refunded = 1999; }, { tag: /Refunded: 1 of 2\./, refunded: '$19.99', box: new RegExp('^Printing has started\\.\\s*' + PB + '$') }],
  ['rejected', (o) => { o.lines[1].status = 'rejected'; o.lines[1].refunded_qty = 1; o.totals.refunded = 1999; }, { tag: /We couldn't print this one, so we refunded it\./, refunded: '$19.99', cancel: true }],
  ['reprint', (o) => { allShip(o); o.status = 'part_shipped'; o.lines[1].status = 'replaced'; o.lines.push(Object.assign({}, o.lines[1], { line: 101, status: 'confirmed', parcel: null, reprint_of: 2 })); }, { tag: /A new one, free: on its way to you\./, free: true, box: null }],
  ['late', late, { late: true, box: /^Printing has started\.$/, lateText: /^Taking longer than we said We're sorry: we said we'd post your order by Thursday 10 December, and it hasn't gone out yet\. Tee with Mochi, navy, M Mug with Biscuit Tee with Sir Wigglesworth III, white, L We now expect to post it by Monday 21 December\. You don't need to do anything to keep waiting\. Or cancel the late part for a full refund, any time until it's posted\. Keep waiting Cancel the late part$/, tag: /Running late: we now expect to post it by Monday 21 December\./ }],
  ['latepart', (o) => { partShip(o); o.late = true; o.late_eta = addBD(SHIPBY, 7); }, { late: true, box: null, lateText: /part of it hasn't gone out yet\. Mug with Biscuit We now expect to post the late part by Monday 21 December\./ }],
  ['lateok', (o) => { late(o); o.late_ok = true; }, { late: true, box: /^Printing has started\.$/, lateText: /^Taking longer than we said Thank you for waiting\. We're still on it, and we'll email you as soon as it's posted\..*Or cancel the late part for a full refund, any time until it's posted\. Cancel the late part$/, noWait: true }],
  ['resting', (o) => { past(o); o.status = 'confirmed'; o.resting = true; }, { rest: true }],
  ['expired', (o) => { o.status = 'expired'; o.paid_at = null; o.cancel_until = null; o.ship_by = null; }, { title: /^This order wasn't paid$/, box: null }],
  ['giftsoon', (o) => { o.gift = 'soon'; }, { giftSoon: /A little gift for your dog in the game will be waiting here once printing starts\./, cancel: true }],
  ['gift', (o) => { past(o); o.status = 'confirmed'; o.gift = 'ready'; o.gift_code = 'TEST-GIFT-0001'; }, { gift: /a little gift for your dog in the game\./ }],
  ['giftname', (o) => { past(o); o.status = 'confirmed'; o.gift = 'ready'; o.gift_code = 'TEST-GIFT-0002'; o.gift_name = 'Test Bandana'; }, { gift: /the Test Bandana, a little gift for your dog in the game\./ }],
  ['giftnotyet', (o) => { o.gift = 'soon'; o.gift_code = 'TEST-GIFT-0003'; }, { giftSoon: /will be waiting here/, cancel: true, noCode: 'TEST-GIFT-0003' }],
  ['tax', (o) => { o.totals.tax = 592; o.totals.total += 592; }, { taxRow: '$5.92', cancel: true }],
  ['six', (o) => { past(o); o.status = 'confirmed'; o.lines = SIX_LINES(); o.lines.forEach((l) => { l.status = 'confirmed'; }); o.totals.subtotal = 7397 + 2699 + 1999 + 3 * 2899; o.totals.total = o.totals.subtotal; }, { lines: 6, box: new RegExp('^Printing has started\\.\\s*' + PB + '$') }],
  ['pres', (o) => { o.pres = { currency: 'jpy', amount: 11500 }; }, { pres: /You paid ¥11,500 at checkout\./, cancel: true }]];
const putOrder = (pg, o) => pg.evaluate((x) => window.__merch.api.put(x), o);
async function showOrder(pg, o) { await putOrder(pg, o); await toHash(pg, '#/order/' + o.id); await pg.waitForSelector('#h-order-t'); await settle(pg); }
async function orderStateChecks() {
  let t = await open({ save: SAVE, path: '/merch/#/', clock: FIX }), pg = t.page;
  for (const [key, f, want] of STATES) {
    const o = mkOrder(key, f); await showOrder(pg, o);
    const tag = 'order ' + key, body = await text(pg, '#orderBody');
    ok(tag + ': drawn, marked test', (await view(pg)) === 'order' && /Test order/.test(await text(pg, '.testtag')) && body.includes(o.id.slice(3)), body.slice(0, 120));
    ok(tag + ': no undefined, null or NaN', !/\bundefined\b|\bnull\b|NaN/.test(body), body.slice(0, 200));
    if (want.title) ok(tag + ': the title', want.title.test(await text(pg, '#h-order-t')), await text(pg, '#h-order-t'));
    // part 9 M5/M6: the title and the tracker agree; the receipt is spoken of only under the thank-you, in the first hour after paying
    const title = await text(pg, '#h-order-t'), thanks = title === 'Thank you! Your order is in.';
    ok(tag + ': a receipt line only with the thank-you in the first hour (none unpaid, none later)', /receipt/i.test(body) === thanks && (!thanks || num0(o.paid_at) > FIX - HR), [title, (body.match(/[^.]*receipt[^.]*\./i) || [])[0]]);
    if (o.status === 'open') ok(tag + ': unpaid: the tracker waits for the payment too', !/Order received/.test(await text(pg, '.track')) && (await text(pg, '.track li:nth-child(1)')).includes(title.replace('Thank you! Your payment is on its way to us', 'Waiting for payment')));
    if (want.step1) ok(tag + ': step 1 of the tracker says what the title says', want.step1.test(await text(pg, '.track li:nth-child(1)')), await text(pg, '.track li:nth-child(1)'));
    if (want.box === null) ok(tag + ': no status box', !(await pg.$('.cancelbox')), await text(pg, '.cancelbox'));
    else if (want.box) ok(tag + ': the status words', want.box.test(await text(pg, '.cancelbox')), await text(pg, '.cancelbox'));
    ok(tag + ': the cancel button only in the hour', !!(await pg.$('#cancelBtn')) === !!want.cancel);
    ok(tag + ': the address form only when asked', !!(await pg.$('#addrForm')) === !!want.form && !!(await pg.$('#addrRefund')) === !!want.refund);
    ok(tag + ': the delay choice only when late', !!(await pg.$('#lateBox')) === !!want.late);
    if (want.lateText) ok(tag + ': the delay words (the late things by name, the date we said, the new date, cancel any time until posted)', want.lateText.test(await itext(pg, '#lateBox')), await itext(pg, '#lateBox'));
    if (want.late) ok(tag + ': "Keep waiting" only until the buyer said so', !!(await pg.$('#lateWait')) === !want.noWait && !!(await pg.$('#lateCancel')));
    ok(tag + ': the gift only once shown (gift ready, with a code)', !!(await pg.$('#giftBox')) === !!want.gift && !!(await pg.$('#giftSoon')) === !!want.giftSoon);
    if (want.giftSoon) ok(tag + ': the gift promised, no code yet', want.giftSoon.test(await text(pg, '#giftSoon')) && !/TEST-GIFT/.test(body));
    if (want.taxRow) ok(tag + ': the Tax row', (await pg.$$eval('#orderBody table.lines tr', (r) => r.map((x) => x.textContent.trim()))).includes('Tax' + want.taxRow));
    if (want.lines) ok(tag + ': every line drawn', (await pg.$$eval('#orderBody .blines > .bl', (l) => l.length)) === want.lines);
    ok(tag + ': no emoji in the steps; a drawn tick on the steps done', !/\p{Extended_Pictographic}/u.test(await text(pg, '.track')) && (await pg.$$eval('.track li.done', (l) => l.every((x) => !!x.querySelector('.dot .tick')))), await text(pg, '.track'));
    if (want.gift) ok(tag + ': the gift words and the code', want.gift.test(await text(pg, '#giftBox')) && (await text(pg, '#giftCode')) === o.gift_code && /Have a code\?/.test(await text(pg, '#giftBox')) && /free account/.test(await text(pg, '#giftBox')) && (await pg.$eval('#giftBox a', (a) => a.href)) === 'https://doodledoggo.app/');
    if (want.track) ok(tag + ': the parcels', want.track.test(await text(pg, '.track li:nth-child(3)')), await text(pg, '.track li:nth-child(3)'));
    if (want.arrived) ok(tag + ': the delivery date', want.arrived.test(await text(pg, '.track li:nth-child(4)')));
    if (want.stage) ok(tag + ': where it is now', (await pg.$eval('.track li:nth-child(' + want.stage + ')', (l) => l.className)) === 'now');
    if (want.tag) ok(tag + ': the line says what happened', want.tag.test(body), body.slice(0, 300));
    if (want.free) ok(tag + ': a reprint costs nothing', (await pg.$$eval('#orderBody .bl .lp', (x) => x.map((y) => y.textContent))).includes('Free'));
    if (want.refunded) ok(tag + ': the refunded total', (await text(pg, '[data-q=refunded]')) === want.refunded);
    if (want.rest) ok(tag + ': resting is said kindly', /resting for now\. Your order is safe/.test(await text(pg, '.restnote')));
    if (want.pres) ok(tag + ': what was paid in the buyer\'s currency', want.pres.test(await text(pg, '#presLine')));
    ok(tag + ': put back only for a cancelled order', !!(await pg.$('#putBack')) === !!want.putBack);
  }
  // the gift's Copy: works without clipboard permission (the code is selected and copied by hand, or the clipboard takes it)
  await showOrder(pg, mkOrder('gift', STATES.find((x) => x[0] === 'gift')[1]));
  await tap(pg, '#giftCopy'); await settle(pg);
  const said = await text(pg, '#giftSaid'), sel = await pg.evaluate(() => String(window.getSelection()));
  ok('gift copy: feedback, and the code is selected', /^(Copied|The code is selected)/.test(said) && sel === 'TEST-GIFT-0001', [said, sel]);
  // put back in the basket (a cancelled order)
  await showOrder(pg, mkOrder('cancelled', STATES.find((x) => x[0] === 'cancelled')[1])); await tap(pg, '#putBack'); await settle(pg);
  ok('put back: the three things are in the basket', (await view(pg)) === 'basket' && (await pg.$$eval('#blines .bl', (l) => l.length)) === 3, await view(pg));
  await pg.evaluate(() => { localStorage.removeItem('dd_merch_basket_v1'); });
  // the delay choice: keep waiting tells the server (late_ok), then cancel the late part (one request, refunded)
  await showOrder(pg, mkOrder('late', STATES.find((x) => x[0] === 'late')[1]));
  await tap(pg, '#lateWait'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('late: keep waiting is recorded by the server and said kindly; the cancel stays', /Thank you for waiting/.test(await text(pg, '.oknote')) && /Thank you for waiting/.test(await text(pg, '#lateBox')) && !!(await pg.$('#lateCancel')) && !(await pg.$('#lateWait')) && (await pg.evaluate(() => window.__merch.api.order('mo_P6late'))).late_ok === true);
  ok('late: after an answer the order title has the focus', (await pg.evaluate(() => document.activeElement && document.activeElement.id)) === 'h-order-t');
  await tap(pg, '#lateCancel'); ok('late: a question first, the focus on the safe answer', await pg.$eval('#askDlg', (d) => d.open) && /Cancel the late part\?/.test(await text(pg, '#h-ask')) && (await pg.evaluate(() => document.activeElement.id)) === 'askNo');
  await tap(pg, '#askNo'); ok('late: No: nothing done, the focus back on the button', !(await pg.$eval('#askDlg', (d) => d.open)) && (await pg.evaluate(() => document.activeElement.id)) === 'lateCancel' && !!(await pg.$('#lateBox')));
  await tap(pg, '#lateCancel'); await tap(pg, '#askYes'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('late: refunded, the choice is gone', /we've refunded the late part/.test(await text(pg, '.oknote')) && (await text(pg, '#h-order-t')) === 'Your order is refunded' && !(await pg.$('#lateBox')), await text(pg, '#orderBody'));
  // the late cancel while the order is being sent to print: kind, true words (review finding 9)
  await showOrder(pg, mkOrder('latebusy', (o) => { late(o); o.status = 'confirming'; }));
  await tap(pg, '#lateCancel'); await tap(pg, '#askYes'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('late while confirming: "try again in a minute or two"', /sending your order to print right this minute\. Please try again in a minute or two\./.test(await text(pg, '.oknote')) && !!(await pg.$('#lateBox')), await text(pg, '.oknote'));
  // cancel in the hour: the dialog opens on "Keep my order"; each error in its own words, on the page (review findings 4, 11)
  await showOrder(pg, mkOrder('cancel1'));
  await tap(pg, '#cancelBtn'); ok('cancel: the dialog opens on the safe answer', (await pg.evaluate(() => document.activeElement.id)) === 'cancelNo');
  await tap(pg, '#cancelNo'); ok('cancel: No gives the focus back to the button', (await pg.evaluate(() => document.activeElement.id)) === 'cancelBtn');
  for (const [code, re] of [['too_late', /^It's too late to cancel now: printing has started\./], ['not_allowed', /^Your bank is looking at this payment/], ['offline', /^We couldn't reach the shop\. Check your connection/], ['slow_down', /^That was a lot of tries/], ['busy', /^We're a little busy just now/]]) {
    await pg.evaluate((c) => { const a = window.__merch.api; a.__cancel = a.__cancel || a.cancel; a.cancel = () => Promise.reject({ status: 409, error: c }); }, code);
    await tap(pg, '#cancelBtn'); await tap(pg, '#cancelYes'); await pg.waitForSelector('.oknote'); await settle(pg);
    ok('cancel error ' + code + ': its own words, on the page', re.test(await text(pg, '.oknote')) && (await pg.$eval('.oknote', (e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 20)), await text(pg, '.oknote'));
  }
  await pg.evaluate(() => { const a = window.__merch.api; a.cancel = a.__cancel; });
  await tap(pg, '#cancelBtn'); await tap(pg, '#cancelYes'); await settle(pg); await settle(pg);
  ok('cancel: done, the title has the focus', (await text(pg, '#h-order-t')) === 'Your order is cancelled' && (await pg.evaluate(() => document.activeElement.id)) === 'h-order-t');
  // not found, and a network error (kind, with a retry)
  await toHash(pg, '#/order/mo_P6nothing'); await pg.waitForSelector('#h-order-t'); await settle(pg);
  ok('not found: kind words', /^We couldn't find this order$/.test(await text(pg, '#h-order-t')) && /Check the link in your email/.test(await text(pg, '#orderBody')) && !(await pg.$('#orderRetry')));
  await putOrder(pg, mkOrder('net'));
  await pg.evaluate(() => { const a = window.__merch.api; a.__order = a.order; a.order = () => Promise.reject({ status: 0, error: 'offline' }); });
  await toHash(pg, '#/order/mo_P6net'); await pg.waitForSelector('#orderRetry'); await settle(pg);
  ok('network error: kind words and Try again', /couldn't reach the shop just now/.test(await text(pg, '#h-order-t')) && /Your order is safe/.test(await text(pg, '#orderBody')));
  await pg.evaluate(() => { const a = window.__merch.api; a.order = a.__order; }); await tap(pg, '#orderRetry'); await pg.waitForSelector('.ordnum'); await settle(pg);
  ok('network error: Try again shows the order', /Thank you! Your order is in\./.test(await text(pg, '#h-order-t')));
  await finish('order states', t);

  // the address form: each error, and the values never kept
  t = await open({ save: SAVE, path: '/merch/#/', clock: FIX }); pg = t.page;
  const fill = async (v) => { for (const [k, x] of Object.entries(v)) await pg.$eval('#af-' + k, (e, x) => { e.value = x; }, x); };
  const A = { name: 'Pat Tester', line1: '9 New Lane', line2: 'Flat Q2', city: 'Testville', state: 'NY', postal: 'QZ-9Q9' };
  // [the box under the form (only when visible), the fields marked, what the fields say]
  const err = async () => [(await pg.$eval('#addrErr', (e) => e.hidden)) ? '' : await text(pg, '#addrErr'), await pg.$$eval('#addrForm [aria-invalid=true]', (x) => x.map((e) => e.id)), await pg.$$eval('#addrForm .aerr', (x) => x.map((e) => e.textContent).join(''))];
  await showOrder(pg, mkOrder('address', STATES.find((x) => x[0] === 'address')[1]));
  ok('address: names and towns start with a capital on a phone keyboard (part 9 m8)', await pg.$$eval('#af-name, #af-city', (l) => l.every((e) => e.getAttribute('autocapitalize') === 'words')));
  ok('address: the order\'s own country, said, no picker', /Country: United States/.test(await text(pg, '.acountry')) && !(await pg.$('#addrForm select')));
  ok('address: every input at least 44 px and labelled', await pg.$$eval('#addrForm input', (l) => l.length === 6 && l.every((e) => e.getBoundingClientRect().height >= 44 && e.closest('label') && e.closest('label').textContent.trim().length > 3)));
  await fill(Object.assign({}, A, { name: '' })); await tap(pg, '#addrSend');
  let e = await err(); ok('address: a missing name, said once, at the field (part 9 m8)', /name for the parcel/.test(e[2]) && e[0] === '' && e[1].join() === 'af-name', e);
  await fill(Object.assign({}, A, { line1: 'x'.repeat(130) })); await tap(pg, '#addrSend'); await settle(pg);
  e = await err(); ok('address: bad_address {field} from the server, said once, at that field', /street address/.test(e[2]) && e[0] === '' && e[1].join() === 'af-line1', e);
  for (const [hook, re] of [['address', /still can't send to this address/], ['other_country', /We can only send this order to the United States\. To send it somewhere else, we'll refund you/], ['busy', /One moment, please try again/], ['slow_down', /a lot of tries/]]) {
    await pg.evaluate(([id, h]) => { const k = 'dd_merch_test_orders_v1', all = JSON.parse(sessionStorage.getItem(k)); all[id]._fail = { address: h }; sessionStorage.setItem(k, JSON.stringify(all)); }, ['mo_P6address', hook]);
    await fill(A); await tap(pg, '#addrSend'); await settle(pg);
    e = await err(); ok('address: ' + hook + ' in words, the values still in the form to fix', re.test(e[0]) && (await pg.$eval('#af-line1', (x) => x.value)) === '9 New Lane', e);
  }
  await pg.evaluate(() => { const k = 'dd_merch_test_orders_v1', all = JSON.parse(sessionStorage.getItem(k)); all.mo_P6address.status = 'paid'; all.mo_P6address.hold = null; sessionStorage.setItem(k, JSON.stringify(all)); });
  await fill(A); await tap(pg, '#addrSend'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('address: not_needed (sorted meanwhile): said, the form gone', /sorted already/.test(await text(pg, '.oknote')) && !(await pg.$('#addrForm')));
  await showOrder(pg, mkOrder('address2', STATES.find((x) => x[0] === 'address')[1]));
  await fill(A); await tap(pg, '#addrSend'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('address: sent, thanked, the form gone, and the order goes on to be printed', /Thanks! We.ll send it there\./.test(await text(pg, '.oknote')) && !(await pg.$('#addrForm')) && (await text(pg, '#h-order-t')) === 'Your order is being printed', await text(pg, '#h-order-t'));
  const kept = await pg.evaluate(() => JSON.stringify([Object.assign({}, localStorage), Object.assign({}, sessionStorage), document.body.innerHTML, [...document.querySelectorAll('input')].map((i) => i.value)]));
  ok('address: the values are kept nowhere (storage, the page)', !/9 New Lane|Pat Tester|Testville|Flat Q2|QZ-9Q9/.test(kept), kept.match(/9 New Lane|Pat Tester|Testville|Flat Q2|QZ-9Q9/));
  // refund me instead (held address only)
  await showOrder(pg, mkOrder('address3', STATES.find((x) => x[0] === 'address')[1]));
  await tap(pg, '#addrRefund'); ok('refund instead: a question first', /Refund the whole order\?/.test(await text(pg, '#h-ask')));
  await tap(pg, '#askYes'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('refund instead: refunded', (await text(pg, '#h-order-t')) === 'Your order is refunded' && /refunded all of it/.test(await text(pg, '.oknote')) && !(await pg.$('#addrForm')));
  // the reship form: no refund button, sent the same way
  await showOrder(pg, mkOrder('reship', STATES.find((x) => x[0] === 'reship')[1])); await fill(A); await tap(pg, '#addrSend'); await pg.waitForSelector('.oknote'); await settle(pg);
  ok('reship: sent, the form gone, still shipped', !(await pg.$('#addrForm')) && (await text(pg, '#h-order-t')) === 'Your order is on its way');
  await finish('address form', t);

  // ?new=1: a calm thank-you at the top; the paid basket is emptied once; the address loses new=1 (review finding 3)
  t = await open({ save: SAVE, basket: NORMAL3.slice(0, 2), ship: 'US', path: '/merch/?new=1#/', clock: FIX }); pg = t.page;
  await showOrder(pg, mkOrder('new'));
  ok('?new=1: thank you, and the paid basket emptied', (await text(pg, '#h-order-t')) === 'Thank you! Your order is in.' && (await pg.evaluate(() => localStorage.getItem('dd_merch_basket_v1'))) === null && (await text(pg, '#bagN')) === '0');
  ok('?new=1: dropped from the address after the first read', (await pg.evaluate(() => location.search)) === '' && (await hash(pg)) === '#/order/mo_P6new');
  await showOrder(pg, mkOrder('newopen', STATES[0][1]));
  ok('?new=1 and not paid yet: the payment is on its way', /^Thank you! Your payment is on its way to us$/.test(await text(pg, '#h-order-t')) && /Waiting for payment\./.test(await text(pg, '.cancelbox')));
  await showOrder(pg, mkOrder('newshipped', (o) => allShip(o)));
  ok('?new=1 never titles a posted order "Thank you"', (await text(pg, '#h-order-t')) === 'Your order is on its way');
  // the same address reopened later (a bookmark, Back): a new basket is never emptied
  const B2 = JSON.stringify(NORMAL3.slice(0, 1).map((l) => ({ recipe: l.recipe, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: l.name_on, qty: 1 })));
  for (const [what, key, f] of [['the same order with new=1 again', 'new', null], ['an order paid hours ago with new=1', 'newold', past]]) {
    const o = mkOrder(key, f); await putOrder(pg, o); await pg.evaluate((b) => localStorage.setItem('dd_merch_basket_v1', b), B2);
    await pg.goto(BASE + '/merch/?new=1#/order/' + o.id); await pg.waitForSelector('#h-order-t'); await settle(pg);
    ok('?new=1: ' + what + ': the basket stays', (await pg.evaluate(() => localStorage.getItem('dd_merch_basket_v1'))) !== null && (await text(pg, '#bagN')) === '1');
  }
  await finish('new=1', t);
  // an open order: re-read every 5 s, then every 30 s, then after 10 minutes "reload in a minute" (review finding 10; the intervals shortened here)
  t = await open({ save: SAVE, path: '/merch/?new=1#/' }); pg = t.page;
  await pg.evaluate(() => { const O = window.__merch.ORD; O.POLL_FAST = 40; O.POLL_SLOW = 40; O.POLL_FOR = 500; });
  const op = mkOrder('poll', STATES[0][1]); await putOrder(pg, op);
  await pg.evaluate(() => { const a = window.__merch.api; a.__n = 0; const f = a.order; a.order = (id) => { a.__n++; return f(id); }; });
  await toHash(pg, '#/order/mo_P6poll'); await pg.waitForSelector('#h-order-t'); await pg.waitForTimeout(250);
  ok('polls: the open order is read again and again', (await pg.evaluate(() => window.__merch.api.__n)) >= 3 && /This page shows it as soon as it arrives/.test(await text(pg, '#orderBody')));
  await pg.waitForTimeout(700); const n1 = await pg.evaluate(() => window.__merch.api.__n); await pg.waitForTimeout(300);
  ok('polls: they stop after the time is up, and the page says to reload in a minute', (await pg.evaluate(() => window.__merch.api.__n)) === n1 && /Reload this page in a minute/.test(await text(pg, '#orderBody')) && !/as soon as it arrives/.test(await text(pg, '#orderBody')), await text(pg, '.thanks'));
  ok('polls: the real intervals are 5 s, 30 s, 10 minutes', /POLL_FAST: 5000, POLL_SLOW: 30000, POLL_FOR: 600000/.test(MERCH_JS));
  await finish('polls', t);
}
// every order state fits at the three sizes (one page per size, the states one after another)
async function orderFitChecks() {
  for (const vp of [[360, 640], [390, 844], [1280, 720]]) {
    const t = await open({ save: SAVE, path: '/merch/#/', vp, clock: FIX }), pg = t.page;
    for (const [key, f] of STATES) {
      await showOrder(pg, mkOrder(key, f)); await pg.evaluate(() => window.scrollTo(0, 0));
      const r = await pg.evaluate(measure), tag = 'order ' + key + ' ' + vp.join('x');
      ok('fit ' + tag + ': no sideways scroll', r.wide <= 0, r.wide);
      ok('fit ' + tag + ': taps at least 44 px', r.small.length === 0, r.small);
      ok('fit ' + tag + ': text stays inside its card', r.spill.length === 0, r.spill);
      ok('contrast ' + tag + ': every text at least 4.5:1', r.low.length === 0, r.low);
      ok('contrast ' + tag + ': money and legal lines in ink', r.notInk.length === 0, r.notInk);
    }
    for (const fn of ['found', 'net']) { // not found and a network error, too
      if (fn === 'found') await toHash(pg, '#/order/mo_P6none'); else { await pg.evaluate(() => { window.__merch.api.order = () => Promise.reject({ status: 0, error: 'offline' }); }); await toHash(pg, '#/order/mo_P6paid'); }
      await pg.waitForSelector('#h-order-t'); await settle(pg); const r = await pg.evaluate(measure);
      ok('fit order ' + fn + ' ' + vp.join('x') + ': fits', r.wide <= 0 && !r.small.length && !r.spill.length && !r.low.length, r);
    }
    await finish('order fit ' + vp.join('x'), t);
  }
}
// SHOTS=1: the owner's pictures of part 6: order states at 390x844 (dpr 2) and every email for one sample order (its HTML and a 390 px picture)
async function part6Shots() {
  const dir = path.join(ROOT, 'docs', 'design', 'merch', 'part6_shots'), edir = path.join(dir, 'emails'); fs.mkdirSync(edir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/_390\.png$/.test(f)) fs.unlinkSync(path.join(dir, f)); // the set below replaces the old pictures
  const t = await open({ save: SAVE, path: '/merch/#/', vp: [390, 844], dpr: 2, clock: FIX }), pg = t.page;
  await t.page.addStyleTag({ content: '.sheet>.sitehead.stuck{position:relative!important}' });
  for (const [key, file] of [['paid', '1_paid_in_the_hour'], ['address', '2_held_address_form'], ['part', '3_part_shipped'], ['latepart', '4_late_choice'], ['lateok', '4b_late_keep_waiting'],
    ['giftsoon', '5_gift_soon'], ['gift', '5b_gift_shown'], ['cancelled', '6_cancelled'], ['arrived', '7_delivered'], ['refundedafter', '8_refunded_after_delivery'], ['disputesent', '9_dispute_after_posting'], ['six', '10_six_lines']]) {
    await showOrder(pg, mkOrder(key, STATES.find((x) => x[0] === key)[1])); await pg.evaluate(() => window.scrollTo(0, 0));
    await pg.screenshot({ path: path.join(dir, file + '_390.png'), fullPage: true });
  }
  await t.ctx.close();
  const mail = await import(path.join(ROOT, 'cloudflare', 'merch', 'mail.js'));
  // one sample order (paid Tue 1 Dec 2026 01:00 UTC: post by Thu 10 Dec, the new date Mon 21 Dec), each email as the ledger builds its view
  const id = 'mo_SampleOrder0000000000', ship_by = Date.parse('2026-12-10T01:00:00Z'), late_eta = Date.parse('2026-12-21T01:00:00Z');
  const L = [{ line: 1, product: 'mug', colour: 'white', name: 'Biscuit', qty: 1, unit: 1999, status: 'shipped', refunded_qty: 0, parcel: 'p1' },
    { line: 2, product: 'tee', colour: 'navy', colour_name: 'Navy', size: 'L', name: 'Biscuit', qty: 2, unit: 2699, status: 'confirmed', refunded_qty: 0, parcel: null },
    { line: 101, product: 'mug', colour: 'white', name: 'Biscuit', qty: 1, unit: 1999, status: 'confirmed', refunded_qty: 0, parcel: null, reprint_of: 1, rp: 1 }];
  const v = { id, status: 'part_shipped', can_cancel: false, ship_by, late_eta: null, eta: [5, 11], lines: L, parcels: [{ id: 'p1', carrier: 'USPS', tracking_url: 'https://tracking.example/p1' }],
    totals: { subtotal: 7397, ship_fee: 0, tax: 0, total: 7397, refunded: 0 }, pres: { currency: 'jpy', amount: 11500 }, gift: 'ready', gift_code: 'TEST-GIFT-0001', gift_name: null, about: {} };
  const V = {
    thanks: { status: 'paid', can_cancel: true, gift: 'soon', gift_code: null, lines: L.slice(0, 2).map((l) => Object.assign({}, l, { status: 'queued', parcel: null })) },
    ship: { about: { parcel: 'p1', gift: true } }, address: { about: { reship: true, reship_lines: [1] } },
    cancelled: { status: 'cancelled', totals: Object.assign({}, v.totals, { refunded: 7397 }) },
    refunded: { totals: Object.assign({}, v.totals, { refunded: 5398 }), about: { refund: { amount: 5398, reason: 'late_auto', lines: [{ line: 2, qty: 2 }] } } },
    refunded_all: { status: 'refunded', totals: Object.assign({}, v.totals, { refunded: 7397 }), about: { refund: { amount: 7397, reason: 'render_72h', lines: [] } } },
    reject: { about: { line: 2, refund: { amount: 5398, reason: 'provider', lines: [{ line: 2, qty: 2 }] } } },
    late: { late: true, late_eta, lines: L.slice(0, 2) }, late_again: { late: true, late_eta, lines: L.slice(0, 2) },
    reprint: { about: { reprint: { n: 1, why: 'lost' } } } };
  const b = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }), ep = await b.newPage();
  for (const k of mail.KINDS) {
    const m = mail.build(k, Object.assign({}, v, V[k] || {}), {});
    fs.writeFileSync(path.join(edir, k + '.html'), m.html); fs.writeFileSync(path.join(edir, k + '.txt'), 'Subject: ' + m.subject + '\n\n' + m.text);
    await ep.setContent(m.html); await ep.screenshot({ path: path.join(edir, k + '_390.png'), fullPage: true });
  }
  await b.close();
}

// ================= LOOK=<dir>: the review pictures =================
async function lookShots() {
  fs.mkdirSync(LOOK, { recursive: true });
  for (const vp of [[360, 640], [390, 844], [1280, 720]]) {
    const W = vp[0], shot = async (pg, n, full) => pg.screenshot({ path: path.join(LOOK, n + '_' + W + '.png'), fullPage: !!full });
    let t = await open({ save: SAVE, basket: [NORMAL3[0], NORMAL3[1], Object.assign(line(R('Bo'), 'tee'), { colour: 'mustard' })], ship: 'US', path: '/merch/#/basket', vp });
    await t.page.waitForSelector('#qtable'); await shot(t.page, 'dropped', true); await t.ctx.close();
    t = await open({ save: SAVE_NONAME, path: '/merch/#/pick', vp }); await shot(t.page, 'noname-pick', true);
    await tap(t.page, '#pickNext'); await tap(t.page, '.prodb[data-p=mug]'); await settle(t.page); await shot(t.page, 'noname-make');
    await tap(t.page, '#addBtn'); await t.page.waitForSelector('#qtable'); await shot(t.page, 'noname-basket', true); await t.ctx.close();
    t = await open({ save: SAVE, basket: NORMAL3, ship: 'US', path: '/merch/#/basket', vp }); await t.page.waitForSelector('#qtable');
    await t.page.evaluate(() => { window.__merch.api.checkout = () => Promise.reject({ status: 409, error: 'art_changed' }); });
    await tap(t.page, '#payBtn'); await settle(t.page); await t.page.evaluate(() => document.querySelector('#payErr').scrollIntoView({ block: 'center' })); await shot(t.page, 'error');
    await t.page.evaluate(() => { window.__merch.api.quote = () => Promise.reject({ status: 400, error: 'bad_name', line: 2 }); return window.__merch.requote(); }); await settle(t.page);
    await t.page.evaluate(() => document.querySelector('.bl.needs').scrollIntoView({ block: 'start' })); await shot(t.page, 'error-line'); await t.ctx.close();
    t = await open({ save: SAVE, basket: NORMAL3.slice(0, 2), ship: 'US', path: '/merch/?demo=1#/basket', vp }); await t.page.waitForSelector('#qtable');
    await tap(t.page, '#payBtn'); await tap(t.page, '#demoBtn'); await t.page.waitForSelector('.testtag');
    await t.page.evaluate(() => { const k = 'dd_merch_test_orders_v1', all = JSON.parse(sessionStorage.getItem(k)), o = all[Object.keys(all)[0]]; o.paid_at -= 7200000; o.cancel_until -= 7200000; sessionStorage.setItem(k, JSON.stringify(all)); });
    await t.page.reload(); await t.page.waitForSelector('.testtag'); await settle(t.page); await shot(t.page, 'order-late', true);
    await t.page.evaluate(() => { location.hash = '#/'; }); await settle(t.page);
    await t.page.evaluate(() => { const s = document.querySelector('#shipSel'); s.size = 14; s.style.height = 'auto'; s.style.backgroundImage = 'none'; s.value = 'FK'; s.scrollIntoView({ block: 'start' }); s.selectedOptions[0].scrollIntoView({ block: 'center' }); window.scrollTo(0, 0); });
    await shot(t.page, 'shipto'); await t.ctx.close();
  }
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  BASE = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
  const t0 = Date.now();
  CATJS = await import(require('url').pathToFileURL(path.join(ROOT, 'cloudflare', 'merch', 'catalog.js')).href);
  try { if (SHOTS6) await part6Shots(); else if (P9) { await part9Checks(); await orderStateChecks(); } else { await fakeChecks(); await pageChecks(); await orderStateChecks(); await fitChecks(); await orderFitChecks(); if (LOOK) await lookShots(); } } catch (e) { ok('the suite ran to the end', false, String(e && e.stack || e)); }
  await browser.close(); server.close();
  console.log(`merch_page: ${pass} passed, ${fail} failed (${((Date.now() - t0) / 1000).toFixed(0)} s, ART_VER ${P.ART_VER})`);
  if (fail) { console.log(fails.join('\n')); process.exit(1); }
})();
