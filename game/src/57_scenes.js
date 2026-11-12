/* ======================= v2.29 "Story mode", part 1: 57_scenes.js (tag sc) =======================
   Contract: V229.md. Design: docs/design/story-mode.md. Test hook: window.__paw.sc. Suite: v229_story.
   The scene engine: a short animated scene, drawn live with the game's own art (the place scenes through sceneArt, the player's dog through
   dogSVG with its coat and outfit, Gerald through gdDuck), a camera that pans and zooms, simple tweened moves, a caption per shot (tt()) and a
   PawAudio stinger. No video files: a scene is a small script (SC_SCRIPTS, filled by 57b_story.js).
   - It plays full screen over the stage (#scLayer), pauses the game loop (tick() returns while SC.on) and the roaming dogs (rmPause).
   - A Skip button shows after SC_SKIP_MS (3 s). Escape skips too, once Skip shows.
   - Settings Motion off (html[data-motion="off"]): nothing moves; each shot shows its final picture and the shots cross-fade.
   - Automatic scenes wait in S.story.q and never stack: they play on a calm yard or Market Street only (no sheet, no guide, no level card,
     not before the What's new sheet, the calendar's daily page or the While you were out page), SC_CALM_MS calm, SC_GAP_MS after the last one.
   Script: { id, sting, shots: [{ d: seconds, bg: place id | 'card', cam: [[x, y, zoom], [x, y, zoom]], title: () => text (card shots),
     cap: () => text, actors: [{ who: 'dog' | 'gerald' | 'book' | 'doodle' | 'prop' (SC_PROPS, part 2), dog: 'other' | 'pup' (part 2), pose, pose2 (once the move ends), face, expr, at: [x, y] (feet),
     to: [x, y], s: scale, hop: px, t0, t1 (move window, 0-1 of the shot), k (doodle kind), open (book), fade: 'in' | 'out' }] }] } */
const SC_SKIP_MS = 3000, SC_CALM_MS = 1500, SC_GAP_MS = 8000, SC_FADE_MS = 380;
const SC_SCRIPTS = {}; // id -> script (57b_story.js)
const SC = { on: null, raf: 0, calm: 0, lastEnd: 0 };
function scAllowed() { return !navigator.webdriver || !!(typeof prefs !== 'undefined' && prefs && prefs.scTest); }
const scStill = () => document.documentElement.dataset.motion === 'off';
const scEase = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const scLerp = (a, b, t) => a + (b - a) * t;
function scPlaying() { return !!SC.on; }

