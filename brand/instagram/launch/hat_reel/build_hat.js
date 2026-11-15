// "Pick a hat" Reel (15 Nov 2026; owner: "Can we have more hats"; shot table, item sources and rebuild: docs/marketing/HAT_REEL.md).
// Hook at frame 1: "Stop picking the cute hat. / Your dog wants number 3." over eight numbered cards, each with Noodle the dachshund (PawArt.dog
// 'dachs', main's art) wearing one of the game's head items (the game's own outfit art, outfit { head }), in a tidy 2 x 4 grid. "Pause now! Three,
// two, one." Then each number in turn: Noodle pops big in that hat, sitting on the floor of the game's own Bow-Wow Boutique scene (PawArt.scene
// 'boutique', autumn), with a card (number, the game's item art, the exact item name and the spoken deadpan line). The reveal: number 3, the
// Wizard Hat, in the Home Yard: Noodle hops with hearts; the game's own perk line ("Magic hands: petting gives +1 extra Bond.") is quoted, and it
// is true (game/src/03_yard.js adds 1 Bond when a pet bonds in the Wizard Hat). The ask ("Which number would you pick? Comment below!") over the
// grid, then our standard end card (brand/kids/endcard.js) for 2.5 s with the music fading.
// The hats are only head items that are live today, sold all year in the Boutique or found/earned by every player (checked below against main's
// game/src/00_core.js CLOTHES / TREASURES and game/src/24_missions.js): no festival, market, Christmas, Halloween, Kind shop or Bond 10 item.
// Every frame: centreCheck(), safeCheck(), apartCheck() (../centre_text.js) over Noodle, every card, badge, chip and grid card; Noodle stands on
// the scene's floor below the back row of props and clear of the props near the ground (keep-out boxes, as ../fail_reel/build_fail.js); words and
// key art inside x 60..850, y 270..1440. 1080 x 1920, 30 fps. Voice: Kokoro af_bella 1.1x (vo_hat.json via ../friends_reel/vo_friends.py).
// Music: the game's own music (mods/pawaudio.js: the shop, the yard at the reveal) about 11 dB under the voice, ticks, the "levelup" sting.
//
//   VO_LINES=brand/instagram/launch/hat_reel/vo_hat.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/hat_reel/build_hat.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,... for chosen times). ONLY=cover: hat-cover.jpg. FRAMES=a-b: re-render only frames a..b, then
//   encode again. DEBUG=1 draws the floor line, the back row and the keep-out boxes. CHECK=1 runs every frame's checks without rendering.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles, RN_FONT_CSS } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'hat_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C', YEL = '#FFE3A1', PINK = '#F28FA5';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
// REDNOTE=1 (owner, 15 Nov 2026, after approving the English cut: "create rednote version"): every word in Simplified Chinese (the hat names and the
// Wizard Hat perk are the game's own zh-Hans strings, checked below), Noodle's Mandarin voice (../friends_reel/vo_friends_zh.py with
// VO_LINES=hat_reel/vo_hat_zh.json, zf_073 1.0x), subtitles of at most 14 characters in a pill under the art, LXGW WenKai. No safe zone (a normal
// video): everything in front of the scene is moved 85 px right so it sits in the middle of the frame (x 540) with ~60 px margins; the centring,
// no-overlap, floor/prop and tile-margin checks stay. It ends on the RedNote card (brand/kids/endcard.js endCardRN: the logo, 治愈系蜡笔狗狗游戏 and only
// "搜 Doodle Doggo App"; no QR, link, domain or handles), centred at (540, 960). Output doodle-doggo-pick-a-hat-rednote.mp4; ONLY=cover writes
// brand/rednote/rednote-17-pick-a-hat.jpg (3:4, 1080 x 1440).
const RN = !!process.env.REDNOTE, VOFILE = RN ? 'vo_hat_zh.json' : 'vo_hat.json';
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, VOFILE), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from ' + VOFILE + ': ' + k);

