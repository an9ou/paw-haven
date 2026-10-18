// Doodle Doggo launch images (Instagram posts, banner tiles, grid mockup, highlight covers).
//   1) node game/build.js && node game/harness.js merged && node brand/instagram/launch/shots.js <shotsdir>   (in-game screenshots)
//   2) NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/make.js <shotsdir> [posts|banner|grid|covers|all]
// The dogs and props are the real art (dogs/pawart_dogs.js, world/pawart_world_b.js); the pictures are real game screenshots.
// Text is Caveat (Google Fonts, needs network). Output: JPEG for posts/tiles (lean), PNG for covers and profile pictures.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..', '..'), OUT = __dirname;
const SHOTS = path.resolve(process.argv[2] || 'shots'), WHAT = process.argv[3] || 'all';
const INK = '#5B3D32', PINK = '#F28FA5', PAPER = '#FFF8EC', DOT = '#E3D2BA', MUTED = '#8A7468', ORANGE = '#E8863A', PLUM = '#7A5C9E';

// ---------- the real art ----------
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10;
// a dog at x,y with width w; the crop 'vb' trims the 240x200 canvas (feet on y=186)
const DOGVB = '22 40 214 160';
const dog = (key, o, x, y, w, vb = DOGVB) => { const [, , vw, vh] = vb.split(' ').map(Number); return `<svg x="${x}" y="${y}" width="${w}" height="${f1(w * vh / vw)}" viewBox="${vb}" overflow="visible">${inner(PA.dog(key, Object.assign({ anim: false }, o)))}</svg>`; };
const prop = (name, o, x, y, w, h) => { const s = PA.prop(name, o || {}), vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" overflow="visible">${inner(s)}</svg>`; };

// ---------- pencil lines (same as brand/make.js) ----------
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
// double pencil stroke along a point list (closed shapes pass span ~1.03)
function pencil(pts, seed, amp, w, col = INK, span = 1.03) {
  const rnd = seeded(seed), a = wobble(pts, rnd, amp, rnd(), span), b = wobble(pts, rnd, amp * 0.9, rnd(), span - 0.08);
  return `<g fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round"><path d="${a}" stroke-width="${w}"/><path d="${b}" stroke-width="${f1(w * 0.52)}" opacity=".55"/></g>`;
}
const box = (x, y, w, h, r, seed, amp = 2.4, lw = 4.2, col = INK) => pencil(rrPts(x, y, x + w, y + h, r, 90), seed, amp, lw, col);
// an open pencil line through points (a hand-drawn polyline, smoothed)
function line(pts, seed, amp = 2, w = 4, col = INK, op = 1) {
  const rnd = seeded(seed); const o = pts.map(([x, y]) => [x + (rnd() - 0.5) * amp, y + (rnd() - 0.5) * amp]);
  let d = `M${f1(o[0][0])} ${f1(o[0][1])}`;
  for (let i = 1; i < o.length - 1; i++) d += `Q${f1(o[i][0])} ${f1(o[i][1])} ${f1((o[i][0] + o[i + 1][0]) / 2)} ${f1((o[i][1] + o[i + 1][1]) / 2)}`;
  const l = o[o.length - 1]; d += `L${f1(l[0])} ${f1(l[1])}`;
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
}
function doodle(kind, x, y, s = 1, rot = 0, sw = 2.4) {
  const t = `transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"`, st = `stroke="${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  if (kind === 'spark') return `<g ${t}><path d="M0 -14 Q1.5 -1.5 14 0 Q1.5 1.5 0 14 Q-1.5 1.5 -14 0 Q-1.5 -1.5 0 -14Z" fill="#FFE3A1" ${st}/></g>`;
  if (kind === 'heart') return `<g ${t}><path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12Z" fill="#F28FA5" fill-opacity=".75" ${st}/><path d="M-6 -4 Q-3 -7 0 -4" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"/></g>`;
  if (kind === 'paw') return `<g ${t}><ellipse cx="0" cy="6" rx="9" ry="7.5" fill="#E0D5F0" ${st}/><circle cx="-10" cy="-5" r="3.8" fill="#E0D5F0" ${st}/><circle cx="-3.5" cy="-10" r="3.8" fill="#E0D5F0" ${st}/><circle cx="3.5" cy="-10" r="3.8" fill="#E0D5F0" ${st}/><circle cx="10" cy="-5" r="3.8" fill="#E0D5F0" ${st}/></g>`;
  if (kind === 'flower') return `<g ${t}>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-8" rx="5" ry="7" transform="rotate(${a})" fill="#F9D0D9" ${st}/>`).join('')}<circle r="4.5" fill="#FFE3A1" ${st}/></g>`;
  if (kind === 'bone') return `<g ${t}><path d="M-14 -4 Q-20 -10 -14 -12 Q-11 -14 -10 -8 L10 -8 Q11 -14 14 -12 Q20 -10 14 -4 Q20 2 14 4 Q11 6 10 0 L-10 0 Q-11 6 -14 4 Q-20 2 -14 -4Z" fill="#FFF4DF" ${st}/></g>`;
  if (kind === 'leaf') return `<g ${t}><path d="M0 -12 Q12 -4 0 12 Q-12 -4 0 -12Z" fill="${ORANGE}" fill-opacity=".8" ${st}/><path d="M0 -8 V10" stroke="${INK}" stroke-width="1.4" fill="none"/></g>`;
  if (kind === 'bat') return `<g ${t}><path d="M0 -4 Q-6 -14 -20 -10 Q-14 -4 -16 4 Q-8 -2 -4 6 Q0 2 4 6 Q8 -2 16 4 Q14 -4 20 -10 Q6 -14 0 -4Z" fill="#6B5A86" ${st}/></g>`;
  return '';
}
function swashPath(x, y, w, h) {
  let r = [[.4, .6], [.6, .4], [.5, .55], [.45, .45]].map(([a, b]) => [a * w, b * h]);
  const f = Math.min(1, w / (r[0][0] + r[1][0]), w / (r[3][0] + r[2][0]), h / (r[0][1] + r[3][1]), h / (r[1][1] + r[2][1]));
  r = r.map(([a, b]) => [a * f, b * f]);
  const [tl, tr, br, bl] = r;
  return `M${f1(x + tl[0])} ${f1(y)}L${f1(x + w - tr[0])} ${f1(y)}A${f1(tr[0])} ${f1(tr[1])} 0 0 1 ${f1(x + w)} ${f1(y + tr[1])}L${f1(x + w)} ${f1(y + h - br[1])}A${f1(br[0])} ${f1(br[1])} 0 0 1 ${f1(x + w - br[0])} ${f1(y + h)}L${f1(x + bl[0])} ${f1(y + h)}A${f1(bl[0])} ${f1(bl[1])} 0 0 1 ${f1(x)} ${f1(y + h - bl[1])}L${f1(x)} ${f1(y + tl[1])}A${f1(tl[0])} ${f1(tl[1])} 0 0 1 ${f1(x + tl[0])} ${f1(y)}Z`;
}
const swash = (cx, cy, w, h, rot = -3, col = PINK, op = 0.4) => `<path d="${swashPath(cx - w / 2, cy - h / 2, w, h)}" fill="${col}" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;

