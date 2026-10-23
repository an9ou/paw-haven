// v2.15 ACTIVITIES phone test (iPhone 15 and Pixel 7), V215.md sections 6 and 11: the new places on a phone.
//   Part 1 (the Training Ground, agility): the course button in the #placeBtns row is 44 px, the one big Go! is 64 px and sits in the thumb zone (the lower
//   half of the screen), the timing window is wider than on a desktop, every tap target in the trays is 44 px, text is 15 px or more, the dog stays in
//   view above the tray, a run finishes with rosettes, nothing scrolls sideways.
//   Part 2 (the Splash Pool): the Splash time button in the #placeBtns row, the tray's taps are 44 px and its text 15 px, a paddle finishes, no sideways scroll.
// node game/run_tests.js phone_v215_places
require('./test_lib').run('phone_v215_places', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a);
  const noSide = () => ev(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
  const errs = [];
  const tapTargets = () => ev(() => [...document.querySelectorAll('#dock .btn, #placeBtns .btn')].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 18), w: Math.round(r.width), h: Math.round(r.height) }; }));
  for (const device of ['iPhone 15', 'Pixel 7']) {
    sec(device + ': the Training Ground');
    await t.newGame({ device, ground: true }, { coins: 2000, bond: { level: 7, pts: 1600 }, stats: { hunger: 90, happy: 80, energy: 100, clean: 90 } });
    t.p.on('pageerror', (e) => errs.push(e.message));
    await t.home('training'); await t.luWait(800); await t.lu(); await t.sleep(600);
    ok(await ev(() => window.__paw.ag.on() && !!document.querySelector('#placeBtns [data-ag]')), 'the agility button is in the #placeBtns row');
    const btn = await t.p.locator('#placeBtns [data-ag]').boundingBox();
    ok(btn.height >= 44 && btn.width >= 44, `the course button is 44 px or more (${Math.round(btn.width)} x ${Math.round(btn.height)})`);
    ok(await noSide(), 'no sideways scroll at the Training Ground');
    await t.SH('phone_training_button');
    await t.p.tap('#placeBtns [data-ag]'); await t.p.waitForSelector('#agStart');
    {
      const tt = await tapTargets(); ok(tt.length && tt.every((b) => b.h >= 44 && b.w >= 44), 'the pick tray: every button is 44 px or more ' + JSON.stringify(tt.filter((b) => b.h < 44 || b.w < 44)));
      const fs = await ev(() => Math.min(...[...document.querySelectorAll('#dock .ag-hint, #dock .ag-dn')].map((e) => parseFloat(getComputedStyle(e).fontSize))));
      ok(fs >= 15, 'the tray text is 15 px or more (' + fs + ')');
    }
    await t.p.tap('#agStart');
    ok(await t.until(() => window.__paw.ag.state && window.__paw.ag.state.ready, null, 9000), 'the first obstacle is ready');
    {
      const st = await ev(() => window.__paw.ag.state); ok(st.hw >= 0.17 - 1e-6, 'the timing window is wider on a phone (half-width ' + st.hw + ' vs 0.12)');
      const go = await t.p.locator('#agGo').boundingBox(), vh = await ev(() => window.innerHeight), vw = await ev(() => window.innerWidth);
      ok(go.height >= 63, `the Go! button is 64 px tall (${Math.round(go.height)})`);
      ok(go.y + go.height / 2 > vh * 0.55 && go.x >= 0 && go.x + go.width <= vw + 1, `Go! sits in the thumb zone (centre ${Math.round(go.y + go.height / 2)} of ${vh}) inside the screen`);
      const dog = await ev(() => { const r = document.querySelector('#dogHit') && document.querySelector('#dogHit').getBoundingClientRect(), d = document.querySelector('#dock .ag-tray').getBoundingClientRect(); return r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right, dockTop: d.top, dockL: d.left, dockR: d.right } : null; });
      ok(!dog || dog.bottom <= dog.dockTop + 6 || dog.right < dog.dockL || dog.left > dog.dockR, 'the dog is not hidden behind the tray ' + JSON.stringify(dog));
      const tt = await tapTargets(); ok(tt.every((b) => b.h >= 44 && b.w >= 44), 'the run tray: every button is 44 px or more');
      const fs = await ev(() => Math.min(...[...document.querySelectorAll('#dock .ag-hint')].map((e) => parseFloat(getComputedStyle(e).fontSize))));
      ok(fs >= 15, 'the hint is 15 px or more (' + fs + ')');
      ok(await noSide(), 'no sideways scroll during the run');
      await t.SH('phone_agility_ready');
    }
    for (let i = 0; i < 5; i++) {
      if (!await t.until(() => { const s = window.__paw.ag.state; return !!s && (s.ready || s.ph === 'done'); }, null, 14000)) break;
      if (await ev(() => window.__paw.ag.state.ph === 'done')) break;
      await ev(() => window.__paw.ag.pin(0.5)); await t.p.tap('#agGo'); await t.sleep(i === 1 ? 700 : 250);
      if (i === 1) await t.SH('phone_agility_mid');
    }
    ok(await t.until(() => { const s = window.__paw.ag.state; return !!s && s.ph === 'done'; }, null, 14000), 'the run finishes on a phone');
    await t.sleep(500);
    ok(await ev(() => window.__paw.ag.state.res.stars === 3 && document.querySelectorAll('.ag-ros-row .ag-ros.on').length === 3), 'three rosettes for five Perfect taps');
    {
      const tt = await tapTargets(); ok(tt.every((b) => b.h >= 44 && b.w >= 44), 'the result tray: every button is 44 px or more');
      ok(await noSide(), 'no sideways scroll at the result');
      await t.SH('phone_agility_rosettes');
    }
    await t.p.tap('#agDone');
    ok(await ev(() => !window.__paw.ag.running() && !!document.querySelector('#placeBtns [data-ag]')), 'Done leaves the course');
    sec(device + ': the Splash Pool');
    await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.stats.energy = 100; d.stats.happy = 40; d.stats.clean = 20; }); });
    await t.home('pool'); await t.luWait(800); await t.lu(); await t.sleep(600);
    ok(await ev(() => window.__paw.pl.on() && !!document.querySelector('#placeBtns [data-pl]')), 'the pool button is in the #placeBtns row');
    {
      const pb = await t.p.locator('#placeBtns [data-pl]').boundingBox();
      ok(pb.height >= 44 && pb.width >= 44, `the pool button is 44 px or more (${Math.round(pb.width)} x ${Math.round(pb.height)})`);
      ok(await noSide(), 'no sideways scroll at the Splash Pool');
      await t.SH('phone_pool_button');
    }
    await t.p.tap('#placeBtns [data-pl]'); await t.p.waitForSelector('#plPaddle');
    {
      const tt = await tapTargets(); ok(tt.length && tt.every((b) => b.h >= 44 && b.w >= 44), 'the pool tray: every button is 44 px or more ' + JSON.stringify(tt.filter((b) => b.h < 44 || b.w < 44)));
      const fs = await ev(() => Math.min(...[...document.querySelectorAll('#dock .pl-hint, #dock .pl-dn, #dock .pl-float b')].map((e) => parseFloat(getComputedStyle(e).fontSize))));
      ok(fs >= 15, 'the tray text is 15 px or more (' + fs + ')');
      ok(await noSide(), 'no sideways scroll with the pool tray open');
      const tray = await ev(() => { const r = document.querySelector('#dock .pl-tray').getBoundingClientRect(); return { b: r.bottom, h: window.innerHeight, w: r.width, vw: window.innerWidth }; });
      ok(tray.b <= tray.h + 1 && tray.w <= tray.vw + 1, 'the tray fits the screen ' + JSON.stringify(tray));
      await t.SH('phone_pool_tray');
    }
    await t.p.tap('#plPaddle');
    ok(await t.until(() => { const s = window.__paw.pl.state; return !!s && s.ph === 'run'; }, null, 4000), 'the paddle starts on a phone');
    await t.sleep(5000); await t.SH('phone_pool_paddle');
    {
      const tt = await tapTargets(); ok(tt.every((b) => b.h >= 44 && b.w >= 44), 'the run tray: every button is 44 px or more');
      ok(await noSide(), 'no sideways scroll during the paddle');
    }
    ok(await t.until(() => { const s = window.__paw.pl.state; return !!s && s.ph === 'done'; }, null, 60000), 'the paddle finishes on a phone');
    {
      const tt = await tapTargets(); ok(tt.every((b) => b.h >= 44 && b.w >= 44), 'the result tray: every button is 44 px or more');
      ok(await noSide(), 'no sideways scroll at the result');
      await t.SH('phone_pool_done');
    }
    await t.p.tap('#plDone');
    ok(await ev(() => !window.__paw.pl.running() && !!document.querySelector('#placeBtns [data-pl]')), 'Done leaves the pool');
  }
  ok(!errs.length, 'no page errors ' + errs.slice(0, 2).join(' | '));
}, { ground: true });
