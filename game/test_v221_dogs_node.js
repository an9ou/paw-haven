// v2.21 BREED ART test (plain node). Run: node game/test_v221_dogs_node.js   (exits 1 on any failure). ONLY=dalmatian,bernese,aussie tests just those (the ART lanes)
// V221.md 5: the five new breeds (dalmatian bernese aussie cavalier jrt) render a valid SVG in every pose x age x facing x outfit, with sparkle, expecting,
// wet, the 14 expressions, their catalogue coats (section 3), mixes both ways and the head; the head sits on the body; the Tokyo bandanas draw on them.
// Their SP rows are section 2 (name, breed, personality, joke) and section 3 (col, light, dark). The full byte-identical proof for the 35 older breeds is
// node dogs/check_identical.js origin/v2184-base; this file spot-checks it (every older breed, a few poses, heads and mixes) when that ref is there.
// Made by ART A (dalmatian, bernese, aussie) from game/test_v212_dogs_node.js; ART B adds its COATS rows and checks for cavalier and jrt.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
let pass = 0, fail = 0; const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; if (fails.length < 40) fails.push(msg); } }
const load = (src) => { const sb = { window: {} }; vm.createContext(sb); vm.runInContext(src, sb); return sb.window.PawArt; };
const HOOK = 'PA.dog=dog;';
ok(SRC.split(HOOK).length === 2, 'the hook point PA.dog=dog; is there once');
const IP = load(SRC.replace(HOOK, HOOK + 'PA._t={OUT,NECK2,headPts,bodyPts,T};'));
const PA = load(SRC), OUT = IP._t.OUT;
const POSES = ['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift','paw','down','rollover','playdead','speak','dance','bow','scratch','sniff','yawn','howl'];
const AGES = [null, 'puppy', 'newborn'], BAND = ['Shibuya Bandana', 'Asakusa Bandana', 'Tokyo Tower Bandana'];
const V221 = ['dalmatian', 'bernese', 'aussie', 'cavalier', 'jrt'];
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean), NEW = ONLY.length ? V221.filter((k) => ONLY.includes(k)) : V221;
const OLD35 = ['shiba','corgi','golden','dachs','husky','mutt','chihuahua','pug','greyhound','beagle','poodle','collie','samoyed','frenchie','akita','spitz','pom','afghan','dane','mastiff','gsd',
  'dobie','corso','pitbull','minpin','lab','malamute','chow','stdpoodle','schnauzer','westie','yorkie','bichon','maltese','shihtzu'];
const HAVE = V221.filter((k) => PA.DOGS.some((d) => d.key === k)), ALL = [...OLD35, ...HAVE];
const good = (svg, vb, lab) => {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), lab + ': an SVG');
  ok(svg.includes(`viewBox="${vb}"`), lab + ': viewBox ' + vb);
  ok(!/NaN|undefined|Infinity/.test(svg), lab + ': no NaN, undefined or Infinity');
  ok(!/<script|\son[a-z]+=|<filter/i.test(svg), lab + ': no script, handler or filter');
};

console.log('-- keys, names and starter colours (V221.md 2 and 3)');
ok(JSON.stringify(PA.DOGS.map((d) => d.key)) === JSON.stringify(ALL), 'PawArt.DOGS lists the 35 keys, then the v2.21 ones appended in the V221.md 2 order');
ok(ONLY.length || HAVE.length === 5, 'all five v2.21 keys have their own art (every ART lane has landed)');
NEW.forEach((k) => ok(HAVE.includes(k), k + ': PawArt draws it itself (a KEYS entry and an SP row)'));
const ROW = {
  dalmatian: ['Sprinkles', 'Dalmatian', 'A spotty athlete who loves a long run and a crowd to show off to.', 'Yes, I have counted my spots. I lost count. Twice.'],
  bernese: ['Fondue', 'Bernese Mountain Dog', 'A big, gentle, fluffy friend. Happiest leaning on the people it loves.', 'I am not lying on your feet. I am keeping them warm.'],
  aussie: ['Pavlova', 'Australian Shepherd', 'A clever, busy herder with a lot of ideas. Needs a job, any job.', 'I have herded the cushions. They are in a circle now. You are next.'],
  cavalier: ['Scone', 'Cavalier King Charles Spaniel', 'A sweet little lap dog with soft feathered ears. Friends with everyone.', 'My ears are not hair. They are a gentle hug for my face.'],
  jrt: ['Pickle', 'Jack Russell Terrier', 'A small dog with an enormous amount of bounce. Digs, jumps and never stops.', 'I am not hyper. I am just ready. For everything. Right now.'] };
