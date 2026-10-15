// v2.8 WINTER lane: occlusion of the Winter Stall, the sweater banner, the Fortune box, the snowdrifts, the snowdog and the four winter decorations.
// Loaded by test_phone_occl_play.js (see its HOOK note), like occl_play_v26_halloween.js (V28.md section 9). The Dev panel Festival select gives
// December ('winter': stall + banner) and January ('newyear': stall + Fortune box, once NEW YEAR draws #nyFortuneG), the harness gate is opened with
// __paw.wn.allow(true). The Square with and without a visitor, the yard with both drifts, the finished snowdog and the four winter decorations out.
// Nothing covers #dogHit, the tap rects stay clear of the dog, the HUD, the bar, the location chip and the place buttons, the banner of the
// place labels. Everything is switched back off at the end, so the hooks after this one see the pinned game.
const setFest = (H, v) => H.ev((v) => {
  const b = document.getElementById('devBtn'); if (b) b.click();
  const s = document.getElementById('dvFest'); if (s) { s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }
  const x = document.getElementById('dvX'); if (x) x.click();
  return !!s;
}, v);
const quiet = (H) => H.ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; });
const FRONT = ['#hud', '#bar', '#status:not(:empty)', '#placeBtns .btn'];
const DECOR = ['Paper Snowflake Garland', 'Felt Holly Wreath', 'Red Wooden Sled', 'Kadomatsu Pair'];
const on = async (H, v) => { const ok = await setFest(H, v || 'off'); await H.ev((v) => window.__paw.wn.allow(v), !!v); return ok; };

async function square(H, tag, visitor, jan) {
  const { ok, ev, check, clear, at, t } = H;
  await at('square');
  if (visitor) { // two pack dogs and a visiting pup: the phone crop shifts right and zooms out (the v2.6 TODO case), the stall and the box follow it
    await ev(() => { const P = window.__paw, S = P.S; window.__wnN = S.dogs.length; while (S.dogs.length < 3) P.addDog({ key: ['corgi', 'golden'][S.dogs.length - 1], sex: 'male', months: 20 }, ['Biscuit', 'Pal'][S.dogs.length - 1]); window.__wnReh = S.rehomed; S.rehomed = [{ id: 'wnv1', key: 'mutt', name: 'Pickle', sex: 'male', born: new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10), family: 'the Tanakas by the bakery', genes: null }]; });
    await at('square'); await ev(() => window.__paw.town.visit('wnv1')); await t.until(() => !!document.querySelector('#visitorG'), null, 4000);
  }
  await quiet(H); await H.settle(['#fsStallG', '#wnBannerG', '#nyFortuneG']);
  const lbl = `${tag} square (${jan ? 'January' : 'December'}${visitor ? ', visitor' : ''})`;
  const g = await ev(() => ({ stall: !!document.querySelector('#fsStallG .fs-hit'), kind: (document.querySelector('#fsStallG') || {}).dataset ? document.querySelector('#fsStallG').dataset.kind : '', banner: !!document.querySelector('#wnBannerG'), box: !!document.querySelector('#nyFortuneG'), phone: document.documentElement.dataset.layout === 'phone', fest: !!document.querySelector('[data-fs=fest]'), rows: new Set([...document.querySelectorAll('#placeBtns .btn')].map((b) => Math.round(b.getBoundingClientRect().top))).size }));
  ok(g.stall && g.kind === (jan ? 'newyear' : 'winter') && g.banner === !jan, `${lbl}: the ${g.kind} stall${jan ? '' : ' and the sweater banner'} are up`);
  if (g.phone) ok(g.fest && g.rows === 1, `${lbl}: one Festival button, the place buttons stay one row`);
  await t.SH(`${tag}_wn_square${jan ? '_jan' : ''}${visitor ? '_visitor' : ''}`);
  await check(lbl, '#dogHit', H.COVER);
  await check(lbl, '#fsStallG .fs-hit', H.COVER, [[0.5, 0.5], [0.3, 0.6], [0.7, 0.6]]);
  await clear(lbl, '#fsStallG > svg', (visitor ? ['#visitorG > rect'] : []).concat(['#dogHit'], FRONT), 0.04);
  if (!jan) {
    await clear(lbl, '#wnBannerG > svg', ['#dogHit', '#status:not(:empty)', '#placeBtns .btn', '#fsStallG > svg', '#phPeek'], 0.04);
    const lab = await ev(() => { const b = document.querySelector('#wnBannerG > svg').getBoundingClientRect(); return [...document.querySelectorAll('#view svg.world #sceneG text')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 8 && x.textContent.trim().length > 3 && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top; }).map((x) => x.textContent.trim()); });
    ok(!lab.length, `${lbl}: the banner is over no place label${lab.length ? ' -> ' + lab.join(', ') : ''}`);
  }
  if (g.box) { // NEW YEAR's Fortune box (32_newyear.js), at the pop-up spots
    await check(lbl, '#nyFortuneG > svg', H.COVER, [[0.5, 0.5]]);
    await clear(lbl, '#nyFortuneG > svg', (visitor ? ['#visitorG > rect'] : []).concat(['#dogHit', '#fsStallG > svg'], FRONT), 0.04);
  } else if (jan) ok(true, `${lbl}: no #nyFortuneG yet (NEW YEAR draws it), box checks skipped`);
  await check(lbl, '#placeBtns [data-fs]', '#bar,#hud,#toasts .toast,#modal:not([hidden]) .panel', [[0.5, 0.5]]);
  if (visitor) await ev(() => { const S = window.__paw.S; S.dogs.splice(window.__wnN); S.rehomed = window.__wnReh || []; });
}
async function yard(H, tag, phone) {
  const { ok, ev, check, clear, at, t } = H;
  await ev((ns) => { const S = window.__paw.S; S.decor = S.decor || {}; window.__wnKeep = JSON.stringify(S.decor); window.__wnSd = JSON.stringify(S.wn.snowdog); const d = new Date(), iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    Object.assign(S.wn.snowdog, { date: iso, stage: 3, by: S.activeId, nose: true });
    ns.forEach((n) => { S.decor[n] = { got: iso, out: false }; }); ns.forEach((n) => { S.decor[n].at = window.__paw.ho.freeSpot(n); S.decor[n].out = true; }); }, DECOR);
  await at('yard'); await quiet(H); await H.settle(['#wnDriftG', '#wnDogG', '#decorG']);
  ok(await ev((ns) => document.querySelectorAll('#wnDriftG [data-drift] > rect').length === 2 && document.querySelector('#wnDogG').dataset.stage === '3' && ns.every((n) => !!document.querySelector(`#decorG [data-decor="${n}"] > rect`)), DECOR), `${tag} yard: both drifts, the finished snowdog and the four winter decorations`);
  await t.SH(tag + '_wn_yard');
  const L = `${tag} yard (winter)`;
  await check(L, '#dogHit', H.COVER);
  const inView = (s) => ev((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1; }, s);
  const mine = ['#wnDriftG [data-drift="0"] > rect', '#wnDriftG [data-drift="1"] > rect', '#wnDogG > rect'];
  for (const s of mine) {
    if (!phone || await inView(s)) await check(L, s, H.COVER, [[0.5, 0.5]]);
    await clear(L, s, ['#dogHit', '#bowlG'].concat(FRONT), 0);
  }
  ok(!phone || await inView('#wnDogG > svg'), `${tag} yard: the snowdog is inside the home crop`);
  for (const n of DECOR) await clear(L, `#decorG [data-decor="${n}"] > rect`, ['#dogHit', '#wnDriftG > g > svg', '#wnDogG > svg'], 0.02);
  await ev(() => { const S = window.__paw.S; S.decor = JSON.parse(window.__wnKeep); Object.assign(S.wn.snowdog, JSON.parse(window.__wnSd)); }); await at('yard'); // the hooks after this one see the yard they started with
}

