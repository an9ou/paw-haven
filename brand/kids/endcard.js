// The end card for every video (owner, 4 Nov 2026): the game logo, the website and our Instagram, X and YouTube, each with its icon and handle.
// Use in a build script's page, after CENTRE_JS (and SAFE_JS for tall cuts) from brand/instagram/launch/centre_text.js, with Caveat and Andika loaded:
//   const { ENDCARD_JS, handles } = require('../endcard.js');   await p.addScriptTag({ content: CENTRE_JS + ENDCARD_JS });
//   const card = await p.evaluate(([fmt, h, logo]) => endCard(fmt, h, logo), ['wide' | 'tall', handles(), LOGO_INNER]);   // an SVG string, fixed
// LOGO_INNER is brand/doodle-doggo-logo.svg without its <svg> wrapper, <title> and paper rect (as in munch_reel/build_munch.js).
// Draw it over the faded paper page (PAPER #FFF8EC); fade it in as a whole (opacity on a wrapping <g>), small or no bounce.
// wide 1920 x 1080: logo, the site pill, then the three socials in a row. tall 1080 x 1920: everything inside SAFE (x 60..890, y 270..1440,
// centred on x 475), the socials stacked. Handles come from IG_HANDLE / X_HANDLE / YT_HANDLE; a missing one is drawn as a red "@ ?" with a red
// PREVIEW sticker, so a preview can never be posted by mistake.
const handles = () => ({ ig: process.env.IG_HANDLE || '@doodledoggo.app', x: process.env.X_HANDLE || '', yt: process.env.YT_HANDLE || '' });
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
`;
module.exports = { ENDCARD_JS, handles };
