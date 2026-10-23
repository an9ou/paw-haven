/* ======================= v2.15 AROUND TOWN: the deep, wide ground and the movement model (V215.md section 8, GROUND lane, tag gr, test hook __paw.gr) =======================
   Owner: the GROUND lane (with css/45_ground.css and the hook lines in 37_roam.js, 38_ball.js and the scene camera). grOn(place) lives in the core
   (00_core.js, next to mpOn): PawArt.FLOOR[place] exists, mpOn(), under the harness also prefs.grTest, never Tokyo, the Station or the Shelter.
   PawArt.FLOOR[name] = { w, back, front, kB, kF, poly: [[x, y]...], props: [{ id, base, box }], spots: [{ id, x, y, tags, act, path }] } (worlds A, C and G,
   drawn under o.v215). poly closes on its own; a prop's box [x, y, w, h] is a feet no-go box (null: a dog may stand on it); a spot's path is the line
   a dog follows through an obstacle. No grOn = the v2.10 roam code path byte for byte.

   The ground
     grFloor(place)       { w, back, front, kB, kF, poly, no, props, spots, x0, x1, area } (cached per FLOOR row), or null when !grOn(place)
     grScale(place, y)    the base depth scale at feet y: linear kB at the back line -> kF at the front, clamped. rmScale = RM_BASE x this (rmKd adds sizeK)
     grZone(place)        what rmZoneOf answers in a grOn place: { y0: back, y1: front, x0, x1 (the polygon's span), poly, W, gr }
     grIn(poly, x, y)     inside the polygon. grFree(x, y, allow): inside it and outside every hard box (8 units margin, the boxes in allow excepted)
   The scene: sceneArt (00_core.js) passes { v215: true } and places a grOn scene at its own width (1600 for the wide places). The floor props
   (<g data-fy data-prop> inside #floorG) move into #pack, wrapped in <g class="gr-prop" data-fy>, so grDepth sorts dogs and props by feet y.
   Paths (grPath): a 20-unit grid over the polygon minus the hard boxes (rmScan's live boxes plus the FLOOR.props boxes, tag 'floor'), A* with 8
     neighbours and no corner cutting, string-pulled, then a Catmull-Rom curve sampled every 12 units. One grid per place and box set (and a path cache);
     a walk whose way gets blocked re-plans, at most twice a second. o.via: points to pass on the way; o.act: { id, allow, path, lift, hide, hop } a
     spot act (the walk may enter the boxes in allow, follows path through the obstacle, lifts over a jump, hides in the tunnel, hops on a table).
   Gaits: stroll 120, trot 220, run 380 units a second (o.gait, o.run, o.speed), times 0.55 + 0.45 t of the depth (a far dog moves slower on screen),
     easing in and out. The facing flips only after 6 units of sideways travel and 250 ms since the last flip.
   Things to do (grAct, through rmPackAct for the pack dogs; the leader keeps the idle system's roam and ask): wander, sniff trail, zoomies (the zoomies
     face), follow, play pair, patrol, herd, rest, the place's spot acts (FLOOR.spots: drink, sit, sniff, rest, look, door, arch, trick, weave, jump,
     tyre, tunnel, table; water acts only through a handler in GR_ACTS, the pool's paddling belongs to ACTIVITIES), come to the front.
     Weighted by rmPers (energy, zoomies, follows, attention, spots, trait). Puppies under 6 months skip the weave, the jump and the tyre (young joints).
   Separation (grSep): a soft push between standing dogs closer than 90 x the depth scale, never into a box or off the floor, while roaming is free.
   Camera (wide places): the view window (1000 on desktop, the phone crop) follows the focus (the pack's centre with the leader counted twice, or a
     petted dog, grFocus) with a dead zone of 150 and a 0.8 s ease, the ends clamped. A drag looks around (6 px threshold, desktop and phones) and the
     camera then waits 2 s; a look chip tap waits 4 s. Ball play follows the ball, photo mode freezes the camera.
   Test hook: window.__paw.gr = { on, floor, path, cam, scale, sim(place, secs, o), allow, wide, focus, zone, depthOk, area, free, inside, props, game }.
   sim runs the roam with a fixed step and a seeded random (Math.random and performance.now are swapped for the run) and reports what it saw. */

const GR_K = { out: [0.5, 1.05], in: [0.7, 1.05] }; // V215.md 8.2
const GR_GAIT = { stroll: 120, trot: 220, run: 380 }; // units a second at the front line (8.3)
const GR_CELL = 20, GR_FOOT = 8, GR_STEP = 12, GR_SEP = 90, GR_DEAD = 150, GR_EASE = 0.8, GR_REPLAN = 500, GR_FLIP = [6, 250];
const GR_FLAT = ['pug', 'frenchie', 'shihtzu']; // flat-faced: no water acts of their own (the pool's step only, ACTIVITIES)
const GR_JOINTS = ['weave', 'jump', 'tyre']; // not for puppies under 6 months (the puppy course: tunnel, table, a bar on the ground)
const GR_ACTS = {}; // other lanes add roaming acts by name: GR_ACTS[act] = { w(d, spot) -> weight, steps(d, spot) -> rmQueue steps }
const GR = { fl: {}, grid: null, props: [], game: [], svg: null, hold: 0, focus: null, focusUntil: 0, raf: 0, last: 0, sim: null, vw: 0, vh: 0, drag: false };

/* ---------------- the floor ---------------- */
function grArea(P) { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(a / 2); }
function grFloor(place) {
  const k = place === undefined ? (S && S.place) : place; if (!grOn(k)) return null;
  const F = PawArt.FLOOR[k], indoor = !!(PLACES[k] && PLACES[k].out === false), c = GR.fl[k]; if (c && c.src === F && c.indoor === indoor) return c.v;
  const kk = indoor ? GR_K.in : GR_K.out, w = +F.w || 1000;
  let poly = Array.isArray(F.poly) ? F.poly.filter((p) => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])).map((p) => [+p[0], +p[1]]) : [];
  if (poly.length < 3) { const b = +F.back || 400, fr = +F.front || 590; poly = [[24, b], [w - 24, b], [w - 6, fr], [6, fr]]; } // a row without a polygon: its back to front band
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), props = (Array.isArray(F.props) ? F.props : []).filter((p) => p && p.id != null);
  const v = { w, back: isFinite(F.back) ? +F.back : Math.min(...ys), front: isFinite(F.front) ? +F.front : Math.max(...ys), kB: typeof F.kB === 'number' ? F.kB : kk[0], kF: typeof F.kF === 'number' ? F.kF : kk[1],
    poly, no: props.filter((p) => Array.isArray(p.box)).map((p) => p.box.slice(0, 4)), props, spots: (Array.isArray(F.spots) ? F.spots : []).filter((s) => s && isFinite(s.x) && isFinite(s.y)),
    x0: Math.max(0, Math.min(...xs)), x1: Math.min(w, Math.max(...xs)), area: grArea(poly) };
  GR.fl[k] = { src: F, indoor, v }; return v;
}
function grScale(place, y) {
  const f = grFloor(place); if (!f || !(f.front > f.back)) return null;
  const t = clamp(((y == null ? f.front : y) - f.back) / (f.front - f.back), 0, 1); return f.kB + (f.kF - f.kB) * t;
}
const grDepthT = (f, y) => clamp((y - f.back) / Math.max(1, f.front - f.back), 0, 1); // 0 at the back line, 1 at the front
function grZone(place) { const f = grFloor(place); return { y0: f.back, y1: f.front, x0: f.x0, x1: f.x1, poly: f.poly, W: f.w, gr: true }; }
const grW = () => { const f = grFloor(); return f ? f.w : 1000; }; // the world width of the scene here
function grWide(place) { const f = grFloor(place); return !!f && f.w > 1000; }
function grIn(P, x, y) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// the nearest point inside the polygon (2 units in from its edge): ball play and the Dog Card visitors keep their feet on the floor
function grInside(P, x, y) {
  if (grIn(P, x, y)) return [x, y]; let best = null, bd = 1e12; const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[j], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L, 0, 1), px = a[0] + dx * t, py = a[1] + dy * t, d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = [px, py]; } }
  const l = Math.hypot(cx - best[0], cy - best[1]) || 1; return [best[0] + (cx - best[0]) / l * 2, best[1] + (cy - best[1]) / l * 2];
}
// the FLOOR.props boxes as no-go boxes for rmScan / rmStaticNo: [x, y, w, h, 'floor', prop id]
function grNo(place) { const f = grFloor(place); return f ? f.props.filter((p) => Array.isArray(p.box)).map((p) => p.box.slice(0, 4).concat('floor', String(p.id))) : []; }
// a hard box for the feet (rmHard's rule: 8 units round it), the boxes whose prop id is in al excepted (a spot act through its own obstacle)
function grHard(x, y, al) { return rmBoxes().some((b) => b[4] !== 'dctag' && !(al && b[5] != null && al.includes(b[5])) && x > b[0] - GR_FOOT && x < b[0] + b[2] + GR_FOOT && y > b[1] - GR_FOOT && y < b[1] + b[3] + GR_FOOT); }
function grFree(x, y, al) { const f = grFloor(); return !!f && grIn(f.poly, x, y) && !grHard(x, y, al); }
// spot kinds at x, y (rmTags in a grOn place): the v2.10 kinds by where on the floor, plus the tags of the FLOOR spots close by
function grTags(x, y) {
  const f = grFloor(), sp = f.x1 - f.x0, rx = (x - f.x0) / Math.max(1, sp), t = [];
  if (rx >= 0.3 && rx <= 0.7) t.push('open'); if (rx < 0.18 || rx > 0.82 || y <= f.back + 26) t.push('edge'); if (y >= f.front - 34) t.push('front'); if (y <= f.back + 44) t.push('shade');
  if (rx < 0.11 || rx > 0.89) t.push('gate');
  const bowls = f.spots.filter((s) => (s.tags || []).includes('bowl')); if (bowls.length ? bowls.some((s) => Math.hypot(x - s.x, y - s.y) < 200) : Math.hypot(x - 250, y - 507) < 210) t.push('bowl');
  if (GRASSY.includes(S.place) && y < f.front - 20) t.push('dig'); if (outdoorsNow() && !isNight() && rx >= 0.26 && rx <= 0.74) t.push('sun');
  f.spots.forEach((s) => { if (Math.hypot(x - s.x, (y - s.y) * 1.6) < 90) (s.tags || []).forEach((g) => { if (g !== 'water' && !t.includes(g)) t.push(g); }); });
  return t;
}
// where the leader stands in a fresh scene: its v2.9 spot (430, 500) when that is free, else the nearest free grid point to it
function grHome() { if (grFree(430, 500)) return [430, 500]; return grSnap(430, 500) || [430, 500]; }

