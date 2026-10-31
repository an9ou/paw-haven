// "3 rules before your dog eats sweet potato" (owner, 31 Oct 2026; from the RedNote plan, docs/marketing/REDNOTE_TRENDS.md: roast sweet potato
// season, a question dog owners search). Noodle in the game's kitchen; three rules, each the game's own reviewed tip (data.food.*.tip):
//   1 never raw: a raw sweet potato gets the paw-stop sign and the Sweet Potato Chews tip, then the Sweet Potato Coins arrive with their tip;
//   2 plain, nothing on it: the Sweet Potato Bones tip (never buttered, no nutmeg or baking spices);
//   3 cut it small: the Sweet Potato Strip tip.
// It ends on a "save this" page: the safe way for sweet potato and pumpkin (the Baked Pumpkin Wedges tip), what never goes on it, and the logo.
// Every food word is the game's text (game/i18n/en.json and zh-Hans.json); the art is the game's (PawArt.scene/item/icon/dog).
// 1080 x 1920, 30 fps, the game's own cozy music (mods/pawaudio.js, the yard by day), a soft bonk on the stop sign, the "cooked" sting and a happy bark on each rule.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/sweet_reel/build_sweet.js <workdir>
//   ONLY=stills renders key frames and the cover only. REDNOTE=1: everything in Simplified Chinese, no game link anywhere.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'sweet_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const RN = !!process.env.REDNOTE, SUF = RN ? '-rednote' : '';
const fam = RN ? "'LXGW WenKai', Caveat" : 'Caveat';
const FPS = 30, W = 1080, H = 1920, FEET = 1600, R0 = 0.3;

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

// ---- the words: the game's own food names and tips ----
const I18N = JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'i18n', RN ? 'zh-Hans.json' : 'en.json'), 'utf8'));
const t = (k) => { const v = I18N[k]; if (!v) throw new Error('missing text ' + k); return v; };
const tip = (id) => t(`data.food.${id}.tip`);
// each rule: an optional "not like this" phase (a food, the stop sign, a lesson), then the "like this" phase (a game recipe, a green tick, its tip)
const ROUNDS = [
  { rule: RN ? '第1条：不吃生的' : 'rule 1: never raw', bad: 'Sweet Potato', why: tip('sweet_potato_chews'), good: 'Sweet Potato Coins', yes: tip('sweet_potato_coins'), BAD: 4.0, LEN: 6.0 },
  { rule: RN ? '第2条：原味，什么都不加' : 'rule 2: plain, nothing on it', good: 'Sweet Potato Bones', yes: tip('sweet_potato_bones'), BAD: 0, LEN: 5.0 },
  { rule: RN ? '第3条：切成小条' : 'rule 3: cut it small', good: 'Sweet Potato Strip', yes: tip('sweet_potato_strip'), BAD: 0, LEN: 4.6 },
];
let at = R0; ROUNDS.forEach((r) => { r.start = at; at += r.LEN; });
const END = at, T = END + 4.5, N = Math.round(T * FPS);
const TX = RN ? { hook: ['狗狗吃红薯前，', '先记住这3条'], hookSize: 92, no: '不要这样', yes: '要这样', save: '收藏起来，给狗狗备用', way: '红薯和南瓜，这样给', never: '这些永远不加',
  neverLine: `生红薯 · 黄油 · 糖 · 肉豆蔻`, sub: '在这个游戏里，有毒的食物做不出来，也喂不了', pill: '搜索 Doodle Doggo 就能玩', why: 46, perLine: 17, rule: 60 }
  : { hook: ['3 rules before your dog', 'eats sweet potato'], hookSize: 84, no: 'not like this', yes: 'like this', save: 'save this for later', way: 'sweet potato & pumpkin, the safe way', never: 'never on it',
  neverLine: 'raw sweet potato · butter · sugar · nutmeg', sub: 'a free cozy dog game where nothing toxic can be cooked or fed', pill: 'play free at doodledoggo.app', why: 52, perLine: 36, rule: 66 };
// the "save this" page: four safe ways, each with the game's own recipe icon, worded from the game's tips
const WAY = RN ? [['Sweet Potato Coins', '一定要煮熟，不吃生的'], ['Sweet Potato Bones', '原味，不抹黄油，不放香料'], ['Sweet Potato Strip', '切成小条，等凉了再吃'], ['Baked Pumpkin Wedges', '南瓜：原味，不用南瓜派馅料']]
  : [['Sweet Potato Coins', 'always cooked, never raw'], ['Sweet Potato Bones', 'plain: no butter, no spice'], ['Sweet Potato Strip', 'cut small, let it cool'], ['Baked Pumpkin Wedges', 'pumpkin: plain, never pie filling']];
