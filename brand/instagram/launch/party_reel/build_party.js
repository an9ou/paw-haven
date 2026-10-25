// "Party" ad Reel: a deadpan, absurd clip in the style the owner shared (24 Oct 2026, an Instagram Reel of a dachshund standing up in a
// party hat between pigeons in party hats, on a flat sky and flat grass, with hard cuts and sudden close-ups). Ours uses the game's real art
// only: a random crayon dog (default the Westie) in the game's Party Hat, standing up in its "beg" pose, and the game's own crayon city pigeon
// (world D, Tokyo), each with a little paper party cone. Cuts land on the beat of the game's own "play" music. Ends on the logo card.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/party_reel/build_party.js <workdir>
//
// Options (env): DOG (westie), FRAMES=a-b (render only those frames over a copied workdir; b excluded), ONLY=stills (key frames + cover only).
// Output: <workdir>/doodle-doggo-party-reel.mp4 (1080 x 1920, 30 fps) and party-cover.jpg; the repo copies live next to this script.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const WORK = path.resolve(process.argv[2] || 'party_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const DOG = process.env.DOG || 'westie', FPS = 30, W = 1080, H = 1920;
const FR = (process.env.FRAMES || '').match(/^(\d+)-(\d+)$/);

// ---- the real art (the pigeon is drawn by world D's own pigeon(); a small hook exposes it as a cut-out) ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js']) {
  let s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (f.endsWith('_d.js')) s = s.replace(/\}\)\(\);\s*$/, "PA.__pigeon=(f)=>{const k=kit(hashS('pwd-pigeon'));k.env=DEF_ENV;k.so='';k.xl=[];k.rc=recolorFn(DEF_ENV,'out');const pp=paperDefs(k,60,40);pigeon(k,30,34,1,f);return assemble(k,pp,60,'<svg viewBox=\"0 0 60 40\">',false)};\n})();");
  vm.runInContext(s, ctx);
}
const PA = win.PawArt, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const pigeonSVG = (f) => inner(PA.__pigeon(f)).replace(/<rect width="60" height="40"[^>]*\/>/g, '').replace(/id="pwd/g, `id="pg${f > 0 ? 'r' : 'l'}`).replace(/url\(#pwd/g, `url(#pg${f > 0 ? 'r' : 'l'}`);
const dogSVG = (facing) => inner(PA.dog(DOG, { pose: 'beg', facing, outfit: { head: 'Party Hat' }, anim: false }));

// ---- timing: the game's "play" music (86 bpm); it starts after the white void and the black flash ----
const B = 60 / 86, M0 = 1.62;
const SHOTS = [ // t0 in seconds; cam: [scale, cx, cy] in world px; dog: [x, feet y, height, facing]; pg: [[x, feet y, height, facing, hat]]
  { t0: 0, bg: 'white', cam: [1, 540, 960], dog: null, pg: [[300, 1010, 120, 1, 0], [800, 1010, 120, -1, 0]], peck: 1 },
  { t0: 1.40, bg: 'black' },
  { t0: M0, ground: 1240, cam: [1, 540, 960], dog: [540, 1250, 640, 'right'], pg: [[150, 1262, 221, 1, 1], [930, 1262, 221, -1, 1]] },
  { t0: M0 + 2 * B, ground: 1330, cam: [1.12, 540, 1000], dog: [540, 1340, 640, 'left'], pg: [[180, 1350, 221, 1, 1], [900, 1350, 221, -1, 1]] },
  { t0: M0 + 4 * B, ground: 1180, cam: [1, 540, 960], dog: [560, 1200, 760, 'right'], pg: [[820, 1196, 160, -1, 1], [130, 1210, 208, 1, 1], [960, 1214, 208, -1, 1]] },
  { t0: M0 + 6 * B, ground: 1290, cam: [1, 540, 960], dog: [380, 1300, 700, 'left'], pg: [[720, 1310, 221, -1, 1], [975, 1316, 208, -1, 1]] },
  { t0: M0 + 7 * B, ground: 1290, cam: [3.0, 400, 1190], dog: [380, 1300, 700, 'left'], pg: [[760, 1310, 221, -1, 1]], tag: 'legs' },
  { t0: M0 + 8 * B, ground: 1290, cam: [3.0, 390, 1180], dog: [380, 1300, 700, 'right'], pg: [], tag: 'legs' },
  { t0: M0 + 9 * B, ground: 1290, cam: [2.6, 0, 0], dog: [540, 1300, 700, 'left'], pg: [], tag: 'face' },
  { t0: M0 + 10 * B, ground: 1290, cam: [2.6, 0, 0], dog: [540, 1300, 700, 'right'], pg: [], tag: 'face' },
  { t0: M0 + 11 * B, ground: 1290, cam: [2.7, 760, 1215], dog: null, pg: [[760, 1310, 221, -1, 1]], tag: 'pigeon' },
  { t0: M0 + 12 * B, ground: 1240, cam: [1, 540, 960], dog: [540, 1250, 640, 'right'], pg: [[300, 1226, 170, 1, 1], [790, 1228, 170, -1, 1], [120, 1262, 221, 1, 1], [960, 1262, 221, -1, 1]], hop: 1 },
  { t0: M0 + 13 * B, ground: 1300, cam: [1, 540, 960], dog: [540, 1310, 560, 'right'], pg: [[170, 1322, 195, 1, 1], [910, 1322, 195, -1, 1]], end: 1 },
];
const T = SHOTS[SHOTS.length - 1].t0 + 3.0, N = Math.round(T * FPS), LOGO = SHOTS[SHOTS.length - 1].t0;

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}</style>
<svg id="v" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><symbol id="dogR" overflow="visible">${dogSVG('right')}</symbol><symbol id="dogL" overflow="visible">${dogSVG('left')}</symbol>
<symbol id="pgR" overflow="visible">${pigeonSVG(-1)}</symbol><symbol id="pgL" overflow="visible">${pigeonSVG(1)}</symbol>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#5B3D32" flood-opacity=".25"/></filter></defs>
<rect id="bg" width="${W}" height="${H}" fill="#fff"/>
<g id="world"><rect id="ground" x="-4000" y="1240" width="9000" height="6000" fill="#4CC22C"/><path id="gline" d="" fill="none" stroke="#2E8F1B" stroke-width="3" opacity=".55"/><g id="actors"></g></g>
<g id="card" opacity="0"></g>
<rect id="black" width="${W}" height="${H}" fill="#000" opacity="0"/>
</svg>
<script>
const SH=${JSON.stringify(SHOTS)}, B=${B}, M0=${M0};
const NS='http://www.w3.org/2000/svg', $=(id)=>document.getElementById(id);
const BOX={};
function measure(id){ if(BOX[id]) return BOX[id]; const s=document.createElementNS(NS,'use'); s.setAttribute('href','#'+id); $('actors').appendChild(s); const b=s.getBBox(); s.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// a paper party cone for a pigeon, the same red as the game's Party Hat
function cone(x,y,h,rot){ const w=h*0.62; return '<g transform="translate('+x+' '+y+') rotate('+rot+')"><path d="M'+(-w/2)+' 0 L0 '+(-h)+' L'+(w/2)+' 0 Z" fill="#F0634F" stroke="#5B3D32" stroke-width="'+(h*0.07)+'" stroke-linejoin="round"/>'
  +'<circle cx="'+(-w*0.12)+'" cy="'+(-h*0.35)+'" r="'+(h*0.07)+'" fill="#FFE27A"/><circle cx="'+(w*0.14)+'" cy="'+(-h*0.18)+'" r="'+(h*0.06)+'" fill="#FFE27A"/><circle cy="'+(-h-h*0.08)+'" r="'+(h*0.12)+'" fill="#FFE27A" stroke="#5B3D32" stroke-width="'+(h*0.05)+'"/></g>'; }
function actor(id, cx, feet, hh, rot, dy, extra){ const b=measure(id), k=hh/b[3], w=b[2]*k, x=cx-w/2, y=feet-hh;
  return '<ellipse cx="'+cx+'" cy="'+(feet-2)+'" rx="'+(w*0.4)+'" ry="'+(hh*0.035)+'" fill="#1F5E12" opacity="'+(0.22*(1-Math.min(1,Math.abs(dy)/120)))+'"/>'
   +'<g transform="rotate('+rot+' '+cx+' '+feet+') translate(0 '+dy+')"><g transform="translate('+x+' '+y+') scale('+k+') translate('+(-b[0])+' '+(-b[1])+')"><use href="#'+id+'"/></g>'+(extra||'')+'</g>'; }
function shotAt(t){ let s=SH[0]; for(const q of SH) if(q.t0<=t+1e-6) s=q; return s; }
window.frame=function(t){
  const s=shotAt(t), lt=t-s.t0, beat=Math.max(0,t-M0)/B, ph=beat%1;
  $('black').setAttribute('opacity', s.bg==='black'?1:0);
  $('bg').setAttribute('fill', s.bg==='white'?'#FFFFFF':'#7DD6DA');
  $('ground').setAttribute('opacity', s.bg==='white'?0:1); $('gline').setAttribute('opacity', s.bg==='white'?0:.55);
  if(s.bg==='black'){ return; }
  const gy=s.ground||1240; $('ground').setAttribute('y',gy); $('gline').setAttribute('d','M-4000 '+gy+'H5000');
  let html='';
  // the pigeons: a head-bob on every beat (a pecking dip in the white void), a little cone each
  (s.pg||[]).forEach((p,i)=>{ const [x,fy,hh,f,hat]=p; let dy=0, rot=0;
    if(s.peck){ const pk=(i===0?0.55:1.05); const d=Math.max(0,1-Math.abs(t-pk)/0.18); rot=f>0?-18*d:18*d; }
    else { const q=(beat+i*0.5)%1; dy=-Math.max(0,Math.sin(q*Math.PI))*hh*0.06; rot=(q<0.5?-1:1)*3*(f>0?1:-1); }
    if(s.hop){ const hp=Math.min(1,lt/B); dy-=Math.sin(hp*Math.PI)*hh*0.9; }
    const id=f>0?'pgR':'pgL', b=measure(id), k=hh/b[3], w=b[2]*k;
    const headX=x+(f>0?w*0.25:-w*0.25), headY=fy-hh*0.86;
    html+=actor(id,x,fy,hh,rot,dy, hat?cone(headX,headY,hh*0.42,f>0?-12:12):'');
  });
  // the dog: stands up and sways on the beat, a small bounce on every beat; jumps on the hop shot
  if(s.dog){ const [x,fy,hh,fc]=s.dog; let rot=Math.sin(beat*Math.PI)*5, dy=-Math.abs(Math.sin(beat*Math.PI))*hh*0.03;
    if(s.hop){ const hp=Math.min(1,lt/B); dy-=Math.sin(hp*Math.PI)*hh*0.45; }
    if(s.end) { rot=Math.sin(beat*Math.PI)*4; }
    html+=actor(fc==='right'?'dogR':'dogL',x,fy,hh,rot,dy,'');
    if(s.tag==='face'){ const b=measure(fc==='right'?'dogR':'dogL'), k=hh/b[3]; window.__face=[x+(fc==='right'?1:-1)*b[2]*k*0.18, fy-hh*0.78]; }
  }
  $('actors').innerHTML=html;
  // the camera: hard cuts only (no moves), like the reference; a tiny creep inside the close-ups
  let [sc,cx,cy]=s.cam||[1,540,960]; if(s.tag==='face'&&window.__face){ cx=window.__face[0]; cy=window.__face[1]; } sc*=1+lt*0.02;
  $('world').setAttribute('transform','translate('+(540-cx*sc)+' '+(960-cy*sc)+') scale('+sc+')');
  $('card').setAttribute('opacity', s.end?Math.min(1,lt/0.25):0);
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html);
  await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  // the end card: the logo, the line and the link, in the game's handwriting, on a cream sticker over the flat scene
  await p.evaluate(() => {
    const c = document.getElementById('card');
    c.innerHTML = '<rect x="110" y="300" width="860" height="420" rx="40" fill="#FFF8EC" stroke="#5B3D32" stroke-width="6" filter="url(#sh)" transform="rotate(-2 540 510)"/>'
      + '<g transform="rotate(-2 540 510)"><path d="M210 455 Q540 430 870 455 L860 500 Q540 480 220 500Z" fill="#F28FA5" opacity=".45"/>'
      + '<text x="390" y="470" font-family="Caveat" font-weight="700" font-size="150" fill="#5B3D32" text-anchor="middle" transform="rotate(-3 390 470)">Doodle</text>'
      + '<text x="720" y="478" font-family="Caveat" font-weight="700" font-size="150" fill="#5B3D32" text-anchor="middle" transform="rotate(2 720 478)">Doggo</text>'
      + '<text x="540" y="580" font-family="Caveat" font-weight="600" font-size="60" fill="#8A7468" text-anchor="middle">a free cozy dog game</text>'
      + '<text x="540" y="665" font-family="Caveat" font-weight="700" font-size="58" fill="#5B3D32" text-anchor="middle">play right on doodledoggo.app</text></g>';
  });
  const key = process.env.ONLY === 'stills';
  const KEYS = [0.6, 1.5, ...SHOTS.slice(2).map((s) => s.t0 + 0.2), T - 0.5];
  const list = key ? KEYS.map((t) => Math.round(t * FPS)) : [...Array(N).keys()].filter((f) => !FR || (f >= +FR[1] && f < +FR[2]));
  const t0 = Date.now();
  for (const f of list) { await p.evaluate((t) => window.frame(t), f / FPS); await p.screenshot({ path: path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`) }); }
  console.log(`${list.length} frames in ${Math.round((Date.now() - t0) / 1000)}s`);

  // ---- the designed cover (1080 x 1920; everything inside the grid's middle 1080 x 1440): the dog and the pigeons, the title, the logo ----
  await p.evaluate((t) => window.frame(t), SHOTS[2].t0 + B * 0.5);
  await p.evaluate(() => {
    const c = document.getElementById('card'); c.setAttribute('opacity', 1);
    c.innerHTML = '<g transform="rotate(-3 540 420)"><rect x="180" y="300" width="720" height="210" rx="34" fill="#FFF8EC" stroke="#5B3D32" stroke-width="6" filter="url(#sh)"/>'
      + '<path d="M240 420 Q540 400 840 420 L832 458 Q540 440 248 458Z" fill="#F28FA5" opacity=".45"/>'
      + '<text x="540" y="445" font-family="Caveat" font-weight="700" font-size="140" fill="#5B3D32" text-anchor="middle">party time.</text></g>'
      + '<rect x="250" y="1500" width="580" height="110" rx="55" fill="#FFE3A1" stroke="#5B3D32" stroke-width="5" transform="rotate(-2 540 1555)"/>'
      + '<g transform="rotate(-2 540 1555)"><text x="395" y="1576" font-family="Caveat" font-weight="700" font-size="72" fill="#5B3D32" text-anchor="middle">Doodle</text><text x="650" y="1580" font-family="Caveat" font-weight="700" font-size="72" fill="#5B3D32" text-anchor="middle">Doggo</text></g>';
  });
  await p.screenshot({ path: path.join(WORK, 'party-cover.png') });
  await b.close();
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'party-cover.png'), '-q:v', '2', path.join(WORK, 'party-cover.jpg')]);
  if (key) return;

  // ---- sound: the game's own "play" music from the black flash on (quiet void before it), pigeon coos, a little bark on the hop, a sparkle at the logo ----
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const r = await ap.evaluate(async ([secs, logo]) => { const res = await window.PawAudio._render({ seconds: secs, wav: true, vols: { master: 0.9, music: 0.75, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'play', time: 'day', weather: 'sunny' } }], stingers: [{ at: logo, name: 'sparkle' }] }); return res.wav; }, [T - M0 + 0.4, LOGO - M0]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r, 'base64')); await ab.close();
  const SR = 44100, len = Math.ceil(T * SR), pcm = new Float32Array(len);
  const add = (at, dur, fn) => { const s0 = Math.round(at * SR); for (let i = 0; i < dur * SR && s0 + i < len; i++) pcm[s0 + i] += fn(i / SR); };
  const coo = (at) => add(at, 0.55, (tt) => { const f = 330 - 60 * tt + 25 * Math.sin(tt * 38); return 0.22 * Math.sin(2 * Math.PI * f * tt) * Math.sin(Math.PI * Math.min(1, tt / 0.55)) * (0.6 + 0.4 * Math.sin(tt * 52)); });
  coo(0.25); coo(0.85);
  let ph = 0; add(SHOTS[11].t0 + 0.05, 0.22, (tt) => { ph += 2 * Math.PI * (520 - 900 * tt) / SR; return 0.32 * Math.sin(ph) * Math.exp(-14 * tt) * (1 + 0.3 * Math.sin(tt * 2200)); }); // a small yip
  const wav = Buffer.alloc(44 + len * 2); wav.write('RIFF', 0); wav.writeUInt32LE(36 + len * 2, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++) wav.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(pcm[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(path.join(WORK, 'fx.wav'), wav);
  const D = Math.round(M0 * 1000);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), '-i', path.join(WORK, 'fx.wav'),
    '-filter_complex', `[1:a]adelay=${D}|${D},afade=t=out:st=${(T - 0.6).toFixed(2)}:d=0.6[m];[m][2:a]amix=inputs=2:normalize=0,atrim=0:${T.toFixed(2)}[a]`, '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', T.toFixed(2), path.join(WORK, 'doodle-doggo-party-reel.mp4')]);
  console.log('wrote', path.join(WORK, 'doodle-doggo-party-reel.mp4'), T.toFixed(2) + 's');
})().catch((e) => { console.error(e); process.exit(1); });