/* ---------------- paths ---------------- */
function grGrid() {
  const f = grFloor(); if (!f) return null; const B = rmBoxes();
  const key = S.place + '|' + f.w + '|' + f.area + '|' + B.filter((b) => b[4] !== 'dctag').map((b) => b.slice(0, 4).map(Math.round).join(',')).join(';');
  if (GR.grid && GR.grid.key === key) return GR.grid;
  const x0 = Math.ceil(f.x0 / GR_CELL) * GR_CELL, y0 = Math.ceil(f.back / GR_CELL) * GR_CELL, nx = Math.max(1, Math.floor((f.x1 - x0) / GR_CELL) + 1), ny = Math.max(1, Math.floor((f.front - y0) / GR_CELL) + 1);
  const ok = new Uint8Array(nx * ny); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * GR_CELL, y = y0 + j * GR_CELL; ok[j * nx + i] = grIn(f.poly, x, y) && !rmHard(x, y) ? 1 : 0; }
  GR.grid = { key, x0, y0, nx, ny, ok, paths: new Map() }; return GR.grid;
}
const grCellXY = (g, i) => [g.x0 + (i % g.nx) * GR_CELL, g.y0 + Math.floor(i / g.nx) * GR_CELL];
function grNearCell(g, x, y) { let b = -1, bd = 1e12; for (let i = 0; i < g.ok.length; i++) { if (!g.ok[i]) continue; const [cx, cy] = grCellXY(g, i), v = (cx - x) ** 2 + (cy - y) ** 2; if (v < bd) { bd = v; b = i; } } return b; }
function grSnap(x, y) { const g = grGrid(); if (!g) return null; const i = grNearCell(g, x, y); return i < 0 ? null : grCellXY(g, i); } // the nearest free grid point
// A* over the grid: 8 neighbours, a diagonal only when both of its sides are free (no corner cutting), octile distance
function grAstar(g, s, e) {
  const ck = s + '>' + e; if (g.paths.has(ck)) return g.paths.get(ck);
  const N = g.ok.length, nx = g.nx, G = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), shut = new Uint8Array(N), ex = e % nx, ey = Math.floor(e / nx);
  const h = (i) => { const dx = Math.abs(i % nx - ex), dy = Math.abs(Math.floor(i / nx) - ey); return (dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy)) * GR_CELL; };
  const heap = [], F = new Float64Array(N); const push = (i) => { heap.push(i); let c = heap.length - 1; while (c) { const p = (c - 1) >> 1; if (F[heap[p]] <= F[heap[c]]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && F[heap[l]] < F[heap[m]]) m = l; if (r < heap.length && F[heap[r]] < F[heap[m]]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  G[s] = 0; F[s] = h(s); push(s); let found = false, near = s; // near: the reached cell closest to e (no way there: a walk to the nearest reachable point)
  while (heap.length) {
    const u = pop(); if (shut[u]) continue; if (u === e) { found = true; break; } shut[u] = 1; if (h(u) < h(near)) near = u; const ui = u % nx, uj = Math.floor(u / nx);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const vi = ui + di, vj = uj + dj; if (vi < 0 || vi >= nx || vj < 0 || vj >= g.ny) continue; const v = vj * nx + vi; if (!g.ok[v] || shut[v]) continue;
      if (di && dj && (!g.ok[uj * nx + vi] || !g.ok[vj * nx + ui])) continue;
      const nd = G[u] + (di && dj ? Math.SQRT2 : 1) * GR_CELL; if (nd < G[v]) { G[v] = nd; from[v] = u; F[v] = nd + h(v); push(v); }
    }
  }
  const end = found ? e : near, out = []; for (let i = end; i >= 0; i = from[i]) { out.unshift(i); if (i === s) break; } if (!found) out.part = true;
  if (g.paths.size > 200) g.paths.clear(); g.paths.set(ck, out); return out;
}
// the straight line from a to b keeps the feet on the floor and out of the boxes (the first 16 units may still step off a box, as in v2.10)
function grLineOk(a, b, al) {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6)), off = !grFree(a[0], a[1], al); // only a dog standing in a box (or its margin) gets the 16 units to step off it
  for (let i = 1; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n; if (off && Math.hypot(x - a[0], y - a[1]) < 16) continue; if (!grFree(x, y, al)) return false; }
  return true;
}
// one leg: the corner points from a to b (a left out, b last). No way there (b in a pocket the boxes close off): the leg ends at the
// reachable point nearest to b, and out.part is set (grPath stops there)
function grLeg(a, b, al) {
  if (grLineOk(a, b, al)) return [b];
  const g = grGrid(), s = grNearCell(g, a[0], a[1]), e = grNearCell(g, b[0], b[1]); if (s < 0 || e < 0) return Object.assign([], { part: true });
  const cells = grAstar(g, s, e), part = !!cells.part;
  const pts = [a].concat(cells.map((i) => grCellXY(g, i)), part ? [] : [b]), out = []; if (pts.length < 2) return Object.assign([], { part: true });
  for (let i = 0; i < pts.length - 1;) { let j = pts.length - 1; while (j > i + 1 && !grLineOk(pts[i], pts[j], al)) j--; out.push(pts[j]); i = j; }
  if (part) out.part = true; return out;
}
// a Catmull-Rom curve through the corner points, sampled about every 12 units; the straight corners when the curve would cut a box or leave the floor
function grSpline(C, al) {
  const dense = () => { const o = []; for (let i = 1; i < C.length; i++) { const a = C[i - 1], b = C[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / GR_STEP)); for (let k = 1; k <= n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return o; };
  if (C.length < 3) return dense();
  const o = []; for (let i = 0; i < C.length - 1; i++) {
    const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(C.length - 1, i + 2)], n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / GR_STEP));
    for (let k = 1; k <= n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3); o.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); }
  }
  const s0 = C[0], off = !grFree(s0[0], s0[1], al); return o.every((p) => (off && Math.hypot(p[0] - s0[0], p[1] - s0[1]) < 16) || grFree(p[0], p[1], al)) ? o : dense();
}
function grAllow(o) { const a = o && o.act && o.act.allow; return Array.isArray(a) ? a.map(String) : a != null ? [String(a)] : null; }
// a smooth path for dog d from where it stands to x, y: [[x, y], ...] samples, the last one x, y itself
function grPath(d, x, y, o) {
  o = o || {}; if (!grFloor() || !S) return [[x, y]]; const r = d ? rmSt(d) : { x, y }, al = grAllow(o);
  let cur = [r.x, r.y], cut = false; const C = [cur.slice()];
  const add = (b) => { if (cut || Math.hypot(b[0] - cur[0], b[1] - cur[1]) < 1) return; const l = grLeg(cur, b, al); l.forEach((p) => C.push(p)); if (l.part) { cut = true; cur = C[C.length - 1]; } else cur = b; };
  const ap = o.act && Array.isArray(o.act.path) && o.act.path.length > 1 ? o.act.path : null;
  if (ap) { add(ap[0]); if (!cut) ap.slice(1).forEach((p) => { C.push([p[0], p[1]]); cur = [p[0], p[1]]; }); if (Math.hypot(x - cur[0], y - cur[1]) > 1) add([x, y]); } // through the obstacle as drawn
  else { (o.via || []).filter((p) => p && grFree(p[0], p[1], al)).forEach((p) => add([p[0], p[1]])); add([x, y]); }
  if (C.length < 2) return cut ? [[r.x, r.y]] : [[x, y]];
  const out = grSpline(C, al); out[out.length - 1] = cut ? C[C.length - 1].slice() : [x, y]; return out; // cut short: it ends where it can get to
}
// one or two points to curve through on the way from a to b (wander: "a curving walk through 1-2 random points")
function grVia(a, b, n) {
  const f = grFloor(), L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 150) return []; const out = [];
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 1), mx = a[0] + (b[0] - a[0]) * t, my = a[1] + (b[1] - a[1]) * t;
    for (let i = 0; i < 10; i++) { const x = mx + (Math.random() * 2 - 1) * Math.min(160, L * 0.4), y = clamp(my + (Math.random() * 2 - 1) * 80, f.back + 8, f.front - 8); if (grFree(x, y)) { out.push([x, y]); break; } }
  }
  return out;
}

