// Reel #4 of the viral list (owner's pick, 6 Nov 2026; docs/marketing/VIRAL_REEL_IDEAS.md): "I drew all 35 dog breeds badly. Find yours before it ends."
// Goal: hold the viewer for the first 10 seconds. The hook card is up at frame 1 with the first dog already moving and stays the whole parade;
// all 35 of the game's dogs flash by, big and centred, 0.26 s each, with the game's English breed name in a pill and a "12/35" counter
// (25 dogs have shown by 7.5 s, all 35 by 10.9 s). Two dogs hold longer while Noodle's deadpan joke about them is said (the Pug, the Greyhound).
// 16.3 s in all: the parade to 11.1 s, the ask to 13.9 s, the end card 2.4 s.
// Then "didn't see yours? comment your dog" and the shared end card (brand/kids/endcard.js) for 2.5 s.
// The art is the game's own (PawArt.dog in its default coat for every breed, the happy pose, its three-frame line boil), the names the game's
// own (game/i18n/en.json data.breed_names.<key>), the breed list from PawArt.DOGS: nothing typed from memory. No game UI. The parade does not
// start with the Dachshund, and the last dog of the parade is not a black or white one (owner, 1 Nov 2026), nor is any dog on the cover.
// Every frame: centreCheck() (every box's text in its exact centre) and safeCheck() (every word, card, pill and dog inside x 60..890,
// y 270..1440, centred on x 475) from ../centre_text.js; the build stops if anything is off.
// Voice: Noodle (Kokoro af_bella 1.1x, vo_breeds.py), burned-in subtitles in short chunks. Music: the game's own upbeat "play" music
// (mods/pawaudio.js, the fetch game), a soft crayon tick per dog, the "discover" sting on the end card; the mix loudnorm I=-16 TP=-1.5.
// 1080 x 1920, 25 fps.
//
//   python3 brand/instagram/launch/breeds_reel/vo_breeds.py <kokoro dir> <vo dir>
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/breeds_reel/build_breeds.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills) and the cover only. ONLY=frames: frames only (no cover, sound or encode).
//   FRAMES=a-b: re-render only those frames over a copy of an earlier full workdir, then encode again with the same sound (marketing rule:
//   never re-render a whole video for a fix to one part). The run prints the frame ranges of the parade, the ask and the end card.
//   PAR=n: render the frames in n child processes (each its own browser over a slice), then mix and encode as usual.
//   COVER=1 re-makes the cover when it exists (it is written when missing).
// Output next to this file: doodle-doggo-35-breeds.mp4 and breeds-cover.jpg (its own design, never a frame of the Reel).
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const WORK = path.resolve(process.argv[2] || 'breeds_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 25, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', YEL = '#FFE3A1', PINK = '#F28FA5';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;

// ---- the game's art, loaded as the game loads it ----
const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', ...'abcdefg'.split('').map((c) => `world/pawart_world_${c}.js`)]) { const p = path.join(ROOT, f); if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx); }
const PA = win.PawArt, inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const NAME = (k) => { const v = EN['data.breed_names.' + k]; if (!v) throw new Error('no English name for ' + k); return v; };

// ---- the parade: a fixed shuffle of the game's 35 dogs. Corgi first (not the Dachshund), the Pug and the Greyhound where Noodle's jokes land,
// colours mixed so no two white or two black dogs meet, the Golden last (not black, not white) ----
const ORDER = ['corgi', 'husky', 'chow', 'samoyed', 'dobie', 'shiba', 'maltese', 'beagle', 'frenchie', 'dachs', 'westie', 'pom', 'gsd', 'bichon', 'minpin',
  'akita', 'stdpoodle', 'yorkie', 'pug', 'collie', 'lab', 'malamute', 'afghan', 'spitz', 'chihuahua', 'corso', 'greyhound', 'shihtzu', 'pitbull', 'poodle',
  'mutt', 'mastiff', 'schnauzer', 'dane', 'golden'];
const KEYS = PA.DOGS.map((d) => d.key);
if (ORDER.length !== KEYS.length || new Set(ORDER).size !== ORDER.length || ORDER.some((k) => !KEYS.includes(k))) throw new Error('the game\'s dogs changed: ' + KEYS.join());
const BW = /^(samoyed|maltese|westie|bichon|spitz|dobie|corso|stdpoodle|mutt|collie)$/; // white, black, or black-and-white in their default coat
if (ORDER[0] === 'dachs' || BW.test(ORDER[ORDER.length - 1])) throw new Error('order rule');
const STEP = 0.26, HOLD = { pug: 1.55, greyhound: 1.0 }; // a held dog stays up while Noodle's joke about it is said
const SLOTS = []; { let a = 0; ORDER.forEach((k, i) => { const d = HOLD[k] || STEP; SLOTS.push({ k, i, a, b: a + d, name: NAME(k), facing: i % 2 ? 'left' : 'right', hold: !!HOLD[k] }); a += d; }); }
const PARADE = SLOTS[SLOTS.length - 1].b;
// a soft colour wash per dog (paper tint and the big blob behind it), cycling, never the same twice in a row
const WASH = [['#FFE1C7', '#F6B98C'], ['#D6F0DA', '#9ACFA4'], ['#D5E8F8', '#93BEE3'], ['#EBDDF7', '#BFA2E0'], ['#FFF0B8', '#F1CF62'], ['#FBD5E1', '#EE9CB6'], ['#DDEFE9', '#8FCBBE']];

// ---- the voice and the timeline ----
const VOAT = [{ k: 'hook', at: 0.1 }];
const slotOf = (k) => SLOTS.find((s) => s.k === k);
VOAT.push({ k: 'pug', at: slotOf('pug').a + 0.1 }, { k: 'legs', at: slotOf('greyhound').a + 0.1 });
const ASK = PARADE; VOAT.push({ k: 'ask', at: ASK + 0.3 });
const ENDC = ASK + 0.3 + VOD.ask + 0.35, T = ENDC + 2.4, NF = Math.round(T * FPS);
VOAT.forEach((v, i) => { const nx = VOAT[i + 1]; if (nx && v.at + VOD[v.k] > nx.at - 0.15) throw new Error('voice lines overlap: ' + v.k); });
// subtitles: Noodle's words in short chunks, each timed by its share of the line (letters, plus a breath at each full stop)
const SUBS_TX = { hook: ['I drew all 35 dog breeds badly.', 'Find yours before it ends!'], pug: ['The Pug was harder', 'than it looks.'],
  legs: ['Mostly legs.'], ask: ["Didn't see yours?", 'Tell me in the comments!'] };
const SUBS = [];
VOAT.forEach((v) => { const parts = SUBS_TX[v.k], wt = parts.map((x) => x.length + (/[.!?]$/.test(x) ? 6 : 2)), sum = wt.reduce((a, b) => a + b, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d, s: x }); t0 += d; }); });
SUBS.forEach((u, i) => { const nx = SUBS[i + 1]; u.b = nx ? Math.min(nx.a, u.b + 0.12) : Math.min(ENDC - 0.1, u.b + 0.4); });

