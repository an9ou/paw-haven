// v2.1 GENES lane test (plain node). Run: node game/test_v21_genes_node.js   (exits 1 on any failure)
// Covers V21.md section 3: ancestry, grandMix, sparkleOdds, coatCatalog(k, { all: true }).
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const G = require(path.join(__dirname, '..', 'mods', 'genes.js'));

let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; console.log('ok   ' + msg); } else { fail++; console.log('FAIL ' + msg); } }
function eq(got, want, msg) { const g = JSON.stringify(got), w = JSON.stringify(want); ok(g === w, g === w ? msg : `${msg}: got ${g}, want ${w}`); }
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const sortObj = (o) => { const r = {}; Object.keys(o).sort().forEach((k) => { r[k] = o[k]; }); return r; };

/* 0. exports */
['ancestry', 'grandMix', 'sparkleOdds', 'coatCatalog', 'fracText'].forEach((n) => ok(typeof G[n] === 'function', `PawGenes.${n} is exported`));

/* 1. ancestry of a crafted 3-generation tree */
{
  const dogs = {
    g1: { id: 'g1', key: 'corgi' },                          // grandparents (generation 0)
    g2: { id: 'g2', key: 'husky' },
    g3: { id: 'g3', key: 'dachs', mix: { a: 'dachs', b: 'shiba' } },
    g4: { id: 'g4', key: 'golden' },
    p1: { id: 'p1', key: 'corgi', mix: { a: 'corgi', b: 'husky' }, parents: ['g1', 'g2'] },
    p2: { id: 'p2', key: 'dachs', mix: { a: 'dachs', b: 'golden' }, parents: { dam: 'g3', sire: 'g4' } },
    kid: { id: 'kid', key: 'corgi', parents: ['p1', 'p2'] }
  };
  let calls = 0;
  const look = (id) => { calls++; return dogs[id] || null; };
  eq(sortObj(G.ancestry(dogs.p1, look)), { corgi: 0.5, husky: 0.5 }, 'ancestry: parent of two purebreds is 1/2 + 1/2');
  eq(sortObj(G.ancestry(dogs.p2, look)), { dachs: 0.25, golden: 0.5, shiba: 0.25 }, 'ancestry: founder mix {a, b} counts 1/2 + 1/2');
  const kid = G.ancestry(dogs.kid, look);
  eq(sortObj(kid), { corgi: 0.25, dachs: 0.125, golden: 0.25, husky: 0.25, shiba: 0.125 }, 'ancestry: 3-generation tree');
  ok(Math.abs(Object.values(kid).reduce((s, x) => s + x, 0) - 1) < 1e-12, 'ancestry: fractions sum to 1');
  ok(Object.values(kid).every((x) => Number.isInteger(x * 64)), 'ancestry: fractions are multiples of 1/64');
  eq(sortObj(G.ancestry(dogs.kid, look, 1)), { corgi: 0.25, dachs: 0.25, golden: 0.25, husky: 0.25 }, 'ancestry: depth 1 cuts the parents to their mix');
  eq(G.ancestry(dogs.kid, look, 0), { corgi: 1 }, 'ancestry: depth 0 is the base case');
  const ownAnc = { pug: 0.75, beagle: 0.25 };
  ok(G.ancestry({ id: 'x', key: 'pug', anc: ownAnc, parents: ['p1', 'p2'] }, look) === ownAnc, 'ancestry: rec.anc is returned unchanged');
  const withAnc = Object.assign({}, dogs, { p2: Object.assign({}, dogs.p2, { anc: { beagle: 1 } }) });
  eq(sortObj(G.ancestry(withAnc.kid, (id) => withAnc[id])), { beagle: 0.5, corgi: 0.25, husky: 0.25 }, 'ancestry: a parent\'s anc is honoured');
  eq(G.ancestry({ id: 'u', key: 'wolfy' }, look), { mutt: 1 }, 'ancestry: unknown key counts as mutt');
  eq(sortObj(G.ancestry({ id: 'u2', key: 'x', mix: { a: 'corgi', b: 'wolf' } }, look)), { corgi: 0.5, mutt: 0.5 }, 'ancestry: unknown mix key counts as mutt');
  eq(G.ancestry({ id: 'o', key: 'shiba', parents: ['g1', 'nobody'] }, look), { shiba: 1 }, 'ancestry: one missing parent falls back to the base case');
  eq(G.ancestry({ id: 'n', key: 'pug' }), { pug: 1 }, 'ancestry: works without a lookup');
  ok(G.ancestry(null, look) === null, 'ancestry: null rec gives null');
  // Memoised: a deep inbred-looking chain (same ancestors on both sides) stays fast and stable.
  const chain = { a0: { id: 'a0', key: 'corgi' }, b0: { id: 'b0', key: 'husky' } };
  for (let i = 1; i <= 30; i++) { chain['a' + i] = { id: 'a' + i, key: 'corgi', parents: ['a' + (i - 1), 'b' + (i - 1)] }; chain['b' + i] = { id: 'b' + i, key: 'husky', parents: ['b' + (i - 1), 'a' + (i - 1)] }; }
  calls = 0;
  const deep = G.ancestry(chain.a30, (id) => { calls++; return chain[id]; }, 30);
  eq(deep, { corgi: 0.5, husky: 0.5 }, 'ancestry: deep shared tree');
  ok(calls < 200, `ancestry: memoised by id (${calls} lookups for 30 generations)`);
  // cycles never hang
  const loop = { c1: { id: 'c1', key: 'pug', parents: ['c2', 'c2'] }, c2: { id: 'c2', key: 'beagle', parents: ['c1', 'c1'] } };
  const lr = G.ancestry(loop.c1, (id) => loop[id], 50);
  ok(lr && Math.abs(Object.values(lr).reduce((s, x) => s + x, 0) - 1) < 1e-12, 'ancestry: a cyclic tree still returns');
  // 1/64 rounding: depth 6 with a 1/128 share rounds away cleanly
  const odd = { r: { id: 'r', key: 'shiba' } };
  let prev = 'r';
  for (let i = 1; i <= 7; i++) { odd['m' + i] = { id: 'm' + i, key: 'golden' }; odd['s' + i] = { id: 's' + i, key: 'golden', parents: [prev, 'm' + i] }; prev = 's' + i; }
  const ro = G.ancestry(odd.s7, (id) => odd[id], 10);
  ok(Object.values(ro).every((x) => Number.isInteger(x * 64)) && Math.abs(Object.values(ro).reduce((s, x) => s + x, 0) - 1) < 1e-12, `ancestry: a 1/128 share is rounded to 1/64 and still sums to 1 (${JSON.stringify(ro)})`);
}

