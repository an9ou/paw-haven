/* Paw Haven v1.3: kitchen module -> window.PawKitchen
   Contract: V13.md, "mods/kitchen.js".
   PawKitchen.RECIPES, PANTRY, PEOPLE_FOOD, FAV
   PawKitchen.match(ids) -> recipeId|null
   PawKitchen.hint(ids, known) -> string|null
   PawKitchen.dishStars(cookStars, cropStars[]) -> 1..3
   PawKitchen.open(el, o) -> controller { close(), update(partial) }
   Extra pure helpers (additive): safety, canCook, experiment, zoneWidth, stepScore,
   cookStars, effectFor, effectText, takeIngredients, NOTES, CROP_NAMES.
   Plain IIFE. Never touches browser storage or game state: everything goes through the callbacks. */
(function () {
  'use strict';

  var W = 1240, H = 620;
  var INK = '#5B3D32', PAPER = '#FFFBF3', MUTED = '#8A7468', PINK = '#F28FA5', GOLD = '#FFD56B';

  /* =========================== shared data (V13.md, exact) =========================== */
  var CROP_NAMES = { carrot: 'Carrot', peas: 'Peas', spinach: 'Spinach', blueberries: 'Blueberries', 'sweet-potato': 'Sweet Potato', pumpkin: 'Pumpkin' };
  var CROP_IDS = ['carrot', 'peas', 'spinach', 'blueberries', 'sweet-potato', 'pumpkin'];

  var PANTRY = [
    { id: 'oats', name: 'Oats', price: 2 },
    { id: 'rice', name: 'Rice', price: 3 },
    { id: 'egg', name: 'Egg', price: 3 },
    { id: 'chicken', name: 'Chicken', price: 8, note: 'boneless' },
    { id: 'water', name: 'Fresh Water', price: 0, free: true, unlimited: true }
  ];

  var RECIPES = [
    { id: 'carrot-crunchies', name: 'Carrot Crunchies', ingredients: ['carrot', 'oats'], steps: ['chop', 'bake'],
      effect: { hunger: 20, happy: 10, energy: 0, bond: 0, buff: { id: 'walk15', walks: 1 } }, unlock: 'start',
      hint: 'Crunchy carrots and oats, baked golden.' },
    { id: 'chicken-veggie-rice', name: 'Chicken & Veggie Rice', ingredients: ['chicken', 'rice', 'carrot', 'peas'], steps: ['chop', 'stir'],
      effect: { hunger: 60, happy: 15, energy: 0, bond: 10, buff: null }, unlock: 'start',
      hint: 'A bowl of comfort: chicken, rice and two veggies.' },
    { id: 'blueberry-pupsicle', name: 'Blueberry Pupsicle', ingredients: ['blueberries', 'water'], steps: ['chill'],
      effect: { hunger: 0, happy: 0, energy: 10, bond: 0, buff: { id: 'cool', hours: 24 } }, unlock: 'start',
      hint: 'Summer berries plus something that freezes.' },
    { id: 'pumpkin-pupcake', name: 'Pumpkin Pupcake', ingredients: ['pumpkin', 'oats', 'egg'], steps: ['stir', 'bake'],
      effect: { hunger: 20, happy: 30, energy: 0, bond: 25, buff: null }, unlock: 'experiment',
      hint: 'Something orange, something oaty and something that cracks.' },
    { id: 'golden-harvest-stew', name: 'Golden Harvest Stew', ingredients: ['sweet-potato', 'pumpkin', 'chicken', 'rice'], steps: ['chop', 'stir', 'simmer'],
      effect: { hunger: 50, happy: 0, energy: 0, bond: 0, buff: { id: 'warm', hours: 24 } }, unlock: 'experiment',
      hint: 'Two orange harvests, chicken and rice, simmered slowly.' },
    { id: 'spinach-scramble', name: 'Spinach Scramble', ingredients: ['egg', 'spinach'], steps: ['stir'],
      effect: { hunger: 25, happy: 0, energy: 0, bond: 0, buff: { id: 'dig1', walks: 1 } }, unlock: 'experiment',
      hint: 'Something leafy meets something that cracks.' },
    { id: 'mystery-mush', name: 'Mystery Mush', ingredients: [], steps: [],
      effect: { hunger: 15, happy: 0, energy: 0, bond: 0, buff: null }, unlock: 'result',
      hint: 'Any mix that is not a recipe. Never in the book.' }
  ];

  var PEOPLE_FOOD = [
    { id: 'onion', name: 'Onion', where: ['rack', 'junk'], why: 'Onions (and garlic, leeks and chives) damage a dog\'s red blood cells, cooked or raw.', swap: 'Carrots are a crunchy swap.' },
    { id: 'garlic', name: 'Garlic', where: ['rack'], why: 'Garlic is in the onion family and can cause anaemia in dogs, even as powder.', swap: 'Try peas instead.' },
    { id: 'grapes', name: 'Grapes', where: ['rack', 'junk'], why: 'Grapes and raisins can cause sudden kidney failure in dogs, and there is no known safe amount.', swap: 'Blueberries are a great swap.' },
    { id: 'chocolate', name: 'Chocolate', where: ['pantry'], why: 'Chocolate has theobromine and caffeine, which can make a dog\'s heart race. Dark chocolate is worst.', swap: 'Carrot Crunchies are a safe treat.' },
    { id: 'raisins', name: 'Raisins', where: ['pantry'], why: 'Raisins are dried grapes and can cause kidney failure in dogs.', swap: 'Blueberries instead.' },
    { id: 'coffee', name: 'Coffee', where: ['pantry'], why: 'Caffeine makes a dog\'s heart race and can cause tremors.', swap: 'Fresh water.' },
    { id: 'gum', name: 'Sugar-free Gum', where: ['pantry'], why: 'It often contains xylitol, which drops a dog\'s blood sugar fast and can harm the liver.', swap: 'A Pumpkin Pupcake instead.' },
    { id: 'macadamia', name: 'Macadamia Nuts', where: ['pantry'], why: 'Macadamia nuts cause weakness, wobbly legs, vomiting and fever in dogs.', swap: 'Oats are fine.' },
    { id: 'avocado', name: 'Avocado', where: ['pantry'], why: 'Avocado contains persin, which can upset a dog\'s stomach, and the pit can block the gut.', swap: 'Spinach Scramble instead.' }
  ];

  /* Other toxic foods (not shown in v1.3 UI, but the safety check knows them, so nothing toxic can ever enter a dish). */
  var EXTRA_UNSAFE = [
    { id: 'leek', name: 'Leek', alias: ['leeks', 'chives', 'chive', 'shallot', 'shallots', 'spring-onion', 'onions', 'onion-powder', 'garlic-powder'], why: 'Leeks, chives and shallots are in the onion family and damage a dog\'s red blood cells.', swap: 'Carrots are a crunchy swap.' },
    { id: 'xylitol', name: 'Xylitol', alias: ['birch-sugar', 'sugar-free-candy', 'sugar-free-gum'], why: 'Xylitol drops a dog\'s blood sugar fast and can harm the liver.', swap: 'A Pumpkin Pupcake instead.' },
    { id: 'caffeine', name: 'Caffeine', alias: ['tea', 'energy-drink', 'cola', 'espresso', 'coffee-beans'], why: 'Caffeine makes a dog\'s heart race and can cause tremors.', swap: 'Fresh water.' },
    { id: 'alcohol', name: 'Alcohol', alias: ['beer', 'wine', 'cider', 'liquor'], why: 'Alcohol is poisonous to dogs, even a few sips, and can cause wobbling and vomiting.', swap: 'Fresh water is the only drink a pup needs.' },
    { id: 'raw-dough', name: 'Raw Dough', alias: ['dough', 'yeast-dough', 'bread-dough', 'raw-bread-dough', 'yeast'], why: 'Raw yeast dough keeps rising in a dog\'s warm tummy and makes alcohol as it ferments.', swap: 'Carrot Crunchies are a safe treat.' }
  ];
  var PF_ALIAS = { onions: 'onion', grape: 'grapes', raisin: 'raisins', cocoa: 'chocolate', 'dark-chocolate': 'chocolate', 'milk-chocolate': 'chocolate', 'chocolate-bar': 'chocolate',
    'sugar-free-gum': 'gum', 'chewing-gum': 'gum', macadamias: 'macadamia', 'macadamia-nut': 'macadamia', 'macadamia-nuts': 'macadamia', avocados: 'avocado', guacamole: 'avocado',
    garlics: 'garlic', 'garlic-clove': 'garlic' };

  var FAV = { shiba: 'golden-harvest-stew', corgi: 'chicken-veggie-rice', golden: 'carrot-crunchies', dachs: 'spinach-scramble', husky: 'blueberry-pupsicle', mutt: 'golden-harvest-stew', chihuahua: 'chicken-veggie-rice', pug: 'pumpkin-pupcake', greyhound: 'carrot-crunchies', beagle: 'golden-harvest-stew' };

  var NOTES = {
    pumpkin: 'Always cooked and plain.',
    'sweet-potato': 'Always cooked and plain.',
    spinach: 'Small amounts only, so recipes use one.',
    chicken: 'Boneless, because cooked bones splinter.',
    kitchen: 'No salt shaker here: dogs need far less salt than people.'
  };

  var BUFF_TEXT = {
    walk15: 'Next walk +15 s',
    cool: 'Cool for 24 h: no hot slump, walks use less energy',
    warm: 'Warm for 24 h: cozy, and Happiness drops at half speed',
    dig1: 'Next walk: one extra dig'
  };
  var STEP_NAME = { chop: 'Chop', stir: 'Stir', bake: 'Bake', simmer: 'Simmer', chill: 'Chill' };
  var STEP_SFX = { chop: 'chop', stir: 'stir', bake: 'sizzle', simmer: 'stir', chill: 'pop' };
  var STAR_MULT = [0, 1, 1.25, 1.5];

  /* =========================== pure functions =========================== */
  function norm(id) { var k = String(id == null ? '' : id).trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/&/g, 'and'); return k === 'fresh-water' ? 'water' : k; }
  function pantryById(id) { for (var i = 0; i < PANTRY.length; i++) if (PANTRY[i].id === id) return PANTRY[i]; return null; }
  function recipeById(id) { for (var i = 0; i < RECIPES.length; i++) if (RECIPES[i].id === id) return RECIPES[i]; return null; }
  function isCrop(id) { return CROP_IDS.indexOf(id) >= 0; }
  function ingName(id) { var p = pantryById(id); return p ? p.name : CROP_NAMES[id] || String(id); }
  function bag(ids) { var m = {}; for (var i = 0; i < ids.length; i++) { var k = norm(ids[i]); m[k] = (m[k] || 0) + 1; } return m; }
  function overlap(a, b) { var A = bag(a), B = bag(b), n = 0; for (var k in A) if (B[k]) n += Math.min(A[k], B[k]); return n; }

  /* order-free exact multiset match (never mystery-mush) */
  function match(ids) {
    if (!Array.isArray(ids) || !ids.length) return null;
    for (var i = 0; i < RECIPES.length; i++) {
      var r = RECIPES[i];
      if (r.id === 'mystery-mush' || r.ingredients.length !== ids.length) continue;
      if (overlap(ids, r.ingredients) === ids.length) return r.id;
    }
    return null;
  }

  /* "Close!" when an UNKNOWN recipe shares >= 2 ingredients */
  function hint(ids, known) {
    if (!Array.isArray(ids)) return null;
    known = Array.isArray(known) ? known : [];
    for (var i = 0; i < RECIPES.length; i++) {
      var r = RECIPES[i];
      if (r.id === 'mystery-mush' || known.indexOf(r.id) >= 0) continue;
      if (overlap(ids, r.ingredients) >= 2) return 'Close! Two of those belong together.';
    }
    return null;
  }

  function clampStar(n) { n = Math.round(Number(n) || 1); return n < 1 ? 1 : n > 3 ? 3 : n; }
  /* ceil((cookStars + average(cropStars)) / 2); pantry items carry no stars */
  function dishStars(cookStars, cropStars) {
    var c = clampStar(cookStars);
    var cs = (Array.isArray(cropStars) ? cropStars : []).filter(function (s) { return s != null && !isNaN(s); }).map(clampStar);
    if (!cs.length) return c;
    var avg = cs.reduce(function (a, b) { return a + b; }, 0) / cs.length;
    return clampStar(Math.ceil((c + avg) / 2 - 1e-9));
  }

  /* toxic-food note for an id or a name, or null when it is not a known toxic food */
  function safety(id) {
    var k = norm(id); if (!k) return null;
    if (PF_ALIAS[k]) k = PF_ALIAS[k];
    var i;
    for (i = 0; i < PEOPLE_FOOD.length; i++) if (PEOPLE_FOOD[i].id === k || norm(PEOPLE_FOOD[i].name) === k) return PEOPLE_FOOD[i];
    for (i = 0; i < EXTRA_UNSAFE.length; i++) { var e = EXTRA_UNSAFE[i]; if (e.id === k || norm(e.name) === k || e.alias.indexOf(k) >= 0) return e; }
    return null;
  }
  /* only the kitchen's own safe ingredients may enter the pot */
  function canCook(id) { var k = norm(id); return !safety(k) && (isCrop(k) || !!pantryById(k)); }

  /* experiment: what happens when these go in the pot (pure) */
  function experiment(ids, known) {
    ids = Array.isArray(ids) ? ids.map(norm) : [];
    known = Array.isArray(known) ? known : [];
    var rejected = ids.filter(function (k) { return !!safety(k); });
    if (rejected.length) return { ok: false, reason: 'unsafe', rejected: rejected, notes: rejected.map(safety), recipe: null, discovered: false, hint: null };
    var unknown = ids.filter(function (k) { return !canCook(k); });
    if (unknown.length) return { ok: false, reason: 'unknown', rejected: unknown, recipe: null, discovered: false, hint: null };
    if (ids.length < 2) return { ok: false, reason: 'few', rejected: [], recipe: null, discovered: false, hint: null };
    if (ids.length > 4) return { ok: false, reason: 'many', rejected: [], recipe: null, discovered: false, hint: null };
    var m = match(ids);
    if (m) return { ok: true, reason: null, rejected: [], recipe: m, discovered: known.indexOf(m) < 0, hint: null, steps: recipeById(m).steps.slice() };
    return { ok: true, reason: null, rejected: [], recipe: 'mystery-mush', discovered: false, hint: hint(ids, known), steps: [] };
  }

  /* mini-game maths */
  function zoneWidth(nSteps) { return nSteps >= 3 ? 0.15 : 0.25; }
  /* t: needle position 0..1 along the arc (null = no tap); zone {c, w} in the same units */
  function stepScore(t, zone) {
    if (t == null || isNaN(t) || !zone) return 0;
    var d = Math.abs(t - zone.c);
    if (d <= zone.w / 4 + 1e-9) return 2;
    if (d <= zone.w / 2 + 1e-9) return 1;
    return 0;
  }
  function cookStars(scores, nSteps) {
    scores = Array.isArray(scores) ? scores : [];
    var n = nSteps || scores.length || 1, max = 2 * n, tot = 0;
    for (var i = 0; i < scores.length; i++) tot += Math.max(0, Math.min(2, scores[i] | 0));
    if (tot >= 0.8 * max - 1e-9) return 3;
    if (tot >= 0.4 * max - 1e-9) return 2;
    return 1;
  }

  /* effect x star multiplier (stats only; floor keeps a 3-star Pupcake at +37 Bond, the daily cap) */
  function effectFor(recipeId, stars) {
    var r = recipeById(recipeId); if (!r) return null;
    var m = STAR_MULT[clampStar(stars)], e = r.effect, out = {};
    ['hunger', 'happy', 'energy', 'bond'].forEach(function (k) { out[k] = Math.floor((e[k] || 0) * m + 1e-9); });
    out.buff = e.buff ? JSON.parse(JSON.stringify(e.buff)) : null;
    return out;
  }
  function effectText(eff) {
    if (!eff) return '';
    var parts = [], L = { hunger: 'Hunger', happy: 'Happiness', energy: 'Energy', bond: 'Bond' };
    ['hunger', 'happy', 'energy', 'bond'].forEach(function (k) { if (eff[k]) parts.push('+' + eff[k] + ' ' + L[k]); });
    var s = parts.join(', ');
    if (eff.buff && BUFF_TEXT[eff.buff.id]) s += (s ? '. ' : '') + BUFF_TEXT[eff.buff.id];
    return s + '.';
  }

  function cropArr(crops, id) {
    var v = crops && crops[id];
    if (typeof v === 'number') return [Math.max(0, v | 0), 0, 0];
    if (!Array.isArray(v)) return [0, 0, 0];
    return [Math.max(0, v[0] | 0), Math.max(0, v[1] | 0), Math.max(0, v[2] | 0)];
  }
  /* pick ingredients from an inventory, crops highest stars first; already = items already taken */
  function takeIngredients(ids, pantry, crops, already) {
    var used = [], missing = [], taken = (already || []).slice();
    (ids || []).forEach(function (raw) {
      var id = norm(raw), got = null;
      if (!canCook(id)) { missing.push(id); return; }
      if (id === 'water') got = { id: 'water', stars: null };
      else if (isCrop(id)) {
        var a = cropArr(crops, id);
        for (var s = 3; s >= 1; s--) {
          var inUse = taken.filter(function (u) { return u.id === id && u.stars === s; }).length;
          if (a[s - 1] - inUse > 0) { got = { id: id, stars: s }; break; }
        }
      } else {
        var have = Math.max(0, (pantry && pantry[id]) | 0), inU = taken.filter(function (u) { return u.id === id; }).length;
        if (have - inU > 0) got = { id: id, stars: null };
      }
      if (got) { used.push(got); taken.push(got); } else missing.push(id);
    });
    return { used: used, missing: missing };
  }

  /* =========================== little helpers =========================== */
  function noop() {}
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function seeded(seed) { var a = seed >>> 0 || 1; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hashS(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function wob(R, pts, amp, closed) {
    var d = 'M' + f1(pts[0][0] + (R() - 0.5) * amp) + ' ' + f1(pts[0][1] + (R() - 0.5) * amp);
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i - 1], q = pts[i];
      d += ' Q' + f1((p[0] + q[0]) / 2 + (R() - 0.5) * amp * 1.5) + ' ' + f1((p[1] + q[1]) / 2 + (R() - 0.5) * amp * 1.5) + ' ' + f1(q[0] + (R() - 0.5) * amp) + ' ' + f1(q[1] + (R() - 0.5) * amp);
    }
    if (closed) { var z = pts[0]; d += ' Q' + f1(z[0] + (R() - 0.5) * amp) + ' ' + f1(z[1] + (R() - 0.5) * amp) + ' ' + f1(z[0]) + ' ' + f1(z[1]); }
    return d;
  }
  function pencil(R, pts, w, fill, closed, col) {
    var a = wob(R, pts, 2, closed), b = wob(R, pts, 2.4, closed);
    return (fill ? '<path d="' + a + '" fill="' + fill + '" stroke="none"/>' : '') +
      '<path d="' + a + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + b + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + f1(w * 0.5) + '" stroke-linecap="round" opacity=".5"/>';
  }
  function ell(cx, cy, rx, ry, n) { var p = []; n = n || 18; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
  function rectP(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function svgWrap(vb, inner, extra) { return '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg"' + (extra || '') + '>' + inner + '</svg>'; }

  /* ---------- art with tolerant fallbacks ---------- */
  function listed(kind, name) {
    var WB = window.PawArt && window.PawArt.WORLD_B; if (!WB) return null;
    var lst = kind === 'icon' ? WB.icons : kind === 'item' ? WB.items : kind === 'prop' ? WB.props : null;
    return Array.isArray(lst) ? lst.indexOf(name) >= 0 : null;
  }
  function art(kind, name, opt) {
    try {
      var P = window.PawArt; if (!P || typeof P[kind] !== 'function') return null;
      var l = listed(kind, name); if (l === false) return null;
      var s = P[kind](name, opt);
      if (typeof s !== 'string' || s.indexOf('<svg') < 0) return null;
      if (l == null && /aria-label="(prop|item|icon) /.test(s) && />\s*\?\s*<\/text>/.test(s)) return null;
      return s;
    } catch (e) { return null; }
  }
  var DOODLE_COL = { carrot: '#F59E52', peas: '#9CD48A', spinach: '#5FA05A', blueberries: '#7F8FD6', 'sweet-potato': '#C97E68', pumpkin: '#F9A35E',
    oats: '#E9D3A0', rice: '#F4F1E8', egg: '#FFF4DC', chicken: '#F2B49A', water: '#9CC9F0' };
  function doodleIng(id, grey) {
    var R = seeded(hashS('ing' + id)), c = grey ? '#D8D2CC' : DOODLE_COL[id] || '#E8D8C4';
    return svgWrap('0 0 64 64', pencil(R, ell(32, 34, 20, 18), 2.2, c, true) +
      '<text x="32" y="42" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="24" fill="' + INK + '">' + esc(ingName(id).charAt(0)) + '</text>');
  }
  function ingArt(id) { return art('item', ingName(id)) || doodleIng(id); }
  function peopleArt(pf) { return art('item', pf.name) || doodleIng(pf.id, true); }
  function pawStopArt() {
    return art('icon', 'paw-stop') || svgWrap('0 0 64 64', (function () {
      var R = seeded(7), p = []; for (var i = 0; i < 8; i++) { var a = (i + 0.5) / 8 * Math.PI * 2; p.push([32 + Math.cos(a) * 27, 32 + Math.sin(a) * 27]); }
      return pencil(R, p, 2.4, '#E46A6A', true) + '<g fill="#fff"><ellipse cx="32" cy="38" rx="9" ry="7"/><circle cx="22" cy="27" r="4"/><circle cx="29" cy="22" r="4"/><circle cx="36" cy="22" r="4"/><circle cx="42" cy="27" r="4"/></g>';
    })());
  }
  function doodleProp(name) {
    var R = seeded(hashS('prop' + name));
    if (name === 'pot') return svgWrap('0 0 120 120', pencil(R, [[18, 50], [102, 50], [96, 100], [24, 100]], 2.6, '#F4A6A0', true) + pencil(R, ell(60, 50, 44, 8), 2.2, '#F9D0D9', true) + pencil(R, [[48, 36], [44, 26], [50, 16]], 1.6) + pencil(R, [[70, 36], [74, 26], [68, 16]], 1.6));
    if (name === 'board') return svgWrap('0 0 200 120', pencil(R, rectP(20, 50, 160, 50), 2.6, '#E1B987', true) + pencil(R, [[60, 70], [100, 64], [104, 74], [62, 78]], 2, '#F59E52', true) + pencil(R, [[120, 84], [170, 70]], 3, null, false));
    if (name === 'oven') return svgWrap('0 0 160 160', pencil(R, rectP(16, 16, 128, 130), 2.6, '#FFF2DA', true) + pencil(R, rectP(34, 60, 92, 66), 2.2, '#FFC96B', true) + pencil(R, [[40, 40], [120, 40]], 3));
    if (name === 'dial') {
      var s = pencil(R, ell(80, 80, 72, 72, 30), 2.4, '#FFFBF3', true), t = '';
      for (var d = 210; d >= -30; d -= 30) { var a = d * Math.PI / 180; t += '<line x1="' + f1(80 + Math.cos(a) * 52) + '" y1="' + f1(80 - Math.sin(a) * 52) + '" x2="' + f1(80 + Math.cos(a) * 63) + '" y2="' + f1(80 - Math.sin(a) * 63) + '" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>'; }
      return svgWrap('0 0 160 160', s + t);
    }
    if (name === 'recipe-card') return svgWrap('0 0 200 260', pencil(R, rectP(8, 12, 184, 240), 2.2, PAPER, true), ' preserveAspectRatio="none"');
    return svgWrap('0 0 120 120', pencil(R, ell(60, 64, 44, 40), 2.4, '#F9D0D9', true));
  }
  function frostDoodle() {
    var R = seeded(99), s = pencil(R, rectP(40, 52, 80, 70), 2.4, '#DDEFFC', true) + pencil(R, [[52, 64], [70, 60]], 2, null, false, '#fff');
    for (var i = 0; i < 3; i++) {
      var cx = [30, 132, 120][i], cy = [36, 40, 136][i], r = [12, 9, 8][i], g = '';
      for (var k = 0; k < 3; k++) { var a = k * Math.PI / 3; g += '<line x1="' + f1(cx - Math.cos(a) * r) + '" y1="' + f1(cy - Math.sin(a) * r) + '" x2="' + f1(cx + Math.cos(a) * r) + '" y2="' + f1(cy + Math.sin(a) * r) + '" stroke="#7FA8D6" stroke-width="2.4" stroke-linecap="round"/>'; }
      s += g;
    }
    s += '<circle cx="66" cy="88" r="7" fill="#7F8FD6" stroke="' + INK + '" stroke-width="1.6"/><circle cx="86" cy="96" r="7" fill="#7F8FD6" stroke="' + INK + '" stroke-width="1.6"/><circle cx="78" cy="78" r="6" fill="#8F9FE6" stroke="' + INK + '" stroke-width="1.6"/>';
    return svgWrap('0 0 160 160', s);
  }
  function propArt(name, opt) { return art('prop', name, opt) || doodleProp(name); }
  function stepArt(step) {
    if (step === 'chop') return propArt('board');
    if (step === 'bake') return propArt('oven');
    if (step === 'chill') return frostDoodle();
    return propArt('pot');
  }
  function starSvg(on, size) {
    var R = seeded(on ? 3 : 4), p = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 21; p.push([24 + Math.cos(a) * r, 25 + Math.sin(a) * r]); }
    return '<svg class="pk-star" viewBox="0 0 48 48" width="' + size + '" height="' + size + '">' + pencil(R, p, 2.2, on ? GOLD : '#F1E9DE', true, on ? INK : '#B9A99C') + '</svg>';
  }
  function starsHtml(n, size, max) { var s = ''; for (var i = 1; i <= (max || 3); i++) s += starSvg(i <= n, size || 22); return '<span class="pk-stars">' + s + '</span>'; }

  /* ---------- dog art ---------- */
  var _kCoat, _kSeed;
  function dogSvg(key, pose, outfit) {
    try {
      if (window.PawArt && typeof window.PawArt.dog === 'function') {
        var s = window.PawArt.dog(key, { pose: pose, outfit: outfit || {}, anim: true, coat: _kCoat, seed: _kSeed });
        if (typeof s === 'string' && s.indexOf('<svg') >= 0) return s;
      }
    } catch (e) { /* fall through */ }
    var R = seeded(hashS('dog' + key + pose));
    return svgWrap('0 0 240 200', '<ellipse cx="120" cy="188" rx="60" ry="6" fill="#5B3D32" opacity=".12"/>' + pencil(R, ell(116, 140, 46, 42), 3, '#F2B36B', true) + pencil(R, ell(124, 78, 34, 30), 3, '#F2B36B', true) +
      '<circle cx="114" cy="74" r="7" fill="#fff" stroke="#2a2420" stroke-width="2"/><circle cx="136" cy="72" r="5" fill="#fff" stroke="#2a2420" stroke-width="2"/><circle cx="115" cy="75" r="3" fill="#2a2420"/><circle cx="136" cy="73" r="2.4" fill="#2a2420"/>' +
      pencil(R, [[98, 56], [92, 34], [110, 50]], 2.6, '#E39A52', true) + pencil(R, [[140, 52], [152, 32], [154, 58]], 2.6, '#E39A52', true));
  }
  function hasPose(key, pose) {
    try { var s = window.PawArt && window.PawArt.dog ? window.PawArt.dog(key, { pose: pose, anim: false }) : ''; return s.indexOf('pa-pose-' + pose) >= 0; } catch (e) { return false; }
  }
  function sceneSvg(time, weather) {
    try {
      if (window.PawArt && typeof window.PawArt.scene === 'function') {
        var s = window.PawArt.scene('kitchen', { time: time, weather: weather });
        if (typeof s === 'string' && s.indexOf('<svg') >= 0 && /kitchen/i.test(s.slice(0, 600))) return s;
      }
    } catch (e) { /* fall through */ }
    var R = seeded(5);
    return svgWrap('0 0 1000 600', '<rect width="1000" height="600" fill="#FDF0DC"/><rect y="430" width="1000" height="170" fill="#F6E3CF"/>' +
      pencil(R, [[0, 430], [1000, 430]], 2) + pencil(R, rectP(430, 280, 160, 140), 2.4, '#FFF3DC', true) + pencil(R, rectP(30, 100, 160, 330), 2, '#F3E2C8', true) +
      [170, 260, 350].map(function (y) { return pencil(R, [[30, y], [190, y]], 3); }).join('') + pencil(R, rectP(640, 80, 180, 160), 2.4, '#CFE3F5', true) + pencil(R, rectP(870, 96, 120, 334), 2.4, '#EAF4F2', true),
      ' preserveAspectRatio="xMidYMid slice"');
  }

  /* =========================== CSS =========================== */
  var CSS = [
    '.pk-root{position:absolute;inset:0;overflow:hidden;background:radial-gradient(#E3D2BA 1.1px,transparent 1.6px) 0 0/22px 22px,#FFFBF3;font-family:"Patrick Hand","Trebuchet MS",sans-serif;color:#5B3D32;user-select:none;-webkit-user-select:none;outline:none}',
    '.pk-stage{position:absolute;left:0;top:0;width:1240px;height:620px;transform-origin:0 0;overflow:hidden;border-radius:6px}',
    '.pk-scene{position:absolute;inset:0}.pk-scene>svg{width:100%;height:100%;display:block}',
    '.pk-abs{position:absolute}.pk-abs>svg,.pk-fill>svg{width:100%;height:100%;display:block;overflow:visible}',
    '.pk-paper{background:#FFFBF3;border:2.5px solid #5B3D32;border-radius:16px 11px 18px 10px/11px 17px 10px 15px;box-shadow:3px 4px 0 rgba(91,61,50,.16)}',
    '.pk-tape::before{content:"";position:absolute;left:40px;top:-11px;width:86px;height:20px;background:repeating-linear-gradient(45deg,rgba(242,143,165,.55) 0 6px,rgba(249,208,217,.75) 6px 12px);transform:rotate(-4deg);pointer-events:none}',
    '.pk-tape.pk-tb::before{background:repeating-linear-gradient(45deg,rgba(134,179,234,.5) 0 6px,rgba(195,218,246,.75) 6px 12px);left:auto;right:50px;transform:rotate(3deg)}',
    '.pk-top{position:absolute;left:14px;right:14px;top:10px;height:56px;display:flex;align-items:center;gap:12px;padding:0 10px;z-index:4}',
    '.pk-top .pk-ico{width:46px;height:46px;flex:none;transform:rotate(-6deg)}.pk-ico svg{width:100%;height:100%;display:block}',
    '.pk-title{font-family:"Caveat",cursive;font-weight:700;font-size:34px;line-height:1;white-space:nowrap}',
    '.pk-sub{flex:1;min-width:0;font-size:18px;color:#8A7468;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pk-chip{display:flex;align-items:center;gap:6px;font-family:"Caveat",cursive;font-weight:700;font-size:24px;padding:0 12px 2px 6px;height:40px;background:#DDEFFC;border:2px solid #5B3D32;border-radius:12px 9px 13px 8px;white-space:nowrap}',
    '.pk-chip.pk-full{background:#F9D0D9}.pk-chip svg{width:30px;height:30px}',
    '.pk-btn{font-family:"Caveat",cursive;font-weight:700;font-size:25px;color:#5B3D32;background:#FFFBF3;border:2.5px solid #5B3D32;border-radius:14px 9px 15px 8px/9px 14px 8px 13px;padding:0 16px 3px;cursor:pointer;box-shadow:2px 3px 0 rgba(91,61,50,.22);line-height:1.2;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}',
    '.pk-btn svg{width:28px;height:28px}',
    '.pk-btn:hover:not(:disabled){transform:translateY(-1px) rotate(-1.2deg)}.pk-btn:active:not(:disabled){transform:translateY(1px);box-shadow:1px 1px 0 rgba(91,61,50,.22)}',
    '.pk-btn:focus-visible,.pk-tile:focus-visible{outline:2.5px dashed #F28FA5;outline-offset:3px}',
    '.pk-btn.pk-go{background:#C8E9CF}.pk-btn.pk-gold{background:#FFE3A1}.pk-btn.pk-pinkb{background:#F9D0D9}',
    '.pk-btn:disabled{opacity:.5;cursor:default;filter:grayscale(.6)}',
    '.pk-x{width:46px;height:46px;border-radius:50%;padding:0;justify-content:center;background:#F9D0D9;font-size:26px}',
    '.pk-shelf{position:absolute;left:14px;top:76px;width:292px;height:530px;padding:12px 12px 8px;box-sizing:border-box;z-index:3;background:rgba(255,251,243,.94)}',
    '.pk-sh{font-family:"Caveat",cursive;font-weight:700;font-size:23px;line-height:1;margin:2px 2px 6px;display:flex;align-items:center;gap:6px}',
    '.pk-sh small{font-family:"Patrick Hand",sans-serif;font-weight:400;font-size:14px;color:#8A7468}',
    '.pk-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;padding-bottom:8px;border-bottom:2px dashed rgba(91,61,50,.28)}',
    '.pk-row.pk-last{border-bottom:none;margin-bottom:0}',
    '.pk-tile{position:relative;width:60px;height:68px;padding:0;background:#FFFBF3;border:2px solid #5B3D32;border-radius:10px 7px 11px 6px/7px 11px 6px 10px;cursor:grab;font-family:"Patrick Hand",sans-serif;color:#5B3D32;touch-action:none}',
    '.pk-tile:hover{transform:translateY(-2px) rotate(-2deg)}',
    '.pk-tile .pk-art{position:absolute;left:8px;top:2px;width:44px;height:44px;pointer-events:none}.pk-art svg{width:100%;height:100%;display:block}',
    '.pk-tile .pk-nm{position:absolute;left:0;right:0;bottom:2px;font-size:13px;line-height:1;text-align:center;white-space:nowrap;overflow:hidden;pointer-events:none}',
    '.pk-tile .pk-ct{position:absolute;right:-7px;top:-7px;min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;background:#FFE3A1;border:2px solid #5B3D32;font-family:"Caveat",cursive;font-weight:700;font-size:17px;line-height:17px;text-align:center;pointer-events:none}',
    '.pk-tile .pk-st{position:absolute;left:-5px;top:-8px;display:flex;pointer-events:none}',
    '.pk-tile.pk-out{opacity:.45;filter:grayscale(.85);cursor:default}.pk-tile.pk-out:hover{transform:none}',
    '.pk-tile.pk-people{width:48px;height:48px;background:#EFEAE4;cursor:pointer}',
    '.pk-tile.pk-people .pk-art{left:5px;top:5px;width:34px;height:34px;filter:grayscale(.75) opacity(.6)}',
    '.pk-tile.pk-people .pk-badge{position:absolute;right:-6px;bottom:-6px;width:24px;height:24px;pointer-events:none}',
    '.pk-pot{position:absolute;left:495px;top:228px;width:150px;height:150px;z-index:1;pointer-events:none;transition:transform .2s}',
    '.pk-pot.pk-hot{transform:scale(1.08) rotate(-2deg)}',
    '.pk-drop{position:absolute;left:470px;top:200px;width:200px;height:210px;border:3px dashed transparent;border-radius:30px;z-index:1;pointer-events:none;transition:border-color .15s}',
    '.pk-drop.pk-hot{border-color:#F28FA5;background:rgba(249,208,217,.18)}',
    '.pk-inpot{position:absolute;left:510px;top:206px;width:120px;height:60px;z-index:2;pointer-events:none}',
    '.pk-inpot div{position:absolute;width:42px;height:42px;animation:pk-bob 1.8s ease-in-out infinite}',
    '.pk-tray{position:absolute;left:322px;top:462px;width:470px;height:144px;padding:8px 12px;box-sizing:border-box;z-index:3}',
    '.pk-msg{font-size:18px;line-height:1.15;height:42px;overflow:hidden;color:#5B3D32}',
    '.pk-msg b{font-family:"Caveat",cursive;font-size:22px}',
    '.pk-slots{display:flex;gap:8px;align-items:center;margin-top:4px}',
    '.pk-slot{position:relative;width:58px;height:58px;border:2px dashed rgba(91,61,50,.45);border-radius:12px 8px 12px 8px;box-sizing:border-box;background:rgba(255,255,255,.4)}',
    '.pk-slot.pk-fullslot{border-style:solid;border-color:#5B3D32;background:#FFF4DF;cursor:pointer}',
    '.pk-slot .pk-art{position:absolute;left:5px;top:3px;width:44px;height:44px}',
    '.pk-slot .pk-st{position:absolute;left:2px;bottom:-9px;display:flex}',
    '.pk-slot .pk-rm{position:absolute;right:-6px;top:-8px;font-size:15px;width:18px;height:18px;line-height:15px;text-align:center;border-radius:50%;background:#F9D0D9;border:1.5px solid #5B3D32;display:none}',
    '.pk-slot.pk-fullslot:hover .pk-rm{display:block}',
    '.pk-slots .pk-sp{flex:1}',
    '.pk-stars{display:inline-flex;gap:0;vertical-align:middle}',
    '.pk-dog{position:absolute;left:800px;top:386px;width:260px;height:217px;z-index:2;pointer-events:none}',
    '.pk-pose{position:absolute;inset:0;display:none}.pk-pose.pk-on{display:block}.pk-pose svg{width:100%;height:100%;display:block;overflow:visible}',
    '.pk-bub{position:absolute;right:120px;top:318px;max-width:330px;padding:5px 14px 7px;background:#FFFBF3;border:2.5px solid #5B3D32;border-radius:18px 14px 20px 12px/14px 20px 12px 18px;font-family:"Caveat",cursive;font-weight:700;font-size:25px;line-height:1.05;box-shadow:2px 3px 0 rgba(91,61,50,.15);opacity:0;transition:opacity .2s;z-index:4;pointer-events:none}',
    '.pk-bub.pk-show{opacity:1}',
    '.pk-bub::after{content:"";position:absolute;right:46px;bottom:-9px;width:14px;height:14px;background:#FFFBF3;border-right:2.5px solid #5B3D32;border-bottom:2.5px solid #5B3D32;transform:rotate(40deg) skewX(12deg)}',
    '.pk-ov{position:absolute;inset:0;z-index:6;background:rgba(91,61,50,.18);display:flex;align-items:center;justify-content:center}',
    '.pk-ov.pk-clear{background:transparent;pointer-events:none}.pk-ov.pk-clear>*{pointer-events:auto}',
    '.pk-modal{position:relative;padding:14px 18px 16px;box-sizing:border-box}',
    '.pk-mh{display:flex;align-items:center;gap:10px;margin-bottom:8px}.pk-mh .pk-title{flex:1}',
    '.pk-book{width:960px;height:540px;margin-top:40px}',
    '.pk-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 16px}',
    '.pk-card{position:relative;height:222px;padding:16px 18px 10px 30px;box-sizing:border-box}',
    '.pk-card>.pk-cardbg{position:absolute;inset:0;z-index:0;pointer-events:none}.pk-cardbg svg{width:100%;height:100%;display:block}',
    '.pk-card>*:not(.pk-cardbg){position:relative;z-index:1}',
    '.pk-cn{font-family:"Caveat",cursive;font-weight:700;font-size:26px;line-height:1;display:flex;align-items:center;gap:6px}',
    '.pk-cn .pk-stars{margin-left:auto}',
    '.pk-ings{display:flex;gap:4px;margin:6px 0 2px;flex-wrap:wrap}',
    '.pk-ing{position:relative;width:40px;text-align:center;font-size:11px;line-height:1}',
    '.pk-ing .pk-art{width:36px;height:36px;margin:0 auto}',
    '.pk-ing.pk-miss .pk-art{filter:grayscale(1) opacity(.45)}',
    '.pk-where{font-size:14px;color:#B4545C;line-height:1.1;min-height:16px}',
    '.pk-steps{font-size:15px;color:#8A7468;line-height:1.1}',
    '.pk-eff{font-size:15px;line-height:1.1;margin-top:2px;height:34px;overflow:hidden}',
    '.pk-cbtns{position:absolute!important;left:30px;right:14px;bottom:10px;display:flex;gap:6px}',
    '.pk-cbtns .pk-btn{font-size:20px;padding:0 10px 2px}',
    '.pk-card.pk-unk .pk-cardbg{filter:grayscale(1) opacity(.55)}',
    '.pk-sil{position:absolute!important;right:16px;top:56px;width:84px;height:84px;filter:brightness(0) opacity(.12)}',
    '.pk-unk .pk-cn{color:#A8968A}.pk-unk .pk-h{font-size:17px;line-height:1.15;margin-top:8px;max-width:150px}',
    '.pk-unk .pk-cnt{margin-top:8px;font-size:15px;color:#8A7468}',
    '.pk-game{width:560px;height:390px;margin:-40px 0 0 -330px}',
    '.pk-gh{font-family:"Caveat",cursive;font-weight:700;font-size:32px;line-height:1;text-align:center}',
    '.pk-gs{font-size:16px;color:#8A7468;text-align:center;margin-top:2px}',
    '.pk-dialw{position:absolute;left:24px;top:76px;width:250px;height:250px}',
    '.pk-dialw>div{position:absolute;inset:0}.pk-dialw svg{width:100%;height:100%;display:block}',
    '.pk-doo{position:absolute;left:300px;top:84px;width:230px;height:150px;display:flex;align-items:center;justify-content:center}',
    '.pk-doo>div{width:100%;height:100%}.pk-doo svg{width:100%;height:100%;display:block}',
    '.pk-doo.pk-chop>div{animation:pk-chop .5s ease-in-out infinite}.pk-doo.pk-stir>div,.pk-doo.pk-simmer>div{animation:pk-wig 1s ease-in-out infinite}',
    '.pk-doo.pk-bake>div{animation:pk-glow 1.2s ease-in-out infinite}.pk-doo.pk-chill>div{animation:pk-bob 1.6s ease-in-out infinite}',
    '.pk-tap{position:absolute;left:340px;top:250px;font-size:34px;padding:2px 34px 6px}',
    '.pk-taph{position:absolute;left:300px;top:312px;width:230px;text-align:center;font-size:15px;color:#8A7468}',
    '.pk-pips{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:10px}',
    '.pk-pip{width:22px;height:22px;border-radius:50%;border:2px solid #5B3D32;background:#FFFBF3;box-sizing:border-box}',
    '.pk-pip.pk-now{background:#FFE3A1}.pk-pip.pk-s2{background:#F5B83D}.pk-pip.pk-s1{background:#FFE3A1}.pk-pip.pk-s0{background:#E7DED5}',
    '.pk-judge{position:absolute;left:24px;top:146px;width:250px;text-align:center;font-family:"Caveat",cursive;font-weight:700;font-size:40px;color:#F28FA5;-webkit-text-stroke:1.2px #5B3D32;opacity:0;pointer-events:none}',
    '.pk-judge.pk-show{animation:pk-pop .8s ease-out forwards}',
    '.pk-reveal{width:620px;height:540px;margin-top:40px;text-align:center}',
    '.pk-bowl{width:170px;height:170px;margin:0 auto -6px}.pk-bowl svg{width:100%;height:100%;display:block}',
    '.pk-dn{font-family:"Caveat",cursive;font-weight:700;font-size:42px;line-height:1}',
    '.pk-rv .pk-stars{margin:4px 0}',
    '.pk-line{font-size:19px;margin:2px 0}',
    '.pk-effl{font-size:18px;margin:4px 0;color:#5B3D32}',
    '.pk-entry{display:inline-block;text-align:left;margin:6px auto 2px;padding:6px 14px;background:#FFF4DF;border:2px dashed rgba(91,61,50,.5);border-radius:10px;font-size:16px;line-height:1.2;max-width:520px}',
    '.pk-entry .pk-ings{margin:2px 0}',
    '.pk-notes{font-size:15px;color:#6A8A5A;margin-top:4px;line-height:1.15}',
    '.pk-new{position:absolute;right:38px;top:24px;font-family:"Caveat",cursive;font-weight:700;font-size:34px;color:#E2566E;border:3px solid #E2566E;border-radius:10px 7px 12px 6px;padding:0 10px 2px;transform:rotate(12deg);background:rgba(255,251,243,.8)}',
    '.pk-rbtns{position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center;gap:12px}',
    '.pk-note{width:520px;padding:18px 22px 16px;margin:-60px 0 0 -40px;text-align:left}',
    '.pk-note .pk-mh .pk-ico{width:62px;height:62px}',
    '.pk-note p{font-size:20px;line-height:1.25;margin:6px 0}',
    '.pk-note .pk-swap{background:#E3F4E6;border:2px dashed #7FB86A;border-radius:10px;padding:4px 10px}',
    '.pk-note .pk-itm{width:56px;height:56px;filter:grayscale(.6)}.pk-itm svg{width:100%;height:100%}',
    '.pk-ghost{position:absolute;width:56px;height:56px;z-index:9;pointer-events:none;transform:translate(-50%,-50%) rotate(-8deg);filter:drop-shadow(2px 4px 0 rgba(91,61,50,.25))}',
    '.pk-ghost svg,.pk-fly svg{width:100%;height:100%;display:block}',
    '.pk-fly{position:absolute;width:52px;height:52px;z-index:8;pointer-events:none}',
    '@keyframes pk-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
    '@keyframes pk-chop{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(4px) rotate(-1.5deg)}}',
    '@keyframes pk-wig{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}',
    '@keyframes pk-glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.08) drop-shadow(0 0 8px #FFC96B)}}',
    '@keyframes pk-pop{0%{opacity:0;transform:scale(.6)}25%{opacity:1;transform:scale(1.1)}70%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-14px)}}',
    '@media (prefers-reduced-motion:reduce){.pk-root *{animation:none!important;transition:none!important}}',
    'html[data-motion="off"] .pk-root *{animation:none!important}'
    ,
    /* v1.5B portrait (phones): layout only */
    '.pk-portrait{overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch}',
    '.pk-portrait .pk-stage{width:420px;height:800px}', /* the height and the rows below are set by portLayout() */
    '.pk-portrait .pk-top{left:8px;right:8px;top:8px;height:auto;min-height:56px;flex-wrap:wrap;gap:6px 8px;padding:6px 8px}',
    '.pk-portrait .pk-btn{min-height:52px;min-width:52px}',
    /* v2.3 phone occlusion: header in two rows (title, fridge, close / touch hint, recipe book), nothing truncated; taps >= 44 px at 360 wide */
    '.pk-portrait .pk-chip{margin-left:auto}.pk-portrait .pk-x{order:1;width:52px;height:52px}',
    '.pk-portrait .pk-sub{order:2;flex:1 1 150px;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.15}.pk-portrait .pk-top .pk-gold{order:3}',
    /* v2.3: the lesson grows instead of clipping, and the slots move down under it */
    '.pk-portrait .pk-msg{height:auto;min-height:42px;overflow:visible}',
    '.pk-portrait .pk-pot{left:135px;top:150px}',
    '.pk-portrait .pk-pot,.pk-portrait .pk-drop,.pk-portrait .pk-inpot{translate:0 var(--pk-potdy,0px)}',
    '.pk-portrait .pk-drop{left:110px;top:122px}',
    '.pk-portrait .pk-inpot{left:150px;top:128px}',
    '.pk-portrait .pk-shelf{left:8px;top:330px;width:404px;height:auto;padding:8px 10px 10px;display:grid;grid-auto-flow:column;grid-template-rows:auto auto;column-gap:16px;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;align-content:start}',
    '.pk-portrait .pk-sh{white-space:nowrap}',
    '.pk-portrait .pk-row{flex-wrap:nowrap;border-bottom:none;margin-bottom:0;padding:8px 14px 4px 4px;border-right:2px dashed rgba(91,61,50,.28)}',
    '.pk-portrait .pk-row.pk-last{border-right:none}',
    '.pk-portrait .pk-tile{flex:none}',
    '.pk-portrait .pk-tile{width:68px;touch-action:pan-x}.pk-portrait .pk-tile .pk-art{left:12px}.pk-portrait .pk-tile .pk-nm{font-size:16px}',
    '.pk-portrait .pk-tile.pk-people{width:52px;height:52px}',
    '.pk-portrait .pk-tray{left:8px;top:492px;width:404px;height:auto;min-height:150px}',
    '.pk-portrait .pk-dog{left:230px;top:648px;width:180px;height:150px}',
    '.pk-portrait .pk-bub{right:auto;left:10px;top:660px;max-width:214px;font-size:22px}.pk-portrait .pk-bub::after{right:-8px;bottom:auto;top:calc(50% - 8px);transform:rotate(-45deg)}',
    '.pk-portrait .pk-ov{align-items:flex-start}',
    '.pk-portrait .pk-book{width:404px;height:780px;margin-top:10px;overflow-y:auto}',
    '.pk-portrait .pk-cards{grid-template-columns:1fr}',
    '.pk-portrait .pk-game{width:404px;height:600px;margin:20px 0 0 0}',
    '.pk-portrait .pk-dialw{left:77px;top:70px}',
    '.pk-portrait .pk-judge{left:77px;top:140px}',
    '.pk-portrait .pk-doo{left:87px;top:330px}',
    '.pk-portrait .pk-tap{left:50%;transform:translateX(-50%);top:486px;min-height:56px}',
    '.pk-portrait .pk-taph{left:87px;top:550px}.pk-portrait .pk-gs{font-size:19px}.pk-portrait .pk-taph{font-size:17px}.pk-portrait .pk-ing{font-size:15px;width:52px}.pk-portrait .pk-entry{font-size:17px}',
    '.pk-portrait .pk-reveal{width:404px;height:740px;margin-top:10px}',
    '.pk-portrait .pk-note{width:404px;margin:40px 0 0 0}'
  ].join('\n');
  function injectCSS() {
    if (typeof document === 'undefined' || document.getElementById('pawkitchen-css')) return;
    var st = document.createElement('style'); st.id = 'pawkitchen-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  injectCSS();

  /* =========================== lines =========================== */
  var LINES = {
    hello: ['Are we cooking? For ME?', 'I can smell the oats from here.', 'I will supervise. Very closely.', 'Kitchen! My favourite room after all the other rooms.'],
    chop: ['Chop chop! I\'ll catch any carrot that falls.', 'Careful with your paws. I mean hands.', 'Crunch noises! My favourite song.'],
    stir: ['Stir it like you mean it!', 'Round and round... I\'m getting dizzy. Happy dizzy.', 'That smells like a hug.'],
    bake: ['The oven is the warmest TV.', 'Is it done? Is it done now?', 'I\'ll guard the oven door. Nobody leaves.'],
    simmer: ['Bubble bubble... is it soup yet?', 'Slow cooking. Slow drooling.', 'I\'ll wait right here. Forever if I must.'],
    chill: ['Brr! Cold treats are the best treats.', 'Into the freezer it goes! Hurry, freezer!', 'Frosty berries. Fancy.'],
    good2: ['PERFECT! I\'m drooling.', 'Chef! You\'re a chef!', 'Wow. I sat extra nicely for that one.'],
    good1: ['Nice one!', 'Ooh, close enough to smell great.', 'Good! Good! Good!'],
    good0: ['That\'s... fine. I\'d still eat it.', 'A wobbly one. Wobbly is a flavour.', 'Oops! Still smells amazing.'],
    nope: ['Nope! Not for pups.', 'Sniff... no thank you.', 'That one stays on the people shelf.'],
    full: ['The pot is full!', 'Four things is plenty, chef.'],
    add: ['Ooh, in it goes!', 'Yes. More of that.', 'I approve this ingredient.', 'Plop!']
  };

  /* =========================== UI =========================== */
  var notesShown = {};      // prepared-safe notes: once per page session (the game owns long-term memory)

  function open(el, o) {
    o = o || {};
    injectCSS();
    var rng = typeof o.rng === 'function' ? o.rng : Math.random;
    var pick = function (a) { return a[Math.floor(rng() * a.length) % a.length]; };
    var sfx = function (n) { try { (o.sfx || noop)(n); } catch (e) { /* ignore */ } };
    var sayExt = function (t, ms) { try { (o.say || noop)(t, ms); } catch (e) { /* ignore */ } };
    var call = function (fn, a) { try { if (typeof fn === 'function') fn(a); } catch (e) { /* ignore */ } };

    var dog = o.dog || {}, dogKey = dog.key || 'mutt', dogName = dog.name || 'Your pup'; _kCoat = dog.coat; _kSeed = dog.seed;
    var S = {
      time: o.time || 'day', weather: o.weather || 'sunny',
      known: Array.isArray(o.known) ? o.known.slice() : ['carrot-crunchies', 'chicken-veggie-rice', 'blueberry-pupsicle'],
      best: Object.assign({}, o.best || {}),
      pantry: Object.assign({}, o.pantry || {}),
      crops: {},
      fridge: { count: (o.fridge && o.fridge.count) | 0, max: (o.fridge && o.fridge.max) || 8 },
      pot: [], mode: 'kitchen'
    };
    CROP_IDS.forEach(function (id) { S.crops[id] = cropArr(o.crops, id); });

    var closed = false, timers = [], raf = 0, drag = null, game = null, bubT = 0, gdbg = null;
    var later = function (fn, ms) { var t = setTimeout(function () { if (!closed) fn(); }, ms); timers.push(t); return t; };

    if (!el) el = document.body;
    /* v1.5B portrait (phones): a 420-wide stage scaled to the screen width (layout only) */
    var PORT = !!(el && (el.clientHeight || 0) > (el.clientWidth || 1) * 1.1); W = PORT ? 420 : 1240; H = PORT ? 800 : 620;
    var TOUCH = PORT || !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches); // v2.3: touch wording
    var POT_XY = PORT ? { x: 210, y: 200 } : { x: 570, y: 280 };
    var root = document.createElement('div'); root.className = 'pk-root' + (PORT ? ' pk-portrait' : ''); root.tabIndex = 0; root.setAttribute('role', 'application'); root.setAttribute('aria-label', 'Kitchen');
    var stage = document.createElement('div'); stage.className = 'pk-stage'; root.appendChild(stage);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(root);
    function div(cls, parent, html) { var e = document.createElement('div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || stage).appendChild(e); return e; }
    function btn(label, cls, parent, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'pk-btn ' + (cls || ''); b.innerHTML = label; b.addEventListener('click', function (e) { e.stopPropagation(); if (!closed) fn(e); }); (parent || stage).appendChild(b); return b; }

    /* layout scaling */
    var scale = 1, offX = 0, offY = 0;
    function fit() {
      var w = root.clientWidth || W, h = root.clientHeight || H;
      scale = (PORT ? w / W : Math.min(w / W, h / H)) || 1; offX = Math.max(0, (w - W * scale) / 2); offY = PORT ? 0 : Math.max(0, (h - H * scale) / 2);
      stage.style.transform = 'translate(' + offX + 'px,' + offY + 'px) scale(' + scale + ')';
      portLayout();
    }
    /* v2.3 portrait: the stage is as tall as the screen (no blank band under the dog). The dog sits at the bottom, the tray and the
       pantry stack above it at their real heights (no empty pantry space), and the pot is centred in the room that is left. */
    function portLayout() {
      if (!PORT || typeof tray === 'undefined' || !tray || !shelf) return;
      var Hs = Math.max(700, Math.floor((root.clientHeight || H) / scale)), trH = tray.offsetHeight, shH = shelf.offsetHeight;
      var dogTop = Hs - 152, trayTop = dogTop - 6 - trH, shelfTop = Math.max(330, trayTop - 10 - shH); // never above its old place under the pot (short screens scroll, as before)
      if (shelfTop + shH + 10 > trayTop) { trayTop = shelfTop + shH + 10; dogTop = trayTop + trH + 6; Hs = dogTop + 152; }
      stage.style.height = Hs + 'px'; shelf.style.top = shelfTop + 'px'; tray.style.top = trayTop + 'px';
      dogEl.style.top = dogTop + 'px'; bub.style.top = (dogTop + 12) + 'px';
      stage.style.setProperty('--pk-potdy', Math.max(0, Math.round((shelfTop - 330) / 2)) + 'px');
    }

    var ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(root); } else window.addEventListener('resize', fit);
    fit();
    function toStage(cx, cy) { var r = root.getBoundingClientRect(); return { x: (cx - r.left - offX + root.scrollLeft) / scale, y: (cy - r.top - offY + root.scrollTop) / scale }; }

    /* scene */
    var sceneEl = div('pk-scene');
    function drawScene() { sceneEl.innerHTML = sceneSvg(S.time, S.weather); if (PORT) { var sv = sceneEl.querySelector('svg'); if (sv) sv.setAttribute('preserveAspectRatio', 'xMidYMid slice'); } }
    drawScene();

    /* pot */
    var dropEl = div('pk-drop');
    var potEl = div('pk-pot pk-abs', null, propArt('pot'));
    var inpotEl = div('pk-inpot');

    /* dog */
    var begPose = hasPose(dogKey, 'beg') ? 'beg' : 'sit';
    var dogEl = div('pk-dog'), poses = {};
    ['sit', begPose, 'happy'].forEach(function (p) { if (poses[p]) return; poses[p] = div('pk-pose', dogEl, dogSvg(dogKey, p, dog.outfit)); });
    function setPose(p) { if (!poses[p]) p = 'sit'; for (var k in poses) poses[k].classList.toggle('pk-on', k === p); }
    setPose('sit');
    var bub = div('pk-bub');
    function dogSay(t, ms) { bub.textContent = t; bub.classList.add('pk-show'); clearTimeout(bubT); bubT = setTimeout(function () { bub.classList.remove('pk-show'); }, ms || 2600); }

    /* top bar */
    var top = div('pk-top pk-paper pk-tape');
    div('pk-ico', top, art('icon', 'kitchen') || doodleProp('pot'));
    div('pk-title', top, 'Kitchen');
    var subEl = div('pk-sub', top, TOUCH ? 'Tap or drag ingredients into the pot. 2 to 4 things make a dish.' : 'Drag ingredients into the pot, or tap them. 2 to 4 things make a dish.');
    var fridgeEl = div('pk-chip', top);
    var bookBtn = btn((art('icon', 'recipe') || '') + 'Recipe book', 'pk-gold', top, function () { showBook(); });
    var closeBtn = btn(art('icon', 'close') || '&times;', 'pk-x', top, function () { close(); });
    closeBtn.setAttribute('aria-label', 'Close the kitchen');
    function drawFridge() {
      var full = S.fridge.count >= S.fridge.max;
      fridgeEl.className = 'pk-chip' + (full ? ' pk-full' : '');
      fridgeEl.innerHTML = (art('icon', 'fridge') || '') + 'Fridge ' + S.fridge.count + '/' + S.fridge.max;
    }

    /* shelf */
    var shelf = div('pk-shelf pk-paper pk-tape pk-tb');
    function remaining(id) {
      if (id === 'water') return Infinity;
      var inPot = S.pot.filter(function (u) { return u.id === id; }).length;
      if (isCrop(id)) { var a = S.crops[id]; return a[0] + a[1] + a[2] - inPot; }
      return Math.max(0, S.pantry[id] | 0) - inPot;
    }
    function bestStarLeft(id) { var t = takeIngredients([id], S.pantry, S.crops, S.pot); return t.used.length ? t.used[0].stars : 0; }
    function drawShelf() {
      var h = '<div class="pk-sh">Pantry <small>Kibble Corner</small></div><div class="pk-row">';
      PANTRY.forEach(function (p) {
        var n = remaining(p.id), out = n <= 0;
        h += '<button type="button" class="pk-tile' + (out ? ' pk-out' : '') + '" data-ing="' + p.id + '" title="' + esc(p.name + (out ? ' (buy more at the Kibble Corner pantry)' : '')) + '">' +
          '<div class="pk-art">' + ingArt(p.id) + '</div><div class="pk-nm">' + esc(p.id === 'water' ? 'Water' : p.name) + '</div><div class="pk-ct">' + (p.id === 'water' ? '&infin;' : Math.max(0, n)) + '</div></button>';
      });
      h += '</div><div class="pk-sh">From the garden <small>best stars first</small></div><div class="pk-row">';
      CROP_IDS.forEach(function (id) {
        var n = remaining(id), out = n <= 0, bs = out ? 0 : bestStarLeft(id);
        h += '<button type="button" class="pk-tile' + (out ? ' pk-out' : '') + '" data-ing="' + id + '" title="' + esc(CROP_NAMES[id] + (out ? ' (grow it in the garden)' : '')) + '">' +
          '<div class="pk-art">' + ingArt(id) + '</div><div class="pk-nm">' + esc(id === 'sweet-potato' ? 'Sw. Potato' : CROP_NAMES[id]) + '</div><div class="pk-ct">' + Math.max(0, n) + '</div>' +
          (bs ? '<div class="pk-st">' + starsHtml(bs, 13, bs) + '</div>' : '') + '</button>';
      });
      h += '</div><div class="pk-sh">People pantry <small>not for pups</small></div><div class="pk-row pk-last">';
      PEOPLE_FOOD.forEach(function (pf) {
        h += '<button type="button" class="pk-tile pk-people" data-pf="' + pf.id + '" title="' + esc(pf.name + ': not for dogs') + '"><div class="pk-art">' + peopleArt(pf) + '</div><div class="pk-badge">' + pawStopArt() + '</div></button>';
      });
      shelf.innerHTML = h + '</div>';
    }

    /* tray */
    var tray = div('pk-tray pk-paper');
    var msgEl = div('pk-msg', tray);
    var slotsEl = div('pk-slots', tray);
    var cookBtn, emptyBtn;
    function msg(html) { msgEl.innerHTML = html; }
    function drawTray() {
      var h = '';
      for (var i = 0; i < 4; i++) {
        var u = S.pot[i];
        h += u ? '<div class="pk-slot pk-fullslot" data-slot="' + i + '" title="Take ' + esc(ingName(u.id)) + ' out"><div class="pk-art">' + ingArt(u.id) + '</div>' + (u.stars ? '<div class="pk-st">' + starsHtml(u.stars, 13, u.stars) + '</div>' : '') + '<div class="pk-rm">&times;</div></div>'
          : '<div class="pk-slot"></div>';
      }
      slotsEl.innerHTML = h + '<div class="pk-sp"></div>';
      emptyBtn = btn('Empty', '', slotsEl, function () { S.pot = []; sfx('click'); refresh(); msg('The pot is empty again. Ready for a new idea!'); });
      cookBtn = btn('Cook!', 'pk-go', slotsEl, function () { startCook(); });
      var full = S.fridge.count >= S.fridge.max;
      cookBtn.disabled = full || S.pot.length < 2;
      emptyBtn.disabled = !S.pot.length;
      if (full) msg('<b>The fridge is full. Feed a dish first.</b>');
      // pot contents floating above the rim
      var ih = '';
      S.pot.forEach(function (u, k) { ih += '<div style="left:' + (k * 26) + 'px;top:' + (k % 2 ? 10 : 0) + 'px;animation-delay:' + (k * 0.3) + 's">' + ingArt(u.id) + '</div>'; });
      inpotEl.innerHTML = ih;
    }
    function refresh() { drawShelf(); drawTray(); drawFridge(); if (bookEl) drawBook(); }

    slotsEl.addEventListener('click', function (e) {
      var s = e.target.closest('[data-slot]'); if (!s || S.mode !== 'kitchen') return;
      var i = +s.getAttribute('data-slot'), u = S.pot[i]; if (!u) return;
      S.pot.splice(i, 1); sfx('click'); refresh(); msg(esc(ingName(u.id)) + ' went back on the shelf.');
    });

    /* adding ingredients */
    function addToPot(id, fromXY) {
      if (S.mode !== 'kitchen') return false;
      var note = safety(id);
      if (note) { bounceOut(id, fromXY); return false; }
      if (!canCook(id)) return false;
      if (S.pot.length >= 4) { sfx('nope'); msg('<b>The pot holds 4 things at most.</b> Tap one in the pot to take it out.'); dogSay(pick(LINES.full), 1800); return false; }
      var t = takeIngredients([id], S.pantry, S.crops, S.pot);
      if (!t.used.length) {
        sfx('nope');
        msg(isCrop(id) ? 'No ' + esc(CROP_NAMES[id]) + ' left: grow it in the garden.' : 'No ' + esc(ingName(id)) + ' left: the Kibble Corner pantry has more.');
        return false;
      }
      S.pot.push(t.used[0]); sfx('pop');
      flyTo(id, fromXY, POT_XY, false);
      potEl.classList.add('pk-hot'); later(function () { potEl.classList.remove('pk-hot'); }, 220);
      refresh();
      var m = S.pot.length >= 2 ? 'In the pot: ' + S.pot.map(function (u) { return esc(ingName(u.id)); }).join(', ') + '. Press <b>Cook!</b> or add more.' : esc(ingName(id)) + ' is in. Add 1 to 3 more things.';
      msg(m);
      if (rng() < 0.35) dogSay(pick(LINES.add), 1400);
      return true;
    }
    function flyTo(id, from, to, isPeople) {
      if (!from) return;
      var f = div('pk-fly', null, isPeople ? peopleArt(safety(id)) : ingArt(id));
      f.style.left = (from.x - 26) + 'px'; f.style.top = (from.y - 26) + 'px';
      if (!f.animate) { f.remove(); return; }
      var dx = to.x - from.x, dy = to.y - from.y;
      var a = f.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 90) + 'px) scale(1.05)', offset: 0.5 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.5)', opacity: 0.2 }], { duration: 420, easing: 'ease-in' });
      a.onfinish = function () { f.remove(); };
    }
    function bounceOut(id, from) {
      var pf = safety(id); if (!pf) return;
      sfx('nope'); setPose('sit'); dogSay(pick(LINES.nope), 2200);
      call(o.onSafety, pf.id);
      from = from || { x: 160, y: 520 };
      var f = div('pk-fly', null, peopleArt(pf));
      f.style.left = (from.x - 26) + 'px'; f.style.top = (from.y - 26) + 'px';
      var px = 570 - from.x, py = 260 - from.y;
      var show = function () { f.remove(); showNote(pf); };
      if (!f.animate) { show(); return; }
      var a = f.animate([
        { transform: 'translate(0,0) rotate(0)' },
        { transform: 'translate(' + px * 0.5 + 'px,' + (py * 0.5 - 110) + 'px) rotate(-90deg)', offset: 0.3 },
        { transform: 'translate(' + px + 'px,' + py + 'px) rotate(-180deg) scale(.9)', offset: 0.5 },
        { transform: 'translate(' + (px + 60) + 'px,' + (py - 120) + 'px) rotate(-260deg)', offset: 0.72 },
        { transform: 'translate(' + (px + 140) + 'px,' + (py - 10) + 'px) rotate(-360deg)', opacity: 0.1 }
      ], { duration: 1100, easing: 'ease-out' });
      later(function () { potEl.classList.add('pk-hot'); later(function () { potEl.classList.remove('pk-hot'); }, 200); }, 520);
      a.onfinish = show;
    }

    /* drag & tap on the shelf */
    function hotPot(x, y) { if (PORT) return (x > 90 && x < 330 && y > 110 && y < 330) || (x > 8 && x < 412 && y > 490 && y < 640); return (x > 450 && x < 700 && y > 190 && y < 420) || (x > 322 && x < 792 && y > 462 && y < 606); }
    shelf.addEventListener('pointerdown', function (e) {
      var t = e.target.closest('[data-ing],[data-pf]'); if (!t || S.mode !== 'kitchen') return;
      var id = t.getAttribute('data-ing') || t.getAttribute('data-pf');
      var people = t.hasAttribute('data-pf');
      if (!people && t.classList.contains('pk-out')) { addToPot(id, null); return; }
      e.preventDefault();
      var p = toStage(e.clientX, e.clientY);
      drag = { id: id, people: people, sx: p.x, sy: p.y, moved: false, ghost: null, pid: e.pointerId };
      try { root.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    });
    function onMove(e) {
      if (!drag) return;
      var p = toStage(e.clientX, e.clientY);
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) {
        drag.moved = true; drag.ghost = div('pk-ghost', null, drag.people ? peopleArt(safety(drag.id)) : ingArt(drag.id));
      }
      if (drag.moved) {
        drag.ghost.style.left = p.x + 'px'; drag.ghost.style.top = p.y + 'px';
        var hot = hotPot(p.x, p.y); dropEl.classList.toggle('pk-hot', hot); potEl.classList.toggle('pk-hot', hot);
      }
    }
    function onUp(e) {
      if (!drag) return;
      var d = drag; drag = null;
      try { root.releasePointerCapture(d.pid); } catch (er) { /* ignore */ }
      var p = toStage(e.clientX, e.clientY);
      if (d.ghost) d.ghost.remove();
      dropEl.classList.remove('pk-hot'); potEl.classList.remove('pk-hot');
      if (!d.moved) { addToPot(d.id, { x: d.sx, y: d.sy }); return; }
      if (hotPot(p.x, p.y)) addToPot(d.id, p);
      else if (!d.people) msg('Drop it on the pot to add it.');
    }
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', function () { if (drag && drag.ghost) drag.ghost.remove(); drag = null; dropEl.classList.remove('pk-hot'); potEl.classList.remove('pk-hot'); });
    shelf.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var t = e.target.closest('[data-ing],[data-pf]'); if (!t) return;
      e.preventDefault(); var r = t.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height / 2);
      addToPot(t.getAttribute('data-ing') || t.getAttribute('data-pf'), p);
    });

    /* overlays */
    var ovEl = null, bookEl = null;
    function closeOverlay() { if (ovEl) { ovEl.remove(); ovEl = null; bookEl = null; } }
    function overlay(clear) { closeOverlay(); ovEl = div('pk-ov' + (clear ? ' pk-clear' : '')); if (PORT) root.scrollTop = 0; return ovEl; }

    function showNote(pf) {
      var ov = overlay();
      var m = div('pk-modal pk-note pk-paper pk-tape', ov);
      m.innerHTML = '<div class="pk-mh"><div class="pk-ico">' + pawStopArt() + '</div><div class="pk-title">Paw stop: ' + esc(pf.name) + '</div><div class="pk-itm">' + peopleArt(pf) + '</div></div>' +
        '<p>' + esc(pf.why) + '</p><p class="pk-swap">' + esc(pf.swap) + '</p>';
      var row = div('', m); row.style.cssText = 'display:flex;justify-content:flex-end;margin-top:8px';
      var b = btn('Got it', 'pk-go', row, function () { closeOverlay(); root.focus(); msg('That stays on the people shelf. ' + esc(pf.swap)); });
      ov.addEventListener('click', function (e) { if (e.target === ov) { closeOverlay(); root.focus(); } });
      try { b.focus(); } catch (e) { /* ignore */ }
    }

    function showBook() {
      if (S.mode !== 'kitchen') return;
      var ov = overlay();
      bookEl = div('pk-modal pk-book pk-paper pk-tape', ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) { closeOverlay(); root.focus(); } });
      drawBook(); sfx('click');
    }
    function drawBook() {
      if (!bookEl) return;
      bookEl.innerHTML = '';
      var mh = div('pk-mh', bookEl);
      div('pk-ico', mh, art('icon', 'recipe') || '');
      div('pk-title', mh, 'Recipe book <span style="font-size:20px;color:#8A7468;font-family:Patrick Hand">' + S.known.filter(function (k) { return k !== 'mystery-mush'; }).length + ' of 6 found</span>');
      btn(art('icon', 'close') || '&times;', 'pk-x', mh, function () { closeOverlay(); root.focus(); });
      var grid = div('pk-cards', bookEl), full = S.fridge.count >= S.fridge.max;
      RECIPES.forEach(function (r) {
        if (r.id === 'mystery-mush') return;
        var known = S.known.indexOf(r.id) >= 0;
        var c = div('pk-card' + (known ? '' : ' pk-unk'), grid);
        div('pk-cardbg', c, propArt('recipe-card'));
        if (!known) {
          div('pk-sil', c, propArt('bowl', { food: r.name }));
          div('pk-cn', c, '? ? ?');
          div('pk-h', c, esc(r.hint));
          div('pk-cnt', c, r.ingredients.length + ' ingredients. Experiment in the pot to find it!');
          return;
        }
        var best = S.best[r.id] | 0;
        div('pk-cn', c, esc(r.name) + (best ? starsHtml(best, 17) : ''));
        var t = takeIngredients(r.ingredients, S.pantry, S.crops, []), miss = t.missing.slice();
        var ih = '', where = [];
        r.ingredients.forEach(function (id) {
          var k = miss.indexOf(id), m = k >= 0; if (m) miss.splice(k, 1);
          ih += '<div class="pk-ing' + (m ? ' pk-miss' : '') + '"><div class="pk-art">' + ingArt(id) + '</div>' + esc(id === 'sweet-potato' ? 'Sw. Potato' : ingName(id)) + '</div>';
          if (m) where.push(esc(ingName(id)) + ': ' + (isCrop(id) ? 'grow it' : 'Kibble Corner pantry'));
        });
        div('pk-ings', c, ih);
        div('pk-where', c, where.join(' · '));
        div('pk-steps', c, r.steps.map(function (s) { return STEP_NAME[s]; }).join(' → '));
        div('pk-eff', c, esc(effectText(effectFor(r.id, 1))));
        var bb = div('pk-cbtns', c);
        var put = btn('Put in pot', 'pk-go', bb, function () {
          var tt = takeIngredients(r.ingredients, S.pantry, S.crops, []);
          if (tt.missing.length) return;
          S.pot = tt.used; closeOverlay(); refresh(); sfx('pop'); root.focus();
          msg('Everything for <b>' + esc(r.name) + '</b> is in the pot. Press <b>Cook!</b>');
        });
        put.disabled = t.missing.length > 0 || full;
        if (best >= 3) {
          var bh = btn('Cook by heart', 'pk-gold', bb, function () {
            var tt = takeIngredients(r.ingredients, S.pantry, S.crops, []);
            if (tt.missing.length || S.fridge.count >= S.fridge.max) return;
            S.pot = tt.used; closeOverlay(); finish(r.id, 2, true, false);
          });
          bh.disabled = t.missing.length > 0 || full;
          bh.title = 'Skips the mini-game: a sure 2 stars';
        }
      });
      if (full) { var f = div('pk-where', bookEl, 'The fridge is full. Feed a dish first.'); f.style.cssText = 'text-align:center;margin-top:6px;font-size:18px'; }
    }

    /* cooking */
    function startCook() {
      if (S.mode !== 'kitchen') return;
      if (S.fridge.count >= S.fridge.max) { msg('<b>The fridge is full. Feed a dish first.</b>'); sfx('nope'); return; }
      var ids = S.pot.map(function (u) { return u.id; });
      var ex = experiment(ids, S.known);
      if (!ex.ok) { if (ex.reason === 'few') msg('Add at least 2 things to the pot.'); sfx('nope'); return; }
      if (ex.recipe === 'mystery-mush') { finish('mystery-mush', 1, false, false, ex.hint); return; }
      runGame(ex.recipe, ex.discovered);
    }

    function runGame(rid, discovered) {
      var r = recipeById(rid); S.mode = 'game'; closeOverlay();
      var ov = overlay(true);
      var m = div('pk-modal pk-game pk-paper pk-tape', ov);
      var gh = div('pk-gh', m), gs = div('pk-gs', m, discovered ? 'Something new is happening in this pot...' : esc(r.name));
      var dialW = div('pk-dialw', m);
      div('', dialW, propArt('dial'));
      var dyn = div('', dialW);
      var judge = div('pk-judge', m);
      var doo = div('pk-doo', m), dooIn = div('', doo);
      var tapB = btn('Tap!', 'pk-gold pk-tap', m, function () { tap(); });
      div('pk-taph', m, 'Tap when the needle is in the golden zone. Space works too.');
      var pips = div('pk-pips', m);
      var n = r.steps.length, w = zoneWidth(n), scores = [], idx = -1, t0 = 0, zone = null, tapped = false, running = false;
      game = { tap: tap };
      m.addEventListener('pointerdown', function (e) { if (e.target.closest('.pk-btn')) return; tap(); });
      setPose(begPose);
      function drawPips() { var h = ''; for (var i = 0; i < n; i++) h += '<div class="pk-pip ' + (i < scores.length ? 'pk-s' + scores[i] : i === idx ? 'pk-now' : '') + '"></div>'; pips.innerHTML = h; }
      function pt(t, rad) { var d = (210 - 240 * t) * Math.PI / 180; return [80 + Math.cos(d) * rad, 80 - Math.sin(d) * rad]; }
      function arc(t1, t2, rad) { var a = pt(t1, rad), b = pt(t2, rad); return 'M' + f1(a[0]) + ' ' + f1(a[1]) + ' A' + rad + ' ' + rad + ' 0 0 1 ' + f1(b[0]) + ' ' + f1(b[1]); }
      function drawDial(t, frozen) {
        var deg = 210 - 240 * t, rot = 90 - deg;
        dyn.innerHTML = '<svg viewBox="0 0 160 160">' +
          '<path d="' + arc(zone.c - w / 2, zone.c + w / 2, 57) + '" fill="none" stroke="' + GOLD + '" stroke-width="13" stroke-linecap="butt" opacity=".95"/>' +
          '<path d="' + arc(zone.c - w / 4, zone.c + w / 4, 57) + '" fill="none" stroke="#F5B83D" stroke-width="13" stroke-linecap="butt"/>' +
          '<path d="' + arc(zone.c - w / 2, zone.c + w / 2, 64) + '" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
          '<g transform="rotate(' + f1(rot) + ' 80 80)"><path d="M80 86 L78.5 30 L80 22 L81.5 30 Z" fill="' + (frozen ? '#E2566E' : INK) + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/></g>' +
          '<circle cx="80" cy="80" r="6" fill="' + PINK + '" stroke="' + INK + '" stroke-width="2"/></svg>';
      }
      function nextStep() {
        idx++;
        if (idx >= n) { done(); return; }
        var step = r.steps[idx]; tapped = false; running = false;
        zone = { c: w / 2 + 0.18 + rng() * (1 - w - 0.2), w: w };
        gh.textContent = 'Step ' + (idx + 1) + ' of ' + n + ': ' + STEP_NAME[step] + '!';
        doo.className = 'pk-doo pk-' + step; dooIn.innerHTML = stepArt(step);
        drawDial(0); drawPips(); tapB.disabled = false;
        dogSay(pick(LINES[step]), 2400);
        gdbg = { step: step, idx: idx, zone: zone, running: false, t0: 0 };
        later(function () { running = true; t0 = performance.now(); gdbg.running = true; gdbg.t0 = t0; raf = requestAnimationFrame(tick); }, 700);
      }
      function tick(now) {
        if (closed || !running) return;
        var t = Math.min(1, (now - t0) / 1600);
        drawDial(t, false);
        if (t >= 1) { score(null); return; }
        raf = requestAnimationFrame(tick);
      }
      function tap() {
        if (tapped || !running || closed) return;
        tapped = true; running = false; cancelAnimationFrame(raf);
        var t = Math.min(1, (performance.now() - t0) / 1600);
        drawDial(t, true); score(t);
      }
      function score(t) {
        running = false; tapped = true; tapB.disabled = true; if (gdbg) gdbg.running = false;
        var s = stepScore(t, zone); scores.push(s);
        sfx(STEP_SFX[r.steps[idx]] || 'click');
        judge.textContent = s === 2 ? 'Perfect!' : s === 1 ? 'Nice!' : t == null ? 'Whoosh!' : 'Close enough!';
        judge.classList.remove('pk-show'); void judge.offsetWidth; judge.classList.add('pk-show');
        dogSay(pick(LINES['good' + s]), 1500);
        drawPips();
        later(nextStep, 950);
      }
      function done() {
        var cs = cookStars(scores, n); game = null;
        later(function () { finish(rid, cs, false, discovered); }, 250);
      }
      nextStep();
    }

    function finish(rid, cs, auto, discovered, mushHint) {
      var used = S.pot.slice();
      var cropStars = used.filter(function (u) { return u.stars != null; }).map(function (u) { return u.stars; });
      var stars = rid === 'mystery-mush' ? 1 : auto ? 2 : dishStars(cs, cropStars);
      var r = { recipe: rid, used: used.map(function (u) { return { id: u.id, stars: u.stars == null ? null : u.stars }; }), cookStars: auto ? 2 : clampStar(cs), stars: stars, auto: !!auto, discovered: !!discovered };
      // local bookkeeping (the game sends the truth back through update())
      used.forEach(function (u) { if (u.id === 'water') return; if (u.stars != null) S.crops[u.id][u.stars - 1] = Math.max(0, S.crops[u.id][u.stars - 1] - 1); else S.pantry[u.id] = Math.max(0, (S.pantry[u.id] | 0) - 1); });
      S.pot = []; S.fridge.count++;
      if (rid !== 'mystery-mush') { if (S.known.indexOf(rid) < 0) S.known.push(rid); S.best[rid] = Math.max(S.best[rid] | 0, stars); }
      call(o.onCook, r);
      sfx('ding');
      S.mode = 'reveal';
      showReveal(r, used, mushHint);
      refresh();
      sayExt((recipeById(rid) || {}).name + ' went in the fridge.', 2200);
    }

    function showReveal(r, used, mushHint) {
      var rec = recipeById(r.recipe), mush = r.recipe === 'mystery-mush';
      var ov = overlay();
      var m = div('pk-modal pk-reveal pk-rv pk-paper pk-tape', ov);
      setPose('happy');
      if (r.discovered) div('pk-new', m, 'NEW!');
      div('pk-bowl', m, propArt('bowl', { food: rec.name }));
      div('pk-dn', m, esc(rec.name));
      div('', m, starsHtml(r.stars, 34));
      var line;
      if (mush) line = 'Mystery Mush! ' + esc(dogName) + ' gives the bowl a curious sniff... and approves.';
      else if (r.auto) line = 'Cooked by heart. ' + esc(dogName) + ' watched every second.';
      else if (r.stars === 1) line = 'It\'s... a shape. ' + esc(dogName) + ' loves it anyway.';
      else if (r.stars === 2) line = 'Pretty good! ' + esc(dogName) + ' is doing the happy wiggle.';
      else line = 'Chef\'s kiss! ' + esc(dogName) + ' can hardly sit still.';
      div('pk-line', m, line);
      if (!mush && FAV[dogKey] === r.recipe) div('pk-line', m, '<b style="color:#E2566E">That\'s ' + esc(dogName) + '\'s favourite!</b>');
      div('pk-effl', m, esc(effectText(effectFor(r.recipe, r.stars))));
      if (mush) {
        div('pk-entry', m, mushHint ? '<b>' + esc(mushHint) + '</b>' : 'Nothing clicked this time. Try a new mix: 2 to 4 things.');
      } else {
        var ih = rec.ingredients.map(function (id) { return '<div class="pk-ing"><div class="pk-art">' + ingArt(id) + '</div>' + esc(id === 'sweet-potato' ? 'Sw. Potato' : ingName(id)) + '</div>'; }).join('');
        div('pk-entry', m, (r.discovered ? '<b>Added to your recipe book!</b> ' : '<b>Recipe book:</b> ') + esc(rec.steps.map(function (s) { return STEP_NAME[s]; }).join(' → ')) +
          ' · best ' + starsHtml(S.best[rec.id] | 0, 15) + '<div class="pk-ings">' + ih + '</div>');
      }
      var notes = [];
      used.forEach(function (u) { if (NOTES[u.id] && !notesShown[u.id]) { notesShown[u.id] = 1; if (notes.indexOf(NOTES[u.id]) < 0) notes.push(esc(ingName(u.id)) + ': ' + NOTES[u.id]); } });
      if (notes.length) div('pk-notes', m, notes.join('<br>'));
      var bb = div('pk-rbtns', m);
      var again = btn('Cook more', 'pk-go', bb, function () { backToKitchen(); });
      btn('Done', '', bb, function () { close(); });
      if (S.fridge.count >= S.fridge.max) { again.textContent = 'Back to the kitchen'; }
      try { again.focus(); } catch (e) { /* ignore */ }
      dogSay(mush ? 'Mush! My favourite colour.' : pick(['For ME? You shouldn\'t have. (You should.)', 'I\'m saving it for later. No I\'m not.', 'Best. Day. Ever.']), 2600);
    }
    function backToKitchen() {
      closeOverlay(); S.mode = 'kitchen'; setPose('sit'); refresh(); root.focus();
      msg(S.fridge.count >= S.fridge.max ? '<b>The fridge is full. Feed a dish first.</b>' : 'What shall we cook next? Mix 2 to 4 things.');
    }

    /* keyboard */
    function onKey(e) {
      if (closed) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (S.mode === 'kitchen' && ovEl) { closeOverlay(); root.focus(); return; }
        close(); return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        if (S.mode === 'game' && game) { e.preventDefault(); game.tap(); }
        return;
      }
      if ((e.key === 'b' || e.key === 'B') && S.mode === 'kitchen' && !ovEl) showBook();
    }
    window.addEventListener('keydown', onKey);

    /* first paint */
    refresh();
    var firstMsg = !notesShown.kitchen ? (notesShown.kitchen = 1, '<b>' + NOTES.kitchen + '</b>') : (TOUCH ? 'Tap or drag' : 'Drag') + ' 2 to 4 ingredients into the pot, then press <b>Cook!</b>';
    if (S.fridge.count < S.fridge.max) msg(firstMsg);
    later(function () { dogSay(pick(LINES.hello), 2600); }, 400);
    try { root.focus({ preventScroll: true }); } catch (e) { /* ignore */ }

    if (PORT) { portLayout(); if (typeof ResizeObserver !== 'undefined') { var pro = new ResizeObserver(portLayout); pro.observe(tray); pro.observe(shelf); } }
    function close() {
      if (closed) return;
      closed = true;
      timers.forEach(clearTimeout); clearTimeout(bubT); cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', fit);
      if (pro) pro.disconnect();
      if (root.parentNode) root.parentNode.removeChild(root);
      call(o.onClose);
    }
    function update(p) {
      if (closed || !p) return;
      var redraw = false;
      if (p.time && p.time !== S.time) { S.time = p.time; redraw = true; }
      if (p.weather && p.weather !== S.weather) { S.weather = p.weather; redraw = true; }
      if (redraw) drawScene();
      if (p.pantry) S.pantry = Object.assign({}, p.pantry);
      if (p.crops) CROP_IDS.forEach(function (id) { S.crops[id] = cropArr(p.crops, id); });
      if (p.fridge) S.fridge = { count: p.fridge.count | 0, max: p.fridge.max || S.fridge.max };
      if (Array.isArray(p.known)) S.known = p.known.slice();
      if (p.best) S.best = Object.assign({}, p.best);
      if (p.pantry || p.crops) { // keep only what is still owned
        var keep = takeIngredients(S.pot.map(function (u) { return u.id; }), S.pantry, S.crops, []);
        S.pot = keep.used;
      }
      if (S.mode !== 'game') refresh(); else { drawShelf(); drawFridge(); }
    }
    return {
      close: close, update: update,
      _dbg: function () { return { mode: S.mode, pot: S.pot.slice(), known: S.known.slice(), best: Object.assign({}, S.best), fridge: Object.assign({}, S.fridge), pantry: Object.assign({}, S.pantry), crops: JSON.parse(JSON.stringify(S.crops)), beg: begPose, game: gdbg && S.mode === 'game' ? Object.assign({}, gdbg) : null }; }
    };
  }

  window.PawKitchen = {
    RECIPES: RECIPES, PANTRY: PANTRY, PEOPLE_FOOD: PEOPLE_FOOD, FAV: FAV,
    NOTES: NOTES, CROP_NAMES: CROP_NAMES,
    match: match, hint: hint, dishStars: dishStars,
    safety: safety, canCook: canCook, experiment: experiment,
    zoneWidth: zoneWidth, stepScore: stepScore, cookStars: cookStars,
    effectFor: effectFor, effectText: effectText, takeIngredients: takeIngredients,
    open: function (el, o) {
      try { return open(el, o); }
      catch (e) {
        try { console.warn('PawKitchen.open failed', e); } catch (er) { /* ignore */ }
        return { close: function () { try { if (o && o.onClose) o.onClose(); } catch (er) { /* ignore */ } }, update: noop };
      }
    }
  };
})();
