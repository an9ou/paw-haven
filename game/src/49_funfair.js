/* ======================= v2.18 FUN FAIR (V218.md, tag ff, test hook window.__paw.ff, ffOn()) =======================
   More ways to earn coins and new minigames; walks stay the main income (V218.md 7). Nothing bad ever happens: a slower or clumsier round just
   earns less, a pinecone bounces off, a missed door is delivered by Grandpa Joe, a wrong box says "keep sniffing".
   This file: the switch, the caps table (FF_CAPS, the one place for every v2.18 coin cap), the save (S.ff, v218Fields in 00_core.js), the place
   buttons and the game cards, the game frame (mode 'fair': a field in #view, rAF with time deltas, sprites moved by transforms, the dog drawn
   once per pose through dogArtSafe), the result card, the stickers (two Fun Fair pages in the v2.17 sticker book), the Saturday market stall,
   the weekly photo contest and the neighbour's thank-you letter. The eight games themselves are in 49b_ff_games.js (FF_DEF).
   Under the test harness everything needs prefs.ffTest (the older suites never see it).
   API
     ffOn()                 the Fun Fair is on (prefs.ffTest under the harness)
     ffLeft(k)              coins game k can still pay today (week for the photo contest, the Saturday for the stall)
     ffStart(k)             start game k here (false when it cannot: place, Bond, Energy, asleep)
     ffCards()              the game cards of this place (modal)
     ffStall()              the Saturday market stall (modal)
     ffPhotoEnter(cap)      photo mode: enter the shown photo in this week's contest */
function ffOn() { return !navigator.webdriver || !!prefs.ffTest; }
// the one caps table (real coins, no BOOST, like ball play): day = the daily cap, round = the most one round pays, en = Energy a round costs.
// The stall pays on Saturdays only (40 that day) and the photo contest once a week (up to 30): about 6 and 4 a day over a week.
const FF_CAPS = {
  catch: { day: 20, round: 10, en: 5 }, bubble: { day: 15, round: 8, en: 5 }, seek: { day: 15, round: 10, en: 4 }, show: { day: 20, round: 10, en: 4 }, kite: { day: 15, round: 8, en: 5 },
  paper: { day: 15, round: 15, en: 6 }, bakery: { day: 15, round: 15, en: 3 }, wash: { day: 10, round: 10, en: 4 },
  stall: { week: 40 }, photo: { week: 30 }
};
// where each game lives, its Bond (topBond, like the places), the person in town who runs it
const FF_GAMES = {
  catch: { place: 'park', bond: 1 }, bubble: { place: 'pool', bond: 3 }, seek: { place: 'yard', bond: 2 }, show: { place: 'square', bond: 4, who: 'plum' }, kite: { place: 'fujihill', bond: 5 },
  paper: { place: 'square', bond: 2, job: true, who: 'joe' }, bakery: { place: 'cafe', bond: 2, job: true, who: 'bea' }, wash: { place: 'yard', bond: 3, job: true, who: 'tanaka' }
};
const FF_KEYS = Object.keys(FF_GAMES);
const FF_BOND = 3, FF_HAPPY = 5; // every round: addBond(3) (x the BOOST), +5 Happiness
const FF = { g: null, defs: null };
const ffReady = () => !!(S && S.ff && S.dogs && S.dogs.length && ffOn());

/* ---------------- names (all through tt) ---------------- */
function ffName(k) {
  switch (k) {
    case 'catch': return tt('ff.n_catch', 'Treat Catch');
    case 'bubble': return tt('ff.n_bubble', 'Bubble Pop');
    case 'seek': return tt('ff.n_seek', 'Sniff & Seek');
    case 'show': return tt('ff.n_show', 'Dog Show Pose');
    case 'kite': return tt('ff.n_kite', 'Kite Day');
    case 'paper': return tt('ff.n_paper', 'Newspaper round');
    case 'bakery': return tt('ff.n_bakery', 'Bakery helper');
    case 'wash': return tt('ff.n_wash', 'Neighbour dog wash');
    case 'stall': return tt('ff.n_stall', 'Saturday market stall');
    default: return tt('ff.n_photo', 'Weekly photo contest');
  }
}
function ffAbout(k) {
  switch (k) {
    case 'catch': return tt('ff.a_catch', 'Treats drop from the big tree. Move your dog left and right to catch them. Pinecones just bounce off.');
    case 'bubble': return tt('ff.a_bubble', 'Tap where your dog should jump to pop the soap bubbles. Golden bubbles are worth more.');
    case 'seek': return tt('ff.a_seek', 'A toy hides under a crayon box and the boxes shuffle. Watch your dog sniff, then tap the box its nose likes best.');
    case 'show': return tt('ff.a_show', 'Mrs. Plum shows a pose card. Remember the tricks, then tap them in the same order.');
    case 'kite': return tt('ff.a_kite', 'Hold to lift the kite, let go to let it drift down. Your dog runs underneath while you collect clouds and leaves.');
    case 'paper': return tt('ff.a_paper', 'Help Grandpa Joe with his paper round. Tap when your dog is by a door to drop off the paper.');
    case 'bakery': return tt('ff.a_bakery', 'Help Baker Bea sort her oat and pumpkin dog biscuits by shape before the crayon line runs out.');
    case 'wash': return tt('ff.a_wash', 'The Tanakas\' dog is visiting. Scrub, rinse and towel them dry with the bath tools.');
    case 'stall': return tt('ff.a_stall', 'On Saturdays you can set out garden veggies and home-cooked snacks at a stall on Market Street. Dogs are family, never stall goods.');
    default: return tt('ff.a_photo', 'Enter three photos from photo mode each week. Ms. Patel judges them kindly and everyone gets a ribbon.');
  }
}
function ffWho(k) {
  switch ((FF_GAMES[k] || {}).who) {
    case 'plum': return tt('ff.who_plum', 'Mrs. Plum');
    case 'joe': return tt('ff.who_joe', 'Grandpa Joe');
    case 'bea': return tt('ff.who_bea', 'Baker Bea');
    case 'tanaka': return tt('ff.who_tanaka', 'the Tanakas');
    default: return '';
  }
}
const FF_ICON = { catch: 'Treat Jar', bubble: 'Golden Bubble', seek: 'Crayon Box', show: 'Show Ribbon', kite: 'Paper Kite', paper: 'Rolled Newspaper', bakery: 'Biscuit Tin', wash: 'Wash Sponge', stall: 'Market Basket', photo: 'Photo Contest Ribbon' };

