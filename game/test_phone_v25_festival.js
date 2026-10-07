// v2.5 phone, FESTIVAL lane: the leaf piles (48 px tap rects, clear of #dogHit and the bowl, a tap jumps), the Harvest Stall in the Square
// (inside the camera crop, clear of #dogHit, the HUD, the bar and the place chips, a 44 px place button, the sheet passes the minimums)
// and the costume parade sheet (15 px text, 44 px Join, the dog row scrolls inside the sheet, no sideways page scroll).
// iPhone 13 (390x844) and Pixel 7 (412x915). node game/run_tests.js phone_v25_festival
const { run } = require('./test_lib');

const TAP_SEL = 'button, [role=button], a[href], input:not([type=hidden]), select, .card';
const SKIP = '.lptip, #devPanel, #devBtn, #modHost, #bar, #hud, #toasts';
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
      if (r.width <= 1 && r.height <= 1) continue; // visually hidden (screen reader) text
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
// wait until an element's box stops moving (camera pans and the sheet pop-in), polled every 50 ms
async function settled(t, sel) { await t.ev(() => { window.__stb = ''; }); return t.until((sel) => { const e = document.querySelector(sel); if (!e) return false; const b = e.getBoundingClientRect(), k = [b.left, b.top, b.width, b.height].map(Math.round).join(); const same = k === window.__stb; window.__stb = k; return same; }, sel, 5000); }
async function tapSel(t, sel, cond) { await t.p.locator(sel).first().tap(); if (cond) await t.until(cond, null, 5000); }
async function closeSheet(t) { if (await t.p.locator('#modal:not([hidden]) .panel .x').count()) await tapSel(t, '#modal:not([hidden]) .panel .x'); await t.modalGone(); }
const R4 = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
const ov = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

