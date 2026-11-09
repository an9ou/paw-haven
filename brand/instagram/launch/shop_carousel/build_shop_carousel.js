// v2.24 "Kind shop" launch CAROUSEL (HOLD: post only after the Game Manager confirms the shop is live; docs/marketing/KIND_SHOP_CAROUSEL.md).
// 8 slides, 1080 x 1350 JPG, sketchbook paper (as make.js / wardrobe_post): Caveat, pencil boxes, tape, pastel fills inside the lines.
// Every word follows V224.md and the game's own shop text (game/src/52_kindshop.js) on the claude/kind-shop branch; the script reads that file
// and stops if a line it quotes has changed. No prices on any slide (cash or coins). No ads (V224.md 0: no rewarded ads in this release).
//   1 cover    NEW · "a kind shop" · "support the game. it's complete without paying." · Noodle in Tokyo Street with sneakers, a burst of items
//   2 rule     "we never sell dogs." · Bond, welfare, chances · no loot boxes · no random paid rewards · Sparkle stays free · a confirm step
//   3 support  Supporter Pack: Golden Paw Cottage, Golden Name Tag, Founding Friend badge, Gerald's letter + the four perks (52_kindshop.js g_*)
//   4 tokyo    Tokyo Street: Noodle dressed, the six outfits, "NEW: a feet slot!"
//   5 cozy     Cozy Winter: the six things for the house
//   6 tools    Robo Scoop, Garden Sprinkler, Auto Water Bowl; off in Settings; the hand way always works; nothing bad happens without them
//   7 earn     "earn it by playing": everything except the Supporter Pack and the coins; complete without paying; ask a grown-up; Stripe
//   8 thanks   "made by one person. thank you for helping!" + the logo, doodledoggo.app, Instagram, X, YouTube (brand/kids/endcard.js icons)
// The art is the branch's own (world/pawart_shop.js PawArt.SHOP / PawArt.item / PawArt.house, dogs/pawart_dogs.js wearables on Noodle).
// Checks on every slide (the build stops on a miss): pill and card text ink-centred (../centre_text.js centreCheck), everything inside the
// 60 px margins, dogs and items never closer than 28 px (apartCheck), tiles never touching.
//
//   git archive origin/claude/kind-shop dogs world game/src/52_kindshop.js V224.md | tar -x -C <dir>
//   ART_ROOT=<dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_carousel/build_shop_carousel.js [slide numbers, e.g. 1,4]
//   Output: brand/instagram/launch/shop_carousel/kind-shop-1.jpg ... kind-shop-8.jpg (+ kind-shop-1-thumb.png, the cover at 270 px, not in git)
const path = require('path'), fs = require('fs'), os = require('os');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = path.resolve(process.env.ART_ROOT || ROOT);
if (!fs.existsSync(path.join(ART_ROOT, 'world', 'pawart_shop.js'))) throw new Error('ART_ROOT must hold the claude/kind-shop art (world/pawart_shop.js)');
const ONLY = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const W = 1080, H = 1350, N = 8;

