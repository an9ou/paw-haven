// Node test for mods/genes.js (PawGenes). Run: node mods/genes/test.js
'use strict';
const path = require('path');
const G = require(path.join(__dirname, '..', 'genes.js'));

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('FAIL:', msg); } }
function near(x, target, tol, msg) { ok(Math.abs(x - target) <= tol, `${msg}: got ${x.toFixed(4)}, want ${target.toFixed(4)} ±${tol}`); }
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* 1. Starter phenotypes = current art (dogs/pawart_dogs.js) */
const EXPECT = {
  shiba:  { name: 'Red with cream urajiro', eyes: 'brown', base: '#F7892E', light: '#FFE7B3', white: 0 },
  corgi:  { name: 'Red and white',          eyes: 'brown', base: '#F8A23C', light: '#FFFFFF', white: 0.25 },
  golden: { name: 'Golden',                 eyes: 'brown', base: '#F2B84A', dark: '#D98A22', white: 0 },
  dachs:  { name: 'Chocolate and tan',      eyes: 'amber', base: '#A65A34', light: '#F5B26B', dark: '#6E3315', white: 0 },
  husky:  { name: 'Grey and white',         eyes: 'blue',  base: '#78A2E2', light: '#FFFFFF', white: 0.25 },
  mutt:   { name: 'Black & white piebald',  eyes: 'brown', base: '#1D1A22', light: '#FFFFFF', dark: '#1D1A22', white: 0.6 },
  chihuahua: { name: 'Fawn',                eyes: 'brown', base: '#F0C48C', light: '#FFF1DC', white: 0 },
  pug:       { name: 'Fawn',                eyes: 'brown', base: '#E8C08C', light: '#F6DDB6', dark: '#2B2430', white: 0 },
  greyhound: { name: 'Blue with white markings', eyes: 'brown', base: '#8E9AB0', light: '#FFFFFF', dark: '#6E7A90', white: 0.25 },
  beagle:    { name: 'Tricolour',           eyes: 'brown', base: '#CF8C4C', light: '#FFFFFF', dark: '#2B2430', white: 0.25 },
  // v2.5 breeds (V25.md 6a: the SP art colours)
  poodle:    { name: 'Apricot',             eyes: 'brown', base: '#F2C48F', light: '#FBE2C0', white: 0 },
  collie:    { name: 'Black and white',     eyes: 'brown', base: '#2A2628', light: '#FFFFFF', white: 0.25 },
  samoyed:   { name: 'White',               eyes: 'brown', base: '#FBF6EC', light: '#FFFFFF', dark: '#E8DECB', white: 0 },
  frenchie:  { name: 'Fawn',                eyes: 'brown', base: '#D9B48A', light: '#F0DCC0', dark: '#3A2E2E', white: 0 },
  // v2.11 breeds (V211.md 5.2)
  akita:     { name: 'Red',                 eyes: 'brown', base: '#D46E36', light: '#FFF4E2', dark: '#A44E1E', white: 0 },
  spitz:     { name: 'White',               eyes: 'brown', base: '#FCF8F0', light: '#FFFFFF', dark: '#E6DCCB', white: 0 },
  pom:       { name: 'Orange',              eyes: 'brown', base: '#F59A3C', light: '#FFD9A6', dark: '#C9701E', white: 0 },
  // v2.11 big breeds (second batch)
  afghan:    { name: 'Red',                 eyes: 'brown', base: '#C9783E', light: '#E6A86E', dark: '#3A2E2E', white: 0 },
  dane:      { name: 'Fawn',                eyes: 'brown', base: '#D9A562', light: '#E6BA7E', dark: '#2B2430', white: 0 },
  mastiff:   { name: 'Fawn',                eyes: 'brown', base: '#D8AE72', light: '#E9C994', dark: '#2B2430', white: 0 },
  gsd:       { name: 'Black and tan',       eyes: 'brown', base: '#C98A4A', light: '#E2B278', dark: '#2B2430', white: 0 },
  // v2.12 breeds (V212.md 3): the starter cells the ART lanes draw with
  dobie:     { name: 'Black and rust',      eyes: 'brown', base: '#2B2430', light: '#C0642E', dark: '#1D1A22', white: 0 },
  corso:     { name: 'Black',               eyes: 'brown', base: '#2A2628', light: '#3A3438', dark: '#1D1A22', white: 0 },
  pitbull:   { name: 'Blue',                eyes: 'brown', base: '#7E8A9C', light: '#A8B2C2', dark: '#5A6578', white: 0 },
  minpin:    { name: 'Red',                 eyes: 'brown', base: '#C8562E', light: '#E08A5A', dark: '#94381A', white: 0 },
  lab:       { name: 'Yellow',              eyes: 'brown', base: '#F2D08A', light: '#FBE8BE', dark: '#D9AE5E', white: 0 },
  malamute:  { name: 'Grey and white',      eyes: 'brown', base: '#8E98A8', light: '#FFFFFF', dark: '#5E6672', white: 0 },
  chow:      { name: 'Red',                 eyes: 'brown', base: '#C8743A', light: '#E0A06A', dark: '#94522A', white: 0 },
  stdpoodle: { name: 'Black',               eyes: 'brown', base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22', white: 0 },
  schnauzer: { name: 'Salt and pepper',     eyes: 'brown', base: '#8E8C8A', light: '#D8D4CC', dark: '#3A3638', white: 0 },
  westie:    { name: 'White',               eyes: 'brown', base: '#F8F4EA', light: '#FFFFFF', dark: '#E4DCCB', white: 0 },
  yorkie:    { name: 'Blue and tan',        eyes: 'brown', base: '#5E6E84', light: '#D9A45E', dark: '#3E4A5C', white: 0 },
  bichon:    { name: 'White',               eyes: 'brown', base: '#FAF7F0', light: '#FFFFFF', dark: '#E6DED0', white: 0 },
  maltese:   { name: 'White',               eyes: 'brown', base: '#FCFAF4', light: '#FFFFFF', dark: '#E8E2D6', white: 0 },
  shihtzu:   { name: 'Gold and white',      eyes: 'brown', base: '#E0A65A', light: '#F2CA8E', dark: '#B07A36', white: 0.6 }
};
const V212 = ['dobie', 'corso', 'pitbull', 'minpin', 'lab', 'malamute', 'chow', 'stdpoodle', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'];
ok(Object.keys(EXPECT).length === 35 && G.BREEDS.length === 35, '35 breeds');
ok(G.BREEDS.slice(10, 14).join() === 'poodle,collie,samoyed,frenchie', 'v2.5 keys appended after the first ten');
ok(G.BREEDS.slice(14, 17).join() === 'akita,spitz,pom', 'v2.11 keys appended after the v2.5 ones');
ok(G.BREEDS.slice(17, 21).join() === 'afghan,dane,mastiff,gsd', 'the owner\'s four more appended after pom');
ok(G.BREEDS.slice(21).join() === V212.join(), 'the fourteen v2.12 keys appended at the end of BREEDS, in order');
console.log('Starter phenotypes:');
for (const k of Object.keys(EXPECT)) {
  const p = G.phenotype(G.STARTER_GENES[k], k), e = EXPECT[k];
  console.log(`  ${k.padEnd(9)} ${p.coatName.padEnd(25)} eyes=${p.eyes.padEnd(5)} base=${p.coat.base} light=${p.coat.light} dark=${p.coat.dark} white=${p.coat.white} merle=${p.coat.merle}`);
  ok(p.coatName === e.name, `${k} coatName ${p.coatName}`);
  ok(p.eyes === e.eyes && p.coat.eyes === e.eyes, `${k} eyes ${p.eyes}`);
  ok(p.coat.base === e.base, `${k} base ${p.coat.base}`);
  if (e.light) ok(p.coat.light === e.light, `${k} light ${p.coat.light}`);
  if (e.dark) ok(p.coat.dark === e.dark, `${k} dark ${p.coat.dark}`);
  ok(p.coat.white === e.white, `${k} white ${p.coat.white}`);
  ok(p.coat.merle === false, `${k} merle false`);
  ok(JSON.stringify(Object.keys(p.coat)) === JSON.stringify(['base', 'light', 'dark', 'white', 'merle', 'eyes']), `${k} coat shape`);
}

/* 2. Variants */
const mk = (o) => Object.assign({ B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, o);
ok(G.phenotype(mk({ B: ['b', 'b'], D: ['d', 'd'] }), 'corgi').pigment === 'lilac', 'lilac pigment');
ok(G.phenotype(mk({ B: ['b', 'b'], D: ['d', 'd'] }), 'dachs').coatName === 'Isabella', 'dachshund lilac is Isabella');
ok(G.phenotype(mk({ D: ['d', 'd'] }), 'mutt').coatName === 'Blue', 'blue mutt');
ok(G.phenotype(mk({ E: ['e', 'e'], D: ['d', 'd'] }), 'golden').coatName === 'Cream', 'cream golden');
const merleCorgi = G.phenotype(mk({ M: ['M', 'm'] }), 'corgi', 'd_test1');
ok(merleCorgi.coat.merle === true && merleCorgi.coatName === 'Black merle and white', `merle corgi ${merleCorgi.coatName}`);
ok(G.phenotype(mk({ M: ['M', 'm'], B: ['b', 'b'] }), 'dachs').coatName === 'Chocolate dapple', 'dachshund merle is dapple');
const cryptic = G.phenotype(mk({ M: ['M', 'm'], E: ['e', 'e'] }), 'corgi');
ok(cryptic.coat.merle === false && cryptic.merleHidden === true, 'cryptic merle hidden on e/e');
ok(G.phenotype(mk({ S: ['sp', 'sp'] }), 'shiba').coat.white === 0.6, 'piebald white 0.6');
ok(G.phenotype(mk({ B: ['b', 'b'] }), 'mutt').eyes === 'amber', 'liver gives amber eyes');
ok(G.phenotype(mk({ M: ['M', 'm'] }), 'corgi', 'same-seed').eyes === G.phenotype(mk({ M: ['M', 'm'] }), 'corgi', 'same-seed').eyes, 'eye roll stable per seed');
let oddMerle = 0, blueMerle = 0, oddBl = 0;
for (let i = 0; i < 10000; i++) {
  const e1 = G.phenotype(mk({ M: ['M', 'm'] }), 'mutt', 'dog' + i).eyes; if (e1 === 'odd') oddMerle++; if (e1 === 'blue') blueMerle++;
  if (G.phenotype(mk({ Bl: ['Bl', 'bl'] }), 'husky', 'h' + i).eyes === 'odd') oddBl++;
}
near((oddMerle + blueMerle) / 10000, 0.25, 0.02, 'merle blue-or-odd eye rate');
near(oddBl / 10000, 0.25, 0.02, 'Bl/bl odd-eye rate');

ok(G.phenotype(mk({ E: ['e', 'e'], B: ['b', 'b'] }), 'pug').coatName === 'Apricot', 'pug apricot');
ok(G.phenotype(mk({}), 'pug').coatName === 'Black', 'pug black');
ok(G.phenotype(mk({ E: ['e', 'e'], D: ['d', 'd'] }), 'pug').coatName === 'Silver fawn', 'pug silver fawn');
ok(G.phenotype(mk({ E: ['e', 'e'], B: ['b', 'b'] }), 'greyhound').coatName === 'Red', 'greyhound red');
ok(G.phenotype(mk({ E: ['e', 'e'] }), 'greyhound').coatName === 'Fawn', 'greyhound fawn');
ok(G.phenotype(mk({ S: ['sp', 'sp'] }), 'greyhound').coatName === 'Black & white piebald', 'greyhound white-spotted');
ok(G.phenotype(mk({ E: ['e', 'e'], D: ['d', 'd'] }), 'beagle').coatName === 'Lemon and white', 'beagle lemon');
ok(G.phenotype(mk({ E: ['e', 'e'] }), 'beagle').coatName === 'Red and white', 'beagle red and white');
ok(G.phenotype(mk({ B: ['b', 'b'] }), 'beagle').coatName === 'Chocolate tricolour', 'beagle chocolate tricolour');
ok(G.phenotype(mk({ B: ['b', 'b'], M: ['M', 'm'] }), 'chihuahua', 'c1').coat.merle === true, 'chihuahua merle shows');
ok(G.phenotype(mk({}), 'not-a-breed').coat.base === G.SHADES.mutt.black[0], 'unknown breed falls back to mutt');
ok(G.SIZE.chihuahua === 'small' && G.SIZE.pug === 'small' && G.SIZE.beagle === 'medium' && G.SIZE.greyhound === 'large', 'breed sizes');
ok(G.SIZE.poodle === 'medium' && G.SIZE.collie === 'medium' && G.SIZE.samoyed === 'large' && G.SIZE.frenchie === 'small', 'v2.5 breed sizes');
ok(G.SIZE.akita === 'large' && G.SIZE.spitz === 'medium' && G.SIZE.pom === 'small' && ['afghan', 'dane', 'mastiff', 'gsd'].every((k) => G.SIZE[k] === 'large'), 'v2.11 breed sizes');
ok(['dobie', 'corso', 'lab', 'malamute', 'stdpoodle'].every((k) => G.SIZE[k] === 'large') && ['pitbull', 'chow'].every((k) => G.SIZE[k] === 'medium') && ['minpin', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'].every((k) => G.SIZE[k] === 'small'), 'v2.12 breed sizes');
ok(G.BREED_NAMES.poodle === 'Miniature Poodle' && G.BREED_NAMES.stdpoodle === 'Standard Poodle' && G.BREED_NAMES.pitbull === 'Pit Bull' && G.BREED_NAMES.shihtzu === 'Shih Tzu', 'breed names (the old poodle is the Miniature Poodle)');
ok(G.BREEDS.every((k) => G.BREED_NAMES[k] && G.SHADES[k] && G.FREQ[k] && G.STARTER_GENES[k] && G.SIZE[k]), 'every breed has names, shades, frequencies, starter genes and a size');
// v2.5 coats (V25.md 6b)
const nm = (o, k) => G.phenotype(mk(o), k).coatName;
ok(nm({}, 'poodle') === 'Black' && nm({ E: ['e', 'e'] }, 'poodle') === 'Apricot' && nm({ B: ['b', 'b'] }, 'poodle') === 'Chocolate', 'poodle black, apricot, chocolate');
ok(nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'poodle') === 'White' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'poodle') === 'Cream' && nm({ D: ['d', 'd'] }, 'poodle') === 'Silver', 'poodle white, cream, silver');
ok(nm({ E: ['e', 'e'], D: ['d', 'd'], S: ['S', 'sp'] }, 'poodle') === 'White' && nm({ E: ['e', 'e'], D: ['d', 'd'], S: ['sp', 'sp'] }, 'poodle') === 'Parti', 'a white poodle is just White, its parti form just Parti');
ok(nm({ E: ['e', 'e'], S: ['sp', 'sp'] }, 'samoyed') === 'White' && nm({ E: ['e', 'e'], S: ['S', 'sp'] }, 'samoyed') === 'White', 'a samoyed-bodied mix with spotting is still just White');
ok(G.BREEDS.every((k) => G.coatCatalog(k, { all: true }).every((c) => !/^White (with|&|parti|pied)/.test(c.coat))), 'no coat name says white twice');
ok(nm({ S: ['sp', 'sp'] }, 'poodle') === 'Parti' && nm({ S: ['sp', 'sp'], E: ['e', 'e'] }, 'poodle') === 'Apricot parti', 'poodle parti');
ok(G.phenotype(mk({ E: ['e', 'e'], D: ['d', 'd'] }), 'poodle').coat.base !== '#FFFFFF', 'a white poodle is off-white (pure white is the spot colour)');
ok(nm({ S: ['S', 'sp'] }, 'collie') === 'Black and white' && nm({}, 'collie') === 'Tricolour' && nm({ S: ['sp', 'sp'] }, 'collie') === 'Black & white piebald', 'collie black and white, tricolour, piebald');
ok(nm({ S: ['S', 'sp'], E: ['e', 'e'] }, 'collie') === 'Red and white' && nm({ S: ['S', 'sp'], B: ['b', 'b'] }, 'collie') === 'Chocolate and white' && nm({ S: ['S', 'sp'], B: ['b', 'b'], D: ['d', 'd'] }, 'collie') === 'Lilac and white', 'collie red, chocolate, lilac');
ok(nm({ M: ['M', 'm'], S: ['S', 'sp'] }, 'collie') === 'Blue merle' && nm({ M: ['M', 'm'], B: ['b', 'b'] }, 'collie') === 'Red merle', 'collie merle words');
ok(G.phenotype(mk({ M: ['M', 'm'], E: ['e', 'e'], S: ['S', 'sp'] }), 'collie').merleHidden === true && nm({ M: ['M', 'm'], E: ['e', 'e'], S: ['S', 'sp'] }, 'collie') === 'Red and white', 'collie cryptic merle hides on e/e');
ok(nm({ E: ['e', 'e'] }, 'samoyed') === 'White' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'samoyed') === 'Cream', 'samoyed white and cream');
ok(nm({ E: ['e', 'e'] }, 'frenchie') === 'Fawn' && nm({}, 'frenchie') === 'Dark fawn' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'frenchie') === 'Blue fawn' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'frenchie') === 'Cream', 'frenchie fawn, dark fawn, blue fawn, cream');
ok(nm({ S: ['sp', 'sp'] }, 'frenchie') === 'Pied' && nm({ S: ['sp', 'sp'], E: ['e', 'e'] }, 'frenchie') === 'Fawn pied', 'frenchie pied');
const catHas = (k, names) => { const c = G.coatCatalog(k).map((x) => x.coat); return names.every((n) => c.includes(n)); };
ok(catHas('poodle', ['Black', 'White', 'Apricot', 'Chocolate', 'Cream', 'Silver', 'Parti']), 'poodle catalogue');
ok(catHas('collie', ['Black and white', 'Red and white', 'Blue merle', 'Red merle', 'Tricolour', 'Chocolate and white', 'Lilac and white']), 'collie catalogue');
ok(G.coatCatalog('samoyed').map((x) => x.coat).join() === 'White,Cream', 'samoyed catalogue is White, Cream');
ok(catHas('frenchie', ['Fawn', 'Cream', 'Dark fawn', 'Pied', 'Blue fawn']), 'frenchie catalogue');
// v2.11 breeds: coats, names and the welfare-safe genotype space (no merle, no double merle possible)
ok(nm({ E: ['e', 'e'] }, 'akita') === 'Red' && nm({}, 'akita') === 'Sesame' && nm({ B: ['b', 'b'] }, 'akita') === 'Dark sesame' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'akita') === 'White', 'akita red, sesame, dark sesame, white');
ok(catHas('akita', ['Red', 'Sesame', 'White', 'Dark sesame']), 'akita catalogue');
ok(G.coatCatalog('spitz').map((x) => x.coat).join() === 'White,Cream', 'spitz catalogue is White, Cream');
ok(nm({ E: ['e', 'e'] }, 'spitz') === 'White' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'spitz') === 'Cream', 'spitz white and cream');
ok(nm({ E: ['e', 'e'] }, 'pom') === 'Orange' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'pom') === 'Cream' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'pom') === 'White' && nm({}, 'pom') === 'Black' && nm({ B: ['b', 'b'] }, 'pom') === 'Chocolate' && nm({ D: ['d', 'd'] }, 'pom') === 'Blue', 'pom orange, cream, white, black, chocolate, blue');
ok(nm({ S: ['sp', 'sp'] }, 'pom') === 'Parti' && nm({ S: ['sp', 'sp'], E: ['e', 'e'] }, 'pom') === 'Orange parti', 'pom parti');
ok(catHas('pom', ['Orange', 'Cream', 'Black', 'Chocolate', 'White', 'Blue', 'Parti']), 'pom catalogue');
ok(catHas('afghan', ['Cream', 'Black', 'Red', 'Black and tan', 'Silver']), 'afghan catalogue');
ok(nm({ E: ['E', 'E'] }, 'afghan') === 'Black' && nm({ E: ['E', 'e'] }, 'afghan') === 'Black and tan' && nm({ E: ['e', 'e'] }, 'afghan') === 'Red' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'afghan') === 'Cream' && nm({ E: ['E', 'e'], D: ['d', 'd'] }, 'afghan') === 'Silver', 'afghan black, black and tan, red, cream, silver');
ok(catHas('gsd', ['Black and tan', 'Sable', 'Black', 'White']), 'gsd catalogue');
ok(nm({ E: ['E', 'e'] }, 'gsd') === 'Black and tan' && nm({ E: ['E', 'E'] }, 'gsd') === 'Black' && nm({ E: ['e', 'e'] }, 'gsd') === 'Sable' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'gsd') === 'White', 'gsd black and tan, black, sable, white');
ok(catHas('mastiff', ['Fawn', 'Apricot', 'Brindle']) && G.coatCatalog('mastiff').every((c) => !/white|merle|Harlequin/i.test(c.coat)), 'mastiff catalogue: fawn, apricot, brindle look');
ok(nm({ E: ['e', 'e'] }, 'mastiff') === 'Fawn' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'mastiff') === 'Apricot' && nm({}, 'mastiff') === 'Brindle', 'mastiff fawn, apricot, brindle');
ok(G.phenotype(mk({ E: ['e', 'e'] }), 'mastiff').coat.dark === '#2B2430' && G.phenotype(mk({}), 'mastiff').coat.dark === '#2B2430', 'the mastiff always has the black mask');
ok(catHas('dane', ['Fawn', 'Brindle', 'Black', 'Blue', 'Mantle', 'Merle', 'Harlequin']), 'dane catalogue');
ok(nm({ E: ['e', 'e'] }, 'dane') === 'Fawn' && nm({ B: ['b', 'b'] }, 'dane') === 'Brindle' && nm({}, 'dane') === 'Black' && nm({ D: ['d', 'd'] }, 'dane') === 'Blue' && nm({ S: ['sp', 'sp'] }, 'dane') === 'Mantle', 'dane fawn, brindle, black, blue, mantle');
ok(nm({ M: ['M', 'm'] }, 'dane') === 'Merle' && nm({ M: ['M', 'm'], S: ['sp', 'sp'] }, 'dane') === 'Harlequin' && nm({ M: ['M', 'm'], D: ['d', 'd'] }, 'dane') === 'Blue merle', 'dane merle and harlequin (merle on white)');
{ const hq = G.phenotype(mk({ M: ['M', 'm'], S: ['sp', 'sp'] }), 'dane').coat, mp = G.phenotype(mk({ S: ['sp', 'sp'] }), 'dane').coat, br = G.phenotype(mk({ B: ['b', 'b'] }), 'dane').coat, mb = G.phenotype(mk({ B: ['b', 'b'] }), 'mastiff').coat, plain = G.phenotype(mk({ E: ['e', 'e'] }), 'dane').coat;
  ok(hq.merle && hq.white === 0.6 && hq.base === '#2A2628' && hq.light === '#FFFFFF', 'the harlequin look: black patches (base) on white, white 0.6');
  ok(mp.white === 0.6 && mp.light === '#FFFFFF' && !mp.merle, 'a Mantle Great Dane has the white chest and collar');
  ok(br.brindle === true && mb.brindle === true && !plain.brindle && !('brindle' in plain) && !('brindle' in G.phenotype(mk({ B: ['b', 'b'] }), 'golden').coat), 'coat.brindle is set for the brindle looks of the dane and the mastiff only'); }
