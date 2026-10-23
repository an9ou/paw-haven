/* ======================= YARD ======================= */
const DX = 298, DY = 295, DW = 264, DH = 220; // dog box: feet at y=500, centre x=430
let dogKey = '', tempPose = null, tempUntil = 0, busy = false, pet = { start: 0, gain: 0, bonded: false, capped: false, dist: 0 };
function yardWorldSVG(extra = '') {
  return `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">
    ${sceneG(S.place || 'yard', S.place === 'yard' ? { patch: gkOn() ? patchState() : 'empty' } : S.place === 'house' && hasBedArt() ? { bed: false } : {})}${S.place === 'yard' && !gkOn() ? '<g class="soon-tag" pointer-events="none" transform="translate(112 432) rotate(-6)"><rect x="-58" y="-17" width="116" height="30" rx="6" fill="#FFF3B8" stroke="#5B3D32" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="22" fill="#5B3D32">' + tt('yard.coming_soon_tag', 'coming soon') + '</text></g>' : ''}${bedLayers().back}<g id="messG"></g><g id="snowmanG">${S.place === 'yard' ? snowmanSVG() : ''}</g>${S.place === 'yard' && cur.mode === 'yard' && typeof msYardSVG === 'function' ? msYardSVG() : ''}${S.place === 'yard' ? hmDecorSVG() : ''}
    ${S.place === 'yard' ? `<g id="houseG" class="hot${isNight() ? ' night' : ''}" tabindex="0" role="button" aria-label="${esc(tt('yard.label_dog_house', 'Dog house: {house}', { house: homeName(S.house) }))}">${place(art('house', S.house), 620, 330, 240, 200)}</g>` : ''}
    <g id="bowlG" class="hot" tabindex="0" role="button" aria-label="${esc(tt('yard.label_food_bowl', 'Food bowl'))}">${place(art('prop', 'bowl-empty'), 205, 462, 90, 90)}</g>
    <g id="pack">${packSVG(true)}</g>${bedLayers().front}
    ${S.place === 'yard' && S.mapPieces.length >= 4 && !S.secretDug ? `<g id="secretX" class="hot" tabindex="0" role="button" aria-label="${esc(tt('yard.label_secret_dig_x_marks_the', 'Secret dig: X marks the spot'))}"><rect x="585" y="452" width="150" height="140" fill="transparent"/>${place(artReal('collectible', 'dig') || art('collectible', 'dig'), 615, 495, 90, 90)}<text x="660" y="488" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="26" fill="#5B3D32">${tt('yard.x_marks_the_spot', 'X marks the spot!')}</text></g>` : ''}
    <g id="zzz"></g><g id="ballLayer" pointer-events="none"></g>${extra}<g id="fx"></g></svg><div id="status"></div><div id="placeBtns"></div><button id="devBtn">dev</button>`;
}
function dogPoseNow() {
  if (tempPose && performance.now() < tempUntil) return tempPose;
  tempPose = null;
  if (S.sleeping) return 'sleep';
  if (IDLE.act && IDLE.act.pose && performance.now() < IDLE.act.until) return IDLE.act.pose;
  if (S.stats.clean < 25) return 'dirty';
  if (S.stats.hunger < 25 || S.stats.happy < 25 || S.stats.energy < 25) return 'sad';
  if ((outdoorsNow() || S.dog.key === 'chihuahua') && weatherNow() === 'snow' && !isWarm()) return 'cold';
  if (isHot() && S.place !== 'woods' && S.place !== 'house') return 'hot';
  if (glowing()) return 'happy';
  return 'idle';
}
const POSE_FB = { crouch: 'sit', shake: 'happy', cold: 'sad', hot: 'happy', dig: 'eat', squat: 'sit', leglift: 'sit' };
function dogArtSafe(key, o) { let sv = art('dog', key, o); if (o.pose && POSE_FB[o.pose] && !sv.includes('pa-pose-' + o.pose)) sv = art('dog', key, Object.assign({}, o, { pose: POSE_FB[o.pose] })); return sv; }
function renderDog(pose, facing = 'right', force, artOnly) {
  const g = $('#dogArt'); if (!g) return;
  const o = shSleepOutfit(D(), pose), ex = exNow(D(), pose), k = pose + '|' + facing + '|' + JSON.stringify(o) + '|' + S.dog.key + (ex ? '|' + ex : ''); // v2.4: the Pyjamas at nap time. v2.13: the face (41_expressions.js)
  if (k === dogKey && !force) return; dogKey = k;
  g.innerHTML = place(dogSVG(D(), ex ? { pose, outfit: o, facing, expr: ex } : { pose, outfit: o, facing }), DX, DY, DW, DH);
  if (artOnly) return; // v2.13: a face that starts or ends redraws the art only (exRedraw)
  const fx = $('#dogFx'); if (fx) { fx.classList.toggle('tk-shake', pose === 'shake'); fx.classList.toggle('tk-shiver', pose === 'cold'); }
  const bf = $('#bedFront'); if (bf) bf.style.display = pose === 'sleep' ? '' : 'none';
  fbNapFit(pose); fbPackNapFit();
}
// v2.5: the nap on a house bed. The nap spot (napSpot(): the active dog's own bed, 28_home.js) is shared by the nap, the curl-up and the idle nap, but the sleeping
// art differs per breed, age and outfit, and each bed has its own front lip (drawn over the dog). So the sleeping art is measured and
// fitted inside the dog group: centred on the bed, its bottom just behind the front lip, so the whole curled-up dog shows on the bed.
// v2.7: the beds can stand anywhere in the house, so the check is "the dog stands at its own bed's nap spot" (hoAtBedNap), not one fixed transform.
function fbNapFit(pose) {
  const g = $('#dogArt'), hit = $('#dogHit'); if (!g) return;
  g.removeAttribute('transform'); if (hit) hit.removeAttribute('transform'); hoZzzSync();
  const p = $('#dogPos'), bed = $('#bedG'), svg = $('svg.world', view);
  if (pose !== 'sleep' || S.place !== 'house' || !bed || !svg || !p || !hoAtBedNap()) return;
  const front = $('#bedFront .pa-bed-front'), fr = front && front.getBoundingClientRect(), br = bed.getBoundingClientRect(), r = g.getBoundingClientRect();
  if (!r.width || !br.width || !g.getScreenCTM()) return;
  const loc = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(g.getScreenCTM().inverse()); };
  const d0 = loc(r.left, r.top), d1 = loc(r.right, r.bottom), b0 = loc(br.left, br.top), b1 = loc(br.right, br.bottom);
  const lip = fr && fr.width ? loc(fr.left, fr.top).y : b0.y + (b1.y - b0.y) * 0.62, lipW = fr && fr.width ? loc(fr.right, fr.top).x - loc(fr.left, fr.top).x : b1.x - b0.x;
  const ns = napSpot(), bx = S.bedAt[S.bed][0], bw = BED_BOX[2], cx = (d0.x + d1.x) / 2, by = d1.y, k = Math.min(1, (lipW * 0.78) / (d1.x - d0.x)), h = (d1.y - d0.y) * k;
  const tx = ((bx + bw / 2) - ns[0]) / ns[2], ty = lip + h * 0.14; // the lip hides only the bottom 14% (the dog sinks into the cushion a little)
  const t = `translate(${f1(tx)} ${f1(ty)}) scale(${k.toFixed(3)}) translate(${f1(-cx)} ${f1(-by)})`;
  g.setAttribute('transform', t); if (hit) hit.setAttribute('transform', t);
}
// v2.5: a pack dog napping on a bed is lifted the same way: its bottom just behind the lip. v2.7: every dog naps on its own bed, so each
// bed's lip (.ho-bedfront) shows while its own pack dog naps, and the dog is centred and fitted on that bed (28_home.js hoPackSpot puts it there)
function fbPackNapFit() {
  const svg = $('svg.world', view); if (!svg || !S) return; const house = S.place === 'house';
  svg.querySelectorAll('.ho-bedfront[data-bed]').forEach((f) => { const b = f.dataset.bed; f.style.display = house && S.dogs.some((d) => d.id !== S.activeId && d.sleeping && svg.querySelector(`#pack [data-dog="${d.id}"]`) && hoBedFor(d) === b) ? '' : 'none'; });
  svg.querySelectorAll('#pack .packdog').forEach((g) => {
    g.removeAttribute('transform'); const d = dogById(g.dataset.dog); if (!house || !d || !d.sleeping) return; const b = hoBedFor(d); if (!b) return;
    const lipEl = b === S.bed ? $('#bedFront .pa-bed-front') : svg.querySelector(`.ho-bedfront[data-bed="${CSS.escape(b)}"] .pa-bed-front`), lipR = lipEl && lipEl.getBoundingClientRect();
    if (!lipR || !lipR.width || !g.getScreenCTM()) return;
    const r = g.getBoundingClientRect(), inv = g.getScreenCTM().inverse(), w = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(inv); }; if (!r.height) return;
    const a = w(r.left, r.top), c = w(r.right, r.bottom), l0 = w(lipR.left, lipR.top), l1 = w(lipR.right, lipR.top);
    const k = Math.min(1, ((l1.x - l0.x) * 0.78) / (c.x - a.x)), h = (c.y - a.y) * k;
    g.setAttribute('transform', `translate(${f1((l0.x + l1.x) / 2)} ${f1(l0.y + h * 0.14)}) scale(${k.toFixed(3)}) translate(${f1(-(a.x + c.x) / 2)} ${f1(-c.y)})`);
  });
}
function setTemp(pose, ms) { tempPose = pose; tempUntil = performance.now() + ms; renderDog(pose); }
// v2.10 ROAM: the leader is one of the roaming dogs (37_roam.js). The v2.9 calls still say where the dog box goes (feet at 430 * scale + tx,
// 500 * scale + ty) and 0, 0, 1 means back where it stands now. #dogPos keeps the old transform as a record (hoAtBedNap, the old suites): inside
// its .rmdog group the CSS keeps it flat and rmLegacyTo moves the group
function dogTo(tx, ty = 0, scale = 1, secs = 0.9) {
  const p = $('#dogPos'); if (!p) return; p.style.transitionDuration = secs + 's';
  p.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  // phones: the camera follows the leader's errands as in v2.9 (back home = the scene's home crop); an idle wander while the player looks around leaves the view
  if (isPhone() && cur.mode === 'yard') { const home = tx === 0 && ty === 0 && scale === 1; phCamHome = S.place === 'fujihill' || home ? phHomeCx : scale === 1 ? phHomeCx + tx : 430 * scale + tx; if (phPeekOn && typeof IDLE === 'object' && IDLE.act) { /* looking around */ } else { if (phPeekOn) { phPeekOn = false; clearTimeout(phPanT); } camTo(phCamHome, secs); } }
  else if (phPeekOn && !(typeof IDLE === 'object' && IDLE.act)) { phPeekOn = false; clearTimeout(phPanT); }
  const fol = $('#pkFol'); if (fol && fol.closest('.rmdog')) $('#pack').after(fol); // v2.9 Fetch followers are placed in world units, not with the leader
  if (p.closest('.rmdog')) rmLegacyTo(tx, ty, scale, secs);
}
// v2.5: the art module draws some foods in the bowl itself (WORLD_B.bowlFoods). Every other food (the v2.4 and v2.5 foods) used to
// show an empty bowl, so it is composed here: the empty bowl, the food's own item art, then the bowl's front wall again on top, so
// the food sits inside the bowl. The bowl is bowl(60, 62, rx 45, ry 12) in its 120 x 120 box. The front wall is everything below the
// near half of the rim.
let fbBowlN = 0;
function fbBowlKnows(food) {
  const W = PA().WORLD_B, list = W && Array.isArray(W.bowlFoods) ? W.bowlFoods : null; if (list) return list.includes(food);
  const real = artReal('prop', 'bowl', { food }), none = artReal('prop', 'bowl', { food: '-' }); return !!real && real.length > none.length * 1.3;
}
function bowlArt(food) {
  if (!food) return artReal('prop', 'bowl', {}) || art('prop', 'bowl-empty');
  const real = fbBowlKnows(food) && artReal('prop', 'bowl', { food }); if (real) return real;
  if (food === 'Fresh Water') return artReal('prop', 'water-bowl') || art('prop', 'bowl-empty');
  const bowl = artReal('prop', 'bowl', {}) || art('prop', 'bowl-empty'), id = 'fbBowlFront' + (++fbBowlN);
  return `<svg viewBox="0 0 120 120"><defs><clipPath id="${id}"><path d="M14 62 A46 12.5 0 0 0 106 62 L108 122 L12 122 Z"/></clipPath></defs>${place(bowl, 0, 0, 120, 120)}${place(art('item', food), 25, 12, 70, 70)}<g clip-path="url(#${id})">${place(bowl, 0, 0, 120, 120)}</g></svg>`;
}
// v2.5: the bowl shows only while feeding: from the Feed tray opening until the eating ends (also while the dog drinks).
// Hidden with visibility, so its box (kept clear by the props, piles and pack dogs) stays where it was.
let fbBowlFood = null;
function setBowl(food) { fbBowlFood = food || null; const b = $('#bowlG'); if (b) { b.innerHTML = (isPhone() ? '<rect x="195" y="452" width="110" height="110" fill="transparent"/>' : '') + place(bowlArt(food), 205, 462, 90, 90); b.setAttribute('aria-label', food ? tt('yard.label_food_bowl_with', 'Food bowl with {food}', { food: homeName(food) }) : tt('yard.label_empty_food_bowl', 'Empty food bowl')); } fbBowlSync(); }
function fbFeedTrayOpen() { return cur.mode === 'yard' && !!dock.querySelector(':scope > .tray [data-food]'); }
function fbBowlSync() { const b = $('#bowlG'); if (b) b.style.visibility = fbBowlFood || fbFeedTrayOpen() ? '' : 'hidden'; }
function fxText(txt, x, y, color = '#F28FA5', size = 38) {
  const fx = $('#fx'); if (!fx) return;
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('font-size', size); t.setAttribute('fill', color); t.setAttribute('stroke', INKG); t.setAttribute('stroke-width', '1.4'); t.setAttribute('paint-order', 'stroke');
  t.setAttribute('class', 'heartfx'); t.setAttribute('text-anchor', 'middle'); t.textContent = txt; fx.appendChild(t); setTimeout(() => t.remove(), 1000);
}
function enterYard() {
  setChrome(true, true);
  view.innerHTML = yardWorldSVG(); dogKey = ''; busy = false;
  renderDog(dogPoseNow()); setBowl(fbBowlFood); // v2.5: S.bowl is saved, so after a reload mid-meal it could keep a full bowl on show: the live state wins
  phHomeCx = 358; phCamHome = isPhone() ? phHomeCx : 430; view.style.background = ''; clearTimeout(phPanT); cancelAnimationFrame(camRaf); phPeekOn = false; view.style.removeProperty('--vfit'); view.style.removeProperty('--trayH'); phZoom = 1;
  camCx = phCamHome; camApply(camCx); if (isPhone()) phHomeRefit();
  if (S.sleeping) { dogTo(...napSpot(), 0); fbNapFit(dogPoseNow()); showZzz(true); }
  updateHUD(); bindDev(); bindMess(); bindPack(); greetWalker(); drawFluff(); setTimeout(() => yardReaction(false), 700);
  hmDecorBind(); // v2.7: every bed (the Care tray), decoration (its card) and piece of furniture (its card) in the yard or the house
  const svg = $('svg.world', view), hit = $('#dogHit');
  phCamPan(svg); if (isPhone()) phPeek();
  // petting: rub (mouse hover-rub or touch drag) or tap
  let last = null, down = false, moved = 0;
  const tickFrom = (e) => { const w = toWorld(svg, e.clientX, e.clientY); petTick(w.x, w.y); };
  hit.addEventListener('pointerdown', (e) => { SFX.init(); down = true; moved = 0; last = { x: e.clientX, y: e.clientY }; try { hit.setPointerCapture(e.pointerId); } catch (er) { /* capture unsupported */ } });
  hit.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && !down) return;
    if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
    const d = Math.hypot(e.clientX - last.x, e.clientY - last.y); last = { x: e.clientX, y: e.clientY }; moved += d; pet.dist += d;
    if (pet.dist > 70) { pet.dist = 0; tickFrom(e); }
  });
  hit.addEventListener('pointerup', (e) => { if (down && moved < 8) { const mb = mailboxBehindDog(e.clientX, e.clientY); if (mb) { down = false; mb.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; } tickFrom(e); tickFrom(e); } down = false; });
  hit.addEventListener('pointerleave', () => { if (!down) last = null; });
  hit.addEventListener('pointercancel', () => { down = false; last = null; });
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); petTick(560, 380); } });
  const bowl = $('#bowlG'); bowl.onclick = () => { if (blOn()) return; popAct = 'feed'; openFeedTray(); }; bowl.onkeydown = (e) => { if (e.key === 'Enter' && !blOn()) { popAct = 'feed'; openFeedTray(); } }; // v2.10: ball play keeps its dock
  if (S.place !== 'house' && S.place !== 'yard' && S.place !== 'market') setTimeout(() => placeAmbient(), 2500);
  const sx = $('#secretX'); if (sx) { sx.onclick = secretDig; sx.onkeydown = (e) => { if (e.key === 'Enter') secretDig(); }; }
  const house = $('#houseG'); if (house) { house.onclick = () => { if (blOn()) return; popAct = 'care'; openCareTray(); }; house.onkeydown = (e) => { if (e.key === 'Enter' && !blOn()) { popAct = 'care'; openCareTray(); } }; }
  placeButtons();
  bindSceneHots();
  // ambient jokes
  let next = performance.now() + 6000;
  const iv = setInterval(() => {
    if (busy || curling || TRN || !modal.hidden || cur.mode !== 'yard' || popOpen() || RM.paused.size || (typeof blOn === 'function' && blOn())) return; // v2.10: quiet during ball play
    if (performance.now() > next) { next = performance.now() + RAND(14000, 24000); if (popOpen()) return; if (S.dogs.length > 1 && Math.random() < 0.5) packAmbient(); else if (!IDLE.act) dogJoke(); }
  }, 1000);
  onCleanup(() => clearInterval(iv));
  if (S.sleeping) sleepTray(); else dockIdle();
  if (isPhone()) phTrayFit();
  emit('yard:enter', { place: S.place });
}
// v2.2 phone: swipe the yard or house sideways to look around (the camera crop is about half the scene). It eases back to the dog after a few seconds.
let phCamHome = 430, phHomeCx = 358, phPanT = 0, phPeekOn = false, phZoom = 1; // phPeekOn: the look-right button holds the camera away from the dog
// v2.3 phone: the camera home. The crop is about 346 units wide, so it sits left of the dog (x 358): the bowl (195-305), the Town Square easel / Dog Park board
// (194+) and the whole dog (332-517) fit together. With a visiting dog it spans dog + visitor, and Market Street zooms out so more than one shop shows.
// phHomeRefit works out the span, zooms the scene out (--vfit on #view) when the span is wider than the crop, and homes the camera on its middle.
function phSvgDims() { const svg = $('#view > svg.world'); return { w: (svg && svg.clientWidth) || view.clientWidth, h: (svg && svg.clientHeight) || view.clientHeight }; }
function phHomeRefit() {
  if (!isPhone() || (cur.mode !== 'yard' && cur.mode !== 'market') || !$('#view > svg.world')) return;
  let L = 186, R = 530, fitMin = 0.62;
  const vz = $('#visitorG', view), wide = cur.mode === 'yard' && S.place !== 'market'; // v2.10 ROAM: every other place shows the whole pack (the Mt. Fuji Lookout too: at the old crop the dogs stood as tall as the torii)
  if (S.place === 'market') { L = 186; R = 592; fitMin = 0.78; } // the bowl, the dog and the "Market Street" sign together: the street zooms out a little when the screen is narrow
  else if (S.place === 'fujihill') { L = 250; R = 596; } // v2.8 FUJI HILL: the dog on the path, the bench (x 488-572) and Fuji's summit in the crop at 390 and 360 px
  else if (wide && S.place === 'yard' && !vz) { L = 140; } // v2.10: the missions clipboard's 48 px tap rect (it grows left of the clipboard when the scene is zoomed out)
  else if (wide && vz) { const sp = visitorSpot(), w = 264 * sp[3]; L = 306; R = Math.max(R, sp[0] + w / 2 + 6); } // a visiting dog: the dog and the visitor, as in v2.3
  else if (vz) { const sp = visitorSpot(), w = 264 * sp[3]; L = 306; R = Math.max(R, sp[0] + w / 2 + 6); }
  const vw = view.clientWidth, vh = view.clientHeight - (parseFloat(view.style.getPropertyValue('--trayH')) || 0); if (!vw || vh <= 0) return;
  const native = 600 * vw / vh;
  if (wide) { // v2.10 ROAM: about 700 world units wide (V210.md section 5.2): zoomed out through the viewBox like Market Street, the extra sky above the scene
    phZoom = Math.min(1, native / rmCropFit(vw, native)); view.style.removeProperty('--vfit'); view.style.background = phZoom < 1 ? rmSky() : '';
  } else {
    const fit = Math.max(fitMin, Math.min(1, native / (R - L)));
    view.style.setProperty('--vfit', fit.toFixed(3));
    if (S.place === 'market') { // the street's own layout (22_phone_town.css) ignores --vfit, so it zooms through the viewBox; the extra sky above the scene takes the sky's colour
      phZoom = fit; view.style.background = '';
      const sky = $('#view > svg.world #sceneG rect[width="1000"][height="452"]'), m = sky && /url\(#([^)]+)\)/.exec(sky.getAttribute('fill') || ''), gr = m && $('#view > svg.world #' + m[1]), st = gr && gr.querySelector('stop');
      if (st) view.style.background = st.getAttribute('stop-color') || getComputedStyle(st).stopColor || '';
    }
  }
  // v2.10 ROAM: the wider crop keeps the v2.3 home span (the bowl, the dog's spot, a visitor) in view and leans towards the middle of the pack
  const half = wide ? Math.min(500, native / phZoom / 2) : 0, pk = wide ? rmSpan() : null;
  phHomeCx = !wide || !rmWander() || R - L >= half * 2 ? (L + R) / 2 : clamp(clamp((pk[0] + pk[1]) / 2, R - half, L + half), half, 1000 - half); // the harness keeps the v2.3 home (the older suites tap props by where they were)
  if (!S.sleeping || S.place === 'fujihill') { phCamHome = phHomeCx; camCx = phCamHome; }
  camApply(camCx);
}
// v2.3 phone: a feed / care / nap tray never covers the scene. The scene shrinks into the part of the view above the tray (the whole scene stays visible).
function phTrayFit() {
  if (!isPhone()) return;
  let h = 0;
  if (cur.mode === 'yard') {
    const pb = $('#placeBtns'); if (pb && pb.children.length) h = pb.offsetHeight + 14; // v2.10: 14 (was 8), so a prop drawn on the scene's bottom edge ends above the buttons (they sit 10 px up) // the place buttons (Garden, Go inside, Café menu...) get their own strip under the scene, so they never cover a prop
    const tr = dock.querySelector(':scope > .tray'); if (tr && !tr.classList.contains('dock-idle')) { phTrayCap(tr); h = tr.offsetHeight; const d = tr.querySelector('.napdet:not([hidden])'); if (d) h += d.offsetHeight + 8; }
  }
  const cur0 = parseFloat(view.style.getPropertyValue('--trayH')) || 0; if (Math.abs(cur0 - h) < 1) return;
  if (h) view.style.setProperty('--trayH', h + 'px'); else view.style.removeProperty('--trayH');
  phHomeRefit();
}
// v2.7 phone review: a tall tray (the pack chips over two rows of cards on iPhone 13) left a 135 px scene band, so #dogHit slid under the place chip.
// The tray is capped so the scene band above it stays at least PH_BAND_MIN px; its body scrolls inside the tray (measured from the dock, as the tray slides up).
// The nap tray (its note floats above it) is left alone.
const PH_BAND_MIN = 180; // v2.14 fit: was 204; the Feed tray with the pack note (de, id, zh at 360 x 640) needs about 25 px more, and 180 still keeps #dogHit clear of the place chip
function phTrayCap(tr) {
  if (tr.classList.contains('nap')) { tr.style.removeProperty('max-height'); return; }
  const cap = Math.round(dock.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(dock).paddingBottom) || 0) - view.getBoundingClientRect().top - PH_BAND_MIN), want = cap >= 160 ? `min(88%, ${cap}px)` : '';
  if (tr.style.maxHeight !== want) tr.style.maxHeight = want;
}
// v2.5: at most one fit per frame. It used to cancel and ask again on every dock change, so a dock that changes every frame (the fetch timer) starved it.
{ let raf = 0; new MutationObserver(() => { fbBowlSync(); if (!raf) raf = requestAnimationFrame(() => { raf = 0; phTrayFit(); }); }).observe(dock, { childList: true, subtree: true }); }
// v2.5: drag to look around, with a finger or a mouse, in the yard, the house and every town place. A press that moves more than
// FB_DRAG px is a drag: it pans the camera (phones; the desktop scene already shows its whole width) and never also taps the prop,
// decoration, pack dog or mess it started on. A drag that starts on the dog still rubs (pets) the dog. The view eases back to the
// dog 4 s after the drag (the look-right button holds it instead).
const FB_DRAG = 10;
function phCamPan(svg) {
  let x0 = null, y0 = 0, c0 = 0, id = null, on = false, swallow = false, swT = 0;
  svg.addEventListener('click', (ev) => { if (swallow) { swallow = false; ev.stopPropagation(); ev.preventDefault(); } }, true);
  svg.addEventListener('pointerdown', (e) => {
    swallow = false; if (x0 != null || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('#dogHit, .cr-pet')) return; // v2.8.4: a rub on a pack dog (crPetBind) is petting, not a pan
    x0 = e.clientX; y0 = e.clientY; c0 = camCx; id = e.pointerId; on = false;
  });
  svg.addEventListener('pointermove', (e) => {
    if (x0 == null || e.pointerId !== id) return; const dx = e.clientX - x0;
    if (!on) { if (Math.hypot(dx, e.clientY - y0) < FB_DRAG) return; on = true; clearTimeout(phPanT); cancelAnimationFrame(camRaf); try { svg.setPointerCapture(id); } catch (er) { /* none */ } }
    if (!isPhone()) return;
    const { w: vw, h: vh } = phSvgDims(); if (!vw || !vh) return;
    const vbW = 600 * vw / vh / phZoom; if (vbW >= 1000) return;
    const cx = clamp(c0 - dx * vbW / vw, vbW / 2, 1000 - vbW / 2); if (Math.abs(cx - camCx) < 0.5) return;
    if (!phPeekOn && Math.abs(camCx - phCamHome) < 1) hideBubble(); phPeekOn = false; camCx = cx; camApply(camCx);
  });
  const end = (e) => {
    if (x0 == null || e.pointerId !== id) return; x0 = null; if (!on) return;
    on = false; swallow = true; clearTimeout(swT); swT = setTimeout(() => { swallow = false; }, 400); // the click that follows a drag is not a tap
    clearTimeout(phPanT); if (isPhone()) phPanT = setTimeout(() => { if ((cur.mode === 'yard' || cur.mode === 'market') && !phPeekOn) camTo(phCamHome, 0.8); }, 4000);
  };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  // the scene is touch-action:none, but Safari can still take a finger drag on an SVG for its own page gesture (and cancel the pointer)
  svg.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  onCleanup(() => { clearTimeout(phPanT); clearTimeout(swT); });
}
// v2.3 phone: a small button on the right edge looks at the right half of the scene (the house, notice board, café counter, vet desk, salon table) and back
function phPeekCx() { // the world x at the middle of the right-half prop (house, notice board, counter, desk, table)
  const svg = $('svg.world', view), el = $('#houseG') || $('#sceneG [data-hot]'); if (!svg || !el) return S.place === 'market' ? 800 : 750;
  if ($('#houseG')) return 715; // the yard: the Crayon Box, Doggy Ramp, nursery basket and the whole dog house share one crop (525-871)
  const r = el.getBoundingClientRect(), a = toWorld(svg, r.left, r.top), c = toWorld(svg, r.right, r.bottom), m = (a.x + c.x) / 2;
  return m > phCamHome + 80 ? m : 750;
}
function phPeek() {
  const svg0 = $('#view > svg.world'), vw = view.clientWidth, vh = view.clientHeight; if (!svg0 || !vw || !vh) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'iconbtn ph-peek'; b.id = 'phPeek'; view.appendChild(b);
  b.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 12 Q29 22 31 24 Q28 28 19 36" fill="none" stroke="#5B3D32" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 11 Q31 21 33 24" fill="none" stroke="#F28FA5" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>';
  const right = () => camCx > phCamHome + 80;
  const sync = () => { const r = right(); b.classList.toggle('back', r); b.setAttribute('aria-label', r ? tt('yard.label_look_back_at_the_dog', 'Look back at the dog') : tt('yard.label_look_right', 'Look right')); };
  const back = () => { phPeekOn = false; clearTimeout(phPanT); camTo(phCamHome, 0.6); };
  b.onclick = () => { SFX.click(); clearTimeout(phPanT); if (right()) back(); else { phPeekOn = true; hideBubble(); camTo(phPeekCx(), 0.7); } };
  // the view stays where the player put it (they may be reading a board): it goes back on their next tap on the scene, or when the dog walks (dogTo; v2.5: not its idle wander)
  svg0.addEventListener('pointerdown', (e) => { if (phPeekOn && !e.target.closest('.hot, [data-hot], [data-shop]')) back(); }, true);
  sync(); const iv = setInterval(sync, 250); onCleanup(() => clearInterval(iv));
}
// v2.0.1: the dog's rectangular hit box overlaps the yard mailbox (drawn behind the dog). A tap inside the mailbox where the dog itself
// is not painted goes to the mailbox; a tap on the painted dog still pets. Returns the mailbox element, or null.
function mailboxBehindDog(cx, cy) {
  const hit = $('#dogHit'), mb = $('#mailboxG') || $('#sceneG [data-hot="mailbox"]'); if (!hit || !mb) return null;
  const r = mb.getBoundingClientRect(); if (!r.width || cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
  const prev = hit.style.pointerEvents; let el = null;
  hit.style.pointerEvents = 'none'; try { el = document.elementFromPoint(cx, cy); } finally { hit.style.pointerEvents = prev; }
  return el && mb.contains(el) ? mb : null;
}
const WX_LINES = {
  shiba: { rain: 'Rain? On ME? I would like to speak to the manager of the sky.', coat: 'Behold. A dog who does not get wet. Bow.', snow: 'Cold. Unacceptable. A sweater, please. Now.', warm: 'Snow is beneath me. I will zoom across it anyway.', hot: 'Too hot to be this dramatic. I will try.', night: '*yawn* Even legends sleep.', dawn: 'Morning. You may bring breakfast.' },
  corgi: { rain: 'Wet butt alert! Wet butt alert!', coat: 'Raincoat on! Puddles are basically soup now!', snow: 'My legs are too short for this. Sweater? Snacks? Both?', warm: 'SNOW ZOOMIES! Low to the ground, maximum speed!', hot: 'Too hot. Is it ice-cream weather? It is ice-cream weather.', night: '*yawn* Dreaming about snacks in 3... 2...', dawn: 'GOOD MORNING! Is it breakfast? It is breakfast!' },
  golden: { rain: 'RAIN! I love rain! I am now 40% water!', coat: 'Splash splash splash! I love my coat! I love puddles!', snow: 'Brr! Snow is great but my toes are cold. Sweater?', warm: 'SNOW! Best day ever! Again!', hot: '*pant pant* Water? Water would be great!', night: '*yawn* Best day. Can tomorrow be best day too?', dawn: 'You are AWAKE! Best morning ever!' },
  dachs: { rain: 'Rain makes the dirt extra diggable. Also soggy.', coat: 'Fully covered. Every one of my 40 centimetres.', snow: 'My belly is touching the snow. All of it. Help.', warm: 'Snow tunnels! I am a submarine now!', hot: 'Too hot to dig. Digging a cool spot anyway.', night: '*yawn* The back half fell asleep first.', dawn: 'Morning! I dug up the sunrise. You are welcome.' },
  husky: { rain: 'AWOO. This is not snow. I demand snow.', coat: 'I look ridiculous and I am very dry. AWOO.', snow: 'Snow! But my fancy coat is wet. A sweater would be nice. AWOO.', warm: 'SNOW! THIS IS MY MOMENT! AWOOOOO!', hot: '*pant* I was built for snow, not this.', night: 'AWOO at the moon. Then nap. Then AWOO.', dawn: 'AWOO! The sun is up! Everyone wake up!' },
  mutt: { rain: 'I do not mind the rain if you are here.', coat: 'Thank you for keeping me dry. You are the best.', snow: 'Brr. Could I borrow something warm? Only if it is okay.', warm: 'Toasty and snowy! Can we play?', hot: 'It is warm. Can I sit in your shadow?', night: '*yawn* Goodnight. You are my favourite.', dawn: 'Good morning. I waited for you. Hi.' },
  chihuahua: { rain: 'Rain is a personal attack. I am shivering in protest.', coat: 'Coat on. Still shivering. It is my brand.', snow: 'I am FREEZING. I am also furious. Sweater. NOW.', warm: 'Sweater on. Now I fear nothing. Not even snow. Mostly.', hot: 'Finally, my temperature. I will sunbathe aggressively.', night: '*yawn* Security system entering sleep mode. Still watching.', dawn: 'GOOD MORNING. I barked at the sun. It came up anyway.' },
  pug: { rain: 'Rain. No. I will be indoors. snort.', coat: 'Raincoat on. I look like a tiny dry potato.', snow: 'Cold nose. Cold toes. Cold everything. Sweater?', warm: 'Toasty sweater. I could nap in the snow. Do not let me.', hot: '*snort pant snort* Flat faces do not do heat. Shade, please.', night: '*SNORE* (that was a yawn)', dawn: 'Morning? Already? Five more hours. snort.' },
  greyhound: { rain: 'Rain. I will lie on the sofa until it stops. Or forever.', coat: 'Coat on. My legs are still wet. There is a lot of leg.', snow: 'No fur. No fat. Just legs. Please, a sweater.', warm: 'Sweater on. Snow zoomies? One lap. Okay, three.', hot: 'Too hot to run. Perfect weather to lie flat.', night: '*yawn* Upside-down sleep time. Do not judge.', dawn: 'Morning. I have been awake for one minute. Nap soon.' },
  beagle: { rain: 'Rain makes every smell louder! Worms! Mud! Sandwich!', coat: 'Coat on. My nose is still out. That is the important part.', snow: 'Snow hides the smells. This is a tragedy. Also cold. Sweater?', warm: 'Warm and snowy. Let us find out what is under the snow. AROO!', hot: '*pant* Hot pavement smells like chips. Still too hot.', night: '*yawn* The night smells different. One more sniff. Then bed.', dawn: 'AROOOO! Morning! I smelled breakfast before you woke up!' },
  poodle: { rain: 'Rain flattens the curls. I need a moment.', coat: 'A raincoat. Very chic. The curls survive.', snow: 'The curls are not a coat. A sweater, please.', warm: 'Sweater on. Now I am a stylish snowball.', hot: 'Too hot for curls. I will be elegant in the shade.', night: '*yawn* Even geniuses need sleep.', dawn: 'Good morning. I have been awake for hours. Thinking.' },
  collie: { rain: 'Rain. Nobody stays together in the rain. I am stressed.', coat: 'Coat on. Now herd the puddles.', snow: 'Snow! The sheep could be anywhere. Brr. Sweater?', warm: 'Sweater on. I can work all day in this.', hot: 'Too hot to herd. I will watch everyone from the shade.', night: '*yawn* Everyone is home. I counted. Now I sleep.', dawn: 'Good morning! What is the job today? Is there a job?' },
  samoyed: { rain: 'Wet fluff is heavy fluff. I am a soggy cloud.', coat: 'A raincoat on a cloud. Very sensible.', snow: 'SNOW! This is my weather! Woo-woo!', warm: 'Sweater AND snow? I will be too toasty. Worth it.', hot: '*pant* Too much sun for this much fluff. Shade and water, please.', night: '*yawn* Smiling in my sleep. Probably.', dawn: 'Woo-woo! Good morning! I missed you all night!' },
  frenchie: { rain: 'Rain. No. *snort* I will be under the table.', coat: 'Raincoat on. I look like a small grumpy potato. A dry one.', snow: 'Cold ears. Cold paws. Sweater, please. *snort*', warm: 'Sweater on. Now I can sit in the snow. For a minute.', hot: '*snort* Flat faces and sun do not mix. Shade, please.', night: '*SNORE* (that was a yawn)', dawn: 'Morning. *snort* I have been awake for one minute.' },
  akita: { rain: 'Rain. I will sit under the roof and watch it fall. Calmly.', coat: 'Coat on. I stay dry and I stay dignified.', snow: 'Snow is lovely. My thick coat agrees. A sweater is still very nice.', warm: 'Snow and a sweater. Now I am cosy and dignified.', hot: '*pant* A thick coat on a warm day. Shade and water, please.', night: '*yawn* All is quiet. Good night.', dawn: 'Good morning. I have been watching the door for you.' },
  spitz: { rain: 'Wet fluff is sad fluff. I am a small damp cloud.', coat: 'Raincoat on. The fluff stays dry. We are saved.', snow: 'Snow! I match the snow! Nobody can find me!', warm: 'Sweater and snow. I am a fluffy snowball in a sweater.', hot: '*pant* All this white fluff and all this sun. Shade, please.', night: '*yawn* Sparkle off. Sleep on.', dawn: 'Good morning! Look, my fluff is already perfect!' },
  pom: { rain: 'Each raindrop is bigger than my paw. I am staying in.', coat: 'Tiny raincoat. Big feelings. Dry fluff.', snow: 'Snow is up to my chin. Yip! Sweater, please.', warm: 'Sweater on. I am a small fluffy snowball.', hot: '*pant* Tiny dogs get hot fast. Shade and a drink, please.', night: '*yawn* Tiny yawn. Tiny snore.', dawn: 'YIP! Good morning! I am awake and in charge!' },
  afghan: { rain: 'Rain on silk. No. Not on silk. Indoors, please.', coat: 'Raincoat on. My hair is saved. The day is saved.', snow: 'Snow in the silk! Elegant, but chilly. A sweater, please.', warm: 'Sweater and snow. A very fashionable winter.', hot: '*pant* All this hair and all this sun. Shade, please.', night: '*yawn* Beauty sleep. It is a real thing.', dawn: 'Good morning. I woke up looking like this.' },
  dane: { rain: 'Rain. I am too tall to hide. I will lean on the house.', coat: 'Coat on. It is a tent for a Dane. Cosy.', snow: 'Long legs in deep snow. Brr. A sweater, please.', warm: 'Sweater on. Now I am a tall, cosy snowman.', hot: '*pant* A big dog in the heat. Shade and water, please.', night: '*yawn* All of me is sleepy. It takes a while to reach the tail.', dawn: 'Good morning. I stretched. It took half a minute.' },
  mastiff: { rain: 'Rain. I will stay in. The sofa will not mind.', coat: 'Coat on. I am a very dry hill.', snow: 'Cold nose, warm heart. A sweater would make it fair.', warm: 'Sweater and snow. Gentle snow. Gentle me.', hot: '*pant drool pant* Big dogs feel the heat. Shade, water and a towel, please.', night: '*SNORE* (that was a yawn)', dawn: 'Morning. *slow blink* Breakfast is ready in my head.' },
  gsd: { rain: 'Rain! I will patrol anyway. Someone must.', coat: 'Raincoat on. I am a neat, waterproof guard.', snow: 'Snow! A great place for a job. Brr. A sweater helps.', warm: 'Sweater and snow. Ready for duty.', hot: '*pant* Too hot for patrol. I will guard from the shade.', night: '*yawn* All quiet. Guard mode: low. Not off.', dawn: 'Good morning! What is the plan? Is there a plan?' },
  // v2.12 Fourteen New Friends
  dobie: { rain: 'Rain. My short coat does not like it. Indoors, please.', coat: 'Coat on. Rain off. I am a sleek, dry guard.', snow: 'Snow! Brr. Short coat, long legs. A sweater, please. Quickly.', warm: 'Sweater and snow. Now I can patrol in comfort.', hot: 'A warm day. Shade and water for the guard, please.', night: 'Night patrol is over. Everything is secure. Sleep.', dawn: 'Morning. The perimeter is fine. Breakfast is next.' },
  corso: { rain: 'Rain. I am big and calm and slightly damp. It is fine.', coat: 'Coat on. A dry mountain. A calm one.', snow: 'Snow. Cold feet, warm heart. A sweater would help.', warm: 'Sweater and snow. A big, cosy guardian.', hot: 'Big dogs feel the heat. Shade, water and a long sit, please.', night: 'All is quiet. The guardian may close one eye. Only one.', dawn: 'Good morning. I watched the sun come up. It behaved.' },
  pitbull: { rain: 'Rain! Puddles! Wiggle wiggle splash! ...oh, my coat is thin. Towel?', coat: 'Raincoat on! A dry, wiggly goofball in a coat!', snow: 'Snow! So fun! So cold! Short fur, big heart. Sweater, please!', warm: 'Sweater and snow! The best of both! Wiggle!', hot: 'Phew, warm. Shade and water, please. Then more wiggling.', night: '*yawn* Best day. Can I sleep on your feet?', dawn: 'Good morning! You are here! I am wiggling! All of me!' },
  minpin: { rain: 'Each raindrop is a personal insult. I am staying in.', coat: 'Coat on. Still prancing. High knees in puddles.', snow: 'My belly is in the snow. It is a disaster. Sweater, now.', warm: 'Sweater on! Now I can prance in the snow. High knees!', hot: 'Warm and sunny. A tiny dog needs a drink and shade. Then I zoom.', night: '*yawn* A tiny yawn. A tiny snore. A tiny blanket, please.', dawn: 'GOOD MORNING. I have already done three laps of the room.' },
  lab: { rain: 'RAIN! Puddles! I am a duck now! Is it dinner?', coat: 'Coat on! Splash! Still a duck! Still hoping for dinner!', snow: 'Snow! I will eat it. It is cold! I will eat more!', warm: 'Sweater and snow! A happy, warm snow lab! Fetch?', hot: '*pant pant* Water! A pool! A lake! Any water, please!', night: '*yawn* Best day. Can tomorrow have more balls?', dawn: 'Morning! Is it breakfast? It is breakfast! I knew it!' },
  malamute: { rain: 'Woo. Rain. This is not snow. Woo-woo. I am complaining.', coat: 'Coat on over my coat. Woo. I look silly and I am dry.', snow: 'SNOW! Woo-woo-WOO! Now we are talking! Mostly me!', warm: 'Sweater and snow? Too much coat. Worth it. Woo!', hot: '*pant* A thick coat on a warm day. Shade and water, please. Woo.', night: 'Woo. Goodnight, moon. Woo-woo. Goodnight, you.', dawn: 'Woo-woo! Morning! I have a lot to say about it!' },
  chow: { rain: 'Rain. My mane is wet. I am extremely unimpressed.', coat: 'Raincoat over the mane. I look strange and dignified. Both.', snow: 'Snow. My thick coat approves. I will watch it with dignity.', warm: 'A sweater AND the mane? I am a hot, fluffy lion. Pass the snow.', hot: '*pant* Lion coat, warm day. Shade and water, please. Right now.', night: '*yawn* The lion rests. Do not stroke the lion.', dawn: 'Morning. I allow it. You may bring breakfast.' },
  stdpoodle: { rain: 'Rain on curls. The big poodle needs a moment. A long moment.', coat: 'A raincoat on long legs. Very chic. The curls are safe.', snow: 'Long legs in deep snow. Elegant, but cold. A sweater, please.', warm: 'Sweater and snow. A stylish, leggy snowman.', hot: 'Too warm for curls. I will be elegant in the shade, with water.', night: '*yawn* Even clever dogs need rest. I learned three tricks in my dreams.', dawn: 'Good morning. I have already planned the day. It has tricks.' },
  schnauzer: { rain: 'Rain. Wet beard. Wet eyebrows. I will report this to the sky.', coat: 'Coat on. The beard stays out. The beard has standards.', snow: 'Snow in the beard. Cold! Sweater, please. I will guard from inside.', warm: 'Sweater and snow. Beard in the wind, nose in the air.', hot: '*pant* Warm day, wiry coat. Shade and water, please.', night: '*yawn* All quiet. Eyebrows down. Not off.', dawn: 'GOOD MORNING. I heard the first bird. I have notes.' },
  westie: { rain: 'Rain! Mud! I will be a very dirty white dog soon.', coat: 'Raincoat on. The mud cannot get me. Probably.', snow: 'Snow! White on white! You cannot see me! Brr. Sweater?', warm: 'Sweater on. I will dig a snow hole. A cosy one.', hot: '*pant* Warm. I will dig a cool hole in the shade. Good plan.', night: '*yawn* Muddy paws, happy heart. Goodnight.', dawn: 'Morning! The garden is out there! Let me at it!' },
  yorkie: { rain: 'Rain on silk! No. No no no. Carry me. Indoors.', coat: 'Tiny raincoat on. The silk is safe. I am a small waterproof queen.', snow: 'Snow is as tall as me. Sweater. Now. Also carry me.', warm: 'Sweater on. I am a small, silky snowball with a bow.', hot: '*pant* Tiny dogs get hot too. Shade and a drink, please.', night: '*yawn* Tiny yawn. The bow stays on. Goodnight.', dawn: 'Good morning. I have been awake for hours. Brush me.' },
  bichon: { rain: 'Rain makes the puff droop. I am a sad, damp cloud.', coat: 'Raincoat on. The puff is safe. Boing!', snow: 'Snow! I match the snow! Nobody can find me! Boing!', warm: 'A sweater on a puff in the snow. A very fluffy snowball. Boing!', hot: '*pant* All this white fluff and all this sun. Shade, please.', night: '*yawn* Puff off. Sleep on.', dawn: 'Morning! Boing, boing! The puff is already perfect!' },
  maltese: { rain: 'Rain on the silk. Absolutely not. Indoors, with a towel.', coat: 'Raincoat on. The fringe is saved. The day is saved.', snow: 'Snow on the long hair. Cold and soggy. A sweater, please.', warm: 'Sweater and snow. I will float through it. Elegantly.', hot: '*pant* A long white coat in the sun. Shade and water, please.', night: '*yawn* A small white cloud settles down. Goodnight.', dawn: 'Good morning. Please brush the fringe. Gently.' },
  shihtzu: { rain: 'Rain. No thank you. I will be on the sofa. Zzz.', coat: 'Raincoat on. The top-knot stays dry. Mostly. *snort*', snow: 'Cold nose, cold toes. Sweater, please. Then a nap.', warm: 'Sweater and snow. I could nap in it. Do not let me.', hot: '*snort pant* Short nose and warm sun. Shade and water, please.', night: '*SNORE* (that was a yawn)', dawn: 'Morning? Already? The top-knot needs five more hours.' }
};
/* v1.7: per-breed lines for feeding, potty, greetings and walks ({n} name, {He}/{he}/{him}/{his} pronouns) */
const EAT_LINES = { shiba: '{n} ate it slowly. {sex, select, female {She} other {He}} wants you to know who is in charge.', corgi: '{n} finished and checked the bowl for a sequel. {sex, select, female {She} other {He}} is still checking.', golden: '{n} ate it, then thanked you with {sex, select, female {her} other {his}} whole tail. And the bum.', dachs: '{n} ate it, then tried to bury the bowl. {sex, select, female {She} other {He}} is saving it for later.', husky: '{n} ate it and sang {sex, select, female {her} other {his}} review. AWOO.', mutt: '{n} ate it and looked at you like you hung the moon. {sex, select, female {She} other {He}} means it.', chihuahua: '{n} ate three bites, growled at the bowl, then finished {sex, select, female {her} other {his}} meal.', pug: '{n} inhaled it. {sex, select, female {Her} other {His}} snorts say ten out of ten.', greyhound: '{n} ate it delicately with {sex, select, female {her} other {his}} very long face, then lay down.', beagle: '{n} finished in one second. {sex, select, female {She} other {He}} is now sniffing for crumbs in the next street.', poodle: '{n} ate it neatly and checked {sex, select, female {her} other {his}} curls for crumbs. None. Of course.', collie: '{n} ate it fast, then went to check on everyone else\'s bowl.', samoyed: '{n} ate it with a smile. Somehow {sex, select, female {she} other {he}} smiled the whole time.', frenchie: '{n} ate it with a lot of snorting. {sex, select, female {She} other {He}} rates it highly.', akita: '{n} ate calmly, then sat tall and looked at the door.', spitz: '{n} ate it daintily and checked {sex, select, female {her} other {his}} white fluff for crumbs. Spotless.', pom: '{n} ate it in four tiny bites and asked for more in a very tiny voice.', afghan: '{n} ate it elegantly and flicked {sex, select, female {her} other {his}} ears back. Not a crumb on the silk.', dane: '{n} ate the whole bowl in three gulps and politely licked the floor.', mastiff: '{n} ate it slowly and happily. The drool was a generous review.', gsd: '{n} ate it neatly, then sat up straight and waited for the next job.',
  // v2.12 Fourteen New Friends
  dobie: '{n} ate it neatly, checked the room and then rested {sex, select, female {her} other {his}} sleek head on your knee.',
  corso: '{n} ate it slowly and calmly. The bowl was left very clean and slightly damp.',
  pitbull: '{n} ate it with a wiggle so big the bowl moved across the floor.',
  minpin: '{n} ate it in six tiny bites and then pranced a victory lap.',
  lab: '{n} inhaled it, checked the bowl and looked at you with hope. Always hope.',
  malamute: '{n} ate it and gave a long, happy woo-woo. That was the review.',
  chow: '{n} ate it with dignity, then looked at you as if to say: adequate.',
  stdpoodle: '{n} ate it politely, wiped {sex, select, female {her} other {his}} muzzle and thanked you with a little bow.',
  schnauzer: '{n} ate it, and some of it is now in the beard. A wipe is in order.',
  westie: '{n} ate it fast, then dug at the bowl to check for more. Dig, dig.',
  yorkie: '{n} ate it in tiny bites, one eye on the bowl and one on you. Very refined.',
  bichon: '{n} ate it, bounced twice and then spun around the bowl. Dinner is a party.',
  maltese: '{n} ate it delicately, one tiny bite at a time, and kept the fringe out of the bowl.',
  shihtzu: '{n} ate it slowly, then flopped down for a nap right next to the bowl.'
};
const POTTY_LINES = { shiba: '{n} did {sex, select, female {her} other {his}} business and then pretended it never happened.', corgi: '{n} finished and looked at you. Snack for good potty? Snack?', golden: '{n} went potty and is SO proud. Tell everyone.', dachs: '{n} went, then tried to dig a hole for it. Thorough.', husky: '{n} went potty and announced it to the whole street. AWOO.', mutt: '{n} went and checked you saw. Good dog? Good dog.', chihuahua: '{n} picked the exact spot after inspecting nine others. Security reasons.', pug: '{n} went potty, snorted twice and sat down for a rest.', greyhound: '{n} went potty, then did one victory lap.', beagle: '{n} sniffed for two whole minutes first. Research is important.', poodle: '{n} chose the tidiest spot in the yard. Of course {sex, select, female {she} other {he}} did.', collie: '{n} went potty, then checked everyone else was still in the yard.', samoyed: '{n} went potty and smiled about it. Every time.', frenchie: '{n} went potty, snorted once and sat down for a rest.', akita: '{n} went potty without any fuss and trotted back with great dignity.', spitz: '{n} went potty and struck a little pose. In case anyone was watching.', pom: '{n} went potty and did a little spin to celebrate. Yip!', afghan: '{n} chose a spot with a view. Even this needs elegance.', dane: '{n} went potty and then did a very long stretch. There is a lot to stretch.', mastiff: '{n} went potty slowly, sighed and flopped down for a rest.', gsd: '{n} went potty, checked the fence line and came back. Job done.',
  // v2.12 Fourteen New Friends
  dobie: '{n} went potty, checked the perimeter and came back. Duty done.',
  corso: '{n} went potty, slow and steady, and looked very calm about it.',
  pitbull: '{n} went potty and then wiggled over for praise. A big, happy hug followed.',
  minpin: '{n} went potty in two seconds flat and sprinted back. Fastest in the yard.',
  lab: '{n} went potty and then looked for a ball. Business first, ball second.',
  malamute: '{n} went potty and dug a hole nearby to celebrate. Woo.',
  chow: '{n} picked a spot with great care and did not want to be watched. Understood.',
  stdpoodle: '{n} went potty in a very tidy way and trotted back with {sex, select, female {her} other {his}} head high.',
  schnauzer: '{n} went, then sniffed around for notes. The notes say all clear.',
  westie: '{n} went potty and kicked up dirt behind {sex, select, female {her} other {him}}. Dirt everywhere. {sex, select, female {She} other {He}} is delighted.',
  yorkie: '{n} went potty and looked at you. A treat is expected. A tiny, firm look.',
  bichon: '{n} went potty and bounced back for a cuddle. Boing, boing.',
  maltese: '{n} went potty on the very cleanest patch of grass. Standards.',
  shihtzu: '{n} went potty and then lay down on the nearest sunny spot. A short, sleepy break.'
};
const GREET_LINES = { shiba: 'Oh. You are back. I did not notice. (Tail: wagging.)', corgi: 'YOU ARE BACK! Did you bring snacks? You smell like snacks!', golden: 'You came back! Best day! Again!', dachs: 'You are home! I dug you a welcome hole.', husky: 'AWOO! Where were you! Tell me everything! AWOO!', mutt: 'You came back. I knew you would. Hi.', chihuahua: 'WHO GOES THERE. Oh. You. Welcome home. Still checking your ID.', pug: '*snort* You are back. Lap, please. Right now.', greyhound: '*soft roo* You are home. I will lean on you now.', beagle: 'AROOO! I smelled you coming from the corner! What did you eat?', poodle: 'You are back. I knew the time to the minute.', collie: 'You are back! Now everyone is here. I counted.', samoyed: 'Woo-woo! You are home! Look at my smile!', frenchie: '*snort* You are back. Foot, please. I am sitting on it.', akita: 'You are back. Good. Now everything is as it should be.', spitz: 'You are back! Look at my fluff! I fluffed it just for you!', pom: 'YIP YIP YIP! You are home! I spun three times! I will do four!', afghan: 'You are back. I have been gazing out of the window. Very beautifully.', dane: 'You are home! *the tail clears the table* Sorry! Welcome home!', mastiff: '*slow wag* You are home. I will lean on you now. All of me.', gsd: 'You are home! I checked the garden. All clear. Hello!',
  // v2.12 Fourteen New Friends
  dobie: 'You are back! I watched the gate all day. Now I want a cuddle. A big one.',
  corso: '*slow wag* You are home. The house is safe. I will lean on you now.',
  pitbull: 'YOU ARE HOME! Wiggle wiggle wiggle! Hug! Hug! HUG!',
  minpin: 'YIP! You are back! Look at my knees! Prance, prance!',
  lab: 'You are back! Did you bring a ball? A snack? Both? Hello!',
  malamute: 'Woo-woo! Where were you? I have so much to tell you. Woo!',
  chow: 'You are back. I noticed. You may pet me once. Maybe twice.',
  stdpoodle: 'Welcome home. I have learned a new trick. Would you like to see it?',
  schnauzer: 'Who goes there? Oh. You. Welcome home. The beard is pleased.',
  westie: 'You are back! I dug you a welcome hole! It is in the flowers!',
  yorkie: 'Finally. You are late. I forgive you. Pick me up.',
  bichon: 'BOING! You are home! I am a happy cloud! Spin, spin, spin!',
  maltese: 'You are home. I floated to the door. Please admire the entrance.',
  shihtzu: '*yawn* You are home. Good. Lap, please. I will nap there.'
};
const WALK_LINES = { shiba: '{n} walked like the path was built for {sex, select, female {her} other {him}}. It was not.', corgi: '{n} checked every bench for dropped snacks. Two found. Zero shared.', golden: '{n} said hello to every dog, person, and one lamp post.', dachs: '{n} wanted to dig at every single X. And several non-Xs.', husky: '{n} howled at three dogs, one bus, and the concept of walking.', mutt: '{n} kept looking back to check you were still there. You were.', chihuahua: '{n} barked at a dog fourteen times bigger. The dog apologised.', pug: '{n} walked the whole way. Mostly. The last bit was a carry.', greyhound: '{n} sprinted for six seconds and strolled for the rest. Perfect walk.', beagle: '{n} sniffed the whole route. Beagle nose: the Nose-o-meter reached 25% further.', poodle: '{n} trotted the whole way like {sex, select, female {she} other {he}} was in a show. {sex, select, female {She} other {He}} was.', collie: '{n} kept everyone in a neat group. Including two pigeons.', samoyed: '{n} smiled at every person on the route. Most of them smiled back.', frenchie: '{n} took a short walk with lots of sitting. Exactly right.', akita: '{n} walked beside you at a calm, steady pace. Nobody was in a hurry.', spitz: '{n} pranced the whole way with {sex, select, female {her} other {his}} tail up. Four people called {sex, select, female {her} other {him}} fluffy.', pom: '{n} took three steps for each of yours and never stopped. A small engine.', afghan: '{n} floated along with {sex, select, female {her} other {his}} hair streaming. Three people asked for a photo.', dane: '{n} took long, slow strides. Everyone looked up, and up, and then smiled.', mastiff: '{n} walked at a steady, gentle pace and stopped for every pat. It took a while and it was lovely.', gsd: '{n} kept pace beside you and checked every corner. Nothing out of order.',
  // v2.12 Fourteen New Friends
  dobie: '{n} walked at your side, tall and alert, and checked every corner. Nothing out of place.',
  corso: '{n} walked a slow, steady pace and let everyone say hello. Very calm. Very large.',
  pitbull: '{n} wiggled the whole way and made friends with a dog, a bench and a stranger.',
  minpin: '{n} pranced the whole route with high knees. Two people clapped.',
  lab: '{n} said hello to every dog, found a stick and carried it all the way home.',
  malamute: '{n} talked to every dog on the path. Woo-woo. Several answered.',
  chow: '{n} strolled like a small lion on parade and accepted one admiring glance.',
  stdpoodle: '{n} floated along on long legs. A small crowd said: what a graceful dog.',
  schnauzer: '{n} stopped at every corner, raised the eyebrows and reported nothing unusual.',
  westie: '{n} dug at three flower beds and one footpath. {sex, select, female {She} other {He}} is very proud of the footpath.',
  yorkie: '{n} marched past three big dogs like a tiny queen. They all moved over.',
  bichon: '{n} bounced along like a cotton ball on springs. Everyone smiled.',
  maltese: '{n} glided along with {sex, select, female {her} other {his}} fringe swaying. Someone asked for a photo.',
  shihtzu: '{n} walked to the first bench, sat on it and decided that was a good walk.'
};
const NOSE_MUL = { beagle: 1.25, lab: 1.2, westie: 1.1, schnauzer: 1.1, pitbull: 1.1 };
const noseMul = (d = D()) => NOSE_MUL[d && d.key] || 1;
function breedLine(map, d) {
  const l = d && map[d.key]; if (!l) return '';
  const p = PRd(d), tab = map === EAT_LINES ? 'eat_lines' : map === POTTY_LINES ? 'potty_lines' : map === GREET_LINES ? 'greet_lines' : map === WALK_LINES ? 'walk_lines' : 'breed_lines';
  // v2.14: the line in the current language. {n} and the English pronouns ({He} {he} {him} {his} {His}) are filled in here; a translation uses the sex select instead of the pronoun vars
  return tdata(tab + '.' + d.key, l, { n: d.name, sex: d.sex === 'female' ? 'female' : 'male', He: p.He, he: p.he, him: p.him, his: p.his, His: p.His });
}
const reacted = new Set();
function wxLine(k) { const dk = WX_LINES[S.dog.key] ? S.dog.key : 'mutt'; return tdata('wx_lines.' + dk + '.' + k, WX_LINES[dk][k]); }
/* v2.5 (BREEDS): breed welfare tips. Flat faces get a kind heat tip on the adoption card and once as a toast the first hot day. No penalty anywhere. */
const BD_TIPS = { frenchie: 'Flat faces breathe hard in heat. Short walks, shade and water on warm days.', pug: 'Flat faces breathe hard in heat. Short walks, shade and water on warm days.',
  akita: 'Akitas are calm and proud and like their own space. Let them meet new dogs slowly.', spitz: 'That white coat sheds in big clouds twice a year. A good brush keeps it soft, and it never needs shaving.', pom: 'Tiny dogs have delicate knees and windpipes. Use a harness, not a collar, and lift them with both hands.',
  afghan: 'That long silky coat tangles easily. A gentle brush a few times a week keeps it flowing.', dane: 'Giant pups grow fast and their joints need care. Gentle walks while young, and no long runs until fully grown.', mastiff: 'Big dogs feel the heat and drool when warm. Shade, water and a towel for that big face.', gsd: 'Shepherds are clever and love a job to do. Games, training and walks keep them happy.',
  // v2.12 Fourteen New Friends
  dobie: 'Dobermans have short coats and feel the cold. A warm coat on chilly walks and lots of cuddles at home keep them happy.',
  corso: 'Cane Corsos are big, gentle guardians who love their family. Calm, kind training and early friends keep them relaxed.',
  pitbull: 'Pit Bulls are cuddly, people-loving goofballs with lots of energy. Play, walks and gentle training keep them wiggly and happy.',
  minpin: 'Min Pins are tiny and fast and fit through small gaps. A good fence and a snug coat in the cold keep them safe.',
  lab: 'Labs love food a little too much. Measure the meals, go easy on treats and keep them moving.',
  malamute: 'Malamutes wear a thick winter coat all year. Shade and water on warm days, and a good brush when the fluff comes out.',
  chow: 'That thick lion coat gets hot and tangly. Brush it often, and keep summer days cool with shade and water.',
  stdpoodle: 'Poodle curls keep growing and never shed. A brush and a regular trim keep them comfy, and a big poodle loves a long walk.',
  schnauzer: 'That wiry beard and those eyebrows need a trim now and then. A quick wipe after meals keeps the beard tidy.',
  westie: 'Westies can have sensitive skin. A gentle shampoo, a good brush and not too many baths keep it calm.',
  yorkie: 'Yorkie hair grows long and needs a gentle brush most days. Tiny dogs need a harness and soft hands too.',
  bichon: 'That cotton-ball coat keeps growing and tangles. A brush every few days and a trim now and then keep it fluffy.',
  maltese: 'That long silky white coat needs a daily brush. A little topknot keeps the hair out of the eyes.',
  shihtzu: 'Shih Tzus have long hair and short noses. A daily brush, a topknot for the eyes and shade on warm days help a lot.'
};
const BD_HOT = { frenchie: 1, pug: 1, mastiff: 1, chow: 1, malamute: 1, shihtzu: 1 }; // v2.11: only these tips are about heat, so only they toast on the first hot day (the others show on the adoption card)
function bdTip(key) { return BD_TIPS[key] ? tdata('bd_tips.' + key, BD_TIPS[key]) : ''; }
function bdHotTip(d) {
  if (!S || !d || !BD_HOT[d.key]) return; const tip = bdTip(d.key); if (!tip) return;
  if (!S.breedTips || typeof S.breedTips !== 'object') S.breedTips = {};
  if (S.breedTips[d.key]) return; S.breedTips[d.key] = localISO(); markDirty();
  toast(tip, 'good');
}
on('game:ready', () => { if (S && (!S.breedTips || typeof S.breedTips !== 'object')) S.breedTips = {}; });
function yardReaction(force) {
  if (cur.mode !== 'yard' || busy || S.sleeping) return;
  const w = outdoorsNow() ? weatherNow() : 'indoor', t = timePhase(), key = weatherPeriodKey() + '|' + w + '|' + t + '|' + S.place;
  if (reacted.has(key) && !force) return; reacted.add(key);
  const h = dogHeadWorld();
  if (w === 'rain') {
    if (hasRaincoat()) { addStat('happy', 5); setTemp('happy', 1600); SFX.splash(); say(tt('yard.plus_5_happiness_line', '{line} (+5 Happiness)', { line: wxLine('coat') }), h.x, h.y); }
    else {
      addStat('clean', -4); say(wxLine('rain'), h.x, h.y);
      if (!hasRainHat()) setTimeout(() => { if (cur.mode === 'yard' && !busy) { setTemp('shake', 1500); SFX.shake(); fxText(tt('yard.splsh', 'splsh!'), h.x, h.y - 30, '#86B3EA', 30); } }, 1300);
    }
  } else if (w === 'snow') {
    if (isWarm()) { setTemp('happy', 1900); const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-zoom'); void fx.getBBox(); fx.classList.add('tk-zoom'); setTimeout(() => fx.classList.remove('tk-zoom'), 1900); } SFX.snowCrunch(); say(wxLine('warm'), h.x, h.y); }
    else { renderDog('cold'); say(wxLine('snow'), h.x, h.y); }
  } else if (isHot() && S.place !== 'woods' && S.place !== 'house') { renderDog('hot'); say(tt('yard.water_is_extra_refreshing_now', '{line} (Water is extra refreshing now.)', { line: wxLine('hot') }), h.x, h.y); bdHotTip(D()); }
  else if (t === 'night') say(wxLine('night'), h.x, h.y);
  else if (t === 'dawn') { dailyCheck(); if (!S.daily.dawn) { S.daily.dawn = true; addStat('happy', 5); setTemp('happy', 1600); SFX.bark(BARK[S.dog.key]); say(tt('yard.plus_5_happiness_line', '{line} (+5 Happiness)', { line: wxLine('dawn') }), h.x, h.y); } }
  updateHUD(); markDirty();
}
function secretDig() {
  if (busy || S.secretDug || S.mapPieces.length < 4) return;
  if (S.sleeping) { nope(tt('yard.is_asleep_treasure_can_wait', '{name} is asleep. Treasure can wait one nap.', { name: NAME() })); return; }
  busy = true; hideBubble(); dogTo(225, 30, 1, 0.9); renderDog('walk');
  setTimeout(() => { exTrig(D(), 'dig', { pose: 'dig', draw: false }); renderDog('dig'); SFX.crunch(); }, 950); setTimeout(SFX.crunch, 1500); setTimeout(SFX.crunch, 2000); // v2.13: the guilty face while it digs
  setTimeout(() => {
    S.secretDug = true; S.title = 'Treasure Legend'; // saved title: always English, shown through the core's title display S.inv.food['Golden Bone'] = (S.inv.food['Golden Bone'] || 0) + 3;
    if (!S.found['Golden Bone']) S.found['Golden Bone'] = { day: day(), route: 'yard' };
    const c = addCoins(1000, { raw: true }); SFX.treasure(); setTimeout(SFX.fanfare, 400); audioCue('treasure'); markDirty();
    const sx = $('#secretX'); if (sx) sx.remove(); setHudDog(); hudDogKey = ''; setHudDog();
    const chest = artReal('collectible', 'chest') || artReal('icon', 'chest') || art('collectible', 'dig');
    const p = openModal('<span class="hl">' + tt('yard.the_grand_treasure_chest', 'The Grand Treasure Chest!') + '</span>', `<div class="tfind"><div class="tbig">${chest}</div><div><p>${esc(tt('yard.the_x_was_real', 'The X was real. {name} dug up the Grand Treasure Chest of Doodle Doggo.', { name: NAME() }))}</p><ul class="unlocks"><li>${esc(tt('yard.plus_paw_coins', '+{n} Paw Coins', { n: c }))}</li><li>${tt('yard.3_golden_bones_in_the', '3 Golden Bones (in the Food tab)')}</li><li>${tt('yard.new_title_treasure_legend_html', 'New title: <b>Treasure Legend</b> (on your name tag)')}</li></ul><div class="jmap-art small-map">${tornMap()}</div></div></div>`, { cls: 'celebrate', foot: '<button class="btn yes big" id="sdOk">' + tt('yard.legendary', 'Legendary!') + '</button>' });
    $('#sdOk', p).onclick = () => { SFX.boop(700); closeModal(); };
    busy = false; dogTo(0, 0, 1, 0.9); setTemp('happy', 2500);
  }, 2600);
}
function placeButtons() {
  const pb = $('#placeBtns'); if (!pb) return; const b = [];
  if (S.place === 'yard') b.push(gkOn() ? `<button class="btn ${gardenUnlocked() ? 'yes' : ''}" data-pb="garden">${gardenUnlocked() ? tt('yard.garden', 'Garden') : tt('yard.garden_bond_2', 'Garden (Bond 2)')}</button>` : '<button class="btn soon" data-pb="garden" aria-disabled="true">' + tt('yard.garden_coming_soon', 'Garden: coming soon') + '</button>', '<button class="btn" data-pb="house">' + tt('yard.go_inside', 'Go inside') + '</button>');
  if (S.place === 'house') b.push(kOn() ? `<button class="btn ${kitchenUnlocked() ? 'yes' : ''}" data-pb="kitchen">${kitchenUnlocked() ? tt('yard.kitchen', 'Kitchen') : tt('yard.kitchen_bond_3', 'Kitchen (Bond 3)')}</button>` : '<button class="btn soon" data-pb="kitchen" aria-disabled="true">' + tt('yard.kitchen_coming_soon', 'Kitchen: coming soon') + '</button>', '<button class="btn" data-pb="yard">' + tt('yard.go_outside', 'Go outside') + '</button>');
  if (S.place === 'market') Object.keys(SHOP_NAME).forEach((k) => b.push(`<button class="btn" data-sh="${k}">${shopName(k)}</button>`));
  if (S.place === 'beach') { dailyCheck(); b.push(`<button class="btn yes" data-pb="dig" ${S.daily.beachDig ? 'aria-disabled="true"' : ''}>${S.daily.beachDig ? tt('yard.dug_today', 'Dug today') : tt('yard.dig_in_the_sand', 'Dig in the sand')}</button>`); }
  const placeBtn = { square: ['notice', tt('yard.town_notice', 'Town notice')], cafe: ['cafe', tt('yard.cafe_menu', 'Café menu')], dogpark: ['social', tt('yard.socialise', 'Socialise')], vet: ['vet', tt('yard.check_up', 'Check-up')], salon: ['groom', tt('yard.full_groom', 'Full groom')], hilltop: weatherNow() === 'sunny' ? ['kites', tt('yard.watch_kites', 'Watch kites')] : null }[S.place];
  if (placeBtn) b.push(`<button class="btn yes" data-pb="${placeBtn[0]}">${placeBtn[1]}</button>`);
  if (S.place !== 'yard' && S.place !== 'house') b.push(`<button class="btn${S.place === 'market' ? ' yes' : ''}" data-pb="yard">${tt('yard.go_home', 'Go home')}</button>`);
  pb.innerHTML = b.join('');
  pb.querySelectorAll('[data-sh]').forEach((x) => { x.onclick = () => openShop(x.dataset.sh); });
  pb.querySelectorAll('[data-pb]').forEach((x) => { x.onclick = () => { const v = x.dataset.pb, f = { dig: beachDig, garden: openGarden, kitchen: openKitchen, notice: squareNotice, cafe: cafeMenu, social: socialise, vet: vetCheck, groom: salonGroom, kites: kiteWatch }[v]; if (f) f(); else travelTo(v); }; });
}
// v2.3 TOWN-3: the pier bubble goes on the deck under the dog (the boats and the seagull sit above its head); the .below class flips the tail
let bubbleBelowT = 0;
function townBubbleBelowDog() {
  const hit = $('#dogHit'); if (!hit || bubble.hidden) return; const hr = hit.getBoundingClientRect(), sg = stage.getBoundingClientRect(), W = stage.clientWidth;
  const hl = hr.left - sg.left, hrr = hr.right - sg.left, hb = hr.bottom - sg.top, up = [bubble.style.left, bubble.style.top]; // say()'s spot over the head: the fallback
  // the bubble shrinks to fit left of the stage edge, so it re-wraps when it moves: every move re-measures, and it stays on screen (layout numbers: the pop animation scales the rect)
  const at = (l, tp) => { bubble.style.left = l + 'px'; bubble.style.top = tp + 'px'; let w = bubble.offsetWidth; if (l + w > W - 6) { l = Math.max(6, W - 6 - w); bubble.style.left = l + 'px'; w = bubble.offsetWidth; } return { l, t: tp, w, h: bubble.offsetHeight }; };
  bubble.classList.add('below'); let b = at(6, hb + 18); const bw0 = b.w; b = at(clamp(hl + hr.width / 2 - bw0 / 2, 6, W - bw0 - 6), hb + 18);
  const pr = isPhone() && $('#placeBtns'), prr = pr && pr.offsetParent && pr.getBoundingClientRect(); // phones: stay above the place-button row (UI/UX T5)
  if (prr && prr.height && b.t + b.h > prr.top - sg.top - 8) { // no room under the dog: beside it if a side has room, else under it slid clear of the buttons, else back over its head
    const py = prr.top - sg.top - 8;
    if (py - b.h >= hb + 8) b = at(b.l, py - b.h); // (8 px: the dog bobs a little while the line shows)
    else { const r = at(hrr + 8, py); if (r.l >= hrr + 8) b = at(r.l, py - r.h); else { b = at(6, py); if (6 + b.w <= hl - 8) b = at(hl - 8 - b.w, py - b.h); else b = null; } }
    if (b && b.t < view.offsetTop + 4) b = null;
    if (!b) b = at(clamp(hl + hr.width / 2 - bw0 / 2, 6, W - bw0 - 6), hb + 18); } // else under the dog over the row, slid clear of the buttons (below)
  // keep clear of the place buttons (Go home sits bottom-right): slide left of one it would touch
  document.querySelectorAll('#placeBtns .btn').forEach((x) => { const q = x.getBoundingClientRect(), ql = q.left - sg.left, qt = q.top - sg.top; if (b.l < q.right - sg.left + 12 && b.l + b.w > ql - 12 && b.t < qt + q.height + 6 && b.t + b.h > qt - 6) { if (b.w > ql - 18) bubble.style.maxWidth = Math.max(120, ql - 18) + 'px'; const w = bubble.offsetWidth; b = at(Math.max(6, ql - Math.min(24, ql - 6 - w) - w), b.t); } }); // (narrower when the full width would still touch it)
  // v2.12 LAYOUT: the floor is the action bar's top on phones (the bar sits inside the stage: a line slid beside the place buttons re-wraps taller and ran
  // 33 px under it at the Yoyogi dog run); a line that would cross it is lifted to sit on it while it stays beside the dog's lower half
  const bar = isPhone() && $('#bar'), barR = bar && !bar.hidden && bar.offsetParent ? bar.getBoundingClientRect() : null, sgH = barR && barR.height ? Math.min(stage.clientHeight, barR.top - sg.top) : stage.clientHeight;
  if (b.t + b.h > sgH - 4) { b.h = bubble.offsetHeight; const tp = sgH - 6 - b.h; if (tp >= hr.top - sg.top + hr.height / 2 && tp > view.offsetTop + 4) b = at(b.l, tp); }
  const onBtn = [...document.querySelectorAll('#placeBtns .btn')].some((x) => { const q = x.getBoundingClientRect(), ql = q.left - sg.left, qt = q.top - sg.top; return b.l < q.right - sg.left && b.l + b.w > ql && b.t < qt + q.height && b.t + b.h > qt; });
  if (onBtn || b.t + b.h > sgH - 4 || parseFloat(bubble.style.maxWidth || 999) < 170) { bubble.classList.remove('below'); bubble.style.maxWidth = ''; bubble.style.left = up[0]; bubble.style.top = up[1]; return; } // nowhere clear: back over its head (v2.12: also when squeezed under 170 px beside the buttons, where the speech balloon's text ran over its tail)
  clearTimeout(bubbleBelowT); bubbleBelowT = setTimeout(() => bubble.classList.remove('below'), 3700);
}
function placeAmbient() {
  if (cur.mode !== 'yard' || busy || S.sleeping || !modal.hidden) return;
  const h = dogHeadWorld();
  if (S.place === 'river' && Math.random() < 0.6) { say(homePick('duck_lines', DUCK_LINES), h.x, h.y); SFX.honk(); return; }
  if (S.place === 'dogpark' && Math.random() < 0.8) { const k = PICK(dogsList().filter((d) => d.key !== S.dog.key)).key; SFX.bark(BARK[k] || 1); toast(tt('yard.a_zooms_past_2_happiness', 'A {breed} zooms past: "{pick}" (+2 Happiness)', { breed: adBreed(dogInfo(k)), pick: homePick('npc_jokes', NPC_JOKES) }), 'good'); addStat('happy', 2); alertBark(); return; }
  if (S.place === 'hilltop' && weatherNow() === 'sunny' && Math.random() < 0.6) { kiteWatch(); return; }
  if (S.place === 'pier' && Math.random() < 0.5) { say(PICK([tt('yard.a_seagull_is_staring_at', 'A seagull is staring at my snacks. I am staring back.'), tt('yard.the_sea_is_very_big', 'The sea is very big. I approve.'), tt('yard.boats_floating_houses_for_fish', 'Boats! Floating houses for fish.')]), h.x, h.y); townBubbleBelowDog(); return; }
  if (S.place === 'park' && Math.random() < 0.5) { const k = PICK(dogsList().filter((d) => d.key !== S.dog.key)).key; SFX.bark(BARK[k] || 1); toast(tt('yard.a_friendly_trots_by_2', 'A friendly {breed} trots by: "{pick}" (+2 Happiness)', { breed: adBreed(dogInfo(k)), pick: homePick('npc_jokes', NPC_JOKES) }), 'good'); addStat('happy', 2); alertBark(); return; }
  const plk = PLACE_LINES[S.dog.key] ? S.dog.key : 'mutt', l = PLACE_LINES[plk][S.place]; if (l) { say(tdata(tkLinePath(plk, S.place) || (typeof jpLinePath === "function" && jpLinePath(plk, S.place)) || 'place_lines.' + plk + '.' + S.place, l), h.x, h.y); if (S.place === 'pier') townBubbleBelowDog(); }
}
function beachDig() {
  dailyCheck(); if (S.daily.beachDig) { nope(tt('yard.one_beach_dig_a_day', 'One beach dig a day. The sand needs to recover. (It does not.)')); return; }
  if (busy || S.sleeping) return; S.daily.beachDig = true; busy = true; hideBubble(); renderDog('dig'); SFX.crunch(); setTimeout(SFX.crunch, 400);
  setTimeout(() => {
    if (Math.random() < 0.55) { const c = addCoins(RINT(5, 20)); toast(tt('yard.dug_up_coins_in_the_sand', 'Dug up {n, plural, one {# coin} other {# coins}} in the sand! Pirate dog.', { n: c }), 'gold'); }
    else { const j = PICK(JUNK.concat([['junk-rock', tt('yard.a_shell_with_a_smaller', 'A shell with a smaller shell inside. Shell-ception.')]])); const c = addCoins(RINT(2, 5)), ji = JUNK.indexOf(j); toast(tt('yard.found_plus_coins', '{text} (+{n, plural, one {# coin} other {# coins}})', { text: ji >= 0 ? tdata('junk.' + ji + '.1', j[1]) : j[1], n: c }), 'gold'); }
    addStat('happy', favAct('digging') ? 6 : 3); busy = false; exTrig(D(), 'dig', { pose: 'idle', draw: false }); renderDog(dogPoseNow(), 'right', true); placeButtons(); markDirty(); // v2.13: the guilty face
  }, 1300);
}
function travelTo(id) {
  clearCurl();
  const P = PLACES[id]; if (!P || busy) return;
  if (topBond() < P.bond) { nope(tt('yard.nope_opens_at_bond', 'Nope. {place} opens at Bond {bond}. {name} is not emotionally ready.', { place: placeName(id), bond: P.bond, name: NAME() })); return; }
  if (S.sleeping) { nope(tt('yard.is_asleep_wake_up_first', '{name} is asleep. Wake up first (Care menu).', { name: NAME() })); return; }
  if (id === S.place && cur.mode === 'yard') return;
  if (id === S.place) { go('yard'); return; }
  if (awayFromHome(id) && staysHome(D())) { nope(stayHomeLine(D())); return; } // v2.0.1: under 3 months / nursing mum: home and yard only
  const going = S.dogs.filter((d) => d === D() || !(awayFromHome(id) && staysHome(d))), stay = S.dogs.filter((d) => !going.includes(d));
  busy = true; hideBubble(); SFX.whoosh(); trackAct('travel', { place: id });
  if (P.v215) artChunk('g'); // v2.15: world G (the new places) loads during the walk there (PERF.md 5)
  if (stay.length && !awayFromHome()) toast(tt('yard.stay_home', '{kind, select, pups {{names} {n, plural, one {stays} other {stay}} home with the pups.} other {{names} {n, plural, one {stays} other {stay}} home with a chew toy (too little for trips).}}', { kind: stay.some((d) => ageMonths(d) >= 3) ? 'pups' : 'toy', names: tlist(stay.map((d) => d.name)), n: stay.length }), '');
  const card = document.createElement('div'); card.className = 'onway';
  card.innerHTML = `<div class="onway-card"><span class="onway-dog">${going.map((d) => dogSVG(d, { pose: 'walk', outfit: outfitOf(d) })).join('')}</span><b>${esc(tt('yard.on_the_way_to', 'On the way to {place}...', { place: placeName(id) }))}</b><span class="small">${going.length > 1 ? (stay.length ? tt('yard.the_pack_trots_along_2', 'The pack trots along. -2 Energy each.') : tt('yard.the_whole_pack_trots_along', 'The whole pack trots along. -2 Energy each.')) : esc(tt('yard.trots_happily_2_energy', '{name} trots happily. -2 Energy.', { name: NAME() }))}</span></div>`;
  stage.appendChild(card);
  setTimeout(() => {
    card.remove(); busy = false;
    S.place = id; going.forEach((d) => { d.stats.energy = clamp(d.stats.energy - 2, 0, 100); }); dailyCheck(); S.daily.visited = S.daily.visited || [];
    const first = !S.daily.visited.includes(id); if (first) { S.daily.visited.push(id); addStat('happy', 5); }
    markDirty(); go(id === 'market' ? 'market' : 'yard');
    let msg = tt('yard.arrived_at', '{first, select, yes {{name} arrived at {place}. First visit today: +5 Happiness.} other {{name} arrived at {place}.}}', { first: first ? 'yes' : 'no', name: NAME(), place: placeName(id) });
    if (id === 'river' && weatherNow() === 'rain' && !hasRaincoat() && Math.random() < 0.6) { addStat('clean', -3); msg += ' ' + tt('yard.splashed_through_a_puddle_on', 'Splashed through a puddle on the way (-3 Cleanliness).'); }
    toast(msg, 'good');
  }, 1200);
}
function dogHeadWorld() { return rmHead(D()); } // v2.10 ROAM: wherever the leader stands
function dogJoke(text) {
  const n = NAME(); let line = text;
  if (!line) {
    const low = [];
    if (S.stats.hunger < 30) low.push(tt('yard.would_like_to_inform_you_that', '{sex, select, female {{name} would like to inform you that she is hungry. Loudly.} other {{name} would like to inform you that he is hungry. Loudly.}}', { sex: homeSx(S.dog), name: n }));
    if (S.stats.energy < 30) low.push(tt('yard.is_running_on_3_battery', '{name} is running on 3% battery.', { name: n }));
    if (S.stats.clean < 30) low.push(tt('yard.smells_like_an_adventure_a', '{name} smells like an adventure. A bad one.', { name: n }));
    if (S.stats.happy < 30) low.push(tt('yard.is_doing_the_big_sad_eyes', '{name} is doing the big sad eyes. At you.', { name: n }));
    line = low.length && Math.random() < 0.6 ? PICK(low) : JOKES[S.dog.key] ? homePick('jokes.' + S.dog.key, JOKES[S.dog.key]) : homePick('jokes.mutt', JOKES.mutt);
  }
  if (!text && isNight() && Math.random() < 0.4) line = PICK([tt('yard.big_yawn', '*big yawn*'), wxLine('night'), tt('yard.is_it_bedtime_it_feels', 'Is it bedtime? It feels like bedtime.')]);
  if (!text && weatherNow() === 'rain' && !hasRaincoat() && Math.random() < 0.3) line = tt('yard.a_nap_in_the_house_sounds', '{line} A nap in the house sounds good.', { line: wxLine('rain') });
  if (S.sleeping) line = PICK([tt('yard.zzz_squirrel_zzz', 'zzz... squirrel... zzz'), tt('yard.zzz_dreaming_of_a_bigger', 'zzz (dreaming of a bigger box)'), tt('yard.mrrf_zzz', 'mrrf. zzz.')]);
  const h = dogHeadWorld(); say(line, h.x, h.y);
  if (!S.sleeping && Math.random() < 0.5) S.dog.key === 'husky' && Math.random() < 0.4 ? SFX.howl() : SFX.bark(BARK[S.dog.key]);
}
function petTick(wx, wy) {
  if (busy) return;
  if (S.sleeping) { barkDog(D(), 'huff', { player: true, volume: 0.6 }); if (performance.now() - (pet.shh || 0) > 2500) { pet.shh = performance.now(); toast(tt('yard.shh_is_asleep_wake_up', 'Shh. {name} is asleep. Wake up from the Care menu.', { name: NAME() })); } return; }
  const now = performance.now();
  if (now - pet.start > 120000) { pet = { start: now, gain: 0, bonded: false, capped: false, dist: 0 }; crPetReset(); }
  let g = 1.5 * (favAct('petting') ? 1.5 : 1);
  if (pet.gain >= 20) { g *= 0.25; if (!pet.capped) { pet.capped = true; toast(tt('yard.is_100_petted_more_petting', '{name} is 100% petted. More petting is now a luxury.', { name: NAME() })); } }
  pet.gain += g; addStat('happy', g);
  if (S.place === 'woods' && !pet.woods) { pet.woods = true; addStat('happy', 2); }
  if (S.place === 'hilltop' && !pet.hill) { pet.hill = true; addStat('happy', 3); toast(tt('yard.hilltop_breeze_petting_3_happiness', 'Hilltop breeze petting: +3 Happiness. The view helps.'), 'good'); }
  if (outdoorsNow() && weatherNow() === 'rain' && !hasRaincoat() && !pet.wet) { pet.wet = true; toast(tt('yard.wet_dog_smell_intensifies', 'Wet dog smell intensifies.')); }
  exTrig(D(), 'pet', { pose: 'pet', draw: false }); setTemp('pet', 900); fxText('♥', wx + RAND(-20, 20), wy - 10);
  Math.random() < 0.7 ? SFX.squeak() : SFX.boop(RAND(500, 800));
  const bondNow = !pet.bonded && pet.gain >= 10; // v2.10 ROAM: petting pets this dog only (the v2.8.4 whole-pack rub is gone)
  rmPetted(D());
  if (bondNow) { pet.bonded = true; const n = addBond(3) + (S.outfit.head === 'Wizard Hat' ? addBond(1, { raw: true }) : 0); const st = S.outfit.charm === 'Sparkle Stone'; if (st) addStat('happy', 5); toast([tt('yard.plus_bond', '+{n} Bond.', { n }), S.outfit.head === 'Wizard Hat' ? tt('yard.magic_hands_1_bond', 'Magic hands: +1 Bond.') : '', st ? tt('yard.the_sparkle_stone_hums_5', 'The Sparkle Stone hums: +5 Happiness.') : '', tt('yard.pretends_did_not_enjoy_that', '{sex, select, female {{name} pretends she did not enjoy that.} other {{name} pretends he did not enjoy that.}}', { sex: homeSx(S.dog), name: NAME() })].filter(Boolean).join(' '), 'good'); dailyCare('pet'); markCareDay(); trackAct('pet', {}); }
  updateHUD();
}
function showZzz(on) { const z = $('#zzz'); if (z) z.innerHTML = on ? place(art('prop', 'zzz'), 760, 280, 90, 90) : ''; }
function dockIdle() {
  dailyCheck();
  const L = S.bond.level, need = L >= 10 ? 0 : BOND_TH[L] - S.bond.pts;
  const chk = (k, label) => `<li>${S.daily[k] ? '[x]' : '[ ]'} ${esc(label)}</li>`;
  dock.innerHTML = `<div class="tray dock-idle"><div class="tray-h"><h3>${esc(tt('yard.the_breed_heading', '{name} the {breed}', { name: NAME(), breed: adBreed(dogInfo(S.dog.key)) }))}</h3></div>
    <p style="margin:0">${esc(moodLine())}</p>
    <p style="margin:0">${tt('yard.today_s_care_bonus_each_html', "<b>Today's care bonus</b> (+{n, plural, one {# coin} other {# coins}} each):", { n: 10 * BOOST.coins })}</p>
    <ul style="margin:0;padding-left:4px;list-style:none;line-height:1.4">${chk('feed', tt('yard.first_meal', 'First meal'))}${chk('pet', tt('yard.first_good_petting_session', 'First good petting session'))}${chk('play', tt('yard.first_play_or_walk', 'First play or walk'))}</ul>
    <p style="margin:0">${L >= 10 ? tt('yard.bond_10_best_friends_maximum', 'Bond 10: best friends. Maximum love achieved.') : tt('yard.next_bond_level_in_points_html', 'Next Bond level in {n, plural, one {<b>#</b> point} other {<b>#</b> points}}.', { n: need })}</p>
    <p class="small" style="margin:0">${esc(tt('yard.tip', 'Tip: {tip}', { tip: PICK([tt('yard.tip_rub_to_pet', '{sex, select, female {rub {name} to pet her.} other {rub {name} to pet him.}}', { sex: homeSx(S.dog), name: NAME() }), tt('yard.tap_feed_then_tap_a', 'tap Feed, then tap a food.'), tt('yard.walks_earn_the_most_coins', 'walks earn the most coins.'), tt('yard.better_houses_mean_faster_naps', 'better houses mean faster naps.'), tt('yard.space_pets_the_dog_gently', 'Space pets the dog. Gently.'), tt('yard.the_map_has_walk_routes', 'the Map has walk routes. Some are locked.')]) }))}</p></div>`;
}
function moodLine() {
  const n = NAME(), s = S.stats;
  if (S.sleeping) { const zz = crOn() ? others().filter((d) => d.sleeping) : []; return zz.length ? tt('yard.are_asleep_in_the_snoring', '{names} are asleep in the {house}. Snoring in harmony.', { names: crNames([D()].concat(zz)), house: homeName(S.house) }) : tt('yard.is_asleep_in_the_snoring_at', '{name} is asleep in the {house}. Snoring at a medium volume.', { name: n, house: homeName(S.house) }); }
  if (s.clean < 25) return tt('yard.is_filthy_like_artistically_filthy', '{name} is filthy. Like, artistically filthy. Bath time.', { name: n });
  if (s.hunger < 25) return tt('yard.is_staring_at_the_bowl_and', '{name} is staring at the bowl. And then at you. And then at the bowl.', { name: n });
  if (s.energy < 25) return tt('yard.is_very_sleepy_a_nap_in', '{name} is very sleepy. A nap in the dog house would help.', { name: n });
  if (s.happy < 25) return tt('yard.is_a_bit_glum_pets_play', '{name} is a bit glum. Pets, play or a walk would fix it.', { name: n });
  if (glowing()) return tt('yard.is_glowing_all_meters_above_80', '{name} is GLOWING. All meters above 80: +20% Bond points.', { name: n });
  return tt('yard.is_doing_fine_suspiciously_fine', '{name} is doing fine. Suspiciously fine.', { name: n });
}
function closeTray() { SFX.click(); if (cur.mode === 'yard') { S.sleeping ? sleepTray() : dockIdle(); } else dock.innerHTML = ''; }
function trayHTML(title, body) { return `<div class="tray"><div class="tray-h"><h3>${title}</h3><button class="xbtn" id="trayX" aria-label="${esc(tt('yard.label_close', 'Close'))}">x</button></div><div class="tray-body">${body}</div></div>`; }
function setTray(title, body, opt = {}) { if (typeof blOn === 'function' && blOn()) return; // ball play keeps its own dock (38_ball.js): a scene tap (dog house, bowl, decoration) must not swap it
  if (!opt.mini && !modal.hidden) closeModal(); dock.innerHTML = trayHTML(title, body).replace('class="tray"', `class="tray${opt.mini ? ' mini' : ''}"`); $('#trayX').onclick = closeTray; if (!opt.mini) sheetSwipe($('#dock > .tray'), closeTray); }

/* ---------------- FEED ---------------- */
function openFeedTray() {
  if (cur.mode !== 'yard') go('yard');
  if (crQuiet) { /* v2.7: a chip tap redraws the tray without a bark */ } else if (D().key === 'corgi') barkDog(D(), 'yip', { player: true }); else if (Math.random() < 0.5) barkDog(D(), 'yip', {});
  const home = atHome(), items = FOOD_ALL.filter((f) => f.n === 'Fresh Water' || (S.inv.food[f.n] || 0) > 0);
  const cards = items.map((f) => {
    const cnt = f.n === 'Fresh Water' ? '' : `<span class="cnt">${S.inv.food[f.n]}</span>`;
    const wait = f.n === 'Fresh Water' && S.gameMin - S.waterAt < shWaterWait(), off = !home && isMeal(f.n);
    return `<button class="card ${off ? 'off meal' : ''}" data-food="${esc(f.n)}" ${wait || off ? 'aria-disabled="true"' : ''} aria-label="${esc(off ? tt('yard.label_feed_meals_home', 'Feed {food} (meals are served at home)', { food: homeName(f.n) }) : tt('yard.label_feed', 'Feed {food}', { food: homeName(f.n) }))}">${cnt}<span class="art">${art('item', f.n)}</span><b>${esc(homeName(f.n))}${hwTag(f.n)}</b><span class="small">${off ? tt('yard.at_home', 'at home') : wait ? tt('yard.refilling', 'refilling...') : isFavFood(f.n) ? tt('yard.favourite', 'favourite!') : SNACKS.includes(f.n) ? tt('yard.snack', 'snack') : ''}</span></button>`;
  }).join('');
  const dishes = kOn() ? dishRowHTML(!home) : '';
  setTray(home ? tt('yard.feed_tap_a_food', 'Feed: tap a food') : esc(tt('yard.feed_snacks_and_water_at', 'Feed: snacks and water at {place}', { place: PLACES[S.place] ? placeName(S.place) : tt('yard.this_place', 'this place') })), `${crChipsHTML()}<div class="row">${cards}${dishes}</div>${items.length <= 1 && !dishes ? '<p class="small" style="margin:0">' + tt('yard.pantry_is_empty_kibble_corner', 'Pantry is empty. Kibble Corner on Market Street sells food.') + '</p>' : ''}${home && S.dogs.length > 1 ? `<div class="awaynote"><p class="small">${feedAllFood() ? tt('yard.one_portion_of_for_every_dog_html', '{ticked, select, yes {One portion of <b>{food}</b> for every ticked dog (you have {n}).} other {One portion of <b>{food}</b> for every dog (you have {n}).}}', { ticked: crOn() ? 'yes' : 'no', food: homeName(feedAllFood().n), n: S.inv.food[feedAllFood().n] }) : tt('yard.no_meals_left_for_feed', 'No meals left for Feed all.')}</p><button class="btn go" id="feedAll" ${feedAllFood() ? '' : 'aria-disabled="true"'}>${esc(tt('yard.feed_all_count', 'Feed all ({dogs})', { dogs: crOn() ? crDogsN(crDogs().length) : tt('yard.n_dogs', '{n, plural, one {# dog} other {# dogs}}', { n: S.dogs.length }) }))}</button></div>` : ''}${home ? '' : `<div class="awaynote"><p class="small">${esc(tt('yard.meals_are_served_at_home_out_here', 'Meals are served at home. Out here {name} has snacks and water.', { name: NAME() }))}</p><button class="btn go" id="feedHome">${tt('yard.go_home', 'Go home')}</button></div>`}`);
  fbBowlSync(); crBindChips(dock, openFeedTray); dock.querySelectorAll('[data-food]').forEach((c) => { c.onclick = () => { SFX.init(); feed(c.dataset.food); }; });
  const fh = $('#feedHome'); if (fh) fh.onclick = () => { closeTray(); travelTo('yard'); };
  const fa = $('#feedAll'); if (fa) fa.onclick = () => feedAll();
  dock.querySelectorAll('[data-dish]').forEach((b) => { b.onclick = () => { const [id, st] = b.dataset.dish.split('|'); eatDish(id, +st); }; });
}
function dragFeed(card) {
  let start = null, ghost = null;
  card.addEventListener('pointerdown', (e) => { SFX.init(); start = { x: e.clientX, y: e.clientY }; try { card.setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } });
  card.addEventListener('pointermove', (e) => {
    if (!start) return;
    if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) { ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.innerHTML = art('item', card.dataset.food); document.body.appendChild(ghost); }
    if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
  });
  const end = (e, cancel) => {
    if (!start) return; start = null;
    if (ghost) { ghost.remove(); ghost = null; if (cancel) return; const b = $('#bowlG'); const r = b && b.getBoundingClientRect(); if (r && e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 30 && e.clientY < r.bottom + 30) feed(card.dataset.food); else toast(tt('yard.missed_the_bowl_the_grass', 'Missed the bowl. The grass says thanks.')); }
    else if (!cancel) feed(card.dataset.food);
  };
  card.addEventListener('pointerup', (e) => end(e, false)); card.addEventListener('pointercancel', (e) => end(e, true));
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); feed(card.dataset.food); } });
}
function feed(name) {
  clearCurl();
  const f = FOOD_ALL.find((x) => x.n === name); if (!f || busy) return;
  if (crFeed(name, f)) return; // v2.7 PACK CARE: every ticked dog present gets a portion (false: the v2.6 path below, for the active dog only)
  const n = NAME();
  if (S.sleeping) { nope(tt('yard.is_asleep_wake_from_the_care', '{name} is asleep. Wake {name} from the Care menu first.', { name: n })); return; }
  if (!atHome() && isMeal(name)) { nope(tt('yard.meals_are_served_at_home', 'Meals are served at home. Snacks and water are fine out here.')); return; }
  if (S.place === 'pier' && name !== 'Fresh Water' && Math.random() < 0.2) { popDown(); SFX.honk(); toast(tt('yard.a_seagull_took_the_rude', 'A seagull took the {name}! Rude. (Snack refunded: Pip has a deal with the gulls.)', { name: homeName(name) }), 'bad'); return; }
  if (name === 'Fresh Water') {
    if (S.gameMin - S.waterAt < shWaterWait()) { nope(tt('yard.the_water_bowl_is_refilling', `The water bowl is refilling. Water takes time. That's science.`)); return; }
    S.waterAt = S.gameMin;
  } else {
    if ((S.inv.food[name] || 0) <= 0) { nope(tt('yard.you_have_none_of_that', 'You have none of that. Kibble Corner has some.')); return; }
    if (f.hunger > 0 && S.stats.hunger > 90) { nope(['corgi', 'pug', 'beagle'].includes(S.dog.key) ? tt('yard.is_full_call_a_scientist', '{name} is... full? Call a scientist. (Food not used.)', { name: n }) : tt('yard.is_full_has_never_said_that', '{sex, select, female {{name} is full. She has never said that before. (Food not used.)} other {{name} is full. He has never said that before. (Food not used.)}}', { sex: homeSx(S.dog), name: n })); setTemp('happy', 1200); return; }
    if (name === 'Pupcake') { dailyCheck(); if (S.daily.pupcake) { nope(tt('yard.one_pupcake_per_day_doctor', 'One Pupcake per day. Doctor\'s orders. The doctor is a duck.')); return; } S.daily.pupcake = true; }
    S.inv.food[name]--; if (S.inv.food[name] <= 0) delete S.inv.food[name];
  }
  busy = true; hideBubble(); markDirty(); popDown(); clearCurl(); crFree(D()); if (D().key === 'corgi' && name !== 'Fresh Water') barkDog(D(), 'yip', {});
  // v2.5: at home and away alike the food goes in the bowl (it used to be eaten from the hand away from home, with no bowl)
  S.bowl = name; setBowl(name); dogTo(-125, 0, 1, 0.8); renderDog('walk', 'left'); setTimeout(() => { renderDog('eat', 'left'); name === 'Fresh Water' ? SFX.slurp() : SFX.crunch(); }, 850);
  setTimeout(() => { if (name !== 'Fresh Water') SFX.crunch(); }, 1500);
  setTimeout(() => {
    S.bowl = null; setBowl(null);
    const { got, extraMsg } = crEatFx(name, f);
    const secs = (Math.random() * 0.9 + 0.2).toFixed(1);
    const eatL = breedLine(EAT_LINES, D());
    const sx = homeSx(S.dog), msg = name === 'Fresh Water' ? tt('yard.drank_it_most_of_it_went', '{name} drank it. Most of it went on the floor.', { name: n }) : eatL && Math.random() < 0.5 ? eatL : PICK([tt('yard.ate_it_in_seconds_tail_approves', '{sex, select, female {{name} ate it in {secs} seconds. Her tail approves.} other {{name} ate it in {secs} seconds. His tail approves.}}', { sex: sx, name: n, secs }), tt('yard.inhaled_that_thinks_chewing_is_for', '{sex, select, female {{name} inhaled that. She thinks chewing is for quitters.} other {{name} inhaled that. He thinks chewing is for quitters.}}', { sex: sx, name: n }), tt('yard.gone_is_now_looking_at_the', 'Gone. {name} is now looking at the bowl for more.', { name: n })]);
    toast([msg, isFavFood(name) ? tt('yard.favourite_food', 'Favourite food!') : '', got ? tt('yard.plus_bond_dot', '+{n} Bond.', { n: got }) : '', name === 'Pupcake' ? tt('yard.double_bond_for_game_hours', '{long, select, yes {Double Bond for 2 game hours (Happi Coat)!} other {Double Bond for 1 game hour!}}', { long: shPupMins() > 60 ? 'yes' : 'no' }) : '', f.golden ? tt('yard.glowing_for_a_whole_game', 'GLOWING for a whole game day!') : '', S.place === 'river' && name !== 'Fresh Water' ? tt('yard.riverside_picnic_5_happiness', 'Riverside picnic: +5 Happiness.') : ''].filter(Boolean).join(' ') + extraMsg + crSoloLine(name, f), 'good');
    if (name !== 'Fresh Water') { dailyCare('feed'); markCareDay(); }
    trackAct(name === 'Fresh Water' ? 'water' : 'feed', { name }); // v2.4 missions and guide
    if (f.tip) setTimeout(() => shFoodTip(name), 900); // v2.4: the safety tip, once per food
    setTemp('happy', 1600); dogTo(0, 0, 1, 0.8); updateHUD();
    setTimeout(() => { busy = false; renderDog(dogPoseNow()); }, 900);
  }, 2300);
}

