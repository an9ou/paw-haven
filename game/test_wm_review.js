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

  sec('4. a market decoration lands at a free spot; the winter rows sit clear of the dog house and the other wall lights');
  {
    const WM = ['Paper-Star Fir Tree', 'Yard Snowman', 'Candy-Cane Fairy Lights', 'Present Pile', 'Star Lantern'];
    const LIGHTS = ['String Lights', 'Ghost Lantern String', 'Pumpkin Fairy Lights', 'Paper Snowflake Garland', 'Felt Holly Wreath', 'Wind Chime'];
    const ov = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
    await t.newGame({ prefs: PREFS, ground: true }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
    await t.until(() => !!(window.__paw && window.__paw.fm && window.__paw.ho), null, 8000);
    const H = await ev((l) => { const D = window.__paw.home.specs; return Object.fromEntries(l.map((n) => [n, D[n].at.slice(0, 4)])); }, WM.concat(LIGHTS));
    const HOUSE = [640, 340, 204, 186];
    ok(WM.every((n) => !ov(H[n], HOUSE)), 'no winter row overlaps the dog house keep box: ' + WM.filter((n) => ov(H[n], HOUSE)).join());
    ok(LIGHTS.every((n) => !ov(H['Candy-Cane Fairy Lights'], H[n])), 'the Candy-Cane Fairy Lights clear of the other wall lights: ' + LIGHTS.filter((n) => ov(H['Candy-Cane Fairy Lights'], H[n])).join());
    // the String Lights out where the Candy-Cane Lights' catalogue spot is, then buy the five at the market
    await ev(() => { const S = window.__paw.S; S.decor = S.decor || {}; S.decor['String Lights'] = { got: '2026-10-01', out: true, at: [620, 258] }; });
    await ev(() => { const P = window.__paw; P.fm.sync(); P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    const buy = async (cat, n) => {
      await ev((c) => window.__paw.fm.sheet(c), cat); await t.sleep(200);
      await ev((n) => document.querySelector(`#modal .fm-card[data-n="${n}"] [data-fmbuy]`).click(), n);
      await t.p.waitForSelector('.buybox .bb-yes', { timeout: 4000 }).catch(() => {});
      await ev(() => { const b = document.querySelector('.buybox .bb-yes'); if (b) b.click(); });
      await t.until((n) => !!(window.__paw.S.decor || {})[n], n, 4000);
    };
    for (const n of WM) await buy('decor', n);
    const B = await ev((l) => l.map((n) => ({ n, box: window.__paw.ho.box(n), r: window.__paw.S.decor[n] })), WM.concat(['String Lights']));
    ok(B.every((x) => x.r && x.r.out && Array.isArray(x.r.at)), 'each bought one is out with its own spot');
    const bad = []; B.forEach((a, i) => { if (ov(a.box, HOUSE)) bad.push(a.n + '/house'); B.forEach((b, j) => { if (j > i && ov(a.box, b.box)) bad.push(a.n + '/' + b.n); }); });
    ok(!bad.length, 'none lands on the dog house or on another thing already out (the Candy-Cane Lights move off the String Lights): ' + bad.join(', '));
  }
  await t.ctx.close();

  sec('5. a market hand-over (26 to 27 Dec): an open sheet cannot buy an item no longer on sale');
  await t.newGame({ prefs: Object.assign({}, PREFS, { fmDate: '2026-12-26' }), ground: true }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
  await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000);
  {
    await ev(() => { const P = window.__paw; P.fm.sync(); P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    await ev(() => window.__paw.fm.sheet('decor')); await t.p.waitForSelector('#modal .fm-card[data-n="Yard Snowman"]');
    const c0 = (await t.S()).coins;
    await ev(() => { window.__paw.fm.date('2026-12-27'); document.getElementById('toasts').innerHTML = ''; }); // the New Year Market takes over; the sheet is still open
    await ev(() => document.querySelector('#modal .fm-card[data-n="Yard Snowman"] [data-fmbuy]').click());
    ok(await t.waitToast(/packed up/), 'the stale button: the "packed up" toast');
    ok(!(await t.S()).decor['Yard Snowman'] && (await t.S()).coins === c0, 'nothing bought, no coins taken');
    ok(await t.until(() => !document.querySelector('#modal .fm-card[data-n="Yard Snowman"]') && !!document.querySelector('#modal .fm-card[data-n="Kadomatsu Pair"]'), null, 3000), 'the sheet shows the New Year Market now');
    // the buy window open across the hand-over
    await t.closeX(); await t.modalGone(); await ev(() => window.__paw.fm.date('2026-12-26'));
    await ev(() => window.__paw.fm.sheet('decor')); await t.p.waitForSelector('#modal .fm-card[data-n="Star Lantern"]');
    await ev(() => document.querySelector('#modal .fm-card[data-n="Star Lantern"] [data-fmbuy]').click()); await t.p.waitForSelector('.buybox .bb-yes');
    await ev(() => window.__paw.fm.date('2026-12-27')); await ev(() => document.querySelector('.buybox .bb-yes').click());
    ok(await t.waitToast(/packed up/) && !(await t.S()).decor['Star Lantern'] && (await t.S()).coins === c0, 'confirmed after the hand-over: the toast, nothing bought');
  }
  await t.ctx.close();

  sec('6. the Harvest Market alone (20 Nov): plain stalls, every stall drawn with goods is a button that opens its own goods');
  await t.newGame({ prefs: Object.assign({}, PREFS, { fmDate: '2026-11-20' }), ground: true }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
  await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000);
  {
    await ev(() => { const P = window.__paw; P.fm.sync(); P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    const H = await ev(() => ({ main: window.__paw.fm.main(), cats: window.__paw.fm.cats().join(), stalls: [...document.querySelectorAll('#sceneG [data-fmstall].hot')].map((g) => g.dataset.fmstall), boards: document.querySelectorAll('#sceneG .fm-stall-sign').length, keys: window.__paw.fm.svgCache() }));
    ok(H.main === 'harvest' && H.cats === 'clothes,treats', 'only the Harvest Market: clothes and treats');
    ok(H.stalls.slice().sort().join() === 'clothes,treats' && H.boards === 0, 'two stall buttons (clothes, treats), no blank stall boards: ' + H.stalls.join());
    ok(H.keys.some((k) => /^halloween\|\|0\|plain\|011$/.test(k)), 'drawn plain in the Halloween colours, the empty first stall a bare counter: ' + H.keys.join());
    for (const c of H.stalls) {
      await ev((c) => document.querySelector(`#sceneG [data-fmstall="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), c);
      ok(await t.until((c) => { const b = document.querySelector(`#modal .fm-pop [data-fmtab="${c}"]`); return !!b && b.getAttribute('aria-selected') === 'true' && document.querySelectorAll('#modal .fm-grid .fm-card').length >= 2; }, c, 4000), `the ${c} stall opens the ${c} tab`);
      await t.closeX(); await t.modalGone();
    }
    await ev(() => { window.__paw.fm.date('2026-12-28'); window.__paw.go('yard'); }); await t.calm();
    ok(await ev(() => [...document.querySelectorAll('#sceneG [data-fmstall].hot')].map((g) => g.dataset.fmstall).join() === 'decor,treats' && window.__paw.fm.svgCache().some((k) => /^newyear\|\|0\|plain\|101$/.test(k))), 'New Year: decor on the first stall, treats on the third, the middle a bare counter');
  }
  await t.ctx.close();
}, { prefs: {} });