// ---- the facts, from the branch's own code (nothing typed from memory) ----
const KSRC = fs.readFileSync(path.join(ART_ROOT, 'game', 'src', '52_kindshop.js'), 'utf8');
const V224 = fs.readFileSync(path.join(ART_ROOT, 'V224.md'), 'utf8');
const tt = (k) => { const m = new RegExp("tt\\('" + k.replace('.', '\\.') + "', '([^']+)'").exec(KSRC); if (!m) throw new Error('no ' + k + ' in 52_kindshop.js'); return m[1]; };
const arr = (name) => { const m = new RegExp('const ' + name + " = \\[([^\\]]+)\\]").exec(KSRC); if (!m) throw new Error('no ' + name); return m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')); };
const need = (cond, what) => { if (!cond) throw new Error('the kind shop text changed: ' + what + ' (check the slide)'); };
const TOKYO = arr('KS_TOKYO'), COZY = arr('KS_COZY_DECOR').concat(['Tea-Cosy Bed']);
need(/KS_COZY_BED = 'Tea-Cosy Bed'/.test(KSRC) && /KS_HOUSE = 'Golden Paw Cottage'/.test(KSRC) && /KS_TAG = 'Golden Name Tag'/.test(KSRC), 'names');
need(tt('ks.why_text').includes('made by one person') && tt('ks.why_text').includes('except the Supporter Pack and the coins can also be earned by playing') && tt('ks.why_text').includes('the game is complete without paying'), 'ks.why_text');
need(V224.includes('We sell coins and looks, never dogs, Bond, welfare or chances. No loot boxes or random paid rewards, and the game is complete without paying.'), 'the shop rule (V224.md 0)');
need(V224.includes('Sparkle stays free and is never sold') && V224.includes('Every purchase has a confirm step'), 'V224.md 0 Sparkle / confirm');
need(/No rewarded ads in this release/.test(V224), 'ads: the slides say nothing about ads');
need(tt('ks.l_supporter').includes('Only once, never for coins.'), 'ks.l_supporter');
need(tt('ks.g_coins') === '{n} coins, once' && /KS_SUP_COINS = 2000/.test(KSRC), 'ks.g_coins');
need(tt('ks.g_walk') === '+20% coins from walks' && tt('ks.g_crops') === 'Crops grow 25% faster' && tt('ks.g_gift') === 'A second calendar gift every day (a treat, food or seeds)', 'Supporter perks');
need(tt('ks.g_badge') === 'A Founding Friend badge on your Dog Card and friend card', 'ks.g_badge');
need(tt('ks.l_tokyo').includes('Six street outfits, with sneakers for a new Feet slot. Looks only.') && tt('ks.l_cozy').includes('Six cosy things for the house') && tt('ks.l_cozy').includes('Looks only.'), 'looks packs');
need(tt('ks.l_robo') === 'Tidies one pee or poop at home once a game hour. Never in town.' && tt('ks.l_sprinkler') === 'Waters a dry veggie plot back to full.' && tt('ks.l_bowl') === 'Fills the water bowl and your dog drinks when it is ready.', 'tool lines');
need(tt('ks.tools_note').includes('Nothing bad happens') && tt('ks.g_switch') === 'You can switch it off in Settings.' && V224.includes('the hand way always works'), 'tools note');
need(tt('ks.ask') === 'Ask a grown-up before you buy. Payments are made on Stripe. We never see card details.', 'ks.ask');

// ---- the words on the slides ----
const TX = {
  1: { tag: 'NEW', head: 'a kind shop', sub: ['support the game.', "it's complete without paying."] },
  2: { tag: 'our shop rule', head: 'we never sell dogs.', sub: 'or Bond, welfare or chances.', cards: ['no loot boxes', 'no random paid rewards', 'Sparkle stays free', 'a confirm step on every purchase'], dog: 'not in the shop' },
  3: { tag: 'a thank-you pack', head: 'Supporter Pack', sub: 'only once. never for coins.',
    items: [['Golden Paw Cottage'], ['Golden Name Tag'], ['Founding Friend', 'badge'], ["Gerald's", 'thank-you letter']],
    perks: [['walkcoins', ['+20% coins', 'from walks']], ['cropsfast', ['crops grow', '25% faster']], ['giftplus', ['a second calendar gift', 'every day: a treat,', 'food or seeds']], ['coins3', ['2,000 coins,', 'once']]] },
  4: { tag: 'looks pack', head: 'Tokyo Street', sub: '6 outfits. looks only.', feet: 'NEW: a feet slot!' },
  5: { tag: 'looks pack', head: 'Cozy Winter', sub: '6 cosy things for the house. looks only.' },
  6: { head: 'comfort tools', sub: 'little helpers, if you want them.',
    tools: [['Robo Scoop', ['tidies one pee or', 'poop at home']], ['Garden Sprinkler', ['waters a dry', 'veggie plot']], ['Auto Water Bowl', ['fills the bowl,', 'your dog drinks']]],
    cards: ['switch them off any time in Settings', 'the hand way always works', 'nothing bad happens without them'] },
  7: { tag: 'for everyone', head: 'earn it by playing', card: ['everything except the Supporter Pack', 'and the coins can also be', 'earned by playing.'],
    also: 'also for coins', complete: 'the game is complete without paying.', ask: ['ask a grown-up before you buy.', 'payments are made on Stripe.'] },
  8: { head: 'made by one person.', sub: 'thank you for helping!' },
};
const NOODLE = { body: 'Sukajan Jacket', head: 'Bucket Hat', eyes: 'Round Shades', neck: 'Paw Tote', feet: 'Little Sneakers' };
Object.values(NOODLE).forEach((n) => need(TOKYO.includes(n), n + ' in Tokyo Street'));
const LOGO_INNER = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, '').trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
const ARTS = ['dogs/pawart_dogs.js', ...fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-g]\.js$/.test(f)).sort().map((f) => 'world/' + f), 'world/pawart_shop.js'];

