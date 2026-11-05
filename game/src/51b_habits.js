/* ======================= v2.22 "Town levels and dog habits": part D, the habits (V222.md section 4) =======================
   One habit per Bond level, the same ten categories for every dog (hb.cat.1-10). The line comes from the dog's breed personality
   (36_personality.js BREED_PERS via persOf, BREED_SIZE, 41_expressions.js BREED_FACES), so there is nothing to store and nothing to
   migrate per dog: a dog shows every habit up to its own Bond. Mixes read persOf (the body breed the roam engine already uses), and the
   Bond 10 secret comes from a seeded parent. Lines: data.hb_lines.<cat>.<band>, data.hb_secret.<key> (game/i18n/TABLES.txt).
   "Does it more" (hbOn(d, n) = lvOn() && Bond >= n) changes poses and roaming only, never stats, Bond, coins or timers. With lvOn off
   every helper here hands back exactly today's numbers and draws no extra random number.
   Shows: Journal > Profile (hbCardHTML), the Bond card (hbUnlocks + hbCardBox), the diary (hbBondUp, hbDiaryLines), the old players'
   letter (lvMailSend, 51_levels.js, with hbMailLines). Test hook: window.__paw.lv.hb. */

const HB_CATS = ['energy', 'spot', 'trait', 'ask', 'bath', 'ball', 'pack', 'face', 'sleep', 'secret']; // index + 1 = the Bond level
// the shared lines (V222.md 4.2). {name} is the dog's name
const HB_LINES = {
  energy: {
    calm: '{name} is a champion napper. A nap after a nap is a normal day.',
    mid: '{name} likes a bit of everything: a walk, a snack, a nap, repeat.',
    busy: '{name} has two speeds: go, and go faster. Naps happen in between.'
  },
  spot: {
    open: "{name}'s favourite spot is the open grass, with room to run.",
    shade: "{name}'s favourite spot is a cool patch of shade.",
    edge: "{name}'s favourite spot is along the fence, where the best smells are.",
    gate: "{name}'s favourite spot is by the gate, to see who comes and goes.",
    bowl: "{name}'s favourite spot is next to the food bowl. Just in case.",
    dig: "{name}'s favourite spot is the soft corner where the digging happens.",
    bed: "{name}'s favourite spot is the bed. Any bed. Most beds.",
    front: "{name}'s favourite spot is right at the front, close to you.",
    sun: "{name}'s favourite spot is the sunny patch. It moves, so {name} moves too."
  },
  trait: {
    aloof: '{name} loves you from a little distance. Sitting near you is a big hug.',
    beg: '{name} always knows where the food bowl is. And where you are. And the way between.',
    ball: '{name} would play ball all day. It comes back every time, a little wetter.',
    needy: '{name} needs a pet every few minutes. It is very important, says {name}.',
    chatty: '{name} talks. Woos, grumbles and little songs, mostly about dinner.',
    follow: '{name} likes to be where you are. Close by is the best place.',
    guard: '{name} keeps an eye on the gate. Every passing leaf gets a report.',
    lazy: '{name} is an expert at lying down. Sunny spots, soft spots, your spot.',
    burst: '{name} naps for ages, runs very fast for ten seconds, then naps again.',
    sniff: '{name} reads the news with that nose. Every smell is a new story.',
    polite: '{name} sits nicely and waits. Good manners, with a hopeful tail.',
    herd: '{name} keeps everyone together. Dogs, toys, and sometimes you.',
    smile: '{name} smiles. A real dog smile, with the corners of the mouth up.',
    cheeky: '{name} does a tiny bit of mischief, then looks at you, very pleased.',
    loyal: '{name} waits for you by the gate. Every single time.',
    show: '{name} likes an audience. A twirl, a pose, then a look to check you saw.',
    spin: '{name} spins in happy circles when you come home.',
    _: '{name} does things in a very {name} way.'
  },
  bath: {
    big: 'After every bath {name} does zoomies. Laps of the yard, ears flapping, no brakes.',
    some: 'After a bath {name} does one happy lap of the yard. Then a proud little sit.',
    rare: 'After a bath {name} does one slow lap of honour. It still counts.'
  },
  ball: {
    ball: '{name} brings the ball back every time, and drops it right on your foot.',
    keep: '{name} plays keep-away. The ball comes back, after a victory lap.',
    fast: '{name} is fast after a ball. Very fast. The ball barely lands.',
    slow: '{name} fetches at a gentle pace and stops to smell things on the way.',
    steady: '{name} is a steady fetcher. Throw, trot, bring, wag.'
  },
  pack: {
    herd: 'With other dogs, {name} keeps the group tidy and round.',
    tag: 'With other dogs, {name} tags along wherever the fun is.',
    near: 'With other dogs, {name} plays a bit, then checks back with you.',
    own: 'With other dogs, {name} is friendly from a polite distance.'
  },
  sleep: {
    belly: '{name} sleeps on the back, legs in the air, totally relaxed.',
    curl: '{name} sleeps curled into a tiny doughnut, nose tucked in.',
    sprawl: '{name} sleeps stretched out, taking up as much floor as possible.',
    side: '{name} sleeps flat on one side, paws twitching in a running dream.'
  }
};
// the Bond 10 secrets, one per breed (V222.md 4.4). An unknown key uses mutt
const HB_SECRET = {
  shiba: '{name} has one toy hidden somewhere secret. Nobody knows where. Not even the toy.',
  corgi: '{name} sploots: flat on the tummy, back legs out behind, like a little rug.',
  golden: '{name} brings you a present every morning. A sock, a leaf, once a very surprised slipper.',
  dachs: '{name} burrows under the blankets until only a nose shows. The best way to nap.',
  husky: '{name} sings along with the kettle. Every song is a duet.',
  mutt: '{name} has a little of every good dog in town in there. Mostly the best bits.',
  chihuahua: '{name} turns any blanket left on the sofa into a warm little tent.',
  pug: '{name} tilts that round head at every new sound. Left, right, left again.',
  greyhound: '{name} leans the whole long body against your legs. That is a greyhound hug.',
  beagle: '{name} gives a tiny aroo when a really good smell turns up. A nose report.',
  poodle: '{name} learns new things very fast. That includes where the treats live.',
  collie: '{name} stares at the toy in your hand without blinking. Ready. Set. Waiting.',
  samoyed: '{name} sheds a whole cloud of fluff every spring. Nearly enough for a second dog.',
  frenchie: '{name} can hear the snack cupboard open from the other side of the house.',
  akita: '{name} keeps very tidy, like a cat. Little licks on the paws after every meal.',
  spitz: '{name} comes home snow white after a muddy walk. Nobody knows how.',
  pom: '{name} has the heart of a lion and the size of a muffin.',
  afghan: '{name} stands in the wind so the long hair flows. On purpose. For the look.',
  dane: '{name} tries to sit on your lap. Most of the dog does not fit. {name} tries anyway.',
  mastiff: '{name} drools a little when dinner smells good. Keep a towel handy. It is love.',
  gsd: '{name} tilts the head at new words. The word walk makes both ears point at you.',
  dobie: '{name} is a big softie. A lean on your legs means: hold me, please.',
  corso: '{name} follows you from room to room, quietly. A big shadow with a waggy tail.',
  pitbull: '{name} would sleep under the covers every night, if allowed. Head on the pillow.',
  minpin: '{name} trots with high, proud steps, like a tiny show pony.',
  lab: '{name} thinks every puddle is a small lake, and every lake is for swimming.',
  malamute: '{name} digs a cool hole to lie in on warm days. A home-made bed.',
  chow: '{name} has a blue-black tongue. Perfectly healthy, and rare among dogs.',
  stdpoodle: '{name} loves water. Poodles were swimmers long ago, and {name} remembers.',
  schnauzer: '{name} gets a wet beard after every drink, then shares it with your knee.',
  westie: '{name} checks every hole on the walk, nose first, tail up like a flag.',
  yorkie: '{name} thinks the sofa cushion is a throne. It is, now.',
  bichon: '{name} does the bichon blitz: a sudden happy race round the room, then a sit.',
  maltese: '{name} sits on the softest cushion in the house and looks like a little cloud.',
  shihtzu: '{name} comes from a long line of palace dogs. The cushions can tell.',
  dalmatian: '{name} loves to trot beside anything with wheels. Carriage dogs remember.',
  bernese: '{name} would love to pull a little cart. Berners were farm helpers, and proud of it.',
  aussie: '{name} rounds up the toys every evening. They end up in one tidy pile.',
  cavalier: '{name} gazes at you like you are the best thing ever made. You might be.',
  jrt: '{name} can jump amazingly high for a small dog. Mostly to see over the fence.'
};
const HB = { bath: [], zooms: 0, zg: {} }; // bath: dogs bathed and not yet back in the yard ({ id, t }); zooms: bath zoomies run (tests)

