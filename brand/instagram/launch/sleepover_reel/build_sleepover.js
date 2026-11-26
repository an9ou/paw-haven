// The 26 Nov 2026 "Noodle's first sleepover" Reel (v2.33 Helping paws; script, shot table, hook scores and fact sources: docs/marketing/SLEEPOVER_REEL.md).
// English cut only. Noodle visits Sunny Biscuit's yard and helps out (fill the bowl, water the garden, make Honey's wish come true), goes for a
// sleepover (a guest in their yard at night, name tag and all, a pet), comes home by breakfast with a diary page and the real Share this moment
// picture of the two dogs (the payoff the hook teases), then Sunny Biscuit's help letter, Say thanks and the paw print back; then the ask
// ("Tag the friend your dog would sleep over with 👇") and our standard end card for 2.5 s.
// Everything is from origin/main and the captures (capture_sleepover.js: two games on the Friends cloud mock, game/fr_mock.js, as test_v233_helps.js):
// the scenes are the game's svg.world (the friend's yard as a visit draws it by day, their own yard at night, my yard at dawn), every word on the
// cards is the game's own (game/i18n/en.json, checked below) or the voice's line, the picture is the PNG the game's share sheet hands over.
// Every moving drawing is the game's own animation read off the FROZEN page clock (capture: 30 frames a loop at exactly 1000/30 ms); a run plays
// loop frame (n - its first frame) mod 30. The dogs breathe and sway gently all the time, so no hold is frozen.
// Every frame: centreCheck(), safeCheck(), apartCheck() (../centre_text.js), words and key art inside x 60..850, y 270..1440, the dogs on the scene's
// floor and 28 px clear of its props (GROUND) and of the washing on the line (HANG); the bowl, the ball, the tag, the cards and the pills too.
// The hook and the payoff are shot closer (mzoom): the washing line is above the frame, and every card, the picture cards included, keeps 28 px
// clear of the washing, the line, the pole and the scene's props.
// 1080 x 1920, 30 fps. Voice: Noodle's narrator, Kokoro af_bella 1.1x (vo_sleepover.json via ../friends_reel/vo_friends.py). Music: the game's own
// yard music (mods/pawaudio.js; day, night, dawn as the story goes) about 11 dB under the voice, the game's discover sting on the way home.
//
//   git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/sleepover_reel/capture_sleepover.js <main> <caps dir>
//   VO_LINES=brand/instagram/launch/sleepover_reel/vo_sleepover.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/sleepover_reel/build_sleepover.js <workdir> <vo dir>
//   ONLY=stills (TS=a,b,...), CHECK=1 (every frame's checks, no screenshots), FRAMES=a-b (re-render only frames a..b, then encode again with the
//   same sound), LOOSE=1 (stills only: print a failed check and go on).
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles, RN_FONT_CSS } = require('../../../kids/endcard.js');
const { checkFrames } = require('../frozen_clock.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'sleep_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
fs.mkdirSync(path.join(WORK, 'f'), { recursive: true }); fs.mkdirSync(path.join(WORK, 'stills'), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
// REDNOTE=1 (the RedNote cut, owner's go-ahead 26 Nov 2026; as visitor_reel and tier_reel): every word in Simplified Chinese, the game's own zh-Hans
// words where the game has them (checked below), the captures made with PAW_LANG=zh-Hans (CAPS), Noodle in Mandarin (../friends_reel/vo_friends_zh.py
// with VO_LINES=sleepover_reel/vo_sleepover_zh.json, zf_073 1.0x; Noodle is 面条 in the voice), subtitles of at most 14 characters, LXGW WenKai, no safe
// zone (everything in front, and each scene window with it, 85 px right, a 50 px margin), the share picture cut just above its
// "Doodle Doggo · doodledoggo.app" chip, the RedNote end card (the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App") centred at (540, 960).
// Output doodle-doggo-sleepover-rednote.mp4. The build stops on any word of RN_BAN in the words, the voice or the captured game text.
const RN = !!process.env.REDNOTE, RNX = RN ? 85 : 0, VOFILE = RN ? 'vo_sleepover_zh.json' : 'vo_sleepover.json';
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, VOFILE), 'utf8'));
for (const [k, s] of Object.entries(VOJSON)) if (VOJ.text[k] !== s) throw new Error('the voice file of ' + k + ' is not ' + VOFILE + '\'s line: make the voice again');