/* ---------------- PLAY ---------------- */
function openPlayTray() {
  if (cur.mode !== 'yard') go('yard');
  const fts = FETCH_TOYS.filter((t) => owns('toys', t)), sub = { 'Tennis Ball': tt('yard.free_throws_every_dog_races', 'Free throws, every dog races'), Frisbee: tt('yard.long_throws_3_coins', 'Long throws: 3 coins'), 'Driftwood Stick': tt('yard.tumbles_3_coins', 'Tumbles: 3 coins'), 'Glow Ball': tt('yard.glows_after_dark', 'Glows after dark') };
  const b = fts.map((t) => `<button class="card" data-play="ball:${esc(t)}"><span class="art">${art('item', t)}</span><b>${tt('yard.play_ball', 'Play ball')}</b><span class="small">${esc(tt('yard.toy_sub', '{toy}: {sub}', { toy: homeName(t), sub: sub[t] }))}</span></button>`); // v2.10: free ball play where you are (38_ball.js) replaces the timed Fetch challenge
  toysPlayable().forEach((t) => b.push(`<button class="card" data-play="toy:${esc(t)}"><span class="art">${art('item', t)}</span><b>${tt('yard.play', 'Play')}</b><span class="small">${esc(homeName(t))}${hwTag(t)}</span></button>`));
  b.push(`<button class="card" data-play="tricks"><span class="art">${ICON('star')}</span><b>${tt('yard.tricks', 'Tricks')}</b><span class="small">${esc(tt('yard.learned', '{n} learned', { n: learnedCount() }))}</span></button>`);
  if (owns('toys', 'Squeaky Duck')) b.push(`<button class="card" data-play="duck"><span class="art">${art('item', 'Squeaky Duck')}</span><b>${tt('yard.squeak', 'Squeak')}</b><span class="small">${tt('yard.10_happiness', '+10 Happiness')}</span></button>`);
  if (owns('toys', 'Rope Tug')) b.push(`<button class="card" data-play="tug"><span class="art">${art('item', 'Rope Tug')}</span><b>${tt('yard.tug', 'Tug')}</b><span class="small">${tt('yard.15_happy_10_energy', '+15 Happy, -10 Energy')}</span></button>`);
  b.push(`<button class="card pdcard" data-play="playdates"><span class="art">${iconOr('playdate', doodle('heart', -6, 2, 0.8) + doodle('heart', 7, -3, 0.65))}</span><b>${tt('yard.playdates', 'Playdates')}</b><span class="small">${tt('yard.puppy_playdates', 'Puppy Playdates')}</span></button>`);
  if (!fts.length) b.push('<p class="small">' + tt('yard.no_ball_toy_kibble_corner', 'No ball toy. Kibble Corner sells balls.') + '</p>');
  setTray(tt('yard.play', 'Play'), `${crChipsHTML(PK_CAP_PLAY)}<div class="row">${b.join('')}</div>`); // v2.9 PACK: the chip row (ticked dogs join in), nothing with one dog
  crBindChips(dock, openPlayTray, tt('yard.somebody_has_to_play_tick', 'Somebody has to play. Tick another dog first.'));
  dock.querySelectorAll('[data-play]').forEach((el) => { el.onclick = () => playPick(el.dataset.play); });
}
function playPick(p) {
  SFX.click();
  if (p === 'playdates') { if (typeof openPlaydates === 'function') openPlaydates(); else nope(tt('yard.puppy_playdates_are_almost_ready', 'Puppy Playdates are almost ready.')); return; }
  if (p === 'tricks' && crPack()) { pkTricksTray(); return; } // v2.9 PACK: the dog picker inside the tray; training a dog never changes the leader
  if (S.sleeping) { nope(tt('yard.is_asleep_even_fun_has', '{name} is asleep. Even fun has to wait.', { name: NAME() })); return; }
  if (p.startsWith('toy:')) { if (S.stats.energy < 5) { nope(tt('yard.is_too_tired_to_play', '{name} is too tired to play. A nap would help.', { name: NAME() })); return; } go('toy', p.slice(4)); return; }
  if (p.startsWith('ball:') || p.startsWith('fetch:')) { if (S.stats.energy < 10) { nope(tt('yard.is_too_tired_to_play_2', '{name} is too tired to play ball. A nap would help.', { name: NAME() })); return; } blStart(p.slice(p.indexOf(':') + 1)); return; } // v2.10: the journal's old 'fetch:' key lands here too
  if (p === 'tricks') { openTraining(); return; }
  if (busy) return;
  popDown(); clearCurl();
  const toy = p === 'duck' ? 'Squeaky Duck' : 'Rope Tug';
  const now = S.gameMin, key = 'toyAt_' + toy; const full = !S[key] || now - S[key] >= 10;
  const k = full ? 1 : 0.25; S[key] = now;
  let happy = (p === 'duck' ? 10 : 15) * k * (S.dog.favToy === toy ? 1.5 : 1) * (S.place === 'park' ? 1.2 : 1);
  busy = true;
  const crew = pkDogs('play').slice(1), skip = PKS.skip.slice(); if (crew.length) pkPlayStart(crew, p === 'tug'); // v2.9 PACK: every ticked dog joins in (Tug: the others pile on the far end)
  if (p === 'duck') { [0, 250, 500].forEach((t) => setTimeout(SFX.squeak, t)); setTemp('happy', 1300); }
  else { $('#dogFx').classList.add('tk-tug'); renderDog('happy'); SFX.whoosh(); setTimeout(() => barkDog(D(), 'growl-play', { player: true }), 600); }
  setTimeout(() => {
    $('#dogFx').classList.remove('tk-tug'); addStat('happy', happy); trackAct('toy', { name: toy });
    let msg = p === 'duck' ? tt('yard.squeak_is_delighted_your_ears', 'SQUEAK. {name} is delighted. Your ears are not.', { name: NAME() }) : tt('yard.won_the_tug_of_war', '{name} won the tug-of-war. As always.', { name: NAME() });
    if (p === 'tug') { addStat('energy', -10 * k); msg += ' ' + tt('yard.plus_bond_each', '{each, select, yes {+{n} Bond each.} other {+{n} Bond.}}', { each: crew.length ? 'yes' : 'no', n: addBond(5 * k) }); }
    if (crew.length) { pkPlayFx(crew, toy, p === 'tug', k); pkPlayEnd(crew); msg += ' ' + (p === 'tug' ? tt('yard.pile_on_at_the_far_end', '{n, plural, one {{names} piles on at the far end of the rope.} other {{names} pile on at the far end of the rope.}}', { n: crew.length, names: crNames(crew) }) : tt('yard.squeak_along', '{n, plural, one {{names} squeaks along.} other {{names} squeak along.}}', { n: crew.length, names: crNames(crew) })); }
    if (skip.length) msg += ' ' + pkSkipLines(skip).join(' ');
    if (S.dog.favToy === toy) msg += ' ' + tt('yard.favourite_toy', 'Favourite toy!'); if (!full) msg += ' ' + tt('yard.less_exciting_the_second_time', '(Less exciting the second time. Wait 10 game minutes.)');
    toast(msg, 'good'); dailyCare('play'); markCareDay(); busy = false; renderDog(dogPoseNow(), 'right', true); updateHUD();
  }, 1300);
}
const TNEED = () => (owns('toys', 'Rubber Chicken') ? 2 : 3);
const learnedCount = () => TRICKS.filter((t) => trickSt(t.n).p >= 1).length;
function openTricks() { return openTraining(); // legacy tray retired in v1.7.1; the lure mini-games replace it
  const btns = TRICKS.map((t) => {
    const lock = S.bond.level < t.bond, prog = S.tricks[t.n] || 0, name = t.n === 'Signature' ? sigOf(S.dog.key).n : t.n;
    return `<button class="btn" data-trick="${t.n}" ${lock ? 'aria-disabled="true"' : ''}>${esc(name)}<small>${lock ? 'Bond ' + t.bond : prog >= TNEED() ? 'learned' : `teach ${prog}/${TNEED()}`}</small></button>`;
  }).join('');
  setTray(`Tricks: tap ${TNEED()} times to teach, then show off${owns('toys', 'Rubber Chicken') ? ' (Rubber Chicken helps)' : ''}`, `<div class="trickgrid">${btns}</div>`, { mini: true });
  dock.querySelectorAll('[data-trick]').forEach((b) => { b.onclick = () => doTrick(b.dataset.trick); });
}
let trickLog = [];
function doTrick(n) {
  const t = TRICKS.find((x) => x.n === n); if (!t || busy) return;
  if (S.sleeping) { nope(tt('yard.is_asleep_sleep_is_the', '{name} is asleep. Sleep is the only trick right now.', { name: NAME() })); return; }
  if (S.bond.level < t.bond) { nope(tt('yard.nope_unlocks_at_bond', 'Nope. {trick} unlocks at Bond {bond}. {name} is not emotionally ready.', { trick: t.n === 'Signature' ? tt('yard.the_signature_trick', 'The signature trick') : tdata('tricks.' + tid(t.n) + '.n', t.n), bond: t.bond, name: NAME() })); return; }
  const sig = t.n === 'Signature' ? sigOf(S.dog.key) : null, fx = sig ? sig.fx : t.fx, pose = sig ? sig.pose : t.pose;
  const need = TNEED(), prog = S.tricks[n] || 0, learning = prog < need;
  if (owns('toys', 'Rubber Chicken')) setTimeout(SFX.honk, 250);
  busy = true; hideBubble();
  const el = $('#dogFx'); renderDog(pose); if (fx.startsWith('tk-')) { el.classList.remove(fx); void el.getBBox(); el.classList.add(fx); }
  if (sig && sig.snd) barkDog(D(), sig.snd, { player: true }); else if (fx === 'speak' || (sig && S.dog.key === 'husky')) S.dog.key === 'husky' ? SFX.howl() : SFX.bark(BARK[S.dog.key]); else SFX.boop(660);
  const h = dogHeadWorld();
  if (fx === 'speak') say(S.dog.key === 'husky' ? tt('yard.awooooo', 'AWOOOOO!') : PICK([tt('yard.bork', 'BORK.'), tt('yard.woof_yes_that_was_the', 'Woof. (Yes, that was the trick.)'), tt('yard.arf', 'ARF!')]), h.x, h.y, 2000);
  if (sig) say(homeSig(S.dog.key, 'say'), h.x, h.y, 2600);
  setTimeout(() => {
    el.classList.remove(fx);
    if (learning) {
      S.tricks[n] = prog + 1;
      if (prog + 1 >= need) { SFX.fanfare(); toast(tt('yard.learned_bond', '{name} learned {trick}! +{bond} Bond.', { name: NAME(), trick: sig ? homeSig(S.dog.key, 'n') : tdata('tricks.' + tid(n) + '.n', n), bond: addBond(4) }), 'gold'); }
      else toast(tt('yard.practice', 'Practice {prog}/{need}: {pick}', { prog: prog + 1, need, pick: PICK([tt('yard.close_enough', 'close enough!'), tt('yard.that_was_something', 'that was... something.'), tt('yard.getting_there', 'getting there!'), tt('yard.good_effort_wrong_trick', 'good effort, wrong trick.')]) }));
    } else {
      const now = performance.now(); trickLog = trickLog.filter((x) => now - x < 120000); trickLog.push(now);
      const k = trickLog.length > 6 ? 0.25 : 1;
      const hp = 4 * k * (favAct('tricks') ? 1.5 : 1); addStat('happy', hp);
      toast(tt('yard.pick_happiness_bond', '{pick} +{hp} Happiness, +{bond} Bond.', { pick: PICK([tt('yard.nailed_it', 'Nailed it.'), tt('yard.flawless', 'Flawless.'), tt('yard.the_crowd_you_goes_wild', 'The crowd (you) goes wild.'), tt('yard.ten_out_of_ten', 'Ten out of ten.')]), hp: Math.round(hp), bond: addBond(4 * k) }), 'good');
      dailyCare('play');
    }
    busy = false; renderDog(dogPoseNow(), 'right', true); updateHUD(); markDirty();
    if (dock.querySelector('[data-trick]')) openTricks();
  }, fx === 'tk-zoom' || fx === 'tk-tornado' ? 1900 : fx === 'tk-lap' ? 2300 : 1600);
}

