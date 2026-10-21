// itch.io dev log cover for v2.12 – v2.13.3: new dogs wearing their new faces on sketchbook paper, under the logo.
//   NODE_PATH=$(npm root -g) node brand/itch/v213/make_devlog_cover.js
// Writes brand/itch/v213/devlog-cover-630x500@2x.png (the post's cover) and devlog-banner-1200x630.png (wide, for sharing).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..', '..'), out = __dirname;
const b64 = (f) => fs.readFileSync(path.join(root, f)).toString('base64');
const DOGS = [['dobie', 'wink'], ['lab', 'yum'], ['pitbull', 'hearts'], ['chow', 'pout'], ['westie', 'curious'], ['yorkie', 'blep'], ['shihtzu', 'sleepy'], ['malamute', 'wow']];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent('<!doctype html><body></body>'); await p.addScriptTag({ path: path.join(root, 'dogs', 'pawart_dogs.js') });
  const svgs = await p.evaluate((dogs) => dogs.map(([k, e]) => { const A = window.PawArt; const pose = ['sit', 'happy', 'idle', 'stand'].find((q) => A.exprOk(e, q)) || 'sit'; return A.dog(k, { pose, expr: e }); }), DOGS);
  const font = `@font-face{font-family:Caveat;font-weight:500 700;src:url(data:font/woff2;base64,${b64('site/fonts/caveat.woff2')}) format('woff2')}
    @font-face{font-family:'Patrick Hand';src:url(data:font/woff2;base64,${b64('site/fonts/patrick-hand.woff2')}) format('woff2')}`;
  const logo = `data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(path.join(root, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '')).toString('base64')}`;
  const FACE = { wink: 'Wink', yum: 'Yum', hearts: 'Heart eyes', pout: 'Pout', curious: 'Curious', blep: 'Blep', sleepy: 'Sleepy', wow: 'Wow' };
  const cell = (i) => `<figure style="--r:${[-3, 2, -1.5, 3, -2, 1.5, -2.5, 2][i]}deg"><div class="d">${svgs[i]}</div><figcaption>${FACE[DOGS[i][1]]}</figcaption></figure>`;
  const page = (W, H, wide) => `<!doctype html><style>${font}
    html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
    body{background:radial-gradient(#E3D2BA 1.4px,transparent 1.9px) 0 0/28px 28px,#FFFBF3;color:#5B3D32;font-family:Caveat,cursive;position:relative}
    .frame{position:absolute;inset:14px;border:4px solid #5B3D32;border-radius:34px 26px 38px 24px}
    .logo{position:absolute;${wide ? 'left:40px;top:110px;width:440px' : 'left:50%;transform:translateX(-50%);top:34px;width:640px'}}
    h1{position:absolute;${wide ? 'left:40px;width:440px;top:260px;font-size:70px;line-height:1.1' : 'left:0;right:0;top:226px;font-size:76px;line-height:1'};margin:0;text-align:center;font-weight:700}
    h1 span{background:linear-gradient(transparent 62%,#F9D0D9 62%,#F9D0D9 88%,transparent 88%);padding:0 10px}
    .grid{position:absolute;${wide ? 'left:500px;right:40px;top:100px' : 'left:46px;right:46px;top:330px'};display:grid;grid-template-columns:repeat(4,1fr);gap:10px 14px}
    figure{margin:0;transform:rotate(var(--r));text-align:center}
    .d svg{width:100%;height:auto;display:block}
    figcaption{display:inline-block;margin-top:-6px;font-size:${wide ? 28 : 36}px;white-space:nowrap;font-weight:700;background:#FFE3A1;border:3px solid #5B3D32;border-radius:14px 10px 15px 9px;padding:0 12px 2px}
    figure:nth-child(4n+2) figcaption{background:#C8E9CF} figure:nth-child(4n+3) figcaption{background:#CBE0F4} figure:nth-child(4n+4) figcaption{background:#F9D0D9}
    .foot{position:absolute;${wide ? 'left:40px;width:440px;top:450px;font-size:28px' : 'left:0;right:0;bottom:38px;font-size:34px'};text-align:center;font-family:'Patrick Hand',sans-serif}
    .tape{position:absolute;width:150px;height:40px;opacity:.85}
  </style><div class="frame"></div><img class="logo" src="${logo}">
  <h1>${wide ? '<span>14 new dogs</span><br><span>14 new faces</span>' : '<span>14 new dogs · 14 new faces</span>'}</h1>
  <div class="grid">${DOGS.map((_, i) => cell(i)).join('')}</div>
  <div class="foot">v2.12 – v2.13 · play free at doodledoggo.app</div>
  <div class="tape" style="left:6px;top:20px;background:#F9D0D9;transform:rotate(-28deg)"></div><div class="tape" style="right:6px;top:20px;background:#BFE3D2;transform:rotate(26deg)"></div>`;
  for (const [W, H, wide, file] of [[1260, 1000, false, 'devlog-cover-630x500@2x.png'], [1200, 630, true, 'devlog-banner-1200x630.png']]) {
    const q = await b.newPage({ viewport: { width: W, height: H } });
    await q.setContent(page(W, H, wide)); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(300);
    await q.screenshot({ path: path.join(out, file) }); console.log('wrote brand/itch/v213/' + file);
  }
  await b.close();
})();
