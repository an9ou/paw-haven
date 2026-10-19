/* ======================= v1.3.1: popups, beds, gating, map, snacks, potty ======================= */
/* ---- popups ---- */
let popAct = null;
const popOpen = () => !!dock.querySelector('.tray:not(.dock-idle):not(.mini)') && !stage.classList.contains('flowdock');
function popDown() { if (cur.mode === 'yard' && popOpen()) { S.sleeping ? sleepTray() : dockIdle(); } }
function refreshActs() {
  const pop = !modal.hidden || popOpen(); if (!pop) popAct = null;
  [...bar.querySelectorAll('.act')].forEach((b) => { const a = b.dataset.act; b.classList.toggle('on', (a === 'walk' && (cur.mode === 'routes' || cur.mode === 'walk')) || (a === 'map' && cur.mode === 'map') || (pop && popAct === a)); });
}
new MutationObserver(refreshActs).observe(dock, { childList: true });
new MutationObserver(refreshActs).observe(modal, { childList: true, attributes: true, attributeFilter: ['hidden'] });
dock.addEventListener('click', (e) => { if (e.target === dock && popOpen()) closeTray(); });

/* ---- snacks only away from home ---- */
const SNACKS = ['Bone-shaped Biscuit', 'Pupcake', 'Wild Berries', 'Golden Bone'].concat(FOOD.filter((f) => f.snack).map((f) => f.n)); // v2.4: the light foods are snacks too
const atHome = () => S.place === 'yard' || S.place === 'house';
const isMeal = (n) => n !== 'Fresh Water' && !SNACKS.includes(n);

/* ---- gating (garden + kitchen ship later) ---- */
const gkOn = () => !!(PG() && typeof PG().open === 'function');
const kOn = () => !!(PK() && typeof PK().open === 'function');
function comingSoon(what) {
  SFX.boop(520);
  toast(what === 'kitchen' ? tt('popup.the_kitchen_is_coming_soon', 'The kitchen is coming soon! {name} has already claimed the spot by the oven.', { name: NAME() }) : tt('popup.the_veggie_patch_is_coming', 'The veggie patch is coming soon! Pip is still sorting the seeds. {name} is supervising.', { name: NAME() }), 'gold');
}
function soonCard(what) {
  return `<div class="soon-card"><span class="stamp r1">${tt('popup.coming_soon', 'Coming soon')}</span><p>${tt('popup.soon_card_html', '{what, select, garden {{sex, select, female {<b>The veggie patch</b> are on the way. Pip is setting up the Sprout Cart, and {name} is practising her "patient face".} other {<b>The veggie patch</b> are on the way. Pip is setting up the Sprout Cart, and {name} is practising his "patient face".}}} other {{sex, select, female {<b>The kitchen and recipes</b> are on the way. Pip is setting up the Sprout Cart, and {name} is practising her "patient face".} other {<b>The kitchen and recipes</b> are on the way. Pip is setting up the Sprout Cart, and {name} is practising his "patient face".}}}}', { what, sex: S && S.dog && S.dog.sex, name: NAME() })}</p></div>`;
}

