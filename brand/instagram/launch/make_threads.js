// Threads post picture (1080 x 1350, 4:5, what Threads shows best): "I made a cozy game with 35 dogs. I drew every one of them myself."
// over a line-up of all 35 dogs, Noodle pointed out. The dogs are the real art (PawArt.dog). Output: brand/threads/threads-35-dogs.jpg.
const fs = require('fs'), path = require('path');
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, doodle, txt, lines, box, swash, arrow, paper, svgPage, frame, tape, PA, inner, INK, PINK, MUTED, ORANGE, PLUM } = h;
  const W = 1080, H = 1350;
  fs.mkdirSync(path.join(h.OUT, '..', '..', 'threads'), { recursive: true });
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = async (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const b = e.getBBox(); w.remove(); return [b.x, b.y, b.width, b.height]; }, svg);
  const fit = async (sv, cx, bottom, maxW, maxH) => { const b = await bbox(sv), k = Math.min(maxW / b[2], maxH / b[3]), w = b[2] * k, hh = b[3] * k;
    return `<svg x="${f1(cx - w / 2)}" y="${f1(bottom - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`; };
  // a pose and face per dog that suits it (faces are v2.13 expressions; none = the plain pose)
  const LOOK = { shiba: ['sit', 'pout'], corgi: ['happy', 'yum'], golden: ['happy', 'hearts'], dachs: ['happy', 'proud'], husky: ['sit', 'wow'], mutt: ['sit', 'hearts'], chihuahua: ['sit', 'surprised'],
    pug: ['sit', 'blep'], greyhound: ['happy', 'zoomies'], beagle: ['sit', 'curious'], poodle: ['sit', 'proud'], collie: ['sit', 'curious'], samoyed: ['happy', 'hearts'], frenchie: ['sit', 'wink'],
    akita: ['sit', 'dreamy'], spitz: ['sit', 'proud'], pom: ['happy', 'wink'], afghan: ['sit', 'dreamy'], dane: ['sit', 'blep'], mastiff: ['sit', 'sleepy'], gsd: ['sit', 'curious'],
    dobie: ['sit', 'wink'], corso: ['sit', 'sleepy'], pitbull: ['happy', 'hearts'], minpin: ['happy', 'surprised'], lab: ['happy', 'yum'], malamute: ['sit', 'pout'], chow: ['sit', 'pout'],
    stdpoodle: ['sit', 'proud'], schnauzer: ['sit', 'curious'], westie: ['happy', 'guilty'], yorkie: ['sit', 'proud'], bichon: ['happy', 'hearts'], maltese: ['sit', 'dreamy'], shihtzu: ['sit', 'sleepy'] };
  const keys = PA.DOGS.map((d) => d.key);
  // Noodle in the middle of the bottom row, so the note can sit right under him
  const order = keys.filter((k) => k !== 'dachs'); order.splice(31, 0, 'dachs');
  let g = paper(W, H) + frame(W, H, 77)
    + lines(['I made a cozy game with 35 dogs.', 'I drew every one of them myself.'], 540, 180, 70, 84, { rot: -1 });
  const COLS = 7, CW = 140, X0 = (W - COLS * CW) / 2, Y0 = 350, RH = 150;
  for (let i = 0; i < order.length; i++) {
    const k = order[i], [pose, expr] = LOOK[k] || ['sit'], c = i % COLS, r = Math.floor(i / COLS), cx = X0 + c * CW + CW / 2, bottom = Y0 + r * RH + 130;
    if (k === 'dachs') g += swash(cx, bottom - 6, 150, 40, -3, PINK, 0.55);
    g += await fit(PA.dog(k, { pose, expr, anim: false, facing: c % 2 ? 'left' : 'right' }), cx, bottom, 128, 112);
  }
  // point at Noodle (bottom row, middle)
  const nx = X0 + 3 * CW + CW / 2, ny = Y0 + 4 * RH + 130;
  g += `<g transform="rotate(-2 540 ${ny + 110})">${box(330, ny + 55, 420, 110, 28, 41, 2.2, 4)}${lines(['this is Noodle.', 'he drew himself.'], 540, ny + 100, 42, 46, { w: 700 })}</g>`
    + arrow(770, ny + 110, nx + 60, ny - 10, [70, -10], 4);
  g += txt('Doodle Doggo · a free cozy dog game · play on itch.io', 540, 1302, 36, { fill: MUTED, w: 600 })
    + doodle('heart', 970, 250, 1.1, 12) + doodle('spark', 100, 270, 1.2);
  await render(svgPage(W, H, g), W, H, '../../threads/threads-35-dogs.jpg');
  await mp.close();
};
