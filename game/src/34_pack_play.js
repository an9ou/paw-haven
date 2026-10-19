/* ======================= v2.9 PACK lane (tag pk): pack play and walks. See V29.md sections 1 and 5 =======================
   Every tray that acts on dogs uses the v2.7 chip row (crChipsHTML / crBindChips / crDogs, ticked = joins in). The leader (S.activeId) never changes
   unless the player picks "Make leader". With one dog, or under prefs.crOne, everything is v2.8.4 exactly. The PACK lane owns this file. */

// runtime only (V29.md 5.1: no save field). walk: the followers of the walk that is starting or running. sw: a long screen runs for another dog. skip: why the last pkDogs left a dog out
const PKS = { walk: null, sw: null, skip: [], lp: false, fetch: null, card: null, pickX: 0 };
const PK_BONUS = 0.1; // pack walk bonus: +10% of one walk's coins (rounded down) when 2 or more dogs walk (V29.md 5.4)
// these two are read when a tray is drawn (esc() calls String()), so they follow the language chosen at boot, not the one at script load
const PK_CAP_PLAY = { toString: () => tt('packplay.cap_play', 'Ticked dogs join in. The leader always plays. Every awake dog plays ball.') };
const PK_CAP_WALK = { toString: () => tt('packplay.cap_walk', 'Ticked dogs come along. The leader leads.') };

/* ---------------- who joins in ---------------- */
// the dogs that take part, the leader first. kind 'play' (toys, duck, tug), 'fetch' or 'walk' (area: the route). A ticked dog that is asleep, too tired or
// not allowed out is left out (PKS.skip says why, pkSkipLines turns that into kind lines). With one dog or pack care off: the active dog only
function pkDogs(kind, area) {
  const lead = S.dog, out = [lead]; PKS.skip = [];
  if (!crPack()) return out;
  crDogs().forEach((d) => {
    if (d === lead || (typeof hmMumIn === 'function' && hmMumIn(d))) return;
    if (kind === 'walk' && walkBlock(d, area)) return; // enterWalk's walkPackNote already gives the kind line for these
    if (kind === 'fetch' && fetchBlock(d)) return;
    if (d.sleeping) { PKS.skip.push({ d, why: 'asleep' }); return; }
    if (d.stats.energy < (kind === 'walk' || kind === 'fetch' ? 10 : 5)) { PKS.skip.push({ d, why: 'tired' }); return; }
    out.push(d);
  });
  return out;
}
function pkSkipLines(skip) {
  const tired = skip.filter((s) => s.why === 'tired').map((s) => s.d), zz = skip.filter((s) => s.why === 'asleep').map((s) => s.d), out = [];
  if (tired.length) out.push(tt('packplay.skip_tired', '{names} {n, plural, one {is pooped and naps} other {are pooped and nap}} this one out.', { names: crNames(tired), n: tired.length }));
  if (zz.length) out.push(tt('packplay.skip_asleep', '{names} {n, plural, one {is asleep and stays} other {are asleep and stay}} put.', { names: crNames(zz), n: zz.length }));
  return out;
}
// the kind lines for the dogs left out, as toasts a moment after the game starts (behind any "stays home" lines)
function pkSkipSay(skip, delay, mode) {
  pkSkipLines(skip).forEach((t, i) => setTimeout(() => { if (S && cur.mode === mode) toast(t); }, delay + i * 1700));
}

/* ---------------- the one-dog picker (Wardrobe, Tricks) ---------------- */
// heads of every dog present; sel = the id that is picked now
function pkPickHTML(sel, label) {
  if (!crPack()) return '';
  const chips = crPresent().map((d) => `<button class="chip cr-chip on pk-pickb" data-pkdog="${d.id}" aria-pressed="${d.id === sel}" aria-label="${esc(d.sleeping ? tt('packplay.dog_asleep', '{name}, asleep', { name: d.name }) : d.name)}"><span class="cr-head" aria-hidden="true">${headSVG(d)}</span><span class="cr-name">${esc(d.name)}</span>${d.sleeping ? '<span class="cr-zz" aria-hidden="true">zz</span>' : ''}</button>`).join('');
  return `<div class="cr-wrap pk-pickwrap"><div class="pk-pick" role="group" aria-label="${esc(label || tt('packplay.pick_dog', 'Pick a dog'))}">${chips}</div></div>`;
}
function pkBindPick(root, fn) {
  root = root || dock;
  root.querySelectorAll('[data-pkdog]').forEach((b) => { b.onclick = () => { const row = b.closest('.pk-pick'); PKS.pickX = row ? row.scrollLeft : 0; SFX.init(); SFX.click(); fn(b.dataset.pkdog); }; });
  pkPickShow(root);
}
// a pick re-renders the row: it keeps where it was scrolled to, and the picked chip is always fully in view (the row scrolls, nothing else does)
function pkPickShow(root) {
  const row = $('.pk-pick', root), b = row && $('.pk-pickb[aria-pressed="true"]', row); if (!row) return;
  const fit = () => {
    if (!row.isConnected) return;
    row.scrollLeft = PKS.pickX || 0; if (!b) return;
    const r = row.getBoundingClientRect(), c = b.getBoundingClientRect(), pad = 6;
    if (c.left < r.left + pad) row.scrollLeft -= r.left + pad - c.left; else if (c.right > r.right - pad) row.scrollLeft += c.right - (r.right - pad);
  };
  fit(); requestAnimationFrame(fit); // once now, once after the sheet has its size
}

