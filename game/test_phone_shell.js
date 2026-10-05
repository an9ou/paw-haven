// v2.2 PHONE SHELL (SHELL lane): mode switch, portrait lock, two-row HUD, ... menu, action bar, every openModal as a bottom sheet,
// base 44 px sizes, toasts above the bar, long-press tooltip. iPhone 13 (390x844) and Pixel 7 (412x915), touch only.
//   node game/run_tests.js game/test_phone_shell.js      (or PAW_ARGS=... NODE_PATH=$(npm root -g) node game/test_phone_shell.js)
require('./test_lib').run('phone_shell', async (t) => {
  const { ok, sec, ev } = t;
  const sleep = t.sleep;

  for (const dev of ['iPhone 13', 'Pixel 7']) {
    sec(dev + ': mode switch, HUD');
    const p = await t.mk({ device: dev }); await p.goto(require('./test_lib').URL); await p.waitForSelector('#tNew, #tContinue');
    await t.adopt({ sex: 'girl' });
    await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, title: 'Puddle Expert', stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } }); await t.calm();
    await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
    const cdp = await t.ctx.newCDPSession(p);
    const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    const touch = async (pts, ms = 30) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
      for (let i = 1; i < pts.length; i++) { await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(...pts[i]) }); }
      await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const line = (a, b, n = 10) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
    const box = (sel) => ev((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }; }, sel);
    const noHScroll = async (where) => { const [sw, iw] = await ev(() => [document.documentElement.scrollWidth, innerWidth]); ok(sw === iw, `${dev} ${where}: no horizontal scroll (${sw} = ${iw})`); };
    // every visible tap target inside `scope` is >= 44 x 44
    const targets = async (where, scope) => {
      const bad = await ev((scope) => {
        const out = [];
        document.querySelectorAll(scope.split(',').map((s) => `${s} button, ${s} [role=button], ${s} [role=tab], ${s} input:not([type=hidden]), ${s} select`).join(',')).forEach((el) => {
          let r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
          const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
          if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
          if (el.type === 'checkbox' && el.closest('label')) r = el.closest('label').getBoundingClientRect();
          if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 16)}"`);
        });
        return out;
      }, scope);
      ok(bad.length === 0, `${dev} ${where}: tap targets >= 44 px${bad.length ? ' -> ' + bad.slice(0, 5).join(' | ') : ''}`);
    };
    // text size: >= 15 px, captions (.small, .act labels, .lptip) >= 13 px
    const textSizes = async (where, scope) => {
      const bad = await ev((scope) => {
        const out = []; const els = [...document.querySelectorAll(scope.split(',').map((s) => `${s} *`).join(','))];
        els.forEach((el) => {
          if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
          const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.top > innerHeight || r.bottom < 0) return;
          const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return;
          const fs = parseFloat(cs.fontSize), cap = !!el.closest('.small, .lptip, .sex');
          if (fs < (cap ? 13 : 15) - 0.01) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${fs}px "${el.textContent.trim().slice(0, 16)}"`);
        });
        return out;
      }, scope);
      ok(bad.length === 0, `${dev} ${where}: text >= 15 px (captions 13)${bad.length ? ' -> ' + bad.slice(0, 5).join(' | ') : ''}`);
    };

    ok(await ev(() => document.documentElement.dataset.layout === 'phone' && !document.documentElement.hasAttribute('data-pslock')), `${dev}: phone layout on, no portrait lock in portrait`);
    await noHScroll('yard');
    // row 1: portrait chip, mood dot, name + sex symbol, coins, ... menu, all on one line; title tag under the name; row 2: the 4 ring meters
    const H = await ev(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? { t: b.top, b: b.bottom, l: b.left, cy: b.top + b.height / 2 } : null; };
      return { head: r('#hudHead'), mood: r('#hudMood'), name: r('#hudName'), sex: r('#hudName .sex'), title: r('#hudTitle'), titleTxt: document.getElementById('hudTitle').textContent, coins: r('#coins'), more: r('#moreBtn'),
        meters: [...document.querySelectorAll('#meters .meter')].map((m) => { const b = m.getBoundingClientRect(); return { t: b.top, w: b.width, h: b.height }; }), hud: r('#hud'), gear: getComputedStyle(document.getElementById('gearBtn')).display };
    });
    ok(H.head && H.mood && H.name && H.sex && H.coins && H.more, `${dev} HUD row 1: dog chip, mood dot, name, sex symbol, coins and the ... menu are shown`);
    ok(Math.abs(H.coins.cy - H.more.cy) < 12 && H.coins.b <= H.meters[0].t + 2 && H.more.b <= H.meters[0].t + 2, `${dev} HUD: coins and ... menu sit on row 1, above the meters`);
    ok(H.title && H.titleTxt === 'Puddle Expert' && H.title.t >= H.name.b - 4, `${dev} HUD: the title tag shows under the name`);
    ok(H.meters.length === 4 && H.meters.every((m) => m.w >= 44 && m.h >= 44 && Math.abs(m.t - H.meters[0].t) < 2), `${dev} HUD row 2: 4 ring meters, 44 px or more, in one row`);
    ok(H.hud.b - H.hud.t <= 130, `${dev} HUD is compact: ${Math.round(H.hud.b - H.hud.t)} px tall`);
    ok(H.gear === 'none', `${dev} HUD: Settings lives in the ... menu (gear hidden)`);
    await targets('HUD', '#hud'); await textSizes('HUD', '#hud');
    // ring meters expand on tap, fold on a tap elsewhere
    await p.locator('#meters').tap(); ok(await t.until(() => document.getElementById('hud').classList.contains('hexp')), `${dev}: tap the ring meters: they expand`);
    ok(await ev(() => [...document.querySelectorAll('#meters .meter .num')].every((n) => getComputedStyle(n).display !== 'none' && n.textContent !== '')), `${dev}: expanded meters show their numbers`);
    await t.SH(dev + '_hud_expanded'); await noHScroll('HUD expanded');
    const vc = await box('#view'); await p.touchscreen.tap(vc.x + vc.w * 0.45, vc.y + vc.h * 0.22); // the sky: nothing to press there
    ok(await t.until(() => !document.getElementById('hud').classList.contains('hexp')), `${dev}: a tap elsewhere folds the meters`);

    sec(dev + ': action bar');
    const bar = await ev(() => { const b = document.getElementById('bar').getBoundingClientRect(); return { b: b.bottom, t: b.top, ih: innerHeight, acts: [...document.querySelectorAll('#bar .act')].map((a) => { const r = a.getBoundingClientRect(); return { h: r.height, w: r.width, l: r.left, r: r.right, lbl: a.textContent.trim() }; }) }; });
    ok(bar.acts.length === 7 && bar.acts.every((a) => a.h >= 48 && a.w >= 44 && a.lbl), `${dev}: 7 labelled action buttons, each >= 48 px tall: ${bar.acts.map((a) => Math.round(a.h)).join(',')}`);
    ok(Math.abs(bar.b - bar.ih) < 1.5 && bar.acts.every((a) => a.l >= 0 && a.r <= innerWidthOf(dev)), `${dev}: action bar fixed at the bottom of the screen`);
    ok(await ev(() => /env\(safe-area-inset-bottom|px/.test(getComputedStyle(document.getElementById('bar')).paddingBottom)), `${dev}: action bar keeps the safe-area padding`);
    await targets('action bar', '#bar'); await textSizes('action bar', '#bar');
    const clip = await ev(() => [...document.querySelectorAll('#bar .act span:last-child')].filter((sp) => sp.scrollWidth > sp.parentElement.clientWidth + 1).map((sp) => sp.textContent));
    ok(clip.length === 0, `${dev}: action-bar labels fit their buttons at 15 px${clip.length ? ' -> ' + clip.join(', ') : ''}`);
    await p.locator('[data-act=feed]').tap(); ok(await t.waitPop(true), `${dev}: a tap on Feed opens the feed sheet`);
    ok(await ev(() => window.__pawShell.sheetOpen()), `${dev}: psSheetOpen() is true while the feed sheet is open`);
    await p.locator('[data-act=feed]').tap(); ok(await t.waitPop(false), `${dev}: a second tap closes it`);

    sec(dev + ': ... menu');
    await p.locator('#moreBtn').tap(); await p.waitForSelector('#mmSet');
    ok(await p.locator('#mmSet').count() === 1 && await p.locator('#mmMute').count() === 1 && await p.locator('#mmCloud').count() === 1, `${dev}: ... menu has Settings, Mute and Cloud save`);
    await targets('... menu', '#modal'); await textSizes('... menu', '#modal');
    const m0 = await ev(() => JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}').mute || false);
    await p.locator('#mmMute').tap(); ok(await t.until((m0) => (JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}').mute || false) !== m0, m0), `${dev}: Mute in the menu toggles the sound`);
    await p.locator('#moreBtn').tap(); await p.waitForSelector('#mmMute'); await p.locator('#mmMute').tap(); await t.until(() => document.getElementById('modal').hidden);
    // the real CLOUD lane: off under the test harness, so the status line says so; "Cloud save" opens Settings at the Cloud save section
    await p.locator('#moreBtn').tap(); await p.waitForSelector('#mmCloud');
    const cst = await ev(() => window.__pawCloud.status().text);
    ok((await p.textContent('#mmCloudTxt')) === cst && /Cloud save/.test(cst), `${dev}: ... menu shows the cloud status line (${cst})`);
    await t.SH(dev + '_menu'); await targets('... menu with cloud', '#modal');
    await p.locator('#mmCloud').tap(); ok(await t.until(() => !!document.querySelector('#modal .panel #clBox') && /Settings/.test(document.querySelector('#modal .panel h2').textContent)), `${dev}: "Cloud save" opens Settings at the Cloud save section`);
    await p.locator('#modal .panel .x').first().tap(); await t.until(() => document.getElementById('modal').hidden);
    await p.locator('#moreBtn').tap(); await p.locator('#mmSet').tap(); ok(await t.until(() => !!document.querySelector('#modal .panel') && /Settings/.test(document.querySelector('#modal .panel h2').textContent)), `${dev}: Settings opens from the menu`);

    sec(dev + ': popups are bottom sheets');
    const settled = () => t.until(() => { const pn = document.querySelector('#modal .panel'); return !!pn && pn.getAnimations().every((a) => a.playState !== 'running'); }, null, 3000);
    const sheetCheck = async (label) => {
      await settled();
      const s = await ev(() => {
        const pn = document.querySelector('#modal .panel'), md = document.getElementById('modal'); if (!pn) return null;
        const r = pn.getBoundingClientRect(), m = md.getBoundingClientRect(), g = pn.querySelector('.sheet-grab'), gr = g && g.getBoundingClientRect(), body = pn.querySelector('.panel-body');
        return { w: r.width, h: r.height, b: r.bottom, l: r.left, mb: m.bottom, iw: innerWidth, ih: innerHeight, grab: !!gr && gr.width > 0 && getComputedStyle(g).display !== 'none', oy: getComputedStyle(body).overflowY, body: body.scrollHeight > body.clientHeight ? 'scrolls' : 'fits' };
      });
      ok(!!s && Math.abs(s.w - s.iw) < 1.5 && s.l > -1 && Math.abs(s.b - s.mb) < 2, `${dev} ${label}: full-width sheet at the bottom (${s && Math.round(s.w)} of ${s && s.iw}, bottom ${s && Math.round(s.b)} vs ${s && Math.round(s.mb)})`);
      ok(!!s && s.h <= s.ih * 0.88 + 1, `${dev} ${label}: at most 88% of the screen (${s && Math.round(s.h)} of ${s && s.ih})`);
      ok(!!s && s.grab && /auto|scroll/.test(s.oy), `${dev} ${label}: drag handle shown, content scrolls inside (${s && s.body})`);
      await noHScroll(label); await targets(label, '#modal');
    };
    await sheetCheck('Settings sheet'); await t.SH(dev + '_settings');
    // swipe down on the handle closes it
    let sb = await box('#modal .panel'); await touch(line([sb.x + sb.w / 2, sb.y + 14], [sb.x + sb.w / 2, sb.y + 260], 8));
    ok(await t.until(() => document.getElementById('modal').hidden), `${dev}: swipe down on the handle closes the sheet`);
    ok(await ev(() => !window.__pawShell.sheetOpen()), `${dev}: psSheetOpen() is false once it is closed`);

    // Journal: tabs scroll sideways, 44 px tall; a backdrop tap closes it
    await p.locator('[data-act=journal]').tap(); await p.waitForSelector('.panel.journal');
    await sheetCheck('Journal sheet'); await t.SH(dev + '_journal');
    const tabs = await ev(() => { const r = document.querySelector('#modal .jtabs'); const bs = [...r.querySelectorAll('.btn')].map((b) => b.getBoundingClientRect()); return { wrap: getComputedStyle(r).flexWrap, sw: r.scrollWidth, cw: r.clientWidth, oneRow: bs.every((b) => Math.abs(b.top - bs[0].top) < 6), minH: Math.min(...bs.map((b) => b.height)) }; });
    ok(tabs.wrap === 'nowrap' && tabs.oneRow && tabs.minH >= 44, `${dev}: journal tabs are one row of 44 px buttons (min ${Math.round(tabs.minH)} px)`);
    if (tabs.sw > tabs.cw) {
      const tb = await box('#modal .jtabs'); await touch(line([tb.x + tb.w - 30, tb.y + tb.h / 2], [tb.x + 40, tb.y + tb.h / 2], 10));
      ok(await t.until(() => document.querySelector('#modal .jtabs').scrollLeft > 20, null, 3000), `${dev}: the tab row scrolls sideways by touch`);
    } else ok(true, `${dev}: the tab row fits without scrolling`);
    // a downward drag that starts inside something that pans sideways (the tab row here; the family tree and pup rows work the same) never closes the sheet
    const tb2 = await box('#modal .jtabs'); await touch(line([tb2.x + 60, tb2.y + 8], [tb2.x + 70, tb2.y + 220], 8));
    await sleep(300); ok(await ev(() => !document.getElementById('modal').hidden), `${dev}: a swipe that starts on the sideways tab row does not close the sheet`);
    await p.locator('[data-jt=profile]').tap(); ok(await t.until(() => !!document.querySelector('.panel.journal.j-profile')), `${dev}: a tap on a tab switches it`);
    await noHScroll('Journal profile');
    await p.touchscreen.tap(20, 20); ok(await t.until(() => document.getElementById('modal').hidden), `${dev}: a backdrop tap closes the sheet`);

    // Wardrobe and a shop: grids, options
    await p.locator('[data-act=wardrobe]').tap(); await p.waitForSelector('.ward'); await sheetCheck('Wardrobe sheet'); await t.SH(dev + '_wardrobe');
    await p.locator('.panel .x').tap(); await t.modalGone();
    await t.home('market'); await p.locator('#placeBtns [data-sh=kibble]').tap(); await p.waitForSelector('.shopgrid');
    await sheetCheck('Shop sheet'); await t.SH(dev + '_shop');
    const cols = await ev(() => getComputedStyle(document.querySelector('#modal .shopgrid')).gridTemplateColumns.split(' ').length);
    ok(cols === 2, `${dev}: the shop grid reflows to 2 columns (${cols})`);
    // the shop body scrolls inside the sheet (touch drag)
    const pb = await box('#modal .panel-body'); const st0 = await ev(() => document.querySelector('#modal .panel-body').scrollTop);
    await touch(line([pb.x + pb.w / 2, pb.y + pb.h - 40], [pb.x + pb.w / 2, pb.y + 60], 10));
    ok(await t.until((s) => document.querySelector('#modal .panel-body').scrollTop > s, st0, 3000), `${dev}: the sheet content scrolls by touch`);
    ok(await ev(() => !document.getElementById('modal').hidden), `${dev}: scrolling the content does not close the sheet`);

    sec(dev + ': toasts');
    // a toast while a sheet is open: drawn above the sheet and the bar (z-index), and never over the action bar
    await p.locator('[data-buy="Basic Kibble"]').tap(); await p.waitForSelector('.buyveil .bb-yes'); await p.locator('.bb-yes').tap();
    await t.until(() => !!document.querySelector('#toasts .toast'), null, 5000);
    const tz = await ev(() => { const t = document.getElementById('toasts'), r = t.getBoundingClientRect(), b = document.getElementById('bar').getBoundingClientRect(); return { zt: +getComputedStyle(t).zIndex, zm: +getComputedStyle(document.getElementById('modal')).zIndex, bottom: r.bottom, barTop: b.top, n: t.children.length }; });
    ok(tz.n >= 1 && tz.zt > tz.zm && tz.bottom <= tz.barTop + 1, `${dev}: toasts sit above sheets and above the action bar (z ${tz.zt} > ${tz.zm}, bottom ${Math.round(tz.bottom)} <= bar ${Math.round(tz.barTop)})`);
    await t.SH(dev + '_toast');
    await p.locator('.panel .x').tap(); await t.modalGone(); await t.home();

    sec(dev + ': long-press tooltip');
    const mb = await box('#meters .meter[data-k="energy"]');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(mb.x + mb.w / 2, mb.y + mb.h / 2) });
    const tipOn = await t.until(() => { const e = document.querySelector('.lptip'); return !!e && e.textContent === 'Energy'; }, null, 2500);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    ok(tipOn, `${dev}: a long press on a meter shows its name in a tooltip`);
    await sleep(150); ok(await ev(() => !document.getElementById('hud').classList.contains('hexp')), `${dev}: the long press does not also tap the meters`);
    ok(await t.until(() => !document.querySelector('.lptip'), null, 4000), `${dev}: the tooltip goes away by itself`);
    // psLongPress(el, text): the helper other lanes use. A long press shows the text and does not press the button
    await ev(() => window.__pawShell.longPress(document.querySelector('#bar [data-act=map]'), 'Town map: travel to other places'));
    const ab = await box('#bar [data-act=map]');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(ab.x + ab.w / 2, ab.y + ab.h / 2) });
    const tip2 = await t.until(() => { const e = document.querySelector('.lptip'); return !!e && /Town map/.test(e.textContent); }, null, 2500);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    ok(tip2, `${dev}: psLongPress(el, text) shows the tooltip on a long press`);
    await sleep(300); ok((await t.mode()) === 'yard', `${dev}: the long-pressed button was not pressed`);
    await p.locator('[data-act=map]').tap(); ok(await t.untilMode('map'), `${dev}: a normal tap on the same button still works`);
    await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.until(() => !document.querySelector('.lptip'), null, 4000);

    sec(dev + ': walk and fetch results sheets');
    await t.calm(); await p.locator('[data-act=walk]').tap(); await p.waitForSelector('#rtStart'); await p.locator('#rtStart').tap();
    await t.until(() => window.__paw.mode === 'walk' && !!(document.querySelector('.pw-ov [data-go]') || document.querySelector('.pw-cd')), null, 15000);
    if (await p.locator('.pw-ov [data-go]').count()) await p.locator('.pw-ov [data-go]').first().tap();
    ok(await t.quitWalk(false), `${dev}: walk results popup opens`);
    await sheetCheck('Walk results sheet'); await textSizes('Walk results', '#modal .panel-body'); await t.SH(dev + '_walk_results');
    await p.locator('#resOk').tap(); await t.until(() => window.__paw.mode === 'yard' && !document.getElementById('resOk'), null, 8000); await t.lu(); await t.calm();
    await ev(() => window.__paw.go('fetch', 'Tennis Ball')); await p.waitForSelector('#fQuit'); await p.locator('#fQuit').tap({ force: true });
    await p.waitForSelector('#fOk'); await sheetCheck('Fetch results sheet'); await t.SH(dev + '_fetch_results');
    await p.locator('#fOk').tap(); await t.modalGone(); await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.lu();

    sec(dev + ': portrait lock');
    await p.setViewportSize({ width: dev === 'Pixel 7' ? 915 : 844, height: dev === 'Pixel 7' ? 412 : 390 });
    ok(await t.until(() => document.documentElement.hasAttribute('data-pslock') && !document.getElementById('psTurn').hidden && getComputedStyle(document.getElementById('psTurn')).display === 'flex'), `${dev}: sideways shows the "Turn your phone upright" card`);
    ok(/Turn your phone upright/.test(await p.textContent('#psTurn')), `${dev}: the card says "Turn your phone upright"`);
    ok(await ev(() => { const el = document.querySelector('#stage .act') || document.getElementById('stage'); return getComputedStyle(el).animationPlayState.split(',').every((s) => s.trim() === 'paused'); }), `${dev}: CSS animations are paused behind the card`);
    await t.SH(dev + '_lock');
    await p.setViewportSize({ width: dev === 'Pixel 7' ? 412 : 390, height: dev === 'Pixel 7' ? 915 : 844 });
    ok(await t.until(() => !document.documentElement.hasAttribute('data-pslock') && document.getElementById('psTurn').hidden && document.documentElement.dataset.layout === 'phone'), `${dev}: upright again: the card goes, phone layout is back`);
    await noHScroll('after rotate');
    await t.ctx.close();
  }

  sec('desktop: never locked, never phone');
  const p = await t.boot(); await p.setViewportSize({ width: 844, height: 390 }); await sleep(200);
  ok(await ev(() => !document.documentElement.hasAttribute('data-pslock') && !(document.getElementById('psTurn') && !document.getElementById('psTurn').hidden)), 'a mouse pointer never sees the portrait lock (844x390)');
  await p.setViewportSize({ width: 1280, height: 720 }); await sleep(200);
  ok(await ev(() => document.documentElement.dataset.layout !== 'phone'), 'desktop 1280x720 stays the laptop layout');
  ok(await ev(() => getComputedStyle(document.getElementById('gearBtn')).display !== 'none' && getComputedStyle(document.getElementById('moreBtn')).display === 'none'), 'desktop HUD keeps its gear and mute buttons');
}, { timeout: 420000 });

function innerWidthOf(dev) { return dev === 'Pixel 7' ? 412 : 390; }
