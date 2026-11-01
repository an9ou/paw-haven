// "2 chocolate dogs had puppies. you won't guess the colours" (owner go-ahead 1 Nov 2026; idea 2 of the new Reel list).
// Owner, 1 Nov 2026: no black (or white) dogs as the subject, the community may be sensitive. So: two Chocolate Labradors in the yard, both
// carrying dilute and red (b/b, D/d, E/e). The viewer pauses and guesses; three puppies pop in: Yellow, Silver, Champagne, and not one is chocolate.
// The coat names, the odds and the puppy colours are the game's own (mods/genes.js: phenotype and predict; zh-Hans names data.words.lab.*), the
// "carries" words are the game's gene lines (mod.genes.line_d_carry / line_e_carry), the art is the game's (PawArt.scene / PawArt.dog).
// 1080 x 1920, 30 fps, the game's own cozy music (mods/pawaudio.js, the yard by day), the "adopt" sting at the reveal and a puppy bark per puppy.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/pups_reel/build_pups.js <workdir>
//   ONLY=stills renders key frames and the cover only. REDNOTE=1: everything in Simplified Chinese, no game link anywhere.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS } = require('../centre_text.js'); // owner's rule: text in every box sits in its exact centre
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'pups_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const RN = !!process.env.REDNOTE, SUF = RN ? '-rednote' : '';
const fam = RN ? "'LXGW WenKai', Caveat" : 'Caveat';
const FPS = 30, W = 1080, H = 1920;

// ---- the real art, poses gliding between the game's drawings (the same patch as freestyle_reel/build_dance.js, this copy only) ----
const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
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
vm.runInContext(fs.readFileSync(path.join(ROOT, 'mods', 'genes.js'), 'utf8'), ctx);
const PA = win.PawArt, G = win.PawGenes, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

// ---- the words ----
const I18N = JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'i18n', RN ? 'zh-Hans.json' : 'en.json'), 'utf8'));
const t = (k) => { const v = I18N[k]; if (!v) throw new Error('missing text ' + k); return v; };

