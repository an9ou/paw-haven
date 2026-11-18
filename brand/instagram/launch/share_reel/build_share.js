// The 18 Nov 2026 "Share my dog" Reel (v2.31; shot table, facts and rebuild: docs/marketing/SHARE_REEL.md). English cut only.
// Noodle the dachshund (PawArt.dog 'dachs' of origin/main, in the Autumn Scarf, as in his share pictures) tells it, big in every beat, standing on
// open ground. The backgrounds are the game's own places as main draws them (svg.world grabbed by capture_share.js; autumn, sunny, day; none of the
// gift Reel's yard, pier, square or living room): the Dog Park, Hilltop Meadow, the Training Ground, the Splash Pool, Maple Woods, Sunny Park and
// Riverside, drawn at 3.2x so a scene's full height fills the frame. The pictures are the game's own: shareDog's PNGs (window.__paw.sh.draw) for
// Noodle (Post with Show name off, Story with it on) and three other dogs, the phone's More tray, the Bond level card with "Share this moment", the
// Share my dog sheet. Beats: hook (free, your dog as a crayon drawing, two sizes), how (phone: More, Share; computer: the top bar), Post or Story and
// the name, every dog gets one, Share this moment, made on your device, the ask (share your doodle and tag us), our standard end card for 2.5 s.
// Every fact is checked against main's game text (game/i18n/en.json, game/src) and the captures; the build stops if one changed. Every frame:
// centreCheck(), safeCheck(), apartCheck() (../centre_text.js), Noodle on the scene's floor and 28 px clear of the scene's own props (KEEP below),
// words and key art inside x 60..850, y 270..1440. 1080 x 1920, 30 fps. Voice: Noodle, Kokoro af_bella 1.1x (vo_share.json via
// ../friends_reel/vo_friends.py). Music: the game's own park music (mods/pawaudio.js) about 11 dB under the voice.
//
//   git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/share_reel/capture_share.js <main> <caps dir>
//   VO_LINES=brand/instagram/launch/share_reel/vo_share.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/share_reel/build_share.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,...). FRAMES=a-b: re-render only frames a..b, then encode again with the same sound.
//   CHECK=1: every frame's checks without screenshots. LOOSE=1 (stills only, for layout work): print a failed check and go on.
//   ONLY=cover: the cover, share-cover.jpg (1080 x 1920; key content inside the 3:4 grid crop, y 240..1680).
// REDNOTE=1: the RedNote cut (as gift_reel/build_gift.js): every word in Simplified Chinese (the game's own zh-Hans words, checked below), the
// captures made with PAW_LANG=zh-Hans, Noodle in Mandarin (../friends_reel/vo_friends_zh.py with VO_LINES=share_reel/vo_share_zh.json, zf_073 1.0x;
// Noodle is said 面条), subtitles of at most 14 characters, LXGW WenKai, no safe zone (everything in front of the scene moved 85 px right), the
// RedNote end card (the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App") centred at (540, 960). Output doodle-doggo-share-my-dog-rednote.mp4;
// ONLY=cover writes brand/rednote/rednote-20-share-my-dog.jpg (3:4, the cover's y 240..1680).
// RedNote rule (owner, 18 Nov 2026: RedNote limits traffic for promoting other apps): never suggest posting or sending to other apps; say 分享给朋友.
// No tag us, no @handle, no post / story in a social-media sense: the game's zh-Hans size names are 帖子 and 快拍, so the sizes are 两种尺寸 here,
// the sheet is captured with its size buttons hidden, and the "Doodle Doggo · doodledoggo.app" chip is cropped off every share picture and off the
// sheet's preview. The build stops on any word of RN_BAN in the cut's own words, the voice, or the captured game text.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles, RN_FONT_CSS } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'share_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills', 'img']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const RN = !!process.env.REDNOTE, VOFILE = RN ? 'vo_share_zh.json' : 'vo_share.json';
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, VOFILE), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from ' + VOFILE + ': ' + k);

