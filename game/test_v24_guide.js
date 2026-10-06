// v2.4 GUIDE lane (V24.md section 5): Gerald's walkthrough on a new save, Skip, the old-save letter, the How to play tab and Replay, the card never covers the dog.
// node game/run_tests.js v24_guide   (--shots writes every step to game/shots_v24_guide/)
// Under the test harness the walkthrough only runs with prefs.gdTest (25_guide.js), so this suite opts in.
const { run } = require('./test_lib');
const CARD = () => { const c = document.querySelector('#gdLayer .gd-card'); if (!c || c.hidden) return null; const r = c.getBoundingClientRect(); return { step: +c.dataset.step, r: [r.left, r.top, r.right, r.bottom] }; };
const RECT = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };

run('v24_guide', async (t) => {
  const { ok, sec, ev } = t; let p = null;
  const card = () => t.ev(CARD);
  const atStep = (i) => t.until((i) => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden && +c.dataset.step === i && window.__gd.active(); }, i, 8000);
  const gone = () => t.until(() => { const c = document.querySelector('#gdLayer .gd-card'); return !c || c.hidden; }, null, 5000);
  // the card clears #dogHit and the ringed action-bar button (sampled a few times: the dog wanders)
  const clearOf = async (label) => {
    let bad = '';
    for (let k = 0; k < 3; k++) {
      const r = await t.ev(([CARDs, RECTs]) => { const C = eval(CARDs), R = eval(RECTs); const c = C(); const ring = document.querySelector('#gdLayer .gd-ring'); return { c, dog: R('#dogHit'), ring: ring && !ring.hidden ? ring.dataset.for : null, tgt: ring && !ring.hidden && ring.dataset.for !== '#dogHit' ? R(ring.dataset.for) : null }; }, [CARD.toString(), RECT.toString()]);
      if (!r.c) { bad = 'no card'; break; }
      if (t.hitR(r.c.r, r.dog)) { bad = `covers #dogHit ${JSON.stringify(r.c.r.map(Math.round))} vs ${JSON.stringify(r.dog.map(Math.round))}`; break; }
      if (r.tgt && t.hitR(r.c.r, r.tgt)) { bad = `covers ${r.ring}`; break; }
      if (k < 2) await t.sleep(250);
    }
    ok(!bad, `${label}: the card clears the dog and the ringed button ${bad}`);
  };
  const step = async (i, label) => { ok(await atStep(i), `step ${i} (${label}) shows`); await t.sleep(350); await clearOf(`step ${i}`); await t.SH(`desk_step${i}_${label}`); };
  const next = async () => { await t.p.click('#gdLayer .gd-next'); };

  sec('new save: step 0 after the intro');
  await t.newGame({ prefs: { gdTest: true } }, { bond: { level: 1, pts: 0 }, coins: 50, stats: { hunger: 50, happy: 70, energy: 60, clean: 90 } });
  p = t.p; await t.freezeMotion(true);
  await step(0, 'hello');
  ok(/I am Gerald/.test(await p.textContent('#gdLayer .gd-txt')), 'step 0 text');
  ok((await t.S()).guide.step === 0, 'S.guide.step is 0');
  ok(await p.locator('#gdLayer .gd-dot').count() === 10, '10 step dots');
  ok(await ev(() => getComputedStyle(document.querySelector('#gdLayer .gd-card')).pointerEvents === 'none'), 'the card itself lets clicks through');

  sec('feed advances step 1');
  await next(); await step(1, 'feed');
  ok(await ev(() => document.querySelector('#gdLayer .gd-ring').dataset.for === '#bar [data-act=feed]'), 'the Feed button is ringed');
  const name = (await t.S()).dog.name; ok((await p.textContent('#gdLayer .gd-txt')).includes(name), 'the text names the dog');
  await p.click('[data-act=feed]'); await t.waitPop(true); ok(await gone(), 'the card hides while the Feed tray is open');
  await t.retryUntil(() => p.click('[data-food="Basic Kibble"]'), () => window.__paw.S.guide.step === 2);
  await t.waitPop(false); await t.calm();

  sec('petting advances step 2');
  await step(2, 'pet');
  ok(await ev(() => document.querySelector('#gdLayer .gd-ring').dataset.for === '#dogHit'), 'the dog is ringed');
  ok(await t.pet(() => window.__paw.S.guide.step === 3), 'petting advances to step 3');

  sec('nap, map, walk');
  await step(3, 'nap'); await next();
  await step(4, 'map');
  await p.click('[data-act=map]'); await t.untilMode('map'); ok(await gone(), 'the card hides on the map');
  ok(await t.until(() => window.__paw.S.guide.step === 5), 'entering the map advances to step 5');
  await p.keyboard.press('Escape'); await t.untilMode('yard');
  await step(5, 'walk');
  ok(await t.startWalk(true), 'a walk starts'); ok(await gone(), 'the card hides during the walk');
  ok((await t.S()).guide.step === 6, 'starting a walk advances to step 6');
  ok(await t.quitWalk(true), 'walk results closed'); await t.calm();

  sec('shops, garden, missions, done');
  await step(6, 'shops'); await next();
  await step(7, 'garden'); await next();
  await step(8, 'missions');
  ok(await ev(() => { const f = document.querySelector('#gdLayer .gd-ring').dataset.for; return f === '#msCardG' || f === '#bar [data-act=journal]'; }), 'the clipboard or the Journal button is ringed');
  await next(); await step(9, 'done');
  ok(/Bye/.test(await p.textContent('#gdLayer .gd-next')), 'the last button says goodbye');
  await next(); ok(await gone(), 'the card closes');
  ok(!!(await t.S()).guide.done, 'S.guide.done is set');
  ok(await ev(() => !window.__gd.active()), 'gdActive() is false');

  sec('How to play tab and Replay');
  await p.click('[data-act=journal]'); await p.waitForSelector('[data-jt=howto]'); await p.click('[data-jt=howto]');
  ok(await t.until(() => document.querySelectorAll('.gd-lesson').length === 8), 'the tab shows 8 lessons');
  ok(await p.locator('.gd-page .gd-head svg').count() >= 1, 'Gerald is at the top');
  await t.SH('desk_howto'); await p.locator('#gdReplay').scrollIntoViewIfNeeded(); await t.SH('desk_howto_end');
  await p.click('#gdReplay'); ok(await t.modalGone(), 'Replay closes the Journal');
  ok(await atStep(0), 'Replay restarts at step 0'); const g = (await t.S()).guide; ok(g.step === 0 && !g.done && !g.skipped, 'S.guide is { step: 0 }');

  sec('Skip');
  await p.click('#gdLayer .gd-skip'); ok(await gone(), 'Skip hides the card');
  ok(!!(await t.S()).guide.skipped, 'S.guide.skipped is set'); ok(await t.waitToast(/Gerald waddles/), 'a kind goodbye toast');
  const s0 = await t.S();

  sec('old save: one letter, no card');
  const old = JSON.parse(JSON.stringify(s0)); delete old.guide; delete old.guideSeen; delete old.guideLetter; old.mail = (old.mail || []).filter((m) => m.from !== 'Gerald the duck');
  await t.mk({ prefs: { gdTest: true }, storage: { pawhaven_proto_v1: JSON.stringify(old) } }); await t.p.goto(require('./test_lib').URL);
  await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  const letters = () => t.ev(() => window.__paw.S.mail.filter((m) => m.from === 'Gerald the duck').length);
  ok(await t.until(() => window.__paw.S.mail.some((m) => m.from === 'Gerald the duck')), 'the Gerald letter arrives');
  const s1 = await t.S(); ok(s1.guideSeen === true && !!s1.guideLetter && s1.guide.step === -1, 'guideSeen, guideLetter set, guide off');
  ok(/How to play/.test(s1.mail.find((m) => m.from === 'Gerald the duck').title), 'the letter title');
  await t.sleep(1800); ok(await t.ev(() => { const c = document.querySelector('#gdLayer .gd-card'); return !c || c.hidden; }), 'no Gerald card on an old save');
  await t.ev(() => window.__paw.saveNow()); await t.p.reload(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.sleep(1500);
  ok(await letters() === 1, 'the letter comes once');
}, { prefs: { gdTest: true } });
