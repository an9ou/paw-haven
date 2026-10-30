// Winter Market code review fixes (docs/design/winter-market.md, "Code review fixes"): one section per fix.
// node game/run_tests.js wm_review
const { run } = require('./test_lib');
const PREFS = { fmTest: true, fmDate: '2026-12-05' };

run('wm_review', async (t) => {
  const { ok, sec, ev } = t;

  sec('1. the Festive Market roam: with rmWander on, small, medium and big dogs find spots, no feet on a stall board (Halloween, winter, New Year)');
  await t.newGame({ prefs: Object.assign({ rmTest: true }, PREFS), ground: true }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
  await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000);
  await ev(() => { const P = window.__paw; P.addDog({ key: 'chihuahua', sex: 'male', months: 14 }, 'Pip'); P.addDog({ key: 'golden', sex: 'female', months: 30 }, 'Goldie'); });
  await t.calm();
  for (const [date, th] of [['2026-10-27', 'halloween'], ['2026-12-05', 'winter'], ['2026-12-28', 'newyear']]) {
    await ev((d) => { const P = window.__paw; P.fm.date(d); P.S.place = 'fmarket'; P.go('yard'); }, date); await t.calm(); await t.sleep(500);
    const R = await ev(() => {
      const P = window.__paw, rm = P.rm, ids = rm.dogs(), no = rm.scan(), boards = no.filter((b) => b[4] === 'board');
      const onBoard = (x, y) => boards.some((b) => x > b[0] - 8 && x < b[0] + b[2] + 8 && y > b[1] - 8 && y < b[1] + b[3] + 8);
      return { boards: boards.length, dogs: ids.map((id) => { const p = rm.pos(id); return { id, cls: rm.size(id).cls, c: rm.cands(id, true) + rm.cands(id, false), lead: id === ids[0], x: p.x, y: p.y, on: onBoard(p.x, p.y), ok: rm.ok(id, p.x, p.y), lead0: !rm.hard(500, 586) && !rm.softAt(id, 500, 586) }; }) };
    });
    ok(R.boards === 5, th + ': the five stall boards are no-go boxes for the feet');
    ok(['small', 'medium', 'big'].every((c) => R.dogs.some((d) => d.cls === c && d.c > 0)), th + ': small, medium and big dogs each find free spots: ' + R.dogs.map((d) => d.cls + ' ' + d.c).join(', '));
    ok(R.dogs.every((d) => !d.on), th + ': no dog stands on a stall board');
    ok(R.dogs.every((d) => d.ok), th + ': every dog stands on a free spot (rmOk), the leader at RM_LEAD: ' + R.dogs.map((d) => d.cls + ' ' + d.x + ',' + d.y).join(' '));
    ok(R.dogs.every((d) => d.lead0), th + ': RM_LEAD (500, 586) is clear for a small, medium and big leader');
    ok(R.dogs[0].x === 500 && R.dogs[0].y === 586, th + ': the leader stands in the open front (RM_LEAD)');
  }
  await t.ctx.close();

  sec('2. the Pumpkin Ball and the Snowball Ball are ball-play toys (2 coins a return, under the ball-play caps), not the Tennis Ball toy game');
  await t.newGame({ ground: true }, { bond: { level: 8, pts: 1600 }, coins: 1000, inv: { toys: ['Pumpkin Ball', 'Snowball Ball'] } });
  await t.until(() => !!(window.__paw && window.__paw.bl), null, 8000);
  {
    const K = await ev(() => { const B = window.__paw.bl; return { cap: B.cap, p: B.toys['Pumpkin Ball'], s: B.toys['Snowball Ball'] }; });
    ok(K.p && K.s && K.p.coin === 2 && K.s.coin === 2 && K.cap.session === 16 && K.cap.day === 40, 'both in BL_TOYS at 2 coins a return; the caps stay 16 a session, 40 a day');
    await t.home('yard'); await t.p.click('[data-act=play]'); await t.waitPop(true, 4000);
    const tray = await ev(() => [...document.querySelectorAll('[data-play]')].map((b) => b.dataset.play + '|' + b.textContent));
    ok(['Pumpkin Ball', 'Snowball Ball'].every((n) => tray.some((x) => x.startsWith('ball:' + n + '|') && /2 coins/.test(x)) && !tray.some((x) => x.startsWith('toy:' + n + '|'))), 'the Play tray: a ball-play card each with its coin line, no toy-game card: ' + tray.filter((x) => /Pumpkin|Snowball/.test(x)).join(' / '));
    await t.closeX(); await t.modalGone();
    for (const toy of ['Snowball Ball', 'Pumpkin Ball']) {
      await ev(() => { window.__paw.S.bl.coins = 38; window.__paw.S.bl.day = '2001-01-01'; });
      ok(await ev((toy) => { window.__paw.bl.start(toy); return window.__paw.bl.on && window.__paw.bl.state.toy === toy; }, toy), toy + ': ball play starts with it');
      let c0 = (await t.S()).coins;
      await ev(() => { window.__paw.bl.seed(7); window.__paw.bl.throwV(650, -600); window.__paw.bl.sim(14); });
      ok((await ev(() => window.__paw.bl.state.coins)) === 2 && (await t.S()).coins === c0 + 2, toy + ': a return pays 2 coins');
      await ev(() => { window.__paw.S.bl.coins = 40; }); c0 = (await t.S()).coins;
      await ev(() => { window.__paw.bl.throwV(650, -600); window.__paw.bl.sim(14); });
      ok((await t.S()).coins === c0, toy + ': nothing past the ball-play day cap of 40');
      await ev(() => window.__paw.bl.stop()); await t.untilMode('yard', 5000);
    }
  }
  await t.ctx.close();

  sec('3. the winter scene is drawn and tinted once per theme + time phase + lit, then reused');
  await t.newGame({ prefs: PREFS, ground: true }, { bond: { level: 8, pts: 1600 } });
  await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000);
  {
    await ev(() => { const P = window.__paw; P.fm.sync(); P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    const k1 = await ev(() => window.__paw.fm.svgCache());
    ok(k1.includes('winter|day|0'), 'the day scene is kept: ' + k1.join());
    const ms = await ev(() => { const t0 = performance.now(); for (let i = 0; i < 5; i++) window.__paw.go('yard'); return (performance.now() - t0) / 5; });
    const k2 = await ev(() => window.__paw.fm.svgCache());
    ok(k2.length === k1.length && /data-fm="fmscene"/.test(await ev(() => document.querySelector('#sceneG').innerHTML.slice(0, 4000))), `redraws reuse it (${ms.toFixed(0)} ms a redraw), the scene is still there`);
    await t.dev(async () => { await t.p.selectOption('#dvTime', 'night'); });
    ok(await t.until(() => window.__paw.fm.svgCache().includes('winter|night|1'), null, 4000), 'after dark: the lit night scene is its own entry');
    ok((await ev(() => window.__paw.fm.svgCache())).length <= 4, 'at most four kept');
  }
  await t.ctx.close();
}, { prefs: {} });
