// "Which face is your dog making today?" carousel (v2.13 "Faces & Feelings"), 1080 x 1350, 9 slides: a cover with six faces,
// seven slides with two faces each (all 14, each on a dog whose personality fits it), and a photo-mode slide.
// The dogs and faces are the real art: PawArt.dog(key, { pose, expr }) / PawArt.dogHead(key, { expr }). Output: faces/face-01..09.jpg.
const fs = require('fs'), path = require('path');
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, doodle, txt, lines, box, swash, paper, svgPage, frame, tape, PA, inner, INK, PINK, MUTED, ORANGE, PLUM } = h;
  const W = 1080, H = 1350;
  fs.mkdirSync(path.join(h.OUT, 'faces'), { recursive: true });
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = async (svg, vw = 240, vh = 200) => mp.evaluate(([sv, vw, vh]) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', vw); e.setAttribute('height', vh); const b = e.getBBox(); w.remove(); return [b.x, b.y, b.width, b.height]; }, [svg, vw, vh]);
  // fit an svg into a box (maxW x maxH), centred on cx, standing on `bottom`
  const fit = async (sv, cx, bottom, maxW, maxH, vw, vh) => { const b = await bbox(sv, vw, vh), k = Math.min(maxW / b[2], maxH / b[3]), w = b[2] * k, hh = b[3] * k;
    return `<svg x="${f1(cx - w / 2)}" y="${f1(bottom - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`; };
  const dog = (key, pose, expr) => PA.dog(key, { pose, expr, anim: false, facing: 'right' });
  const head = (key, expr) => PA.dogHead(key, { expr });
  const NAME = Object.fromEntries(PA.DOGS.map((d) => [d.key, d.name])), BREED = Object.fromEntries(PA.DOGS.map((d) => [d.key, d.breed]));
  const foot = txt('Doodle Doggo · play free on itch.io', 540, 1302, 38, { fill: MUTED, w: 600 });

  // the 14 faces (game/src/41_expressions.js EX_WORDS), each on a dog whose personality fits it, with when it shows up in the game
  const FACES = [
    ['sleepy', 'Sleepy', 'mastiff', 'sit', 'after a big walk. Or just because.'],
    ['surprised', 'Surprised', 'chihuahua', 'sit', 'the doorbell. Again.'],
    ['curious', 'Curious', 'beagle', 'sit', 'what is in that bag?'],
    ['hearts', 'Heart eyes', 'golden', 'happy', 'you came home!'],
    ['proud', 'Proud', 'spitz', 'sit', 'nailed the trick. Applause, please.'],
    ['guilty', 'Guilty', 'dachs', 'sit', 'who dug up the garden? Not me.'],
    ['sneeze', 'Achoo', 'samoyed', 'sit', 'one leaf. Right up the nose.'],
    ['blep', 'Blep', 'pug', 'sit', 'forgot the tongue was out.'],
    ['zoomies', 'Zoomies', 'greyhound', 'happy', 'ball time! Ball time!'],
    ['pout', 'Pout', 'shiba', 'sit', 'ball time is over?!'],
    ['dreamy', 'Dreamy', 'dane', 'sit', 'thinking about dinner.'],
    ['wow', 'Wow', 'akita', 'sit', 'first look at Mt. Fuji today.'],
    ['wink', 'Wink', 'frenchie', 'sit', 'knows something you don’t.'],
    ['yum', 'Yum', 'lab', 'happy', 'dinner! Finally!'],
  ];

  // ---- 1. the cover: the question and six faces up close ----
  {
    let g = paper(W, H) + frame(W, H, 61)
      + txt('faces &amp; feelings · new', 100, 92, 44, { fill: '#D8607E', anchor: 'start' })
      + lines(['Which face is', 'your dog making', 'today?'], 540, 220, 104, 100, { rot: -2 })
      + doodle('spark', 110, 300, 1.3) + doodle('heart', 975, 250, 1.2, 12);
    const pick = [['pug', 'blep', 'Blep'], ['shiba', 'pout', 'Pout'], ['golden', 'hearts', 'Heart eyes'], ['akita', 'wow', 'Wow'], ['frenchie', 'wink', 'Wink'], ['mastiff', 'sleepy', 'Sleepy']];
    for (let i = 0; i < pick.length; i++) {
      const [k, e, word] = pick[i], cx = 200 + (i % 3) * 340, cy = 620 + Math.floor(i / 3) * 315, r = 124;
      g += `<g transform="rotate(${i % 2 ? 2 : -2} ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFBF2"/>${box(cx - r, cy - r, 2 * r, 2 * r, r, 30 + i, 2.4, 4.4)}`
        + await fit(head(k, e), cx, cy + 96, 220, 200, 100, 100) + `</g>` + txt(word, cx, cy + r + 50, 50, { rot: i % 2 ? 2 : -2 });
    }
    g += `<g transform="rotate(-3 540 1205)"><rect x="330" y="1170" width="420" height="70" rx="35" fill="#FFE3A1"/>${box(330, 1170, 420, 70, 35, 81, 1.6, 4)}${txt('swipe for all 14 →', 540, 1219, 46)}</g>` + foot;
    await render(svgPage(W, H, g), W, H, 'faces/face-01-which-face.jpg');
  }

  // ---- 2..8: two faces per slide ----
  for (let s = 0; s < 7; s++) {
    let g = paper(W, H) + frame(W, H, 62 + s) + txt(`faces &amp; feelings · ${s * 2 + 1}–${s * 2 + 2} of 14`, 100, 92, 40, { fill: '#D8607E', anchor: 'start' });
    for (let j = 0; j < 2; j++) {
      const [e, word, k, pose, line] = FACES[s * 2 + j], top = 130 + j * 575, left = j === 0, dx = left ? 300 : 780, tx = left ? 790 : 290;
      g += `<g transform="rotate(${left ? -0.8 : 0.8} 540 ${top + 270})">${box(60, top, 960, 540, 34, 90 + s * 2 + j, 2.4, 4)}</g>`
        + swash(dx, top + 470, 470, 60, left ? -2 : 2, j ? '#FFE3A1' : PINK, 0.5)
        + await fit(dog(k, pose, e), dx, top + 470, 500, 400)
        + txt(word, tx, top + 210, word.length > 8 ? 92 : 112, { rot: left ? -2 : 2 })
        + lines(line.length > 22 ? (() => { const ws = line.split(' '), m = Math.ceil(ws.length / 2); return [ws.slice(0, m).join(' '), ws.slice(m).join(' ')]; })() : [line], tx, top + 300, 44, 50, { fill: MUTED, w: 600 })
        + txt(`${NAME[k] || ''} the ${BREED[k] || ''}`, tx, top + 440, 34, { fill: PLUM, w: 600 });
    }
    g += doodle('paw', 100, 1290, 1, -15) + foot;
    await render(svgPage(W, H, g), W, H, `faces/face-${String(s + 2).padStart(2, '0')}-${FACES[s * 2][0]}-${FACES[s * 2 + 1][0]}.jpg`);
  }

  // ---- 9: photo mode, pick the face for your postcard ----
  {
    let g = paper(W, H) + frame(W, H, 70)
      + txt('photo mode', 100, 92, 44, { fill: '#D8607E', anchor: 'start' })
      + lines(['Pick the face', 'for your postcard'], 540, 210, 104, 100, { rot: -2 });
    // a postcard: the yard at dusk with Noodle winking
    const env = { time: 'dusk', weather: 'sunny', season: 'autumn', halloween: false, jp: true };
    const PX = 150, PY = 380, PW = 780, PH = 520;
    g += `<g transform="rotate(-2 540 ${PY + PH / 2})"><rect x="${PX - 26}" y="${PY - 26}" width="${PW + 52}" height="${PH + 110}" rx="10" fill="#FFFDF7" filter="url(#dd-shadow)"/>`
      + `<svg x="${PX}" y="${PY}" width="${PW}" height="${PH}" viewBox="230 150 420 280" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg>`
      + await fit(dog('dachs', 'happy', 'wink'), 540, PY + PH - 20, 620, 360)
      + `<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="3"/>`
      + txt('Noodle, winking at you', 540, PY + PH + 62, 46, { fill: MUTED }) + tape(480, PY - 46, 120, 40, 4) + `</g>`;
    // the face chips under it, like the picker
    const chips = ['Natural', 'Blep', 'Wink', 'Heart eyes', 'Proud', 'Pout', 'Wow', '+8 more'];
    chips.forEach((c, i) => { const cw = 210, x = 75 + (i % 4) * 237, y = 1010 + Math.floor(i / 4) * 92, on = c === 'Wink';
      g += `<rect x="${x}" y="${y}" width="${cw}" height="70" rx="35" fill="${on ? '#FFE3A1' : '#FFFBF2'}"/>${box(x, y, cw, 70, 35, 120 + i, 1.6, 3.4)}${txt(c, x + cw / 2, y + 48, 40, { w: on ? 700 : 600 })}`; });
    g += txt('14 new faces · play free on itch.io', 540, 1240, 52, { fill: PLUM }) + doodle('spark', 980, 300, 1.2) + doodle('heart', 110, 1180, 1, -12) + foot;
    await render(svgPage(W, H, g), W, H, 'faces/face-09-photo-mode.jpg');
  }
  await mp.close();
};
