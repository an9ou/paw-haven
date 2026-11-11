// v2.29 "Story mode", part 1 (V229.md, game/src/57_scenes.js + 57b_story.js):
//   1. migration: the S.story defaults, v stays 1, nothing dropped; an advanced old save gets its earned chapters once (one letter, one
//      catch-up scene, the scenes in the album, coins capped); an old save with nothing earned starts at chapter 1 with the prologue
//   2. tasks advance from real actions (feed, pet, travel) and the act bus; an early walk does not count; rewards (XP, Bond, coins) once
//   3. scenes: a chapter's scene plays once automatically, Skip shows at 3 s, the game clock stops, then it lives in Memories (Watch replays it)
//   4. no stacking: a scene waits behind a sheet and the What's new sheet, and two queued scenes never overlap
//   5. Motion off: nothing moves, the shots only cross-fade
//   6. fit: phone 360x640 and desktop 1280x720 (screenshots: V229_SHOTS=<dir>, else test_logs/)
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
  await t.newGame({ prefs: ON });
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
  await t.newGame({ prefs: ON }); await hook();
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
  ok(r1.c - rn.c === 50 && r1.xp - rn.xp >= 40 && r1.xp - rn.xp <= 42 && r1.b - rn.b === 13, `the last task and the chapter pay once: +${r1.c - rn.c} coins (10 + 40), +${r1.xp - rn.xp} XP (10 + 30, plus 2 care XP for the nap itself), +${r1.b - rn.b} Bond (3 + 10)`);
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
  const page = await ev(() => { window.__paw.sm.open('story'); const p = document.querySelector('#modal .sm-pop'); return { wait: !!p.querySelector('.sm-wait'), rows: p.querySelectorAll('.sm-book li').length, done: p.querySelectorAll('.sm-book li.done').length, now: p.querySelector('.sm-book li.now .sm-ct').textContent }; });
  ok(page.wait && page.rows === 8 && page.done === 2 && /Missing Shopping List/.test(page.now), `the Story page: 8 chapters, 2 done, chapter 3 is still being written (${JSON.stringify(page)})`);
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
  ok(await t.until(() => !!document.querySelector('#modal .sm-pop.sm-mem'), null, 3000), 'and the album comes back after it');
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
  await skipNow(); await ev(() => window.__paw.nw.test(false));

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
    await t.newGame(Object.assign({ prefs: ON }, dev ? { device: dev } : {})); await hook();
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
});