/* ---- pet beds ---- */
const BEDS = [
  { n: 'Old Blanket', price: 0, bond: 1, bonus: 0, note: 'A folded patchwork blanket. Smells like home.' },
  { n: 'Plaid Pillow', price: 180, bond: 1, bonus: 0.05, note: 'A big square plaid cushion with a button tuft.' },
  { n: 'Fluffy Donut Bed', price: 250, bond: 2, bonus: 0.10, note: 'A round fluffy donut ring in pastel pink.' },
  { n: 'Banana Bed', price: 350, bond: 3, bonus: 0.10, note: 'A comedy banana. The peel is the blanket.' },
  { n: 'Hammock Cot', price: 450, bond: 3, bonus: 0.15, note: 'A wooden cot with a striped canvas hammock.' },
  { n: 'Cloud Bed', price: 900, bond: 6, bonus: 0.30, note: 'A puffy cloud with a little rainbow pillow.' },
  { n: 'Royal Canopy Bed', price: 2000, bond: 8, bonus: 0.45, note: 'Velvet, gold trim, curtains and a crown.' },
  { n: 'Knitted Nest', price: 150, bond: 1, bonus: 0.05, v27: true, note: 'A chunky knitted ring with a dip in the middle. Room for one dog, or two puppies.' } // v2.7: a cheap second bed for a growing pack (V27.md)
];
const BED_BOX = [610, 360, 260, 160]; // x, y, w, h in the house scene (floor contact y = 360 + 152)
const bedInfo = (n) => BEDS.find((b) => b.n === (n || S.bed)) || BEDS[0];
const hasBedArt = () => typeof PA().bed === 'function';
function bedSVG(n) { try { const v = PA().bed(n); return typeof v === 'string' && v.includes('<svg') ? v : ''; } catch (e) { return ''; } }
// v2.7: the whole house room (28_home.js hoRoomSVG): beds, decorations and furniture at their own spots, the active dog's bed is #bedG.
// An old save draws exactly its one bed at BED_BOX, as before.
function bedLayers() {
  if (S.place !== 'house') return { back: '', front: '' };
  hoSync(); return hoRoomSVG();
}
// "Use this bed": puts the bed in the house at a free spot (if it is not there yet) and makes it the active dog's bed (whoever had it gets the old one)
function useBed(n) {
  if (!S.beds.includes(n)) return; hoSync();
  if (!S.bedAt[n]) S.bedAt[n] = hoFreeSpot(n, [BED_BOX[0], BED_BOX[1]]);
  hoGiveBed(S.activeId, n); markDirty(); SFX.pop();
  toast(tt('popup.inspects_the_turns_around_three', '{name} inspects the {bed}, turns around three times, and approves.', { name: NAME(), bed: tdata('beds.' + tid(n) + '.n', n) }), 'good');
  if (cur.mode === 'yard' && S.place === 'house') { const keepSleep = S.sleeping; go('yard'); if (keepSleep) sleepTray(); }
}
// the beds in the house (with who naps on each) and the beds in the shed
function openBeds() {
  hoSync(); const inH = BEDS.filter((b) => S.beds.includes(b.n) && S.bedAt[b.n]), shed = BEDS.filter((b) => S.beds.includes(b.n) && !S.bedAt[b.n]);
  const p = openModal(tt('popup.pet_beds', 'Pet beds'), `<p class="small">${tt('popup.beds_live_in_the_cozy', 'Beds live in the Cozy House. Every dog naps on its own bed. Barkitecture on Market Street sells more.')}</p>
    <button class="btn yes ho-arrange" id="hoBedsArr"><span class="art">${iconOr('arrange', '<path d="M-12 0h24M0 -12v24" stroke="#5B3D32" stroke-width="3"/>')}</span>${tt('popup.arrange_the_house', 'Arrange the house')}</button>
    <h4 class="ho-h">${tt('popup.in_the_house', 'In the house')}</h4><div class="shopgrid">${inH.map((b) => hoBedsCard(b, true)).join('')}</div>${shed.length ? `<h4 class="ho-h">${tt('popup.in_the_shed', 'In the shed')}</h4><div class="shopgrid">${shed.map((b) => hoBedsCard(b, false)).join('')}</div>` : ''}`, { cls: 'shop ho-beds' });
  p.querySelectorAll('[data-usebed]').forEach((b) => { b.onclick = () => { useBed(b.dataset.usebed); openBeds(); }; });
  p.querySelectorAll('[data-bedfor]').forEach((b) => { b.onclick = () => { SFX.click(); const [id, n] = b.dataset.bedfor.split('|'), d = dogById(id); if (!hoGiveBed(id, n)) return; if (d) toast(tt('popup.claims_the', '{name} claims the {bed}.', { name: d.name, bed: tdata('beds.' + tid(n) + '.n', n) }), 'good'); if (cur.mode === 'yard' && S.place === 'house') { const keep = S.sleeping; go('yard'); if (keep) sleepTray(); } openBeds(); }; });
  $('#hoBedsArr', p).onclick = () => { SFX.click(); closeModal(); hoPlaceStart(undefined, 'house'); };
}
/* idle curl-up on the bed (house only) */
let curlT = [], curling = false;
function curlUp() {
  if (busy || curling || S.sleeping || S.place !== 'house' || cur.mode !== 'yard' || popOpen() || !modal.hidden) return;
  curling = true; hideBubble(); dogTo(...napSpot(), 1.2); tempPose = 'walk'; tempUntil = performance.now() + 1250; renderDog('walk', 'right');
  curlT.push(setTimeout(() => { setTemp('sleep', 5800); const h = dogHeadWorld(); say(PICK([tt('popup.zz_just_resting_my_eyes', 'zz... (just resting my eyes)'), tt('popup.zzz_five_more_minutes', 'zzz. Five more minutes.'), tt('popup.zz_dreaming_of_sandwiches', 'zz... dreaming of sandwiches.')]), h.x, h.y, 2600); addStat('energy', 2); }, 1250));
  curlT.push(setTimeout(() => { tempPose = null; dogTo(0, 0, 1, 1); renderDog('walk', 'left', true); }, 7000));
  curlT.push(setTimeout(() => { curling = false; renderDog(dogPoseNow(), 'right', true); }, 8000));
}
function clearCurl() { curlT.splice(0).forEach(clearTimeout); if (curling) { curling = false; if (tempPose === 'sleep' || tempPose === 'walk') tempPose = null; if (cur.mode === 'yard' && !S.sleeping) { dogTo(0, 0, 1, 0.6); renderDog(dogPoseNow(), 'right', true); } } }

