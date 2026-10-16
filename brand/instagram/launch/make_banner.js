// The 3-tile banner: ONE wide picture (3104 x 1350) cut into three 1080 x 1350 tiles that overlap by 68 px.
// The profile grid shows each 4:5 post as a centre 3:4 crop (the middle 1012 px, 34 px off each side), so the three visible
// 1012 px slices touch exactly: tile i covers x = i*1012 .. i*1012+1080 of the wide picture, the grid shows i*1012+34 .. i*1012+1046.
// Each tile has its own label card, so it also reads well alone in the feed. Left tile = newest post, right tile = first post.
const path = require('path'), fs = require('fs');
const BW = 3104, BH = 1350, TILE = 1012, TW = 1080;
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, inner, PA, seeded, line, box, doodle, swash, txt, lines, tape, dog, prop, photo, rrPts, pencil, INK, PINK, PAPER, MUTED, ORANGE, PLUM, defs, svgPage, OUT, wordmark } = h;
  const rnd = seeded(2026);
  const cx = [540, 1552, 2564]; // tile centres of the visible slices (also the centre of each 1080 tile)

  // ---- sky, sun glow, clouds ----
  let g = `<defs>
    <linearGradient id="bn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7A9D8"/><stop offset=".42" stop-color="#D8B4CB"/><stop offset=".68" stop-color="#F0BFAE"/><stop offset="1" stop-color="#F8D8B2"/></linearGradient>
    <radialGradient id="bn-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE8C2" stop-opacity=".95"/><stop offset="1" stop-color="#FFE8C2" stop-opacity="0"/></radialGradient>
    <linearGradient id="bn-fuji" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9A0A0"/><stop offset="1" stop-color="#D9847F"/></linearGradient>
    <linearGradient id="bn-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CDD39B"/><stop offset="1" stop-color="#B6BF84"/></linearGradient>
    <pattern id="bn-hatch" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><path d="M0 4H26M0 17H26" stroke="#fff" stroke-width="1.6" opacity=".16"/></pattern>
    <pattern id="bn-hatchd" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(55)"><path d="M0 3H14" stroke="#5B3D32" stroke-width="1.6" opacity=".16"/></pattern>
  </defs>`;
  g += `<rect width="${BW}" height="1000" fill="url(#bn-sky)"/><rect width="${BW}" height="1000" fill="url(#bn-hatch)"/>`;
  g += `<ellipse cx="1552" cy="820" rx="900" ry="520" fill="url(#bn-glow)"/>`;
  // speckles (paper grain in the sky)
  for (let i = 0; i < 260; i++) g += `<circle cx="${f1(rnd() * BW)}" cy="${f1(rnd() * 900)}" r="${f1(1 + rnd() * 1.6)}" fill="#fff" opacity="${f1(0.18 + rnd() * 0.3)}"/>`;
  const cloud = (x, y, s, seed) => { const p = [[-90, 20], [-70, -10], [-30, -26], [10, -24], [44, -34], [84, -14], [100, 14], [60, 26], [-40, 28]].map(([a, b]) => [x + a * s, y + b * s]); const d = pencil(p, seed, 2, 3.4, INK, 1.0); return `<g><path d="M${p.map((q) => q.join(' ')).join('L')}Z" fill="#FFF3F0" opacity=".88"/>${d}</g>`; };
  g += cloud(330, 690, 1.5, 3) + cloud(2080, 640, 1.2, 5) + cloud(2860, 650, 1.4, 7) + cloud(1060, 640, 0.9, 9);
  // a few sparks and bats
  g += doodle('spark', 880, 300, 1.2) + doodle('spark', 2290, 270, 1.0) + doodle('spark', 1250, 620, 0.8) + doodle('spark', 2900, 640, 0.8) + doodle('spark', 200, 250, 0.9);
  g += doodle('bat', 2230, 640, 1.7, -8) + doodle('bat', 2400, 560, 1.2, 12) + doodle('bat', 2980, 760, 1.5, 6) + doodle('bat', 2700, 455, 1.0, -10);

  // ---- Mt. Fuji, centre of the whole picture ----
  const bez = (p0, p1, p2, p3, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0], u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]]; });
  const FX = 1552, PEAK = 648, BASE = 950;
  const left = bez([FX - 700, BASE], [FX - 430, BASE - 40], [FX - 250, PEAK + 70], [FX - 70, PEAK + 12]);
  const right = bez([FX + 70, PEAK + 12], [FX + 250, PEAK + 70], [FX + 430, BASE - 40], [FX + 700, BASE]);
  const top = [[FX - 70, PEAK + 12], [FX - 30, PEAK - 6], [FX + 30, PEAK - 6], [FX + 70, PEAK + 12]];
  const body = [...left, ...top.slice(1, -1), ...right];
  g += `<path d="M${body.map((q) => q.map(f1).join(' ')).join('L')}L${FX + 700} ${BASE + 40}L${FX - 700} ${BASE + 40}Z" fill="url(#bn-fuji)"/>`;
  g += `<path d="M${FX - 700} ${BASE + 40}L${left.map((q) => q.map(f1).join(' ')).join('L')}L${FX - 70} ${PEAK + 12}L${FX - 120} ${BASE + 40}Z" fill="#A98BB0" opacity=".55"/>`;
  g += `<path d="M${body.map((q) => q.map(f1).join(' ')).join('L')}L${FX + 700} ${BASE + 40}L${FX - 700} ${BASE + 40}Z" fill="url(#bn-hatchd)" opacity=".7"/>`;
  // snow cap with a ragged edge
  const cap = `M${FX - 125} ${PEAK + 56}Q${FX - 96} ${PEAK + 86} ${FX - 70} ${PEAK + 66}Q${FX - 48} ${PEAK + 112} ${FX - 18} ${PEAK + 78}Q${FX + 8} ${PEAK + 118} ${FX + 34} ${PEAK + 80}Q${FX + 62} ${PEAK + 104} ${FX + 82} ${PEAK + 66}Q${FX + 104} ${PEAK + 78} ${FX + 130} ${PEAK + 56}L${FX + 70} ${PEAK + 12}Q${FX} ${PEAK - 10} ${FX - 70} ${PEAK + 12}Z`;
  g += `<path d="${cap}" fill="#FFF5F3" opacity=".96"/>`;
  g += line(left, 11, 2.4, 5, INK) + line(right, 12, 2.4, 5, INK) + line(top, 13, 1.6, 4.5, INK);
  g += line([[FX - 125, PEAK + 56], [FX - 96, PEAK + 86], [FX - 70, PEAK + 66], [FX - 48, PEAK + 112], [FX - 18, PEAK + 78], [FX + 8, PEAK + 118], [FX + 34, PEAK + 80], [FX + 62, PEAK + 104], [FX + 82, PEAK + 66], [FX + 104, PEAK + 78], [FX + 130, PEAK + 56]], 14, 1.4, 3.2, INK, 0.7);
  // a few streaks down the slope
  for (let i = 0; i < 6; i++) { const x = FX - 300 + i * 120 + rnd() * 30; g += line([[x, BASE - 150 + rnd() * 40], [x - 20, BASE - 60]], 40 + i, 3, 3, '#fff', 0.35); }

  // ---- far hills, lake, bushes, meadow ----
  const hill = (y0, amp, per, ph) => { const pts = []; for (let x = -40; x <= BW + 120; x += 80) pts.push([x, y0 + Math.sin(x / per + ph) * amp + Math.sin(x / (per * 0.43) + ph * 2) * amp * 0.35]); return pts; };
  const h1 = hill(905, 26, 330, 1), h2 = hill(950, 18, 260, 3);
  const poly = (pts, bottom) => `M${pts.map((q) => q.map(f1).join(' ')).join('L')}L${BW + 40} ${bottom}L-40 ${bottom}Z`;
  g += `<path d="${poly(h1, 1010)}" fill="#C7CB9A"/>${line(h1, 21, 2, 3.6, INK, 0.8)}`;
  g += `<rect x="-40" y="962" width="${BW + 80}" height="64" fill="#BFC9E3"/>`;
  for (let i = 0; i < 40; i++) { const x = rnd() * BW, y = 972 + rnd() * 40; g += line([[x, y], [x + 18, y - 5], [x + 36, y]], 50 + i, 1, 2.4, '#fff', 0.8); }
  g += line([[-40, 962], [BW + 40, 962]], 24, 3, 3, INK, 0.6) + line([[-40, 1026], [BW + 40, 1026]], 25, 3, 3, INK, 0.6);
  for (let x = -20; x < BW + 40; x += 62 + rnd() * 30) g += `<ellipse cx="${f1(x)}" cy="${f1(1034 + rnd() * 8)}" rx="${f1(40 + rnd() * 16)}" ry="${f1(24 + rnd() * 8)}" fill="#B9C18C" stroke="${INK}" stroke-opacity=".55" stroke-width="2.6"/>`;
  g += `<path d="${poly(hill(1048, 10, 400, 5), BH)}" fill="url(#bn-grass)"/>${line(hill(1048, 10, 400, 5), 26, 2, 3.6, INK, 0.85)}`;
  g += `<rect y="1050" width="${BW}" height="300" fill="url(#bn-hatch)" opacity=".5"/>`;
  // grass tufts, flowers, leaves
  for (let i = 0; i < 150; i++) { const x = rnd() * BW, y = 1090 + rnd() * 250; g += line([[x - 6, y], [x - 2, y - 16 - rnd() * 8]], 100 + i, 1, 2.6, '#8C9A5C', 0.9) + line([[x + 4, y], [x + 4, y - 20 - rnd() * 8]], 300 + i, 1, 2.6, '#8C9A5C', 0.9); }
  for (let i = 0; i < 22; i++) g += doodle('flower', f1(rnd() * BW), f1(1130 + rnd() * 200), 0.9 + rnd() * 0.5, f1(rnd() * 60));
  for (let i = 0; i < 40; i++) g += doodle('leaf', f1(rnd() * BW), f1(1060 + rnd() * 280), 0.55 + rnd() * 0.45, f1(rnd() * 360), 1.6);

  // ---- bunting across the whole picture (continuous, behind the label cards) ----
  const anchors = [-20, 700, 1420, 2140, 2860, 3130], sag = 54, y0 = 78;
  const wireY = (x) => { for (let i = 0; i < anchors.length - 1; i++) if (x <= anchors[i + 1]) { const a = anchors[i], b = anchors[i + 1], t = (x - a) / (b - a); return y0 + sag * 4 * t * (1 - t); } return y0; };
  const wire = []; for (let x = -20; x <= 3130; x += 20) wire.push([x, wireY(x)]);
  g += line(wire, 31, 1.2, 4, INK);
  const cols = [PLUM, ORANGE, PINK, '#F2C14E', '#7FB77E'];
  for (let x = 40, i = 0; x < BW; x += 92, i++) { const yy = wireY(x), ang = (wireY(x + 10) - wireY(x - 10)) * 1.3; g += `<g transform="rotate(${f1(ang)} ${x} ${f1(yy)})"><path d="M${x - 36} ${f1(yy)}L${x + 36} ${f1(yy)}L${x} ${f1(yy + 86)}Z" fill="${cols[i % 5]}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/></g>`; }
  for (const x of [0, 700, 1420, 2140, 2860]) g += `<circle cx="${x < 0 ? 0 : x}" cy="${y0}" r="7" fill="${INK}"/>`;

  // ---- props that sit in the crowd: the torii (tile 2) and Mrs. Plum's Pumpkin Patch cart (tile 3) ----
  const toriiSvg = (cx, base) => `<g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect x="${cx - 92}" y="${base - 190}" width="26" height="190" fill="#D9534F"/><rect x="${cx + 66}" y="${base - 190}" width="26" height="190" fill="#D9534F"/><rect x="${cx - 82}" y="${base - 150}" width="174" height="20" fill="#D9534F"/><path d="M${cx - 126} ${base - 198}Q${cx} ${base - 226} ${cx + 126} ${base - 198}L${cx + 114} ${base - 176}Q${cx} ${base - 202} ${cx - 114} ${base - 176}Z" fill="#3E3A38"/></g><ellipse cx="${cx}" cy="${base + 6}" rx="130" ry="14" fill="#5B3D32" opacity=".18"/>`;

  // ---- the crowd: every dog type gets its own spot; nobody overlaps ----
  // The real outline of each dog is measured in the browser (getBBox), so sizes and gaps use the drawn dog, not its canvas.
  // Depth rows: f = front (feet y 1300), m = middle (1210), b = back (1125). Neighbours sit at different depths.
  const FEET = { f: 1296, m: 1206, b: 1122 }, HGT = { f: 285, m: 235, b: 190 }, GAPMIN = 22;
  const tiles = [
    { x0: 64, x1: 1004, items: [
      { k: 'dachs', d: 'f', tw: 360, fixed: true, pose: 'happy' }, { k: 'shiba', d: 'b', pose: 'sit' }, { k: 'golden', d: 'm', pose: 'happy' }, { k: 'mutt', d: 'b', pose: 'idle' }, { k: 'chihuahua', d: 'f', pose: 'speak' }] },
    { x0: 1094, x1: 2014, items: [
      { k: 'husky', d: 'm', pose: 'sit' }, { k: 'samoyed', d: 'f', pose: 'happy' }, { t: 'torii', d: 'b', tw: 240, fixed: true }, { k: 'collie', d: 'm', pose: 'beg' }, { k: 'frenchie', d: 'f', pose: 'idle' }] },
    { x0: 2106, x1: 3040, items: [
      { k: 'corgi', d: 'f', tw: 250, fixed: true, pose: 'happy', outfit: { head: 'Witch Hat', neck: 'Candy Corn Bandana' } }, { k: 'beagle', d: 'b', pose: 'sniff' }, { k: 'pug', d: 'm', pose: 'sit', outfit: { neck: 'Candy Corn Bandana' } }, { k: 'poodle', d: 'f', pose: 'dance' }, { t: 'cart', d: 'b', tw: 260, fixed: true }] },
  ];
  const dogsAll = tiles.flatMap((T) => T.items).filter((it) => it.k);
  for (const it of dogsAll) it.facingKey = 'x';
  // measure: draw every dog (both facings) into one page and read its bbox in the 240x200 dog canvas
  const mp = await browser.newPage();
  await mp.setContent('<body></body>');
  const bbs = await mp.evaluate((list) => list.map((it) => { const w = document.createElement('div'); w.innerHTML = it.svg; document.body.appendChild(w); const sv = w.querySelector('svg'); sv.setAttribute('width', 240); sv.setAttribute('height', 200); const b = sv.getBBox(); return [b.x, b.y, b.width, b.height]; }),
    dogsAll.flatMap((it) => ['left', 'right'].map((fc) => ({ svg: PA.dog(it.k, { pose: it.pose, outfit: it.outfit, facing: fc, anim: false }) }))));
  await mp.close();
  dogsAll.forEach((it, i) => { it.bb = { left: bbs[i * 2], right: bbs[i * 2 + 1] }; });
  const placed = [];
  for (const T of tiles) {
    const meas = T.items.map((it) => { if (it.k) { const b = it.bb.right; const k = it.tw ? it.tw / b[2] : HGT[it.d] / b[3]; return { w: b[2] * k, h: b[3] * k, k }; } return { w: it.tw, h: it.t === 'cart' ? it.tw * 0.92 : 200, k: 1 }; });
    const n = T.items.length, room = T.x1 - T.x0, fixedSum = meas.reduce((a, m, i) => a + (T.items[i].fixed ? m.w : 0), 0), flexSum = meas.reduce((a, m, i) => a + (T.items[i].fixed ? 0 : m.w), 0);
    const sc = Math.min(1, (room - GAPMIN * (n - 1) - fixedSum) / flexSum), gap = (room - fixedSum - flexSum * sc) / (n - 1);
    let x = T.x0; const mid = (T.x0 + T.x1) / 2;
    T.items.forEach((it, i) => { const q = it.fixed ? 1 : sc, m = meas[i], w = m.w * q, h = m.h * q, feet = FEET[it.d]; placed.push({ it, x, w, h, top: feet - h, feet, k: m.k * q, cx: x + w / 2, left: x + w / 2 > mid }); x += w + gap; });
    console.log('tile scale', f1(sc), 'gap', f1(gap));
  }
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) { const a = placed[i], b = placed[j]; if (a.x < b.x + b.w && b.x < a.x + a.w && a.top < b.top + b.h && b.top < a.top + a.h) console.log('OVERLAP', a.it.k || a.it.t, b.it.k || b.it.t); }
  placed.sort((a, b) => a.feet - b.feet);
  for (const p of placed) {
    const { it } = p;
    if (it.t === 'torii') { g += toriiSvg(f1(p.cx), p.feet - 10); continue; }
    if (it.t === 'cart') { g += prop('popup', { lit: true }, f1(p.x), f1(p.feet - p.h), f1(p.w), f1(p.h)); continue; }
    const b = it.bb[p.left ? 'left' : 'right'];
    g += `<ellipse cx="${f1(p.cx)}" cy="${f1(p.feet - 4)}" rx="${f1(p.w * 0.46)}" ry="${f1(p.w * 0.04)}" fill="#5B3D32" opacity=".14"/>`;
    g += `<svg x="${f1(p.x)}" y="${f1(p.top)}" width="${f1(p.w)}" height="${f1(p.h)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(PA.dog(it.k, { pose: it.pose, outfit: it.outfit, facing: p.left ? 'left' : 'right', anim: false }))}</svg>`;
  }
  console.log('dogs placed:', placed.filter((p) => p.it.k).length);

  // ---- the label cards: the game name + one short line, same size and height on every tile ----
  const CARD_Y = 232, CARD_H = 250, CARD_W = 780;
  const card = (c, seed, inner, rot = 0) => `<g transform="rotate(${rot} ${c} ${CARD_Y + CARD_H / 2})"><g filter="url(#dd-shadow)"><rect x="${c - CARD_W / 2}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="34" fill="#FFFBF2"/></g>${box(c - CARD_W / 2, CARD_Y, CARD_W, CARD_H, 34, seed, 2.6, 4.6)}${tape(c - 80, CARD_Y - 22, 160, 44, -3 + seed % 5)}${inner}</g>`;
  const named = (c, line) => wordmark(c, CARD_Y + 128, 112) + txt(line, c, CARD_Y + 214, 56, { fill: MUTED, w: 600 });
  g += card(cx[0], 41, named(cx[0], 'a cozy dog game'), -1);
  g += card(cx[1], 42, named(cx[1], 'Mt. Fuji on every skyline'), 0.6);
  g += card(cx[2], 43, named(cx[2], 'play free · link in bio'), 1);

  // ---- write: the wide picture, then the three tiles (same svg, different viewBox) ----
  const wide = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">${defs}${g}</svg>`;
  await render(wide, BW, BH, 'banner-0-wide-preview.jpg');
  const names = ['banner-1-left-newest.jpg', 'banner-2-middle.jpg', 'banner-3-right-post-first.jpg'];
  for (let i = 0; i < 3; i++) {
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${BH}" viewBox="${i * TILE} 0 ${TW} ${BH}">${defs}${g}</svg>`;
    await render(tile, TW, BH, names[i]);
  }
};
