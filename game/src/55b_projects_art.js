/* ======================= v2.27 "Town projects": the art (V227.md 6) =======================
   Four builds (fountain, bandstand, sakura, lighthouse), each in three stages: 'plan' (a dashed pencil sketch), 'half' (half built, with
   wooden scaffolding) and 'done' (finished), plus the project board prop and the progress drawing of the sheet. Pencil-world look of world/:
   ink #5B3D32, the world palette, a small seeded wobble on every line. Every colour fill uses the very same path as its outline (the line is
   drawn on top), so no fill ever leaves its outline (owner's rule, v2.15.2). Pure functions of their options: no game state, no tt().
   Local boxes (x0 y0 w h; the feet / base at the bottom middle):
     fountain   0 0 180 200   bandstand 0 0 140 190   sakura 0 0 140 200   lighthouse 0 0 90 160   board 0 0 100 104 */
const PRA_C = { ink: '#5B3D32', graph: '#A8968A', stone: '#DED6CC', stoneD: '#C7BCAE', water: '#BEE0F2', waterD: '#9CCDE8', wood: '#EBCDA4', woodD: '#CFA77C',
  trunk: '#C9A07A', trunkD: '#A97E5A', red: '#F4A3A3', redD: '#E57E83', white: '#FFFDF8', paper: '#FFF3DA', yellow: '#FCE59A', pink: '#F9C9D6', pinkD: '#F28FA5',
  leaf: '#B9DD92', leafD: '#7FB86A', orange: '#F8C08A', glass: '#E4F2FA', mint: '#C9EBDA', lav: '#DCCBF2', snow: '#FFFFFF', rock: '#C9C2B8' };