/* 2. grandMix rules and precedence */
{
  const gm = G.grandMix;
  let r = gm({ corgi: 0.25, husky: 0.25, dachs: 0.25, shiba: 0.25 });
  ok(r.kind === 'everything' && r.name === 'The Everything Dog' && r.label === 'The Everything Dog: yes.', 'grandMix rule 1: 25/25/25/25 is the Everything Dog (beats rule 2)');
  r = gm({ corgi: 0.5, husky: 0.125, dachs: 0.125, shiba: 0.125, pug: 0.125 });
  ok(r.kind === 'everything', 'grandMix rule 1: 4 breeds at 1/8 or more');
  r = gm({ corgi: 0.625, husky: 0.125, dachs: 0.125, shiba: 0.0625, pug: 0.0625 });
  ok(r.kind !== 'everything', 'grandMix rule 1: only 3 breeds at 1/8 is not Everything');
  r = gm({ corgi: 0.375, husky: 0.25, dachs: 0.25, shiba: 0.0625, pug: 0.0625 });
  ok(r.kind === 'grand' && r.name === 'Sled Noodle' && r.label === 'Sled Noodle: Corgi + Husky + Dachshund', `grandMix rule 2: Sled Noodle (${r.label})`);
  r = gm({ dachs: 0.5, husky: 0.25, corgi: 0.25 });
  ok(r.kind === 'grand' && r.label === 'Sled Noodle: Corgi + Husky + Dachshund', 'grandMix rule 2: recipe order is fixed, whatever the shares');
  r = gm({ shiba: 0.25, corgi: 0.25, golden: 0.5 });
  ok(r.kind === 'grand' && r.name === 'Sunrise Loaf' && r.label === 'Sunrise Loaf: Shiba + Corgi + Golden', `grandMix rule 2: Sunrise Loaf (${r.label})`);
  r = gm({ golden: 0.25, husky: 0.375, mutt: 0.375 });
  ok(r.kind === 'grand' && r.name === 'Snowdrift' && r.label === 'Snowdrift: Golden + Husky + Mutt', `grandMix rule 2: Snowdrift (${r.label})`);
  r = gm({ golden: 0.25, husky: 0.25, wolfy: 0.5 });
  ok(r.kind === 'grand' && r.name === 'Snowdrift', 'grandMix: unknown keys count as Mutt');
  r = gm({ pug: 0.5, beagle: 0.25, greyhound: 0.25 });
  ok(r.kind === 'family' && r.name === 'Pug family mix' && r.label === 'Pug family mix', `grandMix rule 2: unnamed 3-breed mix is a family mix (${r.label})`);
  r = gm({ corgi: 0.75, husky: 0.25 });
  ok(r.kind === 'breed' && r.name === 'Corgi' && r.label === 'Corgi, 1/4 Husky', `grandMix rule 3: 75% label (${r.label})`);
  r = gm({ corgi: 0.75, husky: 0.125, pug: 0.125 });
  ok(r.kind === 'breed' && r.label === 'Corgi, 1/8 Husky, 1/8 Pug', `grandMix rule 3: several rest breeds (${r.label})`);
  r = gm({ dachs: 0.8125, golden: 0.1875 });
  ok(r.label === 'Dachshund, 3/16 Golden', `grandMix rule 3: simple fractions (${r.label})`);
  r = gm({ shiba: 1 });
  ok(r.kind === 'breed' && r.label === 'Shiba', 'grandMix rule 3: a purebred is just its name');
  r = gm({ husky: 0.5, corgi: 0.5 });
  ok(r.kind === 'mix' && r.name === 'Horgi' && r.label === 'Horgi: Corgi × Husky', `grandMix rule 4: two-breed mix (${r.label})`);
  r = gm({ husky: 0.625, corgi: 0.375 });
  ok(r.kind === 'mix' && r.label === 'Horgi: Husky × Corgi', `grandMix rule 4: bigger share first (${r.label})`);
  r = gm({ husky: 0.5, corgi: 0.25, pug: 0.125, beagle: 0.125 });
  ok(r.kind === 'everything', 'grandMix: rule 1 beats rule 4');
  r = gm({ pug: 0.5, beagle: 0.25, golden: 0.125, shiba: 0.0625, corgi: 0.0625 });
  ok(r.kind === 'mix' && r.name === 'Puggle', 'grandMix rule 4: two big breeds plus small ones');
  r = gm({ pug: 0.625, beagle: 0.1875, golden: 0.125, corgi: 0.0625 });
  ok(r.kind === 'family' && r.label === 'Pug family mix', `grandMix rule 5: anything else (${r.label})`);
  r = gm({ corgi: 0.5, husky: 0.5 });
  ok(Array.isArray(r.breeds) && r.breeds.length === 2 && r.breeds[0][0] === 'corgi' && r.breeds[0][1] === 0.5, 'grandMix: breeds sorted by share, ties in BREEDS order');
  r = gm({ husky: 0.25, dachs: 0.5, corgi: 0.25 });
  eq(r.breeds.map((b) => b[0]), ['dachs', 'corgi', 'husky'], 'grandMix: breeds sorted by share');
  ok(gm({}).name === 'Mutt' && gm(null).kind === 'breed', 'grandMix: empty anc counts as a Mutt');
}

