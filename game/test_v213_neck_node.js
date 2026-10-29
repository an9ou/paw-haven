// v2.13 NECK (V213.md 5, owner: "Make sure the head is stick to the body"). Plain node: node game/test_v213_neck_node.js   (exits 1 on any failure)
// game/v212_neck_check.js draws each frame with layer markers and rasterises the body and head layers. A frame FLOATS when the skull does not touch
// the body and most of the neck's place is empty paper (floats(), SKULL_MIN / HOLE_MAX there). Checked here:
//   1. every breed (35) x every pose (29) x adult and puppy x the three animation frames, and the newborn's two poses: no frame floats;
//   2. the NECKFIX list (dogs/pawart_dogs.js): each entry has the v2.12 overlap (NECK_MIN 12 px^2) in every frame; control: without the fix each
//      entry floats in at least one frame (the list holds no pose that did not need it); the fix leaves the puppies and every other pose as they were;
//   3. every EXPR entry with a pose() hook (it may tilt the head), on every pose it shows on, every breed, adult and puppy, three frames: no frame floats;
//   4. mixes (V213.md 5.1: a mix draws the neck tube in every pose, adult and puppy): every body breed x every head breed in the poses where mixes
//      floated most (adult speak and leglift, puppy howl), three frames; a rotating sample of MIX_N pairs in every pose, adult, puppy and
//      newborn, and adult with every pose() expression; the fixed hardest pairs too. No frame floats. The tube bridges a short gap, not a giraffe neck:
//      where the tube is the mix rule's own, the bare gap it bridges stays under MIX_GAP px (all pairs: at most 6.5; the necked purebreds bridge up to 19). Control: without the mix rule the
//      hardest pairs float; the rule changes no purebred render.
// The breeds are shared over one child process per CPU core (at most 4). KEYS=shiba,pug: just those breeds (and mixes with those bodies).
// MIX_DAY=n picks the rotating sample (default: the day number, so each day checks other pairs; the failure message names the day to rerun).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'dogs', 'pawart_dogs.js'), 'utf8');
const { neckChecker, floats, SKULL_MIN, HOLE_MAX } = require('./v212_neck_check.js');
const NECK_MIN = 12, AGES = [null, 'puppy'], FR = [0, 1, 2];
const FIXLINE = 'Object.keys(NECKFIX).forEach(k=>{SP[k].nfix=NECKFIX[k]});';
const MIXLINE = 'if(s.mixHead&&s.pup!==2)L.neckT=1;';
const TUBE = "if(L.pose==='eat'||L.pose==='jump'||L.pose==='sit'||L.pose==='sad'||s.neck||L.neckT)h.tube";
const MIX_KEY_A = ['speak', 'leglift'], MIX_KEY_P = ['howl'], MIX_N = 8, MIX_GAP = 10;
const MIX_HARD = [['collie', 'yorkie'], ['collie', 'pug'], ['husky', 'greyhound'], ['shihtzu', 'minpin'], ['dachs', 'greyhound']];
const MIX_DAY = process.env.MIX_DAY ? +process.env.MIX_DAY : Math.floor(Date.now() / 864e5);
const fix = () => { const m = SRC.match(/const NECKFIX=(\{[\s\S]*?\}\});/); if (!m) return null; const sb = {}; return require('vm').runInNewContext('(' + m[1] + ')', sb); };
const fmt = (r) => `skull ${r.skull.toFixed(1)}, hole ${r.hole.toFixed(1)}, overlap ${r.overlap.toFixed(1)}`;
// the rotating sample: MIX_N body x head pairs for the day (bodies and heads spread over the 35 keys)
const mixSample = (keys) => { const n = keys.length, out = []; for (let i = 0; out.length < MIX_N && i < 4 * MIX_N; i++) {
  const b = keys[(MIX_DAY * 7 + i * 5) % n], h = keys[(MIX_DAY * 11 + i * 13 + 1) % n]; if (b !== h && !out.some((q) => q[0] === b && q[1] === h)) out.push([b, h]); } return out; };

