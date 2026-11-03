const d = require('./tables.json');
const dec = Object.entries(d.HM_DECOR).map(([n, v]) => Object.assign({ n }, v));
const all = [];
const add = (cat, arr) => arr.forEach((x) => all.push(Object.assign({ cat }, x)));
add('food', d.FOOD); add('toys', d.TOYS); add('clothes', d.CLOTHES); add('houses', d.HOUSES); add('beds', d.BEDS); add('decor', dec);
const where = (x) => x.reward || !x.price && x.price !== undefined && x.cat !== 'food' ? 'reward/free' : x.tokyo ? 'tokyo' : x.ed ? 'hw2026' : x.fm ? 'market' : x.fest ? 'festival' : 'shop';
all.forEach((x) => { x.w = where(x); if (x.price === undefined) x.w = 'noprice'; });
const st = (a) => { const p = a.map((x) => x.price).sort((x, y) => x - y); if (!p.length) return null; return { n: p.length, min: p[0], med: p[Math.floor((p.length - 1) / 2)], max: p.at(-1), sum: p.reduce((s, v) => s + v, 0) }; };
const out = {};
for (const w of ['shop', 'festival', 'hw2026', 'market', 'tokyo', 'reward/free', 'noprice']) for (const c of ['food', 'toys', 'clothes', 'houses', 'beds', 'decor']) { const s = st(all.filter((x) => x.w === w && x.cat === c && x.price > 0)); const z = all.filter((x) => x.w === w && x.cat === c && !(x.price > 0)).length; if (s || z) { out[w + '/' + c] = s; console.log(w.padEnd(12), c.padEnd(8), JSON.stringify(s), z ? 'free:' + z : ''); } }
// bond gate for shop items
for (const c of ['toys', 'clothes', 'houses', 'beds', 'decor']) { const by = {}; all.filter((x) => x.w === 'shop' && x.cat === c && x.price > 0).forEach((x) => { const b = x.bond || 1; by[b] = (by[b] || 0) + x.price; }); console.log('bond-gated cost', c, JSON.stringify(by)); }
console.log('top 15 shop items', JSON.stringify(all.filter((x) => x.w === 'shop' && x.cat !== 'food').sort((a, b) => b.price - a.price).slice(0, 15).map((x) => [x.n, x.cat, x.price, x.bond])));
console.log('food shop', JSON.stringify(all.filter((x) => x.cat === 'food' && x.w === 'shop').map((x) => [x.n, x.price, x.hunger])));
console.log('market items price', JSON.stringify(all.filter((x) => x.w === 'market').map((x) => [x.n, x.price]).slice(0, 80)));
console.log('noprice', all.filter((x) => x.w === 'noprice').map((x) => x.n).join(', '));
console.log('rewards', all.filter((x) => x.w === 'reward/free').map((x) => x.n + ':' + x.cat).join(', '));
require('fs').writeFileSync('items.json', JSON.stringify(all.map((x) => ({ n: x.n, cat: x.cat, w: x.w, price: x.price, bond: x.bond || 1, fest: x.fest || '', ed: x.ed || 0 }))));
