// v2.29.1 "Balance follow-ups" (V2291.md): A the free swap draws home missions only, B1 chapter 3 points at the Town projects board,
// B2 the Boutique's Kind shop looks row, B3 the tomorrow line shows the town project, C the cap line points at projects and the Visitors Book.
// node game/run_tests.js v2291_balance
const { run } = require('./test_lib');
const ON = { msTest: true, prTest: true, smTest: true, lvTest: true, wbTest: true };

run('v2291_balance', async (t) => {
  const { ok, sec, ev } = t;
  await t.newGame({ prefs: ON }, { coins: 5000 });
  ok(await t.until(() => !!(window.__paw && window.__paw.ms && window.__paw.wb && window.__paw.sm), null, 6000), 'the hooks are there');

  sec('A. the free swap draws home missions only');
  const a = await ev(() => {
    const P = window.__paw, S = P.S, home = P.ms.home, out = { runs: 0, bad: [], fell: null };
    P.ms.force(['funfair']); S.missions.swap = '';
    const pool = P.ms.swapPool(); out.pool = pool.length; out.allHome = pool.every((id) => home.includes(id));
    out.eligHasAway = P.ms.eligible().some((id) => !home.includes(id)); // the day's first draw can still be a trip or a minigame
    for (let i = 0; i < 12; i++) { P.ms.force(['funfair']); S.missions.swap = ''; S.missions.date = P.rh.jst(); S.dogs[0].id = 'dogx' + i; if (!P.ms.swap()) continue; out.runs++; const id = S.missions.list[0].id; if (!home.includes(id)) out.bad.push(id); }
    return out;
  });
  ok(a.pool > 0 && a.allHome, 'the swap pool holds home missions only (' + a.pool + ')');
  ok(a.eligHasAway, 'the first draw pool still has trips and minigames');
  ok(a.runs >= 8 && a.bad.length === 0, `${a.runs} swaps, none landed on a trip or minigame ${JSON.stringify(a.bad)}`);
  const fb = await ev(() => { const P = window.__paw, S = P.S, home = P.ms.home, real = P.ms.eligible; // no home mission left: the old pool is the fallback
    const ex = P.ms.eligible().filter((id) => home.includes(id)); P.ms.force(['funfair']); S.missions.swap = '';
    // exclude every home mission by listing them as today's: msSwapExcl reads m.list, so put them there
    S.missions.list = ex.map((id) => ({ id, n: 1, p: 0, done: null })).concat([{ id: 'funfair', n: 1, p: 0, done: null }]);
    const pool = P.ms.swapPool(); return { pool, ex: ex.length, away: pool.some((id) => !home.includes(id)) }; });
  ok(fb.pool.length > 0 && fb.away, 'with no home mission left the swap falls back to the old pool ' + JSON.stringify(fb.pool));

  sec('B1. chapter 3 points at the Town projects board');
  const b1 = await ev(() => { const P = window.__paw, S = P.S; S.story.ch = 3; P.sm.open('story'); const h = document.querySelector('#modal .sm-hint'); return h ? h.textContent : null; });
  ok(b1 && /Town projects/.test(b1) && /Fountain/.test(b1), 'chapter 3 shows Gerald\'s pointer: ' + b1);
  await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); });
  const b1b = await ev(() => { const P = window.__paw; P.S.story.ch = 2; P.sm.open('story'); return !!document.querySelector('#modal .sm-hint'); });
  ok(b1b === false, 'other chapters have no pointer');
  await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); });

  sec('B2. the Boutique has a Kind shop looks row');
  const b2 = await ev(() => { window.__paw.shop.open('boutique'); const b = document.getElementById('shKsLooks'); return b ? b.textContent : null; });
  ok(b2 && /Kind shop looks/.test(b2) && /1,?500/.test(b2), 'the row shows: ' + b2);
  await ev(() => document.getElementById('shKsLooks').click());
  ok(await t.until(() => !!document.querySelector('#modal .panel.ks [data-kstab][aria-selected="true"]') && document.querySelector('#modal .panel.ks [data-kstab][aria-selected="true"]').dataset.kstab === 'looks', null, 4000), 'it opens the Kind shop on the Looks tab');
  await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); });
  const kb = await ev(() => { window.__paw.shop.open('kibble'); return !!document.getElementById('shKsLooks'); });
  ok(kb === false, 'other shops have no such row');
  await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); });

  sec('B3. the tomorrow line shows the town project');
  const b3 = await ev(() => { const P = window.__paw, S = P.S; P.pr.fields(S); S.projects.i = 0; S.projects.paid = 0; S.projects.building = []; const a0 = P.wb.tmrwText(3);
    S.projects.paid = Math.floor(P.pr.LIST[0].price * 0.4); const a1 = P.wb.tmrwText(3, true), a2 = P.wb.tmrwText(3, false);
    S.projects.building = [{ id: 'fountain', ready: '2099-01-01', paid: '2026-01-01' }]; S.projects.paid = 0; const a3 = P.wb.tmrwText(3, true); S.projects.building = [];
    return { a0, a1, a2, a3, sat: P.wb.tmrwText(6), p: P.pr.LIST[0].id }; });
  ok(/saving up/.test(b3.a0) && /Fountain/.test(b3.a0), 'at 0 coins a saving line: ' + b3.a0);
  ok(/Town project, Fountain: 40% of the way there/.test(b3.a1), 'with a project active: ' + b3.a1);
  ok(!/% of the way/.test(b3.a2) && !/Town project/.test(b3.a2), 'on the other days the usual lines come: ' + b3.a2);
  ok(!/Town project/.test(b3.a3), 'while a project is being built, nothing about it: ' + b3.a3);
  ok(/Saturday/.test(b3.sat), 'the Saturday market line still wins: ' + b3.sat);
  const b3b = await ev(() => { const P = window.__paw, S = P.S; S.projects.i = P.pr.LIST.length; return P.wb.tmrwText(3); });
  ok(!/Town project/.test(b3b), 'with every project built the usual line: ' + b3b);

  sec('C. the cap line points at projects and the Visitors Book');
  const c = await ev(() => { const L = window.__paw.lv; for (let i = 0; i < 20; i++) L.gain('care', 2); L.gain('walk', 99); L.gain('ms', 99); L.sheet(); const e = document.querySelector('#modal .lv-today'); return e ? e.textContent : null; });
  ok(c && /town projects/.test(c) && /Visitors Book/.test(c) && !/More tomorrow/.test(c), 'at the cap: ' + c);
  sec('D. the news: launch day, a later day and a seen v2.29');
  const n = await ev(() => {
    const P = window.__paw, S = P.S, out = {}, today = P.rh.jst(), tom = new Date(Date.parse(today + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10);
    const lead = (seen, d229, d2291) => { S.newsSeen = seen; P.nw.setDates(d229, d2291); P.nw.auto(); const h = document.querySelector('#modal .nw-sheet h3'); const r = h ? h.textContent : null; const x = document.querySelector('#modal .panel .x'); if (x) x.click(); return r; };
    out.launch = lead('2.28', today, tom); // v2.29 is due today, v2.29.1 not yet
    out.later = lead('2.28', today, today); // both due, v2.29 unseen
    out.seen = lead('2.29', today, today); // v2.29 seen
    out.after = S.newsSeen;
    return out;
  });
  ok(/Story mode/i.test(n.launch || ''), 'launch day (v2.29 due, v2.29.1 not) with v2.29 unseen shows v2.29: ' + n.launch);
  ok(/Story mode/i.test(n.later || ''), 'a later day with v2.29 unseen still shows v2.29: ' + n.later);
  ok(/Little town tweaks/.test(n.seen || ''), 'with v2.29 seen, v2.29.1 shows: ' + n.seen);
  ok(n.after === '2.29.1', 'after the sheet everything up to the newest id is seen: ' + n.after);
  await t.ctx.close();
});
