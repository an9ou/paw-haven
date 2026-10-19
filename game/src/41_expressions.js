/* ======================= v2.13 FACES & FEELINGS: face expressions in play (V213.md section 4, EX lane, tag ex, test hook __paw.ex) =======================
   The art draws fourteen faces over any awake pose: PawArt.dog(key, { pose, expr }), PawArt.EXPR_LIST, PawArt.exprOk(name, pose) (dogs/pawart_dogs.js).
   This file decides when a dog makes a face. No save fields: a face is a moment (photo mode keeps its picker choice in prefs.phFace).
   API
     exOn()               faces in play now (the art has them; under the test harness only with prefs.exTest, so the older suites see none)
     exShow(d, name, ms)  dog d shows `name` for ms (default EX_MS[name], 2.2 to 3.4 s), then its normal face. One face at a time per dog (a player's
                          moment may replace an idle roam face, never the other way), a short cooldown after each. Only that dog's art is drawn again.
     exNow(d, pose)       the face dog d shows on `pose` now (the photo face while photo mode is open, else its live face), or null when none or
                          when the art says that face does not go on that pose. The surfaces that show faces pass { expr: exNow(d, pose) } to dogSVG.
     exTrig(d, event, o)  picks a face for a play event (EX_EV weights x the breed's trait x its favourite faces) and shows it. o: { pose (the pose the
                          face is picked for), ms, draw: false (the caller draws the dog straight after) }. Returns the face or null.
   Where the faces come from (hooks elsewhere are one line each)
     roam    37_roam.js rmTick -> exRoamTick: a dog that stands or sniffs, now and then (the rate follows its energy and attention), at most one
             new roam face a second in the scene
     pet     37_roam.js rmPetted (the leader's petTick and a pack dog's crPetAt both land there)
     feed / treat   the act bus (act:feed, a snack food is a treat), shown once the dog has finished eating. bath 04_bath.js finish -> exBath (shown back in the yard, after the bath zoomies), brush
             14_town_places.js salonGroom, dig 03_yard.js beachDig and the pack's dig walk (37_roam.js rmPackAct), trick act:trick (Great or Good)
     ball    38_ball.js blReturn (the catch) and blStop (the end of play: a short pout, then fine)
     newPlace  act:travel + yard:enter: the first arrival of the day at a Tokyo place or the Mt. Fuji Lookout (wow, the whole pack)
     shelterMeet  30_shelter.js srPet (a room dog you pet and meet). cardPaw  act:paw (40_dogcards.js): the visitors of the card you gave a paw
             show hearts or a wink, on this device only (nothing is sent, the card has no new field)
     photo   35_photo.js: the face picker (Natural and the fourteen words) puts one face on every dog in the picture */