function wrap(s, n) {
  // Chinese: by characters, breaking after punctuation where it can; a line never starts with punctuation, and a short leftover joins the line before
  if (RN) { const P = /[，。、：；！？）]/, out = []; let cur = '', chs = [...s];
    chs.forEach((ch, i) => { cur += ch; const nx = chs[i + 1]; if (nx && P.test(nx)) return; if (cur.length >= n || (cur.length >= n - 4 && P.test(ch))) { out.push(cur); cur = ''; } });
    if (cur) { const prev = out[out.length - 1];
      if (prev && cur.length <= 3 && prev.length + cur.length <= n + 2) out[out.length - 1] += cur;
      else if (prev && cur.length <= 3) { const cut = Math.max(...[...'，。、；'].map((p) => prev.lastIndexOf(p, prev.length - 2))) + 1; if (cut > 0) { out[out.length - 1] = prev.slice(0, cut); out.push(prev.slice(cut) + cur); } else out.push(cur); }
      else out.push(cur); } return out; }
  const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; } if (cur.trim()) out.push(cur.trim()); return out;
}
ROUNDS.forEach((r) => { r.whyLines = r.why ? wrap(r.why, TX.perLine) : []; r.yesLines = wrap(r.yes, TX.perLine); });

const itemSym = (name, id) => { const s = PA.item(name), vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<symbol id="${id}" viewBox="${vb}">${inner(s)}</symbol>`; };
const items = ROUNDS.map((r, i) => (r.bad ? itemSym(r.bad, 'bad' + i) : '') + itemSym(r.good, 'good' + i)).join('') + WAY.map(([n], i) => itemSym(n, 'way' + i)).join('') + itemSym('Sweet Potato', 'raw');
const STOP = (() => { const s = PA.icon('paw-stop'), vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<symbol id="stop" viewBox="${vb}">${inner(s)}</symbol>`; })();
const LOOK = { beg: ['dachs', { pose: 'beg', facing: 'right' }], sit: ['dachs', { pose: 'sit', facing: 'right' }], yay: ['dachs', { pose: 'happy', facing: 'right', expr: 'hearts' }] };
const dogSvg = (id, kf) => { const [key, o] = LOOK[id]; return inner(PA.dog(key, Object.assign({ anim: false }, o, { kf: ((kf % 3) + 3) % 3 }))); };
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');
const PEN = '#5B3D32', RED = '#D9534F', GREEN = '#4E9A54';
const T_ = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || fam}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || PEN}" text-anchor="${o.a || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
// the "save this" page
const listRow = (sym, label, x, y, size) => `<use href="#${sym}" x="${x}" y="${y - 50}" width="100" height="100"/>${T_(label, x + 116, y + 14, size, { a: 'start' })}`;
const savePage = `<rect width="${W}" height="${H}" fill="#FFF8EC"/>
${T_(TX.save, 540, 220, RN ? 84 : 100, { rot: -2 })}<path d="M220 250 Q540 232 860 250" fill="none" stroke="#F28FA5" stroke-width="14" stroke-linecap="round" opacity=".6"/>
<rect x="50" y="310" width="980" height="${WAY.length * 116 + 120}" rx="36" fill="#FFFDF7" stroke="${PEN}" stroke-width="5"/>
${T_('✓', 112, 392, 70, { f: 'sans-serif', fill: GREEN })}${T_(TX.way, 168, 388, RN ? 56 : 58, { a: 'start', fill: GREEN })}
${WAY.map(([, label], i) => listRow('way' + i, label, 90, 480 + i * 116, RN ? 50 : 56)).join('')}
<rect x="50" y="${WAY.length * 116 + 460}" width="980" height="210" rx="36" fill="#FFFDF7" stroke="${PEN}" stroke-width="5"/>
<use href="#stop" x="80" y="${WAY.length * 116 + 482}" width="70" height="70"/>${T_(TX.never, 168, WAY.length * 116 + 534, RN ? 56 : 64, { a: 'start', fill: RED })}
<use href="#raw" x="90" y="${WAY.length * 116 + 556}" width="84" height="84"/>${T_(TX.neverLine, 196, WAY.length * 116 + 614, RN ? 46 : 50, { a: 'start' })}
<g id="endDog"></g>
${T_('Doodle', 400, 1660, 110, { f: 'Caveat', rot: -3 })}${T_('Doggo', 680, 1666, 110, { f: 'Caveat', rot: 2 })}
${T_(TX.sub, 540, 1730, RN ? 38 : 44, { w: 600, fill: '#8A7468' })}
<rect x="215" y="1762" width="650" height="78" rx="39" fill="#FFE3A1" stroke="${PEN}" stroke-width="4"/>${T_(TX.pill, 540, 1816, RN ? 46 : 54)}`;

// the kitchen with no words in it (as the food-safety Reel: the only words on screen are the Reel's own)
const scene = `<symbol id="sc" viewBox="662 0 337.5 600" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('house', { time: 'day', weather: 'sunny', season: 'autumn', jp: true })).replace(/<text\b[\s\S]*?<\/text>/g, '')}</symbol>`;
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
const R=${JSON.stringify(ROUNDS.map((r) => ({ rule: r.rule, bad: !!r.bad, whyLines: r.whyLines, yesLines: r.yesLines, BAD: r.BAD, start: r.start, LEN: r.LEN })))}, TX=${JSON.stringify(TX)}, FAM=${JSON.stringify(fam)};
const TW={}; function tw(s,size){ const k=s+'|'+size; if(TW[k]!=null) return TW[k]; const e=document.createElementNS(NSV,'text'); e.setAttribute('font-family',FAM); e.setAttribute('font-weight','700'); e.setAttribute('font-size',size); e.textContent=s; document.querySelector('svg').appendChild(e); const w=e.getComputedTextLength(); e.remove(); return TW[k]=w; }
const txt=(s,x,y,size,o)=>{ o=o||{}; return '<text x="'+x+'" y="'+y+'" font-family="'+FAM+'" font-weight="700" font-size="'+size+'" fill="'+(o.fill||'${PEN}')+'" text-anchor="'+(o.a||'middle')+'">'+s+'</text>'; };
// which rule, its own time, and Noodle's pose: begs as the food arrives, sits at the stop sign, is delighted by the right way
window.mode=function(t){ let i=0; while(i<R.length-1&&t>=R[i+1].start) i++; const r=R[i], lt=t-r.start;
  return {i, lt, bad: r.bad&&lt<r.BAD, g: lt-r.BAD, pose: t<${R0}||lt<0.62?'beg':(r.bad&&lt<r.BAD)?'sit':'yay'}; };
window.frame=function(t, D){
  const m=mode(t), i=m.i, lt=m.lt, r=R[i], ending=t>=${END};
  $('end').setAttribute('opacity', ending?Math.min(1,(t-${END})/0.3):0);
  $('nood').innerHTML = dog(m.pose, m.pose==='yay'?345:360, ${FEET + 30}, m.pose==='yay'?265:400, D.n, m.pose==='beg'?Math.sin(t*7)*2.5:0, m.pose==='yay'?-Math.abs(Math.sin(t*9))*16:0);
  let f=''; if(t>=${R0}){
    const pt=m.bad?lt:m.g, pop=back(pt/0.3), out=m.bad&&lt>r.BAD-0.2?Math.min(1,(lt-r.BAD+0.2)/0.2):0, sz=300*pop;
    f+='<g opacity="'+(1-out)+'"><use href="#'+(m.bad?'bad':'good')+i+'" x="'+(770-sz/2)+'" y="'+(${FEET - 30}-sz)+'" width="'+sz+'" height="'+sz+'"/></g>';
    if(m.bad && lt>=0.6){ const st=back((lt-0.6)/0.25), s2=230*(2.2-1.2*st); f+='<g opacity="'+(1-out)+'" transform="rotate('+(-12*st)+' 860 ${FEET - 260})"><use href="#stop" x="'+(860-s2/2)+'" y="'+(${FEET - 260}-s2/2)+'" width="'+s2+'" height="'+s2+'"/></g>'; }
    if(!m.bad){ const c=back((m.g-0.15)/0.25); if(c>0) f+='<g transform="translate(905 ${FEET - 300}) scale('+c+')"><circle r="62" fill="${GREEN}" stroke="${PEN}" stroke-width="6"/><path d="M-28 2 L-8 24 L30 -22" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g>'; }
  }
  $('food').innerHTML=f;
  // the card: the rule, the game's tip, and a tag (not like this / like this)
  let c=''; if(t>=${R0}+0.15 && !ending){ const ls=m.bad?r.whyLines:r.yesLines, h=150+ls.length*(TX.why+16), o=Math.min(1,((m.bad?lt:m.g)-0.1)/0.2), col=m.bad?'${RED}':'${GREEN}';
    c='<g opacity="'+Math.max(0,o)+'" transform="rotate(-1 540 700)"><rect x="70" y="500" width="940" height="'+h+'" rx="34" fill="#FFFDF7" stroke="'+col+'" stroke-width="7"/>'
      +(()=>{ const s=m.bad?TX.no:TX.yes, w=tw(s, ${RN ? 38 : 42})+56, x=1010-w; return '<rect x="'+x+'" y="462" width="'+w+'" height="58" rx="29" fill="'+col+'"/>'+txt(s, x+w/2, 503, ${RN ? 38 : 42}, {fill:'#FFF8EC'}); })()
      +txt(r.rule, 110, 588, TX.rule, {a:'start'})
      +ls.map((l,j)=>txt(l, 110, 668+j*(TX.why+16), TX.why, {a:'start'})).join('')+'</g>'; }
  $('card').innerHTML=c;
  $('endDog').innerHTML = ending ? dog('yay', 540, 1520, 220, D.n, 0, -Math.abs(Math.sin(t*6))*10) : '';
};
</script>`;

const drawFor = (t) => { let i = 0; while (i < ROUNDS.length - 1 && t >= ROUNDS[i + 1].start) i++; const r = ROUNDS[i], lt = t - r.start;
  const id = t >= END ? 'yay' : t < R0 || lt < 0.62 ? 'beg' : (r.bad && lt < r.BAD) ? 'sit' : 'yay'; return { n: dogSvg(id, t * 1.8) }; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  const still = process.env.ONLY === 'stills';
  const list = still ? [0.2, 1.5, 3.0, 4.6, 5.0, 5.3, 7.5, 7.8, 10.0, 13.0, 15.0, 17.5].map((s) => Math.round(s * FPS)) : [...Array(N).keys()];
  for (const f of list) { await p.evaluate(([t, D]) => window.frame(t, D), [f / FPS, drawFor(f / FPS)]); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(list.length, 'frames');
  // the cover: the raw sweet potato with the stop sign and rule 1
  await p.evaluate(([t, D]) => window.frame(t, D), [R0 + 1.6, drawFor(R0 + 1.6)]); await p.screenshot({ path: path.join(WORK, `sweet-cover${SUF}.png`) }); await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, `sweet-cover${SUF}.png`), '-q:v', '2', path.join(WORK, `sweet-cover${SUF}.jpg`)]);
  if (still) return;

  // sound: the game's own music (the yard by day), the "cooked" sting and a happy puppy bark on each right way, a bonk on the stop sign, a sparkle on the save page
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const stingers = ROUNDS.map((r) => ({ at: r.start + r.BAD + 0.05, name: 'cooked' })).concat([{ at: END + 0.1, name: 'sparkle' }]);
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.7, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, stingers]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  fs.writeFileSync(path.join(WORK, 'yay.wav'), Buffer.from(await ap.evaluate(async () => (await window.PawAudio._renderBarks({ breeds: ['dachs'], kinds: ['play'], age: 'puppy', wav: true, sampleRate: 44100 })).wav), 'base64'));
  await ab.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.8*sin(2*PI*(220-120*t)*t)*exp(-t*16)':s=44100:d=0.4", path.join(WORK, 'bonk.wav')]);
  const EV = []; ROUNDS.forEach((r) => { if (r.bad) EV.push(['bonk', r.start + 0.62]); EV.push(['yay', r.start + r.BAD + 0.15]); });
  const inputs = [], chains = [];
  EV.forEach(([n, at], i) => { inputs.push('-i', path.join(WORK, n + '.wav')); const d = Math.max(0, Math.round((at - (n === 'yay' ? 0.2 : 0)) * 1000));
    chains.push(`[${i + 2}:a]atrim=0:1.2,${n === 'yay' ? 'highpass=f=280,volume=1.6' : 'volume=1.3'},adelay=${d}|${d}[k${i}]`); });
  const mix = `[1:a]atrim=0:${T},afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${EV.map((_, i) => `[k${i}]`).join('')}amix=inputs=${EV.length + 1}:normalize=0,alimiter=limit=0.89:level=false,atrim=0:${T}[a]`;
  const out = path.join(WORK, `doodle-doggo-sweet-potato${SUF}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
