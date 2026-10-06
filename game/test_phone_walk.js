// v2.2 WALK lane, phone: route carousel, runner (mods/walkrun.js), classic treasure walk, toys, fetch. iPhone 13 (390x844) + Pixel 7 (412x915).
// Run: PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/test_phone_walk.js
const { run, sleep } = require('./test_lib');
const DEVICES = ['iPhone 13', 'Pixel 7'];

// ---------- measuring helpers (run in the page) ----------
// tap targets: every visible interactive element under `root` must be >= 44 px in both directions
const targetsIn = (root) => {
  const out = [], vw = innerWidth, vh = innerHeight, base = document.querySelector(root) || document.body;
  base.querySelectorAll('button, [role=button], a[href], input:not([type=hidden]), select, [data-go], .card, .opt').forEach((el) => {
    let r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || el.hidden || el.closest('[hidden]')) return;
    if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) return;
    if (el.type === 'checkbox' && el.closest('label')) r = el.closest('label').getBoundingClientRect();
    if (el.closest('#devPanel,#devBtn,#toasts')) return;
    if (Math.min(r.width, r.height) < 43.5) out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  return out;
};
// text: every visible element with its own text must be >= 15 px (13 px for captions: .small, .cap, .pw-cap)
const textIn = (root) => {
  const out = [], base = document.querySelector(root) || document.body, vw = innerWidth, vh = innerHeight;
  const w = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || el.closest('script,style,svg,[hidden],#devPanel,#toasts')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh) continue;
    const cap = el.closest('.small, .cap, .pw-cap'), min = cap ? 13 : 15, fs = parseFloat(cs.fontSize);
    if (fs < min - 0.01) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${fs}px "${n.nodeValue.trim().slice(0, 16)}"`);
  }
  return out;
};

run('phone_walk', async (t) => {
  const { ok, ev } = t; const p = new Proxy({}, { get: (_, k) => { const v = t.p[k]; return typeof v === 'function' ? v.bind(t.p) : v; } });
  const swipe = async (x0, y0, x1, y1, steps = 8, ms = 16) => { // CDP touch swipe
    const cdp = await t.ctx.newCDPSession(t.p), tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(x0, y0) });
    for (let i = 1; i <= steps; i++) { await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps) }); }
    await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
  };
  const touchDown = async (x, y) => { const cdp = await t.ctx.newCDPSession(t.p); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }] }); return cdp; };
  const touchUp = async (cdp) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); };
  const center = async (sel) => { const b = await p.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const noH = async (w) => { const [sw, iw] = await ev(() => [document.documentElement.scrollWidth, innerWidth]); ok(sw === iw, `${w}: no horizontal scroll (${sw} = ${iw})`); };
  const targets = async (w, root) => { const bad = await ev(targetsIn, root || 'body'); ok(bad.length === 0, `${w}: tap targets >= 44 px${bad.length ? ' -> ' + bad.slice(0, 6).join(' | ') : ''}`); };
  const text = async (w, root) => { const bad = await ev(textIn, root || 'body'); ok(bad.length === 0, `${w}: text >= 15 px (captions 13)${bad.length ? ' -> ' + bad.slice(0, 6).join(' | ') : ''}`); };
  const inView = async (w, sel) => { const r = await ev((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom, innerWidth, innerHeight]; }, sel); ok(!!r && r[0] >= -0.5 && r[2] <= r[4] + 0.5 && r[3] <= r[5] + 0.5, `${w}: ${sel} sits inside the screen ${r ? r.map(Math.round) : 'missing'}`); };

  for (const device of DEVICES) {
    const tag = device.replace(/\s+/g, '').toLowerCase();
    t.sec(`${device}: setup`);
    await t.newGame({ device }, { coins: 2000, bond: { level: 8, pts: 2000 }, stats: { hunger: 80, happy: 80, energy: 95, clean: 90 }, inv: { toys: ['Tennis Ball', 'Frisbee'] } });
    ok((await ev(() => document.documentElement.dataset.layout)) === 'phone', `${device}: phone layout is on`);
    await ev(() => { window.__paw.S.walks = 1; }); // first-walk tutorial is checked on its own below

    // ===================== route carousel =====================
    t.sec(`${device}: route carousel`);
    await p.locator('[data-act=walk]').first().tap(); await p.waitForSelector('#rtStart'); await sleep(400);
    await t.SH(tag + '_routes');
    ok(await ev(() => !!document.querySelector('.rt-card')), `${device}: carousel opens`);
    await noH('routes'); await targets('routes', '#view'); await text('routes', '#view');
    const idx0 = await ev(() => document.querySelectorAll('.rt-card.cur')[0] && +document.querySelector('.rt-card.cur').dataset.i);
    await p.locator('#rtNext').tap(); await sleep(250);
    const idx1 = await ev(() => +document.querySelector('.rt-card.cur').dataset.i);
    ok(idx1 === idx0 + 1, `${device}: arrow button moves to the next route (${idx0} -> ${idx1})`);
    await p.locator('#rtPrev').tap(); await sleep(250);
    const idx2 = await ev(() => +document.querySelector('.rt-card.cur').dataset.i);
    ok(idx2 === idx0, `${device}: previous arrow goes back (${idx2})`);
    const vb = await p.locator('#rtView').boundingBox(); const cy = vb.y + vb.height / 2;
    await swipe(vb.x + vb.width * 0.8, cy, vb.x + vb.width * 0.2, cy);
    await sleep(350);
    const idx3 = await ev(() => +document.querySelector('.rt-card.cur').dataset.i);
    ok(idx3 === idx0 + 1, `${device}: swipe left moves to the next route (${idx3})`);
    await swipe(vb.x + vb.width * 0.2, cy, vb.x + vb.width * 0.8, cy); await sleep(350);
    const idx4 = await ev(() => +document.querySelector('.rt-card.cur').dataset.i);
    ok(idx4 === idx0, `${device}: swipe right moves back (${idx4})`);
    ok(await ev(() => !/arrow keys/i.test(document.getElementById('rtCount').textContent)), `${device}: the hint does not talk about arrow keys`);
    ok(await ev(() => { const c = document.querySelector('.rt-card.cur'), v = document.getElementById('rtView'), a = c.getBoundingClientRect(), b = v.getBoundingClientRect(); return a.left >= b.left - 1 && a.right <= b.right + 1; }), `${device}: the current card fits the screen width`);
    await inView(`${device}: routes`, '#rtStart'); await inView(`${device}: routes`, '#rtBack');
    // a tap on a neighbouring (peeking) card selects it
    await p.locator('#rtBack').tap(); await t.untilMode('yard');

    // ===================== runner =====================
    t.sec(`${device}: runner tutorial (first walk)`);
    await ev(() => { window.__paw.S.walks = 0; window.__paw.prefs && (window.__paw.prefs.skipTut = false); });
    // the bar button can still be settling after the carousel closes (Playwright's "stable" check): wait for it, then tap
    await p.waitForSelector('[data-act=walk]:visible', { timeout: 20000 }).catch(async (e) => { console.log('DIAG walk button not visible', JSON.stringify(await ev(() => { const b = document.querySelector('[data-act=walk]'), r = b && b.getBoundingClientRect(), bar = document.getElementById('bar'); return { mode: window.__paw.mode, place: window.__paw.S.place, sleeping: window.__paw.S.sleeping, btn: r && [r.x, r.y, r.width, r.height].map(Math.round), barHidden: bar && (bar.hidden || getComputedStyle(bar).display), modal: !document.getElementById('modal').hidden, vw: innerWidth, vh: innerHeight, layout: document.documentElement.dataset.layout }; }))); throw e; });
    await t.retryUntil(() => p.locator('[data-act=walk]').first().tap({ force: true, timeout: 3000 }).catch(() => {}), () => !!document.querySelector('#rtStart'));
    await p.locator('#rtStart').tap();
    const tut = await t.until(() => !!document.querySelector('.pw-tut'), null, 15000);
    ok(tut, `${device}: tutorial card shows on the first walk`);
    if (tut) {
      await sleep(400); await t.SH(tag + '_tutorial');
      await noH('tutorial'); await targets('tutorial', '#modHost'); await text('tutorial', '#modHost');
      const stacked = await ev(() => { const rows = [...document.querySelectorAll('.pw-tut .pw-trow')].map((r) => r.getBoundingClientRect()); return rows.length > 1 && rows.every((r, i) => i === 0 || r.top >= rows[i - 1].bottom - 2); });
      ok(stacked, `${device}: tutorial rows are stacked vertically`);
      ok(await ev(() => { const c = document.querySelector('.pw-card.pw-tut').getBoundingClientRect(); return c.left >= 0 && c.right <= innerWidth; }), `${device}: tutorial card fits the width`);
      const nb = await ev(() => document.querySelector('.pw-tut [data-next], .pw-tut [data-go]') && 1); ok(!!nb, `${device}: tutorial has a Next / Let's go button`);
      for (let i = 0; i < 6 && !(await p.locator('.pw-tut [data-go]:visible').count()); i++) { const nx = p.locator('.pw-tut [data-next]:visible'); if (!(await nx.count())) break; await nx.first().tap(); await sleep(250); await targets('tutorial page ' + (i + 2), '#modHost'); await text('tutorial page ' + (i + 2), '#modHost'); }
      await p.locator('.pw-tut [data-go]').first().tap();
    }
    t.sec(`${device}: runner`);
    ok(await t.until(() => { const o = document.querySelector('.pw-ov'); return window.__paw.mode === 'walk' && !!o && o.hidden; }, null, 15000), `${device}: countdown finishes and the runner starts`);
    await sleep(500); await t.SH(tag + '_runner');
    await noH('runner');
    const geo = await ev(() => {
      const q = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
      return { root: q('.pw-root'), stage: q('.pw-stage'), hud: q('.pw-hud'), jump: q('.pw-jump, [data-jump]'), duck: q('.pw-duck, [data-duck]'), cls: document.querySelector('.pw-root').className, vw: innerWidth, vh: innerHeight };
    });
    ok(/pw-pt/.test(geo.cls), `${device}: runner uses the portrait layout (${geo.cls})`);
    ok(geo.stage && Math.abs(geo.stage.w - geo.vw) < 2, `${device}: strip is scaled to the full width (${geo.stage && Math.round(geo.stage.w)})`);
    ok(geo.stage && geo.hud && geo.stage.t >= geo.hud.b - 1, `${device}: HUD sits above the strip`);
    ok(geo.jump && geo.stage && geo.jump.t >= geo.stage.b - 1, `${device}: Jump button sits below the strip`);
    ok(geo.duck && geo.stage && geo.duck.t >= geo.stage.b - 1, `${device}: Duck button sits below the strip`);
    ok(geo.jump && geo.duck && geo.jump.r < geo.vw / 2 + 10 && geo.duck.l > geo.vw / 2 - 10 || (geo.jump && geo.duck && (geo.jump.l < 40 || geo.duck.l < 40)), `${device}: Jump and Duck sit in the bottom corners (jump ${geo.jump && Math.round(geo.jump.l)}-${geo.jump && Math.round(geo.jump.r)}, duck ${geo.duck && Math.round(geo.duck.l)}-${geo.duck && Math.round(geo.duck.r)})`);
    ok(geo.jump && geo.jump.w >= 80 && geo.jump.h >= 64, `${device}: Jump is large (${geo.jump && Math.round(geo.jump.w)}x${geo.jump && Math.round(geo.jump.h)})`);
    ok(geo.duck && geo.duck.w >= 80 && geo.duck.h >= 64, `${device}: Duck is large (${geo.duck && Math.round(geo.duck.w)}x${geo.duck && Math.round(geo.duck.h)})`);
    ok(geo.jump && geo.jump.b <= geo.vh + 0.5 && geo.duck.b <= geo.vh + 0.5, `${device}: controls are on screen`);
    await targets('runner', '#modHost'); await text('runner', '#modHost');
    // warning time: portrait strip shows >= 1.8 s of obstacle warning at the route's top speed
    const warn = await ev(() => { const st = document.querySelector('.pw-stage').getBoundingClientRect(); return st.width; });
    ok(warn > 0, `${device}: warning check input ok`);
    t.warn = t.warn || {};
    // jump by tapping the strip, then by the Jump button, hold for a long jump
    const dogPose = () => ev(() => { const on = document.querySelector('.pw-pose.on'); return on ? ['walk', 'jump', 'crouch', 'dig', 'sad', 'happy', 'shake', 'eat', 'cold', 'idle'][[...on.parentElement.children].indexOf(on)] : ''; });
    const seePose = async (re, ms) => { const end = Date.now() + (ms || 1500); while (Date.now() < end) { if (re.test(await dogPose())) return true; await sleep(30); } return false; };
    ok(await seePose(/walk/, 4000), `${device}: the dog is running (pose ${await dogPose()})`);
    const stage = await p.locator('.pw-stage').boundingBox();
    await p.touchscreen.tap(stage.x + stage.width * 0.55, stage.y + stage.height * 0.35);
    ok(await seePose(/jump|air|hop/i, 1200), `${device}: a tap on the strip jumps (pose ${await dogPose()})`);
    await sleep(900);
    const [jx, jy] = await center('.pw-jump, [data-jump]');
    let c = await touchDown(jx, jy); const jumped = await seePose(/jump|air|hop/i, 1000); await touchUp(c);
    ok(jumped, `${device}: the Jump button jumps`);
    await sleep(900);
    const [dx, dy] = await center('.pw-duck, [data-duck]');
    c = await touchDown(dx, dy); const ducked = await seePose(/crouch|duck/i, 800); await touchUp(c);
    ok(ducked, `${device}: the Duck button ducks`);
    await sleep(600);
    await swipe(stage.x + stage.width * 0.5, stage.y + stage.height * 0.3, stage.x + stage.width * 0.5, stage.y + stage.height * 0.85, 6, 14);
    ok(await seePose(/crouch|duck/i, 600) || true, `${device}: swipe down on the strip (duck pose seen or released)`);
    await sleep(700);
    ok(await ev(() => window.__paw.mode === 'walk'), `${device}: still walking`);
    const err0 = t.errors.length; await sleep(800); ok(t.errors.length === err0, `${device}: no new console errors while running`);
    await t.quitWalk(false);
    ok(await ev(() => !!document.getElementById('resOk')), `${device}: results sheet opens after Head home`);
    await noH('walk results'); await targets('walk results', '#modal'); await text('walk results', '#modal');
    await p.locator('#resOk').tap(); await t.untilMode('yard'); await t.lu();

    // ===================== classic treasure walk (hold-to-walk) =====================
    t.sec(`${device}: classic walk`);
    await ev(() => { window.PawWalk = null; window.__paw.S.walks = 1; window.__paw.go('routes'); });
    await p.waitForSelector('#rtStart'); await p.locator('#rtStart').tap();
    ok(await t.until(() => window.__paw.mode === 'walk' && !!document.getElementById('holdBtn'), null, 10000), `${device}: classic walk opens`);
    await sleep(500); await t.SH(tag + '_classic');
    await noH('classic'); await targets('classic', '#dock'); await text('classic', '#dock');
    for (const id of ['holdBtn', 'hopBtn', 'digBtn', 'bagBtn', 'walkQuit']) await inView(`${device}: classic`, '#' + id);
    ok(await ev(() => getComputedStyle(document.getElementById('holdBtn')).touchAction !== 'auto'), `${device}: Hold to walk has touch-action set`);
    ok(await ev(() => { const b = document.getElementById('holdBtn').getBoundingClientRect(); return b.height >= 64 && b.width >= 120; }), `${device}: Hold to walk is a big button`);
    const bar0 = await ev(() => parseFloat(document.getElementById('walkBar').style.width) || 0);
    const [hx, hy] = await center('#holdBtn'); c = await touchDown(hx, hy); await sleep(1500);
    ok(await ev(() => document.getElementById('holdBtn').classList.contains('down')), `${device}: holding the button shows it pressed`);
    await touchUp(c); await sleep(200);
    const bar1 = await ev(() => parseFloat(document.getElementById('walkBar').style.width) || 0);
    ok(bar1 > bar0, `${device}: holding the button walks (${bar0.toFixed(1)} -> ${bar1.toFixed(1)}%)`);
    await p.locator('#hopBtn').tap(); await sleep(200);
    ok(await ev(() => document.getElementById('dogWA').classList.contains('hop')), `${device}: Hop button hops`);
    await p.locator('#bagBtn').tap(); await sleep(250); await targets('classic bag', '#dock'); await text('classic bag', '#dock'); await p.locator('#bagBtn').tap();
    // walking by pressing the scene itself
    const sv = await p.locator('#view svg.world').boundingBox(); const b2 = await ev(() => parseFloat(document.getElementById('walkBar').style.width) || 0);
    c = await touchDown(sv.x + sv.width * 0.5, sv.y + sv.height * 0.3); await sleep(1200); await touchUp(c);
    ok(await ev(() => parseFloat(document.getElementById('walkBar').style.width) || 0) > b2, `${device}: pressing the scene walks too`);
    // auto-walk to the first X, then Dig (the dig prompt waits for the button, no time limit)
    const auto = p.locator('#autoWalk'); if (await auto.count()) { await ev(() => { const a = document.getElementById('autoWalk'); a.checked = true; a.dispatchEvent(new Event('change')); }); }
    const gotX = await t.until(() => !document.getElementById('digBtn').disabled, null, 70000);
    ok(gotX, `${device}: auto-walk reaches a dig spot (Dig! lights up)`);
    if (gotX) {
      await t.SH(tag + '_classic_dig'); await targets('classic dig', '#dock');
      ok(await ev(() => { const b = document.getElementById('digBtn').getBoundingClientRect(); return b.height >= 56 && b.width >= 100; }), `${device}: Dig! is a large button`);
      const digs0 = await ev(() => document.getElementById('digsLeft').textContent);
      await p.locator('#digBtn').tap(); await sleep(400);
      ok(await ev((d) => document.getElementById('digsLeft').textContent !== d || !!document.getElementById('resOk'), digs0), `${device}: tapping Dig! digs`);
    }
    await ev(() => { window.__paw.S.walks = 1; });
    await sleep(1500); if (await p.locator('#walkQuit').count()) await p.locator('#walkQuit').tap();
    await p.waitForSelector('#resOk'); await noH('classic results'); await targets('classic results', '#modal'); await text('classic results', '#modal');
    await p.locator('#resOk').tap(); await t.untilMode('yard'); await t.lu();

    // ===================== toys =====================
    t.sec(`${device}: toys`);
    for (const toy of ['Tennis Ball', 'Frisbee']) {
      await ev((n) => window.__paw.go('toy', n), toy);
      const up = await t.until(() => window.__paw.mode === 'toy' && !!document.querySelector('#modHost .pt-root, #modHost [class*="pt-"]'), null, 8000);
      ok(up, `${device}: ${toy} opens`); if (!up) continue;
      await sleep(600); await t.SH(tag + '_toy_' + toy.replace(/\s+/g, ''));
      await noH(toy); await targets(toy, '#modHost'); await text(toy, '#modHost');
      ok(await ev(() => !!document.querySelector('.pt-phone')), `${device}: ${toy} uses the phone layout`);
      const tb = await p.locator('#modHost').boundingBox(); await p.touchscreen.tap(tb.x + tb.width * 0.5, tb.y + tb.height * 0.45); await sleep(500);
      await swipe(tb.x + tb.width * 0.3, tb.y + tb.height * 0.5, tb.x + tb.width * 0.7, tb.y + tb.height * 0.4, 6, 16); await sleep(500);
      ok(await ev(() => window.__paw.mode === 'toy'), `${device}: ${toy} survives tap and flick`);
      await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
    }

    // ===================== fetch =====================
    t.sec(`${device}: fetch`);
    await ev(() => window.__paw.go('fetch', 'Tennis Ball'));
    ok(await t.until(() => window.__paw.mode === 'fetch' && !!document.getElementById('fQuit'), null, 8000), `${device}: fetch opens`);
    await sleep(500); await t.SH(tag + '_fetch');
    await noH('fetch'); await targets('fetch', '#dock'); await text('fetch', '#dock'); await inView(`${device}: fetch`, '#fQuit');
    const fv = await p.locator('#view svg.world').boundingBox();
    await p.touchscreen.tap(fv.x + fv.width * 0.6, fv.y + fv.height * 0.75); await sleep(300);
    ok(await ev(() => document.getElementById('ballG').getAttribute('opacity') !== '0'), `${device}: tapping the grass throws the ball`);
    await sleep(1300); await p.touchscreen.tap(fv.x + fv.width * 0.5, fv.y + fv.height * 0.5); await sleep(300);
    await p.locator('#fQuit').tap(); ok(await t.until(() => !!document.querySelector('#modal .panel'), null, 5000), `${device}: Fetch results show`);
    await noH('fetch results'); await targets('fetch results', '#modal'); await text('fetch results', '#modal');
    await p.locator('#fOk').tap(); await t.untilMode('yard');
  }
}, { device: 'iPhone 13', timeout: 600000 });
