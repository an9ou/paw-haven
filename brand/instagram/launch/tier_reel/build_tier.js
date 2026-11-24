// The "9, 45 or 900 coins?" Winter Market price-tier Reel (owner's go-ahead 24 Nov 2026: "Good, render it"; script, shots, hook scores and facts:
// docs/marketing/TIER_REEL.md). English cut only, 1080 x 1920, 30 fps. The Winter Market is open in the game from 23 Nov to 31 Dec 2026.
// The picture is the game footage of capture_tier.js (three real places on 24 Nov 2026, captured on the frozen page clock: the frames already hold
// the scene and Noodle). This script lays the words over it, in one block under Noodle (y 1146..1440): a big crayon price tag on the left (the tier,
// one to three crayon coins, the price) that pops in with the game's coin chime, and a card on the right (the game's own drawing of the item, its
// name and the game's own words about it); the hook's tag runs 9, 45, 900 with the voice; then the ask and our standard end card for 2.5 s.
// Every name, price and line is checked against main below; the build stops if one changed. Every frame: centreCheck(), safeCheck(), apartCheck()
// (../centre_text.js); the tag, the card and Noodle inside x 60..850, y 270..1440 and 28 px apart; Noodle, his whole drawn box, and the block 28 px
// clear of every stall, stand, cart, board and prop of the place in the frame.
// Voice: Noodle, Kokoro af_bella 1.1x (vo_tier.json via ../friends_reel/vo_friends.py). Music: the game's own Winter Market music (mods/pawaudio.js,
// place fmarket with fest winter) about 11 dB under the voice, the game's coin chime (PawAudio stinger 'coin') on every price tag.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/capture_tier.js <main> <caps dir> <vo dir>
//   ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/build_tier.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,...). FRAMES=a-b: re-render only frames a..b, then encode again with the same sound.
//   CHECK=1: every frame's checks without screenshots. LOOSE=1 (stills only, for layout work): print a failed check and go on.
// REDNOTE=1 (the RedNote cut, owner's go-ahead 24 Nov 2026; as town_goal_reel and visitor_reel): every word in Simplified Chinese, the game's own zh-Hans
// words (checked below), the captures made with PAW_LANG=zh-Hans (CAPS), Noodle in Mandarin (../friends_reel/vo_friends_zh.py with VO_LINES=
// tier_reel/vo_tier_zh.json, zf_073 1.0x), subtitles of at most 14 characters, LXGW WenKai, no safe zone (the picture and the block 85 px right,
// centred on x 540, a 50 px margin), the RedNote end card (the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App") centred at (540, 960).
// Output doodle-doggo-winter-tiers-rednote.mp4. The build stops on any word of RN_BAN in the words, the voice or the captured game text.
// ONLY=cover (CAPS = a capture made with ONLY=cover): the cover, its own design: tier-cover.jpg (1080 x 1920); with REDNOTE=1
// brand/rednote/rednote-24-winter-tiers.jpg (its y 240..1680, 3:4).
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles, RN_FONT_CSS } = require('../../../kids/endcard.js');
const { checkFrames } = require('../frozen_clock.js');
const { plan, camsFor, ITEMS, RNX, COVER } = require('./capture_tier.js');
const RN = !!process.env.REDNOTE, COVERS = process.env.ONLY === 'cover', CAM = camsFor(RN), DX = RN ? RNX : 0;
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'tier_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOFILE = RN ? 'vo_tier_zh.json' : 'vo_tier.json', VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, VOFILE), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from ' + VOFILE + ': ' + k);
const P = plan(VOD, RN), { beats: PB, B, LOOP, T, NF, NCAP, HOOKPOP, HOOKQ } = P;

// ---- the facts, checked against main (the game's own words and numbers) ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const SRC = (f) => fs.readFileSync(path.join(ART_ROOT, 'game', 'src', f), 'utf8');
const need = (ok, what) => { if (!ok) throw new Error('the game changed: ' + what); };
const CORE = SRC('00_core.js'), YARD = SRC('03_yard.js'), MKT = SRC('49_market.js');
// the market's dates (CHANGELOG v2.31.10 and v2.31.11): 23 Nov to 31 Dec in 2026
need(/id: 'winter', theme: 'winter', name: 'Winter Market', win: \(y\) => \(y === 2026 \? \['11-23', '12-31'\] : \['12-01', '12-31'\]\)/.test(MKT), 'the Winter Market dates');
const CL = fs.readFileSync(path.join(ART_ROOT, 'CHANGELOG.md'), 'utf8');
need(/v2\.31\.10 Winter Market from 23 Nov \| Owner, 18 Nov: the Winter Market opens on 23 Nov 2026 00:00 JST/.test(CL) && /v2\.31\.11 Winter Market to 31 Dec \| Owner, 18 Nov: the Winter Market stays open until 31 Dec/.test(CL), 'CHANGELOG v2.31.10 / v2.31.11');
need(EN['fm.m_winter'] === 'Winter Market' && EN['fm.sign'] === '{market} · open until {date}', 'the market sign words');
// the three things: on the Winter Market's own table (in the right stall), the game's names, exact prices, and the lines the cards quote
const WIN = /id: 'winter'[\s\S]*?\} \},\n/.exec(MKT)[0];
const row = (src, n) => { const m = new RegExp("\\{ n: '" + n + "',[^\\n]*").exec(src); if (!m) throw new Error('no row for ' + n); return m[0]; };
const ROWS = { t1: row(CORE, 'Frozen Yoghurt Snowballs'), t2: row(CORE, 'Snowball Ball'), t3: row(CORE, 'Gingerbread Kennel') };
const KEYS = { t1: 'data.food.frozen_yoghurt_snowballs.n', t2: 'data.toys.snowball_ball.n', t3: 'data.houses.gingerbread_kennel.n' };
const STALL = { t1: 'treats', t2: 'toys', t3: 'homes' };
const QUOTE = { t1: 'Plain unsweetened yoghurt only, never a sweetened or light pot, which can hide xylitol. Dairy is a treat for dogs, so two or three little snowballs are plenty.',
  t2: 'a snowball that never melts', t3: 'A look, not a snack: it is wood all the way through.' };
