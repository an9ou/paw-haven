// Merch spike: PawPrint in Node (no browser). The recipe, the wire, the two readers and the art coverage.
//   NODE_PATH=$(npm root -g) node tools/merch_build.js && node merch/test_pawprint.js
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
ok(!P.svg({ v: 1, b: 0, g: null, e: 0, p: 0, a: 0, s: 'm', n: '<b>&' }, { name: true }).includes('<b>'), 'a name with < > & is only ever outlines in the print file (the merch page and order mails must still escape it as text)');
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

console.log(`\n${checks} checks, ${fails ? 'FAILED ' + fails : 'ALL OK'}`); process.exit(fails ? 1 : 0);
