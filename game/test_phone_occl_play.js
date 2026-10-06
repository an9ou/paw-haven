// v2.3 PHONE PLAY lane: occlusion. At 390x844 and 360x740 (touch, phone layout) nothing the game draws on top (dock, sheets, HUD, toasts, action bar,
// place buttons, runner HUD and controls, countdown) may cover the dog's box or the screen's main interactive props.
// Run: PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/test_phone_occl_play.js
const { run, sleep } = require('./test_lib');
const SIZES = [[390, 844], [360, 740]];

// ---------- in-page helpers ----------
// what counts as "on top of the scene"
const COVER = '#bar,#dock,#hud,#toasts .toast,#modal:not([hidden]) .panel,#trainPanel:not([hidden]),#psTurn,#mapGo:not([hidden]),#mapZoom,#mapX,#placeBtns .btn,#status:not(:empty),.pw-hud,.pw-ctrls,.pw-legend,.pw-card';
const PTS = [[0.5, 0.5], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.7]];
// every visible element matching `sel`: the points of its box must hit the element (or the scene), not something from COVER
const covered = (sel, cover, pts) => {
  const out = [], vw = innerWidth, vh = innerHeight;
  const els = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden]'); });
  if (!els.length) return ['missing: ' + sel];
  els.slice(0, 6).forEach((e, n) => {
    const r = e.getBoundingClientRect(), x0 = Math.max(r.left, 0), x1 = Math.min(r.right, vw), y0 = Math.max(r.top, 0), y1 = Math.min(r.bottom, vh);
    if (x1 - x0 < 4 || y1 - y0 < 4) { out.push(`${sel}[${n}] is off screen ${[r.left, r.top, r.right, r.bottom].map(Math.round)}`); return; }
    pts.forEach(([fx, fy]) => {
      const x = x0 + (x1 - x0) * fx, y = y0 + (y1 - y0) * fy, h = document.elementFromPoint(x, y);
      if (h && !e.contains(h)) { const c = h.closest(cover); if (c) out.push(`${sel}[${n}] @${Math.round(x)},${Math.round(y)} is under ${c.id ? '#' + c.id : c.tagName.toLowerCase()}.${String(c.className).split(' ')[0]}`); }
    });
  });
  return out;
};
// rect overlap between a target and other visible elements (for covers that let clicks through: countdown text, bubbles)
const overlaps = (aSel, bSels, shrink) => {
  const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0 && !e.closest('[hidden]'); };
  const a = [...document.querySelectorAll(aSel)].filter(vis)[0]; if (!a) return ['missing: ' + aSel];
  let r = a.getBoundingClientRect(); const dx = r.width * (shrink || 0), dy = r.height * (shrink || 0); r = { left: r.left + dx, right: r.right - dx, top: r.top + dy, bottom: r.bottom - dy };
  const out = [];
  bSels.forEach((s) => document.querySelectorAll(s).forEach((b) => { if (!vis(b) || a.contains(b) || b.contains(a)) return; const q = b.getBoundingClientRect(); if (q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) out.push(`${aSel} overlaps ${s} (${[q.left, q.top, q.right, q.bottom].map(Math.round)} vs ${[r.left, r.top, r.right, r.bottom].map(Math.round)})`); }));
  return out;
};

// the baked-in Market Street sign (svg text + its outline): visible, on screen, and not under anything from COVER
const signOverlaps = (cover) => {
  const tx = [...document.querySelectorAll('svg.world text')].find((x) => x.textContent === 'Market Street'); if (!tx) return ['sign text is missing'];
  if (getComputedStyle(tx).display === 'none') return ['sign is hidden'];
  const r = tx.getBoundingClientRect(), out = [];
  if (r.width < 20 || r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight) out.push('sign is off screen ' + [r.left, r.top, r.right, r.bottom].map(Math.round));
  document.querySelectorAll(cover).forEach((c) => { const q = c.getBoundingClientRect(), cs = getComputedStyle(c); if (q.width < 2 || cs.visibility === 'hidden' || cs.display === 'none') return; if (q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) out.push(`sign under ${c.id ? '#' + c.id : c.tagName.toLowerCase()}.${String(c.className).split(' ')[0]}`); });
  return out;
};

