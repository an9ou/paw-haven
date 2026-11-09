// YouTube channel banner (2560 x 1440). YouTube shows the whole picture only on TVs; desktop shows the middle 2560 x 423 strip
// (y 508..931) and phones only the centre 1546 x 423 (x 507..2053), so the word box and the dogs live inside that strip.
// Background: the game's Mt. Fuji Lookout at dusk (world C 'fujihill'), scaled to the full width. Output: brand/youtube/.
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, inner, PA, box, doodle, txt, tape, wordmark, defs, INK, MUTED } = h;
  const W = 2560, H = 1440, S = 2.9, TX = (W - 1000 * S) / 2, TY = -293; // the near grass (scene y ~400) starts at about y 870, so the dogs stand on it
  const env = { time: 'dusk', weather: 'sunny', season: 'autumn', halloween: false, jp: true };
  let g = `<g transform="translate(${TX} ${TY}) scale(${S})">${inner(PA.scene('fujihill', env))}</g>`;
  // the dogs on the grass, inside the strip: three on each side of the word box, Noodle nearest on the right
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const b = e.getBBox(); return [b.x, b.y, b.width, b.height]; }, svg);
  const FEET = 922;
  const cast = [
    ['husky', 'sit', 170, 250, { neck: 'Autumn Scarf' }, 'right'],
    ['corgi', 'happy', 420, 230, { head: 'Party Hat' }, 'right'],
    ['shiba', 'sit', 660, 250, null, 'right'],
    ['dachs', 'happy', 1880, 270, { eyes: 'Heart Sunglasses', neck: 'Red Bandana' }, 'left'],
    ['golden', 'happy', 2200, 260, { head: 'Flower Crown' }, 'left'],
    ['pug', 'sit', 2430, 200, null, 'left'],
  ];
  // owner, 9 Nov 2026: dogs never overlap or touch, and none goes behind the word box. Each side is laid out from the dogs' own
  // bounding boxes (hearts and outfits included) with a clear gap, and shrunk together if the row would not fit its side.
  const BOXL = 1280 - 400 - 50, BOXR = 1280 + 400 + 50, GAP = 46;
  const items = [];
  for (const [k, pose, , hh, outfit, facing] of cast) { const sv = PA.dog(k, { pose, outfit: outfit || undefined, facing, anim: false }); items.push({ sv, b: await bbox(sv), hh }); }
  const need = (row) => row.reduce((a, it) => a + it.b[2] * it.hh / it.b[3], 0) + GAP * (row.length - 1);
  const L = items.slice(0, 3), R = items.slice(3), K = Math.min(1, (BOXL - 40) / need(L), (W - 40 - BOXR) / need(R)); // one size for both sides
  const place = (row, x0, x1) => {
    let x = x0 + Math.max(0, (x1 - x0 - need(row) * K) / 2);
    for (const it of row) { const hh = it.hh * K, w = it.b[2] * hh / it.b[3];
      g += `<ellipse cx="${f1(x + w / 2)}" cy="${FEET - 3}" rx="${f1(w * 0.44)}" ry="9" fill="#5B3D32" opacity=".16"/>`;
      g += `<svg x="${f1(x)}" y="${f1(FEET - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${it.b.map(f1).join(' ')}" overflow="visible">${inner(it.sv)}</svg>`;
      x += w + GAP * K; }
  };
  place(L, 40, BOXL); place(R, BOXR, W - 40);
  await mp.close();
  // the word box, centred in the phone-safe area
  const CX = 1280, BW = 800, BH = 250, BY = 560;
  g += `<g transform="rotate(-0.6 ${CX} ${BY + BH / 2})"><g filter="url(#dd-shadow)"><rect x="${CX - BW / 2}" y="${BY}" width="${BW}" height="${BH}" rx="36" fill="#FFFBF2"/></g>${box(CX - BW / 2, BY, BW, BH, 36, 42, 2.8, 5)}${tape(CX - 80, BY - 22, 160, 44, -3)}`
    + wordmark(CX, BY + 118, 112) + txt('40 crayon dogs  ·  play at doodledoggo.app', CX, BY + 208, 46, { fill: MUTED, w: 600 })
    + doodle('paw', CX - BW / 2 + 52, BY + 204, 1.1, -15) + doodle('heart', CX + BW / 2 - 52, BY + 200, 1.2, 12) + doodle('spark', CX + BW / 2 - 46, BY + 52, 1) + `</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${g}</svg>`;
  await render(svg, W, H, '../../youtube/youtube-banner-2560x1440.jpg');
  // a check picture: the full banner with the desktop strip and the phone-safe box drawn on (not for upload)
  const cut = svg.lastIndexOf('</svg>'), guide = svg.slice(0, cut) + `<rect x="0" y="508" width="2560" height="423" fill="none" stroke="#2F80ED" stroke-width="6" stroke-dasharray="24 14"/><rect x="507" y="508" width="1546" height="423" fill="none" stroke="#E8574F" stroke-width="6"/></svg>`;
  await render(guide, W, H, '../../youtube/youtube-banner-safe-areas-check.jpg');
};