// ---- the facts, checked against main (the game's own words and numbers) ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const SRC = (f) => fs.readFileSync(path.join(ART_ROOT, 'game', 'src', f), 'utf8');
const must = (k, re) => { if (!re.test(EN[k] || '')) throw new Error('the game text changed: ' + k + ' no longer says ' + re); };
must('sh.title', /^Share my dog$/); must('sh.btn', /^Share my dog$/); must('sh.moment', /^Share this moment$/); must('sh.share', /^Share$/);
must('sh.size_post', /^Post$/); must('sh.size_story', /^Story$/); must('sh.show_name', /^Show name$/);
must('sh.note', /^The picture is made on your device\. Your dog's name is on it only if you turn it on\.$/);
must('phone.t_share', /^Share$/); must('fw.more', /^More$/);
must('nw.v231.share', /a big crayon picture of your dog in your own yard, ready for a post or a story/);
must('nw.v231.moment', /^Share this moment after a walk, a new Bond level or a story scene$/);
const SH = SRC('58_share.js');
if (!/SH_SIZES = \{ feed: \{ w: 1080, h: 1350 \}, story: \{ w: 1080, h: 1920 \} \}/.test(SH)) throw new Error('the share sizes changed');
if (!/Nothing is uploaded anywhere: the PNG is drawn on the device/.test(SH) || /fetch\(|XMLHttpRequest|sendBeacon/.test(SH)) throw new Error('58_share.js may send something now');
if (!/name = o\.name && d\.name/.test(SH)) throw new Error('the name is not optional any more');
if (!/from === 'walk'|#resOk/.test(SH) || !/#luOk/.test(SH) || !/on\('sc:end'/.test(SH)) throw new Error('Share this moment moved');
if (!/more: \['photo', 'share'/.test(SRC('47_firstweek.js')) || !/share: \(\) => shareDog\(\{ from: 'menu' \}\)/.test(SRC('47_firstweek.js'))) throw new Error('the phone More tray has no Share tile');
const ZH = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'zh-Hans.json'), 'utf8'));
const mustZ = (k, w) => { if (!(ZH[k] || '').includes(w)) throw new Error('the zh-Hans game text changed: ' + k + ' no longer says ' + w); };
if (RN) { mustZ('sh.title', '分享我的狗狗'); mustZ('sh.moment', '分享这一刻'); mustZ('sh.show_name', '显示名字'); mustZ('sh.note', '图片只在你的设备上生成。');
  mustZ('fw.more', '更多'); mustZ('phone.t_share', '分享'); mustZ('nw.v231.moment', '散步之后、亲密度升级时、故事场景之后，都可以“分享这一刻”');
  // the size buttons say post and story in the social-media sense: they stay out of the cut (hidden in the sheet capture)
  if (ZH['sh.size_post'] !== '帖子' || ZH['sh.size_story'] !== '快拍') throw new Error('the zh-Hans size names changed: check the RedNote rule again'); }
if (!/stPcTop\.id = 'stPcBtn'/.test(SRC('56_stories.js')) || !/tt\('sh\.btn', 'Share my dog'\)/.test(SRC('56_stories.js'))) throw new Error('the desktop top-bar Share button moved');
// the captures (capture_share.js)
const FACTS = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8'));
const pic = (k, w, h, name) => { const f = FACTS[k]; if (!f || f.w !== w || f.h !== h || f.name !== name || (name && !f.nameDrawn)) throw new Error('the capture ' + k + ' is not ' + w + 'x' + h + ' name ' + name + ': ' + JSON.stringify(f)); };
pic('pic_noodle_feed', 1080, 1350, false); pic('pic_noodle_story_name', 1080, 1920, true);
for (const k of ['golden', 'beagle', 'pug']) pic('pic_' + k, 1080, 1350, true);
if (RN) {
  if (FACTS.lang !== 'zh-Hans' || FACTS.pic_noodle_feed.line !== '穿戴秋日围巾的腊肠犬') throw new Error('the captures are not zh-Hans: ' + FACTS.lang + ' ' + FACTS.pic_noodle_feed.line);
  if (FACTS.more.shareLabel !== '分享' || !/^更多/.test(FACTS.more.moreLabel)) throw new Error('the More tray capture: ' + JSON.stringify(FACTS.more));
  if (FACTS.sheetFrom !== 'menu' || !/分享我的狗狗/.test(FACTS.sh_sheet) || !/显示名字/.test(FACTS.sh_sheet) || !/图片只在你的设备上生成/.test(FACTS.sh_sheet) || /帖子|快拍/.test(FACTS.sh_sheet) || !FACTS.rnCover) throw new Error('the sheet capture: ' + FACTS.sh_sheet);
  if (!/分享这一刻/.test(FACTS.bond_card) || !/亲密度等级/.test(FACTS.bond_card)) throw new Error('the Bond card capture: ' + FACTS.bond_card);
} else {
  if (FACTS.pic_noodle_feed.line !== 'Dachshund wearing Autumn Scarf') throw new Error('Noodle\'s crayon line: ' + FACTS.pic_noodle_feed.line);
  if (FACTS.more.shareLabel !== 'Share' || !/^More/.test(FACTS.more.moreLabel)) throw new Error('the More tray capture: ' + JSON.stringify(FACTS.more));
  if (FACTS.sheetFrom !== 'menu' || !/Share my dog/.test(FACTS.sh_sheet) || !/Show name/.test(FACTS.sh_sheet) || !/made on your device/.test(FACTS.sh_sheet)) throw new Error('the sheet capture: ' + FACTS.sh_sheet);
  if (!/Share this moment/.test(FACTS.bond_card) || !/Bond level/.test(FACTS.bond_card)) throw new Error('the Bond card capture: ' + FACTS.bond_card);
}

// ---- the game's art (main), with the poses gliding between the game's drawings (as gift_reel/build_gift.js) ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'world', f), 'utf8'), ctx);
let src = fs.readFileSync(path.join(ART_ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
for (const [a, b] of [['if(L.danceFx){', 'if(false){'], ["const shadow=(s.wet&&pose!=='jump'?wetPuddle(shx,shw):'')+`", "const shadow=''&&`"],
  ['const f=frame(key,s,pose,o.outfit,k,seed,ex)', 'const f=frame(key,s,pose,o.outfit,(o.kf!=null?o.kf:k),seed,ex)'], ['kit(rng(seed+k*7717))', 'kit(rng(seed))'],
  ['+k*31)', ')'], ['seed*5+k*977+11', 'seed*5+11'], ['seed*3+k*131+7', 'seed*3+7']]) { if (!src.includes(a)) throw new Error('art changed: ' + a); src = src.replace(a, b); }
src = src.replace(/\]\[k\]/g, '].LK(k)').replace(/\]\[L\.k\|\|0\]/g, '].LK(L.k||0)').replace(/\]\[L\.k\]/g, '].LK(L.k)');
vm.runInContext(`Array.prototype.LK=function(k){ if(Number.isInteger(k)) return this[k];
  const n=this.length, i=((Math.floor(k)%n)+n)%n, j=(i+1)%n, x=k-Math.floor(k), f=x*x*(3-2*x);
  const mix=(a,b)=>typeof a==='number'&&typeof b==='number' ? a+(b-a)*f : Array.isArray(a)&&Array.isArray(b) ? a.map((v,q)=>mix(v,b[q])) : (f<.5?a:b);
  return mix(this[i],this[j]); };`, ctx);
vm.runInContext(src, ctx);
const PA = win.PawArt, inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '');
const NECK = { neck: 'Autumn Scarf' };
const LOOK = { beg: { pose: 'beg', facing: 'right' }, sit: { pose: 'sit', facing: 'right' }, yay: { pose: 'beg', facing: 'right', expr: 'hearts' },
  happy: { pose: 'happy', facing: 'right' }, paw: { pose: 'paw', facing: 'right' } };