const EX_LIST = ['sleepy', 'surprised', 'curious', 'hearts', 'proud', 'guilty', 'sneeze', 'blep', 'zoomies', 'pout', 'dreamy', 'wow', 'wink', 'yum']; // the PawArt.EXPR_LIST order (V213.md 3.1)
const EX_WORDS = { sleepy: 'Sleepy', surprised: 'Surprised', curious: 'Curious', hearts: 'Heart eyes', proud: 'Proud', guilty: 'Guilty', sneeze: 'Achoo', blep: 'Blep', zoomies: 'Zoomies', pout: 'Pout', dreamy: 'Dreamy', wow: 'Wow', wink: 'Wink', yum: 'Yum' }; // the player words
const EX_MS = { sleepy: 3400, surprised: 2200, curious: 2800, hearts: 3000, proud: 3000, guilty: 3200, sneeze: 2200, blep: 2800, zoomies: 2400, pout: 2600, dreamy: 3400, wow: 3000, wink: 2200, yum: 2800 };
const EX_COOL = 1500; // ms after a face ends before the same dog makes the next one (an event may ask for longer: cool)
// play events: w = the event's own faces and weights. only: just those faces (a breed's favourites do not join in). prio: 1 an idle face, 2 care and
// play (the default), 3 a moment that must show (the end of ball play, a new place, a paw): a higher one replaces a face that is showing.
// ms: the event's own time. cool: the cooldown after it. fav: the weight a favourite face starts from when the event's own list leaves it out
const EX_EV = {
  roam: { w: { curious: 4, sleepy: 3, blep: 3, sneeze: 2, zoomies: 1.5, dreamy: 1, surprised: 0.6, pout: 0.6 }, prio: 1, fav: 1.2 },
  pet: { w: { hearts: 5, dreamy: 3, blep: 2, wink: 1.5, sleepy: 0.6 }, cool: 2500 },
  feed: { w: { yum: 6, hearts: 1.5, blep: 1, sleepy: 0.6 }, fav: 0.5 },
  treat: { w: { yum: 5, hearts: 2.5, wow: 2, wink: 1 }, fav: 0.5 },
  bath: { w: { sneeze: 4, zoomies: 3, dreamy: 2, pout: 2, proud: 1 } },
  brush: { w: { proud: 4, dreamy: 3, wow: 2, hearts: 2 } },
  ballCatch: { w: { zoomies: 4, proud: 3, wow: 2, wink: 1.5 } },
  ballEnd: { w: { pout: 1 }, only: true, ms: 1800, prio: 3 },
  trick: { w: { proud: 5, wink: 3, wow: 2, zoomies: 1, yum: 1 }, ms: 3800, prio: 3 },
  dig: { w: { guilty: 1 }, only: true, ms: 3200, prio: 3 },
  newPlace: { w: { wow: 1 }, only: true, ms: 3400, prio: 3 },
  shelterMeet: { w: { hearts: 4, curious: 3, wink: 2, blep: 2, surprised: 1 } },
  cardPaw: { w: { hearts: 1, wink: 1 }, only: true, ms: 5000, prio: 3 },
};
// personality, part 1: the breed's trait (BREED_PERS, 36_personality.js) multiplies some faces
const EX_TRAIT = {
  aloof: { pout: 2, proud: 1.6, curious: 0.8, hearts: 0.6 }, beg: { yum: 2.2, hearts: 1.3, blep: 1.3 }, ball: { zoomies: 1.8, wow: 1.4 },
  needy: { hearts: 2, dreamy: 1.4, pout: 1.3 }, chatty: { surprised: 1.5, wink: 1.3, zoomies: 1.3 }, follow: { hearts: 1.5, curious: 1.2 },
  guard: { surprised: 1.6, proud: 1.4, curious: 1.3 }, lazy: { sleepy: 2.4, dreamy: 1.8, zoomies: 0.4 }, burst: { zoomies: 2.2, sleepy: 1.4 },
  sniff: { curious: 2, sneeze: 1.8 }, polite: { proud: 1.6, wink: 1.3, guilty: 0.6 }, herd: { curious: 1.5, proud: 1.3 }, smile: { hearts: 1.5, wow: 1.4, blep: 1.2 },
  cheeky: { wink: 2, blep: 1.8, guilty: 1.4 }, loyal: { hearts: 1.4, proud: 1.3, dreamy: 1.2 }, show: { proud: 2, wink: 1.6, wow: 1.6 }, spin: { zoomies: 1.8, wow: 1.5, surprised: 1.2 },
};
// personality, part 2: each breed's two to four favourite faces (all 35 keys, mods/genes.js BREEDS order). A favourite weighs EX_FAV times more and
// joins every open event (at EX_FAV_BASE, or the event's fav) even when the event's own list leaves it out. The owner's examples: the dramatic Shiba, the sleepy English
// Mastiff, the show-off Japanese Spitz
const BREED_FACES = {
  shiba: ['pout', 'surprised', 'guilty'], corgi: ['yum', 'blep', 'zoomies'], golden: ['hearts', 'zoomies', 'yum'], dachs: ['hearts', 'pout', 'guilty'],
  husky: ['surprised', 'zoomies', 'wink'], mutt: ['hearts', 'curious', 'blep'], chihuahua: ['surprised', 'pout', 'proud'], pug: ['sleepy', 'blep', 'sneeze'],
  greyhound: ['zoomies', 'sleepy', 'dreamy'], beagle: ['curious', 'sneeze', 'yum'], poodle: ['proud', 'wink'], collie: ['curious', 'zoomies', 'proud'],
  samoyed: ['hearts', 'wow', 'blep'], frenchie: ['blep', 'sneeze', 'wink'], akita: ['proud', 'dreamy'], spitz: ['proud', 'wink', 'wow'],
  pom: ['zoomies', 'wow', 'surprised'], afghan: ['proud', 'dreamy', 'pout'], dane: ['hearts', 'sleepy', 'blep'], mastiff: ['sleepy', 'dreamy'],
  gsd: ['curious', 'proud'], dobie: ['hearts', 'proud'], corso: ['proud', 'dreamy'], pitbull: ['hearts', 'zoomies', 'blep'],
  minpin: ['zoomies', 'proud', 'surprised'], lab: ['yum', 'hearts', 'zoomies'], malamute: ['surprised', 'zoomies', 'blep'], chow: ['pout', 'sleepy', 'proud'],
  stdpoodle: ['proud', 'wink', 'curious'], schnauzer: ['curious', 'surprised', 'proud'], westie: ['curious', 'guilty', 'sneeze'], yorkie: ['pout', 'wink', 'proud'],
  bichon: ['zoomies', 'hearts', 'wow'], maltese: ['dreamy', 'hearts', 'wink'], shihtzu: ['sleepy', 'dreamy', 'blep'],
};
const EX_FAV = 2.5, EX_FAV_BASE = 1; // an event may set its own base (fav): the idle roam faces lean on the favourites more, a meal less (it is mostly yum)
const EX_ROAM_RATE = 1 / 30; // roam faces a second for an ordinary dog (x 0.4 + 0.8 energy + 0.6 attention): a busy scene of four shows one every few seconds
const EX_ROAM_GAP = 1000; // at most one new roam face a second in the scene
const EX_ROAM_POSE = /^(idle|sit|sniff|down|happy)$/; // standing, sitting or sniffing (never walking, napping or busy)
const EX = { bath: [], cur: {}, tm: {}, cool: {}, rcool: {}, roam: true, roamAt: 0, rt: 0, rnd: null, ph: false, log: [], wow: { day: '', seen: {} }, arrive: null, heads: new Map() };

