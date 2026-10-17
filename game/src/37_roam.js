/* ======================= v2.10 FREE TO ROAM: the roam engine (lane ROAM, V210.md sections 1 and 5) =======================
   Every dog in the scene is its own character: one <g class="rmdog" data-dog="id"> per dog in #pack, the leader too, all drawn at the same
   size (rmScale, depth only) and placed by their feet in world units (viewBox 0 0 1000 600). Inside each group a .rm-at group carries
   translate(x y) scale(k) translate(-430 -500), so the art keeps its v2.9 box (DX, DY, DW, DH: feet at 430, 500) and the dog art never changes.
   The leader's group holds #dogPos / #dogArt / #dogHit / #dogFx (renderDog, the bath, tricks, the old suites), and dogTo() moves it here.
   Pack dogs wander, sit, sniff, nap and ask for pets by their breed personality (persOf, 36_personality.js); the leader does the same through
   the idle system (16_voices_idle.js idles 'roam' and 'ask'). Positions are not saved. Under the test harness the dogs only walk on their own
   when a suite sets prefs.rmTest (the older suites measure still scenes). Test hook: window.__paw.rm. */
const RM = { paused: new Set(), d: {}, place: '', no: null, noAt: 0, raf: 0, lead: null, tickAt: 0, order: '', t0: 0, petT: {}, askAt: 0, cam: 0 };
const RM_BASE = 0.88; // rmScale at feet y 500: the one size for every dog (the leader's v2.9 size was 1; four dogs fit the yard at 0.88)
const RM_DEPTH = 0.0012; // a dog further back is a little smaller: y 400 = 0.88 of the base, y 590 = 1.1
// feet y band per place [back line, front line] (V210.md section 5.2, tuned on screenshots); x is always 60 to 940
const RM_ZONES = { yard: [404, 590], house: [414, 590], square: [414, 590], cafe: [414, 590], vet: [414, 590], salon: [410, 590], hilltop: [410, 590], park: [410, 590], woods: [410, 590], market: [452, 585], dogpark: [410, 590], pier: [410, 588], river: [452, 588], beach: [452, 588], fujihill: [424, 588], default: [424, 588] };
const RM_ZONES_PH = { yard: [424, 594] };
const RM_TAP = [-88, -170, 176, 180]; // every dog's tap rect around its feet at scale 1 (DX + 44, DY + 35, DW - 88, 180): the drawn body, so four dogs fit
const RM_WALK = 150, RM_RUN = 360; // world units a second
const RM_CROP = 700, RM_WIDEN = 1.3; // the phone crop in world units (section 5.2): at most 700, and at most 1.3 x the v2.9 crop, so the props' 48 px tap rects keep clear of the dog
const RM_OUT = ['yard', 'park', 'beach', 'hilltop', 'dogpark', 'woods', 'pier', 'river', 'fujihill', 'square'];
const rmWander = () => !navigator.webdriver || !!prefs.rmTest; // autonomous walking (the harness pins it off unless a suite asks)
function rmOn() { return !!S && cur.mode === 'yard' && RM.paused.size === 0; } // roaming runs now (the scene is up and nothing holds it)
// the autonomous part may act now: walks, asks, ambient lines (never during ball play, photo mode, a modal, training or the pinned test pose)
function rmFree() { return rmOn() && rmWander() && !!$('#pack') && modal.hidden && !(typeof blOn === 'function' && blOn()) && !(typeof phActive === 'function' && phActive()) && !idlePin && !TRN && !curling && !(typeof FS === 'object' && FS && FS.walking); }
function rmDogs() { if (!S || !S.dogs) return []; return [D()].concat(others().slice(0, 3).filter((d) => !hmMumIn(d))); } // every dog drawn in this scene, the leader first
function rmZoneOf(place) { const z = (isPhone() && RM_ZONES_PH[place]) || RM_ZONES[place] || RM_ZONES.default; return { y0: z[0], y1: z[1], x0: 60, x1: 940 }; }
function rmZone(place) { const p = place || (S && S.place) || 'yard', z = rmZoneOf(p); z.no = (S && p === S.place && RM.no ? RM.no : rmStaticNo(p)).map((b) => b.slice(0, 4)); return z; } // section 5.2
function rmScale(y) { return RM_BASE * clamp(1 + ((y == null ? 500 : y) - 500) * RM_DEPTH, 0.86, 1.12); } // the depth scale at feet y, the same for every dog
function rmSt(d) { let r = RM.d[d.id]; if (!r) r = RM.d[d.id] = { x: 430, y: 500, face: 'right', k: null, tw: null, hx: 430, hy: 500, seeded: false, fix: false, q: null, qAt: 0, hold: 0, ask: 0, drawn: '' }; return r; }
const rmK = (r) => (r.k != null ? r.k : rmScale(r.y));
function rmLeadPose() { return (dogKey || 'idle|right').split('|'); }
function rmPos(d) { if (!d) return null; const r = rmSt(d), lead = d === D(); return { x: r.x, y: r.y, face: lead ? rmLeadPose()[1] || r.face : r.face, sc: rmK(r), pose: lead ? rmLeadPose()[0] || 'idle' : rmPackPose(d) }; } // feet in world units
function rmEl(d) { return d ? document.querySelector(`#view [data-dog="${d.id}"]`) : null; } // the dog's <g data-dog> in the scene
function rmXf(r) { return `translate(${f1(r.x)} ${f1(r.y)}) scale(${rmK(r).toFixed(3)}) translate(-430 -500)`; }
const rmTapBox = (x, y, k) => [x + RM_TAP[0] * k, y + RM_TAP[1] * k, RM_TAP[2] * k, RM_TAP[3] * k];
const rmOver = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));

