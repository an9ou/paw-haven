/* ======================= v2.7 PACK CARE lane (tag cr): Feed, Pet, Bath and Nap for every dog present, with a row of dog chips to untick some. See V27.md sections 1 and 6 =======================
   The PACK CARE lane owns this file (and css/32_pack_care.css). With crOn() false (one dog, or the harness pin prefs.crOne) every caller takes its v2.6 path:
   crFeed returns false, crPetPack returns [], crNapPack returns null, crBathGo goes straight to the v2.6 bath, crWakePack wakes nobody else. */

// pack care is on with two or more dogs. Under the test harness it is off unless a suite opts in (test_lib.js pins prefs.crOne = true, `packCare: true` lifts it)
function crOn() { return !!(S && Array.isArray(S.dogs) && S.dogs.length > 1 && !prefs.crOne); }
// the dogs present here (the active dog first, then others()), whether ticked or not
function crPresent() { return S ? [S.dog].concat(typeof others === 'function' ? others() : []) : []; }
// the ticked dogs present here (S.careOff holds the unticked ids). With pack care off: the active dog only
function crDogs() { if (!crOn()) return S ? [S.dog] : []; const l = crPresent().filter((d) => !(S.careOff && S.careOff[d.id])); return l.length ? l : [S.dog]; }
// pack care acts here: on, and at least two dogs present (a lone active dog, e.g. away from home with the puppies at home, keeps the v2.6 care)
function crPack() { return crOn() && crPresent().length > 1; }
// "Mochi", "Mochi and Pepper", "Mochi, Pepper and Bun"
function crNames(l) { return tlist(l.map((d) => d.name)); }
const crV = (l) => ({ n: l.length, names: crNames(l) }); // the vars of a message about a group of dogs: a plural on n, the names as a list
const crFN = (name) => tdata('food.' + tid(name) + '.n', name); // a food's shown name (the English name stays the key)
const crDogsN = (n) => tt('care.dogs_n', '{n, plural, one {# dog} other {# dogs}}', { n });
function crFree(d) { if (d && typeof hoFree === 'function') hoFree(d); } // v2.7 HOME: a dog using furniture comes out for dinner, the bath or bed

/* ---------------- the chip row (top of the Feed and Care trays) ---------------- */
const CR_TICK = '<svg class="cr-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.8c2 1.6 3.4 3.3 4.6 5.4 2.6-5.3 5.9-9.4 10.4-12.6" fill="none" stroke="#5B3D32" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let crQuiet = false; // a chip tap redraws its tray: no bark, keep the row's scroll
function crChipsHTML(cap) { // v2.9: cap = the line under the chips (Play and Walk say who joins in); the default is the Feed and Care line
  if (!crPack()) return '';
  const chips = crPresent().map((d) => {
    const on = !(S.careOff && S.careOff[d.id]);
    return `<button class="chip cr-chip${on ? ' on' : ''}${d.sleeping ? ' asleep' : ''}" data-crdog="${d.id}" aria-pressed="${on}" aria-label="${esc(d.sleeping ? tt('care.label_chip_asleep', '{name}, asleep', { name: d.name }) : d.name)}"><span class="cr-head" aria-hidden="true">${headSVG(d)}</span><span class="cr-name">${esc(d.name)}</span>${d.sleeping ? '<span class="cr-zz" aria-hidden="true">zz</span>' : ''}<span class="cr-box" aria-hidden="true">${on ? CR_TICK : ''}</span></button>`;
  }).join('');
  return `<div class="cr-wrap"><div class="cr-chips" role="group" aria-label="${esc(tt('care.label_who_gets', 'Who gets this'))}">${chips}</div><p class="small cr-cap">${esc(cap || tt('care.cap_default', 'Ticked dogs get fed, petted, bathed and tucked in together.'))}</p></div>`;
}
function crBindChips(root, redraw, line) {
  (root || dock).querySelectorAll('[data-crdog]').forEach((b) => { b.onclick = () => { SFX.init(); crToggle(b.dataset.crdog, redraw, line); }; });
}
// tick or untick a dog. The last ticked dog present stays ticked. Returns true when it changed
function crToggle(id, redraw, line) {
  if (!S) return false; if (!S.careOff || typeof S.careOff !== 'object') S.careOff = {};
  if (!S.careOff[id]) {
    const ticked = crPresent().filter((d) => !S.careOff[d.id]);
    if (ticked.length <= 1 && ticked.some((d) => d.id === id)) { nope(line || tt('care.last_ticked', 'Someone has to get the treat. Tick another dog first.')); return false; }
    S.careOff[id] = true;
  } else delete S.careOff[id];
  SFX.click(); markDirty();
  if (redraw) { const row = dock.querySelector('.cr-chips'), sx = row ? row.scrollLeft : 0; crQuiet = true; try { redraw(); } finally { crQuiet = false; } const r2 = dock.querySelector('.cr-chips'); if (r2) r2.scrollLeft = sx; }
  return true;
}

