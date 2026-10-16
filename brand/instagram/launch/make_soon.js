// "More dogs are coming. Stay tuned." teaser post (1080 x 1350): mystery silhouettes peek over a fence, the dogs we already know wonder who they are.
// No dog types, dates or promises are shown on purpose.
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, doodle, txt, lines, box, line, swash, paper, svgPage, frame, tape, PA, inner, seeded, INK, PINK, MUTED, ORANGE } = h;
  const W = 1080, H = 1350;
  const rnd = seeded(77);
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const b = e.getBBox(); return [b.x, b.y, b.width, b.height]; }, svg);
  const fit = async (key, o, cx, bottom, maxW, maxH) => { const sv = PA.dog(key, Object.assign({ anim: false }, o)), b = await bbox(sv), k = Math.min(maxW / b[2], maxH / b[3]), w = b[2] * k, hh = b[3] * k; return { x: cx - w / 2, y: bottom - hh, w, h: hh, svg: `<svg x="${f1(cx - w / 2)}" y="${f1(bottom - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>` }; };
  const small = (cx, y, w, hh, fillc, seed, rot = 0) => `<g transform="rotate(${rot} ${cx} ${y + hh})">${w ? '' : ''}</g>`;
  // a mystery head: a flat warm-grey blob with two eyes and ears of a different shape each time
  const mystery = (cx, top, w, kind, col, rot) => {
    const hh = w * 0.82, cy = top + hh / 2, dk = '#4F443E', st = `stroke="${INK}" stroke-width="4" stroke-linejoin="round"`;
    const ear = {
      floppy: `<ellipse cx="${cx - w * 0.5}" cy="${cy + hh * 0.08}" rx="${w * 0.14}" ry="${hh * 0.42}" fill="${dk}" ${st} transform="rotate(12 ${cx - w * 0.5} ${cy})"/><ellipse cx="${cx + w * 0.5}" cy="${cy + hh * 0.08}" rx="${w * 0.14}" ry="${hh * 0.42}" fill="${dk}" ${st} transform="rotate(-12 ${cx + w * 0.5} ${cy})"/>`,
      fold: `<path d="M${cx - w * 0.46} ${cy - hh * 0.18}L${cx - w * 0.3} ${top - hh * 0.12}L${cx - w * 0.06} ${top + hh * 0.06}Q${cx - w * 0.3} ${cy - hh * 0.12} ${cx - w * 0.46} ${cy - hh * 0.18}Z M${cx + w * 0.46} ${cy - hh * 0.18}L${cx + w * 0.3} ${top - hh * 0.12}L${cx + w * 0.06} ${top + hh * 0.06}Q${cx + w * 0.3} ${cy - hh * 0.12} ${cx + w * 0.46} ${cy - hh * 0.18}Z" fill="${dk}" ${st}/>`,
      bat: `<path d="M${cx - w * 0.44} ${cy - hh * 0.1}Q${cx - w * 0.6} ${top - hh * 0.5} ${cx - w * 0.3} ${top - hh * 0.4}Q${cx - w * 0.12} ${top - hh * 0.2} ${cx - w * 0.12} ${top + hh * 0.1}Z M${cx + w * 0.44} ${cy - hh * 0.1}Q${cx + w * 0.6} ${top - hh * 0.5} ${cx + w * 0.3} ${top - hh * 0.4}Q${cx + w * 0.12} ${top - hh * 0.2} ${cx + w * 0.12} ${top + hh * 0.1}Z" fill="${col}" ${st}/>`,
      curly: [[-0.34, -0.02, 0.2], [-0.12, -0.2, 0.22], [0.14, -0.2, 0.22], [0.36, -0.02, 0.2], [-0.52, 0.2, 0.17], [0.52, 0.2, 0.17]].map(([a2, b2, r]) => `<circle cx="${cx + a2 * w}" cy="${top + hh * 0.25 + b2 * hh}" r="${r * w}" fill="${dk}" ${st}/>`).join(''),
      oneup: `<path d="M${cx - w * 0.4} ${cy - hh * 0.12}L${cx - w * 0.3} ${top - hh * 0.36}L${cx - w * 0.06} ${top + hh * 0.08}Z" fill="${dk}" ${st}/><ellipse cx="${cx + w * 0.5}" cy="${cy + hh * 0.05}" rx="${w * 0.13}" ry="${hh * 0.38}" fill="${dk}" ${st} transform="rotate(-14 ${cx + w * 0.5} ${cy})"/>`,
    }[kind];
    const eye = (ex) => `<circle cx="${ex}" cy="${cy - hh * 0.06}" r="${w * 0.1}" fill="#fff" stroke="${INK}" stroke-width="3.4"/><circle cx="${ex + (ex < cx ? 4 : -4)}" cy="${cy - hh * 0.04}" r="${w * 0.045}" fill="${INK}"/>`;
    return `<g transform="rotate(${rot} ${cx} ${top + hh})">${ear}<ellipse cx="${cx}" cy="${cy}" rx="${w * 0.5}" ry="${hh * 0.5}" fill="${col}" stroke="${INK}" stroke-width="4.4"/><ellipse cx="${cx}" cy="${cy + hh * 0.2}" rx="${w * 0.24}" ry="${hh * 0.2}" fill="#B9A99D" stroke="${INK}" stroke-width="3"/>${eye(cx - w * 0.17)}${eye(cx + w * 0.17)}<ellipse cx="${cx}" cy="${cy + hh * 0.12}" rx="${w * 0.08}" ry="${hh * 0.06}" fill="#3E3A38"/></g>`;
  };
  const bubble = (x, y, w, hh, tx, ty, ls, seed, fs = 40) => `<g><path d="M${x + w / 2 - 22} ${y + hh - 2}L${tx} ${ty}L${x + w / 2 + 20} ${y + hh - 2}Z" fill="#FFFBF2"/>${box(x, y, w, hh, 26, seed, 2.2, 4)}<path d="M${x + w / 2 - 22} ${y + hh}L${tx} ${ty}L${x + w / 2 + 20} ${y + hh}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="${x + w / 2 - 19}" y="${y + hh - 6}" width="38" height="9" fill="#FFFBF2"/>${lines(ls, x + w / 2, y + 16 + fs, fs, fs + 6, { w: 600 })}</g>`;

  let g = paper(W, H) + frame(W, H, 99)
    + txt('coming soon', 100, 92, 44, { fill: '#D8607E', anchor: 'start' })
    + lines(['More dogs', 'are coming!'], 540, 226, 150, 132, { rot: -2 })
    + swash(540, 436, 520, 70, -2, PINK, 0.5) + txt('stay tuned', 540, 452, 78, { rot: -1.5 })
    + doodle('spark', 130, 250, 1.4) + doodle('spark', 960, 330, 1.2) + doodle('heart', 960, 130, 1.1, 12);
  // lawn
  g += swash(540, 1190, 960, 220, 0, '#CDD39B', 0.8) + swash(540, 1230, 880, 120, 0, '#B6BF84', 0.5);
  for (let i = 0; i < 70; i++) { const x = 70 + rnd() * 940, y = 1080 + rnd() * 190; g += line([[x - 6, y], [x - 2, y - 14 - rnd() * 8]], 200 + i, 1, 2.6, '#8C9A5C', 0.9) + line([[x + 4, y], [x + 4, y - 18 - rnd() * 8]], 300 + i, 1, 2.6, '#8C9A5C', 0.9); }
  // the mystery heads behind the fence
  const heads = [[150, 'floppy', '#7A6A60', -6], [340, 'fold', '#8A7B70', 5], [530, 'bat', '#6F625B', -4], [720, 'curly', '#8A7B70', 6], [905, 'oneup', '#7A6A60', -5]];
  heads.forEach(([x, kind, col, rot], i) => { g += mystery(x, 536 + (i % 2) * 22, 168, kind, col, rot); g += txt('?', x + (i % 2 ? 66 : -66), 556 + (i % 2) * 22, 80, { rot: i % 2 ? 12 : -12, fill: '#D8607E' }); });
  // the fence
  const fence = (x0, x1, base, hh) => { let s2 = ''; for (let x = x0; x < x1; x += 46) s2 += `<path d="M${x} ${base}V${base - hh + 18}Q${x} ${base - hh} ${x + 21} ${base - hh}Q${x + 42} ${base - hh} ${x + 42} ${base - hh + 18}V${base}Z" fill="#E8CFA2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${x + 10} ${base - hh + 30}V${base - 8}" stroke="#C9A878" stroke-width="2" opacity=".7"/>`; return s2 + `<rect x="${x0}" y="${base - hh * 0.72}" width="${x1 - x0}" height="14" fill="#D9B880" stroke="${INK}" stroke-width="2.6"/><rect x="${x0}" y="${base - hh * 0.3}" width="${x1 - x0}" height="14" fill="#D9B880" stroke="${INK}" stroke-width="2.6"/>`; };
  g += fence(56, 1024, 860, 190);
  // the dogs we know, in front of the fence
  const cast = [['dachs', 'happy', 250, 390, { eyes: 'Heart Sunglasses', neck: 'Red Bandana' }, 250], ['corgi', 'happy', 640, 260, null, 215], ['shiba', 'sit', 915, 220, null, 235]];
  for (const [k, pose, cx, mw, outfit, mh] of cast) { const d = await fit(k, { pose, outfit: outfit || undefined }, cx, 1215, mw, mh); g += `<ellipse cx="${f1(cx)}" cy="1211" rx="${f1(mw * 0.4)}" ry="9" fill="#5B3D32" opacity=".14"/>` + d.svg; }
  g += bubble(90, 880, 330, 120, 340, 1040, ['who is behind', 'the fence?'], 6, 38) + bubble(500, 880, 290, 120, 660, 1012, ['snacks?', 'it is snacks.'], 7, 38);
  g += txt('Doodle Doggo · coming soon · follow along to meet them first', 540, 1312, 36, { fill: MUTED, w: 600 });
  await render(svgPage(W, H, g), W, H, 'soon-more-dogs-coming.jpg');
  await mp.close();
};