// ---- the facts, checked against main (the game's own words) and the captures ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const must = (k, s) => { if (EN[k] !== s) throw new Error('the game text changed: ' + k + ' is ' + JSON.stringify(EN[k]) + ', not ' + JSON.stringify(s)); };
must('hp.help_out', 'Help out'); must('hp.bowl_aria', "Fill {dog}'s bowl"); must('hp.water_aria', 'Water the garden'); must('hp.wish_aria', "Make {dog}'s wish come true");
must('hp.sleep_btn', 'Sleepover'); must('hp.sleep_sent', '{dog} packed a toothbrush. See you in the morning!'); must('hp.g_title', 'A sleepover guest!');
must('hp.g_tag', '{dog}, from {name}'); must('hp.g_pet_ok', '{dog} and {guest} play together. +{n} Bond.'); must('hp.d_back', 'Home by breakfast, of course.');
must('hp.l_title', '{who} helped out!'); must('hp.thanks', 'Say thanks'); must('data.fr_notes.12', 'Thank you for helping!'); must('sh.moment', 'Share this moment');
must('dd.chip_done', 'Wish come true!'); must('hp.wish_chip', 'Today I wish for {wish}');
const V233 = fs.readFileSync(path.join(ART_ROOT, 'V233.md'), 'utf8');
for (const s of ['**No new coins**', 'Say thanks', '"Sleepover tonight"', "My dog **stays in my game all day**", 'Home by breakfast, of course.']) if (!V233.includes(s)) throw new Error('V233.md no longer says ' + s);
const F = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8'));
const chk = (ok, what) => { if (!ok) throw new Error('capture fact: ' + what); };
chk(F.lang === (RN ? 'zh-Hans' : 'en') || (!RN && !F.lang), 'the capture\'s language');
if (!RN) {
chk(F.friendName === 'Sunny Biscuit' && F.meName === 'Fluffy Button' && F.honeyName === 'Honey', 'the made-up names');
chk(F.visit.bubble.text === 'Today I wish for a game of ball' && F.visitAfter.bubble.text === 'Wish come true!', 'the wish bubble');
chk(JSON.stringify(F.stripAria) === JSON.stringify(["Fill Honey's bowl", 'Water the garden', "Make Honey's wish come true"]) && /^Help out/.test(F.stripLabel), 'the Help out strip');
chk(F.visitBtns.includes('Sleepover') && F.sleepBtnAfter === 'Sleepover sent', 'the Sleepover button');
chk(['bowl', 'water', 'wish'].every((k) => F.helpToasts[k].includes('Noodle helped out! +1 Bond')), 'the helps\' toasts (+1 Bond)');
chk(F.sleepToasts.includes('Noodle packed a toothbrush. See you in the morning!'), 'the sleepover toast');
chk(F.guestTag[0] === 'Noodle, from Fluffy Button' && F.petToasts.includes('Honey and Noodle play together. +1 Bond.'), 'the guest tag and the pet');
chk(F.letters.some((l) => l.title === 'Fluffy Button helped out!' && l.text === "Fluffy Button stopped by: filled Honey's bowl, watered the garden and made Honey's wish come true."), 'the help letter');
chk(F.thanksToasts.includes('Thank-you note sent!') && F.thanksSent[0].data.i === 12, 'Say thanks (note 12)');
chk(F.homeToasts[0] === 'Noodle is home from the sleepover! +2 Bond. A new page in the diary.', 'home by morning');
chk(F.diary.lines.includes('Home by breakfast, of course.') && F.diary.lines.includes("I slept over at Sunny Biscuit's yard. Their Cozy Cottage was very cosy."), 'the diary page');
chk(F.share.w === 1080 && F.share.h === 1350 && F.share.rec.from === 'sleep' && F.share.rec.pal && F.share.rec.yard, 'the share picture (Share this moment, the pal and the yard)');
chk(F.thxMail.some((m) => m.title === 'A paw print from Sunny Biscuit' && m.text === 'Thank you for helping!'), 'the paw print back');
}
// the zh-Hans words (game/i18n/zh-Hans.json) and the zh capture. The friend names are Dog Card words, which zh-Hans shows in Chinese with a zero-width
// space between the two words (阳光​饼干, 毛茸茸​纽扣); the cards show them without it (it draws nothing). The dogs' own names stay Latin (Noodle, Honey).
const ZH = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'zh-Hans.json'), 'utf8'));
const mustZ = (k, s) => { if (ZH[k] !== s) throw new Error('the zh-Hans game text changed: ' + k + ' is ' + JSON.stringify(ZH[k]) + ', not ' + JSON.stringify(s)); };
const Z0 = (x) => String(x || '').replace(/\u200b/g, '');
if (RN) {
  mustZ('hp.help_out', '帮帮忙'); mustZ('hp.bowl_aria', '给{dog}的碗添满饭'); mustZ('hp.water_aria', '给菜园浇水'); mustZ('hp.wish_aria', '帮{dog}实现心愿');
  mustZ('hp.wish_chip', '今天的小心愿：{wish}'); mustZ('dd.wish_ball', '玩一局球'); mustZ('dd.chip_done', '心愿实现啦！'); mustZ('hp.sleep_btn', '去过夜');
  mustZ('hp.sleep_sent', '{dog}带上了牙刷。明早见！'); mustZ('hp.g_title', '来过夜的小客人！'); mustZ('hp.g_tag', '{name}家的{dog}');
  mustZ('hp.g_pet_ok', '{dog}和{guest}一起玩。+{n}亲密度。'); mustZ('hp.d_back', '当然啦，早饭前就回家了。'); mustZ('hp.home_toast', '{dog}过夜回来啦！+{n}亲密度。日记里多了一页。');
  mustZ('hp.l_title', '{who}来帮忙啦！'); mustZ('hp.l_text', '{who}来过了：{list}。'); mustZ('hp.thanks', '道谢'); mustZ('data.fr_notes.12', '谢谢你来帮忙！');
  mustZ('fr.note_title', '{name}留下的爪印'); mustZ('nw.v233.sleep', '让狗狗去好友家过夜：它会带着一页日记和一幅画回来'); mustZ('data.dc_words_a.0', '阳光'); mustZ('data.dc_words_b.0', '饼干');
  mustZ('data.dc_words_a.3', '毛茸茸'); mustZ('data.dc_words_b.4', '纽扣');
  chk(F.visit.bubble.text === '今天的小心愿：玩一局球' && F.visitAfter.bubble.text === '心愿实现啦！', 'the zh wish bubble');
  chk(JSON.stringify(F.stripAria) === JSON.stringify(['给Honey的碗添满饭', '给菜园浇水', '帮Honey实现心愿']) && /^帮帮忙/.test(F.stripLabel), 'the zh Help out strip');
  chk(F.visitBtns.includes('去过夜') && ['bowl', 'water', 'wish'].every((k) => F.helpToasts[k].includes('Noodle帮了个忙！+1亲密度')), 'the zh visit button and help toasts');
  chk(F.sleepToasts.includes('Noodle带上了牙刷。明早见！'), 'the zh sleepover toast');
  chk(Z0(F.guestTag[0]) === '毛茸茸纽扣家的Noodle' && F.petToasts.includes('Honey和Noodle一起玩。+1亲密度。'), 'the zh guest tag and the pet');
  chk(F.letters.some((l) => Z0(l.title) === '毛茸茸纽扣来帮忙啦！' && Z0(l.text) === '毛茸茸纽扣来过了：给Honey的碗添满了饭、给菜园浇了水和帮Honey实现了心愿。'), 'the zh help letter');
  chk(F.thanksToasts.includes('感谢卡送出啦！') && F.thanksSent[0].data.i === 12, 'the zh Say thanks (note 12)');
  chk(F.homeToasts[0] === 'Noodle过夜回来啦！+2亲密度。日记里多了一页。' && F.diary.lines.includes('当然啦，早饭前就回家了。'), 'the zh home by morning');
  chk(F.share.w === 1080 && F.share.h === 1350 && F.share.rec.from === 'sleep' && F.share.rec.pal && F.share.rec.yard, 'the share picture');
  chk(F.thxMail.some((m) => Z0(m.title) === '阳光饼干留下的爪印' && m.text === '谢谢你来帮忙！'), 'the zh paw print back');
  // the share picture's chip (58_share.js SH_LAY feed chip: its middle at y 1290 of 1350, 58 px tall: its top at 1261); RedNote shows y 0..1254 only
  const SH = fs.readFileSync(path.join(ART_ROOT, 'game', 'src', '58_share.js'), 'utf8'), m = /feed: \{[^}]*chip: (\d+)/.exec(SH);
  if (!m || +m[1] !== 1290) throw new Error('the share picture chip moved: ' + (m && m[1]));
}
// no black or white dog as a subject: Noodle (red dachshund, ee no, E with bb = chocolate-red) and Honey (golden, ee)
chk(F.noodleCard.b === 3 && F.snapshot.dogs[0].b === 2 && F.snapshot.dogs[0].n === 45, 'the dogs: Noodle the Dachshund, Honey the Golden');

