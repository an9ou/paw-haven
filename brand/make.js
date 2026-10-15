// Doodle Doggo brand kit: writes the logo, the app icon, the PNG exports and site.webmanifest into brand/.
//   CAVEAT700=/path/Caveat-Bold.ttf CAVEAT600=/path/Caveat-SemiBold.ttf node brand/make.js
// Needs Node with opentype.js, harfbuzzjs (the wordmark is shaped like the browser shapes the title, calt alternates
// included, then turned into paths) and playwright (PNG exports). The dogs are the real crayon art from dogs/pawart_dogs.js.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), out = __dirname;
const INK = '#5B3D32', PINK = '#F28FA5', PAPER = '#FFF8EC', DOT = '#E3D2BA', MUTED = '#8A7468';

// ---------- the crayon dogs ----------
const win = {}; const ctx = { window: win }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
const PA = win.PawArt;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
// a dog placed as a nested svg; vb crops the 240x200 canvas
const dogAt = (key, o, x, y, w, h, vb) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb || '0 0 240 200'}" overflow="visible">${inner(PA.dog(key, Object.assign({ anim: false }, o)))}</svg>`;
// the crayon head: dogHead() draws on a 100x100 canvas (a corgi's ears would reach above it, to y -18)
// the brand's dog (owner pick, 15 Oct 2026): Noodle the dachshund. HEADVB crops dogHead()'s 100x100 canvas square around the head
const HERO = 'dachs', HEADVB = [2, 6, 96, 96];
const headAt = (key, cx, top, h) => { const k = h / HEADVB[3], w = HEADVB[2] * k; return `<svg x="${f1(cx - w / 2)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h)}" viewBox="${HEADVB.join(' ')}" overflow="visible">${inner(PA.dogHead(key))}</svg>`; };

