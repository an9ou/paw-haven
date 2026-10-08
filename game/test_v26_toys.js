// V26_TOYS: the four Halloween 2026 toy games in mods/toys.js (V26.md section 6). node game/run_tests.js v26_toys
// Covers: PawToys.supports / list for all 19 names (the old 15 unchanged, in order); each new toy, owned through t.patch, opens from the yard Play tray,
//         its main tap starts the play (dbg changes), it plays to finish() (the reward toast and end card), the session pay stays within CAP,
//         Escape closes it cleanly, no console errors. Desktop 1280x720 (motion on, then a motion-off pass) and iPhone 13 (two toys with motion off).
// PAW_SHOTS=1 also writes screenshots to game/shots_v26/toys/ (an existing toy, Squeaky Hedgehog, is shot next to them for comparison).
const path = require('path'), fs = require('fs');
const NEW = ['Squeaky Pumpkin', 'Plush Ghost', 'Bat-Wing Flyer', 'Trick-or-Treat Bucket'];
const OLD = ['Tennis Ball', 'Rope Tug', 'Squeaky Duck', 'Frisbee', 'Plush Bone', 'Puzzle Feeder', 'Driftwood Stick', 'Rubber Chicken', 'Glow Ball',
  'Snuffle Mat', 'Treat Cone', 'Squeaky Hedgehog', 'Bubble Machine', 'Paddling Pool', 'Agility Tunnel'];
const CAP = { happiness: 25, bond: 2, coins: 6 };
const SHOTS = path.join(__dirname, 'shots_v26', 'toys');