// ---- the dogs' drawings: the default coat, happy, all three line-boil frames (one shown at a time) ----
const ASKDOGS = [['beagle', 'right'], ['corgi', 'right'], ['pom', 'left']]; // the ask page: three not-black, not-white dogs looking on
const COVERDOGS = ['shiba', 'corgi', 'golden', 'pug', 'beagle', 'pom', 'dachs', 'chihuahua', 'frenchie'];
const ART = {};
for (const s of SLOTS) ART['p' + s.i] = inner(PA.dog(s.k, { pose: 'happy', facing: s.facing }));
ASKDOGS.forEach(([k, f], i) => { ART['a' + i] = inner(PA.dog(k, { pose: 'sit', facing: f })); });
COVERDOGS.forEach((k, i) => { ART['c' + i] = inner(PA.dog(k, { pose: i % 3 === 1 ? 'sit' : 'happy', facing: i % 2 ? 'left' : 'right' })); });
for (const [id, s] of Object.entries(ART)) if (!s.includes('pa-d-f2')) throw new Error('no line boil in ' + id);

const LOGO_SVG = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, ''));
const LOGO_INNER = LOGO_SVG.replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

const TX = { hook: ['I drew all 35 dogs badly', 'find yours 👀'], askA: "didn't see yours?", askB: 'comment your dog 👇' };
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${PAPER}}svg{display:block}#art .pa-d-f0,#art .pa-d-f1,#art .pa-d-f2{display:none}#art .k0 .pa-d-f0,#art .k1 .pa-d-f1,#art .k2 .pa-d-f2{display:inline}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 7H14" stroke="#5B3D32" stroke-width="2.2" stroke-linecap="round" opacity=".12"/></pattern>
</defs><g id="bg"></g><g id="art"></g><g id="ov"></g></svg>
<span style="font:700 20px Andika">a</span><span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const $=(i)=>document.getElementById(i), ART=${JSON.stringify(ART)}, SLOTS=${JSON.stringify(SLOTS)}, SUBS=${JSON.stringify(SUBS)}, WASH=${JSON.stringify(WASH)}, TX=${JSON.stringify(TX)};
const LOGO=${JSON.stringify(LOGO_SVG)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const PARADE=${PARADE}, ASK=${ASK}, ENDC=${ENDC}, CX=SAFE_CX, F='Caveat';
const clamp=(x,a,b)=>Math.max(a==null?0:a,Math.min(b==null?1:b,x)), sm=(x)=>{ x=clamp(x); return x*x*(3-2*x); }, eo=(x)=>1-Math.pow(1-clamp(x),3);
const f2=(n)=>Math.round(n*100)/100;
let BOX=null; // each drawing's drawn box (frame 0) on its 240 x 200 canvas
function measure(){ BOX={}; const g=$('art'); for(const [id,s] of Object.entries(ART)){ g.innerHTML='<g class="k0">'+s+'</g>'; const b=g.firstChild.getBBox(); BOX[id]=[b.x,b.y,b.width,b.height]; } g.innerHTML=''; return BOX; }
// a drawing placed by its drawn box: centre x, bottom y, fitted into maxW x maxH (never above the cap), then scaled by z around its feet
function place(id,cx,bot,maxW,maxH,cap,z,dy,k,safe){ const b=BOX[id], s0=Math.min(maxW/b[2],maxH/b[3],cap)*z;
  return '<g'+(safe?' data-safe':'')+' class="k'+k+'" transform="translate('+f2(cx)+' '+f2(bot+(dy||0))+') scale('+s0.toFixed(4)+') translate('+f2(-(b[0]+b[2]/2))+' '+f2(-(b[1]+b[3]))+')">'+ART[id]+'</g>'; }
// a rough crayon blob (seeded), filled and hatched
function blob(cx,cy,r,col,seed,op){ let p='', n=26; const rnd=(i)=>{ const x=Math.sin(seed*91.7+i*12.9898)*43758.5453; return x-Math.floor(x); };
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, rr=r*(0.93+rnd(i)*0.1); p+=(i?'L':'M')+f2(cx+Math.cos(a)*rr)+' '+f2(cy+Math.sin(a)*rr*0.96); }
  p+='Z'; return '<g opacity="'+op+'"><path d="'+p+'" fill="'+col+'"/><path d="'+p+'" fill="url(#hatch)"/></g>'; }
