// Informative post series (same paper/pencil/taped-photo style as posts 1-3), 1080 x 1350.
//   info1-japan-view, info2-meet-the-dogs, info3-what-you-can-do, info4-how-to-play
// Screenshots come from shots.js / shots2.js / shots3.js (real game screens).
const path = require('path');
module.exports = async function ({ render, helpers: h }) {
  const { f1, doodle, txt, lines, box, line, arrow, dog, paper, svgPage, frame, tape, photo, shotAt, swash, wordmark, INK, PINK, MUTED, ORANGE, PLUM } = h;
  const W = 1080, H = 1350;
  const tag = (n, label) => txt(`${n}/4`, 990, 92, 44, { fill: MUTED, w: 600, anchor: 'end' }) + txt(label, 100, 92, 44, { fill: '#D8607E', anchor: 'start' });
  const foot = (extra = '') => txt('Doodle Doggo · free in your browser · link in bio', 540, 1302, 40, { fill: MUTED, w: 600 }) + extra;

  // ---------- 1. Japan view ----------
  const p1 = () => svgPage(W, H, paper(W, H) + frame(W, H, 31) + tag(1, 'the Japan view')
    + lines(['Mt. Fuji on', 'every skyline'], 540, 196, 118, 104, { rot: -1.5 })
    + photo('yard_dusk', [0, 470, 1179, 1150], 62, 372, 580, -2, { seed: 4 })
    + photo('fujihill_dusk_bubble', [0, 640, 1179, 980], 690, 372, 290, 3.5, { caption: 'Fuji View Hill', seed: 9, tape: '#FFE3A1', tapeRot: 5, pad: 12 })
    + photo('winter_fujihill', [0, 640, 1179, 980], 668, 790, 320, -3, { caption: 'Snow Days, 1 Dec', seed: 12, tape: PINK, tapeRot: -6, pad: 12 })
    + `<g font-family="Caveat">` + [['Fuji View Hill: torii & lanterns', 1064], ['Look at Fuji once a day', 1132], ['New Year cards (年賀状) in Jan', 1200]].map(([s, y], i) => `<circle cx="92" cy="${y - 14}" r="13" fill="${PINK}" fill-opacity=".6" stroke="${INK}" stroke-width="3"/>` + txt(s, 124, y, 46, { anchor: 'start', w: 600 })).join('') + `</g>`
    + doodle('spark', 960, 270, 1.2) + doodle('heart', 130, 1260, 1, -12) + foot());

  // ---------- 2. Meet the dogs ----------
  const D = [['shiba', 'Mochi', 'Shiba Inu', 'sit'], ['corgi', 'Biscuit', 'Corgi', 'happy'], ['golden', 'Sunny', 'Golden Retriever', 'happy'], ['dachs', 'Noodle', 'Dachshund', 'happy'],
    ['husky', 'Frost', 'Husky', 'sit'], ['mutt', 'Pepper', 'Shelter Mutt', 'idle'], ['chihuahua', 'Peanut', 'Chihuahua', 'speak'], ['pug', 'Dumpling', 'Pug', 'sit'],
    ['greyhound', 'Rocket', 'Greyhound', 'idle'], ['beagle', 'Bagel', 'Beagle', 'sniff'], ['poodle', 'Pretzel', 'Poodle', 'dance'], ['collie', 'Scout', 'Border Collie', 'beg'],
    ['samoyed', 'Cloud', 'Samoyed', 'happy'], ['frenchie', 'Brioche', 'French Bulldog', 'idle']];
  const p2 = () => {
    let g = paper(W, H) + frame(W, H, 32) + tag(2, 'the dogs') + txt('14 dog types', 540, 210, 130, { rot: -1.5 }) + txt('each one has its own voice, size and joke', 540, 280, 52, { fill: MUTED, w: 600 });
    const CW = 225, GX = 20, X0 = 60, Y0 = 318, RH = 232;
    D.forEach(([k, n, b, pose], i) => {
      const c = i % 4, r = Math.floor(i / 4), x = X0 + c * (CW + GX), y = Y0 + r * RH, hero = k === 'dachs';
      if (hero) g += swash(x + CW / 2, y + 138, CW * 0.95, 56, -3, PINK, 0.55);
      g += dog(k, { pose }, f1(x + 6), f1(y + 6), 205) + txt(n, x + CW / 2, y + 190, 46, { fill: INK }) + txt(b.toLowerCase(), x + CW / 2, y + 224, 34, { fill: MUTED, w: 600 });
      if (hero) g += doodle('heart', x + CW - 20, y + 20, 0.9, 12);
    });
    // the 15th and 16th cell: a note card about puppies
    const nx = X0 + 2 * (CW + GX), ny = Y0 + 3 * RH + 4;
    g += `<g transform="rotate(-1.5 ${nx + CW} ${ny + 100})">${box(nx, ny, 2 * CW + GX, 200, 28, 77, 2.4, 4)}${lines(['plus puppies!', 'coats are passed down', 'like the real thing'], nx + CW + GX / 2, ny + 70, 48, 52, { w: 700 })}${tape(nx + CW - 60, ny - 18, 120, 36, 3)}</g>`;
    return svgPage(W, H, g + foot() + doodle('paw', 100, 1285, 1, -15) + doodle('paw', 980, 1285, 1, 15));
  };

  // ---------- 3. What you can do ----------
  const F = [['walk', [0, 570, 1179, 655], 'Walks', 'dash, jump and dig for treasure'], ['garden', [0, 160, 1179, 655], 'Garden', 'grow veggies, in season'], ['kitchen', [0, 150, 1179, 655], 'Kitchen', 'cook dog-safe treats'],
    ['house_pack', [0, 880, 1179, 655], 'Home & pack', 'decorate, adopt more dogs'], ['journal_tree', [0, 330, 1179, 655], 'Puppy playdates', 'puppies inherit coats'], ['wardrobe', [0, 200, 1179, 655], 'Dress-up', 'hats, bandanas, sweaters']];
  const p3 = () => {
    let g = paper(W, H) + frame(W, H, 33) + tag(3, 'what you can do') + txt('So much to do', 540, 178, 104, { rot: -1.5 });
    const PW = 396, X = [64, 600], Y0 = 240, RH = 338;
    F.forEach(([img, crop, t, sub], i) => {
      const c = i % 2, r = Math.floor(i / 2), x = X[c] + (r % 2 ? 6 : 0), y = Y0 + r * RH + (c ? 14 : 0), rot = (i % 2 ? 1.6 : -1.6) * (r % 2 ? -1 : 1);
      g += photo(img, crop, x, y, PW, rot, { seed: 3 + i, caption: ' ', tape: i % 2 ? '#FFE3A1' : PINK, tapeRot: i % 2 ? 5 : -5, pad: 12 });
      const ph = Math.round(PW * crop[3] / crop[2]) + 24;
      g += `<g transform="rotate(${rot} ${x + (PW + 24) / 2} ${y + (ph + 78) / 2})">` + txt(t, x + (PW + 24) / 2, y + ph + 36, 44, { w: 700 }) + txt(sub, x + (PW + 24) / 2, y + ph + 68, 32, { fill: MUTED, w: 600 }) + `</g>`;
    });
    return svgPage(W, H, g + foot());
  };

  // ---------- 4. How to play ----------
  const p4 = () => {
    let g = paper(W, H) + frame(W, H, 34) + tag(4, 'how to play') + txt('How to play', 330, 205, 140, { rot: -2.5 }) + txt('free · phone or computer · nothing to download', 540, 270, 48, { fill: MUTED, w: 600 });
    const card = (img, crop, x, y, w, n, t, sub, rot, tp) => photo(img, crop, x, y, w, rot, { seed: n + 20, caption: ' ', tape: tp, tapeRot: rot * 2, pad: 12 })
      + `<g transform="rotate(${rot} ${x + (w + 24) / 2} ${y + 300})"><circle cx="${x + 10}" cy="${y + 8}" r="34" fill="${ORANGE}" stroke="${INK}" stroke-width="4"/>${txt(String(n), x + 10, y + 24, 46, { fill: '#FFF8EC' })}</g>`
      + txt(t, x + (w + 24) / 2, y + Math.round(w * crop[3] / crop[2]) + 24 + 38, 44, { rot, w: 700 }) + txt(sub, x + (w + 24) / 2, y + Math.round(w * crop[3] / crop[2]) + 24 + 72, 31, { fill: MUTED, rot, w: 600 });
    g += card('title', [0, 230, 1179, 1450], 62, 330, 282, 1, 'Tap New game', 'it opens on the title page', -2, PINK);
    g += card('adopt', [0, 0, 1179, 1450], 398, 342, 282, 2, 'Pick a pup', 'there are 14 to meet', 1.5, '#FFE3A1');
    g += card('yard_dusk', [0, 1150, 1179, 830], 728, 360, 282, 3, 'Care for them', 'Feed · Play · Care · Walk', -1.5, PINK);
    // step 4 + controls
    g += card('walk', [0, 560, 1179, 740], 62, 824, 500, 4, 'Go for a walk', 'it is the main way to earn coins', -1.5, '#FFE3A1');
    g += `<g transform="translate(0 22)">${box(610, 800, 400, 400, 30, 51, 2.6, 4.2)}${tape(760, 786, 100, 34, -3)}`
      + txt('on a walk', 810, 862, 52, { w: 700 })
      + [['tap or Space', 'hop'], ['hold', 'long jump'], ['swipe down', 'duck'], ['D', 'dig for treasure']].map(([a, b], i) => txt(a, 642, 930 + i * 64, 42, { anchor: 'start', fill: '#D8607E' }) + txt(b, 978, 930 + i * 64, 42, { anchor: 'end', w: 600 })).join('')
      + txt('and rub your dog to pet it', 810, 1170, 38, { fill: MUTED, w: 600, rot: -1 }) + `</g>`;
    return svgPage(W, H, g + foot() + doodle('paw', 100, 1296, 1, -15) + doodle('spark', 980, 280, 1.2));
  };

  await render(p1(), W, H, 'info1-japan-view.jpg');
  await render(p2(), W, H, 'info2-meet-the-dogs.jpg');
  await render(p3(), W, H, 'info3-what-you-can-do.jpg');
  await render(p4(), W, H, 'info4-how-to-play.jpg');
};