/* ---------------- walking (rmTo in a grOn place, rmFrame's gr legs) ---------------- */
function grWalk(d, x, y, o) {
  const r = rmSt(d), now = performance.now(), f = grFloor(), al = grAllow(o);
  const P = [[r.x, r.y]].concat(grPath(d, x, y, o)), cum = [0]; [x, y] = P[P.length - 1]; // the path's own end (short of x, y when the boxes close it off) for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const gait = o.gait || (o.run ? 'run' : 'stroll'), v = o.speed || (GR_GAIT[gait] || GR_GAIT.stroll) / Math.max(0.05, IDLE.speed), L = cum[cum.length - 1];
  r.k = o.k != null ? o.k : null; r.grPlan = now;
  r.tw = { gr: true, P, cum, L, s: 0, i: 0, v, last: now, t0: now, x0: r.x, y0: r.y, x1: x, y1: y, end: [x, y], k1: o.k != null ? o.k : null, dur: (L / Math.max(1, v * (0.55 + 0.45 * grDepthT(f, y)))) * 1000, o, al, key: (grGrid() || {}).key };
  const ahead = P.find((p) => Math.abs(p[0] - r.x) > GR_FLIP[0]); // the first step sets the facing (a new walk)
  if (ahead && now - (r.gfAt || 0) > GR_FLIP[1]) { const fc = ahead[0] < r.x ? 'left' : 'right'; if (fc !== r.face) { r.face = fc; r.gfAt = now; } }
  r.gfAcc = 0;
  if (d === D() && rmScene() && L > 3) renderDog('walk', r.face, true); else if (d !== D()) rmPaint(d);
  if (L < 0.5) rmFrame(now); else rmLoop();
}
// one frame of a gr walk: true while it goes on
function grAdvance(d, r, w, t) {
  const f = grFloor(), dt = clamp((t - w.last) / 1000, 0, 0.1); w.last = t;
  if (f && t - (r.grPlan || 0) > GR_REPLAN) { // at most twice a second: did the boxes change (a decoration moved, a prop came)? Then is the way ahead still free?
    r.grPlan = t; const g = grGrid();
    if (g && g.key !== w.key) { w.key = g.key; if (w.P.slice(w.i + 1, w.i + 8).some((p) => !grFree(p[0], p[1], w.al))) { r.tw = null; grWalk(d, w.x1, w.y1, w.o); return true; } }
  }
  const depth = f ? 0.55 + 0.45 * grDepthT(f, r.y) : 1, ein = clamp((t - w.t0) / 300, 0.3, 1), eout = clamp((w.L - w.s) / 30, 0.35, 1);
  w.s = Math.min(w.L, w.s + w.v * depth * Math.min(ein, eout) * dt);
  while (w.i < w.cum.length - 2 && w.cum[w.i + 1] < w.s) w.i++;
  const a = w.P[w.i], b = w.P[w.i + 1] || a, seg = (w.cum[w.i + 1] || 0) - w.cum[w.i], u = seg > 0 ? clamp((w.s - w.cum[w.i]) / seg, 0, 1) : 1;
  const nx = a[0] + (b[0] - a[0]) * u, ny = a[1] + (b[1] - a[1]) * u, dx = nx - r.x;
  // the facing: only after 6 units of sideways travel against it and 250 ms since the last flip
  if ((r.face === 'left' ? dx > 0 : dx < 0)) r.gfAcc = (r.gfAcc || 0) + Math.abs(dx); else if (Math.abs(dx) > 0.01) r.gfAcc = 0;
  if (r.gfAcc > GR_FLIP[0] && t - (r.gfAt || 0) > GR_FLIP[1]) { r.face = r.face === 'left' ? 'right' : 'left'; r.gfAt = t; r.gfAcc = 0; if (d === D() && rmScene() && !GR.sim) renderDog('walk', r.face, true); }
  r.x = nx; r.y = ny;
  const A = w.o.act; if (A) grActFx(d, r, A, w);
  if (w.s >= w.L - 0.01) {
    r.x = w.x1; r.y = w.y1; r.tw = null; r.k = w.k1; if (A && !A.hop) r.lift = 0; if (A && A.hop < 0) r.lift = 0; grHide(d, false);
    if (w.o.anchor) { r.hx = r.x; r.hy = r.y; } if (w.o.face) r.face = w.o.face; rmPaint(d); rmArrive(d, w.o); return false;
  }
  rmPaint(d); return true;
}
// an act's look on the way: lifted over the jump bar or through the tyre, hidden inside the tunnel, a hop up onto (or down off) the table
function grActFx(d, r, A, w) {
  const k = rmK(r);
  if (A.lift) { const [cx, h, half] = A.lift, q = Math.abs(r.x - cx); r.lift = q < half ? Math.sin((1 - q / half) * Math.PI / 2) * h * k : 0; }
  if (A.hop) { const u = w.L > 0 ? w.s / w.L : 1; r.lift = (A.hop > 0 ? u : 1 - u) * 20 * k; }
  if (A.hide) grHide(d, r.x > A.hide[0] && r.x < A.hide[1]);
}
function grHide(d, on) { const r = rmSt(d); if (!!r.grHid === !!on) return; r.grHid = !!on; const el = rmEl(d); if (el) el.classList.toggle('gr-hide', !!on); }

