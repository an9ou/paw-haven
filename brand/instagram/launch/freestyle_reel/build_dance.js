// "Bluetooth died. The freestyle did not." — the dancing version (owner, 29 Oct 2026): Butter and Noodle dance in random game places.
// 15.5 s, 1080 x 1920, 30 fps: the hook on a sticker at the top, 12.5 s of dancing at 120 bpm with barks, then the game's end card. The places are the game's own scenes (PawArt.scene), five picked at random, a hard cut every 4 beats.
// The dogs are the game's real "dance" pose. The game draws three frames of each pose (head, paws and tail in different spots) and
// flips them; here they flip on the beat, and the whole dog sways left and right and bounces on every beat. The beat follows the
// game's own "play" music (86 bpm). At every place cut they wear a new costume and make new faces (the game's wardrobe and face
// expressions). Every place wears the game's own Halloween dressing. The brick phone on the ground buzzes on the beat and plays the music
// (buzz lines, notes floating up). No game file is changed: the dance marks and ground shadows
// are switched off in this script's copy of the art only, and the scenes' dashed tap-area outlines are hidden.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/freestyle_reel/build_dance.js <workdir>
//   SEED=n picks other places; ONLY=stills renders key frames and the cover only.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'dance_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
// 120 bpm: the game's "play" music (86 bpm) is played 1.4x faster (same pitch), a dance tempo. Five places, 5 beats each, then the end card.
const TEMPO = 120 / 86, B = 0.5, DANCE = 25 * B, T = DANCE + 3.0;
const FPS = 30, N = Math.round(T * FPS), W = 1080, H = 1920, FEET = 1700, SEED = +process.env.SEED || 5;

// ---- the real art: worlds and dogs, without the dance marks and ground shadows ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(ROOT, 'world', f), 'utf8'), ctx);
let src = fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
for (const [a, b] of [['if(L.danceFx){', 'if(false){'], ['const shadow=`', "const shadow=''&&`"]]) { if (!src.includes(a)) throw new Error('art changed: ' + a); src = src.replace(a, b); }
vm.runInContext(src, ctx);
const PA = win.PawArt, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