ok(G.isDoubleMerle(mk({ M: ['M', 'm'] }), mk({ M: ['M', 'm'] })) && !G.isDoubleMerle(mk({ M: ['M', 'm'] }), mk({})), 'two merle Great Danes would be a double merle, one merle is fine');
{ const a = G.STARTER_GENES.dane, m = Object.assign({}, a, { M: ['M', 'm'] }); let bad = 0, merle = 0; const r = seeded(5); for (let i = 0; i < 4000; i++) { const g = G.inherit(m, a, r); if (g.M[0] === 'M' && g.M[1] === 'M') bad++; if (g.M.includes('M')) merle++; } ok(bad === 0 && merle > 1500 && merle < 2500, 'a merle Great Dane x a plain one: about half the pups are merle and none is M/M (' + merle + ' of 4000)'); }

// v2.12 coats (V212.md 3): the catalogue names, the folding into the old loci, and no merle anywhere new
const cat = (k) => G.coatCatalog(k).map((x) => x.coat);
ok(catHas('dobie', ['Black and rust', 'Red and rust', 'Blue and rust', 'Fawn and rust']) && cat('dobie').every((c) => !/white|merle/i.test(c)), 'dobie catalogue: four rust-pointed coats, no white');
ok(nm({}, 'dobie') === 'Black and rust' && nm({ B: ['b', 'b'] }, 'dobie') === 'Red and rust' && nm({ D: ['d', 'd'] }, 'dobie') === 'Blue and rust' && nm({ B: ['b', 'b'], D: ['d', 'd'] }, 'dobie') === 'Fawn and rust', 'dobie black, red, blue and fawn and rust');
ok(catHas('corso', ['Black', 'Grey', 'Fawn', 'Red', 'Black brindle', 'Grey brindle']), 'corso catalogue');
ok(nm({}, 'corso') === 'Black' && nm({ D: ['d', 'd'] }, 'corso') === 'Grey' && nm({ E: ['e', 'e'] }, 'corso') === 'Fawn' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'corso') === 'Red' && nm({ B: ['b', 'b'] }, 'corso') === 'Black brindle' && nm({ B: ['b', 'b'], D: ['d', 'd'] }, 'corso') === 'Grey brindle', 'corso black, grey, fawn, red, black brindle, grey brindle');
ok(G.phenotype(mk({ E: ['e', 'e'] }), 'corso').coat.dark === '#2B2430' && G.phenotype(mk({ E: ['e', 'e'], B: ['b', 'b'] }), 'corso').coat.dark === '#2B2430', 'the corso fawn and red have the dark mask');
ok(catHas('pitbull', ['Blue', 'Black', 'Fawn', 'Red', 'Brindle', 'White', 'Pied', 'Blue fawn']), 'pitbull catalogue');
ok(nm({ D: ['d', 'd'] }, 'pitbull') === 'Blue' && nm({}, 'pitbull') === 'Black' && nm({ E: ['e', 'e'] }, 'pitbull') === 'Fawn' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'pitbull') === 'Red' && nm({ B: ['b', 'b'] }, 'pitbull') === 'Brindle' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'pitbull') === 'Blue fawn', 'pitbull blue, black, fawn, red, brindle, blue fawn');
ok(nm({ S: ['sp', 'sp'] }, 'pitbull') === 'Pied' && nm({ S: ['sp', 'sp'], D: ['d', 'd'] }, 'pitbull') === 'Blue pied' && nm({ S: ['sp', 'sp'], E: ['e', 'e'] }, 'pitbull') === 'White' && nm({ S: ['sp', 'sp'], E: ['e', 'e'], D: ['d', 'd'] }, 'pitbull') === 'White', 'pitbull pied on a dark coat, White on a red or cream coat');
{ const w = G.phenotype(mk({ S: ['sp', 'sp'], E: ['e', 'e'] }), 'pitbull').coat; ok(w.base === '#F7F3EA' && w.light === '#FFFFFF' && w.white === 0.6, 'a White Pit Bull is drawn off-white'); }
ok(cat('minpin').join() === 'Red,Black and rust,Chocolate and rust', 'minpin catalogue is Red, Black and rust, Chocolate and rust (' + cat('minpin').join() + ')');
ok(nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'minpin') === 'Red', 'a stag red min pin is just Red');
ok(['Yellow', 'Black', 'Chocolate'].every((c) => cat('lab').includes(c)) && cat('lab').length === 3, 'lab catalogue is Yellow, Black, Chocolate');
ok(nm({ E: ['e', 'e'] }, 'lab') === 'Yellow' && nm({}, 'lab') === 'Black' && nm({ B: ['b', 'b'] }, 'lab') === 'Chocolate' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'lab') === 'Yellow', 'lab: e/e Yellow, B_ Black, b/b Chocolate');
ok(catHas('malamute', ['Grey and white', 'Black and white', 'Red and white', 'Sable and white', 'White']), 'malamute catalogue');
ok(nm({ E: ['E', 'e'] }, 'malamute') === 'Grey and white' && nm({}, 'malamute') === 'Black and white' && nm({ B: ['b', 'b'] }, 'malamute') === 'Red and white' && nm({ E: ['e', 'e'] }, 'malamute') === 'Sable and white' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'malamute') === 'White', 'malamute grey, black, red, sable and white, e/e d/d White');
ok(G.BREEDS.slice(21).every((k) => G.coatCatalog(k, { all: true }).every((c) => !/White and white|white.*white/i.test(c.coat))), 'no new coat says white twice');
ok(catHas('chow', ['Red', 'Black', 'Blue', 'Cinnamon', 'Cream']), 'chow catalogue');
ok(nm({ E: ['e', 'e'] }, 'chow') === 'Red' && nm({}, 'chow') === 'Black' && nm({ D: ['d', 'd'] }, 'chow') === 'Blue' && nm({ B: ['b', 'b'] }, 'chow') === 'Cinnamon' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'chow') === 'Cream', 'chow red, black, blue, cinnamon, cream');
ok(catHas('stdpoodle', ['Black', 'White', 'Apricot', 'Chocolate', 'Cream', 'Silver', 'Red', 'Blue', 'Parti']), 'stdpoodle catalogue');
ok(nm({ E: ['e', 'e'] }, 'stdpoodle') === 'Red' && nm({ E: ['e', 'e'], B: ['B', 'b'] }, 'stdpoodle') === 'Apricot' && nm({ E: ['e', 'e'], B: ['b', 'b'] }, 'stdpoodle') === 'Cream' && nm({ E: ['e', 'e'], D: ['d', 'd'] }, 'stdpoodle') === 'White', 'stdpoodle red (B/B), apricot, cream, white');
ok(nm({ D: ['d', 'd'] }, 'stdpoodle') === 'Blue' && nm({ E: ['E', 'e'], D: ['d', 'd'] }, 'stdpoodle') === 'Silver' && nm({ S: ['sp', 'sp'] }, 'stdpoodle') === 'Parti' && nm({ S: ['sp', 'sp'], E: ['e', 'e'], D: ['d', 'd'] }, 'stdpoodle') === 'Parti', 'stdpoodle blue (E/E), silver (E/e), parti');
ok(cat('schnauzer').join() === 'Salt and pepper,Black,White,Black and silver', 'schnauzer catalogue is Salt and pepper, Black, White, Black and silver (' + cat('schnauzer').join() + ')');
ok(nm({ E: ['E', 'e'] }, 'schnauzer') === 'Salt and pepper' && nm({}, 'schnauzer') === 'Black' && nm({ D: ['d', 'd'] }, 'schnauzer') === 'Black and silver' && nm({ E: ['e', 'e'] }, 'schnauzer') === 'White', 'schnauzer salt and pepper (E/e), black (E/E), black and silver (d/d), white (e/e)');
ok(cat('westie').join() === 'White' && cat('maltese').join() === 'White' && cat('bichon').join() === 'White,Cream', 'westie and maltese are White, bichon White and a rare Cream');
ok(G.coatCatalog('bichon')[1].rare && !G.coatCatalog('bichon')[0].rare, 'the bichon cream is the rare one');
ok(catHas('yorkie', ['Blue and tan', 'Black and tan', 'Parti']), 'yorkie catalogue');
ok(nm({ D: ['d', 'd'] }, 'yorkie') === 'Blue and tan' && nm({}, 'yorkie') === 'Black and tan' && nm({ S: ['sp', 'sp'] }, 'yorkie') === 'Parti', 'yorkie blue and tan (d/d), black and tan, parti');
ok(catHas('shihtzu', ['Gold and white', 'Black and white', 'Liver and white', 'Brindle and white', 'Black', 'Silver and white']), 'shihtzu catalogue');
ok(nm({ E: ['e', 'e'], S: ['S', 'sp'] }, 'shihtzu') === 'Gold and white' && nm({ E: ['E', 'e'], S: ['sp', 'sp'] }, 'shihtzu') === 'Black and white' && nm({ E: ['E', 'e'] }, 'shihtzu') === 'Black' && nm({ S: ['S', 'sp'] }, 'shihtzu') === 'Brindle and white' && nm({ E: ['E', 'e'], B: ['b', 'b'], S: ['sp', 'sp'] }, 'shihtzu') === 'Liver and white' && nm({ E: ['E', 'e'], D: ['d', 'd'], S: ['sp', 'sp'] }, 'shihtzu') === 'Silver and white', 'shihtzu gold, black, brindle (E/E), liver, silver, with and without white');
{ const br = (o, k) => G.phenotype(mk(o), k).coat.brindle === true;
  ok(br({ B: ['b', 'b'] }, 'corso') && br({ B: ['b', 'b'], D: ['d', 'd'] }, 'corso') && br({ B: ['b', 'b'] }, 'pitbull') && br({ B: ['b', 'b'], D: ['d', 'd'] }, 'pitbull') && br({}, 'shihtzu'), 'coat.brindle on the corso, pit bull and shih tzu brindle looks');
  ok(!br({}, 'corso') && !br({ E: ['e', 'e'] }, 'pitbull') && !br({ E: ['E', 'e'] }, 'shihtzu') && !('brindle' in G.phenotype(mk({ B: ['b', 'b'] }), 'lab').coat), 'and on no other coat'); }