/* ---------------- things to do (V215.md 8.3 table) ---------------- */
const grLine = (k) => { // the new roaming lines (spoken by the dog: a speech bubble now and then)
  if (k === 'zoomies') return PICK([tt('ground.zoomies_1', 'Zoom! Zoom! Zoom!'), tt('ground.zoomies_2', 'Cannot stop. Will not stop.'), tt('ground.zoomies_3', 'Fastest paws in town!'), tt('ground.zoomies_4', 'Wheee! One big loop!')]);
  if (k === 'herd') return PICK([tt('ground.herd_1', 'Everybody in a nice group, please.'), tt('ground.herd_2', 'Nobody wanders off on my watch.'), tt('ground.herd_3', 'All present. Good flock.'), tt('ground.herd_4', 'Round and round we go.')]);
  return PICK([tt('ground.play_1', 'Chase me! Chase me!'), tt('ground.play_2', 'You are it!'), tt('ground.play_3', 'Play bow. That means game on.'), tt('ground.play_4', 'Again! One more lap!')]);
};
const grSayMaybe = (k, p) => (Math.random() < (p == null ? 0.3 : p) ? grLine(k) : null);
const grPropOf = (f, s) => f.props.find((p) => String(p.id) === String(s.id) && Array.isArray(p.box)) || f.props.find((p) => Array.isArray(p.box) && s.x >= p.box[0] && s.x <= p.box[0] + p.box[2] && s.y >= p.box[1] && s.y <= p.box[1] + p.box[3]);
const grBusySpot = (d, s) => rmDogs().some((o) => o !== d && rmSt(o).grSpot === s.id);
// another dog stands (or is headed) right there: a spot act or a rest picks something else
const grCrowd = (d, p) => !!p && rmDogs().some((o) => { if (o === d) return false; const q = rmDest(o), k = grScale(S.place, q[1]) || 1; return Math.abs(q[0] - p[0]) < 80 * k && Math.abs(q[1] - p[1]) < 30; });
// a spot's weight for dog d (0: not for this dog)
function grSpotW(d, s, p) {
  const act = s.act || '', tags = s.tags || [], pup = ageMonths(d) < 6, cu = GR_ACTS[act];
  if (cu) return typeof cu.w === 'function' ? Math.max(0, +cu.w(d, s) || 0) : 0;
  if (tags.includes('water') || ['paddle', 'swim', 'ramp'].includes(act)) return 0; // the pool belongs to ACTIVITIES (paddling once a day, the life vest)
  if (pup && GR_JOINTS.includes(act)) return 0;
  if (grBusySpot(d, s)) return 0;
  let v = 0.5; (p.spots || []).forEach((k) => { if (tags.includes(k)) v *= 2.5; });
  const tr = p.trait;
  if (act === 'jump' || act === 'tyre') v *= (tr === 'ball' || tr === 'burst' || p.ball > 1.05 ? 3 : 1) * (0.4 + p.energy);
  if (act === 'weave') v *= (tr === 'herd' || tr === 'show' || p.energy > 0.75 ? 2.2 : 1);
  if (act === 'tunnel') v *= (tr === 'sniff' || tr === 'needy' || tr === 'cheeky' ? 3 : 1);
  if (act === 'table' || act === 'trick') v *= (tr === 'polite' || tr === 'show' || tr === 'spin' ? 2.2 : 1);
  if (act === 'drink') v *= tr === 'beg' ? 3 : 1;
  if (act === 'rest') v *= (tr === 'lazy' ? 3 : 1) * (1.6 - p.energy);
  if (act === 'sniff') v *= tr === 'sniff' ? 3 : 1;
  if (act === 'door' || act === 'arch' || act === 'look') v *= 0.5;
  const r = rmSt(d); if (Math.hypot(s.x - r.x, s.y - r.y) > 900) v *= 0.5;
  return v;
}
// the steps of a spot act
function grSpotSteps(d, s) {
  const f = grFloor(), r = rmSt(d), act = s.act || '', id = String(s.id), cu = GR_ACTS[act], sec = (a, b) => RINT(a, b);
  if (cu && typeof cu.steps === 'function') return cu.steps(d, s);
  const pr = grPropOf(f, s), al = pr ? [String(pr.id)] : null, mine = { fn: () => { r.grSpot = s.id; }, ms: 0 }, free = { fn: () => { r.grSpot = null; r.grIn = null; r.lift = 0; grHide(d, false); rmPaint(d); }, ms: 0 };
  const at = (x, y) => (grFree(x, y) ? [x, y] : grSnap(x, y));
  if (Array.isArray(s.path) && s.path.length > 1 && ['weave', 'tunnel', 'jump', 'tyre'].includes(act)) {
    const st = at(s.path[0][0], s.path[0][1]), end = s.path[s.path.length - 1], out = at(end[0], end[1]); if (!st || !out || grCrowd(d, st) || grCrowd(d, out)) return null;
    const b = pr ? pr.box : null, A = { id, allow: al, path: [st].concat(s.path.slice(1, -1), [out]) };
    if (b && (act === 'jump' || act === 'tyre')) A.lift = [b[0] + b[2] / 2, act === 'jump' ? 70 : 42, Math.max(50, b[2] / 2 + 40)];
    if (b && act === 'tunnel') A.hide = [b[0] + 16, b[0] + b[2] - 16];
    return [mine, { to: st, gait: 'trot' }, { fn: () => { r.grIn = id; }, ms: 0 }, { to: out, gait: act === 'jump' || act === 'tyre' ? 'run' : 'trot', act: A }, free, { pose: 'happy', ms: 900 }, { pose: 'idle', ms: sec(1500, 3000) }];
  }
  if (act === 'table' && pr && !grFree(s.x, s.y)) { // up on the pause table: a little hop, a sit, then down again
    const e = grSnap(s.x, s.y + pr.box[3] + 14); if (!e) return null; const A = { id, allow: al, hop: 1 }, B = { id, allow: al, hop: -1 };
    return [mine, { to: e, gait: 'trot' }, { fn: () => { r.grIn = id; }, ms: 0 }, { to: [s.x, s.y], act: A }, { pose: 'sit', ms: 2400 }, { to: e, act: B }, free, { pose: 'happy', ms: 700 }, { pose: 'idle', ms: sec(1200, 2400) }];
  }
  const to = at(s.x, s.y); if (!to || grCrowd(d, to)) return null; const face = pr ? (pr.box[0] + pr.box[2] / 2 < to[0] ? 'left' : 'right') : null;
  const pose = { drink: ['eat', 2200], sit: ['sit', sec(3000, 6000)], sniff: ['sniff', 1800], rest: ['down', 1500], look: ['idle', sec(2500, 4000)], door: ['sit', 2500], arch: ['sit', 2400], trick: ['happy', 1200] }[act] || ['idle', 2000];
  const steps = [mine, { to }, { pose: pose[0], fb: pose[0] === 'sniff' || pose[0] === 'eat' ? 'sit' : 'idle', face: face || undefined, ms: pose[1] }];
  if (act === 'rest') steps.push({ pose: rmPers(d).energy < 0.6 ? 'sleep' : 'down', ms: sec(8000, 20000) }, { pose: 'idle', ms: 1000 });
  if (act === 'trick') steps.push({ pose: 'bow', fb: 'sit', ms: 1200 }, { pose: 'happy', ms: 900 });
  if (act === 'arch') steps.push({ pose: 'happy', ms: 800 });
  if (act === 'sniff') steps.push({ pose: 'idle', ms: 1000 });
  steps.push(free, { pose: 'idle', ms: sec(1200, 2600) }); return steps;
}
// another pack dog that is free to play (awake, not walking, not busy), or null
function grMate(d) { return rmDogs().find((o) => o !== d && o !== D() && !o.sleeping && !rmSt(o).tw && !rmSt(o).q && !rmSt(o).fix && rmPers(o).energy > 0.45 && Math.hypot(rmSt(o).x - rmSt(d).x, rmSt(o).y - rmSt(d).y) < 600) || null; }
// points on a loop round cx, cy (free ones only), starting at angle a0
function grLoop(cx, cy, rx, ry, n, a0, eight) { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI * 2, x = cx + Math.sin(a) * rx, y = cy + (eight ? Math.sin(2 * a) : Math.cos(a)) * ry; if (grFree(x, y)) out.push([x, y]); } return out; }
function grBehind(d, o) { const ro = rmSt(o), [ox, oy] = rmDest(o), k = grScale(S.place, oy) || 1, sx = (ro.face === 'left' ? 1 : -1) * 120 * k; return grSnap(ox + sx, oy + RINT(-14, 14)); }
// a pack dog's next thing to do in a grOn place (rmPackAct; the sim also drives the leader): true when it set off
function grAct(d) {
  const f = grFloor(); if (!f || !d || d.sleeping) return false; const r = rmSt(d); if (r.fix || r.tw || r.q) return false;
  const p = rmPers(d), now = performance.now(), out = outdoorsNow(), os = rmDogs().filter((o) => o !== d), lead = d === D();
  if (Math.random() > 0.3 + 0.55 * p.energy) return false; // lazy dogs mostly change pose where they are
  const sp = f.spots.map((s) => [s, grSpotW(d, s, p)]).filter((x) => x[1] > 0), spW = sp.reduce((a, x) => a + x[1], 0), mate = lead ? null : grMate(d);
  const w = { wander: 2, sniff: p.trait === 'sniff' ? 2.5 : out ? 0.6 : 0.2, dig: p.trait === 'needy' && GRASSY.includes(S.place) ? 1.2 : 0, zoomies: p.zoomies * (out ? 2.2 : 0.6), follow: os.length ? p.follows * 1.6 : 0,
    play: mate && p.energy > 0.45 ? 1.3 * p.energy : 0, patrol: p.trait === 'guard' ? 2 : p.trait === 'aloof' ? 1.2 : p.trait === 'loyal' ? 1 : 0, herd: p.trait === 'herd' && os.length >= 2 ? 2 : 0,
    rest: (1 - p.energy) * 1.4 + (p.trait === 'lazy' ? 1 : 0), spot: Math.min(4, spW), front: p.trait === 'follow' || p.trait === 'polite' ? 1 : p.trait === 'show' ? 1.8 : 0.3 * p.attention, spin: p.trait === 'spin' ? 2.2 : 0, beg: p.trait === 'beg' ? 1.2 : 0 };
  if (p.trait === 'burst' && packPose[d.id] === 'sleep') w.zoomies += 3; // the greyhound: a nap, then a burst
  let t = Math.random() * Object.values(w).reduce((a, b) => a + b, 0), kind = 'wander'; for (const k in w) { t -= w[k]; if (t <= 0) { kind = k; break; } }
  const sec = (a, b) => RINT(a, b), go = (o) => rmPick(d, o || {}), zc = (f.back + f.front) / 2, span = f.x1 - f.x0;
  let steps = null, to = null;
  if (kind === 'spot' && sp.length) {
    let q = Math.random() * spW, s = sp[0][0]; for (const x of sp) { q -= x[1]; if (q <= 0) { s = x[0]; break; } } steps = grSpotSteps(d, s);
  } else if (kind === 'zoomies') { // a figure eight over open ground at a run, with the zoomies face
    const rx = Math.min(380, span * 0.28), ry = (f.front - f.back) * 0.3, cx = clamp(r.x, f.x0 + rx + 30, f.x1 - rx - 30), pts = grLoop(cx, zc + 6, rx, ry, 24, Math.random() * Math.PI * 2, true);
    if (pts.length >= 10) { const back = grFree(r.x, r.y) ? [r.x, r.y] : grSnap(r.x, r.y); steps = [{ fn: () => { if (exOn()) exShow(d, 'zoomies', 2600, { prio: 2, ev: 'zoomies' }); }, say: grSayMaybe('zoomies'), ms: 0 }, { to: pts[pts.length - 1], via: pts.slice(0, -1), run: true }, { pose: 'happy', ms: 900 }]; if (back) steps.push({ to: back }); steps.push({ pose: p.trait === 'burst' ? 'down' : 'idle', ms: sec(2000, 4000) }); }
  } else if (kind === 'follow') { // trots behind another dog for a few seconds
    const o = os.find((x) => rmSt(x).tw) || PICK(os); if (o) { steps = []; for (let i = 0; i < 3; i++) steps.push({ fn: () => { const q = grBehind(d, o); if (q && r.q) r.q.unshift({ to: q, gait: 'trot' }); }, ms: 0 }); steps.push({ fn: () => { r.face = rmSt(o).x < r.x ? 'left' : 'right'; }, pose: 'sit', ms: sec(1800, 3600) }); }
  } else if (kind === 'play' && mate) { // two dogs chase round a circle, a play bow, happy
    const m = rmSt(mate), cx = clamp((r.x + m.x) / 2, f.x0 + 160, f.x1 - 160), cy = clamp((r.y + m.y) / 2, f.back + 60, f.front - 50), k = grScale(S.place, cy) || 1, a0 = Math.random() * Math.PI * 2;
    const A = grLoop(cx, cy, 130 * k + 40, 46, 12, a0), B = grLoop(cx, cy, 130 * k + 40, 46, 12, a0 + Math.PI);
    if (A.length >= 7 && B.length >= 7) {
      const tail = (dd) => [{ pose: 'bow', fb: 'sit', face: rmSt(dd).x < cx ? 'right' : 'left', ms: 1200 }, { pose: 'happy', ms: 900 }, { pose: 'idle', ms: sec(1500, 3000) }, { fn: () => { packNext[dd.id] = performance.now() + RINT(3000, 7000) * IDLE.speed; } }];
      steps = [{ say: grSayMaybe('play'), ms: 0 }, { to: A[A.length - 1], via: A.slice(0, -1), run: true }].concat(tail(d).slice(0, 3));
      packNext[mate.id] = now + 60000; rmQueue(mate, [{ to: B[B.length - 1], via: B.slice(0, -1), run: true }].concat(tail(mate)));
    }
  } else if (kind === 'patrol') { // walks the edge: along the back fence or a side, looks out
    const L = Math.random() < 0.5, ys = f.back + 16, xA = L ? f.x0 + 50 : f.x1 - 50, p1 = grSnap(xA, ys + RINT(0, 60)), p2 = grSnap(xA + (L ? 1 : -1) * RINT(140, 300), ys), fc = L ? 'left' : 'right';
    if (p1 && p2) steps = [{ to: p1 }, { pose: 'idle', face: fc, ms: 1200 }, { to: p2 }, { pose: 'idle', face: fc, ms: sec(3000, 6000), bark: Math.random() < 0.4 ? 'alert' : null }];
  } else if (kind === 'herd') { // circles the pack's centre
    const cx = os.reduce((a, b) => a + rmSt(b).x, 0) / os.length, cy = os.reduce((a, b) => a + rmSt(b).y, 0) / os.length, k = grScale(S.place, cy) || 1, pts = grLoop(clamp(cx, f.x0 + 120, f.x1 - 120), clamp(cy, f.back + 40, f.front - 30), 170 * k + 40, 60, 10, Math.random() * Math.PI * 2);
    if (pts.length >= 6) steps = [{ to: pts[pts.length - 1], via: pts.slice(0, -1), run: true }, { pose: 'bow', fb: 'sit', ms: 1400, bark: Math.random() < 0.3 ? 'alert' : null, say: grSayMaybe('herd') }, { pose: 'idle', ms: sec(2000, 4000) }];
  } else if (kind === 'sniff' || kind === 'dig') { // a zig-zag with sniff stops
    to = go({ like: kind === 'dig' ? ['dig'] : ['edge', 'dig', 'shade'] });
    if (to) {
      const zz = [], dx = to[0] - r.x, dy = to[1] - r.y, L = Math.hypot(dx, dy) || 1; for (const u of [0.33, 0.66]) { const s = (zz.length % 2 ? -1 : 1) * RINT(18, 30), q = grSnap(r.x + dx * u - (dy / L) * s, r.y + dy * u + (dx / L) * s); if (q) zz.push(q); }
      steps = []; zz.forEach((q) => steps.push({ to: q }, { pose: 'sniff', fb: 'eat', ms: 1100 })); steps.push({ to }, { pose: kind === 'dig' ? 'dig' : 'sniff', fb: 'eat', ms: 1600 }, { pose: 'idle', ms: kind === 'dig' && exOn() ? 1800 : 600, fn: kind === 'dig' ? () => exTrig(d, 'dig', { pose: 'idle', draw: false }) : null }, { pose: 'idle', ms: sec(1500, 3000) });
    }
  } else if (kind === 'rest') { // shade, sun or a bed spot: down, then a nap
    const rs = f.spots.filter((s) => (s.tags || []).some((g) => g === 'rest' || g === 'shade' || g === 'bed') && !grBusySpot(d, s)); let s = rs.length ? PICK(rs) : null;
    to = s ? (grFree(s.x, s.y) ? [s.x, s.y] : grSnap(s.x, s.y)) : null; if (!to || grCrowd(d, to)) { s = null; to = go({ like: ['shade', 'edge'] }); }
    if (to) steps = [{ fn: () => { r.grSpot = s ? s.id : null; }, ms: 0 }, { to }, { pose: 'down', fb: 'sit', ms: 1500 }, { pose: p.energy < 0.6 ? 'sleep' : 'down', ms: sec(10000, 24000) }, { pose: 'idle', ms: 1000, fn: () => { r.grSpot = null; } }];
  } else if (kind === 'front') {
    to = rmFrontSpot(d); if (to) steps = p.trait === 'show' ? [{ to }, { pose: 'happy', ms: 1600 }, { pose: 'sit', ms: sec(3000, 6000) }] : [{ to }, { pose: 'sit', ms: sec(4000, 9000) }];
  } else if (kind === 'spin') {
    steps = [{ pose: 'happy', face: 'left', ms: 220, bark: 'yip' }]; for (let i = 1, n = RINT(3, 4); i < n * 2; i++) steps.push({ pose: 'happy', face: i % 2 ? 'right' : 'left', ms: 220 }); steps.push({ pose: 'idle', ms: sec(1500, 3500) });
  } else if (kind === 'beg') {
    const b = f.spots.find((s) => (s.tags || []).includes('bowl')); to = b ? (grFree(b.x, b.y) ? [b.x, b.y] : grSnap(b.x, b.y)) : go({ like: ['bowl'] }); if (to) steps = [{ to }, { pose: 'sit', ms: sec(4000, 8000) }];
  }
  if (!steps) { to = go(); if (!to) return false; steps = [{ to, via: grVia([r.x, r.y], to, Math.random() < 0.5 ? 1 : 2) }, { pose: PICK(['idle', 'sit', 'sit', 'down']), fb: 'sit', ms: sec(2500, 6000) }]; } // wander
  if (p.trait === 'chatty' && Math.random() < 0.35) steps.splice(1, 0, { bark: 'talk', ms: 0 });
  packNext[d.id] = now + 60000; r.grKind = kind;
  steps.push({ fn: () => { packNext[d.id] = performance.now() + RINT(3000, 7000) * IDLE.speed; } });
  rmQueue(d, steps); return true;
}
// separation: standing pack dogs closer than 90 x the depth scale ease apart (never into a box or off the floor)
function grSep(dt) {
  const f = grFloor(); if (!f) return; const ds = rmDogs(), now = performance.now(), L = D();
  const can = (d) => d !== L && !d.sleeping && !rmSt(d).tw && !rmSt(d).fix && !rmSt(d).grIn && !(rmSt(d).hold > now);
  for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
    const a = rmSt(ds[i]), b = rmSt(ds[j]), dx = b.x - a.x, dy = (b.y - a.y) * 2.2, D2 = Math.hypot(dx, dy), m = GR_SEP * ((grScale(S.place, a.y) || 1) + (grScale(S.place, b.y) || 1)) / 2;
    if (D2 >= m) continue; const ux = D2 > 0.01 ? dx / D2 : 1, uy = D2 > 0.01 ? dy / D2 / 2.2 : 0, push = ((m - D2) / m) * 40 * dt;
    [[ds[i], a, -1], [ds[j], b, 1]].forEach(([d, r, s]) => { if (!can(d)) return; const x = r.x + s * ux * push, y = r.y + s * uy * push, T = rmTapBox(x, y, rmKd(d, y)); if (grFree(x, y) && T[0] >= 4 && T[0] + T[2] <= f.w - 4) { r.x = x; r.y = y; r.hx = x; r.hy = y; rmPaint(d); } });
  }
}

