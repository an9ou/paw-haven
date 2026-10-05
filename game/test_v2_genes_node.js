// v2 GENES lane test (plain node). Run: node game/test_v2_genes_node.js   (exits 1 on any failure)
'use strict';
const path = require('path');
const G = require(path.join(__dirname, '..', 'mods', 'genes.js'));
const S = G.STARTER_GENES;

let pass = 0, fail = 0;
function ok(c, msg) { if (c) pass++; else { fail++; console.log('FAIL:', msg); } }
function near(x, want, tol, msg) { ok(Math.abs(x - want) <= tol, `${msg}: got ${x}, want ${want} ±${tol}`); }
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NAMED = G.BREEDS.filter((k) => k !== 'mutt');
const BANNED = /nintendo|nintendogs|pok[eé]mon|animal crossing/i;

/* 1. MIXES: all 45 pairs resolve */
ok(Object.keys(G.MIXES).length === 45, `45 MIXES entries (got ${Object.keys(G.MIXES).length})`);
const names = new Set();
let pairs = 0;
for (let i = 0; i < G.BREEDS.length; i++) for (let j = i + 1; j < G.BREEDS.length; j++) {
  const a = G.BREEDS[i], b = G.BREEDS[j], m = G.MIXES[G.mixKey(a, b)];
  pairs++;
  ok(m && typeof m.name === 'string' && m.name.length > 1, `mix ${a}x${b} has a name`);
  if (!m) continue;
  ok(G.mixKey(a, b) === G.mixKey(b, a), `mixKey symmetric ${a}/${b}`);
  ok(m.head === a || m.head === b, `mix ${a}x${b} head ${m.head} is a parent`);
  ok(!BANNED.test(m.name), `mix name ${m.name} clean`);
  if (a !== 'mutt' && b !== 'mutt') { ok(!names.has(m.name), `unique mix name ${m.name}`); names.add(m.name); }
  else ok(m.name === 'Mutt mix', `${a}x${b} is Mutt mix`);
  for (const [dam, sire] of [[a, b], [b, a]]) {
    for (let s = 0; s < 40; s++) {
      const r = G.mixOf(dam, sire, seeded(s * 7 + i * 100 + j));
      ok(r && r.a === dam && r.b === sire && r.name === m.name, `mixOf ${dam}x${sire} shape`);
      if (!r) break;
      if (dam === 'mutt' || sire === 'mutt') {
        ok(r.body === 'mutt', `mutt mix body mutt (${dam}x${sire})`);
        ok(r.head === 'mutt' || r.head === (dam === 'mutt' ? sire : dam), `mutt mix head (${dam}x${sire})`);
      } else {
        ok(r.body === dam || r.body === sire, `mixOf body is a parent ${dam}x${sire}`);
        ok((r.head === dam || r.head === sire) && r.head !== r.body, `mixOf head is the other parent when needed ${dam}x${sire} body ${r.body} head ${r.head}`);
        ok(r.head === m.head || r.body === m.head, `mixOf uses the table head ${dam}x${sire}`);
      }
    }
  }
}
ok(pairs === 45, '45 pairs walked');
// examples from the brief
const want = { 'beagle|pug': 'Puggle', 'chihuahua|dachs': 'Chiweenie', 'golden|husky': 'Goberian', 'corgi|husky': 'Horgi', 'chihuahua|pug': 'Chug', 'corgi|dachs': 'Dorgi', 'shiba|corgi': 'Shorgi', 'golden|beagle': 'Beago', 'greyhound|beagle': 'Greagle' };
for (const k of Object.keys(want)) { const [a, b] = k.split('|'); ok(G.MIXES[G.mixKey(a, b)].name === want[k], `${k} = ${want[k]} (got ${G.MIXES[G.mixKey(a, b)].name})`); }
ok(G.MIXES[G.mixKey('corgi', 'husky')].head === 'husky', 'Horgi: husky head');
// same breed -> null (purebred); unknown key counts as mutt
G.BREEDS.forEach((k) => ok(G.mixOf(k, k, seeded(1)) === null, `same breed ${k} -> null`));
ok(G.mixOf('wolfy', 'corgi', seeded(2)).body === 'mutt', 'unknown key -> mutt');
// 50/50 splits and determinism
{
  let bodyDam = 0, muttHead = 0; const N = 4000, R = seeded(99);
  for (let i = 0; i < N; i++) { if (G.mixOf('corgi', 'pug', R).body === 'corgi') bodyDam++; if (G.mixOf('mutt', 'beagle', R).head === 'beagle') muttHead++; }
  near(bodyDam / N, 0.5, 0.03, 'body 50/50 by rng');
  near(muttHead / N, 0.5, 0.03, 'mutt head = other breed 50%');
  ok(JSON.stringify(G.mixOf('husky', 'shiba', seeded(5))) === JSON.stringify(G.mixOf('husky', 'shiba', seeded(5))), 'mixOf deterministic with injected rng');
}