const DRAW = JSON.parse(fs.readFileSync(path.join(CAPS, 'draw.json'), 'utf8'));
for (const [k, d] of Object.entries(DRAW)) {
  if (d.vis.length !== 30 || d.step !== '1000/30 ms, frozen clock') throw new Error('the drawing ' + k + ' is not a 30-frame loop off the frozen clock');
  d.idx = d.vis.map((v) => { if (v.filter((x) => x === 1).length !== 1 || v.filter((x) => x === 0).length !== v.length - 1) throw new Error('the frame animation of ' + k + ' is not a step: ' + JSON.stringify(v)); return v.indexOf(1); });
}
const LOGO_INNER = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
// the help props as the visit draws them: the bowl (empty, then Basic Kibble), the watering can, the Tennis Ball
const inner = (s, what) => { const m = /<svg[\s\S]*<\/svg>/.exec(s); if (!m) throw new Error('no art: ' + what); return m[0]; };
const ART = { bowl0: inner(F.helpArt.bowl, 'bowl'), bowl1: inner(F.helpArt.bowlFull, 'full bowl'), can: inner(F.helpArt.can, 'can'), ball: F.helpArt.ball };
if (!/aria-label="Basic Kibble bowl"/.test(ART.bowl1) || !/aria-label="Tennis Ball"/.test(ART.ball)) throw new Error('the help art changed');
const symArt = (id, s) => s.replace(/^<svg[^>]*?(viewBox="[^"]*")[^>]*>/, (m, vb) => `<symbol id="${id}" ${vb} overflow="visible">`).replace(/<\/svg>\s*$/, '</symbol>');

// ---- the scenes: a 303.75 x 540-unit window of the game's yard at 3.5556x (1920 / 540), as the visitor Reel ----
// GROUND: the scene's own props (scene units, x0 y0 x1 y1), read off a unit grid of each grab: the dogs and our props stand 28 px clear of them.
// HANG: the washing line's pole and the washing (the same yard art in all three yards; see visitor_reel). The fence and the hills are backdrop.
const SCALE = H / 540, SY0 = 60;
const STONES = { stoneA: [222, 386, 280, 413], stoneB: [226, 410, 277, 430], stoneC: [184, 388, 230, 406] }, DIG = [468, 420, 570, 453];
// mzoom (hook, payoff): the camera closer and lower in Noodle's yard (y 290..600 at 6.19x), so the washing line, its pole and the sky are above
// the frame; the picture cards sit on open grass and plain fence boards only (coordinator, 26 Nov 2026: no overlapping the washing either)
const ZS = H / 310;
const SCN = {
  mzoom: { svg: 'me_dawn.svg', x0: 278, y0: 290, s: ZS, ground: { dig: DIG, bush: [540, 338, 584, 361], stoneA: STONES.stoneA, stoneB: STONES.stoneB } },
  mdawn: { svg: 'me_dawn.svg', x0: 268, ground: Object.assign({ dig: DIG, bush: [540, 338, 584, 361] }, STONES) },
  fday: { svg: 'visit.svg', x0: 268, ground: Object.assign({ dig: DIG, barrel: [538, 305, 624, 382] }, STONES) },
  fpatch: { svg: 'visit.svg', x0: 40, ground: { patch: [10, 437, 214, 585] } },
  fnight: { svg: 'friend_night.svg', x0: 268, ground: Object.assign({ dig: DIG, barrel: [538, 305, 624, 382] }, STONES) }
};
if (RN) for (const s of Object.values(SCN)) s.x0 -= RNX / (s.s || SCALE);
// ONLY=cover: the cover, its own design (not a frame of the Reel): Noodle's yard at dawn, shot close (the washing above the frame), the
// headline card, the real share picture tilted and half under a "?" flap (a peek: the payoff stays in the Reel), Noodle big and happy on the grass,
// the logo on its own card. English: sleepover-cover.jpg (1080 x 1920); REDNOTE=1: brand/rednote/rednote-26-sleepover.jpg, its y 240..1680 (3:4),
// the share picture cut above its chip in both (zh: the zh capture's picture). Everything inside x 40..1040, y 250..1670 (the 3:4 grid crop keeps 240..1680).
const COVER = process.env.ONLY === 'cover';
const CV = RN ? { head: '面条第一次去好友家过夜', sub: '猜猜它带回了什么？' } : { head: "Noodle's first sleepover", sub: 'and what came home with him' };
if (COVER) SCN.cnight = { svg: 'me_dawn.svg', x0: 270, y0: 290, s: ZS, ground: { dig: DIG, barrel: [538, 305, 624, 382], stoneA: STONES.stoneA, stoneB: STONES.stoneB } };
const HANG = { pole: [572, 145, 605, 341], shirtBlue: [285, 226, 335, 275], sockRed: [361, 236, 383, 279], sockYellow: [392, 238, 415, 282], towel: [433, 241, 486, 280], shirtPink: [509, 224, 559, 275] };

// ---- the beats: each card stays up for its spoken line + 0.4 s, then a 0.15 s pause (owner, 13 Nov 2026: fast) ----
const PAUSE = 0.15, BEATS = []; let at = 0.1;
const beat = (o) => { o.at = at; o.hold = VOD[o.k] + 0.4; BEATS.push(o); at += o.hold + PAUSE; return o; };
if (!RN) {
beat({ k: 'hook', scn: 'mzoom', title: "Noodle's first sleepover!", lines: ["You won't guess what", 'came home with him.'] });
beat({ k: 'visit', scn: 'fday' });
beat({ k: 'sleep', scn: 'fday', title: 'Sleepover', lines: ['Noodle packed a toothbrush.', 'See you in the morning!'] });
beat({ k: 'night', scn: 'fnight', title: 'A sleepover guest!', lines: ['Honey and Noodle', 'play together. +1 Bond.'] });
beat({ k: 'morning', scn: 'mzoom', title: 'Home by breakfast, of course.', lines: ['A new page in the diary,', 'and a crayon picture!'] });
beat({ k: 'letter', scn: 'mdawn', title: 'Fluffy Button helped out!', lines: ["Filled Honey's bowl, watered", "the garden and made Honey's", 'wish come true.'] });
beat({ k: 'thanks', scn: 'mdawn', lines: ['No chat, no messages.', 'Just dogs helping dogs.'] });
beat({ k: 'ask', scn: 'fnight', lines: ['Tag the friend your dog', 'would sleep over with 👇'] });
} else { // the game's zh words where it has them (hp.sleep_btn, hp.sleep_sent, hp.g_title, hp.g_pet_ok, hp.d_back, hp.home_toast, nw.v233.sleep, hp.l_title, hp.l_text)
beat({ k: 'hook', scn: 'mzoom', title: '面条第一次去好友家过夜！', lines: ['猜猜它带回了什么？'] });
beat({ k: 'visit', scn: 'fday' });
beat({ k: 'sleep', scn: 'fday', title: '去过夜', lines: ['Noodle带上了牙刷。', '明早见！'] });
beat({ k: 'night', scn: 'fnight', title: '来过夜的小客人！', lines: ['Honey和Noodle一起玩。', '+1亲密度。'] });
beat({ k: 'morning', scn: 'mzoom', title: '当然啦，早饭前就回家了。', lines: ['日记里多了一页，', '还有一幅画！'] });
beat({ k: 'letter', scn: 'mdawn', title: '毛茸茸纽扣来帮忙啦！', lines: ['给Honey的碗添满了饭、', '给菜园浇了水和', '帮Honey实现了心愿。'] });
beat({ k: 'thanks', scn: 'mdawn', lines: ['不聊天，不发消息，', '只有狗狗帮狗狗。'] });
beat({ k: 'ask', scn: 'fnight', lines: ['你家狗狗想去谁家过夜？', '评论区告诉我👇'] });
}
const LOOP = at - PAUSE + 0.1, T = LOOP + 2.5, NF = Math.round(T * FPS);
// the visit in three quick shots (one line of voice): the bowl, the garden, the wish
const VB = BEATS[1], VSUB = RN ? [[0, 1.75, 'fday', '给Honey的碗添满饭'], [1.75, 3.2, 'fpatch', '给菜园浇水'], [3.2, 99, 'fday', '帮Honey实现心愿']]
  : [[0, 1.75, 'fday', "Fill Honey's bowl"], [1.75, 3.2, 'fpatch', 'Water the garden'], [3.2, 99, 'fday', "Make Honey's wish come true"]];
// the other words on screen: the game's own (en or zh-Hans)
const TX = RN ? { help: '帮帮忙', wish: '今天的小心愿：玩一局球', done: '心愿实现啦！', tag: '毛茸茸纽扣家的Noodle', thanks: '道谢', pawT: '阳光饼干留下的爪印', pawL: '谢谢你来帮忙！' }
  : { help: 'Help out', wish: 'Today I wish for a game of ball', done: 'Wish come true!', tag: 'Noodle, from Fluffy Button', thanks: 'Say thanks', pawT: 'A paw print from Sunny Biscuit', pawL: 'Thank you for helping!' };
if (RN) { const L = Z0(F.letters.find((l) => /^hp_help_/.test(l.id)).text); for (const x of BEATS[5].lines) if (!L.includes(x.replace(/、$/, ''))) throw new Error('the zh letter line is not the game\'s: ' + x); }
// RedNote subtitles: the voice's line in parts of at most 14 characters (end punctuation not counted), each as long as its share of the line
const SUBS_ZH = { hook: ['面条第一次去好友家过夜！', '猜猜它带回了什么？'], visit: ['在阳光饼干家帮帮忙：', '添饭，浇水，', '帮狗狗实现心愿！'], sleep: ['再点去过夜，', '面条带上了牙刷！'],
  night: ['晚上它是好友家的小客人，', '挂着名牌。', '摸摸面条！'], morning: ['早饭前就回家啦，', '带回一页日记和一幅画！'], letter: ['阳光饼干收到一封信，', '就点了道谢。'],
  thanks: ['不聊天，不发消息，', '只有狗狗帮狗狗。'], ask: ['你家狗狗想去谁家过夜？', '评论区告诉我！'] };
const bare = (x) => x.replace(/[，。！？：、\s]/g, ''), SUBS = [];
const VOAT = BEATS.map((b) => ({ k: b.k, at: b.at }));
if (RN) for (const v of BEATS) { const parts = SUBS_ZH[v.k]; if (parts.join('') !== VOJ.text[v.k]) throw new Error('the subtitles differ from the voice: ' + v.k);
  const wt = parts.map((x) => bare(x).length + 1), sum = wt.reduce((a, c) => a + c, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum, s2 = x.replace(/[，。、：]$/, '');
    if ([...bare(s2)].length > 14) throw new Error('a subtitle over 14 characters: ' + s2);
    SUBS.push({ a: t0, b: t0 + d + (i === parts.length - 1 ? 0.35 : 0), s: s2 }); t0 += d; }); }
