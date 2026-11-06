// Our friend card for the Friends Reel, its RedNote cut and the carousel, drawn the way the v2.19 game's frCardSVG (game/src/50_friends.js) draws it:
// the card art PawArt.FRIENDS.card(''), the QR of the invite link in its white tile, the friend name above the code line, and the code on the line in
// DD Code (the game's subset of Atkinson Hyperlegible Bold, so S/5, Z/2 and B/8 read apart; GM briefing 2 Nov 2026). Texts too wide for their room step
// down as the game's frFit does (FIT_JS, run in the page after the card is drawn). RedNote (rn): no link and no QR ever, a pink paw sits in the QR tile.
const path = require('path'), fs = require('fs'), vm = require('vm');
function loadArt(DEV) {
  const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
  for (const f of fs.readdirSync(path.join(DEV, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(DEV, 'world', f), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(DEV, 'mods', 'qr.js'), 'utf8'), ctx);
  const PA = win.PawArt; if (!PA.FRIENDS || !PA.FRIENDS.card) throw new Error('no PawArt.FRIENDS in ' + DEV + ': use the v2.19 build');
  const fr = fs.readFileSync(path.join(DEV, 'game', 'src', '50_friends.js'), 'utf8');
  const link = (fr.match(/const FR_LINK = '([^']+)'/) || [])[1], css = (fr.match(/const FR_CODE_FONT_CSS = "([^"]+)";/) || [])[1];
  if (!link) throw new Error('FR_LINK changed'); if (!css || !/DD Code/.test(css)) throw new Error('FR_CODE_FONT_CSS changed in 50_friends.js');
  return { PA, QR: win.PawQR, link, css };
}
const INK = '#5B3D32';
// code '' = the placeholder card (no code, no QR); nameFont: the face for the name ('Caveat' or 'LXGW WenKai')
function cardSVG(art, { code, name, nameFont, rn }) {
  const { PA, QR, link } = art, box = PA.FRIENDS.cardQR, L = PA.FRIENDS.cardLine || { x1: 166, x2: 278, y: 136, cx: 222 };
  let qr = '';
  if (code && rn) { const cx = box.x + box.w / 2, cy = box.y + box.w / 2, u = box.w / 10;
    qr = [[0, 1.2, 2.2], [-2.2, -1.2, 1.1], [-0.8, -2.6, 1.1], [0.8, -2.6, 1.1], [2.2, -1.2, 1.1]].map(([x, y, r]) => `<circle cx="${(cx + x * u).toFixed(2)}" cy="${(cy + y * u).toFixed(2)}" r="${(r * u).toFixed(2)}" fill="#F28FA5"/>`).join(''); }
  else if (code) { const M = QR.matrix(link + code), n = M.length, s = box.w / (n + 4);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (M[r][c]) qr += `<rect x="${(box.x + (c + 2) * s).toFixed(2)}" y="${(box.y + (r + 2) * s).toFixed(2)}" width="${(s + 0.15).toFixed(2)}" height="${(s + 0.15).toFixed(2)}" fill="${INK}"/>`; }
  const size = name.length > 16 ? 15 : name.length > 12 ? 18 : 22;
  const nm = `<text class="fr-fit" data-max="108" data-fs="${size}" x="222" y="104" text-anchor="middle" font-family="${nameFont}" style="font-family:${nameFont}" font-weight="700" font-size="${size}" fill="${INK}">${name}</text>`;
  const cd = code ? `<text class="fr-fit" data-max="${L.x2 - L.x1 - 4}" data-fs="19" x="${L.cx}" y="${L.y - 5}" text-anchor="middle" font-family="DD Code" style="font-family:'DD Code'" font-weight="700" font-size="19" letter-spacing=".4" fill="${INK}">${code}</text>` : '';
  return PA.FRIENDS.card('').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') + qr + nm + cd;
}
// the game's frFit, one line only: a text wider than data-max steps its size down (to 70% at most), then is squeezed
const FIT_JS = `function frFit(root){ (root||document).querySelectorAll('text.fr-fit').forEach((el)=>{ const max=+el.dataset.max, fs=+el.dataset.fs;
  el.removeAttribute('textLength'); el.removeAttribute('lengthAdjust'); el.setAttribute('font-size',fs); let w=el.getComputedTextLength(); if(!(w>max)) return;
  el.setAttribute('font-size',(fs*Math.max(0.7,max/w)).toFixed(1)); w=el.getComputedTextLength(); if(w>max){ el.setAttribute('textLength',max); el.setAttribute('lengthAdjust','spacingAndGlyphs'); } }); }`;
// the dogs' drawn boxes (capture_*.js boxes.json, CSS px of the 393 x 659 phone) as invisible rects marked data-apart, for apartCheck() (owner, 6 Nov 2026:
// dogs never overlap or touch). map(x, y) takes CSS px to the page's units; clip [x0, y0, x1, y1] in CSS px (the part of the screen shown) or null
function apartRects(boxes, map, clip) {
  return (boxes || []).map((d) => { let [l, t, r, b] = d.b; if (clip) { l = Math.max(l, clip[0]); t = Math.max(t, clip[1]); r = Math.min(r, clip[2]); b = Math.min(b, clip[3]); }
    if (r - l < 2 || b - t < 2) return ''; const [x0, y0] = map(l, t), [x1, y1] = map(r, b);
    return `<rect data-apart="${d.n}" x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="${(y1 - y0).toFixed(1)}" fill="none" stroke="none"/>`; }).join('');
}
module.exports = { loadArt, cardSVG, FIT_JS, apartRects };
