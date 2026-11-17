// v2.25.2 "Shiny coins" (54_coinfly.js): a walk result and a finished mission each send exactly one coin from the source to the visible coin counter
// (desktop 1280x720 and phone 360x640), the counter holds the old number while it flies and ends exactly on S.coins, reduce motion (the game's
// switch and prefers-reduced-motion) means no flight, rapid gains never put more than two coins on screen, closing the sheet mid-flight leaves
// nothing behind, a hidden counter gets no flight, the chime is asked once per gain, and no console errors.
// node game/run_tests.js coin_juice
require('./test_lib').run('coin_juice', async (t) => {
  const { ok, sec, ev } = t;
  const shown = () => ev(() => document.getElementById('coinNum').textContent);
  const fmt = (n) => ev((n) => new Intl.NumberFormat('en').format(n), n);
  // records every frame for ms: how many coins are in the air, the first coin's centre, and the counter's icon centre
  const sample = (ms) => ev((ms) => new Promise((res) => {
    const out = [], t0 = performance.now();
    const f = () => {
      const cs = [...document.querySelectorAll('#cfLayer .cf-coin')], r = cs[0] && cs[0].getBoundingClientRect(), ic = document.getElementById('coinIc').getBoundingClientRect();
      out.push({ t: Math.round(performance.now() - t0), n: cs.length, x: r ? r.left + r.width / 2 : null, y: r ? r.top + r.height / 2 : null, op: cs[0] ? +getComputedStyle(cs[0]).opacity : 0, tx: ic.left + ic.width / 2, ty: ic.top + ic.height / 2, num: document.getElementById('coinNum').textContent, hit: document.getElementById('coins').classList.contains('cf-hit') });
      if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(out);
    };
    requestAnimationFrame(f);
  }), ms);
  const idle = () => t.until(() => { const s = window.__paw.cf.state(); return !s.hold && !s.pend && !s.live && !s.roll && !s.coins; }, null, 6000);
  const spyWalk = () => ev(() => { window.__opts = null; const W = window.PawWalk; if (W && !W.__cjSpy) { const o = W.start.bind(W); W.start = (h, op) => { window.__opts = op; return o(h, op); }; W.__cjSpy = true; } });
  const startWalk = async () => {
    await ev(() => { const S = window.__paw.S; S.walks = 3; S.sleeping = false; S.daily.play = true; S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.happy = 50; }); window.__paw.go('walk', 'park'); });
    await t.walkGate(true);
  };
  const endWalk = () => ev(() => { const c0 = window.__paw.S.coins; window.__opts.onEnd({ coins: 60, happiness: 10, bond: 2, energy: 5, cleanliness: 1, early: false }); return { c0, c1: window.__paw.S.coins, num: document.getElementById('coinNum').textContent }; });
  const backHome = async () => { if (await t.p.locator('#resOk').count()) await t.p.click('#resOk'); await t.untilMode('yard'); await t.lu(); await t.until(() => document.getElementById('modal').hidden, null, 4000); };
  // the path: starts near the source, ends on the counter, gets closer to it, never more than two coins at once
  const judge = (S, src, label) => {
    const fly = S.filter((s) => s.n > 0), max = Math.max(0, ...S.map((s) => s.n));
    ok(fly.length > 8, `${label}: a coin is on screen for a while (${fly.length} frames)`);
    ok(max === 1, `${label}: exactly one coin flies for one gain (max ${max})`);
    if (!fly.length) return;
    const a = fly[0], z = fly[fly.length - 1], d0 = Math.hypot(a.x - a.tx, a.y - a.ty), d1 = Math.hypot(z.x - z.tx, z.y - z.ty);
    if (src) ok(a.x >= src.left - 30 && a.x <= src.right + 30 && a.y >= src.top - 40 && a.y <= src.bottom + 30, `${label}: it pops at the source (${Math.round(a.x)},${Math.round(a.y)} in ${Math.round(src.left)}-${Math.round(src.right)} x ${Math.round(src.top)}-${Math.round(src.bottom)})`);
    ok(d1 < 26 && d1 < d0, `${label}: it lands on the counter's coin (${Math.round(d0)} px -> ${Math.round(d1)} px)`);
    const ys = fly.map((s) => s.y), xs = fly.map((s) => s.x); ok(Math.max(...xs) - Math.min(...xs) > 20 || Math.max(...ys) - Math.min(...ys) > 20, `${label}: it travels`);
    ok(S.some((s) => s.hit), `${label}: the counter squashes as it lands`);
  };

  for (const phone of [false, true]) {
    const L = phone ? 'phone 360x640' : 'desktop 1280x720';
    sec(`${L}: setup`);
    await t.newGame({ sex: 'girl', device: phone ? 'Pixel 7' : undefined, prefs: { msTest: true } }, { bond: { level: 5, pts: 900 }, coins: 1000, stats: { hunger: 80, happy: 70, energy: 90, clean: 90 } });
    if (phone) await t.p.setViewportSize({ width: 360, height: 640 });
    await t.home('yard'); await t.freezeMotion(false);
    await t.until(() => !!(window.__paw && window.__paw.cf), null, 6000);
    ok(await ev(() => !window.__paw.cf.calm()), `${L}: motion is on`);
    ok(await ev(() => !!window.__paw.cf.target()), `${L}: the coin counter is visible on the yard`);

    sec(`${L}: a walk result`);
    await spyWalk(); await ev(() => window.__paw.ms.force(['bath'])); await startWalk();
    const w = await endWalk();
    ok(w.c1 > w.c0 && w.num === await fmt(w.c0), `${L}: the balance is paid at once (${w.c0} -> ${w.c1}) and the counter still shows ${w.c0} (${w.num})`);
    const tile = await ev(() => { const e = document.querySelector('#modal .res-coins .v'); return e ? e.getBoundingClientRect().toJSON() : null; });
    ok(!!tile, `${L}: the walk result has the Paw Coins tile (.res-coins)`);
    const ws = await sample(1900);
    const tile2 = await ev(() => document.querySelector('#modal .res-coins .v').getBoundingClientRect().toJSON()); // where the tile is once the sheet is up (phones slide it in)
    judge(ws, tile2, `${L} walk`);
    await idle();
    ok(await shown() === await fmt(await ev(() => window.__paw.S.coins)), `${L} walk: the counter ends exactly on S.coins (${await shown()})`);
    const nums = ws.map((s) => +s.num.replace(/\D/g, '')); ok(nums.every((v, i) => !i || v >= nums[i - 1]) && Math.min(...nums) >= w.c0, `${L} walk: the number only goes up, never under ${w.c0} (lowest ${Math.min(...nums)})`);
    const rolled = [...new Set(ws.map((s) => s.num))]; ok(rolled.length >= 4, `${L} walk: the number rolls up through ${rolled.length} values (${rolled[0]} -> ${rolled[rolled.length - 1]})`);
    ok(await ev(() => window.PawAudio && window.PawAudio.coinLog.length >= 1 && window.PawAudio.coinLog[window.PawAudio.coinLog.length - 1] === 120), `${L} walk: one chime asked, pitched by the 120 coins (${await ev(() => window.PawAudio && window.PawAudio.coinLog.join())})`);
    await backHome();

    sec(`${L}: the very first walk always finds a treasure, and the happy dog sits by the coin (v2.30.1)`);
    await idle(); await spyWalk();
    await ev(() => { const S = window.__paw.S; S.walks = 0; S.found = {}; S.sleeping = false; S.daily.play = true; S.dogs.forEach((d) => { d.stats.energy = 90; d.stats.happy = 50; }); window.__paw.go('walk', 'park'); });
    await t.walkGate(true);
    const f = await endWalk(); // the result has no treasure: the dig missed
    ok(f.c1 - f.c0 === w.c1 - w.c0, `${L} first walk: the same pay as any walk (${f.c1 - f.c0} = ${w.c1 - w.c0})`);
    const fr = await ev(() => ({ h: (document.querySelector('#modal .tfind h3') || {}).textContent || '', found: Object.keys(window.__paw.S.found).length, j: !!document.getElementById('resJournal'), dog: !!document.querySelector('#modal .res-coins .res-dog svg') }));
    ok(fr.found === 1 && fr.j && !/stayed hidden/.test(fr.h), `${L} first walk: a treasure even though the dig missed (${fr.h}, ${fr.found} found)`);
    ok(fr.dog, `${L} first walk: the happy dog sits in the Paw Coins tile`);
    const dl = await ev(() => { const a = document.querySelector('#modal .res-coins .res-dog').getBoundingClientRect(), v = document.querySelector('#modal .res-coins .v').getBoundingClientRect(), k = document.querySelector('#modal .res-coins').getBoundingClientRect(); return a.right <= v.left + 2 && a.left >= k.left - 1; });
    ok(dl, `${L}: the dog sits beside the coin number, inside the tile`);
    await backHome(); await idle(); await spyWalk();
    await ev(() => { const S = window.__paw.S; S.sleeping = false; S.dogs.forEach((d) => { d.stats.energy = 90; }); window.__paw.go('walk', 'park'); }); await t.walkGate(true);
    await endWalk();
    ok(await ev(() => /stayed hidden/.test((document.querySelector('#modal .tfind h3') || {}).textContent || '') && Object.keys(window.__paw.S.found).length === 1), `${L}: the second walk has no gift treasure (a missed dig stays a miss)`);
    await backHome();

    sec(`${L}: a finished mission`);
    await idle(); await t.until(() => !document.querySelector('#toasts .toast:not(.tq)'), null, 9000);
    const m0 = await ev(() => { const P = window.__paw; P.ms.force(['bath']); const c0 = P.S.coins; P.ms.act('bath', {}); const te = [...document.querySelectorAll('#toasts .toast')].find((e) => /Mission done/.test(e.textContent)); return { c0, c1: P.S.coins, num: document.getElementById('coinNum').textContent, src: te && !te.classList.contains('tq') ? te.getBoundingClientRect().toJSON() : null }; });
    ok(m0.c1 - m0.c0 === 40 && m0.num === await fmt(m0.c0), `${L} mission: +40 in the balance, the counter waits on ${m0.num}`);
    ok(!!m0.src, `${L} mission: the "Mission done" toast is showing (the coin's source)`);
    const msS = await sample(1500);
    const mnums = msS.map((s) => +s.num.replace(/\D/g, '')); ok(mnums.every((v, i) => !i || v >= mnums[i - 1]) && Math.min(...mnums) >= m0.c0, `${L} mission: the number only goes up (lowest ${Math.min(...mnums)})`);
    judge(msS, m0.src, `${L} mission`);
    await idle();
    ok(await shown() === await fmt(await ev(() => window.__paw.S.coins)), `${L} mission: the counter ends on S.coins (${await shown()})`);
    ok(await t.waitToast(/^Mission done: Bath time\. \+40 coins and a crayon stamp\.$/), `${L} mission: the toast text is unchanged`);

    sec(`${L}: rapid gains`);
    await idle();
    const r0 = await ev(() => { const P = window.__paw; const c0 = P.S.coins; for (let i = 0; i < 7; i++) { P.S.coins += 15; P.cf.fly({ x: 120 + i * 20, y: 300 }, 15); } return c0; });
    const rs = await sample(2600);
    const rmax = Math.max(...rs.map((s) => s.n)); ok(rmax >= 1 && rmax <= 2, `${L}: seven quick gains never put more than two coins on screen (max ${rmax})`);
    await idle();
    ok(await shown() === await fmt(r0 + 105), `${L}: after the rapid gains the counter is exactly S.coins (${await shown()})`);

    sec(`${L}: the sheet closes mid-flight`);
    await startWalk(); await endWalk();
    await t.until(() => document.querySelectorAll('#cfLayer .cf-coin').length > 0, null, 3000);
    await t.p.click('#resOk'); await t.untilMode('yard');
    await idle();
    ok(await ev(() => !document.querySelector('#cfLayer .cf-coin, #cfLayer .cf-spark')), `${L}: nothing is left on screen after the sheet closed mid-flight`);
    ok(await shown() === await fmt(await ev(() => window.__paw.S.coins)), `${L}: the counter is still exactly S.coins (${await shown()})`);
    await t.lu(); await t.until(() => document.getElementById('modal').hidden, null, 4000);

    sec(`${L}: the counter hidden on a screen`);
    const h = await ev(() => { const P = window.__paw; document.getElementById('hud').hidden = true; P.S.coins += 30; P.cf.fly({ x: 180, y: 320 }, 30); return P.cf.target(); });
    const hs = await sample(900);
    ok(!h && Math.max(...hs.map((s) => s.n)) <= 1, `${L}: no counter in sight: at most a pop at the source, no flight`);
    ok(hs.filter((s) => s.n).every((s) => Math.hypot(s.x - 180, s.y - 320) < 40), `${L}: the hidden-counter coin stays at its source`);
    await idle(); await ev(() => { document.getElementById('hud').hidden = false; });
    ok(await shown() === await fmt(await ev(() => window.__paw.S.coins)), `${L}: the hidden counter has the right number when it comes back`);

    sec(`${L}: reduce motion (the game's switch)`);
    await t.freezeMotion(true);
    await startWalk();
    const c = await endWalk(), glow = await ev(() => document.getElementById('coins').classList.contains('cf-glow'));
    ok(c.num === await fmt(c.c1), `${L} calm walk: the counter shows the new total at once (${c.num})`);
    const cs = await sample(900);
    ok(cs.every((s) => s.n === 0) && !cs.some((s) => s.hit), `${L} calm walk: no flight and no squash`);
    ok(glow, `${L} calm walk: a soft highlight instead`);
    await idle(); await backHome(); await t.freezeMotion(false);

    sec(`${L}: reduce motion (prefers-reduced-motion)`);
    await t.p.emulateMedia({ reducedMotion: 'reduce' }); await ev(() => { delete document.documentElement.dataset.motion; });
    ok(await ev(() => window.__paw.cf.calm()), `${L}: prefers-reduced-motion counts as calm`);
    const glowP = await ev(() => { const P = window.__paw; P.S.coins += 25; P.cf.fly({ x: 150, y: 300 }, 25); return document.getElementById('coins').classList.contains('cf-glow'); }); // read at once: the glow lasts 0.9 s, a busy machine can spend that on the sampling below
    const ps = await sample(700); ok(ps.every((s) => s.n === 0), `${L}: no flight with prefers-reduced-motion`);
    ok(await shown() === await fmt(await ev(() => window.__paw.S.coins)), `${L}: the number is right at once`);
    ok(glowP, `${L}: the soft highlight shows`);
    await t.p.emulateMedia({ reducedMotion: 'no-preference' });
    await idle();
  }
}, { timeout: 420000 });
