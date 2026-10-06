// v2.2 phone, HOME lane: title, adoption, yard and house scenes, bath, feeding, petting, potty, beds, houses, pack dogs, decor, nursery basket, mailbox.
// Runs on iPhone 13 (390x844) and Pixel 7 (412x915).  node game/run_tests.js game/test_phone_home.js --jobs 2
const { run } = require('./test_lib');

// In-page audit of everything visible: tap targets >= 44, text >= 15 (13 for captions), no horizontal scroll.
// The HUD, action bar and toasts belong to the SHELL lane and are left out.
const AUDIT = () => {
  const out = { small: [], text: [], scroll: document.documentElement.scrollWidth - window.innerWidth };
  const SKIP = '#devPanel, #devBtn, #bar, #hud, #toasts';
  const vis = (el) => {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null;
    for (let e = el; e && e !== document.body; e = e.parentElement) { if (e.hidden) return null; const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return null; }
    if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) return null; return r;
  };
  const nm = (el) => (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20) + '"';
  document.querySelectorAll('button, [role=button], a[href], input:not([type=hidden]):not([type=range]), select, .card, .hot').forEach((el) => {
    if (el.closest(SKIP)) return; const r = vis(el); if (!r) return;
    if (r.width < 43.5 || r.height < 43.5) out.small.push(nm(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const s = n.nodeValue.trim(); if (!s) continue; const el = n.parentElement; if (!el || el.closest('svg, script, style, ' + SKIP) || !vis(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize), cap = !!el.closest('.small, .sub, small, .cap, .crayon-note, .tagline');
    if (fs < (cap ? 12.95 : 14.95)) out.text.push(nm(el) + ' ' + fs + 'px');
  }
  return out;
};

(async () => {
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    await run('phone_home_' + dev.replace(/\s/g, '').toLowerCase(), async (t) => {
      const { ok } = t;
      const W = dev === 'iPhone 13' ? 390 : 412;
      const audit = async (label) => {
        const a = await t.ev(AUDIT);
        ok(a.scroll <= 0, `${label}: no horizontal scroll (${a.scroll})`);
        ok(a.small.length === 0, `${label}: tap targets >= 44 px ${a.small.slice(0, 5).join(' | ')}`);
        ok(a.text.length === 0, `${label}: text >= 15 px (captions 13) ${[...new Set(a.text)].slice(0, 5).join(' | ')}`);
        await t.SH(label.replace(/\W+/g, '_'));
      };
      const tapSel = async (sel) => { await t.p.locator(sel).first().tap(); };
      const rectOf = (sel) => t.ev((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
      const modalOpen = (ms) => t.until(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), null, ms || 4000);
      let cdp = null;
      const touch = async (pts) => {
        cdp = cdp || await t.ctx.newCDPSession(t.p);
        const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
        for (const q of pts.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(...q) });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      };
      const camX = () => t.ev(() => document.querySelector('#view > svg.world').viewBox.baseVal.x);

      // ---------- title ----------
      t.sec(dev + ': title');
      await t.boot({ device: dev });
      ok(await t.ev(() => document.documentElement.dataset.layout === 'phone'), 'phone layout is on');
      ok(await t.ev((w) => innerWidth === w, W), 'viewport is ' + W + ' wide');
      await audit('title');

      // ---------- adoption ----------
      t.sec(dev + ': adoption');
      await tapSel('#tNew'); await t.p.waitForSelector('#aAdopt');
      await audit('adopt');
      await tapSel('.heads button:nth-child(2)'); ok(await t.until(() => document.querySelector('.heads button[aria-current=true]').dataset.i === '1'), 'tapping a head picks that dog');
      await tapSel('#aNext'); await tapSel('#aPrev');
      await tapSel('#aAdopt'); // no sex yet: a kind nudge, nothing breaks
      await tapSel('#aGirl'); ok(await t.until(() => document.getElementById('aGirl').getAttribute('aria-pressed') === 'true'), 'Girl is picked by tap');
      await audit('adopt_girl');
      await tapSel('#aAdopt'); await t.p.waitForSelector('#nOk');
      await audit('adopt_name');
      await tapSel('#nOk');
      await t.intro(); await t.calm();
      await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 60, happy: 80, energy: 90, clean: 40 } });

      // ---------- yard ----------
      t.sec(dev + ': yard');
      await t.home();
      await t.until(() => !!document.querySelector('#view svg.world'));
      await audit('yard');
      const cam = await t.ev(() => { const s = document.querySelector('#view > svg.world'); const hit = document.getElementById('dogHit').getBoundingClientRect(); const v = document.getElementById('view').getBoundingClientRect(); return { vbw: s.viewBox.baseVal.width, hx: hit.left + hit.width / 2, vx: v.left + v.width / 2, hw: hit.width, hh: hit.height }; });
      ok(cam.vbw < 1000, `camera crops the scene (viewBox width ${Math.round(cam.vbw)})`);
      ok(Math.abs(cam.hx - cam.vx) < 90, `dog area is centred in the crop (dx ${Math.round(cam.hx - cam.vx)})`);
      ok(cam.hw >= 44 && cam.hh >= 44, `dog tap area is big enough (${Math.round(cam.hw)}x${Math.round(cam.hh)})`);

      // ---------- petting by rub (touch) ----------
      t.sec(dev + ': petting');
      const bond0 = (await t.S()).bond.pts, rose = (b) => window.__paw.S.bond.pts > b || window.__paw.S.bond.level > 7 || window.__paw.S.stats.happy > 80;
      const box = await t.p.locator('#dogHit').boundingBox();
      for (let round = 0; round < 8; round++) {
        const pts = []; for (let i = 0; i < 40; i++) pts.push([box.x + box.width * (0.25 + 0.5 * (i % 2)), box.y + box.height * 0.45]);
        await touch(pts); if (await t.until(rose, bond0, 700)) break;
      }
      ok(await t.until(rose, bond0, 1500), 'a finger rub pets the dog (bond or happiness rose)');
      await t.lu();

      // ---------- feeding ----------
      t.sec(dev + ': feeding');
      await t.retryUntil(() => tapSel('[data-act=feed]'), () => !!document.querySelector('#dock .tray:not(.dock-idle):not(.mini)'));
      ok(await t.waitPop(true), 'feed tray opens');
      await audit('feed_tray');
      const food = t.p.locator('#dock .tray [data-food]:not(.off):not([data-food="Fresh Water"])').first();
      const fname = await food.getAttribute('data-food'), had = await t.ev((n) => window.__paw.S.inv.food[n] || 0, fname);
      await food.tap();
      ok(await t.until((a) => (window.__paw.S.inv.food[a.n] || 0) < a.had, { n: fname, had }, 6000), 'tapping a food feeds the dog (' + fname + ')');
      await t.home();
      ok(await t.until(() => !!document.querySelector('#bowlG'), null, 4000), 'bowl is in the yard');
      const bw = await rectOf('#bowlG'); ok(bw.w >= 44 && bw.h >= 44, `bowl tap area >= 44 (${Math.round(bw.w)}x${Math.round(bw.h)})`);
      await t.p.touchscreen.tap(bw.x, bw.y); ok(await t.waitPop(true), 'tapping the bowl opens the feed tray');
      await t.home();

      // ---------- care tray, decor, beds, houses ----------
      t.sec(dev + ': care, decor, beds, houses');
      await t.patch({ decor: { 'Giant Crayon Box': { got: '2026-01-01', out: true }, 'Doggy Ramp': { got: '2026-01-01', out: false }, 'Family Photo Frame': { got: '2026-01-01', out: true } } });
      await t.ev(() => window.__paw.go('yard')); await t.until(() => !!document.querySelector('[data-decor]'));
      await t.retryUntil(() => tapSel('[data-act=care]'), () => !!document.querySelector('[data-care]'));
      ok(await t.waitPop(true), 'care tray opens');
      ok(await t.p.locator('[data-care=decor]').count() === 1, 'Decor card is in the care tray');
      await audit('care_tray');
      await tapSel('[data-care=decor]'); ok(await t.waitH2(/decor/i), 'Decor popup opens');
      await audit('decor_popup');
      await tapSel('[data-back="Doggy Ramp"]'); await t.until(() => window.__paw.S.decor['Doggy Ramp'].out);
      await t.modalGone(); await t.home();
      // tap yard decorations (no hover needed)
      await t.until(() => !!document.querySelector('[data-decor="Giant Crayon Box"]'));
      const dm = await rectOf('[data-decor="Giant Crayon Box"]');
      ok(dm.w >= 44 && dm.h >= 44, `decoration tap area >= 44 (${Math.round(dm.w)}x${Math.round(dm.h)})`);
      const dr = await rectOf('[data-decor="Doggy Ramp"]');
      ok(dr.w >= 44 && dr.h >= 44, `small decoration (ramp) tap area >= 44 (${Math.round(dr.w)}x${Math.round(dr.h)})`);
      await t.p.locator('[data-decor="Giant Crayon Box"]').tap(); ok(await t.waitH2(/Crayon/), 'tapping a decoration opens its card');
      await audit('decor_card');
      await t.p.locator('#hmAway').tap(); await t.modalGone();

      await t.retryUntil(() => tapSel('[data-act=care]'), () => !!document.querySelector('[data-care=bed]'));
      await tapSel('[data-care=bed]'); ok(await modalOpen(), 'beds popup opens');
      await audit('beds');
      await t.closeX(); await t.home();
      await t.retryUntil(() => tapSel('[data-act=care]'), () => !!document.querySelector('[data-care=house]'));
      await tapSel('[data-care=house]'); ok(await modalOpen(), 'houses popup opens');
      await audit('houses');
      await t.closeX(); await t.home();

      // ---------- mailbox hotspot and camera swipe ----------
      t.sec(dev + ': mailbox, swipe camera');
      await t.until(() => !!document.getElementById('mailboxG'));
      await t.sleep(900); // the camera may still be easing back to the dog
      const mb = await rectOf('#mailboxG');
      ok(!!mb && mb.w >= 44 && mb.h >= 44, `mailbox tap area >= 44 (${mb && Math.round(mb.w)}x${mb && Math.round(mb.h)})`);
      await t.p.touchscreen.tap(mb.x - mb.w * 0.3, mb.y); // left of centre: the dog's tap box may be parked over the middle of the mailbox
      ok(await modalOpen(), 'tapping the mailbox opens it');
      await t.closeX(); await t.home();
      // the house door is mostly outside the crop: one swipe brings it (and the nursery, chair) into view
      const vb0 = await camX(); const sw = await t.p.locator('#view').boundingBox(), y = sw.y + sw.height * 0.15;
      await touch([[sw.x + sw.width * 0.85, y], [sw.x + sw.width * 0.6, y], [sw.x + sw.width * 0.3, y], [sw.x + sw.width * 0.1, y]]);
      const vb1 = await camX();
      ok(vb1 > vb0 + 100, `a swipe pans the camera right (${Math.round(vb0)} -> ${Math.round(vb1)})`);
      ok(await t.ev(() => { const r = document.getElementById('houseG').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; }), 'the dog house is fully on screen after the swipe');
      ok(await t.ev(() => document.getElementById('modal').hidden), 'a swipe does not open anything by accident');
      ok(await t.until((x) => document.querySelector('#view > svg.world').viewBox.baseVal.x < x - 50, vb1, 20000), 'the camera eases back to the dog');
      await t.home();

      // ---------- bath ----------
      t.sec(dev + ': bath');
      await t.retryUntil(() => tapSel('[data-act=care]'), () => !!document.querySelector('[data-care=bath]'));
      await tapSel('[data-care=bath]');
      ok(await t.untilMode('bath'), 'bath opens');
      await audit('bath');
      const c0 = (await t.S()).stats.clean;
      const tb = await t.p.locator('#view svg.world').boundingBox();
      for (let r = 0; r < 6; r++) {
        const pts = []; for (let i = 0; i < 40; i++) pts.push([tb.x + tb.width * (0.42 + 0.2 * (i % 2)), tb.y + tb.height * 0.62]);
        await touch(pts);
      }
      ok(await t.until((c) => window.__paw.S.stats.clean > c, c0, 3000), 'finger scrub raises Cleanliness');
      await t.until(() => window.__paw.mode === 'yard', null, 8000); await t.lu(); await t.calm();

      // ---------- potty ----------
      t.sec(dev + ': potty');
      await t.ev(() => { const S = window.__paw.S; S.messes.yard = [{ type: 'poop', x: 575, at: S.gameMin, dog: S.dog.id }]; window.__paw.go('yard'); });
      const pt = await t.until(() => !!document.querySelector('#messG .mess'), null, 20000);
      ok(pt, 'a potty spot shows up');
      if (pt) {
        await audit('potty');
        const info = await rectOf('#messG .mess');
        ok(info.w >= 44 && info.h >= 44, `potty spot tap area >= 44 (${Math.round(info.w)}x${Math.round(info.h)})`);
        await t.p.locator('#messG .mess').tap({ force: true });
        ok(await t.retryUntil(async () => { if (await t.p.locator('#messG .mess').count()) await t.p.locator('#messG .mess').tap({ force: true }); }, () => !document.querySelector('#messG .mess'), null, { tries: 4, each: 3000 }), 'a tap scoops it');
      }
      await t.calm();

      // ---------- nursery basket ----------
      t.sec(dev + ': nursery basket');
      await t.ev(() => {
        const S = window.__paw.S, d = S.dog, today = new Date().toISOString().slice(0, 10), until = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
        const pup = (i) => ({ id: 'pupT' + i, name: 'Pip' + i, key: d.key, sex: i % 2 ? 'male' : 'female', genes: JSON.parse(JSON.stringify(d.genes || {})), born: today });
        S.litters = [{ id: 'litT', mum: d.id, born: today, until, named: true, pups: [pup(1), pup(2)], pets: {} }];
        window.__paw.go('yard');
      });
      const nbOn = await t.until(() => !!document.getElementById('nurseryG'), null, 5000);
      ok(nbOn, 'nursery basket is drawn');
      if (nbOn) {
        const sw2 = await t.p.locator('#view').boundingBox(), y2 = sw2.y + sw2.height * 0.15;
        await touch([[sw2.x + sw2.width * 0.85, y2], [sw2.x + sw2.width * 0.5, y2], [sw2.x + sw2.width * 0.1, y2]]);
        await t.sleep(150); const nbx = await t.ev(() => { const r = document.querySelector('#nurseryG > rect').getBoundingClientRect(); return { w: r.width, h: r.height, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        ok(nbx.w >= 44 && nbx.h >= 44, `nursery basket tap area >= 44 (${Math.round(nbx.w)}x${Math.round(nbx.h)})`);
        await t.p.locator('#nurseryG > rect').tap({ force: true });
        ok(await modalOpen(), 'tapping the basket opens the nursery');
        ok(await t.ev(() => document.documentElement.scrollWidth <= innerWidth), 'nursery popup: no horizontal scroll'); await t.closeX();
      }
      await t.ev(() => { window.__paw.S.litters = []; }); await t.home();

      // ---------- house scene ----------
      t.sec(dev + ': house scene');
      await t.ev(() => { window.__paw.S.place = 'house'; window.__paw.go('yard'); }); await t.until(() => !!document.getElementById('bedG'));
      await audit('house');
      ok(await t.ev(() => document.querySelector('#view > svg.world').viewBox.baseVal.width < 1000), 'house scene is cropped to the dog too');
      await t.ev(() => { window.__paw.S.place = 'yard'; window.__paw.go('yard'); });

      // ---------- pack dogs: tap to switch ----------
      t.sec(dev + ': pack dogs');
      await t.ev(() => { window.__paw.addDog({ key: 'corgi', sex: 'male' }, 'Biscuit'); window.__paw.go('yard'); });
      await t.calm(); await t.until(() => document.querySelectorAll('#pack .packdog').length >= 1);
      await audit('pack');
      const first = await t.S();
      ok(await t.p.locator('.dchip').count() > 0, 'dog chips are in the HUD');
      const pd = await rectOf('#pack .packdog');
      if (pd.x > 0 && pd.x < W) {
        ok(pd.w >= 44 && pd.h >= 44, `pack dog tap area >= 44 (${Math.round(pd.w)}x${Math.round(pd.h)})`);
        await t.p.touchscreen.tap(pd.x, pd.y);
        ok(await t.until((id) => window.__paw.S.dog.id !== id, first.dog.id, 4000), 'tapping a pack dog switches to it');
      } else {
        await t.p.locator('.dchip').last().tap();
        ok(await t.until((id) => window.__paw.S.dog.id !== id, first.dog.id, 4000), 'tapping a dog chip switches to it');
      }
    }, { device: dev });
  }
})();