async function suite(t, dev) {
  const { ok, ev } = t;
  t.sec(dev + ': new game');
  await t.newGame({ device: dev }, { bond: { level: 6, pts: 700 }, coins: 3000 });
  const p = t.p;
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');

  t.sec(dev + ': the leaf piles in the yard');
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.place = 'yard'; window.__paw.go('yard'); });
  await t.until(() => document.querySelectorAll('#fsPilesG [data-pile] > rect').length === 2, null, 8000); await t.calm(); await t.lu(); await t.freezeMotion(true);
  await settled(t, '#fsPilesG [data-pile="0"] > rect');
  const y = await ev(`(() => { const R4 = ${R4}; return { p0: R4('#fsPilesG [data-pile="0"] > rect'), p1: R4('#fsPilesG [data-pile="1"] > rect'), dog: R4('#dogHit'), bowl: R4('#bowlG'), bar: R4('#bar'), btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }), view: R4('#view'), iw: innerWidth }; })()`);
  for (const k of ['p0', 'p1']) {
    const r = y[k]; ok(r && r[2] - r[0] >= 47.5 && r[3] - r[1] >= 47.5, `pile ${k[1]}: tap rect >= 48 px (${r && Math.round(r[2] - r[0])}x${r && Math.round(r[3] - r[1])})`);
    ok(!ov(r, y.dog) && !ov(r, y.bowl), `pile ${k[1]}: clear of #dogHit and the bowl`);
    ok(!ov(r, y.bar) && !y.btns.some((b) => ov(r, b)), `pile ${k[1]}: never under the action bar or the place buttons`);
  }
  ok(y.p0[0] >= 0 && y.p0[2] <= y.iw && y.p0[3] <= y.view[3], 'pile 0 is inside the camera crop');
  await t.SH('yard_piles');
  const c0 = [(y.p0[0] + y.p0[2]) / 2, (y.p0[1] + y.p0[3]) / 2];
  ok(await ev(([x, yy]) => { const e = document.elementFromPoint(x, yy); return !!e && !!e.closest('#fsPilesG'); }, c0), 'nothing sits on top of pile 0');
  const h0 = (await t.S()).stats.happy;
  await p.touchscreen.tap(c0[0], c0[1]);
  ok(await t.until(() => window.__paw.fest.scattered.includes(0), null, 4000), 'a tap: the dog jumps in, the pile scatters');
  await t.until(() => !window.__paw.shop.busy, null, 6000);
  ok((await t.S()).stats.happy > h0, 'happy went up');

  t.sec(dev + ': the Harvest Stall and the parade banner in the Square');
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.place = 'square'; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#fsStallG .fs-hit') && !!document.querySelector('[data-fs=fest]'), null, 8000); await t.calm(); await t.lu(); await t.freezeMotion(true);
  await settled(t, '#fsStallG .fs-hit'); await settled(t, '#placeBtns');
  const q = await ev(`(() => { const R4 = ${R4}; return { stall: R4('#fsStallG .fs-hit'), art: R4('#fsStallG > svg'), banner: R4('#fsBannerG > svg'), dog: R4('#dogHit'), hud: R4('#hud'), bar: R4('#bar'), chip: R4('#status'), view: R4('#view'), sb: R4('[data-fs=fest]'), rows: new Set([...document.querySelectorAll('#placeBtns .btn')].map((b) => Math.round(b.getBoundingClientRect().top))).size, btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }), iw: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
  ok(q.art[0] >= q.view[0] - 1 && q.art[2] <= q.view[2] + 1 && q.art[1] >= q.view[1] && q.art[3] <= q.view[3], 'the stall is inside the camera crop ' + JSON.stringify(q.art.map(Math.round)));
  ok(!ov(q.art, q.dog), 'the stall does not cover #dogHit');
  ok(!ov(q.art, q.hud) && !ov(q.art, q.bar) && !ov(q.art, q.chip) && !q.btns.some((b) => ov(q.art, b)), 'the stall is clear of the HUD, the bar, the location chip and the place buttons');
  ok(q.banner && q.banner[0] >= q.view[0] - 1 && q.banner[2] <= q.view[2] + 1 && !ov(q.banner, q.dog) && !ov(q.banner, q.chip) && !ov(q.banner, q.stall), 'the banner is inside the crop, clear of #dogHit, the chip and the stall');
  ok(q.sb[2] - q.sb[0] >= 43.5 && q.sb[3] - q.sb[1] >= 43.5, `the Festival button is 44 px (${Math.round(q.sb[2] - q.sb[0])}x${Math.round(q.sb[3] - q.sb[1])})`);
  ok(q.rows === 1, `the Square place buttons stay one row (${q.rows})`);
  ok(q.sw === q.iw, 'no sideways page scroll');
  await t.SH('square_stall');
  const sc = [(q.stall[0] + q.stall[2]) / 2, (q.stall[1] + q.stall[3]) / 2];
  ok(await ev(([x, yy]) => { const e = document.elementFromPoint(x, yy); return !!e && !!e.closest('#fsStallG'); }, sc), 'nothing sits on top of the stall');
  await p.touchscreen.tap(sc[0], sc[1]);
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.fs-stall'), null, 5000), 'a tap on the stall opens the sheet');
  await closeSheet(t);

  t.sec(dev + ': the stall sheet');
  await tapSel(t, '[data-fs=fest]', () => !!document.querySelector('#modal:not([hidden]) .fs-choose')); await settled(t, '#modal .panel');
  await sheetFits(t, 'Festival chooser'); await audit(t, 'festival chooser');
  await tapSel(t, '[data-fsgo=stall]', () => !!document.querySelector('#modal:not([hidden]) .panel.fs-stall')); await settled(t, '#modal .panel');
  await sheetFits(t, 'Harvest Stall'); await audit(t, 'stall sheet');
  const sh = await ev(async () => {
    const panel = document.querySelector('#modal .panel'), sc = [panel, panel.querySelector('.panel-body')].find((e) => e && e.scrollHeight > e.clientHeight + 4) || panel, out = [];
    for (let yy = 0; yy <= sc.scrollHeight; yy += Math.max(200, sc.clientHeight - 80)) { sc.scrollTop = yy; await new Promise((r) => requestAnimationFrame(r)); document.querySelectorAll('#modal [data-fsbuy]').forEach((b) => { const r = b.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= innerHeight) out.push([b.dataset.fsbuy, Math.round(r.width), Math.round(r.height), r.right <= innerWidth + 0.5 && r.left >= -0.5]); }); }
    sc.scrollTop = 0; return { out, pw: panel.scrollWidth, pcw: panel.clientWidth, n: document.querySelectorAll('#modal .fs-stall .sitem').length };
  });
  ok(sh.n === 10, `10 cards (${sh.n})`);
  ok(new Set(sh.out.map((b) => b[0])).size === 10 && sh.out.every((b) => b[1] >= 44 && b[2] >= 44 && b[3]), 'every Buy button is reachable, on screen and >= 44 px');
  ok(sh.pw <= sh.pcw + 1, 'the sheet does not scroll sideways');
  const scr = () => ev(() => { const pn = document.querySelector('#modal .panel'), sc = [pn, pn.querySelector('.panel-body')].find((e) => e && e.scrollHeight > e.clientHeight + 4) || pn; return sc.scrollTop; });
  await ev(() => { const b = document.querySelector('[data-fsbuy="Candy Corn Carrots"]'); b.scrollIntoView({ block: 'center' }); }); const st0 = await scr();
  await tapSel(t, '[data-fsbuy="Candy Corn Carrots"]', () => !!document.querySelector('.buyveil .bb-yes')); await audit(t, 'stall buy window');
  await tapSel(t, '.buyveil .bb-yes', () => (window.__paw.S.inv.food['Candy Corn Carrots'] || 0) === 1);
  ok((await t.S()).inv.food['Candy Corn Carrots'] === 1, 'bought Candy Corn Carrots by touch');
  const st1 = await scr(); ok(st0 > 100 && Math.abs(st1 - st0) < 4, `the sheet keeps its scroll after a buy (${Math.round(st0)} -> ${Math.round(st1)})`);
  await closeSheet(t);

  t.sec(dev + ': the parade sheet');
  await tapSel(t, '[data-fs=fest]', () => !!document.querySelector('#modal:not([hidden]) .fs-choose')); await tapSel(t, '[data-fsgo=parade]', () => !!document.querySelector('#modal:not([hidden]) .panel.fs-paradepop')); await settled(t, '#modal .panel');
  await sheetFits(t, 'Costume parade'); await audit(t, 'parade sheet');
  const pr = await ev(() => { const row = document.querySelector('.fs-row'), j = document.getElementById('fsJoin').getBoundingClientRect(), panel = document.querySelector('#modal .panel'); return { rsw: row.scrollWidth, rcw: row.clientWidth, ox: getComputedStyle(row).overflowX, n: row.children.length, j: [j.width, j.height, j.bottom <= innerHeight], pw: panel.scrollWidth, pcw: panel.clientWidth, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  ok(pr.n === 5 && pr.rsw > pr.rcw && /auto|scroll/.test(pr.ox), `the five dogs scroll sideways inside the row (${pr.rsw} > ${pr.rcw})`);
  ok(pr.pw <= pr.pcw + 1 && pr.sw === pr.iw, 'the sheet and the page do not scroll sideways');
  ok(pr.j[0] >= 44 && pr.j[1] >= 44 && pr.j[2], `Join the parade is 44 px and on screen (${Math.round(pr.j[0])}x${Math.round(pr.j[1])})`);
  await tapSel(t, '#fsJoin', () => !window.__paw.fest.walking && /^Best in show/.test(window.__toasts.join('|').split('|').reverse().find((x) => /^Best in show/.test(x)) || ''));
  ok(await t.waitToast(/^Best in show: .+\. \+10 coins\.$/, 4000), 'Join (motion off): best in show at once');
  if (await t.until(() => !!document.querySelector('#modal .fs-rosette'), null, 4000)) { await sheetFits(t, 'Rosette'); await audit(t, 'rosette popup'); await tapSel(t, '#fsLater'); await t.modalGone(); }
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
}

(async () => {
  for (const dev of ['iPhone 13', 'Pixel 7']) await run('phone_v25_festival_' + dev.replace(/\s+/g, '').toLowerCase(), (t) => suite(t, dev), { device: dev, fest: 'both', season: 'autumn', prefs: { msTest: true } });
})();
