// v2.4 phone, SHOP & MISSIONS lane: the Boutique and Kibble Corner sheets with 20+ cards (scroll inside, no sideways scroll, 44 px Buy buttons),
// the Missions sheet (15 px text, the card fills the sheet width), the yard clipboard (clear of #dogHit and the mailbox, 48 px tap, opens the sheet).
// iPhone 13 (390x844) and Pixel 7 (412x915). node game/run_tests.js phone_v24_shop
const { run, sleep } = require('./test_lib');

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
// the sheet body scrolls inside itself: scroll to the end, every Buy button reachable and >= 44 px
async function shopScroll(t, label, minCards) {
  const { ok, ev } = t;
  const r = await ev(() => { const panel = document.querySelector('#modal .panel'), cards = document.querySelectorAll('#modal .shopgrid .sitem'); const sc = [panel, panel.querySelector('.panel-body')].find((e) => e && e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY)); return { n: cards.length, scrolls: !!sc, sw: document.documentElement.scrollWidth, iw: innerWidth, pw: panel.scrollWidth, pcw: panel.clientWidth }; });
  ok(r.n >= minCards, `${label}: ${r.n} cards`);
  ok(r.scrolls, `${label}: the sheet scrolls inside itself`);
  ok(r.sw === r.iw && r.pw <= r.pcw + 1, `${label}: no sideways scroll (page ${r.sw}/${r.iw}, sheet ${r.pw}/${r.pcw})`);
  const btn = await ev(async () => {
    const panel = document.querySelector('#modal .panel'), sc = [panel, panel.querySelector('.panel-body')].find((e) => e && e.scrollHeight > e.clientHeight + 4) || panel;
    const out = []; for (let y = 0; y <= sc.scrollHeight; y += Math.max(200, sc.clientHeight - 80)) { sc.scrollTop = y; await new Promise((r) => requestAnimationFrame(r)); document.querySelectorAll('#modal [data-buy]').forEach((b) => { const r = b.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= innerHeight) out.push([b.dataset.buy, Math.round(r.width), Math.round(r.height), r.right <= innerWidth + 0.5 && r.left >= -0.5]); }); }
    sc.scrollTop = 0; return out;
  });
  const small = btn.filter((b) => b[1] < 44 || b[2] < 44 || !b[3]);
  ok(btn.length > 0 && small.length === 0, `${label}: every Buy button on screen and >= 44 px (${new Set(btn.map((b) => b[0])).size} seen)${small.length ? ' -> ' + small.slice(0, 4).map((b) => b.join(' ')).join(' | ') : ''}`);
}

async function suite(t, dev) {
  const { ok, ev } = t;
  t.sec(dev + ': new game');
  await t.newGame({ device: dev }, { bond: { level: 10, pts: 9000 }, coins: 5000 });
  const p = t.p;
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');

  t.sec(dev + ': Kibble Corner and the Boutique');
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.place = 'market'; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#placeBtns [data-sh=kibble]'), null, 8000); await t.calm(); await t.lu();
  await tapSel(t, '#placeBtns [data-sh=kibble]'); await t.until(() => !!document.querySelector('#modal .panel.shop'), null, 5000); await settled(t, '#modal .panel');
  await tapSel(t, '[data-tab=food]', () => !!document.querySelector('[data-tab=food][aria-selected=true]')); await sheetFits(t, 'Kibble Corner food');
  await shopScroll(t, 'Kibble Corner food', 13); await audit(t, 'kibble food');
  const tip = await ev(() => { const e = document.querySelector('#modal .sh-tip'); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }); ok(tip >= 13, 'the safety tip line is >= 13 px (' + tip + ')');
  await tapSel(t, '[data-tab=toys]', () => !!document.querySelector('[data-tab=toys][aria-selected=true]')); await shopScroll(t, 'Kibble Corner toys', 11); await audit(t, 'kibble toys');
  await closeSheet(t);
  await tapSel(t, '#placeBtns [data-sh=boutique]'); await t.until(() => !!document.querySelector('#modal .panel.shop'), null, 5000); await settled(t, '#modal .panel');
  await sheetFits(t, 'Boutique'); await shopScroll(t, 'Boutique', 20); await audit(t, 'boutique');
  await closeSheet(t);
  await tapSel(t, '#placeBtns [data-sh=builder]'); await t.until(() => !!document.querySelector('#modal .panel.shop'), null, 5000); await settled(t, '#modal .panel');
  await shopScroll(t, 'Barkitecture', 11); await audit(t, 'barkitecture');
  await closeSheet(t);

  t.sec(dev + ': the yard clipboard');
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.place = 'yard'; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#msCardG > rect'), null, 8000); await t.calm(); await t.lu(); await t.freezeMotion(true); await settled(t, '#msCardG > rect');
  const g = await ev(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }; return { hit: q('#msCardG > rect'), art: q('#msCardG > svg'), dog: q('#dogHit'), mail: q('#mailboxG > rect') || q('#sceneG [data-hot=mailbox]'), iw: innerWidth, ih: innerHeight }; });
  const ov = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  ok(g.hit && g.hit[2] - g.hit[0] >= 47.5 && g.hit[3] - g.hit[1] >= 47.5, `tap rect >= 48 px (${g.hit && Math.round(g.hit[2] - g.hit[0])}x${g.hit && Math.round(g.hit[3] - g.hit[1])})`);
  ok(g.hit[0] >= 0 && g.hit[2] <= g.iw, 'the clipboard is on screen');
  ok(!ov(g.hit, g.dog) && !ov(g.art, g.dog), 'the clipboard does not cover #dogHit');
  ok(!ov(g.hit, g.mail), 'the clipboard does not cover the mailbox');
  await t.SH('yard_clipboard');
  const cx = (g.hit[0] + g.hit[2]) / 2, cy = (g.hit[1] + g.hit[3]) / 2;
  const top = await ev(([x, y]) => { const e = document.elementFromPoint(x, y); return !!e && !!e.closest('#msCardG'); }, [cx, cy]);
  ok(top, 'nothing sits on top of the clipboard');
  await p.touchscreen.tap(cx, cy);
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-pop'), null, 5000), 'a tap opens the Missions sheet');

  t.sec(dev + ': the Missions sheet');
  await settled(t, '#modal .panel.ms-pop'); await sheetFits(t, 'Missions'); await audit(t, 'missions sheet');
  const fs = await ev(() => ['.ms-coins', '.ms-sline'].map((s) => parseFloat(getComputedStyle(document.querySelector('#modal ' + s)).fontSize)));
  ok(fs.every((x) => x >= 15), 'Missions text 15 px (' + fs.join(', ') + ')');
  const cw = await ev(() => { const c = document.querySelector('#modal .ms-card').getBoundingClientRect(), b = document.querySelector('#modal .panel-body').getBoundingClientRect(); return [Math.round(c.width), Math.round(b.width)]; });
  ok(cw[0] >= Math.min(320, cw[1] - 24), `the card fills the sheet width (${cw[0]} of ${cw[1]})`);
  await closeSheet(t);
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
}

(async () => {
  for (const dev of ['iPhone 13', 'Pixel 7']) await run('phone_v24_shop_' + dev.replace(/\s+/g, '').toLowerCase(), (t) => suite(t, dev), { device: dev, prefs: { msTest: true } });
})();
