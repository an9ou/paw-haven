// v2.13 expression sheets for review (V213.md 3). Plain node: node tools/expr_sheet.js [outDir] [names]   (default game/shots_v213, every expression)
// Writes one HTML page per expression: every breed in a row, the plain idle face, then the expression on idle, sit, a third ok pose, the puppy,
// a hat, the Heart Sunglasses and a costume, and the head chip. Open it in a browser (or Playwright) and screenshot it. Frames are still (anim off).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
const sb = { window: {} }; vm.createContext(sb); vm.runInContext(SRC, sb); const PA = sb.window.PawArt;
const out = path.resolve(process.argv[2] || path.join(ROOT, 'game', 'shots_v213')), only = (process.argv[3] || '').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });
const css = (SRC.match(/const css=`([\s\S]*?)`;/) || [, ''])[1];
const POSES = ['idle', 'happy', 'pet', 'walk', 'jump', 'sit', 'crouch', 'shake', 'dig', 'beg', 'paw', 'down', 'dance', 'bow', 'sniff', 'dirty', 'cold', 'hot', 'scratch'];
const cell = (svg, cap) => `<figure><div class="a">${svg}</div><figcaption>${cap}</figcaption></figure>`;
(only.length ? only : PA.EXPR_LIST).forEach((n) => {
  const ok = POSES.filter((p) => PA.exprOk(n, p)), third = ok.find((p) => p !== 'idle' && p !== 'sit') || 'idle';
  const rows = PA.DOGS.map((d, i) => { const k = d.key, pup = { coat: { look: { age: 'puppy' } } }, e = (o) => PA.dog(k, Object.assign({ anim: false, expr: n }, o));
    return `<div class="row"><b>${d.breed}</b>` + [
      cell(PA.dog(k, { anim: false, pose: 'idle' }), 'plain'), cell(e({ pose: 'idle' }), 'idle'), cell(e({ pose: 'sit' }), 'sit'), cell(e({ pose: third }), third),
      cell(e(Object.assign({ pose: 'idle' }, pup)), 'puppy'), cell(e({ pose: 'idle', outfit: { head: ['Party Hat', 'Wizard Hat', 'Cowboy Hat', 'Flower Crown'][i % 4] } }), 'hat'),
      cell(e({ pose: 'sit', outfit: { eyes: 'Heart Sunglasses', neck: 'Red Bandana' } }), 'glasses'),
      cell(e({ pose: 'idle', outfit: { body: ['Little Bat Costume', 'Pumpkin Patch Suit', 'Trick-or-Treat Ghost', 'Ghost Sheet'][i % 4] } }), 'costume'),
      cell(PA.dogHead(k, { expr: n }), 'head')].join('') + '</div>'; }).join('');
  fs.writeFileSync(path.join(out, `expr_${n}.html`), `<!doctype html><meta charset="utf-8"><title>${n}</title><style>${css}
body{font:13px sans-serif;background:#FBF6EA;margin:8px}.row{display:flex;align-items:center;gap:4px;border-bottom:1px solid #ddd}.row b{width:110px;flex:none}
figure{margin:0;text-align:center}.a svg{width:120px;height:100px;display:block}figure .a .pa-dog-head{width:80px;height:80px;margin:10px 20px}figcaption{color:#888;font-size:11px}</style>
<h2>${n}: ok on ${ok.join(', ')}</h2>${rows}`);
});
console.log('wrote', out);
