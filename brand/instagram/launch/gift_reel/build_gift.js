// The 18 Nov 2026 launch Reel: the v2.26-v2.29 update and the follower gift codes (shot table, facts and rebuild: docs/marketing/GIFT_REEL.md;
// captions: docs/marketing/captions/GIFT_CODE_CAPTIONS.md). Noodle the dachshund (PawArt.dog 'dachs', the release branch's art) tells it, big in
// every beat, wearing the Follower Star Bandana (the code's gift). The backgrounds are the game's own scenes as the release build draws them
// (svg.world grabbed by capture_gift.js: the Home Yard by day, the Lighthouse Pier at night with the new lighthouse lit, the Town Square with the
// builds, the Cozy House living room; autumn), drawn at 3.2x so the scene's full height fills the frame. The game's own screens (captured clean):
// the visitor's card art, Mrs Plum's story letter, a run of frames of the Story mode prologue scene, the gift card, the "Have a code?" sheet with an
// EMPTY field (a neutral YOURCODE placeholder; no code anywhere in the video).
// Beats: hook (free gift, the code is in the caption), visitors, town projects, stories and stars, Story mode, the gift, how to redeem, one code per
// player until 17 Dec + the ask, then our standard end card (brand/kids/endcard.js) for 2.5 s.
// Every fact is checked against the release branch's game text (game/i18n/en.json, zh-Hans.json, game/src) and the captures; the build stops if
// one changed. Every frame: centreCheck(), safeCheck() (English), apartCheck() (../centre_text.js), standing things on the scene's floor and 28 px
// clear of the scene's own props (KEEP below), words and key art left of x 850 (English).
// 1080 x 1920, 30 fps. Voice: Noodle, Kokoro af_bella 1.1x (vo_gift.json via ../friends_reel/vo_friends.py). Music: the game's own yard music
// (mods/pawaudio.js) about 11 dB under the voice, the treasure sting on the gift.
//
//   cd <release checkout> && node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/gift_reel/capture_gift.js <release checkout> <caps dir>
//   VO_LINES=brand/instagram/launch/gift_reel/vo_gift.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   ART_ROOT=<release checkout> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/gift_reel/build_gift.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,...). ONLY=cover: gift-cover.jpg. FRAMES=a-b: re-render only frames a..b, then encode again.
//   CHECK=1: every frame's checks without screenshots.
// REDNOTE=1: the RedNote cut (as back_reel/build_back.js): every word in Simplified Chinese (the game's own zh-Hans words, checked below), the
// captures made with PAW_LANG=zh-Hans, Noodle in Mandarin (../friends_reel/vo_friends_zh.py with VO_LINES=gift_reel/vo_gift_zh.json, zf_073 1.0x),
// subtitles of at most 14 characters, LXGW WenKai, no safe zone (everything in front of the scene moved 85 px right, to the middle), the RedNote
// end card (the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App"; no QR, link, domain, handles or other platform names) centred at (540, 960).
// Output doodle-doggo-gift-code-rednote.mp4; ONLY=cover writes brand/rednote/rednote-19-gift-code.jpg (3:4).
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles, RN_FONT_CSS } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'gift_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C', GOLD = '#F2C744';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const RN = !!process.env.REDNOTE, VOFILE = RN ? 'vo_gift_zh.json' : 'vo_gift.json';
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, VOFILE), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from ' + VOFILE + ': ' + k);