/* ---------------- the day, the week, the caps ---------------- */
const ffWeekOf = (iso) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localISO(d); };
function ffToday() { const F = S.ff, t = localISO(); if (F.day !== t) { F.day = t; F.c = {}; markDirty(); } return F; }
function ffLeft(k) {
  if (!S || !S.ff) return 0;
  if (k === 'stall') { const m = S.ff.mk; return m.day === localISO() ? Math.max(0, FF_CAPS.stall.week - m.coins) : FF_CAPS.stall.week; }
  if (k === 'photo') { const p = S.ff.pc; return p.wk === ffWeekOf(localISO()) && p.judged ? 0 : FF_CAPS.photo.week; }
  const F = ffToday(), C = FF_CAPS[k]; return C ? Math.max(0, C.day - (F.c[k] || 0)) : 0;
}
// pays at most what the round and the day allow; raw coins (the caps are real coins). Returns what it paid
function ffPay(k, want) {
  const C = FF_CAPS[k], n = Math.max(0, Math.min(Math.round(want), C.round, ffLeft(k)));
  if (n > 0) { addCoins(n, { raw: true }); const F = ffToday(); F.c[k] = (F.c[k] || 0) + n; markDirty(); }
  return n;
}
// the Saturday stall: the dev Day select pins it in tests (prefs.ffSat)
const ffSaturday = () => (prefs.ffSat === undefined || prefs.ffSat === null ? new Date().getDay() === 6 : !!prefs.ffSat);

/* ---------------- unlocks (the level-up card and the Bond track) ---------------- */
function ffUnlocks(L) { return ffReady() ? FF_KEYS.filter((k) => FF_GAMES[k].bond === L && L > 1).map((k) => tt('ff.unlock', 'Fun Fair: {game}', { game: ffName(k) })) : []; }

/* ---------------- the place buttons and the game cards ---------------- */
function ffHere(place) { const p = place || (S && S.place); return FF_KEYS.filter((k) => FF_GAMES[k].place === p && ffPlaceOk(k)).concat(p === 'market' ? ['stall'] : [], p === 'square' ? ['photo'] : []); }
function ffPlaceOk(k) { return !!PLACES[FF_GAMES[k].place] || FF_GAMES[k].place === 'yard'; }
function ffBtnLabel(list) {
  if (list.length === 1) return ffName(list[0]);
  if (S.place === 'yard') return tt('ff.btn_yard', 'Yard games');
  return tt('ff.btn_fair', 'Fun Fair');
}
function ffPlaceBtn() {
  const pb = $('#placeBtns'); if (!pb) return; pb.querySelectorAll('[data-ff]').forEach((b) => b.remove());
  if (!ffReady() || cur.mode !== 'yard' && cur.mode !== 'market') return;
  const list = ffHere(); if (!list.length) return;
  const html = `<button class="btn yes ff-pbtn" data-ff="open">${esc(ffBtnLabel(list))}</button>`, home = pb.querySelector('[data-pb="yard"]');
  if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html);
  pb.querySelector('[data-ff]').onclick = () => { SFX.boop(700); ffCards(); };
}
on('yard:enter', () => { if (ffReady()) setTimeout(() => { try { ffPlaceBtn(); ffContestCheck(); } catch (e) { /* the place changed */ } }, 0); });
on('scene:redraw', () => { if (ffReady() && !$('#placeBtns [data-ff]')) ffPlaceBtn(); });