// ---- the hats, checked against main: head items, live all year, for every player ----
const rd = (...p) => fs.readFileSync(path.join(ART_ROOT, ...p), 'utf8');
const CORE = rd('game', 'src', '00_core.js'), EN = JSON.parse(rd('game', 'i18n', 'en.json'));
const code = (file, re) => { if (!re.test(rd(...file.split('/')))) throw new Error(file + ' changed: ' + re); };
// how = where a player gets it: 'Boutique' (CLOTHES, price > 0, no fest/ks/fm/reward), 'walk' (a TREASURES wearable), 'missions' (the 7-stamp card)
function hatSource(n) {
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cl = new RegExp("\\{ n: '" + esc + "', slot: 'head'([^\\n]*)\\}").exec(CORE), tr = new RegExp("TR\\('" + esc + "', 'wearable', 'head', '[A-Za-z]+', \\[([^\\]]*)\\]").exec(CORE);
  if (cl) { const a = cl[1]; if (/fest:|ks:|fm:|ed:/.test(a)) throw new Error(n + ' is a festival, market or Kind shop item');
    if (/reward: true/.test(a)) { if (n !== 'Astronaut Helmet') throw new Error(n + ' is a reward item'); code('game/src/24_missions.js', /if \(!m\.rewards\.includes\('Astronaut Helmet'\)\) \{ kind = 'helmet';/); return { how: 'missions', note: 'the prize for a full missions stamp card (7 stamps)' }; }
    const pr = /price: (\d+), bond: (\d+)/.exec(a); if (!pr || +pr[1] <= 0) throw new Error(n + ' has no Boutique price'); return { how: 'Boutique', note: 'Bow-Wow Boutique, ' + pr[1] + ' coins, Bond ' + pr[2], perk: (/perk: (['"])(.*)\1/.exec(a) || [])[2] }; }
  if (tr) return { how: 'walk', note: 'a walk treasure (' + tr[1].replace(/'/g, '') + ')' };
  throw new Error(n + ' is not a head item on main');
}
// the eight, in order; #3 is Noodle's favourite. say: the spoken line (vo_hat.json), lines: the same words on the card
const HATS = [
  { n: 'Party Hat', k: 'h1', lines: ['It’s not his birthday.', 'He insists.'], expr: 'wink', tint: '#FBD3DF' },
  { n: 'Chef Hat', k: 'h2', lines: ['He cooks. Mostly', 'snacks for himself.'], expr: null, tint: '#F7E6C4' },
  { n: 'Wizard Hat', k: 'h3', lines: ['Ooh. Remember this one.'], expr: null, tint: '#E0D3F5' },
  { n: 'Cowboy Hat', k: 'h4', lines: ['Yeehaw. Then a nap.'], expr: 'dreamy', tint: '#F3D9BE' },
  { n: 'Astronaut Helmet', k: 'h5', lines: ['Small step for dog.'], expr: 'wow', tint: '#D3E6F6' },
  { n: 'Flower Crown', k: 'h6', lines: ['The cute one. He knows.'], expr: null, tint: '#DDEFCF' },
  { n: 'Acorn Cap', k: 'h7', lines: ['The squirrels have', 'questions.'], expr: null, tint: '#EADBC8' },
  { n: 'Sun Hat', k: 'h8', lines: ['Hot days?', 'Not his problem.'], expr: null, tint: '#FFF0B3' },
];
HATS.forEach((h) => { Object.assign(h, hatSource(h.n));
  if (!RN && h.lines.join(' ').replace(/’/g, "'") !== VOJ.text[h.k]) throw new Error('the card differs from the voice: ' + h.k); });
// RedNote: the game's own Chinese item names (game/i18n/zh-Hans.json) and the Wizard Hat's perk word for word
const ZH = JSON.parse(rd('game', 'i18n', 'zh-Hans.json'));
const ZKEY = { 'Party Hat': 'data.clothes.party_hat.n', 'Chef Hat': 'data.clothes.chef_hat.n', 'Wizard Hat': 'data.clothes.wizard_hat.n', 'Cowboy Hat': 'data.clothes.cowboy_hat.n',
  'Astronaut Helmet': 'data.clothes.astronaut_helmet.n', 'Flower Crown': 'data.clothes.flower_crown.n', 'Acorn Cap': 'data.treasures.acorn_cap.n', 'Sun Hat': 'data.treasures.sun_hat.n' };
const ZNAME = { 'Party Hat': '派对帽', 'Chef Hat': '厨师帽', 'Wizard Hat': '巫师帽', 'Cowboy Hat': '牛仔帽', 'Astronaut Helmet': '宇航员头盔', 'Flower Crown': '花环', 'Acorn Cap': '橡果帽', 'Sun Hat': '遮阳帽' };
for (const h of HATS) { if (EN[ZKEY[h.n]] !== h.n) throw new Error('en name key changed: ' + h.n); if (ZH[ZKEY[h.n]] !== ZNAME[h.n]) throw new Error('the zh-Hans name changed: ' + h.n + ' is ' + ZH[ZKEY[h.n]]); }
const ZPERK = '神奇的手：摸摸额外+1亲密度。';
if (ZH['data.clothes.wizard_hat.perk'] !== ZPERK || EN['data.clothes.wizard_hat.perk'] !== 'Magic hands: petting gives +1 extra Bond.') throw new Error('the zh-Hans Wizard Hat perk changed');
HATS.forEach((h) => { h.zh = ZNAME[h.n]; }); // the label on screen in the RedNote cut
// RedNote subtitles: each voice line in chunks of at most 14 characters (vo_hat_zh.json)
const SUBS_ZH = { hook: ['别再选可爱的帽子了！', '你的狗狗想要三号。'], pause: ['暂停！三，二，一。'], h1: ['不是他生日，', '他非说是。'], h2: ['他会做饭。', '主要做给自己吃。'],
  h3: ['哦。先记住这顶。'], h4: ['耶哈！然后睡个午觉。'], h5: ['狗狗的一小步。'], h6: ['最可爱的那顶。', '他自己知道。'], h7: ['松鼠们有话要问。'], h8: ['大热天？', '跟他没关系。'],
  reveal: ['三号！巫师帽！', '摸摸他，', '额外加一点亲密度。', '太神奇了！'], ask: ['你会选哪一顶？', '评论区告诉我你选几号！'] };
const FAV = 2; // number 3
// the facts behind the payoffs and the reveal
if (HATS[FAV].n !== 'Wizard Hat' || HATS[FAV].perk !== 'Magic hands: petting gives +1 extra Bond.') throw new Error('the Wizard Hat perk changed');
code('game/src/03_yard.js', /const n = addBond\(3\) \+ \(S\.outfit\.head === 'Wizard Hat' \? addBond\(1, \{ raw: true \}\) : 0\)/);
code('game/src/00_core.js', /TR\('Sun Hat', 'wearable', 'head', 'Uncommon', \['beach', 'park'\], 'Shady Business', 'Hot days do not bother the dog while worn\.'/);
code('game/src/00_core.js', /TR\('Acorn Cap', 'wearable', 'head', 'Uncommon', \['woods', 'park'\], 'Squirrel Diplomacy'/);
code('game/src/00_core.js', /\{ n: 'Cowboy Hat', slot: 'head', price: 70, bond: 2, v24: true, perk: 'Yeehaw: naps outdoors restore 10% more\.' \}/);
code('game/src/00_core.js', /\{ n: 'Chef Hat', slot: 'head', price: 60, bond: 2, v24: true, perk: "Chef's kiss: meals give \+5 Happiness\." \}/);
code('game/src/00_core.js', /\{ n: 'Party Hat', slot: 'head', price: 60, bond: 3, perk: 'Pupcakes give \+50% Happiness\.' \}/);
code('game/src/00_core.js', /\{ n: 'Flower Crown', slot: 'head', price: 90, bond: 3,/);
if (EN['data.breed_names.dachs'] == null && !/dachs/.test(rd('dogs', 'pawart_dogs.js'))) throw new Error('no dachshund');
console.log(HATS.map((h, i) => (i + 1) + ' ' + h.n + ' (' + h.note + ')').join('; '));

// ---- the game's art (main) ----
const win = {}, ctx = { window: win, console, Intl, navigator: {} }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(rd('world', f), ctx);
vm.runInContext(rd('dogs', 'pawart_dogs.js'), ctx);
// the grid tiles show the whole sitting Noodle inside the tile's picture box, so the drawing's floor shadow is left out there (as fail_reel/build_fail.js)
const winG = {}, ctxG = { window: winG, console, Intl, navigator: {} }; vm.createContext(ctxG);
{ const SH = "const shadow=(s.wet&&pose!=='jump'?wetPuddle(shx,shw):'')+`", src = rd('dogs', 'pawart_dogs.js'); if (!src.includes(SH)) throw new Error('art changed: the shadow line'); vm.runInContext(src.replace(SH, "const shadow=''&&`"), ctxG); }
const PAG = winG.PawArt;
const PA = win.PawArt, inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '');
if (!/Noodle/.test(PA.dog('dachs', {}))) throw new Error('the dachshund is not Noodle any more');
const vbOf = (s) => /viewBox="([^"]+)"/.exec(s)[1];
let uid = 0; const uniq = (s) => { const p = 'u' + (uid++) + '_'; return s.replace(/id="([^"]+)"/g, `id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`).replace(/href="#([^"]+)"/g, `href="#${p}$1"`); };
const sym = (s, id) => { if (!s || />\?<\/text>/.test(s) || /data-fallback/.test(s)) throw new Error('no art for ' + id); return `<symbol id="${id}" viewBox="${vbOf(s)}" overflow="visible">${uniq(inner(s))}</symbol>`; };
const SPARK = /<g transform="rotate\([^)]*\)"><path d="[^"]*" fill="#FFE59A" stroke="#5B3D32"[^>]*\/><\/g>/g;
const SYMS = HATS.map((h, i) => sym(PA.item(h.n), 'it' + i) + sym(PA.item(h.n).replace(SPARK, ''), 'ih' + i)).join('');
// Noodle: all three line-boil frames in each drawing (one shown at a time, as the game flips them)
const ART = {};
HATS.forEach((h, i) => {
  ART['s' + i] = inner(PA.dog('dachs', { pose: 'sit', facing: 'right', outfit: { head: h.n }, expr: h.expr || undefined }));
  ART['b' + i] = inner(PAG.dog('dachs', { pose: 'sit', facing: 'right', outfit: { head: h.n } })); // the grid tile: the whole sitting Noodle, no expression marks, no floor shadow
});
ART.fav = inner(PA.dog('dachs', { pose: 'beg', facing: 'right', outfit: { head: 'Wizard Hat' }, expr: 'hearts' }));
for (const [id, s] of Object.entries(ART)) { if (!s.includes('pa-d-f2')) throw new Error('no line boil in ' + id); if (/<text/.test(s)) throw new Error('words drawn in ' + id + ' (text only on cards)'); }

// ---- the backgrounds: the game's own scenes from main (PawArt.scene, 1000 x 600, autumn), no game interface, zoomed onto their open ground ----
// x0 = the window's left edge in scene units, s = the zoom, y0 = 600 - 1920 / s. The back row of props (FLOORS[name].back) ends above Noodle's head.
const AUT = { season: 'autumn', time: 'day', weather: 'sunny' };
const SC = {
  door: { name: 'boutique', x0: 440, s: 5 },   // the Bow-Wow Boutique: the pink door and the shop window, the paving
  window: { name: 'boutique', x0: 348, s: 5 }, // the Bow-Wow Boutique: the big shop window with the dress on its stand
  yard: { name: 'yard', x0: 600, s: 6 },       // the Home Yard: the fence and the grass
  cover: { name: 'boutique', x0: 432, s: 5 },
};
for (const sc of Object.values(SC)) sc.y0 = 600 - H / sc.s;
// scene floors (feet at y >= floor), the back row of props (a thing's top at y >= back) and keep-out boxes [x0, y0, x1, y1] in scene units
const FLOORS = {
  boutique: { floor: 352, back: 374, keep: [[108, 393, 192, 462], [301, 494, 356, 549], [88, 546, 152, 572], [848, 352, 914, 449], [670, 370, 710, 396], [526, 348, 634, 374]] },
  yard: { floor: 404, back: 410, keep: [[0, 413, 222, 597], [143, 416, 202, 444], [193, 460, 244, 504], [220, 510, 270, 540], [213, 383, 287, 420], [303, 328, 342, 414], [856, 228, 1000, 404], [843, 558, 947, 600]] },
};
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the timeline (owner: fast): each card stays up for its spoken line + 0.4 s, then a 0.15 s pause ----
const ORDER = ['hook', 'pause', ...HATS.map((h) => h.k), 'reveal', 'ask'];
const BG = { hook: 'door', pause: 'door', h1: 'door', h2: 'window', h3: 'door', h4: 'window', h5: 'door', h6: 'window', h7: 'door', h8: 'window', reveal: 'yard', ask: 'door' };
const BEATS = []; let at = 0.1; const PAUSE = 0.15;
for (const k of ORDER) { const b = { k, at, dur: VOD[k], hold: VOD[k] + 0.4, bg: BG[k] }; BEATS.push(b); at += b.hold + PAUSE; }
const LOOP = at - PAUSE + 0.15, T = LOOP + 2.5, NF = Math.round(T * FPS);
const B = Object.fromEntries(BEATS.map((b) => [b.k, b]));
const SUBS = [];
if (RN) for (const v of BEATS) { const parts = SUBS_ZH[v.k]; if (parts.join('') !== VOJ.text[v.k]) throw new Error('subtitles differ from the voice: ' + v.k);
  parts.forEach((x) => { if ([...x].length > 14) throw new Error('subtitle over 14 characters: ' + x); });
  const wt = parts.map((x) => x.replace(/[，。！？：、]/g, '').length + 1), sum = wt.reduce((a, c) => a + c, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d + (i === parts.length - 1 ? 0.35 : 0), s: x.replace(/[，。]$/, '') }); t0 += d; }); }
// the count: 3, 2, 1 on the spoken numbers of "Pause now! Three, two, one." (as ../coat_reel/build_coat.js: the quietest dips of the line's loudness)
function wavEnv(f) { const b = fs.readFileSync(f); let o = 12, fmt = null, data = null;
  while (o + 8 <= b.length) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { bits: b.readUInt16LE(o + 22), sr: b.readUInt32LE(o + 12), ch: b.readUInt16LE(o + 10), tag: b.readUInt16LE(o + 8) }; if (id === 'data') data = b.subarray(o + 8, o + 8 + n); o += 8 + n + (n & 1); }
  if (!fmt || !data || fmt.ch !== 1 || !(fmt.bits === 16 || (fmt.bits === 32 && fmt.tag === 3))) throw new Error('unexpected wav ' + f);
  const N = data.length / (fmt.bits / 8), get = fmt.bits === 16 ? (i) => data.readInt16LE(i * 2) / 32768 : (i) => data.readFloatLE(i * 4), wn = Math.round(fmt.sr * 0.03), hop = Math.round(fmt.sr * 0.01), env = [];
  for (let i = 0; i + wn <= N; i += hop) { let e = 0; for (let j = i; j < i + wn; j++) e += get(j) ** 2; env.push(Math.sqrt(e / wn)); }
  return { env, hop: 0.01 }; }
const COUNT = (() => { const { env, hop } = wavEnv(path.join(VO, 'pause.wav')), d = VOD.pause, ix = (x) => Math.round(x / hop);
  const dip = (a, b) => { let k = ix(a); for (let i = ix(a); i <= Math.min(ix(b), env.length - 1); i++) if (env[i] < env[k]) k = i; return k * hop + 0.015; };
  const g1 = dip(d * 0.25, d * 0.6), g2 = dip(g1 + 0.12, g1 + (d - g1) * 0.55), pk = (() => { let k = ix(g2); for (let i = ix(g2); i <= ix(g2 + 0.25); i++) if (env[i] > env[k]) k = i; return k; })(),
    g3 = (() => { for (let i = pk; i < env.length; i++) if (env[i] < env[pk] * 0.3) return i * hop; return d - 0.3; })();
  return [g1, g2, g3].map((x) => B.pause.at + x); })();
console.log('count at', COUNT.map((x) => (x - B.pause.at).toFixed(2)).join(', '), 's into the pause line');

const TX = { hook: ['Stop picking the cute hat.', 'Your dog wants number 3.'], pause: 'Pause now!', reveal: ['Number 3!', 'The Wizard Hat.'],
  quote: ['“Magic hands: petting', 'gives +1 extra Bond.”'], ask: ['Which number would you pick?', 'Comment below!'],
  cover: ['Stop picking', 'the cute hat.'], coverSub: 'Your dog wants number 3.' };
if (RN) Object.assign(TX, { hook: ['别再选可爱的帽子了！', '你的狗狗想要3号。'], pause: '暂停！', reveal: ['3号！', '巫师帽'], quote: ['“神奇的手：', '摸摸额外+1亲密度。”'],
  ask: ['你会选哪一顶？', '评论区告诉我你选几号！'], cover: ['别再选可爱的帽子了！', '你的狗狗想要3号'], coverSub: '' });
if (RN && TX.quote.join('') !== '“' + ZPERK + '”') throw new Error('the quote is not the game\'s perk');
const allText = [TX.hook, TX.pause, TX.reveal, TX.quote, TX.ask, TX.cover, TX.coverSub, HATS.map((h) => [h.n, h.zh, h.lines])].flat(3).join(' ') + ' 0123456789' + (RN ? Object.values(SUBS_ZH).flat().join('') + '治愈系蜡笔狗狗游戏搜 Doodle Doggo App' : '');

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}.pa-d-f0,.pa-d-f1,.pa-d-f2{display:none}.k0 .pa-d-f0,.k1 .pa-d-f1,.k2 .pa-d-f2{display:inline}.pa-dog *{animation:none!important}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${SYMS}__BGSYMS__
</defs>
<g id="bg"></g><g id="dbg"></g><g id="fg"${RN ? ' transform="translate(85 0)"' : ''}><g id="art"></g><g id="ov"></g></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const $=(i)=>document.getElementById(i), RN=${RN}, F=RN?"'LXGW WenKai'":'Caveat', CX=455, DEBUG=${!!process.env.DEBUG}, SUBS=${JSON.stringify(SUBS)};
const ART=${JSON.stringify(ART)}, HATS=${JSON.stringify(HATS.map((h) => ({ n: RN ? h.zh : h.n, lines: h.lines, tint: h.tint })))}, FAV=${FAV};
const BEATS=${JSON.stringify(BEATS)}, B=${JSON.stringify(B)}, LOOP=${LOOP}, T=${T}, COUNT=${JSON.stringify(COUNT)}, TX=${JSON.stringify(TX)};
const SC=${JSON.stringify(SC)}, FLOORS=${JSON.stringify(FLOORS)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);}, lerp=(a,b,u)=>a+(b-a)*u;
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// something standing at screen x0..x1, top y0, feet fy: on the floor of the scene, clear of its keep-out boxes (as fail_reel/build_fail.js)
function groundOk(key, x0, x1, y0, fy){ const s=SC[key], f=FLOORS[s.name], u0=s.x0+x0/s.s, u1=s.x0+x1/s.s, ut=s.y0+y0/s.s, uy=fy!=null?s.y0+fy/s.s:ut;
  if(fy!=null&&uy<f.floor) return 'stands above the floor ('+uy.toFixed(0)+' < '+f.floor+')';
  if(ut<f.back) return 'reaches up into the back row of props ('+ut.toFixed(0)+' < '+f.back+')';
  for(const k of f.keep) if(u1>k[0]&&u0<k[2]&&uy>k[1]&&ut<k[3]) return 'overlaps a scene prop ('+k.join(',')+')';
  return ''; }
