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
const DOGS = require('./sample_dogs.js')(P), readPNG = require('./png_lite.js'), NM = require('./names.js'), BUILD = require('../tools/merch_build.js');
const FONT = vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'pawprint_font.js'), 'utf8') + ';PAWPRINT_FONT');
const MINPX = P.MIN_LINE_MM / 25.4 * 300, Wi = (n) => P.WEAR.findIndex((w) => w.n === n), B = (k) => P.BREEDS.indexOf(k);
const inside = (a, b, e) => { e = e || 0.01; return a[0] >= b[0] - e && a[1] >= b[1] - e && a[2] <= b[2] + e && a[3] <= b[3] + e; };
const nameSizes = (s) => [...s.matchAll(/<g class="pp-name"[^>]*>(.*?)<\/g>/g)].map((m) => { const k = /scale\(([\d.]+)\)/.exec(m[1]); return k ? +k[1] * FONT.upm : 0; });
const HEADBODY = P.WEAR.map((w, i) => [w, i]).filter(([w]) => w.slot === 'head' || w.slot === 'body').map((x) => x[1]), HEADS = HEADBODY.filter((i) => P.WEAR[i].slot === 'head');

console.log('# the product table');
{
  const T = P.PRODUCTS;
  ok(Object.keys(T).join() === 'tee,mug,stickers' && T.tee.w === 4500 && T.tee.h === 5400 && T.mug.w === 2700 && T.mug.h === 1050 && T.stickers.w === 1749 && T.stickers.h === 2481 && Object.values(T).every((p) => p.dpi === 300 && Math.abs(p.inches[0] * 300 - p.w) < 1 && Math.abs(p.inches[1] * 300 - p.h) < 1),
    'sizes at 300 dpi: tee 4500x5400 (15 x 18 in), mug 2700x1050 (9 x 3.5 in), sticker sheet 1749x2481 (5.83 x 8.27 in)');
  ok(T.tee.launch === true && T.mug.launch === true && T.stickers.launch === false, 'launch products: the tee and the mug; the sticker sheet is switched off (launch: false, no stickers at launch)');
  ok(T.tee.printful.placement === 'front_large' && T.tee.printful.technique === 'dtg' && T.tee.printful.product === 71 && T.mug.printful.technique === 'sublimation' && T.mug.printful.product === 19 && T.stickers.printful.technique === 'digital' && T.stickers.printful.product === 505,
    'Printful placement and technique: tee 71 front_large dtg, mug 19 default sublimation, sheet 505 default digital');
  ok(T.tee.unit === 12.5 && T.tee.top === 300 && T.tee.cx === 2250 && T.tee.minDogIn === 5 && inside(T.tee.safe, [0, 0, 4500, 5400]),
    `tee: 12.5 px a unit (the 240 x 200 art box would print 10 x 8.33 in), centred, from 1 in below the top; minDogIn ${T.tee.minDogIn} in (0 = off)`);
  const C = P.TEE_COLOURS, ids = C.map((c) => c.id).join();
  ok(ids === 'white,soft-cream,athletic-heather,pink,ice-blue,navy,black' && C.every((c) => /^#[0-9A-F]{6}$/.test(c.hex) && c.patch === (c.id !== 'white')), 'tee colours made in the US and the UK: ' + C.map((c) => c.name + ' ' + c.hex + (c.patch ? ' (patch)' : '')).join(', '));
  ok(C.every((c) => ['S', 'M', 'L', 'XL', '2XL'].every((s) => c.sizes.both.includes(s))) && C.filter((c) => c.sizes.both.includes('XS')).map((c) => c.id).join() === 'ice-blue,navy,black' && C.filter((c) => c.sizes.both.includes('3XL')).map((c) => c.id).join() === 'white,black',
    'sizes in both countries: S-2XL for every colour, XS only navy, black, ice blue; 3XL only white, black');
  ok(P.NAME_MIN_PX === Math.ceil(MINPX / P.FONT_THIN_EM) && T.tee.nameMin === P.NAME_MIN_PX && T.mug.nameMin === P.NAME_MIN_PX, `the smallest name letters: 0.5 mm / ${P.FONT_THIN_EM} em = ${P.NAME_MIN_PX} px (${(P.NAME_MIN_PX / 300).toFixed(2)} in) on the tee and the mug`);
}

console.log('# ART_VER: every file that decides a print is hashed, and the build is kept by version');
{
  const base = BUILD.build(), read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const need = ['dogs/pawart_dogs.js', 'mods/genes.js', 'merch/pawprint_font.js', 'merch/names.js', 'merch/pawprint_core.js', 'merch/print/v1/index.html', 'merch/print/v1/print.js', 'tools/merch_build.js'];
  ok(base.ART_VER === P.ART_VER && /^pp1-[0-9a-f]{8}$/.test(P.ART_VER), `merch/dist/pawprint.js is this build (${P.ART_VER}; run tools/merch_build.js first)`);
  const moved = BUILD.HASHED.filter((f) => BUILD.build((p) => read(p) + (p === f ? ' ' : '')).ART_VER !== base.ART_VER);
  ok(need.every((f) => BUILD.HASHED.includes(f)) && moved.length === BUILD.HASHED.length, `one changed byte in any hashed file gives a new ART_VER (${moved.length}/${BUILD.HASHED.length}: ${BUILD.HASHED.join(', ')})`);
  const vd = path.join(__dirname, 'dist', 'print', P.ART_VER), v1 = path.join(__dirname, 'dist', 'print', 'v1');
  ok(['index.html', 'print.js', 'pawprint.js'].every((f) => fs.existsSync(path.join(vd, f)) && fs.readFileSync(path.join(vd, f)).equals(fs.readFileSync(path.join(v1, f)))), `the print page is also written to merch/dist/print/${P.ART_VER}/ (an old order redraws with the build it was previewed on)`);
}

console.log('# every print SVG: exact size, the art version, nothing outside, no cut lines, no line under 0.5 mm (the name too)');
// an independent walk: the printed width of every stroke (transforms and nested viewBoxes followed); the name: its letter size x the font's thin stroke
function thinnest(svg) {
  const st = [{ sc: 1, sw: 1, on: false, back: false }]; let min = 1e9; // back: inside the white tee's white backing (pp-back), which prints no ink
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)) {
    const [, close, tag, a, self] = m; if (close) { if (/^(g|svg|clipPath|defs)$/.test(tag)) st.pop(); continue; }
    const up = st[st.length - 1], tf = /\stransform="([^"]*)"/.exec(a); let sc = up.sc;
    if (tf) for (const t of tf[1].matchAll(/(translate|scale|rotate|matrix)\(([^)]*)\)/g)) { const v = t[2].trim().split(/[\s,]+/).map(Number); if (t[1] === 'scale') sc *= Math.sqrt(Math.abs(v[0] * (v.length > 1 ? v[1] : v[0]))); if (t[1] === 'matrix') sc *= Math.sqrt(Math.abs(v[0] * v[3] - v[1] * v[2])); }
    if (tag === 'svg') { const vb = /viewBox="([^"]*)"/.exec(a), w = /\swidth="([\d.]+)"/.exec(a); if (vb && w) sc *= +w[1] / +vb[1].trim().split(/\s+/)[2]; }
    const sw = /\sstroke-width="([\d.]+)"/.exec(a), s = /\sstroke="([^"]*)"/.exec(a), width = sw ? +sw[1] : up.sw, on = s ? s[1] !== 'none' : up.on;
    const back = up.back || /\sclass="pp-back"/.test(a);
    if (on && !back && !/^(g|svg)$/.test(tag)) min = Math.min(min, width * sc);
    if (!self && /^(g|svg|clipPath|defs)$/.test(tag)) st.push({ sc, sw: width, on, back });
  }
  for (const n of nameSizes(svg)) min = Math.min(min, n * P.FONT_THIN_EM);
  return min;
}
const JOBS = []; DOGS.forEach((d) => { JOBS.push([d, 'tee', 'white'], [d, 'tee', 'navy'], [d, 'mug', 'white'], [d, 'stickers', 'white']); });
{
  let size = 0, ver = 0, cln = 0, cut = 0, minL = 1e9, n = 0, shadow = 0, nmin = 1e9;
  for (const [d, prod, col] of JOBS) {
    const s = P.print(d.r, { product: prod, colour: col, pose: d.pose }), p = P.PRODUCTS[prod]; n++;
    if (s.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}"`)) size++;
    if (s.includes(`data-pawprint="${P.ART_VER}"`) && s.includes(`<!-- PawPrint ${P.ART_VER} `)) ver++;
    if (clean(s)) cln++; if (/stroke-dasharray/.test(s)) cut++; if (/<ellipse\b[^>]*fill="#5B3D32"[^>]*opacity=/.test(s)) shadow++;
    minL = Math.min(minL, thinnest(s)); if (prod !== 'stickers') nameSizes(s).forEach((x) => { nmin = Math.min(nmin, x); });
  }
  ok(size === n && ver === n, `${n} prints (8 dogs x tee white, tee navy, mug, sheet) at exactly the product's size, each stamped ${P.ART_VER}`);
  ok(cln === n && cut === 0 && shadow === 0, 'no script, image, text, style sheet or outside link; no dashed cut line; no ground shadow');
  ok(minL >= MINPX - 0.01 && nmin >= P.NAME_MIN_PX - 0.01, `thinnest printed line ${(minL / 300 * 25.4).toFixed(3)} mm, names included (rule: 0.5 mm = ${MINPX.toFixed(2)} px); smallest name letters ${nmin.toFixed(1)} px`);
}

