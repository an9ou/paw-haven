// "Trick or treat, but make it crayon" (owner, 30 Oct 2026): Noodle, in the Little Witch Hat & Cape, knocks on four of the game's kennels
// around town. A dog in one of the Halloween Market's new costumes opens each door and drops a dog-safe treat in Noodle's pumpkin bucket;
// the last door is the Rocket Ship, where Butter in the Dinosaur Hood says WOOF and Noodle runs off without the treats. Then the ending page.
// 10.5 s (doors 1-3 1.67 s each, door 4 2.5 s, the ending 3 s), 1080 x 1920, 30 fps, a Halloween lo-fi beat (the game's own music engine in its dark minor mood, ../spooky_lofi.js), knocks, the game's puppy barks.
// Everything drawn is the game's real art (PawArt.scene / house / dog / prop); the poses glide between the game's drawings for every frame
// (the same in-between patch as freestyle_reel/build_dance.js, in this script's copy of the art only; no game file changes).
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/trick_reel/build_trick.js <workdir>
//   ONLY=stills renders key frames and the cover only.
//   REDNOTE=1: the RedNote cut: every word in Simplified Chinese (the game's own zh-Hans names, LXGW WenKai) and no game link anywhere.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { spookySource } = require('../spooky_lofi.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'trick_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const RN = !!process.env.REDNOTE, SUF = RN ? '-rednote' : '';
const fam = RN ? "'LXGW WenKai', Caveat" : 'Caveat';
// doors 1-3 play their story 1.5x faster so the dinosaur arrives at about 6 s (owner, 30 Oct 2026); door 4 plays at full speed
const SHOT = 2.5, NS = 4, K = [1.5, 1.5, 1.5, 1], STARTS = K.reduce((a, k, i) => (a.push(i ? a[i - 1] + SHOT / K[i - 1] : 0), a), []), END = STARTS[NS - 1] + SHOT, T = END + 3.0, FPS = 30, N = Math.round(T * FPS), W = 1080, H = 1920, FEET = 1640;
const TEMPO = 1;   // the Halloween lo-fi plays at its own 80 bpm (owner, 30 Oct 2026)

// ---- the real art, with the dance marks and ground shadows off and in-between poses on (as in build_dance.js) ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(ROOT, 'world', f), 'utf8'), ctx);
let src = fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
for (const [a, b] of [['if(L.danceFx){', 'if(false){'], ["const shadow=(s.wet&&pose!=='jump'?wetPuddle(shx,shw):'')+`", "const shadow=''&&`"],
  ['const f=frame(key,s,pose,o.outfit,k,seed,ex)', 'const f=frame(key,s,pose,o.outfit,(o.kf!=null?o.kf:k),seed,ex)'], ['kit(rng(seed+k*7717))', 'kit(rng(seed))'],
  ['+k*31)', ')'], ['seed*5+k*977+11', 'seed*5+11'], ['seed*3+k*131+7', 'seed*3+7']]) { if (!src.includes(a)) throw new Error('art changed: ' + a); src = src.replace(a, b); }
src = src.replace(/\]\[k\]/g, '].LK(k)').replace(/\]\[L\.k\|\|0\]/g, '].LK(L.k||0)').replace(/\]\[L\.k\]/g, '].LK(L.k)');
vm.runInContext(`Array.prototype.LK=function(k){ if(Number.isInteger(k)) return this[k];
  const n=this.length, i=((Math.floor(k)%n)+n)%n, j=(i+1)%n, x=k-Math.floor(k), f=x*x*(3-2*x);
  const mix=(a,b)=>typeof a==='number'&&typeof b==='number' ? a+(b-a)*f : Array.isArray(a)&&Array.isArray(b) ? a.map((v,q)=>mix(v,b[q])) : (f<.5?a:b);
  return mix(this[i],this[j]); };`, ctx);
vm.runInContext(src, ctx);
const PA = win.PawArt, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