/* ---------------- one dog at a time: the leader comes back ---------------- */
// redraw the yard after the leader changed under it (the crBathSwap pattern, but we stay in the yard)
function pkRefresh() {
  hudDogKey = ''; dogKey = '';
  if (!S || cur.mode !== 'yard') return;
  const pk = $('#pack'); if (pk) { pk.innerHTML = packSVG(); bindPack(); }
  renderDog(dogPoseNow(), 'right', true); setHudDog(); updateHUD();
}
// run a long screen (training) for dog `id`. S.activeId changes only while it runs: pkBack (closeTraining) puts the leader back. fn returns false when the screen did not open
function pkWith(id, fn) {
  const d = dogById(id); if (!d) return;
  if (id !== S.activeId) {
    if (busy) { nope(tt('packplay.busy', 'Hold on, {name} is busy.', { name: NAME() })); return; }
    closeTraining(); // training another dog first ends the session that is open (its leader comes back before the swap below)
    if (!PKS.sw) PKS.sw = { orig: S.activeId, who: id }; else PKS.sw.who = id;
    S.activeId = id; markDirty(); hudDogKey = ''; dogKey = '';
    if (cur.mode === 'yard') go('yard');
  }
  const keep = fn ? fn() : true;
  if (keep === false) pkBack();
}
function pkBack() {
  const sw = PKS.sw; if (!sw) return; PKS.sw = null;
  if (S.activeId !== sw.who || S.activeId === sw.orig || !dogById(sw.orig)) return; // the player switched on purpose: that choice stands
  S.activeId = sw.orig; markDirty(); pkRefresh();
}
// "Make leader": the same as a HUD chip tap
function pkLead(id) { if (id !== S.activeId) switchDog(id); }
// train one dog from the Tricks picker or the dog card. The blocks are checked first, so nothing switches for a dog that cannot train
function pkTrain(id) {
  const d = dogById(id); if (!d) return;
  if (d.sleeping) { nope(tt('packplay.train_asleep', '{name} is asleep. Training can wait.', { name: d.name })); return; }
  const tb = trainBlock(d); if (tb) { nope(tb); return; }
  if (busy && d.id !== S.activeId) { nope(tt('packplay.busy', 'Hold on, {name} is busy.', { name: NAME() })); return; }
  pkWith(id, () => { openTraining(); return !!TRN; });
}
// the Tricks card with a pack: pick the dog inside the tray
function pkTricksTray() {
  setTray(tt('packplay.tricks_title', 'Tricks: who trains?'), `${pkPickHTML(S.activeId, tt('packplay.who_trains', 'Who trains'))}<p class="small pk-cap">${esc(tt('packplay.tricks_cap', 'Tap a dog to train. {name} stays the leader.', { name: NAME() }))}</p>`);
  pkBindPick(dock, pkTrain);
}

/* ---------------- Wardrobe ---------------- */
// the dog being dressed: a pack dog picked in the wardrobe (null: the leader, the v2.8.4 wardrobe)
function pkWardDog(did) {
  if (!crPack() || did === undefined || did === null) return null;
  const d = crPresent().find((x) => x.id === did); return d && d.id !== S.activeId ? d : null;
}
let pkDressing = false; // equip() leaves the leader's picture alone while a pack dog is dressed
function pkDress(wd, fn) {
  pkDressing = true; try { withDog(wd, fn); } finally { pkDressing = false; }
  if (cur.mode === 'yard') redrawPackDog(wd);
}

