// Merch part 8b: the game's encoder (merch/game/61_merch_enc.js, copied to game/src/61_merch_enc.js) against PawPrint itself, in Node.
//   NODE_PATH=$(npm root -g) node tools/merch_build.js && node merch/game/test_enc.js
// Checks: the file is what merch/game/gen.js writes from the core today; it fits the game's one shared scope (only merch* names, none the game
// already has, it compiles inside the game's own IIFE); MERCH_WEAR = PawPrint.WEAR entry for entry; merchEncode = PawPrint.merchEncode, string
// for string, for a large generated set of recipes and packs (and both refuse the same bad ones); merchRecipe = PawPrint.merchRecipe for
// generated save dogs (every breed, coats, ages, sexes, sparkle, mixes, every wearable, names: 20 letters, longer, accents, UTF-8, letters the
// font cannot draw, a refused word, look-alike marks); merchLink (the address, the active dog first, 8 at most, left-out dogs, the share
// tail, the base, the length cap); nothing else is touched (no window property, no storage, no network); PawPrint.ART_VER does not depend on it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'), rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let fails = 0, checks = 0; const ok = (c, l, d) => { checks++; console.log((c ? '  ok  ' : '  FAIL ') + l + (!c && d !== undefined ? ' ' + JSON.stringify(d).slice(0, 600) : '')); if (!c) fails++; };
const DIST = path.join(ROOT, 'merch', 'dist', 'pawprint.js');
if (!fs.existsSync(DIST)) { console.error('no merch/dist/pawprint.js: run NODE_PATH=$(npm root -g) node tools/merch_build.js'); process.exit(1); }
const P = require(DIST), GEN = require('./gen.js'), FILE = fs.readFileSync(GEN.OUT, 'utf8');

// the game's globals, made the way tools/merch_build.js makes PawPrint's own copy: PawArt from dogs/pawart_dogs.js, PawGenes from mods/genes.js
function gameWindow() {
  const w = { Intl }; w.window = w;
  new Function('window', 'document', 'module', rd('dogs/pawart_dogs.js')).call(w, w, undefined, undefined);
  new Function('window', 'globalThis', 'module', rd('mods/genes.js')).call(w, w, w, undefined);
  return w;
}
// the file as the game has it: inside one function scope with 'use strict' (00_core.js opens the IIFE), seeing only `window`
const load = (win) => new Function('window', "'use strict';\n" + FILE + '\nreturn { MERCH_WEAR, MERCH_SHARE, merchRecipe, merchEncode, merchLink };')(win);
const W = gameWindow(), G = W.PawGenes, E = load(W);
const tryEnc = (f, x) => { try { return f(x); } catch (e) { return 'throws'; } };
let a = 0x2545F491; const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (l) => l[Math.floor(rnd() * l.length)];

