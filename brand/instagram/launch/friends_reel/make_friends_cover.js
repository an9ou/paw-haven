// v2.19 Friends launch Reel: its own cover (owner, 2 Nov 2026: "designed in an attractive way, not the first second of the Reel").
// The game's own art: the autumn yard, Noodle the dachshund and Waffles the Corgi nose to nose under a pink heart, Honey the Golden puppy in her party hat,
// the hook card "4 ways your dog can make friends", a "(no chat)" sticker and a "new: Friends in Doodle Doggo" pill. Everything that matters sits in the
// middle 1080 x 1440, so the profile grid's 3:4 crop keeps it. No black or white dog (owner, 1 Nov 2026). Every box text ink-centred and checked.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/make_friends_cover.js <game checkout> <outdir>
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS } = require('../centre_text.js');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || '.'); fs.mkdirSync(OUT, { recursive: true });
const W = 1080, H = 1920, PEN = '#5B3D32', PINK = '#F28FA5', YEL = '#FFE3A1';

const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(DEV, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(DEV, 'world', f), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(DEV, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
const PA = win.PawArt, inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const DOGS = {
  noodle: inner(PA.dog('dachs', { anim: false, pose: 'happy', facing: 'right' })), // Noodle, the Reel's narrator
  waffles: inner(PA.dog('corgi', { anim: false, pose: 'happy', facing: 'left' })),
  honey: inner(PA.dog('golden', { anim: false, pose: 'sit', facing: 'left', age: 'puppy', outfit: { head: 'Party Hat' } })),
};
// the yard by day in autumn, cropped to the fence and the lawn, no words in it
const scene = `<symbol id="sc" viewBox="330 0 337.5 600" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', { time: 'day', weather: 'sunny', season: 'autumn' })).replace(/<text\b[\s\S]*?<\/text>/g, '')}</symbol>`;
const heart = (x, y, s, rot, op) => `<path transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s})" d="M0 12 C-14 0 -26 -6 -26 -18 C-26 -30 -12 -34 0 -22 C12 -34 26 -30 26 -18 C26 -6 14 0 0 12 Z" fill="${PINK}" stroke="${PEN}" stroke-width="${3 / s}" stroke-linejoin="round" opacity="${op || 1}"/>`;

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>html,body{margin:0}svg{display:block}.pa-dog *{animation:none!important}[class$="-hl"]{display:none}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${scene}
${Object.keys(DOGS).map((k) => `<symbol id="${k}" overflow="visible">${DOGS[k]}</symbol>`).join('')}</defs>
<use href="#sc" width="${W}" height="${H}"/><rect width="${W}" height="${H}" fill="#FFF8EC" opacity=".18"/><g id="dogs"></g><g id="top"></g></svg>
<script>
${CENTRE_JS}
const NS='http://www.w3.org/2000/svg', FAM='Caveat', C=(l,x,y)=>centred(l,x,y,FAM);
function box(id){ const u=document.createElementNS(NS,'use'); u.setAttribute('href','#'+id); document.getElementById('dogs').appendChild(u); const b=u.getBBox(); u.remove(); return b; }
// a dog by its drawn box: centre x, feet y, height on screen; a soft shadow under the feet
function dog(id,cx,feet,hh){ const b=box(id), s=hh/b.height, w=b.width*s;
  return '<ellipse cx="'+cx+'" cy="'+(feet-4)+'" rx="'+(w*0.36)+'" ry="18" fill="${PEN}" opacity=".16"/><g transform="translate('+(cx-w/2)+' '+(feet-hh)+') scale('+s+') translate('+(-b.x)+' '+(-b.y)+')"><use href="#'+id+'"/></g>'; }
window.draw=function(){
  document.getElementById('dogs').innerHTML = dog('noodle',330,1450,250) + dog('waffles',740,1450,370) + dog('honey',975,1600,225)
    + '${heart(545, 1150, 2.2, -4)}${heart(440, 1065, 1.0, -18, 0.85)}${heart(650, 1060, 0.85, 16, 0.85)}${heart(160, 1060, 0.8, -10, 0.7)}${heart(950, 1210, 0.8, 12, 0.7)}';
  document.getElementById('top').innerHTML =
    '<g transform="rotate(-2 540 470)"><rect x="66" y="278" width="948" height="384" rx="40" fill="${PEN}" opacity=".14" transform="translate(10 14)"/>'
    + '<g data-box><rect x="66" y="278" width="948" height="384" rx="40" fill="#FFFDF7" stroke="${PEN}" stroke-width="8"/>'+C([{s:'4 ways your dog',size:112,pitch:132},{s:'can make friends',size:112}],540,470).svg+'</g>'
    + '<path d="M230 600 Q540 580 850 600" fill="none" stroke="${PINK}" stroke-width="14" stroke-linecap="round" opacity=".55"/></g>'
    + '<g transform="rotate(6 800 720)">'+pill('(no chat)',800,720,78,FAM,{fill:'${YEL}',padX:34})+'</g>'
    + '<g transform="rotate(-1.5 470 1630)">'+pill('new: Friends in Doodle Doggo',470,1630,62,FAM,{fill:'#FFFDF7',padX:38})+'</g>';
  return centreCheck(document.getElementById('sv'));
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const page = path.join(OUT, 'cover_page.html'); fs.writeFileSync(page, html); await p.goto('file://' + page); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all(['600 40px Caveat', '700 40px Caveat'].map((f) => document.fonts.load(f))));
  const off = await p.evaluate(() => window.draw()); if (off.length) throw new Error('text not centred: ' + off.join('; '));
  const png = path.join(OUT, 'friends-cover.png'); await p.screenshot({ path: png }); await b.close(); fs.rmSync(page);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-q:v', '2', path.join(OUT, 'friends-cover.jpg')]); fs.rmSync(png);
  console.log('wrote', path.join(OUT, 'friends-cover.jpg'));
})().catch((e) => { console.error(e); process.exit(1); });
