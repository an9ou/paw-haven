// The Cantonese launch poster (v2.23.2 "廣東話 Cantonese", live 9 Nov 2026): ONE 1080 x 1350 Instagram image.
// Sketchbook paper and crayon lines; the headline in Cantonese, a small English line; Noodle the dachshund big with a crayon speech bubble
// holding his REAL line from the game's Cantonese text (game/i18n/yue.json on main), Peanut the Chihuahua and Sunny the Golden Retriever
// with theirs; the thank-you to our Hong Kong friend who checked every line; the logo and doodledoggo.app. No flags, no other links.
// The dogs and the logo are today's art (ART_ROOT = a checkout of origin/main). Latin text is Caveat; the Chinese is Iansui, the face the game
// itself uses for yue and zh-Hant (game/fonts/i18n/yue.css, tools/i18n_fonts.js), both from Google Fonts (needs network).
// Checks (the build throws): every bubble and pill text ink-centred in its box (../centre_text.js centreCheck), the headline lines ink-centred
// on the page, the dogs at least 28 px apart (apartCheck), no two drawn items (texts, bubbles, dogs, stickers, logo) closer than GAP px,
// and nothing drawn outside the 60 px margins.
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
  chihuahua: { key: 'data.sig.chihuahua.say', lines: ['我係八號風球！！'] },        // Peanut's signature trick: "I AM A WEATHER EVENT." (Typhoon Signal No. 8)
  golden: { key: 'data.sr_lines.fetch.2', lines: ['睇下我搵到乜！'] },              // a shelter dog's fetch line: "Look what I found!"
};
const yue = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'yue.json'), 'utf8'));
const get = (o, k) => o[k]; // the file's keys are flat ("data.sig.dachs.say")
for (const [id, l] of Object.entries(LINES)) { const v = get(yue, l.key); if (v !== l.lines.join('')) throw new Error(`${id}: ${l.key} is "${v}" in yue.json, not "${l.lines.join('')}"`); }

// ---------- today's art ----------
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const ART = {
  dachs: inner(win.PawArt.dog('dachs', { anim: false, pose: 'happy' })),
  chihuahua: inner(win.PawArt.dog('chihuahua', { anim: false, pose: 'happy' })),
  golden: inner(win.PawArt.dog('golden', { anim: false, pose: 'happy' })),
};
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
<pattern id="stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="#fff" opacity=".5"/></pattern></defs>
<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" fill="url(#dots)"/>${box(30, 30, W - 60, H - 60, 30, 11, 3, 5)}
<g id="items"></g><g id="probe"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
const ART=${JSON.stringify(ART)}, LINES=${JSON.stringify(LINES)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)};
const W=${W}, H=${H}, MARGIN=${MARGIN}, GAP=${GAP}, LAT='Caveat', ZH='Iansui';
const PEN='${PEN}', CREAM='${CREAM}', MUTED='${MUTED}', PINK='${PINK}', YEL='${YEL}', MINT='${MINT}', LILAC='${LILAC}';
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
  const bw0=w+2*pad[0]; if(o&&o.left!=null) cx=o.left+bw0/2;
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