/* ---------------- no-go boxes (section 5.2) ---------------- */
// before the scene exists: the bowl and the dog house. Once it is up, rmScan reads every tappable thing from the live DOM.
// scenery a dog must not stand in (feet only; its tap rect may cover it): the Town Square fountain basin
const RM_SCENERY = { square: [[20, 400, 222, 92, 'scene']] };
function rmStaticNo(place) { const l = [[205, 462, 90, 90, 'bowl']].concat(RM_SCENERY[place] || []); if (place === 'yard') l.push([620, 330, 240, 200, 'house']); return l; }
function rmWorldBox(svg, M, el) {
  const r = el.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M);
  return [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)];
}
function rmScan() {
  RM.noAt = performance.now() + 3000; const svg = $('#view > svg.world'); if (!svg || !svg.getScreenCTM()) { RM.no = null; return; }
  const M = svg.getScreenCTM().inverse(), out = [];
  const Q = '.hot, [data-hot], [data-shop], [data-decor], [data-drift], [data-pile], [role="button"], .fs-hit, #mailboxG';
  svg.querySelectorAll(Q).forEach((el) => {
    if (el.closest('#pack, #fx, #ballLayer, #zzz, #fbPackBowls') || el.parentElement.closest(Q)) return; // dogs are not no-go, and a nested hot thing is covered by its parent
    const b = rmWorldBox(svg, M, el); if (b && b[2] > 4 && b[3] > 4 && b[1] < 600 && b[1] + b[3] > 0) out.push(b.concat(el.closest('[data-decor], [data-drift], [data-pile], #wnDogG, #hwPopG') ? 'prop' : el.id || el.dataset.hot || el.dataset.shop || 'hot'));
  });
  [...(($('#placeBtns') || {}).children || [])].concat([$('#phPeek'), $('#rmLookL'), $('#rmLookR')]).forEach((el) => { if (!el || el.hidden) return; const b = rmWorldBox(svg, M, el); if (b && b[1] < 600) out.push(b.concat('btn')); });
  if (S.place === 'yard' && !out.some((b) => b[4] === 'houseG')) out.push([620, 330, 240, 200, 'house']);
  (RM_SCENERY[S.place] || []).forEach((b) => out.push(b.slice()));
  RM.no = out;
}
// the feet (hard: never) and the tap rect (soft) against the no-go boxes. Soft: the tap rect covers no small tappable thing, no more than 40% of a bigger
// one and never its middle (only huge scenery like a shop front keeps just the feet out), and a dog standing behind a prop on the floor (its feet
// above the prop's base) keeps its body off it (at most a fifth of its width), or it would be drawn in front of the prop it stands behind
const RM_HUGE = 70000;
function rmBoxes() { return RM.no || rmStaticNo(S.place); }
function rmHard(x, y) { return rmBoxes().some((b) => x > b[0] - 8 && x < b[0] + b[2] + 8 && y > b[1] - 8 && y < b[1] + b[3] + 8); }
function rmSoft(x, y, k) {
  const T = rmTapBox(x, y, k), y0 = rmZoneOf(S.place).y0;
  for (const b of rmBoxes()) {
    const A = b[2] * b[3], base = b[1] + b[3];
    if (b[4] !== 'btn' && A < RM_HUGE && base > y0 && y < base && T[1] < base && Math.min(T[0] + T[2], b[0] + b[2] - 6) - Math.max(T[0], b[0] + 6) > T[2] * 0.2 && T[1] + T[3] > b[1]) return true; // a fifth of its width over the prop
    if (b[4] === 'scene' || A >= RM_HUGE) continue;
    const o = rmOver(T, b[4] === 'prop' ? [b[0] - 3, b[1] - 3, b[2] + 6, b[3] + 6] : b); if (!o) continue;
    if (b[4] === 'prop' ? o > 0 : A < 15000 ? o > A * 0.08 : o > A * 0.4 || (b[0] + b[2] / 2 > T[0] && b[0] + b[2] / 2 < T[0] + T[2] && b[1] + b[3] / 2 > T[1] && b[1] + b[3] / 2 < T[1] + T[3])) return true;
  }
  return false;
}
// where a dog is headed (its feet and scale), the leader by its own spot while it runs an errand (the bowl, the bath)
function rmDest(o) { const r = rmSt(o), w = r.tw; if (o === D() && r.away) return [r.hx, r.hy, rmScale(r.hy)]; if (!w) return [r.x, r.y, rmK(r)]; const e = w.end || [w.x1, w.y1]; return [e[0], e[1], w.k1 != null ? w.k1 : r.k != null && r.fix ? r.k : rmScale(e[1])]; }
// may dog d stand with its feet at x, y (scale k)? In the zone, rmHard and rmSoft clear, and the other dogs: no two tap rects overlap by more than
// 30% (50% when nothing else is free), nobody stands in front of the leader over 15% of its tap rect (its #dogHit stays tappable), and the dogs in front
// of a dog never cover more than 45% of it together (no clumps where one dog disappears)
function rmOk(d, x, y, k, strict) {
  const z = rmZoneOf(S.place); if (y < z.y0 || y > z.y1 || x < z.x0 || x > z.x1) return false;
  const T = rmTapBox(x, y, k); if (T[0] < 4 || T[0] + T[2] > 996) return false;
  if (rmHard(x, y) || rmSoft(x, y, k)) return false;
  const lim = strict === false ? 0.5 : 0.3, ll = strict === false ? 0.3 : 0.15, A = T[2] * T[3], L = D(); let front = 0;
  for (const o of rmDogs()) {
    if (o === d || !rmSt(o).seeded) continue; const [ox, oy, ok] = rmDest(o), U = rmTapBox(ox, oy, ok), v = rmOver(T, U); if (!v) continue;
    if (v > A * lim || (o === L && y >= oy && v > U[2] * U[3] * ll) || (d === L && oy >= y && v > A * ll)) return false;
    if (oy >= y) front += v;
  }
  return front <= A * 0.45;
}
function rmCands(d, strict) { const z = rmZoneOf(S.place), out = []; for (let y = z.y0; y <= z.y1; y += 14) for (let x = z.x0; x <= z.x1; x += 20) if (rmOk(d, x, y, rmScale(y), strict)) out.push([x, y]); return out; }
// spot kinds (section 5.2): open, shade, edge, gate, bowl, dig, front, sun (bed is the nap spots, handled by the nap itself)
function rmTags(x, y) {
  const z = rmZoneOf(S.place), out = RM_OUT.includes(S.place), t = [];
  if (x >= 290 && x <= 710) t.push('open'); if (x < 236 || x > 764) t.push('edge'); if (y >= z.y1 - 34) t.push('front'); if (y <= z.y0 + 44) t.push('shade');
  if (S.place === 'yard' ? x < 190 : x < 170 || x > 830) t.push('gate'); if (Math.hypot(x - 250, y - 507) < 210) t.push('bowl');
  if (GRASSY.includes(S.place) && y < z.y1 - 20) t.push('dig'); if (out && !isNight() && x >= 260 && x <= 740) t.push('sun');
  return t;
}
// a spot for dog d: like = spot kinds it likes, near = [x, y] to stay close to, far = keep away from the front (aloof)
function rmPick(d, o = {}) {
  let c = rmCands(d); if (!c.length) c = rmCands(d, false); if (!c.length) return null;
  const r = rmSt(d), like = o.like || persOf(d).spots || [], vb = isPhone() && $('#view > svg.world') ? $('#view > svg.world').viewBox.baseVal : null;
  const w = c.map(([x, y]) => {
    const tg = rmTags(x, y), dist = Math.hypot(x - r.x, y - r.y); let v = 1;
    like.forEach((k) => { if (tg.includes(k)) v *= o.like ? 6 : 2.5; });
    if (o.near) v *= 1 / (1 + Math.hypot(x - o.near[0], y - o.near[1]) / 60);
    if (dist < 60) v *= 0.15; else if (dist > 520) v *= 0.4;
    if (vb && vb.width && (x < vb.x + 84 || x > vb.x + vb.width - 84)) v *= 0.12; // phones: mostly inside the crop on screen (the look chips find the others)
    return v;
  });
  let s = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < c.length; i++) { s -= w[i]; if (s <= 0) return c[i]; } return c[c.length - 1];
}
// the nearest free spot to x, y (a dog that stands somewhere it should not, or the front for a petted dog)
function rmNear(d, x, y, strict) { const c = rmCands(d, strict); if (!c.length) return null; let best = null, bd = 1e9; c.forEach((p) => { const v = Math.hypot(p[0] - x, (p[1] - y) * 1.6); if (v < bd) { bd = v; best = p; } }); return best; }

