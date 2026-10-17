/* ======================= MAP ======================= */
function lockedAreas() { return [...new Set(Object.keys(ROUTES).filter((k) => topBond() < ROUTES[k].bond).concat(Object.keys(PLACES).filter((k) => topBond() < PLACES[k].bond)))]; }
function pickArea(k) {
  SFX.click();
  if (k === 'shelter') return go('shelter');
  if (PLACES[k]) return travelTo(k);
  const r = ROUTES[k]; if (!r) return;
  if (topBond() < r.bond) { nope(PICK([`Nope. ${r.n} opens at Bond ${r.bond}. The trees need time to warm up to you.`, `Nope. ${r.n} is Bond ${r.bond} only. There is a bouncer. He is a goose.`, `Nope nope. Bond ${r.bond} for ${r.n}. Rules are rules (we made them up).`])); return; }
  if (S.sleeping) { nope(`${NAME()} is asleep. Wake up first (Care menu).`); return; }
  if (S.stats.energy < 20) { nope(`${NAME()} lies down at the gate. Too sleepy for a walk. Try a nap first.`); return; }
  go('walk', k);
}
function enterShelter() {
  // v2.7: the Shelter Playroom (30_shelter.js, V27.md section 7). Desktop hides the HUD here so the whole Adopt-me board and the floor fit
  setChrome(isPhone(), true);
  view.innerHTML = `${srRoomSVG('shelter')}<button id="devBtn">dev</button>`;
  srTray(); srEnter('shelter');
  if (S.shelter && !S.shelter.seen) { S.shelter.seen = localISO(); markDirty(); setTimeout(() => { if (cur.mode === 'shelter') toast('The shelter has a playroom now. Tap a dog to say hello, or the board to see who is looking for a home.', 'gold'); }, 500); }
  setTimeout(() => { if (cur.mode === 'shelter' && modal.hidden && SR && SR.dogs.length) { const rd = PICK(SR.dogs); srBark(rd, 'woof'); srLine(rd, ['Hello!', 'A visitor!', 'Did you bring biscuits?'], true); } }, 1200);
  updateHUD(); bindDev();
}

/* ---- v2.8 Mt. Fuji Lookout map pin (V28.md section 12.4) ----
   Data hook: with the place on (PLACES.fujihill, see jpPlaceSync in 14_town_places.js), mapArt passes { jp: true, fujiPin: JP_MAP_PIN.big } to
   PawArt.scene('map'). SCENE ART draws the small Fuji landmark top-left (o.jp) and the real pin as <g data-area="fujihill"> centred on o.fujiPin
   (map units of the 2400 x 1500 town map), and may add { id: 'fujihill', x, y } to PawArt.MAP_AREAS. Until the art draws a data-area="fujihill",
   the game adds this plain doodle pin there (fb: the same spot on the fallback town map). */
const JP_MAP_PIN = { big: [380, 330], fb: [520, 150] };
function jpMapPin(raw, at) {
  if (!PLACES.fujihill || /data-area="fujihill"/.test(raw || '')) return '';
  return fbPinSVG('fujihill', at, 'fuji');
}

/* ---- v2.9 POLISH: the map controls stay clear of the place names after a drag or a zoom (V29.md section 3) ----
   On phones the X and the zoom column float over the map. On opening, mapClearCtl (14_town_places.js) already slides the map by the smallest
   sideways step that leaves no place name under them; this runs the same step once a drag, a pinch or a zoom button has settled, so a panned
   or zoomed map is as clear as the default view. It waits while a finger is down, and never moves the map while it is being dragged. */
const MAP_SETTLE_MS = 320;
let mapSettleT = 0, mapSettleEl = null, mapSettleDown = 0;
function mapSettleRun() {
  mapSettleT = 0;
  if (cur.mode !== 'map' || !isPhone() || !MAPV || mapSettleDown > 0) return;
  const pan = $('#mapPan'), inner = $('#mapInner'), zoom = $('#mapZoom'); if (!pan || !inner || !zoom || pan.classList.contains('dragging')) return;
  const box = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const over = (r, c, dx, dy) => r.right + dx > c.left && r.left + dx < c.right && r.bottom + dy > c.top && r.top + dy < c.bottom;
  const labels = () => [...inner.querySelectorAll('svg text')].filter((e) => e.textContent.trim().length > 1);
  zoom.style.top = ''; zoom.style.transition = ''; // the column starts from its own place every time
  const ctl = ['#mapX', '#mapZoom'].map((q) => $(q)).filter(Boolean).map(box), labs = labels().map(box);
  const hitsAt = (dx, dy) => labs.some((r) => ctl.some((c) => over(r, c, dx, dy)));
  if (!hitsAt(0, 0)) return;
  // 1) slide the map by the smallest step (sideways or up and down) that leaves no name under the X or the zoom column
  const M = MAPV, tx0 = M.tx, ty0 = M.ty, cand = [];
  for (let dx = -200; dx <= 200; dx += 8) for (let dy = -120; dy <= 120; dy += 8) if (!hitsAt(dx, dy)) cand.push([dx, dy, Math.hypot(dx, dy)]);
  cand.sort((a, b) => a[2] - b[2]);
  const t0 = inner.style.transform; // rects are read at the final place at once: the slide is played afterwards with the Web Animations API
  const clear = () => labels().every((e) => { const r = e.getBoundingClientRect(); return !ctl.some((c) => over(r, c, 0, 0)); });
  let done = false;
  for (const [dx, dy] of cand.slice(0, 24)) { M.tx = tx0 + dx; M.ty = ty0 + dy; mapApply(); if (clear()) { done = true; break; } } // the clamp may stop the slide short: look at the real result
  if (!done) { M.tx = tx0; M.ty = ty0; mapApply(); }
  if (!motionOff() && inner.style.transform !== t0 && typeof inner.animate === 'function') inner.animate([{ transform: t0 }, { transform: inner.style.transform }], { duration: 250, easing: 'ease-out' });
  if (done) return;
  // 2) a name in the map's corner cannot be slid away (the edge stops the map): the zoom column steps down below it instead (the X stays)
  const now = labels().map(box), z = box(zoom), top0 = parseFloat(getComputedStyle(zoom).top) || z.top - pan.getBoundingClientRect().top, room = pan.getBoundingClientRect().bottom - 12 - z.bottom;
  if (now.some((r) => over(r, box($('#mapX')), 0, 0))) return;
  for (let off = 8; off <= room; off += 8) if (!now.some((r) => over(r, z, 0, off))) { zoom.style.transition = motionOff() ? '' : 'top .2s ease-out'; zoom.style.top = (top0 + off) + 'px'; return; }
}
function mapSettleSoon() { clearTimeout(mapSettleT); mapSettleT = setTimeout(mapSettleRun, MAP_SETTLE_MS); }
function mapSettleWatch() {
  const pan = $('#mapPan'); if (!pan || pan === mapSettleEl) return; mapSettleEl = pan; mapSettleDown = 0;
  pan.addEventListener('pointerdown', () => { mapSettleDown++; clearTimeout(mapSettleT); });
  const up = () => { mapSettleDown = Math.max(0, mapSettleDown - 1); mapSettleSoon(); };
  pan.addEventListener('pointerup', up); pan.addEventListener('pointercancel', up);
  if (typeof MutationObserver === 'function') { const zl = $('#mapZoomLbl'); if (zl) new MutationObserver(mapSettleSoon).observe(zl, { childList: true, characterData: true, subtree: true }); }
}
if (typeof MutationObserver === 'function') new MutationObserver(() => { if ($('#mapPan')) mapSettleWatch(); }).observe(view, { childList: true });
