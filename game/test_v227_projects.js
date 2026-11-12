// v2.27 "Town projects" (V227.md 7; game/src/55_projects.js, 55b_projects_art.js, game/css/57_projects.css). Checks: the additive migration (an old save
// with no S.projects, bad values cleaned), paying in (any amount, the quick buttons, "All but 200", a typed amount, never more than the pocket or what
// is left, never below 0 coins), completion and the 2-day build on the Japan date, Gerald's ribbon-cutting letter exactly once, built projects kept
// across a reload, the fountain drink and the bandstand tune, the lighthouse at the pier, and the fit: the board, the builds and the sheet on a
// 1280x720 desktop and a 360x640 phone, with no tap target of a build covering another tap target.
// node game/run_tests.js v227_projects
const { run } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const ALL = ['fountain', 'bandstand', 'sakura', 'lighthouse'];

run('v227_projects', async (t) => {
  const { ok, sec, ev } = t;
  const P = () => ev(() => JSON.parse(JSON.stringify(window.__paw.S.projects)));
  const coins = () => ev(() => window.__paw.S.coins);
  const toastSeen = (re) => t.waitToast(re, 4000);
  // every tap target of the projects (its own transparent rect) against every other tap target on screen: true when none overlap by more than 2 px
  const noOverlap = () => ev(() => {
    const vis = (r) => r.width > 0 && r.height > 0, own = [...document.querySelectorAll('svg.world [data-pr-hot] > rect')].map((e) => ({ id: e.parentNode.dataset.prHot, r: e.getBoundingClientRect() }));
    const others = [...document.querySelectorAll('svg.world .hot:not(.pr-hot), svg.world [role=button]:not(.pr-hot), #placeBtns button')].filter((e) => !e.closest('.pr-hot') && e.id !== 'dogHit' && !e.closest('#pack')).map((e) => ({ id: e.id || e.dataset.pb || e.dataset.pb3 || e.getAttribute('class'), r: e.getBoundingClientRect() }));
    const bad = []; own.forEach((a) => others.forEach((b) => { if (!vis(a.r) || !vis(b.r)) return; const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top); if (w > 2 && h > 2) bad.push(a.id + '/' + b.id); }));
    own.forEach((a, i) => own.forEach((b, j) => { if (j <= i) return; const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top); if (w > 2 && h > 2) bad.push(a.id + '/' + b.id); }));
    return { bad, n: own.length, m: others.length };
  });

  sec('1. migration: an old save with no S.projects loads with the defaults');
  await t.newGame({ map215: true, ground: true }, { coins: 1000 });
  ok(await ev(() => { const p = window.__paw.S.projects; return !!p && p.i === 0 && p.paid === 0 && Array.isArray(p.built) && !p.built.length && Array.isArray(p.building) && Array.isArray(p.letters); }), 'a new save starts with S.projects { i: 0, paid: 0, built: [], building: [], letters: [] }');
  await ev(() => { const S = window.__paw.S; delete S.projects; window.__paw.saveNow(); });
  ok(await ev(() => !JSON.parse(localStorage.getItem('pawhaven_proto_v1')).projects), 'the stored save has no projects field (an old save)');
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  ok(await ev(() => { const S = window.__paw.S, p = S.projects; return S.v === 1 && !!p && p.i === 0 && p.paid === 0 && p.built.length === 0; }), 'the old save loads, still v 1, with the default projects');
  ok(await ev(() => { const s = { projects: { i: 'x', paid: -40, built: 'no', building: [{ id: 'fountain' }, null, { id: 'bandstand', ready: '2026-01-01' }], letters: null } }; window.__paw.pr.fields(s); const p = s.projects; return p.i === 0 && p.paid === 0 && Array.isArray(p.built) && p.building.length === 1 && p.building[0].id === 'bandstand' && Array.isArray(p.letters); }), 'bad values are cleaned (index, negative paid, lists, broken build rows)');
  ok(await ev(() => { const s = { projects: { i: 9, paid: 12.7, built: ['fountain'] } }; window.__paw.pr.fields(s); return s.projects.i === 4 && s.projects.paid === 12 && s.projects.built[0] === 'fountain'; }), 'an index past the last project is clamped, kept fields stay');
  ok(await ev(() => window.__paw.pr.LIST.map((x) => x.id + ':' + x.price).join() === 'fountain:5000,bandstand:10000,sakura:15000,lighthouse:25000'), 'four projects in order: 5,000 / 10,000 / 15,000 / 25,000');

  sec('2. the board in the Town Square and paying in');
  await t.home('square'); await t.until(() => !!document.querySelector('[data-pr-hot="board"]'));
  ok(await ev(() => !!document.querySelector('svg.world [data-pr-hot="board"][role=button][tabindex="0"]')), 'the project board stands in the Town Square, a button');
  ok(await ev(() => !!document.querySelector('[data-pr-hot="fountain"]') && !document.querySelector('[data-pr-hot="bandstand"]')), 'the current project (Fountain) shows as a plan; later ones are not drawn');
  await t.p.click('[data-pr-hot="board"] > rect', { force: true }); await t.p.waitForSelector('#modal .pr-sheet');
  ok(await ev(() => document.querySelectorAll('#modal [data-pr-pay]').length === 4 && !!document.querySelector('#modal #prAmt') && document.querySelectorAll('#modal .pr-list li').length === 4), 'the sheet: 4 quick buttons, a typed amount, the list of 4');
  await t.p.click('#modal [data-pr-pay="100"]');
  ok(await t.until(() => window.__paw.S.projects.paid === 100 && window.__paw.S.coins === 900), '+100 puts 100 coins in (1,000 -> 900)');
  ok(await toastSeen(/100 coins into the Fountain/), 'a thank-you toast');
  ok(await ev(() => /100 of 5,000/.test(document.querySelector('#modal .pr-num').textContent) && document.querySelector('#modal .pr-bar').getAttribute('aria-valuenow') === '2'), 'the sheet redraws in place: 100 of 5,000, the bar at 2%');
  await t.p.fill('#modal #prAmt', '123'); await t.p.click('#modal #prPut');
  ok(await t.until(() => window.__paw.S.projects.paid === 223 && window.__paw.S.coins === 777), 'a typed 123 goes in (777 left)');
  await t.p.click('#modal [data-pr-pay="keep"]');
  ok(await t.until(() => window.__paw.S.coins === 200 && window.__paw.S.projects.paid === 800), '"All but 200" keeps 200 coins');
  ok(await ev(() => document.querySelector('#modal [data-pr-pay="keep"]').getAttribute('aria-disabled') === 'true' && document.querySelector('#modal [data-pr-pay="500"]').getAttribute('aria-disabled') === 'true' && !document.querySelector('#modal [data-pr-pay="100"]').hasAttribute('aria-disabled')), 'then "All but 200" and +500 (more than the pocket) are off, +100 is on');
  await ev(() => document.querySelector('#modal [data-pr-pay="500"]').click()); await t.sleep(200);
  ok(await ev(() => window.__paw.S.coins === 200 && window.__paw.S.projects.paid === 800), 'an off button puts nothing in');
  ok(await ev(() => !!document.querySelector('[data-pr-hot="fountain"]') && window.__paw.pr.stage('fountain') === 'plan'), 'under half paid: the plan sketch');
  ok(await ev(() => [window.__paw.pr.pay(-5), window.__paw.pr.pay('abc'), window.__paw.pr.pay(0)].every((n) => n === 0) && window.__paw.S.coins === 200), 'nothing, a word or a negative puts nothing in');
  ok(await ev(() => window.__paw.pr.pay(100000) === 200 && window.__paw.S.coins === 0 && window.__paw.S.projects.paid === 1000), 'a huge amount takes only the pocket: coins end at 0, never below');
  ok(await ev(() => window.__paw.pr.pay(10) === 0 && window.__paw.S.coins === 0), 'with an empty pocket nothing more goes in');
  await t.closeX();

  sec('3. fully paid: 2 Japan days of building, then built for good with one letter');
  await t.patch({ coins: 10000 }); await ev(() => { window.__paw.S.projects.paid = 2600; window.__paw.pr.draw(); });
  ok(await ev(() => window.__paw.pr.stage('fountain') === 'half'), 'half paid: the half-built fountain with scaffolding');
  ok(await ev(() => window.__paw.pr.pay(5000) === 2400 && window.__paw.S.coins === 7600), 'the last coins: only what is left is taken (2,400 of 5,000)');
  const p3 = await P(); const today = await ev(() => window.__paw.pr.today());
  ok(p3.i === 1 && p3.paid === 0 && p3.building.length === 1 && p3.building[0].id === 'fountain', 'the Fountain moves to building, the Bandstand is next');
  ok(p3.building[0].ready === await ev((d) => new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10) + 2)).toISOString().slice(0, 10), today), 'ready 2 Japan days after it was paid (' + p3.building[0].ready + ')');
  ok(await ev(() => window.__paw.pr.stage('fountain') === 'half' && window.__paw.pr.stage('bandstand') === 'plan'), 'while it builds the fountain keeps its scaffolding; the bandstand plan appears');
  ok(!(await ev(() => window.__paw.pr.tick())) && !(await P()).built.length, 'the same day: still building');
  await t.p.click('[data-pr-hot="fountain"] > rect', { force: true });
  ok(await toastSeen(/ready in 2 days/), 'tapping it: "ready in 2 days"');
  await ev(() => window.__paw.pr.skip(1));
  ok(!(await ev(() => window.__paw.pr.tick())), 'the next day: still building');
  await ev(() => window.__paw.pr.open()); await t.p.waitForSelector('#modal .pr-sheet');
  ok(await ev(() => /ready tomorrow/.test(document.querySelector('#modal .pr-building').textContent)), 'the sheet says "ready tomorrow"');
  await t.closeX();
  await ev(() => window.__paw.pr.skip(1));
  ok(await ev(() => window.__paw.pr.tick()), 'two days on: finished');
  const p4 = await P();
  ok(p4.built.includes('fountain') && !p4.building.length && p4.letters.join() === 'fountain', 'the Fountain is built and its letter noted');
  ok(await ev(() => window.__paw.S.mail.filter((m) => m.id === 'pr_ribbon_fountain').length === 1 && window.__paw.S.mail.find((m) => m.id === 'pr_ribbon_fountain').keep === true), "Gerald's ribbon-cutting letter is in the mailbox, kept");
  await ev(() => { window.__paw.pr.tick(); window.__paw.pr.skip(3); window.__paw.pr.tick(); });
  ok(await ev(() => window.__paw.S.mail.filter((m) => m.id === 'pr_ribbon_fountain').length === 1), 'the letter comes only once');
  ok(await ev(() => window.__paw.pr.stage('fountain') === 'done' && !!document.querySelector('[data-pr-hot="fountain"]')), 'the finished fountain stands in the Square');

  sec('4. built projects stay after a reload; the fountain and the bandstand');
  await ev(() => { const p = window.__paw.S.projects; p.built.push('bandstand'); p.letters.push('bandstand'); p.i = 2; window.__paw.saveNow(); });
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  ok(await ev(() => window.__paw.S.projects.built.join() === 'fountain,bandstand' && window.__paw.S.projects.i === 2), 'after a reload: Fountain and Bandstand still built, Sakura Avenue next');
  ok(await ev(() => window.__paw.S.mail.filter((m) => /^pr_ribbon_/.test(m.id)).length === 1), 'no letter is sent again on load');
  await t.home('square'); await t.until(() => !!document.querySelector('[data-pr-hot="bandstand"]'));
  ok(await ev(() => !!document.querySelector('[data-pr-hot="fountain"]') && !!document.querySelector('[data-pr-hot="bandstand"]') && document.querySelectorAll('.pr-tree').length === 3), 'the Square shows the fountain, the bandstand and the 3 planned sakura trees');
  await ev(() => { window.__paw.S.stats.happy = 50; window.__paw.S.projects.treatAt = -1e9; });
  await t.p.click('[data-pr-hot="fountain"] > rect', { force: true });
  ok(await toastSeen(/long drink at the fountain\. \+5 Happiness/), 'the fountain: a drink, +5 Happiness');
  ok(await ev(() => window.__paw.S.stats.happy === 55), 'Happiness 50 -> 55');
  const tAt = await ev(() => window.__paw.S.projects.treatAt); await ev(() => { window.__toasts.length = 0; });
  await ev(() => window.__paw.pr.tap('fountain')); // the dog may now stand in front of the fountain after its drink
  ok(await toastSeen(/long drink at the fountain\.$/) && await ev((a) => window.__paw.S.projects.treatAt === a && window.__paw.S.stats.happy <= 55, tAt), 'again within the game hour: still a drink, no extra Happiness (nothing is lost)');
  await ev(() => { window.__paw.S.projects.treatAt = -1e9; });
  await t.p.click('[data-pr-hot="bandstand"] > rect', { force: true });
  ok(await toastSeen(/band plays a little tune/), 'the bandstand plays a tune');

  sec('5. the lighthouse at the Lighthouse Pier, lit at night');
  await ev(() => { const p = window.__paw.S.projects; p.built = ['fountain', 'bandstand', 'sakura', 'lighthouse']; p.i = 4; p.paid = 0; });
  await t.home('pier'); await t.until(() => !!document.querySelector('[data-pr-hot="lighthouse"]'));
  ok(await ev(() => !!document.querySelector('[data-pr-hot="lighthouse"]') && !document.querySelector('.pr-glow')), 'the lighthouse stands at sea; by day its light is off');
  await t.p.click('[data-pr-hot="lighthouse"] > rect', { force: true });
  ok(await toastSeen(/Come back at night/), 'by day: "come back at night"');
  ok((await noOverlap()).bad.length === 0, 'pier: the lighthouse covers no other tap target');
  await ev(() => window.__paw.pr.open()); await t.p.waitForSelector('#modal .pr-sheet');
  ok(await ev(() => !!document.querySelector('#modal .pr-all') && !document.querySelector('#modal [data-pr-pay]') && document.querySelectorAll('#modal .pr-list li[data-st="built"]').length === 4), 'all four built: a thank-you, no pay buttons');
  await t.closeX();

  sec('6. desktop 1280x720: no tap target overlaps another');
  await t.home('square'); await t.until(() => !!document.querySelector('[data-pr-hot="bandstand"]'));
  const d1 = await noOverlap(); ok(d1.n === 3 && d1.bad.length === 0, 'square, all built: board, fountain and bandstand clear of ' + d1.m + ' other tap targets' + (d1.bad.length ? ' (' + d1.bad.join(', ') + ')' : ''));
  ok(await ev(() => [...document.querySelectorAll('[data-pr-hot] > rect')].every((r) => { const b = r.getBoundingClientRect(); return b.width >= 44 && b.height >= 44; })), 'every build is at least 44 x 44 px to tap');
  await t.ctx.close();

  sec('7. night: the lighthouse lights up');
  await t.newGame({ map215: true, ground: true, time: 'night' }, { coins: 100 });
  await ev((a) => { const p = window.__paw.S.projects; p.built = a; p.i = 4; }, ALL);
  await t.home('pier'); await t.until(() => !!document.querySelector('[data-pr-hot="lighthouse"]'));
  ok(await ev(() => !!document.querySelector('.pr-glow .pr-beam') && !document.querySelector('[data-pr-hot="lighthouse"] .pr-glow')), 'at night the lamp glows and the beam reaches out (outside the tap box)');
  await t.p.click('[data-pr-hot="lighthouse"] > rect', { force: true });
  ok(await toastSeen(/light sweeps over the sea/), 'at night: the light sweeps over the sea');
  await t.ctx.close();

  sec('8. phone 360x640: the board, the builds and the sheet fit');
  await t.newGame({ map215: true, ground: true, device: 'Phone 360x640' }, { coins: 3000 });
  await ev(() => { const p = window.__paw.S.projects; p.built = ['fountain']; p.i = 1; p.paid = 4000; });
  await t.home('square'); await t.until(() => !!document.querySelector('[data-pr-hot="board"]'));
  const ph = await noOverlap(); ok(ph.bad.length === 0, 'phone square: no build covers another tap target' + (ph.bad.length ? ' (' + ph.bad.join(', ') + ')' : ''));
  ok(await ev(() => { const r = document.querySelector('[data-pr-hot="board"] > rect').getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth; }), 'phone: the board is on screen and at least 44 px');
  ok(await ev(() => { const r = document.querySelector('[data-pr-hot="fountain"] > rect').getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && r.right > 44; }), 'phone: the fountain is at least 44 px and in view');
  await t.p.click('[data-pr-hot="board"] > rect', { force: true }); await t.p.waitForSelector('#modal .pr-sheet');
  await t.until(() => { const p = document.querySelector('#modal .panel'); return !!p && !p.getAnimations().length; }, null, 3000);
  const L = await ev(() => { const p = document.querySelector('#modal .panel'), pr = p.getBoundingClientRect(), bar = document.getElementById('bar'), bt = [...p.querySelectorAll('[data-pr-pay], #prPut, #prAmt')].map((b) => b.getBoundingClientRect());
    return { l: pr.left, r: pr.right, w: innerWidth, pageW: document.documentElement.scrollWidth, minH: Math.min(...bt.map((b) => b.height)), inside: bt.every((b) => b.left >= pr.left - 1 && b.right <= pr.right + 1), barTop: bar && bar.offsetParent ? bar.getBoundingClientRect().top : 9999, bottom: pr.bottom, art: p.querySelector('.pr-art').getBoundingClientRect().width };
  });
  ok(L.l >= 0 && L.r <= L.w + 1 && L.pageW <= L.w, 'phone: the sheet fits the 360 px width, no sideways scroll');
  ok(L.minH >= 44 && L.inside, 'phone: every pay button and the amount box is at least 44 px tall and inside the sheet (' + Math.round(L.minH) + ' px)');
  ok(L.bottom <= L.barTop + 1, 'phone: the sheet ends above the phone bar');
  ok(L.art >= 90, 'phone: the progress drawing stays readable (' + Math.round(L.art) + ' px)');
  await t.p.click('#modal [data-pr-pay="keep"]');
  ok(await t.until(() => window.__paw.S.coins === 200 && window.__paw.S.projects.paid === 6800), 'phone: "All but 200" works (2,800 in, 200 kept)');
  ok(await ev(() => window.__paw.pr.stage('bandstand') === 'half'), 'past half: the bandstand gets its scaffolding');
});