// ---- the genes: both parents chocolate, carrying dilute (silver) and red (yellow); the puppies are three real outcomes of the pair ----
const PARENT = { B: ['b', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'], M: ['m', 'm'], Bl: ['bl', 'bl'] };
const PUPS = [
  { g: Object.assign({}, PARENT, { D: ['D', 'd'], E: ['e', 'e'] }), seed: 11 },
  { g: Object.assign({}, PARENT, { D: ['d', 'd'], E: ['E', 'e'] }), seed: 23 },
  { g: Object.assign({}, PARENT, { D: ['d', 'd'], E: ['e', 'e'] }), seed: 37 },
];
const par = G.phenotype(PARENT, 'lab', 5);
if (par.coatName !== 'Chocolate') throw new Error('genes changed: parent is ' + par.coatName);
const odds = {}; G.predict(PARENT, PARENT, 'lab', 'lab', { byCoat: true }).forEach((r) => { odds[r.coat] = r; });
PUPS.forEach((p) => { const ph = G.phenotype(p.g, 'lab', p.seed); p.coat = ph.coat; p.name = ph.coatName; if (!odds[p.name]) throw new Error('not a real outcome: ' + p.name); p.odds = odds[p.name].pct; p.oddsEn = odds[p.name].odds; });
if (Object.keys(odds).some((c) => /black|white/i.test(c))) throw new Error('a black or white coat in this pair');
if (PUPS.map((p) => p.name).join() !== 'Yellow,Silver,Champagne') throw new Error('genes changed: ' + PUPS.map((p) => p.name));
// coat names and odds as the game shows them (the lab's coat names in data.coat_names_lab or its own table; the odds words mod.genes.odds_*)
const COATZH = { Chocolate: t('data.words.lab.liver'), Yellow: t('data.starter_genes.lab.coat'), Silver: t('data.words.lab.lilac'), Champagne: t('data.words.lab.cream') };
const coatWord = (n) => (RN ? COATZH[n] : n);
const oddsWord = (pct) => { const n = Math.round(100 / pct), exact = Math.abs(100 / n - pct) < 0.01;
  return RN ? (exact ? `${n}分之一` : `大约${n}分之一`) : (exact ? `1 in ${n}` : `about 1 in ${n}`); };

const TX = RN ? { hook: ['两只巧克力色狗狗生了小狗，', '你猜不到是什么颜色'], hookSize: 76, mum: '妈妈', dad: '爸爸', parentCoat: '巧克力色',
  carries: '都携带黄色和淡化（更浅的毛色）', pause: '先暂停，猜一猜', pauseSub: '会有几种颜色？', reveal: '一只巧克力色都没有！',
  why: ['两只都是巧克力色，', '但都藏着黄色和淡化的基因'], whySub: '这个游戏里，小狗的毛色按真实的遗传规律',
  ask: '你猜对几只？', sub: '免费的治愈系狗狗游戏，毛色遗传是真的', pill: '搜索 Doodle Doggo 就能玩', s: 0.92 }
  : { hook: ['2 chocolate dogs had puppies.', "you won't guess the colours"], hookSize: 76, mum: 'mum', dad: 'dad', parentCoat: 'Chocolate',
  carries: 'both carry yellow & dilute (paler) genes', pause: 'pause and guess', pauseSub: 'how many colours?', reveal: 'not one chocolate!',
  why: ['both parents are chocolate,', 'but both hide yellow and dilute genes'], whySub: 'in this game, puppies get real coat genes',
  ask: 'did you guess all 3?', sub: 'a free cozy dog game with real coat genetics', pill: 'play free at doodledoggo.app', s: 1 };

// ---- timeline ----
const HOOK = 2.8, PAUSE = HOOK, REVEAL = PAUSE + 3.3, STEP = 1.35, WHY = REVEAL + STEP * 3 + 0.7, END = WHY + 2.8, T = END + 3.6, N = Math.round(T * FPS);
const PUPAT = PUPS.map((_, i) => REVEAL + i * STEP);

// ---- art ----
const lab = (o) => inner(PA.dog('lab', Object.assign({ anim: false, coat: par.coat, seed: 5 }, o)));
const pup = (i, o) => inner(PA.dog('lab', Object.assign({ anim: false, coat: Object.assign({}, PUPS[i].coat, { look: { age: 'puppy' } }), age: 'puppy', seed: PUPS[i].seed }, o)));
const LOOK = {
  mum: (pose, kf) => lab({ pose, facing: 'right', kf }), dad: (pose, kf) => lab({ pose, facing: 'left', kf, seed: 9 }),
  p0: (pose, kf) => pup(0, { pose, facing: 'right', kf }), p1: (pose, kf) => pup(1, { pose, facing: 'right', kf }), p2: (pose, kf) => pup(2, { pose, facing: 'left', kf }),
};
const kfOf = (x) => ((x % 3) + 3) % 3;
const PEN = '#5B3D32', GREEN = '#4E9A54', PINK = '#F28FA5';
const T_ = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || fam}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || PEN}" text-anchor="${o.a || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
// symbols for measuring each look once (its standing box)
const measure = Object.keys(LOOK).map((id) => `<symbol id="${id}_m" overflow="visible">${LOOK[id](id[0] === 'p' ? 'sit' : 'idle', 0)}</symbol>`).join('');

// the yard by day in autumn, cropped to Fuji, the fence and the lawn; no words in it
const scene = `<symbol id="sc" viewBox="380 0 337.5 600" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', { time: 'day', weather: 'sunny', season: 'autumn', jp: true })).replace(/<text\b[\s\S]*?<\/text>/g, '')}</symbol>`;
const PX = [235, 540, 845], PFEET = 1715, MFEET = 1385;
const endPage = `<rect width="${W}" height="${H}" fill="#FFF8EC"/>
${T_(TX.ask, 540, 300, RN ? 104 : 120, { rot: -2 })}<path d="M200 340 Q540 318 880 340" fill="none" stroke="${PINK}" stroke-width="14" stroke-linecap="round" opacity=".6"/>
<g id="endBoxes"></g>
${T_('Doodle', 400, 1540, 120, { f: 'Caveat', rot: -3 })}${T_('Doggo', 690, 1546, 120, { f: 'Caveat', rot: 2 })}
${T_(TX.sub, 540, 1640, RN ? 42 : 48, { w: 600, fill: '#8A7468' })}`;

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">${RN ? '<link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css" rel="stylesheet">' : ''}<style>html,body{margin:0;background:#fff}svg{display:block}
[class$="-hl"]{display:none}
.pa-dog *{animation:none!important}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${scene}${measure}</defs>
<use href="#sc" x="0" y="0" width="${W}" height="${H}"/>
<g id="par"></g><g id="tags"></g><g id="qs"></g><g id="pups"></g><g id="card"></g>
<g id="hook"></g>
<g id="end" opacity="0">${endPage}<g id="endPups"></g></g>
</svg>
<script>
${CENTRE_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+'_m'); $('par').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// a dog by its measured standing box: centre x, feet y, height of that box on screen; the pose's own drawing keeps the same scale
function dog(id, cx, feet, hh, sv, dy, sc){ const b=box(id), s=hh/b[3]*(sc==null?1:sc), w=b[2]*s, top=feet-b[3]*s;
  return '<ellipse cx="'+cx+'" cy="'+(feet-2)+'" rx="'+(w*0.34)+'" ry="'+(10*s/0.9+4)+'" fill="${PEN}" opacity=".16"/><g transform="translate(0 '+(dy||0)+')"><g transform="translate('+(cx-w/2)+' '+top+') scale('+s+') translate('+(-b[0])+' '+(-b[1])+')">'+sv+'</g></g>'; }
const back=(x)=>{ x=Math.max(0,Math.min(1,x)); const c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const ease=(x)=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
const P=${JSON.stringify(PUPS.map((p) => ({ name: p.name, word: coatWord(p.name), odds: RN ? oddsWord(p.odds) : p.oddsEn })))}, TX=${JSON.stringify(TX)}, FAM=${JSON.stringify(fam)}, PX=${JSON.stringify(PX)}, AT=${JSON.stringify(PUPAT)};
const C=(lines,cx,cy)=>centred(lines,cx,cy,FAM);
const card=(x,y,w,h,stroke,sw,lines,extra)=>{ const r=C(lines,x+w/2,y+h/2); return {svg:'<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="36" fill="#FFF8EC" stroke="'+stroke+'" stroke-width="'+sw+'"/>'+r.svg+(extra?extra(r.ys):'')+'</g>', ys:r.ys}; };
const bubble=(r,fill,sw,s,size)=>'<g data-box><circle r="'+r+'" fill="'+fill+'" stroke="${PEN}" stroke-width="'+sw+'"/>'+C([{s,size}],0,0).svg+'</g>';
let STATIC=null; function statics(){ if(STATIC) return; STATIC=1;
  $('hook').innerHTML='<g transform="rotate(-2 540 335)">'+card(80,200,920,270,'${PEN}',6,[{s:TX.hook[0],size:TX.hookSize,pitch:TX.hookSize*1.4},{s:TX.hook[1],size:TX.hookSize}]).svg+'</g>';
  $('endBoxes').innerHTML=P.map((pp,i)=>'<g data-box><rect x="'+(PX[i]-140)+'" y="1250" width="280" height="84" rx="42" fill="#FFFDF7" stroke="${PEN}" stroke-width="4"/>'+C([{s:pp.word,size:${RN ? 48 : 56}}],PX[i],1292).svg+'</g>').join('')
    +'<g data-box><rect x="205" y="1690" width="670" height="84" rx="42" fill="#FFE3A1" stroke="${PEN}" stroke-width="4"/>'+C([{s:TX.pill,size:${RN ? 48 : 56}}],540,1732).svg+'</g>'; }
window.frame=function(t, D){
  statics();
  const ending=t>=${END};
  $('end').setAttribute('opacity', ending?Math.min(1,(t-${END})/0.3):0);
  $('hook').setAttribute('opacity', t<${HOOK}?1:Math.max(0,1-(t-${HOOK})/0.2));
  // the parents: side by side on the lawn, happy once the puppies arrive
  const hop=(k)=>t>=${REVEAL}?-Math.abs(Math.sin(t*5+k))*10:0;
  $('par').innerHTML = dog('mum', 255, ${MFEET}, 255, D.mum, hop(0)) + dog('dad', 825, ${MFEET}, 255, D.dad, hop(1.3));
  // name tags under the parents: both Chocolate, both carry yellow and dilute
  const tg=ease((t-0.6)/0.3); let g='';
  if(!ending && tg>0){ g+=pill(TX.mum+': '+TX.parentCoat, 255, ${MFEET + 52}, ${RN ? 44 : 50}, FAM, {op:tg})+pill(TX.dad+': '+TX.parentCoat, 825, ${MFEET + 52}, ${RN ? 44 : 50}, FAM, {op:tg});
    const cg=ease((t-1.3)/0.3); if(cg>0) g+=pill(TX.carries, 540, ${MFEET + 127}, ${RN ? 42 : 48}, FAM, {fill:'#FFE3A1', op:cg}); }
  if(t>=${REVEAL}) g=g.replace(/opacity="[0-9.]+"/g, (m)=>'opacity="'+Math.max(0,1-(t-${REVEAL})/0.3)*parseFloat(m.slice(9,-1))+'"');
  $('tags').innerHTML=g;
  // the pause: three question marks where the puppies will sit, and a 3-2-1 count
  let q=''; if(t>=${PAUSE} && !ending){ PX.forEach((x,i)=>{ if(t>=AT[i]) return; const pq=back((t-${PAUSE}-i*0.12)/0.3), wob=Math.sin(t*6+i)*4;
      q+='<g transform="translate('+x+' '+(${PFEET}-80+wob)+') scale('+pq+')">'+bubble(78,'#FFFDF7',6,'?',120)+'</g>'; }); }
  $('qs').innerHTML=q;
  // the puppies pop in one by one with their coat name and the game's odds
  let p=''; P.forEach((pp,i)=>{ if(t<AT[i]) return; const lt=t-AT[i], s=back(lt/0.35), dy=-Math.abs(Math.sin(t*6+i*1.7))*(lt>0.4?14:0);
    p+= ending ? '' : dog('p'+i, PX[i], ${PFEET}, 185, D['p'+i], dy, Math.max(0.01,s));
    const tl=ease((lt-0.25)/0.25); if(!ending && tl>0){ const w=Math.max(inkOf(pp.word, ${RN ? 46 : 54}, FAM).L+inkOf(pp.word, ${RN ? 46 : 54}, FAM).R, inkOf(pp.odds, ${RN ? 32 : 38}, FAM).L+inkOf(pp.odds, ${RN ? 32 : 38}, FAM).R)+56; p+='<g opacity="'+tl+'"><g data-box><rect x="'+(PX[i]-w/2)+'" y="${PFEET + 22}" width="'+w+'" height="122" rx="30" fill="#FFFDF7" stroke="${PEN}" stroke-width="4"/>'+C([{s:pp.word,size:${RN ? 46 : 54},pitch:${RN ? 48 : 50}},{s:pp.odds,size:${RN ? 32 : 38},fill:'#8A7468'}], PX[i], ${PFEET + 83}).svg+'</g></g>'; } });
  $('pups').innerHTML=p;
  // the card in the sky: pause, then the reveal line, then why
  let c=''; if(!ending && t>=${PAUSE}+0.1){ let l1, l2, col='${PEN}', o;
    if(t<${REVEAL}){ l1=TX.pause; l2=TX.pauseSub; o=ease((t-${PAUSE}-0.1)/0.2); const n=3-Math.floor((t-${PAUSE}-0.3)/1);
      c+='<g opacity="'+o+'" transform="rotate(-2 540 360)">'+card(140,210,800,300,'${PEN}',6,[{s:l1,size:${RN ? 84 : 96},pitch:${RN ? 100 : 104}},{s:l2,size:${RN ? 58 : 66}}]).svg+'</g>';
      if(t>=${PAUSE}+0.3 && n>=1 && n<=3){ const lt=(t-${PAUSE}-0.3)%1, ns=back(lt/0.25); c+='<g transform="translate(540 760) scale('+ns+')" opacity="'+(1-ease((lt-0.7)/0.3))+'">'+bubble(110,'#FFE3A1',7,String(n),170)+'</g>'; } }
    else if(t<${WHY}){ o=ease((t-AT[2]-0.4)/0.25); if(o>0) c+='<g opacity="'+o+'" transform="rotate(-2 540 350)">'+card(140,250,800,200,'${GREEN}',7,[{s:TX.reveal,size:${RN ? 80 : 96}}]).svg+'</g>'; }
    else { o=ease((t-${WHY})/0.25); c+='<g opacity="'+o+'" transform="rotate(-1 540 395)">'+card(70,200,940,390,'${PEN}',6,[{s:TX.why[0],size:${RN ? 64 : 76},pitch:90},{s:TX.why[1],size:${RN ? 56 : 64},pitch:128},{s:TX.whySub,size:${RN ? 44 : 52},fill:'#8A7468'}],
      (ys)=>{ const u=ys[1]+(ys[2]-ys[1])*0.42; return '<path d="M220 '+(u+8)+' Q540 '+(u-8)+' 860 '+(u+8)+'" fill="none" stroke="${PINK}" stroke-width="10" stroke-linecap="round" opacity=".6"/>'; }).svg+'</g>'; } }
  $('card').innerHTML=c;
  $('endPups').innerHTML = ending ? P.map((pp,i)=>dog('p'+i, PX[i], 1200, 250, D['p'+i], -Math.abs(Math.sin(t*6+i*1.7))*16)).join('') : '';
};
</script>`;

const drawFor = (t) => { const k = kfOf(t * 1.8), pupPose = (i) => (t >= PUPAT[i] + 0.4 ? 'happy' : 'sit');
  return { mum: LOOK.mum(t >= REVEAL ? 'happy' : 'idle', k), dad: LOOK.dad(t >= REVEAL ? 'happy' : 'idle', kfOf(t * 1.8 + 1)),
    p0: LOOK.p0(t >= END ? 'happy' : pupPose(0), k), p1: LOOK.p1(t >= END ? 'happy' : pupPose(1), kfOf(t * 1.8 + 0.7)), p2: LOOK.p2(t >= END ? 'happy' : pupPose(2), kfOf(t * 1.8 + 1.4)) }; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  const still = process.env.ONLY === 'stills';
  const list = still ? [0.3, 1.0, 2.0, 3.5, 4.6, 6.4, 7.6, 9.0, 10.6, 11.5, 13.0, 14.5, 16.5].map((s) => Math.round(s * FPS)) : [...Array(N).keys()];
  for (const f of list) { await p.evaluate(([t, D]) => window.frame(t, D), [f / FPS, drawFor(f / FPS)]);
    const off = await p.evaluate(() => centreCheck(document.querySelector('svg'))); if (off.length) throw new Error('text not centred at frame ' + f + ': ' + off.join('; ')); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(list.length, 'frames, T =', T.toFixed(2));
  // the cover: the hook over the two chocolate parents, their tags up
  const CT = 1.15; await p.evaluate(([t, D]) => window.frame(t, D), [CT, drawFor(CT)]); await p.screenshot({ path: path.join(WORK, `pups-cover${SUF}.png`) }); await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, `pups-cover${SUF}.png`), '-q:v', '2', path.join(WORK, `pups-cover${SUF}.jpg`)]);
  if (still) return;

  // sound: the game's own music (the yard by day), the "adopt" sting as the first puppy arrives, a sparkle on the end page, a puppy bark per puppy
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const stingers = [{ at: REVEAL - 0.05, name: 'adopt' }, { at: END + 0.1, name: 'discover' }];
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.7, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, stingers]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  fs.writeFileSync(path.join(WORK, 'yip.wav'), Buffer.from(await ap.evaluate(async () => (await window.PawAudio._renderBarks({ breeds: ['lab'], kinds: ['play'], age: 'puppy', wav: true, sampleRate: 44100 })).wav), 'base64'));
  await ab.close();
  // the count: a soft tick on 3, 2, 1
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.5*sin(2*PI*880*t)*exp(-t*30)':s=44100:d=0.25", path.join(WORK, 'tick.wav')]);
  const EV = [0, 1, 2].map((i) => ['tick', PAUSE + 0.3 + i]).concat(PUPAT.map((a) => ['yip', a + 0.05]));
  const inputs = [], chains = [];
  EV.forEach(([n, at], i) => { inputs.push('-i', path.join(WORK, n + '.wav')); const d = Math.max(0, Math.round(at * 1000));
    chains.push(`[${i + 2}:a]atrim=0:1.2,${n === 'yip' ? 'highpass=f=280,volume=1.6' : 'volume=1.0'},adelay=${d}|${d}[k${i}]`); });
  const mix = `[1:a]atrim=0:${T},afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${EV.map((_, i) => `[k${i}]`).join('')}amix=inputs=${EV.length + 1}:normalize=0,alimiter=limit=0.89:level=false,atrim=0:${T}[a]`;
  const out = path.join(WORK, `doodle-doggo-puppy-colours${SUF}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