/* ---------------- layering: dogs and floor props by feet y ---------------- */
// the floor props move out of the scene drawing into #pack (each in a <g class="gr-prop" data-fy> wrapper, so it sorts with the dogs); a new scene
// drawing (env change, re-entering) brings new ones, a rebuilt #pack gets the same ones back
function grLayer(pk) {
  const svg = $('#view > svg.world'), fg = svg && svg.querySelector('#sceneG #floorG');
  if (svg !== GR.svg) { GR.svg = svg; GR.props = []; GR.game = []; } // a new scene: the old wrappers went with it
  if (fg && fg.querySelector(':scope > [data-fy]')) {
    GR.props.forEach((e) => e.remove()); GR.props = [];
    const inner = fg.ownerSVGElement, M = inner && inner !== svg && inner.getScreenCTM() && svg.getScreenCTM() ? svg.getScreenCTM().inverse().multiply(inner.getScreenCTM()) : null;
    const id = M && Math.abs(M.a - 1) < 1e-3 && Math.abs(M.d - 1) < 1e-3 && Math.abs(M.b) < 1e-3 && Math.abs(M.c) < 1e-3 && Math.abs(M.e) < 0.5 && Math.abs(M.f) < 0.5;
    [...fg.querySelectorAll(':scope > [data-fy]')].forEach((e) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'gr-prop'); g.dataset.fy = e.dataset.fy; if (e.dataset.prop) g.dataset.prop = e.dataset.prop;
      if (M && !id) g.setAttribute('transform', `matrix(${[M.a, M.b, M.c, M.d, M.e, M.f].map((v) => +v.toFixed(4)).join(' ')})`);
      g.appendChild(e); GR.props.push(g);
    });
  }
  GR.props.forEach((g) => { if (g.parentNode !== pk) pk.appendChild(g); });
  if (svg) grGame(svg, pk);
}
// the yard's own things the game draws over the scene (the dog house, the mailbox, the bowl) are floor props too in a grOn yard: each moves into #pack in a
// <g class="gr-prop gr-game" data-fy> wrapper (its base from the FLOOR row: house 526, mailbox 408, bowl 540), and an empty <g data-gr-at> keeps its old place
// in the drawing for the code that draws next to it (grAt). Their FLOOR feet boxes replace the whole-picture no-go boxes (rmScan skips them, grGameEl).
// Every hook keeps its element: the same node, its id, handlers and classes (a redraw of its insides, or of itself in place, stays in the wrapper)
const GR_GAME = { houseG: 'house', mailboxG: 'mailbox', bowlG: 'bowl' };
const GR_GAME_WITH = { houseG: ['fsPumpkinG'] }; // drawn right after the house, in front of it (the Halloween pumpkin on the porch): it goes along
const grGameHere = () => !!S && S.place === 'yard' && grOn('yard') && rmScene();
function grGameEl(el) { return !!el && !!el.id && GR_GAME[el.id] != null && grGameHere(); }
function grGame(svg, pk) {
  GR.game = GR.game.filter((w) => { if (w.firstElementChild) { if (w.parentNode !== pk) pk.appendChild(w); return true; } w.remove(); return false; }); // a rebuilt #pack gets them back, an emptied wrapper goes
  if (!grGameHere()) return; const f = grFloor('yard'); if (!f) return;
  Object.keys(GR_GAME).forEach((id) => {
    const e = svg.querySelector('#' + id), p = e && f.props.find((q) => String(q.id) === GR_GAME[id]); if (!p || !isFinite(p.base)) return;
    const w0 = e.parentNode; if (w0 && w0.classList && w0.classList.contains('gr-game')) return; // already sorted with the dogs
    if (!svg.querySelector(`[data-gr-at="${id}"]`)) { const a = document.createElementNS('http://www.w3.org/2000/svg', 'g'); a.dataset.grAt = id; e.before(a); }
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'gr-prop gr-game'); g.dataset.fy = p.base; g.dataset.prop = GR_GAME[id];
    const withs = (GR_GAME_WITH[id] || []).map((k) => svg.querySelector('#' + k)).filter((x) => x && x.previousElementSibling === e);
    g.appendChild(e); withs.forEach((x) => g.appendChild(x)); pk.appendChild(g); GR.game.push(g);
  });
}
// where to draw next to a yard game prop (its old place in the drawing): the <g data-gr-at> it left, else the element itself (grOn off: always the element)
function grAt(id, root) { const r = root || document; return r.querySelector(`[data-gr-at="${id}"]`) || r.querySelector('#' + id); }
// a dog fitted onto a prop (the leader at the nap door, a bed, a bench: rmLegacyTo's r.away; a pack dog on its fixed spot, rmFixed: napping by the door)
// draws in front of the floor prop it is on: its sort y is just past that prop's base when its feet stand over the prop's feet box, at most 40 units behind
function grDogY(d) {
  const r = rmSt(d); if (!r.away && !r.fix) return r.y; const f = grFloor(); let y = r.y; if (!f) return y;
  f.props.forEach((p) => { const b = p.box; if (b && isFinite(p.base) && r.x >= b[0] && r.x <= b[0] + b[2] && p.base >= y && p.base - r.y <= 40) y = p.base + 0.5; });
  return y;
}
const grY = (e) => (e.classList.contains('gr-prop') ? +e.dataset.fy || 0 : (() => { const d = dogById(e.dataset.dog); return d ? grDogY(d) : 0; })());
// back to front by feet y, the props too (rmDepth in a grOn place). Only the other nodes move round the leader's (its rub keeps its pointer capture)
function grDepth() {
  const pk = $('#pack'); if (!pk) return; if (rmScene()) grLayer(pk);
  const els = [...pk.children].filter((e) => e.classList.contains('rmdog') || e.classList.contains('gr-prop')); if (els.length < 2) return;
  const ys = new Map(els.map((e) => [e, grY(e)])), want = els.slice().sort((a, b) => ys.get(a) - ys.get(b) || (a.classList.contains('gr-prop') ? -1 : 0) + (b.classList.contains('gr-prop') ? 1 : 0));
  if (want.every((e, i) => e === els[i])) return;
  const lead = els.find((e) => e.classList.contains('rmlead')), li = want.indexOf(lead), foc = document.activeElement;
  // a focused node (the dog house or the bowl, by keyboard) stays put: moving it would drop the focus
  want.forEach((e, i) => { if (e === lead || (foc && foc !== document.body && e.contains(foc))) return; if (!lead) { pk.appendChild(e); return; } if (i < li) pk.insertBefore(e, lead); else pk.appendChild(e); });
}
function grDepthOk() { const pk = $('#pack'); if (!pk) return true; const ys = [...pk.children].filter((e) => e.classList.contains('rmdog') || e.classList.contains('gr-prop')).map(grY); return ys.every((y, i) => !i || y >= ys[i - 1] - 0.01); }

