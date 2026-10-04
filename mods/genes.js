/* Paw Haven: PawGenes (v1.5A, breeds extended in v1.7 to 10). Loosely real dog coat genetics for the crayon dogs.
   Plain IIFE, no DOM. Matches the v2 doc (Genetics section) and V2_GENES.md.
   API: LOCI, STARTER_GENES, SHADES, phenotype(genes, breedKey, seed?), pigment(genes),
        randomGenotype(breedKey, rng), inherit(mumGenes, dadGenes, rng),
        isDoubleMerle(a, b), related(dogA, dogB, allDogs). */
(function (root) {
  'use strict';

  const BREEDS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle'];
  // Breed size for the v2 litter rules (small 1-3, medium 1-3, large 2-3 puppies).
  const SIZE = { shiba: 'medium', corgi: 'small', golden: 'large', dachs: 'small', husky: 'large', mutt: 'medium', chihuahua: 'small', pug: 'small', greyhound: 'large', beagle: 'medium' };

  const LOCI = {
    B:  { name: 'Coat base (B locus, TYRP1)', alleles: ['B', 'b'], dominant: 'B', rule: 'B_ makes black pigment; b/b makes liver (chocolate) pigment, a liver nose and amber eyes.' },
    D:  { name: 'Dilution (D locus, MLPH)', alleles: ['D', 'd'], dominant: 'D', rule: 'd/d dilutes: black becomes blue, liver becomes lilac (isabella), red becomes cream.' },
    E:  { name: 'Red (E locus, MC1R)', alleles: ['E', 'e'], dominant: 'E', rule: 'e/e makes the coat grow only red pigment: red, gold or tan by breed (cream with d/d). It hides merle (cryptic merle).' },
    S:  { name: 'White spotting (S locus, MITF)', alleles: ['S', 'sp'], dominant: 'S', rule: 'S/sp gives small white markings; sp/sp gives extensive white piebald patches.' },
    M:  { name: 'Merle (M locus, PMEL)', alleles: ['M', 'm'], dominant: 'M', rule: 'M/m gives merle marbling on black or liver pigment (hidden on e/e). M/M (double merle) is never allowed.' },
    Bl: { name: 'Husky blue eyes (ALX4-type)', alleles: ['Bl', 'bl'], dominant: 'Bl', rule: 'Bl/Bl gives blue eyes; Bl/bl gives blue eyes with a 1 in 4 chance of odd eyes instead.' }
  };
  const LOCUS_KEYS = ['B', 'D', 'E', 'S', 'M', 'Bl'];

  // From V2_GENES.md (the v2 doc). Each must reproduce the starter dog's current art.
  const STARTER_GENES = {
    shiba:  { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],   M: ['m', 'm'], Bl: ['bl', 'bl'] },
    corgi:  { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'sp'],  M: ['m', 'm'], Bl: ['bl', 'bl'] },
    golden: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],   M: ['m', 'm'], Bl: ['bl', 'bl'] },
    dachs:  { B: ['b', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'],   M: ['m', 'm'], Bl: ['bl', 'bl'] },
    husky:  { B: ['B', 'B'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'],  M: ['m', 'm'], Bl: ['Bl', 'Bl'] },
    mutt:   { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] },
    // v1.7 breeds
    chihuahua: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // fawn; carries chocolate + dilute
    pug:       { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // fawn with black mask; carries apricot (b)
    greyhound: { B: ['B', 'B'], D: ['d', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // blue with white chest; carries fawn + white
    beagle:    { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }  // tricolour; carries chocolate, red, piebald
  };

  /* Art palette per breed and pigment: [base, light, dark].
     The starter cells (marked *) equal the current fills in dogs/pawart_dogs.js exactly:
       shiba red*   col #F7892E, light #FFE7B3          (no dark in the art; dark is unused)
       corgi red*   col #F8A23C, light #FFFFFF (white markings)
       golden red*  col #F2B84A, ear #D98A22 = dark
       dachs liver* col #A65A34, light #F5B26B (tan points/socks), ear #6E3315 = dark
       husky black* col #78A2E2 (crayon wolf-grey), light #FFFFFF (mask)
       mutt black*  dark #1D1A22 patches on white: base = patch colour #1D1A22, white 0.6
     light = muzzle/chest/urajiro/tan points; for corgi, husky and mutt the breed's light areas are white. */
  const SHADES = {
    shiba: {
      red:   ['#F7892E', '#FFE7B3', '#C9621C'], // *
      cream: ['#F4D6A2', '#FFF6E6', '#D6AF74'],
      black: ['#2B2430', '#FFE7B3', '#1D1A22'], // black and tan, cream urajiro
      liver: ['#7A4A2E', '#FFE7B3', '#5A3420'],
      blue:  ['#6E7F96', '#FFE7B3', '#55657A'],
      lilac: ['#A8949A', '#FFF1E8', '#8A777E']
    },
    corgi: {
      red:   ['#F8A23C', '#FFFFFF', '#C97A22'], // *
      cream: ['#F6D7A0', '#FFFFFF', '#D6B27A'],
      black: ['#2B2430', '#FFFFFF', '#1D1A22'],
      liver: ['#7A4A2E', '#FFFFFF', '#5A3420'],
      blue:  ['#6E7F96', '#FFFFFF', '#55657A'],
      lilac: ['#A8949A', '#FFFFFF', '#8A777E']
    },
    golden: {
      red:   ['#F2B84A', '#FBE3A6', '#D98A22'], // *
      cream: ['#F6E0B0', '#FFF6E0', '#E0BE7A'],
      black: ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver: ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:  ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac: ['#A8949A', '#C2B2B7', '#8A777E']
    },
    dachs: {
      liver: ['#A65A34', '#F5B26B', '#6E3315'], // * chocolate and tan
      black: ['#2B2430', '#C98A4E', '#1D1A22'], // black and tan
      blue:  ['#6E7F96', '#D9B48A', '#55657A'],
      lilac: ['#B89A8A', '#F2D2B0', '#8F7466'], // isabella
      red:   ['#C8642E', '#E8945A', '#8A3E1C'],
      cream: ['#EBCB98', '#F7E3C0', '#C9A46E']
    },
    husky: {
      black: ['#78A2E2', '#FFFFFF', '#4F79B8'], // * wolf-grey crayon
      liver: ['#B4653A', '#FFFFFF', '#86452A'], // copper
      blue:  ['#A9BCD6', '#FFFFFF', '#7F93AE'],
      lilac: ['#C9B3B8', '#FFFFFF', '#A3898F'],
      red:   ['#E8A06A', '#FFFFFF', '#B8703F'],
      cream: ['#F3E2C2', '#FFFFFF', '#D9C29A']
    },
    /* v1.7 breeds. Starter cells (*) equal dogs/pawart_dogs.js:
       chihuahua fawn*  col #F0C48C, light #FFF1DC (no dark in the art; dark unused)
       pug fawn*        col #E8C08C, light #F6DDB6, dark #2B2430 = the black mask (and ears)
       greyhound blue*  col #8E9AB0, light #FFFFFF (chest), ear #6E7A90 = dark
       beagle tricolour* col #CF8C4C = tan base, light #FFFFFF, dark #2B2430 = the saddle (the art keeps its ear #A8642E)
       Breed folding: pug fawn is drawn as e/e with the black mask as a breed marking; greyhound brindle is NOT modelled
       (it needs the K locus); beagle "tricolour" = black pigment drawn as tan base + black saddle + white. */
    chihuahua: {
      red:   ['#F0C48C', '#FFF1DC', '#C99A5E'], // * fawn
      cream: ['#F6E2C0', '#FFF8EC', '#D9BF94'],
      black: ['#2B2430', '#D99A5A', '#1D1A22'], // black and tan
      liver: ['#7A4A2E', '#D9A06A', '#5A3420'], // chocolate and tan
      blue:  ['#6E7F96', '#D9B48A', '#55657A'], // blue and tan
      lilac: ['#A8949A', '#E8CDB0', '#8A777E']
    },
    pug: {
      red:     ['#E8C08C', '#F6DDB6', '#2B2430'], // * fawn, black mask
      apricot: ['#E0A060', '#F2C894', '#2B2430'], // rare: e/e with b/b
      cream:   ['#D9CDBE', '#ECE4D8', '#55657A'], // silver fawn, grey mask
      black:   ['#2B2430', '#3A3240', '#1D1A22'], // solid black (mask invisible)
      liver:   ['#7A4A2E', '#8E5E40', '#5A3420'],
      blue:    ['#6E7F96', '#8291A6', '#55657A'],
      lilac:   ['#A8949A', '#BBA9AF', '#8A777E']
    },
    greyhound: {
      blue:    ['#8E9AB0', '#FFFFFF', '#6E7A90'], // *
      black:   ['#2B2430', '#FFFFFF', '#1D1A22'],
      red:     ['#E0B07A', '#FFFFFF', '#B8875A'], // fawn
      redliver:['#C8743E', '#FFFFFF', '#94522A'], // red (e/e with b/b, liver nose)
      cream:   ['#D8C3A8', '#FFFFFF', '#B8A284'], // blue fawn
      liver:   ['#7A4A2E', '#FFFFFF', '#5A3420'],
      lilac:   ['#A8949A', '#FFFFFF', '#8A777E']
    },
    beagle: {
      black: ['#CF8C4C', '#FFFFFF', '#2B2430'], // * tricolour: tan base, black saddle
      liver: ['#D9A066', '#FFFFFF', '#7A4A2E'], // chocolate tricolour
      blue:  ['#D6A878', '#FFFFFF', '#6E7F96'], // blue tricolour
      lilac: ['#DDB48C', '#FFFFFF', '#A8949A'], // lilac tricolour
      red:   ['#C9783C', '#FFFFFF', '#C9783C'], // red and white (no saddle)
      cream: ['#F1D79A', '#FFFFFF', '#F1D79A']  // lemon and white
    },
    mutt: {
      black: ['#1D1A22', '#FFFFFF', '#1D1A22'], // *
      liver: ['#6E3D22', '#FFFFFF', '#4E2A16'],
      blue:  ['#5E6F86', '#FFFFFF', '#46556A'],
      lilac: ['#9C8A92', '#FFFFFF', '#7E6D75'],
      red:   ['#D9822E', '#FFFFFF', '#A65E1E'],
      cream: ['#EED2A0', '#FFFFFF', '#CFAE76']
    }
  };

  // Plain-language colour words per breed and pigment.
  const WORDS = {
    shiba:  { red: 'Red', cream: 'Cream', black: 'Black and tan', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    corgi:  { red: 'Red', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    golden: { red: 'Golden', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    dachs:  { red: 'Red', cream: 'Cream', black: 'Black and tan', liver: 'Chocolate and tan', blue: 'Blue and tan', lilac: 'Isabella' },
    husky:  { red: 'Red', cream: 'Cream', black: 'Grey', liver: 'Copper', blue: 'Blue', lilac: 'Lilac' },
    mutt:   { red: 'Red', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    chihuahua: { red: 'Fawn', cream: 'Cream', black: 'Black and tan', liver: 'Chocolate and tan', blue: 'Blue and tan', lilac: 'Lilac and tan' },
    pug:       { red: 'Fawn', apricot: 'Apricot', cream: 'Silver fawn', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    greyhound: { red: 'Fawn', redliver: 'Red', cream: 'Blue fawn', black: 'Black', liver: 'Liver', blue: 'Blue', lilac: 'Lilac' },
    beagle:    { red: 'Red', cream: 'Lemon', black: 'Tricolour', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour' }
  };
  // Merle names follow the doc: named after the base pigment (dachshund merle is called "dapple").
  const MERLE_WORDS = { black: 'Black merle', liver: 'Liver merle', blue: 'Slate merle', lilac: 'Lilac merle' };
  const DAPPLE_WORDS = { black: 'Black dapple', liver: 'Chocolate dapple', blue: 'Blue dapple', lilac: 'Isabella dapple' };
  // Breeds whose art always shows white breed markings (corgi blaze/chest, husky mask/belly).
  const WHITE_MARKED = { corgi: true, husky: true, beagle: true };
  // Beagle tricolours already say the white; no suffix.
  const TRI = { beagle: { black: 1, liver: 1, blue: 1, lilac: 1 } };

  /* ---------- helpers ---------- */
  const has = (pair, allele) => !!pair && (pair[0] === allele || pair[1] === allele);
  const both = (pair, allele) => !!pair && pair[0] === allele && pair[1] === allele;
  const breedOf = (k) => (BREEDS.indexOf(k) >= 0 ? k : 'mutt');
  function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rngOf = (rng) => (typeof rng === 'function' ? rng : Math.random);
  function normGenes(g) {
    const d = STARTER_GENES.mutt, out = {};
    LOCUS_KEYS.forEach((k) => { const p = g && Array.isArray(g[k]) && g[k].length === 2 ? g[k] : d[k]; out[k] = [p[0], p[1]]; });
    return out;
  }
  const genesOf = (x) => (x && x.genes ? x.genes : x);
  const genesKey = (g) => LOCUS_KEYS.map((k) => g[k].join('')).join('|');

  /** Visible pigment class: 'red' | 'cream' | 'black' | 'liver' | 'blue' | 'lilac'. */
  function pigment(genes) {
    const g = normGenes(genesOf(genes)), dil = both(g.D, 'd');
    if (both(g.E, 'e')) return dil ? 'cream' : 'red';
    const liver = both(g.B, 'b');
    if (dil) return liver ? 'lilac' : 'blue';
    return liver ? 'liver' : 'black';
  }

  /**
   * phenotype(genes, breedKey, seed?) -> { coatName, eyes, coat:{base, light, dark, white, merle, eyes}, pigment, merleHidden }
   * seed (optional, e.g. the dog's id) makes the per-dog eye rolls stable; without it the genotype itself is the seed.
   */
  function phenotype(genes, breedKey, seed) {
    const breed = breedOf(breedKey), g = normGenes(genesOf(genes)), pig = pigment(g);
    // breed-specific shade keys: pug apricot (e/e + b/b), greyhound red (e/e + b/b, liver nose)
    let sk = pig;
    if (pig === 'red' && both(g.B, 'b')) { if (breed === 'pug') sk = 'apricot'; else if (breed === 'greyhound') sk = 'redliver'; }
    const shade = SHADES[breed][sk] || SHADES[breed][pig];
    const merleAllele = has(g.M, 'M');
    const merle = merleAllele && pig !== 'red' && pig !== 'cream'; // cryptic merle hides on e/e
    const white = both(g.S, 'sp') ? 0.6 : has(g.S, 'sp') ? 0.25 : 0;

    // eyes: Bl first, then visible merle, then b/b, else brown
    const r = mulberry(hashStr((seed == null ? genesKey(g) : String(seed)) + '|eyes|' + breed));
    let eyes = 'brown';
    if (has(g.Bl, 'Bl')) eyes = both(g.Bl, 'Bl') ? 'blue' : (r() < 0.25 ? 'odd' : 'blue');
    else if (merle) { const x = r(); eyes = x < 0.15 ? 'odd' : x < 0.25 ? 'blue' : (both(g.B, 'b') ? 'amber' : 'brown'); }
    else if (both(g.B, 'b')) eyes = 'amber';

    // name
    let name;
    if (merle) name = (breed === 'dachs' ? DAPPLE_WORDS : MERLE_WORDS)[pig];
    else name = WORDS[breed][sk] || WORDS[breed][pig];
    if (white === 0.6) name += ' & white piebald';
    else if (TRI[breed] && TRI[breed][pig] && !merle) { /* "Tricolour" already includes white */ }
    else if (breed === 'shiba' && !merle) name += ' with cream urajiro' + (white ? ' and white markings' : '');
    else if (WHITE_MARKED[breed]) name += ' and white';
    else if (white === 0.25) name += ' with white markings';

    return {
      coatName: name,
      eyes,
      coat: { base: shade[0], light: shade[1], dark: shade[2], white, merle, eyes },
      pigment: pig,
      merleHidden: merleAllele && !merle
    };
  }

  /* ---------- random rescue genotypes (breed-appropriate allele frequencies) ---------- */
  // frequency of the recessive / special allele per locus; M = chance of being M/m (never M/M)
  const FREQ = {
    shiba:  { b: 0.20, d: 0.15, e: 0.85, sp: 0.05, M: 0,    Bl: 0 },
    corgi:  { b: 0.10, d: 0.10, e: 0.75, sp: 0.40, M: 0.15, Bl: 0 },
    golden: { b: 0.15, d: 0.05, e: 1.00, sp: 0.02, M: 0,    Bl: 0 },
    dachs:  { b: 0.60, d: 0.25, e: 0.30, sp: 0.05, M: 0.15, Bl: 0 },
    husky:  { b: 0.15, d: 0.15, e: 0.30, sp: 0.40, M: 0,    Bl: 0.80 },
    mutt:   { b: 0.30, d: 0.25, e: 0.40, sp: 0.50, M: 0.15, Bl: 0.05 },
    chihuahua: { b: 0.25, d: 0.20, e: 0.55, sp: 0.30, M: 0.10, Bl: 0 },  // almost any colour; merle about 10%
    pug:       { b: 0.15, d: 0.08, e: 0.90, sp: 0,    M: 0,    Bl: 0 },  // mostly fawn, about 19% black, rare apricot/silver; no merle, no piebald
    greyhound: { b: 0.20, d: 0.35, e: 0.50, sp: 0.35, M: 0,    Bl: 0 },  // black, blue, fawn, red, white-spotted; no merle (brindle not modelled)
    beagle:    { b: 0.10, d: 0.05, e: 0.35, sp: 0.40, M: 0,    Bl: 0 }   // mostly tricolour, some red/lemon and white; no merle
  };
  function randomGenotype(breedKey, rng) {
    const R = rngOf(rng), f = FREQ[breedOf(breedKey)];
    const pick = (rec, dom, p) => (R() < p ? rec : dom);
    const pair = (rec, dom, p) => { const a = pick(rec, dom, p), b = pick(rec, dom, p); return a === dom || b !== dom ? [a, b] : [b, a]; };
    return {
      B: pair('b', 'B', f.b),
      D: pair('d', 'D', f.d),
      E: pair('e', 'E', f.e),
      S: pair('sp', 'S', f.sp),
      M: R() < f.M ? ['M', 'm'] : ['m', 'm'],
      Bl: pair('bl', 'Bl', 1 - f.Bl)
    };
  }

  /* ---------- inheritance (Mendelian: one allele per locus from each parent) ---------- */
  function inherit(mumGenes, dadGenes, rng) {
    const R = rngOf(rng), m = normGenes(genesOf(mumGenes)), d = normGenes(genesOf(dadGenes)), out = {};
    LOCUS_KEYS.forEach((k) => { out[k] = [m[k][R() < 0.5 ? 0 : 1], d[k][R() < 0.5 ? 0 : 1]]; });
    return out;
  }

  /** true when the pair could make a double-merle (M/M) puppy: both carry M, visible or hidden (cryptic merle on e/e). */
  function isDoubleMerle(a, b) {
    const ga = normGenes(genesOf(a)), gb = normGenes(genesOf(b));
    return has(ga.M, 'M') && has(gb.M, 'M');
  }

  /* ---------- relatives check ----------
     Blocks: same dog, parent/child, full or half siblings, grandparent/grandchild,
     aunt/uncle/niece/nephew, first cousins. (Second cousins and great-grandparents are allowed.)
     Implemented as: the two dogs share any ancestor within 2 generations (each dog counts as its own
     generation-0 ancestor). dog = { id, parents: [idA, idB] | null }; allDogs = array or { id: dog } map. */
  function related(dogA, dogB, allDogs) {
    if (!dogA || !dogB) return false;
    if (dogA.id != null && dogA.id === dogB.id) return true;
    const byId = {};
    if (Array.isArray(allDogs)) allDogs.forEach((d) => { if (d && d.id != null) byId[d.id] = d; });
    else if (allDogs && typeof allDogs === 'object') Object.keys(allDogs).forEach((k) => { byId[k] = allDogs[k]; });
    [dogA, dogB].forEach((d) => { if (d.id != null && !byId[d.id]) byId[d.id] = d; });
    const anc = (dog) => {
      const seen = new Set(); let gen = [dog.id];
      for (let depth = 0; depth <= 2; depth++) {
        const next = [];
        gen.forEach((id) => {
          if (id == null) return; seen.add(id);
          const d = byId[id] || (id === dog.id ? dog : null);
          if (d && Array.isArray(d.parents)) d.parents.forEach((p) => { if (p != null) next.push(p); });
        });
        gen = next;
      }
      return seen;
    };
    const a = anc(dogA), b = anc(dogB);
    for (const id of a) if (b.has(id)) return true;
    return false;
  }

  const api = { LOCI, LOCUS_KEYS, BREEDS, SIZE, STARTER_GENES, SHADES, FREQ, phenotype, pigment, randomGenotype, inherit, isDoubleMerle, related };
  root.PawGenes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