/* ---------------- Feed ---------------- */
// the v2.6 effects of one portion for the ACTIVE dog (S.dog), moved out of feed() unchanged. PACK CARE runs it for each fed dog under withDog(d).
// o.bfast: the breakfast bonus was still open when the pack meal began (every dog at that meal gets it)
function crEatFx(name, f, o) {
  pottyAfter(name === 'Fresh Water' ? 'water' : isMeal(name) ? 'meal' : 'snack');
  let happy = f.happy || 0;
  if (isFavFood(name)) happy = Math.round(happy * 1.5) + (happy ? 0 : 5);
  if (S.dog.key === 'corgi' && name !== 'Fresh Water') happy += 5;
  if (name === 'Pupcake' && S.outfit.head === 'Party Hat') happy = Math.round(happy * 1.5);
  const feeder = owns('toys', 'Puzzle Feeder') && name !== 'Fresh Water';
  if (feeder) happy += 10;
  if (S.place === 'river' && name !== 'Fresh Water') happy += 5;
  let extraMsg = '';
  const pb = pupBonus(D(), f); if (pb) { happy += pb; extraMsg += ' ' + tt('care.pup_bites', 'Puppy-sized bites: +{n} Happiness.', { n: pb }); }
  if (name !== 'Fresh Water') extraMsg += eatForLine(D());
  if (name === 'Fresh Water' && isHot()) { happy += 5; addStat('energy', 10); extraMsg += ' ' + tt('care.hot_water', 'So refreshing on a hot day! Extra Energy.'); }
  const perk = shFeedPerk(name, f); if (perk.happy) { happy += perk.happy; extraMsg += perk.msg; } // v2.4: Chef Hat on meals, Bumblebee Suit on snacks
  if (name !== 'Fresh Water' && timePhase() === 'dawn') { dailyCheck(); if (!S.daily.breakfast || (o && o.bfast)) { S.daily.breakfast = true; happy += 5; addBond(3); extraMsg += ' ' + tt('care.breakfast', 'Breakfast bonus!'); } }
  addStat('hunger', f.hunger || 0); addStat('happy', happy); addStat('energy', f.energy || 0); addStat('clean', f.clean || 0);
  let bp = name === 'Fresh Water' ? 0 : 2 + (f.bond || 0); if (feeder) bp *= 2;
  if (name === 'Pupcake') S.pupUntil = S.gameMin + shPupMins(); // v2.4: the Happi Coat makes it 2 game hours
  if (f.cool) { S.coolUntil = S.gameMin + f.cool; extraMsg += ' ' + tt('care.cool', 'Cool as a cucumber for 1 game hour.'); }
  if (f.warm) { S.warmUntil = S.gameMin + f.warm; extraMsg += ' ' + tt('care.warm', 'Warm paws for 1 game hour.'); } // v2.5: Warm Bone Broth (isWarm honours S.warmUntil) // v2.4: Frozen Pupsicle (isHot honours S.coolUntil)
  if (f.golden) { S.glowUntil = S.gameMin + 1440; addStat('happy', 80 - Math.min(80, S.stats.happy)); bp = 20; }
  const got = bp ? addBond(bp) : 0;
  return { got, extraMsg };
}
// the Pupcake (one a day) and the Golden Bone go to the active dog only: a line in its v2.6 toast says so
const crSolo = (name, f) => name === 'Pupcake' || !!(f && f.golden);
function crSoloLine(name, f) { return crPack() && crSolo(name, f) ? ' ' + (name === 'Pupcake' ? tt('care.solo_pupcake', 'Pupcakes are for one dog at a time, so {name} got this one.', { name: NAME() }) : tt('care.solo_golden', 'The Golden Bone is for one dog at a time, so {name} got this one.', { name: NAME() })) : ''; }
// a food card tap (or a drop on the bowl) with pack care: every ticked dog present gets one portion, in chip order, while portions last.
// Returns false when the v2.6 path in feed() should run instead (pack care off, the active dog alone, a Pupcake or Golden Bone, a meal away from home)
function crFeed(name, f) {
  if (!crPack() || crSolo(name, f) || (!atHome() && isMeal(name))) return false;
  const tick = crDogs(); if (tick.length === 1 && tick[0] === S.dog) return false;
  const water = name === 'Fresh Water', asleep = tick.filter((d) => d.sleeping), awake = tick.filter((d) => !d.sleeping);
  if (!awake.length) { nope(tt('care.asleep_wake', '{n, plural, one {{names} is asleep. Wake {names} from the Care menu first.} other {{names} are asleep. Wake them from the Care menu first.}}', crV(asleep))); return true; }
  if (S.place === 'pier' && !water && Math.random() < 0.2) { popDown(); SFX.honk(); toast(tt('care.seagull', 'A seagull took the {food}! Rude. (Snack refunded: Pip has a deal with the gulls.)', { food: crFN(name) }), 'bad'); return true; }
  let full = [], short = [], fed = awake;
  if (water) {
    if (S.gameMin - S.waterAt < shWaterWait()) { nope(tt('care.water_wait', "The water bowl is refilling. Water takes time. That's science.")); return true; }
  } else {
    const have = S.inv.food[name] || 0; if (have <= 0) { nope(tt('care.none_left', 'You have none of that. Kibble Corner has some.')); return true; }
    if (f.hunger > 0) { full = awake.filter((d) => d.stats.hunger > 90); fed = awake.filter((d) => d.stats.hunger <= 90); }
    if (!fed.length) { nope(tt('care.all_full', '{n, plural, one {{names} is full. {sex, select, female {She has} other {He has}} never said that before. (Food not used.)} other {{names} are full. They have never said that before. (Food not used.)}}', Object.assign(crV(full), { sex: full[0].sex }))); if (full.includes(S.dog)) setTemp('happy', 1200); return true; }
    short = fed.slice(have); fed = fed.slice(0, have);
  }
  if (water) S.waterAt = S.gameMin; // one refill serves the pack
  else { S.inv.food[name] -= fed.length; if (S.inv.food[name] <= 0) delete S.inv.food[name]; }
  const me = fed.includes(S.dog), pack = fed.filter((d) => d !== S.dog), bfast = (dailyCheck(), !S.daily.breakfast);
  fed.forEach(crFree);
  busy = true; hideBubble(); markDirty(); popDown(); clearCurl();
  if (!water && fed.some((d) => d.key === 'corgi')) barkDog(fed.find((d) => d.key === 'corgi'), 'yip', {});
  if (me) { S.bowl = name; setBowl(name); dogTo(-125, 0, 1, 0.8); renderDog('walk', 'left'); setTimeout(() => { renderDog('eat', 'left'); }, 850); } else setTemp('happy', 2400);
  setTimeout(() => { water ? SFX.slurp() : SFX.crunch(); }, 850); if (!water) { setTimeout(SFX.crunch, 1150); setTimeout(SFX.crunch, 1500); }
  const hold = () => { const t = performance.now() + 2600; pack.forEach((d) => { packNext[d.id] = Math.max(packNext[d.id] || 0, t); }); };
  setTimeout(() => { if (cur.mode !== 'yard') return; hold(); fbPackBowls(pack, name); pack.forEach((d) => { packPose[d.id] = 'eat'; redrawPackDog(d); }); }, 500);
  setTimeout(() => {
    if (me) { S.bowl = null; setBowl(null); }
    fbPackBowls([], null);
    const res = fed.map((d) => ({ d, r: withDog(d, () => crEatFx(name, f, { bfast })) }));
    pack.forEach((d) => { packPose[d.id] = 'happy'; if (cur.mode === 'yard') redrawPackDog(d); });
    const msg = water ? tt('care.lap_it_up', '{names} lap it up. Most of it went on the floor.', { names: crNames(fed) }) : fed.length === 1 ? PICK([tt('care.eats_it_up', '{sex, select, female {{name} eats it up. Her tail approves.} other {{name} eats it up. His tail approves.}}', { name: fed[0].name, sex: fed[0].sex }), tt('care.gone', 'Gone. {name} is now looking at the bowl for more.', { name: fed[0].name })]) : PICK([tt('care.crunch_harmony', '{names} crunch in harmony.', { names: crNames(fed) }), tt('care.symphony', 'A symphony of crunching from {names}.', { names: crNames(fed) }), tt('care.side_by_side', '{names} eat side by side. Nobody checks the other bowls. Much.', { names: crNames(fed) })]);
    const favs = fed.filter((d) => d.favFood.includes(name)), gots = res.map((x) => x.r.got), same = gots.every((g) => g === gots[0]);
    const bond = !gots[0] && same ? '' : same ? ' ' + tt('care.bond_same', '{multi, select, yes {+{n} Bond each.} other {+{n} Bond.}}', { multi: fed.length > 1 ? 'yes' : 'no', n: gots[0] }) : ' ' + tt('care.bond_list', 'Bond: {list}.', { list: tlist(res.filter((x) => x.r.got).map((x) => tt('care.name_plus', '{name} +{n}', { name: x.d.name, n: x.r.got }))) });
    const extra = [...new Set(res.map((x) => x.r.extraMsg).join('').split(/(?<=[.!])\s+|(?<=[。！？])\s*/).map((t) => t.trim()).filter(Boolean))].map((t) => ' ' + t).join('');
    const skip = (full.length ? ' ' + tt('care.full', '{n, plural, one {{names} is full.} other {{names} are full.}}', crV(full)) : '') + (asleep.length ? ' ' + tt('care.asleep', '{n, plural, one {{names} is asleep.} other {{names} are asleep.}}', crV(asleep)) : '') + (short.length ? ' ' + tt('care.not_enough', 'Not enough {food} for {names}.', { food: crFN(name), names: crNames(short) }) : '');
    toast(`${msg}${favs.length ? ' ' + tt('care.fav_food', 'Favourite food for {names}!', { names: crNames(favs) }) : ''}${bond}${S.place === 'river' && !water ? ' ' + tt('care.riverside', 'Riverside picnic: +5 Happiness.') : ''}${extra}${skip}`, 'good');
    if (!water) { dailyCare('feed'); markCareDay(); }
    trackAct(water ? 'water' : 'feed', { name, dogs: fed.length, ids: fed.map((d) => d.id) }); // v2.13: ids, the dogs that ate (41_expressions.js)
    if (f.tip) setTimeout(() => shFoodTip(name), 900);
    if (me) { setTemp('happy', 1600); dogTo(0, 0, 1, 0.8); }
    updateHUD(); markDirty();
    setTimeout(() => { busy = false; if (cur.mode === 'yard') renderDog(dogPoseNow()); }, 900);
  }, 2300);
  return true;
}