// ---- the facts, checked against the release branch (the game's own words and numbers) ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const ZH = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'zh-Hans.json'), 'utf8'));
const SRC = (f) => fs.readFileSync(path.join(ART_ROOT, 'game', 'src', f), 'utf8');
const must = (k, re) => { if (!re.test(EN[k] || '')) throw new Error('the game text changed: ' + k + ' no longer says ' + re); };
const mustZ = (k, w) => { if (!(ZH[k] || '').includes(w)) throw new Error('the zh-Hans game text changed: ' + k + ' no longer says ' + w); };
must('nw.v226.title', /^Visitors in the yard!$/); must('nw.v226.come', /While you are away, neighbourhood dogs come round to play in your yard/);
must('nw.v226.book', /Meet 20 visitors in the Visitors Book/); must('nw.v226.toys', /Four new yard toys, the Tug Post, Puddle Pool, Play Tunnel and Bubble Fountain/);
must('yv.line_toy', /^\{name\} came by and tried the \{toy\}!$/);
must('nw.v227.title', /^Town projects$/); must('nw.v227.four', /Four builds, one after another: a dog fountain, a bandstand, Sakura Avenue and a lighthouse/);
must('nw.v227.fun', /a light at night/); must('nw.v227.ribbon', /Gerald cuts the ribbon/);
must('nw.v228.title', /^Stories and stars$/); must('nw.v228.stories', /Four neighbours write to you with little stories/); must('nw.v228.stars', /Past Bond 10 your dog keeps earning Bond stars/);
must('nw.v229.title', /^Story mode$/); must('nw.v229.book', /Gerald has written a story for you and your dog: 8 chapters to play at your own pace/);
must('nw.v229.scenes', /little crayon scene/);
must('data.clothes.follower_star_bandana.n', /^Follower Star Bandana$/); must('data.hm_decor.paw_print_pennant.n', /^Paw-Print Pennant$/);
must('data.clothes.follower_star_bandana.perk', /Only from a code\.$/); must('data.hm_decor.paw_print_pennant.story', /Only from a code/);
must('pm.title', /^Have a code\?$/); must('settings.title', /^Settings$/); must('fw.more', /^More$/); must('pm.guest', /the free account/);
must('pm.got_h', /^A gift for you!$/); must('pm.coins_n', /^\{n\} coins$/);
if (!/'2026-11-18'/.test(SRC('49c_news.js').slice(SRC('49c_news.js').indexOf('const NEWS_V226'), SRC('49c_news.js').indexOf('const NEWS_V229') + 300))) throw new Error('the v2.26-v2.29 news date is not 2026-11-18');
if (!/'Paw-Print Pennant': \{[^}]*promo: true/.test(SRC('03_yard.js')) || !/n: 'Follower Star Bandana'[^}]*promo: true/.test(SRC('00_core.js'))) throw new Error('the gift items are not code-only (promo) any more');
if (!/PR_LIST|lighthouse/.test(SRC('55_projects.js'))) throw new Error('55_projects.js changed');
if (RN) { mustZ('nw.v226.title', '院子里来客人啦！'); mustZ('nw.v226.come', '你不在的时候，邻居家的狗狗会来你的院子玩'); mustZ('nw.v226.book', '在访客簿里认识20位访客');
  mustZ('nw.v227.title', '小镇项目'); mustZ('nw.v227.four', '四个工程'); mustZ('nw.v227.fun', '夜里的灯'); mustZ('nw.v228.title', '故事和星星'); mustZ('nw.v228.stories', '写信给你讲小故事');
  mustZ('nw.v228.stars', '亲密度10以后，狗狗还会继续获得亲密度之星'); mustZ('nw.v229.title', '故事模式'); mustZ('nw.v229.book', '杰拉德为你和你的狗狗写了一个故事：8个章节');
  mustZ('data.clothes.follower_star_bandana.n', '粉丝星星三角巾'); mustZ('data.hm_decor.paw_print_pennant.n', '爪印小旗'); mustZ('data.hm_decor.paw_print_pennant.story', '只能用兑换码得到');
  mustZ('pm.title', '有兑换码吗？'); mustZ('settings.title', '设置'); mustZ('fw.more', '更多'); mustZ('pm.guest', '免费账号'); mustZ('cloud.title', '云存档'); mustZ('yv.line_toy', '{name}来过，还玩了{toy}！'); }
// the captures (capture_gift.js): the visit, the gift card, the sheet with no code in it
const FACTS = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8'));
const capHas = (k, w) => { if (!(FACTS[k] || '').includes(w)) throw new Error('the capture ' + k + ' does not show ' + w + ': ' + FACTS[k]); };
if (FACTS.visitorTag !== 'Biscuit' || FACTS.visitors.q[FACTS.visitors.q.length - 1] !== 'biscuit:Tug Post') throw new Error('the captured visitor is not Biscuit with the Tug Post');
if (RN) { capHas('yv_card', 'Biscuit来过，还玩了拔河柱！'); capHas('pm_card', '粉丝星星三角巾'); capHas('pm_card', '爪印小旗'); capHas('pm_card', '100金币'); capHas('pm_sheet', '有兑换码吗？'); capHas('st_letter', '梅子太太'); }
else { capHas('yv_card', 'Biscuit came by and tried the Tug Post!'); capHas('pm_card', 'Follower Star Bandana'); capHas('pm_card', 'Paw-Print Pennant'); capHas('pm_card', '100 coins'); capHas('pm_sheet', 'Have a code?'); capHas('st_letter', 'Mrs. Plum'); }
if (/Code |兑换码[A-Z0-9]|REELSAMPLE/.test(FACTS.pm_card) || /REELSAMPLE/.test(FACTS.pm_sheet)) throw new Error('a code shows on a captured screen');
if (FACTS.seq_prologue.n < 60) throw new Error('the scene run is too short');

// ---- the game's art (the release branch), with the poses gliding between the game's drawings (as back_reel/build_back.js) ----
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
const vbOf = (s) => /viewBox="([^"]+)"/.exec(s)[1];
let uid = 0; const uniq = (s) => { const p = 'u' + (uid++) + '_'; return s.replace(/id="([^"]+)"/g, `id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`).replace(/href="#([^"]+)"/g, `href="#${p}$1"`); };
const sym = (s, id) => { if (!s || />\?<\/text>/.test(s)) throw new Error('no art for ' + id); return `<symbol id="${id}" viewBox="${vbOf(s)}" overflow="visible">${uniq(inner(s))}</symbol>`; };
const TOYS = ['Tug Post', 'Puddle Pool', 'Play Tunnel', 'Bubble Fountain'];
// the visitor as the game draws it in the yard (capture_gift.js visitor.svg: its breed and starter coat, pose happy), its own name only
const VIS = fs.readFileSync(path.join(CAPS, 'visitor.svg'), 'utf8').replace(/aria-label="[^"]*"/, '');
const SYMS = [sym(PA.icon('coin'), 'ic_coin'), sym(PA.FRIENDS.wrap(0), 'ic_gift'), sym(PA.prop('prpennant'), 'pennant'), sym(VIS, 'visitor'),
  ...TOYS.map((n, i) => sym(PA.item(n), 'toy' + i))].join('');