function ffCardHTML(k) {
  const g = FF_GAMES[k], lock = g && topBond() < g.bond, who = ffWho(k);
  const C = FF_CAPS[k], left = ffLeft(k);
  let line;
  if (k === 'stall') line = ffSaturday() ? tt('ff.stall_open', 'Open today. Up to {cap} coins this Saturday, {left} still to earn.', { cap: C.week, left }) : tt('ff.stall_closed', 'The stall opens on Saturdays.');
  else if (k === 'photo') line = ffContestLine();
  else line = left ? tt('ff.left', 'Coins today: {got} of {cap}', { got: C.day - left, cap: C.day }) : tt('ff.left_none', 'All {cap} coins earned today. Playing is still fun, and still gives Bond.', { cap: C.day });
  const btn = lock ? `<button class="btn" data-ffgo="${k}" aria-disabled="true">${esc(tt('ff.locked', 'Opens at Bond {bond}', { bond: g.bond }))}</button>`
    : k === 'photo' ? `<button class="btn yes" data-ffgo="photo">${esc(tt('ff.photo_go', 'Take a photo'))}</button>`
    : `<button class="btn yes" data-ffgo="${k}">${esc(k === 'stall' ? tt('ff.stall_go', 'Open the stall') : g && g.job ? tt('ff.job_go', 'Start the job') : tt('ff.play', 'Play'))}</button>`;
  return `<li class="ff-card${lock ? ' locked' : ''}" data-k="${k}"><span class="ff-cic" aria-hidden="true">${art('item', FF_ICON[k])}</span><div class="ff-ctx"><b>${esc(ffName(k))}</b>${who ? `<span class="small ff-who">${esc(tt('ff.with', 'with {who}', { who }))}</span>` : ''}<span class="small">${esc(ffAbout(k))}</span><span class="small ff-cl">${esc(line)}</span></div>${btn}</li>`;
}
function ffCards() {
  if (!ffReady()) return; if (busy) { nope(tt('ff.busy', '{name} is busy right now. Try the Fun Fair in a moment.', { name: NAME() })); return; }
  const list = ffHere(); if (!list.length) return;
  const p = openModal(esc(ffBtnLabel(list)), `<ul class="ff-cards">${list.map(ffCardHTML).join('')}</ul>`, { cls: 'ff-pop' });
  p.querySelectorAll('[data-ffgo]').forEach((b) => { b.onclick = () => {
    const k = b.dataset.ffgo;
    if (b.getAttribute('aria-disabled') === 'true') { nope(tt('ff.locked_line', '{game} opens at Bond {bond}.', { game: ffName(k), bond: FF_GAMES[k].bond })); return; }
    SFX.boop(840);
    if (k === 'stall') { closeModal(); ffStall(); return; }
    if (k === 'photo') { closeModal(); if (typeof phOpen === 'function' && !phOpen()) nope(tt('ff.photo_cant', 'Photo mode opens from the camera button in a place with your dog.')); return; }
    if (ffCan(k, true)) { closeModal(); ffStart(k); }
  }; });
}
// can game k start now? quiet = false shows why not
function ffCan(k, loud) {
  const g = FF_GAMES[k], d = D(), why = !g ? 'none' : topBond() < g.bond ? tt('ff.locked_line', '{game} opens at Bond {bond}.', { game: ffName(k), bond: g.bond })
    : S.sleeping || d.sleeping ? tt('ff.asleep', '{name} is asleep. The Fun Fair can wait.', { name: d.name })
    : ageMonths(d) < 3 ? tt('ff.young', '{name} is a bit little for this. Watching is fun too.', { name: d.name })
    : (S.stats.energy || 0) < FF_CAPS[k].en + 5 ? tt('ff.tired', '{name} is too tired to play. A nap would help.', { name: d.name })
    : k === 'wash' && S.ff.wash.day === localISO() ? tt('ff.wash_done', '{dog} has had a wash today. Come back tomorrow.', { dog: ffWashDog().name }) : '';
  if (why && loud && why !== 'none') nope(why);
  return !why;
}