const exRand = () => (EX.rnd ? EX.rnd() : Math.random());
function exArt() { const A = PA(); return typeof A.exprOk === 'function' ? A : null; }
function exOn() { return !!S && (!navigator.webdriver || !!prefs.exTest) && !!exArt(); }
const exKnown = (n) => typeof n === 'string' && Object.prototype.hasOwnProperty.call(EX_WORDS, n);
const exBaby = (d) => !!(d && d.born) && ageMonths(d) < 1; // a newborn: the art draws no face (its eyes are shut), so none is picked, shown or counted
function exOk(n, pose) { const A = exArt(); try { return !!A && exKnown(n) && !!A.exprOk(n, pose || 'idle'); } catch (e) { return false; } }

/* ---------------- the face a dog shows now ---------------- */
function exPhotoFace() { return EX.ph && exKnown(prefs.phFace) && exOn() ? prefs.phFace : null; }
function exNow(d, pose) {
  if (!d || exBaby(d)) return null; const p = pose || 'idle';
  const ph = exPhotoFace(); if (ph) return exOk(ph, p) ? ph : null; // photo mode: the picked face on every dog in the picture
  const e = EX.cur[d.id]; if (!e || performance.now() >= e.until || !exOn()) return null;
  return exOk(e.name, p) ? e.name : null;
}
function exOpt(d, pose, o) { const e = exNow(d, pose); if (e) o.expr = e; return o; } // dogSVG options with the face added when there is one

