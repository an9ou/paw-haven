// v2.19 "Friends first" launch Reel: "4 ways your dog can make friends (no chat)" (owner's go-ahead 2 Nov 2026; plan docs/marketing/V219_FRIENDS_FIRST.md).
// Real game footage of the v2.19 Friends screens (capture_friends.js), full frame, with caption cards on top, then the safety line and an end page
// with OUR friend card drawn from the game's own card art and QR (PawArt.FRIENDS.card + mods/qr.js), asking for friend codes in the comments.
// 1080 x 1920, 30 fps, the game's own cozy music (the yard by day), a tick on each numbered way and the "discover" sting on the end page.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/build_friends.js <game checkout> <footage dir> <workdir>
//   ONLY=stills renders key frames only. The cover: make_friends_cover.js. REDNOTE=1: every word in Simplified Chinese, no game link anywhere (after the owner approves).
// The footage's layout.json says whether the code is the real one (OUR_CODE at capture time). Without it every frame that shows our card carries
// a red "placeholder" patch over the code and the QR: a preview for the owner, never posted.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js'); // owner's rule: text in every box sits in its exact centre
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const DEV = path.resolve(process.argv[2] || '.'), FOOT = path.resolve(process.argv[3] || 'friends_footage');
const WORK = path.resolve(process.argv[4] || 'friends_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const RN = !!process.env.REDNOTE, SUF = RN ? '-rednote' : '';
const fam = RN ? "'LXGW WenKai', Caveat" : 'Caveat';
const FPS = 30, W = 1080, H = 1920;
const LAY = JSON.parse(fs.readFileSync(path.join(FOOT, 'layout.json'), 'utf8'));
const PLACEHOLDER = LAY.placeholder;

// ---- our card, from the game's own art (the v2.19 build's world art and QR module) ----
const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(DEV, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(DEV, 'world', f), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(DEV, 'mods', 'qr.js'), 'utf8'), ctx);
const PA = win.PawArt; if (!PA.FRIENDS || !PA.FRIENDS.card) throw new Error('no PawArt.FRIENDS in ' + DEV + ': use the v2.19 build');
const dcSrc = fs.readFileSync(path.join(DEV, 'game', 'src', '40_dogcards.js'), 'utf8');
const words = (k) => JSON.parse(dcSrc.match(new RegExp('const ' + k + ' = (\\[[\\s\\S]*?\\]);'))[1].replace(/'/g, '"'));
const OUR_NAME = words('DC_WORDS_A')[LAY.name[0]] + ' ' + words('DC_WORDS_B')[LAY.name[1]];
const FR_LINK = (fs.readFileSync(path.join(DEV, 'game', 'src', '50_friends.js'), 'utf8').match(/const FR_LINK = '([^']+)'/) || [])[1];
if (!FR_LINK) throw new Error('FR_LINK changed');
function cardSVG() { // as the game's frCardSVG: the card art, the QR of the invite link in its white tile, the friend name above the code line
  const code = PLACEHOLDER ? '' : LAY.code, box = PA.FRIENDS.cardQR;
  let svg = PA.FRIENDS.card(code), qr = '';
  if (code) { const M = win.PawQR.matrix(FR_LINK + code), n = M.length, s = box.w / (n + 4);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (M[r][c]) qr += `<rect x="${(box.x + (c + 2) * s).toFixed(2)}" y="${(box.y + (r + 2) * s).toFixed(2)}" width="${(s + 0.15).toFixed(2)}" height="${(s + 0.15).toFixed(2)}" fill="#5B3D32"/>`; }
  const size = OUR_NAME.length > 16 ? 15 : OUR_NAME.length > 12 ? 18 : 22;
  const nm = `<text x="222" y="104" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="${size}" fill="#5B3D32">${OUR_NAME}</text>`;
  return svg.replace(/<\/svg>\s*$/, qr + nm + '</svg>');
}
const CARD = cardSVG().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

// ---- the words ----
const TX = RN ? null : {
  hook: [{ s: '4 ways your dog', size: 96, pitch: 112 }, { s: 'can make friends', size: 96, pitch: 118 }, { s: '(no chat)', size: 76 }],
  name: 'pick a friend name', code: 'get 1 friend code',
  ways: ['visit their yard, pet their dogs', 'leave a paw-print note', 'send a gift, once a day', 'take their dog on your walk'],
  letter: 'gifts land in the mailbox',
  safe: [{ s: 'no chat. no messages.', size: 88, pitch: 112 }, { s: 'friends add you', size: 66, pitch: 76 }, { s: 'with your code', size: 66 }],
  endAsk: 'add us!', endSub: 'then drop your friend code below', endFree: 'a free cozy dog game', pill: 'play free at doodledoggo.app',
  ph: 'placeholder: our real code on 7 Nov',
};
if (!TX) throw new Error('RedNote words come after the owner approves the English cut');

// ---- the timeline: [start, end, source, from (clip seconds), view { z0, z1, fx, fy0, fy1 }, caption] ----
const SEG = []; let at = 0;
const seg = (len, src, from, view, cap) => { SEG.push({ a: at, b: at + len, src, from, view, cap }); at += len; };
seg(2.8, 'yard', 0.1, { z0: 1.0, z1: 1.08, fx: 0.5, fy0: 0.6, fy1: 0.62 }, { hook: true });
seg(1.7, 'name', 1.1, { z0: 1.12, z1: 1.18, fx: 0.5, fy0: 0.42, fy1: 0.42 }, { s: TX.name });
seg(1.7, 'card', 0.2, { z0: 1.0, z1: 1.05, fx: 0.5, fy0: 0.3, fy1: 0.28 }, { s: TX.code, card: true });
seg(3.1, 'visit', 0.45, { z0: 1.3, z1: 1.38, fx: 0.42, fy0: 0.6, fy1: 0.6 }, { n: 1, s: TX.ways[0] });
seg(2.3, 'note', 0.25, { z0: 1.05, z1: 1.12, fx: 0.5, fy0: 0.55, fy1: 0.6 }, { n: 2, s: TX.ways[1] });
seg(2.6, 'gift', 0.45, { z0: 1.08, z1: 1.12, fx: 0.5, fy0: 0.68, fy1: 0.6, lift: 380, liftIn: true }, { n: 3, s: TX.ways[2] });
seg(1.3, 'gift_letter', 0, { z0: 1.06, z1: 1.12, fx: 0.5, fy0: 0.36, fy1: 0.36, lift: -330 }, { n: 3, s: TX.letter, keep: true });
seg(0.8, 'walk_pick', 0, { z0: 1.7, z1: 1.8, fx: 0.4, fy0: 0.83, fy1: 0.83 }, { n: 4, s: TX.ways[3] });
seg(3.0, 'walk', 0.6, { z0: 1.5, z1: 1.5, fx: 0.3, fy0: 0.57, fy1: 0.57 }, { n: 4, s: TX.ways[3], keep: true });
seg(2.2, 'friends_list', 0, { z0: 1.0, z1: 1.04, fx: 0.5, fy0: 0.5, fy1: 0.5 }, { safe: true });
const END = at; seg(3.6, 'end', 0, null, { end: true });
const T = at, N = Math.round(T * FPS);

// ---- footage: each clip's frames with their game times; a still is one frame ----
const CLIPS = {};
for (const s of SEG) { if (s.src === 'end' || CLIPS[s.src]) continue;
  const dir = path.join(FOOT, s.src);
  if (fs.existsSync(path.join(dir, 'ts.json'))) { const ts = JSON.parse(fs.readFileSync(path.join(dir, 'ts.json'), 'utf8')); CLIPS[s.src] = { ts, files: ts.map((_, i) => path.join(dir, String(i).padStart(5, '0') + '.jpg')) }; }
  else CLIPS[s.src] = { ts: [0], files: [path.join(FOOT, s.src + '.png')] }; }
const frameAt = (s, t) => { const c = CLIPS[s.src], g = s.from + (t - s.a); let i = 0; while (i + 1 < c.ts.length && c.ts[i + 1] <= g) i++; return 'file://' + c.files[i]; };
// the card's place on screen (CSS px of the 393 x 659 phone), for the placeholder patch over the code line and the QR
const CR = LAY.card, VW = CR.vw, VH = CR.vh;

const PEN = '#5B3D32', GREEN = '#4E9A54', PINK = '#F28FA5', PAPER = '#FFF8EC';
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}#st{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${PAPER}}#scr{position:absolute;left:0;top:0;transform-origin:0 0}#ov{position:absolute;left:0;top:0}</style>
<div id="st"><img id="scr"><svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g id="dim"></g><g id="ph"></g><g id="cap"></g><g id="end"></g></svg></div>
<script>
${CENTRE_JS}
${SAFE_JS}
const $=(i)=>document.getElementById(i), FAM=${JSON.stringify(fam)}, TX=${JSON.stringify(TX)}, PH=${JSON.stringify(PLACEHOLDER)}, CR=${JSON.stringify(CR)};
const C=(lines,cx,cy)=>centred(lines,cx,cy,FAM);
const back=(x)=>{ x=Math.max(0,Math.min(1,x)); const c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const ease=(x)=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
const card=(x,y,w,h,stroke,sw,lines,fill)=>'<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="36" fill="'+(fill||'#FFFDF7')+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>'+C(lines,x+w/2,y+h/2).svg+'</g>';
const bubble=(r,fill,s,size)=>'<g data-box><circle r="'+r+'" fill="'+fill+'" stroke="${PEN}" stroke-width="6"/>'+C([{s,size}],0,0).svg+'</g>';
// ONE cut for every platform (owner, 2 Nov 2026): YouTube Shorts, Instagram Reels and TikTok lay their buttons over the right side and their
// titles, names and captions over the top and the bottom. All our words stay inside SAFE (x 60..890, y 250..1440 of 1080 x 1920), centred on
// x 475; safeCheck() stops the build if any text leaves it. The game screen behind still fills the frame.
const CX=SAFE_CX;
// a list of lines sized down (all together) until the widest ink fits maxW
function fit(lines,maxW){ const wd=Math.max(...lines.map((l)=>{ const k=inkOf(l.s,l.size,FAM); return k.L+k.R; })), f=Math.min(1,maxW/wd);
  return f>=1?lines:lines.map((l)=>Object.assign({},l,{size:Math.floor(l.size*f),pitch:l.pitch?Math.floor(l.pitch*f):undefined})); }
// the screen: the 1179 x 1977 shot, scaled to the frame's height (z 1) or zoomed in on (fx, fy), never past its edges; lift slides it up (or down)
// over the paper (so a sheet at the bottom of the phone comes clear of the platforms' bottom captions), with a pencil edge and a shadow
function view(src, z, fx, fy, lift){ const img=$('scr'), k=${H}/1977*z, w=1179*k, h=1977*k;
  const l=Math.min(0,Math.max(${W}-w, ${W}/2-fx*w)), t=Math.min(0,Math.max(${H}-h, ${H}/2-fy*h))-(lift||0);
  img.style.transform='translate('+l+'px,'+t+'px) scale('+k+')'; return {l,t,k,bot:t+h}; }
window.frame=async function(t, S, src){
  const img=$('scr'); if(src){ if(img.getAttribute('src')!==src){ img.src=src; await img.decode(); } img.style.display=''; } else img.style.display='none';
  let v=null; if(S.view){ const u=ease((t-S.a)/(S.b-S.a)); v=view(src, S.view.z0+(S.view.z1-S.view.z0)*u, S.view.fx, S.view.fy0+(S.view.fy1-S.view.fy0)*u, (S.view.lift||0)*(S.view.liftIn?ease((t-S.a)/0.35):1)); }
  const lt=t-S.a, cp=S.cap||{}; let cap='', dim='', ph='', end='';
  if(v && v.t>1) dim+='<path d="M-10 '+v.t+' Q270 '+(v.t-5)+' 540 '+v.t+' T1090 '+v.t+'" fill="none" stroke="${PEN}" stroke-width="6" stroke-linecap="round"/>';
  if(v && v.bot<${H}-1) dim+='<rect x="-10" y="'+(v.bot+6)+'" width="1100" height="18" fill="${PEN}" opacity=".12"/><path d="M-10 '+v.bot+' Q270 '+(v.bot+5)+' 540 '+v.bot+' T1090 '+v.bot+'" fill="none" stroke="${PEN}" stroke-width="6" stroke-linecap="round"/>';
  // the placeholder patch over our card's QR and code line (a preview only: the real code comes from the live game on 7 Nov)
  if(PH && v && (S.src==='card')){ const px=(x)=>v.l+(CR.x+x/300*CR.w)*3*v.k, py=(y)=>v.t+(CR.y+y/200*CR.h)*3*v.k;
    ph='<rect x="'+px(28)+'" y="'+py(36)+'" width="'+(px(156)-px(28))+'" height="'+(py(162)-py(36))+'" fill="#FFFDF7"/><rect x="'+px(160)+'" y="'+py(112)+'" width="'+(px(284)-px(160))+'" height="'+(py(146)-py(112))+'" fill="#FFFDF7"/>'
      +'<g transform="rotate(-6 '+CX+' '+py(100)+')">'+pill(TX.ph,CX,Math.max(py(100),SAFE.y0+40),44,FAM,{fill:'#FFE0E0',stroke:'#C0392B',color:'#C0392B',padX:22})+'</g>'; }
  if(cp.hook){ const o=lt<2.5?1:Math.max(0,1-(lt-2.5)/0.3);
    cap='<g opacity="'+o+'" transform="rotate(-2 '+CX+' 470)">'+card(CX-410,280,820,380,'${PEN}',7,fit(TX.hook,730))+'</g>'; }
  else if(cp.safe){ dim+='<rect width="${W}" height="${H}" fill="${PAPER}" opacity="'+(0.82*ease(lt/0.25))+'"/>';
    const s=back(lt/0.35); cap='<g transform="translate('+CX+' 860) scale('+s+') rotate(-1.5) translate('+(-CX)+' -860)">'+card(CX-400,650,800,420,'${GREEN}',8,fit(TX.safe,700))+'</g>'; }
  else if(cp.s){ const kept=cp.keep, s=kept?1:back(lt/0.3), o=kept?1:ease(lt/0.15);
    const L=fit([{s:cp.s,size:64}],cp.n?600:720), k=inkOf(cp.s,L[0].size,FAM), w=k.L+k.R+90, x0=cp.n?SAFE.x0+120:CX-w/2, x=Math.min(x0,SAFE.x1-w);
    cap='<g opacity="'+o+'" transform="translate('+CX+' 330) scale('+s+') rotate(-1.5) translate('+(-CX)+' -330)">'+card(x,265,w,130,'${PEN}',6,L)
      +(cp.n?'<g transform="translate('+(x-50)+' 330) rotate(-8)">'+bubble(58,'#FFE3A1',cp.n+'.',78)+'</g>':'')+'</g>'; }
  if(cp.end){ const o=ease(lt/0.3), cs=back((lt-0.15)/0.4), a=ease((lt-0.5)/0.3);
    end='<rect width="${W}" height="${H}" fill="${PAPER}" opacity="'+o+'"/><g opacity="'+o+'">'
      +'<g transform="rotate(-2 '+CX+' 360)">'+C([{s:TX.endAsk,size:140}],CX,360).svg+'</g><path d="M'+(CX-220)+' 440 Q'+CX+' 420 '+(CX+220)+' 440" fill="none" stroke="${PINK}" stroke-width="14" stroke-linecap="round" opacity=".6"/>'
      +'<g transform="translate('+CX+' 725) scale('+(cs*2.55)+') rotate(-2) translate(-150 -100)">${CARD.replace(/'/g, "\\'").replace(/\n/g, ' ')}</g>'
      +(PH?'<g transform="rotate(-6 '+CX+' 745)">'+pill(TX.ph,CX,745,44,FAM,{fill:'#FFE0E0',stroke:'#C0392B',color:'#C0392B',padX:22})+'</g>':'')
      +'<g opacity="'+a+'">'+C(fit([{s:TX.endSub,size:68}],800),CX,1050).svg
      +'<path d="M'+CX+' 1095 q-12 45 0 82 M'+(CX-24)+' 1150 l24 30 l24 -30" fill="none" stroke="${PEN}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>'
      +'<g transform="rotate(-3 '+(CX-125)+' 1268)">'+C([{s:'Doodle',size:100}],CX-125,1268).svg+'</g><g transform="rotate(2 '+(CX+140)+' 1272)">'+C([{s:'Doggo',size:100}],CX+140,1272).svg+'</g>'
      +C([{s:TX.endFree,size:44,fill:'#8A7468'}],CX,1335).svg
      +(()=>{ const L=fit([{s:TX.pill,size:52}],700), k=inkOf(TX.pill,L[0].size,FAM), w=k.L+k.R+70; return '<g data-box><rect x="'+(CX-w/2)+'" y="1362" width="'+w+'" height="72" rx="36" fill="#FFE3A1" stroke="${PEN}" stroke-width="4"/>'+C(L,CX,1398).svg+'</g>'; })()+'</g>'; }
  $('dim').innerHTML=dim; $('ph').innerHTML=ph; $('cap').innerHTML=cap; $('end').innerHTML=end;
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => Promise.all(['600 40px Caveat', '700 40px Caveat'].map((f) => document.fonts.load(f)))); await p.evaluate(() => document.fonts.ready);
  const segAt = (t) => SEG.find((s) => t >= s.a && t < s.b) || SEG[SEG.length - 1];
  const render = async (t, file) => { const s = segAt(t), src = s.src === 'end' ? (CLIPS.walk ? frameAt(SEG[SEG.length - 2], SEG[SEG.length - 2].b - 0.01) : null) : frameAt(s, t);
    await p.evaluate(async ([t, S, src]) => window.frame(t, S, src), [t, s, src]);
    const off = await p.evaluate(() => centreCheck(document.querySelector('#ov'))); if (off.length) throw new Error('text not centred at ' + t.toFixed(2) + ': ' + off.join('; '));
    const out = await p.evaluate(() => safeCheck(document.querySelector('#ov'))); if (out.length) throw new Error('text outside the all-platform safe area at ' + t.toFixed(2) + ': ' + out.join('; '));
    await p.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', quality: file.endsWith('.jpg') ? 95 : undefined }); };
  const still = process.env.ONLY === 'stills';
  const list = still ? SEG.map((s) => Math.round(((s.a + s.b) / 2) * FPS)).concat([Math.round((END + 2.5) * FPS)]) : [...Array(N).keys()];
  for (const f of list) await render(f / FPS, path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`));
  console.log(list.length, 'frames, T =', T.toFixed(2));
  await b.close(); // the cover is its own design: make_friends_cover.js
  if (still) return;

  // sound: the game's own music (the yard by day), a soft tick as each numbered way pops in, "discover" on the end page
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.7, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: END + 0.1, name: 'discover' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  await ab.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.45*sin(2*PI*880*t)*exp(-t*30)':s=44100:d=0.25", path.join(WORK, 'tick.wav')]);
  const EV = SEG.filter((s, i) => s.cap && (s.cap.s || s.cap.safe) && !s.cap.keep).map((s) => s.a + 0.02);
  const inputs = [], chains = [];
  EV.forEach((a, i) => { inputs.push('-i', path.join(WORK, 'tick.wav')); const d = Math.round(a * 1000); chains.push(`[${i + 2}:a]adelay=${d}|${d}[k${i}]`); });
  const mix = `[1:a]atrim=0:${T},afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${EV.map((_, i) => `[k${i}]`).join('')}amix=inputs=${EV.length + 1}:normalize=0,alimiter=limit=0.89:level=false,atrim=0:${T}[a]`;
  const out = path.join(WORK, `doodle-doggo-friends${SUF}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