require('./test_lib').run('v26_toys', async (t) => {
  const { ok, sec } = t;
  const ev = (f, a) => t.p.evaluate(f, a);
  const shot = async (n) => { if (!process.env.PAW_SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: path.join(SHOTS, (process.env.V26_SHOT_PREFIX || '') + n + '.png') }); };
  const toy = () => ev(() => window.__toyCtl && window.__toyCtl._dbg ? window.__toyCtl._dbg().toy : null);
  const at = async (x, y) => { const m = await ev(([x, y]) => window.__toyCtl._map(x, y), [x, y]); return [m.x, m.y]; };
  let phone = false;
  const tap = async (x, y) => { const [a, b] = await at(x, y); if (phone) await t.p.touchscreen.tap(a, b); else await t.p.mouse.click(a, b); };
  const hook = () => ev(() => { const P = window.PawToys, o = P.open; P.open = function () { const c = o.apply(this, arguments); window.__toyCtl = c; return c; }; });
  const until = (fn, arg, ms) => t.until(fn, arg, ms);
  const st = (k) => until((k) => { const d = window.__toyCtl._dbg().toy; return k.split('|').includes(d.state); }, k, 8000);

  // the main interaction of each game; returns true when the dbg shows it happened
  async function play(name, tag) {
    if (name === 'Squeaky Pumpkin') {
      await until(() => !window.__toyCtl._dbg().toy.pk.air, null, 3000);
      const d = await toy(); await tap(d.pk.x, d.pk.y);
      const okp = await until(() => window.__toyCtl._dbg().toy.pounces >= 1, null, 7000);
      await t.sleep(250); await shot(tag + '_pumpkin'); return okp;
    }
    if (name === 'Plush Ghost') {
      if (!(await st('hold'))) return false;
      await shot(tag + '_ghost_hold');
      const d = await toy(); await tap(d.home - 330, 500);
      const tossed = await until(() => window.__toyCtl._dbg().toy.tosses >= 1, null, 3000);
      await until(() => window.__toyCtl._dbg().toy.flying, null, 2000); await t.sleep(250); await shot(tag + '_ghost_toss');
      return tossed && await until(() => { const g = window.__toyCtl._dbg().toy; return g.returns >= 1 && g.state === 'hold'; }, null, 9000);
    }
    if (name === 'Bat-Wing Flyer') {
      await tap(640, 300);
      if (!(await until(() => window.__toyCtl._dbg().toy.throws >= 1, null, 3000))) return false;
      const win = await until(() => { const d = window.__toyCtl._dbg().toy; return d.window && d.state === 'run'; }, null, 4000);
      await shot(tag + '_flyer_window');
      const d = await toy(); await tap(d.fl.x, d.fl.y);
      const got = await until(() => { const d = window.__toyCtl._dbg().toy; return d.catches + d.ground >= 1; }, null, 6000);
      return win && got && await until(() => window.__toyCtl._dbg().toy.fl.st === 'hand', null, 8000);
    }
    if (name === 'Trick-or-Treat Bucket') {
      if (!(await st('walk|sniff|point'))) return false;
      await shot(tag + '_bucket_sniff');
      let d = await toy(); const wrong = d.pots[(d.treat + 1) % 4];
      await tap(wrong.x, wrong.y);
      const peek = await until(() => window.__toyCtl._dbg().toy.peeks >= 1, null, 3000);
      await t.sleep(200); await shot(tag + '_bucket_peek');
      d = await toy(); await tap(d.pots[d.treat].x, d.pots[d.treat].y);
      const found = await until(() => window.__toyCtl._dbg().toy.found >= 1, null, 3000);
      await t.sleep(500); await shot(tag + '_bucket_found');
      return peek && found && await until(() => window.__toyCtl._dbg().toy.round >= 2, null, 8000);
    }
    return false;
  }

  async function session(name, tag, o) {
    o = o || {};
    sec(`${tag}: ${name}`);
    await t.home(); await t.calm(); await ev(() => { window.__toasts.length = 0; });
    const errs0 = t.errors.length, p = t.p;
    if (o.tray !== false) {
      await p.click('[data-act=play]'); await t.waitPop(true);
      const btn = p.locator(`[data-play="toy:${name}"]`);
      ok(await btn.count() === 1, `${tag} ${name}: in the Play tray`);
      await btn.click();
    } else await ev((n) => window.__paw.go('toy', n), name);
    ok(await t.untilMode('toy', 5000), `${tag} ${name}: opens`);
    ok(await until(() => !!document.querySelector('#modHost .pt-root'), null, 4000), `${tag} ${name}: the toy stage is showing`);
    const d0 = await toy();
    ok(!!d0 && d0.still === !!o.still, `${tag} ${name}: motion ${o.still ? 'off' : 'on'} seen by the game (still=${d0 && d0.still})`);
    if (phone) {
      ok(await ev(() => !!document.querySelector('.pt-phone')), `${tag} ${name}: uses the phone layout`);
      ok(await ev(() => document.documentElement.scrollWidth === window.innerWidth), `${tag} ${name}: no sideways scroll`);
      const bh = await ev(() => { const b = document.querySelector('#modHost .pt-hud .pt-btn').getBoundingClientRect(); return [b.width, b.height]; });
      ok(bh[0] >= 44 && bh[1] >= 44, `${tag} ${name}: Done button at least 44 px (${bh.map(Math.round).join('x')})`);
    }
    await t.sleep(1200); await shot(`${tag}_${name.replace(/\W+/g, '')}_start`);
    ok(await play(name, tag), `${tag} ${name}: the main tap plays (dbg moved on: ${JSON.stringify(await toy()).slice(0, 160)})`);
    // a wrong tap only ever gets a kind sniff (the Flyer: a kind "not yet" while it climbs). Tap the empty sky while the toy is busy.
    if (name === 'Plush Ghost') { const d = await toy(); await tap(d.home - 330, 500); await st('trot'); }
    if (name === 'Bat-Wing Flyer') { await tap(640, 300); await until(() => window.__toyCtl._dbg().toy.fl.st === 'fly', null, 2000); }
    const k0 = await ev(() => { const d = window.__toyCtl._dbg(); return d.kind + (d.toy.early || 0); }), h0 = await ev(() => window.__toyCtl._dbg().totals.happiness);
    const dg = await ev(() => window.__toyCtl._dbg().dog); await tap(dg.x, 130);
    ok(await until((k0) => { const d = window.__toyCtl._dbg(); return d.kind + (d.toy.early || 0) > k0 && !d.finished; }, k0, 1500), `${tag} ${name}: a tap on nothing gets a kind sniff, no fail`);
    ok(await ev((h0) => window.__toyCtl._dbg().totals.happiness >= h0, h0), `${tag} ${name}: and costs nothing`);
    ok(t.errors.length === errs0, `${tag} ${name}: play with no console errors ${t.errors.slice(errs0, errs0 + 2).join(' | ')}`);
    await ev(() => window.__toyCtl._end());
    ok(await t.waitToast(/\+\d+ Happiness/, 4000), `${tag} ${name}: the reward toast shows`);
    ok(await until(() => !!document.querySelector('#modHost .pt-card'), null, 3000), `${tag} ${name}: plays to finish() (the end card shows)`);
    await shot(`${tag}_${name.replace(/\W+/g, '')}_card`);
    const tot = await ev(() => window.__toyCtl._dbg().totals);
    ok(tot.happiness > 0 && tot.happiness <= CAP.happiness && tot.bond <= CAP.bond && tot.coins <= CAP.coins, `${tag} ${name}: pay within CAP ${JSON.stringify(tot)}`);
    await p.keyboard.press('Escape');
    ok(await t.untilMode('yard', 5000), `${tag} ${name}: Escape closes it`);
    ok(await until(() => !document.querySelector('#modHost .pt-root'), null, 3000), `${tag} ${name}: the toy stage is gone`);
    ok(t.errors.length === errs0, `${tag} ${name}: closed with no console errors`);
    await t.lu();
  }

  // ============ desktop ============
  sec('PawToys API');
  await t.newGame({}, { bond: { level: 7, pts: 1450 }, inv: { toys: ['Tennis Ball', 'Squeaky Hedgehog'].concat(NEW) } });
  const api = await ev((all) => ({ sup: all.filter((n) => window.PawToys.supports(n)), list: window.PawToys.list.slice() }), OLD.concat(NEW));
  ok(api.sup.length === 19, `PawToys.supports is true for all 19 toys (${api.sup.length})`);
  ok(api.list.length === 19 && OLD.every((n, i) => api.list[i] === n) && NEW.every((n) => api.list.includes(n)), `PawToys.list: the old 15 unchanged and in order, then the four new ones (${api.list.length})`);
  await hook();

  if (process.env.PAW_SHOTS) { // an existing toy for the side-by-side shots
    await ev(() => window.__paw.go('toy', 'Squeaky Hedgehog')); await t.untilMode('toy', 5000); await t.sleep(1500); await shot('desk_SqueakyHedgehog_ref');
    await t.p.keyboard.press('Escape'); await t.untilMode('yard', 5000);
  }
  for (const name of NEW) await session(name, 'desk');
  // a fast player for a whole session (the timer runs out by itself): the pay stays well under CAP
  sec('desk: Squeaky Pumpkin, fast player, full session');
  await t.home(); await t.calm(); await ev(() => window.__paw.go('toy', 'Squeaky Pumpkin')); await t.untilMode('toy', 5000);
  await ev(() => { window.__bot = setInterval(() => { const c = window.__toyCtl, d = c && c._dbg(); if (!d || d.finished) return; const m = c._map(d.toy.pk.x, d.toy.pk.y), root = document.querySelector('#modHost .pt-root');
    ['pointerdown', 'pointerup'].forEach((ty) => root.dispatchEvent(new PointerEvent(ty, { bubbles: true, clientX: m.x, clientY: m.y, button: 0, pointerId: 1, pointerType: 'mouse' }))); }, 60); });
  // the game clock caps frames at 0.05 s, so 45 game seconds can take much longer under load: wait for the toy's own timer, generously
  ok(await until(() => { const d = window.__toyCtl._dbg(); return d.finished && d.timeLeft <= 0; }, null, 150000), 'fast player: the timer runs out and the session ends by itself (finish())');
  const full = await ev(() => { clearInterval(window.__bot); const d = window.__toyCtl._dbg(); return { tot: d.totals, pounces: d.toy.pounces, hops: d.toy.hops }; });
  ok(full.pounces >= 8 && full.hops >= full.pounces, `fast player: lots of pounces and the pumpkin still hops away each time ${JSON.stringify(full)}`);
  ok(full.tot.happiness <= 20 && full.tot.bond <= 1 && full.tot.coins <= 3, `fast player: whole-session pay well under CAP ${JSON.stringify(full.tot)}`);
  await t.p.keyboard.press('Escape'); ok(await t.untilMode('yard', 5000), 'fast player: Escape closes it'); await t.lu();

  for (const name of NEW.slice(0, 2)) { await t.freezeMotion(true); await session(name, 'desk-still', { tray: false, still: true }); await t.freezeMotion(false); }

  // ============ phone ============
  await t.ctx.close(); phone = true;
  sec('iPhone 13');
  await t.newGame({ device: 'iPhone 13' }, { bond: { level: 7, pts: 1450 }, inv: { toys: ['Tennis Ball', 'Squeaky Hedgehog'].concat(NEW) } });
  await hook();
  if (process.env.PAW_SHOTS) {
    await ev(() => window.__paw.go('toy', 'Squeaky Hedgehog')); await t.untilMode('toy', 5000); await t.sleep(1500); await shot('phone_SqueakyHedgehog_ref');
    await ev(() => window.__toyCtl.close()); await t.untilMode('yard', 5000);
  }
  for (const name of NEW) {
    const still = NEW.indexOf(name) >= 2;
    if (still) await t.freezeMotion(true);
    await session(name, still ? 'phone-still' : 'phone', { still });
    if (still) await t.freezeMotion(false);
  }
}, { timeout: 400000 });