/* ---------------- showing a face ---------------- */
function exShow(d, name, ms, o) {
  o = o || {}; if (!d || d.id == null || !exKnown(name) || exBaby(d) || !exOn()) return false;
  const now = performance.now(), id = d.id, c = EX.cur[id], prio = o.prio || 2;
  if (c && now < c.until && !o.force && prio <= c.prio) return false; // one at a time: a player's moment may replace an idle face
  if (!o.force && now < (EX.cool[id] || 0) && !(c && now < c.until)) return false;
  const dur = Math.max(300, ms || EX_MS[name] || 2600), st = { name, until: now + dur, prio, ev: o.ev || '' };
  EX.cur[id] = st; EX.cool[id] = st.until + (o.cool || EX_COOL); clearTimeout(EX.tm[id]);
  EX.tm[id] = setTimeout(() => { if (EX.cur[id] !== st) return; delete EX.cur[id]; delete EX.tm[id]; exRedraw(exDogOf(id) || d); }, dur); // the live dog object (a reload replaces them)
  EX.log.push({ id, name, ev: st.ev, t: Math.round(now) }); if (EX.log.length > 60) EX.log.shift();
  if (o.draw !== false) exRedraw(d);
  return true;
}
function exClear(d) { if (!d || !EX.cur[d.id]) return; clearTimeout(EX.tm[d.id]); delete EX.cur[d.id]; delete EX.tm[d.id]; exRedraw(d); }
// draw only this dog again: the leader's art (renderDog's art-only path), a pack dog's art (rmPaint), a Dog Card visitor, a Shelter Playroom dog
function exRedraw(d) {
  if (!S || !d) return;
  if (d.id === S.activeId) { if (dogKey && $('#dogArt')) { const lp = rmLeadPose(); renderDog(lp[0] || 'idle', lp[1] || 'right', false, true); } return; }
  if (typeof d.id === 'string' && d.id.startsWith('dcv:')) { exDcDraw(d); return; }
  if (S.dogs.some((x) => x.id === d.id)) { if ((cur.mode === 'yard' || cur.mode === 'market') && rmEl(d)) rmPaint(d); return; }
  exSrDraw(d);
}
function exDrawAll() { if (!S) return; rmDogs().forEach(exRedraw); if (typeof DC === 'object' && DC) DC.vis.forEach((v) => exRedraw(v.dog)); }

/* ---------------- picking a face: event x trait x favourites ---------------- */
function exWeights(d, ev, pose) {
  const E = EX_EV[ev]; if (!E || !d) return [];
  const tr = EX_TRAIT[persOf(d).trait] || {}, fav = BREED_FACES[d.key] || [];
  let l = EX_LIST.map((n) => { const f = fav.includes(n), b = E.w[n] || (!E.only && f ? (E.fav || EX_FAV_BASE) : 0); return [n, b * (tr[n] || 1) * (f ? EX_FAV : 1)]; }).filter((x) => x[1] > 0);
  if (pose) { const ok = l.filter((x) => exOk(x[0], pose)); if (ok.length) l = ok; } // the faces that go on that pose, when the art has any
  return l;
}
// the likeliest face first, so a roll of 0 picks it
function exPick(d, ev, pose) { const l = exWeights(d, ev, pose).sort((a, b) => b[1] - a[1]); if (!l.length) return null; let s = exRand() * l.reduce((a, x) => a + x[1], 0); for (const x of l) { s -= x[1]; if (s <= 0) return x[0]; } return l[l.length - 1][0]; }
function exTrig(d, ev, o) {
  o = o || {}; const E = EX_EV[ev]; if (!E || !d || d.sleeping || exBaby(d) || !exOn()) return null;
  const now = performance.now(), c = EX.cur[d.id], on = c && now < c.until;
  if (on ? (E.prio || 2) <= c.prio : now < (EX.cool[d.id] || 0)) return null; // a face showing or a cooldown: nothing to pick (a rub calls this on every move)
  const name = exPick(d, ev, o.pose); if (!name) return null;
  return exShow(d, name, o.ms || E.ms || 0, { prio: E.prio || 2, ev, cool: E.cool, draw: o.draw }) ? name : null;
}

