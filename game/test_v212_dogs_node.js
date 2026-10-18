// v2.12 BREED ART test (plain node). Run: node game/test_v212_dogs_node.js   (exits 1 on any failure). ONLY=dobie,corso tests just those (the ART lanes)
// V211.md 5.2: the seven new breeds (akita, spitz, pom, then afghan, dane, mastiff, gsd) render a valid SVG in every pose x age x facing x outfit, with sparkle,
// coats from genes, mixes both ways and the head; the three Tokyo bandanas draw on all 21 breeds in every pose, age and facing,
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
const AGES = [null, 'puppy', 'newborn'], BAND = ['Shibuya Bandana', 'Asakusa Bandana', 'Tokyo Tower Bandana'];
const V212 = ['dobie', 'corso', 'pitbull', 'minpin', 'lab', 'malamute', 'chow', 'stdpoodle', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'];
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean), NEW = ONLY.length ? V212.filter((k) => ONLY.includes(k)) : V212;
const OLD21 = ['shiba','corgi','golden','dachs','husky','mutt','chihuahua','pug','greyhound','beagle','poodle','collie','samoyed','frenchie','akita','spitz','pom','afghan','dane','mastiff','gsd'];
const ALL = [...OLD21, ...V212];
const good = (svg, vb, lab) => {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), lab + ': an SVG');
  ok(svg.includes(`viewBox="${vb}"`), lab + ': viewBox ' + vb);
  ok(!/NaN|undefined|Infinity/.test(svg), lab + ': no NaN, undefined or Infinity');
  ok(!/<script|\son[a-z]+=|<filter/i.test(svg), lab + ': no script, handler or filter');
};

