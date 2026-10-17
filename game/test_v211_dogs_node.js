// v2.11 BREED ART test (plain node). Run: node game/test_v211_dogs_node.js   (exits 1 on any failure)
// V211.md 5.2: the three new breeds (akita, spitz, pom) render a valid SVG in every pose x age x facing x outfit, with sparkle,
// coats from genes, mixes both ways and the head; the three Tokyo bandanas draw on all 17 breeds in every pose, age and facing,
// touching the dog and staying near the neck. The full byte-identical proof for the 14 old breeds is node dogs/check_identical.js
// v211-base; this file spot-checks it (every old breed, a few poses) when that ref is there.
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
const AGES = [null, 'puppy', 'newborn'], NEW = ['akita', 'spitz', 'pom'], BAND = ['Shibuya Bandana', 'Asakusa Bandana', 'Tokyo Tower Bandana'];
const ALL = ['shiba','corgi','golden','dachs','husky','mutt','chihuahua','pug','greyhound','beagle','poodle','collie','samoyed','frenchie', ...NEW];
const good = (svg, vb, lab) => {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), lab + ': an SVG');
  ok(svg.includes(`viewBox="${vb}"`), lab + ': viewBox ' + vb);
  ok(!/NaN|undefined|Infinity/.test(svg), lab + ': no NaN, undefined or Infinity');
  ok(!/<script|\son[a-z]+=|<filter/i.test(svg), lab + ': no script, handler or filter');
};

console.log('-- keys and names');
ok(JSON.stringify(PA.DOGS.map((d) => d.key)) === JSON.stringify(ALL), 'PawArt.DOGS lists the 17 keys, akita spitz pom appended in order');
const BR = { akita: 'Akita', spitz: 'Japanese Spitz', pom: 'Pomeranian' };
NEW.forEach((k) => { const d = PA.DOGS.find((x) => x.key === k); ok(d && d.breed === BR[k] && d.name && d.personality && d.joke, k + ': name, breed, personality and joke');
  ok(d && ![d.name, d.personality, d.joke].join(' ').match(/;|\bbreed\b|\bsell/i), k + ': copy has no semicolon, "breed" or "sell"'); });
BAND.forEach((b) => ok(OUT.neck.includes(b), b + ' is a neck outfit'));

console.log('-- new breeds: every pose x age x facing x outfit');
const OUTFITS = [null, ...Object.keys(OUT).flatMap((sl) => OUT[sl].map((n) => ({ [sl]: n }))), { body: 'Pyjamas', sleepwear: true },
  { head: 'Party Hat', eyes: 'Heart Sunglasses', neck: 'Shibuya Bandana', body: 'Superhero Cape' }, { head: 'Year of the Sheep Hood', neck: 'Asakusa Bandana', body: 'Ghost Sheet' },
  { head: 'Astronaut Helmet', neck: 'Tokyo Tower Bandana', body: 'Bat Wings' }];
let n = 0;
NEW.forEach((k) => POSES.forEach((p, pi) => AGES.forEach((age) => ['right', 'left'].forEach((f) => OUTFITS.forEach((of, oi) => {
  if (f === 'left' && (pi + oi) % 3) return; // facing left mirrors the same drawing: a third of the outfits is enough
  const o = { pose: p, facing: f }; if (of) o.outfit = of; if (age) o.age = age; if ((pi + oi) % 2) o.sparkle = true;
  n++; let svg = ''; try { svg = PA.dog(k, o); } catch (e) { ok(false, `${k} ${p} ${age} ${f} outfit#${oi}: threw ${e.message}`); return; }
  good(svg, '0 0 240 200', `${k} ${p} ${age || 'adult'} ${f} outfit#${oi}`);
})))));
console.log('   ' + n + ' renders');
NEW.forEach((k) => { ok(PA.dog(k, { pose: 'walk' }) === PA.dog(k, { pose: 'walk' }), k + ': the same call draws the same SVG');
  ok(PA.dog(k, { pose: 'idle', sparkle: true }).includes('pa-d-sparkle'), k + ': sparkle class and stars');
  ok(PA.dog(k, { pose: 'idle', age: 'puppy' }).includes('pa-d-puppy') && PA.dog(k, { pose: 'idle', age: 'newborn' }).includes('pa-d-newborn'), k + ': puppy and newborn looks');
  ok(PA.dog(k, { pose: 'idle', anim: false }).split('pa-d-f').length === 2, k + ': anim:false draws one frame'); });