/* ---- potty ---- */
function v131Fields(s) {
  s.beds = Array.isArray(s.beds) && s.beds.length ? s.beds : ['Old Blanket'];
  if (!s.bed || !s.beds.includes(s.bed)) s.bed = s.beds[0];
  const gm = s.gameMin || 0;
  s.potty = s.potty || { poopDue: null, peeDue: null, nextPee: gm + RINT(240, 360), lastOut: gm, scooped: 0, accidents: 0 };
  s.messes = s.messes || {};
}
const POOP_FB = (fresh) => `<svg viewBox="0 0 60 50"><path d="M12 45 Q6 37 17 34 Q12 26 23 24 Q20 15 31 12 Q35 18 37 24 Q48 25 44 34 Q55 37 48 45 Z" fill="#A9774F" stroke="#5B3D32" stroke-width="2.4" stroke-linejoin="round"/><path d="M19 34 Q30 31 41 34 M24 25 Q31 23 36 25" stroke="#5B3D32" stroke-width="1.5" fill="none" opacity=".55"/><path d="M30 14 Q33 11 31 7" stroke="#5B3D32" stroke-width="2" fill="none" stroke-linecap="round"/>${fresh ? '' : '<path d="M14 18 q-4 -4 0 -8 q4 -4 0 -8 M46 18 q-4 -4 0 -8 q4 -4 0 -8" stroke="#8FB36A" stroke-width="2" fill="none" stroke-linecap="round"/>'}</svg>`;
const PEE_FB = `<svg viewBox="0 0 100 30"><path d="M8 17 Q10 6 34 7 Q52 2 70 7 Q94 8 92 18 Q90 27 62 25 Q44 29 28 25 Q6 26 8 17Z" fill="#F6E7A0" fill-opacity=".85" stroke="#C9B25A" stroke-width="1.8"/><path d="M30 12 Q40 9 50 11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/></svg>`;
const FLIES_FB = `<svg viewBox="0 0 60 40"><path d="M6 30 Q16 4 30 20 T54 10" fill="none" stroke="#5B3D32" stroke-width="1.4" stroke-dasharray="2 4"/><g fill="#5B3D32"><circle cx="18" cy="14" r="3"/><circle cx="44" cy="12" r="3"/></g><g fill="#FFFFFF" stroke="#5B3D32" stroke-width="1.2"><ellipse cx="15" cy="9" rx="4" ry="2.6"/><ellipse cx="21" cy="9" rx="4" ry="2.6"/><ellipse cx="41" cy="7" rx="4" ry="2.6"/><ellipse cx="47" cy="7" rx="4" ry="2.6"/></g></svg>`;
const BAG_FB = '<path d="M-10 -6 L-12 16 Q0 20 12 16 L10 -6 Z" fill="#8CCB8A" stroke="#5B3D32" stroke-width="2.2"/><path d="M-10 -6 L-6 -14 M10 -6 L6 -14" stroke="#5B3D32" stroke-width="2.2"/><circle cx="0" cy="6" r="3" fill="#5B3D32"/>';
const SPRAY_FB = '<rect x="-7" y="-8" width="14" height="24" rx="4" fill="#BFE3F5" stroke="#5B3D32" stroke-width="2.2"/><rect x="-4" y="-15" width="8" height="7" fill="#F28FA5" stroke="#5B3D32" stroke-width="2"/><path d="M6 -13 Q14 -16 18 -12 M14 -8 l4 -2 M14 -4 l5 0" stroke="#6FB7E0" stroke-width="2" fill="none" stroke-linecap="round"/>';
const messArt = (t, fresh) => t === 'poop' ? (artReal('prop', 'poop', { fresh }) || POOP_FB(fresh)) : (artReal('prop', 'pee') || PEE_FB);
const messStale = (m) => S.gameMin - m.at >= 15;
/* v1.5: S.messes[place] is an array (cap 1, or 2 when 2+ dogs live there); each mess remembers its dog */
const messesHere = () => { let a = S.messes[S.place]; if (a && !Array.isArray(a)) a = S.messes[S.place] = [a]; return a || (S.messes[S.place] = []); };
const messCap = () => (S.dogs && S.dogs.length >= 2 ? 2 : 1);
function drawMess() {
  const g = $('#messG'); if (!g) return; const ms = messesHere();
  const k = ms.map((m) => m.type + messStale(m) + m.x).join('|'); if (g.dataset.k === k) return; g.dataset.k = k;
  g.innerHTML = ms.map((m, i) => { const stale = messStale(m); const body = m.type === 'poop' ? place(messArt('poop', !stale), m.x - 30, 506, 60, 50) : place(messArt('pee'), m.x - 55, 530, 110, 33);
    return `<g class="hot mess" data-mi="${i}" tabindex="0" role="button" aria-label="${m.type === 'poop' ? tt('popup.poop_click_to_pick_it', 'Poop: click to pick it up with a poop bag') : tt('popup.pee_puddle_click_to_flush', 'Pee puddle: click to flush it with the water bottle')}"><rect x="${m.x - 60}" y="488" width="120" height="92" fill="transparent"/>${body}${stale ? `<g class="flies">${place(artReal('prop', 'flies') || FLIES_FB, m.x - 30, 456, 60, 40)}</g>` : ''}</g>`; }).join('');
}
function bindMess() {
  const g = $('#messG'); if (!g) return;
  g.onclick = (e) => { const el = e.target.closest('[data-mi]'); if (el) cleanMess(+el.dataset.mi); };
  g.onkeydown = (e) => { const el = e.target.closest('[data-mi]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); cleanMess(+el.dataset.mi); } };
  drawMess();
}
function cleanMess(i = 0) {
  const ms = messesHere(), m = ms[i]; if (!m || cur.mode !== 'yard') return;
  const pub = !atHome(), tool = m.type === 'poop' ? iconOr('poop-bag', BAG_FB) : iconOr('water-spray', SPRAY_FB);
  const fx = $('#fx'); if (fx) { fx.insertAdjacentHTML('beforeend', `<g class="popfx">${place(tool, m.x - 32, 450, 64, 64)}</g>`); if (m.type === 'pee') fx.insertAdjacentHTML('beforeend', `<g class="popfx">${place(art('prop', 'bubbles'), m.x - 40, 505, 80, 60)}</g><g class="popfx"><svg x="${m.x + 20}" y="470" width="40" height="40" viewBox="-20 -20 40 40" overflow="visible">${doodle('spark', 0, 0, 0.9)}</svg></g>`); setTimeout(() => { [...fx.querySelectorAll('.popfx')].forEach((n) => n.remove()); }, 1100); }
  m.type === 'poop' ? SFX.boop(560) : SFX.splash(); setTimeout(() => SFX.boop(820), 220);
  ms.splice(i, 1); const owner = (m.dog && dogById(m.dog)) || D(); owner.potty.scooped++; trackAct('scoop', { type: m.type });
  let msg;
  if (pub) { const b = addBond(2), c = addCoins(3); msg = tt('popup.good_citizen', '{type, select, poop {Good citizen! Scooped with a poop bag and binned. +{bond} Bond, +{coins, plural, one {# coin} other {# coins}}.} other {Good citizen! Flushed away with the water bottle. +{bond} Bond, +{coins, plural, one {# coin} other {# coins}}.}}', { type: m.type, bond: b, coins: c }); }
  else { const b = addBond(1); msg = m.type === 'poop' ? tt('popup.scooped_watches_you_with_deep', 'Scooped. {name} watches you with deep respect. +{bond} Bond.', { name: NAME(), bond: b }) : tt('popup.flushed_with_the_water_bottle', 'Flushed with the water bottle. Sparkly floor! +{bond} Bond.', { bond: b }); }
  toast(msg, 'good'); drawMess(); markDirty(); updateHUD();
}
let pottyBusy = false, pottyT = [], lastPottyMin = -1;
function pottyAfter(kind) { const P = S.potty, now = S.gameMin; if (kind === 'meal') { if (P.poopDue == null) P.poopDue = now + RINT(30, 90); } else if (kind === 'water') { if (P.peeDue == null) P.peeDue = now + RINT(20, 60); } markDirty(); }
function pottyWalked() { const P = S.potty; if (!P) return; P.poopDue = null; P.peeDue = null; P.nextPee = S.gameMin + RINT(240, 360); P.lastOut = S.gameMin; markDirty(); }
function pottyDue(d) {
  const P = d.potty, now = S.gameMin;
  const type = P.poopDue != null && now >= P.poopDue ? 'poop' : P.peeDue != null && now >= P.peeDue ? 'pee' : null;
  if (!type) return null;
  if (S.place === 'house') { const due = type === 'poop' ? P.poopDue : P.peeDue; if (now - due < 60 || now - P.lastOut < 120) return null; }
  return type;
}
function pottyTick() {
  if (!S || !S.dogs) return; const now = S.gameMin;
  if (Math.floor(now) === lastPottyMin) return; lastPottyMin = Math.floor(now);
  S.dogs.forEach((d) => { const P = d.potty; const walker = cur.mode === 'walk' && d.id === S.activeId; if (S.place !== 'house' || walker) P.lastOut = now; if (P.peeDue == null && now >= P.nextPee) P.peeDue = now; });
  const ms = messesHere();
  if (cur.mode === 'yard') ms.forEach((m) => {
    if (!messStale(m)) return; drawMess();
    if (now - (m.drainAt || m.at + 15) >= 10) { m.drainAt = now; addStat('clean', -1); if (atHome()) addStat('happy', -1); markDirty(); }
    if (!atHome() && !m.nagged && now - m.at >= 25) { m.nagged = true; toast(tt('popup.a_passer_by_mutters_somebody', `A passer-by mutters: "Somebody didn't scoop!"`), 'bad'); markDirty(); }
  });
  if (cur.mode !== 'yard' || busy || curling || TRN || pottyBusy || !modal.hidden || popOpen() || ms.length >= messCap()) return;
  if (!S.sleeping) { const t = pottyDue(D()); if (t) { doPotty(t); return; } }
  const o = others().find((d) => !d.sleeping && pottyDue(d)); if (o) packPotty(o, pottyDue(o));
}
function messLine(d, type, indoor) {
  const n = d.name, sex = d.sex === 'female' ? 'female' : 'male';
  if (indoor) return tt('popup.oops_had_an_accident_indoors', "{sex, select, female {Oops. {n} had an accident indoors. She looks at you like it was the rug's idea. (More trips outside help.)} other {Oops. {n} had an accident indoors. He looks at you like it was the rug's idea. (More trips outside help.)}}", { sex, n });
  const pl = breedLine(POTTY_LINES, d); if (pl && Math.random() < 0.4) return pl;
  return type === 'poop' ? PICK([tt('popup.has_made_a_contribution', '{n} has made a contribution.', { n }), tt('popup.did_business_and_looks_extremely', '{sex, select, female {{n} did her business and looks extremely proud of herself.} other {{n} did his business and looks extremely proud of himself.}}', { sex, n })]) : d.sex === 'male' ? tt('popup.lifted_a_leg_on_the', '{n} lifted a leg on the situation. He feels much better.', { n }) : tt('popup.had_a_quick_squat', '{sex, select, female {{n} had a quick squat. She feels much better.} other {{n} had a quick squat. He feels much better.}}', { sex, n });
}
function finishMess(d, type, x) {
  const P = d.potty, indoor = S.place === 'house';
  messesHere().push({ type, x, at: S.gameMin, dog: d.id });
  if (type === 'poop') P.poopDue = null; else { P.peeDue = null; P.nextPee = S.gameMin + RINT(240, 360); }
  if (indoor) { P.accidents++; d.stats.happy = clamp(d.stats.happy - 2, 0, 100); }
  toast(messLine(d, type, indoor) + (indoor ? '' : ' ' + tt('popup.click_it_to_clean_up', 'Click it to clean up.')), indoor ? 'bad' : ''); drawMess(); markDirty();
}
function freeMessX(lo, hi) { const used = messesHere().map((m) => m.x); for (let t = 0; t < 12; t++) { const x = RINT(lo, hi); if (used.every((u) => Math.abs(u - x) > 90)) return x; } return RINT(lo, hi); }
function packPotty(d, type) {
  if (!type) return; const i = others().indexOf(d), spot = packSpots()[i]; if (!spot) return;
  packPose[d.id] = type === 'pee' && d.sex === 'male' ? 'leglift' : 'squat'; redrawPackDog(d);
  pottyBusy = true;
  pottyT.push(setTimeout(() => { packPose[d.id] = 'idle'; redrawPackDog(d); finishMess(d, type, clamp(spot[0] + (spot[2] === 'right' ? -70 : 70), 90, 910)); pottyBusy = false; }, 1600));
}
function doPotty(type) {
  if (cur.mode !== 'yard' || busy || pottyBusy || S.sleeping) return false;
  clearCurl();
  if (messesHere().length >= messCap()) { nope(messCap() > 1 ? tt('popup.two_messes_here_already_clean', 'Two messes here already. Clean one first!') : tt('popup.one_mess_per_place_is', 'One mess per place is plenty. Clean that one first!')); return false; }
  const d = D(), indoor = S.place === 'house', male = d.sex === 'male';
  const pose = type === 'pee' && male ? 'leglift' : 'squat';
  const realPose = art('dog', d.key, { pose }).includes('pa-pose-' + pose);
  pottyBusy = true; busy = true; hideBubble();
  const x = indoor ? freeMessX(340, 470) : freeMessX(480, 600), tx = x + 80 - 430;
  dogTo(tx, 22, 1, 0.9); renderDog('walk', 'right');
  pottyT.push(setTimeout(() => { renderDog(pose, 'right', true); const fx = $('#dogFx'); if (fx && !realPose) fx.classList.add('tk-dip'); const h = dogHeadWorld(); say('…', h.x, h.y, 1200); }, 950));
  pottyT.push(setTimeout(() => {
    const fx = $('#dogFx'); if (fx) fx.classList.remove('tk-dip');
    finishMess(d, type, x); const h = dogHeadWorld(); say(indoor ? tt('popup.not_me_the_rug_did', 'Not me. The rug did it.') : PICK([tt('popup.ahh', 'Ahh.'), tt('popup.much_better', 'Much better.'), tt('popup.you_saw_nothing', 'You saw nothing.')]), h.x, h.y, 1800);
    dogTo(0, 0, 1, 0.9); renderDog('walk', 'left');
  }, 2500));
  pottyT.push(setTimeout(() => { pottyBusy = false; busy = false; renderDog(dogPoseNow(), 'right', true); }, 3400));
  return true;
}
function clearPotty() { pottyT.splice(0).forEach(clearTimeout); if (pottyBusy) { pottyBusy = false; busy = false; } }

/* ---- town map: just the map ---- */
function mapTipText(k) {
  const here = (S.place === 'house' ? 'yard' : S.place) === k;
  const names = { yard: tt('popup.my_yard', 'My Yard'), market: tt('popup.market_street', 'Market Street'), shelter: tt('popup.doodle_doggo_shelter', 'Doodle Doggo Shelter'), park: tt('popup.sunny_park', 'Sunny Park'), river: tt('popup.riverside', 'Riverside'), woods: tt('popup.maple_woods', 'Maple Woods'), beach: tt('popup.seashell_beach', 'Seashell Beach') };
  const nm = (PLACES[k] && k !== 'yard' ? tdata('places.' + k + '.n', PLACES[k].n) : names[k]) || k;
  if (here) return tt('popup.you_are_here', '{nm}: you are here', { nm });
  if (k === 'shelter') return tt('popup.visit_the_dogs', '{nm}: visit the dogs', { nm });
  if (PLACES[k] && topBond() < PLACES[k].bond) return tt('popup.bond_needed', '{nm}: Bond {bond}', { nm, bond: PLACES[k].bond });
  if (k === 'yard') return tt('popup.go_home', '{nm}: go home', { nm });
  if (k === 'market') return tt('popup.go_shopping', '{nm}: go shopping', { nm });
  return tt('popup.go_hang_out', '{nm}: go hang out', { nm });
}
const PIN_SVG = `<svg viewBox="0 0 40 56" aria-hidden="true"><path d="M20 54 L12 30 A14 14 0 1 1 28 30 Z" fill="#F28FA5" stroke="#5B3D32" stroke-width="2.6" stroke-linejoin="round"/><circle cx="20" cy="19" r="6" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2"/></svg>`;

