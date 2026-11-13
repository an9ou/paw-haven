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
    const pool = P.ms.swapPool(); return { pool, ex: ex.length, ok: pool.length === 0 || pool.some((id) => !home.includes(id)) }; });
  ok(fb.ok, 'with no home mission left the swap falls back to the old pool ' + JSON.stringify(fb.pool));

  sec('B1. chapter 3 points at the Town projects board');
  const b1 = await ev(() => { const P = window.__paw, S = P.S; S.story.ch = 3; P.sm.open('story'); const h = document.querySelector('#modal .sm-hint'); return h ? h.textContent : null; });
  ok(b1 && /Town projects/.test(b1) && /fountain/.test(b1), 'chapter 3 shows Gerald\'s pointer: ' + b1);
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
  const b3 = await ev(() => { const P = window.__paw, S = P.S; P.pr.fields(S); S.projects.i = 0; S.projects.paid = 0; const a0 = P.wb.tmrwText(3); S.projects.paid = Math.floor(P.pr.LIST[0].price * 0.4); return { a0, a1: P.wb.tmrwText(3), sat: P.wb.tmrwText(6), p: P.pr.LIST[0].id }; });
  ok(/Fountain is 40% there/.test(b3.a1), 'with a project active: ' + b3.a1);
  ok(/Saturday/.test(b3.sat), 'the Saturday market line still wins: ' + b3.sat);
  const b3b = await ev(() => { const P = window.__paw, S = P.S; S.projects.i = P.pr.LIST.length; return P.wb.tmrwText(3); });
  ok(!/% there/.test(b3b), 'with every project built the usual line: ' + b3b);

  sec('C. the cap line points at projects and the Visitors Book');
  const c = await ev(() => { const L = window.__paw.lv; for (let i = 0; i < 20; i++) L.gain('care', 2); L.gain('walk', 99); L.gain('ms', 99); L.sheet(); const e = document.querySelector('#modal .lv-today'); return e ? e.textContent : null; });
  ok(c && /town projects/.test(c) && /Visitors Book/.test(c) && !/More tomorrow/.test(c), 'at the cap: ' + c);
  await t.ctx.close();
});
