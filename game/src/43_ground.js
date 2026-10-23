/* ======================= v2.15 AROUND TOWN: the deep, wide ground and the movement model (V215.md section 8, GROUND lane, tag gr, test hook __paw.gr) =======================
   Owner: the GROUND lane (with css/45_ground.css and the hook lines in 37_roam.js and 38_ball.js). Laid down by the stubs lane: the names work today,
   the GROUND lane fills in the bodies and keeps the names.
   grOn(place) lives in the core (00_core.js, next to mpOn): PawArt.FLOOR[place] exists, mpOn(), under the harness also prefs.grTest, never Tokyo.
   PawArt.FLOOR[name] = { w, back, front, poly: [[x, y]...], props: [{ id, base, box }], spots: [{ id, x, y, tags, act }] } (worlds A, C and G, under o.v215).
   No grOn = the v2.10 roam code path byte for byte (37_roam.js rmZoneOf, rmScale, rmPick / rmTo, 38_ball.js BL_FLOOR).
   API (stubs now)
     grFloor(place)       { w, back, front, kB, kF, poly, no, spots } from PawArt.FLOOR, or null when !grOn(place). kB / kF: the depth scale at the back
                          and the front line (outdoors 0.5 / 1.05, indoors 0.7 / 1.05); no: the floor props' hard boxes [x, y, w, h]
     grScale(place, y)    the base depth scale at feet y (linear kB -> kF, clamped), or null when !grOn(place) (the caller keeps rmScale)
     grPath(d, x, y, o)   a path for dog d to x, y as [[x, y], ...] (o.gait 'stroll' | 'trot' | 'run', o.via, o.act). Stub: [[x, y]] (straight there)
     grCam()              the camera window { x, w, W }: its left edge and width in world units, the world width. Stub: { x: 0, w: 1000, W: floor w or 1000 }
     grFocus(d, ms)       the camera follows dog d for ms. Stub: nothing (false)
   Test hook: window.__paw.gr = { on, floor, path, cam, sim(place, secs) } (sim: the 4-dog simulation of v215_ground; stub: { stub: true }) */

const GR_K = { out: [0.5, 1.05], in: [0.7, 1.05] }; // V215.md 8.2
function grFloor(place) {
  const k = place === undefined ? (S && S.place) : place; if (!grOn(k)) return null;
  const F = PawArt.FLOOR[k], indoor = !!(PLACES[k] && PLACES[k].out === false), kk = indoor ? GR_K.in : GR_K.out;
  return { w: F.w || 1000, back: F.back, front: F.front, kB: kk[0], kF: kk[1], poly: Array.isArray(F.poly) ? F.poly : [], no: (F.props || []).map((p) => p.box).filter(Boolean), spots: Array.isArray(F.spots) ? F.spots : [] };
}
function grScale(place, y) {
  const f = grFloor(place); if (!f || !(f.front > f.back)) return null;
  const t = clamp(((y == null ? f.front : y) - f.back) / (f.front - f.back), 0, 1); return f.kB + (f.kF - f.kB) * t;
}
function grPath(d, x, y, o) { return [[x, y]]; }
function grCam() { const f = grFloor(); return { x: 0, w: 1000, W: f ? f.w : 1000 }; }
function grFocus(d, ms) { return false; }

/* ---- tests: window.__paw.gr ---- */
function grExpose() {
  if (!window.__paw) return;
  window.__paw.gr = {
    on: (p) => grOn(p), floor: (p) => grFloor(p), path: (id, x, y, o) => grPath(dogById(id) || D(), x, y, o || {}), cam: () => grCam(),
    scale: (p, y) => grScale(p, y), sim: (place, secs) => ({ stub: true, place, secs, steps: 0 }),
    allow: (v) => { prefs.grTest = !!v; return grOn(); }
  };
}
on('game:ready', () => setTimeout(grExpose, 0));
setTimeout(grExpose, 0);
