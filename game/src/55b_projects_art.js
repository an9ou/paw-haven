/* ======================= v2.27 "Town projects": the art (V227.md 6) =======================
   Four builds (fountain, bandstand, sakura, lighthouse), each in three stages: 'plan' (a dashed pencil sketch), 'half' (half built, with
   wooden scaffolding) and 'done' (finished), plus the project board prop and the progress drawing of the sheet. Pencil-world look of world/:
   ink #5B3D32, the world palette, a small seeded wobble on every line. Every colour fill uses the very same path as its outline (the line is
   drawn on top), so no fill ever leaves its outline (owner's rule, v2.15.2). Pure functions of their options: no game state, no tt().
   Local boxes (x0 y0 w h; the feet / base at the bottom middle):
     fountain   0 0 192 230   bandstand 0 0 140 190   sakura 0 0 140 200   lighthouse 0 0 90 160   board 0 0 100 104 */
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
// crisp corners: two points close to every corner, so the smoothing of praPath keeps a tower a tower (not a capsule)
const praSharp = (P, d) => { const out = [], e = d || 1.6; P.forEach((p, i) => { const q = P[(i + 1) % P.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, u = Math.min(e, L / 3) / L; out.push(p, [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u], [q[0] - (q[0] - p[0]) * u, q[1] - (q[1] - p[1]) * u]); }); return out; };
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
function praScaffold(k, x0, x1, y0, y1, ladX) {
  const W = PRA_C.wood;
  [x0, x1].forEach((x) => k.shape(praRect(x - 3, y0, 6, y1 - y0), W, { w: 1.8 }));
  for (let y = y0 + 18; y < y1 - 6; y += 34) k.shape(praRect(x0 - 4, y, x1 - x0 + 8, 5), W, { w: 1.6 });
  k.line([[x0 + 2, y0 + 22], [x1 - 2, y0 + 52]], { c: PRA_C.woodD, w: 2 }); // a diagonal brace
  const lx = ladX == null ? x1 + 8 : ladX; k.line([[lx, y1], [lx + 6, y0 + 30]], { c: PRA_C.woodD, w: 2 }); k.line([[lx + 14, y1], [lx + 20, y0 + 30]], { c: PRA_C.woodD, w: 2 });
  for (let y = y1 - 12; y > y0 + 34; y -= 14) { const t = (y1 - y) / (y1 - y0 - 30); k.line([[lx + 6 * t, y], [lx + 14 + 6 * t, y]], { c: PRA_C.woodD, w: 1.6 }); }
}
// a pink planning flag on a stake (the 'plan' stage's marker)
function praStake(x, y) { return `<g><path d="M${x} ${y} L${x} ${y - 34}" stroke="${PRA_C.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M${x} ${y - 34} L${x + 16} ${y - 29} L${x} ${y - 23} Z" fill="${PRA_C.pinkD}" stroke="${PRA_C.ink}" stroke-width="1.8" stroke-linejoin="round"/></g>`; }

// a soft ground shadow under a build's feet (world units; as the scenes' own shadeA): the build stands ON the paving
function praShade(x, y, rx, ry) { return `<ellipse cx="${praR1(x)}" cy="${praR1(y)}" rx="${praR1(rx)}" ry="${praR1(ry || rx * 0.18)}" fill="${PRA_C.ink}" opacity=".12" pointer-events="none"/>`; }

/* ---- the fountain: the Square's old dog-statue fountain (Sir Splashington, world C's sqFountainB2) gains a low drinking bowl for dogs ----
   One fountain only: the project builds ONTO the old one. Local box 0 0 192 230 = world x 14..206, y 290..520 of the Town Square (PR_AT.fountain),
   so the scene draws only the new parts (praFountainAdd) right over the old fountain in the backdrop, and the sheet / board draw the whole
   fountain (praFountain: the old one in the same place, plus the new parts). praFtP maps the old fountain's own coordinates (fx 126, drawn at .85
   round world 110, 492) into the local box, so both drawings line up with the scene to the unit. */
const praFtP = (P, dy) => P.map(([x, y]) => [praR1(0.85 * x - 11.1), praR1(0.85 * (y + (dy || 0)) - 216.2)]);
const praFtE = (cx, cy, rx, ry, n) => praFtP(praEll(cx, cy, rx, ry, n));
// the new parts: a stone spout on the basin's front wall under the paw plaque, and the dogs' bowl at paw height in front of it
// mode: 'plan' (dashed sketch, two pink stakes and a string), 'half' (the bowl built and dry, the spout dashed, scaffolding round the old fountain), 'done'
function praFountainAdd(stage) {
  const done = stage === 'done', half = stage === 'half', fx = 126;
  let s = '';
  if (half) { // wooden scaffolding round the old fountain: two poles, two planks, a brace on the lower bay, a ladder leaning on the left pole
    const k = praKit(2273, 'ink'), W = PRA_C.wood;
    [4, 188].forEach((x) => k.shape(praRect(x - 3, 64, 6, 152), W, { w: 1.8 }));
    [100, 148].forEach((y) => k.shape(praRect(-1, y, 194, 5), W, { w: 1.6 }));
    k.line([[8, 106], [184, 146]], { c: PRA_C.woodD, w: 2 });
    k.line([[-14, 216], [-4, 84]], { c: PRA_C.woodD, w: 2 }); k.line([[-2, 216], [6, 92]], { c: PRA_C.woodD, w: 2 });
    for (let y = 204; y > 98; y -= 14) { const t = (216 - y) / 132; k.line([[-14 + 10 * t, y], [-2 + 8 * t, y]], { c: PRA_C.woodD, w: 1.6 }); }
    s += k.svg();
  }
  const bowl = praKit(2274, stage === 'plan' ? 'plan' : 'ink'); // the bowl: drawn (filled) once half built
  // a stone collar joins the bowl to the basin's front wall (fix batch, art review 12: the bowl read as a separate dish): the bowl hangs on the wall
  bowl.shape(praFtP([[fx - 24, 478], [fx + 24, 478], [fx + 30, 496], [fx - 30, 496]]), PRA_C.stoneD, { w: 1.8 });
  bowl.shape(praFtP([[fx - 46, 495], [fx - 42, 507], [fx, 512], [fx + 42, 507], [fx + 46, 495]]), PRA_C.stone, { w: 2 });
  bowl.shape(praFtE(fx, 494, 46, 10, 18), PRA_C.stone, { w: 2 }); bowl.shape(praFtE(fx, 494, 38, 6.5, 16), done ? PRA_C.water : PRA_C.stoneD, { w: 1.6 });
  const spout = praKit(2275, done ? 'ink' : 'plan'); // the spout: a little stone lip high on the basin's wall, under the rim
  spout.shape(praFtP([[fx - 10, 456], [fx + 10, 456], [fx + 8, 470], [fx - 8, 470]]), PRA_C.stone, { w: 1.8 });
  spout.shape(praFtE(fx, 470, 9, 3.6, 10), PRA_C.stoneD, { w: 1.6 });
  s += bowl.svg() + spout.svg();
  if (done) { // the trickle from the spout down the wall into the bowl, drops, a ripple, and a paw on the bowl's front
    const w = praKit(2276, 'ink'), P = praFtP([[fx, 472], [fx + 2, 480], [fx - 1, 487], [fx + 1, 494]]);
    w.line(P, { c: PRA_C.waterD, w: 3.6, amp: 0.3 }); w.line(P, { c: PRA_C.white, w: 1.3, amp: 0.3 });
    const q = praFtP([[fx - 26, 495], [fx - 16, 493], [fx - 8, 495]]), q2 = praFtP([[fx + 10, 496], [fx + 20, 494], [fx + 28, 496]]);
    w.line(q, { c: PRA_C.white, w: 1.4 }); w.line(q2, { c: PRA_C.white, w: 1.4 });
    const dr = praFtP([[fx - 9, 489], [fx + 10, 487]]); dr.forEach(([x, y]) => w.raw(`<circle cx="${x}" cy="${y}" r="1.7" fill="${PRA_C.water}" stroke="${PRA_C.waterD}" stroke-width=".8"/>`));
    const pc = praFtP([[fx, 505]])[0];
    s += w.svg() + `<g transform="translate(${pc[0]} ${pc[1]}) scale(.8)" fill="${PRA_C.ink}"><ellipse cx="0" cy="2" rx="4" ry="3"/><circle cx="-5" cy="-3" r="1.6"/><circle cx="-1.8" cy="-5.4" r="1.6"/><circle cx="1.8" cy="-5.4" r="1.6"/><circle cx="5" cy="-3" r="1.6"/></g>`;
  }
  if (stage === 'plan') { // the surveyor's string between two pink stakes at the basin's front corners
    s += `<path d="M10 199 Q94 206 178 199" fill="none" stroke="${PRA_C.pinkD}" stroke-width="1.4" stroke-dasharray="3 3" stroke-linecap="round"/>` + praStake(10, 216) + praStake(178, 216);
  }
  return s;
}
// the whole fountain for the sheet and the board: the old dog-statue fountain (a crayon copy of the scene's, in place) with the new parts on it
function praFountain(stage) {
  const fx = 126, k = praKit(227, stage === 'plan' ? 'plan' : 'ink'), sc = '#E3E7EA', sd = '#9FAEB9';
  k.shape(praFtE(fx, 450, 104, 26, 20), PRA_C.stone, { w: 2.2 });
  k.shape(praFtP([[fx - 104, 450], [fx + 104, 450], [fx + 100, 482], [fx + 50, 490], [fx, 492], [fx - 50, 490], [fx - 100, 482]]), PRA_C.stone, { w: 2.2 });
  k.shape(praFtE(fx, 448, 88, 17, 18), PRA_C.water, { w: 1.6 });
  k.shape(praFtP([[fx - 18, 446], [fx - 14, 386], [fx + 14, 386], [fx + 18, 446]]), PRA_C.stone, { w: 2 }); k.shape(praFtP(praRect(fx - 26, 376, 52, 12)), PRA_C.stoneD, { w: 1.8 });
  k.shape(praFtP(praRect(fx - 17, 404, 34, 18)), '#E1C47A', { w: 1.3 });
  k.line(praFtP([[fx - 24, 336], [fx - 42, 328], [fx - 48, 312], [fx - 38, 304]], 30), { w: 2.4 }); // the stone dog: tail, body, legs, head, ears, collar
  k.shape(praFtP([[fx - 28, 346], [fx - 30, 318], [fx - 20, 296], [fx + 2, 290], [fx + 18, 304], [fx + 22, 346]], 30), sc, { w: 2 });
  k.shape(praFtP([[fx - 4, 346], [fx - 2, 322], [fx + 8, 320], [fx + 10, 346]], 30), sc, { w: 1.6 }); k.shape(praFtP([[fx + 10, 346], [fx + 12, 324], [fx + 20, 326], [fx + 22, 346]], 30), sc, { w: 1.6 });
  k.shape(praFtP([[fx - 2, 298], [fx - 6, 280], [fx + 4, 264], [fx + 24, 260], [fx + 42, 268], [fx + 50, 280], [fx + 44, 292], [fx + 28, 296], [fx + 10, 300]], 30), sc, { w: 2 });
  k.shape(praFtP([[fx + 2, 270], [fx - 6, 244], [fx + 16, 262]], 30), sd, { w: 1.6 }); k.shape(praFtP([[fx + 22, 262], [fx + 30, 240], [fx + 34, 264]], 30), sd, { w: 1.6 });
  k.shape(praFtP([[fx - 4, 300], [fx + 22, 296], [fx + 24, 303], [fx - 3, 307]], 30), PRA_C.pink, { w: 1.4 });
  let s = k.svg();
  if (stage !== 'plan') { const e = praFtP([[fx + 26, 272], [fx + 49, 279]], 30), pw = praFtP([[fx, 416]])[0]; s += `<circle cx="${e[0][0]}" cy="${e[0][1]}" r="2.4" fill="${PRA_C.ink}"/><ellipse cx="${e[1][0]}" cy="${e[1][1]}" rx="3.2" ry="2.4" fill="${PRA_C.ink}"/><g transform="translate(${pw[0]} ${pw[1]}) scale(.75)" fill="${PRA_C.ink}"><ellipse cx="0" cy="2" rx="4" ry="3"/><circle cx="-5" cy="-3" r="1.6"/><circle cx="-1.8" cy="-5.4" r="1.6"/><circle cx="1.8" cy="-5.4" r="1.6"/><circle cx="5" cy="-3" r="1.6"/></g>`;
    const arc = []; for (let i = 0; i <= 8; i++) { const t = i / 8; arc.push([fx + 48 + t * 54, 288 - Math.sin(t * Math.PI * 0.62) * 30 + t * t * 156]); }
    const w = praKit(2272, 'ink'); w.line(praFtP(arc, 30), { c: PRA_C.waterD, w: 3.4, amp: 0.3 }); s += w.svg(); }
  return s + praFountainAdd(stage);
}
/* ---- the bandstand: a round platform, four white posts, a striped scalloped roof and a flag ---- */
function praBandstand(stage) {
  const done = stage === 'done', half = stage === 'half';
  const low = praKit(527, stage === 'plan' ? 'plan' : 'ink');
  // a boarded back wall behind the band (fix batch, art review 8): the toy shop's window no longer shows through the open sides, so it reads as a bandstand, not a cage
  low.shape([[16, 80], [124, 80], [124, 158], [16, 158]], PRA_C.paper, { w: 1.8 });
  if (stage !== 'plan') [100, 118, 136].forEach((y) => low.line([[18, y], [122, y + 1]], { c: PRA_C.woodD, w: 1.2 }));
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
  if (half) { const k = praKit(5272, 'ink'); k.line([[70, 24], [10, 78]], { c: PRA_C.woodD, w: 3 }); k.line([[70, 24], [130, 78]], { c: PRA_C.woodD, w: 3 }); k.line([[70, 24], [70, 80]], { c: PRA_C.woodD, w: 3 }); s += roof.svg().replace(/stroke="#A8968A"/g, `stroke="${PRA_C.graph}"`) + k.svg(); const k2 = praKit(5273, 'ink'); praScaffold(k2, 4, 136, 30, 186, 96); s += k2.svg(); } // the ladder inside the poles, so the build stays clear of the toy shop's door
  else s += roof.svg();
  if (done) { // bunting between the posts
    const b = praKit(5274, 'ink'); b.line([[10, 82], [40, 96], [70, 86], [100, 96], [130, 82]], { w: 1.6 });
    [[20, 87, PRA_C.yellow], [34, 93, PRA_C.mint], [52, 92, PRA_C.lav], [82, 92, PRA_C.pink], [100, 94, PRA_C.yellow], [116, 88, PRA_C.mint]].forEach(([x, y, c]) => b.shape([[x - 5, y - 2], [x + 5, y - 1], [x, y + 9]], c, { w: 1.4, amp: 0.4 }));
    s += b.svg();
  }
  if (stage === 'plan') s += praStake(4, 188) + praStake(136, 188);
  return s;
}
/* ---- a sakura tree: the trunk, branches and a blossom crown that follows the season ----
   leg: extra trunk (local units) under the crown, for a tall avenue tree; the box is then 140 x (200 + leg), the feet at y 198 + leg */
function praSakura(stage, season, seed, leg) {
  const L = leg || 0;
  if (L && stage !== 'done') return `<g transform="translate(0 ${L})">${praSakura(stage, season, seed, 0)}</g>`; // the plan and the young tree stand on the ground
  const sd = 9300 + (seed || 0), half = stage === 'half';
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
  const B = 198 + L, wt = L ? 1.12 : 1; // a tall tree's trunk is a little thicker at the foot
  k.shape([[70 - 8 * wt, B], [70 + 8 * wt, B], [76, 130], [90, 96], [84, 92], [72, 118], [60, 90], [53, 95], [64, 130]], PRA_C.trunk, { w: 2.2 });
  if (L) k.line([[67, B - 18], [68, B - L * 0.6]], { c: PRA_C.trunkD, w: 1.4, op: 0.7 }); // bark
  const crown = season === 'winter' ? null : season === 'summer' ? [PRA_C.leaf, PRA_C.leafD] : season === 'autumn' ? [PRA_C.orange, PRA_C.red] : [PRA_C.pink, PRA_C.pinkD];
  if (!crown) return k.svg() + praWinterBranches(sd);
  [[70, 58, 44, 30], [36, 78, 30, 22], [104, 76, 30, 22], [70, 92, 40, 18]].forEach(([x, y, rx, ry], i) => k.shape(praEll(x, y, rx, ry, 14).map((p, j) => [p[0] + (j % 2 ? 3 : -2) * (i % 2 ? 1 : -1), p[1] + (j % 3 ? 2 : -2)]), crown[0], { w: 2.2 }));
  const dots = praRng(sd + 7); for (let i = 0; i < 18; i++) { const x = 20 + dots() * 100, y = 36 + dots() * 64; if (Math.hypot((x - 70) / 56, (y - 66) / 36) < 1) k.raw(`<circle cx="${praR1(x)}" cy="${praR1(y)}" r="2.6" fill="${crown[1]}"/>`); }
  return k.svg();
}
// winter (fix batch, art review 9): thick forked bare branches, each a tapered bark shape with its own line, and snow lying ALONG their tops
// (a white strip on each branch's upper edge, its own pale outline, as the scenes' capLine), not round blobs at the tips
function praWinterBranches(sd) {
  const k = praKit(sd + 11, 'ink'), snow = praKit(sd + 12, 'ink');
  // [x0, y0, x1, y1, width at the foot, width at the tip]: the two main limbs from the fork, the middle leader, then their forks and twigs
  const BR = [[60, 94, 34, 58, 11, 6], [84, 96, 110, 56, 11, 6], [71, 114, 72, 46, 9, 5],
    [40, 66, 18, 50, 5.5, 2.6], [36, 60, 40, 30, 5, 2.4], [104, 64, 124, 48, 5.5, 2.6], [108, 58, 102, 30, 5, 2.4], [72, 58, 56, 34, 4.6, 2.2], [72, 54, 90, 32, 4.6, 2.2], [50, 82, 28, 80, 4, 2], [96, 82, 118, 76, 4, 2]];
  BR.forEach(([x0, y0, x1, y1, w0, w1]) => {
    const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n; // the normal
    const P = [[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]];
    k.shape(P, PRA_C.trunk, { w: 1.8, amp: 0.5 });
    const up = ny < 0 ? 1 : -1, ux = nx * up, uy = ny * up, flat = Math.abs(dx) / n, th = 2.2 + 3.6 * flat; // the upper edge; flatter branches hold more snow
    const a = [x0 + ux * w0 / 2, y0 + uy * w0 / 2], b = [x1 + ux * w1 / 2, y1 + uy * w1 / 2], t0 = 0.18, t1 = 0.96;
    const E0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], E1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1], M = [(E0[0] + E1[0]) / 2, (E0[1] + E1[1]) / 2];
    snow.shape([E0, [M[0] + ux * th * 0.2, M[1] - th * 0.9], [E1[0], E1[1] - th * 0.5], E1, [M[0], M[1] + 0.6]], PRA_C.snow, { w: 1.1, ink: '#8EA2B8', amp: 0.3 });
  });
  snow.shape([[65, 104], [72, 101], [79, 104], [72, 116]], PRA_C.snow, { w: 1.1, ink: '#8EA2B8', amp: 0.3 }); // snow in the fork
  return k.svg() + snow.svg();
}
/* ---- the lighthouse: on a little rock island far out at sea; lit = the lamp glows and a beam reaches out ----
   Drawn as a small copy of the Lighthouse Pier's own lighthouse (world C's lighthouse(): fix batch, art review 10): one tapered white tower with
   two red bands, a door, a black gallery with a railing, a yellow lantern and a red cone roof with a knob */