/* ---------------- roaming: the occasional face while a dog stands or sniffs (37_roam.js rmTick, every 200 ms) ---------------- */
function exRoamRate(d) { const P = rmPers(d); return EX_ROAM_RATE * (0.4 + 0.8 * P.energy + 0.6 * P.attention); } // faces a second (energy and attention)
function exRoamTick(now) {
  const dt = Math.min(1, Math.max(0, (now - (EX.rt || now)) / 1000)); EX.rt = now;
  if (!EX.roam || now < EX.roamAt || !exOn() || !rmOn() || !modal.hidden || blOn() || phActive() || TRN || curling || (typeof FS === 'object' && FS && FS.walking)) return false;
  const ds = rmDogs().slice(); for (let i = ds.length - 1; i > 0; i--) { const j = Math.floor(exRand() * (i + 1)); [ds[i], ds[j]] = [ds[j], ds[i]]; }
  for (const d of ds) {
    const lead = d === D(), r = rmSt(d); if (d.sleeping || exBaby(d) || r.tw || (lead && (busy || S.sleeping))) continue;
    const pose = lead ? rmLeadPose()[0] || 'idle' : rmPackPose(d); if (!EX_ROAM_POSE.test(pose)) continue;
    if (EX.cur[d.id] || now < (EX.rcool[d.id] || 0)) continue;
    if (exRand() >= exRoamRate(d) * dt) continue;
    if (exTrig(d, 'roam', { pose })) { EX.roamAt = now + EX_ROAM_GAP; EX.rcool[d.id] = now + 8000 + exRand() * 10000; return true; }
  }
  return false;
}

/* ---------------- after eating: a meal or a treat (the act bus) ---------------- */
function exBusy(d) { if (d === D()) return busy || /^(eat|walk)$/.test(rmLeadPose()[0] || ''); return packPose[d.id] === 'eat' || !!rmSt(d).tw; }
function exWhenFree(d, fn, wait) { let n = 0; const go = () => { if (!S) return; if (exBusy(d) && n++ < 14) { setTimeout(go, 300); return; } fn(); }; setTimeout(go, wait || 0); } // up to about 4 s
on('act:feed', (a) => {
  if (!exOn() || !a) return; const f = FOOD_ALL.find((x) => x.n === a.name), ev = SNACKS.includes(a.name) || TK_SNACKS.includes(a.name) || (f && f.snack) ? 'treat' : 'feed'; // the light foods (12_popups SNACKS) and the Nakamise treats
  (a.ids && a.ids.length ? a.ids : [S.activeId]).forEach((id, i) => { const d = dogById(id); if (d) exWhenFree(d, () => exTrig(d, ev, { pose: 'idle' }), 150 + i * 250); });
});
function exTrickPose(n) { try { const s = trickPose(n); return (s && s.pose) || 'idle'; } catch (e) { return 'idle'; } } // the pose the trick is drawn on (15_trick_training.js)
on('act:trick', (a) => { if (a && (a.grade === 'Great' || a.grade === 'Good')) exTrig(D(), 'trick', { pose: exTrickPose(a.name), draw: false }); }); // the trick pose is drawn straight after (15b tgApply)

/* ---------------- the bath: the face once the dog is back in the yard (04_bath.js finish -> exBath) ---------------- */
// The tub draws the shake (a pose almost no face goes on) and the yard comes back 1.7 s later, where the leader runs its bath zoomies (walk). So the
// face waits: each bathed dog (a pack bath queues them all) makes it in the yard, once it stands again, picked for the pose it is drawn on then
function exBath(d) { if (d && d.id != null && !EX.bath.some((b) => b.id === d.id)) EX.bath.push({ id: d.id, t: performance.now() }); }
function exBathWait(d) { return d === D() && (bathZoomies || (typeof IDLE === 'object' && IDLE.act && IDLE.act.name === 'zoomies')); }
on('yard:enter', () => {
  const now = performance.now(), l = EX.bath.filter((b) => now - b.t < 30000); EX.bath = []; if (!l.length || !S) return; // a bath left for elsewhere is old news
  l.forEach((b, i) => { const d = dogById(b.id); if (!d) return; let n = 0;
    const go = () => { if (!S || cur.mode !== 'yard' || !dogById(b.id)) return; if ((exBathWait(d) || exBusy(d)) && n++ < 24) { setTimeout(go, 250); return; } // up to about 6 s
      exTrig(d, 'bath', { pose: d === D() ? rmLeadPose()[0] || 'idle' : rmPackPose(d) }); };
    setTimeout(go, 400 + i * 450); });
});

