/* v2.18.3 "All in one piece" (owner, 29 Oct 2026: "make sure all dogs body part is stick together in every pose ... and avoid overlapping"):
   does every dog come out as one piece? Plain node, no browser. A test copy of dogs/pawart_dogs.js gets part markers in frame() and in the ear
   loop; each part's fills, ink strokes and ellipses are rasterised at 2x (game/v212_neck_check.js raster) and checked:
     1. ONE PIECE: the union of all body parts (tail, legs, neck, body, ruff, ears, topknot, head, muzzle and face; with an outfit, the outfit too)
        is one connected blob: no other blob over LOOSE canvas px^2. Motion lines, hearts, drops, notes, zz, words and the expression marks
        (drawFx, wetDrops, the expression fx layer) are not body parts and are left out; so are tears and drool drops (face blobs under DROP px^2).
     2. ATTACHED: each leg (and the sitting haunch) is one piece and touches the body; the tail touches the body (or a hind leg / haunch);
        each ear and the topknot touch the skull (an ear's colour reaches into the skull's, not only the two ink lines meeting); the head touches the body or the neck.
     3. NOT A NOODLE: a leg's length outside the body (its hull) is at most NOODLE x the same leg's whole length, hip to foot, when the dog stands (idle),
        so a pose never stretches a short leg into a long thin noodle; leaping (jump), a leg reaches no further than the breed's own leg.
   Usage: node dogs/connect_check.js [keys]   env: WET=1 (only wet), DRY=1 (only dry), OUTFITS=1 (the outfit set), POSES=a,b, AGES=adult,puppy,
     K=0 (one animation frame), JSON=file (write every failure), SRC=file (check another copy of the art, e.g. the one on main), SHARD=i/n (internal). Prints "connect_check: N renders, F failures"; exit 1 on any. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), os = require('os');
const POSES = ['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift','paw','down','rollover','playdead','speak','dance','bow','scratch','sniff','yawn','howl'];
const OUTFITS = [{ head: 'Party Hat', neck: 'Red Bandana' }, { body: 'Superhero Cape' }, { body: 'Yellow Raincoat' }, { body: 'Knit Winter Sweater' }, { body: 'Tutu' }, { body: 'Ghost Sheet' },
  { body: 'Little Witch Hat & Cape' }, { body: 'Scarecrow Overalls' }, { body: 'Mummy Wraps' }, { body: 'Dinosaur Hood' }, { body: 'Little Owl Wings' }, { body: 'Bat Wings' }, { body: 'Cozy Hoodie' },
  { head: 'Astronaut Helmet' }, { neck: 'Lion Mane' }, { body: 'Pumpkin Patch Suit' }, { body: 'Little Bat Costume' }];
const LOOSE = 3, DROP = 40, BIT = 15, TOUCH = 2, NOODLE = 1.35, NOODLE_MIN = 8; // canvas px^2, px^2 (a tear, a drop of drool), px^2 (a costume's own bit: a straw, a star), px^2, ratio, px (a stub this short is never a noodle)
const MK = [// [anchor in frame(), part that starts there]
  ["  if(body==='Superhero Cape')drawCape(h,s,L,B);", 'outfit'], ['  drawTail(h,s,L,B);\n', 'tail'], ["  if(body==='Tutu'){h._legSkip", 'legs'],
  ['  // neck: a short tube from the chest to the head, behind the body\n', 'neck'], ['  h.shape(bp.map(B),s.col,', 'body'],
  ["  if(body&&body!=='Superhero Cape'&&body!=='Tutu'&&!sheet)drawCoat", 'outfit'], ['  drawHaunch(h,s,L,B);\n', 'legs'], ["  if(body==='Tutu')drawCoat", 'outfit'],
  ["  if(L.paw){h._legPass='raised'", 'legs'], ['  if(s.ruff&&!sheet)drawRuff', 'ruff'], ['  if(neck&&RUFF2[neck]', 'outfit'], ['  if(!sheet)drawEars(h,s,L,HT,false);', 'ears'],
  ['  if(s.topknot&&!hat&&', 'topknot'], ['  {const hf=s.hfluff===undefined', 'head'], ['  {const a0=h.acc.length;drawFace(h,s,L,HT);', 'face'],
  ["  if(eyes&&pose!=='sleep'&&!sheet)", 'outfit'], ['  if(!sheet)drawEars(h,s,L,HT,true);', 'ears'], ["  if(body==='Ghost Sheet'){drawGhost", 'outfit'],
  ['  if(s.wet)wetDrops(h,s,L,B,HT,bp,hp,k,', 'fx'], ['  return {h,L};\n}\n// marks draw on both body and head', 'end']];
const EAR = ['    let p=earPose(s,L,e);\n', "h.acc.push('<!--P:ear-->');"];
function load(src) {
  for (const [a, part] of MK) { if (src.split(a).length !== 2) throw new Error('connect_check: anchor not found once: ' + a.trim()); src = src.replace(a, `h.acc.push('<!--P:${part}-->');` + a); }
  if (src.split(EAR[0]).length !== 2) throw new Error('connect_check: ear anchor'); src = src.replace(EAR[0], EAR[1] + EAR[0]);
  src = src.replace('PA.dog=dog;', 'PA.dog=dog;PA._cc={frame,specFor,layout,bodyPts,headPts,hull,T,hashS,NBSLEEP,GY,SP,KEYS,wetSpec};');
  const sb = { window: {} }; vm.createContext(sb); vm.runInContext(src, sb); return sb.window.PawArt._cc;
}
const K = 2, OX = 60, OY = 60, GW = (240 + 2 * OX) * K, GH = (200 + 2 * OY) * K;
// raster: like game/v212_neck_check.js, into a bounding-boxed bitmap (paths with M/L/Z, ellipses; the faint crayon streaks are skipped)
function raster(items) {
  const m = new Uint8Array(GW * GH), put = (x, y) => { if (x >= 0 && y >= 0 && x < GW && y < GH) m[y * GW + x] = 1; };
  for (const s of items) {
    if (/ opacity="0?\.[0-5]/.test(s)) continue;
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
    if (fill && fill[1] !== 'none') for (const P of subs) {
      if (P.length < 3) continue; let y0 = 1e9, y1 = -1e9; P.forEach((p) => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      for (let y = Math.ceil(y0); y <= y1; y++) { const xs = [];
        for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); }
        xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i]); x <= xs[i + 1]; x++) put(x, y); }
    }
    if (sw && /stroke="(?!none)/.test(s)) { const r = +sw[1] * K / 2;
      for (const P of subs) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[Math.min(i + 1, P.length - 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
        for (let y = Math.floor(Math.min(a[1], b[1]) - r); y <= Math.max(a[1], b[1]) + r; y++) for (let x = Math.floor(Math.min(a[0], b[0]) - r); x <= Math.max(a[0], b[0]) + r; x++) {
          let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; if ((x - a[0] - t * dx) ** 2 + (y - a[1] - t * dy) ** 2 <= r * r) put(x, y); } }
    }
  }
  return m;
}
// connected components (8-neighbour) of a bitmap: returns { lab: Int32Array, sizes: [] }
function comps(m) {
  const lab = new Int32Array(m.length), sizes = [0], st = [];
  for (let i = 0; i < m.length; i++) { if (!m[i] || lab[i]) continue; const id = sizes.length; let n = 0; lab[i] = id; st.push(i);
    while (st.length) { const j = st.pop(); n++; const x = j % GW, y = (j - x) / GW;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue; const k = Y * GW + X; if (m[k] && !lab[k]) { lab[k] = id; st.push(k); } } }
    sizes.push(n); }
  return { lab, sizes };
}
const isFill = (q) => / fill="(?!none)/.test(q) && !/ stroke=/.test(q), AREA = K * K, over = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] && b[i]) n++; return n / AREA; };
const or = (...ms) => { const m = new Uint8Array(GW * GH); ms.forEach((x) => { if (x) for (let i = 0; i < m.length; i++) if (x[i]) m[i] = 1; }); return m; };
const any = (m) => { for (let i = 0; i < m.length; i++) if (m[i]) return true; return false; };
// split a frame's acc into parts: { name -> [svg strings] }, legs by their pa-d-leg-ID group, ears one by one
function split(acc) {
  const P = {}; let cur = 'pre', leg = null, ear = 0;
  for (const s of acc) {
    const mk = /^<!--P:(\w+)-->$/.exec(s); if (mk) { cur = mk[1] === 'ear' ? 'ear' + (ear++) : mk[1]; if (/^ears$/.test(cur)) cur = 'pre_ears'; continue; }
    const g = /^<g class="pa-d-leg pa-d-leg-(\w+)">$/.exec(s); if (g) { leg = 'leg' + g[1]; continue; }
    if (leg && s === '</g>') { leg = null; continue; }
    const k = leg || cur; (P[k] = P[k] || []).push(s);
  }
  return P;
}
function checker(src) {
  const G = load(src);
  // the length of a leg's centre line (hip, mid, foot) outside the body outline (canvas px)
  const inside = (p, Q) => { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const a = Q[i], b = Q[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const outLen = (l, Q) => { if (!l.foot) return 0; const C = [l.hip, l.mid || [(l.hip[0] + l.foot[0]) / 2, (l.hip[1] + l.foot[1]) / 2], l.foot]; let n = 0;
    for (let i = 0; i < 2; i++) { const a = C[i], b = C[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]), st = Math.max(1, Math.ceil(d)); for (let j = 0; j < st; j++) { const t = (j + .5) / st; if (!inside([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], Q)) n += d / st; } } return n; };
  const standLen = {};
  function one(key, o) {
    const so = { pose: o.pose }; if (o.age) so.age = o.age; if (o.mix) so.mix = { head: o.mix }; if (o.coat) so.coat = o.coat;
    let s = G.specFor(key, so).s; if (o.wet) { s = G.wetSpec ? G.wetSpec(s) : s; }
    const p = o.age === 'newborn' ? (G.NBSLEEP.test(o.pose) ? 'sleep' : 'down') : o.pose;
    const F = G.frame(key, s, p, o.outfit || null, o.k || 0, G.hashS('pa' + key + p) * 5 + 3, o.expr || null), L = F.L;
    let acc = F.h.acc; if (s.pup) { const SW = s.pup === 2 ? 1.5 : 1.3; acc = acc.map((q) => q.replace(/stroke-width="([\d.]+)"/g, (z, v) => `stroke-width="${v * SW}"`)); }
    const P = split(acc), R = {}; Object.keys(P).forEach((k) => { if (k !== 'fx' && k !== 'end' && k !== 'pre' && k !== 'pre_ears') R[k] = raster(P[k]); });
    const fails = [], body = or(R.body), skull = or(R.head), headAll = or(R.head, R.face, R.topknot, ...Object.keys(R).filter((k) => /^ear/.test(k)).map((k) => R[k]));
    // 1. one piece. Face blobs under DROP (tears, drool) and outfit pieces are allowed on their own only when they are not dog parts.
    const dogKeys = Object.keys(R).filter((k) => k !== 'outfit'), U = or(...dogKeys.map((k) => R[k]), R.outfit), C = comps(U);
    let main = 1; for (let i = 1; i < C.sizes.length; i++) if (C.sizes[i] > C.sizes[main]) main = i;
    for (let i = 1; i < C.sizes.length; i++) { if (i === main || C.sizes[i] / AREA <= LOOSE) continue;
      const who = new Set(); for (let j = 0; j < U.length; j++) if (C.lab[j] === i) for (const k of Object.keys(R)) if (R[k][j]) who.add(k);
      const w = [...who]; if (w.length === 1 && w[0] === 'face' && C.sizes[i] / AREA < DROP) continue; // a tear or a drop of drool
      if (w.length === 1 && w[0] === 'outfit') { if (C.sizes[i] / AREA <= BIT) continue; fails.push('loose outfit piece ' + (C.sizes[i] / AREA).toFixed(0) + 'px'); continue; }
      fails.push('loose ' + w.join('+') + ' ' + (C.sizes[i] / AREA).toFixed(0) + 'px'); }
    // 2. attached
    const hind = or(R.legFH, R.legNH), bodyish = or(body, R.neck);
    for (const k of Object.keys(R)) {
      if (/^leg/.test(k)) { const c = comps(R[k]), big = c.sizes.filter((z, i) => i && z / AREA > LOOSE).length; if (big > 1) fails.push(k + ' in ' + big + ' pieces');
        if (over(R[k], body) < TOUCH) fails.push(k + ' off the body'); }
      else if (/^ear/.test(k)) { const v = over(R[k], or(skull, R.topknot)), vf = over(raster(P[k].filter(isFill)), raster((P.head || []).concat(P.topknot || []).filter(isFill)));
        if (v < TOUCH || vf < 1) fails.push(k + ' off the head (' + v.toFixed(1) + ' px^2 ink, ' + vf.toFixed(1) + ' px^2 fill)'); }
      else if (k === 'topknot') { if (over(R[k], skull) < TOUCH) fails.push('topknot off the head'); }
      else if (k === 'tail') { if (over(R[k], or(body, hind)) < TOUCH) fails.push('tail off the body'); }
      else if (k === 'neck') { if (over(R[k], body) < TOUCH || over(R[k], headAll) < TOUCH) fails.push('neck not joining'); }
    }
    const joined = !fails.some((x) => /^loose/.test(x)); // a costume (hood, sheet) may hold the head on: it is then one piece with the body
    if (any(skull) && over(headAll, or(bodyish, R.ruff)) < TOUCH && !(R.outfit && joined && over(R.outfit, headAll) >= TOUCH && over(R.outfit, bodyish) >= TOUCH)) fails.push('head off the body');
    // 3. not a noodle (adult scale; standing lengths from the same spec in idle)
    const BQ = G.hull(G.bodyPts(s).map(G.T(L.bT))), sk = key + '|' + (o.age || '') + '|' + (o.mix || '') + '|' + (o.wet ? 1 : 0);
    if (!standLen[sk]) { const L0 = G.layout(s, 'idle', 0), Q0 = G.bodyPts(s).map(G.T(L0.bT)); standLen[sk] = {}; L0.legs.forEach((l) => { standLen[sk][l.id] = l.foot ? Math.hypot(l.foot[0] - l.hip[0], l.foot[1] - l.hip[1]) : 0; }); }
    L.legs.forEach((l) => { if (!l.foot) return; const n = outLen(l, BQ), n0 = standLen[sk][l.id] || 1; if (n > NOODLE_MIN && n > n0 * NOODLE) fails.push(`noodle leg${l.id} ${n.toFixed(0)}px vs ${n0.toFixed(0)} standing`);
      const d = Math.hypot(l.foot[0] - l.hip[0], l.foot[1] - l.hip[1]); if (p === 'jump' && d > n0 * 1.02 + .5) fails.push(`leaping leg${l.id} ${d.toFixed(0)}px vs ${n0.toFixed(0)} standing`); });
    return fails;
  }
  return { one, G };
}
function cases(keys) {
  const ages = (process.env.AGES || 'adult,puppy,newborn').split(','), poses = process.env.POSES ? process.env.POSES.split(',') : POSES, ks = process.env.K ? [+process.env.K] : [0, 1, 2];
  const wets = process.env.WET ? [true] : process.env.DRY ? [false] : [false, true], C = [];
  keys.forEach((key, ki) => {
    ages.forEach((age) => (age === 'newborn' ? ['sleep', 'down'] : poses).forEach((pose) => wets.forEach((wet) => ks.forEach((k) => {
      if (process.env.OUTFITS) { OUTFITS.forEach((of, oi) => { if ((oi + ki + POSES.indexOf(pose)) % 3 === 0) C.push({ key, o: { pose, age: age === 'adult' ? null : age, wet, k, outfit: of } }); }); }
      else C.push({ key, o: { pose, age: age === 'adult' ? null : age, wet, k } }); }))));
    if (!process.env.OUTFITS && !process.env.POSES) ['idle', 'sit', 'beg', 'jump'].forEach((pose, i) => C.push({ key, o: { pose, mix: keys[(ki + 3 + i * 5) % keys.length], age: i % 2 ? 'puppy' : null, k: 0 } }));
  });
  return C;
}
module.exports = { checker, cases, POSES, OUTFITS };
if (require.main === module) {
  const src = fs.readFileSync(process.env.SRC || path.join(__dirname, 'pawart_dogs.js'), 'utf8');
  if (!process.env.SHARD) {
    const keys = process.argv[2] ? process.argv[2].split(',') : null, n = Math.max(1, Math.min(4, os.cpus().length)); let done = 0, tot = 0, all = [];
    for (let i = 0; i < n; i++) { const c = cp.fork(__filename, process.argv.slice(2), { env: Object.assign({}, process.env, { SHARD: i + '/' + n }), silent: true }); let out = '';
      c.stdout.on('data', (d) => out += d); c.stderr.on('data', (d) => process.stderr.write(d));
      c.on('exit', () => { const m = /^RESULT (.*)$/m.exec(out); if (!m) { all.push({ crash: i }); } else { const r = JSON.parse(m[1]); tot += r.n; all = all.concat(r.f); }
        if (++done < n) return;
        if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(all, null, 1));
        const by = {}; all.forEach((f) => { const t = f.crash !== undefined ? 'crash' : `${f.key} ${f.o.pose}${f.o.age ? ' ' + f.o.age : ''}${f.o.mix ? ' mix ' + f.o.mix : ''}`; (by[t] = by[t] || new Set()); (f.fails || ['shard crashed']).forEach((x) => by[t].add(x.replace(/ \d+px.*$| \(.*$/, ''))); });
        console.log(`connect_check${process.env.OUTFITS ? ' (outfits)' : ''}: ${tot} renders, ${all.length} failures (${Object.keys(by).length} breed/pose/age groups)`);
        Object.keys(by).slice(0, +(process.env.SHOW || 60)).forEach((t) => console.log('  FAIL', t, '-', [...by[t]].join(', ')));
        process.exit(all.length ? 1 : 0); }); }
  } else {
    const [si, sn] = process.env.SHARD.split('/').map(Number), C = checker(src), G = C.G, keys = process.argv[2] ? process.argv[2].split(',') : G.KEYS.slice();
    const list = cases(keys).filter((c, i) => i % sn === si); const f = [];
    list.forEach((c) => { let r; try { r = C.one(c.key, c.o); } catch (e) { r = ['ERR ' + e.message]; } if (r.length) f.push({ key: c.key, o: c.o, fails: r }); });
    console.log('RESULT ' + JSON.stringify({ n: list.length, f }));
  }
}