ok(V212.every((k) => G.FREQ[k].M === 0 && G.STARTER_GENES[k].M.join() === 'm,m'), 'no v2.12 breed carries merle (M 0, starters m/m)');
ok(V212.every((k) => G.coatCatalog(k).every((c) => !/merle|Harlequin/i.test(c.coat))), 'no merle coat in any v2.12 catalogue');

/* 3. Inheritance ratios over 10,000 runs (doc: Punnett examples) */
const N = 10000, S = G.STARTER_GENES;
function ratio(mum, dad, test, seed) { const r = seeded(seed); let n = 0; for (let i = 0; i < N; i++) if (test(G.inherit(mum, dad, r))) n++; return n / N; }
const pig = (g) => G.pigment(g);
const lilac = ratio(S.shiba, S.mutt, (g) => pig(g) === 'lilac', 1);
const blue = ratio(S.shiba, S.mutt, (g) => pig(g) === 'blue', 2);
const redCream = ratio(S.shiba, S.mutt, (g) => pig(g) === 'red' || pig(g) === 'cream', 3);
const pie = ratio(S.corgi, S.husky, (g) => g.S[0] === 'sp' && g.S[1] === 'sp', 4);
const merleKids = ratio(mk({ M: ['M', 'm'] }), S.corgi, (g) => g.M.includes('M'), 5);
const blueEyed = ratio(S.husky, S.corgi, (g) => g.Bl.includes('Bl'), 6);
console.log(`Inheritance (10,000 each): Mochi x Pepper lilac ${(lilac * 100).toFixed(2)}% (1/32 = 3.13%), blue ${(blue * 100).toFixed(2)}% (3/32 = 9.38%), red/cream ${(redCream * 100).toFixed(1)}% (50%); Biscuit x Frost piebald ${(pie * 100).toFixed(1)}% (25%); merle x plain ${(merleKids * 100).toFixed(1)}% (50%); Frost x Biscuit Bl carriers ${(blueEyed * 100).toFixed(0)}% (100%)`);
near(lilac, 1 / 32, 0.006, 'Mochi x Pepper lilac');
near(blue, 3 / 32, 0.01, 'Mochi x Pepper blue');
near(redCream, 0.5, 0.015, 'Mochi x Pepper red or cream');
near(pie, 0.25, 0.015, 'Biscuit x Frost piebald');
near(merleKids, 0.5, 0.015, 'merle x plain');
ok(blueEyed === 1, 'every Frost puppy carries Bl');
const kid = G.inherit(S.shiba, S.mutt, seeded(9));
ok(G.LOCUS_KEYS.every((k) => S.shiba[k].includes(kid[k][0]) && S.mutt[k].includes(kid[k][1])), 'one allele from each parent');

