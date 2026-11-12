// The Cantonese launch poster (v2.23.2 "廣東話 Cantonese", live 9 Nov 2026): ONE 1080 x 1350 Instagram image.
// Owner, 12 Nov 2026: a hook headline and the game's own background. The hook 「勁正！」 sits big in a crayon sticker burst, then a cream card
// with 「Doodle Doggo 識講廣東話喇！」 and "now in Cantonese · our 12th language". Behind everything: the game's Mt. Fuji Lookout on an autumn
// day (PawArt.scene 'fujihill' with v215, the art the game draws today), filling the poster inside a thin sketchbook edge. Noodle the
// dachshund big, Peanut the Chihuahua and Sunny the Golden Retriever stand on the meadow, each with a crayon speech bubble holding a REAL line
// from the game's Cantonese text (game/i18n/yue.json on main, checked at build time); the thank-you to our Hong Kong friend who checked every
// line; the logo and doodledoggo.app on a cream card. Every text sits on a solid card, burst, bubble or pill, never on the scene. No flags.
// The dogs, the scene and the logo are today's art (ART_ROOT = a checkout of origin/main). Latin text is Caveat; the Chinese is Iansui, the
// face the game itself uses for yue and zh-Hant (game/fonts/i18n/yue.css, tools/i18n_fonts.js), both from Google Fonts (needs network).
// Checks (the build throws): every bubble, burst, card and pill text ink-centred in its box (../centre_text.js centreCheck; the logo row by
// its drawn box), the dogs at least 28 px apart (apartCheck), no two drawn items closer than GAP px, nothing outside the 60 px margins, and
// every dog's feet on the meadow, in front of the scene's objects.
//
//   git worktree add --detach <scratch>/main origin/main
//   ART_ROOT=<scratch>/main NODE_PATH=$(npm root -g) node brand/instagram/launch/cantonese_post/build_cantonese_post.js [out.jpg]
//   (default out: brand/instagram/launch/cantonese_post/cantonese-launch.jpg)
const path = require('path'), fs = require('fs'), vm = require('vm'), os = require('os');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'cantonese-launch.jpg'));
const W = 1080, H = 1350, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', DOT = '#E3D2BA', MUTED = '#8A7468', PINK = '#F28FA5', YEL = '#FFE3A1', MINT = '#CDEBD2', LILAC = '#E0D5F0';
const MARGIN = 60, GAP = 20;

// ---------- the real lines from the game (game/i18n/yue.json on main), checked against the file at build time ----------
const LINES = {
  dachs: { key: 'data.sig.dachs.say', lines: ['扭呀扭。', '後面嗰半', '遲到咗。'] }, // Noodle's signature trick: "Wiggle wiggle. The back half is late."
  chihuahua: { key: 'data.sig.chihuahua.say', lines: ['我係', '八號', '風球！！'] },        // Peanut's signature trick: "I AM A WEATHER EVENT." (Typhoon Signal No. 8)
  golden: { key: 'data.sr_lines.fetch.2', lines: ['睇下我', '搵到乜！'] },              // a shelter dog's fetch line: "Look what I found!"
};
const yue = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'yue.json'), 'utf8'));
const get = (o, k) => o[k]; // the file's keys are flat ("data.sig.dachs.say")
for (const [id, l] of Object.entries(LINES)) { const v = get(yue, l.key); if (v !== l.lines.join('')) throw new Error(`${id}: ${l.key} is "${v}" in yue.json, not "${l.lines.join('')}"`); }

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
// the background: the Mt. Fuji Lookout as the game draws it today (v215), an autumn day; S/TX/TY place its 1000 x 600 canvas on the poster
const SCENE = { name: 'fujihill', env: { time: 'day', weather: 'sunny', season: 'autumn', jp: true, halloween: false, v215: true }, S: 2.2, TX: -154, TY: 49 }; // the scene starts 19 px below the frame: a second copy fills the sky above it
const OBJ_FEET = 440; // the scene y where its lanterns, torii and bench stand: no dog's head (hearts aside) rises above it
// where things go (poster px): the hook and the card; Noodle's centre x and width; the corner dogs' centres and heights; one feet line; the bubbles; the bottom row
const LAYOUT = { hy: 150, hs: 128, hrx: 268, hry: 74, cy: 334, c1: 56, c2: 52, c3: 30,
  nx: 540, nw: 372, px: 165, gx: 905, nfeet: 1186, cfeet: 1186, ph: 198, gh: 182, nbx: 552, nbup: 186, nbs: 32, pbx: 66, pbup: 164, gbr: 1000, cbup: 150, cbs: 32,
  ry: 1254, ths: 30, us: 40, pairgap: 26 };
