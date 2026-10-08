// V24_TOYS: the six Shop Day toy games in mods/toys.js (V24.md section 6). node game/run_tests.js v24_toys
// Covers: PawToys.supports for all 15 names and PawToys.list; each new toy opens from the Play tray, runs 3 s with no console errors,
//         a tap or drag starts its main interaction (dbg() changes), the session reward toast shows, Escape closes it.
const NEW = ['Snuffle Mat', 'Treat Cone', 'Squeaky Hedgehog', 'Bubble Machine', 'Paddling Pool', 'Agility Tunnel'];
const ALL = ['Tennis Ball', 'Rope Tug', 'Squeaky Duck', 'Frisbee', 'Plush Bone', 'Puzzle Feeder', 'Driftwood Stick', 'Rubber Chicken', 'Glow Ball'].concat(NEW);

require('./test_lib').run('v24_toys', async (t) => {
  const { ok, sec, ev } = t;
  sec('PawToys API');
  await t.newGame({}, { bond: { level: 7, pts: 1450 }, inv: { toys: ['Tennis Ball'].concat(NEW) } });
  const p = t.p;
  const api = await ev((all) => ({ sup: all.filter((n) => window.PawToys.supports(n)), list: window.PawToys.list.slice(), no: window.PawToys.supports('Sock Puppet') }), ALL);
  ok(api.sup.length === 15, `PawToys.supports is true for all 15 toys (${api.sup.length})`);
  ok(api.list.length >= 15 && NEW.every((n) => api.list.includes(n)), `PawToys.list has at least 15 names including the six new ones (${api.list.length})`);
  ok(api.no === false, 'unknown toys are still unsupported');
  // keep a handle on the open controller so the suite can read its dbg()
  await ev(() => { const P = window.PawToys, o = P.open; P.open = function () { const c = o.apply(this, arguments); window.__toyCtl = c; return c; }; });
  const dbg = () => ev(() => window.__toyCtl && window.__toyCtl._dbg ? window.__toyCtl._dbg().toy : null);
  const at = async (x, y) => { const m = await ev(([x, y]) => window.__toyCtl._map(x, y), [x, y]); return [m.x, m.y]; };
  const click = async (x, y) => { const [a, b] = await at(x, y); await p.mouse.click(a, b); };

  for (const name of NEW) {
    sec(name);
    await t.home(); await t.calm(); await ev(() => { window.__toasts.length = 0; });
    const errs0 = t.errors.length;
    await p.click('[data-act=play]'); await t.waitPop(true);
    const btn = p.locator(`[data-play="toy:${name}"]`);
    ok(await btn.count() === 1, `${name}: in the Play tray`);
    await btn.click();
    ok(await t.untilMode('toy', 5000), `${name}: opens`);
    ok(await t.until(() => !!document.querySelector('#modHost .pt-root'), null, 4000), `${name}: the toy stage is showing`);
    await t.sleep(3000);
    ok(t.errors.length === errs0, `${name}: 3 s of play with no console errors`);
    const d0 = await dbg();
    let moved = false;
    if (name === 'Snuffle Mat') {
      await click(d0.flaps[4].x, d0.flaps[4].y); moved = await t.until(() => window.__toyCtl._dbg().toy.hidden === 1, null, 3000);
    } else if (name === 'Treat Cone') {
      const [a, b] = await at(d0.cone.x, d0.cone.y - 10); await p.mouse.move(a, b); await p.mouse.down();
      moved = await t.until(() => { const d = window.__toyCtl._dbg().toy; return d.held && d.lick > 0; }, null, 6000); await p.mouse.up();
    } else if (name === 'Squeaky Hedgehog') {
      await click(d0.hog.x, d0.hog.y); moved = await t.until(() => window.__toyCtl._dbg().toy.squeaks === 1, null, 3000);
    } else if (name === 'Bubble Machine') {
      await click(d0.hub.x, d0.hub.y); moved = await t.until(() => window.__toyCtl._dbg().toy.made >= 2, null, 3000);
    } else if (name === 'Paddling Pool') {
      const [a, b] = await at(d0.nozzle.x, d0.nozzle.y - 10), [c, e] = await at(d0.pool.x - 60, 360);
      await p.mouse.move(a, b); await p.mouse.down(); await p.mouse.move(c, e, { steps: 10 });
      moved = await t.until(() => window.__toyCtl._dbg().toy.fill > 0.1, null, 5000); await p.mouse.up();
    } else if (name === 'Agility Tunnel') {
      await click(d0.side === 'R' ? d0.sides.L : d0.sides.R, 450); moved = await t.until(() => window.__toyCtl._dbg().toy.state !== 'wait', null, 3000);
    }
    ok(moved, `${name}: a tap or drag starts the main interaction (dbg changed)`);
    await ev(() => window.__toyCtl._end());
    ok(await t.waitToast(/\+\d+ Happiness/, 4000), `${name}: the reward toast shows`);
    ok(await t.until(() => !!document.querySelector('#modHost .pt-card'), null, 3000), `${name}: the end card shows`);
    await p.keyboard.press('Escape');
    ok(await t.untilMode('yard', 5000), `${name}: Escape closes it`);
    await t.lu();
  }
});