/* 4. Double merle */
ok(G.isDoubleMerle(mk({ M: ['M', 'm'] }), mk({ M: ['M', 'm'] })) === true, 'merle x merle blocked');
ok(G.isDoubleMerle(mk({ M: ['M', 'm'] }), mk({})) === false, 'merle x plain allowed');
ok(G.isDoubleMerle({ genes: mk({ M: ['M', 'm'], E: ['e', 'e'] }) }, { genes: mk({ M: ['M', 'm'] }) }) === true, 'hidden (cryptic) merle x merle blocked');
{ const r2 = seeded(77); let a = null, b = null; while (!a || !b) { const g = G.randomGenotype('chihuahua', r2); if (g.M.includes('M')) { if (!a) a = g; else b = g; } }
  ok(G.isDoubleMerle(a, b) === true, 'merle chihuahua x merle chihuahua blocked'); }
ok(G.isDoubleMerle(G.STARTER_GENES.pug, G.STARTER_GENES.beagle) === false, 'starter pug x beagle allowed');
{ const r3 = seeded(78); let a = null, b = null; while (!a || !b) { const g = G.randomGenotype('collie', r3); if (g.M.includes('M')) { if (!a) a = g; else b = g; } }
  ok(G.isDoubleMerle(a, b) === true, 'merle collie x merle collie blocked');
  ok(G.isDoubleMerle(a, G.STARTER_GENES.collie) === false, 'merle collie x plain collie allowed');
  ok(G.predict(a, G.STARTER_GENES.collie, 'collie', 'collie').some((x) => /merle/.test(x.coat)), 'merle x plain collie can make merle pups'); }