/* ---------------- the game frame (mode 'fair') ---------------- */
// the field: W = 1000 units wide, H from the view's shape (a phone gets a tall field); sprites are divs moved by translate3d
function ffStart(k) {
  if (!ffReady() || !FF_GAMES[k] || busy || !['yard', 'market', 'fair'].includes(cur.mode) || !ffCan(k)) return false; // from a place (or Play again), never from a walk, the map or a shop
  go('fair', k); return cur.mode === 'fair';
}
function enterFair(k) {
  const def = ffDefs()[k]; if (!def) { go('yard'); return; }
  const d = D(), place = S.place;
  setChrome(true, false); stage.classList.add('ffmode'); busy = true;
  try { rmPause('fair'); } catch (e) { /* none */ }
  const sw = typeof grOn === 'function' && grOn(place) && grFloor(place) ? grFloor(place).w : 1000;
  let tph = 'day', twx = 'sunny'; try { tph = timePhase(); twx = weatherNow(); } catch (e) { /* day */ }
  view.innerHTML = `<div class="ff-game" data-g="${k}" data-t="${tph}" data-w="${twx}"><div class="ff-top"><div class="ff-th"><h3>${esc(ffName(k))}</h3><span class="ff-sc" id="ffSc" aria-live="polite"></span></div>
    <div class="ff-time" aria-hidden="true"><svg viewBox="0 0 400 14" preserveAspectRatio="none"><path class="ff-tl0" d="M4 8 Q100 4 200 8 T396 7"/><path class="ff-tl" id="ffTl" d="M4 8 Q100 4 200 8 T396 7" pathLength="100"/></svg></div>
    <button class="btn ff-done" id="ffDone">${esc(tt('ff.done', 'Done'))}</button></div>
    <div class="ff-play" id="ffPlay"><div class="ff-bg" aria-hidden="true"><svg viewBox="0 0 ${sw} 600" preserveAspectRatio="xMidYMax slice">${sceneArt(place, envNow(), place === 'yard' ? { patch: gkOn() ? patchState() : 'empty' } : mpSceneOpts(place))}</svg></div>
    <div class="ff-field" id="ffField"></div><p class="ff-hint" id="ffHint"></p><div class="ff-end" id="ffEnd" hidden></div></div></div>`;
  const play = $('#ffPlay'), field = $('#ffField');
  const G = FF.g = { k, d, def, play, field, W: isPhone() ? 560 : 1000, H: 600, sc: 1, t: 0, dur: def.dur || 0, score: 0, over: false, dead: false, last: 0, raf: 0, spr: [], tok: Date.now(), hold: false, ptr: null, data: {} };
  let pre = ''; try { pre = def.scoreText ? def.scoreText(G) : ''; } catch (e) { pre = ''; } ffScore(G, pre || tt('ff.score', 'Score: {n}', { n: 0 })); // the header gets its text before the field is measured
  ffFit(G); def.init(G); ffScore(G); ffHint(G, def.hint(G));
  const pt = (e) => { const r = field.getBoundingClientRect(); return { x: (e.clientX - r.left) / G.sc, y: (e.clientY - r.top) / G.sc }; };
  play.addEventListener('pointerdown', (e) => { if (G.over || e.target.closest('.ff-end, button')) return; SFX.init(); G.hold = true; G.ptr = pt(e); try { play.setPointerCapture(e.pointerId); } catch (er) { /* none */ } if (def.down) def.down(G, G.ptr.x, G.ptr.y, e); });
  play.addEventListener('pointermove', (e) => { if (G.over) return; const p = pt(e); if (e.pointerType === 'mouse' || G.hold) { G.ptr = p; if (def.move) def.move(G, p.x, p.y, e); } });
  const up = () => { if (!G.hold) return; G.hold = false; if (def.up && !G.over) def.up(G); };
  play.addEventListener('pointerup', up); play.addEventListener('pointercancel', up);
  cur.key = (e) => { if (G.over) { if (e.key === 'Enter' && $('#ffAgain')) { e.preventDefault(); $('#ffAgain').click(); } else if (e.key === 'Escape' && $('#ffBack')) { e.preventDefault(); $('#ffBack').click(); } return; } if (e.key === 'Escape') { e.preventDefault(); ffQuit(); return; } if (def.key && def.key(G, e, true)) e.preventDefault(); };
  cur.keyup = (e) => { if (!G.over && def.key) def.key(G, e, false); };
  $('#ffDone').onclick = () => { SFX.boop(700); ffQuit(); };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (FF.g === G && !G.dead) ffFit(G, true); }) : null; if (ro) ro.observe(play); // the header can grow (a longer score, a wrapped title): the field refits
  onCleanup(() => { G.dead = true; cancelAnimationFrame(G.raf); if (ro) ro.disconnect(); cur.key = null; cur.keyup = null; stage.classList.remove('ffmode'); busy = false; if (FF.g === G) FF.g = null; try { rmResume('fair'); } catch (e) { /* none */ } if (G.def.stop) try { G.def.stop(G); } catch (e) { /* none */ } });
  if (isPhone()) { view.style.flex = '1 1 auto'; onCleanup(() => { view.style.flex = ''; }); }
  G.raf = requestAnimationFrame(ffLoop);
}
function ffFit(G, again) {
  const r = G.play.getBoundingClientRect(), w = Math.max(200, r.width), h = Math.max(160, r.height);
  if (!again) G.H = Math.round(clamp(G.W * h / w, 520, 2100)); G.u = G.W / 1000; // a phone gets a 560-wide field, so the sprites stay big enough to tap
  G.sc = Math.min(w / G.W, h / G.H); const ox = (w - G.W * G.sc) / 2, oy = h - G.H * G.sc;
  G.field.style.width = G.W + 'px'; G.field.style.height = G.H + 'px'; G.field.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) scale(${G.sc.toFixed(5)})`;
}
function ffLoop(ts) {
  const G = FF.g; if (!G || G.dead) return;
  const dt = G.last ? Math.min(0.05, Math.max(0, (ts - G.last) / 1000)) : 0; G.last = ts;
  if (!G.over) {
    G.t += dt; try { G.def.tick(G, dt); } catch (e) { console.warn('ff tick', e); }
    if (G.dur) ffTimeBar(G, 1 - G.t / G.dur); else if (G.def.prog) ffTimeBar(G, 1 - G.def.prog(G));
    if (G.dur && G.t >= G.dur) ffEnd(G);
  } else if (G.def.after) G.def.after(G, dt);
  if (!G.dead) G.raf = requestAnimationFrame(ffLoop);
}
function ffTimeBar(G, f) { const l = G.tl || (G.tl = $('#ffTl')); if (!l) return; const v = clamp(f, 0, 1); if (Math.abs((G.tlv || 0) - v) < 0.002) return; G.tlv = v; l.style.strokeDashoffset = (100 - v * 100).toFixed(1); }
function ffScore(G, txt) { const el = G.scEl || (G.scEl = $('#ffSc')); if (el) el.textContent = txt !== undefined ? txt : G.def.scoreText ? G.def.scoreText(G) : tt('ff.score', 'Score: {n}', { n: G.score }); }
function ffHint(G, txt, ms) { const el = $('#ffHint'); if (!el) return; el.textContent = txt || ''; el.classList.toggle('on', !!txt); clearTimeout(G.hintT); if (txt && ms !== 0) G.hintT = setTimeout(() => { if (FF.g === G) el.classList.remove('on'); }, ms || 4200); }
// a sprite: a div holding an SVG, centred on (x, y), moved with transforms only
function ffSpr(G, html, w, h, cls) {
  const el = document.createElement('div'); el.className = 'ff-sp' + (cls ? ' ' + cls : ''); el.style.width = w + 'px'; el.style.height = h + 'px'; el.innerHTML = html; G.field.appendChild(el);
  const s = { el, x: -999, y: -999, w, h, r: 0, k: 1, on: true }; G.spr.push(s); return s;
}
function ffPut(s, x, y, r, k) {
  if (r !== undefined) s.r = r; if (k !== undefined) s.k = k;
  if (s.x === x && s.y === y && s.lr === s.r && s.lk === s.k) return; s.x = x; s.y = y; s.lr = s.r; s.lk = s.k;
  s.el.style.transform = `translate3d(${(x - s.w / 2).toFixed(1)}px,${(y - s.h / 2).toFixed(1)}px,0)${s.r ? ` rotate(${s.r.toFixed(1)}deg)` : ''}${s.k !== 1 ? ` scale(${s.k.toFixed(3)})` : ''}`;
}
function ffKill(G, s) { if (!s) return; s.on = false; s.el.remove(); const i = G.spr.indexOf(s); if (i >= 0) G.spr.splice(i, 1); }
// the dog: one sprite, drawn again only when the pose or the facing changes (dogArtSafe keeps every drawing)
function ffDog(G, d, scale) {
  const k = (d.id !== 'ffwash' && typeof sizeK === 'function' ? sizeK(d) : 1) * (scale || 1), w = Math.round(264 * k), h = Math.round(220 * k);
  const s = ffSpr(G, '', w, h, 'ff-dog'); s.d = d; s.pose = ''; s.face = ''; s.dk = k; ffPose(s, 'idle', 'right'); return s;
}
// rainy days: a dog in an outdoor game on a rainy day is drawn wet (a raincoat keeps it dry, the Café is indoors); the bath dog is wet from the rinse on
function ffWet(s) {
  const G = FF.g, d = s.d; if (s.soak) return true; if (!G || !S) return false;
  const pl = FF_GAMES[G.k] && FF_GAMES[G.k].place, out = pl === 'yard' || !!(PLACES[pl] && PLACES[pl].out);
  let rain = false; try { rain = weatherNow() === 'rain'; } catch (e) { rain = false; }
  return rain && out && !RAINCOATS.includes(d.id === 'ffwash' ? d.outfit && d.outfit.body : outfitOf(d) && outfitOf(d).body);
}
function ffPose(s, pose, face) {
  face = face || s.face || 'right'; const wet = ffWet(s); if (s.pose === pose && s.face === face && s.wet === wet) return;
  const d = s.d, p = poseReal(d.key, pose) ? pose : POSE_FB[pose] || 'idle', w = wet ? { wet: true } : {};
  s.el.innerHTML = d.id === 'ffwash' ? dogArtSafe(d.key, Object.assign({ pose: p, outfit: d.outfit, facing: face }, w)) : dogSVG(d, Object.assign({ pose: p, outfit: outfitOf(d), facing: face }, w)); s.pose = pose; s.face = face; s.wet = wet; // the neighbour's dog: the breed's own look
}
// put the dog's feet at (x, y)
const ffFeet = (s, x, y) => ffPut(s, x, y - s.h / 2 + 6 * s.dk);
// a short floating word
function ffPop(G, txt, x, y, col, say) {
  const el = document.createElement('div'), sp = document.createElement('span'); el.className = 'ff-float'; sp.textContent = txt; if (say) sp.className = 'ff-say'; // a spoken line sits on a light card el.appendChild(sp); el.style.color = col || '#5B3D32'; el.style.transform = `translate3d(${x.toFixed(0)}px,${y.toFixed(0)}px,0)`;
  G.field.appendChild(el); setTimeout(() => el.remove(), 900);
}
const ffArt = (name, o) => (window.PawArt && typeof PawArt.ffArt === 'function' ? PawArt.ffArt(name, o || {}) : '') || doodle('paw', 0, 0, 1);

/* ---------------- the end of a round: coins, Bond, the result card ---------------- */
function ffEnd(G) {
  if (G.over) return; G.over = true; ffTimeBar(G, 0); const gm = $('.ff-game'); if (gm) gm.classList.add('over'); // the field's buttons and hint rest under the result card
  const k = G.k, d = G.d, want = G.def.coins(G), paid = ffPay(k, want);
  const bp = withDog(d, () => addBond(FF_BOND)); withDog(d, () => { addStat('happy', FF_HAPPY); addStat('energy', -FF_CAPS[k].en); });
  const F = S.ff; F.n[k] = (F.n[k] || 0) + 1; if (G.score > (F.best[k] || 0)) F.best[k] = G.score;
  if (G.def.done) G.def.done(G);
  markDirty(); updateHUD(); try { SFX.fanfare(); } catch (e) { /* none */ }
  trackAct('funfair', { game: k, name: d.name, score: G.score });
  const lines = [G.def.result(G)];
  lines.push(paid ? tt('ff.r_coins', '+{n, plural, one {# coin} other {# coins}}.', { n: paid }) : ffLeft(k) === 0 && want > 0 ? tt('ff.r_cap', 'All of today\'s coins for this game are earned. The fun still counts.') : tt('ff.r_nocoin', 'No coins this time, but lots of fun.'));
  lines.push(tt('ff.r_bond', '+{n} Bond.', { n: bp }));
  if (G.def.extra) { const x = G.def.extra(G); if (x) lines.push(x); }
  const again = k !== 'wash' && ffCan(k);
  const end = $('#ffEnd'); if (!end) return;
  end.innerHTML = `<div class="ff-card-end" role="dialog" aria-label="${esc(ffName(k))}"><h3>${esc(G.def.title ? G.def.title(G) : tt('ff.r_title', 'Well played, {name}!', { name: d.name }))}</h3><p>${lines.map(esc).join(' ')}</p>
    <div class="ff-ebtns">${again ? `<button class="btn yes" id="ffAgain">${esc(tt('ff.again', 'Play again'))}</button>` : ''}<button class="btn" id="ffBack">${esc(tt('ff.back', 'Back'))}</button></div></div>`;
  end.hidden = false; G.res = { paid, want, bp, score: G.score };
  const a = $('#ffAgain'); if (a) a.onclick = () => { SFX.boop(840); if (ffCan(k, true)) go('fair', k); };
  $('#ffBack').onclick = () => { SFX.boop(700); ffBackHome(); };
  setTimeout(() => { const b = $('#ffAgain') || $('#ffBack'); if (b && FF.g === G) b.focus({ preventScroll: true }); }, 50);
  try { if (typeof ddStickers === 'function') ddStickers(false); } catch (e) { /* none */ }
}
function ffQuit() { const G = FF.g; if (G && !G.over && G.t > 3 && G.def.coins(G) > 0) { ffEnd(G); return; } ffBackHome(); } // Done mid-round: what was earned so far still counts
function ffBackHome() { go(S.place === 'market' ? 'market' : 'yard'); }

/* ---------------- stickers: two Fun Fair pages in the v2.17 sticker book (48_dogdays.js asks ffStickerAdd) ---------------- */
function ffPagesSync() {
  if (typeof DD_PAGES === 'undefined') return;
  const want = ffReady(), has = DD_PAGES.includes('fair');
  if (want && !has) { DD_PAGES.push('fair', 'ribbons'); DD.defs = null; } else if (!want && has) { DD_PAGES.splice(DD_PAGES.indexOf('fair'), 2); DD.defs = null; }
}
function ffStickerAdd(add) {
  if (!S || !S.ff || !DD_PAGES.includes('fair')) return;
  const pg = DD_PAGES.indexOf('fair'), n = (k) => S.ff.n[k] || 0, R = S.ff.rib;
  add('ff_catch', pg, 't:Treat Jar', () => ffName('catch'), () => n('catch') > 0);
  add('ff_bubble', pg, 't:Golden Bubble', () => ffName('bubble'), () => n('bubble') > 0);
  add('ff_seek', pg, 't:Crayon Box', () => ffName('seek'), () => n('seek') > 0);
  add('ff_kite', pg, 't:Paper Kite', () => ffName('kite'), () => n('kite') > 0);
  add('ff_jobs', pg, 't:Rolled Newspaper', () => tt('ff.st_jobs', 'All three jobs done'), () => n('paper') > 0 && n('bakery') > 0 && n('wash') > 0);
  add('ff_stall', pg, 't:Market Basket', () => ffName('stall'), () => (S.ff.mk.n || 0) > 0);
  add('ff_rb', pg + 1, 't:Show Ribbon', () => tt('ff.st_blue', 'A blue show ribbon'), () => (R.b || 0) + (R.r || 0) + (R.g || 0) > 0);
  add('ff_rr', pg + 1, 't:Red Show Ribbon', () => tt('ff.st_red', 'A red show ribbon'), () => (R.r || 0) + (R.g || 0) > 0);
  add('ff_rg', pg + 1, 't:Gold Show Rosette', () => tt('ff.st_gold', 'A gold rosette'), () => (R.g || 0) > 0);
  add('ff_r5', pg + 1, 't:Parade Rosette', () => tt('ff.st_shows', '{n, plural, one {# dog show} other {# dog shows}}', { n: 5 }), () => n('show') >= 5);
  add('ff_pc1', pg + 1, 't:Photo Contest Ribbon', () => tt('ff.st_photo', 'A photo contest ribbon'), () => (S.ff.pc.rib || 0) > 0);
  add('ff_pc3', pg + 1, 'i:camera', () => tt('ff.st_photo3', '{n, plural, one {# photo contest} other {# photo contests}}', { n: 3 }), () => (S.ff.pc.rib || 0) >= 3);
}
function ffPageTitle(k) { return k === 'fair' ? tt('ff.pg_fair', 'Fun Fair') : tt('ff.pg_ribbons', 'Ribbons'); }

/* ---------------- the neighbour's dog (the wash) and the thank-you letter ---------------- */
const FF_WASH_BREEDS = ['beagle', 'corgi', 'westie', 'pug', 'bichon', 'collie', 'shiba', 'lab', 'schnauzer', 'mutt'];
const FF_WASH_NAMES = ['Hana', 'Kuri', 'Momo', 'Taro', 'Sora', 'Mugi', 'Kinako', 'Pochi'];
function ffWashDog() { const r = seeded(hashId('ffwash|' + localISO())); const key = FF_WASH_BREEDS[Math.floor(r() * FF_WASH_BREEDS.length)], name = FF_WASH_NAMES[Math.floor(r() * FF_WASH_NAMES.length)]; return { id: 'ffwash', key, name, sex: r() < 0.5 ? 'female' : 'male', outfit: { head: null, eyes: null, neck: 'Red Bandana', body: null }, born: null }; }
function ffWashLetter(dog) {
  if (typeof mailPush !== 'function') return;
  mailPush({ kind: 'postcard', id: 'ff_wash_' + localISO(), from: tt('ff.who_tanaka_from', 'The Tanakas'), title: tt('ff.wash_title', 'Thank you from {dog}', { dog: dog.name }),
    text: tt('ff.wash_text', '{dog} came home fluffy, clean and very proud. Thank you to you and {name} for the lovely bath. {dog} has been sniffing the towel all evening.', { dog: dog.name, name: NAME() }), ps: tt('ff.wash_ps', 'A wag from {dog}', { dog: dog.name }) });
}

/* ---------------- the Saturday market stall (Market Street) ---------------- */
// what may go on the stall: garden crops (S.inv.crops, stars) and cooked dishes (S.inv.dishes). A small, fixed price each; the Saturday cap is 40
function ffStallGoods() {
  const out = [];
  if (typeof cropsList === 'function') cropsList().forEach((c) => { const a = (S.inv.crops || {})[c.id] || [0, 0, 0]; a.forEach((n, i) => { if (n > 0) out.push({ t: 'crop', id: c.id, st: i, n, each: Math.max(1, Math.round(c.sell * [1, 1.5, 2][i]) + 1), name: gkCropName(c) + ' ' + '★'.repeat(i + 1), art: c.item }); }); });
  const ds = {}; (S.inv.dishes || []).forEach((d) => { const key = d.id + '|' + d.stars; ds[key] = (ds[key] || 0) + 1; });
  Object.keys(ds).forEach((key) => { const [id, st] = key.split('|'), r = typeof recipeInfo === 'function' ? recipeInfo(id) : null; out.push({ t: 'dish', id, st: +st, n: ds[key], each: 3 + 2 * +st, name: (r ? gkRecipeName(r) : id) + ' ' + '★'.repeat(+st), art: r ? r.name : 'Carrot Crunchies' }); });
  return out;
}
function ffStallTake(g) {
  if (g.t === 'crop') { const a = S.inv.crops[g.id]; if (!a || !a[g.st]) return false; a[g.st]--; return true; }
  const i = S.inv.dishes.findIndex((x) => x.id === g.id && x.stars === g.st); if (i < 0) return false; S.inv.dishes.splice(i, 1); return true;
}
const FF_SHOPPERS = () => [tt('ff.sh_lindqvist', 'Mrs. Lindqvist'), tt('ff.sh_reyes', 'Old Mr. Reyes'), tt('ff.sh_patel', 'Ms. Patel'), tt('ff.sh_okafor', 'the Okafor twins'), tt('ff.sh_joe', 'Grandpa Joe'), tt('ff.sh_moreau', 'the Moreau family')];
function ffStall(sel) {
  if (!ffReady()) return;
  const sat = ffSaturday(), left = ffLeft('stall'), goods = ffStallGoods(); sel = sel || {};
  const picked = Object.keys(sel).reduce((a, k) => a + sel[k], 0), sum = goods.reduce((a, g, i) => a + (sel[i] || 0) * g.each, 0);
  const stall = `<div class="ff-stallart" aria-hidden="true">${ffArt('stall')}</div>`;
  let body;
  if (!sat) body = `<p>${esc(tt('ff.stall_closed_long', 'The market stall opens on Saturdays. Grow veggies in the garden and cook snacks in the kitchen, then come back on Saturday.'))}</p>`;
  else if (!left) body = `<p>${esc(tt('ff.stall_full', 'What a Saturday! The stall has earned its {cap} coins today. See you next Saturday.', { cap: FF_CAPS.stall.week }))}</p>`;
  else if (!goods.length) body = `<p>${esc(tt('ff.stall_empty', 'Nothing to set out yet. Veggies from the garden and snacks from the kitchen go on the stall.'))}</p>`;
  else body = `<p class="small">${esc(tt('ff.stall_pick', 'Pick up to six things for the stall. Neighbours pay a fair price, up to {left} more coins today.', { left }))}</p>
    <ul class="ff-goods">${goods.map((g, i) => `<li><span class="ff-gart" aria-hidden="true">${art('item', g.art)}</span><span class="ff-gn">${esc(g.name)}<span class="small">${esc(tt('ff.stall_each', 'x{n} · {each} each', { n: g.n, each: g.each }))}</span></span><span class="ff-q"><button class="btn" data-q="${i}" data-d="-1" aria-label="${esc(tt('ff.less', 'One less'))}" ${(sel[i] || 0) ? '' : 'aria-disabled="true"'}>-</button><b>${sel[i] || 0}</b><button class="btn" data-q="${i}" data-d="1" aria-label="${esc(tt('ff.more', 'One more'))}" ${(sel[i] || 0) < g.n && picked < 6 ? '' : 'aria-disabled="true"'}>+</button></span></li>`).join('')}</ul>
    <p class="small ff-sum">${esc(tt('ff.stall_sum', 'On the stall: {n} of 6, about {coins} coins.', { n: picked, coins: Math.min(sum, left) }))}</p>`;
  const foot = sat && left && goods.length ? `<button class="btn yes" id="ffOpenStall" ${picked ? '' : 'aria-disabled="true"'}>${esc(tt('ff.stall_go', 'Open the stall'))}</button>` : `<button class="btn" id="ffStallOk">${esc(tt('ff.ok', 'OK'))}</button>`;
  const p = openModal(esc(ffName('stall')), stall + body, { cls: 'ff-pop ff-stallpop', foot });
  p.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => { if (b.getAttribute('aria-disabled') === 'true') return; SFX.click(); const i = +b.dataset.q, n = Object.assign({}, sel); n[i] = Math.max(0, (n[i] || 0) + +b.dataset.d); ffStall(n); }; });
  const ok = $('#ffStallOk', p); if (ok) ok.onclick = () => { SFX.boop(700); closeModal(); };
  const go2 = $('#ffOpenStall', p); if (go2) go2.onclick = () => { if (!picked) return; ffStallRun(goods, sel); };
}
function ffStallRun(goods, sel) {
  const list = []; goods.forEach((g, i) => { for (let j = 0; j < (sel[i] || 0); j++) list.push(g); });
  const who = FF_SHOPPERS(), lines = []; let got = 0;
  list.forEach((g, i) => { const room = ffLeft('stall') - got; if (room <= 0 || !ffStallTake(g)) return; const c = Math.min(g.each, room); got += c; lines.push(tt('ff.stall_line', '{who} takes home the {item}: {n, plural, one {# coin} other {# coins}}.', { who: who[i % who.length], item: g.name, n: c })); });
  if (got) { addCoins(got, { raw: true }); const m = S.ff.mk; if (m.day !== localISO()) { m.day = localISO(); m.coins = 0; } m.coins += got; m.n = (m.n || 0) + 1; markDirty(); SFX.kaching(); trackAct('funfair', { game: 'stall', score: got }); }
  withDog(D(), () => addBond(1));
  const p = openModal(esc(ffName('stall')), `<div class="ff-stallart" aria-hidden="true">${ffArt('stall')}</div><ul class="ff-slines">${lines.map((l, i) => `<li style="animation-delay:${(i * 0.35).toFixed(2)}s">${esc(l)}</li>`).join('')}</ul><p><b>${esc(tt('ff.stall_got', 'The stall earned {n, plural, one {# coin} other {# coins}} today.', { n: got }))}</b> ${esc(tt('ff.stall_dog', '{name} greeted every neighbour with a wag.', { name: NAME() }))}</p>`, { cls: 'ff-pop ff-stallpop', foot: `<button class="btn yes" id="ffStallOk">${esc(tt('ff.ok', 'OK'))}</button>` });
  $('#ffStallOk', p).onclick = () => { SFX.boop(700); closeModal(); };
  try { if (typeof ddStickers === 'function') ddStickers(false); } catch (e) { /* none */ }
  return got;
}

/* ---------------- the weekly photo contest (photo mode enters, Ms. Patel judges three) ---------------- */
function ffContest() { const P = S.ff.pc, wk = ffWeekOf(localISO()); if (P.wk !== wk) { P.wk = wk; P.e = []; P.judged = ''; P.won = 0; markDirty(); } return P; }
function ffContestLine() { const P = ffContest(); return P.judged ? tt('ff.pc_done', 'Judged this week: you won {n, plural, one {# coin} other {# coins}} and a ribbon. A new contest starts on Monday.', { n: P.won }) : tt('ff.pc_line', 'Photos entered this week: {n} of 3. Prize up to {cap} coins.', { n: P.e.length, cap: FF_CAPS.photo.week }); }
// photo mode: the button and the entry. c = the photo mode capture (dogs' x boxes); vb = the crop shown
function ffPhotoBtn() { if (!ffReady()) return ''; const P = ffContest(); if (P.judged || P.e.length >= 3) return ''; return `<button type="button" class="btn ff-phbtn" id="ffPhoto">${esc(tt('ff.pc_enter', 'Enter in the photo contest ({n}/3)', { n: P.e.length }))}</button>`; }
function ffPhotoBind(root, getCap) {
  const b = root && $('#ffPhoto', root); if (!b) return;
  b.onclick = () => { SFX.boop(840); const r = ffPhotoEnter(getCap()); if (r) { b.remove(); toast(r, 'good'); } };
}
function ffPhotoEnter(cap) {
  if (!ffReady()) return '';
  const P = ffContest(); if (P.judged || P.e.length >= 3) return '';
  const who = (cap && cap.who) || [], lead = who[0], vb = (cap && cap.vb) || [0, 0, 1000, 600];
  let centred = 0; if (lead && lead[1] != null) { const mid = (lead[1] + lead[2]) / 2, c = vb[0] + vb[2] / 2; centred = Math.abs(mid - c) <= vb[2] * 0.18 ? 1 : 0; }
  const o = S.dog.outfit || {}, dressed = ['head', 'eyes', 'neck', 'body'].some((k) => o[k]) ? 1 : 0;
  P.e.push({ p: S.place, c: centred, o: dressed, n: Math.max(1, who.length), d: localISO(), dog: S.dog.name }); markDirty(); saveNow();
  trackAct('funfair', { game: 'photo', score: P.e.length });
  if (P.e.length >= 3) setTimeout(() => { if (cur.mode === 'yard' && !(typeof phActive === 'function' && phActive())) ffContestCheck(); }, 400);
  return tt('ff.pc_in', 'Photo {n} of 3 is in the contest.', { n: P.e.length });
}
// the kind rules: the dog in the middle (4), dressed up (3), a place none of the other entries shows (3): up to 10 a photo, 30 for three
function ffJudge(e, all) { const places = all.map((x) => x.p), pts = (e.c ? 4 : 1) + (e.o ? 3 : 1) + (places.filter((p) => p === e.p).length === 1 ? 3 : 1); return Math.min(10, pts); }
function ffContestCheck() {
  if (!ffReady()) return false; const P = ffContest(); if (P.judged || P.e.length < 3 || !modal.hidden || (typeof phActive === 'function' && phActive())) return false;
  const pts = P.e.map((e) => ffJudge(e, P.e)), won = Math.min(FF_CAPS.photo.week, pts.reduce((a, b) => a + b, 0));
  P.judged = localISO(); P.won = won; P.rib = (P.rib || 0) + 1; addCoins(won, { raw: true }); markDirty(); saveNow();
  const say = (e, i) => { const bits = []; bits.push(e.c ? tt('ff.pc_c1', 'right in the middle') : tt('ff.pc_c0', 'a lovely surprise angle')); bits.push(e.o ? tt('ff.pc_o1', 'a smart outfit') : tt('ff.pc_o0', 'a natural look')); bits.push(tt('ff.pc_place', 'at {place}', { place: e.p === 'yard' ? tt('photo.place_home', 'Home') : placeName(e.p) })); return tt('ff.pc_photo', 'Photo {i}: {what}. {n} points.', { i: i + 1, what: tlist(bits), n: pts[i] }); };
  const p = openModal(esc(tt('ff.pc_title', 'Photo contest results')), `<div class="ff-pcres"><span class="ff-rib" aria-hidden="true">${art('item', 'Photo Contest Ribbon')}</span><div><p>${esc(tt('ff.pc_intro', 'Ms. Patel looked at all three photos with a magnifying glass and a big smile.'))}</p><ul>${P.e.map((e, i) => `<li>${esc(say(e, i))}</li>`).join('')}</ul>
    <p><b>${esc(tt('ff.pc_won', 'Prize: {n, plural, one {# coin} other {# coins}} and a photo contest ribbon for your sticker book.', { n: won }))}</b></p><p class="small">${esc(tt('ff.pc_all', 'Everyone who enters gets a ribbon. A new contest starts on Monday.'))}</p></div></div>`, { cls: 'ff-pop', foot: `<button class="btn yes" id="ffPcOk">${esc(tt('ff.ok', 'OK'))}</button>` });
  $('#ffPcOk', p).onclick = () => { SFX.boop(700); closeModal(); };
  try { if (typeof ddStickers === 'function') ddStickers(false); } catch (e) { /* none */ }
  return true;
}

/* ---------------- Gerald's guide card ---------------- */
function ffLesson() { return ffReady() ? ['funfair', 'star', tt('ff.lesson_title', 'Fun Fair'), tt('ff.lesson_text', 'Games and small jobs around town pay a few coins each day, and every round gives a little Bond. Walks still pay the most.')] : null; }

/* ---------------- the loop and the test hook ---------------- */
setInterval(() => { try { ffPagesSync(); ffExpose(); } catch (e) { /* not ready */ } }, 1000);
on('game:ready', () => { ffPagesSync(); ffExpose(); });
function ffExpose() {
  if (!window.__paw || window.__paw.ff) return;
  window.__paw.ff = {
    on: () => ffOn(), caps: FF_CAPS, games: FF_GAMES, keys: FF_KEYS.slice(), here: (p) => ffHere(p), left: (k) => ffLeft(k), pay: (k, n) => ffPay(k, n), start: (k) => ffStart(k), cards: () => ffCards(), can: (k) => ffCan(k),
    get g() { return FF.g; }, end: () => { if (FF.g) ffEnd(FF.g); }, quit: () => ffQuit(), back: () => ffBackHome(), stall: () => ffStall(), goods: () => ffStallGoods(), stallRun: (sel) => ffStallRun(ffStallGoods(), sel), sat: () => ffSaturday(), setSat: (v) => { prefs.ffSat = v; },
    contest: () => ffContest(), enter: (cap) => ffPhotoEnter(cap), judge: () => ffContestCheck(), washDog: () => ffWashDog(), name: (k) => ffName(k), unlocks: (L) => ffUnlocks(L), sync: () => ffPagesSync(), lesson: () => ffLesson(),
    test: (v) => { prefs.ffTest = !!v; ffPagesSync(); if (cur.mode === 'yard') ffPlaceBtn(); }, bond: FF_BOND, week: (iso) => ffWeekOf(iso || localISO())
  };
}
