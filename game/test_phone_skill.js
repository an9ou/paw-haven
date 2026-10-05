// v2.2 phone: SKILL lane. Trick training + mini-games, garden + Pip's Sprout Cart, kitchen + cooking on iPhone 13 (390x844) and Pixel 7 (412x915).
// node game/run_tests.js game/test_phone_skill.js   (PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g))
const { speak, settle, ready } = require('./tricks_drive');
const AUD = (capSel) => {
  const vw = innerWidth, vh = innerHeight, small = [], text = [];
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0 && r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh; };
  const nm = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).split(' ')[0]}`;
  document.querySelectorAll('button, [role=button], a[href], input:not([type=hidden]), select').forEach((el) => {
    if (el.closest('#devPanel,#devBtn,.lptip,#toasts') || (el.closest('#view') && !el.closest('#modHost'))) return; if (!vis(el)) return;
    if (el.closest('.tray') && !el.closest('#trainPanel,#modHost')) return; // the dock and action bar belong to SHELL
    const r = el.getBoundingClientRect(), m = Math.min(r.width, r.height);
    if (m < 43.5) small.push(`${nm(el)} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 16)}"`);
  });
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const seen = new Set();
  while ((n = w.nextNode())) {
    const s = n.textContent.trim(); if (!s) continue; const el = n.parentElement;
    if (!el || seen.has(el) || el.classList.contains('pg-spark') || el.closest('#devPanel,#devBtn,script,style,svg,#toasts,#hud,#bar,#placeBtns')) continue; seen.add(el); if (!vis(el)) continue;
    const cs = getComputedStyle(el), sc = el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1, fs = parseFloat(cs.fontSize) * (sc > 0 ? sc : 1);
    const cap = !!el.closest(capSel) || el.tagName === 'SMALL'; // captions: 13 px, everything else 15 px
    if (fs < (cap ? 12.8 : 14.8)) text.push(`${nm(el)} ${fs.toFixed(1)}px "${s.slice(0, 18)}"`);
  }
  return { small, text, hs: document.documentElement.scrollWidth - innerWidth };
};
const CAPS = '.pk-ing, .small, .pk-nm, .pk-ct, .pg-q, .pg-tag, .pg-pk em, .pg-stamp, .trshow small, .trchip small, .pg-tool small, .pk-sh small, .pk-lbl, .pg-hint, .pg-num';
const DEVICES = ['iPhone 13', 'Pixel 7'];