console.log('# the art is never cut: its real drawn box, past the 240 x 200 art box (tails, hats, helmets, wings, hearts, sparkle)');
{
  let cases = 0, past = 0, thrown = 0; const cut = [], worst = [0, 0, 0, 0], who = [];
  const scan = (r, pose, facing) => {
    cases++; let A; try { A = P.printArt(r, pose, facing); } catch (e) { thrown++; if (thrown < 4) console.log('  threw', e.message, JSON.stringify(r), pose); return; }
    const raw = P.bbox(P.dogSVG(r, { pose, facing }).replace(/<ellipse [^>]*fill="#5B3D32" opacity="[^"]*"\/><path [^>]*stroke-width="1.3"[^>]*\/>/, '')), box = [A.box[0], A.box[1], A.box[0] + A.box[2], A.box[1] + A.box[3]], o = [-raw[0], -raw[1], raw[2] - 240, raw[3] - 200];
    if (o.some((x) => x > 0.5)) past++;
    o.forEach((x, i) => { if (x > worst[i]) { worst[i] = x; who[i] = P.BREEDS[r.b] + ['', ' puppy', ' newborn'][r.a] + ' ' + pose + (r.o ? ' ' + P.WEAR[r.o[0]].n : '') + (r.sp ? ' sparkle' : '') + (facing === 'left' ? ' left' : ''); } });
    if (!inside(raw, box) || !inside(raw, A.bb, 0.6)) cut.push(P.BREEDS[r.b] + r.a + pose + (r.o || ''));
  };
  for (let b = 0; b < P.BREEDS.length; b++) for (const a of [0, 1, 2]) for (const pose of ['stand', 'sit', 'happy']) {
    for (const it of [null].concat(HEADBODY)) scan(Object.assign({ v: 1, b, g: null, e: 0, p: b * 7 + a, a, s: 'f' }, it == null ? {} : { o: [it] }), pose, 'right');
    HEADS.concat([null]).forEach((it, j) => scan(Object.assign({ v: 1, b, g: '220200', e: 0, p: b * 13 + j, a, s: 'm', sp: 1 }, it == null ? {} : { o: [it, Wi('Bat Wings')] }), pose, j % 2 ? 'left' : 'right'));
  }
  ok(thrown === 0, `every dog's ground shadow is found and removed exactly once (${cases} drawings, none threw)`);
  ok(!cut.length && past > 50, `${cases} drawings (40 breeds x 3 ages x 3 poses x none and every head and body item; and dressed, sparkly, both ways): `
    + `${past} reach past the art box, by up to ${worst.map((x) => x.toFixed(1)).join(' / ')} units left / top / right / bottom (${who.join('; ')}); the print nests each with its whole drawing: ${cut.length} cut${cut.length ? ' ' + cut.slice(0, 5) : ''}`);
  // a changed shadow in the art is caught: build PawPrint from art without the shadow, and with two
  const mk = (edit) => { const src = BUILD.build((p) => { const t = fs.readFileSync(path.join(ROOT, p), 'utf8'); return p === 'dogs/pawart_dogs.js' ? edit(t) : t; }).src, m = { exports: {} }; vm.runInNewContext(src, { module: m, globalThis: {}, Intl, TextEncoder, TextDecoder }); return m.exports; };
  const CY = 'cy="${GY+1.5}" rx="${R1(shw)}" ry="${shy}"', SH = /(const shadow=\(s\.wet&&pose!=='jump'\?wetPuddle\(shx,shw\):''\)\+)`[^`]*`;/;
  const none = mk((t) => t.replace(SH, "$1'';")), moved = mk((t) => t.replace(CY, CY.replace('GY+1.5', 'GY+0.5')));
  const two = mk((t) => t.replace(SH, (m) => m.replace(/`;$/, '<ellipse cx="9" cy="187.5" rx="9" ry="6" fill="#5B3D32" opacity="0.1"/><path d="" stroke="#5B3D32" stroke-width="1.3"/>`;')));
  const tries = [none, moved, two].map((Q) => { try { Q.print(DOGS[0].r, { product: 'tee', pose: 'stand' }); return 'drew'; } catch (e) { return e.message; } });
  ok(tries.every((x) => /^shadow/.test(x)), `art with no shadow, a moved one or two makes print() throw instead of printing a stain: ${tries.join(' | ')}`);
}