const png = (f) => { const b = fs.readFileSync(path.join(CAPS, f)); return { uri: 'data:image/png;base64,' + b.toString('base64'), w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const SHOTS = { letter: png('st_letter.png'), sheet: png('pm_sheet.png') };
const IMGS = Object.entries(SHOTS).map(([k, v]) => `<symbol id="img_${k}" viewBox="0 0 ${v.w} ${v.h}"><image href="${v.uri}" width="${v.w}" height="${v.h}"/></symbol>`).join('');
// the Story mode prologue, a run of frames (30 a second) of the game's own scene, shown as it plays
const SEQ = path.join(CAPS, 'seq_prologue'), SEQN = FACTS.seq_prologue.n, SEQ_AR = (() => { const b = fs.readFileSync(path.join(SEQ, 'f000.jpg')); let i = 2; while (i < b.length) { if (b[i] === 0xFF && (b[i + 1] === 0xC0 || b[i + 1] === 0xC2)) return b.readUInt16BE(i + 5) / b.readUInt16BE(i + 7); i += 2 + b.readUInt16BE(i + 2); } throw new Error('no jpeg size'); })();
const NECK = { neck: 'Follower Star Bandana' };
const LOOK = { beg: { pose: 'beg', facing: 'right' }, sit: { pose: 'sit', facing: 'right' }, yay: { pose: 'happy', facing: 'right', expr: 'hearts' },
  idle: { pose: 'idle', facing: 'right' }, paw: { pose: 'paw', facing: 'right' } };
const dogSvg = (id, kf) => inner(PA.dog('dachs', Object.assign({ anim: false, outfit: NECK }, LOOK[id], { kf: ((kf % 3) + 3) % 3 })));
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');
if (PA.dog('dachs', { anim: false, pose: 'sit', outfit: NECK }) === PA.dog('dachs', { anim: false, pose: 'sit' })) throw new Error('the bandana is not drawn');

// ---- the backgrounds: the game's own scenes (capture_gift.js), a 337.5-unit window of each at 3.2x, pre-rendered once per build ----
// KEEP: the scene's own props in scene units (x0 y0 x1 y1), read off a unit grid of the grabs: anything standing (Noodle, the visitor, the gift,
// the pennant) stays 28 px clear of them and on the floor (feet y >= floor). Walls, the fence and the railing are the backdrop.
const SCALE = 3.2;
const KEEP = {
  yard: { floor: 345, keep: { plot: [0, 425, 220, 600], house: [15, 100, 275, 345], bushL: [352, 386, 450, 416], bush: [538, 338, 588, 362], dig: [463, 413, 577, 456], tree: [878, 160, 1000, 342], planter: [903, 310, 970, 356], bushF: [846, 543, 960, 600] } },
  house: { floor: 350, keep: { shelf: [18, 40, 192, 350], plant: [236, 268, 310, 384], picture: [266, 90, 344, 204], window: [360, 58, 572, 228], sofa: [310, 243, 584, 358], lamp: [583, 128, 654, 374], card: [650, 78, 788, 178], kitchen: [866, 12, 1000, 352], bed: [626, 453, 860, 517], ball: [101, 536, 137, 574], slipper: [554, 420, 608, 449] } },
  square: { floor: 345, keep: { fountain: [8, 248, 207, 512], tree1: [0, 278, 78, 417], tree2: [113, 293, 188, 417], easel: [226, 248, 290, 347], lampL: [323, 278, 362, 404], tree3: [558, 228, 642, 412], board: [516, 378, 604, 472], lampR: [620, 278, 652, 404], bench: [698, 393, 817, 484], band: [836, 278, 920, 387], tub: [376, 518, 464, 564], planter: [910, 523, 977, 587] } },
  pier: { floor: 355, keep: { lamp: [586, 246, 670, 404], bench: [848, 318, 952, 402], lighthouse: [720, 148, 787, 272], old: [40, 0, 195, 360] } },
};
const SC = { hook: { f: 'yard', x0: 600 }, visit: { f: 'yard', x0: 610 }, pier: { f: 'pier', x0: 549 }, room: { f: 'house', x0: 600 }, square: { f: 'square', x0: 360 }, home: { f: 'yard', x0: 575 } };
// RedNote: the front moves 85 px right (no safe zone), so the scene windows move with it and everything keeps its place on the scene
if (RN) for (const k of Object.keys(SC)) SC[k].x0 -= 85 / SCALE;
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the beats (each card carries the spoken words, so it works as the subtitles) ----
const T_ = RN ? {
  line: 'Biscuit来过，还玩了拔河柱！', ct: ['送你一份礼物'], cpill: '兑换码就在文案里',
} : { line: 'Biscuit came by and tried the Tug Post!', ct: ['FREE GIFT'], cpill: 'the code is in the caption' };
const BEATS = RN ? [
  { k: 'hook', kind: 'hook', bg: 'hook', lines: ['送你一份', '免费礼物！'], sub: '兑换码就在文案里' },
  { k: 'visit', kind: 'visit', bg: 'visit', title: '院子里来客人啦！', lines: ['你不在的时候，', '邻居家的狗狗来玩'], small: '访客簿里能认识20位访客' },
  { k: 'proj', kind: 'proj', bg: 'pier', title: '小镇项目', lines: ['四个工程，', '夜里灯塔', '会亮起来！'] },
  { k: 'stories', kind: 'stories', bg: 'room', title: '故事和星星', lines: ['邻居们写信', '讲小故事'], small: '亲密度10以后还有亲密度之星' },
  { k: 'story', kind: 'story', bg: 'square', title: '故事模式', lines: ['杰拉德的故事书，一共8章'] },
  { k: 'gift', kind: 'gift', bg: 'hook', title: '你的免费礼物', lines: ['粉丝星星三角巾', '爪印小旗', '还有100金币'], small: '只能用兑换码得到，从不出售' },
  { k: 'redeem', kind: 'redeem', bg: 'room', title: '怎么用', lines: ['设置 > 有兑换码吗？', '（手机：更多）'], small: '需要免费的云存档账号' },
  { k: 'ask', kind: 'end', bg: 'home', lines: ['每位玩家只能用一个，', '12月17日截止'], pill: '去文案里领兑换码吧' },
] : [
  { k: 'hook', kind: 'hook', bg: 'hook', lines: ['Free gift', 'for you today!'], sub: 'The code is in the caption.' },
  { k: 'visit', kind: 'visit', bg: 'visit', title: 'Visitors in the yard!', lines: ['Neighbourhood dogs visit', 'while you\'re away'], small: 'meet 20 in the Visitors Book' },
  { k: 'proj', kind: 'proj', bg: 'pier', title: 'Town projects', lines: ['4 builds.', 'The lighthouse', 'shines at night!'] },
  { k: 'stories', kind: 'stories', bg: 'room', title: 'Stories and stars', lines: ['Neighbours send you', 'little stories'], small: 'plus Bond stars past Bond 10' },
  { k: 'story', kind: 'story', bg: 'square', title: 'Story mode', lines: ['Gerald\'s storybook, 8 chapters'] },
  { k: 'gift', kind: 'gift', bg: 'hook', title: 'Your free gift', lines: ['Follower Star Bandana', 'Paw-Print Pennant', '+ 100 coins'], small: 'code-only, never sold' },
  { k: 'redeem', kind: 'redeem', bg: 'room', title: 'How to use it', lines: ['Settings > Have a code?', '(phone: More)'], small: 'needs the free cloud save' },
  { k: 'ask', kind: 'end', bg: 'home', lines: ['One code per player,', 'until 17 Dec'], pill: 'grab your code in the caption' },
];
// the timeline (owner, 13 Nov 2026: fast): each card stays up for its spoken line + 0.4 s, then a 0.15 s pause before the next beat
const VOAT = []; let at = 0.1; const PAUSE = 0.15, B = {}, HOLD = {};
for (const b of BEATS) { HOLD[b.k] = VOD[b.k] + 0.4; B[b.k] = at; VOAT.push({ k: b.k, at }); b.at = at; b.hold = HOLD[b.k]; at += HOLD[b.k] + PAUSE; }
const LOOP = at - PAUSE + 0.2, T = LOOP + 2.5, NF = Math.round(T * FPS);
// RedNote subtitles: Noodle's line in chunks of at most 14 characters, each as long as its share of the line
const SUBS_ZH = { hook: ['今天送你一份免费礼物！', '兑换码就在文案里。'], visit: ['大更新！', '你不在的时候，', '邻居家的狗狗会来院子里玩。'],
  proj: ['四个小镇项目等你来建。', '夜里灯塔会亮起来！'], stories: ['邻居们会写信讲小故事。', '亲密度10以后，', '还有亲密度之星！'], story: ['还有杰拉德的故事书，', '一共八章！'],
  gift: ['你的礼物：', '粉丝星星三角巾、', '爪印小旗，', '还有一百金币！'], redeem: ['打开设置，', '点有兑换码吗。', '需要免费的云存档账号。'],
  ask: ['每位玩家只能用一个兑换码，', '十二月十七日截止。', '快去文案里领吧！'] };
const SUBS = [];
if (RN) for (const v of VOAT) { const parts = SUBS_ZH[v.k]; if (parts.join('') !== VOJ.text[v.k]) throw new Error('subtitles differ from the voice: ' + v.k);
  parts.forEach((x) => { if ([...x].length > 14) throw new Error('subtitle over 14 characters: ' + x); });
  const wt = parts.map((x) => x.replace(/[，。！？：、]/g, '').length + 1), sum = wt.reduce((a, c) => a + c, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d + (i === parts.length - 1 ? 0.35 : 0), s: x.replace(/[，。、]$/, '').replace(/^点有兑换码吗$/, '点“有兑换码吗”') }); t0 += d; }); }
