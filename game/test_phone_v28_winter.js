// v2.8 phone (V28.md sections 9 and 10), iPhone 15 (393x659 viewport) and Pixel 7 (412x915), plus the 360 px width.
// WINTER part: the yard (drift and snowdog tap rects 48 px, never under the bar, the HUD, the place chips or the location chip, nothing covers #dogHit,
// the snowdog fully inside the home crop at 390 and 360 px, with 4 dogs no drift or snowdog over a pack dog's tap rect), the Square in December
// (the Festival chooser rows, the Winter Stall and the contest sheets pass the minimums: 44 px buttons, 15 px text, a bottom sheet, the close X on
// the sticky title row, no sideways scroll at 360 px, the line-up scrolls inside its own row with a visible cue; the stall and the banner inside
// the crop, the banner clear of every place label and the location chip, Mt. Fuji's cap left in view with jpTest), the chooser in January.
// NEW YEAR adds its part (the Fortune box sheet, the Collect row) and FUJI HILL its part below, as their own sections.
// node game/run_tests.js phone_v28_winter
const { run } = require('./test_lib');

const TAP_SEL = 'button, [role=button], a[href], input:not([type=hidden]), select, .card';
const SKIP = '.lptip, #devPanel, #devBtn, #modHost, #bar, #hud, #toasts';
const R4 = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
const ov = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const setDate = (t, d) => { t.clockOffset = new Date(d + 'T10:00:00').getTime() - Date.now(); };

// 44 px tap targets, 15 px text (13 px captions and .wn-cue), no sideways page scroll
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
      const cap = el.matches('.cap, .caption, .tstar, .wn-cue') ? 13 : 15, fs = parseFloat(cs.fontSize);
      if (fs < cap - 0.01) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${fs}px "${n.textContent.trim().slice(0, 18)}"`);
    }
    return out;
  }, { skip: SKIP });
  ok(small.length === 0, `${label}: text >= 15 px (13 px captions)${small.length ? ' -> ' + small.slice(0, 6).join(' | ') : ''}`);
}
// a bottom sheet across the screen, the close X 44 px on a sticky title row that stays put while the sheet scrolls, nothing scrolls sideways
async function sheet(t, label) {
  const { ok } = t;
  const r = await t.p.evaluate(async () => {
    const e = document.querySelector('#modal:not([hidden]) .panel'); if (!e) return null; const b = e.getBoundingClientRect();
    const sc = [e, e.querySelector('.panel-body')].find((x) => x && x.scrollHeight > x.clientHeight + 4) || e, x = e.querySelector('.x'), x0 = x && x.getBoundingClientRect();
    sc.scrollTop = sc.scrollHeight; await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    const x1 = x && x.getBoundingClientRect(), h2 = e.querySelector('h2').getBoundingClientRect(); sc.scrollTop = 0;
    const bar = document.getElementById('bar'), bt = bar && bar.getBoundingClientRect().height ? bar.getBoundingClientRect().top : innerHeight;
    return { bt: Math.round(bt), w: Math.round(b.width), iw: innerWidth, h: Math.round(b.height), ih: innerHeight, bottom: Math.round(b.bottom), x: x0 ? [x0.width, x0.height] : null, xStay: !!x0 && Math.abs(x1.top - x0.top) < 2 && x1.top >= b.top - 1, h2: h2.top >= b.top - 1, pw: e.scrollWidth, pcw: e.clientWidth, scrolls: sc.scrollHeight > sc.clientHeight + 4 };
  });
  ok(!!r && Math.abs(r.w - r.iw) < 3 && r.h <= r.ih * 0.92 && (Math.abs(r.bottom - r.ih) < 3 || Math.abs(r.bottom - r.bt) < 3), `${label}: a bottom sheet, resting on the action bar (${r ? r.w + 'x' + r.h + ' bottom ' + r.bottom + ', bar ' + r.bt : 'none'})`);
  ok(!!r && r.x && r.x[0] >= 43.5 && r.x[1] >= 43.5 && (!r.scrolls || (r.xStay && r.h2)), `${label}: the close X is 44 px and stays on the title row while the sheet scrolls`);
  ok(!!r && r.pw <= r.pcw + 1, `${label}: the sheet does not scroll sideways (${r && r.pw} <= ${r && r.pcw})`);
}
async function settled(t, sel) { await t.ev(() => { window.__stb = ''; }); return t.until((sel) => { const e = document.querySelector(sel); if (!e) return false; const b = e.getBoundingClientRect(), k = [b.left, b.top, b.width, b.height].map(Math.round).join(); const same = k === window.__stb; window.__stb = k; return same; }, sel, 5000); }
async function tapSel(t, sel, cond) { await t.p.locator(sel).first().tap(); if (cond) await t.until(cond, null, 5000); }
async function closeSheet(t) { if (await t.p.locator('#modal:not([hidden]) .panel .x').count()) await tapSel(t, '#modal:not([hidden]) .panel .x'); await t.modalGone(); }
const at = async (t, place) => { await t.ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.getElementById('placeBtns'), place, 8000); await t.calm(); await t.lu(); };
const motionOff = (t) => t.ev(() => { document.documentElement.dataset.motion = 'off'; });

/* ======================= WINTER part ======================= */
async function wnYard(t, tag) {
  const { ok, ev } = t;
  await at(t, 'yard'); await t.until(() => document.querySelectorAll('#wnDriftG .fs-hit').length === 2 && !!document.querySelector('#wnDogG .fs-hit'), null, 8000); await motionOff(t);
  await settled(t, '#wnDogG > rect.fs-hit'); await settled(t, '#dogHit');
  const y = await ev(`(() => { const R4 = ${R4}; return { d0: R4('#wnDriftG [data-drift="0"] > rect.fs-hit'), d1: R4('#wnDriftG [data-drift="1"] > rect.fs-hit'), sd: R4('#wnDogG > rect.fs-hit'), art: R4('#wnDogG > svg'), dog: R4('#dogHit'), bar: R4('#bar'), hud: R4('#hud'), chip: R4('#status'), view: R4('#view'), btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }), iw: innerWidth }; })()`);
  for (const [k, n] of [['d0', 'drift 0'], ['d1', 'drift 1'], ['sd', 'the snowdog']]) {
    const r = y[k], inView = r && r[0] >= y.view[0] - 1 && r[2] <= y.view[2] + 1;
    ok(r && r[2] - r[0] >= 47.5 && r[3] - r[1] >= 47.5, `${tag} ${n}: tap rect >= 48 px (${r && Math.round(r[2] - r[0])}x${r && Math.round(r[3] - r[1])})`);
    ok(!ov(r, y.dog), `${tag} ${n}: clear of #dogHit at rest`);
    if (inView) ok(!ov(r, y.bar) && !ov(r, y.hud) && !ov(r, y.chip) && !y.btns.some((b) => ov(r, b)), `${tag} ${n}: never under the bar, the HUD, the location chip or the place buttons ${JSON.stringify({ r: r.map(Math.round), bar: y.bar && y.bar.map(Math.round), btns: y.btns.map((b) => b.map(Math.round)) })}`);
    else ok(true, `${tag} ${n}: outside the home crop now (seen with the look-right button)`);
  }
  ok(y.art[0] >= y.view[0] - 0.5 && y.art[2] <= y.view[2] + 0.5 && y.art[1] >= y.view[1] - 0.5 && y.art[3] <= y.view[3] + 0.5, `${tag}: the snowdog is fully inside the home crop ${JSON.stringify(y.art.map(Math.round))} in ${JSON.stringify(y.view.map(Math.round))}`);
  const c = [(y.sd[0] + y.sd[2]) / 2, (y.sd[1] + y.sd[3]) / 2];
  ok(await ev(([x, yy]) => { const e = document.elementFromPoint(x, yy); return !!e && !!e.closest('#wnDogG'); }, c), `${tag}: nothing sits on top of the snowdog`);
  const dc = [(y.dog[0] + y.dog[2]) / 2, (y.dog[1] + y.dog[3]) / 2];
  ok(await ev(([x, yy]) => { const e = document.elementFromPoint(x, yy); return !!e && (e.id === 'dogHit' || !!e.closest('#dogPos')); }, dc), `${tag}: nothing covers #dogHit`);
  return { y, c };
}

