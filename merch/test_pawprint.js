// Merch: PawPrint in Node. The recipe, the wire, the two readers, the art coverage, and (Part 1) the print files: the product table, the tee, mug
// and sticker sheet layouts, line weight, names and the print page; then the real print page rendered in Chromium (skipped without Playwright).
//   NODE_PATH=$(npm root -g) node tools/merch_build.js && NODE_PATH=$(npm root -g) node merch/test_pawprint.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let fails = 0, checks = 0; const ok = (c, l) => { checks++; console.log((c ? '  ok  ' : '  FAIL ') + l); if (!c) fails++; };
const before = Object.keys(globalThis).sort().join();
const P = require('./dist/pawprint.js');
ok(Object.keys(globalThis).sort().join() === before && !globalThis.PawArt && !globalThis.PawGenes, 'PawPrint loads in Node and leaves no globals (no PawArt, PawGenes, window, document, storage)');

console.log('# the wear list: every wearable the art draws, Dog Card outfits first');
{
  const src = fs.readFileSync(path.join(ROOT, 'dogs/pawart_dogs.js'), 'utf8').replace('PA.dog=dog;', 'PA.__OUT=OUT;PA.dog=dog;');
  const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(src, ctx); const OUT = ctx.window.PawArt.__OUT;
  const art = []; Object.keys(OUT).forEach((s) => OUT[s].forEach((n) => art.push(s + ':' + n)));
  const mine = new Set(P.WEAR.map((w) => w.slot + ':' + w.n));
  const missing = art.filter((x) => !mine.has(x) && x !== 'body:Doggy Life Vest');
  ok(!missing.length, 'every art wearable is in WEAR (the pool life vest is draw-only): ' + (missing.join(', ') || P.WEAR.length + ' items'));
  ok(P.WEAR.every((w) => w.slot === 'charm' ? w.n === 'Crayon Medal' : art.includes(w.slot + ':' + w.n)), 'every WEAR item is drawn by the art in its own slot (charm: only the Crayon Medal)');
  const DC = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'game/src/40_dogcards.js'), 'utf8').match(/const DC_OUTFITS = (\[[\s\S]*?\]);/)[1]);
  ok(DC.every((n, i) => P.WEAR[i].n === n), 'WEAR starts with DC_OUTFITS in its order (' + DC.length + '): a Dog Card outfit index is a WEAR index');
  ok(P.BREEDS.length === 40 && P.BREEDS.every((k) => P.check({ v: 1, b: P.BREEDS.indexOf(k), g: null, e: 0, p: 0, a: 0, s: 'm' }).ok), 'all 40 breeds are known to the art');
}

console.log('# recipe -> wire -> recipe');
let a = 7; const rnd = () => { a = (a * 1103515245 + 12345) >>> 0; return a / 4294967296; };
const rec = () => { const r = { v: 1, b: Math.floor(rnd() * 40), g: rnd() < 0.05 ? null : Array.from({ length: 6 }, () => Math.floor(rnd() * 3)).join('') + (rnd() < 0.2 ? 'a' + Math.floor(rnd() * 3) : '') + (rnd() < 0.2 ? 'i' + Math.floor(rnd() * 3) : ''), e: Math.floor(rnd() * 4), p: Math.floor(rnd() * 4294967296), a: Math.floor(rnd() * 3), s: rnd() < 0.5 ? 'f' : 'm' };
  if (rnd() < 0.3) r.sp = 1; if (rnd() < 0.3) { r.h = (r.b + 1 + Math.floor(rnd() * 38)) % 40; }
  const slots = {}; const o = []; for (let i = 0; i < 6; i++) { const w = Math.floor(rnd() * P.WEAR.length); if (!slots[P.WEAR[w].slot]) { slots[P.WEAR[w].slot] = 1; o.push(w); } } if (o.length && rnd() < 0.8) r.o = o;
  if (rnd() < 0.7) r.n = ['Mochi', 'Sir Wigglesworth III', 'Zoë', 'Łucja', 'Ōtarō', 'Bo', "D'Artagnan"].map(P.cleanName).filter(Boolean)[Math.floor(rnd() * 6)];
  return r; };
