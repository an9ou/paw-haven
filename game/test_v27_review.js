// v2.7 integration review fixes (coordinator): the bath shake, a bath from the house, the rug hint for two dogs,
// phone free spots keep clear of the phone pack spots.
// node game/run_tests.js v27_review
require('./test_lib').run('v27_review', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p;
  const scrub = async () => { for (let i = 0; i < 40 && (await t.mode()) === 'bath' && !(await ev(() => window.__paw.S.stats.clean >= 99.5)); i++) await p().keyboard.press('Space'); }; // 99.5: the game clock ticks Cleanliness a hair below 100 right after the bath sets it

  sec('1. a bath ends with the shake again (one dog)');
  await t.newGame({}, { coins: 500 }); await t.home('yard');
  await ev(() => { window.__paw.S.stats.clean = 30; window.__shook = 0; new MutationObserver(() => { const fx = document.getElementById('dogFx'); if (fx && fx.classList.contains('tk-shake')) window.__shook++; }).observe(document.getElementById('view'), { subtree: true, attributes: true, attributeFilter: ['class'], childList: true }); });
  await p().click('[data-act=care]'); await t.waitPop(true); await p().click('[data-care="bath"]'); await t.untilMode('bath');
  await scrub();
  ok(await t.until(() => window.__shook > 0, null, 4000), 'the dog shakes off at the end of the bath');

  sec('2. a bath from the house opens the tub (no broken screen)');
  await t.home('house'); await ev(() => { window.__paw.S.stats.clean = 30; });
  await p().click('[data-act=care]'); await t.waitPop(true); await p().click('[data-care="bath"]'); await t.untilMode('bath');
  ok(await p().locator('#bathBar').count() === 1 && await p().locator('#tubG').count() === 1, 'the bath tray and the tub are there');
  await scrub(); ok(await ev(() => window.__paw.S.stats.clean >= 99), 'the bath finishes from the house');

  sec('3. two dogs without a bed: one rug hint names both');
  await t.ctx.close(); await t.newGame({ packCare: true }, { coins: 500 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); });
  await t.calm(); await t.home('yard');
  await ev(() => { window.__paw.S.dogs.slice(1).forEach((d) => { d.sleeping = true; d.stats.energy = 40; }); });
  await t.toasts(); await t.home('house');
  ok(await t.waitToast(/Bun and Pip nap on the rug tonight/), 'the hint names both dogs on the rug');

  sec('4. phone free spots keep clear of the phone pack spots');
  await t.ctx.close(); await t.newGame({ packCare: true, device: 'iPhone 15' }, { coins: 500 });
  await ev(() => { window.__paw.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); window.__paw.S.decor['Flower Barrel'] = { got: '2026-10-01', out: false }; });
  await t.calm(); await t.home('yard');
  const fs = await ev(() => window.__paw.ho.freeSpot('Flower Barrel'));
  const clear = !(fs[0] < 287 && fs[0] + 84 > 157 && fs[1] < 605 && fs[1] + 72 > 494); // the phone pack spot 0 box since 41e692a ([222, 596, right, 0.58])
  ok(Array.isArray(fs) && clear, 'the Flower Barrel does not land behind the first phone pack dog: ' + JSON.stringify(fs));
}, { packCare: false });