// ---------- pencil lines (the game's own rrPts / wobble / pencilSVG, game/src/00_core.js) ----------
function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const f1 = (n) => Math.round(n * 10) / 10;
function rrPts(x0, y0, x1, y1, r, n) {
  const P = Math.PI; r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  const line = (ax, ay, bx, by) => ({ len: Math.hypot(bx - ax, by - ay), f: (t) => [ax + (bx - ax) * t, ay + (by - ay) * t] });
  const arc = (cx, cy, a0, a1) => ({ len: Math.abs(a1 - a0) * r, f: (t) => { const a = a0 + (a1 - a0) * t; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; } });
  const segs = [line(x0 + r, y0, x1 - r, y0), arc(x1 - r, y0 + r, -P / 2, 0), line(x1, y0 + r, x1, y1 - r), arc(x1 - r, y1 - r, 0, P / 2), line(x1 - r, y1, x0 + r, y1), arc(x0 + r, y1 - r, P / 2, P), line(x0, y1 - r, x0, y0 + r), arc(x0 + r, y0 + r, P, 1.5 * P)];
  const L = segs.reduce((a, g) => a + g.len, 0), pts = [];
  for (let i = 0; i < n; i++) { let d = i / n * L; for (const g of segs) { if (d <= g.len) { pts.push(g.f(g.len ? d / g.len : 0)); break; } d -= g.len; } }
  return pts;
}
function wobble(pts, rnd, amp, start, span) {
  const n = pts.length, s0 = Math.floor(start * n), cnt = Math.floor(span * n), o = [];
  let ox = 0, oy = 0;
  for (let i = 0; i <= cnt; i++) { ox = ox * 0.78 + (rnd() - 0.5) * amp; oy = oy * 0.78 + (rnd() - 0.5) * amp; const p = pts[(s0 + i) % n]; o.push([p[0] + ox, p[1] + oy]); }
  let d = `M${f1(o[0][0])} ${f1(o[0][1])}`;
  for (let i = 1; i < o.length - 1; i++) d += `Q${f1(o[i][0])} ${f1(o[i][1])} ${f1((o[i][0] + o[i + 1][0]) / 2)} ${f1((o[i][1] + o[i + 1][1]) / 2)}`;
  const l = o[o.length - 1]; return d + `L${f1(l[0])} ${f1(l[1])}`;
}
// the double pencil stroke of the game's cards, at a given line weight
function pencil(pts, seed, amp, w) {
  const rnd = seeded(seed), a = wobble(pts, rnd, amp, rnd(), 1.03), b = wobble(pts, rnd, amp * 0.9, rnd(), 0.95);
  return `<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"><path d="${a}" stroke-width="${w}"/><path d="${b}" stroke-width="${f1(w * 0.52)}" opacity=".55"/></g>`;
}
// the cover doodles (doodle() in game/src/00_core.js)
function doodle(kind, x, y, s = 1, rot = 0, sw = 2) {
  const t = `transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"`, st = `stroke="${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  if (kind === 'spark') return `<g ${t}><path d="M0 -14 Q1.5 -1.5 14 0 Q1.5 1.5 0 14 Q-1.5 1.5 -14 0 Q-1.5 -1.5 0 -14Z" fill="#FFE3A1" ${st}/></g>`;
  if (kind === 'heart') return `<g ${t}><path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12Z" fill="#F28FA5" fill-opacity=".75" ${st}/><path d="M-6 -4 Q-3 -7 0 -4" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"/></g>`;
  if (kind === 'paw') return `<g ${t}><ellipse cx="0" cy="6" rx="9" ry="7.5" fill="#E0D5F0" ${st}/><circle cx="-10" cy="-5" r="3.8" fill="#E0D5F0" ${st}/><circle cx="-3.5" cy="-10" r="3.8" fill="#E0D5F0" ${st}/><circle cx="3.5" cy="-10" r="3.8" fill="#E0D5F0" ${st}/><circle cx="10" cy="-5" r="3.8" fill="#E0D5F0" ${st}/></g>`;
  if (kind === 'flower') return `<g ${t}>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-8" rx="5" ry="7" transform="rotate(${a})" fill="#F9D0D9" ${st}/>`).join('')}<circle r="4.5" fill="#FFE3A1" ${st}/></g>`;
  if (kind === 'bone') return `<g ${t}><path d="M-14 -4 Q-20 -10 -14 -12 Q-11 -14 -10 -8 L10 -8 Q11 -14 14 -12 Q20 -10 14 -4 Q20 2 14 4 Q11 6 10 0 L-10 0 Q-11 6 -14 4 Q-20 2 -14 -4Z" fill="#FFF4DF" ${st}/></g>`;
  return '';
}

// ---------- the swash: .logo::after in game/css/11_title.css, border-radius 40% 60% 50% 45% / 60% 40% 55% 45% ----------
function swashPath(x, y, w, h) {
  let r = [[.4, .6], [.6, .4], [.5, .55], [.45, .45]].map(([a, b]) => [a * w, b * h]);
  const f = Math.min(1, w / (r[0][0] + r[1][0]), w / (r[3][0] + r[2][0]), h / (r[0][1] + r[3][1]), h / (r[1][1] + r[2][1]));
  r = r.map(([a, b]) => [a * f, b * f]);
  const [tl, tr, br, bl] = r;
  return `M${f1(x + tl[0])} ${f1(y)}L${f1(x + w - tr[0])} ${f1(y)}A${f1(tr[0])} ${f1(tr[1])} 0 0 1 ${f1(x + w)} ${f1(y + tr[1])}L${f1(x + w)} ${f1(y + h - br[1])}A${f1(br[0])} ${f1(br[1])} 0 0 1 ${f1(x + w - br[0])} ${f1(y + h)}L${f1(x + bl[0])} ${f1(y + h)}A${f1(bl[0])} ${f1(bl[1])} 0 0 1 ${f1(x)} ${f1(y + h - bl[1])}L${f1(x)} ${f1(y + tl[1])}A${f1(tl[0])} ${f1(tl[1])} 0 0 1 ${f1(x + tl[0])} ${f1(y)}Z`;
}

async function main() {
  const ot = require('opentype.js'), hb = await require('harfbuzzjs');
  const fontOf = (p) => { const f = ot.loadSync(p), face = hb.createFace(hb.createBlob(fs.readFileSync(p)), 0); return { f, hf: hb.createFont(face) }; };
  const C7 = fontOf(process.env.CAVEAT700), C6 = fontOf(process.env.CAVEAT600);
  // one word as a path, shaped by HarfBuzz (Caveat's calt alternates, as in the browser); ls = CSS letter-spacing in em
  function word(C, text, F, ls, x0, base) {
    const buf = hb.createBuffer(); buf.addText(text); buf.guessSegmentProperties(); hb.shape(C.hf, buf); const g = buf.json(); buf.destroy();
    const k = F / C.f.unitsPerEm; let x = x0, d = '';
    g.forEach((q) => { d += C.f.glyphs.get(q.g).getPath(x + q.dx * k, base - q.dy * k, F).toPathData(1); x += q.ax * k + ls * F; });
    return { d, w: x - x0 };
  }
  const spaceW = (C, F, ls) => { const buf = hb.createBuffer(); buf.addText(' '); buf.guessSegmentProperties(); hb.shape(C.hf, buf); const a = buf.json()[0].ax; buf.destroy(); return a * F / C.f.unitsPerEm + ls * F; };
  // the title's <h1 class="logo">: "Doodle" rotate(-3deg), "Doggo" rotate(2deg) translateY(4px at 132px), line-height .9,
  // letter-spacing 1px at 132px, the pink swash behind. Returns the group at (x, y) = top-left of the h1 box.
  function wordmark(x, y, F) {
    const ls = 1 / 132, base = 0.78 * F, H = 0.9 * F; // ascent .96, descent .30: half-leading -.18em
    const a = word(C7, 'Doodle', F, ls, 0, base), sp = spaceW(C7, F, ls), b = word(C7, 'Doggo', F, ls, a.w + sp, base);
    const W = a.w + sp + b.w, sw = { x: .04 * W, y: H * (1 - .06 - .26), w: .94 * W, h: .26 * H };
    const g = `<g transform="translate(${f1(x)} ${f1(y)})"><path d="${swashPath(sw.x, sw.y, sw.w, sw.h)}" fill="${PINK}" opacity=".4" transform="rotate(-1.5 ${f1(sw.x + sw.w / 2)} ${f1(sw.y + sw.h / 2)})"/>`
      + `<g fill="${INK}"><path d="${a.d}" transform="rotate(-3 ${f1(a.w / 2)} ${f1(H / 2)})"/><path d="${b.d}" transform="translate(0 ${f1(4 / 132 * F)}) rotate(2 ${f1(a.w + sp + b.w / 2)} ${f1(H / 2)})"/></g></g>`;
    return { g, W, H };
  }
  const svgDoc = (w, h, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
  const dots = (w, h) => `<defs><pattern id="dd-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.3" fill="${DOT}"/></pattern></defs><rect width="${w}" height="${h}" fill="${PAPER}"/><rect width="${w}" height="${h}" fill="url(#dd-dots)"/>`;

  // ---------- 1. horizontal logo: Noodle the dachshund, happy, then the wordmark ----------
  const LF = 124, LW = 900, LH = 280;
  {
    const wm = wordmark(0, 0, LF), dogW = 252, dogH = 252, wx = 262, wy = (LH - wm.H) / 2 + 6;
    const body = `<rect width="${LW}" height="${LH}" fill="${PAPER}"/>`
      + dogAt(HERO, { pose: 'happy' }, 10, 46, dogW, dogW * 160 / 214, '22 40 214 160')
      + wordmark(wx, wy, LF).g
      + doodle('spark', wx + wm.W + 30, wy + 6, 1.15) + doodle('heart', wx + wm.W + 6, wy + wm.H + 18, .8, -10) + doodle('spark', wx - 6, wy - 4, .6);
    fs.writeFileSync(path.join(out, 'doodle-doggo-logo.svg'), svgDoc(LW, LH, body, 'Doodle Doggo'));
  }

  // ---------- 2. app icon: Noodle's crayon head on a rounded cream page with a pencil border ----------
  const swashBlob = (cx, cy, w, h) => `<path d="${swashPath(cx - w / 2, cy - h / 2, w, h)}" fill="${PINK}" opacity=".4" transform="rotate(-6 ${cx} ${cy})"/>`;
  // head = the height of the head with its ears; blob = the pink swash behind the chin
  function icon({ bleed = false, head = 412, border = true, bw = 9, amp = 2.5, dy = 0, blob = true, clip = false } = {}) {
    const S = 512, m = 18, card = bleed ? `<rect width="${S}" height="${S}" fill="${PAPER}"/>` : `<rect x="${m}" y="${m}" width="${S - 2 * m}" height="${S - 2 * m}" rx="104" fill="${PAPER}"/>`;
    const brd = border ? pencil(rrPts(m + 6, m + 6, S - m - 6, S - m - 6, 98, 120), 31, amp, bw) : '';
    const top = (S - head) / 2 + dy, k = head / HEADVB[3], cx = S / 2 - (HEADVB[0] + HEADVB[2] / 2 - 48.5) * k;
    const chin = top + (88 - HEADVB[1]) * k;
    const art = (blob ? swashBlob(S / 2 + 6, chin - 10, head * .62, head * .15) : '') + headAt(HERO, cx, top, head);
    // clip: a bigger face for tiny sizes, the ear tips go under the card's edge
    const cl = clip ? `<defs><clipPath id="dd-card"><rect x="${m + 6}" y="${m + 6}" width="${S - 2 * m - 12}" height="${S - 2 * m - 12}" rx="98"/></clipPath></defs>` : '';
    return svgDoc(S, S, cl + card + (clip ? `<g clip-path="url(#dd-card)">${art}</g>` : art) + brd, 'Doodle Doggo');
  }
  fs.writeFileSync(path.join(out, 'doodle-doggo-icon.svg'), icon());

  // ---------- 3. PNG exports ----------
  const icon32 = icon({ head: 600, bw: 26, amp: 1.5, dy: -66, clip: true }), touch = icon({ bleed: true, border: false, head: 430 }), mask = icon({ bleed: true, border: false, head: 340 });
  const card = (() => {
    const W = 1200, H = 630, F = 140, wm = wordmark(0, 0, F), wx = 468, wy = 180;
    const tag = word(C6, 'a cozy dog game, sketchbook edition', 46, 0, 0, 0), tx = wx + (wm.W - tag.w) / 2, ty = wy + wm.H + 72;
    const url = word(C6, 'doodledoggo.app', 34, 0, 0, 0);
    const body = dots(W, H)
      + pencil(rrPts(28, 28, W - 28, H - 28, 26, 200), 11, 3, 4.6)
      + dogAt(HERO, { pose: 'happy' }, 50, 140, 420, 420 * 160 / 214, '22 40 214 160')
      + wordmark(wx, wy, F).g
      + `<path d="${tag.d}" fill="${INK}" transform="translate(${f1(tx)} ${f1(ty)}) rotate(-1)"/>`
      + `<path d="M${f1(tx - 24)} ${f1(ty + 20)} L${f1(tx + tag.w + 24)} ${f1(ty + 16)}" stroke="#A8968A" stroke-width="2" stroke-dasharray="6 9" stroke-linecap="round" opacity=".8" fill="none"/>`
      + `<path d="${url.d}" fill="${MUTED}" transform="translate(${f1(W - 70 - url.w)} ${H - 66})"/>`
      + doodle('spark', 1105, 110, 1.8) + doodle('heart', 470, 130, 1.4, -12) + doodle('spark', 520, 520, 1, 0) + doodle('paw', 640, 545, 1.1, -20) + doodle('paw', 700, 565, 1.1, -10) + doodle('paw', 760, 548, 1.1, -25) + doodle('flower', 1090, 470, 1.4, 15) + doodle('bone', 900, 112, 1.4, -8);
    return svgDoc(W, H, body, 'Doodle Doggo');
  })();
  // the favicon: the same head cropped close (ears under the edge) and a heavier pencil line, so it reads at 16-32 px
  fs.writeFileSync(path.join(out, 'favicon.svg'), icon32);
  const { chromium } = require('playwright');
  const br = await chromium.launch();
  async function png(svg, w, h, file) {
    const p = await br.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}body>svg{display:block;width:${w}px;height:${h}px}</style>${svg}`);
    await p.screenshot({ path: path.join(out, file), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await p.close();
  }
  const iconSVG = fs.readFileSync(path.join(out, 'doodle-doggo-icon.svg'), 'utf8');
  await png(icon32, 32, 32, 'icon-32.png');
  await png(touch, 180, 180, 'icon-180.png');
  await png(iconSVG, 192, 192, 'icon-192.png');
  await png(iconSVG, 512, 512, 'icon-512.png');
  await png(mask, 512, 512, 'icon-512-maskable.png');
  await png(card, 1200, 630, 'logo-1200x630.png');
  await br.close();

  // ---------- 4. web manifest ----------
  fs.writeFileSync(path.join(out, 'site.webmanifest'), JSON.stringify({
    name: 'Doodle Doggo', short_name: 'Doodle Doggo', start_url: './', scope: './', display: 'standalone',
    background_color: PAPER, theme_color: PAPER,
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: 'doodle-doggo-icon.svg', sizes: 'any', type: 'image/svg+xml' }
    ]
  }, null, 2) + '\n');
  console.log('brand kit written to', out);
}
main().catch((e) => { console.error(e); process.exit(1); });
