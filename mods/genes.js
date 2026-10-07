/* Paw Haven: PawGenes (v1.5A, breeds extended in v1.7 to 10 and in v2.5 to 14). Loosely real dog coat genetics for the crayon dogs.
   Plain IIFE, no DOM. Matches the v2 doc (Genetics section) and V2_GENES.md.
   API: LOCI, STARTER_GENES, SHADES, phenotype(genes, breedKey, seed?), pigment(genes),
        randomGenotype(breedKey, rng), inherit(mumGenes, dadGenes, rng),
        isDoubleMerle(a, b), related(dogA, dogB, allDogs).
   v2 (additive): BREED_NAMES, MIXES, mixKey(a, b), mixOf(damKey, sireKey, rng), predict(genesA, genesB, keyA, keyB, opts?),
        coatCatalog(breedKey), describe(genes).
   v2.1 (additive): ancestry(rec, lookup, depth = 6), grandMix(anc), sparkleOdds(o), coatCatalog(breedKey, { all: true }),
        fracText(x), GRAND_RECIPES. See the doc comments below. */
(function (root) {
  'use strict';

  const BREEDS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie'];
  // Breed size for the v2 litter rules (small 1-3, medium 1-3, large 2-3 puppies).
  const SIZE = { shiba: 'medium', corgi: 'small', golden: 'large', dachs: 'small', husky: 'large', mutt: 'medium', chihuahua: 'small', pug: 'small', greyhound: 'large', beagle: 'medium',
    poodle: 'medium', collie: 'medium', samoyed: 'large', frenchie: 'small' };

  const LOCI = {
    B:  { name: 'Coat base (B locus, TYRP1)', alleles: ['B', 'b'], dominant: 'B', rule: 'B_ makes black pigment; b/b makes liver (chocolate) pigment, a liver nose and amber eyes.' }, // copy-ok: reference text, not shown in the game
    D:  { name: 'Dilution (D locus, MLPH)', alleles: ['D', 'd'], dominant: 'D', rule: 'd/d dilutes: black becomes blue, liver becomes lilac (isabella), red becomes cream.' },
    E:  { name: 'Red (E locus, MC1R)', alleles: ['E', 'e'], dominant: 'E', rule: 'e/e makes the coat grow only red pigment: red, gold or tan by breed (cream with d/d). It hides merle (cryptic merle).' },
    S:  { name: 'White spotting (S locus, MITF)', alleles: ['S', 'sp'], dominant: 'S', rule: 'S/sp gives small white markings; sp/sp gives extensive white piebald patches.' }, // copy-ok: reference text, not shown in the game
    M:  { name: 'Merle (M locus, PMEL)', alleles: ['M', 'm'], dominant: 'M', rule: 'M/m gives merle marbling on black or liver pigment (hidden on e/e). M/M (double merle) is never allowed.' },
    Bl: { name: 'Husky blue eyes (ALX4-type)', alleles: ['Bl', 'bl'], dominant: 'Bl', rule: 'Bl/Bl gives blue eyes; Bl/bl gives blue eyes with a 1 in 4 chance of odd eyes instead.' } // copy-ok: reference text, not shown in the game
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
    beagle:    { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // tricolour; carries chocolate, red, piebald
    // v2.5 breeds
    poodle:    { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // apricot; carries cream (b) and white (d)
    collie:    { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // black and white; carries chocolate
    samoyed:   { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // white; carries cream (b)
    frenchie:  { B: ['B', 'B'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }  // fawn with a dark mask; carries blue fawn
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
    /* v2.5 breeds. Starter cells (*) equal dogs/pawart_dogs.js (DOG ART lane):
       poodle apricot*  col #F2C48F (curls are mix(col, PEN), so every shade recolours them)
       collie black*    col #2A2628, light #FFFFFF = the white collar, blaze, chest, socks and tail tip
       samoyed white*   col #FBF6EC, light #FFFFFF, dark #E8DECB (off-white on purpose: pure #FFFFFF is the art's white-spot colour)
       frenchie fawn*   col #D9B48A, dark = the mask
       Breed folding: poodle e/e d/d is "White", e/e b/b is "Cream"; collie S/S (no spotting gene) is the tricolour pattern;
       frenchie E_ is the brindle look ("Dark fawn", there is no K locus), e/e d/d is "Blue fawn", e/e b/b is "Cream";
       samoyed is always e/e: "White", with b/b "Cream". */
    poodle: {
      red:      ['#F2C48F', '#FBE3C4', '#D9A066'], // * apricot
      cream:    ['#F7F1E6', '#FFFFFF', '#E2D6C2'], // white (not #FFFFFF: the curls must still show)
      redliver: ['#EFD8B0', '#FAEEDA', '#D2B486'], // cream, liver nose
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:    ['#6E4430', '#8E5E40', '#4E2E1E'], // chocolate
      blue:     ['#A3AAB5', '#C6CBD2', '#7F8794'], // silver
      lilac:    ['#C4A486', '#DDC4AA', '#A2846A']  // silver beige
    },
    collie: {
      black: ['#2A2628', '#FFFFFF', '#1D1A22'], // * black and white
      liver: ['#7A4A2E', '#FFFFFF', '#5A3420'], // chocolate (the merle form is "Red merle")
      blue:  ['#6E7F96', '#FFFFFF', '#55657A'],
      lilac: ['#A8949A', '#FFFFFF', '#8A777E'],
      red:   ['#C8743E', '#FFFFFF', '#94522A'], // red (e/e)
      cream: ['#EED2A0', '#FFFFFF', '#CFAE76']
    },
    samoyed: {
      red:      ['#FBF6EC', '#FFFFFF', '#E8DECB'], // * white
      redliver: ['#F2E2C4', '#FFF8EC', '#D9C29E'], // cream (biscuit)
      cream:    ['#F4E8D0', '#FFFAF0', '#DCCBA8'],
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:    ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:     ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac:    ['#A8949A', '#C2B2B7', '#8A777E']
    },
    frenchie: {
      red:      ['#D9B48A', '#EFD6B4', '#3A302E'], // * fawn, dark mask
      cream:    ['#D6C6AE', '#EADFCC', '#6E7F96'], // blue fawn, blue mask
      redliver: ['#EEDDC0', '#F8EFDE', '#9A7A5E'], // cream, soft liver mask
      black:    ['#7A5C44', '#A8865E', '#2B2430'], // dark fawn (the brindle look)
      liver:    ['#6E4430', '#8E5E40', '#4E2E1E'],
      blue:     ['#6E7F96', '#8291A6', '#55657A'],
      lilac:    ['#A8949A', '#BBA9AF', '#8A777E']
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
    beagle:    { red: 'Red', cream: 'Lemon', black: 'Tricolour', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour' },
    poodle:    { red: 'Apricot', cream: 'White', redliver: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Silver', lilac: 'Silver beige' },
    collie:    { red: 'Red', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    samoyed:   { red: 'White', redliver: 'Cream', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    frenchie:  { red: 'Fawn', cream: 'Blue fawn', redliver: 'Cream', black: 'Dark fawn', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' }
  };
  // Merle names follow the doc: named after the base pigment (dachshund merle is called "dapple").
  const MERLE_WORDS = { black: 'Black merle', liver: 'Liver merle', blue: 'Slate merle', lilac: 'Lilac merle' };
  const DAPPLE_WORDS = { black: 'Black dapple', liver: 'Chocolate dapple', blue: 'Blue dapple', lilac: 'Isabella dapple' };
  // Border Collie merles go by their show names (v2.5).
  const MERLE_BY = { collie: { black: 'Blue merle', liver: 'Red merle', blue: 'Slate merle', lilac: 'Lilac merle' } };
  // Breeds whose art always shows white breed markings (corgi blaze/chest, husky mask/belly, collie collar and blaze).
  const WHITE_MARKED = { corgi: true, husky: true, beagle: true, collie: true };
  // Beagle tricolours already say the white; no suffix.
  const TRI = { beagle: { black: 1, liver: 1, blue: 1, lilac: 1 } };
  // v2.5: a Border Collie with no spotting gene (S/S) shows the tricolour pattern (the tan comes through where the white would be).
  const TRI_SOLID = { collie: { black: 'Tricolour', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour' } };
  // v2.5: breeds with their own word for piebald (sp/sp). The black one is just the word, the others say the colour first.
  const PIED = { poodle: 'parti', frenchie: 'pied' };
  // Breed shade key for red pigment on b/b (liver nose): pug apricot, greyhound red, v2.5 cream.
  const RED_LIVER = { pug: 'apricot', greyhound: 'redliver', poodle: 'redliver', samoyed: 'redliver', frenchie: 'redliver' };

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

  function shadeKey(g, breed, pig) {
    return pig === 'red' && both(g.B, 'b') && RED_LIVER[breed] ? RED_LIVER[breed] : pig;
  }

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
    // breed-specific shade keys: pug apricot (e/e + b/b), greyhound red (e/e + b/b, liver nose), v2.5 cream
    const sk = shadeKey(g, breed, pig);
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
    if (merle) name = (breed === 'dachs' ? DAPPLE_WORDS : MERLE_BY[breed] || MERLE_WORDS)[pig];
    else name = WORDS[breed][sk] || WORDS[breed][pig];
    if (white === 0.6 && PIED[breed]) name = pig === 'black' && !merle ? PIED[breed][0].toUpperCase() + PIED[breed].slice(1) : name + ' ' + PIED[breed];
    else if (white === 0.6) name += ' & white piebald';
    else if (TRI_SOLID[breed] && !merle && !white && TRI_SOLID[breed][pig]) name = TRI_SOLID[breed][pig];
    else if (MERLE_BY[breed] && merle) { /* "Blue merle" already says the white */ }
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
    beagle:    { b: 0.10, d: 0.05, e: 0.35, sp: 0.40, M: 0,    Bl: 0 },  // mostly tricolour, some red/lemon and white; no merle
    // v2.5 breeds
    poodle:    { b: 0.30, d: 0.25, e: 0.45, sp: 0.10, M: 0,    Bl: 0 },  // black, apricot, chocolate, silver, white, cream, parti; no merle
    collie:    { b: 0.25, d: 0.05, e: 0.10, sp: 0.50, M: 0.20, Bl: 0 },  // black and white, tricolour, chocolate, rare red; merle 20%
    samoyed:   { b: 0.15, d: 0,    e: 1.00, sp: 0,    M: 0,    Bl: 0 },  // always white, sometimes cream (b/b)
    frenchie:  { b: 0.10, d: 0.20, e: 0.72, sp: 0.35, M: 0,    Bl: 0 }   // fawn, dark fawn, pied, blue fawn, cream; no merle
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

  /* =====================================================================
     v2 additions (GENES lane). Additive: nothing above changed, phenotype() is untouched.
     MIXES, BREED_NAMES, mixKey, mixOf, predict, coatCatalog, describe.
     ===================================================================== */
  const BREED_NAMES = { shiba: 'Shiba', corgi: 'Corgi', golden: 'Golden', dachs: 'Dachshund', husky: 'Husky', mutt: 'Mutt', chihuahua: 'Chihuahua', pug: 'Pug', greyhound: 'Greyhound', beagle: 'Beagle',
    poodle: 'Poodle', collie: 'Border Collie', samoyed: 'Samoyed', frenchie: 'French Bulldog' };

  /** Canonical table key for a pair: the two breed keys in BREEDS order joined by '|', e.g. 'corgi|husky'. */
  function mixKey(a, b) {
    const x = breedOf(a), y = breedOf(b);
    return BREEDS.indexOf(x) <= BREEDS.indexOf(y) ? x + '|' + y : y + '|' + x;
  }
  /* All 91 pairs of the 14 breeds (45 of the first 10, v2.5 added 46) -> { name, head }. head = the breed with the more striking head.
     Real portmanteaus where they exist; invented cute ones otherwise. Mutt pairs: "Mutt mix", head = the other breed
     (mixOf() applies the 50% mutt-head rule on top). */
  const MIX_LIST = [
    ['shiba', 'corgi', 'Shorgi', 'shiba'],         ['shiba', 'golden', 'Goldiba', 'shiba'],
    ['shiba', 'dachs', 'Shibadox', 'shiba'],       ['shiba', 'husky', 'Shusky', 'husky'],
    ['shiba', 'chihuahua', 'Chiba', 'chihuahua'],  ['shiba', 'pug', 'Pugiba', 'pug'],
    ['shiba', 'greyhound', 'Shibahound', 'shiba'], ['shiba', 'beagle', 'Shibeagle', 'shiba'],
    ['corgi', 'golden', 'Gorgi', 'corgi'],         ['corgi', 'dachs', 'Dorgi', 'corgi'],
    ['corgi', 'husky', 'Horgi', 'husky'],          ['corgi', 'chihuahua', 'Chigi', 'corgi'],
    ['corgi', 'pug', 'Porgi', 'pug'],              ['corgi', 'greyhound', 'Greygi', 'corgi'],
    ['corgi', 'beagle', 'Beagi', 'corgi'],         ['golden', 'dachs', 'Goldendox', 'dachs'],
    ['golden', 'husky', 'Goberian', 'husky'],      ['golden', 'chihuahua', 'Goldenchi', 'chihuahua'],
    ['golden', 'pug', 'Pugolden', 'pug'],          ['golden', 'greyhound', 'Goldhound', 'golden'],
    ['golden', 'beagle', 'Beago', 'golden'],       ['dachs', 'husky', 'Dusky', 'husky'],
    ['dachs', 'chihuahua', 'Chiweenie', 'chihuahua'], ['dachs', 'pug', 'Daug', 'pug'],
    ['dachs', 'greyhound', 'Greydox', 'dachs'],    ['dachs', 'beagle', 'Doxle', 'beagle'],
    ['husky', 'chihuahua', 'Chusky', 'husky'],     ['husky', 'pug', 'Hug', 'husky'],
    ['husky', 'greyhound', 'Greysky', 'husky'],    ['husky', 'beagle', 'Beaski', 'husky'],
    ['chihuahua', 'pug', 'Chug', 'pug'],           ['chihuahua', 'greyhound', 'Greyhuahua', 'chihuahua'],
    ['chihuahua', 'beagle', 'Cheagle', 'chihuahua'], ['pug', 'greyhound', 'Greypug', 'pug'],
    ['pug', 'beagle', 'Puggle', 'pug'],            ['greyhound', 'beagle', 'Greagle', 'beagle'],
    // v2.5: the four new breeds with the nine old non-mutt breeds (36), then among themselves (6)
    ['shiba', 'poodle', 'Shiba-poo', 'poodle'],    ['corgi', 'poodle', 'Corgipoo', 'corgi'],
    ['golden', 'poodle', 'Goldendoodle', 'poodle'], ['dachs', 'poodle', 'Doxiepoo', 'poodle'],
    ['husky', 'poodle', 'Huskypoo', 'husky'],      ['chihuahua', 'poodle', 'Chipoo', 'chihuahua'],
    ['pug', 'poodle', 'Pugapoo', 'pug'],           ['greyhound', 'poodle', 'Greydoodle', 'poodle'],
    ['beagle', 'poodle', 'Poogle', 'poodle'],
    ['corgi', 'collie', 'Borgi', 'collie'],        ['shiba', 'collie', 'Border Shiba', 'shiba'],
    ['golden', 'collie', 'Golden Collie', 'collie'], ['dachs', 'collie', 'Border Doxie', 'collie'],
    ['husky', 'collie', 'Border Husky', 'husky'],  ['chihuahua', 'collie', 'Border Chi', 'chihuahua'],
    ['pug', 'collie', 'Border Pug', 'pug'],        ['greyhound', 'collie', 'Border Grey', 'collie'],
    ['beagle', 'collie', 'Border Beagle', 'beagle'],
    ['husky', 'samoyed', 'Samusky', 'samoyed'],    ['shiba', 'samoyed', 'Sammy Shiba', 'samoyed'],
    ['corgi', 'samoyed', 'Sammy Corgi', 'corgi'],  ['golden', 'samoyed', 'Golden Sammy', 'samoyed'],
    ['dachs', 'samoyed', 'Sammy Doxie', 'samoyed'], ['chihuahua', 'samoyed', 'Sammy Chi', 'chihuahua'],
    ['pug', 'samoyed', 'Sammy Pug', 'pug'],        ['greyhound', 'samoyed', 'Sammy Grey', 'samoyed'],
    ['beagle', 'samoyed', 'Sammy Beagle', 'samoyed'],
    ['pug', 'frenchie', 'Frug', 'frenchie'],       ['shiba', 'frenchie', 'French Shiba', 'frenchie'],
    ['corgi', 'frenchie', 'French Corgi', 'corgi'], ['golden', 'frenchie', 'French Golden', 'frenchie'],
    ['dachs', 'frenchie', 'French Doxie', 'frenchie'], ['husky', 'frenchie', 'French Husky', 'husky'],
    ['chihuahua', 'frenchie', 'French Chi', 'frenchie'], ['greyhound', 'frenchie', 'French Grey', 'frenchie'],
    ['beagle', 'frenchie', 'French Beagle', 'beagle'],
    ['poodle', 'collie', 'Bordoodle', 'poodle'],   ['poodle', 'samoyed', 'Samoodle', 'poodle'],
    ['poodle', 'frenchie', 'Froodle', 'frenchie'], ['collie', 'samoyed', 'Border Sammy', 'collie'],
    ['collie', 'frenchie', 'French Collie', 'frenchie'], ['samoyed', 'frenchie', 'French Sammy', 'frenchie']
  ];
  const MIXES = {};
  MIX_LIST.forEach((m) => { MIXES[mixKey(m[0], m[1])] = { name: m[2], head: m[3] }; });
  BREEDS.forEach((k) => { if (k !== 'mutt') MIXES[mixKey('mutt', k)] = { name: 'Mutt mix', head: k }; });

  /**
   * mixOf(damKey, sireKey, rng) -> { a: damKey, b: sireKey, body, head, name } | null
   * - Same breed (incl. mutt x mutt): returns null = purebred, no mix (puppy key = that breed).
   * - Mutt x anything: body 'mutt', name 'Mutt mix', head = the other breed when rng() < 0.5, else 'mutt'.
   * - Otherwise: body = dam's breed when rng() < 0.5, else sire's; head = MIXES head, or the other parent's
   *   breed when the body already is the head breed (so a mix always shows both parents).
   * rng is called exactly once (body or mutt head). Unknown keys count as 'mutt'.
   */
  function mixOf(damKey, sireKey, rng) {
    const R = rngOf(rng), a = breedOf(damKey), b = breedOf(sireKey);
    if (a === b) return null;
    const t = MIXES[mixKey(a, b)];
    if (a === 'mutt' || b === 'mutt') {
      const other = a === 'mutt' ? b : a;
      return { a, b, body: 'mutt', head: R() < 0.5 ? other : 'mutt', name: t.name };
    }
    const body = R() < 0.5 ? a : b;
    const head = body === t.head ? (body === a ? b : a) : t.head;
    return { a, b, body, head, name: t.name };
  }

  /* ---------- exact odds ---------- */
  // Eye outcome probabilities, mirroring phenotype(): Bl/Bl blue; Bl/bl blue 3/4, odd 1/4;
  // visible merle: odd 0.15, blue 0.10, else amber (b/b) or brown; b/b amber; else brown.
  function eyeDist(g) {
    if (has(g.Bl, 'Bl')) return both(g.Bl, 'Bl') ? { blue: 1 } : { blue: 0.75, odd: 0.25 };
    const pig = pigment(g), visMerle = has(g.M, 'M') && pig !== 'red' && pig !== 'cream';
    const base = both(g.B, 'b') ? 'amber' : 'brown';
    if (visMerle) { const o = { odd: 0.15, blue: 0.10 }; o[base] = 0.75; return o; }
    return { [base]: 1 };
  }
  function oddsText(p) {
    if (p >= 0.995) return 'every puppy';
    const n = 1 / p, r = Math.round(n);
    return (Math.abs(n - r) < 0.02 * n ? '1 in ' : 'about 1 in ') + Math.max(1, r);
  }
  // all unordered genotype classes of the 6 loci with their probability for a pair of parents
  function offspringDist(ga, gb) {
    const per = LOCUS_KEYS.map((k) => {
      const m = {};
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const pr = [ga[k][i], gb[k][j]], key = pr.join('/');
        m[key] = (m[key] || 0) + 0.25;
      }
      return Object.keys(m).map((key) => ({ pair: key.split('/'), p: m[key] }));
    });
    const out = [];
    (function rec(i, g, p) {
      if (i === LOCUS_KEYS.length) { out.push({ g: Object.assign({}, g), p }); return; }
      per[i].forEach((o) => { g[LOCUS_KEYS[i]] = o.pair; rec(i + 1, g, p * o.p); });
    })(0, {}, 1);
    return out; // covers the 4096 allele combinations exactly (merged by ordered pair)
  }

  /**
   * predict(genesA, genesB, keyA, keyB, opts?) -> [{ coat, eyes, pct, odds }] sorted by pct (desc), then coat, eyes.
   * - genesA = dam, genesB = sire (genes objects or dogs with .genes). Exact enumeration of all 4^6 = 4096
   *   allele combinations. M/M (double merle) outcomes are non-viable: removed, the rest renormalised.
   * - coat = phenotype().coatName for the BODY breed: keyA (the dam's breed), except 'mutt' when either parent
   *   is a mutt (mixOf always gives a mutt body then). opts.body overrides it.
   * - Rows are per (coat, eyes): eyes is a fixed label ('brown' | 'amber' | 'blue' | 'odd') and a coat with a
   *   chance of odd/blue eyes is split into separate rows (e.g. Bl/bl: 75% blue row, 25% odd row).
   *   opts.byCoat = true merges rows by coat only; eyes is then the most likely label for that coat.
   * - pct is an unrounded number (rows sum to 100 within float error); odds is plain text ('1 in 32').
   * - Returns [] when every outcome would be M/M.
   */
  function predict(genesA, genesB, keyA, keyB, opts) {
    opts = opts || {};
    const ga = normGenes(genesOf(genesA)), gb = normGenes(genesOf(genesB));
    const body = opts.body ? breedOf(opts.body) : (breedOf(keyA) === 'mutt' || (keyB != null && breedOf(keyB) === 'mutt')) ? 'mutt' : breedOf(keyA);
    const rows = {}, coatEyes = {};
    let viable = 0;
    offspringDist(ga, gb).forEach(({ g, p }) => {
      if (both(g.M, 'M')) return;
      viable += p;
      const coat = phenotype(g, body).coatName, ed = eyeDist(g);
      Object.keys(ed).forEach((e) => {
        const key = opts.byCoat ? coat : coat + '\u0000' + e;
        if (!rows[key]) rows[key] = { coat, eyes: e, p: 0 };
        rows[key].p += p * ed[e];
        const ce = coatEyes[coat] || (coatEyes[coat] = {});
        ce[e] = (ce[e] || 0) + p * ed[e];
      });
    });
    if (viable <= 0) return [];
    return Object.keys(rows).map((k) => {
      const r = rows[k];
      if (opts.byCoat) { const ce = coatEyes[r.coat]; r.eyes = Object.keys(ce).sort((x, y) => ce[y] - ce[x])[0]; }
      const q = r.p / viable;
      return { coat: r.coat, eyes: r.eyes, pct: q * 100, odds: oddsText(q) };
    }).sort((x, y) => y.pct - x.pct || (x.coat < y.coat ? -1 : x.coat > y.coat ? 1 : 0) || (x.eyes < y.eyes ? -1 : 1));
  }

  /* ---------- coat catalog ---------- */
  // unordered genotype classes allowed by a breed's FREQ (0 -> dominant only, 1 -> recessive only)
  function locusClasses(rec, dom, p) {
    const out = [];
    if (p < 1) out.push({ pair: [dom, dom], p: (1 - p) * (1 - p) });
    if (p > 0 && p < 1) out.push({ pair: [dom, rec], p: 2 * p * (1 - p) });
    if (p > 0) out.push({ pair: [rec, rec], p: p * p });
    return out;
  }
  function breedSpace(breed) {
    const f = FREQ[breed];
    const per = [
      ['B', locusClasses('b', 'B', f.b)], ['D', locusClasses('d', 'D', f.d)], ['E', locusClasses('e', 'E', f.e)],
      ['S', locusClasses('sp', 'S', f.sp)],
      ['M', f.M > 0 ? [{ pair: ['m', 'm'], p: 1 - f.M }, { pair: ['M', 'm'], p: f.M }] : [{ pair: ['m', 'm'], p: 1 }]],
      ['Bl', locusClasses('bl', 'Bl', 1 - f.Bl)]
    ];
    const out = [];
    (function rec(i, g, p) {
      if (i === per.length) { out.push({ g: Object.assign({}, g), p }); return; }
      per[i][1].forEach((o) => { g[per[i][0]] = o.pair; rec(i + 1, g, p * o.p); });
    })(0, {}, 1);
    return out;
  }
  const PIG_NEED = {
    red: 'red genes from both parents',
    cream: 'red and dilute genes from both parents',
    black: 'a dark (non-red) gene from at least one parent',
    liver: 'chocolate genes from both parents',
    blue: 'dilute genes from both parents',
    lilac: 'chocolate and dilute genes from both parents',
    apricot: 'red and chocolate genes from both parents',
    redliver: 'red and chocolate genes from both parents'
  };
  function hintFor(breed, sk, merle, whiteLvl, p, defaultSk) {
    const f = FREQ[breed], parts = [];
    // a pigment that every dog of this breed has (golden: always e/e) needs no hint
    const fixedRed = f.e >= 1 && (sk === 'red');
    if (sk !== defaultSk && !fixedRed) parts.push(f.e >= 1 && sk === 'cream' ? PIG_NEED.blue : f.e >= 1 && sk === 'redliver' ? PIG_NEED.liver : PIG_NEED[sk]);
    if (merle) parts.push('one ' + (breed === 'dachs' ? 'dapple' : 'merle') + ' parent (never two)');
    if (whiteLvl === 2) parts.push('spotting genes from both parents');
    else if (whiteLvl === 1 && !WHITE_MARKED[breed]) parts.push('a spotting gene from one parent');
    else if (whiteLvl === 0 && TRI_SOLID[breed] && TRI_SOLID[breed][sk] && !merle) parts.push('solid-coat genes from both parents');
    let s;
    if (!parts.length) s = 'The classic ' + BREED_NAMES[breed] + ' look.';
    else if (parts.length === 1 && sk === 'blue' && !merle) s = 'Two parents who carry dilute can make this soft blue.';
    else {
      const last = parts.pop();
      s = 'Needs ' + (parts.length ? parts.join(', ') + ' and ' : '') + last + '.';
    }
    if (p < 0.005) s += ' Very rare!';
    return s;
  }
  const catalogCache = {};
  /**
   * coatCatalog(breedKey) -> [{ coat, rare, how }] sorted from most to least common.
   * Every coatName phenotype() can produce for the breed from the genotypes randomGenotype() can produce
   * (FREQ: a 0 frequency locks the dominant allele, 1 locks the recessive one; pug: no merle or piebald, ...).
   * rare = lilac, cream, apricot, greyhound red or any visible merle, or under 1% of random dogs of the breed.
   * Returns fresh copies (safe to mutate).
   */
  function coatCatalog(breedKey) {
    const breed = breedOf(breedKey);
    if (!catalogCache[breed]) {
      const byName = {}, pigP = {};
      breedSpace(breed).forEach(({ g, p }) => {
        const ph = phenotype(g, breed);
        const sk = shadeKey(g, breed, ph.pigment);
        pigP[sk] = (pigP[sk] || 0) + p;
        const e = byName[ph.coatName] || (byName[ph.coatName] = { coat: ph.coatName, p: 0, sk, merle: ph.coat.merle, white: both(g.S, 'sp') ? 2 : has(g.S, 'sp') ? 1 : 0 });
        e.p += p;
      });
      const defaultSk = Object.keys(pigP).sort((x, y) => pigP[y] - pigP[x])[0];
      catalogCache[breed] = Object.keys(byName).map((n) => byName[n])
        .sort((x, y) => y.p - x.p || (x.coat < y.coat ? -1 : 1))
        .map((e) => ({
          coat: e.coat,
          rare: e.merle || e.sk === 'lilac' || e.sk === 'cream' || e.sk === 'apricot' || e.sk === 'redliver' || e.p < 0.01,
          how: hintFor(breed, e.sk, e.merle, e.white, e.p, defaultSk),
          p: e.p
        }));
    }
    return catalogCache[breed].map((e) => ({ coat: e.coat, rare: e.rare, how: e.how }));
  }

  /* ---------- gene test text ---------- */
  /**
   * describe(genes) -> { lines: [string x6], carriers: [string], summary: string }
   * lines: one per locus in B, D, E, S, M, Bl order, dominant allele first, e.g. 'B/b: black coat, carries liver'.
   * carriers: hidden genes this dog can pass on, from ['liver', 'dilute', 'red', 'piebald', 'merle'] in that order
   *   ('merle' only when it is hidden by a red coat). summary: one plain sentence for the vet card.
   */
  function describe(genes) {
    const g = normGenes(genesOf(genes)), red = both(g.E, 'e');
    const fmt = (k, dom) => { const p = g[k]; return (p[0] === dom || p[1] !== dom ? p[0] + '/' + p[1] : p[1] + '/' + p[0]); };
    const lines = [], carriers = [];
    const hidden = red ? ' (hidden under the red coat)' : '';
    // B
    if (both(g.B, 'b')) lines.push(fmt('B', 'B') + ': liver (chocolate) pigment' + hidden + ', amber eyes');
    else if (has(g.B, 'b')) { lines.push(fmt('B', 'B') + ': black ' + (red ? 'pigment (nose and eye rims)' : 'coat') + ', carries liver'); carriers.push('liver'); }
    else lines.push(fmt('B', 'B') + ': black ' + (red ? 'pigment (nose and eye rims)' : 'coat'));
    // D
    if (both(g.D, 'd')) lines.push(fmt('D', 'D') + ': dilute, soft colour (' + (red ? 'red becomes cream' : both(g.B, 'b') ? 'liver becomes lilac' : 'black becomes blue') + ')');
    else if (has(g.D, 'd')) { lines.push(fmt('D', 'D') + ': full colour, carries dilute'); carriers.push('dilute'); }
    else lines.push(fmt('D', 'D') + ': full colour');
    // E
    if (red) lines.push(fmt('E', 'E') + ': red coat (red, gold or fawn by breed)');
    else if (has(g.E, 'e')) { lines.push(fmt('E', 'E') + ': dark coat, carries red'); carriers.push('red'); }
    else lines.push(fmt('E', 'E') + ': dark coat, no red gene');
    // S
    if (both(g.S, 'sp')) lines.push(fmt('S', 'S') + ': piebald, big white patches');
    else if (has(g.S, 'sp')) { lines.push(fmt('S', 'S') + ': small white markings, carries piebald'); carriers.push('piebald'); }
    else lines.push(fmt('S', 'S') + ': no extra white');
    // M (M/M is never bred, but describe it honestly if handed one)
    if (both(g.M, 'M')) lines.push('M/M: double merle');
    else if (has(g.M, 'M')) {
      if (red) { lines.push(fmt('M', 'M') + ': hidden merle (the red coat hides the marbling)'); carriers.push('merle'); }
      else lines.push(fmt('M', 'M') + ': merle marbling (never pair with another merle)');
    } else lines.push(fmt('M', 'M') + ': no merle');
    // Bl
    if (both(g.Bl, 'Bl')) lines.push(fmt('Bl', 'Bl') + ': blue eyes');
    else if (has(g.Bl, 'Bl')) lines.push(fmt('Bl', 'Bl') + ': blue eyes (sometimes one blue, one brown)');
    else lines.push(fmt('Bl', 'Bl') + ': no blue-eye gene');

    const PUP = { liver: 'chocolate', dilute: 'blue', red: 'red', piebald: 'piebald', merle: 'merle' };
    const list = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
    const summary = carriers.length
      ? 'Carries ' + list(carriers) + '. With the right partner, ' + list(carriers.map((c) => PUP[c])).replace(/ and ([^ ]+)$/, ' or $1') + ' puppies are possible.'
      : 'No hidden surprises: this dog passes on what you see.';
    return { lines, carriers, summary };
  }

  /* =====================================================================
     v2.1 additions (GENES lane, V21.md section 3). Additive and pure: nothing above changed.
     ancestry, grandMix, sparkleOdds, coatCatalog(k, { all: true }), fracText.
     ===================================================================== */

  /* ---------- coat catalog over ANY genotype (mix puppies) ---------- */
  // Alleles a breed's FREQ never produces (0 locks the dominant allele, 1 locks the recessive one).
  // Bl is left out: it never changes the coat name.
  function foreignAlleles(breed) {
    const f = FREQ[breed], out = {};
    if (f.b <= 0) out.b = 1; if (f.b >= 1) out.B = 1;
    if (f.d <= 0) out.d = 1; if (f.d >= 1) out.D = 1;
    if (f.e <= 0) out.e = 1; if (f.e >= 1) out.E = 1;
    if (f.sp <= 0) out.sp = 1; if (f.sp >= 1) out.S = 1;
    if (f.M <= 0) out.M = 1;
    return out;
  }
  const FOREIGN_WORDS = { b: 'chocolate', B: 'black', d: 'dilute', D: 'full-colour', e: 'red', E: 'dark-coat', sp: 'spotting', S: 'solid-coat', M: 'merle' };
  const FOREIGN_ORDER = ['E', 'e', 'B', 'b', 'D', 'd', 'S', 'sp', 'M'];
  const ALL_PAIRS = { B: [['B', 'B'], ['B', 'b'], ['b', 'b']], D: [['D', 'D'], ['D', 'd'], ['d', 'd']], E: [['E', 'E'], ['E', 'e'], ['e', 'e']], S: [['S', 'S'], ['S', 'sp'], ['sp', 'sp']], M: [['m', 'm'], ['M', 'm']] };
  const allCatalogCache = {};
  /** The coat names phenotype() can give a body breed from any viable genotype (M/M excluded), that the breed's own
      genotypes cannot: [{ coat, rare: true, how, extra: true }], fewest foreign genes first. */
  function extraCoats(breed) {
    if (allCatalogCache[breed]) return allCatalogCache[breed];
    const own = {}; coatCatalog(breed).forEach((c) => { own[c.coat] = 1; });
    const foreign = foreignAlleles(breed), best = {};
    const loci = ['B', 'D', 'E', 'S', 'M'];
    (function rec(i, g) {
      if (i === loci.length) {
        const name = phenotype(Object.assign({ Bl: ['bl', 'bl'] }, g), breed).coatName;
        if (own[name]) return;
        const need = {};
        loci.forEach((k) => { g[k].forEach((a) => { if (foreign[a]) need[a] = 1; }); });
        const list = FOREIGN_ORDER.filter((a) => need[a]);
        if (!best[name] || list.length < best[name].length) best[name] = list;
        return;
      }
      ALL_PAIRS[loci[i]].forEach((p) => { g[loci[i]] = p; rec(i + 1, g); });
    })(0, {});
    const words = (l) => { const w = l.map((a) => FOREIGN_WORDS[a]); return w.length <= 1 ? w.join('') : w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1]; };
    allCatalogCache[breed] = Object.keys(best)
      .sort((x, y) => best[x].length - best[y].length || (x < y ? -1 : 1))
      .map((name) => {
        const l = best[name];
        let how = 'Only from a mix parent' + (l.length ? ' with ' + words(l) + ' genes.' : '.');
        if (l.indexOf('M') >= 0) how += ' Never pair two merles.';
        return { coat: name, rare: true, how, extra: true };
      });
    return allCatalogCache[breed];
  }
  /**
   * coatCatalog(breedKey, { all: true }) -> the default catalog (unchanged, same order), followed by every other coat
   * phenotype() can give this body breed from ANY genotype (a mix puppy), flagged extra: true with a how hint
   * like 'Only from a mix parent with merle genes.'. Without { all: true } it is exactly the v2 coatCatalog.
   */
  function coatCatalogV21(breedKey, opts) {
    const base = coatCatalog(breedKey);
    if (!opts || !opts.all) return base;
    return base.concat(extraCoats(breedOf(breedKey)).map((e) => ({ coat: e.coat, rare: e.rare, how: e.how, extra: true })));
  }

  /* ---------- ancestry ---------- */
  const ANC_UNITS = 64;
  function parentIds(rec) {
    const p = rec && rec.parents;
    if (!p) return null;
    if (Array.isArray(p)) return p.length >= 2 && p[0] != null && p[1] != null ? [p[0], p[1]] : null;
    if (typeof p === 'object' && p.dam != null && p.sire != null) return [p.dam, p.sire];
    return null;
  }
  function validAnc(a) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
    return Object.keys(a).some((k) => typeof a[k] === 'number' && a[k] > 0);
  }
  // { key: share } with unknown keys folded into 'mutt' and non-positive shares dropped (unrounded)
  function foldAnc(a) {
    const out = {};
    Object.keys(a).forEach((k) => { const v = a[k]; if (typeof v === 'number' && v > 0 && isFinite(v)) { const b = breedOf(k); out[b] = (out[b] || 0) + v; } });
    return out;
  }
  function baseAnc(rec) {
    const m = rec && rec.mix, out = {};
    if (m && m.a != null && m.b != null) { out[breedOf(m.a)] = (out[breedOf(m.a)] || 0) + 0.5; out[breedOf(m.b)] = (out[breedOf(m.b)] || 0) + 0.5; return out; }
    out[breedOf(rec && rec.key)] = 1;
    return out;
  }
  // Round to multiples of 1/64 that still sum to exactly 1 (largest remainder, ties in BREEDS order).
  function roundAnc(a) {
    const keys = Object.keys(a).sort((x, y) => BREEDS.indexOf(x) - BREEDS.indexOf(y));
    const tot = keys.reduce((s, k) => s + a[k], 0) || 1;
    const units = keys.map((k) => { const u = a[k] / tot * ANC_UNITS; return { k, n: Math.floor(u + 1e-9), r: u - Math.floor(u + 1e-9) }; });
    let left = ANC_UNITS - units.reduce((s, u) => s + u.n, 0);
    units.slice().sort((x, y) => y.r - x.r || BREEDS.indexOf(x.k) - BREEDS.indexOf(y.k)).forEach((u) => { if (left > 0) { u.n++; left--; } });
    const out = {};
    units.forEach((u) => { if (u.n > 0) out[u.k] = u.n / ANC_UNITS; });
    return out;
  }
  /**
   * ancestry(rec, lookup, depth = 6) -> { breedKey: fraction } (multiples of 1/64, summing to 1), or null without a rec.
   * - rec / lookup(id) records: { id, key, mix, parents, anc? }. parents is [idA, idB] or { dam, sire }.
   * - rec.anc (a non-empty object) is returned unchanged. A parent's anc is used as that parent's share.
   * - Both parents resolve: the average of their ancestries (recursive, memoised by id for this call).
   *   Otherwise, or past `depth` generations: mix { a, b } -> { a: 1/2, b: 1/2 }, else { key: 1 }.
   * - Unknown breed keys count as 'mutt'. Pure: lookup is only read.
   */
  function ancestry(rec, lookup, depth) {
    if (!rec || typeof rec !== 'object') return null;
    if (validAnc(rec.anc)) return rec.anc;
    const D = depth == null ? 6 : Math.max(0, Math.floor(Number(depth) || 0));
    const look = typeof lookup === 'function' ? lookup : () => null;
    const memo = new Map(), busy = new Set();
    function raw(r, left) {
      if (validAnc(r.anc)) return foldAnc(r.anc);
      const id = r.id;
      const mk = id != null ? id + '\u0000' + left : null;
      if (mk != null && memo.has(mk)) return memo.get(mk);
      let out;
      const pids = left > 0 ? parentIds(r) : null;
      let pa = null, pb = null;
      if (pids && !(id != null && busy.has(id))) {
        try { pa = look(pids[0]); pb = look(pids[1]); } catch (e) { pa = pb = null; }
      }
      if (pa && pb && typeof pa === 'object' && typeof pb === 'object') {
        if (id != null) busy.add(id);
        const a = raw(pa, left - 1), b = raw(pb, left - 1);
        if (id != null) busy.delete(id);
        out = {};
        [a, b].forEach((x) => Object.keys(x).forEach((k) => { out[k] = (out[k] || 0) + x[k] / 2; }));
      } else out = baseAnc(r);
      if (mk != null) memo.set(mk, out);
      return out;
    }
    return roundAnc(raw(rec, D));
  }

  /* ---------- grand-mixes ---------- */
  function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
  /** fracText(0.25) -> '1/4', fracText(0.375) -> '3/8', fracText(1) -> '1' (rounded to 1/64 first). */
  function fracText(x) {
    const n = Math.round(Number(x) * ANC_UNITS);
    if (n <= 0) return '0';
    if (n >= ANC_UNITS) return '1';
    const g = gcd(n, ANC_UNITS);
    return (n / g) + '/' + (ANC_UNITS / g);
  }
  const GRAND_RECIPES = [
    { name: 'Sled Noodle', breeds: ['corgi', 'husky', 'dachs'] },
    { name: 'Sunrise Loaf', breeds: ['shiba', 'corgi', 'golden'] },
    { name: 'Snowdrift', breeds: ['golden', 'husky', 'mutt'] }
  ];
  const AT = (x, t) => x >= t - 1e-9;
  /**
   * grandMix(anc) -> { kind, name, label, breeds: [[key, frac], ...] } (breeds sorted by share, ties in BREEDS order).
   * First matching rule wins:
   *  1. 4+ breeds at 1/8 or more: kind 'everything', 'The Everything Dog', label 'The Everything Dog: yes.'
   *  2. 3+ breeds at 1/4 or more: kind 'grand' for the 3 named recipes (label 'Sled Noodle: Corgi + Husky + Dachshund'),
   *     otherwise kind 'family', '<Top breed> family mix'.
   *  3. top breed 3/4 or more: kind 'breed', name = breed name, label 'Corgi, 1/4 Husky' (just 'Corgi' when pure).
   *  4. top two at 1/4 or more: kind 'mix', name = MIXES name, label 'Horgi: Corgi × Husky'.
   *  5. otherwise kind 'family', '<Top breed> family mix'.
   * Unknown keys count as 'mutt'. An empty or missing anc counts as { mutt: 1 }.
   */
  function grandMix(anc) {
    let a = validAnc(anc) ? foldAnc(anc) : { mutt: 1 };
    const breeds = Object.keys(a).map((k) => [k, a[k]]).sort((x, y) => y[1] - x[1] || BREEDS.indexOf(x[0]) - BREEDS.indexOf(y[0]));
    const nm = (k) => BREED_NAMES[k];
    const top = breeds[0], family = nm(top[0]) + ' family mix';
    const res = (kind, name, label) => ({ kind, name, label, breeds: breeds.map((b) => [b[0], b[1]]) });
    if (breeds.filter((b) => AT(b[1], 0.125)).length >= 4) return res('everything', 'The Everything Dog', 'The Everything Dog: yes.');
    const big = breeds.filter((b) => AT(b[1], 0.25));
    if (big.length >= 3) {
      const three = big.slice(0, 3).map((b) => b[0]);
      const r = GRAND_RECIPES.find((g) => g.breeds.every((k) => three.indexOf(k) >= 0));
      if (r) return res('grand', r.name, r.name + ': ' + r.breeds.map(nm).join(' + '));
      return res('family', family, family);
    }
    if (AT(top[1], 0.75)) {
      const rest = breeds.slice(1).filter((b) => fracText(b[1]) !== '0').map((b) => fracText(b[1]) + ' ' + nm(b[0]));
      return res('breed', nm(top[0]), [nm(top[0])].concat(rest).join(', '));
    }
    if (big.length >= 2) {
      const m = MIXES[mixKey(big[0][0], big[1][0])];
      return res('mix', m.name, m.name + ': ' + nm(big[0][0]) + ' × ' + nm(big[1][0]));
    }
    return res('family', family, family);
  }

  /* ---------- Sparkle odds ---------- */
  const multText = (x) => String(Math.round(x * 100) / 100);
  const bondLv = (b) => { const v = b && typeof b === 'object' ? b.level : b; return Number(v) || 0; };
  /**
   * sparkleOdds({ stone, sparkleParents: 0|1|2, bondA, bondB, base = 1/512 }) -> { p, mult, parts: [{ label, x }], text }
   * Boosts multiply: Sparkle Stone ×4; each Sparkle parent ×1.5 (one part, 'Sparkle parent' ×1.5 or
   * '2 Sparkle parents' ×2.25); both parents Bond 10 ×2, otherwise both Bond 8+ ×1.5.
   * bondA / bondB are levels (or { level }). text: '1 in 64 today: Sparkle Stone ×4, Bond 10 ×2', or '1 in 512'
   * with no boosts. Cosmetic only: these odds never change anything but the Sparkle roll.
   */
  function sparkleOdds(o) {
    o = o || {};
    const base = typeof o.base === 'number' && o.base > 0 ? o.base : 1 / 512;
    const parts = [];
    if (o.stone) parts.push({ label: 'Sparkle Stone', x: 4 });
    const sp = Math.max(0, Math.min(2, Math.floor(Number(o.sparkleParents) || 0)));
    if (sp === 1) parts.push({ label: 'Sparkle parent', x: 1.5 });
    else if (sp === 2) parts.push({ label: '2 Sparkle parents', x: 2.25 });
    const ba = bondLv(o.bondA), bb = bondLv(o.bondB);
    if (ba >= 10 && bb >= 10) parts.push({ label: 'Bond 10', x: 2 });
    else if (ba >= 8 && bb >= 8) parts.push({ label: 'Bond 8+', x: 1.5 });
    const mult = parts.reduce((m, q) => m * q.x, 1);
    const p = Math.min(1, base * mult);
    const odds = p >= 1 ? 'Every puppy' : '1 in ' + Math.max(1, Math.round(1 / p));
    const text = parts.length ? odds + ' today: ' + parts.map((q) => q.label + ' ×' + multText(q.x)).join(', ') : odds;
    return { p, mult, parts, text };
  }

  const api = { LOCI, LOCUS_KEYS, BREEDS, SIZE, STARTER_GENES, SHADES, FREQ, WORDS, WHITE_MARKED, phenotype, pigment, randomGenotype, inherit, isDoubleMerle, related,
    BREED_NAMES, MIXES, mixKey, mixOf, predict, coatCatalog: coatCatalogV21, describe,
    ancestry, grandMix, sparkleOdds, fracText, GRAND_RECIPES };
  root.PawGenes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