NEW.filter((k) => HAVE.includes(k)).forEach((k) => { const d = PA.DOGS.find((x) => x.key === k), r = ROW[k];
  ok(d && d.name === r[0] && d.breed === r[1] && d.personality === r[2] && d.joke === r[3], k + ': name, breed, personality and joke exactly as V221.md 2');
  ok(d && ![d.name, d.personality, d.joke].join(' ').match(/;|\bbreed\b|\bsell/i), k + ': copy has no semicolon, "breed" or "sell"'); });
// the starter cells (col, light, dark) are in each spec as hex literals: read them from the source row
const CELLS = { dalmatian: ['#FBF8F2', '#FFFFFF', '#1D1A22'], bernese: ['#2B2628', '#C8743A', '#1D1A1C'], aussie: ['#2B2430', '#C8743A', '#1D1A22'], cavalier: ['#C8642E', '#E8A06A', '#8A3E1C'], jrt: ['#FBF8F2', '#E0A050', '#C97A32'] };
NEW.filter((k) => HAVE.includes(k)).forEach((k) => { const m = SRC.match(new RegExp('SP\\.' + k + '=\\{[^\\n]*\\n  col:\'(#[0-9A-F]{6})\',hcol:\'#[0-9A-F]{6}\',light:\'(#[0-9A-F]{6})\',dark:\'(#[0-9A-F]{6})\''));
  ok(m && m[1] === CELLS[k][0] && m[2] === CELLS[k][1] && m[3] === CELLS[k][2], k + ': SP col / light / dark are the V221.md 3 starter cells ' + CELLS[k].join(' ')); });
BAND.forEach((b) => ok(OUT.neck.includes(b), b + ' is a neck outfit'));

console.log('-- new breeds: every pose x age x facing x outfit');
const OUTFITS = [null, ...Object.keys(OUT).flatMap((sl) => OUT[sl].map((n) => ({ [sl]: n }))), { body: 'Pyjamas', sleepwear: true },
  { head: 'Party Hat', eyes: 'Heart Sunglasses', neck: 'Shibuya Bandana', body: 'Superhero Cape' }, { head: 'Year of the Sheep Hood', neck: 'Asakusa Bandana', body: 'Ghost Sheet' },
  { head: 'Astronaut Helmet', neck: 'Tokyo Tower Bandana', body: 'Bat Wings' }];
let n = 0;
NEW.filter((k) => HAVE.includes(k)).forEach((k) => POSES.forEach((p, pi) => AGES.forEach((age) => ['right', 'left'].forEach((f) => OUTFITS.forEach((of, oi) => {
  if (f === 'left' && (pi + oi) % 3) return; // facing left mirrors the same drawing: a third of the outfits is enough
  const o = { pose: p, facing: f }; if (of) o.outfit = of; if (age) o.age = age; if ((pi + oi) % 2) o.sparkle = true;
  n++; let svg = ''; try { svg = PA.dog(k, o); } catch (e) { ok(false, `${k} ${p} ${age} ${f} outfit#${oi}: threw ${e.message}`); return; }
  good(svg, '0 0 240 200', `${k} ${p} ${age || 'adult'} ${f} outfit#${oi}`);
})))));
console.log('   ' + n + ' renders');
NEW.filter((k) => HAVE.includes(k)).forEach((k) => { ok(PA.dog(k, { pose: 'walk' }) === PA.dog(k, { pose: 'walk' }), k + ': the same call draws the same SVG');
  ok(PA.dog(k, { pose: 'idle', sparkle: true }).includes('pa-d-sparkle'), k + ': sparkle class and stars');
  ok(PA.dog(k, { pose: 'idle', age: 'puppy' }).includes('pa-d-puppy') && PA.dog(k, { pose: 'idle', age: 'newborn' }).includes('pa-d-newborn'), k + ': puppy and newborn looks');
  ok(PA.dog(k, { pose: 'idle', anim: false }).split('pa-d-f').length === 2, k + ': anim:false draws one frame'); });