// five places at random (seeded), outdoors with ground to stand on
let a = SEED >>> 0; const rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const POOL = ['yard', 'park', 'beach', 'square', 'dogpark', 'hilltop', 'pier', 'fujihill', 'shibuya', 'yoyogi', 'asakusa', 'tokyotower', 'ueno', 'odaiba', 'training'];
const PLACES = []; while (PLACES.length < 5) { const p = POOL[Math.floor(rnd() * POOL.length)]; if (!PLACES.includes(p)) PLACES.push(p); }
const ENV = { time: 'day', weather: 'sunny', season: 'autumn', jp: true, halloween: true };   // the game's own Halloween dressing on every place
// the game's own Halloween props, big and close: lit jack-o'-lanterns on the ground and the Costume Parade bunting across the sky
const JACK = inner(PA.prop('jackolantern', { lit: true })), BANNER = inner(PA.prop('paradebanner', {}));
const scenes = PLACES.map((p, i) => `<symbol id="sc${i}" viewBox="331 0 337.5 600" preserveAspectRatio="xMidYMid slice">${inner(PA.scene(p, ENV))}</symbol>`).join('');
// a new costume and a new face for each place (the game's own wardrobe and its v2.13 face expressions; the dance pose takes
// hearts, proud, wink and zoomies; null = the pose's own happy face). Places with their own bandana get it.
const LOOKS = [
  { b: { head: 'Party Hat', eyes: 'Heart Sunglasses' }, bx: null, n: { head: 'Party Hat', neck: 'Bow Tie' }, nx: 'wink' },
  { b: { head: 'Witch Hat', body: 'Vampire Cape' }, bx: 'proud', n: { body: 'Pumpkin Suit' }, nx: 'hearts' },
  { b: { head: 'Cowboy Hat', neck: 'Red Bandana' }, bx: 'wink', n: { head: 'Sun Hat', body: 'Tutu' }, nx: 'zoomies' },
  { b: { body: 'Bumblebee Suit' }, bx: 'hearts', n: { head: 'Wizard Hat', body: 'Superhero Cape' }, nx: 'proud' },
  { b: { head: 'Flower Crown', body: 'Happi Coat' }, bx: 'zoomies', n: { head: 'Sailor Cap', body: 'Ghost Sheet' }, nx: 'wink' },
];
const BANDANA = { asakusa: 'Asakusa Bandana', tokyotower: 'Tokyo Tower Bandana', shibuya: 'Shibuya Bandana' };
// the three frames of each dance pose as their own symbols (CSS cannot reach inside a <use>, so the other two frames are cut out here)
const frames = (svg) => [0, 1, 2].map((k) => [0, 1, 2].filter((j) => j !== k).reduce((s, j) => s.replace(`class="pa-d-f${j}"`, `class="pa-d-f${j}" display="none"`), svg));
let dogSyms = '';
PLACES.forEach((pl, i) => {
  const L = LOOKS[i], band = BANDANA[pl], bo = Object.assign({}, L.b, band ? { neck: band } : {}), no = Object.assign({}, L.n, band ? { neck: band } : {});
  for (const [id, key, facing, outfit, expr] of [['butter', 'lab', 'right', bo, L.bx], ['noodle', 'dachs', 'left', no, L.nx]]) {
    const o = { pose: 'dance', facing, anim: true, outfit }; if (expr) o.expr = expr;
    frames(inner(PA.dog(key, o))).forEach((sv, k) => { dogSyms += `<symbol id="${id}${i}_${k}" overflow="visible">${sv}</symbol>`; });
  }
});
// a crayon brick phone (navy body, small green screen, light keys)
const PEN = '#5B3D32';
const keys = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push(`<rect x="${18 + c * 22}" y="${118 + r * 17}" width="16" height="11" rx="5" fill="#D9DDE6" stroke="${PEN}" stroke-width="2"/>`);
const phone = `<path d="M14 8 Q50 1 86 8 Q93 10 94 22 L96 170 Q95 190 78 193 Q50 197 22 193 Q6 190 6 172 L5 24 Q6 10 14 8Z" fill="#2C3550" stroke="${PEN}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M24 30 Q50 26 76 30 L76 74 Q50 78 24 74Z" fill="#9BCB6B" stroke="${PEN}" stroke-width="3.2" stroke-linejoin="round"/><path d="M30 40 L56 40 M30 50 L48 50" stroke="#5E8A3E" stroke-width="3" stroke-linecap="round"/>
  <path d="M38 88 Q50 84 62 88 Q66 98 62 106 Q50 110 38 106 Q34 98 38 88Z" fill="#D9DDE6" stroke="${PEN}" stroke-width="2.6"/>${keys.join('')}`;

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#fff}svg{display:block}
[class$="-hl"]{display:none}
.pa-dog *{animation:none!important}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${scenes}${dogSyms}<symbol id="jack" viewBox="0 0 80 80">${JACK}</symbol><symbol id="banner" viewBox="0 0 400 90" preserveAspectRatio="none">${BANNER}</symbol></defs>
<use id="bg" href="#sc0" x="0" y="0" width="${W}" height="${H}"/>
<use href="#banner" x="-40" y="470" width="1160" height="230"/><g id="bats"></g>
<use href="#jack" x="555" y="${FEET - 120}" width="110" height="110"/>
<g id="ph"><g transform="translate(150 ${FEET + 120}) rotate(-68) scale(0.74)">${phone}</g></g>
<g id="B"></g><g id="Nd"></g>
<use href="#jack" x="870" y="${FEET - 20}" width="190" height="190"/><use href="#jack" x="-30" y="${FEET + 40}" width="150" height="150"/>
<g id="buzz"></g><g id="notes"></g>
<g id="hook" opacity="0"><g transform="rotate(-2 540 300)"><rect x="110" y="170" width="860" height="270" rx="36" fill="#FFF8EC" stroke="#5B3D32" stroke-width="6"/>
<text x="540" y="282" font-family="Caveat" font-weight="700" font-size="96" fill="#5B3D32" text-anchor="middle">bluetooth died.</text>
<text x="540" y="392" font-family="Caveat" font-weight="700" font-size="96" fill="#5B3D32" text-anchor="middle">the freestyle did not.</text></g></g>
<g id="end" opacity="0"><rect width="${W}" height="${H}" fill="#FFF8EC" opacity=".55"/>
<g transform="rotate(-2 540 560)"><rect x="90" y="250" width="900" height="620" rx="44" fill="#FFF8EC" stroke="#5B3D32" stroke-width="7"/>
<path d="M210 455 Q540 425 870 455 L862 505 Q540 480 218 505Z" fill="#F28FA5" opacity=".45"/>
<text x="385" y="470" font-family="Caveat" font-weight="700" font-size="150" fill="#5B3D32" text-anchor="middle" transform="rotate(-3 385 470)">Doodle</text>
<text x="715" y="478" font-family="Caveat" font-weight="700" font-size="150" fill="#5B3D32" text-anchor="middle" transform="rotate(2 715 478)">Doggo</text>
<text x="540" y="590" font-family="Caveat" font-weight="600" font-size="62" fill="#8A7468" text-anchor="middle">a free cozy dog game</text>
<text x="540" y="670" font-family="Caveat" font-weight="600" font-size="52" fill="#8A7468" text-anchor="middle">35 crayon dogs · dress-up · walks · Tokyo trip</text>
<rect x="190" y="720" width="700" height="100" rx="50" fill="#FFE3A1" stroke="#5B3D32" stroke-width="5"/>
<text x="540" y="790" font-family="Caveat" font-weight="700" font-size="62" fill="#5B3D32" text-anchor="middle">play right on doodledoggo.app</text></g></g>
<g id="cover" opacity="0"></g>
</svg>
<script>
const NS='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NS,'use'); u.setAttribute('href','#'+id+'0_0'); $('B').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }   // frame 0 sets the size, so the dog does not jump between frames
// a dog with its feet at (cx, feet), height hh, showing dance frame k, swayed by rot degrees about its feet and lifted by dy
let P=0;
function dog(id, cx, feet, hh, k, rot, dy){ const b=box(id), s=hh/b[3], w=b[2]*s;
  return '<ellipse cx="'+cx+'" cy="'+(feet-2)+'" rx="'+(w*0.3*(1-Math.min(1,-dy/60)*0.3))+'" ry="10" fill="#5B3D32" opacity=".12"/>'
   +'<g transform="translate(0 '+dy+') rotate('+rot+' '+cx+' '+feet+')"><g transform="translate('+(cx-w/2)+' '+(feet-hh)+') scale('+s+') translate('+(-b[0])+' '+(-b[1])+')"><use href="#'+id+P+'_'+k+'"/></g></g>'; }
