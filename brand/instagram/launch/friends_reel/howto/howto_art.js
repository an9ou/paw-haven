// The Friends how-to (owner, 7 Nov 2026): the crayon drawings shared by the Reel (build_howto.js), the carousel and the cover.
// Owner's choice: the phone's share menu is drawn as a simple CRAYON menu with the app names as TEXT only (no real app logos, icons or screenshots of
// other apps), and the poster arrives as a chat message and as a story inside a crayon phone (again no real app UI). Page-side JS (a string): drop it
// into the page's <script> after CENTRE_JS (centred, pill) and SAFE_JS. Fonts: Caveat for the words, Andika for the link.
//   hwPhone(id, x, y, sw, sh, inner)      a crayon phone around the screen box (x, y, sw, sh); inner is drawn clipped to the screen
//   hwShare(sx, sy, sw, sh, p, hi, fam)   the share menu sliding up over the screen (p 0..1), row hi highlighted; returns { svg, rows: [{x,y,w,h}] }
//   hwChat(sx, sy, sw, sh, poster, o)     a chat with our poster message (o.p: the bubble's pop 0..1, o.reply: a heart back 0..1); returns { svg, link }
//   hwStory(sx, sy, sw, sh, poster, p)    the poster as a story (p: the progress line 0..1)
//   hwTap(x, y, ang, lt)                  a crayon finger tapping (x, y) at lt = 0 (seconds from the tap; drawn from -0.45 to 0.5), with a ripple
const HW_APPS = ['WhatsApp', 'Instagram story', 'Messenger', 'LINE', 'Telegram', 'Messages', 'More…'];
const HW_TEXT = { msg: ['Come and play', 'Doodle Doggo with me.'], chatName: 'Maple', shareTo: 'Share to' }; // fr.share_text, split in two lines
const HOWTO_JS = `
const HW={pen:'#5B3D32',pink:'#F28FA5',yel:'#FFE3A1',cream:'#FFFDF7',paper:'#FFF8EC',soft:'#8A7468',skin:'#FFD9C4',link:'#3E6FA8',head:'#F4E7D4'};
const HW_APPS=${JSON.stringify(HW_APPS)}, HW_TEXT=${JSON.stringify(HW_TEXT)};
const hwF=(n)=>Math.round(n*100)/100;
function hwPhone(id,x,y,sw,sh,inner){ const b=Math.round(sw*0.05), top=b+16, X=x-b, Y=y-top, W=sw+2*b, H=sh+top+b+16, r=Math.round(sw*0.12);
  return '<g><rect x="'+hwF(X+10)+'" y="'+hwF(Y+14)+'" width="'+hwF(W)+'" height="'+hwF(H)+'" rx="'+r+'" fill="'+HW.pen+'" opacity=".12"/>'
    +'<rect data-safe x="'+hwF(X)+'" y="'+hwF(Y)+'" width="'+hwF(W)+'" height="'+hwF(H)+'" rx="'+r+'" fill="#FBEFE0" stroke="'+HW.pen+'" stroke-width="6"/>'
    +'<rect x="'+hwF(X+3)+'" y="'+hwF(Y-2)+'" width="'+hwF(W-4)+'" height="'+hwF(H-2)+'" rx="'+r+'" fill="none" stroke="'+HW.pen+'" stroke-width="2.5" opacity=".3"/>'
    +'<rect x="'+hwF(x+sw/2-sw*0.1)+'" y="'+hwF(Y+top/2-4)+'" width="'+hwF(sw*0.2)+'" height="8" rx="4" fill="'+HW.pen+'" opacity=".45"/>'
    +'<clipPath id="'+id+'"><rect x="'+hwF(x)+'" y="'+hwF(y)+'" width="'+hwF(sw)+'" height="'+hwF(sh)+'" rx="'+Math.round(r*0.6)+'"/></clipPath>'
    +'<rect x="'+hwF(x)+'" y="'+hwF(y)+'" width="'+hwF(sw)+'" height="'+hwF(sh)+'" rx="'+Math.round(r*0.6)+'" fill="'+HW.paper+'"/>'
    +'<g clip-path="url(#'+id+')">'+inner+'</g>'
    +'<rect x="'+hwF(x)+'" y="'+hwF(y)+'" width="'+hwF(sw)+'" height="'+hwF(sh)+'" rx="'+Math.round(r*0.6)+'" fill="none" stroke="'+HW.pen+'" stroke-width="3.5"/>'
    +'<rect x="'+hwF(x+sw/2-sw*0.16)+'" y="'+hwF(y+sh+8)+'" width="'+hwF(sw*0.32)+'" height="7" rx="3.5" fill="'+HW.pen+'" opacity=".4"/></g>'; }
function hwImg(href,x,y,w,h){ return '<image href="'+href+'" x="'+hwF(x)+'" y="'+hwF(y)+'" width="'+hwF(w)+'" height="'+hwF(h)+'" preserveAspectRatio="xMidYMid slice"/>'; }
function hwShare(sx,sy,sw,sh,p,hi,fam){ const n=HW_APPS.length, H=sh*0.74, head=sh*0.1, rowH=(H-head-sh*0.03)/n, top=sy+sh-H+(1-p)*40; // a short rise and a fade (a long slide would put rows outside SAFE while they are hidden by the screen's clip)
  let s='<rect x="'+sx+'" y="'+sy+'" width="'+sw+'" height="'+sh+'" fill="'+HW.pen+'" opacity="'+hwF(0.28*p)+'"/>';
  s+='<g opacity="'+hwF(p)+'">';
  s+='<path d="M'+hwF(sx)+' '+hwF(top+30)+' Q'+hwF(sx)+' '+hwF(top)+' '+hwF(sx+30)+' '+hwF(top)+' L'+hwF(sx+sw-30)+' '+hwF(top)+' Q'+hwF(sx+sw)+' '+hwF(top)+' '+hwF(sx+sw)+' '+hwF(top+30)+' L'+hwF(sx+sw)+' '+hwF(sy+sh+40)+' L'+hwF(sx)+' '+hwF(sy+sh+40)+' Z" fill="'+HW.cream+'" stroke="'+HW.pen+'" stroke-width="4"/>';
  s+='<rect x="'+hwF(sx+sw/2-30)+'" y="'+hwF(top+12)+'" width="60" height="7" rx="3.5" fill="'+HW.pen+'" opacity=".35"/>';
  s+=centred([{s:HW_TEXT.shareTo,size:Math.round(head*0.5),fill:HW.soft}],sx+sw/2,top+head*0.62,fam).svg;
  const rows=[], size=Math.round(Math.min(rowH*0.5,sw*0.085));
  HW_APPS.forEach((a,i)=>{ const x=sx+sw*0.07, w=sw*0.86, y=top+head+i*rowH+rowH*0.08, h=rowH*0.84; rows.push({x,y,w,h});
    s+='<g data-box><rect x="'+hwF(x)+'" y="'+hwF(y)+'" width="'+hwF(w)+'" height="'+hwF(h)+'" rx="'+hwF(h/2)+'" fill="'+(i===hi?HW.yel:'#FFFFFF')+'" stroke="'+HW.pen+'" stroke-width="3"/>'
      +centred([{s:a,size}],x+w/2,y+h/2,fam).svg+'</g>'; });
  return {svg:s+'</g>', rows}; }
// our message: the poster picture, then fr.share_text and the invite link, as the game hands them to the share menu
function hwChat(sx,sy,sw,sh,poster,o){ o=o||{}; const k=sw/350, fam=o.fam||'Caveat', hd=64*k;
  let s='<rect x="'+sx+'" y="'+sy+'" width="'+sw+'" height="'+hd+'" fill="'+HW.head+'"/><path d="M'+hwF(sx)+' '+hwF(sy+hd)+' H'+hwF(sx+sw)+'" stroke="'+HW.pen+'" stroke-width="3"/>'
    +'<path d="M'+hwF(sx+28*k)+' '+hwF(sy+hd/2-11*k)+' l-11 '+hwF(11*k)+' l11 '+hwF(11*k)+'" fill="none" stroke="'+HW.pen+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    +'<circle cx="'+hwF(sx+66*k)+'" cy="'+hwF(sy+hd/2)+'" r="'+hwF(20*k)+'" fill="#B8D8A8" stroke="'+HW.pen+'" stroke-width="3"/>'
    +'<text x="'+hwF(sx+96*k)+'" y="'+hwF(sy+hd/2+11*k)+'" font-family="Caveat" font-weight="700" font-size="'+hwF(32*k)+'" fill="'+HW.pen+'">'+HW_TEXT.chatName+'</text>';
  for(let i=0;i<9;i++) s+='<circle cx="'+hwF(sx+(30+(i*97)%300)*k)+'" cy="'+hwF(sy+hd+(40+(i*151)%520)*k)+'" r="'+hwF(3*k)+'" fill="'+HW.pen+'" opacity=".07"/>';
  const p=o.p==null?1:o.p; let link=null;
  if(p>0){ const bw=300*k, bx=sx+sw-bw-16*k, by=sy+hd+18*k, iw=170*k, ih=iw*16/9, ts=27*k, lh=31*k, bh=12*k+ih+14*k+2*lh+lh+12*k, sc=0.85+0.15*p;
    const lx=bx+14*k, ly=by+12*k+ih+14*k+ts*0.8;
    s+='<g opacity="'+hwF(Math.min(1,p*1.6))+'" transform="translate('+hwF(bx+bw)+' '+hwF(by)+') scale('+hwF(sc)+') translate('+hwF(-bx-bw)+' '+hwF(-by)+')">'
      +'<path d="M'+hwF(bx+18*k)+' '+hwF(by)+' H'+hwF(bx+bw-18*k)+' Q'+hwF(bx+bw)+' '+hwF(by)+' '+hwF(bx+bw)+' '+hwF(by+18*k)+' V'+hwF(by+bh)+' l'+hwF(12*k)+' '+hwF(12*k)+' H'+hwF(bx+18*k)+' Q'+hwF(bx)+' '+hwF(by+bh+12*k)+' '+hwF(bx)+' '+hwF(by+bh-6*k)+' V'+hwF(by+18*k)+' Q'+hwF(bx)+' '+hwF(by)+' '+hwF(bx+18*k)+' '+hwF(by)+' Z" fill="#FFF1C9" stroke="'+HW.pen+'" stroke-width="3.5"/>'
      +'<clipPath id="hwci'+(o.id||'')+'"><rect x="'+hwF(lx)+'" y="'+hwF(by+12*k)+'" width="'+hwF(iw)+'" height="'+hwF(ih)+'" rx="'+hwF(12*k)+'"/></clipPath><g clip-path="url(#hwci'+(o.id||'')+')">'+hwImg(poster,lx,by+12*k,iw,ih)+'</g>'
      +'<rect x="'+hwF(lx)+'" y="'+hwF(by+12*k)+'" width="'+hwF(iw)+'" height="'+hwF(ih)+'" rx="'+hwF(12*k)+'" fill="none" stroke="'+HW.pen+'" stroke-width="2.5"/>'
      +HW_TEXT.msg.map((m,i)=>'<text x="'+hwF(lx)+'" y="'+hwF(ly+i*lh)+'" font-family="Caveat" font-weight="700" font-size="'+hwF(ts)+'" fill="'+HW.pen+'">'+m+'</text>').join('')
      +'<text x="'+hwF(lx)+'" y="'+hwF(ly+2*lh+2*k)+'" font-family="Andika" font-weight="700" font-size="'+hwF(17.5*k)+'" fill="'+HW.link+'" text-decoration="underline">'+o.link+'</text></g>';
    link={x:lx+120*k, y:ly+2*lh-4*k}; }
  if(o.reply>0){ const q=o.reply, rx=sx+16*k, ry=sy+sh-92*k, rw=110*k, rh=62*k;
    s+='<g opacity="'+hwF(Math.min(1,q*1.6))+'"><rect x="'+hwF(rx)+'" y="'+hwF(ry)+'" width="'+hwF(rw)+'" height="'+hwF(rh)+'" rx="'+hwF(20*k)+'" fill="#FFFFFF" stroke="'+HW.pen+'" stroke-width="3.5"/>'
      +'<path transform="translate('+hwF(rx+36*k)+' '+hwF(ry+rh/2+4*k)+') scale('+hwF(0.8*k*(0.8+0.2*q))+')" d="M0 12 C-14 0 -26 -6 -26 -18 C-26 -30 -12 -34 0 -22 C12 -34 26 -30 26 -18 C26 -6 14 0 0 12 Z" fill="'+HW.pink+'" stroke="'+HW.pen+'" stroke-width="3"/>'
      +'<g transform="translate('+hwF(rx+78*k)+' '+hwF(ry+rh/2+2*k)+') scale('+hwF(k)+')" fill="'+HW.soft+'"><ellipse cx="0" cy="6" rx="9" ry="7"/><circle cx="-10" cy="-6" r="4"/><circle cx="-3" cy="-11" r="4"/><circle cx="5" cy="-11" r="4"/><circle cx="11" cy="-5" r="4"/></g></g>'; }
  return {svg:s, link}; }
function hwStory(sx,sy,sw,sh,poster,p){ const k=sw/350; let s=hwImg(poster,sx,sy,sw,sh);
  s+='<rect x="'+hwF(sx+14*k)+'" y="'+hwF(sy+14*k)+'" width="'+hwF(sw-28*k)+'" height="'+hwF(6*k)+'" rx="'+hwF(3*k)+'" fill="'+HW.pen+'" opacity=".25"/>'
    +'<rect x="'+hwF(sx+14*k)+'" y="'+hwF(sy+14*k)+'" width="'+hwF((sw-28*k)*Math.max(0.02,Math.min(1,p)))+'" height="'+hwF(6*k)+'" rx="'+hwF(3*k)+'" fill="'+HW.pen+'" opacity=".75"/>';
  return s; }
// a crayon finger: the tip at (x, y), the hand along the angle (0: the hand below the tip; positive: turned clockwise, so 25 is down and to the left)
function hwFinger(x,y,ang,sc){ return '<g data-safe transform="translate('+hwF(x)+' '+hwF(y)+') rotate('+hwF(ang)+') scale('+hwF(sc)+')">'
  +'<path d="M-25 112 C-62 118 -80 150 -74 196 Q0 222 64 196 C72 156 62 120 25 112 Z" fill="'+HW.skin+'" stroke="'+HW.pen+'" stroke-width="5" stroke-linejoin="round"/>'
  +'<path d="M-62 150 q-14 -16 -6 -34 q16 -6 34 14" fill="'+HW.skin+'" stroke="'+HW.pen+'" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>'
  +'<path d="M-23 8 Q-23 -9 0 -9 Q23 -9 23 8 L25 122 L-25 122 Z" fill="'+HW.skin+'" stroke="'+HW.pen+'" stroke-width="5" stroke-linejoin="round"/>'
  +'<path d="M-13 6 Q-13 -2 0 -2 Q13 -2 13 6 L12 27 Q0 32 -12 27 Z" fill="#FFF3EC" stroke="'+HW.pen+'" stroke-width="2.5"/>'
  +'<path d="M-10 66 q10 5 20 0 M-8 79 q8 4 16 0" fill="none" stroke="'+HW.pen+'" stroke-width="2.5" stroke-linecap="round"/></g>'; }
function hwTap(x,y,ang,lt){ if(lt<-0.45||lt>0.55) return ''; const e=(v)=>{ v=Math.max(0,Math.min(1,v)); return v*v*(3-2*v); };
  const inn=e((lt+0.45)/0.3), out=1-e((lt-0.3)/0.25), d=60*(1-inn), press=lt>-0.06&&lt<0.12?0.93:1, a=ang*Math.PI/180;
  let s='';
  if(lt>=0){ const q=Math.min(1,lt/0.45); s+='<circle cx="'+hwF(x)+'" cy="'+hwF(y)+'" r="'+hwF(16+48*q)+'" fill="none" stroke="'+HW.pink+'" stroke-width="7" opacity="'+hwF(0.9*(1-q))+'"/>'
    +'<circle cx="'+hwF(x)+'" cy="'+hwF(y)+'" r="'+hwF(8+26*q)+'" fill="'+HW.pink+'" opacity="'+hwF(0.35*(1-q))+'"/>'; }
  return s+'<g opacity="'+hwF(Math.min(inn,out))+'">'+hwFinger(x-Math.sin(a)*d,y+d*Math.cos(a),ang,0.78*press)+'</g>'; }
`;
module.exports = { HOWTO_JS, HW_APPS, HW_TEXT };
