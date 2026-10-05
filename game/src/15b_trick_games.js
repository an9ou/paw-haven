/* ======================= v1.7.1: trick training mini-games =======================
   Treat Lure: drag the treat from the dog's nose along a pencil track; the dog follows it into the pose.
   At 60% progress the lure fades: you trace the same track as a hand signal (x1.3 progress). Speak is a rhythm game.
   Show off runs a short hand-signal trace. All coordinates are scene units of the 1000x600 world SVG. */
const TG_TOL = 28;          // screen px each side of the track (converted to scene units when an attempt starts)
const TG_FOCUS = 15;        // Focus per attempt: a full session holds about 6
const TG_FADE = 0.6;        // progress where the treat becomes a hand signal
const TG_GAIN = { Great: 0.35, Good: 0.2, Missed: 0 };
const TG_MAXV = 1.15;       // scene px per ms; faster and the dog loses the scent
const TG_BEAT = 800;        // Speak rhythm: ms between beats
const TG_FLOOR = 490;
const NOSE_DY = { chihuahua: 40, pug: 28, dachs: 45, corgi: 30, beagle: 12, greyhound: -40 }; // small dogs: track drawn lower, tall dogs: higher
const NOSE_DX = { dachs: 30, greyhound: 25, corgi: 10 };
const FOOD_DOGS = ['corgi', 'pug'];
const SIG_COMBO = { shiba: ['Lie Down', 'Roll Over', 'Play Dead'], corgi: ['Sit', 'Lie Down', 'Bow'], golden: ['Spin', 'Dance', 'Spin'], dachs: ['Dance', 'Bow', 'Spin'], husky: ['Sit', 'Dance', 'Bow'], mutt: ['Sit', 'Paw', 'Lie Down'], chihuahua: ['Spin', 'Spin', 'Dance'], pug: ['Sit', 'Spin', 'Lie Down'], greyhound: ['Spin', 'Lie Down', 'Roll Over'], beagle: ['Sit', 'Bow', 'Dance'] };
const TG_PREPOSE = { Sit: ['sit', 0.6], 'Lie Down': ['down', 0.5], Bow: ['bow', 0.75], Dance: ['dance', 0.3], 'Roll Over': ['down', 0] };
const TG_MISS = ['{n} sniffed the air, sat on nothing, and looked proud anyway.', '{n} followed the treat for a bit, then remembered a very important leaf.', 'Close! {n} invented a brand new trick. Nobody knows what it is.', '{n} is now facing the wrong way and very pleased about it.'];