/* ---------------- Play: Squeaky Duck and Tug ---------------- */
// a drawing's box in scene units (the union of its parts, so the empty corners of the 240 x 200 dog box do not count). null when nothing is drawn
function pkArtBox(el) {
  const svg = $('svg.world', view), s = el && (el.querySelector('svg.pa-dog') || el.querySelector('svg')); if (!svg || !s || !svg.getScreenCTM()) return null;
  const M = svg.getScreenCTM().inverse(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  [...s.children].forEach((c) => { const r = c.getBoundingClientRect(); if (!r.width && !r.height) return; const a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M); x0 = Math.min(x0, a.x); y0 = Math.min(y0, a.y); x1 = Math.max(x1, b.x); y1 = Math.max(y1, b.y); });
  return x1 > x0 ? [x0, y0, x1, y1] : null;
}
// where pack dog d stands (packDogSVG's spot: [feet x, feet y, facing, scale])
function pkSpotOf(d) {
  const i = others().indexOf(d); let [fx, fy, face, sc] = packSpots()[i] || packSpots()[0]; sc = sc || 0.6;
  const hs = typeof hoPackSpot === 'function' ? hoPackSpot(d, i) : null; if (hs) [fx, fy, face, sc] = hs;
  return [fx, fy, face, sc];
}
// slide a pack dog's group from one transform to another (Motion off: the global rule drops the transition, so it is simply placed)
function pkSlide(g, from, to) {
  g.style.transition = 'none'; g.style.transform = from; void g.getBoundingClientRect();
  g.style.transition = ''; g.classList.add('pk-slide'); g.style.transform = to;
}
const PK_TUG = { sc: 0.56, tuck: 10, rise: 30, step: 16, xmin: 224 }; // the pile: crouching dogs at 56% (v2.11.1: x their size factor, sizeK), the bottom one's nose just under the leader's tail, each one above a little higher and further back
// Tug: the pack dogs leave their spots and pile on behind the leader (its end of the rope), crouching and facing it, then go back. Toys: a happy pose where they stand
function pkPlayStart(crew, tug) {
  const t = performance.now() + 2600; PKS.tug = null;
  crew.forEach((d) => { packNext[d.id] = Math.max(packNext[d.id] || 0, t); packPose[d.id] = tug ? 'crouch' : 'happy'; redrawPackDog(d); });
  if (!tug) return;
  const L = pkArtBox($('#dogArt')); if (!L) { crew.forEach((d) => { const g = $(`#pack [data-dog="${d.id}"]`); if (g) g.classList.add('pk-tug'); }); return; }
  const pile = crew.map((d) => ({ d, g: $(`#pack [data-dog="${d.id}"]`) })).filter((o) => o.g);
  PKS.tug = pile.map((o, k) => {
    const [fx, fy, face, sc] = pkSpotOf(o.d), m = PK_TUG.sc * sizeK(o.d) / sc, sx = face === 'right' ? m : -m, lvl = pile.length - 1 - k; // the last one drawn is the bottom of the pile
    const A = pkArtBox(o.g) || [fx - 60 * sc, fy - 100 * sc, fx + 60 * sc, fy], hd = ((face === 'right' ? A[2] - fx : fx - A[0])) * m, tl = ((face === 'right' ? fx - A[0] : A[2] - fx)) * m;
    const X = Math.max(PK_TUG.xmin + tl, L[0] + PK_TUG.tuck - hd - lvl * PK_TUG.step), Y = L[3] + 4 - lvl * PK_TUG.rise;
    const to = `translate(${f1(X - sx * fx)}px, ${f1(Y - m * fy)}px) scale(${sx.toFixed(3)}, ${m.toFixed(3)})`, at = `translate(${f1(fx - (face === 'right' ? 1 : -1) * fx)}px, 0px) scale(${face === 'right' ? 1 : -1}, 1)`;
    o.g.classList.add('pk-tug'); pkSlide(o.g, at, to); return { id: o.d.id, X, Y, m, fx, fy, face };
  });
}
function pkPlayEnd(crew) {
  const tug = PKS.tug; PKS.tug = null;
  crew.forEach((d) => {
    packPose[d.id] = 'happy'; if (cur.mode !== 'yard' || d.sleeping) return; redrawPackDog(d);
    const p = tug && tug.find((x) => x.id === d.id), g = p && $(`#pack [data-dog="${d.id}"]`); if (!g) return;
    // back to its spot, facing the way it goes (f -1: drawn mirrored on the way, it turns round when it gets there)
    const f = (p.face === 'right' ? 1 : -1) * (p.fx >= p.X ? 1 : -1), back = f > 0 ? '' : `translate(${f1(2 * p.fx)}px, 0px) scale(-1, 1)`;
    pkSlide(g, `translate(${f1(p.X - f * p.m * p.fx)}px, ${f1(p.Y - p.m * p.fy)}px) scale(${(f * p.m).toFixed(3)}, ${p.m.toFixed(3)})`, back);
    if (f < 0) setTimeout(() => { if (g.isConnected) { g.style.transition = 'none'; g.style.transform = ''; } }, 450);
  });
}
// the effects for the pack dogs, each under its own dog. Returns the Bond the first one got
function pkPlayFx(crew, toy, tug, k) {
  let b = 0;
  crew.forEach((d) => withDog(d, () => {
    addStat('happy', (tug ? 15 : 10) * k * (d.favToy === toy ? 1.5 : 1) * (S.place === 'park' ? 1.2 : 1));
    if (tug) { addStat('energy', -10 * k); const n = addBond(5 * k); b = b || n; }
  }));
  return b;
}
// a toy mini-game reward for the pack dogs (18_mod_walk_toys enterToy): the same numbers as the leader, with each dog's own favourite toy
function pkToyFx(crew, r, k, name) {
  crew.forEach((d) => withDog(d, () => {
    const hp = (+r.happiness || 0) * k * (d.favToy === name ? 1.5 : 1) * (S.place === 'park' ? 1.2 : 1) * (S.place === 'dogpark' ? 1.3 : 1);
    if (hp) addStat('happy', hp); if ((+r.bond || 0) > 0) addBond(r.bond * k);
    if (r.energy) addStat('energy', +r.energy); if (r.clean) addStat('clean', +r.clean);
  }));
}

