// v2.5 FIXES A on phones (iPhone 13 390x844, Pixel 7 412x915): the owner's v2.4 feedback items 1, 3, 5 and 8, measured on the real page.
//   1 map: the map draws the full width (no gutter), the controls float over it with 44 px taps, and every place label can be dragged clear of them;
//   3 trays: every owned food (all 20, the festival foods too) and every Play / Care / snacks card is reachable, 44 px, with a visible "more" cue;
//   5 close X: the recipe book, the kitchen, the seed pouch, the training panel and the bottom sheets keep a 44 px X in the top-right corner while they scroll;
//   8 fills: every button, card, chip, tab, round button, badge, tray and sheet keeps its crayon fill inside its pencil outline, day and night.
// node game/run_tests.js game/test_phone_v25_fixes_a.js   (--shots writes game/shots_phone_v25_fixes_a_<device>/)
const { run } = require('./test_lib'); const { fillAudit } = require('./v25_fixes_a_fill'); const fs = require('fs'); const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, 'src/00_core.js'), 'utf8');
const FOODS = ['FOOD', 'TFOOD'].flatMap((k) => [...new RegExp(`const ${k} = \\[[\\s\\S]*?\\n\\];`).exec(SRC)[0].matchAll(/n: '([^']+)'/g)].map((m) => m[1])).filter((n) => n !== 'Fresh Water');
const FILL = '.btn, .act, .opt, .chip, .arrow, .iconbtn, .xbtn, .portrait, .card, .card .cnt, .sitem, .tray, .panel, #status, .heads button, .track, [role=tab], #devBtn';

// a close button stays put and in the top-right corner of its sheet while every scroller around it scrolls to the end
async function xFixed(t, xSel, boxSel, label) {
  const r = await t.ev(async ({ xSel, boxSel }) => {
    const x = document.querySelector(xSel), box = document.querySelector(boxSel); if (!x || !box) return null;
    const a = x.getBoundingClientRect(), a0 = box.getBoundingClientRect(); const sc = []; for (let e = x.parentElement; e; e = e.parentElement) if (e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY)) sc.push(e);
    sc.forEach((e) => { e.scrollTop = e.scrollHeight; }); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const b = x.getBoundingClientRect(), bb = box.getBoundingClientRect(), hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    const out = { moved: Math.round(Math.hypot(b.left - bb.right - (a.left - a0.right), b.top - bb.top - (a.top - a0.top))), w: Math.round(b.width), h: Math.round(b.height), right: Math.round(Math.min(bb.right, innerWidth) - b.right), top: Math.round(b.top - Math.max(bb.top, 0)), onTop: !!hit && (hit === x || x.contains(hit)), scrolled: sc.length, inView: b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth };
    sc.forEach((e) => { e.scrollTop = 0; }); return out;
  }, { xSel, boxSel });
  t.ok(!!r && r.moved <= 1 && r.inView && r.onTop, `${label}: the close X stays in its corner and on screen while the sheet scrolls (${r ? `${r.scrolled} scroller(s), moved ${r.moved} px` : 'none'})`);
  t.ok(!!r && r.w >= 44 && r.h >= 44 && r.right <= 24 && r.top <= 24, `${label}: the X is ${r ? r.w + 'x' + r.h : '?'} px, in the top-right corner (${r ? r.right + ' px from the right, ' + r.top + ' px from the top' : ''})`);
}
// every card of the open tray can be brought fully into view inside the tray and is >= 44 px; the row says it scrolls (a peeking column under a fade)
async function trayReach(t, label, want) {
  const r = await t.ev(async () => {
    const row = document.querySelector('#dock > .tray .row'); if (!row) return null; const cards = [...row.querySelectorAll(':scope > .card')], out = [];
    const rr = () => row.getBoundingClientRect(), body = row.closest('.tray-body') || row;
    for (const c of cards) {
      c.scrollIntoView({ block: 'nearest', inline: 'nearest' }); await new Promise((r) => requestAnimationFrame(r));
      const b = c.getBoundingClientRect(), v = rr(), bb = body.getBoundingClientRect(), fade = getComputedStyle(row).maskImage !== 'none' ? 30 : 0;
      out.push({ n: c.dataset.food || c.dataset.play || c.dataset.care || c.dataset.dish || c.textContent.trim().slice(0, 12), w: Math.round(b.width), h: Math.round(b.height), in: b.left >= v.left - 0.5 && b.right <= v.right - fade + 0.5 && b.top >= bb.top - 0.5 && b.bottom <= bb.bottom + 0.5 && b.bottom <= innerHeight && b.right <= innerWidth });
    }
    row.scrollLeft = 0; await new Promise((r) => requestAnimationFrame(r));
    const v = rr(), over = row.scrollWidth > row.clientWidth + 2, peek = cards.some((c) => { const b = c.getBoundingClientRect(); return b.left < v.right - 4 && b.right > v.right + 4; });
    return { out, over, peek, mask: getComputedStyle(row).maskImage !== 'none', sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  const bad = r ? r.out.filter((c) => !c.in || c.w < 44 || c.h < 44) : [];
  t.ok(!!r && r.out.length >= want, `${label}: ${r ? r.out.length : 0} cards (want ${want})`);
  t.ok(!!r && bad.length === 0, `${label}: every card scrolls fully into view and is >= 44 px${bad.length ? ' -> ' + bad.slice(0, 4).map((c) => `${c.n} ${c.w}x${c.h}${c.in ? '' : ' out of reach'}`).join(' | ') : ''}`);
  if (r && r.over) t.ok(r.peek && r.mask, `${label}: the row shows it scrolls (the next column peeks out under a fade)`);
  t.ok(!!r && r.sw === r.iw, `${label}: no sideways page scroll`);
  return r;
}
async function swipe(t, sel, dx) { // a real touch drag (CDP), not a scrollLeft write
  const b = await t.p.locator(sel).first().boundingBox(); const cdp = await t.p.context().newCDPSession(t.p);
  const y = b.y + b.height / 2; let x = dx < 0 ? b.x + b.width - 40 : b.x + 40;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 0; i < 12; i++) { x += dx / 12; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await t.sleep(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await t.sleep(400); await cdp.detach();
}
async function fillCheck(t, label, sel) { await fillAudit(t, sel || FILL, label, { skip: '#toasts, #bubble' }); }

async function suite(t, dev) {
  const { ok, ev, sec } = t; const tag = dev.replace(/\s+/g, '').toLowerCase();
  sec(dev + ': new game');
  await t.newGame({ device: dev }, { bond: { level: 10, pts: 9000 }, coins: 5000 }); const p = t.p;
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');
  await p.addStyleTag({ content: '#bubble{display:none!important}' });

  sec(dev + ': 1. map controls float over a full-width map');
  await ev(() => window.__paw.go('map')); await p.waitForSelector('#mapZoom'); await t.until(() => !!document.querySelector('#mapInner svg text'), null, 5000); await t.sleep(300);
  const m = await ev(() => {
    const q = (s) => document.querySelector(s).getBoundingClientRect(), v = q('#view'), inner = q('#mapInner'), out = {};
    out.drawn = [Math.round(Math.max(inner.left, v.left)), Math.round(Math.min(inner.right, v.right))]; out.view = [Math.round(v.left), Math.round(v.right)];
    // what is under the right-hand strip next to the controls: map art, never a blank gutter (the view's own background)
    const xs = [v.right - 3, v.right - 30], ys = [v.top + v.height * 0.45, v.top + v.height * 0.6, v.top + v.height * 0.8];
    out.strip = xs.flatMap((x) => ys.map((y) => { const e = document.elementFromPoint(x, y); return !!e && !!e.closest('#mapInner, #mapZoom, #mapX, #mapGo'); }));
    out.btns = ['#mapX', '#mapZin', '#mapZout'].map((s) => { const b = q(s); return [s, Math.round(b.width), Math.round(b.height)]; });
    const ctl = ['#mapX', '#mapZoom'].map(q); out.cover = [...document.querySelectorAll('#mapInner svg text')].filter((e) => e.textContent.trim().length > 1 && !/Paw Haven Town/.test(e.textContent)).filter((e) => { const r = e.getBoundingClientRect(); return ctl.some((c) => r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom); }).map((e) => e.textContent.trim());
    const z = q('#mapZoom'), dv = q('#devBtn'); out.devClear = dv.right <= z.left || dv.left >= z.right || dv.bottom <= z.top || dv.top >= z.bottom;
    return out;
  });
  ok(m.drawn[0] <= m.view[0] && m.drawn[1] >= m.view[1], `the map is drawn across the full width (${m.drawn.join('-')} of ${m.view.join('-')})`);
  ok(m.strip.every(Boolean), 'no blank gutter: the right edge beside the controls shows the map');
  ok(m.btns.every((b) => b[1] >= 44 && b[2] >= 44), 'X, + and - are 44 px or more ' + JSON.stringify(m.btns));
  ok(m.cover.length === 0, 'at the start no place label is under a control' + (m.cover.length ? ' -> ' + m.cover.join(', ') : ''));
  ok(m.devClear, 'the dev button no longer peeks out behind the zoom column');
  await t.SH('1_map_' + tag);
  // drag across the whole map: every place label is at some point fully on screen and clear of the controls (the right edge can be pulled out from under them)
  const seen = new Set(), all = await ev(() => [...new Set([...document.querySelectorAll('#mapInner svg text')].map((e) => e.textContent.trim()).filter((s) => s.length > 1 && !/Paw Haven Town/.test(s)))]);
  const look = async () => (await ev(() => { const v = document.querySelector('#view').getBoundingClientRect(), ctl = ['#mapX', '#mapZoom', '#devBtn', '#status'].map((s) => document.querySelector(s).getBoundingClientRect()); return [...document.querySelectorAll('#mapInner svg text')].filter((e) => { const r = e.getBoundingClientRect(); return r.left >= v.left && r.right <= v.right && r.top >= v.top && r.bottom <= v.bottom && !ctl.some((c) => r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom); }).map((e) => e.textContent.trim()); })).forEach((n) => seen.add(n));
  const drag = async (dx) => { await p.mouse.move(200, 420); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(200 + dx * i / 8, 420); await p.mouse.up(); await t.sleep(60); };
  for (let i = 0; i < 4; i++) await drag(300); await look();
  for (let i = 0; i < 18; i++) { await drag(-70); await look(); }
  const never = all.filter((n) => !seen.has(n));
  ok(never.length === 0, `every place label can be dragged clear of the controls (${all.length - never.length}/${all.length})${never.length ? ' -> ' + never.join(', ') : ''}`);
  const east = await ev(() => { const r = document.querySelector('#mapInner').getBoundingClientRect(), z = document.querySelector('#mapZoom').getBoundingClientRect(); return [Math.round(r.right), Math.round(z.left)]; });
  ok(east[0] <= east[1] + 2, `the east edge can be pulled to the left of the control column (${east[0]} <= ${east[1]})`);
  await t.SH('1_map_east_' + tag);
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.calm(); await t.lu();

  sec(dev + ': 3. every tray card is reachable');
  await ev((F) => { const S = window.__paw.S; F.forEach((n) => { S.inv.food[n] = 2; }); }, FOODS);
  await p.locator('#bar [data-act=feed]').tap(); await p.waitForSelector('#dock .tray [data-food]'); await t.sleep(350);
  const fr = await trayReach(t, 'Feed tray', FOODS.length + 1);
  ok(fr && fr.out.filter((c) => c.n !== 'Fresh Water').length === FOODS.length, `all ${FOODS.length} owned foods have a card (the 8 v2.4 and 6 festival foods included)`);
  const tb = await ev(() => { const t = document.querySelector('#dock > .tray').getBoundingClientRect(), d = document.querySelector('#dogHit'); const dr = d && d.getBoundingClientRect(); return { top: Math.round(t.top), dogBottom: dr ? Math.round(dr.bottom) : 0, ih: innerHeight }; });
  ok(tb.top >= tb.ih * 0.45, `the tray stays short, the scene above it big (tray top at ${tb.top} of ${tb.ih})`);
  await t.SH('3_feed_' + tag);
  const sl0 = await ev(() => document.querySelector('#dock > .tray .row').scrollLeft); await swipe(t, '#dock > .tray .row', -220);
  const sl1 = await ev(() => document.querySelector('#dock > .tray .row').scrollLeft);
  ok(sl1 > sl0 + 60, `a finger swipe that starts on a card scrolls the row (${Math.round(sl0)} -> ${Math.round(sl1)})`);
  await t.SH('3_feed_swiped_' + tag);
  const fed0 = await ev(() => window.__paw.S.inv.food['Frozen Pupsicle']);
  await ev(() => { const c = document.querySelector('#dock [data-food="Frozen Pupsicle"]'); c.scrollIntoView({ inline: 'nearest' }); });
  await p.locator('#dock [data-food="Frozen Pupsicle"]').tap();
  ok(await t.until((n) => window.__paw.S.inv.food['Frozen Pupsicle'] === n - 1, fed0, 5000), 'a tap on the last food (after scrolling to it) feeds it');
  await t.home();
  await p.locator('#bar [data-act=play]').tap(); await p.waitForSelector('#dock .tray [data-play]'); await t.sleep(300);
  await trayReach(t, 'Play tray', 3); await t.SH('3_play_' + tag); await t.home();
  await p.locator('#bar [data-act=care]').tap(); await p.waitForSelector('#dock .tray [data-care]'); await t.sleep(300);
  await trayReach(t, 'Care tray', 4); await t.SH('3_care_' + tag); await t.home();
  await t.home('park'); await t.until(() => window.__paw.S.place === 'park' && window.__paw.mode === 'yard', null, 5000);
  {
    await p.locator('#bar [data-act=feed]').tap(); await p.waitForSelector('#dock .tray [data-food]'); await t.sleep(300);
    await trayReach(t, 'Snacks tray (away from home)', 5); await t.SH('3_snacks_' + tag);
    const gh = await ev(() => { const b = document.querySelector('#feedHome'); if (!b) return null; b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); return r.bottom <= innerHeight && r.height >= 44; });
    ok(gh !== false, 'the snacks tray "Go home" button is reachable');
  }
  await t.home('yard');
  await ev(() => { window.__paw.S.stats.energy = 30; }); await p.locator('#bar [data-act=care]').tap(); await p.waitForSelector('[data-care=sleep]'); await p.locator('[data-care=sleep]').tap();
  ok(await t.until(() => !!document.querySelector('#wakeBtn'), null, 6000), 'the sleep tray opens');
  const wk = await ev(() => { const b = document.querySelector('#wakeBtn').getBoundingClientRect(), i = document.querySelector('#napInfo'); const ir = i && i.getBoundingClientRect(); return [b.height >= 44 && b.bottom <= innerHeight && b.right <= innerWidth, !ir || (ir.height >= 44 && ir.bottom <= innerHeight)]; });
  ok(wk[0] && wk[1], 'sleep tray: Wake up and the details button are on screen and 44 px');
  await p.locator('#wakeBtn').tap(); await t.until(() => !window.__paw.S.sleeping, null, 4000); await t.home();

  sec(dev + ': 5. the close X stays in the top-right corner');
  await ev(() => window.__paw.go('kitchen')); await t.untilMode('kitchen'); await p.waitForSelector('.pk-btn'); await t.sleep(700);
  await xFixed(t, '.pk-xstick', '.pk-root', 'Kitchen');
  await p.locator('.pk-btn', { hasText: 'Recipe book' }).first().tap(); await p.waitForSelector('.pk-book .pk-x');
  ok(await ev(() => getComputedStyle(document.querySelector('.pk-xstick')).visibility === 'hidden'), 'the kitchen X steps aside while the recipe book is open (one X at a time)');
  await xFixed(t, '.pk-book .pk-x', '.pk-book', 'Recipe book'); await ev(() => { document.querySelector('.pk-book').scrollTop = 600; }); await t.SH('5_book_' + tag);
  await p.locator('.pk-book .pk-x').tap(); ok(await t.until(() => !document.querySelector('.pk-book'), null, 3000), 'the X closes the recipe book');
  await p.locator('.pk-xstick').tap(); ok(await t.untilMode('yard'), 'the X closes the kitchen');
  await ev(() => { const S = window.__paw.S; ['carrot', 'peas', 'pumpkin', 'spinach', 'sweet-potato', 'blueberries'].forEach((k) => { S.inv.seeds[k] = 3; }); window.__paw.go('garden'); });
  await t.untilMode('garden'); await p.waitForSelector('.pg-plot'); await t.sleep(600);
  await p.locator('[data-t="seeds"]').tap(); await p.waitForSelector('.pg-pouch .pg-x');
  await xFixed(t, '.pg-pouch .pg-x', '.pg-pouch', 'Seed pouch'); await t.SH('5_pouch_' + tag);
  await p.locator('.pg-pouch .pg-x').tap(); ok(await t.until(() => !document.querySelector('.pg-pouch'), null, 3000), 'the X closes the seed pouch');
  await p.locator('.pg-done').tap(); await t.untilMode('yard'); await t.home();
  await p.locator('#bar [data-act=play]').tap(); await p.locator('[data-play=tricks]').tap(); await p.waitForSelector('#trX');
  await xFixed(t, '#trX', '#trainPanel', 'Training panel');
  await p.locator('#trX').tap(); await t.until(() => !document.querySelector('#trX'), null, 3000); await t.home();
  for (const [act, lab] of [['journal', 'Journal sheet'], ['wardrobe', 'Wardrobe sheet']]) {
    await p.locator(`#bar [data-act=${act}]`).tap(); await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel .x'), null, 5000); await t.sleep(300);
    await xFixed(t, '#modal .panel .x', '#modal .panel', lab); await p.locator('#modal .panel .x').tap(); await t.modalGone(); await t.home();
  }

  sec(dev + ': 8. fills stay inside the outlines (day)');
  await t.home(); await fillCheck(t, 'yard (day)');
  await p.locator('#bar [data-act=feed]').tap(); await p.waitForSelector('#dock .tray [data-food]'); await t.sleep(300); await fillCheck(t, 'Feed tray (day)'); await t.home();
  await p.locator('#bar [data-act=journal]').tap(); await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel .x'), null, 5000); await t.sleep(400); await fillCheck(t, 'Journal sheet, tabs (day)');
  await p.locator('#modal .panel .x').tap(); await t.modalGone(); await t.home();
  await ev(() => window.__paw.go('map')); await p.waitForSelector('#mapZoom'); await t.sleep(300); await fillCheck(t, 'map controls (day)'); await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
}

async function night(t, dev) { // the owner's case: a round ">" on a dark night scene, and every other control at night
  const { ok, sec } = t; const tag = dev.replace(/\s+/g, '').toLowerCase();
  sec(dev + ': 8. fills stay inside the outlines (night)');
  await t.newGame({ device: dev, time: 'night' }, { bond: { level: 10, pts: 9000 }, coins: 5000 }); const p = t.p;
  await p.addStyleTag({ content: '#bubble{display:none!important}' }); await t.sleep(400);
  ok(await t.ev(() => !!document.querySelector('#phPeek')), 'the round look-right button is there');
  await fillCheck(t, 'yard at night (round ">" included)'); await t.SH('8_night_' + tag);
  await p.locator('#bar [data-act=care]').tap(); await p.waitForSelector('#dock .tray [data-care]'); await t.sleep(300); await fillCheck(t, 'Care tray at night'); await t.home();
  await t.ev(() => { window.__paw.S.place = 'market'; window.__paw.go('yard'); }); await t.until(() => !!document.querySelector('#placeBtns [data-sh=kibble]'), null, 8000); await t.calm(); await t.lu();
  await fillCheck(t, 'Market Street buttons at night');
  await p.locator('#placeBtns [data-sh=kibble]').tap(); await t.until(() => !!document.querySelector('#modal .panel.shop'), null, 5000); await t.sleep(500);
  await fillCheck(t, 'Kibble Corner sheet at night (cards, tabs, Buy buttons)'); await t.SH('8_shop_night_' + tag);
  await p.locator('#modal .panel .x').tap(); await t.modalGone();
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
}

(async () => {
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const tag = dev.replace(/\s+/g, '').toLowerCase();
    await run('phone_v25_fixes_a_' + tag, (t) => suite(t, dev), { device: dev, timeout: 360000 });
    await run('phone_v25_fixes_a_night_' + tag, (t) => night(t, dev), { device: dev, time: 'night' });
  }
})();