const allText = CV.head + ' ' + CV.sub + ' ' + BEATS.map((b) => [b.title || '', ...(b.lines || [])].join(' ')).join(' ') + VSUB.map((s) => s[3]).join(' ') + ' ' + Object.values(TX).join(' ') + ' ' + SUBS.map((x) => x.s).join(' ') + ' ? 0123456789';
if (/—|\bbreed(s|ing)?\b|\bsell|itch|%/i.test(allText + JSON.stringify(VOJSON))) throw new Error('a word the house rules ban');
// RedNote anti-ban (README RedNote rule, REDNOTE.md): no link, domain, handle, QR, other platform or app, off-platform word, post/story wording; checked
// on every word we show or say and on the captured game text the cut uses (toasts, the tag, the letters, the diary, the bubble, the strip, the share sheet)
const RN_BAN = /https?:|www\.|\.app|\.com|@|instagram|youtube|tiktok|itch|微信|朋友圈|QQ|微博|抖音|小红书|WhatsApp|链接|网址|官网|二维码|扫码|下载|私信我|加我|主页链接|戳|发帖|发到|发布到|快拍|帖子|tag/i, RN_BAN2 = /INS|\bins\b/;
if (RN) { const game = [F.helpToasts, F.sleepToasts, F.guestTag, F.petToasts, F.letters, F.thanksToasts, F.homeToasts, F.diary.lines, F.thxMail, F.visit.bubble, F.visitAfter.bubble, F.stripAria, F.stripLabel, F.share.title, F.visitBtns];
  const all = allText + JSON.stringify(VOJSON) + JSON.stringify(game); for (const re of [RN_BAN, RN_BAN2]) { const m = re.exec(all); if (m) throw new Error('a RedNote word on the ban list: ' + m[0]); } }
