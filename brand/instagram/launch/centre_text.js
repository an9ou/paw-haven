// Owner's rule (1 Nov 2026): every text inside a window, card, bubble or pill sits in its exact centre, across and up and down, in every Reel.
// Fonts like Caveat draw their glyphs off their font box (a "?" or a "3" sits high and to the side), so text-anchor="middle" and a guessed
// baseline are not enough. This helper centres by the INK: canvas measureText gives each line's real drawn bounds.
//
// Use in a Reel's page script (a string dropped into the page's <script>):
//   const { CENTRE_JS } = require('../centre_text.js');   ... `<script>${CENTRE_JS} ... </script>`
// Then in the page:
//   centred(lines, cx, cy, fam)  lines: [{ s, size, fill?, pitch? }]  (pitch: baseline to next baseline, default size * 1.2)
//       returns { svg, ys }: <text> elements whose ink, as one block, is centred on (cx, cy); ys are the baselines.
//   pill(s, cx, cy, size, fam, { fill, stroke, padX, op })  a rounded pill sized to the text, text centred in it.
//   Put each box in <g data-box> with its <rect> or <circle> and its centred() texts as direct children.
//   centreCheck(svgRoot)  returns the boxes whose text is more than 1.5 px off centre; the build script throws if any are.
// Load the faces before the first measure (await document.fonts.load('700 40px Caveat')): a page with no text yet loads no web font, and
// fonts.ready resolves at once. inkOf throws if the face is not loaded (2 Nov 2026: a fallback face shifted every box ~50 px and the check, using
// the same measure, could not see it).
const CENTRE_JS = `
const INK_={};
function inkOf(s,size,fam){ const k=s+'|'+size+'|'+fam; if(INK_[k]) return INK_[k]; const c=(inkOf.c||(inkOf.c=document.createElement('canvas').getContext('2d')));
  c.font='700 '+size+'px '+fam;
  if(document.fonts&&!document.fonts.check(c.font,s)) throw new Error('font not loaded yet, the ink would be measured in a fallback face: '+c.font+' (await document.fonts.load first)');
  const m=c.measureText(s);
  return INK_[k]={L:m.actualBoundingBoxLeft,R:m.actualBoundingBoxRight,A:m.actualBoundingBoxAscent,D:m.actualBoundingBoxDescent}; }
function centred(lines,cx,cy,fam){ let b=0; const bs=lines.map((l,i)=>{ const y=b; b+=l.pitch||l.size*1.2; return y; });
  let top=1e9, bot=-1e9; lines.forEach((l,i)=>{ const k=inkOf(l.s,l.size,fam); top=Math.min(top,bs[i]-k.A); bot=Math.max(bot,bs[i]+k.D); });
  const sh=cy-(top+bot)/2, ys=bs.map((y)=>y+sh);
  const svg=lines.map((l,i)=>{ const k=inkOf(l.s,l.size,fam), x=cx+(k.L-k.R)/2;
    return '<text x="'+x.toFixed(2)+'" y="'+ys[i].toFixed(2)+'" font-family="'+fam.replace(/"/g,"'")+'" font-weight="700" font-size="'+l.size+'" fill="'+(l.fill||'#5B3D32')+'" text-anchor="start">'+l.s+'</text>'; }).join('');
  return {svg, ys}; }
function pill(s,cx,cy,size,fam,o){ o=o||{}; const k=inkOf(s,size,fam), w=k.L+k.R+2*(o.padX||30), h=Math.round(size*1.35);
  return '<g data-box'+(o.op!=null?' opacity="'+o.op+'"':'')+'><rect x="'+(cx-w/2)+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'" fill="'+(o.fill||'#FFFDF7')+'" stroke="'+(o.stroke||'#5B3D32')+'" stroke-width="4"/>'+centred([{s,size,fill:o.color}],cx,cy,fam).svg+'</g>'; }
function centreCheck(root){ const bad=[];
  root.querySelectorAll('g[data-box]').forEach((g)=>{ const sh=g.querySelector(':scope>rect,:scope>circle'), ts=[...g.querySelectorAll(':scope>text')]; if(!sh||!ts.length) return;
    const n=(e,a)=>parseFloat(e.getAttribute(a)||0);
    const bx=sh.tagName==='rect'?n(sh,'x')+n(sh,'width')/2:n(sh,'cx'), by=sh.tagName==='rect'?n(sh,'y')+n(sh,'height')/2:n(sh,'cy');
    let l=1e9,r=-1e9,t=1e9,b=-1e9; ts.forEach((e)=>{ const k=inkOf(e.textContent,n(e,'font-size'),e.getAttribute('font-family')), x=n(e,'x'), y=n(e,'y');
      l=Math.min(l,x-k.L); r=Math.max(r,x+k.R); t=Math.min(t,y-k.A); b=Math.max(b,y+k.D); });
    const dx=(l+r)/2-bx, dy=(t+b)/2-by; if(Math.abs(dx)>1.5||Math.abs(dy)>1.5) bad.push(ts.map((e)=>e.textContent).join(' / ')+' off by '+dx.toFixed(1)+', '+dy.toFixed(1)); });
  return bad; }
`;
// Owner's rule (2 Nov 2026): ONE Reel for every platform, and nothing of ours under a platform's buttons. YouTube Shorts, Instagram Reels and TikTok
// lay their buttons over the right side and their titles, names and captions over the top and the bottom; on a tall phone Instagram also trims
// ~48 px off each side (measured on our posted puppy-colour Reel, 2 Nov 2026: top bar to y 251, buttons from x 917 between y 1163 and 1867,
// name and caption from y 1696). So every word AND every window, card, box, bubble and pill we draw stays inside SAFE (x 60..890, y 270..1440
// of 1080 x 1920; centre on x 475). Game footage may fill the frame behind. In the page: safeCheck(root) returns every visible <text>
// (font box, 22 px slack) and every visible <g data-box> or [data-safe] element (its drawn box, 4 px slack) outside SAFE; the build throws
// if any are, on every frame, next to centreCheck(). Mark any other drawn window or sticker with data-safe. First used by friends_reel/build_friends.js.
const SAFE_JS = `
const SAFE={x0:60,x1:890,y0:270,y1:1440}, SAFE_CX=475;
function safeCheck(root){ root=root||document; const bad=[];
  const vis=(e)=>{ let o=1; for(let p=e;p&&p!==root;p=p.parentNode) if(p.getAttribute&&p.getAttribute('opacity')!=null) o*=parseFloat(p.getAttribute('opacity')); return o>=0.05; };
  const out=(e,m,what)=>{ if(!vis(e)) return; const r=e.getBoundingClientRect(); if(!r.width&&!r.height) return;
    if(r.left<SAFE.x0-m||r.right>SAFE.x1+m||r.top<SAFE.y0-m||r.bottom>SAFE.y1+m) bad.push(what+' "'+(e.textContent||'').trim().slice(0,40)+'" at '+[r.left,r.top,r.right,r.bottom].map(Math.round)); };
  root.querySelectorAll('text').forEach((e)=>out(e,22,'text'));
  root.querySelectorAll('g[data-box],[data-safe]').forEach((e)=>out(e,4,'box'));
  return bad; }
`;
module.exports = { CENTRE_JS, SAFE_JS };