const backY=(key)=>{ const s=SC[key]; return (FLOORS[s.name].back-s.y0)*s.s; }; // the screen y of the back row
let BOX=null;
function measure(){ BOX={}; const g=$('art'); for(const [id,s] of Object.entries(ART)){ g.innerHTML='<g class="k0">'+s+'</g>'; const b=g.firstChild.getBBox(); BOX[id]=[b.x,b.y,b.width,b.height]; }
  for(const p of ['it','ih']) for(let i=0;i<HATS.length;i++){ g.innerHTML='<use href="#'+p+i+'" x="0" y="0" width="100" height="100"/>'; const b=g.firstChild.getBBox(); BOX[p+i]=[b.x,b.y,b.width,b.height]; }
  g.innerHTML=''; return BOX; }
// the game's item art for hat i, its drawn box fitted into a size x size square centred on (cx, cy)
function icon(i, cx, cy, size){ const b=BOX['it'+i], k=size/Math.max(b[2],b[3]);
  return '<g transform="translate('+f2(cx)+' '+f2(cy)+') scale('+k.toFixed(4)+') translate('+f2(-(b[0]+b[2]/2))+' '+f2(-(b[1]+b[3]/2))+')"><use href="#it'+i+'" x="0" y="0" width="100" height="100"/></g>'; }
