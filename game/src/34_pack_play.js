/* ======================= v2.9 PACK lane (tag pk): pack play and walks. See V29.md sections 1 and 5 =======================
   Every tray that acts on dogs uses the v2.7 chip row (crChipsHTML / crBindChips / crDogs, ticked = joins in). The leader (S.activeId) never changes
   unless the player picks "Make leader". With one dog, or under prefs.crOne, everything is v2.8.4 exactly. The PACK lane owns this file. */

// runtime only (V29.md 5.1: no save field). walk: the followers of the walk that is starting or running. sw: a long screen runs for another dog. skip: why the last pkDogs left a dog out
const PKS = { walk: null, sw: null, skip: [], lp: false, fetch: null, card: null };
const PK_BONUS = 0.1; // pack walk bonus: +10% of one walk's coins (rounded down) when 2 or more dogs walk (V29.md 5.4)
const PK_CAP_PLAY = 'Ticked dogs join in. The leader always plays.';
const PK_CAP_WALK = 'Ticked dogs come along. The leader leads.';

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
const pkIs = (l) => (l.length > 1 ? 'are' : 'is');
function pkSkipLines(skip) {
  const tired = skip.filter((s) => s.why === 'tired').map((s) => s.d), zz = skip.filter((s) => s.why === 'asleep').map((s) => s.d), out = [];
  if (tired.length) out.push(`${crNames(tired)} ${pkIs(tired)} pooped and ${tired.length > 1 ? 'nap' : 'naps'} this one out.`);
  if (zz.length) out.push(`${crNames(zz)} ${pkIs(zz)} asleep and ${zz.length > 1 ? 'stay' : 'stays'} put.`);
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
  const chips = crPresent().map((d) => `<button class="chip cr-chip on pk-pickb" data-pkdog="${d.id}" aria-pressed="${d.id === sel}" aria-label="${esc(d.name)}${d.sleeping ? ', asleep' : ''}"><span class="cr-head" aria-hidden="true">${headSVG(d)}</span><span class="cr-name">${esc(d.name)}</span>${d.sleeping ? '<span class="cr-zz" aria-hidden="true">zz</span>' : ''}</button>`).join('');
  return `<div class="cr-wrap pk-pickwrap"><div class="pk-pick" role="group" aria-label="${esc(label || 'Pick a dog')}">${chips}</div></div>`;
}
function pkBindPick(root, fn) {
  (root || dock).querySelectorAll('[data-pkdog]').forEach((b) => { b.onclick = () => { SFX.init(); SFX.click(); fn(b.dataset.pkdog); }; });
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
    if (busy) { nope(`Hold on, ${NAME()} is busy.`); return; }
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
  if (d.sleeping) { nope(`${d.name} is asleep. Training can wait.`); return; }
  const tb = trainBlock(d); if (tb) { nope(tb); return; }
  if (busy && d.id !== S.activeId) { nope(`Hold on, ${NAME()} is busy.`); return; }
  pkWith(id, () => { openTraining(); return !!TRN; });
}
// the Tricks card with a pack: pick the dog inside the tray
function pkTricksTray() {
  setTray('Tricks: who trains?', `${pkPickHTML(S.activeId, 'Who trains')}<p class="small pk-cap">Tap a dog to train. ${esc(NAME())} stays the leader.</p>`);
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
// the pack dogs that join in. Tug: they crouch at the far end of the rope and pull (class pk-tug)
function pkPlayStart(crew, tug) {
  const t = performance.now() + 2600;
  crew.forEach((d) => {
    packNext[d.id] = Math.max(packNext[d.id] || 0, t); packPose[d.id] = tug ? 'crouch' : 'happy'; redrawPackDog(d);
    if (tug) { const g = $(`#pack [data-dog="${d.id}"]`); if (g) g.classList.add('pk-tug'); }
  });
}
function pkPlayEnd(crew) { crew.forEach((d) => { packPose[d.id] = 'happy'; if (cur.mode === 'yard' && !d.sleeping) redrawPackDog(d); }); }
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
const PK_FOL = { x0: 430, y0: 500, sc: 0.62, gap: 78 }; // the dog box's feet are at (430, 500); followers are drawn at 62%
const pkXf = (fx, fy) => `translate(${(fx - PK_FOL.x0 * PK_FOL.sc).toFixed(1)}px, ${(fy - PK_FOL.y0 * PK_FOL.sc).toFixed(1)}px) scale(${PK_FOL.sc})`;
function pkFolArt(d, pose, face) { return place(dogSVG(d, { pose, outfit: typeof shSleepOutfit === 'function' ? shSleepOutfit(d, pose) : outfitOf(d), facing: face }), DX, DY, DW, DH); }
// called by enterFetch once the scene is drawn. Returns the followers ([] with one dog)
function pkFetchStart() {
  PKS.fetch = null; const l = pkDogs('fetch').slice(1); const svg = $('svg.world', view);
  if (!l.length || !svg || !$('#dogPos')) return [];
  l.forEach((d) => { const g = $(`#pack [data-dog="${d.id}"]`); if (g) g.remove(); }); // they leave their spots and join in
  const g = l.map((d, i) => `<g class="pk-fl" data-pkfl="${d.id}" style="transform:${pkXf(PK_FOL.x0 - PK_FOL.gap * (i + 1), PK_FOL.y0 + (i % 2 ? 8 : -4))}"><g class="pk-fart">${pkFolArt(d, 'idle', 'right')}</g></g>`).join('');
  $('#dogPos').insertAdjacentHTML('beforebegin', `<g id="pkFol" pointer-events="none">${g}</g>`);
  PKS.fetch = { dogs: l }; return l;
}
// the leader runs to (x, y) in T seconds: the others chase a little behind it
function pkFetchRun(x, y, T, dir) {
  if (!PKS.fetch) return;
  const face = dir < 0 ? 'left' : 'right';
  PKS.fetch.dogs.forEach((d, i) => {
    const g = $(`#pkFol [data-pkfl="${d.id}"]`); if (!g) return;
    const art = g.querySelector('.pk-fart'); art.innerHTML = pkFolArt(d, 'walk', face); art.classList.add('pk-run'); g.dataset.face = face;
    g.style.transitionDuration = Math.max(0.2, T - 0.2) + 's'; g.style.transitionDelay = (0.12 * (i + 1)) + 's';
    g.style.transform = pkXf(clamp(x - dir * PK_FOL.gap * (i + 1), 50, 950), clamp(y + (i % 2 ? 12 : -6), 430, 585));
  });
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
const pkWalkLine = (fl) => (fl.length ? `<p class="small pk-walked">${esc(crNames(fl))} walked along and got the Happiness and Bond too. Pack bonus: +10% coins.</p>` : '');

// the route screen (17_walk_route_carousel): the chip row, then the dogs that really go, heads in a line behind the leader
function pkRoutesHTML() { return crPack() ? `<div class="pk-walkrow" id="pkWalkRow">${crChipsHTML(PK_CAP_WALK)}<div class="pk-walkline" id="pkWalkLine"></div></div>` : ''; }
function pkRoutesLine() {
  const el = $('#pkWalkLine', view); if (!el) return;
  const k = ROUTE_KEYS[routeIdx], l = pkDogs('walk', k), skip = PKS.skip.slice();
  const blocked = crDogs().filter((d) => d !== S.dog && walkBlock(d, k) && !(typeof hmMumIn === 'function' && hmMumIn(d))).map((d) => walkBlock(d, k));
  const fol = l.slice(1), heads = l.map((d, i) => `<span class="pk-lh${i ? ' pk-fol' : ''}" aria-hidden="true">${headSVG(d)}</span>`).join('');
  const who = fol.length ? `${esc(NAME())} leads. ${esc(crNames(fol))} ${fol.length > 1 ? 'follow' : 'follows'} behind.` : `${esc(NAME())} walks alone.`;
  el.innerHTML = `<div class="pk-heads" role="img" aria-label="${esc(crNames(l))} walk${l.length > 1 ? '' : 's'} in a line">${heads}</div><p class="small pk-who">${who}${[...blocked, ...pkSkipLines(skip)].map((t) => ' ' + esc(t)).join('')}</p>`;
}
function pkRoutesBind() {
  const redraw = () => { const row = $('#pkWalkRow', view); if (!row) return; row.innerHTML = `${crChipsHTML(PK_CAP_WALK)}<div class="pk-walkline" id="pkWalkLine"></div>`; crBindChips(row, redraw); pkRoutesLine(); };
  const row = $('#pkWalkRow', view); if (row) crBindChips(row, redraw);
}

/* ---------------- the long press: Make leader, Dress, Train ---------------- */
const PK_HOLD_MS = 600, PK_HOLD_MOVE = 10;
const pkHeld = () => PKS.lp;
function pkHold(el, d) {
  if (!el || !d || el._pkHold) return; el._pkHold = true; // bindPack binds every pack dog again after each redraw: once per element
  let t = 0, x0 = 0, y0 = 0; const stop = () => { clearTimeout(t); t = 0; };
  el.setAttribute('aria-label', `${el.getAttribute('aria-label') || d.name}. Press and hold for more.`);
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
  const el = document.createElement('div'); el.id = 'pkCard'; el.className = 'pk-dogcard'; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', `${d.name}: choose`);
  el.innerHTML = `<b class="pk-dogcard-n">${esc(d.name)}</b><button class="btn" role="menuitem" data-pkact="lead">Make leader</button><button class="btn" role="menuitem" data-pkact="dress">Dress</button><button class="btn" role="menuitem" data-pkact="train">Train</button>`;
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
