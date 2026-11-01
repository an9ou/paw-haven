// RedNote (小红书) 3:4 cover for the puppy coat Reel (owner, 1 Nov 2026), 1080 x 1440, in the style of the other RedNote posters
// (make_rednote_posters.js): paper, pencil frame, the wordmark, LXGW WenKai, the game's real art. It hides the answer: two chocolate Labradors,
// the clue, and three question marks. Every text in a pill, sticker or bubble is centred by its ink and checked (centre_text.js, owner's rule).
// Coat colours from the game's genetics (mods/genes.js), zh-Hans coat names from the game (data.words.lab.*). No link: "搜索 Doodle Doggo".
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js shots pupsposter      writes brand/rednote/rednote-05-pups.jpg
module.exports = async function ({ browser, helpers: h }) {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const { CENTRE_JS } = require('../centre_text.js');
  const { f1, doodle, dog, paper, svgPage, frame, wordmark, INK, PINK, MUTED, ORANGE } = h;
  const root = path.join(h.OUT, '..', '..', '..');
  const W = 1080, H = 1440, ZH = "'LXGW WenKai', Caveat";
  const zh = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${ZH}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || INK}" text-anchor="middle"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
  const I18N = JSON.parse(fs.readFileSync(path.join(root, 'game', 'i18n', 'zh-Hans.json'), 'utf8'));
  const t = (k) => { const v = I18N[k]; if (!v) throw new Error('missing text ' + k); return v; };
  const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'mods', 'genes.js'), 'utf8'), ctx);
  const ph = win.PawGenes.phenotype({ B: ['b', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, 'lab', 5);
  if (ph.coatName !== 'Chocolate') throw new Error('genes changed: ' + ph.coatName);
  const choc = t('data.words.lab.liver');
  const at = (o, cx, feet, w) => dog('lab', Object.assign({ coat: ph.coat, seed: 5 }, o), f1(cx - w / 2), f1(feet - w * 160 / 214 * 0.9125), w);

  const body = paper(W, H) + frame(W, H, 97)
    + wordmark(450, 150, 90) + doodle('heart', 140, 96, 1.1, -12) + doodle('spark', 760, 90, 1)
    + zh('两只巧克力色狗狗', 540, 372, 96, { rot: -1.5 }) + zh(`生了<tspan fill="${ORANGE}">3</tspan>只小狗`, 540, 500, 124, { rot: -1.5 })
    + zh('你猜得到是什么颜色吗？', 540, 572, 46, { fill: MUTED })
    + at({ pose: 'idle', facing: 'right' }, 290, 900, 360) + at({ pose: 'idle', facing: 'left', seed: 9 }, 790, 900, 360)
    + doodle('heart', 540, 700, 1.3, 6)
    + zh('这个游戏里，小狗的毛色按真实的遗传规律', 540, 1320, 38, { fill: MUTED })
    + zh('搜索 Doodle Doggo 就能玩', 540, 1384, 44, { fill: ORANGE })
    + doodle('paw', 96, 1356, 1.2, -15) + doodle('bone', 984, 1358, 1.2, 18) + doodle('spark', 1000, 640, 1)
    + '<g id="boxes"></g>';
  // the boxed texts, placed in the page by their ink
  const boxes = { ZH, INK, PINK,
    pills: [[`妈妈：${choc}`, 290, 960, 44, '#FFFDF7'], [`爸爸：${choc}`, 790, 960, 44, '#FFFDF7'], ['都携带黄色和淡化（更浅的毛色）', 540, 1048, 42, '#FFE3A1']],
    bubbles: [[250, 1172], [540, 1172], [830, 1172]],
    sticker: { cx: 905, cy: 172, r: 104, fill: '#FCE1E7', lines: ['先猜再看', '评论区见'], size: 36, rot: 8 } };

  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const html = path.join(h.OUT, '.tmp-pups-poster.html');
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap" rel="stylesheet"><link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css" rel="stylesheet"><style>html,body{margin:0;background:#fff}svg{display:block}</style>${svgPage(W, H, body)}<script>${CENTRE_JS}</script>`);
  await page.goto('file://' + html); await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
  const off = await page.evaluate((B) => {
    const F = B.ZH; let s = B.pills.map(([txt, x, y, size, fill]) => pill(txt, x, y, size, F, { fill, stroke: B.INK, color: B.INK })).join('');
    s += B.bubbles.map(([x, y]) => '<g data-box><circle cx="' + x + '" cy="' + y + '" r="78" fill="#FFFDF7" stroke="' + B.INK + '" stroke-width="6"/>' + centred([{ s: '?', size: 124, fill: B.INK }], x, y, F).svg + '</g>').join('');
    const k = B.sticker; s += '<g transform="rotate(' + k.rot + ' ' + k.cx + ' ' + k.cy + ')"><g data-box><circle cx="' + k.cx + '" cy="' + k.cy + '" r="' + k.r + '" fill="' + k.fill + '" stroke="' + B.INK + '" stroke-width="5"/>'
      + centred(k.lines.map((l) => ({ s: l, size: k.size, pitch: k.size * 1.3, fill: B.INK })), k.cx, k.cy, F).svg + '</g><circle cx="' + k.cx + '" cy="' + k.cy + '" r="' + (k.r - 12) + '" fill="none" stroke="' + B.PINK + '" stroke-width="6" stroke-dasharray="14 10"/></g>';
    document.getElementById('boxes').innerHTML = s;
    return centreCheck(document.querySelector('svg'));
  }, boxes);
  if (off.length) throw new Error('text not centred: ' + off.join('; '));
  const out = path.join(root, 'brand', 'rednote', 'rednote-05-pups.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: W, height: H } }); await page.close(); fs.unlinkSync(html);
  console.log('wrote', path.relative(root, out));
};
