// v2.13 face expressions (plain node). Run: node game/test_v213_faces_node.js   (exits 1 on any failure). ONLY=sleepy,hearts tests just those (the ART lanes),
// KEYS=shiba,pug just those breeds. V213.md 3 and 6: every expression on every breed, adult and puppy, every pose in its ok regex, both facings and a set of
// outfits renders a valid SVG with the pa-ex-<name> class, inside the canvas; an expression not ok for the pose, an unknown one and a newborn draw the old render.
// The byte-identical proof without expressions is node dogs/check_identical.js v213-base (with the V213.md 5 SKIP list).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'dogs', 'pawart_dogs.js'), 'utf8');
let pass = 0, fail = 0; const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; if (fails.length < 40) fails.push(msg); } }
const load = (src) => { const sb = { window: {} }; vm.createContext(sb); vm.runInContext(src, sb); return sb.window.PawArt; };
const HOOK = 'PA.dog=dog;';
ok(SRC.split(HOOK).length === 2, 'the hook point PA.dog=dog; is there once');
const IP = load(SRC.replace(HOOK, HOOK + 'PA._t={OUT,TOP2,EXPR,POSES};')), PA = IP, T = IP._t;
const LIST = ['sleepy', 'surprised', 'curious', 'hearts', 'proud', 'guilty', 'sneeze', 'blep', 'zoomies', 'pout', 'dreamy', 'wow', 'wink', 'yum'];
ok(JSON.stringify(PA.EXPR_LIST) === JSON.stringify(LIST), 'PawArt.EXPR_LIST is the fourteen of V213.md 3.1, in order');
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean), EX = ONLY.length ? LIST.filter((n) => ONLY.includes(n)) : LIST;
const KO = (process.env.KEYS || '').split(',').filter(Boolean), KEYS = PA.DOGS.map((d) => d.key).filter((k) => !KO.length || KO.includes(k));
ok(PA.DOGS.length === 35, '35 breeds');
const good = (svg, lab) => {
  ok(typeof svg === 'string' && svg.startsWith('<svg') && svg.endsWith('</svg>'), lab + ': an SVG');
  ok(!/NaN|undefined|Infinity/.test(svg), lab + ': no NaN, undefined or Infinity');
  ok(!/<script|\son[a-z]+=|<filter/i.test(svg), lab + ': no script, handler or filter');
};
const NEVER = /^(sleep|playdead|rollover)$/;
console.log('-- every expression: its poses');
EX.forEach((n) => { const X = T.EXPR[n]; ok(X && typeof X === 'object', n + ': an EXPR entry');
  const poses = T.POSES.filter((p) => PA.exprOk(n, p)); ok(poses.length >= 3, n + ': shows on at least 3 poses (' + poses.join(' ') + ')');
  ok(!poses.some((p) => NEVER.test(p)), n + ': never on sleep, playdead or rollover'); });
console.log('-- every breed x age x expression x ok pose x facing');
const OUTS = [undefined, { head: 'Party Hat' }, { head: 'Wizard Hat', eyes: 'Explorer Goggles' }, { eyes: 'Heart Sunglasses' }, { head: 'Astronaut Helmet' },
  { body: 'Ghost Sheet' }, { head: 'Year of the Sheep Hood' }, { body: 'Cozy Hoodie' }, ...Object.keys(T.TOP2).map((b) => ({ body: b }))];
let n0 = 0;
KEYS.forEach((k) => { [null, 'puppy'].forEach((age) => { const lk = age ? { coat: { look: { age } } } : {};
  EX.forEach((n) => { T.POSES.filter((p) => PA.exprOk(n, p)).forEach((p, pi) => { ['right', 'left'].forEach((facing) => {
    const o = Object.assign({ pose: p, facing, expr: n }, lk), lab = `${k}${age ? ' puppy' : ''} ${n} ${p} ${facing}`, sv = PA.dog(k, o); n0++;
    good(sv, lab); ok(sv.includes(' pa-ex-' + n), lab + ': the pa-ex class');
    ok(sv.includes(`pa-pose-${p}`), lab + ': the pose class');
  });
  const oi = (pi + KEYS.indexOf(k)) % OUTS.length, out = OUTS[oi]; if (out) { const lab = `${k}${age ? ' puppy' : ''} ${n} ${p} ${JSON.stringify(out)}`; good(PA.dog(k, Object.assign({ pose: p, expr: n, outfit: out }, lk)), lab); n0++; }
  }); });
  EX.forEach((n) => { const hd = PA.dogHead(k, Object.assign({ expr: n }, lk)); good(hd, `${k} head ${n}`); n0++; });
}); });
console.log('   ' + n0 + ' renders');
console.log('-- no expression, unknown, not ok, newborn: the old render');
KEYS.forEach((k) => { ['idle', 'sit', 'sleep', 'walk'].forEach((p) => {
  const base = PA.dog(k, { pose: p });
  ok(PA.dog(k, { pose: p, expr: 'nope' }) === base, k + ' ' + p + ': an unknown expr draws the old render');
  ok(PA.dog(k, { pose: p, expr: null }) === base, k + ' ' + p + ': expr null draws the old render');
  EX.forEach((n) => { if (!PA.exprOk(n, p)) ok(PA.dog(k, { pose: p, expr: n }) === base, k + ' ' + p + ' ' + n + ': not ok for the pose = the old render'); });
  const nb = { coat: { look: { age: 'newborn' } } };
  ok(PA.dog(k, Object.assign({ pose: p, expr: EX[0] }, nb)) === PA.dog(k, Object.assign({ pose: p }, nb)), k + ' ' + p + ': a newborn shows no expression');
}); ok(PA.dogHead(k, { expr: 'nope' }) === PA.dogHead(k), k + ' head: unknown expr = the old head'); });
console.log(`${pass} passed, ${fail} failed`);
if (fail) { fails.forEach((f) => console.log('FAIL ' + f)); process.exit(1); } else console.log('ALL OK');