/* ---------------- the switch and the bands ---------------- */
const hbBond = (d) => Math.max(1, Math.min(10, Math.floor(+(d && d.bond && d.bond.level)) || 1));
function hbOn(d, n) { return !!d && typeof lvOn === 'function' && lvOn() && hbBond(d) >= n; }
const hbMotionOff = () => document.documentElement.dataset.motion === 'off';
// the category name (literal keys, so the extractor finds them)
function hbCat(n) {
  switch (+n) {
    case 1: return tt('hb.cat.1', 'Energy');
    case 2: return tt('hb.cat.2', 'Favourite spot');
    case 3: return tt('hb.cat.3', 'Special habit');
    case 4: return tt('hb.cat.4', 'Asking for pets');
    case 5: return tt('hb.cat.5', 'Bath zoomies');
    case 6: return tt('hb.cat.6', 'Ball style');
    case 7: return tt('hb.cat.7', 'With other dogs');
    case 8: return tt('hb.cat.8', 'Best face');
    case 9: return tt('hb.cat.9', 'Sleeping style');
    default: return tt('hb.cat.10', 'A secret');
  }
}
// the dog's band for Bond level n (V222.md 4.1; 4.3 is the check). Mixes: persOf reads d.key, the body breed
function hbBand(d, n) {
  const p = persOf(d), t = p.trait || '';
  switch (+n) {
    case 1: return p.energy < 0.4 ? 'calm' : p.energy > 0.75 ? 'busy' : 'mid';
    case 2: { const s = (p.spots || [])[0]; return HB_LINES.spot[s] ? s : 'open'; }
    case 3: return HB_LINES.trait[t] && t !== '_' ? t : '_';
    case 5: return p.zoomies >= 0.6 || t === 'burst' ? 'big' : p.zoomies < 0.3 ? 'rare' : 'some';
    case 6: return t === 'ball' ? 'ball' : p.steal >= 0.25 ? 'keep' : p.ball >= 1.15 ? 'fast' : p.ball < 0.85 ? 'slow' : 'steady';
    case 7: return t === 'herd' ? 'herd' : p.follows >= 0.45 ? 'tag' : p.follows <= 0.15 ? 'own' : 'near';
    case 8: return hbFaceOf(d);
    case 9: return t === 'lazy' || t === 'burst' ? 'belly' : ({ small: 'curl', big: 'sprawl' })[BREED_SIZE[d && d.key]] || 'side';
    case 10: return hbSecretKey(d);
    default: return 'ask';
  }
}
function hbFaceOf(d) { const f = (BREED_FACES[d && d.key] || BREED_FACES.mutt || [])[0]; return f || 'hearts'; }
// the breed whose secret this dog has: a mix takes a seeded parent (stable across reloads), else its own key; an unknown key is a mutt
function hbSecretKey(d) {
  if (!d) return 'mutt';
  const m = d.mix, k = m && (m.a || m.b) ? ([m.a, m.b][hashId(d.id) % 2] || m.a || m.b || d.key) : d.key;
  return HB_SECRET[k] ? k : HB_SECRET[d.key] ? d.key : 'mutt';
}