/* ---------------- Fetch: the others run along behind the leader ---------------- */
// the dog box's feet are at (430, 500); followers are drawn at 62%. gap: from the leader's tail (or nose) to the next follower; between: tail to nose down the line.
// Rows: the leader's own line first, then a row in front (lower, drawn in front of the leader) and one behind (higher). In the yard nobody stands on the veggie bed
// (x < 222) or on the dog house (a follower further back than its front would be drawn over it)
const PK_FOL = { x0: 430, y0: 500, sc: 0.62, gap: 26, between: 14, xmax: 985, ymin: 430, ymax: 596, front: 88, back: 72 };
const pkXf = (fx, fy) => `translate(${(fx - PK_FOL.x0 * PK_FOL.sc).toFixed(1)}px, ${(fy - PK_FOL.y0 * PK_FOL.sc).toFixed(1)}px) scale(${PK_FOL.sc})`;
function pkFolArt(d, pose, face) { return place(dogSVG(d, { pose, outfit: typeof shSleepOutfit === 'function' ? shSleepOutfit(d, pose) : outfitOf(d), facing: face }), DX, DY, DW, DH); }
// the spots for the line when the leader stands at (lx, ly) facing dir (1 right, -1 left): [middle x, feet y] per follower, the row furthest back first
function pkFolSpots(lx, ly, dir) {
  const P = PKS.fetch, n = P.dogs.length, F = PK_FOL, sw = P.len + F.between, out = [];
  const ok = (a, b, y) => { const x0 = Math.min(a, b), x1 = Math.max(a, b); return x0 >= P.xmin && x1 <= F.xmax && !P.zones.some((z) => y < z[2] && x0 < z[1] && x1 > z[0]) && !out.some((o) => Math.abs(o[1] - y) < 66 && Math.abs(o[0] - (x0 + x1) / 2) < P.len); }; // clear of the yard's things and of the rows close by
  const run = (from, y, d) => { for (let k = 0; out.length < n; k++) { const a = from + d * k * sw, b = a + d * P.len; if (!ok(a, b, y)) break; out.push([(a + b) / 2, y]); } };
  const yf = Math.min(F.ymax, ly + F.front), yb = Math.max(F.ymin, ly - F.back), front = yf - ly >= 50, back = ly - yb >= 50;
  const tail = lx - dir * (P.lb + F.gap), nose = lx + dir * (P.lf + F.gap), under = lx - dir * P.lb * 0.45;
  run(tail, ly + 4, -dir); // behind the leader on its own line, nose to tail
  if (front) run(under, yf, -dir); // the front row (lower, drawn in front of the leader) starts under its back legs
  if (back) run(tail, yb, -dir); // the row behind (higher)
  if (front) run(under + dir * F.between, yf, dir); // then the front row under and past its nose
  run(nose, ly + 4, dir); if (back) run(nose, yb, dir); // then ahead of it
  for (let k = 0; out.length < n; k++) out.push([clamp(tail - dir * (k + 0.5) * sw, P.xmin + P.len / 2, F.xmax - P.len / 2), ly + 4]); // nowhere left: squeeze in behind
  return out;
}
// move the followers to the spots ([middle x, feet y]; the box centre is offset by each dog's own drawing). They keep their order along the ground (nobody
// crosses another), and the one furthest back is drawn first: when that order changes the groups are re-stacked where they stand, so the slide goes on.
// T: the run's length in seconds (the nearest dog sets off first), none: placed at once
function pkFolPlace(spots, face, T) {
  const P = PKS.fetch, box = $('#pkFol'); if (!box) return;
  const els = P.dogs.map((d) => box.querySelector(`[data-pkfl="${d.id}"]`)), idx = P.dogs.map((d, i) => i).filter((i) => els[i]);
  const byX = (a, b) => a[0] - b[0], sp = spots.slice(0, idx.length).sort(byX), now = idx.slice().sort((a, b) => P.at[a][0] - P.at[b][0]);
  now.forEach((i, k) => { P.at[i] = sp[k]; });
  const want = idx.slice().sort((a, b) => P.at[a][1] - P.at[b][1] || [...box.children].indexOf(els[a]) - [...box.children].indexOf(els[b]));
  if (want.some((i, k) => box.children[k] !== els[i])) {
    const was = want.map((i) => getComputedStyle(els[i]).transform);
    want.forEach((i, k) => { els[i].style.transition = 'none'; box.appendChild(els[i]); els[i].style.transform = was[k] === 'none' ? '' : was[k]; });
    void box.getBoundingClientRect(); want.forEach((i) => { els[i].style.transition = ''; });
  }
  const lead = P.lead || [PK_FOL.x0, PK_FOL.y0], rank = idx.slice().sort((a, b) => Math.hypot(P.at[a][0] - lead[0], P.at[a][1] - lead[1]) - Math.hypot(P.at[b][0] - lead[0], P.at[b][1] - lead[1]));
  idx.forEach((i) => {
    const g = els[i], m = P.mid[i] * (face === 'left' ? -1 : 1);
    if (T) { g.style.transitionDuration = Math.max(0.2, T - 0.2) + 's'; g.style.transitionDelay = (0.12 * (rank.indexOf(i) + 1)) + 's'; }
    g.style.transform = pkXf(P.at[i][0] - m, P.at[i][1]);
  });
}
// called by enterFetch once the scene is drawn. Returns the followers ([] with one dog)
function pkFetchStart() {
  PKS.fetch = null; const l = pkDogs('fetch').slice(1); const svg = $('svg.world', view);
  if (!l.length || !svg || !$('#dogPos')) return [];
  l.forEach((d) => { const g = $(`#pack [data-dog="${d.id}"]`); if (g) g.remove(); }); // they leave their spots and join in
  const g = l.map((d) => `<g class="pk-fl" data-pkfl="${d.id}" style="transition:none;transform:${pkXf(PK_FOL.x0, PK_FOL.y0)}"><g class="pk-fart">${pkFolArt(d, 'idle', 'right')}</g></g>`).join('');
  $('#dogPos').insertAdjacentHTML('afterend', `<g id="pkFol" pointer-events="none">${g}</g>`); // drawn after the leader: a follower in the front row stands in front of it
  // measure the drawings: the leader's back and front halves, each follower's length and how far its middle sits from its box centre (facing right)
  const L = pkArtBox($('#dogArt')), lens = [], mid = [];
  l.forEach((d) => { const b = pkArtBox($(`#pkFol [data-pkfl="${d.id}"]`)); lens.push(b ? b[2] - b[0] : 120); mid.push(b ? (b[0] + b[2]) / 2 - PK_FOL.x0 : 0); });
  const zones = ['#houseG', '#bedG'].map((q) => pkArtBox($(q, svg))).filter(Boolean).map((b) => [b[0] - 6, b[2] + 6, b[3] - 40]); // feet clearly further back than its front: it would be drawn standing on it
  PKS.fetch = { dogs: l, lb: L ? clamp(PK_FOL.x0 - L[0], 60, 140) : 100, lf: L ? clamp(L[2] - PK_FOL.x0, 50, 140) : 90, len: Math.min(150, lens.reduce((a, b) => a + b, 0) / lens.length), mid, zones, xmin: S.place === 'yard' ? 226 : 30, at: l.map((d, i) => [i, 0]), lead: [F.dogX, F.dogY] };
  pkFolPlace(pkFolSpots(F.dogX, F.dogY, 1), 'right');
  void svg.getBoundingClientRect(); svg.querySelectorAll('#pkFol .pk-fl').forEach((e) => { e.style.transition = ''; });
  return l;
}
// the leader runs to (x, y) in T seconds: the others chase along and line up behind it there
function pkFetchRun(x, y, T, dir) {
  if (!PKS.fetch) return;
  const face = dir < 0 ? 'left' : 'right';
  PKS.fetch.dogs.forEach((d) => {
    const g = $(`#pkFol [data-pkfl="${d.id}"]`); if (!g) return;
    const art = g.querySelector('.pk-fart'); art.innerHTML = pkFolArt(d, 'walk', face); art.classList.add('pk-run'); g.dataset.face = face;
  });
  PKS.fetch.lead = [x, y]; pkFolPlace(pkFolSpots(x, y, dir), face, T);
}
function pkFetchRest(pose) {
  if (!PKS.fetch) return;
  PKS.fetch.dogs.forEach((d) => { const g = $(`#pkFol [data-pkfl="${d.id}"]`); if (!g) return; const art = g.querySelector('.pk-fart'); art.classList.remove('pk-run'); art.innerHTML = pkFolArt(d, pose, g.dataset.face || 'right'); });
}

