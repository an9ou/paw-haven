// Walk pay measurement for tools/balance_sim.js --measure: plays the real runner (mods/walkrun.js) in the test harness with a simple
// autoplayer (a fair, not perfect, player: it jumps low and wide things, ducks under flyers, jumps for coin arcs and digs when the
// Nose-o-meter says HOT), and records what each walk paid before the game's BOOST and walk share.
// Writes tools/balance_walk.json (committed, so the sim runs without a browser). Real time: one walk is its route's length (60-90 s).
const L = require('./paw_sim_lib');

// the autoplayer, run inside the runner's step() through the __pwAuto hook (paw_sim_lib WALK_HOOK). skill: chance to react to each thing
const AUTO = (skill) => {
  const st = { hold: 0, duck: null, seen: new Set() };
  window.__pwAuto = (k, dt) => {
    const { S, live, DOG } = k; window.__pwPlaced = k.gen.coins; if (S.endT) return;
    const v = Math.max(60, S.v || 0), dxw = S.camX + DOG.x, bx0 = dxw + DOG.off - DOG.hw, bx1 = dxw + DOG.off + DOG.hw;
    if (S.prompt && S.prompt.kind === 'dig' && S.digsUsed < S.digsMax) {
      const h = k.heat(), left = live.filter((o) => o.kind === 'dig' && !o.done && !o.prompted && o.cx > dxw).length;
      if (h === null || h > 0.72 || (S.digsMax - S.digsUsed > left && h > 0.3)) { k.doDig(); return; }
    }
    if (st.hold > 0) { st.hold -= dt; if (st.hold <= 0) k.jumpRelease(); }
    if (st.duck) { if (st.duck.ex1 < bx0 - 4) { st.duck = null; k.crouchRelease(); } return; }
    const ahead = live.filter((o) => !o.done && ((o.kind === 'obs' && o.ex1 > bx0) || (o.kind === 'coin' && !o.got && o.cx > bx0))).sort((a, b) => (a.ex0 || a.cx) - (b.ex0 || b.cx));
    for (const o of ahead) {
      const id = o.id; if (st.seen.has(id)) continue;
      if (o.kind === 'obs') {
        const gap = o.ex0 - bx1, len = o.ex1 - o.ex0 + DOG.hw * 2;
        if (o.cat === 'high') { if (gap < v * 0.18) { st.seen.add(id); if (Math.random() < skill) { st.duck = o; k.crouchPress(); } } return; }
        const lead = o.cat === 'wide' && !o.solid ? v * 0.1 : Math.max(v * 0.08, v * 0.47 - len / 2);
        if (gap < lead) { st.seen.add(id); if (S.grounded && Math.random() < skill) { k.jumpPress(); st.hold = len / v > 0.55 || o.cat === 'wide' ? 0.45 : 0.05; } }
        return;
      }
      if (o.kind === 'coin') {
        const gap = o.cx - dxw; if (o.ch < 30) { st.seen.add(id); continue; }
        const t = o.ch > 95 ? 0.5 : o.ch > 60 ? 0.3 : 0.18;
        if (gap < v * t) { st.seen.add(id); if (S.grounded && Math.random() < skill * 0.9) { k.jumpPress(); st.hold = o.ch > 100 ? 0.45 : 0.05; } }
        return;
      }
    }
  };
};

async function measureWalks(o) {
  o = Object.assign({ routes: ['park', 'park', 'river', 'woods'], skill: 0.9 }, o || {});
  L.ensureHarness(o.build); const file = L.scratchCopy({ walk: true }); const b = await L.launch(); const out = [];
  try {
    for (const area of o.routes) {
      const p = await L.newPage(b, { prefs: { pupTest: false, skipTut: true } }); await L.adoptNew(p, file);
      await p.evaluate(AUTO, o.skill);
      await p.evaluate(() => { const W = window.PawWalk; const s = W.start.bind(W); W.start = (h, op) => { window.__opts = op; const oe = op.onEnd; op.onEnd = (r) => { window.__res = JSON.parse(JSON.stringify(r)); return oe(r); }; return s(h, op); }; });
      await p.evaluate((a) => { const S = window.__paw.S; S.walks = 3; S.sleeping = false; S.stats.energy = 100; S.dogs.forEach((d) => { d.stats.energy = 100; if (d.potty) { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = S.gameMin + 9999; } }); window.__paw.go('walk', a); }, area);
      await L.until(p, () => window.__paw.mode === 'walk' && !!document.querySelector('.pw-root'), null, 15000);
      const go = p.locator('.pw-ov [data-go]'); if (await go.count()) await go.first().click().catch(() => {});
      const t0 = Date.now(); const ok = await L.until(p, () => !!window.__res, null, 200000);
      const r = ok ? await p.evaluate(() => { const r = window.__res; return { placed: window.__pwPlaced, coins: r.coins, bond: r.bond, early: r.early, hits: r.obstaclesHit, treasure: r.treasure ? (r.treasure.name ? 'item' : 'pouch') : null, junk: (r.junk || []).length, junkCoins: (r.junk || []).reduce((s, j) => s + (+(j && j.coins) || 0), 0), pouch: (r.treasure && r.treasure.coins) || 0 }; }) : null;
      out.push(Object.assign({ area, secs: Math.round((Date.now() - t0) / 1000), errors: p.errors.slice(0, 3) }, r || { failed: true }));
      process.stderr.write(`walk ${area}: ${JSON.stringify(out[out.length - 1])}\n`);
      await p.context().close();
    }
  } finally { await b.close(); }
  return out;
}
module.exports = { measureWalks };
if (require.main === module) measureWalks().then((r) => console.log(JSON.stringify(r, null, 1)));