const dogSvg = (id, kf) => inner(PA.dog('dachs', Object.assign({ anim: false, outfit: NECK }, LOOK[id], { kf: ((kf % 3) + 3) % 3 })));
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');
if (PA.dog('dachs', { anim: false, pose: 'sit', outfit: NECK }) === PA.dog('dachs', { anim: false, pose: 'sit' })) throw new Error('the scarf is not drawn');
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the game's pictures: shareDog's PNGs (shown whole) and the screens (cropped inside their frames), as JPEGs at about 2x their size on screen ----
// crop: [x, y, w, h] in the capture's px (sheets at 3x): the More tray with the phone bar, the Bond card down to its "Share this moment", the sheet
// cover: Noodle's Post picture with Show name on, big. RedNote: every share picture is cropped just above its "Doodle Doggo · doodledoggo.app" chip
// (58_share.js SH_LAY: the chip's middle at y 1290 of 1350 and 1730 of 1920, 58 px tall, so its top is at 1261 / 1701; the crops end at 1254 / 1694)
const FEEDC = RN ? [0, 0, 1080, 1254] : null, STORYC = RN ? [0, 0, 1080, 1694] : null;
const IMG = { noodle_feed: { f: 'pic_noodle_feed.png', w: 760, crop: FEEDC }, noodle_story: { f: 'pic_noodle_story_name.png', w: 640, crop: STORYC },
  golden: { f: 'pic_golden.png', w: 560, crop: FEEDC }, beagle: { f: 'pic_beagle.png', w: 560, crop: FEEDC }, pug: { f: 'pic_pug.png', w: 560, crop: FEEDC },
  cover: { f: 'pic_noodle_feed_name.png', w: 900, crop: FEEDC },
  tray: { f: 'more_tray.png', crop: [0, 954, 1179, 1023], w: 1000 }, bond: { f: 'bond_card.png', crop: RN ? [70, 70, 2020, 965] : [70, 70, 2020, 905], w: 1300 },
  sheet: { f: 'sh_sheet.png', crop: RN ? [30, 30, 1120, 1570] : [30, 30, 1120, 1530], w: 900 } };
if (RN && JSON.stringify(SH_LAY_OF(SH)) !== JSON.stringify({ feed: 1290, story: 1730 })) throw new Error('the share picture chip moved: ' + JSON.stringify(SH_LAY_OF(SH)));
function SH_LAY_OF(src) { const f = /feed: \{[^}]*chip: (\d+)/.exec(src), s = /story: \{[^}]*chip: (\d+)/.exec(src); return { feed: f && +f[1], story: s && +s[1] }; }
const imgSyms = Object.entries(IMG).map(([k, v]) => {
  const o = path.join(WORK, 'img', k + '.jpg'), vf = (v.crop ? `crop=${v.crop[2]}:${v.crop[3]}:${v.crop[0]}:${v.crop[1]},` : '') + `scale=${v.w}:-2:flags=lanczos`;
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(CAPS, v.f), '-vf', vf, '-q:v', '2', o]);
  const b = fs.readFileSync(o); let i = 2, wh = null; while (i < b.length) { if (b[i] === 0xFF && (b[i + 1] === 0xC0 || b[i + 1] === 0xC2)) { wh = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; break; } i += 2 + b.readUInt16BE(i + 2); }
  v.ar = wh[1] / wh[0];
  return `<symbol id="img_${k}" viewBox="0 0 ${wh[0]} ${wh[1]}" preserveAspectRatio="none"><image href="data:image/jpeg;base64,${b.toString('base64')}" width="${wh[0]}" height="${wh[1]}"/></symbol>`; }).join('');

// ---- the backgrounds: the game's own places (capture_share.js), a 337.5-unit window of each at 3.2x ----
// KEEP: the scene's own props in scene units (x0 y0 x1 y1), read off a unit grid of the grabs: Noodle stays 28 px clear of them, feet on the floor.
// The fences, the far hills and village, the forest edge and the river are the backdrop.
const SCALE = 3.2;
const KEEP = {
  dogpark: { floor: 358, keep: { board: [10, 258, 185, 375], sign: [660, 248, 742, 302], gate: [733, 218, 866, 360], ball: [228, 482, 250, 502], ball2: [688, 540, 710, 562], sign2: [1012, 242, 1108, 302], tree: [1208, 158, 1366, 345] } },
  hilltop: { floor: 350, keep: { arch: [104, 218, 238, 362], post1: [290, 333, 310, 353], post2: [590, 333, 610, 353], post3: [1090, 333, 1110, 353], blanket: [632, 484, 888, 558], lighthouse: [1512, 195, 1545, 248] } },
  training: { floor: 350, keep: { house: [68, 222, 232, 340], lampL: [545, 213, 576, 343], flag: [1074, 195, 1148, 342], lampR: [1226, 213, 1256, 343], board: [1290, 178, 1490, 340] } },
  pool: { floor: 360, keep: { cabin: [58, 208, 242, 354], towels: [236, 298, 292, 332], pool: [314, 378, 1112, 548], plant: [1328, 264, 1382, 354], plant0: [530, 266, 590, 352] } },
  woods: { floor: 355, keep: { sun: [842, 66, 934, 154], acorns: [933, 398, 1007, 424], acorn1: [110, 472, 160, 498], acorn2: [228, 468, 278, 498], arch: [466, 122, 654, 358], hole: [916, 538, 1066, 576], gate: [1203, 218, 1337, 362] } },
  park: { floor: 350, keep: { tree0: [0, 174, 140, 347], gate: [133, 213, 267, 357], tree1: [574, 194, 706, 349], gazebo: [948, 152, 1208, 362] } },
};
// the windows: open ground under Noodle and open sky under the pictures (the build checks both against KEEP); Maple Woods twice, from two spots
const SC = { hook: { f: 'dogpark', x0: 240 }, how: { f: 'woods', x0: 20 }, sizes: { f: 'training', x0: 560 }, pals: { f: 'pool', x0: 1262 },
  moment: { f: 'park', x0: 290 }, device: { f: 'woods', x0: 935 }, ask: { f: 'hilltop', x0: 700 } };