let same = 0; const N = 2000; for (let i = 0; i < N; i++) { const r = rec(); const d = P.merchDecode(P.merchEncode(r)); if (d.ok && JSON.stringify(d.dogs[0]) === JSON.stringify(Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)))) same++; else if (same + 5 > i) console.log(JSON.stringify(r), JSON.stringify(d)); }
ok(same === N, `${same}/${N} random recipes come back field for field from the link`);
const typical = [{ v: 1, b: 0, g: '211000', e: 0, p: 2840919217, a: 0, s: 'f', o: [1, 0], n: 'Mochi' }, { v: 1, b: 18, g: '112210', e: 1, p: 81723411, a: 0, s: 'm', n: 'Duke' }, { v: 1, b: 3, g: '202000', e: 1, p: 4123, a: 1, s: 'f', n: 'Noodle' }, { v: 1, b: 2, g: '220000', e: 0, p: 55, a: 0, s: 'm', sp: 1, o: [3, 21, 53], n: 'Honey' }, { v: 1, b: 37, g: '211110a1', e: 2, p: 991, a: 0, s: 'f', h: 11, o: [60, 4, 63, 51, 53, 85], n: 'Sir Wigglesworth' }];
const one = P.merchEncode(typical[0]), five = P.merchEncode(typical), bare = P.merchEncode(Object.assign({}, typical[1], { n: undefined }));
ok(one.length <= 32 && five.length <= 200, `link size: one dog with a name and two pieces ${one.length} chars (#p=${one}), one bare dog ${bare.length}, a pack of 5 with names and outfits ${five.length} chars`);
ok(JSON.stringify(P.merchFromHash('#p=' + five).dogs.map((x) => x.recipe)) === JSON.stringify(typical.map((r) => JSON.parse(JSON.stringify(r)))), 'merchFromHash(#p=...) reads the pack of 5');
ok(P.merchFromHash('#utm=x&p=' + one + '&lang=ja').ok, 'other hash parameters around p= are fine');

console.log('# malformed and hostile input is refused, never throws');
const bad = ['', '#', '#p=', '#p=!!!', '#p=' + 'A'.repeat(5000), '#p=' + one.slice(0, -3), '#p=' + one + 'AA', '#q=' + one, null, 42, {}, '#p=' + one.replace(/^A/, 'B')];
ok(bad.every((h) => { try { const r = P.merchFromHash(h); return r.ok === false && Array.isArray(r.dogs) && !r.dogs.length; } catch (e) { return false; } }), 'empty, junk, cut, padded, oversized, wrong key, non-string and version-bumped links are refused (' + bad.length + ' cases)');
let flips = 0, refused = 0, threw = 0; const u = Buffer.from(five.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
for (let i = 0; i < u.length * 8; i++) { const v = Buffer.from(u); v[i >> 3] ^= 1 << (i & 7); const s = v.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); flips++; try { const r = P.merchDecode(s); if (!r.ok) refused++; } catch (e) { threw++; } }
ok(threw === 0 && refused === flips, `every one-bit flip of the pack link is caught (${refused}/${flips}; the 2-byte check)`);
let fuzz = 0, fthrew = 0; for (let i = 0; i < 20000; i++) { const L = Math.floor(rnd() * 60); let s = ''; for (let k = 0; k < L; k++) s += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[Math.floor(rnd() * 64)]; try { if (P.merchDecode(s).ok) fuzz++; } catch (e) { fthrew++; } }
ok(fthrew === 0, `20000 random strings: none throws, ${fuzz} happen to decode (each is then a valid game dog: check() ran)`);
const hostile = [{ v: 1, b: 99, g: null, e: 0, p: 0, a: 0, s: 'm' }, { v: 1, b: 0, g: '333333', e: 0, p: 0, a: 0, s: 'm' }, { v: 1, b: 0, g: null, e: 0, p: -1, a: 0, s: 'm' }, { v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', o: [1, 3] },
  { v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: 'x'.repeat(21) }, { v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', h: 0 }, { v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', url: 'http://x' }, JSON.parse('{"v":1,"b":0,"g":null,"e":0,"p":0,"a":0,"s":"m","__proto__":{"x":1}}'), { v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: 'ママ' }];
ok(hostile.every((r) => !P.check(r).ok), 'check() refuses a bad breed, genes, seed, two hats, 21 letters in the name, a mix of the same breed, extra fields (a URL, __proto__) and letters the print font has not');
ok(P.cleanName('  Sir​  Wiggles\n') === 'Sir Wiggles' && P.cleanName('Zoë') === 'Zoë' && P.cleanName('ポチ') === null && P.cleanName('x'.repeat(30)).length === 20, 'names: invisible characters and spaces cleaned, NFC, cut at 20, unprintable scripts refused (the buyer types a Latin name instead)');
ok(!P.svg({ v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: 'Bo & Co' }, { name: true }).includes('&') && !P.check({ v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: '<b>' }).ok, 'a name is only ever outlines in the print file, and < > cannot be in one (the merch page and order mails must still escape it as text)');
let tooMany = false; try { P.merchEncode(Array(9).fill(typical[0])); } catch (e) { tooMany = true; } ok(tooMany, 'a link carries at most ' + P.MAX_DOGS + ' dogs');

console.log('# the save reader');
const fakeSave = { v: 1, activeId: 'd2', coins: 5, dogs: [{ id: 'd1', key: 'shiba', name: 'Mochi', sex: 'female', genes: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, born: '2026-10-01', outfit: { head: 'Party Hat', eyes: null, neck: 'Red Bandana', body: null, feet: null, charm: 'Crayon Medal' } },
  { id: 'd2', key: 'dane', name: 'Duke the Great Dane of Doodle Town', sex: 'male', genes: { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'sp'], M: ['M', 'm'], Bl: ['bl', 'bl'] }, born: '2026-11-22', sparkle: true, artSeed: 12345, outfit: { head: null, neck: 'Unknown Future Hat' } },
  { id: 'd3', key: 'wolf', name: 'Nope', genes: {} }, { id: 'd4', key: 'pug', name: 'ポチ', mix: { head: 'beagle' } }] };
