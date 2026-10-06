/* ======================= v1.5A: more dogs ======================= */
const PER_DOG = ['stats', 'bond', 'outfit', 'potty', 'sleeping', 'dishLog', 'buff', 'glowUntil', 'pupUntil', 'tricks'];
const HOUSE_CAP = { 'Cardboard Box': 1, 'Classic Wooden Doghouse': 2, 'Cozy Cottage': 2, 'Snow Igloo': 2, 'Treehouse Den': 3, 'Royal Castle Kennel': 4 };
const PGN = () => (window.PawGenes && typeof window.PawGenes.phenotype === 'function' ? window.PawGenes : null);
const D = () => S.dog; // the active dog
const capacity = () => HOUSE_CAP[S.house] || 1; // how many dogs the current house fits (v2: dog spots also need Bond, see dogSlots)
const MAX_DOGS = 4; // v2 hard cap
const topBond = () => (S && S.dogs ? Math.max(...S.dogs.map((d) => (d.bond && d.bond.level) || 1)) : 1);
const dogById = (id) => S.dogs.find((d) => d.id === id) || null;
/* v2.0.1: puppies under 3 months (not vaccinated yet) and nursing mums stay home: away from the yard/house they are not with the pack */
const HOME_PLACES = ['yard', 'house'];
function staysHome(d) { return !!d && (ageMonths(d) < 3 || (Array.isArray(S.litters) && S.litters.some((l) => l && l.mum === d.id))); }
function awayFromHome(place) { const p = place === undefined ? S.place : place; return !!S && !HOME_PLACES.includes(p) && p !== 'vet'; } // the vet is fine: that's where puppy shots happen
function stayHomeLine(d) { return d && Array.isArray(S.litters) && S.litters.some((l) => l && l.mum === d.id) ? `${d.name} is nursing the pups and stays home for now. Home, yard and the vet only.` : `${d.name} hasn't had all puppy shots yet. Home, yard and the vet only until 3 months.`; }
const others = () => S.dogs.filter((d) => d.id !== S.activeId && !(awayFromHome() && staysHome(d))); // the pack dogs that are here with you
function hashId(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function activeOf(s) { return s.dogs.find((d) => d.id === s.activeId) || s.dogs[0]; }
function dogDefaults(d, s) {
  d.id = d.id || 'd_' + Math.random().toString(36).slice(2, 9);
  d.stats = d.stats || { hunger: 70, happy: 70, energy: 80, clean: 80 };
  d.bond = d.bond || { level: 1, pts: 0 };
  d.outfit = d.outfit || { head: null, eyes: null, neck: null, body: null, charm: null }; if (!('charm' in d.outfit)) d.outfit.charm = null;
  const gm = s.gameMin || 0;
  d.potty = d.potty || { poopDue: null, peeDue: null, nextPee: gm + RINT(240, 360), lastOut: gm, scooped: 0, accidents: 0 };
  if (d.sleeping == null) d.sleeping = false;
  d.dishLog = d.dishLog || { date: '', count: 0, bond: false }; if (d.buff === undefined) d.buff = null;
  if (d.glowUntil == null) d.glowUntil = -1; if (d.pupUntil == null) d.pupUntil = -1; d.tricks = d.tricks || {};
  if (d.rescue === undefined) d.rescue = null; d.adoptedAt = d.adoptedAt || localISO();
}
/* S.dogs is the truth; S.dog / S.stats / S.bond / ... are live aliases of the active dog, so v1.0-v1.3 code keeps working. */
function linkDogs(s) {
  if (!s) return s;
  if (!Array.isArray(s.dogs) || !s.dogs.length) {
    if (!s.dog) return s;
    const d = Object.assign({}, s.dog);
    PER_DOG.forEach((k) => { if (s[k] !== undefined) d[k] = s[k]; });
    s.dogs = [d]; s.activeId = d.id || null;
  }
  ['dog'].concat(PER_DOG).forEach((k) => { delete s[k]; });
  s.dogs.forEach((d) => dogDefaults(d, s));
  if (!s.dogs.some((d) => d.id === s.activeId)) s.activeId = s.dogs[0].id;
  Object.defineProperty(s, 'dog', { get() { return activeOf(s); }, set(v) { if (v && typeof v === 'object') Object.assign(activeOf(s), v); }, enumerable: true, configurable: true });
  PER_DOG.forEach((k) => Object.defineProperty(s, k, { get() { return activeOf(s)[k]; }, set(v) { activeOf(s)[k] = v; }, enumerable: true, configurable: true }));
  return s;
}
function withDog(d, fn) { const was = S.activeId; S.activeId = d.id; try { return fn(); } finally { S.activeId = was; } }
const PRd = (d) => withDog(d, () => PR());

/* ---- genes -> coat (cached) ---- */
const coatCache = new Map();
function coatInfo(d) {
  if (!d) return null; const G = PGN(); if (!G || !d.genes) return null;
  const k = d.id + '|' + d.key + '|' + JSON.stringify(d.genes); if (coatCache.has(k)) return coatCache.get(k);
  let v = null; try { const p = G.phenotype(d.genes, d.key, d.id); if (p && p.coat) v = p; } catch (e) { v = null; }
  coatCache.set(k, v); return v;
}
// v2: look extras for the art (puppy age, mix head, sparkle, expecting). Sent both as top-level opts and inside coat.look,
// so modules that only forward {coat, seed} still draw puppies, mixes and sparkles.
function dogLook(d) {
  if (!d) return null; const m = d.born ? ageMonths(d) : 10;
  const L = { age: m < 1 ? 'newborn' : m < 6 ? 'puppy' : null, mixHead: d.mix && d.mix.head && d.mix.head !== d.key ? d.mix.head : null, sparkle: !!d.sparkle, expecting: !!(d.preg && d.preg.due) };
  return L.age || L.mixHead || L.sparkle || L.expecting ? L : null;
}
function lookOpts(d, c) { const L = dogLook(d), o = {}; if (c) { o.coat = L ? Object.assign({}, c.coat, { look: L }) : c.coat; o.seed = hashId(d.id); } if (L) { if (L.age) o.age = L.age; if (L.mixHead) o.mix = { head: L.mixHead }; if (L.sparkle) o.sparkle = true; if (L.expecting) o.expecting = true; } return o; }
function dogOpts(d, o) { return Object.assign({}, o || {}, lookOpts(d, coatInfo(d))); }
const outfitOf = (d) => ({ head: d.outfit.head, eyes: d.outfit.eyes, neck: d.outfit.neck, body: d.outfit.body });
const ROACH = { greyhound: true }; // v1.7: greyhounds sleep upside down ("roaching")
function dogSVG(d, o) { if (o && o.pose === 'sleep' && ROACH[d.key] && poseReal(d.key, 'rollover')) o = Object.assign({}, o, { pose: 'rollover', roach: true }); return dogArtSafe(d.key, dogOpts(d, o)); }
function headSVG(d) { const o = lookOpts(d, coatInfo(d)); return Object.keys(o).length ? art('dogHead', d.key, o) : art('dogHead', d.key); }
const coatNameOf = (d) => { const c = coatInfo(d); return c ? c.coatName : d.coat || ''; };
const eyesOf = (d) => { const c = coatInfo(d); return c ? c.eyes : d.eyes || 'brown'; };
function moodOf(d) { const lo = Math.min(...Object.values(d.stats)); return lo < 25 ? 'red' : lo < 50 ? 'amber' : 'green'; }

/* ---- switching ---- */
function switchDog(id, opts = {}) {
  const d = dogById(id); if (!d || id === S.activeId) return;
  if (busy) { nope(`Hold on, ${NAME()} is busy.`); return; }
  if (awayFromHome() && staysHome(d)) { nope(`${d.name} is at home. ${stayHomeLine(d)}`); return; }
  S.activeId = id; markDirty(); hudDogKey = ''; dogKey = ''; SFX.boop(760);
  if (cur.mode === 'yard') { go('yard'); setTimeout(() => { const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-bounce'); void fx.getBBox(); fx.classList.add('tk-bounce'); } const h = dogHeadWorld(); say(PICK([`${d.name} reporting for duty.`, `${d.name}'s turn! ${PRd(d).He} has been waiting politely. Ish.`, `${d.name} steps up.`]), h.x, h.y, 1800); }, 60); }
  else { setHudDog(); updateHUD(); }
}

/* ---- the pack in hub scenes ---- */
/* v1.7 fix: secondary dogs stand on the floor beside or in front of the furniture, never on it, and never in the dog-house or bed zone.
   [feet x, feet y, facing, scale]; scale shrinks with depth. Spots were solved against each scene's furniture, the active dog, the bowl and the place buttons. */
const PACK_SPOTS = {yard: [[250, 402, 'right', 0.52], [930, 438, 'left', 0.57], [120, 402, 'right', 0.52]], house: [[250, 414, 'right', 0.53], [930, 424, 'left', 0.53], [115, 586, 'right', 0.76]], square: [[115, 562, 'right', 0.73], [640, 590, 'left', 0.77], [910, 414, 'left', 0.53]], cafe: [[115, 562, 'right', 0.73], [640, 590, 'left', 0.77], [930, 466, 'left', 0.6]], vet: [[115, 562, 'right', 0.73], [640, 590, 'left', 0.77], [930, 470, 'left', 0.6]], salon: [[240, 480, 'right', 0.62], [615, 412, 'left', 0.53], [640, 592, 'left', 0.77]], market: [[240, 484, 'right', 0.58], [615, 456, 'left', 0.53], [85, 572, 'right', 0.73]], dogpark: [[615, 416, 'left', 0.54], [640, 592, 'left', 0.77], [745, 408, 'left', 0.53]], hilltop: [[240, 478, 'right', 0.62], [615, 406, 'left', 0.53], [640, 590, 'left', 0.77]], pier: [[250, 410, 'right', 0.53], [640, 590, 'left', 0.77], [120, 434, 'right', 0.56]], park: [[240, 476, 'right', 0.62], [640, 592, 'left', 0.77], [670, 408, 'left', 0.53]], river: [[250, 456, 'right', 0.53], [640, 592, 'left', 0.77], [100, 584, 'right', 0.75]], woods: [[240, 476, 'right', 0.62], [615, 424, 'left', 0.55], [640, 592, 'left', 0.77]], beach: [[120, 510, 'right', 0.66], [640, 590, 'left', 0.77], [930, 450, 'left', 0.58]], default: [[240, 482, 'right', 0.62], [615, 430, 'left', 0.55], [640, 590, 'left', 0.77]]};
const NAP_ZONE = { yard: [740, 515, 0.75], house: [740, 505, 0.75] }; // the dog-house doorway / the bed, where the active dog naps
const packPose = {};
function packSpots() { return PACK_SPOTS[S.place] || PACK_SPOTS.default; }
function packDogSVG(d, i) {
  let [fx, fy, face, sc] = packSpots()[i] || packSpots()[0]; sc = sc || 0.6;
  const nz = d.sleeping && NAP_ZONE[S.place]; if (nz) { fx = nz[0] + [-36, 36, 0][i % 3]; fy = nz[1]; sc = nz[2]; face = 'right'; } // napping: in the doorway / on the bed, like the active nap
  if (hmChairDown(d)) { fx = 868; fy = 530; face = 'right'; sc = 0.48; } // Proud Mum lies down next to the Rocking Chair
  const w = DW * sc, h = DH * sc, x = fx - w / 2, y = fy - h * (205 / 220);
  const pose = d.sleeping ? 'sleep' : packPose[d.id] || (Math.min(...Object.values(d.stats)) < 25 ? 'sad' : 'idle');
  return `<g class="packdog hot" data-dog="${d.id}" tabindex="0" role="button" aria-label="${esc(d.name)}: click to make ${PRd(d).him} the active dog"><g class="pd-wander" style="animation-delay:-${i * 2.3}s"><rect x="${x + 30}" y="${y + 30}" width="${w - 60}" height="${h - 30}" fill="transparent"/>${place(dogSVG(d, { pose, outfit: outfitOf(d), facing: face }), x, y, w, h)}</g></g>`;
}
function hmMumIn(d) { return typeof mumInBasket === 'function' && mumInBasket(d); } // a nursing mum is drawn in the nursery basket, not with the pack
function hmChairOut4(d) { return !!(d.proud && S.place === 'yard' && hmDecorOut('Rocking Chair') && Math.random() < 0.25); } // about 1 in 4 idle picks
function hmChairDown(d) { return !!(d.proud && S.place === 'yard' && !d.sleeping && packPose[d.id] === 'down' && typeof hmDecorOut === 'function' && hmDecorOut('Rocking Chair')); }
function packSVG() { return S.dogs.length > 1 ? others().slice(0, 3).map((d, i) => hmMumIn(d) ? '' : packDogSVG(d, i)).join('') : ''; }
function bindPack() {
  const g = $('#pack'); if (!g) return;
  g.querySelectorAll('[data-dog]').forEach((el) => { el.onclick = () => switchDog(el.dataset.dog); el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchDog(el.dataset.dog); } }; });
}
function redrawPackDog(d) { const g = $(`#pack [data-dog="${d.id}"]`); if (!g) return; const i = others().indexOf(d); g.outerHTML = packDogSVG(d, i); bindPack(); }
function packAmbient() {
  if (S.dogs.length < 2 || cur.mode !== 'yard' || busy || !modal.hidden) return;
  const os = others(); if (!os.length) return;
  if (Math.random() < 0.55) { const d = PICK(os); if (!d.sleeping) { packPose[d.id] = hmChairOut4(d) ? 'down' : PICK(['sit', 'happy', 'idle', 'sleep']); redrawPackDog(d); } return; }
  const a = PICK(S.dogs), b = PICK(S.dogs.filter((x) => x !== a)); const pa = PRd(a), pb = PRd(b);
  const lines = [`${a.name} and ${b.name} are having a staring contest.`, `${a.name} is sniffing ${b.name}. ${b.name} allows it. For now.`, `${a.name} stole ${b.name}'s favourite spot. ${pb.He} is drafting a complaint.`, `${a.name} and ${b.name} zoom in circles. Nobody knows why. Not even them.`, `${a.name} brought ${b.name} a leaf. ${pb.He} pretends not to care. ${pb.He} cares.`, `${a.name} barks at nothing. ${b.name} barks at ${pa.him} for barking.`];
  S.dogs.forEach((d) => { d.stats.happy = clamp(d.stats.happy + 2, 0, 100); }); updateHUD();
  toast(PICK(lines) + ' (+2 Happiness each)', 'good');
}
let greetFor = null;
function greetWalker() {
  if (!greetFor || S.dogs.length < 2) { greetFor = null; return; }
  const w = dogById(greetFor); greetFor = null; if (!w || w.id !== S.activeId) return;
  const o = PICK(others()); if (!o) return; const pw = PRd(w);
  setTimeout(() => toast(PICK([`${o.name} sniffs ${w.name} thoroughly. Report filed.`, `${o.name} greets ${w.name} like ${pw.he} was gone for a year. It was a walk.`, `${o.name} checks ${w.name} for treats. None found. Suspicious.`]) + ' (+3 Happiness)', 'good'), 900);
  [w, o].forEach((d) => { d.stats.happy = clamp(d.stats.happy + 3, 0, 100); });
}

/* ---- HUD switcher ---- */
function renderDogChips() {
  const wrap = $('#hudPack'); if (!wrap) return;
  wrap.innerHTML = S.dogs.length > 1 ? others().map((d) => `<button class="dchip" data-dog="${d.id}" aria-label="Switch to ${esc(d.name)}" title="${esc(d.name)}">${headSVG(d)}<i class="mood ${moodOf(d)}"></i><span class="dsx">${d.sex === 'female' ? '♀' : '♂'}</span></button>`).join('') : '';
  wrap.querySelectorAll('[data-dog]').forEach((b) => { b.onclick = () => switchDog(b.dataset.dog); });
  const md = $('#hudMood'); if (md) md.className = 'mood ' + moodOf(D());
  if (isPhone()) requestAnimationFrame(() => phChipsFit(wrap));
}
// v2.3 phone HUD: show as many of the other dogs' chips as fit, then a "+N" chip that opens the pack, so no dog is hidden without a hint
function phChipsFit(wrap) {
  if (!wrap || !isPhone()) return;
  const old = wrap.querySelector('.dmore'); if (old) old.remove();
  const chips = [...wrap.querySelectorAll('.dchip')]; chips.forEach((c) => { c.hidden = false; });
  if (!chips.length || wrap.scrollWidth <= wrap.clientWidth + 3) return;
  const w = wrap.getBoundingClientRect(), r0 = chips[0].getBoundingClientRect(), pitch = chips.length > 1 ? chips[1].getBoundingClientRect().left - r0.left : r0.width;
  const lim = Math.max(w.right, wrap.parentElement.getBoundingClientRect().right); // the row can grow to the end of its cell
  const room = lim - r0.left - (parseFloat(getComputedStyle(wrap).paddingRight) || 0); // from the first chip to the visible end
  const k = Math.max(0, Math.floor((room - r0.width) / pitch)), n = chips.length - k; // k chips, then the +N chip (as wide as one chip)
  chips.slice(k).forEach((c) => { c.hidden = true; });
  wrap.insertAdjacentHTML('beforeend', `<button class="dchip dmore" aria-label="${n} more ${n > 1 ? 'dogs' : 'dog'}: see the pack">+${n}</button>`);
  wrap.querySelector('.dmore').onclick = () => { SFX.click(); openPackSheet(); };
}
window.addEventListener('resize', () => { if (S && S.dogs && S.dogs.length > 1) phChipsFit($('#hudPack')); });
function openPackSheet() {
  const p = openModal('Your pack', `<div class="packpick">${others().map((d) => `<button class="card" data-dog="${d.id}"><span class="pp-head" aria-hidden="true">${headSVG(d)}</span><b>${esc(d.name)} ${sexSym(d.sex)}</b><span class="small">Tap to switch</span></button>`).join('')}</div>`, { cls: 'packsheet' });
  p.querySelectorAll('[data-dog]').forEach((b) => { b.onclick = () => { SFX.click(); closeModal(); switchDog(b.dataset.dog); }; });
}
function chipsKey() { return S.dogs.map((d) => d.id + d.name + d.sex + moodOf(d) + (d.id === S.activeId ? '*' : '') + (awayFromHome() && staysHome(d) ? 'h' : '')).join('|') + '|' + (S.title || ''); }

/* ---- Feed all ---- */
function feedAllFood() { const meals = FOOD.filter((f) => f.n !== 'Fresh Water' && !SNACKS.includes(f.n) && (S.inv.food[f.n] || 0) > 0); meals.sort((a, b) => S.inv.food[b.n] - S.inv.food[a.n]); return meals[0] || null; }
function feedAll() {
  const f = feedAllFood(); if (!f) { nope('No meals in the pantry. Kibble Corner sells some.'); return; }
  if (busy) return; const fed = [];
  const order = [D()].concat(others());
  order.forEach((d) => {
    if ((S.inv.food[f.n] || 0) <= 0 || d.stats.hunger > 90 || d.sleeping) return;
    S.inv.food[f.n]--; withDog(d, () => { addStat('hunger', f.hunger || 0); addStat('happy', (f.happy || 0) + (isFavFood(f.n) ? 5 : 0) + pupBonus(d, f)); addStat('energy', f.energy || 0); addBond(2 + (f.bond || 0)); pottyAfter('meal'); });
    fed.push(d);
  });
  if (S.inv.food[f.n] <= 0) delete S.inv.food[f.n];
  if (!fed.length) { nope('Everyone is full or asleep. Nobody has ever said that before.'); return; }
  dailyCare('feed'); markCareDay(); markDirty(); popDown(); SFX.crunch(); setTimeout(SFX.crunch, 300); setTimeout(SFX.crunch, 600);
  if (fed.includes(D())) setTemp('eat', 1400); others().forEach((d) => { if (fed.includes(d)) { packPose[d.id] = 'eat'; redrawPackDog(d); setTimeout(() => { packPose[d.id] = 'happy'; redrawPackDog(d); }, 1500); } });
  const skipped = S.dogs.length - fed.length;
  const pups = fed.filter((d) => pupBonus(d, f)).map((d) => d.name), eats = fed.map(eatForLine).join('');
  toast(`Feed all: ${fed.length} bowl${fed.length > 1 ? 's' : ''} of ${f.n} for ${fed.map((d) => d.name).join(', ')}. A symphony of crunching.${pups.length ? ` Puppy-sized bites: +${f.pupHappy} Happiness for ${pups.join(', ')}.` : ''}${eats}${skipped ? ` (${skipped} skipped: full, asleep or not enough food.)` : ''}`, 'good');
  updateHUD();
}

/* ======================= v2: dog spots (max 4), unlocked by Bond ======================= */
// Spot n opens when ALL its rules hold (and spot n-1 is open). Bond is per dog. Care days = distinct real days with a feed, pet or play.
const SPOT_RULES = [null, null,
  { bond: 3, dogs: 1, days: 0, fits: 2, house: null },
  { bond: 8, dogs: 2, days: 21, fits: 3, house: 'Treehouse Den' },
  { bond: 10, dogs: 3, days: 60, fits: 4, house: 'Royal Castle Kennel' }];
const SPOT_ORD = ['', '1st', '2nd', '3rd', '4th'];
const SPOT_TOAST = { 2: 'A 2nd dog spot is open! Visit the Shelter on the Map to bring home a friend.', 3: 'A 3rd dog spot is open! The Treehouse Den has room for one more.', 4: 'A 4th dog spot is open! The Royal Castle Kennel has room for the whole pack.' };
function spotsInit() {
  if (!S || !Array.isArray(S.dogs) || !S.dogs.length) return;
  if (!Array.isArray(S.litters)) S.litters = [];
  if (typeof S.careDays !== 'number') { S.careDays = Math.min(60, Math.max(0, ageMonths(S.dogs[0]) - 10)); markDirty(); } // old saves: one-time backfill
  if (typeof S.spotsSeen !== 'number') { S.spotsSeen = spotCap(); markDirty(); } // silent for old saves: only NEW unlocks get the toast
}
function spotCap() { return dogSlots(true).cap; }
function dogSlots(noInit) {
  if (!noInit) spotsInit();
  const bonds = S.dogs.map((d) => (d.bond && d.bond.level) || 1), fits = capacity(), cd = S.careDays || 0;
  const spots = [{ n: 1, open: true, reqs: [] }]; let cap = 1;
  for (let n = 2; n <= MAX_DOGS; n++) {
    const R = SPOT_RULES[n], have = bonds.filter((b) => b >= R.bond).length, reqs = [];
    reqs.push({ label: R.dogs === 1 ? `A dog at Bond ${R.bond}` : `Bond ${R.bond} dogs`, done: have >= R.dogs, have, need: R.dogs });
    if (R.days) reqs.push({ label: 'Care days', done: cd >= R.days, have: cd, need: R.days });
    reqs.push({ label: R.house ? R.house + (n < MAX_DOGS ? ' (or bigger)' : '') : `A house that fits ${R.fits}`, done: fits >= R.fits, have: fits >= R.fits ? 1 : 0, need: 1, house: true });
    const open = spots[n - 2].open && reqs.every((r) => r.done);
    spots.push({ n, open, reqs }); if (open) cap = n;
  }
  const used = S.dogs.length;
  return { cap, used, free: Math.max(0, cap - used), spots };
}
function slotsFree() { return dogSlots().free; }
function reqText(r) { return r.house || /^A dog/.test(r.label) ? r.label.replace(/^A /, 'a ') : `${r.label} (${Math.min(r.have, r.need)}/${r.need})`; }
/* care days: marked by the feed / pet / play paths of this lane, and by watching the daily-care flags (walks, fetch, tricks in other lanes) */
function markCareDay() {
  if (!S || !S.dogs) return; spotsInit(); const t = localISO();
  if (S.careDayLast === t) return; S.careDayLast = t; S.careDays = (S.careDays || 0) + 1; markDirty(); setTimeout(spotsCheck, 700);
}
let careSnap = null;
function careWatch() {
  if (!S || !S.daily) return; const n = ['feed', 'pet', 'play'].filter((k) => S.daily[k]).length, dy = S.daily.day;
  if (!careSnap || careSnap.s !== S) { careSnap = { s: S, dy, n }; return; }
  const did = dy === careSnap.dy ? n > careSnap.n : n > 0; careSnap.dy = dy; careSnap.n = n; if (did) markCareDay();
}
function spotsCheck() {
  if (!S || !S.adopted || !S.dogs || !S.dogs.length || ['title', 'adopt'].includes(cur.mode)) return;
  spotsInit(); const c = dogSlots().cap;
  if (c > (S.spotsSeen || 1)) { S.spotsSeen = c; markDirty(); SFX.fanfare(); toast(SPOT_TOAST[c] || `A new dog spot is open!`, 'gold'); }
}
const PAW_PATH = '<ellipse class="pw" cx="0" cy="7" rx="10" ry="8.5"/><circle class="pw" cx="-11" cy="-5" r="4.3"/><circle class="pw" cx="-4" cy="-11.5" r="4.3"/><circle class="pw" cx="4" cy="-11.5" r="4.3"/><circle class="pw" cx="11" cy="-5" r="4.3"/>';
const LOCK_DOODLE = '<rect x="-8" y="-2" width="16" height="13" rx="3" fill="#FFE3A1" stroke="#5B3D32" stroke-width="2.2"/><path d="M-4.5 -2v-4a4.5 4.5 0 0 1 9 0v4" fill="none" stroke="#5B3D32" stroke-width="2.2" stroke-linecap="round"/><circle cx="0" cy="4.5" r="1.8" fill="#5B3D32"/>';
function spotsHTML(s) {
  s = s || dogSlots(); const n = Math.max(MAX_DOGS, s.used);
  const cells = [];
  for (let i = 1; i <= n; i++) {
    const sp = s.spots[i - 1] || { n: i, open: false, reqs: [] }, d = S.dogs[i - 1], locked = !sp.open;
    const kind = d ? 'filled' : locked ? 'locked' : 'open';
    const label = d ? esc(d.name) : locked ? 'Locked' : 'Free!';
    const list = locked && sp.reqs.length ? `<ul class="spotreqs">${sp.reqs.map((r) => `<li class="${r.done ? 'ok' : ''}"><span class="ck" aria-hidden="true">${r.done ? '&#10003;' : '&#9675;'}</span>${esc(r.house ? `${r.label}: ${r.done ? 'yes' : 'no'}` : r.need === 1 && /^A dog/.test(r.label) ? `${r.label}: ${r.done ? 'yes' : 'not yet'}` : `${r.label}: ${Math.min(r.have, r.need)}/${r.need}`)}</li>`).join('')}</ul>` : '';
    cells.push(`<div class="spot ${kind}${d && locked ? ' extra' : ''}" data-spot="${i}" data-kind="${kind}" aria-label="Dog spot ${i}: ${d ? esc(d.name) : locked ? 'locked' : 'free'}"><span class="spaw"><svg viewBox="-24 -24 48 48" aria-hidden="true">${PAW_PATH}</svg>${d ? `<span class="shead">${headSVG(d)}</span>` : ''}${locked ? `<span class="slock">${iconOr('lock', LOCK_DOODLE)}</span>` : ''}</span><b>${label}</b><span class="small">Spot ${i}</span>${list}</div>`);
  }
  return `<div class="spots" role="group" aria-label="Dog spots">${cells.join('')}</div>`;
}
function spotsLine(s) {
  s = s || dogSlots(); const bl = adoptBlock();
  return `<p class="small spotsum">Dog spots: <b>${s.used} of ${s.cap}</b> used (${esc(S.house)}, max ${MAX_DOGS}). ${bl ? `<b>${esc(bl)}</b>` : 'You have room for another friend!'}</p>`;
}
function openSpots(opts = {}) {
  const s = dogSlots();
  const p = openModal('Dog spots', `${spotsLine(s)}${spotsHTML(s)}<p class="small spothow">Spot 2 opens early. Spots 3 and 4 take real devotion: well-bonded dogs, many days of care and a bigger dog house. Nursery puppies don't need a spot until they stay.</p>`,
    { cls: 'spotspop', foot: `${opts.back ? '<button class="btn no" id="spBack">Back</button>' : ''}<button class="btn yes" id="spOk">OK</button>` });
  $('#spOk', p).onclick = () => { SFX.click(); closeModal(); };
  const bk = $('#spBack', p); if (bk) bk.onclick = () => { SFX.click(); opts.back(); };
  return p;
}
// "Eating for N!": expecting mums (d.preg) and nursing mums (a litter in S.litters with mum === d.id)
function eatingFor(d) {
  if (!d) return 0; if (d.preg) return 1 + (Array.isArray(d.preg.pups) && d.preg.pups.length ? d.preg.pups.length : 1);
  const L = Array.isArray(S.litters) ? S.litters.find((l) => l && l.mum === d.id) : null; return L ? 1 + ((L.pups && L.pups.length) || 1) : 0;
}
function eatForLine(d) { const n = eatingFor(d); return n ? ' ' + PICK([`${d.name} is eating for ${n}!`, `Eating for ${n}! ${d.name} licks the bowl twice.`, `${d.name} is eating for ${n}! Seconds are encouraged.`]) : ''; }
const pupBonus = (d, f) => (f && f.pupHappy && ageMonths(d) < 6 ? f.pupHappy : 0);
function spotsExpose() { if (window.__paw) window.__paw.spots = { slots: () => dogSlots(), free: () => slotsFree(), check: spotsCheck, markCare: markCareDay, watch: careWatch, open: openSpots, eatingFor: (id) => eatingFor(dogById(id)) }; }
on('game:ready', () => { spotsInit(); careWatch(); setTimeout(spotsExpose, 0); });
on('yard:enter', () => { spotsInit(); careWatch(); spotsCheck(); spotsExpose(); });
on('clock:minute', () => { careWatch(); spotsCheck(); });
on('day:new', () => { careWatch(); });
setTimeout(spotsExpose, 0);

/* ---- shelter: rescues + starters ---- */
const RESCUE_NAMES = ['Sir Wigglesworth', 'Potato', 'Captain Socks', 'Noodle Jr.', 'Biscotti', 'Mayor Fluff', 'Pickles', 'Waffles', 'Tater Tot', 'Professor Paws', 'Beans', 'Lady Snorts', 'Meatball', 'Dumpling', 'Turbo', 'Nugget'];
function rescuesToday(dk = localISO()) {
  const r = seeded(hashId('rescue|' + dk)), keys = BREED_KEYS, G = PGN();
  return [0, 1].map((i) => {
    const key = keys[Math.floor(r() * keys.length)], sex = r() < 0.5 ? 'female' : 'male', months = 8 + Math.floor(r() * 29), name = RESCUE_NAMES[Math.floor(r() * RESCUE_NAMES.length)];
    let genes = null; if (G && typeof G.randomGenotype === 'function') { try { genes = G.randomGenotype(key, r); } catch (e) { genes = null; } }
    if (!genes) { const g = STARTER_GENES[key] || STARTER_GENES.mutt; genes = { B: g.B.slice(), D: g.D.slice(), E: g.E.slice(), S: g.S.slice(), M: g.M.slice(), Bl: g.Bl.slice() }; }
    return { id: 'r_' + dk + '_' + i, key, sex, months, name, genes, rescue: { date: dk } };
  });
}
const adoptBlock = () => {
  const s = dogSlots(); if (s.free > 0) return '';
  if (s.used > s.cap) return 'Everyone stays. New friends need a free spot.';
  if (s.used >= MAX_DOGS) return 'Four dogs is a full pack. Everyone stays, and there is no room for more.';
  const nx = s.spots[s.cap]; return `All your dog spots are taken. The ${SPOT_ORD[nx.n]} spot opens with: ${nx.reqs.filter((r) => !r.done).map(reqText).join(', ')}.`;
};
function addDog(spec, name) {
  const fav = FAV[spec.key] || FAV.mutt;
  const d = Object.assign({ key: spec.key, name, favFood: fav.food.slice(), favToy: fav.toy }, newDogFields(spec.key, spec.sex, spec.born || bornDaysAgo(spec.months || 10)));
  if (spec.genes) d.genes = spec.genes;
  if (spec.id) d.id = spec.id;
  if (spec.key === 'mutt') { d.favFood = [PICK(FOOD.slice(1)).n]; d.favToy = PICK(TOYS).n; }
  d.rescue = spec.rescue || null; dogDefaults(d, S);
  const c = coatInfo(d); if (c) { d.coat = c.coatName; d.eyes = c.eyes; }
  S.dogs.push(d); markDirty(); hudDogKey = ''; emit('dog:added', { dog: d }); return d;
}
let shelterSex = {};
function shelterCard(spec, kind) {
  const tmp = { id: spec.id || 'tmp_' + spec.key, key: spec.key, genes: spec.genes || (STARTER_GENES[spec.key] || STARTER_GENES.mutt) };
  const c = coatInfo(tmp), info = dogInfo(spec.key), home = spec.id && dogById(spec.id);
  const coatName = c ? c.coatName : (STARTER_GENES[spec.key] || {}).coat || '', eyes = c ? c.eyes : (STARTER_GENES[spec.key] || {}).eyes || 'brown';
  const sx = kind === 'rescue' ? spec.sex : shelterSex[spec.key] || null;
  const blocked = adoptBlock();
  return `<div class="sitem shcard ${kind}">${kind === 'rescue' ? '<span class="stamp r2">Rescue</span>' : '<span class="stamp r0">Starter</span>'}<span class="art shdog">${dogArtSafe(spec.key, Object.assign({ pose: 'sit' }, c ? { coat: c.coat, seed: hashId(tmp.id) } : {}))}</span>
    <b>${esc(kind === 'rescue' ? spec.name : info.name)} ${kind === 'rescue' ? sexSym(spec.sex) : ''}</b>
    <span class="desc">${esc(info.breed)}${kind === 'rescue' ? ` · ${spec.sex === 'female' ? 'Girl' : 'Boy'} · ${ageText(spec.months)}` : ''}<br>${esc(coatName)}, ${esc(eyes)} eyes<br><i>${esc(info.personality)}</i></span>
    ${kind === 'starter' ? `<div class="wrap" style="justify-content:center"><button class="btn ${sx === 'male' ? 'yes' : ''}" data-shsex="${spec.key}|male" aria-pressed="${sx === 'male'}">Boy ♂</button><button class="btn ${sx === 'female' ? 'yes' : ''}" data-shsex="${spec.key}|female" aria-pressed="${sx === 'female'}">Girl ♀</button></div>` : ''}
    ${home ? '<span class="chip own">Already home</span>' : `<button class="btn ${blocked ? '' : 'go'}" data-shadopt="${kind}|${spec.id || spec.key}" ${blocked ? 'aria-disabled="true"' : ''}>${kind === 'rescue' ? 'Rescue' : 'Adopt a starter'}</button>`}</div>`;
}
function openShelterList() {
  const rescues = rescuesToday(), starterKeys = dogsList().map((x) => x.key).filter((k) => !S.dogs.some((d) => d.key === k && !d.rescue));
  const sl = dogSlots();
  const p = openModal('Paw Haven Shelter', `<div class="shspots">${spotsLine(sl)}${spotsHTML(sl)}</div>
    <h3 class="shh">Today's rescues <span class="small">(new ones arrive every day)</span></h3><div class="shopgrid">${rescues.map((r) => shelterCard(r, 'rescue')).join('')}</div>
    ${starterKeys.length ? `<h3 class="shh">Starter dogs</h3><div class="shopgrid">${starterKeys.map((k) => shelterCard({ key: k }, 'starter')).join('')}</div>` : ''}`, { cls: 'shop shelter' });
  p.querySelectorAll('[data-shsex]').forEach((b) => { b.onclick = () => { const [k, sx] = b.dataset.shsex.split('|'); shelterSex[k] = sx; SFX.click(); openShelterList(); }; });
  p.querySelectorAll('[data-shadopt]').forEach((b) => {
    b.onclick = () => {
      const bl = adoptBlock(); if (bl) { nope(bl); return; }
      const [kind, id] = b.dataset.shadopt.split('|');
      let spec;
      if (kind === 'rescue') spec = rescues.find((r) => r.id === id);
      else { if (!shelterSex[id]) { nope('Pick Boy or Girl first. The siblings are waiting politely.'); return; } spec = { key: id, sex: shelterSex[id], months: 10 }; }
      if (!spec) return;
      const def = kind === 'rescue' ? spec.name : dogInfo(spec.key).name;
      const pp = openModal(`Name your new ${spec.sex === 'female' ? 'girl' : 'boy'} ${sexSym(spec.sex)}`, `<p>${kind === 'rescue' ? 'The shelter calls this one' : 'The tag says'} <b>${esc(def)}</b>. Keep it, or pick something just as silly.</p><input id="shName" class="namebox" maxlength="16" value="${esc(def)}" autofocus>`, { foot: '<button class="btn no" id="shNo">Back</button><button class="btn yes big" id="shOk">Bring home!</button>' });
      const done = () => {
        const nm = ($('#shName', pp).value || def).trim().slice(0, 16) || def; const d = addDog(spec, nm);
        closeModal(); audioCue('adopt'); SFX.fanfare();
        const pd = PRd(d); toast(`${nm} is home! ${pd.He} sniffs everything twice. ${S.dogs.length} dogs now.`, 'gold');
        S.place = 'yard'; go('yard');
      };
      $('#shOk', pp).onclick = done; $('#shNo', pp).onclick = () => openShelterList();
      $('#shName', pp).addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
    };
  });
}

/* ======================= v1.5B: phone layout (portrait, touch) =======================
   html[data-layout="phone"] switches every phone rule on. Nothing here runs or shows at >= 1024 px wide. */
const isPhone = () => document.documentElement.dataset.layout === 'phone';
/* v2.2: the mode switch lives in 22c_phone_shell.js (psApplyLayout). This wrapper and the calls below stay so nothing else breaks. */
function applyLayout(rerender) { psApplyLayout(rerender); }
/* camera: crop the 1000x600 hub scene around the dog (x ~ 430) so the full height stays visible */
let camCx = 430, camRaf = 0;
function camApply(cx) {
  if (!isPhone() || !['yard', 'bath'].includes(cur.mode)) return;
  const svg = $('#view > svg.world'); if (!svg) return;
  const vw = view.clientWidth, vh = view.clientHeight; if (!vw || !vh) return;
  const vbW = 600 * vw / vh;
  if (vbW >= 1000) { svg.setAttribute('viewBox', '0 0 1000 600'); return; }
  const x = clamp(cx - vbW / 2, 0, 1000 - vbW);
  svg.setAttribute('viewBox', `${x.toFixed(1)} 0 ${vbW.toFixed(1)} 600`);
}
function camTo(cx, secs = 0.6) {
  if (!isPhone()) return; cancelAnimationFrame(camRaf);
  const from = camCx, t0 = performance.now(), dur = Math.max(1, secs * 1000);
  const stepF = (t) => { const k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; camCx = from + (cx - from) * e; camApply(camCx); if (k < 1) camRaf = requestAnimationFrame(stepF); };
  camRaf = requestAnimationFrame(stepF);
}
applyLayout(false);
window.addEventListener('resize', () => applyLayout(true));
window.addEventListener('orientationchange', () => setTimeout(() => applyLayout(true), 200));

/* bottom sheets: drag handle + swipe down to close */
function sheetSwipe(sheet, onClose) {
  if (!sheet || sheet.dataset.swipe) return; sheet.dataset.swipe = '1';
  let y0 = null, dy = 0, id = null;
  sheet.addEventListener('pointerdown', (e) => {
    if (!isPhone()) return; const r = sheet.getBoundingClientRect();
    if (e.clientY - r.top > 56 || e.target.closest('button,input,select,a,[role=tab],.ft-pan,[data-noswipe]') || psPansX(e.target, sheet)) return;
    y0 = e.clientY; dy = 0; id = e.pointerId; try { sheet.setPointerCapture(id); } catch (er) { /* none */ }
  });
  sheet.addEventListener('pointermove', (e) => { if (y0 == null || e.pointerId !== id) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 == null) return; y0 = null; sheet.style.transform = ''; if (dy > 70) onClose(); dy = 0; };
  sheet.addEventListener('pointerup', end); sheet.addEventListener('pointercancel', end);
}

/* map on phones: drag-pan (native scroll) + tap a place -> confirm chip */
function mapPick(k) {
  const chip = $('#mapGo'); if (!chip) return pickArea(k);
  const g = $(`#mapPan [data-area="${k}"]`); if (g) mapHighlight(g);
  const lockB = PLACES[k] && topBond() < PLACES[k].bond, here = (S.place === 'house' ? 'yard' : S.place) === k;
  const name = k === 'shelter' ? 'the shelter' : PLACES[k] ? PLACES[k].n : k;
  chip.hidden = false; chip.dataset.k = k;
  chip.innerHTML = lockB ? `<span>${esc(PLACES[k].n)}: opens at Bond ${PLACES[k].bond}</span>` : here ? `<span>You are here: ${esc(name)}</span><button class="btn" id="mapStay">Stay</button>` : `<button class="btn go big" id="mapGoBtn">${k === 'shelter' ? 'Visit the shelter' : 'Go to ' + esc(name)}</button><button class="btn" id="mapNo" aria-label="Cancel">x</button>`;
  const gb = $('#mapGoBtn'); if (gb) gb.onclick = () => { chip.hidden = true; pickArea(k); };
  const st = $('#mapStay'); if (st) st.onclick = () => go('yard');
  const no = $('#mapNo'); if (no) no.onclick = () => { chip.hidden = true; const hi = $('#mapHi'); if (hi) hi.hidden = true; };
  SFX.click();
}
let mapHighlight = () => {};
/* v2.2: the "..." menu (openMore) and the long-press tooltip (psLongPress) moved to 22c_phone_shell.js */