// ---------- text and small parts ----------
const txt = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="Caveat" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || INK}" text-anchor="${o.anchor || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}>${s}</text>`;
const lines = (arr, x, y, size, lh, o = {}) => arr.map((s, i) => txt(s, x, y + i * lh, size, o)).join('');
const tape = (x, y, w, h, rot, col = PINK) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}" opacity=".62"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dd-stripe)" opacity=".5"/></g>`;
const shadow = '<filter id="dd-shadow" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#5B3D32" flood-opacity=".22"/></filter>';
const defs = `<defs><pattern id="dd-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.3" fill="${DOT}"/></pattern><pattern id="dd-stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="#fff" opacity=".5"/></pattern>${shadow}</defs>`;
const paper = (w, h) => `<rect width="${w}" height="${h}" fill="${PAPER}"/><rect width="${w}" height="${h}" fill="url(#dd-dots)"/>`;
// arrow: curved pencil line from (x0,y0) to (x1,y1) with a head
function arrow(x0, y0, x1, y1, bend, seed, col = MUTED) {
  const mx = (x0 + x1) / 2 + bend[0], my = (y0 + y1) / 2 + bend[1], ang = Math.atan2(y1 - my, x1 - mx), hl = 24;
  const h = [[x1 - Math.cos(ang - 0.45) * hl, y1 - Math.sin(ang - 0.45) * hl], [x1, y1], [x1 - Math.cos(ang + 0.45) * hl, y1 - Math.sin(ang + 0.45) * hl]];
  return `<path d="M${x0} ${y0}Q${mx} ${my} ${x1} ${y1}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/>` + `<path d="M${f1(h[0][0])} ${f1(h[0][1])}L${x1} ${y1}L${f1(h[2][0])} ${f1(h[2][1])}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// the game wordmark in plain text: "Doodle" tilted left, "Doggo" tilted right, pink swash behind
const wordmark = (cx, cy, F, o = {}) => `<g>${swash(cx, cy + F * 0.2, F * 4.9, F * 0.34, -1.5)}${txt('Doodle', cx - F * 1.4, cy, F, { rot: -3, fill: o.fill })}${txt('Doggo', cx + F * 1.2, cy + F * 0.05, F, { rot: 2, fill: o.fill })}</g>`;
// a screenshot crop as a nested svg. img = file name in SHOTS, crop = [sx, sy, sw, sh] in image pixels (images are 1179x1977)
const shotAt = (img, crop, x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMid slice"><image href="file://${path.join(SHOTS, img + '.png')}" width="1179" height="1977"/></svg>`;
// a taped photo: cream frame, pencil edge, the shot inside, tape on top
function photo(img, crop, x, y, w, rot, o = {}) {
  const pad = o.pad || 16, h = Math.round(w * crop[3] / crop[2]), cap = o.caption ? 78 : 0, cx = x + (w + 2 * pad) / 2, cy = y + (h + 2 * pad + cap) / 2;
  return `<g transform="rotate(${rot} ${cx} ${cy})"><g filter="url(#dd-shadow)"><rect x="${x}" y="${y}" width="${w + 2 * pad}" height="${h + 2 * pad + cap}" rx="10" fill="#FFFDF7"/></g>`
    + shotAt(img, crop, x + pad, y + pad, w, h) + `<rect x="${x + pad}" y="${y + pad}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="2"/>`
    + box(x + 1, y + 1, w + 2 * pad - 2, h + 2 * pad + cap - 2, 10, o.seed || 7, 2, 3.2)
    + (o.caption ? txt(o.caption, x + pad + w / 2, y + pad + h + 56, 48, { rot: -1 }) : '')
    + tape(x + (w + 2 * pad) / 2 - 70, y - 20, 140, 40, o.tapeRot || -4, o.tape) + `</g>`;
}
const frame = (w, h, seed = 11) => box(30, 30, w - 60, h - 60, 30, seed, 3, 5);
const svgPage = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`;

// ---------- renderer ----------
let browser;
async function render(svg, w, h, file, type = 'jpeg') {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const html = path.join(OUT, '.tmp-render.html');
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#fff}svg{display:block}</style>${svg}`);
  await page.goto('file://' + html); await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
  const opts = { path: path.join(OUT, file), clip: { x: 0, y: 0, width: w, height: h } };
  if (type === 'jpeg') { opts.type = 'jpeg'; opts.quality = 90; } else opts.omitBackground = true;
  await page.screenshot(opts); await page.close(); fs.unlinkSync(html);
  console.log('wrote', file, Math.round(fs.statSync(path.join(OUT, file)).size / 1024) + ' KB');
}