// the scene's two corner washi tapes belong to its own frame in the game, not to the place: left out of the poster
const SCENE_SVG = inner(win.PawArt.scene(SCENE.name, SCENE.env)).replace(/<g transform="translate\(\d+ \d+\) rotate\(-2\d\)"><path d="M0 0l-3 4\.4[^"]*"[^>]*\/>.*?<\/g>/g, '');
const BACK = Number(/data-back="([\d.]+)"/.exec(win.PawArt.scene(SCENE.name, SCENE.env))[1]); // the meadow's back line (scene y)
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

// ---------- the page: layout runs in the browser, where the text ink and the drawn dogs can be measured ----------
const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Iansui&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${PAPER}}svg{display:block}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.3" fill="${DOT}"/></pattern>
<pattern id="stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="#fff" opacity=".5"/></pattern>
<clipPath id="sceneclip"><rect x="33" y="33" width="${W - 66}" height="${H - 66}" rx="30"/></clipPath></defs>
<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" fill="url(#dots)"/>
<g clip-path="url(#sceneclip)"><g transform="translate(${SCENE.TX} 20) scale(${SCENE.S})">${SCENE_SVG.replace(/id="([^"]+)"/g, 'id="$1_up"').replace(/url\(#([^)]+)\)/g, 'url(#$1_up)').replace(/href="#([^"]+)"/g, 'href="#$1_up"')}</g><g transform="translate(${SCENE.TX} ${SCENE.TY}) scale(${SCENE.S})">${SCENE_SVG}</g></g>${box(30, 30, W - 60, H - 60, 28, 11, 3, 5)}
<g id="items"></g><g id="probe"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
const LAYOUT=${JSON.stringify(LAYOUT)}, ART=${JSON.stringify(ART)}, LINES=${JSON.stringify(LINES)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)};
const W=${W}, H=${H}, MARGIN=${MARGIN}, GAP=${GAP}, LAT='Caveat', ZH='Iansui', SC=${JSON.stringify(SCENE)}, BACK=${BACK}, OBJ_FEET=${OBJ_FEET};
const RED='#E5484D', PEN='${PEN}', CREAM='${CREAM}', MUTED='${MUTED}', PINK='${PINK}', YEL='${YEL}', MINT='${MINT}', LILAC='${LILAC}';
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
function bubble(id,lines,cx,cy,size,fill,tail,seed,o){ const pad=[38,30], lh=size*1.28;
  let w=0; lines.forEach((s)=>{ w=Math.max(w,ink(s,size,ZH).w); });
  const bw0=w+2*pad[0]; if(o&&o.left!=null) cx=o.left+bw0/2; if(o&&o.right!=null) cx=o.right-bw0/2;
  const bw=bw0, bh=(lines.length-1)*lh+size*1.02+2*pad[1], x=cx-bw/2, y=cy-bh/2, r=Math.min(40,bh/2);
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
  const leaves=el.matches('path,rect,ellipse,circle,polygon,polyline,line,text,image,use')?[el]:[...el.querySelectorAll('path,rect,ellipse,circle,polygon,polyline,line,text,image,use')];
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
// scene x/y to poster
const SX=(x)=>SC.TX+x*SC.S, SY=(y)=>SC.TY+y*SC.S;

window.draw=function(){
  measure(); let s='';
  // 1) the hook: 「勁正！」 huge, pink-red with a cream and an ink outline, in a yellow crayon sticker burst
  const HOOK='勁正！', hs=LAYOUT.hs, hk=inkOf(HOOK,hs,ZH), BX=540, BYc=LAYOUT.hy, brx=LAYOUT.hrx, bry=LAYOUT.hry;
  const hx=BX+(hk.L-hk.R)/2, hy=BYc+(hk.A-hk.D)/2;
  s+='<g data-item="hook" transform="rotate(-2 '+BX+' '+BYc+')"><path d="'+burst(BX,BYc,brx,bry,16,7)+'" fill="'+YEL+'" stroke="'+PEN+'" stroke-width="5" stroke-linejoin="round"/>'
    +'<g data-box><rect x="'+(BX-150)+'" y="'+(BYc-50)+'" width="300" height="100" fill="none"/>'
    +'<text x="'+f1(hx)+'" y="'+f1(hy)+'" font-family="'+ZH+'" font-weight="700" font-size="'+hs+'" fill="'+RED+'" stroke="'+PEN+'" stroke-width="22" stroke-linejoin="round" paint-order="stroke">'+HOOK+'</text>'
    +'<text x="'+f1(hx)+'" y="'+f1(hy)+'" font-family="'+ZH+'" font-weight="700" font-size="'+hs+'" fill="'+RED+'" stroke="'+CREAM+'" stroke-width="11" stroke-linejoin="round" paint-order="stroke">'+HOOK+'</text></g></g>';
  // 2) the card: 「Doodle Doggo 識講廣東話喇！」 on one line (Caveat + Iansui), the English line under it
  const r1=row([{s:'Doodle Doggo',size:LAYOUT.c1,fam:LAT},{s:'識講廣東話喇！',size:LAYOUT.c2,fam:ZH}],18), SUB='now in Cantonese · our 12th language', k3=inkOf(SUB,LAYOUT.c3,LAT);
  const CX=540, CY=LAYOUT.cy, lead=16, blockH=r1.A+r1.D+lead+k3.A+k3.D, top=CY-blockH/2, b1=top+r1.A, b2=b1+r1.D+lead+k3.A;
  const cw=Math.max(r1.w,k3.L+k3.R)+70, ch=blockH+38;
  let card='<g data-item="card"><g data-box><rect x="'+f1(CX-cw/2)+'" y="'+f1(CY-ch/2)+'" width="'+f1(cw)+'" height="'+f1(ch)+'" rx="30" fill="'+CREAM+'"/>';
  const x0=CX-r1.w/2; r1.parts.forEach((p)=>{ card+=T(p,x0+p.x,b1); });
  card+=T({s:SUB,size:LAYOUT.c3,fam:LAT,fill:MUTED},CX+(k3.L-k3.R)/2,b2)+'</g>'+pencil(rrPts(CX-cw/2,CY-ch/2,CX+cw/2,CY+ch/2,30,110),31,2.2,4.6)+'</g>';
  s+=card;
  // 3) the dogs on the meadow, in a row in front of the scene's objects (their heads below the objects' feet); each bubble over its own dog
  const LY=LAYOUT, pw=(id,h)=>h*BOX[id][2]/BOX[id][3], NH=BOX.dachs[3]*LY.nw/BOX.dachs[2];
  s+=dogAt('dachs',LY.nx,LY.nfeet,LY.nw,false).svg;
  s+=dogAt('chihuahua',LY.px,LY.cfeet,pw('chihuahua',LY.ph),false).svg;
  s+=dogAt('golden',LY.gx,LY.cfeet,pw('golden',LY.gh),false).svg;
  // 4) the bottom row: the thank-you pill and the logo card side by side, centred as a pair
  const TH='多謝香港朋友逐句幫我哋睇過', tk=inkOf(TH,LY.ths,ZH), thw=tk.L+tk.R+2*24;
  const lw=200, lh=lw*280/900, URL='doodledoggo.app', us=LY.us, ku=inkOf(URL,us,LAT), uw=ku.L+ku.R, gap=18;
  s+='<g data-item="logocard"><rect id="lcard" x="0" y="0" width="10" height="10" rx="24" fill="'+CREAM+'"/><g id="lcpen"></g><svg id="logo" x="0" y="0" width="'+lw+'" height="'+f1(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>'
    +'<text id="url" x="0" y="0" font-family="'+LAT+'" font-weight="700" font-size="'+us+'" fill="'+PEN+'">'+URL+'</text></g>';
  $('items').innerHTML=s;
  // the bubbles go where the dogs' heads are (measured)
  const items=$('items'), db=(id)=>items.querySelector('[data-apart="'+id+'"]').getBoundingClientRect();
  const nb=db('dachs'), cb=db('chihuahua'), gb=db('golden');
  items.insertAdjacentHTML('beforeend',bubble('Noodle',LINES.dachs.lines,0,nb.top-LY.nbup,LY.nbs,CREAM,(x,y,w,h)=>[x+w*0.5,y+h-4,x+w*0.5+6,nb.top-32],21,{left:LY.nbx}));
  items.insertAdjacentHTML('beforeend',bubble('Peanut',LINES.chihuahua.lines,0,cb.top-LY.pbup,LY.cbs,MINT,(x,y,w,h)=>[x+w*0.42,y+h-4,x+w*0.42+8,cb.top-32],22,{left:LY.pbx}));
  items.insertAdjacentHTML('beforeend',bubble('Sunny',LINES.golden.lines,0,gb.top-LY.cbup,LY.cbs,LILAC,(x,y,w,h)=>[x+w*0.5,y+h-4,x+w*0.5+4,gb.top-32],23,{right:LY.gbr}));
  const RY=LY.ry;
  const L=$('logo'); const lb=boxOf(L); const lt=L.getBoundingClientRect(); const offL=lb.left-lt.left, offT=lb.top-lt.top, lbw=lb.right-lb.left, lbh=lb.bottom-lb.top;
  const rowW=lbw+gap+uw, rowH=Math.max(lbh,ku.A+ku.D), cw2=rowW+44, ch2=rowH+24, PAIR=thw+LY.pairgap+cw2, px0=540-PAIR/2, LCX=px0+thw+LY.pairgap+cw2/2, rx=LCX-rowW/2;
  items.insertAdjacentHTML('beforeend','<g data-item="thanks">'+pill(TH,px0+thw/2,RY,LY.ths,ZH,{fill:YEL,padX:24})+'</g>');
  L.setAttribute('x',f1(rx-offL)); L.setAttribute('y',f1(RY-lbh/2-offT));
  { const q=boxOf(L); L.setAttribute('x',f1(parseFloat(L.getAttribute('x'))+rx-q.left)); L.setAttribute('y',f1(parseFloat(L.getAttribute('y'))+RY-(q.top+q.bottom)/2)); } // a second pass: the measured box is exact
  const U=$('url'); U.setAttribute('x',f1(rx+lbw+gap+ku.L)); U.setAttribute('y',f1(RY+(ku.A-ku.D)/2));
  const c=$('lcard'); c.setAttribute('x',f1(LCX-cw2/2)); c.setAttribute('y',f1(RY-ch2/2)); c.setAttribute('width',f1(cw2)); c.setAttribute('height',f1(ch2));
  $('lcpen').innerHTML=pencil(rrPts(LCX-cw2/2,RY-ch2/2,LCX+cw2/2,RY+ch2/2,24,110),41,2,4.2);
  // ---- checks ----
  const sv=$('sv'), bad=centreCheck(sv);
  bad.push(...apartCheck(sv,28));
  { const a=boxOf(L), u=boxOf(U), l=Math.min(a.left,u.left), r=Math.max(a.right,u.right), t=Math.min(a.top,u.top), b=Math.max(a.bottom,u.bottom);
    if(Math.abs((l+r)/2-LCX)>1.5||Math.abs((t+b)/2-RY)>1.5) bad.push('logo row off centre '+((l+r)/2-LCX).toFixed(1)+', '+((t+b)/2-RY).toFixed(1)); }
  const its=[...sv.querySelectorAll('[data-item]')].map((e)=>({n:e.getAttribute('data-item'),r:boxOf(e)}));
  for(const it of its){ const r=it.r; if(r.left<MARGIN||r.right>W-MARGIN||r.top<MARGIN||r.bottom>H-MARGIN) bad.push('outside the margins: '+it.n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round)); }
  const near=[];
  for(let i=0;i<its.length;i++) for(let j=i+1;j<its.length;j++){ const a=its[i].r, b=its[j].r;
    const d=Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom); near.push([its[i].n,its[j].n,Math.round(d)]);
    if(d<GAP) bad.push(its[i].n+' and '+its[j].n+' only '+Math.round(d)+' px apart'); }
  // the dogs' feet on the meadow, well in front of the back line where the scene's objects stand
  if(Math.min(LY.nfeet,LY.cfeet)<SY(BACK)+200) bad.push('dogs stand too close to the back line ('+Math.round(SY(BACK))+')');
  for(const [id,r] of [['dachs',nb],['chihuahua',cb],['golden',gb]]) if(r.top+30<SY(OBJ_FEET)) bad.push(id+' rises '+Math.round(SY(OBJ_FEET)-r.top)+' px into the scene objects (their feet at '+Math.round(SY(OBJ_FEET))+')');
  near.sort((a,b)=>a[2]-b[2]);
  return {bad, closest:near.slice(0,8), back:Math.round(SY(BACK)), items:its.map((x)=>x.n+' '+[x.r.left,x.r.top,x.r.right,x.r.bottom].map(Math.round).join(','))};
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)) });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const tmp = path.join(os.tmpdir(), `cantonese_post_${process.pid}.html`); fs.writeFileSync(tmp, html);
  await p.goto('file://' + tmp); await p.waitForLoadState('networkidle');
  const zh = [...new Set(('勁正識講廣東話喇！多謝香港朋友逐句幫我哋睇過' + Object.values(LINES).map((l) => l.lines.join('')).join('')).split(''))].join('');
  await p.evaluate((zh) => Promise.all(['600 40px Caveat', '700 40px Caveat'].map((f) => document.fonts.load(f, 'Doodle Doggo 12th · now in Cantonese our language doodledoggo.app')).concat([document.fonts.load('700 40px Iansui', zh), document.fonts.load('400 40px Iansui', zh)])), zh);
  const r = await p.evaluate(() => window.draw());
  console.log('meadow back line y', r.back, '| closest items:', r.closest.map((c) => `${c[0]} ~ ${c[1]} ${c[2]}px`).join('; '));
  if (process.env.VERBOSE) console.log(r.items.join('\n'));
  if (r.bad.length) { await p.screenshot({ path: OUT.replace(/\.jpg$/, '.failed.jpg'), type: 'jpeg', quality: 80 }); throw new Error(r.bad.join('; ')); }
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT, type: 'jpeg', quality: 92 }); await b.close(); fs.rmSync(tmp);
  console.log('wrote', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
