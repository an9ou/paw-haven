// The "now in 11 languages" post (v2.14 / v2.14.1): a carousel (a designed cover, then one slide per language, 1080 x 1350),
// one announcement image for the feed and ads (1080 x 1350) and a 9:16 version for Stories and Reels ads (1080 x 1920).
// The screens are real phone-layout screenshots of the shipped game from languages/capture_langs.js (1170 x 2532 each, named <lang>.png in
// the shots dir). Everything we write is English (the owner's rule); the other scripts appear only inside the game's own screens.
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js <shotsdir> languages
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, inner, PA, box, doodle, txt, lines, swash, tape, paper, defs, INK, MUTED, PINK, wordmark, frame } = h;
  const path = require('path'), SHOTS = path.resolve(process.argv[2] || 'shots');
  const LANGS = [['en', 'English'], ['ja', 'Japanese'], ['zh-Hans', 'Simplified Chinese'], ['zh-Hant', 'Traditional Chinese'], ['ko', 'Korean'], ['th', 'Thai'],
    ['es', 'Spanish'], ['pt-BR', 'Brazilian Portuguese'], ['fr', 'French'], ['de', 'German'], ['id', 'Indonesian']];
  const DOG = 'mastiff', NAME = 'Waffles', LINE = 'I am not drooling. I am showing my love.', OUTFIT = { head: 'Flower Crown' };
  const SW = 1170, SH = 2532; // screenshot size (device px)
  // Waffles's line in each language (owner, 23 Oct 2026: the bubble on each language slide speaks that language): the game's own translation
  // of jokes.mastiff.2 (game/i18n/<lang>.json), broken into lines by hand. Japanese, Chinese, Korean and Thai use the game's own fonts
  // (game/fonts/i18n/<lang>.woff2, subset to the game's text, so they hold these lines); the Latin scripts use Caveat like the rest of the post.
  const SAY = {
    en: [['I am not drooling.', 'I am showing', 'my love.'], 46], ja: [['よだれじゃないよ。', '愛があふれてるだけ。'], 38],
    'zh-Hans': [['我不是在流口水。', '我是在表达爱意。'], 40], 'zh-Hant': [['我不是在流口水。', '我是在表達我的愛。'], 40],
    ko: [['침 흘리는 거 아니야.', '사랑을 보여 주는 거야.'], 38], th: [['เราไม่ได้น้ำลายไหล', 'เรากำลังแสดงความรัก'], 35],
    es: [['No estoy babeando.', 'Estoy mostrando', 'mi cariño.'], 46], 'pt-BR': [['Não estou babando.', 'Estou mostrando', 'meu amor.'], 46],
    fr: [['Je ne bave pas.', 'Je montre', 'mon amour.'], 46], de: [['Ich sabbere nicht.', 'Ich zeige', 'meine Liebe.'], 46],
    id: [['Aku tidak ngiler.', 'Aku sedang', 'menunjukkan cintaku.'], 44],
  };
  const FONTDIR = path.join(__dirname, '..', '..', '..', 'game', 'fonts', 'i18n'), LOCAL = ['ja', 'zh-Hans', 'zh-Hant', 'ko', 'th'];
  const fontCSS = '<style>' + LOCAL.map((l) => `@font-face{font-family:'DD ${l}';font-weight:400 700;src:url(file://${path.join(FONTDIR, l + '.woff2')}) format('woff2')}`).join('') + '</style>';
  const fam = (l) => (LOCAL.includes(l) ? `'DD ${l}', Caveat` : 'Caveat');
  const svgDoc = (w, hh, body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">${defs}${body}</svg>`;
  // a screenshot (crop = [x, y, w, h] in device px) drawn into x, y, w, hh
  const shot = (lang, crop, x, y, w, hh, r = 0) => {
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    return `<clipPath id="${id}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(hh)}" rx="${r}"/></clipPath><g clip-path="url(#${id})"><svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMid slice"><image href="file://${path.join(SHOTS, lang + '.png')}" width="${SW}" height="${SH}"/></svg></g>`;
  };
  // a cream phone with the whole screen, height hh, centred on cx, cy, tilted rot degrees
  const phone = (lang, cx, cy, hh, rot = 0, o = {}) => {
    const sw = hh * SW / SH, bez = Math.max(10, hh * 0.022), x = cx - sw / 2, y = cy - hh / 2, R = hh * 0.05;
    return `<g transform="rotate(${rot} ${cx} ${cy})"><g filter="url(#dd-shadow)"><rect x="${f1(x - bez)}" y="${f1(y - bez)}" width="${f1(sw + bez * 2)}" height="${f1(hh + bez * 2)}" rx="${f1(R + bez)}" fill="#FFFDF7"/></g>`
      + shot(lang, [0, 0, SW, SH], x, y, sw, hh, R) + box(x - bez, y - bez, sw + bez * 2, hh + bez * 2, R + bez, o.seed || 31, Math.max(1.2, hh / 600), Math.max(2.6, hh / 230))
      + (o.tape ? tape(cx - hh * 0.09, y - bez - hh * 0.03, hh * 0.18, hh * 0.05, o.tapeRot || -4, o.tape) : '') + '</g>';
  };
  // the real dog art, fitted to maxW x maxH with its feet on `bottom`, with a soft round shadow
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = (sv) => mp.evaluate((s) => { const w = document.createElement('div'); w.innerHTML = s; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 800); e.setAttribute('height', 800); const b = e.getBBox(); w.remove(); return [b.x, b.y, b.width, b.height]; }, sv);
  const fitDog = async (o, cx, bottom, maxW, maxH) => {
    const sv = PA.dog(DOG, Object.assign({ anim: false, outfit: OUTFIT }, o)), b = await bbox(sv), k = Math.min(maxW / b[2], maxH / b[3]), w = b[2] * k, hh = b[3] * k;
    return `<ellipse cx="${f1(cx)}" cy="${f1(bottom - 4)}" rx="${f1(w * 0.42)}" ry="${f1(Math.max(8, w * 0.045))}" fill="#5B3D32" opacity=".16"/>`
      + `<svg x="${f1(cx - w / 2)}" y="${f1(bottom - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`;
  };
  // a crayon speech bubble with the tail pointing down at tx (relative to the box)
  const bubble = (x, y, w, hh, arr, size, tail, seed = 61, font = 'Caveat') => {
    const [ta, tb, tc] = tail; // tail base from x+ta to x+tb, tip at (x+tc, y+hh+depth)
    const dep = hh * 0.42;
    return `<path d="M${x + ta} ${y + hh - 2}L${x + tc} ${y + hh + dep}L${x + tb} ${y + hh - 2}Z" fill="#FFFBF2"/><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${Math.min(30, hh / 3)}" fill="#FFFBF2"/>`
      + box(x, y, w, hh, Math.min(30, hh / 3), seed, 2, 4.2) + `<path d="M${x + ta} ${y + hh}L${x + tc} ${y + hh + dep}L${x + tb} ${y + hh}" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linejoin="round" stroke-linecap="round"/>`
      + arr.map((s, i) => `<text x="${x + w / 2}" y="${f1(y + (hh - (arr.length - 1) * size * 1.2) / 2 + size * 0.34 + i * size * 1.2)}" font-family="${font}" font-weight="700" font-size="${size}" fill="${INK}" text-anchor="middle">${s}</text>`).join('');
  };
  const pill = (s, cx, cy, w, hh, rot, fill = '#FFE3A1', size = 46, seed = 71) => `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="${cx - w / 2}" y="${cy - hh / 2}" width="${w}" height="${hh}" rx="${hh / 2}" fill="${fill}"/>${box(cx - w / 2, cy - hh / 2, w, hh, hh / 2, seed, 1.6, 4)}${txt(s, cx, cy + size * 0.34, size)}</g>`;
  const W = 1080, H = 1350;

  // ---------- carousel 1: the designed cover ----------
  {
    let g = paper(W, H) + frame(W, H, 41);
    for (const [n, x, y, s, r] of [['spark', 110, 120, 1.4, 0], ['heart', 975, 140, 1.3, 12], ['paw', 965, 1235, 1.3, -12], ['spark', 1000, 400, 1.1, 0], ['heart', 85, 430, 1.1, -10], ['leaf', 75, 1120, 1.3, 20]]) g += doodle(n, x, y, s, r);
    g += wordmark(540, 128, 64);
    g += txt('now in', 540, 262, 88, { rot: -2, fill: MUTED });
    g += swash(540, 352, 760, 120, -2, PINK, 0.42) + txt('11 languages', 540, 392, 168, { rot: -2 });
    // a fan of five phones: Japanese, Thai, English (front), Korean, Spanish
    const fan = [['ja', 215, 735, 420, -11, '#FFE3A1'], ['ko', 865, 735, 420, 11, '#BFE3C9'], ['th', 350, 712, 485, -5.5, '#CFE0F7'], ['es', 730, 712, 485, 5.5, '#E0D5F0'], ['en', 540, 700, 540, 0, PINK]];
    fan.forEach(([l, x, y, hh, r, tp], i) => { g += phone(l, x, y, hh, r, { seed: 50 + i, tape: tp, tapeRot: r * 0.6 - 3 }); });
    // Waffles in front, with his own line
    g += await fitDog({ pose: 'sit', facing: 'left' }, 870, 1225, 290, 250);
    g += bubble(390, 1010, 370, 92, ['hello in every language!'], 40, [290, 330, 380], 62);
    g += lines(['English · Japanese · Chinese · Korean · Thai', 'Spanish · Portuguese · French · German · Indonesian'], 410, 1196, 34, 42, { fill: MUTED, w: 600 });
    g += txt('swipe →', 960, 1300, 42, { rot: -3, fill: MUTED });
    await render(svgDoc(W, H, g), W, H, 'languages/languages-01-cover.jpg');
  }

  // ---------- carousel 2-12: one slide per language ----------
  for (let i = 0; i < LANGS.length; i++) {
    const [l, name] = LANGS[i];
    let g = paper(W, H) + frame(W, H, 60 + i);
    const ts = name.length > 16 ? 108 : 132;
    g += swash(540, 150 + ts * 0.02, Math.min(900, name.length * ts * 0.48 + 120), ts * 0.62, -2, PINK, 0.4) + txt(name, 540, 150 + ts * 0.33, ts, { rot: -2 });
    g += txt(`${i + 1} of 11 languages in Doodle Doggo`, 540, 262, 44, { fill: MUTED, w: 600 });
    g += phone(l, 330, 802, 930, -2.5, { seed: 80 + i, tape: '#FFE3A1', tapeRot: -6 });
    // right column: what the dog says, in the slide's language, and the dog
    g += txt(`${NAME} says:`, 815, 372, 46, { fill: MUTED, w: 600 });
    g += bubble(600, 395, 430, 200, SAY[l][0], SAY[l][1], [155, 205, 175], 63, fam(l));
    g += await fitDog({ pose: i % 2 ? 'happy' : 'sit', facing: 'left' }, 815, 1010, 340, 300);
    g += lines(['play free at', 'doodledoggo.app'], 815, 1110, 50, 56, { w: 700 });
    g += doodle(['spark', 'heart', 'paw', 'flower'][i % 4], 960, 1210, 1.3, 10) + doodle('spark', 640, 1200, 1, 0);
    await render(svgDoc(W, H, fontCSS + g), W, H, `languages/languages-${String(i + 2).padStart(2, '0')}-${l}.jpg`);
  }

  // ---------- the announcement image: all 11 screens on one page ----------
  // each tile shows the bottom of the screen: the dog's bubble, the dog, the place buttons and the menu (crop of the device px)
  const grid = async (w, hh, o) => {
    let g = paper(w, hh) + frame(w, hh, o.seed);
    const k = o.titleK || 1;
    g += wordmark(w / 2, o.top, 56 * k);
    g += txt('now in', w / 2, o.top + 96 * k, 64 * k, { rot: -2, fill: MUTED });
    g += swash(w / 2, o.top + 158 * k, 640 * k, 96 * k, -2, PINK, 0.42) + txt('11 languages', w / 2, o.top + 192 * k, 124 * k, { rot: -2 });
    const { cols, tw, th, gx, gy, x0, y0, crop } = o;
    const slots = LANGS.map((L, i) => [L, i]);
    for (const [[l, name], i] of slots) {
      const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (tw + gx), y = y0 + r * (th + o.lab + gy), rot = ((i * 37) % 5 - 2) * 0.6;
      g += `<g transform="rotate(${f1(rot)} ${x + tw / 2} ${y + th / 2})"><g filter="url(#dd-shadow)"><rect x="${x - 7}" y="${y - 7}" width="${tw + 14}" height="${th + 14 + o.lab}" rx="14" fill="#FFFDF7"/></g>`
        + shot(l, crop, x, y, tw, th, 8) + `<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="8" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="2.6"/>`
        + txt(name, x + tw / 2, y + th + o.lab * 0.72, name.length > 16 ? o.labSize * 0.82 : o.labSize, { w: 700 }) + '</g>';
    }
    // the last slot: Waffles and the call to action
    const n = LANGS.length, c = n % cols, r = Math.floor(n / cols), x = x0 + c * (tw + gx), y = y0 + r * (th + o.lab + gy);
    g += await fitDog({ pose: 'happy', facing: 'left' }, x + tw / 2, y + th * 0.78, tw * 0.95, th * 0.7);
    g += lines(['free, in your', 'browser'], x + tw / 2, y + th * 0.78 + o.labSize * 1.25, o.labSize, o.labSize * 1.05, { w: 700 });
    g += pill('play free at doodledoggo.app', w / 2, o.pillY, 620, 68, -2, '#FFE3A1', 44);
    for (const [k, dx, dy, s, rr] of o.doodles) g += doodle(k, dx, dy, s, rr);
    return svgDoc(w, hh, g);
  };
  // 1080 x 1350: 4 columns x 3 rows; tiles crop the screen from the bubble down (device y 1080..2532)
  await render(await grid(W, H, { seed: 91, top: 84, cols: 4, tw: 193, th: 240, gx: 42, gy: 20, x0: 91, y0: 332, crop: [0, 1080, SW, 1452], lab: 40, labSize: 29, pillY: 1268,
    doodles: [['spark', 110, 70, 1.2, 0], ['heart', 985, 90, 1.2, 12], ['paw', 120, 1290, 1.1, -12], ['spark', 975, 1295, 1, 0]] }), W, H, 'languages/languages-announce.jpg');
  // 1080 x 1920 (Stories and Reels ads): the same 4 x 3 grid, bigger title, tiles a little taller (device y 1060..2532);
  // the top 250 and bottom 280 px stay free of anything that matters (the app's own name bar and buttons sit there)
  await render(await grid(W, 1920, { seed: 92, top: 330, titleK: 1.15, cols: 4, tw: 214, th: 269, gx: 30, gy: 22, x0: 68, y0: 600, crop: [0, 1060, SW, 1472], lab: 44, labSize: 31, pillY: 1625,
    doodles: [['spark', 120, 290, 1.3, 0], ['heart', 965, 300, 1.3, 12], ['paw', 110, 1625, 1.2, -12], ['spark', 975, 1630, 1.1, 0]] }), W, 1920, 'languages/languages-announce-story.jpg');
  await mp.close();
};
