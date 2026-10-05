// v2.1 HOME: yard decorations (S.decor), photo frame heads, put away / put back, decor:new toast, Proud Mum idle, mumInBasket skip, old saves.
// PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/run_tests.js game/test_v21_home.js --jobs 1
require('./test_lib').run('v21_home', async (t) => {
  const { ok, sec, ev, S, SH, hitR } = t;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  const NAMES = ['Giant Crayon Box', 'Family Photo Frame', 'Doggy Ramp', 'Rocking Chair'];
  const decorAll = (out = true) => Object.fromEntries(NAMES.map((n) => [n, { got: '2026-10-01', out }]));
  const toYard = async () => { await ev(() => { const S = window.__paw.S; S.sleeping = false; S.place = 'yard'; window.__paw.go('yard'); }); await t.until(() => !!document.querySelector('#decorG'), null, 6000); await t.freezeMotion(true); };
  // world-space rect [x1, y1, x2, y2] of a selector inside the yard svg
  const wr = (sel) => ev((sel) => { const e = document.querySelector(sel), svg = document.querySelector('#view svg.world'); if (!e || !svg) return null; const M = svg.getScreenCTM().inverse(), b = e.getBoundingClientRect(); const a = new DOMPoint(b.left, b.top).matrixTransform(M), c = new DOMPoint(b.right, b.bottom).matrixTransform(M); return [a.x, a.y, c.x, c.y].map(Math.round); }, sel);
  const drawn = () => ev(() => [...document.querySelectorAll('#decorG [data-decor]')].map((e) => e.dataset.decor));

  sec('new game: S.decor defaults, nothing drawn');
  await t.newGame({ sex: 'girl' });
  let s = await S();
  ok(s.decor && typeof s.decor === 'object' && Object.keys(s.decor).length === 0, 'S.decor defaults to {}');
  await toYard(); ok((await drawn()).length === 0 && (await ev(() => !!document.querySelector('#decorG'))), 'empty #decorG, no decorations drawn');

  sec('each decoration draws at its fixed spot without covering the dog, mailbox, doors or nursery');
  await ev((d) => { const S = window.__paw.S; S.decor = d; S.litters = []; window.__paw.go('yard'); }, decorAll());
  await t.until(() => document.querySelectorAll('#decorG [data-decor]').length === 4, null, 6000);
  ok((await drawn()).sort().join() === [...NAMES].sort().join(), 'all four draw: ' + (await drawn()).join(', '));
  const dogHit = await wr('#dogHit'), mail = await wr('#mailboxG') || await wr('#sceneG [data-hot=mailbox]'), houseG = await wr('#houseG');
  const HOME_DOOR = [135, 250, 205, 392], NURSERY = [575, 483, 795, 600], BOWL = [205, 462, 295, 552];
  for (const n of NAMES) {
    const r = await wr(`#decorG [data-decor="${n}"] > rect`), sp = await ev((n) => window.__paw.home.specs[n].at, n);
    ok(r && Math.abs(r[0] - sp[0]) <= 1 && Math.abs(r[1] - sp[1]) <= 1 && Math.abs(r[2] - r[0] - sp[2]) <= 2, `${n}: drawn at ${JSON.stringify(r)}`);
    ok(r && !hitR(r, dogHit), `${n}: clear of the dog tap area ${JSON.stringify(dogHit)}`);
    ok(r && mail && !hitR(r, mail), `${n}: clear of the mailbox ${JSON.stringify(mail)}`);
    ok(r && houseG && !hitR(r, [houseG[0] + 20, houseG[1] + 60, houseG[2] - 20, houseG[3]]) , `${n}: clear of the dog house door ${JSON.stringify(houseG)}`);
    ok(r && !hitR(r, HOME_DOOR) && !hitR(r, NURSERY) && !hitR(r, BOWL), `${n}: clear of the house door, nursery basket and bowl`);
  }
  ok(await ev(() => { const g = document.querySelector('#decorG'), d = document.querySelector('#pack') || document.querySelector('#dogPos'); return !!(g.compareDocumentPosition(document.querySelector('#dogPos')) & Node.DOCUMENT_POSITION_FOLLOWING); }), 'decorations sit behind the dogs in the DOM');
  ok(await ev(() => !!document.querySelector('#mailboxG, #sceneG [data-hot=mailbox]')) && await ev(() => !!document.querySelector('#houseG')), 'house and mailbox hotspots still exist');
  await SH('01_yard_four_decor');

  sec('only decorations with out:true are drawn, and only in the yard place');
  await ev(() => { const S = window.__paw.S; S.decor['Doggy Ramp'].out = false; window.__paw.home.redraw(); });
  ok(!(await drawn()).includes('Doggy Ramp') && (await drawn()).length === 3, 'out:false is not drawn');
  await ev(() => { window.__paw.S.decor['Doggy Ramp'].out = true; window.__paw.home.redraw(); });

  sec('click a decoration: story popup, Put away, persists');
  await t.freezeMotion(false);
  await t.p.click('#decorG [data-decor="Rocking Chair"] > rect', { force: true }); await t.waitPop(false).catch(() => {});
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.hm-decor-pop'), null, 4000), 'popup opens');
  const story = await ev(() => document.querySelector('#modal .hm-pop p').textContent);
  ok(story.length > 20 && (story.match(/[.!?]/g) || []).length <= 2 && !story.includes(';'), 'story is 1-2 sentences, no semicolons: ' + story);
  ok(await ev(() => document.querySelector('#modal h2').textContent) === 'Rocking Chair' && (await t.p.locator('#hmAway').textContent()) === 'Put away', 'title and Put away button');
  await SH('02_decor_popup');
  await t.p.click('#hmAway');
  ok(await t.modalGone(), 'popup closes');
  ok(!(await drawn()).includes('Rocking Chair') && (await S()).decor['Rocking Chair'].out === false, 'Rocking Chair put away: gone from the yard, out:false saved');
  ok((await S()).decor['Rocking Chair'].got === '2026-10-01', 'got date kept');

  sec('Decor card in the Care tray lists put-away decorations');
  await t.p.click('[data-act=care]'); await t.waitPop(true);
  ok(await t.p.locator('[data-care=decor]').count() === 1, 'Decor card in the tray');
  await t.p.click('[data-care=decor]');
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) [data-back="Rocking Chair"]'), null, 4000) && await t.p.locator('[data-back]').count() === 1, 'lists only the put-away Rocking Chair');
  await SH('03_decor_card');
  await t.p.click('[data-back="Rocking Chair"]');
  ok(await t.until(() => !!document.querySelector('#decorG [data-decor="Rocking Chair"]'), null, 4000) && (await S()).decor['Rocking Chair'].out === true, 'Put back: drawn again, out:true saved');
  await t.closeX(); await t.home(); await t.freezeMotion(true);

  sec('put away and put back persist across a reload');
  await ev(() => { const S = window.__paw.S; S.decor['Giant Crayon Box'].out = false; window.__paw.saveNow(); });
  const saved = JSON.stringify(await S());
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: saved } }); await p2.goto(require('./test_lib').URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  await t.untilMode('yard'); await t.until(() => !!document.querySelector('#decorG'), null, 6000);
  ok(!(await drawn()).includes('Giant Crayon Box') && (await drawn()).length === 3, 'after reload: Crayon Box still put away, the other three out');

  sec('photo frame draws N heads');
  await ev(() => { const S = window.__paw.S; S.decor = { 'Family Photo Frame': { got: 'x', out: true } }; S.portrait = { date: '2026-10-01', ids: [S.dogs[0].id] }; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#decorG [data-decor]'), null, 6000);
  const heads = () => ev(() => document.querySelectorAll('#decorG .hm-head').length);
  ok(await heads() === 1, 'one portrait id: 1 head');
  await ev(() => { const S = window.__paw.S; S.tree = S.tree || {}; S.tree.gone1 = { id: 'gone1', key: 'beagle', name: 'Ghost', sex: 'female' }; S.tree.gone2 = { id: 'gone2', key: 'corgi', name: 'Ghost2', sex: 'male' }; S.portrait.ids = [S.dogs[0].id, 'gone1', 'gone2', 'nobody']; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#decorG [data-decor]'), null, 6000);
  ok(await heads() === 3, 'dog + 2 tree records + 1 unknown id: 3 heads (unknown skipped)');
  await ev(() => { const S = window.__paw.S; S.portrait.ids = [S.dogs[0].id, 'gone1', 'gone2', 'gone1']; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#decorG [data-decor]'), null, 6000);
  ok(await heads() === 4, '4 ids: 4 heads');
  const fr = await wr('#decorG [data-decor="Family Photo Frame"] > rect'), hr = await ev(() => [...document.querySelectorAll('#decorG .hm-head')].map((g) => { const b = g.getBoundingClientRect(); return [b.left, b.right, b.top, b.bottom]; }));
  const fb = await ev(() => { const b = document.querySelector('#decorG [data-decor="Family Photo Frame"] > rect').getBoundingClientRect(); return [b.left, b.right, b.top, b.bottom]; });
  ok(hr.every((h) => h[0] >= fb[0] - 1 && h[1] <= fb[1] + 1 && h[2] >= fb[2] - 1 && h[3] <= fb[3] + 1), 'heads sit inside the frame box ' + JSON.stringify(fr));
  await ev(() => { delete window.__paw.S.portrait; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#decorG [data-decor]'), null, 6000);
  ok(await heads() === 0 && !errs().length, 'no S.portrait: frame draws with 0 heads, no errors');

  sec('decor:new redraws the yard and toasts');
  await ev(() => { const S = window.__paw.S; S.decor = {}; S.portrait = undefined; window.__paw.go('yard'); });
  await t.until(() => !!document.querySelector('#decorG'), null, 6000); await t.toasts();
  await ev(() => { const S = window.__paw.S; S.decor = S.decor || {}; if (!S.decor['Doggy Ramp']) { S.decor['Doggy Ramp'] = { got: '2026-10-05', out: true }; window.__paw.home.emit('decor:new', { name: 'Doggy Ramp' }); } });
  ok(await t.waitToast(/New for the yard: Doggy Ramp!/), 'toast: New for the yard: Doggy Ramp!');
  ok(await t.until(() => !!document.querySelector('#decorG [data-decor="Doggy Ramp"]'), null, 4000), 'the new decoration is drawn without leaving the yard');

  sec('Proud Mum lies down by the Rocking Chair, the pack skips a mum in the basket');
  await ev(() => { const S = window.__paw.S; window.__paw.addDog({ key: 'beagle', sex: 'female', months: 30 }, 'Mumsy'); S.decor = { 'Rocking Chair': { got: 'x', out: true } }; S.dogs.find((d) => d.name === 'Mumsy').proud = '2026-09-01'; S.litters = []; window.__paw.go('yard'); });
  await t.until(() => document.querySelectorAll('#pack .packdog').length === 1, null, 6000);
  await t.rnd(0.1); await ev(() => window.__paw.home.ambient()); await t.rnd(null);
  ok(await t.until(() => /pa-pose-down\b/.test((document.querySelector('#pack svg.pa-dog') || { getAttribute: () => '' }).getAttribute('class') || ''), null, 4000), 'proud mum picks "down" when the chair is out');
  const chair = await wr('#decorG [data-decor="Rocking Chair"] > rect'), mum = await wr('#pack .packdog');
  ok(chair && mum && Math.abs((mum[2] + mum[0]) / 2 - (chair[0] + chair[2]) / 2) < 140, `she lies next to the chair: mum ${JSON.stringify(mum)}, chair ${JSON.stringify(chair)}`);
  await SH('04_proud_mum');
  await t.rnd(0.3); await ev(() => { const S = window.__paw.S; window.__paw.home.ambient(); }); await t.rnd(null);
  ok(await t.until(() => !/pa-pose-down\b/.test((document.querySelector('#pack svg.pa-dog') || { getAttribute: () => '' }).getAttribute('class') || ''), null, 4000), 'an idle roll above 1 in 4 picks another pose');
  await ev(() => { const S = window.__paw.S; S.decor['Rocking Chair'].out = false; window.__paw.go('yard'); });
  await t.until(() => document.querySelectorAll('#pack .packdog').length === 1, null, 6000);
  await t.rnd(0.1); await ev(() => window.__paw.home.ambient()); await t.rnd(null);
  ok(!(await t.until(() => /pa-pose-down\b/.test((document.querySelector('#pack svg.pa-dog') || { getAttribute: () => '' }).getAttribute('class') || ''), null, 1500)), 'chair put away: she does not lie down');
  // v2.1 merge: BREED's real mumInBasket is in scope now, so make her a real nursing mum instead of stubbing the function
  await ev(() => { const S = window.__paw.S, m = S.dogs.find((d) => d.id !== S.dog.id), t0 = new Date().toISOString().slice(0, 10); S.litters = [{ id: 'hmL', mum: m.id, sire: 'npc', born: t0, until: '2999-01-01', named: true, pups: [{ id: 'hmP', name: 'Pip', key: m.key, sex: 'female', genes: m.genes, born: t0, coat: '', eyes: 'brown', parents: { dam: m.id, sire: 'npc' } }] }]; window.__paw.go('yard'); });
  ok(await t.until(() => document.querySelectorAll('#pack .packdog').length === 0, null, 4000), 'nursing mum (mumInBasket true): the pack skips her');
  await ev(() => { window.__paw.S.litters = []; window.__paw.go('yard'); });
  ok(await t.until(() => document.querySelectorAll('#pack .packdog').length === 1, null, 4000), 'litter gone (mumInBasket false): she is drawn again');

  sec('4 dogs: decorations stay clear of the pack dogs (integration review)');
  await ev(() => { const P = window.__paw, S = P.S; S.litters = []; while (S.dogs.length < 4) P.addDog({ key: ['corgi', 'golden', 'husky'][S.dogs.length - 1] || 'beagle', sex: S.dogs.length % 2 ? 'male' : 'female' }, 'Pal' + S.dogs.length); const t0 = new Date().toISOString().slice(0, 10); ['Giant Crayon Box', 'Family Photo Frame', 'Doggy Ramp', 'Rocking Chair'].forEach((n) => { S.decor[n] = { got: t0, out: true }; }); S.dogs.forEach((d) => { d.proud = null; }); P.go('yard'); });
  await t.until(() => document.querySelectorAll('#pack .packdog').length === 3, null, 6000);
  const packR = await ev(() => { const svg = document.querySelector('#view svg.world'), M = svg.getScreenCTM().inverse(); return [...document.querySelectorAll('#pack .packdog')].map((g) => { const b = g.querySelector('rect').getBoundingClientRect(), a = new DOMPoint(b.left, b.top).matrixTransform(M), c = new DOMPoint(b.right, b.bottom).matrixTransform(M); return [a.x, a.y, c.x, c.y]; }); });
  for (const n of NAMES) {
    const r = await wr(`#decorG [data-decor="${n}"] > rect`), area = (r[2] - r[0]) * (r[3] - r[1]);
    const worst = Math.max(0, ...packR.map((q) => Math.max(0, Math.min(r[2], q[2]) - Math.max(r[0], q[0])) * Math.max(0, Math.min(r[3], q[3]) - Math.max(r[1], q[1])) / area));
    ok(worst <= 0.15, `${n}: at most 15% under a pack dog's tap area (${Math.round(worst * 100)}%)`);
  }

  sec('old save without S.decor loads clean');
  await ev(() => { const S = window.__paw.S; delete S.decor; delete S.portrait; window.__paw.saveNow(); });
  const old = JSON.stringify(await S()); ok(!('decor' in JSON.parse(old)), 'crafted save has no decor field');
  await t.ctx.close(); const p3 = await t.mk({ storage: { pawhaven_proto_v1: old } }); await p3.goto(require('./test_lib').URL); await p3.waitForSelector('#tContinue'); await p3.click('#tContinue');
  await t.untilMode('yard'); await t.until(() => !!document.querySelector('#decorG'), null, 6000);
  s = await S(); ok(s.decor && Object.keys(s.decor).length === 0, 'S.decor defaulted to {} on game:ready');
  await p3.click('[data-act=care]'); await t.waitPop(true);
  ok(await p3.locator('[data-care=decor]').count() === 0 && await p3.locator('[data-care=house]').count() === 1, 'no Decor card without decorations, Care tray is fine');
  ok(!errs().length, 'no page errors: ' + errs().slice(0, 3).join(' | '));
});
