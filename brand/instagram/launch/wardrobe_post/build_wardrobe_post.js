// The wardrobe glow-up post (v2.23.3 "Tidy wardrobe", live 9 Nov 2026): ONE 1080 x 1350 Instagram image, before and after.
// Two crayon phone frames side by side with a clear gap, each holding the REAL phone screenshot of the open Wardrobe (same save in both builds,
// see capture_wardrobe.js): BEFORE = v2.23.2 (origin/main 14eae860), AFTER = v2.23.3 (origin/main f4b15682). Sketchbook paper, Caveat, the logo.
// Every pill text is ink-centred (../centre_text.js centreCheck); the headline and the line under it are ink-centred on the page; the build throws if
// anything drawn leaves the frame's margins or the two phones come closer than GAP_MIN.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/wardrobe_post/build_wardrobe_post.js <before.png> <after.png> [out.jpg]
//   (default out: brand/instagram/launch/wardrobe_post/wardrobe-glowup.jpg; the screenshots stay out of git)
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const { CENTRE_JS } = require('../centre_text.js');
const BEFORE = path.resolve(process.argv[2] || 'before.png'), AFTER = path.resolve(process.argv[3] || 'after.png');
const OUT = path.resolve(process.argv[4] || path.join(__dirname, 'wardrobe-glowup.jpg'));
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const W = 1080, H = 1350, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', DOT = '#E3D2BA', MUTED = '#8A7468', PINK = '#F28FA5', YEL = '#FFE3A1', RED = '#D2473C', GREEN = '#4E9A54';
const SW = 1179, SH = 2556; // the phone screenshots (393 x 852 at DPR 3)
const MARGIN = 50, GAP_MIN = 60;

