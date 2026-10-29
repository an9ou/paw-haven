// "Is this safe for my dog?" (owner, 30 Oct 2026; idea 10 of the Reel ideas): a save-worthy food-safety Reel.
// Noodle begs in the game's kitchen. Three people foods land on his plate (grapes, chocolate, sugar-free gum): each gets the game's own
// paw-stop sign and the game's own two-line lesson (people_food.*.why), then the game's own safe swap (people_food.*.swap) arrives and Noodle
// is delighted. It ends on a "save this" page listing what dogs must never eat and the safe swaps, "ate something? call your vet", and the logo.
// Every word about food is the game's reviewed text (game/i18n/en.json and zh-Hans.json); the art is the game's (PawArt.scene/item/icon/dog).
// 15 s, 1080 x 1920, 30 fps, the game's calm "home" music, a soft bonk on each stop sign, a sparkle and a happy bark on each swap.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/safe_reel/build_safe.js <workdir>
//   ONLY=stills renders key frames and the cover only. REDNOTE=1: everything in Simplified Chinese, no game link anywhere.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'safe_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const RN = !!process.env.REDNOTE, SUF = RN ? '-rednote' : '';
const fam = RN ? "'LXGW WenKai', Caveat" : 'Caveat';
const R0 = 0.3, ROUND = 3.6, NR = 3, END = R0 + ROUND * NR, T = END + 4.0, FPS = 30, N = Math.round(T * FPS), W = 1080, H = 1920, FEET = 1600;

// ---- the real art, poses gliding between the game's drawings (the same patch as freestyle_reel/build_dance.js, this copy only) ----
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

// ---- the words: the game's own food names, lessons and swaps ----
const I18N = JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'i18n', RN ? 'zh-Hans.json' : 'en.json'), 'utf8'));
const t = (k) => { const v = I18N[k]; if (!v) throw new Error('missing text ' + k); return v; };
const ROUNDS = [
  { id: 'grapes', item: 'Grapes', swapItem: 'Blueberries', swapName: t('data.crops.blueberries.name') },
  { id: 'chocolate', item: 'Chocolate', swapItem: 'Carrot Crunchies', swapName: t('data.recipes.carrot_crunchies.name') },
  { id: 'gum', item: 'Sugar-free Gum', swapItem: 'Pumpkin Pupcake', swapName: t('data.recipes.pumpkin_pupcake.name') },
].map((r) => Object.assign(r, { name: t(`data.people_food.${r.id}.name`), why: t(`data.people_food.${r.id}.why`), swap: t(`data.people_food.${r.id}.swap`) }));
const TX = RN ? { hook: ['这个，', '狗狗能吃吗？'], hookSize: 96, no: '狗狗不能吃', yes: '换成这个', save: '收藏起来，给狗狗备用', never: '狗狗不能吃', ok: '可以吃',
  vet: '不小心吃了？马上联系兽医。', sub: '在这个游戏里，有毒的食物做不出来，也喂不了', pill: '搜索 Doodle Doggo 就能玩', pillSize: 58, why: 46, perLine: 17 }
  : { hook: ['is this safe', 'for my dog?'], hookSize: 100, no: 'not for dogs', yes: 'safe swap', save: 'save this for later', never: 'never for dogs', ok: 'safe swaps',
  vet: 'ate something? call your vet.', sub: 'a free cozy dog game where nothing toxic can be cooked or fed', pill: 'play free at doodledoggo.app', pillSize: 66, why: 54, perLine: 36 };
// the "save this" page: the game's people-pantry names, two per row where the game pairs them (grapes and raisins, onion and garlic)
const pf = (id) => t(`data.people_food.${id}.name`), AND = RN ? '和' : ' & ';
const NEVER = [['Grapes', pf('grapes') + AND + pf('raisins')], ['Chocolate', pf('chocolate')], ['Sugar-free Gum', pf('gum') + (RN ? '（木糖醇）' : ' (xylitol)')],
  ['Onion', pf('onion') + AND + pf('garlic')], ['Macadamia Nuts', pf('macadamia')]];