for (const it of ITEMS) {
  need(new RegExp(STALL[it.k] + ": \\[[^\\]]*'" + it.n + "'").test(WIN), it.n + ' is not in the Winter Market\'s ' + STALL[it.k] + ' stall');
  need(EN[KEYS[it.k]] === it.n, 'the name ' + it.n);
  need(new RegExp('price: ' + it.price + '[,} ]').test(ROWS[it.k]) && /fest: 'winter', fm: true/.test(ROWS[it.k]), 'the price of ' + it.n + ' is not ' + it.price + ': ' + ROWS[it.k].slice(0, 160));
  need(ROWS[it.k].replace(/\\'/g, "'").includes(QUOTE[it.k]), 'the line of ' + it.n);
}
need(/snack: true/.test(ROWS.t1) && /tip: 'Plain unsweetened yoghurt only/.test(ROWS.t1), 'Frozen Yoghurt Snowballs is a snack with its dog-safe lesson');
need(/'Gingerbread Kennel', price: 900, bond: 3, comfort: 0\.25/.test(ROWS.t3), 'the Gingerbread Kennel row');
// the kennel in the yard: the game draws S.house in the yard, the dog house tap target is named after it
need(YARD.includes("<g id=\"houseG\" class=\"hot${isNight() ? ' night' : ''}\" tabindex=\"0\" role=\"button\" aria-label=\"${esc(tt('yard.label_dog_house', 'Dog house: {house}', { house: homeName(S.house) }))}\">${place(art('house', S.house), 620, 330, 240, 200)}</g>"), 'the yard draws S.house');
// the set (PawArt.WINTER_MARKET): the three are in it
{ const vm = require('vm'), win = {}, ctx = { window: win, console }; vm.createContext(ctx);
  for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'world', f), 'utf8'), ctx);
  const WM = win.PawArt.WINTER_MARKET;
  need(WM.house === 'Gingerbread Kennel' && WM.toys.includes('Snowball Ball') && WM.treats.includes('Frozen Yoghurt Snowballs') && WM.toys.length === 5 && WM.treats.length === 3, 'PawArt.WINTER_MARKET: ' + JSON.stringify(WM)); }
// the game's coin chime (the price tags' sound)
need(/coin/.test(fs.readFileSync(path.join(ART_ROOT, 'mods', 'pawaudio.js'), 'utf8')), 'the PawAudio coin stinger');
// the game's zh-Hans words (game/i18n/zh-Hans.json) the RedNote cut and cover use: the names, 金币, the market, its stalls, the lines
const ZH = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'zh-Hans.json'), 'utf8'));
const mustZ = (k, v) => need(ZH[k] === v, 'the zh-Hans text ' + k + ' is ' + JSON.stringify(ZH[k]) + ', not ' + JSON.stringify(v));
mustZ('data.food.frozen_yoghurt_snowballs.n', '酸奶雪球'); mustZ('data.toys.snowball_ball.n', '雪球球'); mustZ('data.houses.gingerbread_kennel.n', '姜饼狗屋');
mustZ('fm.m_winter', '冬日市集'); mustZ('fm.s_treats', '零食'); mustZ('fm.s_toys', '玩具'); mustZ('fm.s_homes', '小窝'); mustZ('pm.coins_n', '{n}金币');
mustZ('data.food.frozen_yoghurt_snowballs.tip', '只用无糖原味酸奶，绝不用加糖或低脂的，那里面可能藏着木糖醇。乳制品对狗狗来说只是零食，两三颗小雪球就够了。');
mustZ('data.toys.snowball_ball.note', '叼回来：毛茸茸的白球，一颗永远不会化的雪球。每叼回一次2金币。');
mustZ('data.houses.gingerbread_kennel.note', '屋顶有白色糖霜、门边有软糖的棕色小房子。只是好看，不能吃：里里外外都是木头。');
// the capture (capture_tier.js): the game on 24 Nov 2026, the Winter Market the open market, the three items on sale, the kennel in the yard, the frozen clock
const FACTS = COVERS ? null : JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8')), FR = COVERS ? [] : FACTS.frames;
const CVF = COVERS ? JSON.parse(fs.readFileSync(path.join(CAPS, 'cover.json'), 'utf8')) : null;
if (COVERS) need(CVF.date === '2026-11-24' && CVF.jst === '2026-11-24' && CVF.main === 'winter' && CVF.lang === (RN ? 'zh-Hans' : 'en') && CVF.place.fmarket.name === (RN ? '冬日市集' : 'Winter Market') && JSON.stringify(CVF.COVER) === JSON.stringify(COVER), 'the cover capture');
if (!COVERS) {
need(FACTS.date === '2026-11-24' && FACTS.jst === '2026-11-24' && FACTS.main === 'winter', 'the capture is not the Winter Market on 24 Nov 2026');
need(FACTS.items.every((i) => i.onSale) && FACTS.open.some((o) => o.id === 'winter' && o.from === '2026-11-23' && o.to === '2026-12-31'), 'the capture: what is on sale');
need((RN ? /姜饼狗屋/ : /^Dog house: Gingerbread Kennel$/).test(FACTS.place.yard.house) && FACTS.place.yard.scene, 'the capture: the kennel in the yard: ' + FACTS.place.yard.house);
need(/frozen page clock/.test(FACTS.clock) && FACTS.n === NCAP && FR.length === NCAP && FR.every((f, i) => f.n === i), 'the capture is not this timeline (' + FACTS.n + ' frames, want ' + NCAP + '): capture again');
for (const k of Object.keys(VOD)) need(FACTS.vo[k] === VOD[k], 'the capture was timed to another voice take: ' + k);
for (const [pl, a, z, nd] of FACTS.draws) need(nd === 1, 'the game drew ' + pl + ' again during its take (frames ' + a + '..' + z + ')');
need(JSON.stringify(FACTS.CAM) === JSON.stringify(CAM), 'the capture was made with other cameras');
need((FACTS.lang || 'en') === (RN ? 'zh-Hans' : 'en') && FACTS.place.fmarket.name === (RN ? '冬日市集' : 'Winter Market') && FACTS.place.yard.name === (RN ? '家里的院子' : 'Home Yard'), 'the capture\'s language: ' + JSON.stringify([FACTS.lang, FACTS.place.fmarket.name, FACTS.place.yard.name]));
}