const fr = P.merchFromSave(JSON.stringify(fakeSave), { today: new Date('2026-11-24T10:00:00') });
ok(fr.ok && fr.dogs.length === 3 && fr.dogs[0].recipe.a === 0 && fr.dogs[1].recipe.a === 1 && fr.dogs[1].active && fr.dogs[1].name === 'Duke the Great Dane' && !fr.dogs[1].recipe.o && fr.dogs[0].recipe.o.length === 3 && fr.dogs[2].name === '' && fr.dogs[2].recipe.h === P.BREEDS.indexOf('beagle'),
  'merchFromSave: three dogs (an unknown breed skipped), ages from born, the active dog marked, the name cut at 20, an item the art does not know dropped, a name the font cannot print left out: ' + JSON.stringify(fr.dogs.map((x) => [x.key, x.name, x.recipe.a])));
const legacy = { v: 1, dog: { id: 'old', key: 'corgi', name: 'Biscuit', genes: null }, outfit: { head: 'Party Hat' } };
const lr = P.merchFromSave(JSON.stringify(legacy)); ok(lr.ok && lr.dogs[0].recipe.o[0] === 1 && lr.dogs[0].recipe.g === null, 'a v1.0-v1.3 save (one S.dog, the outfit at the top, no genes) still gives its dog');
const badSaves = ['', 'not json', '[]', '{"v":2,"dogs":[]}', JSON.stringify({ v: 1, dogs: 'x' }), JSON.stringify({ v: 1, dogs: [null, 1, 'a', { key: {} }] }), 'x'.repeat(9 * 1024 * 1024), null, undefined, JSON.stringify({ v: 1, dogs: Array(500).fill(fakeSave.dogs[0]) })];
ok(badSaves.every((s, i) => { try { const r = P.merchFromSave(s); return i === badSaves.length - 1 ? r.ok && r.dogs.length === 64 : !r.ok && !r.dogs.length; } catch (e) { return false; } }), 'empty, broken, wrong-version, junk and oversized saves give no dogs, never throw; a 500-dog save is read up to 64');

