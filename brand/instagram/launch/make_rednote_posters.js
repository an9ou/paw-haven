// RedNote (小红书) posters for the two Reels (owner, 30 Oct 2026), 1080 x 1440 (RedNote's 3:4), in the same style as the hello poster
// (make_rednote.js): paper, pencil frame, the wordmark, LXGW WenKai (the game's zh-Hans font), the game's real art. Each one works as the
// 3:4 cover of its video note and as an image note on its own. No link anywhere (owner, 29 Oct 2026): "搜索 Doodle Doggo".
//   rednote-02-trick.jpg  the trick-or-treat Reel: "第4扇门，零食全没了", Noodle running from Butter in the Dinosaur Hood, the four new costumes.
//   rednote-03-safe.jpg   the food-safety Reel: "狗狗不能吃的7种食物", the game's own food names and icons, the safe swaps, "call your vet".
// Every food and costume name is the game's own zh-Hans text (game/i18n/zh-Hans.json). Output: brand/rednote/
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js shots rednoteposters
module.exports = async function ({ render, helpers: h }) {
  const { f1, inner, box, doodle, swash, arrow, dog, paper, svgPage, frame, wordmark, INK, PINK, MUTED, ORANGE } = h;
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const root = path.join(h.OUT, '..', '..', '..');
  fs.mkdirSync(path.join(root, 'brand', 'rednote'), { recursive: true });
  const W = 1080, H = 1440, ZH = "'LXGW WenKai', Caveat", RED = '#D9534F', GREEN = '#4E9A54';
  const font = '<style>@import url("https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css");</style>';
  const zh = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${ZH}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || INK}" text-anchor="${o.anchor || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
  const at = (key, o, cx, feet, w) => dog(key, o, f1(cx - w / 2), f1(feet - w * 160 / 214 * 0.9125), w);
  // the game's text, and the item icons (they live in the later world files, which make.js doesn't load)
  const I18N = JSON.parse(fs.readFileSync(path.join(root, 'game', 'i18n', 'zh-Hans.json'), 'utf8'));
  const t = (k) => { const v = I18N[k]; if (!v) throw new Error('missing text ' + k); return v; };
  const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
  for (const f of ['dogs/pawart_dogs.js', ...fs.readdirSync(path.join(root, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort().map((f) => 'world/' + f)]) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
  const PA = win.PawArt;
  const art = (s, x, y, w, hh) => { const vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<svg x="${x}" y="${y}" width="${w}" height="${hh || w}" viewBox="${vb}" overflow="visible">${inner(s)}</svg>`; };
  const item = (name, x, y, w) => art(PA.item(name), x, y, w);
  // a round sticker with a few short lines, centred
  // pale fill, a coloured ring and dark ink words (owner, 30 Oct 2026: white words on colour were too big and hard to read)
  const sticker = (cx, cy, r, fill, ring, lines, size, rot) => `<g transform="rotate(${rot} ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="${ring}" stroke-width="6" stroke-dasharray="14 10"/>${lines.map((s, i) => zh(s, cx, f1(cy + size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.25), size)).join('')}</g>`;
  const footer = (line) => zh(line, 540, 1326, 46) + zh('搜索 Doodle Doggo 就能玩', 540, 1384, 44, { fill: ORANGE })
    + doodle('paw', 96, 1350, 1.2, -15) + doodle('bone', 984, 1352, 1.2, 18);

  // ---------- the trick-or-treat poster ----------
  const WITCH = { body: 'Little Witch Hat & Cape' };
  const TREAT = {   // the Reel's dog-safe treats, crayon style
    bone: `<path d="M-26 -7 Q-36 -18 -26 -21 Q-20 -24 -18 -14 L18 -14 Q20 -24 26 -21 Q36 -18 26 -7 Q36 4 26 7 Q20 10 18 0 L-18 0 Q-20 10 -26 7 Q-36 4 -26 -7Z" fill="#F6E1B8" stroke="${INK}" stroke-width="4" stroke-linejoin="round" transform="translate(0 7)"/>`,
    carrot: `<path d="M-8 -20 L8 -20 L0 30Z" fill="#E8863A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M0 -20 Q-10 -36 -14 -32 M0 -20 Q2 -38 6 -36 M0 -20 Q10 -32 14 -28" fill="none" stroke="#5E9A4A" stroke-width="5" stroke-linecap="round"/>`,
    cookie: `<circle r="22" fill="#F2A65A" stroke="${INK}" stroke-width="4"/><path d="M-8 -6 L-4 -10 M6 -8 L10 -3 M-10 8 L-5 10 M5 6 L9 10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  };
  const COSTUMES = [['corgi', 'Scarecrow Overalls', 'scarecrow_overalls'], ['husky', 'Skeleton Suit', 'skeleton_suit'], ['pug', 'Mummy Wraps', 'mummy_wraps'], ['lab', 'Dinosaur Hood', 'dinosaur_hood']];
  const trick = paper(W, H) + frame(W, H, 52)
    + wordmark(450, 150, 90) + doodle('bat', 140, 100, 1.4, -10) + doodle('spark', 760, 90, 1)
    + sticker(905, 172, 104, '#FFE3A1', ORANGE, [t('fm.m_halloween'), '开到11月15日'], 25, 8)
    + zh('第4扇门，', 540, 380, 112, { rot: -1.5 }) + zh('零食全没了', 540, 505, 124, { rot: -1.5 })
    + zh('不给糖就捣蛋，蜡笔版', 540, 582, 46, { fill: MUTED, w: 400 })
    // the punchline: Butter says WOOF, Noodle runs, the treats stay in the bucket
    + swash(540, 935, 940, 120, -2, ORANGE, 0.28)
    + art(PA.prop('jackolantern', { lit: true }), 410, 840, 130)
    + `<g transform="translate(445 846) rotate(-25) scale(1.1)">${TREAT.bone}</g><g transform="translate(476 836) scale(1.1)">${TREAT.carrot}</g><g transform="translate(510 848) rotate(25) scale(1.1)">${TREAT.cookie}</g>`
    + `<g transform="translate(0 -40) rotate(-8 230 950)">${at('dachs', { pose: 'jump', facing: 'left', outfit: WITCH, expr: 'zoomies' }, 230, 950, 330)}</g>`
    + at('lab', { pose: 'happy', facing: 'left', outfit: { body: 'Dinosaur Hood' } }, 790, 965, 400)
    + `<g transform="rotate(6 860 680)"><rect x="760" y="625" width="190" height="96" rx="40" fill="#FFF8EC" stroke="${INK}" stroke-width="5"/>${zh('汪！', 855, 694, 60)}</g>`
    + zh('……零食不要了', 250, 690, 46, { rot: -4 }) + arrow(300, 712, 430, 830, [30, -10], 5)
    // the four new costumes
    + box(110, 1000, 860, 270, 40, 61, 2.4, 4.2)
    + zh(t('fm.m_halloween') + '新服装', 540, 1052, 44, { fill: ORANGE })
    + COSTUMES.map(([key, outfit, id], i) => { const cx = [240, 432, 648, 850][i]; return at(key, { pose: key === 'lab' ? 'happy' : 'sit', facing: i < 2 ? 'right' : 'left', outfit: { body: outfit } }, cx, 1196, 170) + zh(t(`data.clothes.${id}.n`), cx, 1246, 31, { w: 400 }); }).join('')
    + footer('免费 · 没有广告 · 浏览器直接玩')
    + doodle('bat', 1000, 560, 1.1, 12) + doodle('heart', 96, 640, 1, -12);
  await render(svgPage(W, H, font + trick), W, H, '../../rednote/rednote-02-trick.jpg');

  // ---------- the food-safety poster ----------
  const pf = (id) => t(`data.people_food.${id}.name`);
  const NEVER = [['Grapes', pf('grapes')], ['Raisins', pf('raisins')], ['Chocolate', pf('chocolate')], ['Sugar-free Gum', pf('gum') + '（木糖醇）'],
    ['Onion', pf('onion')], ['Garlic', pf('garlic')], ['Macadamia Nuts', pf('macadamia')]];
  const OK = [['Blueberries', t('data.crops.blueberries.name')], ['Carrot', t('data.crops.carrot.name')], ['Pumpkin', t('data.crops.pumpkin.name') + '（原味）']];
  const row = (name, label, x, y, size) => item(name, x, y - 46, 84) + zh(label, x + 100, y + 14, size, { anchor: 'start', w: 600 });
  const safe = paper(W, H) + frame(W, H, 71)
    + wordmark(450, 150, 90) + doodle('heart', 140, 96, 1.1, -12) + doodle('spark', 760, 90, 1)
    + sticker(905, 172, 104, '#FCE1E7', PINK, ['先收藏！', '给狗狗备用'], 28, -8)
    + zh('狗狗不能吃的', 540, 360, 104, { rot: -1.5 }) + zh(`<tspan fill="${RED}">7</tspan>种食物`, 540, 488, 130, { rot: -1.5 })
    + zh('每一条都是游戏里的狗狗安全小知识', 540, 556, 42, { fill: MUTED, w: 400 })
    // never for dogs: two columns
    + box(70, 588, 940, 432, 36, 81, 2.4, 4.2)
    + art(PA.icon('paw-stop'), 100, 606, 64) + zh('狗狗不能吃', 180, 656, 54, { anchor: 'start', fill: RED })
    + NEVER.map(([n, l], i) => row(n, l, i < 4 ? 110 : 560, 728 + (i % 4) * 76, 46)).join('')
    // the swaps, with Noodle delighted
    + box(70, 1044, 940, 200, 36, 91, 2.4, 4.2)
    + zh('✓', 118, 1104, 64, { fill: GREEN }) + zh('可以换成', 160, 1100, 50, { anchor: 'start', fill: GREEN })
    + OK.map(([n, l], i) => row(n, l, 110 + i * 240, 1200, 42)).join('')
    + at('dachs', { pose: 'happy', facing: 'left', expr: 'hearts' }, 880, 1142, 136)
    + zh('不小心吃了？马上联系兽医。', 540, 1292, 48, { fill: RED, rot: -1 })
    + zh('在这个游戏里，有毒的食物做不出来，也喂不了', 540, 1338, 34, { fill: MUTED, w: 400 })
    + zh('搜索 Doodle Doggo 就能玩', 540, 1388, 42, { fill: ORANGE })
    + doodle('paw', 96, 1360, 1.2, -15) + doodle('bone', 984, 1362, 1.2, 18) + doodle('spark', 1000, 560, 1);
  await render(svgPage(W, H, font + safe), W, H, '../../rednote/rednote-03-safe.jpg');
};
