// node test_pure.js : pure-function tests for mods/kitchen.js (fixed rng, no DOM)
global.window = {};
require('../kitchen.js');
const K = global.window.PawKitchen;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + ' -> got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b));

// fixed rng (mulberry32)
function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = rng(42);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- data shape
eq(K.RECIPES.map(r => r.id), ['carrot-crunchies', 'chicken-veggie-rice', 'blueberry-pupsicle', 'pumpkin-pupcake', 'golden-harvest-stew', 'spinach-scramble', 'mystery-mush'], 'recipe ids');
eq(K.PANTRY.map(p => [p.id, p.price]), [['oats', 2], ['rice', 3], ['egg', 3], ['chicken', 8], ['water', 0]], 'pantry');
eq(K.PEOPLE_FOOD.map(p => p.id), ['onion', 'garlic', 'grapes', 'chocolate', 'raisins', 'coffee', 'gum', 'macadamia', 'avocado'], 'people food ids');
K.PEOPLE_FOOD.forEach(p => {
  ok(p.id && p.name && Array.isArray(p.where) && p.why && p.swap, 'people food fields ' + p.id);
  const sentences = (p.why + ' ' + p.swap).split(/[.!?](\s|$)/).filter(s => s && s.trim()).length;
  ok(sentences <= 2, 'at most 2 sentences ' + p.id + ' (' + sentences + ')');
});
eq(K.FAV, { shiba: 'golden-harvest-stew', corgi: 'chicken-veggie-rice', golden: 'carrot-crunchies', dachs: 'spinach-scramble', husky: 'blueberry-pupsicle', mutt: 'golden-harvest-stew' }, 'favourites');
K.RECIPES.forEach(r => ok(r.effect && 'hunger' in r.effect && 'buff' in r.effect && typeof r.hint === 'string', 'recipe fields ' + r.id));

// ---- match: every recipe, any order; near-misses do not match
K.RECIPES.filter(r => r.id !== 'mystery-mush').forEach(r => {
  for (let k = 0; k < 5; k++) eq(K.match(shuffle(r.ingredients)), r.id, 'match ' + r.id + ' shuffled');
  eq(K.match(r.ingredients.slice(1)), r.ingredients.length > 2 ? null : K.match(r.ingredients.slice(1)), 'subset ' + r.id);
  eq(K.match(r.ingredients.concat(['oats'])), null, 'superset ' + r.id);
});
eq(K.match(['carrot', 'carrot']), null, 'duplicates do not match');
eq(K.match(['oats', 'carrot', 'carrot']), null, 'extra copy does not match');
eq(K.match([]), null, 'empty');
eq(K.match(['Carrot', 'OATS']), 'carrot-crunchies', 'case-insensitive ids');

// ---- hint
const START = ['carrot-crunchies', 'chicken-veggie-rice', 'blueberry-pupsicle'];
eq(K.hint(['pumpkin', 'oats'], START), 'Close! Two of those belong together.', 'hint pupcake pair');
eq(K.hint(['egg', 'spinach', 'rice'], START), 'Close! Two of those belong together.', 'hint scramble pair');
eq(K.hint(['carrot', 'rice'], START), null, 'known recipes give no hint');
eq(K.hint(['pumpkin', 'peas'], START), null, 'one shared ingredient is not enough');
eq(K.hint(['pumpkin', 'oats'], START.concat(['pumpkin-pupcake'])), null, 'no hint once known');

