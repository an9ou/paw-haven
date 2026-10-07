// v2.5 FESTIVAL lane: occlusion of the festival props. Loaded by test_phone_occl_play.js (see its HOOK note).
// With both festivals on (the Dev panel Festival select): the Square with the Harvest Stall and the parade banner, the yard with the leaf piles
// and the jack-o-lantern. Nothing covers #dogHit, the stall and pile tap rects stay clear of the HUD, the bar, the location chip and the place buttons.
// The festival is switched back off at the end, so the hooks that run after this one see the pinned game.
const setFest = (H, v) => H.ev((v) => {
  const b = document.getElementById('devBtn'); if (b) b.click();
  const s = document.getElementById('dvFest'); if (s) { s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }
  const x = document.getElementById('dvX'); if (x) x.click();
  return !!s;
}, v);
const quiet = (H) => H.ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; });
const FRONT = ['#hud', '#bar', '#status:not(:empty)', '#placeBtns .btn'];

async function square(H, tag) {
  const { ok, ev, check, clear, at, t } = H;
  await at('square'); await quiet(H); await H.settle(['#fsStallG', '#fsBannerG']);
  const g = await ev(() => ({ stall: !!document.querySelector('#fsStallG .fs-hit'), banner: !!document.querySelector('#fsBannerG'), btn: !!document.querySelector('[data-fs=stall]'), parade: !!document.querySelector('[data-fs=parade]') }));
  ok(g.stall && g.banner && g.btn && g.parade, `${tag} square: the stall, the banner and both festival buttons are up`);
  await t.SH(tag + '_fest_square');
  await check(`${tag} square (festival)`, '#dogHit', H.COVER);
  await check(`${tag} square (festival)`, '#fsStallG .fs-hit', H.COVER, [[0.5, 0.5], [0.3, 0.6], [0.7, 0.6]]);
  await clear(`${tag} square (festival)`, '#fsStallG > svg', ['#dogHit'].concat(FRONT), 0.04);
  await clear(`${tag} square (festival)`, '#fsBannerG > svg', ['#dogHit', '#status:not(:empty)', '#placeBtns .btn', '#fsStallG > svg'], 0.04);
  await check(`${tag} square (festival)`, '[data-fs=stall]', '#bar,#hud,#toasts .toast,#modal:not([hidden]) .panel', [[0.5, 0.5]]);
  await clear(`${tag} square (festival)`, '#dogHit', ['#placeBtns .btn'], 0.15);
}
async function yard(H, tag, phone) {
  const { ok, ev, check, clear, at, t } = H;
  await at('yard'); await quiet(H); await H.settle(['#fsPilesG', '#fsPumpkinG']);
  ok(await ev(() => document.querySelectorAll('#fsPilesG [data-pile] > rect').length === 2 && !!document.querySelector('#fsPumpkinG svg')), `${tag} yard: two leaf piles and the jack-o-lantern`);
  await t.SH(tag + '_fest_yard');
  await check(`${tag} yard (festival)`, '#dogHit', H.COVER);
  await check(`${tag} yard (festival)`, '#fsPilesG [data-pile="0"] > rect', H.COVER);
  if (!phone) await check(`${tag} yard (festival)`, '#fsPilesG [data-pile="1"] > rect', H.COVER);
  for (const i of [0, 1]) await clear(`${tag} yard (festival)`, `#fsPilesG [data-pile="${i}"] > rect`, ['#dogHit', '#bowlG'].concat(FRONT), 0);
  await clear(`${tag} yard (festival)`, '#fsPumpkinG svg', ['#dogHit', '#placeBtns .btn', '#status:not(:empty)'], 0);
}

module.exports = {
  name: 'v2.5 festival (stall, banner, leaf piles, jack-o-lantern)',
  phone: async (H, w, h, tag) => {
    H.ok(await setFest(H, 'both'), `${tag}: festival on (both)`);
    await square(H, tag); await yard(H, tag, true);
    await setFest(H, 'off');
  },
  desk: async (H) => {
    H.ok(await setFest(H, 'both'), 'desktop: festival on (both)');
    await square(H, 'desktop'); await yard(H, 'desktop', false);
    await setFest(H, 'off');
  }
};
