/* ======================= v1.5A: more dogs ======================= */
const PER_DOG = ['stats', 'bond', 'outfit', 'potty', 'sleeping', 'dishLog', 'buff', 'glowUntil', 'pupUntil', 'tricks'];
const HOUSE_CAP = { 'Cardboard Box': 1, 'Classic Wooden Doghouse': 2, 'Cozy Cottage': 2, 'Snow Igloo': 2, 'Treehouse Den': 3, 'Royal Castle Kennel': 4,
  'Little Tea House': 2, 'Beach Hut': 2, 'Camper Van': 3, 'Pumpkin Cottage': 3, 'Lighthouse Kennel': 3, 'Rocket Ship': 3 }; // v2.4
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
function stayHomeLine(d) { return d && Array.isArray(S.litters) && S.litters.some((l) => l && l.mum === d.id) ? tt('pack.is_nursing_the_pups_and', '{name} is nursing the pups and stays home for now. Home, yard and the vet only.', { name: d.name }) : tt('pack.hasn_t_had_all_puppy', "{name} hasn't had all puppy shots yet. Home, yard and the vet only until 3 months.", { name: d.name }); }
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
  if (typeof blOn === 'function' && blOn()) return; // v2.10: ball play owns the dogs, the HUD row waits
  if (busy) { nope(tt('pack.hold_on_is_busy', 'Hold on, {name} is busy.', { name: NAME() })); return; }
  if (awayFromHome() && staysHome(d)) { nope(tt('pack.is_at_home', '{name} is at home. {stayHomeLine}', { name: d.name, stayHomeLine: stayHomeLine(d) })); return; }
  S.activeId = id; markDirty(); hudDogKey = ''; dogKey = ''; SFX.boop(760);
  // v2.10 ROAM: the stats switch to that dog where it stands. Nobody moves and the camera stays (every dog is drawn the same; the leader is data)
  if (cur.mode === 'yard' && $('#pack') && !TRN) { if (IDLE.act) { IDLE.steps = []; idleEnd(); } const pk = $('#pack'); pk.innerHTML = packSVG(); bindPack(); renderDog(dogPoseNow(), rmSt(d).face, true); setHudDog(); updateHUD(); setTimeout(() => { const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-bounce'); void fx.getBBox(); fx.classList.add('tk-bounce'); } const h = dogHeadWorld(); say(PICK([tt('pack.reporting_for_duty', '{name} reporting for duty.', { name: d.name }), tt('pack.s_turn_has_been_waiting', "{sex, select, female {{name}'s turn! She has been waiting politely. Ish.} other {{name}'s turn! He has been waiting politely. Ish.}}", { sex: homeSx(d), name: d.name }), tt('pack.steps_up', '{name} steps up.', { name: d.name })]), h.x, h.y, 1800); }, 60); }
  else if (cur.mode === 'yard') go('yard');
  else { setHudDog(); updateHUD(); }
}

/* ---- the pack in hub scenes ---- */
/* v1.7 fix: secondary dogs stand on the floor beside or in front of the furniture, never on it, and never in the dog-house or bed zone.
   [feet x, feet y, facing, scale]; scale shrinks with depth. Spots were solved against each scene's furniture, the active dog, the bowl and the place buttons. */
const PACK_SPOTS = {yard: [[250, 402, 'right', 0.52], [930, 438, 'left', 0.57], [120, 402, 'right', 0.52]], house: [[250, 414, 'right', 0.53], [930, 424, 'left', 0.53], [115, 586, 'right', 0.76]], square: [[115, 562, 'right', 0.73], [640, 590, 'left', 0.77], [910, 414, 'left', 0.53]], cafe: [[115, 562, 'right', 0.73], [640, 590, 'left', 0.77], [930, 466, 'left', 0.6]], vet: [[115, 562, 'right', 0.73], [640, 590, 'left', 0.77], [930, 470, 'left', 0.6]], salon: [[240, 480, 'right', 0.62], [615, 412, 'left', 0.53], [640, 592, 'left', 0.77]], market: [[240, 484, 'right', 0.58], [615, 456, 'left', 0.53], [85, 572, 'right', 0.73]], dogpark: [[615, 416, 'left', 0.54], [640, 592, 'left', 0.77], [745, 408, 'left', 0.53]], hilltop: [[240, 478, 'right', 0.62], [615, 406, 'left', 0.53], [640, 590, 'left', 0.77]], pier: [[250, 410, 'right', 0.53], [640, 590, 'left', 0.77], [120, 434, 'right', 0.56]], park: [[240, 476, 'right', 0.62], [640, 592, 'left', 0.77], [670, 408, 'left', 0.53]], river: [[250, 456, 'right', 0.53], [640, 592, 'left', 0.77], [100, 584, 'right', 0.75]], woods: [[240, 476, 'right', 0.62], [615, 424, 'left', 0.55], [640, 592, 'left', 0.77]], beach: [[120, 510, 'right', 0.66], [640, 590, 'left', 0.77], [930, 450, 'left', 0.58]], default: [[240, 482, 'right', 0.62], [615, 430, 'left', 0.55], [640, 590, 'left', 0.77]]};
const NAP_ZONE = { yard: [740, 515, 0.75], house: [740, 505, 0.75] }; // the dog-house doorway / the bed, where the active dog naps
const packPose = {};
// phone yard: the camera crop (about x 95-620) put spot 0 on the missions clipboard (MS_YARD, 24_missions.js), so a tap there switched dogs. On phones the first
// dog stands in front of the door, left of the clipboard's tap box, and the third goes by the hammock (off the crop until the camera follows the dog there).
// v2.7 phone review: that spot (x 134) was off the left edge on Pixel 7 and at 360 px (their crops start at x 159 and 151), so spot 0 now stands at the
// front left, in front of the bowl spot and left of the Garden Bench: in the crop on every width, clear of the clipboard, #dogHit, the house door, the
// place chip and every default decoration spot. Its Feed-all bowl is lifted onto the scene (fbPackBowls).
const PACK_SPOTS_PH = { yard: [[222, 596, 'right', 0.58], [930, 438, 'left', 0.57], [960, 560, 'left', 0.7]] };
// v2.10 ROAM: the pack dogs roam (37_roam.js), so a "spot" is where each one stands now: [feet x, feet y, facing, scale], in others() order
// After the dogs comes the visiting dog's spot (14b visitorSpot takes the entry after the pack's)
function packSpots() { const l = others().map((d) => { const r = rmSt(d); return [r.x, r.y, r.face, rmK(r)]; }), f = rmFreeSpot(); while (f && l.length < Math.min(3, Math.max(0, S.dogs.length - 1))) l.push(f); if (f) l.push(f); return l; }
function packDogSVG(d, i) {
  rmApplyFixed(d, i); // napping at the door or on its bed, on furniture, the Proud Mum by the chair: those spots still win
  return `<g class="rmdog packdog hot" data-dog="${d.id}" tabindex="0" role="button" aria-label="${esc(tt('pack.rub_or_tap_to_pet', '{sex, select, female {{name}: rub or tap to pet her} other {{name}: rub or tap to pet him}}', { sex: homeSx(d), name: d.name }))}">${rmPackInner(d, i)}</g>`;
}
function hmMumIn(d) { return typeof mumInBasket === 'function' && mumInBasket(d); } // a nursing mum is drawn in the nursery basket, not with the pack
function hmChairOut4(d) { return !!(d.proud && S.place === 'yard' && hmDecorOut('Rocking Chair') && Math.random() < 0.25); } // about 1 in 4 idle picks
function hmChairDown(d) { return !!(d.proud && S.place === 'yard' && !d.sleeping && packPose[d.id] === 'down' && typeof hmDecorOut === 'function' && hmDecorOut('Rocking Chair')); }
// v2.10 ROAM: every dog in one layer, back to front by feet y, the leader too (its shell holds #dogPos: full = the scene build's markup)
function packSVG(full) {
  if (!S || !S.dogs) return ''; rmSeed();
  const os = others().slice(0, 3), items = os.map((d, i) => { if (hmMumIn(d)) return null; const s = packDogSVG(d, i); return { y: rmSt(d).y, s }; }).filter(Boolean);
  items.push({ y: rmSt(D()).y, s: rmLeadSVG(full), lead: true });
  return items.sort((a, b) => a.y - b.y).map((o) => o.s).join('');
}
function bindPack() {
  const g = $('#pack'); if (!g) return; rmAdopt();
  // v2.10 ROAM: a rub or tap on any dog pets that dog only (crPetBind), with or without pack care; a long press opens its card (Make leader, Dress, Train)
  g.querySelectorAll('.packdog[data-dog]').forEach((el) => { if (el.dataset.rmb) return; el.dataset.rmb = '1'; crPetBind(el); });
  if (typeof fbPackNapFit === 'function') fbPackNapFit(); // v2.5: a pack dog napping on the house bed lies on it, over the bed's front lip
  rmDepth();
}
function redrawPackDog(d) { if (!d || d === D()) return; const g = $(`#pack .packdog[data-dog="${d.id}"]`); if (!g) return; const i = others().indexOf(d); g.outerHTML = packDogSVG(d, i); bindPack(); }
function packAmbient() {
  if (S.dogs.length < 2 || cur.mode !== 'yard' || busy || !modal.hidden || RM.paused.size || (typeof blOn === 'function' && blOn())) return; // v2.10: quiet during ball play
  const os = others(); if (!os.length) return;
  if (Math.random() < 0.55) { const d = PICK(os); if (!d.sleeping) { packPose[d.id] = hmChairOut4(d) ? 'down' : PICK(['sit', 'happy', 'idle', 'sleep']); redrawPackDog(d); } return; }
  const a = PICK(S.dogs), b = PICK(S.dogs.filter((x) => x !== a));
  const lines = [tt('pack.and_are_having_a_staring', '{name} and {name2} are having a staring contest.', { name: a.name, name2: b.name }), tt('pack.is_sniffing_allows_it_for', '{name} is sniffing {name2}. {name2} allows it. For now.', { name: a.name, name2: b.name }), tt('pack.stole_s_favourite_spot_is', "{sex, select, female {{name} stole {name2}'s favourite spot. She is drafting a complaint.} other {{name} stole {name2}'s favourite spot. He is drafting a complaint.}}", { sex: homeSx(b), name: a.name, name2: b.name }), tt('pack.and_zoom_in_circles_nobody', '{name} and {name2} zoom in circles. Nobody knows why. Not even them.', { name: a.name, name2: b.name }), tt('pack.brought_a_leaf_pretends_not', '{sex, select, female {{name} brought {name2} a leaf. She pretends not to care. She cares.} other {{name} brought {name2} a leaf. He pretends not to care. He cares.}}', { sex: homeSx(b), name: a.name, name2: b.name }), tt('pack.barks_at_nothing_barks_at', '{sex, select, female {{name} barks at nothing. {name2} barks at her for barking.} other {{name} barks at nothing. {name2} barks at him for barking.}}', { sex: homeSx(a), name: a.name, name2: b.name })];
  S.dogs.forEach((d) => { d.stats.happy = clamp(d.stats.happy + 2, 0, 100); }); updateHUD();
  toast(tt('pack.plus_2_happiness_each', '{line} (+2 Happiness each)', { line: PICK(lines) }), 'good');
}
let greetFor = null;
function greetWalker() {
  if (!greetFor || S.dogs.length < 2) { greetFor = null; return; }
  const w = dogById(greetFor); greetFor = null; if (!w || w.id !== S.activeId) return;
  const o = PICK(others()); if (!o) return;
  setTimeout(() => toast(tt('pack.plus_3_happiness', '{line} (+3 Happiness)', { line: PICK([tt('pack.sniffs_thoroughly_report_filed', '{name} sniffs {name2} thoroughly. Report filed.', { name: o.name, name2: w.name }), tt('pack.greets_like_was_gone_for', '{sex, select, female {{name} greets {name2} like she was gone for a year. It was a walk.} other {{name} greets {name2} like he was gone for a year. It was a walk.}}', { sex: homeSx(w), name: o.name, name2: w.name }), tt('pack.checks_for_treats_none_found', '{name} checks {name2} for treats. None found. Suspicious.', { name: o.name, name2: w.name })]) }), 'good'), 900);
  [w, o].forEach((d) => { d.stats.happy = clamp(d.stats.happy + 3, 0, 100); });
}

/* ---- HUD switcher ---- */
function renderDogChips() {
  const wrap = $('#hudPack'); if (!wrap) return;
  wrap.innerHTML = S.dogs.length > 1 ? others().map((d) => `<button class="dchip" data-dog="${d.id}" aria-label="${esc(tt('pack.switch_to', 'Switch to {name}', { name: d.name }))}" title="${esc(d.name)}">${headSVG(d)}<i class="mood ${moodOf(d)}"></i><span class="dsx">${d.sex === 'female' ? '♀' : '♂'}</span></button>`).join('') : '';
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
  wrap.insertAdjacentHTML('beforeend', `<button class="dchip dmore" aria-label="${esc(tt('pack.label_more_dogs', '{n, plural, one {# more dog: see the pack} other {# more dogs: see the pack}}', { n }))}">+${n}</button>`);
  wrap.querySelector('.dmore').onclick = () => { SFX.click(); openPackSheet(); };
  // UI/UX H6: still clipped (the row's cell ends before the coin counter): drop one more chip into the +N
  for (let j = k - 1; j >= 0 && wrap.scrollWidth > wrap.clientWidth + 3; j--) { chips[j].hidden = true; const mo = wrap.querySelector('.dmore'), m = chips.length - j; mo.textContent = '+' + m; mo.setAttribute('aria-label', tt('pack.label_more_dogs', '{n, plural, one {# more dog: see the pack} other {# more dogs: see the pack}}', { n: m })); }
}
window.addEventListener('resize', () => { if (S && S.dogs && S.dogs.length > 1) phChipsFit($('#hudPack')); });
// UI/UX H6: the name line (clock, title) and the coin counter change width without a resize (garden, kitchen, more coins), so the chips refit then too
let phChipsRO = null, phChipsRaf = 0;
function phChipsWatch() {
  if (phChipsRO || typeof ResizeObserver === 'undefined') return; const els = [$('#hud .namewrap'), $('#coins')].filter(Boolean); if (!els.length) return;
  phChipsRO = new ResizeObserver(() => { cancelAnimationFrame(phChipsRaf); phChipsRaf = requestAnimationFrame(() => { if (isPhone() && S && S.dogs && S.dogs.length > 1) phChipsFit($('#hudPack')); }); });
  els.forEach((e) => phChipsRO.observe(e));
}
on('game:ready', phChipsWatch);
function openPackSheet() {
  const p = openModal(tt('pack.your_pack', 'Your pack'), `<div class="packpick">${others().map((d) => `<button class="card" data-dog="${d.id}"><span class="pp-head" aria-hidden="true">${headSVG(d)}</span><b>${esc(d.name)} ${sexSym(d.sex)}</b><span class="small">${tt('pack.tap_to_switch', 'Tap to switch')}</span></button>`).join('')}</div>`, { cls: 'packsheet' });
  p.querySelectorAll('[data-dog]').forEach((b) => { b.onclick = () => { SFX.click(); closeModal(); switchDog(b.dataset.dog); }; });
}
function chipsKey() { return S.dogs.map((d) => d.id + d.name + d.sex + moodOf(d) + (d.id === S.activeId ? '*' : '') + (awayFromHome() && staysHome(d) ? 'h' : '')).join('|') + '|' + (S.title || ''); }

/* ---- Feed all ---- */
// v2.5: a bowl of the food at each eating pack dog's paws, under the dog (like the yard bowl under the active dog), sized to the dog's
// depth. The eat pose puts the muzzle about 0.29 of the box in from the side the dog faces. Empty list: the bowls go away.
function fbPackBowls(dogs, food) {
  const svg = $('svg.world', view), pack = $('#pack'); let g = $('#fbPackBowls'); if (g) g.remove(); if (!svg || !pack || !dogs.length || cur.mode !== 'yard') return;
  g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'fbPackBowls'; g.setAttribute('pointer-events', 'none');
  g.innerHTML = dogs.map((d) => { const i = others().indexOf(d); if (i < 0 || i > 2 || hmMumIn(d)) return ''; const hs = typeof hoPackSpot === 'function' ? hoPackSpot(d, i) : null, [fx, fy, face, sc0] = hs || packSpots()[i] || packSpots()[0], sc = sc0 || 0.6, w = DW * sc, s = 90 * sc, cx = fx - w / 2 + w * (face === 'left' ? 0.29 : 0.71); const cy = isPhone() && S.place === 'yard' ? Math.min(fy + 7 * sc, 598 - s / 2) : fy + 7 * sc; return place(bowlArt(food), cx - s / 2, cy - s / 2, s, s); }).join('');
  pack.parentNode.insertBefore(g, pack);
}
function feedAllFood() { const meals = FOOD.filter((f) => f.n !== 'Fresh Water' && !SNACKS.includes(f.n) && (S.inv.food[f.n] || 0) > 0); meals.sort((a, b) => S.inv.food[b.n] - S.inv.food[a.n]); return meals[0] || null; }
function feedAll() {
  const f = feedAllFood(); if (!f) { nope(tt('pack.no_meals_in_the_pantry', 'No meals in the pantry. Kibble Corner sells some.')); return; }
  if (busy) return; const fed = [];
  const order = crOn() ? crDogs() : [D()].concat(others()); // v2.7 PACK CARE: with pack care, the ticked dogs present
  order.forEach((d) => {
    if ((S.inv.food[f.n] || 0) <= 0 || d.stats.hunger > 90 || d.sleeping) return;
    crFree(d); S.inv.food[f.n]--; withDog(d, () => { addStat('hunger', f.hunger || 0); addStat('happy', (f.happy || 0) + (isFavFood(f.n) ? 5 : 0) + pupBonus(d, f)); addStat('energy', f.energy || 0); addBond(2 + (f.bond || 0)); pottyAfter('meal'); });
    fed.push(d);
  });
  if (S.inv.food[f.n] <= 0) delete S.inv.food[f.n];
  if (!fed.length) { nope(tt('pack.everyone_is_full_or_asleep', 'Everyone is full or asleep. Nobody has ever said that before.')); return; }
  dailyCare('feed'); markCareDay(); trackAct('feed', crOn() ? { name: f.n, dogs: fed.length, ids: fed.map((d) => d.id) } : { name: f.n, ids: fed.map((d) => d.id) }); if (typeof shFoodTip === 'function') setTimeout(() => shFoodTip(f.n), 900); markDirty(); popDown(); SFX.crunch(); setTimeout(SFX.crunch, 300); setTimeout(SFX.crunch, 600); // v2.13: ids, the dogs that ate (41_expressions.js)
  // v2.5: every fed dog eats from a bowl of that food: the active dog walks to the yard bowl (shown only while it eats), each pack dog gets its own bowl at its paws
  if (fed.includes(D())) { busy = true; hideBubble(); setBowl(f.n); dogTo(-125, 0, 1, 0.8); renderDog('walk', 'left'); setTimeout(() => setTemp('eat', 1400), 850); setTimeout(() => { setBowl(null); dogTo(0, 0, 1, 0.8); setTimeout(() => { busy = false; renderDog(dogPoseNow()); }, 900); }, 2300); }
  const packFed = others().filter((d) => fed.includes(d)); fbPackBowls(packFed, f.n);
  packFed.forEach((d) => { if (crOn()) packNext[d.id] = Math.max(packNext[d.id] || 0, performance.now() + 1800); packPose[d.id] = 'eat'; redrawPackDog(d); setTimeout(() => { packPose[d.id] = 'happy'; redrawPackDog(d); fbPackBowls([], null); }, 1500); });
  const skipped = S.dogs.length - fed.length;
  const pups = fed.filter((d) => pupBonus(d, f)).map((d) => d.name), eats = fed.map(eatForLine).join('');
  toast(tt('pack.feed_all_bowls_of_for', 'Feed all: {n, plural, one {# bowl} other {# bowls}} of {food} for {dogs}. A symphony of crunching.', { n: fed.length, food: tdata('food.' + tid(f.n) + '.n', f.n), dogs: tlist(fed.map((d) => d.name)) }) + (pups.length ? ' ' + tt('pack.puppy_sized_bites_happiness_for', 'Puppy-sized bites: +{pupHappy} Happiness for {dogs}.', { pupHappy: f.pupHappy, dogs: tlist(pups) }) : '') + eats + (skipped ? ' ' + tt('pack.skipped_full_asleep_or_not', '({skipped} skipped: full, asleep or not enough food.)', { skipped }) : ''), 'good');
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
    // v2.14: each requirement carries its kind (k) and numbers; the label is display text only (the logic never reads it)
    reqs.push({ k: R.dogs === 1 ? 'dog1' : 'dogs', bond: R.bond, label: R.dogs === 1 ? tt('pack.a_dog_at_bond', 'A dog at Bond {bond}', { bond: R.bond }) : tt('pack.bond_dogs', 'Bond {bond} dogs', { bond: R.bond }), done: have >= R.dogs, have, need: R.dogs });
    if (R.days) reqs.push({ k: 'days', label: tt('pack.care_days', 'Care days'), done: cd >= R.days, have: cd, need: R.days });
    reqs.push({ k: R.house ? 'housename' : 'housefits', fits: R.fits, label: R.house ? (n < MAX_DOGS ? tt('pack.house_or_bigger', '{house} (or bigger)', { house: tdata('houses.' + tid(R.house) + '.n', R.house) }) : tdata('houses.' + tid(R.house) + '.n', R.house)) : tt('pack.a_house_that_fits', 'A house that fits {fits}', { fits: R.fits }), done: fits >= R.fits, have: fits >= R.fits ? 1 : 0, need: 1, house: true });
    const open = spots[n - 2].open && reqs.every((r) => r.done);
    spots.push({ n, open, reqs }); if (open) cap = n;
  }
  const used = S.dogs.length;
  return { cap, used, free: Math.max(0, cap - used), spots };
}
function slotsFree() { return dogSlots().free; }
function reqText(r) { return r.k === 'dog1' ? tt('pack.req_a_dog_at_bond', 'a dog at Bond {bond}', { bond: r.bond }) : r.k === 'housefits' ? tt('pack.req_a_house_that_fits', 'a house that fits {fits}', { fits: r.fits }) : r.house ? r.label : tt('pack.req_progress', '{label} ({have}/{need})', { label: r.label, have: Math.min(r.have, r.need), need: r.need }); }
/* care days: marked by the feed / pet / play paths of this lane, and by watching the daily-care flags (walks, fetch, tricks in other lanes) */
function markCareDay() {
  if (!S || !S.dogs) return; spotsInit(); const t = localISO();
  if (S.careDayLast === t) return; S.careDayLast = t; S.careDays = (S.careDays || 0) + 1; markDirty(); setTimeout(spotsCheck, 700);
  shCareGift(); // v2.4 SHOP: the Cozy Hoodie at 14 care days
}
/* v2.4 SHOP: care milestone gifts (S.careGifts). 14 care days: Mrs. Plum's Cozy Hoodie, once */
function shCareGift() {
  if (!S || !Array.isArray(S.dogs) || !S.dogs.length) return false;
  if (!S.careGifts || typeof S.careGifts !== 'object') S.careGifts = {};
  if ((S.careDays || 0) < 14 || S.careGifts.hoodie) return false;
  S.careGifts.hoodie = localISO(); if (!owns('clothes', 'Cozy Hoodie')) S.inv.clothes.push('Cozy Hoodie'); markDirty(); saveNow();
  msWhenFree(() => {
    SFX.fanfare();
    const p = openModal('<span class="hl">' + tt('pack.a_gift_from_mrs_plum', 'A gift from Mrs. Plum') + '</span>', `<div class="ms-prize"><span class="ms-prize-art">${itemArt('Cozy Hoodie')}</span><div><p>${tt('pack.14_days_of_good_care', '14 days of good care. Mrs. Plum saw it all from her window and made this. Hood up, ears out.')}</p><p class="small">${tt('pack.cozy_hoodie_no_shivering_in', 'Cozy Hoodie: no shivering in the snow. It is in the Wardrobe.')}</p></div></div>`, { cls: 'celebrate sh-gift', foot: '<button class="btn no" id="shLater">' + tt('pack.later', 'Later') + '</button><button class="btn yes big" id="shWear">' + tt('pack.wear_it', 'Wear it') + '</button>' });
    $('#shLater', p).onclick = () => { SFX.click(); closeModal(); };
    $('#shWear', p).onclick = () => { closeModal(); equip('Cozy Hoodie', true); toast(tt('pack.is_wearing_the_cozy_hoodie', '{name} is wearing the Cozy Hoodie. Snug.', { name: NAME() }), 'good'); };
  });
  return true;
}
on('game:ready', () => { if (S && (!S.careGifts || typeof S.careGifts !== 'object')) S.careGifts = {}; setTimeout(shCareGift, 2500); });
let careSnap = null;
function careWatch() {
  if (!S || !S.daily) return; const n = ['feed', 'pet', 'play'].filter((k) => S.daily[k]).length, dy = S.daily.day;
  if (!careSnap || careSnap.s !== S) { careSnap = { s: S, dy, n }; return; }
  const did = dy === careSnap.dy ? n > careSnap.n : n > 0; careSnap.dy = dy; careSnap.n = n; if (did) markCareDay();
}
function spotsCheck() {
  if (!S || !S.adopted || !S.dogs || !S.dogs.length || ['title', 'adopt'].includes(cur.mode)) return;
  spotsInit(); const c = dogSlots().cap;
  if (c > (S.spotsSeen || 1)) { S.spotsSeen = c; markDirty(); SFX.fanfare(); toast(SPOT_TOAST[c] ? tdata('spot_toast.' + c, SPOT_TOAST[c]) : tt('pack.a_new_dog_spot_is', `A new dog spot is open!`), 'gold'); }
}
const PAW_PATH = '<ellipse class="pw" cx="0" cy="7" rx="10" ry="8.5"/><circle class="pw" cx="-11" cy="-5" r="4.3"/><circle class="pw" cx="-4" cy="-11.5" r="4.3"/><circle class="pw" cx="4" cy="-11.5" r="4.3"/><circle class="pw" cx="11" cy="-5" r="4.3"/>';
const LOCK_DOODLE = '<rect x="-8" y="-2" width="16" height="13" rx="3" fill="#FFE3A1" stroke="#5B3D32" stroke-width="2.2"/><path d="M-4.5 -2v-4a4.5 4.5 0 0 1 9 0v4" fill="none" stroke="#5B3D32" stroke-width="2.2" stroke-linecap="round"/><circle cx="0" cy="4.5" r="1.8" fill="#5B3D32"/>';
function spotsHTML(s) {
  s = s || dogSlots(); const n = Math.max(MAX_DOGS, s.used);
  const cells = [];
  for (let i = 1; i <= n; i++) {
    const sp = s.spots[i - 1] || { n: i, open: false, reqs: [] }, d = S.dogs[i - 1], locked = !sp.open;
    const kind = d ? 'filled' : locked ? 'locked' : 'open';
    const label = d ? esc(d.name) : locked ? tt('pack.locked', 'Locked') : tt('pack.free', 'Free!');
    const list = locked && sp.reqs.length ? `<ul class="spotreqs">${sp.reqs.map((r) => `<li class="${r.done ? 'ok' : ''}"><span class="ck" aria-hidden="true">${r.done ? '&#10003;' : '&#9675;'}</span>${esc(r.house ? tt('pack.req_house_yes_no', '{label}: {done, select, yes {yes} other {no}}', { label: r.label, done: r.done ? 'yes' : 'no' }) : r.k === 'dog1' ? tt('pack.req_dog_yes_not_yet', '{label}: {done, select, yes {yes} other {not yet}}', { label: r.label, done: r.done ? 'yes' : 'no' }) : tt('pack.req_label_progress', '{label}: {have}/{need}', { label: r.label, have: Math.min(r.have, r.need), need: r.need }))}</li>`).join('')}</ul>` : '';
    cells.push(`<div class="spot ${kind}${d && locked ? ' extra' : ''}" data-spot="${i}" data-kind="${kind}" aria-label="${esc(d ? tt('pack.dog_spot_named', 'Dog spot {n}: {name}', { n: i, name: d.name }) : locked ? tt('pack.dog_spot_locked', 'Dog spot {n}: locked', { n: i }) : tt('pack.dog_spot_free', 'Dog spot {n}: free', { n: i }))}"><span class="spaw"><svg viewBox="-24 -24 48 48" aria-hidden="true">${PAW_PATH}</svg>${d ? `<span class="shead">${headSVG(d)}</span>` : ''}${locked ? `<span class="slock">${iconOr('lock', LOCK_DOODLE)}</span>` : ''}</span><b>${label}</b><span class="small">${esc(tt('pack.spot_n', 'Spot {n}', { n: i }))}</span>${list}</div>`);
  }
  return `<div class="spots" role="group" aria-label="${esc(tt('pack.label_dog_spots', 'Dog spots'))}">${cells.join('')}</div>`;
}
function spotsLine(s) {
  s = s || dogSlots(); const bl = adoptBlock();
  return `<p class="small spotsum">${tt('pack.dog_spots_used_html', 'Dog spots: <b>{used} of {cap}</b> used ({house}, max {max}).', { used: s.used, cap: s.cap, house: tdata('houses.' + tid(S.house) + '.n', S.house), max: MAX_DOGS })} ${bl ? `<b>${esc(bl)}</b>` : esc(tt('pack.you_have_room_for_another', 'You have room for another friend!'))}</p>`;
}
function openSpots(opts = {}) {
  const s = dogSlots();
  const p = openModal(tt('pack.dog_spots', 'Dog spots'), `${spotsLine(s)}${spotsHTML(s)}<p class="small spothow">${tt('pack.spot_2_opens_early_spots', "Spot 2 opens early. Spots 3 and 4 take real devotion: well-bonded dogs, many days of care and a bigger dog house. Nursery puppies don't need a spot until they stay.")}</p>`,
    { cls: 'spotspop', foot: `${opts.back ? '<button class="btn no" id="spBack">' + tt('pack.back', 'Back') + '</button>' : ''}<button class="btn yes" id="spOk">${tt('pack.ok', 'OK')}</button>` });
  $('#spOk', p).onclick = () => { SFX.click(); closeModal(); };
  const bk = $('#spBack', p); if (bk) bk.onclick = () => { SFX.click(); opts.back(); };
  return p;
}
// "Eating for N!": expecting mums (d.preg) and nursing mums (a litter in S.litters with mum === d.id)
function eatingFor(d) {
  if (!d) return 0; if (d.preg) return 1 + (Array.isArray(d.preg.pups) && d.preg.pups.length ? d.preg.pups.length : 1);
  const L = Array.isArray(S.litters) ? S.litters.find((l) => l && l.mum === d.id) : null; return L ? 1 + ((L.pups && L.pups.length) || 1) : 0;
}
function eatForLine(d) { const n = eatingFor(d); return n ? ' ' + PICK([tt('pack.is_eating_for', '{name} is eating for {n}!', { name: d.name, n }), tt('pack.eating_for_licks_the_bowl', 'Eating for {n}! {name} licks the bowl twice.', { name: d.name, n }), tt('pack.is_eating_for_seconds_are', '{name} is eating for {n}! Seconds are encouraged.', { name: d.name, n })]) : ''; }
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
  if (s.used > s.cap) return tt('pack.everyone_stays_new_friends_need', 'Everyone stays. New friends need a free spot.');
  if (s.used >= MAX_DOGS) return tt('pack.four_dogs_is_a_full', 'Four dogs is a full pack. Everyone stays, and there is no room for more.');
  const nx = s.spots[s.cap]; return tt('pack.all_your_dog_spots_are', 'All your dog spots are taken. The {spot_ord} spot opens with: {list}.', { spot_ord: tdata('spot_ord.' + nx.n, SPOT_ORD[nx.n]), list: tlist(nx.reqs.filter((r) => !r.done).map(reqText)) });
};
function addDog(spec, name) {
  const fav = FAV[spec.key] || FAV.mutt;
  const d = Object.assign({ key: spec.key, name, favFood: fav.food.slice(), favToy: fav.toy }, newDogFields(spec.key, spec.sex, spec.born || bornDaysAgo(spec.months || 10)));
  if (spec.genes) d.genes = spec.genes;
  if (spec.id) d.id = spec.id;
  if (spec.key === 'mutt') { d.favFood = [PICK(FOOD.slice(1).filter((f) => !f.ed && !f.fest)).n]; d.favToy = PICK(TOYS.filter(t => !t.ed && !t.fest)).n; } // v2.8: festival and edition things are never a favourite
  d.rescue = spec.rescue || null; dogDefaults(d, S);
  const c = coatInfo(d); if (c) { d.coat = c.coatName; d.eyes = c.eyes; }
  S.dogs.push(d); markDirty(); hudDogKey = ''; emit('dog:added', { dog: d }); return d;
}
let shelterSex = {};
function shelterCard(spec, kind) {
  // v2.7: rescues and residents (the playroom) gain their trait line and a Meet button (V27.md section 7); starters are as in v2.6
  const sr = kind !== 'starter', tmp = { id: spec.id || 'tmp_' + spec.key, key: spec.key, genes: spec.genes || (STARTER_GENES[spec.key] || STARTER_GENES.mutt) };
  const c = coatInfo(tmp), info = dogInfo(spec.key), home = spec.id && dogById(spec.id);
  const sg = STARTER_GENES[spec.key] || {}, coatName = c ? c.coatName : sg.coat ? tdata('starter_genes.' + spec.key + '.coat', sg.coat) : '', eyes = c ? c.eyes : tdata('starter_genes.' + spec.key + '.eyes', sg.eyes || 'brown');
  const sx = sr ? spec.sex : shelterSex[spec.key] || null;
  const blocked = adoptBlock();
  const dogArt = sr && spec.months != null && spec.months < 6 ? dogSVG(Object.assign({}, tmp, { born: bornDaysAgo(spec.months) }), { pose: 'sit' }) : dogArtSafe(spec.key, Object.assign({ pose: 'sit' }, c ? { coat: c.coat, seed: hashId(tmp.id) } : {}));
  const stamp = kind === 'rescue' ? '<span class="stamp r2">' + tt('pack.rescue', 'Rescue') + '</span>' : kind === 'resident' ? '<span class="stamp r1">' + tt('pack.playroom', 'Playroom') + '</span>' : '<span class="stamp r0">' + tt('pack.starter', 'Starter') + '</span>';
  return `<div class="sitem shcard ${kind}">${stamp}<span class="art shdog">${dogArt}</span>
    <b>${esc(sr ? spec.name : info.name)} ${sr ? sexSym(spec.sex) : ''}</b>
    <span class="desc">${esc(adBreed(info))}${sr ? ` · ${spec.sex === 'female' ? tt('pack.girl', 'Girl') : tt('pack.boy', 'Boy')} · ${ageText(spec.months)}` : ''}<br>${esc(tt('pack.coat_and_eyes', '{coat}, {eyes} eyes', { coat: coatShown(coatName, spec.key), eyes: eyeShown(eyes) }))}<br><i>${esc(sr && spec.trait ? spec.trait : tdata('fallback_dogs.' + info.key + '.personality', info.personality))}</i></span>
    ${kind === 'starter' ? `<div class="wrap" style="justify-content:center"><button class="btn ${sx === 'male' ? 'yes' : ''}" data-shsex="${spec.key}|male" aria-pressed="${sx === 'male'}">${tt('pack.boy', 'Boy')} ♂</button><button class="btn ${sx === 'female' ? 'yes' : ''}" data-shsex="${spec.key}|female" aria-pressed="${sx === 'female'}">${tt('pack.girl', 'Girl')} ♀</button></div>` : ''}
    ${home ? '<span class="chip own">' + tt('pack.already_home', 'Already home') + '</span>' : `<div class="sr-cardbtns">${sr ? `<button class="btn" data-srmeet="${esc(spec.id)}">${tt('pack.meet', 'Meet')}</button>` : ''}<button class="btn ${blocked ? '' : 'go'}" data-shadopt="${kind}|${spec.id || spec.key}" ${blocked ? 'aria-disabled="true"' : ''}>${kind === 'rescue' ? tt('pack.rescue', 'Rescue') : kind === 'resident' ? tt('pack.adopt', 'Adopt') : tt('pack.adopt_a_starter', 'Adopt a starter')}</button></div>`}</div>`;
}
function openShelterList() {
  const rescues = rescuesToday().map((r) => Object.assign({ trait: srTrait(r.id) }, r)), residents = srRoster().filter((x) => x.kind === 'resident');
  const starterKeys = dogsList().map((x) => x.key).filter((k) => !S.dogs.some((d) => d.key === k && !d.rescue));
  const sl = dogSlots();
  const p = openModal(tt('pack.doodle_doggo_shelter', 'Doodle Doggo Shelter'), `<p class="sr-lead">${tt('pack.looking_for_a_home', 'Looking for a home')}</p><div class="shspots">${spotsLine(sl)}${spotsHTML(sl)}</div>
    <h3 class="shh">${tt('pack.today_s_rescues', "Today's rescues")} <span class="small">${tt('pack.new_ones_arrive_every_day', '(new ones arrive every day)')}</span></h3><div class="shopgrid">${rescues.map((r) => shelterCard(r, 'rescue')).join('')}</div>
    ${residents.length ? `<h3 class="shh">${tt('pack.living_in_the_playroom', 'Living in the playroom')} <span class="small">${tt('pack.they_stay_all_week', '(they stay all week)')}</span></h3><div class="shopgrid">${residents.map((r) => shelterCard(r, 'resident')).join('')}</div>` : ''}
    ${starterKeys.length ? `<h3 class="shh">${tt('pack.starter_dogs', 'Starter dogs')}</h3><div class="shopgrid">${starterKeys.map((k) => shelterCard({ key: k }, 'starter')).join('')}</div>` : ''}`, { cls: 'shop shelter' });
  p.querySelectorAll('[data-shsex]').forEach((b) => { b.onclick = () => { const [k, sx] = b.dataset.shsex.split('|'); shelterSex[k] = sx; SFX.click(); openShelterList(); }; });
  p.querySelectorAll('[data-srmeet]').forEach((b) => { b.onclick = () => { SFX.click(); srMeet(b.dataset.srmeet); }; });
  p.querySelectorAll('[data-shadopt]').forEach((b) => {
    b.onclick = () => { const [kind, id] = b.dataset.shadopt.split('|'); srAdoptFlow(kind, id); };
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
  if (!isPhone() || !['yard', 'bath', 'market'].includes(cur.mode)) return;
  const svg = $('#view > svg.world'); if (!svg) return;
  const vw = svg.clientWidth || view.clientWidth, vh = svg.clientHeight || view.clientHeight; if (!vw || !vh) return; // the svg can be shorter than the view (a tray is open, or Market Street zooms out)
  const vbW = 600 * vw / vh;
  if (vbW >= 1000) { svg.setAttribute('viewBox', '0 0 1000 600'); return; }
  const zf = typeof phZoom === 'number' && phZoom > 0 && phZoom < 1 ? phZoom : 1, w = vbW / zf, h = 600 / zf; // phZoom (03_yard.js): Market Street zooms out, the extra sky sits above the scene
  const x = w >= 1000 ? (1000 - w) / 2 : clamp(cx - w / 2, 0, 1000 - w);
  svg.setAttribute('viewBox', `${x.toFixed(1)} ${(600 - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
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
  const name = k === 'shelter' ? tt('pack.the_shelter', 'the shelter') : PLACES[k] ? placeName(k) : k;
  chip.hidden = false; chip.dataset.k = k;
  chip.innerHTML = lockB ? `<span>${esc(tt('pack.opens_at_bond', '{place}: opens at Bond {bond}', { place: name, bond: PLACES[k].bond }))}</span>` : here ? `<span>${esc(tt('pack.you_are_here', 'You are here: {place}', { place: name }))}</span><button class="btn" id="mapStay">${tt('pack.stay', 'Stay')}</button>` : `<button class="btn go big" id="mapGoBtn">${k === 'shelter' ? tt('pack.visit_the_shelter', 'Visit the shelter') : esc(tt('pack.go_to', 'Go to {place}', { place: name }))}</button><button class="btn" id="mapNo" aria-label="${esc(tt('pack.label_cancel', 'Cancel'))}">x</button>`;
  const gb = $('#mapGoBtn'); if (gb) gb.onclick = () => { chip.hidden = true; pickArea(k); };
  const st = $('#mapStay'); if (st) st.onclick = () => go('yard');
  const no = $('#mapNo'); if (no) no.onclick = () => { chip.hidden = true; const hi = $('#mapHi'); if (hi) hi.hidden = true; };
  SFX.click();
}
let mapHighlight = () => {};
/* v2.2: the "..." menu (openMore) and the long-press tooltip (psLongPress) moved to 22c_phone_shell.js */