console.log('# the file: generated from the core, one shared scope');
{
  ok(GEN.make() === FILE, 'merch/game/61_merch_enc.js is what merch/game/gen.js writes from merch/pawprint_core.js and merch/names.js now (node merch/game/gen.js --check)');
  const top = []; FILE.split('\n').forEach((l) => { const m = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/.exec(l); if (m) top.push(m[1]); });
  ok(top.join() === 'MERCH_WEAR,MERCH_SHARE,merchKitC,merchKit,merchMake,merchRecipe,merchEncode,merchLink', 'top-level names: ' + top.join(', '));
  const order = rd('game/src/ORDER.txt').split('\n').map((s) => s.trim()).filter(Boolean), src = {};
  order.forEach((f) => { src[f] = rd('game/src/' + f); });
  const taken = top.filter((n) => order.some((f) => new RegExp('(^|[\\s;{}(])(?:const|let|var|function\\*?|class)\\s+' + n.replace(/\$/g, '\\$') + '\\b', 'm').test(src[f])));
  ok(!taken.length, 'no game/src file declares any of them (' + order.length + ' files)', taken);
  const before = order.indexOf('23_boot.js'), all = order.slice(0, before).map((f) => src[f]).join('') + FILE + order.slice(before).map((f) => src[f]).join('');
  let err = null; try { new vm.Script(all, { filename: 'game_src_with_merch.js' }); } catch (e) { err = String(e); }
  ok(!err, 'the game\'s src with the file before 23_boot.js (where ORDER.txt would list it) still compiles as one IIFE', err);
  ok(!/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|sendBeacon|WebSocket|document|navigator|location|import|export|eval)\b/.test(FILE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')), 'no storage, network, DOM, address, module or eval words in its code');
  ok(!/\bwindow\.\w+\s*=[^=]/.test(FILE), 'no window.X = in it');
  const kb = Buffer.byteLength(FILE) / 1024, gz = require('zlib').gzipSync(FILE, { level: 9 }).length / 1024;
  ok(kb < 24 && !/<svg|PAWPRINT_FONT\s*=|"M\d/.test(FILE), 'small, no art, no font outlines: ' + kb.toFixed(1) + ' KB, ' + gz.toFixed(1) + ' KB gz');
  const HASHED = require(path.join(ROOT, 'tools', 'merch_build.js')).HASHED;
  ok(!HASHED.some((f) => f.startsWith('merch/game/')), 'PawPrint.ART_VER does not hash merch/game/ (ART_VER ' + P.ART_VER + ')');
  // loading it touches nothing: every property set on window is recorded
  const sets = []; const spy = new Proxy(gameWindow(), { set(t, k, v) { sets.push(String(k)); t[k] = v; return true; } });
  const E2 = load(spy); E2.merchLink([{ id: 'x', key: 'shiba', genes: G.STARTER_GENES.shiba, name: 'Mochi' }]);
  ok(!sets.length, 'loading it and making a link sets nothing on window', sets);
  const none = load({});
  ok(none.merchRecipe({ id: 'x', key: 'shiba' }) === null && none.merchLink([{ id: 'x', key: 'shiba' }]) === null && tryEnc(none.merchEncode, []) === 'throws', 'without PawGenes / PawArt: no recipe, no link, encode throws (never a wrong dog)');
}

console.log('# the tables');
{
  ok(E.MERCH_WEAR.length === P.WEAR.length && E.MERCH_WEAR.every((w, i) => Object.keys(w).join() === 'slot,n' && w.slot === P.WEAR[i].slot && w.n === P.WEAR[i].n), 'MERCH_WEAR = PawPrint.WEAR, entry for entry (' + P.WEAR.length + ')');
  ok(Object.isFrozen(E.MERCH_WEAR) && Object.isFrozen(E.MERCH_WEAR[0]), 'MERCH_WEAR is frozen (the game cannot change the wire table by mistake)');
  const launch = Object.keys(P.PRODUCTS).filter((k) => P.PRODUCTS[k].launch);
  ok(E.MERCH_SHARE.prod.slice().sort().join() === launch.slice().sort().join() && launch.every((k) => P.PRODUCTS[k].poses.join() === E.MERCH_SHARE.pose.join()), 'MERCH_SHARE = the launch products (' + launch.join(', ') + ') and their poses (' + E.MERCH_SHARE.pose.join(', ') + ')');
  ok(G.BREEDS.join() === P.BREEDS.join(), 'the game\'s PawGenes.BREEDS = PawPrint.BREEDS (' + G.BREEDS.length + ')');
}

console.log('# merchEncode = PawPrint.merchEncode');
const NAMES = ['Mochi', 'Bo', 'Sir Wigglesworth III', 'Zoë', 'Łucja', 'Ōtarō', "D'Artagnan", 'Åsa-Märta Ødegård', 'Ünal & Ç!', 'Ætheldreda Œ', 'ÀÉÎÕÜàéîõüßÿ', '12345678901234567890', 'Ida.', 'Mr. Pickles-Jr'];
const bySlot = {}; P.WEAR.forEach((w, i) => { (bySlot[w.slot] = bySlot[w.slot] || []).push(i); });
function recipe(i) {
  const b = i % P.BREEDS.length, r = { v: 1, b, g: null, e: Math.floor(rnd() * 4), p: rnd() < 0.05 ? (rnd() < 0.5 ? 0 : 0xFFFFFFFF) : Math.floor(rnd() * 4294967296), a: Math.floor(rnd() * 3), s: rnd() < 0.5 ? 'f' : 'm' };
  if (rnd() < 0.92) r.g = Array.from({ length: 6 }, () => Math.floor(rnd() * 3)).join('') + (rnd() < 0.3 ? 'a' + Math.floor(rnd() * 3) : '') + (rnd() < 0.3 ? 'i' + Math.floor(rnd() * 3) : '');
  if (rnd() < 0.3) r.sp = 1;
  if (rnd() < 0.3) r.h = (b + 1 + Math.floor(rnd() * (P.BREEDS.length - 1))) % P.BREEDS.length;
  const k = Math.floor(rnd() * 7); if (k) { const slots = Object.keys(bySlot).sort(() => rnd() - 0.5).slice(0, k); r.o = slots.map((s) => pick(bySlot[s])); }
  if (rnd() < 0.75) { const n = P.cleanName(pick(NAMES)); if (n) r.n = n; }
  return r;
}
{
  let same = 0, n = 0, packs = 0, packSame = 0, maxLen = 0; const bad = [];
  const recs = []; for (let i = 0; i < 6000; i++) recs.push(recipe(i));
  P.WEAR.forEach((w, i) => recs.push({ v: 1, b: i % 40, g: '220200', e: 0, p: i, a: 0, s: 'm', o: [i] })); // every wearable at least once on its own
  NAMES.forEach((nm, i) => { const c = P.cleanName(nm); if (c) recs.push({ v: 1, b: i, g: null, e: 1, p: 7, a: 1, s: 'f', n: c }); });
  for (const r of recs) { n++; const x = tryEnc(E.merchEncode, [r]), y = tryEnc(P.merchEncode, [r]); if (x === y && x !== 'throws') same++; else if (bad.length < 3) bad.push({ r, x, y }); }
  ok(same === n, `one dog: ${same}/${n} recipes encode string-equal (every breed, coats with and without the A and I loci, no genes, eyes, ages, sexes, sparkle, mixes, 0-6 worn items, every wearable, names up to 20 letters, accents, 2-byte UTF-8)`, bad);
  for (let i = 0; i < 1500; i++) {
    const k = 1 + (i % 8), list = Array.from({ length: k }, (_, j) => recs[(i * 7 + j * 131) % recs.length]); packs++;
    const x = tryEnc(E.merchEncode, list), y = tryEnc(P.merchEncode, list); if (x === y && x !== 'throws') packSame++; maxLen = Math.max(maxLen, x.length);
  }
  ok(packSame === packs, `packs of 1 to 8: ${packSame}/${packs} string-equal (longest ${maxLen} chars)`);
  const solo = recs[3]; ok(E.merchEncode(solo) === P.merchEncode(solo), 'a single recipe without the array, as PawPrint takes it');
  const worst = Array.from({ length: 8 }, (_, i) => ({ v: 1, b: i, g: '222222a2i2', e: 3, p: 0xFFFFFFFF, a: 2, s: 'f', sp: 1, h: i + 8, o: Object.keys(bySlot).map((s) => bySlot[s][bySlot[s].length - 1]), n: P.cleanName('ÀÉÎÕÜàéîõüßÆæØøÞþÐðÇ') }));
  const wl = E.merchEncode(worst).length;
  ok(worst[0].n && Array.from(worst[0].n).length === 20 && wl === P.merchEncode(worst).length && wl + 2 <= 1024, `the largest pack (8 sparkly mixes, 6 items, 20 two-byte letters each) is ${wl} chars: far under 1024`);
  // what both refuse
  const BAD = [[], recs.slice(0, 9), [Object.assign({}, solo, { b: 99 })], [Object.assign({}, solo, { n: 'ポチ' })], [Object.assign({}, solo, { n: 'A'.repeat(21) })], [Object.assign({}, solo, { o: [0, 0] })],
    [Object.assign({}, solo, { o: [P.WEAR.length] })], [Object.assign({}, solo, { e: 4 })], [Object.assign({}, solo, { g: '333333' })], [Object.assign({}, solo, { h: solo.b })], [Object.assign({}, solo, { x: 1 })], [null], ['p']];
  ok(BAD.every((l) => tryEnc(E.merchEncode, l) === 'throws' && tryEnc(P.merchEncode, l) === 'throws'), 'both refuse the same bad input: no dogs, 9 dogs, an unknown breed, kana, 21 letters, two items in one slot, an unknown item, eyes 4, bad genes, a mix of itself, an extra field, null');
}

console.log('# merchRecipe = PawPrint.merchRecipe, on dogs as the save has them');
const iso = (days) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - days); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ROT = (s) => s.replace(/[a-z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 84) % 26 + 97));
const RAW_NAMES = NAMES.concat(['Pochi 🐶', 'ポチ', '小白', ROT('shpx'), 'Bon’s Pup', 'Ka–Ching', '  Spaced   Out  ', 'A'.repeat(25), 'Ångström Ångström Å', '!!!', 'Lo​la', 'Tab\tbed', '', null, 42, 'Ÿvonne']);
const ART_ALL = Object.keys(bySlot).reduce((o, s) => { o[s] = P.WEAR.filter((w) => w.slot === s).map((w) => w.n); return o; }, {});
{
  let same = 0, n = 0, nul = 0, named = 0, cut = 0; const bad = [];
  const ages = [null, iso(400), iso(40), iso(5), iso(3), iso(1), iso(0), 'not a date'];
  const dogs = [];
  G.BREEDS.forEach((key, bi) => {
    for (let k = 0; k < 8; k++) {
      const genes = k === 0 ? (G.STARTER_GENES[key] || G.STARTER_GENES.mutt) : k === 7 ? undefined : G.randomGenotype(key, rnd);
      if (k === 6 && genes) genes.Bl = ['Bl', 'bl'];
      const d = { id: 'g-' + key + '-' + k, key, genes, sex: rnd() < 0.5 ? 'female' : 'male', name: RAW_NAMES[(bi * 8 + k) % RAW_NAMES.length] };
      const born = ages[(bi + k) % ages.length]; if (born) d.born = born;
      if (rnd() < 0.3) d.sparkle = true;
      if (k === 2) d.mix = { head: G.BREEDS[(bi + 5) % 40] }; if (k === 3) d.mix = { head: key }; if (k === 4) d.mix = { head: 'wolf' };
      const seeds = [undefined, 0, 0xFFFFFFFF, Math.floor(rnd() * 4294967296), -1, 1.5, 2 ** 33, '12']; d.artSeed = seeds[(bi + k * 3) % seeds.length]; if (d.artSeed === undefined) delete d.artSeed;
      const o = { head: null, eyes: null, neck: null, body: null, feet: null, charm: null }; Object.keys(ART_ALL).forEach((s) => { if (rnd() < 0.5) o[s] = pick(ART_ALL[s]); });
      if (k === 5) { o.head = 'Not A Hat'; o.neck = 'Party Hat'; } // an unknown item, and an item in the wrong slot
      d.outfit = k === 1 ? undefined : o;
      dogs.push(d);
    }
  });
  dogs.push({ id: 'u', key: 'wolf', name: 'Wolfie' }, { key: 'shiba' }, { id: 7, key: 'pug', outfit: 'hat' }, null, 'dog', { id: 'z', key: 42 });
  for (const d of dogs) {
    n++; const want = (() => { const r = P.merchRecipe(d); return r && P.check(r).ok ? r : null; })(), got = E.merchRecipe(d);
    if (JSON.stringify(want) === JSON.stringify(got) && (!want || E.merchEncode([got]) === P.merchEncode([want]))) same++; else if (bad.length < 3) bad.push({ d, want, got });
    if (!got) nul++; else { if (got.n) named++; if (got.n && typeof d.name === 'string' && got.n !== d.name.trim()) cut++; }
  }
  ok(same === n, `${same}/${n} game dogs give PawPrint's recipe and link (${nul} cannot be encoded, ${named} keep a name, ${cut} names tidied or cut)`, bad);
  ok(E.merchRecipe({ id: 'u', key: 'wolf' }) === null && E.merchRecipe(null) === null, 'a breed the art does not know, or no dog: null');
}