// the hat alone (no sparkles) fitted into the box x0..x1, y0..y1, centred; returns its scale too
function hatIn(i, x0, y0, x1, y1){ const b=BOX['ih'+i], k=Math.min((x1-x0)/b[2],(y1-y0)/b[3]);
  return { k, svg:'<g data-hat="'+i+'" transform="translate('+f2((x0+x1)/2)+' '+f2((y0+y1)/2)+') scale('+k.toFixed(4)+') translate('+f2(-(b[0]+b[2]/2))+' '+f2(-(b[1]+b[3]/2))+')"><use href="#ih'+i+'" x="0" y="0" width="100" height="100"/></g>' }; }
// Noodle standing on (cx, feet), fitted into ww x hh, scaled by z around the feet, dy up/down (a hop), k the line-boil frame
function noodle(id, cx, feet, hh, ww, z, dy, op, k){ const b=BOX[id], s=Math.min(hh/b[3], ww/b[2])*z, w=b[2]*s;
  return '<g data-apart="Noodle" data-feet="'+f2(feet)+'" opacity="'+f2(op)+'"><ellipse cx="'+f2(cx)+'" cy="'+(feet-3)+'" rx="'+f2(w*0.36)+'" ry="13" fill="${PEN}" opacity=".18"/><g class="k'+k+'" transform="translate('+f2(cx)+' '+f2(feet+(dy||0))+') scale('+s.toFixed(4)+') translate('+f2(-(b[0]+b[2]/2))+' '+f2(-(b[1]+b[3]))+')">'+ART[id]+'</g></g>'; }