async function wnSquare(t, tag) {
  const { ok, ev } = t;
  await at(t, 'square'); await t.until(() => !!document.querySelector('#fsStallG .fs-hit') && !!document.querySelector('#wnBannerG') && !!document.querySelector('[data-fs=fest]'), null, 8000); await motionOff(t);
  await settled(t, '#fsStallG .fs-hit'); await settled(t, '#placeBtns');
  const q = await ev(`(() => { const R4 = ${R4}, svg = document.querySelector('#view svg.world'), M = svg.getScreenCTM().inverse(), wb = (r) => { const a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M); return [a.x, a.y, b.x, b.y]; };
    const labels = [...svg.querySelectorAll('#sceneG text')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 8 && x.textContent.trim().length > 3; }).map((x) => { const r = x.getBoundingClientRect(); return [x.textContent.trim(), [r.left, r.top, r.right, r.bottom]]; });
    const fuji = svg.querySelector('[data-fuji]');
    return { stall: R4('#fsStallG .fs-hit'), art: R4('#fsStallG > svg'), banner: R4('#wnBannerG > svg'), bannerW: wb(document.querySelector('#wnBannerG > svg').getBoundingClientRect()), fujiW: fuji ? wb(fuji.getBoundingClientRect()) : null, dog: R4('#dogHit'), hud: R4('#hud'), bar: R4('#bar'), chip: R4('#status'), peek: R4('#phPeek'), view: R4('#view'), sb: R4('[data-fs=fest]'), labels, rows: new Set([...document.querySelectorAll('#placeBtns .btn')].map((b) => Math.round(b.getBoundingClientRect().top))).size, iw: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
  ok(q.art[0] >= q.view[0] - 1 && q.art[2] <= q.view[2] + 1 && q.art[1] >= q.view[1] && q.art[3] <= q.view[3], `${tag}: the stall is inside the camera crop`);
  ok(!ov(q.art, q.dog) && !ov(q.art, q.hud) && !ov(q.art, q.bar) && !ov(q.art, q.chip), `${tag}: the stall is clear of #dogHit, the HUD, the bar and the location chip`);
  ok(q.banner && q.banner[0] >= q.view[0] - 1 && q.banner[2] <= q.view[2] + 1 && !ov(q.banner, q.dog) && !ov(q.banner, q.chip) && !ov(q.banner, q.stall) && !ov(q.banner, q.peek), `${tag}: the banner is inside the crop, clear of #dogHit, the chip, the stall and the look-right button`);
  const lab = q.labels.filter(([, r]) => ov(r, q.banner)).map(([n]) => n);
  ok(!lab.length, `${tag}: the banner is over no place label${lab.length ? ' -> ' + lab.join(', ') : ''}`);
  ok(q.fujiW && q.bannerW[1] >= q.fujiW[1] + 34, `${tag}: Mt. Fuji's cap stays in view above the banner (summit y ${q.fujiW && Math.round(q.fujiW[1])}, banner top y ${Math.round(q.bannerW[1])})`);
  ok(q.sb[2] - q.sb[0] >= 43.5 && q.sb[3] - q.sb[1] >= 43.5 && q.rows === 1, `${tag}: the Festival button is 44 px, the place buttons stay one row`);
  ok(q.sw === q.iw, `${tag}: no sideways page scroll`);
  return q;
}

async function wnChooser(t, tag, want) {
  const { ok, ev } = t;
  await tapSel(t, '[data-fs=fest]', () => !!document.querySelector('#modal:not([hidden]) .wn-choose')); await settled(t, '#modal .panel');
  const ch = await ev(() => [...document.querySelectorAll('#modal .wn-row')].map((b) => { const r = b.getBoundingClientRect(), sm = b.querySelector('.small'); return { k: b.dataset.fsgo, n: b.querySelector('b').textContent, line: sm.textContent, fs: parseFloat(getComputedStyle(sm).fontSize), h: r.height, icon: !!b.querySelector('.art svg') }; }));
  ok(ch.map((r) => r.n).join('|') === want.join('|'), `${tag} chooser rows: ${ch.map((r) => r.n).join(', ')}`);
  ok(ch.length <= 3 && ch.every((r) => r.h >= 44 && r.fs >= 15 && r.icon), `${tag} chooser: each row a 44 px card with an icon, a name and a 15 px line`);
  await sheet(t, `${tag} chooser`); await audit(t, `${tag} chooser`);
  return ch;
}

async function winterPart(t, dev) {
  const { ok, ev } = t;
  t.sec(`WINTER ${dev}: the yard on 2026-12-10`);
  setDate(t, '2026-12-10');
  await t.newGame({ device: dev }, { bond: { level: 6, pts: 700 }, coins: 3000 });
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');
  const { c } = await wnYard(t, dev);
  await t.SH('yard_' + dev.replace(/\s+/g, ''));
  await t.p.touchscreen.tap(c[0], c[1]);
  ok(await t.until(() => window.__paw.S.wn.snowdog.stage === 1, null, 4000), `${dev}: a tap on the heap rolls the first ball`);
  await t.until(() => !window.__paw.shop.busy, null, 5000);
  const d0 = await ev(`(() => { const R4 = ${R4}, r = R4('#wnDriftG [data-drift="0"] > rect.fs-hit'); return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2]; })()`);
  await t.p.touchscreen.tap(d0[0], d0[1]);
  ok(await t.until(() => window.__paw.wn.scattered.includes(0), null, 4000), `${dev}: a tap on drift 0 dives in`);
  await t.until(() => !window.__paw.shop.busy, null, 6000);

  t.sec(`WINTER ${dev}: the Square in December`);
  await ev(() => { window.__paw.S.coins = 3000; });
  await wnSquare(t, dev); await t.SH('square_' + dev.replace(/\s+/g, ''));
  await wnChooser(t, dev, ['Winter Stall', 'Sweater Contest']);
  await tapSel(t, '#modal [data-fsgo=stall]', () => !!document.querySelector('#modal:not([hidden]) .panel.wn-stall')); await settled(t, '#modal .panel');
  await sheet(t, `${dev} Winter Stall`); await audit(t, `${dev} Winter Stall`);
  const sh = await ev(async () => {
    const panel = document.querySelector('#modal .panel'), sc = [panel, panel.querySelector('.panel-body')].find((e) => e && e.scrollHeight > e.clientHeight + 4) || panel, out = [];
    for (let yy = 0; yy <= sc.scrollHeight; yy += Math.max(200, sc.clientHeight - 80)) { sc.scrollTop = yy; await new Promise((r) => requestAnimationFrame(r)); document.querySelectorAll('#modal [data-fsbuy]').forEach((b) => { const r = b.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= innerHeight) out.push([b.dataset.fsbuy, Math.round(r.width), Math.round(r.height)]); }); }
    sc.scrollTop = 0; return { out, n: document.querySelectorAll('#modal .wn-stall .sitem').length, secs: [...document.querySelectorAll('.wn-sec h3')].map((h) => h.textContent).join('|') };
  });
  ok(sh.n === 9 && sh.secs === 'Treats|Clothes|Decorations', `${dev}: 9 cards in three sections (${sh.n}, ${sh.secs})`);
  ok(new Set(sh.out.map((b) => b[0])).size === 9 && sh.out.every((b) => b[1] >= 44 && b[2] >= 44), `${dev}: every Buy button scrolls into view and is 44 px`);
  await ev(() => document.querySelector('[data-fsbuy="Felt Holly Wreath"]').scrollIntoView({ block: 'center' }));
  await tapSel(t, '[data-fsbuy="Felt Holly Wreath"]', () => !!document.querySelector('.buyveil .bb-yes')); await audit(t, `${dev} stall buy window`);
  await tapSel(t, '.buyveil .bb-yes', () => !!(window.__paw.S.decor && window.__paw.S.decor['Felt Holly Wreath']));
  ok(await t.until(() => { const c = document.querySelector('#modal .confirm'); return !!c && /Put the Felt Holly Wreath in the yard now\?/.test(c.textContent); }, null, 4000), `${dev}: the decoration buy asks "Place it / Later"`);
  await audit(t, `${dev} place-it prompt`);
  await tapSel(t, '#modal .confirm .no'); await closeSheet(t);

  await tapSel(t, '[data-fs=fest]', () => !!document.querySelector('#modal:not([hidden]) .wn-choose'));
  await tapSel(t, '#modal [data-fsgo=contest]', () => !!document.querySelector('#modal:not([hidden]) .panel.wn-contest')); await settled(t, '#modal .panel');
  await sheet(t, `${dev} contest`); await audit(t, `${dev} contest`);
  const pr = await ev(() => { const row = document.querySelector('.wn-line'), cue = document.querySelector('.wn-cue'), j = document.getElementById('wnEnter').getBoundingClientRect(); return { rsw: row.scrollWidth, rcw: row.clientWidth, ox: getComputedStyle(row).overflowX, n: row.children.length, cue: !!cue && getComputedStyle(cue).display !== 'none' && cue.getBoundingClientRect().height > 0, j: [j.width, j.height, j.bottom <= innerHeight] }; });
  ok(pr.n === 5 && pr.rsw > pr.rcw && /auto|scroll/.test(pr.ox), `${dev}: the line-up scrolls sideways inside its own row (${pr.rsw} > ${pr.rcw})`);
  ok(pr.cue, `${dev}: with a visible cue`);
  ok(pr.j[0] >= 44 && pr.j[1] >= 44 && pr.j[2], `${dev}: Enter the contest is 44 px and on screen`);
  await tapSel(t, '#wnEnter', () => /wins /.test(window.__toasts.join('|')));
  ok(await t.waitToast(/ wins .+ \+10 coins\.$/, 4000), `${dev}: Enter (motion off): the result at once`);
  if (await t.until(() => !!document.querySelector('#modal .wn-rosette'), null, 4000)) { await sheet(t, `${dev} rosette`); await audit(t, `${dev} rosette popup`); await tapSel(t, '#wnLater'); await t.modalGone(); }
  ok(await t.until(() => !!document.querySelector('[data-fs=fest]'), null, 3000), `${dev}: back to the Square, the Festival button is there`);

  t.sec(`WINTER ${dev}: 360 px wide`);
  await t.p.setViewportSize({ width: 360, height: 740 }); await t.until(() => innerWidth === 360, null, 5000);
  await wnYard(t, `${dev} 360`); await t.SH('yard_360_' + dev.replace(/\s+/g, ''));
  await wnSquare(t, `${dev} 360`); await t.SH('square_360_' + dev.replace(/\s+/g, ''));
  await wnChooser(t, `${dev} 360`, ['Winter Stall', 'Sweater Contest']);
  await tapSel(t, '#modal [data-fsgo=stall]', () => !!document.querySelector('#modal:not([hidden]) .panel.wn-stall')); await settled(t, '#modal .panel');
  await sheet(t, `${dev} 360 Winter Stall`); await audit(t, `${dev} 360 Winter Stall`); await closeSheet(t);
  await tapSel(t, '[data-fs=fest]', () => !!document.querySelector('#modal:not([hidden]) .wn-choose'));
  await tapSel(t, '#modal [data-fsgo=contest]', () => !!document.querySelector('#modal:not([hidden]) .panel.wn-contest')); await settled(t, '#modal .panel');
  await sheet(t, `${dev} 360 contest`); await audit(t, `${dev} 360 contest`); await closeSheet(t);

  t.sec(`WINTER ${dev}: four dogs in the yard`);
  await ev(() => { const P = window.__paw; P.addDog({ key: 'pug', sex: 'male', months: 14 }, 'Mash'); P.addDog({ key: 'beagle', sex: 'female', months: 20 }, 'Hoot'); P.addDog({ key: 'samoyed', sex: 'male', months: 30 }, 'Cloud'); });
  for (const [w, h] of [[390, 844], [360, 740]]) {
    await t.p.setViewportSize({ width: w, height: h }); await t.until((w) => innerWidth === w, w, 5000);
    await at(t, 'yard'); await t.until(() => document.querySelectorAll('#pack .packdog').length === 3 && !!document.querySelector('#wnDogG'), null, 8000); await motionOff(t); await settled(t, '#wnDogG > rect.fs-hit');
    const pk = await ev(`(() => { const R4 = ${R4}; const pack = [...document.querySelectorAll('#pack .packdog')].map((g) => { const r = g.querySelector('.pd-wander > rect') || g; const b = r.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }); return { pack, mine: ['#wnDriftG [data-drift="0"] > rect.fs-hit', '#wnDriftG [data-drift="1"] > rect.fs-hit', '#wnDogG > rect.fs-hit'].map((s) => R4(s)) }; })()`);
    const hit = []; pk.mine.forEach((m, i) => pk.pack.forEach((d, j) => { if (ov(m, d)) hit.push(`${['drift 0', 'drift 1', 'snowdog'][i]} / pack ${j}`); }));
    ok(pk.pack.length === 3 && !hit.length, `${dev} ${w}: with 4 dogs no drift or snowdog covers a pack dog's tap rect${hit.length ? ' -> ' + hit.join(', ') : ''}`);
    await t.SH(`yard_pack_${w}_` + dev.replace(/\s+/g, ''));
  }
  await t.p.setViewportSize({ width: dev === 'Pixel 7' ? 412 : 390, height: dev === 'Pixel 7' ? 915 : 844 });

  t.sec(`WINTER ${dev}: the chooser in January`);
  await t.ctx.close(); setDate(t, '2027-01-03');
  await t.newGame({ device: dev }, { bond: { level: 6, pts: 700 }, coins: 3000 });
  await at(t, 'square'); await t.until(() => !!document.querySelector('[data-fs=fest]'), null, 8000); await motionOff(t);
  ok(await ev(() => !document.querySelector('#wnBannerG') && document.querySelector('#fsStallG').dataset.kind === 'newyear'), `${dev}: 3 January: the New Year stall, no contest banner`);
  await wnChooser(t, `${dev} January`, ['Winter Stall', 'Fortune box']);
  await closeSheet(t);
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
  await t.ctx.close();
}

