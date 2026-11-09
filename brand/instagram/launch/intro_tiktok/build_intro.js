// The TikTok intro (8 Nov 2026, owner: "Can u create a short intro video for tiktok"): ~20 s, 9:16, told by Noodle the dachshund, ONE file.
// The Friends Reel's way (friends_reel/build_friends.js): 1080 x 1920, 30 fps, each shot lasts its voice line plus a small beat, the game's own
// music (the yard by day) at 30% under Noodle's voice (Kokoro af_bella 1.1x, friends_reel/vo_friends.py with VO_LINES=vo_intro.json), Caveat words,
// ink-centred by ../centre_text.js and checked on every frame (centreCheck, safeCheck, apartCheck).
// TikTok's safe area: every word and box of ours inside x 60..850, y 170..1500 (its buttons sit on the right from x ~860, its caption and name over
// the bottom ~380 px, its tabs over the top ~150 px). Where the game screen would put Noodle's feet under the caption, the screen is lifted over the
// sketchbook paper (as the Friends Reel does), with a pencil edge.
// Shots (the live game of 8 Nov 2026, autumn, no festival on screen; footage from capture_intro.js):
//   hook   Noodle at home, petted, hearts           dogs   a line-up of the game's own crayon dogs (PawArt.dog), "40 crayon dogs"
//   fuji   Noodle walks the path at the Mt. Fuji Lookout   play   the Bumblebee Suit, ball play, the veggie patch
//   safe   Noodle, Udon and their puppies, hearts   end    paper: our standard end card (brand/kids/endcard.js, owner 9 Nov 2026: the logo,
//          doodledoggo.app, Instagram, X and YouTube with icons and handles) and "free · play in your browser" under it; Noodle's last line over it
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/intro_tiktok/build_intro.js <game checkout> <footage dir> <workdir> <vo dir>
//   ONLY=stills renders one key frame per shot (and the end page) into <workdir>/f; FRAMES=a-b re-renders those frames only (the rest of
//   <workdir>/f stays), then encodes again; TIMES=1 prints each shot's frames.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const DEV = path.resolve(process.argv[2] || '.'), FOOT = path.resolve(process.argv[3] || 'intro_footage');
const WORK = path.resolve(process.argv[4] || 'intro_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const VO = path.resolve(process.argv[5] || 'vo');
const VOD = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')).dur;
const FPS = 30, W = 1080, H = 1920, PW = 393, PH = 659; // the phone screen of the footage, in CSS px (iPhone 15 profile)
const PEN = '#5B3D32', PINK = '#F28FA5', PAPER = '#FFF8EC', YEL = '#FFE3A1';
// TikTok's safe area (narrower on the right than the all-platform SAFE of centre_text.js)
const SAFE_TT = SAFE_JS.replace('const SAFE={x0:60,x1:890,y0:270,y1:1440}, SAFE_CX=475;', 'const SAFE={x0:60,x1:850,y0:170,y1:1500}, SAFE_CX=455;');
if (SAFE_TT === SAFE_JS) throw new Error('centre_text.js SAFE changed: update the TikTok safe area here');

// ---- the game's own art: the crayon dogs (PawArt.dog) and the logo ----
const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(DEV, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(DEV, 'world', f), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(DEV, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
const PA = win.PawArt, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const NDOGS = PA.DOGS.length; // 40 on 8 Nov 2026 (v2.21 Five new breeds); the voice line and the label say the true number
if (NDOGS !== 40) throw new Error(NDOGS + ' dogs in PawArt.DOGS: change "forty" in vo_intro.json and the label, then re-make the voice');
// the line-up: twelve of the forty in their default coats, happy, no black or white dog as the subject (owner, 1 Nov 2026); Noodle is the narrator, not in the grid
const LINEUP = ['shiba', 'corgi', 'golden', 'beagle', 'pug', 'husky', 'pom', 'cavalier', 'chihuahua', 'frenchie', 'akita', 'lab'];
const ART = {}; LINEUP.forEach((k, i) => { ART['d' + i] = inner(PA.dog(k, { anim: false, pose: 'happy', facing: i % 2 ? 'left' : 'right' })); });
ART.noodle = inner(PA.dog('dachs', { anim: false, pose: 'happy', facing: 'right' }));
const LOGO = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8');
// the end card's logo: the logo without its <svg> wrapper, <title> and paper rect (as brand/kids/endcard.js asks)
const LOGO_INNER = inner(LOGO.replace(/<title>[^<]*<\/title>/, '').trim()).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
if (LOGO_INNER.includes('<title') || LOGO_INNER.includes('fill="#FFF8EC"/><svg x="10"')) throw new Error('logo svg changed: check LOGO_INNER');

// ---- the words (TikTok: short, lowercase, centred; the font has no ✏️, so a crayon is drawn next to the hook instead) ----
const TX = {
  hook: [{ s: 'a cozy dog game', size: 76, pitch: 86 }, { s: 'where the dogs', size: 76, pitch: 86 }, { s: 'drew themselves', size: 76 }],
  dogs: NDOGS + ' crayon dogs', fuji: 'walk to Mt. Fuji', play: ['dress up', 'play', 'garden'], safe: ['nothing bad', 'ever happens'],
  end: 'free · play in your browser', // under the standard end card (owner, 9 Nov 2026)
};

// ---- the timeline: each shot lasts its line plus a beat; the line starts 0.15 s in ----
const SEG = [], VOAT = []; let at = 0;
const seg = (len, o) => { SEG.push(Object.assign({ a: at, b: at + len }, o)); at += len; };
const say = (k, d) => VOAT.push({ k, at: at + (d == null ? 0.15 : d) });
// view: the phone screen at scale s (output px per CSS px) with the CSS point f0 -> f1 at the output point o (eased); never past the screen's left,
// right or top edge; below it the paper shows (lifted so Noodle's feet stay above TikTok's caption)
const S0 = H / PH; // 2.913: the screen filling the frame's height
say('hook'); seg(VOD.hook + 0.8, { src: 'hook', from: 0.15, view: { s0: S0 * 1.18, s1: S0 * 1.26, f0: [200, 470], f1: [200, 478], o: [430, 1180] }, cap: 'hook' });
say('dogs'); seg(VOD.dogs + 1.0, { src: null, cap: 'dogs' });
say('fuji'); seg(VOD.fuji + 0.7, { src: 'fuji', from: 0.75, view: { s0: S0 * 0.95, s1: S0 * 0.97, f0: [196, 0], f1: [196, 0], o: [455, 0] }, cap: 'fuji' });
const PLAY = at, PL = VOD.play + 1.0;
say('play');
seg(PL * 0.36, { src: 'dress', from: 0.2, view: { s0: S0 * 1.3, s1: S0 * 1.36, f0: [200, 480], f1: [200, 482], o: [430, 1180] }, cap: 'play', word: 0 });
seg(PL * 0.34, { src: 'ball', from: 1.55, follow: true, view: { s0: S0 * 2.0, s1: S0 * 2.1, o: [440, 1200] }, cap: 'play', word: 1 });
seg(PL * 0.30, { src: 'garden', from: 0.2, view: { s0: S0 * 1.0, s1: S0 * 1.03, f0: [196, 300], f1: [196, 300], o: [455, 1000] }, cap: 'play', word: 2 });
say('safe'); seg(VOD.safe + 1.1, { src: 'pups', from: 0.15, view: { s0: S0 * 1.05, s1: S0 * 1.1, f0: [190, 460], f1: [190, 462], o: [440, 1110] }, cap: 'safe' });
const END = at; say('end', 0.3); seg(VOD.end + 1.5, { src: null, cap: 'end' });
const T = at, N = Math.round(T * FPS);
if (process.env.TIMES) { SEG.forEach((s) => console.log(String(s.src || s.cap).padEnd(7), 'frames', Math.floor(s.a * FPS) + '-' + (Math.ceil(s.b * FPS) - 1), s.a.toFixed(2) + '-' + s.b.toFixed(2) + ' s')); console.log('N', N); process.exit(0); }

// ---- footage: frames and their game times; dog boxes (CSS px) for apartCheck and the ball's follow camera ----
const CLIPS = {};
for (const s of SEG) { if (!s.src || CLIPS[s.src]) continue; const dir = path.join(FOOT, s.src);
  const ts = JSON.parse(fs.readFileSync(path.join(dir, 'ts.json'), 'utf8'));
  CLIPS[s.src] = { ts, files: ts.map((_, i) => path.join(dir, String(i).padStart(5, '0') + '.jpg')), boxes: JSON.parse(fs.readFileSync(path.join(dir, 'boxes.json'), 'utf8')) }; }
const idxAt = (s, t) => { const c = CLIPS[s.src], g = s.from + (t - s.a); let i = 0; while (i + 1 < c.ts.length && c.ts[i + 1] <= g) i++; return i; };
// the ball: the camera follows Noodle's box, smoothed over 0.5 s of game time
function followAt(s, t) { const c = CLIPS[s.src], g = s.from + (t - s.a); let sx = 0, sy = 0, n = 0;
  c.ts.forEach((u, i) => { const b = (c.boxes[i] || []).find((d) => d.n === 'Noodle'); if (b && Math.abs(u - g) <= 0.25) { sx += (b.b[0] + b.b[2]) / 2; sy += b.b[3] - 22; n++; } });
  return n ? [sx / n, sy / n] : [196, 590]; }
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function viewAt(s, t) { const v = s.view, u = ease((t - s.a) / (s.b - s.a)), sc = v.s0 + (v.s1 - v.s0) * u;
  const f = s.follow ? followAt(s, t) : [v.f0[0] + (v.f1[0] - v.f0[0]) * u, v.f0[1] + (v.f1[1] - v.f0[1]) * u];
  const l = Math.min(0, Math.max(W - PW * sc, v.o[0] - f[0] * sc)), tp = Math.min(0, v.o[1] - f[1] * sc); return { l, t: tp, s: sc, bot: tp + PH * sc }; }
function dogRects(s, t, V) { return (CLIPS[s.src].boxes[idxAt(s, t)] || []).map((d) => { const [a, b, c, e] = d.b;
  return `<rect data-apart="${d.n}" x="${(V.l + a * V.s).toFixed(1)}" y="${(V.t + b * V.s).toFixed(1)}" width="${((c - a) * V.s).toFixed(1)}" height="${((e - b) * V.s).toFixed(1)}" fill="none" stroke="none"/>`; }).join(''); }

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}#st{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${PAPER}}
#scr{position:absolute;left:0;top:0;width:${PW}px;height:${PH}px;transform-origin:0 0}#ov{position:absolute;left:0;top:0}.pa-dog *{animation:none!important}[class$="-hl"]{display:none}</style>
<div id="st"><img id="scr"><svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
${Object.keys(ART).map((k) => `<symbol id="${k}" overflow="visible">${ART[k]}</symbol>`).join('')}</defs>
<g id="edge"></g><g id="page"></g><g id="cap"></g><g id="apart"></g></svg></div>
<script>
${CENTRE_JS}
${SAFE_TT}
${ENDCARD_JS}
const LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
let ENDCARD=null;
const $=(i)=>document.getElementById(i), FAM='Caveat', TX=${JSON.stringify(TX)}, LOGO=${JSON.stringify(LOGO.replace(/^<svg/, '<svg id="logo"'))};
const C=(lines,cx,cy)=>centred(lines,cx,cy,FAM).svg, CX=SAFE_CX;
const back=(x)=>{ x=Math.max(0,Math.min(1,x)); const c=1.6; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const ease=(x)=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
const card=(x,y,w,h,lines,o)=>{ o=o||{}; return '<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="34" fill="'+(o.fill||'#FFFDF7')+'" stroke="'+(o.stroke||'${PEN}')+'" stroke-width="'+(o.sw||6)+'"/>'+C(lines,x+w/2,y+h/2)+'</g>'; };
const inkW=(s,size)=>{ const k=inkOf(s,size,FAM); return k.L+k.R; };
// a crayon (the hook's ✏️, drawn: the font has no emoji)
const crayon=(x,y,r)=>'<g data-safe transform="translate('+x+' '+y+') rotate('+r+')"><path d="M-70 -15 h110 l32 15 l-32 15 h-110 z" fill="${PINK}" stroke="${PEN}" stroke-width="5" stroke-linejoin="round"/><path d="M40 -15 l32 15 l-32 15 z" fill="#FFE0C2" stroke="${PEN}" stroke-width="5" stroke-linejoin="round"/><path d="M62 -5 l10 5 l-10 5 z" fill="${PEN}"/><path d="M-48 -15 v30 M-36 -15 v30" stroke="${PEN}" stroke-width="4"/></g>';
const heart=(x,y,s,o)=>'<path transform="translate('+x+' '+y+') scale('+s+')" d="M0 12 C-14 0 -26 -6 -26 -18 C-26 -30 -12 -34 0 -22 C12 -34 26 -30 26 -18 C26 -6 14 0 0 12 Z" fill="${PINK}" stroke="${PEN}" stroke-width="'+(3/s)+'" stroke-linejoin="round" opacity="'+(o==null?1:o)+'"/>';
// a dog from the defs, fitted into a box (cx, bottom, max w, max h), its drawn box measured once
const BB={}; function dogUse(id,cx,bot,mw,mh,sc,apart){ if(!BB[id]){ const u=document.createElementNS('http://www.w3.org/2000/svg','use'); u.setAttribute('href','#'+id); $('page').appendChild(u); BB[id]=u.getBBox(); u.remove(); }
  const b=BB[id], k=Math.min(mw/b.width,mh/b.height)*(sc==null?1:sc), x=cx-(b.x+b.width/2)*k, y=bot-(b.y+b.height)*k;
  return '<g'+(apart?' data-apart="'+id+'"':'')+' transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+k.toFixed(4)+')"><use href="#'+id+'"/></g>'; }
window.frame=async function(t,S,src,V,apart){ $('apart').innerHTML=apart||'';
  const img=$('scr'); if(src){ if(img.getAttribute('src')!==src){ img.src=src; await img.decode(); } img.style.display=''; img.style.transform='translate('+V.l+'px,'+V.t+'px) scale('+V.s+')'; } else img.style.display='none';
  const lt=t-S.a, dur=S.b-S.a; let edge='', page='', cap='';
  // the screen lifted over the paper: a pencil edge and a soft shadow under it
  if(src && V.bot<${H}-1) edge='<rect x="-10" y="'+(V.bot+6)+'" width="1100" height="18" fill="${PEN}" opacity=".12"/><path d="M-10 '+V.bot+' Q270 '+(V.bot+5)+' 540 '+V.bot+' T1090 '+V.bot+'" fill="none" stroke="${PEN}" stroke-width="6" stroke-linecap="round"/>';
  const pop=(d)=>0.86+0.14*back((lt-d)/0.3), fade=(d)=>ease((lt-d)/0.15);
  if(S.cap==='hook'){ const o=fade(0.1), s=pop(0.1);
    cap='<g opacity="'+o+'" transform="translate('+CX+' 420) scale('+s+') rotate(-2) translate('+(-CX)+' -420)">'+card(CX-330,250,660,330,TX.hook)+'</g>'
      +'<g opacity="'+fade(0.45)+'">'+crayon(CX+250,640,-14)+'</g>'; }
  if(S.cap==='dogs'){ // the paper page: twelve crayon dogs pop in, row by row
    page='<rect width="${W}" height="${H}" fill="${PAPER}"/>';
    const cols=3, cw=(SAFE.x1-SAFE.x0)/cols, rows=[660,900,1140,1380];
    for(let i=0;i<12;i++){ const r=Math.floor(i/cols), c=i%cols, d=0.05+i*0.07, k=back((lt-d)/0.35); if(k<=0.01) continue;
      const cx=SAFE.x0+cw*(c+0.5)+(r%2?14:-14), bot=rows[r]+(c%2?4:-4);
      page+='<g opacity="'+ease((lt-d)/0.12)+'">'+dogUse('d'+i,cx,bot,cw-40,168,k,k>0.98)+'</g>'; }
    cap='<g opacity="'+fade(0)+'" transform="translate('+CX+' 330) scale('+pop(0)+') rotate(-2) translate('+(-CX)+' -330)">'+card(CX-inkW(TX.dogs,96)/2-50,252,inkW(TX.dogs,96)+100,156,[{s:TX.dogs,size:96}],{fill:'${YEL}'})+'</g>'
      +''; }
  if(S.cap==='fuji'){ const w=inkW(TX.fuji,80)+90;
    cap='<g opacity="'+fade(0.1)+'" transform="translate('+CX+' 250) scale('+pop(0.1)+') rotate(-1.5) translate('+(-CX)+' -250)">'+card(CX-w/2,190,w,120,[{s:TX.fuji,size:80}])+'</g>'; }
  if(S.cap==='play'){ // one card, the three words: the one being shown in ink, the others pale
    const sz=74, gap=34, dot=' · ', ws=TX.play.map((s)=>inkW(s,sz)), dw=inkW('·',sz), tot=ws.reduce((a,b)=>a+b,0)+2*(dw+2*gap), w=tot+90, x0=CX-w/2, tp=PLAY_A, lp=t-tp;
    let x=CX-tot/2, words='';
    TX.play.forEach((s,i)=>{ const on=i<=S.word, cur=i===S.word; words+='<g opacity="'+(on?1:0.28)+'">'+centred([{s,size:sz,fill:cur?'${PEN}':'#8A7468'}],x+ws[i]/2,300,FAM).svg+'</g>'; x+=ws[i];
      if(i<2){ words+=centred([{s:'·',size:sz,fill:'#8A7468'}],x+gap+dw/2,300,FAM).svg; x+=dw+2*gap; } });
    const o=ease(lp/0.15), s=0.86+0.14*back(lp/0.3);
    cap='<g opacity="'+o+'" transform="translate('+CX+' 300) scale('+s+') rotate(-1.5) translate('+(-CX)+' -300)"><rect data-safe x="'+x0+'" y="240" width="'+w+'" height="120" rx="34" fill="#FFFDF7" stroke="${PEN}" stroke-width="6"/>'+words+'</g>'; }
  if(S.cap==='safe'){ const L=[{s:TX.safe[0],size:84,pitch:92},{s:TX.safe[1],size:84}], w=Math.max(inkW(TX.safe[0],84),inkW(TX.safe[1],84))+100;
    cap='<g opacity="'+fade(0.1)+'" transform="translate('+CX+' 330) scale('+pop(0.1)+') rotate(-2) translate('+(-CX)+' -330)">'+card(CX-w/2,230,w,200,L,{stroke:'#4E9A54'})+'</g>'
      +'<g opacity="'+fade(0.5)+'">'+heart(CX-w/2+10,250,1.3)+heart(CX+w/2-14,410,1.1)+'</g>'; }
  if(S.cap==='end'){ // the standard tall end card (brand/kids/endcard.js), shifted onto TikTok's centre line, and the one line under it
    const o=ease(lt/0.3), a=ease((lt-0.7)/0.3);
    if(!ENDCARD) ENDCARD=endCard('tall',HANDLES,LOGO_INNER);
    page='<rect width="${W}" height="${H}" fill="${PAPER}" opacity="'+o+'"/>';
    cap='<g opacity="'+o+'"><g transform="translate('+(CX-475)+' 0)">'+ENDCARD+'</g>'
      +'<g opacity="'+a+'">'+C([{s:TX.end,size:62}],CX,1262)+'</g></g>'; }
  $('edge').innerHTML=edge; $('page').innerHTML=page; $('cap').innerHTML=cap;
};
</script>`.replace('PLAY_A', String(PLAY));

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle');
  const endTxt = 'a·' + Object.values(handles()).join('') + 'doodledoggo.app?' + TX.end;
  await p.evaluate((txt) => Promise.all(['600 40px Caveat', '700 40px Caveat', '700 40px Andika'].map((f) => document.fonts.load(f, txt))), endTxt); await p.evaluate(() => document.fonts.ready);
  if (!(await p.evaluate((txt) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', txt), endTxt))) throw new Error('Caveat or Andika did not load');
  const segAt = (t) => SEG.find((s) => t >= s.a && t < s.b) || SEG[SEG.length - 1];
  const render = async (t, file) => { const s = segAt(t), src = s.src ? 'file://' + CLIPS[s.src].files[idxAt(s, t)] : null, V = s.src ? viewAt(s, t) : null;
    await p.evaluate(async ([t, S, src, V, ap]) => window.frame(t, S, src, V, ap), [t, s, src, V, s.src ? dogRects(s, t, V) : '']);
    const near = await p.evaluate(() => apartCheck(document.querySelector('#ov'))); if (near.length) throw new Error('dogs too close at ' + t.toFixed(2) + ': ' + near.join('; '));
    const off = await p.evaluate(() => centreCheck(document.querySelector('#ov'))); if (off.length) throw new Error('text not centred at ' + t.toFixed(2) + ': ' + off.join('; '));
    const out = await p.evaluate(() => { const r = document.querySelector('#ov'); const a = document.getElementById('apart'); const keep = a.innerHTML; a.innerHTML = ''; const bad = safeCheck(r); a.innerHTML = keep; return bad; });
    if (out.length) throw new Error('text outside TikTok\'s safe area at ' + t.toFixed(2) + ': ' + out.join('; '));
    await p.screenshot({ path: file, type: 'png' }); };
  const still = process.env.ONLY === 'stills';
  let list = still ? SEG.map((s) => Math.round((s.a + Math.min(1.2, (s.b - s.a) * 0.6)) * FPS)).concat([N - 2]) : [...Array(N).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); list = list.filter((f) => f >= a && f <= z); }
  for (const f of list) await render(f / FPS, path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`));
  console.log(list.length, 'frames, T =', T.toFixed(2), 'shots', SEG.map((s) => (s.src || s.cap) + ' ' + s.a.toFixed(2)).join(', '));
  await b.close();
  if (still) return;

  // sound: the game's own music (the yard by day) and the "discover" sting on the end page (as the Friends Reel)
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(DEV, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.7, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: END + 0.1, name: 'discover' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  await ab.close();
  // Noodle's voice over the music at 30%; the music fades out under the end card (its last 2.5 s)
  const FADE = Math.min(2.5, T - END);
  const inputs = [], chains = [];
  VOAT.forEach((v, i) => { inputs.push('-i', path.join(VO, v.k + '.wav')); const d = Math.round(v.at * 1000); chains.push(`[${i + 2}:a]aresample=44100,volume=1.5,adelay=${d}|${d}[v${i}]`); });
  const mix = `[1:a]atrim=0:${T},volume=0.3,afade=t=out:st=${(T - FADE).toFixed(2)}:d=${FADE.toFixed(2)}[m];` + chains.join(';') + ';' + `[m]${VOAT.map((_, i) => `[v${i}]`).join('')}amix=inputs=${VOAT.length + 1}:normalize=0,alimiter=limit=0.89:level=false,atrim=0:${T}[a]`;
  const out = path.join(WORK, 'doodle-doggo-intro-tiktok.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