/* 5. Relatives */
const dogs = [
  { id: 'A', parents: null }, { id: 'B', parents: null }, { id: 'E', parents: null }, { id: 'G', parents: null }, { id: 'X', parents: null },
  { id: 'C', parents: ['A', 'B'] }, { id: 'D', parents: ['A', 'B'] },          // C, D full siblings
  { id: 'Hs', parents: ['A', 'X'] },                                           // half sibling of C
  { id: 'F', parents: ['C', 'E'] },                                            // D is F's aunt/uncle
  { id: 'H', parents: ['D', 'G'] },                                            // F and H first cousins
  { id: 'I', parents: null }, { id: 'K', parents: null },
  { id: 'J', parents: ['F', 'I'] }, { id: 'L', parents: ['H', 'K'] }            // J and L second cousins
];
const byId = Object.fromEntries(dogs.map((d) => [d.id, d]));
const rel = (a, b) => G.related(byId[a], byId[b], dogs);
ok(rel('A', 'C'), 'parent-child'); ok(rel('C', 'D'), 'full siblings'); ok(rel('C', 'Hs'), 'half siblings');
ok(rel('A', 'F'), 'grandparent'); ok(rel('D', 'F'), 'aunt/uncle'); ok(rel('F', 'H'), 'first cousins');
ok(!rel('J', 'L'), 'second cousins allowed'); ok(!rel('A', 'J'), 'great-grandparent allowed');
ok(!rel('A', 'E'), 'unrelated'); ok(!rel('C', 'G'), 'unrelated in-law');
ok(G.related(byId.C, byId.C, dogs), 'same dog');