module.exports = {
  name: 'v2.8 winter (Winter Stall, sweater banner, Fortune box, drifts, snowdog, winter decorations)',
  phone: async (H, w, h, tag) => {
    H.ok(await on(H, 'winter'), `${tag}: winter on (December)`);
    await square(H, tag); await square(H, tag, true); await yard(H, tag, true);
    await on(H, 'newyear'); await square(H, tag, false, true); await square(H, tag, true, true);
    await on(H, null);
  },
  once: async (H) => {
    const { ok, ev, check, at, t } = H;
    await on(H, 'winter'); await at('square'); await quiet(H);
    await H.p.locator('[data-fs=fest]').first().tap(); await t.until(() => !!document.querySelector('#modal:not([hidden]) .wn-choose'), null, 5000); await H.settle(['#modal .panel']);
    await check('festival chooser (winter)', '#modal .wn-row', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5]]);
    await H.p.locator('#modal [data-fsgo=contest]').tap(); ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.wn-contest'), null, 5000), 'the chooser row opens the contest sheet'); await H.settle(['#modal .panel']);
    await check('contest sheet', '#modal .panel .x', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5]]);
    await check('contest sheet', '#wnEnter', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5]]);
    await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); }); await t.modalGone();
    await H.p.locator('[data-fs=fest]').first().tap(); await t.until(() => !!document.querySelector('#modal:not([hidden]) [data-fsgo=stall]'), null, 5000);
    await H.p.locator('#modal [data-fsgo=stall]').tap(); ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.wn-stall'), null, 5000), 'the chooser row opens the Winter Stall'); await H.settle(['#modal .panel']);
    await check('Winter Stall sheet', '#modal .panel .x', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.5]]);
    await check('Winter Stall sheet', '#modal .wn-sec:first-of-type .sitem:nth-child(-n+2)', '#bar,#hud,#toasts .toast,#dock', [[0.5, 0.3]]);
    await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); }); await t.modalGone();
    await on(H, null);
  },
  desk: async (H) => {
    H.ok(await on(H, 'winter'), 'desktop: winter on (December)');
    await square(H, 'desktop');
    await H.check('desktop square (winter)', '#placeBtns [data-fs=contest]', '#bar,#hud,#toasts .toast,#modal:not([hidden]) .panel', [[0.5, 0.5]]);
    await yard(H, 'desktop', false);
    await on(H, 'newyear'); await square(H, 'desktop', false, true);
    await on(H, null);
  }
};