const card=(x,y,w,h,lines,o)=>{ o=o||{}; return '<g data-box><rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" rx="34" fill="'+(o.fill||'${CREAM}')+'" stroke="${PEN}" stroke-width="'+(o.sw||6)+'"/>'+centred(lines,x+w/2,y+h/2,F).svg+'</g>'; };
function sub(t,y){ const u=SUBS.find((x)=>t>=x.a&&t<x.b); if(!u) return ''; const o=Math.min(sm((t-u.a)/0.08),sm((u.b-t)/0.08));
  let size=56; const k=inkOf(u.s,size,F); if(k.L+k.R>720) size=Math.floor(size*720/(k.L+k.R));
  return pill(u.s,CX,y,size,F,{fill:'${PEN}',stroke:'${PEN}',color:'${PAPER}',padX:30,op:(0.95*o).toFixed(3)}); }
let CARD=null;
function fitS(s,size,maxW){ while(size>20){ const k=inkOf(s,size,F); if(k.L+k.R<=maxW) return size; size-=2; } return size; }
window.frame=function(t){
  let bg='', art='', ov='';
  const k=Math.floor(t/0.12)%3;
  if(t<ASK){ const s=SLOTS.find((x)=>t>=x.a&&t<x.b)||SLOTS[SLOTS.length-1], lt=t-s.a+(s.i?0:0.2), // frame 1: the first dog is already up and moving
      w=WASH[s.i%WASH.length];
    // the paper, tinted per dog, and the blob behind the dog (a quick small grow, no overshoot)
    bg='<rect width="${W}" height="${H}" fill="'+w[0]+'"/><rect width="${W}" height="${H}" fill="${PAPER}" opacity=".45"/>'+blob(CX,850,(0.93+0.07*eo(lt/0.12))*400,w[1],s.i+1,0.55);
    // the dog: a quick pop (0.85 to 1, no overshoot) and a small hop; a held dog drifts in a little
    const z=(0.85+0.15*eo(lt/0.11))*(s.hold?1+0.05*sm(lt/(s.b-s.a)):1), dy=-16*Math.sin(Math.PI*clamp(lt/0.2));
    art=place('p'+s.i,CX,1105,700,500,4.8,z,dy,k,true);
    // the hook card, all parade long, and the counter sticker on its corner
    ov+='<g transform="rotate(-2 '+CX+' 395)">'+card(CX-405,286,810,226,[{s:TX.hook[0],size:82,pitch:100},{s:TX.hook[1],size:94}])+'</g>';
    ov+='<g transform="rotate(6 778 540)">'+pill((s.i+1)+'/35',778,540,52,F,{fill:'${YEL}',padX:24})+'</g>';
    // the breed's name, popping with the dog
    const ns=0.9+0.1*eo(lt/0.1); ov+='<g transform="translate('+CX+' 1190) scale('+ns.toFixed(3)+') translate('+(-CX)+' -1190)">'+pill(s.name,CX,1190,76,F,{fill:'${CREAM}',padX:38})+'</g>';
    ov+=sub(t,1352);
  } else if(t<ENDC){ const lt=t-ASK, o=sm(lt/0.2);
    bg='<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" fill="#FFF0B8" opacity="'+(0.55*o).toFixed(3)+'"/>'+blob(CX,880,(0.9+0.1*eo(lt/0.25))*390,'#F1CF62',77,(0.45*o).toFixed(3));
    const cs=0.9+0.1*eo(lt/0.22);
    ov+='<g opacity="'+o.toFixed(3)+'" transform="translate('+CX+' 430) scale('+cs.toFixed(3)+') rotate(-2) translate('+(-CX)+' -430)">'+card(CX-390,300,780,260,[{s:TX.askA,size:100,pitch:112},{s:TX.askB,size:80}])+'</g>';
    [215,475,735].forEach((x,i)=>{ const q=eo((lt-0.15-i*0.1)/0.15); if(q<=0) return; art+=place('a'+i,x,1110,262,340,3.2,0.85+0.15*q,-14*Math.sin(Math.PI*clamp((lt-0.15-i*0.1)/0.22)),(k+i)%3,true); });
    ov+=sub(t,1352);
  } else { const lt=t-ENDC;
    if(!CARD) CARD=endCard('tall',HANDLES,LOGO_INNER);
    bg='<rect width="${W}" height="${H}" fill="${PAPER}"/>'; ov+='<g opacity="'+sm(lt/0.3).toFixed(3)+'">'+CARD+'</g>'; }
  $('bg').innerHTML=bg; $('art').innerHTML=art; $('ov').innerHTML=ov;
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const out=safeCheck($('st')); if(out.length) return 'outside SAFE: '+out.join('; ');
  return '';
};
// the cover: its own design (never a frame of the Reel). Everything that matters inside the middle 1080 x 1440 (y 240..1680).
window.cover=function(){
  const C=540; let bg='<rect width="${W}" height="${H}" fill="${PAPER}"/>', art='', ov='';
  const cells=[[220,890],[540,890],[860,890],[220,1145],[540,1145],[860,1145],[220,1400],[540,1400],[860,1400]];
  cells.forEach(([x,y],i)=>{ bg+=blob(x,y-100,132,WASH[i%WASH.length][1],i+11,0.6); art+=place('c'+i,x,y-18,240,205,2.2,1,0,(i)%3,false); });
  // a crayon magnifying glass over the middle dog
  ov+='<g transform="rotate(-42 540 1050)"><circle cx="540" cy="1050" r="140" fill="#D5E8F8" opacity=".22"/><circle cx="540" cy="1050" r="140" fill="none" stroke="${PEN}" stroke-width="15"/><path d="M540 1190 L540 1262" stroke="${PEN}" stroke-width="30" stroke-linecap="round"/><path d="M470 975 q28 -28 66 -32" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/></g>';
  ov+='<g transform="rotate(-3 '+C+' 390)">'+card(C-440,290,880,200,[{s:'FIND YOUR DOG',size:fitS('FIND YOUR DOG',150,780)}],{sw:8})+'</g>';
  ov+='<g transform="rotate(2 '+C+' 575)">'+pill('35 dogs, all drawn badly',C,575,66,F,{fill:'${YEL}',padX:36})+'</g>';
  const lw=520, lh=lw*280/900; ov+='<svg x="'+(C-lw/2)+'" y="1470" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>';
  $('bg').innerHTML=bg; $('art').innerHTML=art; $('ov').innerHTML=ov;
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const r=$('st').querySelectorAll('#ov > *, #art > *'); for(const e of r){ const b=e.getBoundingClientRect(); if(b.top<240||b.bottom>1680||b.left<0||b.right>1080) return 'cover: outside the middle 1080 x 1440: '+[b.left,b.top,b.right,b.bottom].map(Math.round); }
  return '';
};
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const pageFile = path.join(WORK, `page_${process.pid}.html`); // one per process: PAR children must not rewrite each other's page while it loads
  fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const allText = [TX.hook, TX.askA, TX.askB, SLOTS.map((s) => s.name), Object.values(SUBS_TX), 'FIND YOUR DOG 35 dogs, all drawn badly 0123456789/'].flat(3).join(' ');
  await p.evaluate((txt) => Promise.all(['700 40px Andika', '700 40px Caveat'].map((f) => document.fonts.load(f, txt))), allText);
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => measure());
  fs.unlinkSync(pageFile);
  const render = async (t, file) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) throw new Error(err + ' at ' + t.toFixed(2));
    await p.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', ...(file.endsWith('.jpg') ? { quality: 92 } : {}) }); };
  const fr = (t) => Math.round(t * FPS);
  if (!process.env.FRAMES || process.env.ONLY === 'stills') console.log('T =', T.toFixed(2), 's,', NF, 'frames; parade 0-' + (fr(ASK) - 1) + ', ask ' + fr(ASK) + '-' + (fr(ENDC) - 1) + ', end card ' + fr(ENDC) + '-' + (NF - 1)
    + '; 25 dogs by ' + SLOTS[24].a.toFixed(2) + ' s, all 35 by ' + SLOTS[34].a.toFixed(2) + ' s; voice at ' + VOAT.map((v) => v.k + ' ' + v.at.toFixed(2)).join(', '));

  // the cover (written when missing, or with COVER=1)
  const coverFile = path.join(OUT, 'breeds-cover.jpg');
  if (process.env.ONLY !== 'frames' && !process.env.FRAMES && (process.env.COVER === '1' || !fs.existsSync(coverFile))) {
    const err = await p.evaluate(() => window.cover()); if (err) throw new Error(err);
    await p.screenshot({ path: coverFile, type: 'jpeg', quality: 92 }); console.log('wrote', coverFile); }

  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : [0, 0.5, 2.0, 4.0, 5.0, 5.5, 7.0, 8.2, 9.0, 10.0, SLOTS[34].a + 0.1, ASK + 0.1, ASK + 0.6, ASK + 1.6, ENDC + 0.1, T - 0.1];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return;
  }
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, NF];
  const t0 = Date.now(), PAR = +process.env.PAR || 1;
  if (PAR > 1 && !process.env.FRAMES) { // PAR=n: n child processes, each its own browser over a slice of the frames
    await b.close(); const n = Math.ceil(NF / PAR);
    await Promise.all(Array.from({ length: PAR }, (_, i) => new Promise((ok, no) => {
      const c = cp.spawn(process.execPath, [__filename, WORK, VO], { env: { ...process.env, PAR: '', ONLY: 'frames', FRAMES: `${i * n}-${Math.min(NF, (i + 1) * n)}` }, stdio: 'inherit' });
      c.on('exit', (code) => (code ? no(new Error('frames part ' + i + ' failed')) : ok())); })));
  } else { for (let fi = FA; fi < Math.min(FB, NF); fi++) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));
      if ((fi - FA) % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
    await b.close(); }
  if (process.env.ONLY === 'frames') return;
  for (let fi = 0; fi < NF; fi++) if (!fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`))) throw new Error('missing frame ' + fi + ' (FRAMES=a-b needs a full workdir)');

  // ---- sound: the game's upbeat music, a soft tick per dog, Noodle on top; kept in WORK so a FRAMES fix reuses it ----
  const mixWav = path.join(WORK, 'mix.wav');
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
    const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
      segments: [{ at: 0, ctx: { place: 'fetch', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: ENDC + 0.05, name: 'discover' }]]);
    fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
    // a soft crayon tick as each dog pops in: one short track
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
    const ticks = SLOTS.map((s) => Math.round(s.a * 1000));
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'tick.wav'), '-filter_complex',
      `[0:a]asplit=${ticks.length}${ticks.map((_, i) => `[s${i}]`).join('')};` + ticks.map((d, i) => `[s${i}]adelay=${d}|${d}[t${i}]`).join(';') + ';' + ticks.map((_, i) => `[t${i}]`).join('') + `amix=inputs=${ticks.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`,
      '-map', '[a]', '-ar', '44100', '-ac', '1', path.join(WORK, 'ticks.wav')]);
    const inputs = [], chains = [];
    VOAT.forEach((v, i) => { inputs.push('-i', path.join(VO, v.k + '.wav')); const d = Math.round(v.at * 1000); chains.push(`[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`); });
    const voWav = path.join(WORK, 'voice.wav');
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', chains.join(';') + ';' + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
    const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, 'premix.wav');
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', path.join(WORK, 'ticks.wav'), '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},volume=${mG.toFixed(2)}dB,afade=t=out:st=${(T - 0.9).toFixed(2)}:d=0.9[m];[2:a]volume=-10dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    // the whole mix to -16 LUFS, true peak -1.5 (measured, then applied linearly): a Reel
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, m = JSON.parse(r.slice(r.lastIndexOf('{')));
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, 'doodle-doggo-35-breeds.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(2), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