/* ---------------- placing (seed, legacy spots, validate) ---------------- */
// entering a place: the leader stands where it always did (x 430, feet y 500), the others spread out over the free floor (farthest first, so a fresh
// scene looks the same every time). Re-entering the same place keeps everybody where they were.
function rmSeed() {
  if (!S || !S.dogs) return; const key = S.place + (isPhone() ? '|ph' : '');
    if (RM.place !== key) { RM.place = key; RM.no = null; Object.values(RM.d).forEach((r) => { r.seeded = false; r.tw = null; r.q = null; r.fix = false; r.k = null; }); RM.t0 = performance.now(); }
  const ds = rmDogs(), placed = [];
  // phones: the feet x where a dog's whole tap rect shows in the home crop (about the v2.3 home's middle, x 358, at most 700 units wide)
  const cw = isPhone() ? Math.min(RM_CROP, rmCropW()) : 1000, cx = clamp(358, cw / 2, 1000 - cw / 2), win = isPhone() ? [cx - cw / 2 + 84, cx + cw / 2 - 84] : [0, 1000];
  ds.forEach((d) => { const r = rmSt(d); if (r.seeded) placed.push(r); });
  ds.forEach((d) => {
    const r = rmSt(d); if (r.seeded) return; r.seeded = true; r.tw = null; r.q = null;
    if (d === D() && (!rmWander() || rmOk(d, 430, 500, rmScale(500), false))) { r.x = 430; r.y = 500; r.face = 'right'; } // under the harness the leader keeps its v2.9 spot
    else {
      let c = rmCands(d); if (!c.length) c = rmCands(d, false); if (!c.length) c = [[[150, 560], [800, 560], [560, 440]][placed.length % 3]];
      const inC = c.filter((p) => p[0] >= win[0] && p[0] <= win[1]); if (inC.length) c = inC; // phones: inside the home crop while there is room
      let best = c[0], bv = -1e9;
      c.forEach(([x, y]) => { const m = placed.reduce((a, p) => Math.min(a, Math.abs(p.x - x) + Math.abs(p.y - y) * 0.6), 1e9); const v = Math.min(m, 400) - Math.abs(y - 520) * 0.7; if (v > bv) { bv = v; best = [x, y]; } });
      r.x = best[0]; r.y = best[1]; r.face = r.x > 500 ? 'left' : 'right';
    }
    r.hx = r.x; r.hy = r.y; placed.push(r);
  });
}
// the visiting dog's spot (14b visitorSpot reads it through packSpots): the v1.7 spot after the pack's, as before v2.10 (the festival stall, the
// Fortune box and the phone crop are placed around it); the roaming dogs step off it (#visitorG is a no-go box)
function rmFreeSpot() {
  if (!S) return null; const sp = PACK_SPOTS[S.place] || PACK_SPOTS.default, used = Math.min(3, Math.max(0, S.dogs.length - 1));
  return (sp[used] || (typeof VISIT_EXTRA === 'object' && VISIT_EXTRA[S.place]) || [905, 432, 'left', 0.5]).slice();
}
// the v1.7 / v2.7 fixed spots that still win: napping at the dog-house door or on its own bed, on a piece of furniture, the Proud Mum by the Rocking Chair
function rmFixed(d, i) {
  let f = null;
  const nz = d.sleeping && NAP_ZONE[S.place]; if (nz) f = [nz[0] + [-36, 36, 0][i % 3], nz[1], 'right', nz[2]];
  const hs = typeof hoPackSpot === 'function' ? hoPackSpot(d, i) : null; if (hs) f = hs.slice();
  if (hmChairDown(d)) { const cp = typeof hoPos === 'function' ? hoPos('Rocking Chair') : [910, 452]; f = [clamp(868 + cp[0] - 910, 40, 960), 530 + cp[1] - 452, 'right', 0.48]; }
  return f;
}
function rmApplyFixed(d, i) {
  const r = rmSt(d), f = rmFixed(d, i), held = RM.paused.size > 0 && r.seeded;
  if (held && f && !d.sleeping && !r.fix) return; // held (ball play): nobody walks off to the sofa or the chair
  const walk = rmWander() && cur.mode === 'yard' && !!$('#pack') && r.seeded; // a dog in the scene walks over (onto the sofa, off its bed); a fresh scene just places it
  if (f) {
    const far = Math.hypot(f[0] - r.x, f[1] - r.y) > 30; if (!r.fix) r.fx0 = [r.x, r.y]; r.q = null; r.fix = true; r.face = f[2];
    if (walk && far && !d.sleeping) { r.tw = { x0: r.x, y0: r.y, k0: rmK(r), x1: f[0], y1: f[1], k1: f[3] || 0.6, t0: performance.now(), dur: Math.min(2600, (Math.hypot(f[0] - r.x, f[1] - r.y) / RM_WALK) * 1000), o: { pose: packPose[d.id] } }; r.face = f[0] < r.x ? 'left' : 'right'; rmLoop(); return; }
    r.x = f[0]; r.y = f[1]; r.k = f[3] || 0.6; r.tw = null; return;
  }
  if (r.fix) { // back where it was before the nap or the sofa
    r.fix = false; const to = held ? [r.x, r.y] : r.fx0 || [r.x, r.y], k0 = rmK(r); // held: a dog that wakes stands up where it lay
    if (walk && !held) { r.tw = { x0: r.x, y0: r.y, k0, x1: to[0], y1: to[1], k1: null, t0: performance.now(), dur: Math.min(2600, (Math.hypot(to[0] - r.x, to[1] - r.y) / RM_WALK) * 1000), o: { anchor: true } }; r.face = to[0] < r.x ? 'left' : 'right'; rmLoop(); }
    else { r.k = null; r.x = to[0]; r.y = to[1]; }
    r.wake = true;
  }
}
// after the scene is up (and every few seconds): a dog that stands on something tappable or another dog's tap rect steps to the nearest free spot
function rmValidate(instant) {
  rmDogs().forEach((d) => {
    const r = rmSt(d); if (r.fix || r.tw || (d === D() && (!rmWander() || busy || IDLE.act || S.sleeping || curling || pottyBusy))) return;
    if (rmOk(d, r.x, r.y, rmK(r))) { r.wake = false; return; }
    const p = rmNear(d, r.x, r.y) || (rmOk(d, r.x, r.y, rmK(r), false) ? null : rmNear(d, r.x, r.y, false)); if (!p) { r.wake = false; return; }
    if (instant) { r.x = p[0]; r.y = p[1]; r.hx = r.x; r.hy = r.y; rmPaint(d); } else rmTo(d, p[0], p[1], { anchor: true });
    r.wake = false;
  });
}