if (T < 24 || T > (RN ? 40 : 34)) throw new Error('the Reel is ' + T.toFixed(2) + ' s, not 24..' + (RN ? 40 : 34));
// the scene of the moment (and the visit's shot)
const scnAt = (t) => { let b = BEATS[0]; for (const x of BEATS) if (t >= x.at - 0.06) b = x; if (b === VB) { const u = t - VB.at; for (const s of VSUB) if (u >= s[0] - 0.06 && u < s[1] - 0.06) return s[2]; } return b.scn; };

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs id="defs">
${symArt('a_bowl0', ART.bowl0)}${symArt('a_bowl1', ART.bowl1)}${symArt('a_can', ART.can)}${symArt('a_ball', ART.ball)}
<filter id="blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="22"/></filter>
<clipPath id="picClip"><rect id="picClipR" x="0" y="0" width="10" height="10" rx="18"/></clipPath>
</defs>
${Object.keys(SCN).map((k) => `<image id="bg_${k}" width="${W}" height="${H}" href="__BG_${k}__" visibility="hidden"/>`).join('')}
<g id="scn"></g><g id="fg"${RN ? ` transform="translate(${RNX} 0)"` : ''}><g id="art"></g><g id="ov"></g></g><g id="sub"></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), RN=${RN}, F=RN?"'LXGW WenKai'":'Caveat', AF=RN?F:'Andika', CX=455, RNX=${RNX}, TX=${JSON.stringify(TX)}, SUBS=${JSON.stringify(SUBS)};
const BEATS=${JSON.stringify(BEATS)}, VSUB=${JSON.stringify(VSUB)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const CV=${JSON.stringify(CV)}, ZS=${ZS}, VB=BEATS[1], SCN=${JSON.stringify(SCN)}, HANG=${JSON.stringify(HANG)}, SY0=${SY0}, SCALE=${SCALE};
const IDX=${JSON.stringify(Object.fromEntries(Object.entries(DRAW).map(([k, d]) => [k, d.idx])))};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
let X0=268, S_=SCALE, Y0=SY0, sc0='';
const px=(u)=>(u-X0)*S_, py=(u)=>(u-Y0)*S_;
const box=(b)=>({l:px(b[0]), t:py(b[1]), r:px(b[2]), b:py(b[3])});
const inFrame=(k)=>{ const c={l:Math.max(0,k.l),t:Math.max(0,k.t),r:Math.min(${W},k.r),b:Math.min(${H},k.b)}; return c.r>c.l&&c.b>c.t?c:null; };
const gap=(r,k)=>Math.max(k.l-r.right, r.left-k.r, k.t-r.bottom, r.top-k.b);
// ---- the game's drawings: each captured SVG split into its ground shadow and its three keyframes (a symbol each), measured once ----
const DR={};
function initDrawings(DRAW){ const defs=$('defs'), P=new DOMParser();
  for(const [k,d] of Object.entries(DRAW)){ const doc=P.parseFromString(d.svg,'image/svg+xml'), root=doc.documentElement, outer=root.firstElementChild;
    const frames=[...outer.children].filter((e)=>/\\bpa-d-f\\d\\b/.test(e.getAttribute('class')||'')), shadow=[...outer.children].filter((e)=>!frames.includes(e));
    if(frames.length!==3) throw new Error(k+' has '+frames.length+' keyframes');
    const tr=outer.getAttribute('transform'), wrap=(s)=>tr?'<g transform="'+tr+'">'+s+'</g>':s, ser=(e)=>new XMLSerializer().serializeToString(e);
    const mk=(id,s)=>{ const sy=document.createElementNS(NSV,'symbol'); sy.setAttribute('id',id); sy.setAttribute('overflow','visible'); sy.innerHTML=s; defs.appendChild(sy); };
    mk('sh_'+k, wrap(shadow.map(ser).join('')));
    frames.forEach((e,i)=>{ const c=e.cloneNode(true); c.removeAttribute('style'); c.setAttribute('class',(c.getAttribute('class')||'').replace(/\\bpa-d-f\\d\\b/,'')); mk('fr_'+k+'_'+i, wrap(ser(c))); });
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(let i=0;i<3;i++){ const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#fr_'+k+'_'+i); $('art').appendChild(u); const b=u.getBBox(); u.remove(); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height); }
    DR[k]={x0,y0,x1,y1}; }
  return Object.fromEntries(Object.entries(DR).map(([k,b])=>[k,[b.x0,b.y0,b.x1,b.y1].map(Math.round).join(',')])); }
const kf=(k,t,s)=>IDX[k][((Math.floor((t-s)*30+1e-3)%30)+30)%30];
// a dog: drawing k at the keyframe of the moment, its box's left edge (or centre) placed, its feet (art y 186) on y = feet, scale z; it breathes and
// sways a little all the time (the sway at half the breath's rate, pi/8 out of step, so no two frames are alike)
function dogG(tag, k, i, cx, feet, z, o){ o=o||{}; const d=DR[k], ax=(d.x0+d.x1)/2, tx=cx-ax*z, ty=feet-186*z+(o.dy||0), NT=o.nt||0;
  const br=1+0.02*Math.sin(NT*5.2), sw=1.4*Math.sin(NT*2.6+Math.PI/8), pop=o.pop||1;
  const lean='translate('+f2(cx)+' '+f2(feet)+') rotate('+f2(sw)+') scale('+f2((2-br)*pop)+' '+(br*pop).toFixed(4)+') translate('+f2(-cx)+' '+f2(-feet)+')';
  return '<g data-apart="'+tag+'" data-dog="1" data-feet="'+f2(feet)+'" opacity="'+f2(o.op==null?1:o.op)+'"><g transform="'+lean+'"><g transform="translate('+f2(tx)+' '+f2(ty)+') scale('+z.toFixed(4)+')"><use href="#sh_'+k+'"/><use href="#fr_'+k+'_'+i+'"/></g></g></g>'; }
function fitS(s,max,w,fam){ let z=max; while(z>20){ const k=inkOf(s,z,fam||F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional red title, lines (sub: smaller italic-free grey lines); the text block centred in the card
function card(b, top, op, tag){ const W0=790, x0=CX-W0/2, L=[], big=b.big;
  if(b.title) L.push({s:b.title, size:fitS(b.title,big?84:72,W0-90), fill:'${RED}', pitch:big?84:74});
  (b.lines||[]).forEach((s)=>L.push({s, size:fitS(s, big?84:62, W0-90), pitch: big?86:64}));
  (b.sub||[]).forEach((s)=>L.push({s, size:fitS(s, 54, W0-120), fill:'#8A7468', pitch:58}));
  const hh=Math.max(RN&&sc0==='fpatch'?0:262, L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(big?84:66)); // 262 at least: every card hides the sky's sparkle (scene 470, 190) whole
  return { h: hh, svg: '<g data-box data-apart="'+(tag||'card')+'" data-over="1" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+centred(L, CX, top+hh/2, F).svg+'</g>' }; }
// a game-button pill (the game's yellow "yes" button look) and the guest's name tag chip
function btnPill(s, cx, cy, op, k, tag, sz){ const size=sz||56, ink=inkOf(s,size,AF), w=ink.L+ink.R+70, h=Math.round(size*1.7), sc=k||1;
  return '<g data-box data-apart="'+tag+'" data-over="1" opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(sc)+') translate('+f2(-cx)+' '+f2(-cy)+')"><rect x="'+f2(cx-w/2)+'" y="'+f2(cy-h/2)+'" width="'+f2(w)+'" height="'+h+'" rx="26" fill="#FFE7A3" stroke="${PEN}" stroke-width="6"/>'+centred([{s,size}],cx,cy,AF).svg+'</g>'; }
function tagChip(s, cx, cy, op){ const size=32, ink=inkOf(s,size,AF), w=ink.L+ink.R+56, h=70;
  return '<g data-box data-apart="tag" data-over="1" opacity="'+f2(op)+'"><rect x="'+f2(cx-w/2)+'" y="'+f2(cy-h/2)+'" width="'+f2(w)+'" height="'+h+'" rx="18" fill="#FFF6DD" stroke="${PEN}" stroke-width="5"/>'+centred([{s,size}],cx,cy,AF).svg+'</g>'; }
// the mailbox card: the game's own mailbox (the yard's drawing) on the left, the letter's words in their own box on the right
function mailCard(title, lines, top, op){ const W0=790, x0=CX-W0/2, bx=x0+170, bw=W0-170-22;
  const L=[{s:title, size:fitS(title,60,bw-50), fill:'${RED}', pitch:62}].concat(lines.map((s)=>({s, size:fitS(s,46,bw-50), pitch:50})));
  const th=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+56, h=Math.max(262, th+20);
  return { h, svg: '<g data-apart="card" data-over="1" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(h)+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'
    +'<use href="#a_mail" x="'+(x0+22)+'" y="'+f2(top+(h-190)/2)+'" width="136" height="190"/>'
    +'<g data-box><rect x="'+bx+'" y="'+(top+20)+'" width="'+bw+'" height="'+f2(h-40)+'" rx="22" fill="#FFF3DA" stroke="#E2C9A0" stroke-width="3"/>'+centred(L, bx+bw/2, top+h/2, F).svg+'</g></g>' }; }
function heart(x,y,s,op){ return '<path data-fx="1" opacity="'+f2(op)+'" transform="translate('+f2(x)+' '+f2(y)+') scale('+f2(s)+')" d="M0 6C-6-4-18 0-14 10C-11 17-2 21 0 25C2 21 11 17 14 10C18 0 6-4 0 6Z" fill="#F48FB1" stroke="${PEN}" stroke-width="2.6" stroke-linejoin="round"/>'; }
// a picture card: the game's PNG in a cream frame (the payoff), or covered (the hook: blurred, with a big red "?" sticker)
function picCard(cx, top, w, op, k, rot, covered){ const PH=RN?1254:1350, h=w*PH/1080, x=cx-w/2, pad=14; // RedNote: the picture cut just above its chip (y 1261)
  return '<g data-apart="pic" data-safe data-cover="1" opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(top+h/2)+') rotate('+f2(rot)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-top-h/2)+')">'
    +'<rect x="'+f2(x-pad)+'" y="'+f2(top-pad)+'" width="'+f2(w+2*pad)+'" height="'+f2(h+2*pad)+'" rx="26" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'
    +'<svg x="'+f2(x)+'" y="'+f2(top)+'" width="'+f2(w)+'" height="'+f2(h)+'" viewBox="0 0 1080 '+PH+'"><image width="1080" height="'+PH+'" preserveAspectRatio="xMidYMin slice" href="__PIC__"'+(covered?' filter="url(#blur)"':'')+'/></svg>'
    +(covered?'<g data-box><circle cx="'+f2(cx)+'" cy="'+f2(top+h/2)+'" r="92" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+centred([{s:'?',size:150,fill:'${RED}'}],cx,top+h/2,F).svg+'</g>':'')+'</g>'; }
// ---- the layout (px; Noodle as in the visitor Reel: his standing box from x 80, feet on y 1412, scale 2.6) ----
const CARD_TOP=276, NFEET=1412, NZ=2.6, NX=80, HFEET=1095;
let NCX=0, HZ=0;
function layout(){ const nb=DR.noodle_idle_right; NCX=NX+(nb.x1-nb.x0)*NZ/2;
  // Honey behind Noodle, on the grass in front of the fence: 330 px wide at most, her top (and her jump) 34 px under the washing
  let x0=1e9,y0=1e9,x1=-1e9; for(const p of ['idle','happy','jump','sit']){ const b=DR['honey_'+p+'_left']; x0=Math.min(x0,b.x0); y0=Math.min(y0,b.y0); x1=Math.max(x1,b.x1); }
  const wb=py(282); HZ=Math.min(2.2, 330/(x1-x0), (HFEET-wb-34)/((186-y0)*1.05)); return {NCX, HZ}; }
const HCX=712, TAGX=310, TAGY=1060;
// ---- the props in scene units (drawn in a group scaled to the window) ----
function sceneG(inner){ return '<g transform="scale('+S_+') translate('+(-X0)+' '+(-Y0)+')">'+inner+'</g>'; }
function frame(t){
  let scn_='', a='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let bi=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) bi=j;
  const b=BEATS[bi], lt=t-b.at;
  let sc=b.scn, sub=null, st=lt; if(b.k==='visit'){ for(const s of VSUB) if(lt>=s[0]-0.06&&lt<s[1]-0.06){ sub=s; sc=s[2]; st=lt-s[0]; } }
  for(const k of Object.keys(SCN)) $('bg_'+k).setAttribute('visibility', k===sc?'visible':'hidden');
  sc0=sc; X0=SCN[sc].x0; S_=SCN[sc].s||SCALE; Y0=SCN[sc].y0==null?SY0:SCN[sc].y0;
  const u=bi===0?1:cl((lt+0.06)/0.3), cop=fade*(bi===0?1:sm(u*3));
  const N=(pose,face,s,o)=>{ const k='noodle_'+pose+'_'+face; return dogG('Noodle',k,kf(k,t,s),NCX,NFEET,NZ,Object.assign({nt:t},o||{})); };
  const Hn=(pose,face,s,o)=>{ const k='honey_'+pose+'_'+face; return dogG('Honey',k,kf(k,t,s),HCX,HFEET,HZ,Object.assign({nt:t*1.07+0.9},o||{})); };
  if(fade>0){
    if(b.k==='hook'){
      a+=N('idle','right',b.at);
      ov+=card({title:b.title, lines:b.lines}, CARD_TOP, 1).svg;
      const k=0.96+0.04*Math.sin(t*2.2); ov+=picCard(CX, 700, 330, 1, k, -4+0.8*Math.sin(t*1.7), true);
    } else if(b.k==='visit'){
      if(sc==='fday'){
        // the bowl beside Honey (the game's own bowl, a 0.72 size as the visit allows; HP_SCALES); full once the kibble lands
        const full=sub[0]===0?st>=0.75:true, bk=full?'a_bowl1':'a_bowl0', bu=[296, 328, 49, 49];
        const popB=sub[0]===0&&st>=0.75?1+0.12*Math.sin(Math.PI*cl((st-0.75)/0.3)):1, bcx=bu[0]+bu[2]/2, bcy=bu[1]+bu[3];
        scn_+='<g data-apart="bowl" data-prop="1" transform="translate('+f2(bcx)+' '+f2(bcy)+') scale('+f2(popB)+') translate('+f2(-bcx)+' '+f2(-bcy)+')"><use href="#'+bk+'" x="'+bu[0]+'" y="'+bu[1]+'" width="'+bu[2]+'" height="'+bu[3]+'"/></g>';
        if(sub[0]===0&&st>=0.35&&st<0.8) for(let j=0;j<3;j++){ const q=cl((st-0.35-j*0.08)/0.35); if(q<=0||q>=1) continue; scn_+='<circle data-fx="1" cx="'+f2(bcx-8+j*8)+'" cy="'+f2(bu[1]-26+30*q*q)+'" r="2.6" fill="#B9773B" stroke="${PEN}" stroke-width="0.8"/>'; }
        const wish=sub[0]>0, bt=st-0.35, jumpT=st-0.95;
        let hp='idle', hs=VB.at+sub[0]; if(wish&&jumpT>=0&&jumpT<0.5){ hp='jump'; hs=VB.at+sub[0]+0.95; } else if(wish&&jumpT>=0.5){ hp='happy'; hs=VB.at+sub[0]+1.45; } else if(!wish&&st>=0.75){ hp='happy'; hs=VB.at+0.75; }
        a+=Hn(hp,'left',hs);
        a+=N(wish&&bt>=0&&bt<0.6?'happy':'idle','right',VB.at+sub[0]);
        // the Tennis Ball: from Noodle to Honey (0.6 s), then on the grass under her nose
        if(wish&&bt>=0){ const q=cl(bt/0.6), x0=NCX, y0=1090, x1=430, y1=1060, x=x0+(x1-x0)*q, y=y0+(y1-y0)*q-180*Math.sin(Math.PI*q);
          a+='<g data-apart="ball"><use href="#a_ball" x="'+f2(x-26)+'" y="'+f2(y-26)+'" width="52" height="52"/></g>'; }
        const done=wish&&bt>=0.6;
        ov+=card({title:TX.help, lines:[sub[3]], sub:wish?[done?TX.done:TX.wish]:null}, CARD_TOP, cop).svg;
      } else {
        // the garden: the game's watering can on the veggie patch's top edge (HP_CAN, mirrored: its spout over the patch) tilts and pours
        const tilt=(-24+3*Math.sin(st*7.5))*sm(st/0.3)*(1-sm((st-1.2)/0.2))-1.5*Math.sin(st*4.1), cx=178, cy=444; // it keeps a gentle wobble, so no frame is a copy
        scn_+='<g data-apart="can" data-prop="1"><g transform="rotate('+f2(tilt)+' '+cx+' '+cy+')"><g transform="translate(356 0) scale(-1 1)"><use href="#a_can" x="150" y="388" width="56" height="56"/></g></g></g>';
        for(let j=0;j<4;j++){ const q=((st-0.3)/0.5+j*0.25)%1; if(st<0.3+j*0.12||st>1.25) continue; scn_+='<ellipse data-fx="1" cx="'+f2(148-j*5)+'" cy="'+f2(412+38*q)+'" rx="2.8" ry="4.4" fill="#8EC9F0" stroke="#4A7FA8" stroke-width="0.7"/>'; }
        ov+=card({title:TX.help, lines:[sub[3]]}, CARD_TOP, cop).svg;
      }
    } else if(b.k==='sleep'){
      a+=Hn('happy','left',b.at);
      a+=N(lt>=0.3?'happy':'idle','right',lt>=0.3?b.at+0.3:b.at);
      ov+=card({title:b.title, lines:b.lines}, CARD_TOP, cop).svg;
    } else if(b.k==='night'||b.k==='ask'){
      const pet=b.k==='night'&&lt>=1.3;
      a+=Hn(pet||b.k==='ask'?'happy':'idle','left',b.at+(pet?1.3:0));
      a+=N(b.k==='ask'?'happy':'sit','right',b.at);
      if(b.k==='night'){ ov+=tagChip(TX.tag, TAGX, TAGY, sm((lt+0.06)/0.25));
        if(pet) for(let j=0;j<3;j++){ const q=cl((lt-1.3-j*0.25)/1.2); if(q<=0||q>=1) continue; a+=heart(560+j*46, 1000-160*q, 1.6, sm(q*4)*(1-sm((q-0.7)/0.3))); } }
      ov+=card({title:b.title, lines:b.lines, big:b.k==='ask'}, CARD_TOP, cop).svg;
    } else if(b.k==='morning'){
      a+=N(lt>=1.5?'happy':'idle','right',lt>=1.5?b.at+1.5:b.at);
      const pu=lt-1.5;
      if(pu<0) ov+=card({title:b.title, lines:b.lines}, CARD_TOP, cop).svg;
      else { const op=sm(pu/0.2), k=0.9+0.1*sm(pu/0.3); ov+=picCard(CX, 284, RN?700:646, op, k, 0, false); } // the payoff, big: 646 x 808, on grass and fence boards
    } else if(b.k==='letter'||b.k==='thanks'){
      a+=N(b.k==='thanks'||lt>=2.3?'happy':'sit','right',b.k==='thanks'?b.at:(lt>=2.3?b.at+2.3:b.at));
      if(b.k==='letter'){
        if(lt<2.3){ const c=mailCard(b.title, b.lines, CARD_TOP, cop); ov+=c.svg;
          const press=lt>=1.8?1-0.08*Math.sin(Math.PI*cl((lt-1.8)/0.3)):1; ov+=btnPill(TX.thanks, CX, 900, sm((lt-0.5)/0.2), press, 'thx'); }
        else { const q=lt-2.3; ov+=mailCard(TX.pawT, [TX.pawL], CARD_TOP, sm(q/0.2)).svg; }
      } else ov+=card({lines:b.lines, big:true}, CARD_TOP, cop).svg;
    }
    if(scn_) scn_=sceneG(scn_);
  }
  let sb=''; if(RN&&fade>0){ const su=SUBS.find((x)=>t>=x.a&&t<x.b); if(su){ const o=Math.min(sm((t-su.a)/0.08),sm((su.b-t)/0.08)), sy=sc==='fpatch'?900:1560;
    sb=pill(su.s, 540, sy, fitS(su.s,56,900), F, { fill:'${CREAM}', padX:30, op:fade*o }).replace('<g data-box','<g data-box data-apart="sub" data-over="1"'); } }
  $('sub').innerHTML=sb;
  let ecRN=''; if(RN&&end){ ecRN='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCardRN('tall',LOGO_INNER,{play:'搜 Doodle Doggo App'})+'</g>'; }
  let ec=''; if(end&&!RN){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'; }
  $('scn').innerHTML=scn_; $('art').innerHTML=a; $('ov').innerHTML=ov; $('ec').innerHTML=RN?ecRN:ec;
  if(RN&&end){ const g=$('ec').querySelector('.endcard'), bb=g.getBBox(); g.setAttribute('transform','translate('+f2(540-(bb.x+bb.width/2))+' '+f2(960-(bb.y+bb.height/2))+')');
    const r=g.getBoundingClientRect(); if(r.left<50||r.right>1030||r.top<40||r.bottom>1880||Math.abs((r.left+r.right)/2-540)>2||Math.abs((r.top+r.bottom)/2-960)>2) return 'the RedNote end card is not centred at (540, 960)'; }
  // ---- the checks ----
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  if(!RN){ const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; '); }
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  if(fade>0){ const G=SCN[sc].ground;
    for(const e of $('st').querySelectorAll('#art [data-apart], #scn [data-apart], #ov [data-apart], #sub [data-apart]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect(), n=e.getAttribute('data-apart'); if(!r.width) continue;
      if(e.hasAttribute('data-feet')&&+e.getAttribute('data-feet')/S_+Y0<340) return n+' stands above the floor';
      if(!e.hasAttribute('data-prop')) for(const [nm,bx] of Object.entries(G)){ const k=inFrame(box(bx)); if(!k) continue; const g=gap(r,k); if(g<28) return n+' too close to the scene\\'s '+nm+' ('+Math.round(g)+' px)'; }
      if(RN||sc!=='fpatch') for(const [nm,bx] of Object.entries(HANG)){ const k=inFrame(box(bx)); if(!k) continue; const g=gap(r,k); if(g<28) return n+' on the washing: '+nm+' ('+Math.round(g)+' px)'; }
      if(RN){ if(r.left<50||r.right>1030||r.top<40||r.bottom>1880) return 'in the margin: '+n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); continue; }
      if(r.right>854||r.left<56||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); } }
  return ''; }
window.frame=frame;
window.cover=function(){ $('fg').removeAttribute('transform'); for(const k of Object.keys(SCN)) $('bg_'+k).setAttribute('visibility', k==='cnight'?'visible':'hidden');
  sc0='cnight'; X0=SCN.cnight.x0; S_=SCN.cnight.s; Y0=SCN.cnight.y0; $('ec').innerHTML=''; $('sub').innerHTML=''; $('scn').innerHTML='';
  let a='', o='';
  // the headline card
  const L=[{s:CV.head,size:fitS(CV.head,RN?92:104,820),fill:'${RED}',pitch:RN?96:100},{s:CV.sub,size:fitS(CV.sub,RN?58:62,800),fill:'${PEN}'}];
  const k0=inkOf(L[0].s,L[0].size,F), k1=inkOf(L[1].s,L[1].size,F), hh=k0.A+L[0].pitch+k1.D+70;
  o+='<g data-box data-apart="title"><rect x="85" y="282" width="910" height="'+f2(hh)+'" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'+centred(L,540,282+hh/2,F).svg+'</g>';
  // the share picture, tilted, its right half under a cream paper flap with a big red "?"
  const PH=1254, w=500, h=w*PH/1080, cx=540, top=282+hh+80, x=cx-w/2, pad=16, fx=x+w*0.5;
  o+='<g data-apart="pic" transform="rotate(-5 '+cx+' '+f2(top+h/2)+')"><rect x="'+f2(x-pad)+'" y="'+f2(top-pad)+'" width="'+f2(w+2*pad)+'" height="'+f2(h+2*pad)+'" rx="26" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'
    +'<svg x="'+f2(x)+'" y="'+f2(top)+'" width="'+f2(w)+'" height="'+f2(h)+'" viewBox="0 0 1080 '+PH+'"><image width="1080" height="'+PH+'" preserveAspectRatio="xMidYMin slice" href="__PIC__"/></svg>'
    +'<path d="M'+f2(fx)+' '+f2(top-pad)+'L'+f2(x+w+pad)+' '+f2(top-pad)+'L'+f2(x+w+pad)+' '+f2(top+h+pad-70)+'L'+f2(x+w+pad-70)+' '+f2(top+h+pad)+'L'+f2(fx-30)+' '+f2(top+h+pad)+'Z" fill="#FFF3DA" stroke="${PEN}" stroke-width="6" stroke-linejoin="round"/>'
    +'<path d="M'+f2(x+w+pad)+' '+f2(top+h+pad-70)+'L'+f2(x+w+pad-62)+' '+f2(top+h+pad-62)+'L'+f2(x+w+pad-70)+' '+f2(top+h+pad)+'Z" fill="#E9D3AE" stroke="${PEN}" stroke-width="5" stroke-linejoin="round"/>'
    +'<g data-box><circle cx="'+f2(fx+w*0.27)+'" cy="'+f2(top+h*0.48)+'" r="96" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+centred([{s:'?',size:156,fill:'${RED}'}],fx+w*0.27,top+h*0.48,F).svg+'</g></g>';
  // Noodle, big and happy on the night grass; the logo on its own card beside him
  a+=dogG('Noodle','noodle_happy_right',0,NCX+20,1596,NZ,{nt:0.9});
  const lw=270, lh=lw*280/900; o+='<g data-apart="logo"><rect x="'+(1010-lw-28)+'" y="1528" width="'+(lw+28)+'" height="'+f2(lh+24)+'" rx="24" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg x="'+(1010-lw-14)+'" y="1540" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  $('art').innerHTML=a; $('ov').innerHTML=o;
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'cover too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  const props=Object.assign({},SCN.cnight.ground,HANG);
  for(const e of $('st').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(), n=e.getAttribute('data-apart');
    if(e.hasAttribute('data-feet')&&+e.getAttribute('data-feet')/S_+Y0<340) return 'cover: '+n+' stands above the floor';
    for(const [nm,bx] of Object.entries(props)){ const k=inFrame(box(bx)); if(!k) continue; const g=gap(r,k); if(g<28) return 'cover: '+n+' on the scene prop '+nm+' ('+Math.round(g)+' px)'; }
    if(r.left<40||r.right>1040||r.top<250||r.bottom>1670) return 'cover: outside x 40..1040, y 250..1670: '+n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; };
window.init=function(DRAW, MAIL){ const g=new DOMParser().parseFromString(MAIL,'image/svg+xml').querySelector('[data-prop="mailbox"]'); if(!g) throw new Error('no mailbox in the yard grab');
  const sy=document.createElementNS(NSV,'symbol'); sy.setAttribute('id','a_mail'); sy.setAttribute('viewBox','172 246 78 108'); sy.setAttribute('overflow','visible'); sy.innerHTML=new XMLSerializer().serializeToString(g); $('defs').appendChild(sy);
  const m=initDrawings(DRAW); const l=layout(); return {boxes:m, l}; };
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  // the scenes: each window rendered once as a JPEG
  let page = html;
  for (const [k, s] of Object.entries(SCN)) {
    const f = path.join(WORK, 'bg_' + k + '.jpg');
    if (!fs.existsSync(f) || process.env.BG) {
      let svg = fs.readFileSync(path.join(CAPS, s.svg), 'utf8'); if (!/class="world/.test(svg)) throw new Error('no grab ' + s.svg);
      svg = svg.replace(/^<svg[^>]*>/, (m) => m.replace(/viewBox="[^"]*"/, `viewBox="${s.x0} ${s.y0 == null ? SY0 : s.y0} ${W / (s.s || SCALE)} ${H / (s.s || SCALE)}"`).replace(/ (width|height|style|preserveAspectRatio)="[^"]*"/g, '').replace('<svg', `<svg width="${W}" height="${H}"`));
      await p.setContent(`<html><body style="margin:0"><style>[class$="-hl"]{display:none}</style>${svg}</body></html>`); await p.waitForTimeout(300);
      await p.screenshot({ path: f, type: 'jpeg', quality: 93 });
    }
    page = page.replace(`__BG_${k}__`, 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64'));
  }
  page = page.split('__PIC__').join('data:image/png;base64,' + fs.readFileSync(path.join(CAPS, 'share_pic.png')).toString('base64'));
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, page);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', txt + ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  if (RN) { const zt = allText + '治愈系蜡笔狗狗游戏搜 Doodle Doggo App'; await p.evaluate((txt) => document.fonts.load('700 40px "LXGW WenKai"', txt), zt);
    if (!(await p.evaluate((txt) => document.fonts.check('700 40px "LXGW WenKai"', txt.replace(/[\u{1F300}-\u{1FAFF}]/gu, '')), zt))) throw new Error('LXGW WenKai did not load'); }
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  const lay = await p.evaluate(([D, M]) => window.init(D, M), [DRAW, fs.readFileSync(path.join(CAPS, 'me_dawn.svg'), 'utf8')]);
  console.log('layout', JSON.stringify(lay.l), '| Noodle idle', lay.boxes.noodle_idle_right, '| Honey idle', lay.boxes.honey_idle_left);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; beats at', BEATS.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + v.hold.toFixed(2) + ')').join(', '));
  const render = async (t, file) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) { if (process.env.LOOSE) console.log('CHECK', t.toFixed(2), err.slice(0, 400)); else throw new Error(err + ' at ' + t.toFixed(2)); } if (file) for (let k = 0; ; k++) { try { await p.screenshot({ path: file }); break; } catch (e) { if (k >= 4) throw e; console.log('screenshot retry', k + 1, t.toFixed(3)); await p.waitForTimeout(500); } } }; // RedNote: the browser now and then refuses a capture ("Unable to capture screenshot"); the same frame again works
  // Noodle's size, standing: 550..700 px wide (owner)
  { await render(1.0); const w = await p.evaluate(() => { const e = document.querySelector('[data-apart="Noodle"] use[href^="#fr_"]'); return e.getBoundingClientRect().width; }); console.log('Noodle standing', Math.round(w), 'px wide'); if (w < 550 || w > 700) throw new Error('Noodle is ' + Math.round(w) + ' px wide standing'); }
  if (COVER) { const err = await p.evaluate(() => window.cover()); if (err) throw new Error(err);
    const file = RN ? path.join(ROOT, 'brand', 'rednote', 'rednote-26-sleepover.jpg') : path.join(OUT, 'sleepover-cover.jpg');
    await p.screenshot({ path: file, type: 'jpeg', quality: 92, ...(RN ? { clip: { x: 0, y: 240, width: W, height: 1440 } } : {}) }); console.log('wrote', file); await b.close(); return; }
  if (process.env.DUMP) { await p.evaluate((t) => window.frame(t), +process.env.DUMP); fs.writeFileSync(path.join(WORK, 'dump.html'), await p.content()); console.log('dumped'); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ...BEATS.flatMap((x) => [x.at + 0.5, x.at + x.hold * 0.9]).slice(1), VB.at + 1.0, VB.at + 2.4, VB.at + 4.2, BEATS[4].at + 2.5, BEATS[5].at + 1.9, BEATS[5].at + 3.0, BEATS[3].at + 2.0, LOOP + 0.15, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  if (process.env.CHECK) { for (let fi = 0; fi < NF; fi++) await render(fi / FPS + 1e-4); console.log('all', NF, 'frames pass the checks'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  // +1e-4: the 0.0001 frame-index nudge (fi/FPS can land a hair under a beat start); every frame's checks run in render()
  for (const fi of fr) { await render(fi / FPS + 1e-4, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  if (process.env.NOENC) { console.log('frames rendered, no encode (NOENC)'); return; } // FRAMES in chunks (the RedNote render: the browser crashed now and then)
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's yard music (day for the visit, night for the night, dawn for home), its discover sting on the way home, the pops and
  // the click (00_core.js SFX.pop, SFX.click), the voice on top (kept when FRAMES is set) ----
  const mixWav = path.join(WORK, 'mix.wav'), ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
    const ctx = (time) => ({ place: 'yard', time, weather: 'sunny' }), B = Object.fromEntries(BEATS.map((x) => [x.k, x.at]));
    const segs = [{ at: 0, ctx: ctx('day') }, { at: B.night - 0.05, ctx: ctx('night') }, { at: B.morning - 0.05, ctx: ctx('dawn') }, { at: B.ask - 0.05, ctx: ctx('night') }];
    const wav = await ap.evaluate(async ([s, segs, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 }, segments: segs, stingers: st })).wav, [T + 0.5, segs, [{ at: B.morning, name: 'discover' }]]);
    fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
    const EV = [['pop', VB.at + 0.75], ['pop', B.morning + 1.5], ['click', B.letter + 1.8], ['pop', B.letter + 2.3]];
    const fxb = await ap.evaluate(async ([T, EV]) => { const sr = 44100, ctx = new OfflineAudioContext(1, Math.ceil(T * sr), sr), master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
      function tone(at, type, f0, f1, dur, vol) { const t = at, osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(f0, t);
        if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur); osc.connect(g); g.connect(master); env(g, t, 0.01, vol, dur); osc.start(t); osc.stop(t + dur + 0.05); }
      for (const [n, t] of EV) { if (n === 'pop') tone(t, 'sine', 600, 1300, 0.08, 0.5); else tone(t, 'triangle', 700, 900, 0.06, 0.35); }
      const buf = await ctx.startRendering(), d = buf.getChannelData(0), out = new Int16Array(d.length); for (let i = 0; i < d.length; i++) out[i] = Math.max(-1, Math.min(1, d[i])) * 32767;
      const u8 = new Uint8Array(out.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }, [T, EV]);
    await ab.close();
    const fxRaw = path.join(WORK, 'fx.s16'), fx = path.join(WORK, 'fx.wav'); fs.writeFileSync(fxRaw, Buffer.from(fxb, 'base64'));
    ff(['-f', 's16le', '-ar', '44100', '-ac', '1', '-i', fxRaw, fx]);
    const voWav = path.join(WORK, 'voice.wav');
    ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
      + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
    const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, 'premix.wav');
    ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-10dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
    ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-sleepover-rednote.mp4' : 'doodle-doggo-sleepover.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  // ---- checkFrames on every run (../frozen_clock.js): no doubled frames; jumps only at the cuts (beats, the visit's three shots, the morning's
  // picture, the letter's paw print) ----
  const cutT = BEATS.map((x) => x.at).concat(VSUB.slice(1).map((s) => VB.at + s[0]), [LOOP]);
  const popT = [BEATS[4].at + 1.5, BEATS[5].at + 2.3]; // in-beat events: the share picture pops in, the paw print replaces the letter (0.2 s fades)
  const popF = new Set(popT.flatMap((t) => { const f = Math.ceil((t - 0.06) * FPS); return Array.from({ length: 15 }, (_, i) => f + i); }));
  const cuts = new Set(cutT.flatMap((t) => { const f = Math.ceil((t - 0.06) * FPS); return [f, f + 1, f + 2, f + 3]; })); // the cut and its card's 0.1 s fade-in
  const runs = cutT.slice().sort((x, y) => x - y).map((t, j, A) => [Math.max(0, Math.ceil((t - 0.06) * FPS) - 1), Math.min(NF - 1, Math.ceil(((A[j + 1] || T) - 0.06) * FPS) + 1)]);
  const rep = { runs: [] };
  for (const [a, z] of runs) { const c = checkFrames(mp4, a, z); rep.runs.push({ a, z, median: c.median, doubled: c.doubled, jumps: c.jumps, jumpsOffCut: c.jumps.filter((f) => !cuts.has(f) && !popF.has(f)), bigOffCut: c.diffs.filter((x) => x[1] > 2.5 && !cuts.has(x[0]) && !popF.has(x[0])) }); }
  fs.writeFileSync(path.join(WORK, 'checkframes.json'), JSON.stringify(rep, null, 1));
  for (const x of rep.runs) console.log('checkFrames', x.a + '-' + x.z, 'median', x.median, 'doubled', JSON.stringify(x.doubled), 'jumps', JSON.stringify(x.jumps), 'off a cut', JSON.stringify(x.jumpsOffCut), 'over 2.5 off a cut or pop', JSON.stringify(x.bigOffCut));
})().catch((e) => { console.error(e); process.exit(1); });