/* ---------------- the lines ---------------- */
// the habit line for Bond level n, with the dog's name (4 and 8 wrap tables that are translated already: the ask lines and the face words)
function hbLine(d, n) {
  if (!d) return ''; const name = d.name || '', b = hbBand(d, n);
  switch (+n) {
    case 1: return tdata('hb_lines.energy.' + b, HB_LINES.energy[b], { name });
    case 2: return tdata('hb_lines.spot.' + b, HB_LINES.spot[b], { name });
    case 3: return tdata('hb_lines.trait.' + b, HB_LINES.trait[b], { name });
    case 4: { const has = !!(BREED_PERS[d.key] && BREED_PERS[d.key].ask), en = persOf(d).ask[0];
      return tt('hb.ask_lbl', '{name} asks for pets like this:', { name }) + ' ' + tdata((has ? 'breed_pers.' + d.key + '.ask.' : 'pers_def.ask.') + 0, en, { name, sex: d.sex === 'female' ? 'female' : 'male' }); }
    case 5: return tdata('hb_lines.bath.' + b, HB_LINES.bath[b], { name });
    case 6: return tdata('hb_lines.ball.' + b, HB_LINES.ball[b], { name });
    case 7: return tdata('hb_lines.pack.' + b, HB_LINES.pack[b], { name });
    case 8: return tt('hb.face_line', "{name}'s best face: {face}", { name, face: exWord(b) }); // the face word is translated already (ex_words)
    case 9: return tdata('hb_lines.sleep.' + b, HB_LINES.sleep[b], { name });
    default: { const s = tdata('hb_secret.' + b, HB_SECRET[b], { name });
      return b !== d.key && d.mix ? tt('hb.mix', 'From the {breed} side:', { breed: tbreed(b) }) + ' ' + s : s; }
  }
}
// the icon: the art lane's PawArt.LEVELS.habit (lvArt), else a plain doodle
function hbIcon(n) {
  const A = typeof lvArt === 'function' ? lvArt('habit', +n) : ''; if (A) return A;
  const k = { 1: 'paw', 4: 'heart', 7: 'paw', 9: 'note', 10: 'heart' }[n] || 'spark';
  return `<svg class="hb-fb" viewBox="-16 -16 32 32" aria-hidden="true">${doodle(k, 0, 0, 0.95)}</svg>`;
}

