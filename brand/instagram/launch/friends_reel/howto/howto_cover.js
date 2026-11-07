// The Friends how-to Reel's cover: its own design (owner, 23 Oct 2026: never a frame of the Reel). The autumn yard, the hook "How to add friends",
// a "in 3 taps" sticker, our real poster in a crayon phone next to the three taps (More, Friends, Share poster: the game's own button names) with a
// crayon finger on the last one, Mochi the Shiba and Waffles the Corgi facing each other well apart under a heart, and the logo.
// Everything that matters inside the profile grid's middle 1080 x 1440 (y 240..1680). centreCheck() and apartCheck() (centre_text.js) must pass.
// Used by build_howto.js (ONLY=cover writes only the cover). rn (REDNOTE=1): the same design in Simplified Chinese (LXGW WenKai, the game's zh-Hans
// words 更多, 好友, 分享海报), the zh-Hans poster; build_howto.js cuts its middle 1080 x 1440 for RedNote's 3:4.
const path = require('path'), fs = require('fs'), vm = require('vm');
const { CENTRE_JS, SAFE_JS } = require('../../centre_text.js');
const { howtoJS } = require('./howto_art.js');
const { RN_FONT_CSS } = require('../../../../kids/endcard.js');
function coverHTML({ DEV, POSTER, LOGO_INNER, rn }) {
  const W_ = rn ? { hook: [{ s: '怎么加好友', size: 130 }], sub: '点三下就够了', subSize: 64, taps: ['更多', '好友', '分享海报'], fam: "'LXGW WenKai', Caveat" }
    : { hook: [{ s: 'How to add', size: 112, pitch: 112 }, { s: 'friends', size: 126 }], sub: 'in 3 taps', subSize: 70, taps: ['More', 'Friends', 'Share poster'], fam: 'Caveat' };
  const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
  for (const f of fs.readdirSync(path.join(DEV, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(DEV, 'world', f), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(DEV, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
  const PA = win.PawArt, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const DOGS = { mochi: inner(PA.dog('shiba', { anim: false, pose: 'happy', facing: 'right' })), waffles: inner(PA.dog('corgi', { anim: false, pose: 'happy', facing: 'left' })) };
  const scene = `<symbol id="sc" viewBox="330 0 337.5 600" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', { time: 'day', weather: 'sunny', season: 'autumn' })).replace(/<text\b[\s\S]*?<\/text>/g, '')}</symbol>`;
  return `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">${rn ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0}svg{display:block}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs>${scene}</defs><g id="g"></g></svg>
<span style="font:700 20px Andika">a</span><span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
${howtoJS(rn ? 'zh-Hans' : 'en')}
const DOGS=${JSON.stringify(DOGS)}, POSTER=${JSON.stringify(POSTER)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, FAM=${JSON.stringify(W_.fam)}, WD=${JSON.stringify(W_)}, PEN='#5B3D32';
const C=(l,x,y)=>centred(l,x,y,FAM);
const card=(x,y,w,h,lines,o)=>{ o=o||{}; return '<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="38" fill="'+(o.fill||'#FFFDF7')+'" stroke="'+PEN+'" stroke-width="'+(o.sw||7)+'"/>'+C(lines,x+w/2,y+h/2).svg+'</g>'; };
const heart=(x,y,s)=>'<path transform="translate('+x+' '+y+') scale('+s+')" d="M0 12 C-14 0 -26 -6 -26 -18 C-26 -30 -12 -34 0 -22 C12 -34 26 -30 26 -18 C26 -6 14 0 0 12 Z" fill="#F28FA5" stroke="'+PEN+'" stroke-width="'+(3/s)+'"/>';
function dog(id,cx,bot,w){ const g=document.getElementById('g'); g.innerHTML='<g>'+DOGS[id]+'</g>'; const b=g.firstChild.getBBox(); g.innerHTML=''; const s=w/b.width;
  return '<g data-apart="'+id+'" transform="translate('+cx+' '+bot+') scale('+s.toFixed(4)+') translate('+(-(b.x+b.width/2))+' '+(-(b.y+b.height))+')">'+DOGS[id]+'</g>'; }
window.cover=function(){ let s='<use href="#sc" x="0" y="0" width="1080" height="1920"/><rect width="1080" height="1920" fill="#FFF8EC" opacity=".38"/>';
  // the hook
  s+='<g transform="rotate(-2 540 405)">'+card(110,290,860,230,WD.hook,{sw:8})+'</g>';
  s+='<g transform="rotate(4 790 560)">'+pill(WD.sub,790,560,WD.subSize,FAM,{fill:'#FFE3A1',padX:34})+'</g>';
  // our poster in a crayon phone
  const sw=330, sh=sw*16/9, sx=120, sy=650;
  s+='<g transform="rotate(-4 '+(sx+sw/2)+' '+(sy+sh/2)+')">'+hwPhone('cv',sx,sy,sw,sh,hwImg(POSTER,sx,sy,sw,sh))+'</g>';
  // the three taps, the game's own button names
  WD.taps.map((w,i)=>[(i+1)+'.',w]).forEach(([n,w],i)=>{ const y=760+i*170, x=560;
    s+='<g transform="rotate('+(i%2?1.5:-1.5)+' 760 '+y+')"><g data-box><circle cx="'+(x+20)+'" cy="'+y+'" r="46" fill="#FFE3A1" stroke="'+PEN+'" stroke-width="6"/>'+centred([{s:n,size:60}],x+20,y,'Caveat').svg+'</g>'
      +pill(w,x+80+inkOf(w,62,FAM).R/2+inkOf(w,62,FAM).L/2+34,y,62,FAM,{fill:i===2?'#FFE3A1':'#FFFDF7',padX:34})+'</g>'; });
  s+=hwFinger(975,1128,25,0.88); // on the corner of Share poster, its words clear
  // Mochi and Waffles, apart, under a heart
  s+=dog('mochi',330,1548,270)+dog('waffles',760,1548,262)+heart(545,1350,1.5);
  s+='<svg x="355" y="1556" width="370" height="'+(400*280/900).toFixed(1)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>';
  document.getElementById('g').innerHTML=s;
  const sv=document.getElementById('sv'), bad=centreCheck(sv).concat(apartCheck(sv).map((x)=>'dogs too close: '+x));
  document.querySelectorAll('#g > *').forEach((e)=>{ if(e.tagName==='use'||e.tagName==='rect') return; const b=e.getBoundingClientRect(); if(b.top<240||b.bottom>1680||b.left<0||b.right>1080) bad.push('outside the grid crop: '+e.tagName+' '+[b.left,b.top,b.right,b.bottom].map(Math.round)); });
  return bad; };
</script>`;
}
module.exports = { coverHTML };
