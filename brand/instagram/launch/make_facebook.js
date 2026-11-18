// Facebook Page cover photo (1640 x 856). Desktop shows the middle 2.7:1 strip (y ~124..731), phones show the full height but crop the
// sides (x ~59..1581), and the Page's profile picture covers the bottom-left corner on both. So the word box, the website and every dog live
// inside x 100..1540, y 150..700, nothing important sits at x < 480 with y > 560, and the word box stays centre-right.
// Background: the game's Hilltop Meadow on a sunny autumn day (world C 'hilltop', v2.15 art: kites, the village, the river), drawn to fill.
// Dogs are laid out from their own bounding boxes (hearts included) and checked against each other, the word box and the scene's floor props;
// every text line is centred in the box by its ink (measured from pixels), and the script throws if anything overlaps or leaves its area.
// Output: brand/facebook/facebook-cover-1640x856.jpg and a safe-areas check picture (not for upload).
const fs = require('fs'), path = require('path');
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, inner, PA, box, doodle, txt, tape, wordmark, defs, MUTED } = h;
  const W = 1640, H = 856, S = 1.43, TX = -200, TY = -1; // 1600 x 600 scene scaled to cover the height; the window shows scene x 140..1287
  fs.mkdirSync(path.join(h.OUT, '..', '..', 'facebook'), { recursive: true });
  const env = { time: 'day', weather: 'sunny', season: 'autumn', halloween: false, v215: true };
  const sceneG = `<g transform="translate(${TX} ${TY}) scale(${S})">${inner(PA.scene('hilltop', env))}</g>`;
  const hideHot = '<style>.pa-wc-hl{display:none}</style>'; // the game's hover outlines on hot spots (shown by the game's CSS only on hover)
  const FONT = '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap" rel="stylesheet">';
  const page = (body) => `<!doctype html><meta charset="utf-8">${FONT}<style>html,body{margin:0;background:#fff}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${hideHot}${body}</svg>`;
  const mp = await browser.newPage({ viewport: { width: W, height: H } });
  const load = async (body) => { await mp.setContent(page(body), { waitUntil: 'networkidle' }); await mp.evaluate(async () => { await document.fonts.load('700 40px Caveat'); await document.fonts.load('600 40px Caveat'); await document.fonts.ready; }); };

  // ---------- the scene's floor props (and hot spots) as boxes in cover pixels ----------
  await load(sceneG);
  const props = await mp.evaluate(() => [...document.querySelectorAll('[data-prop],[data-hot]')].map((e) => { const b = e.getBoundingClientRect(); return { id: e.getAttribute('data-prop') || 'hot:' + e.getAttribute('data-hot'), r: [b.left, b.top, b.right, b.bottom] }; }));
  const ON = props.filter((p) => p.r[2] > 0 && p.r[0] < W && p.r[3] > 0 && p.r[1] < H);

  // ---------- ink measure: the dark pixels of a fragment drawn alone on white ----------
  const ink = async (frag) => {
    await load(frag); const png = (await mp.screenshot({ type: 'png' })).toString('base64');
    return mp.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) { const k = (y * c.width + i) * 4; if (d[k] + d[k + 1] + d[k + 2] < 480) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      return [x0, y0, x1 + 1, y1 + 1]; }, png);
  };

  // ---------- the word box: centre-right, over the horizon, never under the profile picture ----------
  const BX = 905, BW = 580, BY = 228, BH = 262, CX = BX + BW / 2, CY = BY + BH / 2;
  const L = [ // [fragment maker(x, y), first-guess baseline]
    [(x, y) => wordmark(x, y, 92), BY + 100],
    [(x, y) => txt('doodledoggo.app', x, y, 72), BY + 182],
    [(x, y) => txt('a free cozy dog game  ·  40 crayon dogs', x, y, 36, { fill: MUTED, w: 600 }), BY + 232],
  ];
  const first = []; for (const [mk, y] of L) first.push(await ink(mk(CX, y)));
  const top = Math.min(...first.map((b) => b[1])), bot = Math.max(...first.map((b) => b[3])), dy = CY - (top + bot) / 2;
  const lineXY = L.map(([, y], i) => [CX + (CX - (first[i][0] + first[i][2]) / 2), y + dy]);
  const words = L.map(([mk], i) => mk(f1(lineXY[i][0]), f1(lineXY[i][1]))).join('');
  // check: every line's ink centred across, and the block centred up and down (within 1.5 px)
  const fin = []; for (let i = 0; i < L.length; i++) fin.push(await ink(L[i][0](f1(lineXY[i][0]), f1(lineXY[i][1]))));
  const bad = []; fin.forEach((b, i) => { if (Math.abs((b[0] + b[2]) / 2 - CX) > 1.5) bad.push(`line ${i} off by ${f1((b[0] + b[2]) / 2 - CX)} px across`); });
  const ft = Math.min(...fin.map((b) => b[1])), fb = Math.max(...fin.map((b) => b[3])); if (Math.abs((ft + fb) / 2 - CY) > 1.5) bad.push(`text block off by ${f1((ft + fb) / 2 - CY)} px up/down`);
  for (let i = 1; i < fin.length; i++) if (fin[i][1] - fin[i - 1][3] < 8) bad.push(`lines ${i - 1} and ${i} too close`);
  if (fin.some((b) => b[0] < BX + 30 || b[2] > BX + BW - 30)) bad.push('text too near the box sides');
  // corner doodles, kept off the text
  const deco = [['spark', BX + BW - 40, BY + 46, 0.95, 0], ['paw', BX + 54, BY + 160, 1.05, -15], ['heart', BX + BW - 54, BY + 160, 1.1, 12]]; // beside the website line
  const decoR = deco.map(([, x, y, s]) => [x - 18 * s, y - 16 * s, x + 18 * s, y + 16 * s]);
  const hit = (a, b, g = 0) => a[0] < b[2] + g && b[0] < a[2] + g && a[1] < b[3] + g && b[1] < a[3] + g;
  decoR.forEach((d, j) => fin.forEach((b, i) => { if (hit(d, b, 6)) bad.push(`doodle ${deco[j][0]} touches line ${i}`); }));
  const boxG = `<g filter="url(#dd-shadow)"><rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="34" fill="#FFFBF2"/></g>${box(BX, BY, BW, BH, 34, 42, 2.6, 4.6)}${tape(CX - 70, BY - 20, 140, 40, -3)}`
    + words + deco.map(([k, x, y, s, r]) => doodle(k, x, y, s, r)).join('');

  // ---------- the dogs: Noodle biggest, left of the box; three friends on the grass under it ----------
  const bbox = (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const b = e.getBBox(); w.remove(); return [b.x, b.y, b.width, b.height]; }, svg);
  await mp.setContent('<body></body>');
  const cast = [ // key, pose, left x, feet y, height, outfit, facing
    ['dachs', 'happy', 486, 655, 196, { neck: 'Red Bandana' }, 'right'],
    ['golden', 'happy', 922, 652, 134, null, 'left'],
    ['pug', 'sit', 1120, 690, 128, null, 'left'],
    ['corgi', 'happy', 1318, 680, 142, null, 'left'],
  ];
  let dogsG = ''; const dogR = [];
  for (const [k, pose, x, feet, hh, outfit, facing] of cast) {
    const sv = PA.dog(k, { pose, outfit: outfit || undefined, facing, anim: false }), b = await bbox(sv), w = b[2] * hh / b[3];
    dogsG += `<ellipse cx="${f1(x + w / 2)}" cy="${feet - 3}" rx="${f1(w * 0.42)}" ry="7" fill="#5B3D32" opacity=".14"/>`
      + `<svg x="${f1(x)}" y="${f1(feet - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`;
    dogR.push({ k, r: [x, feet - hh, x + w, feet + 5] });
  }
  // ---------- checks: nothing overlaps, everything important in its safe area ----------
  const BOXR = [BX, BY - 22, BX + BW, BY + BH + 12]; // tape and drop shadow included
  dogR.forEach((d, i) => {
    if (d.r[0] < 100 || d.r[2] > 1540 || d.r[1] < 150 || d.r[3] > 705) bad.push(`${d.k} leaves the safe area ${d.r.map(Math.round)}`);
    if (d.r[0] < 480 && d.r[3] > 560) bad.push(`${d.k} under the profile picture`);
    if (hit(d.r, BOXR, 14)) bad.push(`${d.k} touches the word box`);
    dogR.slice(i + 1).forEach((e) => { if (hit(d.r, e.r, 20)) bad.push(`${d.k} touches ${e.k}`); });
    ON.forEach((p) => { if (hit(d.r, p.r, 12)) bad.push(`${d.k} touches the ${p.id} ${p.r.map(Math.round)}`); });
  });
  if (BX < 480 && BY + BH > 560) bad.push('word box under the profile picture');
  if (BX < 100 || BX + BW > 1540 || BY - 22 < 150 || BY + BH > 700) bad.push('word box leaves the safe area');
  console.log('dogs', dogR.map((d) => d.k + ' ' + d.r.map(Math.round).join(',')).join(' | '));
  console.log('props in view', ON.map((p) => p.id + ' ' + p.r.map(Math.round).join(',')).join(' | '));
  console.log('text ink', fin.map((b) => b.join(',')).join(' | '));
  await mp.close();
  if (bad.length) throw new Error('facebook cover checks failed:\n  ' + bad.join('\n  '));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${hideHot}${sceneG}${dogsG}<g transform="rotate(-0.6 ${CX} ${CY})">${boxG}</g></svg>`;
  await render(svg, W, H, '../../facebook/facebook-cover-1640x856.jpg');
  // the check picture (not for upload): desktop strip (blue dashes), phone box (red), profile picture zone (orange), content safe box (green)
  const cut = svg.lastIndexOf('</svg>'), guide = svg.slice(0, cut)
    + `<rect x="3" y="124" width="${W - 6}" height="607" fill="none" stroke="#2F80ED" stroke-width="5" stroke-dasharray="22 12"/>`
    + `<rect x="59" y="3" width="1522" height="${H - 6}" fill="none" stroke="#E8574F" stroke-width="5"/>`
    + `<rect x="0" y="560" width="480" height="296" fill="#E8863A" fill-opacity=".28" stroke="#E8863A" stroke-width="5"/>`
    + `<rect x="100" y="150" width="1440" height="550" fill="none" stroke="#3A9D5D" stroke-width="3" stroke-dasharray="8 8"/>`
    + `<text x="16" y="116" font-family="sans-serif" font-size="22" font-weight="700" fill="#2F80ED">desktop strip y 124..731</text>`
    + `<text x="70" y="30" font-family="sans-serif" font-size="22" font-weight="700" fill="#E8574F">phone x 59..1581</text>`
    + `<text x="16" y="840" font-family="sans-serif" font-size="22" font-weight="700" fill="#B5531C">profile picture</text></svg>`;
  await render(guide, W, H, '../../facebook/facebook-cover-safe-areas-check.jpg');
};