// RedNote: the front moves 85 px right (no safe zone), so the scene windows move with it (not past the scene's left edge); the cover keeps its window
if (RN) for (const k of Object.keys(SC)) SC[k].x0 = Math.max(0, SC[k].x0 - 85 / SCALE);
// RedNote ask: the meadow a little further left, so the kite's tail string and heart (from scene x ~955) stay well right of the wider card (it ends at x 935)
if (RN) SC.ask.x0 = 640;
// the cover: the Training Ground's sand ring, right of the sizes beat (the birds off the left edge, clear of the logo and the headline; the flag off the right)
SC.cover = { f: 'training', x0: 740 };

// ---- the beats (each card carries the spoken words, so it works as the subtitles) ----
const BEATS = RN ? [
  { k: 'hook', kind: 'hook', bg: 'hook', lines: ['你的狗狗', '变成蜡笔画'], sub: '免费，两种尺寸' },
  { k: 'how', kind: 'how', bg: 'how', title: '分享我的狗狗', lines: ['手机：点“更多”，', '再点“分享”'], small: '电脑：顶部栏的分享按钮' },
  { k: 'sizes', kind: 'sizes', bg: 'sizes', title: '两种尺寸', lines: ['“显示名字”：你来决定'] },
  { k: 'pals', kind: 'pals', bg: 'pals', title: '每只狗狗都能画一张！' },
  { k: 'moment', kind: 'moment', bg: 'moment', title: '分享这一刻', lines: ['散步之后、亲密度升级时、', '故事场景之后'] },
  { k: 'device', kind: 'device', bg: 'device', title: '只在你的设备上生成', lines: ['游戏不会上传任何东西'] },
  { k: 'ask', kind: 'end', bg: 'ask', lines: ['画好了，', '就分享给朋友吧！'] },
] : [
  { k: 'hook', kind: 'hook', bg: 'hook', lines: ['Your dog as a', 'crayon drawing'], sub: 'Free. In two sizes.' },
  { k: 'how', kind: 'how', bg: 'how', title: 'Share my dog', lines: ['Phone: tap More,', 'then Share'], small: 'computer: Share in the top bar' },
  { k: 'sizes', kind: 'sizes', bg: 'sizes', title: 'Post or Story', lines: ['Show name: your choice'] },
  { k: 'pals', kind: 'pals', bg: 'pals', title: 'Every dog gets one!' },
  { k: 'moment', kind: 'moment', bg: 'moment', title: 'Share this moment', lines: ['after a walk, a new Bond level', 'or a story scene'] },
  { k: 'device', kind: 'device', bg: 'device', title: 'Made on your device', lines: ['the game uploads nothing'] },
  { k: 'ask', kind: 'end', bg: 'ask', lines: ['Share your doodle', 'and tag us!'], pill: '@doodledoggo.app' },
];
// the timeline (owner, 13 Nov 2026: fast): each card stays up for its spoken line + 0.4 s, then a 0.15 s pause before the next beat
const VOAT = []; let at = 0.1; const PAUSE = 0.15, B = {}, HOLD = {};
for (const b of BEATS) { HOLD[b.k] = VOD[b.k] + 0.4; B[b.k] = at; VOAT.push({ k: b.k, at }); b.at = at; b.hold = HOLD[b.k]; at += HOLD[b.k] + PAUSE; }
const LOOP = at - PAUSE + 0.2, T = LOOP + 2.5, NF = Math.round(T * FPS);
const PLAY = 'Play free!';
// the covers' words: one big headline and a small "free" (true: Share my dog costs nothing, no coins: 58_share.js)
const CV = RN ? { head: '你的狗狗变成蜡笔画', free: '免费' } : { head: 'Your dog, in crayon', free: 'free' };
// RedNote subtitles: Noodle's line in chunks of at most 14 characters, each as long as its share of the line; the game's button names in quotes
const SUBS_ZH = { hook: ['免费！', '把你的狗狗变成蜡笔画，', '有两种尺寸。'], how: ['手机上点更多，', '再点分享。', '电脑上，', '按钮在顶部栏。'],
  sizes: ['两种尺寸任你选。', '要不要显示名字，', '你来决定。'], pals: ['每只狗狗都能画一张，', '衣服也一起画上！'],
  moment: ['散步之后、', '亲密度升级时、', '故事场景之后，', '都可以分享这一刻。'], device: ['图片只在你的设备上生成。', '游戏不会上传任何东西。'],
  ask: ['画好了，', '就分享给朋友吧！', '对了，我叫面条。'] };
const QUOTE = { '手机上点更多': '手机上点“更多”', '再点分享': '再点“分享”', '要不要显示名字': '要不要“显示名字”', '都可以分享这一刻': '都可以“分享这一刻”' };
const SUBS = [];
if (RN) for (const v of VOAT) { const parts = SUBS_ZH[v.k]; if (parts.join('') !== VOJ.text[v.k]) throw new Error('subtitles differ from the voice: ' + v.k);
  const wt = parts.map((x) => x.replace(/[，。！？：、]/g, '').length + 1), sum = wt.reduce((a, c) => a + c, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum, sh = x.replace(/[，。、]$/, ''), s2 = QUOTE[sh] || sh;
    if ([...s2].length > 14) throw new Error('subtitle over 14 characters: ' + s2);
    SUBS.push({ a: t0, b: t0 + d + (i === parts.length - 1 ? 0.35 : 0), s: s2 }); t0 += d; }); }
