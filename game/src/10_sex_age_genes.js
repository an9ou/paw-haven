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
  frenchie: { B: ['B', 'B'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'], coat: 'Fawn', eyes: 'brown' }
};
// Breeding rules, stored now and switched on in v2 (1 real day = 1 dog month)
const BREEDING = window.PawBreeding = window.PawBreeding || { RULES: {
  enabled: false, pair: 'male+female', adultMonths: 12, seniorMonths: 84, noBreedFromMonths: 96,
  heat: { firstMonths: 12, everyDays: 6, lastsDays: 3 }, maleRestDays: 2, pregnancyDays: 2, puppyStayDays: 2,
  female: { skipSeasons: 1, maxLitters: 4, noLittersFromMonths: 72 },
  litters: { small: { breeds: ['dachs', 'corgi', 'chihuahua', 'pug', 'frenchie'], sizes: [1, 2, 3], weights: [40, 40, 20] }, medium: { breeds: ['shiba', 'mutt', 'beagle', 'poodle', 'collie'], sizes: [1, 2, 3], weights: [30, 50, 20] }, large: { breeds: ['golden', 'husky', 'greyhound', 'samoyed'], sizes: [2, 3], weights: [60, 40] } },
  puppySex: 0.5, inheritance: 'mendelian', welfare: { noMerleXMerle: true, minMeters: 50, minBond: 6, noRelatives: ['parent', 'child', 'sibling', 'half-sibling', 'grandparent', 'grandchild', 'aunt', 'uncle', 'niece', 'nephew', 'first-cousin'] },
  expecting: { hungerDecay: 1.2, walkCap: 'park', noPlaydates: true }, fixedNeverBreeds: true
} };
const PR = () => (S && S.dog && S.dog.sex === 'female' ? { he: 'she', him: 'her', his: 'her', He: 'She', His: 'Her', boy: 'girl', self: 'herself' } : { he: 'he', him: 'him', his: 'his', He: 'He', His: 'His', boy: 'boy', self: 'himself' });
const sexSym = (sx) => (sx === 'female' ? '<span class="sex f" title="Girl" aria-label="girl">&#9792;</span>' : sx === 'male' ? '<span class="sex m" title="Boy" aria-label="boy">&#9794;</span>' : '');
function localISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function bornDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d); }
function ageMonths(dog) { dog = dog || S.dog; if (!dog || !dog.born) return 10; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.max(0, Math.round((t - new Date(dog.born + 'T00:00:00')) / 864e5)); }
const lifeStage = (m) => (m < 6 ? 'puppy' : m < 12 ? 'young' : m < 84 ? 'adult' : 'senior');
function ageText(m) { const y = Math.floor(m / 12), mo = m % 12, p = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`; return y ? (mo ? `${p(y, 'year')} ${p(mo, 'month')}` : p(y, 'year')) : p(mo, 'month'); }
function seasonStatus(dog) {
  dog = dog || S.dog; const m = ageMonths(dog), H = BREEDING.RULES.heat;
  if (dog.sex !== 'female') return { txt: 'Ready for playdates in v2', inSeason: false };
  if (dog.fixed) return { txt: 'Spayed: no seasons', inSeason: false };
  if (m < H.firstMonths) return { txt: `First season at 12 months (in ${H.firstMonths - m} days)`, inSeason: false };
  if (m >= BREEDING.RULES.noBreedFromMonths) return { txt: 'Retired from seasons (senior)', inSeason: false };
  const pos = (((m - H.firstMonths + (dog.seasonSeed || 0)) % H.everyDays) + H.everyDays) % H.everyDays;
  return pos < H.lastsDays ? { txt: `In season (${H.lastsDays - pos} more day${H.lastsDays - pos > 1 ? 's' : ''})`, inSeason: true } : { txt: `Next season in ${H.everyDays - pos} day${H.everyDays - pos > 1 ? 's' : ''}`, inSeason: false };
}
function newDogFields(key, sex, born) {
  const g = STARTER_GENES[key] || STARTER_GENES.mutt;
  return { id: 'd_' + Math.random().toString(36).slice(2, 9), sex, born, genes: { B: g.B.slice(), D: g.D.slice(), E: g.E.slice(), S: g.S.slice(), M: g.M.slice(), Bl: g.Bl.slice() }, coat: g.coat, eyes: g.eyes, parents: null, litters: 0, lastLitter: null, fixed: false, seasonSeed: Math.floor(Math.random() * 6) };
}
function birthdayCheck() {
  if (!S || !S.dog.born) return; const m = ageMonths();
  if (m > 0 && m % 12 === 0 && S.lastBday !== m) { S.lastBday = m; addStat('happy', 10); markDirty(); toast(`Happy birthday, ${NAME()}! ${PR().He} is ${m / 12} dog year${m > 12 ? 's' : ''} old today. Someone baked ${PR().him} a tiny Pupcake. +10 Happiness.`, 'gold'); }
}
function askSex() {
  if (!S || S.dog.sex) return;
  const p = openModal('Quick question for the paperwork', `<p>Is <b>${esc(NAME())}</b> a boy or a girl?</p><p class="small">Boys and girls of a breed look alike, just like real dogs.</p>`, { noX: true, foot: '<button class="btn big sexbtn m" id="sxM">&#9794; Boy</button><button class="btn big sexbtn f" id="sxF">&#9792; Girl</button>' });
  const pick = (sx) => { S.dog.sex = sx; markDirty(); saveNow(); modalClose = null; closeModal(); hudDogKey = ''; setHudDog(); toast(`Paperwork done. ${NAME()} is a good ${PR().boy}, and ${PR().he} knows it.`, 'good'); };
  $('#sxM', p).onclick = () => pick('male'); $('#sxF', p).onclick = () => pick('female');
}

