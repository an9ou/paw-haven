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

  const toriiSvg = (cx, base) => `<g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect x="${cx - 92}" y="${base - 190}" width="26" height="190" fill="#D9534F"/><rect x="${cx + 66}" y="${base - 190}" width="26" height="190" fill="#D9534F"/><rect x="${cx - 82}" y="${base - 150}" width="174" height="20" fill="#D9534F"/><path d="M${cx - 126} ${base - 198}Q${cx} ${base - 226} ${cx + 126} ${base - 198}L${cx + 114} ${base - 176}Q${cx} ${base - 202} ${cx - 114} ${base - 176}Z" fill="#3E3A38"/></g><ellipse cx="${cx}" cy="${base + 6}" rx="130" ry="14" fill="#5B3D32" opacity=".18"/>`;
  // =====================================================================================================
  // v3: a fuller scene. Scenery (trees, the game's cottage, fence, clothesline, lanterns, stone lantern), then the dogs, then the bunting and the one word box.
  // =====================================================================================================
  const dens = (pts, step = 16) => { const o = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return o; };
  const shp = (pts, fill, w = 2.8, seed = 1, amp = 1.3) => `<path d="M${pts.map((q) => q.map(f1).join(' ')).join('L')}Z" fill="${fill}"/>` + pencil(dens(pts), seed, amp, w);
  const rect = (x, y, w, hh) => [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]];
  const blob = (cx0, cy0, rx, ry, fill, seed, w = 3) => { const r2 = seeded(seed), pts = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, j = 0.9 + r2() * 0.2; pts.push([cx0 + Math.cos(a) * rx * j, cy0 + Math.sin(a) * ry * j]); } return shp(pts, fill, w, seed, 1.6); };
  const propB = (name, o, x, base, w) => { const sv = PA.prop(name, o || {}), vb = /viewBox="([^"]+)"/.exec(sv)[1].split(' ').map(Number), hh = w * vb[3] / vb[2]; return `<svg x="${f1(x)}" y="${f1(base - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${vb.join(' ')}" overflow="visible">${inner(sv)}</svg>`; };
  // an autumn tree like the game's: three orange lobes on a brown trunk
  const tree = (x, base, s, seed) => shp([[x - 16 * s, base], [x - 11 * s, base - 140 * s], [x + 11 * s, base - 140 * s], [x + 18 * s, base]], '#B98F68', 3, seed)
    + blob(x - 62 * s, base - 160 * s, 62 * s, 54 * s, '#F7D26E', seed + 1) + blob(x + 62 * s, base - 168 * s, 64 * s, 56 * s, '#F2B55A', seed + 2) + blob(x, base - 215 * s, 78 * s, 66 * s, '#EBA23E', seed + 3)
    + [[-30, -190], [40, -230], [-70, -150], [70, -160], [10, -170]].map(([a, b], i) => `<circle cx="${f1(x + a * s)}" cy="${f1(base + b * s)}" r="${f1(7 * s)}" fill="#F49090" stroke="${INK}" stroke-width="2.4"/>`).join('')
    + line([[x - 40 * s, base - 200 * s], [x - 20 * s, base - 215 * s]], seed + 4, 1, 3, '#B8781E', 0.8) + line([[x + 30 * s, base - 250 * s], [x + 52 * s, base - 240 * s]], seed + 5, 1, 3, '#B8781E', 0.8);
  // the game's cottage (shapes from world A, drawn in a local frame: wall bottom y=400, left x=14)
  const cottage = (xl, base, S) => {
    const cx0 = 40, cy0 = 170, wd = '#F4E0BF', win = (x, y, w, hh, cur, box) => shp(rect(x, y, w, hh), '#FFFDF5', 2.2, 11) + shp(rect(x + 5, y + 5, w - 10, hh - 10), '#CFE6EE', 1.8, 12) + `<path d="M${x + w / 2} ${y + 5}V${y + hh - 5}M${x + 5} ${y + hh / 2}H${x + w - 5}" stroke="${INK}" stroke-width="1.8"/>` + shp([[x + 5, y + 5], [x + w * 0.35, y + 5], [x + w * 0.2, y + hh - 5], [x + 5, y + hh - 5]], cur, 1.6, 13) + shp([[x + w - 5, y + 5], [x + w * 0.65, y + 5], [x + w * 0.8, y + hh - 5], [x + w - 5, y + hh - 5]], cur, 1.6, 14) + (box ? shp(rect(x - 4, y + hh, w + 8, 10), '#C9A27A', 1.8, 15) + [0, 1, 2, 3, 4].map((k) => `<circle cx="${x + 6 + k * (w - 4) / 4.5}" cy="${y + hh - 2}" r="5" fill="${['#F28FA5', '#FFE3A1', '#F9D0D9', '#FFE3A1', '#F28FA5'][k]}" stroke="${INK}" stroke-width="1.4"/>`).join('') : '');
    let g2 = shp([[cx0 + 170, cy0 + 20], [cx0 + 170, cy0 - 30], [cx0 + 196, cy0 - 30], [cx0 + 196, cy0 + 30]], '#D9736B', 2.4, 21);
    g2 += [[0, -10], [8, -28], [18, -46]].map((q) => `<path d="M${cx0 + 183 + q[0]} ${cy0 - 36 + q[1]}q-7 -8 3 -16" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".6"/>`).join('');
    g2 += shp(rect(cx0, cy0 + 60, 250, 170), wd, 2.6, 22);
    for (let y = cy0 + 80; y < cy0 + 225; y += 18) g2 += `<path d="M${cx0 + 6} ${y}H${cx0 + 244}" stroke="#E2C29E" stroke-width="1.2"/>`;
    g2 += shp([[cx0 - 26, cy0 + 66], [cx0 + 125, cy0 - 40], [cx0 + 276, cy0 + 66]], '#E8918A', 2.8, 23);
    for (let row = 0; row < 5; row++) { const y = cy0 - 14 + row * 17, half = (y - cy0 + 40) * 1.42; let d = ''; for (let x = cx0 + 125 - half + 10; x < cx0 + 125 + half - 12; x += 16) d += `M${x} ${y}q8 9 16 0`; g2 += `<path d="${d}" fill="none" stroke="#C97B72" stroke-width="1.6" stroke-linecap="round"/>`; }
    g2 += win(cx0 + 105, cy0 + 8, 40, 40, '#FFC9D3') + win(cx0 + 30, cy0 + 100, 62, 56, '#FFC9D3', true) + win(cx0 + 165, cy0 + 100, 58, 52, '#CDEBD8');
    g2 += shp([[cx0 + 108, cy0 + 230], [cx0 + 108, cy0 + 132], [cx0 + 122, cy0 + 120], [cx0 + 138, cy0 + 120], [cx0 + 152, cy0 + 132], [cx0 + 152, cy0 + 230]], '#B9D3F2', 2.4, 24)
      + `<circle cx="${cx0 + 144}" cy="${cy0 + 180}" r="3.4" fill="${INK}"/>` + `<path d="M${cx0 + 130} ${cy0 + 158}C${cx0 + 114} ${cy0 + 146} ${cx0 + 118} ${cy0 + 132} ${cx0 + 130} ${cy0 + 140}C${cx0 + 142} ${cy0 + 132} ${cx0 + 146} ${cy0 + 146} ${cx0 + 130} ${cy0 + 158}Z" fill="#F28FA5" stroke="${INK}" stroke-width="1.8"/>`
      + shp(rect(cx0 + 100, cy0 + 228, 60, 8), '#CFCBC4', 1.8, 25);
    return `<g transform="translate(${f1(xl - 14 * S)} ${f1(base - 400 * S)}) scale(${S})">${g2}</g>`;
  };
  const fence = (x0, x1, base, hh) => { let g2 = ''; for (let x = x0; x < x1; x += 46) g2 += `<path d="M${x} ${base}V${base - hh + 18}Q${x} ${base - hh} ${x + 21} ${base - hh}Q${x + 42} ${base - hh} ${x + 42} ${base - hh + 18}V${base}Z" fill="#E8CFA2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${x + 10} ${base - hh + 30}V${base - 8}" stroke="#C9A878" stroke-width="2" opacity=".7"/>`; return g2 + `<rect x="${x0}" y="${base - hh * 0.72}" width="${x1 - x0}" height="14" fill="#D9B880" stroke="${INK}" stroke-width="2.6"/><rect x="${x0}" y="${base - hh * 0.3}" width="${x1 - x0}" height="14" fill="#D9B880" stroke="${INK}" stroke-width="2.6"/>`; };
  const lantern = (x, y, sc, seed) => `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M0 -60V0" stroke="${INK}" stroke-width="3"/><ellipse cx="0" cy="38" rx="30" ry="40" fill="#E8574F" stroke="${INK}" stroke-width="3.4"/><path d="M-26 22Q0 30 26 22M-30 38Q0 48 30 38M-26 54Q0 62 26 54" fill="none" stroke="#8E2E28" stroke-width="2.2"/><rect x="-14" y="-4" width="28" height="12" rx="3" fill="#3E3A38" stroke="${INK}" stroke-width="2.4"/><rect x="-14" y="72" width="28" height="12" rx="3" fill="#3E3A38" stroke="${INK}" stroke-width="2.4"/><path d="M0 84v18" stroke="${INK}" stroke-width="3"/></g>`;
  const stoneLantern = (x, base, sc) => `<g transform="translate(${x} ${base}) scale(${sc})"><ellipse cx="0" cy="2" rx="40" ry="7" fill="#5B3D32" opacity=".16"/>` + shp(rect(-26, -20, 52, 20), '#CFCBC4', 3, 31) + shp(rect(-10, -80, 20, 62), '#D8D4CC', 3, 32) + shp(rect(-30, -110, 60, 32), '#FFE3A1', 3, 33) + `<path d="M-12 -110V-80M12 -110V-80" stroke="${INK}" stroke-width="2.4"/>` + shp([[-44, -108], [0, -146], [44, -108]], '#CFCBC4', 3, 34) + `</g>`;

  // ---- scenery behind the dogs ----
  let sc = '';
  sc += tree(1180, 1062, 1.7, 41) + tree(2262, 1062, 1.35, 51) + tree(3060, 1070, 1.7, 61);                    // autumn trees: left of Fuji, behind the dogs on tile 3, the right edge
  sc += toriiSvg(1936, 1076) + stoneLantern(1680, 1082, 1.2);
  sc += fence(660, 1006, 1062, 120) + fence(2300, 2560, 1062, 120);
  sc += cottage(66, 1088, 2.1);
  // mailbox at the fence, flower barrel and pumpkins by the door
  sc += propB('mailbox', {}, 700, 1064, 120) + propB('flowerbarrel', {}, 590, 1100, 120) + propB('hwscarecrow', {}, 2560, 1090, 190);
  // clothesline from the cottage to a pole, laundry like the game's yard
  const cl = (t) => [652 + (1010 - 652) * t, 796 + Math.sin(Math.PI * t) * 52];
  sc += `<path d="M1010 1062V770M994 778H1026" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` + line(Array.from({ length: 17 }, (_, k) => cl(k / 16)), 71, 1, 2.6, INK);
  const shirt = (t, col) => { const [x, y] = cl(t), z = 1.5; return shp([[x - 18 * z, y], [x - 6 * z, y - z], [x, y + 5 * z], [x + 6 * z, y - z], [x + 18 * z, y], [x + 26 * z, y + 12 * z], [x + 17 * z, y + 18 * z], [x + 14 * z, y + 12 * z], [x + 14 * z, y + 44 * z], [x - 14 * z, y + 44 * z], [x - 14 * z, y + 12 * z], [x - 17 * z, y + 18 * z], [x - 26 * z, y + 12 * z]], col, 2.6, 72); };
  const sock = (t, col) => { const [x, y] = cl(t), z = 1.5; return shp([[x - 6 * z, y], [x + 6 * z, y], [x + 6 * z, y + 26 * z], [x + 16 * z, y + 30 * z], [x + 14 * z, y + 38 * z], [x - 6 * z, y + 36 * z]], col, 2.4, 73); };
  sc += shirt(0.22, '#9CC2EA') + sock(0.45, '#E8574F') + sock(0.58, '#F2C14E') + shirt(0.82, '#FFD8E0');
  // paper lanterns hang from the bunting over Fuji, a ghost garland on tile 3, string lights over tile 1
  sc += [[1034, .9], [1082, .75], [2024, .75], [2072, .9]].map(([x, z], i) => lantern(x, 78 + 70 + ((x * 7) % 3) * 10, z, i)).join('');
  sc += propB('stringlights', {}, 90, 252, 900) + propB('hwgarland', {}, 2150, 330, 760);
  // low decorations in front corners and gaps
  sc += propB('leafpile', {}, 20, 1345, 220) + propB('jackolantern', { lit: true }, 1030, 1342, 84) + propB('jackolantern', { lit: true }, 2040, 1342, 70) + propB('leafpile', {}, 2880, 1340, 210) + propB('hwlanterns', { lit: true }, 1020, 1112, 110);
  g += sc;

  // ---- bunting across the whole picture (continuous, behind the label card) ----
  const anchors = [-20, 700, 1420, 2140, 2860, 3130], sag = 54, y0 = 78;
  const wireY = (x) => { for (let i = 0; i < anchors.length - 1; i++) if (x <= anchors[i + 1]) { const a = anchors[i], b = anchors[i + 1], t = (x - a) / (b - a); return y0 + sag * 4 * t * (1 - t); } return y0; };
  const wire = []; for (let x = -20; x <= 3130; x += 20) wire.push([x, wireY(x)]);
  g += line(wire, 31, 1.2, 4, INK);
  const cols = [PLUM, ORANGE, PINK, '#F2C14E', '#7FB77E'];
  for (let x = 40, i = 0; x < BW; x += 92, i++) { const yy = wireY(x), ang = (wireY(x + 10) - wireY(x - 10)) * 1.3; g += `<g transform="rotate(${f1(ang)} ${x} ${f1(yy)})"><path d="M${x - 36} ${f1(yy)}L${x + 36} ${f1(yy)}L${x} ${f1(yy + 86)}Z" fill="${cols[i % 5]}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/></g>`; }
  for (const x of [0, 700, 1420, 2140, 2860]) g += `<circle cx="${x < 0 ? 0 : x}" cy="${y0}" r="7" fill="${INK}"/>`;

  // ---- the crowd: bigger dogs, nobody overlaps; some wear nothing, some one item, some two ----
  const FEET = { f: 1300, m: 1212, b: 1134 }, HGT = { f: 335, m: 280, b: 225 }, GAPMIN = 24;
  const tiles = [
    { x0: 70, x1: 1004, items: [
      { k: 'shiba', d: 'b', pose: 'sit', outfit: { body: 'Happi Coat' } },                                                             // one item
      { k: 'samoyed', d: 'f', pose: 'happy' },                                                                                         // nothing
      { k: 'golden', d: 'm', pose: 'happy', outfit: { head: 'Flower Crown' } }] },                                                      // one item
    { x0: 1096, x1: 2014, items: [
      { k: 'husky', d: 'm', pose: 'sit', outfit: { neck: 'Autumn Scarf' } },                                                           // one item
      { k: 'dachs', d: 'f', tw: 480, fixed: true, pose: 'happy', outfit: { eyes: 'Heart Sunglasses', neck: 'Red Bandana' } },          // Noodle, the main character, in the middle: two items
      { k: 'collie', d: 'b', pose: 'beg', outfit: { head: 'Acorn Cap', neck: 'Bow Tie' } }] },                                         // two items
    { x0: 2112, x1: 2856, items: [
      { k: 'corgi', d: 'f', tw: 270, fixed: true, pose: 'happy', outfit: { head: 'Witch Hat', neck: 'Candy Corn Bandana' } },          // two items
      { k: 'pug', d: 'm', pose: 'sit', outfit: { head: 'Party Hat' } },                                                                // one item
      { k: 'beagle', d: 'b', pose: 'sniff' }] },                                                                                       // nothing
  ];
  const dogsAll = tiles.flatMap((T) => T.items).filter((it) => it.k);
  const mp = await browser.newPage();
  await mp.setContent('<body></body>');
  const bbs = await mp.evaluate((list) => list.map((it) => { const w = document.createElement('div'); w.innerHTML = it.svg; document.body.appendChild(w); const sv = w.querySelector('svg'); sv.setAttribute('width', 240); sv.setAttribute('height', 200); const b = sv.getBBox(); return [b.x, b.y, b.width, b.height]; }),
    dogsAll.flatMap((it) => ['left', 'right'].map((fc) => ({ svg: PA.dog(it.k, { pose: it.pose, outfit: it.outfit, facing: fc, anim: false }) }))));
  await mp.close();
  dogsAll.forEach((it, i) => { it.bb = { left: bbs[i * 2], right: bbs[i * 2 + 1] }; });
  const placed = [];
  for (const T of tiles) {
    const meas = T.items.map((it) => { const b = it.bb.right, k = it.tw ? it.tw / b[2] : HGT[it.d] / b[3]; return { w: b[2] * k, h: b[3] * k }; });
    const n = T.items.length, room = T.x1 - T.x0, fixedSum = meas.reduce((a, m, i) => a + (T.items[i].fixed ? m.w : 0), 0), flexSum = meas.reduce((a, m, i) => a + (T.items[i].fixed ? 0 : m.w), 0);
    const sc2 = Math.min(1, (room - GAPMIN * (n - 1) - fixedSum) / flexSum), gap = (room - fixedSum - flexSum * sc2) / (n - 1);
    let x = T.x0; const mid = (T.x0 + T.x1) / 2;
    T.items.forEach((it, i) => { const q = it.fixed ? 1 : sc2, m = meas[i], w = m.w * q, h = m.h * q, feet = FEET[it.d]; placed.push({ it, x, w, h, top: feet - h, feet, cx: x + w / 2, left: x + w / 2 > mid }); x += w + gap; });
    console.log('tile scale', f1(sc2), 'gap', f1(gap));
  }
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) { const a = placed[i], b = placed[j]; if (a.x < b.x + b.w && b.x < a.x + a.w && a.top < b.top + b.h && b.top < a.top + a.h) console.log('OVERLAP', a.it.k, b.it.k); }
  placed.sort((a, b) => a.feet - b.feet);
  for (const p of placed) {
    const { it } = p, b = it.bb[p.left ? 'left' : 'right'];
    g += `<ellipse cx="${f1(p.cx)}" cy="${f1(p.feet - 4)}" rx="${f1(p.w * 0.46)}" ry="${f1(p.w * 0.04)}" fill="#5B3D32" opacity=".14"/>`;
    g += `<svg x="${f1(p.x)}" y="${f1(p.top)}" width="${f1(p.w)}" height="${f1(p.h)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(PA.dog(it.k, { pose: it.pose, outfit: it.outfit, facing: p.left ? 'left' : 'right', anim: false }))}</svg>`;
  }
  // the pumpkin patch cart at the right edge, in front of the dogs' row end
  g += propB('popup', { lit: true }, 2866, 1170, 200);
  console.log('dogs placed:', placed.length);

  // ---- the one word box (middle tile only) ----
  const CY = 214, CW = 900, CH = 320, c1 = cx[1];
  g += `<g transform="rotate(0.6 ${c1} ${CY + CH / 2})"><g filter="url(#dd-shadow)"><rect x="${c1 - CW / 2}" y="${CY}" width="${CW}" height="${CH}" rx="40" fill="#FFFBF2"/></g>${box(c1 - CW / 2, CY, CW, CH, 40, 42, 2.8, 5)}${tape(c1 - 90, CY - 24, 180, 48, -3)}`
    + wordmark(c1, CY + 150, 138) + txt('a cozy dog game  ·  coming soon', c1, CY + 262, 64, { fill: MUTED, w: 600 })
    + doodle('paw', c1 - CW / 2 + 70, CY + 262, 1.4, -15) + doodle('heart', c1 + CW / 2 - 70, CY + 255, 1.5, 12) + doodle('spark', c1 + CW / 2 - 60, CY + 60, 1.2) + doodle('spark', c1 - CW / 2 + 60, CY + 70, 1) + `</g>`;

  // ---- write: the wide picture, then the three tiles (same svg, different viewBox) ----
  const wide = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">${defs}${g}</svg>`;
  await render(wide, BW, BH, 'banner-0-wide-preview.jpg');
  const names = ['banner-1-left-newest.jpg', 'banner-2-middle.jpg', 'banner-3-right-post-first.jpg'];
  for (let i = 0; i < 3; i++) {
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${BH}" viewBox="${i * TILE} 0 ${TW} ${BH}">${defs}${g}</svg>`;
    await render(tile, TW, BH, names[i]);
  }
};