/* 3. sparkleOdds */
{
  const so = G.sparkleOdds;
  let r = so({});
  ok(r.p === 1 / 512 && r.mult === 1 && r.parts.length === 0 && r.text === '1 in 512', `sparkleOdds: no boosts is 1 in 512 (${r.text})`);
  r = so({ stone: true });
  ok(r.p === 1 / 128 && r.mult === 4 && r.text === '1 in 128 today: Sparkle Stone ×4', `sparkleOdds: Stone ×4 = 1/128 (${r.text})`);
  r = so({ stone: true, bondA: 10, bondB: 10 });
  ok(r.p === 1 / 64 && r.text === '1 in 64 today: Sparkle Stone ×4, Bond 10 ×2', `sparkleOdds: Stone + Bond 10 = 1/64 (${r.text})`);
  r = so({ stone: true, sparkleParents: 2, bondA: 10, bondB: { level: 10 } });
  ok(Math.abs(1 / r.p - 28.444) < 0.01 && r.mult === 18 && /^1 in 28 today: /.test(r.text), `sparkleOdds: all boosts = 1/28.4 (${r.text})`);
  ok(r.parts.reduce((m, q) => m * q.x, 1) === r.mult, 'sparkleOdds: parts multiply to mult');
  r = so({ sparkleParents: 1 });
  ok(r.mult === 1.5 && r.text === '1 in 341 today: Sparkle parent ×1.5', `sparkleOdds: one Sparkle parent ×1.5 (${r.text})`);
  r = so({ bondA: 9, bondB: 8 });
  ok(r.mult === 1.5 && /Bond 8\+ ×1\.5/.test(r.text), `sparkleOdds: both Bond 8+ ×1.5 (${r.text})`);
  r = so({ bondA: 10, bondB: 7 });
  ok(r.mult === 1, 'sparkleOdds: one parent at Bond 10 is no boost');
  r = so({ bondA: 10, bondB: 10, sparkleParents: 1 });
  ok(r.mult === 3 && r.parts.length === 2, 'sparkleOdds: boosts multiply');
  r = so({ base: 1 / 100, stone: true });
  ok(r.p === 0.04 && r.text === '1 in 25 today: Sparkle Stone ×4', 'sparkleOdds: custom base');
}