console.log('# the tee');
{
  const pr = (r, col, o) => { const s = P.print(r, Object.assign({ product: 'tee', colour: col }, o)); return { s, st: P.print.last }; };
  const T = P.PRODUCTS.tee, safe = T.safe; let bad = [], n = 0, small = 1e9;
  for (let b = 0; b < P.BREEDS.length; b++) for (const a of [0, 1, 2]) for (const pose of ['stand', 'sit', 'happy']) for (const dress of [0, 1]) {
    const r = Object.assign({ v: 1, b, g: '211100', e: 0, p: b * 31 + a, a, s: 'f', n: 'Captain Fluffybottom' }, dress ? { o: [Wi('Witch Hat'), Wi('Bat Wings')], sp: 1 } : {});
    const { st } = pr(r, 'navy', { pose }), A = P.printArt(r, pose); n++;
    const natural = (A.bb[2] - A.bb[0]) * T.unit; small = Math.min(small, st.dogBox[2] - st.dogBox[0]);
    const why = [];
    if (!inside(st.dogBox, safe) || !inside(st.patch, safe) || !inside(st.name.bb, safe)) why.push('safe');
    if (!inside(st.dogBox, st.patchIn) || !inside(st.name.bb, st.patchIn)) why.push('patch');
    if (!inside(st.dogBox, st.nest[0])) why.push('nest');
    if (st.name.size < T.nameMin || st.name.bb[1] < st.dogBox[3]) why.push('name');
    if (st.name.bb[2] - st.name.bb[0] > Math.max((st.dogBox[2] - st.dogBox[0]) * T.name.grow, T.name.minW) + 0.5 && st.name.size > T.nameMin + 0.01) why.push('wide name');
    if (Math.abs(st.k - T.unit * Math.max(1, T.minDogIn * 300 / natural)) > 0.01) why.push('scale');
    if (why.length) bad.push(P.BREEDS[b] + a + pose + dress + ':' + why);
  }
  ok(!bad.length, `${n} tees (40 breeds x 3 ages x 3 poses, plain and dressed with a Witch Hat, Bat Wings and sparkle): the whole drawing and the name inside the safe area and inside the patch; letters at least ${T.nameMin} px${bad.length ? ' FAIL ' + bad.slice(0, 6) : ''}`);
  ok(small >= T.minDogIn * 300 - 1, `minDogIn: no dog prints narrower than ${T.minDogIn} in (narrowest ${(small / 300).toFixed(2)} in); others keep 12.5 px a unit`);
  const keep = T.minDogIn; T.minDogIn = 0;
  const pup = pr(DOGS[2].r, 'white', { pose: 'stand' }).st, adult = pr(Object.assign({}, DOGS[2].r, { a: 0 }), 'white', { pose: 'stand' }).st, nb = pr(DOGS[5].r, 'white', { pose: 'sit' }).st;
  T.minDogIn = keep;
  ok(pup.k === 12.5 && pup.dogIn < adult.dogIn * 0.8 && nb.dogIn < 4, `minDogIn 0: scaled by the art box, so a puppy prints puppy-sized (Dachshund puppy ${pup.dogIn} in wide, adult ${adult.dogIn} in, newborn Beagle ${nb.dogIn} in)`);
  const nbNavy = pr(DOGS[5].r, 'navy', { pose: 'sit' }).st, adNavy = pr(DOGS[6].r, 'navy', { pose: 'happy' }).st, noName = pr(DOGS[0].r, 'navy', { pose: 'sit', name: false });
  const pw = (st) => st.patch[2] - st.patch[0], ph = (st) => st.patch[3] - st.patch[1];
  ok(pw(nbNavy) < pw(adNavy) * 0.8 && ph(nbNavy) < ph(adNavy) && Math.abs((nbNavy.patchIn[0] + nbNavy.patchIn[2]) / 2 - 2250) < 1, `the patch hugs the drawing and the name: newborn ${(pw(nbNavy) / 300).toFixed(1)} x ${(ph(nbNavy) / 300).toFixed(1)} in, adult Lab ${(pw(adNavy) / 300).toFixed(1)} x ${(ph(adNavy) / 300).toFixed(1)} in`);
  ok(P.TEE_COLOURS.every((c) => { const s = P.print(DOGS[0].r, { product: 'tee', colour: c.id }); return s.includes('fill="#FFFBF3"') === c.patch && (!c.patch || /<g shape-rendering="crispEdges"><path d="[^"]+" fill="#FFFBF3"\/>/.test(s)); }) && !pr(DOGS[0].r, 'white').s.includes('#FFFBF3'),
    'the paper patch on every colour but white, drawn with crisp edges (no anti-aliasing: the only edge on the fabric)');
  { // part 9 art review m3: a long name is no wider than max(dog x 1.15, 6 in) (letters shrink, down to nameMin), so no wide, empty patch
    const mal = { v: 1, b: B('maltese'), g: null, e: 0, p: P.hashId('m3-maltese'), a: 1, s: 'f', n: 'Sir Wigglesworth III' }, gold = DOGS.find((d) => d.id === 'golden').r;
    const nw = (st) => st.name.bb[2] - st.name.bb[0], dw = (st) => st.dogBox[2] - st.dogBox[0], cap = (st) => Math.max(dw(st) * T.name.grow, T.name.minW);
    const m = pr(mal, 'navy', { pose: 'stand' }).st, g = pr(Object.assign({}, gold, { n: 'W'.repeat(20) }), 'navy', { pose: 'stand' }).st, s = pr(Object.assign({}, gold, { n: 'Honey' }), 'navy', { pose: 'stand' }).st;
    const a = pr(DOGS[0].r, 'white', { pose: 'sit' }).st, pin = (st) => (st.patch[2] - st.patch[0]) / 300;
    ok(Math.abs(m.dogIn - T.minDogIn) < 0.02 && nw(m) <= cap(m) + 0.5 && nw(m) >= T.name.minW - 2 && m.name.size >= T.nameMin && pin(m) < 7.2 && nw(g) <= dw(g) * T.name.grow + 0.5 && g.name.size >= T.nameMin && s.name.size === T.name.max && a.name.size === T.name.max,
      `long names under small dogs: "Sir Wigglesworth III" under a ${m.dogIn} in Maltese puppy ${(nw(m) / 300).toFixed(2)} in wide at ${m.name.size} px (patch ${pin(m).toFixed(2)} in), twenty W's under a ${g.dogIn} in Golden ${(nw(g) / 300).toFixed(2)} in at ${g.name.size} px; short names keep ${T.name.max} px ("Honey" ${s.name.size}, "Mochi" ${a.name.size})`);
    const wb = pr(DOGS[3].r, 'white', { pose: 'stand' }).s, nb = pr(DOGS[3].r, 'navy', { pose: 'stand' }).s;
    ok(/<g class="pp-back" shape-rendering="crispEdges"><svg [^>]*><g fill="#FFFFFF" stroke="#FFFFFF"/.test(wb) && (wb.match(/class="pp-back"/g) || []).length === 1 && wb.indexOf('pp-back') < wb.lastIndexOf('<svg x=') && !/#FFFFFF" stroke="#FFFFFF/.test(nb) && !/pp-back/.test(nb),
      'part 9 m6: on white the drawing and the name lie on one crisp-edged white backing (drawn first), so no soft edge is left on the fabric; patched colours need none');
  }
  ok(noName.st.patch[3] < pr(DOGS[0].r, 'navy', { pose: 'sit' }).st.patch[3] && !noName.s.includes('pp-name'), 'name off: no name and a shorter patch round the drawing only');
  const typed = pr(DOGS[0].r, 'white', { name: 'Pip' }).st.name.text; let threw = [];
  for (const nm of ['sh1t', 'ポチ', '', 'x'.repeat(21), 42]) { try { P.print(DOGS[0].r, { product: 'tee', name: nm }); } catch (e) { threw.push(e.message); } }
  ok(typed === 'Pip' && threw.length === 5 && threw.slice(0, 4).every((m) => /^name: (word|letters|empty|long)$/.test(m)), 'a typed name prints; a refused one is a caller\'s slip and throws (' + threw.join(', ') + '), name false prints none');
}

console.log('# the mug');
{
  let all = 0, small = 1e9, out = [], faceOk = 0, nmin = 1e9, gap = 1e9, moved = 0; const NI = P.PRODUCTS.mug.nameIn;
  for (let b = 0; b < P.BREEDS.length; b++) for (const a of [0, 1, 2]) for (const pose of ['stand', 'sit', 'happy']) for (const dress of [0, 1]) {
    const r = Object.assign({ v: 1, b, g: null, e: 0, p: b * 31 + a, a, s: 'f', o: [16, 12], n: 'Captain Fluffybottom' }, dress ? { o: [Wi('Witch Hat'), Wi('Bat Wings')], sp: 1 } : {});
    P.print(r, { product: 'mug', pose }); const st = P.print.last; all++; small = Math.min(small, st.artMM); nmin = Math.min(nmin, st.name.size);
    const bad = st.dogBox.some((x) => x[0] < 150 - 0.01 || x[2] > 2550 + 0.01 || x[1] < 75 - 0.01 || x[3] > 975 + 0.01) || st.name.bb.some((x) => x[1] < 75 - 0.01 || x[3] > 975 + 0.01 || x[0] < 150 + NI - 0.01 || x[2] > 2550 - NI + 0.01) || !st.dogBox.every((x, i) => inside(x, st.nest[i]));
    if (bad) out.push(P.BREEDS[b] + a + pose + dress);
    // centred on its side, or (second review R2-m4) a long name moved towards the middle just enough to keep nameIn px from the handle line
    const placed = (x, i) => Math.abs((x[0] + x[2]) / 2 - P.PRODUCTS.mug.sides[i]) < 1 || (i ? Math.abs(x[2] - (2550 - NI)) < 0.02 && (x[0] + x[2]) / 2 < P.PRODUCTS.mug.sides[i] : Math.abs(x[0] - (150 + NI)) < 0.02 && (x[0] + x[2]) / 2 > P.PRODUCTS.mug.sides[i]);
    if (st.name.bb.every((x, i) => x[2] - x[0] <= P.PRODUCTS.mug.nameW + 0.01 && placed(x, i)) && st.name.bb.every((x, i) => st.dogBox[i][1] >= x[3])) faceOk++;
    st.name.bb.forEach((x, i) => { gap = Math.min(gap, i ? 2550 - x[2] : x[0] - 150); if (Math.abs((x[0] + x[2]) / 2 - P.PRODUCTS.mug.sides[i]) >= 1) moved++; });
  }
  ok(NI >= 20 && NI <= 30 && gap >= NI - 0.01 && moved > 0, `second review R2-m4: "Captain Fluffybottom" keeps ${NI} px clear of the 0.5 in handle line on both ends (closest ${gap} px; ${moved} long names moved towards the middle)`);
  ok(!out.length, `the whole drawing and the name stay 0.25 in from top and bottom and 0.5 in from both ends (the handle), on both sides: ${all} prints (40 breeds x 3 ages x 3 poses, two outfits, one with sparkle)${out.length ? ' FAIL: ' + out.slice(0, 5) : ''}`);
  ok(small >= P.MIN_ART_MM, `the dog's art box is never under 80 mm on the mug: smallest ${small} mm`);
  { // part 9 art review m5: the yard strip joins up at the handle: no picket cut at either end (the seam falls in a whole gap), the rail and
    // the grass line level at x 0 and x 2700, and no flower in the 0.5 in keep-clear at each end
    const M = P.PRODUCTS.mug, E = M.safe.ends, els = (s, re) => [...s.matchAll(re)].map((x) => x[0]), box = (el) => P.bbox('<svg>' + el + '</svg>');
    const yAt = (d, x) => [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].filter((q) => Math.abs(+q[1] - x) < 0.01).map((q) => +q[2]).sort((a, b) => a - b);
    let n = 0; const bad = [];
    for (const k of ['greyhound', 'dane', 'golden', 'chihuahua', 'lab', 'dachs', 'pug', 'samoyed']) for (const p of [1, 2, 3]) {
      const s = P.print({ v: 1, b: B(k), g: null, e: 0, p: P.hashId('m5-' + k + p), a: 0, s: 'f', n: 'Biscuit' }, { product: 'mug', pose: 'stand' }); n++;
      const pk = els(s, /<path d="[^"]*" fill="#FFF4DF"\/><path d="[^"]*" fill="none" stroke="#5B3D32" stroke-width="[\d.]+"[^>]*\/>/g).map((e) => box(e.replace(/^<path[^>]*\/>/, ''))).sort((a, b) => a[0] - b[0]);
      const gaps = pk.slice(1).map((q, i) => q[0] - pk[i][2]), seam = pk[0][0] + M.w - pk[pk.length - 1][2], med = gaps.slice().sort((a, b) => a - b)[gaps.length >> 1];
      if (pk[0][0] <= 0 || pk[pk.length - 1][2] >= M.w || Math.abs(seam - med) > 12) bad.push(k + p + ' fence ' + pk[0][0].toFixed(1) + '/' + (M.w - pk[pk.length - 1][2]).toFixed(1) + ' seam ' + seam.toFixed(1) + ' gap ' + med.toFixed(1));
      const grass = /<path d="([^"]*)" fill="#B8DC94"/.exec(s)[1], rail = /<path d="([^"]*)" fill="#F4E3C3"/.exec(s)[1];
      if (JSON.stringify(yAt(grass, 0)) !== JSON.stringify(yAt(grass, M.w)) || !yAt(grass, 0).length) bad.push(k + p + ' grass ' + yAt(grass, 0) + ' / ' + yAt(grass, M.w));
      if (JSON.stringify(yAt(rail, 0)) !== JSON.stringify(yAt(rail, M.w)) || yAt(rail, 0).length !== 2) bad.push(k + p + ' rail ' + yAt(rail, 0) + ' / ' + yAt(rail, M.w));
      const fl = els(s, /<path d="[^"]*" fill="#(?:F7B2C4|FFE27A|FFFFFF|C9B6F2)" stroke="#5B3D32"[^>]*\/>|<circle [^>]*fill="#E8B53A"[^>]*\/>/g).map(box);
      if (fl.some((b) => b[0] < E || b[2] > M.w - E)) bad.push(k + p + ' flower in the keep-clear');
    }
    ok(!bad.length, `mug yard strip, ${n} wraps: whole pickets with the seam in a gap, rail and grass line level at x 0 and ${M.w}, no flower within ${E} px of either end${bad.length ? ' FAIL ' + bad.slice(0, 4).join('; ') : ''}`);
  }
  ok(faceOk === all && nmin >= P.NAME_MIN_PX, `the name fits its face (${(P.PRODUCTS.mug.nameW / 300).toFixed(1)} in, centred on each side), sits above the dog, letters at least ${P.NAME_MIN_PX} px (smallest ${nmin})`);
}

