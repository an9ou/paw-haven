// v2.32.1 "Where is the Fun Fair?" (a player asked "園遊會點去？搵唔到"): the Fun Fair sign on the town map (49_funfair.js ffMapSpot, at FF_SPOT),
// its sheet (ffMapSheet: every game and job, where it is, Go or "Opens at level N" / "Bond N"), Go travels like a tap on that place's building and the
// place's yellow Fun Fair button is there, Gerald's notebook page 9 "Show me", the How to play card names each game's place, the level card and the
// Bond card unlock lines name the place, an old save loads. Phone 360 x 640 and desktop 1280 x 720: the sign clear of every building, caption and the
// Festive Market tent, a 44 px tap, the long-press name.
// Run: PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/run_tests.js ff_map
const { run, URL, sleep } = require('./test_lib');
const PREFS = { ffTest: true, ddTest: true, jpTest: true, tkTest: true, msTest: true, ms2Test: true, lvTest: true };

run('ff_map', async (t) => {
  const { ok, sec, ev } = t; const errs = [];
  const fresh = async (o, patch) => {
    await t.newGame(Object.assign({ sex: 'girl', prefs: PREFS, map215: true }, o || {}), Object.assign({ bond: { level: 6, pts: 1300 }, coins: 500, lv: { lv: 4, xp: 400, shown: 4 } }, patch || {}));
    t.p.on('pageerror', (e) => errs.push(e.message));
    await t.until(() => !!(window.__paw && window.__paw.ff && window.__paw.ff.on() && window.__paw.mp), null, 5000);
    await t.home('yard'); await t.lu();
  };
  const openMap = async () => { await ev(() => window.__paw.go('map')); await t.p.waitForSelector('#mapInner .mb[data-area]'); await t.until(() => !!document.querySelector('#mpWalkG .mp-walker'), null, 3000); await sleep(300); };
  const clear = () => ev(() => { const el = document.getElementById('toasts'); if (el) el.innerHTML = ''; });

  sec('0. off: no sign without the Fun Fair (the older map suites keep 25 buildings)');
  await t.newGame({ sex: 'girl', prefs: { ddTest: true }, map215: true });
  await t.until(() => !!(window.__paw && window.__paw.ff), null, 5000);
  await openMap();
  ok(await ev(() => !document.querySelector('#mapInner [data-area="ffair"]') && !document.querySelector('#mapInner .ff-mb')), 'no Fun Fair sign while the Fun Fair is off (the older map suites keep their buildings)');
  await t.ctx.close();

  for (const [w, h, dev] of [[1280, 720, null], [360, 640, 'Pixel 7']]) {
    const tag = dev ? 'phone 360x640' : 'desktop 1280x720';
    sec(`1. ${tag}: the sign on the map`);
    await fresh(dev ? { device: dev } : {});
    if (dev) await t.p.setViewportSize({ width: w, height: h });
    await t.home('yard'); await openMap();
    const M = await ev(() => {
      const g = document.querySelector('#mapInner .mb[data-area="ffair"]'); if (!g) return null;
      const svg = document.querySelector('#mapInner svg.world'), I = svg.getScreenCTM().inverse();
      const u = (r) => { const a = new DOMPoint(r.left, r.top).matrixTransform(I), b = new DOMPoint(r.right, r.bottom).matrixTransform(I); return [a.x, a.y, b.x, b.y]; };
      const hit = g.querySelector('.mb-hit'), cap = g.querySelector('.mb-cap'), lift = g.querySelector('.mb-lift');
      const art = [...lift.children].filter((e) => !e.matches('.mb-box,.mb-cap')).map((e) => u(e.getBoundingClientRect()));
      const others = [...document.querySelectorAll('#mapInner .mb[data-area]')].filter((x) => x !== g).map((x) => ({ k: x.dataset.area, hit: u(x.querySelector('.mb-hit').getBoundingClientRect()), cap: x.querySelector('.mb-cap') ? u(x.querySelector('.mb-cap').getBoundingClientRect()) : null }));
      return { role: g.getAttribute('role'), tab: g.tabIndex, aria: g.getAttribute('aria-label'), cap: cap && cap.textContent, capBox: u(cap.getBoundingClientRect()), hit: u(hit.getBoundingClientRect()), art, others, spot: window.__paw.ff.spot, fm: window.__paw.fm ? window.__paw.fm.spot : [1010, 720] };
    });
    ok(!!M, 'the Fun Fair sign is on the map once the Fun Fair is on');
    if (!M) continue;
    ok(M.role === 'button' && M.tab === 0 && /Fun Fair/.test(M.aria) && M.cap === 'Fun Fair', `a building button: role=button, tabindex 0, aria "${M.aria}", caption "${M.cap}"`);
    const ov = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    const mine = [M.capBox].concat(M.art);
    const hitBad = M.others.filter((o) => mine.some((r) => ov(r, o.hit)) || (o.cap && ov(M.hit, o.cap)));
    ok(!hitBad.length, 'its art and caption cover no other building or caption: ' + hitBad.map((o) => o.k).join(', '));
    const fmBox = [M.fm[0] - 132, M.fm[1] - 130, M.fm[0] + 132, M.fm[1] + 110];
    ok(!ov(M.hit, fmBox) && !mine.some((r) => ov(r, fmBox)), 'clear of the Festive Market tent at FM_SPOT ' + M.fm.join(','));
    await ev(() => window.__paw.mapTo('ffair')); await sleep(250); await clear();
    const px = await ev(() => { const r = document.querySelector('#mapInner .mb[data-area="ffair"] .mb-hit').getBoundingClientRect(), c = document.querySelector('#mapInner .mb[data-area="ffair"] .mb-cap'); const s = (() => { const m = /scale\(([\d.]+)\)/.exec(document.getElementById('mapInner').style.transform); return m ? +m[1] : 1; })(); return { w: r.width, h: r.height, cap: +c.getAttribute('font-size') * s, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
    ok(px.w >= 44 && px.h >= 44, `the tap area is 44 px or more (${Math.round(px.w)} x ${Math.round(px.h)})`);
    ok(px.cap >= 14.95 || !dev, `the caption is 15 px or more on phones (${px.cap.toFixed(1)})`);
    await t.SH('map_' + (dev ? 'phone' : 'desk'));
    if (dev) {
      const cdp = await t.ctx.newCDPSession(t.p), tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(px.cx, px.cy) }); await sleep(750); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const tip = await ev(() => { const e = document.querySelector('.lptip'); return e ? e.textContent : ''; });
      ok(/Fun Fair/.test(tip), 'a long-press names it: ' + tip);
      ok(await ev(() => !document.querySelector('#modal .ff-mpop') && window.__paw.mode === 'map'), 'and opens nothing');
      await sleep(1800); // the click right after a long-press tip is swallowed (22c_phone_shell.js, 1.6 s)
      await ev(() => window.__paw.mapTo('ffair')); await sleep(250);
      const c2 = await ev(() => { const r = document.querySelector('#mapInner .mb[data-area="ffair"] .mb-hit').getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
      px.cx = c2.cx; px.cy = c2.cy;
      await t.p.touchscreen.tap(px.cx, px.cy);
    } else await t.p.mouse.click(px.cx, px.cy);

    sec(`2. ${tag}: a tap opens the sheet`);
    ok(await t.until(() => !!document.querySelector('#modal .ff-mpop .ff-mcards'), null, 3000), 'the Fun Fair sheet opens ');
    ok(await ev(() => window.__paw.mode === 'map' && !window.__paw.mp.walking()), 'no travel from the sign');
    await sleep(300); await clear(); await t.SH('sheet_' + (dev ? 'phone' : 'desk'));
    const R = await ev(() => [...document.querySelectorAll('#modal .ff-mcard')].map((li) => { const b = li.querySelector('[data-ffmgo]'), r = b.getBoundingClientRect(); return { k: li.dataset.k, place: li.dataset.place, where: li.querySelector('.ff-where').textContent, lock: b.getAttribute('aria-disabled') === 'true', btn: b.textContent, h: r.height, w: r.width }; }));
    const keys = R.map((r) => r.k);
    ok(['catch', 'seek', 'bubble', 'show', 'kite', 'paper', 'bakery', 'wash', 'stall', 'photo'].every((k) => keys.includes(k)), 'every game, job, the stall and the photo contest: ' + keys.join(' '));
    const W = Object.fromEntries(R.map((r) => [r.k, r]));
    ok(W.catch.where === 'At Sunny Park' && W.seek.where === 'At My Yard' && W.bubble.where === 'At Splash Pool' && W.paper.where === 'At Town Square' && W.bakery.where === 'At Pupuccino Café' && W.stall.where === 'At Kibble Corner' && W.kite.where === 'At Mt. Fuji Lookout', 'each row says where: ' + R.map((r) => r.k + '=' + r.where).join(', '));
    ok(!W.catch.lock && W.catch.btn === 'Go' && !W.bubble.lock && !W.paper.lock, 'open games (level 4): Go');
    ok(W.show.lock && W.show.btn === 'Opens at level 9' && W.kite.lock && W.kite.btn === 'Opens at level 11' && W.wash.lock && W.wash.btn === 'Opens at level 5', `locked rows show the level: ${W.show.btn} | ${W.kite.btn} | ${W.wash.btn}`);
    ok(R.every((r) => r.h >= 44 && r.w >= 44), 'every button is 44 px or more: ' + Math.round(Math.min(...R.map((r) => r.h))));
    ok(keys.indexOf('show') > keys.indexOf('photo') && keys.indexOf('wash') > keys.indexOf('stall'), 'the open rows come first');
    ok(await ev(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll');
    await clear();
    await ev(() => document.querySelector('#modal .ff-mcard[data-k="show"] [data-ffmgo]').click());
    ok(await t.until(() => (window.__toasts || []).some((s) => /level 9/.test(s)) || /level 9/.test(document.getElementById('toasts').textContent), null, 2000), 'a locked row says when it opens, and goes nowhere');
    ok(await ev(() => window.__paw.mode === 'map' && !window.__paw.mp.walking()), 'still on the map');

    sec(`3. ${tag}: Go travels like a tap on the building, then the yellow button`);
    const goTo = dev ? 'park' : 'cafe', k = dev ? 'catch' : 'bakery';
    await ev((k) => document.querySelector(`#modal .ff-mcard[data-k="${k}"] [data-ffmgo]`).click(), k);
    ok(await t.until(() => !!window.__paw.mp.walking() || window.__paw.mode !== 'map', null, 3000), 'Go starts the travel walk on the map');
    const wk = await ev(() => window.__paw.mp.walking());
    ok(!wk || wk.to === goTo, 'the walk goes to ' + goTo + ': ' + JSON.stringify(wk && wk.to));
    ok(await t.until((p) => window.__paw.S.place === p && window.__paw.mode === 'yard' && !document.querySelector('.onway'), goTo, 10000), 'arrived at ' + goTo);
    ok(await t.until(() => !!document.querySelector('#placeBtns [data-ff]'), null, 3000), 'the yellow Fun Fair button is there: ' + await ev(() => { const b = document.querySelector('#placeBtns [data-ff]'); return b ? b.textContent : ''; }));
    ok(await ev((k) => window.__paw.ff.here().includes(k), k), 'and it holds ' + k);
    // Go to the place the pack is already at: its own Fun Fair cards
    await ev(() => window.__paw.ff.sheet()); await t.until(() => !!document.querySelector('#modal .ff-mpop'), null, 2000);
    await ev((k) => document.querySelector(`#modal .ff-mcard[data-k="${k}"] [data-ffmgo]`).click(), k);
    ok(await t.until(() => !!document.querySelector('#modal .ff-cards:not(.ff-mcards) .ff-card[data-k]'), null, 3000), 'Go where you already are opens that place\'s Fun Fair cards');
    await ev(() => window.__paw.go('yard'));
    await t.ctx.close();
  }

  sec('4. the notebook page 9: Show me opens the Fun Fair sheet');
  await fresh();
  const nbOk = await ev(() => { const S = window.__paw.S; if (!S.missions || !S.missions.nb) return 'no notebook'; S.fw = S.fw || {}; S.fw.fresh = true; S.missions.nb.pages = 9; S.missions.nb.day = '2099-01-01'; window.__paw.msn.page(9); return 'ok'; });
  ok(nbOk === 'ok', 'a new player\'s notebook: ' + nbOk);
  const nbh = await ev(() => window.__paw.msn.html());
  ok(/data-nbshow="ff"/.test(nbh) && /Show me/.test(nbh), 'page 9 has a Show me button');
  await ev(() => window.__paw.ms.open()); await t.until(() => !!document.querySelector('#modal .ms-tab[data-mstab="notebook"]'), null, 4000);
  await t.p.click('.ms-tab[data-mstab="notebook"]'); await t.until(() => !!document.querySelector('#modal .nb-show'), null, 3000);
  const sb = await ev(() => { const b = document.querySelector('#modal .nb-show'); const r = b.getBoundingClientRect(); return { h: r.height, w: r.width, t: b.textContent }; });
  ok(sb.h >= 44 && sb.w >= 44, `Show me is a 44 px button (${Math.round(sb.w)} x ${Math.round(sb.h)})`);
  await t.p.click('#modal .nb-show');
  ok(await t.until(() => !!document.querySelector('#modal .ff-mpop .ff-mcards'), null, 3000), 'Show me opens the Fun Fair sheet');
  await ev(() => document.querySelector('#modal .ff-mcard[data-k="catch"] [data-ffmgo]').click());
  ok(await t.until(() => window.__paw.mode === 'map' || window.__paw.S.place === 'park', null, 4000), 'Go from there opens the map and walks');
  ok(await t.until(() => window.__paw.S.place === 'park' && window.__paw.mode === 'yard' && !document.querySelector('.onway'), null, 12000) && await t.until(() => !!document.querySelector('#placeBtns [data-ff]'), null, 3000), 'and arrives at Sunny Park with the yellow button');

  sec('5. Gerald\'s card and the unlock lines name the place');
  const L = await ev(() => window.__paw.ff.lesson());
  ok(Array.isArray(L) && L.length === 4 && /Treat Catch: Sunny Park/.test(L[3]) && /Sniff & Seek: My Yard/.test(L[3]) && /Bubble Pop: Splash Pool/.test(L[3]) && !/Dog Show Pose/.test(L[3]) && /town map/.test(L[3]), 'the How to play card: ' + (L && L[3]).replace(/\n/g, ' / '));
  ok(await ev(() => !/;/.test(window.__paw.ff.lesson()[3])), 'no semicolons');
  const u = await ev(() => ({ lv2: window.__paw.lv.unlocksText(2), lv9: window.__paw.lv.unlocksText(9) }));
  ok(u.lv2.includes('Fun Fair: Sniff & Seek (My Yard)') && u.lv9.includes('Fun Fair: Dog Show Pose (Town Square)'), 'the level card and sheet lines: ' + u.lv2.concat(u.lv9).filter((x) => /Fun Fair/.test(x)).join(' | '));
  // levels off: the Bond card's lines (ffUnlocks) name the place too
  const bu = await ev(() => { const P = window.__paw; P.lv.test(false); const r = [P.ff.unlocks(2), P.ff.unlocks(3)]; P.lv.test(true); return r; });
  ok(bu[0].includes('Fun Fair: Sniff & Seek (My Yard)') && bu[1].includes('Fun Fair: Bubble Pop (Splash Pool)'), 'levels off, the Bond card lines: ' + bu[0].concat(bu[1]).join(' | '));

  sec('6. an old save loads (no new save fields; the sign shows)');
  {
    const oldJson = await ev(() => { const P = window.__paw; P.saveNow(); const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.ff; s.place = 'yard'; return JSON.stringify(s); });
    await t.ctx.close(); await t.mk({ prefs: PREFS, map215: true, storage: { pawhaven_proto_v1: oldJson } }); t.p.on('pageerror', (e) => errs.push(e.message));
    await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.lu();
    ok(await ev(() => window.__paw.S.v === 1 && !!window.__paw.S.ff), 'the old save loads, S.v 1, S.ff back');
    await openMap();
    ok(await ev(() => !!document.querySelector('#mapInner .mb[data-area="ffair"]')), 'the sign is on its map');
  }
  ok(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
}, { prefs: PREFS, map215: true, timeout: 600000 });