/* 4. coatCatalog(k, { all: true }) */
{
  // the default call is byte-identical to the v2 one (checked against the v2.0 file in git when available)
  let v2 = null;
  try {
    const src = execFileSync('git', ['show', 'c7e4d73:mods/genes.js'], { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const m = { exports: {} };
    new Function('module', 'exports', 'globalThis', src)(m, m.exports, {});
    v2 = m.exports;
  } catch (e) { v2 = null; }
  G.BREEDS.forEach((k) => {
    const base = G.coatCatalog(k), all = G.coatCatalog(k, { all: true });
    if (v2 && v2.BREEDS.includes(k)) ok(JSON.stringify(base) === JSON.stringify(v2.coatCatalog(k)), `coatCatalog(${k}): default call identical to v2.0`); // v2.5: the four new breeds have no v2.0 catalogue
    ok(JSON.stringify(G.coatCatalog(k, {})) === JSON.stringify(base) && base.every((e) => !('extra' in e)), `coatCatalog(${k}): no-option and {} calls carry no extra flags`);
    ok(JSON.stringify(all.slice(0, base.length)) === JSON.stringify(base), `coatCatalog(${k}, all): starts with the default catalog (superset)`);
    const extra = all.slice(base.length);
    ok(extra.every((e) => e.extra === true && e.rare === true && /^Only from a mix parent/.test(e.how)), `coatCatalog(${k}, all): ${extra.length} extra coats flagged extra with a how hint`);
    ok(new Set(all.map((e) => e.coat)).size === all.length, `coatCatalog(${k}, all): no duplicate coats`);
    // phenotype over 20k random any-breed genotypes
    const names = new Set(all.map((e) => e.coat)), R = seeded(1000 + G.BREEDS.indexOf(k));
    const missing = new Set();
    for (let i = 0; i < 20000; i++) {
      const pa = G.randomGenotype(G.BREEDS[Math.floor(R() * G.BREEDS.length)], R);
      const pb = G.randomGenotype(G.BREEDS[Math.floor(R() * G.BREEDS.length)], R);
      const g = i % 2 ? pa : G.inherit(pa, G.isDoubleMerle(pa, pb) ? Object.assign({}, pb, { M: ['m', 'm'] }) : pb, R);
      const n = G.phenotype(g, k).coatName;
      if (!names.has(n)) missing.add(n);
    }
    ok(missing.size === 0, `coatCatalog(${k}, all): covers phenotype over 20k random any-breed genotypes${missing.size ? ' (missing ' + [...missing].join(' | ') + ')' : ''}`);
  });
  ok(G.coatCatalog('pug', { all: true }).some((e) => e.extra && /merle/i.test(e.coat) && /merle/.test(e.how)), 'coatCatalog(pug, all): a merle pug is possible from a mix parent');
  ok(G.coatCatalog('nope', { all: true }).length === G.coatCatalog('mutt', { all: true }).length, 'coatCatalog: unknown keys count as mutt');
}

/* 5. purity: the v2 exports still behave */
ok(G.phenotype(G.STARTER_GENES.shiba, 'shiba').coatName === 'Red with cream urajiro', 'phenotype unchanged');
ok(G.mixKey('husky', 'corgi') === 'corgi|husky' && G.MIXES['corgi|husky'].name === 'Horgi', 'MIXES unchanged');

/* 6. the v2 node test still passes */
try {
  execFileSync(process.execPath, [path.join(__dirname, 'test_v2_genes_node.js')], { stdio: ['ignore', 'pipe', 'pipe'] });
  ok(true, 'test_v2_genes_node.js still passes');
} catch (e) { ok(false, 'test_v2_genes_node.js still passes: ' + String(e.stdout || '').split('\n').filter((l) => /FAIL/.test(l)).slice(0, 3).join(' / ')); }

console.log(`\n${pass} passed, ${fail} failed`);
if (!fail) console.log("ALL OK");
process.exit(fail ? 1 : 0);