// ---- the words (RedNote: the game's own zh-Hans names) ----
const TX = RN ? { hook: ['第4扇门，', '零食全没了'], hookSize: 92, hookSub: '不给糖就捣蛋，蜡笔版', knock: '咚咚咚', ask: '不给糖就捣蛋！', askSize: 54, newc: '万圣节新服装', run: '……零食不要了',
  sub: '一款免费的温馨狗狗游戏', pill: '搜索 Doodle Doggo 就能玩', pillSize: 50, market: '万圣节市集开到11月15日', line: '不给糖就捣蛋？要糖。永远要糖。', lineSize: 50, labelSize: 52 }
  : { hook: ['door 4 cost him', 'every treat'], hookSize: 96, hookSub: 'trick or treat, but make it crayon', knock: 'knock knock', ask: 'trick or treat!', askSize: 62, newc: 'new Halloween costume', run: '...he left the treats.',
  sub: 'a free cozy dog game', pill: 'play free at doodledoggo.app', pillSize: 66, market: 'the Halloween Market is open until 15 Nov', line: 'trick or treat? treat. always treat.', lineSize: 58, labelSize: 60 };
// the four doors: a place, a kennel, the dog who answers in a new Halloween Market costume, and a dog-safe treat (the last door has none)
const ZH = { 'Scarecrow Overalls': '稻草人背带裤', 'Skeleton Suit': '骷髅服', 'Mummy Wraps': '木乃伊绷带', 'Dinosaur Hood': '恐龙帽兜' };
const DOORS = [
  { place: 'park', time: 'night', house: 'Pumpkin Cottage', dog: 'corgi', costume: 'Scarecrow Overalls', treat: 'bone' },
  { place: 'square', time: 'dusk', house: 'Friendly Haunted Kennel', dog: 'husky', costume: 'Skeleton Suit', treat: 'carrot' },
  { place: 'yard', time: 'night', house: 'Royal Castle Kennel', dog: 'pug', costume: 'Mummy Wraps', treat: 'cookie' },
  { place: 'hilltop', time: 'dusk', house: 'Rocket Ship', dog: 'lab', costume: 'Dinosaur Hood', treat: null, pose: 'speak' },
];
const scenes = DOORS.map((d, i) => `<symbol id="sc${i}" viewBox="331 0 337.5 600" preserveAspectRatio="xMidYMid slice">${inner(PA.scene(d.place, { time: d.time, weather: 'sunny', season: 'autumn', jp: true, halloween: true }))}</symbol>`).join('');
const houses = DOORS.map((d, i) => `<symbol id="hs${i}" viewBox="0 0 240 200">${inner(PA.house(d.house))}</symbol>`).join('');
const JACK = inner(PA.prop('jackolantern', { lit: true }));
// the dogs: Noodle walking, begging and running off in his witch outfit; each host in its costume; the two of them on the ending page
const WITCH = { body: 'Little Witch Hat & Cape' };
const LOOK = {
  nwalk: ['dachs', { pose: 'walk', facing: 'right', outfit: WITCH }], nbeg: ['dachs', { pose: 'beg', facing: 'right', outfit: WITCH }],
  nrun: ['dachs', { pose: 'jump', facing: 'left', outfit: WITCH, expr: 'zoomies' }],
  ...Object.fromEntries(DOORS.map((d, i) => ['h' + i, [d.dog, { pose: d.pose || 'happy', facing: 'left', outfit: { body: d.costume } }]])),
  en: ['dachs', { pose: 'happy', facing: 'right', outfit: WITCH }], eb: ['lab', { pose: 'happy', facing: 'left', outfit: { body: 'Dinosaur Hood' } }],
};
const dogSvg = (id, kf) => { const [key, o] = LOOK[id]; return inner(PA.dog(key, Object.assign({ anim: false }, o, { kf: ((kf % 3) + 3) % 3 }))); };
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');
const PEN = '#5B3D32';
// dog-safe treats, crayon style: a bone biscuit, a carrot, a pumpkin cookie
const TREAT = {
  bone: `<path d="M-26 -7 Q-36 -18 -26 -21 Q-20 -24 -18 -14 L18 -14 Q20 -24 26 -21 Q36 -18 26 -7 Q36 4 26 7 Q20 10 18 0 L-18 0 Q-20 10 -26 7 Q-36 4 -26 -7Z" fill="#F6E1B8" stroke="${PEN}" stroke-width="4" stroke-linejoin="round" transform="translate(0 7)"/>`,
  carrot: `<path d="M-8 -20 L8 -20 L0 30Z" fill="#E8863A" stroke="${PEN}" stroke-width="4" stroke-linejoin="round"/><path d="M-4 -6 L3 -6 M-2 6 L3 6" stroke="${PEN}" stroke-width="2.5"/><path d="M0 -20 Q-10 -36 -14 -32 M0 -20 Q2 -38 6 -36 M0 -20 Q10 -32 14 -28" fill="none" stroke="#5E9A4A" stroke-width="5" stroke-linecap="round"/>`,
  cookie: `<circle r="22" fill="#F2A65A" stroke="${PEN}" stroke-width="4"/><path d="M-8 -6 L-4 -10 M6 -8 L10 -3 M-10 8 L-5 10 M5 6 L9 10" stroke="${PEN}" stroke-width="3" stroke-linecap="round"/>`,
};

