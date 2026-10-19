// v2.12 neck fix (owner, 18 Oct 2026: "Make sure the head is stick to the body, i saw yorkie is separated"): does a dog's head sit on its body?
// Used by test_v212_dogs_node.js. Plain node, no browser: one frame is drawn with four markers in frame() (test copy only), the two layers are
// rasterised from their own SVG strokes, fills and ellipses at 2x, and the overlapping area is measured.
//   body layer: the neck tube (when drawn), the body, its marks and coat, the ruff
//   head layer: the back ears and topknot, the skull and its marks (beard, face hair, bow), the front ears
// contact() returns the overlap in canvas px^2 at adult scale (puppies are drawn at adult scale and scaled down after). The old floating yorkie
// has 0 in most poses; a head that sits on the body has hundreds; long ears lying on the shoulders (maltese) count, they read as one dog.
// v2.13 (V213.md 5): every breed of PawArt.DOGS, every pose, adult, puppy and newborn, each of the three animation frames, mixes and face
// expressions (frame()'s 7th argument: an expression's pose() hook may tilt the head). contact(..., { parts: 1 }) also returns the skull's own
// overlap and the neck hole, and floats() is the v2.13 rule (below). Used by test_v213_neck_node.js.
'use strict';
const vm = require('vm');
const MK = [
  ['  // neck: a short tube from the chest to the head, behind the body\n', 'h._m0=h.acc.length;'],
  ['  if(!sheet)drawEars(h,s,L,HT,false);', 'h._m1=h.acc.length;'],
  ['  if(s.topknot&&!hat&&', 'h._m1b=h.acc.length;'],
  ['  {const a0=h.acc.length;drawFace(h,s,L,HT);', 'h._m2=h.acc.length;'],
  ['  if(!sheet)drawEars(h,s,L,HT,true);', 'h._m3=h.acc.length;'],
  ["  if(body==='Ghost Sheet'){drawGhost", 'h._m4=h.acc.length;']];