/* ---------------- CARE: bath, sleep, houses ---------------- */
function openCareTray() {
  if (cur.mode !== 'yard') go('yard');
  if (S.sleeping) { sleepTray(); return; }
  const home = atHome(), bedArt = artReal('item', S.bed);
  setTray(tt('yard.care', 'Care'), `${home ? '' : `<p style="margin:0 0 6px">${esc(tt('yard.bath_and_naps_refuses_to_nap', "{place, select, beach {Bath and naps happen at home. {name} refuses to nap on a beach towel. Too sandy.} other {Bath and naps happen at home. {name} refuses to nap on a stranger's bench.}}", { place: S.place === 'beach' ? 'beach' : 'other', name: NAME() }))}</p>`}${crChipsHTML()}<div class="row">
    <button class="card ${home ? '' : 'off'}" data-care="bath" ${home ? '' : 'aria-disabled="true"'}><span class="art">${ICON('bath')}</span><b>${tt('yard.bath', 'Bath')}</b><span class="small">${esc(tt('yard.clean_n', 'Clean {n}', { n: Math.round(S.stats.clean) }))}</span></button>
    <button class="card ${home ? '' : 'off'}" data-care="sleep" ${home ? '' : 'aria-disabled="true"'}><span class="art">${ICON('sleep')}</span><b>${tt('yard.nap', 'Nap')}</b><span class="small">${esc(S.place === 'house' ? tt('yard.on_the_bed', 'on the {bed}', { bed: homeName(S.bed) }) : tt('yard.energy_n', 'Energy {n}', { n: Math.round(S.stats.energy) }))}</span></button>
    <button class="card" data-care="bed"><span class="art">${bedArt || ICON('sleep')}</span><b>${tt('yard.bed', 'Bed')}</b><span class="small">${esc(homeName(S.bed))}</span></button>
    <button class="card" data-care="house"><span class="art">${ICON('house')}</span><b>${tt('yard.houses', 'Houses')}</b><span class="small">${esc(tt('yard.n_owned', '{n} owned', { n: S.inv.houses.length }))}</span></button>${hmDecorCard()}
    ${home ? '' : `<button class="card" data-care="home"><span class="art">${ICON('house')}</span><b>${tt('yard.go_home', 'Go home')}</b><span class="small">${tt('yard.to_the_yard', 'to the yard')}</span></button>`}</div>`);
  dock.querySelectorAll('[data-care]').forEach((b) => { b.onclick = () => { SFX.click(); const c = b.dataset.care; if (!home && (c === 'bath' || c === 'sleep')) { nope(tt('yard.bath_and_naps_happen_at', 'Bath and naps happen at home. {name} insists.', { name: NAME() })); return; } if (c === 'bath') crBathGo(); if (c === 'sleep') startSleep(); if (c === 'house') openHouses(); if (c === 'decor') hmOpenDecor(); if (c === 'bed') openBeds(); if (c === 'home') { closeTray(); travelTo('yard'); } }; });
  crBindChips(dock, openCareTray);
}
function napRate(d) { const h = houseInfo(), pb = d && typeof hoBedFor === 'function' ? hoBedFor(d) : undefined; const c = S.place === 'house' ? 0.25 + (pb === null ? 0 : bedInfo(pb).bonus) : h.comfort * (S.dog.key === 'husky' && h.n === 'Snow Igloo' ? 2 : 1); return 20 * BOOST.nap * (1 + c) * (owns('toys', 'Plush Bone') ? 1.1 : 1) * (isNight() ? 1.4 : 1) * (weatherNow() === 'rain' ? 1.2 : 1) * shNapMul() * (S.house === 'Pumpkin Cottage' && S.outfit.body === 'Pumpkin Suit' ? 1.1 : 1); } // v2.5: the Pumpkin Suit in the Pumpkin Cottage. v2.7: d = a napping pack dog, its own bed's bonus in the house (none on the rug)
function startSleep() {
  if (busy) return; const crN = crNapPack(); if (crN && crN.done) return; // v2.7 PACK CARE: the ticked pack dogs are tucked in too (null with pack care off)
  if (S.stats.energy >= 99) { nope(tt('yard.is_not_tired_is_vibrating', '{sex, select, female {{name} is not tired. She is vibrating.} other {{name} is not tired. He is vibrating.}}', { sex: homeSx(S.dog), name: NAME() })); return; }
  clearCurl(); crFree(D()); busy = false; S.sleeping = true; markDirty(); trackAct('nap', crN ? { dogs: crN.n } : {}); hideBubble(); popDown(); dogTo(...napSpot(), 1); renderDog('walk');
  setTimeout(() => { if (S.sleeping) { renderDog('sleep'); showZzz(true); } }, 1000);
  sleepTray(); if (crN) crNapToast(crN); else toast(S.place === 'house' ? tt('yard.curls_up_on_the_indoor_naps', '{bonus, select, yes {{name} curls up on the {bed}. Indoor naps: +25%, bed +{pct}%.} other {{name} curls up on the {bed}. Indoor naps: +25%.}}', { bonus: bedInfo().bonus ? 'yes' : 'no', name: NAME(), bed: homeName(S.bed), pct: Math.round(bedInfo().bonus * 100) }) : weatherNow() === 'rain' ? tt('yard.curls_up_in_the_rain', '{name} curls up in the {house}. Rain on the roof: the best nap sound (+20% nap).', { name: NAME(), house: homeName(S.house) }) : isNight() ? tt('yard.climbs_into_the_night_naps', '{name} climbs into the {house}. Night naps restore more (+40%).', { name: NAME(), house: homeName(S.house) }) : tt('yard.climbs_into_the_goodnight', '{name} climbs into the {house}. Goodnight.', { name: NAME(), house: homeName(S.house) })); if (ROACH[D().key]) setTimeout(() => toast(tt('yard.flips_upside_down_legs_in', '{name} flips upside down, legs in the air. Greyhounds call that roaching.', { name: NAME() }), ''), 900); audioPlace();
}
function sleepTray() {
  const h = houseInfo(), b = bedInfo(), indoor = S.place === 'house';
  const more = (t) => tt('yard.nap_extra', ', {item}', { item: t });
  const main = indoor ? (b.bonus ? tt('yard.nap_indoors_bed', '({bed}: +25% indoors, +{pct}% bed)', { bed: homeName(b.n), pct: Math.round(b.bonus * 100) }) : tt('yard.nap_indoors', '({bed}: +25% indoors)', { bed: homeName(b.n) })) : h.comfort ? tt('yard.nap_comfort', '({house}: +{pct}% comfort)', { house: homeName(h.n), pct: Math.round(h.comfort * 100) }) : tt('yard.nap_cardboard', '(Cardboard Box: no comfort bonus, lots of character)');
  const extras = (owns('toys', 'Plush Bone') ? more(tt('yard.nap_plush_bone', '+10% Plush Bone')) : '') + shNapNote() + (S.house === 'Pumpkin Cottage' && S.outfit.body === 'Pumpkin Suit' ? more(tt('yard.nap_pumpkin_suit', '+10% Pumpkin Suit')) : '') + (isNight() ? more(tt('yard.nap_night', '+40% night')) : '') + (weatherNow() === 'rain' ? more(tt('yard.nap_rain', '+20% rain on the roof')) : '');
  const info = tt('yard.energy_refills_html', 'Energy refills at <b>{n}</b> per game hour {main}{extras}.', { n: Math.round(napRate()), main, extras }) + crNapLine();
  if (isPhone()) {
    const wasOpen = !!$('#napDet') && !$('#napDet').hidden;
    // v2.3 phone: a one-line strip (energy bar, info, Wake up) so the sleeping dog and the house stay in view; the details open on a tap
    setTray(esc(tt('yard.is_napping', '{name} is napping', { name: NAME() })), `<p class="napdet" id="napDet" hidden>${info}</p>
    <div class="walkctl napstrip"><button class="btn napinfo" id="napInfo" aria-label="${esc(tt('yard.label_nap_details', 'Nap details'))}" aria-expanded="false">${ICON('sleep')}</button><div class="napmid"><span class="naplbl">${esc(tt('yard.is_napping', '{name} is napping', { name: NAME() }))}</span><div class="prog" aria-label="${esc(tt('yard.label_energy', 'Energy'))}"><i id="napBar" style="width:${S.stats.energy}%"></i></div></div><button class="btn yes" id="wakeBtn">${tt('yard.wake_up', 'Wake up')}</button></div>`, { mini: true });
    $('#trayX').remove(); const t = $('#dock > .tray'); if (t) t.classList.add('nap');
    $('#napInfo').onclick = () => { const d = $('#napDet'), on = d.hidden; d.hidden = !on; $('#napInfo').setAttribute('aria-expanded', on ? 'true' : 'false'); phTrayFit(); }; // the scene shrinks above the details card, so nothing is covered
    if (wasOpen) { $('#napDet').hidden = false; $('#napInfo').setAttribute('aria-expanded', 'true'); }
    $('#wakeBtn').onclick = () => wake();
    return;
  }
  setTray(esc(tt('yard.is_napping', '{name} is napping', { name: NAME() })), `<p style="margin:0">${info}</p>
    <div class="walkctl" style="margin-top:6px"><div class="prog" aria-label="${esc(tt('yard.label_energy', 'Energy'))}"><i id="napBar" style="width:${S.stats.energy}%"></i></div><button class="btn yes" id="wakeBtn">${tt('yard.wake_up', 'Wake up')}</button></div>`, { mini: true });
  $('#trayX').remove();
  $('#wakeBtn').onclick = () => wake();
}
function wake(auto) {
  focusSet(100); S.sleeping = false; setTimeout(() => audioPlace(), 0); markDirty(); showZzz(false); dogTo(0, 0, 1, 0.9); setTemp('happy', 1500);
  const crW = auto ? [] : crWakePack(); // v2.7 PACK CARE: Wake up wakes every napping dog present
  toast(auto ? tt('yard.fully_charged_zoomies_imminent', 'Fully charged. Zoomies imminent.') : crW.length ? tt('yard.wake_up_stretch_and_decide', '{names} wake up, stretch, and decide they want something.', { names: crNames([D()].concat(crW)) }) : tt('yard.wakes_up_stretches_and_decides', '{sex, select, female {{name} wakes up, stretches, and decides she wants something.} other {{name} wakes up, stretches, and decides he wants something.}}', { sex: homeSx(S.dog), name: NAME() }), 'good');
  if (cur.mode === 'yard') dockIdle();
}
function openHouses() {
  const cards = HOUSES.filter((h) => owns('houses', h.n)).map((h) => `<div class="sitem"><span class="art house">${art('house', h.n)}</span><b>${esc(homeName(h.n))}</b><span class="desc">${esc(tt('yard.nap_energy', 'Nap Energy +{pct}%', { pct: Math.round(h.comfort * 100) }))}</span>${h.n === S.house ? '<span class="chip own">' + tt('yard.living_here', 'Living here') + '</span>' : `<button class="btn yes" data-house="${esc(h.n)}">${tt('yard.move_in', 'Move in')}</button>`}</div>`).join('');
  const p = openModal(tt('yard.your_dog_houses', 'Your dog houses'), `<p class="small">${tt('yard.switching_is_free_buy_more', 'Switching is free. Buy more at Barkitecture on Market Street.')}</p><div class="shopgrid">${cards}</div>`);
  p.querySelectorAll('[data-house]').forEach((b) => { b.onclick = () => { switchHouse(b.dataset.house); closeModal(); }; });
}
function switchHouse(n) {
  if ((HOUSE_CAP[n] || 1) < S.dogs.length) { nope(tt('yard.only_fits_you_have_dogs_and', 'The {house} only fits {cap}. You have {n, plural, one {# dog} other {# dogs}}, and nobody is getting left out.', { house: homeName(n), cap: HOUSE_CAP[n] || 1, n: S.dogs.length })); return; }
  S.house = n; markDirty(); trackAct('house', { name: n }); SFX.thud(); setTimeout(() => SFX.boop(700), 150);
  toast(tt('yard.moved_into_the', '{name} moved into the {house}. {pick}', { name: NAME(), house: homeName(n), pick: PICK([tt('yard.sniffed_every_corner', 'Sniffed every corner.'), tt('yard.approves_mostly', 'Approves. Mostly.'), tt('yard.already_shed_on_it', 'Already shed on it.')]) }), 'good');
  if (cur.mode === 'yard') { const g = $('#houseG'); if (g) { g.innerHTML = place(art('house', n), 620, 330, 240, 200); g.setAttribute('aria-label', tt('yard.label_dog_house', 'Dog house: {house}', { house: homeName(n) })); shHouseNight(); } if (S.sleeping) sleepTray(); }
}