console.log('# names on the products: never thinner than 0.5 mm');
{
  // the font's thin stroke, measured from its outlines: each allowed letter filled at 300 px per em, the local thickness of every inked pixel
  // (the widest circle inside the ink that covers it), and the 2nd percentile over all of them (the very tips of tapered strokes left out)
  const flat = (d, k) => { const out = []; let cur = null, x = 0, y = 0, sx = 0, sy = 0;
    for (const c of d.matchAll(/([MLHVQZ])([^MLHVQZ]*)/g)) { const n = (c[2].match(/-?\d*\.?\d+/g) || []).map(Number);
      if (c[1] === 'M') { x = n[0]; y = n[1]; sx = x; sy = y; cur = [[x * k, y * k]]; out.push(cur); for (let i = 2; i < n.length; i += 2) { x = n[i]; y = n[i + 1]; cur.push([x * k, y * k]); } }
      else if (c[1] === 'L') { for (let i = 0; i < n.length; i += 2) { x = n[i]; y = n[i + 1]; cur.push([x * k, y * k]); } }
      else if (c[1] === 'H') { x = n[0]; cur.push([x * k, y * k]); } else if (c[1] === 'V') { y = n[0]; cur.push([x * k, y * k]); }
      else if (c[1] === 'Q') { for (let i = 0; i < n.length; i += 4) { const [qx, qy, ex, ey] = n.slice(i, i + 4); for (let t = 1; t <= 8; t++) { const u = t / 8, a0 = (1 - u) * (1 - u), b0 = 2 * u * (1 - u), e0 = u * u; cur.push([(a0 * x + b0 * qx + e0 * ex) * k, (a0 * y + b0 * qy + e0 * ey) * k]); } x = ex; y = ey; } }
      else { x = sx; y = sy; } }
    return out; };
  const thick = (d, k) => {
    const Pl = flat(d, k); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; Pl.forEach((p) => p.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
    const ox = Math.floor(x0) - 2, oy = Math.floor(y0) - 2, W = Math.ceil(x1) - ox + 3, H = Math.ceil(y1) - oy + 3, m = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) { const yy = oy + j + 0.5, xs = []; for (const p of Pl) for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; if ((a[1] <= yy) !== (b[1] <= yy)) xs.push([a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), b[1] > a[1] ? 1 : -1]); }
      xs.sort((a, b) => a[0] - b[0]); let w = 0; for (let i = 0; i < xs.length - 1; i++) { w += xs[i][1]; if (w) for (let x = Math.ceil(xs[i][0] - ox - 0.5); x < xs[i + 1][0] - ox - 0.5; x++) if (x >= 0 && x < W) m[j * W + x] = 1; } }
    const D = new Float64Array(W * H), INF = 1e12; for (let i = 0; i < W * H; i++) D[i] = m[i] ? INF : 0;
    const pass = (n, get, set) => { const f = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1); for (let q = 0; q < n; q++) f[q] = get(q); let k2 = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < n; q++) { let s; for (;;) { s = ((f[q] + q * q) - (f[v[k2]] + v[k2] * v[k2])) / (2 * q - 2 * v[k2]); if (s <= z[k2]) k2--; else break; } k2++; v[k2] = q; z[k2] = s; z[k2 + 1] = INF; }
      k2 = 0; for (let q = 0; q < n; q++) { while (z[k2 + 1] < q) k2++; set(q, (q - v[k2]) * (q - v[k2]) + f[v[k2]]); } };
    for (let x = 0; x < W; x++) pass(H, (q) => D[q * W + x], (q, val) => { D[q * W + x] = val; }); for (let y = 0; y < H; y++) pass(W, (q) => D[y * W + q], (q, val) => { D[y * W + q] = val; });
    for (let i = 0; i < W * H; i++) D[i] = Math.sqrt(D[i]);
    const T = new Float64Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x, r = D[i]; if (!r) continue; let ridge = true; for (let dy = -1; dy <= 1 && ridge; dy++) for (let dx = -1; dx <= 1; dx++) if (D[i + dy * W + dx] > r + 1e-9) { ridge = false; break; } if (!ridge) continue;
      const R = Math.ceil(r); for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) { if (xx * xx + yy * yy > (r + 0.5) * (r + 0.5)) continue; const j = (y + yy) * W + x + xx; if (m[j] && T[j] < 2 * r) T[j] = 2 * r; } }
    const out = []; for (let i = 0; i < W * H; i++) if (m[i] && T[i]) out.push(T[i]); return out; };
  let all = []; for (const c of NM.CHARS) if (FONT.g[c] && FONT.g[c][1]) all = all.concat(thick(FONT.g[c][1], 0.3));
  all.sort((a, b) => a - b); const pct = (q) => all[Math.floor(all.length * q)] / 300;
  ok(pct(0.02) >= P.FONT_THIN_EM - 0.0005 && P.FONT_THIN_EM >= pct(0.02) - 0.005, `Caveat Bold's thin stroke, measured from its outlines: ${pct(0.02).toFixed(4)} em (2nd percentile; 5th ${pct(0.05).toFixed(4)}, median ${pct(0.5).toFixed(4)}); PawPrint uses ${P.FONT_THIN_EM}`);
  const W20 = 'W'.repeat(20), mugW = P.nameOk(W20, { product: 'mug' }), teeW = P.nameOk(W20, { product: 'tee' });
  let mugThrow = ''; try { P.print(Object.assign({}, DOGS[1].r, { n: W20 }), { product: 'mug' }); } catch (e) { mugThrow = e.message; }
  P.print(Object.assign({}, DOGS[1].r, { n: W20 }), { product: 'tee' }); const teeSize = P.print.last.name.size;
  ok(!mugW.ok && mugW.why === 'long' && mugW.say === 'A little shorter, please' && mugW.max >= 12 && mugW.max < 20 && P.nameOk(W20.slice(0, mugW.max), { product: 'mug' }).ok && mugThrow === 'name: long' && teeW.ok && teeSize >= P.NAME_MIN_PX,
    `twenty W's (no space to break at): the tee prints them at ${teeSize} px; the mug cannot at ${P.NAME_MIN_PX} px, so nameOk(s, { product: 'mug' }) says "${mugW.say}" (up to ${mugW.max} of them fit) and print() throws`);
  const tries = ['Duke the Great Dane', 'Ñandú Çé Œuvre-ß', 'J', 'Sir Wigglesworth III', "D'Artagnan & Co!"], got = [];
  for (const t of tries) for (const prod of ['tee', 'mug']) { const fit = P.nameOk(t, { product: prod }); P.print(DOGS[0].r, { product: prod, name: t, pose: 'sit' }); const st = P.print.last; got.push(fit.ok && st.name.text === t && st.name.size >= P.NAME_MIN_PX ? st.name.size : 'FAIL ' + t + ' ' + prod); }
  ok(got.every((x) => typeof x === 'number'), `long, accented and one-letter names fit both products at ${P.NAME_MIN_PX} px or more: ${tries.map((t, i) => `${t} tee ${got[2 * i]}, mug ${got[2 * i + 1]}`).join('; ')}`);
}