// a seeded wobble: the same drawing every time
function praRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const praR1 = (n) => Math.round(n * 10) / 10;
// a closed (or open) wobbly path through the points: a few jittered midpoints, smoothed with quadratic curves
function praPath(P, closed, r, amp) {
  const a = amp == null ? 0.9 : amp, pts = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length]; pts.push([p[0] + (r() - 0.5) * a, p[1] + (r() - 0.5) * a]);
    if (closed || i < P.length - 1) { const L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L > 26) pts.push([(p[0] + q[0]) / 2 + (r() - 0.5) * a * 1.4, (p[1] + q[1]) / 2 + (r() - 0.5) * a * 1.4]); }
  }
  const n = pts.length; if (n < 2) return '';
  if (!closed) { let d = `M${praR1(pts[0][0])} ${praR1(pts[0][1])}`; for (let i = 1; i < n; i++) d += `L${praR1(pts[i][0])} ${praR1(pts[i][1])}`; return d; }
  const m = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2]; let s = m(pts[n - 1], pts[0]), d = `M${praR1(s[0])} ${praR1(s[1])}`;
  for (let i = 0; i < n; i++) { const q = m(pts[i], pts[(i + 1) % n]); d += `Q${praR1(pts[i][0])} ${praR1(pts[i][1])} ${praR1(q[0])} ${praR1(q[1])}`; }
  return d + 'Z';
}
const praEll = (cx, cy, rx, ry, n) => { const p = []; const k = n || 16; for (let i = 0; i < k; i++) { const t = (i / k) * Math.PI * 2; p.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return p; };
const praRect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// the kit: shape (fill + its own line), line, dashed sketch line. mode 'plan' turns every shape into a dashed pencil outline with no fill
function praKit(seed, mode) {
  const r = praRng(seed), out = [];
  const plan = mode === 'plan';
  return {
    r, out,
    shape(P, fill, o) { o = o || {}; const d = praPath(P, true, r, o.amp); if (plan) { out.push(`<path d="${d}" fill="none" stroke="${PRA_C.graph}" stroke-width="1.8" stroke-dasharray="6 5" stroke-linecap="round" stroke-linejoin="round"/>`); return; }
      out.push(`<path d="${d}" fill="${fill}"${o.op ? ` fill-opacity="${o.op}"` : ''} stroke="${o.ink || PRA_C.ink}" stroke-width="${o.w || 2.4}" stroke-linejoin="round"/>`); },
    line(P, o) { o = o || {}; const d = praPath(P, false, r, o.amp); out.push(`<path d="${d}" fill="none" stroke="${plan ? PRA_C.graph : (o.c || PRA_C.ink)}" stroke-width="${o.w || 2.2}" stroke-linecap="round" stroke-linejoin="round"${plan || o.dash ? ` stroke-dasharray="${o.dash || '6 5'}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}/>`); },
    raw(s) { out.push(s); },
    svg() { return out.join(''); }
  };
}
// wooden scaffolding: two poles, crossbars and a little ladder, inside the box x0..x1, y0..y1 (the feet at y1)
function praScaffold(k, x0, x1, y0, y1) {
  const W = PRA_C.wood;
  [x0, x1].forEach((x) => k.shape(praRect(x - 3, y0, 6, y1 - y0), W, { w: 1.8 }));
  for (let y = y0 + 18; y < y1 - 6; y += 34) k.shape(praRect(x0 - 4, y, x1 - x0 + 8, 5), W, { w: 1.6 });
  k.line([[x0 + 2, y0 + 22], [x1 - 2, y0 + 52]], { c: PRA_C.woodD, w: 2 }); // a diagonal brace
  const lx = x1 + 8; k.line([[lx, y1], [lx + 6, y0 + 30]], { c: PRA_C.woodD, w: 2 }); k.line([[lx + 14, y1], [lx + 20, y0 + 30]], { c: PRA_C.woodD, w: 2 });
  for (let y = y1 - 12; y > y0 + 34; y -= 14) { const t = (y1 - y) / (y1 - y0 - 30); k.line([[lx + 6 * t, y], [lx + 14 + 6 * t, y]], { c: PRA_C.woodD, w: 1.6 }); }
}
// a pink planning flag on a stake (the 'plan' stage's marker)
function praStake(x, y) { return `<g><path d="M${x} ${y} L${x} ${y - 34}" stroke="${PRA_C.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M${x} ${y - 34} L${x + 16} ${y - 29} L${x} ${y - 23} Z" fill="${PRA_C.pinkD}" stroke="${PRA_C.ink}" stroke-width="1.8" stroke-linejoin="round"/></g>`; }

/* ---- the fountain: a three-tier stone fountain with a low drinking basin for dogs at the front ---- */
function praFountain(stage) {
  const done = stage === 'done', half = stage === 'half';
  const base = praKit(227, stage === 'plan' ? 'plan' : 'ink'); // the lower basin: drawn (filled) once half built
  base.shape(praEll(90, 160, 84, 22), PRA_C.stoneD); base.shape(praEll(90, 154, 76, 16), done ? PRA_C.water : PRA_C.stone);
  base.shape(praRect(70, 170, 40, 22), PRA_C.stone, { w: 2 }); base.shape(praEll(90, 192, 26, 7), done ? PRA_C.water : PRA_C.stoneD, { w: 2 }); // the dogs' bowl at paw height
  const top = praKit(2271, done ? 'ink' : 'plan');
  top.shape(praRect(80, 96, 20, 58), PRA_C.stone); top.shape(praEll(90, 96, 46, 11), PRA_C.stoneD); top.shape(praEll(90, 92, 40, 7), PRA_C.water);
  top.shape(praRect(85, 54, 10, 38), PRA_C.stone, { w: 2 }); top.shape(praEll(90, 54, 22, 6), PRA_C.stoneD, { w: 2 });
  top.shape(praEll(90, 44, 7, 7), PRA_C.stone, { w: 2 }); // the finial ball
  let s = base.svg() + top.svg();
  if (done) { // water arcs falling into the bowls (lines only), and a paw on the bowl's front
    const w = praKit(2272, 'ink');
    [[-1, 1], [1, 1]].forEach(([d]) => { w.line([[90, 50], [90 + 18 * d, 46], [90 + 30 * d, 64], [90 + 36 * d, 88]], { c: PRA_C.waterD, w: 2.2 }); w.line([[90 + 30 * d, 94], [90 + 52 * d, 100], [90 + 64 * d, 126], [90 + 66 * d, 150]], { c: PRA_C.waterD, w: 2.2 }); });
    s += w.svg() + `<g transform="translate(90 181)" fill="${PRA_C.ink}"><ellipse cx="0" cy="2" rx="4" ry="3"/><circle cx="-5" cy="-3" r="1.6"/><circle cx="-1.8" cy="-5.4" r="1.6"/><circle cx="1.8" cy="-5.4" r="1.6"/><circle cx="5" cy="-3" r="1.6"/></g>`;
  }
  if (half) { const k = praKit(2273, 'ink'); praScaffold(k, 52, 128, 30, 150); s += k.svg(); }
  if (stage === 'plan') s += praStake(16, 196) + praStake(164, 196);
  return s;
}
/* ---- the bandstand: a round platform, four white posts, a striped scalloped roof and a flag ---- */
function praBandstand(stage) {
  const done = stage === 'done', half = stage === 'half';
  const low = praKit(527, stage === 'plan' ? 'plan' : 'ink');
  low.shape([[8, 162], [132, 162], [126, 186], [14, 186]], PRA_C.wood); low.shape(praEll(70, 162, 62, 10), PRA_C.woodD, { w: 2 });
  [22, 52, 88, 118].forEach((x) => low.shape(praRect(x - 3.5, 80, 7, 82), PRA_C.white, { w: 2 }));
  low.line([[18, 132], [122, 132]], { c: PRA_C.ink, w: 2 }); // the railing
  [34, 46, 64, 76, 100, 110].forEach((x) => low.line([[x, 132], [x, 160]], { w: 1.6 }));
  const roof = praKit(5271, done ? 'ink' : 'plan');
  roof.shape([[70, 22], [134, 76], [6, 76]], PRA_C.red);
  roof.line([[70, 22], [50, 76]], { c: PRA_C.redD, w: 2 }); roof.line([[70, 22], [90, 76]], { c: PRA_C.redD, w: 2 }); roof.line([[70, 22], [28, 76]], { c: PRA_C.redD, w: 1.8 }); roof.line([[70, 22], [112, 76]], { c: PRA_C.redD, w: 1.8 });
  const sc = [[6, 76], [134, 76]]; for (let i = 8; i > 0; i--) { const x = 6 + i * 16; sc.push([x - 8, 87]); if (i > 1) sc.push([x - 16, 80]); } roof.shape(sc, PRA_C.white, { w: 1.8, amp: 0.4 }); // the scalloped trim
  roof.line([[70, 22], [70, 6]], { w: 2 }); roof.shape([[70, 6], [88, 11], [70, 16]], PRA_C.yellow, { w: 1.8 });
  let s = low.svg();
  if (half) { const k = praKit(5272, 'ink'); k.line([[70, 24], [10, 78]], { c: PRA_C.woodD, w: 3 }); k.line([[70, 24], [130, 78]], { c: PRA_C.woodD, w: 3 }); k.line([[70, 24], [70, 80]], { c: PRA_C.woodD, w: 3 }); s += roof.svg().replace(/stroke="#A8968A"/g, `stroke="${PRA_C.graph}"`) + k.svg(); const k2 = praKit(5273, 'ink'); praScaffold(k2, 4, 136, 30, 186); s += k2.svg(); }
  else s += roof.svg();
  if (done) { // bunting between the posts
    const b = praKit(5274, 'ink'); b.line([[10, 82], [40, 96], [70, 86], [100, 96], [130, 82]], { w: 1.6 });
    [[20, 87, PRA_C.yellow], [34, 93, PRA_C.mint], [52, 92, PRA_C.lav], [82, 92, PRA_C.pink], [100, 94, PRA_C.yellow], [116, 88, PRA_C.mint]].forEach(([x, y, c]) => b.shape([[x - 5, y - 2], [x + 5, y - 1], [x, y + 9]], c, { w: 1.4, amp: 0.4 }));
    s += b.svg();
  }
  if (stage === 'plan') s += praStake(4, 188) + praStake(136, 188);
  return s;
}
/* ---- a sakura tree: the trunk, branches and a blossom crown that follows the season ---- */
function praSakura(stage, season, seed) {
  const sd = 9300 + (seed || 0), done = stage === 'done', half = stage === 'half';
  if (stage === 'plan') { const k = praKit(sd, 'plan'); k.shape(praEll(70, 72, 60, 48, 12), ''); k.line([[70, 120], [70, 196]]); return k.svg() + praStake(70, 198); }
  const k = praKit(sd, 'ink');
  if (half) { // a young tree tied to two stakes, with a ring of new paving
    k.shape(praEll(70, 192, 34, 8), PRA_C.stoneD, { w: 1.8 });
    k.shape([[66, 192], [74, 192], [72, 120], [68, 120]], PRA_C.trunk, { w: 2 });
    k.line([[70, 140], [54, 118]], { w: 2 }); k.line([[70, 132], [88, 112]], { w: 2 });
    k.shape(praEll(58, 112, 14, 10), season === 'winter' ? PRA_C.white : season === 'autumn' ? PRA_C.orange : season === 'summer' ? PRA_C.leaf : PRA_C.pink, { w: 1.8 });
    k.shape(praEll(86, 106, 16, 11), season === 'winter' ? PRA_C.white : season === 'autumn' ? PRA_C.red : season === 'summer' ? PRA_C.leaf : PRA_C.pink, { w: 1.8 });
    [48, 92].forEach((x) => { k.shape(praRect(x - 2.5, 130, 5, 64), PRA_C.wood, { w: 1.6 }); k.line([[x, 150], [70, 154]], { c: PRA_C.woodD, w: 1.6 }); });
    return k.svg();
  }
  k.shape([[62, 198], [78, 198], [76, 130], [90, 96], [84, 92], [72, 118], [60, 90], [53, 95], [64, 130]], PRA_C.trunk, { w: 2.2 });
  const crown = season === 'winter' ? null : season === 'summer' ? [PRA_C.leaf, PRA_C.leafD] : season === 'autumn' ? [PRA_C.orange, PRA_C.red] : [PRA_C.pink, PRA_C.pinkD];
  if (!crown) { // bare branches with a little snow on top
    k.line([[60, 92], [34, 60]], { w: 2.2 }); k.line([[84, 94], [108, 56]], { w: 2.2 }); k.line([[72, 110], [72, 46]], { w: 2.2 }); k.line([[44, 72], [30, 74]], { w: 1.8 }); k.line([[100, 68], [116, 70]], { w: 1.8 });
    [[34, 58, 9], [108, 54, 9], [72, 44, 8]].forEach(([x, y, r]) => k.shape([[x - r, y + 2], [x - r * 0.4, y - 3], [x + r * 0.5, y - 3], [x + r, y + 2]], PRA_C.snow, { w: 1.6, amp: 0.3 }));
    return k.svg();
  }
  [[70, 58, 44, 30], [36, 78, 30, 22], [104, 76, 30, 22], [70, 92, 40, 18]].forEach(([x, y, rx, ry], i) => k.shape(praEll(x, y, rx, ry, 14).map((p, j) => [p[0] + (j % 2 ? 3 : -2) * (i % 2 ? 1 : -1), p[1] + (j % 3 ? 2 : -2)]), crown[0], { w: 2.2 }));
  const dots = praRng(sd + 7); for (let i = 0; i < 18; i++) { const x = 20 + dots() * 100, y = 36 + dots() * 64; if (Math.hypot((x - 70) / 56, (y - 66) / 36) < 1) k.raw(`<circle cx="${praR1(x)}" cy="${praR1(y)}" r="2.6" fill="${crown[1]}"/>`); }
  return k.svg();
}
/* ---- the lighthouse: on a little rock island far out at sea; lit = the lamp glows and a beam reaches out ---- */
function praLighthouse(stage, lit) {
  const done = stage === 'done', half = stage === 'half';
  const isl = praKit(7271, stage === 'plan' ? 'plan' : 'ink');
  isl.shape([[4, 158], [14, 140], [34, 134], [58, 136], [80, 142], [88, 158]], PRA_C.rock, { w: 2 });
  isl.shape([[30, 140], [60, 140], [56, 92], [34, 92]], PRA_C.white, { w: 2 }); // the lower tower
  isl.shape([[32, 126], [58, 126], [57, 112], [33, 112]], PRA_C.red, { w: 1.6 });
  const up = praKit(7272, done ? 'ink' : 'plan');
  up.shape([[34, 92], [56, 92], [53, 50], [37, 50]], PRA_C.white, { w: 2 }); up.shape([[35, 80], [55, 80], [54, 66], [36, 66]], PRA_C.red, { w: 1.6 });
  up.shape(praRect(31, 44, 28, 6), PRA_C.woodD, { w: 1.8 }); // the gallery
  up.shape(praRect(36, 28, 18, 16), lit ? '#FFE59A' : PRA_C.glass, { w: 1.8 }); up.line([[45, 28], [45, 44]], { w: 1.4 });
  up.shape([[33, 28], [57, 28], [45, 16]], PRA_C.red, { w: 1.8 });
  let s = isl.svg() + up.svg();
  if (half) { const k = praKit(7273, 'ink'); praScaffold(k, 26, 64, 34, 136); k.line([[64, 40], [64, 8], [92, 8]], { c: PRA_C.woodD, w: 2.4 }); k.line([[88, 8], [88, 26]], { w: 1.4 }); s += k.svg(); } // a little crane
  if (stage === 'plan') s += praStake(12, 150) + praStake(80, 150);
  return s;
}
// the lit lamp's glow and the beam (the lighthouse's own local box), drawn behind the tower and kept out of its tap box; class pa-wb-glow: PawArt.tint keeps it bright at night
function praLighthouseGlow() { return `<g class="pr-glow pa-wb-glow" pointer-events="none"><circle cx="45" cy="36" r="26" fill="#FFE59A" opacity=".35"/><circle cx="45" cy="36" r="15" fill="#FFE59A" opacity=".5"/><g class="pr-beam"><path d="M45 36 L-120 18 L-120 52 Z" fill="${PRA_C.yellow}" opacity=".32"/><path d="M45 36 L210 20 L210 50 Z" fill="${PRA_C.yellow}" opacity=".22"/></g></g>`; }
const PRA_DRAW = { fountain: (st, o) => praFountain(st), bandstand: (st, o) => praBandstand(st), sakura: (st, o) => praSakura(st, o.season, 0), lighthouse: (st, o) => praLighthouse(st, o.lit) };
const PRA_BOX = { fountain: [180, 200], bandstand: [140, 190], sakura: [140, 200], lighthouse: [90, 160] };
// one build as a standalone svg (the sheet and the board)
function praSVG(id, stage, o) { const b = PRA_BOX[id]; return `<svg viewBox="-6 -6 ${b[0] + 12} ${b[1] + 12}" aria-hidden="true">${PRA_DRAW[id](stage, o || {})}</svg>`; }
// the progress drawing: the plan sketch, with the finished colours crayoned in from the bottom up to frac (0..1), crayon strokes along the top edge
function praProgressSVG(id, frac, o) {
  const b = PRA_BOX[id], f = Math.max(0, Math.min(1, frac || 0)), y = b[1] * (1 - f), cid = 'prClip' + id + Math.round(f * 1000);
  const rr = praRng(Math.round(f * 997) + 3), edge = []; for (let x = -6; x <= b[0] + 6; x += 10) edge.push(`L${x} ${praR1(y + (rr() - 0.5) * 6)}`);
  return `<svg viewBox="-6 -6 ${b[0] + 12} ${b[1] + 12}" aria-hidden="true"><defs><clipPath id="${cid}"><path d="M-6 ${b[1] + 6}${edge.join('')}L${b[0] + 6} ${b[1] + 6}Z"/></clipPath></defs>${PRA_DRAW[id]('plan', o || {})}${f > 0 ? `<g clip-path="url(#${cid})">${PRA_DRAW[id]('done', Object.assign({}, o || {}, { lit: false }))}</g>` : ''}</svg>`;
}
// the board prop: a wooden notice board on two legs, a paper sheet with the current project's progress drawing and a crayon bar
function praBoard(id, frac, allDone) {
  const k = praKit(4271, 'ink');
  k.shape(praRect(14, 54, 6, 50), PRA_C.woodD, { w: 1.8 }); k.shape(praRect(80, 54, 6, 50), PRA_C.woodD, { w: 1.8 });
  k.shape(praRect(4, 4, 92, 70), PRA_C.wood, { w: 2.4 }); k.shape(praRect(12, 10, 76, 58), PRA_C.paper, { w: 1.8 });
  k.shape([[30, 0], [70, 0], [66, 8], [34, 8]], PRA_C.red, { w: 1.8 }); // a ribbon on top
  const f = Math.max(0, Math.min(1, frac || 0));
  k.shape(praRect(18, 56, 64, 7), PRA_C.white, { w: 1.4 }); if (f > 0.02) k.raw(`<rect x="19" y="57" width="${praR1(62 * f)}" height="5" fill="${PRA_C.yellow}"/>`);
  const art = allDone ? `<g transform="translate(36 14) scale(.16)">${praFountain('done')}</g>` : id ? `<g transform="translate(${50 - PRA_BOX[id][0] * 0.21 / 2} 13) scale(.21)">${praProgressInner(id, f)}</g>` : '';
  return k.svg() + art;
}
function praProgressInner(id, f) { const b = PRA_BOX[id], y = b[1] * (1 - f); return PRA_DRAW[id]('plan', {}) + (f > 0 ? `<svg x="0" y="${praR1(y)}" width="${b[0]}" height="${praR1(b[1] - y + 1)}" viewBox="0 ${praR1(y)} ${b[0]} ${praR1(b[1] - y + 1)}" overflow="hidden">${PRA_DRAW[id]('done', {})}</svg>` : ''); }