/* scene hotspots (shops, garden, kitchen, notice...). Re-bound after the core redraws the scene for time/weather changes. */
function bindSceneHots() {
  if (S.place === 'market') hotify($('svg.world', view), '#sceneG [data-shop]', 'data-shop', (k) => openShop(k), (k) => tt('yard.enter_shop', 'Enter {shop}', { shop: SHOP_NAME[k] ? shopName(k) : k }));
  hotify($('svg.world', view), '#sceneG [data-hot]', 'data-hot', (k) => ({ garden: openGarden, kitchen: openKitchen, notice: squareNotice, 'cafe-menu': cafeMenu, 'vet-desk': vetCheck, 'salon-chair': salonGroom }[k] || (() => {}))(), (k) => tt('yard.open_the', 'Open the {thing}', { thing: { garden: tt('yard.hot_garden', 'garden'), kitchen: tt('yard.hot_kitchen', 'kitchen'), notice: tt('yard.hot_notice', 'notice board'), 'cafe-menu': tt('yard.hot_cafe_menu', 'café menu'), 'vet-desk': tt('yard.hot_vet_desk', 'vet desk'), 'salon-chair': tt('yard.hot_salon_chair', 'salon chair') }[k] || k }));
}
on('scene:redraw', () => { if (cur.mode === 'yard' && $('svg.world', view)) { bindSceneHots(); shHouseNight(); } });
// v2.4: house lamps (the Lighthouse Kennel's beam, .pa-wb-glow) only shine at night
function shHouseNight() { const g = $('#houseG'); if (g) g.classList.toggle('night', isNight()); }