// wait for the picture to hold still: fonts ready, finite CSS animations done, and the key boxes + the scene's viewBox unchanged for 6 frames in a row (no fixed sleeps)
const settleFn = async (extra) => {
  await document.fonts.ready;
  const SEL = ['#view svg.world', '#dogHit', '#dogWA', '#placeBtns', '#bar', '#hud', '#modal .panel', '#mapInner', '#dock', '#trainPanel', '#mapPin', '.pw-stage', '.pw-dog', '.pw-ctrls'].concat(extra || []);
  const snap = () => { const sv = document.querySelector('#view svg.world'); return JSON.stringify(SEL.map((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map((x) => Math.round(x * 2)); })) + (sv ? sv.getAttribute('viewBox') : '') + document.getAnimations().filter((a) => { const c = a.effect && a.effect.getComputedTiming(); return a.playState === 'running' && c && c.iterations !== Infinity && c.endTime > 0; }).length; };
  let prev = '', same = 0; const t0 = performance.now();
  while (same < 6 && performance.now() - t0 < 8000) { await new Promise((r) => requestAnimationFrame(r)); const s = snap(); same = s === prev ? same + 1 : 0; prev = s; }
};

run('phone_occl_play', async (t) => {
  const { ok, ev } = t;
  const settle = (extra) => ev(`(${settleFn})(${JSON.stringify(extra || [])})`);
  const vp = async (w, h) => { await t.p.setViewportSize({ width: w, height: h }); await t.until((w) => innerWidth === w, w, 5000); await settle(); };
  const p = new Proxy({}, { get: (_, k) => { const v = t.p[k]; return typeof v === 'function' ? v.bind(t.p) : v; } });
  const check = async (label, sel, cover, pts) => { const bad = await ev(`(${covered})(...${JSON.stringify([sel, cover || COVER, pts || PTS])})`); ok(bad.length === 0, `${label}: ${sel} is not covered${bad.length ? ' -> ' + bad.slice(0, 4).join(' | ') : ''}`); };
  const clear = async (label, aSel, bSels, shrink) => { const bad = await ev(`(${overlaps})(...${JSON.stringify([aSel, bSels, shrink || 0])})`); ok(bad.length === 0, `${label}: ${aSel} is clear of ${bSels.join(', ')}${bad.length ? ' -> ' + bad.slice(0, 3).join(' | ') : ''}`); };
  const toast = () => ev(() => { const h = document.getElementById('toasts'); if (!h) return; const d = document.createElement('div'); d.className = 'toast good'; d.id = 'occlToast'; d.textContent = 'Surprise treasure on the path: a very long toast to test where toasts sit.'; h.appendChild(d); });
  const unToast = () => ev(() => { const d = document.getElementById('occlToast'); if (d) d.remove(); });
  const at = async (place) => { await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.getElementById('placeBtns'), place, 8000); await t.calm(); await t.lu(); await settle(); };

  // checks written by the other v2.3 review areas live in game/occl_play_<area>.js (so parallel work never edits the same lines):
  //   module.exports = { phone: async (H, w, h, tag) => {}  // runs at every phone size, starts on the yard
  //                      once:  async (H) => {}             // runs once after the portrait-lock section, phone context, 390x844
  //                      desk:  async (H) => {} }           // runs once in a desktop 1280x720 context (non-phone)
  // H = { t, ok, ev, p, check, clear, settle, vp, toast, unToast, at, covered, overlaps, COVER, PTS }
  const H = { t, ok, ev, p, check, clear, settle, vp, toast, unToast, at, covered, overlaps, COVER, PTS };
  const EXTRA = require('fs').readdirSync(__dirname).filter((f) => /^occl_play_.*\.js$/.test(f)).sort().map((f) => require('./' + f));

  t.sec('setup');
  await t.newGame({ device: 'iPhone 13' }, { coins: 3000, bond: { level: 10, pts: 5000 }, stats: { hunger: 80, happy: 80, energy: 95, clean: 90 }, inv: { toys: ['Tennis Ball', 'Frisbee'] } });
  ok((await ev(() => document.documentElement.dataset.layout)) === 'phone', 'phone layout is on');
  await ev(() => { window.__PW = window.PawWalk; const d = window.__paw.S.dog; ['Sit', 'Paw', 'Lie Down'].forEach((n) => { d.tricks[n] = { p: 0.1, shows: 0 }; }); window.__paw.S.walks = 1; });

  for (const [w, h] of SIZES) {
    const tag = `${w}x${h}`;
    await vp(w, h);
    ok((await ev(() => document.documentElement.dataset.layout)) === 'phone', `${tag}: still the phone layout`);

    // ===================== Market Street =====================
    t.sec(`${tag}: Market Street`);
    await at('market'); await t.SH(tag + '_market');
    await check(`${tag} market`, '#dogHit', COVER);
    await check(`${tag} market`, '#placeBtns [data-sh]:nth-child(-n+2)', '#bar,#hud,#toasts .toast,#modal:not([hidden]) .panel', [[0.5, 0.5]]);
    await clear(`${tag} market`, '#dogHit', ['#placeBtns .btn'], 0.15);
    // the street sign is a protected prop: it stays drawn, and nothing (place buttons, bar, HUD, toasts, status chip) sits on it
    const signBad = await ev(`(${signOverlaps})(${JSON.stringify(COVER)})`);
    ok(signBad.length === 0, `${tag} market: the "Market Street" sign is drawn and nothing covers it${signBad.length ? ' -> ' + signBad.slice(0, 3).join(' | ') : ''}`);
    // the place buttons are one row under the scene: scrollable with a visible peek, every shop reachable, clear of the sign, the dog and the bar
    const rowInfo = await ev(() => { const r = document.getElementById('placeBtns'), b = [...r.querySelectorAll('.btn')], rr = r.getBoundingClientRect(), sv = document.querySelector('#view svg.world').getBoundingClientRect(); return { scrolls: r.scrollWidth > r.clientWidth + 4, oneRow: new Set(b.map((x) => Math.round(x.getBoundingClientRect().top))).size === 1, mask: (getComputedStyle(r).webkitMaskImage || getComputedStyle(r).maskImage) !== 'none', h: Math.min(...b.map((x) => x.getBoundingClientRect().height)), under: rr.top >= sv.bottom - 1, peek: b.some((x) => { const q = x.getBoundingClientRect(); return q.left < rr.right && q.right > rr.right - 1; }) || r.scrollWidth <= r.clientWidth }; });
    ok(rowInfo.oneRow && rowInfo.under, `${tag} market: the place buttons are one row under the scene`);
    ok(rowInfo.h >= 44, `${tag} market: place buttons are >= 44 px tall (${Math.round(rowInfo.h)})`);
    ok(!rowInfo.scrolls || (rowInfo.mask && rowInfo.peek), `${tag} market: a row that scrolls has faded edges and a peeking next button`);
    await ev(() => { const r = document.getElementById('placeBtns'); r.scrollLeft = r.scrollWidth; }); await t.until(() => { const r = document.getElementById('placeBtns'); return r.scrollLeft >= r.scrollWidth - r.clientWidth - 1; }, null, 3000);
    await check(`${tag} market (scrolled to the end)`, '#placeBtns [data-pb="yard"]', '#bar,#hud,#toasts .toast', [[0.5, 0.5]]);
    await ev(() => { document.getElementById('placeBtns').scrollLeft = 0; });
    await toast(); await check(`${tag} market + toast`, '#dogHit', COVER); await check(`${tag} market + toast`, '#placeBtns [data-sh]:nth-child(-n+2)', '#toasts .toast,#bar', [[0.5, 0.5]]); await unToast();

    // ===================== each shop =====================
    for (const k of ['kibble', 'boutique', 'builder', 'sprout']) {
      t.sec(`${tag}: shop ${k}`);
      await at('market'); await p.locator(`#placeBtns [data-sh=${k}]`).first().tap();
      ok(await t.until(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), null, 6000), `${tag} shop ${k}: opens`); await settle(['#modal .panel .sitem']); await t.SH(`${tag}_shop_${k}`);
      // the sheet's own controls (close, tabs, first cards, footer buttons) are reachable: nothing from the bar, HUD or toasts sits on them
      await check(`${tag} shop ${k}`, '#modal .panel .x', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5]]);
      await check(`${tag} shop ${k}`, '#modal .panel .sitem:nth-child(-n+2)', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.3]]);
      const sheet = await ev(() => { const r = document.querySelector('#modal .panel').getBoundingClientRect(), b = document.getElementById('bar'), br = b && b.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, barTop: br ? br.top : innerHeight, vh: innerHeight }; });
      ok(sheet.bottom <= sheet.vh + 1 && sheet.top >= 0, `${tag} shop ${k}: the sheet fits the screen (${Math.round(sheet.top)}-${Math.round(sheet.bottom)} of ${sheet.vh})`);
      await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); }); await t.modalGone();
    }

    // ===================== town map =====================
    t.sec(`${tag}: town map`);
    await at('market'); await p.locator('[data-act=map]').first().tap(); ok(await t.until(() => window.__paw.mode === 'map', null, 6000), `${tag} map: opens`); await t.until(() => { const p = document.getElementById('mapPin'); return !!p && !p.hidden; }, null, 5000); await settle(); await t.SH(tag + '_map');
    await check(`${tag} map`, '#mapPin span', '#mapZoom,#mapX,#mapGo:not([hidden]),#status,#hud,#bar,#toasts .toast', [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5]]);
    await clear(`${tag} map`, '#mapPin', ['#bubble', '#mapTip', '#mapGo', '#mapZoom', '#mapX', '#status:not(:empty)'], 0);
    // the pin and its label stand beside the place: they never sit on the place's own art or on any place name
    const pinBad = await ev(() => { const pin = document.querySelector('#mapPin'), r = pin.getBoundingClientRect(), out = []; const hit = (q) => q.width > 1 && q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top;
      document.querySelectorAll('#mapPan svg.world text').forEach((x) => { const q = x.getBoundingClientRect(); if (q.right > 0 && q.left < innerWidth && q.bottom > 0 && q.top < innerHeight && hit(q)) out.push('pin over the name "' + x.textContent.trim().slice(0, 24) + '"'); });
      document.querySelectorAll('#mapPan [data-area]').forEach((g) => { if (g.getAttribute('data-area') === 'market') return; const q = g.getBoundingClientRect(); if (q.width > 1 && q.right > 0 && q.left < innerWidth && q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top + 4) out.push('pin over ' + g.getAttribute('data-area')); });
      const m = document.querySelector('#mapPan [data-area=market]'); if (m) { const q = m.getBoundingClientRect(), core = { left: q.left + q.width * 0.12, right: q.right - q.width * 0.12, top: q.top, bottom: q.top + q.height * 0.55, width: q.width }; if (core.left < r.right && core.right > r.left && core.top < r.bottom && core.bottom > r.top) out.push('pin over the Market Street art'); } return out; });
    ok(pinBad.length === 0, `${tag} map: the "you are here" pin covers no place name or art${pinBad.length ? ' -> ' + pinBad.slice(0, 3).join(' | ') : ''}`);
    await check(`${tag} map`, '[data-area=market]', '#mapZoom,#mapX,#hud,#bar', [[0.5, 0.5]]);
    await p.locator('[data-area=market]').first().tap({ force: true }); await t.until(() => !!document.querySelector('#mapGo:not([hidden])'), null, 3000);
    await check(`${tag} map chip`, '#mapGo:not([hidden]) button', '#bar,#hud,#toasts .toast', [[0.5, 0.5]]);
    await clear(`${tag} map chip`, '#mapPin', ['#mapGo'], 0);
    await p.locator('#mapX').tap(); await t.untilMode('yard');

    // ===================== route carousel =====================
    t.sec(`${tag}: route carousel`);
    await at('yard'); await p.locator('[data-act=walk]').first().tap(); await p.waitForSelector('#rtStart'); await settle(['.rt-card.cur']); await t.SH(tag + '_routes');
    for (const s of ['#rtStart', '#rtBack', '#rtPrev', '#rtNext', '.rt-card.cur']) await check(`${tag} routes`, s, '#bar,#hud,#toasts .toast,#dock,#modal:not([hidden]) .panel', [[0.5, 0.5]]);
    await toast(); await check(`${tag} routes + toast`, '#rtStart', '#toasts .toast', [[0.5, 0.5]]); await unToast();
    await p.locator('#rtBack').tap(); await t.untilMode('yard');

    // ===================== classic walk + results =====================
    t.sec(`${tag}: classic walk`);
    await ev(() => { window.PawWalk = null; window.__paw.S.walks = 1; window.__paw.go('walk', 'park'); });
    ok(await t.until(() => window.__paw.mode === 'walk' && !!document.getElementById('holdBtn'), null, 10000), `${tag} classic: opens`); await settle(); await t.SH(tag + '_classic');
    await check(`${tag} classic`, '#dogWA', COVER);
    for (const s of ['#holdBtn', '#hopBtn', '#walkQuit', '#bagBtn']) await check(`${tag} classic`, s, '#bar,#hud,#toasts .toast,#modal:not([hidden]) .panel', [[0.5, 0.5]]);
    await toast(); await check(`${tag} classic + toast`, '#dogWA', COVER); await unToast();
    await p.locator('#bagBtn').tap(); await t.until(() => !document.getElementById('walkBag').hidden, null, 3000); await check(`${tag} classic bag open`, '#dogWA', COVER); await check(`${tag} classic bag open`, '#holdBtn', '#bar,#hud,#toasts .toast', [[0.5, 0.5]]); await p.locator('#bagBtn').tap();
    await p.locator('#walkQuit').tap(); await p.waitForSelector('#resOk'); await settle(['#modal .panel']); await t.SH(tag + '_classic_results');
    for (const s of ['#resOk', '#modal .panel .x']) await check(`${tag} classic results`, s, '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5]]);
    const titleOk = await ev(() => { const hd = document.querySelector('#modal .panel h2'), pn = document.querySelector('#modal .panel'); if (!hd || !pn) return false; return hd.getBoundingClientRect().top - pn.getBoundingClientRect().top >= 36; });
    ok(titleOk, `${tag} classic results: the title sits below the panel's header art`);
    await p.locator('#resOk').tap(); await t.untilMode('yard');

    // ===================== runner =====================
    t.sec(`${tag}: runner`);
    await ev(() => { window.PawWalk = window.__PW; window.__paw.S.walks = 1; window.__paw.go('walk', 'park'); });
    ok(await t.until(() => !!document.querySelector('.pw-root'), null, 12000), `${tag} runner: opens`);
    // the tutorial card (a sheet by design) is paged through; the countdown follows
    await t.until(() => !!document.querySelector('.pw-tut'), null, 8000);
    for (let i = 0; i < 8 && (await ev(() => !!document.querySelector('.pw-tut'))); i++) {
      const before = await ev(() => document.querySelector('.pw-tut').innerHTML);
      await ev(() => { const b = document.querySelector('.pw-tut [data-go]') || document.querySelector('.pw-tut [data-next]'); if (b) b.click(); });
      await t.until((b) => { const c = document.querySelector('.pw-tut'); return !c || c.innerHTML !== b; }, before, 3000);
    }
    // the countdown
    // measured in the page in the same frame the countdown word is on screen (each word lives about a second)
    const cdRes = await ev(`(async () => { const ov = ${overlaps}, cv = ${covered}; const t0 = performance.now();
      while (performance.now() - t0 < 8000) { const c = document.querySelector('.pw-cd'); if (c && c.getBoundingClientRect().height > 5 && +getComputedStyle(c).opacity > 0.5) return { shown: true, text: c.textContent, over: ov('.pw-cd', ['.pw-legend', '.pw-ctrls', '.pw-hud'], 0), dog: cv('.pw-dog', '.pw-hud,.pw-ctrls,.pw-legend,.pw-card', ${JSON.stringify(PTS)}) }; await new Promise((r) => requestAnimationFrame(r)); }
      return { shown: false }; })()`);
    ok(cdRes.shown, `${tag} runner: countdown shows`);
    if (cdRes.shown) {
      ok(cdRes.over.length === 0, `${tag} runner countdown ("${cdRes.text}"): clear of the legend, controls and HUD${cdRes.over.length ? ' -> ' + cdRes.over.join(' | ') : ''}`);
      ok(cdRes.dog.length === 0, `${tag} runner countdown: the dog is not covered${cdRes.dog.length ? ' -> ' + cdRes.dog.slice(0, 3).join(' | ') : ''}`);
    }
    ok(await t.until(() => { const o = document.querySelector('.pw-ov'); return !!o && o.hidden; }, null, 15000), `${tag} runner: countdown ends`);
    await settle(); await t.SH(tag + '_runner');
    // a swipe down on the scene ducks and never hops first (the press and the first moves arrive back to back, so a jump committed on the press itself would show); a tap anywhere on the scene (either half) jumps. A frame watcher records the dog's poses.
    await ev(() => { window.__seen = { jump: 0, crouch: 0 }; const POSE = ['walk', 'jump', 'crouch']; window.__jd = 0; new MutationObserver(() => { if (document.querySelector('.pw-jump').classList.contains('down')) window.__jd++; }).observe(document.querySelector('.pw-jump'), { attributes: true, attributeFilter: ['class'] }); const loop = () => { const on = document.querySelector('.pw-pose.on'); if (on) { const k = POSE[[...on.parentElement.children].indexOf(on)]; if (k && window.__seen[k] != null) window.__seen[k]++; } window.__seenRaf = requestAnimationFrame(loop); }; loop(); });
    const sb = await p.locator('.pw-stage').boundingBox(), cdp = await t.ctx.newCDPSession(t.p), tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    const sx = sb.x + sb.width * 0.3, sy = sb.y + sb.height * 0.25, frame = () => ev(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(sx, sy) });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(sx, sy + i * 8) }); await frame(); }
    ok(await t.until(() => window.__seen.crouch > 0, null, 2000), `${tag} runner: a swipe down on the scene ducks`);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await t.until(() => { const on = document.querySelector('.pw-pose.on'); return !!on && [...on.parentElement.children].indexOf(on) !== 2; }, null, 3000);
    ok(await ev(() => window.__seen.jump + window.__jd) === 0, `${tag} runner: the swipe never hopped first`);
    for (const fx of [0.2, 0.8]) {
      await ev(() => { window.__seen.jump = 0; }); await p.touchscreen.tap(sb.x + sb.width * fx, sb.y + sb.height * 0.4);
      ok(await t.until(() => window.__seen.jump > 0, null, 2000), `${tag} runner: a tap on the ${fx < 0.5 ? 'left' : 'right'} of the scene jumps`);
      await t.until(() => { const on = document.querySelector('.pw-pose.on'); return !!on && [...on.parentElement.children].indexOf(on) === 0; }, null, 4000); // landed and running again
    }
    await cdp.detach(); await ev(() => cancelAnimationFrame(window.__seenRaf));
    await check(`${tag} runner`, '.pw-dog', '.pw-hud,.pw-ctrls,.pw-legend,.pw-card,#toasts .toast', PTS);
    await clear(`${tag} runner`, '.pw-dog', ['.pw-hud', '.pw-ctrls', '.pw-legend'], 0.1);
    await clear(`${tag} runner`, '.pw-stage', ['.pw-legend', '.pw-ctrls'], 0.02);
    for (const s of ['.pw-jump', '.pw-duck', '.pw-pauseb']) await check(`${tag} runner`, s, '#bar,#toasts .toast,.pw-legend,.pw-card', [[0.5, 0.5]]);
    await toast(); await check(`${tag} runner + toast`, '.pw-jump', '#toasts .toast', [[0.5, 0.5]]); await check(`${tag} runner + toast`, '.pw-dog', '#toasts .toast', PTS); await unToast();
    await t.quitWalk(true);

    // ===================== fetch =====================
    t.sec(`${tag}: fetch`);
    await ev(() => window.__paw.go('fetch', 'Tennis Ball'));
    ok(await t.until(() => window.__paw.mode === 'fetch' && !!document.getElementById('fQuit'), null, 8000), `${tag} fetch: opens`); await settle(); await t.SH(tag + '_fetch');
    await check(`${tag} fetch`, '#dogHit', COVER);
    await check(`${tag} fetch`, '#fQuit', '#bar,#hud,#toasts .toast', [[0.5, 0.5]]);
    const tapArea = await ev(() => { const d = document.getElementById('dock').getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(), s = document.querySelector('#view svg.world').getBoundingClientRect(); return { dockTop: d.top, viewBottom: v.bottom, svgBottom: s.bottom }; });
    ok(tapArea.dockTop >= tapArea.viewBottom - 1 || tapArea.dockTop >= tapArea.svgBottom - 1, `${tag} fetch: the dock sits under the scene, not on it (dock ${Math.round(tapArea.dockTop)}, scene ends ${Math.round(tapArea.svgBottom)})`);
    { const vb = await p.locator('#view svg.world').boundingBox(); await p.touchscreen.tap(vb.x + vb.width * 0.6, vb.y + vb.height * 0.78); } ok(await t.until(() => !!window.__paw.F.fly, null, 3000), `${tag} fetch: a tap on the grass throws the ball`);
    await check(`${tag} fetch in flight`, '#dogHit', COVER);
    await toast(); await check(`${tag} fetch + toast`, '#dogHit', COVER); await unToast();
    await p.locator('#fQuit').tap(); await p.waitForSelector('#fOk'); await settle(['#modal .panel']);
    await check(`${tag} fetch results`, '#fOk', '#bar,#hud,#toasts .toast', [[0.5, 0.5]]);
    await p.locator('#fOk').tap(); await t.untilMode('yard');

    // ===================== trick mini-games =====================
    t.sec(`${tag}: trick games`);
    const refill = () => ev(() => { window.__paw.S.dog.focus = { v: 100, at: window.__paw.S.gameMin }; });
    await at('yard'); await p.locator('[data-act=play]').first().tap(); await t.waitPop(true); await p.locator('[data-play=tricks]').tap(); await t.until(() => !!document.querySelector('#trainPanel:not([hidden])'), null, 4000); await settle(['#trainPanel']);
    await refill(); await p.locator('[data-tr="Sit"]').tap(); await t.until(() => window.__paw.train && window.__paw.train.trick === 'Sit', null, 3000);
    await p.locator('#trStart').tap(); ok(await t.until(() => !!document.querySelector('#trTrack .tg-dots'), null, 5000), `${tag} tricks: the lure track is drawn`); await settle(['#trTrack']); await t.SH(tag + '_trick_lure');
    await check(`${tag} lure`, '#dogHit', COVER);
    await check(`${tag} lure`, '#trTrack', '#trainPanel:not([hidden]),#bar,#hud,#toasts .toast', [[0.5, 0.5], [0.3, 0.5], [0.7, 0.5]]);
    for (const s of ['#pkLead', '#trX']) await check(`${tag} lure`, s, '#bar,#hud,#toasts .toast', [[0.5, 0.5]]);
    await toast(); await check(`${tag} lure + toast`, '#trTrack', '#toasts .toast', [[0.5, 0.5], [0.3, 0.5], [0.7, 0.5]]); await check(`${tag} lure + toast`, '#pkLead', '#toasts .toast', [[0.5, 0.5]]); await unToast();
    await p.locator('#trX').tap(); await t.until(() => !window.__paw.train, null, 3000);

    await at('yard'); await p.locator('[data-act=play]').first().tap(); await t.waitPop(true); await p.locator('[data-play=tricks]').tap(); await t.until(() => !!document.querySelector('#trainPanel:not([hidden])'), null, 4000); await settle(['#trainPanel']);
    await ev(() => { window.__paw.S.dog.tricks.Speak = { p: 0.1, shows: 0 }; }); await refill();
    if (await p.locator('[data-tr="Speak"]').count()) {
      await p.locator('[data-tr="Speak"]').tap(); await t.until(() => window.__paw.train && window.__paw.train.trick === 'Speak', null, 3000); await p.locator('#trStart').tap();
      ok(await t.until(() => !!document.getElementById('trSpeak'), null, 5000), `${tag} tricks: Speak button shows`); await ev(() => new Promise((r) => requestAnimationFrame(r))); await t.SH(tag + '_trick_speak');
      await check(`${tag} speak`, '#dogHit', COVER);
      await check(`${tag} speak`, '#trSpeak', '#bar,#hud,#toasts .toast', [[0.5, 0.5]]);
      await p.locator('#trX').tap(); await t.until(() => !window.__paw.train, null, 3000);
    }
    await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
    for (const m of EXTRA) if (m.phone) { t.sec(`${tag}: ${m.name || 'extra'}`); await m.phone(H, w, h, tag); await ev(() => { window.__paw.S.sleeping = false; window.__paw.go('yard'); }); await t.untilMode('yard'); }
  }

  // ===================== portrait lock: fetch and the trick games wait behind the card =====================
  t.sec('portrait lock');
  await vp(390, 844);
  const lock = async (on) => { await t.p.setViewportSize(on ? { width: 800, height: 390 } : { width: 390, height: 844 }); await t.until((on) => document.documentElement.hasAttribute('data-pslock') === on, on, 5000); await settle(); };
  await ev(() => window.__paw.go('fetch', 'Tennis Ball')); await t.until(() => window.__paw.mode === 'fetch' && !!document.getElementById('fQuit'), null, 8000);
  { const vb = await p.locator('#view svg.world').boundingBox(); await p.touchscreen.tap(vb.x + vb.width * 0.6, vb.y + vb.height * 0.78); } ok(await t.until(() => !!window.__paw.F.fly, null, 3000), 'a throw is in the air when the phone is turned');
  await lock(true); ok(await ev(() => document.documentElement.hasAttribute('data-pslock')), 'lock card shows when the phone is held sideways');
  const f0 = await ev(() => ({ t: window.__paw.F.t, fly: !!window.__paw.F.fly })); await t.sleep(300); // one short settle: "nothing should happen"
  const f1 = await ev(() => ({ t: window.__paw.F.t, ended: window.__paw.F.ended }));
  ok(Math.abs(f1.t - f0.t) < 0.2 && !f1.ended, `fetch is paused behind the card (clock ${f0.t.toFixed(2)} -> ${f1.t.toFixed(2)})`);
  await lock(false); await t.until((t0) => window.__paw.F.t < t0 - 0.05, f1.t, 4000);
  const f2 = await ev(() => ({ t: window.__paw.F.t, miss: window.__paw.F.throws, ended: window.__paw.F.ended }));
  ok(f2.t < f1.t && !f2.ended, `fetch resumes on rotate back (clock ${f1.t.toFixed(2)} -> ${f2.t.toFixed(2)}, ${f2.miss} throw(s))`);
  await p.locator('#fQuit').tap(); await p.waitForSelector('#fOk'); await p.locator('#fOk').tap(); await t.untilMode('yard');
  await at('yard'); await p.locator('[data-act=play]').first().tap(); await t.waitPop(true); await p.locator('[data-play=tricks]').tap(); await t.until(() => !!document.querySelector('#trainPanel:not([hidden])'), null, 4000); await settle(['#trainPanel']);
  await ev(() => { window.__paw.S.dog.focus = { v: 100, at: window.__paw.S.gameMin }; }); await p.locator('[data-tr="Sit"]').tap(); await t.until(() => window.__paw.train && window.__paw.train.trick === 'Sit', null, 3000);
  await p.locator('#trStart').tap(); ok(await t.until(() => !!window.__pawTG && !!window.__pawTG.game, null, 5000), 'a trick round is running before the lock');
  await lock(true); const g1 = await ev(() => ({ paused: !!window.__paw.train.game.paused, tick: !!window.__paw.train.game.ticker }));
  ok(g1.paused && !g1.tick, 'the trick game stops its clock behind the card');
  await lock(false); const g2 = await ev(() => { const g = window.__paw.train && window.__paw.train.game; return { on: !!g, paused: !!(g && g.paused), tick: !!(g && g.ticker) }; });
  ok(g2.on && !g2.paused && g2.tick, 'the same trick round resumes on rotate back (no fail, no lost round)');
  // a lock while the game is "busy" (the gap between the parts of a combo) still pauses it, and the round resumes afterwards
  await ev(() => { window.__paw.train.game.busy = true; });
  await lock(true); const g3 = await ev(() => ({ paused: !!window.__paw.train.game.paused, tick: !!window.__paw.train.game.ticker }));
  ok(g3.paused && !g3.tick, 'a lock while the trick game is busy still pauses it');
  await ev(() => { window.__paw.train.game.busy = false; });
  await lock(false); const g4 = await ev(() => { const g = window.__paw.train && window.__paw.train.game; return { on: !!g, paused: !!(g && g.paused), tick: !!(g && g.ticker) }; });
  ok(g4.on && !g4.paused && g4.tick, 'and it picks up again on rotate back');
  await p.locator('#trX').tap(); await t.until(() => !window.__paw.train, null, 3000);
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  for (const m of EXTRA) if (m.once) { t.sec(`${m.name || 'extra'} (once)`); await vp(390, 844); await m.once(H); await ev(() => { window.__paw.S.sleeping = false; window.__paw.go('yard'); }); await t.untilMode('yard'); }
  // desktop 1280x720 (not the phone layout): desktop screens must stay put and uncovered too
  if (EXTRA.some((m) => m.desk)) {
    t.sec('desktop 1280x720');
    await t.newGame({ device: null }, { coins: 3000, bond: { level: 10, pts: 5000 }, stats: { hunger: 80, happy: 80, energy: 95, clean: 90 }, inv: { toys: ['Tennis Ball', 'Frisbee'] } });
    await settle();
    for (const m of EXTRA) if (m.desk) { t.sec(`${m.name || 'extra'} (desktop)`); await m.desk(H); await ev(() => { window.__paw.S.sleeping = false; window.__paw.go('yard'); }); await t.untilMode('yard'); }
  }
}, { device: 'iPhone 13', timeout: 600000 });