/* ---------------- Pet ---------------- */
// each pack dog's own petting session (the active dog keeps the v2.6 `pet` object): gain toward the 20 soft cap, its +3 Bond once a session
let crPetS = {}, crPetSleepT = 0;
function crPetReset() { crPetS = {}; }
// [x, y] over a pack dog's head, where it stands now (v2.10 ROAM)
function crPackHead(d) { if (others().indexOf(d) < 0) return null; const h = rmHead(d); return [h.x, h.y + 24 * rmK(rmSt(d))]; }
// v2.10 ROAM: petting pets the touched dog only (V210.md section 1), so the v2.8.4 whole-pack rub is gone: the active dog's pet gives the others nothing
function crPetPack() { return []; }
// pet a pack dog where it stands, no switching (with or without pack care). The dog touched is ticked back in if it was unticked. Its own petting
// session: hearts, Happiness up to the soft cap, +3 Bond once a session (one toast), and the daily care bonus on the first good petting of any dog
function crPetAt(d, wx, wy) {
  if (!d) return;
  if (d === S.dog) { petTick(wx, wy); return; }
  if (d.sleeping) { barkDog(d, 'huff', { player: true, volume: 0.6 }); if (performance.now() - crPetSleepT > 2500) { crPetSleepT = performance.now(); toast(tt('care.shh', 'Shh. {name} is asleep.', { name: d.name })); } return; }
  if (S.careOff && S.careOff[d.id]) { delete S.careOff[d.id]; markDirty(); }
  const now = performance.now(), s = crPetS[d.id] || (crPetS[d.id] = { gain: 0, bonded: false, at: 0, start: now, capped: false });
  if (now - (s.start || 0) > 120000) Object.assign(s, { gain: 0, bonded: false, start: now, capped: false });
  let g = 1.5 * (withDog(d, () => favAct('petting')) ? 1.5 : 1);
  if (s.gain >= 20) { g *= 0.25; if (!s.capped) { s.capped = true; toast(tt('care.petted_100', '{name} is 100% petted. More petting is now a luxury.', { name: d.name })); } }
  s.gain += g; withDog(d, () => addStat('happy', g));
  fxText('♥', wx + RAND(-20, 20), wy - 10); Math.random() < 0.7 ? SFX.squeak() : SFX.boop(RAND(500, 800));
  if (now - s.at > 900 && cur.mode === 'yard') {
    s.at = now; crFree(d); packNext[d.id] = Math.max(packNext[d.id] || 0, now + 1100); packPose[d.id] = 'pet'; exTrig(d, 'pet', { pose: 'pet', draw: false }); rmPaint(d);
    setTimeout(() => { if (packPose[d.id] === 'pet') { packPose[d.id] = 'happy'; if (cur.mode === 'yard' && !d.sleeping) rmPaint(d); } }, 900);
  }
  rmPetted(d);
  if (!s.bonded && s.gain >= 10) { s.bonded = true; crPetBond([d], true); dailyCare('pet'); markCareDay(); trackAct('pet', { ids: [d.id] }); } // v2.17: ids, the dog that was petted (its daily wish)
  else updateHUD();
}
// the rub (mouse hover-rub or touch drag) and tap on a pack dog, like the active dog's #dogHit (03_yard.js). The rub state is shared (crRub), because a
// petted pack dog is redrawn (redrawPackDog replaces its element and binds the new one) in the middle of a touch rub
const crRub = { id: null, down: false, last: null, moved: 0, dist: 0 };
function crPetBind(el) {
  const svg = el.ownerSVGElement, id = el.dataset.dog, at = (e) => { const w = toWorld(svg, e.clientX, e.clientY); crPetAt(dogById(id), w.x, w.y); };
  el.classList.add('cr-pet'); // the phone camera pan leaves a rub on this dog alone (phCamPan, 03_yard.js)
  el.addEventListener('pointerdown', (e) => { SFX.init(); Object.assign(crRub, { id, down: true, moved: 0, last: { x: e.clientX, y: e.clientY } }); try { el.setPointerCapture(e.pointerId); } catch (er) { /* capture unsupported */ } });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && !(crRub.down && crRub.id === id)) return;
    if (crRub.id !== id || !crRub.last) { Object.assign(crRub, { id, last: { x: e.clientX, y: e.clientY } }); return; }
    const m = Math.hypot(e.clientX - crRub.last.x, e.clientY - crRub.last.y); crRub.last = { x: e.clientX, y: e.clientY }; crRub.moved += m; crRub.dist += m;
    if (crRub.dist > 70) { crRub.dist = 0; at(e); }
  });
  el.addEventListener('pointerup', (e) => { if (crRub.down && crRub.id === id && crRub.moved < 8 && !pkHeld()) { at(e); at(e); } crRub.down = false; }); // v2.9: a long press opened the dog card, so no pet on release
  el.addEventListener('pointerleave', () => { if (!crRub.down) crRub.last = null; });
  el.addEventListener('pointercancel', () => { crRub.down = false; crRub.last = null; });
  el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const r = el.getBBox(); crPetAt(dogById(id), r.x + r.width / 2, r.y + r.height / 3); } };
  pkHold(el, dogById(id)); // v2.9: a long press (about 0.6 s) opens the dog card: Make leader, Dress, Train. A tap keeps petting
}
// the Bond for the pack, one toast. later: pack dogs whose Bond came after the active dog's (it had its own toast, the act and the care bonus already)
function crPetBond(due, later) {
  const got = [];
  if (!later) { const n = addBond(3) + (S.outfit.head === 'Wizard Hat' ? addBond(1, { raw: true }) : 0), st = S.outfit.charm === 'Sparkle Stone'; if (st) addStat('happy', 5); got.push({ d: S.dog, n, hat: S.outfit.head === 'Wizard Hat', st }); }
  due.forEach((d) => { crPetS[d.id].bonded = true; got.push(withDog(d, () => { const hat = S.outfit.head === 'Wizard Hat', n = addBond(3) + (hat ? addBond(1, { raw: true }) : 0), st = S.outfit.charm === 'Sparkle Stone'; if (st) addStat('happy', 5); return { d, n, hat, st }; })); });
  const ns = got.map((x) => x.n), same = ns.every((n) => n === ns[0]), all = got.map((x) => x.d);
  const bond = same ? tt('care.bond_same', '{multi, select, yes {+{n} Bond each.} other {+{n} Bond.}}', { multi: got.length > 1 ? 'yes' : 'no', n: ns[0] }) : tt('care.bond_list', 'Bond: {list}.', { list: tlist(got.map((x) => tt('care.name_plus', '{name} +{n}', { name: x.d.name, n: x.n }))) });
  toast(`${bond}${got.some((x) => x.hat) ? ' ' + tt('care.magic_hands', 'Magic hands: +1 Bond.') : ''}${got.some((x) => x.st) ? ' ' + tt('care.sparkle_hums', 'The Sparkle Stone hums: +5 Happiness.') : ''} ${got.length > 1 ? tt('care.pretend_many', '{names} pretend they did not enjoy that.', { names: crNames(all) }) : tt('care.pretend_one', '{sex, select, female {{name} pretends she did not enjoy that.} other {{name} pretends he did not enjoy that.}}', { name: all[0].name, sex: all[0].sex })}`, 'good');
  if (!later) { dailyCare('pet'); markCareDay(); trackAct('pet', { dogs: got.length, ids: got.map((x) => x.d.id) }); }
  updateHUD();
}

