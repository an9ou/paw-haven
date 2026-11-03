// Doodle Doggo economy journey sim (econ review, 3 Nov 2026). Real coins (BOOST included where the game applies it).
const items = require('./items.json');
const BOND_TH = [0, 60, 180, 450, 700, 1000, 1400, 1900, 2500, 3200];
const WALK = +process.env.WALK || 63;          // measured runner walk pay, no treasure pouch (real coins)
const POUCH = 0.6 * (0.55 * 40 + 0.3 * 80 + 0.12 * 150 + 0.03 * 300) * 2; // a found treasure that is a pouch, x BOOST
const shop = items.filter((x) => x.w === 'shop' && x.cat !== 'food' && x.price > 0).concat([{ n: 'Gene Sniffer', cat: 'tools', price: 1200, bond: 6 }]);
const KIND = [ // the paid-shop items that also sell for coins (docs/design/kind-shop.md)
  ...Array.from({ length: 12 }, (_, i) => ({ n: 'Kind look ' + (i + 1), cat: 'kind', price: 600, bond: 1 })),
  { n: 'Robo Scoop', cat: 'kind', price: 4000, bond: 1 }, { n: 'Garden Sprinkler', cat: 'kind', price: 2500, bond: 1 }, { n: 'Auto Water Bowl', cat: 'kind', price: 2500, bond: 1 }];
const lvl = (p) => { let l = 1; while (l < 10 && p >= BOND_TH[l]) l++; return l; };
// minutes a day and what each player does (real minutes). gd = game days touched per session (a game day = 24 real minutes)
const P = {
  light: { min: 10, gd: 1, walks: 3, ff: 0, tricks: 0, ball: 0, ag: 0, toys: 0, beach: 0, garden: 10, missions: 30, wish: 10, card: 0 },
  regular: { min: 30, gd: 1.25, walks: 6, ff: 80, tricks: 60, ball: 40, ag: 0, toys: 0, beach: 1, garden: 28, missions: 45, wish: 20, card: 17 },
  keen: { min: 90, gd: 3.75, walks: 22, ff: 125, tricks: 400, ball: 40, ag: 40, toys: 30, beach: 3, garden: 37, missions: 45, wish: 20, card: 17 }
};
function run(key, o = {}) {
  const p = P[key]; let coins = 150, bond = 0, walks = 0, owned = [], log = {}, afford = {}, wall = 0, maxWall = 0, done = null, kindDone = null;
  const SINK = o.sink ? [{n:"Plot 7",price:1000,bond:2},{n:"Plot 8",price:2000,bond:3},{n:"Plot 9",price:4000,bond:4},{n:"Town fountain",price:5000,bond:3},{n:"Bandstand",price:10000,bond:5},{n:"Sakura avenue",price:15000,bond:7},{n:"Lighthouse festival",price:25000,bond:9}] : []; const wantList = shop.concat(o.kind ? KIND : []).concat(SINK).sort((a, b) => a.price - b.price);
  let earnedTotal = 0;
  for (let d = 1; d <= 365; d++) {
    const L = lvl(bond);
    // walk pay: pouches replace treasure items as a route's treasures run out (about 120 walks to own most of them)
    let wc = 0; for (let i = 0; i < p.walks; i++) { const share = Math.min(1, walks / 120); let pay = WALK + share * POUCH; if (o.curve && i >= 5) pay *= 0.5; if (o.boost) pay *= 1.2; wc += pay; walks++; }
    if (o.boost && o.cap) wc = Math.min(wc, p.walks * (WALK + Math.min(1, walks / 120) * POUCH) + o.cap);
    const gd = o.realDay ? 1 : p.gd; const care = 60 * gd, passive = 10.5 + 7.7; // mailbox gift, calendar + daily gift
    const gated = (L >= 2 ? p.garden : 0) + (L >= 2 ? p.ff : Math.min(p.ff, 20)) + (L >= 3 ? (o.realDay ? Math.min(p.tricks, 130) : p.tricks) : 0) + p.ball + (L >= 3 ? p.ag : 0) + p.toys + (o.realDay ? Math.min(p.beach, 1) : p.beach) * 17 * (L >= 8 ? 1 : 0);
    const weekly = d % 7 === 6 ? (L >= 2 ? 40 : 0) * (key === 'light' ? 0 : 1) : 0, photo = d % 7 === 0 && key !== 'light' ? 26 : 0;
    const coat = 0; // coat milestones left out (100 / 300 / 800 once)
    const earn = wc + care + passive + p.missions + p.wish + p.card + gated + weekly + photo;
    const food = p.min * 1.0 + (key === 'light' ? 0 : 20); // kibble for the hunger drop + a treat or two
    coins += earn - food; earnedTotal += earn;
    bond += p.walks * 60 + (key === 'light' ? 30 : key === 'regular' ? 120 : 400);
    const L2 = lvl(bond);
    // buy: cheapest first among unlocked things not owned
    let bought = 0;
    for (const it of wantList) { if (owned.includes(it.n) || (it.bond || 1) > L2) continue; if (coins >= it.price) { coins -= it.price; owned.push(it.n); bought++; if (it.price >= 1200) afford[it.n] = d; } }
    const left = wantList.filter((it) => !owned.includes(it.n));
    const unlockedLeft = left.filter((it) => (it.bond || 1) <= L2);
    if (unlockedLeft.length && !bought) { wall++; maxWall = Math.max(maxWall, wall); } else wall = 0;
    if (!left.length && !done) done = d;
    if (d <= 90) log[d] = { earned: Math.round(earnedTotal), perDay: Math.round(earn), bank: Math.round(coins), owned: owned.length, of: wantList.length, bond: L2, spentShare: Math.round(100 * (wantList.filter((x) => owned.includes(x.n)).reduce((s, x) => s + x.price, 0)) / wantList.reduce((s, x) => s + x.price, 0)) };
  }
  return { key, log, afford, done, maxWall, total: wantList.reduce((s, x) => s + x.price, 0) };
}
const out = {};
for (const k of Object.keys(P)) for (const [name, o] of [["base", {}], ["rec1", { curve: true, realDay: true }], ["rec12", { curve: true, realDay: true, kind: true, sink: true }]]) {
  const r = run(k, o); out[k + '_' + name] = r;
  const L = r.log; console.log(k.padEnd(8), name.padEnd(9), 'd1', JSON.stringify(L[1]), '\n   d7', JSON.stringify(L[7]), 'd30', JSON.stringify(L[30]), 'd90', JSON.stringify(L[90]), '\n   all bought day', r.done, 'longest wall', r.maxWall, 'big buys', JSON.stringify(r.afford));
}
require('fs').writeFileSync(__dirname + '/sim_out.json', JSON.stringify(out));
