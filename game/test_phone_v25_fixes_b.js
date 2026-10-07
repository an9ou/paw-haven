// v2.5 FIXES B on phones (iPhone 13 and Pixel 7, portrait): the owner's v2.4 feedback, items 2, 4, 6 and 7 (V25.md 7b).
//  7  fetch started from the Play tray (house and yard): the whole scene, the dog and the ball show, the panel sits under them
//  6  a finger or mouse drag pans the yard, the house, the town places and the map; a drag never taps what it started on; taps still work
//  2  the bowl is hidden, shows with the Feed tray and holds the food while the dog eats
//  4  napping in the house: the whole dog is on the bed and in view
const { run } = require('./test_lib');
run('phone_v25_fixes_b', async (t) => {
  const { ok, sec, ev } = t;
  // a real touch drag (CDP touch events: the browser decides about its own gestures exactly as on a phone)
  const touchDrag = async (x0, y0, x1, y1, steps = 12) => {
    const c = await t.p.context().newCDPSession(t.p);
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= steps; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps }] }); await t.sleep(16); }
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach();
  };
  const mouseDrag = async (x0, y0, x1, y1) => { const m = t.p.mouse; await m.move(x0, y0); await m.down(); for (let i = 1; i <= 12; i++) { await m.move(x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * i / 12); await t.sleep(16); } await m.up(); };
  // the camera centre (Market Street re-applies its zoom on the first camera move, so the crop's x alone can shift: a known v2.3 quirk)
  const camX = () => ev(() => { const v = document.querySelector('#view > svg.world').viewBox.baseVal; return v.x + v.width / 2; });
  const camSteady = () => t.until(() => { const x = document.querySelector('#view > svg.world').viewBox.baseVal.x, st = window.__fbCam !== undefined && Math.abs(window.__fbCam - x) < 0.05; window.__fbCam = x; return st; }, null, 8000);
  const opened = () => ev(() => !document.getElementById('modal').hidden || !!document.querySelector('#dock > .tray:not(.dock-idle):not(.mini)') || !!document.querySelector('#mapGo:not([hidden])'));
  // open ground in the scene: not the dog, a prop, a button or the place tag
  const ground = () => ev(() => { const v = document.querySelector('#view > svg.world').getBoundingClientRect(); for (let y = v.top + v.height * 0.3; y < v.bottom - 40; y += 24) for (let x = innerWidth - 40; x > 40; x -= 24) { const e = document.elementFromPoint(x, y); if (e && e.closest('#view svg.world') && !e.closest('#dogHit, .hot, [data-hot], [data-shop], [data-dog], [role=button]')) return [x, y]; } return null; });
  // a prop the player can tap that is on screen and not under the dog
  const onScreenProp = () => ev(() => { for (const e of document.querySelectorAll('#view svg.world [data-hot], #view svg.world [data-shop], #mailboxG')) { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (r.width < 30 || x < 50 || x > innerWidth - 50 || y > innerHeight - 120) continue; const h = document.elementFromPoint(x, y); if (h && e.contains(h)) return { sel: e.id ? '#' + e.id : e.hasAttribute('data-shop') ? `[data-shop="${e.getAttribute('data-shop')}"]` : `[data-hot="${e.getAttribute('data-hot')}"]`, x, y }; } return null; });

  for (const device of ['iPhone 13', 'Pixel 7']) {
    const tag = device === 'iPhone 13' ? 'iPhone' : 'Pixel';
    await t.newGame({ device }, { inv: { toys: { 'Tennis Ball': 1 }, food: { 'Basic Kibble': 5, 'Carrot Sticks': 5 } }, stats: { hunger: 40, happy: 80, energy: 90, clean: 90 } });
    if (device === 'iPhone 13') await t.p.setViewportSize({ width: 390, height: 844 }); // the owner's phone: Safari with the bars hidden
    const p = t.p; await t.freezeMotion(true);

    sec(`${tag}: 7. fetch from the Play tray shows the whole scene, the dog and the panel apart`);
    for (const pl of ['house', 'yard']) {
      await t.home(pl); await t.sleep(300);
      await p.locator('[data-act=play]').tap(); await t.waitPop(true);
      await p.locator('[data-play="fetch:Tennis Ball"]').tap();
      ok(await t.until(() => window.__paw.mode === 'fetch' && !!document.getElementById('fQuit'), null, 6000), `${tag} ${pl}: fetch opens`);
      await t.sleep(400);
      const L = await ev(() => { const R = (s) => { const q = document.querySelector(s).getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom]; }; const sv = document.querySelector('#view svg.world'); return { svg: R('#view svg.world'), dog: R('#dogArt'), tray: R('#dock .tray'), vb: sv.getAttribute('viewBox'), trayH: document.getElementById('view').style.getPropertyValue('--trayH'), w: innerWidth, sw: document.documentElement.scrollWidth }; });
      const sh = L.svg[3] - L.svg[1], sw = L.svg[2] - L.svg[0];
      ok(!L.trayH && sh >= 0.58 * sw && sh <= 0.62 * sw && sw >= L.w - 1 && L.vb === '0 0 1000 600', `${tag} ${pl}: the scene is its full 1000 x 600 at the phone's width (${Math.round(sw)} x ${Math.round(sh)}), no leftover tray height`);
      ok(L.dog[3] - L.dog[1] > 40 && L.dog[0] >= L.svg[0] && L.dog[2] <= L.svg[2] && L.dog[1] >= L.svg[1] && L.dog[3] <= L.svg[3], `${tag} ${pl}: the whole dog is in the scene ${JSON.stringify(L.dog.map(Math.round))}`);
      ok(L.tray[1] >= L.svg[3] - 1, `${tag} ${pl}: the fetch panel sits under the scene, clear of the dog and the ball`);
      ok(L.sw <= L.w, `${tag} ${pl}: no sideways scroll`);
      // a throw: the ball and the landing ring stay inside the scene for the whole flight
      await p.touchscreen.tap(L.svg[0] + sw * 0.86, L.svg[1] + sh * 0.86);
      let inside = true, seen = 0;
      for (let i = 0; i < 8; i++) { await t.sleep(110); const b = await ev(() => { const g = document.getElementById('ballG'), s = document.querySelector('#view svg.world').getBoundingClientRect(); if (!g || g.getAttribute('opacity') === '0') return null; const r = g.getBoundingClientRect(); return r.width ? r.left >= s.left - 1 && r.right <= s.right + 1 && r.top >= s.top - 1 && r.bottom <= s.bottom + 1 : null; }); if (b !== null) { seen++; inside = inside && b; } }
      ok(seen >= 3 && inside, `${tag} ${pl}: the ball stays in view through the throw (${seen} frames)`);
      if (pl === 'house') await t.SH(`7_fetch_${tag}`);
      await p.locator('#fQuit').tap(); await p.waitForSelector('#fOk'); await p.locator('#fOk').tap();
      await t.untilMode('yard'); await t.lu();
      ok(await ev(() => !document.getElementById('view').style.flex), `${tag} ${pl}: back home, the view has its usual size`);
    }

    sec(`${tag}: 6. drag to pan in the yard, the house and the town places`);
    for (const pl of ['yard', 'house', 'square', 'cafe', 'dogpark', 'market']) {
      await t.home(pl); await camSteady();
      const g = await ground(); if (!ok(!!g, `${tag} ${pl}: open ground to drag on`)) continue;
      const x0 = await camX();
      await touchDrag(g[0], g[1], Math.max(10, g[0] - 220), g[1] + 10);
      const x1 = await camX();
      ok(x1 > x0 + 80, `${tag} ${pl}: a finger drag pans the view (${Math.round(x0)} -> ${Math.round(x1)})`);
      ok(!(await opened()), `${tag} ${pl}: the drag opens nothing`);
      await camSteady();
    }
    // a mouse drag pans too (a phone-sized window on a computer)
    await t.home('yard'); await camSteady();
    { const g = await ground(), x0 = await camX(); await mouseDrag(g[0], g[1], Math.max(10, g[0] - 220), g[1]); const x1 = await camX(); ok(x1 > x0 + 80, `${tag}: a mouse drag pans the yard (${Math.round(x0)} -> ${Math.round(x1)})`); }
    // a tap on a prop or a shop opens it; a drag that starts on it pans and opens nothing. (The tap comes first: Chromium drops
    // the click of a tap made within about half a second of a finger drag, on any page.)
    for (const pl of ['yard', 'square', 'cafe', 'market']) {
      await t.home(pl); await camSteady();
      const pr = await onScreenProp(); if (!pr) { ok(true, `${tag} ${pl}: no prop on screen at the camera home (nothing to check)`); continue; }
      await p.touchscreen.tap(pr.x, pr.y);
      ok(await t.until(() => !document.getElementById('modal').hidden || !!document.querySelector('#dock > .tray:not(.dock-idle):not(.mini)'), null, 3000), `${tag} ${pl}: a tap on ${pr.sel} opens it`);
      await t.closeX(); await p.keyboard.press('Escape'); await t.modalGone(); await t.home(pl); await camSteady();
      const x0 = await camX();
      await touchDrag(pr.x, pr.y, Math.max(10, pr.x - 200), pr.y);
      ok(!(await opened()) && (await camX()) > x0 + 60, `${tag} ${pl}: a drag from ${pr.sel} pans and opens nothing`);
      ok(await t.until((x0) => { const v = document.querySelector('#view > svg.world').viewBox.baseVal; return Math.abs(v.x + v.width / 2 - x0) < 3; }, x0, 9000), `${tag} ${pl}: the view eases back to the dog after the drag`);
    }
    sec(`${tag}: 6. the map pans with a finger and the drag picks no place`);
    await t.home('yard'); await p.locator('[data-act=map]').tap(); await p.waitForSelector('[data-area=park]'); await t.sleep(300);
    { const area = () => ev(() => { for (const e of document.querySelectorAll('[data-area]')) { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (x > 60 && x < innerWidth - 60 && y > 160 && y < innerHeight - 200) return [x, y]; } return null; });
      const a = await area(); ok(!!a, `${tag}: a place on the map is on screen`);
      await p.touchscreen.tap(a[0], a[1]);
      ok(await t.until(() => !!document.querySelector('#mapGo:not([hidden])'), null, 3000), `${tag}: a tap on a place picks it (the go chip shows)`);
      await ev(() => { document.getElementById('mapGo').hidden = true; });
      const tr0 = await ev(() => document.getElementById('mapInner').style.transform);
      await touchDrag(a[0], a[1], a[0] - 150, a[1] - 120);
      const tr1 = await ev(() => document.getElementById('mapInner').style.transform);
      ok(tr1 !== tr0, `${tag}: a finger drag pans the map (${tr0} -> ${tr1})`);
      ok(!(await opened()) && (await t.mode()) === 'map', `${tag}: the drag that started on a place picks nothing`);
      const m0 = tr1; await mouseDrag(a[0] - 150, a[1] - 120, a[0] - 40, a[1] - 40);
      ok((await ev(() => document.getElementById('mapInner').style.transform)) !== m0 && !(await opened()), `${tag}: a mouse drag pans the map too`);
      await t.SH(`6_map_${tag}`);
      await t.home('yard'); }

    sec(`${tag}: 2. the bowl only while feeding`);
    await t.home('yard'); await camSteady();
    ok(await ev(() => getComputedStyle(document.getElementById('bowlG')).visibility === 'hidden'), `${tag}: no bowl in the yard`);
    await p.locator('[data-act=feed]').tap(); await t.waitPop(true);
    const bw = await ev(() => { const b = document.getElementById('bowlG'), r = b.getBoundingClientRect(); return { shown: getComputedStyle(b).visibility !== 'hidden', w: r.width, h: r.height, on: r.left >= 0 && r.right <= innerWidth }; });
    ok(bw.shown && bw.w >= 44 && bw.h >= 44 && bw.on, `${tag}: the Feed tray shows the bowl on screen (${Math.round(bw.w)} x ${Math.round(bw.h)})`);
    await ev(() => { window.__paw.S.stats.hunger = 10; });
    await p.locator('[data-food="Basic Kibble"]').tap();
    ok(await t.until(() => window.__paw.S.bowl === 'Basic Kibble' && getComputedStyle(document.getElementById('bowlG')).visibility !== 'hidden' && /Basic Kibble/.test(document.getElementById('bowlG').getAttribute('aria-label')), null, 3000), `${tag}: the kibble is in the bowl while the dog eats`);
    await t.sleep(900); await t.SH(`2_feed_${tag}`);
    ok(await t.until(() => window.__paw.S.bowl == null && getComputedStyle(document.getElementById('bowlG')).visibility === 'hidden', null, 5000), `${tag}: the bowl goes after the meal`);
    await t.home('square'); await ev(() => { window.__paw.S.stats.hunger = 10; });
    await p.locator('[data-act=feed]').tap(); await t.waitPop(true); await p.locator('[data-food="Carrot Sticks"]').tap();
    ok(await t.until(() => /Carrot Sticks/.test(document.getElementById('bowlG').getAttribute('aria-label')) && getComputedStyle(document.getElementById('bowlG')).visibility !== 'hidden', null, 3000), `${tag}: away in the Square, the snack is in the bowl too`);
    await t.until(() => window.__paw.S.bowl == null, null, 5000);

    sec(`${tag}: 4. napping in the house`);
    for (const [bed, hat] of [['Old Blanket', 'Wizard Hat'], ['Hammock Cot', null], ['Royal Canopy Bed', 'Wizard Hat']]) {
      await ev(([bed, hat]) => { const S = window.__paw.S; S.beds = [bed]; S.bed = bed; S.outfit.head = hat; S.dogs[0].outfit.head = hat; S.place = 'house'; S.sleeping = true; S.stats.energy = 30; window.__paw.go('yard'); }, [bed, hat]);
      await t.until(() => document.getElementById('dogArt').hasAttribute('transform'), null, 5000); // the sleeping art is fitted to the bed (a pose left from the last action may show for a moment)
      const r = await ev(() => { const R = (e) => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom]; }; const f = document.querySelector('#bedFront .pa-bed-front'); return { dog: R(document.getElementById('dogArt')), bed: R(document.getElementById('bedG')), lip: f ? R(f)[1] : null, view: R(document.querySelector('#view svg.world')), w: innerWidth, h: innerHeight }; });
      const [x0, y0, x1, y1] = r.dog, above = (Math.min(y1, r.lip == null ? y1 : r.lip) - y0) / (y1 - y0), cx = (x0 + x1) / 2;
      ok(x0 >= 0 && x1 <= r.w && y0 >= r.view[1] && y1 <= Math.min(r.view[3], r.h), `${tag} ${bed}: the sleeping dog is on screen ${JSON.stringify(r.dog.map(Math.round))}`);
      ok(cx > r.bed[0] && cx < r.bed[2] && above >= 0.8, `${tag} ${bed}${hat ? ' (' + hat + ')' : ''}: the dog lies on the bed, ${Math.round(above * 100)}% above the front lip`);
    }
    await t.SH(`4_nap_${tag}`);
    await ev(() => { const S = window.__paw.S; S.sleeping = false; S.outfit.head = null; window.__paw.go('yard'); });
    await t.ctx.close();
  }
}, { timeout: 420000 });
