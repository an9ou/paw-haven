// The end card for every video (owner, 4 Nov 2026): the game logo, the website and our Instagram, X and YouTube, each with its icon and handle.
// Use in a build script's page, after CENTRE_JS (and SAFE_JS for tall cuts) from brand/instagram/launch/centre_text.js, with Caveat and Andika loaded:
//   const { ENDCARD_JS, handles } = require('../endcard.js');   await p.addScriptTag({ content: CENTRE_JS + ENDCARD_JS });
//   const card = await p.evaluate(([fmt, h, logo]) => endCard(fmt, h, logo), ['wide' | 'tall', handles(), LOGO_INNER]);   // an SVG string, fixed
// LOGO_INNER is brand/doodle-doggo-logo.svg without its <svg> wrapper, <title> and paper rect (as in munch_reel/build_munch.js).
// Draw it over the faded paper page (PAPER #FFF8EC); fade it in as a whole (opacity on a wrapping <g>), small or no bounce.
// wide 1920 x 1080: logo, the site pill, then the three socials in a row. tall 1080 x 1920: everything inside SAFE (x 60..890, y 270..1440,
// centred on x 475), the socials stacked. Handles come from IG_HANDLE / X_HANDLE / YT_HANDLE; a missing one is drawn as a red "@ ?" with a red
// PREVIEW sticker, so a preview can never be posted by mistake.
const handles = () => ({ ig: process.env.IG_HANDLE || '@doodledoggo.app', x: process.env.X_HANDLE || '@doodledoggoapp', yt: process.env.YT_HANDLE || '@DoodleDoggoApp' });
const ENDCARD_JS = `
function endIcons(kind, x, y, s){ const k=s/72, ink='#5B3D32', g=(b)=>'<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+k.toFixed(3)+')">'+b+'</g>';
  if(kind==='ig') return g('<rect x="-32" y="-32" width="64" height="64" rx="18" fill="#F6B8CF" stroke="'+ink+'" stroke-width="5"/><circle cx="0" cy="1" r="14" fill="#FFF8EC" stroke="'+ink+'" stroke-width="5"/><circle cx="18" cy="-18" r="4.5" fill="'+ink+'"/>');
  if(kind==='x') return g('<rect x="-32" y="-32" width="64" height="64" rx="18" fill="#4A3A34" stroke="'+ink+'" stroke-width="5"/><path d="M-15 -17L15 17M15 -17L-15 17" stroke="#FFF8EC" stroke-width="7" stroke-linecap="round"/>');
  return g('<rect x="-36" y="-26" width="72" height="52" rx="16" fill="#F28A7E" stroke="'+ink+'" stroke-width="5"/><path d="M-9 -13L15 0L-9 13Z" fill="#FFF8EC" stroke="'+ink+'" stroke-width="3.5" stroke-linejoin="round"/>'); }
function endCard(fmt, h, logo){ const wide=fmt!=='tall', AF='Andika', CF='Caveat', ink='#5B3D32', red='#D2473C';
  const cx=wide?960:475, items=[['ig',h.ig],['x',h.x],['yt',h.yt]];
  let svg='', missing=false;
  const LW=wide?820:700, LH=LW*280/900, LY=wide?215:430;
  svg+='<svg x="'+(cx-LW/2).toFixed(1)+'" y="'+LY+'" width="'+LW+'" height="'+LH.toFixed(1)+'" viewBox="0 0 900 280">'+logo+'</svg>';
  const SY=LY+LH+(wide?95:110);
  svg+=pill('doodledoggo.app', cx, SY, wide?76:70, CF, { fill:'#FFE3A1', padX:46 });
  const size=wide?46:44, ic=wide?66:64, gap=18;
  const one=(kind, t, x0, y)=>{ const s=t||'@ ?'; if(!t) missing=true; const k=inkOf(s,size,AF);
    return { w: ic+gap+k.L+k.R, svg:(x)=>endIcons(kind, x+ic/2, y, ic)+'<text x="'+(x+ic+gap+k.L).toFixed(1)+'" y="'+(y+(k.A-k.D)/2).toFixed(1)+'" font-family="'+AF+'" font-weight="700" font-size="'+size+'" fill="'+(t?ink:red)+'">'+s+'</text>' }; };
  if(wide){ const y=SY+170, row=items.map(([k,t])=>one(k,t,0,y)), sp=70, tot=row.reduce((a,r)=>a+r.w,0)+sp*(row.length-1); let x=cx-tot/2;
    row.forEach((r)=>{ svg+=r.svg(x); x+=r.w+sp; }); }
  else { const rows=items.map(([k,t],i)=>one(k,t,0,SY+150+i*105)), mw=Math.max(...rows.map((r)=>r.w)), x=cx-mw/2;
    rows.forEach((r)=>{ svg+=r.svg(x); }); }
  if(missing) svg+='<g data-safe><rect x="'+(cx-150)+'" y="'+(wide?SY+250:SY+470)+'" width="300" height="64" rx="14" fill="'+red+'"/><text x="'+cx+'" y="'+(wide?SY+293:SY+513)+'" font-family="'+AF+'" font-weight="700" font-size="36" fill="#fff" text-anchor="middle">PREVIEW</text></g>';
  return '<g class="endcard">'+svg+'</g>'; }
// RedNote end card (owner, 5 Nov 2026: RedNote Reels of the kids' episodes): no link, no domain, no handles, no QR. The logo, a short line about
// the game and the search line "浏览器搜 Doodle Doggo App 就能玩" (the bio's words; never "DoodleDoggo.app" with a dot, REDNOTE.md). Chinese in
// LXGW WenKai (load 'lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css' from cdn.jsdelivr.net and await document.fonts.load('700 40px "LXGW WenKai"', words)).
// endCardRN(fmt, logo[, words[, qr]]) -> an SVG string; words = { tag, play } overrides the two lines.
// qr (owner, 7 Nov 2026: a RedNote end card may carry a QR code to the game website): { matrix, caption } with matrix from qrMatrix() below (the game's
// own QR module, mods/qr.js, as the Friends card and poster use), drawn crisp black on white with a 4-module quiet zone, 340 px across on a tall card
// (big enough to scan off a phone screen), in a cream crayon frame with the caption (default 扫码就能玩) under it; tall: everything inside SAFE.
const RN_WORDS={ tag:'治愈系蜡笔狗狗游戏', play:'浏览器搜 Doodle Doggo App 就能玩' };
function endCardQR(m, x, y, S, cap, ZF){ const n=m.length, q=4, u=S/(n+2*q); let d='';
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(m[r][c]) d+='M'+(x+(c+q)*u).toFixed(2)+' '+(y+(r+q)*u).toFixed(2)+'h'+u.toFixed(3)+'v'+u.toFixed(3)+'h-'+u.toFixed(3)+'z';
  const F=22, cx=x+S/2;
  return '<rect x="'+(x-F+8)+'" y="'+(y-F+12)+'" width="'+(S+2*F)+'" height="'+(S+2*F)+'" rx="30" fill="#5B3D32" opacity=".12"/>'
    +'<rect data-safe x="'+(x-F)+'" y="'+(y-F)+'" width="'+(S+2*F)+'" height="'+(S+2*F)+'" rx="30" fill="#FFF1D6" stroke="#5B3D32" stroke-width="6"/>'
    +'<rect x="'+(x-F+3)+'" y="'+(y-F-3)+'" width="'+(S+2*F-4)+'" height="'+(S+2*F-2)+'" rx="30" fill="none" stroke="#5B3D32" stroke-width="2.5" opacity=".3"/>'
    +'<rect x="'+x+'" y="'+y+'" width="'+S+'" height="'+S+'" rx="6" fill="#FFFFFF"/><path d="'+d+'" fill="#000000" shape-rendering="crispEdges"/>'
    +pill(cap||'扫码就能玩',cx,y+S+F+58,48,ZF,{fill:'#FFE3A1',padX:30}); }
function endCardRN(fmt, logo, words, qr){ const wide=fmt!=='tall', ZF="'LXGW WenKai'", w=Object.assign({},RN_WORDS,words||{});
  const cx=wide?(qr?700:960):475, LW=wide?(qr?720:820):700, LH=LW*280/900, LY=wide?250:(qr?300:470);
  let svg='<svg x="'+(cx-LW/2).toFixed(1)+'" y="'+LY+'" width="'+LW+'" height="'+LH.toFixed(1)+'" viewBox="0 0 900 280">'+logo+'</svg>';
  const TY=LY+LH+(wide?90:105);
  svg+=centred([{s:w.tag,size:wide?62:56,fill:'#8A7468'}],cx,TY,ZF).svg;
  svg+=pill(w.play,cx,TY+(wide?130:125),wide?60:44,ZF,{fill:'#FFE3A1',padX:wide?46:30}); // tall: 44 px keeps it inside SAFE
  if(qr&&qr.matrix){ const S=wide?380:340; svg+=wide?endCardQR(qr.matrix,1300,300,S,qr.caption,ZF):endCardQR(qr.matrix,cx-S/2,TY+125+95,S,qr.caption,ZF); }
  return '<g class="endcard">'+svg+'</g>'; }
`;
const RN_FONT_CSS = 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css';
// the QR matrix for endCardRN's qr option, from the game's own QR module (mods/qr.js in this repo): qrMatrix('https://doodledoggo.app')
function qrMatrix(text, qrFile) { const vm = require('vm'), fs = require('fs'), path = require('path'), ctx = { window: {}, globalThis: null }; ctx.globalThis = ctx;
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(qrFile || path.join(__dirname, '..', '..', 'mods', 'qr.js'), 'utf8'), ctx);
  const Q = ctx.window.PawQR || ctx.PawQR; if (!Q) throw new Error('no PawQR in mods/qr.js'); return Q.matrix(text); }
module.exports = { ENDCARD_JS, handles, RN_FONT_CSS, qrMatrix };