// RedNote anti-ban (README RedNote rule) and the 18 Nov app rule: no link, domain, handle, QR, other platform or app, off-platform word, post/story wording
const RN_BAN = /https?:|www\.|\.app|\.com|@|instagram|youtube|tiktok|itch|微信|朋友圈|QQ|微博|抖音|小红书|WhatsApp|链接|网址|官网|二维码|扫码|下载|私信我|加我|主页链接|戳|发帖|发到|发布到|快拍|帖子|tag/i, RN_BAN2 = /INS|\bins\b/;
if (RN) { const all = JSON.stringify(BEATS) + JSON.stringify(SUBS) + JSON.stringify(VOJSON) + JSON.stringify(CV)
    + [FACTS.sh_sheet, FACTS.bond_card, FACTS.more.tiles.join(' '), ...['pic_noodle_feed', 'pic_noodle_story_name', 'pic_golden', 'pic_beagle', 'pic_pug'].map((k) => FACTS[k].line)].join(' ');
  for (const re of [RN_BAN, RN_BAN2]) if (re.test(all)) throw new Error('a RedNote word on the ban list: ' + re.exec(all)[0]); }
const allText = (RN ? SUBS.map((x) => x.s).join('') + '治愈系蜡笔狗狗游戏搜 Doodle Doggo App' : '') + BEATS.map((b) => [b.title || '', ...(b.lines || []), b.sub || '', b.small || '', b.pill || ''].join(' ')).join(' ') + ' ' + PLAY + ' ' + CV.head + CV.free + ' 0123456789';
// house words (README): no em dash, no "breed" as a verb, no "sell", no itch.io
if (/—|\bbreed(s|ing)?\b|\bsell|itch/i.test(allText + JSON.stringify(VOJSON))) throw new Error('a word the house rules ban: ' + allText);

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}.pa-dog *{animation:none!important}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${dogSyms}${imgSyms}__BGSYMS__</defs>
<g id="bg"></g><g id="fg"${RN ? ' transform="translate(85 0)"' : ''}><g id="art"></g><g id="ov"></g></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), RN=${RN}, F=RN?"'LXGW WenKai'":'Caveat', CX=455, PLAY=${JSON.stringify(PLAY)}, SUBS=${JSON.stringify(SUBS)}, CV=${JSON.stringify(CV)};
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const AR=${JSON.stringify(Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v.ar])))}, SC=${JSON.stringify(SC)}, KEEP=${JSON.stringify(KEEP)}, SCALE=${SCALE};
function bgLayers(i, lt){ const L=[], cur=BEATS[i].bg, prev=i>0?BEATS[i-1].bg:null, k=i===0?1:sm((lt+0.06)/0.4);
  if(prev&&prev!==cur&&k<1) L.push([prev,1]); L.push([cur,prev===cur?1:k]); return L; }
// the scene's own props of a background, as screen boxes
function keepBoxes(key){ const s=SC[key], K=KEEP[s.f]; return Object.entries(K.keep).map(([n,b])=>({n, l:(b[0]-s.x0)*SCALE, t:b[1]*SCALE, r:(b[2]-s.x0)*SCALE, b:b[3]*SCALE})).filter((b)=>b.r>-40&&b.l<1120); }
// something standing: feet on the floor and 28 px clear of every prop of the scene
function standOk(key, e){ const s=SC[key], K=KEEP[s.f], r=e.getBoundingClientRect(), fy=+e.getAttribute('data-feet');
  if(fy/SCALE<K.floor) return 'stands above the floor ('+(fy/SCALE).toFixed(0)+' < '+K.floor+')';
  for(const k of keepBoxes(key)){ const gx=Math.max(k.l-r.right, r.left-k.r), gy=Math.max(k.t-r.bottom, r.top-k.b); if(Math.max(gx,gy)<28) return 'too close to the scene\\'s '+k.n+' ('+Math.round(Math.max(gx,gy))+' px)'; }
  return ''; }
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+'_0'); $('art').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// Noodle (in the Autumn Scarf) standing on (cx, feet), at most hh tall and ww wide; flip: facing left
// he breathes and sways a little all the time (the game's sit and happy drawings have no keyframes): the sway runs at half the breath's rate,
// pi/8 out of step, so when one stops turning the other moves at 38% or more of its top speed and no two frames are alike (checkFrames)
let NT=0;
function noodle(pose, svg, cx, feet, hh, ww, dy, op, flip){ const b=box(pose), s=Math.min(hh/b[3], ww/b[2]), w=b[2]*s, h=b[3]*s;
  const br=1+0.02*Math.sin(NT*5.2), sw=1.8*Math.sin(NT*2.6+Math.PI/8), lean='translate('+f2(cx)+' '+f2(feet)+') rotate('+f2(sw)+') scale('+f2(2-br)+' '+br.toFixed(4)+') translate('+f2(-cx)+' '+f2(-feet)+')';
  return '<g data-apart="Noodle" data-feet="'+f2(feet)+'" opacity="'+f2(op)+'"><ellipse cx="'+f2(cx)+'" cy="'+(feet-3)+'" rx="'+f2(w*0.36)+'" ry="12" fill="#5B3D32" opacity=".18"/><g transform="'+lean+'"><g'+(flip?' transform="translate('+f2(2*cx)+' 0) scale(-1 1)"':'')+'><g transform="translate('+f2(cx-w/2)+' '+f2(feet-h+(dy||0))+') scale('+s.toFixed(4)+') translate('+f2(-b[0])+' '+f2(-b[1])+')">'+svg+'</g></g></g></g>'; }