window.draw=function(){
  measure(); let s='';
  // 1) the headline: "Doodle Doggo" (Caveat) over 「識講廣東話喇！」 (Iansui), a pink crayon swash under 廣東話; the English line under it
  const L1='Doodle Doggo', L2='識講廣東話喇！', SUB='now in Cantonese · our 12th language';
  const s1=fit(L1,114,LAT,740), s2=fit(L2,114,ZH,880), s3=fit(SUB,50,LAT,800);
  const y1=116, y2=230, y3=330;
  const k2=inkOf(L2,s2,ZH), x2=540+(k2.L-k2.R)/2, pre=ink('識講',s2,ZH).w, mid=ink('識講廣東話',s2,ZH).w;
  const sw0=x2-k2.L+pre-4, sw1=x2-k2.L+mid+8, swy=y2+s2*0.30;
  s+='<g data-item="headline">'
    +'<path d="M'+f1(sw0)+' '+f1(swy+6)+' Q'+f1((sw0+sw1)/2)+' '+f1(swy-8)+' '+f1(sw1)+' '+f1(swy+2)+'" fill="none" stroke="'+PINK+'" stroke-width="28" stroke-linecap="round" opacity=".5"/>'
    +centred([{s:L1,size:s1}],540,y1,LAT).svg+centred([{s:L2,size:s2}],540,y2,ZH).svg+'</g>';
  s+='<g data-item="sub">'+centred([{s:SUB,size:s3,fill:MUTED}],540,y3,LAT).svg+'</g>';
  // 2) Noodle, big, his bubble beside his head (the tail points at his mouth)
  const NW=600, NX=384, NTOP=384, nb=BOX.dachs, NH=nb[3]*NW/nb[2], nd=dogAt('dachs',NX,NTOP+NH,NW,false); s+=nd.svg;
  const nby=NTOP+NH*0.34;
  s+=bubble('Noodle',LINES.dachs.lines,0,nby,44,CREAM,(x,y,w,h)=>[x+4,y+h*0.62,x-34,y+h*0.74],21,{left:NX+NW/2+70});
  // 3) Peanut and Sunny on the bottom row, each with a one-line bubble over the head
  const FEET=1108, BY=788;
  const pw=(id,h)=>h*BOX[id][2]/BOX[id][3];
  s+=bubble('Peanut',LINES.chihuahua.lines,262,BY,42,MINT,(x,y,w,h)=>[x+w*0.5,y+h-4,x+w*0.5+16,y+h+38],22);
  s+=dogAt('chihuahua',262,FEET,pw('chihuahua',202),false).svg;
  s+=bubble('Sunny',LINES.golden.lines,800,BY,42,LILAC,(x,y,w,h)=>[x+w*0.5,y+h-4,x+w*0.5-16,y+h+38],23);
  s+=dogAt('golden',800,FEET,pw('golden',202),false).svg;
  // 4) the thank-you
  const TH='多謝香港朋友逐句幫我哋睇過', TY=1170;
  s+='<g data-item="thanks" transform="rotate(-1.2 540 '+TY+')">'+pill(TH,540,TY,38,ZH,{fill:YEL,padX:30})+'</g>';
  // 5) the logo and the website, side by side, centred as a pair
  const lw=250, lh=lw*280/900, ly=1210;
  const URL='doodledoggo.app', us=52, uw=ink(URL,us,LAT).w, gap=30, tot=lw+gap+uw, lx=540-tot/2;
  s+='<svg data-item="logo" x="'+f1(lx)+'" y="'+ly+'" width="'+lw+'" height="'+f1(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>';
  s+='<g data-item="url">'+centred([{s:URL,size:us}],lx+lw+gap+uw/2,ly+lh*0.56,LAT).svg+'</g>';
  // 6) a few crayon stickers in the free corners
  s+=spark(992,236,1.2,10,'spark 1')+heart(90,240,1.1,-14,'heart 1')+spark(540,1030,1.0,-8,'spark 2');
  $('items').innerHTML=s;
  // ---- checks ----
  const sv=$('sv'), bad=centreCheck(sv);
  bad.push(...apartCheck(sv,28));
  const its=[...sv.querySelectorAll('[data-item]')].map((e)=>({n:e.getAttribute('data-item'),r:boxOf(e)}));
  for(const it of its){ const r=it.r; if(r.left<MARGIN||r.right>W-MARGIN||r.top<MARGIN||r.bottom>H-MARGIN) bad.push('outside the margins: '+it.n+' '+[r.left,r.top,r.right,r.bottom].map(Math.round)); }
  const near=[];
  for(let i=0;i<its.length;i++) for(let j=i+1;j<its.length;j++){ const a=its[i].r, b=its[j].r;
    const d=Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom); near.push([its[i].n,its[j].n,Math.round(d)]);
    if(d<GAP) bad.push(its[i].n+' and '+its[j].n+' only '+Math.round(d)+' px apart'); }
  // the headline lines and the English line: ink-centred on x 540
  for(const [t,size,fam] of [[L1,s1,LAT],[L2,s2,ZH],[SUB,s3,LAT]]){ const e=[...sv.querySelectorAll('text')].find((x)=>x.textContent===t), k=inkOf(t,size,fam), x=parseFloat(e.getAttribute('x'));
    const c=(x-k.L+x+k.R)/2; if(Math.abs(c-540)>1.5) bad.push(t+' off centre by '+c.toFixed(1)); }
  near.sort((a,b)=>a[2]-b[2]);
  return {bad, closest:near.slice(0,8), sizes:[s1,s2,s3], items:its.map((x)=>x.n+' '+[x.r.left,x.r.top,x.r.right,x.r.bottom].map(Math.round).join(','))};
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)) });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const tmp = path.join(os.tmpdir(), `cantonese_post_${process.pid}.html`); fs.writeFileSync(tmp, html);
  await p.goto('file://' + tmp); await p.waitForLoadState('networkidle');
  const zh = [...new Set(('識講廣東話喇！多謝香港朋友逐句幫我哋睇過' + Object.values(LINES).map((l) => l.lines.join('')).join('')).split(''))].join('');
  await p.evaluate((zh) => Promise.all(['600 40px Caveat', '700 40px Caveat'].map((f) => document.fonts.load(f, 'Doodle Doggo 12th · now.app')).concat([document.fonts.load('700 40px Iansui', zh), document.fonts.load('400 40px Iansui', zh)])), zh);
  const r = await p.evaluate(() => window.draw());
  console.log('sizes', r.sizes.join(' / '), '| closest items:', r.closest.map((c) => `${c[0]} ~ ${c[1]} ${c[2]}px`).join('; '));
  if (process.env.VERBOSE) console.log(r.items.join('\n'));
  if (r.bad.length) { await p.screenshot({ path: OUT.replace(/\.jpg$/, '.failed.jpg'), type: 'jpeg', quality: 80 }); throw new Error(r.bad.join('; ')); }
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT, type: 'jpeg', quality: 92 }); await b.close(); fs.rmSync(tmp);
  console.log('wrote', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
