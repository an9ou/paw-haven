// v2.29 "Story mode", part 1 (V229.md, game/src/57_scenes.js + 57b_story.js):
//   1. migration: the S.story defaults, v stays 1, nothing dropped; an advanced old save gets its earned chapters once (one letter, one
//      catch-up scene, the scenes in the album, coins capped); an old save with nothing earned starts at chapter 1 with the prologue
//   2. tasks advance from real actions (feed, pet, travel) and the act bus; an early walk does not count; rewards (XP, Bond, coins) once
//   3. scenes: a chapter's scene plays once automatically, Skip shows at 3 s, the game clock stops, then it lives in Memories (Watch replays it)
//   4. no stacking: a scene waits behind a sheet and the What's new sheet, and two queued scenes never overlap
//   5. Motion off: nothing moves, the shots only cross-fade
//   6. fit: phone 360x640 and desktop 1280x720 (screenshots: V229_SHOTS=<dir>, else test_logs/); every actor of all 25 scenes inside the picture
// node game/run_tests.js v229_story
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const SAVE = 'pawhaven_proto_v1', SHOTS = process.env.V229_SHOTS || path.join(__dirname, 'test_logs');
const ON = { smTest: true, scTest: true, lvTest: true, msTest: true };

run('v229_story', async (t) => {
  const { ok, sec, ev } = t;
  const st = () => ev(() => JSON.parse(JSON.stringify(window.__paw.S.story)));
  const playing = () => ev(() => window.__paw.sc.on());
  // a level card (the story's XP can bring one) is a sheet: the scene waits for it, so the test closes it like a player would
  const waitPlay = (id, ms) => t.until((id) => { const b = document.getElementById('lvOk') || document.getElementById('luOk'); if (b && !window.__paw.sc.on()) b.click(); return window.__paw.sc.on() === id; }, id, ms || 15000);
  const waitStop = (ms) => t.until(() => !window.__paw.sc.on(), null, ms || 20000);
  const hook = () => t.until(() => !!(window.__paw && window.__paw.sm && window.__paw.sc), null, 6000);
  const skipNow = async () => { await t.until(() => { const b = document.querySelector('#scLayer .sc-skip'); return !!b && !b.hidden; }, null, 6000); await t.p.click('#scLayer .sc-skip'); await waitStop(4000); };

  sec('1. migration: S.story defaults; an advanced old save gets its chapters once, with one letter and one catch-up scene');
  await t.newGame({ prefs: ON }, { bond: { level: 4, pts: 500 } });
  ok(await hook(), 'the hooks are there');
  ok(await waitPlay('prologue', 12000), 'a new save: the story starts after the first day and the prologue plays by itself');
  await skipNow();
  let s = await st();
  ok(s.ch === 1 && s.from === 'fresh' && s.w.prologue === 1 && !!s.m.prologue && !s.q.length, `a fresh save is on chapter 1, the prologue is watched and in the album (${JSON.stringify({ ch: s.ch, from: s.from, w: s.w, q: s.q })})`);
  const mg = await ev(() => {
    const F = window.__paw.sm.fields;
    const a = F({ v: 1 }, false), b = F({ v: 1, story: { ch: 2, p: { c2_walk: 1 }, t: { c1_feed: '2026-11-01' }, c: { 1: '2026-11-01' }, m: { ch1: '2026-11-01' }, w: { ch1: 1 }, q: ['ch2'], from: 'fresh', cu: 1 } }, false), c = F({ v: 1, story: 'junk' }, true);
    return { a: a.story, b: b.story, c: c.story, v: a.v };
  });
  ok(mg.v === 1 && mg.a.ch === 0 && mg.a.from === 'old' && mg.a.cu === 0 && Array.isArray(mg.a.q) && ['p', 't', 'c', 'm', 'w'].every((k) => mg.a[k] && typeof mg.a[k] === 'object'), 'an old save: chapter 0 (not started), from old, empty maps, v stays 1');
  ok(mg.b.ch === 2 && mg.b.p.c2_walk === 1 && mg.b.t.c1_feed && mg.b.c[1] && mg.b.w.ch1 === 1 && mg.b.q[0] === 'ch2' && mg.b.from === 'fresh' && mg.b.cu === 1, 'existing story fields are kept as they are');
  ok(mg.c.from === 'fresh' && mg.c.ch === 0, 'a broken story field is rebuilt (fresh)');
  // code review 4: a new save started before the story date (smOn() false then) counts as an old one: on the story date it gets the catch-up,
  // so the places it already knows go into the album instead of playing their first-visit scenes
  const early = await ev(() => {
    const P = window.__paw, S = P.S; P.sm.test(false); const off = P.sm.on(), a = P.sm.fields({ v: 1 }, true).story.from; P.sm.test(true);
    const keep = JSON.stringify({ st: S.story, walks: S.walks, b: S.dogs.map((d) => [d.bond.level, d.bond.pts]), seen: S.lv.seen.dogpark });
    S.story = P.sm.fields({ v: 1 }, false).story; S.story.from = a; S.walks = 0; S.dogs.forEach((d) => { d.bond.level = 1; d.bond.pts = 0; }); S.lv.seen.dogpark = 1; P.sm.start();
    const r = { off, from: a, ch: S.story.ch, cu: S.story.cu, q: S.story.q.slice(), dp: !!S.story.m.visit_dogpark, fresh: P.sm.fields({ v: 1 }, true).story.from };
    const k = JSON.parse(keep); S.story = k.st; S.walks = k.walks; S.dogs.forEach((d, i) => { d.bond.level = k.b[i][0]; d.bond.pts = k.b[i][1]; }); if (k.seen) S.lv.seen.dogpark = k.seen; else delete S.lv.seen.dogpark; return r;
  });
  ok(!early.off && early.from === 'old' && early.fresh === 'fresh', `a new save made while Story mode is off is 'old', made while it is on is 'fresh' (${JSON.stringify(early)})`);
  ok(early.ch === 1 && early.cu === 1 && early.dp && early.q.join() === 'prologue', `on the story date that save starts at chapter 1 through the catch-up: the Dog Park it has seen is in the album, only the prologue plays (${JSON.stringify(early)})`);
  // an old save with nothing earned yet: chapter 1 and the prologue, no letter
  const plain = await ev(() => { const P = window.__paw, S = P.S; delete S.story; P.sm.fields(S, false); S.walks = 0; S.dogs.forEach((d) => { d.bond.level = 1; d.bond.pts = 0; }); S.found = {}; P.sm.start(); return { ch: S.story.ch, q: S.story.q.slice(), letter: S.mail.some((m) => m.id === 'sm_catchup') }; });
  ok(plain.ch === 1 && plain.q.join() === 'prologue' && !plain.letter, `an old save that has not walked yet starts at chapter 1 with the prologue, no catch-up letter (${JSON.stringify(plain)})`);
  // an advanced old save through Continue
  const base = await ev((k) => { const P = window.__paw, S = P.S; S.coins = 777; S.walks = 14; S.found = { 'Old Coin': { route: 'park', day: 2 } }; S.dogs.forEach((d) => { d.bond.level = 4; d.bond.pts = 400; }); P.saveNow(); const s = JSON.parse(localStorage.getItem(k)); delete s.story; return s; }, SAVE);
  ok(!('story' in base), 'the base save has no story field');
  { const was = t.ctx; await t.mk({ storage: { [SAVE]: JSON.stringify(base) }, prefs: ON }); await was.close(); }
  await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); await hook();
  const xp0 = base.lv ? base.lv.xp : 0;
  ok(await waitPlay('catchup', 15000), 'one catch-up scene plays by itself');
  const m1 = await ev(() => { const S = JSON.parse(JSON.stringify(window.__paw.S)); const L = S.mail.find((m) => m.id === 'sm_catchup'); return { keys: Object.keys(S), v: S.v, coins: S.coins, st: S.story, letter: L ? { gift: L.gift, keep: L.keep, text: L.text } : null, xp: S.lv ? S.lv.xp : 0 }; });
  const lost = Object.keys(base).filter((k) => !m1.keys.includes(k));
  ok(m1.v === 1 && !lost.length && m1.coins === 777, 'v stays 1, no field dropped, the coins as they were (the letter pays on Collect)' + (lost.length ? ': ' + lost.join(' ') : ''));
  ok(m1.st.ch === 3 && m1.st.c[1] === 'old' && m1.st.c[2] === 'old' && m1.st.cu === 1 && ['c1_feed', 'c1_pet', 'c1_play', 'c1_nap', 'c2_walk', 'c2_park', 'c2_treasure', 'c2_photo'].every((k) => m1.st.t[k] === 'old'), `chapters 1 and 2 are earned, the story goes on at chapter 3 (${m1.st.ch})`);
  ok(!!m1.letter && m1.letter.keep && m1.letter.gift && m1.letter.gift.coins === 150 && /2 chapters/.test(m1.letter.text), `Gerald's letter: the coins capped at 150 (80 + 120 earned), kept to reread (${JSON.stringify(m1.letter && m1.letter.gift)})`);
  ok(m1.xp - xp0 >= 170 && m1.xp - xp0 <= 200, `the XP for the earned pages: +${m1.xp - xp0} (70 + 100, plus a first-visit milestone the old save collects on load)`);
  ok(['prologue', 'ch1', 'ch2', 'visit_park', 'visit_market', 'catchup'].every((k) => m1.st.m[k]) && !m1.st.w.ch1 && m1.st.q.join() === 'catchup', 'the earned scenes go into the album without playing (no flood): only the catch-up scene plays');
  await skipNow();
  const again = await ev(() => { const P = window.__paw; const before = P.S.mail.filter((m) => m.id === 'sm_catchup').length; P.sm.start(); return { n: P.S.mail.filter((m) => m.id === 'sm_catchup').length, before, q: P.S.story.q.length, w: P.S.story.w.catchup }; });
  ok(again.n === 1 && again.q === 0 && again.w === 1, 'the catch-up happens once: no second letter, nothing queued again');
  await t.sleep(3000); ok(!(await playing()), 'no other scene plays after it');

  sec('2. tasks advance from real actions; rewards once');
  await t.newGame({ prefs: ON }, { bond: { level: 4, pts: 500 } }); await hook();
  await waitPlay('prologue', 12000); await skipNow();
  await ev(() => window.__paw.sc.test(false)); // the scenes wait while we play the chapter
  const r0 = await ev(() => { const S = window.__paw.S; return { c: S.coins, b: S.bond.pts, xp: S.lv ? S.lv.xp : -1 }; });
  ok(r0.xp >= 0, 'town levels are on for this run (XP is counted)');
  const food = await ev(() => { const P = window.__paw, S = P.S; const n = Object.keys(S.inv.food).find((k) => S.inv.food[k] > 0 && /Kibble|Chicken|Salmon|Bowl/.test(k)) || Object.keys(S.inv.food).find((k) => S.inv.food[k] > 0 && k !== 'Fresh Water'); S.stats.hunger = 30; P.feed(n); return n; });
  ok(await t.until(() => !!window.__paw.S.story.t.c1_feed, null, 6000), `feeding ${food} (a real feed) finishes "Fill the food bowl"`);
  ok(await t.waitToast(/Story: Fill the food bowl/), 'a gold story toast names the task and its reward');
  await t.until(() => !window.__paw.mode || window.__paw.mode === 'yard', null, 3000); await t.sleep(1500);
  ok(await t.pet(() => (window.__paw.S.story.p.c1_pet || 0) >= 1), 'a real pet counts toward "three good pets"');
  await ev(() => { const A = window.__paw.sm.act; A('pet', {}); A('pet', {}); A('pet', {}); A('toy', { name: 'Squeaky Duck' }); });
  s = await st();
  ok(s.p.c1_pet === 3 && !!s.t.c1_pet && !!s.t.c1_play && !s.t.c1_nap && s.ch === 1, `pets stop at 3/3, the toy task is done, the nap is still open (${JSON.stringify(s.p)})`);
  const rn = await ev(() => { const S = window.__paw.S; return { c: S.coins, b: S.bond.pts, xp: S.lv.xp }; }); // the nap goes through the act bus: only the story pays here
  await ev(() => window.__paw.sm.act('nap', { dogs: 1 }));
  s = await st();
  const r1 = await ev(() => { const S = window.__paw.S; return { c: S.coins, b: S.bond.pts, xp: S.lv.xp }; });
  ok(s.ch === 2 && !!s.c[1] && s.q.includes('ch1'), 'the last task finishes chapter 1: chapter 2 opens and the chapter scene waits in the queue');
  ok(r1.c - rn.c === 50 && r1.xp - rn.xp >= 40 && r1.xp - rn.xp <= 52 && r1.b - rn.b === 13, `the last task and the chapter pay once: +${r1.c - rn.c} coins (10 + 40), +${r1.xp - rn.xp} XP (10 + 30, plus 2 care XP for the nap itself and at most one 10 XP notebook milestone), +${r1.b - rn.b} Bond (3 + 10)`);
  ok(r1.c - r0.c >= 80 && r1.xp - r0.xp >= 70 && r1.b - r0.b >= 22, `over the whole chapter: +${r1.c - r0.c} coins (80 from the story, plus the real feed and pet), +${r1.xp - r0.xp} XP, +${r1.b - r0.b} Bond`);
  ok(await t.waitToast(/Chapter 1 done: A New Friend in Town/), 'a gold toast for the chapter');
  await ev(() => { const A = window.__paw.sm.act; A('feed', {}); A('pet', {}); A('nap', {}); A('toy', {}); });
  const r2 = await ev(() => window.__paw.S.coins);
  ok(r2 === r1.c, 'chapter 1 acts again pay nothing more');
  await ev(() => window.__paw.sm.act('walk', { area: 'town', early: true }));
  ok(!(await st()).p.c2_walk, 'a walk that headed home at the start does not count');
  await t.travel('park');
  s = await st();
  ok(!!s.t.c2_park && s.q.includes('visit_park'), 'a real trip to Sunny Park finishes "Visit Sunny Park" and queues its first-visit scene');
  const c3 = await ev(() => window.__paw.S.coins);
  await t.home('yard'); await t.travel('park'); await t.home('yard');
  ok((await ev(() => window.__paw.S.coins)) === c3 && (await st()).q.filter((x) => x === 'visit_park').length === 1, 'a second trip pays nothing and queues nothing');
  await ev(() => { const A = window.__paw.sm.act; A('walk', { area: 'town' }); A('walk', { area: 'town' }); A('treasure', { name: 'x', first: true }); });
  s = await st(); ok(!!s.t.c2_walk && !!s.t.c2_treasure && s.ch === 2, 'two walks and a treasure');
  await ev(() => window.__paw.sm.act('photo', { dogs: 1 }));
  s = await st(); ok(s.ch === 3 && !!s.c[2] && s.q.join() === 'ch1,visit_park,ch2', `chapter 2 done; three scenes wait their turn in order (${s.q.join()})`);
  const page = await ev(() => { window.__paw.sm.open('story'); const p = document.querySelector('#modal .sm-pop'); return { tasks: p.querySelectorAll('.sm-task').length, rows: p.querySelectorAll('.sm-book li').length, done: p.querySelectorAll('.sm-book li.done').length, now: p.querySelector('.sm-book li.now .sm-ct').textContent }; });
  ok(page.tasks === 4 && page.rows === 8 && page.done === 2 && /Missing Shopping List/.test(page.now), `the Story page: 8 chapters, 2 done, chapter 3 open with its 4 tasks (${JSON.stringify(page)})`);
  await t.closeX();

  sec('3. scenes play once by themselves, Skip at 3 s, the clock stops, then they live in Memories');
  await ev(() => { window.__paw.sc.gap(0); window.__paw.sc.test(true); });
  ok(await waitPlay('ch1', 8000), 'the chapter 1 scene plays by itself on a calm yard');
  const t0 = Date.now(), g0 = await ev(() => window.__paw.S.gameMin);
  ok(await ev(() => document.querySelector('#scLayer .sc-skip').hidden), 'no Skip button at the start');
  await t.until(() => !document.querySelector('#scLayer .sc-skip').hidden, null, 6000); const at = Date.now() - t0;
  ok(at >= 2500 && at <= 4600, `Skip shows after about 3 s (${at} ms after we saw it start)`);
  const g1 = await ev(() => window.__paw.S.gameMin);
  ok(Math.abs(g1 - g0) < 0.05, `the game clock stops during the scene (${(g1 - g0).toFixed(3)} game minutes)`);
  const dur = await ev(() => window.__paw.sc.ids().map((id) => [id, window.__paw.sc.dur(id)]));
  ok(dur.every(([, d]) => d >= 10 && d <= 15), 'every scene is 10-15 s: ' + dur.map((x) => x.join(' ')).join(', '));
  await waitStop(15000); // ch1 plays to the end
  s = await st(); ok(s.w.ch1 === 1 && !s.q.includes('ch1') && !!s.m.ch1, 'played to the end: watched, out of the queue, in the album');
  ok(await ev(() => window.__paw.sc.queue('ch1') === false), 'a watched scene never queues again');
  ok(await waitPlay('visit_park', 14000), 'the next one in the queue plays after it (8 s later)');
  await skipNow();
  ok(await waitPlay('ch2', 14000), 'then the chapter 2 scene'); await skipNow();
  s = await st(); ok(!s.q.length && ['ch1', 'visit_park', 'ch2'].every((k) => s.w[k] === 1), 'skipped scenes count as seen too');
  await t.sleep(2500); ok(!(await playing()), 'nothing plays twice');
  const mem = await ev(() => { window.__paw.sm.open('mem'); return [...document.querySelectorAll('#modal .sm-mcard')].map((e) => e.querySelector('[data-smplay]').dataset.smplay); });
  ok(['prologue', 'ch1', 'ch2', 'visit_park'].every((k) => mem.includes(k)) && !mem.includes('visit_market'), 'Memories lists the watched scenes, not the unseen ones: ' + mem.join(', '));
  await t.p.click('[data-smplay="ch2"]');
  ok(await waitPlay('ch2', 4000), 'Watch replays the scene');
  await skipNow();
  ok(await t.until(() => !!document.querySelector('#modal .sm-pop.sm-t-mem'), null, 3000), 'and the album comes back after it');
  await t.closeX();

  sec('4. no stacking: a scene waits for sheets and What\'s new, and two never overlap');
  await ev(() => { const P = window.__paw; P.sc.gap(0); P.sm.open('story'); P.sc.queue('visit_market'); });
  await t.sleep(3500); ok(!(await playing()), 'with the Story sheet open, the queued scene waits');
  await ev(() => { const P = window.__paw; P.nw.test(true); P.S.newsSeen = ''; });
  await t.closeX();
  ok(await t.until(() => !!document.querySelector('#modal .nw-pop'), null, 9000), "the What's new sheet goes first");
  ok(!(await playing()), 'the scene still waits under it');
  await t.p.click('#nwOk'); await t.modalGone();
  ok(await waitPlay('visit_market', 8000), 'then the scene plays');
  const stackOk = await ev(() => { const P = window.__paw; return P.sc.play('ch1') === false && P.sc.on() === 'visit_market'; });
  ok(stackOk, 'a second scene cannot start on top of one that plays');
  ok(await ev(() => !document.getElementById('modal').hidden === false), 'no sheet opened over the scene');
  await skipNow();
  // review fixes (code 2 and 3): an automatic sheet (What's new) waits under a playing scene and opens after it; keys 1-7 and Space do nothing
  await ev(() => { const P = window.__paw; P.S.newsSeen = 'x'; P.sc.play('ch1', { replay: true }); P.S.newsSeen = ''; });
  await t.p.keyboard.press('4'); await t.p.keyboard.press(' ');
  await t.sleep(4000);
  const under = await ev(() => ({ on: window.__paw.sc.on(), modal: !document.getElementById('modal').hidden, mode: window.__paw.mode }));
  ok(under.on === 'ch1' && !under.modal && under.mode === 'yard', `no What's new sheet and no key acts under a playing scene (${JSON.stringify(under)})`);
  await skipNow();
  ok(await t.until(() => !!document.querySelector('#modal .nw-pop'), null, 9000), "the What's new sheet opens once the scene ends");
  await t.p.click('#nwOk'); await t.modalGone(); await ev(() => window.__paw.nw.test(false));

  sec('5. Motion off: nothing moves, the shots cross-fade');
  await t.freezeMotion(true);
  await ev(() => window.__paw.sc.play('visit_park'));
  await t.sleep(700); const a1 = await ev(() => [document.querySelector('#scLayer .sc-a[data-a="0"]').getAttribute('transform'), document.querySelector('#scLayer .sc-cam').getAttribute('transform'), document.getElementById('scLayer').classList.contains('sc-still')]);
  await t.sleep(1500); const a2 = await ev(() => [document.querySelector('#scLayer .sc-a[data-a="0"]').getAttribute('transform'), document.querySelector('#scLayer .sc-cam').getAttribute('transform')]);
  ok(a1[2] && a1[0] === a2[0] && a1[1] === a2[1], `the dog and the camera stay still (${a1[0]} / ${a1[1]})`);
  await skipNow(); await t.freezeMotion(false);
  await ev(() => window.__paw.sc.play('visit_park'));
  await t.sleep(700); const b1 = await ev(() => document.querySelector('#scLayer .sc-a[data-a="0"]').getAttribute('transform'));
  await t.sleep(1200); const b2 = await ev(() => document.querySelector('#scLayer .sc-a[data-a="0"]').getAttribute('transform'));
  ok(b1 !== b2, 'with Motion on the dog walks in');
  await t.sleep(1500); await skipNow();

  sec('6. fit: phone 360x640 and desktop 1280x720');
  for (const [dev, name] of [['Phone 360x640', 'phone'], [null, 'desktop']]) {
    await t.newGame(Object.assign({ prefs: ON }, dev ? { device: dev } : {}), { bond: { level: 4, pts: 500 } }); await hook();
    await waitPlay('prologue', 12000); await skipNow();
    await ev(() => window.__paw.sc.play('ch2'));
    await t.sleep(3600);
    const L = await ev(() => {
      const vw = document.documentElement.clientWidth, vh = window.innerHeight, r = (q) => { const b = document.querySelector(q).getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round); };
      const cap = document.querySelector('#scLayer .sc-cap');
      return { vw, vh, stage: r('#stage'), layer: r('#scLayer'), film: r('#scLayer .sc-film'), cap: r('#scLayer .sc-cap'), skip: r('#scLayer .sc-skip'), skipH: document.querySelector('#scLayer .sc-skip').getBoundingClientRect().height, over: cap.scrollWidth > cap.clientWidth + 1 || cap.scrollHeight > cap.clientHeight + 1, hud: !!document.querySelector('#hud:not([hidden])') };
    });
    ok(L.layer.every((v, i) => Math.abs(v - L.stage[i]) <= 1) && L.layer[3] <= L.vh + 1 && (name !== 'phone' || (L.layer[0] <= 0 && L.layer[2] >= L.vw - 1)), `${name}: the scene covers the stage ${JSON.stringify(L.layer)} in ${L.vw}x${L.vh}`);
    ok(L.film[3] - L.film[1] >= (name === 'phone' ? 300 : 400), `${name}: the picture has room (${L.film[3] - L.film[1]} px tall)`);
    ok(L.cap[0] >= 0 && L.cap[2] <= L.vw && L.cap[3] <= L.vh && !L.over, `${name}: the caption is inside the screen, nothing runs out of it ${JSON.stringify(L.cap)}`);
    ok(L.skipH >= 44 && L.skip[2] <= L.vw && L.skip[3] <= L.vh, `${name}: Skip is a 44 px tap on screen ${JSON.stringify(L.skip)}`);
    await t.p.screenshot({ path: path.join(SHOTS, `v229_scene_${name}.png`) });
    await t.sleep(2600); await t.p.screenshot({ path: path.join(SHOTS, `v229_scene_${name}_2.png`) });
    await skipNow();
    // part 2: three new scenes (a chapter with two dogs, the last chapter's card, a big moment), each shot's caption inside the screen
    for (const [id, at] of [['ch4', 2600], ['ch8', 6800], ['big_lv5', 2600], ['visit_pool', 6500]]) {
      ok(await ev((id) => window.__paw.sc.play(id), id), `${name}: ${id} plays`);
      await t.sleep(at);
      const C = await ev(() => { const c = document.querySelector('#scLayer .sc-cap'), b = c.getBoundingClientRect(), T = document.querySelector('#scLayer .sc-title'), tb = T.getBoundingClientRect();
        return { vw: document.documentElement.clientWidth, vh: window.innerHeight, cap: [b.left, b.top, b.right, b.bottom].map(Math.round), over: c.scrollWidth > c.clientWidth + 1 || c.scrollHeight > c.clientHeight + 1, txt: c.textContent, title: T.hidden ? null : [tb.left, tb.right].map(Math.round), actors: document.querySelectorAll('#scLayer .sc-a').length }; });
      ok(C.cap[0] >= 0 && C.cap[2] <= C.vw && C.cap[3] <= C.vh && !C.over && C.txt.length > 10 && C.actors >= 1 && (!C.title || (C.title[0] >= 0 && C.title[1] <= C.vw)), `${name}: ${id} fits (caption ${JSON.stringify(C.cap)}, ${C.actors} actors, "${C.txt.slice(0, 40)}...")`);
      await t.p.screenshot({ path: path.join(SHOTS, `v229_${id}_${name}.png`) });
      await skipNow();
    }
    // the crops fix: every actor of every shot of all 25 scenes is drawn inside the picture at the end of its shot (Motion on), and with
    // Motion off (the end picture all the shot long); walk-ins mid-way, a train passing through and doodles fading out are not counted
    for (const still of [false, true]) {
      if (still) await t.freezeMotion(true);
      const bad = [];
      for (const id of await ev(() => window.__paw.sc.ids())) {
        const ds = await ev((id) => window.__paw.sc.sd(id), id); await ev((id) => window.__paw.sc.play(id), id); let acc = 0;
        for (let i = 0; i < ds.length; i++) {
          // the scene clock keeps running after the seek: under load the two frames can carry it past the last 4% into the next shot.
          // That is the clock, not the fit, so the same moment is measured again (up to 3 times) before it counts as a failure
          const at = (acc + ds[i] * (still ? 0.5 : 0.96)) * 1000; acc += ds[i];
          let o = null;
          for (let tries = 0; tries < 3 && (!o || o.shot !== i); tries++) {
          if (!(await ev((ms) => window.__paw.sc.seek(ms), at))) { await ev((id) => window.__paw.sc.play(id), id); await ev((ms) => window.__paw.sc.seek(ms), at); } // the last shot ran out: play it again
          await t.p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          o = await ev(() => {
            const c = window.__paw.sc.cur(), f = document.querySelector('#scLayer .sc-film').getBoundingClientRect(), out = [];
            document.querySelectorAll('#scLayer .sc-a').forEach((g) => {
              const k = +g.dataset.a; if (!c || c.off[k]) return; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
              g.querySelectorAll('path,ellipse,circle,rect,polygon,polyline,line').forEach((e) => { if (e.closest('defs,clipPath,mask,pattern,symbol')) return; const r = e.getBoundingClientRect(); if (!r.width && !r.height) return; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); });
              if (x1 > x0 && (x0 < f.left - 1 || x1 > f.right + 1 || y0 < f.top - 1 || y1 > f.bottom + 1)) out.push(`${k}:${[x0, y0, x1, y1].map(Math.round)}`);
            });
            return { shot: c && c.shot, out, film: [f.left, f.top, f.right, f.bottom].map(Math.round) };
          });
          }
          if (o.shot !== i) bad.push(`${id}#${i} measured shot ${o.shot}`); else if (o.out.length) bad.push(`${id}#${i} ${o.out.join(' ')} film ${o.film}`);
        }
        await ev(() => window.__paw.sc.skip());
      }
      if (still) await t.freezeMotion(false);
      ok(!bad.length, `${name}: all 25 scenes, every actor inside the picture at the end of each shot${still ? ' (Motion off)' : ''}${bad.length ? ': ' + bad.slice(0, 6).join(' | ') : ''}`);
    }
    await ev(() => { const A = window.__paw.sm.act; A('feed', {}); A('toy', {}); });
    await ev(() => window.__paw.sm.open('story')); await t.sleep(500);
    const P = await ev(() => {
      const vw = document.documentElement.clientWidth, vh = window.innerHeight, p = document.querySelector('#modal .panel').getBoundingClientRect();
      const over = [...document.querySelectorAll('#modal .sm-tt b, #modal .sm-ch h3, #modal .sm-ct, #modal .sm-ht b')].filter((e) => e.scrollWidth > e.clientWidth + 1).length;
      const tabs = [...document.querySelectorAll('#modal .sm-tabs .btn')].map((b) => Math.round(b.getBoundingClientRect().height));
      return { vw, vh, p: [p.left, p.top, p.right, p.bottom].map(Math.round), over, tabs, rows: document.querySelectorAll('#modal .sm-task').length, done: document.querySelectorAll('#modal .sm-task.done').length };
    });
    ok(P.p[0] >= 0 && P.p[2] <= P.vw && P.p[1] >= 0 && P.p[3] <= P.vh + 1, `${name}: the Story sheet is inside the screen ${JSON.stringify(P.p)}`);
    ok(P.over === 0 && P.tabs.every((h) => h >= 44) && P.rows === 4 && P.done === 2, `${name}: 4 tasks (2 done), no text runs out, 44 px tabs (${P.tabs})`);
    await t.p.screenshot({ path: path.join(SHOTS, `v229_story_${name}.png`) });
    await t.closeX();
    if (name === 'phone') {
      await t.p.click('#moreBtn'); ok(await t.until(() => !!document.getElementById('mmSm'), null, 3000), 'phone: Story is in the "..." menu');
      await t.p.click('#mmSm'); ok(await t.until(() => !!document.querySelector('#modal .sm-pop'), null, 3000), 'phone: it opens the Story page'); await t.closeX();
    } else {
      ok(await ev(() => { const b = document.getElementById('smBtn'); return !!b && !b.hidden && b.getBoundingClientRect().width >= 44; }), 'desktop: the Story button is in the top bar');
    }
    if (dev) await t.ctx.close();
  }
  // ---------------- part 2 ----------------
  const coins = () => ev(() => window.__paw.S.coins);
  const A = (list) => ev((list) => { const f = window.__paw.sm.act; list.forEach(([k, d]) => f(k, d || {})); }, list);
  const noMissions = () => ev(() => { const S = window.__paw.S; if (S.missions && Array.isArray(S.missions.list)) S.missions.list.forEach((it) => { it.done = it.done || 'test'; }); }); // the day's mission would pay its own 40 coins
  const lvTo = (n) => ev((n) => { const L = window.__paw.lv; const need = L.AT[n] - L.xp(); if (need > 0) L.gain('dev', need); return L.level(); }, n);

  sec('7. chapters 3-6: tasks from the act bus, rewards once, the scenes queue in order; the whole story is 1,370 coins');
  await t.newGame({ prefs: ON }, { bond: { level: 4, pts: 500 } }); await hook();
  await waitPlay('prologue', 12000); await skipNow();
  await ev(() => window.__paw.sc.test(false)); await noMissions();
  const CH = await ev(() => window.__paw.sm.chapters());
  const tot = (f) => CH.reduce((n, c) => n + f(c.rw) + c.tasks.reduce((m, k) => m + f(k.rw), 0), 0);
  ok(CH.length === 8 && CH.every((c) => c.tasks.length === 4), 'eight chapters of four tasks each');
  ok(tot((r) => r.c) === 1370 && tot((r) => r.xp) === 1170 && tot((r) => r.bond) === 342, `the whole story pays ${tot((r) => r.c)} coins, ${tot((r) => r.xp)} XP and ${tot((r) => r.bond)} Bond, once`);
  ok(CH[6].lv === 6 && CH.filter((c) => c.lv).length === 1, 'only chapter 7 waits for a town level (6)');
  await ev(() => window.__paw.sm.goto(3));
  let k0 = await coins();
  await A([['buy', { name: 'Omiyage', cat: 'souvenir', qty: 1, shop: 'tokyo' }]]);
  ok(!(await st()).t.c3_buy, 'a Tokyo souvenir is not a Market Street shop');
  await A([['buy', { name: 'Kibble', cat: 'food', qty: 1, shop: 'market' }], ['travel', { place: 'square' }], ['travel', { place: 'cafe' }]]);
  s = await st(); ok(s.ch === 3 && !!s.t.c3_buy && !!s.t.c3_square && !!s.t.c3_cafe && !s.t.c3_mission, 'chapter 3: a shop, the Square and the café; the mission still open');
  // the act and the coin count in one evaluate: chapter 3's XP already reaches town level 2, so the story's 1 s tick may pay chapter 4's
  // "Reach town level 2" (+20) at any moment after it. Counted here, before the tick can run, that 20 always lands in chapter 4's +170
  const ch3c = await ev(() => { const P = window.__paw; P.sm.act('msdone', {}); return P.S.coins; });
  s = await st(); ok(s.ch === 4 && !!s.c[3] && s.q.includes('ch3') && ch3c - k0 === 160, `chapter 3 done: +${ch3c - k0} coins (4 x 20 + 80), its scene waits`);
  k0 = ch3c; await lvTo(2); await ev(() => window.__paw.sm.states());
  await A([['travel', { place: 'dogpark' }], ['fetch', { name: 'Tennis Ball' }], ['fetch', { name: 'Tennis Ball' }]]);
  s = await st(); ok(!!s.t.c4_level && !!s.t.c4_dogpark && s.p.c4_ball === 2 && !s.t.c4_ball && s.q.includes('visit_dogpark'), 'chapter 4: level 2 (a state), the Dog Park (and its first-visit scene), two balls of three');
  await A([['fetch', { name: 'Tennis Ball' }], ['pet', { dogs: 2 }]]);
  s = await st(); ok(s.ch === 5 && (await coins()) - k0 === 170, `chapter 4 done: +${(await coins()) - k0} coins`);
  k0 = await coins();
  await A([['buy', { name: 'Carrot Seeds', cat: 'seeds', qty: 1, shop: 'sprout' }], ['garden', { what: 'plant' }], ['garden', { what: 'water' }], ['garden', { what: 'water' }], ['garden', { what: 'water' }], ['garden', { what: 'harvest', crop: 'carrot' }]]);
  s = await st(); ok(s.ch === 6 && (await coins()) - k0 === 170, `chapter 5 (seeds, plant, water x3, harvest) done: +${(await coins()) - k0} coins`);
  k0 = await coins();
  await A([['travel', { place: 'pool' }], ['paddle', { name: 'x' }], ['trick', { name: 'sit', learned: false }]]);
  ok(!(await st()).t.c6_trick, 'a trick practised but not newly learned does not count');
  await A([['trick', { name: 'sit', learned: true }], ['agility', { rosettes: 3 }]]);
  s = await st(); ok(s.ch === 7 && (await coins()) - k0 === 180 && s.q.includes('visit_pool'), `chapter 6 done: +${(await coins()) - k0} coins, the Splash Pool scene queued`);
  const order = s.q.filter((x) => /^ch|^visit/.test(x)).join();
  ok(order === 'ch3,visit_dogpark,ch4,ch5,visit_pool,ch6', 'the scenes wait in the order they happened: ' + order);
  k0 = await coins();
  await A([['buy', { shop: 'market', cat: 'food' }], ['travel', { place: 'square' }], ['msdone'], ['fetch', {}], ['paw', { id: 'x' }], ['garden', { what: 'harvest' }], ['paddle', {}], ['agility', {}], ['travel', { place: 'pool' }], ['travel', { place: 'dogpark' }]]);
  s = await st(); ok((await coins()) === k0 && s.q.filter((x) => x === 'visit_pool').length === 1, 'chapters 3-6 acts again pay nothing and queue nothing');

  sec('8. chapter 7 waits for town level 6, then chapter 8, the end and the frame "Gerald\'s Big Book"');
  await t.newGame({ prefs: ON }, { bond: { level: 4, pts: 500 } }); await hook();
  await waitPlay('prologue', 12000); await skipNow();
  await ev(() => window.__paw.sc.test(false)); await noMissions();
  ok((await ev(() => window.__paw.lv.level())) < 2, 'a new game is on town level 1');
  await ev(() => window.__paw.S.dogs.forEach((d) => { d.bond.level = 7; d.bond.pts = 1500; })); // Bond 7 (for "Bond 5 with any dog")
  await ev(() => window.__paw.sm.goto(4));
  const g4 = await ev(() => { const P = window.__paw; P.sm.states(); P.sm.open('story'); const r = document.querySelector('#modal .sm-task.gated'); return { gated: document.querySelectorAll('#modal .sm-task.gated').length, chip: r ? r.querySelector('.sm-lvchip').textContent : '', line: P.sm.msline(), lvt: !!P.S.story.t.c4_level }; });
  ok(g4.gated === 1 && /Opens at level 2/.test(g4.chip) && !g4.lvt, `chapter 4 at level 1: the Dog Park shows "${g4.chip}", "Reach town level 2" stays open`);
  ok(/Chapter 4: 0 of 4 tasks\. Next: Reach town level 2/.test(g4.line), 'the Missions-tab line names the chapter and the next task');
  await t.closeX();
  const ml = await ev(() => { window.__paw.ms.open(); const b = document.querySelector('#modal .sm-msline'); return b ? b.textContent : ''; });
  ok(/Chapter 4/.test(ml), 'the Story line is pinned on the Missions sheet');
  await t.p.click('#modal .sm-msline');
  ok(await t.until(() => !!document.querySelector('#modal .sm-pop'), null, 3000), 'tapping it opens the Story page'); await t.closeX();
  await ev(() => window.__paw.sm.goto(7));
  await A([['gaze', { first: true }], ['ride', { dir: 'out' }]]); await ev(() => window.__paw.sm.states());
  const w7 = await ev(() => { const P = window.__paw; P.sm.open('story'); const g = document.querySelector('#modal .sm-ch.sm-gate'); return { waits: P.sm.waits(), t: Object.keys(P.S.story.t).filter((k) => /^c7/.test(k)), p: Object.keys(P.S.story.p).filter((k) => /^c7/.test(k)), gate: g ? g.querySelector('.sm-lvchip').textContent : '', line: P.sm.msline(), left: document.getElementById('smBtn').dataset.left }; });
  ok(w7.waits && !w7.t.length && !w7.p.length && /Opens at level 6/.test(w7.gate), `chapter 7 waits at level 1: no task moves (even Bond 5 and a Fuji gaze), the page says "${w7.gate}"`);
  ok(/opens at level 6/.test(w7.line) && w7.left === '0', 'the Missions line says it opens at level 6, the book button has no dot');
  await t.closeX();
  ok((await ev(() => window.__paw.S.story.q.filter((x) => !/^big_/.test(x)).length)) === 0, 'no chapter scene, no pay while it waits (a big moment still queues: nothing else is blocked)');
  await lvTo(6); await ev(() => window.__paw.sm.states());
  s = await st(); ok(!s.p.c7_ride && !!s.t.c7_bond5 && s.ch === 7, 'at level 6 the chapter goes on: Bond 5 (a state) is done at once; earlier acts did not count');
  k0 = await coins();
  await A([['gaze', { first: false }], ['ride', { dir: 'out' }], ['stamp', { key: 'shibuya' }]]);
  ok(!(await st()).t.c7_hachi, 'the Shibuya stamp is not Hachikō');
  await A([['stamp', { key: 'hachiko' }]]);
  s = await st(); ok(s.ch === 8 && !!s.c[7] && (await coins()) - k0 === 25 * 3 + 120 && s.q.includes('ch7'), `chapter 7 done: +${(await coins()) - k0} coins (3 tasks here + 120)`);
  k0 = await coins();
  await ev(() => window.__paw.sm.states()); ok(!(await st()).t.c8_level, 'chapter 8: town level 10 still to reach');
  await A(Array.from({ length: 10 }, () => ['walk', { area: 'town' }]).concat([['photo', { dogs: 1 }], ['photo', { dogs: 1 }], ['photo', { dogs: 1 }], ['gift', { fid: 'x' }]]));
  s = await st(); ok(s.ch === 8 && s.p.c8_walks === 10 && !!s.t.c8_photos && !!s.t.c8_gift && !s.c[8], 'ten walks, three photos and a gift');
  ok(!(await ev(() => window.__paw.sm.frames())).includes('smbook'), 'no frame before the end');
  await lvTo(10); await ev(() => window.__paw.sm.states());
  s = await st(); ok(s.ch === 9 && !!s.c[8] && s.q.includes('ch8') && (await coins()) - k0 === 4 * 30 + 150, `chapter 8 done: +${(await coins()) - k0} coins, the end scene waits`);
  ok(await t.waitToast(/Gerald's Big Book/, 6000), 'a toast names the new frame');
  ok((await ev(() => window.__paw.sm.frames())).join() === 'smbook', 'the photo frame "Gerald\'s Big Book" is unlocked');
  const fin = await ev(() => { const P = window.__paw; P.sm.open('story'); return { fin: !!document.querySelector('#modal .sm-fin'), done: document.querySelectorAll('#modal .sm-book li.done').length, line: P.sm.msline() }; });
  ok(fin.fin && fin.done === 8 && /finished/.test(fin.line), 'the Story page: all 8 chapters done, the end; the Missions line says the book is finished');
  await t.closeX();
  k0 = await coins(); await A([['walk', { area: 'town' }], ['photo', {}], ['gift', {}], ['ride', {}], ['stamp', { key: 'hachiko' }]]); await ev(() => window.__paw.sm.states());
  ok((await coins()) === k0, 'after the end nothing pays again');
  // the frame in photo mode
  await t.home('yard');
  ok(await ev(() => window.__paw.ph.open() !== false && window.__paw.ph.active()), 'photo mode opens');
  ok(await t.until(() => !!document.querySelector('[data-frame="smbook"]'), null, 8000), 'photo mode lists the frame');
  await t.p.click('[data-frame="smbook"]');
  ok(await t.until(() => /sm-frame/.test(window.__paw.ph.svg() || ''), null, 8000), 'the postcard draws with the Big Book frame');
  await ev(() => window.__paw.ph.close()); await t.modalGone();

  sec('9. big moments play by themselves once, after their own card, then live in Memories');
  await t.newGame({ prefs: ON }, { bond: { level: 1, pts: 0 } }); await hook();
  await waitPlay('prologue', 12000); await skipNow();
  const b0 = await st(); ok(!b0.bm.big_bond5 && !b0.m.big_bond5, 'a Bond 1 dog: no Bond 5 moment yet');
  await ev(() => { const P = window.__paw; P.sc.gap(0); let i = 0; while (P.S.bond.level < 5 && i++ < 60) P.lv.bondUp(40); });
  const card = await t.until(() => !!document.getElementById('luOk') || !!document.getElementById('lvOk'), null, 6000);
  ok(card && !(await playing()), 'the Bond card shows first; the scene waits under it');
  ok(await waitPlay('big_bond5', 20000), 'then the Bond 5 scene plays by itself');
  ok(await ev(() => document.querySelector('#scLayer .sc-skip').hidden), 'no Skip at its start (Skip after 3 s)');
  await skipNow();
  s = await st(); ok(s.w.big_bond5 === 1 && !!s.m.big_bond5 && s.bm.big_bond5 === 1 && !s.q.includes('big_bond5'), 'watched, in the album, never again');
  await ev(() => { window.__paw.sm.big(); }); ok(!(await st()).q.includes('big_bond5'), 'checking again queues nothing');
  await ev(() => window.__paw.sc.gap(0)); await lvTo(5);
  ok(await waitPlay('big_lv5', 20000), 'town level 5: its scene plays after the level card');
  await skipNow();
  await ev(() => { window.__paw.sc.gap(0); window.__paw.S.pupsBorn = 1; });
  ok(await waitPlay('big_pups', 15000), 'the first puppies: their scene plays'); await skipNow();
  await t.sleep(2500); ok(!(await playing()), 'nothing plays twice');
  const mem2 = await ev(() => { window.__paw.sm.open('mem'); return [...document.querySelectorAll('#modal .sm-mcard [data-smplay]')].map((e) => e.dataset.smplay); });
  ok(['big_bond5', 'big_lv5', 'big_pups'].every((k) => mem2.includes(k)), 'Memories keeps the big moments: ' + mem2.join(', '));
  await t.closeX();

  sec('10. an advanced old save: all eight chapters at once = one catch-up scene, one letter, at most 150 coins');
  const adv = await ev((k) => {
    const P = window.__paw, S = P.S; S.coins = 500; S.walks = 40; S.found = { 'Old Coin': { route: 'park', day: 2 } };
    S.dogs.forEach((d) => { d.bond.level = 6; d.bond.pts = 1100; d.tricks = Object.assign(d.tricks || {}, { sit: { p: 1, shows: 2 } }); });
    S.missions.stamps = 2; S.garden = S.garden || {}; S.garden.harvests = { carrot: 3 }; S.tk = Object.assign(S.tk || {}, { rides: 2 }); S.ph = Object.assign(S.ph || {}, { n: 6 }); S.pupsBorn = 2;
    P.lv.gain('dev', P.lv.AT[12] - P.lv.xp()); ['dogpark', 'pool', 'training', 'fujihill', 'station'].forEach((x) => { S.lv.seen[x] = 1; });
    P.saveNow(); const s = JSON.parse(localStorage.getItem(k)); delete s.story; return s;
  }, SAVE);
  { const was = t.ctx; await t.mk({ storage: { [SAVE]: JSON.stringify(adv) }, prefs: ON }); await was.close(); }
  await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); await hook();
  ok(await waitPlay('catchup', 15000), 'one catch-up scene plays by itself');
  const m8 = await ev(() => { const S = window.__paw.S; return { st: JSON.parse(JSON.stringify(S.story)), letters: S.mail.filter((m) => m.id === 'sm_catchup').map((m) => m.gift), coins: S.coins, frames: window.__paw.sm.frames() }; });
  ok(m8.st.ch === 9 && [1, 2, 3, 4, 5, 6, 7, 8].every((n) => m8.st.c[n] === 'old'), `all 8 chapters earned from the save (${m8.st.ch})`);
  ok(m8.letters.length === 1 && m8.letters[0].coins === 150 && m8.coins === 500, `one letter, its coins capped at 150 (of 1,370), paid on Collect (${JSON.stringify(m8.letters)})`);
  ok(m8.st.q.join() === 'catchup', 'only the catch-up scene is queued (no flood): ' + m8.st.q.join());
  const inAlbum = ['ch1', 'ch8', 'visit_dogpark', 'visit_pool', 'visit_training', 'visit_fuji', 'visit_station', 'big_bond5', 'big_lv5', 'big_lv10', 'big_pups'];
  ok(inAlbum.every((k) => m8.st.m[k] && !m8.st.w[k]) && !m8.st.m.big_bond10 && !m8.st.m.visit_beach, 'the earned scenes, first visits and big moments are in the album, unwatched; the unreached ones are not');
  ok(m8.frames.join() === 'smbook', 'the chapter 8 frame comes with it');
  await t.sleep(4200);
  const cuT = await ev(() => { const T = document.querySelector('#scLayer .sc-title'), b = T.getBoundingClientRect(); return { txt: T.textContent, r: [b.left, b.top, b.right, b.bottom].map(Math.round), vw: document.documentElement.clientWidth }; });
  ok(/Chapters 1 to 8/.test(cuT.txt) && cuT.r[0] >= 0 && cuT.r[2] <= cuT.vw, `the catch-up card sums up 8 chapters in two lines (${JSON.stringify(cuT.txt)})`);
  await skipNow();
  await ev(() => window.__paw.sc.gap(0)); await t.sleep(5000);
  ok(!(await playing()) && (await st()).q.length === 0, 'nothing else plays after it');

  sec('11. launch gates: each release opens on its own NEWS date (nwDue); before it nothing shows');
  {
    const dates = await ev(() => window.__paw.nw.dates());
    ok(dates.length === 4 && dates.every((d, i) => /^\d{4}-\d\d-\d\d$/.test(d) && (!i || d >= dates[i - 1])), 'four ISO launch dates, in release order: ' + dates.join(' '));
    // a fake clock one day before each date, and on it (nwDue reads Date.now through jstISO; the page's __ddNextTest is not set here)
    const at = async (iso, shift) => ev(([iso, shift]) => { const real = Date.now, t0 = Date.parse(iso + 'T12:00:00+09:00') + shift * 864e5; Date.now = () => t0; try { return ['2.26', '2.27', '2.28', '2.29'].map((v) => window.__paw.nw.due(v)); } finally { Date.now = real; } }, [iso, shift]);
    ok((await at(dates[0], -1)).join() === 'false,false,false,false', 'the day before the first date, all four are off');
    for (let i = 0; i < 4; i++) {
      const on = await at(dates[i], 0), off = await at(dates[i], -1);
      ok(on[i] === true && on.every((v, j) => j <= i ? true : dates[j] > dates[i] ? !v : true), `on ${dates[i]} v2.2${6 + i} is on (${on.join()})`);
      ok(off[i] === false, `the day before ${dates[i]} v2.2${6 + i} is still off`);
    }
    ok(await ev(() => window.__paw.sm.on() === true && window.__paw.yv.on() === false), 'under the harness smTest opens Story mode and Yard visitors stay off without yvTest');
    ok(await ev(() => { const p = window.__paw; return typeof p.pr === 'object'; }), 'the projects hook exists');
  }

  sec('12. no toast or hint bubble over a scene: they wait and come in after it');
  await ev(() => { window.__paw.sc.gap(0); window.__paw.sc.test(true); document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
  await ev(() => window.__paw.sc.play('ch2', { replay: true }));
  ok(await waitPlay('ch2', 4000), 'a scene plays');
  await ev(() => { window.__paw.toast('New mail from Gerald', 'good'); window.__paw.home && window.__paw.home.say && window.__paw.home.say('Rub Mochi to pet', 300, 300); });
  await t.sleep(600);
  const during = await ev(() => ({ live: [...document.querySelectorAll('#toasts .toast:not(.tq)')].length, queued: [...document.querySelectorAll('#toasts .toast.tq')].length, bubble: !document.getElementById('bubble').hidden }));
  ok(during.live === 0 && during.queued === 1 && !during.bubble, `during the scene: no live toast, one waiting, no hint bubble (${JSON.stringify(during)})`);
  await skipNow(); await t.sleep(500);
  ok(await ev(() => [...document.querySelectorAll('#toasts .toast:not(.tq)')].some((e) => /New mail/.test(e.textContent))), 'after the scene ends the waiting toast shows');
}, { timeout: 580000 });