// a game picture (shareDog's PNG, whole) or a screen (in a cream frame, pad px inside it), w wide at (x, y), popping in with u, tilted rot degrees
function pic(id, x, y, w, u, op, o){ if(u<=0) return ''; o=o||{}; const pad=o.pad||0, h=(w-2*pad)*AR[id]+2*pad, k=0.9+0.1*back(u*1.2), cx=x+w/2, cy=y+h/2;
  const fr=pad?'<rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" rx="26" fill="${CREAM}" stroke="#5B3D32" stroke-width="7"/>':'';
  const im='<use href="#img_'+id+'" x="'+f2(x+pad)+'" y="'+f2(y+pad)+'" width="'+f2(w-2*pad)+'" height="'+f2(h-2*pad)+'"/>';
  const edge=pad?'':'<rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" fill="none" stroke="#5B3D32" stroke-width="5"/>';
  return '<g data-apart="'+(o.tag||id)+'" data-safe opacity="'+f2(sm(u*2.5)*op)+'" transform="translate('+f2(cx)+' '+f2(cy+(1-sm(u))*24)+') rotate('+f2(o.rot||0)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')">'
    +'<rect x="'+f2(x+8)+'" y="'+f2(y+10)+'" width="'+f2(w)+'" height="'+f2(h)+'" rx="'+(pad?26:4)+'" fill="#5B3D32" opacity=".16"/>'+fr+im+edge+'</g>'; }
const picH=(id,w,pad)=>(w-2*(pad||0))*AR[id]+2*(pad||0);
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional title, lines, a small line, a red sub line; the text block centred in the card
function card(b, top, op, o){ o=o||{}; const W0=o.w||790, x0=o.x0!=null?o.x0:CX-W0/2, cx=x0+W0/2, L=[];
  if(b.title) L.push({s:b.title, size:fitS(b.title,80,W0-90), fill:'${RED}', pitch: 82});
  (b.lines||[]).forEach((s)=>L.push({s, size:fitS(s, b.kind==='hook'?112:b.title?62:92, W0-80), pitch: b.kind==='hook'?114:b.title?70:96}));
  if(b.small) L.push({s:b.small, size:fitS(b.small,48,W0-90), fill:'#8A7468', pitch: 56});
  if(b.sub) L.push({s:b.sub, size:fitS(b.sub,70,W0-90), fill:'${RED}', pitch: 80});
  const hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(b.kind==='hook'?110:92);
  const c=centred(L, cx, top+hh/2, F);
  return { h: hh, svg: '<g data-box data-apart="card" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="#5B3D32" stroke-width="7"/>'+c.svg+'</g>' }; }
