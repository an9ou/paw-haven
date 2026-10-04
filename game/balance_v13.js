// v1.3 balance check (V13.md "Balance targets"): node balance_v13.js
// Garden: 6 plots of one crop, the real PawGarden pure functions + the game's seeded weather,
// a player who checks in every period (8 h): waters an empty plot, harvests when ready, sells everything, replants (buys the seed).
const G = require('../mods/garden.js');
const K = (() => { global.window = {}; require('../mods/kitchen.js'); return global.window.PawKitchen; })();
function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function weatherAt(key) { // same formula as the game's weatherForKey()
  const [y, m, d, per] = String(key).split('-').map(Number);
  const r = seeded((y * 400 + m * 32 + d) * 7 + per * 131 + 17)();
  return r < 0.45 ? 'sunny' : r < 0.70 ? 'cloudy' : r < 0.95 ? 'rain' : [12, 1, 2].includes(m) ? 'snow' : 'rain';
}
const MULT = [1, 1.5, 2];
function sim(crop, y, m, buddy, days = 28, checks = [0, 1, 2]) {
  const c = G.CROPS.find((x) => x.id === crop); const t0 = new Date(y, m - 1, 1, 9).getTime(), P = 8 * 3600e3;
  let st = G.newState(t0), coins = 0, spent = 0, harvests = 0, firstHarvestAt = null, coinsAfterFirst = 0;
  for (let i = 0; i < 6; i++) { st = G.plant(st, i, crop, { now: t0, month: m, buddy }).state; spent += c.seed; }
  for (let k = 1; k <= days * 3; k++) {
    const now = t0 + k * P;
    st = G.advance(st, { now, weatherAt, buddy }).state;
    if (!checks.includes(k % 3)) continue; // the player is not looking this period
    for (let i = 0; i < 6; i++) {
      const p = st.plots[i];
      if (p.crop && p.g >= 1) {
        const r = G.harvest(st, i, {}); st = r.state; harvests++;
        const got = r.items.reduce((a, it) => a + Math.round(c.sell * MULT[it.stars - 1]), 0); coins += got;
        if (firstHarvestAt == null) firstHarvestAt = k; else coinsAfterFirst += got;
        if (!st.plots[i].crop) { st = G.plant(st, i, crop, { now, month: m, buddy }).state; spent += c.seed; }
      }
      if (st.plots[i].crop && st.plots[i].water === 0 && st.plots[i].g < 1) st = G.water(st, i); // a player waters dry plots
    }
  }
  return { crop, net: coins - spent, perDay: (coins - spent) / days, perPlotDay: (coins - spent) / days / 6, harvests, regrowPerPlotDay: c.regrow ? coinsAfterFirst / ((days * 3 - firstHarvestAt) / 3) / 6 : null };
}
const months = [['October', 2026, 10], ['January', 2027, 1], ['July', 2026, 7]];
let worst = 0, worstBuddy = 0;
for (const [label, checks] of [['checks in every 8 h (max effort)', [0, 1, 2]], ['checks in twice a day', [1, 2]]]) for (const buddy of [null, 'inspect']) {
  console.log(`\n== ${label}, buddy ${buddy || 'none'}${buddy ? ' (Mochi: +1 quality, the best case)' : ''} ==`);
  for (const [name, y, m] of months) {
    const season = G.seasonOf(m), rows = G.CROPS.filter((c) => c.seasons.includes(season)).map((c) => sim(c.id, y, m, buddy, 28, checks)).sort((a, b) => b.perDay - a.perDay);
    const best = rows[0]; if (buddy) worstBuddy = Math.max(worstBuddy, best.perDay); else worst = Math.max(worst, best.perDay);
    console.log(`${name} (${season}): best ${best.crop} ${best.perDay.toFixed(1)} coins/day  | per plot per day: ` + rows.map((r) => `${r.crop} ${r.perPlotDay.toFixed(1)}${r.regrowPerPlotDay != null ? ` (after 1st harvest ${r.regrowPerPlotDay.toFixed(1)})` : ''}`).join(', '));
  }
}
console.log(`\nGarden target (V13: best in-season crop, all sold, no buddy): <= 45 coins/day (about 35). Highest month: ${worst.toFixed(1)} -> ${worst <= 45 ? 'PASS' : 'FAIL'}`);
console.log(`Best case with Mochi's Inspector perk: ${worstBuddy.toFixed(1)} coins/day -> ${worstBuddy <= 45 ? 'PASS' : 'OVER (needs a table change to fix)'}`);
// Dish Bond: the game gives Bond for the first Bond dish of the day only: floor(bond x star mult + favourite 10), capped at 37.
const STAR = [1, 1.25, 1.5]; let maxBond = 0, maxWhat = '';
['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt'].forEach((dog) => K.RECIPES.forEach((r) => { const fav = K.FAV[dog] === r.id; if (!(r.effect.bond > 0 || fav)) return; const b = Math.min(37, Math.floor(r.effect.bond * STAR[2] + (fav ? 10 : 0))); if (b > maxBond) { maxBond = b; maxWhat = `${r.name} 3 stars (${dog}${fav ? ', favourite' : ''})`; } }));
console.log(`Dish Bond per day (max, raw points): ${maxBond} from ${maxWhat} -> ${maxBond <= 37 ? 'PASS' : 'FAIL'} (target <= 37)`);