/* ======================= v2.1 HOME: yard decorations (S.decor) ======================= */
// at = world x, y, w, h (1000x600 scene). Spots avoid the dog tap box, the mailbox, both doors and the nursery basket.
const HM_DECOR = {
  'Giant Crayon Box': { prop: 'crayonbox', at: [536, 296, 112, 90], vb: [200, 160], story: 'Every crayon is taller than a dog. Nobody has ever finished colouring.' },
  'Family Photo Frame': { prop: 'photoframe', at: [404, 236, 112, 98], vb: [160, 140], story: 'Everyone who ever shared this yard is on the fence. The ugly ones are the best.' },
  'Doggy Ramp': { prop: 'doggyramp', at: [536, 432, 82, 50], vb: [200, 120], story: 'Paw prints lead all the way up. Nobody has needed the ramp yet, but everyone is proud of it.' },
  'Rocking Chair': { prop: 'rockingchair', at: [910, 452, 84, 84], vb: [160, 160], story: 'A dog-sized chair with a knitted blanket. Mum likes a rock here after a long day of puppies.' },
  // v2.6 Halloween 2026 pop-up decorations (bought, not rewards). `at` are starting spots, the HALLOWEEN lane tunes them
  'Jack-o-Lantern Trio': { prop: 'hwlanterns', at: [440, 528, 112, 67], vb: [200, 120], price: 120, fest: 'halloween', ed: 2026, v26: true, story: 'Three pumpkins, three faces, all of them smiling. They glow a little after dark.' },
  'Paper Bat Bunting': { prop: 'hwbunting', at: [650, 298, 160, 43], vb: [300, 80], price: 90, fest: 'halloween', ed: 2026, v26: true, story: 'Paper bats on a string, cut a bit wonky. They flutter whenever a dog runs past.' },
  'Friendly Scarecrow': { prop: 'hwscarecrow', at: [762, 262, 92, 130], vb: [140, 200], price: 140, fest: 'halloween', ed: 2026, v26: true, story: 'A pumpkin head and a big grin. The crows sit on his arms to chat.' },
  'Ghost Garland': { prop: 'hwgarland', at: [100, 220, 200, 60], vb: [300, 90], price: 100, fest: 'halloween', ed: 2026, v26: true, story: 'Little cloth ghosts holding hands. They say boo very quietly.' },
  // v2.7 Home & Pack (V27.md section 1): everyday decorations for the yard and the house, and five pieces of dog furniture, all sold at Barkitecture.
  // room: 'yard' | 'house' (missing = 'yard'). zone: 'floor' (bottom edge on the ground band) | 'wall' (hung up, the whole box on the wall band). flat: drawn under everything else on the floor.
  // lit: the prop takes { lit: isNight() }. `at` is the starting spot (the HOME lane tunes it in screenshots), S.decor[name].at overrides x, y once the player moves it.
  'Bird Bath': { prop: 'birdbath', at: [24, 300, 66, 88], vb: [120, 160], price: 90, room: 'yard', zone: 'floor', kind: 'decor', v27: true, story: 'A stone bowl on a pedestal for the garden birds. The sparrows splash in it every morning and the dogs watch, very politely.' },
  'Flower Barrel': { prop: 'flowerbarrel', at: [96, 318, 84, 72], vb: [140, 120], price: 80, room: 'yard', zone: 'floor', kind: 'decor', v27: true, story: 'An old wooden barrel full of sunflowers and snapdragons. Both are safe for dogs, who sniff every single one.' },
  'String Lights': { prop: 'stringlights', at: [384, 182, 210, 56], vb: [300, 80], price: 100, room: 'yard', zone: 'wall', kind: 'decor', lit: true, v27: true, story: 'Little round bulbs on a long wire. They come on by themselves when it gets dark, which looks like magic but is a timer.' },
  'Garden Bench': { prop: 'bench', at: [720, 518, 130, 78], vb: [200, 120], price: 120, room: 'yard', zone: 'floor', kind: 'decor', v27: true, story: 'A painted wooden bench with room for one person and three dogs. The dogs always get the good end.' },
  'Hammock': { prop: 'hammock', at: [844, 330, 156, 84], vb: [260, 140], price: 140, room: 'yard', zone: 'floor', kind: 'decor', v27: true, story: 'A striped hammock between two posts. It swings in the breeze and nobody has ever got out of it gracefully.' },
  'Wind Chime': { prop: 'windchime', at: [580, 190, 40, 80], vb: [80, 160], price: 70, room: 'yard', zone: 'wall', kind: 'decor', v27: true, story: 'Bamboo tubes and a little wooden bird that clink in the breeze. The dogs tilt their heads at every note.' },
  'Sandbox': { prop: 'sandbox', at: [300, 524, 120, 72], vb: [200, 120], price: 110, room: 'yard', zone: 'floor', kind: 'decor', v27: true, story: 'A wooden box of soft sand with a little spade. The one place in the yard where digging gets a round of applause.' },
  'Stepping Stones': { prop: 'steppingstones', at: [560, 540, 168, 56], vb: [240, 80], price: 60, room: 'yard', zone: 'floor', flat: true, kind: 'decor', v27: true, story: 'Five flat stones in a wobbly line across the grass. Every dog hops them in a different order.' },
  'Braided Rag Rug': { prop: 'ragrug', at: [628, 524, 216, 72], vb: [240, 80], price: 80, room: 'house', zone: 'floor', flat: true, kind: 'decor', v27: true, story: 'A round rug braided from old shirts and one sock. It is the warmest spot on the floor at four o\'clock.' },
  'Toy Basket': { prop: 'toybasket', at: [300, 524, 84, 70], vb: [120, 100], price: 70, room: 'house', zone: 'floor', kind: 'decor', v27: true, story: 'A wicker basket of squeaky friends. Every toy comes out and not one of them ever goes back in.' },
  'Cushion Pile': { prop: 'cushionpile', at: [440, 524, 126, 70], vb: [180, 100], price: 90, room: 'house', zone: 'floor', kind: 'decor', v27: true, story: 'Six squashy cushions in a heap. Officially for people, unofficially for dogs.' },
  'Boston Fern': { prop: 'fern', at: [532, 320, 78, 104], vb: [120, 160], price: 80, room: 'house', zone: 'floor', kind: 'decor', v27: true, story: 'A big leafy fern on a little wooden stand. Boston ferns are safe around dogs, which is why this one was picked.' },
  'Cuckoo Clock': { prop: 'cuckooclock', at: [784, 206, 60, 96], vb: [100, 160], price: 120, room: 'house', zone: 'wall', kind: 'decor', v27: true, story: 'A carved wooden clock with a little bird inside. On the hour it pops out, and every dog in the house answers it.' },
  'Paw Print Pictures': { prop: 'pawpictures', at: [212, 236, 140, 70], vb: [200, 100], price: 90, room: 'house', zone: 'wall', kind: 'decor', v27: true, story: 'Three little frames, each with one muddy paw print. The artists signed them by sitting on them.' },
  'Moon Lamp': { prop: 'moonlamp', at: [548, 436, 60, 84], vb: [100, 140], price: 100, room: 'house', zone: 'floor', kind: 'decor', lit: true, v27: true, story: 'A round paper moon on a little wooden stand. It glows after dark, so nobody trips over a sleeping dog.' },
  'Patchwork Quilt': { prop: 'wallquilt', at: [656, 206, 126, 98], vb: [180, 140], price: 110, room: 'house', zone: 'wall', kind: 'decor', v27: true, story: 'A quilt hung on the wall, one square for every dog who ever lived here. There is plenty of room for more squares.' },
  // v2.7 furniture (kind 'furniture', the Furniture corner tab). The dogs use it in idle time. spots: feet point x, y and the dog box width w, all in the prop's
  // viewBox units, with the pose and facing. front: the prop's <g class="pa-front"> is drawn over a dog on that spot. via: the path start (the ramp foot).
  // The art lane may tune the spots and publishes them as PawArt.FURN_SPOTS[prop] (same shape), which wins over these.
  'Dog Play Tower': { prop: 'playtower', at: [840, 216, 160, 208], vb: [200, 260], price: 320, bond: 3, room: 'house', zone: 'floor', kind: 'furniture', v27: true, story: 'Three carpet steps, a cubby hole and a rope to bat. The top step belongs to whoever got there first.',
    spots: { top: { x: 100, y: 92, w: 200, pose: 'sit', face: 'right' }, cubby: { x: 100, y: 250, w: 200, pose: 'sleep', face: 'right', front: true } } },
  'Tunnel Sofa': { prop: 'tunnelsofa', at: [612, 296, 240, 128], vb: [300, 160], price: 360, bond: 3, room: 'house', zone: 'floor', kind: 'furniture', v27: true, story: 'A squashy little sofa with a tunnel straight through the middle. Dogs go in one end and come out the other, very pleased with themselves.',
    spots: { tunnel: { x: 150, y: 154, w: 200, pose: 'walk', face: 'right', front: true }, seat: { x: 150, y: 70, w: 200, pose: 'down', face: 'left' } } },
  'Ball Pit': { prop: 'ballpit', at: [4, 476, 192, 112], vb: [240, 140], price: 280, bond: 2, room: 'house', zone: 'floor', kind: 'furniture', v27: true, story: 'A soft round pit full of bright balls. Jumping in is allowed, and so is lying very still.',
    spots: { a: { x: 96, y: 124, w: 200, pose: 'happy', face: 'right', front: true }, b: { x: 150, y: 124, w: 200, pose: 'rollover', face: 'left', front: true } } },
  'Sofa Ramp': { prop: 'sofaramp', at: [120, 300, 208, 128], vb: [260, 160], price: 200, bond: 2, room: 'house', zone: 'floor', kind: 'furniture', v27: true, story: 'A carpeted ramp up to a cushioned top step. Short legs, long backs and old knees all get up without a jump.',
    spots: { top: { x: 204, y: 60, w: 200, pose: 'sit', face: 'left', via: { x: 40, y: 152 } } } },
  'Window Seat': { prop: 'windowseat', at: [0, 232, 176, 192], vb: [220, 240], price: 260, bond: 2, room: 'house', zone: 'floor', kind: 'furniture', lit: true, v27: true, story: 'A cushioned seat under a little round window. The best place in the house to watch the postman and the birds.',
    spots: { seat: { x: 110, y: 176, w: 200, pose: 'sit', face: 'right' } } },
  // v2.8 Winter & New Year (V28.md section 1): sold only at Baker Bea's Winter Stall while their fest flag is on (never at Barkitecture), bought once,
  // placed with the v2.7 placement mode. `at` is a starting spot, the free-spot scan picks the real one. The props take { night } (WINTER ART)
  'Paper Snowflake Garland': { prop: 'wnsnowflakes', at: [620, 196, 210, 56], vb: [300, 80], price: 90, room: 'yard', zone: 'wall', kind: 'decor', fest: 'snow', v28: true, story: 'Paper snowflakes cut by the Nguyen kids, no two the same. Some of them are dogs, if you squint.' },
  'Felt Holly Wreath': { prop: 'wnwreath', at: [880, 200, 72, 72], vb: [120, 120], price: 80, room: 'yard', zone: 'wall', kind: 'decor', fest: 'snow', v28: true, story: 'A round wreath of felt leaves and red felt berries. Real holly berries make dogs ill, so these ones are felt.' },
  'Red Wooden Sled': { prop: 'wnsled', at: [24, 506, 130, 78], vb: [200, 120], price: 110, room: 'yard', zone: 'floor', kind: 'decor', fest: 'snow', v28: true, story: 'A red sled for leaning on the fence. Nobody has ever pulled it, because a dog is always sitting in it.' },
  'Kadomatsu Pair': { prop: 'nykadomatsu', at: [866, 404, 80, 100], vb: [160, 200], price: 120, room: 'yard', zone: 'floor', kind: 'decor', fest: 'newyear', v28: true, story: 'Bamboo, pine and plum by the gate to welcome the new year\'s luck. The dogs sniff it every morning to check the luck is still there.' },
  // v2.11 Tokyo Trip (V211.md section 5.3): the Asakusa souvenir stand only (tokyo + fest 'tokyo', never at Barkitecture), placed with the v2.7 placement mode. Prop by TOKYO ART E (0 0 80 100, o.indoor)
  'Lucky Cat': { prop: 'luckycat', at: [470, 436, 64, 80], vb: [80, 100], price: 150, room: 'house', zone: 'floor', kind: 'decor', fest: 'tokyo', tokyo: true, v211: true, story: 'A white maneki-neko with one paw raised to wave good luck in. The dogs wave back, in their own way.' }
};
const HM_PHOTO = [20, 15, 120, 84]; // the documented data-photo box inside the 160x140 frame
function hmDecorFields() { if (S && (!S.decor || typeof S.decor !== 'object')) S.decor = {}; }
function hmDecorOut(name) { return !!(S && S.decor && S.decor[name] && S.decor[name].out); }
function hmPhotoHeads() {
  const ids = (S.portrait && Array.isArray(S.portrait.ids) ? S.portrait.ids : []).slice(0, 4);
  const recs = ids.map((id) => dogById(id) || (typeof famRec === 'function' ? famRec(id) : null) || (S.tree && S.tree[id])).filter(Boolean), n = recs.length; if (!n) return ''; // famRec merges rehomed/litter records with their genes
  const [bx, by, bw, bh] = HM_PHOTO, hs = Math.min(60, bw / n), x0 = bx + (bw - n * hs) / 2, y0 = by + (bh - hs) / 2;
  return recs.map((r, i) => { let h; try { h = headSVG(r); } catch (e) { h = art('dogHead', r.key || 'mutt'); } return `<g class="hm-head" data-head="${esc(r.id)}">${place(h, x0 + i * hs, y0, hs, hs)}</g>`; }).join('');
}
// v2.6.1: one shared time-of-day tint for the props laid over a scene (yard decor, the Harvest Stall, leaf piles, the pop-up): the scene
// recolours itself at dawn, dusk and night, and PawArt.tint (world B) gives a prop the same recolour. lit keeps a lit prop's candlelight.
// v2.7: indoor takes the house's (and the playroom's) softer indoor recolour, for the house items, beds and furniture
function propTint(svg, lit, indoor) { const P = window.PawArt; return P && typeof P.tint === 'function' ? P.tint(svg, indoor ? { time: timePhase(), lit: !!lit, indoor: true } : { time: timePhase(), lit: !!lit }) : svg; }
function hmDecorArt(name) {
  const D = HM_DECOR[name], glows = D.lit || D.prop === 'hwlanterns', lit = glows && isNight(), a = glows ? art('prop', D.prop, { lit }) : art('prop', D.prop); // v2.6: the lantern trio glows after dark (v2.7: and every lit decoration)
  let sv = place(propTint(a, lit, (D.room || 'yard') !== 'yard'), 0, 0, D.vb[0], D.vb[1]); // v2.6.1: yard decor takes the scene's time tint (v2.7: house things the indoor one)
  if (D.prop === 'photoframe') sv += `<g data-photo-heads>${hmPhotoHeads()}</g>`;
  return `<svg viewBox="0 0 ${D.vb[0]} ${D.vb[1]}" xmlns="http://www.w3.org/2000/svg">${sv}</svg>`;
}
// the tap rect; on phones it grows to at least 48 screen px each way (the scene is scaled to the screen height)
function hmDecorHit(x, y, w, h) {
  if (isPhone()) { const s = phHitScale(), m = 48 / s; if (w < m) { x -= (m - w) / 2; w = m; } if (h < m) { y -= (m - h) / 2; h = m; } }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent" pointer-events="all"/>`;
}
// v2.7: each yard decoration at its own spot (S.decor[n].at, else the catalogue spot): hung things first, then flat ones, then the rest by bottom edge (28_home.js)
function hmDecorSVG() {
  hmDecorFields();
  return `<g id="decorG" data-tod="${timePhase()}">${hoOrder(hoOutIn('yard')).map(hoItemSVG).join('')}</g>`;
}
// binds the yard decorations, or in the house every bed (the Care tray), decoration (its card) and piece of furniture (its card). Long-press shows the name (phones).
function hmDecorBind() {
  const g = $('#decorG') || $('#hoRoomG'); if (!g) return;
  const tap = (el, fn) => { const go = () => { if (HO.pl || blOn()) return; SFX.click(); fn(); }; el.onclick = go; el.onkeydown = (e) => { if (HO.pl || blOn()) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; };
  g.querySelectorAll('[data-decor]').forEach((el) => { tap(el, () => hmDecorPop(el.dataset.decor)); psLongPress(el, el.dataset.decor); });
  g.querySelectorAll('[data-furn]').forEach((el) => { tap(el, () => hoFurnPop(el.dataset.furn)); psLongPress(el, el.dataset.furn); });
  g.querySelectorAll('#bedG, [data-bed]').forEach((el) => { const go = () => { if (HO.pl || blOn()) return; popAct = 'care'; openCareTray(); }; el.onclick = go; el.onkeydown = (e) => { if (!HO.pl && e.key === 'Enter') go(); }; psLongPress(el, el.id === 'bedG' ? S.bed : el.dataset.bed); });
}
function hmDecorRedraw() { hoRoomRedraw(); }
function hmDecorPop(name) {
  const D = HM_DECOR[name]; if (!D) return;
  const p = openModal(esc(homeName(name)) + hwTag(name), `<div class="hm-pop"><span class="art hm-art">${art('item', name)}</span><p>${esc(tdata('hm_decor.' + tid(name) + '.story', D.story))}</p></div>`, { cls: 'hm-decor-pop', foot: '<button class="btn" id="hoMove">' + tt('yard.move', 'Move') + '</button><button class="btn yes" id="hmAway">' + tt('yard.put_away', 'Put away') + '</button>' });
  $('#hoMove', p).onclick = () => { SFX.click(); closeModal(); hoPlaceStart(name); };
  $('#hmAway', p).onclick = () => { SFX.click(); if (S.decor[name]) S.decor[name].out = false; Object.keys(HO.uses).forEach((id) => { if (HO.uses[id].name === name) hoFree(dogById(id) || { id }); }); markDirty(); closeModal(); hmDecorRedraw(); toast(tt('yard.is_tucked_away_it_will', '{name} is tucked away. It will keep.', { name: homeName(name) })); };
}
// the Care tray card: in the yard when the player owns a yard decoration, in the house always (the house has beds to arrange)
function hmDecorCard() {
  hmDecorFields(); const house = S.place === 'house', got = hoOwned(house ? 'house' : 'yard'); if (!house && !got.length) return '';
  const away = got.filter((n) => !hmDecorOut(n)).length + (house ? S.beds.filter((n) => !S.bedAt[n]).length : 0);
  const ic = house ? iconOr('furniture', '<rect x="-14" y="-6" width="28" height="16" rx="4" fill="#F7A1B5" stroke="#5B3D32" stroke-width="2.5"/>') : iconOr('decor', '<rect x="-14" y="-10" width="28" height="22" rx="3" fill="#F9D56E" stroke="#5B3D32" stroke-width="2.5"/>');
  return `<button class="card" data-care="decor"><span class="art">${ic}</span><b>${house ? tt('yard.decorate', 'Decorate') : tt('yard.decor', 'Decor')}</b><span class="small">${away ? esc(tt('yard.n_put_away', '{n} put away', { n: away })) : got.length ? tt('yard.all_out', 'all out') : tt('yard.arrange', 'arrange')}</span></button>`;
}
// the Decorate sheet: what is out (Move, Put away) and what is put away (Place), and the big Arrange button
function hmOpenDecor(room) {
  hmDecorFields(); room = room === 'house' || room === 'yard' ? room : S.place === 'house' ? 'house' : 'yard';
  const got = hoOwned(room), out = got.filter(hmDecorOut), away = got.filter((n) => !hmDecorOut(n)), where = room === 'yard' ? 'yard' : 'house';
  const card = (n, btns) => `<div class="sitem"><span class="art">${art('item', n)}</span><b>${esc(homeName(n))}${hwTag(n)}</b>${btns}</div>`;
  const body = `<p class="small">${esc(got.length ? tt('yard.move_things_around_the_or', '{where, select, yard {Move things around the yard, or tuck them away for later.} other {Move things around the house, or tuck them away for later.}}', { where }) : room === 'yard' ? tt('yard.nothing_for_the_yard_yet', 'Nothing for the yard yet. Barkitecture on Market Street sells yard decorations.') : tt('yard.nothing_for_the_house_yet', 'Nothing for the house yet. Barkitecture on Market Street sells house things and furniture. The beds can move about already.'))}</p>
    <button class="btn yes ho-arrange" id="hoArrange"><span class="art">${iconOr('arrange', '<path d="M-12 0h24M0 -12v24" stroke="#5B3D32" stroke-width="3"/>')}</span>${esc(tt('yard.arrange_the', '{where, select, yard {Arrange the yard} other {Arrange the house}}', { where }))}</button>
    ${out.length ? `<h4 class="ho-h">${tt('yard.out', 'Out')}</h4><div class="shopgrid">${out.map((n) => card(n, `<div class="ho-btns"><button class="btn" data-homove="${esc(n)}">${tt('yard.move', 'Move')}</button><button class="btn" data-hoaway="${esc(n)}">${tt('yard.put_away', 'Put away')}</button></div>`)).join('')}</div>` : ''}
    ${away.length ? `<h4 class="ho-h">${tt('yard.put_away', 'Put away')}</h4><p class="small">${tt('yard.these_are_tucked_away_put', 'These are tucked away. Put them back out any time.')}</p><div class="shopgrid">${away.map((n) => card(n, `<button class="btn yes" data-back="${esc(n)}">${tt('yard.place', 'Place')}</button>`)).join('')}</div>` : ''}`;
  const p = openModal(room === 'yard' ? tt('yard.yard_decor', 'Yard decor') : tt('yard.house_things', 'House things'), body, { cls: 'shop ho-decor' });
  const atRoom = () => cur.mode === 'yard' && S.place === room;
  $('#hoArrange', p).onclick = () => { SFX.click(); closeModal(); hoPlaceStart(undefined, room); };
  p.querySelectorAll('[data-homove]').forEach((b) => { b.onclick = () => { SFX.click(); closeModal(); hoPlaceStart(b.dataset.homove); }; });
  p.querySelectorAll('[data-hoaway]').forEach((b) => { b.onclick = () => { SFX.click(); if (hoAway(b.dataset.hoaway)) { if (atRoom()) hoRoomRedraw(); hmOpenDecor(room); } }; });
  p.querySelectorAll('[data-back]').forEach((b) => {
    b.onclick = () => {
      SFX.click(); const n = b.dataset.back; toast(tt('yard.is_back_in_the', '{where, select, yard {{item} is back in the yard.} other {{item} is back in the house.}}', { where, item: homeName(n) }), 'good');
      if (atRoom()) { closeModal(); hoPlaceStart(n); return; }
      S.decor[n].at = hoFreeSpot(n); S.decor[n].out = true; markDirty(); hmOpenDecor(room); // away from home: it waits at a free spot
    };
  });
}
function hmExpose() { if (window.__paw) window.__paw.home = { decorOut: hmDecorOut, redraw: hmDecorRedraw, ambient: () => packAmbient(), say: (t, x, y) => say(t, x, y, 4000), emit: (e, d) => emit(e, d), specs: HM_DECOR }; }
on('game:ready', () => { hmDecorFields(); setTimeout(hmExpose, 0); });
on('yard:enter', () => { hmDecorFields(); hmDecorBind(); hmExpose(); });
on('scene:redraw', () => { const g = $('#decorG') || $('#hoRoomG'); if (g && !HO.pl && g.dataset.tod !== timePhase()) hmDecorRedraw(); }); // v2.6.1: the decor follows the scene's time tint (v2.7: the house too, not while arranging)
on('decor:new', (o) => { hmDecorFields(); const n = o && o.name, room = n && HM_DECOR[n] ? hoRoomOf(n) : 'yard'; if (cur.mode === 'yard' && S.place === room && !HO.pl) hmDecorRedraw(); toast(tt('yard.new_for_the', '{room, select, house {New for the house: {item}!} other {New for the yard: {item}!}}', { room, item: homeName(n) }), 'gold'); });