// ---- the places' things (world units, viewBox 0 0 1000 600): Noodle and the block keep 28 px clear of every one in the frame ----
// The market: read off the scene (path boxes and the ink of a 4x render; as winter_list_reel/build_winter.js KEEP), plus its floor props and our
// foreground things (capture: their visible shapes). The yard: its floor props and our foreground things (capture), plus the scene's own drawn
// things (sceneG paths: the house, the garden bed, the dig patch with its bone, the stepping stones, the washing line pole, the tree).
const KEEP = {
  fmarket: { driftL: [91, 460, 209, 482], driftR: [854, 464, 956, 484], decorStall: [25, 160, 303, 424], clothesStall: [352, 160, 648, 424], toysStall: [700, 160, 975, 424], homesBoard: [299.5, 414, 371, 458], homesStand: [295, 477.5, 375.5, 562.2],
    treatsBoard: [631, 414, 703, 458], treatsCart: [631, 466.5, 703, 568.5], sled: [0, 533, 127, 580], starLantern: [209, 396, 289, 486], firTree: [-21, 350, 81, 445], presents: [925, 398, 1002, 456] },
  yard: { house: [10, 95, 282, 350], gardenBed: [10, 437, 212, 587], digPatch: [470, 419, 569, 451], stones: [132, 343, 275, 429], washingPole: [572, 145, 605, 341], tree: [913, 160, 1069, 450] },
};
const propsOf = (cam) => Object.assign({}, KEEP[CAM[cam].place], FACTS.props[cam] || {});
if (!COVERS) { for (const c of Object.keys(CAM)) need(Object.keys(FACTS.props[c] || {}).filter((k) => k.startsWith('fg:' + c + ':')).length === 3, 'the capture has no foreground things for ' + c);
  need(FACTS.props.C3.house, 'the capture has no kennel box'); }
// the block under Noodle (frame px): the tag on the left, the card on the right; the ask's card is the whole block
// the tag at rest is 236 x 270 inside its 260 x 294 room: its pop overshoots by 8.5 % at most, from its left middle, and stays in the room
// (RedNote: all 85 px to the right, centred on x 540; the subtitles in a pill centred at (540, 1530), SUBROOM the room the props keep clear of)
const BY = 1146, BH = 294, TAG = [60 + DX, BY + 12, 296 + DX, BY + BH - 12], TAGROOM = [60 + DX, BY, 320 + DX, BY + BH], CARD = [348 + DX, BY, 850 + DX, BY + BH], WHOLE = [60 + DX, BY, 850 + DX, BY + BH];
const SUBY = 1530, SUBROOM = [60, 1488, 1020, 1572], MX = RN ? [50, 1030, 40, 1880] : [60, 850, 270, 1440];
const gapPx = (a, b) => Math.max(b[0] - a[2], a[0] - b[2], b[1] - a[3], a[1] - b[3]);
// on a frame: a world box in frame px
const fbox = (f, q) => [(q[0] - f.x0) * f.S, (q[1] - f.y0) * f.S, (q[2] - f.x0) * f.S, (q[3] - f.y0) * f.S];
const inFrame = (b) => b[2] > 0 && b[0] < W && b[3] > 0 && b[1] < H;
function sceneCheck(n) { const f = FR[Math.min(n, NCAP - 1)], [l, t, r, b] = f.box, props = propsOf(f.cam);
  if (f.cam !== P.camAt(n / FPS + 1e-4).name) return 'the frame is not from the camera of its beat';
  if (l < MX[0] || r > MX[1] || t < MX[2] || b > MX[3]) return 'Noodle outside x ' + MX[0] + '..' + MX[1] + ', y ' + MX[2] + '..' + MX[3] + ': ' + f.box + ' ' + f.pose + ' ' + f.expr;
  // Noodle on the floor: his feet on the open ground in front of the place (the drawing's floor or the floor going on in front of it)
  if (f.feet[1] < 560) return 'Noodle is not on the floor in front: ' + f.feet;
  const blockNow = (P.beatAt(n / FPS + 1e-4).k === 'ask' ? [WHOLE] : [TAGROOM, CARD]).concat(RN ? [SUBROOM] : []);
  for (const [k, q] of Object.entries(props)) { const pb = fbox(f, q); if (!inFrame(pb)) continue;
    const g = gapPx(f.box, pb); if (g < 28) return 'Noodle too close to ' + k + ' (' + Math.round(g) + ' px) ' + f.pose + ' ' + f.expr;
    for (const bl of blockNow) { const g2 = gapPx(bl, pb); if (g2 < 28) return 'the block too close to ' + k + ' (' + Math.round(g2) + ' px)'; } }
  return ''; }

// ---- the words ----
const price = (p) => String(p);
const TAGS = ITEMS.map((i) => ({ k: i.k, tier: RN ? '第' + i.tier + '档' : 'Tier ' + i.tier, coins: i.tier, num: price(i.price), unit: RN ? ZH['pm.coins_n'].replace('{n}', '') : 'coins' }));
const NAME = RN ? { t1: [ZH['data.food.frozen_yoghurt_snowballs.n']], t2: [ZH['data.toys.snowball_ball.n']], t3: [ZH['data.houses.gingerbread_kennel.n']] }
  : { t1: ['Frozen Yoghurt', 'Snowballs'], t2: ['Snowball Ball'], t3: ['Gingerbread', 'Kennel'] };
