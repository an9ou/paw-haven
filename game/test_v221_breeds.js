// v221_breeds (SPEC + GENES/LINES lane, V221.md): the five v2.21 breeds, dalmatian, bernese, aussie, cavalier, jrt (BREEDS 36 to 40).
// 1. genes (node): keys appended in order, sizes, starters, the coats of V221.md 3 in each catalogue, no double merle possible
//    (only the Aussie carries M, never M/M; every pair of two M carriers is blocked; random litters are legal coats of their breed);
// 2. every per-breed table has the five (node, the V221.md 4 list), the care notes are the V221.md 3 texts, the mixes, Dog Card words and DC_LIM;
// 3. the art: once MS2_LIVE is on, every new key must have its own PawArt drawing (the mutt placeholder never ships);
// 4. the gate off (the default, as on itch.io today): adoption 35, no rescue, roster, playboard, card, journal tab or mix of the five, also for an old save;
// 5. the gate on (prefs.ms2Test, as the GitHub Pages test copy): 40 at adoption, adopt a Dalmatian, the five in the journal, rescues, cards,
//    the welfare rules (two merle Aussies never pair, the Bernese giant rule) and a playdate's pups, and the switch flips back at run time.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
function closeOf(s, i) {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === "'" || c === '"' || c === '`') { j++; while (s[j] !== c) { if (s[j] === '\\') j++; j++; } continue; }
    if (c === '/' && s[j + 1] === '/') { while (s[j] !== '\n') j++; continue; }
    if (c === '/' && s[j + 1] === '*') { j = s.indexOf('*/', j) + 1; continue; }
    if ('{[('.includes(c)) depth++; else if ('}])'.includes(c)) { depth--; if (!depth) return j; }
  }
  throw new Error('unclosed');
}
function table(file, marker) {
  const s = rd(file), m = s.indexOf(marker);
  if (m < 0 || s.indexOf(marker, m + 1) >= 0) throw new Error(file + ': ' + marker + ' missing or not unique');
  let b = m + marker.length; while (!/[\[{]/.test(s[b])) b++;
  return new Function('return ' + s.slice(b, closeOf(s, b) + 1))();
}
const NEW = ['dalmatian', 'bernese', 'aussie', 'cavalier', 'jrt'];
const INFO = { // name shown (FALLBACK_DOGS breed), starter name, starter coat, BREED_SIZE, genes SIZE, trait, litter group
  dalmatian: ['Dalmatian', 'Sprinkles', 'Black spotted', 'big', 'large', 'follow', 'large'],
  bernese: ['Bernese Mountain Dog', 'Fondue', 'Tricolour', 'big', 'large', 'loyal', 'giant'],
  aussie: ['Australian Shepherd', 'Pavlova', 'Black tricolour', 'medium', 'medium', 'herd', 'medium'],
  cavalier: ['Cavalier King Charles Spaniel', 'Scone', 'Blenheim', 'small', 'small', 'needy', 'small'],
  jrt: ['Jack Russell Terrier', 'Pickle', 'White and tan', 'small', 'small', 'sniff', 'small']
};
const COATS = { // V221.md 3: the coats each catalogue offers (from the breed's own genes)
  dalmatian: ['Black spotted', 'Liver spotted'],
  bernese: ['Tricolour'],
  aussie: ['Black', 'Black and white', 'Black and copper', 'Black tricolour', 'Red', 'Red and white', 'Red and copper', 'Red tricolour',
    'Blue merle', 'Blue merle and white', 'Blue merle and copper', 'Blue merle tricolour', 'Red merle', 'Red merle and white', 'Red merle and copper', 'Red merle tricolour', 'Yellow', 'Yellow and white'],
  cavalier: ['Blenheim', 'Tricolour', 'Ruby', 'Black and tan'],
  jrt: ['White and tan', 'Tricolour', 'White and black']
};

require('./test_lib').run('v221_breeds', async (t) => {
  const { ok, sec, ev, S } = t;

  sec('1. genes (node): keys, sizes, starters, coats, no double merle');
  const G = require('../mods/genes.js');
  ok(G.BREEDS.length === 40 && G.BREEDS.slice(35).join() === NEW.join(), 'PawGenes.BREEDS: the five appended at 36 to 40, in the V221.md order');
  ok(NEW.every((k) => G.SIZE[k] === INFO[k][4]), 'genes SIZE: ' + NEW.map((k) => k + ' ' + G.SIZE[k]).join(', '));
  ok(NEW.every((k) => G.phenotype(G.STARTER_GENES[k], k).coatName === INFO[k][2]), 'starter coats: ' + NEW.map((k) => G.phenotype(G.STARTER_GENES[k], k).coatName).join(', '));
  ok(NEW.every((k) => G.STARTER_GENES[k].M.join() === 'm,m'), 'every starter is m/m (merle comes from rescues and playdates)');
  const cats = {}; NEW.forEach((k) => { cats[k] = G.coatCatalog(k).map((c) => c.coat); });
  NEW.forEach((k) => ok(COATS[k].every((n) => cats[k].includes(n)) && cats[k].every((n) => COATS[k].includes(n)), `${k}: the catalogue is exactly ${COATS[k].length} coats (${cats[k].join(', ')})`));
  NEW.forEach((k) => ok(!G.coatCatalog(k).find((c) => c.coat === INFO[k][2]).rare, `${k}: the starter coat is not rare`));
  ok(NEW.filter((k) => k !== 'aussie').every((k) => G.FREQ[k].M === 0 && cats[k].every((n) => !/merle/i.test(n))), 'no merle in the Dalmatian, Bernese, Cavalier or Jack Russell');
  ok(G.FREQ.aussie.M > 0 && G.FREQ.aussie.M < 0.5, 'the Aussie carries merle as M/m (FREQ M ' + G.FREQ.aussie.M + ')');
  {
    let mm = 0, n = 0, bad = 0; const r = Math.random;
    for (const k of NEW) for (let i = 0; i < 3000; i++) { const g = G.randomGenotype(k, r); if (g.M[0] === 'M' && g.M[1] === 'M') mm++; if (!cats[k].includes(G.phenotype(g, k).coatName)) bad++; n++; }
    ok(mm === 0 && bad === 0, `${n} random rescues: never M/M, every coat in its catalogue (${mm} M/M, ${bad} off-catalogue)`);
  }
  {
    // every pair of two Aussies that both carry M (seen or hidden on yellow) is a double-merle risk, and predict never offers an M/M pup
    const r = Math.random; let pairs = 0, flagged = 0, mmRows = 0, illegal = 0;
    for (let i = 0; i < 600; i++) {
      const a = G.randomGenotype('aussie', r), b = G.randomGenotype('aussie', r), both = a.M.includes('M') && b.M.includes('M');
      if (both) { pairs++; if (G.isDoubleMerle(a, b)) flagged++; }
      else for (let j = 0; j < 4; j++) { const g = G.inherit(a, b, r); if (g.M[0] === 'M' && g.M[1] === 'M') mmRows++; if (!G.coatCatalog('aussie', { all: true }).some((c) => c.coat === G.phenotype(g, 'aussie').coatName)) illegal++; }
    }
    ok(pairs > 0 && flagged === pairs, `isDoubleMerle flags every Aussie pair with two M carriers (${flagged} of ${pairs})`);
    ok(mmRows === 0 && illegal === 0, `the pups of the allowed Aussie pairs are never M/M and always a known coat (${mmRows}, ${illegal})`);
    const yellowMerle = { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] };
    const ph = G.phenotype(yellowMerle, 'aussie');
    ok(ph.coatName === 'Yellow' && ph.merleHidden && G.isDoubleMerle(yellowMerle, { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] }), 'a yellow Aussie with hidden merle still counts as merle for the pairing rule');
  }
  {
    // the puppies of two dogs of the same new breed always have a coat of that breed (same-breed litters are legal coats)
    const r = Math.random; let bad = [];
    for (const k of NEW) for (let i = 0; i < 300; i++) { const a = G.randomGenotype(k, r), b = G.randomGenotype(k, r); if (G.isDoubleMerle(a, b)) continue; const c = G.phenotype(G.inherit(a, b, r), k).coatName; if (!cats[k].includes(c)) bad.push(k + ':' + c); }
    ok(!bad.length, 'same-breed pups keep to the breed catalogue ' + bad.slice(0, 5).join(' '));
  }
  ok(G.phenotype({ B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, 'aussie').coat.white === 0.25, 'an Aussie never draws more white than the trim (WHITE_TRIM)');
  ok(G.phenotype({ B: ['b', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, 'dalmatian').coat.dark === G.SHADES.dalmatian.liver[2], 'a liver Dalmatian: the spots (dark) are liver, the ground white');
  {
    const want = { 'dalmatian|lab': 'Dalmador', 'bernese|stdpoodle': 'Bernedoodle', 'golden|bernese': 'Golden Mountain Dog', 'aussie|stdpoodle': 'Aussiedoodle', 'corgi|aussie': 'Auggie',
      'poodle|cavalier': 'Cavapoo', 'bichon|cavalier': 'Cavachon', 'pug|jrt': 'Jug', 'corgi|jrt': 'Cojack', 'cavalier|jrt': 'Jackalier' };
    const got = Object.keys(want).map((p) => { const [a, b] = p.split('|'); return (G.MIXES[G.mixKey(a, b)] || {}).name; });
    ok(got.join() === Object.values(want).join(), 'mix names: ' + got.join(', '));
    const others = G.BREEDS.filter((k) => k !== 'mutt'), miss = [], names = [];
    NEW.forEach((k) => others.forEach((o) => { if (o === k) return; const m = G.MIXES[G.mixKey(k, o)]; if (!m || m.name === 'Mutt mix' || ![k, o].includes(m.head)) miss.push(k + '|' + o); else names.push(m.name); }));
    ok(!miss.length && names.length === 5 * 38, `every new breed has a named mix with each of the 38 other non-mutt breeds, head one of the two (${names.length}; missing ${miss.slice(0, 6).join(' ')})`);
    const all = Object.keys(G.MIXES).map((k) => G.MIXES[k].name).filter((n) => n !== 'Mutt mix');
    ok(new Set(all).size === all.length, 'every mix name is used once');
    ok(NEW.every((k) => G.MIXES[G.mixKey('mutt', k)].name === 'Mutt mix'), 'a mutt with any new breed is a Mutt mix');
    ok(!names.some((n) => /breed|stud|sell|;/i.test(n)), 'no mix name uses a banned word');
  }

  sec('2. every per-breed table has the five (node, V221.md 4)');
  const full = (label, t0, keys) => { const have = new Set(Array.isArray(t0) ? t0.map((x) => (x && typeof x === 'object' ? x.key : x)) : Object.keys(t0)); const miss = (keys || NEW).filter((k) => !have.has(k)); ok(!miss.length, `${label} has the five (missing: ${miss.join(' ')})`); };
  const core = 'game/src/00_core.js', yard = 'game/src/03_yard.js';
  const bk = table(core, 'const BREED_KEYS = '); ok(bk.length === 40 && bk.slice(35).join() === NEW.join() && bk.join() === G.BREEDS.join(), 'BREED_KEYS is PawGenes.BREEDS (40, the same order)');
  ok(table('game/src/13b_breeding.js', 'const BR_KEYS = ').join() === G.BREEDS.join(), '13b BR_KEYS is PawGenes.BREEDS');
  const sig = table(core, 'const SIG = '); full('SIG', sig); ok(NEW.every((k) => sig[k].n && sig[k].fx && sig[k].pose && sig[k].say), 'SIG rows have n, fx, pose and say');
  const pl = table(core, 'const PLACE_LINES = '); ok(NEW.every((k) => ['house', 'park', 'river', 'woods', 'beach', 'market'].every((p) => pl[k] && pl[k][p])), 'PLACE_LINES: the six places each');
  const fav = table(core, 'const FAV = '), foods = ['Salmon Pâté', 'Pupcake', 'Basic Kibble', 'Bone-shaped Biscuit', 'Chicken & Rice Bowl'], toys = ['Plush Bone', 'Puzzle Feeder', 'Tennis Ball', 'Squeaky Duck', 'Rope Tug', 'Frisbee'];
  ok(NEW.every((k) => fav[k] && fav[k].food.every((x) => foods.includes(x)) && toys.includes(fav[k].toy) && fav[k].act), 'FAV names real foods and toys');
  full('BARK', table(core, 'const BARK = '));
  const fb = table(core, 'const FALLBACK_DOGS = ');
  ok(NEW.every((k) => { const d = fb.find((x) => x.key === k); return d && d.breed === INFO[k][0] && d.name === INFO[k][1] && d.personality && d.joke; }), 'FALLBACK_DOGS: the five with their names and breed names (the SP rows of the ART lanes copy them)');
  const jk = table(core, 'const JOKES = '); ok(NEW.every((k) => jk[k] && jk[k].length >= 5 && jk[k][0] === fb.find((x) => x.key === k).joke), 'JOKES: five each, the first is the card joke');
  const wx = table(yard, 'const WX_LINES = '); ok(NEW.every((k) => ['rain', 'coat', 'snow', 'warm', 'hot', 'night', 'dawn'].every((p) => wx[k] && wx[k][p])), 'WX_LINES: all seven each');
  ok(NEW.every((k) => /shade/i.test(wx[k].hot) && /water/i.test(wx[k].hot)), 'every hot-day line points to shade and water');
  ['EAT_LINES', 'POTTY_LINES', 'GREET_LINES', 'WALK_LINES'].forEach((n) => full(n, table(yard, 'const ' + n + ' = ')));
  const tips = table(yard, 'const BD_TIPS = '), spec = rd('V221.md');
  NEW.forEach((k) => { const m = spec.match(new RegExp('^\\| ' + k + ' \\| ([^|]+) \\|$', 'm')); ok(m && tips[k] === m[1].trim(), `BD_TIPS.${k} is the V221.md 3 care note`); });
  ok(NEW.every((k) => tips[k].split('. ').length === 2 && !/;/.test(tips[k])), 'each care note is two sentences, no semicolons');
  ok(!/deaf|sad|sick|ill\b|disease|die/i.test(tips.dalmatian + tips.cavalier), 'the Dalmatian and Cavalier notes are kind (no deaf, sick or sad words)');
  ok(table(yard, 'const BD_HOT = ').bernese === 1, 'BD_HOT: the Bernese gets the hot-day toast (a heat tip)');
  full('DISH_FAV', table('game/src/11_garden_kitchen.js', 'const DISH_FAV = ')); full('BUDDY_FB', table('game/src/11_garden_kitchen.js', 'const BUDDY_FB = '));
  full('PERS', table('game/src/15_trick_training.js', 'const PERS = ')); full('NOSE_DY', table('game/src/15b_trick_games.js', 'const NOSE_DY = '));
  const combo = table('game/src/15b_trick_games.js', 'const SIG_COMBO = '), tricks = ['Sit', 'Paw', 'Lie Down', 'Roll Over', 'Spin', 'Play Dead', 'Dance', 'Bow'];
  ok(NEW.every((k) => combo[k] && combo[k].length === 3 && combo[k].every((x) => tricks.includes(x))), 'SIG_COMBO: three known tricks each');
  const vf = 'game/src/16_voices_idle.js', vs = rd(vf);
  const ds = table(vf, 'const DOG_SIZE = '); ok(NEW.every((k) => ds[k] === INFO[k][4]), 'DOG_SIZE matches genes SIZE');
  full('ECHO_P', table(vf, 'const ECHO_P = ')); full('ECHO_KIND', table(vf, 'const ECHO_KIND = '));
  ok(NEW.every((k) => vs.includes("pk === '" + k + "'")) && /\.concat\(v221On\(\) \? V221_KEYS : \[\]\)\); playBark/.test(vs), 'idle weights know the five, npcBark has them only while on');
  const ears = table('game/src/31_winter.js', 'const WN_EARS = '); ok(NEW.every((k) => ['prick', 'flop'].includes(ears[k])), 'WN_EARS prick or flop');
  full('Mt. Fuji jpPlaceLines', table('game/src/33_japan.js', 'const jpPlaceLines = '));
  const pers = table('game/src/36_personality.js', 'const BREED_PERS = '), known = new Set(Object.keys(pers).filter((k) => !NEW.includes(k)).map((k) => pers[k].trait));
  ok(NEW.every((k) => pers[k] && pers[k].trait === INFO[k][5] && known.has(pers[k].trait) && pers[k].ask.length >= 2), 'BREED_PERS: an existing trait each (' + NEW.map((k) => pers[k].trait).join(', ') + ')');
  const bs = table('game/src/36_personality.js', 'const BREED_SIZE = '); ok(NEW.every((k) => bs[k] === INFO[k][3]), 'BREED_SIZE: ' + NEW.map((k) => bs[k]).join(', '));
  const blh = table('game/src/38_ball.js', 'const BL_HEAD = '); ok(NEW.every((k) => Array.isArray(blh[k]) && blh[k].length === 4 && blh[k].every(Number.isFinite)), 'BL_HEAD [x, y, rx, ry] each');
  const tk = table('game/src/39_tokyo.js', 'const TK_LINES = '); ok(NEW.every((k) => ['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba'].every((p) => tk[k] && tk[k][p])), 'TK_LINES: the six Tokyo places each');
  const faces = table('game/src/41_expressions.js', 'const BREED_FACES = '), EXPR = ['sleepy', 'surprised', 'curious', 'hearts', 'proud', 'guilty', 'sneeze', 'blep', 'zoomies', 'pout', 'dreamy', 'wow', 'wink', 'yum'];
  ok(Object.keys(faces).length === 40 && NEW.every((k) => faces[k] && faces[k].length >= 2 && faces[k].length <= 4 && faces[k].every((x) => EXPR.includes(x))), 'BREED_FACES: 40 rows, 2 to 4 known faces each');
  full('AG_LINES', table('game/src/44_agility.js', 'const AG_LINES = ')); full('PL_LINES', table('game/src/45_pool.js', 'const PL_LINES = '));
  const sg = table('game/src/10_sex_age_genes.js', 'const STARTER_GENES = ');
  ok(NEW.every((k) => sg[k] && sg[k].coat === INFO[k][2] && G.LOCUS_KEYS.every((l) => sg[k][l].join() === G.STARTER_GENES[k][l].join())), 'the game STARTER_GENES copy mods/genes.js, with the starter coat names');
  const lit = rd('game/src/10_sex_age_genes.js').match(/litters: (\{[^\n]*\} \}),\n/);
  {
    const L = new Function('return ' + lit[1])(), all = [].concat(...Object.values(L).map((x) => x.breeds));
    ok(all.length === 40 && new Set(all).size === 40 && NEW.every((k) => L[INFO[k][6]].breeds.includes(k)), 'RULES.litters: every breed once, the five in ' + NEW.map((k) => INFO[k][6]).join(', '));
    ok(/giant: \{ breeds: \['dane', 'mastiff', 'bernese'\], adultMonths: 18/.test(rd('game/src/10_sex_age_genes.js')), 'the giant rules (18 months, rest, at most 3 litters) cover the Bernese');
  }
  const tm = table('mods/toys.js', 'var BREED_M = '); ok(NEW.every((k) => tm[k] && Array.isArray(tm[k].d)), 'toys BREED_M');
  full('toys TRAITS', table('mods/toys.js', 'var TRAITS = ')); full('toys TOYS_LINES', table('mods/toys.js', 'var TOYS_LINES = '));
  const voices = table('mods/pawaudio.js', 'var BREEDS = '), trim = table('mods/pawaudio.js', 'var TRIM = '), nbt = table('mods/pawaudio.js', 'var NB_TRIM = ');
  ok(NEW.every((k) => voices[k] && voices[k].f0 > 0 && voices[k].F.length === 3 && trim[k].length === 16 && trim[k].every(Number.isFinite) && nbt[k].length === 3), 'pawaudio: a voice, 16 trims and 3 newborn trims each');
  {
    const src = rd('mods/pawaudio.js'), tx = src.slice(src.indexOf('function breedOf(voice)'), src.indexOf('var B = copy(BREEDS[k'));
    const keyOf = (n) => new Function('b', 'var k;' + tx.slice(tx.indexOf('if (b.indexOf')) + ' return k;')(n.toLowerCase());
    const want = { Dalmatian: 'dalmatian', 'Bernese Mountain Dog': 'bernese', 'Australian Shepherd': 'aussie', 'German Shepherd': 'gsd', 'Cavalier King Charles Spaniel': 'cavalier', 'Jack Russell Terrier': 'jrt', jrt: 'jrt', aussie: 'aussie', Dane: 'dane' };
    ok(Object.keys(want).every((n) => keyOf(n) === want[n]), 'the voice picks the right breed from a key or a name (the Aussie is not the German Shepherd): ' + Object.keys(want).map((n) => keyOf(n)).join(','));
  }
  full('garden BUDDY', table('mods/garden.js', 'var BUDDY = ')); full('garden BREED_LINE', table('mods/garden.js', 'var BREED_LINE = ')); full('kitchen FAV', table('mods/kitchen.js', 'var FAV = '));
  const dcw = table('game/src/40_dogcards.js', 'const DC_BREED_WORDS = ');
  ok(dcw.length === 40 && dcw.slice(35).join() === 'Dalmatian,Berner,Aussie,Cavalier,Jack Russell', 'DC_BREED_WORDS: the five card words appended (120 dog names)');
  const lim = JSON.parse(rd('cloudflare/worker.js').match(/const DC_LIM = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
  ok(lim.breed === 40 && lim.n === 120 && lim.a === 40 && lim.b === 40 && lim.outfit === 50, 'the Worker DC_LIM is 40 breeds and 120 dog names (deployed at the launch): ' + JSON.stringify(lim));
  {
    const gl = path.join(ROOT, 'game/i18n/glossary'), miss = [];
    fs.readdirSync(gl).filter((f) => f.endsWith('.json')).forEach((f) => { const g = JSON.parse(fs.readFileSync(path.join(gl, f), 'utf8')); NEW.forEach((k) => { if (!(g.breeds && g.breeds[k])) miss.push(f + ':' + k); }); });
    ok(!miss.length, 'every glossary names the five breeds ' + miss.join(' '));
    const en = JSON.parse(rd('game/i18n/en.json'));
    ok(NEW.every((k) => en['data.breed_names.' + k] && en['data.bd_tips.' + k] && en['data.words.' + k + '.' + Object.keys(G.WORDS[k])[0]]) && en['data.parti_by.cavalier.red'] === 'Blenheim' && en['mod.genes.coat_tricolour'], 'en.json has the five breeds\' names, care notes, coat words and the new coat sentences');
  }

  sec('3. the art: the placeholder never ships');
  {
    const art = rd('dogs/pawart_dogs.js'), keys = art.match(/const KEYS=\[([^\]]*)\]/)[1].replace(/['\s]/g, '').split(','), live = /const MS2_LIVE = true/.test(rd('game/src/24b_missions2.js'));
    const missing = NEW.filter((k) => !keys.includes(k) || !new RegExp('SP\\.' + k + '=\\{').test(art));
    const ext = keys.slice(35);// the ART lanes land one at a time: the keys after the 35 are new ones, in BREEDS order (all five once both lanes are in)
    ok(keys.slice(0, 35).join() === G.BREEDS.slice(0, 35).join() && ext.every((k, i) => NEW.includes(k) && (!i || NEW.indexOf(k) > NEW.indexOf(ext[i - 1]))), 'PawArt KEYS: the 35, then the new ones in BREEDS order as the ART lanes add them (' + (ext.join(' ') || 'none yet') + ')');
    ok(!live || !missing.length, `MS2_LIVE is on, so every new breed needs its own art (missing: ${missing.join(' ') || 'none'})`);
    if (missing.length && !live) console.log(`  note: art pending for ${missing.join(', ')} (drawn as the mutt placeholder; MS2_LIVE is off, so it cannot ship)`);
  }

  sec('4. the gate off: a new game and an old save never see the five');
  await t.newGame({}, { coins: 1000 });
  const off = await ev(() => { const P = window.__paw, N = P.v221, days = [], wk = [], pb = []; const d0 = new Date('2026-11-04T12:00:00');
    for (let i = 0; i < 120; i++) { const d = new Date(d0.getTime() + i * 864e5), iso = d.toISOString().slice(0, 10); P.rescuesOn(iso).forEach((r) => days.push(r.key)); P.town.boardDogs(iso).forEach((x) => pb.push(x.key)); if (i % 7 === 0) P.sr.roster(iso).forEach((x) => wk.push(x.key)); }
    return { on: N.on(), live: N.live(), dogs: N.dogs(), tabs: N.coatBreeds(), cards: N.cardBreeds(), lists: { n: P.dc.lists.nameN, live: P.dc.lists.live.length }, rescues: days, roster: wk, board: pb, keys: N.keys }; });
  ok(!off.on && off.live.length === 35 && off.dogs.length === 35 && off.tabs.length === 35 && off.cards.length === 35, `off: 35 live keys, starters, coat tabs and card breeds (${off.live.length}/${off.dogs.length}/${off.tabs.length}/${off.cards.length})`);
  ok(off.lists.n === 115 && off.lists.live === 35, 'off: a Dog Card may use 115 dog names and 35 breeds (the Worker of today)');
  const seen = [].concat(off.dogs, off.tabs, off.cards, off.rescues, off.roster, off.board).filter((k) => NEW.includes(k));
  ok(!seen.length && off.rescues.length === 240 && off.board.length === 480, `off: 120 days of rescues and playdate boards and 18 weeks of the playroom never show the five (${seen.join(' ')})`);
  const p0 = t.p;
  await p0.click('[data-act=journal]'); await p0.waitForSelector('.panel.journal'); await p0.click('[data-jt=coats]'); await p0.waitForSelector('.ctop');
  ok(await p0.locator('.cbreed').count() === 35, 'off: 35 breed tabs on the Coats page');
  const mixes = await ev(() => document.querySelector('.cmixes .small') ? document.querySelector('.cmixes .small').textContent : '');
  ok(/of 35 breeds/.test(mixes), 'off: the Journal counts 35 breeds (' + mixes + ')');
  await t.closeX(); await t.modalGone();
  const save = await ev(() => { window.__paw.saveNow(); return localStorage.getItem('pawhaven_proto_v1'); });
  await t.ctx.close();
  const p1 = await t.mk({ storage: { pawhaven_proto_v1: save } }); await p1.goto(require('./test_lib').URL); await p1.waitForSelector('#tContinue'); await p1.click('#tContinue'); await t.calm();
  const old = await ev(() => ({ on: window.__paw.v221.on(), dogs: window.__paw.v221.dogs(), mode: window.__paw.mode, n: window.__paw.S.dogs.length }));
  ok(old.mode === 'yard' && !old.on && old.dogs.every((k) => !NEW.includes(k)) && old.n === 1, 'an old save continues with the five off');
  await t.ctx.close();
  {
    const p = await t.boot(); await p.click('#tNew'); await p.waitForSelector('.heads button');
    const heads = await ev(() => [...document.querySelectorAll('.heads button')].map((b) => b.getAttribute('aria-label')));
    ok(heads.length === 35 && !heads.some((h) => / the (Dalmatian|Bernese Mountain Dog|Australian Shepherd|Cavalier King Charles Spaniel|Jack Russell Terrier)$/.test(h)), `off: 35 heads in the adoption carousel, none of the five`);
    await t.ctx.close();
  }

  sec('5. the gate on (prefs.ms2Test, as the GitHub Pages test copy)');
  {
    const p = await t.boot({ prefs: { ms2Test: true } }); await p.click('#tNew'); await p.waitForSelector('.heads button');
    ok(await p.locator('.heads button').count() === 40, 'on: 40 heads in the adoption carousel');
    const [br, nm, coat] = INFO.dalmatian;
    await p.click(`.heads button[aria-label$=" the ${br}"]`);
    ok(await t.until((br) => (document.querySelector('.adopt-card h3') || {}).textContent.includes('the ' + br), br), `the shelter card shows ${nm} the ${br}`);
    const tip = await ev(() => { const e = document.querySelector('.adopt-card .bd-tip'); return e ? e.textContent : ''; });
    ok(/hand signals/.test(tip) && /fresh water/.test(tip), 'the Dalmatian care note is on the card: ' + tip);
    await p.click('#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
    const s = await S();
    ok(s.dog.key === 'dalmatian' && s.dog.name === nm && s.dog.genes.M.join() === 'm,m' && (await t.mode()) === 'yard', 'adopted Sprinkles the Dalmatian, m/m, in the yard');
    ok(await t.until(() => !!document.querySelector('#dogArt svg.pa-dog')), 'drawn in the yard (its own art, or the mutt placeholder until the art lands)');
    ok((await ev(() => window.__paw.coat(window.__paw.S.dog))).coatName === coat, 'starter coat ' + coat);
    await t.patch({ bond: { level: 8, pts: 2500 }, coins: 2000, house: 'Royal Castle Kennel', careDays: 60, stats: { hunger: 90, happy: 90, energy: 90, clean: 90 } });
    const on = await ev((NEW) => { const P = window.__paw, N = P.v221, days = []; const d0 = new Date('2026-11-04T12:00:00');
      for (let i = 0; i < 120; i++) P.rescuesOn(new Date(d0.getTime() + i * 864e5).toISOString().slice(0, 10)).forEach((r) => days.push(r.key));
      return { on: N.on(), live: N.live().length, tabs: N.coatBreeds().length, cards: N.cardBreeds().length, nameN: P.dc.lists.nameN, newRescues: [...new Set(days.filter((k) => NEW.includes(k)))], art: N.ownArt() }; }, NEW);
    ok(on.on && on.live === 40 && on.tabs === 40 && on.cards === 40 && on.nameN === 120, `on: 40 live keys, coat tabs and card breeds, 120 card names (${JSON.stringify(on)})`);
    ok(on.newRescues.length >= 3, 'on: the new breeds turn up at the shelter as rescues (' + on.newRescues.join(', ') + ')');
    if (on.art.length < 5) console.log('  note: own art so far: ' + (on.art.join(', ') || 'none') + ' (the rest draw as the mutt placeholder)');
    const dogs = await ev((NEW) => { const P = window.__paw; return NEW.filter((k) => k !== 'dalmatian').map((k, i) => { const d = P.addDog({ key: k, sex: i % 2 ? 'male' : 'female', months: 24 }, 'N' + k); return { k, id: d.id, coat: P.coat(d).coatName, M: d.genes.M.join('') }; }); }, NEW);
    ok(dogs.every((d) => COATS[d.k].includes(d.coat)), 'the other four join the pack with a catalogue coat: ' + dogs.map((d) => d.k + ' ' + d.coat).join(', '));
    await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=coats]'); await p.waitForSelector('.ctop');
    ok(await p.locator('.cbreed').count() === 40, 'on: 40 breed tabs on the Coats page');
    for (const k of NEW) { await p.click(`[data-cbreed="${k}"]`); await p.waitForSelector(`.cbreed.on[data-cbreed="${k}"]`); const n = await ev(() => document.querySelectorAll('.cgrid .coat').length); ok(n >= COATS[k].length, `${k}: the coat page lists its ${COATS[k].length} coats (${n} cells)`); }
    ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'the coat page does not scroll sideways');
    await t.closeX(); await t.modalGone();

    // welfare: two merle Aussies never pair; a merle and a non-merle may, and the pups are never M/M
    const iso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const w = await ev((born) => {
      const P = window.__paw, mk = (key, sex, name, M) => { const d = P.addDog({ key, sex, months: 24 }, name); d.born = born; d.bond = { level: 8, pts: 2500 }; d.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; d.litters = 0; d.lastLitter = null; d.genes.M = M; return d; };
      const f = mk('aussie', 'female', 'Merle Girl', ['M', 'm']), m1 = mk('aussie', 'male', 'Merle Boy', ['M', 'm']), m2 = mk('aussie', 'male', 'Plain Boy', ['m', 'm']);
      P.breed.setSeason(f.id, true); P.saveNow();
      const no = P.breed.canPair(f.id, m1.id), yes = P.breed.canPair(f.id, m2.id), r = P.breed.playdate(f.id, m2.id, { force: true, size: 3 });
      return { no: no.code, yes: yes.ok, ok: r.ok, pups: (f.preg && f.preg.pups || []).map((x) => ({ key: x.key, M: x.genes.M.join(''), coat: window.PawGenes.phenotype(x.genes, x.key).coatName })), giant: window.PawBreeding.RULES.giant.breeds.join() };
    }, iso(30));
    ok(w.no === 'merle', 'two merle Aussies are never paired (code ' + w.no + ')');
    ok(w.yes && w.ok && w.pups.length >= 2 && w.pups.every((x) => x.key === 'aussie' && x.M !== 'MM' && COATS.aussie.includes(x.coat)), 'a merle and a plain Aussie: pups never M/M, all catalogue coats ' + JSON.stringify(w.pups));
    ok(/bernese/.test(w.giant), 'the giant rules include the Bernese (' + w.giant + ')');
    const flip = await ev(() => { const P = window.__paw, a = P.v221.dogs().length; P.ms2.test(false); const b = P.v221.dogs().length, c = P.v221.live().length; P.ms2.test(true); return [a, b, c, P.v221.dogs().length]; });
    ok(flip.join() === '40,35,35,40', 'the switch flips at run time (on 40, off 35, on 40): ' + flip.join());
    await t.SH('01_v221_on_yard');
  }
  ok(t.errors.length === 0, 'no console errors');
}, { timeout: 600000 });