console.log('# the print SVG');
const s1 = P.svg(typical[3], { bg: 'none', w: 4500, h: 5400 }), s2 = P.svg(typical[0], { bg: 'yard', name: true, w: 3000, h: 3000 }), s3 = P.svg(typical[1], { bg: 'strip', name: true, w: 2700, h: 1050 }), s4 = P.svg(typical[2], { bg: 'none', border: 40, name: true, w: 1500, h: 1500 }), s5 = P.svg(typical[4], { bg: 'tile', pose: 'sit', name: 'Wiggles', w: 2000, h: 2000 });
const clean = (s) => !/<(script|foreignObject|image|text|style)\b/i.test(s) && !/(?:href|url)\s*[=(]\s*["']?(?!#)/i.test(s.replace(/url\(#[^)]*\)/g, ''));
ok([s1, s2, s3, s4, s5].every(clean), 'no script, image, text element, style sheet or outside link in any print SVG (the name is outlines; sizes ' + [s1, s2, s3, s4, s5].map((s) => Math.round(s.length / 1024) + ' KB').join(', ') + ')');
ok(/width="4500" height="5400"/.test(s1) && !/<rect width="4500"/.test(s1), 'dog only: transparent, at the asked size');


/* ======================= Part 1: the print files (PRINT_FILES.md, PART1.md) ======================= */
const DOGS = require('./sample_dogs.js')(P), readPNG = require('./png_lite.js'), NM = require('./names.js');
const MINPX = P.MIN_LINE_MM / 25.4 * 300;
console.log('# the product table');
{
  const T = P.PRODUCTS;
  ok(Object.keys(T).join() === 'tee,mug,stickers' && T.tee.w === 4500 && T.tee.h === 5400 && T.mug.w === 2700 && T.mug.h === 1050 && T.stickers.w === 1749 && T.stickers.h === 2481 && Object.values(T).every((p) => p.dpi === 300 && Math.abs(p.inches[0] * 300 - p.w) < 1 && Math.abs(p.inches[1] * 300 - p.h) < 1),
    'sizes at 300 dpi: tee 4500x5400 (15 x 18 in), mug 2700x1050 (9 x 3.5 in), sticker sheet 1749x2481 (5.83 x 8.27 in)');
  ok(T.tee.printful.placement === 'front_large' && T.tee.printful.technique === 'dtg' && T.tee.printful.product === 71 && T.mug.printful.technique === 'sublimation' && T.mug.printful.product === 19 && T.stickers.printful.technique === 'digital' && T.stickers.printful.product === 505,
    'Printful placement and technique: tee 71 front_large dtg, mug 19 default sublimation, sheet 505 default digital');
  ok(T.tee.block.join() === '750,300,3000,3000' && T.tee.art.join() === '750,300,3000,2500' && T.tee.strip.join() === '750,2800,3000,500', 'tee block: 10 x 10 in at (750, 300): the art box 10 x 8.33 in, the name strip 10 x 1.67 in under it');
  const C = P.TEE_COLOURS, ids = C.map((c) => c.id).join();
  ok(ids === 'white,soft-cream,athletic-heather,pink,ice-blue,navy,black' && C.every((c) => /^#[0-9A-F]{6}$/.test(c.hex) && c.patch === (c.id !== 'white')), 'tee colours made in the US and the UK: ' + C.map((c) => c.name + ' ' + c.hex + (c.patch ? ' (patch)' : '')).join(', '));
  ok(C.every((c) => ['S', 'M', 'L', 'XL', '2XL'].every((s) => c.sizes.both.includes(s))) && C.filter((c) => c.sizes.both.includes('XS')).map((c) => c.id).join() === 'ice-blue,navy,black' && C.filter((c) => c.sizes.both.includes('3XL')).map((c) => c.id).join() === 'white,black',
    'sizes in both countries: S-2XL for every colour, XS only navy, black, ice blue; 3XL only white, black');
}

console.log('# every print SVG: exact size, the art version, nothing outside, no cut lines, no line under 0.5 mm');
// an independent walk: the printed width of every stroke (transforms and nested viewBoxes followed)
function thinnest(svg) {
  const st = [{ sc: 1, sw: 1, on: false }]; let min = 1e9;
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)) {
    const [, close, tag, a, self] = m; if (close) { if (/^(g|svg|clipPath|defs)$/.test(tag)) st.pop(); continue; }
    const up = st[st.length - 1], tf = /\stransform="([^"]*)"/.exec(a); let sc = up.sc;
    if (tf) for (const t of tf[1].matchAll(/(translate|scale|rotate|matrix)\(([^)]*)\)/g)) { const v = t[2].trim().split(/[\s,]+/).map(Number); if (t[1] === 'scale') sc *= Math.sqrt(Math.abs(v[0] * (v.length > 1 ? v[1] : v[0]))); if (t[1] === 'matrix') sc *= Math.sqrt(Math.abs(v[0] * v[3] - v[1] * v[2])); }
    if (tag === 'svg') { const vb = /viewBox="([^"]*)"/.exec(a), w = /\swidth="([\d.]+)"/.exec(a); if (vb && w) sc *= +w[1] / +vb[1].split(/\s+/)[2]; }
    const sw = /\sstroke-width="([\d.]+)"/.exec(a), s = /\sstroke="([^"]*)"/.exec(a), width = sw ? +sw[1] : up.sw, on = s ? s[1] !== 'none' : up.on;
    if (on && !/^(g|svg)$/.test(tag)) min = Math.min(min, width * sc);
    if (!self && /^(g|svg|clipPath|defs)$/.test(tag)) st.push({ sc, sw: width, on });
  }
  return min;
}
const JOBS = []; DOGS.forEach((d) => { JOBS.push([d, 'tee', 'white'], [d, 'tee', 'navy'], [d, 'mug', 'white'], [d, 'stickers', 'white']); });
{
  let size = 0, ver = 0, cln = 0, cut = 0, minL = 1e9, n = 0, shadow = 0;
  for (const [d, prod, col] of JOBS) {
    const s = P.print(d.r, { product: prod, colour: col, pose: d.pose }), p = P.PRODUCTS[prod]; n++;
    if (s.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}"`)) size++;
    if (s.includes(`data-pawprint="${P.ART_VER}"`) && s.includes(`<!-- PawPrint ${P.ART_VER} `)) ver++;
    if (clean(s)) cln++; if (/stroke-dasharray/.test(s)) cut++; if (/cy="187.5" rx="[\d.]+" ry="6" fill="#5B3D32"/.test(s)) shadow++;
    minL = Math.min(minL, thinnest(s));
  }
  ok(size === n && ver === n && /^pp1-[0-9a-f]{8}$/.test(P.ART_VER), `${n} prints (8 dogs x tee white, tee navy, mug, sheet) at exactly the product's size, each stamped ${P.ART_VER}`);
  ok(cln === n && cut === 0 && shadow === 0, 'no script, image, text, style sheet or outside link; no dashed cut line; no ground shadow');
  ok(minL >= MINPX - 0.01, `thinnest printed line ${(minL / 300 * 25.4).toFixed(3)} mm (rule: 0.5 mm = ${MINPX.toFixed(2)} px)`);
}