if (process.env.NECK_SHARD) { // child: one share of the breeds, sends its results back
  const [SI, SN] = process.env.NECK_SHARD.split('/').map(Number), c = neckChecker(SRC), G = c.G, bad = [], counts = { base: 0, expr: 0, mixKey: 0, mixAll: 0, mixExpr: 0 }, hooks = [];
  const KO = (process.env.KEYS || '').split(',').filter(Boolean), ALLK = Object.keys(G.SP), keys = ALLK.filter((k) => !KO.length || KO.includes(k)).filter((k, i) => i % SN === SI);
  const look = (k, p, age, o, lab) => FR.forEach((f) => { const r = c(k, p, age, Object.assign({ k: f, parts: 1 }, o)); if (floats(r)) bad.push(`${lab} frame ${f}: the head floats (${fmt(r)})`); });
  const hooked = G.EXPR_LIST.filter((n) => G.EXPR[n] && typeof G.EXPR[n].pose === 'function');
  keys.forEach((k) => {
    AGES.forEach((age) => G.POSES.forEach((p) => { counts.base++; look(k, p, age, {}, `${k} ${p} ${age || 'adult'}`); }));
    ['sleep', 'down'].forEach((p) => { counts.base++; look(k, p, 'newborn', {}, `${k} ${p} newborn`); });
    hooked.forEach((n) => { if (!hooks.includes(n)) hooks.push(n);
      AGES.forEach((age) => G.POSES.forEach((p) => { if (!G.exOk(n, p, age)) return; counts.expr++; look(k, p, age, { expr: n }, `${k} ${p} ${age || 'adult'} expr ${n}`); })); });
    // 4a. this body breed with every other head breed, in the key poses
    ALLK.forEach((hk) => { if (hk === k) return;
      MIX_KEY_A.forEach((p) => { counts.mixKey++; look(k, p, null, { mix: hk }, `mix ${k} body ${hk} head ${p} adult`); });
      MIX_KEY_P.forEach((p) => { counts.mixKey++; look(k, p, 'puppy', { mix: hk }, `mix ${k} body ${hk} head ${p} puppy`); }); });
  });
  // 4b. the rotating sample and the hardest pairs: every pose, adult, puppy and newborn, and every pose() expression
  const pairs = mixSample(ALLK).concat(MIX_HARD).filter((q) => !KO.length || KO.includes(q[0])).filter((q, i) => i % SN === SI), gaps = [];
  const bare = neckChecker(SRC.replace(TUBE, 'if(0)h.tube'));
  pairs.forEach(([b, hk]) => {
    AGES.forEach((age) => G.POSES.forEach((p) => { counts.mixAll++; look(b, p, age, { mix: hk }, `mix ${b} body ${hk} head ${p} ${age || 'adult'} (MIX_DAY=${MIX_DAY})`); }));
    ['sleep', 'down'].forEach((p) => { counts.mixAll++; look(b, p, 'newborn', { mix: hk }, `mix ${b} body ${hk} head ${p} newborn (MIX_DAY=${MIX_DAY})`); });
    hooked.forEach((n) => [null].forEach((age) => G.POSES.forEach((p) => { if (!G.exOk(n, p, age)) return; counts.mixExpr++; // adults (no puppy mix floated)
      look(b, p, age, { mix: hk, expr: n }, `mix ${b} body ${hk} head ${p} ${age || 'adult'} expr ${n} (MIX_DAY=${MIX_DAY})`); })));
    G.POSES.forEach((p) => { if (G.SP[b].neck || /^(eat|jump|sit|sad)$/.test(p)) return; // the tube is the mix rule's own here (not the necked body's, not a pose that always had it)
      const r = bare(b, p, null, { mix: hk, parts: 1, gap: 1 }); gaps.push([r.skullGap, `${b}+${hk} ${p}`]);
      if (r.skullGap >= MIX_GAP) bad.push(`mix ${b} body ${hk} head ${p} adult: the neck tube bridges a ${r.skullGap} px gap (a giraffe neck, limit ${MIX_GAP}; MIX_DAY=${MIX_DAY})`); });
  });
  process.send({ bad, counts, hooks, keys, pairs, gap: gaps.sort((a, b) => b[0] - a[0])[0] || null });
  return;
}