const bubble=(cx,cy,r,s,size,fill)=>'<g data-box><circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+r+'" fill="'+(fill||'${YEL}')+'" stroke="${PEN}" stroke-width="5"/>'+centred([{s,size}],cx,cy,F).svg+'</g>';
// a card: the text block centred in it; o.badge: a number badge on the left inside, o.icon: the game's item art on the right inside
function card(L, top, op, o){ o=o||{}; const W0=776, x0=CX-W0/2, hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(o.pad||92);
  let s='<g data-apart="'+(o.tag||'card')+'" opacity="'+f2(op)+'"><g data-box><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="'+(o.stroke||'${PEN}')+'" stroke-width="7"/>'+centred(L, CX, top+hh/2, F).svg+'</g>';
  if(o.badge) s+=bubble(x0+70, top+hh/2, 48, o.badge, 70, o.badgeFill);
  if(o.icon!=null) s+=icon(o.icon, x0+W0-70, top+hh/2, 100);
  return { h: hh, svg: s+'</g>' }; }
// the grid: eight cards in two columns and four rows, each: Noodle's head and hat (his sitting drawing, cropped), the number, the item's exact name
const GX=[60,480], GY0=574, CW=370, CH=190, RG=30, gridPos=(i)=>({ x: GX[i%2], y: GY0+(i>>1)*(CH+RG) });
const PIC={x:12,y:12,w:214,h:166}, PIN=12; // the tile's picture box; Noodle's drawn box sits at least PIN px inside it (the check asks for 8)
function cell(i, op, z, k, hot){ const p=gridPos(i), h=HATS[i], nm=h.n.split(' '), l2=RN?([...h.n].length>=5?[h.n.slice(0,3),h.n.slice(3)]:[h.n]):nm.length>1?[nm[0],nm.slice(1).join(' ')]:[nm[0]];
  const cx=p.x+CW/2, cy=p.y+CH/2;
  const b=BOX['b'+i], sc=Math.min((PIC.w-2*PIN)/b[2],(PIC.h-2*PIN)/b[3]);
  return '<g opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(z)+') translate('+f2(p.x-cx)+' '+f2(p.y-cy)+')">'
    +'<rect data-safe data-apart="cell'+(i+1)+'" x="0" y="0" width="'+CW+'" height="'+CH+'" rx="26" fill="${CREAM}" stroke="'+(hot?'${PINK}':'${PEN}')+'" stroke-width="'+(hot?9:6)+'"/>'
    +'<rect data-pic="'+i+'" x="'+PIC.x+'" y="'+PIC.y+'" width="'+PIC.w+'" height="'+PIC.h+'" rx="20" fill="'+h.tint+'" stroke="${PEN}" stroke-width="4"/>'
    +'<g data-in="'+i+'" class="k'+k+'" transform="translate('+f2(PIC.x+PIC.w/2)+' '+f2(PIC.y+PIC.h/2)+') scale('+sc.toFixed(4)+') translate('+f2(-(b[0]+b[2]/2))+' '+f2(-(b[1]+b[3]/2))+')">'+ART['b'+i]+'</g>'
    +'<g transform="translate(298 56) scale('+f2(hot?1.12:1)+') translate(-298 -56)">'+bubble(298,56,36,String(i+1),56,hot?'${PINK}':'${YEL}')+'</g>'
    +'<g data-box><rect x="234" y="104" width="128" height="76" fill="${CREAM}"/>'+centred(l2.map((s)=>({s,size:fitS(s,40,122),pitch:36})),298,142,F).svg+'</g></g>'; }
// every tile's Noodle and hat inside its picture box with at least m px all round (owner: nothing touches an edge)
function insideCheck(m){ const bad=[]; document.querySelectorAll('#ov [data-in]').forEach((g)=>{ const pic=g.parentNode.querySelector('[data-pic="'+g.getAttribute('data-in')+'"]'), a=g.getBoundingClientRect(), r=pic.getBoundingClientRect(), z=r.width/PIC.w;
    const d=Math.min(a.left-r.left, r.right-a.right, a.top-r.top, r.bottom-a.bottom)/z; if(d<m) bad.push('tile '+(+g.getAttribute('data-in')+1)+' art only '+d.toFixed(1)+' px inside its box'); }); return bad; }
function grid(t, op, popAt, hot){ let s=''; for(let i=0;i<8;i++){ const pa=popAt==null?-1:popAt+i*0.05, z=popAt==null?1:Math.max(0.01,Math.min(1,back((t-pa)/0.25))), o=popAt==null?op:op*sm((t-pa)/0.12);
    if(o>0.01) s+=cell(i, o, z, (Math.floor(t/0.15)+i)%3, hot===i); } return s; }