console.log('# the tee');
{
  const pr = (d, col, o) => { const s = P.print(d.r, Object.assign({ product: 'tee', colour: col, pose: d.pose }, o)); return { s, st: P.print.last }; };
  let inBlock = 0, artbox = 0, strip = 0, sizes = [];
  for (const d of DOGS) {
    const { s, st } = pr(d, 'white');
    if (s.includes('<svg x="750" y="300" width="3000" height="2500" viewBox="0 0 240 200">')) artbox++;
    const b = st.dogBox, nb = st.name.bb; sizes.push(st.name.size);
    if (b[0] >= 750 && b[1] >= 300 && b[2] <= 3750 && b[3] <= 2800) inBlock++;
    if (nb[0] >= 750 && nb[2] <= 3750 && nb[1] >= 2800 && nb[3] <= 3300 && st.name.size <= 390) strip++;
  }
  ok(artbox === 8 && inBlock === 8, 'the 240 x 200 art box prints at (750, 300), 3000 x 2500 px = 10 x 8.33 in (12.5 px a unit), the dog inside it, for all 8 dogs');
  ok(strip === 8, 'the name sits in the 10 x 1.67 in strip under it, letters at most 1.3 in (390 px), shrunk to fit: sizes ' + sizes.map(Math.round).join(', '));
  const pup = P.print(DOGS[2].r, { product: 'tee', pose: 'stand' }) && P.print.last.dogBox, adult = P.print(Object.assign({}, DOGS[2].r, { a: 0 }), { product: 'tee', pose: 'stand' }) && P.print.last.dogBox;
  ok(pup[2] - pup[0] < (adult[2] - adult[0]) * 0.8, `scaled by the art box, so a puppy prints puppy-sized (Dachshund puppy ${Math.round((pup[2] - pup[0]) / 300 * 25.4)} mm wide, adult ${Math.round((adult[2] - adult[0]) / 300 * 25.4)} mm)`);
  const navy = pr(DOGS[0], 'navy'), white = pr(DOGS[0], 'white'), noName = pr(DOGS[0], 'navy', { name: false });
  ok(P.TEE_COLOURS.every((c) => { const s = P.print(DOGS[0].r, { product: 'tee', colour: c.id }); return s.includes('fill="#FFFBF3"') === c.patch && (!c.patch || /<g shape-rendering="crispEdges"><path d="[^"]+" fill="#FFFBF3"\/>/.test(s)); }) && !white.s.includes('#FFFBF3'),
    'the paper patch on every colour but white, drawn with crisp edges (no anti-aliasing: the only edge on the fabric)');
  ok(noName.st.patch[3] < navy.st.patch[3] && !noName.s.includes('pp-name'), 'name off: no name and a shorter patch round the art box only');
  ok(P.print(DOGS[0].r, { product: 'tee', name: 'Pip' }) && P.print.last.name.text === 'Pip' && P.print(DOGS[0].r, { product: 'tee', name: 'sh1t' }) && !P.print.last.name, 'a typed name prints; a refused one is left off quietly');
}

console.log('# the mug');
{
  let all = 0, small = 1e9, out = [], faceOk = 0, nm = 0;
  for (let b = 0; b < P.BREEDS.length; b++) for (const a of [0, 1, 2]) for (const pose of ['stand', 'sit', 'happy']) {
    const r = { v: 1, b, g: null, e: 0, p: b * 31 + a, a, s: 'f', o: [16, 12], n: 'Captain Fluffybottom' };
    P.print(r, { product: 'mug', pose }); const st = P.print.last; all++; small = Math.min(small, st.artMM);
    const bad = st.dogBox.some((x) => x[0] < 150 - 0.01 || x[2] > 2550 + 0.01 || x[1] < 75 - 0.01 || x[3] > 975 + 0.01) || st.name.bb.some((x) => x[1] < 75 - 0.01 || x[3] > 975 + 0.01 || x[0] < 150);
    if (bad) out.push(P.BREEDS[b] + a + pose);
    if (st.name.bb.every((x, i) => x[2] - x[0] <= 900.01 && Math.abs((x[0] + x[2]) / 2 - P.PRODUCTS.mug.sides[i]) < 1) && st.name.bb.every((x, i) => st.dogBox[i][1] >= x[3])) faceOk++;
  }
  ok(!out.length, `dog and name stay 0.25 in from top and bottom and 0.5 in from both ends (the handle), on both sides: ${all} prints (40 breeds x 3 ages x 3 poses, dressed)${out.length ? ' FAIL: ' + out.slice(0, 5) : ''}`);
  ok(small >= P.MIN_ART_MM, `the dog's art box is never under 80 mm on the mug: smallest ${small} mm`);
  ok(faceOk === all, 'the name (even 20 letters) fits the mug face (3 in, centred on each side) and sits above the dog');
}

console.log('# the sticker sheet (layout; the shapes are checked on the rendered sheet below)');
{
  const C = P.PRODUCTS.stickers.cells, cells = Object.values(C); let gaps = 1e9, edge = 1e9, across = 1e9;
  for (let i = 0; i < cells.length; i++) { const a = cells[i]; edge = Math.min(edge, a[0], a[1], 1749 - a[0] - a[2], 2481 - a[1] - a[3]); across = Math.min(across, a[2], a[3]); for (let j = i + 1; j < cells.length; j++) { const b = cells[j]; gaps = Math.min(gaps, Math.max(b[0] - a[0] - a[2], a[0] - b[0] - b[2], b[1] - a[1] - a[3], a[1] - b[1] - b[3])); } }
  ok(cells.length === 9 && gaps >= 150 && edge >= 120 && across >= 225, `nine sticker cells: at least ${gaps} px (0.5 in) apart, ${edge} px (0.4 in) from the edge, ${across} px (0.75 in) across`);
  let smallest = 1e9, who = '', thin = 1e9, thinWho = '', outside = [];
  for (let b = 0; b < P.BREEDS.length; b++) for (const a of [0, 1, 2]) for (const o of [undefined, [16, 12, 22], [19, 4, 31]]) {
    P.print(Object.assign({ v: 1, b, g: null, e: 0, p: b, a, s: 'm' }, o ? { o } : {}), { product: 'stickers' }); const st = P.print.last;
    if (st.artMM < smallest) { smallest = st.artMM; who = P.BREEDS[b] + ['', ' puppy', ' newborn'][a]; }
    for (const [c, bx] of Object.entries(st.boxes)) { const cell = C[c], m = Math.min(bx[2] - bx[0], bx[3] - bx[1]); if (m < thin) { thin = m; thinWho = P.BREEDS[b] + ' ' + c; } if (bx[0] < cell[0] || bx[1] < cell[1] || bx[2] > cell[0] + cell[2] || bx[3] > cell[1] + cell[3]) outside.push(P.BREEDS[b] + a + c); }
  }
  ok(!outside.length && thin >= 225, `every sticker stays in its cell and is at least 0.75 in across for all 40 breeds x 3 ages x 3 outfits: narrowest ${Math.round(thin)} px (${thinWho})${outside.length ? ' OUT: ' + outside.slice(0, 6) : ''}`);
  ok(smallest >= 50, `the smallest dog on a sheet (its art box across; 40 breeds, 3 ages, 3 outfits): ${smallest} mm (${who}); rule: at least 50 mm`);
  const s = P.print(DOGS[3].r, { product: 'stickers' });
  ok(!/pa-d-tw|pa-d-spk/.test(s) && (s.match(/<g shape-rendering="crispEdges">/g) || []).length === 9, 'sparkle stars left off the sheet (they would float); nine crisp-edged backings');
  P.print(Object.assign({}, DOGS[0].r), { product: 'stickers', name: false }); ok(P.print.last.label.text === 'good dog!', 'the label says "good dog!" when the name is off');
}

console.log('# names');
{
  const good = ['Mochi', '  Sir   Wigglesworth III ', 'Zoë', 'Ōtarō', "D'Artagnan", 'D’Artagnan', 'Mr. Biscuit & Co!', 'Rex 2', 'Cassie', 'Bass', 'Dickens', 'Shiitake', 'Cocker', 'Scooter', 'Peanut-Butter', 'Bobs', 'Hancock'];
  ok(good.every((x) => NM.nameOk(x).ok && P.nameOk(x).ok), 'kind names pass: ' + good.map((x) => NM.nameClean(x)).join(' | '));
  ok(NM.nameClean('  Sir   Wigglesworth III ') === 'Sir Wigglesworth III' && NM.nameClean('D’Artagnan') === "D'Artagnan" && NM.nameClean('Zoë') === 'Zoë' && NM.nameClean('Bo​​b') === 'Bob', 'trimmed, spaces collapsed, NFC, curly apostrophe made plain, invisible characters out');
  const longR = NM.nameOk('x'.repeat(21));
  ok(!longR.ok && longR.why === 'long' && NM.nameClean('Duke the Great Dane of Doodle Town') === 'Duke the Great Dane', 'more than 20 letters: refused when typed, cut at 20 when read from a save');
  const letters = ['ポチ', 'Łucja', 'Bo?', 'a,b', 'Rex 🐶', '<b>', 'x/y', '...', '!!!', '#1'];
  ok(letters.every((x) => { const r = NM.nameOk(x); return !r.ok && r.why === 'letters' && r.say === "Let's try another name"; }), 'letters the print font cannot draw are refused calmly: ' + letters.join(' '));
  const rude = ['fuck', 'F u c k', 'f.u.c.k', 'fuuuuck', 'Sh1t', 'sh!t', 'BITCH', 'Bïtch', 'Mr Ass', 'a s s', 'p0rn', 'Big Dick', 'Cunty', 'dumbass hole'];
  ok(rude.every((x) => { const r = NM.nameOk(x); return !r.ok && r.why === 'word' && r.say === "Let's try another name"; }) && rude.every((x) => P.nameOk(x).ok === false), `rude words refused through leet, spacing, repeats and accents (${rude.length} tries)`);
  const junk = [null, undefined, 42, {}, [], () => 1, '!'.repeat(100000), '\u0000', ''];
  ok(junk.every((x) => { try { const r = NM.nameOk(x); return r && r.ok === false && NM.nameClean(x) === null; } catch (e) { return false; } }), 'junk (null, numbers, objects, 100k characters, control characters, empty) gives a calm refusal, never a throw');
  ok(Array.from(NM.CHARS).every((c) => P.nameChars().includes(c)) && Array.from(NM.CHARS).every((c) => { try { return P.textW(c, 100) > 0 || c === ' '; } catch (e) { return false; } }), `every allowed character (${Array.from(NM.CHARS).length}) has an outline in the print font`);
  { const ctx = { self: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, 'names.js'), 'utf8'), ctx); const W = ctx.self.PawNames;
    ok(W && W.nameOk('Mochi').ok && !W.nameOk('sh1t').ok && Object.keys(ctx).join() === 'self', 'names.js runs alone as in a Worker or a page (no module, no window): it only sets self.PawNames'); }
  ok(P.check({ v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: '<b>&' }).ok === false && P.check({ v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: 'fuck' }).ok === false, 'a recipe (a link) can never carry a refused name');
}

