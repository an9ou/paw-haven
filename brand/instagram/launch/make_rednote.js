// The first RedNote (小红书) post: a "hello" poster in Simplified Chinese, 1080 x 1440 (RedNote's 3:4).
// The dogs are the real art (Mochi, Noodle and Sunny in the banner's outfits). Chinese is LXGW WenKai, the font the game itself
// uses for zh-Hans (game/fonts/i18n/zh-Hans.css), loaded whole from jsdelivr because the game's copy is subset to the game's text.
// The words follow the reviewed zh-Hans text in docs/marketing/TAPTAP_INTRO.md. Output: brand/rednote/rednote-01-hello.jpg
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js shots rednote
module.exports = async function ({ render, helpers: h }) {
  const { f1, box, doodle, swash, txt, arrow, dog, paper, svgPage, frame, wordmark, INK, PINK, MUTED, ORANGE } = h;
  const fs = require('fs'), path = require('path');
  fs.mkdirSync(path.join(h.OUT, '..', '..', 'rednote'), { recursive: true });
  const W = 1080, H = 1440, ZH = "'LXGW WenKai', Caveat";
  const font = '<style>@import url("https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css");</style>';
  const zh = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${ZH}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || INK}" text-anchor="${o.anchor || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
  // a dog whose feet stand on `feet`, centred on cx (the crop puts the feet 91% down)
  const at = (key, o, cx, feet, w) => dog(key, o, f1(cx - w / 2), f1(feet - w * 160 / 214 * 0.9125), w);
  const feat = (icon, s, y) => doodle(icon, 180, y - 15, 1.2, -8) + zh(s, 226, y, 44, { anchor: 'start', w: 400 });
  const body = paper(W, H) + frame(W, H, 41)
    + wordmark(470, 160, 96) + doodle('spark', 140, 92, 1.2) + doodle('heart', 760, 96, 1, 14)
    // the hello sticker
    + `<g transform="rotate(8 902 170)"><circle cx="902" cy="170" r="108" fill="${PINK}" stroke="${INK}" stroke-width="5"/>${zh('你好，', 902, 158, 46, { fill: '#FFF8EC' })}${zh('小红书！', 902, 214, 46, { fill: '#FFF8EC' })}</g>`
    + zh('领养一只', 540, 380, 104, { rot: -1.5 }) + zh('歪歪扭扭的蜡笔小狗', 540, 500, 100, { rot: -1.5 })
    + zh('一款画在铅笔素描本里的温馨狗狗游戏', 540, 580, 44, { fill: MUTED, w: 400 })
    // the dogs on a crayon swash
    + swash(540, 900, 920, 130, -2) + swash(520, 930, 760, 80, 1.5, '#FFE3A1', 0.5)
    + at('shiba', { pose: 'sit', facing: 'right', outfit: { body: 'Happi Coat' } }, 195, 920, 300)
    + at('golden', { pose: 'happy', facing: 'left', outfit: { head: 'Flower Crown' } }, 885, 920, 300)
    + at('dachs', { pose: 'happy', facing: 'right', outfit: { eyes: 'Heart Sunglasses', neck: 'Red Bandana' } }, 505, 945, 400)
    + zh('画得丑？是故意的！', 790, 652, 42, { rot: 5, w: 400 }) + arrow(760, 680, 660, 770, [30, 10], 3)
    // what you can do
    + box(130, 980, 820, 278, 40, 43, 2.4, 4.2)
    + feat('paw', '35种狗狗，每一只都有自己的表情', 1042) + feat('leaf', '在富士山下的小镇散步、找宝物', 1104)
    + feat('flower', '种菜，再做成对狗狗安全的零食', 1166) + feat('heart', '这里从来不会发生坏事', 1228)
    // how to play
    + zh('免费 · 没有广告 · 浏览器直接玩', 540, 1326, 50)
    + `<text x="540" y="1382" font-family="Caveat" font-weight="700" font-size="48" fill="${ORANGE}" text-anchor="middle">doodledoggo.app</text>`
    + doodle('paw', 96, 1350, 1.2, -15) + doodle('bone', 984, 1352, 1.2, 18) + doodle('spark', 1000, 560, 1) + doodle('heart', 96, 640, 1, -12);
  await render(svgPage(W, H, font + body), W, H, '../../rednote/rednote-01-hello.jpg');
};