const OK = [['Blueberries', t('data.crops.blueberries.name')], ['Carrot', t('data.crops.carrot.name')], ['Pumpkin', t('data.crops.pumpkin.name')]];
// wrap a lesson into lines that fit the card (Latin: by words; Chinese: by characters, breaking after punctuation where it can)
function wrap(s, n) {
  if (RN) { const out = []; let cur = ''; for (const ch of s) { cur += ch; if (cur.length >= n || (cur.length >= n - 4 && /[，。、]/.test(ch))) { out.push(cur); cur = ''; } } if (cur) out.push(cur); return out; }
  const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; } if (cur.trim()) out.push(cur.trim()); return out;
}
ROUNDS.forEach((r) => { r.lines = wrap(r.why, TX.perLine); r.swapLines = wrap(r.swap, TX.perLine); });

const itemSym = (name, id) => { const s = PA.item(name), vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<symbol id="${id}" viewBox="${vb}">${inner(s)}</symbol>`; };
const items = ROUNDS.map((r, i) => itemSym(r.item, 'bad' + i) + itemSym(r.swapItem, 'good' + i)).join('') + NEVER.map(([n], i) => itemSym(n, 'nv' + i)).join('') + OK.map(([n], i) => itemSym(n, 'ok' + i)).join('');
const STOP = (() => { const s = PA.icon('paw-stop'), vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<symbol id="stop" viewBox="${vb}">${inner(s)}</symbol>`; })();
const LOOK = { beg: ['dachs', { pose: 'beg', facing: 'right' }], sit: ['dachs', { pose: 'sit', facing: 'right' }], yay: ['dachs', { pose: 'happy', facing: 'right', expr: 'hearts' }] };
const dogSvg = (id, kf) => { const [key, o] = LOOK[id]; return inner(PA.dog(key, Object.assign({ anim: false }, o, { kf: ((kf % 3) + 3) % 3 }))); };
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');
const PEN = '#5B3D32', RED = '#D9534F', GREEN = '#4E9A54';
const T_ = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || fam}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || PEN}" text-anchor="${o.a || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
// the "save this" page
const listRow = (sym, label, x, y, size) => `<use href="#${sym}" x="${x}" y="${y - 50}" width="100" height="100"/>${T_(label, x + 116, y + 14, size, { a: 'start' })}`;
const savePage = `<rect width="${W}" height="${H}" fill="#FFF8EC"/>
${T_(TX.save, 540, 210, RN ? 84 : 100, { rot: -2 })}<path d="M220 240 Q540 222 860 240" fill="none" stroke="#F28FA5" stroke-width="14" stroke-linecap="round" opacity=".6"/>
<rect x="50" y="300" width="980" height="${NEVER.length * 112 + 110}" rx="36" fill="#FFFDF7" stroke="${PEN}" stroke-width="5"/>
<use href="#stop" x="80" y="322" width="70" height="70"/>${T_(TX.never, 168, 374, RN ? 56 : 64, { a: 'start', fill: RED })}
${NEVER.map(([, label], i) => listRow('nv' + i, label, 90, 460 + i * 112, RN ? 50 : 56)).join('')}
<rect x="50" y="${NEVER.length * 112 + 430}" width="980" height="${OK.length * 112 + 110}" rx="36" fill="#FFFDF7" stroke="${PEN}" stroke-width="5"/>
${T_('✓', 112, NEVER.length * 112 + 508, 70, { f: 'sans-serif', fill: GREEN })}${T_(TX.ok, 168, NEVER.length * 112 + 504, RN ? 56 : 64, { a: 'start', fill: GREEN })}
${OK.map(([, label], i) => listRow('ok' + i, label, 90, NEVER.length * 112 + 590 + i * 112, RN ? 50 : 56)).join('')}
<g id="endDog"></g>
${T_(TX.vet, 540, 1530, RN ? 52 : 60, { fill: RED, rot: -1 })}
${T_('Doodle', 400, 1660, 110, { f: 'Caveat', rot: -3 })}${T_('Doggo', 680, 1666, 110, { f: 'Caveat', rot: 2 })}
${T_(TX.sub, 540, 1730, RN ? 38 : 44, { w: 600, fill: '#8A7468' })}
<rect x="215" y="1762" width="650" height="78" rx="39" fill="#FFE3A1" stroke="${PEN}" stroke-width="4"/>${T_(TX.pill, 540, 1816, RN ? 46 : 54)}`;

const scene = `<symbol id="sc" viewBox="662 0 337.5 600" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('house', { time: 'day', weather: 'sunny', season: 'autumn', jp: true }))}</symbol>`;
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">${RN ? '<link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css" rel="stylesheet">' : ''}<style>html,body{margin:0;background:#fff}svg{display:block}
[class$="-hl"]{display:none}
.pa-dog *{animation:none!important}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${scene}${items}${STOP}${dogSyms}</defs>
<use href="#sc" x="0" y="0" width="${W}" height="${H}"/>
<ellipse cx="770" cy="${FEET - 6}" rx="190" ry="34" fill="#FFFDF7" stroke="${PEN}" stroke-width="6"/><ellipse cx="770" cy="${FEET - 12}" rx="130" ry="18" fill="none" stroke="#F28FA5" stroke-width="4" opacity=".6"/>
<g id="nood"></g><g id="food"></g><g id="card"></g>
<g id="hook"><g transform="rotate(-2 540 300)"><rect x="110" y="170" width="860" height="270" rx="36" fill="#FFF8EC" stroke="${PEN}" stroke-width="6"/>
${T_(TX.hook[0], 540, 282, TX.hookSize)}${T_(TX.hook[1], 540, 392, TX.hookSize)}</g></g>
<g id="end" opacity="0">${savePage}</g>
</svg>
<script>
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+'_0'); $('nood').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
function dog(id, cx, feet, hh, sv, rot, dy){ const b=box(id), s=hh/b[3], w=b[2]*s;
  return '<ellipse cx="'+cx+'" cy="'+(feet-2)+'" rx="'+(w*0.32)+'" ry="12" fill="${PEN}" opacity=".16"/><g transform="translate(0 '+dy+') rotate('+rot+' '+cx+' '+feet+')"><g transform="translate('+(cx-w/2)+' '+(feet-hh)+') scale('+s+') translate('+(-b[0])+' '+(-b[1])+')">'+sv+'</g></g>'; }