/* ---------------- a new place: the first arrival of the day at a Tokyo place or the Mt. Fuji Lookout ---------------- */
// Kept in memory only (no save field): the Japan day and the places seen, and the day's visit list (S.daily.visited) so a reload does not repeat it
const exWowPlace = (p) => p === 'fujihill' || (typeof TK_PLACES === 'object' && !!TK_PLACES[p]);
on('act:travel', (a) => {
  EX.arrive = null; const p = a && a.place; if (!p || !exWowPlace(p) || !S) return;
  const day = jstISO(); if (EX.wow.day !== day) EX.wow = { day, seen: {} }; if (EX.wow.seen[p]) return; EX.wow.seen[p] = 1;
  if (S.daily && Array.isArray(S.daily.visited) && S.daily.visited.includes(p)) return; EX.arrive = p;
});
on('yard:enter', () => {
  const p = EX.arrive; if (!p || !S || S.place !== p) return; EX.arrive = null;
  setTimeout(() => { if (!S || S.place !== p || cur.mode !== 'yard') return; rmDogs().forEach((d, i) => setTimeout(() => { if (S && S.place === p && cur.mode === 'yard') exTrig(d, 'newPlace', { pose: 'idle' }); }, i * 450)); }, 900);
});

/* ---------------- Dog Cards: a paw makes the card's dogs smile (this device only) ---------------- */
function exCard(id) { const v = typeof DC === 'object' && DC ? DC.vis.find((x) => x.card.id === id) : null; return v ? v.card : (DC.cards || []).concat(DC_FAKE).find((c) => c && c.id === id) || null; }
on('act:paw', (a) => {
  if (!a || !exOn() || typeof DC !== 'object' || !DC) return; const c = exCard(a.id); if (!c) return;
  c.dogs.forEach((x, i) => { const d = dcDog(c, i); if (d) setTimeout(() => exTrig(d, 'cardPaw', { pose: 'sit' }), i * 300); });
});
function exDcDraw(d) {
  if (typeof DC !== 'object' || !DC) return; DC.vis.forEach((v) => { if (v.dog.id === d.id) dcPaint(v); });
  const m = d.id.split(':'), cid = m.slice(1, -1).join(':'), i = +m[m.length - 1], p = document.querySelector(`#modal [data-dc-card="${CSS.escape(cid)}"]`); if (!p) return;
  const c = exCard(cid); if (!c) return; const shown = c.dogs.map((x, j) => j).filter((j) => dcDog(c, j)), k = shown.indexOf(i), fig = p.querySelectorAll('.dc-dogs .dc-dog')[k];
  const a = fig && fig.querySelector('.dc-art'), dd = dcDog(c, i); if (a && dd) a.innerHTML = dogSVG(dd, exOpt(dd, 'sit', { pose: 'sit', outfit: dd.outfit })); // the card's own picture of that dog
}

/* ---------------- the Shelter Playroom ---------------- */
function exSrDraw(d) { if (typeof SR === 'undefined' || !SR || !SR.dogs) return; SR.dogs.forEach((rd) => { if (rd.look && rd.look.id === d.id && !rd.away) srPose(rd, rd.pose); }); }