let pass = 0, fail = 0; const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; if (fails.length < 60) fails.push(msg); } }
const t0 = Date.now();
console.log(`-- the rule: a frame floats when the skull overlaps the body by less than ${SKULL_MIN} px^2 and the neck hole is at least ${HOLE_MAX} px^2`);
ok(SRC.split(FIXLINE).length === 2, 'the NECKFIX table is applied once');
ok(SRC.split(MIXLINE).length === 2, 'the mix neck rule is there once');
ok(SRC.split(TUBE).length === 2, 'frame() draws the neck tube in one place');
const NF = fix(); ok(NF && typeof NF === 'object', 'the NECKFIX table is there');
const vm = require('vm'), load = (src) => { const sb = { window: {} }; vm.createContext(sb); vm.runInContext(src, sb); return sb.window.PawArt; }, PA = load(SRC);

console.log('-- the NECKFIX list: the v2.12 overlap in every frame; without it each entry floats; it changes nothing else');
const LIST = []; Object.keys(NF || {}).forEach((k) => Object.keys(NF[k]).forEach((p) => LIST.push([k, p])));
console.log('   ' + LIST.length + ' breed:pose: ' + LIST.map((e) => e.join(':')).join(','));
{ const c = neckChecker(SRC), G = c.G, OFF = SRC.replace(FIXLINE, ''), c0 = neckChecker(OFF), P0 = load(OFF), CC0 = require('../dogs/connect_check.js').checker(OFF);
  LIST.forEach(([k, p]) => { ok(G.SP[k] && G.POSES.includes(p), `${k}:${p} is a breed and a pose`); if (!G.SP[k]) return;
    const q = NF[k][p]; ok(Array.isArray(q) && q.length === 2 && q.every((v) => Math.abs(v) <= 8), `${k}:${p}: a small head move [dx, dy] (at most 8 px), not a stretched neck`);
    FR.forEach((f) => { const r = c(k, p, null, { k: f, parts: 1 }); ok(r.overlap >= NECK_MIN, `${k} ${p} frame ${f}: the head overlaps the body (${fmt(r)}, needs ${NECK_MIN})`);
      ok(r.hole === 0, `${k} ${p} frame ${f}: the neck tube fills the neck (hole ${r.hole.toFixed(1)})`); });
    // v2.15.2 (fills inside their outlines): the fills no longer drift, so a few heads leave a neck hole just under HOLE_MAX without the fix; the control
    // is now that the skull itself does not touch the body without it. A breed that draws its neck tube in every pose (spec neck: the collie) needs no control.
    // v2.18.3 (owner: every part stuck together): the entries added then are heads that only met the body by a corner, or by an ear, in some frame, dry or wet;
    // their control is dogs/connect_check.js: without the fix it finds the head off the body in at least one frame
    if (!G.SP[k].neck) ok(FR.some((f) => { const r = c0(k, p, null, { k: f, parts: 1 }); return floats(r) || r.skull < SKULL_MIN; }) || FR.some((f) => [false, true].some((wet) => CC0.one(k, { pose: p, k: f, wet }).some((x) => /^head off/.test(x)))), `control: ${k} ${p}: without the fix the skull does not touch the body`);
    ok(PA.dog(k, { pose: p, age: 'puppy' }) === P0.dog(k, { pose: p, age: 'puppy' }), `${k} ${p} puppy: unchanged by the fix`);
    ok(PA.dog(k, { pose: p }) !== P0.dog(k, { pose: p }), `${k} ${p}: the fix changes the adult render`);
  });
  Object.keys(NF || {}).forEach((k) => G.POSES.forEach((p) => { if (NF[k][p]) return;
    ok(PA.dog(k, { pose: p }) === P0.dog(k, { pose: p }) && PA.dog(k, { pose: p, facing: 'left', outfit: { neck: 'Red Bandana' } }) === P0.dog(k, { pose: p, facing: 'left', outfit: { neck: 'Red Bandana' } }), `${k} ${p}: not in the list, unchanged`); }));
}

