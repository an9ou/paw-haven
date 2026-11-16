// "Stop the video to dress Noodle" Christmas Reel (15 Nov 2026; owner: "Not Halloween, i want similar one but Christmas version").
// The October Halloween Reel's idea (../costume_reel/build_costumes.js, docs/marketing/COSTUME_REEL.md) rebuilt from today's art (ART_ROOT = a
// checkout of origin/main): Noodle the dachshund (PawArt.dog 'dachs', sitting) sits still in the game's own Home Yard on a snowy winter night
// (PawArt.scene 'yard', winter, snow) with the Winter Market's yard decorations (the game's own props, lit and tinted as the game draws them at
// night). Each Christmas or winter costume falls straight down, fast, right through him, and fits him on ONE frame only, which shows a "perfect fit!"
// stamp. A paper label names the look with the game's exact item names. Every Christmas and winter wearable in today's game (checked below against
// main's CLOTHES, the Winter Market table and the v2.8 winter lane), plus Christmas and winter combinations. A seamless loop with no end card (owner, 16 Nov 2026: "It is a loop video, so no need end card"):
// the last frame flows into the first and the music is crossfaded end into start, as the October Reel.
// How a costume fits exactly: it is cut out of the game's own drawing of Noodle wearing it (Noodle with the outfit minus plain Noodle, pixel by
// pixel, with a clean-up of stray crayon lines), so on the fitting frame it sits exactly where the game draws it.
// Every frame: centreCheck(), safeCheck() and apartCheck() (../centre_text.js) over the cards, the stamp, Noodle (with the costume he wears on the
// fitting frame) and the decorations; words, cards and Noodle inside x 60..850, y 270..1440. The falling costume passes over everything on purpose.
// Sound: the game's own music engine (mods/pawaudio.js), the Winter Market's night music, and a quiet crayon whoosh as each costume passes Noodle.
//
//   ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/costume_reel_xmas/build_xmas.js <workdir>
//   ONLY=sprites: a check sheet of every look fitted on Noodle (WORK/sprites), with how far each cut-out is from the game's own drawing.
//   ONLY=stills: key frames (WORK/stills; TS=a,b,... for chosen times). ONLY=cover: xmas-dress-cover.jpg. FRAMES=a-b: re-render only frames
//   a..b, then encode again. DEBUG=1 outlines the decorations' boxes. CHECK=1 runs every frame's checks without rendering.
// REDNOTE=1 (owner, 16 Nov 2026): the RedNote cut, the same loop with every word in Simplified Chinese (the item names are the game's own zh-Hans
//   strings, checked below against game/i18n/zh-Hans.json on main), LXGW WenKai, no safe zone (cards across the frame with 60 px margins; the
//   centring and no-overlap checks stay). No QR, link, domain, handles or platform names. Output doodle-doggo-dress-noodle-christmas-rednote.mp4;
//   ONLY=cover writes brand/rednote/rednote-18-xmas-dress.jpg (3:4, the middle 1080 x 1440).
// Output next to this file: doodle-doggo-dress-noodle-christmas.mp4, xmas-dress-cover.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles, RN_FONT_CSS } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'xmas_work');
for (const d of ['f', 'stills', 'sprites']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C', GREEN = '#3F8A4A', MUTED = '#8A7468', YEL = '#FFE3A1', GOLD = '#FFD66B', PINK = '#F28FA5';
const rd = (...p) => fs.readFileSync(path.join(ART_ROOT, ...p), 'utf8');

// ---- the clothes, checked against main ----
const CORE = rd('game', 'src', '00_core.js'), MARKET = rd('game', 'src', '49_market.js'), WINTER = rd('game', 'src', '31_winter.js'), DOGS = rd('dogs', 'pawart_dogs.js');
const CLOTHES = {}; // name -> { slot, fest, how }
for (const m of CORE.matchAll(/\{ n: '([^']+)', slot: '(\w+)'([^\n]*)\}/g)) CLOTHES[m[1]] = { slot: m[2], a: m[3], fest: (/fest: '(\w+)'/.exec(m[3]) || [])[1] || null };
for (const m of CORE.matchAll(/TR\('([^']+)', 'wearable', '(\w+)'/g)) CLOTHES[m[1]] = { slot: m[2], a: 'treasure', fest: null };
const WM = (() => { const m = /\{ id: 'winter', theme: 'winter', name: 'Winter Market', win: \(\) => \['12-01', '12-26'\],[^]*?clothes: \[([^\]]*)\]/.exec(MARKET); if (!m) throw new Error('the Winter Market table changed'); return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]); })();
const WN_OUTS = (() => { const m = /const WN_OUTS = \[([^\]]*)\]/.exec(WINTER); if (!m) throw new Error('WN_OUTS changed'); return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]); })();
if (!/lights: md >= '12-01' && md <= '12-25'/.test(CORE) || !/snow: md >= '12-01' \|\| md <= '02-29'/.test(CORE)) throw new Error('the winter festival dates changed (captions say Snow Days from 1 Dec, the contest 1 to 25 Dec)');
// where a player gets each one (for the doc and the captions; checked)
function source(n) {
  const c = CLOTHES[n]; if (!c) throw new Error(n + ' is not a wearable on main');
  if (c.fest === 'halloween' || c.fest === 'newyear' || /ed: 20/.test(c.a)) throw new Error(n + ' is a Halloween, New Year or one-year item');
  if (c.fest === 'winter') { if (!/fm: true/.test(c.a) || !WM.includes(n)) throw new Error(n + ' is not in the Winter Market table'); return 'Winter Market (1 to 26 Dec)'; }
  if (c.fest === 'snow') { if (!WM.includes(n)) throw new Error(n + ' should be at the Winter Market too'); return "Baker Bea's Winter Stall (Snow Days, 1 Dec to Feb) and the Winter Market"; }
  if (n === 'Ugly Sweater Rosette') { if (!/const fresh = !owns\('clothes', 'Ugly Sweater Rosette'\)/.test(WINTER)) throw new Error('the rosette prize changed'); return 'the Ugly Sweater Contest prize (Winter Lights, 1 to 25 Dec)'; }
  if (n === 'Knit Scarf') { if (!/owns\('clothes', 'Knit Scarf'\)/.test(rd('game', 'src', '07b_mailbox.js'))) throw new Error('the scarf gift changed'); return "Mrs. Plum's gift by post (all year, at Bond 3)"; }
  if (n === 'Cozy Hoodie') { if (!/S\.inv\.clothes\.push\('Cozy Hoodie'\)/.test(rd('game', 'src', '13_more_dogs.js'))) throw new Error('the hoodie gift changed'); return "Mrs. Plum's gift for good care (all year)"; }
  if (c.fest == null && /price: [1-9]/.test(c.a) && !/reward: true|ks:/.test(c.a)) return 'Bow-Wow Boutique (all year)';
  throw new Error(n + ': no known source');
}
// every Christmas and winter wearable on main, each on its own (the Winter Market clothes, the v2.8 winter outfits, the contest rosette)
const SINGLES = ['Father Christmas Suit', 'Little Elf Outfit', 'Gingerbread Pup Suit', 'Snowman Suit', 'Polar Bear Hood', 'Penguin Suit', 'Puffer Jacket',
  'Nutcracker Jacket & Hat', 'Snowflake Wings', 'Jingle Bell Collar', 'Very Ugly Sweater', 'Reindeer Antlers', 'Snowflake Snood', 'Ugly Sweater Rosette',
  'Pom-pom Beanie', 'Knit Winter Sweater', 'Cozy Hoodie', 'Knit Scarf'];
