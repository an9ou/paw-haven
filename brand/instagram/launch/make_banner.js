// The 3-tile banner: ONE wide picture (3104 x 1350) cut into three 1080 x 1350 tiles that overlap by 68 px.
// The profile grid shows each 4:5 post as a centre 3:4 crop (the middle 1012 px, 34 px off each side), so the three visible
// 1012 px slices touch exactly: tile i covers x = i*1012 .. i*1012+1080 of the wide picture, the grid shows i*1012+34 .. i*1012+1046.
// Each tile has its own label card, so it also reads well alone in the feed. Left tile = newest post, right tile = first post.
const path = require('path'), fs = require('fs');
const BW = 3104, BH = 1350, TILE = 1012, TW = 1080;
module.exports = async function ({ render, helpers: h }) {
  const { f1, seeded, line, box, doodle, swash, txt, lines, tape, dog, prop, photo, rrPts, pencil, INK, PINK, PAPER, MUTED, ORANGE, PLUM, defs, svgPage, OUT, wordmark } = h;
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

  // ---- the torii (right of Fuji, inside tile 2) ----
  const TX = 1930, TY = 1085;
  g += `<g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect x="${TX - 92}" y="${TY - 190}" width="26" height="190" fill="#D9534F"/><rect x="${TX + 66}" y="${TY - 190}" width="26" height="190" fill="#D9534F"/><rect x="${TX - 82}" y="${TY - 150}" width="174" height="20" fill="#D9534F"/><path d="M${TX - 126} ${TY - 198}Q${TX} ${TY - 226} ${TX + 126} ${TY - 198}L${TX + 114} ${TY - 176}Q${TX} ${TY - 202} ${TX - 114} ${TY - 176}Z" fill="#3E3A38"/></g>`;
  g += `<ellipse cx="${TX}" cy="${TY + 6}" rx="130" ry="14" fill="#5B3D32" opacity=".18"/>`;

  // ---- Noodle's paw trail: continuous across all three tiles ----
  for (let x = 760, i = 0; x < 2300; x += 98, i++) { const y = 1296 + (i % 2 ? 16 : -10) + Math.sin(i / 2) * 6; g += doodle('paw', x, y, 1.05, 80 + (i % 2 ? 12 : -10)); }

  // ---- bunting across the whole picture (continuous, behind the label cards) ----
  const anchors = [-20, 700, 1420, 2140, 2860, 3130], sag = 54, y0 = 78;
  const wireY = (x) => { for (let i = 0; i < anchors.length - 1; i++) if (x <= anchors[i + 1]) { const a = anchors[i], b = anchors[i + 1], t = (x - a) / (b - a); return y0 + sag * 4 * t * (1 - t); } return y0; };
  const wire = []; for (let x = -20; x <= 3130; x += 20) wire.push([x, wireY(x)]);
  g += line(wire, 31, 1.2, 4, INK);
  const cols = [PLUM, ORANGE, PINK, '#F2C14E', '#7FB77E'];
  for (let x = 40, i = 0; x < BW; x += 92, i++) { const yy = wireY(x), ang = (wireY(x + 10) - wireY(x - 10)) * 1.3; g += `<g transform="rotate(${f1(ang)} ${x} ${f1(yy)})"><path d="M${x - 36} ${f1(yy)}L${x + 36} ${f1(yy)}L${x} ${f1(yy + 86)}Z" fill="${cols[i % 5]}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/></g>`; }
  for (const x of [0, 700, 1420, 2140, 2860]) g += `<circle cx="${x < 0 ? 0 : x}" cy="${y0}" r="7" fill="${INK}"/>`;

  // ---- the three characters / props ----
  // tile 1: Noodle (feet on y 1236)
  g += swash(540, 1236, 760, 120, -2, '#FFF3DC', 0.55) + dog('dachs', { pose: 'happy' }, 130, 700, 820);
  // tile 3: Biscuit the corgi in the Witch Hat + Candy Corn Bandana, and Mrs. Plum's Pumpkin Patch Pop-up
  g += swash(2480, 1236, 700, 110, 2, '#FFF3DC', 0.55) + dog('corgi', { pose: 'happy', outfit: { head: 'Witch Hat', neck: 'Candy Corn Bandana' } }, 2140, 690, 640, '0 0 240 200');
  g += prop('popup', { lit: true }, 2700, 928, 340, 311) + prop('jackolantern', { lit: true }, 2530, 1170, 96, 96) + prop('jackolantern', { lit: true }, 2600, 1200, 70, 70);
  // tile 2: a taped photo of a real walk (the runner game)
  g += photo('walk', [0, 540, 1179, 780], 1060, 1004, 360, -4, { caption: 'take a walk', seed: 5, tape: '#FFE3A1', tapeRot: 6, pad: 12 }).replace('<g transform', '<g transform');

  // ---- the label cards (one per tile, same size and height) ----
  const CARD_Y = 222, CARD_H = 372, CARD_W = 800;
  const card = (c, seed, inner, rot = 0) => `<g transform="rotate(${rot} ${c} ${CARD_Y + CARD_H / 2})"><g filter="url(#dd-shadow)"><rect x="${c - CARD_W / 2}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="34" fill="#FFFBF2"/></g>${box(c - CARD_W / 2, CARD_Y, CARD_W, CARD_H, 34, seed, 2.6, 4.6)}${tape(c - 80, CARD_Y - 22, 160, 44, -3 + seed % 5)}${inner}</g>`;
  const kicker = (c, y) => txt('Doodle Doggo', c, y, 46, { fill: '#D8607E', w: 700 });
  g += card(cx[0], 41, kicker(cx[0], CARD_Y + 84) + txt('Meet Noodle.', cx[0], CARD_Y + 216, 140, { rot: -1.5 }) + txt('a wobbly crayon pup to love', cx[0], CARD_Y + 308, 58, { fill: MUTED, w: 600 }), -1);
  g += card(cx[1], 42, kicker(cx[1], CARD_Y + 76) + lines(['Pencil town,', 'crayon dogs.'], cx[1], CARD_Y + 178, 104, 92, { rot: -1 }) + txt('Mt. Fuji on every skyline', cx[1], CARD_Y + 338, 52, { fill: MUTED, w: 600 }), 0.6);
  g += card(cx[2], 43, kicker(cx[2], CARD_Y + 82) + txt('Play free.', cx[2], CARD_Y + 204, 140, { rot: -1.5 }) + txt('link in bio · phone or computer', cx[2], CARD_Y + 270, 50, { fill: MUTED, w: 600 })
    + `<g transform="rotate(-2 ${cx[2]} ${CARD_Y + 322})"><rect x="${cx[2] - 250}" y="${CARD_Y + 298}" width="500" height="54" rx="27" fill="${ORANGE}" stroke="${INK}" stroke-width="3.4"/>${txt('Halloween Pumpkin Patch till 2 Nov', cx[2], CARD_Y + 336, 38, { fill: '#FFF8EC', w: 700 })}</g>`, 1);

  // ---- write: the wide picture, then the three tiles (same svg, different viewBox) ----
  const wide = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">${defs}${g}</svg>`;
  await render(wide, BW, BH, 'banner-0-wide-preview.jpg');
  const names = ['banner-1-left-newest.jpg', 'banner-2-middle.jpg', 'banner-3-right-post-first.jpg'];
  for (let i = 0; i < 3; i++) {
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${BH}" viewBox="${i * TILE} 0 ${TW} ${BH}">${defs}${g}</svg>`;
    await render(tile, TW, BH, names[i]);
  }
};
