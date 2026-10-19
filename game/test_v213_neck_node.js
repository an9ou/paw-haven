// v2.13 NECK (V213.md 5, owner: "Make sure the head is stick to the body"). Plain node: node game/test_v213_neck_node.js   (exits 1 on any failure)
// game/v212_neck_check.js draws each frame with layer markers and rasterises the body and head layers. A frame FLOATS when the skull does not touch
// the body and most of the neck's place is empty paper (floats(), SKULL_MIN / HOLE_MAX there). Checked here:
//   1. every breed (35) x every pose (29) x adult and puppy x the three animation frames, and the newborn's two poses: no frame floats;
//   2. the NECKFIX list (dogs/pawart_dogs.js): each entry has the v2.12 overlap (NECK_MIN 12 px^2) in every frame; control: without the fix each
//      entry floats in at least one frame (the list holds no pose that did not need it); the fix leaves the puppies and every other pose as they were;
//   3. every EXPR entry with a pose() hook (it may tilt the head), on every pose it shows on, every breed, adult and puppy, three frames: no frame floats.
// The breeds are shared over one child process per CPU core (at most 4). KEYS=shiba,pug: just those breeds.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'dogs', 'pawart_dogs.js'), 'utf8');
const { neckChecker, floats, SKULL_MIN, HOLE_MAX } = require('./v212_neck_check.js');
const NECK_MIN = 12, AGES = [null, 'puppy'], FR = [0, 1, 2];
const FIXLINE = 'Object.keys(NECKFIX).forEach(k=>{SP[k].nfix=NECKFIX[k]});';
const fix = () => { const m = SRC.match(/const NECKFIX=(\{[\s\S]*?\}\});/); if (!m) return null; const sb = {}; return require('vm').runInNewContext('(' + m[1] + ')', sb); };
const fmt = (r) => `skull ${r.skull.toFixed(1)}, hole ${r.hole.toFixed(1)}, overlap ${r.overlap.toFixed(1)}`;

if (process.env.NECK_SHARD) { // child: one share of the breeds, sends its results back
  const [SI, SN] = process.env.NECK_SHARD.split('/').map(Number), c = neckChecker(SRC), G = c.G, bad = [], counts = { base: 0, expr: 0 }, hooks = [];
  const KO = (process.env.KEYS || '').split(',').filter(Boolean), keys = Object.keys(G.SP).filter((k) => !KO.length || KO.includes(k)).filter((k, i) => i % SN === SI);
  const look = (k, p, age, o, lab) => FR.forEach((f) => { const r = c(k, p, age, Object.assign({ k: f, parts: 1 }, o)); if (floats(r)) bad.push(`${lab} frame ${f}: the head floats (${fmt(r)})`); });
  keys.forEach((k) => {
    AGES.forEach((age) => G.POSES.forEach((p) => { counts.base++; look(k, p, age, {}, `${k} ${p} ${age || 'adult'}`); }));
    ['sleep', 'down'].forEach((p) => { counts.base++; look(k, p, 'newborn', {}, `${k} ${p} newborn`); });
    G.EXPR_LIST.forEach((n) => { const X = G.EXPR[n]; if (!X || typeof X.pose !== 'function') return; if (!hooks.includes(n)) hooks.push(n);
      AGES.forEach((age) => G.POSES.forEach((p) => { if (!G.exOk(n, p, age)) return; counts.expr++; look(k, p, age, { expr: n }, `${k} ${p} ${age || 'adult'} expr ${n}`); })); });
  });
  process.send({ bad, counts, hooks, keys });
  return;
}

let pass = 0, fail = 0; const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; if (fails.length < 60) fails.push(msg); } }
const t0 = Date.now();
console.log(`-- the rule: a frame floats when the skull overlaps the body by less than ${SKULL_MIN} px^2 and the neck hole is at least ${HOLE_MAX} px^2`);
ok(SRC.split(FIXLINE).length === 2, 'the NECKFIX table is applied once');
const NF = fix(); ok(NF && typeof NF === 'object', 'the NECKFIX table is there');