window.L={ bx:320, nx:775, bh:540, nh:520 };
window.frame=function(t){
  const beat=t/${B}, n=Math.floor(beat), ph=beat-n;
  P=Math.min(4,Math.floor(n/5)); $('bg').setAttribute('href','#sc'+P);          // a new place (and new costumes and faces) every 5 beats
  // the phone plays the music: it buzzes on every beat (a quick shake that dies away), with crayon buzz lines, and notes float up from it
  const amp=Math.exp(-ph*4), PX=232, PY=${FEET}+113;
  $('ph').setAttribute('transform','translate('+(Math.sin(t*2*Math.PI*19)*5*amp)+' '+(Math.cos(t*2*Math.PI*23)*2.5*amp)+') rotate('+(Math.sin(t*2*Math.PI*17)*5*amp)+' '+PX+' '+PY+')');
  let bz=''; if(amp>0.25){ for(const sd of [-1,1]) for(const r of [1,2]) { const x=PX+sd*(78+r*22), o=(amp-0.25)*1.6; bz+='<path d="M'+x+' '+(PY-24-r*6)+' Q'+(x+sd*12)+' '+PY+' '+x+' '+(PY+24+r*6)+'" fill="none" stroke="#5B3D32" stroke-width="5" stroke-linecap="round" opacity="'+Math.min(1,o)+'"/>'; } }
  $('buzz').innerHTML=bz;
  let nt=''; for(let j=Math.max(0,n-3); j<=n; j++){ const age=(beat-j)*${B}; if(age<0||age>1.6||j*${B}>=${DANCE}) continue; const x=PX-40-age*110+Math.sin(age*6)*14, y=PY-50-age*170, sc=0.8+0.25*((j*13)%3), op=age<1.1?1:1-(age-1.1)/0.5, dbl=j%2;
    nt+='<g transform="translate('+x+' '+y+') rotate('+(-12+((j*29)%24))+') scale('+sc+')" opacity="'+op+'"><path d="M0 0 L0 -46'+(dbl?' L30 -54 L30 -8':' Q14 -40 22 -26')+'" fill="none" stroke="#5B3D32" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="-8" cy="2" rx="11" ry="8" transform="rotate(-20 -8 2)" fill="#7A5C9E" stroke="#5B3D32" stroke-width="4"/>'+(dbl?'<ellipse cx="22" cy="-6" rx="11" ry="8" transform="rotate(-20 22 -6)" fill="#F28FA5" stroke="#5B3D32" stroke-width="4"/>':'')+'</g>'; }
  $('notes').innerHTML=nt;
  // three crayon bats flapping across the sky
  let bt=''; [[160,330,1.3,0],[880,380,1.1,1.7],[640,250,0.9,3.1]].forEach(([x,y,sc,o])=>{ const fl=0.55+0.45*Math.abs(Math.sin(t*9+o)), dx=Math.sin(t*0.9+o)*40, dy=Math.cos(t*1.3+o)*14;
    bt+='<g transform="translate('+(x+dx)+' '+(y+dy)+') scale('+(sc*2.4)+' '+(sc*2.4*fl)+')"><path d="M0 -4 Q-6 -14 -20 -10 Q-14 -4 -16 4 Q-8 -2 -4 6 Q0 2 4 6 Q8 -2 16 4 Q14 -4 20 -10 Q6 -14 0 -4Z" fill="#6B5A86" stroke="#5B3D32" stroke-width="1.6" stroke-linejoin="round"/><circle cx="-2" cy="-3" r="0.9" fill="#FFF8EC"/><circle cx="2" cy="-3" r="0.9" fill="#FFF8EC"/></g>'; });
  $('bats').innerHTML=bt;
  $('hook').setAttribute('opacity', t<${DANCE} ? Math.min(1,t/0.2) : 0);                 // the hook, popped in at the start
  $('end').setAttribute('opacity', t<${DANCE} ? 0 : Math.min(1,(t-${DANCE})/0.25));      // the end card over the last place
  const sway=Math.sin(Math.PI*beat), hop=-Math.abs(Math.sin(Math.PI*beat))*16;
  $('B').innerHTML = dog('butter', L.bx, ${FEET}, L.bh, n%3, 7*sway, hop);
  $('Nd').innerHTML = dog('noodle', L.nx, ${FEET}, L.nh, (n+1)%3, 7*sway, hop*0.9);
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  console.log('places:', PLACES.join(', '));
  const still = process.env.ONLY === 'stills';
  const list = still ? [0.3, 2.7, 5.2, 7.7, 10.2, 12.0, 14.5].map((s) => Math.round(s * FPS)) : [...Array(N).keys()];
  for (const f of list) { await p.evaluate((t) => window.frame(t), f / FPS); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(list.length, 'frames');
  // the designed cover: the first place, the dogs mid-dance, the hook on a cream sticker at the top, the logo at the bottom (inside the grid's 3:4)
  await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap' }).catch(() => {});
  await p.evaluate(() => document.fonts.ready); await p.evaluate((t) => window.frame(t), B * 0.5);
  await p.evaluate(() => { ['hook', 'end'].forEach((i) => document.getElementById(i).setAttribute('opacity', 0)); const c = document.getElementById('cover'); c.setAttribute('opacity', 1);
    c.innerHTML = '<g transform="rotate(-2 540 470)"><rect x="140" y="330" width="800" height="290" rx="36" fill="#FFF8EC" stroke="#5B3D32" stroke-width="6"/>'
      + '<text x="540" y="455" font-family="Caveat" font-weight="700" font-size="100" fill="#5B3D32" text-anchor="middle">bluetooth died.</text>'
      + '<text x="540" y="568" font-family="Caveat" font-weight="700" font-size="100" fill="#5B3D32" text-anchor="middle">the freestyle did not.</text></g>'
      + '<rect x="330" y="1530" width="420" height="96" rx="48" fill="#FFE3A1" stroke="#5B3D32" stroke-width="5" transform="rotate(-2 540 1578)"/>'
      + '<text x="540" y="1600" font-family="Caveat" font-weight="700" font-size="66" fill="#5B3D32" text-anchor="middle" transform="rotate(-2 540 1578)">Doodle Doggo</text>'; });
  await p.screenshot({ path: path.join(WORK, 'dance-cover.png') }); await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'dance-cover.png'), '-q:v', '2', path.join(WORK, 'dance-cover.jpg')]);
  if (still) return;

  // sound: the game's own "play" music rendered 1.4x longer, then played 1.4x faster at the same pitch (120 bpm, the dogs' beat), a sparkle on
  // the end card; the game's own barks (PawAudio's bark engine, each dog's own voice) on the place cuts and the end card
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, end]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.85, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'play', time: 'day', weather: 'sunny' } }], stingers: [{ at: end, name: 'sparkle' }] })).wav, [T * TEMPO + 1, DANCE * TEMPO]);
  fs.writeFileSync(path.join(WORK, 'music_slow.wav'), Buffer.from(wav, 'base64'));
  const barkWav = async (breed, kind) => (await ap.evaluate(async ([b, k]) => (await window.PawAudio._renderBarks({ breeds: [b], kinds: [k], wav: true, sampleRate: 44100 })).wav, [breed, kind]));
  for (const [n, b, k] of [['b_lab', 'lab', 'play'], ['b_dachs', 'dachs', 'play'], ['b_dachs2', 'dachs', 'alert']]) fs.writeFileSync(path.join(WORK, n + '.wav'), Buffer.from(await barkWav(b, k), 'base64'));
  await ab.close();
  // each bark file has its bark at 0.2 s; place them on the beats of the place cuts and the end card
  const BARKS = [['b_dachs', 5 * B], ['b_lab', 10 * B], ['b_dachs2', 15 * B], ['b_lab', 20 * B], ['b_dachs', DANCE], ['b_lab', DANCE + 0.25]];
  const inputs = [], chains = [];
  BARKS.forEach(([n, at], i) => { inputs.push('-i', path.join(WORK, n + '.wav')); const d = Math.max(0, Math.round((at - 0.2) * 1000)); chains.push(`[${i + 2}:a]atrim=0:1.2,volume=1.6,adelay=${d}|${d}[k${i}]`); });
  const mix = `[1:a]atempo=${TEMPO.toFixed(5)},atrim=0:${T},afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${BARKS.map((_, i) => `[k${i}]`).join('')}amix=inputs=${BARKS.length + 1}:normalize=0,atrim=0:${T}[a]`;
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music_slow.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), path.join(WORK, 'doodle-doggo-freestyle-dance.mp4')]);
  console.log('wrote', path.join(WORK, 'doodle-doggo-freestyle-dance.mp4'));
})().catch((e) => { console.error(e); process.exit(1); });