/* ---------- geometry ---------- */
const tgDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function tgLine(a, b) { const n = Math.max(1, Math.ceil(tgDist(a, b) / 6)), o = []; for (let i = 1; i <= n; i++) o.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return o; }
function tgPoly(pts) { let o = [pts[0]]; for (let i = 1; i < pts.length; i++) o = o.concat(tgLine(pts[i - 1], pts[i])); return o; }
function tgBez(a, c, b) { const n = Math.max(6, Math.ceil((tgDist(a, c) + tgDist(c, b)) / 6)), o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; }
function tgEll(cx, cy, rx, ry, a0, a1) { const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.PI / 180 * (rx + ry) / 2 / 6)), o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + rx * Math.cos(a), cy - ry * Math.sin(a)]); } return o; }
function tgNose(d) { return [482 + (NOSE_DX[d.key] || 0), clamp(392 + (NOSE_DY[d.key] || 0), 340, 450)]; } // the treat starts at the nose (dog box: feet y 500, centre x 430)
// the logical lure motions (V171 Part B table)
function tgTrack(n, d) {
  const [nx, ny] = tgNose(d), F = TG_FLOOR, P = (pts) => ({ type: 'path', pts });
  switch (n) {
    case 'Lie Down': return [P(tgPoly([[nx, ny], [nx, F], [nx + 85, F]]))];
    case 'Paw': return [{ type: 'tap', at: [nx - 65, F - 4], n: 2 }, { type: 'hold', at: [nx + 45, ny + 25], ms: 1000 }];
    case 'Roll Over': { const sy = Math.min(ny + 40, F - 64); return [P(tgEll(nx - 62, sy, 62, 62, 0, 270))]; }
    case 'Spin': { const cy = ny + 25; return [P(tgPoly([[nx, ny], [565, cy]]).concat(tgEll(430, cy, 135, 56, 0, 360).slice(1)))]; }
    case 'Play Dead': { const e = [nx + 140, ny + 10]; return [P(tgPoly([[nx, ny], [nx + 35, ny - 35], [nx + 70, ny + 10], [nx + 105, ny - 35], e])), { type: 'hold', at: e, ms: 1000 }]; }
    case 'Bow': { const e = [nx - 25, F]; return [P(tgPoly([[nx, ny], e])), { type: 'hold', at: e, ms: 1000 }]; }
    case 'Dance': { const hy = Math.max(205, ny - 120), w = [[nx, ny], [nx, hy]]; for (let i = 0; i < 8; i++) w.push([nx + (i % 2 ? 45 : -45), hy]); return [P(tgPoly(w))]; }
    default: return [P(tgBez([nx, ny], [nx + 10, ny - 95], [nx - 105, ny - 70]))]; // Sit: up and back over the head
  }
}
function tgCum(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + tgDist(pts[i], pts[i - 1])); return c; }
function tgPrep(segs, G, pn) {
  return segs.map((sg) => {
    const s = Object.assign({}, sg);
    if (s.type === 'path') {
      let pts = s.pts.map((q) => q.slice());
      if (G.wobble) { const c = tgCum(pts), L = c[c.length - 1]; pts = pts.map((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1, k = 7 * Math.sin(c[i] / 60 * Math.PI * 2) * Math.min(1, c[i] / 40, (L - c[i]) / 40); return [q[0] - dy / m * k, q[1] + dx / m * k]; }); }
      if (G.mode === 'show') { const c = tgCum(pts), cut = Math.max(Math.min(90, c[c.length - 1]), c[c.length - 1] * 0.55); pts = pts.filter((q, i) => c[i] <= cut + 0.01); if (pts.length < 2) pts = s.pts.slice(0, 2); }
      s.pts = pts; s.cum = tgCum(pts); s.len = s.cum[s.cum.length - 1];
    }
    if (s.type === 'tap' && G.mode === 'show') s.n = 1;
    if (s.type === 'hold' && G.mode === 'show') s.ms = 450;
    s.part = pn; return s;
  });
}
function tgPointAt(seg, s) {
  const c = seg.cum; if (s <= 0) return seg.pts[0].slice(); if (s >= seg.len) return seg.pts[seg.pts.length - 1].slice();
  let i = 1; while (c[i] < s) i++; const t = (s - c[i - 1]) / ((c[i] - c[i - 1]) || 1), a = seg.pts[i - 1], b = seg.pts[i];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
// nearest point of the path to p, searched only a little behind and ahead of the progress (no short-cuts across loops)
function tgNearest(seg, p, s0) {
  const c = seg.cum; let i0 = 0; while (i0 < c.length - 1 && c[i0 + 1] < s0 - 18) i0++;
  let best = { d: 1e9, s: s0 };
  for (let i = i0; i < seg.pts.length - 1 && c[i] <= s0 + 150; i++) {
    const a = seg.pts[i], b = seg.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2, 0, 1), q = [a[0] + dx * t, a[1] + dy * t], dd = tgDist(p, q);
    if (dd < best.d) best = { d: dd, s: c[i] + (c[i + 1] - c[i]) * t };
  }
  return best;
}