// RedNote anti-ban: no link, domain, handle, other platform or off-platform word anywhere in the cut's own words
const RN_BAN = /https?:|www\.|\.app|\.com|@|instagram|youtube|tiktok|微信|朋友圈|QQ|微博|抖音|WhatsApp|链接|网址|官网|二维码|扫码|下载|私信我|加我|主页链接|戳|itch/i;
if (RN) { const all = JSON.stringify(BEATS) + JSON.stringify(SUBS_ZH) + JSON.stringify(T_); if (RN_BAN.test(all)) throw new Error('a RedNote word on the ban list: ' + RN_BAN.exec(all)[0]); }
const allText = (RN ? Object.values(SUBS_ZH).flat().join('') + '点“有兑换码吗”治愈系蜡笔狗狗游戏搜 Doodle Doggo App' : '') + Object.values(T_).flat().join(' ') + ' '
  + BEATS.map((b) => [b.title || '', ...(b.lines || []), b.sub || '', b.small || '', b.pill || '', b.pillTop || '']).flat().join(' ') + ' 0123456789';

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}.pa-dog *{animation:none!important}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${SYMS}${dogSyms}${IMGS}__BGSYMS__<clipPath id="clipR"><rect id="clipRect" rx="26"/></clipPath></defs>
<g id="bg"></g><g id="keep"></g>
<g id="fg"${RN ? ' transform="translate(85 0)"' : ''}><g id="art"></g><g id="clipG" opacity="0"><g data-apart="scene" id="clipBox"><rect id="clipBack" fill="${CREAM}" stroke="${PEN}" stroke-width="7" rx="30"/><image id="clipImg" clip-path="url(#clipR)" preserveAspectRatio="none"/></g></g><g id="ov"></g></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), RN=${RN}, F=RN?"'LXGW WenKai'":'Caveat', CX=455, SUBS=${JSON.stringify(SUBS)}, T_=${JSON.stringify(T_)};
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const AR=${JSON.stringify(Object.fromEntries(Object.entries(SHOTS).map(([k, v]) => [k, v.h / v.w])))}, SC=${JSON.stringify(SC)}, KEEP=${JSON.stringify(KEEP)}, SCALE=${SCALE}, SEQN=${SEQN}, SEQ_AR=${SEQ_AR}, SEQ_URL=${JSON.stringify('file://' + SEQ + '/')};
function bgLayers(i, lt){ const L=[], cur=BEATS[i].bg, prev=i>0?BEATS[i-1].bg:null, k=i===0?1:sm((lt+0.06)/0.4);
  if(prev&&prev!==cur&&k<1) L.push([prev,1]); L.push([cur,prev===cur?1:k]); return L; }
