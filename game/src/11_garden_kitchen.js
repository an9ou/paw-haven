/* ======================= v1.3: Garden & Kitchen (integrator side) ======================= */
const PG = () => (window.PawGarden && typeof window.PawGarden === 'object' ? window.PawGarden : null);
const PK = () => (window.PawKitchen && typeof window.PawKitchen === 'object' ? window.PawKitchen : null);
// v1.7.1: keep in sync with mods/garden.js CROPS (hours = real grow time, regrow = hours, picks = harvests per bush)
const CROPS_FB = [
  { id: 'peas', name: 'Peas', seasons: ['spring'], hours: 2, regrow: null, picks: null, yield: 3, seed: 2, sell: 1, hardy: false, seedItem: 'Pea Seeds', item: 'Peas' },
  { id: 'spinach', name: 'Spinach', seasons: ['winter', 'spring'], hours: 2, regrow: null, picks: null, yield: 2, seed: 2, sell: 2, hardy: true, seedItem: 'Spinach Seeds', item: 'Spinach' },
  { id: 'carrot', name: 'Carrot', seasons: ['spring', 'autumn'], hours: 3, regrow: null, picks: null, yield: 2, seed: 2, sell: 2, hardy: false, seedItem: 'Carrot Seeds', item: 'Carrot' },
  { id: 'blueberries', name: 'Blueberries', seasons: ['summer'], hours: 4, regrow: 2, picks: 4, yield: 4, seed: 8, sell: 1, hardy: false, seedItem: 'Blueberry Seeds', item: 'Blueberries' },
  { id: 'sweet-potato', name: 'Sweet Potato', seasons: ['summer', 'autumn'], hours: 4, regrow: null, picks: null, yield: 2, seed: 3, sell: 3, hardy: false, seedItem: 'Sweet Potato Seeds', item: 'Sweet Potato' },
  { id: 'pumpkin', name: 'Pumpkin', seasons: ['autumn'], hours: 6, regrow: null, picks: null, yield: 1, seed: 4, sell: 7, hardy: false, seedItem: 'Pumpkin Seeds', item: 'Pumpkin' }
];
const RECIPES_FB = [
  { id: 'carrot-crunchies', name: 'Carrot Crunchies', ingredients: ['carrot', 'oats'], steps: ['chop', 'bake'], effect: { hunger: 20, happy: 10, buff: { id: 'walk15', walks: 1 } }, unlock: 'start', hint: 'Something orange and something oaty.' },
  { id: 'chicken-veggie-rice', name: 'Chicken & Veggie Rice', ingredients: ['chicken', 'rice', 'carrot', 'peas'], steps: ['chop', 'stir'], effect: { hunger: 60, happy: 15, bond: 10 }, unlock: 'start', hint: 'A proper dinner with four things.' },
  { id: 'blueberry-pupsicle', name: 'Blueberry Pupsicle', ingredients: ['blueberries', 'water'], steps: ['chill'], effect: { energy: 10, buff: { id: 'cool', hours: 24 } }, unlock: 'start', hint: 'Berries and something cold.' },
  { id: 'pumpkin-pupcake', name: 'Pumpkin Pupcake', ingredients: ['pumpkin', 'oats', 'egg'], steps: ['stir', 'bake'], effect: { hunger: 20, happy: 30, bond: 25 }, unlock: 'experiment', hint: 'Autumn in a cupcake. Three things.' },
  { id: 'golden-harvest-stew', name: 'Golden Harvest Stew', ingredients: ['sweet-potato', 'pumpkin', 'chicken', 'rice'], steps: ['chop', 'stir', 'simmer'], effect: { hunger: 50, buff: { id: 'warm', hours: 24 } }, unlock: 'experiment', hint: 'Two orange veggies, chicken and rice.' },
  { id: 'spinach-scramble', name: 'Spinach Scramble', ingredients: ['egg', 'spinach'], steps: ['stir'], effect: { hunger: 25, buff: { id: 'dig1', walks: 1 } }, unlock: 'experiment', hint: 'Something green and something you crack.' },
  { id: 'mystery-mush', name: 'Mystery Mush', ingredients: [], steps: [], effect: { hunger: 15 }, unlock: 'result' }
];
const PANTRY_FB = [{ id: 'oats', name: 'Oats', price: 2 }, { id: 'rice', name: 'Rice', price: 3 }, { id: 'egg', name: 'Egg', price: 3 }, { id: 'chicken', name: 'Chicken', price: 8 }];
const PEOPLE_FB = [
  { id: 'onion', name: 'Onion', where: ['rack', 'junk'], why: "Onions (and garlic, leeks and chives) damage a dog's red blood cells, cooked or raw.", swap: 'Carrots are a crunchy swap.' },
  { id: 'garlic', name: 'Garlic', where: ['rack'], why: 'Garlic is in the onion family and can cause anaemia in dogs, even as powder.', swap: 'Try peas instead.' },
  { id: 'grapes', name: 'Grapes', where: ['rack', 'junk'], why: 'Grapes and raisins can cause sudden kidney failure in dogs, and there is no known safe amount.', swap: 'Blueberries are a great swap.' },
  { id: 'chocolate', name: 'Chocolate', where: ['pantry'], why: "Chocolate has theobromine and caffeine, which can make a dog's heart race. Dark chocolate is worst.", swap: 'Carrot Crunchies are a safe treat.' },
  { id: 'raisins', name: 'Raisins', where: ['pantry'], why: 'Raisins are dried grapes and can cause kidney failure in dogs.', swap: 'Blueberries instead.' },
  { id: 'coffee', name: 'Coffee', where: ['pantry'], why: "Caffeine makes a dog's heart race and can cause tremors.", swap: 'Fresh water.' },
  { id: 'gum', name: 'Sugar-free Gum', where: ['pantry'], why: "It often contains xylitol, which drops a dog's blood sugar fast and can harm the liver.", swap: 'A Pumpkin Pupcake instead.' },
  { id: 'macadamia', name: 'Macadamia Nuts', where: ['pantry'], why: 'Macadamia nuts cause weakness, wobbly legs, vomiting and fever in dogs.', swap: 'Oats are fine.' },
  { id: 'avocado', name: 'Avocado', where: ['pantry'], why: "Avocado contains persin, which can upset a dog's stomach, and the pit can block the gut.", swap: 'Spinach Scramble instead.' }
];
const DISH_FAV = { shiba: 'golden-harvest-stew', corgi: 'chicken-veggie-rice', golden: 'carrot-crunchies', dachs: 'spinach-scramble', husky: 'blueberry-pupsicle', mutt: 'golden-harvest-stew', chihuahua: 'chicken-veggie-rice', pug: 'pumpkin-pupcake', greyhound: 'carrot-crunchies', beagle: 'golden-harvest-stew', poodle: 'spinach-scramble', collie: 'chicken-veggie-rice', samoyed: 'blueberry-pupsicle', frenchie: 'pumpkin-pupcake', akita: 'chicken-veggie-rice', spitz: 'pumpkin-pupcake', pom: 'carrot-crunchies', afghan: 'carrot-crunchies', dane: 'chicken-veggie-rice', mastiff: 'pumpkin-pupcake', gsd: 'golden-harvest-stew', dobie: 'chicken-veggie-rice', corso: 'pumpkin-pupcake', pitbull: 'golden-harvest-stew', minpin: 'carrot-crunchies', lab: 'golden-harvest-stew', malamute: 'blueberry-pupsicle', chow: 'carrot-crunchies', stdpoodle: 'spinach-scramble', schnauzer: 'chicken-veggie-rice', westie: 'golden-harvest-stew', yorkie: 'carrot-crunchies', bichon: 'blueberry-pupsicle', maltese: 'blueberry-pupsicle', shihtzu: 'pumpkin-pupcake' };
const BUDDY_FB = { shiba: 'inspect', corgi: 'guard', golden: 'fetch', dachs: 'dig', husky: 'snow', mutt: 'tend', chihuahua: 'guard', pug: 'tend', greyhound: 'fetch', beagle: 'inspect', poodle: 'inspect', collie: 'guard', samoyed: 'snow', frenchie: 'tend', akita: 'guard', spitz: 'snow', pom: 'inspect', afghan: 'inspect', dane: 'tend', mastiff: 'tend', gsd: 'guard', dobie: 'guard', corso: 'guard', pitbull: 'tend', minpin: 'inspect', lab: 'fetch', malamute: 'dig', chow: 'tend', stdpoodle: 'inspect', schnauzer: 'guard', westie: 'dig', yorkie: 'inspect', bichon: 'inspect', maltese: 'tend', shihtzu: 'tend' };
const START_RECIPES = ['carrot-crunchies', 'chicken-veggie-rice', 'blueberry-pupsicle'];
// v2.14 i18n: shown names. Crops, recipes, pantry and people food come from the garden and kitchen modules (tables crops, recipes, pantry, people_food); the ids stay English.
const gkCropName = (c) => tdata('crops.' + tid(c.id) + '.name', c.name);
const gkCropSeed = (c) => tdata('crops.' + tid(c.id) + '.seeditem', c.seedItem);
const gkCropItem = (c) => tdata('crops.' + tid(c.id) + '.item', c.item);
const gkRecipeName = (r) => tdata('recipes.' + tid(r.id) + '.name', r.name);
const gkPeople = (f, field) => tdata('people_food.' + tid(f.id) + '.' + field, f[field]);
const gkSep = () => tt('garden.sep', ', ');
function gkSeason(s) {
  switch (s) {
    case 'spring': return tt('garden.season_spring', 'spring');
    case 'summer': return tt('garden.season_summer', 'summer');
    case 'autumn': return tt('garden.season_autumn', 'autumn');
    case 'winter': return tt('garden.season_winter', 'winter');
    default: return String(s);
  }
}
const gkSeasons = (a) => a.map(gkSeason).join(gkSep());
function gkCropPlural(id) {
  switch (id) {
    case 'carrot': return tt('garden.plural_carrot', 'carrots');
    case 'peas': return tt('garden.plural_peas', 'peas');
    case 'spinach': return tt('garden.plural_spinach', 'spinach');
    case 'blueberries': return tt('garden.plural_blueberries', 'blueberries');
    case 'sweet-potato': return tt('garden.plural_sweet_potato', 'sweet potatoes');
    case 'pumpkin': return tt('garden.plural_pumpkin', 'pumpkin');
    default: return null;
  }
}
function gkCropOne(id) {
  switch (id) {
    case 'carrot': return tt('garden.one_carrot', 'carrot');
    case 'peas': return tt('garden.one_peas', 'pea pod');
    case 'spinach': return tt('garden.one_spinach', 'spinach leaf');
    case 'blueberries': return tt('garden.one_blueberries', 'blueberry');
    case 'sweet-potato': return tt('garden.one_sweet_potato', 'sweet potato');
    case 'pumpkin': return tt('garden.one_pumpkin', 'pumpkin');
    default: return null;
  }
}
function gkStat(s) {
  switch (s) {
    case 'hunger': return tt('garden.stat_hunger', 'Hunger');
    case 'happy': return tt('garden.stat_happy', 'Happiness');
    case 'energy': return tt('garden.stat_energy', 'Energy');
    case 'bond': return tt('garden.stat_bond', 'Bond');
    default: return s;
  }
}
const gkBuffTxt = (id) => (BUFF_TXT[id] ? tdata('buff_txt.' + id, BUFF_TXT[id]) : id);
function modData(fn, key, fb) { try { const m = fn(); const v = m && m[key]; return v && (Array.isArray(v) ? v.length : Object.keys(v).length) ? v : fb; } catch (e) { return fb; } }
const cropsList = () => modData(PG, 'CROPS', CROPS_FB);
const recipesList = () => modData(PK, 'RECIPES', RECIPES_FB);
const peopleFood = () => modData(PK, 'PEOPLE_FOOD', PEOPLE_FB);
const pantryList = () => modData(PK, 'PANTRY', PANTRY_FB).filter((x) => x.id !== 'water');
const cropInfo = (id) => cropsList().find((c) => c.id === id) || CROPS_FB.find((c) => c.id === id);
const recipeInfo = (id) => recipesList().find((r) => r.id === id) || RECIPES_FB.find((r) => r.id === id);
const buddyNow = () => modData(PG, 'BUDDY', BUDDY_FB)[S.dog.key] || null;
// v2.5: monthNow() and seasonOf() moved to 00_core.js (seasons are a core thing now)
function gardenNew() {
  try { if (PG() && PG().newState) return PG().newState(); } catch (e) { /* module failed */ }
  return { v: 2, plots: Array.from({ length: 6 }, () => ({ crop: null, g: 0, water: 0, wd: 0, dry: 0, inSeason: true, inspected: false, ready: null, took: 0, planted: null, harvested: 0 })), last: gardenHourKey(), harvests: {} };
}
// v1.7.1: the garden runs on an hourly clock ('YYYY-M-D-hH'); weather still comes per 8-hour period
function gardenHourKey(d) { try { if (PG() && PG().hourKey) return PG().hourKey(d || Date.now()); } catch (e) { /* module failed */ } const t = d ? new Date(d) : new Date(); return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}-h${t.getHours()}`; }
const hrs = (h) => tt('garden.hours', '{n, plural, one {# hour} other {# hours}}', { n: Math.max(1, Math.round(h)) });
const cropTimeTxt = (c) => tt('garden.crop_time', '{rg, select, none {ready in about {h}} nopicks {ready in about {h}, then regrows every {r}} other {ready in about {h}, then regrows every {r} ({p} picks per bush)}}', { rg: !c.regrow ? 'none' : c.picks ? 'picks' : 'nopicks', h: hrs(c.hours), r: c.regrow ? hrs(c.regrow) : '', p: c.picks || 0 });
// Dev: +N garden hours with a chosen weather (+1 hour, +1 period = 8 hours). A pinned dev Time decides day/night.
function gardenDevStep(hours, w) { gardenAdvance({ steps: hours, stepWeather: w, stepTime: ENV.time !== 'auto' ? timePhase() : undefined }); }
function gardenDevReady() { const g = JSON.parse(JSON.stringify(S.garden)); g.plots.forEach((pl) => { if (pl.crop) { pl.g = 1; pl.ready = pl.ready || g.last || gardenHourKey(); } }); S.garden = g; markDirty(); if (gardenCtl && gardenCtl.update) gardenCtl.update({ state: S.garden }); }
/* Pip buys at most 60 coins of crops per real day */
const PIP_CAP = 60;
function pipToday() { if (!S.pipSold || S.pipSold.date !== todayKey()) S.pipSold = { date: todayKey(), coins: 0 }; return S.pipSold; }
const pipLeft = () => Math.max(0, PIP_CAP - pipToday().coins);
const pipFull = () => tt('garden.pip_full', "Pip's cart is full! Back tomorrow.");
function gkFields(s, existing) {
  s.inv.seeds = s.inv.seeds || (existing ? { carrot: 3, peas: 3 } : { carrot: 3, peas: 3 }); s.inv.crops = s.inv.crops || {};
  s.inv.pantry = s.inv.pantry || { oats: 0, rice: 0, egg: 0, chicken: 0 }; s.inv.dishes = s.inv.dishes || [];
  s.recipes = s.recipes || { known: START_RECIPES.slice(), best: {} }; if (s.buff === undefined) s.buff = null;
  s.dishLog = s.dishLog || { date: '', count: 0, bond: false }; s.safetySeen = s.safetySeen || []; s.cropBest = s.cropBest || {};
}
const patchState = () => { const pl = (S.garden && S.garden.plots) || []; return pl.some((p) => p.crop && p.g >= 1) ? 'ready' : pl.some((p) => p.crop) ? 'growing' : 'empty'; };
const gardenUnlocked = () => !!(S.gkEarly || topBond() >= 2);
const kitchenUnlocked = () => !!(S.gkEarly || topBond() >= 3);
const seedCounts = () => Object.assign({}, S.inv.seeds);
function mergeHarvests(st) { const a = (S.garden && S.garden.harvests) || {}, b = st.harvests || {}; const out = {}; new Set(Object.keys(a).concat(Object.keys(b))).forEach((k) => { out[k] = Math.max(a[k] || 0, b[k] || 0); }); st.harvests = out; return st; }
let gardenCtl = null, kitchenCtl = null, lastGardenTick = 0;
function gardenAdvance(extra) {
  const m = PG(); if (!S || !S.garden || !m || typeof m.advance !== 'function') return;
  try {
    const r = m.advance(S.garden, Object.assign({ now: Date.now(), weatherAt: weatherForKey, buddy: buddyNow(), maxHours: 720 }, extra || {}));
    if (r && r.state) { S.garden = mergeHarvests(r.state); markDirty(); (r.events || []).slice(0, 4).forEach(gardenEvent); }
  } catch (e) { console.warn('PawGarden.advance failed', e); }
  if (gardenCtl && gardenCtl.update) { try { gardenCtl.update({ state: S.garden, time: timePhase(), weather: weatherNow(), seeds: seedCounts() }); } catch (e) { /* ignore */ } }
}
function gardenEvent(ev) {
  const c = ev.crop || (S.garden.plots[ev.plot] || {}).crop; const pl = gkCropPlural(c) || tt('garden.veggies', 'veggies');
  if (ev.type === 'ready') toast(tt('garden.ready', '{one, select, yes {The {crop} is ready!} other {The {crop} are ready!}}', { one: ['spinach', 'pumpkin'].includes(c) ? 'yes' : 'no', crop: pl }), 'good');
  if (ev.type === 'squirrel') { sfx('squirrel'); barkDog(D(), D().key === 'shiba' && Math.random() < 1 / 3 ? 'scream' : 'alert', {}); toast(tt('garden.squirrel', 'Captain Fluff took one {crop} and left an IOU.', { crop: gkCropOne(c) || tt('garden.veggie', 'veggie') }), 'bad'); }
  if (ev.type === 'tend') toast(tt('garden.tend', '{sex, select, female {{name} brought water for the {crop}. She is very proud.} other {{name} brought water for the {crop}. He is very proud.}}', { name: NAME(), crop: pl, sex: S.dog.sex }), 'good');
}
function weatherForKey(key) {
  if (key === weatherPeriodKey() && ENV.weather !== 'auto') return ENV.weather;
  const [y, m, d, per] = String(key).split('-').map(Number);
  const r = seeded((y * 400 + m * 32 + d) * 7 + per * 131 + 17)();
  return r < 0.45 ? 'sunny' : r < 0.70 ? 'cloudy' : r < 0.95 ? 'rain' : [12, 1, 2].includes(m) ? 'snow' : 'rain';
}
function openGarden() {
  if (!gkOn()) { comingSoon('garden'); return; }
  if (S.place !== 'yard') { goHomeFor('garden'); return; }
  if (!gardenUnlocked()) { nope(tt('garden.garden_bond', 'The garden opens at Bond 2.')); return; }
  if (!PG() || typeof PG().open !== 'function') { toast(tt('garden.garden_nap', 'The garden is having a nap. Try again later.')); return; }
  go('garden');
}
function openKitchen() {
  if (!kOn()) { comingSoon('kitchen'); return; }
  if (S.place !== 'house') { goHomeFor('kitchen'); return; }
  if (!kitchenUnlocked()) { nope(tt('garden.kitchen_bond', 'The kitchen opens at Bond 3.')); return; }
  if (!PK() || typeof PK().open !== 'function') { toast(tt('garden.kitchen_nap', 'The kitchen is having a nap. Try again later.')); return; }
  go('kitchen');
}
function goHomeFor(what) {
  const where = what === 'garden' ? 'yard' : 'house';
  const p = openModal(what === 'garden' ? tt('garden.home_garden', 'The garden is at home') : tt('garden.home_kitchen', 'The kitchen is in the house'), `<p>${esc(what === 'garden' ? tt('garden.home_garden_text', 'The veggie patch is in the Home Yard. {name} can take you there.', { name: NAME() }) : tt('garden.home_kitchen_text', 'The kitchen is in the Cozy House. {name} can take you there.', { name: NAME() }))}</p>`, { foot: `<button class="btn" id="ghNo">${tt('garden.not_now', 'Not now')}</button><button class="btn yes" id="ghGo">${tt('garden.go_home', 'Go home')}</button>` });
  $('#ghNo', p).onclick = () => closeModal();
  $('#ghGo', p).onclick = () => { modalClose = null; closeModal(); travelTo(where); setTimeout(() => { if (S.place === where) (what === 'garden' ? openGarden : openKitchen)(); }, 1500); };
}
function enterGarden() {
  setChrome(true, false); dock.innerHTML = ''; view.innerHTML = '';
  gardenAdvance(); const e = envNow(); let closed = false;
  const o = {
    state: S.garden, time: e.time, weather: e.weather, season: e.season, month: monthNow(), dog: dogForMod(), buddy: buddyNow(), seeds: seedCounts(), sfx,
    say: (t) => toast(t),
    onPlant: (plot, cropId) => { if (!(S.inv.seeds[cropId] > 0)) return false; S.inv.seeds[cropId]--; markDirty(); trackAct('garden', { what: 'plant', crop: cropId }); return true; },
    onHarvest: (plot, items, took) => {
      (items || []).forEach((it) => { const a = S.inv.crops[it.crop] = S.inv.crops[it.crop] || [0, 0, 0]; a[clamp((it.stars || 1) - 1, 0, 2)]++; S.cropBest[it.crop] = Math.max(S.cropBest[it.crop] || 0, it.stars || 1); });
      const c = items && items[0] && items[0].crop; if (c) { S.garden.harvests = S.garden.harvests || {}; S.garden.harvests[c] = (S.garden.harvests[c] || 0) + 1; }
      audioCue('harvest'); markDirty(); if (items && items.length) trackAct('garden', { what: 'harvest', crop: c }); if (items && items.length) toast((took ? tt('garden.harvested_iou', "Harvested {n} {crop} (Captain Fluff's IOU: -{took}).", { n: items.length, crop: gkCropPlural(c) || c, took }) : tt('garden.harvested', 'Harvested {n} {crop}.', { n: items.length, crop: gkCropPlural(c) || c })) + ' ' + tt('garden.sniffs', '{sex, select, female {{name} sniffs her share hopefully.} other {{name} sniffs his share hopefully.}}', { name: NAME(), sex: S.dog.sex }), 'good');
    },
    onWater: (plot) => { trackAct('garden', { what: 'water', plot }); }, // v2.5: the watering callback (TODO Shop Day)
    onBonusSeed: (cropId) => { S.inv.seeds[cropId] = (S.inv.seeds[cropId] || 0) + 1; markDirty(); toast(tt('garden.bonus_seed', '{sex, select, female {{name} dug up a bonus {seed}! She is unbearable about it.} other {{name} dug up a bonus {seed}! He is unbearable about it.}}', { name: NAME(), seed: cropInfo(cropId) ? gkCropSeed(cropInfo(cropId)) : tt('garden.seed_word', 'seed'), sex: S.dog.sex }), 'gold'); },
    onChange: (st) => { if (st) { S.garden = mergeHarvests(st); markDirty(); saveNow(); } },
    onClose: () => { if (closed) return; closed = true; if (cur.mode === 'garden') go('yard'); }
  };
  try { gardenCtl = PG().open(showHost(), o); }
  catch (err) { console.warn('PawGarden.open failed', err); hideHost(); toast(tt('garden.garden_nap', 'The garden is having a nap. Try again later.')); setTimeout(() => go('yard'), 0); return; }
  const iv = setInterval(() => gardenAdvance(), 60000);
  onCleanup(() => { clearInterval(iv); closed = true; const c = gardenCtl; gardenCtl = null; try { if (c && c.close) c.close(); } catch (er) { /* ignore */ } hideHost(); });
}
function consumeIngredient(u) {
  const id = u && (u.id || u); if (!id || id === 'water') return;
  if (id in S.inv.pantry) { S.inv.pantry[id] = Math.max(0, (S.inv.pantry[id] || 0) - 1); return; }
  const a = S.inv.crops[id]; if (!a) return;
  let i = u.stars ? u.stars - 1 : -1; if (i < 0 || !a[i]) i = a[2] ? 2 : a[1] ? 1 : 0; a[i] = Math.max(0, a[i] - 1);
}
function walkJunk(forceSafety) {
  if (forceSafety || Math.random() < 0.1) { const f = PICK(peopleFood().filter((x) => x.where.includes('junk'))); safetyNote(f.id, tt('garden.compost_coins', 'It went to the town compost. (+5 coins)')); return { text: tt('garden.junk_food', '{name}? {why} It went to the town compost.', { name: gkPeople(f, 'name'), why: gkPeople(f, 'why') }), coins: 5, safety: f.id }; }
  const j = PICK(JUNK); return { text: j[1], coins: RINT(5, 15) };
}
function safetyNote(id, extra) {
  const f = peopleFood().find((x) => x.id === id); if (!f) return;
  if (!S.safetySeen.includes(id)) { S.safetySeen.push(id); markDirty(); }
  toast(tt('garden.safety', '{name}: {why} {swap}', { name: gkPeople(f, 'name'), why: gkPeople(f, 'why'), swap: gkPeople(f, 'swap') }) + (extra ? ' ' + extra : ''), 'bad');
}
function enterKitchen() {
  setChrome(true, false); dock.innerHTML = ''; view.innerHTML = ''; let closed = false; const e = envNow();
  if (!S.safetySeen.includes('salt')) S.safetySeen.push('salt'); // the module shows the salt note itself
  const o = {
    dog: dogForMod(), time: e.time, weather: e.weather, season: e.season, known: S.recipes.known.slice(), best: Object.assign({}, S.recipes.best),
    pantry: Object.assign({}, S.inv.pantry), crops: JSON.parse(JSON.stringify(S.inv.crops)), fridge: { count: S.inv.dishes.length, max: 8 }, sfx, say: (t) => toast(t),
    onCook: (r) => {
      if (!r || !r.recipe) return;
      (r.used || []).forEach(consumeIngredient);
      if (S.inv.dishes.length < 8) S.inv.dishes.push({ id: r.recipe, stars: clamp(r.stars || 1, 1, 3) });
      if (r.recipe !== 'mystery-mush') {
        if (!S.recipes.known.includes(r.recipe)) S.recipes.known.push(r.recipe);
        S.recipes.best[r.recipe] = Math.max(S.recipes.best[r.recipe] || 0, r.stars || 1);
      }
      audioCue(r.discovered ? 'discover' : 'cooked'); trackAct('cook', { dish: r.recipe, stars: r.stars || 1 });
      const prep = { pumpkin: 1, 'sweet-potato': 1, spinach: 1, chicken: 1 }; // (the reveal card in the kitchen module has the notes)
      (r.used || []).forEach((u) => { const id = u && (u.id || u); if (prep[id] && !S.safetySeen.includes('prep-' + id)) S.safetySeen.push('prep-' + id); }); // the reveal card shows the note
      markDirty(); saveNow();
      const ri = recipeInfo(r.recipe); toast(tt('garden.dish_made', '{dish} {stars} is in the fridge ({n}/8).{new, select, yes { NEW recipe!} other {}}', { dish: ri ? gkRecipeName(ri) : tt('garden.a_dish', 'A dish'), stars: '★'.repeat(r.stars || 1), n: S.inv.dishes.length, new: r.discovered ? 'yes' : 'no' }) + ' ' + tt('garden.drooling', '{sex, select, female {{name} is drooling. She saw everything.} other {{name} is drooling. He saw everything.}}', { name: NAME(), sex: S.dog.sex }), 'gold');
      if (kitchenCtl && kitchenCtl.update) { try { kitchenCtl.update({ pantry: Object.assign({}, S.inv.pantry), crops: JSON.parse(JSON.stringify(S.inv.crops)), fridge: { count: S.inv.dishes.length, max: 8 }, known: S.recipes.known.slice(), best: Object.assign({}, S.recipes.best) }); } catch (er) { /* ignore */ } }
    },
    onSafety: (id) => { if (!S.safetySeen.includes(id)) { S.safetySeen.push(id); markDirty(); } }, // the module shows the note
    onClose: () => { if (closed) return; closed = true; if (cur.mode === 'kitchen') go('yard'); }
  };
  try { kitchenCtl = PK().open(showHost(), o); }
  catch (err) { console.warn('PawKitchen.open failed', err); hideHost(); toast(tt('garden.kitchen_nap', 'The kitchen is having a nap. Try again later.')); setTimeout(() => go('yard'), 0); return; }
  onCleanup(() => { closed = true; const c = kitchenCtl; kitchenCtl = null; try { if (c && c.close) c.close(); } catch (er) { /* ignore */ } hideHost(); });
}
/* ---- Pip's Sprout Cart ---- */
let pipTab = 'seeds';
const STAR_MULT = [1, 1.5, 2];
function openPip(tab) {
  if (!gkOn()) { SFX.boop(620); const pip = artReal('prop', 'pip'); openModal(shopTitle('sprout'), `<div class="pip-top">${pip ? `<span class="pip-art">${pip}</span>` : ''}<p>${tt('garden.pip_setting_up', '"Setting up! Back soon with seeds."')} <span class="small">${tt('garden.pip_hose', 'Pip is untangling a very long hose.')}</span></p></div>${soonCard('garden')}`, { cls: 'shop' }); return; }
  if (tab) pipTab = tab; audioPlace('shop'); SFX.boop(620);
  const sz = seasonNow(), pip = artReal('prop', 'pip'); // v2.5: follows the Season override like the art
  const tabs = [['seeds', tt('garden.tab_seeds', 'Seeds')], ['sell', tt('garden.tab_sell', 'Sell crops')], ['people', tt('garden.tab_people', 'People gardens only')]];
  let body = '';
  if (pipTab === 'seeds') body = `<div class="shopgrid">${cropsList().slice().sort((a, b) => (b.seasons.includes(sz) ? 1 : 0) - (a.seasons.includes(sz) ? 1 : 0)).map((c) => `<div class="sitem"><span class="art">${art('item', c.seedItem)}</span><b>${esc(gkCropSeed(c))}</b>${c.seasons.includes(sz) ? `<span class="stamp r1">${tt('garden.in_season', 'In season')}</span>` : ''}<span class="desc">${esc(tt('garden.crop_desc', '{seasons} · {time} · {yield} per harvest{hardy, select, yes { · hardy} other {}}', { seasons: gkSeasons(c.seasons), time: cropTimeTxt(c), yield: c.yield, hardy: c.hardy ? 'yes' : 'no' }))}</span>${priceHTML(tt('shop.price_each', '{price} each', { price: c.seed }))}<span class="small">${tt('shop.you_have_n', 'You have {n}', { n: S.inv.seeds[c.id] || 0 })}</span><button class="btn yes" data-seed="${c.id}">${tt('shop.buy_more', 'Buy…')}</button></div>`).join('')}</div>`;
  else if (pipTab === 'sell') {
    const left = pipLeft(), rows = []; cropsList().forEach((c) => { const a = S.inv.crops[c.id] || [0, 0, 0]; a.forEach((n, i) => { const each = Math.round(c.sell * STAR_MULT[i]), fits = each <= left; if (n > 0) rows.push(`<div class="sitem"><span class="art">${art('item', c.item)}</span><b>${esc(gkCropName(c))} ${'★'.repeat(i + 1)}</b><span class="desc">${esc(tt('garden.sell_row', 'x{n} · {sell} × {mult} = {each} each', { n, sell: c.sell, mult: STAR_MULT[i], each }))}</span><button class="btn ${fits ? 'yes' : ''}" data-sell="${c.id}|${i}" ${fits ? '' : 'aria-disabled="true"'}>${fits ? tt('garden.sell_more', 'Sell…') : left ? tt('garden.no_room', 'No room today') : tt('garden.cart_full', 'Cart full')}</button></div>`); }); });
    const cap = `<p class="pipcap small"${left ? '' : ' data-full="1"'}>${left ? tt('garden.cap_html', "Pip's cart today: <b>{used} / {cap}</b> coins of crops. He can buy <b>{left}</b> more coins' worth today. Extra veggies are great for cooking!", { used: PIP_CAP - left, cap: PIP_CAP, left }) : tt('garden.cap_full_html', '<b>{msg}</b> ({cap} coins of crops a day.) Extra veggies are great for cooking!', { msg: pipFull(), cap: PIP_CAP })}</p>`;
    body = cap + (rows.length ? `<div class="shopgrid">${rows.join('')}</div>` : `<p>${tt('garden.no_crops', 'No crops to sell yet. Grow some in the garden at home!')}</p>`);
  } else body = `<p class="small">${tt('garden.people_intro', 'Pip grows these for people only. They are never sold to dog owners. Tap one to see why.')}</p><div class="shopgrid">${peopleFood().filter((f) => f.where.includes('rack')).map((f) => `<button class="sitem lockd people" data-people="${f.id}"><span class="art">${art('item', f.name)}</span><span class="pawstop">${iconOr('paw-stop', '<circle r="12" fill="#F28FA5" stroke="#5B3D32" stroke-width="2"/><path d="M-6 0h12" stroke="#fff" stroke-width="3"/>')}</span><b>${esc(gkPeople(f, 'name'))}</b><span class="desc">${tt('garden.not_for_dogs', 'Not for dogs')}</span></button>`).join('')}</div>`;
  const p = openModal(shopTitle('sprout'), `<div class="pip-top">${pip ? `<span class="pip-art">${pip}</span>` : ''}<p>${tt('garden.pip_howdy_html', '"Howdy! Seeds for the patch, and I buy what you grow. Season now: <b>{season}</b>."', { season: gkSeason(sz) })} <span class="small">${esc(tt('garden.coins_have', '{coins, plural, one {You have # Paw Coin.} other {You have # Paw Coins.}}', { coins: S.coins }))}</span></p></div><div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="btn" role="tab" data-ptab="${k}" aria-selected="${pipTab === k}">${l}</button>`).join('')}</div>${body}`, { cls: 'shop' });
  p.querySelectorAll('[data-ptab]').forEach((b) => { b.onclick = () => openPip(b.dataset.ptab); });
  p.querySelectorAll('[data-seed]').forEach((b) => { b.onclick = async () => { const c = cropInfo(b.dataset.seed); SFX.click(); const q = await buyWindow(p, { art: art('item', c.seedItem), name: gkCropSeed(c), desc: tt('garden.seed_desc', '{seasons} · {time} · {yield} per harvest', { seasons: gkSeasons(c.seasons), time: cropTimeTxt(c), yield: c.yield }), price: c.seed, stack: true, have: S.inv.seeds[c.id] || 0, haveLabel: tt('garden.in_pouch', 'In pouch') }); if (!q) return; const cost = c.seed * q; if (S.coins < cost) { nope(tt('shop.not_enough', 'Not enough coins. Have you tried being rich?')); return; } S.coins -= cost; S.inv.seeds[c.id] = (S.inv.seeds[c.id] || 0) + q; SFX.kaching(); markDirty(); trackAct('buy', { name: c.seedItem, cat: 'seeds', qty: q, shop: 'sprout' }); updateHUD(); toast(tt('garden.bought_seed', 'Bought {q} × {item}. Pip tips that enormous hat.', { q, item: gkCropSeed(c) }), 'gold'); openPip(); }; });
  p.querySelectorAll('[data-sell]').forEach((b) => { b.onclick = async () => {
    const [id, i] = b.dataset.sell.split('|'), c = cropInfo(id), a = S.inv.crops[id]; if (!a || !a[+i]) return;
    const each = Math.round(c.sell * STAR_MULT[+i]), left = pipLeft();
    if (!left) { nope(pipFull()); return; }
    if (each > left) { nope(tt('garden.pip_room', 'Pip only has room for {left, plural, one {# more coin} other {# more coins}} of crops today. Back tomorrow!', { left })); return; }
    SFX.click(); const room = Math.floor(left / each);
    const q0 = await buyWindow(p, { art: art('item', c.item), name: `${gkCropName(c)} ${'★'.repeat(+i + 1)}`, desc: tt('garden.sell_desc', "Pip pays {sell} × {mult} for {stars}-star {crop}. Pip's cart today: {used} / {cap} coins, room for {room} more.", { sell: c.sell, mult: STAR_MULT[+i], stars: +i + 1, crop: tdata('crop_names.' + tid(c.id), c.name.toLowerCase()), used: PIP_CAP - left, cap: PIP_CAP, room }), price: each, sell: true, max: Math.min(a[+i], room), have: a[+i], haveLabel: tt('garden.in_basket', 'In basket') });
    const q = Math.min(q0, a[+i], Math.floor(pipLeft() / each)); if (!q) return;
    a[+i] -= q; const got = addCoins(each * q, { raw: true }); pipToday().coins += each * q; SFX.kaching(); markDirty();
    toast(tt('garden.sold', 'Sold {q} {crop} for {got, plural, one {# coin} other {# coins}}. Pip says {name} is a fine farm dog.', { q, crop: gkCropName(c), got, name: NAME() }) + (pipLeft() ? '' : ' ' + pipFull()), 'gold'); openPip();
  }; });
  p.querySelectorAll('[data-people]').forEach((b) => { b.onclick = () => safetyNote(b.dataset.people); });
}
/* ---- dishes: feeding, limits, buffs ---- */
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function buffOn(id) { const b = S && S.buff; if (!b || b.id !== id) return false; if (b.until) return Date.now() < b.until; return (b.walks || 0) > 0; }
function buffTick() { if (S && S.buff && S.buff.until && Date.now() >= S.buff.until) { const n = S.buff.dish; S.buff = null; markDirty(); toast(tt('garden.buff_off', 'The {dish} buff wore off.', { dish: n ? (() => { const r = recipesList().find((x) => x.name === n); return r ? gkRecipeName(r) : n; })() : tt('garden.dish_word', 'dish') })); } }
function buffLabel() { const b = S.buff; if (!b) return ''; if (b.until) { const h = Math.max(0, (b.until - Date.now()) / 36e5); return h >= 1 ? tt('garden.buff_h', '{n}h', { n: Math.ceil(h) }) : tt('garden.buff_m', '{n}m', { n: Math.ceil(h * 60) }); } return tt('garden.buff_next', 'next walk'); }
const BUFF_TXT = { walk15: 'next walk +15 s', cool: 'cool for 24 h: no heat, walks tire less', warm: 'warm for 24 h: no shivers, slower Happiness drop', dig1: 'next walk: +1 dig' };
function eatDish(id, stars) {
  if (busy) return; const r = recipeInfo(id); if (!r) return;
  if (!atHome()) { nope(tt('garden.meals_home', 'Meals are served at home. Dishes count as meals, so they wait in the fridge.')); return; }
  if (S.sleeping) { nope(tt('garden.asleep', '{sex, select, female {{name} is asleep. Wake her first (Care menu).} other {{name} is asleep. Wake him first (Care menu).}}', { name: NAME(), sex: S.dog.sex })); return; }
  if (S.dishLog.date !== todayKey()) S.dishLog = { date: todayKey(), count: 0, bond: false };
  if (S.dishLog.count >= 2) { nope(tt('garden.treats_extra', "Treats are extras. Real vets say about a tenth of a dog's food. Kibble for the rest of today!")); return; }
  const i = S.inv.dishes.findIndex((d) => d.id === id && d.stars === stars); if (i < 0) return;
  S.inv.dishes.splice(i, 1); S.dishLog.count++; busy = true; hideBubble(); markDirty(); popDown(); pottyAfter('meal');
  S.bowl = r.name; setBowl(r.name); dogTo(-125, 0, 1, 0.8); renderDog('walk', 'left');
  setTimeout(() => { renderDog('eat', 'left'); SFX.crunch(); }, 850);
  setTimeout(() => {
    S.bowl = null; setBowl(null);
    const m = [1, 1.25, 1.5][stars - 1] || 1, fx = r.effect || {}, fav = DISH_FAV[S.dog.key] === id;
    addStat('hunger', (fx.hunger || 0) * m); addStat('energy', (fx.energy || 0) * m);
    const hp = Math.round((fx.happy || 0) * m * (fav ? 1.5 : 1)); addStat('happy', hp);
    let bp = 0; if (!S.dishLog.bond && ((fx.bond || 0) > 0 || fav)) { bp = addBond(Math.min(37, Math.floor((fx.bond || 0) * m + (fav ? 10 : 0))), { raw: true }); S.dishLog.bond = true; }
    let buffMsg = '';
    if (fx.buff && fx.buff.id) { S.buff = { id: fx.buff.id, until: fx.buff.hours ? Date.now() + fx.buff.hours * 36e5 : null, walks: fx.buff.walks || (fx.buff.hours ? 0 : 1), dish: r.name }; buffMsg = tt('garden.buff_line', 'Buff: {text}.', { text: gkBuffTxt(fx.buff.id) }); }
    toast([tt('garden.licked', '{name} licked the {dish} bowl clean.', { name: NAME(), dish: gkRecipeName(r) }), hp ? tt('garden.plus_happy', '+{n} Happiness.', { n: hp }) : '', bp ? tt('garden.plus_bond', '+{n} Bond.', { n: bp }) : '', fav ? tt('garden.fav_dish', '{sex, select, female {Her favourite dish! She does a happy wiggle.} other {His favourite dish! He does a happy wiggle.}}', { sex: S.dog.sex }) : '', buffMsg, tt('garden.dishes_today', '(Dishes today: {n}/2)', { n: S.dishLog.count })].filter(Boolean).join(' '), 'good');
    setTemp('happy', 1600); dogTo(0, 0, 1, 0.8); updateHUD(); markDirty();
    setTimeout(() => { busy = false; renderDog(dogPoseNow()); }, 900);
    if (dock.querySelector('[data-food],[data-dish]')) openFeedTray();
  }, 2300);
}
function dishRowHTML(off) {
  if (!S.inv.dishes.length) return '';
  const g = {}; S.inv.dishes.forEach((d) => { const k = d.id + '|' + d.stars; g[k] = (g[k] || 0) + 1; });
  return `${Object.keys(g).map((k) => { const [id, st] = k.split('|'), r = recipeInfo(id); return `<button class="card ${off ? 'off meal' : ''}" data-dish="${k}" ${off ? 'aria-disabled="true"' : ''} aria-label="${esc(tt('garden.feed_aria', '{off, select, yes {Feed {dish} (meals are served at home)} other {Feed {dish}}}', { off: off ? 'yes' : 'no', dish: r ? gkRecipeName(r) : id }))}"><span class="cnt">${g[k]}</span><span class="art">${art('item', r ? r.name : id)}</span><b>${esc(r ? gkRecipeName(r) : id)}</b><span class="small stars">${'★'.repeat(+st)}${DISH_FAV[S.dog.key] === id ? ' ' + tt('garden.fav_bang', 'fav!') : ''} · ${tt('garden.dish_word', 'dish')}</span></button>`; }).join('')}`;
}
/* ---- journal tabs: garden, recipes, profile ---- */
function journalGarden() {
  const sz = seasonNow(); // v2.5
  return `<div class="jtop"><div class="jprog"><b>${(S.garden.plots || []).filter((p) => p.crop).length} / 6</b><span class="small">${esc(tt('garden.plots_line', 'plots planted · season now: {season} · buddy perk: {perk}', { season: gkSeason(sz), perk: buddyNow() || tt('garden.none', 'none') }))}</span><span class="small">${gardenStatusTxt()}</span><span class="small">${tt('garden.grow_note', "Crops grow in real hours, even while you're away. Each plot holds 3 drops: about 3 hours on a sunny day, 6 when cloudy, 9 at night. Rain refills them. Pip buys up to {cap} coins of crops a day ({left} left today).", { cap: PIP_CAP, left: pipLeft() })}</span></div><div><button class="btn yes big" data-jopen="garden">${tt('garden.open_garden', 'Open garden')}</button></div></div>
    <div class="jgrid">${cropsList().map((c) => `<div class="jent"><span class="art">${art('item', c.item)}</span><b>${esc(gkCropName(c))}</b>${c.seasons.includes(sz) ? `<span class="stamp r1">${tt('garden.in_season', 'In season')}</span>` : ''}<span class="ab">${esc(tt('garden.crop_card', 'Seasons: {seasons}. {rg, select, none {Ready in about {h}} other {Ready in about {h}, regrows in {r} ({p} picks per bush)}}; half speed out of season. Seed {seed}, sells for {sell} (1★).', { seasons: gkSeasons(c.seasons), rg: c.regrow ? 'yes' : 'none', h: hrs(c.hours), r: c.regrow ? hrs(c.regrow) : '', p: c.picks || tt('garden.many', 'many'), seed: c.seed, sell: c.sell }))}</span><span class="small">${esc(tt('garden.crop_stats', 'Harvested {n, plural, one {# time} other {# times}} · best {best} · seeds: {seeds}', { n: (S.garden.harvests || {})[c.id] || 0, best: S.cropBest[c.id] ? '★'.repeat(S.cropBest[c.id]) : tt('garden.none_yet', 'none yet'), seeds: S.inv.seeds[c.id] || 0 }))}</span></div>`).join('')}</div>`;
}
function gardenStatusTxt() {
  const pl = (S.garden && S.garden.plots) || [], m = monthNow(), G = PG();
  const ready = pl.filter((p) => p.crop && p.g >= 1).length, grow = pl.filter((p) => p.crop && p.g < 1);
  if (!grow.length) return ready ? tt('garden.plots_ready', '{n, plural, one {# plot is ready to pick!} other {# plots are ready to pick!}}', { n: ready }) : tt('garden.nothing_growing', 'Nothing growing right now.');
  const left = grow.map((p) => { const c = cropInfo(p.crop); if (!c) return 99; if (G && G.hoursLeft) { try { return G.hoursLeft(p, m); } catch (e) { /* fall through */ } } return (1 - p.g) * c.hours / (c.seasons.includes(seasonOf(m)) ? 1 : 0.5); });
  const next = Math.min.apply(null, left), dry = grow.filter((p) => !p.water).length;
  return [ready ? tt('garden.n_ready', '{n} ready to pick ·', { n: ready }) : '', next < 0.75 ? tt('garden.next_under', 'next crop ready in under an hour') : tt('garden.next_about', 'next crop ready in about {hrs}', { hrs: hrs(next) }), dry ? tt('garden.thirsty', '· {n, plural, one {# thirsty plot (not growing until watered)} other {# thirsty plots (not growing until watered)}}', { n: dry }) : ''].filter(Boolean).join(' ');
}
function journalRecipes() {
  return `<div class="jtop"><div class="jprog"><b>${S.recipes.known.length} / 6</b><span class="small">${esc(tt('garden.recipes_line', 'recipes known · fridge {n}/8 · {buff}', { n: S.inv.dishes.length, buff: S.buff ? tt('garden.buff_colon', 'buff: {text}', { text: gkBuffTxt(S.buff.id) }) : tt('garden.no_buff', 'no buff active') }))}</span></div><div><button class="btn yes big" data-jopen="kitchen">${tt('garden.open_kitchen', 'Open kitchen')}</button></div></div>
    <div class="jgrid">${recipesList().filter((r) => r.id !== 'mystery-mush').map((r) => { const k = S.recipes.known.includes(r.id), fx = r.effect || {}; const ings = r.ingredients.map((i) => { const ci = cropInfo(i), pi = !ci && pantryList().find((x) => x.id === i); return ci ? gkCropName(ci) : pi ? tdata('pantry.' + tid(pi.id) + '.name', pi.name) : i === 'water' ? shNameAny('Fresh Water') : i; }).join(' + '), fxs = ['hunger', 'happy', 'energy', 'bond'].filter((x) => fx[x]).map((x) => tt('garden.stat_plus', '{stat} +{n}', { stat: gkStat(x), n: fx[x] })).join(gkSep()); return k ? `<div class="jent"><span class="art">${art('item', r.name)}</span><b>${esc(gkRecipeName(r))}</b>${DISH_FAV[S.dog.key] === r.id ? `<span class="stamp r3">${esc(tt('garden.favourite', "{name}'s favourite", { name: NAME() }))}</span>` : ''}<span class="ab">${esc(fx.buff ? tt('garden.recipe_ab_buff', '{ings}. {fx}. {buff}', { ings, fx: fxs, buff: gkBuffTxt(fx.buff.id) }) : tt('garden.recipe_ab', '{ings}. {fx}', { ings, fx: fxs }))}</span><span class="small">${esc(tt('garden.best', 'Best: {best}', { best: S.recipes.best[r.id] ? '★'.repeat(S.recipes.best[r.id]) : tt('garden.not_cooked', 'not cooked yet') }))}</span></div>` : `<div class="jent unk"><span class="art">${art('item', r.name)}</span><b>???</b><span class="small">${esc(tt('garden.unknown_recipe', '{hint} ({n, plural, one {# ingredient} other {# ingredients}})', { hint: r.hint ? tdata('recipes.' + tid(r.id) + '.hint', r.hint) : tt('garden.experiment', 'Experiment in the kitchen.'), n: r.ingredients.length }))}</span></div>`; }).join('')}</div>`;
}
function journalProfile() {
  const d = S.dog, m = ageMonths(), st = lifeStage(m), ss = seasonStatus(), info = dogInfo(d.key), P = PR(), today = localISO();
  const bday = (() => { const next = 12 - (m % 12); return tt('garden.bday', 'Born {born} · next birthday in {n, plural, one {# day} other {# days}}', { born: d.born, n: next }); })();
  const R = BREEDING.RULES, maxL = (giantRules(d) && giantRules(d).maxLitters) || (R.female && R.female.maxLitters) || 4;
  const me = famRec(d.id) || { id: d.id, parents: d.parents }, [dam, sire] = famParents(me), kids = famChildren(d.id), gen = d.gen || (dam || sire ? 1 : 0);
  const master = !!(S.coatRewards && S.coatRewards[50]);
  const breedTxt = d.mix && d.mix.name ? mixLine(d) : tbreed(d.key);
  // family card: parents and children as little heads (click -> Family tab)
  const fh = (id, lbl) => { const r = famRec(id); return r ? `<button class="pf-fh" data-fam="${esc(r.id)}" title="${esc(tt('garden.parent_title', '{label}: {name}', { label: lbl, name: r.name || '?' }))}"><span class="fhead">${famHead(r)}</span><span class="small">${esc(r.name || '?')}</span></button>` : `<span class="pf-fh unk"><span class="fhead"><b>?</b></span><span class="small">${lbl}</span></span>`; };
  const famCard = `<div class="jent pf-fam"><b>${tt('garden.family', 'Family')}</b><div class="pf-par">${fh(dam, tt('garden.mum', 'Mum'))}${fh(sire, tt('garden.dad', 'Dad'))}</div><span class="small">${esc(tt('garden.fam_line', '{gen} · {pups}', { gen: dam || sire ? tt('journal.gen', 'Generation {gen}', { gen }) : d.rescue ? tt('garden.gen0_rescued', 'Generation 0 · rescued') : tt('garden.gen0_shelter', 'Generation 0 · shelter starter'), pups: kids.length ? tt('garden.n_pups', '{n, plural, one {# puppy} other {# puppies}}', { n: kids.length }) : tt('garden.no_pups', 'no puppies yet') }))}</span>
    ${kids.length ? `<div class="pf-kids">${kids.slice(0, 6).map((k) => `<button class="pf-kid" data-fam="${esc(k.id)}" title="${esc(k.name)}">${famHead(k)}</button>`).join('')}${kids.length > 6 ? `<span class="small">+${kids.length - 6}</span>` : ''}</div>` : ''}
    <button class="btn" data-fam="${esc(d.id)}">${tt('garden.family_tree', 'Family tree')}</button></div>`;
  // status card: season / expecting / nursing / resting, litters, fixed
  const nursing = (S.litters || []).find((l) => l && l.mum === d.id);
  let stat = `<span class="ab season ${ss.inSeason ? 'on' : ''}">${esc(d.sex === 'female' ? ss.txt : (d.fixed ? tt('garden.neutered_note', 'Neutered: no playdates') : tt('garden.boys_note', 'Boys have no season.')))}</span>`;
  if (d.preg && d.preg.due) { const n = Math.max(0, isoDays(today, d.preg.due)); stat = `<span class="ab season on">${esc(tt('garden.expecting', 'Expecting! {due}', { due: n ? tt('garden.due_in', 'Due in {n, plural, one {# day} other {# days}}', { n }) : tt('garden.due_now', 'Due any moment now') }) + (d.preg.scanned && d.preg.pups ? ' ' + tt('garden.on_scan', '· {n, plural, one {# puppy on the scan} other {# puppies on the scan}}', { n: d.preg.pups.length }) : ''))}</span>`; }
  else if (nursing) { const n = Math.max(0, isoDays(today, nursing.until || today)), c = (nursing.pups || []).length; stat = `<span class="ab season on">${esc(tt('garden.nursing', 'Nursing {c, plural, one {# puppy} other {# puppies}}. {when}', { c, when: n ? tt('garden.homes_in', 'New homes in {n, plural, one {# day} other {# days}}', { n }) : tt('garden.choosing_day', 'Choosing day!') }))}</span>`; }
  else if (d.sex === 'male' && d.restUntil && d.restUntil > today) stat = `<span class="ab season">${esc(tt('garden.resting', 'Resting after a playdate (back {date})', { date: isoDay(d.restUntil) }))}</span>`;
  const statCard = `<div class="jent pf-stat"><b>${d.sex === 'female' ? tt('garden.season', 'Season') : tt('garden.playdates', 'Playdates')}</b>${stat}<span class="small">${esc(tt('garden.litter_line', '{litters} · {fixed}', { litters: d.sex === 'female' ? tt('garden.litters', 'Litters: {n} of {max}', { n: d.litters || 0, max: maxL }) : tt('garden.fathered', 'Litters fathered: {n}', { n: kids.length ? new Set(kids.map((k) => k.born)).size : 0 }), fixed: d.fixed ? (d.sex === 'female' ? tt('garden.spayed', 'Spayed') : tt('garden.neutered', 'Neutered')) : tt('garden.not_fixed', 'Not fixed') }))}</span></div>`;
  // genes card
  let genesCard;
  if (d.geneTested) {
    let desc = null; try { const G = window.PawGenes; if (G && typeof G.describe === 'function') desc = G.describe(d.genes); } catch (e) { desc = null; }
    if (!desc || !Array.isArray(desc.lines)) desc = genesDescribeFB(d.genes);
    genesCard = `<div class="jent pf-genes tested"><b>${tt('garden.genes', 'Genes')}</b><ul class="glines">${desc.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><span class="small">${desc.carriers && desc.carriers.length ? `${esc(tt('garden.carries', 'Carries:'))} ${desc.carriers.map((c) => `<span class="gcar">${esc(c)}</span>`).join(' ')}` : tt('garden.carries_none', 'Carries nothing hidden. What you see is what you get.')}</span></div>`;
  } else genesCard = `<div class="jent pf-genes"><b>${tt('garden.genes', 'Genes')}</b><span class="genes">${['B', 'D', 'E', 'S', 'M', 'Bl'].map((g) => `<span class="gslot">${g}<i>?</i></span>`).join('')}</span><span class="small">${tt('garden.genes_hidden', 'Hidden. Gene test at the Vet Clinic.')}</span></div>`;
  // dog spots card
  let spots = null; try { if (typeof dogSlots === 'function') spots = dogSlots(); } catch (e) { spots = null; }
  const used = S.dogs.length, cap = spots ? spots.cap : null;
  const spotCard = `<div class="jent pf-spots"><b>${tt('garden.dog_spots', 'Dog spots')}</b><span class="spotrow">${[1, 2, 3, 4].map((n) => `<i class="${n <= used ? 'full' : cap != null && n <= cap ? 'open' : 'lock'}"></i>`).join('')}</span><span class="small">${esc(cap != null ? tt('garden.spots_used', '{used} of {cap, plural, one {# open spot} other {# open spots}} used. Bond opens more.', { used, cap }) : tt('garden.spots_home', '{used, plural, one {# dog} other {# dogs}} at home. Bond opens more.', { used }))}</span><button class="btn" data-spots="1">${tt('garden.dog_spots', 'Dog spots')}</button></div>`;
  return `<div class="profile"><div class="pf-head"><span class="portrait big ${d.sparkle ? 'spk' : ''}">${headSVG(d)}</span><div><h3>${esc(d.name)} ${sexSym(d.sex)}${d.sparkle ? ` <span class="spkbadge" title="${tt('garden.sparkle_title', 'A Sparkle puppy: one in hundreds')}">&#10022; ${tt('journal.sparkle', 'Sparkle')}</span>` : ''}${master ? ` <span class="titlebadge">${jrTitleName('Master Breeder')}</span>` : ''}${d.proud ? ` <span class="titlebadge proud" title="${tt('garden.four_litters', 'Four litters')}">${tt('garden.proud_mum', 'Proud Mum')}</span>` : ''}</h3><p>${d.sex === 'female' ? tt('garden.girl', 'Girl') : d.sex === 'male' ? tt('garden.boy', 'Boy') : tt('garden.paperwork', 'Paperwork pending')} · ${esc(breedTxt)} · ${esc(info.personality)}${gen ? ` · <b>${esc(tt('garden.gen_short', 'Gen {gen}', { gen }))}</b>` : ''}</p>${jrAncLine(d)}<p class="coatline">${esc(tt('garden.coatline', '{coat} coat, {eyes} eyes', { coat: coatNameOf(d), eyes: eyesOf(d) }))}${d.rescue ? ` · <b>${esc(tt('garden.rescued_on', 'Rescued on {date}', { date: d.rescue.date }))}</b>` : ''}</p><p>${tt('garden.age_html', '<b>{age}</b> old ({stage})', { age: ageText(m), stage: gkStage(st) })}${st === 'senior' ? ' · ' + esc(tt('garden.senior_note', '{sex, select, female {She has a distinguished grey muzzle now.} other {He has a distinguished grey muzzle now.}}', { sex: d.sex })) : ''}</p><p class="small">${esc(tt('garden.bday_note', '{bday}. One real day is one dog month.', { bday }))}</p></div></div>
    <p class="small potty">${esc(tt('garden.potty', 'Potty stats: Scooped: {scooped}. Accidents indoors: {accidents}. {note}', { scooped: (S.potty || {}).scooped || 0, accidents: (S.potty || {}).accidents || 0, note: ((S.potty || {}).accidents || 0) === 0 ? tt('garden.potty_clean', '{sex, select, female {A spotless record. She would like that framed.} other {A spotless record. He would like that framed.}}', { sex: d.sex }) : tt('garden.potty_rug', 'Nobody is perfect. Especially not the rug.') }))}</p>
    ${jrTitlesRow()}
    <div class="pf-grid">${famCard}${statCard}${genesCard}${spotCard}</div></div>`;
}
// plain-words gene card when the genes module has no describe() yet
function gkStage(s) { return s === 'puppy' ? tt('garden.stage_puppy', 'puppy') : s === 'adult' ? tt('garden.stage_adult', 'adult') : s === 'senior' ? tt('garden.stage_senior', 'senior') : String(s); }
function genesDescribeFB(g) {
  const has = (p, a) => Array.isArray(p) && p.includes(a), both = (p, a) => Array.isArray(p) && p[0] === a && p[1] === a, j = (p) => (Array.isArray(p) ? p.join('/') : '?');
  g = g || {}; const lines = [], car = [];
  const tl = (pair, txt) => tt('garden.fb_line', '{pair}: {text}', { pair, text: txt });
  lines.push(tl(j(g.B), both(g.B, 'b') ? tt('garden.fb_b_hom', 'liver (chocolate) pigment') : has(g.B, 'b') ? tt('garden.fb_b_het', 'black pigment, carries liver') : tt('garden.fb_b_none', 'black pigment'))); if (has(g.B, 'b') && !both(g.B, 'b')) car.push('liver');
  lines.push(tl(j(g.D), both(g.D, 'd') ? tt('garden.fb_d_hom', 'diluted colour (blue or lilac)') : has(g.D, 'd') ? tt('garden.fb_d_het', 'full-strength colour, carries dilute') : tt('garden.fb_d_none', 'full-strength colour'))); if (has(g.D, 'd') && !both(g.D, 'd')) car.push('dilute');
  lines.push(tl(j(g.E), both(g.E, 'e') ? tt('garden.fb_e_hom', 'red or cream coat') : has(g.E, 'e') ? tt('garden.fb_e_het', 'dark pigment shows, carries red') : tt('garden.fb_e_none', 'dark pigment shows'))); if (has(g.E, 'e') && !both(g.E, 'e')) car.push('red');
  lines.push(tl(j(g.S), both(g.S, 'sp') ? tt('garden.fb_s_hom', 'piebald patches') : has(g.S, 'sp') ? tt('garden.fb_s_het', 'a little white, carries piebald') : tt('garden.fb_s_none', 'solid, little white'))); if (has(g.S, 'sp') && !both(g.S, 'sp')) car.push('piebald');
  lines.push(tl(j(g.M), has(g.M, 'M') ? tt('garden.fb_m_yes', 'merle (never pair with another merle)') : tt('garden.fb_m_no', 'no merle')));
  lines.push(tl(j(g.Bl), both(g.Bl, 'Bl') ? tt('garden.fb_bl_hom', 'blue eyes') : has(g.Bl, 'Bl') ? tt('garden.fb_bl_het', 'blue or odd eyes') : tt('garden.fb_bl_none', 'brown eyes')));
  return { lines, carriers: car };
}