// RedNote: under the name, where the game sells it (冬日市集 and the stall's own sign word)
const WHERE = RN ? { t1: ZH['fm.m_winter'] + ' · ' + ZH['fm.s_treats'], t2: ZH['fm.m_winter'] + ' · ' + ZH['fm.s_toys'], t3: ZH['fm.m_winter'] + ' · ' + ZH['fm.s_homes'] } : {};
const CAP = RN ? { t1: ['只用无糖原味酸奶。', '两三颗小雪球就够了。'], t2: ['一颗永远不会化的雪球。'], t3: ['只是好看，不能吃：', '里里外外都是木头。'] }
  : { t1: ['Plain unsweetened yoghurt only.', 'Two or three are plenty.'], t2: ['A snowball that', 'never melts.'], t3: ['A look, not a snack.', 'Wood all the way through.'] };
const ZSRC = { t1: 'data.food.frozen_yoghurt_snowballs.tip', t2: 'data.toys.snowball_ball.note', t3: 'data.houses.gingerbread_kennel.note' };
if (RN) for (const k of Object.keys(CAP)) for (const l of CAP[k]) need(ZH[ZSRC[k]].includes(l.replace(/[。：]$/, '')), 'the zh line "' + l + '" is not the game\'s');
const HOOK = RN ? { head: '9、45还是900金币？', lines: ['你的狗狗先要哪个？'] } : { lines: ['What should your dog', 'get first?'], head: '9, 45 or 900 coins.' };
const ASK = RN ? { lines: ['你是哪一档？', '评论区告诉我'] } : { lines: ['Which tier', 'are you?'] };
const PLAY = RN ? '' : 'Play free!';
if (!RN) for (const it of ITEMS) need(NAME[it.k].join(' ') === it.n, 'the card name of ' + it.n);
// RedNote subtitles: Noodle's line in parts of at most 14 characters (end punctuation not counted), each as long as its share of the line. SAY: the
// numbers the voice reads out in words
const SUBS_ZH = { hook: ['9、45，', '还是900金币？', '你的狗狗先要哪个？'], t1: ['第一档，9金币：', '酸奶雪球。', '只用无糖原味酸奶，', '两三颗小雪球就够了！'],
  t2: ['第二档，45金币：', '雪球球。', '一颗永远不会化的雪球！'], t3: ['第三档，900金币：', '姜饼狗屋。', '只是好看，不能吃，', '里里外外都是木头。'], ask: ['你是哪一档？', '评论区告诉我！'] };
const SAY = [['900', '九百'], ['45', '四十五'], ['9', '九']], bare = (x) => x.replace(/[，。！？：、\s]/g, '');
const SUBS = [];
if (RN) for (const v of PB) { const parts = SUBS_ZH[v.k]; if (SAY.reduce((a, [x, y]) => a.split(x).join(y), parts.join('')) !== VOJ.text[v.k]) throw new Error('the subtitles differ from the voice: ' + v.k);
  const wt = parts.map((x) => bare(x).length + 1), sum = wt.reduce((a, c) => a + c, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum, s2 = x.replace(/[，。、：]$/, '');
    if ([...bare(s2)].length > 14) throw new Error('a subtitle over 14 characters: ' + s2);
    SUBS.push({ a: t0, b: t0 + d + (i === parts.length - 1 ? 0.35 : 0), s: s2 }); t0 += d; }); }
// the covers' words: the question big, a small line, the three tags (the game's words)
const CV = RN ? { head: '9、45还是900金币？', sub: '你的狗狗会选哪个？' } : { head: '9, 45 or 900 coins?', sub: 'What would your dog pick?' };
const allText = [HOOK.lines, HOOK.head, Object.values(NAME), Object.values(CAP), Object.values(WHERE), ASK.lines, PLAY, TAGS.map((x) => [x.tier, x.num, x.unit]), SUBS.map((x) => x.s), CV.head, CV.sub, ' 0123456789'].flat(3).join(' ');
// house words (README): no em dash, no "breed" as a verb, no "sell", no itch.io, only our website
if (/—|\bbreed(s|ing)?\b|\bsell|itch/i.test(allText + JSON.stringify(VOJSON))) throw new Error('a word the house rules ban: ' + allText);
// RedNote anti-ban (README RedNote rule, REDNOTE.md): no link, domain, handle, QR, other platform or app, off-platform word, post/story wording; checked
// in the words, the voice and every word the captured game shows
const RN_BAN = /https?:|www\.|\.app|\.com|@|instagram|youtube|tiktok|itch|微信|朋友圈|QQ|微博|抖音|小红书|WhatsApp|链接|网址|官网|二维码|扫码|下载|私信我|加我|主页链接|戳|发帖|发到|发布到|快拍|帖子|tag/i, RN_BAN2 = /INS|\bins\b/;
if (RN) { const all = allText + JSON.stringify(VOJSON) + JSON.stringify(COVERS ? CVF.words : FACTS.words) + JSON.stringify(COVERS ? CVF.place : FACTS.place);
  for (const re of [RN_BAN, RN_BAN2]) { const m = re.exec(all); if (m) throw new Error('a RedNote word on the ban list: ' + m[0]); } }