console.log('# the print page link');
{
  const d = DOGS[0], good = [P.printHash(d.r, { product: 'tee', colour: 'navy', pose: 'sit' }), P.printHash(d.r, { product: 'mug', pose: 'happy', name: false }), P.printHash(d.r, { product: 'stickers' }), '#p=' + P.merchEncode(d.r) + '&prod=tee'];
  ok(good.every((h) => { const r = P.printFromHash(h); return r.ok && r.svg.startsWith('<svg') && r.w === P.PRODUCTS[r.product].w; }), 'good links draw: ' + good[0]);
  const e = P.merchEncode(d.r), two = P.merchEncode([d.r, DOGS[1].r]);
  const bad = ['', '#', '#p=' + e, '#prod=tee', `#p=${e}&prod=hat`, `#p=${e}&prod=__proto__`, `#p=${e}&prod=constructor`, `#p=${e}&prod=tee&col=red`, `#p=${e}&prod=mug&col=navy`, `#p=${e}&prod=tee&pose=jump`, `#p=${e}&prod=tee&n=2`,
    `#p=${e}&prod=tee&x=1`, `#p=${e}&prod=tee&prod=mug`, `#p=${two}&prod=tee`, `#p=${e.slice(0, -2)}&prod=tee`, `#p=${e}&prod=tee&col=<b>`, `#p=${e}&&prod=tee`, '#p=' + 'A'.repeat(3000) + '&prod=tee', null, 7, {}, `#p=${e}&prod=tee&pose=stand&n=1&col=white&p=${e}`];
  ok(bad.every((h) => { try { const r = P.printFromHash(h); return r.ok === false && r.svg === '' && typeof r.err === 'string'; } catch (x) { return false; } }), `bad links draw nothing and never throw (${bad.length}: unknown, repeated or missing keys, a wrong product, colour, pose or n, two dogs, a cut link, junk)`);
}