console.log('# the sticker sheet (switched off; layout only, as it was)');
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
  const good = ['Mochi', '  Sir   Wigglesworth III ', 'Zoë', 'Ōtarō', "D'Artagnan", 'D’Artagnan', 'Mr. Biscuit & Co!', 'Rex 2', 'Cassie', 'Bass', 'Scooter', 'Peanut-Butter', 'Bobs',
    'Ashita', 'Hoshi Taro', 'Kashi Take', 'Shitake', 'Shiitake', 'Pussycat', 'Scunthorpe', 'Atwater', 'Penistone', 'Nazira', 'Therapist', 'Mishit', 'Moby Dick', 'Cookie', 'Dickens', 'Fanny',
    'Cumin', 'Cockapoo', 'Hancock', 'Titus', 'Sussex', 'Kuro', 'Mochi', 'Hachi', 'Pudding', 'Biscuit', 'Toshitaka', 'Yoshito', 'Ashitaka', 'Fuku', 'Merdeka', 'Pornthip', 'Cocker', 'Assam', 'Fickle', 'Marsch'];
  const badGood = good.filter((x) => !NM.nameOk(x).ok || !P.nameOk(x).ok);
  ok(!badGood.length, `kind names pass (${good.length}, Japanese romaji and place names among them): ${badGood.length ? 'REFUSED ' + badGood.join(', ') : good.slice(13, 26).join(', ') + ' ...'}`);
  const src = ['13c_litter', '30_shelter', '13_more_dogs', '49_funfair', '40_dogcards'].map((f) => fs.readFileSync(path.join(ROOT, 'game/src', f + '.js'), 'utf8')).join('\n'), gameNames = [];
  for (const k of ['PUP_NAMES', 'SR_NAMES', 'RESCUE_NAMES', 'FF_WASH_NAMES', 'DC_PET_NAMES']) gameNames.push(...vm.runInNewContext(new RegExp('const ' + k + ' = (\\[[^\\]]*\\])').exec(src)[1]));
  const gameBad = gameNames.filter((x) => !NM.nameOk(x).ok);
  ok(gameNames.length > 100 && !gameBad.length, `every name the game gives a dog passes (${gameNames.length}: puppies, shelter, rescues, Fun Fair, Dog Cards)${gameBad.length ? ' REFUSED ' + gameBad : ''}`);
  ok(NM.nameClean('  Sir   Wigglesworth III ') === 'Sir Wigglesworth III' && NM.nameClean('D’Artagnan') === "D'Artagnan" && NM.nameClean('Zoë') === 'Zoë' && NM.nameClean('Bo' + String.fromCharCode(0x200B, 0x200B) + 'b') === 'Bob', 'trimmed, spaces collapsed, NFC, curly apostrophe made plain, invisible characters out');
  const longR = NM.nameOk('x'.repeat(21));
  ok(!longR.ok && longR.why === 'long' && NM.nameClean('Duke the Great Dane of Doodle Town') === 'Duke the Great Dane', 'more than 20 letters: refused when typed, cut at 20 when read from a save');
  const letters = ['ポチ', 'Łucja', 'Bo?', 'a,b', 'Rex 🐶', '<b>', 'x/y', '...', '!!!', '#1', 'Ăna', 'ăna', 'Zoÿ', 'ZOŸ'];
  ok(letters.every((x) => { const r = NM.nameOk(x); return !r.ok && r.why === 'letters' && r.say === "Let's try another name"; }), 'letters the print font cannot draw are refused calmly (why: letters): ' + letters.join(' '));
  const L = Array.from(NM.LETTERS), pairBad = L.filter((c) => !Array.from(c.toUpperCase()).every((x) => L.includes(x)) || !L.includes(c.toLowerCase()));
  ok(!pairBad.length && !L.includes('Ă') && !L.includes('ÿ'), `every allowed letter's other case is allowed too (the font has Ă but not ă, ÿ but not Ÿ: all four refused)${pairBad.length ? ' BAD ' + pairBad.join('') : ''}`);
  const rude = ['fuck', 'F u c k', 'f.u.c.k', 'fuuuuck', 'Fuuck', 'Ffuucckk', 'Shiit', 'Sshhiitt', 'Sh1t', 'sh!t', 'xxx', 'XXX', 'Phuck', 'Fvck', 'Fuk', 'BITCH', 'Bïtch', 'Mr Ass', 'a s s', 'A.S.S',
    'p0rn', 'Big Dick', 'Cunty', 'dumbass hole', 'Fück', 'Pu55y', 'N4z1', 'Wh0re', 'B00b', 'Dıck', 'A55', String.fromCharCode(0x200E) + 'fuck', 'fu' + String.fromCharCode(0xAD) + 'ck',
    'Puta', 'Mierda', 'Pendejo', 'Merde', 'Putain', 'Scheisse', 'Scheiße', 'Arschloch', 'Caralho', 'Buceta', 'Kontol', 'Ngentot', 'Scunthorpecunt', 'Prick', 'Bastard'];
  const rudeOk = rude.filter((x) => { const r = NM.nameOk(x); return r.ok || r.why !== 'word' || r.say !== "Let's try another name" || P.nameOk(x).ok; });
  ok(!rudeOk.length, `rude words refused (why: word) through doubled letters, leet, spacing, sound-alikes, accents and five other languages (${rude.length} tries)${rudeOk.length ? ' PASSED ' + rudeOk.join(', ') : ''}`);
  const junk = [null, undefined, 42, {}, [], () => 1, '!'.repeat(100000), String.fromCharCode(0), ''];
  ok(junk.every((x) => { try { const r = NM.nameOk(x); return r && r.ok === false && NM.nameClean(x) === null; } catch (e) { return false; } }) && NM.nameOk('').why === 'empty' && NM.nameOk('  ').why === 'empty', 'junk (null, numbers, objects, 100k characters, control characters, empty) gives a calm refusal (empty: why empty), never a throw');
  const noGlyph = Array.from(NM.CHARS).filter((c) => !(FONT.g[c] && FONT.g[c][0] > 0 && (c === ' ' || FONT.g[c][1].length > 10)));
  ok(!noGlyph.length, `every allowed character (${Array.from(NM.CHARS).length}) has an outline and an advance in the font's own table (merch/pawprint_font.js)${noGlyph.length ? ' MISSING ' + noGlyph.join('') : ''}`);
  { const ctx = { self: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, 'names.js'), 'utf8'), ctx); const Wn = ctx.self.PawNames;
    ok(Wn && Wn.nameOk('Mochi').ok && !Wn.nameOk('sh1t').ok && Object.keys(ctx).join() === 'self', 'names.js runs alone as in a Worker or a page (no module, no window): it only sets self.PawNames'); }
  ok(P.check({ v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: '<b>&' }).ok === false && P.check({ v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: 'fuck' }).ok === false, 'a recipe (a link) can never carry a refused name');
}