if (!COVERS && (T < 20 || T > (RN ? 32 : 30))) throw new Error('the Reel is ' + T.toFixed(2) + ' s, not 20..30');
const inner = (s) => s.trim().replace(/^<\?xml[^>]*>/, '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '');
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
// the game's own item drawings (PawArt.item of main, saved by the capture), 64 x 64
const itemSyms = ITEMS.map((it) => { const s = fs.readFileSync(path.join(CAPS, 'items', it.k + '.svg'), 'utf8'); if (!/viewBox="0 0 64 64"/.test(s) || />\?<\/text>/.test(s)) throw new Error('no item drawing for ' + it.n);
  return `<symbol id="it_${it.k}" viewBox="0 0 64 64">${inner(s)}</symbol>`; }).join('');
const BEATS = PB.map((b) => Object.assign({}, b));

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff}svg{display:block}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${itemSyms}</defs>
<image id="bg" x="0" y="0" width="${W}" height="${H}"/><g id="ov"></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const $=(i)=>document.getElementById(i), RN=${RN}, F=RN?"'LXGW WenKai'":'Caveat', CX=RN?540:455, PLAY=${JSON.stringify(PLAY)}, MX=${JSON.stringify(MX)}, SUBS=${JSON.stringify(SUBS)}, SUBY=${SUBY}, WHERE=${JSON.stringify(WHERE)};
const CV=${JSON.stringify(CV)};
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, HOOK=${JSON.stringify(HOOK)}, ASK=${JSON.stringify(ASK)};
const TAGS=${JSON.stringify(TAGS)}, NAME=${JSON.stringify(NAME)}, CAP=${JSON.stringify(CAP)}, HOOKPOP=${JSON.stringify(HOOKPOP)}, TAG=${JSON.stringify(TAG)}, TAGROOM=${JSON.stringify(TAGROOM)}, CARD=${JSON.stringify(CARD)}, WHOLE=${JSON.stringify(WHOLE)};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// text centred in its own (unseen) box
function tbox(x, y, w, h, L){ return '<g data-box><rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" fill="none"/>'+centred(L, x+w/2, y+h/2, F).svg+'</g>'; }
// a crayon coin: a gold disc with a darker rim, an inner ring and a little paw (drawn, no emoji)
function coin(cx, cy, r){ const p=(dx,dy,rr)=>'<ellipse cx="'+f2(cx+dx*r)+'" cy="'+f2(cy+dy*r)+'" rx="'+f2(rr*r)+'" ry="'+f2(rr*r*1.15)+'" fill="#C98A1E"/>';
  return '<circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+f2(r)+'" fill="#F6C945" stroke="${PEN}" stroke-width="4"/>'
    +'<circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+f2(r*0.72)+'" fill="none" stroke="#D9A42B" stroke-width="2.5"/>'
    +'<path d="M'+f2(cx-r*0.55)+' '+f2(cy-r*0.62)+'q'+f2(r*0.2)+' '+f2(-r*0.12)+' '+f2(r*0.42)+' '+f2(-r*0.02)+'" fill="none" stroke="#FFF3C4" stroke-width="3" stroke-linecap="round"/>'
    +p(0,0.22,0.24)+p(-0.3,-0.12,0.1)+p(-0.1,-0.3,0.1)+p(0.1,-0.3,0.1)+p(0.3,-0.12,0.1); }
// the price tag: a crayon shop tag (cut top corners, a hole), the tier, n crayon coins, the price; pops in from u = 0 (a bounce and a little swing)
function tagG(tg, u, op){ const [x0,y0,x1,y1]=TAG, w=x1-x0, cx=(x0+x1)/2, ch=40, k=u>=1?1:1-0.4*Math.exp(-u*10)*Math.cos(u*20);
  if(u<0) return '';
  const body='M'+(x0+ch)+' '+y0+'H'+(x1-ch)+'L'+x1+' '+(y0+ch)+'V'+(y1-18)+'Q'+x1+' '+y1+' '+(x1-18)+' '+y1+'H'+(x0+18)+'Q'+x0+' '+y1+' '+x0+' '+(y1-18)+'V'+(y0+ch)+'Z';
  let m='<path data-apart="tag" d="'+body+'" fill="#FFE7A3" stroke="${PEN}" stroke-width="7" stroke-linejoin="round"/>';
  m+='<path d="M'+(x0+ch+10)+' '+(y0+12)+'H'+(x1-ch-10)+'" stroke="#F3CF73" stroke-width="5" stroke-linecap="round"/>';
  m+='<circle cx="'+cx+'" cy="'+(y0+27)+'" r="10" fill="${CREAM}" stroke="${PEN}" stroke-width="4"/>';
  m+=tbox(x0+16, y0+42, w-32, 46, [{s:tg.tier,size:fitS(tg.tier,44,w-40),fill:'${RED}'}]);
  const r=20, gp=48, cx0=cx-(tg.coins-1)*gp/2; for(let i=0;i<tg.coins;i++) m+=coin(cx0+i*gp, y0+116, r);
  m+=tbox(x0+12, RN?y0+136:y0+138, w-24, RN?80:88, [{s:tg.num,size:fitS('900',RN?86:112,w-36)}]);
  m+=tbox(x0+16, RN?y0+222:y0+226, w-32, RN?34:36, [{s:tg.unit,size:RN?32:40,fill:'#8A5A3C'}]);
  const pcx=x0, pcy=(y0+y1)/2;
  return '<g opacity="'+f2(op*sm(u/0.08+0.4))+'"><g transform="translate('+f2(pcx)+' '+f2(pcy)+') scale('+k.toFixed(4)+') translate('+f2(-pcx)+' '+f2(-pcy)+')">'+m+'</g></g>'; }
// the card: the game's own drawing of the item, its name, the game's own words about it
function cardG(k, op, u){ const [x0,y0,x1,y1]=CARD, w=x1-x0, s=0.95+0.05*sm(u/0.22), cx=(x0+x1)/2, cy=(y0+y1)/2;
  let m='<rect data-apart="card" x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+(y1-y0)+'" rx="34" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>';
  m+='<rect x="'+(x0+20)+'" y="'+(y0+20)+'" width="134" height="134" rx="22" fill="#FFF3CF" stroke="${PEN}" stroke-width="4"/><use href="#it_'+k+'" x="'+(x0+31)+'" y="'+(y0+31)+'" width="112" height="112"/>';
  const nm=NAME[k], nz=Math.min.apply(null, nm.map((s)=>fitS(s, nm.length>1?54:60, 300)));
  if(RN) m+=tbox(x0+168, y0+20, w-188, 134, [{s:nm[0],size:fitS(nm[0],62,300),fill:'${RED}',pitch:66},{s:WHERE[k],size:fitS(WHERE[k],32,300),fill:'#8A7468'}]);
  else m+=tbox(x0+168, y0+20, w-188, 134, nm.map((s)=>({s,size:nz,fill:'${RED}',pitch:nz*1.02})));
  const c=CAP[k], cz=Math.min.apply(null, c.map((s)=>fitS(s,RN?44:46,w-48)));
  m+=tbox(x0+20, y0+166, w-40, 110, c.map((s)=>({s,size:cz,pitch:cz*1.12})));
  return '<g opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(s)+') translate('+f2(-cx)+' '+f2(-cy)+')">'+m+'</g>'; }
