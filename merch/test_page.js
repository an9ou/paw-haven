// Suite merch_page: the /merch page of doodledoggo.app in TEST MODE (site/merch/, docs/design/merch/PART2.md).
//   NODE_PATH=$(npm root -g) node merch/test_page.js            all checks (Playwright's Chromium; this file serves site/ itself)
//   SHOTS=1 NODE_PATH=$(npm root -g) node merch/test_page.js    also writes the owner's screenshots to docs/design/merch/part2_shots/ (dpr 2)
// Covers: dogs from a save, from a link, none; every step; adding, changing and removing basket lines; the 6-line and 3-each limits; "Ship to"
// changing the fee, the free-shipping line and the tax line; a shut country; the name rules and their words; the preview equals PawPrint.print()
// for the same options; no stickers anywhere; the page's quote equals the fake api's to the cent for 8 baskets; the pay button never leaves the
// page; nothing written to the game's save; no console errors; no request leaves the origin; the fit at 360x640, 390x844 and 1280x720.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = path.join(ROOT, 'site'), BRAND = path.join(ROOT, 'brand');
const HTML = fs.readFileSync(path.join(SITE, 'merch', 'index.html'), 'utf8');
const PP_SRC = (/src="\/merch\/(print\/pp1-[0-9a-z]+\/pawprint\.js)"/.exec(HTML) || [])[1];
if (!PP_SRC || !fs.existsSync(path.join(SITE, 'merch', PP_SRC))) { console.error('site/merch has no PawPrint build: run NODE_PATH=$(npm root -g) node tools/merch_build.js'); process.exit(1); }
const P = require(path.join(SITE, 'merch', PP_SRC)), MerchFake = require(path.join(SITE, 'merch', 'api_fake.js'));
const CAT = JSON.parse(fs.readFileSync(path.join(SITE, 'merch', 'catalog.json'), 'utf8'));
const SHOTS = process.env.SHOTS === '1', SHOT_DIR = path.join(ROOT, 'docs', 'design', 'merch', 'part2_shots');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright is needed (NODE_PATH=$(npm root -g))'); process.exit(1); }