// ---- discovery by experimenting
let e = K.experiment(shuffle(['pumpkin', 'oats', 'egg']), START);
eq([e.ok, e.recipe, e.discovered], [true, 'pumpkin-pupcake', true], 'discover pupcake');
e = K.experiment(['spinach', 'egg'], START.concat(['spinach-scramble']));
eq([e.ok, e.recipe, e.discovered], [true, 'spinach-scramble', false], 'known scramble not discovered');
e = K.experiment(['carrot', 'oats'], START);
eq([e.recipe, e.discovered, e.steps], ['carrot-crunchies', false, ['chop', 'bake']], 'known crunchies');
e = K.experiment(['sweet-potato', 'pumpkin', 'chicken', 'rice'], []);
eq([e.recipe, e.discovered, e.steps.length], ['golden-harvest-stew', true, 3], 'discover stew');
e = K.experiment(['pumpkin', 'oats', 'rice'], START);
eq([e.ok, e.recipe, e.discovered, e.hint], [true, 'mystery-mush', false, 'Close! Two of those belong together.'], 'mush with hint');
e = K.experiment(['carrot', 'rice'], START);
eq([e.recipe, e.hint], ['mystery-mush', null], 'mush without hint');
eq(K.experiment(['carrot'], START).reason, 'few', 'one ingredient');
eq(K.experiment(['carrot', 'oats', 'rice', 'egg', 'peas'], START).reason, 'many', 'five ingredients');
eq(K.experiment(['carrot', 'oats', 'onion'], START).reason, 'unsafe', 'onion blocks the dish');
eq(K.experiment(['carrot', 'pizza'], START).reason, 'unknown', 'unknown ingredient');

// ---- dish stars and the mini-game maths
eq(K.dishStars(3, [1]), 2, 'ceil((3+1)/2)');
eq(K.dishStars(1, [1]), 1, '1+1');
eq(K.dishStars(2, [2, 3]), 3, 'ceil((2+2.5)/2)=3');
eq(K.dishStars(1, [1, 2, 2]), 2, 'ceil((1+1.667)/2)=2');
eq(K.dishStars(3, [3, 3]), 3, '3,3');
eq(K.dishStars(1, [3]), 2, '1 with 3');
eq(K.dishStars(2, [1, 1]), 2, 'ceil(1.5)=2');
eq(K.dishStars(1, [2]), 2, 'ceil(1.5)=2 b');
eq(K.dishStars(2, []), 2, 'pantry only -> cook stars');
eq(K.dishStars(3, [null, 1]), 2, 'null (pantry) ignored');
for (let c = 1; c <= 3; c++) for (let a = 1; a <= 3; a++) for (let b = 1; b <= 3; b++) { const s = K.dishStars(c, [a, b]); ok(s >= 1 && s <= 3 && s === Math.ceil((c + (a + b) / 2) / 2), 'dishStars grid ' + [c, a, b]); }
eq([K.zoneWidth(1), K.zoneWidth(2), K.zoneWidth(3)], [0.25, 0.25, 0.15], 'zone widths');
const z = { c: 0.5, w: 0.25 };
eq([K.stepScore(0.5, z), K.stepScore(0.56, z), K.stepScore(0.5625, z), K.stepScore(0.6, z), K.stepScore(0.625, z), K.stepScore(0.63, z), K.stepScore(0.1, z), K.stepScore(null, z)], [2, 2, 2, 1, 1, 0, 0, 0], 'step scores');
// thresholds: 3 if >= 80% of max, 2 if >= 40%, else 1
eq([K.cookStars([2], 1), K.cookStars([1], 1), K.cookStars([0], 1)], [3, 2, 1], '1 step: 2/2, 1/2, 0/2');
eq([K.cookStars([2, 2], 2), K.cookStars([2, 1], 2), K.cookStars([1, 1], 2), K.cookStars([2, 0], 2), K.cookStars([1, 0], 2), K.cookStars([0, 0], 2)], [3, 2, 2, 2, 1, 1], '2 steps: 4,3,2,2,1,0 of 4');
eq([K.cookStars([2, 2, 1], 3), K.cookStars([2, 1, 1], 3), K.cookStars([1, 1, 1], 3), K.cookStars([1, 1, 0], 3), K.cookStars([1, 0, 0], 3)], [3, 2, 2, 1, 1], '3 steps: 5,4,3,2,1 of 6');
eq(K.cookStars([], 2), 1, 'no taps -> 1 star, never a fail');
// simulated mini-game with the fixed rng: zone placement stays on the arc, scoring is deterministic
const sim = (steps, perfect) => { const w = K.zoneWidth(steps), sc = []; for (let i = 0; i < steps; i++) { const zz = { c: w / 2 + 0.18 + R() * (1 - w - 0.2), w }; ok(zz.c - w / 2 >= 0 && zz.c + w / 2 <= 1, 'zone inside arc'); sc.push(K.stepScore(perfect ? zz.c : R(), zz)); } return K.cookStars(sc, steps); };
for (let i = 0; i < 20; i++) { eq(sim(1 + (i % 3), true), 3, 'perfect taps give 3 stars'); const s = sim(1 + (i % 3), false); ok(s >= 1 && s <= 3, 'random taps 1..3'); }