/* ---------------- where habits show ---------------- */
// the Bond card's list (unlocksFor, 00_core.js, with lvOn): "New habit: {cat}" for Bond 2-10
function hbUnlocks(L) { return L >= 2 && L <= 10 ? [tt('hb.new', 'New habit: {cat}', { cat: hbCat(L) })] : []; }
// the Bond card's box: the icon and the line for each level reached at once (maybeLevelUp; with the Bond 2 party it sits under the gift)
function hbCardBox(id, levels) {
  const d = typeof dogById === 'function' ? dogById(id) : null; if (!d || !lvOn()) return '';
  const ls = (levels || []).filter((l) => l >= 2 && l <= 10); if (!ls.length) return '';
  return `<div class="hb-news">${ls.map((l) => `<div class="hb-new" data-hb="${l}"><span class="hb-ic" aria-hidden="true">${hbIcon(l)}</span><span class="hb-tx"><b>${esc(hbCat(l))}</b><span class="hb-line">${esc(hbLine(d, l))}</span></span></div>`).join('')}</div>`;
}
// Journal > Profile: ten rows, the ones not reached yet muted with their Bond (Bond 1 is always shown). Not buttons
function hbCardHTML(d) {
  if (!d || !lvOn()) return '';
  const b = hbBond(d), rows = HB_CATS.map((c, i) => {
    const n = i + 1, on = n <= b, face = on && n === 8 && typeof exHeadSVG === 'function' ? `<span class="hb-face" aria-hidden="true">${exHeadSVG(d, hbFaceOf(d))}</span>` : '';
    return `<li class="hb-row${on ? '' : ' off'}" data-hb="${n}"><span class="hb-ic" aria-hidden="true">${hbIcon(n)}</span><span class="hb-tx"><b>${esc(hbCat(n))}</b>${on ? `<span class="hb-line">${esc(hbLine(d, n))}</span>` : `<span class="hb-lock">${esc(tt('hb.locked', 'at Bond {n}', { n }))}</span>`}</span>${face}</li>`;
  }).join('');
  return `<div class="jent pf-habits"><b>${esc(tt('hb.title', "{name}'s habits", { name: d.name }))}</b><ul class="hb-list">${rows}</ul></div>`;
}
// the diary: a Bond level reached today goes on today's page as "id:level" (00_core.js addBond's level loop). Only while lvOn
function hbBondUp(id, level) {
  if (!lvOn() || !S || !S.dd || level < 2 || level > 10 || typeof ddToday !== 'function') return;
  const p = ddToday(); if (!p) return; if (!Array.isArray(p.hb)) p.hb = [];
  const k = id + ':' + level; if (!p.hb.includes(k) && p.hb.length < 4) { p.hb.push(k); markDirty(); }
}
// the page's habit lines (ddPageLines, 48_dogdays.js): the Bond 10 secret is the line itself that day
function hbDiaryLines(p) {
  return (Array.isArray(p && p.hb) ? p.hb : []).map((k) => {
    const i = String(k).lastIndexOf(':'), id = String(k).slice(0, i), l = +String(k).slice(i + 1), d = typeof dogById === 'function' ? dogById(id) : null;
    if (!(l >= 2 && l <= 10)) return '';
    if (l === 10 && d) return hbLine(d, 10);
    return tt('hb.diary', 'Found out something new about {name}: {cat}.', { name: d ? d.name : p.n, cat: hbCat(l) });
  }).filter(Boolean);
}
// the old players' letter (lvMailSend, 51_levels.js): each dog's newest habit so far (Bond 1-9; the secret waits in the Profile)
function hbMailLines(dogs) { return (dogs || []).slice(0, 4).map((d) => hbLine(d, Math.min(9, hbBond(d)))).filter(Boolean); }