/* ======================= NEW YEAR part (NEW YEAR lane) ======================= */
// 2 January: the Fortune box in the Square (inside the crop, clear of #dogHit, the HUD, the bar, the location chip, the stall and the look-right button, a 48 px
// tap rect, nothing on top of it, the chip, one place-button row and no desktop place button), the chooser row, the fortune sheet before and after a shake (bottom
// sheet, 44 px buttons, 15 px text, the slip at least 17 px, no sideways scroll), the mailbox with the three nengajo cards and the Collect row, 360 px wide,
// and with a visitor (the v2.6 TODO case: the crop shifts and the box follows it).
// the iPhone 15 pictures of this part go to game/shots_v28/newyear/ (jpeg, under 300 KB) when PAW_SHOTS or PAW_NY_SHOTS is set
async function nyShot(t, dev, name) {
  if (dev !== 'iPhone 15' || !(process.env.PAW_SHOTS || process.env.PAW_NY_SHOTS)) return;
  const dir = require('path').join(__dirname, 'shots_v28', 'newyear'); require('fs').mkdirSync(dir, { recursive: true });
  await t.ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove())); await t.sleep(600);
  await t.p.screenshot({ path: require('path').join(dir, 'phone_' + name + '.jpg'), type: 'jpeg', quality: 55 });
}
async function nyBox(t, tag) {
  const { ok, ev } = t;
  await at(t, 'square'); await t.until(() => !!document.querySelector('#nyFortuneG .fs-hit') && !!document.querySelector('#fsStallG .fs-hit') && !!document.querySelector('[data-fs=fest]'), null, 8000); await motionOff(t);
  await settled(t, '#nyFortuneG .fs-hit'); await settled(t, '#placeBtns');
  const q = await ev(`(() => { const R4 = ${R4}, svg = document.querySelector('#view svg.world'), M = svg.getScreenCTM().inverse(), wb = (r) => { const a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M); return [a.x, a.y, b.x, b.y]; };
    const labels = [...svg.querySelectorAll('#sceneG text')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 8 && x.textContent.trim().length > 3; }).map((x) => { const r = x.getBoundingClientRect(); return [x.textContent.trim(), [r.left, r.top, r.right, r.bottom]]; });
    const vis = R4('#visitorG > rect'), hit = R4('#nyFortuneG > rect.fs-hit'), c = hit && [(hit[0] + hit[2]) / 2, (hit[1] + hit[3]) / 2], top = c && document.elementFromPoint(c[0], c[1]);
    return { hit, art: R4('#nyFortuneG > svg'), chip: R4('#nyFortuneG .hw-chip'), stall: R4('#fsStallG > svg'), dog: R4('#dogHit'), hud: R4('#hud'), bar: R4('#bar'), loc: R4('#status'), peek: R4('#phPeek'), view: R4('#view'), vis, labels, top: !!top && !!top.closest('#nyFortuneG'),
      rows: new Set([...document.querySelectorAll('#placeBtns .btn')].map((b) => Math.round(b.getBoundingClientRect().top))).size, desk: !!document.querySelector('#placeBtns [data-ny]'), sw: document.documentElement.scrollWidth, iw: innerWidth, boxW: wb(document.querySelector('#nyFortuneG > svg').getBoundingClientRect()) }; })()`);
  const inCrop = (r) => r[0] >= q.view[0] - 1 && r[2] <= q.view[2] + 1 && r[1] >= q.view[1] - 1 && r[3] <= q.view[3] + 1;
  ok(inCrop(q.art), `${tag}: the Fortune box is inside the camera crop`);
  ok(!ov(q.art, q.dog) && !ov(q.art, q.hud) && !ov(q.art, q.bar) && !ov(q.art, q.loc) && !ov(q.art, q.peek) && !ov(q.art, q.stall) && !ov(q.art, q.vis), `${tag}: the box is clear of #dogHit, the HUD, the bar, the location chip, the look-right button, the stall and any visitor`);
  ok(q.hit[2] - q.hit[0] >= 47.5 && q.hit[3] - q.hit[1] >= 47.5, `${tag}: the tap rect is at least 48 px (${Math.round(q.hit[2] - q.hit[0])}x${Math.round(q.hit[3] - q.hit[1])})`);
  ok(q.top, `${tag}: nothing sits on top of the box`);
  ok(!!q.chip && q.chip[3] - q.chip[1] >= 18, `${tag}: the box wears a name chip`);
  const lab = q.labels.filter(([, r]) => ov(r, q.art)).map(([n]) => n);
  ok(!lab.length, `${tag}: the box is over no place label${lab.length ? ' -> ' + lab.join(', ') : ''}`);
  ok(q.rows === 1 && !q.desk, `${tag}: the place buttons stay one row, no desktop Fortune button`);
  ok(q.sw === q.iw, `${tag}: no sideways page scroll`);
  return q;
}
async function newYearPart(t, dev) {
  const { ok, ev } = t;
  t.sec(`NEW YEAR ${dev}: the Square on 2 January`);
  setDate(t, '2027-01-02');
  await t.newGame({ device: dev }, { bond: { level: 6, pts: 700 }, coins: 3000 });
  await ev(() => { const P = window.__paw, S = P.S, me = S.dog; S.mail = []; S.mailCards = {}; S.ny.cards = null; S.rehomed = [{ id: 'nyp1', name: 'Button', key: me.key, sex: 'female', born: '2026-08-01', since: '2026-12-01', family: { id: 'tanaka', name: 'the Tanakas', where: 'by the bakery' }, genes: JSON.parse(JSON.stringify(me.genes)), parents: [me.id, 'dad'], gen: 2 }]; P.ny.cards(); });
  ok(await ev(() => window.__paw.S.mail.filter((m) => /^ny_/.test(m.id)).length) === 3, `${dev}: Gerald, Plum and one pup card arrived`);
  await nyBox(t, dev); await t.SH('ny_square_' + dev.replace(/\s+/g, '')); await nyShot(t, dev, 'square_2jan');
  const ch = await wnChooser(t, `${dev} 2 Jan`, ['Winter Stall', 'Fortune box']);
  ok(ch.find((r) => r.k === 'fortune').line === 'Only good fortunes, until 7 January.', `${dev}: the Fortune box row line`);
  await nyShot(t, dev, 'chooser_2jan');
  await tapSel(t, '#modal [data-fsgo=fortune]', () => !!document.querySelector('#modal:not([hidden]) .panel.ny-fortunepop')); await settled(t, '#modal .panel');
  await sheet(t, `${dev} fortune (before)`); await audit(t, `${dev} fortune (before)`);
  const b0 = await ev(() => { const b = document.getElementById('nyShake').getBoundingClientRect(); return [b.width, b.height, b.bottom <= innerHeight]; });
  ok(b0[1] >= 44 && b0[0] >= 44 && b0[2], `${dev}: "Shake the box" is 44 px and on screen`);
  await t.SH('ny_fortune_before_' + dev.replace(/\s+/g, '')); await nyShot(t, dev, 'fortune_before');
  await tapSel(t, '#nyShake', () => !!document.querySelector('.ny-slip')); await settled(t, '#modal .panel');
  const sl = await ev(() => { const f = document.querySelector('.ny-ftxt'), l = document.querySelector('.ny-luck'), r = document.querySelector('.ny-slip').getBoundingClientRect(), tie = document.getElementById('nyTie').getBoundingClientRect(); return { f: parseFloat(getComputedStyle(f).fontSize), l: parseFloat(getComputedStyle(l).fontSize), inside: r.left >= 0 && r.right <= innerWidth, tie: [tie.width, tie.height, tie.bottom <= innerHeight] }; });
  ok(sl.f >= 17 && sl.l >= 17 && sl.inside, `${dev}: the slip text is at least 17 px (${sl.f}, ${sl.l}) and inside the screen`);
  ok(sl.tie[1] >= 44 && sl.tie[2], `${dev}: "Tie it on the rail" is 44 px and on screen`);
  await sheet(t, `${dev} fortune (after)`); await audit(t, `${dev} fortune (after)`); await t.SH('ny_fortune_after_' + dev.replace(/\s+/g, '')); await nyShot(t, dev, 'fortune_after');
  await tapSel(t, '#nyTie', () => window.__paw.ny.knots === 1); await t.modalGone();
  ok(await t.until(() => { const g = document.getElementById('nyFortuneG'); return !!g && g.dataset.knots === '1'; }, null, 4000), `${dev}: one knot on the box`);
  await tapSel(t, '[data-fs=fest]', () => !!document.querySelector('#modal:not([hidden]) .wn-choose'));
  await tapSel(t, '#modal [data-fsgo=fortune]', () => !!document.querySelector('#modal:not([hidden]) .panel.ny-fortunepop')); await settled(t, '#modal .panel');
  ok(await ev(() => /Come back tomorrow for another\./.test(document.querySelector('.ny-intro').textContent) && !document.getElementById('nyShake')), `${dev}: the same day: "Come back tomorrow for another."`);
  await audit(t, `${dev} fortune (done today)`); await closeSheet(t);

  t.sec(`NEW YEAR ${dev}: the mailbox with the three cards and Collect`);
  await ev(() => window.__paw.openMailbox('ny_gerald_2027'));
  await t.until(() => !!document.querySelector('#modal .panel.mailbox .ny-card'), null, 5000); await settled(t, '#modal .panel');
  const nc = await ev(() => { const c = document.querySelector('#modal .ny-card'), r = c.getBoundingClientRect(), p = document.querySelector('#modal .panel').getBoundingClientRect(), tx = c.querySelector('.ny-cardtx span'); return { fits: r.left >= p.left - 1 && r.right <= p.right + 1, w: r.width, tx: parseFloat(getComputedStyle(tx).fontSize), ratio: r.width / r.height }; });
  ok(nc.fits && nc.w > 200 && nc.tx >= 15, `${dev}: the nengajo fits the sheet (${Math.round(nc.w)} px wide, card text ${nc.tx} px)`);
  await sheet(t, `${dev} mailbox`); await audit(t, `${dev} mailbox`);
  const cr = await ev(() => { const b = document.querySelector('#modal .mb-get, #modal .mb-all'); if (!b) return null; b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); return [r.width, r.height]; });
  ok(!!cr && cr[0] >= 43.5 && cr[1] >= 43.5, `${dev}: the Collect row buttons are 44 px`);
  await t.SH('ny_mailbox_' + dev.replace(/\s+/g, '')); await nyShot(t, dev, 'mailbox_gerald');
  await ev(() => window.__paw.openMailbox('ny_pup_nyp1_2027')); await t.until(() => !!document.querySelector('#modal .ny-card .pc-photo svg'), null, 4000); await settled(t, '#modal .panel');
  await audit(t, `${dev} mailbox pup card`); await t.SH('ny_mailbox_pup_' + dev.replace(/\s+/g, '')); await nyShot(t, dev, 'mailbox_pup');
  const c0 = await ev(() => window.__paw.S.coins);
  await t.p.locator('#modal .mb-all').first().tap();
  ok(await t.until((c) => window.__paw.S.coins === c + 30 && window.__paw.S.inv.clothes.includes('Year of the Sheep Hood'), c0, 4000), `${dev}: Collect all pays 30 coins and the hood`);
  await closeSheet(t);

  t.sec(`NEW YEAR ${dev}: 360 px wide, and with a visitor`);
  await t.p.setViewportSize({ width: 360, height: 740 }); await t.until(() => innerWidth === 360, null, 5000);
  await nyBox(t, `${dev} 360`); await t.SH('ny_square_360_' + dev.replace(/\s+/g, ''));
  await ev(() => { const P = window.__paw, S = P.S; while (S.dogs.length < 3) P.addDog({ key: ['corgi', 'golden'][S.dogs.length - 1], sex: 'male', months: 20 }, ['Biscuit', 'Pal'][S.dogs.length - 1]); S.rehomed = [{ id: 'nyv1', key: 'mutt', name: 'Pickle', sex: 'male', born: new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10), family: 'the Tanakas by the bakery', genes: null }]; });
  await at(t, 'square'); await ev(() => window.__paw.town.visit('nyv1')); await t.until(() => !!document.querySelector('#visitorG'), null, 5000);
  await t.until(() => !!document.querySelector('#nyFortuneG .fs-hit'), null, 8000); await settled(t, '#nyFortuneG .fs-hit'); await settled(t, '#visitorG > rect');
  await nyBox(t, `${dev} 360 visitor`); await t.SH('ny_square_visitor_' + dev.replace(/\s+/g, '')); await nyShot(t, dev, 'square_visitor_360');
  await ev(() => { const S = window.__paw.S; S.dogs.splice(1); S.rehomed = []; });
  await t.p.setViewportSize({ width: dev === 'Pixel 7' ? 412 : 390, height: dev === 'Pixel 7' ? 915 : 844 });
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, `${dev}: no console errors ` + errs.slice(0, 3).join(' | '));
  await t.ctx.close();
}
/* ======================= FUJI HILL part (the FUJI HILL lane adds it here) ======================= */
// Fuji View Hill (V28.md sections 12.4 and 9), 2026-12-10 with jpTest, at the device width and 360 px: the place buttons 44 px on one row, the dog and the
// bench inside the crop, Fuji's summit in the crop, nothing over #dogHit (no place button either), 15 px text; Look at Fuji by touch (motion off), then
// "Fuji says see you tomorrow." still 44 px on one row. The iPhone 15 pictures go to game/shots_v28/fuji-hill/ when PAW_SHOTS or PAW_JP_SHOTS is set.
async function jpShot(t, dev, name) {
  if (dev !== 'iPhone 15' || !(process.env.PAW_SHOTS || process.env.PAW_JP_SHOTS)) return;
  const dir = require('path').join(__dirname, 'shots_v28', 'fuji-hill'); require('fs').mkdirSync(dir, { recursive: true });
  await t.ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove())); await t.sleep(500);
  await t.p.screenshot({ path: require('path').join(dir, 'phone_dec_' + name + '.jpg'), type: 'jpeg', quality: 60 });
}
async function jpHill(t, tag) {
  const { ok, ev } = t;
  await at(t, 'fujihill'); await t.until(() => !!document.querySelector('#placeBtns [data-jp]'), null, 8000); await motionOff(t);
  await settled(t, '#dogHit'); await settled(t, '#placeBtns');
  const q = await ev(`(() => { const R4 = ${R4}, svg = document.querySelector('#view svg.world'), C = svg.getScreenCTM(), sc = (x, y) => new DOMPoint(x, y).matrixTransform(C);
    const box = (x, y, w, h) => { const a = sc(x, y), b = sc(x + w, y + h); return [a.x, a.y, b.x, b.y]; }, fj = document.querySelector('#sceneG [data-fuji]'), fr = fj && fj.getBoundingClientRect();
    const d = R4('#dogHit'), c = [(d[0] + d[2]) / 2, (d[1] + d[3]) / 2], top = document.elementFromPoint(c[0], c[1]);
    return { dog: d, art: R4('#dogArt'), bench: box(488, 395, 84, 59), summit: fr ? [(fr.left + fr.right) / 2, fr.top] : null, view: R4('#view'), hud: R4('#hud'), chip: R4('#status'), dogTop: !!top && (top.id === 'dogHit' || !!top.closest('#dogPos')),
      btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }), sw: document.documentElement.scrollWidth, iw: innerWidth }; })()`);
  const inV = (r) => r[0] >= q.view[0] - 1 && r[2] <= q.view[2] + 1 && r[1] >= q.view[1] - 1 && r[3] <= q.view[3] + 1;
  ok(q.btns.length === 2 && q.btns.every((b) => b[2] - b[0] >= 43.5 && b[3] - b[1] >= 43.5) && new Set(q.btns.map((b) => Math.round(b[1]))).size === 1, `${tag}: Look at Fuji and Go home are 44 px on one row`);
  ok(inV(q.art) && inV(q.bench), `${tag}: the dog and the bench are inside the crop (dog ${q.art.map(Math.round)}, bench ${q.bench.map(Math.round)}, view ${q.view.map(Math.round)})`);
  ok(!!q.summit && q.summit[0] > q.view[0] + 10 && q.summit[0] < q.view[2] - 10 && q.summit[1] >= q.view[1] - 1, `${tag}: Fuji's summit is in the crop ${q.summit && q.summit.map(Math.round)}`);
  ok(q.dogTop && !q.btns.some((b) => ov(b, q.dog)) && !ov(q.chip, q.dog), `${tag}: nothing covers #dogHit`);
  ok(q.sw === q.iw, `${tag}: no sideways page scroll`);
  await audit(t, `${tag} Fuji View Hill`);
  return q;
}
async function jpPart(t, dev) {
  const { ok, ev } = t;
  t.sec(`FUJI HILL ${dev}: Fuji View Hill on 2026-12-10`);
  setDate(t, '2026-12-10');
  await t.newGame({ device: dev }, { bond: { level: 3, pts: 300 } });
  ok(await ev(() => !!window.__paw.jp.place() && window.__paw.jp.open()), `${dev}: the hill is open (jpTest, Bond 3)`);
  await jpHill(t, dev); await jpShot(t, dev, 'fujihill');
  await ev(() => window.__toasts.splice(0));
  await t.p.locator('#placeBtns [data-jp]').tap();
  ok(await t.waitToast(/\+6 Happiness, \+\d+ Bond\.$/, 6000), `${dev}: a tap on Look at Fuji: the toast`);
  await t.until(() => !window.__paw.jp.gazing, null, 8000);
  const q = await jpHill(t, `${dev} after the look`);
  ok(await ev(() => document.querySelector('#placeBtns [data-jp]').textContent) === 'Fuji says see you tomorrow.', `${dev}: the button reads "Fuji says see you tomorrow."`);
  await jpShot(t, dev, 'fujihill_done');
  t.sec(`FUJI HILL ${dev}: 360 px wide`);
  await t.p.setViewportSize({ width: 360, height: 740 }); await t.until(() => innerWidth === 360, null, 5000);
  await jpHill(t, `${dev} 360`); await jpShot(t, dev, 'fujihill_360');
  await t.p.setViewportSize({ width: dev === 'Pixel 7' ? 412 : 390, height: dev === 'Pixel 7' ? 915 : 844 });
  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, `${dev}: no console errors ` + errs.slice(0, 3).join(' | '));
  await t.ctx.close();
  return q;
}

run('phone_v28_winter', async (t) => {
  for (const dev of ['iPhone 15', 'Pixel 7']) await winterPart(t, dev);
  for (const dev of ['iPhone 15', 'Pixel 7']) await newYearPart(t, dev);
  for (const dev of ['iPhone 15', 'Pixel 7']) await jpPart(t, dev);
}, { device: 'iPhone 15', fest: 'auto', season: 'winter', prefs: { wnTest: true, jpTest: true, msTest: true } });