/* ---------------- photo mode: the face picker (35_photo.js) ---------------- */
// one face on every dog in the picture: while photo mode is open exNow answers the picked face (a dog whose pose takes no face, a napping dog,
// keeps its own), the scene's dogs are drawn again and the photo is taken again
function exPhoto(on) { on = !!on; if (EX.ph === on) return; EX.ph = on; if (exKnown(prefs.phFace)) exDrawAll(); }
function exHeadSVG(d, n) {
  const c = coatInfo(d), k = [d.id, d.key, c ? c.coatName : '', JSON.stringify(dogLook(d) || ''), n || ''].join('|'); if (EX.heads.has(k)) return EX.heads.get(k);
  const o = lookOpts(d, c); if (n) o.expr = n; const s = Object.keys(o).length ? art('dogHead', d.key, o) : art('dogHead', d.key);
  if (EX.heads.size > 120) EX.heads.clear(); EX.heads.set(k, s); return s;
}
const exWord = (n) => (n ? tdata('ex_words.' + n, EX_WORDS[n]) : tt('expressions.natural', 'Natural')); // the face word as shown ('' = Natural)
function exPickerHTML() {
  // no faces (the harness without prefs.exTest, no face art): no picker, the v2.12 photo screen
  if (!S || !exOn()) return ''; const d = D(), now = exKnown(prefs.phFace) ? prefs.phFace : '';
  const b = (n) => `<button type="button" class="btn ex-face" data-exface="${n}" aria-pressed="${n === now}" aria-label="${esc(exWord(n))}" title="${esc(exWord(n))}"><span class="ex-fhead" aria-hidden="true">${exHeadSVG(d, n)}</span><span class="ex-fword">${esc(exWord(n))}</span></button>`;
  return `<div class="ex-faces" role="group" aria-label="${esc(tt('expressions.face_group', 'Face for every dog in the photo'))}"><span class="ex-flbl">${esc(tt('expressions.face', 'Face'))}<b class="ex-fnow">${esc(exWord(now))}</b></span><div class="ex-frow">${[''].concat(EX_LIST).map(b).join('')}</div></div>`;
}
function exPickerBind(root) {
  const box = root && root.querySelector('.ex-faces'); if (!box) return;
  box.querySelectorAll('[data-exface]').forEach((el) => { el.onclick = () => {
    const n = el.dataset.exface; if ((prefs.phFace || '') === n) return; SFX.click(); prefs.phFace = n; savePrefs();
    box.querySelectorAll('[data-exface]').forEach((x) => x.setAttribute('aria-pressed', x === el)); const w = box.querySelector('.ex-fnow'); if (w) w.textContent = exWord(n);
    exDrawAll(); if (PH.on) { const c = phCapture(); if (c) { PH.cap = c; phDraw(30); } } // the scene with the new faces, taken again
  }; });
  const on = box.querySelector('[aria-pressed="true"]'); if (on && isPhone()) requestAnimationFrame(() => { const r = box.querySelector('.ex-frow'); if (r && on.offsetLeft > r.clientWidth - 60) r.scrollLeft = on.offsetLeft - 12; }); // the picked face in view
}

/* ---------------- test hook ---------------- */
function exDogOf(id) {
  if (!S) return null; const d = dogById(id); if (d) return d;
  if (typeof id === 'string' && id.startsWith('dcv:') && typeof DC === 'object' && DC) { const v = DC.vis.find((x) => x.dog.id === id); if (v) return v.dog; }
  if (typeof SR !== 'undefined' && SR && SR.dogs) { const rd = SR.dogs.find((x) => x.look && x.look.id === id); if (rd) return rd.look; }
  return null;
}
function exExpose() {
  if (!window.__paw || window.__paw.ex) return;
  window.__paw.ex = {
    on: () => exOn(), list: EX_LIST.slice(), words: Object.assign({}, EX_WORDS), faces: BREED_FACES, events: Object.keys(EX_EV),
    show: (id, n, ms) => exShow(exDogOf(id), n, ms, { force: true }), clear: (id) => exClear(exDogOf(id)), now: (id, pose) => exNow(exDogOf(id), pose),
    cur: (id) => { const e = EX.cur[id]; return e && performance.now() < e.until ? { name: e.name, ev: e.ev, left: Math.round(e.until - performance.now()) } : null; },
    trig: (id, ev, o) => exTrig(exDogOf(id), ev, o || {}), cool: (id) => { if (id) { delete EX.cool[id]; delete EX.rcool[id]; } else { EX.cool = {}; EX.rcool = {}; EX.roamAt = 0; } },
    // the share of each face for a breed and an event (deterministic: the weights themselves). key: a breed key or a dog id
    weights: (key, ev, pose) => { const d = exDogOf(key) || { key, id: 'w' }, l = exWeights(d, ev, pose), t = l.reduce((a, x) => a + x[1], 0); const o = {}; l.forEach((x) => { o[x[0]] = x[1] / t; }); return o; },
    rate: (id) => exRoamRate(exDogOf(id)), rnd: (v) => { EX.rnd = v == null ? null : typeof v === 'function' ? v : () => v; }, roam: (on) => { EX.roam = !!on; }, roamTick: () => exRoamTick(performance.now()),
    get log() { return EX.log.slice(); }, clearLog: () => { EX.log = []; }, photo: () => exPhotoFace(), arrive: () => EX.arrive, wowReset: () => { EX.wow = { day: '', seen: {} }; },
  };
}
on('game:ready', () => setTimeout(exExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.ex) exExpose(); });
setTimeout(exExpose, 0);