/* ---------------- Nap ---------------- */
// Nap with pack care: every ticked dog present under 99 Energy naps. Returns null (the v2.6 nap, pack care off or nobody else to tuck in),
// { n, pack } (the active dog naps too: startSleep carries on and calls crNapToast), or { done: true } (handled here: only pack dogs nap, or nobody is tired)
function crNapPack() {
  if (!crPack()) return null;
  const tick = crDogs(), me = tick.includes(S.dog), pack = tick.filter((d) => d !== S.dog && !d.sleeping && d.stats.energy < 99);
  if (!pack.length) { if (me) return null; nope(tt('care.nobody_tired', 'Nobody ticked is tired. They are all vibrating.')); return { done: true }; }
  pack.forEach((d) => { crFree(d); d.sleeping = true; delete packPose[d.id]; redrawPackDog(d); });
  markDirty();
  if (me && S.stats.energy < 99) return { n: 1 + pack.length, pack };
  trackAct('nap', { dogs: pack.length, ids: pack.map((d) => d.id) }); crNapToast({ n: pack.length, pack, solo: true }); popDown(); if (cur.mode === 'yard' && !S.sleeping) dockIdle();
  return { done: true };
}
function crNapToast(c) {
  const l = c.solo ? c.pack : [S.dog].concat(c.pack);
  if (S.place === 'house') { // HOME puts each dog on its own bed, or on the rug when there are fewer beds than dogs
    const b = bedInfo(), bed = typeof hoBedFor === 'function' ? l.filter((d) => hoBedFor(d)) : l, rug = l.filter((d) => !bed.includes(d)), bonus = ' ' + (b.bonus ? tt('care.indoor_bed', 'Indoor naps: +25%, bed +{bonus}%.', { bonus: Math.round(b.bonus * 100) }) : tt('care.indoor', 'Indoor naps: +25%.'));
    const onBed = bed.length ? (bed.length === 1 ? tt('care.curl_one', '{sex, select, female {{name} curls up on her bed.} other {{name} curls up on his bed.}}', { name: bed[0].name, sex: bed[0].sex }) : tt('care.curl_many', '{names} curl up on their beds.', { names: crNames(bed) })) : '';
    toast(`${onBed}${rug.length ? `${onBed ? ' ' : ''}${tt('care.rug', '{n, plural, one {{names} naps on the rug.} other {{names} nap on the rug.}}', crV(rug))}` : ''}${bonus}`); return;
  }
  toast(`${tt('care.climb_in', '{n, plural, one {{names} climbs into the {house}.} other {{names} pile into the {house}.}}', Object.assign(crV(l), { house: tdata('houses.' + tid(S.house) + '.n', S.house) }))}${weatherNow() === 'rain' ? ' ' + tt('care.rain_nap', 'Rain on the roof: the best nap sound (+20% nap).') : isNight() ? ' ' + tt('care.night_nap', 'Night naps restore more (+40%).') : ' ' + tt('care.goodnight', 'Goodnight.')}`);
}
// the nap tray's extra line: who else is napping
function crNapLine() { if (!crOn()) return ''; const zz = others().filter((d) => d.sleeping); return zz.length ? ' ' + tt('care.nap_too', '{n, plural, one {{names} naps too.} other {{names} nap too.}}', crV(zz)) : ''; }
// Wake up (the player's button) wakes every napping dog present. Returns the pack dogs woken
function crWakePack() {
  if (!crOn()) return [];
  const zz = others().filter((d) => d.sleeping);
  zz.forEach((d) => { d.sleeping = false; packPose[d.id] = 'happy'; packNext[d.id] = performance.now() + 1500; if (cur.mode === 'yard') redrawPackDog(d); });
  if (zz.length) markDirty(); return zz;
}

