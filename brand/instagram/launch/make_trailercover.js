// Covers for "Doodle Doggo – Overview Trailer" (the ~90 s trailer in trailer90/): a 16:9 thumbnail (1920 x 1080, drawn on a 1280 x 720 grid;
// YouTube, the game portals) and a 9:16 cover (1080 x 1920; the profile grid shows the middle 1080 x 1440, y 240..1680, so everything that
// matters sits inside it). The art is the game's own: the yard with Mt. Fuji in autumn and the trailer's four dogs (Noodle, Biscuit, Mochi, Frost).
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js shots trailercover
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, inner, PA, box, doodle, txt, swash, tape, paper, defs, INK, MUTED, PINK, wordmark } = h;
  const env = { time: 'day', weather: 'sunny', season: 'autumn', halloween: false, jp: true };
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); const vb = e.getAttribute('viewBox').split(' ').map(Number); e.setAttribute('width', vb[2]); e.setAttribute('height', vb[3]); const b = e.getBBox(); w.remove(); return [b.x, b.y, b.width, b.height]; }, svg);
  const put = async (sv, cx, feet, hh) => { const b = await bbox(sv), sc = hh / b[3], w = b[2] * sc; return `<ellipse cx="${f1(cx)}" cy="${feet - 3}" rx="${f1(w * 0.42)}" ry="${f1(Math.max(6, hh * 0.05))}" fill="#5B3D32" opacity=".15"/><svg x="${f1(cx - w / 2)}" y="${f1(feet - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`; };
  const dg = (k, pose, facing, outfit) => PA.dog(k, { pose, facing, outfit, anim: false });
  // the sketchbook page: the game's yard with Mt. Fuji, taped down (the game's tap-area highlight is hidden)
  const page = (x, y, w, hh, rot, vb) => `<style>.pa-wa-hl{display:none}</style><g transform="rotate(${rot} ${x + w / 2} ${y + hh / 2})"><rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${hh + 28}" rx="18" fill="#FFFDF7" filter="url(#dd-shadow)"/>`
    + `<svg x="${x}" y="${y}" width="${w}" height="${hh}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="8" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="3.4"/>` + tape(x + w / 2 - 70, y - 30, 140, 40, -3) + `</g>`;
  // a crayon play button: a video, not a still
  const play = (cx, cy, r) => `<g filter="url(#dd-shadow)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${PINK}"/></g>${box(cx - r, cy - r, r * 2, r * 2, r, 97, 1.8, Math.max(3.4, r / 14))}`
    + `<path d="M${f1(cx - r * 0.3)} ${f1(cy - r * 0.42)} L${f1(cx + r * 0.46)} ${cy} L${f1(cx - r * 0.3)} ${f1(cy + r * 0.42)}Z" fill="#FFF8EC" stroke="${INK}" stroke-width="${Math.max(3.4, r / 14)}" stroke-linejoin="round"/>`;
  const pill = (s, cx, cy, w, hh, rot, size, fill = '#FFE3A1', seed = 81) => `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="${cx - w / 2}" y="${cy - hh / 2}" width="${w}" height="${hh}" rx="${hh / 2}" fill="${fill}"/>${box(cx - w / 2, cy - hh / 2, w, hh, hh / 2, seed, 1.6, 4)}${txt(s, cx, cy + size * 0.34, size)}</g>`;
  const chip = (s, x, y, size, fill) => { const w = s.length * size * 0.43 + 40; return `<rect x="${x}" y="${y - size * 0.95}" width="${f1(w)}" height="${f1(size * 1.35)}" rx="${f1(size * 0.67)}" fill="${fill}" opacity=".85"/>${txt(s, x + w / 2, y, size, { w: 700 })}`; };

  // ---------- 16:9 (designed at 1280 x 720, rendered at 1920 x 1080); the bottom-right corner stays clear for YouTube's time label ----------
  {
    const TW = 1280, TH = 720;
    let t = `<rect width="${TW}" height="${TH}" fill="#FFF8EC"/><rect width="${TW}" height="${TH}" fill="url(#dd-dots)"/>` + box(18, 18, TW - 36, TH - 36, 24, 13, 2.6, 4.4);
    for (const [n, x, y, s, r] of [['spark', 66, 70, 1.3, 0], ['heart', 548, 96, 1.2, 12], ['paw', 70, 650, 1.2, -12], ['leaf', 560, 640, 1.2, 18], ['spark', 1218, 60, 1, 0]]) t += doodle(n, x, y, s, r);
    t += wordmark(300, 168, 92);
    t += swash(300, 268, 470, 74, -2, PINK, 0.45) + txt('Overview Trailer', 300, 292, 82, { rot: -2 });
    t += txt('a cozy crayon dog game', 300, 372, 46, { fill: MUTED, w: 600 });
    t += chip('adopt', 70, 452, 34, '#FFE3A1') + chip('care', 200, 452, 34, '#CFE0F7') + chip('walk', 310, 452, 34, '#BFE3C9') + chip('explore', 418, 452, 34, '#E0D5F0');
    t += pill('play free in your browser', 300, 560, 470, 72, -2.5, 42);
    // the page and the dogs on the right
    t += page(620, 70, 610, 410, 1.6, '40 96 560 377');
    t += await put(dg('husky', 'sit', 'right', { neck: 'Autumn Scarf' }), 700, 470, 120);           // Frost, on the page
    t += await put(dg('shiba', 'sit', 'left'), 1160, 470, 128);                                      // Mochi
    t += await put(dg('corgi', 'happy', 'right'), 680, 672, 150);                                    // Biscuit, in front
    t += await put(dg('dachs', 'happy', 'left', { head: 'Witch Hat' }), 945, 690, 236);              // Noodle
    t += play(925, 270, 62);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 ${TW} ${TH}">${defs}${t}</svg>`;
    await render(svg, 1920, 1080, 'trailer90/doodle-doggo-overview-trailer-cover-16x9.jpg');
  }

  // ---------- 3:2 (900 x 600, owner 24 Oct 2026; designed at 1200 x 800) ----------
  {
    const TW = 1200, TH = 800;
    let t = `<rect width="${TW}" height="${TH}" fill="#FFF8EC"/><rect width="${TW}" height="${TH}" fill="url(#dd-dots)"/>` + box(18, 18, TW - 36, TH - 36, 24, 14, 2.6, 4.4);
    for (const [n, x, y, s, r] of [['spark', 66, 76, 1.3, 0], ['heart', 530, 110, 1.2, 12], ['paw', 70, 730, 1.2, -12], ['leaf', 548, 720, 1.2, 18], ['spark', 1140, 60, 1, 0]]) t += doodle(n, x, y, s, r);
    t += wordmark(290, 190, 88);
    t += swash(290, 300, 450, 74, -2, PINK, 0.45) + txt('Overview Trailer', 290, 324, 78, { rot: -2 });
    t += txt('a cozy crayon dog game', 290, 408, 44, { fill: MUTED, w: 600 });
    t += chip('adopt', 66, 494, 32, '#FFE3A1') + chip('care', 190, 494, 32, '#CFE0F7') + chip('walk', 295, 494, 32, '#BFE3C9') + chip('explore', 398, 494, 32, '#E0D5F0');
    t += pill('play free in your browser', 290, 610, 450, 70, -2.5, 40);
    t += page(600, 80, 550, 370, 1.6, '40 96 560 377');
    t += await put(dg('husky', 'sit', 'right', { neck: 'Autumn Scarf' }), 672, 442, 110);
    t += await put(dg('shiba', 'sit', 'left'), 1085, 442, 118);
    t += await put(dg('corgi', 'happy', 'right'), 665, 735, 155);
    t += await put(dg('dachs', 'happy', 'left', { head: 'Witch Hat' }), 915, 742, 240);
    t += play(875, 255, 58);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 ${TW} ${TH}">${defs}${t}</svg>`;
    await render(svg, 900, 600, 'trailer90/doodle-doggo-overview-trailer-cover-900x600.jpg');
  }

  // ---------- 9:16 (1080 x 1920) ----------
  {
    const W = 1080, H = 1920;
    let g = paper(W, H);
    for (const [n, x, y, s, r] of [['spark', 120, 300, 1.5, 0], ['heart', 960, 320, 1.4, 12], ['paw', 975, 1600, 1.5, -12], ['leaf', 100, 1590, 1.4, 20], ['heart', 80, 860, 1.1, -10], ['spark', 1010, 980, 1.1, 0]]) g += doodle(n, x, y, s, r);
    g += wordmark(540, 380, 120);
    g += swash(540, 510, 720, 104, -2, PINK, 0.45) + txt('Overview Trailer', 540, 545, 124, { rot: -2 });
    g += txt('a cozy crayon dog game', 540, 640, 60, { fill: MUTED, w: 600 });
    g += page(90, 720, 900, 560, -1.2, '40 100 560 349');
    g += await put(dg('husky', 'sit', 'right', { neck: 'Autumn Scarf' }), 190, 1270, 160);
    g += await put(dg('shiba', 'sit', 'left'), 900, 1270, 170);
    g += await put(dg('corgi', 'happy', 'right'), 190, 1505, 205);
    g += await put(dg('dachs', 'happy', 'left', { head: 'Witch Hat' }), 600, 1520, 320);
    g += play(540, 950, 86);
    g += pill('play free in your browser', 540, 1612, 640, 84, -2.5, 50);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${g}</svg>`;
    await render(svg, W, H, 'trailer90/doodle-doggo-overview-trailer-cover-9x16.jpg');
    await render(svg.replace(`viewBox="0 0 ${W} ${H}"`, `viewBox="0 240 ${W} 1440"`).replace(`height="${H}"`, 'height="1440"'), W, 1440, 'trailer90/doodle-doggo-overview-trailer-cover-9x16-grid-crop.jpg');
  }
  await mp.close();
};