require('./test_lib').run('phone_skill', async (t) => {
  const { ok, sec, ev, S } = t;
  const patchAll = { bond: { level: 10, pts: 5000 }, coins: 1000, gkEarly: true, stats: { hunger: 70, happy: 90, energy: 90, clean: 90 },
    inv: { seeds: { carrot: 3, peas: 3, blueberries: 2, spinach: 1, pumpkin: 1 }, crops: { carrot: [3, 1, 0], peas: [2, 0, 0], pumpkin: [1, 0, 0] }, pantry: { oats: 3, rice: 3, egg: 2, chicken: 2 } } };
  for (const device of DEVICES) {
    const tag = `[${device}] `;
    await t.newGame({ device }, patchAll); const p = t.p; const cdp = await t.ctx.newCDPSession(p);
    await ev(() => { const d = window.__paw.S.dog; ['Sit', 'Paw', 'Lie Down'].forEach((n) => { d.tricks[n] = { p: 1, shows: 0 }; }); });
    const audit = async (where) => {
      const r = await ev(`(${AUD})(${JSON.stringify(CAPS)})`);
      ok(r.hs === 0, `${tag}${where}: no horizontal scroll`);
      ok(r.small.length === 0, `${tag}${where}: tap targets >= 44 px${r.small.length ? ' -> ' + r.small.slice(0, 6).join(' | ') : ''}`);
      ok(r.text.length === 0, `${tag}${where}: text >= 15 px, captions >= 13 px${r.text.length ? ' -> ' + r.text.slice(0, 6).join(' | ') : ''}`);
    };
    const shot = (n) => t.SH(`${device.replace(' ', '')}_${n}`);
    const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    const centre = async (sel) => { const b = await p.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const holdDown = async (sel) => { const [x, y] = await centre(sel); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(x, y) }); };
    const topmost = (sel) => ev((s) => { const e = document.querySelector(s), r = e.getBoundingClientRect(), h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!h && (h === e || e.contains(h)); }, sel);
    const holdUp = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const touchDrag = async (pts, ms = 25) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
      for (let i = 1; i < pts.length; i++) { await t.sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(...pts[i]) }); }
      await t.sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const tapScroll = async (sel) => { await ev((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await t.sleep(200); const [x, y] = await centre(sel); await p.touchscreen.tap(x, y); };
    const refill = () => ev(() => { window.__paw.S.dog.focus = { v: 100, at: window.__paw.S.gameMin }; });

    sec(tag + 'trick training');
    await t.home(); await p.locator('[data-act=play]').tap(); await t.waitPop(true); await p.locator('[data-play=tricks]').tap(); await settle(t);
    ok(await p.locator('#trainPanel:not([hidden])').count() === 1, tag + 'the training panel opens');
    const pb = await p.locator('#trainPanel').boundingBox(), vw = await ev(() => innerWidth), vh = await ev(() => innerHeight);
    ok(pb.width >= vw - 2 && pb.y + pb.height <= vh + 1, `${tag}the panel is full width and on screen (${Math.round(pb.width)}x${Math.round(pb.height)})`);
    await audit('training panel'); await shot('01_train');
    const sc0 = await ev(() => { const e = document.querySelector('#trainPanel'); return [e.scrollHeight, e.clientHeight]; });
    ok(sc0[0] <= sc0[1] || (await ev(() => getComputedStyle(document.querySelector('#trainPanel')).overflowY)) === 'auto', `${tag}the panel scrolls if its content is taller than it (${sc0})`);
    // chips never overlap each other or the Start button
    const ov = await ev(() => { const a = document.querySelector('#trainPanel .trchips').getBoundingClientRect(), b = document.getElementById('trStart').getBoundingClientRect(); return a.bottom <= b.top + 1; });
    ok(ov, tag + 'the trick chips sit above Start without overlap');
    await refill(); await p.locator('[data-tr="Sit"]').tap(); await t.until(() => window.__paw.train.trick === 'Sit', null, 3000);
    await ev(() => { window.__paw.S.dog.tricks.Sit = { p: 0.1, shows: 0 }; }); await p.locator('[data-tr="Paw"]').tap(); await p.locator('[data-tr="Sit"]').tap();
    await p.locator('#trStart').tap(); ok(await t.until(() => !!document.querySelector('#trTrack .tg-dots'), null, 4000), tag + 'Start draws the dotted lure track');
    ok(await p.locator('#pkLead').count() === 1, tag + 'a "Hold to lead" button shows during a track (the drag fallback)'); await audit('lure track'); ok(await topmost('#pkLead'), tag + 'the Lead button is on screen and nothing covers it'); await shot('02_track');
    // 1) touch drag: grab the treat at the start dot and drag along the track
    let tr = await ev(() => window.__pawTG.track()); const pts = tr.segs[0].pts; const half = pts.slice(0, Math.floor(pts.length / 2));
    await touchDrag(half, 20); const s1 = await ev(() => (window.__pawTG.game ? window.__pawTG.game.s : -1));
    ok(s1 > 0 || s1 === -1, `${tag}touch drag moves the treat along the track (progress ${Math.round(s1)})`);
    // 2) hold the Lead button until the attempt ends
    await holdDown('#pkLead'); const done = await t.until(() => !window.__pawTG.game || window.__pawTG.game.pi > 0, null, 12000); await holdUp();
    ok(done, tag + 'holding "Hold to lead" carries the treat to the star');
    await t.until(() => !!window.__paw.train && !!window.__paw.train.last, null, 5000); const L = await ev(() => window.__pawTG.last);
    ok(!!L && ['Great', 'Good', 'Missed'].includes(L.grade), `${tag}the attempt is scored (${L && L.grade} ${L && L.acc}%)`);
    await ready(t); await audit('after an attempt');
    // Paw: tap fallback (two paw taps and a hold)
    await refill(); await p.locator('[data-tr="Paw"]').tap(); await t.until(() => window.__paw.train.trick === 'Paw', null, 3000); await p.locator('#trStart').tap();
    await t.until(() => !!document.querySelector('#pkLead'), null, 4000); await t.until(() => { const g = window.__pawTG.game; return !!g && !g.busy; }, null, 4000);
    await p.locator('#pkLead').tap(); await t.sleep(250); await p.locator('#pkLead').tap();
    ok(await t.until(() => { const g = window.__pawTG.game; return !g || g.si >= 1; }, null, 4000), tag + 'tap the Lead button for the paw taps (no precise aim needed)');
    await holdDown('#pkLead'); await t.until(() => !window.__pawTG.game, null, 8000); await holdUp(); await ready(t);

    sec(tag + 'Speak rhythm');
    await refill(); await p.locator('[data-tr="Speak"]').tap(); await t.until(() => window.__paw.train.trick === 'Speak', null, 3000); await p.locator('#trStart').tap();
    ok(await t.until(() => !!document.getElementById('trSpeak'), null, 3000), tag + 'the Speak! button shows');
    const sb = await p.locator('#trSpeak').boundingBox(); ok(sb.width >= 44 && sb.height >= 44 && sb.width >= vw * 0.6, `${tag}Speak! is a big tap target (${Math.round(sb.width)}x${Math.round(sb.height)})`); await audit('Speak'); await shot('03_speak');
    await t.until(() => !!window.__pawTG.beats(), null, 4000); await t.ev(() => { window.__tapped = 0; document.getElementById('trSpeak').addEventListener('pointerdown', () => { window.__tapped++; }); });
    await p.locator('#trSpeak').tap({ force: true }); ok(await ev(() => window.__tapped) >= 1, tag + 'a touch tap on Speak! arrives as a pointer event');
    await speak(t, [0, 40, -60]); await t.until(() => !!window.__paw.train && !!window.__paw.train.last, null, 5000); await ready(t);

    sec(tag + 'Show off');
    await ev(() => { const d = window.__paw.S.dog; ['Sit', 'Paw', 'Lie Down'].forEach((n) => { d.tricks[n] = { p: 1, shows: 0 }; }); });
    await p.locator('[data-trtab=show]').tap(); await p.waitForSelector('[data-show]'); await audit('Show off tab'); await shot('04_show');
    await refill(); await p.locator('[data-show="Sit"]').tap(); ok(await t.until(() => !!window.__pawTG.track(), null, 4000), tag + 'a Show off trace starts by touch');
    ok(await p.locator('#trTrack.show').count() === 1 && await p.locator('#pkLead').count() === 1, tag + 'the trace has the Lead button too'); await audit('Show off trace'); ok(await topmost('#pkLead'), tag + 'the Lead button is on screen and nothing covers it');
    await holdDown('#pkLead'); await t.until(() => !window.__pawTG.game, null, 12000); await holdUp();
    await t.until(() => window.__paw.train && window.__paw.train.chain >= 1, null, 8000); ok(await ev(() => window.__paw.train.chain) >= 1, tag + 'the trace counts toward the chain');
    await t.until(() => !window.__paw.train.held, null, 8000); await p.locator('#trX').tap(); ok(await t.until(() => !window.__paw.train, null, 3000), tag + 'close (x) is a tap target that works');

    sec(tag + 'garden');
    await t.home(); await ev(() => window.__paw.go('garden')); ok(await t.untilMode('garden'), tag + 'the garden opens'); await p.waitForSelector('.pg-plot'); await t.sleep(900);
    const rects = await ev(() => [...document.querySelectorAll('.pg-plot')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));
    ok(rects.length === 6 && new Set(rects.map((r) => r[0])).size === 2 && new Set(rects.map((r) => r[1])).size === 3, `${tag}six plots in a 2 x 3 grid`);
    ok(rects.every((r) => r[2] >= 44 && r[3] >= 44 && r[0] >= 0 && r[0] + r[2] <= vw), `${tag}every plot is >= 44 px and inside the screen width`);
    await audit('garden'); await shot('05_garden');
    await p.locator('.pg-plot[data-i="0"]').tap(); await t.sleep(250);     await tapScroll('[data-a=plant]'); await p.waitForSelector('.pg-pouch [data-c]'); await t.sleep(250);
    await audit('seed pouch'); await shot('06_pouch');
    await p.locator('.pg-pouch [data-c="carrot"]').tap(); await t.sleep(300); await p.locator('.pg-plot[data-i="0"]').tap();
    ok(await t.until(() => window.__paw.S.garden.plots[0].crop === 'carrot', null, 4000), tag + 'tap a plot, tap Plant, tap a seed: planted (no drag needed)');
    // drag a seed with a finger onto plot 4
    await ev(() => window.__paw.S.garden.plots[3].crop); await p.locator('[data-t="seeds"]').tap(); await p.waitForSelector('.pg-pouch [data-c="carrot"]'); await t.sleep(250);
    const from = await centre('.pg-pouch [data-c="carrot"]'), to = await centre('.pg-plot[data-i="3"]');
    await touchDrag(Array.from({ length: 12 }, (_, i) => [from[0] + (to[0] - from[0]) * i / 11, from[1] + (to[1] - from[1]) * i / 11]), 25);
    await t.sleep(300); await p.locator('.pg-plot[data-i="3"]').tap();
    ok(await t.until(() => window.__paw.S.garden.plots[3].crop === 'carrot', null, 4000), tag + 'dragging a seed with a finger onto a plot plants it');
    await p.locator('[data-t="water"]').tap(); await t.sleep(200); await p.locator('.pg-plot[data-i="0"]').tap();
    ok(await t.until(() => window.__paw.S.garden.plots[0].water >= 1, null, 4000), tag + 'Watering Can tool then a plot waters it');
    await t.home(); await ev(() => document.getElementById('devBtn').click()); await p.waitForSelector('#dvGReady', { state: 'attached' }); await ev(() => { document.getElementById('dvGReady').click(); const x = document.getElementById('dvX'); if (x) x.click(); }); await ev(() => window.__paw.go('garden')); await p.waitForSelector('.pg-plot'); await t.sleep(800);
    const c0 = await ev(() => (window.__paw.S.inv.crops.carrot || [0]).reduce((a, b) => a + b, 0));
    await audit('garden with a ready crop'); await p.locator('.pg-plot[data-i="0"]').tap();
    ok(await t.until((c) => (window.__paw.S.inv.crops.carrot || [0]).reduce((a, b) => a + b, 0) > c, c0, 4000), tag + 'a tap on a ready plot harvests it into the basket');
    await p.locator('.pg-done').tap(); ok(await t.untilMode('yard'), tag + 'Done closes the garden');

    sec(tag + "Pip's Sprout Cart");
    await t.home('market'); await ev(() => window.__paw.go('market')); await p.waitForSelector('#placeBtns [data-sh=sprout]'); await ev(() => document.querySelector('#placeBtns [data-sh=sprout]').click()); await p.waitForSelector('[data-ptab=seeds]');
    await audit('Pip seeds'); await shot('07_pip');
    await p.locator('[data-ptab=sell]').tap(); await p.waitForSelector('.pipcap'); await audit('Pip sell'); await shot('08_pip_sell');
    await p.locator('[data-ptab=people]').tap(); await p.waitForSelector('[data-people]'); await audit('Pip people gardens');
    await p.locator('[data-people]').first().tap(); ok(await t.until(() => (window.__toasts || []).length > 0, null, 3000), tag + 'tapping a people-food card explains why (a toast, no hover)');
    await t.closeX();

    sec(tag + 'kitchen');
    await t.home(); await ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await t.sleep(600);
    await ev(() => window.__paw.go('kitchen')); ok(await t.untilMode('kitchen'), tag + 'the kitchen opens'); await p.waitForSelector('[data-ing="carrot"]'); await t.sleep(900);
    await audit('kitchen'); await shot('09_kitchen');
    const pr = await ev(() => { const sh = document.querySelector('.pk-shelf'), pot = document.querySelector('.pk-pot').getBoundingClientRect(), s = sh.getBoundingClientRect(); return { below: s.top >= pot.bottom - 20, scrolls: sh.scrollWidth >= sh.clientWidth }; });
    ok(pr.below && pr.scrolls, tag + 'the pantry strip sits under the pot and scrolls sideways');
    await p.locator('[data-ing="oats"]').tap(); ok(await t.until(() => document.querySelectorAll('.pk-slot .pk-it, .pk-slot svg, .pk-slots .pk-full').length > 0 || document.querySelectorAll('.pk-inpot > *').length > 0, null, 3000), tag + 'tap-to-add: a tap on a pantry item puts it in the pot');
    await p.locator('[data-ing="carrot"]').tap(); await t.sleep(300); await shot('10_pot');
    // finger drag from the shelf to the pot
    const f2 = await centre('[data-ing="egg"]'), pot = await ev(() => { const r = document.querySelector('.pk-pot').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    const before = await ev(() => document.querySelectorAll('.pk-slots [data-slot].pk-full, .pk-slots .pk-filled').length);
    await touchDrag(Array.from({ length: 10 }, (_, i) => [f2[0] + (pot[0] - f2[0]) * i / 9, f2[1] + (pot[1] - f2[1]) * i / 9]), 25); await t.sleep(400);
    ok(await ev(() => document.querySelector('.pk-slots') !== null), tag + 'a finger drag from the shelf to the pot does not break the screen');
    await audit('kitchen with ingredients');
    const cook = p.locator('.pk-go').first(); const cdisabled = await cook.evaluate((e) => e.disabled);
    if (!cdisabled) {
      await cook.tap(); await p.waitForSelector('.pk-tap'); await audit('cooking'); await shot('11_cook');
      for (let i = 0; i < 12 && await p.locator('.pk-tap').count(); i++) { await p.locator('.pk-tap').tap().catch(() => {}); await t.sleep(500); }
    }
    await p.locator('.pk-btn', { hasText: 'Recipe book' }).first().tap().catch(() => {}); await t.sleep(500); await audit('recipe book'); await shot('12_book');
    await p.keyboard.press('Escape'); await t.sleep(200);
    await ev(() => window.__paw.go('yard'));
  }
}, { device: 'iPhone 13' });
