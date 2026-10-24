// TapTap International key art (owner, 24 Oct 2026): the logo and the most chosen dogs on sketchbook paper, no other text.
//   NODE_PATH=$(npm root -g) node brand/taptap/make_keyart.js   -> brand/taptap/keyart-1920x1080@2x.png (3840x2160)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..');
const DOGS = [['samoyed', 'hearts'], ['collie', null], ['golden', 'hearts'], ['dachs', null], ['pug', null], ['shiba', 'hearts'], ['corgi', null]]; // no faces that draw words (yum!, blep, ta-da!): TapTap allows only the title
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent('<!doctype html><body></body>'); await p.addScriptTag({ path: path.join(root, 'dogs', 'pawart_dogs.js') });
  const svgs = await p.evaluate((dogs) => dogs.map(([k, e]) => { const A = window.PawArt; const pose = e ? (['happy', 'sit', 'stand', 'idle'].find((q) => A.exprOk(e, q)) || 'sit') : 'happy'; return A.dog(k, e ? { pose, expr: e } : { pose }); }), DOGS);
  const logo = `data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(path.join(root, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '')).toString('base64')}`;
  const pos = [[60, 500, 330, -4], [340, 590, 310, 3], [600, 520, 330, -2], [860, 610, 360, 2], [1170, 540, 300, -3], [1420, 600, 290, 2], [1640, 520, 270, -2]];
  const dogs = DOGS.map((d, i) => `<div class="dog" style="left:${pos[i][0]}px;top:${pos[i][1]}px;width:${pos[i][2]}px;--r:${pos[i][3]}deg">${svgs[i]}</div>`).join('');
  const html = `<!doctype html><style>
    html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
    body{background:radial-gradient(#E3D2BA 1.6px,transparent 2.2px) 0 0/34px 34px,#FFFBF3;position:relative}
    .frame{position:absolute;inset:22px;border:6px solid #5B3D32;border-radius:52px 40px 58px 36px}
    .sun{position:absolute;right:170px;top:90px;width:150px;height:150px;border-radius:50%;background:#FFE3A1;border:5px solid #5B3D32}
    .fuji{position:absolute;left:1180px;top:250px;width:0;height:0;border-left:260px solid transparent;border-right:260px solid transparent;border-bottom:260px solid #CBE0F4;filter:drop-shadow(0 0 0 #5B3D32)}
    .cap{position:absolute;left:1352px;top:250px;width:0;height:0;border-left:88px solid transparent;border-right:88px solid transparent;border-bottom:88px solid #fff}
    .hill{position:absolute;left:-60px;right:-60px;top:700px;height:520px;background:#C8E9CF;border-top:6px solid #5B3D32;border-radius:50% 50% 0 0/120px 120px 0 0}
    .logo{position:absolute;left:90px;top:70px;width:980px}
    .dog{position:absolute;transform:rotate(var(--r))}
    .dog svg{width:100%;height:auto;display:block;overflow:visible}
    .tape{position:absolute;width:210px;height:56px;opacity:.85}
    .heart{position:absolute;font-size:64px;color:#F28CA6}
  </style><div class="sun"></div><svg class="mt" viewBox="0 0 640 300" style="position:absolute;left:1100px;top:250px;width:640px"><path d="M10 290 L250 40 Q320 10 390 40 L630 290 Z" fill="#CBE0F4" stroke="#5B3D32" stroke-width="6" stroke-linejoin="round"/><path d="M250 40 Q320 10 390 40 L440 92 L400 80 L370 104 L330 78 L292 106 L262 80 L200 92 Z" fill="#fff" stroke="#5B3D32" stroke-width="5" stroke-linejoin="round"/></svg><div class="hill"></div><div class="frame"></div>
  <img class="logo" src="${logo}">${dogs}
  <div class="tape" style="left:4px;top:34px;background:#F9D0D9;transform:rotate(-28deg)"></div><div class="tape" style="right:4px;top:34px;background:#BFE3D2;transform:rotate(26deg)"></div>`;
  const q = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await q.setContent(html); await q.waitForTimeout(400);
  await q.screenshot({ path: path.join(__dirname, 'keyart-1920x1080@2x.png') });
  await b.close(); console.log('wrote brand/taptap/keyart-1920x1080@2x.png');
})();