/* ---------------- drawing ---------------- */
function rmPackPose(d) { const r = rmSt(d); if (r.tw && !r.tw.o.legacy) return 'walk'; return d.sleeping ? 'sleep' : packPose[d.id] || (Math.min(...Object.values(d.stats)) < 25 ? 'sad' : 'idle'); }
function rmPackInner(d, i) {
  const r = rmSt(d), pose = rmPackPose(d); r.drawn = pose + '|' + r.face;
  return `<g class="rm-at" transform="${rmXf(r)}"><g class="pd-wander" style="animation-delay:-${i * 2.3}s"><rect x="${DX + 44}" y="${DY + 35}" width="${DW - 88}" height="180" fill="transparent"/><g class="rm-art">${place(dogSVG(d, { pose, outfit: typeof shSleepOutfit === 'function' ? shSleepOutfit(d, pose) : outfitOf(d), facing: r.face }), DX, DY, DW, DH)}</g></g></g>`;
}
// the leader's shell: the scene build (full) carries the #dogPos markup, a rebuild of #pack gets an empty shell and rmAdopt moves the live #dogPos in
function rmLeadSVG(full) {
  const d = D(), r = rmSt(d);
  // #dogHit is 184 x 170 units, its bottom 5 units below the feet: 44 px wide with a tray open, and clear of the winter snowdog's tap rect on iPhone 15
  const inner = full ? `<g id="dogPos"><g id="dogFx"><g id="dogArt"></g><rect id="dogHit" x="${DX + 40}" y="${DY + 40}" width="${DW - 80}" height="${DH - 50}" fill="transparent" pointer-events="all" class="hot" tabindex="0" role="button" aria-label="Pet the dog"/></g><g id="fluffFx" pointer-events="none"></g></g>` : '';
  return `<g class="rmdog rmlead" data-dog="${d.id}"><g class="rm-at" transform="${rmXf(r)}">${inner}</g></g>`;
}
function rmAdopt() {
  const sh = $('#pack .rmlead > .rm-at'); if (!sh) return;
  const p = $('#dogPos'); if (p && sh.contains(p)) { RM.lead = p; return; }
  if (p) { sh.appendChild(p); RM.lead = p; return; } // the scene markup put it elsewhere (an old caller): move it in
  if (RM.lead) sh.appendChild(RM.lead);
}
// redraw dog d's transform (every frame while it moves) and, for a pack dog, its art when the pose or facing changed
function rmPaint(d) {
  const el = rmEl(d); if (!el) return; const r = rmSt(d), at = el.querySelector(':scope > .rm-at'); if (at) at.setAttribute('transform', rmXf(r));
  if (d === D()) return;
  const pose = rmPackPose(d), key = pose + '|' + r.face; if (key === r.drawn) return; r.drawn = key;
  const a = el.querySelector('.rm-art'); if (a) a.innerHTML = place(dogSVG(d, { pose, outfit: typeof shSleepOutfit === 'function' ? shSleepOutfit(d, pose) : outfitOf(d), facing: r.face }), DX, DY, DW, DH);
}
// back to front by feet y. Only the pack dogs' nodes move (moving the leader's node would drop a rub's pointer capture on #dogHit)
function rmDepth() {
  const pk = $('#pack'); if (!pk) return; const els = [...pk.children].filter((e) => e.classList.contains('rmdog')); if (els.length < 2) return;
  const y = (e) => { const d = dogById(e.dataset.dog); return d ? rmSt(d).y : 0; };
  const want = els.slice().sort((a, b) => y(a) - y(b)), key = want.map((e) => e.dataset.dog).join(','); if (key === els.map((e) => e.dataset.dog).join(',')) return;
  const lead = els.find((e) => e.classList.contains('rmlead')), li = want.indexOf(lead);
  want.forEach((e, i) => { if (e === lead) return; if (!lead) { pk.appendChild(e); return; } if (i < li) pk.insertBefore(e, lead); else pk.appendChild(e); });
}

