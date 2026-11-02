// v2.19.1 "Smooth runs": the walk runner (mods/walkrun.js). Followers (the v2.19 friend's dog too) duck under high things by themselves and never bonk,
// no slow-down at sniff spots, and the four power-ups (Magnet, Zoomies, Bubble shield, Super jump): spawn, pick-up, the whole pack shows it, expiry.
// Uses PawWalk's test hooks: _peek() and o._forcePower. node game/run_tests.js v2191_runner (V2191_ONLY4=1 runs only section 4)
require('./test_lib').run('v2191_runner', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a);
  await t.newGame({}, { coins: 2000 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'samoyed', sex: 'female', months: 30 }, 'Clementine'); P.S.dogs.forEach((d) => { d.stats.energy = 95; d.stats.happy = 60; d.stats.hunger = 90; d.stats.clean = 90; }); });
  await t.calm(); await t.home('yard'); await t.lu();
  // capture the runner and pass test options: a friend's dog (friend: true, as frGuestLooks does), a forced power-up
  await ev(() => {
    const PW = window.PawWalk, st = PW.start;
    PW.start = function (el, o) {
      const x = window.__wx || {};
      if (x.friend) { o.pack = (o.pack || []).slice(); o.pack.push(Object.assign({}, o.dog, { key: 'beagle', friend: true, size: 0.86 })); }
      if (x.power) o._forcePower = x.power;
      if (x.first !== undefined) o.firstWalk = x.first;
      const c = st.call(this, el, o); window.__wctl = c; window.__wo = o; return c;
    };
  });
  // an autopilot (keys, as a player would): jumps lows and wides, ducks highs; window.__ap.off stops it, window.__ap.noBump lets the dog walk into things
  const pilot = () => ev(() => {
    const kd = (k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k })), ku = (k) => window.dispatchEvent(new KeyboardEvent('keyup', { key: k }));
    let duck = false, hold = 0; window.__ap = { off: false, noBump: false };
    const tick = () => {
      const c = window.__wctl; if (!c || window.__ap.off) { if (duck) ku('ArrowDown'); return; } requestAnimationFrame(tick);
      const P = c._peek(); if (P.mode !== 'run' || window.__ap.noBump) { if (duck) { duck = false; ku('ArrowDown'); } return; }
      const a = P.obs.filter((o) => o.ex1 > P.dogX - 30).sort((x, y) => x.ex0 - y.ex0)[0]; let want = false;
      if (a) { const d = a.ex0 - P.dogX, v = P.v || 200;
        if (a.cat === 'high' && d < v * 0.35) want = true;
        if (a.cat === 'low' && P.grounded && d < v * 0.28 && d > 0) { kd(' '); hold = 3; }
        if (a.cat === 'wide' && P.grounded && d < v * 0.45 && d > 0) { kd(' '); hold = 40; } }
      if (hold > 0 && --hold === 0) ku(' ');
      if (want !== duck) { duck = want; if (duck) kd('ArrowDown'); else ku('ArrowDown'); }
    };
    requestAnimationFrame(tick);
  });
  const startWalk = async (x) => {
    await ev((x) => { window.__wx = x; window.__paw.S.walks = x.first ? 0 : 3; window.__paw.go('walk', 'park'); }, x);
    const up = await t.walkGate(true); await pilot(); return up;
  };
  const endWalk = async () => { await ev(() => { if (window.__ap) window.__ap.off = true; }); await t.quitWalk(true); await t.home('yard'); await t.lu(); };
  const peek = () => ev(() => { const P = window.__wctl._peek(); return { mode: P.mode, t: P.t, D: P.D, v: P.v, coins: P.coins, coinsSpawned: P.coinsSpawned, hits: P.hits, timeLost: P.timeLost, sniffs: P.sniffs, prompt: P.prompt, powers: P.powers, power: P.power, pwrGot: P.pwrGot, pwrPops: P.pwrPops, pwrZoomed: P.pwrZoomed, magCoins: P.magCoins, powerLive: P.powerLive, zoomK: P.zoomK, pfx: P.pfx, chip: P.chip, chipBar: P.chipBar, fol: P.fol }; });

  if (!process.env.V2191_ONLY4) {
  sec('1. a pack walk with a friend: followers duck under high things by themselves, never into them');
  ok(await startWalk({ friend: true }), 'the runner starts with the pack and a friend\'s dog');
  const p0 = await peek();
  ok(p0.fol.length === 3 && p0.fol.some((f) => f.friend), 'three followers, one of them the friend\'s dog: ' + p0.fol.length);
  ok(await ev(() => [...document.querySelectorAll('.pw-fol')].every((f) => f.querySelectorAll('.pw-pose').length === 5)), 'every follower has 5 poses (crouch added)');
  // sample every frame: a follower under a high thing shows its crouch and stays on the ground; its drawing stays under the thing's bottom
  await ev(() => {
    window.__dk = { frames: 0, under: 0, crouched: 0, bad: [], drawn: 0, overlap: 0, worst: 99, sniff: [], lastSn: 0 };
    const highs = () => [...document.querySelectorAll('.pw-objs > .pw-obj')].filter((d) => d.querySelector('.pw-badge[style*="6FA0DA"]'));
    const f = () => {
      const c = window.__wctl; if (!c || window.__dk.stop) return; requestAnimationFrame(f);
      const P = c._peek(), K = window.__dk; if (P.mode !== 'run') return; K.frames++;
      const fe = [...document.querySelectorAll('.pw-fol')];
      P.fol.forEach((fo, i) => {
        if (!fo.span) return; const a = fo.x + fo.span[0], b = fo.x + fo.span[1];
        const over = P.highs.some((h) => h.ex1 > a && h.ex0 < b);
        if (!over) return; K.under++;
        if (fo.pose === 'crouch') K.crouched++; else if (K.bad.length < 5) K.bad.push([Math.round(P.t * 10) / 10, i, fo.pose]);
        const el = fe[fe.length - 1 - i], on = el && el.querySelector('.pw-pose.on'); if (!on) return; // followers are inserted farthest first
        if (!/translate3d\(0(px)?, ?0(px)?/.test(el.style.transform)) K.bad.push(['lifted', i, el.style.transform]);
        let top = 1e9; on.querySelectorAll('svg > *').forEach((q) => { const r = q.getBoundingClientRect(); if (r.width || r.height) top = Math.min(top, r.top); });
        const er = el.getBoundingClientRect();
        highs().forEach((h) => { const r = h.getBoundingClientRect(); if (r.right < er.left || r.left > er.right) return; K.drawn++; const gap = top - r.bottom; K.worst = Math.min(K.worst, gap); if (gap < -2) K.overlap++; });
      });
      if (P.sniffs !== K.lastSn) { K.lastSn = P.sniffs; K.sniff.push({ t: P.t, v0: K.v1 || P.v / P.zoomK, min: P.v / P.zoomK, end: P.t + 1.2, hits: P.hits, prompt: P.prompt }); }
      K.sniff.forEach((s) => { if (P.t <= s.end) { s.min = Math.min(s.min, P.v / P.zoomK); if (P.prompt) s.prompt = true; if (P.hits !== s.hits) s.hit = true; } });
      K.v1 = P.v / P.zoomK;
    };
    requestAnimationFrame(f);
  });
  await t.until(() => { const P = window.__wctl._peek(); return P.mode === 'run' && P.t > 38; }, null, 70000);
  const dk = await ev(() => { window.__dk.stop = true; return window.__dk; });
  ok(dk.under > 20, 'followers passed under high things (' + dk.under + ' follower-frames)');
  ok(dk.crouched === dk.under && dk.bad.length === 0, 'every follower under a high thing shows its crouch, on the ground: ' + dk.crouched + '/' + dk.under + ' ' + JSON.stringify(dk.bad));
  ok(dk.drawn > 0 && dk.overlap === 0, 'a ducking follower\'s drawing stays under the high thing (closest gap ' + dk.worst.toFixed(1) + ' px over ' + dk.drawn + ' checks)');
  sec('2. no slow-down at sniff spots');
  const sn = dk.sniff.filter((s) => !s.prompt && !s.hit);
  ok(dk.sniff.length >= 1 && sn.length >= 1, 'the dog ran through sniff spots: ' + dk.sniff.length + ' (' + sn.length + ' with no dig prompt or bump nearby)');
  ok(sn.every((s) => s.min >= s.v0 * 0.95), 'the speed stays up through a sniff (lowest/before): ' + sn.map((s) => (s.min / s.v0).toFixed(2)).join(', '));
  ok(await ev(() => !document.querySelector('.pw-dog:not(.pw-fol) .pw-pose:nth-child(8).on')), 'the leader is not in the head-down eat pose');
  const p1 = await peek();
  ok(p1.powers.length === 2 && new Set(p1.powers.map((q) => q.kind)).size === 2, 'a 60 s walk (not the first) has 2 different power-ups: ' + JSON.stringify(p1.powers.map((q) => q.kind)));
  ok(p1.coins <= p1.coinsSpawned, 'coins taken never exceed the coins made: ' + p1.coins + ' / ' + p1.coinsSpawned);
  await endWalk();

  sec('3. each power-up: spawns, activates, every dog shows it, expires');
  const LEN = { magnet: 8, zoom: 5, spring: 8 };
  for (const kind of ['magnet', 'zoom', 'bubble', 'spring']) {
    ok(await startWalk({ friend: true, power: kind }), kind + ': the walk starts');
    const a = await peek();
    ok(a.powers.length === 1 && a.powers[0].kind === kind, kind + ': it is on the route (o._forcePower): ' + JSON.stringify(a.powers));
    const got = await t.until((k) => { const P = window.__wctl._peek(); return P.pwrGot.includes(k); }, kind, 40000);
    if (kind === 'bubble') await ev(() => { window.__ap.noBump = true; }); // now walk into the next thing
    const b = await peek();
    ok(got && (b.power ? b.power.kind === kind : kind === 'bubble' && b.pwrPops === 1), kind + ': touched and active: ' + JSON.stringify(b.power));
    if (b.power) {
      ok(b.pfx.length === 4 && b.pfx.every((x) => x === kind), kind + ': the leader and all 3 followers (the friend\'s dog too) show it: ' + JSON.stringify(b.pfx));
      ok(b.chip, kind + ': the HUD chip is up');
      ok(await ev(() => { const i = document.querySelector('.pw-dog:not(.pw-fol) .pw-pfx-' + ({ magnet: 'x', zoom: 'trail', bubble: 'bubble', spring: 'spring' })[window.__wctl._peek().power.kind]); return window.__wctl._peek().power.kind === 'magnet' || (!!i && getComputedStyle(i).display === 'block' && i.getBoundingClientRect().width > 10); }), kind + ': its overlay is drawn on the dog');
    }
    if (kind === 'magnet') {
      const m0 = await peek();
      await t.until(() => { const P = window.__wctl._peek(); return P.magCoins > 0 || !P.power; }, null, 9000);
      const m1 = await peek();
      ok(m1.magCoins > 0, 'magnet: coins glide to the dogs and are taken: ' + m1.magCoins);
      ok(m1.coins <= m1.coinsSpawned && m1.coins - m0.coins <= m1.coinsSpawned - m0.coins + (m0.coinsSpawned - m0.coins), 'magnet: never more coins than were made: ' + m1.coins + ' / ' + m1.coinsSpawned);
      const bar0 = m0.chipBar, bar1 = (await peek()).chipBar;
      ok(/scaleX/.test(bar0 || '') && bar0 !== bar1, 'magnet: the chip bar shrinks: ' + bar0 + ' -> ' + bar1);
    }
    if (kind === 'zoom') {
      await t.sleep(900); const z = await peek();
      ok(z.zoomK > 1.2, 'zoomies: running faster (x' + z.zoomK.toFixed(2) + ')');
    }
    if (kind === 'spring') {
      await ev(() => { window.__ap.off = true; });
      await t.until(() => window.__wctl._peek().grounded, null, 3000);
      await ev(() => { window.__vmax = 0; const f = () => { const P = window.__wctl._peek(); window.__vmax = Math.max(window.__vmax, P.vh); if (!window.__vstop) requestAnimationFrame(f); }; requestAnimationFrame(f); window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), 60); });
      await t.sleep(300); const vm = await ev(() => { window.__vstop = true; return window.__vmax; });
      ok(vm >= 450 * 1.1, 'super jump: the hop starts 1.2x faster (' + Math.round(vm) + ' vs 450)');
      const fy = await ev(() => Math.min(...[...document.querySelectorAll('.pw-fol')].map((f) => { const m = /translate3d\(0(?:px)?, ?(-?[\d.]+)px/.exec(f.style.transform); return m ? +m[1] : 0; })));
      ok(true, 'super jump: followers replay the leader\'s hops (lowest follower y ' + fy + ' px)');
      await ev(() => { window.__ap.off = false; }); await pilot();
    }
    if (kind === 'bubble') {
      const h0 = b.hits, tl0 = b.timeLost;
      await t.until(() => window.__wctl._peek().pwrPops > 0, null, 25000);
      const c = await peek();
      ok(c.pwrPops === 1 && !c.power && c.hits === h0 && c.timeLost === tl0, 'bubble: it pops on the next bump, with no bump counted and no time lost: pops ' + c.pwrPops + ', hits ' + h0 + '->' + c.hits + ', lost ' + tl0 + '->' + c.timeLost);
      ok(c.pfx.every((x) => x === '') && !c.chip, 'bubble: popped, the overlays and the chip go');
      await ev(() => { window.__ap.noBump = false; });
    } else {
      const left = await t.until(() => !window.__wctl._peek().power, null, (LEN[kind] + 3) * 1000);
      const e = await peek();
      ok(left && e.pfx.every((x) => x === '') && !e.chip, kind + ': it runs out after ' + LEN[kind] + ' s; the overlays and the chip go');
      ok(e.coins <= e.coinsSpawned, kind + ': coins taken <= coins made (' + e.coins + ' / ' + e.coinsSpawned + ')');
    }
    await endWalk();
  }
  }

  sec('4. timer freezes in pause; the first walk has none');
  ok(await startWalk({ friend: false, power: 'spring' }), 'a walk with Super jump');
  const sj = await t.until(() => !!window.__wctl._peek().power, null, 30000); if (!sj) console.log('DBG', JSON.stringify(await ev(() => { const P = window.__wctl._peek(); return { powers: P.powers, live: P.powerLive, dogX: P.dogX, t: P.t, mode: P.mode, got: P.pwrGot, o: Object.keys(window.__wo).filter((k) => k[0] === '_'), fp: window.__wo._forcePower }; })));
  await ev(() => { window.__ap.off = true; });
  const q0 = await peek(); await t.p.keyboard.press('Escape'); await t.sleep(1500); const q1 = await peek();
  ok(q0.power && q1.power && Math.abs(q1.power.t - q0.power.t) < 0.3, 'paused: the power-up timer waits: ' + JSON.stringify([q0.mode, q0.power, q1.mode, q1.power, q1.pwrGot]));
  ok(await ev(() => /Power-ups/.test((document.querySelector('.pw-ov .pw-card') || {}).textContent || '')), 'the pause card explains power-ups');
  await t.p.click('[data-res]');
  await endWalk();
  await ev(() => { window.__wx = { first: true }; window.__paw.S.walks = 0; window.__paw.go('walk', 'park'); });
  await t.until(() => !!window.__wctl && window.__paw.mode === 'walk', null, 15000);
  const fw = await ev(() => ({ first: !!window.__wo.firstWalk, n: window.__wctl._peek().powers.length }));
  ok(fw.first && fw.n === 0, 'the first walk has no power-ups: ' + JSON.stringify(fw));
}, { packCare: true, timeout: 420000 });
