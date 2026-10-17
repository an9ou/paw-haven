// v2.10 BALL lane test (phone), V210.md sections 2 and 5.4: free ball play on iPhone 15 (390x844) and Pixel 7 (412x915).
// Crop about 900 world units wide, the camera follows the ball, a drag-and-release throw, no toast over the play area, a 44 px Done button, no sideways scroll.
// node game/run_tests.js phone_v210_ball
require('./test_lib').run('phone_v210_ball', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p, S = () => t.S();
  const settled = () => t.until(() => { const tr = document.querySelector('#dock > .tray'); return !!tr && tr.getAnimations({ subtree: true }).every((a) => a.playState !== 'running'); }, null, 3000);
  for (const device of ['iPhone 15', 'Pixel 7']) {
    await t.newGame({ device }, { coins: 500, stats: { hunger: 80, happy: 40, energy: 90, clean: 90 } });
    await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'greyhound', sex: 'female', months: 30 }, 'Pip'); P.S.dogs.forEach((d) => { d.stats.energy = 90; d.sleeping = false; }); });
    for (const place of ['yard', 'house']) {
      const tag = `${device} ${place}`;
      sec(`${tag}: start from the Play tray`);
      await t.home(place); await ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
      await p().click('[data-act=play]'); await t.waitPop(true); await settled();
      const card = p().locator('[data-play="ball:Tennis Ball"]'); ok((await card.count()) === 1, `${tag}: the Play ball card is in the tray`);
      const cb = await card.boundingBox(); ok(cb && cb.height >= 44 && cb.width >= 44, `${tag}: the card is a 44 px tap target (${Math.round(cb.width)}x${Math.round(cb.height)})`);
      await card.tap();
      ok(await t.until(() => window.__paw.bl && window.__paw.bl.on, null, 5000), `${tag}: ball play starts by touch`);
      await ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); window.__paw.bl.sim(1.5); }); await settled();
      const L = await ev(() => {
        const svg = document.querySelector('#view svg.world'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, done = document.getElementById('blDone'), dr = done.getBoundingClientRect(), hint = document.getElementById('blHint'), ring = document.getElementById('blRing').getBoundingClientRect();
        const at = document.elementFromPoint(dr.x + dr.width / 2, dr.y + dr.height / 2);
        return { vbW: vb.width, svg: [r.left, r.top, r.right, r.bottom], done: [dr.x, dr.y, dr.width, dr.height], doneTop: at === done || done.contains(at), hintFont: parseFloat(getComputedStyle(hint).fontSize), coinFont: parseFloat(getComputedStyle(document.getElementById('blCoins')).fontSize),
          ring: [ring.left, ring.top, ring.right, ring.bottom], iw: innerWidth, ih: innerHeight, sw: document.scrollingElement.scrollWidth, bw: document.body.scrollWidth, toasts: (() => { const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top, rg = document.getElementById('blRing').getBoundingClientRect(), dh = document.getElementById('dogHit').getBoundingClientRect(); return [...document.querySelectorAll('#toasts .toast')].filter((e) => { const r = e.getBoundingClientRect(); return hit(r, rg) || hit(r, dh); }).length; })(),
          dockTop: document.querySelector('#dock > .tray').getBoundingClientRect().top, toastTxt: [...document.querySelectorAll('#toasts .toast')].map((e) => e.textContent).join(' | ') };
      });
      ok(L.vbW >= 840 && L.vbW <= 1000, `${tag}: the crop is about 900 world units wide (${Math.round(L.vbW)})`);
      ok(L.done[2] >= 44 && L.done[3] >= 44, `${tag}: Done is at least 44x44 (${Math.round(L.done[2])}x${Math.round(L.done[3])})`);
      ok(L.doneTop, `${tag}: nothing covers the Done button`);
      ok(L.done[1] + L.done[3] <= L.ih + 1 && L.done[0] >= 0 && L.done[0] + L.done[2] <= L.iw + 1, `${tag}: Done is on the screen`);
      ok(L.hintFont >= 15 && L.coinFont >= 15, `${tag}: dock text is 15 px or more (${L.hintFont}, ${L.coinFont})`);
      ok(L.sw <= L.iw + 1 && L.bw <= L.iw + 1, `${tag}: no sideways scroll (${L.sw} / ${L.iw})`);
      ok(L.ring[0] >= L.svg[0] - 2 && L.ring[2] <= L.svg[2] + 2 && L.ring[3] <= L.svg[3] + 2 && L.ring[1] >= L.svg[1] - 2, `${tag}: the ball ring is inside the scene`);
      ok(L.toasts === 0, `${tag}: no toast over the ball or the dog (${L.toastTxt})`);
      ok(L.svg[3] <= L.dockTop + 2, `${tag}: the dock sits under the scene, not on it (scene ends ${Math.round(L.svg[3])}, dock ${Math.round(L.dockTop)})`);
      await t.SH(`${device.replace(' ', '')}_${place}_ball_rest`);

      sec(`${tag}: a touch drag throws, the camera keeps the ball in view`);
      const c = { x: (L.ring[0] + L.ring[2]) / 2, y: (L.ring[1] + L.ring[3]) / 2 };
      const touch = (type, x, y) => ev(([type, x, y]) => { const svg = document.querySelector('#view svg.world'), tgt = type === 'pointerdown' ? (document.elementFromPoint(x, y) || svg) : svg; tgt.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 })); }, [type, x, y]);
      await touch('pointerdown', c.x, c.y);
      ok((await ev(() => window.__paw.bl.state.ball.state)) === 'held', `${tag}: pressing the ball holds it`);
      for (let i = 1; i <= 7; i++) { await touch('pointermove', c.x - i * 14, c.y - i * 22); await t.sleep(14); }
      await touch('pointerup', c.x - 7 * 14, c.y - 7 * 22);
      ok(await t.until(() => window.__paw.bl.state.ph !== 'rest', null, 3000), `${tag}: letting go throws it`);
      let inView = true, worst = 0;
      for (let i = 0; i < 160; i++) {
        await ev(() => window.__paw.bl.sim(0.05));
        const v = await ev(() => { const svg = document.querySelector('#view svg.world'), vb = svg.viewBox.baseVal, s = window.__paw.bl.state; return { x0: vb.x, x1: vb.x + vb.width, bx: s.ball.x, ph: s.ph }; });
        if (v.bx < v.x0 - 1 || v.bx > v.x1 + 1) { inView = false; worst = Math.max(worst, Math.abs(v.bx - (v.bx < v.x0 ? v.x0 : v.x1))); }
        if (v.ph === 'rest') break;
      }
      ok(inView, `${tag}: the ball stays inside the visible crop all the way (${Math.round(worst)} out at worst)`);
      ok((await ev(() => window.__paw.bl.state.n)) >= 1, `${tag}: it came back`);
      const R = await ev(() => { const svg = document.querySelector('#view svg.world'), vb = svg.viewBox.baseVal; return { x0: vb.x, x1: vb.x + vb.width, dogs: window.__paw.bl.dogs.map((d) => d.x), toasts: (() => { const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top, dh = document.getElementById('dogHit').getBoundingClientRect(); return [...document.querySelectorAll('#toasts .toast')].filter((e) => hit(e.getBoundingClientRect(), dh)).length; })(), toastTxt: [...document.querySelectorAll('#toasts .toast')].map((e) => e.textContent).join(' | ') }; });
      ok(R.dogs.every((x) => x >= R.x0 - 40 && x <= R.x1 + 40), `${tag}: every dog is inside the crop at rest (${R.dogs.map(Math.round)} in ${Math.round(R.x0)}..${Math.round(R.x1)})`);
      ok(R.toasts === 0, `${tag}: still no toast over the dog (${R.toastTxt})`);
      await t.SH(`${device.replace(' ', '')}_${place}_ball_after`);

      sec(`${tag}: Done puts the scene back`);
      await p().locator('#blDone').tap(); ok(await t.until(() => !window.__paw.bl.on, null, 3000), `${tag}: Done ends ball play`); await t.lu();
      const E = await ev(() => ({ bar: document.getElementById('bar').hidden, busy: window.__paw.busy, vbW: document.querySelector('#view svg.world').viewBox.baseVal.width, tray: !!document.getElementById('blDone') }));
      ok(!E.bar && !E.busy && !E.tray, `${tag}: the bar is back, the dog is free, the ball tray is gone`);
      ok(E.vbW <= L.vbW + 1, `${tag}: the camera is the normal home crop again, not wider than the ball crop (${Math.round(E.vbW)} <= ${Math.round(L.vbW)})`);
    }
  }
}, { device: 'iPhone 15' });