const T_ = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || fam}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || PEN}" text-anchor="${o.a || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">${RN ? '<link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css" rel="stylesheet">' : ''}<style>html,body{margin:0;background:#fff}svg{display:block}
[class$="-hl"]{display:none}
.pa-dog *{animation:none!important}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${scenes}${houses}${dogSyms}<symbol id="jack" viewBox="0 0 80 80">${JACK}</symbol>${Object.entries(TREAT).map(([k, v]) => `<symbol id="t_${k}" overflow="visible">${v}</symbol>`).join('')}</defs>
<use id="bg" href="#sc0" x="0" y="0" width="${W}" height="${H}"/>
<g id="bats"></g>
<g id="house"><use id="hs" href="#hs0" x="300" y="${FEET - 570}" width="720" height="600"/></g>
<g id="host"></g><g id="nood"></g><g id="bucket"></g><g id="treat"></g>
<use href="#jack" x="960" y="${FEET + 60}" width="140" height="140"/><use href="#jack" x="-40" y="${FEET + 120}" width="130" height="130"/>
<g id="knock"></g><g id="say"></g><g id="label"></g>
<g id="hook" opacity="0"><g transform="rotate(-2 540 300)"><rect x="110" y="170" width="860" height="330" rx="36" fill="#FFF8EC" stroke="${PEN}" stroke-width="6"/>
${T_(TX.hook[0], 540, 282, TX.hookSize)}${T_(TX.hook[1], 540, 392, TX.hookSize)}${T_(TX.hookSub, 540, 465, RN ? 46 : 52, { w: 600, fill: '#8A7468' })}</g><use href="#jack" x="880" y="130" width="130" height="130"/></g>
<g id="end" opacity="0"><rect width="${W}" height="${H}" fill="#FFF8EC" opacity=".95"/>
<path d="M200 560 Q540 530 880 560 L872 612 Q540 586 208 612Z" fill="#F28FA5" opacity=".45"/>
${T_('Doodle', 355, 575, 160, { f: 'Caveat', rot: -3 })}${T_('Doggo', 755, 583, 160, { f: 'Caveat', rot: 2 })}
${T_(TX.sub, 540, 690, RN ? 56 : 64, { w: 600, fill: '#8A7468' })}
<g id="endDogs"></g>
${T_(TX.line, 540, 1250, TX.lineSize, { rot: -1.5 })}
<rect x="175" y="1330" width="730" height="104" rx="52" fill="#FFE3A1" stroke="${PEN}" stroke-width="5" transform="rotate(-2 540 1382)"/>
${T_(TX.pill, 540, 1402, TX.pillSize, { rot: -2 })}
${T_(TX.market, 540, 1530, RN ? 52 : 54, { w: 600, fill: '#E8863A' })}</g>
</svg>
<script>
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+'_0'); $('nood').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// a dog with its feet at (cx, feet), height hh, this frame's drawing sv, tilted rot about its feet, lifted dy, scaled sc about its feet
function dog(id, cx, feet, hh, sv, rot, dy, sc){ const b=box(id), s=hh/b[3], w=b[2]*s; sc=sc==null?1:sc;
  return '<ellipse cx="'+cx+'" cy="'+(feet-2)+'" rx="'+(w*0.32*sc)+'" ry="12" fill="${PEN}" opacity=".16"/>'
   +'<g transform="translate(0 '+dy+') rotate('+rot+' '+cx+' '+feet+') translate('+cx+' '+feet+') scale('+sc+') translate('+(-cx)+' '+(-feet)+')"><g transform="translate('+(cx-w/2)+' '+(feet-hh)+') scale('+s+') translate('+(-b[0])+' '+(-b[1])+')">'+sv+'</g></g>'; }
