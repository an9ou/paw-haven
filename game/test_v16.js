// v1.6: trick training + the bigger town (desktop 1280x720 only: the phone half is paused), harness.js merged.
// node game/test_v16.js  (or: node game/run_tests.js v16)
// v1.7.1: training is the Treat Lure mini-game now; game/tricks_drive.js drives the mouse along the live track (full coverage in test_v171_tricks.js).
require('./test_lib').run('v16', async (t) => {
  const { ok, sec, ev, S, rnd, SH } = t;
  const { trace, settle, ready } = require('./tricks_drive');
  const p = await t.boot(); await t.adopt({ sex: 'girl' });
  await t.patch({ bond: { level: 7, pts: 1600 }, coins: 1000, stats: { energy: 90, happy: 90 } }); await ev(() => window.__paw.go('yard')); await t.calm();
  const trick = (n) => ev((n) => { const x = window.__paw.S.dog.tricks[n]; return x && typeof x === 'object' ? x.p : 0; }, n);
  const line = () => p.textContent('#trLine');

  sec('training session (v1.7.1: Treat Lure mini-game)');
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play=tricks]'); await settle(t);
  const geo = await ev(() => { const tp = document.getElementById('trainPanel').getBoundingClientRect(), dg = document.getElementById('dogHit').getBoundingClientRect(); return { tp: [tp.left, tp.top, tp.width, tp.height], dg: [dg.left, dg.top, dg.right, dg.bottom], dim: getComputedStyle(document.getElementById('dock')).display }; });
  ok(geo.dim === 'none', 'training: no dimmed popup over the scene');
  ok(geo.tp[2] <= 300 && geo.tp[0] >= geo.dg[2], `desktop: right panel ${Math.round(geo.tp[2])}px wide, not covering the dog`); await SH('01_training');
  await p.click('[data-tr="Sit"]');
  // a clean trace along the track = Great (Mochi is stubborn: +35% x1.25)
  const p0 = await trick('Sit'); await p.click('#trStart'); ok(await t.until(() => !!document.querySelector('#trTrack .tg-dots'), null, 4000), 'Start draws the pencil track from the nose');
  await trace(t, 'great'); const p1 = await trick('Sit');
  ok(Math.abs(p1 - p0 - 0.4375) < 0.001, `Great trace: progress ${Math.round(p0 * 100)}% -> ${Math.round(p1 * 100)}%`); await SH('03_traced');
  // wandering off the track = Missed, no penalty
  await ready(t); await p.click('#trStart'); await trace(t, 'miss'); const p2 = await trick('Sit');
  ok(p2 === p1 && /Oops!/.test(await line()), `Missed trace: no change (${Math.round(p2 * 100)}%), "${(await line()).trim()}"`);
  // focus runs out
  await ready(t); await ev(() => { const d = window.__paw.S.dog; d.focus = { v: 20, at: window.__paw.S.gameMin }; });
  await p.click('#trStart'); await trace(t, 'great'); await ready(t); await p.click('#trStart');
  ok(await t.until(() => /brain is full/.test(document.getElementById('trLine').textContent), null, 6000), 'focus runs out: "' + (await line()).trim() + '"'); await SH('04_focus_out');

  sec('show-off combo with an audience in Town Square');
  await p.click('#trX'); await t.travel('square'); ok((await S()).place === 'square', 'travelled to Town Square');
  await ev(() => { const d = window.__paw.S.dog; ['Sit', 'Paw', 'Lie Down'].forEach((n) => { d.tricks[n] = { p: 1, shows: 0 }; }); });
  await p.click('[data-act=play]'); await t.waitPop(true); await p.click('[data-play=tricks]'); await p.waitForSelector('[data-trtab=show]'); await p.click('[data-trtab=show]'); await p.waitForSelector('[data-show]');
  ok(await p.locator('#audience').count() === 1, 'NPC audience appears in a public place');
  const c0 = (await S()).coins;
  let k = 0; for (const n of ['Sit', 'Paw', 'Lie Down']) { k++; await t.until(() => !window.__paw.train.held && !window.__paw.train.game, null, 8000); await p.click(`[data-show="${n}"]`); await trace(t, 'great'); await t.until((k) => window.__paw.train && window.__paw.train.chain === k, k, 10000); }
  await t.until(() => /COMBO x3/.test(document.getElementById('trLine').textContent), null, 6000);
  const c1 = (await S()).coins;
  ok(/COMBO x3/.test(await line()) && c1 - c0 >= 18, `show-off combo x3: +${c1 - c0} coins (3 x 3 x audience 2, + the Town notice goal)`); await SH('05_combo');
  ok((await S()).daily.squareGoal === true, 'Town notice goal: 3 tricks shown in the Square');
  await p.click('#trX');

  sec('map pan + zoom');
  await p.click('[data-act=map]'); await p.waitForSelector('#mapPan');
  const tf = () => ev(() => document.getElementById('mapInner').style.transform); const t0 = await tf();
  const pb = await p.locator('#mapPan').boundingBox();
  await p.mouse.move(pb.x + 600, pb.y + 300); await p.mouse.down(); await p.mouse.move(pb.x + 400, pb.y + 200, { steps: 8 }); await p.mouse.up();
  ok(await t.until((t0) => document.getElementById('mapInner').style.transform !== t0, t0, 4000), 'map pans by drag');
  const z0 = await p.textContent('#mapZoomLbl'); await p.mouse.move(pb.x + 500, pb.y + 300); await p.mouse.wheel(0, -500);
  ok(await t.until((z0) => document.getElementById('mapZoomLbl').textContent !== z0, z0, 4000), `map zoom ${z0} -> ${await p.textContent('#mapZoomLbl')}`); await SH('06_map');
  await p.click('#mapX'); await t.untilMode('yard');
  for (const k of ['cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'square']) { await t.travel(k); ok((await S()).place === k, 'travelled to ' + k); await SH('07_place_' + k); }

  sec('cafe, vet, salon');
  await t.travel('cafe'); let s0 = await S(); await p.click('#placeBtns [data-pb=cafe]'); await p.waitForSelector('[data-cafe="Pupuccino"]'); await SH('08_cafe_menu');
  await p.click('[data-cafe="Pupuccino"]'); await t.until(() => !!window.__paw.S.dog.cafeDay, null, 8000); let s1 = await S();
  ok(s1.coins === s0.coins - 12 && !!s1.dog.cafeDay, 'café: Pupuccino served (-12 coins)');
  await t.modalGone(); await p.click('#placeBtns [data-pb=cafe]'); await p.waitForSelector('[data-cafe="Doggy Donut"]');
  await t.toasts(); await p.click('[data-cafe="Doggy Donut"]', { force: true }); ok(await t.waitToast(/One café treat per dog per day/), 'café: one treat per dog per day'); ok((await S()).coins === s1.coins, 'café: no second charge'); await t.closeX();
  await t.travel('vet'); s0 = await S(); await p.click('#placeBtns [data-pb=vet]'); await p.waitForSelector('#vetGo'); await p.click('#vetGo');
  ok(await t.waitH2(/Health card/), 'vet: health card shows'); s1 = await S(); ok(s1.coins === s0.coins - 30, 'vet: check-up (-30 coins)'); await SH('09_vet_card'); await p.click('#vetOk'); await t.modalGone();
  await t.travel('salon'); await ev(() => { window.__paw.S.stats.clean = 40; }); s0 = await S(); await p.click('#placeBtns [data-pb=groom]'); await p.waitForSelector('#slGo'); await p.click('#slGo');
  ok(await t.until(() => window.__paw.S.stats.clean >= 99 && window.__paw.S.dog.fluffyUntil > window.__paw.S.gameMin, null, 10000), 'salon: full groom, Fresh & Fluffy'); s1 = await S(); ok(s1.coins === s0.coins - 40, 'salon: -40 coins'); await SH('10_salon');

  sec('Town Loop walk');
  await t.travel('yard'); await p.click('[data-act=walk]'); await p.waitForSelector('.rt-card.cur');
  for (let i = 0; i < 8; i++) {
    const cur = await p.textContent('.rt-card.cur'); if (/Town Loop/.test(cur)) break;
    await p.click('#rtNext').catch(async () => { await p.keyboard.press('ArrowRight'); }); await t.until((c) => document.querySelector('.rt-card.cur').textContent !== c, cur, 3000);
  }
  ok(/Town Loop/.test(await p.textContent('.rt-card.cur')), 'walk carousel has the Town Loop'); await SH('11_routes_town');
  await p.click('#rtStart'); await t.until(() => window.__paw.mode === 'walk' && !!(document.querySelector('.pw-ov [data-go]') || document.querySelector('.pw-cd')), null, 15000);
  if (await p.locator('.pw-ov [data-go]').count()) await p.locator('.pw-ov [data-go]').first().click();
  await t.until(() => { const o = document.querySelector('.pw-ov'); return window.__paw.mode === 'walk' && !!o && o.hidden; }, null, 12000);
  ok((await t.mode()) === 'walk', 'Town Loop walk running'); await SH('12_town_walk');
  ok(await t.quitWalk(true), 'Town Loop results'); await t.untilMode('yard');
  const [sw, iw] = await ev(() => [document.documentElement.scrollWidth, innerWidth]); ok(sw === iw, `no horizontal scroll (${sw} = ${iw})`);
});