console.log('# merchLink');
{
  const pack = G.BREEDS.slice(0, 10).map((key, i) => ({ id: 'd' + i, key, genes: G.randomGenotype(key, rnd), sex: i % 2 ? 'female' : 'male', name: 'Pup ' + i, born: iso(30 + i), outfit: { head: 'Party Hat' } }));
  const dec = (url) => P.merchFromHash(url.slice(url.indexOf('#')));
  const u = E.merchLink(pack);
  ok(/^https:\/\/doodledoggo\.app\/merch\/#p=[A-Za-z0-9_-]+$/.test(u), 'the address: https://doodledoggo.app/merch/#p=<recipes>', u);
  const d1 = dec(u);
  ok(d1.ok && d1.dogs.length === 8 && d1.dogs.every((x, i) => x.name === 'Pup ' + i), '10 dogs: the first 8 are sent, in order', d1.dogs.map((x) => x.name));
  const d2 = dec(E.merchLink(pack, { active: 'd5' }));
  ok(d2.dogs.length === 8 && d2.dogs[0].name === 'Pup 5' && d2.dogs.slice(1).map((x) => x.name).join() === 'Pup 0,Pup 1,Pup 2,Pup 3,Pup 4,Pup 6,Pup 7', 'opts.active: that dog first, then the others in pack order');
  ok(dec(E.merchLink(pack, { active: 'd9' })).dogs[0].name === 'Pup 9', 'the active dog goes first even when it is the 10th');
  ok(JSON.stringify(dec(E.merchLink(pack.slice(0, 3))).dogs.map((x) => x.recipe)) === JSON.stringify(pack.slice(0, 3).map((d) => P.merchRecipe(d))), 'the page reads back PawPrint\'s own recipes');
  const mixed = [{ id: 'w', key: 'wolf', name: 'Wolfie' }, pack[0], null, { id: 'q', key: 'pug', name: 'ポチ' }];
  const d3 = dec(E.merchLink(mixed));
  ok(d3.ok && d3.dogs.length === 2 && d3.dogs[0].name === 'Pup 0' && d3.dogs[1].key === 'pug' && d3.dogs[1].name === '', 'a dog that cannot be encoded is left out; a name the font cannot draw goes without the name (the page offers to type one)');
  ok(E.merchLink([{ id: 'w', key: 'wolf' }]) === null && E.merchLink([]) === null && E.merchLink(null) === null, 'no dog left: null');
  const s = E.merchLink(pack, { active: 'd2', share: { prod: 'mug', pose: 'happy' } });
  ok(/#p=[A-Za-z0-9_-]+&prod=mug&pose=happy&from=share$/.test(s) && dec(s).dogs.length === 1 && dec(s).dogs[0].name === 'Pup 2', 'opts.share: that one dog, then &prod=mug&pose=happy&from=share', s);
  ok(/&prod=tee&pose=sit&from=share$/.test(E.merchLink(pack, { share: { prod: 'tee', pose: 'sit' } })), 'the tee and the sit pose too');
  const s2 = E.merchLink(pack, { share: { prod: 'stickers', pose: 'happy' } }), s3 = E.merchLink(pack, { share: { prod: 'mug', pose: 'jump' } }), s4 = E.merchLink(pack, { share: { prod: '<b>', pose: '"x' } });
  ok([s2, s3, s4].every((x) => /#p=[A-Za-z0-9_-]+$/.test(x) && dec(x).dogs.length === 1), 'a product or pose the page does not offer: the one dog without the tail (the page shows its dog list)');
  ok(E.merchLink(pack, { base: 'https://test.doodledoggo.app/merch/' }).startsWith('https://test.doodledoggo.app/merch/#p=') && E.merchLink(pack, { base: 'https://x.example/m/#old' }).startsWith('https://x.example/m/#p='), 'opts.base: another address (the test copy); its own # part is dropped');
  const full = E.merchLink(pack).split('#')[1].length, l5 = E.merchLink(pack.slice(0, 5)).split('#')[1].length;
  const cut = E.merchLink(pack, { max: l5 }), dc = dec(cut);
  ok(cut.split('#')[1].length <= l5 && dc.dogs.length === 5 && dc.dogs[4].name === 'Pup 4', `too long: dogs are dropped from the end until the text after # fits (${full} -> ${cut.split('#')[1].length} chars, 5 dogs)`);
  ok(E.merchLink(pack, { max: 10 }) === null, 'not even one dog fits: null');
  ok(E.merchLink(pack, { max: 5000 }) === E.merchLink(pack), 'max never goes past 1024');
  const big = Array.from({ length: 8 }, (_, i) => ({ id: 'b' + i, key: G.BREEDS[i], genes: G.STARTER_GENES[G.BREEDS[i]], sparkle: true, mix: { head: G.BREEDS[i + 8] }, name: 'ÀÉÎÕÜàéîõüßÆæØøÞþÐðÇ', sex: 'female', born: iso(0), outfit: Object.keys(ART_ALL).reduce((o, k) => { o[k] = ART_ALL[k][0]; return o; }, {}) }));
  const bl = E.merchLink(big, { share: undefined }), bh = bl.split('#')[1];
  ok(bh.length <= 1024 && dec(bl).dogs.length === 8, `the biggest pack fits: ${bh.length} chars after #`);
}

console.log(fails ? `\n${fails} of ${checks} checks FAILED` : `\nall ${checks} checks passed`);
process.exit(fails ? 1 : 0);