/* ---------------- "does it more" (V222.md 4.1; off: exactly today's numbers, no extra Math.random) ---------------- */
// Bond 2: a wander picks the favourite spot kind 35 % of the time (rmPackAct, grAct and the leader's roam)
function hbLike(d) { return hbOn(d, 2) && Math.random() < 0.35 ? { like: [(persOf(d).spots || ['open'])[0]] } : undefined; }
// Bond 3: the trait's own weight x1.5 (rmPackAct and grAct): the kinds each trait drives
const HB_TRAIT_W = { sniff: ['sniff'], herd: ['herd'], guard: ['guard', 'patrol'], beg: ['beg'], needy: ['dig'], follow: ['front'], polite: ['front'], loyal: ['loyal', 'patrol'], show: ['show', 'front'], spin: ['spin'], aloof: ['patrol'], lazy: ['rest'] };
function hbTraitW(d, w, p) {
  if (!hbOn(d, 3) || !w) return w; const t = (p || persOf(d)).trait;
  (HB_TRAIT_W[t] || []).forEach((k) => { if (!(k in w)) return; if (k === 'rest') w.rest += 0.5; else w[k] *= 1.5; }); // lazy: its +1 on rest becomes +1.5
  if (t === 'burst' && packPose[d.id] === 'sleep' && 'zoomies' in w) w.zoomies += 1.5; // the burst: +3 becomes +4.5
  return w;
}
const hbChatP = (d) => (hbOn(d, 3) ? 0.5 : 0.35); // the chatty bark chance
// Bond 3 (ball, smile, cheeky: one more happy pose) and Bond 9 (one more sleep while Energy is under 60) in the pack idle pool
function hbPool(d, pool) {
  if (!hbOn(d, 3) || !pool) return pool; const t = persOf(d).trait;
  if (['ball', 'smile', 'cheeky'].includes(t)) pool.push('happy');
  if (hbOn(d, 9) && d.stats && d.stats.energy < 60) pool.push('sleep');
  return pool;
}
// Bond 4 attention x1.25, Bond 5 zoomies x1.2, Bond 7 follows x1.25 (2+ dogs); each capped at 1 (rmPers)
function hbPers(d, P) {
  if (!hbOn(d, 4)) return P; const cap = (v) => Math.min(1, v);
  P.attention = cap(P.attention * 1.25);
  if (hbOn(d, 5)) P.zoomies = cap(P.zoomies * 1.2);
  if (hbOn(d, 7) && S && S.dogs && S.dogs.length >= 2) P.follows = cap(P.follows * 1.25);
  return P;
}
const hbBallP = (d) => (hbOn(d, 6) ? 0.7 : 0.5); // Bond 6: the trait catch line chance (38_ball.js)
// Bond 8: the first favourite face gets one more entry in the pick (41_expressions.js exWeights)
function hbFace(d, l) { if (!hbOn(d, 8) || !l) return l; const x = l.find((e) => e[0] === hbFaceOf(d)); if (x) l.push([x[0], x[1]]); return l; }

