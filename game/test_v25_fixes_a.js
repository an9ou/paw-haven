// v2.5 FIXES A on desktop (1280x720): the owner's v2.4 feedback items 1, 3, 5 and 8 must hold on the laptop too, measured on the real page.
//   1 map: the map fills the view, the zoom column floats over it, and the dev button no longer peeks out behind it;
//   3 trays: every owned food (all of them, the festival foods too) and every Play / Care card can be scrolled fully into view inside the tray;
//   5 close X: the recipe book (now scrolls and keeps its X in the corner), the seed pouch and the sheets keep their X in the top-right corner;
//   8 fills: every button, card, chip, tab, round button, badge, tray and popup keeps its crayon fill inside its pencil outline, day and night.
// node game/run_tests.js game/test_v25_fixes_a.js   (--shots writes game/shots_v25_fixes_a/)
const { run } = require('./test_lib'); const { fillAudit } = require('./v25_fixes_a_fill'); const fs = require('fs'); const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, 'src/00_core.js'), 'utf8');
const FOODS = ['FOOD', 'TFOOD'].flatMap((k) => [...new RegExp(`const ${k} = \\[[\\s\\S]*?\\n\\];`).exec(SRC)[0].matchAll(/n: '([^']+)'/g)].map((m) => m[1])).filter((n) => n !== 'Fresh Water');
const FILL = '.btn, .act, .opt, .chip, .arrow, .iconbtn, .xbtn, .portrait, .card, .card .cnt, .sitem, .tray, .panel, #status, .heads button, .track, [role=tab], #devBtn';

async function xCorner(t, xSel, boxSel, label) { // the X stays in the top-right corner of its box while everything around it scrolls, and is >= 44 px
  const r = await t.ev(async ({ xSel, boxSel }) => {
    const x = document.querySelector(xSel), box = document.querySelector(boxSel); if (!x || !box) return null;
    const a = x.getBoundingClientRect(), a0 = box.getBoundingClientRect(), sc = [];
    for (let e = x.parentElement; e; e = e.parentElement) if (e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY)) sc.push(e);
    sc.forEach((e) => { e.scrollTop = e.scrollHeight; }); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const b = x.getBoundingClientRect(), bb = box.getBoundingClientRect(), hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    const o = { moved: Math.round(Math.hypot(b.left - bb.right - (a.left - a0.right), b.top - bb.top - (a.top - a0.top))), w: Math.round(b.width), h: Math.round(b.height), right: Math.round(bb.right - b.right), top: Math.round(b.top - bb.top), onTop: !!hit && (hit === x || x.contains(hit)), sc: sc.length };
    sc.forEach((e) => { e.scrollTop = 0; }); return o;
  }, { xSel, boxSel });
  t.ok(!!r && r.moved <= 1 && r.onTop, `${label}: the close X stays in its corner while the content scrolls (${r ? r.sc + ' scroller(s), moved ' + r.moved + ' px' : 'none'})`);
  t.ok(!!r && r.w >= 44 && r.h >= 44 && r.right <= 30 && r.top <= 30, `${label}: the X is ${r ? r.w + 'x' + r.h : '?'} px in the top-right corner (${r ? r.right + ' px from the right, ' + r.top + ' px from the top' : ''})`);
}
async function trayReach(t, label, want) { // every card scrolls fully into view inside the tray body and on the page
  const r = await t.ev(async () => {
    const cards = [...document.querySelectorAll('#dock > .tray .row > .card')], body = document.querySelector('#dock > .tray .tray-body'), out = [];
    for (const c of cards) {
      c.scrollIntoView({ block: 'nearest', inline: 'nearest' }); await new Promise((r) => requestAnimationFrame(r));
      const b = c.getBoundingClientRect(), v = body.getBoundingClientRect();
      out.push({ n: c.dataset.food || c.dataset.play || c.dataset.care || c.textContent.trim().slice(0, 12), w: Math.round(b.width), h: Math.round(b.height), in: b.top >= v.top - 1 && b.bottom <= v.bottom + 1 && b.left >= v.left - 1 && b.right <= v.right + 1 && b.bottom <= innerHeight });
    }
    body.scrollTop = 0; return out;
  });
  const bad = r.filter((c) => !c.in || c.w < 44 || c.h < 44);
  t.ok(r.length >= want, `${label}: ${r.length} cards (want ${want})`);
  t.ok(bad.length === 0, `${label}: every card scrolls fully into view${bad.length ? ' -> ' + bad.slice(0, 4).map((c) => `${c.n} ${c.w}x${c.h}`).join(' | ') : ''}`);
}
async function fillCheck(t, label) { await fillAudit(t, FILL, label, { skip: '#toasts, #bubble' }); }

