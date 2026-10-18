// Cover for the 60-second Noodle story Reel (1080 x 1920). The profile grid shows the middle 3:4 (1080 x 1440, y 240..1680),
// so the title, the page, the dogs and the sticker all sit inside that band; the top and bottom 240 px are only paper.
// Output: story60/noodle-story-60s-cover.jpg, plus a 1080 x 1440 grid crop to check, and a 1280 x 720 YouTube thumbnail.
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, inner, PA, box, doodle, txt, swash, tape, paper, defs, INK, MUTED, PINK } = h;
  const W = 1080, H = 1920;
  let g = paper(W, H);
  for (const [n, x, y, s, r] of [['spark', 120, 300, 1.5, 0], ['heart', 950, 330, 1.4, 12], ['paw', 980, 1560, 1.5, -12], ['spark', 90, 1620, 1.2, 0], ['heart', 70, 900, 1.1, -10], ['spark', 1010, 1010, 1.1, 0]]) g += doodle(n, x, y, s, r);
  // title
  g += txt("Hi, I'm", 540, 372, 96, { rot: -3, fill: MUTED });
  g += swash(540, 486, 640, 92, -2, PINK, 0.45) + txt('Noodle', 540, 520, 230, { rot: -2 });
  // the sketchbook page: the game's yard with Mt. Fuji
  const PX = 70, PY = 600, PW = 940, PH = 640, env = { time: 'day', weather: 'sunny', season: 'autumn', halloween: false, jp: true };
  g += `<g transform="rotate(-1.2 540 ${PY + PH / 2})"><rect x="${PX - 18}" y="${PY - 18}" width="${PW + 36}" height="${PH + 36}" rx="22" fill="#FFFDF7" filter="url(#dd-shadow)"/>`
    + `<svg x="${PX}" y="${PY}" width="${PW}" height="${PH}" viewBox="40 100 560 381" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg>`
    + `<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="8" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="4"/>` + tape(PX + PW / 2 - 90, PY - 40, 180, 50, 3) + `</g>`;
  // the dogs: Noodle in front, Biscuit and Mochi beside him, Frost and Gerald on the page behind
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); const vb = e.getAttribute('viewBox').split(' ').map(Number); e.setAttribute('width', vb[2]); e.setAttribute('height', vb[3]); const b = e.getBBox(); return [b.x, b.y, b.width, b.height]; }, svg);
  const put = async (sv, cx, feet, hh) => { const b = await bbox(sv), sc = hh / b[3], w = b[2] * sc; return `<ellipse cx="${f1(cx)}" cy="${feet - 3}" rx="${f1(w * 0.42)}" ry="10" fill="#5B3D32" opacity=".15"/><svg x="${f1(cx - w / 2)}" y="${f1(feet - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`; };
  const dg = (k, pose, facing, outfit) => PA.dog(k, { pose, facing, outfit, anim: false });
  g += await put(dg('husky', 'sit', 'right', { neck: 'Autumn Scarf' }), 170, 1232, 165);          // on the page, behind the front row
  g += await put(PA.prop('gerald', { pose: 'wave' }), 930, 1236, 150);
  g += await put(dg('corgi', 'happy', 'right'), 160, 1495, 200);                                  // the front row
  g += await put(dg('shiba', 'sit', 'left'), 905, 1495, 215);
  g += await put(dg('dachs', 'happy', 'right'), 525, 1500, 300);

  // ---- the YouTube thumbnail (1280 x 720): title on the left, the page and the dogs on the right; the bottom-right corner stays clear for YouTube's time label ----
  const TW = 1280, TH = 720;
  let t = paper(TW, TH);
  for (const [n, x, y, sc, r] of [['spark', 60, 70, 1.3, 0], ['heart', 545, 90, 1.2, 12], ['paw', 70, 650, 1.3, -12]]) t += doodle(n, x, y, sc, r);
  t += txt("Hi, I'm", 290, 200, 96, { rot: -3, fill: MUTED });
  t += swash(290, 318, 520, 96, -2, PINK, 0.45) + txt('Noodle', 290, 360, 200, { rot: -2 });
  t += txt('a crayon dog drew himself', 290, 452, 50, { fill: MUTED }) + txt('and shows you his town', 290, 510, 50, { fill: MUTED });
  t += `<g transform="rotate(-3 290 597)"><rect x="80" y="562" width="420" height="70" rx="35" fill="#FFE3A1"/>${box(80, 562, 420, 70, 35, 81, 1.6, 4)}${txt('play free on itch.io', 290, 612, 46)}</g>`;
  const QX = 600, QY = 52, QW = 630, QH = 430;
  t += `<g transform="rotate(1.2 ${QX + QW / 2} ${QY + QH / 2})"><rect x="${QX - 14}" y="${QY - 14}" width="${QW + 28}" height="${QH + 28}" rx="18" fill="#FFFDF7" filter="url(#dd-shadow)"/>`
    + `<svg x="${QX}" y="${QY}" width="${QW}" height="${QH}" viewBox="40 90 560 382" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg>`
    + `<rect x="${QX}" y="${QY}" width="${QW}" height="${QH}" rx="8" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="3.4"/>` + tape(QX + QW / 2 - 70, QY - 30, 140, 40, -3) + `</g>`;
  t += await put(dg('husky', 'sit', 'right', { neck: 'Autumn Scarf' }), 680, 470, 120);
  t += await put(PA.prop('gerald', { pose: 'wave' }), 1170, 470, 110);
  t += await put(dg('corgi', 'happy', 'right'), 630, 692, 140);
  t += await put(dg('shiba', 'sit', 'left'), 1170, 650, 150);
  t += await put(dg('dachs', 'happy', 'right'), 905, 692, 215);
  const ux = 770, uy = 400, uw = 280, uh = 82;
  t += `<path d="M${ux + 170} ${uy + uh - 2}L${ux + 215} ${uy + uh + 40}L${ux + 200} ${uy + uh - 2}Z" fill="#FFFBF2"/><rect x="${ux}" y="${uy}" width="${uw}" height="${uh}" rx="22" fill="#FFFBF2"/>` + box(ux, uy, uw, uh, 22, 91, 2, 3.6)
    + `<path d="M${ux + 170} ${uy + uh}L${ux + 215} ${uy + uh + 40}L${ux + 200} ${uy + uh}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>` + txt('I drew myself.', ux + uw / 2, uy + 54, 42);
  await render(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">${defs}${t}</svg>`, TW, TH, 'story60/noodle-story-youtube-thumbnail.jpg');
  await mp.close();
  // Noodle's bubble
  const bx = 310, by = 1030, bw = 360, bh = 110;
  g += `<path d="M${bx + 230} ${by + bh - 2}L${bx + 300} ${by + bh + 60}L${bx + 270} ${by + bh - 2}Z" fill="#FFFBF2"/>` + `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="28" fill="#FFFBF2"/>` + box(bx, by, bw, bh, 28, 61, 2.2, 4.4)
    + `<path d="M${bx + 230} ${by + bh}L${bx + 300} ${by + bh + 60}L${bx + 270} ${by + bh}" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linejoin="round" stroke-linecap="round"/>` + txt('I drew myself.', bx + bw / 2, by + 72, 54);
  // bottom line and the launch sticker
  g += txt('Doodle Doggo  ·  a 1-minute story', 540, 1560, 52, { fill: MUTED });
  g += `<g transform="rotate(-3 540 1613)"><rect x="300" y="1580" width="480" height="66" rx="33" fill="#FFE3A1"/>${box(300, 1580, 480, 66, 33, 71, 1.6, 4)}${txt('play free on itch.io', 540, 1628, 46)}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${g}</svg>`;
  await render(svg, W, H, 'story60/noodle-story-60s-cover.jpg');
  const crop = svg.replace(`viewBox="0 0 ${W} ${H}"`, `viewBox="0 240 ${W} 1440"`).replace(`height="${H}"`, 'height="1440"');
  await render(crop, W, 1440, 'story60/noodle-story-60s-cover-grid-crop.jpg');
};
