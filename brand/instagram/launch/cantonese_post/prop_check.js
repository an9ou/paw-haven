// Owner, 16 Nov 2026 (Cantonese poster): speech bubbles, dogs and cards never sit on or touch the scene's props (lanterns, torii, bench...).
// A pixel check, not a box check: the props layer (every <g data-prop> the game's floor kit marks, inside the scene group) and each of our
// items are screenshotted alone on a transparent page; an item fails when any of its solid pixels lies within `gap` px of a solid prop pixel.
// Faint pixels (alpha < 100: the props' and dogs' ground shadows at opacity .12, light hatching) do not count.
//
//   const { propCheck } = require('./prop_check.js');
//   const bad = await propCheck(page, { scene: '#scene', items: ['bubble Noodle', 'dog dachs', ...], gap: 12 });  // [] when all clear
async function propCheck(page, o) {
  const gap = o.gap == null ? 12 : o.gap, W = page.viewportSize().width, H = page.viewportSize().height;
  const shot = async (css) => {
    await page.evaluate((c) => { const s = document.createElement('style'); s.id = 'pc-style'; s.textContent = c; document.head.appendChild(s); }, css);
    const buf = await page.screenshot({ type: 'png', omitBackground: true });
    await page.evaluate(() => document.getElementById('pc-style').remove());
    return buf.toString('base64');
  };
  // everything hidden but what is shown; clip paths, masks, patterns and markers stay live (a hidden clip-path child would clip all away)
  const hideAll = 'html,body{background:transparent!important}svg *{visibility:hidden!important}clipPath,clipPath *,mask,mask *,pattern,pattern *,marker,marker *,defs *{visibility:visible!important}';
  const props = await shot(hideAll + `${o.scene} [data-prop],${o.scene} [data-prop] *{visibility:visible!important}`);
  if (process.env.PROPMASK) require('fs').writeFileSync(process.env.PROPMASK, Buffer.from(props, 'base64'));
  const items = [];
  for (const n of o.items) items.push([n, await shot(hideAll + `[data-item="${n}"],[data-item="${n}"] *{visibility:visible!important}`)]);
  return page.evaluate(async ({ props, items, gap, W, H }) => {
    const alpha = (b64) => new Promise((res) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data, a = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3] >= 100 ? 1 : 0; res(a); }; im.src = 'data:image/png;base64,' + b64; });
    const P = await alpha(props), T = new Uint8Array(W * H), D = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) { let last = -1e9; for (let x = 0; x < W; x++) { if (P[y * W + x]) last = x; T[y * W + x] = x - last <= gap ? 1 : 0; }
      last = 1e9; for (let x = W - 1; x >= 0; x--) { if (P[y * W + x]) last = x; if (last - x <= gap) T[y * W + x] = 1; } }
    for (let x = 0; x < W; x++) { let last = -1e9; for (let y = 0; y < H; y++) { if (T[y * W + x]) last = y; D[y * W + x] = y - last <= gap ? 1 : 0; }
      last = 1e9; for (let y = H - 1; y >= 0; y--) { if (T[y * W + x]) last = y; if (last - y <= gap) D[y * W + x] = 1; } }
    const bad = [];
    for (const [n, b64] of items) { const A = await alpha(b64); let k = 0, l = W, t = H, r = 0, b = 0;
      for (let i = 0; i < W * H; i++) if (A[i] && D[i]) { k++; const x = i % W, y = (i / W) | 0; l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
      if (k) bad.push(n + ' comes within ' + gap + ' px of a scene prop (' + k + ' px, around ' + [l, t, r, b].join(',') + ')'); }
    return bad;
  }, { props, items, gap, W, H });
}
module.exports = { propCheck };
