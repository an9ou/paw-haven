// v2.11 TRAVEL lane phone test (iPhone 15, 393 x 852 class), V211.md section 5.3, prefs.tkTest: the town map's Station pin and its confirm chip,
// the ticket window, the ride (the skip button), the Japan map (pans, the pins and the Stamp book button are 44 px, the names 15 px), the confirm chip,
// every Tokyo place with the whole pack (the place buttons 44 px and 15 px, the hot spots in view are 44 px and nothing covers them, no sideways scroll),
// the Stamp book and the omikuji sheet. PAW_SHOTS=1 writes game/shots_phone_v211_tokyo/.
// node game/run_tests.js phone_v211_tokyo
require('./test_lib').run('phone_v211_tokyo', async (t) => {
  const { ok, sec, ev } = t;
  const p = () => t.p, S = () => t.S();
  const noSide = () => ev(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
  const motion = (on) => ev((on) => { document.documentElement.dataset.motion = on ? 'on' : 'off'; }, on);
  const quiet = () => ev(() => { window.__toasts.splice(0); document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
  // every visible button in sel: at least 44 x 44 px and 15 px text
  const sizes = (sel) => ev((sel) => [...document.querySelectorAll(sel)].filter((b) => b.offsetParent && !b.hidden).map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 18), w: Math.round(r.width), h: Math.round(r.height), f: parseFloat(getComputedStyle(b).fontSize) }; }), sel);
  const big = (l) => l.length > 0 && l.every((b) => b.w >= 44 && b.h >= 44 && b.f >= 15);
  const at = async (k) => {
    await ev((k) => { const s = window.__paw.S; s.sleeping = false; s.place = k; window.__paw.go('yard'); }, k);
    await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.querySelector('#placeBtns [data-tk]'), k, 6000); await t.lu(); await t.sleep(500);
  };
  // the hot spots inside the view: their size on screen and whether the topmost element at their middle is the hot spot itself
  const hotsSeen = () => ev(() => {
    const v = document.getElementById('view').getBoundingClientRect(), out = [];
    document.querySelectorAll('#sceneG [data-hot]').forEach((g) => {
      const r = g.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < v.left + 4 || cx > v.right - 4 || cy < v.top + 4 || cy > v.bottom - 4) return;
      const e = document.elementFromPoint(cx, cy), free = !!e && (g.contains(e) || e === g);
      out.push({ id: g.getAttribute('data-hot'), w: Math.round(r.width), h: Math.round(r.height), free, top: e ? (e.id || e.className.baseVal || e.className || e.tagName) : null });
    });
    return out;
  });

  sec('iPhone 15: the town map Station pin and the ticket window');
  await t.newGame({ device: 'iPhone 15', prefs: { tkTest: true } }, { coins: 2000, bond: { level: 6, pts: 1500 } });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); });
  await t.calm(); await t.home('yard'); await t.lu();
  await p().tap('[data-act=map]'); await t.untilMode('map'); await ev(() => window.__paw.mapTo('station')); await t.sleep(400);
  const pin = await ev(() => { const r = document.querySelector('[data-area=station]').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  ok(pin.w >= 44 && pin.h >= 44, `the Station pin is at least 44 px (${pin.w} x ${pin.h})`);
  await t.SH('townmap');
  await ev(() => document.querySelector('[data-area=station]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await t.until(() => { const c = document.getElementById('mapGo'); return !!c && !c.hidden; }, null, 3000);
  ok(big(await sizes('#mapGo .btn')) && /Go to Station/.test(await ev(() => document.getElementById('mapGo').textContent)), 'the confirm chip: Go to Station, 44 px buttons');
  await p().tap('#mapGoBtn'); await t.waitH2(/Station/);
  ok(big(await sizes('#modal .btn')) && await noSide(), 'the ticket window: 44 px buttons, no sideways scroll');
  ok(await ev(() => [...document.querySelectorAll('#modal .panel p')].every((e) => parseFloat(getComputedStyle(e).fontSize) >= 15)), 'the ticket window text is at least 15 px');
  await t.SH('station');
  await motion(true); await p().tap('#tkGo'); await t.until(() => !!document.querySelector('.tk-ride'), null, 3000); await t.sleep(1500);
  ok(big(await sizes('.tk-ride .tk-skip')) && await noSide(), 'the ride: the skip button is 44 px, no sideways scroll');
  ok(await ev(() => { const r = document.querySelector('.tk-ride svg').getBoundingClientRect(); return r.width <= window.innerWidth + 1 && r.height > 150; }), 'the ride fits the phone width');
  await t.SH('ride');
  await p().tap('.tk-ride'); await t.untilMode('japan', 3000); await motion(false);

  sec('iPhone 15: the Japan map');
  await quiet(); await t.sleep(500);
  const pins = await ev(() => [...document.querySelectorAll('#mapInner [data-area]')].map((g) => { const r = g.getBoundingClientRect(), tx = g.querySelector('text'), tr = tx ? tx.getBoundingClientRect() : null; return { k: g.getAttribute('data-area'), w: Math.round(r.width), h: Math.round(r.height), th: tr ? Math.round(tr.height) : 99 }; }));
  ok(pins.length === 7 && pins.every((q) => q.w >= 44 && q.h >= 44), 'every pin is at least 44 px: ' + pins.map((q) => q.k + ' ' + q.w).join(', '));
  ok(pins.every((q) => q.th >= 15), 'every pin name is at least 15 px tall: ' + pins.map((q) => q.th).join(','));
  ok(big(await sizes('#tkBookBtn, #mapZoom .btn')), 'the Stamp book and zoom buttons are 44 px');
  ok(await noSide(), 'no sideways scroll on the Japan map');
  await t.SH('japanmap');
  const tx0 = await ev(() => document.getElementById('mapInner').style.transform);
  const box = await ev(() => { const r = document.getElementById('mapPan').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p().mouse.move(box.x, box.y); await p().mouse.down(); await p().mouse.move(box.x - 120, box.y - 20, { steps: 8 }); await p().mouse.up();
  ok(await ev((a) => document.getElementById('mapInner').style.transform !== a, tx0), 'the Japan map pans with a drag');
  await ev(() => document.querySelector('#mapInner [data-area=shibuya]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await t.until(() => { const c = document.getElementById('mapGo'); return !!c && !c.hidden; }, null, 3000);
  ok(big(await sizes('#mapGo .btn')) && /Go to Shibuya Crossing/.test(await ev(() => document.getElementById('mapGo').textContent)), 'tapping a pin shows the confirm chip (Go to Shibuya Crossing)');
  await p().tap('#mapGoBtn');
  await t.until(() => window.__paw.S.place === 'shibuya' && window.__paw.mode === 'yard' && !!document.querySelector('#placeBtns [data-tk]'), null, 6000); await t.lu();

  sec('iPhone 15: every Tokyo place');
  for (const k of ['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba']) {
    await at(k); await quiet();
    ok(await ev(() => document.querySelectorAll('#pack .rmdog').length === 3), `${k}: the whole pack`);
    const bs = await sizes('#placeBtns .btn');
    ok(big(bs), `${k}: place buttons 44 px and 15 px: ` + bs.map((b) => `${b.t} ${b.w}x${b.h}/${b.f}`).join(', '));
    const hs = await hotsSeen();
    ok(hs.every((h) => h.w >= 44 && h.h >= 44), `${k}: the hot spots in view (${hs.length}) are 44 px: ` + hs.map((h) => `${h.id} ${h.w}x${h.h}`).join(', '));
    ok(hs.every((h) => h.free), `${k}: nothing covers a hot spot in view: ` + hs.filter((h) => !h.free).map((h) => h.id + ' under ' + h.top).join(', '));
    ok(await ev(() => { const v = document.getElementById('view').getBoundingClientRect(); return [...document.querySelectorAll('#placeBtns .btn')].every((b) => { const r = b.getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1 && r.bottom <= v.bottom + 1; }); }), `${k}: the place buttons sit inside the view`);
    ok(await ev(() => { const h = document.getElementById('dogHit').getBoundingClientRect(); return h.width >= 44 && h.height >= 44; }), `${k}: the leader's tap rect is 44 px`);
    ok(await noSide(), `${k}: no sideways scroll`);
    await t.SH('place_' + k);
  }

  sec('iPhone 15: the Stamp book and the omikuji sheet');
  await ev(() => window.__paw.tk.book()); await t.waitH2(/Stamp book/);
  ok(await noSide() && await ev(() => { const r = document.querySelector('#modal .panel').getBoundingClientRect(); return r.left >= -1 && r.right <= window.innerWidth + 1; }), 'the Stamp book fits the phone width');
  ok(await ev(() => [...document.querySelectorAll('#modal .tk-stamp b')].every((e) => parseFloat(getComputedStyle(e).fontSize) >= 15)), 'the stamp names are at least 15 px');
  await t.SH('book'); await t.closeX();
  await at('asakusa');
  await ev(() => window.__paw.tk.hot('omikuji')); await t.waitH2(/Omikuji/);
  ok(big(await sizes('#modal .foot .btn')) && await noSide(), 'the omikuji sheet: a 44 px button, no sideways scroll');
  await t.SH('omikuji'); await t.closeX();
  await ev(() => window.__paw.tk.hot('nakamise')); await t.waitH2(/Nakamise/);
  ok(big(await sizes('#modal .sitem .btn')) && await noSide(), 'the Nakamise sheet: 44 px buttons, no sideways scroll');
  await t.closeX();
  await t.ctx.close();
});