/* ---------------- moving ---------------- */
const rmEase = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
function rmFrame(t) {
  RM.raf = 0; if (!S) return; let any = false;
  rmDogs().forEach((d) => {
    const r = rmSt(d), w = r.tw; if (!w) return;
    const k = w.dur > 0 ? Math.min(1, (t - w.t0) / w.dur) : 1, e = w.o.legacy ? rmEase(k) : k < 1 ? k : 1;
    r.x = w.x0 + (w.x1 - w.x0) * e; r.y = w.y0 + (w.y1 - w.y0) * e;
    const k1 = w.k1 != null ? w.k1 : rmScale(w.y1); r.k = k < 1 ? w.k0 + (k1 - w.k0) * e : w.k1;
    if (k >= 1 && w.rest && w.rest.length) { r.x = w.x1; r.y = w.y1; rmLeg(d, w.rest, w.o, w.spd); rmPaint(d); any = true; return; } // the next waypoint
    if (k >= 1) { r.tw = null; if (w.o.anchor) { r.hx = r.x; r.hy = r.y; } if (w.o.face) r.face = w.o.face; rmPaint(d); rmArrive(d, w.o); } else { rmPaint(d); any = true; }
  });
  rmDepth(); if (any) RM.raf = requestAnimationFrame(rmFrame);
}
function rmLoop() { if (!RM.raf) RM.raf = requestAnimationFrame(rmFrame); }
function rmArrive(d, o) {
  if (d === D() && !o.legacy && cur.mode === 'yard') { const p = o.pose || (busy || IDLE.act ? null : dogPoseNow()); if (p) renderDog(p, o.face || rmSt(d).face, true); }
  if (d !== D() && o.pose) { packPose[d.id] = o.pose; rmPaint(d); }
  if (typeof o.done === 'function') { try { o.done(); } catch (e) { console.error(e); } }
}
// the way from x0, y0 to x1, y1 (review A): straight when the line is clear, else over a coarse grid of the zone where the feet never enter a no-go
// box and the tap rect keeps off tappable things where it can (a soft cost), smoothed to a few waypoints. The last point is always x1, y1
function rmLineOk(x0, y0, x1, y1, soft) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12));
  for (let i = 1; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; if (Math.hypot(x - x0, y - y0) < 16) continue; if (rmHard(x, y) || (soft && rmSoft(x, y, rmScale(y)))) return false; } // the start may stand somewhere it is stepping off
  return true;
}
function rmRoute(x0, y0, x1, y1) {
  if (rmLineOk(x0, y0, x1, y1, true)) return [[x1, y1]];
  const z = rmZoneOf(S.place), xs = [], ys = []; for (let x = z.x0; x <= z.x1 + 0.1; x += 30) xs.push(x); for (let y = z.y0; y <= z.y1 + 0.1; y += 16) ys.push(y);
  const W = xs.length, N = W * ys.length, P = (i) => [xs[i % W], ys[Math.floor(i / W)]], cost = new Float32Array(N);
  for (let i = 0; i < N; i++) { const [x, y] = P(i); cost[i] = rmHard(x, y) ? 0 : rmSoft(x, y, rmScale(y)) ? 4 : 1; }
  const near = (x, y) => { let b = -1, bd = 1e9; for (let i = 0; i < N; i++) { if (!cost[i]) continue; const [px, py] = P(i), v = Math.hypot(px - x, py - y); if (v < bd) { bd = v; b = i; } } return b; };
  const s = near(x0, y0), e = near(x1, y1); if (s < 0 || e < 0 || s === e) return [[x1, y1]];
  const dist = new Float64Array(N).fill(1e12), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N); dist[s] = 0;
  for (;;) {
    let u = -1; for (let i = 0; i < N; i++) if (!done[i] && cost[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] >= 1e12 || u === e) break; done[u] = 1; const ui = u % W, uj = Math.floor(u / W), [ux, uy] = P(u);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const vi = ui + di, vj = uj + dj; if ((!di && !dj) || vi < 0 || vi >= W || vj < 0 || vj >= ys.length) continue; const v = vj * W + vi; if (!cost[v] || done[v]) continue;
      const [vx, vy] = P(v), nd = dist[u] + Math.hypot(vx - ux, vy - uy) * (cost[u] + cost[v]) / 2; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; }
    }
  }
  if (prev[e] < 0) return [[x1, y1]];
  const pts = [[x1, y1]]; for (let i = e; i >= 0; i = prev[i]) pts.unshift(P(i)); pts.unshift([x0, y0]);
  const out = []; for (let i = 0; i < pts.length - 1;) { let j = pts.length - 1; while (j > i + 1 && !rmLineOk(pts[i][0], pts[i][1], pts[j][0], pts[j][1], true)) j--; out.push(pts[j]); i = j; }
  return out;
}
// walk there (o.run runs, o.speed in world units a second, o.secs a fixed time), then o.pose, o.face, o.done(). o.k: a fixed scale (null = rmScale).
// The walk goes round the no-go boxes (rmRoute) unless it is a legacy errand (dogTo), a fixed-time move or o.direct
function rmTo(d, x, y, o = {}) {
  if (!d || !S) return; const r = rmSt(d), now = performance.now();
  if (d !== D() && r.fix) { if (typeof o.done === 'function') o.done(); return; }
  const spd = o.speed || (o.run ? RM_RUN : RM_WALK) * (o.legacy ? 1 : 1 / Math.max(0.05, IDLE.speed));
  const path = o.legacy || o.secs != null || o.direct || cur.mode !== 'yard' ? [[x, y]] : rmRoute(r.x, r.y, x, y);
  const dur = rmLeg(d, path, o, spd, true); if (dur <= 0) rmFrame(now); else rmLoop();
}
// the next leg of a walk: path is what is left of it (its last point is where the walk ends)
function rmLeg(d, path, o, spd, first) {
  const r = rmSt(d), now = performance.now(), [x, y] = path.shift(), end = path.length ? path[path.length - 1] : [x, y];
  const dist = Math.hypot(x - r.x, y - r.y), dur = o.secs != null ? o.secs * 1000 : (dist / spd) * 1000, f0 = r.face;
  if (Math.abs(x - r.x) > 3 && !o.legacy) r.face = x < r.x ? 'left' : 'right';
  r.tw = { x0: r.x, y0: r.y, k0: rmK(r), x1: x, y1: y, k1: o.k != null ? o.k : null, t0: now, dur, o, rest: path, spd, end };
  if (d === D() && !o.legacy && cur.mode === 'yard' && dist > 3 && (first || f0 !== r.face)) renderDog('walk', r.face, true);
  else if (d !== D()) rmPaint(d);
  return dur;
}
// place a dog at once: any of { x, y, face, pose }. Cheap: moves the transform, redraws the art only when the pose or facing changes
function rmSet(d, o = {}) {
  if (!d || !S) return; const r = rmSt(d); r.tw = null;
  if (o.x != null) r.x = o.x; if (o.y != null) r.y = o.y; if (o.face) r.face = o.face; if (o.x != null || o.y != null) { r.hx = r.x; r.hy = r.y; if (!r.fix) r.k = null; }
  if (d === D()) { if (o.pose || o.face) { const lp = rmLeadPose(); renderDog(o.pose || lp[0] || 'idle', o.face || lp[1] || 'right'); } }
  else if (o.pose) packPose[d.id] = o.pose;
  rmPaint(d); rmDepth();
}
function rmStop(d) { const r = rmSt(d); if (r.tw) { r.tw = null; r.hx = r.x; r.hy = r.y; rmPaint(d); } r.q = null; }
// the steps dropped here held the reset of packNext (an errand sets it 60 s ahead): a pack dog picks its next move a few seconds after the release
function rmPause(tag) { RM.paused.add(tag); const t = performance.now() + RINT(2000, 4000); rmDogs().forEach((d) => { const r = rmSt(d); if (r.q && d !== D()) packNext[d.id] = t; r.q = null; }); }
function rmResume(tag) { RM.paused.delete(tag); }
// dogTo (03_yard.js) for the leader: the v2.9 calls give the box offset (feet at 430 * s + tx, 500 * s + ty). 0, 0, 1 means "back to where it stands"
// (its roam spot). s = 1 is the normal size (rmScale), another s is a size fitted to a prop (the nap door, a bed, the Mt. Fuji bench, a sofa)
function rmLegacyTo(tx, ty, s, secs) {
  const d = D(); if (!d) return; const r = rmSt(d), home = tx === 0 && ty === 0 && s === 1;
  if (!home && !r.away) { r.hx = r.x; r.hy = r.y; } r.away = !home;
  const scene = cur.mode === 'yard', X = home ? (scene ? r.hx : 430) : 430 * s + tx, Y = home ? (scene ? r.hy : 500) : 500 * s + ty, k = !scene ? s : home || s === 1 ? null : s; // the bath and the old Fetch keep the v2.9 stage: home is 430, 500 at size 1
  rmTo(d, X, Y, { legacy: true, secs: Math.max(0, secs), k });
}
// the leader's head in world units (speech bubbles, hearts)
function rmHead(d) { const r = rmSt(d || D()), k = rmK(r), lf = (d && d !== D() ? r.face : rmLeadPose()[1]) === 'left'; return { x: r.x + (lf ? -43 : 43) * k, y: r.y - 175 * k }; }

