// The Friends how-to carousel (owner, 7 Nov 2026: the same steps as the how-to Reel). PREVIEW for the owner's approval. 8 slides, 1080 x 1350:
//   1 cover "How to add friends in Doodle Doggo" (share your code in 3 taps)   2 "1. tap More, then Friends"   3 "2. pick a name, get your code"
//   4 "3. tap Share poster"   5 "send it anywhere" (the crayon share menu, app names as text only, and the poster as a chat message: no real app UI)
//   6 "4. your friend adds you"   7 "5. you're friends!" (visit & pet, paw-print note, a gift a day, walk together; no chat, no messages)   8 "add us!" DOG-K3APZ
// The REAL game screens (capture_howto.js, capture_clean.js with Mochi), our card from the game's own card art and QR (../friends_card.js), the crayon
// drawings from howto_art.js. Every slide: centreCheck(), safeCheck() (all our words, cards and pills inside x 60..890, y 270..1440, as on every
// Reel frame: the right margin carries the sketchbook's binding, the top band the game's yard) and apartCheck() wherever dogs share a slide.
//
//   NODE_PATH=$(npm root -g) OUR_CODE=DOG-K3APZ OUR_NAME=0,0 node brand/instagram/launch/friends_reel/howto/build_howto_carousel.js <game checkout> <ui footage> <clean footage>
//   writes friends-howto-carousel-1..8-PREVIEW.jpg next to this script
const path = require('path'), fs = require('fs'), vm = require('vm');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../../centre_text.js');
const { loadArt, cardSVG, FIT_JS, apartRects } = require('../friends_card.js');
const { HOWTO_JS } = require('./howto_art.js');
const [DEV, UI, CLEAN] = process.argv.slice(2, 5).map((x) => path.resolve(x));
if (!CLEAN) throw new Error('usage: build_howto_carousel.js <game checkout> <ui footage> <clean footage>');
const OUT = __dirname, W = 1080, H = 1350, N = 8;
const LAY = JSON.parse(fs.readFileSync(path.join(UI, 'layout.json'), 'utf8'));
const CODE = process.env.OUR_CODE; if (!CODE || CODE !== LAY.code) throw new Error('OUR_CODE must be our real code (' + LAY.code + ')');
const ART = loadArt(DEV);
const CARD = cardSVG(ART, { code: CODE, name: 'Sunny Biscuit', nameFont: 'Caveat' });
const LINK = ART.link.replace(/^https?:\/\//, '') + CODE;
const POSTER = 'file://' + path.join(UI, 'poster.png');
const PEN = '#5B3D32', PINK = '#F28FA5', PAPER = '#FFF8EC', SOFT = '#8A7468', YEL = '#FFE3A1', GREEN = '#4E9A54';
const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(DEV, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(DEV, 'world', f), 'utf8'), ctx);
const SCENE = win.PawArt.scene('yard', { time: 'day', weather: 'sunny', season: 'autumn' }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<text\b[\s\S]*?<\/text>/g, '');

// footage: a still (name in a dir) or a clip frame, with its dogs' boxes
const stillOf = (dir, n) => { const b = path.join(dir, n + '.boxes.json'); return { src: 'file://' + path.join(dir, n + '.png'), boxes: fs.existsSync(b) ? JSON.parse(fs.readFileSync(b, 'utf8')) : [] }; };
const clipOf = (dir, n, t) => { const ts = JSON.parse(fs.readFileSync(path.join(dir, n, 'ts.json'), 'utf8')); let i = 0; while (i + 1 < ts.length && ts[i + 1] <= t) i++;
  const bx = fs.existsSync(path.join(dir, n, 'boxes.json')) ? JSON.parse(fs.readFileSync(path.join(dir, n, 'boxes.json'), 'utf8'))[i] : [];
  return { src: 'file://' + path.join(dir, n, String(i).padStart(5, '0') + '.jpg'), boxes: bx }; };
// a window on the paper: crop c (CSS px of the 393 x 659 phone) drawn at (X, Y), width WW; returns { svg, k, X, Y, h }
let wid = 0;
function win_(f, c, X, Y, WW) { const k = WW / c.w, HH = c.h * k, id = 'w' + (wid++);
  const svg = `<clipPath id="${id}"><rect x="${X}" y="${Y}" width="${WW}" height="${HH}" rx="30"/></clipPath>
  <rect x="${X + 10}" y="${Y + 14}" width="${WW}" height="${HH}" rx="30" fill="${PEN}" opacity=".12"/>
  <g clip-path="url(#${id})"><image href="${f.src}" x="${X - c.x * k}" y="${Y - c.y * k}" width="${393 * k}" height="${659 * k}"/></g>
  <rect data-safe x="${X}" y="${Y}" width="${WW}" height="${HH}" rx="30" fill="none" stroke="${PEN}" stroke-width="6"/>
  ${apartRects(f.boxes, (x, y) => [X + (x - c.x) * k, Y + (y - c.y) * k], [c.x, c.y, c.x + c.w, c.y + c.h])}`;
  return { svg, k, X, Y, h: HH, at: (p) => [X + (p[0] - c.x) * k, Y + (p[1] - c.y) * k] }; }
