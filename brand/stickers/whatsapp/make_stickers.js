// Noodle WhatsApp stickers: 16 die-cut stickers of Noodle (PawArt 'dachs'), a tray icon and a preview sheet.
//
// How to run (from the repo root; needs Node, Playwright with Chromium, Python 3 with Pillow, and network for Google Fonts):
//   ART_ROOT=<checkout of origin/main> NODE_PATH=/opt/node-tools/node_modules node brand/stickers/whatsapp/make_stickers.js
// ART_ROOT is the checkout the dog art is read from (dogs/pawart_dogs.js); use a worktree of origin/main so the stickers use
// the current art:  git worktree add --detach /tmp/dd-main origin/main   then ART_ROOT=/tmp/dd-main. Without it, this checkout is used.
// Pillow: pip install Pillow (used to write the WebP files and to check the margins).
//
// Output (this folder): noodle-01-hi.png/.webp ... noodle-16-so-proud.png/.webp, tray.png, preview.jpg.
// WhatsApp specs kept: each sticker 512x512, transparent, 16 px clear margin on every side, WebP <= 100 KB; tray 96x96 PNG <= 50 KB.
// The dogs are the real art, unchanged: PawArt.dog('dachs', { pose, expr, anim: false, facing }) and PawArt.dogHead.
// Look: a white cut line (about 11 px) with a thin pen-colour (#5B3D32) edge round Noodle and the word together; the word is
// Caveat 700 in a cream pill under the dog, centred, never on the dog.
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const OUT = __dirname, root = path.join(__dirname, '..', '..', '..');
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : root;
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'dogs/pawart_dogs.js'), 'utf8'), ctx);
const PA = win.PawArt;
const INK = '#5B3D32', CREAM = '#FFF8EC', PINK = '#F28FA5';
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10;
// a sticker has no background, so the ground under the dog goes: the faint shadow ellipse and its pencil hatching, the first
// two marks of every PawArt.dog render. The dog itself is not touched.
const GROUND = /(<g[^>]*>)<ellipse [^>]*fill="#5B3D32" opacity="0\.(?:1|06)"\/><path d="[^"]*" stroke="#5B3D32" stroke-width="1\.3" stroke-linecap="round" opacity="0\.(?:4|25)" fill="none"\/>/;
const noGround = (svg, what) => { if (!GROUND.test(svg)) throw new Error(`${what}: no ground shadow found to remove`); return svg.replace(GROUND, '$1'); };

// the set: [file slug, word, pose, expr (or null), extra doodle]
// eat, sleep, rollover and playdead take no face (PawArt.exprOk), so those draw the pose's own face.
const SET = [
  ['hi', 'hi!', 'paw', 'wink'],
  ['yay', 'yay!', 'jump', 'wow'],
  ['love-you', 'love you', 'sit', 'hearts'],
  ['thank-you', 'thank you', 'bow', 'hearts'],
  ['sorry', 'sorry…', 'down', 'guilty'],
  ['yum', 'nom nom', 'sit', 'yum'],
  ['good-night', 'good night', 'sleep', null, 'moon'],
  ['omg', 'omg', 'idle', 'surprised'],
  ['hmm', 'hmm?', 'sit', 'curious'],
  ['on-my-way', 'on my way!', 'walk', 'zoomies'],
  ['lol', 'lol', 'rollover', null],
  ['im-dead', 'I’m dead', 'playdead', null],
  ['lets-dance', 'let’s dance', 'dance', 'zoomies'],
  ['pls', 'pls?', 'beg', 'curious'],
  ['achoo', 'bless me!', 'sit', 'sneeze'],
  ['so-proud', 'so proud', 'happy', 'proud'],
];
const S = 512, M = 16;          // sticker size, WhatsApp clear margin
const CUT = 11;                 // white cut line, px
const BOX = [38, 38, S - 38, S - 38]; // the art and the word stay inside this (margin + cut line + edge + room)
const PILL_H = 66, PILL_FS = 52, GAP = 18;

