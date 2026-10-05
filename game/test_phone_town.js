// v2.2 phone, TOWN lane: town map, Market + shops, purchase sheet, Wardrobe, town places, Vet, Playdate board, painter, visitors.
// iPhone 13 (390x844) and Pixel 7 (412x915). Run: PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/test_phone_town.js
const { run, sleep } = require('./test_lib');

const TAP_SEL = 'button, [role=button], a[href], input:not([type=hidden]), select, .card';
const SKIP = '.lptip, #devPanel, #devBtn, #modHost, #bar, #hud, #toasts'; // the action bar, HUD and toasts belong to the SHELL lane

// phone minimums for whatever is on screen right now
async function audit(t, label) {
  await t.SH(label.replace(/[^a-z0-9]+/gi, "_"));
  const { ok, p } = t;
  const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  ok(sw === iw, `${label}: no horizontal scroll (${sw} = ${iw})`);
  const bad = await p.evaluate(({ sel, skip }) => {
    const out = [], vw = innerWidth, vh = innerHeight;
    document.querySelectorAll(sel).forEach((el) => {
      if (el.closest(skip)) return;
      let r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
      if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) return;
      if (el.closest('[hidden]')) return;
      if (el.tagName === 'g' || el.closest('svg') && el.tagName !== 'BUTTON') return; // scene hotspots are drawn art (checked by the map and scene tests)
      if (el.type === 'checkbox' && el.closest('label')) r = el.closest('label').getBoundingClientRect();
      if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18)}"`);
    });
    return out;
  }, { sel: TAP_SEL, skip: SKIP });
  ok(bad.length === 0, `${label}: tap targets >= 44 px${bad.length ? ' -> ' + bad.slice(0, 6).join(' | ') : ''}`);
  const small = await p.evaluate(({ skip }) => {
    const out = [], seen = new Set(), vw = innerWidth, vh = innerHeight;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode, el = n.parentElement; if (!el || !n.textContent.trim() || seen.has(el)) continue; seen.add(el);
      if (el.closest(skip) || el.closest('svg') || el.closest('[hidden]') || el.closest('script,style')) continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
      const cap = el.matches('.cap, .caption, .tstar') ? 13 : 15, fs = parseFloat(cs.fontSize);
      if (fs < cap - 0.01) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${fs}px "${n.textContent.trim().slice(0, 18)}"`);
    }
    return out;
  }, { skip: SKIP });
  ok(small.length === 0, `${label}: text >= 15 px${small.length ? ' -> ' + small.slice(0, 6).join(' | ') : ''}`);
}
// the panel (sheet) fits the screen and scrolls inside itself
async function sheetFits(t, label) {
  const r = await t.p.evaluate(() => { const e = document.querySelector('#modal:not([hidden]) .panel'); if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), iw: innerWidth, top: Math.round(b.top), h: Math.round(b.height), ih: innerHeight }; });
  t.ok(!!r && Math.abs(r.w - r.iw) < 3 && r.h <= r.ih * 0.9, `${label}: bottom sheet fits (${r ? r.w + 'x' + r.h : 'none'})`);
}
async function tapSel(t, sel, wait) { await t.p.locator(sel).first().tap(); await sleep(wait == null ? 250 : wait); }
async function openModalUp(t) { return t.until(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), null, 5000); }
async function closeSheet(t) { if (await t.p.locator('#modal:not([hidden]) .panel .x').count()) await tapSel(t, '#modal:not([hidden]) .panel .x'); await t.modalGone(); }
async function atPlace(t, k) {
  await t.ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, k);
  await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.getElementById('placeBtns'), k, 8000);
  await t.calm(); await t.lu();
}
function touchKit(t, cdp) {
  const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
  return async (pts, ms = 30) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
    for (let i = 1; i < pts.length; i++) { await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(...pts[i]) }); }
    await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
}
const line = (a, b, n = 10) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);

async function suite(t, dev) {
  const { ok, ev } = t;
  t.sec(dev + ': new game');
  await t.newGame({ device: dev }, { bond: { level: 7, pts: 1600 }, coins: 5000 });
  const p = t.p;
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');
  const cdp = await t.ctx.newCDPSession(p), touchDrag = touchKit(t, cdp);

  // ---------- town map ----------
  t.sec(dev + ': town map');
  await tapSel(t, '[data-act=map]', 900); ok(await t.until(() => window.__paw.mode === 'map', null, 6000), 'map opens by tap');
  await audit(t, 'map');
  const tf = () => ev(() => document.getElementById('mapInner').style.transform);
  const tx0 = await tf(), box = await p.locator('#mapPan').boundingBox(), mc = [box.x + box.width / 2, box.y + box.height / 2];
  await touchDrag(line([mc[0] + 110, mc[1]], [mc[0] - 110, mc[1]], 10)); await sleep(300);
  const tx1 = await tf(); ok(tx0 !== tx1, `map pans by touch drag (${tx0} -> ${tx1})`);
  ok(!(await ev(() => !!document.querySelector('#mapGo:not([hidden])'))), 'a drag does not open the confirm chip');
  await ev(() => window.__paw.mapTo('market')); await sleep(150);
  await p.locator('[data-area=market]').first().tap({ force: true }); await sleep(300);
  ok(/Go to Market Street/.test(await p.textContent('#mapGo')), 'tap a place: confirm chip "Go to Market Street"');
  await audit(t, 'map chip');
  const chip = await p.locator('#mapGo').boundingBox(); ok(chip.y + chip.height <= (await ev(() => innerHeight)) + 1 && chip.x >= 0, 'confirm chip is on screen');
  await tapSel(t, '#mapNo'); ok(await ev(() => document.getElementById('mapGo').hidden), 'chip closes with x');
  await ev(() => window.__paw.mapTo('pier')); await sleep(150); await p.locator('[data-area=pier]').first().tap({ force: true }); await sleep(250);
  await tapSel(t, '#mapGoBtn', 300); ok(await t.until(() => window.__paw.S.place === 'pier' && window.__paw.mode === 'yard' && !document.querySelector('.onway'), null, 15000), 'travelled to the pier by chip');
  await t.lu(); await t.calm();
  await audit(t, 'pier');
  ok(await p.locator('#placeBtns [data-pb=yard]').count() === 1, 'pier: Go home button');
  ok((await p.locator('#placeBtns .btn').evaluateAll((els) => els.every((e) => { const r = e.getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0; }))), 'pier: place buttons stay on screen');

  // ---------- market + shops ----------
  t.sec(dev + ': market');
  await atPlace(t, 'market'); await audit(t, 'market street');
  for (const [k, tabs] of [['kibble', ['food', 'toys', 'tools']], ['boutique', []], ['builder', ['houses', 'beds']]]) {
    await tapSel(t, `#placeBtns [data-sh=${k}]`, 350); ok(await openModalUp(t), `shop ${k} opens`);
    await sheetFits(t, 'shop ' + k); await audit(t, 'shop ' + k);
    for (const tb of tabs) {
      await tapSel(t, `[data-tab=${tb}], [data-btab=${tb}]`, 350); await audit(t, `shop ${k} / ${tb}`);
    }
    await closeSheet(t);
  }
  // purchase sheet with big - / +
  await tapSel(t, '#placeBtns [data-sh=kibble]', 350); await tapSel(t, '[data-tab=food]', 300);
  const k0 = (await t.S()).inv.food['Basic Kibble'] || 0;
  await tapSel(t, '[data-buy="Basic Kibble"]', 400); await p.waitForSelector('.buyveil .bb-yes');
  await audit(t, 'purchase sheet');
  const mp = await p.evaluate(() => ['.bb-m', '.bb-p', '.bb-yes', '.bb-no'].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  ok(mp[0][0] >= 56 && mp[0][1] >= 56 && mp[1][0] >= 56 && mp[1][1] >= 56, `big - / + buttons (${mp[0]} and ${mp[1]})`);
  await tapSel(t, '.bb-p'); await tapSel(t, '.bb-p'); await tapSel(t, '.bb-p'); await tapSel(t, '.bb-m');
  ok(await p.inputValue('.bb-in') === '3', 'purchase sheet: + + + - makes 3');
  await tapSel(t, '[data-qq="5"]'); ok(await p.inputValue('.bb-in') === '5', 'quick x5 by tap');
  await tapSel(t, '.bb-yes', 400); await t.until((n) => (window.__paw.S.inv.food['Basic Kibble'] || 0) >= n, k0 + 5, 4000);
  ok((await t.S()).inv.food['Basic Kibble'] === k0 + 5, 'bought 5 kibble by touch');
  await closeSheet(t);
  // a single-item purchase (no quantity): boutique, then the confirm card
  await tapSel(t, '#placeBtns [data-sh=boutique]', 350);
  const cl = await p.locator('[data-buy]').first().getAttribute('data-buy');
  await tapSel(t, '[data-buy]', 400); await p.waitForSelector('.buyveil .bb-yes'); await audit(t, 'purchase sheet (one item)');
  await tapSel(t, '.bb-yes', 400);
  if (await p.locator('.confirm .no').count()) { await audit(t, 'wear-it confirm'); await tapSel(t, '.confirm .no', 300); }
  ok((await t.S()).inv.clothes.includes(cl), 'bought ' + cl); await closeSheet(t);
  // Pip's Sprout Cart is another lane's popup, only opened here
  await tapSel(t, '#placeBtns [data-sh=sprout]', 400); ok(await openModalUp(t), 'Pip\'s Sprout Cart opens'); await sheetFits(t, 'sprout cart'); await closeSheet(t);

  // ---------- wardrobe ----------
  t.sec(dev + ': wardrobe');
  await atPlace(t, 'yard');
  await tapSel(t, '[data-act=wardrobe]', 400); ok(await openModalUp(t) && await p.locator('.ward').count() === 1, 'wardrobe opens');
  await sheetFits(t, 'wardrobe'); await audit(t, 'wardrobe');
  await tapSel(t, `[data-eq="${cl}"]`, 300); ok(Object.values((await t.S()).outfit).includes(cl), 'wardrobe: equipped ' + cl + ' by tap');
  await audit(t, 'wardrobe (worn)'); await closeSheet(t);

  // ---------- town places ----------
  t.sec(dev + ': places');
  await atPlace(t, 'square'); await audit(t, 'town square');
  await tapSel(t, '#placeBtns [data-pb=notice]', 350); ok(await openModalUp(t), 'town notice opens'); await audit(t, 'town notice'); await closeSheet(t);
  ok(await p.locator('#placeBtns [data-pb3=painter]').count() === 1, 'square: Family Portrait button');
  await tapSel(t, '#placeBtns [data-pb3=painter]', 350); ok(await openModalUp(t), 'painter opens'); await sheetFits(t, 'painter'); await audit(t, 'painter');
  const before = (await t.S()).coins; await tapSel(t, '#twPaintGo', 500);
  ok((await t.S()).coins === before - 500 && !!(await t.S()).portrait, 'painter: paid and the portrait is saved'); await t.modalGone();
  await atPlace(t, 'cafe'); await audit(t, 'cafe');
  await tapSel(t, '#placeBtns [data-pb=cafe]', 350); ok(await openModalUp(t), 'cafe menu opens'); await sheetFits(t, 'cafe'); await audit(t, 'cafe menu');
  await tapSel(t, '[data-cafe]', 400); ok(await t.until(() => !!window.__paw.S.dog.cafeDay || window.__paw.S.dogs.some((d) => d.cafeDay), null, 4000), 'cafe: bought a treat by tap'); await t.modalGone();
  await atPlace(t, 'hilltop'); await audit(t, 'hilltop');
  await atPlace(t, 'salon'); await audit(t, 'salon');
  await tapSel(t, '#placeBtns [data-pb=groom]', 350); ok(await openModalUp(t), 'salon popup opens'); await sheetFits(t, 'salon'); await audit(t, 'salon popup');
  await tapSel(t, '#slGo', 500); ok(!!(await t.S()).dog.fluffyUntil, 'salon: groomed by tap'); await t.modalGone();

  // ---------- vet ----------
  t.sec(dev + ': vet');
  await atPlace(t, 'vet'); await audit(t, 'vet clinic');
  await tapSel(t, '#placeBtns [data-pb=vet]', 350); ok(await openModalUp(t), 'vet opens'); await sheetFits(t, 'vet'); await audit(t, 'vet');
  await tapSel(t, '#vetGene', 500); ok(await openModalUp(t), 'gene test card opens'); await audit(t, 'gene card');
  ok(!!(await t.S()).dog.geneTested, 'gene test done by tap'); await closeSheet(t);
  await t.patch({ sniffer: true });
  await tapSel(t, '#placeBtns [data-pb=vet]', 350); await audit(t, 'vet (after test)'); await closeSheet(t);
  await t.patch({ dog: { geneTested: false } });
  await tapSel(t, '#placeBtns [data-pb=vet]', 350);
  if (await p.locator('#vetSniff').count()) { await tapSel(t, '#vetSniff', 500); ok(await openModalUp(t), 'vet sniff opens'); await audit(t, 'vet sniff'); }
  await closeSheet(t);
  await tapSel(t, '#placeBtns [data-pb=vet]', 350); await tapSel(t, '#vetGo', 600); ok(await p.locator('#vetOk').count() === 1, 'check-up health card'); await audit(t, 'health card'); await tapSel(t, '#vetOk', 300); await t.modalGone();

  // ---------- dog park, board, visitors ----------
  t.sec(dev + ': dog park');
  await t.patch({ sniffer: true, sniffed: {} });
  await atPlace(t, 'dogpark'); await audit(t, 'dog park');
  await tapSel(t, '#placeBtns [data-pb2=playboard]', 400); ok(await openModalUp(t) && await p.locator('.pbcard').count() === 4, 'playdate board opens with 4 dogs');
  await sheetFits(t, 'playboard'); await audit(t, 'playboard');
  const sn = await p.locator('[data-sniff]').count(); ok(sn === 4, 'board: Sniff buttons');
  await tapSel(t, '[data-sniff]', 300); ok(await p.locator('.pbsniff').count() === 1, 'board: sniffed a dog by tap'); await audit(t, 'playboard (sniffed)');
  const box2 = await p.locator('#modal .panel-body, #modal .panel').first().boundingBox();
  await ev(() => { const b = document.querySelector('#modal .panel-body'); if (b) b.scrollTop = 0; });
  await touchDrag(line([box2.x + box2.width / 2, box2.y + box2.height * 0.7], [box2.x + box2.width / 2, box2.y + box2.height * 0.3], 8), 20); await sleep(300);
  ok(await ev(() => !document.getElementById('modal').hidden), 'board: an upward swipe scrolls, it does not close the sheet');
  await closeSheet(t);
  // visitors: a rehomed pup visits and is pet by touch
  await t.patch({ rehomed: [{ id: 'rh1', key: 'mutt', name: 'Pickle', sex: 'male', born: new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10), family: 'the Tanakas by the bakery', genes: null }] });
  await ev(() => { window.__paw.town.visit('rh1'); });
  ok(await t.until(() => !!document.getElementById('visitorG'), null, 4000), 'visitor dog is drawn');
  await p.locator('#visitorG').first().tap({ force: true }); ok(await openModalUp(t) && await p.locator('#vzPet').count() === 1, 'tap the visitor: card opens');
  await sheetFits(t, 'visitor'); await audit(t, 'visitor card');
  await tapSel(t, '#vzPet', 400); ok(await t.until(() => window.__paw.S.rehomed[0].petDay, null, 3000), 'visitor petted by tap'); await t.modalGone();
  await audit(t, 'dog park (end)');
}

(async () => {
  for (const dev of ['iPhone 13', 'Pixel 7']) await run('phone_town_' + dev.replace(/\s+/g, '').toLowerCase(), (t) => suite(t, dev), { device: dev });
})();