/* ---------------- Walks ---------------- */
// enterWalk calls this once the leader may go. PKS.walk holds the followers; the "stays home" lines for the dogs that cannot go come from walkPackNote
function pkWalkPlan(area) {
  PKS.walk = null; if (!crPack()) return null;
  const l = pkDogs('walk', area), skip = PKS.skip.slice();
  if (l.length > 1) PKS.walk = { dogs: l.slice(1), area };
  pkSkipSay(skip, 1200 + others().filter((o) => walkBlock(o, area)).slice(0, 3).length * 1700, 'walk');
  return PKS.walk;
}
const pkWalkers = () => (PKS.walk ? PKS.walk.dogs : []);
// the walk ends (or never started): hand back the followers and forget them
function pkWalkEnd() { const l = pkWalkers(); PKS.walk = null; return l; }
// the shortest walk among the walkers (3 to 6 month olds walk x0.7)
const pkWalkScale = () => Math.min(walkScale(), ...pkWalkers().map((d) => walkScale(d)));
// one walk's coins plus the pack bonus when 2 or more dogs walk
function pkWalkCoins(base) { return pkWalkers().length ? base + Math.floor(base * PK_BONUS) : base; }
// the runner's looks for the followers (mods/walkrun.js o.pack)
const pkWalkLooks = () => pkWalkers().map((d) => withDog(d, dogForMod));
// the followers' share of a finished runner walk (18_mod_walk_toys finishWalkMod). Returns the followers, or [] for a one-dog walk
function pkWalkDone(r, e) {
  const fl = pkWalkEnd(); if (!fl.length) return fl;
  fl.forEach((d) => withDog(d, () => {
    pottyWalked();
    const rc = e.weather === 'rain' && hasRaincoat();
    addStat('happy', Math.round((+r.happiness || 0) + (rc ? 5 : 0)));
    if ((+r.bond || 0) > 0) addBond(+r.bond);
    addStat('energy', -Math.abs(+r.energy || 0) * (buffOn('cool') ? 0.75 : 1));
    let cl = Math.abs(+r.cleanliness || 0); if (rc) cl = 0; else if (e.weather === 'rain') cl += 5; addStat('clean', -cl);
  }));
  return fl;
}
// the same for the classic walk (09_walk_classic endWalk): the numbers the leader got
function pkWalkDoneClassic(happy, bond, clean, energy) {
  const fl = pkWalkEnd(); if (!fl.length) return fl;
  fl.forEach((d) => withDog(d, () => { pottyWalked(); addStat('happy', happy); if (bond > 0) addBond(bond); addStat('clean', -clean); addStat('energy', -energy); }));
  return fl;
}
const pkWalkLine = (fl) => (fl.length ? `<p class="small pk-walked">${esc(tt('packplay.walked_along', '{names} walked along and got the Happiness and Bond too. Pack bonus: +10% coins.', { names: crNames(fl) }))}</p>` : '');