// ---- the page (runs in the browser; CENTRE_JS, SAFE_JS and ENDCARD_JS are loaded before it) ----
function page(C) {
  const PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', YEL = '#FFE3A1', PINK = '#F28FA5', MINT = '#CDEBD8', BLUE = '#CFE3F4', LAV = '#E0D5F0', PEACH = '#FBD9C4', MUTED = '#8A7468', DOT = '#E3D2BA', GOLD = '#F6D27A';
  const F = 'Caveat', W = C.W, H = C.H, CX = W / 2, M = 60, TX = C.TX;
  const $ = (i) => document.getElementById(i), f1 = (n) => Math.round(n * 10) / 10;
  // ---- pencil lines (make.js) ----
  function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rrPts(x0, y0, x1, y1, r, n) { const P = Math.PI; r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
    const ln = (ax, ay, bx, by) => ({ len: Math.hypot(bx - ax, by - ay), f: (t) => [ax + (bx - ax) * t, ay + (by - ay) * t] });
    const arc = (cx, cy, a0, a1) => ({ len: Math.abs(a1 - a0) * r, f: (t) => { const a = a0 + (a1 - a0) * t; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; } });
    const segs = [ln(x0 + r, y0, x1 - r, y0), arc(x1 - r, y0 + r, -P / 2, 0), ln(x1, y0 + r, x1, y1 - r), arc(x1 - r, y1 - r, 0, P / 2), ln(x1 - r, y1, x0 + r, y1), arc(x0 + r, y1 - r, P / 2, P), ln(x0, y1 - r, x0, y0 + r), arc(x0 + r, y0 + r, P, 1.5 * P)];
    const L = segs.reduce((a, g) => a + g.len, 0), pts = [];
    for (let i = 0; i < n; i++) { let d = i / n * L; for (const g of segs) { if (d <= g.len) { pts.push(g.f(g.len ? d / g.len : 0)); break; } d -= g.len; } }
    return pts; }
  function wobble(pts, rnd, amp, start, span) { const n = pts.length, s0 = Math.floor(start * n), cnt = Math.floor(span * n), o = []; let ox = 0, oy = 0;
    for (let i = 0; i <= cnt; i++) { ox = ox * 0.78 + (rnd() - 0.5) * amp; oy = oy * 0.78 + (rnd() - 0.5) * amp; const p = pts[(s0 + i) % n]; o.push([p[0] + ox, p[1] + oy]); }
    let d = 'M' + f1(o[0][0]) + ' ' + f1(o[0][1]);
    for (let i = 1; i < o.length - 1; i++) d += 'Q' + f1(o[i][0]) + ' ' + f1(o[i][1]) + ' ' + f1((o[i][0] + o[i + 1][0]) / 2) + ' ' + f1((o[i][1] + o[i + 1][1]) / 2);
    const l = o[o.length - 1]; return d + 'L' + f1(l[0]) + ' ' + f1(l[1]); }
  function pencil(pts, seed, amp, w, col, span) { col = col || PEN; span = span || 1.03; const rnd = seeded(seed), a = wobble(pts, rnd, amp, rnd(), span), b = wobble(pts, rnd, amp * 0.9, rnd(), span - 0.08);
    return '<g fill="none" stroke="' + col + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + a + '" stroke-width="' + w + '"/><path d="' + b + '" stroke-width="' + f1(w * 0.52) + '" opacity=".55"/></g>'; }
  const box = (x, y, w, h, r, seed, amp, lw, col) => pencil(rrPts(x, y, x + w, y + h, r, 110), seed, amp == null ? 2.2 : amp, lw || 4.2, col);
  // a pastel wash kept 7 px inside its pencil box (the colour stays inside the lines), with a light hatch
  const wash = (x, y, w, h, r, fill, hatch) => '<rect x="' + (x + 7) + '" y="' + (y + 7) + '" width="' + (w - 14) + '" height="' + (h - 14) + '" rx="' + Math.max(4, r - 7) + '" fill="' + fill + '"/>' + (hatch ? '<rect x="' + (x + 7) + '" y="' + (y + 7) + '" width="' + (w - 14) + '" height="' + (h - 14) + '" rx="' + Math.max(4, r - 7) + '" fill="url(#hatch)"/>' : '');
  const tile = (x, y, w, h, fill, seed, o) => { o = o || {}; return '<g>' + '<rect x="' + (x + 8) + '" y="' + (y + 11) + '" width="' + w + '" height="' + h + '" rx="26" fill="' + PEN + '" opacity=".08"/>' + wash(x, y, w, h, 26, fill, o.hatch) + '<rect data-tile="' + seed + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none"/>' + box(x, y, w, h, 26, seed) + '</g>'; };
  const tape = (cx, cy, w, h, rot, col) => '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"><rect x="' + (cx - w / 2) + '" y="' + (cy - h / 2) + '" width="' + w + '" height="' + h + '" fill="' + (col || PINK) + '" opacity=".6"/><rect x="' + (cx - w / 2) + '" y="' + (cy - h / 2) + '" width="' + w + '" height="' + h + '" fill="url(#stripe)" opacity=".5"/></g>';
  const spark = (x, y, s, rot) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')"><path d="M0 -14 Q1.5 -1.5 14 0 Q1.5 1.5 0 14 Q-1.5 1.5 -14 0 Q-1.5 -1.5 0 -14Z" fill="' + YEL + '" stroke="' + PEN + '" stroke-width="' + f1(2.6 / s) + '" stroke-linejoin="round"/></g>';
  const heart = (x, y, s, rot) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')"><path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12Z" fill="' + PINK + '" fill-opacity=".8" stroke="' + PEN + '" stroke-width="' + f1(2.6 / s) + '" stroke-linejoin="round"/></g>';
  const crayon = (pts, seed, w, col) => { const rnd = seeded(seed), one = (a) => { const o = pts.map(([x, y]) => [x + (rnd() - 0.5) * a, y + (rnd() - 0.5) * a]); let d = 'M' + f1(o[0][0]) + ' ' + f1(o[0][1]);
      for (let i = 1; i < o.length - 1; i++) d += 'Q' + f1(o[i][0]) + ' ' + f1(o[i][1]) + ' ' + f1((o[i][0] + o[i + 1][0]) / 2) + ' ' + f1((o[i][1] + o[i + 1][1]) / 2); const l = o[o.length - 1]; return d + 'L' + f1(l[0]) + ' ' + f1(l[1]); };
    return '<g fill="none" stroke="' + col + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + one(2) + '" stroke-width="' + w + '"/><path d="' + one(2.8) + '" stroke-width="' + f1(w * 0.5) + '" opacity=".6"/></g>'; };
  // ---- text ----
  function fitS(s, size, maxW) { while (size > 24) { const k = inkOf(s, size, F); if (k.L + k.R <= maxW) return size; size -= 2; } return size; }
  const T = (lines, cx, cy, o) => { o = o || {}; return '<g data-ink' + (o.rot ? ' transform="rotate(' + o.rot + ' ' + cx + ' ' + cy + ')"' : '') + '>' + centred(lines, cx, cy, F).svg + '</g>'; };
  // a card: a pastel wash inside a pencil box, its lines ink-centred (centreCheck reads the first <rect>: the invisible box itself)
  const card = (x, y, w, h, lines, fill, seed) => '<g data-box><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none"/>' + wash(x, y, w, h, 24, fill) + box(x, y, w, h, 24, seed) + centred(lines, x + w / 2, y + h / 2, F).svg + '</g>';
  // the header: a small taped tag, the headline (pink crayon swash under it), the line under it
  function header(tag, head, sub, o) { o = o || {}; let s = '', y = o.y || 150;
    const hs = fitS(head, o.hs || 104, o.hw || 900), k = inkOf(head, hs, F), hw = k.L + k.R;
    // the tag sits clear above the headline's tallest letter; when that would push it past the margin, the whole header moves down
    let ty = Math.min(y - 64, y + 5 - k.A - 40); if (tag && ty < 104) { y += 104 - ty; ty = 104; }
    if (tag) { s += '<g transform="rotate(-3 ' + CX + ' ' + ty + ')">' + pill(tag, CX, ty, 44, F, { fill: o.tagFill || YEL, padX: 26 }) + '</g>'; }
    const hy = y + 34;
    s += crayon([[CX - hw / 2 + 10, hy + 18], [CX, hy + 6], [CX + hw / 2 - 10, hy + 14]], 7 + head.length, 24, PINK).replace('<g ', '<g opacity=".45" ');
    s += T([{ s: head, size: hs }], CX, y + 5);
    if (sub) { const ss = fitS(sub, 50, 900); s += T([{ s: sub, size: ss, fill: MUTED }], CX, y + 100); }
    if (o.maxY && y > o.maxY) throw new Error('the header of "' + head + '" moved down to ' + y);
    return s; }
  // the footer on every slide: the handle and the slide number, small (screenshots travel without us)
  const footer = (n) => T([{ s: C.HANDLES.ig + '   ' + n + '/' + C.N, size: 34, fill: MUTED }], CX, H - 86);
  // ---- the drawings: the branch's own art ----
  const A = window.PawArt, SH = A.SHOP, ART = {}, VB = {};
  const inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), vbOf = (s) => { const m = /viewBox="([^"]+)"/.exec(s); return m ? m[1].split(/[ ,]+/).map(Number) : [0, 0, 100, 100]; };
  function put(id, svg) { if (!svg) throw new Error('no art for ' + id); ART[id] = inner(svg); VB[id] = vbOf(svg); }
  ['Golden Name Tag', 'Founding Friend Badge', 'Thank-You Letter', 'Robo Scoop', 'Garden Sprinkler', 'Auto Water Bowl', 'Cable-Knit Rug', 'Doggy Snow Globe', 'Cardboard Fireplace', 'Woolly Armchair', 'Tea-Cosy Bed', 'Cocoa Mug Lamp'].forEach((n) => put(n, SH.prop(n)));
  put('Golden Paw Cottage', A.house('Golden Paw Cottage')); put('lampLit', A.prop('kslamp', { lit: 1 }));
  C.TOKYO.forEach((n) => put(n, A.item(n)));
  ['walkcoins', 'cropsfast', 'giftplus', 'coins3'].forEach((n) => put('i:' + n, SH.icon(n)));
  const dog = (o) => A.dog('dachs', Object.assign({ anim: false }, o));
  if (A.DOGS.find((d) => d.key === 'dachs').name !== 'Noodle') throw new Error('the dachshund is not Noodle');
  put('dressed', dog({ pose: 'idle', outfit: C.NOODLE })); put('dressedHappy', dog({ pose: 'happy', outfit: C.NOODLE }));
  put('plainSit', dog({ pose: 'sit' })); put('walk', dog({ pose: 'walk', outfit: { neck: 'Paw Tote' } }));
  const BOX = {}, artG = (id) => '<g transform="translate(' + (-VB[id][0]) + ' ' + (-VB[id][1]) + ')">' + ART[id] + '</g>';
  // the drawn box of each drawing, by its INK (rendered to a canvas): getBBox counts the masked hatching of the shop art, so it is too big
  window.measureArt = async function () { const K = 4, cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    for (const id of Object.keys(ART)) { const v = VB[id], w = Math.ceil(v[2] * K), h = Math.ceil(v[3] * K); cv.width = w; cv.height = h; cx.clearRect(0, 0, w, h);
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="' + v.join(' ') + '">' + ART[id] + '</svg>';
      const im = new Image(); await new Promise((ok, no) => { im.onload = ok; im.onerror = () => no(new Error('art did not render: ' + id)); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
      cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) throw new Error('no ink in ' + id); BOX[id] = [x0 / K, y0 / K, (x1 - x0 + 1) / K, (y1 - y0 + 1) / K]; }
    return Object.keys(BOX).length; };
  // a drawing by its drawn box: centre x, bottom y, fitted into maxW x maxH (data-apart: the 28 px rule)
  // the drawing carries no data-apart itself: an invisible rect of its ink box does (apartCheck reads it; the art's masks would make the box too big)
  function place(id, cx, bot, maxW, maxH, o) { o = o || {}; const b = BOX[id], s0 = Math.min(maxW / b[2], maxH / b[3]), w = b[2] * s0, h = b[3] * s0;
    return '<g data-art transform="translate(' + f1(cx) + ' ' + f1(bot) + ')' + (o.rot ? ' rotate(' + o.rot + ')' : '') + ' scale(' + s0.toFixed(4) + ') translate(' + f1(-(b[0] + b[2] / 2)) + ' ' + f1(-(b[1] + b[3])) + ')">' + artG(id) + '</g>'
      + '<rect data-apart="' + (o.name || id) + '" x="' + f1(cx - w / 2) + '" y="' + f1(bot - h) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="none"' + (o.rot ? ' transform="rotate(' + o.rot + ' ' + f1(cx) + ' ' + f1(bot) + ')"' : '') + '/>'; }
  const placeC = (id, cx, cy, maxW, maxH, o) => { const b = BOX[id], s0 = Math.min(maxW / b[2], maxH / b[3]); return place(id, cx, cy + b[3] * s0 / 2, maxW, maxH, o); };

  // ---- the slides ----
  const S = {};
  S[1] = () => { const t = TX[1]; let s = '';
    s += '<g transform="rotate(-6 ' + CX + ' 128)">' + pill(t.tag, CX, 128, 60, F, { fill: PINK, padX: 34 }) + '</g>' + spark(CX - 112, 104, 1.3, -12) + spark(CX + 118, 150, 1.0, 14);
    const hs = 168, k = inkOf(t.head, hs, F), hw = k.L + k.R;
    s += crayon([[CX - hw / 2 + 14, 302], [CX, 286], [CX + hw / 2 - 14, 296]], 31, 34, PINK).replace('<g ', '<g opacity=".45" ');
    s += T([{ s: t.head, size: hs }], CX, 252);
    s += T([{ s: t.sub[0], size: 62 }, { s: t.sub[1], size: 62 }], CX, 404);
    // the burst: Noodle in Tokyo Street (sneakers on), big in the middle, six of the shop's own pictures round him
    s += '<ellipse cx="' + CX + '" cy="975" rx="250" ry="26" fill="' + PEN + '" opacity=".07"/>';
    s += place('dressed', CX, 985, 540, 420, { name: 'Noodle' });
    s += place('Golden Paw Cottage', 200, 690, 250, 210, { rot: -4 });
    s += place('Doggy Snow Globe', CX, 680, 150, 170, { rot: 3 });
    s += place('lampLit', 880, 690, 160, 200, { rot: 4 });
    s += place('Robo Scoop', 200, 1180, 180, 135, { rot: -6 });
    s += place('Woolly Armchair', 885, 1180, 180, 140, { rot: 6 });
    s += spark(370, 560, 1.3, 8) + spark(720, 600, 1.0, -10) + spark(110, 820, 1.0, 12) + spark(975, 830, 1.2, -6) + heart(345, 1120, 1.4, -14) + spark(735, 1130, 1.1, 18);
    // the logo, small, and a "swipe" note
    const lw = 300, lh = lw * 280 / 900; s += '<svg data-ink x="' + (CX - lw / 2) + '" y="' + (1182) + '" width="' + lw + '" height="' + f1(lh) + '" viewBox="0 0 900 280">' + C.LOGO + '</svg>';
    return s; };
  S[2] = () => { const t = TX[2]; let s = header(t.tag, t.head, t.sub, { y: 170, hs: 116 });
    const cw = 780, ch = 104, x = CX - cw / 2, fills = [MINT, BLUE, YEL, LAV];
    t.cards.forEach((c, i) => { const y = 345 + i * 126; s += card(x, y, cw, ch, [{ s: c, size: fitS(c, 54, cw - 80) }], fills[i], 21 + i); });
    s += place('plainSit', CX - 30, 1190, 340, 300, { name: 'Noodle' });
    s += '<g transform="rotate(-4 ' + (CX + 300) + ' 960)">' + pill(t.dog, CX + 300, 960, 46, F, { fill: CREAM, padX: 22 }) + '</g>';
    s += heart(CX - 260, 960, 1.8, -12) + heart(CX - 310, 1040, 1.1, 10) + spark(CX + 250, 1080, 1.2, 10) + spark(CX + 330, 1150, 0.9, -8);
    return s + footer(2); };
  S[3] = () => { const t = TX[3]; let s = header(t.tag, t.head, t.sub, { y: 170, tagFill: GOLD, hs: 96 });
    // the cottage, big, on the left; the tag, the badge and the letter on the right
    s += tile(70, 352, 450, 392, YEL, 31, { hatch: true }) + place('Golden Paw Cottage', 295, 664, 330, 280);
    s += T([{ s: t.items[0][0], size: 46 }], 295, 704);
    const rows = [['Golden Name Tag', t.items[1]], ['Founding Friend Badge', t.items[2]], ['Thank-You Letter', t.items[3]]];
    rows.forEach(([id, lab], i) => { const y = 352 + i * 134, x = 550, w = 460, h = 124; s += tile(x, y, w, h, [PEACH, BLUE, CREAM][i], 33 + i);
      s += placeC(id, x + 75, y + h / 2, 100, 92) + T(lab.map((l) => ({ s: l, size: fitS(l, 42, 300) })), x + 75 + 50 + (w - 125) / 2 + 2, y + h / 2); });
    // the perks, in the game's words (52_kindshop.js ks.g_*)
    t.perks.forEach(([ic, lab], i) => { const x = 70 + (i % 2) * 480, y = 772 + Math.floor(i / 2) * 218, w = 460, h = 198;
      s += tile(x, y, w, h, [MINT, LAV, PEACH, YEL][i], 41 + i) + placeC('i:' + ic, x + 78, y + h / 2, 92, 92, { name: ic });
      s += T(lab.map((l) => ({ s: l, size: fitS(l, lab.length > 2 ? 40 : 46, 290), pitch: lab.length > 2 ? 44 : 52 })), x + 78 + 46 + (w - 124) / 2, y + h / 2); });
    return s + footer(3); };
  S[4] = () => { const t = TX[4]; let s = header(t.tag, t.head, t.sub, { y: 170, hs: 96 });
    s += '<ellipse cx="' + CX + '" cy="582" rx="220" ry="22" fill="' + PEN + '" opacity=".07"/>' + place('dressed', CX, 590, 480, 280, { name: 'Noodle' });
    s += '<g transform="rotate(-4 690 655)">' + pill(t.feet, 690, 655, 44, F, { fill: PINK, padX: 22 }) + '</g>';
    s += crayon([[545, 650], [470, 640], [430, 606]], 91, 6, MUTED) + crayon([[426, 630], [430, 606], [452, 612]], 92, 6, MUTED);
    s += spark(170, 420, 1.3, 10) + spark(910, 400, 1.0, -8);
    const tw = 290, th = 240, gx = (W - 2 * 70 - 3 * tw) / 2, fills = [PEACH, MINT, BLUE, YEL, LAV, PINK + '66'];
    C.TOKYO.forEach((n, i) => { const x = 70 + (i % 3) * (tw + gx), y = 712 + Math.floor(i / 3) * (th + 20);
      s += tile(x, y, tw, th, fills[i], 51 + i) + placeC(n, x + tw / 2, y + 95, 190, 130) + T([{ s: n, size: fitS(n, 42, tw - 30) }], x + tw / 2, y + th - 42); });
    return s + footer(4); };
  S[5] = () => { const t = TX[5]; let s = header(t.tag, t.head, t.sub, { y: 170, tagFill: BLUE, hs: 96 });
    const tw = 290, th = 388, gx = (W - 2 * 70 - 3 * tw) / 2, fills = [PEACH, YEL, BLUE, LAV, MINT, PINK + '55'];
    const order = ['Woolly Armchair', 'Cocoa Mug Lamp', 'Doggy Snow Globe', 'Cardboard Fireplace', 'Tea-Cosy Bed', 'Cable-Knit Rug'];
    order.forEach((n) => { if (!C.COZY.includes(n)) throw new Error(n + ' is not in Cozy Winter'); }); if (order.length !== C.COZY.length) throw new Error('Cozy Winter has ' + C.COZY.length);
    order.forEach((n, i) => { const x = 70 + (i % 3) * (tw + gx), y = 356 + Math.floor(i / 3) * (th + 20), id = n === 'Cocoa Mug Lamp' ? 'lampLit' : n;
      s += tile(x, y, tw, th, fills[i], 61 + i, { hatch: i % 2 === 0 }) + place(id, x + tw / 2, y + th - 110, tw - 60, th - 150, { name: n });
      const words = n.split(' '), two = fitS(n, 42, tw - 30) < 40 ? [words.slice(0, words.length - 1).join(' '), words[words.length - 1]] : [n];
      s += T(two.map((l) => ({ s: l, size: 42, pitch: 44 })), x + tw / 2, y + th - 58 + (two.length - 1) * 4); });
    return s + footer(5); };
  S[6] = () => { const t = TX[6]; let s = header(null, t.head, t.sub, { y: 170 });
    const tw = 290, th = 430, gx = (W - 2 * 70 - 3 * tw) / 2, fills = [BLUE, MINT, YEL];
    t.tools.forEach(([n, d], i) => { const x = 70 + i * (tw + gx), y = 335;
      s += tile(x, y, tw, th, fills[i], 71 + i) + placeC(n, x + tw / 2, y + 120, 170, 170);
      const two = n.split(' ').length > 2 ? [n.split(' ').slice(0, 2).join(' '), n.split(' ').slice(2).join(' ')] : n.split(' ');
      s += T(two.map((l) => ({ s: l, size: 46, pitch: 46 })), x + tw / 2, y + 266);
      s += T(d.map((l) => ({ s: l, size: fitS(l, 36, tw - 34), fill: MUTED, pitch: 40 })), x + tw / 2, y + 370); });
    const cw = 820, ch = 96, fl = [CREAM, CREAM, CREAM];
    t.cards.forEach((c, i) => { s += card(CX - cw / 2, 805 + i * 116, cw, ch, [{ s: c, size: fitS(c, 50, cw - 80) }], fl[i], 77 + i); });
    return s + footer(6); };
  S[7] = () => { const t = TX[7]; let s = header(t.tag, t.head, null, { y: 170, tagFill: MINT, hs: 110 });
    s += card(110, 300, 860, 220, t.card.map((l) => ({ s: l, size: 52, pitch: 60 })), YEL, 81);
    s += tape(CX - 330, 304, 120, 34, -8, PINK) + tape(CX + 330, 304, 120, 34, 7, BLUE);
    const pick = ['Bucket Hat', 'Woolly Armchair', 'Garden Sprinkler'];
    pick.forEach((id, i) => { const tw = 270, gx = (W - 2 * 100 - 3 * tw) / 2, x = 100 + i * (tw + gx), y = 556;
      s += tile(x, y, tw, 240, [PEACH, LAV, MINT][i], 85 + i) + placeC(id, x + tw / 2, y + 100, 150, 135) + '<g transform="rotate(' + [-3, 2, -2][i] + ' ' + (x + tw / 2) + ' ' + (y + 200) + ')">' + pill(t.also, x + tw / 2, y + 200, 36, F, { fill: CREAM, padX: 16 }) + '</g>'; });
    s += place('walk', CX, 1020, 340, 190, { name: 'Noodle' }) + spark(CX - 250, 910, 1.2, -8) + heart(CX + 250, 930, 1.3, 12);
    s += T([{ s: t.complete, size: fitS(t.complete, 54, 900) }], CX, 1084);
    s += T(t.ask.map((l) => ({ s: l, size: 38, fill: MUTED, pitch: 42 })), CX, 1176);
    return s + footer(7); };
  S[8] = () => { const t = TX[8]; let s = '';
    s += T([{ s: t.head, size: 100 }], CX, 140);
    const ss = 84, k = inkOf(t.sub, ss, F), hw = k.L + k.R;
    s += crayon([[CX - hw / 2 + 10, 262], [CX, 250], [CX + hw / 2 - 10, 258]], 99, 26, PINK).replace('<g ', '<g opacity=".45" ');
    s += T([{ s: t.sub, size: ss }], CX, 232);
    s += place('dressedHappy', CX, 600, 380, 300, { name: 'Noodle' }) + heart(CX - 270, 380, 1.8, -14) + heart(CX + 275, 420, 1.3, 12) + spark(CX + 230, 330, 1.2, 8) + spark(CX - 230, 520, 1.0, -10);
    const LW = 640, LH = LW * 280 / 900; s += '<svg data-ink x="' + (CX - LW / 2) + '" y="630" width="' + LW + '" height="' + f1(LH) + '" viewBox="0 0 900 280">' + C.LOGO + '</svg>';
    s += pill('doodledoggo.app', CX, 905, 66, F, { fill: YEL, padX: 44 });
    // the socials, each icon with its handle (brand/kids/endcard.js icons), stacked and centred as one block
    const AF = 'Andika', size = 44, ic = 64, gap = 18, rows = [['ig', C.HANDLES.ig], ['x', C.HANDLES.x], ['yt', C.HANDLES.yt]].map(([kd, h]) => { const kk = inkOf(h, size, AF); return { kd, h, kk, w: ic + gap + kk.L + kk.R }; });
    const mw = Math.max(...rows.map((r) => r.w)), x0 = CX - mw / 2;
    rows.forEach((r, i) => { const y = 1008 + i * 90; s += '<g data-ink>' + endIcons(r.kd, x0 + ic / 2, y, ic) + '<text x="' + f1(x0 + ic + gap + r.kk.L) + '" y="' + f1(y + (r.kk.A - r.kk.D) / 2) + '" font-family="' + AF + '" font-weight="700" font-size="' + size + '" fill="' + PEN + '">' + r.h + '</text></g>'; });
    return s + footer(8); };

  window.draw = function (n) {
    $('frame').innerHTML = box(30, 30, W - 60, H - 60, 30, 11 + n, 3, 5);
    $('c').innerHTML = S[n]();
    const sv = $('sv'), bad = centreCheck(sv).map((b) => 'not centred: ' + b);
    for (const e of [...$('c').children].filter((e) => !e.hasAttribute('data-art')).concat([...$('c').querySelectorAll('[data-apart]')])) { const r = e.getBoundingClientRect(); if (!r.width) continue;
      if (r.left < M || r.right > W - M || r.top < M || r.bottom > H - M) bad.push('outside the 60 px margin: ' + ((e.textContent || '').trim().slice(0, 30) || e.getAttribute('data-apart') || e.tagName) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round)); }
    // dogs and items: inside their own tile, or 28 px apart from each other
    apartCheck($('c'), 28).forEach((b) => bad.push(b));
    const tiles = [...$('c').querySelectorAll('[data-tile]')].map((e) => e.getBoundingClientRect());
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) { const a = tiles[i], b = tiles[j]; if (Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom) < 10) bad.push('tiles ' + i + ' and ' + j + ' touch'); }
    // every drawing that sits in a tile stays inside it
    $('c').querySelectorAll('[data-apart]').forEach((e) => { const r = e.getBoundingClientRect(); const t = tiles.find((b) => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top);
      if (t && (r.left < t.left + 8 || r.right > t.right - 8 || r.top < t.top + 8 || r.bottom > t.bottom - 8)) bad.push(e.getAttribute('data-apart') + ' leaves its tile'); });
    // the text must not run into a drawing
    const arts = [...$('c').querySelectorAll('[data-apart]')].map((e) => [e.getAttribute('data-apart'), e.getBoundingClientRect()]);
    $('c').querySelectorAll('text').forEach((e) => { const r = e.getBoundingClientRect(); arts.forEach(([nm, a]) => { if (r.left < a.right - 4 && r.right > a.left + 4 && r.top < a.bottom - 4 && r.bottom > a.top + 4) bad.push('"' + e.textContent.slice(0, 24) + '" over ' + nm); }); });
    // text never runs over a tile's edge (inside a tile, or clear of it)
    $('c').querySelectorAll('text').forEach((e) => { const r = e.getBoundingClientRect(); tiles.forEach((a) => { const over = r.left < a.right && r.right > a.left && r.top < a.bottom + 2 && r.bottom > a.top - 2, inside = r.left >= a.left && r.right <= a.right && r.top >= a.top && r.bottom <= a.bottom;
      if (over && !inside) bad.push('"' + e.textContent.slice(0, 24) + '" runs over a tile edge'); }); });
    return bad; };
}

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
${ARTS.map((a) => `<script src="file://${path.join(ART_ROOT, a)}"></script>`).join('\n')}
<style>html,body{margin:0;background:#FFF8EC}svg{display:block}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.3" fill="#E3D2BA"/></pattern>
<pattern id="stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="#fff" opacity=".5"/></pattern>
<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 7H14" stroke="#5B3D32" stroke-width="2" stroke-linecap="round" opacity=".08"/></pattern></defs>
<rect width="${W}" height="${H}" fill="#FFF8EC"/><rect width="${W}" height="${H}" fill="url(#dots)"/><g id="frame"></g><g id="c"></g></svg>
<span style="font:700 20px Caveat">a</span><span style="font:700 20px Andika">a</span>
<script>${CENTRE_JS}${SAFE_JS}${ENDCARD_JS}</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const pg = path.join(os.tmpdir(), `shop_carousel_${process.pid}.html`); fs.writeFileSync(pg, html);
  await p.goto('file://' + pg); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all(['700 40px Caveat', '700 40px Andika'].map((f) => document.fonts.load(f, 'a@.'))));
  await p.addScriptTag({ content: `(${page.toString()})(${JSON.stringify({ W, H, N, TX, TOKYO, COZY, NOODLE, LOGO: LOGO_INNER, HANDLES: handles() })});` });
  console.log('measured', await p.evaluate(() => window.measureArt()), 'drawings');
  let fail = [];
  for (let n = 1; n <= N; n++) {
    if (ONLY && !ONLY.includes(n)) continue;
    const bad = await p.evaluate((n) => window.draw(n), n);
    if (bad.length) { fail.push('slide ' + n + ':\n  ' + bad.join('\n  ')); }
    const out = path.join(OUT, `kind-shop-${n}.jpg`);
    await p.screenshot({ path: out, type: 'jpeg', quality: 92 });
    console.log((bad.length ? 'CHECK FAILED ' : 'ok ') + path.relative(ROOT, out), Math.round(fs.statSync(out).size / 1024) + ' KB');
  }
  if (!ONLY || ONLY.includes(1)) { // the cover as the grid shows it: 270 px wide
    const t = await b.newPage({ viewport: { width: 270, height: 338 } });
    await t.setContent(`<body style="margin:0"><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(OUT, 'kind-shop-1.jpg')).toString('base64')}" style="width:270px;height:338px;display:block"></body>`);
    await t.screenshot({ path: path.join(OUT, 'kind-shop-1-thumb.png') });
  }
  await b.close(); fs.rmSync(pg);
  if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
