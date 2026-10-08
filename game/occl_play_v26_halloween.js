// v2.6 HALLOWEEN lane: occlusion of the Pumpkin Patch Pop-up and the four 2026 yard decorations. Loaded by test_phone_occl_play.js (see its HOOK note).
// Halloween on (the Dev panel Festival select) and the harness gate open (__paw.hw.allow): the Square with the pop-up, the Harvest Stall and the
// parade banner, then the yard with all four decorations out. Nothing covers #dogHit, the pop-up and decoration tap rects stay clear of the dog,
// the HUD, the bar, the location chip and the place buttons. The pop-up only exists inside the 2026 window (8 Oct to 2 Nov, JST): on a later run
// date the Square part says so and only the decorations (owned items stay forever) are checked. Everything is switched back off at the end.
const setFest = (H, v) => H.ev((v) => {
  const b = document.getElementById('devBtn'); if (b) b.click();
  const s = document.getElementById('dvFest'); if (s) { s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }
  const x = document.getElementById('dvX'); if (x) x.click();
  return !!s;
}, v);
const quiet = (H) => H.ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; });
const FRONT = ['#hud', '#bar', '#status:not(:empty)', '#placeBtns .btn'];
const DECOR = ['Jack-o-Lantern Trio', 'Paper Bat Bunting', 'Friendly Scarecrow', 'Ghost Garland'];
const on = async (H, v) => { await setFest(H, v ? 'halloween' : 'off'); return H.ev((v) => { window.__paw.hw.allow(v); return window.__paw.hw.on(); }, v); };

async function square(H, tag) {
  const { ok, ev, check, clear, at, t } = H;
  if (!(await ev(() => window.__paw.hw.on()))) { ok(true, `${tag} square: the pop-up is outside its 2026 dates on this run, skipped`); return; }
  await at('square'); await quiet(H); await H.settle(['#hwPopG', '#fsStallG', '#fsBannerG']);
  ok(await ev(() => !!document.querySelector('#hwPopG .fs-hit') && !!document.querySelector('#fsStallG .fs-hit') && !!document.querySelector('#fsBannerG')), `${tag} square: the pop-up, the stall and the banner are up`);
  await t.SH(tag + '_hw_square');
  await check(`${tag} square (pop-up)`, '#dogHit', H.COVER);
  await check(`${tag} square (pop-up)`, '#hwPopG .fs-hit', H.COVER, [[0.5, 0.5], [0.3, 0.6], [0.7, 0.6]]);
  await clear(`${tag} square (pop-up)`, '#hwPopG > svg', ['#dogHit', '#fsStallG > svg', '#fsBannerG > svg', '#phPeek'].concat(FRONT), 0.04);
  await clear(`${tag} square (pop-up)`, '#dogHit', ['#placeBtns .btn'], 0.15);
}
async function yard(H, tag) {
  const { ok, ev, check, clear, at, t } = H;
  await ev((ns) => { const S = window.__paw.S; S.decor = S.decor || {}; window.__hwKeep = JSON.stringify(S.decor); ns.forEach((n) => { S.decor[n] = { got: '2026-10-20', out: true }; }); }, DECOR);
  await at('yard'); await quiet(H); await H.settle(['#decorG']);
  ok(await ev((ns) => ns.every((n) => !!document.querySelector(`#decorG [data-decor="${n}"] > rect`)), DECOR), `${tag} yard: the four 2026 decorations are out`);
  await t.SH(tag + '_hw_yard');
  await check(`${tag} yard (2026 decor)`, '#dogHit', H.COVER);
  // the ones in the camera crop now: not covered by anything on top; every one (in view or panned to): clear of the dog, the bowl and the chrome
  const vis = await ev((ns) => ns.filter((n) => { const r = document.querySelector(`#decorG [data-decor="${n}"] > rect`).getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1; }), DECOR);
  ok(true, `${tag} yard: ${vis.length} of 4 in the camera crop now (${vis.join(', ')}), the rest pan into view`);
  for (const n of vis) await check(`${tag} yard (2026 decor)`, `#decorG [data-decor="${n}"] > rect`, H.COVER, [[0.5, 0.5]]);
  for (const n of DECOR) await clear(`${tag} yard (2026 decor)`, `#decorG [data-decor="${n}"] > rect`, ['#dogHit', '#bowlG'].concat(FRONT), 0);
  await ev(() => { window.__paw.S.decor = JSON.parse(window.__hwKeep); }); await at('yard'); // the hooks after this one see the yard they started with
}

module.exports = {
  name: 'v2.6 halloween (pop-up, 2026 decorations)',
  phone: async (H, w, h, tag) => {
    H.ok(await setFest(H, 'halloween'), `${tag}: Halloween on`); await on(H, true);
    await square(H, tag); await yard(H, tag);
    await on(H, false);
  },
  once: async (H) => {
    const { ok, ev, check, at, t } = H;
    await on(H, true);
    if (await ev(() => window.__paw.hw.on())) {
      await at('square'); await H.p.locator('[data-fs=fest]').first().tap(); await t.until(() => !!document.querySelector('#modal:not([hidden]) [data-fsgo=popup]'), null, 5000); await H.settle(['#modal .panel']);
      await check('390x844 festival chooser', '#modal [data-fsgo=popup]', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5]]);
      await H.p.locator('#modal [data-fsgo=popup]').tap(); ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.hw-pop'), null, 5000), '390x844: the chooser row opens the pop-up sheet'); await H.settle(['#modal .panel']);
      await check('390x844 pop-up sheet', '#modal .panel .x', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5]]);
      await check('390x844 pop-up sheet', '#modal .hw-sec:first-of-type .sitem:nth-child(-n+2)', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.3]]);
      await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); }); await t.modalGone();
    } else ok(true, '390x844: the pop-up is outside its 2026 dates on this run, chooser skipped');
    await on(H, false);
  },
  desk: async (H) => {
    H.ok(await setFest(H, 'halloween'), 'desktop: Halloween on'); await on(H, true);
    await square(H, 'desktop');
    if (await H.ev(() => window.__paw.hw.on())) await H.check('desktop square (pop-up)', '#placeBtns [data-hw]', '#bar,#hud,#toasts .toast,#modal:not([hidden]) .panel', [[0.5, 0.5]]);
    await yard(H, 'desktop');
    await on(H, false);
  }
};