/* ---------------- art ---------------- */
// a crayon book (closed or open): every fill sits under its own outline, drawn from the same path
function scBookSVG(open) {
  const two = (d, fill, w) => `<path d="${d}" fill="${fill}"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="${w || 3}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const lines = (x0, x1) => [40, 56, 72, 88, 104].map((y, i) => `<path d="M${x0} ${y + (i % 2)} Q${(x0 + x1) / 2} ${y - 2} ${x1 - (i === 4 ? 30 : 0)} ${y + 1}" fill="none" stroke="#B9A89A" stroke-width="2" stroke-linecap="round"/>`).join('');
  if (!open) return `<svg viewBox="0 0 140 160" class="sc-book">${two('M18 12 Q70 6 122 12 L124 148 Q70 154 16 148 Z', '#F28FA5')}${two('M18 12 L30 8 L30 144 L16 148', '#E0708C', 2.4)}${two('M44 40 Q76 36 108 40 L108 92 Q76 96 44 92 Z', '#FFFBF3', 2.4)}<g transform="translate(76 66)">${doodle('paw', 0, 0, 1.1, -8)}</g></svg>`;
  return `<svg viewBox="0 0 240 150" class="sc-book">${two('M120 22 Q70 8 14 18 L12 138 Q70 128 120 142 Q170 128 228 138 L226 18 Q170 8 120 22 Z', '#FFFBF3')}${two('M120 22 L120 142', 'none', 2.4)}${lines(28, 108)}${lines(134, 214)}<g transform="translate(70 120)">${doodle('heart', 0, 0, 0.8, -6)}</g><g transform="translate(176 118)">${doodle('paw', 0, 0, 0.8, 10)}</g></svg>`;
}
// a sketchbook card: paper, a ruled margin and a few doodles in the corners
function scCardSVG() {
  const dd = [['heart', 90, 90, -10], ['paw', 910, 100, 12], ['sun', 880, 510, 0], ['paw', 120, 520, -14], ['heart', 760, 70, 8]].map(([k, x, y, r]) => doodle(k, x, y, 1.6, r)).join('');
  return `<g class="sc-card"><rect x="-200" y="-200" width="1400" height="1000" fill="#FFFBF3"/>${[150, 230, 310, 390, 470].map((y) => `<path d="M-200 ${y} L1200 ${y + 2}" stroke="#DCE7F2" stroke-width="2"/>`).join('')}<path d="M70 -200 L72 800" stroke="#F2B8C4" stroke-width="2.4"/>${dd}</g>`;
}
// the world art's Gerald looks right, the crayon fallback (gdDuck) looks left: face 'left' | 'right' turns him the way the shot needs
// v2.29 part 2: small crayon props for the chapter scenes (the shopping list, a carrot, a stick, a rosette, Gerald's "10", a sandwich, a train,
// a mountain, a ball, a party flag). Every fill is drawn from the same path as its outline, so no colour runs past a line.
const SC_PROPS = {
  list: [120, 150, [['M14 10 Q60 4 106 12 L104 140 Q60 146 16 140 Z', '#FFFBF3'], ['M30 34 L90 34 M30 54 L84 56 M30 74 L92 74 M30 94 L70 96 M30 114 L86 114', 'none', 2]]],
  carrot: [80, 160, [['M40 54 Q62 56 56 90 Q50 128 40 152 Q30 128 24 90 Q18 56 40 54 Z', '#F4A262'], ['M40 54 Q30 24 18 14 M40 54 Q42 20 40 6 M40 54 Q52 22 66 14', 'none', 4, '#5FA35A'], ['M28 78 L36 80 M44 98 L52 96 M32 118 L40 120', 'none', 2]]],
  stick: [220, 60, [['M8 34 Q60 22 110 30 Q160 38 212 24 L214 34 Q160 48 110 40 Q60 32 10 44 Z', '#B07A52'], ['M120 36 Q130 18 146 12', 'none', 4, '#B07A52']]],
  rosette: [110, 160, [['M40 90 L26 152 L44 140 L56 156 L58 96 Z', '#F28FA5'], ['M70 90 L84 152 L66 140 L54 156 L52 96 Z', '#8EC3E6'], ['M55 8 Q72 12 80 24 Q98 30 96 48 Q104 64 92 76 Q90 96 72 98 Q60 110 46 100 Q26 102 20 84 Q6 72 14 54 Q10 34 28 26 Q38 8 55 8 Z', '#F2C744'], ['M55 30 Q76 32 78 54 Q76 76 55 78 Q34 76 32 54 Q34 32 55 30 Z', '#FFFBF3']]],
  sign10: [150, 140, [['M10 12 Q75 4 140 12 L138 108 Q75 116 12 108 Z', '#FFFBF3'], ['M38 34 L50 26 L50 92 M80 30 Q66 32 66 60 Q66 92 82 92 Q98 92 98 60 Q98 30 80 30 Z', 'none', 5], ['M70 108 L70 136', 'none', 5, '#B07A52']]],
  sandwich: [150, 100, [['M10 50 Q75 16 140 50 L136 62 Q75 40 14 62 Z', '#F2D7A6'], ['M14 62 Q75 48 136 62 Q120 70 104 64 Q90 72 76 64 Q60 72 46 64 Q30 72 14 62 Z', '#8BC77E'], ['M14 66 Q75 54 136 66 L136 80 Q75 70 14 80 Z', '#F28FA5'], ['M14 80 Q75 70 136 80 L134 92 Q75 84 16 92 Z', '#F2D7A6']]],
  train: [420, 150, [['M20 40 Q60 22 330 22 Q400 24 410 80 L410 118 L20 118 Z', '#FFFBF3'], ['M20 92 L410 92 L410 104 L20 104 Z', '#8EC3E6'], ['M120 40 L170 40 L170 72 L120 72 Z', '#DCE7F2'], ['M190 40 L240 40 L240 72 L190 72 Z', '#DCE7F2'], ['M260 40 L310 40 L310 72 L260 72 Z', '#DCE7F2'], ['M340 36 Q384 40 392 70 L340 70 Z', '#DCE7F2'], ['M60 118 Q60 136 76 136 Q92 136 92 118 M300 118 Q300 136 316 136 Q332 136 332 118', 'none', 3]]],
  fuji: [460, 260, [['M10 250 Q120 160 180 70 Q206 40 230 40 Q256 40 282 70 Q340 160 450 250 Z', '#B9CBE3'], ['M180 70 Q206 40 230 40 Q256 40 282 70 Q270 92 254 80 Q240 98 226 82 Q212 98 198 82 Q190 92 180 70 Z', '#FFFBF3']]],
  ball: [60, 60, [['M30 6 Q54 6 54 30 Q54 54 30 54 Q6 54 6 30 Q6 6 30 6 Z', '#D9E86A'], ['M10 20 Q30 30 50 18 M10 42 Q30 30 50 44', 'none', 2.4]]],
  flags: [460, 90, [['M10 14 Q230 50 450 14', 'none', 3], ['M40 22 L64 26 L50 60 Z', '#F28FA5'], ['M110 32 L136 34 L120 70 Z', '#F2C744'], ['M184 38 L210 39 L196 76 Z', '#8EC3E6'], ['M254 39 L280 38 L268 76 Z', '#8BC77E'], ['M326 34 L352 31 L342 70 Z', '#F28FA5'], ['M396 25 L420 21 L414 60 Z', '#F2C744']]]
};
function scPropSVG(k) {
  const P = SC_PROPS[k] || SC_PROPS.ball, [w, h, parts] = P;
  return `<svg viewBox="0 0 ${w} ${h}">${parts.map(([d, fill, sw, ink]) => (fill !== 'none' ? `<path d="${d}" fill="${fill}"/>` : '') + `<path d="${d}" fill="none" stroke="${ink || INKG}" stroke-width="${sw || 3}" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}</svg>`;
}
// a second dog for the scenes: another of the player's dogs, else a visiting dog of another breed in its own default coat
function scOtherDog(d) { const o = (S && S.dogs || []).find((x) => x !== d && !(x.born && typeof ageMonths === 'function' && ageMonths(x) < 3)); return o || { visitor: true, key: d && d.key === 'beagle' ? 'corgi' : 'beagle' }; }
// a puppy for the first-puppies scene: a kept pup, else one in the nursery basket
function scPup() {
  if (!S) return null; const kept = (S.dogs || []).filter((x) => x.parents && x.born).sort((a, b) => String(b.born).localeCompare(String(a.born)))[0]; if (kept) return kept;
  const L = (S.litters || []).slice(-1)[0]; return L && L.pups && L.pups[0] ? L.pups[0] : null;
}
function scGeraldSVG(pose, face) { const real = !!artReal('prop', 'gerald', { pose: pose || 'wave' }), s = typeof gdDuck === 'function' ? gdDuck(pose || 'wave') : ''; return (real ? face === 'left' : face === 'right') ? s.replace(/^\s*<svg\b([^>]*)>/, '<svg$1><g transform="translate(160 0) scale(-1 1)">').replace(/<\/svg>\s*$/, '</g></svg>') : s; }
function scDogSVG(d, a, pose) {
  const o = { pose, facing: a.face || 'right' };
  if (d && d.visitor) return dogArtSafe(d.key, o); try { o.outfit = shSleepOutfit(d, pose); } catch (e) { /* no wardrobe */ }
  try { const P = window.PawArt; if (a.expr && P && typeof P.exprOk === 'function' && P.exprOk(a.expr, pose)) o.expr = a.expr; } catch (e) { /* no faces */ }
  try { return dogSVG(d, o); } catch (e) { return dogArtSafe(d.key, { pose, facing: o.facing }); }
}
// one actor at its feet point (x, y), scale s: [svg, w, h, feet fraction]
function scActor(a, pose) {
  const s = a.s || 1;
  if (a.who === 'dog') return [scDogSVG(a.dog || D(), a, pose), 264 * s, 220 * s, 0.93];
  if (a.who === 'prop') { const P = SC_PROPS[a.k] || SC_PROPS.ball; return [scPropSVG(a.k), P[0] * s, P[1] * s, a.k === 'ball' ? 0.5 : 0.96]; }
  if (a.who === 'gerald') return [scGeraldSVG(pose, a.face), 140 * s, 140 * s, 0.93];
  if (a.who === 'book') return a.open ? [scBookSVG(true), 300 * s, 188 * s, 0.9] : [scBookSVG(false), 140 * s, 160 * s, 0.93];
  return [`<svg viewBox="-24 -24 48 48">${doodle(a.k || 'heart', 0, 0, 1.2, a.rot || 0)}</svg>`, 60 * s, 60 * s, 0.5];
}
function scActorInner(a, pose) { const [svg, w, h, f] = scActor(a, pose); return [place(svg, -w / 2, 0, w, h), h, f]; }
function scBg(bg) {
  if (bg === 'card') return scCardSVG();
  try { return sceneArt(bg, envNow()); } catch (e) { return scCardSVG(); }
}

/* ---------------- the player ---------------- */
function scLayer() {
  let L = $('#scLayer'); if (L) return L;
  L = document.createElement('div'); L.id = 'scLayer'; L.className = 'sc-layer'; L.hidden = true;
  L.setAttribute('role', 'dialog'); L.setAttribute('aria-modal', 'true');
  L.innerHTML = '<div class="sc-film"><svg class="sc-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="sc-cam"></g></svg><div class="sc-title" hidden></div><div class="sc-fade"></div></div>'
    + '<div class="sc-foot"><p class="sc-cap" aria-live="polite"></p><button class="btn sc-skip" type="button" hidden></button></div>';
  ($('#stage') || document.body).appendChild(L);
  $('.sc-skip', L).onclick = () => { try { SFX.click(); } catch (e) { /* audio off */ } scEnd(true); };
  return L;
}
// o.replay: from the Memories album (no queue bookkeeping); o.onEnd(skipped)
function scPlay(id, o) {
  const sc = SC_SCRIPTS[id]; if (!sc || SC.on || !S) return false;
  o = o || {};
  const L = scLayer(), d = D();
  const shots = sc.shots(d).map((x) => Object.assign({ d: 4, cam: [[500, 300, 1], [500, 300, 1]], actors: [] }, x));
  const total = shots.reduce((n, x) => n + x.d * 1000, 0);
  SC.on = { id, sc, shots, total, t0: performance.now(), shot: -1, o, dog: d, skipAt: SC_SKIP_MS, still: scStill() };
  L.setAttribute('aria-label', sc.title ? sc.title() : id);
  $('.sc-skip', L).textContent = tt('sc.skip', 'Skip'); $('.sc-skip', L).hidden = true;
  L.hidden = false; L.classList.toggle('sc-still', SC.on.still);
  try { if (typeof rmPause === 'function') rmPause('scene'); } catch (e) { /* no roaming */ }
  try { if (typeof hideBubble === 'function') hideBubble(); } catch (e) { /* no bubble */ }
  try { if (typeof toastPark === 'function') toastPark(); } catch (e) { /* no toasts */ } // toasts wait until the scene ends
  try { if (sc.sting && window.PawAudio && typeof PawAudio.stinger === 'function') PawAudio.stinger(sc.sting); } catch (e) { /* audio off */ }
  emit('sc:start', { id, replay: !!o.replay });
  cancelAnimationFrame(SC.raf); SC.raf = requestAnimationFrame(scFrame);
  return true;
}
function scShotAt(ms) { const P = SC.on; let acc = 0; for (let i = 0; i < P.shots.length; i++) { const e = acc + P.shots[i].d * 1000; if (ms < e) return [i, (ms - acc) / (P.shots[i].d * 1000)]; acc = e; } return [P.shots.length - 1, 1]; }
function scEnterShot(i) {
  const P = SC.on, x = P.shots[i], L = scLayer(); P.shot = i; P.poses = x.actors.map((a) => (P.still && a.pose2 ? a.pose2 : a.pose || 'idle'));
  x.actors.forEach((a) => { if (a.who === 'dog' && (!a.dog || a.dog === 'other' || a.dog === 'pup')) a.dog = a.dog === 'other' ? scOtherDog(P.dog) : a.dog === 'pup' ? scPup() || scOtherDog(P.dog) : P.dog; });
  const parts = x.actors.map((a, k) => scActorInner(a, P.poses[k])); P.sz = parts.map((q) => [q[1], q[2]]);
  $('.sc-cam', L).innerHTML = scBg(x.bg || 'card') + `<g class="sc-acts">${parts.map((q, k) => `<g class="sc-a" data-a="${k}">${q[0]}</g>`).join('')}</g>`;
  const T = $('.sc-title', L), tl = x.title ? x.title() : ''; T.hidden = !tl; T.textContent = tl;
  P.bx = scMeasure(x, P.poses); P.fit = null;
  const c = $('.sc-cap', L); c.textContent = x.cap ? x.cap() : ''; c.classList.remove('sc-in'); void c.offsetWidth; c.classList.add('sc-in');
}
/* v2.29 fit (the phone crops fix): every actor of a shot stays inside the film, whatever its shape (a 360 px portrait phone shows only
   about 450 of the 1000 scene units across, a wide desktop film only about 490 of the 600 down).
   scMeasure: each actor's drawn box (getBBox, both poses) around its feet point. scFit, per film size: at each camera keyframe (the shot's
   start and end) the box of the actors there (an actor walking in or passing through counts across only once its point is on the stage,
   a doodle fading out is left out of the end), kept clear of the card title. The camera zooms out (never below 1, the place art always
   fills the film) and slides until that box fits. If the box is still too wide at zoom 1, the cast first steps closer together (their
   on-stage spots move toward the middle, a character overlapping its neighbour by at most a quarter; walk-ins still start off the stage),
   then the whole cast shrinks together (one scale about the ground under them), so nobody leaves the picture and everybody keeps their
   place. An actor with fit: false is set dressing and is not fitted. Motion off shows the end keyframe, fitted the same way. */
const SC_FIT_PX = 8; // margin inside the film edge, in screen px
function scMeasure(x, poses) {
  const L = scLayer(), g = $('.sc-acts', L), out = [];
  if (!g) return out;
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tmp.setAttribute('visibility', 'hidden'); g.appendChild(tmp);
  x.actors.forEach((a, k) => {
    const one = (pose) => {
      const q = scActorInner(a, pose), h = q[1], f = q[2], w = h ? scActor(a, pose)[1] : 0; let b = null;
      try { tmp.innerHTML = q[0]; const r = tmp.getBBox(); if (r && r.width > 0 && r.height > 0) b = [r.x, r.y, r.x + r.width, r.y + r.height]; } catch (e) { b = null; }
      if (!b) b = [-w / 2, 0, w / 2, h];
      return [b[0], b[1] - h * f, b[2], b[3] - h * f]; // around the feet point
    };
    const p0 = poses[k], p1 = a.pose2 || p0;
    out.push({ a: one(p0), b: p1 === p0 ? null : one(p1) });
  });
  tmp.remove();
  return out;
}
function scFilm() {
  const L = scLayer(), svg = $('.sc-svg', L), r = svg.getBoundingClientRect(), k = Math.max(r.width / 1000, r.height / 600) || 1;
  const T = $('.sc-title', L), top = T && !T.hidden && r.height ? Math.max(0, T.getBoundingClientRect().bottom - r.top) : 0;
  return { k, W: r.width / k || 1000, H: r.height / k || 600, top };
}
function scFit(x, F) {
  const P = SC.on, bx = P.bx || [], m = SC_FIT_PX / F.k, zMax = Math.max(1, F.W / 360);
  const W1 = F.W - 2 * m, H1 = F.H - 2 * m - F.top / F.k; // usable units at zoom 1
  // the cast's box at a keyframe (end: 1, start: 0), its on-stage spots closer by fx, the cast scaled by f about (gx, gy)
  const box = (end, f, gx, gy, fx) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    x.actors.forEach((a, k) => {
      if (a.fit === false || !bx[k] || (a.fade === (end ? 'out' : 'in'))) return;
      const pt = end ? (a.to || a.at || [500, 500]) : (a.at || [500, 500]), b = end && bx[k].b ? bx[k].b : bx[k].a, px = scSqueeze(pt[0], gx, fx);
      const X0 = gx + (px + b[0] - gx) * f, X1 = gx + (px + b[2] - gx) * f, Y0 = gy + (pt[1] + b[1] - gy) * f, Y1 = gy + (pt[1] + b[3] - gy) * f;
      y0 = Math.min(y0, Math.max(0, Y0)); y1 = Math.max(y1, Math.min(600, Y1));
      if (pt[0] >= 0 && pt[0] <= 1000) { x0 = Math.min(x0, Math.max(0, X0)); x1 = Math.max(x1, Math.min(1000, X1)); }
    });
    return [x0, y0, x1, y1];
  };
  const zFit = (b) => Math.min(b[2] > b[0] ? W1 / (b[2] - b[0]) : 99, b[3] > b[1] ? H1 / (b[3] - b[1]) : 99);
  // the ground under the cast (the lowest feet) and the middle of its stage: the point the cast shrinks toward
  let gx = 500, gy = 0, n = 0, xs = [1e9, -1e9];
  x.actors.forEach((a) => { if (a.fit === false) return; [a.at, a.to].forEach((pt) => { if (pt && pt[0] >= 0 && pt[0] <= 1000) { xs = [Math.min(xs[0], pt[0]), Math.max(xs[1], pt[0])]; gy = Math.max(gy, pt[1]); n++; } }); });
  if (n) gx = (xs[0] + xs[1]) / 2; else gy = 500;
  // how close the characters may step: neighbours (dogs, Gerald, the book) overlap by at most a quarter of the narrower one
  let lo = 0.5;
  [false, true].forEach((end) => {
    const cs = [];
    x.actors.forEach((a, k) => { if (a.fit === false || !bx[k] || !['dog', 'gerald', 'book'].includes(a.who)) return; const pt = end ? (a.to || a.at) : a.at, b = end && bx[k].b ? bx[k].b : bx[k].a; if (pt && pt[0] >= 0 && pt[0] <= 1000) cs.push([pt[0], b]); });
    cs.sort((p, q) => p[0] - q[0]);
    for (let i = 1; i < cs.length; i++) { const [xa, ba] = cs[i - 1], [xb, bb] = cs[i], d = xb - xa; if (d > 1) lo = Math.max(lo, (ba[2] - bb[0] - 0.25 * Math.min(ba[2] - ba[0], bb[2] - bb[0])) / d); }
  });
  lo = Math.min(1, lo);
  const wide = (fx) => [false, true].some((end) => { const b = box(end, 1, gx, gy, fx); return b[2] - b[0] > W1; });
  let fx = 1;
  if (wide(1)) { if (wide(lo)) fx = lo; else { let a = lo, b2 = 1; for (let i = 0; i < 12; i++) { const mid = (a + b2) / 2; if (wide(mid)) b2 = mid; else a = mid; } fx = a; } }
  let f = Math.min(1, zFit(box(false, 1, gx, gy, fx)), zFit(box(true, 1, gx, gy, fx)));
  f = Math.max(0.45, f);
  const key = (end) => {
    const C = x.cam[end ? 1 : 0] || x.cam[0], b = box(end, f, gx, gy, fx);
    const z = Math.max(1, Math.min(Math.max(1, C[2] || 1), zMax, zFit(b))), hw = F.W / 2 / z, hh = F.H / 2 / z, mz = m / z, tz = F.top / F.k / z;
    let cx = C[0], cy = C[1];
    if (b[2] > b[0]) cx = Math.min(Math.max(cx, b[2] - hw + mz), b[0] + hw - mz);
    if (b[3] > b[1]) cy = Math.min(Math.max(cy, b[3] - hh + mz), b[1] + hh - mz - tz);
    return [Math.min(Math.max(cx, hw), 1000 - hw), Math.min(Math.max(cy, hh), 600 - hh), z];
  };
  return { A: key(false), B: key(true), f, fx, gx, gy, W: F.W, H: F.H, top: F.top };
}
// an on-stage spot moved toward gx by fx; a spot off the stage (a walk-in's start, a pass-through) stays where it is
function scSqueeze(v, gx, fx) { return fx == null || fx >= 1 || v < 0 || v > 1000 ? v : gx + (v - gx) * fx; }
// the camera: a pan and zoom with easing between the fitted keyframes, kept inside the 1000x600 box
function scCam(x, p) {
  const P = SC.on, F = scFilm();
  if (!P.fit || Math.abs(P.fit.W - F.W) > 0.5 || Math.abs(P.fit.H - F.H) > 0.5 || Math.abs(P.fit.top - F.top) > 2) {
    P.fit = scFit(x, F);
    const g = $('.sc-acts', scLayer()), q = P.fit;
    if (g) { if (q.f < 0.999) g.setAttribute('transform', `translate(${q.gx.toFixed(1)} ${q.gy.toFixed(1)}) scale(${q.f.toFixed(4)}) translate(${(-q.gx).toFixed(1)} ${(-q.gy).toFixed(1)})`); else g.removeAttribute('transform'); }
  }
  const A = P.fit.A, B = P.fit.B, e = P.still ? 1 : scEase(p);
  const z = scLerp(A[2], B[2], e), hw = F.W / 2 / z, hh = F.H / 2 / z;
  const cx = Math.min(Math.max(scLerp(A[0], B[0], e), hw), 1000 - hw), cy = Math.min(Math.max(scLerp(A[1], B[1], e), hh), 600 - hh);
  return `translate(500 300) scale(${z.toFixed(4)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`;
}
function scFrame(now) {
  const P = SC.on; if (!P) return;
  const ms = now - P.t0, L = scLayer();
  if (ms >= P.total) { scEnd(false); return; }
  const [i, p] = scShotAt(ms); if (i !== P.shot) scEnterShot(i);
  const x = P.shots[i];
  $('.sc-cam', L).setAttribute('transform', scCam(x, p));
  x.actors.forEach((a, k) => {
    const g = L.querySelector(`.sc-a[data-a="${k}"]`); if (!g) return;
    const t0 = a.t0 || 0, t1 = a.t1 == null ? 1 : a.t1, q = P.still ? 1 : Math.min(1, Math.max(0, (p - t0) / Math.max(0.01, t1 - t0))), e = scEase(q);
    const F = P.fit, sq = (pt) => (F && F.fx < 1 ? [scSqueeze(pt[0], F.gx, F.fx), pt[1]] : pt);
    const A = sq(a.at || [500, 500]), B = sq(a.to || a.at || [500, 500]), moving = q > 0 && q < 1 && (A[0] !== B[0] || A[1] !== B[1]);
    const hop = moving && a.hop && !P.still ? -Math.abs(Math.sin(q * Math.PI * 6)) * a.hop : 0;
    const [hh, ff] = P.sz[k], ax = scLerp(A[0], B[0], e), ay = scLerp(A[1], B[1], e) + hop;
    g.setAttribute('transform', `translate(${ax.toFixed(1)} ${(ay - hh * ff).toFixed(1)})`);
    if (a.fade) g.setAttribute('opacity', (a.fade === 'in' ? Math.min(1, p * 3) : Math.max(0, 1 - p * 1.4)).toFixed(2));
    if (a.pose2 && q >= 1 && P.poses[k] !== a.pose2) { P.poses[k] = a.pose2; g.innerHTML = scActorInner(a, a.pose2)[0]; }
  });
  // the cross-fade at each cut (also with Motion off: it is a fade, not a move)
  const into = ms - P.shots.slice(0, i).reduce((n, s) => n + s.d * 1000, 0), left = x.d * 1000 - into, fd = $('.sc-fade', L);
  const fo = i === 0 && into < SC_FADE_MS ? 1 - into / SC_FADE_MS : into < SC_FADE_MS && i > 0 ? 1 - into / SC_FADE_MS : left < SC_FADE_MS ? 1 - left / SC_FADE_MS : 0;
  fd.style.opacity = Math.max(0, Math.min(1, fo)).toFixed(2);
  const sk = $('.sc-skip', L); if (sk.hidden && ms >= P.skipAt) { sk.hidden = false; }
  SC.raf = requestAnimationFrame(scFrame);
}
function scEnd(skipped) {
  const P = SC.on; if (!P) return; SC.on = null; cancelAnimationFrame(SC.raf);
  const L = scLayer(); L.hidden = true; $('.sc-cam', L).innerHTML = ''; SC.lastEnd = Date.now(); SC.calm = 0;
  try { lastTick = performance.now(); } catch (e) { /* the loop has its own clock */ }
  try { if (typeof rmResume === 'function') rmResume('scene'); } catch (e) { /* no roaming */ }
  try { if (typeof toastNext === 'function') toastNext(); } catch (e) { /* no toasts */ }
  emit('sc:end', { id: P.id, skipped: !!skipped, replay: !!P.o.replay });
  if (P.o.onEnd) { try { P.o.onEnd(!!skipped); } catch (e) { console.warn('sc end', e); } }
}
document.addEventListener('keydown', (e) => { if (SC.on && e.key === 'Escape') { const sk = $('#scLayer .sc-skip'); if (sk && !sk.hidden) { e.preventDefault(); e.stopPropagation(); scEnd(true); } } }, true);

/* ---------------- the automatic queue: never on top of anything ---------------- */
function scCalmNow() {
  if (!S || SC.on || !titleEl.hidden || !['yard', 'market'].includes(cur.mode) || !modal.hidden || busy) return false;
  if (typeof levelQueue !== 'undefined' && levelQueue.length) return false;
  if (typeof lvQueue !== 'undefined' && lvQueue.length) return false;
  if (typeof popOpen === 'function' && popOpen()) return false;
  if (typeof gdLive === 'function' && gdLive() && gdAllowed()) return false;
  if (typeof phActive === 'function' && phActive()) return false; if (typeof blOn === 'function' && blOn()) return false;
  if ($('#gdLayer .gd-card:not([hidden])')) return false;
  if (S.fw && typeof fwOn === 'function' && fwOn()) { const f = S.fw; if (f.morning && f.shown !== f.morning) return false; if (Object.keys(f.b2pending || {}).length) return false; }
  if (typeof nwOn === 'function' && nwOn() && typeof nwLatest === 'function' && S.newsSeen !== nwLatest()) return false; // What's new goes first
  if (S.wbPend && typeof wbOn === 'function' && wbOn()) return false; // then While you were out
  return true;
}
function scQueue(id) {
  if (!S || !S.story || !SC_SCRIPTS[id] || S.story.q.includes(id) || S.story.w[id]) return false;
  S.story.q.push(id); markDirty(); return true;
}
function scTick() {
  if (!S || !S.story || !S.story.q.length || !scAllowed()) { SC.calm = 0; return; }
  if (!scCalmNow() || Date.now() - SC.lastEnd < SC_GAP_MS) { SC.calm = 0; return; }
  if (!SC.calm) SC.calm = Date.now();
  if (Date.now() - SC.calm < SC_CALM_MS) return;
  SC.calm = 0;
  const id = S.story.q[0];
  if (!SC_SCRIPTS[id]) { S.story.q.shift(); markDirty(); return; }
  scPlayAuto(id);
}
// an automatic play: unlocks the memory at the start, marks it watched (whether it ran to the end or was skipped)
function scPlayAuto(id) {
  const ok = scPlay(id, { onEnd: () => { const T = S && S.story; if (!T) return; T.q = T.q.filter((x) => x !== id); T.w[id] = 1; markDirty(); try { saveNow(); } catch (e) { /* storage */ } } });
  if (ok) { const T = S.story; if (!T.m[id]) T.m[id] = jstISO(); markDirty(); }
  return ok;
}
setInterval(() => { try { scTick(); } catch (e) { console.warn('sc tick', e); } }, 400);