const back=(x)=>{ x=Math.max(0,Math.min(1,x)); const c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const R=${JSON.stringify(ROUNDS.map((r) => ({ name: r.name, lines: r.lines, swapName: r.swapName, swapLines: r.swapLines })))}, TX=${JSON.stringify(TX)}, FAM=${JSON.stringify(fam)};
const txt=(s,x,y,size,o)=>{ o=o||{}; return '<text x="'+x+'" y="'+y+'" font-family="'+FAM+'" font-weight="700" font-size="'+size+'" fill="'+(o.fill||'${PEN}')+'" text-anchor="'+(o.a||'middle')+'">'+s+'</text>'; };
window.mode=function(t){ const i=Math.max(0,Math.min(${NR - 1},Math.floor((t-${R0})/${ROUND}))), lt=t-${R0}-i*${ROUND}; return {i, lt, pose: t<${R0}||lt<0.62?'beg':lt<2.15?'sit':'yay'}; };
window.frame=function(t, D){
  const m=mode(t), i=m.i, lt=m.lt, ending=t>=${END};
  $('end').setAttribute('opacity', ending?Math.min(1,(t-${END})/0.3):0);
  $('hook').setAttribute('opacity', 1);
  // Noodle: begs while the food arrives, sits politely at the stop sign, is delighted by the swap
  $('nood').innerHTML = dog(m.pose, m.pose==='yay'?320:300, ${FEET + 30}, m.pose==='yay'?310:450, D.n, m.pose==='beg'?Math.sin(t*7)*2.5:0, m.pose==='yay'?-Math.abs(Math.sin(t*9))*16:0);
  let f=''; if(t>=${R0}){
    const bad=lt<2.15, pop=bad?back(lt/0.3):back((lt-2.15)/0.3), out=bad&&lt>1.95?Math.min(1,(lt-1.95)/0.2):0, sz=300*pop;
    f+='<g opacity="'+(1-out)+'"><use href="#'+(bad?'bad':'good')+i+'" x="'+(770-sz/2)+'" y="'+(${FEET - 30}-sz)+'" width="'+sz+'" height="'+sz+'"/></g>';
    if(bad && lt>=0.6){ const st=back((lt-0.6)/0.25), s2=230*(2.2-1.2*st); f+='<g opacity="'+(1-out)+'" transform="rotate('+(-12*st)+' 860 ${FEET - 260})"><use href="#stop" x="'+(860-s2/2)+'" y="'+(${FEET - 260}-s2/2)+'" width="'+s2+'" height="'+s2+'"/></g>'; }
    if(!bad){ const c=back((lt-2.3)/0.25); if(c>0) f+='<g transform="translate(905 ${FEET - 300}) scale('+c+')"><circle r="62" fill="${GREEN}" stroke="${PEN}" stroke-width="6"/><path d="M-28 2 L-8 24 L30 -22" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g>'; }
  }
  $('food').innerHTML=f;
  // the card: the food's name, the game's lesson, then the game's swap
  let c=''; if(t>=${R0}+0.15 && !ending){ const bad=lt<2.15, r=R[i], ls=bad?r.lines:r.swapLines, h=150+ls.length*(TX.why+16), o=Math.min(1,((bad?lt:lt-2.15)-0.1)/0.2);
    c='<g opacity="'+Math.max(0,o)+'" transform="rotate(-1 540 700)"><rect x="70" y="500" width="940" height="'+h+'" rx="34" fill="#FFFDF7" stroke="'+(bad?'${RED}':'${GREEN}')+'" stroke-width="7"/>'
      +txt(bad?r.name:r.swapName, 110, 584, ${RN ? 62 : 72}, {a:'start'})+txt(bad?TX.no:TX.yes, 970, 580, ${RN ? 42 : 48}, {a:'end', fill: bad?'${RED}':'${GREEN}'})
      +ls.map((l,j)=>txt(l, 110, 664+j*(TX.why+16), TX.why, {a:'start'})).join('')+'</g>'; }
  $('card').innerHTML=c;
  $('endDog').innerHTML = ending ? dog('yay', 800, ${NEVER.length * 112 + 430 + OK.length * 112 + 80}, 170, D.n, 0, -Math.abs(Math.sin(t*6))*10) : '';
};
</script>`;

const drawFor = (t) => { const i = Math.max(0, Math.min(NR - 1, Math.floor((t - R0) / ROUND))), lt = t - R0 - i * ROUND;
  const id = t >= END ? 'yay' : t < R0 || lt < 0.62 ? 'beg' : lt < 2.15 ? 'sit' : 'yay'; return { n: dogSvg(id, t * 1.8) }; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  const still = process.env.ONLY === 'stills';
  const list = still ? [0.2, 0.5, 1.2, 2.0, 2.8, 4.8, 6.0, 9.6, 12.5, 14.5].map((s) => Math.round(s * FPS)) : [...Array(N).keys()];
  for (const f of list) { await p.evaluate(([t, D]) => window.frame(t, D), [f / FPS, drawFor(f / FPS)]); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(list.length, 'frames');
  // the cover: grapes on the plate with the stop sign and the lesson
  await p.evaluate(([t, D]) => window.frame(t, D), [R0 + 1.4, drawFor(R0 + 1.4)]); await p.screenshot({ path: path.join(WORK, `safe-cover${SUF}.png`) }); await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, `safe-cover${SUF}.png`), '-q:v', '2', path.join(WORK, `safe-cover${SUF}.jpg`)]);
  if (still) return;

  // sound: the game's calm home music, a soft bonk on each stop sign, the game's "cooked" sting and a happy puppy bark on each swap, a sparkle on the save page
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const stingers = ROUNDS.map((_, i) => ({ at: R0 + i * ROUND + 2.2, name: 'cooked' })).concat([{ at: END + 0.1, name: 'sparkle' }]);
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.75, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'home', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, stingers]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  fs.writeFileSync(path.join(WORK, 'yay.wav'), Buffer.from(await ap.evaluate(async () => (await window.PawAudio._renderBarks({ breeds: ['dachs'], kinds: ['play'], age: 'puppy', wav: true, sampleRate: 44100 })).wav), 'base64'));
  await ab.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.8*sin(2*PI*(220-120*t)*t)*exp(-t*16)':s=44100:d=0.4", path.join(WORK, 'bonk.wav')]);
  const EV = []; ROUNDS.forEach((_, i) => { EV.push(['bonk', R0 + i * ROUND + 0.62], ['yay', R0 + i * ROUND + 2.3]); });
  const inputs = [], chains = [];
  EV.forEach(([n, at], i) => { inputs.push('-i', path.join(WORK, n + '.wav')); const d = Math.max(0, Math.round((at - (n === 'yay' ? 0.2 : 0)) * 1000));
    chains.push(`[${i + 2}:a]atrim=0:1.2,${n === 'yay' ? 'highpass=f=280,volume=1.6' : 'volume=1.3'},adelay=${d}|${d}[k${i}]`); });
  const mix = `[1:a]atrim=0:${T},afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${EV.map((_, i) => `[k${i}]`).join('')}amix=inputs=${EV.length + 1}:normalize=0,atrim=0:${T}[a]`;
  const out = path.join(WORK, `doodle-doggo-is-this-safe${SUF}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