function praLighthouse(stage, lit) {
  const done = stage === 'done', half = stage === 'half', cx = 45;
  const isl = praKit(7271, stage === 'plan' ? 'plan' : 'ink');
  isl.shape([[4, 158], [14, 140], [34, 134], [58, 136], [80, 142], [88, 158]], PRA_C.rock, { w: 2 });
  const tw = (y) => 15 - (140 - y) / 92 * 6; // the tower's half width at height y (15 at the foot, y 140; 9 at the gallery, y 48)
  const seg = (a, b) => praSharp([[cx - tw(b), b], [cx - tw(a), a], [cx + tw(a), a], [cx + tw(b), b]]); // the tower between heights a (top) and b (foot)
  const band = (k, a, b) => k.shape(seg(a, b), PRA_C.red, { w: 1.4, amp: 0.4 });
  const up = praKit(7272, done ? 'ink' : 'plan');
  if (done) isl.shape(seg(48, 140), PRA_C.white, { w: 2, amp: 0.5 }); // one tower, foot to gallery
  else { isl.shape(seg(94, 140), PRA_C.white, { w: 2, amp: 0.5 }); up.shape(seg(48, 94), PRA_C.white, { w: 2, amp: 0.5 }); } // built up to half way; the rest a sketch
  band(isl, 112, 124); isl.shape(praSharp(praRect(cx - 4, 127, 8, 13)), PRA_C.trunk, { w: 1.4, amp: 0.3 }); // a red band, the door
  band(up, 64, 76);
  up.shape(praSharp(praRect(cx - 3, 82, 6, 7), 1), PRA_C.glass, { w: 1.2, amp: 0.3 }); // a little window
  up.shape(praSharp(praRect(cx - 13, 44, 26, 5), 1), PRA_C.ink, { w: 1.4, amp: 0.3 }); // the black gallery
  [-11, -5.5, 0, 5.5, 11].forEach((dx) => up.line([[cx + dx, 44], [cx + dx, 38]], { w: 1.1 })); up.line([[cx - 13, 38], [cx + 13, 38]], { w: 1.4 }); // its railing
  up.shape(praSharp(praRect(cx - 8, 25, 16, 13)), lit ? '#FFE59A' : PRA_C.yellow, { w: 1.8, amp: 0.4 }); up.line([[cx, 25], [cx, 38]], { w: 1.1 }); // the lantern
  up.shape(praSharp([[cx - 12, 26], [cx, 12], [cx + 12, 26]]), PRA_C.red, { w: 1.8, amp: 0.4 }); // the cone roof
  let s = isl.svg() + up.svg();
  if (done || half) s += `<circle cx="${cx}" cy="11" r="2.2" fill="${PRA_C.ink}"/>`;
  if (half) { const k = praKit(7273, 'ink'); praScaffold(k, 26, 64, 34, 136); k.line([[64, 40], [64, 8], [92, 8]], { c: PRA_C.woodD, w: 2.4 }); k.line([[88, 8], [88, 26]], { w: 1.4 }); s += k.svg(); } // a little crane
  if (stage === 'plan') s += praStake(12, 150) + praStake(80, 150);
  return s;
}
// the lit lamp's glow and the beam (the lighthouse's own local box), drawn behind the tower and kept out of its tap box; class pa-wb-glow: PawArt.tint
// keeps it bright at night. The beam is warm and pale and fades out (as the pier's own beams, world C beamGrad), not a flat grey wedge
function praLighthouseGlow() {
  const g = (id, x0, x1) => `<linearGradient id="${id}" x1="${x0}" y1="0" x2="${x1}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF0A8" stop-opacity=".85"/><stop offset=".5" stop-color="#FFE58A" stop-opacity=".38"/><stop offset="1" stop-color="#FFE58A" stop-opacity="0"/></linearGradient>`;
  return `<g class="pr-glow pa-wb-glow" pointer-events="none"><defs>${g('prBeamR', 53, 230)}${g('prBeamL', 37, -140)}</defs><circle cx="45" cy="31" r="24" fill="#FFF0A8" opacity=".3"/><circle cx="45" cy="31" r="13" fill="#FFE59A" opacity=".55"/><g class="pr-beam"><path d="M53 31 L230 12 L230 52 Z" fill="url(#prBeamR)"/><path d="M37 31 L-140 16 L-140 46 Z" fill="url(#prBeamL)" opacity=".8"/></g></g>`;
}
// the pier's own big lighthouse (world C lighthouse(k, 190)) at night once the new one is built: its keeper's window is lit too (the pane inside
// the window's frame, the cross bars drawn again on top); its lamp and beams, above the desktop's crop, are the scene's own
function praOldLight() { return `<g class="pr-oldlight pa-wb-glow" pointer-events="none"><rect x="182.6" y="210.6" width="14.8" height="18.8" fill="#FFE59A" opacity=".9"/><path d="M190 210.6V229.4M182.6 220H197.4" stroke="${PRA_C.ink}" stroke-width="2" fill="none"/></g>`; }
const PRA_DRAW = { fountain: (st, o) => praFountain(st), bandstand: (st, o) => praBandstand(st), sakura: (st, o) => praSakura(st, o.season, 0), lighthouse: (st, o) => praLighthouse(st, o.lit) };
const PRA_BOX = { fountain: [192, 230], bandstand: [140, 190], sakura: [140, 200], lighthouse: [90, 160] };
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
  const art = allDone ? `<g transform="translate(35 13) scale(.16)">${praFountain('done')}</g>` : id ? `<g transform="translate(${50 - PRA_BOX[id][0] * 0.21 / 2} 13) scale(.21)">${praProgressInner(id, f)}</g>` : '';
  return k.svg() + art;
}
function praProgressInner(id, f) { const b = PRA_BOX[id], y = b[1] * (1 - f); return PRA_DRAW[id]('plan', {}) + (f > 0 ? `<svg x="0" y="${praR1(y)}" width="${b[0]}" height="${praR1(b[1] - y + 1)}" viewBox="0 ${praR1(y)} ${b[0]} ${praR1(b[1] - y + 1)}" overflow="hidden">${PRA_DRAW[id]('done', {})}</svg>` : ''); }