const ease=(x)=>x<0?0:x>1?1:1-Math.pow(1-x,3), back=(x)=>{ x=Math.max(0,Math.min(1,x)); const c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const TX=${JSON.stringify(TX)}, DOORS=${JSON.stringify(DOORS.map((d) => ({ treat: d.treat, label: RN ? ZH[d.costume] : d.costume })))}, FAM=${JSON.stringify(fam)};
const txt=(s,x,y,size,o)=>{ o=o||{}; return '<text x="'+x+'" y="'+y+'" font-family="'+(o.f||FAM)+'" font-weight="700" font-size="'+size+'" fill="'+(o.fill||'${PEN}')+'" text-anchor="'+(o.a||'middle')+'"'+(o.rot?' transform="rotate('+o.rot+' '+x+' '+y+')"':'')+'>'+s+'</text>'; };
window.frame=function(t, D){
  const ST=${JSON.stringify(STARTS)}, KK=${JSON.stringify(K)}; let i=0; while(i<${NS - 1}&&t>=ST[i+1]) i++; const lt=(t-ST[i])*KK[i], last=i===${NS - 1}, ending=t>=${END};
  $('bg').setAttribute('href','#sc'+i); $('hs').setAttribute('href','#hs'+i);
  // the knocks: two raps at 0.8 s and 0.98 s, the kennel jolts a little each time
  const rap=Math.max(lt>=0.8?Math.exp(-(lt-0.8)*14):0, lt>=0.98?Math.exp(-(lt-0.98)*14):0);
  $('house').setAttribute('transform','rotate('+(Math.sin(lt*90)*1.4*rap)+' 660 ${FEET})');
  $('knock').innerHTML = lt>=0.78&&lt<1.25 ? '<g opacity="'+Math.min(1,(1.25-lt)*6)+'">'+txt(TX.knock, 830, ${FEET - 640}, 76, {rot:8})+'<path d="M790 ${FEET - 330} l-30 -14 M790 ${FEET - 300} l-34 4 M795 ${FEET - 270} l-28 18" stroke="${PEN}" stroke-width="6" stroke-linecap="round" opacity="'+rap+'"/></g>' : '';
  // Noodle walks in (0-0.7 s), then begs; at the last door he runs off when the dinosaur pops out
  let nd='', nx=220;
  if(lt<0.7){ nx=-190+410*ease(lt/0.7); nd=dog('nwalk', nx, ${FEET + 40}, 300, D.n, 0, -Math.abs(Math.sin(lt*14))*8); }
  else if(last && lt>=1.35){ const r=(lt-1.35)/0.55; nx=220-620*r; nd=dog('nrun', nx, ${FEET + 40}, 310, D.n, -8, -Math.sin(Math.min(1,r)*Math.PI)*170); }
  else nd=dog('nbeg', nx, ${FEET + 40}, 470, D.n, Math.sin(lt*7)*2.5, 0);
  $('nood').innerHTML=nd;
  // the pumpkin bucket stays by the door, with every treat so far on top
  const got=DOORS.slice(0,i).filter(d=>d.treat).map(d=>d.treat).concat(DOORS[i].treat&&lt>=1.95?[DOORS[i].treat]:[]);
  const bx=lt<0.7?nx+170:390;
  $('bucket').innerHTML='<use href="#jack" x="'+(bx-85)+'" y="${FEET - 130}" width="170" height="170"/>'+got.map((k,j)=>'<use href="#t_'+k+'" transform="translate('+(bx-36+j*36)+' ${FEET - 122}) rotate('+(-25+j*25)+') scale(1.25)"/>').join('');
  // the door opens: the host pops out of the doorway (a quick overshoot), barks, and tosses the treat into the bucket
  const pop=lt>=1.1?back((lt-1.1)/0.28):0;
  $('host').innerHTML = pop>0 ? dog('h'+i, 690, ${FEET + 30}, last?460:430, D.h, Math.sin(lt*6)*2, 0, 0.25+0.75*pop) : '';
  let tr=''; if(DOORS[i].treat && lt>=1.5 && lt<1.95){ const r=(lt-1.5)/0.45, x=620+(bx-620)*r, y=${FEET - 360}-Math.sin(r*Math.PI)*240+r*240; tr='<use href="#t_'+DOORS[i].treat+'" transform="translate('+x+' '+y+') rotate('+(r*540)+') scale(1.6)"/>'; }
  $('treat').innerHTML=tr;
  // speech: Noodle asks at every door; at the last one he runs and leaves the treats behind
  let say=''; const bub=(x,y,w,s,size)=>'<g><rect x="'+(x-w/2)+'" y="'+(y-62)+'" width="'+w+'" height="92" rx="40" fill="#FFF8EC" stroke="${PEN}" stroke-width="5"/><path d="M'+(x-40)+' '+(y+28)+' L'+(x-70)+' '+(y+70)+' L'+(x-6)+' '+(y+30)+'" fill="#FFF8EC" stroke="${PEN}" stroke-width="5" stroke-linejoin="round"/>'+txt(s,x,y+4,size)+'</g>';
  if(lt>=0.75 && lt<(last?1.35:2.45) && !ending) say=bub(290, ${FEET - 600}, 540, TX.ask, TX.askSize);
  if(last && lt>=1.6 && !ending) say='<g transform="rotate(-3 540 640)"><rect x="160" y="575" width="760" height="110" rx="34" fill="#FFF8EC" stroke="${PEN}" stroke-width="5"/>'+txt(TX.run, 540, 652, 66)+'</g>';
  $('say').innerHTML=say;
  // the costume's name on a sticker while the host is out
  $('label').innerHTML = pop>0 && !ending ? '<g transform="rotate(-2 540 1790)" opacity="'+Math.min(1,(lt-1.1)*5)+'"><rect x="140" y="1700" width="800" height="150" rx="34" fill="#FFF8EC" stroke="${PEN}" stroke-width="5"/>'+txt(TX.newc,540,1752,${RN ? 38 : 42},{fill:'#E8863A'})+txt(DOORS[i].label,540,1820,TX.labelSize)+'</g>' : '';
  // three crayon bats flapping across the sky
  let bt=''; [[170,560,1.2,0],[900,620,1.0,1.7],[640,520,0.8,3.1]].forEach(([x,y,sc,o])=>{ const fl=0.55+0.45*Math.abs(Math.sin(t*9+o)), dx=Math.sin(t*0.9+o)*40, dy=Math.cos(t*1.3+o)*14;
    bt+='<g transform="translate('+(x+dx)+' '+(y+dy)+') scale('+(sc*2.4)+' '+(sc*2.4*fl)+')"><path d="M0 -4 Q-6 -14 -20 -10 Q-14 -4 -16 4 Q-8 -2 -4 6 Q0 2 4 6 Q8 -2 16 4 Q14 -4 20 -10 Q6 -14 0 -4Z" fill="#6B5A86" stroke="${PEN}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="-2" cy="-3" r="0.9" fill="#FFF8EC"/><circle cx="2" cy="-3" r="0.9" fill="#FFF8EC"/></g>'; });
  $('bats').innerHTML=bt;
  $('hook').setAttribute('opacity', ending ? 0 : Math.min(1,t/0.2));
  const eo = ending ? Math.min(1,(t-${END})/0.3) : 0; $('end').setAttribute('opacity', eo);
  // the ending page: Noodle and Butter (still a dinosaur) side by side with room between them, friends again (no bucket, not too close: owner, 30 Oct 2026)
  $('endDogs').innerHTML = eo>0 ? dog('en', 270, 1130, 230, D.en, Math.sin(t*5)*3, -Math.abs(Math.sin(t*5))*10) + dog('eb', 840, 1130, 290, D.eb, Math.sin(t*5+1)*3, -Math.abs(Math.sin(t*5+1))*8) : '';
};
</script>`;

// the drawings for one video frame: every pose moves on continuously, so each of the 30 frames a second is its own in-between
const drawFor = (t) => { let i = 0; while (i < NS - 1 && t >= STARTS[i + 1]) i++; const lt = (t - STARTS[i]) * K[i], last = i === NS - 1;
  const n = lt < 0.7 ? dogSvg('nwalk', lt * 7) : last && lt >= 1.35 ? dogSvg('nrun', (lt - 1.35) * 4) : dogSvg('nbeg', lt * 1.6);
  return { n, h: lt >= 1.1 ? dogSvg('h' + i, lt * 2) : '', en: t >= END ? dogSvg('en', t * 2) : '', eb: t >= END ? dogSvg('eb', t * 2 + 1) : '' }; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  const still = process.env.ONLY === 'stills';
  const list = still ? [0.3, 0.6, 0.9, 1.2, 2.5, 4.2, 5.2, 6.1, 6.4, 6.9, 7.3, 8.8].map((s) => Math.round(s * FPS)) : [...Array(N).keys()];
  for (const f of list) { await p.evaluate(([t, D]) => window.frame(t, D), [f / FPS, drawFor(f / FPS)]); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(list.length, 'frames');
  // the cover: the first door just after it opens (hook on top, the costume sticker at the bottom)
  await p.evaluate(([t, D]) => window.frame(t, D), [1.75 / K[0], drawFor(1.75 / K[0])]); await p.screenshot({ path: path.join(WORK, `trick-cover${SUF}.png`) }); await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, `trick-cover${SUF}.png`), '-q:v', '2', path.join(WORK, `trick-cover${SUF}.jpg`)]);
  if (still) return;

  // sound: the Halloween lo-fi beat, a sparkle on the ending page, two knocks per door, each host's own puppy bark when the door
  // opens, a startled yip from Noodle at the dinosaur, and a happy pair of barks on the ending page
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ content: spookySource(ROOT) });   // the Halloween lo-fi mood (../spooky_lofi.js)
  const wav = await ap.evaluate(async ([s, end]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'spooky', time: 'day', weather: 'sunny' } }], stingers: [{ at: end, name: 'sparkle' }] })).wav, [T * TEMPO + 1, END * TEMPO]);
  fs.writeFileSync(path.join(WORK, 'music_slow.wav'), Buffer.from(wav, 'base64'));
  const barkWav = async (breed, kind) => (await ap.evaluate(async ([b, k]) => (await window.PawAudio._renderBarks({ breeds: [b], kinds: [k], age: 'puppy', wav: true, sampleRate: 44100 })).wav, [breed, kind]));
  const BK = [['b0', 'corgi', 'play'], ['b1', 'husky', 'play'], ['b2', 'pug', 'yip'], ['b3', 'lab', 'alert'], ['bn', 'dachs', 'yip'], ['bn2', 'dachs', 'play']];
  for (const [n, br, k] of BK) fs.writeFileSync(path.join(WORK, n + '.wav'), Buffer.from(await barkWav(br, k), 'base64'));
  await ab.close();
  // a knock: a soft wooden thump
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*150*t)*exp(-t*38)+0.35*sin(2*PI*330*t)*exp(-t*70)':s=44100:d=0.3", path.join(WORK, 'knock.wav')]);
  const EV = []; for (let i = 0; i < NS; i++) { EV.push(['knock', STARTS[i] + 0.8 / K[i]], ['knock', STARTS[i] + 0.98 / K[i]], ['b' + i, STARTS[i] + 1.15 / K[i]]); }
  EV.push(['bn', STARTS[3] + 1.4], ['bn2', END + 0.1], ['b3', END + 0.45]);
  const inputs = [], chains = [];
  EV.forEach(([n, at], i) => { inputs.push('-i', path.join(WORK, n + '.wav')); const lead = n === 'knock' ? 0 : 0.2, d = Math.max(0, Math.round((at - lead) * 1000));
    chains.push(`[${i + 2}:a]atrim=0:1.2,${n === 'knock' ? 'volume=1.6' : 'highpass=f=280,volume=1.8'},adelay=${d}|${d}[k${i}]`); });
  const mix = `[1:a]atempo=${TEMPO.toFixed(5)},atrim=0:${T},afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${EV.map((_, i) => `[k${i}]`).join('')}amix=inputs=${EV.length + 1}:normalize=0,alimiter=limit=0.89:level=false,atrim=0:${T}[a]`;
  const out = path.join(WORK, `doodle-doggo-trick-or-treat${SUF}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music_slow.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
