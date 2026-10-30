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
}, { prefs: {} });
