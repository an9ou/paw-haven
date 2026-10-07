// v2.4 GUIDE lane, phones (V24.md section 5): on iPhone 13 (390x844) and Pixel 7 (412x915) every step's Gerald strip has 44 px buttons and 15 px text,
// never intersects #dogHit or the ringed button, and the page never scrolls sideways. Also the How to play tab on a phone.
// node game/run_tests.js phone_v24_guide   (--shots writes every step to game/shots_phone_v24_guide/)
const { run } = require('./test_lib');

(async () => {
  for (const [dev, W, H] of [['iPhone 13', 390, 844], ['Pixel 7', 412, 915]]) {
    await run(`phone_v24_guide`, async (t) => {
      const { ok, sec } = t; const tag = dev.replace(/\W/g, '').toLowerCase();
      sec(`${dev} ${W}x${H}`);
      await t.newGame({ device: dev, prefs: { gdTest: true } }, { bond: { level: 1, pts: 0 }, coins: 50, stats: { hunger: 50, happy: 70, energy: 60, clean: 90 } });
      const p = t.p; await p.setViewportSize({ width: W, height: H }); await t.until((w) => innerWidth === w, W, 5000); await t.freezeMotion(true);
      const atStep = (i) => t.until((i) => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden && +c.dataset.step === i; }, i, 8000);
      const measure = () => t.ev(() => {
        const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
        const c = document.querySelector('#gdLayer .gd-card'), ring = document.querySelector('#gdLayer .gd-ring');
        const btns = [...c.querySelectorAll('.btn')].filter((b) => !b.hidden).map((b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, fs: parseFloat(getComputedStyle(b).fontSize), top: (() => { const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && b.contains(e); })() }; });
        return { card: R(c), dog: R(document.getElementById('dogHit')), tgt: ring && !ring.hidden && ring.dataset.for !== '#dogHit' ? R(document.querySelector(ring.dataset.for)) : null, ringFor: ring && !ring.hidden ? ring.dataset.for : null,
          toasts: [...document.querySelectorAll('#toasts .toast')].map((e) => R(e)), at: c.dataset.at, skip: (() => { const b = c.querySelector('.gd-skip'); return b && !b.hidden ? [b.innerText.trim(), b.getAttribute('aria-label'), Math.round(b.getBoundingClientRect().height)] : null; })(),
          btns, txt: parseFloat(getComputedStyle(c.querySelector('.gd-txt')).fontSize), sw: document.documentElement.scrollWidth, iw: innerWidth, vw: document.getElementById('view').getBoundingClientRect() };
      });
      const check = async (i, label) => {
        ok(await atStep(i), `${tag} step ${i} (${label}) shows`);
        let m = null;
        // the camera may still be settling on the dog: wait until the strip is clear of it, then measure
        await t.until(() => { const c = document.querySelector('#gdLayer .gd-card'), d = document.getElementById('dogHit'); if (!c || c.hidden || !d) return false; const a = c.getBoundingClientRect(), b = d.getBoundingClientRect(); return !(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top); }, null, 4000);
        m = await measure();
        ok(!t.hitR(m.card, m.dog), `${tag} step ${i}: the strip never covers #dogHit ${JSON.stringify(m.card.map(Math.round))} vs ${JSON.stringify(m.dog.map(Math.round))}`);
        ok(!m.tgt || !t.hitR(m.card, m.tgt), `${tag} step ${i}: the strip clears ${m.ringFor}`);
        ok(m.btns.length >= 1 && m.btns.every((b) => b.h >= 44 && b.w >= 44), `${tag} step ${i}: buttons 44 px or more ${JSON.stringify(m.btns.map((b) => [Math.round(b.w), Math.round(b.h)]))}`);
        ok(m.btns.every((b) => b.fs >= 15) && m.txt >= 15, `${tag} step ${i}: 15 px text (text ${m.txt}, buttons ${m.btns.map((b) => b.fs)})`);
        ok(m.btns.every((b) => b.top), `${tag} step ${i}: the buttons are tappable (nothing on top)`);
        ok(!m.toasts.some((r) => t.hitR(r, m.card)), `${tag} step ${i}: no toast sits on the strip (${m.at}, ${m.toasts.length} toasts)`);
        if (m.skip) ok(m.skip[0] === 'Skip' && m.skip[1] === 'Skip the guide' && m.skip[2] >= 44, `${tag} step ${i}: Skip reads "Skip" on one line (${JSON.stringify(m.skip)})`);
        ok(m.sw <= m.iw, `${tag} step ${i}: no sideways scroll (${m.sw} <= ${m.iw})`);
        ok(m.card[0] >= 0 && m.card[2] <= m.iw + 1 && m.card[1] >= m.vw.top - 2 && m.card[3] <= m.vw.bottom + 2, `${tag} step ${i}: the strip stays inside the scene`);
        await t.SH(`${tag}_step${i}_${label}`);
      };
      // a toast up at steps 0 and 1: measured in viewport coordinates against the strip (a plain .toast is added if the start-of-game ones timed out)
      const toastCheck = async (i) => {
        ok(await atStep(i), `${tag} step ${i} shows`);
        await t.ev(() => { const box = document.getElementById('toasts'); if (box.querySelector('.toast')) return; const d = document.createElement('div'); d.className = 'toast'; d.textContent = 'Rub the dog to pet.'; box.appendChild(d); setTimeout(() => d.remove(), 2900); });
        await t.until(() => !!document.querySelector('#toasts .toast'), null, 2000);
        const r = await t.ev(() => { const R = (e) => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom]; }; return { card: R(document.querySelector('#gdLayer .gd-card')), at: document.querySelector('#gdLayer .gd-card').dataset.at, toasts: [...document.querySelectorAll('#toasts .toast')].map(R) }; });
        ok(r.toasts.length > 0 && !r.toasts.some((q) => t.hitR(q, r.card)), `${tag} step ${i} with a toast showing: no toast on the strip (${r.at}) toasts ${JSON.stringify(r.toasts.map((q) => [Math.round(q[1]), Math.round(q[3])]))} vs strip ${Math.round(r.card[1])}-${Math.round(r.card[3])}`);
      };
      const next = () => p.tap('#gdLayer .gd-next');
      const labels = ['hello', 'feed', 'pet', 'nap', 'map', 'walk', 'shops', 'garden', 'missions', 'done'];
      await toastCheck(0); await t.SH(`${tag}_step0_toast`);
      await check(0, 'hello'); await next();
      await toastCheck(1);
      await t.SH(`${tag}_step1_toast`);
      await check(1, 'feed');
      await p.tap('#bar [data-act=feed]'); await t.waitPop(true);
      ok(await t.until(() => document.querySelector('#gdLayer .gd-card').hidden), `${tag}: the strip hides while the Feed sheet is open`);
      await t.retryUntil(() => p.tap('[data-food="Basic Kibble"]'), () => window.__paw.S.guide.step === 2); await t.waitPop(false); await t.calm();
      for (let i = 2; i < 10; i++) { await check(i, labels[i]); if (i < 9) await next(); }
      await next(); ok(await t.until(() => { const c = document.querySelector('#gdLayer .gd-card'); return !c || c.hidden; }), `${tag}: the last button closes the strip`);
      ok(!!(await t.S()).guide.done, `${tag}: S.guide.done is set`);

      sec(`${dev}: How to play`);
      await p.tap('#bar [data-act=journal]'); await p.waitForSelector('[data-jt=howto]'); await p.locator('[data-jt=howto]').scrollIntoViewIfNeeded(); await p.tap('[data-jt=howto]');
      ok(await t.until(() => document.querySelectorAll('.gd-lesson').length === 8), `${tag}: 8 lessons`);
      const tab = await t.ev(() => { const fs = [...document.querySelectorAll('.gd-lesson p')].map((e) => parseFloat(getComputedStyle(e).fontSize)); const b = document.getElementById('gdReplay').getBoundingClientRect(); return { fs: Math.min(...fs), bh: b.height, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
      ok(tab.fs >= 15 && tab.bh >= 44 && tab.sw <= tab.iw, `${tag}: lesson text ${tab.fs} px, Replay ${Math.round(tab.bh)} px, no sideways scroll`);
      await t.SH(`${tag}_howto`); await p.locator('#gdReplay').scrollIntoViewIfNeeded(); await t.SH(`${tag}_howto_end`);
      await p.tap('#gdReplay'); ok(await atStep(0), `${tag}: Replay restarts the guide`);
    }, { device: dev, prefs: { gdTest: true } });
  }
})();