function bgLayers(i, lt, b){ const L=[], prev=i>0?BEATS[i-1].bg:null, k=i===0?1:sm((lt+0.06)/0.3); if(prev&&prev!==b.bg&&k<1) L.push([prev,1]); L.push([b.bg,k]); return L; }
const FEET=1425, CARD_TOP=300;
window.frame=function(t){
  let art='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1, kk=Math.floor(t/0.15)%3;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at, u=i===0?1:cl((lt+0.06)/0.25), cop=fade*(i===0?1:sm(u*3)), pop=i===0?1:0.92+0.08*back(cl((lt+0.06)/0.3));
  const L=bgLayers(i, lt, b).filter((l)=>l[1]>0.001);
  $('bg').innerHTML=L.map((l)=>'<use href="#bg_'+l[0]+'" opacity="'+f2(l[1])+'"/>').join('');
  const scene=b.bg;
  const wrap=(s)=>'<g transform="translate('+CX+' '+CARD_TOP+') scale('+f2(pop)+') translate('+(-CX)+' '+(-CARD_TOP)+')">'+s+'</g>';
  if(fade>0){
    if(b.k==='hook'){ const hot=lt>=b.dur*0.72?FAV:-1; // "...number three": card 3 lights up
      ov+=card([{s:TX.hook[0],size:fitS(TX.hook[0],80,720),pitch:90},{s:TX.hook[1],size:fitS(TX.hook[1],80,720),fill:'${RED}'}], CARD_TOP, cop).svg;
      ov+=grid(t, fade, null, hot); }
    else if(b.k==='pause'){ let n=0; COUNT.forEach((c,j)=>{ if(t>=c) n=3-j; });
      const L2=[{s:TX.pause,size:80,pitch:96},{s:String(n||3),size:104,fill:'#C2567A'}], c=card(L2, CARD_TOP, cop, { pad:66 });
      ov+=wrap(c.svg);
      ov+=grid(t, fade*(1-sm((t-(B.h1.at-0.14))/0.12)), null, -1); }
    else if(/^h\\d$/.test(b.k)){ const n=+b.k[1]-1, h=HATS[n];
      const L2=RN?[{s:h.n,size:fitS(h.n,100,510)}]:[{s:h.n,size:fitS(h.n,88,510),pitch:h.lines.length>1?84:80}].concat(h.lines.map((s,j)=>({s,size:fitS(s,58,510),pitch:62}))), c=card(L2, CARD_TOP, cop, { badge:String(n+1), icon:n, pad:RN?100:80 });
      ov+=wrap(c.svg);
      const top=Math.max(CARD_TOP+c.h+40, backY(scene)+6), hh=FEET-top, zi=0.88+0.12*back(cl(lt/0.28)), oo=fade*Math.min(sm((lt+0.02)/0.1), 1-sm((lt-b.hold-0.04)/0.1));
      if(i===2) ov+=grid(t, fade*(1-sm((lt+0.14)/0.12)), null, -1);
      art+=noodle('s'+n, CX, FEET, hh, 770, zi, 0, oo, kk); }
    else if(b.k==='reveal'){ const c=card([{s:TX.reveal[0],size:96,pitch:92,fill:'${RED}'},{s:TX.reveal[1],size:76}], CARD_TOP, cop, { badge:'3', badgeFill:'${PINK}', icon:FAV, stroke:'${PINK}' });
      ov+=wrap(c.svg); const qa=b.dur*0.42, qo=fade*sm((lt-qa)/0.25), qTop=CARD_TOP+c.h+36;
      const QL=TX.quote.map((s)=>({s,size:56,pitch:62})), qh=62+56*0.75+64;
      if(qo>0.001) ov+='<g data-apart="quote" opacity="'+f2(qo)+'"><g data-box><rect x="'+(CX-340)+'" y="'+f2(qTop)+'" width="680" height="'+f2(qh)+'" rx="30" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/>'+centred(QL,CX,qTop+qh/2,F).svg+'</g></g>';
      const hop=-Math.abs(Math.sin(lt*7.5))*22, top=Math.max(qTop+qh+40, backY(scene)+6)+22, oo=fade*Math.min(sm((lt+0.02)/0.1), 1-sm((lt-b.hold-0.04)/0.1));
      art+=noodle('fav', CX, FEET, FEET-top, 620, 0.88+0.12*back(cl(lt/0.28)), hop, oo, kk); }
    else if(b.k==='ask'){ ov+=wrap(card([{s:TX.ask[0],size:fitS(TX.ask[0],76,720),pitch:84},{s:TX.ask[1],size:74,fill:'${RED}'}], CARD_TOP, cop).svg);
      ov+=grid(t, fade, b.at+0.1, -1); }
  }
  // RedNote: the voice as subtitles, in a pill under the art
  if(RN&&fade>0){ const su=SUBS.find((x)=>t>=x.a&&t<x.b); if(su){ const o=Math.min(sm((t-su.a)/0.08),sm((su.b-t)/0.08)); ov+=pill(su.s, CX, 1572, fitS(su.s,60,880), F, { fill:'${CREAM}', padX:30, op:f2(fade*o) }).replace('<g data-box','<g data-box data-apart="sub"'); } }
  // the end card. RedNote: the RedNote card (the logo, 治愈系蜡笔狗狗游戏, only "搜 Doodle Doggo App"; no QR, no link), centred on the frame at (540, 960)
  let ec=''; if(end) ec='<g opacity="'+f2(sm((t-LOOP-0.1)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+'<g class="k0">'+(RN?endCardRN('tall',LOGO_INNER,{play:'搜 Doodle Doggo App'}):endCard('tall',HANDLES,LOGO_INNER))+'</g></g>';
  $('art').innerHTML=art; $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  if(RN&&end){ const g=$('ec').querySelector('.endcard'), bb=g.getBBox(); g.setAttribute('transform','translate('+f2(540-(bb.x+bb.width/2))+' '+f2(960-(bb.y+bb.height/2))+')'); }
  if(DEBUG){ const s=SC[scene], f=FLOORS[s.name], Y=(y)=>(y-s.y0)*s.s; $('dbg').innerHTML='<line x1="0" x2="1080" y1="'+Y(f.floor)+'" y2="'+Y(f.floor)+'" stroke="red" stroke-width="3"/><line x1="0" x2="1080" y1="'+Y(f.back)+'" y2="'+Y(f.back)+'" stroke="blue" stroke-width="3"/>'+f.keep.map((k)=>'<rect x="'+(k[0]-s.x0)*s.s+'" y="'+Y(k[1])+'" width="'+(k[2]-k[0])*s.s+'" height="'+(k[3]-k[1])*s.s+'" fill="red" opacity=".25"/>').join(''); }
  return checks(scene, fade>0);
};
function checks(scene, ground){
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  if(!RN){ const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; '); }
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ');
  const ins=insideCheck(8); if(ins.length) return 'grid: '+ins.join('; ');
  if(ground) for(const e of $('art').querySelectorAll('[data-apart]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect(), why=groundOk(scene, r.left, r.right, r.top, +e.getAttribute('data-feet'));
    if(why) return e.getAttribute('data-apart')+' '+why; }
  for(const e of $('st').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(); if(!r.width||+(e.getAttribute('opacity')||1)<=0.05) continue;
    if(RN&&(r.left<50||r.right>1030||r.top<40||r.bottom>1880)) return 'in the margin: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round);
    if(RN) continue;
    if(e.closest('#ec')) continue; // the shared end card is laid out by brand/kids/endcard.js inside SAFE (checked by safeCheck above)
    if(r.left<56||r.right>854||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; }
// the RedNote cover (3:4, the middle 1080 x 1440, y 240..1680): the Chinese hook card, the logo, Noodle big in the Wizard Hat with hearts on the
// Boutique's paving, the eight numbered hats in tall chips with big number badges (readable at 270 px wide), number 3 in pink
function coverRN(){
  $('bg').innerHTML='<use href="#bg_cover"/>'; $('fg').removeAttribute('transform');
  let s='', a='';
  s+='<g data-apart="title"><g data-box><rect x="60" y="272" width="960" height="222" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'
    +centred([{s:TX.cover[0],size:fitS(TX.cover[0],92,880),pitch:100},{s:TX.cover[1],size:fitS(TX.cover[1],92,880),fill:'${RED}'}],540,383,F).svg+'</g></g>';
  const CWc=200, CHc=250, gx=26, gy=28, cx0=1020-2*CWc-gx, cy0=526;
  HATS.forEach((h,j)=>{ const x=cx0+(j%2)*(CWc+gx), y=cy0+(j>>1)*(CHc+gy), hot=j===FAV;
    s+='<g data-apart="chip'+(j+1)+'"><rect x="'+f2(x)+'" y="'+y+'" width="'+CWc+'" height="'+CHc+'" rx="28" fill="'+(hot?'#FFE1EA':'${CREAM}')+'" stroke="'+(hot?'${PINK}':'${PEN}')+'" stroke-width="'+(hot?10:6)+'"/>'
      +bubble(x+CWc/2, y+50, 38, String(j+1), 64, hot?'${PINK}':'${YEL}')+hatIn(j, x+12, y+100, x+CWc-12, y+CHc-12).svg+'</g>'; });
  const LW=380, LH=LW*280/900, lx=(60+cx0-30)/2; s+='<g data-apart="logo"><rect x="'+f2(lx-LW/2-30)+'" y="526" width="'+(LW+60)+'" height="'+f2(LH+14)+'" rx="30" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg class="k0" x="'+f2(lx-LW/2)+'" y="533" width="'+LW+'" height="'+f2(LH)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  const top=Math.max(backY('cover')+8, 526+LH+14+40), feet=1636;
  a+=noodle('fav', lx, feet, feet-top, cx0-30-60, 1, 0, 1, 0);
  $('art').innerHTML=a; $('ov').innerHTML=s; $('ec').innerHTML='';
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),24); if(near.length) return 'cover too close: '+near.join('; ');
  for(const g of $('ov').querySelectorAll('[data-hat]')){ const chip=g.parentNode, r=chip.querySelector('rect').getBoundingClientRect(), b=g.getBoundingClientRect(), c=chip.querySelector('circle').getBoundingClientRect();
    const d=Math.min(b.left-r.left, r.right-b.right, b.top-r.top, r.bottom-b.bottom), gap=b.top-c.bottom;
    if(d<8||gap<6) return 'cover: hat '+(+g.getAttribute('data-hat')+1)+' margin '+d.toFixed(1)+', gap to its number '+gap.toFixed(1); }
  for(const e of $('st').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(); if(r.top<260||r.bottom>1660||r.left<40||r.right>1040) return 'cover: outside the 3:4 crop: '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  for(const e of $('art').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(), why=groundOk('cover', r.left, r.right, r.top, feet); if(why) return 'cover: '+e.getAttribute('data-apart')+' '+why; }
  return ''; }
// the cover: its own design, hook-led. The hook card, the eight numbered hats from the game (number 3 in pink), Noodle big in the Wizard Hat on the
// Boutique's paving. Key content inside the 1:1 crop (y 420..1500), the logo inside 4:5 (y 285..1635)
window.cover=function(){ if(RN) return coverRN();
  $('bg').innerHTML='<use href="#bg_cover"/>';
  let s='', a='';
  s+='<g data-apart="title"><g data-box><rect x="60" y="432" width="960" height="250" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'
    +centred([{s:TX.hook[0],size:fitS(TX.hook[0],96,880),pitch:100},{s:TX.hook[1],size:fitS(TX.hook[1],96,880),fill:'${RED}'}],540,557,F).svg+'</g></g>';
  // the eight hats on the right: two columns, four rows of chips (number on top, the game's item art under it); number 3 pink
  const CWc=200, CHc=170, gx=26, gy=26, cx0=1020-2*CWc-gx, cy0=724;
  HATS.forEach((h,j)=>{ const x=cx0+(j%2)*(CWc+gx), y=cy0+(j>>1)*(CHc+gy), hot=j===FAV;
    s+='<g data-apart="chip'+(j+1)+'"><rect data-safe x="'+f2(x)+'" y="'+y+'" width="'+CWc+'" height="'+CHc+'" rx="26" fill="'+(hot?'#FFE1EA':'${CREAM}')+'" stroke="'+(hot?'${PINK}':'${PEN}')+'" stroke-width="'+(hot?10:6)+'"/>'
      +bubble(x+30, y+30, 21, String(j+1), 36, hot?'${PINK}':'${YEL}')+(()=>{ const A=hatIn(j, x+10, y+58, x+CWc-10, y+CHc-10), Bx=hatIn(j, x+60, y+10, x+CWc-10, y+CHc-10); return (A.k>=Bx.k?A:Bx).svg; })()+'</g>'; });
  // Noodle in number 3, hearts, big on the paving on the left
  const top=backY('cover')+8, feet=1476;
  a+=noodle('fav', (60+cx0-30)/2, feet, feet-top, cx0-30-60, 1, 0, 1, 0);
  const LW=340, LH=LW*280/900; s+='<g data-apart="logo"><rect x="'+(540-LW/2-30)+'" y="1512" width="'+(LW+60)+'" height="'+f2(LH+14)+'" rx="30" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg class="k0" x="'+(540-LW/2)+'" y="1519" width="'+LW+'" height="'+f2(LH)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  $('art').innerHTML=a; $('ov').innerHTML=s; $('ec').innerHTML='';
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),24); if(near.length) return 'cover too close: '+near.join('; ');
  for(const g of $('ov').querySelectorAll('[data-hat]')){ const chip=g.parentNode, r=chip.querySelector('rect').getBoundingClientRect(), a=g.getBoundingClientRect(), c=chip.querySelector('circle').getBoundingClientRect();
    const d=Math.min(a.left-r.left, r.right-a.right, a.top-r.top, r.bottom-a.bottom), gap=Math.max(a.left-c.right, a.top-c.bottom), fill=Math.max(a.width/r.width, a.height/r.height);
    if(d<8||gap<6||fill<0.7) return 'cover: hat '+(+g.getAttribute('data-hat')+1)+' margin '+d.toFixed(1)+', gap to its number '+gap.toFixed(1)+', fills '+(fill*100).toFixed(0)+'%'; }
  for(const e of $('st').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(), logo=e.getAttribute('data-apart')==='logo';
    if(logo?(r.top<285||r.bottom>1635):(r.top<420||r.bottom>1500||r.left<40||r.right>1040)) return 'cover: outside the '+(logo?'4:5':'1:1')+' crop: '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  for(const e of $('art').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(), why=groundOk('cover', r.left, r.right, r.top, feet); if(why) return 'cover: '+e.getAttribute('data-apart')+' '+why; }
  return ''; };
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  // the game's scenes, each window rendered once at 1080 x 1920 and kept as a JPEG
  let bgSyms = '';
  for (const [k, sc] of Object.entries(SC)) {
    const f = path.join(WORK, `bg_${k}.jpg`), svg = PA.scene(sc.name, AUT);
    if (!svg || !new RegExp('pa-w[a-z]-' + sc.name + '\\b').test(svg)) throw new Error('no scene art for ' + sc.name);
    await p.setContent(`<html><style>[class$="-hl"],[class*="-hl "]{display:none!important}</style><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${sc.x0} ${sc.y0} ${W / sc.s} ${H / sc.s}">${svg.replace('<svg', '<svg x="0" y="0" width="1000" height="600"')}</svg></body></html>`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 92 });
    bgSyms += `<image id="bg_${k}" width="${W}" height="${H}" href="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}"/>`;
  }
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html.replace('__BGSYMS__', bgSyms));
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app';
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [allText, ht]);
  const latin = allText.replace(/[^\x20-\x7e‘-”]/g, '');
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  if (RN) { await p.evaluate((txt) => document.fonts.load('700 40px "LXGW WenKai"', txt), allText);
    if (!(await p.evaluate((txt) => document.fonts.check('700 40px "LXGW WenKai"', txt), allText))) throw new Error('LXGW WenKai did not load'); }
  await p.evaluate(() => document.fonts.ready); await p.evaluate(() => measure()); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; beats at', BEATS.map((x) => x.k + ' ' + x.at.toFixed(2)).join(', '));
  const render = async (t, file) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) { if (process.env.SOFT) console.log('CHECK', t.toFixed(2), err.slice(0, 400)); else throw new Error(err + ' at ' + t.toFixed(2)); } if (!process.env.CHECK) await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'cover') {
    const err = await p.evaluate(() => window.cover()); if (err) { if (process.env.SOFT) console.log('CHECK', err); else throw new Error(err); }
    const f = RN ? path.join(ROOT, 'brand', 'rednote', 'rednote-17-pick-a-hat.jpg') : path.join(OUT, 'hat-cover.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92, ...(RN ? { clip: { x: 0, y: 240, width: W, height: 1440 } } : {}) }); console.log('wrote', f); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, B.hook.at + B.hook.dur * 0.9, COUNT[1] + 0.1, ...HATS.map((h) => B[h.k].at + 0.6), B.reveal.at + 0.4, B.reveal.at + B.reveal.dur * 0.8, B.ask.at + 1.2, LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  for (const fi of fr) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close(); if (process.env.CHECK) { console.log('all', fr.length, 'frames checked'); return; }
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's music (the shop, the yard at the reveal), ticks, the count, the "levelup" sting, Noodle's voice on top ----
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, segs, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 }, segments: segs, stingers: st })).wav,
    [T + 0.5, [{ at: 0, ctx: { place: 'shop', time: 'day', weather: 'sunny' } }, { at: B.reveal.at, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }, { at: B.ask.at, ctx: { place: 'shop', time: 'day', weather: 'sunny' } }],
      [{ at: B.reveal.at + 0.05, name: 'levelup' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.45*sin(2*PI*660*t)*exp(-t*28)':s=44100:d=0.25", path.join(WORK, 'count.wav')]);
  const EV = [...COUNT.map((c) => ['count', c]), ...BEATS.slice(2).map((x) => ['tick', x.at]), ...[...Array(8).keys()].map((j) => ['tick', B.ask.at + 0.1 + j * 0.05]), ['tick', LOOP + 0.12]];
  const fx = path.join(WORK, 'fx.wav');
  ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
    + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
  const voWav = path.join(WORK, 'voice.wav');
  ff([...BEATS.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', BEATS.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
    + BEATS.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${BEATS.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
  const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
  const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
  const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
  const pre = path.join(WORK, 'premix.wav'), mixWav = path.join(WORK, 'mix.wav');
  ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
    `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-9dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
    '-map', '[a]', '-ar', '44100', pre]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-pick-a-hat-rednote.mp4' : 'doodle-doggo-pick-a-hat.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