// the route screen (17_walk_route_carousel): the chip row, then the dogs that really go, heads in a line behind the leader
function pkRoutesHTML() { return crPack() ? `<div class="pk-walkrow" id="pkWalkRow">${crChipsHTML(PK_CAP_WALK)}<div class="pk-walkline" id="pkWalkLine"></div></div>` : ''; }
function pkRoutesLine() {
  const el = $('#pkWalkLine', view); if (!el) return;
  const k = ROUTE_KEYS[routeIdx], l = pkDogs('walk', k), skip = PKS.skip.slice();
  const bDogs = crDogs().filter((d) => d !== S.dog && walkBlock(d, k) && !(typeof hmMumIn === 'function' && hmMumIn(d))), blocked = bDogs.map((d) => walkBlock(d, k));
  const fol = l.slice(1), heads = l.map((d, i) => `<span class="pk-lh${i ? ' pk-fol' : ''}" aria-hidden="true">${headSVG(d)}</span>`).join('');
  const who = fol.length ? tt('packplay.leads_behind', '{name} leads. {names} {n, plural, one {follows} other {follow}} behind.', { name: NAME(), names: crNames(fol), n: fol.length }) : tt('packplay.walks_alone', '{name} walks alone.', { name: NAME() });
  const full = who + [...blocked, ...pkSkipLines(skip)].map((t) => ' ' + t).join('');
  el.innerHTML = `<div class="pk-heads" role="img" aria-label="${esc(tt('packplay.walk_line', '{names} {n, plural, one {walks} other {walk}} in a line', { names: crNames(l), n: l.length }))}">${heads}</div><p class="small pk-who">${esc(full)}</p>`;
  if (isPhone()) { pkWhoFit($('.pk-who', el), full, l, bDogs.concat(skip.map((x) => x.d))); pkRoutesFit(); }
}
// phones with a pack: the chip row and the who line take room from the card's viewport. The text under the preview is measured, the preview takes what is left
// (at least 90 px tall, as before) and the screen scrolls when that does not fit, so the card's last line and its border are never cut off
function pkRoutesFit() {
  const rt = $('.routes', view), cards = rt ? [...rt.querySelectorAll('.rt-card')] : []; if (!cards.length) return;
  const rest = Math.max(...cards.map((c) => { const pv = $('.rt-prev', c); return c.offsetHeight - (pv ? pv.offsetHeight : 0); }));
  if (!(rest > 0)) return;
  rt.style.setProperty('--pk-rest', Math.ceil(rest) + 'px'); rt.style.setProperty('--pk-rth', Math.ceil(rest + 90 + 13) + 'px');
}
// phones: the who line stays on one line, so the route card above keeps its room. The longest summary that fits wins (the full lines come as toasts when the walk starts)
function pkWhoFit(p, full, l, stay) {
  if (!p) return;
  const lead = l[0].name, fol = l.slice(1), n = l.length, s = stay.length;
  const alone = tt('packplay.walks_alone', '{name} walks alone.', { name: lead });
  const stayA = s ? ' ' + tt('packplay.stay_home', '{names} {n, plural, one {stays} other {stay}} home.', { names: crNames(stay), n: s }) : '';
  const stayB = s ? ' ' + (s === 1 ? tt('packplay.stays_home', '{name} stays home.', { name: stay[0].name }) : tt('packplay.n_stay_home', '{n} stay home.', { n: s })) : '';
  const walk = fol.length ? (fol.length === 1 ? tt('packplay.two_walk', '{lead} and {name} walk.', { lead, name: fol[0].name }) : tt('packplay.more_walk', '{lead}, {name} and {n} more.', { lead, name: fol[0].name, n: fol.length - 1 })) : alone;
  const many = n > 1 ? tt('packplay.dogs_walk', '{n, plural, one {# dog walks.} other {# dogs walk.}}', { n }) : alone;
  const tries = [full, (fol.length ? tt('packplay.leads_follow', '{name} leads. {names} {n, plural, one {follows} other {follow}}.', { name: lead, names: crNames(fol), n: fol.length }) : alone) + stayA, walk + stayA, walk + stayB, many + stayB, walk, many];
  p.classList.add('pk-one'); p.title = full;
  for (const t of tries) { p.textContent = t; if (p.scrollWidth <= p.clientWidth + 1) return; }
}
function pkRoutesBind() {
  const redraw = () => { const row = $('#pkWalkRow', view); if (!row) return; row.innerHTML = `${crChipsHTML(PK_CAP_WALK)}<div class="pk-walkline" id="pkWalkLine"></div>`; crBindChips(row, redraw, tt('packplay.need_walker', 'Somebody has to come along. Tick another dog first.')); pkRoutesLine(); };
  const row = $('#pkWalkRow', view); if (row) crBindChips(row, redraw, tt('packplay.need_walker', 'Somebody has to come along. Tick another dog first.'));
}