console.log('-- keys and names');
ok(JSON.stringify(PA.DOGS.map((d) => d.key)) === JSON.stringify(ALL), 'PawArt.DOGS lists the 35 keys, the fourteen v2.12 ones appended in order');
ok(!SRC.includes('PLACEHOLDER') || ONLY.length, 'no PLACEHOLDER rows left (every ART lane has landed)');
const BR = { dobie: 'Doberman', corso: 'Cane Corso', pitbull: 'Pit Bull', minpin: 'Miniature Pinscher', lab: 'Labrador Retriever', malamute: 'Alaskan Malamute', chow: 'Chow Chow', stdpoodle: 'Standard Poodle', schnauzer: 'Miniature Schnauzer', westie: 'West Highland White Terrier', yorkie: 'Yorkshire Terrier', bichon: 'Bichon Frise', maltese: 'Maltese', shihtzu: 'Shih Tzu' };
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
// coat cells for each new key (the ART lanes fill their own rows from the GENES lane's SHADES; the merle odd-eye coat below runs for all)
const COATS = {
  // v2.12 numbers batch: one row per coat in each breed's catalogue (PawGenes.coatCatalog), the real SHADES cells through PawGenes.phenotype;
  // the coat that draws exactly like the plain starter is left out
  dobie: [{ base: '#7A3A22', light: '#C8743A', dark: '#4E2414', white: 0 }, { base: '#6C7484', light: '#C88250', dark: '#4A5262', white: 0 }, { base: '#B08A6A', light: '#D49A62', dark: '#7E6048', white: 0 }], // Red and rust, Blue and rust, Fawn and rust
  corso: [{ base: '#D2AE7A', light: '#E4C898', dark: '#2B2430', white: 0 }, { base: '#7A7E86', light: '#8E929A', dark: '#3E424A', white: 0 }, { base: '#6A5240', light: '#7E6450', dark: '#1D1A22', white: 0, brindle: true }, { base: '#C8B49A', light: '#DCCBB4', dark: '#55657A', white: 0 }, { base: '#B8683A', light: '#CC8452', dark: '#2B2430', white: 0 }, { base: '#8A8078', light: '#9E948A', dark: '#3E424A', white: 0, brindle: true }], // Fawn, Grey, Black brindle, Grey fawn, Red, Grey brindle
  pitbull: [{ base: '#2B2628', light: '#F2EEE6', dark: '#1D1A22', white: 0.25 }, { base: '#2B2628', light: '#F2EEE6', dark: '#1D1A22', white: 0 }, { base: '#D7B07E', light: '#F4E6CE', dark: '#9A7A52', white: 0.25 }, { base: '#D7B07E', light: '#F4E6CE', dark: '#9A7A52', white: 0 }, { base: '#2B2628', light: '#F2EEE6', dark: '#1D1A22', white: 0.6 }, { base: '#7E8898', light: '#F2EEE6', dark: '#4E5664', white: 0.25 }, { base: '#FBF6EC', light: '#FFFFFF', dark: '#E8DECB', white: 0.6 }, { base: '#B08A5E', light: '#F2E6D2', dark: '#3A2E2E', white: 0.25, brindle: true }, { base: '#B8A08E', light: '#E8DCCE', dark: '#7E7480', white: 0.25 }, { base: '#B08A5E', light: '#F2E6D2', dark: '#3A2E2E', white: 0, brindle: true }, { base: '#B8A08E', light: '#E8DCCE', dark: '#7E7480', white: 0 }, { base: '#7E8898', light: '#F2EEE6', dark: '#4E5664', white: 0.6 }, { base: '#B8683A', light: '#F2E2CC', dark: '#7E4224', white: 0.25 }, { base: '#B8683A', light: '#F2E2CC', dark: '#7E4224', white: 0 }, { base: '#B08A5E', light: '#F2E6D2', dark: '#3A2E2E', white: 0.6, brindle: true }, { base: '#8E8A90', light: '#EEEAE4', dark: '#4A5060', white: 0.25, brindle: true }, { base: '#8E8A90', light: '#EEEAE4', dark: '#4A5060', white: 0, brindle: true }, { base: '#8E8A90', light: '#EEEAE4', dark: '#4A5060', white: 0.6, brindle: true }], // Black with white markings, Black, Fawn with white markings, Fawn, Pied, Blue with white markings, White, Brindle with white markings, Blue fawn with white markings, Brindle, Blue fawn, Blue pied, Red with white markings, Red, Brindle pied, Blue brindle with white markings, Blue brindle, Blue brindle pied
  minpin: [{ base: '#2B2628', light: '#C8743A', dark: '#1D1A22', white: 0 }, { base: '#5E3424', light: '#C8743A', dark: '#3E2216', white: 0 }], // Black and rust, Chocolate and rust
  lab: [{ base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22', white: 0 }, { base: '#6E4430', light: '#8E5E40', dark: '#4E2E1E', white: 0 }], // Black, Chocolate
  malamute: [{ base: '#9A7A58', light: '#FFFFFF', dark: '#5E4632', white: 0 }, { base: '#3A3440', light: '#FFFFFF', dark: '#24202A', white: 0 }, { base: '#7E8CA2', light: '#FFFFFF', dark: '#5A6680', white: 0 }, { base: '#B8683A', light: '#FFFFFF', dark: '#8A4A26', white: 0 }, { base: '#FBF6EC', light: '#FFFFFF', dark: '#E8DECB', white: 0 }, { base: '#B8A8AA', light: '#FFFFFF', dark: '#928286', white: 0 }], // Sable and white, Black and white, Blue and white, Red and white, White, Silver and white
  chow: [{ base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22', white: 0 }, { base: '#F2E2C4', light: '#FFF8EC', dark: '#D9C29E', white: 0 }, { base: '#6E7F96', light: '#8C9BB0', dark: '#55657A', white: 0 }, { base: '#C8945E', light: '#E2B888', dark: '#9A6A3E', white: 0 }, { base: '#C4B0A0', light: '#DCCAB8', dark: '#A08C7C', white: 0 }], // Black, Cream, Blue, Cinnamon, Fawn
  stdpoodle: [{ base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22', white: 0.25 }, { base: '#B8582E', light: '#D47E52', dark: '#8A3E1C', white: 0 }, { base: '#F2C48F', light: '#FBE2C0', dark: '#D9A066', white: 0 }, { base: '#6E4430', light: '#8E5E40', dark: '#4E2E1E', white: 0 }, { base: '#A3AAB5', light: '#C6CBD2', dark: '#7F8794', white: 0 }, { base: '#B8582E', light: '#D47E52', dark: '#8A3E1C', white: 0.25 }, { base: '#F2C48F', light: '#FBE2C0', dark: '#D9A066', white: 0.25 }, { base: '#6E7F96', light: '#8C9BB0', dark: '#55657A', white: 0 }, { base: '#EFD8B0', light: '#FAEEDA', dark: '#D2B486', white: 0 }, { base: '#F7F1E6', light: '#FFFFFF', dark: '#E2D6C2', white: 0 }, { base: '#6E4430', light: '#8E5E40', dark: '#4E2E1E', white: 0.25 }, { base: '#2B2430', light: '#4A3F4E', dark: '#1D1A22', white: 0.6 }, { base: '#A3AAB5', light: '#C6CBD2', dark: '#7F8794', white: 0.25 }, { base: '#C4A486', light: '#DDC4AA', dark: '#A2846A', white: 0 }, { base: '#6E7F96', light: '#8C9BB0', dark: '#55657A', white: 0.25 }, { base: '#EFD8B0', light: '#FAEEDA', dark: '#D2B486', white: 0.25 }, { base: '#B8582E', light: '#D47E52', dark: '#8A3E1C', white: 0.6 }, { base: '#C4A486', light: '#DDC4AA', dark: '#A2846A', white: 0.25 }, { base: '#F2C48F', light: '#FBE2C0', dark: '#D9A066', white: 0.6 }, { base: '#6E4430', light: '#8E5E40', dark: '#4E2E1E', white: 0.6 }, { base: '#A3AAB5', light: '#C6CBD2', dark: '#7F8794', white: 0.6 }, { base: '#6E7F96', light: '#8C9BB0', dark: '#55657A', white: 0.6 }, { base: '#EFD8B0', light: '#FAEEDA', dark: '#D2B486', white: 0.6 }, { base: '#C4A486', light: '#DDC4AA', dark: '#A2846A', white: 0.6 }], // Black with white markings, Red, Apricot, Chocolate, Silver, Red with white markings, Apricot with white markings, Blue, Cream, White, Chocolate with white markings, Parti, Silver with white markings, Silver beige, Blue with white markings, Cream with white markings, Red parti, Silver beige with white markings, Apricot parti, Chocolate parti, Silver parti, Blue parti, Cream parti, Silver beige parti
  schnauzer: [{ base: '#2B2430', light: '#3A3240', dark: '#1D1A22', white: 0 }, { base: '#FBF8F2', light: '#FFFFFF', dark: '#E2D9CC', white: 0 }, { base: '#2B2430', light: '#D8D6D2', dark: '#1D1A22', white: 0 }], // Black, White, Black and silver
  westie: [{ base: '#F4EEDF', light: '#FFFFFF', dark: '#DCCFB8', white: 0 }], // always White: the cream cell only shows from a mix parent
  yorkie: [{ base: '#617389', light: '#D9A35C', dark: '#3E4A5E', white: 0.25 }, { base: '#2B2430', light: '#C98A4E', dark: '#1D1A22', white: 0 }, { base: '#2B2430', light: '#C98A4E', dark: '#1D1A22', white: 0.25 }, { base: '#617389', light: '#D9A35C', dark: '#3E4A5E', white: 0.6 }, { base: '#2B2430', light: '#C98A4E', dark: '#1D1A22', white: 0.6 }], // Blue and tan with white markings, Black and tan, Black and tan with white markings, Blue and tan parti, Parti
  bichon: [{ base: '#F3E2C2', light: '#FFF6E4', dark: '#D6BE94', white: 0 }, { base: '#F4E8D0', light: '#FFFAF0', dark: '#DCCBA8', white: 0 }], // Cream (b/b, the rare bonus), Cream (e/e d/d)
  maltese: [{ base: '#F4E8D0', light: '#FFFAF0', dark: '#DCCBA8', white: 0 }], // always White: the cream cell only shows from a mix parent
  shihtzu: [{ base: '#E0A458', light: '#FFFBF2', dark: '#9A6430', white: 0.25 }, { base: '#2B2628', light: '#FFFBF2', dark: '#1D1A1C', white: 0.25 }, { base: '#B07A45', light: '#FFFBF2', dark: '#3A2E2E', white: 0.25, brindle: true }, { base: '#E0A458', light: '#F2CA8E', dark: '#9A6430', white: 0 }, { base: '#2B2628', light: '#3A3436', dark: '#1D1A1C', white: 0 }, { base: '#8A4F33', light: '#FFFBF2', dark: '#5A2E1C', white: 0.25 }, { base: '#F2E2C0', light: '#FFFBF2', dark: '#D6C29A', white: 0.25 }, { base: '#B8B4B0', light: '#FFFBF2', dark: '#6E6A68', white: 0.25 }, { base: '#B07A45', light: '#C8925E', dark: '#3A2E2E', white: 0, brindle: true }, { base: '#8A4F33', light: '#A0644A', dark: '#5A2E1C', white: 0 }, { base: '#F2E2C0', light: '#FFF4DE', dark: '#D6C29A', white: 0 }, { base: '#B8B4B0', light: '#CFCBC6', dark: '#6E6A68', white: 0 }, { base: '#C4B0A8', light: '#FFFBF2', dark: '#A08C86', white: 0.25 }, { base: '#C4B0A8', light: '#DCCAC2', dark: '#A08C86', white: 0 }], // Gold and white, Black and white, Brindle and white, Gold, Black, Liver and white, Cream and white, Silver and white, Brindle, Liver, Cream, Silver, Lilac and white, Lilac
};
NEW.forEach((k) => {
  AGES.forEach((age) => [false, true].forEach((sp) => good(PA.dogHead(k, { age: age || undefined, sparkle: sp }), '0 0 100 100', `head ${k} ${age} ${sp}`)));
  (COATS[k] || []).forEach((c, i) => { const a = PA.dog(k, { pose: 'idle', coat: c, seed: 's' + i }), hd = PA.dogHead(k, { coat: c });
    good(a, '0 0 240 200', `${k} coat#${i}`); good(hd, '0 0 100 100', `head ${k} coat#${i}`);
    ok(a !== PA.dog(k, { pose: 'idle' }) && a.includes(c.base), `${k} coat#${i} recolours the dog`); });
  good(PA.dog(k, { pose: 'sit', facing: 'left', seed: 'm', coat: { base: '#2B2430', light: '#FFE7B3', dark: '#1D1A22', white: 0.6, merle: true, eyes: 'odd' } }), '0 0 240 200', `${k} merle odd-eye coat`);
  ALL.forEach((o) => { if (o === k) return;
    good(PA.dog(k, { pose: 'walk', mix: { head: o } }), '0 0 240 200', `${k} body, ${o} head`);
    good(PA.dog(o, { pose: 'sit', mix: { head: k }, age: 'puppy' }), '0 0 240 200', `${o} body, ${k} head, puppy`);
    good(PA.dogHead(o, { mix: { head: k } }), '0 0 100 100', `head mix ${o}/${k}`); });
  POSES.forEach((p) => good(PA.dog(k, { pose: p, expecting: true }), '0 0 240 200', `${k} ${p} expecting`));
});

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
NEW.forEach((k) => BAND.forEach((nm) => POSES.forEach((p, pi) => AGES.forEach((age) => ['right', 'left'].forEach((f) => {
  const o = { pose: p, facing: f, outfit: { neck: nm } }; if (age) o.age = age; if (pi % 2) o.sparkle = true;
  const lab = `${k} ${nm} ${p} ${age || 'adult'} ${f}`; probe = { n: 0, bad: [] }; let svg = '';
  try { svg = IP.dog(k, o); } catch (e) { ok(false, lab + ': threw ' + e.message); probe = null; return; }
  nb++; good(svg, '0 0 240 200', lab); ok(probe.n === (o.anim === false ? 1 : 3), lab + ': drawn in every frame'); probe.bad.forEach((b) => ok(false, lab + ': ' + b)); if (!probe.bad.length) pass++; probe = null;
  if (pi === 0 && f === 'right') ok(svg !== PA.dog(k, { pose: p, facing: f, age: age || undefined, sparkle: !!(pi % 2) }), lab + ': changes the render');
})))));
console.log('   ' + nb + ' bandana renders');
// the three look different from each other and from the Red Bandana
NEW.slice(0, 3).forEach((k) => { const r = [...BAND, 'Red Bandana', 'Candy Corn Bandana'].map((b) => PA.dog(k, { pose: 'idle', outfit: { neck: b } })); ok(new Set(r).size === 5, k + ': five different bandanas'); });

console.log('-- old breeds unchanged (spot check; the full proof is dogs/check_identical.js v212-base)');
let ref = null; for (const r of ['v212-base', 'origin/v212-base']) { try { cp.execSync('git rev-parse --verify -q ' + r, { cwd: ROOT, stdio: 'ignore' }); ref = r; break; } catch (e) { /* next */ } }
if (!ref) console.log('   no v212-base ref here, skipped');
else { const OLD0 = load(cp.execSync(`git show ${ref}:dogs/pawart_dogs.js`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }));
  // v2.12 owner: the old poodle is shown as "Miniature Poodle" (key unchanged). Only its aria-label text changes, so the old renders are compared with that label renamed
  const ren = (x) => x.replace(/ the Poodle([,"])/g, ' the Miniature Poodle$1'), OLD = { dog: (k, o) => ren(OLD0.dog(k, o)), dogHead: (k, o) => ren(OLD0.dogHead(k, o)) };
  POSES.forEach((p, i) => AGES.forEach((age) => [null, { neck: 'Red Bandana' }, { body: 'Ghost Sheet' }, { head: 'Party Hat', body: 'Little Bat Costume' }, { body: 'Trick-or-Treat Ghost' }].forEach((of, oi) => {
    const o = { pose: p, age: age || undefined, sparkle: !!((i + oi) % 2), facing: (i + oi) % 3 ? 'right' : 'left' }; if (of) o.outfit = of;
    ok(OLD.dog('poodle', o) === PA.dog('poodle', o), `poodle ${p} ${age || 'adult'} outfit#${oi} identical to ${ref} apart from the name`); })));
  ['shiba', 'golden', 'samoyed'].forEach((k) => { ok(OLD.dog('poodle', { pose: 'walk', mix: { head: k } }) === PA.dog('poodle', { pose: 'walk', mix: { head: k } }), `poodle body ${k} head identical`);
    ok(OLD.dog(k, { pose: 'sit', mix: { head: 'poodle' } }) === PA.dog(k, { pose: 'sit', mix: { head: 'poodle' } }), `${k} body poodle head identical`); });
  ok(PA.DOGS.find((d) => d.key === 'poodle').breed === 'Miniature Poodle', 'the old poodle is shown as Miniature Poodle');
  OLD21.forEach((k) => { ok(OLD.dogHead(k) === PA.dogHead(k), `head ${k} identical to ${ref}`);
    ['idle', 'sleep', 'beg', 'rollover'].forEach((p, i) => { const o = { pose: p, outfit: [null, { neck: 'Red Bandana' }, { body: 'Ghost Sheet' }, { head: 'Party Hat' }][i], age: [undefined, 'puppy', undefined, 'newborn'][i], sparkle: i === 2 };
      ok(OLD.dog(k, o) === PA.dog(k, o), `${k} ${p} identical to ${ref}`); });
    ok(OLD.dog(k, { pose: 'walk', mix: { head: 'samoyed' } }) === PA.dog(k, { pose: 'walk', mix: { head: 'samoyed' } }), `${k} mix identical to ${ref}`); }); }

console.log(`v212_dogs: ${pass} passed, ${fail} failed`);
if (fail) { console.log(fails.join('\n')); process.exit(1); }
console.log('ALL OK');