// ---------- pencil line for the pill (same as brand/instagram/launch/make.js) ----------
function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
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
function pencil(pts, seed, amp, w, col = INK, span = 1.03) {
  const rnd = seeded(seed), a = wobble(pts, rnd, amp, rnd(), span), b = wobble(pts, rnd, amp * 0.9, rnd(), span - 0.08);
  return `<g fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round"><path d="${a}" stroke-width="${w}"/><path d="${b}" stroke-width="${f1(w * 0.52)}" opacity=".55"/></g>`;
}
const box = (x, y, w, h, r, seed, amp = 1.6, lw = 3.4) => pencil(rrPts(x, y, x + w, y + h, r, 90), seed, amp, lw);

// small doodle extras, each centred on (x, y)
const EXTRA = {
  moon: { svg: (x, y) => `<g transform="translate(${x} ${y}) rotate(-12)" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M6 -20 A20 20 0 1 0 14 14 A15 15 0 1 1 6 -20Z" fill="#FFE3A1"/><path d="M20 -12 l0 8 M16 -8 l8 0" fill="none"/></g>` },
};

const PAGE = (body, bg = 'transparent') => `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Gloria+Hallelujah&display=swap" rel="stylesheet"><style>html,body{margin:0;background:${bg}}svg{display:block}</style>${body}`;
// the cut line, white: the art's alpha grown by r (square grow, then blurred and thresholded to a soft round edge), joined with
// a round closing of the art (grown about 2*s1 by a wide blur and a low threshold, shrunk about 2*s2 by a blur and a high
// threshold) so bits a little apart (a ?, hearts, the moon) sit on one piece of sticker. A ring 2 px wider in pen colour,
// slightly soft and dropped by dy, sits under it.
const cutFilter = (r, s1, s2, sd, esd, dy) => `<filter id="cut" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="${r - 4}"/><feGaussianBlur stdDeviation="${sd}"/>
  <feComponentTransfer result="plain"><feFuncA type="linear" slope="6" intercept="-1.4"/></feComponentTransfer>
  <feMorphology in="SourceAlpha" operator="dilate" radius="2"/><feGaussianBlur stdDeviation="${s1}"/>
  <feComponentTransfer><feFuncA type="linear" slope="40" intercept="-0.8"/></feComponentTransfer><feGaussianBlur stdDeviation="${s2}"/>
  <feComponentTransfer><feFuncA type="linear" slope="40" intercept="-38.6"/></feComponentTransfer><feGaussianBlur stdDeviation="${sd / 2}"/>
  <feComponentTransfer result="closed"><feFuncA type="linear" slope="4" intercept="-1.5"/></feComponentTransfer>
  <feComposite in="closed" in2="plain" operator="over" result="white"/>
  <feMorphology in="white" operator="dilate" radius="2"/><feGaussianBlur stdDeviation="${esd}"/><feOffset dy="${dy}" result="eso"/>
  <feFlood flood-color="${INK}" flood-opacity=".55"/><feComposite in2="eso" operator="in" result="inkedge"/>
  <feFlood flood-color="#FFFFFF"/><feComposite in2="white" operator="in" result="whitefill"/>
  <feMerge><feMergeNode in="inkedge"/><feMergeNode in="whitefill"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const FILTER = cutFilter(CUT, 10, 6, 3, 1.6, 1.5);

async function main() {
  const { chromium } = require('playwright');
  const exe = ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: S, height: S } });
  const tmp = path.join(OUT, '.tmp-sticker.html');
  const load = async (html) => { fs.writeFileSync(tmp, html); await page.goto('file://' + tmp); await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200); };
  // a measuring page with the fonts loaded, so the art's own words (ta-da!, oops) count in the box
  const mp = await browser.newPage(); const mtmp = path.join(OUT, '.tmp-measure.html');
  fs.writeFileSync(mtmp, PAGE('<div id="m"></div><svg id="t" width="10" height="10"><text id="tt" font-family="Caveat" font-weight="700" font-size="' + PILL_FS + '">x</text></svg><span style="font-family:Gloria Hallelujah">a</span><span style="font-family:Caveat;font-weight:700">a</span>'));
  await mp.goto('file://' + mtmp); await mp.waitForLoadState('networkidle'); await mp.evaluate(() => document.fonts.ready); fs.unlinkSync(mtmp);
  const bbox = (svg) => mp.evaluate((sv) => { const w = document.getElementById('m'); w.innerHTML = sv; const e = w.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const b = e.getBBox(); w.innerHTML = ''; return [b.x, b.y, b.width, b.height]; }, svg);
  const textW = (s) => mp.evaluate((s) => { const t = document.getElementById('tt'); t.textContent = s; return t.getBBox().width; }, s);
  const rectsOverlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

  const files = [], LAYERS = path.join(OUT, '.layers'); fs.mkdirSync(LAYERS, { recursive: true });
  for (let i = 0; i < SET.length; i++) {
    const [slug, word, pose, expr, extra] = SET[i];
    if (expr && !PA.exprOk(expr, pose)) throw new Error(`${slug}: ${expr} is not ok on ${pose}`);
    const dsvg = noGround(PA.dog('dachs', Object.assign({ pose, anim: false, facing: 'right' }, expr ? { expr } : {})), slug);
    const pad = 3, b0 = await bbox(dsvg), b = [b0[0] - pad, b0[1] - pad, b0[2] + 2 * pad, b0[3] + 2 * pad]; // + room for the art's stroke
    const bw = BOX[2] - BOX[0], bh = BOX[3] - BOX[1];
    const k = Math.min(bw / b[2], (bh - PILL_H - GAP) / b[3]), dw = b[2] * k, dh = b[3] * k;
    const gh = dh + GAP + PILL_H, top = BOX[1] + (bh - gh) / 2, dx = S / 2 - dw / 2;
    const dogR = [dx, top, dx + dw, top + dh];
    const tw = await textW(word), pw = Math.round(tw + 50), px = S / 2 - pw / 2, py = top + dh + GAP;
    const pillR = [px, py, px + pw, py + PILL_H];
    const dogL = `<svg x="${f1(dx)}" y="${f1(top)}" width="${f1(dw)}" height="${f1(dh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(dsvg)}</svg>`;
    const rot = i % 2 ? 1.5 : -1.5;
    const pillL = `<g transform="rotate(${rot} ${S / 2} ${f1(py + PILL_H / 2)})"><rect x="${f1(px)}" y="${f1(py)}" width="${pw}" height="${PILL_H}" rx="${PILL_H / 2}" fill="${CREAM}"/>${box(px, py, pw, PILL_H, PILL_H / 2, 40 + i)}`
      + `<text x="${S / 2}" y="${f1(py + PILL_H / 2 + PILL_FS * 0.3)}" font-family="Caveat" font-weight="700" font-size="${PILL_FS}" fill="${INK}" text-anchor="middle">${word}</text></g>`;
    // the extras sit in free space near the dog; the pixel check after the render makes sure they touch neither the dog nor the word
    let extraL = '';
    if (extra === 'moon') extraL += EXTRA.moon.svg(f1(dogR[0] + dw * 0.56), f1(dogR[1] + 56));
    if (rectsOverlap(dogR, pillR)) throw new Error(`${slug}: the word overlaps the dog`);
    const name = `noodle-${String(i + 1).padStart(2, '0')}-${slug}`;
    const shot = async (body, file, filter) => { await load(PAGE(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><defs>${FILTER}</defs>${filter ? '<g filter="url(#cut)">' + body + '</g>' : body}</svg>`));
      await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: S, height: S } }); };
    await shot(dogL + pillL + extraL, path.join(OUT, name + '.png'), true);
    // the three layers on their own, for the overlap check
    await shot(dogL, path.join(LAYERS, name + '-dog.png')); await shot(pillL, path.join(LAYERS, name + '-word.png')); await shot(extraL, path.join(LAYERS, name + '-extra.png'));
    files.push(name); console.log('drew', name, `dog ${Math.round(dw)}x${Math.round(dh)}`);
  }

  // tray icon: Noodle's happy head, 96x96, thinner cut line
  {
    const hsvg = PA.dogHead('dachs', { expr: 'hearts' });
    const b0 = await bbox(hsvg), pad = 2, b = [b0[0] - pad, b0[1] - pad, b0[2] + 2 * pad, b0[3] + 2 * pad];
    const T = 96, inset = 9, k = Math.min((T - 2 * inset) / b[2], (T - 2 * inset) / b[3]), w = b[2] * k, h = b[3] * k;
    const tf = cutFilter(5, 2, 1.2, 1.2, 0.8, 0.8);
    await page.setViewportSize({ width: T, height: T });
    await load(PAGE(`<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}"><defs>${tf}</defs><g filter="url(#cut)"><svg x="${f1(T / 2 - w / 2)}" y="${f1(T / 2 - h / 2)}" width="${f1(w)}" height="${f1(h)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(hsvg)}</svg></g></svg>`));
    await page.screenshot({ path: path.join(OUT, 'tray.png'), omitBackground: true, clip: { x: 0, y: 0, width: T, height: T } });
  }

  // preview sheet: 4x4 on a chat background, light and dark tiles in a checkerboard
  {
    const T = 300, G = 4, HD = 90, W = T * G, H = T * G + HD;
    let s = `<rect width="${W}" height="${H}" fill="#F7F2EA"/><text x="${W / 2}" y="60" font-family="Caveat" font-weight="700" font-size="52" fill="${INK}" text-anchor="middle">Noodle stickers for WhatsApp · 16 stickers, light and dark chats</text>`;
    s += `<defs><pattern id="lp" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="#D9CFC1"/><path d="M26 28 l6 -4 M28 34 l6 -4" stroke="#D9CFC1" stroke-width="1.5"/></pattern><pattern id="dp" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="#1C2A31"/><path d="M26 28 l6 -4 M28 34 l6 -4" stroke="#1C2A31" stroke-width="1.5"/></pattern></defs>`;
    files.forEach((n, i) => {
      const c = i % G, r = Math.floor(i / G), x = c * T, y = HD + r * T, dark = (c + r) % 2 === 1;
      s += `<rect x="${x}" y="${y}" width="${T}" height="${T}" fill="${dark ? '#0B141A' : '#EFE7DE'}"/><rect x="${x}" y="${y}" width="${T}" height="${T}" fill="url(#${dark ? 'dp' : 'lp'})"/>`
        + `<image href="${n}.png" x="${x + 20}" y="${y + 20}" width="${T - 40}" height="${T - 40}"/>`;
    });
    await page.setViewportSize({ width: W, height: H });
    const html = PAGE(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`, '#fff');
    await load(html);
    await page.screenshot({ path: path.join(OUT, 'preview.jpg'), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: W, height: H } });
  }
  // Pillow: fill any hole inside the cut line with white (a die-cut sticker has none), write the WebP, then check everything:
  // 512x512, a clear 16 px margin, transparent corners, no layer touching another (dog / word / doodle, 4 px apart at least),
  // WebP <= 100 KB, tray 96x96 <= 50 KB
  const py = `
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops
out, lay = sys.argv[1], sys.argv[2]; names = sys.argv[3:]; bad = 0
def mask(f, t=40):
    return Image.open(f).getchannel('A').point(lambda v: 255 if v > t else 0)
def touch(m1, m2, gap=4):
    return ImageChops.multiply(m1.filter(ImageFilter.MaxFilter(2 * gap + 1)), m2).getbbox() is not None
for n in names:
    im = Image.open(os.path.join(out, n + '.png')).convert('RGBA')
    assert im.size == (512, 512), n
    solid = im.getchannel('A').point(lambda v: 255 if v >= 110 else 0)
    ImageDraw.floodfill(solid, (0, 0), 128)
    holes = solid.point(lambda v: 255 if v == 0 else 0)
    nh = sum(1 for v in holes.getdata() if v)
    d, wd, ex = (mask(os.path.join(lay, n + s + '.png')) for s in ('-dog', '-word', '-extra'))
    if nh:  # white over the hole and its inner pen ring, never over the art itself
        art = ImageChops.lighter(ImageChops.lighter(mask(os.path.join(lay, n + '-dog.png'), 0), mask(os.path.join(lay, n + '-word.png'), 0)), mask(os.path.join(lay, n + '-extra.png'), 0)).filter(ImageFilter.MaxFilter(5))
        region = ImageChops.subtract(holes.filter(ImageFilter.MaxFilter(11)), art)
        im = Image.composite(Image.new('RGBA', im.size, (255, 255, 255, 255)), im, region); im.save(os.path.join(out, n + '.png'), optimize=True)
    a = im.getchannel('A'); w, h = im.size; M = 16
    edge = max(max(a.crop((0, 0, w, M)).getdata()), max(a.crop((0, h - M, w, h)).getdata()), max(a.crop((0, 0, M, h)).getdata()), max(a.crop((w - M, 0, w, h)).getdata()))
    over = [k for k, (p, q) in {'dog/word': (d, wd), 'dog/doodle': (d, ex), 'word/doodle': (wd, ex)}.items() if q.getbbox() and touch(p, q)]
    q = 92
    while True:
        im.save(os.path.join(out, n + '.webp'), 'WEBP', quality=q, method=6)
        kb = os.path.getsize(os.path.join(out, n + '.webp')) / 1024
        if kb <= 99 or q <= 50: break
        q -= 6
    ok = edge == 0 and kb <= 100 and not over
    bad += not ok
    print(f"{n}: webp {kb:.1f} KB (q{q}), png {os.path.getsize(os.path.join(out, n + '.png'))/1024:.1f} KB, margin alpha max {edge}, holes filled {nh} px, ink box {a.getbbox()}" + (f", OVERLAP {over}" if over else '') + ('' if ok else '  <-- FAIL'))
t = Image.open(os.path.join(out, 'tray.png'))
tk = os.path.getsize(os.path.join(out, 'tray.png')) / 1024
print(f"tray.png: {t.size} {tk:.1f} KB"); bad += t.size != (96, 96) or tk > 50
sys.exit(1 if bad else 0)
`;
  let failed = false;
  try { execFileSync('python3', ['-c', py, OUT, LAYERS, ...files], { stdio: 'inherit' }); } catch (e) { failed = true; }
  fs.rmSync(LAYERS, { recursive: true, force: true });

  // preview sheet: 4x4 on a chat background, light and dark tiles in a checkerboard
  {
    const T = 300, G = 4, HD = 90, W = T * G, H = T * G + HD;
    let s = `<rect width="${W}" height="${H}" fill="#F7F2EA"/><text x="${W / 2}" y="60" font-family="Caveat" font-weight="700" font-size="52" fill="${INK}" text-anchor="middle">Noodle stickers for WhatsApp · 16 stickers, light and dark chats</text>`;
    s += `<defs><pattern id="lp" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="#D9CFC1"/><path d="M26 28 l6 -4 M28 34 l6 -4" stroke="#D9CFC1" stroke-width="1.5"/></pattern><pattern id="dp" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="#1C2A31"/><path d="M26 28 l6 -4 M28 34 l6 -4" stroke="#1C2A31" stroke-width="1.5"/></pattern></defs>`;
    files.forEach((n, i) => {
      const c = i % G, r = Math.floor(i / G), x = c * T, y = HD + r * T, dark = (c + r) % 2 === 1;
      s += `<rect x="${x}" y="${y}" width="${T}" height="${T}" fill="${dark ? '#0B141A' : '#EFE7DE'}"/><rect x="${x}" y="${y}" width="${T}" height="${T}" fill="url(#${dark ? 'dp' : 'lp'})"/>`
        + `<image href="${n}.png" x="${x + 20}" y="${y + 20}" width="${T - 40}" height="${T - 40}"/>`;
    });
    await page.setViewportSize({ width: W, height: H });
    const html = PAGE(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`, '#fff');
    await load(html);
    await page.screenshot({ path: path.join(OUT, 'preview.jpg'), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: W, height: H } });
  }
  fs.unlinkSync(tmp); await browser.close();
  if (failed) { console.error('sticker checks failed'); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