/* ---------- personality ---------- */
function tgTolMul(n, d, mode) {
  const pers = PERS[d.key]; let m = 1;
  if (pers === 'eager') m *= 1.2; if (pers === 'gentle') m *= 1.1; if (pers === 'stubborn') m *= 0.9;
  if (FOOD_DOGS.includes(d.key)) m *= mode === 'lure' ? 1.15 : 0.9;
  if (d.key === 'greyhound') { if (n === 'Sit') m *= 0.85; if (n === 'Lie Down') m *= 1.15; }
  if (pers === 'nose') m *= 1.2;
  if (pers === 'curious' && n === 'Bow') m *= 1.1; // Noodle: v1.6 curious bonus on Bow
  if (pers === 'lazy') { if (n === 'Lie Down' || n === 'Play Dead') m *= 1.1; if (n === 'Spin' || n === 'Roll Over' || n === 'Dance') m *= 0.9; }
  if (mode === 'show' && trickSt(n, d).shows >= 5) m *= 1.3; // Mastered: wider tolerance
  return m;
}
function tgHint(n, d, hand) {
  if (n === 'Speak') return `Press Start, then tap Speak! each time ${d.name}'s ears perk up (3 beats).`;
  if (n === 'Paw') return hand ? `Hand signal: tap ${d.name}'s paw twice, then hold your palm still.` : `Tap ${d.name}'s front paw twice, then hold your open palm still for a second.`;
  if (n === 'Signature') return `A 3-part combo: ${(SIG_COMBO[d.key] || ['Sit', 'Spin', 'Bow']).join(', then ')}.`;
  return hand ? `Hand signal: trace the faint track with your hand. No treat needed now (x1.3).` : `Press Start, then drag the treat from ${d.name}'s nose along the dotted track to the star. Not too fast!`;
}