// ---- effects x star multiplier
eq(K.effectFor('chicken-veggie-rice', 2), { hunger: 75, happy: 18, energy: 0, bond: 12, buff: null }, 'x1.25 floored');
eq(K.effectFor('pumpkin-pupcake', 3).bond, 37, '3-star pupcake bond stays at the 37 cap');
eq(K.effectFor('blueberry-pupsicle', 3).buff, { id: 'cool', hours: 24 }, 'buff not scaled');
eq(K.effectText(K.effectFor('carrot-crunchies', 1)), '+20 Hunger, +10 Happiness. Next walk +15 s.', 'effect text');

// ---- highest stars first
let t = K.takeIngredients(['carrot', 'carrot', 'carrot', 'oats'], { oats: 1 }, { carrot: [1, 1, 1] });
eq(t.used, [{ id: 'carrot', stars: 3 }, { id: 'carrot', stars: 2 }, { id: 'carrot', stars: 1 }, { id: 'oats', stars: null }], 'highest stars first');
t = K.takeIngredients(['blueberries', 'water', 'water'], {}, { blueberries: [0, 2, 0] });
eq([t.used.length, t.missing], [3, []], 'water is unlimited');
t = K.takeIngredients(['egg', 'spinach'], { egg: 0 }, { spinach: [0, 0, 0] });
eq(t.missing, ['egg', 'spinach'], 'missing reported');

// ---- dog safety: every PEOPLE_FOOD item rejected (by id and by name), every safe item accepted
K.PEOPLE_FOOD.forEach(p => {
  ok(K.safety(p.id) === p, 'safety id ' + p.id);
  ok(K.safety(p.name) === p, 'safety name ' + p.name);
  ok(!K.canCook(p.id) && !K.canCook(p.name), 'cannot cook ' + p.id);
  const ex = K.experiment(['carrot', p.id], START);
  ok(!ex.ok && ex.reason === 'unsafe' && ex.rejected[0] === p.id, 'experiment rejects ' + p.id);
  ok(K.takeIngredients([p.id], { [p.id]: 5 }, {}).used.length === 0, 'never taken from inventory ' + p.id);
});
['leek', 'chives', 'shallot', 'xylitol', 'caffeine', 'tea', 'alcohol', 'beer', 'wine', 'raw dough', 'yeast dough', 'cocoa', 'raisin', 'grape', 'Macadamia Nuts', 'Sugar-free Gum'].forEach(n => {
  const s = K.safety(n); ok(s && s.why && s.swap, 'extra toxic ' + n); ok(!K.canCook(n), 'extra cannot cook ' + n);
});
const SAFE = ['oats', 'rice', 'egg', 'chicken', 'water', 'carrot', 'peas', 'spinach', 'blueberries', 'sweet-potato', 'pumpkin'];
SAFE.forEach(id => { ok(K.safety(id) === null, 'safe ' + id); ok(K.canCook(id), 'can cook ' + id); });
ok(K.canCook('Sweet Potato') && K.canCook('Fresh Water'), 'names accepted too');
// no recipe ever contains a toxic food
K.RECIPES.forEach(r => r.ingredients.forEach(i => ok(K.canCook(i), 'recipe ingredient safe ' + r.id + ':' + i)));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
