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
const DISH_FAV = { shiba: 'golden-harvest-stew', corgi: 'chicken-veggie-rice', golden: 'carrot-crunchies', dachs: 'spinach-scramble', husky: 'blueberry-pupsicle', mutt: 'golden-harvest-stew', chihuahua: 'chicken-veggie-rice', pug: 'pumpkin-pupcake', greyhound: 'carrot-crunchies', beagle: 'golden-harvest-stew', poodle: 'spinach-scramble', collie: 'chicken-veggie-rice', samoyed: 'blueberry-pupsicle', frenchie: 'pumpkin-pupcake' };
const BUDDY_FB = { shiba: 'inspect', corgi: 'guard', golden: 'fetch', dachs: 'dig', husky: 'snow', mutt: 'tend', chihuahua: 'guard', pug: 'tend', greyhound: 'fetch', beagle: 'inspect', poodle: 'inspect', collie: 'guard', samoyed: 'snow', frenchie: 'tend' };
const START_RECIPES = ['carrot-crunchies', 'chicken-veggie-rice', 'blueberry-pupsicle'];
const CROP_PLURAL = { carrot: 'carrots', peas: 'peas', spinach: 'spinach', blueberries: 'blueberries', 'sweet-potato': 'sweet potatoes', pumpkin: 'pumpkin' };
const CROP_ONE = { carrot: 'carrot', peas: 'pea pod', spinach: 'spinach leaf', blueberries: 'blueberry', 'sweet-potato': 'sweet potato', pumpkin: 'pumpkin' };
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
const hrs = (h) => { const n = Math.max(1, Math.round(h)); return `${n} hour${n === 1 ? '' : 's'}`; };
const cropTimeTxt = (c) => `ready in about ${hrs(c.hours)}${c.regrow ? `, then regrows every ${hrs(c.regrow)}${c.picks ? ` (${c.picks} picks per bush)` : ''}` : ''}`;
// Dev: +N garden hours with a chosen weather (+1 hour, +1 period = 8 hours). A pinned dev Time decides day/night.
function gardenDevStep(hours, w) { gardenAdvance({ steps: hours, stepWeather: w, stepTime: ENV.time !== 'auto' ? timePhase() : undefined }); }
function gardenDevReady() { const g = JSON.parse(JSON.stringify(S.garden)); g.plots.forEach((pl) => { if (pl.crop) { pl.g = 1; pl.ready = pl.ready || g.last || gardenHourKey(); } }); S.garden = g; markDirty(); if (gardenCtl && gardenCtl.update) gardenCtl.update({ state: S.garden }); }
/* Pip buys at most 60 coins of crops per real day */
const PIP_CAP = 60;
function pipToday() { if (!S.pipSold || S.pipSold.date !== todayKey()) S.pipSold = { date: todayKey(), coins: 0 }; return S.pipSold; }
const pipLeft = () => Math.max(0, PIP_CAP - pipToday().coins);
const PIP_FULL = "Pip's cart is full! Back tomorrow.";
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
  const c = ev.crop || (S.garden.plots[ev.plot] || {}).crop; const pl = CROP_PLURAL[c] || 'veggies';
  if (ev.type === 'ready') toast(`The ${pl} ${['spinach', 'pumpkin'].includes(c) ? 'is' : 'are'} ready!`, 'good');
  if (ev.type === 'squirrel') { sfx('squirrel'); barkDog(D(), D().key === 'shiba' && Math.random() < 1 / 3 ? 'scream' : 'alert', {}); toast(`Captain Fluff took one ${CROP_ONE[c] || 'veggie'} and left an IOU.`, 'bad'); }
  if (ev.type === 'tend') toast(`${NAME()} brought water for the ${pl}. ${PR().He} is very proud.`, 'good');
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
  if (!gardenUnlocked()) { nope('The garden opens at Bond 2.'); return; }
  if (!PG() || typeof PG().open !== 'function') { toast('The garden is having a nap. Try again later.'); return; }
  go('garden');
}
function openKitchen() {
  if (!kOn()) { comingSoon('kitchen'); return; }
  if (S.place !== 'house') { goHomeFor('kitchen'); return; }
  if (!kitchenUnlocked()) { nope('The kitchen opens at Bond 3.'); return; }
  if (!PK() || typeof PK().open !== 'function') { toast('The kitchen is having a nap. Try again later.'); return; }
  go('kitchen');
}
function goHomeFor(what) {
  const where = what === 'garden' ? 'yard' : 'house';
  const p = openModal(what === 'garden' ? 'The garden is at home' : 'The kitchen is in the house', `<p>${what === 'garden' ? 'The veggie patch is in the Home Yard.' : 'The kitchen is in the Cozy House.'} ${esc(NAME())} can take you there.</p>`, { foot: `<button class="btn" id="ghNo">Not now</button><button class="btn yes" id="ghGo">Go home</button>` });
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
      audioCue('harvest'); markDirty(); if (items && items.length) trackAct('garden', { what: 'harvest', crop: c }); if (items && items.length) toast(`Harvested ${items.length} ${CROP_PLURAL[c] || c}${took ? ` (Captain Fluff's IOU: -${took})` : ''}. ${NAME()} sniffs ${PR().his} share hopefully.`, 'good');
    },
    onWater: (plot) => { trackAct('garden', { what: 'water', plot }); }, // v2.5: the watering callback (TODO Shop Day)
    onBonusSeed: (cropId) => { S.inv.seeds[cropId] = (S.inv.seeds[cropId] || 0) + 1; markDirty(); toast(`${NAME()} dug up a bonus ${cropInfo(cropId) ? cropInfo(cropId).seedItem : 'seed'}! ${PR().He} is unbearable about it.`, 'gold'); },
    onChange: (st) => { if (st) { S.garden = mergeHarvests(st); markDirty(); saveNow(); } },
    onClose: () => { if (closed) return; closed = true; if (cur.mode === 'garden') go('yard'); }
  };
  try { gardenCtl = PG().open(showHost(), o); }
  catch (err) { console.warn('PawGarden.open failed', err); hideHost(); toast('The garden is having a nap. Try again later.'); setTimeout(() => go('yard'), 0); return; }
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
  if (forceSafety || Math.random() < 0.1) { const f = PICK(peopleFood().filter((x) => x.where.includes('junk'))); safetyNote(f.id, 'It went to the town compost. (+5 coins)'); return { text: `${f.name}? ${f.why} It went to the town compost.`, coins: 5, safety: f.id }; }
  const j = PICK(JUNK); return { text: j[1], coins: RINT(5, 15) };
}
function safetyNote(id, extra) {
  const f = peopleFood().find((x) => x.id === id); if (!f) return;
  if (!S.safetySeen.includes(id)) { S.safetySeen.push(id); markDirty(); }
  toast(`${f.name}: ${f.why} ${f.swap}${extra ? ' ' + extra : ''}`, 'bad');
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
      const prep = { pumpkin: 'Always cooked and plain.', 'sweet-potato': 'Always cooked and plain.', spinach: 'Small amounts only, so recipes use one.', chicken: 'Boneless, because cooked bones splinter.' };
      (r.used || []).forEach((u) => { const id = u && (u.id || u); if (prep[id] && !S.safetySeen.includes('prep-' + id)) S.safetySeen.push('prep-' + id); }); // the reveal card shows the note
      markDirty(); saveNow();
      const ri = recipeInfo(r.recipe); toast(`${ri ? ri.name : 'A dish'} ${'★'.repeat(r.stars || 1)} is in the fridge (${S.inv.dishes.length}/8).${r.discovered ? ' NEW recipe!' : ''} ${NAME()} is drooling. ${PR().He} saw everything.`, 'gold');
      if (kitchenCtl && kitchenCtl.update) { try { kitchenCtl.update({ pantry: Object.assign({}, S.inv.pantry), crops: JSON.parse(JSON.stringify(S.inv.crops)), fridge: { count: S.inv.dishes.length, max: 8 }, known: S.recipes.known.slice(), best: Object.assign({}, S.recipes.best) }); } catch (er) { /* ignore */ } }
    },
    onSafety: (id) => { if (!S.safetySeen.includes(id)) { S.safetySeen.push(id); markDirty(); } }, // the module shows the note
    onClose: () => { if (closed) return; closed = true; if (cur.mode === 'kitchen') go('yard'); }
  };
  try { kitchenCtl = PK().open(showHost(), o); }
  catch (err) { console.warn('PawKitchen.open failed', err); hideHost(); toast('The kitchen is having a nap. Try again later.'); setTimeout(() => go('yard'), 0); return; }
  onCleanup(() => { closed = true; const c = kitchenCtl; kitchenCtl = null; try { if (c && c.close) c.close(); } catch (er) { /* ignore */ } hideHost(); });
}
/* ---- Pip's Sprout Cart ---- */
let pipTab = 'seeds';
const STAR_MULT = [1, 1.5, 2];
function openPip(tab) {
  if (!gkOn()) { SFX.boop(620); const pip = artReal('prop', 'pip'); openModal("Pip's Sprout Cart", `<div class="pip-top">${pip ? `<span class="pip-art">${pip}</span>` : ''}<p>"Setting up! Back soon with seeds." <span class="small">Pip is untangling a very long hose.</span></p></div>${soonCard('garden')}`, { cls: 'shop' }); return; }
  if (tab) pipTab = tab; audioPlace('shop'); SFX.boop(620);
  const sz = seasonOf(monthNow()), pip = artReal('prop', 'pip');
  const tabs = [['seeds', 'Seeds'], ['sell', 'Sell crops'], ['people', 'People gardens only']];
  let body = '';
  if (pipTab === 'seeds') body = `<div class="shopgrid">${cropsList().slice().sort((a, b) => (b.seasons.includes(sz) ? 1 : 0) - (a.seasons.includes(sz) ? 1 : 0)).map((c) => `<div class="sitem"><span class="art">${art('item', c.seedItem)}</span><b>${esc(c.seedItem)}</b>${c.seasons.includes(sz) ? '<span class="stamp r1">In season</span>' : ''}<span class="desc">${esc(c.seasons.join(', '))} · ${esc(cropTimeTxt(c))} · ${c.yield} per harvest${c.hardy ? ' · hardy' : ''}</span>${priceHTML(c.seed + ' each')}<span class="small">You have ${S.inv.seeds[c.id] || 0}</span><button class="btn yes" data-seed="${c.id}">Buy…</button></div>`).join('')}</div>`;
  else if (pipTab === 'sell') {
    const left = pipLeft(), rows = []; cropsList().forEach((c) => { const a = S.inv.crops[c.id] || [0, 0, 0]; a.forEach((n, i) => { const each = Math.round(c.sell * STAR_MULT[i]), fits = each <= left; if (n > 0) rows.push(`<div class="sitem"><span class="art">${art('item', c.item)}</span><b>${esc(c.name)} ${'★'.repeat(i + 1)}</b><span class="desc">x${n} · ${c.sell} × ${STAR_MULT[i]} = ${each} each</span><button class="btn ${fits ? 'yes' : ''}" data-sell="${c.id}|${i}" ${fits ? '' : 'aria-disabled="true"'}>${fits ? 'Sell…' : left ? 'No room today' : 'Cart full'}</button></div>`); }); });
    const cap = `<p class="pipcap small"${left ? '' : ' data-full="1"'}>${left ? `Pip's cart today: <b>${PIP_CAP - left} / ${PIP_CAP}</b> coins of crops. He can buy <b>${left}</b> more coins' worth today. Extra veggies are great for cooking!` : `<b>${PIP_FULL}</b> (${PIP_CAP} coins of crops a day.) Extra veggies are great for cooking!`}</p>`;
    body = cap + (rows.length ? `<div class="shopgrid">${rows.join('')}</div>` : '<p>No crops to sell yet. Grow some in the garden at home!</p>');
  } else body = `<p class="small">Pip grows these for people only. They are never sold to dog owners. Tap one to see why.</p><div class="shopgrid">${peopleFood().filter((f) => f.where.includes('rack')).map((f) => `<button class="sitem lockd people" data-people="${f.id}"><span class="art">${art('item', f.name)}</span><span class="pawstop">${iconOr('paw-stop', '<circle r="12" fill="#F28FA5" stroke="#5B3D32" stroke-width="2"/><path d="M-6 0h12" stroke="#fff" stroke-width="3"/>')}</span><b>${esc(f.name)}</b><span class="desc">Not for dogs</span></button>`).join('')}</div>`;
  const p = openModal("Pip's Sprout Cart", `<div class="pip-top">${pip ? `<span class="pip-art">${pip}</span>` : ''}<p>"Howdy! Seeds for the patch, and I buy what you grow. Season now: <b>${sz}</b>." <span class="small">You have ${S.coins} Paw Coins.</span></p></div><div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="btn" role="tab" data-ptab="${k}" aria-selected="${pipTab === k}">${l}</button>`).join('')}</div>${body}`, { cls: 'shop' });
  p.querySelectorAll('[data-ptab]').forEach((b) => { b.onclick = () => openPip(b.dataset.ptab); });
  p.querySelectorAll('[data-seed]').forEach((b) => { b.onclick = async () => { const c = cropInfo(b.dataset.seed); SFX.click(); const q = await buyWindow(p, { art: art('item', c.seedItem), name: c.seedItem, desc: `${c.seasons.join(', ')} · ${cropTimeTxt(c)} · ${c.yield} per harvest`, price: c.seed, stack: true, have: S.inv.seeds[c.id] || 0, haveLabel: 'In pouch' }); if (!q) return; const cost = c.seed * q; if (S.coins < cost) { nope('Not enough coins. Have you tried being rich?'); return; } S.coins -= cost; S.inv.seeds[c.id] = (S.inv.seeds[c.id] || 0) + q; SFX.kaching(); markDirty(); trackAct('buy', { name: c.seedItem, cat: 'seeds', qty: q, shop: 'sprout' }); updateHUD(); toast(`Bought ${q} × ${c.seedItem}. Pip tips that enormous hat.`, 'gold'); openPip(); }; });
  p.querySelectorAll('[data-sell]').forEach((b) => { b.onclick = async () => {
    const [id, i] = b.dataset.sell.split('|'), c = cropInfo(id), a = S.inv.crops[id]; if (!a || !a[+i]) return;
    const each = Math.round(c.sell * STAR_MULT[+i]), left = pipLeft();
    if (!left) { nope(PIP_FULL); return; }
    if (each > left) { nope(`Pip only has room for ${left} more coins of crops today. Back tomorrow!`); return; }
    SFX.click(); const room = Math.floor(left / each);
    const q0 = await buyWindow(p, { art: art('item', c.item), name: `${c.name} ${'★'.repeat(+i + 1)}`, desc: `Pip pays ${c.sell} × ${STAR_MULT[+i]} for ${+i + 1}-star ${c.name.toLowerCase()}. Pip's cart today: ${PIP_CAP - left} / ${PIP_CAP} coins, room for ${room} more.`, price: each, sell: true, max: Math.min(a[+i], room), have: a[+i], haveLabel: 'In basket' });
    const q = Math.min(q0, a[+i], Math.floor(pipLeft() / each)); if (!q) return;
    a[+i] -= q; const got = addCoins(each * q, { raw: true }); pipToday().coins += each * q; SFX.kaching(); markDirty();
    toast(`Sold ${q} ${c.name} for ${got} coins. Pip says ${NAME()} is a fine farm dog.${pipLeft() ? '' : ' ' + PIP_FULL}`, 'gold'); openPip();
  }; });
  p.querySelectorAll('[data-people]').forEach((b) => { b.onclick = () => safetyNote(b.dataset.people); });
}
/* ---- dishes: feeding, limits, buffs ---- */
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function buffOn(id) { const b = S && S.buff; if (!b || b.id !== id) return false; if (b.until) return Date.now() < b.until; return (b.walks || 0) > 0; }
function buffTick() { if (S && S.buff && S.buff.until && Date.now() >= S.buff.until) { const n = S.buff.dish; S.buff = null; markDirty(); toast(`The ${n || 'dish'} buff wore off.`); } }
function buffLabel() { const b = S.buff; if (!b) return ''; if (b.until) { const h = Math.max(0, (b.until - Date.now()) / 36e5); return h >= 1 ? `${Math.ceil(h)}h` : `${Math.ceil(h * 60)}m`; } return 'next walk'; }
const BUFF_TXT = { walk15: 'next walk +15 s', cool: 'cool for 24 h: no heat, walks tire less', warm: 'warm for 24 h: no shivers, slower Happiness drop', dig1: 'next walk: +1 dig' };
function eatDish(id, stars) {
  if (busy) return; const r = recipeInfo(id); if (!r) return;
  if (!atHome()) { nope('Meals are served at home. Dishes count as meals, so they wait in the fridge.'); return; }
  if (S.sleeping) { nope(`${NAME()} is asleep. Wake ${PR().him} first (Care menu).`); return; }
  if (S.dishLog.date !== todayKey()) S.dishLog = { date: todayKey(), count: 0, bond: false };
  if (S.dishLog.count >= 2) { nope('Treats are extras. Real vets say about a tenth of a dog\'s food. Kibble for the rest of today!'); return; }
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
    if (fx.buff && fx.buff.id) { S.buff = { id: fx.buff.id, until: fx.buff.hours ? Date.now() + fx.buff.hours * 36e5 : null, walks: fx.buff.walks || (fx.buff.hours ? 0 : 1), dish: r.name }; buffMsg = ` Buff: ${BUFF_TXT[fx.buff.id] || fx.buff.id}.`; }
    const P0 = PR();
    toast(`${NAME()} licked the ${r.name} bowl clean.${hp ? ` +${hp} Happiness.` : ''}${bp ? ` +${bp} Bond.` : ''}${fav ? ` ${P0.His} favourite dish! ${P0.He} does a happy wiggle.` : ''}${buffMsg} (Dishes today: ${S.dishLog.count}/2)`, 'good');
    setTemp('happy', 1600); dogTo(0, 0, 1, 0.8); updateHUD(); markDirty();
    setTimeout(() => { busy = false; renderDog(dogPoseNow()); }, 900);
    if (dock.querySelector('[data-food],[data-dish]')) openFeedTray();
  }, 2300);
}
function dishRowHTML(off) {
  if (!S.inv.dishes.length) return '';
  const g = {}; S.inv.dishes.forEach((d) => { const k = d.id + '|' + d.stars; g[k] = (g[k] || 0) + 1; });
  return `${Object.keys(g).map((k) => { const [id, st] = k.split('|'), r = recipeInfo(id); return `<button class="card ${off ? 'off meal' : ''}" data-dish="${k}" ${off ? 'aria-disabled="true"' : ''} aria-label="Feed ${esc(r ? r.name : id)}${off ? ' (meals are served at home)' : ''}"><span class="cnt">${g[k]}</span><span class="art">${art('item', r ? r.name : id)}</span><b>${esc(r ? r.name : id)}</b><span class="small stars">${'★'.repeat(+st)}${DISH_FAV[S.dog.key] === id ? ' fav!' : ''} · dish</span></button>`; }).join('')}`;
}
/* ---- journal tabs: garden, recipes, profile ---- */
function journalGarden() {
  const sz = seasonOf(monthNow());
  return `<div class="jtop"><div class="jprog"><b>${(S.garden.plots || []).filter((p) => p.crop).length} / 6</b><span class="small">plots planted · season now: ${sz} · buddy perk: ${esc(buddyNow() || 'none')}</span><span class="small">${gardenStatusTxt()}</span><span class="small">Crops grow in real hours, even while you're away. Each plot holds 3 drops: about 3 hours on a sunny day, 6 when cloudy, 9 at night. Rain refills them. Pip buys up to ${PIP_CAP} coins of crops a day (${pipLeft()} left today).</span></div><div><button class="btn yes big" data-jopen="garden">Open garden</button></div></div>
    <div class="jgrid">${cropsList().map((c) => `<div class="jent"><span class="art">${art('item', c.item)}</span><b>${esc(c.name)}</b>${c.seasons.includes(sz) ? '<span class="stamp r1">In season</span>' : ''}<span class="ab">Seasons: ${esc(c.seasons.join(', '))}. Ready in about ${hrs(c.hours)}${c.regrow ? `, regrows in ${hrs(c.regrow)} (${c.picks || 'many'} picks per bush)` : ''}; half speed out of season. Seed ${c.seed}, sells for ${c.sell} (1★).</span><span class="small">Harvested ${(S.garden.harvests || {})[c.id] || 0} times · best ${S.cropBest[c.id] ? '★'.repeat(S.cropBest[c.id]) : 'none yet'} · seeds: ${S.inv.seeds[c.id] || 0}</span></div>`).join('')}</div>`;
}
function gardenStatusTxt() {
  const pl = (S.garden && S.garden.plots) || [], m = monthNow(), G = PG();
  const ready = pl.filter((p) => p.crop && p.g >= 1).length, grow = pl.filter((p) => p.crop && p.g < 1);
  if (!grow.length) return ready ? `${ready} plot${ready > 1 ? 's are' : ' is'} ready to pick!` : 'Nothing growing right now.';
  const left = grow.map((p) => { const c = cropInfo(p.crop); if (!c) return 99; if (G && G.hoursLeft) { try { return G.hoursLeft(p, m); } catch (e) { /* fall through */ } } return (1 - p.g) * c.hours / (c.seasons.includes(seasonOf(m)) ? 1 : 0.5); });
  const next = Math.min.apply(null, left), dry = grow.filter((p) => !p.water).length;
  return `${ready ? `${ready} ready to pick · ` : ''}next crop ${next < 0.75 ? 'ready in under an hour' : `ready in about ${hrs(next)}`}${dry ? ` · ${dry} thirsty plot${dry > 1 ? 's' : ''} (not growing until watered)` : ''}`;
}
function journalRecipes() {
  return `<div class="jtop"><div class="jprog"><b>${S.recipes.known.length} / 6</b><span class="small">recipes known · fridge ${S.inv.dishes.length}/8 · ${S.buff ? 'buff: ' + esc(BUFF_TXT[S.buff.id] || S.buff.id) : 'no buff active'}</span></div><div><button class="btn yes big" data-jopen="kitchen">Open kitchen</button></div></div>
    <div class="jgrid">${recipesList().filter((r) => r.id !== 'mystery-mush').map((r) => { const k = S.recipes.known.includes(r.id), fx = r.effect || {}; return k ? `<div class="jent"><span class="art">${art('item', r.name)}</span><b>${esc(r.name)}</b>${DISH_FAV[S.dog.key] === r.id ? `<span class="stamp r3">${esc(NAME())}'s favourite</span>` : ''}<span class="ab">${r.ingredients.map((i) => esc((cropInfo(i) || pantryList().find((x) => x.id === i) || { name: i === 'water' ? 'Fresh Water' : i }).name)).join(' + ')}. ${['hunger', 'happy', 'energy', 'bond'].filter((x) => fx[x]).map((x) => `${{ hunger: 'Hunger', happy: 'Happiness', energy: 'Energy', bond: 'Bond' }[x]} +${fx[x]}`).join(', ')}${fx.buff ? '. ' + (BUFF_TXT[fx.buff.id] || '') : ''}</span><span class="small">Best: ${S.recipes.best[r.id] ? '★'.repeat(S.recipes.best[r.id]) : 'not cooked yet'}</span></div>` : `<div class="jent unk"><span class="art">${art('item', r.name)}</span><b>???</b><span class="small">${esc(r.hint || 'Experiment in the kitchen.')} (${r.ingredients.length} ingredients)</span></div>`; }).join('')}</div>`;
}
function journalProfile() {
  const d = S.dog, m = ageMonths(), st = lifeStage(m), ss = seasonStatus(), info = dogInfo(d.key), P = PR(), today = localISO();
  const bday = (() => { const next = 12 - (m % 12); return `Born ${d.born} · next birthday in ${next} day${next > 1 ? 's' : ''}`; })();
  const R = BREEDING.RULES, maxL = (R.female && R.female.maxLitters) || 4;
  const me = famRec(d.id) || { id: d.id, parents: d.parents }, [dam, sire] = famParents(me), kids = famChildren(d.id), gen = d.gen || (dam || sire ? 1 : 0);
  const master = !!(S.coatRewards && S.coatRewards[50]);
  const breedTxt = d.mix && d.mix.name ? mixLine(d) : info.breed;
  // family card: parents and children as little heads (click -> Family tab)
  const fh = (id, lbl) => { const r = famRec(id); return r ? `<button class="pf-fh" data-fam="${esc(r.id)}" title="${esc(lbl)}: ${esc(r.name || '?')}"><span class="fhead">${famHead(r)}</span><span class="small">${esc(r.name || '?')}</span></button>` : `<span class="pf-fh unk"><span class="fhead"><b>?</b></span><span class="small">${lbl}</span></span>`; };
  const famCard = `<div class="jent pf-fam"><b>Family</b><div class="pf-par">${fh(dam, 'Mum')}${fh(sire, 'Dad')}</div><span class="small">${dam || sire ? `Generation ${gen}` : `Generation 0 · ${d.rescue ? 'rescued' : 'shelter starter'}`} · ${kids.length ? `${kids.length} pupp${kids.length > 1 ? 'ies' : 'y'}` : 'no puppies yet'}</span>
    ${kids.length ? `<div class="pf-kids">${kids.slice(0, 6).map((k) => `<button class="pf-kid" data-fam="${esc(k.id)}" title="${esc(k.name)}">${famHead(k)}</button>`).join('')}${kids.length > 6 ? `<span class="small">+${kids.length - 6}</span>` : ''}</div>` : ''}
    <button class="btn" data-fam="${esc(d.id)}">Family tree</button></div>`;
  // status card: season / expecting / nursing / resting, litters, fixed
  const nursing = (S.litters || []).find((l) => l && l.mum === d.id);
  let stat = `<span class="ab season ${ss.inSeason ? 'on' : ''}">${esc(d.sex === 'female' ? ss.txt : (d.fixed ? 'Neutered: no playdates' : 'Boys have no season.'))}</span>`;
  if (d.preg && d.preg.due) { const n = Math.max(0, isoDays(today, d.preg.due)); stat = `<span class="ab season on">Expecting! ${n ? `Due in ${n} day${n > 1 ? 's' : ''}` : 'Due any moment now'}${d.preg.scanned && d.preg.pups ? ` · ${d.preg.pups.length} pupp${d.preg.pups.length > 1 ? 'ies' : 'y'} on the scan` : ''}</span>`; }
  else if (nursing) { const n = Math.max(0, isoDays(today, nursing.until || today)), c = (nursing.pups || []).length; stat = `<span class="ab season on">Nursing ${c} pupp${c === 1 ? 'y' : 'ies'}. ${n ? `New homes in ${n} day${n > 1 ? 's' : ''}` : 'Choosing day!'}</span>`; }
  else if (d.sex === 'male' && d.restUntil && d.restUntil > today) stat = `<span class="ab season">Resting after a playdate (back ${esc(isoDay(d.restUntil))})</span>`;
  const statCard = `<div class="jent pf-stat"><b>${d.sex === 'female' ? 'Season' : 'Playdates'}</b>${stat}<span class="small">${d.sex === 'female' ? `Litters: ${d.litters || 0} of ${maxL}` : `Litters fathered: ${kids.length ? new Set(kids.map((k) => k.born)).size : 0}`} · ${d.fixed ? (d.sex === 'female' ? 'Spayed' : 'Neutered') : 'Not fixed'}</span></div>`;
  // genes card
  let genesCard;
  if (d.geneTested) {
    let desc = null; try { const G = window.PawGenes; if (G && typeof G.describe === 'function') desc = G.describe(d.genes); } catch (e) { desc = null; }
    if (!desc || !Array.isArray(desc.lines)) desc = genesDescribeFB(d.genes);
    genesCard = `<div class="jent pf-genes tested"><b>Genes</b><ul class="glines">${desc.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><span class="small">${desc.carriers && desc.carriers.length ? `Carries: ${desc.carriers.map((c) => `<span class="gcar">${esc(c)}</span>`).join(' ')}` : 'Carries nothing hidden. What you see is what you get.'}</span></div>`;
  } else genesCard = `<div class="jent pf-genes"><b>Genes</b><span class="genes">${['B', 'D', 'E', 'S', 'M', 'Bl'].map((g) => `<span class="gslot">${g}<i>?</i></span>`).join('')}</span><span class="small">Hidden. Gene test at the Vet Clinic.</span></div>`;
  // dog spots card
  let spots = null; try { if (typeof dogSlots === 'function') spots = dogSlots(); } catch (e) { spots = null; }
  const used = S.dogs.length, cap = spots ? spots.cap : null;
  const spotCard = `<div class="jent pf-spots"><b>Dog spots</b><span class="spotrow">${[1, 2, 3, 4].map((n) => `<i class="${n <= used ? 'full' : cap != null && n <= cap ? 'open' : 'lock'}"></i>`).join('')}</span><span class="small">${cap != null ? `${used} of ${cap} open spot${cap > 1 ? 's' : ''} used` : `${used} dog${used > 1 ? 's' : ''} at home`}. Bond opens more.</span><button class="btn" data-spots="1">Dog spots</button></div>`;
  return `<div class="profile"><div class="pf-head"><span class="portrait big ${d.sparkle ? 'spk' : ''}">${headSVG(d)}</span><div><h3>${esc(d.name)} ${sexSym(d.sex)}${d.sparkle ? ' <span class="spkbadge" title="A Sparkle puppy: one in hundreds">&#10022; Sparkle</span>' : ''}${master ? ' <span class="titlebadge">Master Breeder</span>' : ''}${d.proud ? ' <span class="titlebadge proud" title="Four litters">Proud Mum</span>' : ''}</h3><p>${d.sex === 'female' ? 'Girl' : d.sex === 'male' ? 'Boy' : 'Paperwork pending'} · ${esc(breedTxt)} · ${esc(info.personality)}${gen ? ` · <b>Gen ${gen}</b>` : ''}</p>${jrAncLine(d)}<p class="coatline">${esc(coatNameOf(d))} coat, ${esc(eyesOf(d))} eyes${d.rescue ? ` · <b>Rescued on ${esc(d.rescue.date)}</b>` : ''}</p><p><b>${ageText(m)}</b> old (${st})${st === 'senior' ? ` · ${P.He} has a distinguished grey muzzle now.` : ''}</p><p class="small">${bday}. One real day is one dog month.</p></div></div>
    <p class="small potty">Potty stats: Scooped: ${(S.potty || {}).scooped || 0}. Accidents indoors: ${(S.potty || {}).accidents || 0}. ${((S.potty || {}).accidents || 0) === 0 ? `A spotless record. ${P.He} would like that framed.` : 'Nobody is perfect. Especially not the rug.'}</p>
    ${jrTitlesRow()}
    <div class="pf-grid">${famCard}${statCard}${genesCard}${spotCard}</div></div>`;
}
// plain-words gene card when the genes module has no describe() yet
function genesDescribeFB(g) {
  const has = (p, a) => Array.isArray(p) && p.includes(a), both = (p, a) => Array.isArray(p) && p[0] === a && p[1] === a, j = (p) => (Array.isArray(p) ? p.join('/') : '?');
  g = g || {}; const lines = [], car = [];
  lines.push(`${j(g.B)}: ${both(g.B, 'b') ? 'liver (chocolate) pigment' : 'black pigment'}${has(g.B, 'b') && !both(g.B, 'b') ? ', carries liver' : ''}`); if (has(g.B, 'b') && !both(g.B, 'b')) car.push('liver');
  lines.push(`${j(g.D)}: ${both(g.D, 'd') ? 'diluted colour (blue or lilac)' : 'full-strength colour'}${has(g.D, 'd') && !both(g.D, 'd') ? ', carries dilute' : ''}`); if (has(g.D, 'd') && !both(g.D, 'd')) car.push('dilute');
  lines.push(`${j(g.E)}: ${both(g.E, 'e') ? 'red or cream coat' : 'dark pigment shows'}${has(g.E, 'e') && !both(g.E, 'e') ? ', carries red' : ''}`); if (has(g.E, 'e') && !both(g.E, 'e')) car.push('red');
  lines.push(`${j(g.S)}: ${both(g.S, 'sp') ? 'piebald patches' : has(g.S, 'sp') ? 'a little white, carries piebald' : 'solid, little white'}`); if (has(g.S, 'sp') && !both(g.S, 'sp')) car.push('piebald');
  lines.push(`${j(g.M)}: ${has(g.M, 'M') ? 'merle (never pair with another merle)' : 'no merle'}`);
  lines.push(`${j(g.Bl)}: ${both(g.Bl, 'Bl') ? 'blue eyes' : has(g.Bl, 'Bl') ? 'blue or odd eyes' : 'brown eyes'}`);
  return { lines, carriers: car };
}
