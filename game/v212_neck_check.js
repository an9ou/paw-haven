// v2.12 neck fix (owner, 18 Oct 2026: "Make sure the head is stick to the body, i saw yorkie is separated"): does a dog's head sit on its body?
// Used by test_v212_dogs_node.js. Plain node, no browser: one frame is drawn with four markers in frame() (test copy only), the two layers are
// rasterised from their own SVG strokes, fills and ellipses at 2x, and the overlapping area is measured.
//   body layer: the neck tube (when drawn), the body, its marks and coat, the ruff
//   head layer: the back ears and topknot, the skull and its marks (beard, face hair, bow), the front ears
// contact() returns the overlap in canvas px^2 at adult scale (puppies are drawn at adult scale and scaled down after). The old floating yorkie
// has 0 in most poses; a head that sits on the body has hundreds; long ears lying on the shoulders (maltese) count, they read as one dog.
'use strict';
const vm = require('vm');
const MK = [
  ['  // neck: a short tube from the chest to the head, behind the body\n', 'h._m0=h.acc.length;'],
  ['  if(!sheet)drawEars(h,s,L,HT,false);', 'h._m1=h.acc.length;'],
  ['  {const a0=h.acc.length;drawFace(h,s,L,HT);', 'h._m2=h.acc.length;'],
  ['  if(!sheet)drawEars(h,s,L,HT,true);', 'h._m3=h.acc.length;'],
  ["  if(body==='Ghost Sheet'){drawGhost", 'h._m4=h.acc.length;']];
const HOOK = 'PA.dog=dog;';
function loadNeck(src) {
  for (const [a, ins] of MK) { if (src.split(a).length !== 2) throw new Error('v212_neck_check: anchor not found once: ' + a.trim()); src = src.replace(a, ins + a); }
  if (src.split(HOOK).length !== 2) throw new Error('v212_neck_check: hook not found');
  src = src.replace(HOOK, HOOK + 'PA._nk={frame,specFor,POSES,hashS,NBSLEEP};');
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
function neckChecker(src) {
  const G = loadNeck(src);
  return function contact(key, pose, age) { // the first frame, as dog() draws it (newborns take their sleep or down pose)
    const o = { pose }; if (age) o.age = age; const s = G.specFor(key, o).s;
    const p = age === 'newborn' ? (G.NBSLEEP.test(pose) ? 'sleep' : 'down') : pose;
    const h = G.frame(key, s, p, null, 0, G.hashS('pa' + key + p) * 5 + 3).h, A = h.acc;
    const bm = raster(A.slice(h._m0, h._m1)), hm = raster(A.slice(h._m1, h._m2).concat(A.slice(h._m3, h._m4)));
    let n = 0; for (let i = 0; i < bm.length; i++) if (hm[i] && bm[i]) n++;
    return n / (K * K);
  };
}
module.exports = { neckChecker };