run('v25_fixes_a', async (t) => {
  const { ok, ev, sec } = t;
  sec('new game');
  await t.newGame({}, { bond: { level: 10, pts: 9000 }, coins: 5000 }); const p = t.p;
  await p.addStyleTag({ content: '#bubble{display:none!important}' });

  sec('1. map: full view, floating controls, nothing behind the zoom column');
  await ev(() => window.__paw.go('map')); await p.waitForSelector('#mapZoom'); await t.sleep(300);
  const m = await ev(() => {
    const q = (s) => document.querySelector(s).getBoundingClientRect(), v = q('#view'), pan = q('#mapPan'), inner = q('#mapInner'), z = q('#mapZoom'), dv = q('#devBtn');
    return { pan: [pan.left, pan.right, pan.top, pan.bottom].map(Math.round), view: [v.left, v.right, v.top, v.bottom].map(Math.round), drawn: inner.left <= v.left + 64 && inner.right >= v.right,
      btns: ['#mapX', '#mapZin', '#mapZout'].map((s) => Math.min(q(s).width, q(s).height)), devClear: dv.right <= z.left || dv.left >= z.right || dv.bottom <= z.top || dv.top >= z.bottom };
  });
  ok(m.pan.join() === m.view.join(), `the map pans in the whole view, no gutter (${m.pan.join(',')} = ${m.view.join(',')})`);
  ok(m.drawn, 'the map is drawn across the view');
  ok(m.btns.every((b) => b >= 44), 'X, + and - are 44 px or more (' + m.btns.map(Math.round).join(', ') + ')');
  ok(m.devClear, 'the dev button no longer hides behind the zoom column');
  await t.SH('1_map'); await fillCheck(t, 'map controls (day)');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.calm(); await t.lu();

  sec('3. every tray card is reachable');
  await ev((F) => { const S = window.__paw.S; F.forEach((n) => { S.inv.food[n] = 2; }); }, FOODS);
  await p.click('#bar [data-act=feed]'); await p.waitForSelector('#dock .tray [data-food]'); await t.sleep(300);
  await trayReach(t, 'Feed tray', FOODS.length + 1); await t.SH('3_feed');
  const n = await ev(() => document.querySelectorAll('#dock [data-food]').length); ok(n === FOODS.length + 1, `every owned food has a card (${n - 1} foods and Fresh Water)`);
  await fillCheck(t, 'Feed tray (day)'); await t.home();
  await p.click('#bar [data-act=play]'); await p.waitForSelector('#dock .tray [data-play]'); await trayReach(t, 'Play tray', 3); await t.home();
  await p.click('#bar [data-act=care]'); await p.waitForSelector('#dock .tray [data-care]'); await trayReach(t, 'Care tray', 4); await t.home();

  sec('5. the close X stays in the top-right corner');
  await ev(() => window.__paw.go('kitchen')); await t.untilMode('kitchen'); await p.waitForSelector('.pk-btn'); await t.sleep(500);
  ok(await ev(() => !document.querySelector('.pk-xstick') && !!document.querySelector('.pk-top .pk-x')), 'desktop kitchen: the X stays in the header (the page does not scroll)');
  await p.locator('.pk-btn', { hasText: 'Recipe book' }).first().click(); await p.waitForSelector('.pk-book .pk-x');
  const bk = await ev(() => { const b = document.querySelector('.pk-book'), ic = b.querySelector('.pk-mh .pk-ico').getBoundingClientRect(), last = [...b.querySelectorAll('.pk-card')].pop().getBoundingClientRect(); b.scrollTop = b.scrollHeight; const r = b.getBoundingClientRect(), l2 = [...b.querySelectorAll('.pk-card')].pop().getBoundingClientRect(); b.scrollTop = 0; return { ico: Math.round(ic.height), lastIn: l2.bottom <= r.bottom + 1, sh: b.scrollHeight, ch: b.clientHeight, first: Math.round(last.bottom) }; });
  ok(bk.lastIn, 'every recipe card can be reached in the book (the last card scrolls into view)');
  ok(bk.ico <= 64, `the book's icon sits in its title row (${bk.ico} px tall)`);
  await xCorner(t, '.pk-book .pk-x', '.pk-book', 'Recipe book'); await t.SH('5_book');
  await p.click('.pk-book .pk-x'); ok(await t.until(() => !document.querySelector('.pk-book'), null, 3000), 'the X closes the recipe book');
  await p.click('.pk-top .pk-x'); await t.untilMode('yard'); await t.home();
  await ev(() => { const S = window.__paw.S; ['carrot', 'peas', 'pumpkin', 'spinach', 'sweet-potato', 'blueberries'].forEach((k) => { S.inv.seeds[k] = 3; }); window.__paw.go('garden'); });
  await t.untilMode('garden'); await p.waitForSelector('.pg-plot'); await t.sleep(500);
  await p.click('[data-t="seeds"]'); await p.waitForSelector('.pg-pouch .pg-x');
  await xCorner(t, '.pg-pouch .pg-x', '.pg-pouch', 'Seed pouch');
  await p.click('.pg-pouch .pg-x'); ok(await t.until(() => !document.querySelector('.pg-pouch'), null, 3000), 'the X closes the seed pouch');
  await p.click('.pg-done'); await t.untilMode('yard'); await t.home();
  for (const [act, lab] of [['journal', 'Journal'], ['wardrobe', 'Wardrobe']]) {
    await p.click(`#bar [data-act=${act}]`); await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel .x'), null, 5000); await t.sleep(300);
    await xCorner(t, '#modal .panel .x', '#modal .panel', lab);
    if (act === 'journal') await fillCheck(t, 'Journal popup and tabs (day)');
    await p.click('#modal .panel .x'); await t.modalGone(); await t.home();
  }

  sec('8. fills stay inside the outlines (day)');
  await fillCheck(t, 'yard (day)');
  await ev(() => { window.__paw.S.place = 'market'; window.__paw.go('yard'); }); await t.until(() => !!document.querySelector('#placeBtns [data-sh=kibble]'), null, 8000); await t.calm(); await t.lu();
  await p.click('#placeBtns [data-sh=kibble]'); await t.until(() => !!document.querySelector('#modal .panel.shop'), null, 5000); await t.sleep(400);
  await fillCheck(t, 'Kibble Corner popup (cards, tabs, Buy buttons)'); await p.click('#modal .panel .x'); await t.modalGone(); await t.home('yard');
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));

  sec('8. fills stay inside the outlines (night)');
  await t.newGame({ time: 'night' }, { bond: { level: 10, pts: 9000 }, coins: 5000 });
  await t.p.addStyleTag({ content: '#bubble{display:none!important}' }); await t.sleep(300);
  await fillCheck(t, 'yard at night'); await t.SH('8_night');
  await t.p.click('#bar [data-act=care]'); await t.p.waitForSelector('#dock .tray [data-care]'); await t.sleep(300); await fillCheck(t, 'Care tray at night'); await t.SH('8_night_tray'); await t.home();
  await t.p.click('#bar [data-act=journal]'); await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel .x'), null, 5000); await t.sleep(300);
  await fillCheck(t, 'Journal popup at night'); await t.p.click('#modal .panel .x'); await t.modalGone();
  const errs2 = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs2.length === 0, 'no console errors at night ' + errs2.slice(0, 3).join(' | '));
}, { timeout: 300000 });