console.log('-- heads, coats, mixes');
const COATS = { akita: [{ base: '#D46E36', light: '#FFF4E2', dark: '#3A2E2E' }, { base: '#FBF6EC', light: '#FFFFFF', dark: '#E8DECB' }],
  spitz: [{ base: '#F4E8D0', light: '#FFFAF0', dark: '#DCCBA8' }],
  pom: [{ base: '#F4DDB0', light: '#FFF4E0', dark: '#D6B884' }, { base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22' }, { base: '#7A4A2E', light: '#9A6A4A', dark: '#5A3420' },
    { base: '#FBF6EC', light: '#FFFFFF', dark: '#E8DECB' }, { base: '#8A96A8', light: '#A9B4C4', dark: '#55657A' }, { base: '#F59A3C', light: '#FFD9A6', dark: '#C9701E', white: 0.7 }] };
NEW.forEach((k) => {
  AGES.forEach((age) => [false, true].forEach((sp) => good(PA.dogHead(k, { age: age || undefined, sparkle: sp }), '0 0 100 100', `head ${k} ${age} ${sp}`)));
  COATS[k].forEach((c, i) => { const a = PA.dog(k, { pose: 'idle', coat: c, seed: 's' + i }), hd = PA.dogHead(k, { coat: c });
    good(a, '0 0 240 200', `${k} coat#${i}`); good(hd, '0 0 100 100', `head ${k} coat#${i}`);
    ok(a !== PA.dog(k, { pose: 'idle' }) && a.includes(c.base), `${k} coat#${i} recolours the dog`); });
  good(PA.dog(k, { pose: 'sit', facing: 'left', seed: 'm', coat: { base: '#2B2430', light: '#FFE7B3', dark: '#1D1A22', white: 0.6, merle: true, eyes: 'odd' } }), '0 0 240 200', `${k} merle odd-eye coat`);
  ALL.forEach((o) => { if (o === k) return;
    good(PA.dog(k, { pose: 'walk', mix: { head: o } }), '0 0 240 200', `${k} body, ${o} head`);
    good(PA.dog(o, { pose: 'sit', mix: { head: k }, age: 'puppy' }), '0 0 240 200', `${o} body, ${k} head, puppy`);
    good(PA.dogHead(o, { mix: { head: k } }), '0 0 100 100', `head mix ${o}/${k}`); });
  POSES.forEach((p) => good(PA.dog(k, { pose: p, expecting: true }), '0 0 240 200', `${k} ${p} expecting`));
});

console.log('-- the three bandanas on all 17 breeds');
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
ALL.forEach((k) => BAND.forEach((nm) => POSES.forEach((p, pi) => AGES.forEach((age) => ['right', 'left'].forEach((f) => {
  const o = { pose: p, facing: f, outfit: { neck: nm } }; if (age) o.age = age; if (pi % 2) o.sparkle = true;
  const lab = `${k} ${nm} ${p} ${age || 'adult'} ${f}`; probe = { n: 0, bad: [] }; let svg = '';
  try { svg = IP.dog(k, o); } catch (e) { ok(false, lab + ': threw ' + e.message); probe = null; return; }
  nb++; good(svg, '0 0 240 200', lab); ok(probe.n === (o.anim === false ? 1 : 3), lab + ': drawn in every frame'); probe.bad.forEach((b) => ok(false, lab + ': ' + b)); if (!probe.bad.length) pass++; probe = null;
  if (pi === 0 && f === 'right') ok(svg !== PA.dog(k, { pose: p, facing: f, age: age || undefined, sparkle: !!(pi % 2) }), lab + ': changes the render');
})))));
console.log('   ' + nb + ' bandana renders');
// the three look different from each other and from the Red Bandana
['shiba', 'pom', 'greyhound'].forEach((k) => { const r = [...BAND, 'Red Bandana', 'Candy Corn Bandana'].map((b) => PA.dog(k, { pose: 'idle', outfit: { neck: b } })); ok(new Set(r).size === 5, k + ': five different bandanas'); });

console.log('-- old breeds unchanged (spot check; the full proof is dogs/check_identical.js v211-base)');
let ref = null; for (const r of ['v211-base', 'origin/v211-base']) { try { cp.execSync('git rev-parse --verify -q ' + r, { cwd: ROOT, stdio: 'ignore' }); ref = r; break; } catch (e) { /* next */ } }
if (!ref) console.log('   no v211-base ref here, skipped');
else { const OLD = load(cp.execSync(`git show ${ref}:dogs/pawart_dogs.js`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }));
  ALL.slice(0, 14).forEach((k) => { ok(OLD.dogHead(k) === PA.dogHead(k), `head ${k} identical to ${ref}`);
    ['idle', 'sleep', 'beg', 'rollover'].forEach((p, i) => { const o = { pose: p, outfit: [null, { neck: 'Red Bandana' }, { body: 'Ghost Sheet' }, { head: 'Party Hat' }][i], age: [undefined, 'puppy', undefined, 'newborn'][i], sparkle: i === 2 };
      ok(OLD.dog(k, o) === PA.dog(k, o), `${k} ${p} identical to ${ref}`); });
    ok(OLD.dog(k, { pose: 'walk', mix: { head: 'samoyed' } }) === PA.dog(k, { pose: 'walk', mix: { head: 'samoyed' } }), `${k} mix identical to ${ref}`); }); }

console.log(`v211_dogs: ${pass} passed, ${fail} failed`);
if (fail) { console.log(fails.join('\n')); process.exit(1); }
console.log('ALL OK');