console.log('-- the mix neck rule (V213.md 5.1): without it the hardest pairs float; it changes no purebred render');
{ const OFF = SRC.replace(MIXLINE, ''), c0 = neckChecker(OFF.replace(FIXLINE, '')), P0 = load(OFF), G = c0.G; // v2.18.3: the float controls leave NECKFIX out too (it also necks a mix body in its poses)
  [['husky', 'yorkie', 'leglift', null], ['dachs', 'pug', 'speak', null], ['husky', 'greyhound', 'walk', null], ['dachs', 'greyhound', 'howl', 'puppy'], ['pug', 'yorkie', 'speak', null]].forEach(([b, hk, p, age]) =>
    ok(FR.some((f) => floats(c0(b, p, age, { k: f, mix: hk, parts: 1 }))), `control: ${b} body ${hk} head ${p} ${age || 'adult'} floats without the mix rule`));
  Object.keys(G.SP).forEach((k, i) => G.POSES.forEach((p, pi) => { if ((i + pi) % 5) return; const o = { pose: p, age: [undefined, 'puppy', 'newborn'][(i + pi) % 3], facing: pi % 2 ? 'left' : 'right', sparkle: i % 2 === 0 };
    ok(PA.dog(k, o) === P0.dog(k, o), `${k} ${p}: the mix rule leaves the purebred unchanged`); }));
  ok(PA.dog('husky', { pose: 'sniff', mix: { head: 'yorkie' } }) !== P0.dog('husky', { pose: 'sniff', mix: { head: 'yorkie' } }), 'the mix rule draws the tube on a mix');// v2.18.3: husky walk is in NECKFIX now// v2.15.2: the collie draws its (white) neck tube in every pose now
  ok(PA.dog('collie', { pose: 'sleep', mix: { head: 'yorkie' }, age: 'newborn' }) === P0.dog('collie', { pose: 'sleep', mix: { head: 'yorkie' }, age: 'newborn' }), 'newborn mixes keep no neck');
  ok(PA.dogHead('collie', { mix: { head: 'yorkie' } }) === P0.dogHead('collie', { mix: { head: 'yorkie' } }), 'the mix head chip is unchanged');
}

console.log('-- every breed x pose x adult, puppy (and the newborn) x frame; expressions with a pose() hook; mixes');
const n = Math.max(1, Math.min(4, os.cpus().length)); let done = 0; const counts = { base: 0, expr: 0, mixKey: 0, mixAll: 0, mixExpr: 0 }, hooks = new Set(), seen = [], pairs = []; let gap = null;
for (let i = 0; i < n; i++) {
  const ch = cp.fork(__filename, [], { env: Object.assign({}, process.env, { NECK_SHARD: i + '/' + n }) });
  let got = false;
  ch.on('message', (m) => { got = true; m.bad.forEach((b) => ok(false, b)); Object.keys(counts).forEach((k) => { counts[k] += m.counts[k]; }); m.hooks.forEach((h) => hooks.add(h)); seen.push(...m.keys); pairs.push(...m.pairs);
    if (m.gap && (!gap || m.gap[0] > gap[0])) gap = m.gap; });
  ch.on('exit', (code) => { ok(got && code === 0, `shard ${i}/${n} finished (exit ${code})`); if (++done === n) finish(); });
}
function finish() {
  const pairsN = counts.base * FR.length; ok(pass > 0, 'checks ran');
  if (!process.env.KEYS) { ok(seen.length === 35, `all 35 breeds measured (${seen.length})`); ok(counts.mixKey === 35 * 34 * (MIX_KEY_A.length + MIX_KEY_P.length), `every body x head pair in the key poses (${counts.mixKey})`);
    ok(pairs.length === MIX_N + MIX_HARD.length, `the mix sample: ${MIX_N} rotating pairs and ${MIX_HARD.length} hard ones (${pairs.length})`); }
  ok(fails.filter((f) => /floats|giraffe/.test(f)).length === 0, 'no frame of any breed, mix, pose or age floats');
  console.log(`   ${counts.base} breed x pose x age (${pairsN} frames)`);
  console.log(hooks.size ? `   expressions with a pose() hook: ${[...hooks].join(', ')}: ${counts.expr} breed x pose x age (${counts.expr * FR.length} frames)` : '   no expression has a pose() hook yet (ART A / ART B add them; this suite picks them up)');
  console.log(`   mixes: ${counts.mixKey} body x head x key pose (${counts.mixKey * FR.length} frames); MIX_DAY=${MIX_DAY} sample ${pairs.map((q) => q.join('+')).join(', ')}: ${counts.mixAll} pose x age, ${counts.mixExpr} with an expression (${(counts.mixAll + counts.mixExpr) * FR.length} frames)`);
  if (gap) console.log(`   the widest gap the mix rule's tube bridges in the sample: ${gap[0]} px (${gap[1]}; limit ${MIX_GAP})`);
  console.log(`v213_neck: ${pass} passed, ${fail} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (fail) { console.log(fails.join('\n')); process.exit(1); }
  console.log('ALL OK');
}