for (const n of WM.concat(WN_OUTS)) if (!SINGLES.includes(n)) throw new Error('a winter wearable is missing: ' + n);
for (const [n, c] of Object.entries(CLOTHES)) if (['winter', 'snow', 'lights'].includes(c.fest) && !SINGLES.includes(n)) throw new Error('a winter wearable is missing: ' + n);
// (left out on purpose: the Year of the Sheep Hood, fest 'newyear', ed 2027: a New Year piece, not Christmas)
// combinations: only pieces the art shows together (dogs/pawart_dogs.js: a body costume with its own head piece, TOP2, takes the hat off, so no hat on those)
const COMBOS = [
  ['The Full Reindeer', { head: 'Reindeer Antlers', neck: 'Jingle Bell Collar', body: 'Very Ugly Sweater' }],
  ['Sweater Champion', { body: 'Very Ugly Sweater', neck: 'Ugly Sweater Rosette' }],
  ['Champion Reindeer', { head: 'Reindeer Antlers', body: 'Very Ugly Sweater', neck: 'Ugly Sweater Rosette' }],
  ['Jingle All the Way', { head: 'Reindeer Antlers', neck: 'Jingle Bell Collar' }],
  ['Gingerbread Reindeer', { head: 'Reindeer Antlers', body: 'Gingerbread Pup Suit' }],
  ['Jingle Gingerbread', { body: 'Gingerbread Pup Suit', neck: 'Jingle Bell Collar' }],
  ['Gingerbread in a Beanie', { head: 'Pom-pom Beanie', body: 'Gingerbread Pup Suit' }],
  ['Prize Gingerbread', { body: 'Gingerbread Pup Suit', neck: 'Ugly Sweater Rosette' }],
  ['Ski Day', { head: 'Pom-pom Beanie', body: 'Puffer Jacket' }],
  ['Puffer Reindeer', { head: 'Reindeer Antlers', body: 'Puffer Jacket', neck: 'Jingle Bell Collar' }],
  ['Snow Angel', { body: 'Snowflake Wings', neck: 'Snowflake Snood' }],
  ['Flying Reindeer', { head: 'Reindeer Antlers', body: 'Snowflake Wings' }],
  ['Cosy Night In', { head: 'Pom-pom Beanie', body: 'Knit Winter Sweater', neck: 'Knit Scarf' }],
  ['Snowflake Sweater', { body: 'Knit Winter Sweater', neck: 'Snowflake Snood' }],
  ['Hoodie Reindeer', { head: 'Reindeer Antlers', body: 'Cozy Hoodie' }],
  ['Cozy Day', { body: 'Cozy Hoodie', neck: 'Knit Scarf' }],
  ['Snow Day', { head: 'Pom-pom Beanie', neck: 'Snowflake Snood' }],
  ['Jingle Santa', { body: 'Father Christmas Suit', neck: 'Jingle Bell Collar' }],
  ['Prize Penguin', { body: 'Penguin Suit', neck: 'Ugly Sweater Rosette' }],
  ['Snowman in a Snood', { body: 'Snowman Suit', neck: 'Snowflake Snood' }],
  ['Polar Bear in a Scarf', { body: 'Polar Bear Hood', neck: 'Knit Scarf' }],
  ['Nutcracker Champion', { body: 'Nutcracker Jacket & Hat', neck: 'Ugly Sweater Rosette' }],
  ['Jingle Elf', { body: 'Little Elf Outfit', neck: 'Jingle Bell Collar' }],
];
const TOP2 = [...DOGS.matchAll(/TOP2\['([^']+)'\]=function/g)].map((m) => m[1]);
const SLOT = (n) => CLOTHES[n].slot;
const LOOKS = SINGLES.map((n) => ({ name: n, outfit: { [SLOT(n)]: n }, items: [n] })).concat(COMBOS.map(([name, o]) => {
  for (const [k, n] of Object.entries(o)) if (SLOT(n) !== k) throw new Error(name + ': ' + n + ' is not a ' + k + ' item');
  if (o.head && o.body && TOP2.includes(o.body)) throw new Error(name + ': the art takes the hat off under ' + o.body);
  return { name, outfit: o, items: ['head', 'body', 'neck'].filter((k) => o[k]).map((k) => o[k]) }; }));
const SRC = Object.fromEntries(SINGLES.map((n) => [n, source(n)]));
if (new Set(LOOKS.map((l) => l.name)).size !== LOOKS.length) throw new Error('two looks share a name');
console.log(LOOKS.length, 'looks;', SINGLES.map((n) => n + ' (' + SRC[n] + ')').join('; '));

// ---- the order and the timeline: the Father Christmas Suit first (the hook), then the rest shuffled, each once ----
const SF = 23, STEP = SF / 30, CROSS = 0.65; // one costume every 23 frames (0.77 s), so the loop is a whole number of frames; each takes 0.65 s from just above the top edge to just below the bottom edge
const ORDER = (() => { let seed = 25; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const rest = LOOKS.map((_, i) => i).filter((i) => LOOKS[i].name !== 'Father Christmas Suit'), r = rest.map((i) => [rnd(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  // no two looks in a row share their main piece
  const main = (i) => LOOKS[i].outfit.body || LOOKS[i].outfit.head || LOOKS[i].outfit.neck;
  for (let k = 1; k < r.length; k++) if (main(r[k]) === main(r[k - 1])) { const j = r.findIndex((x, q) => q > k + 1 && main(x) !== main(r[k - 1]) && main(x) !== main(r[k + 1] ?? -1)); if (j > 0) [r[k], r[j]] = [r[j], r[k]]; }
  if (main(r[r.length - 1]) === 'Father Christmas Suit') [r[r.length - 1], r[r.length - 2]] = [r[r.length - 2], r[r.length - 1]]; // nor across the loop point
  return [LOOKS.findIndex((l) => l.name === 'Father Christmas Suit'), ...r]; })();
const ALIGN = ORDER.map((_, k) => (k * SF + 11) / FPS); // the one frame each costume fits
const NF = ORDER.length * SF, T = NF / FPS, LOOP = T; // a seamless loop: every costume falls once per loop, and the falls wrap round the loop point

// ---- the game's art (main) ----
const win = {}, ctx = { window: win, console, Intl, navigator: {} }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(rd('world', f), ctx);
vm.runInContext(DOGS, ctx);
const PA = win.PawArt, inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '');
if (!/Noodle/.test(PA.dog('dachs', {}))) throw new Error('the dachshund is not Noodle any more');
const DOG = (outfit) => PA.dog('dachs', { pose: 'sit', facing: 'right', anim: false, outfit });
for (const l of LOOKS) { const s = DOG(l.outfit); if (/<text/.test(s)) throw new Error('words in ' + l.name); if (s === DOG({})) throw new Error('nothing drawn for ' + l.name); }
for (const n of SINGLES) { const s = PA.item(n); if (!s || /data-fallback|>\?<\/text>/.test(s)) throw new Error('no item art for ' + n); }
const LOGO_INNER = inner(rd('brand', 'doodle-doggo-logo.svg')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the stage: the Home Yard on a snowy winter night (1000 x 600 scene units), zoomed: screen = (scene - (x0, y0)) * s ----
const ENV = { season: 'winter', time: 'night', weather: 'snow' };
const SC = { x0: 600, s: 3.6 }; SC.y0 = 600 - H / SC.s;
const SCC = { x0: 600, s: 3.6 }; SCC.y0 = 600 - H / SCC.s; // the cover
// the Winter Market's yard decorations (game/src/03_yard.js HM_DECOR: prop, size and viewBox as the game's), at spots a player can move them to:
// clear of Noodle, the cards and each other. [prop, x, y] in scene units; the size is the game's
const DECOR = { 'Felt Fir Tree': ['wmfirtree', 91, 130, 140, 200], 'Star Lantern': ['wmstarlantern', 60, 100, 120, 200], 'Present Pile': ['wmpresents', 96, 72, 160, 120],
  'Yard Snowman': ['wmsnowman', 84, 108, 140, 180], 'Red Wooden Sled': ['wnsled', 130, 78, 200, 120] };
{ const Y = rd('game', 'src', '03_yard.js'); for (const [n, d] of Object.entries(DECOR)) { const m = new RegExp("'" + n + "': \\{ prop: '" + d[0] + "', at: \\[\\d+, \\d+, " + d[1] + ', ' + d[2] + '\\], vb: \\[' + d[3] + ', ' + d[4] + '\\][^\\n]*(fest: \'(?:winter|snow)\')').exec(Y);
  if (!m) throw new Error('the decoration changed on main: ' + n); } }
const PLACE = { reel: [['Felt Fir Tree', 838, 286], ['Present Pile', 606, 516], ['Star Lantern', 712, 492], ['Yard Snowman', 806, 484]],
  cover: [['Present Pile', 584, 528], ['Yard Snowman', 820, 492]] };
const LIT = { wmstarlantern: true, wmfirtree: false, wmpresents: false, wmsnowman: false, wnsled: false };
function stageSVG(sc, places) {
  let props = '';
  for (const [n, x, y] of places) { const [prop, w, h, vw, vh] = DECOR[n], lit = LIT[prop]; let a = PA.prop(prop, lit ? { lit: true } : {}); if (!a) throw new Error('no prop art ' + prop);
    a = PA.tint(a, { time: ENV.time, lit: !!lit }); props += `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${vw} ${vh}" overflow="visible">${inner(a)}</svg>`; }
  const sv = PA.scene('yard', ENV); if (!/pa-w[a-z]-yard\b/.test(sv)) throw new Error('no yard scene art');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${sc.x0} ${sc.y0} ${W / sc.s} ${H / sc.s}">${sv.replace('<svg', '<svg x="0" y="0" width="1000" height="600"')}${props}</svg>`;
}
const propBoxes = (sc, places) => places.map(([n, x, y]) => { const d = DECOR[n]; return { n, x: (x - sc.x0) * sc.s, y: (y - sc.y0) * sc.s, w: d[1] * sc.s, h: d[2] * sc.s }; });

// Noodle: sitting, facing right, his drawn box (shadow included) NW wide, centred on x NX, feet on FEET (on the snow, below the fence's foot)
const NX = 455, NW = 740, FEET = 1236;
const FENCE_FOOT = 404; // the yard's fence foot in scene units (the hat Reel's FLOORS.yard.floor)
const RN = !!process.env.REDNOTE;
const ZH = JSON.parse(rd('game', 'i18n', 'zh-Hans.json')), ENJ = JSON.parse(rd('game', 'i18n', 'en.json'));
// the game's own Chinese item names (checked), and the combinations' names in natural Chinese
const ZNAME = { 'Father Christmas Suit': '圣诞老人装', 'Little Elf Outfit': '小精灵装', 'Gingerbread Pup Suit': '姜饼狗狗装', 'Snowman Suit': '雪人装', 'Polar Bear Hood': '北极熊兜帽',
  'Penguin Suit': '企鹅装', 'Puffer Jacket': '羽绒服', 'Nutcracker Jacket & Hat': '胡桃夹子外套和帽子', 'Snowflake Wings': '雪花翅膀', 'Jingle Bell Collar': '铃铛项圈', 'Very Ugly Sweater': '超丑萌毛衣',
  'Reindeer Antlers': '驯鹿鹿角', 'Snowflake Snood': '雪花围脖', 'Ugly Sweater Rosette': '丑萌毛衣花章', 'Pom-pom Beanie': '毛球毛线帽', 'Knit Winter Sweater': '针织冬季毛衣', 'Cozy Hoodie': '暖暖连帽衫', 'Knit Scarf': '针织围巾' };
for (const [n, z] of Object.entries(ZNAME)) { const k = Object.keys(ENJ).find((q) => /^data\.clothes\.[a-z_]+\.n$/.test(q) && ENJ[q] === n); if (!k || ZH[k] !== z) throw new Error('the zh-Hans name changed: ' + n + ' is ' + (k && ZH[k])); }
const ZCOMBO = { 'The Full Reindeer': '全套驯鹿', 'Sweater Champion': '毛衣冠军', 'Champion Reindeer': '冠军驯鹿', 'Jingle All the Way': '一路响叮当', 'Gingerbread Reindeer': '姜饼驯鹿',
  'Jingle Gingerbread': '叮当姜饼', 'Gingerbread in a Beanie': '戴毛线帽的姜饼', 'Prize Gingerbread': '得奖姜饼', 'Ski Day': '滑雪日', 'Puffer Reindeer': '羽绒驯鹿', 'Snow Angel': '雪天使',
  'Flying Reindeer': '会飞的驯鹿', 'Cosy Night In': '宅家暖冬夜', 'Snowflake Sweater': '雪花毛衣', 'Hoodie Reindeer': '连帽衫驯鹿', 'Cozy Day': '暖暖的一天', 'Snow Day': '下雪天',
  'Jingle Santa': '叮当圣诞老人', 'Prize Penguin': '得奖企鹅', 'Snowman in a Snood': '围脖雪人', 'Polar Bear in a Scarf': '围巾北极熊', 'Nutcracker Champion': '冠军胡桃夹子', 'Jingle Elf': '叮当小精灵' };
if (RN) for (const l of LOOKS) { const single = l.items.length === 1 && l.name === l.items[0]; if (!single && !ZCOMBO[l.name]) throw new Error('no Chinese name for ' + l.name);
  l.name = single ? ZNAME[l.items[0]] : ZCOMBO[l.name]; l.items = l.items.map((n) => ZNAME[n]); l.single = single; }
else for (const l of LOOKS) l.single = l.items.length === 1 && l.name === l.items[0];
const TX = RN ? { head: '暂停视频给Noodle换装🎄', ask: '评论区说说Noodle换到了什么👇', fit: '完美合身！', cover: ['暂停视频', '给Noodle换装！'], coverAsk: '你能停在完美合身吗？' } : { head: 'Stop the video to dress Noodle 🎄', ask: 'comment what Noodle got 👇', fit: 'perfect fit!', cover: ['Stop the video', 'to dress Noodle!'], coverAsk: 'can you get a perfect fit?' };
const allText = [Object.values(TX).flat(), LOOKS.map((l) => [l.name, l.items.join(' + ')])].flat(3).join(' ') + ' 0123456789';
if (RN && /链接|网址|官网|二维码|扫码|下载|私信|加我|主页|戳|doodledoggo|\.app|@|Instagram|YouTube|微信|抖音|微博/i.test(allText)) throw new Error('a RedNote no-go word on screen');

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g id="bg"></g><g id="dog"></g><g id="fall"></g><g id="dbg"></g><g id="ov"></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const $=(i)=>document.getElementById(i), RN=${RN}, F=RN?"'LXGW WenKai'":'Caveat', TCX=RN?540:455, TW=RN?960:790, CX=${NX}, DEBUG=${!!process.env.DEBUG};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, TX=${JSON.stringify(TX)};
let D=null; // set by setup(): looks, order, align, sprites, Noodle's box, the decorations' boxes
function fitS(s,max,w){ let z=max; while(z>16){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=1; } return z; }
// the header: the hook and the ask, two lines, centred in a cream card (x 60..850)
function header(){ return '<g data-apart="header"><g data-box><rect x="60" y="284" width="'+TW+'" height="150" rx="34" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/>'
  +centred([{s:TX.head,size:fitS(TX.head,RN?66:70,TW-60),pitch:RN?70:66},{s:TX.ask,size:RN?42:46,fill:'${MUTED}'}],TCX,359,F).svg+'</g></g>'; }
// the label: the look's name, and under a combination's name its pieces with the game's exact names
function label(l){ const y=1290, h=140, w=TW-70, L=!l.single?[{s:l.name,size:fitS(l.name,RN?64:64,w),pitch:RN?62:58,fill:'${RED}'},{s:l.items.join(' + '),size:fitS(l.items.join(' + '),RN?44:38,w+10)}]:[{s:l.name,size:fitS(l.name,RN?80:72,w),fill:'${RED}'}];
  return '<g data-apart="label"><g data-box><rect x="60" y="'+y+'" width="'+TW+'" height="'+h+'" rx="34" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/>'+centred(L,TCX,y+h/2,F).svg+'</g></g>'; }
// the stamp: a gold pill just above Noodle's head on the fitting frame, tilted
function stamp(cx,cy,size){ const s=size||58; return '<g data-apart="stamp" transform="rotate(-6 '+f2(cx)+' '+f2(cy)+')">'+pill(TX.fit,cx,cy,s,F,{fill:'${GOLD}',padX:34})+'</g>'; }
function setup(d){ D=d;
  $('bg').innerHTML='<image href="'+d.bg+'" x="0" y="0" width="${W}" height="${H}"/>';
  $('dog').innerHTML='<image href="'+d.plain+'" x="0" y="0" width="${W}" height="${H}"/>';
  if(DEBUG) $('dbg').innerHTML=d.props.map((b)=>'<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="none" stroke="red" stroke-width="3"/>').join('')+'<line x1="0" x2="1080" y1="'+d.fence+'" y2="'+d.fence+'" stroke="blue" stroke-width="3"/>'; }
// boxes for apartCheck: Noodle (and the costume he wears on the fitting frame) and the decorations, as invisible rects
const box=(tag,b)=>'<rect data-apart="'+tag+'" x="'+f2(b[0])+'" y="'+f2(b[1])+'" width="'+f2(b[2]-b[0])+'" height="'+f2(b[3]-b[1])+'" fill="none" stroke="none"/>';
window.frame=function(t){
  let fall='', ov='', ec='';
  const end=false, N=D.order.length;
  let near=0, nd=1e9, perfect=-1;
  for(let k=0;k<N;k++) for(const wrap of [-${T},0,${T}]){ const li=D.order[k], sp=D.sprites[li], dt=t-(D.align[k]+wrap);
    if(Math.abs(dt)<nd){ nd=Math.abs(dt); near=k; } // the label names the nearest costume, across the loop point too
    const v=(${H}+(sp.b[3]-sp.b[1]))/${CROSS}, dy=v*dt;
    if(Math.abs(dt)<1e-6) perfect=li;
    if(sp.b[3]+dy<0||sp.b[1]+dy>${H}) continue;
    fall+='<image href="'+sp.url+'" x="'+f2(sp.x)+'" y="'+f2(sp.y+dy)+'" width="'+sp.w+'" height="'+sp.h+'"/>'; }
  {
    ov+=header()+label(D.looks[D.order[near]]);
    let nb=D.noodle.slice(); if(perfect>=0){ const b=D.sprites[perfect].b; nb=[Math.min(nb[0],b[0]),Math.min(nb[1],b[1]),Math.max(nb[2],b[2]),Math.max(nb[3],b[3])];
      ov+=stamp(Math.min(700,Math.max(250,(D.head[0]))), Math.max(520, nb[1]-92)); }
    ov+=box('Noodle',nb)+D.props.map((b)=>box('decor '+b.n,[b.x,b.y,b.x+b.w,b.y+b.h])).join('');
  }
  $('fall').innerHTML=fall; $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  return checks(end);
};
function checks(end){
  const st=$('st'), bad=centreCheck(st); if(bad.length) return 'not centred: '+bad.join('; ');
  if(!RN){ const out=safeCheck(st); if(out.length) return 'outside SAFE: '+out.join('; '); }
  const near=apartCheck(st,28); if(near.length) return 'too close: '+near.join('; ');
  if(end) return '';
  for(const e of st.querySelectorAll('#ov text,#ov [data-box],#ov [data-apart="stamp"],#ov [data-apart="Noodle"]')){ const r=e.getBoundingClientRect(); if(!r.width) continue;
    if(RN){ if(r.left<50||r.right>1030||r.top<40||r.bottom>1880) return 'in the margin: '+(e.getAttribute('data-apart')||e.textContent||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); continue; }
    if(r.left<56||r.right>854||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||e.textContent||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; }
// the cover: its own design. The hook in a big card, Noodle big in the Father Christmas Suit with the "perfect fit!" stamp on the yard at night,
// the other costumes (the game's item art) in chips around him, the ask, the logo. Key content inside the 1:1 crop (y 420..1500), the logo inside 4:5.
window.cover=function(c){
  $('bg').innerHTML='<image href="'+c.bg+'" x="0" y="0" width="${W}" height="${H}"/>'; $('dog').innerHTML='<image href="'+c.dog+'" x="0" y="0" width="${W}" height="${H}"/>'; $('fall').innerHTML='';
  let s='';
  s+='<g data-apart="title"><g data-box><rect x="60" y="430" width="960" height="236" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'
    +centred([{s:TX.cover[0],size:fitS(TX.cover[0],112,880),pitch:104},{s:TX.cover[1],size:fitS(TX.cover[1],112,880),fill:'${RED}'}],540,548,F).svg+'</g></g>';
  c.chips.forEach((ch,j)=>{ s+='<g data-apart="chip'+j+'" transform="rotate('+ch.r+' '+(ch.x+ch.w/2)+' '+(ch.y+ch.h/2)+')"><rect x="'+ch.x+'" y="'+ch.y+'" width="'+ch.w+'" height="'+ch.h+'" rx="24" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/>'
    +'<svg x="'+(ch.x+10)+'" y="'+(ch.y+10)+'" width="'+(ch.w-20)+'" height="'+(ch.h-20)+'" viewBox="0 0 64 64">'+ch.art+'</svg></g>'; });
  s+=stamp(c.stamp[0],c.stamp[1],62);
  s+='<g data-apart="ask"><g data-box><rect x="'+(540-330)+'" y="1400" width="660" height="84" rx="42" fill="${GREEN}" stroke="${PEN}" stroke-width="5"/>'+centred([{s:TX.coverAsk,size:54,fill:'${CREAM}'}],540,1442,F).svg+'</g></g>';
  const LW=330, LH=LW*280/900; s+='<g data-apart="logo"><rect x="'+(540-LW/2-26)+'" y="1512" width="'+(LW+52)+'" height="'+f2(LH+14)+'" rx="28" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg x="'+(540-LW/2)+'" y="1519" width="'+LW+'" height="'+f2(LH)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  s+=box('Noodle',c.noodle)+c.props.map((b)=>box('decor '+b.n,[b.x,b.y,b.x+b.w,b.y+b.h])).join('');
  $('ov').innerHTML=s; $('ec').innerHTML='';
  if(DEBUG) $('dbg').innerHTML=c.props.map((b)=>'<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="none" stroke="red" stroke-width="3"/>').join('');
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),24); if(near.length) return 'cover too close: '+near.join('; ');
  for(const e of $('ov').querySelectorAll('[data-apart]')){ const n=e.getAttribute('data-apart'); if(/^decor/.test(n)) continue; const r=e.getBoundingClientRect(), logo=n==='logo';
    if(logo?(r.top<285||r.bottom>1635):(r.top<420||r.bottom>1500||r.left<40||r.right>1040)) return 'cover: outside the '+(logo?'4:5':'1:1')+' crop: '+n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; };
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  // the backgrounds: the scene and the decorations, rendered once as JPEGs
  const bgShot = async (sc, places, file) => { await p.setContent(`<html><style>[class$="-hl"],[class*="-hl "]{display:none!important}</style><body style="margin:0">${stageSVG(sc, places)}</body></html>`);
    await p.screenshot({ path: file, type: 'jpeg', quality: 93 }); return 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64'); };
  const bg = await bgShot(SC, PLACE.reel, path.join(WORK, 'bg.jpg')), bgc = await bgShot(SCC, PLACE.cover, path.join(WORK, 'bg_cover.jpg'));
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app';
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [allText, ht]);
  if (RN) { await p.evaluate((txt) => document.fonts.load('700 40px "LXGW WenKai"', txt), allText);
    if (!(await p.evaluate((txt) => document.fonts.check('700 40px "LXGW WenKai"', txt), allText.replace(/[\u{1F300}-\u{1FAFF}]/gu, '')))) throw new Error('LXGW WenKai did not load'); }
  const latin = allText.replace(/[^\x20-\x7e‘-”]/g, '');
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);

  // Noodle's drawn box in his 240 x 200 canvas (plain, shadow included), so every look keeps the same size and place
  const NB = await p.evaluate((sv) => { const d = document.createElement('div'); d.innerHTML = sv; document.body.appendChild(d); const e = d.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const r = e.getBBox(); d.remove(); return [r.x, r.y, r.width, r.height]; }, DOG({}));
  const k = NW / NB[2], place = (cx, feet, kk) => ({ x: cx - (NB[0] + NB[2] / 2) * kk, y: feet - (NB[1] + NB[3]) * kk, w: 240 * kk, h: 200 * kk });
  const solo = (outfit, cx = NX, feet = FEET, kk = k) => { const q = place(cx, feet, kk); return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><svg x="${q.x.toFixed(2)}" y="${q.y.toFixed(2)}" width="${q.w.toFixed(2)}" height="${q.h.toFixed(2)}" viewBox="0 0 240 200" overflow="visible">${inner(DOG(outfit))}</svg></svg>`; };
  // render an SVG string to a full-frame canvas in the page; returns a PNG data URL and the drawn box
  const raster = (s) => p.evaluate(async ([s, W, H]) => { const im = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); });
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, W, H).data; let l = W, t = H, r = 0, bo = 0;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) if (d[(y * W + xx) * 4 + 3] > 8) { if (xx < l) l = xx; if (xx > r) r = xx; if (y < t) t = y; if (y > bo) bo = y; }
    return { url: c.toDataURL('image/png'), b: [l, t, r + 1, bo + 1] }; }, [s, W, H]);
  const plain = await raster(solo({}));
  // the cut: (Noodle wearing the look) minus (plain Noodle), pixel by pixel. The crayon lines wobble a little differently under a costume, so a plain
  // difference also catches thin copies of his outline: keep only differing pixels near a solid differing area (an opening: erode er, grow gr).
  // Body pieces get a strong clean-up; head and neck pieces are also cut on their own with a light one, so thin parts (antlers, bells) survive.
  // The colours always come from the game's drawing of the whole look, so pieces that the art hides stay hidden.
  const cut = (sAll, sPlain, sSmall) => p.evaluate(async ([sAll, sPlain, sSmall, W, H, Y0, Y1]) => {
    const load = (s) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); });
    const HH = Y1 - Y0, c = document.createElement('canvas'); c.width = W; c.height = HH; const x = c.getContext('2d');
    const px = async (s) => { x.clearRect(0, 0, W, HH); x.drawImage(await load(s), 0, -Y0); return x.getImageData(0, 0, W, HH); };
    const z = (await px(sPlain)).data, sm = sSmall ? (await px(sSmall)).data : null, all = await px(sAll), o = all.data;
    const diff = (a) => { const m = new Uint8Array(W * HH); for (let i = 0, q = 0; i < a.length; i += 4, q++) m[q] = (Math.abs(a[i] - z[i]) + Math.abs(a[i + 1] - z[i + 1]) + Math.abs(a[i + 2] - z[i + 2]) + Math.abs(a[i + 3] - z[i + 3])) >= 40 ? 1 : 0; return m; };
    const pass = (src, r, minMode) => { const t = new Uint8Array(W * HH), u = new Uint8Array(W * HH);
      for (let y = 0; y < HH; y++) { const row = y * W; let cnt = 0; // a running count over the window [x - r, x + r]
        for (let xx = -r; xx < W; xx++) { const add = xx + r, sub = xx - r - 1; if (add < W) cnt += src[row + add]; if (sub >= 0) cnt -= src[row + sub]; if (xx >= 0) { const n = Math.min(W - 1, xx + r) - Math.max(0, xx - r) + 1; t[row + xx] = minMode ? (cnt === 2 * r + 1 && n === 2 * r + 1 ? 1 : 0) : (cnt > 0 ? 1 : 0); } } }
      for (let xx = 0; xx < W; xx++) { let cnt = 0; for (let y = -r; y < HH; y++) { const add = y + r, sub = y - r - 1; if (add < HH) cnt += t[add * W + xx]; if (sub >= 0) cnt -= t[sub * W + xx]; if (y >= 0) { const n = Math.min(HH - 1, y + r) - Math.max(0, y - r) + 1; u[y * W + xx] = minMode ? (cnt === 2 * r + 1 && n === 2 * r + 1 ? 1 : 0) : (cnt > 0 ? 1 : 0); } } }
      return u; };
    const open = (m, er, gr) => pass(pass(m, er, true), gr, false);
    const m1 = diff(o), body = open(m1, 8, 14), small = sm ? open(diff(sm), 2, 4) : null;
    let l = W, t = HH, r = 0, bo = 0, kept = 0, all1 = 0;
    for (let q = 0; q < W * HH; q++) { const keep = m1[q] && (body[q] || (small && small[q])); if (m1[q]) all1++; if (!keep) o[q * 4 + 3] = 0; else { kept++; const xx = q % W, y = (q / W) | 0; if (xx < l) l = xx; if (xx > r) r = xx; if (y < t) t = y; if (y > bo) bo = y; } }
    if (!kept) return null;
    const c2 = document.createElement('canvas'); c2.width = r - l + 1; c2.height = bo - t + 1; x.putImageData(all, 0, 0); c2.getContext('2d').drawImage(c, l, t, c2.width, c2.height, 0, 0, c2.width, c2.height);
    return { url: c2.toDataURL('image/png'), x: l, y: t + Y0, w: c2.width, h: c2.height, b: [l, t + Y0, r + 1, bo + 1 + Y0], kept, all: all1 }; }, [sAll, sPlain, sSmall, W, H, 300, 1300]);
  const sprites = [];
  for (const l of LOOKS) {
    const o = l.outfit, sm = Object.fromEntries(Object.entries(o).filter(([kk]) => kk !== 'body')), hasSmall = Object.keys(sm).length > 0;
    const sp = await cut(solo(o), solo({}), hasSmall ? solo(sm) : null);
    if (!sp) throw new Error('nothing to drop for ' + l.name);
    // how close the fitted cut-out is to the game's own drawing of the look (share of the differing pixels kept)
    sp.keep = sp.kept / sp.all; if (sp.keep < 0.9) console.log('note:', l.name, 'keeps', (sp.keep * 100).toFixed(1) + '% of the changed pixels');
    if (sp.b[1] < 520 + 92) throw new Error(l.name + ' reaches too high for the stamp: ' + sp.b[1]);
    sprites.push(sp);
  }
  const head = [NX + NW * 0.18, 0];
  const props = propBoxes(SC, PLACE.reel), fence = (FENCE_FOOT - SC.y0) * SC.s;
  if (FEET < fence + 15) throw new Error('Noodle sits on the fence, not the snow');
  await p.evaluate((d) => setup(d), { bg, plain: plain.url, sprites, looks: LOOKS, order: ORDER, align: ALIGN, noodle: plain.b, head, props, fence });
  console.log('T =', T.toFixed(3), 's (a seamless loop, no end card),', NF, 'frames,', LOOKS.length, 'looks; Noodle', plain.b.join(','));

  if (process.env.ONLY === 'sprites') {
    for (const [i, l] of LOOKS.entries()) { await p.evaluate(([sp, l]) => { $('fall').innerHTML = '<image href="' + sp.url + '" x="' + sp.x + '" y="' + sp.y + '" width="' + sp.w + '" height="' + sp.h + '"/>'; $('ov').innerHTML = label(l); }, [sprites[i], l]);
      await p.screenshot({ path: path.join(WORK, 'sprites', `s${String(i).padStart(2, '0')}.png`), clip: { x: 0, y: 420, width: W, height: 1040 } }); }
    // and the game's own drawing of each look, for comparison
    for (const [i, l] of LOOKS.entries()) { const r = await raster(solo(l.outfit)); await p.evaluate(([u, l]) => { $('dog').innerHTML = '<image href="' + u + '" x="0" y="0" width="1080" height="1920"/>'; $('fall').innerHTML = ''; $('ov').innerHTML = label(l); }, [r.url, l]);
      await p.screenshot({ path: path.join(WORK, 'sprites', `g${String(i).padStart(2, '0')}.png`), clip: { x: 0, y: 420, width: W, height: 1040 } }); }
    console.log('sprites in', path.join(WORK, 'sprites')); await b.close(); return; }

  if (process.env.ONLY === 'cover') {
    // Noodle on the cover: sitting in the Father Christmas Suit (the game's drawing of the whole look), big, left of centre
    const CK = 600 / NB[2], CXc = 380, CF = 1366, look = LOOKS.find((l) => l.single && l.outfit.body === 'Father Christmas Suit'), dogR = await raster(solo(look.outfit, CXc, CF, CK));
    const chipsAt = [[818, 700, -4], [818, 908, 3], [818, 1116, -3], [72, 712, 4]], chipN = ['Reindeer Antlers', 'Nutcracker Jacket & Hat', 'Snowman Suit', 'Penguin Suit'];
    const chips = chipsAt.map(([x, y, r], j) => ({ x, y, r, w: 190, h: 170, art: inner(PA.item(chipN[j])) }));
    const err = await p.evaluate((c) => window.cover(c), { bg: bgc, dog: dogR.url, noodle: dogR.b, chips, stamp: [545, dogR.b[1] - 88], props: propBoxes(SCC, PLACE.cover) });
    if (err) { if (process.env.SOFT) console.log('CHECK', err); else throw new Error(err); }
    const f = RN ? path.join(ROOT, 'brand', 'rednote', 'rednote-18-xmas-dress.jpg') : path.join(OUT, 'xmas-dress-cover.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92, ...(RN ? { clip: { x: 0, y: 240, width: W, height: 1440 } } : {}) }); console.log('wrote', f); await b.close(); return; }

  const render = async (t, file) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) { if (process.env.SOFT) console.log('CHECK', t.toFixed(2), err.slice(0, 400)); else throw new Error(err + ' at ' + t.toFixed(3)); } if (!process.env.CHECK) await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ALIGN[0] - 0.1, ALIGN[0], ALIGN[1], ALIGN[5] - 2 / FPS, ALIGN[5], ALIGN[12], ALIGN[20], ALIGN[30], (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills in', path.join(WORK, 'stills')); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  for (const fi of fr) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  // each costume's fitting frame shows the stamp, and it fits on that frame only
  for (const a of ALIGN) { const f = Math.round(a * FPS); if (Math.abs(f / FPS - a) > 1e-6) throw new Error('a fitting time is not on a frame: ' + a); }
  await b.close(); if (process.env.CHECK) { console.log('all', fr.length, 'frames checked'); return; }
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's Winter Market night music, rendered 2.2 s longer and crossfaded end into start so the loop has no seam (as
  //      ../costume_reel/build_costumes.js), and a quiet crayon whoosh as each costume passes Noodle (wrapping round the loop point) ----
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0.06 },
    segments: [{ at: 0, ctx: { place: 'fmarket', fest: 'winter', time: 'night', weather: 'snow' } }] })).wav, [T + 2.2]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  { const SR = 44100, n = Math.ceil(T * SR), buf = new Float32Array(n); let seed = 3; const noise = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
    for (const t0 of ALIGN) { let lp = 0; for (let i = 0; i < 0.3 * SR; i++) { const t = i / SR, e = Math.sin(Math.PI * t / 0.3) ** 3; lp += 0.12 * (noise() - lp); const j = Math.floor((t0 - 0.15) * SR) + i; buf[((j % n) + n) % n] += 0.7 * e * lp; } }
    const pcm = Buffer.alloc(44 + n * 2); pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
    pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) pcm.writeInt16LE((Math.max(-1, Math.min(1, buf[i])) * 32767) | 0, 44 + i * 2);
    fs.writeFileSync(path.join(WORK, 'sfx.wav'), pcm); }
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  const pre = path.join(WORK, 'premix.wav'), mixWav = path.join(WORK, 'mix.wav');
  const raw = path.join(WORK, 'music.wav'), loopWav = path.join(WORK, 'music_loop.wav'), Ts = T.toFixed(4);
  // (two inputs, not asplit: with asplit + amix, ffmpeg 6.1 ended the mix after 0.02 s)
  ff(['-i', raw, '-i', raw, '-filter_complex', `[0]atrim=1:${(1 + T).toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=1:curve=qsin[a];[1]atrim=${(1 + T).toFixed(4)}:${(2 + T).toFixed(4)},asetpts=PTS-STARTPTS,afade=t=out:d=1:curve=qsin,apad=whole_dur=${Ts}[b];[a][b]amix=inputs=2:duration=first:normalize=0[o]`, '-map', '[o]', loopWav]);
  ff(['-i', loopWav, '-i', path.join(WORK, 'sfx.wav'), '-filter_complex',
    `[0:a]atrim=0:${Ts},asetpts=PTS-STARTPTS[m];[1:a]volume=0.55,aformat=channel_layouts=stereo[s];[m][s]amix=inputs=2:duration=first:normalize=0[a]`,
    '-map', '[a]', '-ar', '44100', pre]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-dress-noodle-christmas-rednote.mp4' : 'doodle-doggo-dress-noodle-christmas.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '19', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