/* ---------------- the pack's own moves (personality, section 5.1) ---------------- */
// a personality with the puppy boost (energy and zoomies x1.3, attention x1.2 under 6 months) and today's Energy
function rmPers(d) {
  const p = persOf(d), pup = ageMonths(d) < 6, cap = (v) => Math.min(1, v);
  const e = d.stats ? d.stats.energy / 100 : 0.7;
  return Object.assign({}, p, { energy: cap(p.energy * (pup ? 1.3 : 1)) * (0.45 + 0.55 * e), zoomies: cap(p.zoomies * (pup ? 1.3 : 1)) * (e > 0.4 ? 1 : 0.3), attention: cap(p.attention * (pup ? 1.2 : 1)) });
}
// one step list per dog: { to: [x, y], run, pose, face, ms, say, bark, fn }
function rmQueue(d, steps) { const r = rmSt(d); r.q = steps.slice(); r.qAt = 0; rmStep(d); }
function rmStep(d) {
  const r = rmSt(d); if (!r.q) return; const s = r.q.shift(); if (!s) { r.q = null; return; }
  const sp = IDLE.speed, next = () => { r.qAt = performance.now() + (s.ms || 0) * sp; };
  if (s.fn) s.fn();
  if (s.say && !S.sleeping && (bubble.hidden || s.ask)) { const h = rmHead(d); say(s.say, h.x, h.y, s.ask ? 3400 : 2600); }
  if (s.bark) barkDog(d, s.bark, { ambient: true, volume: 0.7 });
  if (s.to) { r.qAt = Infinity; rmTo(d, s.to[0], s.to[1], { run: s.run, pose: s.pose, face: s.face, done: next }); return; }
  if (s.pose) { if (s.face) r.face = s.face; packPose[d.id] = poseReal(d.key, s.pose) ? s.pose : s.fb || 'sit'; rmPaint(d); }
  next();
}
function rmQTick(d, now) { const r = rmSt(d); if (r.q && !r.tw && now >= r.qAt) rmStep(d); }
// a pack dog's turn (packIdleTick, 16_voices_idle.js): true when it set off on a walk of its own
function rmPackAct(d) {
  if (!rmFree() || d === D() || d.sleeping || !RM.no || performance.now() - (RM.up || 0) < 1500) return false; const r = rmSt(d); if (r.fix || r.tw || r.q) return false;
  const p = rmPers(d), now = performance.now();
  if (Math.random() > 0.3 + 0.55 * p.energy) return false; // lazy dogs mostly change pose where they are
  const out = outdoorsNow(), w = { wander: 2, zoomies: p.zoomies * (out ? 2.2 : 0.6), follow: p.follows * 1.6, sniff: p.trait === 'sniff' ? 2.5 : out ? 0.6 : 0.2, herd: p.trait === 'herd' && S.dogs.length > 2 ? 2 : 0, guard: p.trait === 'guard' ? 2 : 0, beg: p.trait === 'beg' ? 1.6 : 0, dig: p.trait === 'needy' && GRASSY.includes(S.place) ? 1.2 : 0, doze: (1 - p.energy) * 1.4, front: p.trait === 'follow' || p.trait === 'polite' ? 1 : 0 };
  if (p.trait === 'burst' && packPose[d.id] === 'sleep') w.zoomies += 3; // the greyhound: a nap, then a burst
  let t = Math.random() * Object.values(w).reduce((a, b) => a + b, 0), kind = 'wander'; for (const k in w) { t -= w[k]; if (t <= 0) { kind = k; break; } }
  const sec = (a, b) => RINT(a, b);
  const go = (o) => rmPick(d, o || {});
  let to = null, steps = null;
  if (kind === 'zoomies') {
    const z = rmZoneOf(S.place), y = clamp(r.y + RINT(-30, 30), z.y0 + 10, z.y1 - 10), a = clamp(r.x < 500 ? r.x + RINT(260, 380) : r.x - RINT(260, 380), 90, 910);
    const p1 = rmNear(d, a, y, false), p2 = rmNear(d, clamp(r.x + RINT(-60, 60), 90, 910), y, false); if (!p1 || !p2) return false; // free spots, not a box
    steps = [{ to: p1, run: true }, { to: p2, run: true }, { pose: 'happy', ms: 900 }];
    const back = rmNear(d, r.x, r.y, false); if (back) steps.push({ to: back }); steps.push({ pose: p.trait === 'burst' ? 'down' : 'idle', ms: sec(2000, 4000) });
  } else if (kind === 'follow' || kind === 'herd') {
    const os = rmDogs().filter((o) => o !== d); const o = PICK(os); if (!o) return false; const ro = rmSt(o);
    if (kind === 'herd') { const cx = os.reduce((a, b) => a + rmSt(b).x, 0) / os.length, cy = os.reduce((a, b) => a + rmSt(b).y, 0) / os.length; to = go({ near: [cx + (r.x < cx ? -150 : 150), cy] }); if (!to) return false; steps = [{ to, run: true }, { pose: 'bow', fb: 'sit', ms: 1400, bark: Math.random() < 0.3 ? 'alert' : null }, { pose: 'idle', ms: sec(2000, 4000) }]; }
    else { to = go({ near: [ro.x + (ro.x > 500 ? -140 : 140), ro.y] }); if (!to) return false; steps = [{ to }, { pose: 'sit', face: ro.x < to[0] ? 'left' : 'right', ms: sec(3000, 7000) }]; }
  } else if (kind === 'sniff' || kind === 'dig') {
    to = go({ like: kind === 'dig' ? ['dig'] : ['edge', 'dig', 'shade'] }); if (!to) return false;
    steps = [{ to }, { pose: kind === 'dig' ? 'dig' : 'sniff', fb: 'eat', ms: 1800 }, { pose: 'idle', ms: 600 }, { pose: 'sniff', fb: 'eat', ms: 1400 }, { pose: 'idle', ms: sec(1500, 3000) }];
  } else if (kind === 'guard') {
    to = go({ like: ['gate', 'edge'] }); if (!to) return false; const f = to[0] < 500 ? 'left' : 'right';
    steps = [{ to }, { pose: 'idle', face: f, ms: 1200 }, { pose: 'idle', face: f, ms: sec(3000, 6000), bark: Math.random() < 0.5 ? 'alert' : null, say: Math.random() < 0.25 ? PICK(CHI_ALERT) : null }];
  } else if (kind === 'beg') {
    to = go({ like: ['bowl'] }); if (!to) return false; steps = [{ to }, { pose: 'sit', face: to[0] > 250 ? 'left' : 'right', ms: sec(4000, 8000) }];
  } else if (kind === 'doze') {
    to = go({ like: ['shade', 'edge'] }); if (!to) return false; steps = [{ to }, { pose: 'down', fb: 'sit', ms: 1500 }, { pose: 'sleep', ms: sec(12000, 30000) }, { pose: 'idle', ms: 1000 }];
  } else if (kind === 'front') {
    to = go({ like: ['front'] }); if (!to) return false; steps = [{ to }, { pose: 'sit', ms: sec(4000, 9000) }];
  } else {
    to = go(); if (!to) return false; steps = [{ to }, { pose: PICK(['idle', 'sit', 'sit', 'down']), fb: 'sit', ms: sec(2500, 6000) }];
  }
  if (p.trait === 'chatty' && Math.random() < 0.35) steps.splice(1, 0, { bark: 'talk', ms: 0 });
  packNext[d.id] = now + 60000; // the steps run first; the pose picker waits for them
  steps.push({ fn: () => { packNext[d.id] = performance.now() + RINT(3000, 7000) * IDLE.speed; } });
  rmQueue(d, steps); return true;
}