console.log('-- the NECKFIX list: the v2.12 overlap in every frame; without it each entry floats; it changes nothing else');
const LIST = []; Object.keys(NF || {}).forEach((k) => Object.keys(NF[k]).forEach((p) => LIST.push([k, p])));
console.log('   ' + LIST.length + ' breed:pose: ' + LIST.map((e) => e.join(':')).join(','));
{ const c = neckChecker(SRC), G = c.G, OFF = SRC.replace(FIXLINE, ''), c0 = neckChecker(OFF);
  const vm = require('vm'), load = (src) => { const sb = { window: {} }; vm.createContext(sb); vm.runInContext(src, sb); return sb.window.PawArt; }, PA = load(SRC), P0 = load(OFF);
  LIST.forEach(([k, p]) => { ok(G.SP[k] && G.POSES.includes(p), `${k}:${p} is a breed and a pose`); if (!G.SP[k]) return;
    const q = NF[k][p]; ok(Array.isArray(q) && q.length === 2 && q.every((v) => Math.abs(v) <= 8), `${k}:${p}: a small head move [dx, dy] (at most 8 px), not a stretched neck`);
    FR.forEach((f) => { const r = c(k, p, null, { k: f, parts: 1 }); ok(r.overlap >= NECK_MIN, `${k} ${p} frame ${f}: the head overlaps the body (${fmt(r)}, needs ${NECK_MIN})`);
      ok(r.hole === 0, `${k} ${p} frame ${f}: the neck tube fills the neck (hole ${r.hole.toFixed(1)})`); });
    ok(FR.some((f) => floats(c0(k, p, null, { k: f, parts: 1 }))), `control: ${k} ${p} floats without the fix`);
    ok(PA.dog(k, { pose: p, age: 'puppy' }) === P0.dog(k, { pose: p, age: 'puppy' }), `${k} ${p} puppy: unchanged by the fix`);
    ok(PA.dog(k, { pose: p }) !== P0.dog(k, { pose: p }), `${k} ${p}: the fix changes the adult render`);
  });
  Object.keys(NF || {}).forEach((k) => G.POSES.forEach((p) => { if (NF[k][p]) return;
    ok(PA.dog(k, { pose: p }) === P0.dog(k, { pose: p }) && PA.dog(k, { pose: p, facing: 'left', outfit: { neck: 'Red Bandana' } }) === P0.dog(k, { pose: p, facing: 'left', outfit: { neck: 'Red Bandana' } }), `${k} ${p}: not in the list, unchanged`); }));
}

console.log('-- every breed x pose x adult, puppy (and the newborn) x frame; expressions with a pose() hook');
const n = Math.max(1, Math.min(4, os.cpus().length)); let done = 0; const counts = { base: 0, expr: 0 }, hooks = new Set(), seen = [];
for (let i = 0; i < n; i++) {
  const ch = cp.fork(__filename, [], { env: Object.assign({}, process.env, { NECK_SHARD: i + '/' + n }) });
  let got = false;
  ch.on('message', (m) => { got = true; m.bad.forEach((b) => ok(false, b)); counts.base += m.counts.base; counts.expr += m.counts.expr; m.hooks.forEach((h) => hooks.add(h)); seen.push(...m.keys); });
  ch.on('exit', (code) => { ok(got && code === 0, `shard ${i}/${n} finished (exit ${code})`); if (++done === n) finish(); });
}
function finish() {
  const pairs = counts.base * FR.length; ok(pass > 0, 'checks ran');
  if (!process.env.KEYS) ok(seen.length === 35, `all 35 breeds measured (${seen.length})`);
  ok(fails.filter((f) => /floats/.test(f)).length === 0, 'no frame of any breed, pose or age floats');
  console.log(`   ${counts.base} breed x pose x age (${pairs} frames)`);
  console.log(hooks.size ? `   expressions with a pose() hook: ${[...hooks].join(', ')}: ${counts.expr} breed x pose x age (${counts.expr * FR.length} frames)` : '   no expression has a pose() hook yet (ART A / ART B add them; this suite picks them up)');
  console.log(`v213_neck: ${pass} passed, ${fail} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (fail) { console.log(fails.join('\n')); process.exit(1); }
  console.log('ALL OK');
}
