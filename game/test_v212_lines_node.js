// v2.12 LINES (V212.md section 4): every per-breed table has all 35 keys (the 14 new ones in the V212.md order), the care notes match V212.md 3,
// and the odd places (idle weights, npcBark, coatBreeds) know the new breeds. Node only: node game/test_v212_lines_node.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let fail = 0, pass = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };

const NEW = ['dobie', 'corso', 'pitbull', 'minpin', 'lab', 'malamute', 'chow', 'stdpoodle', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'];
const OLD = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie', 'akita', 'spitz', 'pom', 'afghan', 'dane', 'mastiff', 'gsd'];
const ALL = OLD.concat(NEW);

// the text of the literal that follows `marker` (string and comment aware bracket match), evaluated
function closeOf(s, i) {
  const open = s[i]; let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === "'" || c === '"' || c === '`') { j++; while (s[j] !== c) { if (s[j] === '\\') j++; j++; } continue; }
    if (c === '/' && s[j + 1] === '/') { while (s[j] !== '\n') j++; continue; }
    if (c === '/' && s[j + 1] === '*') { j = s.indexOf('*/', j) + 1; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') { depth--; if (depth === 0) return j; }
  }
  throw new Error('unclosed ' + open);
}
function table(file, marker) {
  const s = rd(file), m = s.indexOf(marker);
  if (m < 0) throw new Error(file + ': no ' + marker);
  if (s.indexOf(marker, m + 1) >= 0) throw new Error(file + ': ' + marker + ' is not unique');
  let b = m + marker.length; while (!/[\[{]/.test(s[b])) b++;
  return new Function('return ' + s.slice(b, closeOf(s, b) + 1))();
}
const keysOf = (t) => Array.isArray(t) ? t.map((x) => (x && typeof x === 'object' ? x.key : x)) : Object.keys(t);
function full(label, t, keys, map) {
  const have = new Set(keysOf(t));
  const miss = (keys || ALL).filter((k) => !have.has(map ? map(k) : k));
  ok(miss.length === 0, `${label}: has every key (missing: ${miss.join(', ')})`);
}
const mustHaveNew = (label, t) => full(label, t, NEW);

// the order of the keys
const artKeys = rd('dogs/pawart_dogs.js').match(/const KEYS=\[([^\]]*)\]/)[1].replace(/['\s]/g, '').split(',');
ok(artKeys.join() === ALL.join() || artKeys.join() === ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie', 'akita', 'spitz', 'pom', 'afghan', 'dane', 'mastiff', 'gsd'].concat(NEW).join(), 'dogs/pawart_dogs.js KEYS ends with the 14 new keys in V212.md order');
const bk = table('game/src/00_core.js', 'const BREED_KEYS = ');
ok(bk.join() === artKeys.join(), 'BREED_KEYS equals the PawArt KEYS (35, same order)');
ok(bk.length === 35, 'BREED_KEYS has 35 keys');

// 00_core.js
const core = 'game/src/00_core.js';
full('SIG', table(core, 'const SIG = '), ALL);
const sig = table(core, 'const SIG = '); NEW.forEach((k) => ok(sig[k] && sig[k].n && sig[k].fx && sig[k].pose && sig[k].say, 'SIG.' + k + ' has n, fx, pose and say'));
const pl = table(core, 'const PLACE_LINES = '); full('PLACE_LINES', pl);
NEW.forEach((k) => ok(['house', 'park', 'river', 'woods', 'beach', 'market'].every((p) => pl[k] && pl[k][p]), 'PLACE_LINES.' + k + ' has the six places'));
full('FAV', table(core, 'const FAV = '));
full('BARK', table(core, 'const BARK = '));
const fb = table(core, 'const FALLBACK_DOGS = '); full('FALLBACK_DOGS', fb);
const jk = table(core, 'const JOKES = '); full('JOKES', jk);
NEW.forEach((k) => ok(Array.isArray(jk[k]) && jk[k].length >= 5, 'JOKES.' + k + ' has 5 or more jokes'));
// FALLBACK_DOGS copies the dogs/pawart_dogs.js SP rows (names, breed, personality, joke)
const art = rd('dogs/pawart_dogs.js');
NEW.forEach((k) => {
  const m = art.match(new RegExp("SP\\." + k + "=\\{[^}]*?name:'([^']*)',breed:'([^']*)',personality:'([^']*)',joke:'([^']*)'"));
  const d = fb.find((x) => x.key === k);
  ok(m && d && d.name === m[1] && d.breed === m[2] && d.personality === m[3] && d.joke === m[4], 'FALLBACK_DOGS.' + k + ' copies the SP row');
});
ok(fb.find((x) => x.key === 'poodle').breed === 'Miniature Poodle', 'FALLBACK_DOGS shows the old poodle as Miniature Poodle');
const food = ['Salmon Pâté', 'Pupcake', 'Basic Kibble', 'Bone-shaped Biscuit', 'Chicken & Rice Bowl'], toys = ['Plush Bone', 'Puzzle Feeder', 'Tennis Ball', 'Squeaky Duck', 'Rope Tug', 'Frisbee'];
const fav = table(core, 'const FAV = '); NEW.forEach((k) => ok(fav[k].food.every((f) => food.includes(f)) && toys.includes(fav[k].toy), 'FAV.' + k + ' names real items'));

// 03_yard.js
const yard = 'game/src/03_yard.js';
const wx = table(yard, 'const WX_LINES = '); full('WX_LINES', wx);
NEW.forEach((k) => ok(['rain', 'coat', 'snow', 'warm', 'hot', 'night', 'dawn'].every((p) => wx[k] && wx[k][p]), 'WX_LINES.' + k + ' has all seven'));
['chow', 'malamute', 'shihtzu'].forEach((k) => ok(/shade/i.test(wx[k].hot) && /water/i.test(wx[k].hot), 'WX_LINES.' + k + '.hot points to shade and water'));
full('EAT_LINES', table(yard, 'const EAT_LINES = ')); full('POTTY_LINES', table(yard, 'const POTTY_LINES = '));
full('GREET_LINES', table(yard, 'const GREET_LINES = ')); full('WALK_LINES', table(yard, 'const WALK_LINES = '));
const tips = table(yard, 'const BD_TIPS = '); mustHaveNew('BD_TIPS', tips);
// the care notes are the exact V212.md section 3 texts
const spec = rd('V212.md'); NEW.forEach((k) => {
  const m = spec.match(new RegExp('^\\| ' + k + ' \\| (Dobermans|Cane|Pit|Min|Labs|Malamutes|That|Poodle|Westies|Yorkie|Shih)[^|]*\\|$', 'm'));
  ok(m && tips[k] === m[0].slice(m[0].indexOf('|', 2) + 2, m[0].lastIndexOf('|') - 1), 'BD_TIPS.' + k + ' is the V212.md text');
});
const nm = table(yard, 'const NOSE_MUL = '); ok(Object.keys(nm).every((k) => ALL.includes(k)), 'NOSE_MUL keys are real breeds');
const hot = table(yard, 'const BD_HOT = '); ok(Object.keys(hot).every((k) => tips[k] || ALL.includes(k)), 'BD_HOT keys are real breeds');

// the other game files
const jr = rd('game/src/07_treasure_journal.js');
ok(/return b\.slice\(0, 35\)/.test(jr), 'coatBreeds() keeps 35 breeds');
full('DISH_FAV', table('game/src/11_garden_kitchen.js', 'const DISH_FAV = ')); full('BUDDY_FB', table('game/src/11_garden_kitchen.js', 'const BUDDY_FB = '));
full('PERS', table('game/src/15_trick_training.js', 'const PERS = '));
mustHaveNew('NOSE_DY', table('game/src/15b_trick_games.js', 'const NOSE_DY = '));
const nx = table('game/src/15b_trick_games.js', 'const NOSE_DX = '); ok(Object.keys(nx).every((k) => ALL.includes(k)), 'NOSE_DX keys are real breeds');
ok(table('game/src/15b_trick_games.js', 'const FOOD_DOGS = ').every((k) => ALL.includes(k)), 'FOOD_DOGS are real breeds');
const combo = table('game/src/15b_trick_games.js', 'const SIG_COMBO = '); full('SIG_COMBO', combo);
const tricks = ['Sit', 'Paw', 'Lie Down', 'Roll Over', 'Spin', 'Play Dead', 'Dance', 'Bow'];
NEW.forEach((k) => ok(combo[k].length === 3 && combo[k].every((t) => tricks.includes(t)), 'SIG_COMBO.' + k + ' is three known tricks'));
const v = 'game/src/16_voices_idle.js', vs = rd(v);
const sizes = table(v, 'const DOG_SIZE = '); full('DOG_SIZE', sizes);
NEW.forEach((k) => ok(['small', 'medium', 'large'].includes(sizes[k]), 'DOG_SIZE.' + k + ' is a class'));
const ep = table(v, 'const ECHO_P = '), ek = table(v, 'const ECHO_KIND = '); mustHaveNew('ECHO_P (bark replies)', ep); mustHaveNew('ECHO_KIND (bark replies)', ek);
NEW.forEach((k) => { ok(vs.includes("'" + k + "'") && vs.includes("pk === '" + k + "'"), 'idle weights and npcBark know ' + k); });
const sk = table(v, 'const SPEAK_KIND = '); ok(Object.keys(sk).every((k) => ALL.includes(k)), 'SPEAK_KIND keys are real breeds');
const gk = table(v, 'const GREET_KIND = '); ok(Object.keys(gk).every((k) => ALL.includes(k)), 'GREET_KIND keys are real breeds');
const ears = table('game/src/31_winter.js', 'const WN_EARS = '); full('WN_EARS', ears);
NEW.forEach((k) => ok(ears[k] === 'prick' || ears[k] === 'flop', 'WN_EARS.' + k + ' is prick or flop'));
full('Mt. Fuji lines (jpPlaceLines)', table('game/src/33_japan.js', 'const jpPlaceLines = '));
const bl = table('game/src/38_ball.js', 'const BL_HEAD = '); full('BL_HEAD', bl);
NEW.forEach((k) => ok(Array.isArray(bl[k]) && bl[k].length === 4 && bl[k].every(Number.isFinite), 'BL_HEAD.' + k + ' is [x, y, rx, ry]'));
const tk = table('game/src/39_tokyo.js', 'const TK_LINES = '); full('TK_LINES', tk);
NEW.forEach((k) => ok(['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba'].every((p) => tk[k] && tk[k][p]), 'TK_LINES.' + k + ' has the six Tokyo places'));
ok(rd('game/src/30_shelter.js').includes('BREED_KEYS[Math.floor(r() * BREED_KEYS.length)]'), 'the shelter roster picks from BREED_KEYS (all 35)');

// the modules
const bm = table('mods/toys.js', 'var BREED_M = '); full('toys BREED_M', bm);
NEW.forEach((k) => ok(Array.isArray(bm[k].d), 'BREED_M.' + k + ' has a default offset'));
mustHaveNew('toys TRAITS', table('mods/toys.js', 'var TRAITS = ')); mustHaveNew('toys LINES', table('mods/toys.js', 'var TOYS_LINES = '));
const voices = table('mods/pawaudio.js', 'var BREEDS = '), trim = table('mods/pawaudio.js', 'var TRIM = '), nbt = table('mods/pawaudio.js', 'var NB_TRIM = ');
const pa = (k) => (k === 'dachs' ? 'dachshund' : k);
full('pawaudio BREEDS (voices)', voices, ALL, pa); full('pawaudio TRIM', trim, ALL, pa); full('pawaudio NB_TRIM', nbt, ALL, pa);
NEW.forEach((k) => { ok(voices[k] && voices[k].f0 > 0 && voices[k].F.length === 3, 'voice ' + k + ' has f0 and three formants'); ok(trim[k].length >= 15 && trim[k].every(Number.isFinite), 'TRIM.' + k + ' has a number per bark kind'); ok(nbt[k].length === 3 && nbt[k].every(Number.isFinite), 'NB_TRIM.' + k + ' has three numbers'); });
full('garden BUDDY', table('mods/garden.js', 'var BUDDY = ')); mustHaveNew('garden BREED_LINE', table('mods/garden.js', 'var BREED_LINE = '));
full('kitchen FAV', table('mods/kitchen.js', 'var FAV = '));

// the site
const prof = require('../tools/site_dogs.js');
ok(NEW.every((k) => prof.some((p) => p.key === k)), 'tools/site_dogs.js has a profile for each new breed');
ok(prof.length === 35 && prof.map((p) => p.key).join() === ALL.join(), 'tools/site_dogs.js: 35 profiles in breed order');
ok(rd('tools/site_art.js').includes("'Japanese Chin and Kai Ken are on their way.'"), 'site SOON_LINE is Japanese Chin and Kai Ken');

// the voices pick the right breed from a key or from the name (Standard Poodle must not become the Miniature one, Labrador Retriever not the Golden)
{
  const src = rd('mods/pawaudio.js'), t = src.slice(src.indexOf('function breedOf(voice)'), src.indexOf('var B = copy(BREEDS[k'));
  const keyOf = (n) => new Function('b', 'var k;' + t.slice(t.indexOf('if (b.indexOf')) + ' return k;')(n.toLowerCase());
  const want = { 'Standard Poodle': 'stdpoodle', stdpoodle: 'stdpoodle', 'Miniature Poodle': 'poodle', poodle: 'poodle', 'Labrador Retriever': 'lab', lab: 'lab', 'Golden Retriever': 'golden', 'Pit Bull': 'pitbull', pitbull: 'pitbull', 'Miniature Pinscher': 'minpin', minpin: 'minpin', 'Miniature Schnauzer': 'schnauzer', 'West Highland White Terrier': 'westie', 'Yorkshire Terrier': 'yorkie', 'Shih Tzu': 'shihtzu', shihtzu: 'shihtzu', 'Alaskan Malamute': 'malamute', 'Chow Chow': 'chow', Doberman: 'dobie', 'Cane Corso': 'corso', Maltese: 'maltese', 'Bichon Frise': 'bichon', shiba: 'shiba', husky: 'husky', dachs: 'dachshund' };
  Object.keys(want).forEach((n) => ok(keyOf(n) === want[n], `voice for "${n}" is ${want[n]} (got ${keyOf(n)})`));
}

console.log(`${pass} checks ok, ${fail} failed`);
if (!fail) console.log('ALL OK'); else process.exit(1);
