/* ======================= v1.3: sex, age, hidden genes, breeding rules (data only) ======================= */
const STARTER_GENES = {
  shiba: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Red with cream markings', eyes: 'brown' },
  corgi: { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Red (tan) with white markings', eyes: 'brown' },
  golden: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Golden red', eyes: 'brown' },
  dachs: { B: ['b', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Chocolate (liver)', eyes: 'amber' },
  husky: { B: ['B', 'B'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['Bl', 'Bl'], coat: 'Grey and white', eyes: 'blue' },
  mutt: { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Black and white patches (piebald)', eyes: 'brown' },
  chihuahua: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Fawn', eyes: 'brown' },
  pug: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Fawn', eyes: 'brown' },
  greyhound: { B: ['B', 'B'], D: ['d', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Blue with white markings', eyes: 'brown' },
  beagle: { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Tricolour', eyes: 'brown' },
  poodle: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Apricot', eyes: 'brown' },
  collie: { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Black and white', eyes: 'brown' },
  samoyed: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'White', eyes: 'brown' },
  frenchie: { B: ['B', 'B'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Fawn', eyes: 'brown' },
  akita: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Red', eyes: 'brown' },
  spitz: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'White', eyes: 'brown' },
  pom: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Orange', eyes: 'brown' },
  afghan: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Red', eyes: 'brown' },
  dane: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Fawn', eyes: 'brown' },
  mastiff: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Fawn', eyes: 'brown' },
  gsd: { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Black and tan', eyes: 'brown' },
  // v2.12 (V212.md 3, the same as mods/genes.js)
  dobie: { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'E'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Black and rust', eyes: 'brown' },
  corso: { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Black', eyes: 'brown' },
  pitbull: { B: ['B', 'b'], D: ['d', 'd'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Blue', eyes: 'brown' },
  minpin: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Red', eyes: 'brown' },
  lab: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Yellow', eyes: 'brown' },
  malamute: { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Grey and white', eyes: 'brown' },
  chow: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Red', eyes: 'brown' },
  stdpoodle: { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Black', eyes: 'brown' },
  schnauzer: { B: ['B', 'B'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Salt and pepper', eyes: 'brown' },
  westie: { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'White', eyes: 'brown' },
  yorkie: { B: ['B', 'B'], D: ['d', 'd'], E: ['E', 'E'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Blue and tan', eyes: 'brown' },
  bichon: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'White', eyes: 'brown' },
  maltese: { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'White', eyes: 'brown' },
  shihtzu: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Gold and white', eyes: 'brown' },
  // v2.21 (V221.md 3, the same as mods/genes.js)
  dalmatian: { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Black spotted', eyes: 'brown' },
  bernese: { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Tricolour', eyes: 'brown' },
  aussie: { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], A: ['at', 'a'], coat: 'Black tricolour', eyes: 'brown' },
  cavalier: { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Blenheim', eyes: 'brown' },
  jrt: { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'White and tan', eyes: 'brown' }
};
/* v2.23 "Coat pick" (owner, 7 Nov 2026; V223.md): a starter comes home in one of its breed's real, common colours. Option 1 is always the
   STARTER_GENES coat above (unchanged); the extra options here are [coat name as PawGenes.phenotype gives it, the loci that differ from
   STARTER_GENES]. A token names one locus by its alleles ('Ee' E/e, 'bb' b/b, 'spsp' sp/sp, 'Mm' merle, one copy only). Every allele stays
   inside the breed's FREQ (mods/genes.js), so later puppies inherit real genes; test_v223_coats.js checks each name, FREQ and that no option is M/M. */
const STARTER_COATS = {
  shiba: [['Black and tan with cream urajiro', 'Ee'], ['Cream with cream urajiro', 'dd']],
  corgi: [['Cream and white', 'dd'], ['Black-headed tricolour', 'Ee atat']], // tan points (A locus, mods/genes.js TAN_ART): a black saddle and head, tan face and legs
  golden: [['Cream', 'dd'], ['Dark golden', 'II']], // II: the red-intensity locus (mods/genes.js RED_I)
  dachs: [['Black and tan', 'Bb'], ['Red', 'Bb ee'], ['Black dapple', 'Bb Mm']],
  husky: [['Red and white', 'ee'], ['Copper and white', 'bb']],
  mutt: [['Red with white markings', 'ee Ssp'], ['Chocolate & white piebald', 'bb'], ['Black merle with white markings', 'Ssp Mm']],
  chihuahua: [['Cream', 'dd'], ['Black and tan', 'Ee'], ['Chocolate and tan', 'bb Ee'], ['Fawn & white piebald', 'spsp']],
  pug: [['Black', 'Ee'], ['Silver fawn', 'dd']],
  greyhound: [['Black', 'Dd SS'], ['Fawn', 'Dd ee SS'], ['Black & white piebald', 'Dd spsp']],
  beagle: [['Red and white', 'ee'], ['Lemon and white', 'ee dd'], ['Chocolate tricolour', 'bb']],
  poodle: [['Black', 'Ee'], ['White', 'dd'], ['Chocolate', 'bb Ee'], ['Silver', 'dd Ee']],
  collie: [['Chocolate and white', 'bb'], ['Blue merle', 'Mm'], ['Red merle', 'bb Mm'], ['Tricolour', 'atat']], // Tricolour: black and white with tan points (A locus, mods/genes.js TAN_ART)
  samoyed: [],
  frenchie: [['Dark fawn', 'Ee'], ['Pied', 'Ee spsp']],
  akita: [['Sesame', 'Ee'], ['White', 'dd']],
  spitz: [],
  pom: [['Cream', 'dd'], ['Black', 'Ee'], ['Chocolate', 'bb Ee']],
  afghan: [['Cream', 'dd'], ['Black and tan', 'Ee'], ['Black', 'EE']],
  dane: [['Blue', 'dd Ee'], ['Harlequin', 'Ee spsp Mm'], ['Mantle', 'Ee spsp']],
  mastiff: [['Brindle', 'Ee']],
  gsd: [['Sable', 'ee'], ['Black', 'EE'], ['White', 'ee dd']],
  dobie: [['Red and rust', 'bb'], ['Blue and rust', 'dd'], ['Fawn and rust', 'bb dd']],
  corso: [['Grey', 'dd'], ['Fawn', 'ee']],
  pitbull: [['Black', 'Dd'], ['Fawn', 'Dd ee'], ['Red', 'bb Dd ee']],
  minpin: [['Black and rust', 'Ee'], ['Chocolate and rust', 'bb Ee']],
  lab: [['Black', 'Ee'], ['Chocolate', 'bb Ee'], ['Fox red', 'II']], // Fox red: the red-intensity locus (mods/genes.js RED_I)
  malamute: [['Black and white', 'EE'], ['Sable and white', 'ee'], ['Red and white', 'bb'], ['White', 'ee dd']],
  chow: [['Black', 'Ee'], ['Blue', 'Ee dd'], ['Cinnamon', 'bb Ee'], ['Cream', 'dd']],
  stdpoodle: [['White', 'ee dd'], ['Apricot', 'ee'], ['Red', 'BB ee'], ['Chocolate', 'bb']],
  schnauzer: [['Black', 'EE'], ['Black and silver', 'dd'], ['White', 'ee']],
  westie: [],
  yorkie: [['Black and tan', 'Dd'], ['Blue and tan parti', 'spsp']],
  bichon: [],
  maltese: [],
  shihtzu: [['Black and white', 'Ee'], ['Brindle and white', 'EE'], ['Liver and white', 'bb Ee'], ['Black', 'Ee SS']],
  dalmatian: [['Liver spotted', 'bb']],
  bernese: [],
  aussie: [['Blue merle tricolour', 'Mm'], ['Red tricolour', 'bb'], ['Red merle tricolour', 'bb Mm']],
  cavalier: [['Tricolour', 'Ee'], ['Ruby', 'SS'], ['Black and tan', 'Ee SS']],
  jrt: [['Tricolour', 'Ee'], ['White and black', 'EE']]
};
/* Eye choices (the owner: "different pupil colours"), only where real dogs have them. 'all': every coat (the blue-eye gene Bl: the husky's and
   the Aussie's FREQ allow it; the Border Collie (owner: "border collie can be black & white, or 3 mixed colours with different pupil colours") gets it
   only through this starter preset, its FREQ stays Bl 0 so random and rescue collies are as before; a merle coat keeps merle's own eye rolls);
   'merle': only a merle coat (merle itself gives the blue or odd eyes). Review fix (7 Nov 2026): no b/b stand-in colours that would give a
   breed amber eyes it does not have (Pug and Mastiff apricot, Samoyed, Frenchie and Bichon cream, Pom white, Dane, Corso and Pit Bull brindle, Corso red),
   and no Corgi black and white (a Cardigan colour). The Collie tricolour and the Corgi black-headed tricolour carry the tan-point locus A (at/at), the
   Lab fox red and the Golden dark golden the red-intensity locus I (I/I): both only through these presets, so random and rescue dogs are as before. */
const STARTER_EYES = { husky: 'all', aussie: 'all', collie: 'all', dachs: 'merle', dane: 'merle', mutt: 'merle' };
const COAT_LOCUS = { B: 'B', b: 'B', D: 'D', d: 'D', E: 'E', e: 'E', S: 'S', sp: 'S', M: 'M', m: 'M', Bl: 'Bl', bl: 'Bl', at: 'A', a: 'A', I: 'I', i: 'I' };
function coatGenes(key, diff) { // STARTER_GENES[key] (the loci only) with the diff tokens on top
  const g = STARTER_GENES[key] || STARTER_GENES.mutt, out = {};
  ['B', 'D', 'E', 'S', 'M', 'Bl', 'A', 'I'].forEach((k) => { if (g[k]) out[k] = g[k].slice(); });
  String(diff || '').split(/\s+/).filter(Boolean).forEach((t) => { const al = t.match(/sp|Bl|bl|at|[BbDdEeSMmaIi]/g); if (al && al.length === 2 && COAT_LOCUS[al[0]]) out[COAT_LOCUS[al[0]]] = al; });
  return out;
}
const coatPh = (genes, key, seed) => { const G = window.PawGenes; try { return G ? G.phenotype(genes, key, seed == null ? 'x' : seed) : null; } catch (e) { return null; } };
// the colour options of a starter: [{ coat, genes, merle, def }]; option 0 is the STARTER_GENES dog. coat: the English name phenotype() gives
function starterCoats(key) {
  const k = STARTER_GENES[key] ? key : 'mutt', d = coatGenes(k, ''), p = coatPh(d, k);
  return [{ coat: p ? p.coatName : STARTER_GENES[k].coat, genes: d, merle: false, def: true }].concat((STARTER_COATS[k] || []).map(([coat, diff]) => { const genes = coatGenes(k, diff); return { coat, genes, merle: genes.M.includes('M') }; }));
}
// the eye options for colour option i: [{ eyes, Bl }] (Bl: the blue-eye pair to use), or [] when the eyes simply follow the coat
function starterEyes(key, i) {
  const cs = starterCoats(key), c = cs[i] || cs[0], mode = STARTER_EYES[key], b = coatPh(Object.assign({}, c.genes, { Bl: ['bl', 'bl'], M: ['m', 'm'] }), key);
  if (!mode || (mode === 'merle' && !c.merle) || !b) return [];
  const base = b.eyes, bl = ['bl', 'bl'], het = ['Bl', 'bl']; // base: brown, or amber on a liver (b/b) coat
  if (c.merle) return [{ eyes: base, Bl: bl }, { eyes: 'blue', Bl: bl }, { eyes: 'odd', Bl: bl }]; // merle's own eye rolls (bl/bl)
  const own = c.genes.Bl, two = own[0] === 'Bl' && own[1] === 'Bl';
  const L = [{ eyes: base, Bl: bl }, { eyes: 'blue', Bl: two ? own.slice() : het }, { eyes: 'odd', Bl: het }];
  if (two) L.unshift(L.splice(1, 1)[0]); // the husky: blue (Bl/Bl, its starter) first
  return L;
}
// a dog id whose eye roll gives these eyes (phenotype() seeds the Bl/bl and merle eye rolls with the dog's id). mk(n): the n-th id to try
// (default: a fresh random dog id; a Dog Card dog passes a fixed list, so the same card always gives the same id, or null when none of them fits)
function starterIdFor(key, genes, eyes, mk, tries) {
  const fixed = typeof mk === 'function', next = fixed ? mk : () => 'd_' + Math.random().toString(36).slice(2, 9); let id = next(0);
  for (let n = 1; n <= (tries || 2000) && eyes; n++) { const p = coatPh(genes, key, id); if (!p || p.eyes === eyes) return id; id = next(n); }
  return eyes && fixed ? null : id;
}
// the chosen starter: colour i, eyes j -> { genes, coat, eyes, id } for newDogFields, or null for the plain STARTER_GENES dog (colour 1, first eyes).
// id: keep this id when its eye roll already fits (the card's preview dog becomes the dog that comes home)
function starterPick(key, i, j, id) {
  const cs = starterCoats(key); i = cs[i | 0] ? i | 0 : 0; j = j | 0; const c = cs[i], es = starterEyes(key, i);
  if (c.def && !j) return null;
  const e = es[j] || es[0] || null, genes = Object.assign({}, c.genes, e ? { Bl: e.Bl.slice() } : {}), p = coatPh(genes, key);
  const eyes = e ? e.eyes : p ? p.eyes : 'brown', q = id ? coatPh(genes, key, id) : null;
  return { genes, coat: p ? p.coatName : c.coat, eyes, id: q && q.eyes === eyes ? id : starterIdFor(key, genes, eyes) };
}
// Breeding rules, stored now and switched on in v2 (1 real day = 1 dog month)
const BREEDING = window.PawBreeding = window.PawBreeding || { RULES: {
  enabled: false, pair: 'male+female', adultMonths: 12, seniorMonths: 84, noBreedFromMonths: 96,
  heat: { firstMonths: 12, everyDays: 6, lastsDays: 3 }, maleRestDays: 2, pregnancyDays: 2, puppyStayDays: 2,
  female: { skipSeasons: 1, maxLitters: 4, noLittersFromMonths: 72 },
  giant: { breeds: ['dane', 'mastiff', 'bernese'], adultMonths: 18, restDays: 12, maxLitters: 3 }, // v2.11: giant dogs wait until 18 months, rest two seasons between litters and have at most 3 litters (v2.21: the Bernese too, a slow-growing big dog)
  litters: { small: { breeds: ['dachs', 'corgi', 'chihuahua', 'pug', 'frenchie', 'pom', 'minpin', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu', 'cavalier', 'jrt'], sizes: [1, 2, 3], weights: [40, 40, 20] }, medium: { breeds: ['shiba', 'mutt', 'beagle', 'poodle', 'collie', 'spitz', 'pitbull', 'schnauzer', 'aussie'], sizes: [1, 2, 3], weights: [30, 50, 20] }, large: { breeds: ['golden', 'husky', 'greyhound', 'samoyed', 'akita', 'afghan', 'gsd', 'dobie', 'corso', 'lab', 'malamute', 'chow', 'stdpoodle', 'dalmatian'], sizes: [2, 3], weights: [60, 40] }, giant: { breeds: ['dane', 'mastiff', 'bernese'], sizes: [2, 3], weights: [35, 65] } },
  puppySex: 0.5, inheritance: 'mendelian', welfare: { noMerleXMerle: true, minMeters: 50, minBond: 6, noRelatives: ['parent', 'child', 'sibling', 'half-sibling', 'grandparent', 'grandchild', 'aunt', 'uncle', 'niece', 'nephew', 'first-cousin'] },
  expecting: { hungerDecay: 1.2, walkCap: 'park', noPlaydates: true }, fixedNeverBreeds: true
} };
const PR = () => (S && S.dog && S.dog.sex === 'female' ? { he: 'she', him: 'her', his: 'her', He: 'She', His: 'Her', boy: 'girl', self: 'herself' } : { he: 'he', him: 'him', his: 'his', He: 'He', His: 'His', boy: 'boy', self: 'himself' });
const sexSym = (sx) => (sx === 'female' ? '<span class="sex f" title="' + esc(tt('genes.title_girl', 'Girl')) + '" aria-label="' + esc(tt('genes.label_girl', 'girl')) + '">&#9792;</span>' : sx === 'male' ? '<span class="sex m" title="' + esc(tt('genes.title_boy', 'Boy')) + '" aria-label="' + esc(tt('genes.label_boy', 'boy')) + '">&#9794;</span>' : '');
function localISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function bornDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d); }
function ageMonths(dog) { dog = dog || S.dog; if (!dog || !dog.born) return 10; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.max(0, Math.round((t - new Date(dog.born + 'T00:00:00')) / 864e5)); }
const lifeStage = (m) => (m < 6 ? 'puppy' : m < 12 ? 'young' : m < 84 ? 'adult' : 'senior');
/* v2.19.3 Puppy start (owner, 5 Nov 2026; V2193.md): every starter from the shelter, the first dog and any later one, arrives as a 3-month puppy
   (it was 10 months) and grows up day by day. Shelter residents and rescues keep their own ages. Under the test harness the older suites keep
   the 10-month starter they were written for, unless a suite passes pupStart (prefs.pupTest); the old-save migration (pupStartFields) waits too. */
const PUP_START = 3;
function starterMonths() { return navigator.webdriver && !prefs.pupTest ? 10 : PUP_START; }
function ageText(m) {
  const y = Math.floor(m / 12), mo = m % 12, ys = tt('genes.age_years', '{n, plural, one {# year} other {# years}}', { n: y }), ms = tt('genes.age_months', '{n, plural, one {# month} other {# months}}', { n: mo });
  return y ? (mo ? tt('genes.age_years_months', '{years} {months}', { years: ys, months: ms }) : ys) : ms;
}
const giantRules = (dog) => { const g = BREEDING.RULES.giant; return g && dog && g.breeds.includes(dog.key) ? g : null; }; // v2.11: the Great Dane and the English Mastiff
function seasonStatus(dog) {
  dog = dog || S.dog; const m = ageMonths(dog), H = BREEDING.RULES.heat;
  if (dog.sex !== 'female') return { txt: tt('genes.ready_for_playdates_in_v2', 'Ready for playdates in v2'), inSeason: false };
  if (dog.fixed) return { txt: tt('genes.spayed_no_seasons', 'Spayed: no seasons'), inSeason: false };
  const gr = giantRules(dog), first = gr ? gr.adultMonths : H.firstMonths;
  if (m < first) return { txt: tt('genes.first_season_at_months_in', 'First season at {first, plural, one {# month} other {# months}} (in {left, plural, one {# day} other {# days}})', { first, left: first - m }), inSeason: false };
  if (m >= BREEDING.RULES.noBreedFromMonths) return { txt: tt('genes.retired_from_seasons_senior', 'Retired from seasons (senior)'), inSeason: false };
  const pos = (((m - H.firstMonths + (dog.seasonSeed || 0)) % H.everyDays) + H.everyDays) % H.everyDays;
  return pos < H.lastsDays ? { txt: tt('genes.in_season_more_days', 'In season ({n, plural, one {# more day} other {# more days}})', { n: H.lastsDays - pos }), inSeason: true } : { txt: tt('genes.next_season_in_days', 'Next season in {n, plural, one {# day} other {# days}}', { n: H.everyDays - pos }), inSeason: false };
}
function newDogFields(key, sex, born, pick) {
  const g = STARTER_GENES[key] || STARTER_GENES.mutt;
  const f = { id: 'd_' + Math.random().toString(36).slice(2, 9), sex, born, genes: { B: g.B.slice(), D: g.D.slice(), E: g.E.slice(), S: g.S.slice(), M: g.M.slice(), Bl: g.Bl.slice() }, coat: g.coat, eyes: g.eyes, parents: null, litters: 0, lastLitter: null, fixed: false, seasonSeed: Math.floor(Math.random() * 6) };
  if (pick && pick.genes) { // v2.23 Coat pick: the colour (and eyes) chosen on the adoption card (starterPick); no pick = the STARTER_GENES dog as before
    const G = {}; Object.keys(pick.genes).forEach((k) => { if (Array.isArray(pick.genes[k])) G[k] = pick.genes[k].slice(); });
    Object.assign(f, { genes: G, coat: pick.coat || g.coat, eyes: pick.eyes || g.eyes }); if (pick.id) f.id = pick.id;
  }
  return f;
}
function birthdayCheck() {
  if (!S || !S.dog.born) return; const m = ageMonths();
  if (m > 0 && m % 12 === 0 && S.lastBday !== m && !((+S.dog.pupBday || 0) >= m)) { /* v2.19.3: pupBday, a birthday a dog had before its puppy months came back, is never had twice */ S.lastBday = m; addStat('happy', 10); markDirty(); toast(tt('genes.happy_birthday_dog_years', '{sex, select, female {Happy birthday, {name}! She is {years, plural, one {# dog year} other {# dog years}} old today. Someone baked her a tiny Pupcake. +10 Happiness.} other {Happy birthday, {name}! He is {years, plural, one {# dog year} other {# dog years}} old today. Someone baked him a tiny Pupcake. +10 Happiness.}}', { sex: S.dog.sex, name: NAME(), years: m / 12 }), 'gold'); }
}
function askSex() {
  if (!S || S.dog.sex) return;
  const p = openModal(tt('genes.quick_question_for_the_paperwork', 'Quick question for the paperwork'), `<p>${tt('genes.is_a_boy_or_a_girl_html', 'Is <b>{name}</b> a boy or a girl?', { name: NAME() })}</p><p class="small">${tt('genes.boys_and_girls_of_a', 'Boys and girls of a breed look alike, just like real dogs.')}</p>`, { noX: true, foot: '<button class="btn big sexbtn m" id="sxM">&#9794; ' + tt('genes.boy', 'Boy') + '</button><button class="btn big sexbtn f" id="sxF">&#9792; ' + tt('genes.girl', 'Girl') + '</button>' });
  const pick = (sx) => { S.dog.sex = sx; markDirty(); saveNow(); modalClose = null; closeModal(); hudDogKey = ''; setHudDog(); toast(tt('genes.paperwork_done_is_a_good', '{sex, select, female {Paperwork done. {name} is a good girl, and she knows it.} other {Paperwork done. {name} is a good boy, and he knows it.}}', { sex: sx, name: NAME() }), 'good'); };
  $('#sxM', p).onclick = () => pick('male'); $('#sxF', p).onclick = () => pick('female');
}

