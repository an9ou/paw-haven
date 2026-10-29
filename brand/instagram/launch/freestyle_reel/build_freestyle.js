// "Bluetooth died. The freestyle did not." (owner's brief, 29 Oct 2026, a remake of an Instagram Reel's structure; draft only, not posted).
// 13 s, 1080 x 1920, 30 fps: Butter (the Labrador) and Noodle (the dachshund) standing up on a pure white void, a crayon brick phone lying on
// the floor bottom-left. Near-still: a settle hold, one slow breath on Butter, one small lean of Noodle toward Butter, back to the start pose.
// The dogs are the game's real art (dogs/pawart_dogs.js): Butter in his "dance" pose (upright, eyes closed, a paw up by his head) and Noodle
// in his "beg" pose (upright, paws at his chest, facing Butter). Their floating hearts, dance marks and ground shadows are switched off in this script's copy
// of the art only (no game file changes). Colours stay the game's own, so the ad shows the dogs players get. The phone is drawn here.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/freestyle_reel/build_freestyle.js <workdir>      (ONLY=stills: key frames + cover)
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'freestyle_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const FPS = 30, T = 13, N = T * FPS, W = 1080, H = 1920, FEET = 1225; // the pair stands in the middle of the screen, as in the reference

// ---- the real art, without the floating extras ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
let src = fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
for (const flag of ['if(L.danceFx){', 'if(L.hope){']) { if (!src.includes(flag)) throw new Error('art changed: ' + flag); src = src.replace(flag, 'if(false){'); }
if (!src.includes('const shadow=`')) throw new Error('art changed: shadow'); src = src.replace('const shadow=`', "const shadow=''&&`"); // no ground shadow: a clean white void
// Noodle's far back foot: the game draws it flat on the floor at a fixed spot, which floats away from a long dog's raised haunch in the
// beg pose. Here it stands right under the haunch, joined to it by a short leg.
const SITFOOT = "else if(l.sitfoot){const hp=T(L.bT)([-s.body.rx*.45,s.body.ry*.25]);h.shape(circ(hp[0]+s.body.ry*.9+9,GY-6,s.body.ry*.5+3,4,8),l.col,{w:3.4})}";
if (!src.includes(SITFOOT)) throw new Error('art changed: sitfoot');
src = src.replace(SITFOOT, "else if(l.sitfoot){const hp=T(L.bT)([-s.body.rx*.45,s.body.ry*.25]),fx=hp[0]+2;if(hp[1]<GY-10)h.tube([[hp[0],hp[1]],[fx+1,GY-7]],l.w*.95,l.col);h.shape(circ(fx+4,GY-6,s.body.ry*.5+3,4,8),l.col,{w:3.4})}");
vm.runInContext(src, ctx);
const PA = win.PawArt, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const butter = inner(PA.dog('lab', { pose: 'dance', facing: 'right', anim: false }));
const noodle = inner(PA.dog('dachs', { pose: 'beg', facing: 'left', anim: false }));

// ---- a crayon brick phone (navy body, small green screen, light keys), lying on the floor, tilted ----
const PEN = '#5B3D32';
function phone() {
  const keys = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push(`<rect x="${18 + c * 22}" y="${118 + r * 17}" width="16" height="11" rx="5" fill="#D9DDE6" stroke="${PEN}" stroke-width="2"/>`);
  return `<g>
    <path d="M14 8 Q50 1 86 8 Q93 10 94 22 L96 170 Q95 190 78 193 Q50 197 22 193 Q6 190 6 172 L5 24 Q6 10 14 8Z" fill="#2C3550" stroke="${PEN}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M24 30 Q50 26 76 30 L76 74 Q50 78 24 74Z" fill="#9BCB6B" stroke="${PEN}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M30 40 L56 40 M30 50 L48 50" stroke="#5E8A3E" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 88 Q50 84 62 88 Q66 98 62 106 Q50 110 38 106 Q34 98 38 88Z" fill="#D9DDE6" stroke="${PEN}" stroke-width="2.6"/>
    ${keys.join('')}
    <path d="M40 16 L60 16" stroke="#8C93A8" stroke-width="3" stroke-linecap="round"/></g>`;
}

const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}svg{display:block}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><symbol id="butter" overflow="visible">${butter}</symbol><symbol id="noodle" overflow="visible">${noodle}</symbol></defs>
<rect width="${W}" height="${H}" fill="#FFFFFF"/>
<g id="ph" transform="translate(170 ${FEET + 128}) rotate(-68) scale(0.74)">${phone()}</g>
<g id="B"></g><g id="Nd"></g><g id="cover" opacity="0"></g>
</svg>
<script>
const NS='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NS,'use'); u.setAttribute('href','#'+id); $('B').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// a dog with its feet at (cx, feet), height hh; sy/sx: breath scale about the feet; rot: lean (degrees) about pivot (px, py)
function dog(id, cx, feet, hh, sx, sy, rot, px, py){ const b=box(id), k=hh/b[3], w=b[2]*k;
  return '<g transform="rotate('+rot+' '+px+' '+py+') translate('+cx+' '+feet+') scale('+sx+' '+sy+') translate('+(-cx)+' '+(-feet)+')"><g transform="translate('+(cx-w/2)+' '+(feet-hh)+') scale('+k+') translate('+(-b[0])+' '+(-b[1])+')"><use href="#'+id+'"/></g></g>'; }