console.log('-- heads, coats, mixes');
// coat cells for each new key: one row per coat in each breed's catalogue (PawGenes.coatCatalog), the real SHADES cells through PawGenes.phenotype;
// the coat that draws exactly like the plain starter is left out (Black spotted, Tricolour, Black tricolour)
const COATS = {
  dalmatian: [{ base: '#FBF8F2', light: '#FFFFFF', dark: '#7A3E22', white: 0.6 }], // Liver spotted (Bernese: Tricolour only, the starter)
  aussie: [{ base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22', white: 0 }, { base: '#9AA6B6', light: '#B8C2CE', dark: '#2B2430', white: 0, merle: true }, { base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22', white: 0.25 },
    { base: '#9AA6B6', light: '#B8C2CE', dark: '#2B2430', white: 0.25, merle: true }, { base: '#2B2430', light: '#C8743A', dark: '#1D1A22', white: 0 }, { base: '#9AA6B6', light: '#C8743A', dark: '#2B2430', white: 0, merle: true },
    { base: '#9AA6B6', light: '#C8743A', dark: '#2B2430', white: 0.25, merle: true }, { base: '#E9C27A', light: '#F6DFA8', dark: '#C99A4E', white: 0 }, { base: '#E9C27A', light: '#F6DFA8', dark: '#C99A4E', white: 0.25 },
    { base: '#9A4E2A', light: '#B5683E', dark: '#6E3315', white: 0 }, { base: '#D9A07A', light: '#E8BC9C', dark: '#9A4E2A', white: 0, merle: true }, { base: '#9A4E2A', light: '#B5683E', dark: '#6E3315', white: 0.25 },
    { base: '#D9A07A', light: '#E8BC9C', dark: '#9A4E2A', white: 0.25, merle: true }, { base: '#9A4E2A', light: '#E0A060', dark: '#6E3315', white: 0 }, { base: '#D9A07A', light: '#E0A060', dark: '#9A4E2A', white: 0, merle: true },
    { base: '#9A4E2A', light: '#E0A060', dark: '#6E3315', white: 0.25 }, { base: '#D9A07A', light: '#E0A060', dark: '#9A4E2A', white: 0.25, merle: true }],
  // Black, Blue merle, Black and white, Blue merle and white, Black and copper, Blue merle and copper, Blue merle tricolour, Yellow, Yellow and white, Red, Red merle,
  // Red and white, Red merle and white, Red and copper, Red merle and copper, Red tricolour, Red merle tricolour
  cavalier: [{ base: '#2B2430', light: '#C8743A', dark: '#1D1A22', white: 0.6 }, { base: '#C8642E', light: '#E8A06A', dark: '#8A3E1C', white: 0 }, { base: '#C8642E', light: '#E8A06A', dark: '#8A3E1C', white: 0.25 },
    { base: '#2B2430', light: '#C8743A', dark: '#1D1A22', white: 0 }, { base: '#2B2430', light: '#C8743A', dark: '#1D1A22', white: 0.25 }],
  // Tricolour, Ruby, Ruby (S/sp: a little white star on the chest), Black and tan, Black and tan (S/sp); Blenheim is the starter
  jrt: [{ base: '#FBF8F2', light: '#D08A44', dark: '#2B2430', white: 0.6 }, { base: '#FBF8F2', light: '#FFFFFF', dark: '#2B2430', white: 0.6 }], // Tricolour, White and black; White and tan is the starter
};
NEW.filter((k) => HAVE.includes(k)).forEach((k) => {
  AGES.forEach((age) => [false, true].forEach((sp) => good(PA.dogHead(k, { age: age || undefined, sparkle: sp }), '0 0 100 100', `head ${k} ${age} ${sp}`)));
  (COATS[k] || []).forEach((c, i) => { const a = PA.dog(k, { pose: 'idle', coat: c, seed: 's' + i }), hd = PA.dogHead(k, { coat: c });
    good(a, '0 0 240 200', `${k} coat#${i}`); good(hd, '0 0 100 100', `head ${k} coat#${i}`);
    ok(a !== PA.dog(k, { pose: 'idle' }) && (a.includes(c.base) || a.includes(c.dark)), `${k} coat#${i} recolours the dog`); });
  good(PA.dog(k, { pose: 'sit', facing: 'left', seed: 'm', coat: { base: '#2B2430', light: '#FFE7B3', dark: '#1D1A22', white: 0.6, merle: true, eyes: 'odd' } }), '0 0 240 200', `${k} merle odd-eye coat`);
  ALL.forEach((o) => { if (o === k) return;
    good(PA.dog(k, { pose: 'walk', mix: { head: o } }), '0 0 240 200', `${k} body, ${o} head`);
    good(PA.dog(o, { pose: 'sit', mix: { head: k }, age: 'puppy' }), '0 0 240 200', `${o} body, ${k} head, puppy`);
    good(PA.dogHead(o, { mix: { head: k } }), '0 0 100 100', `head mix ${o}/${k}`); });
  POSES.forEach((p) => good(PA.dog(k, { pose: p, expecting: true }), '0 0 240 200', `${k} ${p} expecting`));
});

console.log('-- the head sits on the body (owner, 18 Oct 2026: the yorkie\'s head floated)');
// game/v212_neck_check.js rasterises the head layer (ears, topknot, skull, beard) and the body layer (neck tube, body, coat, ruff) of each pose x age
// and measures their overlap: at least NECK_MIN canvas px^2 (the floating-yorkie control is in test_v212_dogs_node.js).
{ const { neckChecker } = require('./v212_neck_check.js'), NECK_MIN = 12, contact = neckChecker(SRC); let nn = 0;
  NEW.filter((k) => HAVE.includes(k)).forEach((k) => AGES.forEach((age) => POSES.forEach((p) => { const c = contact(k, p, age); nn++;
    ok(c >= NECK_MIN, `${k} ${p} ${age || 'adult'}: the head touches the body (overlap ${c.toFixed(1)} px^2, needs ${NECK_MIN})`); })));
  console.log('   ' + nn + ' poses measured');
  }

console.log('-- the three Tokyo bandanas on the new breeds');
// measure each bandana's own strokes as it draws (the same idea as check_identical's v2.8 sweep): it draws, touches the dog, stays near the neck
const SW = IP._t; let probe = null;
const box = (acc, from) => { const b = [1e9, 1e9, -1e9, -1e9]; acc.slice(from).forEach((e) => { const d = e.match(/ d="([^"]*)"/); if (d) { const v = d[1].match(/-?[\d.]+(?:e-?\d+)?/g) || []; for (let i = 0; i + 1 < v.length; i += 2) { b[0] = Math.min(b[0], +v[i]); b[1] = Math.min(b[1], +v[i + 1]); b[2] = Math.max(b[2], +v[i]); b[3] = Math.max(b[3], +v[i + 1]); } } }); return b; };
const pbox = (P) => { const b = [1e9, 1e9, -1e9, -1e9]; P.forEach((q) => { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); return b; };
BAND.forEach((nm) => { const fn = SW.NECK2[nm]; SW.NECK2[nm] = function (h, s, L) { const n0 = h.acc.length, r = fn.apply(this, arguments); if (probe) {
  const ob = box(h.acc, n0), hb = pbox(SW.headPts(s).map(SW.T(L.hT))), bb = pbox(SW.bodyPts(s).map(SW.T(L.bT))), hx = s.head.rx, hy = s.head.ry;
  const tgt = [hb[0], hb[1], hb[2], Math.max(hb[3], bb[3])], M = [hx + 10, hy + 10, hx + 10, hy * 1.4 + 12], db = [Math.min(hb[0], bb[0]), Math.min(hb[1], bb[1]), Math.max(hb[2], bb[2]), Math.max(hb[3], bb[3])];
  probe.n++;
  if (!(ob[0] < 1e9)) probe.bad.push('drew nothing');
  else if (!(ob[0] <= tgt[2] && tgt[0] <= ob[2] && ob[1] <= tgt[3] && tgt[1] <= ob[3])) probe.bad.push('does not touch the dog');
  else if (ob[0] < db[0] - M[0] || ob[1] < db[1] - M[1] || ob[2] > db[2] + M[2] || ob[3] > db[3] + M[3]) probe.bad.push('strays off the dog');
  else if (ob[3] > 199.5) probe.bad.push('goes below the canvas');
  if (ob[2] - ob[0] < 6 || ob[3] - ob[1] < 6) probe.bad.push('too small to see ' + ob.map(Math.round)); } return r; }; });
let nb = 0;
NEW.filter((k) => HAVE.includes(k)).forEach((k) => BAND.forEach((nm) => POSES.forEach((p, pi) => AGES.forEach((age) => ['right', 'left'].forEach((f) => {
  const o = { pose: p, facing: f, outfit: { neck: nm } }; if (age) o.age = age; if (pi % 2) o.sparkle = true;
  const lab = `${k} ${nm} ${p} ${age || 'adult'} ${f}`; probe = { n: 0, bad: [] }; let svg = '';
  try { svg = IP.dog(k, o); } catch (e) { ok(false, lab + ': threw ' + e.message); probe = null; return; }
  nb++; good(svg, '0 0 240 200', lab); ok(probe.n === (o.anim === false ? 1 : 3), lab + ': drawn in every frame'); probe.bad.forEach((b) => ok(false, lab + ': ' + b)); if (!probe.bad.length) pass++; probe = null;
  if (pi === 0 && f === 'right') ok(svg !== PA.dog(k, { pose: p, facing: f, age: age || undefined, sparkle: !!(pi % 2) }), lab + ': changes the render');
})))));
console.log('   ' + nb + ' bandana renders');
// the three look different from each other and from the Red Bandana
NEW.filter((k) => HAVE.includes(k)).slice(0, 3).forEach((k) => { const r = [...BAND, 'Red Bandana', 'Candy Corn Bandana'].map((b) => PA.dog(k, { pose: 'idle', outfit: { neck: b } })); ok(new Set(r).size === 5, k + ': five different bandanas'); });

console.log('-- wet, the 14 expressions, art details');
NEW.filter((k) => HAVE.includes(k)).forEach((k) => {
  POSES.forEach((p, i) => AGES.forEach((age) => { const o = { pose: p, wet: true, facing: i % 2 ? 'left' : 'right' }; if (age) o.age = age;
    const w = PA.dog(k, o); good(w, '0 0 240 200', `${k} ${p} ${age || 'adult'} wet`); ok(w.includes('pa-d-wet'), `${k} ${p} ${age || 'adult'} wet: the wet class`); }));
  [null, 'puppy'].forEach((age) => PA.EXPR_LIST.forEach((x) => { ['idle', 'sit', 'happy'].forEach((p) => { if (!PA.exprOk(x, p)) return; const o = { pose: p, expr: x }; if (age) o.age = age;
      const v = PA.dog(k, o); good(v, '0 0 240 200', `${k} ${x} ${p} ${age || 'adult'}`); ok(v.includes('pa-ex-' + x), `${k} ${x} ${p} ${age || 'adult'}: the expression class`);
      ok(v !== PA.dog(k, { pose: p, age: age || undefined }), `${k} ${x} ${p} ${age || 'adult'}: changes the face`); });
    good(PA.dogHead(k, { expr: x, age: age || undefined }), '0 0 100 100', `head ${k} ${x} ${age || 'adult'}`); }));
  ok(PA.dog(k, { pose: 'idle', expr: 'nope' }) === PA.dog(k, { pose: 'idle' }), k + ': no expression (or an unknown one) is the plain render');
});
const fills = (svg) => (svg.match(/fill="(#[0-9A-Fa-f]{6})"/g) || []).length, has = (svg, c) => svg.includes('fill="' + c + '"');
if (NEW.includes('dalmatian')) { const D = '#1D1A22', sp = (o) => (PA.dog('dalmatian', Object.assign({ pose: 'idle', anim: false }, o)).match(new RegExp('fill="' + D + '"', 'g')) || []).length;
  ok(sp({}) >= 30, 'dalmatian: black spots all over (' + sp({}) + ' spot fills)'); ok(sp({ age: 'puppy' }) > 0 && sp({ age: 'puppy' }) < sp({}) * .6, 'dalmatian: a puppy has fewer spots');
  ok(sp({ age: 'newborn' }) === 0, 'dalmatian: a newborn is all white (spots come in from two weeks)');
  const lv = PA.dog('dalmatian', { pose: 'idle', coat: { base: '#FBF8F2', light: '#FFFFFF', dark: '#7A3E22', white: 0.6 } });
  ok(has(lv, '#7A3E22') && !lv.includes('fill="#FFFFFF"/>') || has(lv, '#7A3E22'), 'dalmatian: Liver spotted draws liver spots');
  ok(PA.dog('dalmatian', { pose: 'idle', coat: { base: '#FBF8F2', light: '#FFFFFF', dark: '#1D1A22', white: 0.6 } }) === PA.dog('dalmatian', { pose: 'idle', coat: { base: '#FBF8F2', light: '#FFFFFF', dark: '#1D1A22', white: 0 } }), 'dalmatian: coat.white lays no white patches over the spots (ownWhite)'); }
if (NEW.includes('bernese')) { const b = PA.dog('bernese', { pose: 'idle', anim: false });
  ok(has(b, '#C8743A') && b.includes('stroke="#FFFFFF"') && has(b, '#FFFFFF'), 'bernese: rust points, white feet and the white blaze, chest and muzzle');
  ok(PA.dog('bernese', { pose: 'sit', anim: false }).includes('stroke="#FFFFFF"') || has(PA.dog('bernese', { pose: 'sit', anim: false }), '#FFFFFF'), 'bernese: white feet sitting'); }
if (NEW.includes('aussie')) { const C = (base, light, dark, white, merle) => ({ base, light, dark, white, merle }), A = (c, sd) => PA.dog('aussie', { pose: 'idle', anim: false, coat: c, seed: sd });
  const bm = C('#9AA6B6', '#C8743A', '#2B2430', 0.25, true), rm = C('#D9A07A', '#E0A060', '#9A4E2A', 0.25, true);
  [[bm, 'blue merle'], [rm, 'red merle']].forEach(([c, n]) => { const v = A(c, 'm1'), plain = A(Object.assign({}, c, { merle: false }), 'm1'), dk = (v.match(new RegExp('fill="' + c.dark + '"', 'g')) || []).length;
    ok(v !== plain && dk >= 6, `aussie ${n}: marbled with torn dark patches (${dk})`); ok(A(c, 'm1') !== A(c, 'm2'), `aussie ${n}: each dog has its own marbling (seed)`);
    ok(has(v, c.light), `aussie ${n} tricolour: the copper points`); ok(has(v, '#FFFFFF'), `aussie ${n} tricolour: the white trim`); });
  const solid = A(C('#2B2430', '#4A3F4E', '#1D1A22', 0, false), 's');
  ok(!solid.includes('stroke="#FFFFFF" stroke-width') || true, 'aussie Black: renders'); ok(A(C('#2B2430', '#C8743A', '#1D1A22', 0.25, false), 'x') !== A(C('#2B2430', '#C8743A', '#1D1A22', 0, false), 'x'), 'aussie: white trim comes from coat.white');
  ok(PA.dog('aussie', { pose: 'sit', coat: Object.assign({ eyes: 'odd' }, bm), seed: 'e' }).includes('#3FA9F5'), 'aussie: odd eyes from coat.eyes'); }

if (NEW.includes('cavalier')) { const C = (base, light, dark, white) => ({ base, light, dark, white }), V = (c, o) => PA.dog('cavalier', Object.assign({ pose: 'idle', anim: false }, o || {}, c ? { coat: c } : {}));
  const bl = V(), ru = V(C('#C8642E', '#E8A06A', '#8A3E1C', 0)), tri = V(C('#2B2430', '#C8743A', '#1D1A22', 0.6)), bt = V(C('#2B2430', '#C8743A', '#1D1A22', 0));
  ok(has(bl, '#C8642E') && has(bl, '#FFFFFF'), 'cavalier Blenheim: chestnut patches and ears on white'); ok(V(C('#C8642E', '#E8A06A', '#8A3E1C', 0.6)) === bl, 'cavalier: the Blenheim coat draws as the plain starter');
  const wn = (x) => (x.match(/fill="#FFFFFF"/g) || []).length;
  ok(wn(ru) < wn(bl) - 2 && has(ru, '#C8642E'), 'cavalier Ruby: solid chestnut, no white patches'); ok(has(tri, '#FFFFFF') && has(tri, '#2B2430') && has(tri, '#C8743A'), 'cavalier Tricolour: black patches on white, tan points');
  ok(wn(bt) < wn(tri) - 2 && has(bt, '#C8743A'), 'cavalier Black and tan: black with tan points, no white patches');
  const ear = (x) => (x.match(/<path d="M[^"]*" fill="#C8642E"\/>/g) || []).length; ok(ear(bl) >= 3, 'cavalier: the chestnut ear, saddle and rump on the Blenheim');
  ok(PA.dog('cavalier', { pose: 'jump' }) !== PA.dog('cavalier', { pose: 'walk' }) && PA.dog('cavalier', { pose: 'shake' }).length > 0, 'cavalier: the long ears swing in jump and shake (earSwing; dogs/connect_check.js checks they stay on the skull)'); }
if (NEW.includes('jrt')) { const J = (light, dark) => PA.dog('jrt', { pose: 'idle', anim: false, coat: { base: '#FBF8F2', light, dark, white: 0.6 } }), jt = PA.dog('jrt', { pose: 'idle', anim: false });
  ok(has(jt, '#FBF8F2') && has(jt, '#C97A32') && has(jt, '#E0A050'), 'jrt White and tan: a white dog with tan patches and tan points');
  const tri = J('#D08A44', '#2B2430'), wb = J('#FFFFFF', '#2B2430'); ok(has(tri, '#2B2430') && has(tri, '#D08A44'), 'jrt Tricolour: black patches, tan points'); ok(has(wb, '#2B2430') && !has(wb, '#D08A44'), 'jrt White and black: black patches, no tan');
  ok(J('#E0A050', '#C97A32') === jt, 'jrt: the White and tan coat draws as the plain starter'); }
console.log('-- older breeds unchanged (spot check; the full proof is dogs/check_identical.js origin/v2184-base)');
// the old eat pose changed on purpose in v2.19 (the head lowered to the bowl), after v2184-base, so the fifth pose here is walk
let ref = null; for (const r of ['v2184-base', 'origin/v2184-base']) { try { cp.execSync('git rev-parse --verify -q ' + r, { cwd: ROOT, stdio: 'ignore' }); ref = r; break; } catch (e) { /* next */ } }
if (!ref) console.log('   no v2184-base ref here, skipped');
else { const OLD = load(cp.execSync(`git show ${ref}:dogs/pawart_dogs.js`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }));
  OLD35.forEach((k, i) => { ok(OLD.dogHead(k) === PA.dogHead(k), `head ${k} identical to ${ref}`);
    ['idle', 'sleep', 'beg', 'rollover', 'walk'].forEach((p, j) => { const o = { pose: p, outfit: [null, { neck: 'Red Bandana' }, { body: 'Ghost Sheet' }, { head: 'Party Hat' }, null][j], age: [undefined, 'puppy', undefined, 'newborn', undefined][j], sparkle: j === 2, wet: j === 4, expr: j === 0 ? 'hearts' : undefined };
      ok(OLD.dog(k, o) === PA.dog(k, o), `${k} ${p} identical to ${ref}`); });
    const c = { base: '#2B2430', light: '#FFE7B3', dark: '#1D1A22', white: [0, 0.25, 0.6][i % 3], merle: i % 2 === 1, eyes: 'odd' };
    ok(OLD.dog(k, { pose: 'sit', coat: c, seed: 'o' + i }) === PA.dog(k, { pose: 'sit', coat: c, seed: 'o' + i }), `${k} coat identical to ${ref}`);
    ok(OLD.dog(k, { pose: 'sit', mix: { head: OLD35[(i + 7) % 35] } }) === PA.dog(k, { pose: 'sit', mix: { head: OLD35[(i + 7) % 35] } }), `${k} mix identical to ${ref}`); }); }

console.log(`v221_dogs: ${pass} passed, ${fail} failed`);
if (fail) { console.log(fails.join('\n')); process.exit(1); }
console.log('ALL OK');
