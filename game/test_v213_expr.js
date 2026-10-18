// v2.13 EX lane (V213.md section 4): face expressions in play. The API (exOn, exShow, exNow, exTrig), the personality (BREED_FACES, the traits, the
// owner's examples), only the dog whose face changes is drawn again, one face at a time with cooldowns, at most one roam face a second, and every
// hook: roaming, petting (leader and pack), feed and treats, the bath, the groom, digging, ball play (catch, the end pout), a good trick, the first
// arrival of the day at the Mt. Fuji Lookout, the Shelter Playroom, Dog Card paws, and the photo mode face picker (capture and export with a face on).
// Deterministic: random picks go through __paw.ex.rnd, the roam faces are off unless a section turns them on. node game/run_tests.js v213_expr
require('./test_lib').run('v213_expr', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a);
  const X = (f, a) => ev(f, a);
  const cls = (sel) => ev((s) => { const e = document.querySelector(s); const m = e && /pa-ex-([a-z]+)/.exec(e.getAttribute('class') || ''); return m ? m[1] : null; }, sel);
  const leadCls = () => cls('#dogArt svg.pa-dog'), packCls = (id) => cls(`#pack [data-dog="${id}"] .rm-art svg.pa-dog`);
  const logOf = (id, evn) => X(([id, e]) => window.__paw.ex.log.filter((l) => l.id === id && (!e || l.ev === e)), [id, evn]);
  const fresh = () => X(() => { const x = window.__paw.ex; window.__paw.S.dogs.forEach((d) => x.clear(d.id)); x.cool(); x.clearLog(); x.rnd(null); });

  sec('1. old suites: without prefs.exTest there are no faces');
  await t.newGame({}, { coins: 2000, bond: { level: 8, pts: 2000 } });
  ok(await X(() => !!window.__paw.ex && window.__paw.ex.on() === false), 'exOn() is false under the harness without prefs.exTest');
  ok(await X(() => window.__paw.ex.show(window.__paw.S.dog.id, 'hearts', 2000) === false && !document.querySelector('#view svg[class*="pa-ex-"]')), 'exShow does nothing: no pa-ex- class in the scene');
  await t.ctx.close();

  sec('2. the personality tables');
  await t.newGame({ prefs: { exTest: true, jpTest: true } }, { coins: 3000, bond: { level: 8, pts: 2000 }, inv: { food: { 'Basic Kibble': 5, 'Sweet Potato Chews': 5 } } });
  await X(() => window.__paw.ex.roam(false));
  ok(await X(() => window.__paw.ex.on() === true), 'exOn() with prefs.exTest');
  const tab = await X(() => { const x = window.__paw.ex, B = (window.PawGenes && window.PawGenes.BREEDS) || [], keys = (Array.isArray(B) ? B : Object.keys(B)).concat(window.PawArt.DOGS.map((d) => d.key)); return { keys: [...new Set(keys)], faces: x.faces, list: x.list, words: x.words, art: window.PawArt.EXPR_LIST }; });
  ok(tab.keys.length === 35 && tab.keys.every((k) => Array.isArray(tab.faces[k])) && Object.keys(tab.faces).length === 35, `BREED_FACES has a row for all 35 breeds (${Object.keys(tab.faces).length})`);
  ok(Object.values(tab.faces).every((l) => l.length >= 2 && l.length <= 4 && l.every((n) => tab.list.includes(n)) && new Set(l).size === l.length), 'each row: 2 to 4 different faces from the fourteen');
  ok(JSON.stringify(tab.list) === JSON.stringify(tab.art), 'the fourteen faces are PawArt.EXPR_LIST, in its order');
  ok(tab.list.every((n) => typeof tab.words[n] === 'string' && tab.words[n].length && !/[;]/.test(tab.words[n])), 'every face has a player word (V213.md 3.1): ' + tab.list.map((n) => tab.words[n]).join(', '));
  const W = (key, e) => X(([k, e]) => window.__paw.ex.weights(k, e), [key, e]), share = (w, l) => l.reduce((a, n) => a + (w[n] || 0), 0);
  const DRAMA = ['pout', 'surprised', 'guilty'], SLEEP = ['sleepy', 'dreamy'], SHOW = ['proud', 'wink', 'wow'];
  const others = ['golden', 'mutt', 'corgi', 'lab', 'beagle', 'husky', 'chihuahua']; // (the pug and the Shih Tzu are sleepy dogs too)
  for (const e of ['roam', 'pet', 'shelterMeet']) {
    const sh = share(await W('shiba', e), DRAMA), ms = share(await W('mastiff', e), SLEEP), sp = share(await W('spitz', e), SHOW);
    let oD = 0, oS = 0, oW = 0; for (const k of others) { oD = Math.max(oD, share(await W(k, e), DRAMA)); oS = Math.max(oS, share(await W(k, e), SLEEP)); oW = Math.max(oW, share(await W(k, e), SHOW)); }
    ok(sh > 1.5 * oD && sh >= 0.25, `${e}: the Shiba is dramatic: pout, surprised and guilty ${(sh * 100).toFixed(0)}% (others at most ${(oD * 100).toFixed(0)}%)`);
    ok(ms > 1.5 * oS && ms >= 0.4, `${e}: the English Mastiff is sleepy: sleepy and dreamy ${(ms * 100).toFixed(0)}% (others at most ${(oS * 100).toFixed(0)}%)`);
    ok(sp > 1.5 * oW && sp >= 0.3, `${e}: the Japanese Spitz shows off: proud, wink and wow ${(sp * 100).toFixed(0)}% (others at most ${(oW * 100).toFixed(0)}%)`);
  }
  const only = async (e, l) => { const w = await W('pitbull', e); return Object.keys(w).every((n) => l.includes(n)) && Object.keys(w).length > 0; };
  ok(await only('cardPaw', ['hearts', 'wink']) && await only('ballEnd', ['pout']) && await only('dig', ['guilty']) && await only('newPlace', ['wow']), 'fixed events: a paw = hearts or wink, the end of ball play = pout, digging = guilty, a new place = wow');
  ok(Math.abs(Object.values(await W('chow', 'feed')).reduce((a, b) => a + b, 0) - 1) < 1e-9, 'weights are shares (they add up to 1)');

  sec('3. exShow: only that dog is drawn again, then the normal face');
  await X(() => { const P = window.__paw; P.addDog({ key: 'mastiff', sex: 'male', months: 30 }, 'Moose'); P.addDog({ key: 'spitz', sex: 'female', months: 20 }, 'Yuki'); });
  await t.calm(); await t.home('house'); await t.home('yard'); await t.sleep(300); await X(() => window.__paw.ex.roam(false)); await fresh();
  const [A, M, Y] = (await t.S()).dogs.map((d) => d.id);
  // record which dog's art nodes change (childList mutations inside #pack, by the dog group they happen in)
  const watch = () => X(() => { window.__exMut = []; if (window.__exObs) window.__exObs.disconnect(); window.__exObs = new MutationObserver((ms) => ms.forEach((m) => { const g = m.target.closest && m.target.closest('[data-dog]'); window.__exMut.push(g ? g.dataset.dog : m.target.id || m.target.tagName); })); window.__exObs.observe(document.getElementById('pack'), { childList: true, subtree: true }); });
  const muts = () => X(() => [...new Set(window.__exMut)]);
  await watch();
  ok(await X((id) => window.__paw.ex.show(id, 'wink', 900), A), 'exShow on the leader');
  ok(await leadCls() === 'wink', 'the leader is drawn with the pa-ex-wink class');
  ok(JSON.stringify(await muts()) === JSON.stringify([A]), 'only the leader\'s art changed: ' + JSON.stringify(await muts()));
  ok(await X((id) => window.__paw.ex.now(id, 'idle') === 'wink' && window.__paw.ex.now(id, 'sleep') === null, A), 'exNow: the face on an awake pose, none on sleep');
  ok(await X((id) => window.__paw.ex.show(id, 'pout', 900) && window.__paw.ex.cur(id).name === 'pout', A) === true, 'a forced show replaces it (the test hook)');
  ok(await X((id) => window.__paw.ex.trig(id, 'pet', { pose: 'idle' }) === null, A), 'one at a time: a pet face waits while one shows');
  ok(await t.until(() => !document.querySelector('#dogArt svg[class*="pa-ex-"]'), null, 3000), 'after its time the normal face is back');
  ok(await X((id) => window.__paw.ex.trig(id, 'pet', { pose: 'idle' }) === null, A), 'cooldown: no new face straight after');
  await X((id) => { window.__paw.rm.pause('test'); const d = window.__paw.S.dogs.find((x) => x.id === id); d.sleeping = false; window.__paw.rm.set(id, { pose: 'sit' }); }, M); // awake and sitting (a nap takes no face)
  await watch(); await X((id) => window.__paw.ex.show(id, 'sleepy', 900), M);
  ok(await packCls(M) === 'sleepy' && JSON.stringify(await muts()) === JSON.stringify([M]), 'a pack dog: only its art changed: ' + JSON.stringify(await muts()));
  ok(await t.until((id) => !document.querySelector(`#pack [data-dog="${id}"] svg[class*="pa-ex-"]`), M, 3000), 'and its normal face comes back');
  await X(() => window.__paw.rm.resume('test'));
  ok(await X(() => window.__paw.ex.show('nope', 'wink') === false && window.__paw.ex.show(window.__paw.S.dog.id, 'grumpy') === false), 'unknown dogs and faces are ignored');
  await fresh();

  sec('4. roaming: the occasional face, at most one a second in the scene');
  ok(await X(([h, m]) => window.__paw.ex.rate(h) > window.__paw.ex.rate(m), [Y, M]), 'the roam rate follows energy and attention (the spitz makes faces more often than the mastiff)');
  await X(() => { const x = window.__paw.ex; x.roam(true); x.rnd(0); });
  const t0 = await X(() => { window.__paw.ex.roamTick(); return window.__paw.ex.log.length; });
  ok(t0 === 1, 'a roam tick with a sure roll starts one face');
  const t1 = await X(() => { for (let i = 0; i < 4; i++) window.__paw.ex.roamTick(); return window.__paw.ex.log.length; });
  ok(t1 === 1, 'more ticks within the second start nothing more (at most one roam face a second)');
  ok(await t.until(() => window.__paw.ex.log.length >= 2, null, 4000), 'the rmTick loop starts the next one after the gap');
  const L4 = await X(() => window.__paw.ex.log.filter((l) => l.ev === 'roam'));
  ok(L4.every((l, i) => !i || l.t - L4[i - 1].t >= 990), 'roam faces start at least a second apart: ' + L4.map((l) => l.t - L4[0].t).join(', '));
  await X(() => { const x = window.__paw.ex; x.roam(false); x.rnd(null); }); await fresh();
  ok(await X(() => { window.__paw.rm.pause('test'); window.__paw.ex.rnd(0); window.__paw.ex.roam(true); const r = window.__paw.ex.roamTick(); window.__paw.ex.roam(false); window.__paw.rm.resume('test'); return r === false; }), 'no roam face while the scene is held (ball play, photo mode, training)');
  await fresh();

  sec('5. petting: the leader and a pack dog');
  ok(await t.pet((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'pet'), A), 'rubbing the leader: a pet face');
  await t.lu(); await t.sleep(200);
  const tap = await X((id) => { const r = document.querySelector(`#pack [data-dog="${id}"] .pd-wander > rect`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.55]; }, M);
  for (let i = 0; i < 3 && !(await logOf(M, 'pet')).length; i++) { await t.p.mouse.click(tap[0], tap[1]); await t.sleep(150); }
  ok((await logOf(M, 'pet')).length === 1, 'tapping a pack dog (crPetAt): its own pet face');
  await t.luWait(800); await fresh();

  sec('6. feed and treats: after eating');
  await X(() => { window.__paw.ex.rnd(0); window.__paw.feed('Basic Kibble'); });
  ok(await t.until((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'feed'), A, 9000), 'a meal: a feed face once the dog has eaten');
  const fl = (await logOf(A, 'feed'))[0]; ok(!!fl && fl.name === 'yum', 'the first pick of a meal is yum (' + (fl && fl.name) + ')');
  await t.until(() => !document.querySelector('#dogArt svg[class*="pa-ex-"]'), null, 6000); await fresh(); await X(() => { window.__paw.S.dog.stats.hunger = 40; });
  await t.retryUntil(() => X(() => window.__paw.feed('Sweet Potato Chews')), (id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'treat'), A, { tries: 3, each: 9000 });
  ok((await logOf(A, 'treat')).length === 1, 'a snack food is a treat: a treat face');
  await fresh();

  sec('7. the bath, the groom and digging');
  await X(() => window.__paw.go('bath')); await t.untilMode('bath');
  for (let i = 0; i < 24 && (await t.mode()) === 'bath' && !(await logOf(A, 'bath')).length; i++) await t.p.keyboard.press('Space');
  ok((await logOf(A, 'bath')).length === 1, 'a finished bath: a face (picked from ' + JSON.stringify(Object.keys(await W('shiba', 'bath'))) + ')');
  await t.untilMode('yard', 6000); await t.lu(); await fresh();
  await t.home('salon'); await t.p.click('#placeBtns [data-pb="groom"]'); await t.p.click('#slGo');
  ok(await t.until((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'brush'), A, 3000), 'the full groom (the brushing): a face');
  await fresh(); await t.home('beach'); await X(() => { window.__paw.S.daily.beachDig = false; }); await t.p.click('#placeBtns [data-pb="dig"]');
  ok(await t.until((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'dig' && l.name === 'guilty'), A, 4000), 'a beach dig: the guilty face');
  ok(await t.until(() => /pa-ex-guilty/.test((document.querySelector('#dogArt svg') || {}).className.baseVal || ''), null, 1500) || !(await X(() => window.PawArt.exprOk('guilty', 'idle'))), 'drawn on the dog after the dig');
  await fresh();

  sec('8. a good trick');
  await X(() => window.__paw.ms.act('trick', { name: 'Sit', grade: 'Missed' }));
  ok(!(await logOf(A, 'trick')).length, 'a missed trick: no face');
  await X(() => window.__paw.ms.act('trick', { name: 'Sit', grade: 'Great' }));
  ok((await logOf(A, 'trick')).length === 1, 'a Great trick: a face (' + ((await logOf(A, 'trick'))[0] || {}).name + ')');
  await fresh();

  sec('9. ball play: the catch and the end of play');
  await t.home('yard'); await t.sleep(200); await fresh();
  ok(await X(() => window.__paw.bl.start('Tennis Ball')), 'ball play starts');
  await X(() => { window.__paw.bl.seed(7); window.__paw.bl.throwV(800, -600); window.__paw.bl.sim(14); });
  ok(await t.until(() => window.__paw.ex.log.some((l) => l.ev === 'ballCatch'), null, 3000), 'a catch: the catcher makes a face (' + (await X(() => (window.__paw.ex.log.find((l) => l.ev === 'ballCatch') || {}).name)) + ')');
  ok(await X(() => window.__paw.bl.state && window.__paw.bl.state.ph === 'rest' && window.__paw.bl.state.n === 1), 'the ball came back');
  const ran = await X(() => window.__paw.bl.dogs.filter((o) => o.ran).map((o) => o.id));
  await X(() => window.__paw.ex.cool()); await X(() => window.__paw.bl.stop());
  ok(await t.until((l) => l.every((id) => window.__paw.ex.log.some((x) => x.id === id && x.ev === 'ballEnd' && x.name === 'pout')), ran, 3000), `the end of play: a short pout for every dog that ran (${ran.length})`);
  ok(await t.until(() => !window.__paw.S.dogs.some((d) => window.__paw.ex.cur(d.id)), null, 4000), 'then fine');
  await fresh();

  sec('10. a new place: the first arrival of the day at the Mt. Fuji Lookout');
  await X(() => window.__paw.ex.wowReset()); await t.travel('fujihill');
  ok(await t.until((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'newPlace' && l.name === 'wow'), A, 5000), 'arriving: wow');
  ok(await t.until((l) => l.every((id) => window.__paw.ex.log.some((x) => x.id === id && x.ev === 'newPlace')), [A, M, Y], 4000), 'the whole pack says wow');
  await t.travel('park'); await fresh(); await t.travel('fujihill'); await t.sleep(2500);
  ok(!(await X(() => window.__paw.ex.log.some((l) => l.ev === 'newPlace'))), 'the second arrival the same day: no wow');
  await t.home('yard'); await fresh();

  sec('11. Dog Cards: a paw makes the card\'s dogs smile (this device only)');
  await t.home('dogpark'); await X(() => window.__paw.rm.pause('test'));
  ok(await t.until(() => window.__paw.dc.visitors().length > 0, null, 5000), 'visitors at the Dog Park');
  const card = await X(() => window.__paw.dc.visitors()[0].card);
  await X((c) => window.__paw.dc.card(c), card); await t.until(() => !!document.querySelector('#modal [data-dc-card]'), null, 3000);
  const keys0 = await X(() => JSON.stringify(Object.keys(window.__paw.S.dc).sort()));
  await X((c) => window.__paw.dc.give(c), card);
  ok(await t.until((c) => window.__paw.ex.log.some((l) => l.ev === 'cardPaw' && l.id.startsWith('dcv:' + c + ':')), card, 3000), 'the visitors of that card make a face');
  const cp = await X((c) => window.__paw.ex.log.filter((l) => l.ev === 'cardPaw' && l.id.startsWith('dcv:' + c + ':')).map((l) => l.name), card);
  ok(cp.every((n) => n === 'hearts' || n === 'wink'), 'hearts or a wink: ' + cp.join(', '));
  ok(await t.until(() => !!document.querySelector('#modal [data-dc-card] .dc-art svg[class*="pa-ex-"]'), null, 2000), 'the open card\'s picture of the dog shows it too');
  ok(await t.until(() => !!document.querySelector('#dcVis svg[class*="pa-ex-"]'), null, 2000), 'and the visitor in the scene');
  ok(await X(() => JSON.stringify(Object.keys(window.__paw.S.dc).sort())) === keys0, 'no new card or save field');
  await t.closeX(); await X(() => window.__paw.rm.resume('test')); await t.home('yard'); await fresh();

  sec('12. the Shelter Playroom: a dog you meet');
  await X(() => window.__paw.go('shelter')); await t.untilMode('shelter'); await t.until(() => window.__paw.sr.dogs().length > 0, null, 5000); await t.closeX();
  const rd = await X(() => window.__paw.sr.dogs().find((d) => !d.walking) || window.__paw.sr.dogs()[0]);
  await X((id) => window.__paw.sr.pet(id), rd.id);
  ok(await t.until((id) => window.__paw.ex.log.some((l) => l.id === id && l.ev === 'shelterMeet'), rd.id, 2000), `petting a room dog (${rd.key}): it makes a face`);
  ok(await t.until((id) => !!document.querySelector(`[data-srdog="${id}"] svg[class*="pa-ex-"]`), rd.id, 2000), 'drawn on that room dog');
  await t.leaveShelter(); await fresh();

  sec('13. photo mode: the face picker');
  await t.home('yard'); await t.sleep(200); await X(() => { window.__paw.S.dogs.forEach((d) => { d.sleeping = false; }); });
  ok(await X(() => window.__paw.ph.open()), 'photo mode opens');
  ok(await t.until(() => window.__paw.ph.ready(), null, 10000), 'the photo is ready');
  const pk = await X(() => [...document.querySelectorAll('.ex-faces [data-exface]')].map((b) => ({ n: b.dataset.exface, l: b.getAttribute('aria-label'), p: b.getAttribute('aria-pressed'), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height, svg: !!b.querySelector('svg') })));
  ok(pk.length === 15 && pk[0].n === '' && pk[0].l === 'Natural' && pk[0].p === 'true', 'Natural and the fourteen faces, Natural picked');
  ok(pk.every((b) => b.w >= 44 && b.h >= 44 && b.svg), 'every face button is at least 44 px with the leader\'s head drawn on it');
  ok(await X(() => { const v = document.querySelector('.ph-view'), f = document.querySelector('.ex-faces').getBoundingClientRect(), i = document.querySelector('.ph-pic').getBoundingClientRect(), r = v.getBoundingClientRect(); return i.bottom <= f.top + 1 && f.bottom <= r.bottom + 1; }), 'the picture sits above the faces row');
  ok(await X(() => !window.__paw.ph.svg().includes('pa-ex-')), 'Natural: no face in the picture');
  await t.p.click('[data-exface="hearts"]');
  ok(await t.until(() => window.__paw.ph.ready() && window.__paw.ph.svg().includes('pa-ex-hearts'), null, 10000), 'Heart eyes: the picture is taken again with the face on');
  const live = await X(() => [...document.querySelectorAll('#pack .rmdog')].map((g) => { const s = g.querySelector('svg.pa-dog'); return { cls: s ? s.getAttribute('class') : '', pose: s ? (/pa-pose-(\w+)/.exec(s.getAttribute('class')) || [])[1] : '' }; }));
  ok(live.every((d) => /pa-ex-hearts/.test(d.cls) || !/^(idle|sit|happy|pet|down|beg)$/.test(d.pose)), 'every dog in the scene wears it: ' + live.map((d) => d.pose + (/pa-ex-hearts/.test(d.cls) ? '+hearts' : '')).join(', '));
  ok(await X(() => window.__paw.ph.blobSize() > 1000), 'the PNG export is made with the face on (' + await X(() => window.__paw.ph.blobSize()) + ' bytes)');
  ok(await X(() => JSON.parse(localStorage.getItem('pawhaven_prefs_v1')).phFace === 'hearts' && document.querySelector('.ex-fnow').textContent === 'Heart eyes'), 'remembered in prefs.phFace, the label says Heart eyes');
  ok(await X(() => document.querySelector('[data-exface="hearts"]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-exface=""]').getAttribute('aria-pressed') === 'false'), 'the picked button is pressed');
  await X(() => window.__paw.ph.close());
  ok(await t.until(() => !document.querySelector('#pack svg[class*="pa-ex-"]'), null, 2000), 'closing photo mode gives the dogs their own faces back');
  await X(() => window.__paw.ph.open()); await t.until(() => window.__paw.ph.ready(), null, 10000);
  ok(await X(() => window.__paw.ph.svg().includes('pa-ex-hearts') && document.querySelector('[data-exface="hearts"]').getAttribute('aria-pressed') === 'true'), 'the next photo opens with Heart eyes again');
  await t.p.click('[data-exface=""]'); await t.until(() => window.__paw.ph.ready() && !window.__paw.ph.svg().includes('pa-ex-'), null, 10000);
  ok(await X(() => !window.__paw.ph.svg().includes('pa-ex-') && window.__paw.ex.photo() === null), 'Natural takes it off again');
  await X(() => window.__paw.ph.close());
  ok(t.errors.length === 0, 'no console errors so far');
});