const HOOK = 'PA.dog=dog;';
function loadNeck(src) {
  for (const [a, ins] of MK) { if (src.split(a).length !== 2) throw new Error('v212_neck_check: anchor not found once: ' + a.trim()); src = src.replace(a, ins + a); }
  if (src.split(HOOK).length !== 2) throw new Error('v212_neck_check: hook not found');
  src = src.replace(HOOK, HOOK + 'PA._nk={frame,specFor,POSES,hashS,NBSLEEP,EXPR,EXPR_LIST,exOk,SP,T};');
  const sb = { window: {} }; vm.createContext(sb); vm.runInContext(src, sb); return sb.window.PawArt._nk;
}
const K = 2, OX = 60, OY = 60, GW = (240 + 2 * OX) * K, GH = (200 + 2 * OY) * K;
function raster(items) {
  const m = new Uint8Array(GW * GH), put = (x, y) => { if (x >= 0 && y >= 0 && x < GW && y < GH) m[y * GW + x] = 1; };
  for (const s of items) {
    if (/ opacity="0?\.[0-5]/.test(s)) continue; // the faint crayon streaks lie inside the shapes
    let tx = 0, ty = 0; const tr = /transform="translate\(([-\d.]+) ([-\d.]+)\)"/.exec(s); if (tr) { tx = +tr[1]; ty = +tr[2]; }
    const X = (v) => (v + tx + OX) * K, Y = (v) => (v + ty + OY) * K;
    if (s.startsWith('<ellipse')) {
      const g = (a) => +new RegExp(' ' + a + '="([-\\d.]+)"').exec(s)[1], cx = X(g('cx')), cy = Y(g('cy')), rx = g('rx') * K, ry = g('ry') * K;
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y);
      continue;
    }
    if (!s.startsWith('<path')) continue;
    const d = / d="([^"]*)"/.exec(s); if (!d) continue;
    const subs = []; let cur = null, q; const re = /([MLZ])\s*([-\d.]+)?\s*([-\d.]+)?/g;
    while ((q = re.exec(d[1]))) { if (q[1] === 'M') { cur = []; subs.push(cur); } if (q[1] !== 'Z' && cur) cur.push([X(+q[2]), Y(+q[3])]); }
    const sw = /stroke-width="([\d.]+)"/.exec(s), fill = / fill="([^"]*)"/.exec(s);
    if (fill && fill[1] !== 'none') for (const P of subs) { // even-odd scanline fill
      if (P.length < 3) continue; let y0 = 1e9, y1 = -1e9; P.forEach((p) => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      for (let y = Math.ceil(y0); y <= y1; y++) { const xs = [];
        for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); }
        xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i]); x <= xs[i + 1]; x++) put(x, y); }
    }
    if (sw && /stroke="(?!none)/.test(s)) { const r = +sw[1] * K / 2; // round-capped polyline
      for (const P of subs) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[Math.min(i + 1, P.length - 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
        for (let y = Math.floor(Math.min(a[1], b[1]) - r); y <= Math.max(a[1], b[1]) + r; y++) for (let x = Math.floor(Math.min(a[0], b[0]) - r); x <= Math.max(a[0], b[0]) + r; x++) {
          let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; if ((x - a[0] - t * dx) ** 2 + (y - a[1] - t * dy) ** 2 <= r * r) put(x, y); } }
    }
  }
  return m;
}
// the visible gap between the two layers when they do not overlap: canvas px from the nearest head pixel to the body (BFS, at most 30 px)
function gapOf(bm, hm) {
  const D = new Int16Array(GW * GH).fill(-1); let q = [];
  for (let i = 0; i < bm.length; i++) if (bm[i]) { D[i] = 0; q.push(i); }
  for (let d = 0; d < 30 * K && q.length; d++) { const nq = [];
    for (const i of q) { const x = i % GW, y = (i - x) / GW;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue; const j = Y * GW + X; if (D[j] < 0) { D[j] = d + 1; if (hm[j]) return (d + 1) / K; nq.push(j); } } }
    q = nq; }
  return 30;
}
// v2.13 (V213.md 5): a frame FLOATS when the skull itself does not touch the body (skull overlap under SKULL_MIN px^2) and most of the neck's
// place is empty paper (the neck hole, at least HOLE_MAX px^2). Long ears or hair resting on the shoulders do not count as a neck here (they did
// not stop the beagle's head floating). The old floating renders (the v2.13 NECKFIX list) scored 80 to 172; the closest dogs that read as
// attached by eye (the chihuahua's idle and beg, the beagle's leglift) score 77 to 79; a neck tube brings the hole to 0. The v2.13 fix lane looked
// at them again, with the shiba, chihuahua, mutt and husky idle heads (adult and puppy, all three frames, several coats): the skull outline meets
// the body in every frame, so the limits stay. Mixes always draw the neck tube (V213.md 5.1).
const SKULL_MIN = 2, HOLE_MAX = 80;
const floats = (r) => r.skull < SKULL_MIN && r.hole >= HOLE_MAX;
function neckChecker(src) {
  const G = loadNeck(src);
  // contact(key, pose, age, o): o (optional) = { expr, k, mix, coat, parts, gap }. k = the animation frame (0, 1, 2; default 0, the first
  // frame, as in v2.12), expr = a v2.13 face expression (frame()'s 7th argument, only when it shows on the pose; its pose() hook may tilt the
  // head), mix = the head breed of a mix. Newborns take their sleep or down pose, as dog() draws them.
  // Returns the v2.12 overlap (px^2), or with o.parts { overlap, skull, ears, hole } (+ gap, skullGap in px with o.gap).
  function contact(key, pose, age, o) {
    o = o || {}; const so = { pose }; if (age) so.age = age; if (o.mix) so.mix = { head: o.mix }; if (o.coat) so.coat = o.coat;
    const s = G.specFor(key, so).s, k = o.k || 0;
    const p = age === 'newborn' ? (G.NBSLEEP.test(pose) ? 'sleep' : 'down') : pose, ex = o.expr ? G.exOk(o.expr, p, age) : null;
    const F = G.frame(key, s, p, null, k, G.hashS('pa' + key + p) * 5 + 3, ex), h = F.h, L = F.L, A = h.acc;
    const bm = raster(A.slice(h._m0, h._m1)), hm = raster(A.slice(h._m1, h._m2).concat(A.slice(h._m3, h._m4)));
    let n = 0; for (let i = 0; i < bm.length; i++) if (hm[i] && bm[i]) n++;
    if (!o.parts && !o.gap) return n / (K * K);
    // the skull alone (topknot, skull, head marks) against the body layer; the ears are the rest of the overlap
    const sm = raster(A.slice(h._m1b, h._m2)); let ns = 0; for (let i = 0; i < bm.length; i++) if (sm[i] && bm[i]) ns++;
    // the neck hole: the part of the neck tube's place (chest to head, where frame() draws the tube) that neither layer covers
    const nb = G.T(L.bT)([s.body.rx * .62, -s.body.ry * .3]), nh = G.T(L.hT)([-s.head.rx * .2, s.head.ry * .35]);
    const tm = raster([`<path d="M${nb[0]} ${nb[1]}L${nh[0]} ${nh[1]}" stroke="#000" stroke-width="${s.head.rx * .7}"/>`]);
    let hole = 0; for (let i = 0; i < tm.length; i++) if (tm[i] && !bm[i] && !hm[i]) hole++;
    const r = { overlap: n / (K * K), skull: ns / (K * K), ears: (n - ns) / (K * K), hole: hole / (K * K), pose: p, expr: ex };
    if (o.gap) { r.gap = n ? 0 : gapOf(bm, hm); r.skullGap = ns ? 0 : gapOf(bm, sm); }
    return r;
  }
  contact.minK = (key, pose, age, o) => Math.min(...[0, 1, 2].map((k) => contact(key, pose, age, Object.assign({}, o, { k })))); // the worst of the three frames
  contact.floats = floats;
  contact.G = G;
  return contact;
}
module.exports = { neckChecker, floats, SKULL_MIN, HOLE_MAX };