// a card of lines (the hook's question on the right; the ask over the whole block, with a crayon arrow down to the comments)
function linesCard(box, op, L, arrow){ const [x0,y0,x1,y1]=box, w=x1-x0;
  let m='<rect data-apart="card" x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+(y1-y0)+'" rx="34" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>';
  const tw=arrow?w-150:w; m+=tbox(x0+20, y0+20, tw-40, y1-y0-40, L);
  if(arrow){ const ax=x1-92, ay0=y0+70, ay1=y1-70; m+='<path d="M'+ax+' '+ay0+'C'+(ax+14)+' '+(ay0+50)+' '+(ax-12)+' '+(ay1-60)+' '+ax+' '+ay1+'M'+(ax-34)+' '+(ay1-38)+'L'+ax+' '+ay1+'L'+(ax+32)+' '+(ay1-40)+'" fill="none" stroke="${RED}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'; }
  return '<g opacity="'+f2(op)+'">'+m+'</g>'; }
window.frame=function(t, N){
  let ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at, cop=fade*(i===0?1:sm((lt+0.06)/0.14));
  if(fade>0){
    if(b.k==='hook'){
      // the tag runs Tier 1 (on screen from the first frame), Tier 2, Tier 3 with the voice; the question card stays
      let j=0; for(let q=0;q<HOOKPOP.length;q++) if(lt>=HOOKPOP[q]-0.0001) j=q;
      ov+=tagG(TAGS[j], j===0?1:lt-HOOKPOP[j], fade);
      ov+=linesCard(CARD, fade, [{s:HOOK.head,size:fitS(HOOK.head,RN?50:54,440),fill:'${RED}',pitch:RN?74:66}].concat(HOOK.lines.map((s)=>({s,size:fitS(s,58,440),pitch:62}))));
    } else if(b.k==='ask'){ ov+=linesCard(WHOLE, cop, ASK.lines.map((s,i)=>(RN?{s,size:fitS(s,i?58:84,560),pitch:i?0:96,fill:i?'#8A7468':'${PEN}'}:{s,size:fitS(s,96,560),pitch:96})), true);
    } else { const tg=TAGS.find((x)=>x.k===b.k); ov+=tagG(tg, lt+0.06, cop); ov+=cardG(b.k, fade*sm((lt-0.06)/0.14), lt-0.06); }
    // Noodle's drawn box on this frame of the take (from the capture), so the checks see him
    ov+='<rect data-apart="Noodle" x="'+N.box[0]+'" y="'+N.box[1]+'" width="'+f2(N.box[2]-N.box[0])+'" height="'+f2(N.box[3]-N.box[1])+'" fill="none"/>';
    // RedNote subtitles: Noodle's words in a pill of at most 14 characters, under the block on the open floor
    if(RN){ const su=SUBS.find((x)=>t>=x.a&&t<x.b); if(su){ const o=Math.min(sm((t-su.a)/0.08),sm((su.b-t)/0.08)); ov+=pill(su.s, 540, SUBY, fitS(su.s,56,900), F, { fill:'${CREAM}', padX:30, op:fade*o }).replace('<g data-box','<g data-box data-apart="sub"'); } }
  }
  // the end card (brand/kids/endcard.js) 70 px lower, with "Play free!" over the logo (as winter_list_reel)
  let ec=''; if(end&&!RN){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/><g transform="translate(0 70)">'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'
    +centred([{s:PLAY,size:76,fill:'${RED}'}],CX,412,F).svg+'</g>'; }
  if(end&&RN) ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCardRN('tall',LOGO_INNER,{play:'搜 Doodle Doggo App'})+'</g>';
  $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  if(RN&&end){ const g=$('ec').querySelector('.endcard'), bb=g.getBBox(); g.setAttribute('transform','translate('+f2(540-(bb.x+bb.width/2))+' '+f2(960-(bb.y+bb.height/2))+')'); }
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  if(!RN){ const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; '); }
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ');
  // the tag, the card and Noodle: inside x 60..850, y 270..1440 (the tag's bounce included)
  for(const e of $('ov').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(); if(!r.width) continue; let o=1; for(let p=e;p&&p.id!=='ov';p=p.parentNode) if(p.getAttribute('opacity')!=null) o*=+p.getAttribute('opacity'); if(o<=0.05) continue;
    if(r.right>MX[1]+4||r.left<MX[0]-4||r.top<MX[2]-4||r.bottom>MX[3]+4) return 'outside x '+MX[0]+'..'+MX[1]+', y '+MX[2]+'..'+MX[3]+': '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  if(RN&&end){ const r=$('ec').querySelector('.endcard').getBoundingClientRect(); if(r.left<50||r.right>1030||r.top<40||r.bottom>1880||Math.abs((r.left+r.right)/2-540)>2||Math.abs((r.top+r.bottom)/2-960)>2) return 'the RedNote end card is not centred at (540, 960): '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  if(end&&!RN){ const lg=$('ec').querySelector('.endcard svg').getBoundingClientRect(), tx=[...$('ec').querySelectorAll(':scope>g>text')].find((e)=>e.textContent===PLAY);
    const r=tx.getBoundingClientRect(); if(lg.top-r.bottom<20) return 'end card: "'+PLAY+'" too close to the logo ('+Math.round(lg.top-r.bottom)+' px)'; }
  return ''; };
// ---- the cover (ONLY=cover): its own design, not a frame of the Reel. The whole Winter Market under an open sky (capture_tier.js COVER): the question
// big on a cream card in the sky, the three big crayon price tags in a row under it (each with the game's own drawing of its item), Noodle big on
// the snow in front, the logo on its own card beside him, the game's Felt Fir Trees and Star Lantern on the snow below. Checks: text centred, 28 px
// apart, 28 px clear of every prop of the market and of the bunting, roofs and lanterns, everything inside x 40..1040, y 250..1670 (the 3:4 crop
// keeps y 240..1680).
function coverTag(tg, k, x0, y0, x1, y1){ const w=x1-x0, cx=(x0+x1)/2, ch=42;
  const body='M'+(x0+ch)+' '+y0+'H'+(x1-ch)+'L'+x1+' '+(y0+ch)+'V'+(y1-20)+'Q'+x1+' '+y1+' '+(x1-20)+' '+y1+'H'+(x0+20)+'Q'+x0+' '+y1+' '+x0+' '+(y1-20)+'V'+(y0+ch)+'Z';
  let m='<g data-apart="tag'+k+'"><path d="'+body+'" fill="#FFE7A3" stroke="${PEN}" stroke-width="8" stroke-linejoin="round"/></g>';
  m+='<path d="M'+(x0+ch+10)+' '+(y0+13)+'H'+(x1-ch-10)+'" stroke="#F3CF73" stroke-width="5" stroke-linecap="round"/>';
  m+='<circle cx="'+cx+'" cy="'+(y0+28)+'" r="11" fill="${CREAM}" stroke="${PEN}" stroke-width="4"/>';
  m+=tbox(x0+16, y0+44, w-32, 46, [{s:tg.tier,size:fitS(tg.tier,46,w-40),fill:'${RED}'}]);
  const r=19, gp=46, cx0=cx-(tg.coins-1)*gp/2; for(let i=0;i<tg.coins;i++) m+=coin(cx0+i*gp, y0+112, r);
  m+='<rect x="'+(cx-64)+'" y="'+(y0+140)+'" width="128" height="128" rx="20" fill="#FFF8E3" stroke="${PEN}" stroke-width="4"/><use href="#it_'+k+'" x="'+(cx-54)+'" y="'+(y0+150)+'" width="108" height="108"/>';
  m+=tbox(x0+12, RN?y0+268:y0+272, w-24, RN?58:62, [{s:tg.num,size:fitS('900',RN?72:92,w-40)}]);
  m+=tbox(x0+16, RN?y0+334:y0+332, w-32, RN?30:34, [{s:tg.unit,size:RN?30:38,fill:'#8A5A3C'}]);
  return m; }
window.cover=function(nb, props, sky){ $('ov').innerHTML=''; $('ec').innerHTML='';
  let o='';
  const L=[{s:CV.head,size:fitS(CV.head,RN?100:112,820),fill:'${RED}',pitch:RN?104:100},{s:CV.sub,size:fitS(CV.sub,RN?54:60,820),fill:'${PEN}'}];
  o+='<g data-box><rect data-apart="head" x="90" y="262" width="900" height="210" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'+centred(L,540,367,F).svg+'</g>';
  const XS=[[60,350],[395,685],[730,1020]]; TAGS.forEach((tg,i)=>{ o+=coverTag(tg, tg.k, XS[i][0], 500, XS[i][1], 873); });
  const lw=262, lh=lw*280/900; o+='<g data-apart="logo"><rect x="60" y="1430" width="'+(lw+36)+'" height="'+f2(lh+36)+'" rx="26" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg x="78" y="1448" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  o+='<rect data-apart="Noodle" x="'+nb[0]+'" y="'+nb[1]+'" width="'+f2(nb[2]-nb[0])+'" height="'+f2(nb[3]-nb[1])+'" fill="none"/>';
  $('ov').innerHTML=o;
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'cover too close: '+near.join('; ');
  for(const e of $('ov').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(), n=e.getAttribute('data-apart');
    if(r.left<40||r.right>1040||r.top<250||r.bottom>1670) return 'cover: outside x 40..1040, y 250..1670: '+n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round);
    for(const [k,q] of Object.entries(props)){ const g=Math.max(q[0]-r.right, r.left-q[2], q[1]-r.bottom, r.top-q[3]); if(g<28) return 'cover: '+n+' '+Math.round(g)+' px from the market prop '+k; }
    // the bunting, roofs and lanterns: the top of the market's ink per 25 px of the frame
    if(n!=='Noodle'&&n!=='logo'){ let top=1e9; for(let x=Math.floor(r.left/25); x<=Math.floor(r.right/25); x++) top=Math.min(top, sky[Math.max(0,Math.min(sky.length-1,x))]); if(top-r.bottom<28) return 'cover: '+n+' '+Math.round(top-r.bottom)+' px from the bunting'; } }
  return ''; };
window.bg=async function(src){ const im=$('bg'); if(im.getAttribute('href')===src) return; const pre=new Image(); pre.src=src; await pre.decode(); im.setAttribute('href',src); await new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r))); };
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', (e) => console.error('page error:', e.message));
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  const zhText = allText + '治愈系蜡笔狗狗游戏搜 Doodle Doggo App';
  if (RN) { await p.evaluate((txt) => document.fonts.load('700 40px "LXGW WenKai"', txt), zhText);
    if (!(await p.evaluate((txt) => document.fonts.check('700 40px "LXGW WenKai"', txt), zhText))) throw new Error('LXGW WenKai did not load'); }
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames,', NCAP, 'of the take; beats at', BEATS.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + v.hold.toFixed(2) + ') ' + v.cam).join(', '));
  if (COVERS) {
    // the market's things in frame px (the cover's camera: S 1, x0 -40, OY 775) and the top of its ink per 25 px of the frame (SKYTOP, world units per 25)
    const f = { x0: COVER.x0, y0: -COVER.OY / COVER.S, S: COVER.S }, props = {};
    for (const [k, q] of Object.entries(Object.assign({}, KEEP.fmarket, CVF.props))) props[k] = fbox(f, q);
    const SKYTOP = [150, 153, 155, 160, 162, 164, 167, 168, 169, 160, 160, 165, 160, 158, 154, 149, 144, 137, 134, 128, 128, 133, 136, 144, 149, 154, 158, 161, 164, 160, 160, 169, 168, 166, 165, 162, 160, 155, 153, 150];
    const sky = [...Array(Math.ceil(W / 25)).keys()].map((i) => { const wx = (i * 25) / f.S + f.x0, j = Math.floor(wx / 25); return Math.min(SKYTOP[Math.max(0, Math.min(39, j))], SKYTOP[Math.max(0, Math.min(39, Math.floor((wx + 24) / 25)))]) * f.S + COVER.OY; });
    await p.evaluate((s) => window.bg(s), 'file://' + path.join(CAPS, 'cover_bg.png'));
    const err = await p.evaluate(([nb, pr, sk]) => window.cover(nb, pr, sk), [CVF.noodle.box, props, sky]); if (err) throw new Error(err);
    const file = RN ? path.join(ROOT, 'brand', 'rednote', 'rednote-24-winter-tiers.jpg') : path.join(OUT, 'tier-cover.jpg');
    await p.screenshot({ path: file, type: 'jpeg', quality: 92, ...(RN ? { clip: { x: 0, y: 240, width: W, height: 1440 } } : {}) }); console.log('wrote', file); await b.close(); return; }
  const seq = (n) => 'file://' + path.join(CAPS, 'seq', 'f' + String(Math.min(n, NCAP - 1)).padStart(5, '0') + '.png');
  const one = async (fi, shot, file) => { const t = fi / FPS + 1e-4, N = FR[Math.min(fi, NCAP - 1)];   // +1e-4: the frame-index nudge (fi/FPS can land a hair under a beat start)
    let err = t < LOOP + 0.22 ? sceneCheck(fi) : '';
    if (shot) await p.evaluate((s) => window.bg(s), seq(fi));
    err = err || (await p.evaluate(([t, N]) => window.frame(t, N), [t, { box: N.box }]));
    if (err) { if (process.env.LOOSE) console.log('CHECK', t.toFixed(2), err.slice(0, 300)); else throw new Error(err + ' at ' + t.toFixed(2) + ' (frame ' + fi + ')'); }
    if (shot) await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, 0.8, 1.9, 3.5, ...BEATS.slice(1).flatMap((x) => [x.at + 0.12, x.at + 0.5, x.at + x.hold * 0.8]), LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await one(Math.round(t * FPS), true, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  if (process.env.CHECK) { for (let fi = 0; fi < NF; fi++) await one(fi, false); console.log('all', NF, 'frames pass the checks'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  const FD = path.join(WORK, 'f');
  for (const fi of fr) { await one(fi, true, path.join(FD, `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  for (let fi = NF; fs.existsSync(path.join(FD, `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(FD, `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's Winter Market music, its coin chime on every price tag, Noodle on top (kept from the last full render when FRAMES is set) ----
  const mixWav = path.join(WORK, 'mix.wav');
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const pops = HOOKPOP.map((a) => B.hook + a).concat(ITEMS.map((it) => B[it.k]));
    const coins = pops.map((at, i) => ({ at: Math.max(0.02, at), name: 'coin', amount: [9, 45, 900, 9, 45, 900][i] }));
    const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
    const r = await ap.evaluate(async ([s, st]) => { const o = await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
      segments: [{ at: 0, ctx: { place: 'fmarket', fest: 'winter', time: 'day', weather: 'sunny' } }], stingers: st }); return { wav: o.wav }; }, [T + 0.5, coins]);
    fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r.wav, 'base64')); await ab.close(); console.log('music: the Winter Market (fmarket, fest winter), coin chimes at', pops.map((x) => x.toFixed(2)).join(', '));
    const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
    ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
    const EV = [['tick', B.hook + HOOKQ]]; for (const k of ['t1', 't2', 't3', 'ask']) EV.push(['tick', B[k] + 0.06]); EV.push(['tick', LOOP + 0.15]);
    const fx = path.join(WORK, 'fx.wav');
    ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
      + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
    const voWav = path.join(WORK, 'voice.wav'), VOAT = BEATS.map((v) => ({ k: v.k, at: v.at }));
    ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
      + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
    const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, 'premix.wav');
    ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-12dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    const r2 = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r2.slice(r2.lastIndexOf('{')));
    ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-winter-tiers-rednote.mp4' : 'doodle-doggo-winter-tiers.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(FD, 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  // ---- frame by frame (../frozen_clock.js checkFrames): every run of game footage between two beat cuts (the camera drifting, Noodle's own pose
  // animation). A run starts 3 frames after its beat's first frame (the cut and the card's pop) and ends 2 frames before the next. Doubled = a frame that
  // barely changes; jumps (over 3x the run's median) are listed with what they are: the price tag's pop, a face coming on, a step of the game's crayon
  // pose animation (drawn about three times a second) ----
  const fN = (t) => Math.round(t * FPS + 1e-4);
  const events = []; HOOKPOP.forEach((a) => events.push([fN(B.hook + a), 'tag pop'])); PB.slice(1).forEach((b) => events.push([fN(b.at - 0.06), 'tag pop, card']));
  for (const c of P.cues) if (c.expr || c.pose) events.push([fN(c.t), 'pose/face ' + (c.pose || '') + ' ' + (c.expr || '')]);
  let bad = 0; const report = [];
  for (let i = 0; i < BEATS.length; i++) { const a = fN(BEATS[i].at - 0.06) + 3, z = (i + 1 < BEATS.length ? fN(BEATS[i + 1].at - 0.06) : fN(LOOP)) - 2;
    const c = checkFrames(mp4, a, z); bad += c.doubled.length;
    const lab = c.jumps.map((j) => { const e = events.filter(([f]) => j >= f && j <= f + 12).map(([, s]) => s); return j + (e.length ? ' (' + e.join(', ') + ')' : ' (pose step)'); });
    const lo = Math.min(...c.diffs.map((x) => x[1]));
    report.push([BEATS[i].k, a + '..' + z, c.median, lo, c.doubled, lab]);
    console.log('checkFrames', BEATS[i].k, BEATS[i].cam, a + '..' + z, 'median', c.median, 'smallest', lo, 'doubled', JSON.stringify(c.doubled), 'jumps', JSON.stringify(lab)); }
  fs.writeFileSync(path.join(WORK, 'checkframes.json'), JSON.stringify(report));
  console.log('runs:', bad ? bad + ' doubled frames to look at' : 'no doubled frames');
})().catch((e) => { console.error(e); process.exit(1); });