/* ---------------- the rendered files: Chromium, the real print page ---------------- */
// opaque components (8-connected, alpha > 0): [{ n, bb: [x0, y0, x1, y1] }]
function components(img) {
  const { w, h, data } = img, lab = new Int32Array(w * h), out = [], st = new Int32Array(w * h); let id = 0;
  for (let i = 0; i < w * h; i++) {
    if (!data[i * 4 + 3] || lab[i]) continue; id++; let sp = 0, n = 0; const bb = [1e9, 1e9, -1, -1]; st[sp++] = i; lab[i] = id;
    while (sp) {
      const p = st[--sp], x = p % w, y = (p - x) / w; n++; if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y; if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (!lab[q] && data[q * 4 + 3]) { lab[q] = id; st[sp++] = q; } }
    }
    out.push({ n, bb });
  }
  return out;
}
const alphaStats = (img) => { let semi = 0, on = 0; const bb = [1e9, 1e9, -1, -1]; for (let i = 0; i < img.w * img.h; i++) { const a = img.data[i * 4 + 3]; if (a) { on++; const x = i % img.w, y = (i - x) / img.w; if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y; if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y; if (a < 255) semi++; } } return { semi, on, bb }; };

async function browser() {
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.log('  skip  the rendered checks need Playwright (NODE_PATH=$(npm root -g))'); return; }
  const http = require('http'), DIR = path.join(__dirname, 'dist', 'print', 'v1');
  const srv = http.createServer((q, s) => { const f = path.join(DIR, path.basename(q.url.split(/[?#]/)[0]) || 'index.html'); fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(b); }); });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const base = `http://127.0.0.1:${srv.address().port}/index.html`;
  const br = await chromium.launch(); const reqs = new Set();
  const shoot = async (hash, prod) => {
    const p = P.PRODUCTS[prod], half = p.w * p.h > 12e6;
    const pg = await br.newPage({ viewport: { width: half ? p.w / 2 : p.w, height: half ? p.h / 2 : p.h }, deviceScaleFactor: half ? 2 : 1 });
    pg.on('request', (r) => reqs.add(r.url().replace(/#.*/, '').replace(base.replace('index.html', ''), '')));
    await pg.goto(base + hash); const title = await pg.title(), kids = await pg.evaluate(() => document.getElementById('o').children.length);
    const png = await pg.screenshot({ omitBackground: true }); await pg.close(); return { title, kids, img: readPNG(png) };
  };
  try {
    console.log('# rendered: the print page in Chromium');
    let sizeOk = 0, navyHard = 0, navyOne = 0, whiteIn = 0, n = 0;
    for (const d of DOGS) {
      const w = await shoot(P.printHash(d.r, { product: 'tee', colour: 'white', pose: d.pose }), 'tee'), a = alphaStats(w.img); n++;
      if (w.img.w === 4500 && w.img.h === 5400 && w.title === 'READY 4500x5400' && w.kids === 1) sizeOk++;
      if (a.bb[0] >= 750 && a.bb[1] >= 300 && a.bb[2] < 3750 && a.bb[3] < 3300) whiteIn++;
      const v = await shoot(P.printHash(d.r, { product: 'tee', colour: 'navy', pose: d.pose }), 'tee'), b = alphaStats(v.img), c = components(v.img);
      if (b.semi === 0) navyHard++; if (c.length === 1 && b.bb[0] >= 600 - 30 && b.bb[2] < 3900 + 30) navyOne++;
      if (d.id === 'golden') console.log(`  info golden tee: white ${a.on} opaque px (${a.semi} soft edge px), navy ${b.on} (${b.semi} soft)`);
    }
    ok(sizeOk === n, `the tee file is 4500 x 5400 px (half viewport at deviceScaleFactor 2), one SVG on the page: ${sizeOk}/${n}`);
    ok(whiteIn === n, `on white every inked pixel is inside the 10 x 10 in block (750-3750, 300-3300): ${whiteIn}/${n}`);
    ok(navyHard === n && navyOne === n, `on navy the file is one opaque patch with no soft pixel at all (alpha only 0 or 255): ${navyHard}/${n} hard, ${navyOne}/${n} one shape`);
    let mOk = 0, sheetOk = 0; const sheetInfo = [];
    for (const d of DOGS) {
      const m = await shoot(P.printHash(d.r, { product: 'mug', pose: d.pose }), 'mug'); let stray = 0;
      for (let y = 0; y < 1050; y++) for (let x = 0; x < 2700; x++) { const al = m.img.data[(y * 2700 + x) * 4 + 3]; if (al && (y < 75 || ((x < 150 || x >= 2550) && y < 750))) stray++; }
      if (m.img.w === 2700 && m.img.h === 1050 && stray === 0) mOk++;
      const s = await shoot(P.printHash(d.r, { product: 'stickers' }), 'stickers'), st = alphaStats(s.img), c = components(s.img);
      let gap = 1e9, edge = 1e9, across = 1e9;
      c.forEach((A, i) => { edge = Math.min(edge, A.bb[0], A.bb[1], 1748 - A.bb[2], 2480 - A.bb[3]); across = Math.min(across, A.bb[2] - A.bb[0] + 1, A.bb[3] - A.bb[1] + 1); c.slice(i + 1).forEach((B) => { gap = Math.min(gap, Math.max(B.bb[0] - A.bb[2] - 1, A.bb[0] - B.bb[2] - 1, B.bb[1] - A.bb[3] - 1, A.bb[1] - B.bb[3] - 1)); }); });
      sheetInfo.push(`${d.id} ${c.length} shapes, gap ${gap}, edge ${edge}, across ${across}` + (across < 225 || edge < 120 || gap < 150 ? ' ' + JSON.stringify(c.map((x) => x.bb)) : ''));
      if (s.img.w === 1749 && s.img.h === 2481 && c.length === 9 && st.semi === 0 && gap >= 150 && edge >= 120 && across >= 225) sheetOk++;
    }
    ok(mOk === 8, `mug: 2700 x 1050 px; nothing in the top 0.25 in, nothing but the yard strip in the 0.5 in by the handle: ${mOk}/8`);
    ok(sheetOk === 8, `sticker sheet: exactly nine opaque shapes (each one piece, nothing floating), hard edges, at least 0.5 in apart, 0.4 in from the edge, 0.75 in across: ${sheetOk}/8`);
    sheetInfo.forEach((x) => console.log('  info ' + x));
    // a bad link draws nothing
    let empty = 0; const badLinks = ['#p=AAAA&prod=tee', '#prod=mug', '#p=' + P.merchEncode(DOGS[0].r) + '&prod=tee&col=nope', '#p=' + P.merchEncode(DOGS[0].r) + '&prod=tee&evil=1'];
    for (const h of badLinks) { const r = await shoot(h, 'mug'); if (r.kids === 0 && /^ERR /.test(r.title) && alphaStats(r.img).on === 0) empty++; }
    ok(empty === badLinks.length, `bad links: an empty, fully transparent page titled ERR (${empty}/${badLinks.length})`);
    const files = [...reqs].sort().join(', ');
    ok(files === 'index.html, pawprint.js, print.js', 'the page loads only itself, pawprint.js and print.js (no other request): ' + files);
  } finally { await br.close(); srv.close(); }
}

(async () => { await browser(); console.log(`\n${checks} checks, ${fails ? 'FAILED ' + fails : 'ALL OK'}`); process.exit(fails ? 1 : 0); })().catch((e) => { console.error(e); process.exit(1); });