/* ---------------- the long press: Make leader, Dress, Train ---------------- */
const PK_HOLD_MS = 600, PK_HOLD_MOVE = 10;
const pkHeld = () => PKS.lp;
function pkHold(el, d) {
  if (!el || !d || el._pkHold) return; el._pkHold = true; // bindPack binds every pack dog again after each redraw: once per element
  let t = 0, x0 = 0, y0 = 0; const stop = () => { clearTimeout(t); t = 0; };
  el.setAttribute('aria-label', tt('packplay.hold_more', '{label}. Press and hold for more.', { label: el.getAttribute('aria-label') || d.name }));
  el.addEventListener('pointerdown', (e) => {
    PKS.lp = false; stop(); x0 = e.clientX; y0 = e.clientY;
    t = setTimeout(() => { t = 0; if (cur.mode !== 'yard') return; PKS.lp = true; pkCardOpen(d.id, x0, y0); }, PK_HOLD_MS);
  });
  el.addEventListener('pointermove', (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > PK_HOLD_MOVE) stop(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => el.addEventListener(n, stop));
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); stop(); PKS.lp = true; if (cur.mode === 'yard') pkCardOpen(d.id, e.clientX, e.clientY); }); // right click and the long press menu of some browsers
  el.addEventListener('keydown', (e) => { if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) { e.preventDefault(); const r = el.getBoundingClientRect(); pkCardOpen(d.id, r.left + r.width / 2, r.top + r.height / 3); } });
}
function pkCardClose() {
  const c = PKS.card; if (!c) return; PKS.card = null;
  document.removeEventListener('pointerdown', c.away, true); document.removeEventListener('keydown', c.key, true); c.el.remove();
}
function pkCardOpen(id, cx, cy) {
  const d = dogById(id); if (!d || !crPack() || busy || !modal.hidden) return;
  pkCardClose(); SFX.init(); SFX.boop(600);
  const el = document.createElement('div'); el.id = 'pkCard'; el.className = 'pk-dogcard'; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', tt('packplay.card_choose', '{name}: choose', { name: d.name }));
  el.innerHTML = `<b class="pk-dogcard-n">${esc(d.name)}</b><button class="btn" role="menuitem" data-pkact="lead">${esc(tt('packplay.make_leader', 'Make leader'))}</button><button class="btn" role="menuitem" data-pkact="dress">${esc(tt('packplay.dress', 'Dress'))}</button><button class="btn" role="menuitem" data-pkact="train">${esc(tt('packplay.train', 'Train'))}</button>`;
  stage.appendChild(el);
  const sg = stage.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = clamp(cx - sg.left - w / 2, 6, Math.max(6, sg.width - w - 6)) + 'px'; el.style.top = clamp(cy - sg.top - h - 14, 6, Math.max(6, sg.height - h - 6)) + 'px';
  const act = { lead: () => pkLead(id), dress: () => openWardrobe(id), train: () => pkTrain(id) };
  el.querySelectorAll('[data-pkact]').forEach((b) => { b.onclick = () => { SFX.click(); pkCardClose(); act[b.dataset.pkact](); }; });
  const away = (e) => { if (!el.contains(e.target)) pkCardClose(); };
  const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); pkCardClose(); } };
  PKS.card = { el, away, key };
  setTimeout(() => { if (PKS.card && PKS.card.el === el) { document.addEventListener('pointerdown', away, true); document.addEventListener('keydown', key, true); const f = el.querySelector('.btn'); if (f) f.focus({ preventScroll: true }); } }, 0);
}
on('yard:enter', pkCardClose);

/* ---------------- test hook ---------------- */
const pkActs = {}; on('act', (e) => { pkActs[e.kind] = (pkActs[e.kind] || 0) + 1; }); // how many times each action was tracked (one per action, never one per dog)
function pkExpose() {
  if (!window.__paw) return;
  window.__paw.pk = {
    dogs: (kind, area) => pkDogs(kind, area).map((d) => d.id), skip: () => PKS.skip.map((s) => [s.d.id, s.why]), pick: (sel) => pkPickHTML(sel),
    lead: (id) => pkLead(id), train: (id) => pkTrain(id), tricks: () => pkTricksTray(), card: (id) => pkCardOpen(id, 400, 300), cardClose: () => pkCardClose(),
    swapped: () => !!PKS.sw, walkers: () => pkWalkers().map((d) => d.id), plan: (area) => { const w = pkWalkPlan(area); return w ? w.dogs.map((d) => d.id) : []; },
    acts: () => Object.assign({}, pkActs), coins: (n) => pkWalkCoins(n), fetchFollowers: () => (PKS.fetch ? PKS.fetch.dogs.map((d) => d.id) : []),
  };
}
on('game:ready', () => setTimeout(pkExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.pk) pkExpose(); });
setTimeout(pkExpose, 0);