function pillA(s, cx, cy, size, o, tag){ return pill(s, cx, cy, size, F, o).replace('<g data-box','<g data-box data-apart="'+(tag||'pill')+'"'); }
// RedNote: Noodle stands 30 px higher, so the subtitle fits between his feet and the meadow's picnic blanket; SUBY: the subtitle's middle per beat
// (lower where the scene has acorns or a ball under the default line)
const CARD_TOP=300, FEET=RN?1395:1425, SUBY={ hook:1720, how:1700, ask:1480 }, SUBY0=1560;
window.frame=function(t, D){
  let art_='', ov=''; NT=t;
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at;
  const u=i===0?1:cl((lt+0.06)/0.32);
  const cop=fade*(i===0?1:sm(u*3));
  $('bg').innerHTML=bgLayers(i, lt).filter((l)=>l[1]>0.001).map((l)=>'<use href="#bg_'+l[0]+'" opacity="'+f2(l[1])+'"/>').join('');
  if(fade>0){
    let below=CARD_TOP;
    if(b.lines||b.title){ const c=card(b, CARD_TOP, cop); ov+=c.svg; below=CARD_TOP+c.h; }
    if(b.pill){ const py=below+86; ov+=pillA(b.pill, CX, py, 62, { fill:'${RED}', color:'${PAPER}', padX:36, op: fade*sm((lt-0.4)/0.25) }); below=py+44; }
    const pu=(d)=>cl((lt-d)/0.4);
    if(b.kind==='hook'){
      // Noodle's own share picture (Post, Show name off) pops in on the left; Noodle begs on the right
      const y=below+44; art_+=pic('noodle_feed', 78, y, 320, i===0?cl((t-0.25)/0.4):pu(0.15), fade, { rot:-3, tag:'picture' });
      art_+=noodle('beg', D.n.beg, 650, FEET, FEET-y-20, 360, 0, fade, true);
    } else if(b.kind==='how'){
      // the phone's More tray, open: the Share tile and the More button under it; Noodle gives a paw towards it
      const w=420, y=below+40; art_+=pic('tray', CX-w/2, y, w, pu(0.3), fade, { pad:12, tag:'tray' });
      const top=y+picH('tray',w,12)+72; art_+=noodle('paw', D.n.paw, CX, FEET, FEET-top, 600, 0, fade, false);
    } else if(b.kind==='sizes'){
      // the two pictures shareDog makes of Noodle: Post (1080x1350, Show name off) and Story (1080x1920, Show name on)
      const y=below+40, w1=280, w2=262, g=100, x1=CX-(w1+w2+g)/2;
      art_+=pic('noodle_feed', x1, y+picH('noodle_story',w2)-picH('noodle_feed',w1), w1, pu(0.25), fade, { rot:-2, tag:'post' });
      art_+=pic('noodle_story', x1+w1+g, y, w2, pu(0.9), fade, { rot:2, tag:'story' });
      const top=y+picH('noodle_story',w2)+72; art_+=noodle('sit', D.n.sit, CX, FEET, FEET-top, 560, 0, fade, false);
    } else if(b.kind==='pals'){
      // three other dogs' pictures (Show name on), each in its own outfit; Noodle sits on the right, clear of the pool's plant pot
      const y=below+36, w=220, g=50; ['golden','beagle','pug'].forEach((k,j)=>{ art_+=pic(k, 66+j*(w+g), y, w, pu(0.15+j*0.25), fade, { rot:[-2.5,1.5,-1.5][j], tag:k }); });
      const top=y+picH('golden',w)+72; art_+=noodle('sit', D.n.sit, 640, FEET, FEET-top, 400, 0, fade, true);
    } else if(b.kind==='moment'){
      // the game's Bond level card with its "Share this moment" button
      const w=660, y=below+40; art_+=pic('bond', CX-w/2, y, w, pu(0.3), fade, { pad:12, tag:'bond' });
      const top=y+picH('bond',w,12)+72; art_+=noodle('sit', D.n.sit, CX, FEET, FEET-top, 620, 0, fade, false);
    } else if(b.kind==='device'){
      // the Share my dog sheet as a phone shows it: the preview, Post / Story, Show name, "The picture is made on your device."
      const y=below+40; art_+=pic('sheet', 60, y, 390, pu(0.25), fade, { pad:12, tag:'sheet' });
      art_+=noodle('beg', D.n.beg, 668, FEET, FEET-y-20, 290, 0, fade, true);
    } else if(b.kind==='end'){
      // Noodle alone, big, in the middle of the meadow (a picture here would sit on the far village)
      art_+=noodle('yay', D.n.yay, CX, FEET, FEET-below-60, 480, -Math.abs(Math.sin(t*7))*14, fade, true);
    }
  }
  // RedNote subtitles: Noodle's words in pills of at most 14 characters
  if(RN&&fade>0){ const su=SUBS.find((x)=>t>=x.a&&t<x.b); if(su){ const o=Math.min(sm((t-su.a)/0.08),sm((su.b-t)/0.08)); ov+=pill(su.s, CX, SUBY[b.k]||SUBY0, fitS(su.s,58,900), F, { fill:'${CREAM}', padX:30, op:fade*o }).replace('<g data-box','<g data-box data-apart="sub" data-clear'); } }
  // the end card (brand/kids/endcard.js) 70 px lower, with "Play free!" over the logo; RedNote: its own card (no link, no domain, no handles)
  let ec=''; if(end){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+(RN?endCardRN('tall',LOGO_INNER,{play:'搜 Doodle Doggo App'})+'</g>':'<g transform="translate(0 70)">'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'
    +centred([{s:PLAY,size:76,fill:'${RED}'}],CX,412,F).svg+'</g>'); }
  $('art').innerHTML=art_; $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  if(RN&&end){ const g=$('ec').querySelector('.endcard'), bb=g.getBBox(); g.setAttribute('transform','translate('+f2(540-(bb.x+bb.width/2))+' '+f2(960-(bb.y+bb.height/2))+')'); }
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  if(!RN){ const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; '); }
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  if(fade>0) for(const e of $('art').querySelectorAll('[data-feet]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const why=standOk(b.bg, e); if(why) return e.getAttribute('data-apart')+' '+why; }
  // the game's pictures float in open sky: 28 px clear of the scene's props as well
  if(fade>0) for(const e of $('art').querySelectorAll('[data-safe]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect();
    for(const k of keepBoxes(b.bg)){ const g=Math.max(k.l-r.right, r.left-k.r, k.t-r.bottom, r.top-k.b); if(g<28) return e.getAttribute('data-apart')+' on the scene\\'s '+k.n+' ('+Math.round(g)+' px)'; } }
  for(const e of $('st').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(); if(!r.width||+(e.getAttribute('opacity')||1)<=0.05) continue;
    if(!RN&&(r.right>854||r.left<56||r.top<266||r.bottom>1444)&&!e.closest('#ec')) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round);
    if(RN&&(r.left<50||r.right>1030||r.top<40||r.bottom>1880)) return 'in the margin: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  // RedNote subtitles keep clear of the scene's props too
  for(const e of $('ov').querySelectorAll('[data-clear]')){ const r=e.getBoundingClientRect(); for(const k of keepBoxes(b.bg)){ const g=Math.max(k.l-r.right, r.left-k.r, k.t-r.bottom, r.top-k.b); if(g<28) return 'subtitle on the scene\\'s '+k.n+' ('+Math.round(g)+' px)'; } }
  if(RN&&end){ const r=$('ec').querySelector('.endcard').getBoundingClientRect(); if(Math.abs((r.left+r.right)/2-540)>1.5||Math.abs((r.top+r.bottom)/2-960)>1.5) return 'the RedNote end card is not centred at (540, 960)'; }
  if(!RN&&end){ const lg=$('ec').querySelector('.endcard svg').getBoundingClientRect(), tx=[...$('ec').querySelectorAll(':scope>g>text')].find((e)=>e.textContent===PLAY);
    const r=tx.getBoundingClientRect(); if(lg.top-r.bottom<20) return 'end card: "'+PLAY+'" too close to the logo ('+Math.round(lg.top-r.bottom)+' px)'; }
  return ''; };
// the cover (EN 1080 x 1920; RedNote: the same design, cut to 3:4 at y 240..1680): one big headline with a small "free", Noodle's real share picture
// big (Post, Show name on), Noodle begging at it on the open sand of the Training Ground, the logo on its own card. Everything inside y 250..1670 and x 40..1040.
window.cover=function(D){
  NT=0.9; $('bg').innerHTML='<use href="#bg_cover"/>'; $('fg').removeAttribute('transform'); $('art').innerHTML=''; $('ec').innerHTML='';
  let s='', a='';
  const lw=330, lh=lw*280/900; s+='<g data-apart="logo"><rect x="'+(540-lw/2-30)+'" y="252" width="'+(lw+60)+'" height="'+f2(lh+16)+'" rx="30" fill="${CREAM}" stroke="#5B3D32" stroke-width="6"/><svg x="'+(540-lw/2)+'" y="260" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  const hs=fitS(CV.head, RN?118:140, 900);
  s+='<g data-box data-apart="title"><rect x="50" y="400" width="980" height="256" rx="40" fill="${CREAM}" stroke="#5B3D32" stroke-width="8"/>'+centred([{s:CV.head,size:hs,fill:'${RED}'}],540,528,F).svg+'</g>';
  s+=pillA(CV.free, 540, 728, RN?58:62, { fill:'#FFE3A1', padX:44 }, 'free');
  a+=pic('cover', 72, 814, 480, 1, 1, { rot:-3, tag:'picture' });
  a+=noodle('beg', D.n.beg, 800, 1640, 1640-800, 360, 0, 1, true);
  $('ov').innerHTML=s; $('art').innerHTML=a;
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'cover too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  for(const e of $('art').querySelectorAll('[data-feet]')){ const why=standOk('cover', e); if(why) return 'cover: '+e.getAttribute('data-apart')+' '+why; }
  for(const e of $('art').querySelectorAll('[data-safe]')){ const r=e.getBoundingClientRect(); for(const k of keepBoxes('cover')){ const g=Math.max(k.l-r.right, r.left-k.r, k.t-r.bottom, r.top-k.b); if(g<28) return 'cover: the picture on the scene\\'s '+k.n; } }
  for(const e of $('st').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(); if(r.top<250||r.bottom>1670||r.left<40||r.right>1040) return 'cover: outside the 3:4 crop: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; };
</script>`;

const drawFor = (t) => ({ n: Object.fromEntries(Object.keys(LOOK).map((k) => [k, dogSvg(k, t * 1.8)])) });
(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  // the game's scenes: a 337.5 x 600 window of each grab at 3.2x, rendered once as a JPEG
  let bgSyms = '';
  for (const [k, sc] of Object.entries(SC)) {
    const f = path.join(WORK, `bg_${k}.jpg`); let svg = fs.readFileSync(path.join(CAPS, sc.f + '.svg'), 'utf8');
    if (!/class="world/.test(svg)) throw new Error('no scene grab for ' + sc.f);
    if (sc.x0 < 0 || sc.x0 + W / SCALE > +FACTS['scene_' + sc.f].vb.split(' ')[2] + 0.01) throw new Error('the window runs off the scene: ' + k);
    svg = svg.replace(/^<svg[^>]*>/, (m) => m.replace(/viewBox="[^"]*"/, `viewBox="${sc.x0} 0 ${W / SCALE} ${H / SCALE}"`).replace(/ (width|height|style|preserveAspectRatio)="[^"]*"/g, '').replace('<svg', `<svg width="${W}" height="${H}"`));
    await p.setContent(`<html><body style="margin:0"><style>[class$="-hl"]{display:none}</style>${svg}</body></html>`);
    await p.evaluate(() => document.querySelectorAll('.gr-game').forEach((e) => e.remove())); await p.waitForTimeout(200);
    await p.screenshot({ path: f, type: 'jpeg', quality: 92 });
    bgSyms += `<image id="bg_${k}" width="${W}" height="${H}" href="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}"/>`;
  }
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html.replace('__BGSYMS__', bgSyms));
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  if (RN) { await p.evaluate((txt) => document.fonts.load('700 40px "LXGW WenKai"', txt), allText);
    if (!(await p.evaluate((txt) => document.fonts.check('700 40px "LXGW WenKai"', txt), allText))) throw new Error('LXGW WenKai did not load'); }
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; beats at', VOAT.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + HOLD[v.k].toFixed(2) + ')').join(', '));
  const render = async (t, file) => { const err = await p.evaluate(([t, D]) => window.frame(t, D), [t, drawFor(t)]); if (err) { if (process.env.LOOSE) console.log('CHECK', t.toFixed(2), err.slice(0, 300)); else throw new Error(err + ' at ' + t.toFixed(2)); } await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'cover') {
    const err = await p.evaluate((D) => window.cover(D), drawFor(0.9)); if (err) throw new Error(err);
    const f = RN ? path.join(ROOT, 'brand', 'rednote', 'rednote-20-share-my-dog.jpg') : path.join(OUT, 'share-cover.jpg');
    await p.screenshot({ path: f, type: 'jpeg', quality: 92, ...(RN ? { clip: { x: 0, y: 240, width: W, height: 1440 } } : {}) }); console.log('wrote', f); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ...BEATS.flatMap((x) => [x.at + 0.9, x.at + x.hold * 0.85]).slice(1), LOOP + 0.15, LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  // CHECK=1: run every frame's checks without a screenshot (fast), then stop
  if (process.env.CHECK) { for (let fi = 0; fi < NF; fi++) { const err = await p.evaluate(([t, D]) => window.frame(t, D), [fi / FPS + 1e-4, drawFor(fi / FPS)]); if (err) throw new Error(err + ' at ' + (fi / FPS).toFixed(2)); }
    console.log('all', NF, 'frames pass the checks'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  // +1e-4: fi/FPS can land a hair under a beat start (the gift Reel's doubled frame); every frame's checks run in render()
  for (const fi of fr) { await render(fi / FPS + 1e-4, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's park music, ticks on the cuts, Noodle on top (kept from the last full render when FRAMES is set) ----
  const mixWav = path.join(WORK, 'mix.wav');
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
    const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
      segments: [{ at: 0, ctx: { place: 'park', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: 0.05, name: 'discover' }]]);
    fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
    const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
    ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
    const EV = [['tick', 0.5]];
    for (const k of ['how', 'sizes', 'pals', 'moment', 'device', 'ask']) EV.push(['tick', B[k] + 0.08]);
    EV.push(['tick', B.sizes + 1.05], ['tick', B.pals + 0.4], ['tick', B.pals + 0.65], ['tick', B.pals + 0.9], ['tick', LOOP + 0.15]);
    const fx = path.join(WORK, 'fx.wav');
    ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
      + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
    const voWav = path.join(WORK, 'voice.wav');
    ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
      + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
    const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, 'premix.wav');
    ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-9dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
    ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-share-my-dog-rednote.mp4' : 'doodle-doggo-share-my-dog.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