/* ---------------- Bond 5: the bath zoomies, once per bath, never with Motion off ---------------- */
// a pack dog bathed (a pack bath's ids) runs one zoomies loop back in the yard (big: 2 loops, rare: 1 slow loop). The leader keeps
// today's idle zoomies after its bath (16_voices_idle.js bathZoomies)
function hbBathZoom(d) {
  if (!d || !hbOn(d, 5) || hbMotionOff() || !rmFree() || d === D() || d.sleeping) return false;
  const r = rmSt(d); if (r.fix || r.tw || r.q) return false;
  const b = hbBand(d, 5), p = rmPers(d), f = grOn() ? grFloor() : null, mk = () => (f ? grZoomSteps(d, p, f, b === 'rare') : rmZoomSteps(d, p, b === 'rare'));
  let steps = mk(); if (!steps) return false;
  if (b === 'big') { const s2 = mk(); if (s2) steps = steps.concat(s2); }
  packNext[d.id] = performance.now() + 20000; HB.zg[d.id] = packNext[d.id]; // a short guard (the loops take a few seconds); the next yard clears it if the queue was cut (V222 review)
  steps.push({ fn: () => { packNext[d.id] = performance.now() + RINT(3000, 7000) * IDLE.speed; } });
  rmQueue(d, steps); HB.zooms++; return true;
}
on('act', (a) => {
  if (!a || a.kind !== 'bath' || !S || !lvOn()) return;
  const ids = Array.isArray(a.ids) && a.ids.length ? a.ids : [S.activeId], now = performance.now();
  ids.forEach((id) => { if (!HB.bath.some((x) => x.id === id)) HB.bath.push({ id, t: now }); });
});
on('yard:enter', () => {
  Object.keys(HB.zg).forEach((id) => { if (packNext[id] === HB.zg[id]) packNext[id] = 0; }); HB.zg = {};
  const now = performance.now(), l = HB.bath.filter((b) => now - b.t < 30000); HB.bath = []; // once per bath: a bath left for elsewhere is old news
  if (!l.length || !S || !lvOn() || hbMotionOff()) return;
  l.forEach((b, i) => { let n = 0;
    const go = () => { const d = dogById(b.id); if (!S || cur.mode !== 'yard' || !d || d === D() || !hbOn(d, 5) || hbMotionOff()) return; if (!hbBathZoom(d) && n++ < 24) setTimeout(go, 250); }; // up to about 6 s
    setTimeout(go, 900 + i * 500); });
});

/* ---------------- tests: window.__paw.lv.hb (V222.md 7.1) ---------------- */
function hbHook() {
  const dog = (x) => (x && typeof x === 'object' ? x : dogById(x) || D());
  return {
    line: (d, n) => hbLine(dog(d), n), card: (d) => hbCardHTML(dog(d)), cat: (n) => hbCat(n), band: (d, n) => hbBand(dog(d), n),
    bands: (d) => { const g = dog(d); return HB_CATS.map((c, i) => hbBand(g, i + 1)); }, secret: (d) => hbSecretKey(dog(d)), on: (d, n) => hbOn(dog(d), n),
    weights: (d) => { const g = dog(d), p = rmPers(g), out = outdoorsNow(), os = S.dogs.filter((o) => o !== g); return { rm: hbTraitW(g, rmPackW(g, p, out), p), gr: hbTraitW(g, grActW(g, p, out, os, null, 1), p), p: Object.assign({}, p) }; },
    like: (d) => hbLike(dog(d)), chat: (d) => hbChatP(dog(d)), ball: (d) => hbBallP(dog(d)), pool: (d, pool) => hbPool(dog(d), pool), face: (d, l) => hbFace(dog(d), l),
    bath: (d) => hbBathZoom(dog(d)), zooms: () => HB.zooms, pending: () => HB.bath.map((b) => b.id), unlocks: (L) => hbUnlocks(L), box: (id, ls) => hbCardBox(id, ls),
    diary: (p) => hbDiaryLines(p), mail: (ds) => hbMailLines(ds || S.dogs), CATS: HB_CATS.slice(), SECRETS: Object.keys(HB_SECRET)
  };
}
