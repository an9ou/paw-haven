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
  shihtzu: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Gold and white', eyes: 'brown' }
};
// Breeding rules, stored now and switched on in v2 (1 real day = 1 dog month)
const BREEDING = window.PawBreeding = window.PawBreeding || { RULES: {
  enabled: false, pair: 'male+female', adultMonths: 12, seniorMonths: 84, noBreedFromMonths: 96,
  heat: { firstMonths: 12, everyDays: 6, lastsDays: 3 }, maleRestDays: 2, pregnancyDays: 2, puppyStayDays: 2,
  female: { skipSeasons: 1, maxLitters: 4, noLittersFromMonths: 72 },
  giant: { breeds: ['dane', 'mastiff'], adultMonths: 18, restDays: 12, maxLitters: 3 }, // v2.11: giant dogs wait until 18 months, rest two seasons between litters and have at most 3 litters
  litters: { small: { breeds: ['dachs', 'corgi', 'chihuahua', 'pug', 'frenchie', 'pom', 'minpin', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'], sizes: [1, 2, 3], weights: [40, 40, 20] }, medium: { breeds: ['shiba', 'mutt', 'beagle', 'poodle', 'collie', 'spitz', 'pitbull', 'schnauzer'], sizes: [1, 2, 3], weights: [30, 50, 20] }, large: { breeds: ['golden', 'husky', 'greyhound', 'samoyed', 'akita', 'afghan', 'gsd', 'dobie', 'corso', 'lab', 'malamute', 'chow', 'stdpoodle'], sizes: [2, 3], weights: [60, 40] }, giant: { breeds: ['dane', 'mastiff'], sizes: [2, 3], weights: [35, 65] } },
  puppySex: 0.5, inheritance: 'mendelian', welfare: { noMerleXMerle: true, minMeters: 50, minBond: 6, noRelatives: ['parent', 'child', 'sibling', 'half-sibling', 'grandparent', 'grandchild', 'aunt', 'uncle', 'niece', 'nephew', 'first-cousin'] },
  expecting: { hungerDecay: 1.2, walkCap: 'park', noPlaydates: true }, fixedNeverBreeds: true
} };
const PR = () => (S && S.dog && S.dog.sex === 'female' ? { he: 'she', him: 'her', his: 'her', He: 'She', His: 'Her', boy: 'girl', self: 'herself' } : { he: 'he', him: 'him', his: 'his', He: 'He', His: 'His', boy: 'boy', self: 'himself' });
const sexSym = (sx) => (sx === 'female' ? '<span class="sex f" title="' + esc(tt('genes.title_girl', 'Girl')) + '" aria-label="' + esc(tt('genes.label_girl', 'girl')) + '">&#9792;</span>' : sx === 'male' ? '<span class="sex m" title="' + esc(tt('genes.title_boy', 'Boy')) + '" aria-label="' + esc(tt('genes.label_boy', 'boy')) + '">&#9794;</span>' : '');
function localISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function bornDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d); }
function ageMonths(dog) { dog = dog || S.dog; if (!dog || !dog.born) return 10; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.max(0, Math.round((t - new Date(dog.born + 'T00:00:00')) / 864e5)); }
const lifeStage = (m) => (m < 6 ? 'puppy' : m < 12 ? 'young' : m < 84 ? 'adult' : 'senior');
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
function newDogFields(key, sex, born) {
  const g = STARTER_GENES[key] || STARTER_GENES.mutt;
  return { id: 'd_' + Math.random().toString(36).slice(2, 9), sex, born, genes: { B: g.B.slice(), D: g.D.slice(), E: g.E.slice(), S: g.S.slice(), M: g.M.slice(), Bl: g.Bl.slice() }, coat: g.coat, eyes: g.eyes, parents: null, litters: 0, lastLitter: null, fixed: false, seasonSeed: Math.floor(Math.random() * 6) };
}
function birthdayCheck() {
  if (!S || !S.dog.born) return; const m = ageMonths();
  if (m > 0 && m % 12 === 0 && S.lastBday !== m) { S.lastBday = m; addStat('happy', 10); markDirty(); toast(tt('genes.happy_birthday_dog_years', '{sex, select, female {Happy birthday, {name}! She is {years, plural, one {# dog year} other {# dog years}} old today. Someone baked her a tiny Pupcake. +10 Happiness.} other {Happy birthday, {name}! He is {years, plural, one {# dog year} other {# dog years}} old today. Someone baked him a tiny Pupcake. +10 Happiness.}}', { sex: S.dog.sex, name: NAME(), years: m / 12 }), 'gold'); }
}
function askSex() {
  if (!S || S.dog.sex) return;
  const p = openModal(tt('genes.quick_question_for_the_paperwork', 'Quick question for the paperwork'), `<p>${tt('genes.is_a_boy_or_a_girl_html', 'Is <b>{name}</b> a boy or a girl?', { name: NAME() })}</p><p class="small">${tt('genes.boys_and_girls_of_a', 'Boys and girls of a breed look alike, just like real dogs.')}</p>`, { noX: true, foot: '<button class="btn big sexbtn m" id="sxM">&#9794; ' + tt('genes.boy', 'Boy') + '</button><button class="btn big sexbtn f" id="sxF">&#9792; ' + tt('genes.girl', 'Girl') + '</button>' });
  const pick = (sx) => { S.dog.sex = sx; markDirty(); saveNow(); modalClose = null; closeModal(); hudDogKey = ''; setHudDog(); toast(tt('genes.paperwork_done_is_a_good', '{sex, select, female {Paperwork done. {name} is a good girl, and she knows it.} other {Paperwork done. {name} is a good boy, and he knows it.}}', { sex: sx, name: NAME() }), 'good'); };
  $('#sxM', p).onclick = () => pick('male'); $('#sxF', p).onclick = () => pick('female');
}