/* ---------------- the camera (wide places) ---------------- */
// the view window in world units: its left edge x, its width w (what shows), the world width W
function grCam() {
  const f = grFloor(), W = f ? f.w : 1000, svg = $('#view > svg.world'), vb = svg && svg.viewBox && svg.viewBox.baseVal;
  if (!vb || !vb.width) return { x: 0, w: Math.min(1000, W), W };
  if (isPhone()) return { x: vb.x, w: vb.width, W };
  const w = GR.vw && GR.vh ? Math.min(vb.width, (vb.height * GR.vw) / GR.vh) : vb.width; // desktop: xMidYMax slice shows the middle of the viewBox when the view is narrower
  return { x: vb.x + (vb.width - w) / 2, w, W };
}
function grCamApply(cx) { const svg = $('#view > svg.world'); if (!svg) return; const x = clamp(cx - 500, 0, Math.max(0, grW() - 1000)); svg.setAttribute('viewBox', `${x.toFixed(1)} 0 1000 600`); }
const grCamLive = () => !!S && rmScene() && grWide() && !!$('#view > svg.world');
// what the camera keeps in view: a dog it was told to follow (petting), else the pack's centre with the leader counted twice
function grFocusX() {
  const now = performance.now(), fd = GR.focus && now < GR.focusUntil ? dogById(GR.focus) : null; if (fd && rmDogs().includes(fd)) return rmSt(fd).x;
  const ds = rmDogs(), L = D(); let s = 0, n = 0; ds.forEach((d) => { const k = d === L ? 2 : 1; s += rmSt(d).x * k; n += k; }); return n ? s / n : 500;
}
function grFocus(d, ms) { if (!d || !grWide()) return false; GR.focus = d.id; GR.focusUntil = performance.now() + (ms || 4000); return true; }
const grHalf = () => { const svg = $('#view > svg.world'), vb = svg && svg.viewBox.baseVal; return isPhone() ? (vb && vb.width ? vb.width / 2 : 350) : 500; };
function grCamHeld(now) { return GR.drag || now < GR.hold || (typeof blOn === 'function' && blOn()) || (typeof phActive === 'function' && phActive()); }
// one camera step: dt seconds. The dead zone (150, less on a narrow phone crop) and the 0.8 s ease
function grCamStep(dt, now) {
  if (!grCamLive() || grCamHeld(now)) return;
  const W = grW(), h = grHalf(), dz = Math.min(GR_DEAD, Math.max(40, h - 110)), fx = grFocusX(); let tg = camCx;
  if (fx > camCx + dz) tg = fx - dz; else if (fx < camCx - dz) tg = fx + dz; tg = clamp(tg, Math.min(h, W / 2), Math.max(W - h, W / 2));
  if (isPhone()) { phCamHome = tg; phHomeCx = tg; }
  if (Math.abs(tg - camCx) < 0.3) return; camCx += (tg - camCx) * (1 - Math.exp(-dt / (GR_EASE / 3))); // three time constants: settled in about 0.8 s
  const m = h - 24; if (fx > camCx + m) camCx = fx - m; else if (fx < camCx - m) camCx = fx + m; // a jump of the focus (a new dog to follow): never out of view while the camera eases
  camCx = clamp(camCx, Math.min(h, W / 2), Math.max(W - h, W / 2)); camApply(camCx);
}
function grCamFrame(t) {
  GR.raf = 0; if (!grCamLive()) { document.documentElement.classList.remove('gr-wide'); return; }
  const dt = clamp((t - (GR.last || t)) / 1000, 0, 0.1); GR.last = t; if (!GR.sim) grCamStep(dt, performance.now());
  GR.raf = requestAnimationFrame(grCamFrame);
}
function grCamStart() { GR.last = 0; if (!GR.raf) GR.raf = requestAnimationFrame(grCamFrame); }
// the camera right on the focus (a fresh scene), clamped to the ends
function grCamHome() { const W = grW(), h = grHalf(); camCx = clamp(grFocusX(), Math.min(h, W / 2), Math.max(W - h, W / 2)); if (isPhone()) { phCamHome = camCx; phHomeCx = camCx; } camApply(camCx); }
function grDragged() { GR.hold = Math.max(GR.hold, performance.now() + 2000); } // a drag looked around: the camera waits 2 s (a tap never fights it)
function grLookAt(x) { const h = grHalf(), W = grW(); camTo(clamp(x, h, W - h), 0.6); GR.hold = performance.now() + 4600; } // a look chip: there, and stay a while
// ball play (desktop, a wide place): the camera follows the ball, as the phone's does
function grBallCam(dt, x) { const h = 500, W = grW(); camCx += (clamp(x, h, W - h) - camCx) * Math.min(1, dt * 5); grCamApply(camCx); }
// photo mode: the picture is the 1000-wide window round the camera
function grPhotoX() { return clamp(camCx - 500, 0, Math.max(0, grW() - 1000)); }
function grViewSize() { const svg = $('#view > svg.world'); GR.vw = (svg && svg.clientWidth) || view.clientWidth; GR.vh = (svg && svg.clientHeight) || view.clientHeight; }
function grSceneUp() {
  const wide = grCamLive(); document.documentElement.classList.toggle('gr-wide', wide); GR.focus = null; GR.hold = 0; GR.drag = false;
  if (!grOn() || !rmScene()) return; grViewSize(); grDepth();
  if (wide) { grCamHome(); grCamStart(); }
}
on('yard:enter', grSceneUp);
on('scene:redraw', () => { if (S && rmScene() && grOn()) grDepth(); });
window.addEventListener('resize', () => { if (S && rmScene() && grOn()) { grViewSize(); if (grWide()) setTimeout(() => { if (grCamLive()) grCamHome(); }, 60); } });