/* ---------------- attention: asking for pets (section 1) ---------------- */
// a dog with high attention that has not been petted for a while comes to the front and asks: a pose, and a short line once it has been ignored
// for a while (the dachshund asks most). Ignoring it never hurts anything: it just asks again now and then.
const rmAskGap = (d) => (100000 - 70000 * rmPers(d).attention) * Math.max(0.05, IDLE.speed);
function rmPetAgo(d) { return performance.now() - (RM.petT[d.id] || RM.t0 || 0); }
// the front of the scene (towards the player), near the middle of the view: the front row first, else the nearest free spot
function rmFrontSpot(d) {
  const z = rmZoneOf(S.place), r = rmSt(d), cx = isPhone() ? camCx : 500, tx = clamp((r.x + cx) / 2, 120, 880); let c = rmCands(d); if (!c.length) c = rmCands(d, false); if (!c.length) return null;
  const row = c.filter((p) => p[1] >= z.y1 - 50), pool = row.length ? row : c;
  let best = null, bv = 1e9; pool.forEach((p) => { const v = Math.abs(p[0] - tx) + (z.y1 - p[1]) * 3; if (v < bv) { bv = v; best = p; } }); return best;
}
function rmAsk(d, force) {
  const r = rmSt(d), now = performance.now(); if (!d || d.sleeping || r.fix || (!force && (r.tw || r.q))) return false;
  const to = rmFrontSpot(d); if (!to) return false; r.ask = (r.ask || 0) + 1; RM.askAt = now;
  const line = force || r.ask > 1 || rmPers(d).trait === 'needy' ? persLine(d) : null, pose = PICK(['sit', 'happy']);
  if (d === D()) { IDLE.ask = { to, line, pose }; IDLE.force = 'ask'; return true; }
  packNext[d.id] = now + 60000;
  rmQueue(d, [{ to }, { pose, face: to[0] < (isPhone() ? camCx : 500) ? 'right' : 'left', ms: 600 }, { say: line, ask: true, bark: Math.random() < 0.4 ? 'whine' : null, ms: 4200 }, { fn: () => { packNext[d.id] = performance.now() + 2000; } }]);
  return true;
}
function rmAttention(now) {
  if (now - RM.askAt < 25000 * Math.max(0.05, IDLE.speed) || !bubble.hidden) return;
  const due = rmDogs().filter((d) => !d.sleeping && rmPetAgo(d) > rmAskGap(d) && now > (rmSt(d).askNext || 0) && !rmSt(d).fix);
  if (!due.length) return; const d = due.sort((a, b) => rmPers(b).attention - rmPers(a).attention)[0];
  if (Math.random() > 0.35 + rmPers(d).attention * 0.5) { rmSt(d).askNext = now + 15000; return; }
  if (d === D() && (busy || IDLE.act || S.sleeping)) return;
  if (rmAsk(d)) rmSt(d).askNext = now + rmAskGap(d) * 0.6;
}

/* ---------------- petting: the touched dog comes to the front (section 1) ---------------- */
// called on every good pet tick of dog d (the leader from petTick, a pack dog from crPetAt). The first one walks it to the front, where it stays
// about 4 s (happy), then it wanders off again
function rmPetted(d) {
  const r = rmSt(d), now = performance.now(); RM.petT[d.id] = now; r.ask = 0; r.askNext = now + 30000;
  if (!rmWander() || cur.mode !== 'yard' || r.fix || d.sleeping) return;
  r.hold = now + 4000; if (d !== D()) packNext[d.id] = Math.max(packNext[d.id] || 0, now + 4000);
  if (RM.paused.size || (typeof blOn === 'function' && blOn())) return; // held (ball play): the pet counts, the dog stays where the game put it
  if (r.petFront && now - r.petFront < 9000) return; r.petFront = now;
  const z = rmZoneOf(S.place); if (r.y >= z.y1 - 40) return;
  const to = rmFrontSpot(d); if (!to || Math.hypot(to[0] - r.x, to[1] - r.y) < 30) return;
  if (d === D()) { if (busy || S.sleeping) return; if (IDLE.act) idleStop(); rmTo(d, to[0], to[1], { anchor: true, pose: 'happy' }); }
  else { r.q = null; rmTo(d, to[0], to[1], { pose: 'happy' }); }
}

/* ---------------- the scene ---------------- */
function rmTick() {
  if (!S || cur.mode !== 'yard' || !$('#pack')) return; const now = performance.now(); if (now < RM.tickAt) return; RM.tickAt = now + 200;
  if (!RM.no || now > RM.noAt) { // held (ball play, photo mode, a modal, training): nobody is walked off its spot
    const n0 = RM.no ? RM.no.length : -1; rmScan();
    if (rmFree()) rmValidate(false);
    else if (!rmWander() && n0 >= 0 && RM.no && RM.no.length !== n0 && rmOn() && modal.hidden && !TRN && !(typeof blOn === 'function' && blOn())) rmValidate(true); // the harness: a prop that came later (a snow drift) is stepped off at once
  }
  if (isPhone()) rmLookSync();
  if (!rmFree()) return;
  rmDogs().forEach((d) => { if (d !== D()) rmQTick(d, now); });
  rmAttention(now);
}
function rmSceneUp() {
  if (!S || !$('#pack')) return; rmAdopt(); RM.up = performance.now();
  rmScan(); rmValidate(true); rmDepth(); // the scene is in the DOM now: read its tappable things and step anybody off them before the first frame
  requestAnimationFrame(() => { if (cur.mode !== 'yard' && cur.mode !== 'bath') return; rmScan(); rmValidate(true); rmDepth(); if (isPhone()) rmLookSync(); });
}
on('yard:enter', rmSceneUp);