// the scene's own props of a background, as screen boxes
function keepBoxes(key){ const s=SC[key], K=KEEP[s.f], dx=0; return Object.entries(K.keep).map(([n,b])=>({n, l:(b[0]-s.x0)*SCALE+dx, t:b[1]*SCALE, r:(b[2]-s.x0)*SCALE+dx, b:b[3]*SCALE})).filter((b)=>b.r>-40&&b.l<1120); }
// something standing: feet on the floor and 28 px clear of every prop of the scene
function standOk(key, e){ const s=SC[key], K=KEEP[s.f], r=e.getBoundingClientRect(), fy=+e.getAttribute('data-feet'), dx=0;
  if(fy/SCALE<K.floor) return 'stands above the floor ('+(fy/SCALE).toFixed(0)+' < '+K.floor+')';
  for(const k of keepBoxes(key)){ const l=k.l+dx, rr=k.r+dx, gx=Math.max(l-r.right, r.left-rr), gy=Math.max(k.t-r.bottom, r.top-k.b); if(Math.max(gx,gy)<28) return 'too close to the scene\\'s '+k.n+' ('+Math.round(Math.max(gx,gy))+' px)'; }
  return ''; }
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
function chip(id, cx, cy, r, u, tag, op){ if(u<=0) return ''; const k=0.85+0.15*back(u*1.4), s=r*1.45;
  return '<g data-apart="'+(tag||id)+'" opacity="'+f2(sm(u*3)*(op==null?1:op))+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')"><circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+r+'" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><use href="#'+id+'" x="'+f2(cx-s/2)+'" y="'+f2(cy-s/2)+'" width="'+f2(s)+'" height="'+f2(s)+'"/></g>'; }
const BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+(id.endsWith('_0')||id==='visitor'||id==='pennant'||id==='ic_gift'?'':'_0')); $('art').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// Noodle (with the bandana) standing on (cx, feet), at most hh tall and ww wide; flip: facing left
function noodle(pose, svg, cx, feet, hh, ww, dy, op, flip){ const b=box(pose), s=Math.min(hh/b[3], ww/b[2]), w=b[2]*s, h=b[3]*s;
  return '<g data-apart="Noodle" data-feet="'+f2(feet)+'" opacity="'+f2(op)+'"><ellipse cx="'+f2(cx)+'" cy="'+(feet-3)+'" rx="'+f2(w*0.36)+'" ry="12" fill="${PEN}" opacity=".18"/><g'+(flip?' transform="translate('+f2(2*cx)+' 0) scale(-1 1)"':'')+'><g transform="translate('+f2(cx-w/2)+' '+f2(feet-h+(dy||0))+') scale('+s.toFixed(4)+') translate('+f2(-b[0])+' '+f2(-b[1])+')">'+svg+'</g></g></g>'; }
// a piece of the game's art standing on (cx, feet), hh tall (its drawn box), popping in
// VB: the drawn part of a symbol whose texture runs past its drawing (the pennant's crayon grain, masked, still counts in a bounding box): the
// distance checks use a box of the drawn part (hmPropCard(b,'prpennant',...,[6,6,94,152]) in world/pawart_world_b.js)
const VB={ pennant:{ vb:[0,0,100,160], d:[6,6,88,146] } };
function stand(id, tag, cx, feet, hh, u, op, flip){ if(u<=0) return ''; const v=VB[id], b=v?v.d:box(id), s=hh/b[3]*(0.85+0.15*back(u*1.3)), w=b[2]*s, h=b[3]*s;
  const at=v?'':' data-apart="'+tag+'" data-feet="'+f2(feet)+'"', mark=v?'<rect data-apart="'+tag+'" data-feet="'+f2(feet)+'" x="'+f2(cx-w/2)+'" y="'+f2(feet-h)+'" width="'+f2(w)+'" height="'+f2(h)+'" fill="none"/>':'';
  return '<g'+at+' opacity="'+f2(sm(u*3)*(op==null?1:op))+'"><ellipse cx="'+f2(cx)+'" cy="'+(feet-3)+'" rx="'+f2(w*0.34)+'" ry="10" fill="${PEN}" opacity=".16"/><g'+(flip?' transform="translate('+f2(2*cx)+' 0) scale(-1 1)"':'')+'><use href="#'+id+'"'+(v?' width="'+v.vb[2]+'" height="'+v.vb[3]+'"':'')+' transform="translate('+f2(cx-w/2)+' '+f2(feet-h)+') scale('+s.toFixed(4)+') translate('+f2(-b[0])+' '+f2(-b[1])+')"/></g>'+mark+'</g>'; }
function shot(id, ar, x, y, w, u, op){ const h=w*ar, k=0.94+0.06*back(u); const ww=w*k, hh=h*k;
  return '<g data-apart="'+id+'" opacity="'+f2(sm(u*2.5)*op)+'"><use href="#'+id+'" x="'+f2(x+(w-ww)/2)+'" y="'+f2(y+(h-hh)/2+(1-sm(u))*30)+'" width="'+f2(ww)+'" height="'+f2(hh)+'"/></g>'; }
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional title, lines, a small line, a red sub line; the text block centred in the card. o: { x0, w } for a narrower card
function card(b, top, op, o){ o=o||{}; const W0=o.w||790, x0=o.x0!=null?o.x0:CX-W0/2, cx=x0+W0/2, L=[];
  if(b.title) L.push({s:b.title, size:fitS(b.title,80,W0-90), fill:'${RED}', pitch: 82});
  (b.lines||[]).forEach((s)=>L.push({s, size:fitS(s, b.kind==='hook'?118:b.title?66:84, W0-80), pitch: b.kind==='hook'?120:b.title?72:90}));
  if(b.small) L.push({s:b.small, size:fitS(b.small,50,W0-90), fill:'#8A7468', pitch: 58});
  if(b.sub) L.push({s:b.sub, size:fitS(b.sub,66,W0-90), fill:'${RED}', pitch: 76});
  const hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(b.kind==='hook'?120:96);
  const c=centred(L, cx, top+hh/2, F);
  return { h: hh, svg: '<g data-box data-apart="card" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+c.svg+'</g>' }; }
function pillA(s, cx, cy, size, o, tag){ return pill(s, cx, cy, size, F, o).replace('<g data-box','<g data-box data-apart="'+(tag||'pill')+'"'); }
const CARD_TOP=300, FEET=1425;
let clipOn=false;
window.frame=async function(t, D){
  let art_='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at;
  const u=i===0?1:cl((lt+0.06)/0.32);
  const cop=fade*(i===0?1:sm(u*3));
  $('bg').innerHTML=bgLayers(i, lt).filter((l)=>l[1]>0.001).map((l)=>'<use href="#bg_'+l[0]+'" opacity="'+f2(l[1])+'"/>').join('');
  let clip=null;
  if(fade>0){
    let below=CARD_TOP;
    if(b.pillTop) { ov+=pillA(b.pillTop, CX, 350, 64, { fill:'#FFE3A1', padX:40, op: cop }, 'pilltop'); below=395; }
    if(b.lines&&b.kind!=='proj'){ const c=card(b, CARD_TOP, cop); ov+=c.svg; below=CARD_TOP+c.h; }
    if(b.pill){ const py=below+78; ov+=pillA(b.pill, CX, py, 58, { fill:'${RED}', color:'${PAPER}', padX:34, op: fade*sm((lt-0.5)/0.25) }); below=py+40; }
    if(b.kind==='hook'){
      art_+=stand('ic_gift', 'gift', 195, FEET, 205, 1, fade);
      art_+=noodle('beg', D.n.beg, 640, FEET, FEET-below-70, 410, 0, fade, true);
    } else if(b.kind==='visit'){
      // the game's own line for the visit, Noodle and Biscuit on the grass, well apart
      const ly=below+78; ov+=pillA(T_.line, CX, ly, fitS(T_.line,50,740), { fill:'#FFE3A1', padX:30, op: fade*sm((lt-0.3)/0.25) }, 'line');
      const top=ly+40+60;
      art_+=noodle('sit', D.n.sit, 255, FEET, FEET-top, 340, 0, fade, false);
      art_+=stand('visitor', 'Biscuit', 652, FEET, Math.min(FEET-top, 350), cl((lt-0.15)/0.4), fade);
    } else if(b.kind==='proj'){
      // a narrower card on the left, so the game's new lighthouse shines on the right, out at sea
      const c=card(b, CARD_TOP, cop, { x0:60, w:450 }); ov+=c.svg;
      art_+=noodle('sit', D.n.sit, 640, FEET, 470, 400, 0, fade, false);
    } else if(b.kind==='stories'){
      const y=below+40, w=790; art_+=shot('img_letter', AR.letter, CX-w/2, y, w, cl((lt-0.3)/0.35), fade);
      const top=y+w*AR.letter+72; art_+=noodle('sit', D.n.sit, 510, FEET-20, FEET-20-top, 560, 0, fade, true);
    } else if(b.kind==='story'){
      const w=790, h=w*SEQ_AR, x=CX-w/2, y=below+40; clip={x,y,w,h,op:fade*sm(u*2.5),idx:Math.min(SEQN-1, Math.max(0, Math.floor(lt*30)+(RN?8:28)))};
      const top=y+h+50; art_+=noodle('sit', D.n.sit, 250, FEET, FEET-top, 380, 0, fade, false);
    } else if(b.kind==='gift'){
      // what the code gives, in the game's own names; the pennant (the game's prop) on the grass, a coin, Noodle in the bandana
      art_+=chip('ic_coin', 735, below+150, 62, cl((lt-1.6)/0.4), 'coin', fade);
      const top=below+60;
      art_+=stand('pennant', 'pennant', 168, FEET, Math.min(300, FEET-top), cl((lt-1.0)/0.4), fade);
      art_+=noodle('sit', D.n.sit, 566, FEET, FEET-top, 548, 0, fade, true);
    } else if(b.kind==='redeem'){
      const w=790, y=below+36; art_+=shot('img_sheet', AR.sheet, CX-w/2, y, w, cl((lt-0.5)/0.35), fade);
      const top=y+w*AR.sheet+72; art_+=noodle('paw', D.n.paw, 510, FEET-20, FEET-20-top, 600, 0, fade, true);
    } else if(b.kind==='end'){
      art_+=noodle('yay', D.n.yay, CX, FEET, FEET-below-80, 700, -Math.abs(Math.sin(t*7))*14, fade, false);
    }
  }
  if(RN&&fade>0){ const su=SUBS.find((x)=>t>=x.a&&t<x.b); if(su){ const o=Math.min(sm((t-su.a)/0.08),sm((su.b-t)/0.08)); ov+=pill(su.s, CX, b.bg==='room'?1735:b.bg==='square'?1590:1560, fitS(su.s,58,900), F, { fill:'${CREAM}', padX:30, op:fade*o }).replace('<g data-box','<g data-box data-apart="sub" data-clear'); } }
  let ec=''; if(end){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+(RN?endCardRN('tall',LOGO_INNER,{play:'搜 Doodle Doggo App'}):endCard('tall',HANDLES,LOGO_INNER))+'</g>'; }
  $('art').innerHTML=art_; $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  // the scene run: the game's prologue frames in a cream frame
  const cg=$('clipG');
  if(clip&&clip.op>0.001){ cg.setAttribute('opacity',f2(clip.op)); const B=$('clipBack'), I=$('clipImg'), R=$('clipRect'), p=14;
    B.setAttribute('x',f2(clip.x)); B.setAttribute('y',f2(clip.y)); B.setAttribute('width',f2(clip.w)); B.setAttribute('height',f2(clip.h));
    for(const e of [I,R]){ e.setAttribute('x',f2(clip.x+p)); e.setAttribute('y',f2(clip.y+p)); e.setAttribute('width',f2(clip.w-2*p)); e.setAttribute('height',f2(clip.h-2*p)); }
    const href=SEQ_URL+'f'+String(clip.idx).padStart(3,'0')+'.jpg'; if(I.getAttribute('href')!==href){ I.setAttribute('href',href); try{ await I.decode(); }catch(e){ return 'scene frame did not load: '+href; } } }
  else cg.setAttribute('opacity','0');
  if(RN&&end){ const g=$('ec').querySelector('.endcard'), bb=g.getBBox(); g.setAttribute('transform','translate('+f2(540-(bb.x+bb.width/2))+' '+f2(960-(bb.y+bb.height/2))+')'); }
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  if(!RN){ const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; '); }
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  // RedNote subtitles keep clear of the scene's props too (under the living room's bed: lower down)
  for(const e of $('ov').querySelectorAll('[data-clear]')){ const r=e.getBoundingClientRect(); for(const k of keepBoxes(b.bg)){ const g=Math.max(k.l-r.right, r.left-k.r, k.t-r.bottom, r.top-k.b); if(g<28) return 'subtitle on the scene\\'s '+k.n+' ('+Math.round(g)+' px)'; } }
  if(fade>0) for(const e of $('art').querySelectorAll('[data-feet]')){ if(+((e.tagName==='rect'?e.parentNode:e).getAttribute('opacity')||1)<=0.05) continue; const why=standOk(b.bg, e); if(why) return e.getAttribute('data-apart')+' '+why; }
  for(const e of $('st').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(); if(!r.width||+(e.getAttribute('opacity')||1)<=0.05||e.closest('#clipG[opacity="0"]')) continue;
    if(!RN&&(r.right>854||r.left<56||r.top<266||r.bottom>1444)&&!e.closest('#ec')) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round);
    if(RN&&(r.left<50||r.right>1030||r.top<40||r.bottom>1880)) return 'in the margin: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; };
// the cover: its own design, gift-led; key content inside the 1:1 crop (y 420..1500), the logo inside 4:5 (y 285..1635). RedNote: the 3:4 crop y 240..1680
window.cover=function(D){
  $('bg').innerHTML='<use href="#bg_hook"/>'; $('fg').removeAttribute('transform'); $('art').innerHTML=''; $('clipG').setAttribute('opacity','0');
  let s='';
  s+='<g data-box data-apart="title"><rect x="70" y="430" width="940" height="'+(RN?250:270)+'" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'
    +centred([{s:T_.ct[0],size:fitS(T_.ct[0],RN?150:190,860),fill:'${RED}'}],540,RN?555:565,F).svg+'</g>';
  s+=pillA(T_.cpill, 540, RN?770:790, 66, { fill:'#FFE3A1', padX:40 }, 'pill');
  // the gift: the wrapped present, the pennant and a coin chip on the left; Noodle big in the Follower Star Bandana
  s+=stand('ic_gift', 'gift', 215, 1462, 230, 1);
  s+=stand('pennant', 'pennant', 225, 1150, 250, 1);
  s+=chip('ic_coin', 395, 1000, 62, 1, 'coin');
  s+=noodle('beg', D.n.beg, 735, 1462, 570, 470, 0, 1, true);
  const lw=340, lh=lw*280/900; s+='<g data-apart="logo"><rect x="'+(540-lw/2-30)+'" y="1505" width="'+(lw+60)+'" height="'+f2(lh+14)+'" rx="30" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg x="'+(540-lw/2)+'" y="1512" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  $('ov').innerHTML=s;
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),24); if(near.length) return 'cover too close: '+near.join('; ');
  for(const e of $('ov').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(), logo=e.getAttribute('data-apart')==='logo';
    if(logo?(r.top<285||r.bottom>1635):(r.top<420||r.bottom>1500||r.left<0||r.right>1080)) return 'cover: outside the '+(logo?'4:5':'1:1')+' crop: '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
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
  const render = async (t, file) => { const err = await p.evaluate(([t, D]) => window.frame(t, D), [t, drawFor(t)]); if (err) throw new Error(err + ' at ' + t.toFixed(2)); await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'cover') {
    const err = await p.evaluate((D) => window.cover(D), drawFor(0.6)); if (err) throw new Error(err);
    const f = RN ? path.join(ROOT, 'brand', 'rednote', 'rednote-19-gift-code.jpg') : path.join(OUT, 'gift-cover.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92, ...(RN ? { clip: { x: 0, y: 240, width: W, height: 1440 } } : {}) }); console.log('wrote', f); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ...BEATS.flatMap((x) => [x.at + 0.9, x.at + x.hold * 0.85]).slice(1), LOOP + 0.15, LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  // CHECK=1: run every frame's checks without a screenshot (fast), then stop
  if (process.env.CHECK) { for (let fi = 0; fi < NF; fi++) { const err = await p.evaluate(([t, D]) => window.frame(t, D), [fi / FPS, drawFor(fi / FPS)]); if (err) throw new Error(err + ' at ' + (fi / FPS).toFixed(2)); }
    console.log('all', NF, 'frames pass the checks'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  for (const fi of fr) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's yard music, pops and ticks, Noodle on top ----
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: 0.05, name: 'discover' }, { at: B.gift + 0.25, name: 'treasure' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
  const EV = [];
  for (const k of ['visit', 'proj', 'stories', 'story', 'redeem', 'ask']) EV.push(['tick', B[k] + 0.08]);
  [0, 1, 2, 3].forEach((j) => EV.push(['tick', B.visit + 0.5 + j * 0.18]));
  EV.push(['tick', B.gift + 1.1], ['tick', B.redeem + 0.5], ['tick', LOOP + 0.15]);
  const fx = path.join(WORK, 'fx.wav');
  ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
    + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
  const voWav = path.join(WORK, 'voice.wav');
  ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
    + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
  const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
  const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
  const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
  const pre = path.join(WORK, 'premix.wav'), mixWav = path.join(WORK, 'mix.wav');
  ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
    `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-9dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
    '-map', '[a]', '-ar', '44100', pre]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-gift-code-rednote.mp4' : 'doodle-doggo-gift-code.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