/* ---------------- the deterministic run for the tests: __paw.gr.sim(place, secs, o) ---------------- */
function grRand(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function grSim(place, secs, o) {
  o = o || {}; if (!S || !rmScene() || S.place !== place || !grOn(place)) return { error: 'not in that grOn place', place, here: S && S.place };
  const f = grFloor(), step = o.step || 1 / 30, n = Math.max(1, Math.round(secs / step)), mr = Math.random, own = Object.prototype.hasOwnProperty.call(performance, 'now'), pn = performance.now;
  let T = pn.call(performance); const T0 = T, ds = rmDogs(), L = D(), out = { place, secs, steps: n, dogs: ds.map((d) => d.id), outside: [], inBox: [], depthBad: 0, camOut: 0, camSteps: 0, scaleBad: [], moved: {}, kinds: {}, acts: {}, by: {} };
  Math.random = grRand(o.seed || 7); performance.now = () => T; GR.sim = { T0 }; const start = ds.map((d) => [rmSt(d).x, rmSt(d).y]);
  try {
    rmScan(); const boxes = rmBoxes().filter((b) => b[4] !== 'dctag');
    ds.forEach((d) => { const r = rmSt(d); if (!r.tw && !r.fix && r.grIn == null && !grFree(r.x, r.y)) { const q = grSnap(r.x, r.y); if (q) { r.x = q[0]; r.y = q[1]; r.hx = q[0]; r.hy = q[1]; rmPaint(d); } } }); // as rmValidate(true): nobody starts on a box
    for (let i = 0; i < n; i++) {
      T += step * 1000;
      if (!RM.paused.size && !(typeof blOn === 'function' && blOn())) ds.forEach((d) => {
        const r = rmSt(d); if (d.sleeping || r.fix) return; if (r.q) { rmQTick(d, T); return; } if (r.tw) return;
        if (T >= (packNext[d.id] || 0)) { if (grAct(d)) { out.kinds[r.grKind] = (out.kinds[r.grKind] || 0) + 1; (out.by[d.id] = out.by[d.id] || []).push(r.grKind); } else packNext[d.id] = T + RINT(5000, 10000) * IDLE.speed; }
      });
      rmFrame(T); if (!RM.paused.size) grSep(step); GR.last = T; grCamStep(step, T);
      if (i % 3 === 0) { grDepth(); if (!grDepthOk()) out.depthBad++; }
      ds.forEach((d) => {
        const r = rmSt(d); if (r.grSpot) out.acts[r.grSpot] = (out.acts[r.grSpot] || 0) + (i % 30 === 0 ? 1 : 0);
        if (!grIn(f.poly, r.x, r.y) && !grIn(f.poly, r.x + 1, r.y) && !grIn(f.poly, r.x - 1, r.y) && !grIn(f.poly, r.x, r.y - 1) && out.outside.length < 20) out.outside.push([d.id, f1(r.x), f1(r.y), i]);
        const hb = boxes.find((b) => !(r.grIn != null && String(b[5]) === String(r.grIn)) && r.x > b[0] + 0.5 && r.x < b[0] + b[2] - 0.5 && r.y > b[1] + 0.5 && r.y < b[1] + b[3] - 0.5);
        if (hb && out.inBox.length < 20) out.inBox.push([d.id, f1(r.x), f1(r.y), hb.slice(0, 4).map(Math.round), hb[5] || hb[4], r.grIn || null, i, r.grKind, r.tw ? { gr: !!r.tw.gr, leg: !!(r.tw.o && r.tw.o.legacy), P: r.tw.P ? r.tw.P.filter((q, j) => j % 4 === 0).map((q) => q.map(Math.round)) : null, x0: Math.round(r.tw.x0), y0: Math.round(r.tw.y0), x1: Math.round(r.tw.x1), y1: Math.round(r.tw.y1) } : null]);
        const want = RM_BASE * grScale(place, r.y) * rmSz(r); if (r.k == null && !r.fix && Math.abs(rmK(r) - want) > 1e-6 && out.scaleBad.length < 10) out.scaleBad.push([d.id, rmK(r), want]);
      });
      if (grWide() && !grCamHeld(T)) { out.camSteps++; const c = grCam(), fx = grFocusX(); if ((fx < c.x - 1 || fx > c.x + c.w + 1) && i > 30) out.camOut++; } // after the first second (the camera starts where it is)
    }
  } finally { Math.random = mr; if (own) performance.now = pn; else delete performance.now; }
  const now = performance.now(); GR.sim = null; grShift(T - now, T0);
  ds.forEach((d, j) => { const r = rmSt(d); out.moved[d.id] = f1(Math.hypot(r.x - start[j][0], r.y - start[j][1])); });
  if (RM.raf) { cancelAnimationFrame(RM.raf); RM.raf = 0; } rmLoop(); grDepth(); out.depthOk = grDepthOk(); out.cam = grCam(); out.focus = grFocusX(); out.pos = ds.map((d) => [d.id, f1(rmSt(d).x), f1(rmSt(d).y)]); out.lead = (() => { const r = rmSt(L); return { tw: !!r.tw, gr: !!(r.tw && r.tw.gr), q: r.q ? r.q.length : 0, fix: !!r.fix, pn: Math.round((packNext[L.id] || 0) - now), sl: !!L.sleeping, idle: !!IDLE.act }; })();
  return out;
}

// after a sim: every clock the run set (in its own time, up to secs ahead of the real one) moves back by delta, so nothing waits for minutes
function grShift(delta, T0) {
  const sh = (v) => (typeof v === 'number' && v >= T0 ? v - delta : v), obj = (o) => { if (o) for (const k in o) o[k] = sh(o[k]); };
  obj(packNext); obj(RM.petT); ['askAt', 'tickAt', 'valAt', 'noAt', 'up'].forEach((k) => { RM[k] = sh(RM[k]); });
  rmDogs().forEach((d) => { const r = rmSt(d); ['hold', 'askNext', 'qAt', 'gfAt', 'grPlan', 'petFront'].forEach((k) => { r[k] = sh(r[k]); }); if (r.tw) { r.tw.t0 = sh(r.tw.t0); r.tw.last = sh(r.tw.last); } });
  if (typeof EX === 'object' && EX) { Object.values(EX.cur || {}).forEach((c) => { if (c) c.until = sh(c.until); }); obj(EX.cool); obj(EX.rcool); EX.roamAt = sh(EX.roamAt); EX.rt = sh(EX.rt); }
  GR.hold = sh(GR.hold); GR.focusUntil = sh(GR.focusUntil); GR.last = 0;
}

/* ---- tests: window.__paw.gr ---- */
function grExpose() {
  if (!window.__paw) return;
  window.__paw.gr = {
    on: (p) => grOn(p), floor: (p) => grFloor(p), path: (id, x, y, o) => grPath(dogById(id) || D(), x, y, o || {}), cam: () => grCam(), scale: (p, y) => grScale(p, y),
    sim: (place, secs, o) => grSim(place, secs, o), allow: (v) => { prefs.grTest = !!v; return grOn(); }, wide: (p) => grWide(p), zone: (p) => (grOn(p) ? grZone(p) : null),
    focus: (id, ms) => grFocus(dogById(id), ms), focusX: () => grFocusX(), depthOk: () => grDepthOk(), depth: () => grDepth(), area: (p) => { const f = grFloor(p); return f ? f.area : 0; },
    free: (x, y) => grFree(x, y), inside: (x, y, p) => { const f = grFloor(p); return !!f && grIn(f.poly, x, y); }, no: (p) => grNo(p), snap: (x, y) => grSnap(x, y), tags: (x, y) => grTags(x, y),
    props: () => GR.props.map((g) => ({ id: g.dataset.prop, fy: +g.dataset.fy, inPack: !!g.closest('#pack') })), game: () => GR.game.map((g) => ({ id: g.dataset.prop, fy: +g.dataset.fy, inPack: !!g.closest('#pack'), el: g.firstElementChild ? g.firstElementChild.id : '' })), look: (x) => grLookAt(x), held: () => grCamHeld(performance.now()), home: () => grCamHome(),
    get hold() { return GR.hold; }, set hold(v) { GR.hold = v; }, acts: GR_ACTS, gait: GR_GAIT
  };
}
on('game:ready', () => setTimeout(grExpose, 0));
setTimeout(grExpose, 0);