// ---------- pencil lines (as make.js) ----------
const f1 = (n) => Math.round(n * 10) / 10;
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
  const n = pts.length, s0 = Math.floor(start * n), cnt = Math.floor(span * n), o = []; let ox = 0, oy = 0;
  for (let i = 0; i <= cnt; i++) { ox = ox * 0.78 + (rnd() - 0.5) * amp; oy = oy * 0.78 + (rnd() - 0.5) * amp; const p = pts[(s0 + i) % n]; o.push([p[0] + ox, p[1] + oy]); }
  let d = `M${f1(o[0][0])} ${f1(o[0][1])}`;
  for (let i = 1; i < o.length - 1; i++) d += `Q${f1(o[i][0])} ${f1(o[i][1])} ${f1((o[i][0] + o[i + 1][0]) / 2)} ${f1((o[i][1] + o[i + 1][1]) / 2)}`;
  const l = o[o.length - 1]; return d + `L${f1(l[0])} ${f1(l[1])}`;
}
function pencil(pts, seed, amp, w, col = PEN, span = 1.03) {
  const rnd = seeded(seed), a = wobble(pts, rnd, amp, rnd(), span), b = wobble(pts, rnd, amp * 0.9, rnd(), span - 0.08);
  return `<g fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round"><path d="${a}" stroke-width="${w}"/><path d="${b}" stroke-width="${f1(w * 0.52)}" opacity=".55"/></g>`;
}
const box = (x, y, w, h, r, seed, amp = 2.4, lw = 4.2, col = PEN) => pencil(rrPts(x, y, x + w, y + h, r, 110), seed, amp, lw, col);
function crayon(pts, seed, w, col, amp = 2) { // an open crayon stroke, drawn twice
  const rnd = seeded(seed), one = (a) => { const o = pts.map(([x, y]) => [x + (rnd() - 0.5) * a, y + (rnd() - 0.5) * a]); let d = `M${f1(o[0][0])} ${f1(o[0][1])}`;
    for (let i = 1; i < o.length - 1; i++) d += `Q${f1(o[i][0])} ${f1(o[i][1])} ${f1((o[i][0] + o[i + 1][0]) / 2)} ${f1((o[i][1] + o[i + 1][1]) / 2)}`; const l = o[o.length - 1]; return d + `L${f1(l[0])} ${f1(l[1])}`; };
  return `<g fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round"><path d="${one(amp)}" stroke-width="${w}"/><path d="${one(amp * 1.4)}" stroke-width="${f1(w * 0.5)}" opacity=".6"/></g>`;
}
const spark = (x, y, s, rot = 0) => `<g data-ink transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 -14 Q1.5 -1.5 14 0 Q1.5 1.5 0 14 Q-1.5 1.5 -14 0 Q-1.5 -1.5 0 -14Z" fill="${YEL}" stroke="${PEN}" stroke-width="${f1(2.4 / s * 1.2)}" stroke-linejoin="round"/></g>`;
const heart = (x, y, s, rot = 0) => `<g data-ink transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12Z" fill="${PINK}" fill-opacity=".75" stroke="${PEN}" stroke-width="${f1(2.4 / s * 1.2)}" stroke-linejoin="round"/></g>`;
const tape = (x, y, w, h, rot, col = PINK) => `<g data-ink transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}" opacity=".62"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#stripe)" opacity=".5"/></g>`;
const LOGO_INNER = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---------- layout ----------
const SCR_H = 820, SCR_W = Math.round(SCR_H * SW / SH), BZ = 16, PH_W = SCR_W + 2 * BZ, PH_H = SCR_H + 2 * BZ + 20; // a 20 px chin under the screen
const GAP = 100, PH_Y = 318, PX = [(W - 2 * PH_W - GAP) / 2, (W + GAP) / 2];
function phone(i, img, rot, seed) {
  const x = PX[i], y = PH_Y, sx = x + BZ, sy = y + BZ, cx = x + PH_W / 2, cy = y + PH_H / 2;
  return `<g data-phone="${i}" transform="rotate(${rot} ${cx} ${cy})">`
    + `<rect x="${x + 9}" y="${y + 13}" width="${PH_W}" height="${PH_H}" rx="46" fill="${PEN}" opacity=".13"/>`
    + `<rect x="${x}" y="${y}" width="${PH_W}" height="${PH_H}" rx="46" fill="${CREAM}"/>`
    + `<clipPath id="scr${i}"><rect x="${sx}" y="${sy}" width="${SCR_W}" height="${SCR_H}" rx="30"/></clipPath>`
    + `<image href="file://${img}" x="${sx}" y="${sy}" width="${SCR_W}" height="${SCR_H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#scr${i})"/>`
    + `<rect x="${sx}" y="${sy}" width="${SCR_W}" height="${SCR_H}" rx="30" fill="none" stroke="${PEN}" stroke-opacity=".45" stroke-width="2"/>`
    + box(x, y, PH_W, PH_H, 46, seed, 2.2, 5)
    + `<rect x="${cx - 26}" y="${y + PH_H - 15}" width="52" height="6" rx="3" fill="${PEN}" opacity=".5"/>`
    + `</g>`;
}
// a crayon cross and tick beside the labels
const cross = (x, y) => `<g data-ink>${crayon([[x - 17, y - 17], [x + 17, y + 17]], 41, 9, RED)}${crayon([[x + 17, y - 18], [x - 16, y + 16]], 42, 9, RED)}</g>`;
const tick = (x, y) => `<g data-ink>${crayon([[x - 20, y + 1], [x - 6, y + 17], [x + 22, y - 20]], 43, 9, GREEN)}</g>`;
// the pencil arrow in the gap between the phones (it never touches either phone)
const ax0 = PX[0] + PH_W + 18, ax1 = PX[1] - 18, ay = PH_Y + PH_H * 0.47;
const arrow = `<g data-ink>${crayon([[ax0, ay + 8], [(ax0 + ax1) / 2, ay - 8], [ax1, ay]], 51, 6, MUTED, 1)}${crayon([[ax1 - 18, ay - 15], [ax1, ay], [ax1 - 17, ay + 15]], 52, 6, MUTED, 1)}</g>`;

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${PAPER}}svg{display:block}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.3" fill="${DOT}"/></pattern>
<pattern id="stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="#fff" opacity=".5"/></pattern></defs>
<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" fill="url(#dots)"/>${box(30, 30, W - 60, H - 60, 30, 11, 3, 5)}
<g id="art">${phone(0, BEFORE, -1.2, 61)}${phone(1, AFTER, 1.2, 62)}${arrow}</g><g id="top"></g></svg>
<script>
${CENTRE_JS}
const F='Caveat', C=(l,x,y)=>centred(l,x,y,F), W=${W}, H=${H}, MARGIN=${MARGIN};
function fit(s,size,maxW){ const k=inkOf(s,size,F), w=k.L+k.R; return w>maxW?Math.floor(size*maxW/w):size; }
window.draw=function(){
  const HEAD='our wardrobe had a glow-up', SUB='tabs \\u00b7 tidy tiles \\u00b7 see your dog while you scroll';
  const hs=fit(HEAD,96,820), ss=fit(SUB,48,900);
  const hk=inkOf(HEAD,hs,F), hw=hk.L+hk.R, gk=inkOf('glow-up',hs,F), gw=gk.L+gk.R;
  // the pink crayon swash under "glow-up" (the last word of the headline, so it ends where the ink ends)
  const hx1=540+hw/2, sw0=hx1-gw-8, sw1=hx1+8, hy=120;
  let top='<path data-ink d="M'+sw0+' '+(hy+30)+' Q'+((sw0+sw1)/2)+' '+(hy+18)+' '+sw1+' '+(hy+26)+'" fill="none" stroke="${PINK}" stroke-width="22" stroke-linecap="round" opacity=".5"/>';
  top+='<g data-ink>'+C([{s:HEAD,size:hs}],540,hy).svg+'</g>';
  top+='${spark(0, 0, 1.5, 8)}'.replace('translate(0 0)','translate('+(hx1+34)+' '+(hy-40)+')');
  top+='${spark(0, 0, 0.95, -10)}'.replace('translate(0 0)','translate('+(hx1+58)+' '+(hy+4)+')');
  top+='<g data-ink>'+C([{s:SUB,size:ss,fill:'${MUTED}'}],540,202).svg+'</g>';
  // the labels over the phones
  const LY=${PH_Y} - 34, L0=${PX[0] + PH_W / 2}, L1=${PX[1] + PH_W / 2};
  top+='<g transform="rotate(-2 '+L0+' '+LY+')">'+pill('before',L0+18,LY,52,F,{fill:'${CREAM}',padX:28})+'</g>';
  top+='<g transform="rotate(2 '+L1+' '+LY+')">'+pill('after',L1+18,LY,52,F,{fill:'${YEL}',padX:28})+'</g>';
  document.getElementById('top').innerHTML=top;
  const lab=[...document.querySelectorAll('#top g[data-box]')].map((g)=>g.querySelector('rect').getBBox());
  const mk=(b)=>({x:b.x-34,y:b.y+b.height/2});
  let marks=''; // a red crayon cross by "before", a green tick by "after", a pink "so tidy!" sticker by the logo
  const m0=mk(lab[0]), m1=mk(lab[1]);
  marks+='${cross(0, 0)}'.replace(/(<g data-ink>)/,'<g data-ink transform="translate('+m0.x+' '+m0.y+')">');
  marks+='${tick(0, 0)}'.replace(/(<g data-ink>)/,'<g data-ink transform="translate('+m1.x+' '+m1.y+')">');
  marks+='<g transform="rotate(-6 880 '+(${PH_Y}+${PH_H}+62)+')">'+pill('so tidy!',880,${PH_Y}+${PH_H}+62,50,F,{fill:'${PINK}',padX:20})+'</g>';
  marks+='${heart(0, 0, 1.3, -14)}'.replace('translate(0 0)','translate(190 '+(${PH_Y}+${PH_H}+62)+')');
  marks+='${spark(0, 0, 1.0, 10)}'.replace('translate(0 0)','translate(120 '+(${PH_Y}+${PH_H}+50)+')');
  // the logo, small, centred at the bottom
  const lw=300, lh=lw*280/900; marks+='<svg data-ink x="'+(540-lw/2)+'" y="'+(${PH_Y}+${PH_H}+14)+'" width="'+lw+'" height="'+lh+'" viewBox="0 0 900 280">${LOGO_INNER.replace(/'/g, "\\'").replace(/\n/g, ' ')}</svg>';
  document.getElementById('top').insertAdjacentHTML('beforeend',marks);
  // checks: pill text ink-centred; everything inside the margins; the phones apart
  const sv=document.getElementById('sv'), bad=centreCheck(sv);
  for(const e of sv.querySelectorAll('#art > g, #top > *')){ const r=e.getBoundingClientRect(); if(!r.width) continue;
    if(r.left<MARGIN||r.right>W-MARGIN||r.top<MARGIN||r.bottom>H-MARGIN) bad.push('outside the margins: '+(e.textContent||e.tagName).trim().slice(0,30)+' '+[r.left,r.top,r.right,r.bottom].map(Math.round)); }
  const p=[...sv.querySelectorAll('[data-phone]')].map((e)=>e.getBoundingClientRect()); const gap=p[1].left-p[0].right;
  if(gap<${GAP_MIN}) bad.push('phones only '+Math.round(gap)+' px apart');
  return {bad, gap:Math.round(gap), hs, ss};
};
</script>`;

(async () => {
  for (const f of [BEFORE, AFTER]) if (!fs.existsSync(f)) throw new Error('missing screenshot ' + f);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const page = path.join(path.dirname(BEFORE), `wardrobe_post_${process.pid}.html`); fs.writeFileSync(page, html);
  await p.goto('file://' + page); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all(['600 40px Caveat', '700 40px Caveat'].map((f) => document.fonts.load(f, 'a'))));
  const r = await p.evaluate(() => window.draw()); console.log('gap', r.gap, 'headline', r.hs, 'line', r.ss);
  if (r.bad.length) throw new Error(r.bad.join('; '));
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT, type: 'jpeg', quality: 92 }); await b.close(); fs.rmSync(page);
  console.log('wrote', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
