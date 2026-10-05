// v1.7.1 balance check (V171.md Part A "Balance"): node game/balance_v171.js [--quiet]
// Garden: 6 plots, the real PawGarden pure functions (hourly growth model) + the game's seeded weather,
// simulated HOUR BY HOUR for 28 days in October, January and July.
//  - max effort: checks the garden every waking hour (07:00-22:00, 16 check-ins a day), tops up every growing plot,
//    harvests, replants (buys the seed) and sells to Pip; it also picks the number of plots (1-6) that earns the most.
//  - casual: 3 check-ins a day (08:00, 13:00, 19:00), all 6 plots, same actions.
// Pip buys at most 60 coins of crops per real day; what he can't take stays in the basket (it goes to cooking).
// Income = coins from Pip - seeds bought, per day. Walks earn about 100 a day.
const G = require('../mods/garden.js');
const K = (() => { global.window = {}; require('../mods/kitchen.js'); return global.window.PawKitchen; })();
const QUIET = process.argv.includes('--quiet');
const PIP_CAP = 60, DAYS = 28;
function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function weatherAt(key) { // same formula as the game's weatherForKey() (8-hour period keys)
  const [y, m, d, per] = String(key).split('-').map(Number);
  const r = seeded((y * 400 + m * 32 + d) * 7 + per * 131 + 17)();
  return r < 0.45 ? 'sunny' : r < 0.70 ? 'cloudy' : r < 0.95 ? 'rain' : [12, 1, 2].includes(m) ? 'snow' : 'rain';
}
const PLAYERS = {
  max: { label: 'max effort (every waking hour, 07-22)', checks: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], plots: [1, 2, 3, 4, 5, 6] },
  casual: { label: 'casual (3 check-ins: 08, 13, 19)', checks: [8, 13, 19], plots: [6] }
};
function sim(cropId, y, m, buddy, player, nPlots) {
  const c = G.CROPS.find((x) => x.id === cropId), H = 3600e3, t0 = new Date(y, m - 1, 1, 7).getTime();
  let st = G.newState(t0), sold = 0, spent = 0, grossValue = 0, harvests = 0, dryHours = 0, squirrels = 0;
  const stock = []; let capDay = '', capLeft = PIP_CAP;
  const plantAt = (i, now) => { const r = G.plant(st, i, cropId, { now, month: new Date(now).getMonth() + 1, buddy }); if (r.ok) { st = r.state; spent += c.seed; } };
  for (let i = 0; i < nPlots; i++) { plantAt(i, t0); st = G.water(st, i); }
  for (let k = 1; k < DAYS * 24; k++) { // day 1 07:00 .. day 29 06:00 = 28 Pip days
    const now = t0 + k * H, d = new Date(now);
    const r = G.advance(st, { now, weatherAt, buddy }); st = r.state; squirrels += r.events.filter((e) => e.type === 'squirrel').length;
    st.plots.forEach((p) => { if (p.crop && p.g < 1 && p.water === 0) dryHours++; });
    if (!player.checks.includes(d.getHours())) continue;
    for (let i = 0; i < nPlots; i++) {
      if (st.plots[i].crop && st.plots[i].g >= 1) {
        const h = G.harvest(st, i, {}); st = h.state; harvests++;
        h.items.forEach((it) => { const v = G.sellPrice(cropId, it.stars); stock.push(v); grossValue += v; });
      }
      if (!st.plots[i].crop) plantAt(i, now);
      if (st.plots[i].crop && st.plots[i].g < 1 && st.plots[i].water < 3) st = G.water(st, i);
    }
    // sell to Pip, at most 60 coins per real day (best items first; an item that doesn't fit waits)
    const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; if (day !== capDay) { capDay = day; capLeft = PIP_CAP; }
    stock.sort((a, b) => b - a);
    for (let j = 0; j < stock.length && capLeft > 0;) { if (stock[j] <= capLeft) { capLeft -= stock[j]; sold += stock[j]; stock.splice(j, 1); } else j++; }
  }
  return { crop: cropId, nPlots, perDay: (sold - spent) / DAYS, uncapped: (grossValue - spent) / DAYS, soldPerDay: sold / DAYS, harvestsPerDay: harvests / DAYS, leftover: stock.length, dryHoursPerPlotDay: dryHours / DAYS / nPlots, squirrels };
}
const best = (rows) => rows.slice().sort((a, b) => b.perDay - a.perDay)[0];
const months = [['October', 2026, 10], ['January', 2027, 1], ['July', 2026, 7]];
const out = { max: { none: 0, inspect: 0 }, casual: { none: 0, inspect: 0 } };
const log = (...a) => { if (!QUIET) console.log(...a); };
log('Crop table (v1.7.1): ' + G.CROPS.map((c) => `${c.name} ${c.hours} h${c.regrow ? ` (+${c.regrow} h regrow, ${c.picks} picks)` : ''}, seed ${c.seed}, sells ${c.sell} x${c.yield}`).join(' | '));
for (const pk of ['max', 'casual']) for (const buddy of [null, 'inspect']) {
  const P = PLAYERS[pk];
  log(`\n== ${P.label}, buddy ${buddy || 'none'}${buddy ? ' (Mochi: +1 quality, the best case)' : ''} ==`);
  for (const [name, y, m] of months) {
    const rows = G.CROPS.map((c) => best(P.plots.map((n) => sim(c.id, y, m, buddy, P, n))));
    const b = best(rows); out[pk][buddy || 'none'] = Math.max(out[pk][buddy || 'none'], b.perDay);
    log(`${name} (${G.seasonOf(m)}): best ${b.crop} on ${b.nPlots} plot(s): ${b.perDay.toFixed(1)} coins/day (sold ${b.soldPerDay.toFixed(1)}, ${b.harvestsPerDay.toFixed(1)} harvests/day, uncapped ${b.uncapped.toFixed(1)})`);
    log('   by crop: ' + rows.sort((a, b2) => b2.perDay - a.perDay).map((r) => `${r.crop} ${r.perDay.toFixed(1)}${pk === 'max' ? ` [${r.nPlots}p]` : ''} (uncapped ${r.uncapped.toFixed(0)}, dry ${r.dryHoursPerPlotDay.toFixed(1)} h/plot/day)`).join(', '));
  }
}
// Dish Bond: the game gives Bond for the first Bond dish of the day only: floor(bond x star mult + favourite 10), capped at 37.
const STAR = [1, 1.25, 1.5]; let maxBond = 0, maxWhat = '';
['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle'].forEach((dog) => K.RECIPES.forEach((r) => { const fav = K.FAV[dog] === r.id; if (!(r.effect.bond > 0 || fav)) return; const b = Math.min(37, Math.floor(r.effect.bond * STAR[2] + (fav ? 10 : 0))); if (b > maxBond) { maxBond = b; maxWhat = `${r.name} 3 stars (${dog}${fav ? ', favourite' : ''})`; } }));
const res = {
  maxEffort: +out.max.none.toFixed(1), maxEffortMochi: +out.max.inspect.toFixed(1), casual: +out.casual.none.toFixed(1), casualMochi: +out.casual.inspect.toFixed(1), dishBond: maxBond,
  pass: { maxEffort: out.max.none <= 45, maxEffortMochi: out.max.inspect <= 46, casual: out.casual.inspect <= 50, dishBond: maxBond <= 37 }
};
console.log(`\nMax effort (no buddy): ${res.maxEffort} coins/day, with Mochi ${res.maxEffortMochi} (target <= about 45) -> ${res.pass.maxEffort && res.pass.maxEffortMochi ? 'PASS' : 'FAIL'}`);
console.log(`Casual (3 check-ins): ${res.casual} coins/day, with Mochi ${res.casualMochi} (target: clearly below walks, about 100) -> ${res.pass.casual ? 'PASS' : 'FAIL'}`);
console.log(`Dish Bond per day (max): ${maxBond} from ${maxWhat} -> ${res.pass.dishBond ? 'PASS' : 'FAIL'} (target <= 37)`);
if (typeof module !== 'undefined') module.exports = res;
if (require.main === module && !Object.values(res.pass).every(Boolean)) process.exitCode = 1;