const mid = (r) => [r.x + r.w * 0.62, r.y + r.h * 0.66];
const corner = (r) => [r.x + r.w * 0.86, r.y + r.h * 0.86];
const tapAt = (w, r, ang) => { const [x, y] = w.at(corner(r)); return `\${hwTap(${x},${y},${ang},0.12)}`; };
const ripple = (x, y) => `<circle cx="${x}" cy="${y}" r="46" fill="none" stroke="${PINK}" stroke-width="7" opacity=".85"/><circle cx="${x}" cy="${y}" r="24" fill="${PINK}" opacity=".3"/>`;
const rippleAt = (w, r) => { const [x, y] = w.at([r.x + r.w / 2, r.y + r.h / 2]); return ripple(x, y); };

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>${ART.css}html,body{margin:0;background:#fff}svg{display:block}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><symbol id="yd" viewBox="0 250 1000 232" preserveAspectRatio="xMidYMid slice">${SCENE}</symbol></defs><g id="g"></g></svg>
<span style="font:700 20px Andika">a</span><span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
${FIT_JS}
${HOWTO_JS}
const FAM='Caveat', C=(l,x,y)=>centred(l,x,y,FAM), CX=SAFE_CX, POSTER=${JSON.stringify(POSTER)}, LINK=${JSON.stringify(LINK)};
const box=(x,y,w,h,lines,o)=>{ o=o||{}; return '<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(o.rx||34)+'" fill="'+(o.fill||'#FFFDF7')+'" stroke="'+(o.stroke||'${PEN}')+'" stroke-width="'+(o.sw||6)+'"/>'+C(lines,x+w/2,y+h/2).svg+'</g>'; };
const bub=(cx,cy,r,s,size,fill)=>'<g data-box><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+(fill||'${YEL}')+'" stroke="${PEN}" stroke-width="6"/>'+C([{s,size}],cx,cy).svg+'</g>';
// the page: the paper, the game's autumn yard in the top band, the sketchbook's spiral binding down the right margin, the handle and the page number
const page=(i)=>'<rect width="${W}" height="${H}" fill="${PAPER}"/>'+[...Array(12)].map((_,k)=>'<path d="M40 '+(330+k*90)+' H905" stroke="#E9DCC8" stroke-width="2" opacity=".5"/>').join('')
  +'<use href="#yd" x="0" y="0" width="${W}" height="236"/><path d="M0 236 Q140 226 270 238 T540 234 T810 240 T1080 232 V250 H0 Z" fill="${PAPER}"/><path d="M0 236 Q140 226 270 238 T540 234 T810 240 T1080 232" fill="none" stroke="${PEN}" stroke-width="5" stroke-linecap="round"/>'
  +[...Array(11)].map((_,k)=>{ const y=300+k*96; return '<circle cx="1000" cy="'+y+'" r="9" fill="${PEN}" opacity=".55"/><path d="M1000 '+y+' C 1004 '+(y-30)+' 1086 '+(y-30)+' 1086 '+(y-6)+'" fill="none" stroke="${PEN}" stroke-width="6" stroke-linecap="round"/><path d="M1000 '+y+' C 1004 '+(y-30)+' 1086 '+(y-30)+' 1086 '+(y-6)+'" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".5" transform="translate(0 -2)"/>'; }).join('')
  +'<path d="M960 270 V1340" stroke="#E9DCC8" stroke-width="3" stroke-dasharray="10 12"/>'
  +C([{s:'@doodledoggo.app',size:34,fill:'${SOFT}'}],190,1300).svg+C([{s:(i+1)+'/${N}',size:38,fill:'${SOFT}'}],820,1300).svg;
const head=(n,s,y)=>{ const L=[{s,size:66}], k=inkOf(s,66,FAM), w=Math.min(700,k.L+k.R+80); return (n?bub(124,y+56,52,n+'.',70):'')+box(n?190:CX-w/2,y,w,112,L,{sw:6}); };
window.slide=function(svg){ const g=document.getElementById('g'); g.innerHTML=svg; frFit(g); const sv=document.getElementById('sv');
  return [].concat(centreCheck(sv).map((x)=>'not centred: '+x), safeCheck(sv).map((x)=>'outside SAFE: '+x), apartCheck(sv).map((x)=>'dogs too close: '+x)); };
</script>`;

const S = [];
// 1 cover: the hook, our poster in a crayon phone, the three taps
S.push(`\${page(0)}\${'<g transform="rotate(-1.5 475 395)">'+box(80,290,790,210,[{s:'How to add friends',size:88,pitch:96},{s:'in Doodle Doggo',size:88}],{sw:8})+'</g>'}
\${'<g transform="rotate(3 600 548)">'+pill('share your code in 3 taps',600,548,52,FAM,{fill:'${YEL}',padX:28})+'</g>'}
\${'<g transform="rotate(-4 245 900)">'+hwPhone('c1',125,655,240,240*16/9,hwImg(POSTER,125,655,240,240*16/9))+'</g>'}
\${[['1.','More'],['2.','Friends'],['3.','Share poster']].map(([n,w],i)=>{ const y=730+i*150, x=440; return bub(x,y,44,n,58)+pill(w,x+64+(inkOf(w,58,FAM).L+inkOf(w,58,FAM).R)/2+30,y,58,FAM,{fill:i===2?'${YEL}':'#FFFDF7',padX:30}); }).join('')}
\${hwFinger(815,1058,20,0.85)}`);
// 2 step 1
{ const c = { x: 150, y: 300, w: 243, h: 359 }, a = win_(stillOf(UI, 'yard_ui'), c, 66, 450, 380), b = win_(stillOf(UI, 'more_tray'), c, 498, 450, 380);
  S.push(`\${page(1)}\${head(1,'tap More, then Friends',290)}${a.svg}${b.svg}${tapAt(a, LAY.more, -38)}${tapAt(b, LAY.friends, 30)}
<path d="M452 690 q16 -22 36 -6" fill="none" stroke="${PINK}" stroke-width="9" stroke-linecap="round"/><path d="M474 674 l16 10 l-16 10" fill="none" stroke="${PINK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
\${pill('tap More',256,${450 + a.h + 70},50,FAM,{padX:26})}\${pill('tap Friends',688,${450 + b.h + 70},50,FAM,{padX:26})}`); }
// 3 step 2
{ const a = win_(stillOf(UI, 'name_pick'), { x: 0, y: 12, w: 393, h: 578 }, 66, 445, 360), b = win_(stillOf(UI, 'card'), { x: 8, y: 62, w: 377, h: 252 }, 452, 520, 432);
  S.push(`\${page(2)}\${head(2,'pick a name, get your code',290)}${a.svg}${b.svg}${tapAt(a, LAY.ok, -40)}
\${C([{s:'the first time:',size:46,fill:'${SOFT}',pitch:56},{s:'turn the two wheels,',size:46,fill:'${SOFT}',pitch:56},{s:'tap This is my name',size:46,fill:'${SOFT}'}],668,${520 + b.h + 140}).svg}`); }
// 4 step 3: tap Share poster
{ const a = win_(stillOf(UI, 'card'), { x: 0, y: 58, w: 393, h: 318 }, 66, 545, 824);
  S.push(`\${page(3)}\${head(3,'tap Share poster',290)}${a.svg}${tapAt(a, LAY.poster, -38)}
\${C([{s:'it makes a poster with your code',size:46,fill:'${SOFT}',pitch:52},{s:'(on a computer, it saves the picture)',size:40,fill:'${SOFT}'}],475,470).svg}`); }
// 5 send it anywhere: the crayon share menu (app names as text only), then the poster as a chat message
S.push(`\${page(4)}\${head(3,'send it anywhere',290)}
\${(()=>{ const sw=330, sh=sw*16/9*0.98, sx=88, sy=470, m=hwShare(sx,sy,sw,sh,1,0,FAM), r=m.rows[0];
  return '<g transform="rotate(-2 '+(sx+sw/2)+' '+(sy+sh/2)+')">'+hwPhone('s5a',sx,sy,sw,sh,hwImg(POSTER,sx,sy,sw,sh)+m.svg)+'</g>'+'<circle cx="'+(r.x+r.w*0.5)+'" cy="'+(r.y+r.h*0.5)+'" r="40" fill="none" stroke="${PINK}" stroke-width="7" opacity=".85" transform="rotate(-2 '+(sx+sw/2)+' '+(sy+sh/2)+')"/>'; })()}
\${(()=>{ const sw=330, sh=sw*16/9*0.98, sx=528, sy=470, c=hwChat(sx,sy,sw,sh,POSTER,{p:1,reply:1,link:LINK,id:'s5'});
  return '<g transform="rotate(2 '+(sx+sw/2)+' '+(sy+sh/2)+')">'+hwPhone('s5b',sx,sy,sw,sh,c.svg)+'</g>'; })()}
<path d="M455 760 q18 -24 40 -6" fill="none" stroke="${PINK}" stroke-width="9" stroke-linecap="round"/><path d="M478 742 l18 12 l-18 12" fill="none" stroke="${PINK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
\${pill('WhatsApp, your story, any chat',475,1185,48,FAM,{fill:'${YEL}',padX:28})}`);
// 6 step 4: the friend's phone
{ const a = win_(stillOf(UI, 'add_5'), { x: 0, y: 292, w: 393, h: 180 }, 66, 470, 400), b = win_(stillOf(UI, 'add_done'), { x: 0, y: 58, w: 393, h: 490 }, 500, 450, 386);
  S.push(`\${page(5)}\${head(4,'your friend adds you',290)}${a.svg}${b.svg}${rippleAt(a, LAY.f_addBtn)}
\${C([{s:'they open your link,',size:44,fill:'${SOFT}',pitch:56},{s:'or type your code',size:44,fill:'${SOFT}',pitch:56},{s:'in Add a friend,',size:44,fill:'${SOFT}',pitch:56},{s:'then tap Add.',size:44,fill:'${SOFT}'}],266,${470 + a.h + 175}).svg}
\${'<g transform="rotate(3 693 ${450 + b.h + 50})">'+pill("your friend's phone",693,${450 + b.h + 50},40,FAM,{fill:'#D9EED0',padX:22})+'</g>'}`); }
// 7 step 5: you're friends (clean footage with Mochi)
{ const t = (f, c, X, Y, label) => { const w = win_(f, c, X, Y, 396); return w.svg + `\${pill(${JSON.stringify(label)},${X + 198},${Y + w.h + 2},44,FAM,{fill:'${YEL}',padX:22})}`; };
  S.push(`\${page(6)}\${head(5,"you're friends!",290)}
${t(clipOf(CLEAN, 'visit', 2.4), { x: 0, y: 345, w: 393, h: 300 }, 66, 440, 'visit & pet')}${t(stillOf(CLEAN, 'note_left'), { x: 0, y: 260, w: 393, h: 300 }, 490, 440, 'paw-print note')}
${t(clipOf(CLEAN, 'gift', 0.8), { x: 0, y: 220, w: 393, h: 300 }, 66, 790, 'a gift a day')}${t(clipOf(CLEAN, 'walk', 3.2), { x: 0, y: 238, w: 220, h: 168 }, 490, 790, 'walk together')}
\${pill('no chat. no messages.',475,1215,50,FAM,{fill:'#FFFDF7',stroke:'${GREEN}',color:'${GREEN}',padX:30})}`); }
// 8 add us
S.push(`\${page(7)}\${'<g transform="rotate(-2 475 350)">'+C([{s:'add us!',size:130}],475,350).svg+'</g>'}<path d="M295 425 Q475 407 655 425" fill="none" stroke="${PINK}" stroke-width="14" stroke-linecap="round" opacity=".6"/>
<g data-safe transform="translate(475 720) scale(2.55) rotate(-2) translate(-150 -100)">${CARD}</g>
\${box(110,1020,730,180,[{s:'then drop your friend code',size:60,pitch:72},{s:'below to swap with other players',size:46}],{fill:'${YEL}',sw:6})}`);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const f0 = path.join(UI, '..', 'carousel_page.html'); fs.writeFileSync(f0, html); await p.goto('file://' + f0); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all(['600 40px Caveat', '700 40px Caveat', '700 40px Andika', '700 40px "DD Code"'].map((f) => document.fonts.load(f, 'aDOG-K3APZ')))); await p.evaluate(() => document.fonts.ready);
  for (let i = 0; i < S.length; i++) {
    const bad = await p.evaluate((src) => window.slide(eval('`' + src + '`')), S[i]);
    if (bad.length) throw new Error('slide ' + (i + 1) + ': ' + bad.join('; '));
    await p.evaluate(() => Promise.all([...document.querySelectorAll('image')].map((im) => new Promise((r) => { const x = new Image(); x.onload = r; x.onerror = r; x.src = im.getAttribute('href'); }))));
    await p.waitForTimeout(200);
    const f = path.join(OUT, `friends-howto-carousel-${i + 1}-PREVIEW.jpg`); await p.screenshot({ path: f, type: 'jpeg', quality: 92 }); console.log('wrote', f);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
