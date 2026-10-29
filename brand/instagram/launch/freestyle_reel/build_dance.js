// "Bluetooth died. The freestyle did not." — the dancing version (owner, 29 Oct 2026): Butter and Noodle dance in random game places.
// 13 s, 1080 x 1920, 30 fps. The places are the game's own scenes (PawArt.scene), five picked at random, a hard cut every 4 beats.
// The dogs are the game's real "dance" pose. The game draws three frames of each pose (head, paws and tail in different spots) and
// flips them; here they flip on the beat, and the whole dog sways left and right and bounces on every beat. The beat follows the
// game's own "play" music (86 bpm). At every place cut they wear a new costume and make new faces (the game's wardrobe and face
// expressions). The brick phone stays on the ground. No game file is changed: the dance marks and ground shadows
// are switched off in this script's copy of the art only, and the scenes' dashed tap-area outlines are hidden.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/freestyle_reel/build_dance.js <workdir>
//   SEED=n picks other places; ONLY=stills renders key frames and the cover only.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'dance_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const FPS = 30, T = 13, N = T * FPS, W = 1080, H = 1920, FEET = 1700, B = 60 / 86, SEED = +process.env.SEED || 5;

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
const ENV = { time: 'day', weather: 'sunny', season: 'autumn', jp: true };
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

const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}svg{display:block}
[class$="-hl"]{display:none}
.pa-dog *{animation:none!important}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${scenes}${dogSyms}</defs>
<use id="bg" href="#sc0" x="0" y="0" width="${W}" height="${H}"/>
<g transform="translate(150 ${FEET + 120}) rotate(-68) scale(0.74)">${phone}</g>
<g id="B"></g><g id="Nd"></g><g id="cover" opacity="0"></g>
</svg>
<script>
const NS='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), BOX={}, B=${B};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NS,'use'); u.setAttribute('href','#'+id+'0_0'); $('B').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }   // frame 0 sets the size, so the dog does not jump between frames
// a dog with its feet at (cx, feet), height hh, showing dance frame k, swayed by rot degrees about its feet and lifted by dy
let P=0;
function dog(id, cx, feet, hh, k, rot, dy){ const b=box(id), s=hh/b[3], w=b[2]*s;
  return '<ellipse cx="'+cx+'" cy="'+(feet-2)+'" rx="'+(w*0.3*(1-Math.min(1,-dy/60)*0.3))+'" ry="10" fill="#5B3D32" opacity=".12"/>'
   +'<g transform="translate(0 '+dy+') rotate('+rot+' '+cx+' '+feet+')"><g transform="translate('+(cx-w/2)+' '+(feet-hh)+') scale('+s+') translate('+(-b[0])+' '+(-b[1])+')"><use href="#'+id+P+'_'+k+'"/></g></g>'; }
window.L={ bx:320, nx:775, bh:540, nh:520 };
window.frame=function(t){
  const beat=t/B, n=Math.floor(beat), ph=beat-n;
  P=Math.min(4,Math.floor(n/4)); $('bg').setAttribute('href','#sc'+P);          // a new place (and new costumes and faces) every 4 beats
  const sway=Math.sin(Math.PI*beat), hop=-Math.abs(Math.sin(Math.PI*beat))*16;
  $('B').innerHTML = dog('butter', L.bx, ${FEET}, L.bh, n%3, 7*sway, hop);
  $('Nd').innerHTML = dog('noodle', L.nx, ${FEET}, L.nh, (n+1)%3, 7*sway, hop*0.9);
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html'));
  console.log('places:', PLACES.join(', '));
  const still = process.env.ONLY === 'stills';
  const list = still ? [0.2, 1.0, 3.2, 6.0, 9.0, 12.0].map((s) => Math.round(s * FPS)) : [...Array(N).keys()];
  for (const f of list) { await p.evaluate((t) => window.frame(t), f / FPS); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(list.length, 'frames');
  // the designed cover: the first place, the dogs mid-dance, the hook on a cream sticker at the top, the logo at the bottom (inside the grid's 3:4)
  await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap' }).catch(() => {});
  await p.evaluate(() => document.fonts.ready); await p.evaluate((t) => window.frame(t), B * 0.5);
  await p.evaluate(() => { const c = document.getElementById('cover'); c.setAttribute('opacity', 1);
    c.innerHTML = '<g transform="rotate(-2 540 470)"><rect x="140" y="330" width="800" height="290" rx="36" fill="#FFF8EC" stroke="#5B3D32" stroke-width="6"/>'
      + '<text x="540" y="455" font-family="Caveat" font-weight="700" font-size="100" fill="#5B3D32" text-anchor="middle">bluetooth died.</text>'
      + '<text x="540" y="568" font-family="Caveat" font-weight="700" font-size="100" fill="#5B3D32" text-anchor="middle">the freestyle did not.</text></g>'
      + '<rect x="330" y="1530" width="420" height="96" rx="48" fill="#FFE3A1" stroke="#5B3D32" stroke-width="5" transform="rotate(-2 540 1578)"/>'
      + '<text x="540" y="1600" font-family="Caveat" font-weight="700" font-size="66" fill="#5B3D32" text-anchor="middle" transform="rotate(-2 540 1578)">Doodle Doggo</text>'; });
  await p.screenshot({ path: path.join(WORK, 'dance-cover.png') }); await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'dance-cover.png'), '-q:v', '2', path.join(WORK, 'dance-cover.jpg')]);
  if (still) return;

  // sound: the game's own upbeat "play" music (86 bpm, the dogs' beat), and one tiny plastic clack at 0.0 s
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async (s) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'play', time: 'day', weather: 'sunny' } }] })).wav, T + 0.5);
  await ab.close(); fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'),
    '-af', `afade=t=out:st=${T - 0.8}:d=0.8`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), path.join(WORK, 'doodle-doggo-freestyle-dance.mp4')]);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'doodle-doggo-freestyle-dance.mp4'), '-c:v', 'copy', '-an', path.join(WORK, 'doodle-doggo-freestyle-dance-no-music.mp4')]);
  console.log('wrote', path.join(WORK, 'doodle-doggo-freestyle-dance.mp4'));
})().catch((e) => { console.error(e); process.exit(1); });
