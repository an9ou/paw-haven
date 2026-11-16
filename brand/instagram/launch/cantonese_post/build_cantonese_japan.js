// The Cantonese launch poster, Japan-style version (owner, 16 Nov 2026: "a bit more in Japan style"): ONE 1080 x 1350 Instagram image.
// The same words as cantonese-launch.jpg: the hook 「勁正！」 as a red hanko seal (vertical), the headline on an indigo noren (one character a
// panel, "Doodle Doggo" on its top band), the English line on a paper strip, the game's Asakusa in autumn (PawArt.scene 'asakusa', today's
// art, its hotspot outlines and corner tapes left out) in a wooden frame, Peanut, Noodle and Sunny on a wooden engawa with their REAL lines
// from game/i18n/yue.json (Peanut's and Sunny's set vertically, manga style), the thank-you strip and an ema plaque with the logo and
// doodledoggo.app. Washi paper, a seigaiha border, crayon momiji leaves. Iansui for the Chinese, Caveat for the Latin; crayon look, fills
// inside their lines; no flags.
// Checks (the build throws): text ink-centred in every seal, noren panel, strip, bubble, plaque and pill (../centre_text.js centreCheck), the
// dogs apart (apartCheck), no two drawn items closer than GAP px, nothing outside the 60 px margins.
//
//   git worktree add --detach <scratch>/main origin/main
//   ART_ROOT=<scratch>/main NODE_PATH=$(npm root -g) node brand/instagram/launch/cantonese_post/build_cantonese_japan.js [out.jpg]
//   (default out: brand/instagram/launch/cantonese_post/cantonese-launch-japan.jpg)
const path = require('path'), fs = require('fs'), vm = require('vm'), os = require('os');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'cantonese-launch-japan.jpg'));
const W = 1080, H = 1350, PEN = '#5B3D32', PAPER = '#FBF3E3', CREAM = '#FFFDF7', MUTED = '#8A7468', PINK = '#F28FA5', YEL = '#FFE3A1', MINT = '#CDEBD2', LILAC = '#E0D5F0';
const MARGIN = 60, GAP = 20;
// where things go (poster px)
const LAYOUT = {
  hx: 74, hy: 78, hw: 160, hh: 338, hs: 94,                                   // the hanko
  nx0: 292, nx1: 1000, ny: 74, nband: 56, ns: 42, nph: 190, ngap: 8, nc: 72,   // the noren
  ey: 396, es: 40,                                                             // the English strip (centre y, size)
  px0: 212, px1: 868, py0: 476, ph: 244,                                       // the picture (inside its frame)
  deck: 1140, cx: 178, ch: 250, dx: 530, dw: 372, gx: 892, gh: 232,           // the deck line, the dogs (centre x, height / width)
  vs: 34, vpx: 118, vpy: 500, vgx: 966, vgy: 520,                              // the vertical bubbles (centre x, top)
  nbx: 386, nby: 830, nbs: 30,                                                 // Noodle's bubble (left, centre y)
  ry: 1234, ths: 28, us: 38, lw: 210, pairgap: 28,                             // the footer
  leaves: [[300, 400, 1.15, -18], [984, 392, 1.0, 22], [984, 476, 0.85, -30]],
};

// ---------- the real lines from the game (game/i18n/yue.json on main), checked at build time; the line breaks are only for the bubbles ----------
const LINES = {
  dachs: { key: 'data.sig.dachs.say', lines: ['扭呀扭。', '後面嗰半遲到咗。'] },            // "Wiggle wiggle. The back half is late."
  chihuahua: { key: 'data.sig.chihuahua.say', lines: [...'我係八號風球！！'] },             // vertical, one character a line
  golden: { key: 'data.sr_lines.fetch.2', lines: [...'睇下我搵到乜！'] },                   // vertical
};
const yue = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'yue.json'), 'utf8'));
for (const [id, l] of Object.entries(LINES)) { const v = yue[l.key]; if (v !== l.lines.join('')) throw new Error(`${id}: ${l.key} is "${v}" in yue.json, not "${l.lines.join('')}"`); }