/* 2. predict */
const sum = (rows) => rows.reduce((s, r) => s + r.pct, 0);
const pctWhere = (rows, f) => rows.filter(f).reduce((s, r) => s + r.pct, 0);
{
  const R = seeded(7);
  for (let i = 0; i < 300; i++) {
    const ka = G.BREEDS[i % 10], kb = G.BREEDS[(i * 3 + 1) % 10];
    const ga = G.randomGenotype(ka, R), gb = G.randomGenotype(kb, R);
    const rows = G.predict(ga, gb, ka, kb);
    near(sum(rows), 100, 1e-6, `predict sums to 100 (${ka}x${kb} #${i})`);
    ok(rows.every((r, j) => j === 0 || rows[j - 1].pct >= r.pct), 'predict sorted by pct');
    ok(rows.every((r) => ['brown', 'amber', 'blue', 'odd'].includes(r.eyes) && typeof r.odds === 'string'), 'predict row shape');
    near(sum(G.predict(ga, gb, ka, kb, { byCoat: true })), 100, 1e-6, 'byCoat sums to 100');
  }
}
// teaching examples (V2_GENES.md)
{
  const mp = G.predict(S.shiba, S.mutt, 'shiba', 'mutt');
  const lil = pctWhere(mp, (r) => /Lilac/.test(r.coat));
  near(lil, 100 / 32, 1e-9, 'Mochi x Pepper lilac = 1/32');
  console.log(`  Mochi x Pepper: lilac ${lil}% (${mp.find((r) => /Lilac/.test(r.coat)).odds}), rows ${mp.length}`);
  const mpShiba = G.predict(S.shiba, S.mutt, 'shiba', 'mutt', { body: 'shiba' });
  near(pctWhere(mpShiba, (r) => /^Lilac/.test(r.coat)), 100 / 32, 1e-9, 'Mochi x Pepper lilac 1/32 with a shiba body');
  const bf = G.predict(S.corgi, S.husky, 'corgi', 'husky');
  const pie = pctWhere(bf, (r) => /piebald/.test(r.coat));
  near(pie, 25, 1e-9, 'Biscuit x Frost piebald = 1/4');
  console.log(`  Biscuit x Frost: piebald ${pie}%, rows ${bf.length}`);
  // eye split: husky Bl/Bl x corgi bl/bl -> all Bl/bl -> 75% blue / 25% odd
  near(pctWhere(bf, (r) => r.eyes === 'odd'), 25, 1e-9, 'Biscuit x Frost odd eyes 1/4');
  // names match phenotype for the body breed
  const coats = new Set(bf.map((r) => r.coat));
  ok(coats.has('Red and white') && coats.has('Red & white piebald'), 'corgi-body names');
}
// double merle block: M/m x M/m -> M/M removed, rest renormalised
{
  const mer = { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] };
  const rows = G.predict(mer, mer, 'dachs', 'dachs');
  near(sum(rows), 100, 1e-9, 'merle x merle sums to 100');
  near(pctWhere(rows, (r) => /dapple/.test(r.coat)), 200 / 3, 1e-9, 'merle x merle: 2/3 dapple after removing M/M');
  ok(G.predict({ ...mer, M: ['M', 'M'] }, { ...mer, M: ['M', 'M'] }, 'dachs', 'dachs').length === 0, 'all-M/M -> []');
}
// predict agrees with inherit + phenotype (Monte Carlo, re-rolling M/M)
{
  const ga = { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['M', 'm'], Bl: ['Bl', 'bl'] };
  const gb = { B: ['b', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['sp', 'sp'], M: ['M', 'm'], Bl: ['bl', 'bl'] };
  const rows = G.predict(ga, gb, 'chihuahua', 'beagle', { byCoat: true }), R = seeded(3), N = 60000, cnt = {};
  for (let i = 0; i < N; i++) { let g; do g = G.inherit(ga, gb, R); while (g.M[0] === 'M' && g.M[1] === 'M'); const n = G.phenotype(g, 'chihuahua').coatName; cnt[n] = (cnt[n] || 0) + 1; }
  let worst = 0;
  rows.forEach((r) => { worst = Math.max(worst, Math.abs((cnt[r.coat] || 0) / N * 100 - r.pct)); });
  ok(Object.keys(cnt).every((n) => rows.some((r) => r.coat === n)), 'every simulated coat is predicted');
  ok(worst < 0.8, `predict vs simulation max diff ${worst.toFixed(3)} pts`);
}
// body naming rule: mutt parent -> mutt body names
ok(G.predict(S.shiba, S.mutt, 'shiba', 'mutt').every((r) => !/urajiro/.test(r.coat)), 'mutt parent -> mutt body names');

/* 3. coatCatalog */
function independentNames(k) { // brute force every allele pair allowed by FREQ (written separately from the module)
  const f = G.FREQ[k], opts = (rec, dom, p) => (p <= 0 ? [[dom, dom]] : p >= 1 ? [[rec, rec]] : [[dom, dom], [dom, rec], [rec, rec]]);
  const L = [['B', opts('b', 'B', f.b)], ['D', opts('d', 'D', f.d)], ['E', opts('e', 'E', f.e)], ['S', opts('sp', 'S', f.sp)], ['M', f.M > 0 ? [['m', 'm'], ['M', 'm']] : [['m', 'm']]], ['Bl', opts('bl', 'Bl', 1 - f.Bl)]];
  const out = new Set();
  (function rec(i, g) { if (i === L.length) { out.add(G.phenotype(g, k).coatName); return; } for (const p of L[i][1]) { g[L[i][0]] = p; rec(i + 1, g); } })(0, {});
  return out;
}
let total = 0;
const sizes = [];
for (const k of G.BREEDS) {
  const cat = G.coatCatalog(k), set = new Set(cat.map((c) => c.coat));
  total += cat.length; sizes.push(`${k} ${cat.length}`);
  ok(set.size === cat.length, `${k} catalog has no duplicates`);
  ok(cat.every((c) => typeof c.how === 'string' && c.how.length > 5 && c.how.length < 200 && typeof c.rare === 'boolean'), `${k} catalog entry shape`);
  ok(cat.every((c) => !BANNED.test(c.how)), `${k} hints clean`);
  const starter = G.phenotype(S[k], k).coatName;
  ok(set.has(starter), `${k} starter coat ${starter} in catalog`);
  ok(!cat.find((c) => c.coat === starter).rare, `${k} starter coat not rare`);
  // every coat seen over 20k random genotypes is in the catalog
  const R = seeded(1000 + G.BREEDS.indexOf(k)), seen = new Set();
  for (let i = 0; i < 20000; i++) seen.add(G.phenotype(G.randomGenotype(k, R), k, 'pup' + i).coatName);
  const missing = [...seen].filter((n) => !set.has(n));
  ok(missing.length === 0, `${k} catalog covers all 20k random coats (missing: ${missing.join(', ')})`);
  // every catalog entry is reachable: equals the independent brute-force set of coats randomGenotype can produce
  const ind = independentNames(k);
  const extra = [...set].filter((n) => !ind.has(n)), lack = [...ind].filter((n) => !set.has(n));
  ok(extra.length === 0 && lack.length === 0, `${k} catalog = reachable set (extra: ${extra.join(', ')}; lacking: ${lack.join(', ')})`);
  console.log(`  ${k.padEnd(9)} catalog ${String(cat.length).padStart(2)} (rare ${cat.filter((c) => c.rare).length}), seen in 20k: ${seen.size}`);
}
ok(G.coatCatalog('pug').every((c) => !/merle|piebald/.test(c.coat)), 'pug: no merle or piebald');
ok(G.coatCatalog('golden').every((c) => /Golden|Cream/.test(c.coat)), 'golden: golden or cream only');
ok(G.coatCatalog('husky').every((c) => !/merle/.test(c.coat)), 'husky: no merle');
ok(G.coatCatalog('dachs').some((c) => /dapple/.test(c.coat)), 'dachs: dapples');
{ const c = G.coatCatalog('mutt'); c[0].coat = 'x'; ok(G.coatCatalog('mutt')[0].coat !== 'x', 'coatCatalog returns copies'); }
ok(G.coatCatalog('mutt').find((c) => c.coat === 'Lilac').rare, 'lilac is rare');
console.log(`  catalog total ${total}`);

/* 4. describe */
{
  const d = G.describe(S.shiba);
  ok(d.lines.length === 6 && d.lines[0] === 'B/b: black pigment (nose and eye rims), carries liver', 'Mochi B line');
  ok(JSON.stringify(d.carriers) === '["liver","dilute"]', `Mochi carriers ${d.carriers}`);
  ok(/chocolate or blue/.test(d.summary), 'Mochi summary');
  ok(G.describe(S.mutt).lines[0] === 'B/b: black coat, carries liver', 'Pepper B line (dark coat wording)');
  ok(JSON.stringify(G.describe(S.husky).carriers) === '["dilute","red","piebald"]', 'Frost carriers');
  ok(G.describe(S.dachs).carriers.length === 0, 'Noodle carries nothing');
  ok(G.describe({ B: ['b', 'B'], D: ['d', 'D'], E: ['e', 'E'], S: ['sp', 'S'], M: ['m', 'M'], Bl: ['bl', 'Bl'] }).lines.every((l) => /^(B\/b|D\/d|E\/e|S\/sp|M\/m|Bl\/bl):/.test(l)), 'describe puts the dominant allele first');
  ok(G.describe({ ...S.shiba, M: ['M', 'm'] }).carriers.includes('merle'), 'hidden merle on red is a carrier');
  ok(G.describe({ pup: 1, genes: S.corgi }).carriers[0] === 'piebald', 'describe accepts a dog object');
}

/* 5. old API unchanged for starters */
ok(G.phenotype(S.shiba, 'shiba').coatName === 'Red with cream urajiro', 'phenotype unchanged');

console.log(`\nCatalog sizes: ${sizes.join(', ')}`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