/* 6. randomGenotype: never M/M; merle about 15% only in corgi, dachshund, mutt; goldens always e/e */
const r = seeded(42);
const counts = {};
for (const b of G.BREEDS) {
  let mm = 0, merle = 0, ee = 0, bad = 0, pie = 0;
  for (let i = 0; i < N; i++) {
    const g = G.randomGenotype(b, r);
    if (g.M[0] === 'M' && g.M[1] === 'M') mm++;
    if (g.M.includes('M')) merle++;
    if (g.E[0] === 'e' && g.E[1] === 'e') ee++;
    if (g.S[0] === 'sp' && g.S[1] === 'sp') pie++;
    if (!G.LOCUS_KEYS.every((k) => Array.isArray(g[k]) && g[k].length === 2 && g[k].every((a) => G.LOCI[k].alleles.includes(a)))) bad++;
  }
  counts[b] = { merle: merle / N, ee: ee / N, pie: pie / N };
  ok(mm === 0, `${b}: never M/M`); ok(bad === 0, `${b}: valid alleles`);
  if (['corgi', 'dachs', 'mutt'].includes(b)) near(merle / N, 0.15, 0.015, `${b} merle rate`);
  else if (b === 'collie') near(merle / N, 0.20, 0.015, 'collie merle rate');
  else if (b === 'dane') near(merle / N, 0.20, 0.015, 'Great Dane merle rate');
  else if (b === 'chihuahua') near(merle / N, 0.10, 0.012, 'chihuahua merle rate');
  else ok(merle === 0, `${b}: no merle`);
}
ok(counts.golden.ee === 1, 'goldens are always e/e');
ok(counts.samoyed.ee === 1 && counts.samoyed.pie === 0, 'samoyeds are always e/e and never piebald');
ok(counts.spitz.ee === 1 && counts.spitz.pie === 0 && counts.akita.pie === 0, 'spitzes are always e/e, and neither spitz nor akita is piebald');
ok(['dobie', 'corso', 'minpin', 'lab', 'malamute', 'chow', 'schnauzer', 'westie', 'bichon', 'maltese'].every((k) => counts[k].pie === 0), 'no piebald in the v2.12 breeds without spotting');
ok(counts.westie.ee === 1 && counts.maltese.ee === 1 && counts.bichon.ee === 1 && counts.dobie.ee === 0 && counts.yorkie.ee === 0, 'westies, maltese and bichons are always e/e, dobermans and yorkies never');
near(counts.pitbull.pie, 0.35 * 0.35, 0.012, 'pit bull pied or white rate');
near(counts.yorkie.pie, 0.3 * 0.3, 0.012, 'yorkie parti rate');
ok(counts.gsd.pie === 0 && counts.afghan.pie === 0 && counts.mastiff.pie === 0 && counts.mastiff.merle === 0, 'no piebald afghans, shepherds or mastiffs, no merle mastiffs');
near(counts.pom.pie, 0.15 * 0.15, 0.008, 'pom parti rate');
near(counts.frenchie.pie, 0.35 * 0.35, 0.012, 'frenchie pied rate');
ok(counts.pug.pie === 0, 'pugs are never piebald');
near(1 - counts.pug.ee, 0.19, 0.015, 'about 19% black pugs');
console.log('Random rescues (10,000 each):', Object.entries(counts).map(([b, c]) => `${b} merle ${(c.merle * 100).toFixed(1)}% red ${(c.ee * 100).toFixed(0)}%`).join(', '));

/* 7. Rescue phenotypes are always valid palettes */
const hex = /^#[0-9A-F]{6}$/;
let badPal = 0;
for (const b of G.BREEDS) for (let i = 0; i < 2000; i++) { const p = G.phenotype(G.randomGenotype(b, r), b, b + i); if (!hex.test(p.coat.base) || !hex.test(p.coat.light) || !hex.test(p.coat.dark) || ![0, 0.25, 0.6].includes(p.coat.white) || !['brown', 'amber', 'blue', 'odd'].includes(p.eyes) || !p.coatName) badPal++; }
ok(badPal === 0, 'rescue palettes valid');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