// =====================================================================================================
// THE THREE STANDALONE POSTS (1080 x 1350)
// =====================================================================================================
const W = 1080, H = 1350;
function post1() { // Meet Noodle
  const body = paper(W, H) + frame(W, H, 21)
    + wordmark(270, 138, 78) + doodle('spark', 520, 96, 1.3) + doodle('heart', 880, 120, 1.2, 12) + txt('a cozy dog game', 880, 182, 44, { fill: MUTED, rot: 3, w: 600 })
    + txt('Meet Noodle.', 540, 392, 205, { rot: -2 })
    + lines(['a wobbly crayon dachshund,', 'very proud of this drawing.'], 540, 478, 62, 66, { fill: MUTED, w: 600 })
    + swash(560, 970, 900, 150, -2) + swash(520, 1000, 760, 90, 1.5, '#FFE3A1', 0.5)
    + dog('dachs', { pose: 'happy' }, 100, 520, 900)
    + txt('very long boy.', 214, 665, 56, { rot: -6, fill: INK, w: 600 }) + arrow(300, 690, 410, 840, [-20, 40], 1)
    + txt('tongue: always out', 860, 630, 52, { rot: 4, w: 600 }) + arrow(880, 662, 800, 752, [50, 0], 2)
    + box(150, 1150, 780, 92, 44, 33, 2.4, 4.4) + txt('walks · gardens · puppy playdates', 540, 1214, 54, { w: 600 })
    + txt('a free browser game · coming soon', 540, 1284, 46, { fill: MUTED, w: 600 })
    + doodle('paw', 100, 1197, 1.3, -15) + doodle('paw', 980, 1197, 1.3, 15) + doodle('spark', 960, 560, 0.9) + doodle('heart', 130, 560, 1, -14);
  return svgPage(W, H, body);
}
function post2() { // Pencil town, crayon dogs, Fuji
  const body = paper(W, H) + frame(W, H, 22)
    + lines(['Pencil town.', 'Crayon dogs.'], 540, 180, 150, 128, { rot: -1.5 })
    + txt('Mt. Fuji on every skyline', 520, 392, 64, { fill: MUTED, w: 600 }) + doodle('spark', 880, 375, 1.1) + doodle('heart', 160, 380, 1, -12)
    // big photo: the yard at dusk, below the place pill so the dev asterisk never shows
    + photo('yard_dusk', [0, 470, 1179, 1150], 78, 440, 700, -1.6, { caption: '', seed: 4, tape: PINK })
    + photo('fujihill_dusk_bubble', [0, 640, 1179, 980], 660, 940, 330, 3.2, { caption: 'Mt. Fuji Lookout', seed: 9, tape: '#FFE3A1', tapeRot: 5, pad: 14 })
    + lines(['walks, gardens, cooking', 'and puppy playdates'], 330, 1226, 50, 54, { w: 600, rot: -2 }) + doodle('paw', 108, 1200, 1.2, -20) + doodle('bone', 560, 1170, 1.2, 18);
  return svgPage(W, H, body);
}
function post3() { // Play free (+ Halloween)
  const flag = (x, y, c, r) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x - 34} ${y} L${x + 34} ${y} L${x} ${y + 78}Z" fill="${c}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/></g>`;
  const cols = [PLUM, ORANGE, PINK, '#F2C14E', '#7FB77E'];
  let bunt = ''; const pts = [];
  for (let i = 0; i <= 12; i++) { const x = 40 + i * 83.3; pts.push([x, 62 + Math.sin(i / 12 * Math.PI) * 38]); }
  bunt += line(pts, 3, 1.5, 3.5, INK);
  for (let i = 0; i < 12; i++) { const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 4; bunt += flag(mx, my, cols[i % cols.length], (b[1] - a[1]) / 3); }
  const step = (n, x, s) => `<circle cx="${x}" cy="1198" r="34" fill="${PINK}" fill-opacity=".55" stroke="${INK}" stroke-width="3.6"/>${txt(n, x, 1214, 50)}${txt(s, x + 52, 1213, 46, { anchor: 'start', w: 600 })}`;
  const body = paper(W, H) + frame(W, H, 23) + bunt
    + txt('Play free.', 70, 415, 165, { rot: -3, anchor: 'start' })
    + lines(['no download, just tap', 'the link in our bio'], 90, 495, 54, 58, { fill: MUTED, w: 600, anchor: 'start' })
    // the phone: a real screenshot of the Square at dusk with the Pumpkin Patch cart
    + `<g transform="rotate(4 790 700)"><g filter="url(#dd-shadow)"><rect x="620" y="270" width="372" height="640" rx="44" fill="#FFFDF7"/></g>${shotAt('square_dusk', [0, 0, 1179, 1977], 634, 284, 344, 577)}<rect x="634" y="284" width="344" height="577" rx="30" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="2"/>${box(620, 270, 372, 640, 44, 5, 2.2, 5)}</g>`
    // the costume: Noodle in the Witch Hat and Candy Corn Bandana (the game's own outfits)
    + swash(330, 1060, 640, 120, -2, ORANGE, 0.28)
    + dog('dachs', { pose: 'happy', outfit: { head: 'Witch Hat', neck: 'Candy Corn Bandana' } }, 20, 610, 640)
    + prop('jackolantern', { lit: true }, 585, 940, 118, 118) + prop('jackolantern', { lit: true }, 690, 975, 84, 84)
    + doodle('bat', 520, 235, 1.5, 10) + doodle('bat', 250, 218, 1.2, -8)
    // Halloween sticker
    + `<g transform="rotate(-8 900 330)"><circle cx="900" cy="330" r="112" fill="${ORANGE}" stroke="${INK}" stroke-width="5"/>${txt('Halloween', 900, 302, 50, { fill: '#FFF8EC' })}${txt('Pumpkin Patch', 900, 350, 40, { fill: '#FFF8EC', w: 600 })}${txt('till 2 Nov', 900, 396, 50, { fill: '#FFF8EC' })}</g>`
    + step('1', 120, 'tap the link in bio') + step('2', 566, 'pick a pup') + step('3', 826, 'say hi')
    + txt('Doodle Doggo · free · phone or computer', 540, 1300, 44, { fill: MUTED, w: 600 })
    + doodle('spark', 960, 1130, 1, 0) + doodle('paw', 100, 1296, 1, -15);
  return svgPage(W, H, body);
}

async function main() {
  const { chromium } = require('playwright');
  browser = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)) });
  if (WHAT === 'posts' || WHAT === 'all') {
    await render(post1(), W, H, 'post1-meet-noodle.jpg'); await render(post2(), W, H, 'post2-pencil-town-fuji.jpg'); await render(post3(), W, H, 'post3-play-free-halloween.jpg');
  }
  const helpers = { f1, seeded, pencil, line, box, doodle, swash, swashPath, txt, lines, tape, arrow, dog, prop, shotAt, photo, paper, defs, svgPage, rrPts, INK, PINK, PAPER, MUTED, ORANGE, PLUM, DOT, OUT, PA, inner, wordmark, frame };
  if (WHAT === 'banner' || WHAT === 'all') await require('./make_banner.js')({ render, browser, helpers });
  if (WHAT === 'info' || WHAT === 'all') await require('./make_info.js')({ render, helpers, only: process.argv[4] });
  if (WHAT === 'dogs' || WHAT === 'all') await require('./make_dogs.js')({ render, browser, helpers, only: process.argv[4] });
  if (WHAT === 'soon' || WHAT === 'all') await require('./make_soon.js')({ render, browser, helpers });
  if (WHAT === 'youtube' || WHAT === 'all') await require('./make_youtube.js')({ render, browser, helpers });
  if (WHAT === 'reelcover' || WHAT === 'all') await require('./make_reelcover.js')({ render, browser, helpers });
  if (['profile', 'covers', 'grid', 'all'].includes(WHAT)) await require('./make_extra.js')({ render, helpers, what: WHAT });
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
