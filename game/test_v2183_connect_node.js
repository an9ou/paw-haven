// v2.18.3 "All in one piece" (owner, 29 Oct 2026: "make sure all dogs body part is stick together in every pose ... and avoid overlapping").
// Plain node: node game/test_v2183_connect_node.js   (exits 1 on any failure)
// dogs/connect_check.js rasterises each part of a dog (legs, tail, neck, body, ruff, ears, topknot, head, face, the outfit) and checks that
//   the dog is one piece (no loose blob), every leg, ear, tail, topknot and the head touches its parent, and no leg is a noodle.
// Checked here:
//   1. every breed (35) x every pose (29) x adult, puppy (and the newborn's two poses) x the three frames x dry and wet, plus mixes: 0 failures;
//   2. the outfit set (dogs/connect_check.js OUTFITS) on every breed, a third of the poses, adult, puppy and newborn, dry and wet: 0 failures;
//   3. controls: with each v2.18.3 fix turned off the check finds the owner's cases again (the begging dachshund's loose hind foot, its noodle
//      jumping legs, the doberman's flying ear, a floating head, the long-legged sitting puppy).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8'), CC = path.join(ROOT, 'dogs', 'connect_check.js');
const { checker } = require(CC);
let pass = 0, fail = 0; const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; if (fails.length < 60) fails.push(msg); } }
const t0 = Date.now();
const run = (env) => { const r = cp.spawnSync(process.execPath, [CC], { env: Object.assign({}, process.env, env), encoding: 'utf8', maxBuffer: 64 << 20 }); return (r.stdout || '') + (r.stderr || ''); };
console.log('-- 1. every breed, pose, age, frame, dry and wet, and mixes');
{ const out = run({}), m = /connect_check: (\d+) renders, (\d+) failures/.exec(out); console.log('   ' + (m ? m[0] : out.slice(0, 400)));
  ok(m && +m[1] >= 12000, 'all renders checked'); ok(m && +m[2] === 0, 'no failures:\n' + out.split('\n').slice(1, 20).join('\n')); }
console.log('-- 2. the outfits');
{ const out = run({ OUTFITS: '1', K: '0' }), m = /connect_check \(outfits\): (\d+) renders, (\d+) failures/.exec(out); console.log('   ' + (m ? m[0] : out.slice(0, 400)));
  ok(m && +m[1] >= 20000, 'all outfit renders checked'); ok(m && +m[2] === 0, 'no outfit failures:\n' + out.split('\n').slice(1, 20).join('\n')); }
console.log('-- 3. controls: each fix off, the check finds the case again');
const off = (a, b) => { ok(SRC.split(a).length === 2, 'control anchor found once: ' + a.slice(0, 60)); return checker(SRC.replace(a, b)); };
const finds = (C, key, o, re, lab) => { const r = [0, 1, 2].map((k) => C.one(key, Object.assign({ k }, o))).flat(); ok(r.some((x) => re.test(x)), `control: ${lab} (got: ${r.join('; ') || 'nothing'})`); };
finds(off('if(top.some(p=>inPoly(p,Q)||inTh(p)))return;', 'return;'), 'dachs', { pose: 'beg' }, /legNH in 2 pieces|leg(FH|NH) off the body|^loose/, 'without the hock the begging dachshund\'s hind foot lies loose');
finds(off('if(n>st){const q=st/n,', 'if(0){const q=st/n,'), 'dachs', { pose: 'jump' }, /^leaping leg/, 'without the short leap the dachshund jumps on noodle legs');
finds(off("  if(L.ears==='fly'&&e.flop)p=earOn(s,p,e);\n", ''), 'dobie', { pose: 'shake', outfit: { body: 'Tutu' } }, /^ear\d off the head/, 'without earOn the doberman\'s flying ear leaves the head');
finds(off("  chihuahua:{pet:[0,0],beg:[0,0],squat:[0,0],dance:[0,0],idle:[0,0],", '  chihuahua:{pet:[0,0],beg:[0,0],squat:[0,0],dance:[0,0],'), 'chihuahua', { pose: 'idle' }, /^head off the body/, 'without its neck the chihuahua\'s idle head floats');
finds(off('return legFit(s,L);\n}', 'return L;\n}'), 'pug', { pose: 'rollover', age: 'puppy' }, /^noodle/, 'without legFit the rolling puppy has noodle legs');
finds(off('if(aOv===undefined&&/^(sit|paw|scratch)$/.test(legMode)', 'if(0&&/^(sit|paw|scratch)$/.test(legMode)'), 'dachs', { pose: 'sit' }, /^noodle legN?F/, 'without the lower sit the dachshund sits on long front noodles');
console.log(`v2183_connect: ${pass} passed, ${fail} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
if (fail) { console.log(fails.join('\n')); process.exit(1); }
console.log('ALL OK');