/* ---------------- phones: the wide crop and the look-left / look-right chips (section 5.2) ---------------- */
function rmCropW() { const svg = $('#view > svg.world'); if (!svg) return RM_CROP; const vb = svg.viewBox.baseVal; return vb && vb.width ? vb.width : RM_CROP; }
// the crop width on this phone: about RM_CROP, but never so wide that a tappable thing in the scene (the missions clipboard is the smallest,
// 120 x 71 units) drops under 44 px. vw: the view's width in px, native: the crop at zoom 1
function rmCropFit(vw, native) {
  // the smallest side is read once per scene build, before the seasonal props come (they size their own 48 px tap rects): a later read would narrow
  // the crop after the festival stall or the Fortune box had picked their spot inside it
  const svg = $('#view > svg.world');
  if (!RM.side || RM.side.svg !== svg) { rmScan(); const small = (RM.no || []).filter((b) => b[4] !== 'btn' && b[4] !== 'scene' && b[4] !== 'msCardG' && b[4] !== 'prop' && b[2] < 330 && b[3] < 270).map((b) => Math.min(b[2], b[3])); RM.side = { svg, v: small.length ? Math.min(...small) : 1e9 }; } // the clipboard grows its own 48 px tap rect (24_missions.js)
  const side = RM.side.v; return clamp(Math.min(RM_CROP, native * RM_WIDEN, (vw * side) / 46), native, RM_CROP);
}
// the world x span of every dog's tap rect (and the bowl at home): where the phone camera centres
function rmSpan() {
  let L = 1e9, R = -1e9; rmDogs().forEach((d) => { const r = rmSt(d), lead = d === D(), T = rmTapBox(lead ? r.hx : r.tw ? (r.tw.end || [r.tw.x1])[0] : r.x, lead ? r.hy : r.y, rmK(r)); L = Math.min(L, T[0]); R = Math.max(R, T[0] + T[2]); }); // the leader by its own spot (its errands do not move the home crop)
  if (L > R) { L = 186; R = 530; } return [L, R];
}
function rmLookSync() {
  const svg = $('#view > svg.world'); if (!svg || !isPhone() || cur.mode !== 'yard') return;
  const vb = svg.viewBox.baseVal; if (!vb || !vb.width) return; const x0 = vb.x, x1 = vb.x + vb.width;
  const off = (side) => rmDogs().filter((d) => { const r = rmSt(d), cx = r.x; return side < 0 ? cx < x0 + 20 : cx > x1 - 20; });
  [['rmLookL', -1], ['rmLookR', 1]].forEach(([id, side]) => {
    const l = off(side); let b = $('#' + id);
    if (!l.length || (typeof phPeekOn !== 'undefined' && phPeekOn)) { if (b) b.hidden = true; return; }
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'iconbtn rm-look ' + (side < 0 ? 'left' : 'right'); view.appendChild(b);
      b.onclick = (e) => { e.stopPropagation(); SFX.click(); const ds = off(side); if (!ds.length) return; const v = rmCropW() / 2, x = side < 0 ? Math.min(...ds.map((d) => rmSt(d).x)) : Math.max(...ds.map((d) => rmSt(d).x)); clearTimeout(phPanT); phCamHome = clamp(x + (side < 0 ? v - 160 : 160 - v), v, 1000 - v); camTo(phCamHome, 0.6); };
    }
    // a dog chip, not the scene's look-around arrow (#phPeek): the head of the dog out there (as in the HUD row) with a small arrow pointing to it
    const key = l.map((d) => d.id + coatNameOf(d)).join(); if (b.dataset.k !== key) { b.dataset.k = key; b.innerHTML = `<span class="rm-head">${headSVG(l[0])}</span><svg class="rm-arrow" viewBox="0 0 20 24" aria-hidden="true"><path d="M6 4 Q13 10 14 12 Q12 15 6 20" fill="none" stroke="#5B3D32" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>${l.length > 1 ? `<i class="rm-n">${l.length}</i>` : ''}`; }
    b.hidden = false; const n = l.map((d) => d.name); b.setAttribute('aria-label', `Look ${side < 0 ? 'left' : 'right'}: ${n.join(' and ')}`); b.title = n.join(', ');
  });
}

// the colour above the scene when the phone zooms out: the top of the scene's sky (or wall) rect
function rmSky() {
  const svg = $('#view > svg.world'); if (!svg) return ''; let col = '';
  [...svg.querySelectorAll('#sceneG rect')].slice(0, 12).forEach((r) => {
    if (+(r.getAttribute('width') || 0) < 1000 || +(r.getAttribute('y') || 0) > 0 || r.getAttribute('opacity')) return;
    const f = r.getAttribute('fill') || '', m = /url\(#([^)]+)\)/.exec(f), g = m && svg.querySelector('#' + CSS.escape(m[1]));
    if (g && /Gradient$/.test(g.tagName)) { const st = g.querySelector('stop'); if (st) col = st.getAttribute('stop-color') || col; } else if (!m && f) col = f; // a pattern (paper grain) is drawn over the sky: skip it
  });
  return col;
}

/* ---------------- test hook ---------------- */
function rmExpose() {
  if (!window.__paw) return;
  window.__paw.rm = { on: () => rmOn(), free: () => rmFree(), dogs: () => rmDogs().map((d) => d.id), pos: (id) => rmPos(dogById(id) || D()), scale: (y) => rmScale(y), zone: (p) => rmZone(p),
    set: (id, o) => rmSet(dogById(id), o), to: (id, x, y, o) => rmTo(dogById(id), x, y, o || {}), pause: (t) => rmPause(t), resume: (t) => rmResume(t), ok: (id, x, y) => rmOk(dogById(id), x, y, rmScale(y)),
    scan: () => { rmScan(); return RM.no; }, validate: () => { rmScan(); rmValidate(true); }, act: (id) => rmPackAct(dogById(id)), ask: (id) => rmAsk(dogById(id) || D(), true), petAgo: (id) => rmPetAgo(dogById(id)), span: () => rmSpan(),
    hard: (x, y) => rmHard(x, y), soft: (x, y) => rmSoft(x, y, rmScale(y)), route: (x0, y0, x1, y1) => rmRoute(x0, y0, x1, y1), cands: (id) => rmCands(dogById(id) || D()).length,
    calm: (id, ms) => { const d = dogById(id), t = performance.now() + ms; rmSt(d).askNext = t; RM.askAt = Math.max(RM.askAt, t - 25000); if (d === D()) { IDLE.nextAt = t; if (IDLE.act) idleStop(); } else packNext[d.id] = t; }, // this dog stops what it does and starts nothing of its own for ms
    tap: (id) => { const d = dogById(id), r = rmSt(d); return rmTapBox(r.x, r.y, rmK(r)); }, get moving() { return rmDogs().filter((d) => rmSt(d).tw || rmSt(d).q).map((d) => d.id); } };
}
on('game:ready', () => setTimeout(rmExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.rm) rmExpose(); });
setTimeout(rmExpose, 0);