const ease=(x)=>0.5-0.5*Math.cos(Math.PI*Math.max(0,Math.min(1,x)));
window.L={ bx:392, nx:748, bh:470, nh:440 };
window.frame=function(t){
  // Butter: one slow breath, 3 to 8 s (a soft rise and settle, about the feet)
  const br = t>=3 && t<8 ? Math.sin(Math.PI*(t-3)/5) : 0, sy=1+0.028*br, sx=1-0.01*br;
  // Noodle: a small lean toward Butter (his head tilts in), 8.3 to 9.3 s, held, back to the start pose by 12.9 s (loop-safe)
  const lean = t<8.3 ? 0 : t<9.3 ? ease(t-8.3) : t<11.6 ? 1 : 1-ease((t-11.6)/1.3);
  $('B').innerHTML = dog('butter', L.bx, ${FEET}, L.bh, sx, sy, 0, 0, 0);
  $('Nd').innerHTML = dog('noodle', L.nx, ${FEET}, L.nh, 1, 1, -4.5*lean, L.nx, ${FEET} - L.nh*0.35);
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html'));
  const still = process.env.ONLY === 'stills';
  const list = still ? [0, 5.5, 9.0, 12.95].map((s) => Math.round(s * FPS)) : [...Array(N).keys()];
  for (const f of list) { await p.evaluate((t) => window.frame(t), f / FPS); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(list.length, 'frames');
  // the designed cover: the same pair and phone, the hook in the game's handwriting at the top, the logo at the bottom (inside the grid's 3:4)
  await p.goto('file://' + path.join(WORK, 'page.html')); await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap' }).catch(() => {});
  await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.frame(0));
  await p.evaluate(() => { const c = document.getElementById('cover'); c.setAttribute('opacity', 1);
    c.innerHTML = '<text x="540" y="470" font-family="Caveat" font-weight="700" font-size="104" fill="#5B3D32" text-anchor="middle">bluetooth died.</text>'
      + '<text x="540" y="590" font-family="Caveat" font-weight="700" font-size="104" fill="#5B3D32" text-anchor="middle">the freestyle did not.</text>'
      + '<path d="M250 620 Q540 600 830 620" stroke="#F28FA5" stroke-width="16" stroke-linecap="round" fill="none" opacity=".55"/>'
      + '<text x="540" y="1700" font-family="Caveat" font-weight="700" font-size="72" fill="#5B3D32" text-anchor="middle">Doodle Doggo</text>'; });
  await p.screenshot({ path: path.join(WORK, 'freestyle-cover.png') }); await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'freestyle-cover.png'), '-q:v', '2', path.join(WORK, 'freestyle-cover.jpg')]);
  if (still) return;

  // sound: the game's own calm house music, very low, and one tiny plastic clack at 0.0 s (the phone, already on the floor)
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async (s) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.8, music: 0.45, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'house', time: 'dusk', weather: 'sunny' } }] })).wav, T + 0.5);
  await ab.close(); fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  const SR = 44100, len = Math.ceil(T * SR), pcm = Buffer.alloc(44 + len * 2); let lp = 0, seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  for (let i = 0; i < len; i++) { const tt = i / SR; let v = 0; if (tt < 0.06) { lp += 0.5 * (rnd() - lp); v = 0.5 * lp * Math.exp(-70 * tt) + 0.15 * Math.sin(2 * Math.PI * 1800 * tt) * Math.exp(-90 * tt); } pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2); }
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + len * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(len * 2, 40);
  fs.writeFileSync(path.join(WORK, 'clack.wav'), pcm);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), '-i', path.join(WORK, 'clack.wav'),
    '-filter_complex', `[1:a]volume=0.55,afade=t=in:d=0.6,afade=t=out:st=${T - 1}:d=1[m];[m][2:a]amix=inputs=2:normalize=0,atrim=0:${T}[a]`, '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', String(T), path.join(WORK, 'doodle-doggo-freestyle.mp4')]);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'doodle-doggo-freestyle.mp4'), '-c:v', 'copy', '-an', path.join(WORK, 'doodle-doggo-freestyle-no-music.mp4')]); // for a sound picked in Instagram
  console.log('wrote', path.join(WORK, 'doodle-doggo-freestyle.mp4'));
})().catch((e) => { console.error(e); process.exit(1); });