/* ---------------- Bath (the queue; the scrubbing itself is 04_bath.js) ---------------- */
// crBath while a pack bath runs: { q: [dog ids], i: index of the dog in the tub, orig: the active dog before, fin: baths finished, next: switching to the next dog }
let crBath = null;
function crBathGo() {
  if (!crPack()) { go('bath'); return; }
  const tick = crDogs(), zz = tick.filter((d) => d.sleeping), shiny = tick.filter((d) => !d.sleeping && d.stats.clean >= 95), q = tick.filter((d) => !d.sleeping && d.stats.clean < 95);
  const why = ((zz.length ? ' ' + tt('care.asleep', '{n, plural, one {{names} is asleep.} other {{names} are asleep.}}', crV(zz)) : '') + (shiny.length ? ' ' + tt('care.sparkling', '{n, plural, one {{names} is already sparkling.} other {{names} are already sparkling.}}', crV(shiny)) : '')).trim();
  if (!q.length) { nope(`${why} ${tt('care.bath_wait', 'Bath time can wait.')}`); return; }
  if (why) toast(why);
  if (q.length === 1 && q[0] === S.dog) { go('bath'); return; } // just the active dog: the v2.6 bath
  q.forEach(crFree);
  crBath = { q: q.map((d) => d.id), i: 0, orig: S.activeId, fin: 0, next: false };
  crBathSwap(q[0].id); go('bath');
}
function crBathSwap(id) { if (!dogById(id) || S.activeId === id) return; S.activeId = id; hudDogKey = ''; dogKey = ''; markDirty(); }
// on to the next dog in the queue, or the end of the queue
function crBathNext() {
  const b = crBath; if (!b) { go('yard'); return; }
  while (b.i + 1 < b.q.length) { b.i++; if (dogById(b.q[b.i])) { b.next = true; crBathSwap(b.q[b.i]); go('bath'); b.next = false; return; } }
  go('yard');
}
// the queue ends (Done for now, the last dog, or leaving the bath any other way): the original active dog is back, one act for the baths finished
function crBathEnd() {
  const b = crBath; if (!b) return; crBath = null;
  crBathSwap(b.orig);
  if (b.fin) trackAct('bath', { dogs: b.fin, ids: b.q.slice(0, b.fin) }); // v2.17: ids, the dogs bathed (in queue order)
}
const crBathTitle = () => (crBath ? ` <span class="cr-n">${esc(tt('care.bath_n', '({i} of {n})', { i: crBath.i + 1, n: crBath.q.length }))}</span>` : '');

function crExpose() {
  if (!window.__paw) return;
  window.__paw.cr = { on: () => crOn(), dogs: () => crDogs().map((d) => d.id), present: () => crPresent().map((d) => d.id), toggle: (id) => crToggle(id, cur.mode === 'yard' && dock.querySelector('.cr-chips') ? (dock.querySelector('[data-care]') ? openCareTray : openFeedTray) : null),
    feed: (name) => feed(name), petAll: (n) => { for (let i = 0; i < (n || 1); i++) petTick(560, 380); }, get bathQueue() { return crBath ? { q: crBath.q.slice(), i: crBath.i, orig: crBath.orig, fin: crBath.fin } : null; } };
}
on('game:ready', () => setTimeout(crExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.cr) crExpose(); });
setTimeout(crExpose, 0);