let pass = 0, fail = 0; const fails = [];
function ok(name, cond, detail) { if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ': ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); console.log('FAIL ' + name, detail !== undefined ? detail : ''); } }
const money = (c) => '$' + (c / 100).toFixed(2);

// ---- the site, served as the web root (the brand icons at the root, as tools/cf_site.js serves them)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, s) => {
  const p = decodeURIComponent(q.url.split(/[?#]/)[0]);
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
const FROM_SAVE = P.merchFromSave(SAVE, { today: new Date() }).dogs; // Biscuit, Mochi, Sir Wigglesworth III, Bo, Pepper (page order: Mochi first, the active one)
const R = (name) => FROM_SAVE.find((d) => d.name === name).recipe;
const enc = (r) => P.merchEncode([r]);
const line = (r, product, o) => Object.assign({ id: 'x' + Math.random().toString(36).slice(2, 8), recipe: enc(r), product, colour: product === 'tee' ? 'white' : 'white', size: product === 'tee' ? 'M' : null, pose: 'stand', name_on: !!r.n, qty: 1 }, o || {});

let BASE, browser;
// one page in a fresh context: { save, basket, ship, path, vp, dpr, lang }
async function open(o) {
  o = o || {};
  const vp = o.vp || [390, 844];
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: o.dpr || 1, locale: o.lang || 'en-US' });
  await ctx.addInitScript((seed) => {
    if (!sessionStorage.getItem('__seeded')) {
      sessionStorage.setItem('__seeded', '1');
      if (seed.save) localStorage.setItem('pawhaven_proto_v1', seed.save);
      if (seed.basket) localStorage.setItem('dd_merch_basket_v1', seed.basket);
      if (seed.ship) localStorage.setItem('dd_merch_ship_v1', seed.ship);
    }
    // from here on, every storage write the page makes is recorded
    const W = window.__writes = [], S = Storage.prototype, set = S.setItem, rem = S.removeItem, clr = S.clear;
    S.setItem = function (k, v) { W.push(['set', k]); return set.call(this, k, v); };
    S.removeItem = function (k) { W.push(['remove', k]); return rem.call(this, k); };
    S.clear = function () { W.push(['clear', '*']); return clr.call(this); };
  }, { save: o.save || '', basket: o.basket ? JSON.stringify(o.basket) : '', ship: o.ship || '' });
  const page = await ctx.newPage();
  const errors = [], outside = [], navs = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) outside.push(r.url()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs.push(f.url()); });
  await page.goto(BASE + (o.path || '/merch/'));
  await page.waitForSelector('html.merch-ready', { timeout: 20000 });
  return { page, ctx, errors, outside, navs };
}
const tap = async (page, sel) => { await page.click(sel); await page.waitForTimeout(60); };
const toHash = async (page, h) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(80); };
const setShip = async (page, code) => { await page.selectOption('#shipSel', code); await page.waitForTimeout(80); };
const view = (page) => page.evaluate(() => (document.querySelector('.mview.on') || {}).dataset.view);
const text = (page, sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
// the page's preview against PawPrint.print() from Node, both parsed by the same browser (so only the drawing can differ)
async function previewIs(page, sel, recipe, o) {
  const want = P.print(recipe, o);
  return page.evaluate(([sel, want]) => {
    const t = document.createElement('template'); t.innerHTML = want; const w = t.content.firstElementChild.outerHTML;
    const g = document.querySelector(sel); return !!g && g.outerHTML === w;
  }, [sel, want]);
}
async function finish(name, t) {
  ok(name + ': no console errors', t.errors.length === 0, t.errors.slice(0, 3));
  ok(name + ': no request left the origin', t.outside.length === 0, t.outside.slice(0, 3));
  const w = await t.page.evaluate(() => window.__writes).catch(() => []);
  ok(name + ': the game save was never written', !w.some((x) => x[1] === 'pawhaven_proto_v1' || x[0] === 'clear'), w);
  await t.ctx.close();
}

// ================= the fake api on its own (Node) =================
async function fakeChecks() {
  const F = MerchFake({ PawPrint: P, catalog: CAT }), FD = MerchFake({ PawPrint: P, catalog: CAT, demo: true });
  const c = await F.catalog();
  ok('fake: catalog has the mug and the tee only (no stickers)', c.products.map((p) => p.id).join() === 'mug,tee');
  ok('fake: catalog shape', ['cat_ver', 'shut', 'sold_out_today', 'products', 'zones', 'countries', 'max_lines', 'max_qty', 'art_vers'].every((k) => k in c) && c.max_lines === 6 && c.max_qty === 3 && c.shut === true && c.art_vers[0] === P.ART_VER);
  ok('fake: prices from SHIPPING.md model C', c.products[0].price === 1999 && c.products[1].price === 2699 && c.zones.find((z) => z.id === 'us_jp').fee === 499 && c.zones.find((z) => z.id === 'us_jp').free_from === 3500 && c.zones.find((z) => z.id === 'world').free_from === null);
  ok('fake: tee colours and sizes are PawPrint\'s', c.products[1].colours.every((x) => { const T = P.TEE_COLOURS.find((y) => y.id === x.id); return T && x.sizes.join() === T.sizes.both.join(); }) && c.products[1].colours.length === P.TEE_COLOURS.length);
  ok('fake: never-countries are not listed', !['RU', 'BY', 'IR', 'KP', 'CU', 'SY', 'UA', 'VE', 'EC', 'PS'].some((k) => c.countries.some((x) => x.code === k)));
  ok('fake: the UK and the EU are coming soon', ['GB', 'DE', 'FR', 'BR', 'KR'].every((k) => c.countries.find((x) => x.code === k).soon === true) && !c.countries.find((x) => x.code === 'US').soon);
  const L1 = line(R('Mochi'), 'mug'), L2 = line(R('Biscuit'), 'tee', { colour: 'navy', size: '2XL', qty: 2 });
  const api = (l) => ({ recipe: l.recipe, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on, qty: l.qty });
  const q = await F.quote({ country: 'US', lines: [api(L1), api(L2)] });
  ok('fake: quote numbers', q.subtotal === 1999 + 2 * 2899 && q.ship_fee === 0 && q.total === q.subtotal && q.lines[1].unit === 2899 && q.notes.includes('separate_parcels'), q);
  const q2 = await F.quote({ country: 'HK', lines: [api(L1), api(L2)] });
  ok('fake: everywhere else pays $11.99 + $5.99 each extra', q2.ship_fee === 1199 + 2 * 599 && q2.free_from === null && q2.notes.includes('import_tax'), q2);
  const err = async (p) => p.then(() => null, (e) => e);
  ok('fake: bad country', (await err(F.quote({ country: 'ZZ', lines: [api(L1)] }))).error === 'bad_country');
  ok('fake: shut country 403', (await err(F.quote({ country: 'GB', lines: [api(L1)] }))).status === 403);
  ok('fake: 7 lines is too many', (await err(F.quote({ country: 'US', lines: Array(7).fill(api(L1)) }))).error === 'too_many');
  ok('fake: qty 4 refused', (await err(F.quote({ country: 'US', lines: [Object.assign(api(L1), { qty: 4 })] }))).error === 'bad_qty');
  ok('fake: stickers are not on sale', (await err(F.quote({ country: 'US', lines: [Object.assign(api(L1), { product: 'stickers' })] }))).error === 'variant_off');
  ok('fake: a size the colour lacks', (await err(F.quote({ country: 'US', lines: [Object.assign(api(L2), { colour: 'pink', size: '4XL' })] }))).error === 'bad_line');
  const longMug = enc(Object.assign({}, R('Mochi'), { n: 'WWWWWWWWWWWWWWWWWWWW' }));
  ok('fake: a name too long for the mug', (await err(F.quote({ country: 'US', lines: [Object.assign(api(L1), { recipe: longMug })] }))).error === 'bad_name');
  const body = { country: 'US', lines: [api(L1)], expect_total: 2498, art_ver: P.ART_VER, nonce: 'abcdefgh12', agree: true, lang: 'en' };
  ok('fake: checkout while shut is 503 merch_closed', (await err(F.checkout(body))).error === 'merch_closed');
  ok('fake: checkout needs agree', (await err(F.checkout(Object.assign({}, body, { agree: false })))).error === 'no_agree');
  ok('fake: checkout checks the total', (await err(F.checkout(Object.assign({}, body, { expect_total: 2000 })))).error === 'price_changed');
  ok('fake: checkout checks the art version', (await err(F.checkout(Object.assign({}, body, { art_ver: 'pp1-00000000' })))).error === 'art_changed');
  ok('fake: no test orders without demo', (await err(F.demoPay(body))).status === 403);
  const d = await FD.demoPay(body), o = await FD.order(d.order);
  ok('fake: a demo order reads back', o.test === true && o.totals.total === 2498 && o.can_cancel === true && o.lines[0].name === 'Mochi');
  ok('fake: cancel in the hour', (await FD.cancel(d.order, { scope: 'order' })).status === 'cancelled' && (await FD.order(d.order)).status === 'cancelled');
  ok('fake: unknown order 404', (await err(FD.order('mo_nope'))).status === 404);
}

// ================= the page =================
async function pageChecks() {
  // ---- dogs from the save, and every step
  let t = await open({ save: SAVE });
  let pg = t.page;
  ok('home: the landing shows', (await view(pg)) === 'home' && /Put your dog on a mug/.test(await text(pg, '#h-home')));
  ok('home: two products, no stickers', (await pg.$$eval('#trio li', (l) => l.length)) === 2 && !/sticker/i.test(await pg.evaluate(() => document.body.innerText)));
  ok('home: the shipping line for the guessed country', /United States: \$4\.99\. Orders of \$35 or more ship free/.test(await text(pg, '#homeShip')));
  ok('home: ship to has the US first guess', (await pg.$eval('#shipSel', (s) => s.value)) === 'US');
  ok('home: test mode is said', /Test mode/.test(await text(pg, '#testbar')));
  ok('home: noindex', /noindex/.test(await pg.$eval('meta[name=robots]', (m) => m.content)));
  await tap(pg, '#useDog');
  ok('pick: five dogs from the save', (await pg.$$eval('[data-pick]', (b) => b.length)) === 5);
  const names = await pg.$$eval('[data-pick] .n', (b) => b.map((x) => x.textContent));
  ok('pick: the dog being played comes first', names[0] === 'Mochi' && (await text(pg, '[data-pick] .fav')).includes('playing now'), names);
  ok('pick: puppy, newborn and outfit tags', (await pg.$$eval('.dogb .w', (w) => w.map((x) => x.textContent).join('|'))).match(/Puppy.*wearing Party Hat, Red Bandana|wearing Party Hat, Red Bandana.*Puppy/) !== null && /Newborn/.test(await text(pg, '#pickBody')));
  ok('pick: from the save, said so', /from the game in this browser/.test(await text(pg, '.from')));
  ok('pick: four ready-made dogs too', (await pg.$$eval('#readyPick [data-dog]', (b) => b.length)) === 4);
  ok('pick: step 1 of 4', /step 1 of 4/.test(await text(pg, '#crumbs')));
  await pg.click('[data-pick]:nth-of-type(1)'); // Mochi (already chosen)
  await tap(pg, '#pickNext');
  ok('thing: mug and tee', (await view(pg)) === 'thing' && (await pg.$$eval('.prodb', (b) => b.map((x) => x.dataset.p).join())) === 'mug,tee');
  ok('thing: prices from the catalog', /\$19\.99/.test(await text(pg, '[data-p=mug]')) && /from \$26\.99/.test(await text(pg, '[data-p=tee]')));
  ok('thing: product tiles are PawPrint prints', await previewIs(pg, '[data-p=tee] svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'white', pose: 'stand', name: true }));
  await tap(pg, '.prodb[data-p=tee]');
  ok('make: shows', (await view(pg)) === 'make' && /step 3 of 4/.test(await text(pg, '#crumbs')));
  ok('make: preview = PawPrint.print (tee, white, stand, name)', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'white', pose: 'stand', name: true }));
  await tap(pg, '[data-col=navy]'); await tap(pg, '[data-pose=happy]');
  ok('make: preview = PawPrint.print (tee, navy, happy, name)', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'navy', pose: 'happy', name: true }));
  ok('make: the file view = PawPrint.print', await previewIs(pg, '#pvFlat svg[data-pawprint]', R('Mochi'), { product: 'tee', colour: 'navy', pose: 'happy', name: true }));
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
  await pg.fill('#nameIn', 'shpx'.replace(/[a-z]/g, (ch) => String.fromCharCode((ch.charCodeAt(0) - 84) % 26 + 97))); await pg.waitForTimeout(60);
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
  ok('basket: its picture is the print', await previewIs(pg, '.bl svg[data-pawprint]', Object.assign({}, R('Mochi'), { n: 'Mochi the Brave' }), { product: 'tee', colour: 'navy', pose: 'happy', name: true }));
  ok('basket: kept under its own key', JSON.parse(await pg.evaluate(() => localStorage.getItem('dd_merch_basket_v1'))).length === 1);
  ok('basket: one tee to the US: $4.99 shipping', (await text(pg, '[data-q=ship]')) === '$4.99' && (await text(pg, '[data-q=total]')) === '$31.98');
  ok('basket: the plain free-shipping line', /Orders of \$35 or more ship free\./.test(await text(pg, '#totals')));
  ok('basket: USD only, with one currency line', /Prices are in US dollars/.test(await text(pg, '#totals')) && !/£|€|GBP/.test(await text(pg, '#totals')));
  ok('basket: the policy lines', /can't be returned if you change your mind/.test(await text(pg, '#promise')) && /damaged, misprinted or lost/.test(await text(pg, '#promise')) && /cancel within 1 hour/.test(await text(pg, '#promise')));
  ok('basket: an adult orders', /18 or over/.test(await text(pg, '.grown')));
  // a second line: the mug with the 20-letter name
  await tap(pg, '#another'); await pg.click('[data-pick]:nth-of-type(1)');
  await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-pick]')].find((x) => /Wigglesworth/.test(x.textContent)); b.click(); });
  await tap(pg, '#pickNext'); await tap(pg, '.prodb[data-p=mug]');
  ok('make: the mug preview = PawPrint.print', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Sir Wigglesworth III'), { product: 'mug', colour: 'white', pose: 'stand', name: true }));
  await pg.fill('#nameIn', 'WWWWWWWWWWWWWWWWWWWW'); await pg.waitForTimeout(60);
  ok('name: too long for the mug says "A little shorter, please" and how many fit', /A little shorter, please: up to 16/.test(await text(pg, '#nameMsg')));
  await pg.fill('#nameIn', 'Sir Wigglesworth III'); await pg.waitForTimeout(60);
  await tap(pg, '#addBtn');
  ok('basket: mug + tee ship free in the US', (await text(pg, '[data-q=ship]')) === 'Free' && (await text(pg, '[data-q=total]')) === '$46.98');
  ok('basket: separate parcels said', /own parcels/.test(await text(pg, '#totals')));
  // Ship to: Canada, Hong Kong, the UK (coming soon), back to the US
  await setShip(pg, 'CA');
  ok('ship to Canada: $7.99, free from $70', (await text(pg, '[data-q=ship]')) === '$7.99' && /Orders of \$70 or more ship free/.test(await text(pg, '#totals')) && /Canada: \$7\.99/.test(await text(pg, '#shipBox')));
  await setShip(pg, 'HK');
  ok('ship to Hong Kong: $11.99 + $5.99, never free, the tax line', (await text(pg, '[data-q=ship]')) === '$17.98' && !/ship free/.test(await text(pg, '#totals')) && /import tax/.test(await text(pg, '#totals')) && /\$5\.99/.test(await text(pg, '#shipBox')));
  await setShip(pg, 'VC');
  ok('ship to the longest name', /St\. Vincent and Grenadines/.test(await text(pg, '#shipBox')));
  await setShip(pg, 'GB');
  ok('ship to the UK: coming soon, no total, no pay', /Coming soon to the United Kingdom/.test(await text(pg, '#shipBox')) && !(await pg.$('#qtable')) && await pg.$eval('#payBtn', (b) => b.disabled));
  await setShip(pg, 'US');
  ok('ship to is kept', (await pg.evaluate(() => localStorage.getItem('dd_merch_ship_v1'))) === 'US');
  // change a line, qty, remove
  await pg.click('.bl:nth-child(1) [data-chg]'); await pg.waitForTimeout(80);
  ok('change: back on make, with Save changes', (await view(pg)) === 'make' && (await text(pg, '#addBtn')) === 'Save changes');
  await tap(pg, '[data-col=black]'); await tap(pg, '[data-size=L]'); await tap(pg, '#addBtn');
  ok('change: the line changed in place', /Black · L/.test(await text(pg, '.bl:nth-child(1)')) && (await pg.$$eval('.bl', (l) => l.length)) === 2);
  await pg.click('.bl:nth-child(2) [data-qp]'); await pg.waitForTimeout(80); await pg.click('.bl:nth-child(2) [data-qp]'); await pg.waitForTimeout(80);
  ok('qty: 3 of the mug, then no more', (await text(pg, '.bl:nth-child(2) output')) === '3' && await pg.$eval('.bl:nth-child(2) [data-qp]', (b) => b.disabled));
  ok('qty: the total follows', (await text(pg, '[data-q=total]')) === money(2699 + 3 * 1999));
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
  ok('stepper: a done step goes back', (await view(pg)) === 'pick');
  const saveAfter = await pg.evaluate(() => localStorage.getItem('pawhaven_proto_v1'));
  ok('the game save is unchanged', saveAfter === SAVE);
  await finish('save flow', t);

  // ---- the 6-line and 3-each limits
  const six = ['Biscuit', 'Mochi', 'Sir Wigglesworth III', 'Bo', 'Pepper'].map((n) => line(R(n), 'mug')).concat([line(R('Pepper'), 'tee', { colour: 'black', size: 'XL' })]);
  t = await open({ save: SAVE, basket: six, path: '/merch/#/basket' }); pg = t.page;
  ok('six lines: shown', (await pg.$$eval('.bl', (l) => l.length)) === 6);
  ok('six lines: "Put another dog" is off, and says why', (await pg.$eval('#another', (a) => a.getAttribute('aria-disabled'))) === 'true' && /holds up to 6 things/.test(await text(pg, '#bfull')));
  await toHash(pg, '#/pick'); await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-pick]')].find((x) => /Biscuit/.test(x.textContent)); b.click(); });
  await tap(pg, '#pickNext'); await tap(pg, '.prodb[data-p=tee]');
  ok('six lines: a seventh can\'t be added', await pg.$eval('#addBtn', (b) => b.disabled) && /basket is full/.test(await text(pg, '#addMsg')));
  await toHash(pg, '#/thing'); await tap(pg, '.prodb[data-p=mug]');
  ok('six lines: the same thing again may still add up', !(await pg.$eval('#addBtn', (b) => b.disabled)));
  await tap(pg, '#qp'); await tap(pg, '#qp'); await tap(pg, '#addBtn');
  ok('3 each: adding the same mug again stops at 3', (await pg.$$eval('.bl', (l) => l.length)) === 6 && (await text(pg, '.bl:nth-child(1) output')) === '3');
  await finish('limits', t);

  // ---- the quote the page shows = the fake api's, to the cent, for 8 baskets
  const F = MerchFake({ PawPrint: P, catalog: CAT });
  const D = ['Biscuit', 'Mochi', 'Sir Wigglesworth III', 'Bo', 'Pepper'].map(R);
  const BASKETS = [
    ['US', [line(D[0], 'mug')]],
    ['US', [line(D[1], 'tee', { colour: 'pink', size: 'S' })]],
    ['JP', [line(D[0], 'mug'), line(D[1], 'tee', { colour: 'navy', size: 'XS', pose: 'sit' })]],
    ['CA', [line(D[2], 'tee', { size: '3XL', qty: 2 }), line(D[3], 'mug', { pose: 'happy' })]],
    ['AU', [line(D[4], 'mug', { qty: 3 })]],
    ['HK', [line(D[0], 'mug'), line(D[1], 'mug', { qty: 2 }), line(D[2], 'tee', { colour: 'black', size: '4XL' })]],
    ['MX', [line(D[3], 'tee', { colour: 'ice-blue', size: 'XS', name_on: false })]],
    ['NZ', D.map((d, i) => line(d, i % 2 ? 'tee' : 'mug', { qty: 1 + (i % 3), colour: i % 2 ? 'athletic-heather' : 'white', size: i % 2 ? 'L' : null })).concat([line(D[0], 'tee', { colour: 'soft-cream', size: '2XL' })])]];
  t = await open({ save: SAVE }); pg = t.page;
  for (const [i, [cc, lines]] of BASKETS.entries()) {
    const q = await F.quote({ country: cc, lines: lines.map((l) => ({ recipe: l.recipe, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on, qty: l.qty })) });
    await pg.evaluate(([b, cc]) => { localStorage.setItem('dd_merch_basket_v1', JSON.stringify(b)); localStorage.setItem('dd_merch_ship_v1', cc); }, [lines, cc]);
    await pg.reload(); await pg.waitForSelector('html.merch-ready'); await toHash(pg, '#/basket'); await pg.waitForSelector('#qtable');
    const shown = await pg.evaluate(() => ({ sub: document.querySelector('[data-q=subtotal]').textContent, ship: document.querySelector('[data-q=ship]').textContent, total: document.querySelector('[data-q=total]').textContent, lines: [...document.querySelectorAll('[data-lp]')].map((x) => x.textContent) }));
    const want = { sub: money(q.subtotal), ship: q.ship_fee ? money(q.ship_fee) : 'Free', total: money(q.total), lines: q.lines.map((l) => money(l.total)) };
    ok('quote ' + (i + 1) + ' (' + cc + ', ' + lines.length + ' lines): the page = the fake api', JSON.stringify(shown) === JSON.stringify(want), { shown, want });
  }
  await finish('quotes', t);

  // ---- dogs from a link (no save): this tab only, the hash turns into the route
  const link = '#p=' + P.merchEncode([R('Biscuit'), R('Bo')]);
  t = await open({ path: '/merch/' + link }); pg = t.page;
  ok('link: two dogs', (await view(pg)) === 'pick' && (await pg.$$eval('[data-pick]', (b) => b.length)) === 2 && /2 dogs came with your link/.test(await text(pg, '.from')));
  ok('link: the hash became the route', (await pg.evaluate(() => location.hash)) === '#/pick');
  ok('link: kept for this tab only', (await pg.evaluate(() => !!sessionStorage.getItem('dd_merch_link_v1') && !localStorage.getItem('dd_merch_link_v1'))));
  await pg.reload(); await pg.waitForSelector('html.merch-ready');
  ok('link: still there after a reload', (await pg.$$eval('[data-pick]', (b) => b.length)) === 2);
  await tap(pg, '#pickNext'); await tap(pg, '.prodb[data-p=mug]');
  ok('link: preview = PawPrint.print', await previewIs(pg, '#pvOn svg[data-pawprint]', R('Biscuit'), { product: 'mug', colour: 'white', pose: 'stand', name: true }));
  await finish('link', t);
  t = await open({ path: '/merch/#p=AQEAJSCQqVT8sQIBAAVNb2NoaRjX' }); pg = t.page;
  ok('bad link: said kindly, no dogs', /didn't come through whole/.test(await text(pg, '#pickBody')) && (await pg.$$eval('[data-pick]', (b) => b.length)) === 0);
  await finish('bad link', t);

  // ---- no dogs: the ready-made ones, Next stays off
  t = await open({}); pg = t.page;
  await tap(pg, '#useDog');
  ok('none: says how to bring a dog', /can't see any of your dogs/.test(await text(pg, '#pickBody')) && (await pg.$eval('#pickNext', (a) => a.getAttribute('aria-disabled'))) === 'true');
  await tap(pg, '#pickNext');
  ok('none: Next does nothing', (await view(pg)) === 'pick');
  await tap(pg, '#readyPick [data-dog]');
  ok('none: a ready-made dog goes to the thing', (await view(pg)) === 'thing');
  await tap(pg, '.prodb[data-p=tee]');
  ok('none: a ready-made dog has its name off', (await pg.$eval('#nameTog', (b) => b.getAttribute('aria-checked'))) === 'false');
  const ready = await pg.evaluate(() => window.__merch.READY[0].recipe);
  ok('none: preview = PawPrint.print (ready-made Lab)', await previewIs(pg, '#pvOn svg[data-pawprint]', ready, { product: 'tee', colour: 'white', pose: 'stand', name: false }));
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
  ok('demo: the cancel line is a plain time', /We'll start printing at \d\d:\d\d/.test(await text(pg, '.cancelbox')) && !(await text(pg, '.cancelbox')).match(/\d+:\d\d:\d\d/));
  ok('demo: the order shows its total', /\$24\.98/.test(await text(pg, '#orderBody')));
  ok('demo: the basket is empty after it', (await pg.evaluate(() => localStorage.getItem('dd_merch_basket_v1'))) === null);
  await tap(pg, '#cancelBtn'); await tap(pg, '#cancelYes'); await pg.waitForTimeout(150);
  ok('demo: cancel in the hour', /Your order is cancelled/.test(await text(pg, '#orderBody')));
  await finish('demo', t);
}

// ================= fit: every step at three sizes =================
const STEPS = [
  ['home', '/merch/', []],
  ['pick', '/merch/#/pick', []],
  ['thing', '/merch/#/pick', ['#pickNext']],
  ['make-tee', '/merch/#/pick', ['#pickNext', '.prodb[data-p=tee]', '[data-col=navy]']],
  ['make-mug', '/merch/#/pick', ['#pickNext', '.prodb[data-p=mug]']],
  ['basket', '/merch/#/basket', []],
  ['closed', '/merch/#/basket', ['#payBtn']],
  ['order', '/merch/?demo=1#/basket', ['#payBtn', '#demoBtn']]];
async function fitChecks() {
  const six = [line(R('Sir Wigglesworth III'), 'tee', { colour: 'navy', size: '2XL', pose: 'happy', qty: 3 }), line(R('Mochi'), 'mug', { pose: 'sit' }), line(R('Bo'), 'tee', { colour: 'black', size: 'XS', pose: 'sit' }),
    line(R('Biscuit'), 'mug', { qty: 2 }), line(R('Pepper'), 'tee', { colour: 'ice-blue', size: 'L' }), line(R('Sir Wigglesworth III'), 'mug', { pose: 'happy' })];
  for (const vp of [[360, 640], [390, 844], [1280, 720]]) {
    for (const [name, p, clicks] of STEPS) {
      const t = await open({ save: SAVE, basket: six, ship: 'VC', path: p, vp });
      const pg = t.page;
      for (const c of clicks) { await pg.click(c); await pg.waitForTimeout(80); }
      if (name === 'order') await pg.waitForSelector('.testtag');
      await pg.evaluate(() => window.scrollTo(0, 0));
      const r = await pg.evaluate(() => {
        const out = { wide: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: [], spill: [] };
        const vis = (e) => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && !e.closest('[hidden],dialog:not([open])'); };
        document.querySelectorAll('main button, main a, main select, main input, main summary').forEach((e) => {
          if (!vis(e)) return; const b = e.getBoundingClientRect();
          if (b.height < 43.5 || b.width < 43.5) out.small.push((e.id || e.className || e.tagName) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' "' + e.textContent.trim().slice(0, 20) + '"');
        });
        document.querySelectorAll('.card, .dogb, .prodb, .bl, .promise, .grown, .paybar, .from, .how3 li, .shopbar, .testbar, .eta, .ready button').forEach((c) => {
          if (!vis(c)) return; const cb = c.getBoundingClientRect();
          c.querySelectorAll('*').forEach((k) => { if (!vis(k) || k.closest('svg')) return; const b = k.getBoundingClientRect(); if (b.right > cb.right + 1.5 || b.left < cb.left - 1.5) out.spill.push((c.className || c.tagName) + ' > ' + (k.className || k.tagName) + ' ' + Math.round(b.left) + '-' + Math.round(b.right) + ' in ' + Math.round(cb.left) + '-' + Math.round(cb.right)); });
        });
        out.small = out.small.slice(0, 6); out.spill = out.spill.slice(0, 6); return out;
      });
      const tag = name + ' ' + vp.join('x');
      ok('fit ' + tag + ': no sideways scroll', r.wide <= 0, r.wide);
      ok('fit ' + tag + ': taps at least 44 px', r.small.length === 0, r.small);
      ok('fit ' + tag + ': text stays inside its card', r.spill.length === 0, r.spill);
      if (SHOTS && vp[0] !== 360) {
        const t2 = await open({ save: SAVE, basket: name === 'basket' || name === 'closed' || name === 'order' ? six.slice(0, name === 'order' ? 2 : 6) : six, ship: name === 'order' ? 'US' : 'VC', path: p, vp, dpr: 2 });
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

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  BASE = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
  const t0 = Date.now();
  try { await fakeChecks(); await pageChecks(); await fitChecks(); } catch (e) { ok('the suite ran to the end', false, String(e && e.stack || e)); }
  await browser.close(); server.close();
  console.log(`merch_page: ${pass} passed, ${fail} failed (${((Date.now() - t0) / 1000).toFixed(0)} s, ART_VER ${P.ART_VER})`);
  if (fail) { console.log(fails.join('\n')); process.exit(1); }
})();
