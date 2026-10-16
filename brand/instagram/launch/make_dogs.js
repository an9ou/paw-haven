// "Meet the dogs" introduction posts: one dog per post, the whole dog and a puppy, the name and its character.
// The game's own facts (breed, likes, joke) come from game/src/00_core.js; the traits below are the creative part.
const fs = require('fs'), path = require('path');
module.exports = async function ({ render, browser, helpers: h, only }) {
  const { f1, doodle, txt, lines, box, arrow, dog, paper, svgPage, frame, tape, swash, PA, inner, INK, PINK, MUTED, ORANGE } = h;
  const W = 1080, H = 1350;
  fs.mkdirSync(path.join(h.OUT, 'dogs'), { recursive: true });
  const item = (name, x, y, s) => { const sv = PA.item(name); return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 64 64" overflow="visible">${inner(sv)}</svg>`; };
  // a dirt mound with a bone poking out (for 'digging')
  const digIcon = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 64})"><ellipse cx="32" cy="54" rx="28" ry="6" fill="#5B3D32" opacity=".16"/><path d="M4 54Q8 24 32 22Q56 24 60 54Z" fill="#B98F68" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/><path d="M14 44l8 -2M34 36l8 3M26 48l8 0" stroke="#8A6A48" stroke-width="2.4" stroke-linecap="round"/><g transform="translate(34 16) rotate(-30) scale(.55)"><path d="M-14 -4 Q-20 -10 -14 -12 Q-11 -14 -10 -8 L10 -8 Q11 -14 14 -12 Q20 -10 14 -4 Q20 2 14 4 Q11 6 10 0 L-10 0 Q-11 6 -14 4 Q-20 2 -14 -4Z" fill="#FFF4DF" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/></g></g>`;
  // a speech bubble with a tail pointing at (tx, ty)
  const bubble = (x, y, w, hh, tx, ty, ls, seed) => {
    const cx = x + w / 2, bx = Math.max(x + 60, Math.min(x + w - 60, tx));
    return `<g><path d="M${bx - 26} ${y + hh - 2}L${tx} ${ty}L${bx + 24} ${y + hh - 2}Z" fill="#FFFBF2"/>${box(x, y, w, hh, 30, seed, 2.4, 4.2)}<path d="M${bx - 26} ${y + hh}L${tx} ${ty}L${bx + 24} ${y + hh}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="${bx - 22}" y="${y + hh - 6}" width="44" height="9" fill="#FFFBF2"/>${lines(ls, cx, y + 66, 52, 54, { w: 600 })}</g>`;
  };
  // real outline of a dog in its 240x200 canvas (getBBox), so adults and puppies are sized by what is drawn
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = async (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const b = e.getBBox(); return [b.x, b.y, b.width, b.height]; }, svg);
  const fit = async (key, o, x, bottom, w) => { const b = await bbox(PA.dog(key, Object.assign({ anim: false }, o))), k = w / b[2], hh = b[3] * k; return { x, y: bottom - hh, w, h: hh, svg: `<svg x="${f1(x)}" y="${f1(bottom - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(PA.dog(key, Object.assign({ anim: false }, o)))}</svg>` }; };
  const post = async (d) => {
    const A = await fit(d.key, { pose: d.pose || 'happy' }, 52, 800, d.dw || 770);
    const P = await fit(d.key, { pose: d.puppyPose || 'happy', age: 'puppy', facing: 'left' }, 626, 1036, d.pw || 370);
    let g = paper(W, H) + frame(W, H, 40 + d.num)
      + txt('meet the dogs', 100, 92, 44, { fill: '#D8607E', anchor: 'start' }) + txt(`dog ${d.num} of 14`, 990, 92, 44, { fill: MUTED, w: 600, anchor: 'end' })
      + txt(d.name, 70, 262, d.nameSize || 200, { rot: -3, anchor: 'start' }) + txt(d.title, 84, 336, 60, { fill: MUTED, w: 600, anchor: 'start' })
      + bubble(590, 124, 430, 156, 740, A.y + A.h * 0.08, d.quote, 9)
      + swash(A.x + A.w / 2, 796, A.w * 0.9, 60, -2, PINK, 0.45) + swash(P.x + P.w / 2, 1032, P.w * 0.95, 44, 2, '#FFE3A1', 0.6)
      + A.svg + P.svg
      + txt(`a ${d.name} puppy`, P.x + P.w / 2, 1076, 40, { w: 700, rot: 2 })
      // what it loves: the game's own item icons
      + txt('loves', 100, 892, 50, { fill: '#D8607E', anchor: 'start' })
      + d.loves.map(([name, label], i) => (name ? item(name, 80 + i * 170, 906, 110) : digIcon(80 + i * 170, 906, 110)) + txt(label, 135 + i * 170, 1048, 32, { w: 600, fill: MUTED })).join('')
      + doodle('heart', 1012, 330, 1.1, 12) + doodle('spark', 560, 420, 0.9) + doodle('spark', 80, 470, 0.8) + doodle('heart', 540, 860, 0.9, -10);
    // the four traits
    d.traits.forEach(([t, sub], i) => {
      const x = 60 + (i % 2) * 490, y = 1092 + Math.floor(i / 2) * 100;
      g += `<g transform="rotate(${i % 2 ? 0.8 : -0.8} ${x + 235} ${y + 45})">${box(x, y, 470, 90, 30, 70 + i, 2.2, 3.8)}<circle cx="${x + 36}" cy="${y + 47}" r="15" fill="${PINK}" fill-opacity=".7" stroke="${INK}" stroke-width="3"/>${txt(t, x + 66, y + 44, 44, { anchor: 'start', w: 700 })}${txt(sub, x + 66, y + 80, 31, { anchor: 'start', fill: MUTED, w: 600 })}</g>`;
    });
    g += txt('Doodle Doggo · free in your browser · link in bio', 540, 1312, 36, { fill: MUTED, w: 600 });
    return svgPage(W, H, g);
  };
  const DOGS = [
    { key: 'dachs', num: 4, name: 'Noodle', title: 'the dachshund', quote: ['The rest of me', 'is on its way.'],
      loves: [['Bone-shaped Biscuit', 'bone biscuit'], ['Squeaky Duck', 'squeaky duck'], [null, 'digging']],
      traits: [['lazy', 'naps like it is a job'], ['attention seeking', 'squeaks the duck till you look'], ['curious digger', 'something smells like treasure'], ['very, very long', 'the rest of him is on its way']] },
  ];
  for (const d of DOGS) if (!only || only === d.key) await render(await post(d), W, H, `dogs/dog-${String(d.num).padStart(2, '0')}-${d.name.toLowerCase()}.jpg`);
  await mp.close();
};