// ---------- today's art ----------
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((n) => /^pawart_world_[a-z]\.js$/.test(n)).sort()) vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'world', f), 'utf8'), ctx);
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const ART = {
  dachs: inner(win.PawArt.dog('dachs', { anim: false, pose: 'happy' })),
  chihuahua: inner(win.PawArt.dog('chihuahua', { anim: false, pose: 'happy' })),
  golden: inner(win.PawArt.dog('golden', { anim: false, pose: 'happy' })),
};
// the picture: Asakusa (the Tokyo trip) on an autumn day; the game's tap outlines (class pa-wd-hl) and corner tapes are UI, not the place
const SCENE_SVG = inner(win.PawArt.scene('asakusa', { time: 'day', weather: 'sunny', season: 'autumn', jp: true, halloween: false }))
  .replace(/<path class="pa-wd-hl"[^>]*\/>/g, '')
  .replace(/<g transform="translate\(\d+ \d+\) rotate\(-2\d\)"><path d="M0 0l-3 4\.4[^"]*"[^>]*\/>.*?<\/g>/g, '');
const PIC_VB = '20 96 980 318'; // the gate, the shops, the pagoda and the momiji, down to the first paving
const LOGO_INNER = fs.readFileSync(path.join(ART_ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

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

// washi paper: warm base, long soft fibres and specks (seeded)
function washi() { const r = seeded(77); let fib = '', sp = '';
  for (let i = 0; i < 420; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, l = 14 + r() * 46, c = Math.cos(a) * l, s = Math.sin(a) * l, bx = (r() - 0.5) * 16, by = (r() - 0.5) * 16;
    fib += `M${f1(x)} ${f1(y)}q${f1(c / 2 + bx)} ${f1(s / 2 + by)} ${f1(c)} ${f1(s)}`; }
  for (let i = 0; i < 900; i++) sp += `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(0.6 + r() * 1.3)}"/>`;
  return `<rect width="${W}" height="${H}" fill="${PAPER}"/><path d="${fib}" fill="none" stroke="#D9C7A6" stroke-width="1.3" stroke-linecap="round" opacity=".55"/><g fill="#CDB892" opacity=".45">${sp}</g>`; }
// a seigaiha (wave) border band between the paper's edge (inset E0) and inset E1, in indigo crayon on cream
const E0 = 18, E1 = 52;
function seigaiha() { const R = 17, rows = [];
  let tile = ''; for (const [cx, cy] of [[0, 0], [2 * R, 0], [R, R / 2], [-R, R / 2], [3 * R, R / 2], [0, R], [2 * R, R]]) for (const k of [1, 0.68, 0.36]) tile += `<circle cx="${cx}" cy="${cy}" r="${f1(R * k)}" fill="${k === 1 ? '#FFFBF2' : 'none'}" stroke="#46659A" stroke-width="${k === 1 ? 2.4 : 1.8}" opacity="${k === 1 ? 1 : 0.85}"/>`;
  return `<pattern id="sgh" width="${2 * R}" height="${R}" patternUnits="userSpaceOnUse"><rect width="${2 * R}" height="${R}" fill="#FFFBF2"/>${tile}</pattern>`; }

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Iansui&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${PAPER}}svg{display:block}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${seigaiha()}
<pattern id="stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="#fff" opacity=".5"/></pattern></defs>
${washi()}
<path d="M${E0} ${E0}H${W - E0}V${H - E0}H${E0}Z M${E1} ${E1}V${H - E1}H${W - E1}V${E1}Z" fill="url(#sgh)" fill-rule="evenodd"/>
${box(E0, E0, W - 2 * E0, H - 2 * E0, 14, 11, 2.4, 4.6)}${box(E1, E1, W - 2 * E1, H - 2 * E1, 10, 12, 2, 3.6)}
<g id="items"></g><g id="probe"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
const ART=${JSON.stringify(ART)}, LINES=${JSON.stringify(LINES)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, SCENE_SVG=${JSON.stringify(SCENE_SVG)}, PIC_VB='${PIC_VB}';
const W=${W}, H=${H}, MARGIN=${MARGIN}, GAP=${GAP}, LAT='Caveat', ZH='Iansui';
const HANKO='#C7353B', INDIGO='#2F4B7C', WOOD='#C99A6B', WOODD='#9C6F48', PEN='${PEN}', CREAM='${CREAM}', MUTED='${MUTED}', PINK='${PINK}', YEL='${YEL}', MINT='${MINT}', LILAC='${LILAC}', SUBINK='#5E4136';
const f1=(n)=>Math.round(n*10)/10, $=(i)=>document.getElementById(i);
${seeded.toString()}
${rrPts.toString()}
${wobble.toString()}
${pencil.toString().replace('col = PEN', "col = '" + PEN + "'")}
function ink(s,size,fam){ const k=inkOf(s,size,fam); return {w:k.L+k.R,h:k.A+k.D}; }
function fit(s,size,fam,maxW){ while(size>16&&ink(s,size,fam).w>maxW) size-=1; return size; }
// a drawing placed by its drawn box: centre x, feet y, width w (of the drawn box)
const BOX={};
function measure(){ const g=$('probe'); for(const [id,s] of Object.entries(ART)){ g.innerHTML='<g>'+s+'</g>'; const b=g.firstChild.getBBox(); BOX[id]=[b.x,b.y,b.width,b.height]; } g.innerHTML=''; }
function dogAt(id,cx,feet,w,flip){ const b=BOX[id], s=w/b[2];
  return {h:b[3]*s, svg:'<g data-item="dog '+id+'" data-apart="'+id+'"><ellipse cx="'+f1(cx)+'" cy="'+f1(feet-2)+'" rx="'+f1(w*0.4)+'" ry="'+f1(Math.max(6,w*0.025))+'" fill="'+PEN+'" opacity=".12"/>'
    +'<g transform="translate('+f1(cx)+' '+f1(feet)+') scale('+(flip?-s:s).toFixed(4)+' '+s.toFixed(4)+') translate('+f1(-(b[0]+b[2]/2))+' '+f1(-(b[1]+b[3]))+')">'+ART[id]+'</g></g>'}; }
// a crayon speech bubble: cream fill, a pencil outline, a tail from (tx0..) to the tip; the text ink-centred in the rect
function bubble(id,lines,cx,cy,size,fill,tail,seed,o){ const pad=(o&&o.pad)||[38,30], lh=(o&&o.lh)||size*1.28;
  let w=0; lines.forEach((s)=>{ w=Math.max(w,ink(s,size,ZH).w); });
  const bw0=w+2*pad[0]; if(o&&o.left!=null) cx=o.left+bw0/2; if(o&&o.right!=null) cx=o.right-bw0/2;
  const bw=bw0, bh=(lines.length-1)*lh+size*1.02+2*pad[1]; if(o&&o.top!=null) cy=o.top+bh/2; const x=cx-bw/2, y=cy-bh/2, r=Math.min(40,bh/2);
  // the tail: a crayon wedge from the bubble's edge to the tip (tip given relative to the bubble's centre)
  const [bx,by,tx,ty]=tail(x,y,bw,bh), half=22, dx=tx-bx, dy=ty-by, L=Math.hypot(dx,dy), nx=-dy/L*half, ny=dx/L*half;
  const wedge='M'+f1(bx+nx)+' '+f1(by+ny)+' Q'+f1((bx+tx)/2+nx*0.3)+' '+f1((by+ty)/2+ny*0.3)+' '+f1(tx)+' '+f1(ty)+' Q'+f1((bx+tx)/2-nx*0.1)+' '+f1((by+ty)/2-ny*0.1)+' '+f1(bx-nx)+' '+f1(by-ny)+'Z';
  const t=centred(lines.map((s)=>({s,size,pitch:lh})),cx,cy,ZH).svg;
  return '<g data-item="bubble '+id+'"><path d="'+wedge+'" fill="'+fill+'" stroke="'+PEN+'" stroke-width="4.5" stroke-linejoin="round"/>'
    +'<g data-box><rect x="'+f1(x)+'" y="'+f1(y)+'" width="'+f1(bw)+'" height="'+f1(bh)+'" rx="'+r+'" fill="'+fill+'"/>'+t+'</g>'
    +pencil(rrPts(x,y,x+bw,y+bh,r,110),seed,2.2,4.6)
    +'<path d="M'+f1(bx+nx*0.7)+' '+f1(by+ny*0.7)+' L'+f1(bx-nx*0.7)+' '+f1(by-ny*0.7)+'" stroke="'+fill+'" stroke-width="9" stroke-linecap="round"/></g>'; }
const spark=(x,y,s,rot,name)=>'<g data-item="'+name+'" transform="translate('+x+' '+y+') rotate('+rot+') scale('+s+')"><path d="M0 -14 Q1.5 -1.5 14 0 Q1.5 1.5 0 14 Q-1.5 1.5 -14 0 Q-1.5 -1.5 0 -14Z" fill="'+YEL+'" stroke="'+PEN+'" stroke-width="'+f1(2.6/s)+'" stroke-linejoin="round"/></g>';
const heart=(x,y,s,rot,name)=>'<g data-item="'+name+'" transform="translate('+x+' '+y+') rotate('+rot+') scale('+s+')"><path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12Z" fill="'+PINK+'" fill-opacity=".8" stroke="'+PEN+'" stroke-width="'+f1(2.6/s)+'" stroke-linejoin="round"/></g>';

// an item's drawn box on the page: the union of its leaves (a text by its ink, a shape by its box plus half its stroke)
function vis(e){ for(let p=e;p&&p.getAttribute;p=p.parentNode){ const st=getComputedStyle(p); if(st.display==='none'||st.visibility==='hidden'||parseFloat(p.getAttribute('opacity')??1)<0.05) return false; } return true; }
function boxOf(el){ let l=1e9,t=1e9,r=-1e9,b=-1e9; const add=(x0,y0,x1,y1)=>{ l=Math.min(l,x0); t=Math.min(t,y0); r=Math.max(r,x1); b=Math.max(b,y1); };
  const leaves=(el.matches('path,rect,ellipse,circle,polygon,polyline,line,text,image,use')?[el]:[...el.querySelectorAll('path,rect,ellipse,circle,polygon,polyline,line,text,image,use')]).filter((e)=>!e.closest('svg[data-clip]'));
  for(const c of el.querySelectorAll('svg[data-clip]')){ const n=(k)=>parseFloat(c.getAttribute(k)); add(n('x'),n('y'),n('x')+n('width'),n('y')+n('height')); } // a clipped picture counts by its frame
  for(const e of leaves){ if(!vis(e)) continue;
    if(e.tagName==='text'){ const k=inkOf(e.textContent,parseFloat(e.getAttribute('font-size')),e.getAttribute('font-family')), x=parseFloat(e.getAttribute('x')), y=parseFloat(e.getAttribute('y')), m=e.getScreenCTM();
      for(const [px,py] of [[x-k.L,y-k.A],[x+k.R,y-k.A],[x-k.L,y+k.D],[x+k.R,y+k.D]]){ const q=new DOMPoint(px,py).matrixTransform(m); add(q.x,q.y,q.x,q.y); } continue; }
    const rc=e.getBoundingClientRect(); if(!rc.width&&!rc.height) continue;
    const st=getComputedStyle(e), sw=st.stroke&&st.stroke!=='none'?parseFloat(st.strokeWidth)||0:0, m=e.getScreenCTM(), sc=m?Math.hypot(m.a,m.b):1, h=sw*sc/2;
    add(rc.left-h,rc.top-h,rc.right+h,rc.bottom+h); }
  return {left:l,top:t,right:r,bottom:b}; }

// a crayon sticker burst (seeded spikes), cream-yellow, ink outline; an invisible rect in the middle carries the centring check
function burst(cx,cy,rx,ry,n,seed){ const r=seeded(seed); let d=''; for(let i=0;i<2*n;i++){ const a=-Math.PI/2+i*Math.PI/n, k=i%2?0.80+r()*0.05:1.0+r()*0.05;
    d+=(i?'L':'M')+f1(cx+Math.cos(a)*rx*k)+' '+f1(cy+Math.sin(a)*ry*k); } return d+'Z'; }
// a row of Latin and Chinese text on one baseline: [{s,size,fam,fill}], returns {parts:[{s,size,fam,fill,x}], w, A, D} (x from the row's ink left)
function row(parts,gap){ let x=0, A=0, D=0; const out=parts.map((p,i)=>{ const k=inkOf(p.s,p.size,p.fam); if(i) x+=gap; const o=Object.assign({},p,{x:x+k.L}); x+=k.L+k.R; A=Math.max(A,k.A); D=Math.max(D,k.D); return o; }); return {parts:out,w:x,A,D}; }
const T=(p,x,y)=>'<text x="'+f1(x)+'" y="'+f1(y)+'" font-family="'+p.fam+'" font-weight="700" font-size="'+p.size+'" fill="'+(p.fill||PEN)+'"'+(p.extra||'')+'>'+p.s+'</text>';

// a crayon momiji (maple) leaf: five pointed lobes around a short stem, filled inside its outline, a vein to each lobe
function momiji(x,y,s,rot,col,name){ const R=20, lobes=[[-90,1],[-35,.88],[22,.66],[158,.66],[215,.88]].map(([a,k])=>[a*Math.PI/180,R*k]);
  const P=(a,r)=>[Math.cos(a)*r,Math.sin(a)*r]; let d='';
  for(let i=0;i<lobes.length;i++){ const [a,r]=lobes[i], [a2]=lobes[(i+1)%lobes.length], mid=i===lobes.length-1?(a+(a2+2*Math.PI))/2:(a+a2)/2;
    const tip=P(a,r), c1=P(a-0.28,r*0.62), c2=P(a+0.28,r*0.62), inn=P(mid,R*0.3);
    if(!i){ const st=P((lobes[4][0]+lobes[0][0]+2*Math.PI)/2,R*0.3); d+='M'+f1(st[0])+' '+f1(st[1]); }
    d+=' Q'+f1(c1[0])+' '+f1(c1[1])+' '+f1(tip[0])+' '+f1(tip[1])+' Q'+f1(c2[0])+' '+f1(c2[1])+' '+f1(inn[0])+' '+f1(inn[1]); }
  d+='Z'; let v=''; lobes.forEach(([a,r])=>{ const t=P(a,r*0.72); v+='M0 0L'+f1(t[0])+' '+f1(t[1]); });
  return '<g data-item="'+name+'" transform="translate('+x+' '+y+') rotate('+rot+') scale('+s+')"><path d="M0 2 L0 '+f1(R*0.95)+'" stroke="'+PEN+'" stroke-width="'+f1(2.6/s)+'" stroke-linecap="round"/><path d="'+d+'" fill="'+col+'" stroke="'+PEN+'" stroke-width="'+f1(2.4/s)+'" stroke-linejoin="round"/><path d="'+v+'" fill="none" stroke="'+PEN+'" stroke-width="'+f1(1.3/s)+'" stroke-linecap="round" opacity=".55"/></g>'; }
const L=${JSON.stringify(null)};

window.draw=function(){
  measure(); let s=''; const LY=LAYOUT;
  // 1) the hook: a red hanko seal, 「勁正！」 set vertically in cream, a cream inner border
  { const x=LY.hx, y=LY.hy, w=LY.hw, h=LY.hh, cx=x+w/2, cy=y+h/2;
    s+='<g data-item="hook" transform="rotate(-3 '+cx+' '+cy+')"><g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="14" fill="'+HANKO+'"/>'
      +centred([...'勁正！'].map((c)=>({s:c,size:LY.hs,fill:CREAM,pitch:LY.hs*1.06})),cx,cy,ZH).svg+'</g>'
      +'<rect x="'+(x+12)+'" y="'+(y+12)+'" width="'+(w-24)+'" height="'+(h-24)+'" rx="8" fill="none" stroke="'+CREAM+'" stroke-width="5" opacity=".9"/>'
      +pencil(rrPts(x,y,x+w,y+h,14,110),71,2.2,4.4)+'</g>'; }
  // 2) the noren: a wooden rod, an indigo top band with "Doodle Doggo", seven panels, one character each
  { const x0=LY.nx0, x1=LY.nx1, ry=LY.ny, band=LY.nband, ph=LY.nph, gap=LY.ngap, chars=[...'識講廣東話喇！'], n=chars.length, pw=(x1-x0-(n-1)*gap)/n;
    let g='<g data-item="noren">'+'<rect x="'+(x0-14)+'" y="'+ry+'" width="'+(x1-x0+28)+'" height="14" rx="7" fill="'+WOOD+'"/>'+pencil(rrPts(x0-14,ry,x1+14,ry+14,7,80),81,1.4,3.2);
    const by=ry+18;
    g+='<g data-box><rect x="'+x0+'" y="'+by+'" width="'+(x1-x0)+'" height="'+band+'" fill="'+INDIGO+'"/>'+centred([{s:'Doodle Doggo',size:LY.ns,fill:CREAM}],(x0+x1)/2,by+band/2,LAT).svg+'</g>'+pencil(rrPts(x0,by,x1,by+band,4,90),82,1.6,3.6);
    chars.forEach((c,i)=>{ const px=x0+i*(pw+gap), py=by+band;
      g+='<g data-box><rect x="'+f1(px)+'" y="'+py+'" width="'+f1(pw)+'" height="'+ph+'" fill="'+INDIGO+'"/>'+centred([{s:c,size:LY.nc,fill:CREAM}],px+pw/2,py+ph/2,ZH).svg+'</g>'
        +pencil(rrPts(px,py,px+pw,py+ph,3,70),83+i,1.4,3.4); });
    s+=g+'</g>'; }
  // 3) the English line on a paper strip
  { const t='now in Cantonese · our 12th language', k=inkOf(t,LY.es,LAT), w=k.L+k.R+64, cy=LY.ey, EX=(LY.nx0+LY.nx1)/2;
    s+='<g data-item="english"><g data-box><rect x="'+f1(EX-w/2)+'" y="'+(cy-30)+'" width="'+f1(w)+'" height="60" rx="8" fill="'+CREAM+'"/>'+centred([{s:t,size:LY.es,fill:SUBINK}],EX,cy,LAT).svg+'</g>'+pencil(rrPts(EX-w/2,cy-30,EX+w/2,cy+30,8,90),91,1.8,3.8)+'</g>'; }
  // 4) the picture: Asakusa in a wooden frame
  { const x=LY.px0, y=LY.py0, w=LY.px1-LY.px0, h=LY.ph, fr=14;
    s+='<g data-item="picture"><rect x="'+(x-fr)+'" y="'+(y-fr)+'" width="'+(w+2*fr)+'" height="'+(h+2*fr)+'" rx="10" fill="'+WOOD+'"/>'
      +'<svg data-clip x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+PIC_VB+'" preserveAspectRatio="xMidYMid slice">'+SCENE_SVG+'</svg>'
      +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="none" stroke="'+WOODD+'" stroke-width="3"/>'
      +pencil(rrPts(x-fr,y-fr,x+w+fr,y+h+fr,10,110),101,2,4.4)+'</g>'; }
  // 5) the engawa (wooden deck) the dogs stand on, then the dogs, then their bubbles
  { const y=LY.deck; s+='<g data-item="deck"><rect x="66" y="'+y+'" width="948" height="26" rx="4" fill="'+WOOD+'"/>';
    for(let x=66+79;x<1014;x+=79) s+='<path d="M'+x+' '+(y+3)+' V'+(y+23)+'" stroke="'+WOODD+'" stroke-width="2.2"/>';
    s+=pencil(rrPts(66,y,1014,y+26,4,110),111,1.6,3.6)+'</g>'; }
  const pw=(id,h)=>h*BOX[id][2]/BOX[id][3];
  s+=dogAt('chihuahua',LY.cx,LY.deck-4,pw('chihuahua',LY.ch),false).svg;
  s+=dogAt('dachs',LY.dx,LY.deck-4,LY.dw,false).svg;
  s+=dogAt('golden',LY.gx,LY.deck-4,pw('golden',LY.gh),false).svg;
  // 6) the footer: the thank-you strip and an ema plaque with the logo and the website
  const TH='多謝香港朋友逐句幫我哋睇過', tk=inkOf(TH,LY.ths,ZH), thw=tk.L+tk.R+2*24;
  const lw=LY.lw, lh=lw*280/900, URL='doodledoggo.app', us=LY.us, ku=inkOf(URL,us,LAT), uw=ku.L+ku.R, gap=18;
  s+='<g data-item="ema"><path id="emash" d="" fill="'+WOOD+'"/><g id="emapen"></g><svg id="logo" x="0" y="0" width="'+lw+'" height="'+f1(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>'
    +'<text id="url" x="0" y="0" font-family="'+LAT+'" font-weight="700" font-size="'+us+'" fill="'+PEN+'">'+URL+'</text></g>';
  // leaves
  LY.leaves.forEach((q,i)=>{ s+=momiji(q[0],q[1],q[2],q[3],['#D9534A','#E8863A','#E2B23C'][i%3],'leaf '+i); });
  $('items').innerHTML=s;
  const items=$('items'), db=(id)=>items.querySelector('[data-apart="'+id+'"]').getBoundingClientRect();
  const nb=db('dachs'), cb=db('chihuahua'), gb=db('golden');
  const V={pad:[24,26], lh:LY.vs*1.08};
  items.insertAdjacentHTML('beforeend',bubble('Peanut',LINES.chihuahua.lines,LY.vpx,0,LY.vs,MINT,(x,y,w,h)=>[x+w*0.55,y+h-4,x+w*0.55+14,cb.top-30],22,Object.assign({top:LY.vpy},V)));
  items.insertAdjacentHTML('beforeend',bubble('Sunny',LINES.golden.lines,LY.vgx,0,LY.vs,LILAC,(x,y,w,h)=>[x+w*0.45,y+h-4,x+w*0.45-14,gb.top-30],23,Object.assign({top:LY.vgy},V)));
  items.insertAdjacentHTML('beforeend',bubble('Noodle',LINES.dachs.lines,0,LY.nby,LY.nbs,CREAM,(x,y,w,h)=>[x+w*0.7,y+h-4,nb.right-70,nb.top-30],21,{left:LY.nbx}));
  // the footer row: strip + ema, centred as a pair; the ema's logo row centred by the logo's drawn box and the url's ink
  const RY=LY.ry, Lg=$('logo'); let lb=boxOf(Lg); const lt=Lg.getBoundingClientRect(), lbw=lb.right-lb.left, lbh=lb.bottom-lb.top;
  const rowW=lbw+gap+uw, ew=rowW+64, eh=Math.max(lbh,ku.A+ku.D)+44, PAIR=thw+LY.pairgap+ew, x0=540-PAIR/2, ECX=x0+thw+LY.pairgap+ew/2, ECY=RY+8, rx=ECX-rowW/2;
  items.insertAdjacentHTML('beforeend','<g data-item="thanks">'+pill(TH,x0+thw/2,RY,LY.ths,ZH,{fill:YEL,padX:24})+'</g>');
  Lg.setAttribute('x',f1(rx-(lb.left-lt.left))); Lg.setAttribute('y',f1(ECY-lbh/2-(lb.top-lt.top)));
  { const q=boxOf(Lg); Lg.setAttribute('x',f1(parseFloat(Lg.getAttribute('x'))+rx-q.left)); Lg.setAttribute('y',f1(parseFloat(Lg.getAttribute('y'))+ECY-(q.top+q.bottom)/2)); }
  const U=$('url'); U.setAttribute('x',f1(rx+lbw+gap+ku.L)); U.setAttribute('y',f1(ECY+(ku.A-ku.D)/2));
  // the ema: a plaque with a pointed roof (the roof adds 16 px above the body), a little cord hole
  const ex=ECX-ew/2, ey=ECY-eh/2+8, roof=16, emaD='M'+f1(ex)+' '+f1(ey)+' L'+f1(ECX)+' '+f1(ey-roof)+' L'+f1(ex+ew)+' '+f1(ey)+' L'+f1(ex+ew)+' '+f1(ECY+eh/2)+' L'+f1(ex)+' '+f1(ECY+eh/2)+'Z';
  $('emash').setAttribute('d',emaD);
  $('emapen').innerHTML='<path d="'+emaD+'" fill="none" stroke="'+PEN+'" stroke-width="4.4" stroke-linejoin="round"/><circle cx="'+ECX+'" cy="'+f1(ey-2)+'" r="4" fill="'+PAPER_DARK+'" stroke="'+PEN+'" stroke-width="2"/>';
  // ---- checks ----
  const sv=$('sv'), bad=centreCheck(sv);
  bad.push(...apartCheck(sv,28));
  { const a=boxOf(Lg), u=boxOf(U), l=Math.min(a.left,u.left), r=Math.max(a.right,u.right), t=Math.min(a.top,u.top), b=Math.max(a.bottom,u.bottom);
    if(Math.abs((l+r)/2-ECX)>1.5||Math.abs((t+b)/2-ECY)>1.5) bad.push('logo row off centre '+((l+r)/2-ECX).toFixed(1)+', '+((t+b)/2-ECY).toFixed(1)); }
  const its=[...sv.querySelectorAll('[data-item]')].map((e)=>({n:e.getAttribute('data-item'),r:boxOf(e)}));
  for(const it of its){ const r=it.r; if(r.left<MARGIN||r.right>W-MARGIN||r.top<MARGIN||r.bottom>H-MARGIN) bad.push('outside the margins: '+it.n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round)); }
  const near=[];
  for(let i=0;i<its.length;i++) for(let j=i+1;j<its.length;j++){ const a=its[i].r, b=its[j].r;
    const d=Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom); near.push([its[i].n,its[j].n,Math.round(d)]);
    // the dogs stand ON the deck: dog and deck may touch, nothing else may
    if(/^dog /.test(its[i].n+its[j].n.replace(/^/,''))&&false) continue;
    const touchOk=(/^dog /.test(its[i].n)&&its[j].n==='deck')||(/^dog /.test(its[j].n)&&its[i].n==='deck');
    if(!touchOk&&d<GAP) bad.push(its[i].n+' and '+its[j].n+' only '+Math.round(d)+' px apart'); }
  near.sort((a,b)=>a[2]-b[2]);
  return {bad, closest:near.filter((q)=>!/deck/.test(q[0]+q[1])).slice(0,8), items:its.map((x)=>x.n+' '+[x.r.left,x.r.top,x.r.right,x.r.bottom].map(Math.round).join(','))};
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)) });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const tmp = path.join(os.tmpdir(), `cantonese_japan_${process.pid}.html`); fs.writeFileSync(tmp, html.replace('const L=null;', 'const LAYOUT=' + JSON.stringify(LAYOUT) + ', PAPER_DARK="#E9DCC3";'));
  await p.goto('file://' + tmp); await p.waitForLoadState('networkidle');
  const zh = [...new Set(('勁正！識講廣東話喇多謝香港朋友逐句幫我哋睇過' + Object.values(LINES).map((l) => l.lines.join('')).join('')).split(''))].join('');
  await p.evaluate((zh) => Promise.all(['600 40px Caveat', '700 40px Caveat'].map((f) => document.fonts.load(f, 'Doodle Doggo 12th · now in Cantonese our language doodledoggo.app')).concat([document.fonts.load('700 40px Iansui', zh), document.fonts.load('400 40px Iansui', zh)])), zh);
  const r = await p.evaluate(() => window.draw());
  console.log('closest items:', r.closest.map((c) => `${c[0]} ~ ${c[1]} ${c[2]}px`).join('; '));
  if (process.env.VERBOSE) console.log(r.items.join('\n'));
  if (r.bad.length) { await p.screenshot({ path: OUT.replace(/\.jpg$/, '.failed.jpg'), type: 'jpeg', quality: 80 }); throw new Error(r.bad.join('; ')); }
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT, type: 'jpeg', quality: 92 }); await b.close(); fs.rmSync(tmp);
  console.log('wrote', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