console.log('# the print page link');
const want = (prod, col, pose, n) => `READY ${prod}-${col}-${pose}-n${n} ${P.PRODUCTS[prod].w}x${P.PRODUCTS[prod].h} ${P.ART_VER}`;
{
  const d = DOGS[0], e = P.merchEncode(d.r), noName = Object.assign({}, d.r); delete noName.n;
  const good = [P.printHash(d.r, { product: 'tee', colour: 'navy', pose: 'sit' }), P.printHash(d.r, { product: 'mug', pose: 'happy', name: false }), `#av=${P.ART_VER}&n=1&pose=stand&col=white&prod=tee&p=${e}`];
  const rs = good.map((h) => P.printFromHash(h));
  ok(rs.every((r) => r.ok && r.svg.startsWith('<svg') && r.w === P.PRODUCTS[r.product].w) && rs.map((r) => r.id).join() === 'tee-navy-sit-n1,mug-white-happy-n0,tee-white-stand-n1' && rs.every((r) => r.artVer === P.ART_VER), 'good links draw, keys in any order, and say what they drew: ' + good[0]);
  ok(/^#p=[A-Za-z0-9_-]+&prod=tee&col=navy&pose=sit&n=1&av=pp1-[0-9a-f]{8}$/.test(good[0]) && /&n=0&/.test(P.printHash(noName, { product: 'tee' })), 'printHash writes every key (n=0 for a dog with no name)');
  const full = { p: e, prod: 'tee', col: 'navy', pose: 'sit', n: '1', av: P.ART_VER }, link = (o) => '#' + Object.entries(o).filter(([, v]) => v != null).map(([k, v]) => k + '=' + v).join('&');
  const missing = Object.keys(full).map((k) => P.printFromHash(link(Object.assign({}, full, { [k]: null }))).err);
  ok(missing.join() === 'missing p,missing prod,missing col,missing pose,missing n,missing av', 'no defaults: a link without p, prod, col, pose, n or av is refused (' + missing.join(', ') + ')');
  const two = P.merchEncode([d.r, DOGS[1].r]), W20 = P.merchEncode(Object.assign({}, d.r, { n: 'W'.repeat(20) })), ne = P.merchEncode(noName);
  const bad = ['', '#', '#p=' + e, '#prod=tee', link(Object.assign({}, full, { prod: 'hat' })), link(Object.assign({}, full, { prod: '__proto__' })), link(Object.assign({}, full, { prod: 'constructor' })), link(Object.assign({}, full, { col: 'red' })),
    link(Object.assign({}, full, { prod: 'mug' })), link(Object.assign({}, full, { pose: 'jump' })), link(Object.assign({}, full, { n: '2' })), link(full) + '&x=1', link(full) + '&prod=mug', link(Object.assign({}, full, { p: two })), link(Object.assign({}, full, { p: e.slice(0, -2) })),
    link(Object.assign({}, full, { col: '<b>' })), link(full).replace('&', '&&'), link(Object.assign({}, full, { p: 'A'.repeat(3000) })), null, 7, {}, link(full) + '&p=' + e,
    link(Object.assign({}, full, { av: 'pp1-00000000' })), link(Object.assign({}, full, { av: 'v1' })), link(Object.assign({}, full, { prod: 'stickers', col: 'white' })), link(Object.assign({}, full, { p: ne })), link(Object.assign({}, full, { prod: 'mug', col: 'white', p: W20 }))];
  const errs = bad.map((h) => { try { const r = P.printFromHash(h); return r.ok === false && r.svg === '' && typeof r.err === 'string' ? r.err : 'DREW'; } catch (x) { return 'THREW'; } });
  ok(!errs.some((x) => x === 'DREW' || x === 'THREW') && errs.slice(-5).join() === 'art version,art version,product off,name,name', `bad links draw nothing and never throw (${bad.length}: unknown, repeated or missing keys, a wrong product, colour, pose or n, two dogs, a cut link, junk, another build's av, a product not on sale, n=1 with no name, a name too long for the mug: ${errs.slice(-5).join(', ')})`);
  let hashThrew = ''; try { P.printHash(d.r, { product: 'stickers' }); } catch (x) { hashThrew = x.message; }
  ok(hashThrew === 'product off' && P.printFromHash(P.printHash(d.r, { product: 'stickers', testOnly: true }), { testOnly: true }).ok, 'the sticker sheet (launch: false) gets no link and no print unless a test passes testOnly');
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
const alphaStats = (img, R) => { let semi = 0, on = 0; const bb = [1e9, 1e9, -1, -1], r = R || [0, 0, img.w - 1, img.h - 1];
  for (let y = Math.max(0, r[1]); y <= Math.min(img.h - 1, r[3]); y++) for (let x = Math.max(0, r[0]); x <= Math.min(img.w - 1, r[2]); x++) { const a = img.data[(y * img.w + x) * 4 + 3]; if (a) { on++; if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y; if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y; if (a < 255) semi++; } }
  return { semi, on, bb }; };

const RENDERED = 14; let rendered = 0; const rok = (c, l) => { rendered++; ok(c, l); };
async function browser() {
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { return false; }
  const http = require('http'), DIR = path.join(__dirname, 'dist', 'print');
  const srv = http.createServer((q, s) => { const u = q.url.split(/[?#]/)[0].split('/').filter(Boolean), f = u.length === 2 && /^(v1|pp1-[0-9a-f]{8})$/.test(u[0]) ? path.join(DIR, u[0], path.basename(u[1])) : null;
    if (!f) { s.writeHead(404); return s.end(); } fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(b); }); });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const host = `http://127.0.0.1:${srv.address().port}/`, base = host + 'v1/index.html';
  const br = await chromium.launch(); const reqs = new Set();
  const shoot = async (hash, prod, vp, url) => {
    const p = P.PRODUCTS[prod], half = p.w * p.h > 12e6;
    const pg = await br.newPage(vp || { viewport: { width: half ? p.w / 2 : p.w, height: half ? p.h / 2 : p.h }, deviceScaleFactor: half ? 2 : 1 });
    pg.on('request', (r) => reqs.add(r.url().replace(/#.*/, '').replace(host, '')));
    await pg.goto((url || base) + hash); const title = await pg.title(), kids = await pg.evaluate(() => document.getElementById('o').children.length);
    const png = await pg.screenshot({ omitBackground: true }); await pg.close(); return { title, kids, img: readPNG(png) };
  };
  try {
    console.log('# rendered: the print page in Chromium');
    let sizeOk = 0, navyHard = 0, navyOne = 0, whiteIn = 0, whiteHard = 0, whiteSoft = 0, n = 0;
    for (const d of DOGS) {
      const w = await shoot(P.printHash(d.r, { product: 'tee', colour: 'white', pose: d.pose }), 'tee'), a = alphaStats(w.img); n++;
      P.print(d.r, { product: 'tee', colour: 'white', pose: d.pose }); const st = P.print.last;
      if (w.img.w === 4500 && w.img.h === 5400 && w.title === want('tee', 'white', d.pose, 1) && w.kids === 1) sizeOk++;
      if (a.semi === 0) whiteHard++; whiteSoft += a.semi;
      if (inside(a.bb, [st.box[0] - 8, st.box[1] - 8, st.box[2] + 8, st.box[3] + 8]) && inside(a.bb, P.PRODUCTS.tee.safe)) whiteIn++;
      const v = await shoot(P.printHash(d.r, { product: 'tee', colour: 'navy', pose: d.pose }), 'tee'), b = alphaStats(v.img), c = components(v.img);
      P.print(d.r, { product: 'tee', colour: 'navy', pose: d.pose }); const sv = P.print.last;
      if (b.semi === 0) navyHard++; if (c.length === 1 && inside(b.bb, sv.patch, 1) && v.title === want('tee', 'navy', d.pose, 1)) navyOne++;
      if (d.id === 'golden') console.log(`  info golden tee: white ${a.on} opaque px (${a.semi} soft edge px), navy ${b.on} (${b.semi} soft)`);
    }
    rok(sizeOk === n, `the tee file is 4500 x 5400 px (half viewport at deviceScaleFactor 2), one SVG, titled "${want('tee', 'white', 'sit', 1)}": ${sizeOk}/${n}`);
    rok(whiteIn === n, `on white every inked pixel is inside the drawing and name's box and the safe area: ${whiteIn}/${n}`);
    rok(whiteHard === n, `part 9 m6: on white too the file has only clear or opaque pixels (alpha 0 or 255; the soft edges lie on the crisp white backing): ${whiteHard}/${n} hard, ${whiteSoft} soft pixels in all`);
    rok(navyHard === n && navyOne === n, `on navy the file is one opaque patch with no soft pixel at all (alpha only 0 or 255), the patch where print.last says: ${navyHard}/${n} hard, ${navyOne}/${n} one shape`);
    let allCol = 0; const pc = P.TEE_COLOURS.filter((c) => c.patch);
    for (const c of pc) { const v = await shoot(P.printHash(DOGS[3].r, { product: 'tee', colour: c.id, pose: 'stand', name: c.id !== 'pink' }), 'tee'), b = alphaStats(v.img); if (b.semi === 0 && components(v.img).length === 1 && v.title === want('tee', c.id, 'stand', c.id !== 'pink' ? 1 : 0)) allCol++; }
    rok(allCol === pc.length, `every patched colour (${pc.map((c) => c.name).join(', ')}) renders as one hard-edged patch (one with the name off): ${allCol}/${pc.length}`);
    let mOk = 0;
    for (const d of DOGS) {
      const m = await shoot(P.printHash(d.r, { product: 'mug', pose: d.pose }), 'mug'); let stray = 0;
      for (let y = 0; y < 1050; y++) for (let x = 0; x < 2700; x++) { const al = m.img.data[(y * 2700 + x) * 4 + 3]; if (al && (y < 75 || ((x < 150 || x >= 2550) && y < 750))) stray++; }
      if (m.img.w === 2700 && m.img.h === 1050 && stray === 0 && m.title === want('mug', 'white', d.pose, 1)) mOk++;
    }
    rok(mOk === 8, `mug: 2700 x 1050 px; nothing in the top 0.25 in, nothing but the yard strip in the 0.5 in by the handle: ${mOk}/8`);
    // the art is not cut: the Akita's sitting tail and a tall hat (with sparkle stars above it), on the white tee and the mug. The ink reaches its
    // real drawn box on every side (within a pixel or two of the bbox), and no ink touches the edge of the nested <svg> that would clip it
    const cutCases = [['Akita sitting', DOGS[0].r, 'sit'], ['Samoyed, Witch Hat, sparkle', { v: 1, b: B('samoyed'), g: null, e: 0, p: 1, a: 0, s: 'f', sp: 1, o: [Wi('Witch Hat')], n: 'Cloud' }, 'stand'], ['Dane, Wizard Hat, sitting', { v: 1, b: B('dane'), g: '222010', e: 2, p: 9, a: 0, s: 'm', o: [Wi('Wizard Hat')], n: 'Duke' }, 'sit']];
    const cutInfo = []; let notCut = 0, cutN = 0;
    for (const [label, r, pose] of cutCases) for (const prod of ['tee', 'mug']) {
      cutN++; const s = await shoot(P.printHash(r, { product: prod, pose }), prod); P.print(r, { product: prod, pose }); const st = P.print.last;
      const db = prod === 'tee' ? [st.dogBox] : st.dogBox, nb = st.nest; let good = true; const gaps = [];
      db.forEach((box, i) => {
        // the mug: the dog stands on the yard strip and its name is just above it, so look between the two (left and right sides only)
        const mug = prod === 'mug', nest = nb[i].map((x, j) => (j < 2 ? Math.ceil(x) : Math.floor(x) - 1)), y0 = mug ? Math.ceil(box[1]) + 1 : nest[1], y1 = Math.floor(mug ? Math.min(box[3], 750) : box[3]);
        const a = alphaStats(s.img, [nest[0], y0, nest[2], y1]);
        const edge = alphaStats(s.img, [nest[0], y0, nest[0], y1]).on + alphaStats(s.img, [nest[2], y0, nest[2], y1]).on + (mug ? 0 : alphaStats(s.img, [nest[0], nest[1], nest[2], nest[1]]).on);
        const g = (mug ? [a.bb[0] - box[0], box[2] - a.bb[2]] : [a.bb[0] - box[0], a.bb[1] - box[1], box[2] - a.bb[2]]).map((x) => +x.toFixed(1)); gaps.push(g.join('/'));
        const tol = Math.max(3, st.k * 0.8); if (edge > 0 || (!mug && g.some((x) => x < -2 || x > tol))) good = false; // the mug's widest parts can sit in the yard strip: there only the clip edge is checked
      });
      if (good && s.title === want(prod, 'white', pose, 1)) notCut++; cutInfo.push(`${label} ${prod} ${gaps.join(' ')}`);
    }
    rok(notCut === cutN, `the art is not cut at the art box: on the tee the ink meets its real drawn box (left / top / right px), and on both no ink touches the clip edge: ${cutInfo.join('; ')}`);
    // line widths as Chromium itself sees them (independent of weight() and of the test's own walk): every stroked element's computed
    // stroke-width times its screen matrix, and every name letter's size times the font's thin stroke
    { const pg = await br.newPage({ viewport: { width: 800, height: 600 } }); let minS = 1e9, minN = 1e9, who = '', els = 0;
      for (const [d, prod, col] of JOBS.filter((j) => j[1] !== 'stickers')) {
        const svg = P.print(d.r, { product: prod, colour: col, pose: d.pose }); await pg.setContent(`<!doctype html><body style="margin:0">${svg}</body>`);
        const r = await pg.evaluate((upm) => { let ms = 1e9, mn = 1e9, n = 0; const det = (m) => Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
          for (const el of document.querySelectorAll('path,ellipse,circle,rect,line,polyline,polygon')) { const cs = getComputedStyle(el), m = el.getScreenCTM(); if (!m) continue; n++;
            if (el.closest('.pp-back')) continue; // the white tee's white backing: no ink
            if (el.closest('.pp-name')) { mn = Math.min(mn, det(m) * upm); continue; }
            if (cs.stroke !== 'none' && cs.display !== 'none' && parseFloat(cs.strokeWidth) > 0) ms = Math.min(ms, parseFloat(cs.strokeWidth) * det(m)); }
          return { ms, mn, n }; }, FONT.upm);
        els += r.n; if (r.ms < minS) { minS = r.ms; who = d.id + ' ' + prod; } minN = Math.min(minN, r.mn);
      }
      await pg.close();
      rok(minS >= MINPX - 0.01 && minN * P.FONT_THIN_EM >= MINPX - 0.01, `Chromium's own numbers over ${els} drawn elements of the tee and mug files: thinnest stroke ${(minS / MM_PX).toFixed(3)} mm (${who}), smallest name letters ${minN.toFixed(1)} px = ${(minN * P.FONT_THIN_EM / MM_PX).toFixed(3)} mm strokes (rule 0.5 mm)`); }
    // a bad link, a link from another build, a product not on sale, a name the mug cannot carry: an empty, fully transparent page titled ERR
    const e = P.merchEncode(DOGS[0].r), av = '&av=' + P.ART_VER;
    const badLinks = ['#p=AAAA&prod=tee&col=white&pose=stand&n=1' + av, '#prod=mug&col=white&pose=stand&n=1' + av, '#p=' + e + '&prod=tee&col=nope&pose=stand&n=1' + av, '#p=' + e + '&prod=tee&col=white&pose=stand&n=1&evil=1' + av, '#p=' + e + '&prod=tee',
      '#p=' + e + '&prod=mug&col=white&pose=stand&n=1&av=pp1-00000000', P.printHash(DOGS[0].r, { product: 'stickers', testOnly: true }), '#p=' + P.merchEncode(Object.assign({}, DOGS[0].r, { n: 'W'.repeat(20) })) + '&prod=mug&col=white&pose=stand&n=1' + av];
    let empty = 0; const titles = [];
    for (const h of badLinks) { const prod = /prod=tee/.test(h) ? 'tee' : /prod=stickers/.test(h) ? 'stickers' : 'mug', r = await shoot(h, prod); titles.push(r.title); if (r.kids === 0 && /^ERR /.test(r.title) && alphaStats(r.img).on === 0) empty++; }
    rok(empty === badLinks.length && titles.slice(-3).join() === 'ERR art version,ERR product off,ERR name', `bad links: an empty, fully transparent page titled ERR (${empty}/${badLinks.length}: ${titles.join(', ')})`);
    // the viewport must give exactly the file's pixels, or nothing is drawn
    const vp = [[P.printHash(DOGS[1].r, { product: 'mug', pose: 'stand' }), 'mug', { viewport: { width: 2000, height: 900 }, deviceScaleFactor: 1 }], [P.printHash(DOGS[1].r, { product: 'tee', pose: 'stand' }), 'tee', { viewport: { width: 2250, height: 2700 }, deviceScaleFactor: 1 }], [P.printHash(DOGS[1].r, { product: 'mug', pose: 'stand' }), 'mug', { viewport: { width: 1350, height: 525 }, deviceScaleFactor: 2 }]];
    const vt = []; for (const [h, prod, v] of vp) { const r = await shoot(h, prod, v); vt.push(r.title + (r.kids || alphaStats(r.img).on ? ' DREW' : '')); }
    rok(/^ERR viewport/.test(vt[0]) && /^ERR viewport/.test(vt[1]) && !/DREW/.test(vt[0] + vt[1]) && vt[2] === want('mug', 'white', 'stand', 1) + ' DREW', `a viewport that does not give the file's pixels draws nothing: ${vt.join(' | ')}`);
    // the build kept by version answers the same link
    { const r = await shoot(P.printHash(DOGS[2].r, { product: 'mug', pose: 'stand' }), 'mug', null, host + P.ART_VER + '/index.html'); rok(r.title === want('mug', 'white', 'stand', 1) && r.kids === 1, `print/${P.ART_VER}/ draws the same link: ${r.title}`); }
    const files = [...reqs].sort().join(', ');
    rok(files === `${P.ART_VER}/index.html, ${P.ART_VER}/pawprint.js, ${P.ART_VER}/print.js, v1/index.html, v1/pawprint.js, v1/print.js`, 'the page loads only itself, pawprint.js and print.js (no other request): ' + files);
    // the sticker sheet (switched off, so not through the print page): the SVG drawn on its own
    let sheetOk = 0; const sheetInfo = [];
    { const pg = await br.newPage({ viewport: { width: 1749, height: 2481 } });
      for (const d of DOGS) {
        await pg.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block}</style>${P.print(d.r, { product: 'stickers' })}`);
        const img = readPNG(await pg.screenshot({ omitBackground: true })), st = alphaStats(img), c = components(img); let gap = 1e9, edge = 1e9, across = 1e9;
        c.forEach((A, i) => { edge = Math.min(edge, A.bb[0], A.bb[1], 1748 - A.bb[2], 2480 - A.bb[3]); across = Math.min(across, A.bb[2] - A.bb[0] + 1, A.bb[3] - A.bb[1] + 1); c.slice(i + 1).forEach((Bc) => { gap = Math.min(gap, Math.max(Bc.bb[0] - A.bb[2] - 1, A.bb[0] - Bc.bb[2] - 1, Bc.bb[1] - A.bb[3] - 1, A.bb[1] - Bc.bb[3] - 1)); }); });
        sheetInfo.push(`${d.id} ${c.length} shapes, gap ${gap}, edge ${edge}, across ${across}`);
        if (img.w === 1749 && img.h === 2481 && c.length === 9 && st.semi === 0 && gap >= 150 && edge >= 120 && across >= 225) sheetOk++;
      }
      await pg.close(); }
    rok(sheetOk === 8, `sticker sheet (drawn on its own: the print page refuses it): exactly nine opaque shapes, hard edges, at least 0.5 in apart, 0.4 in from the edge, 0.75 in across: ${sheetOk}/8`);
    sheetInfo.forEach((x) => console.log('  info ' + x));
    // the raw art's box (P.bbox) against Chromium's ink, for the dogs that reach furthest: the box the print relies on is never smaller than the drawing
    { const pg = await br.newPage({ viewport: { width: 720, height: 600 } }); const off = [];
      for (const [k, it, pose, sp] of [['akita', null, 'sit', 0], ['samoyed', 'Witch Hat', 'stand', 1], ['dane', 'Wizard Hat', 'sit', 0], ['greyhound', 'Astronaut Helmet', 'stand', 0], ['stdpoodle', 'Wizard Robe & Star Hat', 'stand', 1], ['corgi', 'Bat Wings', 'happy', 1], ['dachs', null, 'sit', 0]]) for (const facing of ['right', 'left']) {
        const r = Object.assign({ v: 1, b: B(k), g: null, e: 0, p: 5, a: 0, s: 'f' }, it ? { o: [Wi(it)] } : {}, sp ? { sp: 1 } : {}), raw = P.dogSVG(r, { pose, facing }), bb = P.bbox(raw);
        await pg.setContent('<style>body{margin:0}</style>' + raw.replace(/^<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="600" viewBox="-60 -50 360 300" overflow="visible">'));
        const a = alphaStats(readPNG(await pg.screenshot({ omitBackground: true }))), ink = [a.bb[0] / 2 - 60, a.bb[1] / 2 - 50, (a.bb[2] + 1) / 2 - 60, (a.bb[3] + 1) / 2 - 50];
        off.push(Math.max(bb[0] - ink[0], bb[1] - ink[1], ink[2] - bb[2], ink[3] - bb[3]));
      }
      await pg.close();
      rok(off.every((x) => x <= 0.75), `P.bbox holds the whole drawing as Chromium draws it (14 far-reaching dogs, both ways): ink past the box by at most ${Math.max(...off).toFixed(2)} units (0.75 allowed: anti-aliasing at 2 px a unit; the print nests 4 units wider)`); }
  } finally { await br.close(); srv.close(); }
  return true;
}
const MM_PX = 300 / 25.4;

(async () => {
  const ran = await browser();
  if (!ran) {
    console.log(`\n  SKIPPED ${RENDERED} rendered checks: they need Playwright (NODE_PATH=$(npm root -g))`);
    const allow = process.env.MERCH_ALLOW_SKIP === '1';
    console.log(`\n${checks} checks, ${fails ? 'FAILED ' + fails : 'ALL OK'}, SKIPPED ${RENDERED}${allow ? ' (MERCH_ALLOW_SKIP=1)' : ': not a pass (set MERCH_ALLOW_SKIP=1 to allow)'}`);
    process.exit(fails || !allow ? 1 : 0);
  }
  if (rendered !== RENDERED) { fails++; console.log(`  FAIL ${rendered} rendered checks ran, ${RENDERED} expected (update RENDERED)`); }
  console.log(`\n${checks} checks, ${fails ? 'FAILED ' + fails : 'ALL OK'}`); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