/* ---------- attempt lifecycle ---------- */
const tgG = () => (TRN && TRN.game) || null;
const tgSvg = () => $('#view > svg.world');
function tgBegin(n, mode) {
  if (!TRN || TRN.game || busy) return; const d = D();
  if (S.sleeping) { nope(`${d.name} is asleep.`); return; }
  if (mode !== 'show') {
    const f = focusNow(); if (f < trainCost(d)) { trainLine(`${d.name}'s brain is full. Session over. Try again after a break or a nap.`, 'bad'); SFX.nope(); return; }
    focusSet(f - trainCost(d)); mode = trickSt(n).p >= TG_FADE ? 'hand' : 'lure';
  }
  hideBubble(); idleStop(); SFX.click();
  const parts = n === 'Signature' ? (SIG_COMBO[d.key] || ['Sit', 'Spin', 'Bow']).slice() : [n];
  const G = TRN.game = { n, mode, parts, pi: 0, segs: [], si: 0, s: 0, inside: 0, outside: 0, grabbed: false, retry: false, pos: null, samples: [], taps: 0, holdAt: 0, busy: false, t0: performance.now(), wobble: PERS[d.key] === 'nose' && mode === 'lure' };
  if (n === 'Speak') { tgSpeakStart(G); renderTraining(); return; }
  renderTraining(); tgLoadPart(G);
  trainLine(mode === 'show' ? `Show off: trace the ${tName(n)} signal.` : mode === 'hand' ? `Hand signal: trace the faint track. ${d.name} watches your hand.` : n === 'Paw' ? 'Tap the paw twice, then hold your palm still.' : `Grab the treat at ${d.name}'s nose and lead the way to the star.`, '');
  tgBind(true);
  if (!G.ticker) G.ticker = setInterval(tgTick, 50);
}
function tgLoadPart(G) {
  const d = D(), pn = G.parts[G.pi], svg = tgSvg(); if (!svg) return;
  const scale = (svg.getScreenCTM() || { a: 1 }).a || 1;
  G.tol = TG_TOL / scale * tgTolMul(pn, d, G.mode);
  G.segs = tgPrep(tgTrack(pn, d), G, pn); G.si = 0; G.s = 0; G.grabbed = false; G.samples = []; G.taps = 0; G.holdAt = performance.now();
  G.pos = G.segs[0].type === 'path' ? G.segs[0].pts[0].slice() : tgNose(d);
  dogTo(0, 0, 1, 0.3); const fx = $('#dogFx'); if (fx) fx.setAttribute('class', '');
  renderDog(pn === 'Roll Over' ? 'down' : 'idle', 'right', true); tgLean(null);
  tgDraw(G);
}
function tgDraw(G) {
  const svg = tgSvg(); if (!svg) return; let g = svg.querySelector('#trTrack'); if (g) g.remove();
  const hand = G.mode !== 'lure', pp = (pts) => pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
  let h = '<rect id="tgHit" x="-200" y="0" width="1400" height="600" fill="transparent" pointer-events="all"/>';
  G.segs.forEach((sg, i) => {
    const cur = i === G.si, past = i < G.si, op = past ? 0.25 : 1;
    if (sg.type === 'path') {
      const a = sg.pts[0], b = sg.pts[sg.pts.length - 1];
      h += `<g class="tgseg" opacity="${op}"><polyline class="tg-band" points="${pp(sg.pts)}" stroke-width="${(G.tol * 2).toFixed(1)}"/><polyline class="tg-dots" points="${pp(sg.pts)}"/>`;
      h += `<circle class="tg-start" cx="${a[0]}" cy="${a[1]}" r="9"/><text class="tg-star" x="${b[0]}" y="${b[1] + 12}" text-anchor="middle">★</text></g>`;
      if (cur) h += `<polyline id="tgDone" class="tg-done" points="${pp(sg.pts.slice(0, 1))}"/>`;
    } else if (sg.type === 'tap') {
      h += `<g class="tgseg tg-tap" opacity="${op}"><circle cx="${sg.at[0]}" cy="${sg.at[1]}" r="${(G.tol + 6).toFixed(1)}"/>${doodle('paw', sg.at[0], sg.at[1], 0.9)}<text x="${sg.at[0]}" y="${sg.at[1] - G.tol - 12}" text-anchor="middle">tap x${sg.n}${cur && G.taps ? ' (' + G.taps + ')' : ''}</text></g>`;
    } else if (sg.type === 'hold') {
      const r = Math.max(18, G.tol);
      h += `<g class="tgseg tg-hold" opacity="${op}"><circle cx="${sg.at[0]}" cy="${sg.at[1]}" r="${r.toFixed(1)}"/><circle id="${cur ? 'tgRing' : ''}" class="tg-ring" cx="${sg.at[0]}" cy="${sg.at[1]}" r="${r.toFixed(1)}" pathLength="100" stroke-dasharray="0 100" transform="rotate(-90 ${sg.at[0]} ${sg.at[1]})"/><text x="${sg.at[0]}" y="${sg.at[1] - r - 10}" text-anchor="middle">hold</text></g>`;
    }
  });
  h += `<g id="tgCur" class="tg-cur" pointer-events="none">${hand ? `<g class="tg-hand">${place(artReal('prop', 'hand-signal', { trick: TSIG[G.parts[G.pi]] }) || SIGN_FB(G.parts[G.pi]), -30, -36, 60, 60)}</g>` : '<g class="tg-treat"><ellipse cx="0" cy="0" rx="13" ry="10" fill="#C98A54" stroke="#5B3D32" stroke-width="3"/><path d="M-6 -2 l3 2 M2 -4 l2 3 M-1 3 l3 1" stroke="#5B3D32" stroke-width="2" stroke-linecap="round"/></g>'}</g>`;
  svg.insertAdjacentHTML('beforeend', `<g id="trTrack" class="${hand ? 'hand' : 'lure'}${G.mode === 'show' ? ' show' : ''}">${h}</g>`);
  tgCursor(G); tgDrawProgress(G);
}
function tgCursor(G) { const c = $('#tgCur'); if (c && G.pos) c.setAttribute('transform', `translate(${G.pos[0].toFixed(1)} ${G.pos[1].toFixed(1)})`); }
function tgDrawProgress(G) {
  const sg = G.segs[G.si], l = $('#tgDone'); if (!l || !sg || sg.type !== 'path') return;
  const pts = sg.pts.filter((q, i) => sg.cum[i] <= G.s).concat([tgPointAt(sg, G.s)]); l.setAttribute('points', pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '));
}
// the dog follows the treat: lean towards it, look up or lower, turn round for Spin, and slide into the pose near the end
function tgLean(G, p) {
  const a = $('#dogArt'); if (!a) return;
  if (!G || !p) { a.style.transform = ''; return; }
  const [nx, ny] = tgNose(D()), dx = p[0] - nx, dy = p[1] - ny, pn = G.parts[G.pi];
  const rot = clamp(dx * 0.05, -8, 8) - clamp(-dy * 0.03, 0, 5), ty = clamp(dy * 0.08, -10, 12), sy = 1 - clamp(dy, 0, 120) / 120 * 0.12;
  a.style.transformOrigin = '430px 500px'; a.style.transform = `rotate(${rot.toFixed(2)}deg) translateY(${ty.toFixed(1)}px) scaleY(${sy.toFixed(3)})`;
  const sg = G.segs[G.si], last = G.si === G.segs.length - 1 || (G.segs[G.si + 1] && G.segs[G.si + 1].type !== 'path');
  if (pn === 'Spin') renderDog('walk', p[0] < 430 ? 'left' : 'right');
  else if (TG_PREPOSE[pn] && sg && sg.type === 'path' && last && G.s / (sg.len || 1) >= TG_PREPOSE[pn][1]) { const pz = TG_PREPOSE[pn][0]; renderDog(poseReal(D().key, pz) || pz === 'down' || pz === 'sit' ? pz : 'happy', 'right'); }
}

/* ---------- input ---------- */
function tgPt(e) { const svg = tgSvg(); const q = toWorld(svg, e.clientX, e.clientY); return [q.x, q.y]; }
function tgBind(on) {
  window.removeEventListener('pointermove', tgMoveEv); window.removeEventListener('pointerup', tgUpEv); window.removeEventListener('keydown', tgKey, true); window.removeEventListener('keyup', tgKeyUp, true);
  const svg = tgSvg(); if (svg) svg.removeEventListener('pointerdown', tgDownEv);
  if (!on) return;
  window.addEventListener('pointermove', tgMoveEv); window.addEventListener('pointerup', tgUpEv); window.addEventListener('keydown', tgKey, true); window.addEventListener('keyup', tgKeyUp, true);
  if (svg) svg.addEventListener('pointerdown', tgDownEv);
}
function tgDownEv(e) {
  const G = tgG(); if (!G || G.busy || G.rhythm || !e.target || e.target.closest('#trTrack') === null) return; e.preventDefault(); e.stopPropagation();
  const p = tgPt(e), sg = G.segs[G.si]; if (!sg) return;
  if (sg.type === 'tap') { tgTap(G, sg, p); return; }
  if (sg.type === 'hold') { if (tgDist(p, sg.at) <= G.tol * 1.6) { G.grabbed = true; G.pos = p; G.holdAt = performance.now(); tgCursor(G); } return; }
  const cp = tgPointAt(sg, G.s);
  if (tgDist(p, cp) <= G.tol * 1.8) { G.grabbed = true; G.pos = p; G.samples = [{ x: p[0], y: p[1], t: performance.now() }]; G.grabT = performance.now(); G.grabS = G.s; tgCursor(G); }
  else trainLine(G.retry || G.s > 0 ? 'Grab the treat where you let go.' : `Grab the ${G.mode === 'lure' ? 'treat' : 'hand'} at the start dot first.`, 'ok');
}
function tgMoveEv(e) { const G = tgG(); if (!G || G.busy || G.rhythm) return; const p = tgPt(e); if (!G.grabbed) { const sg = G.segs[G.si]; if (sg && sg.type === 'tap') { G.pos = p; tgCursor(G); } return; } tgMoveTo(G, p, performance.now(), false); }
function tgUpEv() {
  const G = tgG(); if (!G || !G.grabbed || G.busy || G.rhythm) return; G.grabbed = false; const sg = G.segs[G.si]; if (!sg || sg.type === 'tap') return;
  if (G.retry) { tgEnd(G, 'drop'); return; }
  G.retry = true; if (sg.type === 'path') G.pos = tgPointAt(sg, G.s); tgCursor(G);
  trainLine(`${G.mode === 'lure' ? 'Treat' : 'Signal'} dropped! Grab it again where you let go (one retry).`, 'ok');
}
function tgMoveTo(G, p, now, kb) {
  const sg = G.segs[G.si]; if (!sg) return; const moved = tgDist(p, G.pos || p); G.pos = p;
  if (sg.type === 'path') {
    const nr = tgNearest(sg, p, G.s);
    if (nr.d <= G.tol) G.inside += moved; else G.outside += moved;
    if (nr.d <= G.tol * 1.6 && nr.s > G.s) G.s = nr.s;
    if (!kb) {
      G.samples.push({ x: p[0], y: p[1], t: now }); while (G.samples.length > 2 && now - G.samples[0].t > 200) G.samples.shift();
      const dt = now - G.samples[0].t; let L = 0; for (let i = 1; i < G.samples.length; i++) L += Math.hypot(G.samples[i].x - G.samples[i - 1].x, G.samples[i].y - G.samples[i - 1].y);
      const ga = now - (G.grabT || now), avg = ga >= 25 ? (G.s - (G.grabS || 0)) / ga : 0; // pointer events are coalesced per frame: also check the average since the grab
      if ((dt >= 45 && L / dt > TG_MAXV) || avg > TG_MAXV * 1.3) { if (PERS[D().key] === 'gentle' || G.mode === 'show') { if (!G.slowSaid) { G.slowSaid = true; trainLine('Easy! A little slower.', 'ok'); } } else { tgEnd(G, 'fast'); return; } }
    }
    tgLean(G, p); tgDrawProgress(G); tgCursor(G);
    if (G.s >= sg.len - 10) {
      if (!kb && G.grabT && (G.s - (G.grabS || 0)) / Math.max(1, now - G.grabT) > TG_MAXV && PERS[D().key] !== 'gentle' && G.mode !== 'show') { tgEnd(G, 'fast'); return; } // a flick faster than the dog can follow
      tgNextSeg(G);
    }
    return;
  }
  if (sg.type === 'hold' && tgDist(p, sg.at) > G.tol) { G.outside += moved; G.holdAt = now; }
  tgCursor(G);
}
function tgTap(G, sg, p) {
  G.pos = p; tgCursor(G);
  if (tgDist(p, sg.at) <= G.tol + 14) { G.inside += 30; G.taps++; SFX.pop(); renderDog('paw', 'right', true); TRN.timers.push(setTimeout(() => { if (tgG() === G && !G.busy) renderDog('idle', 'right', true); }, 260)); }
  else { G.outside += 30; SFX.nope(); }
  if (G.taps >= sg.n) { G.taps = 0; tgNextSeg(G); } else tgDraw(G);
}
function tgTick() {
  const G = tgG(); if (!G) return; const sg = G.segs[G.si]; if (!sg || sg.type !== 'hold' || G.busy) return;
  const now = performance.now(), on = G.grabbed && G.pos && tgDist(G.pos, sg.at) <= G.tol;
  if (!on) { G.holdAt = now; } const f = on ? clamp((now - G.holdAt) / sg.ms, 0, 1) : 0;
  const r = $('#tgRing'); if (r) r.setAttribute('stroke-dasharray', `${Math.round(f * 100)} 100`);
  if (f >= 1) { G.inside += 40; tgNextSeg(G); }
}
function tgNextSeg(G) {
  G.si++; G.s = 0; G.samples = [];
  if (G.si < G.segs.length) { const sg = G.segs[G.si]; G.holdAt = performance.now(); if (sg.type === 'tap') G.grabbed = false; tgDraw(G); return; }
  G.pi++;
  if (G.pi < G.parts.length) { // signature combo: the dog does this part, then the next track appears
    G.busy = true; const pn = G.parts[G.pi - 1]; tgLean(null); playPose(TPOSE[pn] || { pose: 'sit' }); fxText('♥', 470, 300);
    const t = $('#trTrack'); if (t) t.remove(); trainLine(`Part ${G.pi} of ${G.parts.length} done! Next: ${G.parts[G.pi]}.`, 'good');
    TRN.timers.push(setTimeout(() => { if (tgG() !== G) return; G.busy = false; tgLoadPart(G); }, 800)); return;
  }
  tgEnd(G, 'done');
}
function tgKey(e) {
  const G = tgG(); if (!G || e.key === 'Escape') return;
  const k = e.key, arrow = k.startsWith('Arrow'), act = k === ' ' || k === 'Enter';
  if (!arrow && !act) return; e.preventDefault(); e.stopImmediatePropagation(); if (G.busy) return;
  if (G.rhythm) { if (act && !e.repeat) tgSpeakTap(); return; }
  const sg = G.segs[G.si]; if (!sg) return;
  if (sg.type === 'path' && arrow) { G.grabbed = true; tgMoveTo(G, tgPointAt(sg, G.s + 14), performance.now(), true); return; }
  if (sg.type === 'tap' && !e.repeat) { tgTap(G, sg, sg.at); return; }
  if (sg.type === 'hold' && !G.grabbed) { G.grabbed = true; G.pos = sg.at.slice(); G.holdAt = performance.now(); tgCursor(G); }
}
function tgKeyUp(e) { const G = tgG(); if (G && (e.key === ' ' || e.key === 'Enter' || e.key.startsWith('Arrow'))) { e.preventDefault(); e.stopImmediatePropagation(); } }

/* ---------- Speak: rhythm mini-game ---------- */
function tgSpeakStart(G) {
  const d = D(), now = performance.now(), n = G.mode === 'show' ? 1 : 3, pers = PERS[d.key], mul = (pers === 'chatty' || pers === 'bold' ? 1.2 : 1) * (G.mode === 'show' && trickSt('Speak', d).shows >= 5 ? 1.3 : 1);
  G.rhythm = true; G.win = [120 * mul, 220 * mul]; G.beats = []; for (let i = 0; i < n; i++) G.beats.push(now + TG_BEAT * (2 + i)); G.hits = G.beats.map(() => null);
  trainLine(G.mode === 'show' ? `Tap Speak! when ${d.name}'s ears perk up.` : `Listen... 1, 2, then tap Speak! on each ear perk (${n} beats).`, '');
  tgBind(true); renderDog('idle', 'right', true);
  [0, 1].forEach((i) => TRN.timers.push(setTimeout(() => { if (tgG() !== G) return; SFX.click(); fxText(String(i + 1), 470, 290, '#86B3EA', 40); }, TG_BEAT * i)));
  G.beats.forEach((b) => TRN.timers.push(setTimeout(() => { if (tgG() !== G) return; const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-perk'); void fx.getBBox(); fx.classList.add('tk-perk'); } fxText('!', 500, 300, '#F2C744', 54); SFX.boop(880); }, b - now)));
  TRN.timers.push(setTimeout(() => { if (tgG() === G) tgSpeakEnd(G); }, G.beats[G.beats.length - 1] - now + 450));
}
function tgSpeakTap() {
  const G = tgG(); if (!G || !G.rhythm || G.busy) return; const now = performance.now();
  let bi = -1, be = 1e9; G.beats.forEach((b, i) => { const e = Math.abs(now - b); if (!G.hits[i] && e < 450 && e < be) { bi = i; be = e; } });
  if (bi < 0) { SFX.nope(); return; }
  const sc = be <= G.win[0] ? 1 : be <= G.win[1] ? 0.7 : 0; G.hits[bi] = { e: Math.round(be), sc };
  if (sc) { barkDog(D(), speakKind(D()), { player: true }); renderDog('speak', 'right', true); fxText(sc === 1 ? 'Great!' : 'Good', 470, 270, sc === 1 ? '#3E7A47' : '#8A6A2A', 34); TRN.timers.push(setTimeout(() => { if (tgG() === G) renderDog('idle', 'right', true); }, 350)); }
  else { SFX.nope(); fxText('?', 470, 290, '#86B3EA', 40); }
}
function tgSpeakEnd(G) { const acc = G.hits.reduce((a, h) => a + (h ? h.sc : 0), 0) / G.hits.length; G.inside = acc; G.outside = 1 - acc; tgEnd(G, 'done'); }

/* ---------- scoring ---------- */
function tgEnd(G, why) {
  if (tgG() !== G) return; clearInterval(G.ticker); tgBind(false); tgLean(null);
  const t = $('#trTrack'); if (t) t.remove();
  const acc = G.inside + G.outside > 0 ? G.inside / (G.inside + G.outside) : 0;
  const grade = why !== 'done' ? 'Missed' : acc >= 0.85 ? 'Great' : acc >= 0.6 ? 'Good' : 'Missed';
  G.result = { grade, acc: Math.round(acc * 100), why }; TRN.last = G.result; TRN.game = null;
  if (G.mode === 'show') { trainLine(grade === 'Missed' ? 'The signal got lost...' : `${grade}!`, grade === 'Missed' ? 'bad' : 'good'); showResult(G.n, grade !== 'Missed'); return; }
  tgApply(G, grade, acc, why);
}
function tgApply(G, grade, acc, why) {
  const d = D(), n = G.n, st = trickSt(n), pers = PERS[d.key];
  let gain = TG_GAIN[grade] * (pers === 'stubborn' ? 1.25 : 1) * (G.mode === 'hand' ? 1.3 : 1) * (owns('toys', 'Rubber Chicken') ? 1.25 : 1) * trainBoost(d); // v2: puppies learn x1.2
  const was = st.p; st.p = Math.min(1, st.p + gain); gain = st.p - was; markDirty();
  tgGrade(grade); TRN.held = true;
  if (grade !== 'Missed') {
    busy = true; playPose(trickPose(n)); if (G.mode === 'lure') treatFly(); else { SFX.boop(880); TRN.timers.push(setTimeout(() => fxText('♥', 520, 330), 300)); }
    addStat('happy', 2); if (grade === 'Great') barkDog(d, 'play', {});
    trainLine(`${grade}! ${G.result.acc}% on the ${G.rhythm ? 'beat' : 'track'}${G.mode === 'hand' ? ', hand signal x1.3' : ''}: +${Math.round(gain * 100)}%`, 'good');
    if (was < TG_FADE && st.p >= TG_FADE && st.p < 1 && n !== 'Speak') toast(`${d.name} gets it! Time to fade the lure: next time you trace a hand signal (x1.3 progress).`, 'gold');
    if (was < 1 && st.p >= 1) { SFX.fanfare(); const b = addBond(4); toast(`${d.name} learned ${tName(n)}! +${b} Bond. Try it in Show off.`, 'gold'); dailyCare('play'); }
  } else {
    busy = true; playPose(PICK(WRONG)); SFX.trombone();
    const line = why === 'fast' ? `Too fast! ${d.name} lost the scent.` : why === 'drop' ? `The treat fell twice. ${d.name} ate it anyway. No harm done.` : why === 'stop' ? 'Stopped. No harm done.' : PICK(TG_MISS).replace('{n}', d.name) + ` (${G.result.acc}% on the ${G.rhythm ? 'beat' : 'track'})`;
    trainLine(`Oops! ${line}`, 'bad');
  }
  TRN.timers.push(setTimeout(() => { busy = false; if (!TRN) return; TRN.held = false; endPose(); if (focusNow() < trainCost(d)) trainLine(`${d.name}'s brain is full after that one. Session over.`, 'bad'); renderTraining(); }, grade === 'Missed' ? 1300 : 1600));
  updateHUD(); renderTraining();
}
function tgGrade(grade) {
  const fx = $('#fx'); if (!fx) return; const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', 430); t.setAttribute('y', 250); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'tg-grade ' + grade.toLowerCase());
  t.textContent = grade === 'Missed' ? 'Oops' : grade + '!'; fx.appendChild(t); setTimeout(() => t.remove(), 1500);
}
function tgStop() { const G = tgG(); if (!G) return; if (G.mode === 'show') { tgAbort(); renderTraining(); return; } tgEnd(G, 'stop'); }
function tgAbort() { const G = tgG(); if (!G) return; clearInterval(G.ticker); tgBind(false); tgLean(null); const t = $('#trTrack'); if (t) t.remove(); TRN.game = null; }

/* ---------- test helper: the live track in client (screen) coordinates ---------- */
window.__pawTG = {
  get game() { const G = tgG(); return G ? { n: G.n, mode: G.mode, pi: G.pi, parts: G.parts.slice(), si: G.si, busy: !!G.busy, rhythm: !!G.rhythm, s: G.s, inside: G.inside, outside: G.outside, retry: G.retry } : null; },
  get last() { return TRN ? TRN.last || null : null; },
  track() {
    const G = tgG(), svg = tgSvg(); if (!G || G.rhythm || !svg || !G.segs.length) return null; const M = svg.getScreenCTM();
    const c = (q) => { const pt = svg.createSVGPoint(); pt.x = q[0]; pt.y = q[1]; const r = pt.matrixTransform(M); return [r.x, r.y]; };
    return { pi: G.pi, parts: G.parts.length, si: G.si, busy: !!G.busy, mode: G.mode, tol: G.tol * M.a, segs: G.segs.map((s) => (s.type === 'path' ? { type: 'path', pts: s.pts.map(c) } : { type: s.type, at: c(s.at), n: s.n, ms: s.ms })) };
  },
  beats() { const G = tgG(); return G && G.rhythm ? G.beats.map((b) => b - performance.now()) : null; },
  tap() { tgSpeakTap(); },
};
