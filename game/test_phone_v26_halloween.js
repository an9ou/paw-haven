// v2.6 phone, HALLOWEEN lane (V26.md section 7): the Pumpkin Patch Pop-up in the Square (inside the camera crop, clear of #dogHit, the stall,
// the HUD, the bar and the place chips, a tap opens the sheet), the third row of the Festival chooser, the pop-up sheet and its buy window
// (15 px text, 44 px buttons, no sideways scroll, the four sections scroll inside the sheet), and the four 2026 yard decorations
// (48 px tap rects, clear of #dogHit). iPhone 13 (390x844) and Pixel 7 (412x915). node game/run_tests.js phone_v26_halloween
const { run } = require('./test_lib');

const TAP_SEL = 'button, [role=button], a[href], input:not([type=hidden]), select, .card';
const SKIP = '.lptip, #devPanel, #devBtn, #modHost, #bar, #hud, #toasts';
const DECOR = ['Jack-o-Lantern Trio', 'Paper Bat Bunting', 'Friendly Scarecrow', 'Ghost Garland'];
async function audit(t, label) {
  await t.SH(label.replace(/[^a-z0-9]+/gi, '_'));
  const { ok, p } = t;
  const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  ok(sw === iw, `${label}: no horizontal scroll (${sw} = ${iw})`);
  const bad = await p.evaluate(({ sel, skip }) => {
    const out = [], vw = innerWidth, vh = innerHeight;
    document.querySelectorAll(sel).forEach((el) => {
      if (el.closest(skip)) return;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
      if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) return;
      if (el.closest('[hidden]')) return;
      if (el.tagName === 'g' || (el.closest('svg') && el.tagName !== 'BUTTON')) return;
      if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18)}"`);
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
      if (r.width <= 1 && r.height <= 1) continue;
      const cap = el.matches('.cap, .caption, .tstar') ? 13 : 15, fs = parseFloat(cs.fontSize);
      if (fs < cap - 0.01) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${fs}px "${n.textContent.trim().slice(0, 18)}"`);
    }
    return out;
  }, { skip: SKIP });
  ok(small.length === 0, `${label}: text >= 15 px (13 px captions)${small.length ? ' -> ' + small.slice(0, 6).join(' | ') : ''}`);
}
async function sheetFits(t, label) {
  const r = await t.p.evaluate(() => { const e = document.querySelector('#modal:not([hidden]) .panel'); if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), iw: innerWidth, h: Math.round(b.height), ih: innerHeight }; });
  t.ok(!!r && Math.abs(r.w - r.iw) < 3 && r.h <= r.ih * 0.9, `${label}: bottom sheet fits (${r ? r.w + 'x' + r.h : 'none'})`);
}
async function settled(t, sel) { await t.ev(() => { window.__stb = ''; }); return t.until((sel) => { const e = document.querySelector(sel); if (!e) return false; const b = e.getBoundingClientRect(), k = [b.left, b.top, b.width, b.height].map(Math.round).join(); const same = k === window.__stb; window.__stb = k; return same; }, sel, 5000); }
async function tapSel(t, sel, cond) { await t.p.locator(sel).first().tap(); if (cond) await t.until(cond, null, 5000); }
async function closeSheet(t) { if (await t.p.locator('#modal:not([hidden]) .panel .x').count()) await tapSel(t, '#modal:not([hidden]) .panel .x'); await t.modalGone(); }
const R4 = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
const ov = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

async function suite(t, dev) {
  const { ok, ev } = t;
  t.sec(dev + ': new game');
  await t.newGame({ device: dev }, { bond: { level: 1, pts: 0 }, coins: 3000 });
  const p = t.p;
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');

  t.sec(dev + ': the pop-up in the Square');
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.place = 'square'; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#hwPopG .fs-hit') && !!document.querySelector('[data-fs=fest]'), null, 8000); await t.calm(); await t.lu(); await t.freezeMotion(true);
  await settled(t, '#hwPopG .fs-hit'); await settled(t, '#placeBtns');
  const q = await ev(`(() => { const R4 = ${R4}; return { hit: R4('#hwPopG .fs-hit'), art: R4('#hwPopG > svg'), stall: R4('#fsStallG > svg'), banner: R4('#fsBannerG > svg'), dog: R4('#dogHit'), hud: R4('#hud'), bar: R4('#bar'), chip: R4('#status'), view: R4('#view'), hwBtn: !!document.querySelector('#placeBtns [data-hw]'), rows: new Set([...document.querySelectorAll('#placeBtns .btn')].map((b) => Math.round(b.getBoundingClientRect().top))).size, btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }), iw: innerWidth, sw: document.documentElement.scrollWidth, box: window.__paw.hw.popupBox() }; })()`);
  ok(q.art[0] >= q.view[0] - 1 && q.art[2] <= q.view[2] + 1 && q.art[1] >= q.view[1] && q.art[3] <= q.view[3], 'the pop-up is inside the camera crop ' + JSON.stringify(q.art.map(Math.round)) + ' at ' + JSON.stringify(q.box));
  ok(!ov(q.art, q.dog), 'the pop-up does not cover #dogHit');
  ok(!ov(q.art, q.stall) && !ov(q.art, q.banner), 'the pop-up is clear of the Harvest Stall and the banner');
  ok(!ov(q.art, q.hud) && !ov(q.art, q.bar) && !ov(q.art, q.chip) && !q.btns.some((b) => ov(q.art, b)), 'the pop-up is clear of the HUD, the bar, the location chip and the place buttons');
  ok(q.hit[2] - q.hit[0] >= 47.5 && q.hit[3] - q.hit[1] >= 47.5, `its tap rect is >= 48 px (${Math.round(q.hit[2] - q.hit[0])}x${Math.round(q.hit[3] - q.hit[1])})`);
  ok(!q.hwBtn && q.rows === 1, `no extra place button on phones, the Square row stays one line (${q.rows})`);
  ok(q.sw === q.iw, 'no sideways page scroll');
  await t.SH('square_popup');
  const c = [(q.hit[0] + q.hit[2]) / 2, (q.hit[1] + q.hit[3]) / 2];
  ok(await ev(([x, y]) => { const e = document.elementFromPoint(x, y); return !!e && !!e.closest('#hwPopG'); }, c), 'nothing sits on top of the pop-up');
  await p.touchscreen.tap(c[0], c[1]);
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.hw-pop'), null, 5000), 'a tap on the pop-up opens the sheet');
  await closeSheet(t);

  t.sec(dev + ': the Festival chooser has a third row');
  await tapSel(t, '[data-fs=fest]', () => !!document.querySelector('#modal:not([hidden]) .fs-choose')); await settled(t, '#modal .panel');
  const ch = await ev(() => { const cs = [...document.querySelectorAll('.fs-choose [data-fsgo]')], r = cs.map((e) => e.getBoundingClientRect()); return { keys: cs.map((e) => e.dataset.fsgo), rows: r.length === 3 && Math.abs(r[0].top - r[1].top) < 12 && r[2].top > Math.max(r[0].bottom, r[1].bottom) - 4 ? 2 : 0, last: r[2] && [r[2].width, r[2].height], w: document.querySelector('.fs-choose').getBoundingClientRect().width }; });
  ok(ch.keys.join() === 'stall,parade,popup' && ch.rows === 2 && ch.last && ch.last[0] >= ch.w - 2, 'stall and parade on the first row, the pop-up on a full-width second row (' + JSON.stringify(ch) + ')');
  await sheetFits(t, 'Festival chooser'); await audit(t, 'festival chooser');
  await tapSel(t, '[data-fsgo=popup]', () => !!document.querySelector('#modal:not([hidden]) .panel.hw-pop')); await settled(t, '#modal .panel');

  t.sec(dev + ': the pop-up sheet');
  await sheetFits(t, 'Pumpkin Patch Pop-up'); await audit(t, 'popup sheet');
  const sh = await ev(async () => {
    const panel = document.querySelector('#modal .panel'), sc = [panel, panel.querySelector('.panel-body')].find((e) => e && e.scrollHeight > e.clientHeight + 4) || panel, out = [], tags = [];
    for (let yy = 0; yy <= sc.scrollHeight; yy += Math.max(200, sc.clientHeight - 80)) { sc.scrollTop = yy; await new Promise((r) => requestAnimationFrame(r)); document.querySelectorAll('#modal [data-hwbuy]').forEach((b) => { const r = b.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= innerHeight) out.push([b.dataset.hwbuy, Math.round(r.width), Math.round(r.height), r.right <= innerWidth + 0.5 && r.left >= -0.5]); }); document.querySelectorAll('#modal .hw-tag').forEach((g) => { const r = g.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= innerHeight) tags.push(parseFloat(getComputedStyle(g).fontSize)); }); }
    sc.scrollTop = 0; return { out, tags, pw: panel.scrollWidth, pcw: panel.clientWidth, n: document.querySelectorAll('#modal .hw-pop .sitem').length, secs: document.querySelectorAll('#modal .hw-sec').length, scrolls: sc.scrollHeight > sc.clientHeight };
  });
  ok(sh.n === 16 && sh.secs === 4, `16 cards in four sections (${sh.n}, ${sh.secs})`);
  ok(new Set(sh.out.map((b) => b[0])).size === 16 && sh.out.every((b) => b[1] >= 44 && b[2] >= 44 && b[3]), 'every Buy button is reachable, on screen and >= 44 px');
  ok(sh.tags.length >= 16 && sh.tags.every((f) => f >= 15), 'the 2026 tags are 15 px');
  ok(sh.scrolls && sh.pw <= sh.pcw + 1, 'the sections scroll inside the sheet, never sideways');
  await ev(() => document.querySelector('[data-hwbuy="Apple Monster Biscuits"]').scrollIntoView({ block: 'center' }));
  await tapSel(t, '[data-hwbuy="Apple Monster Biscuits"]', () => !!document.querySelector('.buyveil .bb-yes')); await audit(t, 'popup buy window');
  await tapSel(t, '.buyveil .bb-yes', () => (window.__paw.S.inv.food['Apple Monster Biscuits'] || 0) === 1);
  ok((await t.S()).inv.food['Apple Monster Biscuits'] === 1, 'bought Apple Monster Biscuits by touch');
  await ev(() => document.querySelector('[data-hwbuy="Ghost Garland"]').scrollIntoView({ block: 'center' }));
  await tapSel(t, '[data-hwbuy="Ghost Garland"]', () => !!document.querySelector('.buyveil .bb-yes'));
  await tapSel(t, '.buyveil .bb-yes', () => !!(window.__paw.S.decor || {})['Ghost Garland']);
  ok(!!(await t.S()).decor['Ghost Garland'], 'bought the Ghost Garland by touch');
  await closeSheet(t);

  t.sec(dev + ': the four decorations in the yard');
  await ev((ns) => { const S = window.__paw.S; ns.forEach((n) => { S.decor[n] = S.decor[n] || { got: '2026-10-20', out: true }; }); S.sleeping = false; S.place = 'yard'; window.__paw.go('yard'); }, DECOR);
  await t.until((ns) => ns.every((n) => !!document.querySelector(`#decorG [data-decor="${n}"] > rect`)), DECOR, 8000); await t.calm(); await t.lu();
  await settled(t, '#decorG');
  const y = await ev(`(() => { const R4 = ${R4}; return { d: ${JSON.stringify(DECOR)}.map((n) => R4('#decorG [data-decor="' + n + '"] > rect')), dog: R4('#dogHit'), view: R4('#view'), bar: R4('#bar'), btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }), iw: innerWidth }; })()`);
  DECOR.forEach((n, i) => {
    const r = y.d[i]; ok(r && r[2] - r[0] >= 47.5 && r[3] - r[1] >= 47.5, `${n}: tap rect >= 48 px (${r && Math.round(r[2] - r[0])}x${r && Math.round(r[3] - r[1])})`);
    ok(!ov(r, y.dog), `${n}: clear of #dogHit`);
    ok(!ov(r, y.bar) && !y.btns.some((b) => ov(r, b)), `${n}: never under the action bar or the place buttons`);
  });
  const vis = y.d.filter((r) => r[0] >= y.view[0] - 1 && r[2] <= y.view[2] + 1);
  ok(vis.length >= 1, `${vis.length} of 4 decorations in the home crop (the rest pan into view)`); // the Jack-o-Lantern Trio sits in front of the dog, inside every phone crop
  await t.SH('yard_decor');
  const tr = y.d[0], tc = [(tr[0] + Math.min(tr[2], y.iw)) / 2, (tr[1] + tr[3]) / 2];
  await p.touchscreen.tap(tc[0], tc[1]);
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .hm-decor-pop'), null, 4000), 'a tap on the Jack-o-Lantern Trio opens its card');
  await closeSheet(t);
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
}

(async () => {
  for (const dev of ['iPhone 13', 'Pixel 7']) await run('phone_v26_halloween_' + dev.replace(/\s+/g, '').toLowerCase(), (t) => suite(t, dev), { device: dev, fest: 'auto', season: 'autumn', date: '2026-10-20', prefs: { hwTest: true } });
})();
